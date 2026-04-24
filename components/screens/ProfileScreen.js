import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { supabase } from '../../supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email);
      setDisplayName(user.user_metadata?.full_name || '');
    }
  }

  async function handleUpdateProfile() {
    setLoading(true);
    const updates = {
      data: { full_name: displayName }
    };
    
    // Only add password to update if user typed something
    if (newPassword.length > 5) {
      updates.password = newPassword;
    } else if (newPassword.length > 0) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      Alert.alert("Update Failed ❌", error.message);
    } else {
      Alert.alert("Success ✅", "Profile updated successfully!");
      setNewPassword('');
    }
    setLoading(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error ❌", error.message);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profilePic}>
          <Text style={{fontSize: 50}}>👤</Text>
        </View>
        <Text style={styles.userName}>{displayName || "Resident"}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name 📝</Text>
        <TextInput 
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Change Password 🔒</Text>
        <TextInput 
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password (min 6 chars)"
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.updateBtn} 
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.updateText}>Update Profile ✨</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout 🏃‍♂️💨</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', padding: 30, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  userName: { fontSize: 22, fontWeight: 'bold' },
  userEmail: { color: '#666', marginTop: 5 },
  form: { padding: 20 },
  label: { fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  updateBtn: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  updateText: { color: 'white', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d32f2f' },
  logoutText: { color: '#d32f2f', fontWeight: 'bold' }
});