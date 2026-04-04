import { fonts } from '../utils/theme';
/**
 * Multi-Device Screen — Manage multi-device sync for Open Wallet.
 *
 * Pair devices, configure sync settings, and view sync history
 * across all linked devices in the Open Chain ecosystem.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface PairedDevice {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'desktop';
  os: string;
  lastSeen: string;
  lastSynced: string;
  isCurrentDevice: boolean;
}

interface SyncCategory {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface SyncEvent {
  id: string;
  deviceName: string;
  timestamp: string;
  itemsSynced: number;
  status: 'success' | 'partial' | 'failed';
}

type TabKey = 'devices' | 'pair' | 'settings';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_DEVICES: PairedDevice[] = [
  {
    id: 'dev_001', name: 'iPhone 15 Pro', type: 'phone', os: 'iOS 19.2',
    lastSeen: '2 min ago', lastSynced: '5 min ago', isCurrentDevice: true,
  },
  {
    id: 'dev_002', name: 'Samsung Galaxy S25', type: 'phone', os: 'Android 16',
    lastSeen: '5 min ago', lastSynced: '5 min ago', isCurrentDevice: false,
  },
];

const DEMO_SYNC_CATEGORIES: SyncCategory[] = [
  { key: 'wallet', label: 'Wallet Balances', description: 'OTK balances and token data', enabled: true },
  { key: 'contacts', label: 'Address Book', description: 'Saved contacts and labels', enabled: true },
  { key: 'settings', label: 'App Settings', description: 'Theme, language, preferences', enabled: true },
  { key: 'history', label: 'Transaction History', description: 'All transaction records', enabled: true },
  { key: 'achievements', label: 'Achievements', description: 'Soulbound badges and progress', enabled: false },
  { key: 'nurture', label: 'Nurture Data', description: 'nOTK tracking and Living Ledger', enabled: false },
];

const DEMO_SYNC_HISTORY: SyncEvent[] = [
  { id: 'sync_01', deviceName: 'Samsung Galaxy S25', timestamp: '2026-03-30 14:25', itemsSynced: 47, status: 'success' },
  { id: 'sync_02', deviceName: 'Samsung Galaxy S25', timestamp: '2026-03-30 08:10', itemsSynced: 12, status: 'success' },
  { id: 'sync_03', deviceName: 'Samsung Galaxy S25', timestamp: '2026-03-29 22:05', itemsSynced: 3, status: 'partial' },
  { id: 'sync_04', deviceName: 'Samsung Galaxy S25', timestamp: '2026-03-29 16:30', itemsSynced: 28, status: 'success' },
  { id: 'sync_05', deviceName: 'Samsung Galaxy S25', timestamp: '2026-03-28 20:15', itemsSynced: 0, status: 'failed' },
];

const DEVICE_ICONS: Record<string, string> = {
  phone: '\u{1F4F1}', tablet: '\u{1F4BB}', desktop: '\u{1F5A5}',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'devices', label: 'My Devices' },
  { key: 'pair', label: 'Pair New' },
  { key: 'settings', label: 'Settings' },
];

// --- Component ---

export function MultiDeviceScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [activeTab, setActiveTab] = useState<TabKey>('devices');
  const [devices] = useState<PairedDevice[]>(DEMO_DEVICES);
  const [syncCategories, setSyncCategories] = useState<SyncCategory[]>(DEMO_SYNC_CATEGORIES);
  const [autoSync, setAutoSync] = useState(true);
  const [pairingCode] = useState('OW-7K3M-9P2X');
  const [showPairingQr, setShowPairingQr] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    tabRow: {
      flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
    tabText: { fontSize: 14, color: t.text.secondary },
    tabTextActive: { color: t.accent.green, fontWeight: fonts.semibold },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 8 },
    card: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 13, color: t.text.secondary, marginBottom: 2 },
    value: { fontSize: 15, color: t.text.primary, fontWeight: fonts.medium },
    subtext: { fontSize: 12, color: t.text.secondary },
    badge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    badgeText: { fontSize: 11, fontWeight: fonts.semibold, color: '#fff' },
    button: {
      backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 12,
      alignItems: 'center', marginTop: 10,
    },
    buttonText: { color: '#fff', fontWeight: fonts.semibold, fontSize: 15 },
    qrBox: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 24,
      alignItems: 'center', marginVertical: 16, borderWidth: 1,
      borderColor: t.border,
    },
    qrPlaceholder: {
      width: 180, height: 180, backgroundColor: t.bg.primary,
      borderRadius: 8, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: t.border, borderStyle: 'dashed',
    },
    codeText: { fontSize: 24, fontWeight: fonts.bold, color: t.accent.green, letterSpacing: 3, marginTop: 16 },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20, marginTop: 4 },
    switchRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border,
    },
    deviceIcon: { fontSize: 28, marginRight: 12 },
    statusDot: {
      width: 8, height: 8, borderRadius: 4, marginRight: 6,
    },
  }), [t]);

  const toggleSyncCategory = (key: string) => {
    setSyncCategories((prev) =>
      prev.map((c) => c.key === key ? { ...c, enabled: !c.enabled } : c),
    );
  };

  const statusColor = (s: string) => {
    if (s === 'success') return '#22c55e';
    if (s === 'partial') return '#f59e0b';
    return '#ef4444';
  };

  const renderDevices = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paired Devices ({devices.length})</Text>
        {devices.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.deviceIcon}>{DEVICE_ICONS[d.type]}</Text>
                <View>
                  <Text style={styles.value}>
                    {d.name} {d.isCurrentDevice ? '(This device)' : ''}
                  </Text>
                  <Text style={styles.subtext}>{d.os}</Text>
                </View>
              </View>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.label}>Last seen: {d.lastSeen}</Text>
              <Text style={styles.label}>Synced: {d.lastSynced}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync History</Text>
        {DEMO_SYNC_HISTORY.map((e) => (
          <View key={e.id} style={[styles.card, styles.row]}>
            <View>
              <Text style={styles.value}>{e.deviceName}</Text>
              <Text style={styles.subtext}>{e.timestamp}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.badge, { backgroundColor: statusColor(e.status) }]}>
                <Text style={styles.badgeText}>{e.status}</Text>
              </View>
              <Text style={[styles.subtext, { marginTop: 4 }]}>{e.itemsSynced} items</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPair = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pair a New Device</Text>
        <Text style={styles.infoText}>
          Open the Open Wallet app on your other device and scan this QR code
          or enter the pairing code manually. The connection is end-to-end encrypted.
        </Text>

        <View style={styles.qrBox}>
          <TouchableOpacity
            style={styles.qrPlaceholder}
            onPress={() => setShowPairingQr(!showPairingQr)}
          >
            <Text style={{ fontSize: 48 }}>{showPairingQr ? '\u{1F512}' : '\u{1F4F7}'}</Text>
            <Text style={styles.subtext}>
              {showPairingQr ? 'QR Code Active' : 'Tap to show QR'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.codeText}>{pairingCode}</Text>
          <Text style={[styles.subtext, { marginTop: 8 }]}>Code expires in 10 minutes</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pairing Steps</Text>
        {[
          '1. Install Open Wallet on the new device',
          '2. Open Settings > Multi-Device > Join Existing',
          '3. Scan the QR code or enter the pairing code',
          '4. Verify the security fingerprint on both devices',
          '5. Approve the pairing on this device',
        ].map((step, i) => (
          <Text key={i} style={[styles.infoText, { marginBottom: 6 }]}>{step}</Text>
        ))}
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Sync</Text>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.value}>Automatic Sync</Text>
            <Text style={styles.subtext}>Sync when devices are on the same network</Text>
          </View>
          <Switch value={autoSync} onValueChange={setAutoSync} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Sync</Text>
        {syncCategories.map((c) => (
          <View key={c.key} style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.value}>{c.label}</Text>
              <Text style={styles.subtext}>{c.description}</Text>
            </View>
            <Switch value={c.enabled} onValueChange={() => toggleSyncCategory(c.key)} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.infoText}>
          All sync data is encrypted with your device keys before transmission.
          Private keys and seed phrases are NEVER synced between devices.
          Each device maintains its own signing capability.
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Force Sync Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Multi-Device</Text>
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

      {activeTab === 'devices' && renderDevices()}
      {activeTab === 'pair' && renderPair()}
      {activeTab === 'settings' && renderSettings()}
    </SafeAreaView>
  );
}
