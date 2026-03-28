/**
 * Watchlist — Track tokens you don't hold but want to monitor.
 * Price alerts, 24h/7d change, persisted in AsyncStorage.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { usePrices } from '../hooks/usePrices';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface WatchlistItem {
  symbol: string;
  priceAlert?: { target: number; direction: 'above' | 'below' };
  addedAt: number;
  sortOrder: number;
}

// Demo prices and changes when real prices aren't available
const DEMO_PRICES: Record<string, { price: number; change24h: number; change7d: number }> = {
  BTC: { price: 67432.10, change24h: 2.3, change7d: 5.8 },
  ETH: { price: 3521.45, change24h: -1.2, change7d: 3.1 },
  SOL: { price: 148.72, change24h: 4.5, change7d: 12.3 },
  DOGE: { price: 0.1542, change24h: -3.1, change7d: -8.2 },
  XRP: { price: 0.6234, change24h: 1.8, change7d: -2.5 },
  ADA: { price: 0.4821, change24h: -0.5, change7d: 4.2 },
  DOT: { price: 7.35, change24h: 3.2, change7d: 8.7 },
  AVAX: { price: 38.90, change24h: -2.8, change7d: 1.3 },
  LINK: { price: 15.42, change24h: 5.1, change7d: 9.4 },
  SUI: { price: 1.85, change24h: 8.3, change7d: 15.6 },
  POL: { price: 0.72, change24h: -1.5, change7d: -4.3 },
  BNB: { price: 612.30, change24h: 0.8, change7d: 2.1 },
  TON: { price: 5.92, change24h: -0.3, change7d: 6.8 },
  USDT: { price: 1.00, change24h: 0.0, change7d: 0.0 },
  USDC: { price: 1.00, change24h: 0.0, change7d: 0.0 },
  OTK: { price: 0.05, change24h: 12.5, change7d: 45.2 },
};

const DEFAULT_WATCHLIST: string[] = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'];
const STORAGE_KEY = '@openwallet_watchlist';

type SortBy = 'custom' | 'change24h' | 'change7d' | 'price';

// ─── Component ───

export const WatchlistScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const { prices } = usePrices();
  const t = useTheme();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('custom');
  const [alertSymbol, setAlertSymbol] = useState<string | null>(null);
  const [alertTarget, setAlertTarget] = useState('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

  // Load watchlist from storage
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setWatchlist(JSON.parse(stored));
        } else {
          // Initialize with defaults
          const defaults: WatchlistItem[] = DEFAULT_WATCHLIST.map((symbol, idx) => ({
            symbol,
            addedAt: Date.now(),
            sortOrder: idx,
          }));
          setWatchlist(defaults);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        }
      } catch {
        // Fallback to defaults
        const defaults: WatchlistItem[] = DEFAULT_WATCHLIST.map((symbol, idx) => ({
          symbol,
          addedAt: Date.now(),
          sortOrder: idx,
        }));
        setWatchlist(defaults);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Persist watchlist
  const persist = useCallback(async (items: WatchlistItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Silently fail storage
    }
  }, []);

  const getPrice = useCallback((symbol: string) => {
    const live = prices?.[symbol.toLowerCase()];
    if (live && typeof live === 'number' && live > 0) return live;
    return DEMO_PRICES[symbol]?.price ?? 0;
  }, [prices]);

  const getChange24h = useCallback((symbol: string) => {
    return DEMO_PRICES[symbol]?.change24h ?? (Math.random() * 10 - 5);
  }, []);

  const getChange7d = useCallback((symbol: string) => {
    return DEMO_PRICES[symbol]?.change7d ?? (Math.random() * 20 - 10);
  }, []);

  const addToWatchlist = useCallback((symbol: string) => {
    if (watchlist.find((w) => w.symbol === symbol)) {
      Alert.alert('Already Added', `${symbol} is already in your watchlist.`);
      return;
    }
    const newItem: WatchlistItem = {
      symbol,
      addedAt: Date.now(),
      sortOrder: watchlist.length,
    };
    const updated = [...watchlist, newItem];
    setWatchlist(updated);
    persist(updated);
    setShowAddToken(false);
    setSearchQuery('');
  }, [watchlist, persist]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Remove ${symbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = watchlist.filter((w) => w.symbol !== symbol);
            setWatchlist(updated);
            persist(updated);
          },
        },
      ]
    );
  }, [watchlist, persist]);

  const moveItem = useCallback((symbol: string, direction: 'up' | 'down') => {
    const idx = watchlist.findIndex((w) => w.symbol === symbol);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === watchlist.length - 1) return;

    const updated = [...watchlist];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated.forEach((item, i) => { item.sortOrder = i; });
    setWatchlist(updated);
    persist(updated);
  }, [watchlist, persist]);

  const setAlert = useCallback(() => {
    if (!alertSymbol) return;
    const target = parseFloat(alertTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Price', 'Enter a valid target price.');
      return;
    }
    const updated = watchlist.map((w) =>
      w.symbol === alertSymbol
        ? { ...w, priceAlert: { target, direction: alertDirection } }
        : w
    );
    setWatchlist(updated);
    persist(updated);
    setAlertSymbol(null);
    setAlertTarget('');
    Alert.alert('Alert Set', `You'll be notified when ${alertSymbol} goes ${alertDirection} $${target.toFixed(2)}`);
  }, [alertSymbol, alertTarget, alertDirection, watchlist, persist]);

  const removeAlert = useCallback((symbol: string) => {
    const updated = watchlist.map((w) =>
      w.symbol === symbol ? { ...w, priceAlert: undefined } : w
    );
    setWatchlist(updated);
    persist(updated);
  }, [watchlist, persist]);

  // Sorted list
  const sortedWatchlist = useMemo(() => {
    const list = [...watchlist];
    switch (sortBy) {
      case 'change24h':
        return list.sort((a, b) => getChange24h(b.symbol) - getChange24h(a.symbol));
      case 'change7d':
        return list.sort((a, b) => getChange7d(b.symbol) - getChange7d(a.symbol));
      case 'price':
        return list.sort((a, b) => getPrice(b.symbol) - getPrice(a.symbol));
      default:
        return list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }, [watchlist, sortBy, getChange24h, getChange7d, getPrice]);

  // Available tokens to add
  const availableTokens = useMemo(() => {
    const watchedSymbols = new Set(watchlist.map((w) => w.symbol));
    return SUPPORTED_TOKENS.filter((tok) => {
      if (watchedSymbols.has(tok.symbol)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return tok.symbol.toLowerCase().includes(q) || tok.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [watchlist, searchQuery]);

  const fmtPrice = useCallback((p: number) => {
    if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    if (p >= 0.01) return `$${p.toFixed(4)}`;
    return `$${p.toFixed(6)}`;
  }, []);

  const fmtChange = useCallback((c: number) => {
    const sign = c >= 0 ? '+' : '';
    return `${sign}${c.toFixed(1)}%`;
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    addBtnHeader: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    sortRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    sortChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.border },
    sortChipActive: { backgroundColor: t.accent.green },
    sortText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    sortTextActive: { color: t.bg.primary, fontWeight: '700' },
    card: { backgroundColor: t.bg.card, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    tokenRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    tokenDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    tokenSymbol: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    tokenName: { color: t.text.muted, fontSize: 12, marginTop: 1 },
    priceCol: { alignItems: 'flex-end', marginLeft: 'auto' },
    priceText: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    changeRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    alertBadge: { backgroundColor: t.accent.orange + '20', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
    alertBadgeText: { color: t.accent.orange, fontSize: 10, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 8, marginLeft: 8 },
    actionBtn: { padding: 4 },
    actionText: { fontSize: 16, color: t.text.muted },
    // Add token modal
    addOverlay: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    searchInput: { backgroundColor: t.bg.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: t.text.primary, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    addTokenRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    addTokenBtn: { marginLeft: 'auto', backgroundColor: t.accent.green, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12 },
    addTokenBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    // Alert form
    alertForm: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.orange + '30' },
    alertTitle: { color: t.accent.orange, fontSize: 14, fontWeight: '700', marginBottom: 12 },
    alertInput: { backgroundColor: t.bg.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: t.text.primary, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: t.border },
    dirRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    dirChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: t.border },
    dirActive: { backgroundColor: t.accent.orange },
    dirText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    dirTextActive: { color: '#fff', fontWeight: '700' },
    setAlertBtn: { backgroundColor: t.accent.orange, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    setAlertText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    cancelBtn: { paddingVertical: 10, alignItems: 'center' },
    cancelText: { color: t.text.muted, fontSize: 14 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    demoTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 },
    demoText: { color: t.accent.purple, fontSize: 12, fontWeight: '600' },
  }), [t]);

  const getTokenInfo = useCallback((symbol: string): TokenInfo | undefined => {
    return SUPPORTED_TOKENS.find((tok) => tok.symbol === symbol);
  }, []);

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: t.text.muted }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Watchlist</Text>
        <TouchableOpacity onPress={() => setShowAddToken(!showAddToken)}>
          <Text style={s.addBtnHeader}>{showAddToken ? 'Done' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {(demoMode || true) && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo Mode — Sample Prices</Text>
          </View>
        )}

        {/* Sort Options */}
        <View style={s.sortRow}>
          {([['custom', 'Custom'], ['change24h', '24h'], ['change7d', '7d'], ['price', 'Price']] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.sortChip, sortBy === key && s.sortChipActive]}
              onPress={() => setSortBy(key as SortBy)}
            >
              <Text style={[s.sortText, sortBy === key && s.sortTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Token Form */}
        {showAddToken && (
          <View style={s.addOverlay}>
            <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>
              Add Token to Watchlist
            </Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search tokens..."
              placeholderTextColor={t.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
              {availableTokens.map((tok) => (
                <View key={tok.symbol} style={s.addTokenRow}>
                  <View style={[s.tokenDot, { backgroundColor: tok.color + '30' }]}>
                    <Text style={{ color: tok.color, fontSize: 12, fontWeight: '800' }}>
                      {tok.symbol.slice(0, 2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={s.tokenSymbol}>{tok.symbol}</Text>
                    <Text style={s.tokenName}>{tok.name}</Text>
                  </View>
                  <TouchableOpacity style={s.addTokenBtn} onPress={() => addToWatchlist(tok.symbol)}>
                    <Text style={s.addTokenBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {availableTokens.length === 0 && (
                <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>
                  {searchQuery ? 'No matching tokens' : 'All tokens are in your watchlist'}
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Alert Form */}
        {alertSymbol && (
          <View style={s.alertForm}>
            <Text style={s.alertTitle}>Set Price Alert for {alertSymbol}</Text>
            <Text style={{ color: t.text.muted, fontSize: 12, marginBottom: 8 }}>
              Current: {fmtPrice(getPrice(alertSymbol))}
            </Text>
            <TextInput
              style={s.alertInput}
              placeholder="Target price (USD)"
              placeholderTextColor={t.text.muted}
              value={alertTarget}
              onChangeText={setAlertTarget}
              keyboardType="decimal-pad"
            />
            <View style={s.dirRow}>
              {(['above', 'below'] as const).map((dir) => (
                <TouchableOpacity
                  key={dir}
                  style={[s.dirChip, alertDirection === dir && s.dirActive]}
                  onPress={() => setAlertDirection(dir)}
                >
                  <Text style={[s.dirText, alertDirection === dir && s.dirTextActive]}>
                    {dir === 'above' ? 'Goes Above' : 'Goes Below'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.setAlertBtn} onPress={setAlert}>
              <Text style={s.setAlertText}>Set Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setAlertSymbol(null); setAlertTarget(''); }}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Watchlist */}
        {sortedWatchlist.length === 0 ? (
          <Text style={s.emptyText}>Your watchlist is empty. Tap "+ Add" to get started.</Text>
        ) : (
          <View style={s.card}>
            {sortedWatchlist.map((item, idx) => {
              const tokenInfo = getTokenInfo(item.symbol);
              const price = getPrice(item.symbol);
              const change24h = getChange24h(item.symbol);
              const change7d = getChange7d(item.symbol);
              const color = tokenInfo?.color ?? t.accent.green;

              return (
                <View key={item.symbol} style={s.tokenRow}>
                  <View style={[s.tokenDot, { backgroundColor: color + '30' }]}>
                    <Text style={{ color, fontSize: 12, fontWeight: '800' }}>
                      {item.symbol.slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tokenSymbol}>{item.symbol}</Text>
                    <Text style={s.tokenName}>{tokenInfo?.name ?? item.symbol}</Text>
                    {item.priceAlert && (
                      <TouchableOpacity style={s.alertBadge} onPress={() => removeAlert(item.symbol)}>
                        <Text style={s.alertBadgeText}>
                          Alert: {item.priceAlert.direction} ${item.priceAlert.target.toFixed(2)} x
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={s.priceCol}>
                    <Text style={s.priceText}>{fmtPrice(price)}</Text>
                    <View style={s.changeRow}>
                      <Text style={{ color: change24h >= 0 ? t.accent.green : t.accent.red, fontSize: 11, fontWeight: '600' }}>
                        24h: {fmtChange(change24h)}
                      </Text>
                      <Text style={{ color: change7d >= 0 ? t.accent.green : t.accent.red, fontSize: 11, fontWeight: '600' }}>
                        7d: {fmtChange(change7d)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.actionsRow}>
                    {sortBy === 'custom' && (
                      <>
                        <TouchableOpacity style={s.actionBtn} onPress={() => moveItem(item.symbol, 'up')}>
                          <Text style={s.actionText}>{idx > 0 ? '^' : ' '}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={() => moveItem(item.symbol, 'down')}>
                          <Text style={s.actionText}>{idx < sortedWatchlist.length - 1 ? 'v' : ' '}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity style={s.actionBtn} onPress={() => { setAlertSymbol(item.symbol); setAlertTarget(''); }}>
                      <Text style={{ fontSize: 14, color: t.accent.orange }}>!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} onPress={() => removeFromWatchlist(item.symbol)}>
                      <Text style={{ fontSize: 14, color: t.accent.red }}>x</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          Prices update with market data. Alerts are checked when the app is open.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
});
