import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { supabase } from '../../supabase';

// Pass the navigation prop to handle transitions between native stack items
export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register States
  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // 🔑 LOGIN FUNCTION
  async function handleLogin() {
    if (!email || !password) {
      setStatus({ msg: 'Credentials required.', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus({ msg: 'Authenticating...', type: 'info' });

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setStatus({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // 📝 REGISTER FUNCTION
  async function handleRegister() {
    if (!regEmail || !regPassword) {
      setStatus({ msg: 'All fields are mandatory.', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus({ msg: 'Processing registration...', type: 'info' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });
      if (error) throw error;
      if (data.user) {
        setStatus({ msg: 'Account created. Please check your email.', type: 'success' });
        // Keep message visible for a moment before closing
        setTimeout(() => {
            setShowRegister(false);
            setStatus({ msg: '', type: '' });
        }, 3000);
      }
    } catch (err) {
      setStatus({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Barangay System</Text>
        <Text style={styles.subHeader}>Sign in to continue</Text>

        {/* STATUS BANNER FOR LOGIN SCREEN */}
        {!showRegister && status.msg ? (
          <View style={[styles.statusBanner, status.type === 'error' ? styles.statusError : (status.type === 'info' ? styles.statusInfo : styles.statusSuccess)]}>
            <Text style={styles.statusText}>{status.msg}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput 
            placeholder="example@domain.com" 
            style={styles.inputField} 
            value={email}
            onChangeText={setEmail} 
            autoCapitalize="none" 
          />
          
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput 
              placeholder="Enter password" 
              style={styles.passwordInput} 
              secureTextEntry={!showPassword} 
              value={password}
              onChangeText={setPassword} 
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>{showPassword ? "HIDE" : "SHOW"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>LOGIN</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setShowRegister(true); setStatus({msg:'', type:''}); }}>
          <Text style={styles.secondaryLink}>Create an account</Text>
        </TouchableOpacity>

        {/* 🛡️ SEPARATE ADMIN LOGIN AREA GATEWAY */}
        <View style={styles.adminDividerContainer}>
          <View style={styles.hairline} />
          <Text style={styles.dividerText}>MANAGEMENT ONLY</Text>
          <View style={styles.hairline} />
        </View>

        <TouchableOpacity 
          style={styles.adminLinkBtn} 
          onPress={() => navigation.navigate('AdminLogin')}
          activeOpacity={0.7}
        >
          <Text style={styles.adminLinkText}>🛡️ Login as Administrator</Text>
        </TouchableOpacity>

        {/* DEVELOPER NAMES SECTION */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>DEVELOPED BY:</Text>
          <Text style={styles.devName}>LANCE EDUARD LIBUNA</Text>
          <Text style={styles.devName}>CLARK KENNETH SABORDO</Text>
          <Text style={styles.devName}>EUGENE SAMBAJON</Text>
          <Text style={styles.devName}>  </Text>
          <Text style={styles.devName}>Demo Only Enter This </Text>
          <Text style={styles.devName}>test@gmail.com</Text>
          <Text style={styles.devName}>12345678</Text>
        </View>
      </ScrollView>

      {/* REGISTER MODAL */}
      <Modal visible={showRegister} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>User Registration</Text>
            
            {/* STATUS BANNER INSIDE MODAL (Visible during registration) */}
            {status.msg ? (
              <View style={[styles.statusBanner, status.type === 'error' ? styles.statusError : (status.type === 'info' ? styles.statusInfo : styles.statusSuccess)]}>
                <Text style={styles.statusText}>{status.msg}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput 
              placeholder="email@domain.com" 
              style={styles.inputField} 
              onChangeText={setRegEmail} 
              autoCapitalize="none" 
            />

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                placeholder="Minimum 6 characters" 
                style={styles.passwordInput} 
                secureTextEntry={!showRegPassword} 
                onChangeText={setRegPassword} 
              />
              <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>{showRegPassword ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>REGISTER NOW</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowRegister(false); setStatus({msg:'', type:''}); }} style={styles.cancelButton}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  header: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  subHeader: { fontSize: 16, color: '#666666', textAlign: 'center', marginBottom: 30, marginTop: 5 },
  statusBanner: { padding: 12, borderRadius: 6, marginBottom: 20 },
  statusText: { textAlign: 'center', fontSize: 14, fontWeight: '500' },
  statusError: { backgroundColor: '#FDECEA', borderLeftWidth: 4, borderLeftColor: '#D32F2F' },
  statusInfo: { backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: '#1976D2' },
  statusSuccess: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#388E3C' },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 8 },
  inputField: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 6, fontSize: 16, borderColor: '#E0E0E0', borderWidth: 1, marginBottom: 15, width: '100%' },
  passwordWrapper: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 6, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', marginBottom: 15 },
  passwordInput: { flex: 1, padding: 12, fontSize: 16 },
  toggleBtn: { paddingRight: 15 },
  toggleText: { fontSize: 12, fontWeight: '700', color: '#1976D2' },
  primaryButton: { backgroundColor: '#1B5E20', padding: 16, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  secondaryLink: { textAlign: 'center', marginTop: 25, color: '#1B5E20', fontWeight: '600', textDecorationLine: 'underline' },
  
  // 🎨 Admin Area UI Custom Styles
  adminDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    marginBottom: 15,
  },
  hairline: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999999',
    fontSize: 10,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 1
  },
  adminLinkBtn: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  adminLinkText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '700',
  },

  footer: { marginTop: 25, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 20, alignItems: 'center' },
  footerLabel: { fontSize: 10, color: '#999999', fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  devName: { fontSize: 11, color: '#666666', fontWeight: '600', marginBottom: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
  modalBody: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  registerButton: { backgroundColor: '#1565C0', padding: 16, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#D32F2F', fontWeight: '600' }
});