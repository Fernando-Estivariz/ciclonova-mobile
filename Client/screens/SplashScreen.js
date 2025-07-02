// SplashScreen.js
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const firstLaunch = true;

      if (firstLaunch) {
        navigation.replace('Onboarding');
      } else {
        // Código original:
        // navigation.replace('Login');

        // Redirige a Home directamente por ahora:
        navigation.replace('Home');
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CicloNova</Text>
      <ActivityIndicator size="large" color="#4FBF67" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
});
