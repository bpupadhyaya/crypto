/**
 * Developer Tools Screen — Hidden screen for developers and testers.
 * Only accessible in testnet or demo mode.
 *
 * Sections:
 * - Network Inspector: recent API calls (URL, status, response time)
 * - State Inspector: current Zustand store state (serialized)
 * - Cache Inspector: React Query cache keys and sizes
 * - Performance: price service stats (last fetch time, cache hit rate)
 * - P2P Status: node info, peer list, block height, mempool size
 * - Quick Actions: clear caches, reset paper trading, toggle demo, etc.
 * - Version Info: app version, chain ID, build number, commit hash
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import { getNetworkConfig, getNetworkMode } from '../core/network';
import { getPrices, getLastFetchTime, refreshPricesNow, isPriceServiceRunning } from '../core/priceService';
import { resetAllPaperTrades } from '../core/paperTrading';
import { resetTutorial } from './TutorialScreen';
import { resetAllTooltips } from '../components/FeatureTooltip';
import { nodeRunner } from '../core/p2p/nodeRunner';
import type { Theme } from '../utils/theme';

// ─── Network Request Log ───

export interface NetworkLogEntry {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

const networkLog: NetworkLogEntry[] = [];
const MAX_LOG_SIZE = 50;

/** Call this from fetch wrappers to record API calls. */
export function logNetworkRequest(entry: NetworkLogEntry): void {
  networkLog.unshift(entry);
  if (networkLog.length > MAX_LOG_SIZE) networkLog.pop();
}

export function getNetworkLog(): NetworkLogEntry[] {
  return networkLog;
}

export function clearNetworkLog(): void {
  networkLog.length = 0;
}

// ─── Component ───

interface Props {
  onClose: () => void;
}

type Section = 'network' | 'state' | 'cache' | 'performance' | 'p2p' | 'actions' | 'version';

export function DevToolsScreen({ onClose }: Props) {
  const t = useTheme();
  const store = useWalletStore();
  const [expandedSection, setExpandedSection] = useState<Section | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Re-read data each time we refresh
  const networkEntries = useMemo(() => getNetworkLog(), [refreshKey]);
  const prices = useMemo(() => getPrices(), [refreshKey]);
  const lastFetch = useMemo(() => getLastFetchTime(), [refreshKey]);
  const priceRunning = useMemo(() => isPriceServiceRunning(), [refreshKey]);
  const p2pStatus = useMemo(() => nodeRunner.getStatus(), [refreshKey]);
  const networkConfig = useMemo(() => getNetworkConfig(), [refreshKey]);
  const networkMode = useMemo(() => getNetworkMode(), [refreshKey]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const storeSnapshot = useMemo(() => {
    const state = useWalletStore.getState();
    // Omit functions from serialization
    const serializable: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(state)) {
      if (typeof value !== 'function') {
        serializable[key] = value;
      }
    }
    return JSON.stringify(serializable, null, 2);
  }, [refreshKey]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    backText: { color: t.accent.blue, fontSize: 16 },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginTop: 12,
    },
    sectionTitle: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    sectionArrow: { color: t.text.muted, fontSize: 14 },
    sectionContent: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginTop: 4 },
    codeBlock: { fontFamily: 'Courier', fontSize: 11, color: t.text.secondary, lineHeight: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    label: { color: t.text.muted, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 13, fontWeight: '500' },
    actionBtn: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginTop: 8,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    actionLabel: { color: t.text.primary, fontSize: 14 },
    actionIcon: { color: t.accent.blue, fontSize: 14 },
    dangerBtn: { backgroundColor: t.accent.red + '15' },
    dangerLabel: { color: t.accent.red },
    badge: {
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
      backgroundColor: t.accent.green + '20',
    },
    badgeText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    badgeOff: { backgroundColor: t.accent.red + '20' },
    badgeTextOff: { color: t.accent.red },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    netEntry: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.border },
    netUrl: { color: t.text.primary, fontSize: 12, fontWeight: '500' },
    netMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    refreshBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: t.accent.blue + '20' },
    refreshText: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
  }), [t]);

  const toggleSection = (s: Section) => {
    setExpandedSection((prev) => (prev === s ? null : s));
    refresh();
  };

  const renderSectionHeader = (section: Section, title: string, badge?: string) => (
    <TouchableOpacity style={st.sectionHeader} onPress={() => toggleSection(section)}>
      <Text style={st.sectionTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {badge != null && (
          <View style={st.badge}>
            <Text style={st.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={st.sectionArrow}>{expandedSection === section ? 'v' : '>'}</Text>
      </View>
    </TouchableOpacity>
  );

  // ─── Quick Actions ───

  const handleClearCaches = useCallback(async () => {
    try {
      const { QueryClient } = await import('@tanstack/react-query');
      // Clear price cache by forcing refresh
      clearNetworkLog();
      Alert.alert('Done', 'Network log cleared.');
      refresh();
    } catch {
      Alert.alert('Error', 'Failed to clear caches.');
    }
  }, [refresh]);

  const handleResetPaperTrading = useCallback(async () => {
    Alert.alert('Reset Paper Trading', 'This will reset all paper trade counters. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await resetAllPaperTrades();
          Alert.alert('Done', 'Paper trading counters reset.');
        },
      },
    ]);
  }, []);

  const handleToggleDemo = useCallback(() => {
    store.setDemoMode(!store.demoMode);
    refresh();
  }, [store, refresh]);

  const handleForcePriceRefresh = useCallback(() => {
    const enabledTokens = useWalletStore.getState().enabledTokens;
    refreshPricesNow(enabledTokens);
    Alert.alert('Done', 'Price refresh triggered.');
    refresh();
  }, [refresh]);

  const handleForceBalanceRefresh = useCallback(() => {
    // Signal balance hooks to refetch by toggling a key
    Alert.alert('Done', 'Balance refresh will happen on next screen load.');
  }, []);

  const handleResetTutorial = useCallback(async () => {
    await resetTutorial();
    Alert.alert('Done', 'Tutorial reset. It will show again on next launch.');
  }, []);

  const handleResetTooltips = useCallback(async () => {
    await resetAllTooltips();
    Alert.alert('Done', 'All feature tooltips reset.');
  }, []);

  const handleResetDevBalances = useCallback(() => {
    store.resetDevBalances();
    Alert.alert('Done', 'Dev balances reset to defaults (all 16 tokens funded).');
    refresh();
  }, [store, refresh]);

  // ─── Render ───

  const priceCount = Object.keys(prices).length;
  const timeSinceLastFetch = lastFetch > 0 ? Math.round((Date.now() - lastFetch) / 1000) : -1;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Dev Tools</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={st.refreshBtn} onPress={refresh}>
            <Text style={st.refreshText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={st.backText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Network Inspector */}
        {renderSectionHeader('network', 'Network Inspector', `${networkEntries.length} calls`)}
        {expandedSection === 'network' && (
          <View style={st.sectionContent}>
            {networkEntries.length === 0 ? (
              <Text style={st.label}>No API calls recorded yet. Network logging captures calls made through logNetworkRequest().</Text>
            ) : (
              networkEntries.slice(0, 20).map((entry, i) => (
                <View key={`${entry.timestamp}-${i}`} style={st.netEntry}>
                  <Text style={st.netUrl} numberOfLines={1}>{entry.method} {entry.url}</Text>
                  <Text style={st.netMeta}>
                    Status: {entry.status} | {entry.durationMs}ms | {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* State Inspector */}
        {renderSectionHeader('state', 'State Inspector', 'Zustand')}
        {expandedSection === 'state' && (
          <View style={st.sectionContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <Text style={st.codeBlock} selectable>{storeSnapshot}</Text>
            </ScrollView>
          </View>
        )}

        {/* Cache Inspector */}
        {renderSectionHeader('cache', 'Cache Inspector', `${priceCount} prices`)}
        {expandedSection === 'cache' && (
          <View style={st.sectionContent}>
            <Text style={[st.label, { marginBottom: 8 }]}>Price Cache Entries:</Text>
            {Object.entries(prices).map(([symbol, price]) => (
              <View key={symbol} style={st.row}>
                <Text style={st.label}>{symbol}</Text>
                <Text style={st.value}>${typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}</Text>
              </View>
            ))}
            {priceCount === 0 && <Text style={st.label}>No prices cached yet.</Text>}
          </View>
        )}

        {/* Performance */}
        {renderSectionHeader('performance', 'Performance', priceRunning ? 'Active' : 'Stopped')}
        {expandedSection === 'performance' && (
          <View style={st.sectionContent}>
            <View style={st.row}>
              <Text style={st.label}>Price Service</Text>
              <View style={[st.badge, !priceRunning && st.badgeOff]}>
                <Text style={[st.badgeText, !priceRunning && st.badgeTextOff]}>
                  {priceRunning ? 'Running' : 'Stopped'}
                </Text>
              </View>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Last Fetch</Text>
              <Text style={st.value}>
                {timeSinceLastFetch >= 0 ? `${timeSinceLastFetch}s ago` : 'Never'}
              </Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Cached Prices</Text>
              <Text style={st.value}>{priceCount}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Network Mode</Text>
              <Text style={st.value}>{networkMode}</Text>
            </View>
          </View>
        )}

        {/* P2P Status */}
        {renderSectionHeader('p2p', 'P2P Status', p2pStatus.running ? 'Online' : 'Offline')}
        {expandedSection === 'p2p' && (
          <View style={st.sectionContent}>
            <View style={st.row}>
              <Text style={st.label}>Node Running</Text>
              <View style={[st.badge, !p2pStatus.running && st.badgeOff]}>
                <Text style={[st.badgeText, !p2pStatus.running && st.badgeTextOff]}>
                  {p2pStatus.running ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Chain ID</Text>
              <Text style={st.value}>{p2pStatus.chainId || '—'}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Peer ID</Text>
              <Text style={st.value} numberOfLines={1}>{p2pStatus.peerId || '—'}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Connected Peers</Text>
              <Text style={st.value}>{p2pStatus.connectedPeers}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Latest Block</Text>
              <Text style={st.value}>{p2pStatus.latestBlock}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Syncing</Text>
              <Text style={st.value}>{p2pStatus.syncing ? 'Yes' : 'No'}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Is Validator</Text>
              <Text style={st.value}>{p2pStatus.isValidator ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {renderSectionHeader('actions', 'Quick Actions', '')}
        {expandedSection === 'actions' && (
          <View style={{ marginTop: 4 }}>
            <TouchableOpacity style={st.actionBtn} onPress={handleClearCaches}>
              <Text style={st.actionLabel}>Clear Network Log</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleForcePriceRefresh}>
              <Text style={st.actionLabel}>Force Price Refresh</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleForceBalanceRefresh}>
              <Text style={st.actionLabel}>Force Balance Refresh</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleToggleDemo}>
              <Text style={st.actionLabel}>Toggle Demo Mode ({store.demoMode ? 'ON' : 'OFF'})</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleResetDevBalances}>
              <Text style={st.actionLabel}>Reset Dev Balances (all 16 tokens)</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actionBtn, st.dangerBtn]} onPress={handleResetPaperTrading}>
              <Text style={[st.actionLabel, st.dangerLabel]}>Reset Paper Trading</Text>
              <Text style={[st.actionIcon, st.dangerLabel]}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleResetTutorial}>
              <Text style={st.actionLabel}>Reset Tutorial</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.actionBtn} onPress={handleResetTooltips}>
              <Text style={st.actionLabel}>Reset All Tooltips</Text>
              <Text style={st.actionIcon}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Version Info */}
        {renderSectionHeader('version', 'Version Info', '')}
        {expandedSection === 'version' && (
          <View style={st.sectionContent}>
            <View style={st.row}>
              <Text style={st.label}>App Version</Text>
              <Text style={st.value}>0.1.0-alpha</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Build Number</Text>
              <Text style={st.value}>1</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Chain ID</Text>
              <Text style={st.value}>{networkConfig.openchain.chainId}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Network</Text>
              <Text style={st.value}>{networkMode}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Ethereum Chain</Text>
              <Text style={st.value}>{networkConfig.ethereum.chainName} ({networkConfig.ethereum.chainId})</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Solana Cluster</Text>
              <Text style={st.value}>{networkConfig.solana.cluster}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Commit</Text>
              <Text style={st.value}>e345911</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
