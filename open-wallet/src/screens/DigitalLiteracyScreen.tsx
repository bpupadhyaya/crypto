/**
 * Digital Literacy Screen — Art IX of the Human Constitution.
 *
 * Digital literacy education for all ages, making technology accessible.
 * Structured learning paths from basic phone usage to blockchain privacy,
 * with community tutors who earn eOTK for teaching others.
 *
 * "Every human being shall have access to the knowledge and tools
 *  needed to participate fully in the digital age."
 * — Human Constitution, Article IX
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
type AgeTrack = 'Children' | 'Adults' | 'Seniors';
type Tab = 'learn' | 'safety' | 'tutors' | 'progress';

interface LessonModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: SkillLevel;
  ageTrack: AgeTrack[];
  completed: boolean;
  steps: number;
  stepsCompleted: number;
  eOTKReward: number;
}

interface InteractiveTutorial {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: string[];
  level: SkillLevel;
  estimatedMinutes: number;
}

interface SafetyTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  tips: string[];
  severity: 'critical' | 'important' | 'good-to-know';
}

interface CommunityTutor {
  id: string;
  name: string;
  uid: string;
  specialties: string[];
  eOTKEarned: number;
  studentsHelped: number;
  rating: number;
  available: boolean;
  ageTracksServed: AgeTrack[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

/* ── demo data ── */

const DEMO_LESSONS: LessonModule[] = [
  // Beginner
  { id: 'b1', title: 'Using Your Phone', description: 'Turn on, navigate home screen, make calls', icon: '\u{1F4F1}', level: 'Beginner', ageTrack: ['Adults', 'Seniors'], completed: true, steps: 5, stepsCompleted: 5, eOTKReward: 20 },
  { id: 'b2', title: 'Touchscreen Basics', description: 'Tap, swipe, pinch, scroll gestures', icon: '\u{1F446}', level: 'Beginner', ageTrack: ['Seniors'], completed: true, steps: 4, stepsCompleted: 4, eOTKReward: 15 },
  { id: 'b3', title: 'Taking Photos & Videos', description: 'Camera app, sharing, storage', icon: '\u{1F4F7}', level: 'Beginner', ageTrack: ['Children', 'Adults', 'Seniors'], completed: true, steps: 4, stepsCompleted: 4, eOTKReward: 15 },
  { id: 'b4', title: 'Sending Messages', description: 'Text, voice messages, group chats', icon: '\u{1F4AC}', level: 'Beginner', ageTrack: ['Adults', 'Seniors'], completed: false, steps: 5, stepsCompleted: 3, eOTKReward: 20 },
  // Intermediate
  { id: 'i1', title: 'Internet & Browsing', description: 'Web browsers, search engines, bookmarks', icon: '\u{1F310}', level: 'Intermediate', ageTrack: ['Adults', 'Seniors'], completed: true, steps: 6, stepsCompleted: 6, eOTKReward: 30 },
  { id: 'i2', title: 'Installing & Using Apps', description: 'App stores, permissions, updates', icon: '\u{1F4E6}', level: 'Intermediate', ageTrack: ['Adults', 'Seniors'], completed: true, steps: 5, stepsCompleted: 5, eOTKReward: 25 },
  { id: 'i3', title: 'Email Essentials', description: 'Compose, reply, attachments, folders', icon: '\u{1F4E7}', level: 'Intermediate', ageTrack: ['Adults', 'Seniors'], completed: false, steps: 5, stepsCompleted: 3, eOTKReward: 25 },
  { id: 'i4', title: 'Social Media Safety', description: 'Privacy settings, sharing wisely, reporting', icon: '\u{1F465}', level: 'Intermediate', ageTrack: ['Children', 'Adults'], completed: false, steps: 6, stepsCompleted: 2, eOTKReward: 30 },
  { id: 'i5', title: 'Online Shopping', description: 'Safe purchases, payment methods, returns', icon: '\u{1F6D2}', level: 'Intermediate', ageTrack: ['Adults', 'Seniors'], completed: false, steps: 5, stepsCompleted: 0, eOTKReward: 25 },
  // Advanced
  { id: 'a1', title: 'Blockchain Basics', description: 'What is blockchain, wallets, transactions', icon: '\u{26D3}\u{FE0F}', level: 'Advanced', ageTrack: ['Adults'], completed: false, steps: 8, stepsCompleted: 3, eOTKReward: 50 },
  { id: 'a2', title: 'Privacy & Encryption', description: 'End-to-end encryption, VPNs, data rights', icon: '\u{1F512}', level: 'Advanced', ageTrack: ['Adults'], completed: false, steps: 7, stepsCompleted: 0, eOTKReward: 45 },
  { id: 'a3', title: 'Digital Identity', description: 'Self-sovereign identity, Universal ID, credentials', icon: '\u{1FAAA}', level: 'Advanced', ageTrack: ['Adults'], completed: false, steps: 6, stepsCompleted: 0, eOTKReward: 40 },
  { id: 'a4', title: 'Smart Contracts', description: 'Automated agreements, governance, voting', icon: '\u{1F4DC}', level: 'Advanced', ageTrack: ['Adults'], completed: false, steps: 8, stepsCompleted: 0, eOTKReward: 50 },
];

const DEMO_TUTORIALS: InteractiveTutorial[] = [
  { id: 't1', title: 'Set Up Your First Email', description: 'Step-by-step guide to creating a Gmail account', icon: '\u{1F4E7}', steps: ['Open browser', 'Go to gmail.com', 'Click Create Account', 'Fill in your details', 'Verify phone number', 'Start using email'], level: 'Beginner', estimatedMinutes: 15 },
  { id: 't2', title: 'Install Open Wallet', description: 'Download and set up your digital wallet', icon: '\u{1F4B3}', steps: ['Open app store', 'Search for Open Wallet', 'Tap Install', 'Open the app', 'Create your wallet', 'Write down seed phrase', 'Verify seed phrase'], level: 'Intermediate', estimatedMinutes: 20 },
  { id: 't3', title: 'Spot a Phishing Email', description: 'Learn to identify scam emails before clicking', icon: '\u{1F6A8}', steps: ['Check the sender address', 'Look for urgency language', 'Hover over links (don\'t click)', 'Check for spelling errors', 'When in doubt, verify directly'], level: 'Beginner', estimatedMinutes: 10 },
  { id: 't4', title: 'Create a Strong Password', description: 'Build passwords that protect your accounts', icon: '\u{1F511}', steps: ['Use 12+ characters', 'Mix uppercase, lowercase, numbers', 'Add special characters', 'Never reuse passwords', 'Use a password manager', 'Enable two-factor auth'], level: 'Beginner', estimatedMinutes: 10 },
];

const DEMO_SAFETY: SafetyTopic[] = [
  {
    id: 's1', title: 'Phishing & Scam Detection', description: 'Recognize and avoid online scams',
    icon: '\u{1F3A3}', severity: 'critical',
    tips: ['Never click links from unknown senders', 'Banks never ask for passwords via email', 'Check URLs carefully for misspellings', 'If it sounds too good to be true, it is', 'When in doubt, call the organization directly'],
  },
  {
    id: 's2', title: 'Password Management', description: 'Create and manage strong passwords',
    icon: '\u{1F511}', severity: 'critical',
    tips: ['Use unique passwords for every account', 'Use a password manager (Bitwarden, etc.)', 'Enable two-factor authentication everywhere', 'Never share passwords over text or email', 'Change passwords if a breach is reported'],
  },
  {
    id: 's3', title: 'Privacy Basics', description: 'Control who sees your data',
    icon: '\u{1F6E1}\u{FE0F}', severity: 'important',
    tips: ['Review app permissions regularly', 'Limit location sharing to when needed', 'Use private browsing for sensitive searches', 'Read privacy policies before signing up', 'Opt out of data collection when possible'],
  },
  {
    id: 's4', title: 'Safe Online Shopping', description: 'Protect yourself when buying online',
    icon: '\u{1F6D2}', severity: 'important',
    tips: ['Only buy from HTTPS websites (lock icon)', 'Use credit cards, not debit for online purchases', 'Check seller reviews before buying', 'Save receipts and confirmation emails', 'Monitor bank statements for unknown charges'],
  },
  {
    id: 's5', title: 'Social Media Safety', description: 'Share wisely and protect your identity',
    icon: '\u{1F4F1}', severity: 'good-to-know',
    tips: ['Set profiles to private by default', 'Think before posting — the internet is forever', 'Don\'t share location in real-time', 'Be cautious of friend requests from strangers', 'Report harassment and block toxic accounts'],
  },
];

const DEMO_TUTORS: CommunityTutor[] = [
  { id: 'tu1', name: 'Maria Santos', uid: 'uid-tutor-001', specialties: ['Beginner Phone Skills', 'Email', 'Social Media'], eOTKEarned: 480, studentsHelped: 32, rating: 4.9, available: true, ageTracksServed: ['Seniors', 'Adults'] },
  { id: 'tu2', name: 'James Okonkwo', uid: 'uid-tutor-002', specialties: ['Blockchain', 'Privacy', 'Passwords'], eOTKEarned: 720, studentsHelped: 45, rating: 4.8, available: true, ageTracksServed: ['Adults'] },
  { id: 'tu3', name: 'Priya Sharma', uid: 'uid-tutor-003', specialties: ['Children\'s Digital Safety', 'Coding Basics'], eOTKEarned: 350, studentsHelped: 28, rating: 4.7, available: false, ageTracksServed: ['Children'] },
  { id: 'tu4', name: 'Chen Wei', uid: 'uid-tutor-004', specialties: ['Smart Contracts', 'Digital Identity'], eOTKEarned: 560, studentsHelped: 19, rating: 4.9, available: false, ageTracksServed: ['Adults'] },
];

const DEMO_BADGES: Badge[] = [
  { id: 'bg1', name: 'First Steps', icon: '\u{1F463}', description: 'Complete your first lesson', earned: true, earnedDate: '2026-01-15' },
  { id: 'bg2', name: 'Safety First', icon: '\u{1F6E1}\u{FE0F}', description: 'Complete all safety topics', earned: true, earnedDate: '2026-02-10' },
  { id: 'bg3', name: 'Connected', icon: '\u{1F310}', description: 'Complete intermediate internet lessons', earned: true, earnedDate: '2026-03-01' },
  { id: 'bg4', name: 'Chain Explorer', icon: '\u{26D3}\u{FE0F}', description: 'Start blockchain basics', earned: false },
  { id: 'bg5', name: 'Privacy Guardian', icon: '\u{1F512}', description: 'Complete privacy & encryption', earned: false },
  { id: 'bg6', name: 'Digital Mentor', icon: '\u{1F91D}', description: 'Help 5 others learn', earned: false },
  { id: 'bg7', name: 'Master Learner', icon: '\u{1F393}', description: 'Complete all lesson modules', earned: false },
];

const LEVEL_COLORS: Record<SkillLevel, string> = {
  Beginner: '#22c55e',
  Intermediate: '#3b82f6',
  Advanced: '#8b5cf6',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  important: '#f97316',
  'good-to-know': '#3b82f6',
};

export function DigitalLiteracyScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('Intermediate');
  const [selectedAgeTrack, setSelectedAgeTrack] = useState<AgeTrack | null>(null);
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
  const [expandedSafety, setExpandedSafety] = useState<string | null>(null);

  /* ── computed ── */

  const filteredLessons = useMemo(() => {
    return DEMO_LESSONS.filter((l) => {
      const levelMatch = l.level === selectedLevel;
      const ageMatch = !selectedAgeTrack || l.ageTrack.includes(selectedAgeTrack);
      return levelMatch && ageMatch;
    });
  }, [selectedLevel, selectedAgeTrack]);

  const overallProgress = useMemo(() => {
    const total = DEMO_LESSONS.length;
    const completed = DEMO_LESSONS.filter((l) => l.completed).length;
    const partial = DEMO_LESSONS.filter((l) => !l.completed && l.stepsCompleted > 0).length;
    const totalSteps = DEMO_LESSONS.reduce((s, l) => s + l.steps, 0);
    const completedSteps = DEMO_LESSONS.reduce((s, l) => s + l.stepsCompleted, 0);
    const pct = Math.round((completedSteps / totalSteps) * 100);
    const earnedEOTK = DEMO_LESSONS.filter((l) => l.completed).reduce((s, l) => s + l.eOTKReward, 0);
    return { total, completed, partial, pct, earnedEOTK, totalSteps, completedSteps };
  }, []);

  const badgesEarned = useMemo(() => DEMO_BADGES.filter((b) => b.earned).length, []);
  const availableTutors = useMemo(() => DEMO_TUTORS.filter((tu) => tu.available).length, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroQuote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '600' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    sublabel: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    muted: { color: t.text.muted, fontSize: 11 },
    eotk: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Level selector
    levelRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    levelChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 2, borderColor: t.border },
    levelChipActive: { borderWidth: 2 },
    levelChipText: { fontSize: 12, fontWeight: '700' },
    // Age track
    ageRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    ageChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    ageChipActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '20' },
    ageChipText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    ageChipTextActive: { color: t.accent.blue },
    // Lesson card
    lessonCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    lessonHeader: { flexDirection: 'row', alignItems: 'center' },
    lessonIcon: { fontSize: 28, marginRight: 12 },
    lessonInfo: { flex: 1 },
    lessonTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    lessonDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 10 },
    progressFill: { height: 6, borderRadius: 3 },
    progressText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    completedBadge: { color: t.accent.green, fontSize: 11, fontWeight: '700', marginTop: 4 },
    // Tutorials
    tutorialCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    tutorialHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tutorialIcon: { fontSize: 28, marginRight: 12 },
    tutorialTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 },
    tutorialMeta: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    stepItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingLeft: 8 },
    stepNumber: { color: t.accent.blue, fontSize: 14, fontWeight: '800', marginRight: 10, width: 22 },
    stepText: { color: t.text.secondary, fontSize: 13, flex: 1 },
    expandArrow: { color: t.text.muted, fontSize: 16 },
    // Safety
    safetyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    safetyHeader: { flexDirection: 'row', alignItems: 'center' },
    safetyIcon: { fontSize: 28, marginRight: 12 },
    safetyTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 },
    safetyDesc: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    severityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
    severityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    tipItem: { flexDirection: 'row', paddingVertical: 6, paddingLeft: 8 },
    tipBullet: { color: t.accent.blue, fontSize: 14, marginRight: 8 },
    tipText: { color: t.text.secondary, fontSize: 13, flex: 1, lineHeight: 18 },
    // Tutors
    tutorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    tutorName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    tutorUid: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tutorSpecialties: { color: t.text.secondary, fontSize: 12, marginTop: 6 },
    tutorStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    tutorStat: { alignItems: 'center' },
    tutorStatValue: { color: t.text.primary, fontSize: 16, fontWeight: '800' },
    tutorStatLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    availableTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    availableText: { fontSize: 11, fontWeight: '700' },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    connectBtnText: { color: t.bg.primary, fontSize: 14, fontWeight: '700' },
    // Progress / Badges
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    badgeItem: { width: 80, alignItems: 'center', padding: 8 },
    badgeIcon: { fontSize: 36, marginBottom: 4 },
    badgeName: { color: t.text.primary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
    badgeDate: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    badgeLocked: { opacity: 0.35 },
    overallCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    overallTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
    bigProgress: { height: 10, backgroundColor: t.border, borderRadius: 5, marginVertical: 8 },
    bigProgressFill: { height: 10, borderRadius: 5, backgroundColor: t.accent.blue },
    bigProgressText: { color: t.text.primary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
    bigProgressLabel: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },
    levelProgress: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    levelName: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    levelDetail: { color: t.text.muted, fontSize: 12, marginTop: 4 },
  }), [t]);

  /* ── tab renderers ── */

  const renderLearn = () => {
    const levels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
    const ageTracks: AgeTrack[] = ['Children', 'Adults', 'Seniors'];
    const levelDescriptions: Record<SkillLevel, string> = {
      Beginner: 'Use a phone, make calls, take photos',
      Intermediate: 'Internet, apps, email, social media',
      Advanced: 'Blockchain, privacy, digital identity',
    };

    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Skill Level</Text>
        <View style={s.levelRow}>
          {levels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[s.levelChip, selectedLevel === level && [s.levelChipActive, { borderColor: LEVEL_COLORS[level] }]]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[s.levelChipText, { color: selectedLevel === level ? LEVEL_COLORS[level] : t.text.secondary }]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[s.muted, { textAlign: 'center', marginBottom: 12, marginTop: -4 }]}>
          {levelDescriptions[selectedLevel]}
        </Text>

        <Text style={s.sectionTitle}>Age Track</Text>
        <View style={s.ageRow}>
          <TouchableOpacity
            style={[s.ageChip, !selectedAgeTrack && s.ageChipActive]}
            onPress={() => setSelectedAgeTrack(null)}
          >
            <Text style={[s.ageChipText, !selectedAgeTrack && s.ageChipTextActive]}>All Ages</Text>
          </TouchableOpacity>
          {ageTracks.map((track) => (
            <TouchableOpacity
              key={track}
              style={[s.ageChip, selectedAgeTrack === track && s.ageChipActive]}
              onPress={() => setSelectedAgeTrack(selectedAgeTrack === track ? null : track)}
            >
              <Text style={[s.ageChipText, selectedAgeTrack === track && s.ageChipTextActive]}>{track}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Lessons ({filteredLessons.length})</Text>
        {filteredLessons.map((lesson) => {
          const pct = Math.round((lesson.stepsCompleted / lesson.steps) * 100);
          return (
            <View key={lesson.id} style={[s.lessonCard, { borderLeftColor: LEVEL_COLORS[lesson.level] }]}>
              <View style={s.lessonHeader}>
                <Text style={s.lessonIcon}>{lesson.icon}</Text>
                <View style={s.lessonInfo}>
                  <Text style={s.lessonTitle}>{lesson.title}</Text>
                  <Text style={s.lessonDesc}>{lesson.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {lesson.ageTrack.map((at) => (
                      <Text key={at} style={[s.muted, { backgroundColor: t.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }]}>{at}</Text>
                    ))}
                  </View>
                </View>
                <Text style={s.eotk}>+{lesson.eOTKReward}</Text>
              </View>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: LEVEL_COLORS[lesson.level] }]} />
              </View>
              {lesson.completed ? (
                <Text style={s.completedBadge}>COMPLETED</Text>
              ) : (
                <Text style={s.progressText}>{lesson.stepsCompleted}/{lesson.steps} steps ({pct}%)</Text>
              )}
            </View>
          );
        })}

        {/* Interactive Tutorials */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Interactive Tutorials</Text>
        {DEMO_TUTORIALS.map((tut) => (
          <View key={tut.id} style={s.tutorialCard}>
            <TouchableOpacity
              style={s.tutorialHeader}
              onPress={() => setExpandedTutorial(expandedTutorial === tut.id ? null : tut.id)}
            >
              <Text style={s.tutorialIcon}>{tut.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tutorialTitle}>{tut.title}</Text>
                <Text style={s.tutorialMeta}>{tut.steps.length} steps \u00B7 ~{tut.estimatedMinutes} min \u00B7 {tut.level}</Text>
              </View>
              <Text style={s.expandArrow}>{expandedTutorial === tut.id ? '\u25B2' : '\u25BC'}</Text>
            </TouchableOpacity>
            {expandedTutorial === tut.id && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.sublabel}>{tut.description}</Text>
                {tut.steps.map((step, idx) => (
                  <View key={idx} style={s.stepItem}>
                    <Text style={s.stepNumber}>{idx + 1}.</Text>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[s.connectBtn, { marginTop: 12 }]}
                  onPress={() => Alert.alert('Tutorial (Demo)', `In production, this would launch an interactive walkthrough for "${tut.title}".`)}
                >
                  <Text style={s.connectBtnText}>Start Tutorial</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSafety = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Digital Safety Essentials</Text>
      <Text style={[s.sublabel, { marginBottom: 16, lineHeight: 18 }]}>
        Protect yourself and your family online. These skills are critical for everyone, regardless of technical experience.
      </Text>

      {DEMO_SAFETY.map((topic) => (
        <View key={topic.id} style={[s.safetyCard, { borderLeftColor: SEVERITY_COLORS[topic.severity] }]}>
          <TouchableOpacity
            style={s.safetyHeader}
            onPress={() => setExpandedSafety(expandedSafety === topic.id ? null : topic.id)}
          >
            <Text style={s.safetyIcon}>{topic.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.safetyTitle}>{topic.title}</Text>
              <Text style={s.safetyDesc}>{topic.description}</Text>
              <View style={[s.severityTag, { backgroundColor: SEVERITY_COLORS[topic.severity] + '20' }]}>
                <Text style={[s.severityText, { color: SEVERITY_COLORS[topic.severity] }]}>{topic.severity}</Text>
              </View>
            </View>
            <Text style={s.expandArrow}>{expandedSafety === topic.id ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {expandedSafety === topic.id && (
            <View style={{ marginTop: 12 }}>
              {topic.tips.map((tip, idx) => (
                <View key={idx} style={s.tipItem}>
                  <Text style={s.tipBullet}>{'\u2022'}</Text>
                  <Text style={s.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderTutors = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Community Tutors</Text>
      <Text style={[s.sublabel, { marginBottom: 16, lineHeight: 18 }]}>
        Volunteers who help others learn digital skills. Tutors earn eOTK for every person they help — knowledge shared is value created.
      </Text>

      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_TUTORS.length}</Text>
            <Text style={s.statLabel}>Total Tutors</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{availableTutors}</Text>
            <Text style={s.statLabel}>Available Now</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_TUTORS.reduce((sum, tu) => sum + tu.studentsHelped, 0)}</Text>
            <Text style={s.statLabel}>Students Helped</Text>
          </View>
        </View>
      </View>

      {DEMO_TUTORS.map((tutor) => (
        <View key={tutor.id} style={s.tutorCard}>
          <View style={s.row}>
            <View>
              <Text style={s.tutorName}>{tutor.name}</Text>
              <Text style={s.tutorUid}>{tutor.uid}</Text>
            </View>
            <View style={[s.availableTag, { backgroundColor: tutor.available ? t.accent.green + '20' : t.border }]}>
              <Text style={[s.availableText, { color: tutor.available ? t.accent.green : t.text.muted }]}>
                {tutor.available ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          <Text style={s.tutorSpecialties}>{tutor.specialties.join(' \u00B7 ')}</Text>
          <Text style={[s.muted, { marginTop: 4 }]}>Serves: {tutor.ageTracksServed.join(', ')}</Text>
          <View style={s.tutorStats}>
            <View style={s.tutorStat}>
              <Text style={s.tutorStatValue}>{tutor.studentsHelped}</Text>
              <Text style={s.tutorStatLabel}>Students</Text>
            </View>
            <View style={s.tutorStat}>
              <Text style={[s.tutorStatValue, { color: t.accent.green }]}>{tutor.eOTKEarned}</Text>
              <Text style={s.tutorStatLabel}>eOTK Earned</Text>
            </View>
            <View style={s.tutorStat}>
              <Text style={[s.tutorStatValue, { color: t.accent.orange }]}>{tutor.rating}</Text>
              <Text style={s.tutorStatLabel}>Rating</Text>
            </View>
          </View>
          {tutor.available && (
            <TouchableOpacity
              style={s.connectBtn}
              onPress={() => Alert.alert('Connect (Demo)', `In production, you would be connected with ${tutor.name} for a tutoring session. Tutors earn eOTK for helping you learn.`)}
            >
              <Text style={s.connectBtnText}>Request Tutoring Session</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[s.connectBtn, { backgroundColor: t.accent.green, marginTop: 4 }]}
        onPress={() => Alert.alert('Become a Tutor (Demo)', 'In production, you can register as a community tutor and earn eOTK by helping others learn digital skills. Anyone can teach what they know.')}
      >
        <Text style={s.connectBtnText}>Become a Tutor — Earn eOTK</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => {
    const levelGroups: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>My Progress</Text>

        {/* Overall progress */}
        <View style={s.overallCard}>
          <Text style={s.overallTitle}>Overall Completion</Text>
          <Text style={s.bigProgressText}>{overallProgress.pct}%</Text>
          <Text style={s.bigProgressLabel}>{overallProgress.completedSteps} of {overallProgress.totalSteps} steps completed</Text>
          <View style={s.bigProgress}>
            <View style={[s.bigProgressFill, { width: `${overallProgress.pct}%` }]} />
          </View>
          <View style={[s.statRow, { marginTop: 16 }]}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{overallProgress.completed}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.orange }]}>{overallProgress.partial}</Text>
              <Text style={s.statLabel}>In Progress</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{overallProgress.earnedEOTK}</Text>
              <Text style={s.statLabel}>eOTK Earned</Text>
            </View>
          </View>
        </View>

        {/* Per-level breakdown */}
        <Text style={s.sectionTitle}>By Level</Text>
        {levelGroups.map((level) => {
          const lessons = DEMO_LESSONS.filter((l) => l.level === level);
          const done = lessons.filter((l) => l.completed).length;
          const pct = Math.round((done / lessons.length) * 100);
          return (
            <View key={level} style={s.levelProgress}>
              <View style={s.row}>
                <Text style={[s.levelName, { color: LEVEL_COLORS[level] }]}>{level}</Text>
                <Text style={[s.label, { color: LEVEL_COLORS[level] }]}>{done}/{lessons.length}</Text>
              </View>
              <View style={[s.progressBar, { marginTop: 8 }]}>
                <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: LEVEL_COLORS[level] }]} />
              </View>
              <Text style={s.levelDetail}>{pct}% complete</Text>
            </View>
          );
        })}

        {/* Badges */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Badges Earned ({badgesEarned}/{DEMO_BADGES.length})</Text>
        <View style={s.badgeGrid}>
          {DEMO_BADGES.map((badge) => (
            <View key={badge.id} style={[s.badgeItem, !badge.earned && s.badgeLocked]}>
              <Text style={s.badgeIcon}>{badge.icon}</Text>
              <Text style={s.badgeName}>{badge.name}</Text>
              {badge.earned && badge.earnedDate ? (
                <Text style={s.badgeDate}>{badge.earnedDate}</Text>
              ) : (
                <Text style={s.badgeDate}>Locked</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  /* ── main render ── */

  const tabs: { key: Tab; label: string }[] = [
    { key: 'learn', label: 'Learn' },
    { key: 'safety', label: 'Safety' },
    { key: 'tutors', label: 'Tutors' },
    { key: 'progress', label: 'Progress' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Digital Literacy</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4BB}'}</Text>
          <Text style={s.heroTitle}>Technology for Everyone</Text>
          <Text style={s.heroQuote}>
            "Every human being shall have access to the knowledge and tools needed to participate fully in the digital age."
            {'\n'}— Human Constitution, Article IX
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Intermediate Level, 60% Complete</Text>
        </View>

        {/* Quick stats strip */}
        <View style={[s.card, { marginHorizontal: 20, marginTop: 12 }]}>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.blue }]}>{overallProgress.pct}%</Text>
              <Text style={s.statLabel}>Progress</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{badgesEarned}</Text>
              <Text style={s.statLabel}>Badges</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.purple }]}>{availableTutors}</Text>
              <Text style={s.statLabel}>Tutors</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{overallProgress.earnedEOTK}</Text>
              <Text style={s.statLabel}>eOTK</Text>
            </View>
          </View>
        </View>

        <View style={s.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'learn' && renderLearn()}
        {activeTab === 'safety' && renderSafety()}
        {activeTab === 'tutors' && renderTutors()}
        {activeTab === 'progress' && renderProgress()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
