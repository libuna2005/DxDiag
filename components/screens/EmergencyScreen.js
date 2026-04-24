import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Platform 
} from "react-native";
import MapView, { UrlTile, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { supabase } from "../../supabase";

export default function EmergencyScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Initializing GPS...");

  useEffect(() => {
    requestLocationPermission();
  }, []);

  async function requestLocationPermission() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setStatusMsg("Permission Denied");
      Alert.alert("Permission Denied", "Location access is required for SOS.");
      return;
    }
    fetchCurrentLocation();
  }

  async function fetchCurrentLocation() {
    try {
      setStatusMsg("Acquiring GPS Signal...");
      let lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) updatePosition(lastKnown);

      let currentLoc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced, 
      });
      
      updatePosition(currentLoc);
      setStatusMsg("GPS Locked");
    } catch (err) {
      console.log("Location Error:", err);
      setStatusMsg("GPS Error: Try moving near a window");
    }
  }

  function updatePosition(loc) {
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setLocation(loc.coords);
    setRegion(coords);
  }

  function handleSOSPress() {
    if (!location) {
      Alert.alert("GPS Not Ready", "Still acquiring your precise location.");
      fetchCurrentLocation();
      return;
    }

    Alert.alert(
      "Confirm Emergency",
      "Your location is being tracked. Alert the authorities immediately?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", style: "destructive", onPress: () => executeEmergencySignal() }
      ]
    );
  }

  async function executeEmergencySignal() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("emergency").insert([
        {
          latitude: location.latitude,
          longitude: location.longitude,
          user_id: user?.id,
          status: "pending" // Ensure this column exists in Supabase!
        },
      ]);

      if (error) throw error;
      Alert.alert("🚨 SOS SENT", "Barangay authorities have received your signal.");
    } catch (err) {
      Alert.alert("Database Error", "Make sure the 'status' column exists in your table.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Emergency Services</Text>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.webWarning}>Maps are optimized for Mobile devices.</Text>
          </View>
        ) : region ? (
          <MapView style={styles.map} region={region}>
            <UrlTile 
                // Using the 'HOT' (Humanitarian) tile server as it's often more reliable
                urlTemplate="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" 
                maximumZ={19}
                flipY={false}
                tileHttpServerHeaders={{
                    "User-Agent": "CHMSU-Barangay-Project-V1-StudentDev"
                }}
            />
            <Marker coordinate={region} title="Your Location" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#c62828" />
            <Text style={styles.loadingText}>{statusMsg}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.uiBottom}>
        <Text style={styles.statusSubText}>
            {location ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : statusMsg}
        </Text>

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
  headerTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginTop: 60, marginBottom: 20 },
  mapContainer: { height: 260, width: '100%', borderBottomWidth: 1, borderBottomColor: '#eee' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 20 },
  webWarning: { color: '#666', textAlign: 'center', fontSize: 13 },
  loadingText: { marginTop: 10, color: '#888', fontSize: 12 },
  statusSubText: { fontSize: 12, color: "#999", marginBottom: 20 },
  uiBottom: { flex: 1, justifyContent: "center", alignItems: "center", padding: 25 },
  sosButton: { width: 190, height: 190, borderRadius: 95, backgroundColor: "#FFEBEE", justifyContent: "center", alignItems: "center" },
  sosInner: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#c62828", justifyContent: "center", alignItems: "center", elevation: 12 },
  sosText: { color: "white", fontSize: 40, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  warningText: { marginTop: 40, textAlign: "center", color: "#d32f2f", fontSize: 11, fontWeight: '600' }
});