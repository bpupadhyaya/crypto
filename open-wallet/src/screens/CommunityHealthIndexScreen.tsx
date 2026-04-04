import { fonts } from '../utils/theme';
/**
 * Community Health Index Screen — Comprehensive community health composite score.
 *
 * A single scrollable view showing the overall health of your community
 * across multiple dimensions: economic stability, education, safety,
 * social cohesion, governance participation, and environmental quality.
 * "A healthy community raises healthy people."
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

interface HealthDimension {
  key: string;
  title: string;
  icon: string;
  score: number;
  prevScore: number;
  color: string;
  indicators: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
}

interface HistoryEntry {
  month: string;
  score: number;
}

const DIMENSIONS: HealthDimension[] = [
  {
    key: 'economic', title: 'Economic Stability', icon: '\u{1F4B0}', score: 72, prevScore: 68, color: '#06b6d4',
    indicators: [
      { label: 'Employment rate', value: '89%', trend: 'up' },
      { label: 'Median OTK earned', value: '1,240/mo', trend: 'up' },
      { label: 'Food security', value: '94%', trend: 'stable' },
    ],
  },
  {
    key: 'education', title: 'Education Access', icon: '\u{1F4DA}', score: 81, prevScore: 78, color: '#3b82f6',
    indicators: [
      { label: 'Literacy rate', value: '97%', trend: 'up' },
      { label: 'Mentor availability', value: '1:12', trend: 'up' },
      { label: 'Course completion', value: '76%', trend: 'stable' },
    ],
  },
  {
    key: 'safety', title: 'Safety & Security', icon: '\u{1F6E1}\uFE0F', score: 78, prevScore: 75, color: '#10b981',
    indicators: [
      { label: 'Safe space coverage', value: '88%', trend: 'up' },
      { label: 'Incident reports (30d)', value: '3', trend: 'down' },
      { label: 'Emergency readiness', value: '82%', trend: 'up' },
    ],
  },
  {
    key: 'social', title: 'Social Cohesion', icon: '\u{1F91D}', score: 85, prevScore: 82, color: '#f59e0b',
    indicators: [
      { label: 'Event participation', value: '64%', trend: 'up' },
      { label: 'Cross-group interaction', value: '71%', trend: 'up' },
      { label: 'Volunteer rate', value: '42%', trend: 'stable' },
    ],
  },
  {
    key: 'governance', title: 'Governance Participation', icon: '\u{1F3DB}\uFE0F', score: 63, prevScore: 58, color: '#8b5cf6',
    indicators: [
      { label: 'Voter turnout', value: '57%', trend: 'up' },
      { label: 'Proposal submissions', value: '14/mo', trend: 'up' },
      { label: 'Dispute resolution rate', value: '91%', trend: 'stable' },
    ],
  },
  {
    key: 'environment', title: 'Environmental Quality', icon: '\u{1F33F}', score: 69, prevScore: 65, color: '#22c55e',
    indicators: [
      { label: 'Green space per capita', value: '18 sq m', trend: 'up' },
      { label: 'Waste recycling rate', value: '62%', trend: 'up' },
      { label: 'Air quality index', value: 'Good', trend: 'stable' },
    ],
  },
];

const SCORE_HISTORY: HistoryEntry[] = [
  { month: 'Oct 2025', score: 68 },
  { month: 'Nov 2025', score: 70 },
  { month: 'Dec 2025', score: 71 },
  { month: 'Jan 2026', score: 72 },
  { month: 'Feb 2026', score: 73 },
  { month: 'Mar 2026', score: 75 },
];

const COMPOSITE_SCORE = 75;
const PREV_COMPOSITE = 71;

export function CommunityHealthIndexScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();

  const compositeChange = COMPOSITE_SCORE - PREV_COMPOSITE;

  const gradeLabel = useMemo(() => {
    if (COMPOSITE_SCORE >= 90) return { grade: 'A', color: '#22c55e' };
    if (COMPOSITE_SCORE >= 80) return { grade: 'B+', color: '#10b981' };
    if (COMPOSITE_SCORE >= 70) return { grade: 'B', color: '#3b82f6' };
    if (COMPOSITE_SCORE >= 60) return { grade: 'C+', color: '#f59e0b' };
    return { grade: 'C', color: '#ef4444' };
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    scoreCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
    scoreNum: { fontSize: 56, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold, marginTop: 4 },
    scoreChange: { fontSize: 14, fontWeight: fonts.bold, marginTop: 6 },
    gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    gradeBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8 },
    gradeText: { color: '#fff', fontSize: 16, fontWeight: fonts.heavy },
    gradeLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12, marginTop: 8 },
    dimCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    dimHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    dimIcon: { fontSize: 24 },
    dimTitle: { flex: 1, fontSize: 15, fontWeight: fonts.bold },
    dimScore: { fontSize: 20, fontWeight: fonts.heavy },
    dimChange: { fontSize: 12, fontWeight: fonts.semibold, marginLeft: 4 },
    dimBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    dimBarFill: { height: 8, borderRadius: 4 },
    indicatorRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    indicatorLabel: { color: t.text.muted, fontSize: 12 },
    indicatorValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    indicatorText: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold },
    trendArrow: { fontSize: 10, fontWeight: fonts.heavy },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 20 },
    historyTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    historyMonth: { flex: 1, color: t.text.secondary, fontSize: 12 },
    historyScore: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, width: 36, textAlign: 'right', marginRight: 10 },
    historyBarBg: { flex: 2, height: 6, backgroundColor: t.border, borderRadius: 3, overflow: 'hidden' },
    historyBarFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    footer: { backgroundColor: t.bg.card, borderRadius: 14, padding: 20, alignItems: 'center' },
    footerText: { color: t.text.secondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    footerBold: { color: t.text.primary, fontWeight: fonts.bold },
  }), [t]);

  const trendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return { symbol: '\u2191', color: t.accent.green };
    if (trend === 'down') return { symbol: '\u2193', color: '#ef4444' };
    return { symbol: '\u2192', color: t.text.muted };
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Health</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"A healthy community raises healthy people."</Text>

        <View style={s.scoreCard}>
          <Text style={[s.scoreNum, { color: gradeLabel.color }]}>{COMPOSITE_SCORE}</Text>
          <Text style={s.scoreLabel}>Community Health Index</Text>
          <Text style={[s.scoreChange, { color: compositeChange >= 0 ? t.accent.green : '#ef4444' }]}>
            {compositeChange >= 0 ? '\u2191' : '\u2193'} {Math.abs(compositeChange)} pts from last month
          </Text>
          <View style={s.gradeRow}>
            <View style={[s.gradeBadge, { backgroundColor: gradeLabel.color }]}>
              <Text style={s.gradeText}>{gradeLabel.grade}</Text>
            </View>
            <Text style={s.gradeLabel}>Overall Grade</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Health Dimensions</Text>
        {DIMENSIONS.map(dim => {
          const change = dim.score - dim.prevScore;
          return (
            <View key={dim.key} style={s.dimCard}>
              <View style={s.dimHeader}>
                <Text style={s.dimIcon}>{dim.icon}</Text>
                <Text style={[s.dimTitle, { color: dim.color }]}>{dim.title}</Text>
                <Text style={[s.dimScore, { color: dim.color }]}>{dim.score}</Text>
                <Text style={[s.dimChange, { color: change >= 0 ? t.accent.green : '#ef4444' }]}>
                  {change >= 0 ? '+' : ''}{change}
                </Text>
              </View>
              <View style={s.dimBarBg}>
                <View style={[s.dimBarFill, { width: `${dim.score}%`, backgroundColor: dim.color }]} />
              </View>
              {dim.indicators.map(ind => {
                const tr = trendIcon(ind.trend);
                return (
                  <View key={ind.label} style={s.indicatorRow}>
                    <Text style={s.indicatorLabel}>{ind.label}</Text>
                    <View style={s.indicatorValue}>
                      <Text style={s.indicatorText}>{ind.value}</Text>
                      <Text style={[s.trendArrow, { color: tr.color }]}>{tr.symbol}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={s.sectionTitle}>6-Month Trend</Text>
        <View style={s.historyCard}>
          <Text style={s.historyTitle}>Composite Score Over Time</Text>
          {SCORE_HISTORY.map(h => (
            <View key={h.month} style={s.historyRow}>
              <Text style={s.historyMonth}>{h.month}</Text>
              <Text style={s.historyScore}>{h.score}</Text>
              <View style={s.historyBarBg}>
                <View style={[s.historyBarFill, { width: `${h.score}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>
            The Community Health Index combines <Text style={s.footerBold}>6 dimensions</Text> into a single score.
            Every contribution you make improves these numbers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
