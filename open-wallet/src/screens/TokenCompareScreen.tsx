import { fonts } from '../utils/theme';
/**
 * Token Comparison Screen — Compare two tokens side by side.
 * Price overlay chart (normalized), correlation, relative performance,
 * key metrics, and demo mode with sample data.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Dimensions, PanResponder,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { usePrices } from '../hooks/usePrices';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Token metadata for comparison ───

interface TokenMetrics {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  ath: number;
  atl: number;
  athDate: string;
  atlDate: string;
}

const DEMO_METRICS: Record<string, TokenMetrics> = {
  BTC: {
    symbol: 'BTC', name: 'Bitcoin', price: 67000, change24h: 2.3,
    marketCap: 1310000000000, volume24h: 28000000000, circulatingSupply: 19600000,
    totalSupply: 21000000, ath: 73750, atl: 67.81, athDate: '2024-03-14', atlDate: '2013-07-06',
  },
  ETH: {
    symbol: 'ETH', name: 'Ethereum', price: 3400, change24h: -1.2,
    marketCap: 408000000000, volume24h: 14000000000, circulatingSupply: 120200000,
    totalSupply: 120200000, ath: 4878, atl: 0.432, athDate: '2021-11-10', atlDate: '2015-10-20',
  },
  SOL: {
    symbol: 'SOL', name: 'Solana', price: 145, change24h: 4.5,
    marketCap: 63000000000, volume24h: 3200000000, circulatingSupply: 435000000,
    totalSupply: 575000000, ath: 260, atl: 0.50, athDate: '2021-11-06', atlDate: '2020-05-11',
  },
  ATOM: {
    symbol: 'ATOM', name: 'Cosmos', price: 9.5, change24h: -0.8,
    marketCap: 3700000000, volume24h: 180000000, circulatingSupply: 390000000,
    totalSupply: 390000000, ath: 44.70, atl: 1.16, athDate: '2022-01-17', atlDate: '2020-03-13',
  },
  ADA: {
    symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: 1.1,
    marketCap: 16000000000, volume24h: 400000000, circulatingSupply: 35500000000,
    totalSupply: 45000000000, ath: 3.10, atl: 0.017, athDate: '2021-09-02', atlDate: '2020-03-13',
  },
  OTK: {
    symbol: 'OTK', name: 'Open Token', price: 0.01, change24h: 0.5,
    marketCap: 100000, volume24h: 5000, circulatingSupply: 10000000,
    totalSupply: 100000000, ath: 0.015, atl: 0.005, athDate: '2026-03-01', atlDate: '2026-01-15',
  },
};

const AVAILABLE_TOKENS = ['BTC', 'ETH', 'SOL', 'ATOM', 'ADA', 'OTK'];

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', ATOM: '#6f7390',
  OTK: '#22c55e', ADA: '#0033ad',
};

// ─── Demo price history generator ───

function generatePriceHistory(symbol: string, days: number): number[] {
  const base = DEMO_METRICS[symbol]?.price ?? 100;
  const points = days * 24; // hourly
  const history: number[] = [];

  let seed = symbol.charCodeAt(0) * 137 + symbol.charCodeAt(1) * 31;
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  let value = base * 0.85; // start 15% lower than current
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const trend = 0.15 * t; // upward trend
    const cycle = Math.sin(t * Math.PI * 8) * 0.03 + Math.sin(t * Math.PI * 20) * 0.01;
    const noise = (pseudoRandom() - 0.5) * 0.02;
    value = base * (0.85 + trend + cycle + noise);
    history.push(value);
  }

  return history;
}

// ─── Correlation Coefficient ───

function computeCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;

  // Use returns (percentage changes) for correlation
  const returnsA: number[] = [];
  const returnsB: number[] = [];
  for (let i = 1; i < n; i++) {
    returnsA.push((a[i] - a[i - 1]) / (a[i - 1] || 1));
    returnsB.push((b[i] - b[i - 1]) / (b[i - 1] || 1));
  }

  const meanA = returnsA.reduce((s, v) => s + v, 0) / returnsA.length;
  const meanB = returnsB.reduce((s, v) => s + v, 0) / returnsB.length;

  let sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < returnsA.length; i++) {
    const da = returnsA[i] - meanA;
    const db = returnsB[i] - meanB;
    sumAB += da * db;
    sumA2 += da * da;
    sumB2 += db * db;
  }

  const denom = Math.sqrt(sumA2 * sumB2);
  return denom === 0 ? 0 : sumAB / denom;
}

// ─── Dual Line Chart ───

function DualLineChart({
  dataA,
  dataB,
  colorA,
  colorB,
  width,
  height,
  theme,
  onTouch,
  touchIndex,
}: {
  dataA: number[];
  dataB: number[];
  colorA: string;
  colorB: string;
  width: number;
  height: number;
  theme: ReturnType<typeof useTheme>;
  onTouch: (index: number | null) => void;
  touchIndex: number | null;
}) {
  // Normalize both to 0-1 range for overlay
  const normalize = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((v) => (v - min) / range);
  };

  const normA = normalize(dataA);
  const normB = normalize(dataB);
  const maxLen = Math.max(normA.length, normB.length);
  const stepX = width / (maxLen - 1 || 1);
  const padding = 4;
  const chartH = height - padding * 2;

  const getY = (norm: number) => padding + chartH - norm * chartH;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = Math.round(x / stepX);
        onTouch(Math.max(0, Math.min(maxLen - 1, idx)));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = Math.round(x / stepX);
        onTouch(Math.max(0, Math.min(maxLen - 1, idx)));
      },
      onPanResponderRelease: () => onTouch(null),
    }),
  ).current;

  const renderLine = (norm: number[], color: string) => {
    const points = norm.map((v, i) => ({ x: i * stepX, y: getY(v) }));
    return points.map((point, i) => {
      if (i === 0) return null;
      const prev = points[i - 1];
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      return (
        <View
          key={`${color}-${i}`}
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
    });
  };

  return (
    <View style={{ width, height, position: 'relative' }} {...panResponder.panHandlers}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <View
          key={pct}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: padding + chartH * (1 - pct),
            height: 1, backgroundColor: theme.border, opacity: 0.3,
          }}
        />
      ))}

      {renderLine(normA, colorA)}
      {renderLine(normB, colorB)}

      {/* Touch indicator */}
      {touchIndex !== null && (
        <View
          style={{
            position: 'absolute',
            left: touchIndex * stepX - 0.5,
            top: 0, width: 1, height,
            backgroundColor: theme.text.muted, opacity: 0.5,
          }}
        />
      )}
    </View>
  );
}

// ─── Main Screen ───

export const TokenCompareScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const { prices: livePrices, changes: liveChanges } = usePrices();
  const t = useTheme();

  const [tokenA, setTokenA] = useState('BTC');
  const [tokenB, setTokenB] = useState('ETH');
  const [touchIndex, setTouchIndex] = useState<number | null>(null);

  const screenWidth = Dimensions.get('window').width - 32;

  // Get metrics
  const getMetrics = useCallback((sym: string): TokenMetrics => {
    const demo = DEMO_METRICS[sym];
    if (!demo) {
      return {
        symbol: sym, name: sym, price: livePrices[sym] ?? 0, change24h: liveChanges[sym] ?? 0,
        marketCap: 0, volume24h: 0, circulatingSupply: 0, totalSupply: 0,
        ath: 0, atl: 0, athDate: '--', atlDate: '--',
      };
    }
    if (!demoMode && livePrices[sym]) {
      return { ...demo, price: livePrices[sym], change24h: liveChanges[sym] ?? demo.change24h };
    }
    return demo;
  }, [demoMode, livePrices, liveChanges]);

  const metricsA = useMemo(() => getMetrics(tokenA), [tokenA, getMetrics]);
  const metricsB = useMemo(() => getMetrics(tokenB), [tokenB, getMetrics]);

  // Price histories (30 days)
  const historyA = useMemo(() => generatePriceHistory(tokenA, 30), [tokenA]);
  const historyB = useMemo(() => generatePriceHistory(tokenB, 30), [tokenB]);

  // Correlation
  const correlation = useMemo(() => computeCorrelation(historyA, historyB), [historyA, historyB]);

  // Relative performance (30d)
  const perfA = historyA.length > 1 ? ((historyA[historyA.length - 1] - historyA[0]) / historyA[0]) * 100 : 0;
  const perfB = historyB.length > 1 ? ((historyB[historyB.length - 1] - historyB[0]) / historyB[0]) * 100 : 0;

  const handleTouch = useCallback((idx: number | null) => setTouchIndex(idx), []);

  const colorA = TOKEN_COLORS[tokenA] ?? t.accent.green;
  const colorB = TOKEN_COLORS[tokenB] ?? t.accent.blue;

  const formatUsd = (v: number) => {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1) return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return `$${v.toFixed(6)}`;
  };

  const formatSupply = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
    return v.toLocaleString();
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    demoTag: { color: t.accent.yellow, fontSize: 11, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8 },
    selectorSection: { marginBottom: 16 },
    selectorLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.bold, marginBottom: 6 },
    tokenRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    tokenChip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 2, borderColor: 'transparent' },
    tokenText: { fontSize: 14, fontWeight: fonts.bold },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, fontWeight: fonts.semibold },
    touchInfo: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    touchVal: { fontSize: 13, fontWeight: fonts.bold },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    metricLabel: { color: t.text.muted, fontSize: 14, flex: 1.2 },
    metricValA: { fontSize: 13, fontWeight: fonts.bold, flex: 1, textAlign: 'right' },
    metricValB: { fontSize: 13, fontWeight: fonts.bold, flex: 1, textAlign: 'right' },
    divider: { height: 1, backgroundColor: t.border },
    correlationRow: { alignItems: 'center', paddingVertical: 16 },
    correlationValue: { fontSize: 36, fontWeight: fonts.heavy },
    correlationLabel: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    correlationDesc: { color: t.text.secondary, fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
    perfRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
    perfItem: { alignItems: 'center' },
    perfSymbol: { fontSize: 14, fontWeight: fonts.bold, marginBottom: 4 },
    perfValue: { fontSize: 22, fontWeight: fonts.heavy },
    perfLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const correlationColor = Math.abs(correlation) > 0.7 ? t.accent.green :
    Math.abs(correlation) > 0.3 ? t.accent.yellow : t.accent.red;

  const correlationDescription = correlation > 0.7 ? 'Strongly correlated — these tokens tend to move together.' :
    correlation > 0.3 ? 'Moderately correlated — some similar movement patterns.' :
    correlation > -0.3 ? 'Weakly correlated — largely independent price movements.' :
    correlation > -0.7 ? 'Negatively correlated — tend to move in opposite directions.' :
    'Strongly negatively correlated — natural hedge potential.';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Compare Tokens</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {demoMode && <Text style={s.demoTag}>DEMO DATA</Text>}

        {/* Token A Selector */}
        <View style={s.selectorSection}>
          <Text style={s.selectorLabel}>Token A</Text>
          <View style={s.tokenRow}>
            {AVAILABLE_TOKENS.map((sym) => (
              <TouchableOpacity
                key={sym}
                style={[
                  s.tokenChip,
                  { backgroundColor: tokenA === sym ? colorA + '20' : t.bg.card,
                    borderColor: tokenA === sym ? colorA : 'transparent' },
                ]}
                onPress={() => { if (sym !== tokenB) setTokenA(sym); }}
              >
                <Text style={[s.tokenText, { color: tokenA === sym ? colorA : t.text.secondary }]}>{sym}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Token B Selector */}
        <View style={s.selectorSection}>
          <Text style={s.selectorLabel}>Token B</Text>
          <View style={s.tokenRow}>
            {AVAILABLE_TOKENS.map((sym) => (
              <TouchableOpacity
                key={sym}
                style={[
                  s.tokenChip,
                  { backgroundColor: tokenB === sym ? colorB + '20' : t.bg.card,
                    borderColor: tokenB === sym ? colorB : 'transparent' },
                ]}
                onPress={() => { if (sym !== tokenA) setTokenB(sym); }}
              >
                <Text style={[s.tokenText, { color: tokenB === sym ? colorB : t.text.secondary }]}>{sym}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Overlay Chart */}
        <Text style={s.sectionLabel}>Price Overlay (30 Days, Normalized)</Text>
        <View style={s.card}>
          <View style={s.chartLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: colorA }]} />
              <Text style={[s.legendText, { color: colorA }]}>{tokenA}</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: colorB }]} />
              <Text style={[s.legendText, { color: colorB }]}>{tokenB}</Text>
            </View>
          </View>

          <DualLineChart
            dataA={historyA}
            dataB={historyB}
            colorA={colorA}
            colorB={colorB}
            width={screenWidth - 32}
            height={180}
            theme={t}
            onTouch={handleTouch}
            touchIndex={touchIndex}
          />

          {touchIndex !== null && (
            <View style={s.touchInfo}>
              <Text style={[s.touchVal, { color: colorA }]}>
                {tokenA}: {historyA[touchIndex] != null ? formatUsd(historyA[touchIndex]) : '--'}
              </Text>
              <Text style={[s.touchVal, { color: colorB }]}>
                {tokenB}: {historyB[touchIndex] != null ? formatUsd(historyB[touchIndex]) : '--'}
              </Text>
            </View>
          )}
        </View>

        {/* Correlation */}
        <Text style={s.sectionLabel}>Correlation</Text>
        <View style={s.card}>
          <View style={s.correlationRow}>
            <Text style={[s.correlationValue, { color: correlationColor }]}>
              {correlation.toFixed(3)}
            </Text>
            <Text style={s.correlationLabel}>Pearson Correlation Coefficient</Text>
            <Text style={s.correlationDesc}>{correlationDescription}</Text>
          </View>
        </View>

        {/* Relative Performance */}
        <Text style={s.sectionLabel}>Relative Performance (30 Days)</Text>
        <View style={s.card}>
          <View style={s.perfRow}>
            <View style={s.perfItem}>
              <Text style={[s.perfSymbol, { color: colorA }]}>{tokenA}</Text>
              <Text style={[s.perfValue, { color: perfA >= 0 ? t.accent.green : t.accent.red }]}>
                {perfA >= 0 ? '+' : ''}{perfA.toFixed(2)}%
              </Text>
              <Text style={s.perfLabel}>30d Return</Text>
            </View>
            <View style={{ width: 1, backgroundColor: t.border, marginVertical: 8 }} />
            <View style={s.perfItem}>
              <Text style={[s.perfSymbol, { color: colorB }]}>{tokenB}</Text>
              <Text style={[s.perfValue, { color: perfB >= 0 ? t.accent.green : t.accent.red }]}>
                {perfB >= 0 ? '+' : ''}{perfB.toFixed(2)}%
              </Text>
              <Text style={s.perfLabel}>30d Return</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>Outperformer</Text>
            <Text style={{ color: perfA > perfB ? colorA : colorB, fontSize: 16, fontWeight: fonts.heavy, marginTop: 4 }}>
              {perfA > perfB ? tokenA : tokenB} by {Math.abs(perfA - perfB).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Key Metrics Comparison */}
        <Text style={s.sectionLabel}>Key Metrics</Text>
        <View style={s.card}>
          {/* Header */}
          <View style={s.metricRow}>
            <Text style={[s.metricLabel, { fontWeight: fonts.bold, color: t.text.secondary }]}>Metric</Text>
            <Text style={[s.metricValA, { color: colorA }]}>{tokenA}</Text>
            <Text style={[s.metricValB, { color: colorB }]}>{tokenB}</Text>
          </View>
          <View style={s.divider} />

          {/* Price */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Price</Text>
            <Text style={[s.metricValA, { color: t.text.primary }]}>{formatUsd(metricsA.price)}</Text>
            <Text style={[s.metricValB, { color: t.text.primary }]}>{formatUsd(metricsB.price)}</Text>
          </View>
          <View style={s.divider} />

          {/* 24h Change */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>24h Change</Text>
            <Text style={[s.metricValA, { color: metricsA.change24h >= 0 ? t.accent.green : t.accent.red }]}>
              {metricsA.change24h >= 0 ? '+' : ''}{metricsA.change24h.toFixed(2)}%
            </Text>
            <Text style={[s.metricValB, { color: metricsB.change24h >= 0 ? t.accent.green : t.accent.red }]}>
              {metricsB.change24h >= 0 ? '+' : ''}{metricsB.change24h.toFixed(2)}%
            </Text>
          </View>
          <View style={s.divider} />

          {/* Market Cap */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Market Cap</Text>
            <Text style={[s.metricValA, { color: t.text.primary }]}>{formatUsd(metricsA.marketCap)}</Text>
            <Text style={[s.metricValB, { color: t.text.primary }]}>{formatUsd(metricsB.marketCap)}</Text>
          </View>
          <View style={s.divider} />

          {/* Volume */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>24h Volume</Text>
            <Text style={[s.metricValA, { color: t.text.primary }]}>{formatUsd(metricsA.volume24h)}</Text>
            <Text style={[s.metricValB, { color: t.text.primary }]}>{formatUsd(metricsB.volume24h)}</Text>
          </View>
          <View style={s.divider} />

          {/* Circulating Supply */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Circulating</Text>
            <Text style={[s.metricValA, { color: t.text.primary }]}>{formatSupply(metricsA.circulatingSupply)}</Text>
            <Text style={[s.metricValB, { color: t.text.primary }]}>{formatSupply(metricsB.circulatingSupply)}</Text>
          </View>
          <View style={s.divider} />

          {/* Total Supply */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Total Supply</Text>
            <Text style={[s.metricValA, { color: t.text.primary }]}>{formatSupply(metricsA.totalSupply)}</Text>
            <Text style={[s.metricValB, { color: t.text.primary }]}>{formatSupply(metricsB.totalSupply)}</Text>
          </View>
          <View style={s.divider} />

          {/* ATH */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>ATH</Text>
            <Text style={[s.metricValA, { color: t.accent.green }]}>{formatUsd(metricsA.ath)}</Text>
            <Text style={[s.metricValB, { color: t.accent.green }]}>{formatUsd(metricsB.ath)}</Text>
          </View>
          <View style={s.divider} />

          {/* ATL */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>ATL</Text>
            <Text style={[s.metricValA, { color: t.accent.red }]}>{formatUsd(metricsA.atl)}</Text>
            <Text style={[s.metricValB, { color: t.accent.red }]}>{formatUsd(metricsB.atl)}</Text>
          </View>
          <View style={s.divider} />

          {/* ATH Date */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>ATH Date</Text>
            <Text style={[s.metricValA, { color: t.text.secondary }]}>{metricsA.athDate}</Text>
            <Text style={[s.metricValB, { color: t.text.secondary }]}>{metricsB.athDate}</Text>
          </View>
          <View style={s.divider} />

          {/* ATL Date */}
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>ATL Date</Text>
            <Text style={[s.metricValA, { color: t.text.secondary }]}>{metricsA.atlDate}</Text>
            <Text style={[s.metricValB, { color: t.text.secondary }]}>{metricsB.atlDate}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
