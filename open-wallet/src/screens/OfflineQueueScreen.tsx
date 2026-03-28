/**
 * Offline Queue Screen — View and manage pending offline transactions.
 *
 * Features:
 * - List all queued transactions with description, amount, chain, timestamp
 * - "Broadcast All" button (enabled only when online)
 * - Delete individual queued transactions
 * - Shows time since last online
 * - Demo mode with sample queued transactions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  getPendingTxs,
  removePendingTx,
  broadcastPendingTxs,
  isOffline,
  getLastOnlineAt,
  onOfflineStateChange,
  type PendingTx,
} from '../core/offline/offlineManager';

// ─── Demo Data ───

const DEMO_PENDING_TXS: PendingTx[] = [
  {
    id: 'demo-1',
    chain: 'bitcoin',
    signedTxHex: '0200000001abc...demo',
    createdAt: Date.now() - 3600_000, // 1 hour ago
    description: 'Send 0.005 BTC to tb1q...x9f2',
  },
  {
    id: 'demo-2',
    chain: 'ethereum',
    signedTxHex: '0xf86c...demo',
    createdAt: Date.now() - 1800_000, // 30 min ago
    description: 'Send 0.1 ETH to 0x742d...35Cb',
  },
  {
    id: 'demo-3',
    chain: 'solana',
    signedTxHex: 'base64...demo',
    createdAt: Date.now() - 600_000, // 10 min ago
    description: 'Send 2.5 SOL to 7xKX...nRpD',
  },
  {
    id: 'demo-4',
    chain: 'ethereum',
    signedTxHex: '0xf86c...demo2',
    createdAt: Date.now() - 120_000, // 2 min ago
    description: 'Swap 50 USDC for ETH on DEX',
  },
];

// ─── Helpers ───

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function chainLabel(chain: string): string {
  const labels: Record<string, string> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
    openchain: 'OC',
    cosmos: 'ATOM',
  };
  return labels[chain] ?? chain.toUpperCase();
}

function chainColor(chain: string, accent: Record<string, string>): string {
  const colors: Record<string, string> = {
    bitcoin: accent.orange,
    ethereum: accent.blue,
    solana: accent.purple,
    openchain: accent.green,
    cosmos: accent.blue,
  };
  return colors[chain] ?? accent.green;
}

// ─── Component ───

interface Props {
  onClose: () => void;
}

export function OfflineQueueScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [txs, setTxs] = useState<PendingTx[]>([]);
  const [offline, setOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState(Date.now());
  const [broadcasting, setBroadcasting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const refreshData = useCallback(() => {
    setTxs(demoMode ? DEMO_PENDING_TXS : getPendingTxs());
    setOffline(demoMode ? true : isOffline());
    setLastOnline(demoMode ? Date.now() - 3600_000 : getLastOnlineAt());
  }, [demoMode]);

  useEffect(() => {
    refreshData();
    const unsub = onOfflineStateChange(() => refreshData());
    // Tick every 10s to update "time ago" labels
    const tickInterval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => { unsub(); clearInterval(tickInterval); };
  }, [refreshData]);

  const handleBroadcastAll = useCallback(async () => {
    if (demoMode) {
      Alert.alert('Demo Mode', 'Broadcasting is simulated in demo mode.\n\n4 transactions would be broadcast when online.');
      return;
    }
    if (isOffline()) {
      Alert.alert('Offline', 'Cannot broadcast while offline. Transactions will be sent when connectivity returns.');
      return;
    }

    setBroadcasting(true);
    try {
      const result = await broadcastPendingTxs();
      Alert.alert(
        'Broadcast Complete',
        `${result.success} succeeded, ${result.failed} failed.`,
      );
      refreshData();
    } catch {
      Alert.alert('Error', 'Failed to broadcast transactions.');
    } finally {
      setBroadcasting(false);
    }
  }, [demoMode, refreshData]);

  const handleDelete = useCallback((tx: PendingTx) => {
    if (demoMode) {
      Alert.alert('Demo Mode', 'Cannot delete demo transactions.');
      return;
    }
    Alert.alert(
      'Delete Transaction',
      `Remove "${tx.description}" from the queue? This transaction will NOT be broadcast.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removePendingTx(tx.id);
            refreshData();
          },
        },
      ],
    );
  }, [demoMode, refreshData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
    statusOffline: { backgroundColor: t.accent.red + '20' },
    statusOnline: { backgroundColor: t.accent.green + '20' },
    statusText: { fontSize: 14, fontWeight: '600' },
    statusTextOffline: { color: t.accent.red },
    statusTextOnline: { color: t.accent.green },
    lastOnlineText: { color: t.text.muted, fontSize: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 16, padding: 16, marginBottom: 12 },
    txRow: { marginBottom: 16 },
    txRowLast: { marginBottom: 0 },
    txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    txChainBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    txChainText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    txTime: { color: t.text.muted, fontSize: 12 },
    txDescription: { color: t.text.primary, fontSize: 14, marginBottom: 8 },
    txActions: { flexDirection: 'row', justifyContent: 'flex-end' },
    deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: t.accent.red + '20' },
    deleteText: { color: t.accent.red, fontSize: 12, fontWeight: '600' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    broadcastBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
    broadcastBtnDisabled: { opacity: 0.5 },
    broadcastText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: t.text.muted, fontSize: 16 },
    emptySubtext: { color: t.text.muted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    countBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    countText: { color: t.accent.orange, fontSize: 13, fontWeight: '700' },
  }), [t]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Offline Queue</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.text.muted} />}
      >
        {/* Status Banner */}
        <View style={[st.statusBar, offline ? st.statusOffline : st.statusOnline]}>
          <Text style={[st.statusText, offline ? st.statusTextOffline : st.statusTextOnline]}>
            {offline ? 'Offline' : 'Online'}
          </Text>
          <Text style={st.lastOnlineText}>
            {offline ? `Last online: ${formatTimeAgo(lastOnline)}` : 'Connected'}
          </Text>
        </View>

        {txs.length === 0 ? (
          <View style={st.emptyContainer}>
            <Text style={st.emptyText}>No pending transactions</Text>
            <Text style={st.emptySubtext}>
              When you sign transactions offline, they will appear here and be broadcast when connectivity returns.
            </Text>
          </View>
        ) : (
          <>
            {/* Queue Count */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                Pending Transactions
              </Text>
              <View style={st.countBadge}>
                <Text style={st.countText}>{txs.length}</Text>
              </View>
            </View>

            {/* Transaction List */}
            <View style={st.card}>
              {txs.map((tx, idx) => (
                <View key={tx.id}>
                  <View style={[st.txRow, idx === txs.length - 1 && st.txRowLast]}>
                    <View style={st.txHeader}>
                      <View style={[st.txChainBadge, { backgroundColor: chainColor(tx.chain, t.accent) }]}>
                        <Text style={st.txChainText}>{chainLabel(tx.chain)}</Text>
                      </View>
                      <Text style={st.txTime}>{formatTimeAgo(tx.createdAt)}</Text>
                    </View>
                    <Text style={st.txDescription}>{tx.description}</Text>
                    <View style={st.txActions}>
                      <TouchableOpacity style={st.deleteBtn} onPress={() => handleDelete(tx)}>
                        <Text style={st.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < txs.length - 1 && <View style={st.divider} />}
                </View>
              ))}
            </View>

            {/* Broadcast All Button */}
            <TouchableOpacity
              style={[st.broadcastBtn, (offline || broadcasting) && st.broadcastBtnDisabled]}
              onPress={handleBroadcastAll}
              disabled={broadcasting}
            >
              <Text style={st.broadcastText}>
                {broadcasting ? 'Broadcasting...' : offline ? 'Offline — Cannot Broadcast' : `Broadcast All (${txs.length})`}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
