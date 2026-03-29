/**
 * Needs Assessment Screen — Article I, Section 3 of The Human Constitution.
 *
 * "When people's basic needs are met, they are resilient against
 *  manipulation and exploitation."
 *
 * Help communities identify and address unmet needs through self-assessment,
 * anonymized community needs mapping, and specific need submission.
 *
 * Features:
 * - Self-Assessment: rate your needs (1-5) across 8 categories
 * - Community Needs Map: aggregated (anonymized) needs by region
 * - "Where help is needed most": regions with lowest scores highlighted
 * - Submit Need: describe a specific need for community response
 * - Track Progress: how needs scores improve over time
 * - Demo mode with sample assessment data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type NeedsTab = 'assess' | 'community' | 'submit' | 'progress';

interface NeedCategory {
  key: string;
  label: string;
  icon: string;
  description: string;
}

interface RegionNeeds {
  name: string;
  code: string;
  population: number;
  scores: Record<string, number>;
  avgScore: number;
  trend: 'improving' | 'stable' | 'declining';
  peaceIndex: number;
}

interface SubmittedNeed {
  id: string;
  category: string;
  description: string;
  region: string;
  status: 'open' | 'matched' | 'resolved';
  timestamp: string;
  responses: number;
}

interface ProgressPoint {
  month: string;
  avgScore: number;
  peaceIndex: number;
}

const NEED_CATEGORIES: NeedCategory[] = [
  { key: 'food', label: 'Food Security', icon: '\u{1F33E}', description: 'Access to nutritious food' },
  { key: 'housing', label: 'Housing Stability', icon: '\u{1F3E0}', description: 'Safe, stable shelter' },
  { key: 'healthcare', label: 'Healthcare Access', icon: '\u{1FA7A}', description: 'Medical care availability' },
  { key: 'education', label: 'Education Access', icon: '\u{1F4DA}', description: 'Learning opportunities' },
  { key: 'employment', label: 'Employment', icon: '\u{1F4BC}', description: 'Work and income' },
  { key: 'community', label: 'Community Support', icon: '\u{1F91D}', description: 'Social connections' },
  { key: 'safety', label: 'Safety', icon: '\u{1F6E1}', description: 'Physical security' },
  { key: 'mental', label: 'Mental Wellbeing', icon: '\u{1F9E0}', description: 'Emotional health' },
];

const SCORE_LABELS: Record<number, string> = {
  1: 'Crisis',
  2: 'Struggling',
  3: 'Adequate',
  4: 'Good',
  5: 'Thriving',
};

const SCORE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#16a34a',
};

const DEMO_REGIONS: RegionNeeds[] = [
  {
    name: 'South Asia', code: 'SA', population: 1_900_000,
    scores: { food: 3.2, housing: 2.8, healthcare: 2.5, education: 3.1, employment: 2.9, community: 3.8, safety: 3.0, mental: 2.6 },
    avgScore: 2.99, trend: 'improving', peaceIndex: 62,
  },
  {
    name: 'Northern Europe', code: 'NE', population: 320_000,
    scores: { food: 4.7, housing: 4.3, healthcare: 4.6, education: 4.8, employment: 4.1, community: 4.2, safety: 4.5, mental: 3.9 },
    avgScore: 4.39, trend: 'stable', peaceIndex: 91,
  },
  {
    name: 'East Africa', code: 'EA', population: 450_000,
    scores: { food: 2.1, housing: 2.0, healthcare: 1.8, education: 2.3, employment: 1.9, community: 3.5, safety: 2.2, mental: 2.4 },
    avgScore: 2.28, trend: 'improving', peaceIndex: 45,
  },
  {
    name: 'Sahel Region', code: 'SR', population: 120_000,
    scores: { food: 1.5, housing: 1.8, healthcare: 1.3, education: 1.6, employment: 1.4, community: 2.8, safety: 1.7, mental: 1.9 },
    avgScore: 1.75, trend: 'declining', peaceIndex: 28,
  },
  {
    name: 'Southeast Asia', code: 'SEA', population: 680_000,
    scores: { food: 3.6, housing: 3.2, healthcare: 3.0, education: 3.4, employment: 3.1, community: 4.0, safety: 3.3, mental: 3.0 },
    avgScore: 3.33, trend: 'improving', peaceIndex: 71,
  },
  {
    name: 'Central America', code: 'CA', population: 180_000,
    scores: { food: 2.8, housing: 2.5, healthcare: 2.3, education: 2.7, employment: 2.2, community: 3.2, safety: 2.0, mental: 2.5 },
    avgScore: 2.53, trend: 'stable', peaceIndex: 48,
  },
  {
    name: 'Appalachia', code: 'AP', population: 95_000,
    scores: { food: 3.0, housing: 3.2, healthcare: 2.4, education: 2.8, employment: 2.1, community: 2.9, safety: 3.5, mental: 2.3 },
    avgScore: 2.78, trend: 'declining', peaceIndex: 55,
  },
];

const DEMO_SUBMITTED_NEEDS: SubmittedNeed[] = [
  { id: '1', category: 'healthcare', description: 'Need mobile health clinic visits — nearest hospital 45km away', region: 'East Africa', status: 'matched', timestamp: '2026-03-25', responses: 3 },
  { id: '2', category: 'education', description: 'Community needs after-school tutoring for secondary students', region: 'Appalachia', status: 'open', timestamp: '2026-03-27', responses: 1 },
  { id: '3', category: 'food', description: 'Drought affecting harvest — need emergency food supplies for 200 families', region: 'Sahel Region', status: 'open', timestamp: '2026-03-26', responses: 5 },
  { id: '4', category: 'employment', description: 'Youth unemployment 40% — need vocational training programs', region: 'Central America', status: 'matched', timestamp: '2026-03-20', responses: 8 },
  { id: '5', category: 'mental', description: 'Post-conflict community needs trauma counseling', region: 'Sahel Region', status: 'resolved', timestamp: '2026-03-10', responses: 12 },
];

const DEMO_PROGRESS: ProgressPoint[] = [
  { month: 'Oct 2025', avgScore: 2.61, peaceIndex: 54 },
  { month: 'Nov 2025', avgScore: 2.68, peaceIndex: 55 },
  { month: 'Dec 2025', avgScore: 2.72, peaceIndex: 57 },
  { month: 'Jan 2026', avgScore: 2.80, peaceIndex: 58 },
  { month: 'Feb 2026', avgScore: 2.89, peaceIndex: 60 },
  { month: 'Mar 2026', avgScore: 2.98, peaceIndex: 62 },
];

const TREND_ICONS: Record<string, string> = {
  improving: '\u2191',
  stable: '\u2192',
  declining: '\u2193',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  matched: '#f97316',
  resolved: '#22c55e',
};

function scoreColor(score: number): string {
  if (score <= 1.5) return '#ef4444';
  if (score <= 2.5) return '#f97316';
  if (score <= 3.5) return '#eab308';
  if (score <= 4.5) return '#22c55e';
  return '#16a34a';
}

export function NeedsAssessmentScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<NeedsTab>('assess');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [needCategory, setNeedCategory] = useState('food');
  const [needDescription, setNeedDescription] = useState('');
  const [needRegion, setNeedRegion] = useState('');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    needRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    needIcon: { fontSize: 24, width: 36 },
    needInfo: { flex: 1, marginLeft: 8 },
    needLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    needDesc: { color: t.text.muted, fontSize: 11, marginTop: 1 },
    scoreRow: { flexDirection: 'row', gap: 6 },
    scoreBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: t.border },
    scoreBtnActive: { backgroundColor: t.accent.green },
    scoreBtnText: { color: t.text.secondary, fontSize: 14, fontWeight: '700' },
    scoreBtnTextActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 16 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    regionName: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    alertCard: { backgroundColor: t.accent.red + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.red + '30' },
    alertTitle: { color: t.accent.red, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    alertDesc: { color: t.text.muted, fontSize: 12, lineHeight: 18 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginTop: 8 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.border },
    chipActive: { backgroundColor: t.accent.blue },
    chipText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
    statusText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    progressMonth: { color: t.text.secondary, fontSize: 13, fontWeight: '600', flex: 1 },
    progressScore: { fontSize: 13, fontWeight: '700', width: 50, textAlign: 'center' },
    progressPeace: { fontSize: 13, fontWeight: '700', width: 50, textAlign: 'center' },
    correlationCard: { backgroundColor: t.accent.blue + '10', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: t.accent.blue + '30' },
  }), [t]);

  const regions = demoMode ? DEMO_REGIONS : [];
  const submittedNeeds = demoMode ? DEMO_SUBMITTED_NEEDS : [];
  const progress = demoMode ? DEMO_PROGRESS : [];

  const trendColors = useMemo(() => ({
    improving: t.accent.green,
    stable: t.accent.yellow,
    declining: t.accent.red,
  }), [t]);

  // Sorted regions: lowest avgScore first for "where help is needed most"
  const neediestRegions = useMemo(() => [...regions].sort((a, b) => a.avgScore - b.avgScore), [regions]);

  // Compute user's average self-assessment
  const userAvg = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }, [scores]);

  const handleScoreChange = useCallback((key: string, score: number) => {
    setScores(prev => ({ ...prev, [key]: score }));
  }, []);

  const handleSubmitAssessment = useCallback(() => {
    if (Object.keys(scores).length < NEED_CATEGORIES.length) {
      Alert.alert('Incomplete', 'Please rate all 8 categories before submitting.');
      return;
    }
    setSubmitted(true);
    Alert.alert(
      'Assessment Submitted',
      `Your needs assessment has been recorded anonymously.\n\nAverage score: ${userAvg.toFixed(1)}/5.0\n\nThis helps your community understand where support is needed most.`,
    );
  }, [scores, userAvg]);

  const handleSubmitNeed = useCallback(() => {
    if (!needDescription.trim()) {
      Alert.alert('Description Required', 'Please describe the specific need.');
      return;
    }
    if (!needRegion.trim()) {
      Alert.alert('Region Required', 'Please enter your region.');
      return;
    }
    Alert.alert(
      'Need Submitted',
      'Your need has been posted anonymously for community response. You will be notified when someone offers to help.',
    );
    setNeedDescription('');
    setNeedRegion('');
  }, [needDescription, needRegion]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Needs Assessment</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Article I, Section 3: "When people's basic needs are met, they are resilient against manipulation and exploitation." Rate needs, see community maps, submit requests.
        </Text>

        <View style={st.tabRow}>
          {(['assess', 'community', 'submit', 'progress'] as NeedsTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'assess' ? 'Self-Assess' : tab === 'community' ? 'Community' : tab === 'submit' ? 'Submit' : 'Progress'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Self-Assessment Tab */}
        {activeTab === 'assess' && (
          <>
            <View style={st.heroCard}>
              <Text style={st.heroIcon}>{'\u{1F4CB}'}</Text>
              <Text style={st.heroTitle}>Rate Your Basic Needs</Text>
              <Text style={st.heroSubtitle}>
                How well are your needs being met? Rate each category 1 (crisis) to 5 (thriving). Your responses are anonymous.
              </Text>
            </View>

            {NEED_CATEGORIES.map(cat => (
              <View key={cat.key} style={st.card}>
                <View style={st.needRow}>
                  <Text style={st.needIcon}>{cat.icon}</Text>
                  <View style={st.needInfo}>
                    <Text style={st.needLabel}>{cat.label}</Text>
                    <Text style={st.needDesc}>{cat.description}</Text>
                  </View>
                </View>
                <View style={st.scoreRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        st.scoreBtn,
                        scores[cat.key] === s && { backgroundColor: SCORE_COLORS[s] },
                      ]}
                      onPress={() => handleScoreChange(cat.key, s)}
                    >
                      <Text style={[st.scoreBtnText, scores[cat.key] === s && st.scoreBtnTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                  {scores[cat.key] ? (
                    <Text style={{ color: SCORE_COLORS[scores[cat.key]], fontSize: 12, fontWeight: '600', marginLeft: 8, alignSelf: 'center' }}>
                      {SCORE_LABELS[scores[cat.key]]}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}

            {Object.keys(scores).length > 0 && (
              <View style={st.card}>
                <View style={st.row}>
                  <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '700' }}>Your Average</Text>
                  <Text style={{ color: scoreColor(userAvg), fontSize: 20, fontWeight: '800' }}>{userAvg.toFixed(1)}/5.0</Text>
                </View>
                <View style={[st.barContainer, { marginTop: 8 }]}>
                  <View style={[st.barFill, { width: `${(userAvg / 5) * 100}%`, backgroundColor: scoreColor(userAvg) }]} />
                </View>
              </View>
            )}

            {!submitted && (
              <TouchableOpacity style={st.submitBtn} onPress={handleSubmitAssessment}>
                <Text style={st.submitBtnText}>Submit Assessment (Anonymous)</Text>
              </TouchableOpacity>
            )}

            {submitted && (
              <View style={[st.card, { alignItems: 'center' }]}>
                <Text style={{ color: t.accent.green, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>Assessment Submitted</Text>
                <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
                  Your anonymous assessment helps your community identify where support is needed. Thank you.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Community Needs Map Tab */}
        {activeTab === 'community' && (
          regions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see community needs data.</Text>
          ) : (
            <>
              {/* Where help is needed most */}
              <Text style={st.section}>Where Help Is Needed Most</Text>
              {neediestRegions.filter(r => r.avgScore < 3.0).map(r => (
                <View key={r.code} style={st.alertCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={st.alertTitle}>{r.name}</Text>
                    <Text style={{ color: t.accent.red, fontSize: 18, fontWeight: '800' }}>{r.avgScore.toFixed(1)}/5.0</Text>
                  </View>
                  <Text style={st.alertDesc}>
                    Population: {r.population.toLocaleString()} {'\u2022'} Peace Index: {r.peaceIndex}/100 {'\u2022'} Trend: {TREND_ICONS[r.trend]} {r.trend}
                  </Text>
                  {/* Show weakest categories */}
                  <View style={{ marginTop: 8 }}>
                    {Object.entries(r.scores)
                      .sort(([, a], [, b]) => a - b)
                      .slice(0, 3)
                      .map(([key, score]) => {
                        const cat = NEED_CATEGORIES.find(c => c.key === key);
                        return cat ? (
                          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 14, width: 24 }}>{cat.icon}</Text>
                            <Text style={{ color: t.text.secondary, fontSize: 12, flex: 1 }}>{cat.label}</Text>
                            <Text style={{ color: scoreColor(score), fontSize: 12, fontWeight: '700' }}>{score.toFixed(1)}</Text>
                          </View>
                        ) : null;
                      })}
                  </View>
                </View>
              ))}

              {/* All regions */}
              <Text style={st.section}>All Regions</Text>
              {neediestRegions.map(r => (
                <View key={r.code} style={st.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={st.regionName}>{r.name}</Text>
                    <Text style={{ color: scoreColor(r.avgScore), fontSize: 18, fontWeight: '800' }}>{r.avgScore.toFixed(1)}</Text>
                  </View>
                  <View style={[st.barContainer, { marginBottom: 8 }]}>
                    <View style={[st.barFill, { width: `${(r.avgScore / 5) * 100}%`, backgroundColor: scoreColor(r.avgScore) }]} />
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Population</Text>
                    <Text style={st.val}>{r.population.toLocaleString()}</Text>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Peace Index</Text>
                    <Text style={st.val}>{r.peaceIndex}/100</Text>
                  </View>
                  <View style={st.row}>
                    <Text style={st.label}>Trend</Text>
                    <Text style={{ color: trendColors[r.trend], fontSize: 12, fontWeight: '700' }}>
                      {TREND_ICONS[r.trend]} {r.trend.charAt(0).toUpperCase() + r.trend.slice(1)}
                    </Text>
                  </View>
                  {/* Category breakdown */}
                  <View style={{ marginTop: 8 }}>
                    {NEED_CATEGORIES.map(cat => {
                      const score = r.scores[cat.key] ?? 0;
                      return (
                        <View key={cat.key} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Text style={{ fontSize: 12, width: 20 }}>{cat.icon}</Text>
                          <Text style={{ color: t.text.muted, fontSize: 11, flex: 1, marginLeft: 4 }}>{cat.label}</Text>
                          <View style={[st.barContainer, { flex: 1, marginHorizontal: 8, marginVertical: 0 }]}>
                            <View style={[st.barFill, { width: `${(score / 5) * 100}%`, backgroundColor: scoreColor(score) }]} />
                          </View>
                          <Text style={{ color: scoreColor(score), fontSize: 11, fontWeight: '700', width: 24, textAlign: 'right' }}>{score.toFixed(1)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Correlation insight */}
              <View style={st.correlationCard}>
                <Text style={{ color: t.accent.blue, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                  Needs Fulfillment and Peace Correlation
                </Text>
                <Text style={{ color: t.text.muted, fontSize: 12, lineHeight: 18 }}>
                  Regions with higher needs fulfillment scores consistently show higher peace indices. Northern Europe (4.4 avg, 91 peace) vs. Sahel (1.8 avg, 28 peace) demonstrates the thesis: when basic needs are met, communities are more peaceful and resilient.
                </Text>
              </View>
            </>
          )
        )}

        {/* Submit Need Tab */}
        {activeTab === 'submit' && (
          <>
            <View style={st.heroCard}>
              <Text style={st.heroIcon}>{'\u{270B}'}</Text>
              <Text style={st.heroTitle}>Submit a Specific Need</Text>
              <Text style={st.heroSubtitle}>
                Describe what your community needs. Your submission is anonymous until you choose to accept a match.
              </Text>
            </View>

            <View style={st.card}>
              <Text style={st.inputLabel}>Category</Text>
              <View style={st.chipRow}>
                {NEED_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[st.chip, needCategory === cat.key && st.chipActive]}
                    onPress={() => setNeedCategory(cat.key)}
                  >
                    <Text style={[st.chipText, needCategory === cat.key && st.chipTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={st.inputLabel}>Description</Text>
              <TextInput
                style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Describe the specific need..."
                placeholderTextColor={t.text.muted}
                value={needDescription}
                onChangeText={setNeedDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={st.inputLabel}>Region</Text>
              <TextInput
                style={st.input}
                placeholder="Your region or community..."
                placeholderTextColor={t.text.muted}
                value={needRegion}
                onChangeText={setNeedRegion}
              />
            </View>

            <TouchableOpacity style={st.submitBtn} onPress={handleSubmitNeed}>
              <Text style={st.submitBtnText}>Submit Need (Anonymous)</Text>
            </TouchableOpacity>

            {/* Recent submitted needs */}
            {submittedNeeds.length > 0 && (
              <>
                <Text style={st.section}>Recent Community Needs</Text>
                {submittedNeeds.map(need => {
                  const cat = NEED_CATEGORIES.find(c => c.key === need.category);
                  return (
                    <View key={need.id} style={st.card}>
                      <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[need.status] }]}>
                        <Text style={st.statusText}>{need.status}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, marginRight: 6 }}>{cat?.icon ?? '\u{2753}'}</Text>
                        <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 }}>{cat?.label ?? need.category}</Text>
                      </View>
                      <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 19, marginBottom: 6 }}>{need.description}</Text>
                      <View style={st.row}>
                        <Text style={st.label}>{need.region}</Text>
                        <Text style={st.val}>{need.responses} response{need.responses !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={{ color: t.text.muted, fontSize: 11, marginTop: 2 }}>{need.timestamp}</Text>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          progress.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see needs progress data.</Text>
          ) : (
            <>
              <View style={st.heroCard}>
                <Text style={st.heroIcon}>{'\u{1F4C8}'}</Text>
                <Text style={st.heroTitle}>Needs Fulfillment Over Time</Text>
                <Text style={st.heroSubtitle}>
                  Tracking how well basic needs are being met across all participating regions.
                </Text>
              </View>

              <View style={st.summaryRow}>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: scoreColor(progress[progress.length - 1].avgScore) }]}>
                    {progress[progress.length - 1].avgScore.toFixed(1)}
                  </Text>
                  <Text style={st.summaryLabel}>Current Avg Score</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.blue }]}>
                    {progress[progress.length - 1].peaceIndex}
                  </Text>
                  <Text style={st.summaryLabel}>Peace Index</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.green }]}>
                    +{(progress[progress.length - 1].avgScore - progress[0].avgScore).toFixed(2)}
                  </Text>
                  <Text style={st.summaryLabel}>6-Month Change</Text>
                </View>
              </View>

              <View style={st.card}>
                <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Monthly Trend</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 6 }}>
                  <Text style={{ color: t.text.muted, fontSize: 11, fontWeight: '600', flex: 1 }}>Month</Text>
                  <Text style={{ color: t.text.muted, fontSize: 11, fontWeight: '600', width: 50, textAlign: 'center' }}>Needs</Text>
                  <Text style={{ color: t.text.muted, fontSize: 11, fontWeight: '600', width: 50, textAlign: 'center' }}>Peace</Text>
                </View>
                {progress.map((p, i) => (
                  <View key={p.month} style={st.progressRow}>
                    <Text style={st.progressMonth}>{p.month}</Text>
                    <Text style={[st.progressScore, { color: scoreColor(p.avgScore) }]}>{p.avgScore.toFixed(2)}</Text>
                    <Text style={[st.progressPeace, { color: t.accent.blue }]}>{p.peaceIndex}</Text>
                  </View>
                ))}
              </View>

              {/* Bar chart representation */}
              <View style={st.card}>
                <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>Score Trend</Text>
                {progress.map(p => (
                  <View key={p.month} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ color: t.text.muted, fontSize: 10 }}>{p.month}</Text>
                      <Text style={{ color: scoreColor(p.avgScore), fontSize: 10, fontWeight: '700' }}>{p.avgScore.toFixed(2)}</Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${(p.avgScore / 5) * 100}%`, backgroundColor: scoreColor(p.avgScore) }]} />
                    </View>
                  </View>
                ))}
              </View>

              <View style={st.correlationCard}>
                <Text style={{ color: t.accent.blue, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                  The Connection: Needs Met = Peace
                </Text>
                <Text style={{ color: t.text.muted, fontSize: 12, lineHeight: 18 }}>
                  As average needs scores improved from 2.61 to 2.98 over 6 months, the peace index rose from 54 to 62. This validates Article I, Section 3: meeting basic needs creates resilience against manipulation and exploitation.
                </Text>
              </View>
            </>
          )
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample needs assessment data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
