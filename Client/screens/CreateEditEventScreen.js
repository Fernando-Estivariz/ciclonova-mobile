import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateEditEventScreen({ route, navigation }) {
  const { eventToEdit } = route.params || {};
  const [name, setName] = useState(eventToEdit ? eventToEdit.name : '');
  const [description, setDescription] = useState(eventToEdit ? eventToEdit.description : '');
  const [date, setDate] = useState(eventToEdit ? new Date(eventToEdit.date) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [coords, setCoords] = useState(eventToEdit ? { latitude: -16.5000, longitude: -68.1500 } : null);
  const [drawing, setDrawing] = useState(false);
  const [polylineCoords, setPolylineCoords] = useState(
    eventToEdit
      ? [
          { latitude: -16.5000, longitude: -68.1500 },
          { latitude: -16.4950, longitude: -68.1400 },
        ]
      : []
  );

  const onMapPress = (e) => {
    if (!drawing && !coords) {
      setCoords(e.nativeEvent.coordinate);
    }
    if (drawing) {
      setPolylineCoords([...polylineCoords, e.nativeEvent.coordinate]);
    }
  };

  const toggleDrawing = () => setDrawing(!drawing);

  const handleSave = () => {
    if (!name || !coords || polylineCoords.length < 2) {
      Alert.alert('Error', 'Complete todos los campos obligatorios.');
      return;
    }
    // Aquí implementas la llamada real a la API (POST o PUT)
    Alert.alert('Evento guardado', `Evento "${name}" ha sido creado/actualizado.`);
    navigation.navigate('EventsList');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{eventToEdit ? 'Editar Evento' : 'Crear Evento'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del evento"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descripción breve"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePicker}>
        <Text>Fecha: {date.toLocaleDateString()}  Hora: {date.toLocaleTimeString()}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      <Text style={styles.subtitle}>Seleccionar Punto de Encuentro:</Text>
      <MapView
        style={styles.map}
        onPress={onMapPress}
        initialRegion={{
          latitude: coords ? coords.latitude : -16.5000,
          longitude: coords ? coords.longitude : -68.1500,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {coords && <Marker coordinate={coords} draggable onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)} />}
        {polylineCoords.length > 1 && <Polyline coordinates={polylineCoords} strokeWidth={4} strokeColor="#4FBF67" />}
      </MapView>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.smallButton} onPress={toggleDrawing}>
          <Text>{drawing ? 'Detener Dibujo' : 'Dibujar Ruta'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Cupo máximo"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{eventToEdit ? 'Guardar Cambios' : 'Publicar Evento'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 5 },
  datePicker: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginVertical: 5 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  map: { height: 200, marginVertical: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-start', marginVertical: 10 },
  smallButton: { backgroundColor: '#eee', padding: 10, borderRadius: 5 },
  button: { backgroundColor: '#4FBF67', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { alignItems: 'center', marginVertical: 20 },
  backText: { color: '#4FBF67' },
});
