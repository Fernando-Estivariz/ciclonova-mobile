"use client"

import { useState } from "react"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Modal,
    Image,
    FlatList,
    Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Polyline, Marker } from "react-native-maps"
import BottomTabMenu from "../components/BottomTabMenu"

const { width, height } = Dimensions.get("window")

const EventsScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [activeFilter, setActiveFilter] = useState("Todas")
    const [showRouteModal, setShowRouteModal] = useState(false)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [joinedRoutes, setJoinedRoutes] = useState(["route-1", "route-3"])

    // Datos de ejemplo de rutas/eventos con fechas específicas
    const routes = [
        {
            id: "route-1",
            title: "Ruta Matinal Chapinero",
            description: "Recorrido urbano por las calles de Chapinero con paradas en cafeterías locales",
            date: "2025-06-15",
            time: "06:30",
            duration: "2h 30min",
            distance: "25 km",
            difficulty: "Intermedio",
            maxParticipants: 15,
            currentParticipants: 8,
            organizer: {
                name: "Carlos Mendoza",
                avatar: "/placeholder.svg?height=40&width=40&text=CM",
                rating: 4.8,
                routes: 23,
            },
            meetingPoint: {
                name: "Parque de la 93",
                address: "Calle 93 #11-27, Bogotá",
                latitude: 4.6762,
                longitude: -74.0482,
            },
            route: [
                { latitude: 4.6762, longitude: -74.0482 },
                { latitude: 4.6801, longitude: -74.0445 },
                { latitude: 4.6834, longitude: -74.0398 },
                { latitude: 4.6889, longitude: -74.0356 },
                { latitude: 4.6923, longitude: -74.0334 },
                { latitude: 4.6945, longitude: -74.0378 },
                { latitude: 4.6912, longitude: -74.0423 },
                { latitude: 4.6876, longitude: -74.0467 },
                { latitude: 4.6762, longitude: -74.0482 },
            ],
            highlights: ["Mirador de Monserrate", "Zona Rosa", "Parque Virrey"],
            price: "Gratis",
            category: "Urbano",
            image: "/placeholder.svg?height=200&width=300&text=Ruta+Chapinero",
        },
        {
            id: "route-2",
            title: "Aventura La Calera",
            description: "Ruta de montaña con subidas desafiantes y vistas espectaculares de la sabana",
            date: "2025-06-15",
            time: "07:00",
            duration: "4h 15min",
            distance: "45 km",
            difficulty: "Avanzado",
            maxParticipants: 12,
            currentParticipants: 5,
            organizer: {
                name: "Ana Rodríguez",
                avatar: "/placeholder.svg?height=40&width=40&text=AR",
                rating: 4.9,
                routes: 31,
            },
            meetingPoint: {
                name: "Portal Norte",
                address: "Autopista Norte, Bogotá",
                latitude: 4.711,
                longitude: -74.0721,
            },
            route: [
                { latitude: 4.711, longitude: -74.0721 },
                { latitude: 4.7234, longitude: -74.0654 },
                { latitude: 4.7389, longitude: -74.0567 },
                { latitude: 4.7456, longitude: -74.0489 },
                { latitude: 4.7523, longitude: -74.0398 },
                { latitude: 4.7589, longitude: -74.0334 },
                { latitude: 4.7634, longitude: -74.0278 },
                { latitude: 4.7567, longitude: -74.0356 },
                { latitude: 4.7456, longitude: -74.0445 },
                { latitude: 4.7234, longitude: -74.0598 },
                { latitude: 4.711, longitude: -74.0721 },
            ],
            highlights: ["Mirador La Calera", "Embalse San Rafael", "Pueblo La Calera"],
            price: "$15.000",
            category: "Montaña",
            image: "/placeholder.svg?height=200&width=300&text=La+Calera",
        },
        {
            id: "route-3",
            title: "Ciclovía Dominical",
            description: "Recorrido familiar por la ciclovía de Bogotá, perfecto para principiantes",
            date: "2025-06-09", // Domingo
            time: "08:00",
            duration: "3h 00min",
            distance: "35 km",
            difficulty: "Principiante",
            maxParticipants: 25,
            currentParticipants: 18,
            organizer: {
                name: "Miguel Torres",
                avatar: "/placeholder.svg?height=40&width=40&text=MT",
                rating: 4.7,
                routes: 15,
            },
            meetingPoint: {
                name: "Parque Simón Bolívar",
                address: "Calle 63 #68-95, Bogotá",
                latitude: 4.6486,
                longitude: -74.0918,
            },
            route: [
                { latitude: 4.6486, longitude: -74.0918 },
                { latitude: 4.6523, longitude: -74.0834 },
                { latitude: 4.6589, longitude: -74.0756 },
                { latitude: 4.6634, longitude: -74.0678 },
                { latitude: 4.6678, longitude: -74.0598 },
                { latitude: 4.6712, longitude: -74.0523 },
                { latitude: 4.6745, longitude: -74.0456 },
                { latitude: 4.6712, longitude: -74.0523 },
                { latitude: 4.6678, longitude: -74.0598 },
                { latitude: 4.6634, longitude: -74.0678 },
                { latitude: 4.6589, longitude: -74.0756 },
                { latitude: 4.6523, longitude: -74.0834 },
                { latitude: 4.6486, longitude: -74.0918 },
            ],
            highlights: ["Museo Nacional", "Plaza de Bolívar", "Candelaria"],
            price: "Gratis",
            category: "Familiar",
            image: "/placeholder.svg?height=200&width=300&text=Ciclovia+Dominical",
        },
        {
            id: "route-4",
            title: "Ruta Nocturna Centro",
            description: "Experiencia única pedaleando por el centro histórico iluminado",
            date: "2025-06-18",
            time: "19:00",
            duration: "2h 00min",
            distance: "18 km",
            difficulty: "Intermedio",
            maxParticipants: 20,
            currentParticipants: 12,
            organizer: {
                name: "Laura Gómez",
                avatar: "/placeholder.svg?height=40&width=40&text=LG",
                rating: 4.6,
                routes: 19,
            },
            meetingPoint: {
                name: "Plaza de Armas",
                address: "Carrera 8 #8-00, Bogotá",
                latitude: 4.5981,
                longitude: -74.0758,
            },
            route: [
                { latitude: 4.5981, longitude: -74.0758 },
                { latitude: 4.6012, longitude: -74.0723 },
                { latitude: 4.6045, longitude: -74.0689 },
                { latitude: 4.6078, longitude: -74.0654 },
                { latitude: 4.6089, longitude: -74.0698 },
                { latitude: 4.6067, longitude: -74.0734 },
                { latitude: 4.6034, longitude: -74.0767 },
                { latitude: 4.5981, longitude: -74.0758 },
            ],
            highlights: ["Catedral Primada", "Casa de Nariño", "Teatro Colón"],
            price: "$12.000",
            category: "Nocturno",
            image: "/placeholder.svg?height=200&width=300&text=Ruta+Nocturna",
        },
        // Agregar más rutas para diferentes fechas
        {
            id: "route-5",
            title: "Ruta Sabatina Usaquén",
            description: "Mercado de pulgas y gastronomía local en bicicleta",
            date: "2025-06-08", // Sábado
            time: "09:00",
            duration: "3h 30min",
            distance: "22 km",
            difficulty: "Fácil",
            maxParticipants: 20,
            currentParticipants: 14,
            organizer: {
                name: "Pedro Ramírez",
                avatar: "/placeholder.svg?height=40&width=40&text=PR",
                rating: 4.5,
                routes: 18,
            },
            meetingPoint: {
                name: "Parque Usaquén",
                address: "Carrera 15 #119-25, Bogotá",
                latitude: 4.6951,
                longitude: -74.0309,
            },
            route: [
                { latitude: 4.6951, longitude: -74.0309 },
                { latitude: 4.6978, longitude: -74.0278 },
                { latitude: 4.7012, longitude: -74.0245 },
                { latitude: 4.7045, longitude: -74.0289 },
                { latitude: 4.7023, longitude: -74.0334 },
                { latitude: 4.6989, longitude: -74.0356 },
                { latitude: 4.6951, longitude: -74.0309 },
            ],
            highlights: ["Mercado de Pulgas", "Iglesia de Usaquén", "Zona T"],
            price: "Gratis",
            category: "Urbano",
            image: "/placeholder.svg?height=200&width=300&text=Usaquen",
        },
        {
            id: "route-6",
            title: "Desafío Patios",
            description: "Ruta extrema para ciclistas experimentados",
            date: "2025-06-09", // Lunes
            time: "05:30",
            duration: "5h 00min",
            distance: "65 km",
            difficulty: "Avanzado",
            maxParticipants: 8,
            currentParticipants: 3,
            organizer: {
                name: "Roberto Silva",
                avatar: "/placeholder.svg?height=40&width=40&text=RS",
                rating: 4.9,
                routes: 42,
            },
            meetingPoint: {
                name: "Terminal del Norte",
                address: "Autopista Norte #75-00, Bogotá",
                latitude: 4.7234,
                longitude: -74.0654,
            },
            route: [
                { latitude: 4.7234, longitude: -74.0654 },
                { latitude: 4.7456, longitude: -74.0523 },
                { latitude: 4.7678, longitude: -74.0398 },
                { latitude: 4.7823, longitude: -74.0289 },
                { latitude: 4.7945, longitude: -74.0178 },
                { latitude: 4.8067, longitude: -74.0067 },
                { latitude: 4.7945, longitude: -74.0178 },
                { latitude: 4.7823, longitude: -74.0289 },
                { latitude: 4.7678, longitude: -74.0398 },
                { latitude: 4.7456, longitude: -74.0523 },
                { latitude: 4.7234, longitude: -74.0654 },
            ],
            highlights: ["Mirador Patios", "Páramo de Sumapaz", "Cascada El Salto"],
            price: "$25.000",
            category: "Montaña",
            image: "/placeholder.svg?height=200&width=300&text=Patios",
        },
    ]

    // Filtros disponibles
    const filters = [
        { name: "Todas", icon: "grid-outline", color: "#6b7280" },
        { name: "Urbano", icon: "business-outline", color: "#3b82f6" },
        { name: "Montaña", icon: "triangle-outline", color: "#22c55e" },
        { name: "Familiar", icon: "people-outline", color: "#f59e0b" },
        { name: "Nocturno", icon: "moon-outline", color: "#8b5cf6" },
    ]

    // Funciones del calendario
    const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ]

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Agregar días vacíos al inicio
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Agregar días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    const changeMonth = (direction) => {
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(currentMonth.getMonth() + direction)
        setCurrentMonth(newMonth)
    }

    const formatDateForComparison = (date) => {
        return date.toISOString().split("T")[0]
    }

    const getRoutesForDate = (date) => {
        if (!date) return []
        const dateString = formatDateForComparison(date)
        return routes.filter((route) => route.date === dateString)
    }

    const hasRoutesOnDate = (date) => {
        if (!date) return false
        return getRoutesForDate(date).length > 0
    }

    const isDateSelected = (date) => {
        if (!date) return false
        return formatDateForComparison(date) === formatDateForComparison(selectedDate)
    }

    const isToday = (date) => {
        if (!date) return false
        const today = new Date()
        return formatDateForComparison(date) === formatDateForComparison(today)
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Principiante":
                return "#22c55e"
            case "Intermedio":
                return "#f59e0b"
            case "Avanzado":
                return "#ef4444"
            default:
                return "#6b7280"
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
        })
    }

    const isRouteJoined = (routeId) => {
        return joinedRoutes.includes(routeId)
    }

    const handleJoinRoute = (routeId) => {
        if (isRouteJoined(routeId)) {
            setJoinedRoutes(joinedRoutes.filter((id) => id !== routeId))
            Alert.alert("Te has salido de la ruta", "Ya no participarás en este evento")
        } else {
            setJoinedRoutes([...joinedRoutes, routeId])
            Alert.alert("¡Te has unido!", "Te has inscrito exitosamente a esta ruta")
        }
    }

    const openRouteDetails = (route) => {
        setSelectedRoute(route)
        setShowRouteModal(true)
    }

    const handleTabPress = (tabName) => {
        console.log("Tab pressed:", tabName)
    }

    // Filtrar rutas por fecha seleccionada y filtro activo
    const getFilteredRoutes = () => {
        const routesForDate = getRoutesForDate(selectedDate)

        if (activeFilter === "Todas") {
            return routesForDate
        }

        return routesForDate.filter((route) => route.category === activeFilter)
    }

    const renderCalendarDay = (date, index) => {
        if (!date) {
            return <View key={index} style={styles.emptyCalendarDay} />
        }

        const hasRoutes = hasRoutesOnDate(date)
        const isSelected = isDateSelected(date)
        const isTodayDate = isToday(date)

        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.calendarDay,
                    isSelected && styles.selectedCalendarDay,
                    isTodayDate && styles.todayCalendarDay,
                    hasRoutes && styles.calendarDayWithRoutes,
                ]}
                onPress={() => setSelectedDate(date)}
            >
                <Text
                    style={[
                        styles.calendarDayText,
                        isSelected && styles.selectedCalendarDayText,
                        isTodayDate && styles.todayCalendarDayText,
                    ]}
                >
                    {date.getDate()}
                </Text>
                {hasRoutes && (
                    <View style={[styles.routeIndicator, isSelected && styles.selectedRouteIndicator]}>
                        <Text style={styles.routeIndicatorText}>{getRoutesForDate(date).length}</Text>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    const renderRouteCard = ({ item: route }) => {
        const joined = isRouteJoined(route.id)

        return (
            <TouchableOpacity style={styles.routeCard} onPress={() => openRouteDetails(route)}>
                <Image source={{ uri: route.image }} style={styles.routeImage} />

                {/* Badge de categoría */}
                <View style={[styles.categoryBadge, { backgroundColor: getDifficultyColor(route.difficulty) }]}>
                    <Text style={styles.categoryBadgeText}>{route.difficulty}</Text>
                </View>

                {/* Badge de precio */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>{route.price}</Text>
                </View>

                <View style={styles.routeContent}>
                    <View style={styles.routeHeader}>
                        <Text style={styles.routeTitle}>{route.title}</Text>
                        <TouchableOpacity
                            style={[styles.joinButton, joined && styles.joinedButton]}
                            onPress={() => handleJoinRoute(route.id)}
                        >
                            <Ionicons name={joined ? "checkmark" : "add"} size={16} color={joined ? "#22c55e" : "#ffffff"} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.routeDescription} numberOfLines={2}>
                        {route.description}
                    </Text>

                    <View style={styles.routeStats}>
                        <View style={styles.routeStat}>
                            <Ionicons name="time-outline" size={14} color="#6b7280" />
                            <Text style={styles.routeStatText}>{route.time}</Text>
                        </View>
                        <View style={styles.routeStat}>
                            <Ionicons name="speedometer-outline" size={14} color="#6b7280" />
                            <Text style={styles.routeStatText}>{route.distance}</Text>
                        </View>
                        <View style={styles.routeStat}>
                            <Ionicons name="hourglass-outline" size={14} color="#6b7280" />
                            <Text style={styles.routeStatText}>{route.duration}</Text>
                        </View>
                    </View>

                    <View style={styles.routeFooter}>
                        <View style={styles.organizerInfo}>
                            <Image source={{ uri: route.organizer.avatar }} style={styles.organizerAvatar} />
                            <View>
                                <Text style={styles.organizerName}>{route.organizer.name}</Text>
                                <View style={styles.organizerRating}>
                                    <Ionicons name="star" size={12} color="#f59e0b" />
                                    <Text style={styles.organizerRatingText}>{route.organizer.rating}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.participantsInfo}>
                            <Ionicons name="people-outline" size={16} color="#6b7280" />
                            <Text style={styles.participantsText}>
                                {route.currentParticipants}/{route.maxParticipants}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const filteredRoutes = getFilteredRoutes()

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>🚴‍♂️ Eventos Ciclísticos</Text>
                            <Text style={styles.subtitle}>Únete a rutas grupales increíbles</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Estadísticas del usuario */}
                <View style={styles.userStatsSection}>
                    <View style={styles.userStatsGrid}>
                        <View style={styles.userStatCard}>
                            <Ionicons name="bicycle" size={20} color="#22c55e" />
                            <Text style={styles.userStatNumber}>12</Text>
                            <Text style={styles.userStatLabel}>Rutas Unidas</Text>
                        </View>
                        <View style={styles.userStatCard}>
                            <Ionicons name="trophy" size={20} color="#f59e0b" />
                            <Text style={styles.userStatNumber}>340</Text>
                            <Text style={styles.userStatLabel}>Km Recorridos</Text>
                        </View>
                        <View style={styles.userStatCard}>
                            <Ionicons name="people" size={20} color="#3b82f6" />
                            <Text style={styles.userStatNumber}>28</Text>
                            <Text style={styles.userStatLabel}>Ciclistas Conocidos</Text>
                        </View>
                    </View>
                </View>

                {/* Calendario Completo */}
                <View style={styles.calendarSection}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity style={styles.monthNavButton} onPress={() => changeMonth(-1)}>
                            <Ionicons name="chevron-back" size={24} color="#22c55e" />
                        </TouchableOpacity>

                        <Text style={styles.monthTitle}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>

                        <TouchableOpacity style={styles.monthNavButton} onPress={() => changeMonth(1)}>
                            <Ionicons name="chevron-forward" size={24} color="#22c55e" />
                        </TouchableOpacity>
                    </View>

                    {/* Nombres de los días */}
                    <View style={styles.dayNamesRow}>
                        {dayNames.map((dayName, index) => (
                            <View key={index} style={styles.dayNameCell}>
                                <Text style={styles.dayNameText}>{dayName}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Grid del calendario */}
                    <View style={styles.calendarGrid}>
                        {getDaysInMonth(currentMonth).map((date, index) => renderCalendarDay(date, index))}
                    </View>

                    {/* Leyenda */}
                    <View style={styles.calendarLegend}>
                        <View style={styles.legendItem}>
                            <View style={styles.legendDot} />
                            <Text style={styles.legendText}>Días con eventos</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                            <Text style={styles.legendText}>Hoy</Text>
                        </View>
                    </View>
                </View>

                {/* Fecha seleccionada */}
                <View style={styles.selectedDateSection}>
                    <Text style={styles.selectedDateTitle}>
                        📅{" "}
                        {selectedDate.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </Text>
                    <Text style={styles.selectedDateSubtitle}>
                        {filteredRoutes.length} evento{filteredRoutes.length !== 1 ? "s" : ""} disponible
                        {filteredRoutes.length !== 1 ? "s" : ""}
                    </Text>
                </View>

                {/* Filtros */}
                {filteredRoutes.length > 0 && (
                    <View style={styles.filtersSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {filters.map((filter) => (
                                <TouchableOpacity
                                    key={filter.name}
                                    style={[styles.filterChip, activeFilter === filter.name && styles.activeFilterChip]}
                                    onPress={() => setActiveFilter(filter.name)}
                                >
                                    <Ionicons
                                        name={filter.icon}
                                        size={18}
                                        color={activeFilter === filter.name ? "#ffffff" : filter.color}
                                        style={styles.filterIcon}
                                    />
                                    <Text style={[styles.filterText, activeFilter === filter.name && styles.activeFilterText]}>
                                        {filter.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Lista de rutas para la fecha seleccionada */}
                <View style={styles.routesSection}>
                    {filteredRoutes.length > 0 ? (
                        <FlatList
                            data={filteredRoutes}
                            renderItem={renderRouteCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.routesList}
                        />
                    ) : (
                        <View style={styles.noRoutesContainer}>
                            <Ionicons name="calendar-outline" size={60} color="#9ca3af" />
                            <Text style={styles.noRoutesTitle}>No hay eventos este día</Text>
                            <Text style={styles.noRoutesSubtitle}>Selecciona otra fecha o explora los próximos eventos</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Modal de detalles de ruta */}
            <Modal
                visible={showRouteModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowRouteModal(false)}
            >
                {selectedRoute && (
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowRouteModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Detalles de la Ruta</Text>
                            <TouchableOpacity
                                style={[styles.modalJoinButton, isRouteJoined(selectedRoute.id) && styles.modalJoinedButton]}
                                onPress={() => handleJoinRoute(selectedRoute.id)}
                            >
                                <Ionicons name={isRouteJoined(selectedRoute.id) ? "checkmark" : "add"} size={16} color="#ffffff" />
                                <Text style={styles.modalJoinButtonText}>{isRouteJoined(selectedRoute.id) ? "Unido" : "Unirse"}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Mapa de la ruta */}
                            <View style={styles.routeMapContainer}>
                                <MapView
                                    style={styles.routeMap}
                                    initialRegion={{
                                        latitude: selectedRoute.meetingPoint.latitude,
                                        longitude: selectedRoute.meetingPoint.longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                >
                                    {/* Polyline de la ruta */}
                                    <Polyline
                                        coordinates={selectedRoute.route}
                                        strokeColor="#22c55e"
                                        strokeWidth={4}
                                        lineDashPattern={[5, 5]}
                                    />

                                    {/* Marcador de punto de encuentro */}
                                    <Marker
                                        coordinate={selectedRoute.meetingPoint}
                                        title="Punto de Encuentro"
                                        description={selectedRoute.meetingPoint.name}
                                    >
                                        <View style={styles.startMarker}>
                                            <Ionicons name="flag" size={16} color="#ffffff" />
                                        </View>
                                    </Marker>

                                    {/* Marcador de llegada */}
                                    <Marker coordinate={selectedRoute.route[selectedRoute.route.length - 1]} title="Punto de Llegada">
                                        <View style={styles.endMarker}>
                                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                                        </View>
                                    </Marker>
                                </MapView>
                            </View>

                            {/* Información detallada */}
                            <View style={styles.routeDetails}>
                                <Text style={styles.routeDetailTitle}>{selectedRoute.title}</Text>
                                <Text style={styles.routeDetailDescription}>{selectedRoute.description}</Text>

                                {/* Estadísticas detalladas */}
                                <View style={styles.detailStatsGrid}>
                                    <View style={styles.detailStat}>
                                        <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                                        <Text style={styles.detailStatLabel}>Fecha</Text>
                                        <Text style={styles.detailStatValue}>{formatDate(selectedRoute.date)}</Text>
                                    </View>
                                    <View style={styles.detailStat}>
                                        <Ionicons name="time-outline" size={20} color="#f59e0b" />
                                        <Text style={styles.detailStatLabel}>Hora</Text>
                                        <Text style={styles.detailStatValue}>{selectedRoute.time}</Text>
                                    </View>
                                    <View style={styles.detailStat}>
                                        <Ionicons name="speedometer-outline" size={20} color="#22c55e" />
                                        <Text style={styles.detailStatLabel}>Distancia</Text>
                                        <Text style={styles.detailStatValue}>{selectedRoute.distance}</Text>
                                    </View>
                                    <View style={styles.detailStat}>
                                        <Ionicons name="hourglass-outline" size={20} color="#8b5cf6" />
                                        <Text style={styles.detailStatLabel}>Duración</Text>
                                        <Text style={styles.detailStatValue}>{selectedRoute.duration}</Text>
                                    </View>
                                </View>

                                {/* Puntos destacados */}
                                <View style={styles.highlightsSection}>
                                    <Text style={styles.highlightsTitle}>🎯 Puntos Destacados</Text>
                                    {selectedRoute.highlights.map((highlight, index) => (
                                        <View key={index} style={styles.highlightItem}>
                                            <Ionicons name="location" size={16} color="#22c55e" />
                                            <Text style={styles.highlightText}>{highlight}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Información del organizador */}
                                <View style={styles.organizerSection}>
                                    <Text style={styles.organizerSectionTitle}>👤 Organizador</Text>
                                    <View style={styles.organizerDetailCard}>
                                        <Image source={{ uri: selectedRoute.organizer.avatar }} style={styles.organizerDetailAvatar} />
                                        <View style={styles.organizerDetailInfo}>
                                            <Text style={styles.organizerDetailName}>{selectedRoute.organizer.name}</Text>
                                            <View style={styles.organizerDetailStats}>
                                                <View style={styles.organizerDetailStat}>
                                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                                    <Text style={styles.organizerDetailStatText}>{selectedRoute.organizer.rating}</Text>
                                                </View>
                                                <View style={styles.organizerDetailStat}>
                                                    <Ionicons name="map" size={14} color="#3b82f6" />
                                                    <Text style={styles.organizerDetailStatText}>{selectedRoute.organizer.routes} rutas</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Punto de encuentro */}
                                <View style={styles.meetingPointSection}>
                                    <Text style={styles.meetingPointTitle}>📍 Punto de Encuentro</Text>
                                    <View style={styles.meetingPointCard}>
                                        <Ionicons name="location" size={20} color="#ef4444" />
                                        <View style={styles.meetingPointInfo}>
                                            <Text style={styles.meetingPointName}>{selectedRoute.meetingPoint.name}</Text>
                                            <Text style={styles.meetingPointAddress}>{selectedRoute.meetingPoint.address}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>

            <BottomTabMenu activeTab="Eventos" onTabPress={handleTabPress} />
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
    notificationButton: {
        position: "relative",
        padding: 8,
    },
    notificationBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "#ef4444",
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationBadgeText: {
        color: "#ffffff",
        fontSize: 10,
        fontWeight: "bold",
    },
    userStatsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    userStatsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    userStatCard: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userStatNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginTop: 8,
    },
    userStatLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 4,
        textAlign: "center",
    },
    calendarSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    monthNavButton: {
        padding: 8,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1f2937",
    },
    dayNamesRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    dayNameCell: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
    },
    dayNameText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6b7280",
    },
    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    calendarDay: {
        width: (width - 56) / 7, // 7 días por semana
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        margin: 2,
        position: "relative",
    },
    emptyCalendarDay: {
        width: (width - 56) / 7,
        height: 50,
        margin: 2,
    },
    selectedCalendarDay: {
        backgroundColor: "#22c55e",
    },
    todayCalendarDay: {
        backgroundColor: "#3b82f6",
    },
    calendarDayWithRoutes: {
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#22c55e",
    },
    calendarDayText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
    },
    selectedCalendarDayText: {
        color: "#ffffff",
    },
    todayCalendarDayText: {
        color: "#ffffff",
    },
    routeIndicator: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: "#22c55e",
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    selectedRouteIndicator: {
        backgroundColor: "#ffffff",
    },
    routeIndicatorText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#ffffff",
    },
    calendarLegend: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 12,
        gap: 20,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#22c55e",
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: "#6b7280",
    },
    selectedDateSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    selectedDateTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        textTransform: "capitalize",
    },
    selectedDateSubtitle: {
        fontSize: 14,
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
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    activeFilterChip: {
        backgroundColor: "#22c55e",
        borderColor: "#22c55e",
    },
    filterIcon: {
        marginRight: 6,
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
    routesList: {
        paddingBottom: 20,
    },
    noRoutesContainer: {
        alignItems: "center",
        paddingVertical: 40,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginBottom: 20,
    },
    noRoutesTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6b7280",
        marginTop: 16,
    },
    noRoutesSubtitle: {
        fontSize: 14,
        color: "#9ca3af",
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    routeCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    routeImage: {
        width: "100%",
        height: 160,
        backgroundColor: "#f3f4f6",
    },
    categoryBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "600",
    },
    priceBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "#1f2937",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceBadgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "600",
    },
    routeContent: {
        padding: 16,
    },
    routeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    routeTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        flex: 1,
        marginRight: 12,
    },
    joinButton: {
        backgroundColor: "#22c55e",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    joinedButton: {
        backgroundColor: "#f0fdf4",
        borderWidth: 2,
        borderColor: "#22c55e",
    },
    routeDescription: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 12,
        lineHeight: 20,
    },
    routeStats: {
        flexDirection: "row",
        marginBottom: 16,
    },
    routeStat: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
    },
    routeStatText: {
        fontSize: 12,
        color: "#6b7280",
        marginLeft: 4,
    },
    routeFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    organizerInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    organizerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: "#f3f4f6",
    },
    organizerName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f2937",
    },
    organizerRating: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    organizerRatingText: {
        fontSize: 12,
        color: "#6b7280",
        marginLeft: 4,
    },
    participantsInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    participantsText: {
        fontSize: 12,
        color: "#6b7280",
        marginLeft: 4,
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
    modalJoinButton: {
        backgroundColor: "#22c55e",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    modalJoinedButton: {
        backgroundColor: "#6b7280",
    },
    modalJoinButtonText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    modalContent: {
        flex: 1,
    },
    routeMapContainer: {
        height: 250,
        margin: 20,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    routeMap: {
        flex: 1,
    },
    startMarker: {
        backgroundColor: "#22c55e",
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#ffffff",
    },
    endMarker: {
        backgroundColor: "#ef4444",
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#ffffff",
    },
    routeDetails: {
        padding: 20,
    },
    routeDetailTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
    },
    routeDetailDescription: {
        fontSize: 16,
        color: "#6b7280",
        lineHeight: 24,
        marginBottom: 24,
    },
    detailStatsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    detailStat: {
        backgroundColor: "#f9fafb",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        width: (width - 60) / 2,
        marginBottom: 12,
    },
    detailStatLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 8,
    },
    detailStatValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1f2937",
        marginTop: 4,
    },
    highlightsSection: {
        marginBottom: 24,
    },
    highlightsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 12,
    },
    highlightItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    highlightText: {
        fontSize: 14,
        color: "#6b7280",
        marginLeft: 8,
    },
    organizerSection: {
        marginBottom: 24,
    },
    organizerSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 12,
    },
    organizerDetailCard: {
        backgroundColor: "#f9fafb",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    organizerDetailAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
        backgroundColor: "#e5e7eb",
    },
    organizerDetailInfo: {
        flex: 1,
    },
    organizerDetailName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    organizerDetailStats: {
        flexDirection: "row",
    },
    organizerDetailStat: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
    },
    organizerDetailStatText: {
        fontSize: 12,
        color: "#6b7280",
        marginLeft: 4,
    },
    meetingPointSection: {
        marginBottom: 24,
    },
    meetingPointTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 12,
    },
    meetingPointCard: {
        backgroundColor: "#fef2f2",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
    },
    meetingPointInfo: {
        marginLeft: 12,
        flex: 1,
    },
    meetingPointName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    meetingPointAddress: {
        fontSize: 14,
        color: "#6b7280",
    },
    bottomSpacing: {
        height: 100,
    },
})

export default EventsScreen
