
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const slides = [
  { id: '1', title: 'Rutas Seguras', description: 'Encuentra rutas seguras para tus recorridos.' },
  { id: '2', title: 'Reporta Incidentes', description: 'Reporta obstáculos o peligros en la vía.' },
  { id: '3', title: 'Alertas por Voz', description: 'Recibe alertas por voz en tus auriculares.' },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = Dimensions.get('window');

  const onViewRef = React.useRef(({ changed }) => {
    setCurrentIndex(changed[0].index);
  });
  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={styles.container}>
      <View style={styles.topButtons}>
        <TouchableOpacity onPress={() => navigation.replace('Home')}>
          <Text style={styles.skip}>Saltar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace('Home')}>
          <Text style={styles.next}>Comenzar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    position: 'absolute',
    width: '100%',
    zIndex: 1
  },
  slide: { justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 100 },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  description: { fontSize: 16, textAlign: 'center', marginHorizontal: 20 },
  skip: { fontSize: 16, color: '#666' },
  next: { fontSize: 16, color: '#4FBF67', fontWeight: 'bold' },
});
