import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

export default function EventDetailScreen({ route, navigation }) {
  const { event } = route.params;
  const dummyCoords = [
    { latitude: -16.5000, longitude: -68.1500 },
    { latitude: -16.4950, longitude: -68.1400 },
  ];

  const handleJoin = () => {
    Alert.alert('Inscripción exitosa', `Te uniste al evento ${event.name}`);
  };

  const handleLeave = () => {
    Alert.alert(
      'Cancelar inscripción',
      '¿Seguro que deseas cancelar tu inscripción?',
      [
        { text: 'No' },
        { text: 'Sí', onPress: () => Alert.alert('Inscripción cancelada') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <MapView style={styles.map} initialRegion={{
        latitude: dummyCoords[0].latitude,
        longitude: dummyCoords[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}>
        <Polyline coordinates={dummyCoords} strokeWidth={4} strokeColor="#4FBF67" />
        <Marker coordinate={dummyCoords[0]} title="Inicio" />
      </MapView>
      <View style={styles.info}>
        <Text>Fecha: {event.date} · Hora: {event.time}</Text>
        <Text>Cupo: {event.registered}/{event.capacity}</Text>
        <TouchableOpacity style={styles.button} onPress={handleJoin}>
          <Text style={styles.buttonText}>Unirse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleLeave}>
          <Text style={styles.buttonSecondaryText}>Salir del Evento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={() => Alert.alert('Compartir', 'Abrir diálogo para compartir')}>
          <Text style={styles.shareText}>Compartir</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  map: { height: 200, marginVertical: 10 },
  info: { padding: 15 },
  button: { backgroundColor: '#4FBF67', padding: 12, borderRadius: 5, marginVertical: 5 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#E53E3E', padding: 12, borderRadius: 5, marginVertical: 5 },
  buttonSecondaryText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  shareButton: { backgroundColor: '#eee', padding: 12, borderRadius: 5, marginVertical: 5 },
  shareText: { color: '#333', textAlign: 'center' },
  backButton: { alignItems: 'center', marginVertical: 20 },
  backText: { color: '#4FBF67' },
});
