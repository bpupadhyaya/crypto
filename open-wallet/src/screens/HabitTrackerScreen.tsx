import { fonts } from '../utils/theme';
/**
 * Habit Tracker — Track daily habits for personal growth.
 *
 * Consistency in positive habits earns hOTK (health OTK). This screen
 * lets users define habits, track daily completion, maintain streaks,
 * and earn rewards for sustained positive behavior.
 *
 * Features:
 * - Habits: today's habit checklist with completion status
 * - Streaks: view current and longest streaks for each habit
 * - Create: define new habits with frequency and OTK rewards
 * - Demo mode with sample habit data
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

type HabitTab = 'habits' | 'streaks' | 'create';

interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  otkReward: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  totalCompletions: number;
  createdAt: string;
}

interface HabitTemplate {
  name: string;
  icon: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  otkReward: number;
  description: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  wellness: '#22c55e',
  learning: '#3b82f6',
  social: '#8b5cf6',
  mindfulness: '#eab308',
  fitness: '#ef4444',
  creativity: '#f7931a',
};

const DEMO_HABITS: Habit[] = [
  { id: 'h1', name: 'Morning meditation', icon: '\u{1F9D8}', category: 'mindfulness', frequency: 'daily', otkReward: 10, currentStreak: 23, longestStreak: 45, completedToday: true, totalCompletions: 156, createdAt: '6 months ago' },
  { id: 'h2', name: '30 min exercise', icon: '\u{1F3CB}', category: 'fitness', frequency: 'daily', otkReward: 15, currentStreak: 12, longestStreak: 30, completedToday: false, totalCompletions: 98, createdAt: '4 months ago' },
  { id: 'h3', name: 'Read 20 pages', icon: '\u{1F4D6}', category: 'learning', frequency: 'daily', otkReward: 10, currentStreak: 45, longestStreak: 45, completedToday: true, totalCompletions: 210, createdAt: '8 months ago' },
  { id: 'h4', name: 'Gratitude journal', icon: '\u{1F4DD}', category: 'mindfulness', frequency: 'daily', otkReward: 8, currentStreak: 7, longestStreak: 21, completedToday: false, totalCompletions: 64, createdAt: '3 months ago' },
  { id: 'h5', name: 'Call a friend', icon: '\u{1F4DE}', category: 'social', frequency: 'weekly', otkReward: 20, currentStreak: 8, longestStreak: 12, completedToday: true, totalCompletions: 32, createdAt: '5 months ago' },
  { id: 'h6', name: 'Creative project time', icon: '\u{1F3A8}', category: 'creativity', frequency: 'daily', otkReward: 12, currentStreak: 3, longestStreak: 14, completedToday: false, totalCompletions: 41, createdAt: '2 months ago' },
  { id: 'h7', name: 'Healthy meal prep', icon: '\u{1F957}', category: 'wellness', frequency: 'weekly', otkReward: 25, currentStreak: 6, longestStreak: 10, completedToday: true, totalCompletions: 28, createdAt: '4 months ago' },
];

const HABIT_TEMPLATES: HabitTemplate[] = [
  { name: 'Daily walk (30 min)', icon: '\u{1F6B6}', category: 'fitness', frequency: 'daily', otkReward: 12, description: 'Walk at least 30 minutes every day for physical and mental health.' },
  { name: 'Learn a new word', icon: '\u{1F4AC}', category: 'learning', frequency: 'daily', otkReward: 5, description: 'Expand your vocabulary by learning one new word each day.' },
  { name: 'Digital detox hour', icon: '\u{1F4F5}', category: 'mindfulness', frequency: 'daily', otkReward: 10, description: 'Spend one hour without screens each day.' },
  { name: 'Volunteer session', icon: '\u{1F91D}', category: 'social', frequency: 'weekly', otkReward: 30, description: 'Dedicate time weekly to volunteering in your community.' },
  { name: 'Practice an instrument', icon: '\u{1F3B5}', category: 'creativity', frequency: 'daily', otkReward: 10, description: 'Practice a musical instrument for at least 15 minutes.' },
  { name: 'Drink 8 glasses of water', icon: '\u{1F4A7}', category: 'wellness', frequency: 'daily', otkReward: 5, description: 'Stay hydrated by drinking at least 8 glasses of water.' },
];

export function HabitTrackerScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<HabitTab>('habits');

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
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    habitName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    habitMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    checkBox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkMark: { color: '#fff', fontSize: 14, fontWeight: fonts.heavy },
    streakNum: { fontSize: 22, fontWeight: fonts.heavy },
    streakLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold },
    streakContainer: { alignItems: 'center', marginRight: 16 },
    barContainer: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    templateDesc: { color: t.text.muted, fontSize: 12, lineHeight: 17, marginTop: 6 },
    rewardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.accent.green + '20' },
    rewardText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
    categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  }), [t]);

  const habits = demoMode ? DEMO_HABITS : [];
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalOTKToday = habits.filter(h => h.completedToday).reduce((s, h) => s + h.otkReward, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  const sortedByStreak = useMemo(() => [...habits].sort((a, b) => b.currentStreak - a.currentStreak), [habits]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Habit Tracker</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Build consistent positive habits to earn hOTK. Streaks multiply your rewards.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{completedCount}/{habits.length}</Text>
              <Text style={st.summaryLabel}>Today</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{totalOTKToday}</Text>
              <Text style={st.summaryLabel}>OTK Earned</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{bestStreak}d</Text>
              <Text style={st.summaryLabel}>Best Streak</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['habits', 'streaks', 'create'] as HabitTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'habits' && (
          habits.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see sample habits.</Text>
          ) : habits.map(h => {
            const color = CATEGORY_COLORS[h.category] || t.accent.blue;
            return (
              <View key={h.id} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={[st.checkBox, { borderColor: color, backgroundColor: h.completedToday ? color : 'transparent' }]}>
                  {h.completedToday && <Text style={st.checkMark}>{'\u2713'}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.habitName, h.completedToday && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{h.icon} {h.name}</Text>
                  <Text style={st.habitMeta}>{h.frequency} | {h.currentStreak}d streak</Text>
                </View>
                <View style={st.rewardBadge}>
                  <Text style={st.rewardText}>+{h.otkReward}</Text>
                </View>
              </View>
            );
          })
        )}

        {activeTab === 'streaks' && (
          sortedByStreak.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see streak data.</Text>
          ) : sortedByStreak.map(h => {
            const color = CATEGORY_COLORS[h.category] || t.accent.blue;
            const pct = h.longestStreak > 0 ? (h.currentStreak / h.longestStreak) * 100 : 0;
            return (
              <View key={h.id} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <View style={st.streakContainer}>
                  <Text style={[st.streakNum, { color }]}>{h.currentStreak}</Text>
                  <Text style={st.streakLabel}>days</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.habitName}>{h.icon} {h.name}</Text>
                  <View style={st.barContainer}>
                    <View style={[st.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
                  </View>
                  <View style={[st.row, { marginTop: 4 }]}>
                    <Text style={st.label}>Best: {h.longestStreak}d</Text>
                    <Text style={st.val}>{h.totalCompletions} total</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {activeTab === 'create' && (
          <>
            <Text style={st.section}>Suggested habits</Text>
            {HABIT_TEMPLATES.map((tmpl, i) => {
              const color = CATEGORY_COLORS[tmpl.category] || t.accent.blue;
              return (
                <View key={i} style={st.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[st.categoryDot, { backgroundColor: color }]} />
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{tmpl.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={st.habitName}>{tmpl.name}</Text>
                      <Text style={st.habitMeta}>{tmpl.frequency} | +{tmpl.otkReward} hOTK</Text>
                    </View>
                  </View>
                  <Text style={st.templateDesc}>{tmpl.description}</Text>
                </View>
              );
            })}
          </>
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample habit data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
