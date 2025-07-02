import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';

const dummyRoutes = [
  { id: '1', name: 'Ruta Centro', distance: '5 km', time: '20 min', status: 'safe' },
  { id: '2', name: 'Ruta Sur', distance: '10 km', time: '45 min', status: 'caution' },
];

export default function RoutesListScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredRoutes = dummyRoutes.filter((route) =>
    route.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RouteDetail', { route: item })}>
      <Text style={styles.routeName}>{item.name}</Text>
      <Text>{item.distance} · {item.time}</Text>
      <Text>Status: {item.status}</Text>
      <TouchableOpacity style={styles.offlineBtn} onPress={() => navigation.navigate('OfflineRoute', { route: item })}>
        <Text style={styles.offlineText}>Guardar Offline</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar rutas..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  search: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 5, marginVertical: 5 },
  routeName: { fontSize: 18, fontWeight: 'bold' },
  offlineBtn: { marginTop: 10, padding: 8, backgroundColor: '#e0e0e0', borderRadius: 5, alignSelf: 'flex-start' },
  offlineText: { color: '#333' },
});
