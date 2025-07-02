import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import RoutesScreen from '../src/screens/RoutesScreen';
import IncidentsScreen from '../src/screens/IncidentsScreen';
import EventsScreen from '../src/screens/EventsScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import RouteNavigationScreen from '../src/screens/RouteNavigationScreen';



const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="RoutesScreen" component={RoutesScreen} />
          <Stack.Screen name="IncidentsScreen" component={IncidentsScreen} />
          <Stack.Screen name="EventsScreen" component={EventsScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="RouteNavigationScreen" component={RouteNavigationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
