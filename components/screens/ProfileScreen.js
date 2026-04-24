import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Alert, ScrollView, ActivityIndicator, Modal, FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';

const STORAGE_KEY = "@location_history_v1";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // UI States
  const [editModal, setEditModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

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

  // --- PROFILE UPDATE LOGIC ---
  async function handleUpdateProfile() {
    setLoading(true);
    const updates = { data: { full_name: displayName } };
    
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
      setEditModal(false); // Close modal on success
    }
    setLoading(false);
  }

  // --- HISTORY LOGIC ---
  const fetchHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setLocationHistory(parsed.reverse()); 
      setHistoryModal(true);
    } catch (e) {
      Alert.alert("Error", "Could not load logs.");
    }
  };

  const clearHistory = async () => {
    Alert.alert("Wipe Data", "Clear all local logs?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setLocationHistory([]);
          setHistoryModal(false);
        } 
      }
    ]);
  };

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error ❌", error.message);
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profilePic}>
            <Text style={{fontSize: 50}}>👤</Text>
          </View>
          <Text style={styles.userName}>{displayName || "Resident"}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        <View style={styles.menuSection}>
          {/* Main Action: Open Edit Modal */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => setEditModal(true)}>
            <Text style={styles.menuBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.historyBtn} onPress={fetchHistory}>
            <Text style={styles.historyBtnText}>📍 View Movement Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout 🏃‍♂️💨</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- EDIT PROFILE MODAL --- */}
      <Modal visible={editModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.modalTitle}>Update Information</Text>
            
            <Text style={styles.label}>Full Name 📝</Text>
            <TextInput 
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
            />

            <Text style={styles.label}>New Password 🔒</Text>
            <TextInput 
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current"
              secureTextEntry
            />

            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.updateText}>Save Changes ✅</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- HISTORY MODAL --- */}
      <Modal visible={historyModal} animationType="fade">
        <View style={styles.historyModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Device Logs</Text>
            <TouchableOpacity onPress={() => setHistoryModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={locationHistory}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyCoords}>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
              </View>
            )}
          />
          {locationHistory.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
              <Text style={styles.clearBtnText}>Wipe History</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userEmail: { color: '#888', marginTop: 4 },
  menuSection: { padding: 20 },
  
  // Menu Buttons
  menuBtn: { backgroundColor: 'white', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12, elevation: 2 },
  menuBtnText: { fontWeight: 'bold', color: '#333' },
  historyBtn: { backgroundColor: '#e8f5e9', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2e7d32' },
  historyBtnText: { color: '#2e7d32', fontWeight: 'bold' },
  logoutBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#d32f2f', fontWeight: 'bold' },

  // Edit Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  editCard: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontWeight: '700', marginBottom: 8, color: '#666', fontSize: 13 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20 },
  updateBtn: { backgroundColor: '#2e7d32', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  updateText: { color: 'white', fontWeight: 'bold' },
  cancelText: { textAlign: 'center', marginTop: 15, color: '#999' },

  // History Modal
  historyModalContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 20 },
  closeText: { color: '#2196F3', fontWeight: 'bold' },
  historyItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyCoords: { fontSize: 15, color: '#444' },
  clearBtn: { backgroundColor: '#d32f2f', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  clearBtnText: { color: 'white', fontWeight: 'bold' }
});