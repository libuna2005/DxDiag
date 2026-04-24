import React from 'react';
import { Text, Platform, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Context and Screens
import { UserProvider, useUser } from './UserContext';
import HomeScreen from './components/screens/HomeScreen';
import AnnouncementScreen from './components/screens/AnnouncementScreen';
import EmergencyScreen from './components/screens/EmergencyScreen';
import ReportScreen from './components/screens/ReportScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import AppointmentScreen from './components/screens/AppointmentScreen';
import LoginScreen from './components/screens/LoginScreen';

const Tab = createBottomTabNavigator();

// This component handles the actual navigation logic based on Context
function RootNavigation() {
  const { session, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Tab.Navigator 
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#2e7d32',
            tabBarInactiveTintColor: 'gray',
            tabBarIcon: () => {
              const icons = { Home: '🏠', News: '📢', SOS: '🚨', Report: '📋', Profile: '👤' };
              return <Text style={styles.tabIcon}>{icons[route.name]}</Text>;
            },
            tabBarStyle: styles.tabBarStyle
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="News" component={AnnouncementScreen} />
          <Tab.Screen name="SOS" component={EmergencyScreen} />
          <Tab.Screen name="Report" component={ReportScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen 
            name="Appointment" 
            component={AppointmentScreen} 
            options={{ tabBarButton: () => null }} 
          />
        </Tab.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <RootNavigation />
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22 },
  tabBarStyle: { 
    height: Platform.OS === 'ios' ? 95 : 85, 
    paddingBottom: Platform.OS === 'ios' ? 35 : 25, 
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 25,
  }
});