import React, { useEffect, useState } from 'react';
import { Text, Platform, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './supabase'; 

// IMPORT SCREENS
import HomeScreen from './components/screens/HomeScreen';
import AnnouncementScreen from './components/screens/AnnouncementScreen';
import EmergencyScreen from './components/screens/EmergencyScreen';
import ReportScreen from './components/screens/ReportScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import AppointmentScreen from './components/screens/AppointmentScreen'; // New Import
import LoginScreen from './components/screens/LoginScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {session && session.user ? (
          <Tab.Navigator 
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#2e7d32',
              tabBarInactiveTintColor: 'gray',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                paddingBottom: Platform.OS === 'android' ? 5 : 0, 
              },
              tabBarIcon: () => {
                if (route.name === 'Home') return <Text style={styles.tabIcon}>🏠</Text>;
                if (route.name === 'News') return <Text style={styles.tabIcon}>📢</Text>;
                if (route.name === 'SOS') return <Text style={styles.tabIcon}>🚨</Text>;
                if (route.name === 'Report') return <Text style={styles.tabIcon}>📋</Text>;
                if (route.name === 'Profile') return <Text style={styles.tabIcon}>👤</Text>;
              },
              tabBarStyle: { 
                height: Platform.OS === 'ios' ? 95 : 85, 
                paddingBottom: Platform.OS === 'ios' ? 35 : 25, 
                paddingTop: 12,
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
                elevation: 25,
              }
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="News" component={AnnouncementScreen} />
            <Tab.Screen name="SOS" component={EmergencyScreen} />
            <Tab.Screen name="Report" component={ReportScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            
            {/* HIDDEN FROM TAB BAR BUT ACCESSIBLE VIA NAVIGATE */}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22 }
});