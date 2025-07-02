import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const dummyIncidents = [
  { id: '1', type: 'Vehículo', date: '2025-06-01', status: 'Pendiente' },
  { id: '2', type: 'Pothole', date: '2025-06-02', status: 'Cerrada' },
];

export default function IncidentHistoryScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('IncidentDetail', { incident: item })}>
      <Text style={styles.type}>{item.type}</Text>
      <Text>{item.date}</Text>
      <Text>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dummyIncidents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  item: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 5, marginVertical: 5 },
  type: { fontSize: 18, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#4FBF67' },
});
