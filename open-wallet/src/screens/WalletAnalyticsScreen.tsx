import { fonts } from '../utils/theme';
/**
 * Wallet Analytics — Deep analytics about wallet activity across all chains.
 * Transaction breakdowns, gas analysis, frequency trends, and usage patterns.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Types ───

interface AnalyticsData {
  totalTransactions: number;
  byType: { type: string; count: number; pct: number }[];
  mostTransactedToken: { symbol: string; count: number; volume: number };
  mostUsedChain: { name: string; count: number };
  avgTransactionSize: number;
  busiestDay: string;
  busiestHour: string;
  frequencyTrend: { period: string; count: number }[];
  gasSummary: { chain: string; totalFees: number; avgFee: number; txCount: number }[];
  totalGasSpent: number;
}

// ─── Demo Data ───

function generateDemoAnalytics(): AnalyticsData {
  const byType = [
    { type: 'Sends', count: 45, pct: 28 },
    { type: 'Receives', count: 62, pct: 38 },
    { type: 'Swaps', count: 35, pct: 22 },
    { type: 'Bridges', count: 12, pct: 7 },
    { type: 'Stakes', count: 8, pct: 5 },
  ];

  const frequencyTrend = [
    { period: 'Week 1', count: 12 },
    { period: 'Week 2', count: 18 },
    { period: 'Week 3', count: 8 },
    { period: 'Week 4', count: 22 },
    { period: 'Week 5', count: 15 },
    { period: 'Week 6', count: 28 },
    { period: 'Week 7', count: 20 },
    { period: 'Week 8', count: 25 },
  ];

  const gasSummary = [
    { chain: 'Ethereum', totalFees: 142.50, avgFee: 3.56, txCount: 40 },
    { chain: 'Solana', totalFees: 1.25, avgFee: 0.0025, txCount: 50 },
    { chain: 'Bitcoin', totalFees: 28.40, avgFee: 1.42, txCount: 20 },
    { chain: 'Polygon', totalFees: 0.85, avgFee: 0.012, txCount: 30 },
    { chain: 'Avalanche', totalFees: 4.20, avgFee: 0.21, txCount: 22 },
  ];

  return {
    totalTransactions: 162,
    byType,
    mostTransactedToken: { symbol: 'ETH', count: 48, volume: 125400 },
    mostUsedChain: { name: 'Ethereum', count: 65 },
    avgTransactionSize: 842.50,
    busiestDay: 'Wednesday',
    busiestHour: '2:00 PM - 3:00 PM',
    frequencyTrend,
    gasSummary,
    totalGasSpent: gasSummary.reduce((sum, g) => sum + g.totalFees, 0),
  };
}

// ─── Bar Visualization ───

function HorizontalBar({ label, value, maxValue, color, theme }: {
  label: string; value: number; maxValue: number; color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Text style={{ color: theme.text.secondary, fontSize: fonts.sm, width: 70, textAlign: 'right' }}>{label}</Text>
      <View style={{ flex: 1, height: 22, backgroundColor: theme.border, borderRadius: 6, overflow: 'hidden' }}>
        <View style={{
          width: `${Math.max(pct, 2)}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 6,
          justifyContent: 'center',
          paddingLeft: 6,
        }}>
          {pct >= 12 && (
            <Text style={{ color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold }}>{value}</Text>
          )}
        </View>
      </View>
      {pct < 12 && (
        <Text style={{ color: theme.text.muted, fontSize: fonts.xs }}>{value}</Text>
      )}
    </View>
  );
}

// ─── Component ───

export const WalletAnalyticsScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'all'>('90d');

  const data = useMemo(() => generateDemoAnalytics(), []);

  const typeColors = [t.accent.blue, t.accent.green, t.accent.purple, t.accent.orange, t.accent.yellow];
  const chainColors = [t.accent.blue, t.accent.purple, t.accent.orange, t.accent.green, t.accent.red];

  const maxByType = Math.max(...data.byType.map((b) => b.count));
  const maxTrend = Math.max(...data.frequencyTrend.map((f) => f.count));
  const maxGas = Math.max(...data.gasSummary.map((g) => g.totalFees));

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    label: { color: t.text.secondary, fontSize: fonts.md },
    value: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    valueGreen: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    highlightCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '25' },
    bigNum: { color: t.accent.green, fontSize: fonts.xxxl, fontWeight: fonts.heavy },
    bigLabel: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.border },
    chipActive: { backgroundColor: t.accent.green },
    chipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    chipTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statBox: { flex: 1, minWidth: '45%' as unknown as number, backgroundColor: t.bg.card, borderRadius: 14, padding: 14 },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 6 },
    gasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    gasChain: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, width: 80 },
    gasFee: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold, width: 70, textAlign: 'right' },
    gasAvg: { color: t.text.muted, fontSize: fonts.sm, width: 70, textAlign: 'right' },
    gasTxCount: { color: t.text.secondary, fontSize: fonts.sm, width: 40, textAlign: 'right' },
    demoTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 },
    demoText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Wallet Analytics</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {(demoMode || true) && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo Mode — Sample Data</Text>
          </View>
        )}

        {/* Timeframe */}
        <View style={s.chipRow}>
          {([['30d', '30 Days'], ['90d', '90 Days'], ['all', 'All Time']] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.chip, timeframe === key && s.chipActive]}
              onPress={() => setTimeframe(key as typeof timeframe)}
            >
              <Text style={[s.chipText, timeframe === key && s.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview */}
        <View style={s.highlightCard}>
          <Text style={s.bigNum}>{data.totalTransactions}</Text>
          <Text style={s.bigLabel}>Total Transactions</Text>
        </View>

        {/* Stat Grid */}
        <View style={s.statGrid}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{data.mostTransactedToken.symbol}</Text>
            <Text style={s.statLabel}>Most Transacted Token</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs }}>{data.mostTransactedToken.count} txs</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{data.mostUsedChain.name}</Text>
            <Text style={s.statLabel}>Most Used Chain</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs }}>{data.mostUsedChain.count} txs</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>${data.avgTransactionSize.toFixed(0)}</Text>
            <Text style={s.statLabel}>Avg Transaction Size</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>${data.totalGasSpent.toFixed(2)}</Text>
            <Text style={s.statLabel}>Total Gas Spent</Text>
          </View>
        </View>

        {/* Transactions by Type */}
        <Text style={s.section}>Transactions by Type</Text>
        <View style={s.card}>
          {data.byType.map((item, idx) => (
            <HorizontalBar
              key={item.type}
              label={item.type}
              value={item.count}
              maxValue={maxByType}
              color={typeColors[idx % typeColors.length]}
              theme={t}
            />
          ))}
        </View>

        {/* Activity Patterns */}
        <Text style={s.section}>Activity Patterns</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>Busiest Day</Text>
            <Text style={s.value}>{data.busiestDay}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.label}>Peak Hours</Text>
            <Text style={s.value}>{data.busiestHour}</Text>
          </View>
        </View>

        {/* Frequency Trend */}
        <Text style={s.section}>Weekly Frequency Trend</Text>
        <View style={s.card}>
          {data.frequencyTrend.map((item, idx) => (
            <HorizontalBar
              key={item.period}
              label={item.period}
              value={item.count}
              maxValue={maxTrend}
              color={t.accent.blue}
              theme={t}
            />
          ))}
        </View>

        {/* Gas Summary */}
        <Text style={s.section}>Gas Fees by Chain</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, width: 80 }}>Chain</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, width: 70, textAlign: 'right' }}>Total</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, width: 70, textAlign: 'right' }}>Avg</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, flex: 1, textAlign: 'right' }}>TXs</Text>
          </View>
          {data.gasSummary.map((gas, idx) => (
            <View key={gas.chain} style={s.gasRow}>
              <Text style={s.gasChain}>{gas.chain}</Text>
              <Text style={s.gasFee}>${gas.totalFees.toFixed(2)}</Text>
              <Text style={s.gasAvg}>${gas.avgFee.toFixed(4)}</Text>
              <Text style={s.gasTxCount}>{gas.txCount}</Text>
            </View>
          ))}
          <View style={[s.divider, { marginTop: 8 }]} />
          <View style={[s.row, { paddingTop: 10 }]}>
            <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold }}>Total Gas Spent</Text>
            <Text style={{ color: t.accent.orange, fontSize: fonts.lg, fontWeight: fonts.heavy }}>
              ${data.totalGasSpent.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Gas Visualization */}
        <Text style={s.section}>Gas Distribution</Text>
        <View style={s.card}>
          {data.gasSummary.map((gas, idx) => (
            <HorizontalBar
              key={gas.chain}
              label={gas.chain}
              value={Math.round(gas.totalFees * 100) / 100}
              maxValue={maxGas}
              color={chainColors[idx % chainColors.length]}
              theme={t}
            />
          ))}
        </View>

        <Text style={{ color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          Analytics are based on on-chain transaction history.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
});
