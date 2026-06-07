import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, Switch 
} from "react-native";
import MapView, { UrlTile, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabase"; 

const STORAGE_KEY = "@location_history_v1";

// 📍 Hardcoded paths tracing through Barangay Alijis for your live simulation
const SIMULATED_TANOD_ROUTE = [
  { latitude: 10.6432, longitude: 122.9515 }, 
  { latitude: 10.6428, longitude: 122.9525 }, 
  { latitude: 10.6422, longitude: 122.9532 }, 
  { latitude: 10.6415, longitude: 122.9542 }, 
];

const SIMULATED_AMBULANCE_ROUTE = [
  { latitude: 10.6455, longitude: 122.9490 },
  { latitude: 10.6448, longitude: 122.9502 },
  { latitude: 10.6440, longitude: 122.9510 },
  { latitude: 10.6436, longitude: 122.9520 },
];

const SIMULATED_FIRE_ROUTE = [
  { latitude: 10.6402, longitude: 122.9560 },
  { latitude: 10.6410, longitude: 122.9550 },
  { latitude: 10.6418, longitude: 122.9540 },
  { latitude: 10.6425, longitude: 122.9530 },
];

export default function EmergencyScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [isTracking, setIsTracking] = useState(false);
  const [history, setHistory] = useState([]); 
  const [statusMsg, setStatusMsg] = useState("Initializing GPS...");
  const locationWatcher = useRef(null);

  // 🚨 Dynamic Service Coordinates Tracker
  const [tanodPos, setTanodPos] = useState(SIMULATED_TANOD_ROUTE[0]);
  const [ambulancePos, setAmbulancePos] = useState(SIMULATED_AMBULANCE_ROUTE[0]);
  const [firePos, setFirePos] = useState(SIMULATED_FIRE_ROUTE[0]);
  
  const [closestService, setClosestService] = useState("Calculating...");
  const routeIndex = useRef(0);

  // Helper function to calculate distance (Haversine/Pythagorean approximation for speed)
  function getDistance(p1, p2) {
    if (!p1 || !p2) return Infinity;
    return Math.sqrt(Math.pow(p1.latitude - p2.latitude, 2) + Math.pow(p1.longitude - p2.longitude, 2));
  }

  // Effect to calculate who is closest whenever any position updates
  useEffect(() => {
    if (!location) return;

    const dTanod = getDistance(location, tanodPos);
    const dAmbulance = getDistance(location, ambulancePos);
    const dFire = getDistance(location, firePos);

    const minDistance = Math.min(dTanod, dAmbulance, dFire);

    if (minDistance === dTanod) setClosestService("Tanod Patrol (👮‍♂️)");
    else if (minDistance === dAmbulance) setClosestService("Alijis Rescue Ambulance (🚑)");
    else setClosestService("BFP Fire Station Truck (🚒)");
  }, [location, tanodPos, ambulancePos, firePos]);

  useEffect(() => {
    loadLocalHistory();
    requestPermissions();

    // 🔄 Simulation Loop: Updates positions and shifts coordinates every 3.5 seconds
    const simulationInterval = setInterval(() => {
      routeIndex.current = (routeIndex.current + 1) % 4; // Loop between 0 and 3 smoothly
      
      setTanodPos(SIMULATED_TANOD_ROUTE[routeIndex.current]);
      setAmbulancePos(SIMULATED_AMBULANCE_ROUTE[routeIndex.current]);
      setFirePos(SIMULATED_FIRE_ROUTE[routeIndex.current]);
    }, 3500);

    return () => {
      clearInterval(simulationInterval);
      if (locationWatcher.current) locationWatcher.current.remove();
    };
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

  // --- SOS SIGNAL (SUPABASE COUPLING) ---
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
      // 🌟 CHANGED: Routing this directly into the unified 'reports' database table
      const { error } = await supabase.from("reports").insert([
        { 
          description: "🚨 SOS SIGNAL DETECTED: Resident has pressed the live distress panic trigger button!",
          latitude: location.latitude, 
          longitude: location.longitude, 
          status: "urgent", // 🌟 CRUCIAL: Must match 'urgent' exactly for the Admin Hub filter!
          created_at: new Date()
        },
      ]);
      if (error) throw error;
      Alert.alert("🚨 SOS SENT", "Barangay Operations Control has received your coordinates.");
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

      {/* Live Distance Proximity Indicator */}
      <View style={styles.proximityBanner}>
        <Text style={styles.proximityLabel}>📍 Nearest Active Emergency Service:</Text>
        <Text style={styles.proximityValue}>{closestService}</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map} 
          region={{ 
            latitude: location?.latitude || 10.6432, 
            longitude: location?.longitude || 122.9515, 
            latitudeDelta: 0.015, 
            longitudeDelta: 0.015 
          }}
        >
          <UrlTile urlTemplate="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
          <Polyline coordinates={history} strokeWidth={4} strokeColor="#2e7d32" />
          
          {/* 🔵 USER PIN */}
          {location && (
            <Marker coordinate={location} title="Current Location" description="You are here" />
          )}

          {/* 👮‍♂️ TANOD PIN */}
          <Marker coordinate={tanodPos} title="Tanod Patrol" description="Status: Active Patrol">
            <View style={styles.serviceMarker}>
              <Text style={{ fontSize: 30 }}>👮‍♂️</Text>
              <View style={[styles.serviceBadge, { backgroundColor: '#1b5e20' }]}>
                <Text style={styles.badgeText}>TANOD</Text>
              </View>
            </View>
          </Marker>

          {/* 🚑 AMBULANCE PIN */}
          <Marker coordinate={ambulancePos} title="Alijis Medic Ambulance" description="Status: Standby / Ready">
            <View style={styles.serviceMarker}>
              <Text style={{ fontSize: 30 }}>🚑</Text>
              <View style={[styles.serviceBadge, { backgroundColor: '#d32f2f' }]}>
                <Text style={styles.badgeText}>RESCUE</Text>
              </View>
            </View>
          </Marker>

          {/* 🚒 FIRE TRUCK PIN */}
          <Marker coordinate={firePos} title="BFP Fire Engine Truck" description="Status: On Dispatch Area">
            <View style={styles.serviceMarker}>
              <Text style={{ fontSize: 30 }}>🚒</Text>
              <View style={[styles.serviceBadge, { backgroundColor: '#e65100' }]}>
                <Text style={styles.badgeText}>FIRE</Text>
              </View>
            </View>
          </Marker>
        </MapView>
      </View>

      <View style={styles.uiBottom}>
        <View style={styles.historyToggle}>
          <Text style={styles.toggleLabel}>Local History Logging</Text>
          <Switch value={isTracking} onValueChange={toggleTracking} />
        </View>

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
  headerTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 55, marginBottom: 5 },
  proximityBanner: { backgroundColor: '#f5f5f5', padding: 10, marginHorizontal: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  proximityLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  proximityValue: { fontSize: 13, fontWeight: '700', color: '#1b5e20', marginTop: 2 },
  mapContainer: { height: 260, width: '100%', borderBottomWidth: 1, borderBottomColor: '#eee' },
  map: { flex: 1 },
  uiBottom: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  historyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, marginBottom: 15 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#FFEBEE", justifyContent: "center", alignItems: "center" },
  sosInner: { width: 135, height: 135, borderRadius: 67.5, backgroundColor: "#c62828", justifyContent: "center", alignItems: "center", elevation: 10 },
  sosText: { color: "white", fontSize: 32, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  warningText: { marginTop: 15, color: "#d32f2f", fontSize: 11, fontWeight: '600' },
  serviceMarker: { alignItems: 'center', justifyContent: 'center' },
  serviceBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#fff', marginTop: -3 },
  badgeText: { color: '#fff', fontSize: 7, fontWeight: 'bold' }
});