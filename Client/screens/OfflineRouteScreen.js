import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function OfflineRouteScreen({ route, navigation }) {
  const { route: routeData } = route.params;
  // Coordenadas de ejemplo para la polilínea offline
  const polylineCoords = [
    { latitude: -16.5000, longitude: -68.1500 },
    { latitude: -16.4950, longitude: -68.1400 },
  ];
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const handleFinish = () => {
    Alert.alert('Finalizar ruta offline', '¿Deseas salir de navegación offline?', [
      { text: 'No' },
      { text: 'Sí', onPress: () => navigation.replace('Home') },
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={{
        latitude: location ? location.latitude : -16.5000,
        longitude: location ? location.longitude : -68.1500,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}>
        <Polyline coordinates={polylineCoords} strokeWidth={4} strokeColor="#4FBF67" />
        <Marker coordinate={polylineCoords[0]} />
        <Marker coordinate={polylineCoords[polylineCoords.length - 1]} />
      </MapView>
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Gira a la derecha en 200 m</Text>
        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  instructions: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', padding: 15 },
  instructionText: { fontSize: 18, marginBottom: 10 },
  button: { backgroundColor: '#E53E3E', padding: 12, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
