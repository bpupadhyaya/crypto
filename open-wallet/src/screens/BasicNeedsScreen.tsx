import { fonts } from '../utils/theme';
/**
 * Basic Needs Dashboard — Article I, Section 3 of The Human Constitution.
 *
 * "When people's basic needs are met, they are resilient against
 *  manipulation and exploitation."
 *
 * Regional dashboard showing needs being met vs unmet, with correlation
 * to peace indices — directly validating the Constitution's thesis.
 *
 * Features:
 * - Needs Fulfillment Score per region (0-100)
 * - Category breakdown: which needs are most/least met
 * - Trend: improving or declining over time
 * - Correlation with Peace Index
 * - Call to action: "Your community needs X — can you help?"
 * - Demo mode
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

type DashboardTab = 'overview' | 'breakdown' | 'trends' | 'correlation';

interface NeedCategory {
  key: string;
  label: string;
  icon: string;
}

interface RegionDashboard {
  name: string;
  code: string;
  population: number;
  fulfillmentScore: number;
  peaceIndex: number;
  trend: 'improving' | 'stable' | 'declining';
  trendDelta: number;
  categories: Record<string, number>;
  callToAction: string;
}

interface TrendPoint {
  month: string;
  regions: Record<string, { fulfillment: number; peace: number }>;
}

const NEED_CATEGORIES: NeedCategory[] = [
  { key: 'food', label: 'Food Security', icon: '\u{1F33E}' },
  { key: 'housing', label: 'Housing', icon: '\u{1F3E0}' },
  { key: 'healthcare', label: 'Healthcare', icon: '\u{1FA7A}' },
  { key: 'education', label: 'Education', icon: '\u{1F4DA}' },
  { key: 'employment', label: 'Employment', icon: '\u{1F4BC}' },
  { key: 'community', label: 'Community', icon: '\u{1F91D}' },
  { key: 'safety', label: 'Safety', icon: '\u{1F6E1}' },
  { key: 'mental', label: 'Mental Health', icon: '\u{1F9E0}' },
];

const DEMO_REGIONS: RegionDashboard[] = [
  {
    name: 'Northern Europe', code: 'NE', population: 320_000,
    fulfillmentScore: 88, peaceIndex: 91, trend: 'stable', trendDelta: 0.5,
    categories: { food: 94, housing: 86, healthcare: 92, education: 96, employment: 82, community: 84, safety: 90, mental: 78 },
    callToAction: 'Mental health support needed — volunteer counselors welcome',
  },
  {
    name: 'Southeast Asia', code: 'SEA', population: 680_000,
    fulfillmentScore: 67, peaceIndex: 71, trend: 'improving', trendDelta: 3.2,
    categories: { food: 72, housing: 64, healthcare: 60, education: 68, employment: 62, community: 80, safety: 66, mental: 60 },
    callToAction: 'Healthcare volunteers needed in rural areas',
  },
  {
    name: 'South Asia', code: 'SA', population: 1_900_000,
    fulfillmentScore: 60, peaceIndex: 62, trend: 'improving', trendDelta: 4.1,
    categories: { food: 64, housing: 56, healthcare: 50, education: 62, employment: 58, community: 76, safety: 60, mental: 52 },
    callToAction: 'Healthcare and education volunteers critically needed',
  },
  {
    name: 'Central America', code: 'CA', population: 180_000,
    fulfillmentScore: 51, peaceIndex: 48, trend: 'stable', trendDelta: -0.3,
    categories: { food: 56, housing: 50, healthcare: 46, education: 54, employment: 44, community: 64, safety: 40, mental: 50 },
    callToAction: 'Safety and employment programs urgently needed',
  },
  {
    name: 'East Africa', code: 'EA', population: 450_000,
    fulfillmentScore: 46, peaceIndex: 45, trend: 'improving', trendDelta: 2.8,
    categories: { food: 42, housing: 40, healthcare: 36, education: 46, employment: 38, community: 70, safety: 44, mental: 48 },
    callToAction: 'Healthcare and food security are the biggest gaps',
  },
  {
    name: 'Appalachia', code: 'AP', population: 95_000,
    fulfillmentScore: 56, peaceIndex: 55, trend: 'declining', trendDelta: -1.8,
    categories: { food: 60, housing: 64, healthcare: 48, education: 56, employment: 42, community: 58, safety: 70, mental: 46 },
    callToAction: 'Employment and mental health support needed urgently',
  },
  {
    name: 'Sahel Region', code: 'SR', population: 120_000,
    fulfillmentScore: 35, peaceIndex: 28, trend: 'declining', trendDelta: -3.5,
    categories: { food: 30, housing: 36, healthcare: 26, education: 32, employment: 28, community: 56, safety: 34, mental: 38 },
    callToAction: 'CRITICAL: All basic needs categories below threshold',
  },
];

const DEMO_TRENDS: TrendPoint[] = [
  {
    month: 'Oct 2025',
    regions: {
      NE: { fulfillment: 87, peace: 91 }, SEA: { fulfillment: 62, peace: 68 },
      SA: { fulfillment: 54, peace: 56 }, CA: { fulfillment: 52, peace: 49 },
      EA: { fulfillment: 41, peace: 41 }, AP: { fulfillment: 59, peace: 58 },
      SR: { fulfillment: 40, peace: 33 },
    },
  },
  {
    month: 'Nov 2025',
    regions: {
      NE: { fulfillment: 87, peace: 91 }, SEA: { fulfillment: 63, peace: 69 },
      SA: { fulfillment: 55, peace: 57 }, CA: { fulfillment: 52, peace: 49 },
      EA: { fulfillment: 42, peace: 42 }, AP: { fulfillment: 58, peace: 57 },
      SR: { fulfillment: 39, peace: 32 },
    },
  },
  {
    month: 'Dec 2025',
    regions: {
      NE: { fulfillment: 88, peace: 91 }, SEA: { fulfillment: 64, peace: 69 },
      SA: { fulfillment: 56, peace: 58 }, CA: { fulfillment: 51, peace: 48 },
      EA: { fulfillment: 43, peace: 43 }, AP: { fulfillment: 58, peace: 57 },
      SR: { fulfillment: 38, peace: 31 },
    },
  },
  {
    month: 'Jan 2026',
    regions: {
      NE: { fulfillment: 88, peace: 91 }, SEA: { fulfillment: 65, peace: 70 },
      SA: { fulfillment: 57, peace: 60 }, CA: { fulfillment: 51, peace: 48 },
      EA: { fulfillment: 44, peace: 44 }, AP: { fulfillment: 57, peace: 56 },
      SR: { fulfillment: 37, peace: 30 },
    },
  },
  {
    month: 'Feb 2026',
    regions: {
      NE: { fulfillment: 88, peace: 91 }, SEA: { fulfillment: 66, peace: 70 },
      SA: { fulfillment: 59, peace: 61 }, CA: { fulfillment: 51, peace: 48 },
      EA: { fulfillment: 45, peace: 44 }, AP: { fulfillment: 57, peace: 56 },
      SR: { fulfillment: 36, peace: 29 },
    },
  },
  {
    month: 'Mar 2026',
    regions: {
      NE: { fulfillment: 88, peace: 91 }, SEA: { fulfillment: 67, peace: 71 },
      SA: { fulfillment: 60, peace: 62 }, CA: { fulfillment: 51, peace: 48 },
      EA: { fulfillment: 46, peace: 45 }, AP: { fulfillment: 56, peace: 55 },
      SR: { fulfillment: 35, peace: 28 },
    },
  },
];

const TREND_ICONS: Record<string, string> = {
  improving: '\u2191',
  stable: '\u2192',
  declining: '\u2193',
};

function fulfillmentColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export function BasicNeedsScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedRegion, setSelectedRegion] = useState<RegionDashboard | null>(null);

  const trendColors = useMemo(() => ({
    improving: t.accent.green,
    stable: t.accent.yellow,
    declining: t.accent.red,
  }), [t]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    regionName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 2 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    scoreCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    scoreNum: { fontSize: 18, fontWeight: fonts.heavy, color: '#fff' },
    trendText: { fontSize: 13, fontWeight: fonts.bold },
    alertCard: { backgroundColor: t.accent.red + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.red + '30' },
    ctaCard: { backgroundColor: t.accent.blue + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.blue + '30' },
    ctaTitle: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold, marginBottom: 4 },
    ctaText: { color: t.text.muted, fontSize: 12, lineHeight: 18 },
    correlationCard: { backgroundColor: t.accent.green + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.green + '30' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 15 },
  }), [t]);

  const regions = demoMode ? DEMO_REGIONS : [];
  const trends = demoMode ? DEMO_TRENDS : [];

  const sortedRegions = useMemo(() => [...regions].sort((a, b) => a.fulfillmentScore - b.fulfillmentScore), [regions]);
  const globalAvg = useMemo(() => {
    if (regions.length === 0) return 0;
    return regions.reduce((s, r) => s + r.fulfillmentScore, 0) / regions.length;
  }, [regions]);
  const globalPeace = useMemo(() => {
    if (regions.length === 0) return 0;
    return regions.reduce((s, r) => s + r.peaceIndex, 0) / regions.length;
  }, [regions]);
  const criticalCount = useMemo(() => regions.filter(r => r.fulfillmentScore < 40).length, [regions]);

  // Region detail view
  if (selectedRegion) {
    const r = selectedRegion;
    const sortedCats = Object.entries(r.categories).sort(([, a], [, b]) => a - b);
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>{r.name}</Text>
          <TouchableOpacity onPress={() => setSelectedRegion(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: fulfillmentColor(r.fulfillmentScore) }]}>{r.fulfillmentScore}</Text>
              <Text style={st.summaryLabel}>Fulfillment Score</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{r.peaceIndex}</Text>
              <Text style={st.summaryLabel}>Peace Index</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: trendColors[r.trend] }]}>
                {r.trendDelta > 0 ? '+' : ''}{r.trendDelta.toFixed(1)}
              </Text>
              <Text style={st.summaryLabel}>6-Month Change</Text>
            </View>
          </View>

          <View style={st.card}>
            <View style={st.row}>
              <Text style={st.label}>Population</Text>
              <Text style={st.val}>{r.population.toLocaleString()}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Trend</Text>
              <Text style={[st.trendText, { color: trendColors[r.trend] }]}>
                {TREND_ICONS[r.trend]} {r.trend.charAt(0).toUpperCase() + r.trend.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={st.section}>Category Breakdown (least met first)</Text>
          {sortedCats.map(([key, score]) => {
            const cat = NEED_CATEGORIES.find(c => c.key === key);
            return (
              <View key={key} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{cat?.icon ?? '\u{2753}'}</Text>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 }}>{cat?.label ?? key}</Text>
                  <Text style={{ color: fulfillmentColor(score), fontSize: 16, fontWeight: fonts.heavy }}>{score}</Text>
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barFill, { width: `${score}%`, backgroundColor: fulfillmentColor(score) }]} />
                </View>
              </View>
            );
          })}

          <View style={st.ctaCard}>
            <Text style={st.ctaTitle}>Your Community Needs You</Text>
            <Text style={st.ctaText}>{r.callToAction}</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Basic Needs Dashboard</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Article I, Section 3: Met needs create peace. This dashboard tracks fulfillment scores across regions and shows the direct correlation between needs being met and community peace.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: fulfillmentColor(globalAvg) }]}>{globalAvg.toFixed(0)}</Text>
              <Text style={st.summaryLabel}>Global Avg Score</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{globalPeace.toFixed(0)}</Text>
              <Text style={st.summaryLabel}>Global Peace Avg</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: criticalCount > 0 ? t.accent.red : t.accent.green }]}>{criticalCount}</Text>
              <Text style={st.summaryLabel}>Critical Regions</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['overview', 'breakdown', 'trends', 'correlation'] as DashboardTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'overview' ? 'Overview' : tab === 'breakdown' ? 'Categories' : tab === 'trends' ? 'Trends' : 'Peace'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          regions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see basic needs data.</Text>
          ) : (
            <>
              {/* Critical regions first */}
              {sortedRegions.filter(r => r.fulfillmentScore < 40).length > 0 && (
                <>
                  <Text style={st.section}>Critical — Needs Unmet</Text>
                  {sortedRegions.filter(r => r.fulfillmentScore < 40).map(r => (
                    <TouchableOpacity key={r.code} style={st.alertCard} onPress={() => setSelectedRegion(r)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: t.accent.red, fontSize: 16, fontWeight: fonts.bold }}>{r.name}</Text>
                        <View style={[st.scoreCircle, { backgroundColor: fulfillmentColor(r.fulfillmentScore) }]}>
                          <Text style={st.scoreNum}>{r.fulfillmentScore}</Text>
                        </View>
                      </View>
                      <View style={st.barContainer}>
                        <View style={[st.barFill, { width: `${r.fulfillmentScore}%`, backgroundColor: fulfillmentColor(r.fulfillmentScore) }]} />
                      </View>
                      <View style={st.row}>
                        <Text style={st.label}>Peace Index: {r.peaceIndex}/100</Text>
                        <Text style={[st.trendText, { color: trendColors[r.trend], fontSize: 12 }]}>
                          {TREND_ICONS[r.trend]} {r.trend}
                        </Text>
                      </View>
                      <Text style={{ color: t.accent.red, fontSize: 11, fontWeight: fonts.semibold, marginTop: 4 }}>
                        {r.callToAction}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={st.section}>All Regions (lowest first)</Text>
              {sortedRegions.map(r => (
                <TouchableOpacity key={r.code} style={st.card} onPress={() => setSelectedRegion(r)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.regionName}>{r.name}</Text>
                      <Text style={{ color: t.text.muted, fontSize: 11 }}>
                        Pop: {r.population.toLocaleString()} | Peace: {r.peaceIndex}
                      </Text>
                    </View>
                    <View style={[st.scoreCircle, { backgroundColor: fulfillmentColor(r.fulfillmentScore) }]}>
                      <Text style={st.scoreNum}>{r.fulfillmentScore}</Text>
                    </View>
                  </View>
                  <View style={st.barContainer}>
                    <View style={[st.barFill, { width: `${r.fulfillmentScore}%`, backgroundColor: fulfillmentColor(r.fulfillmentScore) }]} />
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Trend</Text>
                    <Text style={[st.trendText, { color: trendColors[r.trend], fontSize: 12 }]}>
                      {TREND_ICONS[r.trend]} {r.trendDelta > 0 ? '+' : ''}{r.trendDelta.toFixed(1)} pts
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )
        )}

        {/* Category Breakdown Tab */}
        {activeTab === 'breakdown' && (
          regions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see category breakdowns.</Text>
          ) : (
            <>
              {NEED_CATEGORIES.map(cat => {
                const regionScores = regions.map(r => ({ name: r.name, code: r.code, score: r.categories[cat.key] ?? 0 }))
                  .sort((a, b) => a.score - b.score);
                const avg = regionScores.reduce((s, r) => s + r.score, 0) / regionScores.length;
                return (
                  <View key={cat.key} style={st.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{cat.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.bold }}>{cat.label}</Text>
                        <Text style={{ color: t.text.muted, fontSize: 11 }}>Global average: {avg.toFixed(0)}/100</Text>
                      </View>
                      <View style={[st.scoreCircle, { backgroundColor: fulfillmentColor(avg), width: 42, height: 42, borderRadius: 21 }]}>
                        <Text style={[st.scoreNum, { fontSize: 14 }]}>{avg.toFixed(0)}</Text>
                      </View>
                    </View>
                    {regionScores.map(rs => (
                      <View key={rs.code} style={{ marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ color: t.text.muted, fontSize: 11 }}>{rs.name}</Text>
                          <Text style={{ color: fulfillmentColor(rs.score), fontSize: 11, fontWeight: fonts.bold }}>{rs.score}</Text>
                        </View>
                        <View style={st.barContainer}>
                          <View style={[st.barFill, { width: `${rs.score}%`, backgroundColor: fulfillmentColor(rs.score) }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          trends.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see trends data.</Text>
          ) : (
            <>
              <Text style={st.section}>6-Month Fulfillment Trends</Text>
              {regions.map(region => {
                const regionTrend = trends.map(tp => ({
                  month: tp.month,
                  score: tp.regions[region.code]?.fulfillment ?? 0,
                }));
                return (
                  <View key={region.code} style={st.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.bold }}>{region.name}</Text>
                      <Text style={[st.trendText, { color: trendColors[region.trend], fontSize: 12 }]}>
                        {TREND_ICONS[region.trend]} {region.trendDelta > 0 ? '+' : ''}{region.trendDelta.toFixed(1)} pts
                      </Text>
                    </View>
                    {regionTrend.map(pt => (
                      <View key={pt.month} style={{ marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ color: t.text.muted, fontSize: 10 }}>{pt.month}</Text>
                          <Text style={{ color: fulfillmentColor(pt.score), fontSize: 10, fontWeight: fonts.bold }}>{pt.score}</Text>
                        </View>
                        <View style={st.barContainer}>
                          <View style={[st.barFill, { width: `${pt.score}%`, backgroundColor: fulfillmentColor(pt.score) }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )
        )}

        {/* Correlation Tab */}
        {activeTab === 'correlation' && (
          regions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see peace correlation data.</Text>
          ) : (
            <>
              <View style={st.correlationCard}>
                <Text style={{ color: t.accent.green, fontSize: 15, fontWeight: fonts.heavy, marginBottom: 6 }}>
                  Met Needs = Peace
                </Text>
                <Text style={{ color: t.text.muted, fontSize: 13, lineHeight: 20 }}>
                  Regions with higher needs fulfillment have higher peace scores. This directly validates Article I, Section 3 of The Human Constitution: "When people's basic needs are met, they are resilient against manipulation and exploitation."
                </Text>
              </View>

              <Text style={st.section}>Fulfillment vs Peace Index</Text>
              {sortedRegions.map(r => (
                <View key={r.code} style={st.card}>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8 }}>{r.name}</Text>
                  <View style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ color: t.text.muted, fontSize: 11 }}>Needs Fulfillment</Text>
                      <Text style={{ color: fulfillmentColor(r.fulfillmentScore), fontSize: 11, fontWeight: fonts.bold }}>{r.fulfillmentScore}/100</Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${r.fulfillmentScore}%`, backgroundColor: fulfillmentColor(r.fulfillmentScore) }]} />
                    </View>
                  </View>
                  <View style={{ marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ color: t.text.muted, fontSize: 11 }}>Peace Index</Text>
                      <Text style={{ color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold }}>{r.peaceIndex}/100</Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${r.peaceIndex}%`, backgroundColor: t.accent.blue }]} />
                    </View>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Correlation gap</Text>
                    <Text style={{ color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold }}>
                      {Math.abs(r.fulfillmentScore - r.peaceIndex)} pts
                    </Text>
                  </View>
                </View>
              ))}

              {/* Statistical summary */}
              <View style={st.card}>
                <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8 }}>Statistical Summary</Text>
                <View style={st.row}>
                  <Text style={st.label}>Highest fulfillment</Text>
                  <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold }}>
                    {sortedRegions[sortedRegions.length - 1]?.name} ({sortedRegions[sortedRegions.length - 1]?.fulfillmentScore})
                  </Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Lowest fulfillment</Text>
                  <Text style={{ color: t.accent.red, fontSize: 12, fontWeight: fonts.semibold }}>
                    {sortedRegions[0]?.name} ({sortedRegions[0]?.fulfillmentScore})
                  </Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Highest peace</Text>
                  <Text style={{ color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold }}>
                    Northern Europe (91)
                  </Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Lowest peace</Text>
                  <Text style={{ color: t.accent.red, fontSize: 12, fontWeight: fonts.semibold }}>
                    Sahel Region (28)
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }} />
                <Text style={{ color: t.text.muted, fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>
                  The correlation is clear: Northern Europe (score 88, peace 91) vs Sahel (score 35, peace 28). Higher needs fulfillment consistently predicts higher peace. This is not coincidence — it is the fundamental mechanism of human resilience.
                </Text>
              </View>

              {/* Call to action */}
              <View style={st.ctaCard}>
                <Text style={st.ctaTitle}>Can You Help?</Text>
                <Text style={st.ctaText}>
                  The Sahel Region has the lowest fulfillment score (35) and the lowest peace index (28). Healthcare, food security, and employment are the biggest gaps. Every contribution matters.
                </Text>
              </View>
            </>
          )
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see basic needs dashboard data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
