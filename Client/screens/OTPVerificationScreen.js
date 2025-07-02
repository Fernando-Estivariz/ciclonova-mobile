import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OTPVerificationScreen({ route, navigation }) {
  const { user } = route.params;
  const [code, setCode] = useState('');

  const handleVerify = () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingrese un código de 6 dígitos.');
      return;
    }

    // Simulación de validación correcta con código fijo "123456"
    if (code === '123456') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      Alert.alert('Código incorrecto', 'El código ingresado no es válido.');
    }
  };

  const handleResend = () => {
    // Simula reenvío de código
    Alert.alert('Código reenviado', `Se ha reenviado un código a ${user}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación de Cuenta</Text>
      <Text style={styles.subtitle}>Código enviado a {user}</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa el código"
        keyboardType="numeric"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Validar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.linkText}>Reenviar código</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#4FBF67',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#4FBF67', textAlign: 'center', marginTop: 20 },
  backLink: { marginTop: 20, alignItems: 'center' },
});
