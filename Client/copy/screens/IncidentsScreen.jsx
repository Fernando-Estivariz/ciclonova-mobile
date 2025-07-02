import React, { useState, useRef } from 'react';
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
    Alert,
    Modal,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import BottomTabMenu from '../components/BottomTabMenu';

const { width, height } = Dimensions.get('window');

const IncidentsScreen = ({ navigation }) => {
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [searchText, setSearchText] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);

    // Estados para el formulario de reporte
    const [selectedCategory, setSelectedCategory] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [location, setLocation] = useState({
        latitude: 4.6097,
        longitude: -74.0817,
        address: ''
    });
    const [markerLocation, setMarkerLocation] = useState(null);
    const mapRef = useRef(null);

    // Categorías de incidentes para el reporte
    const incidentCategories = [
        { id: 'obstaculo', name: 'Obstáculo', icon: 'warning', color: '#f59e0b', description: 'Árbol caído, escombros, etc.' },
        { id: 'accidente', name: 'Accidente', icon: 'medical', color: '#ef4444', description: 'Accidente de tránsito o lesión' },
        { id: 'robo', name: 'Robo/Asalto', icon: 'shield', color: '#8b5cf6', description: 'Situación de inseguridad' },
        { id: 'infraestructura', name: 'Infraestructura', icon: 'construct', color: '#3b82f6', description: 'Baches, señalización dañada' },
        { id: 'otro', name: 'Otro', icon: 'ellipsis-horizontal', color: '#6b7280', description: 'Otro tipo de incidente' },
    ];

    // Categorías de filtro
    const categories = [
        { name: 'Todos', icon: 'grid-outline', color: '#6b7280' },
        { name: 'Obstáculos', icon: 'warning-outline', color: '#f59e0b' },
        { name: 'Accidentes', icon: 'medical-outline', color: '#ef4444' },
        { name: 'Robos', icon: 'shield-outline', color: '#8b5cf6' },
        { name: 'Infraestructura', icon: 'construct-outline', color: '#3b82f6' },
    ];

    // Tipos de emergencia rápida
    const emergencyTypes = [
        {
            title: 'Accidente',
            subtitle: 'Necesito ayuda médica',
            icon: 'medical',
            color: '#ef4444',
            bgColor: '#fef2f2',
        },
        {
            title: 'Robo/Asalto',
            subtitle: 'Situación de seguridad',
            icon: 'shield',
            color: '#8b5cf6',
            bgColor: '#f3f4f6',
        },
        {
            title: 'Obstáculo',
            subtitle: 'Bloqueo en ciclovía',
            icon: 'warning',
            color: '#f59e0b',
            bgColor: '#fffbeb',
        },
        {
            title: 'Daño Vial',
            subtitle: 'Infraestructura dañada',
            icon: 'construct',
            color: '#3b82f6',
            bgColor: '#eff6ff',
        },
    ];

    // Incidentes recientes (datos de ejemplo)
    const recentIncidents = [
        {
            id: 1,
            type: 'Obstáculo',
            title: 'Árbol caído en Av. Principal',
            location: 'Av. Principal, km 2.5',
            time: 'Hace 15 min',
            status: 'Activo',
            severity: 'Alta',
            reports: 12,
            icon: 'warning',
            color: '#f59e0b',
        },
        {
            id: 2,
            type: 'Accidente',
            title: 'Ciclista herido en intersección',
            location: 'Calle 45 con Carrera 12',
            time: 'Hace 32 min',
            status: 'Atendido',
            severity: 'Crítica',
            reports: 8,
            icon: 'medical',
            color: '#ef4444',
        },
        {
            id: 3,
            type: 'Infraestructura',
            title: 'Bache grande en ciclovía',
            location: 'Parque Central, entrada norte',
            time: 'Hace 1 hora',
            status: 'Reportado',
            severity: 'Media',
            reports: 5,
            icon: 'construct',
            color: '#3b82f6',
        },
    ];

    // Función para solicitar permisos de cámara
    const requestCameraPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos acceso a la cámara para tomar fotos del incidente.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    // Función para solicitar permisos de galería
    const requestMediaLibraryPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos acceso a la galería para seleccionar fotos.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    // Función para solicitar permisos de ubicación
    const requestLocationPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos acceso a la ubicación para marcar el lugar del incidente.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    // Función para obtener dirección desde coordenadas
    const getAddressFromCoordinates = async (latitude, longitude) => {
        try {
            const addressResponse = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (addressResponse && addressResponse.length > 0) {
                const addr = addressResponse[0];
                return `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
            }
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        } catch (error) {
            console.error('Error al obtener dirección:', error);
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
    };

    const handleEmergencyPress = (type) => {
        Alert.alert(
            '🚨 Emergencia',
            `¿Confirmas que necesitas ayuda por ${type.title.toLowerCase()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Ayuda en camino', 'Se ha enviado tu ubicación a servicios de emergencia');
                    }
                },
            ]
        );
    };

    const openReportModal = () => {
        setShowReportModal(true);
        setCurrentStep(1);
        setSelectedCategory('');
        setDescription('');
        setSelectedPhoto(null);
        setLocation({ latitude: 4.6097, longitude: -74.0817, address: '' });
        setMarkerLocation(null);
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setCurrentStep(1);
        setSelectedCategory('');
        setDescription('');
        setSelectedPhoto(null);
        setLocation({ latitude: 4.6097, longitude: -74.0817, address: '' });
        setMarkerLocation(null);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category.id);
        setCurrentStep(2);
    };

    // Función REAL para tomar foto con la cámara
    const handleTakePhoto = async () => {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedPhoto(result.assets[0].uri);
                setCurrentStep(4);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo acceder a la cámara. Inténtalo de nuevo.');
            console.error('Error al tomar foto:', error);
        }
    };

    // Función REAL para seleccionar foto de la galería
    const handleSelectPhoto = async () => {
        const hasPermission = await requestMediaLibraryPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedPhoto(result.assets[0].uri);
                setCurrentStep(4);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo acceder a la galería. Inténtalo de nuevo.');
            console.error('Error al seleccionar foto:', error);
        }
    };

    // Función REAL para obtener ubicación actual
    const handleGetCurrentLocation = async () => {
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) return;

        try {
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = currentLocation.coords;
            const address = await getAddressFromCoordinates(latitude, longitude);

            setLocation({ latitude, longitude, address });
            setMarkerLocation({ latitude, longitude });

            // Animar el mapa a la nueva ubicación
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }

            Alert.alert('Ubicación obtenida', 'Se ha marcado tu ubicación actual correctamente.');
        } catch (error) {
            Alert.alert('Error', 'No se pudo obtener la ubicación. Verifica que el GPS esté activado.');
            console.error('Error al obtener ubicación:', error);
        }
    };

    // Función para manejar toque en el mapa
    const handleMapPress = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const address = await getAddressFromCoordinates(latitude, longitude);

        setLocation({ latitude, longitude, address });
        setMarkerLocation({ latitude, longitude });
    };

    const handleSubmitReport = () => {
        if (!selectedCategory || !description.trim()) {
            Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
            return;
        }

        if (!markerLocation) {
            Alert.alert('Error', 'Por favor marca la ubicación del incidente en el mapa');
            return;
        }

        // Aquí enviarías los datos a tu backend
        const reportData = {
            category: selectedCategory,
            description: description.trim(),
            photo: selectedPhoto,
            location: {
                latitude: markerLocation.latitude,
                longitude: markerLocation.longitude,
                address: location.address,
            },
            timestamp: new Date().toISOString(),
        };

        console.log('Datos del reporte:', reportData);

        Alert.alert(
            'Reporte Enviado',
            'Tu reporte ha sido enviado exitosamente. Las autoridades han sido notificadas.',
            [{ text: 'OK', onPress: closeReportModal }]
        );
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Crítica': return '#ef4444';
            case 'Alta': return '#f59e0b';
            case 'Media': return '#3b82f6';
            case 'Baja': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Activo': return '#ef4444';
            case 'Atendido': return '#22c55e';
            case 'Reportado': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const handleTabPress = (tabName) => {
        console.log('Tab pressed:', tabName);
    };

    const renderReportStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Selecciona el tipo de incidente</Text>
                        <ScrollView style={styles.categoriesContainer}>
                            {incidentCategories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryOption,
                                        selectedCategory === category.id && styles.selectedCategoryOption
                                    ]}
                                    onPress={() => handleCategorySelect(category)}
                                >
                                    <View style={[styles.categoryOptionIcon, { backgroundColor: category.color }]}>
                                        <Ionicons name={category.icon} size={24} color="#ffffff" />
                                    </View>
                                    <View style={styles.categoryOptionInfo}>
                                        <Text style={styles.categoryOptionName}>{category.name}</Text>
                                        <Text style={styles.categoryOptionDescription}>{category.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Describe el incidente</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            placeholder="Describe brevemente lo que está ocurriendo..."
                            placeholderTextColor="#9ca3af"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <View style={styles.stepButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Atrás</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, !description.trim() && styles.disabledButton]}
                                onPress={nextStep}
                                disabled={!description.trim()}
                            >
                                <Text style={styles.primaryButtonText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Agregar evidencia</Text>
                        <Text style={styles.stepSubtitle}>Toma una foto del incidente (opcional)</Text>

                        {selectedPhoto ? (
                            <View style={styles.photoContainer}>
                                <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => setSelectedPhoto(null)}
                                >
                                    <Ionicons name="close" size={20} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoOptions}>
                                <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
                                    <Ionicons name="camera" size={32} color="#3b82f6" />
                                    <Text style={styles.photoOptionText}>Tomar Foto</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.photoOption} onPress={handleSelectPhoto}>
                                    <Ionicons name="images" size={32} color="#22c55e" />
                                    <Text style={styles.photoOptionText}>Seleccionar de Galería</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.stepButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Atrás</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                                <Text style={styles.primaryButtonText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Ubicación del incidente</Text>
                        <Text style={styles.stepSubtitle}>Toca en el mapa para marcar la ubicación exacta</Text>

                        {/* MAPA REAL INTERACTIVO */}
                        <View style={styles.mapContainer}>
                            <MapView
                                ref={mapRef}
                                style={styles.map}
                                initialRegion={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onPress={handleMapPress}
                                showsUserLocation={true}
                                showsMyLocationButton={false}
                            >
                                {markerLocation && (
                                    <Marker
                                        coordinate={markerLocation}
                                        title="Ubicación del incidente"
                                        description={location.address}
                                    >
                                        <View style={styles.customMarker}>
                                            <Ionicons name="warning" size={20} color="#ffffff" />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>

                            {/* Botón para obtener ubicación actual */}
                            <TouchableOpacity
                                style={styles.currentLocationButton}
                                onPress={handleGetCurrentLocation}
                            >
                                <Ionicons name="locate" size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {/* Información de ubicación seleccionada */}
                        {location.address ? (
                            <View style={styles.locationInfo}>
                                <Ionicons name="location" size={16} color="#ef4444" />
                                <Text style={styles.locationText}>{location.address}</Text>
                            </View>
                        ) : (
                            <View style={styles.locationHint}>
                                <Ionicons name="information-circle" size={16} color="#6b7280" />
                                <Text style={styles.locationHintText}>
                                    Toca en el mapa para marcar la ubicación del incidente
                                </Text>
                            </View>
                        )}

                        <View style={styles.stepButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Atrás</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, !markerLocation && styles.disabledButton]}
                                onPress={handleSubmitReport}
                                disabled={!markerLocation}
                            >
                                <Text style={styles.submitButtonText}>Enviar Reporte</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>🚨 Centro de Incidentes</Text>
                            <Text style={styles.subtitle}>Reporta y mantente seguro</Text>
                        </View>
                        <TouchableOpacity style={styles.sosButton}>
                            <Ionicons name="call" size={20} color="#ffffff" />
                            <Text style={styles.sosText}>SOS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Barra de búsqueda */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar incidentes..."
                            placeholderTextColor="#9ca3af"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="funnel-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Botones de emergencia rápida */}
                <View style={styles.emergencySection}>
                    <Text style={styles.sectionTitle}>🚨 Emergencia Rápida</Text>
                    <View style={styles.emergencyGrid}>
                        {emergencyTypes.map((type, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.emergencyCard, { backgroundColor: type.bgColor }]}
                                onPress={() => handleEmergencyPress(type)}
                            >
                                <View style={[styles.emergencyIcon, { backgroundColor: type.color }]}>
                                    <Ionicons name={type.icon} size={24} color="#ffffff" />
                                </View>
                                <Text style={styles.emergencyTitle}>{type.title}</Text>
                                <Text style={styles.emergencySubtitle}>{type.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Estadísticas rápidas */}
                <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="warning" size={24} color="#f59e0b" />
                            <Text style={styles.statNumber}>23</Text>
                            <Text style={styles.statLabel}>Activos</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                            <Text style={styles.statNumber}>156</Text>
                            <Text style={styles.statLabel}>Resueltos</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="time" size={24} color="#3b82f6" />
                            <Text style={styles.statNumber}>8 min</Text>
                            <Text style={styles.statLabel}>Resp. Promedio</Text>
                        </View>
                    </View>
                </View>

                {/* Filtros por categoría */}
                <View style={styles.categoriesSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.name}
                                style={[
                                    styles.categoryChip,
                                    activeCategory === category.name && styles.activeCategoryChip,
                                ]}
                                onPress={() => setActiveCategory(category.name)}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={18}
                                    color={activeCategory === category.name ? '#ffffff' : category.color}
                                    style={styles.categoryIcon}
                                />
                                <Text
                                    style={[
                                        styles.categoryText,
                                        activeCategory === category.name && styles.activeCategoryText,
                                    ]}
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Lista de incidentes recientes */}
                <View style={styles.incidentsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Incidentes Recientes</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Ver mapa</Text>
                        </TouchableOpacity>
                    </View>

                    {recentIncidents.map((incident) => (
                        <TouchableOpacity key={incident.id} style={styles.incidentCard}>
                            <View style={styles.incidentHeader}>
                                <View style={[styles.incidentIcon, { backgroundColor: incident.color + '20' }]}>
                                    <Ionicons name={incident.icon} size={20} color={incident.color} />
                                </View>
                                <View style={styles.incidentInfo}>
                                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                                    <Text style={styles.incidentLocation}>{incident.location}</Text>
                                </View>
                                <View style={styles.incidentMeta}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(incident.status) }]}>
                                            {incident.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.incidentDetails}>
                                <View style={styles.incidentStat}>
                                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                                    <Text style={styles.incidentStatText}>{incident.time}</Text>
                                </View>
                                <View style={styles.incidentStat}>
                                    <Ionicons name="people-outline" size={14} color="#6b7280" />
                                    <Text style={styles.incidentStatText}>{incident.reports} reportes</Text>
                                </View>
                                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) + '20' }]}>
                                    <Text style={[styles.severityText, { color: getSeverityColor(incident.severity) }]}>
                                        {incident.severity}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.incidentActions}>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="location-outline" size={16} color="#3b82f6" />
                                    <Text style={styles.actionBtnText}>Ver ubicación</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Ionicons name="add-outline" size={16} color="#f59e0b" />
                                    <Text style={styles.actionBtnText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Botón flotante para reportar */}
            <TouchableOpacity style={styles.reportButton} onPress={openReportModal}>
                <Ionicons name="add" size={28} color="#ffffff" />
            </TouchableOpacity>

            {/* Modal de reporte con funcionalidad completa */}
            <Modal
                visible={showReportModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeReportModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeReportModal}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Reportar Incidente</Text>
                        <View style={styles.stepIndicator}>
                            <Text style={styles.stepText}>{currentStep}/4</Text>
                        </View>
                    </View>

                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {renderReportStep()}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <BottomTabMenu activeTab="Incidentes" onTabPress={handleTabPress} />
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
    sosButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sosText: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 12,
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
    emergencySection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    emergencyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    emergencyCard: {
        width: (width - 60) / 2,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emergencyIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    emergencySubtitle: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
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
    categoriesSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoryChip: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    activeCategoryChip: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    categoryIcon: {
        marginRight: 6,
    },
    categoryText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeCategoryText: {
        color: '#ffffff',
    },
    incidentsSection: {
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
        color: '#ef4444',
        fontWeight: '600',
    },
    incidentCard: {
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
    incidentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    incidentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    incidentInfo: {
        flex: 1,
    },
    incidentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    incidentLocation: {
        fontSize: 14,
        color: '#6b7280',
    },
    incidentMeta: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    incidentDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    incidentStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    incidentStatText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    severityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    incidentActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginLeft: 4,
    },
    reportButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: '#ef4444',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
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
    stepIndicator: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stepText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 20,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ef4444',
        borderRadius: 2,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
    },
    categoriesContainer: {
        flex: 1,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCategoryOption: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    categoryOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    categoryOptionInfo: {
        flex: 1,
    },
    categoryOptionName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    categoryOptionDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    descriptionInput: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 120,
        marginBottom: 24,
    },
    photoOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    photoOption: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        width: (width - 80) / 2,
    },
    photoOptionText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    selectedPhoto: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ef4444',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        position: 'relative',
        marginBottom: 16,
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    map: {
        flex: 1,
    },
    customMarker: {
        backgroundColor: '#ef4444',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    currentLocationButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#22c55e',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    locationText: {
        fontSize: 14,
        color: '#1f2937',
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    locationHint: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 24,
    },
    locationHintText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
        flex: 1,
    },
    stepButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: 24,
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
    },
    secondaryButtonText: {
        color: '#6b7280',
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
    },
    submitButton: {
        backgroundColor: '#22c55e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 100,
    },
});

export default IncidentsScreen;