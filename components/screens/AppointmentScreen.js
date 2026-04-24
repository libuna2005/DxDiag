import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, ScrollView 
} from "react-native";
import { supabase } from "../../supabase";

export default function AppointmentScreen() {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState(null); 

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 📥 FETCH APPOINTMENTS
  async function fetchAppointments() {
    setFetching(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Prevent fetching if no user is found
      if (authError || !user) {
        setFetching(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.log("Fetch Error:", error.message);
    } finally {
      setFetching(false);
    }
  }

  // 📝 SAVE OR UPDATE APPOINTMENT
  async function handleAppointment() {
    if (!name || !purpose) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        Alert.alert("Authentication Error", "You must be logged in to book.");
        setLoading(false);
        return;
      }

      if (editingId) {
        // UPDATE EXISTING
        const { error } = await supabase
          .from("appointments")
          .update({ fullname: name, purpose: purpose })
          .eq("id", editingId);
          
        if (error) throw error;
        Alert.alert("Updated ✅", "Your appointment has been modified.");
      } else {
        // INSERT NEW
        const { error } = await supabase.from("appointments").insert([
          {
            fullname: name,
            purpose: purpose,
            user_id: user.id, // Ensure this is not null
            status: "pending",
          },
        ]);
        
        if (error) throw error;
        Alert.alert("Success ✅", "Your appointment has been submitted.");
      }

      // Reset form
      setName("");
      setPurpose("");
      setEditingId(null);
      
      // 🚀 FORCE WAIT for the fetch to complete before removing the loading spinner
      await fetchAppointments(); 
      
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  // ✏️ PREPARE EDIT
  function startEdit(item) {
    if (item.status !== "pending") {
      Alert.alert("Denied", "You can only edit pending appointments.");
      return;
    }
    setName(item.fullname);
    setPurpose(item.purpose);
    setEditingId(item.id);
  }

  // 🗑️ DELETE APPOINTMENT
  async function deleteAppointment(id) {
    Alert.alert("Delete", "Are you sure you want to remove this appointment?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          setFetching(true); // Show loader while deleting
          const { error } = await supabase.from("appointments").delete().eq("id", id);
          if (error) {
            Alert.alert("Error", error.message);
            setFetching(false);
          } else {
            await fetchAppointments(); // Wait for list to refresh
          }
        } 
      }
    ]);
  }

  const renderAppointmentItem = (item) => (
    <View key={item.id} style={styles.appointmentCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.aptName}>{item.fullname}</Text>
        <Text style={styles.aptPurpose}>{item.purpose}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => startEdit(item)}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
            <Text style={styles.deleteLink}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#FFF9C4' : '#C8E6C9' }]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }} // 🚀 Added padding so bottom bar doesn't cut off list
    >
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🗓️</Text>
        <Text style={styles.bannerTag}>OFFICIAL APPOINTMENT</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{editingId ? "Edit Appointment" : "Book an Appointment"}</Text>
        <Text style={styles.subtitle}>Fill in your details to schedule a visit.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Enter your full name"
          onChangeText={setName}
          value={name}
          style={styles.input}
        />

        <Text style={styles.label}>Purpose</Text>
        <TextInput
          placeholder="e.g., Barangay Clearance"
          onChangeText={setPurpose}
          value={purpose}
          multiline
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.submitBtn, { flex: 2 }, loading && styles.disabled]} 
            onPress={handleAppointment}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editingId ? "Update Info" : "Submit Appointment"}</Text>}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity 
              style={[styles.submitBtn, { flex: 1, backgroundColor: '#999' }]} 
              onPress={() => { setEditingId(null); setName(""); setPurpose(""); }}
            >
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Your Appointments</Text>
        {fetching ? (
          <ActivityIndicator color="#2e7d32" size="large" />
        ) : appointments.length > 0 ? (
          appointments.map((item) => renderAppointmentItem(item))
        ) : (
          <Text style={styles.emptyText}>No appointments found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfdfd" },
  banner: { height: 120, backgroundColor: "#2e7d32", borderBottomLeftRadius: 30, borderBottomRightRadius: 30, justifyContent: "center", alignItems: "center" },
  bannerIcon: { fontSize: 40, marginBottom: 5 },
  bannerTag: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  header: { padding: 25 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1b5e20" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 5 },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#333" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: "#2e7d32", padding: 18, borderRadius: 12, alignItems: "center", elevation: 3 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  disabled: { backgroundColor: "#a5d6a7" },
  listSection: { padding: 20, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: "#333" },
  appointmentCard: { backgroundColor: "#fff", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, elevation: 2 },
  aptName: { fontSize: 16, fontWeight: "bold", color: "#2e7d32" },
  aptPurpose: { fontSize: 13, color: "#666", marginTop: 2 },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 15 },
  editLink: { color: '#1976D2', fontWeight: '600', fontSize: 13 },
  deleteLink: { color: '#D32F2F', fontWeight: '600', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "800", color: "#5d4037" },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontStyle: 'italic' }
});