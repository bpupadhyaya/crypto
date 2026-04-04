import { fonts } from '../utils/theme';
/**
 * Meditation Screen — Spiritual wellness, meditation, mindfulness retreats.
 *
 * Article I: "Health encompasses body, mind, and spirit. Inner peace is
 *  a prerequisite for outer peace — meditation is the practice of peace."
 * — Human Constitution, Article I
 *
 * Features:
 * - Meditation timer with presets (5, 10, 15, 20, 30 min)
 * - Guided meditations library (breathing, body scan, loving-kindness, gratitude, sleep)
 * - Meditation streak and history tracking (hOTK earned for consistency)
 * - Community meditation sessions (group meditation at scheduled times)
 * - Retreat finder (community retreats, silent retreats, nature retreats)
 * - Spiritual wisdom collection (quotes, teachings from diverse traditions)
 * - Demo: 23-day streak, 4 guided meditations, 2 upcoming group sessions
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface MeditationStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  totalHOTK: number;
  thisWeekMinutes: number;
  thisWeekSessions: number;
}

interface GuidedMeditation {
  id: string;
  title: string;
  category: string;
  duration: number; // minutes
  description: string;
  tradition: string;
  hotkReward: number;
  completedCount: number;
}

interface CommunitySession {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  maxParticipants: number;
  type: string;
  hotkBonus: number;
}

interface Retreat {
  id: string;
  title: string;
  type: 'community' | 'silent' | 'nature';
  location: string;
  dates: string;
  duration: string;
  spotsLeft: number;
  description: string;
  hotkReward: number;
}

interface WisdomQuote {
  id: string;
  text: string;
  source: string;
  tradition: string;
}

interface SessionRecord {
  id: string;
  date: string;
  minutes: number;
  type: string;
  hotkEarned: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TIMER_PRESETS = [5, 10, 15, 20, 30];

const MEDITATION_CATEGORIES = [
  { key: 'breathing', label: 'Breathing', icon: 'B' },
  { key: 'body_scan', label: 'Body Scan', icon: 'S' },
  { key: 'loving_kindness', label: 'Loving-Kindness', icon: 'L' },
  { key: 'gratitude', label: 'Gratitude', icon: 'G' },
  { key: 'sleep', label: 'Sleep', icon: 'Z' },
];

const RETREAT_COLORS: Record<string, string> = {
  community: '#007AFF',
  silent: '#AF52DE',
  nature: '#34C759',
};

// ─── Demo Data ───

const DEMO_STATS: MeditationStats = {
  currentStreak: 23,
  longestStreak: 31,
  totalSessions: 187,
  totalMinutes: 2840,
  totalHOTK: 8520,
  thisWeekMinutes: 105,
  thisWeekSessions: 7,
};

const DEMO_GUIDED: GuidedMeditation[] = [
  { id: 'g1', title: 'Morning Breath Awareness', category: 'breathing', duration: 10, description: 'Start your day with mindful breathing. Focus on the natural rhythm of your breath.', tradition: 'Mindfulness', hotkReward: 30, completedCount: 18 },
  { id: 'g2', title: 'Full Body Scan Relaxation', category: 'body_scan', duration: 20, description: 'Progressively relax every part of your body from head to toe.', tradition: 'MBSR', hotkReward: 50, completedCount: 12 },
  { id: 'g3', title: 'Loving-Kindness for All Beings', category: 'loving_kindness', duration: 15, description: 'Cultivate compassion starting with yourself and extending to all beings.', tradition: 'Buddhist Metta', hotkReward: 40, completedCount: 9 },
  { id: 'g4', title: 'Gratitude Meditation', category: 'gratitude', duration: 10, description: 'Reflect on the people, experiences, and gifts that enrich your life.', tradition: 'Contemplative', hotkReward: 30, completedCount: 22 },
  { id: 'g5', title: 'Deep Sleep Journey', category: 'sleep', duration: 30, description: 'Gentle guidance into deep, restful sleep through progressive relaxation.', tradition: 'Yoga Nidra', hotkReward: 60, completedCount: 15 },
  { id: 'g6', title: 'Box Breathing Focus', category: 'breathing', duration: 5, description: 'Simple 4-4-4-4 breathing pattern for quick calm and focus.', tradition: 'Pranayama', hotkReward: 15, completedCount: 34 },
  { id: 'g7', title: 'Self-Compassion Practice', category: 'loving_kindness', duration: 15, description: 'When the inner critic is loud, turn toward yourself with kindness.', tradition: 'MSC', hotkReward: 40, completedCount: 7 },
  { id: 'g8', title: 'Evening Wind Down', category: 'body_scan', duration: 10, description: 'Release the tension of the day, preparing body and mind for rest.', tradition: 'Mindfulness', hotkReward: 30, completedCount: 20 },
];

const DEMO_COMMUNITY: CommunitySession[] = [
  { id: 'cs1', title: 'Morning Silence Circle', host: 'Mindful Community Hub', date: '2026-03-30', time: '7:00 AM', duration: 20, participants: 34, maxParticipants: 100, type: 'breathing', hotkBonus: 20 },
  { id: 'cs2', title: 'Loving-Kindness Group Practice', host: 'Peace Collective', date: '2026-04-01', time: '6:30 PM', duration: 30, participants: 18, maxParticipants: 50, type: 'loving_kindness', hotkBonus: 30 },
];

const DEMO_RETREATS: Retreat[] = [
  { id: 'rt1', title: 'Weekend Community Retreat', type: 'community', location: 'Harmony Center, Valley Park', dates: 'Apr 12-13, 2026', duration: '2 days', spotsLeft: 15, description: 'A weekend of guided meditation, group discussions, and shared meals.', hotkReward: 200 },
  { id: 'rt2', title: 'Silent Meditation Retreat', type: 'silent', location: 'Mountain View Retreat Center', dates: 'Apr 25-27, 2026', duration: '3 days', spotsLeft: 8, description: 'Three days of noble silence. Vipassana-style sitting and walking meditation.', hotkReward: 400 },
  { id: 'rt3', title: 'Nature Immersion & Mindfulness', type: 'nature', location: 'Redwood Forest Camp', dates: 'May 3-4, 2026', duration: '2 days', spotsLeft: 20, description: 'Forest bathing, outdoor walking meditation, and campfire contemplation.', hotkReward: 250 },
];

const DEMO_WISDOM: WisdomQuote[] = [
  { id: 'w1', text: 'Peace comes from within. Do not seek it without.', source: 'Siddhartha Gautama', tradition: 'Buddhism' },
  { id: 'w2', text: 'The quieter you become, the more you can hear.', source: 'Ram Dass', tradition: 'Hindu-inspired' },
  { id: 'w3', text: 'Be still and know that I am God.', source: 'Psalm 46:10', tradition: 'Christianity' },
  { id: 'w4', text: 'Silence is the language of God; all else is poor translation.', source: 'Rumi', tradition: 'Sufism' },
  { id: 'w5', text: 'In the middle of difficulty lies opportunity.', source: 'Albert Einstein', tradition: 'Secular' },
  { id: 'w6', text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', source: 'Thich Nhat Hanh', tradition: 'Zen Buddhism' },
];

const DEMO_HISTORY: SessionRecord[] = [
  { id: 'h1', date: '2026-03-29', minutes: 15, type: 'breathing', hotkEarned: 40 },
  { id: 'h2', date: '2026-03-28', minutes: 20, type: 'body_scan', hotkEarned: 50 },
  { id: 'h3', date: '2026-03-27', minutes: 10, type: 'gratitude', hotkEarned: 30 },
  { id: 'h4', date: '2026-03-26', minutes: 15, type: 'loving_kindness', hotkEarned: 40 },
  { id: 'h5', date: '2026-03-25', minutes: 30, type: 'sleep', hotkEarned: 60 },
  { id: 'h6', date: '2026-03-24', minutes: 10, type: 'breathing', hotkEarned: 30 },
  { id: 'h7', date: '2026-03-23', minutes: 5, type: 'breathing', hotkEarned: 15 },
];

type Tab = 'meditate' | 'guided' | 'community' | 'retreats';

const TABS: { key: Tab; label: string }[] = [
  { key: 'meditate', label: 'Meditate' },
  { key: 'guided', label: 'Guided' },
  { key: 'community', label: 'Community' },
  { key: 'retreats', label: 'Retreats' },
];

export function MeditationScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('meditate');
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const stats = DEMO_STATS;
  const guided = DEMO_GUIDED;
  const community = DEMO_COMMUNITY;
  const retreats = DEMO_RETREATS;
  const wisdom = DEMO_WISDOM;
  const history = DEMO_HISTORY;

  const filteredGuided = useMemo(
    () => selectedCategory ? guided.filter((g) => g.category === selectedCategory) : guided,
    [selectedCategory],
  );

  const randomWisdom = useMemo(() => wisdom[Math.floor(Math.random() * wisdom.length)], []);

  const handleStartTimer = useCallback(() => {
    setIsTimerActive(true);
    Alert.alert(
      'Meditation Started',
      `${selectedDuration}-minute timer started.\nFind a comfortable position and close your eyes.\n\n(In the full app, a gentle bell will sound when time is up.)`,
      [{ text: 'End Session', onPress: () => handleEndSession() }],
    );
  }, [selectedDuration]);

  const handleEndSession = useCallback(() => {
    setIsTimerActive(false);
    const hotkEarned = selectedDuration * 3;
    Alert.alert(
      'Session Complete',
      `Beautiful! ${selectedDuration} minutes of meditation.\n+${hotkEarned} hOTK earned.\n\nStreak: ${stats.currentStreak + 1} days`,
    );
  }, [selectedDuration]);

  const handleStartGuided = useCallback((meditation: GuidedMeditation) => {
    Alert.alert(
      meditation.title,
      `${meditation.description}\n\nDuration: ${meditation.duration} min\nTradition: ${meditation.tradition}\nReward: +${meditation.hotkReward} hOTK\n\n(Starting guided session...)`,
    );
  }, []);

  const handleJoinCommunity = useCallback((session: CommunitySession) => {
    Alert.alert(
      'Join Session',
      `"${session.title}"\nHosted by ${session.host}\n${session.date} at ${session.time}\n${session.participants} others joining\n\nBonus: +${session.hotkBonus} hOTK for group practice`,
    );
  }, []);

  const handleViewRetreat = useCallback((retreat: Retreat) => {
    Alert.alert(
      retreat.title,
      `${retreat.description}\n\nLocation: ${retreat.location}\nDates: ${retreat.dates}\nDuration: ${retreat.duration}\nSpots left: ${retreat.spotsLeft}\nhOTK reward: +${retreat.hotkReward}`,
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },

    // Streak & stats
    streakCard: { backgroundColor: t.accent.purple + '12', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    streakNumber: { color: t.accent.purple, fontSize: 56, fontWeight: fonts.heavy },
    streakLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },
    streakSubtext: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },

    // Wisdom quote
    wisdomCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    wisdomText: { color: t.text.primary, fontSize: fonts.md, fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },
    wisdomSource: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8 },

    // Timer
    timerSection: { alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    presetRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20, paddingHorizontal: 20 },
    presetBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: t.bg.secondary, justifyContent: 'center', alignItems: 'center' },
    presetBtnActive: { backgroundColor: t.accent.purple },
    presetText: { color: t.text.muted, fontSize: fonts.lg, fontWeight: fonts.bold },
    presetTextActive: { color: '#fff' },
    presetLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    presetLabelActive: { color: '#fff' },
    startBtn: { backgroundColor: t.accent.purple, borderRadius: 40, width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: t.accent.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    startBtnText: { color: '#fff', fontSize: fonts.xl, fontWeight: fonts.heavy },
    startBtnSub: { color: '#fff', fontSize: fonts.sm, opacity: 0.8, marginTop: 4 },
    hotkHint: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },

    // History
    historyTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginHorizontal: 20, marginTop: 8, marginBottom: 12 },
    historyRow: { flexDirection: 'row', backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8, alignItems: 'center' },
    historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.purple, marginRight: 12 },
    historyInfo: { flex: 1 },
    historyDate: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    historyMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    historyHotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },

    // Guided
    categoryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: t.bg.secondary },
    categoryChipActive: { backgroundColor: t.accent.purple + '20' },
    categoryText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    categoryTextActive: { color: t.accent.purple },
    guidedCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guidedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    guidedTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    guidedDuration: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    guidedDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 10 },
    guidedFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    guidedTradition: { color: t.text.secondary, fontSize: fonts.sm },
    guidedCompleted: { color: t.text.muted, fontSize: fonts.xs },
    guidedHotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold },
    playBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    playBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },

    // Community
    communityCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 18, marginHorizontal: 20, marginBottom: 12 },
    communityTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    communityHost: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 8 },
    communityMeta: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 18, marginBottom: 12 },
    communityFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    communityParticipants: { color: t.text.muted, fontSize: fonts.sm },
    communityBonus: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },

    // Retreats
    retreatCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 18, marginHorizontal: 20, marginBottom: 14 },
    retreatType: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
    retreatTypeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    retreatTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 6 },
    retreatDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 10 },
    retreatMeta: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 4 },
    retreatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    retreatSpots: { color: t.text.muted, fontSize: fonts.sm },
    retreatHotk: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    viewBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    viewBtnText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },

    // Wisdom section (in retreats tab)
    wisdomSection: { marginTop: 16 },
    wisdomItem: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    wisdomItemText: { color: t.text.primary, fontSize: fonts.md, fontStyle: 'italic', lineHeight: 20, marginBottom: 8 },
    wisdomItemSource: { color: t.text.muted, fontSize: fonts.sm },
    wisdomItemTradition: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2 },

    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, marginHorizontal: 20 },
  }), [t]);

  // ─── Meditate Tab ───
  const renderMeditate = () => (
    <>
      {/* Streak card */}
      <View style={s.streakCard}>
        <Text style={s.streakNumber}>{stats.currentStreak}</Text>
        <Text style={s.streakLabel}>Day Streak</Text>
        <Text style={s.streakSubtext}>Longest: {stats.longestStreak} days</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalSessions}</Text>
            <Text style={s.statLabel}>Sessions</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{Math.floor(stats.totalMinutes / 60)}h</Text>
            <Text style={s.statLabel}>Total Time</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalHOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>hOTK Earned</Text>
          </View>
        </View>
      </View>

      {/* Wisdom quote */}
      <View style={s.wisdomCard}>
        <Text style={s.wisdomText}>"{randomWisdom.text}"</Text>
        <Text style={s.wisdomSource}>-- {randomWisdom.source} ({randomWisdom.tradition})</Text>
      </View>

      {/* Timer presets */}
      <Text style={s.sectionTitle}>Choose Duration</Text>
      <View style={s.presetRow}>
        {TIMER_PRESETS.map((mins) => (
          <TouchableOpacity
            key={mins}
            style={[s.presetBtn, selectedDuration === mins && s.presetBtnActive]}
            onPress={() => setSelectedDuration(mins)}
          >
            <Text style={[s.presetText, selectedDuration === mins && s.presetTextActive]}>{mins}</Text>
            <Text style={[s.presetLabel, selectedDuration === mins && s.presetLabelActive]}>min</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start button */}
      <View style={s.timerSection}>
        <TouchableOpacity style={s.startBtn} onPress={handleStartTimer}>
          <Text style={s.startBtnText}>Begin</Text>
          <Text style={s.startBtnSub}>{selectedDuration} minutes</Text>
        </TouchableOpacity>
        <Text style={s.hotkHint}>+{selectedDuration * 3} hOTK for completing this session</Text>
      </View>

      {/* Recent history */}
      <Text style={s.historyTitle}>Recent Sessions</Text>
      {history.map((record) => (
        <View key={record.id} style={s.historyRow}>
          <View style={s.historyDot} />
          <View style={s.historyInfo}>
            <Text style={s.historyDate}>{record.date}</Text>
            <Text style={s.historyMeta}>{record.minutes} min / {record.type}</Text>
          </View>
          <Text style={s.historyHotk}>+{record.hotkEarned} hOTK</Text>
        </View>
      ))}
    </>
  );

  // ─── Guided Tab ───
  const renderGuided = () => (
    <>
      <View style={s.categoryRow}>
        <TouchableOpacity
          style={[s.categoryChip, !selectedCategory && s.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.categoryText, !selectedCategory && s.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {MEDITATION_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, selectedCategory === cat.key && s.categoryChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
          >
            <Text style={[s.categoryText, selectedCategory === cat.key && s.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredGuided.map((meditation) => (
        <View key={meditation.id} style={s.guidedCard}>
          <View style={s.guidedHeader}>
            <Text style={s.guidedTitle}>{meditation.title}</Text>
            <Text style={s.guidedDuration}>{meditation.duration} min</Text>
          </View>
          <Text style={s.guidedDesc}>{meditation.description}</Text>
          <View style={s.guidedFooter}>
            <View>
              <Text style={s.guidedTradition}>{meditation.tradition}</Text>
              <Text style={s.guidedCompleted}>Completed {meditation.completedCount}x</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={s.guidedHotk}>+{meditation.hotkReward} hOTK</Text>
              <TouchableOpacity style={s.playBtn} onPress={() => handleStartGuided(meditation)}>
                <Text style={s.playBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Community Tab ───
  const renderCommunity = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Group Sessions</Text>
      {community.map((session) => (
        <View key={session.id} style={s.communityCard}>
          <Text style={s.communityTitle}>{session.title}</Text>
          <Text style={s.communityHost}>Hosted by {session.host}</Text>
          <Text style={s.communityMeta}>
            {session.date} at {session.time} / {session.duration} min / {session.type}
          </Text>
          <View style={s.communityFooter}>
            <View>
              <Text style={s.communityParticipants}>
                {session.participants}/{session.maxParticipants} joined
              </Text>
              <Text style={s.communityBonus}>+{session.hotkBonus} hOTK bonus</Text>
            </View>
            <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinCommunity(session)}>
              <Text style={s.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* This week stats */}
      <View style={[s.streakCard, { marginTop: 8 }]}>
        <Text style={s.sectionTitle}>This Week</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.thisWeekSessions}</Text>
            <Text style={s.statLabel}>Sessions</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.thisWeekMinutes}</Text>
            <Text style={s.statLabel}>Minutes</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ─── Retreats Tab ───
  const renderRetreats = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Retreats</Text>
      {retreats.map((retreat) => (
        <View key={retreat.id} style={s.retreatCard}>
          <View style={[s.retreatType, { backgroundColor: RETREAT_COLORS[retreat.type] || '#8E8E93' }]}>
            <Text style={s.retreatTypeText}>{retreat.type}</Text>
          </View>
          <Text style={s.retreatTitle}>{retreat.title}</Text>
          <Text style={s.retreatDesc}>{retreat.description}</Text>
          <Text style={s.retreatMeta}>{retreat.location}</Text>
          <Text style={s.retreatMeta}>{retreat.dates} ({retreat.duration})</Text>
          <View style={s.retreatFooter}>
            <View>
              <Text style={s.retreatSpots}>{retreat.spotsLeft} spots left</Text>
              <Text style={s.retreatHotk}>+{retreat.hotkReward} hOTK</Text>
            </View>
            <TouchableOpacity style={s.viewBtn} onPress={() => handleViewRetreat(retreat)}>
              <Text style={s.viewBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Spiritual wisdom collection */}
      <View style={s.wisdomSection}>
        <Text style={s.sectionTitle}>Spiritual Wisdom</Text>
        {wisdom.map((quote) => (
          <View key={quote.id} style={s.wisdomItem}>
            <Text style={s.wisdomItemText}>"{quote.text}"</Text>
            <Text style={s.wisdomItemSource}>-- {quote.source}</Text>
            <Text style={s.wisdomItemTradition}>{quote.tradition}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Meditation</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'meditate' && renderMeditate()}
        {tab === 'guided' && renderGuided()}
        {tab === 'community' && renderCommunity()}
        {tab === 'retreats' && renderRetreats()}
      </ScrollView>
    </SafeAreaView>
  );
}
