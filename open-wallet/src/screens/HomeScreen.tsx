/**
 * Home Screen — Fully memoized, zero unnecessary re-renders.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { PieChart } from '../components/PieChart';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { ManageTokensScreen } from './ManageTokensScreen';
import { TokenDetailScreen } from './TokenDetailScreen';
import { usePrices } from '../hooks/usePrices';

// Static — never recreated
const MOCK_ALLOCATIONS = [
  { label: 'BTC', value: 35, color: '#f7931a' },
  { label: 'ETH', value: 25, color: '#627eea' },
  { label: 'USDC', value: 15, color: '#2775ca' },
  { label: 'SOL', value: 10, color: '#9945ff' },
  { label: 'Others', value: 15, color: '#606070' },
];

const keyExtractor = (item: TokenInfo) => item.symbol;

const TokenRow = React.memo(({ token, price, onPress }: { token: TokenInfo; price?: number; onPress: () => void }) => (
  <TouchableOpacity style={s.tokenRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[s.tokenDot, { backgroundColor: token.color }]} />
    <View style={s.tokenInfo}>
      <Text style={s.tokenSymbol}>{token.symbol}</Text>
      <Text style={s.tokenName}>{token.name}</Text>
    </View>
    <View style={s.tokenValues}>
      <Text style={s.tokenBalance}>0.00</Text>
      <Text style={s.tokenUsd}>
        {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
      </Text>
    </View>
  </TouchableOpacity>
));

// Memoized legend (static data, never changes)
const Legend = React.memo(() => (
  <View style={s.legend}>
    {MOCK_ALLOCATIONS.map((slice) => (
      <View key={slice.label} style={s.legendItem}>
        <View style={[s.legendDot, { backgroundColor: slice.color }]} />
        <Text style={s.legendLabel}>{slice.label}</Text>
        <Text style={s.legendValue}>{slice.value}%</Text>
      </View>
    ))}
  </View>
));

const ActionBtn = React.memo(({ icon, label, color }: { icon: string; label: string; color: string }) => (
  <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
    <View style={[s.actionCircle, { backgroundColor: color + '20' }]}>
      <Text style={[s.actionIcon, { color }]}>{icon}</Text>
    </View>
    <Text style={s.actionLabel}>{label}</Text>
  </TouchableOpacity>
));

export function HomeScreen() {
  const [showManage, setShowManage] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const totalUsdValue = useWalletStore((s) => s.totalUsdValue);
  const { prices, loading: pricesLoading, lastUpdated, refresh: refreshPrices } = usePrices();

  const filteredTokens = useMemo(
    () => SUPPORTED_TOKENS.filter((t) => enabledTokens.includes(t.symbol)),
    [enabledTokens]
  );

  const renderItem = useCallback(({ item }: { item: TokenInfo }) => (
    <TokenRow token={item} price={prices[item.symbol]} onPress={() => setSelectedToken(item)} />
  ), [prices]);

  const openManage = useCallback(() => setShowManage(true), []);
  const closeManage = useCallback(() => setShowManage(false), []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return '';
    const secs = Math.floor((Date.now() - lastUpdated) / 1000);
    if (secs < 60) return 'Updated just now';
    if (secs < 3600) return `Updated ${Math.floor(secs / 60)}m ago`;
    return `Updated ${Math.floor(secs / 3600)}h ago`;
  }, [lastUpdated]);

  const header = useMemo(() => (
    <>
      <View style={s.chartCard}>
        <PieChart
          slices={MOCK_ALLOCATIONS}
          size={180}
          centerLabel="Total"
          centerValue={`$${totalUsdValue.toFixed(2)}`}
        />
        <Legend />
      </View>
      <View style={s.actions}>
        <ActionBtn icon="↑" label="Send" color="#f97316" />
        <ActionBtn icon="↓" label="Receive" color="#22c55e" />
        <ActionBtn icon="⇄" label="Swap" color="#3b82f6" />
      </View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Tokens</Text>
        <TouchableOpacity onPress={openManage}>
          <Text style={s.manageLink}>Manage</Text>
        </TouchableOpacity>
      </View>
      {lastUpdatedText ? <Text style={s.lastUpdated}>{lastUpdatedText}</Text> : null}
    </>
  ), [totalUsdValue, openManage, lastUpdatedText]);

  if (selectedToken) {
    return (
      <TokenDetailScreen
        token={selectedToken}
        price={prices[selectedToken.symbol] ?? 0}
        onClose={() => setSelectedToken(null)}
      />
    );
  }
  if (showManage) return <ManageTokensScreen onClose={closeManage} />;

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={filteredTokens}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={pricesLoading} onRefresh={refreshPrices} tintColor="#22c55e" />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  list: { paddingBottom: 100 },
  chartCard: { backgroundColor: '#16161f', borderRadius: 24, padding: 24, alignItems: 'center', marginHorizontal: 16, marginTop: 16 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: '#a0a0b0', fontSize: 12 },
  legendValue: { color: '#606070', fontSize: 11 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 16, marginTop: 20 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionIcon: { fontSize: 24, fontWeight: '700' },
  actionLabel: { color: '#f0f0f5', fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
  sectionTitle: { color: '#a0a0b0', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  manageLink: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  lastUpdated: { color: '#606070', fontSize: 11, marginLeft: 16, marginBottom: 4 },
  tokenRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#16161f', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },
  tokenDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  tokenInfo: { flex: 1 },
  tokenSymbol: { color: '#f0f0f5', fontSize: 15, fontWeight: '600' },
  tokenName: { color: '#606070', fontSize: 12, marginTop: 1 },
  tokenValues: { alignItems: 'flex-end' },
  tokenBalance: { color: '#a0a0b0', fontSize: 14, fontWeight: '500' },
  tokenUsd: { color: '#606070', fontSize: 12, marginTop: 1 },
});
