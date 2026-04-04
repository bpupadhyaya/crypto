/**
 * Home Screen — Polished with animations, micro-interactions, and refined styling.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity, RefreshControl, Animated, ActivityIndicator,
} from 'react-native';
import { PieChart } from '../components/PieChart';
import { MiniSparkline } from '../components/MiniSparkline';
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
import { useAnimatedNumber } from '../utils/animations';
import { formatCryptoAmount } from '../core/currency/formatter';
import { ConstitutionSummary } from '../components/ConstitutionSummary';
import type { Theme } from '../utils/theme';
import { fonts } from '../utils/theme';
import { CHAIN_COLORS, CHAIN_ICONS } from '../core/chains/addressDetection';

// Fallback allocations when no portfolio data
const FALLBACK_ALLOCATIONS = [
  { label: 'BTC', value: 35, color: '#f7931a' },
  { label: 'ETH', value: 25, color: '#627eea' },
  { label: 'USDC', value: 15, color: '#2775ca' },
  { label: 'SOL', value: 10, color: '#9945ff' },
  { label: 'Others', value: 15, color: '#606070' },
];

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', USDC: '#2775ca',
  USDT: '#26a17b', ATOM: '#2e3148', OTK: '#00c853', LINK: '#2a5ada',
  ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142', BNB: '#f0b90b',
  DOGE: '#c2a633', XRP: '#00aae4',
};

/** Generate fake sparkline data from price + change for visual effect */
function generateSparkline(price: number | undefined, change: number | undefined): number[] {
  if (!price) return [];
  const base = price;
  const pctChange = (change ?? 0) / 100;
  // Generate 7 points that trend from (price - change%) to price
  const start = base / (1 + pctChange);
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    const progress = i / 6;
    // Add slight random variation to make it look natural
    const noise = (Math.sin(i * 2.5 + price) * 0.3 + 0.5) * 0.02;
    points.push(start + (base - start) * progress + base * noise);
  }
  return points;
}

const keyExtractor = (item: TokenInfo) => item.symbol;

const TokenRow = React.memo(({
  token, price, balance, change, onPress, t, isRefreshing, prevPrice, chainLabel, chainColor,
}: {
  token: TokenInfo;
  price?: number;
  balance?: number;
  change?: number;
  onPress: () => void;
  t: Theme & { isDark: boolean };
  isRefreshing?: boolean;
  prevPrice?: number;
  chainLabel?: string;
  chainColor?: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const tokenColor = token.color || TOKEN_COLORS[token.symbol] || '#606070';

  // Flash green when price changes after refresh
  useEffect(() => {
    if (prevPrice != null && price != null && prevPrice !== price) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }).start();
      // Subtle scale pop
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [price, prevPrice, flashAnim, scaleAnim]);

  const sparklineData = useMemo(
    () => generateSparkline(price, change),
    [price, change],
  );

  const flashBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', t.accent.green + '18'],
  });

  const s = useMemo(() => StyleSheet.create({
    tokenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: t.bg.card,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      marginHorizontal: 16,
      borderLeftWidth: 3,
      borderLeftColor: tokenColor,
      borderRadius: 2,
    },
    tokenIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      backgroundColor: tokenColor + '20',
    },
    tokenIconText: {
      color: tokenColor,
      fontSize: fonts.md,
      fontWeight: fonts.bold,
    },
    tokenInfo: { flex: 1 },
    tokenSymbol: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    tokenName: { color: t.text.muted, fontSize: fonts.sm, marginTop: 1 },
    sparklineWrap: { marginRight: 12 },
    tokenValues: { alignItems: 'flex-end' },
    tokenBalance: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.medium },
    tokenPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
    tokenUsd: { color: t.text.muted, fontSize: fonts.sm },
  }), [t, tokenColor]);

  const changeColor = change != null ? (change >= 0 ? t.accent.green : t.accent.red) : t.text.muted;
  const sparklineColor = change != null ? (change >= 0 ? t.accent.green : t.accent.red) : t.text.muted;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View style={[s.tokenRow, { transform: [{ scale: scaleAnim }], backgroundColor: flashBgColor as any }]}>
        <View style={s.tokenIcon}>
          <Text style={s.tokenIconText}>{token.symbol.charAt(0)}</Text>
        </View>
        <View style={s.tokenInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.tokenSymbol}>{token.symbol}</Text>
            {chainLabel && chainColor && (
              <View style={{ backgroundColor: chainColor + '25', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: chainColor, fontSize: fonts.xs, fontWeight: fonts.bold }}>{chainLabel}</Text>
              </View>
            )}
          </View>
          <Text style={s.tokenName}>{token.name}</Text>
        </View>
        {sparklineData.length > 0 && (
          <View style={s.sparklineWrap}>
            <MiniSparkline data={sparklineData} color={sparklineColor} width={40} height={20} />
          </View>
        )}
        <View style={s.tokenValues}>
          <Text style={s.tokenBalance}>
            {balance ? formatCryptoAmount(balance, token.symbol) : '0.00 ' + token.symbol}
          </Text>
          <View style={s.tokenPriceRow}>
            <Text style={s.tokenUsd}>
              {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014'}
            </Text>
            {change != null && (
              <Text style={{ color: changeColor, fontSize: fonts.xs, fontWeight: fonts.semibold }}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Memoized legend — dynamic allocations
const Legend = React.memo(({ t, data }: { t: Theme; data: Array<{ label: string; value: number; color: string }> }) => {
  const s = useMemo(() => StyleSheet.create({
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { color: t.text.secondary, fontSize: fonts.sm },
    legendValue: { color: t.text.muted, fontSize: fonts.xs },
  }), [t]);

  return (
    <View style={s.legend}>
      {data.map((slice) => (
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const s = useMemo(() => StyleSheet.create({
    actionBtn: { alignItems: 'center', flex: 1 },
    actionCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    actionIcon: { fontSize: fonts.xxl, fontWeight: fonts.bold },
    actionLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
  }), [t]);

  return (
    <TouchableOpacity
      style={s.actionBtn}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[s.actionCircle, { backgroundColor: color + '20', transform: [{ scale: scaleAnim }] }]}>
        <Text style={[s.actionIcon, { color }]}>{icon}</Text>
      </Animated.View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

/** Animated portfolio total that counts up/down smoothly */
const AnimatedTotal = React.memo(({ value, t }: { value: number; t: Theme }) => {
  const animatedValue = useAnimatedNumber(value, 600);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });
    return () => animatedValue.removeListener(listenerId);
  }, [animatedValue]);

  const formatted = `$${displayValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return null; // The PieChart handles the center display; we pass the animated formatted value
});

// ─── Memoized chart + actions header (does NOT depend on search query) ───
// Extracted so PieChart never re-renders while user is typing in search box.
const ChartHeader = React.memo(function ChartHeader({
  formattedTotal,
  portfolioChange,
  allocations,
  showTestnetBanner,
  demoMode,
  openManage,
  onBuySell,
  s,
  t,
}: {
  formattedTotal: string;
  portfolioChange: number | null;
  allocations: Array<{ label: string; value: number; color: string }>;
  showTestnetBanner: boolean;
  demoMode: boolean;
  openManage: () => void;
  onBuySell: () => void;
  s: ReturnType<typeof StyleSheet.create>;
  t: Theme & { isDark: boolean };
}) {
  return (
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
          slices={allocations}
          size={180}
          centerLabel="Total"
          centerValue={formattedTotal}
        />
        <Legend t={t} data={allocations} />
        {portfolioChange != null && (
          <Text style={{ color: portfolioChange >= 0 ? t.accent.green : t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 8 }}>
            {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}% (24h)
          </Text>
        )}
      </View>
      <View style={s.actions}>
        <ActionBtn icon="↑" label="Send" color={t.accent.orange} t={t} />
        <ActionBtn icon="↓" label="Receive" color={t.accent.green} t={t} />
        <ActionBtn icon="⇄" label="Swap" color={t.accent.blue} t={t} />
        <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={onBuySell}>
          <View style={{ width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: t.accent.purple + '20' }}>
            <Text style={{ fontSize: fonts.xxl, fontWeight: fonts.bold, color: t.accent.purple }}>$</Text>
          </View>
          <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold }}>Buy</Text>
        </TouchableOpacity>
      </View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Tokens</Text>
        <TouchableOpacity onPress={openManage}>
          <Text style={s.manageLink}>Manage</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

export function HomeScreen() {
  const [showManage, setShowManage] = useState(false);
  const [showBuySell, setShowBuySell] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatusText, setRefreshStatusText] = useState('');
  const prevPricesRef = useRef<Record<string, number>>({});
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const addresses = useWalletStore((s) => s.addresses);
  const stablecoinChains = useWalletStore((s) => s.stablecoinChains);
  const { prices, changes, loading: pricesLoading, lastUpdated, refresh: refreshPrices } = usePrices();
  const t = useTheme();

  // Screen fade-in animation
  const screenFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  // Fetch real on-chain balances
  const { balances: portfolioBalances, totalUsdValue } = usePortfolio(addresses);

  // Animated portfolio total
  const animatedTotal = useAnimatedNumber(totalUsdValue, 700);
  const [displayTotal, setDisplayTotal] = useState(totalUsdValue);

  useEffect(() => {
    const id = animatedTotal.addListener(({ value }) => {
      setDisplayTotal(value);
    });
    return () => animatedTotal.removeListener(id);
  }, [animatedTotal]);

  const formattedTotal = `$${displayTotal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Enhanced pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshStatusText('Refreshing prices...');
    // Store current prices to detect changes
    prevPricesRef.current = { ...prices };
    await refreshPrices();
    setRefreshStatusText('');
    setIsRefreshing(false);
  }, [refreshPrices, prices]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    testnetBanner: { backgroundColor: t.accent.yellow + '20', paddingVertical: 6, alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginTop: 8 },
    testnetText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold, letterSpacing: 1 },
    demoBanner: { backgroundColor: t.accent.purple + '20', paddingVertical: 6, alignItems: 'center', marginHorizontal: 16, borderRadius: 8, marginTop: 8 },
    demoText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, letterSpacing: 1 },
    list: { paddingBottom: 100 },
    chartCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 24, alignItems: 'center', marginHorizontal: 16, marginTop: 16 },
    actions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8, marginHorizontal: 16 },
    sectionTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1 },
    manageLink: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 16, marginBottom: 8, color: t.text.primary, fontSize: fonts.md },
    lastUpdated: { color: t.text.muted, fontSize: fonts.xs, marginLeft: 16, marginBottom: 4 },
    refreshStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 6,
      marginHorizontal: 16,
      marginTop: 4,
    },
    refreshText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold },
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

  // Compute real pie chart allocations from portfolio
  const allocations = useMemo(() => {
    if (totalUsdValue <= 0) return FALLBACK_ALLOCATIONS;
    const items: Array<{ label: string; value: number; color: string; usd: number }> = [];
    for (const b of portfolioBalances) {
      const usd = b.usdValue ?? 0;
      if (usd > 0) {
        items.push({ label: b.token.symbol, value: Math.round((usd / totalUsdValue) * 100), color: TOKEN_COLORS[b.token.symbol] ?? '#606070', usd });
      }
    }
    if (items.length === 0) return FALLBACK_ALLOCATIONS;
    // Sort by value descending, cap at 5, rest goes to "Others"
    items.sort((a, b) => b.usd - a.usd);
    const top = items.slice(0, 4);
    const rest = items.slice(4);
    const topTotal = top.reduce((sum, i) => sum + i.value, 0);
    const result = top.map(({ label, value, color }) => ({ label, value, color }));
    const othersValue = 100 - topTotal;
    if (rest.length > 0 && othersValue > 0) {
      result.push({ label: 'Others', value: othersValue, color: '#606070' });
    } else if (topTotal < 100 && result.length > 0) {
      result[0].value += (100 - topTotal); // rounding fix
    }
    return result;
  }, [portfolioBalances, totalUsdValue]);

  // Weighted 24h portfolio change
  const portfolioChange = useMemo(() => {
    if (totalUsdValue <= 0 || !changes || Object.keys(changes).length === 0) return null;
    let weightedSum = 0;
    for (const b of portfolioBalances) {
      const usd = b.usdValue ?? 0;
      const change = changes[b.token.symbol];
      if (usd > 0 && change != null) {
        weightedSum += (usd / totalUsdValue) * change;
      }
    }
    return weightedSum;
  }, [portfolioBalances, changes, totalUsdValue]);

  const renderItem = useCallback(({ item }: { item: TokenInfo }) => {
    const chain = (item.symbol === 'USDC' || item.symbol === 'USDT') ? stablecoinChains[item.symbol] : undefined;
    return (
      <TokenRow
        token={item}
        price={prices[item.symbol]}
        balance={balanceMap[item.symbol]}
        change={changes[item.symbol]}
        onPress={() => setSelectedToken(item)}
        t={t}
        isRefreshing={isRefreshing}
        prevPrice={prevPricesRef.current[item.symbol]}
        chainLabel={chain ? `${CHAIN_ICONS[chain as keyof typeof CHAIN_ICONS] ?? ''} ${chain}` : undefined}
        chainColor={chain ? CHAIN_COLORS[chain as keyof typeof CHAIN_COLORS] : undefined}
      />
    );
  }, [prices, changes, balanceMap, t, isRefreshing, stablecoinChains]);

  const openManage = useCallback(() => setShowManage(true), []);
  const closeManage = useCallback(() => setShowManage(false), []);
  const openBuySell = useCallback(() => setShowBuySell(true), []);

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

  // Stable chart header — does NOT depend on searchQuery so PieChart never
  // re-renders while user types. Only recalculates when chart data changes.
  const chartHeader = useMemo(() => (
    <ChartHeader
      formattedTotal={formattedTotal}
      portfolioChange={portfolioChange}
      allocations={allocations}
      showTestnetBanner={showTestnetBanner}
      demoMode={demoMode}
      openManage={openManage}
      onBuySell={openBuySell}
      s={s}
      t={t}
    />
  ), [formattedTotal, portfolioChange, allocations, showTestnetBanner, demoMode, openManage, openBuySell, s, t]);

  const header = useMemo(() => (
    <View>
      {chartHeader}
      <TextInput
        style={s.searchInput}
        placeholder="Search tokens..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {refreshStatusText ? (
        <View style={s.refreshStatus}>
          <ActivityIndicator size="small" color={t.accent.green} />
          <Text style={s.refreshText}>{refreshStatusText}</Text>
        </View>
      ) : lastUpdatedText ? (
        <Text style={s.lastUpdated}>{lastUpdatedText}</Text>
      ) : null}
    </View>
  ), [chartHeader, s, t, searchQuery, refreshStatusText, lastUpdatedText]);

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
    <Animated.View style={[s.container, { flex: 1, opacity: screenFade }]}>
      <SafeAreaView style={s.container}>
        <FlatList
          data={filteredTokens}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListFooterComponent={<View style={{ paddingHorizontal: 4, paddingTop: 16, paddingBottom: 8 }}><ConstitutionSummary /></View>}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={pricesLoading || isRefreshing}
              onRefresh={handleRefresh}
              tintColor={t.accent.green}
              colors={[t.accent.green]}
              progressBackgroundColor={t.bg.card}
            />
          }
        />
      </SafeAreaView>
    </Animated.View>
  );
}
