/**
 * Water & Sanitation Screen — Article I of The Human Constitution.
 *
 * "Every dimension of human contribution is valued equally."
 *
 * Tracks clean water access, sanitation infrastructure, and water quality
 * to ensure every community has safe water. Clean water is foundational —
 * without it, health, education, and economic progress are impossible.
 *
 * Features:
 * - Water access score for your region (0-100: clean water %, sanitation %, infrastructure)
 * - Water sources map/list — community wells, purification stations, rain harvesting
 * - Report water issues (contamination, shortage, broken infrastructure)
 * - Water conservation tips and tracking
 * - Sanitation projects — community toilet projects, sewage improvements
 * - Water quality testing results (community-submitted, verified)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface Props {
  onClose: () => void;
}

type TabKey = 'dashboard' | 'sources' | 'report' | 'projects';

interface WaterAccessData {
  score: number;           // 0-100
  cleanWater: number;      // 0-100
  sanitation: number;      // 0-100
  infrastructure: number;  // 0-100
  trend: 'improving' | 'stable' | 'declining';
  region: string;
}

interface WaterSource {
  id: string;
  name: string;
  type: 'well' | 'purification' | 'rain-harvest' | 'spring' | 'tap';
  location: string;
  capacity: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  lastTested: string;
  servesHouseholds: number;
  status: 'active' | 'maintenance' | 'offline';
}

interface WaterIssue {
  id: string;
  type: 'contamination' | 'shortage' | 'broken-infrastructure' | 'flooding';
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  location: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'in-progress' | 'resolved';
  upvotes: number;
}

interface SanitationProject {
  id: string;
  name: string;
  type: 'toilet' | 'sewage' | 'drainage' | 'water-treatment';
  description: string;
  location: string;
  progress: number; // 0-100
  volunteersNeeded: number;
  volunteersJoined: number;
  targetDate: string;
  status: 'planning' | 'active' | 'completed';
  impact: string;
}

interface WaterQualityTest {
  id: string;
  source: string;
  testedBy: string;
  date: string;
  ph: number;
  turbidity: string;
  bacteria: 'none' | 'low' | 'moderate' | 'high';
  contaminants: string[];
  overall: 'safe' | 'acceptable' | 'caution' | 'unsafe';
  verified: boolean;
}

interface ConservationTip {
  id: string;
  title: string;
  description: string;
  savingsPerDay: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// ─── Constants ───

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'sources', label: 'Sources' },
  { key: 'report', label: 'Report' },
  { key: 'projects', label: 'Projects' },
];

const SCORE_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#4ade80',
  moderate: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
};

const QUALITY_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#4ade80',
  fair: '#eab308',
  poor: '#ef4444',
  safe: '#22c55e',
  acceptable: '#4ade80',
  caution: '#eab308',
  unsafe: '#ef4444',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  maintenance: '#eab308',
  offline: '#ef4444',
  planning: '#3b82f6',
  completed: '#22c55e',
  open: '#f97316',
  investigating: '#eab308',
  'in-progress': '#3b82f6',
  resolved: '#22c55e',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  well: 'Community Well',
  purification: 'Purification Station',
  'rain-harvest': 'Rain Harvesting',
  spring: 'Natural Spring',
  tap: 'Municipal Tap',
};

const BACTERIA_COLORS: Record<string, string> = {
  none: '#22c55e',
  low: '#4ade80',
  moderate: '#eab308',
  high: '#ef4444',
};

// ─── Demo Data ───

const DEMO_WATER_ACCESS: WaterAccessData = {
  score: 68,
  cleanWater: 72,
  sanitation: 58,
  infrastructure: 74,
  trend: 'improving',
  region: 'Portland Metro',
};

const DEMO_SOURCES: WaterSource[] = [
  {
    id: 'ws1', name: 'Riverside Community Well', type: 'well',
    location: '0.6 mi away', capacity: '500 gal/day',
    quality: 'good', lastTested: '2 weeks ago',
    servesHouseholds: 45, status: 'active',
  },
  {
    id: 'ws2', name: 'Eastside Purification Station', type: 'purification',
    location: '1.2 mi away', capacity: '2,000 gal/day',
    quality: 'excellent', lastTested: '3 days ago',
    servesHouseholds: 120, status: 'active',
  },
  {
    id: 'ws3', name: 'Hilltop Rain Harvest System', type: 'rain-harvest',
    location: '1.8 mi away', capacity: '300 gal/day',
    quality: 'fair', lastTested: '1 month ago',
    servesHouseholds: 20, status: 'maintenance',
  },
];

const DEMO_ISSUES: WaterIssue[] = [
  {
    id: 'wi1', type: 'contamination', title: 'Discolored water on Oak Street',
    description: 'Brown/rusty water from taps on Oak Street between 3rd and 5th Ave. Started 3 days ago.',
    reportedBy: 'Maria K.', reportedAt: '3 days ago', location: 'Oak St & 4th Ave',
    severity: 'high', status: 'investigating', upvotes: 12,
  },
  {
    id: 'wi2', type: 'broken-infrastructure', title: 'Leaking pipe near park entrance',
    description: 'Main water pipe leaking at Riverside Park entrance. Significant water waste estimated at 50+ gal/hour.',
    reportedBy: 'James T.', reportedAt: '1 week ago', location: 'Riverside Park',
    severity: 'moderate', status: 'in-progress', upvotes: 8,
  },
];

const DEMO_PROJECTS: SanitationProject[] = [
  {
    id: 'sp1', name: 'Community Sanitation Facility — Eastside',
    type: 'toilet', location: 'Eastside Community Center',
    description: 'Building 6 accessible public toilet units with handwashing stations. Serving 200+ families in the Eastside neighborhood.',
    progress: 65, volunteersNeeded: 20, volunteersJoined: 14,
    targetDate: 'Aug 2026', status: 'active',
    impact: '200+ families with improved sanitation access',
  },
  {
    id: 'sp2', name: 'Storm Drain Upgrade — Downtown',
    type: 'drainage', location: 'Downtown District',
    description: 'Replacing aging storm drains to prevent flooding during heavy rains. Includes water filtration before river discharge.',
    progress: 30, volunteersNeeded: 15, volunteersJoined: 6,
    targetDate: 'Dec 2026', status: 'active',
    impact: 'Reduced flooding risk for 500+ homes',
  },
  {
    id: 'sp3', name: 'Greywater Recycling Pilot',
    type: 'water-treatment', location: 'Riverside Neighborhood',
    description: 'Pilot program to recycle household greywater for garden irrigation. Reduces freshwater consumption by 30%.',
    progress: 10, volunteersNeeded: 10, volunteersJoined: 3,
    targetDate: 'Mar 2027', status: 'planning',
    impact: '30% reduction in freshwater use for 50 households',
  },
];

const DEMO_QUALITY_TESTS: WaterQualityTest[] = [
  {
    id: 'qt1', source: 'Riverside Community Well', testedBy: 'Community Lab',
    date: 'Mar 15, 2026', ph: 7.2, turbidity: '0.5 NTU',
    bacteria: 'none', contaminants: [], overall: 'safe', verified: true,
  },
  {
    id: 'qt2', source: 'Eastside Purification Station', testedBy: 'City Water Dept',
    date: 'Mar 20, 2026', ph: 7.0, turbidity: '0.2 NTU',
    bacteria: 'none', contaminants: [], overall: 'safe', verified: true,
  },
  {
    id: 'qt3', source: 'Hilltop Rain Harvest', testedBy: 'Sam R. (community)',
    date: 'Feb 28, 2026', ph: 6.8, turbidity: '2.1 NTU',
    bacteria: 'low', contaminants: ['Sediment'], overall: 'caution', verified: false,
  },
];

const DEMO_CONSERVATION_TIPS: ConservationTip[] = [
  {
    id: 'ct1', title: 'Fix leaky faucets immediately',
    description: 'A single dripping faucet can waste 3,000+ gallons per year. Check all taps monthly.',
    savingsPerDay: '8 gal', difficulty: 'easy', category: 'Home',
  },
  {
    id: 'ct2', title: 'Collect rain for gardens',
    description: 'A simple barrel on your downspout captures 50+ gallons per rain event for garden use.',
    savingsPerDay: '15 gal', difficulty: 'medium', category: 'Garden',
  },
  {
    id: 'ct3', title: 'Shorter showers save big',
    description: 'Cutting shower time by 2 minutes saves 5 gallons per shower. Multiply by your household.',
    savingsPerDay: '10 gal', difficulty: 'easy', category: 'Home',
  },
  {
    id: 'ct4', title: 'Water plants in the morning',
    description: 'Morning watering reduces evaporation by 30-50% compared to midday watering.',
    savingsPerDay: '5 gal', difficulty: 'easy', category: 'Garden',
  },
];

const ISSUE_TYPES: { key: WaterIssue['type']; label: string }[] = [
  { key: 'contamination', label: 'Contamination' },
  { key: 'shortage', label: 'Water Shortage' },
  { key: 'broken-infrastructure', label: 'Broken Infrastructure' },
  { key: 'flooding', label: 'Flooding' },
];

// ─── Helpers ───

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

function scoreColor(score: number): string {
  if (score >= 85) return SCORE_COLORS.excellent;
  if (score >= 70) return SCORE_COLORS.good;
  if (score >= 50) return SCORE_COLORS.moderate;
  if (score >= 30) return SCORE_COLORS.poor;
  return SCORE_COLORS.critical;
}

const TREND_ICONS: Record<string, string> = {
  improving: '\u2191',
  stable: '\u2192',
  declining: '\u2193',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#f97316',
};

// ─── Component ───

export function WaterSanitationScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [selectedProject, setSelectedProject] = useState<SanitationProject | null>(null);

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
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    bigScore: { fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
    scoreLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
    region: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 16 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    sourceName: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 2 },
    sourceType: { color: t.accent.blue, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    sourceLocation: { color: t.text.muted, fontSize: 12, marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    qualityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
    qualityText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    issueCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    issueTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    issueDesc: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginBottom: 6 },
    issueMeta: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    upvoteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    upvoteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: t.bg.primary },
    upvoteText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    reportBtn: { backgroundColor: '#f97316', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12, marginBottom: 8 },
    reportBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    reportTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    reportType: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.bg.card },
    reportTypeActive: { backgroundColor: t.accent.blue },
    reportTypeText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    reportTypeTextActive: { color: '#fff' },
    projectCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    projectName: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    projectDesc: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginBottom: 8 },
    projectMeta: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
    progressLabel: { color: t.text.muted, fontSize: 11, width: 60 },
    progressBar: { flex: 1, height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    progressPct: { color: t.text.secondary, fontSize: 11, fontWeight: '700', width: 40, textAlign: 'right' },
    impactText: { color: t.accent.green, fontSize: 12, fontWeight: '600', fontStyle: 'italic', marginTop: 6 },
    actionBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    secondaryBtn: { borderWidth: 1, borderColor: t.accent.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    secondaryBtnText: { color: t.accent.blue, fontSize: 14, fontWeight: '700' },
    testCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    testSource: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    testMeta: { color: t.text.muted, fontSize: 11, marginBottom: 6 },
    testRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    testLabel: { color: t.text.muted, fontSize: 11 },
    testVal: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    verifiedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6 },
    verifiedText: { fontSize: 9, fontWeight: '700', color: '#fff' },
    tipCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    tipTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    tipDesc: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginBottom: 6 },
    tipMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    tipSavings: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    tipDifficulty: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', color: '#fff' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.bg.primary },
    tagText: { color: t.text.secondary, fontSize: 10, fontWeight: '600' },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 15 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  // ─── Dashboard Tab ───

  const renderDashboard = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see sample water access data.</Text>;
    }

    const data = DEMO_WATER_ACCESS;
    const sc = scoreColor(data.score);

    return (
      <>
        <Text style={st.subtitle}>
          Track clean water access, sanitation infrastructure, and water quality in your region.
          A score of 100 means everyone has reliable access to safe, clean water.
        </Text>

        {/* Big Score */}
        <View style={st.card}>
          <Text style={[st.bigScore, { color: sc }]}>{data.score}</Text>
          <Text style={[st.scoreLabel, { color: sc }]}>
            {scoreLabel(data.score)} {TREND_ICONS[data.trend]}
          </Text>
          <Text style={st.region}>{data.region}</Text>

          <View style={st.divider} />

          {/* Breakdown bars */}
          {[
            { label: 'Clean Water Access', value: data.cleanWater },
            { label: 'Sanitation', value: data.sanitation },
            { label: 'Infrastructure', value: data.infrastructure },
          ].map(item => (
            <View key={item.label} style={{ marginBottom: 10 }}>
              <View style={st.row}>
                <Text style={st.label}>{item.label}</Text>
                <Text style={st.val}>{item.value}/100</Text>
              </View>
              <View style={st.barContainer}>
                <View style={[st.barFill, {
                  width: `${item.value}%`,
                  backgroundColor: scoreColor(item.value),
                }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.green }]}>3</Text>
            <Text style={st.summaryLabel}>Water Sources</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#f97316' }]}>2</Text>
            <Text style={st.summaryLabel}>Issues Reported</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.blue }]}>1</Text>
            <Text style={st.summaryLabel}>Active Project</Text>
          </View>
        </View>

        {/* Water Quality Tests */}
        <Text style={st.section}>Recent Water Quality Tests</Text>
        {DEMO_QUALITY_TESTS.map(test => (
          <View key={test.id} style={st.testCard}>
            <View style={st.row}>
              <Text style={st.testSource}>{test.source}</Text>
              <View style={[st.qualityBadge, { backgroundColor: QUALITY_COLORS[test.overall] }]}>
                <Text style={st.qualityText}>{test.overall.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={st.testMeta}>Tested by {test.testedBy} — {test.date}</Text>
            <View style={st.testRow}>
              <Text style={st.testLabel}>pH Level</Text>
              <Text style={st.testVal}>{test.ph}</Text>
            </View>
            <View style={st.testRow}>
              <Text style={st.testLabel}>Turbidity</Text>
              <Text style={st.testVal}>{test.turbidity}</Text>
            </View>
            <View style={st.testRow}>
              <Text style={st.testLabel}>Bacteria</Text>
              <Text style={[st.testVal, { color: BACTERIA_COLORS[test.bacteria] }]}>
                {test.bacteria === 'none' ? 'None detected' : test.bacteria.toUpperCase()}
              </Text>
            </View>
            {test.contaminants.length > 0 && (
              <View style={st.testRow}>
                <Text style={st.testLabel}>Contaminants</Text>
                <Text style={[st.testVal, { color: '#f97316' }]}>{test.contaminants.join(', ')}</Text>
              </View>
            )}
            <View style={[st.verifiedBadge, { backgroundColor: test.verified ? '#22c55e' : '#8E8E93' }]}>
              <Text style={st.verifiedText}>{test.verified ? 'VERIFIED' : 'UNVERIFIED'}</Text>
            </View>
          </View>
        ))}

        {/* Conservation Tips */}
        <Text style={st.section}>Water Conservation Tips</Text>
        {DEMO_CONSERVATION_TIPS.map(tip => (
          <View key={tip.id} style={st.tipCard}>
            <Text style={st.tipTitle}>{tip.title}</Text>
            <Text style={st.tipDesc}>{tip.description}</Text>
            <View style={st.tipMeta}>
              <Text style={st.tipSavings}>Saves ~{tip.savingsPerDay}/day</Text>
              <Text style={[st.tipDifficulty, { backgroundColor: DIFFICULTY_COLORS[tip.difficulty] }]}>
                {tip.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </>
    );
  }, [demoMode, st, t]);

  // ─── Sources Tab ───

  const renderSources = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see water sources.</Text>;
    }

    if (selectedSource) {
      const s = selectedSource;
      return (
        <>
          <Text style={st.sourceName}>{s.name}</Text>
          <Text style={st.sourceType}>{SOURCE_TYPE_LABELS[s.type]}</Text>
          <Text style={st.sourceLocation}>{s.location}</Text>

          <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[s.status] }]}>
            <Text style={st.statusText}>{s.status.toUpperCase()}</Text>
          </View>

          <View style={[st.qualityBadge, { backgroundColor: QUALITY_COLORS[s.quality] }]}>
            <Text style={st.qualityText}>Quality: {s.quality.toUpperCase()}</Text>
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <Text style={st.label}>Capacity</Text>
            <Text style={st.val}>{s.capacity}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Serves</Text>
            <Text style={st.val}>{s.servesHouseholds} households</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Last tested</Text>
            <Text style={st.val}>{s.lastTested}</Text>
          </View>

          {s.status === 'active' && (
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Request Water', `Request submitted for water from ${s.name}.`)}
            >
              <Text style={st.actionBtnText}>Request Water Access</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={st.secondaryBtn}
            onPress={() => Alert.alert('Report Issue', `Report an issue with ${s.name}.`)}
          >
            <Text style={st.secondaryBtnText}>Report Issue with Source</Text>
          </TouchableOpacity>

          <TouchableOpacity style={st.backBtn} onPress={() => setSelectedSource(null)}>
            <Text style={st.backText}>Back to Sources</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={st.subtitle}>
          Community water sources in your area. Tap a source for details,
          quality reports, and access requests.
        </Text>

        {DEMO_SOURCES.map(s => (
          <TouchableOpacity key={s.id} style={st.card} onPress={() => setSelectedSource(s)}>
            <View style={st.row}>
              <Text style={st.sourceName}>{s.name}</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[s.status], marginBottom: 0 }]}>
                <Text style={st.statusText}>{s.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={st.sourceType}>{SOURCE_TYPE_LABELS[s.type]}</Text>
            <Text style={st.sourceLocation}>{s.location}</Text>
            <View style={st.row}>
              <Text style={st.label}>Capacity: {s.capacity}</Text>
              <View style={[st.qualityBadge, { backgroundColor: QUALITY_COLORS[s.quality], marginBottom: 0 }]}>
                <Text style={st.qualityText}>{s.quality.toUpperCase()}</Text>
              </View>
            </View>
            <View style={st.row}>
              <Text style={st.label}>{s.servesHouseholds} households</Text>
              <Text style={st.val}>Tested: {s.lastTested}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={st.secondaryBtn}
          onPress={() => Alert.alert('Register Source', 'Coming soon — register a new community water source in your area.')}
        >
          <Text style={st.secondaryBtnText}>Register New Water Source</Text>
        </TouchableOpacity>
      </>
    );
  }, [demoMode, st, selectedSource]);

  // ─── Report Tab ───

  const [selectedIssueType, setSelectedIssueType] = useState<WaterIssue['type'] | null>(null);

  const renderReport = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see water issue reports.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Report water issues in your community. Every report helps prioritize
          infrastructure improvements and keeps neighbors safe.
        </Text>

        {/* Report a New Issue */}
        <Text style={st.section}>Report a New Issue</Text>
        <View style={st.reportTypeRow}>
          {ISSUE_TYPES.map(it => (
            <TouchableOpacity
              key={it.key}
              style={[st.reportType, selectedIssueType === it.key && st.reportTypeActive]}
              onPress={() => setSelectedIssueType(selectedIssueType === it.key ? null : it.key)}
            >
              <Text style={[st.reportTypeText, selectedIssueType === it.key && st.reportTypeTextActive]}>
                {it.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={st.reportBtn}
          onPress={() => {
            if (!selectedIssueType) {
              Alert.alert('Select Type', 'Please select an issue type first.');
              return;
            }
            const label = ISSUE_TYPES.find(i => i.key === selectedIssueType)?.label;
            Alert.alert('Report Submitted', `Your ${label} report has been submitted. Community members and officials will be notified.`);
            setSelectedIssueType(null);
          }}
        >
          <Text style={st.reportBtnText}>Submit Report</Text>
        </TouchableOpacity>

        {/* Open Issues */}
        <Text style={st.section}>Open Issues ({DEMO_ISSUES.length})</Text>
        {DEMO_ISSUES.map(issue => (
          <View key={issue.id} style={[st.issueCard, { borderLeftColor: SEVERITY_COLORS[issue.severity] }]}>
            <View style={st.row}>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[issue.status], marginBottom: 4 }]}>
                <Text style={st.statusText}>{issue.status.toUpperCase().replace('-', ' ')}</Text>
              </View>
              <View style={[st.qualityBadge, { backgroundColor: SEVERITY_COLORS[issue.severity], marginBottom: 4 }]}>
                <Text style={st.qualityText}>{issue.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={st.issueTitle}>{issue.title}</Text>
            <Text style={st.issueDesc}>{issue.description}</Text>
            <Text style={st.issueMeta}>Reported by {issue.reportedBy} — {issue.reportedAt}</Text>
            <Text style={st.issueMeta}>Location: {issue.location}</Text>
            <View style={st.upvoteRow}>
              <TouchableOpacity
                style={st.upvoteBtn}
                onPress={() => Alert.alert('Confirmed', 'You confirmed this issue. This helps prioritize the response.')}
              >
                <Text style={st.upvoteText}>{'\u2191'} {issue.upvotes} Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </>
    );
  }, [demoMode, st, selectedIssueType]);

  // ─── Projects Tab ───

  const renderProjects = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see sanitation projects.</Text>;
    }

    if (selectedProject) {
      const p = selectedProject;
      return (
        <>
          <Text style={st.projectName}>{p.name}</Text>
          <View style={st.tagRow}>
            <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[p.status] }]}>
              <Text style={st.statusText}>{p.status.toUpperCase()}</Text>
            </View>
            <View style={st.tag}>
              <Text style={st.tagText}>{p.type.replace('-', ' ').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={st.projectMeta}>Location: {p.location}</Text>
          <Text style={st.projectMeta}>Target: {p.targetDate}</Text>

          <View style={st.divider} />

          <Text style={st.projectDesc}>{p.description}</Text>

          <View style={st.progressRow}>
            <Text style={st.progressLabel}>Progress</Text>
            <View style={st.progressBar}>
              <View style={[st.progressFill, { width: `${p.progress}%` }]} />
            </View>
            <Text style={st.progressPct}>{p.progress}%</Text>
          </View>

          <View style={st.row}>
            <Text style={st.label}>Volunteers</Text>
            <Text style={st.val}>{p.volunteersJoined} / {p.volunteersNeeded}</Text>
          </View>
          <View style={st.barContainer}>
            <View style={[st.barFill, {
              width: `${Math.min(100, (p.volunteersJoined / p.volunteersNeeded) * 100)}%`,
              backgroundColor: t.accent.green,
            }]} />
          </View>

          <Text style={st.impactText}>Impact: {p.impact}</Text>

          {p.volunteersJoined < p.volunteersNeeded && (
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Volunteer', `Thank you! You've signed up to volunteer for ${p.name}.`)}
            >
              <Text style={st.actionBtnText}>Volunteer for This Project</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={st.secondaryBtn}
            onPress={() => Alert.alert('Donate', 'Coming soon — contribute materials or funds to this project.')}
          >
            <Text style={st.secondaryBtnText}>Donate to Project</Text>
          </TouchableOpacity>

          <TouchableOpacity style={st.backBtn} onPress={() => setSelectedProject(null)}>
            <Text style={st.backText}>Back to Projects</Text>
          </TouchableOpacity>
        </>
      );
    }

    const activeProjects = DEMO_PROJECTS.filter(p => p.status === 'active');
    const planningProjects = DEMO_PROJECTS.filter(p => p.status === 'planning');

    return (
      <>
        <Text style={st.subtitle}>
          Community sanitation and water infrastructure projects.
          Volunteer, donate, or propose new projects to improve water access for everyone.
        </Text>

        {activeProjects.length > 0 && (
          <>
            <Text style={st.section}>Active Projects ({activeProjects.length})</Text>
            {activeProjects.map(p => (
              <TouchableOpacity key={p.id} style={st.projectCard} onPress={() => setSelectedProject(p)}>
                <View style={st.row}>
                  <Text style={st.projectName}>{p.name}</Text>
                  <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[p.status], marginBottom: 0 }]}>
                    <Text style={st.statusText}>{p.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={st.projectMeta}>{p.location} — Target: {p.targetDate}</Text>
                <View style={st.progressRow}>
                  <Text style={st.progressLabel}>Progress</Text>
                  <View style={st.progressBar}>
                    <View style={[st.progressFill, { width: `${p.progress}%` }]} />
                  </View>
                  <Text style={st.progressPct}>{p.progress}%</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Volunteers: {p.volunteersJoined}/{p.volunteersNeeded}</Text>
                  <Text style={st.val}>{p.type.replace('-', ' ')}</Text>
                </View>
                <Text style={st.impactText}>{p.impact}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {planningProjects.length > 0 && (
          <>
            <Text style={st.section}>Planning Phase ({planningProjects.length})</Text>
            {planningProjects.map(p => (
              <TouchableOpacity key={p.id} style={st.projectCard} onPress={() => setSelectedProject(p)}>
                <View style={st.row}>
                  <Text style={st.projectName}>{p.name}</Text>
                  <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[p.status], marginBottom: 0 }]}>
                    <Text style={st.statusText}>{p.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={st.projectMeta}>{p.location} — Target: {p.targetDate}</Text>
                <Text style={st.projectDesc}>{p.description}</Text>
                <View style={st.row}>
                  <Text style={st.label}>Volunteers: {p.volunteersJoined}/{p.volunteersNeeded}</Text>
                  <Text style={st.val}>{p.type.replace('-', ' ')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={st.secondaryBtn}
          onPress={() => Alert.alert('Propose Project', 'Coming soon — propose a new sanitation or water infrastructure project for your community.')}
        >
          <Text style={st.secondaryBtnText}>Propose New Project</Text>
        </TouchableOpacity>
      </>
    );
  }, [demoMode, st, t, selectedProject]);

  // ─── Render ───

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'sources': return renderSources();
      case 'report': return renderReport();
      case 'projects': return renderProjects();
    }
  }, [activeTab, renderDashboard, renderSources, renderReport, renderProjects]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Water & Sanitation</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <View style={st.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[st.tab, activeTab === tab.key && st.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                setSelectedSource(null);
                setSelectedProject(null);
              }}
            >
              <Text style={[st.tabText, activeTab === tab.key && st.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
