import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function IncidentDetailScreen({ route, navigation }) {
  const { incident } = route.params;
  const dummyCoords = { latitude: -16.5000, longitude: -68.1500 };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalle de Denuncia</Text>
      <Text>ID: {incident.id}</Text>
      <Text>Tipo: {incident.type}</Text>
      <Text>Fecha: {incident.date}</Text>
      <Text>Status: {incident.status}</Text>
      <Text style={styles.subtitle}>Descripción:</Text>
      <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Text>
      <Text style={styles.subtitle}>Imágenes:</Text>
      <View style={styles.imageContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.image} />
      </View>
      <Text style={styles.subtitle}>Ubicación:</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: dummyCoords.latitude,
          longitude: dummyCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={dummyCoords} />
      </MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginTop: 10, fontWeight: '600' },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  image: { width: 150, height: 150, margin: 5 },
  map: { height: 200, marginVertical: 10 },
  backButton: { alignItems: 'center', marginVertical: 20 },
  backText: { color: '#4FBF67' },
});
