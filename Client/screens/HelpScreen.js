import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const faqs = [
  { question: '¿Cómo reportar un incidente?', answer: 'Ve a la pestaña Denuncias y completa el formulario.' },
  { question: '¿Cómo unirse a un evento?', answer: 'En Eventos, selecciona un evento y pulsa "Unirse".' },
  { question: '¿Cómo habilitar notificaciones por voz?', answer: 'Ve a Configuración y activa "Notificaciones por Voz".' },
  { question: '¿Cómo cambiar idioma?', answer: 'En Configuración, selecciona el idioma deseado.' },
  { question: '¿Cómo actualizar perfil?', answer: 'En Perfil, pulsa "Guardar Perfil" tras editar.' },
];

export default function HelpScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      {faqs.map((item, idx) => (
        <View key={idx} style={styles.faq}>
          <Text style={styles.question}>{item.question}</Text>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  faq: { marginVertical: 10 },
  question: { fontSize: 16, fontWeight: 'bold' },
  answer: { fontSize: 14, marginTop: 5 },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#4FBF67', fontSize: 16 },
});
