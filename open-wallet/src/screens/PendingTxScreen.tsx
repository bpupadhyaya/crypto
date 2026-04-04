import { fonts } from '../utils/theme';
/**
 * Pending Transactions Screen — Shows all in-progress transactions across all chains.
 *
 * Transaction types displayed:
 * - Pending sends waiting for confirmation
 * - Bridge transfers in transit
 * - Swap transactions processing
 * - Stake unbonding in progress
 *
 * Each shows: type, amount, chain, status, elapsed time, tx hash.
 * Auto-refreshes every 10 seconds.
 * Demo mode shows sample pending transactions.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, RefreshControl, Clipboard, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

export type PendingTxType = 'send' | 'bridge' | 'swap' | 'unstake' | 'receive';
export type PendingTxStatus = 'pending' | 'confirming' | 'in-transit' | 'processing' | 'unbonding';

export interface PendingTransaction {
  id: string;
  type: PendingTxType;
  chain: string;
  amount: string;
  token: string;
  status: PendingTxStatus;
  txHash: string;
  createdAt: number;
  description: string;
  confirmations?: number;
  requiredConfirmations?: number;
  estimatedComplete?: number; // timestamp
}

// ─── Demo Data ───

const DEMO_PENDING_TXS: PendingTransaction[] = [
  {
    id: 'ptx-1',
    type: 'send',
    chain: 'bitcoin',
    amount: '0.005',
    token: 'BTC',
    status: 'confirming',
    txHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    createdAt: Date.now() - 600_000, // 10 min ago
    description: 'Send 0.005 BTC',
    confirmations: 2,
    requiredConfirmations: 6,
  },
  {
    id: 'ptx-2',
    type: 'bridge',
    chain: 'ethereum',
    amount: '0.5',
    token: 'ETH',
    status: 'in-transit',
    txHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    createdAt: Date.now() - 1200_000, // 20 min ago
    description: 'Bridge 0.5 ETH to Solana',
    estimatedComplete: Date.now() + 600_000, // 10 min from now
  },
  {
    id: 'ptx-3',
    type: 'swap',
    chain: 'solana',
    amount: '100',
    token: 'USDC',
    status: 'processing',
    txHash: '4xYz789012345678901234567890123456789012345678901234567890ab',
    createdAt: Date.now() - 30_000, // 30 sec ago
    description: 'Swap 100 USDC for SOL',
  },
  {
    id: 'ptx-4',
    type: 'unstake',
    chain: 'openchain',
    amount: '500',
    token: 'OTK',
    status: 'unbonding',
    txHash: 'openchain_tx_abc123def456',
    createdAt: Date.now() - 86400_000 * 3, // 3 days ago
    description: 'Unstake 500 OTK (21-day unbonding)',
    estimatedComplete: Date.now() + 86400_000 * 18, // 18 days from now
  },
  {
    id: 'ptx-5',
    type: 'send',
    chain: 'ethereum',
    amount: '200',
    token: 'USDT',
    status: 'pending',
    txHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    createdAt: Date.now() - 120_000, // 2 min ago
    description: 'Send 200 USDT',
  },
];

// ─── Helpers ───

function formatElapsed(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTimeRemaining(timestamp: number): string {
  const diff = timestamp - Date.now();
  if (diff <= 0) return 'any moment';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `~${hours}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d`;
}

function statusLabel(status: PendingTxStatus): string {
  const labels: Record<PendingTxStatus, string> = {
    pending: 'Pending',
    confirming: 'Confirming',
    'in-transit': 'In Transit',
    processing: 'Processing',
    unbonding: 'Unbonding',
  };
  return labels[status];
}

function typeLabel(type: PendingTxType): string {
  const labels: Record<PendingTxType, string> = {
    send: 'Send',
    bridge: 'Bridge',
    swap: 'Swap',
    unstake: 'Unstake',
    receive: 'Receive',
  };
  return labels[type];
}

function chainLabel(chain: string): string {
  const labels: Record<string, string> = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    solana: 'Solana',
    openchain: 'Open Chain',
    cosmos: 'Cosmos',
  };
  return labels[chain] ?? chain;
}

function statusColor(status: PendingTxStatus, accent: Record<string, string>): string {
  const colors: Record<PendingTxStatus, string> = {
    pending: accent.yellow,
    confirming: accent.blue,
    'in-transit': accent.purple,
    processing: accent.orange,
    unbonding: accent.yellow,
  };
  return colors[status];
}

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

// ─── Component ───

interface Props {
  onClose: () => void;
}

export function PendingTxScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [txs, setTxs] = useState<PendingTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const refreshData = useCallback(() => {
    // In a real implementation, this would query chain RPCs for tx status
    setTxs(demoMode ? DEMO_PENDING_TXS : []);
  }, [demoMode]);

  useEffect(() => {
    refreshData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      refreshData();
      setTick((t) => t + 1); // Force re-render for elapsed time updates
    }, 10_000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleCopyHash = useCallback((hash: string) => {
    Clipboard.setString(hash);
    Alert.alert('Copied', 'Transaction hash copied to clipboard.');
  }, []);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    autoRefreshNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden' },
    txContainer: { padding: 16 },
    txTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    chainText: { color: t.text.secondary, fontSize: 12 },
    elapsedText: { color: t.text.muted, fontSize: 12 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
    amount: { color: t.text.primary, fontSize: 18, fontWeight: fonts.semibold },
    token: { color: t.text.secondary, fontSize: 14, marginLeft: 4 },
    description: { color: t.text.muted, fontSize: 13, marginBottom: 10 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: fonts.bold },
    confirmText: { color: t.text.muted, fontSize: 12 },
    hashRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hashLabel: { color: t.text.muted, fontSize: 11 },
    hashValue: { color: t.accent.blue, fontSize: 11, fontFamily: 'monospace' as const },
    etaText: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    progressBar: { height: 3, backgroundColor: t.border, borderRadius: 2, marginTop: 8 },
    progressFill: { height: 3, borderRadius: 2 },
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyText: { color: t.text.muted, fontSize: 16 },
    emptySubtext: { color: t.text.muted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    sectionHeader: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 20, marginBottom: 8, marginTop: 8 },
  }), [t]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Pending Transactions</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.text.muted} />}
      >
        <Text style={st.autoRefreshNote}>Auto-refreshes every 10 seconds</Text>

        {txs.length === 0 ? (
          <View style={st.emptyContainer}>
            <Text style={st.emptyText}>No pending transactions</Text>
            <Text style={st.emptySubtext}>
              {demoMode
                ? 'No transactions are currently processing.'
                : 'Active sends, bridges, swaps, and unstaking operations will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={st.sectionHeader}>
              {txs.length} Active Transaction{txs.length !== 1 ? 's' : ''}
            </Text>

            {txs.map((tx) => {
              const sColor = statusColor(tx.status, t.accent);
              const progress = tx.confirmations && tx.requiredConfirmations
                ? tx.confirmations / tx.requiredConfirmations
                : tx.estimatedComplete
                  ? Math.min(1, (Date.now() - tx.createdAt) / (tx.estimatedComplete - tx.createdAt))
                  : undefined;

              return (
                <View key={tx.id} style={st.card}>
                  <View style={st.txContainer}>
                    {/* Type + Chain + Elapsed */}
                    <View style={st.txTopRow}>
                      <View style={st.typeBadge}>
                        <Text style={st.typeText}>{typeLabel(tx.type)}</Text>
                        <Text style={st.chainText}>{chainLabel(tx.chain)}</Text>
                      </View>
                      <Text style={st.elapsedText}>{formatElapsed(tx.createdAt)} ago</Text>
                    </View>

                    {/* Amount */}
                    <View style={st.amountRow}>
                      <Text style={st.amount}>{tx.amount}</Text>
                      <Text style={st.token}>{tx.token}</Text>
                    </View>

                    {/* Description */}
                    <Text style={st.description}>{tx.description}</Text>

                    {/* Status */}
                    <View style={st.statusRow}>
                      <View style={[st.statusBadge, { backgroundColor: sColor + '20' }]}>
                        <Text style={[st.statusText, { color: sColor }]}>{statusLabel(tx.status)}</Text>
                      </View>
                      {tx.confirmations !== undefined && tx.requiredConfirmations !== undefined && (
                        <Text style={st.confirmText}>
                          {tx.confirmations}/{tx.requiredConfirmations} confirmations
                        </Text>
                      )}
                    </View>

                    {/* TX Hash */}
                    <TouchableOpacity style={st.hashRow} onPress={() => handleCopyHash(tx.txHash)}>
                      <Text style={st.hashLabel}>TX:</Text>
                      <Text style={st.hashValue}>{shortenHash(tx.txHash)}</Text>
                    </TouchableOpacity>

                    {/* ETA */}
                    {tx.estimatedComplete && (
                      <Text style={st.etaText}>
                        ETA: {formatTimeRemaining(tx.estimatedComplete)}
                      </Text>
                    )}

                    {/* Progress Bar */}
                    {progress !== undefined && (
                      <View style={st.progressBar}>
                        <View style={[st.progressFill, { width: `${Math.min(100, Math.round(progress * 100))}%`, backgroundColor: sColor }]} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
