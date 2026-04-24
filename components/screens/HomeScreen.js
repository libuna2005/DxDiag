import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 🏛️ HERO SECTION */}
      <View style={styles.hero}>
        <Text style={styles.welcome}>Mabuhay! 🇵🇭</Text>
        <Text style={styles.barangayName}>Barangay Alijis Official App</Text>
      </View>

      {/* 📊 QUICK STATS BANNER */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>New News</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#eee' }]}>
          <Text style={styles.statNumber}>Active</Text>
          <Text style={styles.statLabel}>Hotlines</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>Open</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Main Services</Text>

      {/* 📱 SERVICES GRID */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('News')}>
          <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.icon}>📢</Text>
          </View>
          <Text style={styles.cardText}>Announcements</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SOS')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.icon}>🚨</Text>
          </View>
          <Text style={styles.cardText}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Report')}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.icon}>📋</Text>
          </View>
          <Text style={styles.cardText}>File Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Appointment')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.icon}>📅</Text>
          </View>
          <Text style={styles.cardText}>Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* 📞 QUICK CONTACT SECTION */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerTitle}>Barangay Hotline</Text>
        <Text style={styles.hotlineText}>📞 (034) 433-1234</Text>
        <Text style={styles.footerSub}>Available 24/7 for resident assistance</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  
  // Header Style
  hero: { 
    backgroundColor: '#2e7d32', 
    padding: 30, 
    paddingTop: 60, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    marginBottom: 20
  },
  welcome: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  barangayName: { fontSize: 16, color: '#e8f5e9', marginTop: 5, opacity: 0.9 },

  // Stats Style
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: -40, // Pulls it up into the hero section
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  statLabel: { fontSize: 12, color: '#999' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, marginTop: 30, marginBottom: 15, color: '#333' },

  // Grid Style
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  card: { 
    width: '47%', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 20, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  icon: { fontSize: 30 },
  cardText: { fontWeight: '700', fontSize: 13, color: '#444' },

  // Footer Style
  footerInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 40
  },
  footerTitle: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  hotlineText: { fontSize: 22, fontWeight: 'bold', color: '#c62828', marginVertical: 5 },
  footerSub: { fontSize: 11, color: '#999' }
});