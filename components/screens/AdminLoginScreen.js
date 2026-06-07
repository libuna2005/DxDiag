import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Platform 
} from 'react-native';

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleAdminLogin() {
    // 🔒 Your requested hardcoded administrative credentials
    if (username.trim() === 'admin' && password === 'admin') {
      Alert.alert("Access Granted 🔑", "Welcome back, Administrator.");
      navigation.replace("AdminDashboard"); // Seamlessly routes to the dashboard
    } else {
      Alert.alert("Access Denied ❌", "Invalid administrator credentials. Please try again.");
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.loginCard}>
        <View style={styles.headerBlock}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Barangay Console</Text>
          <Text style={styles.subtitle}>Authorized Admin Access Protocol Only</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Admin Username</Text>
          <TextInput 
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter admin username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Security Password</Text>
          <TextInput 
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleAdminLogin} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>Authenticate Console</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Return to Resident Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', paddingHorizontal: 24 }, // Dark sleek theme for admin
  loginCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  headerBlock: { alignItems: 'center', marginBottom: 28 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#f8fafc', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center', fontWeight: '500' },
  form: { marginTop: 5 },
  label: { fontSize: 11, fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#334155', fontSize: 15 },
  loginBtn: { backgroundColor: '#1b5e20', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  backBtn: { padding: 14, marginTop: 12 },
  backBtnText: { color: '#94a3b8', textAlign: 'center', fontSize: 13, fontWeight: '600' }
});