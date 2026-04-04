import { fonts } from '../utils/theme';
/**
 * Price Chart -- Detailed price charts for any token.
 * Token selector, time ranges, ASCII bar chart, price alerts, market info.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, TextInput,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

type Tab = 'chart' | 'info' | 'alerts';
type TimeRange = '1H' | '24H' | '7D' | '30D' | '90D' | '1Y' | 'All';

// ─── Token data ───

interface TokenMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  rank: number;
  priceHistory: Record<TimeRange, number[]>;
}

const DEMO_TOKENS: TokenMarketData[] = [
  {
    symbol: 'BTC', name: 'Bitcoin', price: 62450, change24h: 3.2,
    high24h: 63100, low24h: 60800, volume24h: 28_500_000_000,
    marketCap: 1_225_000_000_000, circulatingSupply: 19_620_000, rank: 1,
    priceHistory: {
      '1H':  [62300, 62350, 62280, 62400, 62380, 62450],
      '24H': [60800, 61200, 61500, 61800, 62100, 62000, 62300, 62450],
      '7D':  [59800, 60200, 61000, 60500, 61500, 62000, 62450],
      '30D': [58000, 57500, 59000, 60000, 58500, 61000, 60500, 62000, 62450],
      '90D': [52000, 54000, 56000, 55000, 58000, 57000, 60000, 61000, 62450],
      '1Y':  [42000, 45000, 48000, 52000, 50000, 55000, 58000, 60000, 62450],
      'All': [30000, 35000, 42000, 48000, 55000, 52000, 58000, 60000, 62450],
    },
  },
  {
    symbol: 'ETH', name: 'Ethereum', price: 3380, change24h: 1.8,
    high24h: 3420, low24h: 3310, volume24h: 14_200_000_000,
    marketCap: 406_000_000_000, circulatingSupply: 120_200_000, rank: 2,
    priceHistory: {
      '1H':  [3360, 3365, 3370, 3375, 3378, 3380],
      '24H': [3310, 3330, 3350, 3340, 3360, 3370, 3380],
      '7D':  [3200, 3250, 3280, 3300, 3340, 3360, 3380],
      '30D': [3000, 3050, 3100, 3150, 3200, 3250, 3300, 3350, 3380],
      '90D': [2800, 2900, 3000, 3050, 3100, 3200, 3300, 3380],
      '1Y':  [2200, 2400, 2600, 2800, 3000, 3200, 3380],
      'All': [1800, 2000, 2400, 2800, 3000, 3200, 3380],
    },
  },
  {
    symbol: 'SOL', name: 'Solana', price: 148.5, change24h: -0.9,
    high24h: 152, low24h: 146, volume24h: 2_800_000_000,
    marketCap: 67_000_000_000, circulatingSupply: 451_000_000, rank: 5,
    priceHistory: {
      '1H':  [149, 148.8, 148.5, 148.7, 148.3, 148.5],
      '24H': [150, 151, 149, 148, 149, 148.5],
      '7D':  [142, 144, 146, 148, 150, 149, 148.5],
      '30D': [130, 135, 140, 138, 142, 145, 148, 148.5],
      '90D': [100, 110, 120, 130, 140, 145, 148.5],
      '1Y':  [60, 80, 100, 120, 130, 140, 148.5],
      'All': [30, 50, 80, 100, 130, 140, 148.5],
    },
  },
  {
    symbol: 'OTK', name: 'Open Token', price: 0.85, change24h: 5.6,
    high24h: 0.88, low24h: 0.80, volume24h: 12_500_000,
    marketCap: 85_000_000, circulatingSupply: 100_000_000, rank: 285,
    priceHistory: {
      '1H':  [0.83, 0.84, 0.84, 0.85, 0.85, 0.85],
      '24H': [0.80, 0.81, 0.82, 0.83, 0.84, 0.85],
      '7D':  [0.72, 0.75, 0.78, 0.80, 0.82, 0.84, 0.85],
      '30D': [0.55, 0.60, 0.65, 0.68, 0.72, 0.78, 0.82, 0.85],
      '90D': [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.85],
      '1Y':  [0.10, 0.20, 0.35, 0.50, 0.65, 0.78, 0.85],
      'All': [0.05, 0.10, 0.25, 0.45, 0.60, 0.75, 0.85],
    },
  },
  {
    symbol: 'ATOM', name: 'Cosmos', price: 8.92, change24h: 2.1,
    high24h: 9.10, low24h: 8.70, volume24h: 320_000_000,
    marketCap: 3_400_000_000, circulatingSupply: 381_000_000, rank: 32,
    priceHistory: {
      '1H':  [8.85, 8.88, 8.90, 8.89, 8.91, 8.92],
      '24H': [8.70, 8.75, 8.80, 8.85, 8.90, 8.92],
      '7D':  [8.20, 8.40, 8.50, 8.60, 8.75, 8.85, 8.92],
      '30D': [7.50, 7.80, 8.00, 8.20, 8.40, 8.60, 8.80, 8.92],
      '90D': [6.50, 7.00, 7.50, 8.00, 8.50, 8.80, 8.92],
      '1Y':  [5.00, 6.00, 7.00, 7.50, 8.00, 8.50, 8.92],
      'All': [3.00, 5.00, 6.50, 7.50, 8.00, 8.50, 8.92],
    },
  },
  {
    symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.0,
    high24h: 1.001, low24h: 0.999, volume24h: 52_000_000_000,
    marketCap: 110_000_000_000, circulatingSupply: 110_000_000_000, rank: 3,
    priceHistory: {
      '1H':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '24H': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '7D':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '30D': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '90D': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '1Y':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      'All': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    },
  },
  {
    symbol: 'USDC', name: 'USD Coin', price: 1.00, change24h: 0.0,
    high24h: 1.001, low24h: 0.999, volume24h: 8_200_000_000,
    marketCap: 33_000_000_000, circulatingSupply: 33_000_000_000, rank: 7,
    priceHistory: {
      '1H':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '24H': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '7D':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '30D': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '90D': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      '1Y':  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
      'All': [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    },
  },
];

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff',
  OTK: '#22c55e', ATOM: '#6f7390', USDT: '#26a17b',
  USDC: '#2775ca',
};

const TIME_RANGES: TimeRange[] = ['1H', '24H', '7D', '30D', '90D', '1Y', 'All'];

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  active: boolean;
}

// ─── ASCII Bar Chart ───

function AsciiBarChart({ data, color, theme }: {
  data: number[];
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const barCount = data.length;
  const maxBarHeight = 120;

  return (
    <View style={{ marginVertical: 16 }}>
      {/* Y-axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: theme.text.muted, fontSize: 10 }}>
          {max >= 1000 ? `$${(max / 1000).toFixed(1)}k` : `$${max.toFixed(2)}`}
        </Text>
        <Text style={{ color: theme.text.muted, fontSize: 10 }}>High</Text>
      </View>

      {/* Bars */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end',
        height: maxBarHeight, gap: barCount > 8 ? 2 : 4,
        paddingHorizontal: 4,
      }}>
        {data.map((value, i) => {
          const height = ((value - min) / range) * (maxBarHeight - 20) + 20;
          const isLast = i === data.length - 1;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height,
                backgroundColor: isLast ? color : color + '80',
                borderRadius: 4,
                minWidth: 6,
              }}
            />
          );
        })}
      </View>

      {/* X-axis / low label */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: theme.text.muted, fontSize: 10 }}>
          {min >= 1000 ? `$${(min / 1000).toFixed(1)}k` : `$${min.toFixed(2)}`}
        </Text>
        <Text style={{ color: theme.text.muted, fontSize: 10 }}>Low</Text>
      </View>
    </View>
  );
}

// ─── Main screen ───

export function PriceChartScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('chart');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: '1', symbol: 'BTC', targetPrice: 65000, direction: 'above', active: true },
    { id: '2', symbol: 'ETH', targetPrice: 3000, direction: 'below', active: true },
  ]);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertDirection, setNewAlertDirection] = useState<'above' | 'below'>('above');

  const token = useMemo(() => {
    return DEMO_TOKENS.find((tk) => tk.symbol === selectedSymbol) ?? DEMO_TOKENS[0];
  }, [selectedSymbol]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    // Token selector
    tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingHorizontal: 16 },
    tokenChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: t.bg.card },
    tokenChipActive: { backgroundColor: t.accent.blue },
    tokenChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.bold },
    tokenChipTextActive: { color: '#fff' },
    // Tabs
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 6 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase' },
    tabTextActive: { color: '#fff' },
    // Time range
    timeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    timeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    timeBtnActive: { backgroundColor: t.accent.blue + '30' },
    timeBtnText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold },
    timeBtnTextActive: { color: t.accent.blue },
    // Price display
    priceCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    priceMain: { color: t.text.primary, fontSize: 32, fontWeight: fonts.heavy },
    priceChange: { fontSize: 16, fontWeight: fonts.bold, marginTop: 4 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    priceStat: { alignItems: 'center' },
    priceStatLabel: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    priceStatValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    // Chart area
    chartCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    // Section
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    metricLabel: { color: t.text.muted, fontSize: 14 },
    metricValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border },
    // Alerts
    alertCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    alertMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    alertToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    alertToggleText: { fontSize: 12, fontWeight: fonts.bold },
    // New alert
    newAlertRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    alertInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: t.text.primary, fontSize: 14 },
    directionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.primary },
    directionBtnActive: { backgroundColor: t.accent.blue + '30' },
    directionBtnText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    directionBtnTextActive: { color: t.accent.blue },
    addAlertBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
    addAlertBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    demoBanner: { backgroundColor: t.accent.yellow + '20', borderRadius: 12, padding: 12, marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 13, fontWeight: fonts.semibold, textAlign: 'center' },
    placeholder: { color: t.text.muted, fontSize: 14 },
  }), [t]);

  const formatUsd = (v: number) => {
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${v.toFixed(v < 1 ? 4 : 2)}`;
  };

  const formatSupply = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    return v.toLocaleString('en-US');
  };

  const changeColor = token.change24h >= 0 ? t.accent.green : t.accent.red;
  const chartColor = TOKEN_COLORS[token.symbol] ?? t.accent.blue;
  const priceData = token.priceHistory[timeRange] ?? [];

  const addAlert = useCallback(() => {
    const price = parseFloat(newAlertPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Enter a valid price for the alert.');
      return;
    }
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      targetPrice: price,
      direction: newAlertDirection,
      active: true,
    };
    setAlerts((prev) => [...prev, newAlert]);
    setNewAlertPrice('');
  }, [newAlertPrice, newAlertDirection, selectedSymbol]);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ─── Token selector ───

  const renderTokenSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {DEMO_TOKENS.map((tk) => (
        <TouchableOpacity
          key={tk.symbol}
          style={[s.tokenChip, selectedSymbol === tk.symbol && s.tokenChipActive]}
          onPress={() => setSelectedSymbol(tk.symbol)}
        >
          <Text style={[s.tokenChipText, selectedSymbol === tk.symbol && s.tokenChipTextActive]}>
            {tk.symbol}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ─── Tab bar ───

  const renderTabBar = () => (
    <View style={s.tabRow}>
      {(['chart', 'info', 'alerts'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[s.tab, activeTab === tab && s.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
            {tab === 'chart' ? 'Chart' : tab === 'info' ? 'Info' : 'Alerts'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Chart tab ───

  const renderChart = () => (
    <>
      {/* Price display */}
      <View style={s.priceCard}>
        <Text style={{ color: t.text.muted, fontSize: 14, marginBottom: 4 }}>
          {token.name} ({token.symbol})
        </Text>
        <Text style={s.priceMain}>{formatUsd(token.price)}</Text>
        <Text style={[s.priceChange, { color: changeColor }]}>
          {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}% (24h)
        </Text>
        <View style={s.priceRow}>
          <View style={s.priceStat}>
            <Text style={s.priceStatLabel}>24h High</Text>
            <Text style={s.priceStatValue}>{formatUsd(token.high24h)}</Text>
          </View>
          <View style={s.priceStat}>
            <Text style={s.priceStatLabel}>24h Low</Text>
            <Text style={s.priceStatValue}>{formatUsd(token.low24h)}</Text>
          </View>
          <View style={s.priceStat}>
            <Text style={s.priceStatLabel}>Volume</Text>
            <Text style={s.priceStatValue}>{formatUsd(token.volume24h)}</Text>
          </View>
        </View>
      </View>

      {/* Time range selector */}
      <View style={s.timeRow}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range}
            style={[s.timeBtn, timeRange === range && s.timeBtnActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[s.timeBtnText, timeRange === range && s.timeBtnTextActive]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price chart */}
      <View style={s.chartCard}>
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 4 }}>
          {token.symbol} Price -- {timeRange}
        </Text>
        {priceData.length > 0 ? (
          <AsciiBarChart data={priceData} color={chartColor} theme={t} />
        ) : (
          <Text style={s.placeholder}>No data available for this range.</Text>
        )}
      </View>
    </>
  );

  // ─── Info tab ───

  const renderInfo = () => {
    const metrics = [
      { label: 'Market Cap', value: formatUsd(token.marketCap) },
      { label: 'Circulating Supply', value: formatSupply(token.circulatingSupply) },
      { label: 'Market Cap Rank', value: `#${token.rank}` },
      { label: '24h Volume', value: formatUsd(token.volume24h) },
      { label: '24h High', value: formatUsd(token.high24h) },
      { label: '24h Low', value: formatUsd(token.low24h) },
      { label: '24h Change', value: `${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}%` },
      { label: 'Volume / Market Cap', value: ((token.volume24h / token.marketCap) * 100).toFixed(2) + '%' },
    ];

    return (
      <>
        <Text style={s.sectionLabel}>Market Data -- {token.name}</Text>
        <View style={s.card}>
          {metrics.map((m, i) => (
            <View key={m.label}>
              <View style={s.metricRow}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={[s.metricValue, m.label === '24h Change' && { color: changeColor }]}>
                  {m.value}
                </Text>
              </View>
              {i < metrics.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>About {token.name}</Text>
        <View style={s.card}>
          <Text style={{ color: t.text.secondary, fontSize: 14, lineHeight: 20 }}>
            {token.symbol === 'BTC' && 'Bitcoin is a decentralized digital currency. It is the first and most well-known cryptocurrency, operating on a peer-to-peer network using proof-of-work consensus.'}
            {token.symbol === 'ETH' && 'Ethereum is a decentralized platform that enables smart contracts and decentralized applications. It uses proof-of-stake consensus and supports the ERC-20 token standard.'}
            {token.symbol === 'SOL' && 'Solana is a high-performance blockchain supporting fast, low-cost transactions. It uses proof-of-history combined with proof-of-stake for consensus.'}
            {token.symbol === 'OTK' && 'Open Token is the native token of Open Chain, representing human value contributions. It uses Proof-of-Humanity and Proof-of-Contribution consensus -- one human, one vote.'}
            {token.symbol === 'ATOM' && 'Cosmos is an ecosystem of interconnected blockchains using the Inter-Blockchain Communication (IBC) protocol for cross-chain interoperability.'}
            {token.symbol === 'USDT' && 'Tether (USDT) is a stablecoin pegged 1:1 to the US dollar. It is the most widely used stablecoin across multiple blockchain networks.'}
            {token.symbol === 'USDC' && 'USD Coin (USDC) is a fully-reserved stablecoin issued by Circle, pegged 1:1 to the US dollar with regular attestation of reserves.'}
          </Text>
        </View>
      </>
    );
  };

  // ─── Alerts tab ───

  const renderAlerts = () => {
    const tokenAlerts = alerts.filter((a) => a.symbol === selectedSymbol);
    return (
      <>
        <Text style={s.sectionLabel}>Price Alerts -- {token.symbol}</Text>

        {tokenAlerts.length === 0 ? (
          <View style={s.card}>
            <Text style={s.placeholder}>No alerts set for {token.symbol}. Add one below.</Text>
          </View>
        ) : (
          tokenAlerts.map((alert) => (
            <View key={alert.id} style={s.alertCard}>
              <View style={s.alertRow}>
                <View>
                  <Text style={s.alertText}>
                    {alert.direction === 'above' ? 'Price above' : 'Price below'} {formatUsd(alert.targetPrice)}
                  </Text>
                  <Text style={s.alertMeta}>
                    Current: {formatUsd(token.price)} -- {alert.active ? 'Active' : 'Paused'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[s.alertToggle, { backgroundColor: alert.active ? t.accent.green + '20' : t.bg.primary }]}
                    onPress={() => toggleAlert(alert.id)}
                  >
                    <Text style={[s.alertToggleText, { color: alert.active ? t.accent.green : t.text.muted }]}>
                      {alert.active ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.alertToggle, { backgroundColor: t.accent.red + '20' }]}
                    onPress={() => removeAlert(alert.id)}
                  >
                    <Text style={[s.alertToggleText, { color: t.accent.red }]}>DEL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={s.sectionLabel}>New Alert</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              style={[s.directionBtn, newAlertDirection === 'above' && s.directionBtnActive]}
              onPress={() => setNewAlertDirection('above')}
            >
              <Text style={[s.directionBtnText, newAlertDirection === 'above' && s.directionBtnTextActive]}>
                Above
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.directionBtn, newAlertDirection === 'below' && s.directionBtnActive]}
              onPress={() => setNewAlertDirection('below')}
            >
              <Text style={[s.directionBtnText, newAlertDirection === 'below' && s.directionBtnTextActive]}>
                Below
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.newAlertRow}>
            <TextInput
              style={s.alertInput}
              placeholder={`Target price (${token.symbol})`}
              placeholderTextColor={t.text.muted}
              value={newAlertPrice}
              onChangeText={setNewAlertPrice}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={s.addAlertBtn} onPress={addAlert}>
              <Text style={s.addAlertBtnText}>Set Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>Close</Text>
        </TouchableOpacity>
        <Text style={s.title}>Price Chart</Text>
        <View style={{ width: 50 }} />
      </View>

      {renderTokenSelector()}
      {renderTabBar()}

      <ScrollView contentContainerStyle={s.scroll}>
        {demoMode && (
          <View style={s.demoBanner}>
            <Text style={s.demoText}>Demo Mode -- Simulated market data</Text>
          </View>
        )}

        {activeTab === 'chart' && renderChart()}
        {activeTab === 'info' && renderInfo()}
        {activeTab === 'alerts' && renderAlerts()}
      </ScrollView>
    </SafeAreaView>
  );
}
