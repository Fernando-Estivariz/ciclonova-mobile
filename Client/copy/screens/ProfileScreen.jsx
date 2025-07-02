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
    Image,
    Modal,
    Alert,
    Switch,
    TextInput,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabMenu from '../components/BottomTabMenu';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showHeatMap, setShowHeatMap] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [privateProfile, setPrivateProfile] = useState(false);
    
    // Datos del usuario
    const [userProfile, setUserProfile] = useState({
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+57 300 123 4567',
        city: 'Bogotá, Colombia',
        joinDate: 'Enero 2023',
        avatar: null,
        bio: 'Apasionado del ciclismo de montaña y rutas urbanas. Siempre en busca de nuevas aventuras sobre dos ruedas. 🚴‍♂️',
        level: 'Ciclista Avanzado',
        achievements: 12,
    });

    // Estadísticas del usuario
    const [userStats, setUserStats] = useState({
        totalDistance: 1247.8,
        totalTime: '89h 32m',
        totalRoutes: 47,
        avgSpeed: 24.5,
        maxSpeed: 52.3,
        totalElevation: 15420,
        caloriesBurned: 28450,
        co2Saved: 156.2,
    });

    // Logros del usuario
    const [achievements, setAchievements] = useState([
        { id: 1, name: 'Primera Ruta', description: 'Completaste tu primera ruta', icon: 'trophy', color: '#f59e0b', unlocked: true },
        { id: 2, name: '100km Total', description: 'Recorriste 100km en total', icon: 'speedometer', color: '#22c55e', unlocked: true },
        { id: 3, name: 'Madrugador', description: 'Saliste antes de las 6 AM', icon: 'sunny', color: '#3b82f6', unlocked: true },
        { id: 4, name: 'Montañista', description: 'Subiste 1000m de elevación', icon: 'trending-up', color: '#8b5cf6', unlocked: true },
        { id: 5, name: '500km Total', description: 'Recorriste 500km en total', icon: 'bicycle', color: '#ef4444', unlocked: true },
        { id: 6, name: 'Explorador', description: 'Visitaste 10 ciudades diferentes', icon: 'map', color: '#06b6d4', unlocked: false },
        { id: 7, name: '1000km Total', description: 'Recorriste 1000km en total', icon: 'medal', color: '#f59e0b', unlocked: true },
        { id: 8, name: 'Velocista', description: 'Alcanzaste 50km/h', icon: 'flash', color: '#ef4444', unlocked: true },
    ]);

    // Datos para el mapa de calor (rutas frecuentes)
    const [heatmapData, setHeatmapData] = useState([
        { latitude: 4.6097, longitude: -74.0817, weight: 1 },
        { latitude: 4.6150, longitude: -74.0750, weight: 0.8 },
        { latitude: 4.6200, longitude: -74.0700, weight: 0.9 },
        { latitude: 4.6250, longitude: -74.0650, weight: 0.7 },
        { latitude: 4.6300, longitude: -74.0600, weight: 0.6 },
        { latitude: 4.6350, longitude: -74.0550, weight: 0.8 },
        { latitude: 4.6400, longitude: -74.0500, weight: 0.5 },
        { latitude: 4.6450, longitude: -74.0450, weight: 0.7 },
        { latitude: 4.6500, longitude: -74.0400, weight: 0.9 },
        { latitude: 4.6550, longitude: -74.0350, weight: 0.6 },
    ]);

    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('userProfile');
            if (userData) {
                setUserProfile({ ...userProfile, ...JSON.parse(userData) });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const saveUserData = async (data) => {
        try {
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            setUserProfile({ ...userProfile, ...data });
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    };
    // Manejo de eventos para editar perfil
    const handleEditProfile = () => {
        setShowEditProfile(true);
    };

    const handleSaveProfile = (newData) => {
        saveUserData(newData);
        setShowEditProfile(false);
        Alert.alert('Perfil Actualizado', 'Tus cambios han sido guardados');
    };

    const animatePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const handleTabPress = (tabName) => {
        console.log('Tab pressed:', tabName);
    };

    const getLevelProgress = () => {
        const totalKm = userStats.totalDistance;
        if (totalKm < 100) return { level: 'Principiante', progress: totalKm / 100, next: 100 };
        if (totalKm < 500) return { level: 'Intermedio', progress: (totalKm - 100) / 400, next: 500 };
        if (totalKm < 1000) return { level: 'Avanzado', progress: (totalKm - 500) / 500, next: 1000 };
        return { level: 'Experto', progress: 1, next: 'Max' };
    };

    const levelInfo = getLevelProgress();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.settingsButton}
                        onPress={() => setShowSettings(true)}
                    >
                        <Ionicons name="settings-outline" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleEditProfile}
                    >
                        <Ionicons name="create-outline" size={24} color="#22c55e" />
                    </TouchableOpacity>
                </View>

                {/* Perfil del Usuario */}
                <View style={styles.profileSection}>
                    <Animated.View style={[styles.avatarContainer, { transform: [{ scale: scaleAnim }] }]}>
                        <TouchableOpacity onPress={animatePress}>
                            {userProfile.avatar ? (
                                <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={60} color="#22c55e" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>LV.{Math.floor(userStats.totalDistance / 100) + 1}</Text>
                        </View>
                    </Animated.View>

                    <Text style={styles.userName}>{userProfile.name}</Text>
                    <Text style={styles.userLevel}>{levelInfo.level}</Text>
                    <Text style={styles.userBio}>{userProfile.bio}</Text>

                    {/* Barra de Progreso de Nivel */}
                    <View style={styles.levelProgressContainer}>
                        <View style={styles.levelProgressBar}>
                            <View style={[styles.levelProgress, { width: `${levelInfo.progress * 100}%` }]} />
                        </View>
                        <Text style={styles.levelProgressText}>
                            {levelInfo.next === 'Max' ? 'Nivel Máximo' : `${Math.round((1 - levelInfo.progress) * (levelInfo.next - (levelInfo.next === 100 ? 0 : levelInfo.next === 500 ? 100 : 500)))}km para siguiente nivel`}
                        </Text>
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={16} color="#6b7280" />
                            <Text style={styles.infoText}>{userProfile.city}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                            <Text style={styles.infoText}>Desde {userProfile.joinDate}</Text>
                        </View>
                    </View>
                </View>

                {/* Estadísticas Principales */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Estadísticas</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="speedometer-outline" size={32} color="#22c55e" />
                            <Text style={styles.statValue}>{userStats.totalDistance.toFixed(1)}</Text>
                            <Text style={styles.statLabel}>Kilómetros</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="time-outline" size={32} color="#3b82f6" />
                            <Text style={styles.statValue}>{userStats.totalTime}</Text>
                            <Text style={styles.statLabel}>Tiempo Total</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="map-outline" size={32} color="#f59e0b" />
                            <Text style={styles.statValue}>{userStats.totalRoutes}</Text>
                            <Text style={styles.statLabel}>Rutas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="trending-up-outline" size={32} color="#8b5cf6" />
                            <Text style={styles.statValue}>{userStats.totalElevation.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Elevación (m)</Text>
                        </View>
                    </View>
                </View>

                {/* Estadísticas Adicionales */}
                <View style={styles.additionalStats}>
                    <View style={styles.additionalStatItem}>
                        <Ionicons name="flash-outline" size={20} color="#ef4444" />
                        <Text style={styles.additionalStatLabel}>Velocidad Promedio</Text>
                        <Text style={styles.additionalStatValue}>{userStats.avgSpeed} km/h</Text>
                    </View>
                    <View style={styles.additionalStatItem}>
                        <Ionicons name="rocket-outline" size={20} color="#ef4444" />
                        <Text style={styles.additionalStatLabel}>Velocidad Máxima</Text>
                        <Text style={styles.additionalStatValue}>{userStats.maxSpeed} km/h</Text>
                    </View>
                    <View style={styles.additionalStatItem}>
                        <Ionicons name="flame-outline" size={20} color="#f59e0b" />
                        <Text style={styles.additionalStatLabel}>Calorías Quemadas</Text>
                        <Text style={styles.additionalStatValue}>{userStats.caloriesBurned.toLocaleString()}</Text>
                    </View>
                    <View style={styles.additionalStatItem}>
                        <Ionicons name="leaf-outline" size={20} color="#22c55e" />
                        <Text style={styles.additionalStatLabel}>CO₂ Ahorrado</Text>
                        <Text style={styles.additionalStatValue}>{userStats.co2Saved} kg</Text>
                    </View>
                </View>

                {/* Mapa de Calor */}
                <View style={styles.heatmapSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Zonas Frecuentes</Text>
                        <TouchableOpacity onPress={() => setShowHeatMap(true)}>
                            <Text style={styles.viewMoreText}>Ver completo</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.heatmapContainer}>
                        <MapView
                            style={styles.heatmap}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={{
                                latitude: 4.6350,
                                longitude: -74.0650,
                                latitudeDelta: 0.1,
                                longitudeDelta: 0.1,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <Heatmap
                                points={heatmapData}
                                radius={50}
                                opacity={0.8}
                                gradient={{
                                    colors: ['#22c55e', '#f59e0b', '#ef4444'],
                                    startPoints: [0.2, 0.5, 1.0],
                                }}
                            />
                        </MapView>
                        <TouchableOpacity 
                            style={styles.heatmapOverlay}
                            onPress={() => setShowHeatMap(true)}
                        >
                            <Ionicons name="expand-outline" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logros */}
                <View style={styles.achievementsSection}>
                    <Text style={styles.sectionTitle}>Logros ({achievements.filter(a => a.unlocked).length}/{achievements.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
                        {achievements.map((achievement) => (
                            <TouchableOpacity 
                                key={achievement.id} 
                                style={[
                                    styles.achievementCard,
                                    !achievement.unlocked && styles.achievementLocked
                                ]}
                                onPress={() => {
                                    Alert.alert(
                                        achievement.name,
                                        achievement.description,
                                        [{ text: 'Genial!' }]
                                    );
                                }}
                            >
                                <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? achievement.color + '20' : '#f3f4f6' }]}>
                                    <Ionicons 
                                        name={achievement.icon} 
                                        size={24} 
                                        color={achievement.unlocked ? achievement.color : '#9ca3af'} 
                                    />
                                </View>
                                <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>
                                    {achievement.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Modal de Configuración */}
            <Modal
                visible={showSettings}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSettings(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowSettings(false)}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Configuración</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.settingsContent}>
                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsTitle}>Cuenta</Text>
                            <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
                                <Ionicons name="person-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Editar Perfil</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingItem}>
                                <Ionicons name="shield-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Privacidad</Text>
                                <Switch
                                    value={privateProfile}
                                    onValueChange={setPrivateProfile}
                                    trackColor={{ false: '#f3f4f6', true: '#22c55e' }}
                                    thumbColor={privateProfile ? '#ffffff' : '#ffffff'}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsTitle}>Notificaciones</Text>
                            <View style={styles.settingItem}>
                                <Ionicons name="notifications-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Notificaciones Push</Text>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#f3f4f6', true: '#22c55e' }}
                                    thumbColor={notifications ? '#ffffff' : '#ffffff'}
                                />
                            </View>
                        </View>

                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsTitle}>Apariencia</Text>
                            <View style={styles.settingItem}>
                                <Ionicons name="moon-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Modo Oscuro</Text>
                                <Switch
                                    value={darkMode}
                                    onValueChange={setDarkMode}
                                    trackColor={{ false: '#f3f4f6', true: '#22c55e' }}
                                    thumbColor={darkMode ? '#ffffff' : '#ffffff'}
                                />
                            </View>
                        </View>

                        <View style={styles.settingsSection}>
                            <Text style={styles.settingsTitle}>Soporte</Text>
                            <TouchableOpacity style={styles.settingItem}>
                                <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Ayuda y Soporte</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingItem}>
                                <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
                                <Text style={styles.settingText}>Acerca de</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('LoginScreen')}>
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                            <Text style={styles.logoutText}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Modal de Editar Perfil */}
            <Modal
                visible={showEditProfile}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditProfile(false)}
            >
                <EditProfileModal
                    userProfile={userProfile}
                    onSave={handleSaveProfile}
                    onClose={() => setShowEditProfile(false)}
                />
            </Modal>

            {/* Modal de Mapa de Calor Completo */}
            <Modal
                visible={showHeatMap}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowHeatMap(false)}
            >
                <SafeAreaView style={styles.fullMapContainer}>
                    <View style={styles.fullMapHeader}>
                        <TouchableOpacity onPress={() => setShowHeatMap(false)}>
                            <Ionicons name="close" size={24} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={styles.fullMapTitle}>Mapa de Calor - Zonas Frecuentes</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <MapView
                        style={styles.fullMap}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: 4.6350,
                            longitude: -74.0650,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        }}
                    >
                        <Heatmap
                            points={heatmapData}
                            radius={50}
                            opacity={0.8}
                            gradient={{
                                colors: ['#22c55e', '#f59e0b', '#ef4444'],
                                startPoints: [0.2, 0.5, 1.0],
                            }}
                        />
                    </MapView>
                </SafeAreaView>
            </Modal>

            <BottomTabMenu activeTab="Perfil" onTabPress={handleTabPress} />
        </SafeAreaView>
    );
};

// Componente para editar perfil
const EditProfileModal = ({ userProfile, onSave, onClose }) => {
    const [name, setName] = useState(userProfile.name);
    const [bio, setBio] = useState(userProfile.bio);
    const [city, setCity] = useState(userProfile.city);
    const [phone, setPhone] = useState(userProfile.phone);

    const handleSave = () => {
        onSave({ name, bio, city, phone });
    };

    return (
        <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Editar Perfil</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Guardar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.editForm}>
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Nombre</Text>
                    <TextInput
                        style={styles.formInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Tu nombre completo"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Biografía</Text>
                    <TextInput
                        style={[styles.formInput, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Cuéntanos sobre ti..."
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Ciudad</Text>
                    <TextInput
                        style={styles.formInput}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Tu ciudad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Teléfono</Text>
                    <TextInput
                        style={styles.formInput}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Tu número de teléfono"
                        keyboardType="phone-pad"
                    />
                </View>
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    settingsButton: {
        padding: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    editButton: {
        padding: 8,
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#22c55e',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0fdf4',
        borderWidth: 4,
        borderColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#22c55e',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    levelText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    userLevel: {
        fontSize: 16,
        color: '#22c55e',
        fontWeight: '600',
        marginBottom: 8,
    },
    userBio: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    levelProgressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelProgressBar: {
        width: '80%',
        height: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    levelProgress: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 4,
    },
    levelProgressText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#6b7280',
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewMoreText: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: (width - 56) / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    additionalStats: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    additionalStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    additionalStatLabel: {
        flex: 1,
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 12,
    },
    additionalStatValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    heatmapSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    heatmapContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    heatmap: {
        flex: 1,
    },
    heatmapOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 8,
    },
    achievementsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    achievementsScroll: {
        flexDirection: 'row',
    },
    achievementCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },
    achievementNameLocked: {
        color: '#9ca3af',
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
    cancelText: {
        fontSize: 16,
        color: '#6b7280',
    },
    saveText: {
        fontSize: 16,
        color: '#22c55e',
        fontWeight: '600',
    },
    settingsContent: {
        flex: 1,
        padding: 20,
    },
    settingsSection: {
        marginBottom: 32,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
        marginLeft: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    logoutText: {
        fontSize: 16,
        color: '#ef4444',
        fontWeight: '600',
        marginLeft: 8,
    },
    editForm: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    fullMapContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    fullMapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    fullMapTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    fullMap: {
        flex: 1,
    },
    bottomSpacing: {
        height: 100,
    },
});

export default ProfileScreen;