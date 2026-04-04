import { fonts } from '../utils/theme';
/**
 * Token Swap History Screen — Full swap history across all 8 providers.
 * Filterable by provider, token pair, with volume stats and provider analytics.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'all' | 'by-provider' | 'stats';

interface Props { onClose: () => void }

const PROVIDERS = [
  'All', 'THORChain', '1inch', 'Jupiter', 'Osmosis',
  'DEX', 'Order Book', 'Atomic Swap', 'Li.Fi',
] as const;
type Provider = typeof PROVIDERS[number];

interface SwapRecord {
  id: string;
  date: string;
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  provider: string;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
  fee: string;
  savedVsAvg: string;
}

const DEMO_SWAPS: SwapRecord[] = [
  {
    id: 's1', date: 'Mar 29, 10:15', from: 'BTC', to: 'USDT', fromAmount: '0.05',
    toAmount: '4,225.00', provider: 'Atomic Swap', txHash: 'as1...7xk3',
    status: 'completed', fee: '$2.10', savedVsAvg: '+$3.40',
  },
  {
    id: 's2', date: 'Mar 28, 16:42', from: 'ETH', to: 'USDC', fromAmount: '1.2',
    toAmount: '3,840.00', provider: 'THORChain', txHash: '0xab...9e1f',
    status: 'completed', fee: '$11.52', savedVsAvg: '+$1.80',
  },
  {
    id: 's3', date: 'Mar 28, 09:30', from: 'SOL', to: 'USDC', fromAmount: '15.0',
    toAmount: '2,625.00', provider: 'Jupiter', txHash: '5Xkn...Gp2H',
    status: 'completed', fee: '$1.31', savedVsAvg: '+$0.95',
  },
  {
    id: 's4', date: 'Mar 27, 22:10', from: 'OTK', to: 'ATOM', fromAmount: '500',
    toAmount: '12.5', provider: 'DEX', txHash: 'otk1...m4v2',
    status: 'completed', fee: '$0.25', savedVsAvg: '+$0.10',
  },
  {
    id: 's5', date: 'Mar 27, 14:05', from: 'ATOM', to: 'OSMO', fromAmount: '20.0',
    toAmount: '240.0', provider: 'Osmosis', txHash: 'osmo1...q8p3',
    status: 'completed', fee: '$0.18', savedVsAvg: '+$0.42',
  },
  {
    id: 's6', date: 'Mar 26, 11:33', from: 'ETH', to: 'DAI', fromAmount: '0.5',
    toAmount: '1,598.50', provider: '1inch', txHash: '0xcd...2a3b',
    status: 'completed', fee: '$4.80', savedVsAvg: '+$2.15',
  },
  {
    id: 's7', date: 'Mar 25, 19:20', from: 'BTC', to: 'ETH', fromAmount: '0.1',
    toAmount: '2.64', provider: 'Order Book', txHash: 'ob1...hj92',
    status: 'completed', fee: '$3.50', savedVsAvg: '+$1.20',
  },
  {
    id: 's8', date: 'Mar 24, 08:45', from: 'USDC', to: 'SOL', fromAmount: '1,000.00',
    toAmount: '5.71', provider: 'Li.Fi', txHash: 'lifi...x4n7',
    status: 'completed', fee: '$2.00', savedVsAvg: '-$0.30',
  },
];

const TOKEN_PAIRS = ['All', 'BTC/USDT', 'ETH/USDC', 'SOL/USDC', 'OTK/ATOM', 'ATOM/OSMO', 'ETH/DAI', 'BTC/ETH', 'USDC/SOL'];

export function TokenSwapHistoryScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('all');
  const [filterProvider, setFilterProvider] = useState<string>('All');
  const [filterPair, setFilterPair] = useState<string>('All');

  const filteredSwaps = useMemo(() => {
    let swaps = DEMO_SWAPS;
    if (filterProvider !== 'All') {
      swaps = swaps.filter(s => s.provider === filterProvider);
    }
    if (filterPair !== 'All') {
      const [a, b] = filterPair.split('/');
      swaps = swaps.filter(s => s.from === a && s.to === b);
    }
    return swaps;
  }, [filterProvider, filterPair]);

  const totalVolume = useMemo(() => {
    const usdValues = DEMO_SWAPS.map(s => {
      const amt = parseFloat(s.toAmount.replace(/,/g, ''));
      if (s.to === 'USDT' || s.to === 'USDC' || s.to === 'DAI') return amt;
      // Rough conversion for demo
      if (s.to === 'ETH') return amt * 3200;
      if (s.to === 'SOL') return amt * 175;
      if (s.to === 'ATOM') return amt * 12;
      if (s.to === 'OSMO') return amt * 1.5;
      return amt;
    });
    return usdValues.reduce((sum, v) => sum + v, 0);
  }, []);

  const providerStats = useMemo(() => {
    const map: Record<string, { count: number; totalSaved: number }> = {};
    DEMO_SWAPS.forEach(s => {
      if (!map[s.provider]) map[s.provider] = { count: 0, totalSaved: 0 };
      map[s.provider].count++;
      const saved = parseFloat(s.savedVsAvg.replace(/[+$,]/g, ''));
      map[s.provider].totalSaved += saved;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, avgSaved: data.totalSaved / data.count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    placeholder: { width: 60 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontWeight: fonts.bold },
    sectionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: t.bg.card },
    filterChipActive: { backgroundColor: t.accent.purple },
    filterText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: '#fff', fontWeight: fonts.bold },
    // Volume summary
    volumeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
    volumeLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    volumeValue: { color: t.accent.green, fontSize: fonts.xxxl, fontWeight: fonts.heavy, marginTop: 4 },
    volumeCount: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    // Swap cards
    swapCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    swapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    swapRoute: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    swapAmount: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    swapDate: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 6 },
    swapRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
    swapLabel: { color: t.text.muted, fontSize: fonts.xs },
    swapValue: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    hashText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.medium },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    statusCompleted: { backgroundColor: t.accent.green + '20' },
    statusPending: { backgroundColor: (t.accent.orange || '#f0a030') + '20' },
    statusFailed: { backgroundColor: '#ff444420' },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    statusTextCompleted: { color: t.accent.green },
    statusTextPending: { color: t.accent.orange || '#f0a030' },
    statusTextFailed: { color: '#ff4444' },
    savedText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    savedNeg: { color: '#ff4444' },
    // Provider section
    providerGroup: { marginBottom: 16 },
    providerGroupTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 8 },
    providerGroupCount: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Stats
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    statsName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    statsCount: { color: t.accent.purple, fontSize: fonts.md, fontWeight: fonts.heavy },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    statsLabel: { color: t.text.muted, fontSize: fonts.sm },
    statsValue: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    barContainer: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 8 },
    barFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.purple },
    mostUsedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    mostUsedText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    demoTag: { color: t.accent.orange || '#f0a030', fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All Swaps' },
    { key: 'by-provider', label: 'By Provider' },
    { key: 'stats', label: 'Stats' },
  ];

  const getStatusStyle = (status: SwapRecord['status']) => {
    if (status === 'completed') return { badge: s.statusCompleted, text: s.statusTextCompleted };
    if (status === 'pending') return { badge: s.statusPending, text: s.statusTextPending };
    return { badge: s.statusFailed, text: s.statusTextFailed };
  };

  const renderSwapCard = (swap: SwapRecord) => {
    const st = getStatusStyle(swap.status);
    const savedPositive = swap.savedVsAvg.startsWith('+');
    return (
      <View key={swap.id} style={s.swapCard}>
        <View style={s.swapHeader}>
          <Text style={s.swapRoute}>{swap.from} {'\u2192'} {swap.to}</Text>
          <Text style={s.swapAmount}>{swap.fromAmount} {swap.from}</Text>
        </View>
        <Text style={s.swapDate}>{swap.date}</Text>
        <View style={s.swapRow}>
          <Text style={s.swapLabel}>Received</Text>
          <Text style={s.swapValue}>{swap.toAmount} {swap.to}</Text>
        </View>
        <View style={s.swapRow}>
          <Text style={s.swapLabel}>Provider</Text>
          <Text style={s.swapValue}>{swap.provider}</Text>
        </View>
        <View style={s.swapRow}>
          <Text style={s.swapLabel}>Fee</Text>
          <Text style={s.swapValue}>{swap.fee}</Text>
        </View>
        <View style={s.swapRow}>
          <Text style={s.swapLabel}>Tx Hash</Text>
          <Text style={s.hashText}>{swap.txHash}</Text>
        </View>
        <View style={s.swapRow}>
          <Text style={s.swapLabel}>Saved vs Avg</Text>
          <Text style={[s.savedText, !savedPositive && s.savedNeg]}>{swap.savedVsAvg}</Text>
        </View>
        <View style={[s.statusBadge, st.badge]}>
          <Text style={[s.statusText, st.text]}>{swap.status.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  const renderAllTab = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      {demoMode && <Text style={s.demoTag}>DEMO MODE</Text>}

      <View style={s.volumeCard}>
        <Text style={s.volumeLabel}>Total Volume Traded</Text>
        <Text style={s.volumeValue}>${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        <Text style={s.volumeCount}>{DEMO_SWAPS.length} swaps across {providerStats.length} providers</Text>
      </View>

      <Text style={s.sectionLabel}>Filter by Provider</Text>
      <View style={s.filterRow}>
        {PROVIDERS.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.filterChip, filterProvider === p && s.filterChipActive]}
            onPress={() => setFilterProvider(p)}
          >
            <Text style={[s.filterText, filterProvider === p && s.filterTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Filter by Pair</Text>
      <View style={s.filterRow}>
        {TOKEN_PAIRS.map(pair => (
          <TouchableOpacity
            key={pair}
            style={[s.filterChip, filterPair === pair && s.filterChipActive]}
            onPress={() => setFilterPair(pair)}
          >
            <Text style={[s.filterText, filterPair === pair && s.filterTextActive]}>{pair}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Swaps ({filteredSwaps.length})</Text>
      {filteredSwaps.map(renderSwapCard)}
      {filteredSwaps.length === 0 && (
        <Text style={s.emptyText}>No swaps match filters</Text>
      )}
    </ScrollView>
  );

  const renderByProviderTab = () => {
    const grouped: Record<string, SwapRecord[]> = {};
    DEMO_SWAPS.forEach(sw => {
      if (!grouped[sw.provider]) grouped[sw.provider] = [];
      grouped[sw.provider].push(sw);
    });

    return (
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([provider, swaps]) => (
          <View key={provider} style={s.providerGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={s.providerGroupTitle}>{provider}</Text>
              <Text style={s.providerGroupCount}>{swaps.length} swap{swaps.length > 1 ? 's' : ''}</Text>
            </View>
            {swaps.map(renderSwapCard)}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStatsTab = () => {
    const maxCount = Math.max(...providerStats.map(p => p.count));
    const totalFees = DEMO_SWAPS.reduce((sum, sw) => sum + parseFloat(sw.fee.replace(/[$,]/g, '')), 0);
    const totalSaved = DEMO_SWAPS.reduce((sum, sw) => sum + parseFloat(sw.savedVsAvg.replace(/[+$,]/g, '')), 0);

    return (
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.volumeCard}>
          <Text style={s.volumeLabel}>Total Volume</Text>
          <Text style={s.volumeValue}>${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={[s.statsCard, { flex: 1 }]}>
            <Text style={s.statsLabel}>Total Fees</Text>
            <Text style={[s.statsValue, { fontSize: fonts.xl, fontWeight: fonts.heavy }]}>${totalFees.toFixed(2)}</Text>
          </View>
          <View style={[s.statsCard, { flex: 1 }]}>
            <Text style={s.statsLabel}>Net Savings</Text>
            <Text style={[s.savedText, { fontSize: fonts.xl, fontWeight: fonts.heavy }]}>+${totalSaved.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Provider Usage</Text>
        {providerStats.map((ps, idx) => (
          <View key={ps.name} style={s.statsCard}>
            <View style={s.statsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.statsName}>{ps.name}</Text>
                {idx === 0 && (
                  <View style={s.mostUsedBadge}>
                    <Text style={s.mostUsedText}>MOST USED</Text>
                  </View>
                )}
              </View>
              <Text style={s.statsCount}>{ps.count} swap{ps.count > 1 ? 's' : ''}</Text>
            </View>
            <View style={s.barContainer}>
              <View style={[s.barFill, { width: `${(ps.count / maxCount) * 100}%` }]} />
            </View>
            <View style={s.statsRow}>
              <Text style={s.statsLabel}>Avg Saved vs Market</Text>
              <Text style={[s.savedText, ps.avgSaved < 0 && s.savedNeg]}>
                {ps.avgSaved >= 0 ? '+' : ''}${ps.avgSaved.toFixed(2)}
              </Text>
            </View>
            <View style={s.statsRow}>
              <Text style={s.statsLabel}>Total Saved</Text>
              <Text style={[s.savedText, ps.totalSaved < 0 && s.savedNeg]}>
                {ps.totalSaved >= 0 ? '+' : ''}${ps.totalSaved.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Swap History</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.tabRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'all' && renderAllTab()}
      {tab === 'by-provider' && renderByProviderTab()}
      {tab === 'stats' && renderStatsTab()}
    </SafeAreaView>
  );
}
