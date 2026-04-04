import { fonts } from '../utils/theme';
/**
 * Peace Index Screen — The ultimate metric from Article X.
 *
 * "When all needs are met, war becomes irrational."
 * — Human Constitution, Article X
 *
 * Composite score (0-100) based on: Needs Met, Education, Community Health,
 * Governance Participation, Gratitude Density, and Correction Balance.
 * Regional breakdown, trend over time, and what it means for humanity.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ConstitutionSummary } from '../components/ConstitutionSummary';

interface Props {
  onClose: () => void;
}

// ─── Peace Index components ───

interface PeaceComponent {
  id: string;
  name: string;
  description: string;
  score: number; // 0-100
  weight: number; // contribution to overall
  icon: string;
  trend: 'up' | 'stable' | 'down';
}

interface RegionalPeace {
  region: string;
  score: number;
  trend: 'up' | 'stable' | 'down';
  topStrength: string;
  topWeakness: string;
}

interface TrendPoint {
  period: string;
  score: number;
}

// ─── Demo data ───

const DEMO_COMPONENTS: PeaceComponent[] = [
  {
    id: 'needs',
    name: 'Needs Met Score',
    description: 'Are basic human needs (food, shelter, healthcare) being addressed through community cooperation?',
    score: 72,
    weight: 0.25,
    icon: '\u2705',
    trend: 'up',
  },
  {
    id: 'education',
    name: 'Education Score',
    description: 'Are children being educated? Are skills being developed and certified on-chain?',
    score: 68,
    weight: 0.20,
    icon: '\uD83C\uDF93',
    trend: 'up',
  },
  {
    id: 'community',
    name: 'Community Health',
    description: 'Are communities thriving? Volunteer hours, mutual aid, social bonds measured.',
    score: 65,
    weight: 0.20,
    icon: '\uD83E\uDD1D',
    trend: 'stable',
  },
  {
    id: 'governance',
    name: 'Governance Participation',
    description: 'Are citizens engaged in decision-making? One human, one vote — participation rate.',
    score: 54,
    weight: 0.15,
    icon: '\uD83D\uDDF3\uFE0F',
    trend: 'up',
  },
  {
    id: 'gratitude',
    name: 'Gratitude Density',
    description: 'How much appreciation flows between people? A measure of social goodwill.',
    score: 78,
    weight: 0.10,
    icon: '\uD83D\uDE4F',
    trend: 'up',
  },
  {
    id: 'correction',
    name: 'Correction Balance',
    description: 'Are problems being identified and addressed? Correction reports filed and resolved.',
    score: 61,
    weight: 0.10,
    icon: '\u2696\uFE0F',
    trend: 'stable',
  },
];

const DEMO_REGIONS: RegionalPeace[] = [
  { region: 'North America', score: 78, trend: 'up', topStrength: 'Education', topWeakness: 'Governance Participation' },
  { region: 'Europe', score: 82, trend: 'up', topStrength: 'Needs Met', topWeakness: 'Gratitude Density' },
  { region: 'East Asia', score: 75, trend: 'stable', topStrength: 'Education', topWeakness: 'Community Health' },
  { region: 'South Asia', score: 58, trend: 'up', topStrength: 'Gratitude Density', topWeakness: 'Needs Met' },
  { region: 'South America', score: 62, trend: 'stable', topStrength: 'Community Health', topWeakness: 'Governance Participation' },
  { region: 'Middle East', score: 55, trend: 'up', topStrength: 'Gratitude Density', topWeakness: 'Correction Balance' },
  { region: 'Africa', score: 41, trend: 'up', topStrength: 'Community Health', topWeakness: 'Needs Met' },
  { region: 'Oceania', score: 80, trend: 'stable', topStrength: 'Needs Met', topWeakness: 'Governance Participation' },
];

const DEMO_TREND: TrendPoint[] = [
  { period: 'Q1 2025', score: 52 },
  { period: 'Q2 2025', score: 55 },
  { period: 'Q3 2025', score: 58 },
  { period: 'Q4 2025', score: 62 },
  { period: 'Q1 2026', score: 68 },
];

// ─── Animated score hook ───

function useAnimatedScore(target: number, duration: number = 1200): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - (startTime.current ?? Date.now());
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return current;
}

export function PeaceIndexScreen({ onClose }: Props) {
  const t = useTheme();
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  // Calculate overall peace index
  const overallScore = useMemo(() => {
    return Math.round(DEMO_COMPONENTS.reduce((sum, c) => sum + c.score * c.weight, 0));
  }, []);

  const animatedScore = useAnimatedScore(overallScore);

  const scoreColor = (score: number): string => {
    if (score >= 75) return t.accent.green;
    if (score >= 50) return t.accent.yellow;
    return t.accent.red;
  };

  const trendIcon = (trend: 'up' | 'stable' | 'down'): string => {
    switch (trend) {
      case 'up': return '\u2191';
      case 'stable': return '\u2192';
      case 'down': return '\u2193';
    }
  };

  const trendColor = (trend: 'up' | 'stable' | 'down'): string => {
    switch (trend) {
      case 'up': return t.accent.green;
      case 'stable': return t.accent.yellow;
      case 'down': return t.accent.red;
    }
  };

  const maxTrend = useMemo(() => Math.max(...DEMO_TREND.map(p => p.score)), []);
  const minTrend = useMemo(() => Math.min(...DEMO_TREND.map(p => p.score)), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 0 },
    demoTag: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    // Main score
    scoreCard: { alignItems: 'center', paddingVertical: 32, marginHorizontal: 20, marginTop: 8, backgroundColor: t.bg.card, borderRadius: 24 },
    scoreCircle: {
      width: 160, height: 160, borderRadius: 80,
      borderWidth: 8, justifyContent: 'center', alignItems: 'center',
    },
    scoreNumber: { fontSize: 56, fontWeight: fonts.heavy },
    scoreMax: { color: t.text.muted, fontSize: 16, fontWeight: fonts.semibold },
    scoreLabel: { color: t.text.muted, fontSize: 14, fontWeight: fonts.semibold, marginTop: 16, textTransform: 'uppercase', letterSpacing: 2 },
    scoreTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    trendText: { fontSize: 14, fontWeight: fonts.bold },
    // Components
    componentRow: { paddingVertical: 14 },
    componentHeader: { flexDirection: 'row', alignItems: 'center' },
    componentIcon: { fontSize: 24, width: 36, textAlign: 'center' },
    componentInfo: { flex: 1, marginLeft: 8 },
    componentName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    componentBar: { height: 8, borderRadius: 4, marginTop: 6 },
    componentBarTrack: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    componentBarFill: { height: 8, borderRadius: 4 },
    componentScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
    componentScore: { fontSize: 16, fontWeight: fonts.heavy, width: 32, textAlign: 'right' },
    componentTrend: { fontSize: 14, fontWeight: fonts.bold },
    componentDesc: { color: t.text.muted, fontSize: 12, lineHeight: 18, marginTop: 8, marginLeft: 44 },
    componentWeight: { color: t.text.muted, fontSize: 10, marginTop: 4, marginLeft: 44 },
    // Regions
    regionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    regionName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    regionScore: { fontSize: 16, fontWeight: fonts.heavy, width: 36, textAlign: 'right' },
    regionTrend: { fontSize: 14, fontWeight: fonts.bold, width: 24, textAlign: 'center', marginLeft: 4 },
    regionMeta: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    // Trend chart
    trendContainer: { paddingVertical: 16 },
    trendRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingHorizontal: 8 },
    trendBar: { alignItems: 'center', flex: 1 },
    trendBarFill: { width: 28, borderRadius: 8 },
    trendBarLabel: { color: t.text.muted, fontSize: 9, marginTop: 6, textAlign: 'center' },
    trendBarScore: { color: t.text.primary, fontSize: 11, fontWeight: fonts.bold, marginBottom: 4 },
    // Philosophy
    philosophyCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 8 },
    philosophyTitle: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
    philosophyText: { color: t.text.primary, fontSize: 14, lineHeight: 22 },
    philosophyQuote: { color: t.text.muted, fontSize: 13, fontStyle: 'italic', marginTop: 16, lineHeight: 20, textAlign: 'center' },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Peace Index</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Main Score ─── */}
        <View style={s.scoreCard}>
          <View style={[s.scoreCircle, { borderColor: scoreColor(overallScore) }]}>
            <Text style={[s.scoreNumber, { color: scoreColor(overallScore) }]}>
              {animatedScore}
            </Text>
            <Text style={s.scoreMax}>/100</Text>
          </View>
          <Text style={s.scoreLabel}>Open Chain Peace Index</Text>
          <View style={s.scoreTrend}>
            <Text style={[s.trendText, { color: t.accent.green }]}>{'\u2191'} +6</Text>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>from last quarter</Text>
          </View>
        </View>

        {/* ─── Component Breakdown ─── */}
        <Text style={s.section}>Index Components</Text>
        <View style={s.card}>
          {DEMO_COMPONENTS.map((comp, idx) => (
            <View key={comp.id}>
              {idx > 0 && <View style={s.divider} />}
              <TouchableOpacity
                style={s.componentRow}
                onPress={() => setExpandedComponent(expandedComponent === comp.id ? null : comp.id)}
              >
                <View style={s.componentHeader}>
                  <Text style={s.componentIcon}>{comp.icon}</Text>
                  <View style={s.componentInfo}>
                    <Text style={s.componentName}>{comp.name}</Text>
                    <View style={s.componentBarTrack}>
                      <View style={[s.componentBarFill, {
                        backgroundColor: scoreColor(comp.score),
                        width: `${comp.score}%` as unknown as number,
                      }]} />
                    </View>
                  </View>
                  <View style={s.componentScoreRow}>
                    <Text style={[s.componentScore, { color: scoreColor(comp.score) }]}>{comp.score}</Text>
                    <Text style={[s.componentTrend, { color: trendColor(comp.trend) }]}>
                      {trendIcon(comp.trend)}
                    </Text>
                  </View>
                </View>
                {expandedComponent === comp.id && (
                  <>
                    <Text style={s.componentDesc}>{comp.description}</Text>
                    <Text style={s.componentWeight}>
                      Weight: {Math.round(comp.weight * 100)}% of total index
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ─── Regional Breakdown ─── */}
        <Text style={s.section}>Regional Breakdown</Text>
        <View style={s.card}>
          {DEMO_REGIONS.map((region, idx) => (
            <View key={region.region}>
              {idx > 0 && <View style={s.divider} />}
              <View style={s.regionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.regionName}>{region.region}</Text>
                  <Text style={s.regionMeta}>
                    {'\u2191'} {region.topStrength}  {'\u00B7'}  {'\u2193'} {region.topWeakness}
                  </Text>
                </View>
                <Text style={[s.regionScore, { color: scoreColor(region.score) }]}>
                  {region.score}
                </Text>
                <Text style={[s.regionTrend, { color: trendColor(region.trend) }]}>
                  {trendIcon(region.trend)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Trend Over Time ─── */}
        <Text style={s.section}>Trend</Text>
        <View style={s.card}>
          <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
            Global Peace Index over time — is the world getting better?
          </Text>
          <View style={s.trendRow}>
            {DEMO_TREND.map((point) => {
              const range = maxTrend - minTrend || 1;
              const barHeight = 20 + ((point.score - minTrend) / range) * 80;
              return (
                <View key={point.period} style={s.trendBar}>
                  <Text style={s.trendBarScore}>{point.score}</Text>
                  <View style={[s.trendBarFill, {
                    height: barHeight,
                    backgroundColor: scoreColor(point.score),
                  }]} />
                  <Text style={s.trendBarLabel}>{point.period.replace('20', "'")}</Text>
                </View>
              );
            })}
          </View>
          <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 }}>
            {'\u2191'} +{DEMO_TREND[DEMO_TREND.length - 1].score - DEMO_TREND[0].score} points over {DEMO_TREND.length} quarters
          </Text>
        </View>

        {/* ─── What It Means ─── */}
        <Text style={s.section}>What It Means</Text>
        <View style={s.philosophyCard}>
          <Text style={s.philosophyTitle}>Measuring Progress Toward Peace</Text>
          <Text style={s.philosophyText}>
            The Open Chain Peace Index is a composite measure of human well-being derived entirely
            from on-chain data. Unlike GDP, which measures economic output regardless of who benefits,
            the Peace Index measures whether real human needs are being met.
          </Text>
          <Text style={[s.philosophyText, { marginTop: 12 }]}>
            Each component tracks a fundamental aspect of human flourishing: are people fed and
            sheltered? Are children learning? Are communities supporting each other? Are citizens
            participating in governance? Is gratitude flowing? Are wrongs being corrected?
          </Text>
          <Text style={[s.philosophyText, { marginTop: 12 }]}>
            When all these scores approach 100, the conditions for conflict dissolve. A person whose
            needs are met, who is educated, who feels part of a community, and who has a voice in
            governance has no reason to fight.
          </Text>
          <Text style={s.philosophyQuote}>
            "When all needs are met, war becomes irrational."{'\n'}
            — Human Constitution, Article X
          </Text>
        </View>

        {/* Demo tag */}
        <Text style={s.demoTag}>DEMO MODE — Sample peace index data</Text>

        <View style={{ marginTop: 16 }}>
          <ConstitutionSummary />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
