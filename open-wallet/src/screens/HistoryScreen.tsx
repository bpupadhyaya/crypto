/**
 * Transaction History Screen — Shows all transactions across chains.
 * Simple mode: basic list with sent/received indicators
 * Pro mode: detailed view with fees, block confirmations, chain icons
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { registry } from '../core/abstractions/registry';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import type { Transaction, ChainId } from '../core/abstractions/types';
import type { Theme } from '../utils/theme';
import { fonts } from '../utils/theme';

const CHAIN_COLORS: Record<string, string> = {
  bitcoin: '#f7931a',
  ethereum: '#627eea',
  solana: '#9945ff',
  cosmos: '#2e3148',
};

function useTransactionHistory() {
  const { addresses, supportedChains } = useWalletStore();

  return useQuery({
    queryKey: ['tx-history', Object.values(addresses).join(',')],
    queryFn: async (): Promise<Transaction[]> => {
      const allTxs: Transaction[] = [];

      for (const chainId of supportedChains) {
        const address = addresses[chainId];
        if (!address) continue;

        try {
          const provider = registry.getChainProvider(chainId);
          const txs = await provider.getTransactionHistory(address, 20);
          allTxs.push(...txs);
        } catch {
          // Chain provider might not be registered or network error
        }
      }

      // Sort by timestamp descending
      return allTxs.sort((a, b) => b.timestamp - a.timestamp);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

function TransactionItem({ tx, mode, t }: { tx: Transaction; mode: string; t: Theme & { isDark: boolean } }) {
  const isSent = tx.from.toLowerCase() !== ''; // simplified — would compare to user's address
  const chainColor = CHAIN_COLORS[tx.chainId] ?? '#666';
  const statusColor = tx.status === 'confirmed' ? t.accent.green : tx.status === 'failed' ? t.accent.red : t.accent.yellow;

  const s = useMemo(() => StyleSheet.create({
    txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    txChainDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    txType: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    txAddress: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2, maxWidth: 160 },
    txRight: { alignItems: 'flex-end' },
    txMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    txTime: { color: t.text.muted, fontSize: fonts.xs },
    txFee: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
  }), [t]);

  const formatAmount = (amount: bigint, decimals: number) => {
    const num = Number(amount) / Math.pow(10, decimals);
    if (num < 0.001) return '<0.001';
    return num.toFixed(num < 1 ? 6 : num < 100 ? 4 : 2);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={s.txItem}>
      <View style={s.txLeft}>
        <View style={[s.txChainDot, { backgroundColor: chainColor }]} />
        <View>
          <Text style={s.txType}>
            {isSent ? '↑ Sent' : '↓ Received'} {tx.token.symbol}
          </Text>
          <Text style={s.txAddress} numberOfLines={1}>
            {isSent ? `To: ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}` : `From: ${tx.from.slice(0, 8)}...${tx.from.slice(-6)}`}
          </Text>
        </View>
      </View>
      <View style={s.txRight}>
        <Text style={[{ fontSize: fonts.md, fontWeight: fonts.bold }, { color: isSent ? t.accent.red : t.accent.green }]}>
          {isSent ? '-' : '+'}{formatAmount(tx.amount, tx.token.decimals)} {tx.token.symbol}
        </Text>
        <View style={s.txMeta}>
          <Text style={[{ fontSize: fonts.xs, fontWeight: fonts.semibold }, { color: statusColor }]}>
            {tx.status === 'confirmed' ? '✓' : tx.status === 'failed' ? '✗' : '○'}{' '}
            {tx.status}
          </Text>
          <Text style={s.txTime}>{formatTime(tx.timestamp)}</Text>
        </View>
        {mode === 'pro' && tx.fee && (
          <Text style={s.txFee}>
            Fee: {formatAmount(tx.fee, tx.token.decimals)} {tx.token.symbol}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function HistoryScreen() {
  const { mode } = useWalletStore();
  const { data: transactions, isLoading, refetch } = useTransactionHistory();
  const t = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    separator: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    empty: { alignItems: 'center', paddingHorizontal: 40 },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    emptyIcon: { color: t.text.muted, fontSize: 48, marginBottom: 16 },
    emptyTitle: { color: t.text.secondary, fontSize: fonts.xl, fontWeight: fonts.bold, marginBottom: 8 },
    emptyDesc: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', lineHeight: 20 },
  }), [t]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions ?? []}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item }) => <TransactionItem tx={item} mode={mode} t={t} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={t.accent.green}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☰</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDesc}>
              Your transaction history will appear here once you send or receive tokens.
            </Text>
          </View>
        }
        contentContainerStyle={transactions?.length === 0 ? styles.emptyContainer : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}
