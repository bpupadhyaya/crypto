import { fonts } from '../utils/theme';
/**
 * Digital Wellbeing Screen — Art I (hOTK) of The Human Constitution.
 *
 * "Technology should serve human flourishing, not consume it."
 *
 * Screen time awareness, digital balance, healthy tech habits.
 * Earn hOTK for maintaining consistent digital wellness practices.
 *
 * Features:
 * - Daily screen time summary (hours by category)
 * - Digital detox challenges (reduce screen time, earn hOTK)
 * - Mindful tech tips (breaks, no screens before bed, focus modes)
 * - App usage reflection (enriching vs. draining activities)
 * - Community digital wellness score
 * - Demo: 5.2 hours today, 3 categories, 1 active challenge, 4 tips
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

type TabKey = 'today' | 'challenges' | 'tips' | 'reflect';

interface ScreenTimeCategory {
  key: string;
  label: string;
  icon: string;
  hours: number;
  color: string;
  trend: 'up' | 'stable' | 'down';
}

interface DetoxChallenge {
  id: string;
  title: string;
  icon: string;
  description: string;
  durationDays: number;
  completedDays: number;
  hotkReward: number;
  active: boolean;
}

interface WellnessTip {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: string;
}

interface ReflectionEntry {
  id: string;
  activity: string;
  icon: string;
  hours: number;
  feeling: 'enriched' | 'neutral' | 'drained';
  note: string;
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '\u{1F4F1}' },
  { key: 'challenges', label: 'Challenges', icon: '\u{1F3AF}' },
  { key: 'tips', label: 'Tips', icon: '\u{1F4A1}' },
  { key: 'reflect', label: 'Reflect', icon: '\u{1F6AA}' },
];

const DEMO_SCREEN_TIME: ScreenTimeCategory[] = [
  { key: 'social', label: 'Social Media', icon: '\u{1F4AC}', hours: 1.3, color: '#3b82f6', trend: 'down' },
  { key: 'work', label: 'Work & Productivity', icon: '\u{1F4BC}', hours: 2.4, color: '#22c55e', trend: 'stable' },
  { key: 'education', label: 'Education & Learning', icon: '\u{1F4DA}', hours: 0.8, color: '#8b5cf6', trend: 'up' },
  { key: 'entertainment', label: 'Entertainment', icon: '\u{1F3AC}', hours: 0.7, color: '#f7931a', trend: 'down' },
];

const DEMO_TOTAL_HOURS = 5.2;

const DEMO_CHALLENGES: DetoxChallenge[] = [
  { id: '1', title: 'No Screens After 9pm', icon: '\u{1F319}', description: 'Put devices away after 9pm for better sleep quality. Blue light before bed disrupts your circadian rhythm.', durationDays: 7, completedDays: 3, hotkReward: 50, active: true },
  { id: '2', title: 'Social Media Fast', icon: '\u{1F910}', description: 'Go 5 days without social media. Reconnect with in-person relationships and reduce comparison anxiety.', durationDays: 5, completedDays: 0, hotkReward: 75, active: false },
  { id: '3', title: 'Mindful Morning', icon: '\u{1F305}', description: 'No phone for the first 30 minutes after waking. Start your day with intention, not notifications.', durationDays: 14, completedDays: 0, hotkReward: 100, active: false },
];

const DEMO_TIPS: WellnessTip[] = [
  { id: '1', title: 'The 20-20-20 Rule', icon: '\u{1F440}', description: 'Every 20 minutes, look at something 20 feet away for 20 seconds. This reduces eye strain and refocuses your mind.', category: 'Eye Health' },
  { id: '2', title: 'No Screens Before Bed', icon: '\u{1F634}', description: 'Stop using screens at least 30 minutes before sleep. Blue light suppresses melatonin and disrupts sleep quality.', category: 'Sleep' },
  { id: '3', title: 'Focus Mode Sessions', icon: '\u{1F3AF}', description: 'Use 25-minute focus blocks (Pomodoro) with 5-minute breaks. Single-tasking beats multitasking every time.', category: 'Productivity' },
  { id: '4', title: 'Notification Audit', icon: '\u{1F514}', description: 'Turn off non-essential notifications. Each interruption takes 23 minutes to fully recover from mentally.', category: 'Mental Health' },
];

const DEMO_REFLECTIONS: ReflectionEntry[] = [
  { id: '1', activity: 'Online Course', icon: '\u{1F393}', hours: 0.8, feeling: 'enriched', note: 'Learned about distributed systems. Felt engaged and curious.' },
  { id: '2', activity: 'Social Scrolling', icon: '\u{1F4F1}', hours: 0.9, feeling: 'drained', note: 'Mindless browsing. Felt distracted and unfocused afterward.' },
  { id: '3', activity: 'Video Call with Family', icon: '\u{1F4F9}', hours: 0.4, feeling: 'enriched', note: 'Connected with mom. Technology at its best.' },
  { id: '4', activity: 'News Reading', icon: '\u{1F4F0}', hours: 0.5, feeling: 'neutral', note: 'Stayed informed but felt somewhat anxious about headlines.' },
];

const COMMUNITY_WELLNESS_SCORE = 72;

function feelingIcon(feeling: 'enriched' | 'neutral' | 'drained'): string {
  if (feeling === 'enriched') return '\u{1F31F}';
  if (feeling === 'drained') return '\u{1F614}';
  return '\u{1F610}';
}

function feelingColor(feeling: 'enriched' | 'neutral' | 'drained'): string {
  if (feeling === 'enriched') return '#22c55e';
  if (feeling === 'drained') return '#ef4444';
  return '#eab308';
}

function feelingLabel(feeling: 'enriched' | 'neutral' | 'drained'): string {
  if (feeling === 'enriched') return 'Enriching';
  if (feeling === 'drained') return 'Draining';
  return 'Neutral';
}

function trendArrow(trend: 'up' | 'stable' | 'down'): string {
  if (trend === 'up') return '\u2191';
  if (trend === 'down') return '\u2193';
  return '\u2192';
}

export function DigitalWellbeingScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const screenTime = demoMode ? DEMO_SCREEN_TIME : [];
  const challenges = demoMode ? DEMO_CHALLENGES : [];
  const tips = demoMode ? DEMO_TIPS : [];
  const reflections = demoMode ? DEMO_REFLECTIONS : [];
  const totalHours = demoMode ? DEMO_TOTAL_HOURS : 0;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, marginTop: 2 },
    tabTextActive: { color: '#fff' },
    tabIcon: { fontSize: 18 },

    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 4, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroHours: { color: t.text.primary, fontSize: 42, fontWeight: fonts.heavy },
    heroLabel: { color: t.text.muted, fontSize: 14, fontWeight: fonts.semibold, marginTop: 2 },
    heroSubtext: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, marginTop: 8 },

    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    catCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    catIcon: { fontSize: 28 },
    catLabel: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    catHours: { fontSize: 18, fontWeight: fonts.heavy },
    catTrend: { fontSize: 12, fontWeight: fonts.bold, marginLeft: 4 },
    catBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 10 },
    catBarFill: { height: 6, borderRadius: 3 },

    communityCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    communityScore: { color: t.accent.blue, fontSize: 36, fontWeight: fonts.heavy },
    communityLabel: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },

    challengeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    challengeIcon: { fontSize: 32 },
    challengeTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    challengeActiveBadge: { backgroundColor: t.accent.green + '20', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
    challengeActiveText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    challengeDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
    challengeBarBg: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary },
    challengeBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    challengeProgress: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    challengeReward: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.bold },
    challengeStartBtn: { backgroundColor: t.accent.green + '15', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    challengeStartText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },

    tipCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    tipIcon: { fontSize: 28 },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    tipCatBadge: { backgroundColor: t.accent.blue + '18', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
    tipCatText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold },
    tipDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },

    reflectCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    reflectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    reflectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reflectIcon: { fontSize: 28 },
    reflectActivity: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    reflectHours: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    reflectFeeling: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
    reflectFeelingIcon: { fontSize: 14 },
    reflectFeelingText: { fontSize: 12, fontWeight: fonts.bold },
    reflectNote: { color: t.text.secondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

    reflectSummary: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 4 },
    reflectSummaryTitle: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold, marginBottom: 8 },
    reflectSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    reflectSumItem: { alignItems: 'center' },
    reflectSumNum: { fontSize: 20, fontWeight: fonts.heavy },
    reflectSumLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },

    emptyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 32, marginHorizontal: 20, alignItems: 'center', marginTop: 20 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold, marginBottom: 6 },
    emptyDesc: { color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    demoBadge: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 8 },
    demoBadgeText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const enrichedHours = reflections.filter(r => r.feeling === 'enriched').reduce((s, r) => s + r.hours, 0);
  const drainedHours = reflections.filter(r => r.feeling === 'drained').reduce((s, r) => s + r.hours, 0);
  const neutralHours = reflections.filter(r => r.feeling === 'neutral').reduce((s, r) => s + r.hours, 0);

  const renderToday = () => {
    if (screenTime.length === 0) return renderEmpty();
    return (
      <>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4F1}'}</Text>
          <Text style={s.heroHours}>{totalHours}h</Text>
          <Text style={s.heroLabel}>Total Screen Time Today</Text>
          <Text style={s.heroSubtext}>{'\u2193'} 0.8h less than yesterday</Text>
        </View>

        <Text style={s.section}>By Category</Text>
        {screenTime.map(cat => {
          const pct = totalHours > 0 ? Math.round((cat.hours / totalHours) * 100) : 0;
          return (
            <View key={cat.key} style={s.catCard}>
              <View style={s.catRow}>
                <View style={s.catLeft}>
                  <Text style={s.catIcon}>{cat.icon}</Text>
                  <Text style={s.catLabel}>{cat.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[s.catHours, { color: cat.color }]}>{cat.hours}h</Text>
                  <Text style={[s.catTrend, { color: cat.trend === 'down' ? '#22c55e' : cat.trend === 'up' ? '#ef4444' : '#eab308' }]}>
                    {trendArrow(cat.trend)}
                  </Text>
                </View>
              </View>
              <View style={s.catBar}>
                <View style={[s.catBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
          );
        })}

        <Text style={s.section}>Community Wellness</Text>
        <View style={s.communityCard}>
          <Text style={s.communityScore}>{COMMUNITY_WELLNESS_SCORE}</Text>
          <Text style={s.communityLabel}>Community Digital Wellness Score</Text>
        </View>
      </>
    );
  };

  const renderChallenges = () => {
    if (challenges.length === 0) return renderEmpty();
    return (
      <>
        <Text style={s.section}>Digital Detox Challenges</Text>
        {challenges.map(ch => {
          const pct = ch.durationDays > 0 ? Math.round((ch.completedDays / ch.durationDays) * 100) : 0;
          return (
            <View key={ch.id} style={s.challengeCard}>
              <View style={s.challengeHeader}>
                <Text style={s.challengeIcon}>{ch.icon}</Text>
                <Text style={s.challengeTitle}>{ch.title}</Text>
                {ch.active && (
                  <View style={s.challengeActiveBadge}>
                    <Text style={s.challengeActiveText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={s.challengeDesc}>{ch.description}</Text>
              {ch.active ? (
                <>
                  <View style={s.challengeBarBg}>
                    <View style={[s.challengeBarFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={s.challengeFooter}>
                    <Text style={s.challengeProgress}>Day {ch.completedDays} of {ch.durationDays}</Text>
                    <Text style={s.challengeReward}>{ch.hotkReward} hOTK reward</Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity style={s.challengeStartBtn}>
                  <Text style={s.challengeStartText}>Start Challenge ({ch.hotkReward} hOTK)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </>
    );
  };

  const renderTips = () => {
    if (tips.length === 0) return renderEmpty();
    return (
      <>
        <Text style={s.section}>Mindful Tech Tips</Text>
        {tips.map(tip => (
          <View key={tip.id} style={s.tipCard}>
            <View style={s.tipHeader}>
              <Text style={s.tipIcon}>{tip.icon}</Text>
              <Text style={s.tipTitle}>{tip.title}</Text>
              <View style={s.tipCatBadge}>
                <Text style={s.tipCatText}>{tip.category}</Text>
              </View>
            </View>
            <Text style={s.tipDesc}>{tip.description}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderReflect = () => {
    if (reflections.length === 0) return renderEmpty();
    return (
      <>
        <View style={s.reflectSummary}>
          <Text style={s.reflectSummaryTitle}>{'\u{1F4AD}'} Today's Reflection Summary</Text>
          <View style={s.reflectSummaryRow}>
            <View style={s.reflectSumItem}>
              <Text style={[s.reflectSumNum, { color: '#22c55e' }]}>{enrichedHours.toFixed(1)}h</Text>
              <Text style={s.reflectSumLabel}>Enriching</Text>
            </View>
            <View style={s.reflectSumItem}>
              <Text style={[s.reflectSumNum, { color: '#eab308' }]}>{neutralHours.toFixed(1)}h</Text>
              <Text style={s.reflectSumLabel}>Neutral</Text>
            </View>
            <View style={s.reflectSumItem}>
              <Text style={[s.reflectSumNum, { color: '#ef4444' }]}>{drainedHours.toFixed(1)}h</Text>
              <Text style={s.reflectSumLabel}>Draining</Text>
            </View>
          </View>
        </View>

        <Text style={s.section}>Activity Reflections</Text>
        {reflections.map(r => (
          <View key={r.id} style={s.reflectCard}>
            <View style={s.reflectHeader}>
              <View style={s.reflectLeft}>
                <Text style={s.reflectIcon}>{r.icon}</Text>
                <View>
                  <Text style={s.reflectActivity}>{r.activity}</Text>
                  <Text style={s.reflectHours}>{r.hours}h</Text>
                </View>
              </View>
              <View style={[s.reflectFeeling, { backgroundColor: feelingColor(r.feeling) + '18' }]}>
                <Text style={s.reflectFeelingIcon}>{feelingIcon(r.feeling)}</Text>
                <Text style={[s.reflectFeelingText, { color: feelingColor(r.feeling) }]}>{feelingLabel(r.feeling)}</Text>
              </View>
            </View>
            <Text style={s.reflectNote}>"{r.note}"</Text>
          </View>
        ))}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>{'\u{1F4F1}'}</Text>
      <Text style={s.emptyTitle}>No Wellbeing Data</Text>
      <Text style={s.emptyDesc}>
        Enable demo mode to explore digital wellbeing features, or start tracking your screen time on Open Chain.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F9D8}'} Digital Wellbeing</Text>
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
        {activeTab === 'today' && renderToday()}
        {activeTab === 'challenges' && renderChallenges()}
        {activeTab === 'tips' && renderTips()}
        {activeTab === 'reflect' && renderReflect()}
      </ScrollView>
    </SafeAreaView>
  );
}
