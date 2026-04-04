import { fonts } from '../utils/theme';
/**
 * Market Screen — Top tokens by market cap, search, trending.
 * Fetches from CoinGecko with 5s timeout and caching.
 * Falls back to hardcoded demo data when offline or in demo mode.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';

interface Props {
  onClose: () => void;
}

interface MarketToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  market_cap: number;
  image: string;
  coingeckoId: string;
}

// ─── Demo market data (used offline / demo mode) ───

const DEMO_MARKET_DATA: MarketToken[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 87000, price_change_percentage_24h: 2.1, market_cap_rank: 1, market_cap: 1710000000000, image: '', coingeckoId: 'bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 2100, price_change_percentage_24h: -0.8, market_cap_rank: 2, market_cap: 253000000000, image: '', coingeckoId: 'ethereum' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', current_price: 1.0, price_change_percentage_24h: 0.01, market_cap_rank: 3, market_cap: 144000000000, image: '', coingeckoId: 'tether' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', current_price: 2.35, price_change_percentage_24h: 4.2, market_cap_rank: 4, market_cap: 136000000000, image: '', coingeckoId: 'ripple' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', current_price: 610, price_change_percentage_24h: 1.5, market_cap_rank: 5, market_cap: 88000000000, image: '', coingeckoId: 'binancecoin' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 140, price_change_percentage_24h: 3.4, market_cap_rank: 6, market_cap: 72000000000, image: '', coingeckoId: 'solana' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', current_price: 1.0, price_change_percentage_24h: 0.0, market_cap_rank: 7, market_cap: 60000000000, image: '', coingeckoId: 'usd-coin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', current_price: 0.72, price_change_percentage_24h: -1.2, market_cap_rank: 8, market_cap: 25000000000, image: '', coingeckoId: 'cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', current_price: 0.18, price_change_percentage_24h: 5.1, market_cap_rank: 9, market_cap: 26000000000, image: '', coingeckoId: 'dogecoin' },
  { id: 'the-open-network', symbol: 'TON', name: 'Toncoin', current_price: 3.80, price_change_percentage_24h: -2.3, market_cap_rank: 10, market_cap: 9600000000, image: '', coingeckoId: 'the-open-network' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', current_price: 4.50, price_change_percentage_24h: 1.8, market_cap_rank: 11, market_cap: 6800000000, image: '', coingeckoId: 'polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', current_price: 14.20, price_change_percentage_24h: 0.9, market_cap_rank: 12, market_cap: 9100000000, image: '', coingeckoId: 'chainlink' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', current_price: 22.50, price_change_percentage_24h: -0.5, market_cap_rank: 13, market_cap: 9200000000, image: '', coingeckoId: 'avalanche-2' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', current_price: 3.60, price_change_percentage_24h: 6.2, market_cap_rank: 14, market_cap: 11500000000, image: '', coingeckoId: 'sui' },
  { id: 'matic-network', symbol: 'POL', name: 'Polygon', current_price: 0.25, price_change_percentage_24h: -1.8, market_cap_rank: 15, market_cap: 2500000000, image: '', coingeckoId: 'matic-network' },
  { id: 'open-token', symbol: 'OTK', name: 'Open Token', current_price: 0.01, price_change_percentage_24h: 0.0, market_cap_rank: 999, market_cap: 100000, image: '', coingeckoId: 'open-token' },
];

const TRENDING_SYMBOLS = ['BTC', 'SOL', 'SUI', 'DOGE', 'XRP'];

// ─── Token color map ───

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', ATOM: '#6f7390',
  OTK: '#22c55e', ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142',
  LINK: '#2a5ada', BNB: '#f3ba2f', USDT: '#26a17b', USDC: '#2775ca',
  XRP: '#23292f', DOGE: '#c3a634', TON: '#0098ea', SUI: '#4da2ff',
  POL: '#8247e5',
};

// ─── Cache ───

let cachedMarketData: MarketToken[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

export const MarketScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [marketData, setMarketData] = useState<MarketToken[]>(cachedMarketData ?? DEMO_MARKET_DATA);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    searchBox: { marginHorizontal: 16, marginBottom: 12, backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: t.text.primary, fontSize: 15 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginTop: 16, marginBottom: 8 },
    trendingRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
    trendingChip: { backgroundColor: t.bg.card, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    trendingChipActive: { backgroundColor: t.accent.green + '20' },
    trendingText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    trendingTextActive: { color: t.accent.green, fontWeight: fonts.bold },
    tokenRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    rank: { width: 28, color: t.text.muted, fontSize: 12, textAlign: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    tokenInfo: { flex: 1 },
    tokenSymbol: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    tokenName: { color: t.text.muted, fontSize: 12, marginTop: 1 },
    priceCol: { alignItems: 'flex-end' },
    price: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    change: { fontSize: 12, fontWeight: fonts.bold, marginTop: 2 },
    marketCap: { color: t.text.muted, fontSize: 10, marginTop: 1 },
    loadingWrap: { paddingVertical: 40, alignItems: 'center' },
    emptyText: { color: t.text.muted, textAlign: 'center', paddingVertical: 40, fontSize: 14 },
  }), [t]);

  const fetchMarket = useCallback(async () => {
    if (demoMode) {
      setMarketData(DEMO_MARKET_DATA);
      return;
    }

    // Use cache if fresh
    if (cachedMarketData && Date.now() - cacheTimestamp < CACHE_TTL) {
      setMarketData(cachedMarketData);
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h',
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const mapped: MarketToken[] = data.map((coin: Record<string, unknown>) => ({
          id: coin.id as string,
          symbol: (coin.symbol as string).toUpperCase(),
          name: coin.name as string,
          current_price: (coin.current_price as number) ?? 0,
          price_change_percentage_24h: (coin.price_change_percentage_24h as number) ?? 0,
          market_cap_rank: (coin.market_cap_rank as number) ?? 999,
          market_cap: (coin.market_cap as number) ?? 0,
          image: (coin.image as string) ?? '',
          coingeckoId: coin.id as string,
        }));
        cachedMarketData = mapped;
        cacheTimestamp = Date.now();
        setMarketData(mapped);
      }
    } catch {
      // Fallback to demo data on failure
      if (!cachedMarketData) setMarketData(DEMO_MARKET_DATA);
    }
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    cacheTimestamp = 0; // Force re-fetch
    await fetchMarket();
    setRefreshing(false);
  }, [fetchMarket]);

  const filtered = useMemo(() => {
    if (!search.trim()) return marketData;
    const q = search.toLowerCase();
    return marketData.filter(
      (tk) => tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q)
    );
  }, [marketData, search]);

  const trending = useMemo(() => {
    return marketData.filter((tk) => TRENDING_SYMBOLS.includes(tk.symbol));
  }, [marketData]);

  const formatMarketCap = (v: number): string => {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    return `$${v.toLocaleString()}`;
  };

  const handleTrendingTap = useCallback((symbol: string) => {
    setSearch(symbol);
  }, []);

  const renderToken = useCallback(({ item }: { item: MarketToken }) => {
    const changeColor = item.price_change_percentage_24h >= 0 ? t.accent.green : t.accent.red;
    const changeSign = item.price_change_percentage_24h >= 0 ? '+' : '';
    const dotColor = TOKEN_COLORS[item.symbol] ?? t.accent.blue;

    return (
      <TouchableOpacity style={s.tokenRow} activeOpacity={0.7}>
        <Text style={s.rank}>#{item.market_cap_rank}</Text>
        <View style={[s.dot, { backgroundColor: dotColor }]} />
        <View style={s.tokenInfo}>
          <Text style={s.tokenSymbol}>{item.symbol}</Text>
          <Text style={s.tokenName}>{item.name}</Text>
        </View>
        <View style={s.priceCol}>
          <Text style={s.price}>
            ${item.current_price < 1
              ? item.current_price.toFixed(4)
              : item.current_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Text>
          <Text style={[s.change, { color: changeColor }]}>
            {changeSign}{item.price_change_percentage_24h.toFixed(2)}%
          </Text>
          <Text style={s.marketCap}>{formatMarketCap(item.market_cap)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [t, s]);

  const keyExtractor = useCallback((item: MarketToken) => item.id, []);

  const ListHeader = useMemo(() => (
    <View>
      {/* Trending */}
      <Text style={s.sectionLabel}>Trending</Text>
      <ScrollableRow>
        {trending.map((tk) => (
          <TouchableOpacity
            key={tk.symbol}
            style={[s.trendingChip, search === tk.symbol && s.trendingChipActive]}
            onPress={() => handleTrendingTap(tk.symbol)}
          >
            <Text style={[s.trendingText, search === tk.symbol && s.trendingTextActive]}>
              {tk.symbol} {tk.price_change_percentage_24h >= 0 ? '+' : ''}{tk.price_change_percentage_24h.toFixed(1)}%
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollableRow>

      <Text style={s.sectionLabel}>
        {search ? `Results for "${search}"` : 'Top by Market Cap'}
      </Text>
    </View>
  ), [s, trending, search, handleTrendingTap]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Market</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Search */}
      <TextInput
        style={s.searchBox}
        placeholder="Search tokens..."
        placeholderTextColor={t.text.muted}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading && !refreshing ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={t.accent.green} />
          <Text style={{ color: t.text.muted, marginTop: 8, fontSize: 13 }}>Loading market data...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderToken}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<Text style={s.emptyText}>No tokens found</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={t.accent.green}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
});

// Simple horizontal scroll wrapper for trending chips
function ScrollableRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, flexWrap: 'wrap' }}>
      {children}
    </View>
  );
}
