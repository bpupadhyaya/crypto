/**
 * Settings Screen — Configuration, security, and migration tracker.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { MOBILE_PROVIDERS_STATUS } from '../core/providers/mobile/stub';

export function SettingsScreen() {
  const { mode, setMode, setStatus } = useWalletStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const migrationServices = Object.entries(MOBILE_PROVIDERS_STATUS).map(([name, status]) => ({
    name,
    readiness: status.readiness,
    estimatedYear: status.estimatedYear,
  }));

  const totalReadiness = Math.round(
    migrationServices.reduce((sum, s) => sum + s.readiness, 0) / migrationServices.length
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ─── Wallet Mode ─── */}
        <Text style={styles.sectionTitle}>Interface</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mode</Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'simple' && styles.modeButtonActive]}
                onPress={() => setMode('simple')}
              >
                <Text style={[styles.modeButtonText, mode === 'simple' && styles.modeButtonTextActive]}>
                  Simple
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'pro' && styles.modeButtonActive]}
                onPress={() => setMode('pro')}
              >
                <Text style={[styles.modeButtonText, mode === 'pro' && styles.modeButtonTextActive]}>
                  Pro
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Language</Text>
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', '10+ languages in next update')}>
              <Text style={styles.rowValue}>English ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Security ─── */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Biometric Unlock</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#333', true: '#22c55e40' }}
              thumbColor={biometricEnabled ? '#22c55e' : '#666'}
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Change Password</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>View Recovery Phrase</Text>
            <Text style={styles.rowValue}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Encryption</Text>
            <Text style={styles.rowValueGreen}>AES-256-GCM + Argon2id</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>PQC Status</Text>
            <Text style={styles.rowValueYellow}>Vault Ready • Chain Pending</Text>
          </View>
        </View>

        {/* ─── Network / Migration Tracker ─── */}
        <Text style={styles.sectionTitle}>Network Migration</Text>
        <View style={styles.card}>
          <Text style={styles.migrationDesc}>
            Open Wallet is designed to migrate from server-based to 100% mobile peer-to-peer
            as phone hardware improves. This tracker shows progress.
          </Text>

          {/* Overall progress */}
          <View style={styles.overallProgress}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Overall</Text>
              <Text style={styles.rowValueGreen}>{totalReadiness}% → Mobile</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${totalReadiness}%` }]} />
            </View>
          </View>

          {/* Per-service */}
          {migrationServices.map((service) => (
            <View key={service.name} style={styles.migrationRow}>
              <View style={styles.migrationHeader}>
                <Text style={styles.migrationName}>
                  {service.name.charAt(0).toUpperCase() + service.name.slice(1)}
                </Text>
                <Text style={styles.migrationYear}>~{service.estimatedYear}</Text>
              </View>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressFillSmall, { width: `${Math.max(service.readiness, 2)}%` }]} />
              </View>
              <Text style={styles.migrationStatus}>
                {service.readiness === 0 ? 'Server' :
                 service.readiness < 50 ? 'Researching' :
                 service.readiness < 100 ? 'Hybrid' : 'Mobile'}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── Connected Hardware ─── */}
        <Text style={styles.sectionTitle}>Hardware Wallets</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Connect Ledger</Text>
            <Text style={styles.rowValueMuted}>Not connected</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Connect Trezor</Text>
            <Text style={styles.rowValueMuted}>Not connected</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Keystone (QR)</Text>
            <Text style={styles.rowValueMuted}>Not connected</Text>
          </TouchableOpacity>
        </View>

        {/* ─── About ─── */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>0.1.0-alpha</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>License</Text>
            <Text style={styles.rowValue}>MIT (Open Source)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Mission</Text>
            <Text style={[styles.rowValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              Maintaining and improving human life at near-zero cost
            </Text>
          </View>
        </View>

        {/* ─── Sign Out ─── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert('Sign Out', 'Lock your wallet? You can unlock with PIN or password.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => {
                  setStatus('locked');
                  // Tabs layout detects status change and redirects to unlock
                },
              },
            ]);
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    color: '#a0a0b0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowLabel: { color: '#f0f0f5', fontSize: 15 },
  rowValue: { color: '#a0a0b0', fontSize: 14 },
  rowValueGreen: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  rowValueYellow: { color: '#eab308', fontSize: 13, fontWeight: '600' },
  rowValueMuted: { color: '#606070', fontSize: 14 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },
  modeToggle: { flexDirection: 'row', gap: 4 },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modeButtonActive: { backgroundColor: '#22c55e' },
  modeButtonText: { color: '#a0a0b0', fontSize: 13, fontWeight: '600' },
  modeButtonTextActive: { color: '#0a0a0f' },
  migrationDesc: {
    color: '#606070',
    fontSize: 12,
    lineHeight: 18,
    padding: 16,
    paddingBottom: 8,
  },
  overallProgress: { paddingHorizontal: 16, paddingBottom: 16 },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    marginTop: 8,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#22c55e',
    borderRadius: 3,
    minWidth: 4,
  },
  migrationRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  migrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  migrationName: { color: '#a0a0b0', fontSize: 13 },
  migrationYear: { color: '#606070', fontSize: 12 },
  progressBarSmall: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  progressFillSmall: {
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    minWidth: 2,
  },
  migrationStatus: {
    color: '#606070',
    fontSize: 11,
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: '#ef444420',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
