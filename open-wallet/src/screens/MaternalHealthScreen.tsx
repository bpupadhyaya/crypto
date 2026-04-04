import { fonts } from '../utils/theme';
/**
 * Maternal Health Screen — Pregnancy, prenatal, postnatal care.
 *
 * Article I (hOTK + nOTK): "Every dimension of human contribution is valued equally."
 * Pregnancy and maternal care are foundational human value — recognized on-chain.
 *
 * Features:
 * - Pregnancy journey tracker (trimester milestones, checkups, due date countdown)
 * - Prenatal care checklist (vitamins, appointments, exercises, nutrition)
 * - Community midwife/doula directory
 * - Postnatal support (breastfeeding help, sleep tips, mental health check-ins)
 * - New parent community (peer support, Q&A)
 * - hOTK earned for completing health milestones
 * - Demo: 28 weeks pregnant, 3 upcoming checkups, 2 community midwives
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface TrimesterMilestone {
  id: string;
  week: number;
  title: string;
  description: string;
  completed: boolean;
  hotkEarned: number;
}

interface CareItem {
  id: string;
  category: 'vitamin' | 'appointment' | 'exercise' | 'nutrition';
  title: string;
  frequency: string;
  completed: boolean;
  hotkReward: number;
}

interface Midwife {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  available: boolean;
  nOTKEarned: number;
}

interface SupportTopic {
  id: string;
  category: 'breastfeeding' | 'sleep' | 'mental_health' | 'recovery';
  title: string;
  description: string;
  responses: number;
  helpful: number;
}

interface CommunityPost {
  id: string;
  author: string;
  question: string;
  replies: number;
  hotkEarned: number;
  date: string;
}

// ─── Demo Data ───

const DEMO_JOURNEY: TrimesterMilestone[] = [
  { id: 'j1', week: 8, title: 'First Ultrasound', description: 'Confirmed heartbeat and estimated due date', completed: true, hotkEarned: 200 },
  { id: 'j2', week: 12, title: 'First Trimester Screening', description: 'Blood tests and nuchal translucency scan', completed: true, hotkEarned: 250 },
  { id: 'j3', week: 16, title: 'Gender Reveal Ready', description: 'Anatomy developing, optional gender scan', completed: true, hotkEarned: 150 },
  { id: 'j4', week: 20, title: 'Anatomy Scan', description: 'Detailed ultrasound checking all organ systems', completed: true, hotkEarned: 300 },
  { id: 'j5', week: 24, title: 'Glucose Screening', description: 'Gestational diabetes test completed', completed: true, hotkEarned: 200 },
  { id: 'j6', week: 28, title: 'Third Trimester Begins', description: 'Current week — entering the home stretch', completed: false, hotkEarned: 0 },
  { id: 'j7', week: 32, title: 'Growth Scan', description: 'Baby growth and position check', completed: false, hotkEarned: 0 },
  { id: 'j8', week: 36, title: 'Group B Strep Test', description: 'Routine screening before delivery', completed: false, hotkEarned: 0 },
  { id: 'j9', week: 40, title: 'Due Date', description: 'Full term — ready to welcome baby', completed: false, hotkEarned: 0 },
];

const DEMO_CARE_CHECKLIST: CareItem[] = [
  { id: 'c1', category: 'vitamin', title: 'Prenatal Vitamins (daily)', frequency: 'Daily', completed: true, hotkReward: 10 },
  { id: 'c2', category: 'vitamin', title: 'Folic Acid Supplement', frequency: 'Daily', completed: true, hotkReward: 10 },
  { id: 'c3', category: 'vitamin', title: 'Iron Supplement', frequency: 'Daily', completed: true, hotkReward: 10 },
  { id: 'c4', category: 'appointment', title: 'OB-GYN Checkup — Week 30', frequency: 'Apr 12', completed: false, hotkReward: 150 },
  { id: 'c5', category: 'appointment', title: 'OB-GYN Checkup — Week 32', frequency: 'Apr 26', completed: false, hotkReward: 150 },
  { id: 'c6', category: 'appointment', title: 'Childbirth Class', frequency: 'Apr 5', completed: false, hotkReward: 200 },
  { id: 'c7', category: 'exercise', title: 'Prenatal Yoga (30 min)', frequency: '3x/week', completed: true, hotkReward: 50 },
  { id: 'c8', category: 'exercise', title: 'Walking (20 min)', frequency: 'Daily', completed: true, hotkReward: 30 },
  { id: 'c9', category: 'nutrition', title: 'Balanced Meal Plan', frequency: 'Weekly', completed: true, hotkReward: 40 },
  { id: 'c10', category: 'nutrition', title: 'Hydration Goal (8 glasses)', frequency: 'Daily', completed: true, hotkReward: 10 },
];

const DEMO_MIDWIVES: Midwife[] = [
  { id: 'mw1', name: 'Sarah Chen, CNM', specialty: 'Natural Birth & Water Birth', rating: 4.9, distance: '2.3 mi', available: true, nOTKEarned: 12400 },
  { id: 'mw2', name: 'Maria Santos, Doula', specialty: 'Postpartum Support & Breastfeeding', rating: 4.8, distance: '3.1 mi', available: true, nOTKEarned: 9800 },
];

const DEMO_SUPPORT: SupportTopic[] = [
  { id: 's1', category: 'breastfeeding', title: 'Latching Techniques', description: 'Step-by-step guide to proper latch positions and troubleshooting', responses: 42, helpful: 38 },
  { id: 's2', category: 'sleep', title: 'Newborn Sleep Schedule', description: 'What to expect in the first 3 months and safe sleep practices', responses: 67, helpful: 61 },
  { id: 's3', category: 'mental_health', title: 'Postpartum Mood Check-In', description: 'Weekly self-assessment and when to seek help — you are not alone', responses: 89, helpful: 84 },
  { id: 's4', category: 'recovery', title: 'Physical Recovery Timeline', description: 'Week-by-week guide to postpartum physical healing', responses: 35, helpful: 32 },
];

const DEMO_COMMUNITY: CommunityPost[] = [
  { id: 'p1', author: 'NewMom2026', question: 'Best prenatal yoga poses for third trimester back pain?', replies: 14, hotkEarned: 80, date: '2026-03-28' },
  { id: 'p2', author: 'ExpectingDad', question: 'How can partners best support during labor?', replies: 23, hotkEarned: 120, date: '2026-03-27' },
  { id: 'p3', author: 'SecondTimeMom', question: 'Managing toddler while pregnant — any tips?', replies: 31, hotkEarned: 150, date: '2026-03-26' },
  { id: 'p4', author: 'MidwifeJoy', question: 'Q&A: Common fears about natural birth — let me help!', replies: 56, hotkEarned: 280, date: '2026-03-25' },
];

const DEMO_WEEKS_PREGNANT = 28;
const DEMO_DUE_DATE = '2026-06-21';

// ─── Helpers ───

const CARE_ICONS: Record<string, string> = {
  vitamin: 'V',
  appointment: 'A',
  exercise: 'E',
  nutrition: 'N',
};

const SUPPORT_ICONS: Record<string, string> = {
  breastfeeding: 'B',
  sleep: 'S',
  mental_health: 'M',
  recovery: 'R',
};

type Tab = 'journey' | 'care' | 'support' | 'community';

// ─── Component ───

export function MaternalHealthScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('journey');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const currentWeek = DEMO_WEEKS_PREGNANT;
  const daysUntilDue = useMemo(() => {
    const due = new Date(DEMO_DUE_DATE);
    const now = new Date('2026-03-29');
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const totalHOTK = useMemo(() => DEMO_JOURNEY.filter(m => m.completed).reduce((sum, m) => sum + m.hotkEarned, 0), []);
  const completedMilestones = useMemo(() => DEMO_JOURNEY.filter(m => m.completed).length, []);
  const completedCareItems = useMemo(() => DEMO_CARE_CHECKLIST.filter(c => c.completed).length, []);
  const upcomingCheckups = useMemo(() => DEMO_CARE_CHECKLIST.filter(c => c.category === 'appointment' && !c.completed), []);

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
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    // Hero
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20, fontStyle: 'italic' },
    // Score
    scoreCard: { backgroundColor: t.bg.secondary, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-around' },
    scoreItem: { alignItems: 'center' },
    scoreValue: { color: t.accent.purple, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    // Due date countdown
    countdownCard: { backgroundColor: t.accent.orange + '12', borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    countdownNumber: { color: t.accent.orange, fontSize: 48, fontWeight: fonts.heavy },
    countdownLabel: { color: t.text.muted, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 4 },
    countdownDate: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8 },
    // Progress bar
    progressOuter: { height: 10, backgroundColor: t.bg.primary, borderRadius: 5, marginTop: 12, width: '100%' },
    progressInner: { height: 10, borderRadius: 5, backgroundColor: t.accent.purple },
    progressText: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, textAlign: 'center' },
    // Section
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20, marginTop: 20 },
    // Timeline
    timelineItem: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4 },
    timelineLine: { width: 2, backgroundColor: t.accent.purple + '40', marginRight: 16 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent.purple, position: 'absolute', left: -6, top: 12 },
    timelineDotPending: { backgroundColor: t.text.muted + '40' },
    timelineDotCurrent: { backgroundColor: t.accent.orange, width: 18, height: 18, borderRadius: 9, left: -8 },
    timelineContent: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, flex: 1, marginBottom: 12 },
    timelineWeek: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    timelineTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    timelineDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    timelineHOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 6 },
    timelineStatus: { fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 4 },
    statusDone: { color: t.accent.green },
    statusCurrent: { color: t.accent.orange },
    statusUpcoming: { color: t.text.muted },
    // Care checklist
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    careRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    careIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    careIconText: { fontSize: fonts.md, fontWeight: fonts.bold },
    careInfo: { flex: 1 },
    careTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    careMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    careRight: { alignItems: 'flex-end' },
    careHOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    careStatus: { fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2 },
    // Category filter
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    categoryChipActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    categoryChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    categoryChipTextActive: { color: t.accent.purple },
    // Midwife
    midwifeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    midwifeName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    midwifeSpecialty: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    midwifeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    midwifeDetail: { color: t.text.secondary, fontSize: fonts.sm },
    midwifeAvailable: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    midwifeNOTK: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    // Support
    supportCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    supportIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    supportIconText: { fontSize: fonts.sm, fontWeight: fonts.bold },
    supportTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    supportDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 20 },
    supportMeta: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8 },
    // Community
    communityCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    communityAuthor: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    communityQuestion: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 4 },
    communityMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    communityHOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    // Education
    educationCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'journey', label: 'Journey' },
    { key: 'care', label: 'Care' },
    { key: 'support', label: 'Support' },
    { key: 'community', label: 'Community' },
  ];

  // ─── Journey Tab ───

  const renderJourney = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Your Pregnancy Journey</Text>
        <Text style={s.heroSubtitle}>
          "Every new life begins with care — and that care has infinite value."
        </Text>
      </View>

      <View style={s.scoreCard}>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{currentWeek}</Text>
          <Text style={s.scoreLabel}>Weeks</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={s.scoreValue}>{completedMilestones}</Text>
          <Text style={s.scoreLabel}>Milestones</Text>
        </View>
        <View style={s.scoreItem}>
          <Text style={[s.scoreValue, { color: t.accent.green }]}>{totalHOTK}</Text>
          <Text style={s.scoreLabel}>hOTK Earned</Text>
        </View>
      </View>

      {/* Due Date Countdown */}
      <View style={s.countdownCard}>
        <Text style={s.countdownNumber}>{daysUntilDue}</Text>
        <Text style={s.countdownLabel}>Days Until Due Date</Text>
        <Text style={s.countdownDate}>Estimated: {DEMO_DUE_DATE}</Text>
        <View style={s.progressOuter}>
          <View style={[s.progressInner, { width: `${Math.round((currentWeek / 40) * 100)}%` }]} />
        </View>
        <Text style={s.progressText}>Week {currentWeek} of 40 — Trimester 3</Text>
      </View>

      {/* Upcoming Checkups */}
      {upcomingCheckups.length > 0 && (
        <>
          <Text style={s.sectionTitle}>{upcomingCheckups.length} Upcoming Checkups</Text>
          {upcomingCheckups.map((item) => (
            <View key={item.id} style={[s.card, { marginBottom: 8 }]}>
              <Text style={s.careTitle}>{item.title}</Text>
              <Text style={s.careMeta}>{item.frequency}</Text>
              <Text style={s.careHOTK}>+{item.hotkReward} hOTK on completion</Text>
            </View>
          ))}
        </>
      )}

      {/* Trimester Timeline */}
      <Text style={s.sectionTitle}>Milestone Timeline</Text>
      <View style={{ marginLeft: 28 }}>
        {DEMO_JOURNEY.map((milestone) => {
          const isCurrent = milestone.week === currentWeek;
          const isDone = milestone.completed;
          return (
            <View key={milestone.id} style={s.timelineItem}>
              <View style={s.timelineLine}>
                <View style={[
                  s.timelineDot,
                  isCurrent && s.timelineDotCurrent,
                  !isDone && !isCurrent && s.timelineDotPending,
                ]} />
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineWeek}>Week {milestone.week}</Text>
                <Text style={s.timelineTitle}>{milestone.title}</Text>
                <Text style={s.timelineDesc}>{milestone.description}</Text>
                {isDone && <Text style={s.timelineHOTK}>+{milestone.hotkEarned} hOTK</Text>}
                <Text style={[
                  s.timelineStatus,
                  isDone ? s.statusDone : isCurrent ? s.statusCurrent : s.statusUpcoming,
                ]}>
                  {isDone ? 'Completed' : isCurrent ? 'Current Week' : `In ${milestone.week - currentWeek} weeks`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Every prenatal checkup you complete earns hOTK.{'\n'}
          Preventive maternal care is the highest-value{'\n'}
          health contribution recognized by Open Chain.
        </Text>
      </View>
    </>
  );

  // ─── Care Tab ───

  const [careFilter, setCareFilter] = useState<string>('all');

  const filteredCare = useMemo(() => {
    if (careFilter === 'all') return DEMO_CARE_CHECKLIST;
    return DEMO_CARE_CHECKLIST.filter(c => c.category === careFilter);
  }, [careFilter]);

  const renderCare = () => (
    <>
      <Text style={s.sectionTitle}>Prenatal Care Checklist</Text>
      <Text style={[s.careMeta, { marginHorizontal: 20, marginBottom: 12 }]}>
        {completedCareItems} of {DEMO_CARE_CHECKLIST.length} completed
      </Text>

      <View style={s.categoryRow}>
        {[{ key: 'all', label: 'All' }, { key: 'vitamin', label: 'Vitamins' }, { key: 'appointment', label: 'Appointments' }, { key: 'exercise', label: 'Exercise' }, { key: 'nutrition', label: 'Nutrition' }].map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, careFilter === cat.key && s.categoryChipActive]}
            onPress={() => setCareFilter(cat.key)}
          >
            <Text style={[s.categoryChipText, careFilter === cat.key && s.categoryChipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        {filteredCare.map((item, i) => (
          <View key={item.id} style={[s.careRow, i === filteredCare.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.careIcon, { backgroundColor: item.completed ? t.accent.green + '20' : t.bg.primary }]}>
              <Text style={[s.careIconText, { color: item.completed ? t.accent.green : t.text.muted }]}>
                {CARE_ICONS[item.category] || '?'}
              </Text>
            </View>
            <View style={s.careInfo}>
              <Text style={s.careTitle}>{item.title}</Text>
              <Text style={s.careMeta}>{item.frequency}</Text>
            </View>
            <View style={s.careRight}>
              <Text style={s.careHOTK}>+{item.hotkReward} hOTK</Text>
              <Text style={[s.careStatus, { color: item.completed ? t.accent.green : t.accent.orange }]}>
                {item.completed ? 'Done' : 'Pending'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Consistent prenatal care leads to healthier outcomes{'\n'}
          for both mother and baby. Each completed item{'\n'}
          is recorded on Open Chain as health value (hOTK).
        </Text>
      </View>
    </>
  );

  // ─── Support Tab ───

  const renderSupport = () => (
    <>
      {/* Midwife/Doula Directory */}
      <Text style={s.sectionTitle}>Community Midwives & Doulas</Text>
      {DEMO_MIDWIVES.map((mw) => (
        <View key={mw.id} style={s.midwifeCard}>
          <Text style={s.midwifeName}>{mw.name}</Text>
          <Text style={s.midwifeSpecialty}>{mw.specialty}</Text>
          <View style={s.midwifeRow}>
            <Text style={s.midwifeDetail}>Rating: {mw.rating}/5</Text>
            <Text style={s.midwifeDetail}>{mw.distance}</Text>
            <Text style={s.midwifeAvailable}>{mw.available ? 'Available' : 'Booked'}</Text>
          </View>
          <Text style={s.midwifeNOTK}>nOTK earned through caregiving: {mw.nOTKEarned.toLocaleString()}</Text>
        </View>
      ))}

      {/* Postnatal Support Topics */}
      <Text style={s.sectionTitle}>Postnatal Support Resources</Text>
      {DEMO_SUPPORT.map((topic) => (
        <View key={topic.id} style={s.supportCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.supportIcon, { backgroundColor: t.accent.purple + '20' }]}>
              <Text style={[s.supportIconText, { color: t.accent.purple }]}>
                {SUPPORT_ICONS[topic.category] || '?'}
              </Text>
            </View>
            <Text style={s.supportTitle}>{topic.title}</Text>
          </View>
          <Text style={s.supportDesc}>{topic.description}</Text>
          <Text style={s.supportMeta}>
            {topic.responses} responses | {topic.helpful} found helpful
          </Text>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Midwives and doulas earn nOTK for every mother{'\n'}
          they support. Their nurturing contribution is{'\n'}
          permanently valued on Open Chain.
        </Text>
      </View>
    </>
  );

  // ─── Community Tab ───

  const renderCommunity = () => (
    <>
      <Text style={s.sectionTitle}>New Parent Community</Text>
      <Text style={[s.careMeta, { marginHorizontal: 20, marginBottom: 12 }]}>
        Peer support, questions, and shared experiences
      </Text>

      {DEMO_COMMUNITY.map((post) => (
        <View key={post.id} style={s.communityCard}>
          <Text style={s.communityAuthor}>{post.author}</Text>
          <Text style={s.communityQuestion}>{post.question}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={s.communityMeta}>{post.replies} replies | {post.date}</Text>
            <Text style={s.communityHOTK}>+{post.hotkEarned} hOTK</Text>
          </View>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Sharing your experience helps other parents.{'\n'}
          Every helpful answer earns hOTK — because{'\n'}
          community wisdom has real value.
        </Text>
      </View>

      <Text style={s.note}>
        All posts are moderated by community midwives. Medical advice should always be confirmed with your healthcare provider. Open Chain values peer support as a form of nurture (nOTK).
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Maternal Health</Text>
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
        {tab === 'journey' && renderJourney()}
        {tab === 'care' && renderCare()}
        {tab === 'support' && renderSupport()}
        {tab === 'community' && renderCommunity()}
      </ScrollView>
    </SafeAreaView>
  );
}
