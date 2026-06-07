import React, { useState } from 'react';
import { Text, Platform, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Context and Screens
import { UserProvider, useUser } from './UserContext';
import HomeScreen from './components/screens/HomeScreen';
import EmergencyScreen from './components/screens/EmergencyScreen';
import ReportScreen from './components/screens/ReportScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import AppointmentScreen from './components/screens/AppointmentScreen';
import LoginScreen from './components/screens/LoginScreen';

// 🔐 Import your newly created Admin Screens
import AdminLoginScreen from './components/screens/AdminLoginScreen';
import AdminDashboard from './components/screens/AdminDashboard';

const Tab = createBottomTabNavigator();

function RootNavigation() {
  const { session, loading } = useUser();
  
  // 🕹️ Core Layout Controller: 'resident' | 'admin_login' | 'admin_dashboard'
  const [currentScope, setCurrentScope] = useState('resident');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  // 🛡️ STATE ROUTE 1: Admin Console View Dashboard
  if (currentScope === 'admin_dashboard') {
    return (
      // Passing navigation mock functions to keep code working seamlessly without rewriting screen properties
      <AdminDashboard navigation={{ replace: (target) => setCurrentScope(target === 'Login' ? 'resident' : 'admin_dashboard') }} />
    );
  }

  // 🛡️ STATE ROUTE 2: Admin Login Security Gateway
  if (currentScope === 'admin_login') {
    return (
      <AdminLoginScreen 
        navigation={{ 
          replace: (target) => setCurrentScope(target === 'AdminDashboard' ? 'admin_dashboard' : 'resident'),
          goBack: () => setCurrentScope('resident')
        }} 
      />
    );
  }

  // 👥 STATE ROUTE 3: Standard Resident Navigation Matrix
  return (
    <NavigationContainer>
      {session ? (
        <Tab.Navigator 
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#2e7d32',
            tabBarInactiveTintColor: 'gray',
            tabBarIcon: () => {
              const icons = { Home: '🏠', SOS: '🚨', Report: '📋', Profile: '👤' };
              return <Text style={styles.tabIcon}>{icons[route.name]}</Text>;
            },
            tabBarStyle: styles.tabBarStyle
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
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
        // Passing navigation mock hook into your login component file to switch state visibility instantly
        <LoginScreen navigation={{ navigate: (target) => { if(target === 'AdminLogin') setCurrentScope('admin_login'); } }} />
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