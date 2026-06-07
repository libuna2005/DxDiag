import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "../../supabase";

export default function AnnouncementScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order('created_at', { ascending: false }); // Show newest first

    if (error) {
      console.log(error);
      // Fallback sample data if database fails or is empty
      setAnnouncements([
        { id: '1', title: '📢 Barangay Clearance', description: 'Available for pick-up at the health center today until 5:00 PM.' },
        { id: '2', title: '💰 Ayuda Release', description: 'Social Pension for seniors is releasing today at the Multi-purpose hall.' },
      ]);
    } else {
      setAnnouncements(data);
    }
    setRefreshing(false);
  }

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
      <Text style={styles.dateText}>Today</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Barangay Announcements</Text>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchAnnouncements} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No announcements yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // Light grey background like social media
    padding: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#2e7d32", // Green accent strip
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardDescription: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  dateText: {
    fontSize: 11,
    color: "#999",
    marginTop: 12,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  }
});