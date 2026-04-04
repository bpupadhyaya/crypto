import { fonts } from '../utils/theme';
/**
 * Wellness Screen — Health and wellness milestone tracking.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents health value — preventive care earns more than treatment.
 *
 * Features:
 * - Wellness profile: score (0-100), level badge, total hOTK
 * - Log wellness activity (checkup, fitness, nutrition, mental_health, preventive)
 * - Streak tracker with bonus indicator
 * - Wellness history timeline
 * - Community wellness stats (anonymized averages)
 * - Educational messaging
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface WellnessProfile {
  uid: string;
  wellnessScore: number; // 0-100
  totalHOTK: number;
  totalActivities: number;
  streakDays: number;
  bestStreak: number;
  wellnessLevel: string;
  topCategory: string;
}

interface WellnessActivity {
  id: string;
  uid: string;
  category: string;
  description: string;
  hotkEarned: number;
  date: string;
  verified: boolean;
  streakBonus: boolean;
}

interface CommunityWellnessStats {
  avgScore: number;
  avgStreakDays: number;
  totalParticipants: number;
  topCategory: string;
  preventiveRate: number; // % of activities that are preventive
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const ACTIVITY_CATEGORIES = [
  { key: 'checkup', label: 'Checkup', icon: '+' },
  { key: 'fitness', label: 'Fitness', icon: 'F' },
  { key: 'nutrition', label: 'Nutrition', icon: 'N' },
  { key: 'mental_health', label: 'Mental Health', icon: 'M' },
  { key: 'preventive', label: 'Preventive', icon: 'P' },
];

const LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  starting: { label: 'Starting', color: '#8E8E93' },
  aware: { label: 'Aware', color: '#34C759' },
  active: { label: 'Active', color: '#007AFF' },
  thriving: { label: 'Thriving', color: '#AF52DE' },
  inspiring: { label: 'Inspiring', color: '#FF9500' },
};

const LEVEL_THRESHOLDS: Record<string, string> = {
  starting: '0-19 score',
  aware: '20-39 score',
  active: '40-59 score',
  thriving: '60-79 score',
  inspiring: '80-100 score',
};

// hOTK multipliers — preventive care earns more
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  checkup: 120,
  fitness: 100,
  nutrition: 110,
  mental_health: 130,
  preventive: 150,
};

// ─── Demo Data ───

const DEMO_PROFILE: WellnessProfile = {
  uid: 'you',
  wellnessScore: 72,
  totalHOTK: 14600,
  totalActivities: 89,
  streakDays: 12,
  bestStreak: 21,
  wellnessLevel: 'thriving',
  topCategory: 'fitness',
};

const DEMO_ACTIVITIES: WellnessActivity[] = [
  { id: '1', uid: 'you', category: 'fitness', description: 'Morning 5K run + stretching', hotkEarned: 200, date: '2026-03-28', verified: true, streakBonus: true },
  { id: '2', uid: 'you', category: 'nutrition', description: 'Prepared balanced meal plan for the week', hotkEarned: 220, date: '2026-03-27', verified: true, streakBonus: true },
  { id: '3', uid: 'you', category: 'preventive', description: 'Annual dental checkup completed', hotkEarned: 450, date: '2026-03-25', verified: true, streakBonus: true },
  { id: '4', uid: 'you', category: 'mental_health', description: 'Meditation session — 30 minutes', hotkEarned: 260, date: '2026-03-24', verified: true, streakBonus: true },
  { id: '5', uid: 'you', category: 'checkup', description: 'Blood pressure & vitals check', hotkEarned: 240, date: '2026-03-22', verified: true, streakBonus: false },
  { id: '6', uid: 'you', category: 'fitness', description: 'Yoga class at community center', hotkEarned: 200, date: '2026-03-20', verified: true, streakBonus: false },
  { id: '7', uid: 'you', category: 'preventive', description: 'Flu vaccination at clinic', hotkEarned: 450, date: '2026-03-18', verified: true, streakBonus: false },
  { id: '8', uid: 'you', category: 'mental_health', description: 'Peer support group session', hotkEarned: 260, date: '2026-03-16', verified: false, streakBonus: false },
];

const DEMO_COMMUNITY_STATS: CommunityWellnessStats = {
  avgScore: 48,
  avgStreakDays: 5,
  totalParticipants: 1842,
  topCategory: 'fitness',
  preventiveRate: 18,
};

type Tab = 'profile' | 'log' | 'streak' | 'history' | 'community';

export function WellnessScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [logCategory, setLogCategory] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const profile = DEMO_PROFILE;
  const activities = DEMO_ACTIVITIES;
  const communityStats = DEMO_COMMUNITY_STATS;

  const handleLogActivity = useCallback(() => {
    if (!logCategory) { Alert.alert('Required', 'Select an activity category.'); return; }
    if (!logDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }

    const multiplier = CATEGORY_MULTIPLIERS[logCategory] || 100;
    const baseHotk = 200;
    const hotk = Math.floor(baseHotk * multiplier / 100);
    const streakBonus = profile.streakDays >= 7;
    const totalHotk = streakBonus ? Math.floor(hotk * 1.2) : hotk;

    Alert.alert(
      'Activity Logged',
      `${ACTIVITY_CATEGORIES.find((c) => c.key === logCategory)?.label} recorded.\nEstimated hOTK: ${totalHotk}${streakBonus ? ' (includes 20% streak bonus!)' : ''}\n\nAwaiting verification.`,
    );
    setLogCategory('');
    setLogDescription('');
    setTab('history');
  }, [logCategory, logDescription, profile.streakDays]);

  const levelInfo = LEVEL_BADGES[profile.wellnessLevel] || LEVEL_BADGES.starting;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 16 },
    levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    levelText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold, textTransform: 'uppercase' },
    scoreText: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy, marginTop: 4 },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    scoreBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, width: '100%' },
    scoreBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    activityRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activityIconText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    activityInfo: { flex: 1 },
    activityTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    activityMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    activityRight: { alignItems: 'flex-end', justifyContent: 'center' },
    activityHotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    activityVerified: { fontSize: 11, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    streakCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    streakNumber: { color: t.accent.orange, fontSize: 56, fontWeight: fonts.heavy },
    streakLabel: { color: t.text.muted, fontSize: 14, fontWeight: fonts.semibold, marginTop: 4 },
    streakBonusTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
    streakBonusText: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.bold },
    communityStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    communityStatLabel: { color: t.text.muted, fontSize: 14 },
    communityStatValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'profile', label: 'Profile' },
    { key: 'log', label: 'Log Activity' },
    { key: 'streak', label: 'Streak' },
    { key: 'history', label: 'History' },
    { key: 'community', label: 'Community' },
  ];

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.profileHeader}>
          <Text style={s.scoreLabel}>Wellness Score</Text>
          <Text style={s.scoreText}>{profile.wellnessScore}</Text>
          <View style={s.scoreBarOuter}>
            <View style={[s.scoreBarInner, { width: `${profile.wellnessScore}%` }]} />
          </View>
          <View style={[s.levelBadge, { backgroundColor: levelInfo.color }]}>
            <Text style={s.levelText}>{levelInfo.label}</Text>
          </View>
          <Text style={[s.activityMeta, { marginTop: 6 }]}>{LEVEL_THRESHOLDS[profile.wellnessLevel]}</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.totalActivities}</Text>
            <Text style={s.statLabel}>Activities</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{profile.totalHOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>hOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{profile.streakDays}</Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Next level */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Next Level</Text>
        {profile.wellnessLevel === 'inspiring' ? (
          <Text style={s.educationText}>You are Inspiring others. Keep leading by example.</Text>
        ) : (
          <Text style={[s.activityMeta, { textAlign: 'center' }]}>
            {profile.wellnessLevel === 'starting' && `${20 - profile.wellnessScore} points to Aware`}
            {profile.wellnessLevel === 'aware' && `${40 - profile.wellnessScore} points to Active`}
            {profile.wellnessLevel === 'active' && `${60 - profile.wellnessScore} points to Thriving`}
            {profile.wellnessLevel === 'thriving' && `${80 - profile.wellnessScore} points to Inspiring`}
          </Text>
        )}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Preventive care earns more than treatment.{'\n'}
          Regular checkups, vaccinations, and mental health{'\n'}
          sessions earn 1.3-1.5x hOTK multiplier.{'\n\n'}
          Your health is humanity's wealth.
        </Text>
      </View>
    </>
  );

  // ─── Log Activity Tab ───

  const renderLog = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Log Wellness Activity</Text>

      <Text style={[s.activityMeta, { marginBottom: 8 }]}>Category</Text>
      <View style={s.typeGrid}>
        {ACTIVITY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.typeChip, logCategory === cat.key && s.typeChipSelected]}
            onPress={() => setLogCategory(cat.key)}
          >
            <Text style={[s.typeChipText, logCategory === cat.key && s.typeChipTextSelected]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {logCategory ? (
        <Text style={[s.activityMeta, { marginBottom: 8, color: t.accent.green }]}>
          Multiplier: {CATEGORY_MULTIPLIERS[logCategory]}%
          {CATEGORY_MULTIPLIERS[logCategory] > 100 && ' (bonus!)'}
        </Text>
      ) : null}

      <TextInput
        style={s.input}
        placeholder="Describe your wellness activity"
        placeholderTextColor={t.text.muted}
        value={logDescription}
        onChangeText={setLogDescription}
        multiline
      />

      {profile.streakDays >= 7 && (
        <View style={[s.streakBonusTag, { alignSelf: 'flex-start', marginBottom: 12 }]}>
          <Text style={s.streakBonusText}>+20% Streak Bonus Active (7+ days)</Text>
        </View>
      )}

      <TouchableOpacity style={s.submitBtn} onPress={handleLogActivity}>
        <Text style={s.submitText}>Log Activity</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Streak Tab ───

  const renderStreak = () => (
    <>
      <View style={s.streakCard}>
        <Text style={s.streakNumber}>{profile.streakDays}</Text>
        <Text style={s.streakLabel}>Consecutive Days</Text>
        {profile.streakDays >= 7 && (
          <View style={s.streakBonusTag}>
            <Text style={s.streakBonusText}>+20% Streak Bonus Active!</Text>
          </View>
        )}
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Streak Stats</Text>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Current Streak</Text>
          <Text style={s.communityStatValue}>{profile.streakDays} days</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Best Streak</Text>
          <Text style={s.communityStatValue}>{profile.bestStreak} days</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Streak Bonus</Text>
          <Text style={[s.communityStatValue, { color: profile.streakDays >= 7 ? t.accent.green : t.text.muted }]}>
            {profile.streakDays >= 7 ? '+20% hOTK' : `${7 - profile.streakDays} days to unlock`}
          </Text>
        </View>
        <View style={[s.communityStatRow, { borderBottomWidth: 0 }]}>
          <Text style={s.communityStatLabel}>Total Activities</Text>
          <Text style={s.communityStatValue}>{profile.totalActivities}</Text>
        </View>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Consistency matters more than intensity.{'\n'}
          Log at least one wellness activity daily{'\n'}
          to maintain your streak and earn bonus hOTK.
        </Text>
      </View>
    </>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Wellness History</Text>
      <View style={s.card}>
        {activities.map((act) => {
          const catInfo = ACTIVITY_CATEGORIES.find((c) => c.key === act.category);
          return (
            <View key={act.id} style={s.activityRow}>
              <View style={s.activityIcon}>
                <Text style={s.activityIconText}>{catInfo?.icon || '?'}</Text>
              </View>
              <View style={s.activityInfo}>
                <Text style={s.activityTitle}>{act.description}</Text>
                <Text style={s.activityMeta}>
                  {act.date} | {catInfo?.label}
                  {act.streakBonus ? ' | Streak Bonus' : ''}
                </Text>
              </View>
              <View style={s.activityRight}>
                {act.verified ? (
                  <Text style={s.activityHotk}>+{act.hotkEarned} hOTK</Text>
                ) : (
                  <Text style={[s.activityVerified, { color: t.accent.orange }]}>Pending</Text>
                )}
                <Text style={[s.activityVerified, { color: act.verified ? t.accent.green : t.text.muted }]}>
                  {act.verified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Community Tab ───

  const renderCommunity = () => (
    <>
      <Text style={s.sectionTitle}>Community Wellness Stats</Text>
      <View style={s.card}>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Average Wellness Score</Text>
          <Text style={s.communityStatValue}>{communityStats.avgScore}/100</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Average Streak</Text>
          <Text style={s.communityStatValue}>{communityStats.avgStreakDays} days</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Total Participants</Text>
          <Text style={s.communityStatValue}>{communityStats.totalParticipants.toLocaleString()}</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Most Popular Category</Text>
          <Text style={s.communityStatValue}>{communityStats.topCategory}</Text>
        </View>
        <View style={[s.communityStatRow, { borderBottomWidth: 0 }]}>
          <Text style={s.communityStatLabel}>Preventive Care Rate</Text>
          <Text style={s.communityStatValue}>{communityStats.preventiveRate}%</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Your Score vs. Community</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{profile.wellnessScore}</Text>
            <Text style={s.statLabel}>Your Score</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{communityStats.avgScore}</Text>
            <Text style={s.statLabel}>Community Avg</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: profile.wellnessScore > communityStats.avgScore ? t.accent.green : t.accent.orange }]}>
              {profile.wellnessScore > communityStats.avgScore ? '+' : ''}{profile.wellnessScore - communityStats.avgScore}
            </Text>
            <Text style={s.statLabel}>Difference</Text>
          </View>
        </View>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          All community stats are anonymized.{'\n'}
          No individual health data is ever shared.{'\n'}
          Your wellness journey is private — only you{'\n'}
          decide what to share.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Wellness</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'profile' && renderProfile()}
        {tab === 'log' && renderLog()}
        {tab === 'streak' && renderStreak()}
        {tab === 'history' && renderHistory()}
        {tab === 'community' && renderCommunity()}
      </ScrollView>
    </SafeAreaView>
  );
}
