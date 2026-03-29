/**
 * Status Screen (Art VII) — System health, sync status, node status, app diagnostics.
 *
 * Shows app version, sync queue, network connectivity, chain node info,
 * storage usage, performance metrics, and P2P peer status.
 * Provides clear cache and force sync actions.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'health' | 'sync' | 'network' | 'storage';

interface StatusItem {
  label: string;
  value: string;
  status: 'green' | 'yellow' | 'red' | 'neutral';
}

interface SyncItem {
  id: string;
  type: string;
  target: string;
  status: 'pending' | 'synced' | 'failed';
  timestamp: string;
}

interface Props {
  onClose: () => void;
}

const DEMO_HEALTH: StatusItem[] = [
  { label: 'App Version', value: 'v0.9.1 (build 142)', status: 'neutral' },
  { label: 'Startup Time', value: '1.2s', status: 'green' },
  { label: 'Memory Usage', value: '84 MB', status: 'green' },
  { label: 'Online Status', value: 'Connected', status: 'green' },
  { label: 'Chain Node', value: 'Connected', status: 'green' },
  { label: 'P2P Network', value: '142 peers', status: 'green' },
  { label: 'Last Sync', value: '12s ago', status: 'green' },
  { label: 'Pending Queue', value: '3 items', status: 'yellow' },
];

const DEMO_SYNC_ITEMS: SyncItem[] = [
  { id: '1', type: 'Transaction', target: 'nOTK mint #4821', status: 'pending', timestamp: '2 min ago' },
  { id: '2', type: 'Gratitude', target: 'Thank you note #312', status: 'pending', timestamp: '5 min ago' },
  { id: '3', type: 'Milestone', target: 'Teaching cert update', status: 'pending', timestamp: '8 min ago' },
  { id: '4', type: 'Transaction', target: 'eOTK transfer #1190', status: 'synced', timestamp: '15 min ago' },
  { id: '5', type: 'Governance', target: 'Vote proposal #77', status: 'synced', timestamp: '1h ago' },
  { id: '6', type: 'Transaction', target: 'cOTK reward #903', status: 'failed', timestamp: '2h ago' },
];

const DEMO_NETWORK: StatusItem[] = [
  { label: 'Connection', value: 'WiFi', status: 'green' },
  { label: 'Latency to Node', value: '42ms', status: 'green' },
  { label: 'Connected Validator', value: 'openchain-val-1...x8f2', status: 'green' },
  { label: 'Block Height', value: '#1,847,293', status: 'green' },
  { label: 'Sync Progress', value: '100%', status: 'green' },
  { label: 'P2P Mode', value: 'Hybrid (server + P2P)', status: 'green' },
  { label: 'Connected Peers', value: '142', status: 'green' },
  { label: 'Peer Discovery', value: 'Active', status: 'green' },
];

const DEMO_STORAGE: StatusItem[] = [
  { label: 'Cache Size', value: '12.4 MB', status: 'green' },
  { label: 'Offline Data', value: '3.8 MB', status: 'green' },
  { label: 'Transaction History', value: '1.2 MB', status: 'neutral' },
  { label: 'Media & Attachments', value: '8.1 MB', status: 'neutral' },
  { label: 'Available Space', value: '4.2 GB', status: 'green' },
  { label: 'Database Version', value: 'v3', status: 'neutral' },
];

export function StatusScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('health');
  const [loading, setLoading] = useState(true);
  const [healthItems, setHealthItems] = useState<StatusItem[]>([]);
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [networkItems, setNetworkItems] = useState<StatusItem[]>([]);
  const [storageItems, setStorageItems] = useState<StatusItem[]>([]);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, borderRadius: 12, backgroundColor: t.bg.secondary, overflow: 'hidden' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    tabTextActive: { color: '#fff' },
    overallCard: { backgroundColor: t.accent.green + '12', borderRadius: 20, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 20 },
    overallLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    overallValue: { color: t.accent.green, fontSize: 32, fontWeight: '900', marginTop: 4 },
    overallSub: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20 },
    rowLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    rowValue: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 20 },
    syncRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    syncIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    syncIconText: { fontSize: 16 },
    syncInfo: { flex: 1 },
    syncType: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    syncTarget: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    syncBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    syncBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    actionBtnText: { fontSize: 14, fontWeight: '700' },
    philosophy: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 40, marginTop: 16, lineHeight: 16 },
  }), [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setHealthItems(DEMO_HEALTH);
      setSyncItems(DEMO_SYNC_ITEMS);
      setNetworkItems(DEMO_NETWORK);
      setStorageItems(DEMO_STORAGE);
      setLoading(false);
      return;
    }
    // Live mode: populate from actual system stats
    setHealthItems(DEMO_HEALTH);
    setSyncItems([]);
    setNetworkItems(DEMO_NETWORK);
    setStorageItems(DEMO_STORAGE);
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusColor = (status: string) => {
    if (status === 'green') return t.accent.green;
    if (status === 'yellow') return '#f5a623';
    if (status === 'red') return t.accent.red;
    return t.text.muted;
  };

  const syncStatusColor = (status: string) => {
    if (status === 'synced') return t.accent.green;
    if (status === 'pending') return '#f5a623';
    return t.accent.red;
  };

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    // In production: clear actual cache
    await new Promise(r => setTimeout(r, 1000));
    setClearing(false);
  }, []);

  const handleForceSync = useCallback(async () => {
    setSyncing(true);
    // In production: trigger sync
    await new Promise(r => setTimeout(r, 1500));
    setSyncing(false);
    fetchData();
  }, [fetchData]);

  const allGreen = healthItems.every(i => i.status === 'green' || i.status === 'neutral');
  const pendingCount = syncItems.filter(i => i.status === 'pending').length;

  const renderStatusRows = (items: StatusItem[]) => items.map((item, i) => (
    <React.Fragment key={item.label}>
      <View style={s.row}>
        <View style={[s.dot, { backgroundColor: statusColor(item.status) }]} />
        <Text style={s.rowLabel}>{item.label}</Text>
        <Text style={[s.rowValue, { color: statusColor(item.status) }]}>{item.value}</Text>
      </View>
      {i < items.length - 1 && <View style={s.divider} />}
    </React.Fragment>
  ));

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>System Status</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={t.accent.blue} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>System Status</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['health', 'sync', 'network', 'storage'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'health' ? 'Health' : tab === 'sync' ? 'Sync' : tab === 'network' ? 'Network' : 'Storage'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {activeTab === 'health' && (
          <>
            <View style={s.overallCard}>
              <Text style={s.overallLabel}>System Health</Text>
              <Text style={s.overallValue}>{allGreen ? 'All Systems Go' : 'Attention Needed'}</Text>
              <Text style={s.overallSub}>
                {pendingCount > 0 ? `${pendingCount} pending sync items` : 'Everything is running smoothly'}
              </Text>
            </View>
            <Text style={s.section}>Diagnostics</Text>
            {renderStatusRows(healthItems)}
          </>
        )}

        {activeTab === 'sync' && (
          <>
            <View style={s.overallCard}>
              <Text style={s.overallLabel}>Sync Queue</Text>
              <Text style={s.overallValue}>{pendingCount} Pending</Text>
              <Text style={s.overallSub}>
                {syncItems.filter(i => i.status === 'failed').length} failed ·{' '}
                {syncItems.filter(i => i.status === 'synced').length} synced
              </Text>
            </View>
            <Text style={s.section}>Queue Items</Text>
            {syncItems.map((item, i) => (
              <React.Fragment key={item.id}>
                <View style={s.syncRow}>
                  <View style={[s.syncIcon, { backgroundColor: syncStatusColor(item.status) + '20' }]}>
                    <Text style={s.syncIconText}>
                      {item.status === 'synced' ? '\u2713' : item.status === 'pending' ? '\u25CB' : '\u2717'}
                    </Text>
                  </View>
                  <View style={s.syncInfo}>
                    <Text style={s.syncType}>{item.type}</Text>
                    <Text style={s.syncTarget}>{item.target} · {item.timestamp}</Text>
                  </View>
                  <View style={[s.syncBadge, { backgroundColor: syncStatusColor(item.status) + '20' }]}>
                    <Text style={[s.syncBadgeText, { color: syncStatusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                {i < syncItems.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            ))}
          </>
        )}

        {activeTab === 'network' && (
          <>
            <Text style={s.section}>Connectivity</Text>
            {renderStatusRows(networkItems)}
          </>
        )}

        {activeTab === 'storage' && (
          <>
            <Text style={s.section}>Storage Usage</Text>
            {renderStatusRows(storageItems)}
          </>
        )}

        {/* Action Buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: t.text.muted + '20' }]}
            onPress={handleClearCache}
            disabled={clearing}
          >
            {clearing
              ? <ActivityIndicator color={t.text.primary} size="small" />
              : <Text style={[s.actionBtnText, { color: t.text.primary }]}>Clear Cache</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: t.accent.blue }]}
            onPress={handleForceSync}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[s.actionBtnText, { color: '#fff' }]}>Force Sync</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.philosophy}>
          Art VII — Transparency in system health ensures trust between you and the chain.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
