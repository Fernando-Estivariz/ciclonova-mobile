import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Slider, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function SettingsScreen({ navigation }) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const [language, setLanguage] = useState('es');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>Notificaciones Push</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>
      <View style={styles.row}>
        <Text>Notificaciones por Voz</Text>
        <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} />
      </View>
      <View style={styles.row}>
        <Text>Volumen TTS</Text>
        <Slider
          style={{ width: 150 }}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={volume}
          onValueChange={setVolume}
        />
        <Text>{volume}%</Text>
      </View>
      <View style={styles.row}>
        <Text>Idioma</Text>
        <Picker selectedValue={language} style={{ height: 50, width: 150 }} onValueChange={(item) => setLanguage(item)}>
          <Picker.Item label="Español" value="es" />
          <Picker.Item label="Inglés" value="en" />
        </Picker>
      </View>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  backBtn: { marginTop: 30, alignItems: 'center' },
  backText: { color: '#4FBF67' },
});

