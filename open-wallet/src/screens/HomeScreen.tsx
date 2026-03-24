/**
 * Home Screen — Main wallet view with live data.
 * Uses React Query hooks for real-time balance and price updates.
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BalanceCard } from '../components/BalanceCard';
import { ActionButtons } from '../components/ActionButtons';
import { useWalletStore } from '../store/walletStore';
import { usePortfolio } from '../hooks/useBalances';

export function HomeScreen() {
  const { mode, addresses } = useWalletStore();
  const { balances, totalUsdValue, isLoading } = usePortfolio(addresses);
  const queryClient = useQueryClient();
  const { setBalances } = useWalletStore();

  // Sync balances to store for other screens
  React.useEffect(() => {
    if (balances.length > 0) {
      setBalances(balances);
    }
  }, [balances]);

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['prices'] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {/* Balance */}
        <BalanceCard />

        {/* Actions */}
        <ActionButtons />

        {/* Chain Filter (Pro mode only) */}
        {mode === 'pro' && (
          <View style={styles.chainFilter}>
            <Text style={styles.sectionTitle}>Chains</Text>
            <View style={styles.chainRow}>
              {['all', 'bitcoin', 'ethereum', 'solana', 'cosmos'].map((chain) => (
                <View key={chain} style={styles.chainChip}>
                  <Text style={styles.chainChipText}>
                    {chain === 'all' ? 'All' : chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Addresses (Pro mode) */}
        {mode === 'pro' && Object.keys(addresses).length > 0 && (
          <View style={styles.addressesCard}>
            <Text style={styles.sectionTitle}>Your Addresses</Text>
            {Object.entries(addresses).map(([chain, addr]) => (
              <View key={chain} style={styles.addressRow}>
                <Text style={styles.addressChain}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </Text>
                <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                  {addr}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Migration Status (Pro mode) */}
        {mode === 'pro' && (
          <View style={styles.migrationCard}>
            <Text style={styles.sectionTitle}>Network Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Backend</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Server</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Target</Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Text style={[styles.statusBadgeText, { color: '#22c55e' }]}>Mobile P2P</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '5%' }]} />
            </View>
            <Text style={styles.progressText}>5% — Server validation active</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  sectionTitle: { color: '#a0a0b0', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  chainFilter: { marginHorizontal: 16, marginTop: 24 },
  chainRow: { flexDirection: 'row', gap: 8 },
  chainChip: { backgroundColor: '#16161f', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  chainChipText: { color: '#a0a0b0', fontSize: 13 },
  addressesCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 24 },
  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  addressChain: { color: '#a0a0b0', fontSize: 13, width: 80 },
  addressText: { color: '#606070', fontSize: 11, fontFamily: 'monospace', flex: 1, textAlign: 'right' },
  migrationCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 24 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusLabel: { color: '#606070', fontSize: 13 },
  statusBadge: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  statusBadgeText: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 12 },
  progressFill: { height: 4, backgroundColor: '#22c55e', borderRadius: 2 },
  progressText: { color: '#606070', fontSize: 11, marginTop: 6 },
});
