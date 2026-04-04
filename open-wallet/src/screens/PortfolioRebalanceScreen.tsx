import { fonts } from '../utils/theme';
/**
 * Portfolio Rebalance -- Suggest and execute rebalancing across chains.
 * Current vs target allocation, drift analysis, rebalance preview, execution.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

type Tab = 'current' | 'target' | 'rebalance' | 'history';

// ─── Token color map ───

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff',
  OTK: '#22c55e', USDT: '#26a17b', USDC: '#2775ca',
  ATOM: '#6f7390', ADA: '#0033ad', DOT: '#e6007a',
};

// ─── Demo data ───

interface Allocation {
  symbol: string;
  pct: number;
  usdValue: number;
}

const DEMO_TOTAL_VALUE = 50000;

const DEMO_CURRENT: Allocation[] = [
  { symbol: 'BTC',  pct: 40, usdValue: 20000 },
  { symbol: 'ETH',  pct: 25, usdValue: 12500 },
  { symbol: 'OTK',  pct: 20, usdValue: 10000 },
  { symbol: 'SOL',  pct: 10, usdValue: 5000 },
  { symbol: 'USDT', pct: 5,  usdValue: 2500 },
];

const DEFAULT_TARGETS: Record<string, number> = {
  BTC: 35, ETH: 25, OTK: 25, SOL: 10, USDT: 5,
};

interface Trade {
  symbol: string;
  action: 'BUY' | 'SELL';
  amountUsd: number;
  fromPct: number;
  toPct: number;
}

interface HistoryEntry {
  id: string;
  date: string;
  trades: number;
  totalMoved: number;
  status: 'completed' | 'partial' | 'failed';
}

const DEMO_HISTORY: HistoryEntry[] = [
  { id: '1', date: '2026-03-15', trades: 4, totalMoved: 3200, status: 'completed' },
  { id: '2', date: '2026-02-28', trades: 2, totalMoved: 1800, status: 'completed' },
  { id: '3', date: '2026-02-10', trades: 3, totalMoved: 2500, status: 'partial' },
];

// ─── Bar component ───

function AllocationBar({ items, theme }: {
  items: { symbol: string; pct: number }[];
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item.symbol} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.text.secondary, fontSize: fonts.sm, width: 48, textAlign: 'right', fontWeight: fonts.semibold }}>
            {item.symbol}
          </Text>
          <View style={{ flex: 1, height: 26, backgroundColor: theme.border, borderRadius: 6, overflow: 'hidden' }}>
            <View style={{
              width: `${Math.max(item.pct, 1)}%`,
              height: '100%',
              backgroundColor: TOKEN_COLORS[item.symbol] ?? theme.accent.green,
              borderRadius: 6,
              justifyContent: 'center',
              paddingLeft: 6,
            }}>
              {item.pct >= 8 && (
                <Text style={{ color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold }}>
                  {item.pct.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>
          {item.pct < 8 && (
            <Text style={{ color: theme.text.muted, fontSize: fonts.xs }}>{item.pct.toFixed(1)}%</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ───

export function PortfolioRebalanceScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('current');
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);
  const [executing, setExecuting] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 6 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase' },
    tabTextActive: { color: '#fff' },
    sectionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    metricLabel: { color: t.text.muted, fontSize: fonts.md },
    metricValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border },
    // Drift
    driftRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    driftSymbol: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, width: 50 },
    driftPct: { fontSize: fonts.md, fontWeight: fonts.semibold },
    // Trade
    tradeCard: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 10 },
    tradeAction: { fontSize: fonts.sm, fontWeight: fonts.heavy, letterSpacing: 1 },
    tradeDetail: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    // Execute button
    executeBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    executeBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.heavy },
    executeBtnDisabled: { opacity: 0.5 },
    // Target input row
    targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    targetSymbol: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, width: 50 },
    targetPctGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    targetBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.bg.primary, justifyContent: 'center', alignItems: 'center' },
    targetBtnText: { color: t.accent.blue, fontSize: fonts.xl, fontWeight: fonts.bold },
    targetPct: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, width: 48, textAlign: 'center' },
    // History
    historyCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    historyDate: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    historyMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    demoBanner: { backgroundColor: t.accent.yellow + '20', borderRadius: 12, padding: 12, marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.semibold, textAlign: 'center' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    totalLabel: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    totalValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    placeholder: { color: t.text.muted, fontSize: fonts.md },
  }), [t]);

  // ─── Derived data ───

  const currentAllocations = DEMO_CURRENT;
  const totalValue = DEMO_TOTAL_VALUE;

  const targetTotal = useMemo(() => {
    return Object.values(targets).reduce((sum, v) => sum + v, 0);
  }, [targets]);

  const driftAnalysis = useMemo(() => {
    return currentAllocations.map((alloc) => {
      const targetPct = targets[alloc.symbol] ?? 0;
      const drift = alloc.pct - targetPct;
      return {
        symbol: alloc.symbol,
        currentPct: alloc.pct,
        targetPct,
        drift,
        absDrift: Math.abs(drift),
      };
    }).sort((a, b) => b.absDrift - a.absDrift);
  }, [currentAllocations, targets]);

  const maxDrift = useMemo(() => {
    if (driftAnalysis.length === 0) return 0;
    return Math.max(...driftAnalysis.map((d) => d.absDrift));
  }, [driftAnalysis]);

  const trades = useMemo((): Trade[] => {
    return driftAnalysis
      .filter((d) => d.absDrift >= 0.5)
      .map((d) => ({
        symbol: d.symbol,
        action: d.drift > 0 ? 'SELL' as const : 'BUY' as const,
        amountUsd: (d.absDrift / 100) * totalValue,
        fromPct: d.currentPct,
        toPct: d.targetPct,
      }));
  }, [driftAnalysis, totalValue]);

  const formatUsd = (v: number) =>
    '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const adjustTarget = useCallback((symbol: string, delta: number) => {
    setTargets((prev) => {
      const newVal = Math.max(0, Math.min(100, (prev[symbol] ?? 0) + delta));
      return { ...prev, [symbol]: newVal };
    });
  }, []);

  const handleExecute = useCallback(() => {
    if (demoMode) {
      Alert.alert('Demo Mode', 'Rebalance simulated successfully. In live mode, trades would execute via best swap routes.');
      return;
    }
    setExecuting(true);
    // In production, this would route through the swap engine
    setTimeout(() => {
      setExecuting(false);
      Alert.alert('Rebalance Complete', `${trades.length} trades executed successfully.`);
    }, 2000);
  }, [demoMode, trades]);

  // ─── Tabs rendering ───

  const renderTabBar = () => (
    <View style={s.tabRow}>
      {(['current', 'target', 'rebalance', 'history'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[s.tab, activeTab === tab && s.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
            {tab === 'current' ? 'Current' : tab === 'target' ? 'Target' : tab === 'rebalance' ? 'Rebalance' : 'History'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCurrent = () => (
    <>
      <View style={s.demoBanner}>
        <Text style={s.demoText}>Portfolio Total: {formatUsd(totalValue)}</Text>
      </View>

      <Text style={s.sectionLabel}>Current Allocation</Text>
      <View style={s.card}>
        <AllocationBar items={currentAllocations} theme={t} />
      </View>

      <Text style={s.sectionLabel}>Breakdown</Text>
      <View style={s.card}>
        {currentAllocations.map((alloc, i) => (
          <View key={alloc.symbol}>
            <View style={s.metricRow}>
              <Text style={[s.metricLabel, { fontWeight: fonts.semibold, color: TOKEN_COLORS[alloc.symbol] ?? t.text.primary }]}>
                {alloc.symbol}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.metricValue}>{alloc.pct}%</Text>
                <Text style={{ color: t.text.muted, fontSize: fonts.sm }}>{formatUsd(alloc.usdValue)}</Text>
              </View>
            </View>
            {i < currentAllocations.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </View>
    </>
  );

  const renderTarget = () => (
    <>
      <Text style={s.sectionLabel}>Target Allocation</Text>
      <View style={s.card}>
        {currentAllocations.map((alloc) => {
          const tgt = targets[alloc.symbol] ?? 0;
          return (
            <View key={alloc.symbol} style={s.targetRow}>
              <Text style={s.targetSymbol}>{alloc.symbol}</Text>
              <View style={s.targetPctGroup}>
                <TouchableOpacity style={s.targetBtn} onPress={() => adjustTarget(alloc.symbol, -5)}>
                  <Text style={s.targetBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={s.targetPct}>{tgt}%</Text>
                <TouchableOpacity style={s.targetBtn} onPress={() => adjustTarget(alloc.symbol, 5)}>
                  <Text style={s.targetBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={[s.totalRow, { marginTop: 12 }]}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={[s.totalValue, { color: targetTotal === 100 ? t.accent.green : t.accent.red }]}>
            {targetTotal}%
          </Text>
        </View>
        {targetTotal !== 100 && (
          <Text style={{ color: t.accent.red, fontSize: fonts.sm, marginTop: 4, textAlign: 'center' }}>
            Target must equal 100% (currently {targetTotal}%)
          </Text>
        )}
      </View>

      <Text style={s.sectionLabel}>Target Preview</Text>
      <View style={s.card}>
        <AllocationBar
          items={currentAllocations.map((a) => ({ symbol: a.symbol, pct: targets[a.symbol] ?? 0 }))}
          theme={t}
        />
      </View>
    </>
  );

  const renderRebalance = () => (
    <>
      <Text style={s.sectionLabel}>Drift Analysis</Text>
      <View style={s.card}>
        <View style={[s.metricRow, { paddingVertical: 6 }]}>
          <Text style={s.metricLabel}>Max Drift</Text>
          <Text style={[s.metricValue, { color: maxDrift > 10 ? t.accent.red : maxDrift > 5 ? t.accent.yellow : t.accent.green }]}>
            {maxDrift.toFixed(1)}%
          </Text>
        </View>
        <View style={s.divider} />
        {driftAnalysis.map((d) => (
          <View key={d.symbol} style={s.driftRow}>
            <Text style={s.driftSymbol}>{d.symbol}</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm }}>
              {d.currentPct}% → {d.targetPct}%
            </Text>
            <Text style={[s.driftPct, {
              color: d.drift > 0 ? t.accent.red : d.drift < 0 ? t.accent.green : t.text.muted,
            }]}>
              {d.drift > 0 ? '+' : ''}{d.drift.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionLabel}>Trades Needed ({trades.length})</Text>
      {trades.length === 0 ? (
        <View style={s.card}>
          <Text style={s.placeholder}>Portfolio is balanced -- no trades needed.</Text>
        </View>
      ) : (
        trades.map((trade) => (
          <View key={trade.symbol} style={s.tradeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[s.tradeAction, {
                  color: trade.action === 'BUY' ? t.accent.green : t.accent.red,
                }]}>
                  {trade.action}
                </Text>
                <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold }}>
                  {trade.symbol}
                </Text>
              </View>
              <Text style={s.metricValue}>{formatUsd(trade.amountUsd)}</Text>
            </View>
            <Text style={s.tradeDetail}>
              {trade.fromPct}% → {trade.toPct}% (via best swap route)
            </Text>
          </View>
        ))
      )}

      {trades.length > 0 && targetTotal === 100 && (
        <TouchableOpacity
          style={[s.executeBtn, executing && s.executeBtnDisabled]}
          onPress={handleExecute}
          disabled={executing}
        >
          <Text style={s.executeBtnText}>
            {executing ? 'Executing...' : `Execute ${trades.length} Trades`}
          </Text>
        </TouchableOpacity>
      )}

      {targetTotal !== 100 && trades.length > 0 && (
        <Text style={{ color: t.accent.red, fontSize: fonts.sm, textAlign: 'center', marginTop: 16 }}>
          Adjust target allocation to 100% before executing.
        </Text>
      )}
    </>
  );

  const renderHistory = () => (
    <>
      <Text style={s.sectionLabel}>Rebalance History</Text>
      {DEMO_HISTORY.map((entry) => {
        const statusColor = entry.status === 'completed' ? t.accent.green
          : entry.status === 'partial' ? t.accent.yellow
          : t.accent.red;
        return (
          <View key={entry.id} style={s.historyCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.historyDate}>{entry.date}</Text>
              <Text style={s.metricValue}>{formatUsd(entry.totalMoved)}</Text>
            </View>
            <Text style={s.historyMeta}>
              {entry.trades} trades executed
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[s.statusText, { color: statusColor }]}>{entry.status}</Text>
            </View>
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>Close</Text>
        </TouchableOpacity>
        <Text style={s.title}>Rebalance</Text>
        <View style={{ width: 50 }} />
      </View>

      {renderTabBar()}

      <ScrollView contentContainerStyle={s.scroll}>
        {demoMode && (
          <View style={s.demoBanner}>
            <Text style={s.demoText}>Demo Mode -- Simulated portfolio data</Text>
          </View>
        )}

        {activeTab === 'current' && renderCurrent()}
        {activeTab === 'target' && renderTarget()}
        {activeTab === 'rebalance' && renderRebalance()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
