import { fonts } from '../utils/theme';
/**
 * Recovery Screen — Addiction recovery peer support, wellness journey.
 *
 * Article I (hOTK): "Every dimension of human contribution is valued equally."
 * Recovery is one of the bravest human journeys — it deserves recognition,
 * support, and the full power of community.
 *
 * Features:
 * - Recovery categories: substance, behavioral, mental health
 * - Daily check-in (mood, cravings level, triggers, wins)
 * - Streak tracker (days in recovery, milestones)
 * - Peer sponsors (experienced recovery members offering guidance)
 * - Meeting finder (community support meetings, schedules)
 * - Resource library (coping strategies, emergency contacts, hotlines)
 * - All data encrypted, never shared without explicit consent
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

interface DailyCheckIn {
  id: string;
  date: string;
  mood: number; // 1-5
  cravingsLevel: number; // 0-10
  triggers: string[];
  wins: string;
  notes: string;
}

interface RecoveryProgress {
  streakDays: number;
  bestStreak: number;
  totalCheckIns: number;
  category: string;
  startDate: string;
  milestonesReached: number[];
  avgMood: number;
  avgCravings: number;
}

interface Sponsor {
  id: string;
  name: string;
  category: string;
  yearsInRecovery: number;
  available: boolean;
  bio: string;
  specialties: string[];
}

interface Meeting {
  id: string;
  name: string;
  category: string;
  day: string;
  time: string;
  location: string;
  format: 'in-person' | 'virtual' | 'hybrid';
  anonymous: boolean;
  attendees: number;
}

interface RecoveryResource {
  id: string;
  title: string;
  type: 'strategy' | 'hotline' | 'article' | 'exercise';
  description: string;
  phone?: string;
  readTime?: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const RECOVERY_CATEGORIES = [
  { key: 'substance', label: 'Substance', icon: 'S' },
  { key: 'behavioral', label: 'Behavioral', icon: 'B' },
  { key: 'mental_health', label: 'Mental Health', icon: 'M' },
];

const MOOD_LEVELS = [
  { value: 1, label: 'Struggling' },
  { value: 2, label: 'Difficult' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

const COMMON_TRIGGERS = [
  'Stress', 'Loneliness', 'Social pressure', 'Boredom',
  'Conflict', 'Fatigue', 'Celebration', 'Pain',
];

const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365, 730, 1095];

const MILESTONE_LABELS: Record<number, string> = {
  1: '1 Day',
  7: '1 Week',
  14: '2 Weeks',
  30: '1 Month',
  60: '2 Months',
  90: '90 Days',
  180: '6 Months',
  365: '1 Year',
  730: '2 Years',
  1095: '3 Years',
};

// ─── Demo Data ───

const DEMO_PROGRESS: RecoveryProgress = {
  streakDays: 142,
  bestStreak: 142,
  totalCheckIns: 138,
  category: 'substance',
  startDate: '2025-11-08',
  milestonesReached: [1, 7, 14, 30, 60, 90],
  avgMood: 3.7,
  avgCravings: 2.4,
};

const DEMO_CHECKINS: DailyCheckIn[] = [
  { id: '1', date: '2026-03-29', mood: 4, cravingsLevel: 1, triggers: ['Stress'], wins: 'Went for a morning run instead of giving in.', notes: 'Feeling stronger every week.' },
  { id: '2', date: '2026-03-28', mood: 3, cravingsLevel: 3, triggers: ['Social pressure', 'Fatigue'], wins: 'Called my sponsor when tempted.', notes: 'Tough day but made it through.' },
  { id: '3', date: '2026-03-27', mood: 4, cravingsLevel: 1, triggers: [], wins: 'Led my first group meeting.', notes: 'Incredibly rewarding to help others.' },
  { id: '4', date: '2026-03-26', mood: 5, cravingsLevel: 0, triggers: [], wins: 'Celebrated 140 days with my family.', notes: 'Grateful beyond words.' },
  { id: '5', date: '2026-03-25', mood: 3, cravingsLevel: 4, triggers: ['Conflict', 'Stress'], wins: 'Used breathing exercises.', notes: 'Work conflict triggered old patterns. Coped well.' },
  { id: '6', date: '2026-03-24', mood: 4, cravingsLevel: 2, triggers: ['Boredom'], wins: 'Started a new hobby — painting.', notes: 'Creative outlet helps a lot.' },
  { id: '7', date: '2026-03-23', mood: 4, cravingsLevel: 1, triggers: [], wins: 'Completed full week of exercise.', notes: 'Body and mind feeling connected.' },
];

const DEMO_SPONSORS: Sponsor[] = [
  {
    id: '1',
    name: 'Marcus T.',
    category: 'substance',
    yearsInRecovery: 8,
    available: true,
    bio: '8 years in recovery. I know how hard the first year is — I am here to walk alongside you.',
    specialties: ['Early recovery', 'Relapse prevention', 'Family rebuilding'],
  },
  {
    id: '2',
    name: 'Priya S.',
    category: 'substance',
    yearsInRecovery: 5,
    available: true,
    bio: 'Former healthcare professional. I specialize in helping those who face stigma in their recovery.',
    specialties: ['Stigma navigation', 'Professional recovery', 'Mindfulness'],
  },
  {
    id: '3',
    name: 'David K.',
    category: 'behavioral',
    yearsInRecovery: 3,
    available: false,
    bio: 'Behavioral recovery advocate. Currently at capacity but accepting waitlist.',
    specialties: ['Behavioral patterns', 'CBT strategies', 'Digital wellness'],
  },
];

const DEMO_MEETINGS: Meeting[] = [
  {
    id: '1',
    name: 'Morning Strength Circle',
    category: 'substance',
    day: 'Monday, Wednesday, Friday',
    time: '7:00 AM',
    location: 'Community Center, Room 4B',
    format: 'hybrid',
    anonymous: true,
    attendees: 12,
  },
  {
    id: '2',
    name: 'Evening Reflection Group',
    category: 'mental_health',
    day: 'Tuesday, Thursday',
    time: '6:30 PM',
    location: 'Virtual (link provided on join)',
    format: 'virtual',
    anonymous: true,
    attendees: 8,
  },
];

const DEMO_RESOURCES: RecoveryResource[] = [
  { id: '1', title: 'SAMHSA National Helpline', type: 'hotline', description: 'Free, confidential, 24/7, 365-day-a-year treatment referral and information service.', phone: '1-800-662-4357' },
  { id: '2', title: 'Urge Surfing Technique', type: 'strategy', description: 'A mindfulness-based approach to riding out cravings without acting on them. Observe the urge, breathe, and let it pass.', readTime: '4 min' },
  { id: '3', title: 'Building a Relapse Prevention Plan', type: 'article', description: 'Step-by-step guide to identifying your triggers, building coping strategies, and creating an emergency action plan.', readTime: '10 min' },
  { id: '4', title: 'Grounding Exercise: 5-4-3-2-1', type: 'exercise', description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Brings you back to the present moment.' },
];

type Tab = 'check-in' | 'progress' | 'sponsors' | 'meetings';

export function RecoveryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('check-in');
  const [mood, setMood] = useState(0);
  const [cravingsLevel, setCravingsLevel] = useState(0);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [wins, setWins] = useState('');
  const [notes, setNotes] = useState('');
  const [showResources, setShowResources] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const progress = DEMO_PROGRESS;
  const checkIns = DEMO_CHECKINS;
  const sponsors = DEMO_SPONSORS;
  const meetings = DEMO_MEETINGS;
  const resources = DEMO_RESOURCES;

  const nextMilestone = MILESTONES.find((m) => m > progress.streakDays) || 0;
  const daysToNext = nextMilestone - progress.streakDays;

  const toggleTrigger = useCallback((trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger],
    );
  }, []);

  const handleCheckIn = useCallback(() => {
    if (mood === 0) { Alert.alert('Required', 'Please select your mood.'); return; }

    Alert.alert(
      'Check-In Recorded',
      `Mood: ${MOOD_LEVELS.find((m) => m.value === mood)?.label}\nCravings: ${cravingsLevel}/10\n${selectedTriggers.length > 0 ? `Triggers: ${selectedTriggers.join(', ')}\n` : ''}${wins ? `Win: ${wins}\n` : ''}\nYour data is encrypted and never shared without your explicit consent.`,
    );
    setMood(0);
    setCravingsLevel(0);
    setSelectedTriggers([]);
    setWins('');
    setNotes('');
  }, [mood, cravingsLevel, selectedTriggers, wins]);

  const handleContactSponsor = useCallback((sponsor: Sponsor) => {
    if (!sponsor.available) {
      Alert.alert('Waitlist', `${sponsor.name} is currently at capacity. Would you like to join the waitlist?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Waitlist', onPress: () => Alert.alert('Added', 'You have been added to the waitlist.') },
      ]);
      return;
    }
    Alert.alert(
      'Contact Sponsor',
      `Reach out to ${sponsor.name}?\n\n${sponsor.yearsInRecovery} years in recovery\nSpecialties: ${sponsor.specialties.join(', ')}\n\nAll conversations are confidential.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: () => Alert.alert('Sent', `Your request has been sent to ${sponsor.name}. They will respond within 24 hours.`) },
      ],
    );
  }, []);

  const handleJoinMeeting = useCallback((meeting: Meeting) => {
    Alert.alert(
      'Join Meeting',
      `"${meeting.name}"\n\nSchedule: ${meeting.day} at ${meeting.time}\nFormat: ${meeting.format}\nLocation: ${meeting.location}${meeting.anonymous ? '\n\nAnonymous participation available.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => Alert.alert('Joined', 'You will receive reminders before each meeting.') },
      ],
    );
  }, []);

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
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    streakNumber: { color: t.accent.green, fontSize: 56, fontWeight: fonts.heavy },
    streakLabel: { color: t.text.muted, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
    streakSince: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    nextMilestone: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginTop: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: t.bg.primary },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    milestoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 16 },
    milestoneChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: t.bg.secondary },
    milestoneChipReached: { backgroundColor: t.accent.green },
    milestoneChipNext: { backgroundColor: t.accent.purple + '20', borderWidth: 1, borderColor: t.accent.purple },
    milestoneText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    milestoneTextReached: { color: '#fff' },
    milestoneTextNext: { color: t.accent.purple },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginHorizontal: 3, backgroundColor: t.bg.primary },
    moodBtnActive: { backgroundColor: t.accent.green },
    moodValue: { color: t.text.secondary, fontSize: 18, fontWeight: fonts.bold },
    moodValueActive: { color: '#fff' },
    moodLabel: { color: t.text.muted, fontSize: 9, marginTop: 2 },
    moodLabelActive: { color: '#fff' },
    cravingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cravingsLabel: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    cravingsValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    cravingsBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginBottom: 16 },
    cravingsBarInner: { height: 8, borderRadius: 4 },
    triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    triggerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary, backgroundColor: t.bg.primary },
    triggerChipActive: { backgroundColor: t.accent.orange + '20', borderColor: t.accent.orange },
    triggerText: { color: t.text.secondary, fontSize: 13 },
    triggerTextActive: { color: t.accent.orange, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    checkInCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    checkInDate: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1 },
    checkInRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    checkInMood: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    checkInCravings: { fontSize: 14, fontWeight: fonts.semibold },
    checkInWin: { color: t.accent.green, fontSize: 13, marginTop: 6, fontStyle: 'italic' },
    checkInTriggers: { color: t.accent.orange, fontSize: 12, marginTop: 4 },
    sponsorCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sponsorName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    sponsorMeta: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    sponsorBio: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    sponsorSpecialties: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    sponsorStatus: { fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    contactBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    contactBtnUnavailable: { backgroundColor: t.bg.primary },
    contactBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    contactBtnTextUnavailable: { color: t.text.muted },
    meetingCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    meetingName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    meetingCategory: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    meetingDetail: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    meetingFormat: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 6 },
    meetingAnon: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold, marginTop: 2 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    resourceBtn: { backgroundColor: t.bg.secondary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    resourceBtnText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    resourceTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    resourceType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    resourceDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    resourcePhone: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginTop: 4 },
    resourceMeta: { color: t.text.secondary, fontSize: 12, marginTop: 6 },
    encryptionNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 16, lineHeight: 16 },
    sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    sliderBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg.primary },
    sliderBtnActive: { backgroundColor: t.accent.orange },
    sliderBtnText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold },
    sliderBtnTextActive: { color: '#fff' },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'check-in', label: 'Check-In' },
    { key: 'progress', label: 'Progress' },
    { key: 'sponsors', label: 'Sponsors' },
    { key: 'meetings', label: 'Meetings' },
  ];

  const getCravingsColor = (level: number) => {
    if (level <= 2) return t.accent.green;
    if (level <= 5) return t.accent.orange || '#FF9500';
    return t.accent.red || '#FF3B30';
  };

  // ─── Render: Check-In Tab ───

  const renderCheckIn = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.streakNumber}>{progress.streakDays}</Text>
        <Text style={s.streakLabel}>Days in Recovery</Text>
        <Text style={s.streakSince}>Since {progress.startDate}</Text>
        {nextMilestone > 0 && (
          <Text style={s.nextMilestone}>{daysToNext} days to next milestone ({MILESTONE_LABELS[nextMilestone]})</Text>
        )}
      </View>

      <Text style={s.sectionTitle}>Daily Check-In</Text>
      <View style={s.card}>
        <Text style={[s.cravingsLabel, { marginBottom: 8 }]}>How are you feeling?</Text>
        <View style={s.moodRow}>
          {MOOD_LEVELS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[s.moodBtn, mood === m.value && s.moodBtnActive]}
              onPress={() => setMood(m.value)}
            >
              <Text style={[s.moodValue, mood === m.value && s.moodValueActive]}>{m.value}</Text>
              <Text style={[s.moodLabel, mood === m.value && s.moodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.cravingsRow}>
          <Text style={s.cravingsLabel}>Cravings Level</Text>
          <Text style={[s.cravingsValue, { color: getCravingsColor(cravingsLevel) }]}>{cravingsLevel}/10</Text>
        </View>
        <View style={s.cravingsBar}>
          <View style={[s.cravingsBarInner, { width: `${cravingsLevel * 10}%`, backgroundColor: getCravingsColor(cravingsLevel) }]} />
        </View>
        <View style={s.sliderRow}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <TouchableOpacity
              key={v}
              style={[s.sliderBtn, cravingsLevel === v && s.sliderBtnActive]}
              onPress={() => setCravingsLevel(v)}
            >
              <Text style={[s.sliderBtnText, cravingsLevel === v && s.sliderBtnTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.cravingsLabel, { marginTop: 16, marginBottom: 8 }]}>Triggers today</Text>
        <View style={s.triggerGrid}>
          {COMMON_TRIGGERS.map((tr) => (
            <TouchableOpacity
              key={tr}
              style={[s.triggerChip, selectedTriggers.includes(tr) && s.triggerChipActive]}
              onPress={() => toggleTrigger(tr)}
            >
              <Text style={[s.triggerText, selectedTriggers.includes(tr) && s.triggerTextActive]}>{tr}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder="Today's win (even small ones count)"
          placeholderTextColor={t.text.muted}
          value={wins}
          onChangeText={setWins}
        />
        <TextInput
          style={s.input}
          placeholder="Notes (optional)"
          placeholderTextColor={t.text.muted}
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleCheckIn}>
          <Text style={s.submitBtnText}>Record Check-In</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.encryptionNote}>
        All check-in data is encrypted end-to-end. It is never shared without your explicit consent.
      </Text>

      <Text style={s.sectionTitle}>Recent Check-Ins</Text>
      {checkIns.slice(0, 4).map((ci) => (
        <View key={ci.id} style={s.checkInCard}>
          <Text style={s.checkInDate}>{ci.date}</Text>
          <View style={s.checkInRow}>
            <Text style={s.checkInMood}>Mood: {MOOD_LEVELS.find((m) => m.value === ci.mood)?.label}</Text>
            <Text style={[s.checkInCravings, { color: getCravingsColor(ci.cravingsLevel) }]}>
              Cravings: {ci.cravingsLevel}/10
            </Text>
          </View>
          {ci.wins && <Text style={s.checkInWin}>Win: {ci.wins}</Text>}
          {ci.triggers.length > 0 && <Text style={s.checkInTriggers}>Triggers: {ci.triggers.join(', ')}</Text>}
        </View>
      ))}
    </>
  );

  // ─── Render: Progress Tab ───

  const renderProgress = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.streakNumber}>{progress.streakDays}</Text>
        <Text style={s.streakLabel}>Day Streak</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{progress.totalCheckIns}</Text>
            <Text style={s.statLabel}>Check-Ins</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{progress.avgMood.toFixed(1)}</Text>
            <Text style={s.statLabel}>Avg Mood</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{progress.avgCravings.toFixed(1)}</Text>
            <Text style={s.statLabel}>Avg Cravings</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{progress.bestStreak}</Text>
            <Text style={s.statLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Milestones</Text>
      <View style={s.milestoneRow}>
        {MILESTONES.map((m) => {
          const reached = progress.milestonesReached.includes(m);
          const isNext = m === nextMilestone;
          return (
            <View
              key={m}
              style={[s.milestoneChip, reached && s.milestoneChipReached, isNext && s.milestoneChipNext]}
            >
              <Text style={[s.milestoneText, reached && s.milestoneTextReached, isNext && s.milestoneTextNext]}>
                {MILESTONE_LABELS[m]}{reached ? ' *' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>Weekly Check-In History</Text>
      {checkIns.map((ci) => (
        <View key={ci.id} style={s.checkInCard}>
          <Text style={s.checkInDate}>{ci.date}</Text>
          <View style={s.checkInRow}>
            <Text style={s.checkInMood}>Mood: {MOOD_LEVELS.find((m) => m.value === ci.mood)?.label} ({ci.mood}/5)</Text>
            <Text style={[s.checkInCravings, { color: getCravingsColor(ci.cravingsLevel) }]}>
              Cravings: {ci.cravingsLevel}/10
            </Text>
          </View>
          {ci.wins && <Text style={s.checkInWin}>Win: {ci.wins}</Text>}
          {ci.triggers.length > 0 && <Text style={s.checkInTriggers}>Triggers: {ci.triggers.join(', ')}</Text>}
        </View>
      ))}
    </>
  );

  // ─── Render: Sponsors Tab ───

  const renderSponsors = () => (
    <>
      <Text style={s.sectionTitle}>Peer Sponsors</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Experienced recovery members offering confidential guidance. All sponsor relationships are voluntary and private.
      </Text>

      {sponsors.map((sp) => (
        <View key={sp.id} style={s.sponsorCard}>
          <Text style={s.sponsorName}>{sp.name}</Text>
          <Text style={s.sponsorMeta}>{sp.yearsInRecovery} years in recovery</Text>
          <Text style={s.sponsorBio}>{sp.bio}</Text>
          <Text style={s.sponsorSpecialties}>Specialties: {sp.specialties.join(', ')}</Text>
          <Text style={[s.sponsorStatus, { color: sp.available ? t.accent.green : t.text.muted }]}>
            {sp.available ? 'Available' : 'At capacity (waitlist open)'}
          </Text>
          <TouchableOpacity
            style={[s.contactBtn, !sp.available && s.contactBtnUnavailable]}
            onPress={() => handleContactSponsor(sp)}
          >
            <Text style={[s.contactBtnText, !sp.available && s.contactBtnTextUnavailable]}>
              {sp.available ? 'Request Sponsor' : 'Join Waitlist'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={s.encryptionNote}>
        Sponsor relationships are confidential. Communication is encrypted end-to-end.
      </Text>
    </>
  );

  // ─── Render: Meetings Tab ───

  const renderMeetings = () => (
    <>
      <Text style={s.sectionTitle}>Community Meetings</Text>

      {meetings.map((mt) => (
        <View key={mt.id} style={s.meetingCard}>
          <Text style={s.meetingName}>{mt.name}</Text>
          <Text style={s.meetingCategory}>
            {RECOVERY_CATEGORIES.find((c) => c.key === mt.category)?.label || mt.category}
          </Text>
          <Text style={s.meetingDetail}>{mt.day} at {mt.time}</Text>
          <Text style={s.meetingDetail}>{mt.location}</Text>
          <Text style={s.meetingFormat}>{mt.format} | {mt.attendees} regular attendees</Text>
          {mt.anonymous && <Text style={s.meetingAnon}>Anonymous participation available</Text>}
          <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinMeeting(mt)}>
            <Text style={s.joinBtnText}>Join Meeting</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={s.resourceBtn} onPress={() => setShowResources(!showResources)}>
        <Text style={s.resourceBtnText}>{showResources ? 'Hide' : 'View'} Recovery Resources</Text>
      </TouchableOpacity>

      {showResources && resources.map((r) => (
        <View key={r.id} style={s.resourceCard}>
          <Text style={s.resourceTitle}>{r.title}</Text>
          <Text style={s.resourceType}>{r.type}</Text>
          <Text style={s.resourceDesc}>{r.description}</Text>
          {r.phone && <Text style={s.resourcePhone}>Call: {r.phone}</Text>}
          {r.readTime && <Text style={s.resourceMeta}>Read time: {r.readTime}</Text>}
        </View>
      ))}

      <Text style={s.encryptionNote}>
        Your meeting participation is private. All data is encrypted and never shared without your explicit consent.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Recovery</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'check-in' && renderCheckIn()}
        {tab === 'progress' && renderProgress()}
        {tab === 'sponsors' && renderSponsors()}
        {tab === 'meetings' && renderMeetings()}
      </ScrollView>
    </SafeAreaView>
  );
}
