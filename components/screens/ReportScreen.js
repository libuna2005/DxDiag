import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView, Modal, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';

export default function ReportScreen() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [category, setCategory] = useState('Sunog (Fire Incident)');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null); 
  const [uploadedUrl, setUploadedUrl] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editReportId, setEditReportId] = useState(null);

  const categories = ['Sunog (Fire Incident)', 'Baha (Flooding/Heavy Rain)', 'Crime', 'Medical Emergency'];

  useEffect(() => {
    fetchMyReports();
  }, []);

  async function fetchMyReports() {
    setLoading(true);
    try {
      // Check auth status here too
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found, cannot fetch reports.");
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReports(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function uploadImageToStorage(uri) {
    try {
      const fileExt = 'jpg';
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type: 'image/jpeg',
      });

      const { data, error } = await supabase.storage
        .from('report-attachments')
        .upload(filePath, formData);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('report-attachments').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Storage upload failed:", err);
      throw err; // Rethrow to stop submission
    }
  }

  async function handleSubmitReport() {
    console.log("Submit button pressed"); 

    if (!description.trim()) {
      Alert.alert("Missing Input", "Please provide a description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("You are not logged in. Please sign in.");
      }

      console.log("User authenticated:", user.id);

      let finalStorageUrl = uploadedUrl;
      if (imageUri && !uploadedUrl) {
        console.log("Uploading image...");
        finalStorageUrl = await uploadImageToStorage(imageUri);
      }

      const payload = {
        title: category,
        description: description.trim(),
        image_url: finalStorageUrl,
        status: 'pending',
        user_id: user.id
      };

      console.log("Saving to database...");
      if (isEditing) {
        const { error } = await supabase.from('reports').update(payload).eq('id', editReportId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reports').insert([payload]);
        if (error) throw error;
      }

      console.log("Success!");
      Alert.alert("Success", "Report submitted!");
      resetFormState();
      fetchMyReports();
    } catch (err) {
      console.error("Final Error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetFormState() {
    setIsEditing(false);
    setEditReportId(null);
    setCategory('Sunog (Fire Incident)');
    setDescription('');
    setImageUri(null);
    setUploadedUrl(null);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <Text style={styles.sectionLabel}>Evidence Media Attachment</Text>
        <TouchableOpacity style={styles.photoPickerContainer} onPress={handlePickImage}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.attachedImagePreview} /> : 
            <View style={styles.photoPickerPlaceholder}><Text>Upload Photo Evidence</Text></View>}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Select Risk Category</Text>
        <TouchableOpacity style={styles.categoryDropdownFake} onPress={() => setModalVisible(true)}>
          <Text style={styles.categoryValueText}>⚠️ {category}</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList data={categories} keyExtractor={(item) => item} renderItem={({item}) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setCategory(item); setModalVisible(false); }}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )} />
            </View>
          </View>
        </Modal>

        <Text style={styles.sectionLabel}>Incident Description</Text>
        <TextInput style={styles.textAreaInput} value={description} onChangeText={setDescription} multiline placeholder="Describe the incident..." />

        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSubmitReport} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionBtnText}>{isEditing ? "Save Changes" : "Submit Report"}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  photoPickerContainer: { width: '100%', height: 160, backgroundColor: '#f1f5f9', borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  attachedImagePreview: { width: '100%', height: '100%', borderRadius: 10 },
  categoryDropdownFake: { backgroundColor: '#fff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  categoryValueText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  textAreaInput: { backgroundColor: '#fff', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 100 },
  primaryActionBtn: { backgroundColor: '#064e3b', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  primaryActionBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }
});