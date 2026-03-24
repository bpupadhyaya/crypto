/**
 * Home Screen — The main wallet view.
 * Adapts between Simple and Pro mode automatically.
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { BalanceCard } from '../components/BalanceCard';
import { ActionButtons } from '../components/ActionButtons';
import { ModeToggle } from '../components/ModeToggle';
import { useWalletStore } from '../store/walletStore';

export function HomeScreen() {
  const { mode } = useWalletStore();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Open Wallet</Text>
          <Text style={styles.tagline}>
            {mode === 'simple' ? 'Your money, your control' : 'Universal DeFi Terminal'}
          </Text>
        </View>
        <ModeToggle />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        {/* Migration Status (Pro mode, informational) */}
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

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appName: {
    color: '#f0f0f5',
    fontSize: 22,
    fontWeight: '800',
  },
  tagline: {
    color: '#606070',
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  chainFilter: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  chainRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chainChip: {
    backgroundColor: '#16161f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chainChipText: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  migrationCard: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#606070',
    fontSize: 13,
  },
  statusBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  progressText: {
    color: '#606070',
    fontSize: 11,
    marginTop: 6,
  },
});
