import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function ReportIncidentScreen({ navigation }) {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la galería.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: false });
    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para usar la cámara.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: false });
    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
  };

  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos de ubicación.');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  useEffect(() => { fetchLocation(); }, []);

  const handleSubmit = () => {
    if (!incidentType || (!description && images.length === 0)) {
      Alert.alert('Error', 'Seleccione tipo de incidente y agregue descripción o imagen.');
      return;
    }
    // Aquí implementas la llamada real a la API /denuncias
    Alert.alert('Denuncia enviada', 'Su denuncia ha sido recibida.');
    navigation.navigate('IncidentHistory');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reportar Incidente</Text>
      <TextInput
        style={styles.input}
        placeholder="Tipo de incidente (e.g. Vehículo, Obstáculo)"
        value={incidentType}
        onChangeText={setIncidentType}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descripción breve"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
          <Text>Seleccionar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={takePhoto}>
          <Text>Tomar Foto</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.imagesPreview}>
        {images.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={styles.previewImage} />
        ))}
      </View>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} draggable onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)} />
        </MapView>
      )}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar Denuncia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  smallButton: { backgroundColor: '#eee', padding: 10, borderRadius: 5 },
  imagesPreview: { flexDirection: 'row', flexWrap: 'wrap' },
  previewImage: { width: 80, height: 80, margin: 5 },
  map: { flex: 1, marginVertical: 10 },
  submitButton: { backgroundColor: '#4FBF67', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
