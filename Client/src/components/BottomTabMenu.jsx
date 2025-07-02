
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const BottomTabMenu = ({ activeTab = 'Rutas', onTabPress }) => {
    const navigation = useNavigation();                      // ← importamos el navigation
    const [currentTab, setCurrentTab] = useState(activeTab);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scaleAnims = useRef({
        Rutas: new Animated.Value(1),
        Incidentes: new Animated.Value(1),
        Eventos: new Animated.Value(1),
        Perfil: new Animated.Value(1),
    }).current;

    const tabs = [
        { name: 'Rutas', icon: 'map-outline', activeIcon: 'map', color: '#22c55e' },
        { name: 'Incidentes', icon: 'warning-outline', activeIcon: 'warning', color: '#f59e0b' },
        { name: 'Eventos', icon: 'calendar-outline', activeIcon: 'calendar', color: '#3b82f6' },
        { name: 'Perfil', icon: 'person-outline', activeIcon: 'person', color: '#8b5cf6' },
    ];

    const tabWidth = width / tabs.length;
    const indicatorWidth = tabWidth * 0.85;
    const indicatorOffset = (tabWidth - indicatorWidth) / 2;

    useEffect(() => {
        const tabIndex = tabs.findIndex(tab => tab.name === currentTab);
        Animated.spring(slideAnim, {
            toValue: tabIndex * tabWidth + indicatorOffset,
            useNativeDriver: false,
            tension: 120,
            friction: 8,
        }).start();
    }, [currentTab]);

    const handleTabPress = (tabName) => {
        if (tabName === currentTab) return;

        // escala
        Animated.sequence([
            Animated.timing(scaleAnims[tabName], { toValue: 0.9, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnims[tabName], { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        setCurrentTab(tabName);
        onTabPress?.(tabName);

        // navegación según nombre del tab
        switch (tabName) {
            case 'Rutas':
                navigation.navigate('RoutesScreen');
                break;
            case 'Incidentes':
                navigation.navigate('IncidentsScreen');
                break;
            case 'Eventos':
                navigation.navigate('EventsScreen');
                break;
            case 'Perfil':
                navigation.navigate('ProfileScreen');
                break;
        }
    };

    const getCurrentTabColor = () => {
        const tab = tabs.find(t => t.name === currentTab);
        return tab?.color ?? '#22c55e';
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[styles.activeIndicator, {
                    left: slideAnim,
                    width: indicatorWidth,
                    backgroundColor: getCurrentTabColor(),
                }]}
            />
            {tabs.map(tab => {
                const isActive = tab.name === currentTab;
                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={[styles.tab, { width: tabWidth }]}
                        onPress={() => handleTabPress(tab.name)}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnims[tab.name] }] }]}>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={isActive ? tab.activeIcon : tab.icon}
                                    size={24}
                                    color={isActive ? '#fff' : '#6b7280'}
                                />
                            </View>
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab.name}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingTop: 12,
        paddingHorizontal: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    activeIndicator: {
        position: 'absolute',
        top: 6, // Más arriba para empezar desde el icono
        height: 90, // MÁS ALTO - cubre icono (24px) + espacio (8px) + texto (14px) + padding extra
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        zIndex: 2,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
        minHeight: 68, // Coincide con la altura del indicador
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8, // Más espacio entre icono y texto
        height: 24,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 14,
    },
    activeTabText: {
        color: '#ffffff',
        fontWeight: '700',
    },
});

export default BottomTabMenu;