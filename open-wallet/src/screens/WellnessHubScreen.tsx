import { fonts } from '../utils/theme';
/**
 * Wellness Hub Screen — Unified wellness overview connecting all health screens.
 *
 * Art I (hOTK): Health is the foundation of human value. This hub
 * brings together physical, mental, nutritional, and spiritual
 * wellness into a single composite view — because a healthy
 * person builds a healthy community.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Props {
  onClose: () => void;
}

interface WellnessCategory {
  key: string;
  label: string;
  icon: string;
  score: number;
  color: string;
}

interface QuickLink {
  key: string;
  label: string;
  icon: string;
  desc: string;
}

interface WellnessGoal {
  id: string;
  title: string;
  icon: string;
  target: string;
  progress: number; // 0-1
  streak: number;
}

interface DailyEntry {
  key: string;
  label: string;
  icon: string;
  value: string;
  status: 'good' | 'fair' | 'needs_attention';
}

// --- Constants ---

const STATUS_COLORS: Record<string, string> = {
  good: '#34C759',
  fair: '#FF9500',
  needs_attention: '#FF3B30',
};

// --- Demo data ---

const DEMO_WELLNESS_SCORE = 74;

const DEMO_CATEGORIES: WellnessCategory[] = [
  { key: 'physical', label: 'Physical', icon: '\u{1F3CB}', score: 78, color: '#FF6B6B' },
  { key: 'mental', label: 'Mental', icon: '\u{1F9E0}', score: 71, color: '#A78BFA' },
  { key: 'nutrition', label: 'Nutrition', icon: '\u{1F957}', score: 82, color: '#34D399' },
  { key: 'sleep', label: 'Sleep', icon: '\u{1F634}', score: 65, color: '#60A5FA' },
  { key: 'fitness', label: 'Fitness', icon: '\u{1F4AA}', score: 74, color: '#F59E0B' },
];

const DEMO_TODAY: DailyEntry[] = [
  { key: 'mood', label: 'Mood', icon: '\u{1F60A}', value: 'Good', status: 'good' },
  { key: 'sleep', label: 'Sleep Last Night', icon: '\u{1F634}', value: '6.5 hrs', status: 'fair' },
  { key: 'meals', label: 'Meals Logged', icon: '\u{1F372}', value: '2 of 3', status: 'fair' },
  { key: 'steps', label: 'Steps', icon: '\u{1F6B6}', value: '7,240', status: 'good' },
  { key: 'meditation', label: 'Meditation', icon: '\u{1F9D8}', value: '15 min', status: 'good' },
  { key: 'water', label: 'Water', icon: '\u{1F4A7}', value: '5 glasses', status: 'fair' },
];

const DEMO_GOALS: WellnessGoal[] = [
  { id: 'g1', title: 'Meditate 20 min daily', icon: '\u{1F9D8}', target: '20 min/day', progress: 0.75, streak: 12 },
  { id: 'g2', title: 'Walk 10,000 steps', icon: '\u{1F6B6}', target: '10,000 steps/day', progress: 0.72, streak: 5 },
  { id: 'g3', title: 'Sleep 8 hours', icon: '\u{1F634}', target: '8 hrs/night', progress: 0.81, streak: 3 },
];

const DEMO_QUICK_LINKS: QuickLink[] = [
  { key: 'wellness', label: 'Wellness', icon: '\u{1F49A}', desc: 'General wellness tracking' },
  { key: 'mental', label: 'Mental Health', icon: '\u{1F9E0}', desc: 'Mood and mental state' },
  { key: 'maternal', label: 'Maternal', icon: '\u{1F930}', desc: 'Pregnancy and postnatal' },
  { key: 'yoga', label: 'Yoga', icon: '\u{1F9D8}', desc: 'Yoga practice tracking' },
  { key: 'meditation', label: 'Meditation', icon: '\u{1F54A}', desc: 'Mindfulness sessions' },
  { key: 'sports', label: 'Sports', icon: '\u26BD', desc: 'Sports and activities' },
  { key: 'nutrition', label: 'Nutrition', icon: '\u{1F957}', desc: 'Diet and meal tracking' },
  { key: 'sleep', label: 'Sleep', icon: '\u{1F319}', desc: 'Sleep quality analysis' },
  { key: 'allergy', label: 'Allergy', icon: '\u{1F927}', desc: 'Allergy management' },
  { key: 'recovery', label: 'Recovery', icon: '\u{1FA79}', desc: 'Injury and recovery' },
  { key: 'firstaid', label: 'First Aid', icon: '\u{1F6D1}', desc: 'Emergency guidance' },
];

const DEMO_WEEKLY_SUMMARY = {
  avgScore: 72,
  bestDay: 'Wednesday',
  bestScore: 84,
  worstDay: 'Monday',
  worstScore: 61,
  trend: 'improving' as const,
  meditationDays: 5,
  exerciseDays: 4,
  avgSleep: 6.8,
};

// --- Helpers ---

function scoreColor(score: number): string {
  if (score >= 80) return '#34C759';
  if (score >= 60) return '#FF9500';
  return '#FF3B30';
}

function scoreBand(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Attention';
}

// --- Component ---

export function WellnessHubScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    demoTag: { backgroundColor: t.accent.orange + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    scoreCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 28, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
    scoreRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    scoreValue: { fontSize: fonts.hero, fontWeight: fonts.heavy },
    scoreBand: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    scoreSubtitle: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: '100%' },
    categoryItem: { alignItems: 'center', flex: 1 },
    categoryIcon: { fontSize: fonts.xxl, marginBottom: 4 },
    categoryScore: { fontSize: fonts.lg, fontWeight: fonts.heavy },
    categoryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    categoryBar: { width: 36, height: 4, borderRadius: 2, marginTop: 4 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 8 },
    todayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    todayCard: { width: '31%' as any, backgroundColor: t.bg.card, borderRadius: 14, padding: 12, alignItems: 'center' },
    todayIcon: { fontSize: fonts.xxl, marginBottom: 4 },
    todayValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center' },
    todayLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    todayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    quickCard: { width: '31%' as any, backgroundColor: t.bg.card, borderRadius: 14, padding: 12, alignItems: 'center' },
    quickIcon: { fontSize: fonts.xxxl, marginBottom: 6 },
    quickLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, textAlign: 'center' },
    goalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    goalIcon: { fontSize: fonts.xxl },
    goalTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    goalStreak: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold },
    goalProgressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, overflow: 'hidden' },
    goalProgressFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    goalTarget: { color: t.text.muted, fontSize: fonts.xs, marginTop: 6 },
    weeklyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 20 },
    weeklyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weeklyLabel: { color: t.text.muted, fontSize: fonts.sm },
    weeklyValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    weeklyTrend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 },
    weeklyTrendIcon: { fontSize: fonts.xl },
    weeklyTrendText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
  }), [t]);

  const mainScoreColor = scoreColor(DEMO_WELLNESS_SCORE);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F49A}'} Wellness Hub</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoTagText}>DEMO DATA</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Composite Wellness Score */}
        <View style={s.scoreCard}>
          <View style={[s.scoreRing, { borderColor: mainScoreColor }]}>
            <Text style={[s.scoreValue, { color: mainScoreColor }]}>{DEMO_WELLNESS_SCORE}</Text>
          </View>
          <Text style={s.scoreBand}>{scoreBand(DEMO_WELLNESS_SCORE)}</Text>
          <Text style={s.scoreSubtitle}>Composite Wellness Score</Text>

          {/* Category Breakdown */}
          <View style={s.categoryRow}>
            {DEMO_CATEGORIES.map(cat => (
              <View key={cat.key} style={s.categoryItem}>
                <Text style={s.categoryIcon}>{cat.icon}</Text>
                <Text style={[s.categoryScore, { color: scoreColor(cat.score) }]}>{cat.score}</Text>
                <Text style={s.categoryLabel}>{cat.label}</Text>
                <View style={[s.categoryBar, { backgroundColor: cat.color + '40' }]}>
                  <View style={{ width: `${cat.score}%`, height: 4, borderRadius: 2, backgroundColor: cat.color }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Wellness */}
        <Text style={s.section}>Today's Wellness</Text>
        <View style={s.todayGrid}>
          {DEMO_TODAY.map(entry => (
            <View key={entry.key} style={s.todayCard}>
              <Text style={s.todayIcon}>{entry.icon}</Text>
              <Text style={s.todayValue}>{entry.value}</Text>
              <Text style={s.todayLabel}>{entry.label}</Text>
              <View style={[s.todayDot, { backgroundColor: STATUS_COLORS[entry.status] }]} />
            </View>
          ))}
        </View>

        {/* Wellness Goals */}
        <Text style={s.section}>Active Goals</Text>
        {DEMO_GOALS.map(goal => (
          <View key={goal.id} style={s.goalCard}>
            <View style={s.goalHeader}>
              <Text style={s.goalIcon}>{goal.icon}</Text>
              <Text style={s.goalTitle}>{goal.title}</Text>
              <Text style={s.goalStreak}>{'\u{1F525}'} {goal.streak}d</Text>
            </View>
            <View style={s.goalProgressBar}>
              <View style={[s.goalProgressFill, { width: `${goal.progress * 100}%` }]} />
            </View>
            <Text style={s.goalTarget}>Target: {goal.target} {'\u00B7'} {Math.round(goal.progress * 100)}% today</Text>
          </View>
        ))}

        {/* Quick Links */}
        <Text style={s.section}>Health Screens</Text>
        <View style={s.quickGrid}>
          {DEMO_QUICK_LINKS.map(link => (
            <TouchableOpacity key={link.key} style={s.quickCard} activeOpacity={0.7}>
              <Text style={s.quickIcon}>{link.icon}</Text>
              <Text style={s.quickLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Summary */}
        <Text style={s.section}>Weekly Summary</Text>
        <View style={s.weeklyCard}>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Average Score</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.avgScore}</Text>
          </View>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Best Day</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.bestDay} ({DEMO_WEEKLY_SUMMARY.bestScore})</Text>
          </View>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Worst Day</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.worstDay} ({DEMO_WEEKLY_SUMMARY.worstScore})</Text>
          </View>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Meditation Days</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.meditationDays}/7</Text>
          </View>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Exercise Days</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.exerciseDays}/7</Text>
          </View>
          <View style={s.weeklyRow}>
            <Text style={s.weeklyLabel}>Avg Sleep</Text>
            <Text style={s.weeklyValue}>{DEMO_WEEKLY_SUMMARY.avgSleep} hrs</Text>
          </View>
          <View style={s.weeklyTrend}>
            <Text style={s.weeklyTrendIcon}>{'\u{1F4C8}'}</Text>
            <Text style={s.weeklyTrendText}>Trending Up</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
