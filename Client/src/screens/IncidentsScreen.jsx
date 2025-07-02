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
    TextInput,
    Alert,
    Modal,
    Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import MapView, { Marker } from "react-native-maps"
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

const IncidentsScreen = ({ navigation }) => {
    const [activeCategory, setActiveCategory] = useState("Todos")
    const [searchText, setSearchText] = useState("")
    const [showReportModal, setShowReportModal] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [incidents, setIncidents] = useState([])

    // Estados para el formulario de reporte
    const [selectedCategory, setSelectedCategory] = useState("")
    const [description, setDescription] = useState("")
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [location, setLocation] = useState({
        latitude: 4.6097,
        longitude: -74.0817,
        address: "",
    })
    const [markerLocation, setMarkerLocation] = useState(null)
    const mapRef = useRef(null)

    // Estados para el modal de detalles del incidente
    const [showIncidentDetails, setShowIncidentDetails] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState(null)

    // Categorías de incidentes para el reporte
    const incidentCategories = [
        {
            id: "obstaculo",
            name: "Obstáculo",
            icon: "warning",
            color: "#f59e0b",
            description: "Árbol caído, escombros, etc.",
        },
        {
            id: "accidente",
            name: "Accidente",
            icon: "medical",
            color: "#ef4444",
            description: "Accidente de tránsito o lesión",
        },
        { id: "robo", name: "Robo/Asalto", icon: "shield", color: "#8b5cf6", description: "Situación de inseguridad" },
        {
            id: "infraestructura",
            name: "Infraestructura",
            icon: "construct",
            color: "#3b82f6",
            description: "Baches, señalización dañada",
        },
        { id: "otro", name: "Otro", icon: "ellipsis-horizontal", color: "#6b7280", description: "Otro tipo de incidente" },
    ]

    // Categorías de filtro
    const categories = [
        { name: "Todos", icon: "grid-outline", color: "#6b7280" },
        { name: "Obstáculos", icon: "warning-outline", color: "#f59e0b" },
        { name: "Accidentes", icon: "medical-outline", color: "#ef4444" },
        { name: "Robos", icon: "shield-outline", color: "#8b5cf6" },
        { name: "Infraestructura", icon: "construct-outline", color: "#3b82f6" },
    ]

    // Tipos de emergencia rápida
    const emergencyTypes = [
        {
            title: "Accidente",
            subtitle: "Necesito ayuda médica",
            icon: "medical",
            color: "#ef4444",
            bgColor: "#fef2f2",
        },
        {
            title: "Robo/Asalto",
            subtitle: "Situación de seguridad",
            icon: "shield",
            color: "#8b5cf6",
            bgColor: "#f3f4f6",
        },
        {
            title: "Obstáculo",
            subtitle: "Bloqueo en ciclovía",
            icon: "warning",
            color: "#f59e0b",
            bgColor: "#fffbeb",
        },
        {
            title: "Daño Vial",
            subtitle: "Infraestructura dañada",
            icon: "construct",
            color: "#3b82f6",
            bgColor: "#eff6ff",
        },
    ]

    // Incidentes por defecto (se combinarán con los de la BD)
    const defaultIncidents = [
        {
            id: "default-1",
            type: "Obstáculo",
            title: "Árbol caído en Av. Principal",
            location: "Av. Principal, km 2.5",
            time: "Hace 15 min",
            status: "Activo",
            severity: "Alta",
            reports: 12,
            icon: "warning",
            color: "#f59e0b",
            category: "obstaculo",
            description: "Árbol grande bloqueando completamente la ciclovía",
            latitude: 4.6097,
            longitude: -74.0817,
            address: "Av. Principal, km 2.5",
            created_at: new Date().toISOString(),
        },
        {
            id: "default-2",
            type: "Accidente",
            title: "Ciclista herido en intersección",
            location: "Calle 45 con Carrera 12",
            time: "Hace 32 min",
            status: "Atendido",
            severity: "Crítica",
            reports: 8,
            icon: "medical",
            color: "#ef4444",
            category: "accidente",
            description: "Accidente entre ciclista y vehículo",
            latitude: 4.615,
            longitude: -74.075,
            address: "Calle 45 con Carrera 12",
            created_at: new Date().toISOString(),
        },
    ]

    useEffect(() => {
        checkAuthentication()
    }, [])

    useEffect(() => {
        loadIncidents()
    }, [isAuthenticated])

    // Verificar autenticación
    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken")
            console.log("Token found:", token ? "Yes" : "No")
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/incidents`, {
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
    const formatIncidentFromDB = (dbIncident) => {
        const categoryMap = {
            obstaculo: { type: "Obstáculo", icon: "warning", color: "#f59e0b" },
            accidente: { type: "Accidente", icon: "medical", color: "#ef4444" },
            robo: { type: "Robo/Asalto", icon: "shield", color: "#8b5cf6" },
            infraestructura: { type: "Infraestructura", icon: "construct", color: "#3b82f6" },
            otro: { type: "Otro", icon: "ellipsis-horizontal", color: "#6b7280" },
        }

        const categoryInfo = categoryMap[dbIncident.category] || categoryMap["otro"]
        const timeAgo = getTimeAgo(dbIncident.created_at)
        const severity = getSeverityFromReports(dbIncident.reports)

        return {
            id: dbIncident.id,
            type: categoryInfo.type,
            title:
                dbIncident.description.length > 50 ? dbIncident.description.substring(0, 50) + "..." : dbIncident.description,
            location: dbIncident.address,
            time: timeAgo,
            status: dbIncident.status,
            severity: severity,
            reports: dbIncident.reports,
            icon: categoryInfo.icon,
            color: categoryInfo.color,
            category: dbIncident.category,
            description: dbIncident.description,
            latitude: dbIncident.latitude,
            longitude: dbIncident.longitude,
            address: dbIncident.address,
            photo_url: dbIncident.photo_url,
            created_at: dbIncident.created_at,
        }
    }

    // Función para convertir datos del frontend al formato de la BD
    const formatIncidentForDB = (frontendIncident) => {
        return {
            category: frontendIncident.category,
            description: frontendIncident.description,
            photo_url: frontendIncident.photo || null,
            location: {
                latitude: frontendIncident.location.latitude,
                longitude: frontendIncident.location.longitude,
                address: frontendIncident.location.address,
            },
        }
    }

    // Función auxiliar para calcular tiempo transcurrido
    const getTimeAgo = (dateString) => {
        const now = new Date()
        const past = new Date(dateString)
        const diffMs = now - past
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours}h`
        return `Hace ${diffDays}d`
    }

    // Función auxiliar para determinar severidad basada en reportes
    const getSeverityFromReports = (reports) => {
        if (reports >= 10) return "Crítica"
        if (reports >= 5) return "Alta"
        if (reports >= 2) return "Media"
        return "Baja"
    }

    // Cargar incidentes desde la base de datos
    const loadIncidents = async () => {
        try {
            setLoading(true)
            console.log("loadIncidents called, isAuthenticated:", isAuthenticated)

            if (!isAuthenticated) {
                console.log("User not authenticated, loading default incidents only")
                setIncidents(defaultIncidents)
                return
            }

            console.log("User is authenticated, loading incidents from database...")

            const response = await makeAuthenticatedRequest(async (config) => {
                return await axios.get(`${API_BASE_URL}/incidents`, config)
            })

            if (response) {
                console.log("Database incidents loaded:", response.data.length, "incidents")
                const dbIncidents = response.data.map(formatIncidentFromDB)
                setIncidents([...defaultIncidents, ...dbIncidents])
                console.log("Incidents loaded successfully from database")
            } else {
                setIncidents(defaultIncidents)
            }
        } catch (error) {
            console.error("Error loading incidents from database:", error)
            setIncidents(defaultIncidents)
        } finally {
            setLoading(false)
        }
    }

    // Guardar incidente en la base de datos
    const saveIncident = async (incidentData) => {
        try {
            setLoading(true)

            if (!isAuthenticated) {
                Alert.alert("Iniciar sesión requerido", "Debes iniciar sesión para reportar incidentes", [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Ir a Login",
                        onPress: () => navigation.navigate("LoginScreen"),
                    },
                ])
                return false
            }

            console.log("Saving incident:", JSON.stringify(incidentData, null, 2))

            const response = await makeAuthenticatedRequest(async (config) => {
                return await axios.post(`${API_BASE_URL}/incidents`, incidentData, config)
            })

            if (response) {
                console.log("Server response:", JSON.stringify(response.data, null, 2))
                const savedIncident = formatIncidentFromDB(response.data)

                // Actualizar el estado local
                const updatedIncidents = [...incidents, savedIncident]
                setIncidents(updatedIncidents)

                return savedIncident
            }
            return false
        } catch (error) {
            console.error("Error saving incident to database:", error)

            if (error.response) {
                console.error("Error response status:", error.response.status)
                console.error("Error response data:", JSON.stringify(error.response.data, null, 2))

                Alert.alert(
                    "Error al guardar incidente",
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

    // Confirmar incidente (incrementar reportes)
    const confirmIncident = async (incidentId) => {
        try {
            if (!isAuthenticated) {
                Alert.alert("Error", "Debes iniciar sesión para confirmar incidentes")
                return
            }

            // No permitir confirmar incidentes por defecto
            if (typeof incidentId === "string" && incidentId.startsWith("default-")) {
                Alert.alert("No permitido", "No puedes confirmar incidentes predeterminados")
                return
            }

            const response = await makeAuthenticatedRequest(async (config) => {
                return await axios.patch(`${API_BASE_URL}/incidents/${incidentId}/report`, {}, config)
            })

            if (response) {
                const updatedIncident = formatIncidentFromDB(response.data)
                const updatedIncidents = incidents.map((incident) => (incident.id === incidentId ? updatedIncident : incident))
                setIncidents(updatedIncidents)
                Alert.alert("Confirmado", "Has confirmado este incidente")
            }
        } catch (error) {
            console.error("Error confirming incident:", error)
            Alert.alert("Error", "No se pudo confirmar el incidente")
        }
    }

    // Actualizar estado del incidente
    const updateIncidentStatus = async (incidentId, newStatus) => {
        try {
            if (!isAuthenticated) {
                Alert.alert("Error", "Debes iniciar sesión para actualizar incidentes")
                return
            }

            // No permitir actualizar incidentes por defecto
            if (typeof incidentId === "string" && incidentId.startsWith("default-")) {
                Alert.alert("No permitido", "No puedes actualizar incidentes predeterminados")
                return
            }

            const response = await makeAuthenticatedRequest(async (config) => {
                return await axios.patch(`${API_BASE_URL}/incidents/${incidentId}/status`, { status: newStatus }, config)
            })

            if (response) {
                const updatedIncident = formatIncidentFromDB(response.data)
                const updatedIncidents = incidents.map((incident) => (incident.id === incidentId ? updatedIncident : incident))
                setIncidents(updatedIncidents)
                Alert.alert("Actualizado", `Estado cambiado a: ${newStatus}`)
            }
        } catch (error) {
            console.error("Error updating incident status:", error)
            Alert.alert("Error", "No se pudo actualizar el estado del incidente")
        }
    }

    // Eliminar incidente
    const deleteIncident = async (incidentId) => {
        try {
            if (!isAuthenticated) {
                Alert.alert("Error", "Debes iniciar sesión para eliminar incidentes")
                return
            }

            // No permitir eliminar incidentes por defecto
            if (typeof incidentId === "string" && incidentId.startsWith("default-")) {
                Alert.alert("No permitido", "No puedes eliminar incidentes predeterminados")
                return
            }

            await makeAuthenticatedRequest(async (config) => {
                return await axios.delete(`${API_BASE_URL}/incidents/${incidentId}`, config)
            })

            const updatedIncidents = incidents.filter((incident) => incident.id !== incidentId)
            setIncidents(updatedIncidents)
            Alert.alert("Eliminado", "El incidente ha sido eliminado")
        } catch (error) {
            console.error("Error deleting incident:", error)
            Alert.alert("Error", "No se pudo eliminar el incidente")
        }
    }

    // Abrir detalles del incidente
    const openIncidentDetails = (incident) => {
        setSelectedIncident(incident)
        setShowIncidentDetails(true)
    }

    // Cerrar detalles del incidente
    const closeIncidentDetails = () => {
        setSelectedIncident(null)
        setShowIncidentDetails(false)
    }

    // Filtrar incidentes
    const getFilteredIncidents = () => {
        let filtered = incidents

        if (searchText) {
            filtered = filtered.filter(
                (incident) =>
                    incident.title.toLowerCase().includes(searchText.toLowerCase()) ||
                    incident.location.toLowerCase().includes(searchText.toLowerCase()) ||
                    incident.type.toLowerCase().includes(searchText.toLowerCase()),
            )
        }

        if (activeCategory !== "Todos") {
            const categoryMap = {
                Obstáculos: "obstaculo",
                Accidentes: "accidente",
                Robos: "robo",
                Infraestructura: "infraestructura",
            }
            const categoryKey = categoryMap[activeCategory]
            if (categoryKey) {
                filtered = filtered.filter((incident) => incident.category === categoryKey)
            }
        }

        return filtered
    }

    // Función para solicitar permisos de cámara
    const requestCameraPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== "granted") {
            Alert.alert("Permisos requeridos", "Necesitamos acceso a la cámara para tomar fotos del incidente.", [
                { text: "OK" },
            ])
            return false
        }
        return true
    }

    // Función para solicitar permisos de galería
    const requestMediaLibraryPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
            Alert.alert("Permisos requeridos", "Necesitamos acceso a la galería para seleccionar fotos.", [{ text: "OK" }])
            return false
        }
        return true
    }

    // Función para solicitar permisos de ubicación
    const requestLocationPermissions = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
            Alert.alert("Permisos requeridos", "Necesitamos acceso a la ubicación para marcar el lugar del incidente.", [
                { text: "OK" },
            ])
            return false
        }
        return true
    }

    // Función para obtener dirección desde coordenadas
    const getAddressFromCoordinates = async (latitude, longitude) => {
        try {
            const addressResponse = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            })

            if (addressResponse && addressResponse.length > 0) {
                const addr = addressResponse[0]
                return `${addr.street || ""} ${addr.streetNumber || ""}, ${addr.city || ""}, ${addr.region || ""}`.trim()
            }
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        } catch (error) {
            console.error("Error al obtener dirección:", error)
            return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }
    }

    const handleEmergencyPress = (type) => {
        Alert.alert("🚨 Emergencia", `¿Confirmas que necesitas ayuda por ${type.title.toLowerCase()}?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Confirmar",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Ayuda en camino", "Se ha enviado tu ubicación a servicios de emergencia")
                },
            },
        ])
    }

    const openReportModal = () => {
        setShowReportModal(true)
        setCurrentStep(1)
        setSelectedCategory("")
        setDescription("")
        setSelectedPhoto(null)
        setLocation({ latitude: 4.6097, longitude: -74.0817, address: "" })
        setMarkerLocation(null)
    }

    const closeReportModal = () => {
        setShowReportModal(false)
        setCurrentStep(1)
        setSelectedCategory("")
        setDescription("")
        setSelectedPhoto(null)
        setLocation({ latitude: 4.6097, longitude: -74.0817, address: "" })
        setMarkerLocation(null)
    }

    const handleCategorySelect = (category) => {
        setSelectedCategory(category.id)
        setCurrentStep(2)
    }

    // Función REAL para tomar foto con la cámara
    const handleTakePhoto = async () => {
        const hasPermission = await requestCameraPermissions()
        if (!hasPermission) return

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedPhoto(result.assets[0].uri)
                setCurrentStep(4)
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo acceder a la cámara. Inténtalo de nuevo.")
            console.error("Error al tomar foto:", error)
        }
    }

    // Función REAL para seleccionar foto de la galería
    const handleSelectPhoto = async () => {
        const hasPermission = await requestMediaLibraryPermissions()
        if (!hasPermission) return

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedPhoto(result.assets[0].uri)
                setCurrentStep(4)
            }
        } catch (error) {
            Alert.alert("Error", "No se pudo acceder a la galería. Inténtalo de nuevo.")
            console.error("Error al seleccionar foto:", error)
        }
    }

    // Función REAL para obtener ubicación actual
    const handleGetCurrentLocation = async () => {
        const hasPermission = await requestLocationPermissions()
        if (!hasPermission) return

        try {
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            })

            const { latitude, longitude } = currentLocation.coords
            const address = await getAddressFromCoordinates(latitude, longitude)

            setLocation({ latitude, longitude, address })
            setMarkerLocation({ latitude, longitude })

            // Animar el mapa a la nueva ubicación
            if (mapRef.current) {
                mapRef.current.animateToRegion(
                    {
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    },
                    1000,
                )
            }

            Alert.alert("Ubicación obtenida", "Se ha marcado tu ubicación actual correctamente.")
        } catch (error) {
            Alert.alert("Error", "No se pudo obtener la ubicación. Verifica que el GPS esté activado.")
            console.error("Error al obtener ubicación:", error)
        }
    }

    // Función para manejar toque en el mapa
    const handleMapPress = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate
        const address = await getAddressFromCoordinates(latitude, longitude)

        setLocation({ latitude, longitude, address })
        setMarkerLocation({ latitude, longitude })
    }

    const handleSubmitReport = async () => {
        if (!selectedCategory || !description.trim()) {
            Alert.alert("Error", "Por favor completa todos los campos obligatorios")
            return
        }

        if (!markerLocation) {
            Alert.alert("Error", "Por favor marca la ubicación del incidente en el mapa")
            return
        }

        try {
            const reportData = formatIncidentForDB({
                category: selectedCategory,
                description: description.trim(),
                photo: selectedPhoto,
                location: {
                    latitude: markerLocation.latitude,
                    longitude: markerLocation.longitude,
                    address: location.address,
                },
            })

            console.log("Datos del reporte:", reportData)

            const savedIncident = await saveIncident(reportData)
            if (savedIncident) {
                Alert.alert(
                    "Reporte Enviado",
                    "Tu reporte ha sido enviado exitosamente. Las autoridades han sido notificadas.",
                    [{ text: "OK", onPress: closeReportModal }],
                )
            }
        } catch (error) {
            console.error("Error in handleSubmitReport:", error)
            Alert.alert("Error", "Ocurrió un error al enviar el reporte")
        }
    }

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "Crítica":
                return "#ef4444"
            case "Alta":
                return "#f59e0b"
            case "Media":
                return "#3b82f6"
            case "Baja":
                return "#22c55e"
            default:
                return "#6b7280"
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "Activo":
                return "#ef4444"
            case "Atendido":
                return "#22c55e"
            case "Reportado":
                return "#f59e0b"
            default:
                return "#6b7280"
        }
    }

    const handleTabPress = (tabName) => {
        console.log("Tab pressed:", tabName)
    }

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
                                    style={[styles.categoryOption, selectedCategory === category.id && styles.selectedCategoryOption]}
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
                )

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
                )

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Agregar evidencia</Text>
                        <Text style={styles.stepSubtitle}>Toma una foto del incidente (opcional)</Text>

                        {selectedPhoto ? (
                            <View style={styles.photoContainer}>
                                <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                                <TouchableOpacity style={styles.removePhotoButton} onPress={() => setSelectedPhoto(null)}>
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
                )

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
                                    <Marker coordinate={markerLocation} title="Ubicación del incidente" description={location.address}>
                                        <View style={styles.customMarker}>
                                            <Ionicons name="warning" size={20} color="#ffffff" />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>

                            {/* Botón para obtener ubicación actual */}
                            <TouchableOpacity style={styles.currentLocationButton} onPress={handleGetCurrentLocation}>
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
                                <Text style={styles.locationHintText}>Toca en el mapa para marcar la ubicación del incidente</Text>
                            </View>
                        )}

                        <View style={styles.stepButtons}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                <Text style={styles.secondaryButtonText}>Atrás</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, !markerLocation && styles.disabledButton]}
                                onPress={handleSubmitReport}
                                disabled={!markerLocation || loading}
                            >
                                <Text style={styles.submitButtonText}>{loading ? "Enviando..." : "Enviar Reporte"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>🚨 Centro de Incidentes</Text>
                            <Text style={styles.subtitle}>
                                {isAuthenticated ? "Reporta y mantente seguro" : "Inicia sesión para reportar incidentes"}
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            {!isAuthenticated && (
                                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("LoginScreen")}>
                                    <Ionicons name="log-in-outline" size={16} color="#22c55e" />
                                    <Text style={styles.loginButtonText}>Login</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.sosButton}>
                                <Ionicons name="call" size={20} color="#ffffff" />
                                <Text style={styles.sosText}>SOS</Text>
                            </TouchableOpacity>
                        </View>
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

                {/* Indicador de estado de autenticación */}
                {!isAuthenticated && (
                    <View style={styles.authWarning}>
                        <Ionicons name="warning-outline" size={20} color="#f59e0b" />
                        <Text style={styles.authWarningText}>Trabajando sin conexión. Inicia sesión para reportar incidentes.</Text>
                    </View>
                )}

                {/* Indicador de carga */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Cargando...</Text>
                    </View>
                )}

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
                            <Text style={styles.statNumber}>
                                {getFilteredIncidents().filter((i) => i.status === "Activo").length}
                            </Text>
                            <Text style={styles.statLabel}>Activos</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                            <Text style={styles.statNumber}>
                                {getFilteredIncidents().filter((i) => i.status === "Atendido").length}
                            </Text>
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
                                style={[styles.categoryChip, activeCategory === category.name && styles.activeCategoryChip]}
                                onPress={() => setActiveCategory(category.name)}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={18}
                                    color={activeCategory === category.name ? "#ffffff" : category.color}
                                    style={styles.categoryIcon}
                                />
                                <Text style={[styles.categoryText, activeCategory === category.name && styles.activeCategoryText]}>
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

                    {getFilteredIncidents().map((incident) => (
                        <TouchableOpacity
                            key={incident.id}
                            style={styles.incidentCard}
                            onPress={() => openIncidentDetails(incident)}
                        >
                            <View style={styles.incidentHeader}>
                                <View style={[styles.incidentIcon, { backgroundColor: incident.color + "20" }]}>
                                    <Ionicons name={incident.icon} size={20} color={incident.color} />
                                </View>
                                <View style={styles.incidentInfo}>
                                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                                    <Text style={styles.incidentLocation}>{incident.location}</Text>
                                </View>
                                <View style={styles.incidentMeta}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) + "20" }]}>
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
                                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) + "20" }]}>
                                    <Text style={[styles.severityText, { color: getSeverityColor(incident.severity) }]}>
                                        {incident.severity}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.incidentActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={(e) => {
                                        e.stopPropagation()
                                        openIncidentDetails(incident)
                                    }}
                                >
                                    <Ionicons name="location-outline" size={16} color="#3b82f6" />
                                    <Text style={styles.actionBtnText}>Ver detalles</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={(e) => {
                                        e.stopPropagation()
                                        confirmIncident(incident.id)
                                    }}
                                >
                                    <Ionicons name="add-outline" size={16} color="#f59e0b" />
                                    <Text style={styles.actionBtnText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {getFilteredIncidents().length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="warning-outline" size={60} color="#9ca3af" />
                            <Text style={styles.emptyStateText}>No se encontraron incidentes</Text>
                            <Text style={styles.emptyStateSubtext}>
                                {searchText ? "Intenta con otros términos de búsqueda" : "No hay incidentes reportados"}
                            </Text>
                        </View>
                    )}
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

                    <ScrollView style={styles.modalContent}>{renderReportStep()}</ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Modal de detalles del incidente */}
            <Modal
                visible={showIncidentDetails}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeIncidentDetails}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeIncidentDetails}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Detalles del Incidente</Text>
                        <TouchableOpacity
                            onPress={() => {
                                if (selectedIncident && !selectedIncident.id.toString().startsWith("default-")) {
                                    Alert.alert("Opciones", "Selecciona una acción", [
                                        { text: "Cancelar", style: "cancel" },
                                        {
                                            text: "Marcar como Atendido",
                                            onPress: () => updateIncidentStatus(selectedIncident.id, "Atendido"),
                                        },
                                        {
                                            text: "Eliminar",
                                            style: "destructive",
                                            onPress: () => {
                                                Alert.alert("Confirmar eliminación", "¿Estás seguro de que quieres eliminar este incidente?", [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Eliminar",
                                                        style: "destructive",
                                                        onPress: () => {
                                                            deleteIncident(selectedIncident.id)
                                                            closeIncidentDetails()
                                                        },
                                                    },
                                                ])
                                            },
                                        },
                                    ])
                                }
                            }}
                        >
                            <Ionicons name="ellipsis-horizontal" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {selectedIncident && (
                        <ScrollView style={styles.modalContent}>
                            {/* Header del incidente */}
                            <View style={styles.incidentDetailHeader}>
                                <View style={[styles.incidentDetailIcon, { backgroundColor: selectedIncident.color }]}>
                                    <Ionicons name={selectedIncident.icon} size={32} color="#ffffff" />
                                </View>
                                <View style={styles.incidentDetailInfo}>
                                    <Text style={styles.incidentDetailTitle}>{selectedIncident.type}</Text>
                                    <View
                                        style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedIncident.status) + "20" }]}
                                    >
                                        <Text style={[styles.statusText, { color: getStatusColor(selectedIncident.status) }]}>
                                            {selectedIncident.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Descripción */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Descripción</Text>
                                <Text style={styles.detailDescription}>{selectedIncident.description}</Text>
                            </View>

                            {/* Foto si existe */}
                            {selectedIncident.photo_url && (
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailSectionTitle}>Evidencia Fotográfica</Text>
                                    <Image source={{ uri: selectedIncident.photo_url }} style={styles.incidentPhoto} />
                                </View>
                            )}

                            {/* Ubicación */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Ubicación</Text>
                                <Text style={styles.detailAddress}>{selectedIncident.address}</Text>

                                {/* Mapa de ubicación */}
                                <View style={styles.detailMapContainer}>
                                    <MapView
                                        style={styles.detailMap}
                                        initialRegion={{
                                            latitude: selectedIncident.latitude,
                                            longitude: selectedIncident.longitude,
                                            latitudeDelta: 0.01,
                                            longitudeDelta: 0.01,
                                        }}
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                        rotateEnabled={false}
                                        pitchEnabled={false}
                                    >
                                        <Marker
                                            coordinate={{
                                                latitude: selectedIncident.latitude,
                                                longitude: selectedIncident.longitude,
                                            }}
                                            title={selectedIncident.type}
                                            description={selectedIncident.address}
                                        >
                                            <View style={[styles.customMarker, { backgroundColor: selectedIncident.color }]}>
                                                <Ionicons name={selectedIncident.icon} size={20} color="#ffffff" />
                                            </View>
                                        </Marker>
                                    </MapView>

                                    {/* Botón para abrir en mapa completo */}
                                    <TouchableOpacity
                                        style={styles.openMapButton}
                                        onPress={() => {
                                            Alert.alert(
                                                "Abrir en Mapa",
                                                "Esta funcionalidad abrirá la ubicación en tu app de mapas preferida",
                                                [{ text: "OK" }],
                                            )
                                        }}
                                    >
                                        <Ionicons name="open-outline" size={16} color="#3b82f6" />
                                        <Text style={styles.openMapText}>Abrir en mapa</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Estadísticas del incidente */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Información Adicional</Text>
                                <View style={styles.detailStatsGrid}>
                                    <View style={styles.detailStatCard}>
                                        <Ionicons name="time-outline" size={20} color="#6b7280" />
                                        <Text style={styles.detailStatLabel}>Reportado</Text>
                                        <Text style={styles.detailStatValue}>{selectedIncident.time}</Text>
                                    </View>
                                    <View style={styles.detailStatCard}>
                                        <Ionicons name="people-outline" size={20} color="#6b7280" />
                                        <Text style={styles.detailStatLabel}>Confirmaciones</Text>
                                        <Text style={styles.detailStatValue}>{selectedIncident.reports}</Text>
                                    </View>
                                    <View style={styles.detailStatCard}>
                                        <Ionicons name="warning-outline" size={20} color={getSeverityColor(selectedIncident.severity)} />
                                        <Text style={styles.detailStatLabel}>Severidad</Text>
                                        <Text style={[styles.detailStatValue, { color: getSeverityColor(selectedIncident.severity) }]}>
                                            {selectedIncident.severity}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Botones de acción */}
                            <View style={styles.detailActions}>
                                <TouchableOpacity
                                    style={styles.detailActionButton}
                                    onPress={() => confirmIncident(selectedIncident.id)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#f59e0b" />
                                    <Text style={styles.detailActionText}>Confirmar Incidente</Text>
                                </TouchableOpacity>

                                {selectedIncident.status !== "Atendido" && (
                                    <TouchableOpacity
                                        style={[styles.detailActionButton, styles.resolveButton]}
                                        onPress={() => updateIncidentStatus(selectedIncident.id, "Atendido")}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
                                        <Text style={[styles.detailActionText, { color: "#22c55e" }]}>Marcar como Atendido</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.bottomSpacing} />
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>

            <BottomTabMenu activeTab="Incidentes" onTabPress={handleTabPress} />
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

        paddingBottom: 80, // Espacio para el menú inferior
    },
    header: {
        backgroundColor: "#ffffff",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e293b",
    },
    subtitle: {
        fontSize: 14,
        color: "#64748b",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    loginButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 10,
    },
    loginButtonText: {
        color: "#22c55e",
        fontWeight: "bold",
        marginLeft: 5,
    },
    sosButton: {
        backgroundColor: "#ef4444",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    sosText: {
        color: "#ffffff",
        fontWeight: "bold",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#1e293b",
        paddingVertical: 12,
    },
    filterButton: {
        padding: 10,
    },
    authWarning: {
        backgroundColor: "#fffbeb",
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    authWarningText: {
        color: "#a16207",
        marginLeft: 10,
    },
    loadingContainer: {
        padding: 20,
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#6b7280",
    },
    emergencySection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 15,
    },
    emergencyGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    emergencyCard: {
        width: "48%",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    emergencyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    emergencySubtitle: {
        fontSize: 12,
        color: "#64748b",
    },
    statsSection: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statCard: {
        backgroundColor: "#ffffff",
        width: "30%",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
    },
    categoriesSection: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 10,
    },
    activeCategoryChip: {
        backgroundColor: "#3b82f6",
    },
    categoryIcon: {
        marginRight: 8,
    },
    categoryText: {
        fontSize: 14,
        color: "#64748b",
    },
    activeCategoryText: {
        color: "#ffffff",
    },
    incidentsSection: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    seeAllText: {
        color: "#3b82f6",
        fontSize: 14,
    },
    incidentCard: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    incidentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    incidentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    incidentInfo: {
        flex: 1,
    },
    incidentTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    incidentLocation: {
        fontSize: 12,
        color: "#64748b",
    },
    incidentMeta: {
        alignItems: "flex-end",
    },
    statusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    incidentDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    incidentStat: {
        flexDirection: "row",
        alignItems: "center",
    },
    incidentStatText: {
        fontSize: 12,
        color: "#64748b",
        marginLeft: 5,
    },
    severityBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    severityText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    incidentActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 15,
    },
    actionBtnText: {
        color: "#3b82f6",
        fontSize: 14,
        marginLeft: 5,
    },
    emptyState: {
        alignItems: "center",
        padding: 20,
    },
    emptyStateText: {
        fontSize: 18,
        color: "#6b7280",
        marginTop: 10,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: "#9ca3af",
        marginTop: 5,
        textAlign: "center",
    },
    bottomSpacing: {
        height: 80,
    },
    reportButton: {
        backgroundColor: "#3b82f6",
        position: "absolute",
        bottom: 90,
        right: 20,
        borderRadius: 30,
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
    },
    stepIndicator: {
        backgroundColor: "#e2e8f0",
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    stepText: {
        fontSize: 14,
        color: "#6b7280",
    },
    progressBar: {
        height: 5,
        backgroundColor: "#e2e8f0",
    },
    progressFill: {
        height: 5,
        backgroundColor: "#3b82f6",
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 15,
    },
    categoriesContainer: {
        flex: 1,
    },
    categoryOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    selectedCategoryOption: {
        backgroundColor: "#eff6ff",
    },
    categoryOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    categoryOptionInfo: {
        flex: 1,
    },
    categoryOptionName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    categoryOptionDescription: {
        fontSize: 12,
        color: "#64748b",
    },
    descriptionInput: {
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: "#1e293b",
        marginBottom: 20,
    },
    stepButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    primaryButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    primaryButtonText: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: "#e2e8f0",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    secondaryButtonText: {
        color: "#6b7280",
        fontWeight: "bold",
        fontSize: 16,
    },
    photoContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    selectedPhoto: {
        width: 200,
        height: 150,
        borderRadius: 10,
    },
    removePhotoButton: {
        backgroundColor: "#ef4444",
        position: "absolute",
        top: -10,
        right: -10,
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    photoOptions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
    },
    photoOption: {
        alignItems: "center",
    },
    photoOptionText: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 5,
    },
    mapContainer: {
        height: 250,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        marginBottom: 10,
    },
    map: {
        width: "100%",
        height: "100%",
    },
    currentLocationButton: {
        backgroundColor: "#3b82f6",
        position: "absolute",
        bottom: 10,
        right: 10,
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    locationInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    locationText: {
        fontSize: 14,
        color: "#ef4444",
        marginLeft: 5,
    },
    locationHint: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    locationHintText: {
        fontSize: 14,
        color: "#6b7280",
        marginLeft: 5,
    },
    submitButton: {
        backgroundColor: "#22c55e",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    submitButtonText: {
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: "#9ca3af",
    },
    incidentDetailHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        marginBottom: 15,
    },
    incidentDetailIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15,
    },
    incidentDetailInfo: {
        flex: 1,
    },
    incidentDetailTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 5,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailSectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 10,
    },
    detailDescription: {
        fontSize: 14,
        color: "#64748b",
        lineHeight: 22,
    },
    incidentPhoto: {
        width: "100%",
        height: 200,
        borderRadius: 10,
        marginTop: 10,
    },
    detailAddress: {
        fontSize: 14,
        color: "#3b82f6",
        marginBottom: 10,
    },
    detailMapContainer: {
        height: 200,
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
    },
    detailMap: {
        width: "100%",
        height: "100%",
    },
    openMapButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        flexDirection: "row",
        alignItems: "center",
    },
    openMapText: {
        color: "#3b82f6",
        fontSize: 12,
        marginLeft: 5,
    },
    detailStatsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailStatCard: {
        width: "30%",
        backgroundColor: "#ffffff",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    detailStatLabel: {
        fontSize: 12,
        color: "#64748b",
    },
    detailStatValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    detailActions: {
        marginTop: 20,
    },
    detailActionButton: {
        backgroundColor: "#f9fafb",
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    detailActionText: {
        fontSize: 16,
        color: "#6b7280",
        marginLeft: 10,
    },
    resolveButton: {
        backgroundColor: "#ecfdf5",
        borderColor: "#d1fae5",
    },
})

export default IncidentsScreen
