import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Image, 
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform 
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "../../supabase";

export default function ReportScreen() {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); 
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri) {
    if (!uri) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = uri.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('report_photos')
        .upload(fileName, arrayBuffer, { contentType: blob.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('report_photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      return null;
    }
  }

  async function submitReport() {
    if (description.length < 5) {
      Alert.alert("Notice", "Please describe the issue.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let finalPhotoUrl = await uploadImage(image);

      const { error } = await supabase.from("reports").insert([
        {
          description,
          user_id: user?.id,
          status: 'pending',
          photo_url: finalPhotoUrl,
          created_at: new Date()
        }
      ]);

      if (error) throw error;

      Alert.alert("Success ✅", "Report submitted to the Council.");
      setDescription(""); 
      setImage(null);
    } catch (error) {
      Alert.alert("Database Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.mainWrapper}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent} // 🚀 THIS FIXES THE BUTTON
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Submit a Report</Text>
          <Text style={styles.subtitle}>Directly alert the Barangay Council of issues.</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={{fontSize: 40}}>📸</Text>
                <Text style={styles.photoLabel}>Add Photo (Optional)</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Issue Description</Text>
          <TextInput
            placeholder="Tell us what's happening..."
            onChangeText={setDescription}
            value={description}
            multiline
            style={styles.textArea}
          />

          {/* 🔘 THE SUBMIT BUTTON */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabled]} 
            onPress={submitReport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              ⚠️ Reports are reviewed by the Barangay Council. False reporting is subject to local ordinances.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#fdfdfd' },
  container: { flex: 1 },
  scrollContent: { 
    paddingBottom: 120 // 🚀 Adds space so button isn't hidden by nav bar
  },
  header: { padding: 25, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  form: { paddingHorizontal: 20 },
  photoPicker: {
    backgroundColor: '#f9f9f9',
    height: 180,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden'
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoLabel: { color: '#999', fontSize: 12, marginTop: 5 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 8, color: '#333' },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 25,
    elevation: 1
  },
  submitBtn: {
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { backgroundColor: '#a5d6a7' },
  noteBox: {
    backgroundColor: '#fff9c4',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#fbc02d'
  },
  noteText: { fontSize: 12, color: '#5d4037', lineHeight: 18 }
});