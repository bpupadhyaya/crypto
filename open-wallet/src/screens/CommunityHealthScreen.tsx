import { fonts } from '../utils/theme';
/**
 * Community Health Dashboard — Article V, Section 3 of The Human Constitution.
 *
 * "Communities with negative trends get visibility — resources flow to help."
 *
 * This is the self-correcting feedback loop: visualize community-level
 * aggregate OTK trends so that struggling communities are identified
 * and supported, not punished.
 *
 * Features:
 * - Regional breakdown: net OTK trend (positive vs negative) per region
 * - Channel health: which channels are thriving, which are declining
 * - Alert zones: communities trending negative need attention
 * - Leaderboard: communities with highest positive contribution
 * - Demo mode with sample regional data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface RegionData {
  name: string;
  code: string;
  population: number;
  totalPositiveOTK: number;
  totalNegativeOTK: number;
  netOTK: number;
  trend: 'rising' | 'stable' | 'declining';
  channels: Record<string, { positive: number; negative: number }>;
  alertLevel: 'none' | 'watch' | 'alert' | 'critical';
}

interface ChannelHealth {
  channel: string;
  label: string;
  icon: string;
  color: string;
  globalPositive: number;
  globalNegative: number;
  netTrend: 'rising' | 'stable' | 'declining';
}

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  nurture:    { label: 'Nurture',    icon: '\u{1F49B}', color: '#ef4444' },
  education:  { label: 'Education',  icon: '\u{1F4DA}', color: '#3b82f6' },
  health:     { label: 'Health',     icon: '\u{1FA7A}', color: '#22c55e' },
  community:  { label: 'Community',  icon: '\u{1F91D}', color: '#8b5cf6' },
  economic:   { label: 'Economic',   icon: '\u{1F4B0}', color: '#f7931a' },
  governance: { label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
};

const ALERT_COLORS: Record<string, string> = {
  none: '#22c55e',
  watch: '#eab308',
  alert: '#f97316',
  critical: '#ef4444',
};

const ALERT_LABELS: Record<string, string> = {
  none: 'Healthy',
  watch: 'Watch',
  alert: 'Needs Help',
  critical: 'Critical',
};

const TREND_ICONS: Record<string, string> = {
  rising: '\u2191',
  stable: '\u2192',
  declining: '\u2193',
};

const TREND_COLORS_FN = (t: ReturnType<typeof useTheme>) => ({
  rising: t.accent.green,
  stable: t.accent.yellow,
  declining: t.accent.red,
});

const DEMO_REGIONS: RegionData[] = [
  {
    name: 'South Asia', code: 'SA', population: 1_900_000,
    totalPositiveOTK: 45_000_000, totalNegativeOTK: 2_100_000, netOTK: 42_900_000,
    trend: 'rising',
    channels: {
      nurture: { positive: 15_000_000, negative: 500_000 },
      education: { positive: 12_000_000, negative: 300_000 },
      health: { positive: 8_000_000, negative: 800_000 },
      community: { positive: 5_000_000, negative: 200_000 },
      economic: { positive: 3_000_000, negative: 200_000 },
      governance: { positive: 2_000_000, negative: 100_000 },
    },
    alertLevel: 'none',
  },
  {
    name: 'East Africa', code: 'EA', population: 450_000,
    totalPositiveOTK: 8_500_000, totalNegativeOTK: 1_200_000, netOTK: 7_300_000,
    trend: 'rising',
    channels: {
      nurture: { positive: 3_000_000, negative: 200_000 },
      education: { positive: 2_500_000, negative: 150_000 },
      health: { positive: 1_500_000, negative: 500_000 },
      community: { positive: 800_000, negative: 150_000 },
      economic: { positive: 500_000, negative: 100_000 },
      governance: { positive: 200_000, negative: 100_000 },
    },
    alertLevel: 'none',
  },
  {
    name: 'Central America', code: 'CA', population: 180_000,
    totalPositiveOTK: 3_200_000, totalNegativeOTK: 900_000, netOTK: 2_300_000,
    trend: 'stable',
    channels: {
      nurture: { positive: 1_000_000, negative: 200_000 },
      education: { positive: 800_000, negative: 100_000 },
      health: { positive: 600_000, negative: 300_000 },
      community: { positive: 400_000, negative: 100_000 },
      economic: { positive: 300_000, negative: 150_000 },
      governance: { positive: 100_000, negative: 50_000 },
    },
    alertLevel: 'watch',
  },
  {
    name: 'Northern Europe', code: 'NE', population: 320_000,
    totalPositiveOTK: 12_000_000, totalNegativeOTK: 400_000, netOTK: 11_600_000,
    trend: 'rising',
    channels: {
      nurture: { positive: 4_000_000, negative: 50_000 },
      education: { positive: 3_500_000, negative: 50_000 },
      health: { positive: 2_500_000, negative: 100_000 },
      community: { positive: 1_200_000, negative: 50_000 },
      economic: { positive: 500_000, negative: 100_000 },
      governance: { positive: 300_000, negative: 50_000 },
    },
    alertLevel: 'none',
  },
  {
    name: 'Sahel Region', code: 'SR', population: 120_000,
    totalPositiveOTK: 1_800_000, totalNegativeOTK: 1_500_000, netOTK: 300_000,
    trend: 'declining',
    channels: {
      nurture: { positive: 500_000, negative: 400_000 },
      education: { positive: 400_000, negative: 350_000 },
      health: { positive: 300_000, negative: 450_000 },
      community: { positive: 300_000, negative: 150_000 },
      economic: { positive: 200_000, negative: 100_000 },
      governance: { positive: 100_000, negative: 50_000 },
    },
    alertLevel: 'critical',
  },
  {
    name: 'Southeast Asia', code: 'SEA', population: 680_000,
    totalPositiveOTK: 15_000_000, totalNegativeOTK: 2_000_000, netOTK: 13_000_000,
    trend: 'rising',
    channels: {
      nurture: { positive: 5_000_000, negative: 300_000 },
      education: { positive: 4_000_000, negative: 200_000 },
      health: { positive: 3_000_000, negative: 800_000 },
      community: { positive: 1_500_000, negative: 300_000 },
      economic: { positive: 1_000_000, negative: 200_000 },
      governance: { positive: 500_000, negative: 200_000 },
    },
    alertLevel: 'none',
  },
  {
    name: 'Appalachia', code: 'AP', population: 95_000,
    totalPositiveOTK: 1_200_000, totalNegativeOTK: 800_000, netOTK: 400_000,
    trend: 'declining',
    channels: {
      nurture: { positive: 350_000, negative: 200_000 },
      education: { positive: 300_000, negative: 180_000 },
      health: { positive: 200_000, negative: 250_000 },
      community: { positive: 200_000, negative: 80_000 },
      economic: { positive: 100_000, negative: 60_000 },
      governance: { positive: 50_000, negative: 30_000 },
    },
    alertLevel: 'alert',
  },
];

type DashboardTab = 'regions' | 'channels' | 'alerts' | 'leaderboard';

function formatOTK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function CommunityHealthScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('regions');
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);

  const trendColors = useMemo(() => TREND_COLORS_FN(t), [t]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    regionName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    netOTK: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 4 },
    alertBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    alertText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    trendText: { fontSize: fonts.sm, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barPositive: { height: 8, borderRadius: 4 },
    channelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    channelIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    channelLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.md },
    leaderRank: { color: t.text.muted, fontSize: fonts.xl, fontWeight: fonts.heavy, width: 30 },
  }), [t]);

  const regions = demoMode ? DEMO_REGIONS : [];

  // Derive channel health from region data
  const channelHealth: ChannelHealth[] = useMemo(() => {
    const channels = Object.keys(CHANNEL_META);
    return channels.map(ch => {
      const meta = CHANNEL_META[ch];
      let globalPos = 0, globalNeg = 0;
      regions.forEach(r => {
        if (r.channels[ch]) {
          globalPos += r.channels[ch].positive;
          globalNeg += r.channels[ch].negative;
        }
      });
      const ratio = globalPos > 0 ? globalNeg / globalPos : 0;
      const trend: 'rising' | 'stable' | 'declining' = ratio < 0.05 ? 'rising' : ratio < 0.15 ? 'stable' : 'declining';
      return { channel: ch, ...meta, globalPositive: globalPos, globalNegative: globalNeg, netTrend: trend };
    });
  }, [regions]);

  // Alert zones: regions with alert or critical status
  const alertZones = useMemo(() => regions.filter(r => r.alertLevel === 'alert' || r.alertLevel === 'critical'), [regions]);

  // Leaderboard: sorted by netOTK descending
  const leaderboard = useMemo(() => [...regions].sort((a, b) => b.netOTK - a.netOTK), [regions]);

  // Global aggregates
  const totalPositive = useMemo(() => regions.reduce((s, r) => s + r.totalPositiveOTK, 0), [regions]);
  const totalNegative = useMemo(() => regions.reduce((s, r) => s + r.totalNegativeOTK, 0), [regions]);
  const totalPop = useMemo(() => regions.reduce((s, r) => s + r.population, 0), [regions]);

  // --- Region Detail ---
  if (selectedRegion) {
    const r = selectedRegion;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>{r.name}</Text>
          <TouchableOpacity onPress={() => setSelectedRegion(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={[st.alertBadge, { backgroundColor: ALERT_COLORS[r.alertLevel] }]}>
            <Text style={st.alertText}>{ALERT_LABELS[r.alertLevel]}</Text>
          </View>

          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>+{formatOTK(r.totalPositiveOTK)}</Text>
              <Text style={st.summaryLabel}>Positive OTK</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.red }]}>-{formatOTK(r.totalNegativeOTK)}</Text>
              <Text style={st.summaryLabel}>Negative OTK</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: trendColors[r.trend] }]}>{formatOTK(r.netOTK)}</Text>
              <Text style={st.summaryLabel}>Net OTK</Text>
            </View>
          </View>

          <View style={st.card}>
            <View style={st.row}><Text style={st.label}>Population (UIDs)</Text><Text style={st.val}>{r.population.toLocaleString()}</Text></View>
            <View style={st.row}><Text style={st.label}>OTK per Capita</Text><Text style={st.val}>{(r.netOTK / r.population).toFixed(1)}</Text></View>
            <View style={st.row}>
              <Text style={st.label}>Trend</Text>
              <Text style={[st.trendText, { color: trendColors[r.trend] }]}>{TREND_ICONS[r.trend]} {r.trend.charAt(0).toUpperCase() + r.trend.slice(1)}</Text>
            </View>
          </View>

          <Text style={st.section}>Channel Breakdown</Text>
          {Object.entries(r.channels).map(([ch, data]) => {
            const meta = CHANNEL_META[ch];
            if (!meta) return null;
            const total = data.positive + data.negative;
            const pct = total > 0 ? (data.positive / total) * 100 : 100;
            return (
              <View key={ch} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: fonts.xl, marginRight: 8 }}>{meta.icon}</Text>
                  <Text style={{ color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 }}>{meta.label}</Text>
                  <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold }}>+{formatOTK(data.positive)}</Text>
                  <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginHorizontal: 4 }}>/</Text>
                  <Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold }}>-{formatOTK(data.negative)}</Text>
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barPositive, { width: `${pct}%`, backgroundColor: meta.color }]} />
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main Dashboard ---
  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Community Health</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          The self-correcting feedback loop: communities trending negative get visibility so resources flow to help, not punish.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>+{formatOTK(totalPositive)}</Text>
              <Text style={st.summaryLabel}>Global Positive</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.red }]}>-{formatOTK(totalNegative)}</Text>
              <Text style={st.summaryLabel}>Global Negative</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.text.primary }]}>{totalPop.toLocaleString()}</Text>
              <Text style={st.summaryLabel}>Total UIDs</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['regions', 'channels', 'alerts', 'leaderboard'] as DashboardTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'regions' ? 'Regions' : tab === 'channels' ? 'Channels' : tab === 'alerts' ? `Alerts (${alertZones.length})` : 'Leaders'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Regions Tab */}
        {activeTab === 'regions' && (
          regions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see sample community data.</Text>
          ) : regions.map(r => {
            const total = r.totalPositiveOTK + r.totalNegativeOTK;
            const posPct = total > 0 ? (r.totalPositiveOTK / total) * 100 : 100;
            return (
              <TouchableOpacity key={r.code} style={st.card} onPress={() => setSelectedRegion(r)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={st.regionName}>{r.name}</Text>
                  <View style={[st.alertBadge, { backgroundColor: ALERT_COLORS[r.alertLevel], marginBottom: 0 }]}>
                    <Text style={st.alertText}>{ALERT_LABELS[r.alertLevel]}</Text>
                  </View>
                </View>
                <Text style={[st.netOTK, { color: r.netOTK >= 0 ? t.accent.green : t.accent.red }]}>
                  {r.netOTK >= 0 ? '+' : ''}{formatOTK(r.netOTK)} OTK
                </Text>
                <View style={st.barContainer}>
                  <View style={[st.barPositive, { width: `${posPct}%`, backgroundColor: t.accent.green }]} />
                </View>
                <View style={st.row}>
                  <Text style={st.label}>UIDs: {r.population.toLocaleString()}</Text>
                  <Text style={[st.trendText, { color: trendColors[r.trend] }]}>{TREND_ICONS[r.trend]} {r.trend}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          channelHealth.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see channel health data.</Text>
          ) : channelHealth.map(ch => {
            const total = ch.globalPositive + ch.globalNegative;
            const posPct = total > 0 ? (ch.globalPositive / total) * 100 : 100;
            return (
              <View key={ch.channel} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={[st.channelIcon, { backgroundColor: ch.color + '20' }]}>
                    <Text style={{ fontSize: fonts.lg }}>{ch.icon}</Text>
                  </View>
                  <Text style={st.channelLabel}>{ch.label}</Text>
                  <Text style={[st.trendText, { color: trendColors[ch.netTrend] }]}>{TREND_ICONS[ch.netTrend]}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Positive</Text>
                  <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold }}>+{formatOTK(ch.globalPositive)}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Negative</Text>
                  <Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold }}>-{formatOTK(ch.globalNegative)}</Text>
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barPositive, { width: `${posPct}%`, backgroundColor: ch.color }]} />
                </View>
              </View>
            );
          })
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          alertZones.length === 0 ? (
            <View style={st.card}>
              <Text style={{ color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 4 }}>All Communities Healthy</Text>
              <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' }}>No communities currently need intervention.</Text>
            </View>
          ) : (
            <>
              <Text style={st.subtitle}>
                These communities are trending negative and need support. Resources should flow toward them.
              </Text>
              {alertZones.map(r => (
                <TouchableOpacity key={r.code} style={[st.card, { borderWidth: 1, borderColor: ALERT_COLORS[r.alertLevel] + '50' }]}
                  onPress={() => setSelectedRegion(r)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={st.regionName}>{r.name}</Text>
                    <View style={[st.alertBadge, { backgroundColor: ALERT_COLORS[r.alertLevel], marginBottom: 0 }]}>
                      <Text style={st.alertText}>{ALERT_LABELS[r.alertLevel]}</Text>
                    </View>
                  </View>
                  <Text style={[st.netOTK, { color: t.accent.red }]}>Net: {formatOTK(r.netOTK)} OTK</Text>
                  <View style={st.row}>
                    <Text style={st.label}>Negative ratio</Text>
                    <Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold }}>
                      {((r.totalNegativeOTK / (r.totalPositiveOTK + r.totalNegativeOTK)) * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Worst channel</Text>
                    <Text style={st.val}>
                      {(() => {
                        let worst = '', worstRatio = 0;
                        Object.entries(r.channels).forEach(([ch, d]) => {
                          const ratio = d.negative / (d.positive + d.negative);
                          if (ratio > worstRatio) { worstRatio = ratio; worst = ch; }
                        });
                        const meta = CHANNEL_META[worst];
                        return meta ? `${meta.icon} ${meta.label} (${(worstRatio * 100).toFixed(0)}% neg)` : worst;
                      })()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          leaderboard.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see community leaderboard.</Text>
          ) : leaderboard.map((r, i) => (
            <TouchableOpacity key={r.code} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setSelectedRegion(r)}>
              <Text style={st.leaderRank}>#{i + 1}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={st.regionName}>{r.name}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                  <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold }}>+{formatOTK(r.totalPositiveOTK)}</Text>
                  <Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold }}>-{formatOTK(r.totalNegativeOTK)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[st.netOTK, { color: t.accent.green, marginBottom: 0 }]}>{formatOTK(r.netOTK)}</Text>
                <Text style={[st.trendText, { color: trendColors[r.trend], fontSize: fonts.xs }]}>{TREND_ICONS[r.trend]} {r.trend}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample community health data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
