import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('Juan Perez');
  const [email, setEmail] = useState('juan@example.com');
  const [phone, setPhone] = useState('+591 7XX XXXX');

  const handleSave = () => {
    // Aquí implementas llamada a API /perfil
    Alert.alert('Perfil actualizado', 'Tus datos se han guardado correctamente.');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
      <Text style={styles.title}>{name}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre completo" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Correo" keyboardType="email-address" />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono" keyboardType="phone-pad" />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Guardar Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.linkText}>Configuración</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Help')}>
        <Text style={styles.linkText}>Ayuda</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={() => {
        Alert.alert('Cerrar sesión', '¿Seguro que deseas cerrar sesión?', [
          { text: 'No' },
          { text: 'Sí', onPress: () => navigation.replace('Login') },
        ]);
      }}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginVertical: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 5 },
  button: { backgroundColor: '#4FBF67', padding: 12, borderRadius: 5, marginTop: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  linkBtn: { marginTop: 15 },
  linkText: { color: '#4FBF67' },
  logoutBtn: { marginTop: 30 },
  logoutText: { color: '#E53E3E' },
});

