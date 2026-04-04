import { fonts } from '../utils/theme';
/**
 * Mental Wellness Screen — Article I (hOTK) — Mental health support network.
 *
 * "Every human being has the right to mental wellness support, accessible
 *  at near-zero cost, without stigma, through peer networks that understand
 *  the lived experience of struggle."
 * — Human Constitution, Article I, Section 7
 *
 * Features:
 * - Wellness check-in: daily mood tracker (1-5 scale), journaling prompt
 * - Peer support network: trained community listeners (not therapists)
 * - Crisis resources: emergency contacts, helplines by region
 * - Mindfulness exercises: breathing, grounding, meditation (text-based, offline)
 * - Support circles: small peer groups with on-chain membership
 * - Gratitude journal: daily entries linked to Gratitude Wall
 * - Progress tracking: mood trends, streaks
 * - Community wellness events: workshops, group activities
 * - Demo: 7-day mood history, 2 support circles, 4 exercises, 3 events
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

type WellnessTab = 'check-in' | 'support' | 'exercises' | 'circles';

interface MoodEntry {
  date: string;
  mood: number;
  note: string;
}

interface SupportCircle {
  id: string;
  name: string;
  icon: string;
  members: number;
  nextMeeting: string;
  description: string;
  onChain: boolean;
}

interface Exercise {
  id: string;
  title: string;
  icon: string;
  category: 'breathing' | 'grounding' | 'meditation' | 'gratitude';
  duration: string;
  steps: string[];
}

interface WellnessEvent {
  id: string;
  title: string;
  icon: string;
  date: string;
  attendees: number;
  type: 'workshop' | 'group' | 'webinar';
}

interface CrisisResource {
  region: string;
  name: string;
  number: string;
  available: string;
}

interface PeerListener {
  id: string;
  name: string;
  icon: string;
  specialty: string;
  available: boolean;
  rating: number;
  sessions: number;
}

const MOOD_EMOJIS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '\u{1F629}', label: 'Struggling', color: '#ef4444' },
  2: { emoji: '\u{1F614}', label: 'Low', color: '#f97316' },
  3: { emoji: '\u{1F610}', label: 'Okay', color: '#eab308' },
  4: { emoji: '\u{1F60A}', label: 'Good', color: '#22c55e' },
  5: { emoji: '\u{1F929}', label: 'Thriving', color: '#3b82f6' },
};

const JOURNAL_PROMPTS = [
  'What is one thing you are grateful for today?',
  'What made you smile recently?',
  'What challenge did you overcome this week?',
  'Who in your life brings you peace?',
  'What would you tell your younger self?',
  'What is one small thing you can do for yourself today?',
  'Describe a moment of kindness you witnessed.',
];

const DEMO_MOOD_HISTORY: MoodEntry[] = [
  { date: '2026-03-22', mood: 3, note: 'Feeling okay, busy day.' },
  { date: '2026-03-23', mood: 4, note: 'Good conversation with a friend.' },
  { date: '2026-03-24', mood: 2, note: 'Rough morning, better by evening.' },
  { date: '2026-03-25', mood: 4, note: 'Meditation helped a lot today.' },
  { date: '2026-03-26', mood: 5, note: 'Gratitude circle was amazing!' },
  { date: '2026-03-27', mood: 3, note: 'Average day, need more rest.' },
  { date: '2026-03-28', mood: 4, note: 'Feeling hopeful.' },
];

const DEMO_CIRCLES: SupportCircle[] = [
  {
    id: 'c1', name: 'Morning Mindfulness', icon: '\u{1F305}', members: 12,
    nextMeeting: 'Tomorrow 7:00 AM', description: 'Daily morning check-in and guided breathing. All welcome.',
    onChain: true,
  },
  {
    id: 'c2', name: 'Resilience Builders', icon: '\u{1F4AA}', members: 8,
    nextMeeting: 'Friday 6:00 PM', description: 'Weekly peer support for navigating life transitions.',
    onChain: true,
  },
];

const DEMO_EXERCISES: Exercise[] = [
  {
    id: 'e1', title: 'Box Breathing', icon: '\u{1F32C}', category: 'breathing', duration: '4 min',
    steps: [
      'Breathe in slowly for 4 seconds.',
      'Hold your breath for 4 seconds.',
      'Breathe out slowly for 4 seconds.',
      'Hold empty for 4 seconds.',
      'Repeat 4 times.',
    ],
  },
  {
    id: 'e2', title: '5-4-3-2-1 Grounding', icon: '\u{1F33F}', category: 'grounding', duration: '5 min',
    steps: [
      'Name 5 things you can see.',
      'Name 4 things you can touch.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
      'Notice how you feel now.',
    ],
  },
  {
    id: 'e3', title: 'Body Scan Meditation', icon: '\u{1F9D8}', category: 'meditation', duration: '10 min',
    steps: [
      'Sit or lie down comfortably. Close your eyes.',
      'Bring attention to the top of your head.',
      'Slowly move awareness down: forehead, eyes, jaw.',
      'Notice your shoulders, arms, hands. Release tension.',
      'Move to your chest, stomach. Breathe deeply.',
      'Continue to hips, legs, feet.',
      'Rest in full-body awareness for 2 minutes.',
    ],
  },
  {
    id: 'e4', title: 'Gratitude Reflection', icon: '\u{1F49B}', category: 'gratitude', duration: '5 min',
    steps: [
      'Think of 3 people who have helped you.',
      'For each person, recall a specific moment.',
      'Feel the warmth of that memory.',
      'Consider sending a gratitude message today.',
      'Write one sentence of thanks in your journal.',
    ],
  },
];

const DEMO_EVENTS: WellnessEvent[] = [
  { id: 'ev1', title: 'Stress Management Workshop', icon: '\u{1F3AF}', date: 'Mar 30, 2:00 PM', attendees: 24, type: 'workshop' },
  { id: 'ev2', title: 'Community Walking Group', icon: '\u{1F6B6}', date: 'Mar 31, 8:00 AM', attendees: 15, type: 'group' },
  { id: 'ev3', title: 'Sleep Hygiene Talk', icon: '\u{1F634}', date: 'Apr 2, 7:00 PM', attendees: 38, type: 'webinar' },
];

const CRISIS_RESOURCES: CrisisResource[] = [
  { region: 'Global', name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
  { region: 'US', name: 'Suicide & Crisis Lifeline', number: '988', available: '24/7' },
  { region: 'UK', name: 'Samaritans', number: '116 123', available: '24/7' },
  { region: 'India', name: 'iCall', number: '9152987821', available: 'Mon-Sat 8am-10pm' },
  { region: 'Australia', name: 'Lifeline', number: '13 11 14', available: '24/7' },
  { region: 'Canada', name: 'Crisis Services Canada', number: '1-833-456-4566', available: '24/7' },
];

const DEMO_LISTENERS: PeerListener[] = [
  { id: 'l1', name: 'Ananya S.', icon: '\u{1F9D1}\u{200D}\u{1F3A4}', specialty: 'Anxiety & Stress', available: true, rating: 4.8, sessions: 142 },
  { id: 'l2', name: 'Marcus T.', icon: '\u{1F9D4}', specialty: 'Life Transitions', available: true, rating: 4.9, sessions: 98 },
  { id: 'l3', name: 'Yuki M.', icon: '\u{1F469}', specialty: 'Grief & Loss', available: false, rating: 4.7, sessions: 67 },
];

const CATEGORY_COLORS: Record<string, string> = {
  breathing: '#3b82f6',
  grounding: '#22c55e',
  meditation: '#8b5cf6',
  gratitude: '#eab308',
};

export function MentalWellnessScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<WellnessTab>('check-in');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [gratitudeEntry, setGratitudeEntry] = useState('');

  const moodHistory = demoMode ? DEMO_MOOD_HISTORY : [];
  const circles = demoMode ? DEMO_CIRCLES : [];
  const exercises = demoMode ? DEMO_EXERCISES : [];
  const events = demoMode ? DEMO_EVENTS : [];
  const listeners = demoMode ? DEMO_LISTENERS : [];

  const todayPrompt = useMemo(() => {
    const day = new Date().getDay();
    return JOURNAL_PROMPTS[day % JOURNAL_PROMPTS.length];
  }, []);

  // Streak calculation from mood history
  const streak = useMemo(() => {
    if (moodHistory.length === 0) return 0;
    let count = 0;
    const sorted = [...moodHistory].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].date);
      const diff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === i) count++;
      else break;
    }
    return count;
  }, [moodHistory]);

  // Average mood
  const avgMood = useMemo(() => {
    if (moodHistory.length === 0) return 0;
    return moodHistory.reduce((s, e) => s + e.mood, 0) / moodHistory.length;
  }, [moodHistory]);

  const handleCheckIn = useCallback(() => {
    if (!selectedMood) {
      Alert.alert('Select Your Mood', 'Tap an emoji to record how you are feeling today.');
      return;
    }
    const moodInfo = MOOD_EMOJIS[selectedMood];
    Alert.alert(
      `${moodInfo.emoji} Check-In Recorded`,
      `Mood: ${moodInfo.label}${journalEntry ? `\n\nJournal: "${journalEntry}"` : ''}\n\nYour check-in helps track your wellness journey. Keep it up!`,
    );
    setSelectedMood(null);
    setJournalEntry('');
  }, [selectedMood, journalEntry]);

  const handleGratitudeSubmit = useCallback(() => {
    if (!gratitudeEntry.trim()) {
      Alert.alert('Write Something', 'Share what you are grateful for today.');
      return;
    }
    Alert.alert(
      '\u{1F49B} Gratitude Saved',
      `"${gratitudeEntry}"\n\nYour gratitude entry has been saved and linked to the Gratitude Wall.`,
    );
    setGratitudeEntry('');
  }, [gratitudeEntry]);

  const handleConnectListener = useCallback((listener: PeerListener) => {
    if (!listener.available) {
      Alert.alert('Not Available', `${listener.name} is currently offline. Try again later or connect with another listener.`);
      return;
    }
    Alert.alert(
      'Connect with ' + listener.name,
      `Specialty: ${listener.specialty}\nRating: ${listener.rating}/5\nSessions: ${listener.sessions}\n\nThis is a peer support connection, not therapy. Listeners are trained community members who offer empathetic listening.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect', onPress: () => Alert.alert('Connecting...', 'You will be connected shortly. Remember: you are not alone.') },
      ],
    );
  }, []);

  const handleJoinCircle = useCallback((circle: SupportCircle) => {
    Alert.alert(
      `Join "${circle.name}"?`,
      `${circle.description}\n\nMembers: ${circle.members}\nNext meeting: ${circle.nextMeeting}\n\nMembership is recorded on-chain for accountability and continuity.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Circle', onPress: () => Alert.alert('Joined!', `Welcome to ${circle.name}. See you at the next meeting.`) },
      ],
    );
  }, []);

  const handleJoinEvent = useCallback((event: WellnessEvent) => {
    Alert.alert(
      'RSVP: ' + event.title,
      `Date: ${event.date}\nAttendees: ${event.attendees}\n\nWould you like to join this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'RSVP', onPress: () => Alert.alert('You\'re In!', `You have been registered for "${event.title}".`) },
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    moodBtn: { alignItems: 'center', padding: 10, borderRadius: 14, minWidth: 56 },
    moodBtnActive: { backgroundColor: t.accent.blue + '20', borderWidth: 2, borderColor: t.accent.blue },
    moodEmoji: { fontSize: fonts.hero, marginBottom: 4 },
    moodLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 80, textAlignVertical: 'top' },
    inputSmall: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 50, textAlignVertical: 'top' },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    promptText: { color: t.accent.purple, fontSize: fonts.md, fontStyle: 'italic', marginBottom: 12, lineHeight: 20 },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    actionBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.bg.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: t.accent.red },
    secondaryBtnText: { color: t.accent.red, fontSize: fonts.lg, fontWeight: fonts.bold },
    moodBar: { height: 24, borderRadius: 6, marginBottom: 4 },
    moodDate: { color: t.text.muted, fontSize: fonts.xs, marginBottom: 2 },
    moodNote: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    listenerCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    listenerIcon: { fontSize: fonts.xxxl, marginRight: 12 },
    listenerInfo: { flex: 1 },
    listenerName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    listenerSpec: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    connectBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    connectBtnOff: { backgroundColor: t.bg.primary },
    connectBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    connectBtnTextOff: { color: t.text.muted },
    crisisCard: { backgroundColor: t.accent.red + '10', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: t.accent.red + '30' },
    crisisRegion: { color: t.accent.red, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    crisisName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    crisisNumber: { color: t.accent.blue, fontSize: fonts.xl, fontWeight: fonts.heavy, marginTop: 4 },
    crisisAvail: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    circleCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    circleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    circleIcon: { fontSize: fonts.xxxl, marginRight: 10 },
    circleName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    circleDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    badgeText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    exerciseCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
    exerciseIcon: { fontSize: fonts.xxl, marginRight: 10 },
    exerciseTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    exerciseDuration: { color: t.text.muted, fontSize: fonts.sm },
    exerciseStep: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 22, marginLeft: 8 },
    exerciseStepNum: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    eventCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    eventIcon: { fontSize: fonts.xxxl, marginRight: 12 },
    eventInfo: { flex: 1 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventDate: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    eventAttendees: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2 },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
  }), [t]);

  const TAB_LABELS: Record<WellnessTab, string> = {
    'check-in': 'Check-In',
    'support': 'Support',
    'exercises': 'Exercises',
    'circles': 'Circles',
  };

  // ─── CHECK-IN TAB ─────────────────────────────────────────────
  const renderCheckIn = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F49A}'}</Text>
        <Text style={s.heroTitle}>How Are You Today?</Text>
        <Text style={s.heroSubtitle}>
          Your daily check-in matters. Tracking how you feel helps you
          understand patterns and get support when you need it.
        </Text>
      </View>

      {/* Mood selector */}
      <Text style={s.section}>Today's Mood</Text>
      <View style={s.moodRow}>
        {[1, 2, 3, 4, 5].map(level => {
          const m = MOOD_EMOJIS[level];
          return (
            <TouchableOpacity
              key={level}
              style={[s.moodBtn, selectedMood === level && s.moodBtnActive]}
              onPress={() => setSelectedMood(level)}
            >
              <Text style={s.moodEmoji}>{m.emoji}</Text>
              <Text style={s.moodLabel}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Journal prompt */}
      <View style={s.card}>
        <Text style={s.inputLabel}>Journal</Text>
        <Text style={s.promptText}>{todayPrompt}</Text>
        <TextInput
          style={s.input}
          placeholder="Write your thoughts..."
          placeholderTextColor={t.text.muted}
          value={journalEntry}
          onChangeText={setJournalEntry}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={s.actionBtn} onPress={handleCheckIn}>
          <Text style={s.actionBtnText}>Save Check-In</Text>
        </TouchableOpacity>
      </View>

      {/* Gratitude journal */}
      <Text style={s.section}>Gratitude Journal</Text>
      <View style={s.card}>
        <Text style={s.inputLabel}>What are you grateful for today?</Text>
        <TextInput
          style={s.inputSmall}
          placeholder="I am grateful for..."
          placeholderTextColor={t.text.muted}
          value={gratitudeEntry}
          onChangeText={setGratitudeEntry}
          multiline
        />
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: t.accent.yellow }]} onPress={handleGratitudeSubmit}>
          <Text style={s.actionBtnText}>{'\u{1F49B}'} Add to Gratitude Wall</Text>
        </TouchableOpacity>
      </View>

      {/* Progress tracking */}
      {moodHistory.length > 0 && (
        <>
          <Text style={s.section}>Your Week</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={[s.summaryNum, { color: t.accent.purple }]}>{streak}</Text>
              <Text style={s.summaryLabel}>Day Streak</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={[s.summaryNum, { color: MOOD_EMOJIS[Math.round(avgMood)]?.color ?? t.text.primary }]}>
                {avgMood.toFixed(1)}
              </Text>
              <Text style={s.summaryLabel}>Avg Mood</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={[s.summaryNum, { color: t.accent.green }]}>{moodHistory.length}</Text>
              <Text style={s.summaryLabel}>Check-Ins</Text>
            </View>
          </View>

          <Text style={s.section}>7-Day Mood History</Text>
          {moodHistory.map((entry, i) => {
            const m = MOOD_EMOJIS[entry.mood];
            const barWidth = (entry.mood / 5) * 100;
            return (
              <View key={i} style={s.card}>
                <View style={s.row}>
                  <Text style={s.moodDate}>{entry.date}</Text>
                  <Text style={{ fontSize: fonts.xl }}>{m.emoji}</Text>
                </View>
                <View style={[s.moodBar, { width: `${barWidth}%`, backgroundColor: m.color + '40' }]} />
                <Text style={s.moodNote}>{entry.note}</Text>
              </View>
            );
          })}
        </>
      )}

      {!demoMode && (
        <Text style={s.empty}>Enable Demo Mode in Settings to see sample wellness data.</Text>
      )}
    </>
  );

  // ─── SUPPORT TAB ──────────────────────────────────────────────
  const renderSupport = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F91D}'}</Text>
        <Text style={s.heroTitle}>You Are Not Alone</Text>
        <Text style={s.heroSubtitle}>
          Connect with trained peer listeners from your community.
          They are not therapists — they are people who understand.
        </Text>
      </View>

      {/* Crisis button */}
      <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowCrisis(!showCrisis)}>
        <Text style={s.secondaryBtnText}>
          {showCrisis ? 'Hide Crisis Resources' : '\u{1F6A8} Crisis? Get Immediate Help'}
        </Text>
      </TouchableOpacity>

      {showCrisis && (
        <>
          <Text style={s.section}>Crisis Helplines</Text>
          {CRISIS_RESOURCES.map((cr, i) => (
            <View key={i} style={s.crisisCard}>
              <Text style={s.crisisRegion}>{cr.region}</Text>
              <Text style={s.crisisName}>{cr.name}</Text>
              <Text style={s.crisisNumber}>{cr.number}</Text>
              <Text style={s.crisisAvail}>{cr.available}</Text>
            </View>
          ))}
          <View style={s.divider} />
        </>
      )}

      {/* Peer listeners */}
      <Text style={s.section}>Peer Listeners</Text>
      {listeners.length === 0 ? (
        <Text style={s.empty}>Enable Demo Mode to see peer listeners.</Text>
      ) : (
        listeners.map(listener => (
          <View key={listener.id} style={s.listenerCard}>
            <Text style={s.listenerIcon}>{listener.icon}</Text>
            <View style={s.listenerInfo}>
              <Text style={s.listenerName}>{listener.name}</Text>
              <Text style={s.listenerSpec}>{listener.specialty}</Text>
              <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 2 }}>
                {listener.rating}/5 \u2605 \u00B7 {listener.sessions} sessions
              </Text>
            </View>
            <TouchableOpacity
              style={[s.connectBtn, !listener.available && s.connectBtnOff]}
              onPress={() => handleConnectListener(listener)}
            >
              <Text style={[s.connectBtnText, !listener.available && s.connectBtnTextOff]}>
                {listener.available ? 'Connect' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Community wellness events */}
      <Text style={s.section}>Community Events</Text>
      {events.length === 0 ? (
        <Text style={s.empty}>Enable Demo Mode to see wellness events.</Text>
      ) : (
        events.map(event => (
          <View key={event.id} style={s.eventCard}>
            <Text style={s.eventIcon}>{event.icon}</Text>
            <View style={s.eventInfo}>
              <Text style={s.eventTitle}>{event.title}</Text>
              <Text style={s.eventDate}>{event.date}</Text>
              <Text style={s.eventAttendees}>{event.attendees} attending</Text>
            </View>
            <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinEvent(event)}>
              <Text style={s.joinBtnText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  // ─── EXERCISES TAB ────────────────────────────────────────────
  const renderExercises = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F9D8}'}</Text>
        <Text style={s.heroTitle}>Mindfulness Exercises</Text>
        <Text style={s.heroSubtitle}>
          Text-based guides that work offline. No internet needed.
          Breathe, ground, meditate — anywhere, anytime.
        </Text>
      </View>

      {exercises.length === 0 ? (
        <Text style={s.empty}>Enable Demo Mode to see mindfulness exercises.</Text>
      ) : (
        exercises.map(ex => {
          const isExpanded = expandedExercise === ex.id;
          const catColor = CATEGORY_COLORS[ex.category] ?? t.accent.purple;
          return (
            <TouchableOpacity
              key={ex.id}
              style={s.exerciseCard}
              onPress={() => setExpandedExercise(isExpanded ? null : ex.id)}
              activeOpacity={0.7}
            >
              <View style={s.exerciseHeader}>
                <Text style={s.exerciseIcon}>{ex.icon}</Text>
                <Text style={s.exerciseTitle}>{ex.title}</Text>
                <View style={[s.badge, { backgroundColor: catColor }]}>
                  <Text style={s.badgeText}>{ex.category}</Text>
                </View>
              </View>
              <View style={[s.row, { marginTop: 6, marginBottom: 0 }]}>
                <Text style={s.exerciseDuration}>{ex.duration}</Text>
                <Text style={{ color: t.accent.blue, fontSize: fonts.sm }}>
                  {isExpanded ? 'Collapse' : 'Start'}
                </Text>
              </View>
              {isExpanded && (
                <View style={{ marginTop: 12 }}>
                  {ex.steps.map((step, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={s.exerciseStepNum}>{i + 1}. </Text>
                      <Text style={s.exerciseStep}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  // ─── CIRCLES TAB ──────────────────────────────────────────────
  const renderCircles = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F465}'}</Text>
        <Text style={s.heroTitle}>Support Circles</Text>
        <Text style={s.heroSubtitle}>
          Small peer groups that meet regularly. Membership is on-chain
          for accountability and continuity. Safe, structured, supportive.
        </Text>
      </View>

      {circles.length === 0 ? (
        <Text style={s.empty}>Enable Demo Mode to see support circles.</Text>
      ) : (
        circles.map(circle => (
          <View key={circle.id} style={s.circleCard}>
            <View style={s.circleHeader}>
              <Text style={s.circleIcon}>{circle.icon}</Text>
              <Text style={s.circleName}>{circle.name}</Text>
              {circle.onChain && (
                <View style={[s.badge, { backgroundColor: t.accent.green }]}>
                  <Text style={s.badgeText}>On-Chain</Text>
                </View>
              )}
            </View>
            <Text style={s.circleDesc}>{circle.description}</Text>
            <View style={s.row}>
              <Text style={s.label}>Members</Text>
              <Text style={s.val}>{circle.members}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Next Meeting</Text>
              <Text style={s.val}>{circle.nextMeeting}</Text>
            </View>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleJoinCircle(circle)}>
              <Text style={s.actionBtnText}>Join Circle</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Events in circles tab too */}
      {events.length > 0 && (
        <>
          <Text style={s.section}>Upcoming Wellness Events</Text>
          {events.map(event => (
            <View key={event.id} style={s.eventCard}>
              <Text style={s.eventIcon}>{event.icon}</Text>
              <View style={s.eventInfo}>
                <Text style={s.eventTitle}>{event.title}</Text>
                <Text style={s.eventDate}>{event.date}</Text>
                <Text style={s.eventAttendees}>{event.attendees} attending</Text>
              </View>
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinEvent(event)}>
                <Text style={s.joinBtnText}>RSVP</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mental Wellness</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={s.scroll}>
        <Text style={s.subtitle}>
          Article I (hOTK) — Your mental health matters. Connect with peers, track your wellness, and find support when you need it.
        </Text>

        <View style={s.tabRow}>
          {(['check-in', 'support', 'exercises', 'circles'] as WellnessTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'check-in' && renderCheckIn()}
        {activeTab === 'support' && renderSupport()}
        {activeTab === 'exercises' && renderExercises()}
        {activeTab === 'circles' && renderCircles()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
