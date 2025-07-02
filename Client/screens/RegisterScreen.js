import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = () => {
    if (!name || !emailOrPhone || !password || !confirmPassword) {
      Alert.alert('Error', 'Complete todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Error', 'Debe aceptar los términos y condiciones.');
      return;
    }

    // Simula redirección a pantalla de verificación OTP
    navigation.navigate('OTPVerification', { user: emailOrPhone });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrarse</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo o Teléfono"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <View style={styles.termsContainer}>
        <TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)}>
          <Text style={styles.checkbox}>{acceptedTerms ? '[x]' : '[ ]'}</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>Acepto términos y condiciones</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  checkbox: { fontSize: 18 },
  termsText: { marginLeft: 10 },
  button: { backgroundColor: '#4FBF67', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backLink: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#4FBF67' },
});
