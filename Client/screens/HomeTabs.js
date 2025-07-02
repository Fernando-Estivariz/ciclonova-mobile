import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import RoutesListScreen from './RoutesListScreen';
import ReportIncidentScreen from './ReportIncidentScreen';
import EventsListScreen from './EventsListScreen';
import ProfileScreen from './ProfileScreen';

import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Routes"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Routes') iconName = 'bicycle';
          else if (route.name === 'Incidents') iconName = 'alert-circle';
          else if (route.name === 'Events') iconName = 'calendar';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4FBF67',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Routes" component={RoutesListScreen} />
      <Tab.Screen name="Incidents" component={ReportIncidentScreen} />
      <Tab.Screen name="Events" component={EventsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
