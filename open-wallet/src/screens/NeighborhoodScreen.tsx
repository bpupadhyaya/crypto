import { fonts } from '../utils/theme';
/**
 * Neighborhood Screen — Art I of The Human Constitution.
 *
 * "Every person belongs to a neighborhood — the smallest unit of
 *  collective identity and mutual responsibility."
 *
 * Neighborhood profile, community identity, local pride.
 *
 * Features:
 * - Neighborhood profile (name, history, population, area, motto, values)
 * - Neighborhood achievements (milestones reached by the community)
 * - Community scorecard (health, education, safety, environment, economy, culture)
 * - Neighborhood goals (what the community is working toward)
 * - Welcome message for newcomers
 * - Photo gallery (neighborhood landmarks, events)
 * - Demo: neighborhood "Riverside Commons"
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

type TabKey = 'profile' | 'scorecard' | 'achievements' | 'goals';

interface NeighborhoodProfile {
  name: string;
  history: string;
  population: number;
  areaSqKm: number;
  motto: string;
  values: string[];
  welcomeMessage: string;
  landmarks: { name: string; icon: string; description: string }[];
}

interface ScoreCategory {
  key: string;
  label: string;
  icon: string;
  score: number;
  maxScore: number;
  trend: 'up' | 'stable' | 'down';
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  dateEarned: string;
  category: string;
}

interface NeighborhoodGoal {
  id: string;
  title: string;
  icon: string;
  description: string;
  progress: number;
  target: string;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: '\u{1F3E0}' },
  { key: 'scorecard', label: 'Scorecard', icon: '\u{1F4CA}' },
  { key: 'achievements', label: 'Achievements', icon: '\u{1F3C6}' },
  { key: 'goals', label: 'Goals', icon: '\u{1F3AF}' },
];

const DEMO_PROFILE: NeighborhoodProfile = {
  name: 'Riverside Commons',
  history: 'Founded in 1892 along the banks of the Cedar River, Riverside Commons grew from a small farming settlement into a vibrant, diverse community known for its strong civic participation and mutual aid traditions.',
  population: 12_400,
  areaSqKm: 4.8,
  motto: 'Together We Flow Forward',
  values: ['Mutual Aid', 'Sustainability', 'Inclusivity', 'Education', 'Stewardship'],
  welcomeMessage: 'Welcome to Riverside Commons! Whether you are new here or returning home, you belong. Visit our Community Center on Elm Street to meet your neighbors and learn about local programs.',
  landmarks: [
    { name: 'Cedar River Bridge', icon: '\u{1F309}', description: 'Historic stone bridge connecting east and west neighborhoods, built 1923' },
    { name: 'Commons Park', icon: '\u{1F333}', description: '12-acre park with playground, community garden, and amphitheater' },
    { name: 'Old Mill Library', icon: '\u{1F4DA}', description: 'Converted grain mill, now a public library and maker space' },
    { name: 'Riverside Market', icon: '\u{1F6D2}', description: 'Weekly farmers market, every Saturday since 1965' },
  ],
};

const DEMO_SCORES: ScoreCategory[] = [
  { key: 'health', label: 'Health', icon: '\u{1FA7A}', score: 82, maxScore: 100, trend: 'up', color: '#22c55e' },
  { key: 'education', label: 'Education', icon: '\u{1F4DA}', score: 91, maxScore: 100, trend: 'up', color: '#3b82f6' },
  { key: 'safety', label: 'Safety', icon: '\u{1F6E1}', score: 76, maxScore: 100, trend: 'stable', color: '#eab308' },
  { key: 'environment', label: 'Environment', icon: '\u{1F33F}', score: 88, maxScore: 100, trend: 'up', color: '#10b981' },
  { key: 'economy', label: 'Economy', icon: '\u{1F4B0}', score: 69, maxScore: 100, trend: 'down', color: '#f7931a' },
  { key: 'culture', label: 'Culture', icon: '\u{1F3AD}', score: 85, maxScore: 100, trend: 'stable', color: '#8b5cf6' },
];

const DEMO_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: '100% Voter Turnout', icon: '\u{1F5F3}', description: 'Every registered adult voted in the 2025 community council election', dateEarned: '2025-11-15', category: 'Civic' },
  { id: '2', title: 'Zero Waste Week', icon: '\u{267B}', description: 'Achieved zero landfill waste for an entire week through composting and recycling', dateEarned: '2026-02-01', category: 'Environment' },
  { id: '3', title: 'Reading Champion', icon: '\u{1F4D6}', description: 'Community read 10,000 books collectively through the library program', dateEarned: '2026-03-10', category: 'Education' },
];

const DEMO_GOALS: NeighborhoodGoal[] = [
  { id: '1', title: 'Community Solar Farm', icon: '\u{2600}', description: 'Install a shared solar array to provide clean energy for 500 homes', progress: 0.62, target: '$180,000 raised' },
  { id: '2', title: 'Youth Mentorship 100', icon: '\u{1F91D}', description: 'Match 100 young people with adult mentors by end of year', progress: 0.45, target: '45 of 100 matched' },
];

function trendIcon(trend: 'up' | 'stable' | 'down'): string {
  if (trend === 'up') return '\u2191';
  if (trend === 'down') return '\u2193';
  return '\u2192';
}

function trendColor(trend: 'up' | 'stable' | 'down'): string {
  if (trend === 'up') return '#22c55e';
  if (trend === 'down') return '#ef4444';
  return '#eab308';
}

export function NeighborhoodScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const profile = demoMode ? DEMO_PROFILE : null;
  const scores = demoMode ? DEMO_SCORES : [];
  const achievements = demoMode ? DEMO_ACHIEVEMENTS : [];
  const goals = demoMode ? DEMO_GOALS : [];

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2 },
    tabTextActive: { color: '#fff' },
    tabIcon: { fontSize: fonts.xl },

    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 4, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroName: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroMotto: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
    heroStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
    heroStat: { alignItems: 'center' },
    heroStatNum: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    heroStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },

    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 6 },
    cardDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20 },

    valuesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 12 },
    valueChip: { backgroundColor: t.accent.blue + '18', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    valueText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },

    welcomeCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    welcomeTitle: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 8 },
    welcomeText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20 },

    landmarkCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    landmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    landmarkIcon: { fontSize: fonts.hero },
    landmarkName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    landmarkDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },

    scoreOverall: { backgroundColor: t.accent.blue + '12', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 4, alignItems: 'center' },
    scoreOverallNum: { color: t.accent.blue, fontSize: 48, fontWeight: fonts.heavy },
    scoreOverallLabel: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    scoreCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    scoreIcon: { fontSize: fonts.xxxl },
    scoreLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    scoreNum: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    scoreTrend: { fontSize: fonts.md, fontWeight: fonts.bold, marginLeft: 6 },
    scoreBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 10 },
    scoreBarFill: { height: 6, borderRadius: 3 },

    achieveCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    achieveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    achieveIcon: { fontSize: fonts.hero },
    achieveTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    achieveDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2, lineHeight: 18 },
    achieveDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, fontWeight: fonts.semibold },
    achieveBadge: { backgroundColor: t.accent.purple + '18', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', marginTop: 6 },
    achieveBadgeText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold },

    goalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    goalIcon: { fontSize: fonts.hero },
    goalTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    goalDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginBottom: 10 },
    goalBarBg: { height: 10, borderRadius: 5, backgroundColor: t.bg.primary },
    goalBarFill: { height: 10, borderRadius: 5, backgroundColor: t.accent.blue },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    goalPercent: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.heavy },
    goalTarget: { color: t.text.muted, fontSize: fonts.sm },

    emptyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 32, marginHorizontal: 20, alignItems: 'center', marginTop: 20 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 6 },
    emptyDesc: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', lineHeight: 20 },
    demoBadge: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 8 },
    demoBadgeText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const renderProfile = () => {
    if (!profile) return renderEmpty();
    return (
      <>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3D8}'}</Text>
          <Text style={s.heroName}>{profile.name}</Text>
          <Text style={s.heroMotto}>"{profile.motto}"</Text>
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{profile.population.toLocaleString()}</Text>
              <Text style={s.heroStatLabel}>Residents</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{profile.areaSqKm} km{'\u00B2'}</Text>
              <Text style={s.heroStatLabel}>Area</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{overallScore}</Text>
              <Text style={s.heroStatLabel}>Score</Text>
            </View>
          </View>
        </View>

        <Text style={s.section}>History</Text>
        <View style={s.card}>
          <Text style={s.cardDesc}>{profile.history}</Text>
        </View>

        <Text style={s.section}>Core Values</Text>
        <View style={s.valuesRow}>
          {profile.values.map(v => (
            <View key={v} style={s.valueChip}>
              <Text style={s.valueText}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={s.section}>Welcome</Text>
        <View style={s.welcomeCard}>
          <Text style={s.welcomeTitle}>{'\u{1F44B}'} New Here?</Text>
          <Text style={s.welcomeText}>{profile.welcomeMessage}</Text>
        </View>

        <Text style={s.section}>Landmarks</Text>
        {profile.landmarks.map(lm => (
          <View key={lm.name} style={s.landmarkCard}>
            <View style={s.landmarkRow}>
              <Text style={s.landmarkIcon}>{lm.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.landmarkName}>{lm.name}</Text>
                <Text style={s.landmarkDesc}>{lm.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderScorecard = () => {
    if (scores.length === 0) return renderEmpty();
    return (
      <>
        <View style={s.scoreOverall}>
          <Text style={s.scoreOverallNum}>{overallScore}</Text>
          <Text style={s.scoreOverallLabel}>Overall Community Score</Text>
        </View>

        <Text style={s.section}>Category Scores</Text>
        {scores.map(sc => (
          <View key={sc.key} style={s.scoreCard}>
            <View style={s.scoreRow}>
              <View style={s.scoreLeft}>
                <Text style={s.scoreIcon}>{sc.icon}</Text>
                <Text style={s.scoreLabel}>{sc.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[s.scoreNum, { color: sc.color }]}>{sc.score}</Text>
                <Text style={[s.scoreTrend, { color: trendColor(sc.trend) }]}>{trendIcon(sc.trend)}</Text>
              </View>
            </View>
            <View style={s.scoreBar}>
              <View style={[s.scoreBarFill, { width: `${sc.score}%`, backgroundColor: sc.color }]} />
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderAchievements = () => {
    if (achievements.length === 0) return renderEmpty();
    return (
      <>
        <Text style={s.section}>{achievements.length} Achievement{achievements.length !== 1 ? 's' : ''} Earned</Text>
        {achievements.map(a => (
          <View key={a.id} style={s.achieveCard}>
            <View style={s.achieveRow}>
              <Text style={s.achieveIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.achieveTitle}>{a.title}</Text>
                <Text style={s.achieveDesc}>{a.description}</Text>
                <Text style={s.achieveDate}>{a.dateEarned}</Text>
                <View style={s.achieveBadge}>
                  <Text style={s.achieveBadgeText}>{a.category}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderGoals = () => {
    if (goals.length === 0) return renderEmpty();
    return (
      <>
        <Text style={s.section}>Community Goals</Text>
        {goals.map(g => (
          <View key={g.id} style={s.goalCard}>
            <View style={s.goalHeader}>
              <Text style={s.goalIcon}>{g.icon}</Text>
              <Text style={s.goalTitle}>{g.title}</Text>
            </View>
            <Text style={s.goalDesc}>{g.description}</Text>
            <View style={s.goalBarBg}>
              <View style={[s.goalBarFill, { width: `${Math.round(g.progress * 100)}%` }]} />
            </View>
            <View style={s.goalFooter}>
              <Text style={s.goalPercent}>{Math.round(g.progress * 100)}%</Text>
              <Text style={s.goalTarget}>{g.target}</Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>{'\u{1F3D8}'}</Text>
      <Text style={s.emptyTitle}>No Neighborhood Data</Text>
      <Text style={s.emptyDesc}>
        Enable demo mode to explore a sample neighborhood, or join a neighborhood on Open Chain.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F3D8}'} Neighborhood</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoBadge}>
          <Text style={s.demoBadgeText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'scorecard' && renderScorecard()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'goals' && renderGoals()}
      </ScrollView>
    </SafeAreaView>
  );
}
