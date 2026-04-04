import { fonts } from '../utils/theme';
/**
 * Portfolio Analytics — Composition, performance, risk assessment.
 * Uses demo balances + demo prices in demo mode.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { usePortfolio } from '../hooks/useBalances';
import { usePrices } from '../hooks/usePrices';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Bar chart component (pure RN, no dependencies) ───

function BarChart({ items, theme }: {
  items: { label: string; pct: number; color: string }[];
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.text.secondary, fontSize: 13, width: 50, textAlign: 'right' }}>
            {item.label}
          </Text>
          <View style={{ flex: 1, height: 24, backgroundColor: theme.border, borderRadius: 6, overflow: 'hidden' }}>
            <View style={{
              width: `${Math.max(item.pct, 1)}%`,
              height: '100%',
              backgroundColor: item.color,
              borderRadius: 6,
              justifyContent: 'center',
              paddingLeft: 6,
            }}>
              {item.pct >= 8 && (
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: fonts.bold }}>
                  {item.pct.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>
          {item.pct < 8 && (
            <Text style={{ color: theme.text.muted, fontSize: 11 }}>{item.pct.toFixed(1)}%</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Risk helpers ───

function computeDiversificationScore(allocations: number[]): number {
  if (allocations.length <= 1) return 1;
  // Herfindahl-Hirschman style: lower concentration = higher score
  const hhi = allocations.reduce((sum, pct) => sum + (pct / 100) ** 2, 0);
  // HHI ranges from 1/n (perfectly diverse) to 1 (single asset)
  // Map to 1-10 scale
  const n = allocations.length;
  const minHHI = 1 / n;
  const score = 1 + 9 * (1 - (hhi - minHHI) / (1 - minHHI + 0.001));
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

function getRiskColor(score: number, theme: ReturnType<typeof useTheme>): string {
  if (score >= 7) return theme.accent.green;
  if (score >= 4) return theme.accent.yellow;
  return theme.accent.red;
}

// ─── Token color map ───

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', ATOM: '#6f7390',
  OTK: '#22c55e', ADA: '#0033ad', DOT: '#e6007a', AVAX: '#e84142',
  LINK: '#2a5ada', BNB: '#f3ba2f', USDT: '#26a17b', USDC: '#2775ca',
};

export const PortfolioAnalyticsScreen = React.memo(({ onClose }: Props) => {
  const addresses = useWalletStore((s) => s.addresses);
  const { balances, totalUsdValue } = usePortfolio(addresses);
  const { prices, changes } = usePrices();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 10, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    metricLabel: { color: t.text.muted, fontSize: 14 },
    metricValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border },
    // Table
    tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    tableHeaderText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    tableCell: { fontSize: 13 },
    // Risk
    scoreCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    scoreText: { color: '#fff', fontSize: 22, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 12, textAlign: 'center' },
    riskItem: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, marginTop: 8 },
    riskText: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    suggestionText: { color: t.accent.blue, fontSize: 13, lineHeight: 18, marginTop: 4 },
  }), [t]);

  // ─── Derived analytics ───

  const tokenAnalytics = useMemo(() => {
    return balances
      .filter((b) => b.token != null)
      .map((balance) => {
        const symbol = balance.token.symbol;
        const decimals = balance.token.decimals;
        const humanAmount = Number(balance.amount) / Math.pow(10, decimals);
        const price = prices[symbol] ?? 0;
        const usdValue = balance.usdValue ?? humanAmount * price;
        const change24h = changes[symbol] ?? 0;
        const pctOfPortfolio = totalUsdValue > 0 ? (usdValue / totalUsdValue) * 100 : 0;

        return {
          symbol,
          name: balance.token.name,
          balance: humanAmount,
          price,
          change24h,
          usdValue,
          pctOfPortfolio,
          color: TOKEN_COLORS[symbol] ?? t.accent.green,
        };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [balances, prices, changes, totalUsdValue, t]);

  const total24hChange = useMemo(() => {
    let prevTotal = 0;
    for (const tk of tokenAnalytics) {
      if (tk.change24h !== 0 && tk.price > 0) {
        const prevPrice = tk.price / (1 + tk.change24h / 100);
        prevTotal += tk.balance * prevPrice;
      } else {
        prevTotal += tk.usdValue;
      }
    }
    const changeAmt = totalUsdValue - prevTotal;
    const changePct = prevTotal > 0 ? (changeAmt / prevTotal) * 100 : 0;
    return { amount: changeAmt, pct: changePct };
  }, [tokenAnalytics, totalUsdValue]);

  const bestToken = useMemo(() => {
    if (tokenAnalytics.length === 0) return null;
    return tokenAnalytics.reduce((best, tk) => tk.change24h > best.change24h ? tk : best);
  }, [tokenAnalytics]);

  const worstToken = useMemo(() => {
    if (tokenAnalytics.length === 0) return null;
    return tokenAnalytics.reduce((worst, tk) => tk.change24h < worst.change24h ? tk : worst);
  }, [tokenAnalytics]);

  const diversificationScore = useMemo(() => {
    const allocations = tokenAnalytics.map((tk) => tk.pctOfPortfolio);
    return computeDiversificationScore(allocations);
  }, [tokenAnalytics]);

  const concentrationRisks = useMemo(() => {
    return tokenAnalytics.filter((tk) => tk.pctOfPortfolio > 50);
  }, [tokenAnalytics]);

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    for (const tk of concentrationRisks) {
      tips.push(`Consider diversifying -- ${tk.pctOfPortfolio.toFixed(0)}% in ${tk.symbol}`);
    }
    if (tokenAnalytics.length < 3) {
      tips.push('Adding more assets can reduce portfolio risk');
    }
    if (diversificationScore < 4) {
      tips.push('Portfolio is highly concentrated -- consider spreading across more tokens');
    }
    return tips;
  }, [concentrationRisks, tokenAnalytics, diversificationScore]);

  const formatUsd = (v: number) =>
    '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatChange = (v: number) => {
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}%`;
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Portfolio Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Portfolio Composition ── */}
        <Text style={s.sectionLabel}>Portfolio Composition</Text>
        <View style={s.card}>
          {tokenAnalytics.length > 0 ? (
            <BarChart
              items={tokenAnalytics.map((tk) => ({
                label: tk.symbol,
                pct: tk.pctOfPortfolio,
                color: tk.color,
              }))}
              theme={t}
            />
          ) : (
            <Text style={{ color: t.text.muted, textAlign: 'center', paddingVertical: 20 }}>
              No tokens in portfolio
            </Text>
          )}
        </View>

        {/* ── Performance Metrics ── */}
        <Text style={s.sectionLabel}>Performance Metrics</Text>
        <View style={s.card}>
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Total Portfolio Value</Text>
            <Text style={s.metricValue}>{formatUsd(totalUsdValue)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>24h Change</Text>
            <Text style={[s.metricValue, { color: total24hChange.amount >= 0 ? t.accent.green : t.accent.red }]}>
              {total24hChange.amount >= 0 ? '+' : ''}{formatUsd(total24hChange.amount)} ({formatChange(total24hChange.pct)})
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Best Performer (24h)</Text>
            <Text style={[s.metricValue, { color: t.accent.green }]}>
              {bestToken ? `${bestToken.symbol} ${formatChange(bestToken.change24h)}` : '--'}
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.metricRow}>
            <Text style={s.metricLabel}>Worst Performer (24h)</Text>
            <Text style={[s.metricValue, { color: t.accent.red }]}>
              {worstToken ? `${worstToken.symbol} ${formatChange(worstToken.change24h)}` : '--'}
            </Text>
          </View>
        </View>

        {/* ── Token Breakdown ── */}
        <Text style={s.sectionLabel}>Token Breakdown</Text>
        <View style={s.card}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 1.2 }]}>Token</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Balance</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
            <Text style={[s.tableHeaderText, { flex: 0.8, textAlign: 'right' }]}>24h</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>USD</Text>
            <Text style={[s.tableHeaderText, { flex: 0.6, textAlign: 'right' }]}>%</Text>
          </View>
          {/* Rows */}
          {tokenAnalytics.map((tk) => (
            <View key={tk.symbol} style={s.tableRow}>
              <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tk.color }} />
                <Text style={[s.tableCell, { color: t.text.primary, fontWeight: fonts.semibold }]}>{tk.symbol}</Text>
              </View>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: t.text.secondary }]}>
                {tk.balance < 0.01 ? tk.balance.toFixed(6) : tk.balance < 1 ? tk.balance.toFixed(4) : tk.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: t.text.secondary }]}>
                ${tk.price < 1 ? tk.price.toFixed(4) : tk.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={[s.tableCell, { flex: 0.8, textAlign: 'right', color: tk.change24h >= 0 ? t.accent.green : t.accent.red }]}>
                {formatChange(tk.change24h)}
              </Text>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: t.text.primary, fontWeight: fonts.semibold }]}>
                {formatUsd(tk.usdValue)}
              </Text>
              <Text style={[s.tableCell, { flex: 0.6, textAlign: 'right', color: t.text.muted }]}>
                {tk.pctOfPortfolio.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Risk Assessment ── */}
        <Text style={s.sectionLabel}>Risk Assessment</Text>
        <View style={s.card}>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={[s.scoreCircle, { backgroundColor: getRiskColor(diversificationScore, t) }]}>
              <Text style={s.scoreText}>{diversificationScore.toFixed(1)}</Text>
            </View>
            <Text style={s.scoreLabel}>Diversification Score (1-10)</Text>
          </View>

          {concentrationRisks.length > 0 && (
            <View style={s.riskItem}>
              <Text style={[s.riskText, { color: t.accent.yellow, fontWeight: fonts.bold }]}>
                Concentration Risk
              </Text>
              {concentrationRisks.map((tk) => (
                <Text key={tk.symbol} style={s.riskText}>
                  {tk.symbol}: {tk.pctOfPortfolio.toFixed(1)}% of portfolio (above 50% threshold)
                </Text>
              ))}
            </View>
          )}

          {suggestions.length > 0 && (
            <View style={[s.riskItem, { marginTop: 8 }]}>
              <Text style={[s.riskText, { color: t.accent.blue, fontWeight: fonts.bold, marginBottom: 4 }]}>
                Suggestions
              </Text>
              {suggestions.map((tip, i) => (
                <Text key={i} style={s.suggestionText}>
                  {'\u2022'} {tip}
                </Text>
              ))}
            </View>
          )}

          {concentrationRisks.length === 0 && suggestions.length === 0 && (
            <View style={s.riskItem}>
              <Text style={[s.riskText, { color: t.accent.green }]}>
                Portfolio is well diversified. No concentration risks detected.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
