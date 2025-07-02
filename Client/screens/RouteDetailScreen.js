import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

export default function RouteDetailScreen({ route, navigation }) {
  const { route: routeData } = route.params;
  const initialRegion = {
    latitude: -16.5000,
    longitude: -68.1500,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  // Coordenadas de ejemplo para la polilínea
  const polylineCoords = [
    { latitude: -16.5000, longitude: -68.1500 },
    { latitude: -16.4950, longitude: -68.1400 },
  ];

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Polyline coordinates={polylineCoords} strokeWidth={4} strokeColor="#4FBF67" />
        <Marker coordinate={polylineCoords[0]} />
        <Marker coordinate={polylineCoords[polylineCoords.length - 1]} />
      </MapView>
      <View style={styles.info}>
        <Text style={styles.title}>{routeData.name}</Text>
        <Text>Distancia: {routeData.distance}</Text>
        <Text>Tiempo: {routeData.time}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RouteNavigation', { route: routeData })}>
          <Text style={styles.buttonText}>Iniciar Navegación</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('ReportIncident')}>
          <Text style={styles.buttonSecondaryText}>Reportar Incidente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  info: { padding: 15, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  button: { backgroundColor: '#4FBF67', padding: 12, borderRadius: 5, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#eee', padding: 12, borderRadius: 5, marginTop: 10 },
  buttonSecondaryText: { color: '#333', textAlign: 'center' },
  backButton: { marginTop: 10, alignItems: 'center' },
  backText: { color: '#4FBF67' },
});
