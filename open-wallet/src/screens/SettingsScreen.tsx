/**
 * Settings Screen — Security, PIN, biometric, mode, sign out.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { authManager } from '../core/auth/auth';
import { PinPad } from '../components/PinPad';
import { MOBILE_PROVIDERS_STATUS } from '../core/providers/mobile/stub';
import { BackupScreen } from './BackupScreen';

type SettingsView = 'main' | 'change-pin' | 'new-pin' | 'confirm-pin' | 'backup';

export function SettingsScreen() {
  const { mode, setMode, setStatus, biometricEnabled, setBiometricEnabled } = useWalletStore();
  const [view, setView] = useState<SettingsView>('main');
  const [pinToChange, setPinToChange] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);

  useEffect(() => {
    authManager.isBiometricAvailable().then(({ available }) => setBiometricAvailable(available));
    authManager.isPinConfigured().then(setPinConfigured);
  }, []);

  // ─── PIN Change Flow ───

  const handleCurrentPin = async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setView('new-pin');
      } else {
        Alert.alert('Wrong PIN', 'The PIN you entered is incorrect.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleNewPin = (pin: string) => {
    setPinToChange(pin);
    setView('confirm-pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== pinToChange) {
      Alert.alert('Mismatch', 'PINs do not match. Try again.');
      setView('new-pin');
      setPinToChange('');
      return;
    }
    try {
      await authManager.setupPin(pin);
      setPinConfigured(true);
      Alert.alert('Success', 'PIN updated successfully.');
      setView('main');
    } catch {
      Alert.alert('Error', 'Failed to update PIN.');
    }
  };

  const handleSetupPin = (pin: string) => {
    setPinToChange(pin);
    setView('confirm-pin');
  };

  // ─── Biometric Toggle ───

  const toggleBiometric = async (enable: boolean) => {
    if (enable) {
      const success = await authManager.enableBiometric();
      if (success) {
        setBiometricEnabled(true);
      } else {
        Alert.alert('Failed', 'Could not enable biometric unlock.');
      }
    } else {
      await authManager.disableBiometric();
      setBiometricEnabled(false);
    }
  };

  // ─── PIN Screens ───

  if (view === 'change-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title="Enter Current PIN" subtitle="Verify before changing" onComplete={handleCurrentPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => setView('main')}>
          <Text style={st.backText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'new-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title={pinConfigured ? 'New PIN' : 'Set Your PIN'} subtitle="Choose a 6-digit PIN" onComplete={pinConfigured ? handleNewPin : handleSetupPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => setView('main')}>
          <Text style={st.backText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'confirm-pin') {
    return (
      <SafeAreaView style={st.container}>
        <PinPad title="Confirm PIN" subtitle="Enter the same PIN again" onComplete={handleConfirmPin} />
        <TouchableOpacity style={st.backBtn} onPress={() => { setView('new-pin'); setPinToChange(''); }}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (view === 'backup') {
    return <BackupScreen onClose={() => setView('main')} />;
  }

  // ─── Main Settings ───

  const migrationServices = Object.entries(MOBILE_PROVIDERS_STATUS).map(([name, status]) => ({
    name, readiness: status.readiness, estimatedYear: status.estimatedYear,
  }));
  const totalReadiness = Math.round(
    migrationServices.reduce((sum, s) => sum + s.readiness, 0) / migrationServices.length
  );

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Interface */}
        <Text style={st.section}>Interface</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Mode</Text>
            <View style={st.modeToggle}>
              {(['simple', 'pro'] as const).map((m) => (
                <TouchableOpacity key={m} style={[st.modeBtn, mode === m && st.modeBtnActive]} onPress={() => setMode(m)}>
                  <Text style={[st.modeBtnText, mode === m && st.modeBtnTextActive]}>{m === 'simple' ? 'Simple' : 'Pro'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Security */}
        <Text style={st.section}>Security</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.row} onPress={() => setView(pinConfigured ? 'change-pin' : 'new-pin')}>
            <Text style={st.label}>{pinConfigured ? 'Change PIN' : 'Set Up PIN'}</Text>
            <Text style={st.value}>{pinConfigured ? '••••••  ›' : 'Not set  ›'}</Text>
          </TouchableOpacity>
          <View style={st.divider} />
          {biometricAvailable && (
            <>
              <View style={st.row}>
                <Text style={st.label}>Biometric Unlock</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: '#333', true: '#22c55e40' }}
                  thumbColor={biometricEnabled ? '#22c55e' : '#666'}
                />
              </View>
              <View style={st.divider} />
            </>
          )}
          <View style={st.row}>
            <Text style={st.label}>Encryption</Text>
            <Text style={st.valueGreen}>AES-256-GCM + PBKDF2</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>PQC Status</Text>
            <Text style={st.valueYellow}>Vault Ready • Chain Pending</Text>
          </View>
          <View style={st.divider} />
          <TouchableOpacity style={st.row} onPress={() => setView('backup')}>
            <Text style={st.label}>Backup / Recovery Phrase</Text>
            <Text style={st.value}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Network Migration */}
        <Text style={st.section}>Network Migration</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Progress</Text>
            <Text style={st.valueGreen}>{totalReadiness}% → Mobile P2P</Text>
          </View>
          <View style={st.progressBar}>
            <View style={[st.progressFill, { width: `${Math.max(totalReadiness, 2)}%` }]} />
          </View>
          {migrationServices.map((svc) => (
            <View key={svc.name} style={st.migrationRow}>
              <Text style={st.migrationName}>{svc.name.charAt(0).toUpperCase() + svc.name.slice(1)}</Text>
              <Text style={st.migrationYear}>~{svc.estimatedYear}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        <Text style={st.section}>About</Text>
        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Version</Text>
            <Text style={st.value}>0.1.0-alpha</Text>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <Text style={st.label}>License</Text>
            <Text style={st.value}>MIT (Open Source)</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={st.signOutBtn}
          onPress={() => Alert.alert('Sign Out', 'Lock your wallet?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => setStatus('locked') },
          ])}
        >
          <Text style={st.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  section: { color: '#a0a0b0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#16161f', borderRadius: 16, padding: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  label: { color: '#f0f0f5', fontSize: 15 },
  value: { color: '#a0a0b0', fontSize: 14 },
  valueGreen: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  valueYellow: { color: '#eab308', fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },
  modeToggle: { flexDirection: 'row', gap: 4 },
  modeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  modeBtnActive: { backgroundColor: '#22c55e' },
  modeBtnText: { color: '#a0a0b0', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: '#0a0a0f' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginHorizontal: 16, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#22c55e', borderRadius: 2 },
  migrationRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  migrationName: { color: '#a0a0b0', fontSize: 13 },
  migrationYear: { color: '#606070', fontSize: 12 },
  signOutBtn: { backgroundColor: '#ef444420', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  signOutText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  backBtn: { paddingVertical: 20, alignItems: 'center' },
  backText: { color: '#3b82f6', fontSize: 16 },
});
