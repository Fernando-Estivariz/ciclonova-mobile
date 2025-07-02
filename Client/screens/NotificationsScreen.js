import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

const dummyNotifications = [
  { id: '1', type: 'Incidente', message: 'Nuevo incidente cerca de ti', date: '2025-06-03 14:00', read: false },
  { id: '2', type: 'Evento', message: 'Evento "Rodada Centro" mañana', date: '2025-06-03 10:00', read: true },
];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(dummyNotifications);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    Alert.alert('Notificaciones', 'Todas marcadas como leídas');
  };

  const clearAll = () => {
    Alert.alert('Eliminar historial', '¿Deseas eliminar todas las notificaciones?', [
      { text: 'No' },
      { text: 'Sí', onPress: () => setNotifications([]) },
    ]);
  };

  const handlePress = (item) => {
    if (item.type === 'Incidente') {
      navigation.navigate('IncidentDetail', { incident: { id: '1', type: 'Vehículo', date: '2025-06-01', status: 'Pendiente' } });
    } else if (item.type === 'Evento') {
      navigation.navigate('EventDetail', { event: { id: '1', name: 'Rodada Centro', date: '2025-06-10', time: '08:00', registered: 12, capacity: 40 } });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.item, item.read ? {} : styles.unread]} onPress={() => handlePress(item)}>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <View style={styles.actions}>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.linkText}>Marcar todas como leídas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.linkText}>Eliminar historial</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  unread: { backgroundColor: '#e6fffa' },
  message: { fontSize: 16 },
  date: { fontSize: 12, color: '#666' },
  actions: { marginVertical: 20, alignItems: 'center' },
  linkText: { color: '#4FBF67', marginVertical: 5 },
});
