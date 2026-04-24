import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Switch 
} from "react-native";
import MapView, { UrlTile, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase"; // Back for the SOS signal

const STORAGE_KEY = "@location_history_v1";

export default function EmergencyScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false); // For SOS button
  const [isTracking, setIsTracking] = useState(false);
  const [history, setHistory] = useState([]); 
  const [statusMsg, setStatusMsg] = useState("Initializing GPS...");
  const locationWatcher = useRef(null);

  useEffect(() => {
    loadLocalHistory();
    requestPermissions();
    return () => stopTracking();
  }, []);

  // --- LOCAL PERSISTENCE LOGIC ---
  async function loadLocalHistory() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error(e); }
  }

  async function saveToLocalHistory(newCoord) {
    const updatedHistory = [...history, newCoord].slice(-100);
    setHistory(updatedHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  // --- SOS SIGNAL (SUPABASE) ---
  async function handleSOSPress() {
    if (!location) {
      Alert.alert("GPS Not Ready", "Still acquiring location.");
      return;
    }

    Alert.alert("Confirm Emergency", "Alert Barangay Alijis authorities?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: executeEmergencySignal }
    ]);
  }

  async function executeEmergencySignal() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("emergency").insert([
        { latitude: location.latitude, longitude: location.longitude, user_id: user?.id, status: "pending" },
      ]);
      if (error) throw error;
      Alert.alert("🚨 SOS SENT", "Authorities have been notified.");
    } catch (err) {
      Alert.alert("SOS Failed", err.message);
    } finally { setLoading(false); }
  }

  // --- TRACKING LOGIC ---
  async function requestPermissions() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { setStatusMsg("Permission Denied"); return; }
    const current = await Location.getCurrentPositionAsync({});
    setLocation(current.coords);
    setStatusMsg("GPS Locked");
  }

  async function toggleTracking() {
    if (isTracking) {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
        locationWatcher.current = null;
      }
      setIsTracking(false);
    } else {
      setIsTracking(true);
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (newLoc) => {
          const coord = { latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude };
          setLocation(newLoc.coords);
          saveToLocalHistory(coord);
        }
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Emergency & Tracking</Text>

      <View style={styles.mapContainer}>
        {location && (
          <MapView 
            style={styles.map} 
            region={{ ...location, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
          >
            <UrlTile urlTemplate="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
            <Polyline coordinates={history} strokeWidth={4} strokeColor="#2e7d32" />
            <Marker coordinate={location} title="Current Location" />
          </MapView>
        )}
      </View>

      <View style={styles.uiBottom}>
        {/* Local History Toggle */}
        <View style={styles.historyToggle}>
          <Text style={styles.toggleLabel}>Local History Logging</Text>
          <Switch value={isTracking} onValueChange={toggleTracking} />
        </View>

        {/* SOS Button Re-instated */}
        <TouchableOpacity 
          style={[styles.sosButton, loading && styles.disabled]} 
          onPress={handleSOSPress}
          disabled={loading}
        >
          <View style={styles.sosInner}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.sosText}>SOS</Text>}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.warningText}>Misuse is subject to legal action.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 60, marginBottom: 10 },
  mapContainer: { height: 260, width: '100%', borderBottomWidth: 1, borderBottomColor: '#eee' },
  map: { flex: 1 },
  uiBottom: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  historyToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '100%', 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 12,
    marginBottom: 20
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  sosButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: "#FFEBEE", justifyContent: "center", alignItems: "center" },
  sosInner: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#c62828", justifyContent: "center", alignItems: "center", elevation: 10 },
  sosText: { color: "white", fontSize: 36, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  warningText: { marginTop: 25, color: "#d32f2f", fontSize: 11, fontWeight: '600' }
});