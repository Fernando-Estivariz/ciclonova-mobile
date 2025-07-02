"use client"

import { useState, useRef, useEffect } from "react"
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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import BottomTabMenu from "../components/BottomTabMenu"

const { width, height } = Dimensions.get("window")

// Configuración de la API
const API_BASE_URL = "http://192.168.0.74:3000"
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
})

const RoutesScreen = ({ navigation }) => {
    const [activeFilter, setActiveFilter] = useState("Todas")
    const [searchText, setSearchText] = useState("")
    const [isMapExpanded, setIsMapExpanded] = useState(false)
    const [showRouteModal, setShowRouteModal] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [isCreatingRoute, setIsCreatingRoute] = useState(false)
    const [currentLocation, setCurrentLocation] = useState(null)
    const [routeCoordinates, setRouteCoordinates] = useState([])
    const [savedRoutes, setSavedRoutes] = useState([])
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [newRouteName, setNewRouteName] = useState("")
    const [routeType, setRouteType] = useState("Recreativa")
    const [loading, setLoading] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const mapHeight = useRef(new Animated.Value(200)).current
    const mapRef = useRef(null)

    // Datos de ejemplo para rutas (se combinarán con las guardadas)
    const defaultRoutes = [
        {
            id: 1,
            name: "Ruta del Parque Central",
            distance: "12.5 km",
            duration: "45 min",
            difficulty: "Fácil",
            elevation: "120 m",
            type: "Recreativa",
            rating: 4.8,
            completed: true,
            color: "#22c55e",
            coordinates: [
                { latitude: 4.6097, longitude: -74.0817 },
                { latitude: 4.615, longitude: -74.075 },
                { latitude: 4.62, longitude: -74.07 },
            ],
            createdAt: "2024-01-10",
        },
        {
            id: 2,
            name: "Circuito Montañoso",
            distance: "28.3 km",
            duration: "1h 20min",
            difficulty: "Difícil",
            elevation: "450 m",
            type: "Deportiva",
            rating: 4.9,
            completed: false,
            color: "#ef4444",
            coordinates: [
                { latitude: 4.65, longitude: -74.05 },
                { latitude: 4.66, longitude: -74.04 },
                { latitude: 4.67, longitude: -74.03 },
            ],
            createdAt: "2024-01-08",
        },
    ]

    // Notificaciones de ejemplo
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Nueva ruta disponible",
            message: "Se ha agregado una nueva ruta en tu zona",
            time: "5 min",
            read: false,
            type: "route",
        },
        {
            id: 2,
            title: "Reto completado",
            message: "¡Felicidades! Has completado el reto semanal",
            time: "1h",
            read: false,
            type: "achievement",
        },
        {
            id: 3,
            title: "Mantenimiento de bicicleta",
            message: "Es hora de revisar tu bicicleta",
            time: "2h",
            read: true,
            type: "maintenance",
        },
    ])

    const filters = ["Todas", "Completadas", "Pendientes", "Favoritas", "Mis Rutas"]
    const routeTypes = ["Recreativa", "Deportiva", "Turística", "Urbana", "Montaña"]

    const [stats, setStats] = useState([
        { label: "Total KM", value: "156.8", icon: "speedometer-outline", color: "#22c55e" },
        { label: "Rutas", value: "12", icon: "map-outline", color: "#3b82f6" },
        { label: "Tiempo", value: "8h 45m", icon: "time-outline", color: "#f59e0b" },
        { label: "Elevación", value: "1,240m", icon: "trending-up-outline", color: "#8b5cf6" },
    ])

    useEffect(() => {
        checkAuthentication()
        requestLocationPermission()
    }, [])

    useEffect(() => {
        loadSavedRoutes()
    }, [isAuthenticated])

    // Verificar autenticación
    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken")
            console.log("Token found:", token ? "Yes" : "No")
            if (token) {
                // Verificar que el token sea válido haciendo una petición de prueba
                try {
                    const response = await axios.get(`${API_BASE_URL}/routes`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    })

                    setIsAuthenticated(true)
                    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
                    console.log("Authentication successful")
                } catch (error) {
                    console.log("Token is invalid, removing it")
                    await AsyncStorage.removeItem("authToken")
                    setIsAuthenticated(false)
                }
            } else {
                setIsAuthenticated(false)
                console.log("No token found, user not authenticated")
            }
        } catch (error) {
            console.error("Error checking authentication:", error)
            setIsAuthenticated(false)
        }
    }

    // Función para hacer peticiones autenticadas
    const makeAuthenticatedRequest = async (requestFunction) => {
        try {
            const token = await AsyncStorage.getItem("authToken")
            if (!token) {
                console.log("No token available")
                Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente", [
                    {
                        text: "Ir a Login",
                        onPress: () => navigation.navigate("LoginScreen"),
                    },
                ])
                return null
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }

            return await requestFunction(config)
        } catch (error) {
            if (error.response?.status === 401) {
                console.log("Token expired or invalid")
                await AsyncStorage.removeItem("authToken")
                setIsAuthenticated(false)
                Alert.alert("Sesión expirada", "Por favor inicia sesión nuevamente", [
                    {
                        text: "Ir a Login",
                        onPress: () => navigation.navigate("LoginScreen"),
                    },
                ])
            }
            throw error
        }
    }

    // Función para convertir datos de la BD al formato del frontend
    const formatRouteFromDB = (dbRoute) => {
        return {
            id: dbRoute.id,
            name: dbRoute.name,
            distance: `${dbRoute.distance_km} km`,
            duration: `${dbRoute.duration_minutes} min`,
            difficulty: dbRoute.difficulty,
            elevation: `${dbRoute.elevation_meters} m`,
            type: dbRoute.type,
            rating: dbRoute.rating,
            completed: dbRoute.completed,
            color: dbRoute.color,
            coordinates: typeof dbRoute.coordinates === "string" ? JSON.parse(dbRoute.coordinates) : dbRoute.coordinates,
            startLocation:
                typeof dbRoute.start_location === "string" ? JSON.parse(dbRoute.start_location) : dbRoute.start_location,
            createdAt: dbRoute.created_at,
        }
    }

    // Función para convertir datos del frontend al formato de la BD - CORREGIDA
    const formatRouteForDB = (frontendRoute, coordinates) => {
        const distance = calculateDistance(coordinates)

        const routeData = {
            name: frontendRoute.name,
            distance_km: distance,
            duration_minutes: Math.round(distance * 3),
            difficulty: distance > 20 ? "Difícil" : distance > 10 ? "Moderada" : "Fácil",
            elevation_meters: Math.round(distance * 15),
            type: frontendRoute.type,
            rating: frontendRoute.rating || 0,
            completed: frontendRoute.completed || false,
            color: frontendRoute.color,
            // IMPORTANTE: Convertir a JSON string para PostgreSQL
            coordinates: JSON.stringify(coordinates),
            start_location: frontendRoute.startLocation ? JSON.stringify(frontendRoute.startLocation) : null,
        }

        console.log("Formatted data for DB:", JSON.stringify(routeData, null, 2))
        return routeData
    }

    // Solicitar permisos de ubicación
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status === "granted") {
                const location = await Location.getCurrentPositionAsync({})
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                })
            } else {
                Alert.alert("Permisos requeridos", "Necesitamos acceso a tu ubicación para mostrar el mapa")
            }
        } catch (error) {
            console.error("Error getting location:", error)
        }
    }

    // Cargar rutas guardadas desde la base de datos
    const loadSavedRoutes = async () => {
        try {
            setLoading(true)
            console.log("loadSavedRoutes called, isAuthenticated:", isAuthenticated)

            // Si no está autenticado, solo cargar rutas por defecto
            if (!isAuthenticated) {
                console.log("User not authenticated, loading default routes only")
                setSavedRoutes(defaultRoutes)
                updateStatsFromRoutes(defaultRoutes)
                return
            }

            console.log("User is authenticated, loading routes from database...")

            const response = await makeAuthenticatedRequest(async (config) => {
                return await axios.get(`${API_BASE_URL}/routes`, config)
            })

            if (response) {
                console.log("Database routes loaded:", response.data.length, "routes")
                const dbRoutes = response.data.map(formatRouteFromDB)
                setSavedRoutes([...defaultRoutes, ...dbRoutes])
                updateStatsFromRoutes([...defaultRoutes, ...dbRoutes])
                console.log("Routes loaded successfully from database")
            } else {
                // Fallback a rutas por defecto
                setSavedRoutes(defaultRoutes)
                updateStatsFromRoutes(defaultRoutes)
            }
        } catch (error) {
            console.error("Error loading routes from database:", error)
            // Fallback a AsyncStorage si falla la BD
            try {
                const saved = await AsyncStorage.getItem("savedRoutes")
                if (saved) {
                    const parsedRoutes = JSON.parse(saved)
                    setSavedRoutes([...defaultRoutes, ...parsedRoutes])
                } else {
                    setSavedRoutes(defaultRoutes)
                }
            } catch (storageError) {
                console.error("Error loading from AsyncStorage:", storageError)
                setSavedRoutes(defaultRoutes)
            }
        } finally {
            setLoading(false)
        }
    }

    // Guardar ruta en la base de datos - CORREGIDA
    const saveRoute = async (route) => {
        try {
            setLoading(true)

            if (!isAuthenticated) {
                Alert.alert("Iniciar sesión requerido", "Debes iniciar sesión para guardar rutas en la nube", [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Ir a Login",
                        onPress: () => navigation.navigate("LoginScreen"),
                    },
                ])
                return false
            }

            // Validar que tenemos coordenadas
            if (!routeCoordinates || routeCoordinates.length < 2) {
                Alert.alert("Error", "La ruta debe tener al menos 2 puntos")
                return false
            }

            console.log("Route coordinates length:", routeCoordinates.length)
            console.log("Route coordinates sample:", routeCoordinates.slice(0, 2))

            const routeData = formatRouteForDB(route, routeCoordinates)

            console.log("Final data being sent to server:", JSON.stringify(routeData, null, 2))

            const response = await makeAuthenticatedRequest(async (config) => {
                console.log("Making request to:", `${API_BASE_URL}/routes`)
                return await axios.post(`${API_BASE_URL}/routes`, routeData, config)
            })

            if (response) {
                console.log("Server response:", JSON.stringify(response.data, null, 2))
                const savedRoute = formatRouteFromDB(response.data)

                // Actualizar el estado local
                const updatedRoutes = [...savedRoutes, savedRoute]
                setSavedRoutes(updatedRoutes)
                updateStatsFromRoutes(updatedRoutes)

                return savedRoute
            }
            return false
        } catch (error) {
            console.error("Error saving route to database:", error)

            // Mostrar más detalles del error
            if (error.response) {
                console.error("Error response status:", error.response.status)
                console.error("Error response data:", JSON.stringify(error.response.data, null, 2))

                Alert.alert(
                    "Error al guardar ruta",
                    `Error ${error.response.status}: ${error.response.data?.message || "Error desconocido"}`,
                )
            } else if (error.request) {
                console.error("Error request:", error.request)
                Alert.alert("Error de conexión", "No se pudo conectar con el servidor")
            } else {
                console.error("Error message:", error.message)
                Alert.alert("Error", error.message)
            }

            return false
        } finally {
            setLoading(false)
        }
    }

    // Eliminar ruta de la base de datos
    const deleteRouteFromDB = async (routeId) => {
        try {
            setLoading(true)

            if (!isAuthenticated) {
                Alert.alert("Error", "Debes iniciar sesión para eliminar rutas")
                return false
            }

            await makeAuthenticatedRequest(async (config) => {
                return await axios.delete(`${API_BASE_URL}/routes/${routeId}`, config)
            })

            // Actualizar el estado local
            const updatedRoutes = savedRoutes.filter((r) => r.id !== routeId)
            setSavedRoutes(updatedRoutes)
            updateStatsFromRoutes(updatedRoutes)

            return true
        } catch (error) {
            console.error("Error deleting route from database:", error)
            Alert.alert("Error", "No se pudo eliminar la ruta del servidor. Intenta de nuevo.")
            return false
        } finally {
            setLoading(false)
        }
    }

    // Actualizar estadísticas basadas en las rutas
    const updateStatsFromRoutes = (routes) => {
        const dbRoutes = routes.filter((r) => !defaultRoutes.find((dr) => dr.id === r.id))
        const totalRoutes = dbRoutes.length
        const completedRoutes = dbRoutes.filter((r) => r.completed).length
        const totalDistance = dbRoutes.reduce((sum, route) => {
            return sum + Number.parseFloat(route.distance.replace(" km", ""))
        }, 0)

        setStats([
            { label: "Total KM", value: totalDistance.toFixed(1), icon: "speedometer-outline", color: "#22c55e" },
            { label: "Rutas", value: totalRoutes.toString(), icon: "map-outline", color: "#3b82f6" },
            { label: "Completadas", value: completedRoutes.toString(), icon: "checkmark-circle-outline", color: "#f59e0b" },
            { label: "Creadas", value: totalRoutes.toString(), icon: "add-circle-outline", color: "#8b5cf6" },
        ])
    }

    // Alternar tamaño del mapa
    const toggleMapSize = () => {
        const newHeight = isMapExpanded ? 200 : 400
        setIsMapExpanded(!isMapExpanded)

        Animated.spring(mapHeight, {
            toValue: newHeight,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start()
    }

    // Iniciar ruta
    const startRoute = (route) => {
        console.log("Starting route:", route)

        if (!navigation) {
            Alert.alert("Error", "Navegación no disponible")
            return
        }

        Alert.alert("Iniciar Ruta", `¿Quieres comenzar la ruta "${route.name}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Iniciar",
                onPress: () => {
                    try {
                        console.log("Navigating to RouteNavigation with data:", route)
                        navigation.navigate("RouteNavigationScreen", {
                            routeData: route,
                        })
                    } catch (error) {
                        console.error("Navigation error:", error)
                        Alert.alert("Error", "No se pudo iniciar la navegación")
                    }
                },
            },
        ])
    }

    // Iniciar navegación libre
    const startFreeNavigation = () => {
        console.log("Starting free navigation")

        if (!navigation) {
            Alert.alert("Error", "Navegación no disponible")
            return
        }

        if (!currentLocation) {
            Alert.alert("Error", "No se pudo obtener tu ubicación actual. Intenta de nuevo.")
            return
        }

        try {
            const freeRoute = {
                id: "free-navigation",
                name: "Navegación Libre",
                distance: "0 km",
                duration: "0 min",
                difficulty: "Personalizada",
                elevation: "0 m",
                type: "Libre",
                rating: 0,
                completed: false,
                color: "#22c55e",
                coordinates: [
                    {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                    },
                ],
                startLocation: currentLocation,
                createdAt: new Date().toISOString().split("T")[0],
            }

            console.log("Navigating to RouteNavigation with free route:", freeRoute)
            navigation.navigate("RouteNavigationScreen", {
                routeData: freeRoute,
            })
        } catch (error) {
            console.error("Free navigation error:", error)
            Alert.alert("Error", "No se pudo iniciar la navegación libre")
        }
    }

    // Iniciar creación de ruta
    const startRouteCreation = () => {
        setIsCreatingRoute(true)
        setRouteCoordinates([])
        Alert.alert("Crear Nueva Ruta", "Elige una opción:", [
            { text: "Cancelar", style: "cancel", onPress: () => setIsCreatingRoute(false) },
            {
                text: "Trazar en Mapa",
                onPress: () => {
                    Alert.alert(
                        "Trazar Ruta",
                        'Toca en el mapa para agregar puntos a tu ruta. Presiona "Finalizar" cuando termines.',
                        [{ text: "Entendido" }],
                    )
                },
            },
            {
                text: "Navegación Libre",
                onPress: () => {
                    setIsCreatingRoute(false)
                    startFreeNavigation()
                },
            },
        ])
    }

    // Manejar toque en el mapa
    const handleMapPress = (event) => {
        if (isCreatingRoute) {
            const newCoordinate = event.nativeEvent.coordinate
            setRouteCoordinates([...routeCoordinates, newCoordinate])
            console.log("Added coordinate:", newCoordinate)
            console.log("Total coordinates:", routeCoordinates.length + 1)
        }
    }

    // Finalizar creación de ruta
    const finishRouteCreation = () => {
        console.log("finishRouteCreation called, routeCoordinates:", routeCoordinates.length)

        if (routeCoordinates.length < 2) {
            Alert.alert("Ruta Incompleta", "Necesitas al menos 2 puntos para crear una ruta. ¿Qué deseas hacer?", [
                { text: "Continuar Trazando", style: "cancel" },
                {
                    text: "Navegación Libre",
                    onPress: () => {
                        setIsCreatingRoute(false)
                        setRouteCoordinates([])
                        startFreeNavigation()
                    },
                },
            ])
            return
        }

        setShowRouteModal(true)
    }

    // Manejar guardado de nueva ruta - CORREGIDA
    const handleSaveNewRoute = async () => {
        if (!newRouteName || !newRouteName.trim()) {
            Alert.alert("Error", "Por favor ingresa un nombre válido para la ruta")
            return
        }

        if (routeCoordinates.length < 2) {
            Alert.alert("Error", "La ruta debe tener al menos 2 puntos")
            return
        }

        try {
            console.log("Saving route with name:", newRouteName)
            console.log("Route coordinates count:", routeCoordinates.length)

            const newRoute = {
                name: newRouteName.trim(),
                type: routeType,
                rating: 0,
                completed: false,
                color: getRandomColor(),
                startLocation: currentLocation,
            }

            console.log("New route object:", newRoute)

            const savedRoute = await saveRoute(newRoute)
            if (savedRoute) {
                setIsCreatingRoute(false)
                setRouteCoordinates([])
                setShowRouteModal(false)
                setNewRouteName("")

                Alert.alert(
                    "Ruta Creada",
                    `La ruta "${newRouteName}" ha sido creada exitosamente. ¿Quieres comenzar a navegarla ahora?`,
                    [
                        { text: "Más Tarde", style: "cancel" },
                        {
                            text: "Comenzar Ahora",
                            onPress: () => {
                                console.log("Starting newly created route:", savedRoute)
                                startRoute(savedRoute)
                            },
                        },
                    ],
                )
            }
        } catch (error) {
            console.error("Error in handleSaveNewRoute:", error)
            Alert.alert("Error", "Ocurrió un error al crear la ruta")
        }
    }

    // Calcular distancia aproximada
    const calculateDistance = (coordinates) => {
        if (coordinates.length < 2) return 0

        let distance = 0
        for (let i = 1; i < coordinates.length; i++) {
            const prev = coordinates[i - 1]
            const curr = coordinates[i]

            // Fórmula de Haversine simplificada
            const R = 6371 // Radio de la Tierra en km
            const dLat = ((curr.latitude - prev.latitude) * Math.PI) / 180
            const dLon = ((curr.longitude - prev.longitude) * Math.PI) / 180
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((prev.latitude * Math.PI) / 180) *
                Math.cos((curr.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            distance += R * c
        }
        return distance
    }

    // Obtener color aleatorio
    const getRandomColor = () => {
        const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
        return colors[Math.floor(Math.random() * colors.length)]
    }

    // Filtrar rutas
    const getFilteredRoutes = () => {
        let filtered = savedRoutes

        if (searchText) {
            filtered = filtered.filter(
                (route) =>
                    route.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    route.type.toLowerCase().includes(searchText.toLowerCase()),
            )
        }

        switch (activeFilter) {
            case "Completadas":
                return filtered.filter((route) => route.completed)
            case "Pendientes":
                return filtered.filter((route) => !route.completed)
            case "Favoritas":
                return filtered.filter((route) => route.rating >= 4.5)
            case "Mis Rutas":
                return filtered.filter((route) => !defaultRoutes.find((dr) => dr.id === route.id))
            default:
                return filtered
        }
    }

    // Manejar notificaciones
    const handleNotificationPress = () => {
        setShowNotifications(true)
    }

    const markNotificationAsRead = (notificationId) => {
        setNotifications(notifications.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
    }

    // Compartir ruta
    const shareRoute = async (route) => {
        try {
            await Share.share({
                message: `¡Mira esta increíble ruta de ciclismo! 🚴‍♂️

📍 ${route.name}
📏 Distancia: ${route.distance}
⏱️ Duración: ${route.duration}
🏔️ Dificultad: ${route.difficulty}

¡Descarga CicloNova y pedalea conmigo!`,
                title: `Ruta: ${route.name}`,
            })
        } catch (error) {
            Alert.alert("Error", "No se pudo compartir la ruta")
        }
    }

    // Eliminar ruta
    const deleteRoute = (route) => {
        // No permitir eliminar rutas por defecto
        if (defaultRoutes.find((dr) => dr.id === route.id)) {
            Alert.alert("No permitido", "No puedes eliminar las rutas predeterminadas")
            return
        }

        Alert.alert("Eliminar Ruta", `¿Estás seguro de que quieres eliminar "${route.name}"?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    const success = await deleteRouteFromDB(route.id)
                    if (success) {
                        Alert.alert("Eliminada", "La ruta ha sido eliminada")
                    }
                },
            },
        ])
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Fácil":
                return "#22c55e"
            case "Moderada":
                return "#f59e0b"
            case "Difícil":
                return "#ef4444"
            default:
                return "#6b7280"
        }
    }

    const handleTabPress = (tabName) => {
        console.log("Tab pressed:", tabName)
    }

    const unreadNotifications = notifications.filter((n) => !n.read).length

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
                                {isAuthenticated ? "Descubre nuevas aventuras" : "Inicia sesión para sincronizar tus rutas"}
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            {!isAuthenticated && (
                                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("LoginScreen")}>
                                    <Ionicons name="log-in-outline" size={20} color="#22c55e" />
                                    <Text style={styles.loginButtonText}>Login</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
                                <Ionicons name="notifications-outline" size={24} color="#1f2937" />
                                {unreadNotifications > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Barra de búsqueda */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar rutas..."
                            placeholderTextColor="#9ca3af"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity style={styles.filterButton}>
                            <Ionicons name="options-outline" size={20} color="#22c55e" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Indicador de estado de autenticación */}
                {!isAuthenticated && (
                    <View style={styles.authWarning}>
                        <Ionicons name="warning-outline" size={20} color="#f59e0b" />
                        <Text style={styles.authWarningText}>
                            Trabajando sin conexión. Inicia sesión para sincronizar tus rutas.
                        </Text>
                    </View>
                )}

                {/* Indicador de carga */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Cargando...</Text>
                    </View>
                )}

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
                                <Marker coordinate={currentLocation} title="Tu ubicación" pinColor="#22c55e" />

                                {/* Mostrar ruta seleccionada */}
                                {selectedRoute && selectedRoute.coordinates && (
                                    <>
                                        <Polyline
                                            coordinates={selectedRoute.coordinates}
                                            strokeColor={selectedRoute.color}
                                            strokeWidth={4}
                                        />
                                        {selectedRoute.coordinates.map((coord, index) => (
                                            <Marker key={index} coordinate={coord} pinColor={selectedRoute.color} />
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
                                            <Marker key={index} coordinate={coord} pinColor="#22c55e" />
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
                                <Ionicons name={isMapExpanded ? "contract-outline" : "expand-outline"} size={20} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.mapControlButton}
                                onPress={() => {
                                    if (mapRef.current && currentLocation) {
                                        mapRef.current.animateToRegion(currentLocation, 1000)
                                    }
                                }}
                            >
                                <Ionicons name="locate-outline" size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {/* Botón para nueva ruta */}
                        <TouchableOpacity
                            style={[styles.newRouteButton, isCreatingRoute && styles.newRouteButtonActive]}
                            onPress={isCreatingRoute ? finishRouteCreation : startRouteCreation}
                            disabled={loading}
                        >
                            <Ionicons name={isCreatingRoute ? "checkmark" : "add"} size={28} color="#ffffff" />
                        </TouchableOpacity>

                        {/* Botón cancelar creación */}
                        {isCreatingRoute && (
                            <TouchableOpacity
                                style={styles.cancelRouteButton}
                                onPress={() => {
                                    setIsCreatingRoute(false)
                                    setRouteCoordinates([])
                                }}
                            >
                                <Ionicons name="close" size={24} color="#ffffff" />
                            </TouchableOpacity>
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
                <View style={styles.filtersSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Lista de rutas */}
                <View style={styles.routesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{activeFilter === "Todas" ? "Todas las Rutas" : activeFilter}</Text>
                        <TouchableOpacity onPress={() => Alert.alert("Ver todas", "Mostrando todas las rutas disponibles")}>
                            <Text style={styles.seeAllText}>Ver todas</Text>
                        </TouchableOpacity>
                    </View>

                    {getFilteredRoutes().map((route) => (
                        <TouchableOpacity
                            key={route.id}
                            style={styles.routeCard}
                            onPress={() => {
                                setSelectedRoute(route)
                                if (mapRef.current && route.coordinates && route.coordinates.length > 0) {
                                    mapRef.current.fitToCoordinates(route.coordinates, {
                                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                                        animated: true,
                                    })
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
                                    {route.completed && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
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
                                <View
                                    style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(route.difficulty) + "20" }]}
                                >
                                    <Text style={[styles.difficultyText, { color: getDifficultyColor(route.difficulty) }]}>
                                        {route.difficulty}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.routeActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={(e) => {
                                        e.stopPropagation()
                                        startRoute(route)
                                    }}
                                >
                                    <Ionicons name="play-outline" size={18} color="#22c55e" />
                                    <Text style={styles.actionButtonText}>Iniciar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={(e) => {
                                        e.stopPropagation()
                                        shareRoute(route)
                                    }}
                                >
                                    <Ionicons name="share-outline" size={18} color="#6b7280" />
                                    <Text style={[styles.actionButtonText, { color: "#6b7280" }]}>Compartir</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={(e) => {
                                        e.stopPropagation()
                                        deleteRoute(route)
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
                                {searchText ? "Intenta con otros términos de búsqueda" : "Crea tu primera ruta personalizada"}
                            </Text>
                        </View>
                    )}
                </View>

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
                        <TouchableOpacity
                            onPress={() => {
                                setNotifications(notifications.map((n) => ({ ...n, read: true })))
                            }}
                        >
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
                                            item.type === "route"
                                                ? "map-outline"
                                                : item.type === "achievement"
                                                    ? "trophy-outline"
                                                    : "build-outline"
                                        }
                                        size={24}
                                        color={item.type === "route" ? "#3b82f6" : item.type === "achievement" ? "#f59e0b" : "#6b7280"}
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

            {/* Modal para nombrar nueva ruta */}
            <Modal
                visible={showRouteModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setShowRouteModal(false)
                    setNewRouteName("")
                }}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowRouteModal(false)
                                setNewRouteName("")
                            }}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Nueva Ruta</Text>
                        <TouchableOpacity onPress={handleSaveNewRoute} disabled={loading}>
                            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>{loading ? "Guardando..." : "Crear"}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.routeFormContainer}>
                        <View style={styles.routePreview}>
                            <Text style={styles.routePreviewTitle}>Resumen de la Ruta</Text>
                            <View style={styles.routePreviewStats}>
                                <View style={styles.previewStat}>
                                    <Ionicons name="location-outline" size={20} color="#22c55e" />
                                    <Text style={styles.previewStatText}>{calculateDistance(routeCoordinates).toFixed(1)} km</Text>
                                </View>
                                <View style={styles.previewStat}>
                                    <Ionicons name="flag-outline" size={20} color="#3b82f6" />
                                    <Text style={styles.previewStatText}>{routeCoordinates.length} puntos</Text>
                                </View>
                                <View style={styles.previewStat}>
                                    <Ionicons name="time-outline" size={20} color="#f59e0b" />
                                    <Text style={styles.previewStatText}>~{Math.round(calculateDistance(routeCoordinates) * 3)} min</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Nombre de la Ruta</Text>
                            <TextInput
                                style={styles.formInput}
                                value={newRouteName}
                                onChangeText={setNewRouteName}
                                placeholder="Ej: Mi ruta matutina"
                                placeholderTextColor="#9ca3af"
                                autoFocus={true}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Tipo de Ruta</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeTypeScroll}>
                                {routeTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.routeTypeChip, routeType === type && styles.activeRouteTypeChip]}
                                        onPress={() => setRouteType(type)}
                                        disabled={loading}
                                    >
                                        <Text style={[styles.routeTypeText, routeType === type && styles.activeRouteTypeText]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            <BottomTabMenu activeTab="Rutas" onTabPress={handleTabPress} />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
    },
    subtitle: {
        fontSize: 16,
        color: "#6b7280",
        marginTop: 4,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginRight: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        color: "#22c55e",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 4,
    },
    notificationButton: {
        position: "relative",
        padding: 8,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationBadge: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: "#ef4444",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationBadgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
    },
    authWarning: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        padding: 12,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#f59e0b",
    },
    authWarningText: {
        color: "#92400e",
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: "#000",
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
        color: "#1f2937",
    },
    filterButton: {
        padding: 8,
    },
    loadingContainer: {
        padding: 20,
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#6b7280",
    },
    mapSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    mapContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        shadowColor: "#000",
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
    },
    mapText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
        marginTop: 8,
    },
    mapSubtext: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
    },
    mapControls: {
        position: "absolute",
        top: 16,
        right: 16,
        flexDirection: "column",
    },
    mapControlButton: {
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    newRouteButton: {
        position: "absolute",
        bottom: 16,
        right: 16,
        backgroundColor: "#22c55e",
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    newRouteButtonActive: {
        backgroundColor: "#16a34a",
    },
    cancelRouteButton: {
        position: "absolute",
        bottom: 16,
        left: 16,
        backgroundColor: "#ef4444",
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 16,
    },
    statsScroll: {
        flexDirection: "row",
    },
    statCard: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        minWidth: 100,
        alignItems: "center",
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 4,
    },
    filtersSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterChip: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    activeFilterChip: {
        backgroundColor: "#22c55e",
        borderColor: "#22c55e",
    },
    filterText: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "500",
    },
    activeFilterText: {
        color: "#ffffff",
    },
    routesSection: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: "#22c55e",
        fontWeight: "600",
    },
    routeCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    routeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    routeInfo: {
        flex: 1,
    },
    routeName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    routeType: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    routeTypeText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
    },
    routeStatus: {
        alignItems: "center",
    },
    routeRating: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    ratingText: {
        fontSize: 14,
        color: "#6b7280",
        marginLeft: 4,
        fontWeight: "500",
    },
    routeStats: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        flexWrap: "wrap",
    },
    routeStat: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
        marginBottom: 4,
    },
    routeStatText: {
        fontSize: 14,
        color: "#6b7280",
        marginLeft: 4,
        fontWeight: "500",
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: "600",
    },
    routeActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        color: "#22c55e",
        fontWeight: "600",
        marginLeft: 4,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#6b7280",
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: "#9ca3af",
        marginTop: 8,
        textAlign: "center",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
    },
    markAllReadText: {
        fontSize: 14,
        color: "#22c55e",
        fontWeight: "600",
    },
    notificationsList: {
        padding: 20,
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    unreadNotification: {
        backgroundColor: "#ffffff",
        borderLeftWidth: 4,
        borderLeftColor: "#22c55e",
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: "#9ca3af",
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22c55e",
    },
    bottomSpacing: {
        height: 100,
    },
    routeFormContainer: {
        flex: 1,
        padding: 20,
    },
    routePreview: {
        backgroundColor: "#f0fdf4",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#22c55e",
    },
    routePreviewTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 12,
    },
    routePreviewStats: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    previewStat: {
        alignItems: "center",
    },
    previewStatText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1f2937",
        marginTop: 4,
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#1f2937",
    },
    routeTypeScroll: {
        flexDirection: "row",
    },
    routeTypeChip: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    activeRouteTypeChip: {
        backgroundColor: "#22c55e",
        borderColor: "#22c55e",
    },
    activeRouteTypeText: {
        color: "#ffffff",
    },
    cancelText: {
        fontSize: 16,
        color: "#6b7280",
    },
    saveText: {
        fontSize: 16,
        color: "#22c55e",
        fontWeight: "600",
    },
})

export default RoutesScreen
