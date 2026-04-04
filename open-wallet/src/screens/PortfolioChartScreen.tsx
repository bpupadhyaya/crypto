import { fonts } from '../utils/theme';
/**
 * Portfolio Chart Screen — Interactive portfolio value chart over time.
 * Shows line chart, timeframe selector, high/low, per-token breakdown.
 * Demo mode generates realistic historical data with sine wave + trend.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions, PanResponder,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getSnapshots, type PortfolioSnapshot } from '../core/portfolio/historyTracker';

interface Props {
  onClose: () => void;
}

type Period = '24h' | '7d' | '30d' | '90d' | '1y';

const PERIODS: { key: Period; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '1y', label: '1Y' },
];

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', ATOM: '#6f7390',
  OTK: '#22c55e', ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142',
  LINK: '#2a5ada', BNB: '#f3ba2f', USDT: '#26a17b', USDC: '#2775ca',
};

// ─── Demo Data Generator ───

function generateDemoData(period: Period): PortfolioSnapshot[] {
  const now = Date.now();
  const periodMs: Record<Period, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  };

  const duration = periodMs[period];
  const pointCount = period === '24h' ? 96 : period === '7d' ? 168 : period === '30d' ? 360 : period === '90d' ? 540 : 730;
  const interval = duration / pointCount;

  const baseValue = 50000;
  const trend = 0.15; // 15% upward trend over period
  const volatility = 0.08;
  const snapshots: PortfolioSnapshot[] = [];

  // Token base allocations (fraction of total)
  const tokenAlloc = { BTC: 0.40, ETH: 0.25, SOL: 0.20, ATOM: 0.08, OTK: 0.07 };

  // Use seeded-ish deterministic noise for consistency
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const timestamp = now - duration + i * interval;

    // Sine wave components for realistic movement
    const sineWave = Math.sin(t * Math.PI * 6) * 0.03
      + Math.sin(t * Math.PI * 14) * 0.015
      + Math.sin(t * Math.PI * 30) * 0.008;

    // Random walk
    const noise = (pseudoRandom() - 0.5) * volatility * 0.3;

    // Combine: trend + cycles + noise
    const multiplier = 1 + trend * t + sineWave + noise;
    const totalUsd = baseValue * multiplier;

    // Breakdown per token with slight independent variation
    const breakdown: Record<string, number> = {};
    for (const [sym, alloc] of Object.entries(tokenAlloc)) {
      const tokenNoise = 1 + (pseudoRandom() - 0.5) * 0.04;
      breakdown[sym] = totalUsd * alloc * tokenNoise;
    }

    snapshots.push({ timestamp, totalUsd, breakdown });
  }

  return snapshots;
}

// ─── Mini Line Chart (Pure RN) ───

function LineChart({
  data,
  width,
  height,
  color,
  fillColor,
  theme,
  onTouch,
  touchIndex,
}: {
  data: number[];
  width: number;
  height: number;
  color: string;
  fillColor: string;
  theme: ReturnType<typeof useTheme>;
  onTouch: (index: number | null) => void;
  touchIndex: number | null;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartH = height - padding * 2;
  const stepX = width / (data.length - 1);

  const getY = (val: number) => padding + chartH - ((val - min) / range) * chartH;

  // Build SVG-like path using View positioning
  const points = data.map((val, i) => ({
    x: i * stepX,
    y: getY(val),
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = Math.round(x / stepX);
        onTouch(Math.max(0, Math.min(data.length - 1, idx)));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = Math.round(x / stepX);
        onTouch(Math.max(0, Math.min(data.length - 1, idx)));
      },
      onPanResponderRelease: () => {
        onTouch(null);
      },
    }),
  ).current;

  return (
    <View
      style={{ width, height, position: 'relative' }}
      {...panResponder.panHandlers}
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <View
          key={pct}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: padding + chartH * (1 - pct),
            height: 1,
            backgroundColor: theme.border,
            opacity: 0.3,
          }}
        />
      ))}

      {/* Line segments */}
      {points.map((point, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y - 1,
              width: length,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        );
      })}

      {/* Touch indicator */}
      {touchIndex !== null && points[touchIndex] && (
        <>
          <View
            style={{
              position: 'absolute',
              left: points[touchIndex].x - 0.5,
              top: 0,
              width: 1,
              height,
              backgroundColor: theme.text.muted,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: points[touchIndex].x - 5,
              top: points[touchIndex].y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: '#fff',
            }}
          />
        </>
      )}
    </View>
  );
}

// ─── Stacked Area Breakdown ───

function StackedBreakdown({
  snapshots,
  width,
  height,
  theme,
}: {
  snapshots: PortfolioSnapshot[];
  width: number;
  height: number;
  theme: ReturnType<typeof useTheme>;
}) {
  if (snapshots.length < 2) return null;

  // Collect all tokens
  const allTokens = new Set<string>();
  for (const snap of snapshots) {
    for (const sym of Object.keys(snap.breakdown)) {
      allTokens.add(sym);
    }
  }
  const tokens = Array.from(allTokens).sort();

  return (
    <View style={{ width, height }}>
      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {tokens.map((sym) => (
          <View key={sym} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TOKEN_COLORS[sym] ?? theme.accent.green }} />
            <Text style={{ color: theme.text.muted, fontSize: fonts.xs }}>{sym}</Text>
          </View>
        ))}
      </View>

      {/* Stacked bars (simplified) */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
        {snapshots.filter((_, i) => i % Math.max(1, Math.floor(snapshots.length / 60)) === 0).map((snap, idx) => {
          const total = snap.totalUsd || 1;
          return (
            <View key={idx} style={{ flex: 1, height: height - 30 }}>
              {tokens.map((sym) => {
                const pct = ((snap.breakdown[sym] ?? 0) / total) * 100;
                return (
                  <View
                    key={sym}
                    style={{
                      height: `${pct}%`,
                      backgroundColor: TOKEN_COLORS[sym] ?? theme.accent.green,
                      opacity: 0.8,
                    }}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ───

export const PortfolioChartScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [period, setPeriod] = useState<Period>('30d');
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchIndex, setTouchIndex] = useState<number | null>(null);
  const [showStacked, setShowStacked] = useState(false);

  const screenWidth = Dimensions.get('window').width - 32;

  // Load snapshots
  useEffect(() => {
    setLoading(true);
    if (demoMode) {
      const data = generateDemoData(period);
      setSnapshots(data);
      setLoading(false);
    } else {
      getSnapshots(period).then((data) => {
        if (data.length < 2) {
          // Not enough real data — use demo data
          setSnapshots(generateDemoData(period));
        } else {
          setSnapshots(data);
        }
        setLoading(false);
      });
    }
    setTouchIndex(null);
  }, [period, demoMode]);

  // Derived values
  const values = useMemo(() => snapshots.map((s) => s.totalUsd), [snapshots]);

  const currentValue = useMemo(() => {
    if (touchIndex !== null && snapshots[touchIndex]) {
      return snapshots[touchIndex].totalUsd;
    }
    return snapshots.length > 0 ? snapshots[snapshots.length - 1].totalUsd : 0;
  }, [snapshots, touchIndex]);

  const startValue = useMemo(() => snapshots.length > 0 ? snapshots[0].totalUsd : 0, [snapshots]);

  const changeAmt = currentValue - startValue;
  const changePct = startValue > 0 ? (changeAmt / startValue) * 100 : 0;
  const isPositive = changeAmt >= 0;

  const highValue = useMemo(() => values.length > 0 ? Math.max(...values) : 0, [values]);
  const lowValue = useMemo(() => values.length > 0 ? Math.min(...values) : 0, [values]);

  const touchTimestamp = touchIndex !== null && snapshots[touchIndex]
    ? new Date(snapshots[touchIndex].timestamp).toLocaleString()
    : null;

  const handleTouch = useCallback((idx: number | null) => setTouchIndex(idx), []);

  const formatUsd = (v: number) =>
    '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    valueSection: { alignItems: 'center', paddingVertical: 20 },
    currentValue: { color: t.text.primary, fontSize: fonts.hero, fontWeight: fonts.heavy },
    changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    changeText: { fontSize: fonts.lg, fontWeight: fonts.bold },
    touchTime: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    periodRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 20 },
    periodBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, backgroundColor: t.bg.card },
    periodActive: { backgroundColor: t.accent.green },
    periodText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    periodTextActive: { color: t.bg.primary },
    chartContainer: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    sectionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    metricLabel: { color: t.text.muted, fontSize: fonts.md },
    metricValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border },
    toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 16, marginBottom: 8 },
    toggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.bg.card },
    toggleActive: { backgroundColor: t.accent.blue + '30' },
    toggleText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    toggleTextActive: { color: t.accent.blue },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: t.text.muted, fontSize: fonts.md },
    demoTag: { color: t.accent.yellow, fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Portfolio Chart</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {demoMode && <Text style={s.demoTag}>DEMO DATA</Text>}

        {/* Current Value */}
        <View style={s.valueSection}>
          <Text style={s.currentValue}>{formatUsd(currentValue)}</Text>
          <View style={s.changeRow}>
            <Text style={[s.changeText, { color: isPositive ? t.accent.green : t.accent.red }]}>
              {isPositive ? '+' : ''}{formatUsd(changeAmt)}
            </Text>
            <Text style={[s.changeText, { color: isPositive ? t.accent.green : t.accent.red }]}>
              ({isPositive ? '+' : ''}{changePct.toFixed(2)}%)
            </Text>
          </View>
          {touchTimestamp && <Text style={s.touchTime}>{touchTimestamp}</Text>}
        </View>

        {/* Period Selector */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[s.periodBtn, period === p.key && s.periodActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[s.periodText, period === p.key && s.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        {!loading && values.length >= 2 ? (
          <View style={s.chartContainer}>
            {!showStacked ? (
              <LineChart
                data={values}
                width={screenWidth - 32}
                height={200}
                color={isPositive ? t.accent.green : t.accent.red}
                fillColor={(isPositive ? t.accent.green : t.accent.red) + '20'}
                theme={t}
                onTouch={handleTouch}
                touchIndex={touchIndex}
              />
            ) : (
              <StackedBreakdown
                snapshots={snapshots}
                width={screenWidth - 32}
                height={200}
                theme={t}
              />
            )}
          </View>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyText}>{loading ? 'Loading...' : 'Not enough data for chart'}</Text>
          </View>
        )}

        {/* Chart Type Toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity
            style={[s.toggleBtn, !showStacked && s.toggleActive]}
            onPress={() => setShowStacked(false)}
          >
            <Text style={[s.toggleText, !showStacked && s.toggleTextActive]}>Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, showStacked && s.toggleActive]}
            onPress={() => setShowStacked(true)}
          >
            <Text style={[s.toggleText, showStacked && s.toggleTextActive]}>Stacked</Text>
          </TouchableOpacity>
        </View>

        {/* High / Low */}
        <Text style={s.sectionLabel}>Period Statistics</Text>
        <View style={s.card}>
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Period High</Text>
            <Text style={[s.metricValue, { color: t.accent.green }]}>{formatUsd(highValue)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Period Low</Text>
            <Text style={[s.metricValue, { color: t.accent.red }]}>{formatUsd(lowValue)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Range</Text>
            <Text style={s.metricValue}>{formatUsd(highValue - lowValue)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Volatility</Text>
            <Text style={s.metricValue}>
              {startValue > 0 ? ((highValue - lowValue) / startValue * 100).toFixed(2) : '0.00'}%
            </Text>
          </View>
        </View>

        {/* Token Breakdown for touched point */}
        {touchIndex !== null && snapshots[touchIndex]?.breakdown && (
          <>
            <Text style={s.sectionLabel}>Breakdown at Point</Text>
            <View style={s.card}>
              {Object.entries(snapshots[touchIndex].breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([sym, val]) => (
                  <View key={sym} style={s.metricRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TOKEN_COLORS[sym] ?? t.accent.green }} />
                      <Text style={s.metricLabel}>{sym}</Text>
                    </View>
                    <Text style={s.metricValue}>{formatUsd(val)}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
