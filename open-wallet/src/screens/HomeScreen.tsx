/**
 * Home Screen — Fully memoized, zero unnecessary re-renders.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { PieChart } from '../components/PieChart';
import { useWalletStore } from '../store/walletStore';
import { isTestnet } from '../core/network';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { ManageTokensScreen } from './ManageTokensScreen';
import { TokenDetailScreen } from './TokenDetailScreen';
import { BuySellScreen } from './BuySellScreen';
import { HistoryScreen } from './HistoryScreen';
import { usePrices } from '../hooks/usePrices';
import { usePortfolio } from '../hooks/useBalances';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/theme';

// Static — never recreated
const MOCK_ALLOCATIONS = [
  { label: 'BTC', value: 35, color: '#f7931a' },
  { label: 'ETH', value: 25, color: '#627eea' },
  { label: 'USDC', value: 15, color: '#2775ca' },
  { label: 'SOL', value: 10, color: '#9945ff' },
  { label: 'Others', value: 15, color: '#606070' },
];

const keyExtractor = (item: TokenInfo) => item.symbol;

const TokenRow = React.memo(({ token, price, balance, onPress, t }: { token: TokenInfo; price?: number; balance?: number; onPress: () => void; t: Theme & { isDark: boolean } }) => {
  const s = useMemo(() => StyleSheet.create({
    tokenRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: t.bg.card, borderBottomWidth: 1, borderBottomColor: t.border, marginHorizontal: 16 },
    tokenDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    tokenInfo: { flex: 1 },
    tokenSymbol: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    tokenName: { color: t.text.muted, fontSize: 12, marginTop: 1 },
    tokenValues: { alignItems: 'flex-end' },
    tokenBalance: { color: t.text.secondary, fontSize: 14, fontWeight: '500' },
    tokenUsd: { color: t.text.muted, fontSize: 12, marginTop: 1 },
  }), [t]);

  return (
    <TouchableOpacity style={s.tokenRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.tokenDot, { backgroundColor: token.color }]} />
      <View style={s.tokenInfo}>
        <Text style={s.tokenSymbol}>{token.symbol}</Text>
        <Text style={s.tokenName}>{token.name}</Text>
      </View>
      <View style={s.tokenValues}>
        <Text style={s.tokenBalance}>{balance ? balance.toFixed(balance < 0.01 ? 6 : balance < 1 ? 4 : 2) : '0.00'}</Text>
        <Text style={s.tokenUsd}>
          {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// Memoized legend (static data, never changes)
const Legend = React.memo(({ t }: { t: Theme }) => {
  const s = useMemo(() => StyleSheet.create({
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { color: t.text.secondary, fontSize: 12 },
    legendValue: { color: t.text.muted, fontSize: 11 },
  }), [t]);

  return (
    <View style={s.legend}>
      {MOCK_ALLOCATIONS.map((slice) => (
        <View key={slice.label} style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: slice.color }]} />
          <Text style={s.legendLabel}>{slice.label}</Text>
          <Text style={s.legendValue}>{slice.value}%</Text>
        </View>
      ))}
    </View>
  );
});

const ActionBtn = React.memo(({ icon, label, color, t }: { icon: string; label: string; color: string; t: Theme }) => {
  const s = useMemo(() => StyleSheet.create({
    actionBtn: { alignItems: 'center', flex: 1 },
    actionCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    actionIcon: { fontSize: 24, fontWeight: '700' },
    actionLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
  }), [t]);

  return (
    <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
      <View style={[s.actionCircle, { backgroundColor: color + '20' }]}>
        <Text style={[s.actionIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

export function HomeScreen() {
  const [showManage, setShowManage] = useState(false);
  const [showBuySell, setShowBuySell] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const addresses = useWalletStore((s) => s.addresses);
  const { prices, loading: pricesLoading, lastUpdated, refresh: refreshPrices } = usePrices();
  const t = useTheme();

  // Fetch real on-chain balances
  const { balances: portfolioBalances, totalUsdValue } = usePortfolio(addresses);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    testnetBanner: { backgroundColor: t.accent.yellow + '20', paddingVertical: 6, alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginTop: 8 },
    testnetText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    demoBanner: { backgroundColor: t.accent.purple + '20', paddingVertical: 6, alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginTop: 8 },
    demoText: { color: t.accent.purple, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    list: { paddingBottom: 100 },
    chartCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 24, alignItems: 'center', marginHorizontal: 16, marginTop: 16 },
    actions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
    sectionTitle: { color: t.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    manageLink: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 16, marginBottom: 8, color: t.text.primary, fontSize: 14 },
    lastUpdated: { color: t.text.muted, fontSize: 11, marginLeft: 16, marginBottom: 4 },
  }), [t]);

  const filteredTokens = useMemo(() => {
    let tokens = SUPPORTED_TOKENS.filter((tk) => enabledTokens.includes(tk.symbol));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tokens = tokens.filter((tk) =>
        tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q)
      );
    }
    return tokens;
  }, [enabledTokens, searchQuery]);

  // Map portfolio balances to token symbol for display
  const balanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of portfolioBalances) {
      const decimals = b.token.decimals;
      map[b.token.symbol] = Number(b.amount) / Math.pow(10, decimals);
    }
    return map;
  }, [portfolioBalances]);

  const renderItem = useCallback(({ item }: { item: TokenInfo }) => (
    <TokenRow token={item} price={prices[item.symbol]} balance={balanceMap[item.symbol]} onPress={() => setSelectedToken(item)} t={t} />
  ), [prices, balanceMap, t]);

  const openManage = useCallback(() => setShowManage(true), []);
  const closeManage = useCallback(() => setShowManage(false), []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return '';
    const secs = Math.floor((Date.now() - lastUpdated) / 1000);
    if (secs < 60) return 'Updated just now';
    if (secs < 3600) return `Updated ${Math.floor(secs / 60)}m ago`;
    return `Updated ${Math.floor(secs / 3600)}h ago`;
  }, [lastUpdated]);

  const networkMode = useWalletStore((s) => s.networkMode);
  const demoMode = useWalletStore((s) => s.demoMode);
  const showTestnetBanner = networkMode === 'testnet';

  const header = useMemo(() => (
    <>
      {showTestnetBanner && (
        <View style={s.testnetBanner}>
          <Text style={s.testnetText}>TESTNET MODE — No real funds</Text>
        </View>
      )}
      {demoMode && (
        <View style={s.demoBanner}>
          <Text style={s.demoText}>DEMO MODE — Simulated balances</Text>
        </View>
      )}
      <View style={s.chartCard}>
        <PieChart
          slices={MOCK_ALLOCATIONS}
          size={180}
          centerLabel="Total"
          centerValue={`$${totalUsdValue.toFixed(2)}`}
        />
        <Legend t={t} />
      </View>
      <View style={s.actions}>
        <ActionBtn icon="↑" label="Send" color={t.accent.orange} t={t} />
        <ActionBtn icon="↓" label="Receive" color={t.accent.green} t={t} />
        <ActionBtn icon="⇄" label="Swap" color={t.accent.blue} t={t} />
        <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={() => setShowBuySell(true)}>
          <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: t.accent.purple + '20' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: t.accent.purple }}>$</Text>
          </View>
          <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '600' }}>Buy</Text>
        </TouchableOpacity>
      </View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Tokens</Text>
        <TouchableOpacity onPress={openManage}>
          <Text style={s.manageLink}>Manage</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={s.searchInput}
        placeholder="Search tokens..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {lastUpdatedText ? <Text style={s.lastUpdated}>{lastUpdatedText}</Text> : null}
    </>
  ), [totalUsdValue, openManage, lastUpdatedText, showTestnetBanner, demoMode, s, t, searchQuery]);

  if (showBuySell) return <BuySellScreen onClose={() => setShowBuySell(false)} />;
  if (showHistory) return <HistoryScreen />;

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
          <RefreshControl refreshing={pricesLoading} onRefresh={refreshPrices} tintColor={t.accent.green} />
        }
      />
    </SafeAreaView>
  );
}
