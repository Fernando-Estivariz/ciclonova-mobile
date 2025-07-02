import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';

const dummyEvents = [
  { id: '1', name: 'Rodada Centro', date: '2025-06-10', time: '08:00', registered: 12, capacity: 40 },
  { id: '2', name: 'Paseo Nocturno', date: '2025-06-15', time: '20:00', registered: 20, capacity: 30 },
];

export default function EventsListScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredEvents = dummyEvents.filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetail', { event: item })}>
      <Text style={styles.eventName}>{item.name}</Text>
      <Text>{item.date} · {item.time}</Text>
      <Text>{item.registered}/{item.capacity} inscritos</Text>
      <TouchableOpacity style={styles.joinButton} onPress={() => {/* Implementar lógica de inscripción */}}>
        <Text style={styles.joinText}>Unirse</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar eventos..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  search: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 5, marginVertical: 5 },
  eventName: { fontSize: 18, fontWeight: 'bold' },
  joinButton: { marginTop: 10, padding: 8, backgroundColor: '#4FBF67', borderRadius: 5, alignSelf: 'flex-start' },
  joinText: { color: '#fff' },
});
