import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Alert, ScrollView, ActivityIndicator, Modal, FlatList, Platform 
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
      setEditModal(false);
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
    Alert.alert("Wipe Data", "Clear all local logs permanently?", [
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

  // --- DELETE ACCOUNT LOGIC ---
  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account ⚠️",
      "This will permanently wipe your account and cloud data. This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanently", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              // 1. Invoke the secure PostgreSQL RPC function to drop the auth record
              const { error } = await supabase.rpc('delete_user_account');
              
              if (error) {
                Alert.alert("Deletion Failed ❌", error.message);
                setLoading(false);
                return;
              }

              // 2. Clear out local active session details natively
              await supabase.auth.signOut();
              Alert.alert("Account Removed", "Your account has been deleted permanently.");
            } catch (err) {
              Alert.alert("Error ❌", "An unexpected network error occurred.");
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Header Block */}
        <View style={styles.header}>
          <View style={styles.profilePicContainer}>
            <View style={styles.profilePic}>
              <Text style={styles.profileEmoji}>👤</Text>
            </View>
          </View>
          <Text style={styles.userName}>{displayName || "Resident User"}</Text>
          <Text style={styles.userEmail}>{email || "Retrieving session..."}</Text>
        </View>

        {/* Dynamic Interactive Menu Links */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>Account Settings</Text>
          
          <TouchableOpacity style={styles.menuCard} onPress={() => setEditModal(true)} activeOpacity={0.7}>
            <View style={styles.menuCardLeft}>
              <Text style={styles.menuIcon}>✏️</Text>
              <Text style={styles.menuCardText}>Edit Profile Info</Text>
            </View>
            <Text style={styles.menuArrow}>❯</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.historyCardModifier]} onPress={fetchHistory} activeOpacity={0.7}>
            <View style={styles.menuCardLeft}>
              <Text style={styles.menuIcon}>📍</Text>
              <Text style={[styles.menuCardText, styles.historyCardText]}>View Movement Logs</Text>
            </View>
            <Text style={[styles.menuArrow, styles.historyArrow]}>❯</Text>
          </TouchableOpacity>

          {/* Action Button Segment */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Log Out Account 🏃‍♂️</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteBtn, loading && { opacity: 0.6 }]} 
            onPress={handleDeleteAccount} 
            disabled={loading} 
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#b91c1c" /> : <Text style={styles.deleteText}>Delete Account Permanently 🗑️</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- PREMIUM EDIT PROFILE MODAL --- */}
      <Modal visible={editModal} animationType="slide" transparent={true} onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModal(false)}>
          <View style={styles.editCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Update Information</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput 
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />

            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={loading} activeOpacity={0.9}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.updateText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- PREMIUM HISTORY MODAL --- */}
      <Modal visible={historyModal} animationType="fade" transparent={false} onRequestClose={() => setHistoryModal(false)}>
        <View style={styles.historyModalContainer}>
          <View style={styles.historyModalHeader}>
            <View>
              <Text style={styles.historyTitle}>Device Logs</Text>
              <Text style={styles.historySubtitle}>Your saved coordinates history cache.</Text>
            </View>
            <TouchableOpacity style={styles.closeBadge} onPress={() => setHistoryModal(false)}>
              <Text style={styles.closeBadgeText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={locationHistory}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ paddingHorizontal: 4 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No device local trails registered yet.</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={styles.historyItem}>
                <View style={styles.historyIndexContainer}>
                  <Text style={styles.historyIndexText}>#{locationHistory.length - index}</Text>
                </View>
                <View style={styles.historyDataBlock}>
                  <Text style={styles.historyCoordsText}>Latitude: <Text style={styles.coordsValue}>{item.latitude.toFixed(5)}</Text></Text>
                  <Text style={styles.historyCoordsText}>Longitude: <Text style={styles.coordsValue}>{item.longitude.toFixed(5)}</Text></Text>
                </View>
              </View>
            )}
          />
          
          {locationHistory.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearHistory} activeOpacity={0.9}>
              <Text style={styles.clearBtnText}>Wipe History Cache</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 40 },
  
  header: { 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 75 : 60, 
    paddingBottom: 35, 
    backgroundColor: 'white', 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2 
  },
  profilePicContainer: {
    padding: 6,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    marginBottom: 16
  },
  profilePic: { 
    width: 96, 
    height: 96, 
    borderRadius: 48, 
    backgroundColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  profileEmoji: { fontSize: 44 },
  userName: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  
  menuSection: { paddingHorizontal: 24, paddingTop: 30 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
  
  menuCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 12, 
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1 
  },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 16, marginRight: 12 },
  menuCardText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  menuArrow: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  
  historyCardModifier: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', elevation: 0 },
  historyCardText: { color: '#166534' },
  historyArrow: { color: '#86efac' },
  
  logoutBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 28, borderWidth: 1, borderColor: '#e2e8f0' },
  logoutText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  // Customized Visual Destructive Target Button
  deleteBtn: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#fee2e2' },
  deleteText: { color: '#b91c1c', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  editCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalIndicator: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 24, textAlign: 'center', letterSpacing: -0.3 },
  label: { fontWeight: '700', marginBottom: 8, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b', fontSize: 15, fontWeight: '500' },
  updateBtn: { backgroundColor: '#1b5e20', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#1b5e20', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  updateText: { color: 'white', fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 14, marginTop: 8 },
  cancelBtnText: { textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: 14 },

  historyModalContainer: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 65 : 45 },
  historyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  historyTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  historySubtitle: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  closeBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  closeBadgeText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  historyIndexContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  historyIndexText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  historyDataBlock: { flex: 1 },
  historyCoordsText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginVertical: 1 },
  coordsValue: { color: '#334155', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  clearBtn: { backgroundColor: '#b91c1c', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 15, marginBottom: Platform.OS === 'ios' ? 30 : 20 },
  clearBtnText: { color: 'white', fontWeight: '700', fontSize: 15 }
});