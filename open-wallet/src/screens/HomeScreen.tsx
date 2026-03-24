/**
 * Home Screen — Main wallet view with token list.
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BalanceCard } from '../components/BalanceCard';
import { ActionButtons } from '../components/ActionButtons';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';

function TokenRow({ token }: { token: TokenInfo }) {
  return (
    <View style={styles.tokenRow}>
      <View style={[styles.tokenDot, { backgroundColor: token.color }]} />
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        <Text style={styles.tokenName}>{token.name}</Text>
      </View>
      <View style={styles.tokenValues}>
        <Text style={styles.tokenBalance}>0.00</Text>
        <Text style={styles.tokenUsd}>$0.00</Text>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { mode, addresses } = useWalletStore();
  const queryClient = useQueryClient();

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
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        <BalanceCard />
        <ActionButtons />

        {/* Token List */}
        <View style={styles.tokenSection}>
          <Text style={styles.sectionTitle}>Tokens</Text>
          <View style={styles.tokenList}>
            {SUPPORTED_TOKENS.map((token) => (
              <TokenRow key={`${token.chainId}-${token.symbol}`} token={token} />
            ))}
          </View>
        </View>

        {/* Addresses (Pro mode) */}
        {mode === 'pro' && Object.keys(addresses).length > 0 && (
          <View style={styles.card}>
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

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  sectionTitle: {
    color: '#a0a0b0', fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  tokenSection: { marginHorizontal: 16, marginTop: 24 },
  tokenList: {
    backgroundColor: '#16161f', borderRadius: 16, overflow: 'hidden',
  },
  tokenRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tokenDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  tokenInfo: { flex: 1 },
  tokenSymbol: { color: '#f0f0f5', fontSize: 15, fontWeight: '600' },
  tokenName: { color: '#606070', fontSize: 12, marginTop: 1 },
  tokenValues: { alignItems: 'flex-end' },
  tokenBalance: { color: '#a0a0b0', fontSize: 14, fontWeight: '500' },
  tokenUsd: { color: '#606070', fontSize: 12, marginTop: 1 },
  card: {
    backgroundColor: '#16161f', borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 24,
  },
  addressRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  addressChain: { color: '#a0a0b0', fontSize: 13, width: 80 },
  addressText: { color: '#606070', fontSize: 11, fontFamily: 'monospace', flex: 1, textAlign: 'right' },
});
