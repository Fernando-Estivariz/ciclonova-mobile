import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Dimensions,
    Animated,
    BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const RouteNavigationScreen = ({ route, navigation }) => {
    // Recibir datos de la ruta seleccionada
    const { routeData } = route.params;
    
    // Estados para la navegación
    const [isNavigating, setIsNavigating] = useState(true);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [userPath, setUserPath] = useState([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distance, setDistance] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [routeName, setRouteName] = useState(routeData ? `Copia de ${routeData.name}` : 'Mi ruta');
    const [routeRating, setRouteRating] = useState(0);
    const [routeNote, setRouteNote] = useState('');
    
    // Referencias
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    
    // Animaciones
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Iniciar seguimiento de ubicación
        startLocationTracking();
        
        // Iniciar temporizador
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedTime(elapsed);
        }, 1000);
        
        // Animación de pulso para el indicador de navegación
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
        
        // Animación de entrada para el panel de información
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
        
        // Manejar el botón de retroceso
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isNavigating) {
                handlePauseNavigation();
                return true;
            }
            return false;
        });
        
        return () => {
            // Limpiar al desmontar
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            backHandler.remove();
        };
    }, [isNavigating]);

    // Iniciar seguimiento de ubicación
    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para la navegación');
                navigation.goBack();
                return;
            }
            
            // Obtener ubicación inicial
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });
            
            const initialLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };
            
            setCurrentLocation(initialLocation);
            setUserPath([{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }]);
            
            // Centrar mapa en ubicación inicial
            if (mapRef.current) {
                mapRef.current.animateToRegion(initialLocation, 1000);
            }
            
            // Suscribirse a actualizaciones de ubicación
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    distanceInterval: 10, // Actualizar cada 10 metros
                    timeInterval: 5000, // O cada 5 segundos
                },
                (newLocation) => {
                    const { latitude, longitude, speed: currentSpeed } = newLocation.coords;
                    
                    // Actualizar ubicación actual
                    setCurrentLocation(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                    }));
                    
                    // Actualizar ruta del usuario
                    setUserPath(prevPath => {
                        const newPath = [...prevPath, { latitude, longitude }];
                        
                        // Calcular distancia recorrida
                        if (prevPath.length > 0) {
                            const lastPoint = prevPath[prevPath.length - 1];
                            const segmentDistance = calculateDistance(
                                lastPoint.latitude, lastPoint.longitude,
                                latitude, longitude
                            );
                            setDistance(prev => prev + segmentDistance);
                        }
                        
                        return newPath;
                    });
                    
                    // Actualizar velocidad (convertir de m/s a km/h)
                    setSpeed(currentSpeed ? (currentSpeed * 3.6).toFixed(1) : 0);
                    
                    // Centrar mapa en la ubicación actual si está en modo seguimiento
                    if (mapRef.current && isNavigating) {
                        mapRef.current.animateToRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }, 1000);
                    }
                }
            );
        } catch (error) {
            console.error('Error al iniciar seguimiento:', error);
            Alert.alert('Error', 'No se pudo iniciar el seguimiento de ubicación');
        }
    };

    // Calcular distancia entre dos puntos (fórmula de Haversine)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Formatear tiempo transcurrido
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Pausar navegación
    const handlePauseNavigation = () => {
        Alert.alert(
            'Navegación en curso',
            '¿Qué deseas hacer?',
            [
                { text: 'Continuar', style: 'cancel' },
                { text: 'Finalizar', onPress: () => setShowFinishModal(true) },
                { text: 'Cancelar ruta', style: 'destructive', onPress: handleCancelRoute }
            ]
        );
    };

    // Cancelar ruta
    const handleCancelRoute = () => {
        Alert.alert(
            'Cancelar ruta',
            '¿Estás seguro de que quieres cancelar la navegación? Puedes guardar tu progreso.',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Sí, cancelar', 
                    style: 'destructive', 
                    onPress: () => {
                        setIsNavigating(false);
                        setShowSaveModal(true);
                    }
                }
            ]
        );
    };

    // Finalizar ruta
    const handleFinishRoute = () => {
        setIsNavigating(false);
        setShowFinishModal(false);
        setShowSaveModal(true);
    };

    // Guardar ruta completada
    const handleSaveRoute = async () => {
        try {
            if (routeName.trim() === '') {
                Alert.alert('Error', 'Por favor ingresa un nombre para la ruta');
                return;
            }
            
            // Crear objeto de ruta completada
            const completedRoute = {
                id: Date.now(),
                name: routeName,
                distance: `${distance.toFixed(2)} km`,
                duration: `${Math.floor(elapsedTime / 60)} min`,
                difficulty: distance > 20 ? 'Difícil' : distance > 10 ? 'Moderada' : 'Fácil',
                elevation: `${Math.round(distance * 15)} m`,
                type: routeData ? routeData.type : 'Personalizada',
                rating: routeRating,
                completed: true,
                color: '#22c55e',
                coordinates: userPath,
                note: routeNote,
                createdAt: new Date().toISOString().split('T')[0],
            };
            
            // Guardar en AsyncStorage
            const existingRoutes = await AsyncStorage.getItem('savedRoutes');
            const routes = existingRoutes ? JSON.parse(existingRoutes) : [];
            routes.push(completedRoute);
            await AsyncStorage.setItem('savedRoutes', JSON.stringify(routes));
            
            // Mostrar confirmación y volver a la pantalla anterior
            Alert.alert(
                '¡Ruta guardada!',
                'Tu ruta ha sido guardada exitosamente.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error al guardar ruta:', error);
            Alert.alert('Error', 'No se pudo guardar la ruta');
        }
    };

    // No guardar y volver
    const handleDiscardRoute = () => {
        Alert.alert(
            'Descartar ruta',
            '¿Estás seguro de que no quieres guardar esta ruta?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí, descartar', style: 'destructive', onPress: () => navigation.goBack() }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#22c55e" />
            
            {/* Mapa de navegación */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={currentLocation || {
                    latitude: 4.6097,
                    longitude: -74.0817,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                followsUserLocation={isNavigating}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                rotateEnabled={true}
                zoomEnabled={true}
            >
                {/* Ruta original si existe */}
                {routeData && routeData.coordinates && (
                    <Polyline
                        coordinates={routeData.coordinates}
                        strokeColor="#3b82f6"
                        strokeWidth={5}
                        lineDashPattern={[1, 3]}
                    />
                )}
                
                {/* Ruta actual del usuario */}
                {userPath.length > 1 && (
                    <Polyline
                        coordinates={userPath}
                        strokeColor="#22c55e"
                        strokeWidth={5}
                    />
                )}
                
                {/* Marcador de inicio */}
                {userPath.length > 0 && (
                    <Marker
                        coordinate={userPath[0]}
                        title="Inicio"
                        pinColor="#22c55e"
                    >
                        <Ionicons name="flag" size={24} color="#22c55e" />
                    </Marker>
                )}
                
                {/* Marcador de destino si existe */}
                {routeData && routeData.coordinates && (
                    <Marker
                        coordinate={routeData.coordinates[routeData.coordinates.length - 1]}
                        title="Destino"
                        pinColor="#ef4444"
                    >
                        <Ionicons name="flag-outline" size={24} color="#ef4444" />
                    </Marker>
                )}
            </MapView>
            
            {/* Header con botón de retroceso */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handlePauseNavigation}
                >
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {routeData ? routeData.name : 'Navegación'}
                </Text>
                <View style={{ width: 40 }} />
            </View>
            
            {/* Panel de información */}
            <Animated.View 
                style={[
                    styles.infoPanel,
                    { transform: [{ translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [200, 0]
                    })}] }
                ]}
            >
                <LinearGradient
                    colors={['rgba(34, 197, 94, 0.9)', 'rgba(22, 163, 74, 0.95)']}
                    style={styles.infoPanelGradient}
                >
                    {/* Indicador de navegación activa */}
                    {isNavigating && (
                        <View style={styles.navigationIndicator}>
                            <Animated.View 
                                style={[
                                    styles.pulseCircle,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            />
                            <Text style={styles.navigationText}>Navegación activa</Text>
                        </View>
                    )}
                    
                    {/* Estadísticas de navegación */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                            <Text style={styles.statLabel}>Tiempo</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
                            <Text style={styles.statLabel}>Distancia</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{speed} km/h</Text>
                            <Text style={styles.statLabel}>Velocidad</Text>
                        </View>
                    </View>
                    
                    {/* Botones de acción */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.finishButton]}
                            onPress={() => setShowFinishModal(true)}
                        >
                            <Ionicons name="flag-outline" size={24} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Finalizar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleCancelRoute}
                        >
                            <Ionicons name="close-outline" size={24} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>
            
            {/* Modal de confirmación de finalización */}
            <Modal
                visible={showFinishModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowFinishModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>¿Finalizar navegación?</Text>
                        <Text style={styles.modalText}>
                            Has recorrido {distance.toFixed(2)} km en {formatTime(elapsedTime)}.
                        </Text>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowFinishModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Continuar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalConfirmButton]}
                                onPress={handleFinishRoute}
                            >
                                <Text style={styles.modalConfirmText}>Finalizar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Modal para guardar ruta */}
            <Modal
                visible={showSaveModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSaveModal(false)}
            >
                <View style={styles.saveModalOverlay}>
                    <View style={styles.saveModalContainer}>
                        <Text style={styles.saveModalTitle}>Guardar ruta</Text>
                        
                        <View style={styles.saveModalContent}>
                            <Text style={styles.saveModalLabel}>Nombre de la ruta</Text>
                            <TextInput
                                style={styles.saveModalInput}
                                value={routeName}
                                onChangeText={setRouteName}
                                placeholder="Ingresa un nombre para tu ruta"
                            />
                            
                            <Text style={styles.saveModalLabel}>Calificación</Text>
                            <View style={styles.ratingContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRouteRating(star)}
                                    >
                                        <Ionicons
                                            name={star <= routeRating ? "star" : "star-outline"}
                                            size={32}
                                            color="#f59e0b"
                                            style={styles.starIcon}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <Text style={styles.saveModalLabel}>Nota (opcional)</Text>
                            <TextInput
                                style={[styles.saveModalInput, styles.saveModalTextArea]}
                                value={routeNote}
                                onChangeText={setRouteNote}
                                placeholder="Agrega una nota sobre esta ruta"
                                multiline={true}
                                numberOfLines={4}
                            />
                            
                            <View style={styles.saveModalStats}>
                                <Text style={styles.saveModalStatText}>
                                    Distancia: {distance.toFixed(2)} km
                                </Text>
                                <Text style={styles.saveModalStatText}>
                                    Tiempo: {formatTime(elapsedTime)}
                                </Text>
                                <Text style={styles.saveModalStatText}>
                                    Velocidad promedio: {(distance / (elapsedTime / 3600)).toFixed(1)} km/h
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.saveModalButtons}>
                            <TouchableOpacity 
                                style={[styles.saveModalButton, styles.discardButton]}
                                onPress={handleDiscardRoute}
                            >
                                <Text style={styles.discardButtonText}>No guardar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.saveModalButton, styles.saveButton]}
                                onPress={handleSaveRoute}
                            >
                                <Text style={styles.saveButtonText}>Guardar ruta</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    infoPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    infoPanelGradient: {
        padding: 20,
        paddingBottom: 36,
    },
    navigationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    pulseCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ffffff',
        marginRight: 8,
    },
    navigationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 8,
    },
    finishButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    cancelButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: width * 0.85,
        maxWidth: 400,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 8,
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#f3f4f6',
    },
    modalConfirmButton: {
        backgroundColor: '#22c55e',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    saveModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    saveModalContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    saveModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    saveModalContent: {
        marginBottom: 24,
    },
    saveModalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    saveModalInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 16,
    },
    saveModalTextArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    starIcon: {
        marginHorizontal: 4,
    },
    saveModalStats: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
    },
    saveModalStatText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    saveModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveModalButton: {
        paddingVertical: 16,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    discardButton: {
        backgroundColor: '#f3f4f6',
    },
    saveButton: {
        backgroundColor: '#22c55e',
    },
    discardButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default RouteNavigationScreen;