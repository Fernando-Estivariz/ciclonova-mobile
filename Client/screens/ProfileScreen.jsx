import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Animated,
    TextInput,
    Modal,
    Alert,
    Share,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabMenu from '../components/BottomTabMenu';

const { width, height } = Dimensions.get('window');

const RoutesScreen = ({ navigation }) => {
    const [activeFilter, setActiveFilter] = useState('Todas');
    const [searchText, setSearchText] = useState('');
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isCreatingRoute, setIsCreatingRoute] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [newRouteName, setNewRouteName] = useState('');
    const [routeType, setRouteType] = useState('Recreativa');
    
    const mapHeight = useRef(new Animated.Value(200)).current;
    const mapRef = useRef(null);

    // Datos de ejemplo para rutas (se combinarán con las guardadas)
    const defaultRoutes = [
        {
            id: 1,
            name: 'Ruta del Parque Central',
            distance: '12.5 km',
            duration: '45 min',
            difficulty: 'Fácil',
            elevation: '120 m',
            type: 'Recreativa',
            rating: 4.8,
            completed: true,
            color: '#22c55e',
            coordinates: [
                { latitude: 4.6097, longitude: -74.0817 },
                { latitude: 4.6150, longitude: -74.0750 },
                { latitude: 4.6200, longitude: -74.0700 },
            ],
            createdAt: '2024-01-10',
        },
        {
            id: 2,
            name: 'Circuito Montañoso',
            distance: '28.3 km',
            duration: '1h 20min',
            difficulty: 'Difícil',
            elevation: '450 m',
            type: 'Deportiva',
            rating: 4.9,
            completed: false,
            color: '#ef4444',
            coordinates: [
                { latitude: 4.6500, longitude: -74.0500 },
                { latitude: 4.6600, longitude: -74.0400 },
                { latitude: 4.6700, longitude: -74.0300 },
            ],
            createdAt: '2024-01-08',
        },
    ];

    // Notificaciones de ejemplo
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Nueva ruta disponible',
            message: 'Se ha agregado una nueva ruta en tu zona',
            time: '5 min',
            read: false,
            type: 'route',
        },
        {
            id: 2,
            title: 'Reto completado',
            message: '¡Felicidades! Has completado el reto semanal',
            time: '1h',
            read: false,
            type: 'achievement',
        },
        {
            id: 3,
            title: 'Mantenimiento de bicicleta',
            message: 'Es hora de revisar tu bicicleta',
            time: '2h',
            read: true,
            type: 'maintenance',
        },
    ]);

    const filters = ['Todas', 'Completadas', 'Pendientes', 'Favoritas', 'Mis Rutas'];
    const routeTypes = ['Recreativa', 'Deportiva', 'Turística', 'Urbana', 'Montaña'];

    const [stats, setStats] = useState([
        { label: 'Total KM', value: '156.8', icon: 'speedometer-outline', color: '#22c55e' },
        { label: 'Rutas', value: '12', icon: 'map-outline', color: '#3b82f6' },
        { label: 'Tiempo', value: '8h 45m', icon: 'time-outline', color: '#f59e0b' },
        { label: 'Elevación', value: '1,240m', icon: 'trending-up-outline', color: '#8b5cf6' },
    ]);

    useEffect(() => {
        requestLocationPermission();
        loadSavedRoutes();
    }, []);

    // Solicitar permisos de ubicación
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            } else {
                Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para mostrar el mapa');
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    // Cargar rutas guardadas
    const loadSavedRoutes = async () => {
        try {
            const saved = await AsyncStorage.getItem('savedRoutes');
            if (saved) {
                const parsedRoutes = JSON.parse(saved);
                setSavedRoutes([...defaultRoutes, ...parsedRoutes]);
            } else {
                setSavedRoutes(defaultRoutes);
            }
        } catch (error) {
            console.error('Error loading routes:', error);
            setSavedRoutes(defaultRoutes);
        }
    };

    // Guardar ruta
    const saveRoute = async (route) => {
        try {
            const existingRoutes = await AsyncStorage.getItem('savedRoutes');
            const routes = existingRoutes ? JSON.parse(existingRoutes) : [];
            const newRoute = {
                ...route,
                id: Date.now(),
                createdAt: new Date().toISOString().split('T')[0],
            };
            routes.push(newRoute);
            await AsyncStorage.setItem('savedRoutes', JSON.stringify(routes));
            setSavedRoutes([...defaultRoutes, ...routes]);
            return true;
        } catch (error) {
            console.error('Error saving route:', error);
            return false;
        }
    };

    // Alternar tamaño del mapa
    const toggleMapSize = () => {
        const newHeight = isMapExpanded ? 200 : 400;
        setIsMapExpanded(!isMapExpanded);

        Animated.spring(mapHeight, {
            toValue: newHeight,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start();
    };

    // FUNCIÓN DIRECTA PARA INICIAR NAVEGACIÓN
    const goToNavigation = (routeData = null) => {
        console.log('=== INICIANDO NAVEGACIÓN ===');
        console.log('Navigation object:', navigation);
        console.log('Route data:', routeData);
        
        if (!navigation) {
            console.log('ERROR: Navigation object is null');
            Alert.alert('Error', 'Navegación no disponible');
            return;
        }

        try {
            let finalRouteData = routeData;
            
            // Si no hay datos de ruta, crear navegación libre
            if (!finalRouteData) {
                if (!currentLocation) {
                    Alert.alert('Error', 'No se pudo obtener tu ubicación');
                    return;
                }
                
                finalRouteData = {
                    id: 'free-navigation-' + Date.now(),
                    name: 'Navegación Libre',
                    distance: '0 km',
                    duration: '0 min',
                    difficulty: 'Libre',
                    elevation: '0 m',
                    type: 'Libre',
                    rating: 0,
                    completed: false,
                    color: '#22c55e',
                    coordinates: [{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                    }],
                    startLocation: currentLocation,
                    createdAt: new Date().toISOString().split('T')[0],
                };
            }
            
            console.log('Final route data:', finalRouteData);
            console.log('Navigating to RouteNavigation...');
            
            navigation.navigate('RouteNavigationScreen', {
                routeData: finalRouteData
            });
            
            console.log('Navigation call completed');
            
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Error al navegar: ' + error.message);
        }
    };

    // Iniciar ruta existente
    const startRoute = (route) => {
        console.log('Starting existing route:', route.name);
        goToNavigation(route);
    };

    // Manejar el botón principal
    const handleMainButton = () => {
        console.log('=== MAIN BUTTON PRESSED ===');
        console.log('isCreatingRoute:', isCreatingRoute);
        console.log('routeCoordinates length:', routeCoordinates.length);
        
        if (isCreatingRoute) {
            // Modo finalizar ruta
            if (routeCoordinates.length >= 2) {
                // Tiene suficientes puntos, pedir nombre y guardar
                Alert.prompt(
                    'Nombre de la Ruta',
                    `Ruta con ${routeCoordinates.length} puntos.\n\nIngresa un nombre:`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Guardar e Iniciar',
                            onPress: async (name) => {
                                if (name && name.trim()) {
                                    const distance = calculateDistance(routeCoordinates);
                                    const newRoute = {
                                        name: name.trim(),
                                        distance: `${distance.toFixed(1)} km`,
                                        duration: `${Math.round(distance * 3)} min`,
                                        difficulty: distance > 20 ? 'Difícil' : distance > 10 ? 'Moderada' : 'Fácil',
                                        elevation: `${Math.round(distance * 15)} m`,
                                        type: routeType,
                                        rating: 0,
                                        completed: false,
                                        color: getRandomColor(),
                                        coordinates: routeCoordinates,
                                    };

                                    const saved = await saveRoute(newRoute);
                                    if (saved) {
                                        setIsCreatingRoute(false);
                                        setRouteCoordinates([]);
                                        updateStats();
                                        
                                        // Iniciar navegación inmediatamente
                                        goToNavigation(newRoute);
                                    } else {
                                        Alert.alert('Error', 'No se pudo guardar la ruta');
                                    }
                                } else {
                                    Alert.alert('Error', 'Ingresa un nombre válido');
                                }
                            }
                        }
                    ],
                    'plain-text'
                );
            } else {
                // No tiene suficientes puntos, ofrecer navegación libre
                Alert.alert(
                    'Ruta Incompleta',
                    `Solo tienes ${routeCoordinates.length} punto(s). ¿Qué deseas hacer?`,
                    [
                        { text: 'Continuar Trazando', style: 'cancel' },
                        { 
                            text: 'Navegación Libre', 
                            onPress: () => {
                                setIsCreatingRoute(false);
                                setRouteCoordinates([]);
                                goToNavigation(); // Sin parámetros = navegación libre
                            }
                        },
                        {
                            text: 'Cancelar',
                            style: 'destructive',
                            onPress: () => {
                                setIsCreatingRoute(false);
                                setRouteCoordinates([]);
                            }
                        }
                    ]
                );
            }
        } else {
            // Modo crear nueva ruta
            Alert.alert(
                'Crear Nueva Ruta',
                'Elige una opción:',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                        text: 'Trazar en Mapa', 
                        onPress: () => {
                            console.log('Starting map tracing mode');
                            setIsCreatingRoute(true);
                            setRouteCoordinates([]);
                            setSelectedRoute(null);
                        }
                    },
                    { 
                        text: 'Navegación Libre', 
                        onPress: () => {
                            console.log('Starting free navigation');
                            goToNavigation(); // Sin parámetros = navegación libre
                        }
                    }
                ]
            );
        }
    };

    // Manejar toque en el mapa
    const handleMapPress = (event) => {
        if (isCreatingRoute) {
            const newCoordinate = event.nativeEvent.coordinate;
            const newCoordinates = [...routeCoordinates, newCoordinate];
            setRouteCoordinates(newCoordinates);
            
            console.log('Point added, total points:', newCoordinates.length);
        }
    };

    // Cancelar creación de ruta
    const cancelRouteCreation = () => {
        Alert.alert(
            'Cancelar Creación',
            `¿Cancelar? Se perderán ${routeCoordinates.length} puntos.`,
            [
                { text: 'Continuar Trazando', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: () => {
                        setIsCreatingRoute(false);
                        setRouteCoordinates([]);
                    }
                }
            ]
        );
    };

    // Calcular distancia aproximada
    const calculateDistance = (coordinates) => {
        if (coordinates.length < 2) return 0;
        
        let distance = 0;
        for (let i = 1; i < coordinates.length; i++) {
            const prev = coordinates[i - 1];
            const curr = coordinates[i];
            
            // Fórmula de Haversine simplificada
            const R = 6371; // Radio de la Tierra en km
            const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
            const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance += R * c;
        }
        return distance;
    };

    // Obtener color aleatorio
    const getRandomColor = () => {
        const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Actualizar estadísticas
    const updateStats = () => {
        const totalRoutes = savedRoutes.length;
        const completedRoutes = savedRoutes.filter(r => r.completed).length;
        const totalDistance = savedRoutes.reduce((sum, route) => {
            return sum + parseFloat(route.distance.replace(' km', ''));
        }, 0);

        setStats([
            { label: 'Total KM', value: totalDistance.toFixed(1), icon: 'speedometer-outline', color: '#22c55e' },
            { label: 'Rutas', value: totalRoutes.toString(), icon: 'map-outline', color: '#3b82f6' },
            { label: 'Completadas', value: completedRoutes.toString(), icon: 'checkmark-circle-outline', color: '#f59e0b' },
            { label: 'Creadas', value: (totalRoutes - defaultRoutes.length).toString(), icon: 'add-circle-outline', color: '#8b5cf6' },
        ]);
    };

    // Filtrar rutas
    const getFilteredRoutes = () => {
        let filtered = savedRoutes;

        if (searchText) {
            filtered = filtered.filter(route =>
                route.name.toLowerCase().includes(searchText.toLowerCase()) ||
                route.type.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        switch (activeFilter) {
            case 'Completadas':
                return filtered.filter(route => route.completed);
            case 'Pendientes':
                return filtered.filter(route => !route.completed);
            case 'Favoritas':
                return filtered.filter(route => route.rating >= 4.5);
            case 'Mis Rutas':
                return filtered.filter(route => !defaultRoutes.find(dr => dr.id === route.id));
            default:
                return filtered;
        }
    };

    // Manejar notificaciones
    const handleNotificationPress = () => {
        setShowNotifications(true);
    };

    const markNotificationAsRead = (notificationId) => {
        setNotifications(notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
        ));
    };

    // Compartir ruta
    const shareRoute = async (route) => {
        try {
            await Share.share({
                message: `¡Mira esta increíble ruta de ciclismo! 🚴‍♂️\n\n📍 ${route.name}\n📏 Distancia: ${route.distance}\n⏱️ Duración: ${route.duration}\n🏔️ Dificultad: ${route.difficulty}\n\n¡Descarga CicloNova y pedalea conmigo!`,
                title: `Ruta: ${route.name}`,
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo compartir la ruta');
        }
    };

    // Eliminar ruta
    const deleteRoute = (route) => {
        Alert.alert(
            'Eliminar Ruta',
            `¿Estás seguro de que quieres eliminar "${route.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const updatedRoutes = savedRoutes.filter(r => r.id !== route.id);
                            const customRoutes = updatedRoutes.filter(r => !defaultRoutes.find(dr => dr.id === r.id));
                            await AsyncStorage.setItem('savedRoutes', JSON.stringify(customRoutes));
                            setSavedRoutes(updatedRoutes);
                            Alert.alert('Eliminada', 'La ruta ha sido eliminada');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la ruta');
                        }
                    }
                }
            ]
        );
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Fácil': return '#22c55e';
            case 'Moderada': return '#f59e0b';
            case 'Difícil': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const handleTabPress = (tabName) => {
        console.log('Tab pressed:', tabName);
    };

    const unreadNotifications = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>¡Hola ciclista! 🚴‍♂️</Text>
                            <Text style={styles.subtitle}>
                                {isCreatingRoute 
                                    ? `🎯 Modo Trazado - ${routeCoordinates.length} puntos` 
                                    : 'Descubre nuevas aventuras'
                                }
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
                            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
                            {unreadNotifications > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Barra de búsqueda */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={isCreatingRoute ? "Toca en el mapa para agregar puntos..." : "Buscar rutas..."}
                            placeholderTextColor="#9ca3af"
                            value={searchText}
                            onChangeText={setSearchText}
                            editable={!isCreatingRoute}
                        />
                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="options-outline" size={20} color="#22c55e" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mapa interactivo */}
                <View style={styles.mapSection}>
                    <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
                        {currentLocation ? (
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={currentLocation}
                                onPress={handleMapPress}
                                showsUserLocation={true}
                                showsMyLocationButton={false}
                            >
                                {/* Marcador de ubicación actual */}
                                <Marker
                                    coordinate={currentLocation}
                                    title="Tu ubicación"
                                    pinColor="#22c55e"
                                />

                                {/* Mostrar ruta seleccionada */}
                                {selectedRoute && selectedRoute.coordinates && !isCreatingRoute && (
                                    <>
                                        <Polyline
                                            coordinates={selectedRoute.coordinates}
                                            strokeColor={selectedRoute.color}
                                            strokeWidth={4}
                                        />
                                        {selectedRoute.coordinates.map((coord, index) => (
                                            <Marker
                                                key={index}
                                                coordinate={coord}
                                                pinColor={selectedRoute.color}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Mostrar ruta en creación */}
                                {isCreatingRoute && routeCoordinates.length > 0 && (
                                    <>
                                        <Polyline
                                            coordinates={routeCoordinates}
                                            strokeColor="#22c55e"
                                            strokeWidth={4}
                                            strokePattern={[5, 5]}
                                        />
                                        {routeCoordinates.map((coord, index) => (
                                            <Marker
                                                key={index}
                                                coordinate={coord}
                                                pinColor="#22c55e"
                                                title={`Punto ${index + 1}`}
                                            />
                                        ))}
                                    </>
                                )}
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Ionicons name="map" size={60} color="#22c55e" />
                                <Text style={styles.mapText}>Cargando Mapa...</Text>
                                <Text style={styles.mapSubtext}>Obteniendo tu ubicación</Text>
                            </View>
                        )}

                        {/* Controles del mapa */}
                        <View style={styles.mapControls}>
                            <TouchableOpacity style={styles.mapControlButton} onPress={toggleMapSize}>
                                <Ionicons
                                    name={isMapExpanded ? "contract-outline" : "expand-outline"}
                                    size={20}
                                    color="#ffffff"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.mapControlButton}
                                onPress={() => {
                                    if (mapRef.current && currentLocation) {
                                        mapRef.current.animateToRegion(currentLocation, 1000);
                                    }
                                }}
                            >
                                <Ionicons name="locate-outline" size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {/* Botón principal simplificado */}
                        <TouchableOpacity 
                            style={[styles.newRouteButton, isCreatingRoute && styles.newRouteButtonActive]}
                            onPress={handleMainButton}
                        >
                            <Ionicons 
                                name={isCreatingRoute ? "checkmark" : "add"} 
                                size={28} 
                                color="#ffffff" 
                            />
                        </TouchableOpacity>

                        {/* Botón cancelar creación */}
                        {isCreatingRoute && (
                            <TouchableOpacity 
                                style={styles.cancelRouteButton}
                                onPress={cancelRouteCreation}
                            >
                                <Ionicons name="close" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        )}

                        {/* Indicador de modo trazado */}
                        {isCreatingRoute && (
                            <View style={styles.tracingIndicator}>
                                <Text style={styles.tracingText}>🎯 Modo Trazado</Text>
                                <Text style={styles.tracingSubtext}>Puntos: {routeCoordinates.length}</Text>
                            </View>
                        )}
                    </Animated.View>
                </View>

                {/* Estadísticas rápidas */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                        {stats.map((stat, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.statCard, { borderLeftColor: stat.color }]}
                                onPress={() => Alert.alert(stat.label, `Total: ${stat.value}`)}
                            >
                                <Ionicons name={stat.icon} size={24} color={stat.color} />
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Filtros */}
                {!isCreatingRoute && (
                    <View style={styles.filtersSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {filters.map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        styles.filterChip,
                                        activeFilter === filter && styles.activeFilterChip,
                                    ]}
                                    onPress={() => setActiveFilter(filter)}
                                >
                                    <Text
                                        style={[
                                            styles.filterText,
                                            activeFilter === filter && styles.activeFilterText,
                                        ]}
                                    >
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Lista de rutas */}
                {!isCreatingRoute && (
                    <View style={styles.routesSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {activeFilter === 'Todas' ? 'Todas las Rutas' : activeFilter}
                            </Text>
                            <TouchableOpacity onPress={() => Alert.alert('Ver todas', 'Mostrando todas las rutas disponibles')}>
                                <Text style={styles.seeAllText}>Ver todas</Text>
                            </TouchableOpacity>
                        </View>

                        {getFilteredRoutes().map((route) => (
                            <TouchableOpacity 
                                key={route.id} 
                                style={styles.routeCard}
                                onPress={() => {
                                    setSelectedRoute(route);
                                    if (mapRef.current && route.coordinates && route.coordinates.length > 0) {
                                        mapRef.current.fitToCoordinates(route.coordinates, {
                                            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                                            animated: true,
                                        });
                                    }
                                }}
                            >
                                <View style={styles.routeHeader}>
                                    <View style={styles.routeInfo}>
                                        <Text style={styles.routeName}>{route.name}</Text>
                                        <View style={styles.routeType}>
                                            <Text style={styles.routeTypeText}>{route.type}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.routeStatus}>
                                        {route.completed && (
                                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                        )}
                                        <View style={styles.routeRating}>
                                            <Ionicons name="star" size={16} color="#f59e0b" />
                                            <Text style={styles.ratingText}>{route.rating}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.routeStats}>
                                    <View style={styles.routeStat}>
                                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                                        <Text style={styles.routeStatText}>{route.distance}</Text>
                                    </View>
                                    <View style={styles.routeStat}>
                                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                                        <Text style={styles.routeStatText}>{route.duration}</Text>
                                    </View>
                                    <View style={styles.routeStat}>
                                        <Ionicons name="trending-up-outline" size={16} color="#6b7280" />
                                        <Text style={styles.routeStatText}>{route.elevation}</Text>
                                    </View>
                                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(route.difficulty) + '20' }]}>
                                        <Text style={[styles.difficultyText, { color: getDifficultyColor(route.difficulty) }]}>
                                            {route.difficulty}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.routeActions}>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            startRoute(route);
                                        }}
                                    >
                                        <Ionicons name="play-outline" size={18} color="#22c55e" />
                                        <Text style={styles.actionButtonText}>Iniciar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            shareRoute(route);
                                        }}
                                    >
                                        <Ionicons name="share-outline" size={18} color="#6b7280" />
                                        <Text style={[styles.actionButtonText, { color: '#6b7280' }]}>Compartir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            deleteRoute(route);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {getFilteredRoutes().length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="map-outline" size={60} color="#9ca3af" />
                                <Text style={styles.emptyStateText}>No se encontraron rutas</Text>
                                <Text style={styles.emptyStateSubtext}>
                                    {searchText ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera ruta personalizada'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Modal de notificaciones */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotifications(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowNotifications(false)}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Notificaciones</Text>
                        <TouchableOpacity onPress={() => {
                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                        }}>
                            <Text style={styles.markAllReadText}>Marcar todas</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.notificationItem, !item.read && styles.unreadNotification]}
                                onPress={() => markNotificationAsRead(item.id)}
                            >
                                <View style={styles.notificationIcon}>
                                    <Ionicons
                                        name={
                                            item.type === 'route' ? 'map-outline' :
                                            item.type === 'achievement' ? 'trophy-outline' :
                                            'build-outline'
                                        }
                                        size={24}
                                        color={
                                            item.type === 'route' ? '#3b82f6' :
                                            item.type === 'achievement' ? '#f59e0b' :
                                            '#6b7280'
                                        }
                                    />
                                </View>
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>{item.title}</Text>
                                    <Text style={styles.notificationMessage}>{item.message}</Text>
                                    <Text style={styles.notificationTime}>{item.time}</Text>
                                </View>
                                {!item.read && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.notificationsList}
                    />
                </SafeAreaView>
            </Modal>

            <BottomTabMenu activeTab="Rutas" onTabPress={handleTabPress} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 4,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#1f2937',
    },
    filterButton: {
        padding: 8,
    },
    mapSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    mapContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    map: {
        flex: 1,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
    },
    mapText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 8,
    },
    mapSubtext: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    mapControls: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'column',
    },
    mapControlButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    newRouteButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#22c55e',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    newRouteButtonActive: {
        backgroundColor: '#16a34a',
    },
    cancelRouteButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: '#ef4444',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    tracingIndicator: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    tracingText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tracingSubtext: {
        color: '#ffffff',
        fontSize: 12,
        opacity: 0.9,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    statsScroll: {
        flexDirection: 'row',
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        minWidth: 100,
        alignItems: 'center',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    filtersSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterChip: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    activeFilterChip: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    filterText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#ffffff',
    },
    routesSection: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '600',
    },
    routeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    routeInfo: {
        flex: 1,
    },
    routeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    routeType: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    routeTypeText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    routeStatus: {
        alignItems: 'center',
    },
    routeRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    routeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    routeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    routeStatText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
    },
    routeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    markAllReadText: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '600',
    },
    notificationsList: {
        padding: 20,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    unreadNotification: {
        backgroundColor: '#ffffff',
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    bottomSpacing: {
        height: 100,
    },
});

export default RoutesScreen;