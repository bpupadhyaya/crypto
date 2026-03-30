/**
 * Social Recovery Screen — Set up social recovery with trusted guardians.
 *
 * Allows users to add guardians, configure M-of-N thresholds,
 * distribute encrypted seed fragments, and monitor recovery readiness.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Guardian {
  uid: string;
  name: string;
  relationship: string;
  addedAt: string;
  shareDistributed: boolean;
  lastVerified: string | null;
}

interface RecoveryConfig {
  threshold: number;
  totalGuardians: number;
  status: 'not_configured' | 'configured' | 'shares_distributed' | 'ready';
  createdAt: string;
}

type TabKey = 'setup' | 'guardians' | 'recover';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_GUARDIANS: Guardian[] = [
  {
    uid: 'uid_guardian_001', name: 'Alice Sharma', relationship: 'Sister',
    addedAt: '2026-03-15', shareDistributed: true, lastVerified: '2026-03-28',
  },
  {
    uid: 'uid_guardian_002', name: 'Bob Chen', relationship: 'Best Friend',
    addedAt: '2026-03-16', shareDistributed: true, lastVerified: '2026-03-27',
  },
  {
    uid: 'uid_guardian_003', name: 'Carlos Rivera', relationship: 'Colleague',
    addedAt: '2026-03-18', shareDistributed: false, lastVerified: null,
  },
];

const DEMO_CONFIG: RecoveryConfig = {
  threshold: 2,
  totalGuardians: 3,
  status: 'configured',
  createdAt: '2026-03-15',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'guardians', label: 'Guardians' },
  { key: 'recover', label: 'Recover' },
];

// --- Component ---

export function SocialRecoveryScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [activeTab, setActiveTab] = useState<TabKey>('setup');
  const [guardians, setGuardians] = useState<Guardian[]>(DEMO_GUARDIANS);
  const [config, setConfig] = useState<RecoveryConfig>(DEMO_CONFIG);
  const [newName, setNewName] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [recoveryStarted, setRecoveryStarted] = useState(false);

  const statusLabel = useMemo(() => {
    switch (config.status) {
      case 'not_configured': return 'Not Configured';
      case 'configured': return 'Configured';
      case 'shares_distributed': return 'Shares Distributed';
      case 'ready': return 'Ready';
    }
  }, [config.status]);

  const statusColor = useMemo(() => {
    switch (config.status) {
      case 'not_configured': return '#ef4444';
      case 'configured': return '#f59e0b';
      case 'shares_distributed': return '#3b82f6';
      case 'ready': return '#22c55e';
    }
  }, [config.status]);

  const distributedCount = useMemo(
    () => guardians.filter((g) => g.shareDistributed).length,
    [guardians],
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: '700', color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    tabRow: {
      flexDirection: 'row', borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
    tabText: { fontSize: 14, color: t.text.secondary },
    tabTextActive: { color: t.accent.green, fontWeight: '600' },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: t.text.primary, marginBottom: 8 },
    label: { fontSize: 13, color: t.text.secondary, marginBottom: 4 },
    value: { fontSize: 15, color: t.text.primary, fontWeight: '500' },
    card: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
    },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 8,
      padding: 10, fontSize: 14, color: t.text.primary, marginBottom: 10,
      backgroundColor: t.bg.card,
    },
    button: {
      backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 12,
      alignItems: 'center', marginTop: 8,
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    buttonDisabled: { opacity: 0.5 },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20, marginTop: 4 },
    metric: { alignItems: 'center', flex: 1 },
    metricValue: { fontSize: 22, fontWeight: '700', color: t.text.primary },
    metricLabel: { fontSize: 11, color: t.text.secondary, marginTop: 2 },
    warningBox: {
      backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginTop: 10,
    },
    warningText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  }), [t]);

  const handleAddGuardian = () => {
    if (!newName || !newUid) return;
    const g: Guardian = {
      uid: newUid, name: newName, relationship: newRelationship || 'Friend',
      addedAt: '2026-03-30', shareDistributed: false, lastVerified: null,
    };
    setGuardians((prev) => [...prev, g]);
    setConfig((prev) => ({ ...prev, totalGuardians: prev.totalGuardians + 1 }));
    setNewName(''); setNewUid(''); setNewRelationship('');
  };

  const handleDistribute = (uid: string) => {
    setGuardians((prev) =>
      prev.map((g) => g.uid === uid ? { ...g, shareDistributed: true, lastVerified: '2026-03-30' } : g),
    );
  };

  const renderSetup = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recovery Status</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
        <Text style={[styles.infoText, { marginTop: 10 }]}>
          Social recovery lets trusted guardians help you regain access to your
          wallet if you lose your device or seed phrase.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={[styles.row, { marginBottom: 12 }]}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{config.threshold}</Text>
            <Text style={styles.metricLabel}>Threshold</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{config.totalGuardians}</Text>
            <Text style={styles.metricLabel}>Guardians</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{distributedCount}</Text>
            <Text style={styles.metricLabel}>Shares Out</Text>
          </View>
        </View>
        <Text style={styles.infoText}>
          {config.threshold} of {config.totalGuardians} guardians must cooperate to recover
          your wallet. Shamir's Secret Sharing ensures no single guardian can access your funds.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Threshold Settings</Text>
        <Text style={styles.label}>Required signatures (M of N)</Text>
        <View style={styles.row}>
          {[2, 3, 4].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.card, { flex: 1, marginHorizontal: 4, alignItems: 'center' as const },
                num === config.threshold && { borderColor: t.accent.green, borderWidth: 2 }]}
              onPress={() => setConfig((p) => ({ ...p, threshold: num }))}
            >
              <Text style={styles.value}>{num} of {config.totalGuardians}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {demoMode && (
        <View style={styles.section}>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Demo Mode: recovery shares are simulated. In production, encrypted
              fragments are generated using Shamir's Secret Sharing and distributed
              via end-to-end encrypted channels.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderGuardians = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Guardians ({guardians.length})</Text>
        {guardians.map((g) => (
          <View key={g.uid} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>{g.name}</Text>
              <View style={[styles.badge, {
                backgroundColor: g.shareDistributed ? '#22c55e' : '#f59e0b',
              }]}>
                <Text style={styles.badgeText}>
                  {g.shareDistributed ? 'Share Sent' : 'Pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.label}>{g.relationship} | {g.uid}</Text>
            <Text style={styles.label}>Added: {g.addedAt}</Text>
            {g.lastVerified && (
              <Text style={styles.label}>Last verified: {g.lastVerified}</Text>
            )}
            {!g.shareDistributed && (
              <TouchableOpacity
                style={[styles.button, { marginTop: 8 }]}
                onPress={() => handleDistribute(g.uid)}
              >
                <Text style={styles.buttonText}>Distribute Share</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Guardian</Text>
        <TextInput style={styles.input} placeholder="Guardian UID" placeholderTextColor={t.text.secondary} value={newUid} onChangeText={setNewUid} />
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor={t.text.secondary} value={newName} onChangeText={setNewName} />
        <TextInput style={styles.input} placeholder="Relationship" placeholderTextColor={t.text.secondary} value={newRelationship} onChangeText={setNewRelationship} />
        <TouchableOpacity
          style={[styles.button, (!newName || !newUid) && styles.buttonDisabled]}
          onPress={handleAddGuardian}
          disabled={!newName || !newUid}
        >
          <Text style={styles.buttonText}>Add Guardian</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRecover = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Initiate Recovery</Text>
        <Text style={styles.infoText}>
          If you have lost access to your wallet, you can request your guardians
          to submit their recovery shares. Once {config.threshold} of {config.totalGuardians} shares
          are received, your seed phrase will be reconstructed.
        </Text>
        <TouchableOpacity
          style={[styles.button, { marginTop: 14, backgroundColor: recoveryStarted ? '#6b7280' : '#ef4444' }]}
          onPress={() => setRecoveryStarted(true)}
          disabled={recoveryStarted}
        >
          <Text style={styles.buttonText}>
            {recoveryStarted ? 'Recovery In Progress...' : 'Start Recovery'}
          </Text>
        </TouchableOpacity>
      </View>

      {recoveryStarted && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shares Received</Text>
          {guardians.map((g) => (
            <View key={g.uid} style={[styles.card, styles.row]}>
              <View>
                <Text style={styles.value}>{g.name}</Text>
                <Text style={styles.label}>{g.relationship}</Text>
              </View>
              <View style={[styles.badge, {
                backgroundColor: g.shareDistributed ? '#22c55e' : '#6b7280',
              }]}>
                <Text style={styles.badgeText}>
                  {g.shareDistributed ? 'Received' : 'Waiting'}
                </Text>
              </View>
            </View>
          ))}
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            {distributedCount} of {config.threshold} required shares received.
            {distributedCount >= config.threshold
              ? ' Threshold met — wallet can be recovered.'
              : ` Need ${config.threshold - distributedCount} more.`}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Recovery</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'setup' && renderSetup()}
      {activeTab === 'guardians' && renderGuardians()}
      {activeTab === 'recover' && renderRecover()}
    </SafeAreaView>
  );
}
