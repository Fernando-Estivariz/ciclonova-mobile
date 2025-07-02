import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

export default function PanicButtonScreen({ navigation }) {
  useEffect(() => {
    const sendAlert = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede enviar alerta sin ubicación.');
        navigation.goBack();
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      // Aquí iría la lógica real para enviar SMS/WhatsApp con loc.coords.latitude & longitude
      Alert.alert(
        'Alerta enviada',
        `Necesito ayuda, estoy en ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
      );
      navigation.goBack();
    };

    const timeout = setTimeout(sendAlert, 3000); // 3 segundos de cuenta regresiva

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enviando alerta de emergencia...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, textAlign: 'center', marginHorizontal: 20 },
});
