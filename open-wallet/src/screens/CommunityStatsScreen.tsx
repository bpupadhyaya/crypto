import { fonts } from '../utils/theme';
/**
 * Community Stats Screen — Aggregate community statistics dashboard.
 *
 * "A community is only as strong as the weakest link in its chain
 *  of human value transfer."
 * — Human Constitution, Article V
 *
 * Shows community overview, channel health distribution, top metrics,
 * growth trends, economic activity, social stats, environmental impact,
 * governance participation, all with rich demo data.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

// ─── Community overview ───

interface OverviewStat {
  icon: string;
  label: string;
  value: string;
}

const DEMO_OVERVIEW: OverviewStat[] = [
  { icon: '\uD83C\uDD94', label: 'Total UIDs',             value: '24.2M' },
  { icon: '\uD83D\uDFE2', label: 'Active Members',         value: '18.6M' },
  { icon: '\uD83E\uDE99', label: 'OTK in Circulation',     value: '93.8M' },
  { icon: '\uD83D\uDCC8', label: 'Daily Transactions',     value: '1.4M' },
];

// ─── Channel health (bar chart data) ───

interface ChannelHealth {
  channel: string;
  ticker: string;
  color: string;
  totalOTK: number;
  pctOfTotal: number;
}

const DEMO_CHANNEL_HEALTH: ChannelHealth[] = [
  { channel: 'Nurture',    ticker: 'nOTK', color: '#ec4899', totalOTK: 28_400_000, pctOfTotal: 30 },
  { channel: 'Education',  ticker: 'eOTK', color: '#3b82f6', totalOTK: 22_100_000, pctOfTotal: 24 },
  { channel: 'Health',     ticker: 'hOTK', color: '#22c55e', totalOTK: 15_600_000, pctOfTotal: 17 },
  { channel: 'Community',  ticker: 'cOTK', color: '#f97316', totalOTK: 12_800_000, pctOfTotal: 14 },
  { channel: 'Economic',   ticker: 'xOTK', color: '#eab308', totalOTK: 9_200_000,  pctOfTotal: 10 },
  { channel: 'Governance', ticker: 'gOTK', color: '#8b5cf6', totalOTK: 5_700_000,  pctOfTotal: 5 },
];

// ─── Top metrics ───

interface TopMetric {
  icon: string;
  label: string;
  name: string;
  value: string;
}

const DEMO_TOP_METRICS: TopMetric[] = [
  { icon: '\uD83C\uDFD8\uFE0F', label: 'Most Active Community',   name: 'Portland Builders',    value: '42K members' },
  { icon: '\u262E\uFE0F',       label: 'Highest Peace Index',      name: 'Copenhagen Circle',    value: '94/100' },
  { icon: '\uD83D\uDE4F',       label: 'Most Gratitude Exchanged', name: 'Tokyo Elders Network',  value: '180K txns' },
  { icon: '\uD83C\uDF93',       label: 'Top Education Hub',        name: 'Nairobi Academy',       value: '12K graduates' },
];

// ─── Growth trends ───

interface GrowthTrend {
  label: string;
  current: string;
  prevQuarter: string;
  change: string;
  positive: boolean;
}

const DEMO_GROWTH: GrowthTrend[] = [
  { label: 'New Members',     current: '2.1M',  prevQuarter: '1.6M',  change: '+31%', positive: true },
  { label: 'Events Held',     current: '48K',   prevQuarter: '35K',   change: '+37%', positive: true },
  { label: 'Projects Started', current: '8.4K',  prevQuarter: '6.2K',  change: '+35%', positive: true },
  { label: 'Mentorships',     current: '124K',  prevQuarter: '98K',   change: '+27%', positive: true },
  { label: 'OTK Minted',      current: '12.4M', prevQuarter: '10.1M', change: '+23%', positive: true },
];

// ─── Economic activity ───

interface EconMetric {
  icon: string;
  label: string;
  value: string;
}

const DEMO_ECONOMIC: EconMetric[] = [
  { icon: '\uD83D\uDED2', label: 'Marketplace Transactions', value: '3.2M' },
  { icon: '\uD83D\uDCBC', label: 'Jobs Filled',              value: '186K' },
  { icon: '\uD83C\uDFED', label: 'Co-op Revenue (OTK)',      value: '4.8M' },
  { icon: '\uD83E\uDD1D', label: 'Peer-to-Peer Trades',      value: '890K' },
];

// ─── Social stats ───

const DEMO_SOCIAL: EconMetric[] = [
  { icon: '\uD83D\uDCAC', label: 'Messages Sent',    value: '42.6M' },
  { icon: '\uD83D\uDCD6', label: 'Stories Shared',    value: '1.8M' },
  { icon: '\uD83C\uDF89', label: 'Events Held',       value: '48K' },
  { icon: '\uD83D\uDC65', label: 'Groups Active',     value: '15.2K' },
];

// ─── Environmental ───

const DEMO_ENVIRONMENT: EconMetric[] = [
  { icon: '\uD83C\uDF33', label: 'Trees Planted',       value: '2.4M' },
  { icon: '\uD83C\uDF2C\uFE0F', label: 'CO\u2082 Saved (tonnes)', value: '186K' },
  { icon: '\uD83E\uDDF9', label: 'Cleanup Events',      value: '12.4K' },
  { icon: '\u267B\uFE0F', label: 'Recycling Rate',      value: '74%' },
];

// ─── Governance ───

const DEMO_GOVERNANCE: EconMetric[] = [
  { icon: '\uD83D\uDCDD', label: 'Proposals',              value: '842' },
  { icon: '\uD83D\uDDF3\uFE0F', label: 'Votes Cast',       value: '8.6M' },
  { icon: '\u2696\uFE0F', label: 'Amendments Ratified',    value: '24' },
  { icon: '\uD83C\uDFDB\uFE0F', label: 'Election Participation', value: '76%' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ─── Main Component ───

export function CommunityStatsScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const maxChannelOTK = useMemo(() => Math.max(...DEMO_CHANNEL_HEALTH.map(c => c.totalOTK)), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    demoTag: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    // Overview grid
    overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    overviewItem: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'center' },
    overviewIcon: { fontSize: fonts.xxxl, marginBottom: 6 },
    overviewValue: { color: t.accent.green, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    overviewLabel: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 4 },
    // Bar chart
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    barLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, width: 80 },
    barTrack: { flex: 1, height: 20, backgroundColor: t.border, borderRadius: 10, overflow: 'hidden', marginHorizontal: 8 },
    barFill: { height: 20, borderRadius: 10 },
    barValue: { color: t.text.muted, fontSize: fonts.xs, width: 50, textAlign: 'right' },
    barPct: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'right', width: 36 },
    // Top metrics
    topRow: { paddingVertical: 12 },
    topLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1 },
    topName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginTop: 4 },
    topValue: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 2 },
    topIcon: { fontSize: fonts.xl },
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    // Growth trends
    growthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    growthLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, flex: 1 },
    growthValues: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    growthCurrent: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, width: 56, textAlign: 'right' },
    growthPrev: { color: t.text.muted, fontSize: fonts.sm, width: 56, textAlign: 'right' },
    growthChange: { fontSize: fonts.sm, fontWeight: fonts.heavy, width: 50, textAlign: 'right' },
    // Metric grid (reused for economic, social, env, governance)
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricItem: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'center' },
    metricIcon: { fontSize: fonts.xxxl, marginBottom: 6 },
    metricValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    metricLabel: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 4 },
    footer: { height: 40 },
  }), [t]);

  const renderMetricGrid = (data: EconMetric[]) => (
    <View style={s.card}>
      <View style={s.metricGrid}>
        {data.map((m) => (
          <View key={m.label} style={s.metricItem}>
            <Text style={s.metricIcon}>{m.icon}</Text>
            <Text style={s.metricValue}>{m.value}</Text>
            <Text style={s.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Community Stats</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Community Overview */}
        <Text style={s.section}>{'\uD83C\uDF10'}  Community Overview</Text>
        <View style={s.card}>
          <View style={s.overviewGrid}>
            {DEMO_OVERVIEW.map((stat) => (
              <View key={stat.label} style={s.overviewItem}>
                <Text style={s.overviewIcon}>{stat.icon}</Text>
                <Text style={s.overviewValue}>{stat.value}</Text>
                <Text style={s.overviewLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Channel Health — Bar Chart */}
        <Text style={s.section}>{'\uD83D\uDCCA'}  Channel Health</Text>
        <View style={s.card}>
          {DEMO_CHANNEL_HEALTH.map((ch) => (
            <View key={ch.ticker} style={s.barRow}>
              <Text style={s.barLabel}>{ch.channel}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(ch.totalOTK / maxChannelOTK) * 100}%`, backgroundColor: ch.color }]} />
              </View>
              <Text style={s.barValue}>{formatNumber(ch.totalOTK)}</Text>
              <Text style={s.barPct}>{ch.pctOfTotal}%</Text>
            </View>
          ))}
        </View>

        {/* Top Metrics */}
        <Text style={s.section}>{'\uD83C\uDFC6'}  Top Metrics</Text>
        <View style={s.card}>
          {DEMO_TOP_METRICS.map((m, i) => (
            <View key={m.label}>
              <View style={s.topRow}>
                <View style={s.topHeader}>
                  <Text style={s.topLabel}>{m.label}</Text>
                  <Text style={s.topIcon}>{m.icon}</Text>
                </View>
                <Text style={s.topName}>{m.name}</Text>
                <Text style={s.topValue}>{m.value}</Text>
              </View>
              {i < DEMO_TOP_METRICS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* Growth Trends */}
        <Text style={s.section}>{'\uD83D\uDCC8'}  Growth Trends</Text>
        <View style={s.card}>
          {/* Column headers */}
          <View style={[s.growthRow, { paddingVertical: 4 }]}>
            <Text style={[s.growthLabel, { color: t.text.muted, fontSize: fonts.xs }]}>Metric</Text>
            <View style={s.growthValues}>
              <Text style={[s.growthCurrent, { color: t.text.muted, fontSize: fonts.xs }]}>Current</Text>
              <Text style={[s.growthPrev, { fontSize: fonts.xs }]}>Prev Qtr</Text>
              <Text style={[s.growthChange, { color: t.text.muted, fontSize: fonts.xs }]}>Change</Text>
            </View>
          </View>
          <View style={s.divider} />
          {DEMO_GROWTH.map((g, i) => (
            <View key={g.label}>
              <View style={s.growthRow}>
                <Text style={s.growthLabel}>{g.label}</Text>
                <View style={s.growthValues}>
                  <Text style={s.growthCurrent}>{g.current}</Text>
                  <Text style={s.growthPrev}>{g.prevQuarter}</Text>
                  <Text style={[s.growthChange, { color: g.positive ? t.accent.green : t.accent.red }]}>
                    {g.change}
                  </Text>
                </View>
              </View>
              {i < DEMO_GROWTH.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* Economic Activity */}
        <Text style={s.section}>{'\uD83D\uDCB0'}  Economic Activity</Text>
        {renderMetricGrid(DEMO_ECONOMIC)}

        {/* Social */}
        <Text style={s.section}>{'\uD83D\uDCAC'}  Social</Text>
        {renderMetricGrid(DEMO_SOCIAL)}

        {/* Environmental */}
        <Text style={s.section}>{'\uD83C\uDF3F'}  Environmental</Text>
        {renderMetricGrid(DEMO_ENVIRONMENT)}

        {/* Governance */}
        <Text style={s.section}>{'\uD83C\uDFDB\uFE0F'}  Governance</Text>
        {renderMetricGrid(DEMO_GOVERNANCE)}

        <Text style={s.demoTag}>DEMO DATA \u2014 AGGREGATE COMMUNITY STATISTICS</Text>
        <View style={s.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}
