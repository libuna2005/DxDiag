import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, FlatList, 
  Image, ActivityIndicator, RefreshControl, Platform 
} from "react-native";
import { supabase } from "../../supabase"; 

export default function HomeScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      if (!refreshing) setLoading(true);
      
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Directly set the data from Supabase, or an empty array if null
      setAnnouncements(data || []);
      
    } catch (error) {
      console.error("Error fetching data:", error.message);
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchAnnouncements();
  }

  // Elegant Dashboard Header Component 
  const renderHeader = () => (
    <View style={styles.dashboardHeader}>
      <Text style={styles.welcomeText}>Maayong Adlaw! 👋</Text>
      <Text style={styles.appTitle}>Barangay Alijis Hub</Text>
      
      {/* Sleek Context Alert Ribbon instead of big chunky banner */}
      <View style={styles.infoRibbon}>
        <Text style={styles.infoRibbonText}>
          ✨ Pull down on your feed to refresh real-time community broadcasts.
        </Text>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Latest Announcements</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1b5e20" />
        <Text style={styles.loadingText}>Loading Announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1b5e20"]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No live announcements at the moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Top row showing Author Information cleanly aligned left without any icons */}
            <View style={styles.cardHeader}>
              <View style={styles.metaContainer}>
                <Text style={styles.authorTitle}>Barangay Council Official</Text>
                <Text style={styles.timestamp}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                  }) : "Recent"}
                </Text>
              </View>
            </View>

            {/* Structured Content Box */}
            <View style={styles.cardBody}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementContent}>{item.content}</Text>
            </View>

            {/* Embedded Announcement Image Layout */}
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" }, // Modern slate background
  listContent: { paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14, fontWeight: "600" },
  
  // Dashboard Header Restructuring
  dashboardHeader: { 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'ios' ? 65 : 55, 
    paddingBottom: 24, 
    backgroundColor: "#ffffff", 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24, 
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2 
  },
  welcomeText: { fontSize: 13, color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  appTitle: { fontSize: 28, fontWeight: "800", color: "#1b5e20", marginTop: 2, letterSpacing: -0.5 },
  
  // Refined Interactive Context Banner
  infoRibbon: { backgroundColor: "#f0fdf4", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: "#dcfce7" },
  infoRibbonText: { fontSize: 12, color: "#166534", fontWeight: "500", lineHeight: 16 },
  
  // Row aligning Section Title with a dynamic blinking-style text tag
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", letterSpacing: -0.2 },
  liveIndicator: { flexDirection: "row", alignItems: "center", backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444", marginRight: 5 },
  liveText: { fontSize: 10, color: "#991b1b", fontWeight: "800", letterSpacing: 0.5 },

  // Premium UI Card Elements
  card: { 
    backgroundColor: "#ffffff", 
    marginHorizontal: 20, 
    marginBottom: 16, 
    borderRadius: 16, 
    padding: 18, 
    borderLeftWidth: 5, 
    borderLeftColor: '#1b5e20',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2 
  },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  metaContainer: { flex: 1 },
  authorTitle: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  timestamp: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: "500" },

  cardBody: { marginBottom: 6 },
  announcementTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 6, lineHeight: 24, letterSpacing: -0.3 },
  announcementContent: { fontSize: 14, color: "#475569", lineHeight: 22, fontWeight: "400" },
  cardImage: { width: "100%", height: 190, borderRadius: 12, marginTop: 12 },

  // Empty State
  emptyStateContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' }
});