import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Platform, Modal,
  RefreshControl, Image 
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../supabase';

export default function AdminDashboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const [userCount, setUserCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [announcements, setAnnouncements] = useState([]); 

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null); 
  const [actionLoading, setActionLoading] = useState(false);

  // 🗺️ Map state controls
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ latitude: 10.6432, longitude: 122.9515 });

  // 🖼️ Image Preview Modals
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  useEffect(() => {
    fetchSystemData();

    // ⚡ REAL-TIME DATABASE ENGINE
    const reportsSubscription = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        console.log("Real-time change intercepted:", payload.event);
        fetchSystemData(true); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsSubscription);
    };
  }, []);

  async function fetchSystemData(isRefreshingCall = false) {
    if (!isRefreshingCall) setLoading(true);
    try {
      // 1. Fetch profiles registered user metric count
      const { count, error: userError } = await supabase
        .from('profiles') 
        .select('*', { count: 'exact', head: true });
      if (!userError) setUserCount(count || 0);

      // 2. Fetch data rows from your Supabase reports database table
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!reportError && reportData) {
        const regularFeeds = reportData.filter(r => {
          const statusCheck = (r.status || '').trim().toLowerCase();
          return statusCheck !== 'urgent' && statusCheck !== 'resolved';
        });

        const activeSOS = reportData.filter(r => {
          return (r.status || '').trim().toLowerCase() === 'urgent';
        });

        setReports(regularFeeds);
        setEmergencies(activeSOS);
      } else if (reportError) {
        console.error("Supabase data extraction error:", reportError.message);
      }

      // 3. Sync bulletins notice board entries
      const { data: announcementData, error: announcementError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!announcementError) setAnnouncements(announcementData || []);

    } catch (err) {
      console.error("Critical dashboard state fetch failure:", err);
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  }

  const handleOnRefresh = () => {
    setRefreshing(true);
    fetchSystemData(true);
  };

  async function handleLogout() {
    Alert.alert("Confirm Logout", "Are you sure you want to exit the management suite?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // Reset state or navigate away safely
            navigation.replace('Login'); 
          } catch (err) {
            Alert.alert("Error Logging Out", err.message);
          }
        }
      }
    ]);
  }

  // 🗑️ DELETE METHOD
  async function handleDeleteReport(id, imageUrl) {
    Alert.alert("Confirm Destruction", "Permanently purge this report record from the Supabase database?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error: dbError } = await supabase
              .from('reports')
              .delete()
              .eq('id', id);

            if (dbError) throw dbError;

            if (imageUrl && imageUrl.includes('report-attachments')) {
              const filename = imageUrl.split('/').pop();
              await supabase.storage
                .from('report-attachments')
                .remove([`evidence/${filename}`]);
            }

            Alert.alert("Purged ✅", "Record entirely removed from Supabase Cloud server storage.");
            fetchSystemData(true);
          } catch (err) {
            Alert.alert("Transaction Failed", err.message);
          }
        }
      }
    ]);
  }

  // ✏️ UPDATE/EDIT MODERATION STATUS METHOD
  async function handleModerateReport(id, statusDecision) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: statusDecision })
        .eq('id', id);

      if (error) throw error;
      Alert.alert("State Updated", `Report matrix marked as ${statusDecision.toUpperCase()}`);
      fetchSystemData(true);
    } catch (err) {
      Alert.alert("Database Error", err.message);
    }
  }

  async function handleClearEmergency(id) {
    Alert.alert("Resolve SOS", "Permanently close out this SOS rescue stream?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Clear", 
        style: "destructive", 
        onPress: async () => {
          try {
            const { error } = await supabase.from('reports').delete().eq('id', id);
            if (error) throw error;
            Alert.alert("Cleared", "SOS instance closed.");
            fetchSystemData(true);
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        }
      }
    ]);
  }

  function handleViewMap(lat, lng) {
    if (!lat || !lng) {
      Alert.alert("No GPS Data", "Telemetry mapping coordinates missing from payload.");
      return;
    }
    setSelectedLocation({ latitude: Number(lat), longitude: Number(lng) });
    setMapModalVisible(true);
  }

  function handleViewReportImage(imageUrl) {
    setSelectedImageUri(imageUrl || null);
    setImageModalVisible(true);
  }

  async function handlePublishAnnouncement() {
    if (!announcementTitle || !announcementContent) {
      Alert.alert("Blank Input", "Complete all metadata form values.");
      return;
    }
    setActionLoading(true);
    try {
      if (editingAnnouncementId) {
        const { error } = await supabase
          .from('announcements')
          .update({ title: announcementTitle, content: announcementContent })
          .eq('id', editingAnnouncementId);
        if (error) throw error;
        setEditingAnnouncementId(null);
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([{ title: announcementTitle, content: announcementContent }]);
        if (error) throw error;
      }
      setAnnouncementTitle('');
      setAnnouncementContent('');
      fetchSystemData(true);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function handleEditAnnouncement(item) {
    setEditingAnnouncementId(item.id);
    setAnnouncementTitle(item.title);
    setAnnouncementContent(item.content);
  }

  async function handleDeleteAnnouncement(id) {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      fetchSystemData(true);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadText}>Connecting to Supabase Nodes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header layout at top */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Hub</Text>
          <Text style={styles.headerSubtitle}>Barangay Alijis Management Suite</Text>
        </View>
      </View>

      {/* Navigation Switch Tabs */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'announcements', label: '📢 Announcements' },
            { id: 'reports', label: `📋 Reports Feed (${reports.length})` },
            { id: 'emergencies', label: `🚨 SOS Streams (${emergencies.length})` }
          ].map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Container Scrollable View Area */}
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContainer} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleOnRefresh} colors={['#2e7d32']} />}
      >
        
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionLabel}>System Performance Summary</Text>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Registered App Residents</Text>
              <Text style={styles.metricValue}>{userCount} Accounts</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.miniMetric, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.miniTitle, { color: '#991b1b' }]}>Active Emergencies</Text>
                <Text style={[styles.miniValue, { color: '#dc2626' }]}>{emergencies.length}</Text>
              </View>
              <View style={[styles.miniMetric, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.miniTitle, { color: '#166534' }]}>Pending Reports</Text>
                <Text style={[styles.miniValue, { color: '#16a34a' }]}>
                  {reports.filter(r => {
                    const st = (r.status || '').trim().toLowerCase();
                    return st === 'pending' || st === '';
                  }).length}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'announcements' && (
          <View>
            {/* Announcement Form */}
            <View style={styles.formContainer}>
              <Text style={styles.sectionLabel}>{editingAnnouncementId ? '📝 Edit Bulletin' : 'Broadcast Live Notice'}</Text>
              <TextInput style={styles.input} value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="Headline Title" placeholderTextColor="#94a3b8" />
              <TextInput style={[styles.input, styles.textArea]} value={announcementContent} onChangeText={setAnnouncementContent} placeholder="Content parameters..." placeholderTextColor="#94a3b8" multiline numberOfLines={3} />
              <TouchableOpacity style={styles.actionBtn} onPress={handlePublishAnnouncement}>
                <Text style={styles.actionBtnText}>{editingAnnouncementId ? 'Update Field' : 'Broadcast Now'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'reports' && (
          <View>
            <Text style={styles.sectionLabel}>Citizen Activity Feed</Text>
            {reports.length === 0 ? <Text style={styles.emptyText}>No text reports filed in database yet.</Text> : null}
            {reports.map((item) => {
              const rawStatus = (item.status || 'pending').trim().toLowerCase();
              const statusDisplay = rawStatus === '' ? 'PENDING' : rawStatus.toUpperCase();
              
              return (
                <View key={item.id} style={styles.dataCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTag}>{item.title ? item.title.toUpperCase() : 'REPORT LOG'}</Text>
                    <Text style={[styles.statusText, { color: rawStatus === 'approved' ? '#16a34a' : rawStatus === 'declined' ? '#dc2626' : '#ea580c' }]}>
                      {statusDisplay}
                    </Text>
                  </View>
                  <Text style={styles.cardBody}>{item.description}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.viewImageRowButton, item.image_url && { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]} 
                    onPress={() => handleViewReportImage(item.image_url)}
                  >
                    <Text style={[styles.viewImageRowButtonText, item.image_url && { color: '#0369a1' }]}>
                      {item.image_url ? '🖼️ View Storage Cloud Attached Image' : '📷 No Image Appended'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionRow}>
                    {(rawStatus === 'pending' || rawStatus === '') && (
                      <>
                        <TouchableOpacity style={[styles.controlButton, styles.approveBtn]} onPress={() => handleModerateReport(item.id, 'approved')}>
                          <Text style={styles.controlText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlButton, styles.declineBtn]} onPress={() => handleModerateReport(item.id, 'declined')}>
                          <Text style={styles.controlText}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {rawStatus === 'approved' && (
                      <TouchableOpacity style={[styles.controlButton, styles.resolveBtn]} onPress={() => handleModerateReport(item.id, 'resolved')}>
                        <Text style={styles.resolveControlText}>Mark Resolved</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.controlButton, styles.deleteBtnStyle]} onPress={() => handleDeleteReport(item.id, item.image_url)}>
                      <Text style={styles.deleteControlText}>Purge Row</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'emergencies' && (
          <View>
            <Text style={styles.sectionLabel}>Active SOS Distress Channels</Text>
            {emergencies.length === 0 ? <Text style={styles.emptyText}>No active SOS streams currently active.</Text> : null}
            {emergencies.map((item) => (
              <View key={item.id} style={[styles.dataCard, styles.emergencyBorder]}>
                <Text style={[styles.cardTag, { color: '#dc2626' }]}>🚨 EMERGENCY ALERT</Text>
                <Text style={styles.cardBody}>{item.description}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.controlButton, { backgroundColor: '#eff6ff' }]} onPress={() => handleViewMap(item.latitude, item.longitude)}>
                    <Text style={{ color: '#2563eb', fontWeight: '700' }}>📍 Map Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.controlButton, { backgroundColor: '#fee2e2' }]} onPress={() => handleClearEmergency(item.id)}>
                    <Text style={{ color: '#dc2626', fontWeight: '700' }}>Drop Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Controls Container Area */}
      <View style={styles.footerStickyControls}>
        <TouchableOpacity style={styles.logoutFooterButton} onPress={handleLogout}>
          <Text style={styles.logoutFooterButtonText}>🚪 Sign Out From System</Text>
        </TouchableOpacity>
      </View>

      {/* Popups (Images) */}
      <Modal animationType="fade" transparent visible={imageModalVisible} onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Remote Evidence Vault View</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}><Text style={{fontSize: 20}}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.imageModalBody}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.fullScreenTargetImage} resizeMode="contain" />
              ) : (
                <Text style={{color: '#64748b'}}>No imagery attached to database file record payload.</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Popups (Maps) */}
      <Modal animationType="slide" transparent visible={mapModalVisible} onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Live GPS Intercept Coordinates</Text>
              <TouchableOpacity onPress={() => setMapModalVisible(false)}><Text style={{fontSize: 20}}>✕</Text></TouchableOpacity>
            </View>
            <MapView style={{ flex: 1 }} initialRegion={{ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
              <Marker coordinate={selectedLocation} title="SOS Distress Source Node" />
            </MapView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 10, color: '#64748b', fontWeight: '600' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tabBarContainer: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  tabScrollContent: { paddingHorizontal: 16, gap: 8 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  tabItemActive: { backgroundColor: '#2e7d32' },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  mainScrollView: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 },
  metricCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  metricTitle: { fontSize: 12, color: '#64748b' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#2e7d32', marginTop: 4 },
  metricRow: { flexDirection: 'row', gap: 12 },
  miniMetric: { flex: 1, padding: 14, borderRadius: 12 },
  miniTitle: { fontSize: 11, fontWeight: '700' },
  miniValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  textArea: { height: 70, textAlignVertical: 'top' },
  actionBtn: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
  dataCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  emergencyBorder: { borderLeftWidth: 4, borderLeftColor: '#dc2626', borderColor: '#fca5a5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTag: { fontSize: 11, fontWeight: '800', color: '#ea580c' },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardBody: { fontSize: 14, color: '#334155', lineHeight: 20 },
  viewImageRowButton: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', marginVertical: 8, alignItems: 'center' },
  viewImageRowButtonText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  controlButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: '#dcfce7' },
  declineBtn: { backgroundColor: '#fee2e2' },
  resolveBtn: { backgroundColor: '#e0f2fe' },
  deleteBtnStyle: { backgroundColor: '#fef2f2' },
  controlText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  resolveControlText: { fontSize: 12, fontWeight: '700', color: '#0369a1' },
  deleteControlText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginVertical: 20 },
  footerStickyControls: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderColor: '#e2e8f0' },
  logoutFooterButton: { backgroundColor: '#b91c1c', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoutFooterButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, height: '70%', overflow: 'hidden' },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
  modalHeaderTitle: { fontWeight: '800', color: '#0f172a' },
  imageModalBody: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  fullScreenTargetImage: { width: '100%', height: '100%' }
});