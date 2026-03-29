/**
 * Yoga Screen — Community yoga, flexibility, breathing practices.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents health value — yoga practice, teaching, and mindfulness.
 *
 * Features:
 * - Yoga practice library (poses with descriptions, difficulty, benefits)
 * - Community yoga sessions (scheduled classes, instructor, level, location)
 * - Practice tracker (sessions completed, streak, hOTK earned)
 * - Breathing exercises (pranayama: alternate nostril, box, 4-7-8, kapalbhati)
 * - Yoga challenges (30-day challenge, weekly focus poses)
 * - Instructor registration (teach for hOTK)
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

interface YogaPose {
  id: string;
  name: string;
  sanskrit: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string;
  description: string;
  holdSeconds: number;
  icon: string;
}

interface YogaSession {
  id: string;
  title: string;
  instructor: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  location: string;
  dateTime: string;
  durationMin: number;
  participants: number;
  maxParticipants: number;
  hotkReward: number;
}

interface BreathingExercise {
  id: string;
  name: string;
  technique: string;
  description: string;
  durationMin: number;
  rounds: number;
  benefits: string;
  icon: string;
}

interface YogaChallenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  currentDay: number;
  participants: number;
  hotkReward: number;
  active: boolean;
}

interface PracticeStats {
  totalSessions: number;
  streakDays: number;
  bestStreak: number;
  totalHOTK: number;
  favoriteStyle: string;
  hoursLogged: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
  all: '#007AFF',
};

// ─── Demo Data ───

const DEMO_POSES: YogaPose[] = [
  { id: '1', name: 'Mountain Pose', sanskrit: 'Tadasana', difficulty: 'beginner', benefits: 'Improves posture, balance, and awareness', description: 'Stand tall with feet together, arms at sides, weight evenly distributed.', holdSeconds: 30, icon: 'M' },
  { id: '2', name: 'Downward Dog', sanskrit: 'Adho Mukha Svanasana', difficulty: 'beginner', benefits: 'Stretches hamstrings, calves, shoulders; strengthens arms', description: 'Form an inverted V-shape with hands and feet on the floor, hips lifted.', holdSeconds: 45, icon: 'D' },
  { id: '3', name: 'Warrior II', sanskrit: 'Virabhadrasana II', difficulty: 'intermediate', benefits: 'Strengthens legs, opens hips, builds endurance', description: 'Wide stance, front knee bent 90 degrees, arms extended parallel to floor.', holdSeconds: 30, icon: 'W' },
  { id: '4', name: 'Tree Pose', sanskrit: 'Vrksasana', difficulty: 'beginner', benefits: 'Improves balance, focus, and leg strength', description: 'Stand on one leg, other foot placed on inner thigh, hands in prayer or overhead.', holdSeconds: 30, icon: 'T' },
  { id: '5', name: 'Crow Pose', sanskrit: 'Bakasana', difficulty: 'advanced', benefits: 'Builds arm strength, core stability, and concentration', description: 'Balance on hands with knees resting on upper arms, feet lifted off ground.', holdSeconds: 15, icon: 'C' },
  { id: '6', name: 'Cobra Pose', sanskrit: 'Bhujangasana', difficulty: 'beginner', benefits: 'Opens chest, strengthens spine, reduces fatigue', description: 'Lie face down, press palms to lift chest while keeping hips grounded.', holdSeconds: 20, icon: 'B' },
];

const DEMO_SESSIONS: YogaSession[] = [
  { id: '1', title: 'Morning Flow', instructor: 'Ananya Sharma', level: 'all', location: 'Community Park Pavilion', dateTime: '2026-03-30T07:00', durationMin: 60, participants: 18, maxParticipants: 30, hotkReward: 300 },
  { id: '2', title: 'Restorative Evening Yoga', instructor: 'David Chen', level: 'beginner', location: 'Community Center Room B', dateTime: '2026-03-30T18:30', durationMin: 45, participants: 12, maxParticipants: 20, hotkReward: 250 },
  { id: '3', title: 'Power Vinyasa', instructor: 'Maria Garcia', level: 'advanced', location: 'Riverside Studio', dateTime: '2026-03-31T06:30', durationMin: 75, participants: 8, maxParticipants: 15, hotkReward: 400 },
];

const DEMO_BREATHING: BreathingExercise[] = [
  { id: '1', name: 'Alternate Nostril', technique: 'Nadi Shodhana', description: 'Close right nostril, inhale left. Close left, exhale right. Inhale right, close right, exhale left. One round.', durationMin: 5, rounds: 10, benefits: 'Balances nervous system, calms the mind, improves focus', icon: 'N' },
  { id: '2', name: 'Box Breathing', technique: 'Sama Vritti', description: 'Inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold 4 seconds. Repeat.', durationMin: 4, rounds: 8, benefits: 'Reduces stress, improves concentration, regulates autonomic nervous system', icon: 'B' },
  { id: '3', name: '4-7-8 Breathing', technique: 'Relaxing Breath', description: 'Inhale through nose for 4 counts, hold for 7 counts, exhale through mouth for 8 counts.', durationMin: 5, rounds: 4, benefits: 'Promotes deep relaxation, aids sleep, reduces anxiety', icon: '4' },
  { id: '4', name: 'Kapalbhati', technique: 'Skull Shining Breath', description: 'Short, forceful exhales through the nose with passive inhales. Pump the belly rhythmically.', durationMin: 3, rounds: 3, benefits: 'Energizes body, clears nasal passages, strengthens core', icon: 'K' },
];

const DEMO_CHALLENGES: YogaChallenge[] = [
  { id: '1', title: '30-Day Sunrise Yoga', description: 'Practice yoga every morning for 30 consecutive days. Build a lifelong habit.', durationDays: 30, currentDay: 14, participants: 142, hotkReward: 3000, active: true },
  { id: '2', title: 'Weekly Focus: Balance Poses', description: 'This week, master Tree, Eagle, and Dancer poses. Hold each for 30+ seconds.', durationDays: 7, currentDay: 5, participants: 67, hotkReward: 500, active: true },
];

const DEMO_STATS: PracticeStats = {
  totalSessions: 86,
  streakDays: 14,
  bestStreak: 21,
  totalHOTK: 18400,
  favoriteStyle: 'Vinyasa Flow',
  hoursLogged: 72,
};

type Tab = 'practice' | 'sessions' | 'breathing' | 'challenges';

export function YogaScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('practice');
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const [instructorStyle, setInstructorStyle] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const stats = DEMO_STATS;
  const poses = DEMO_POSES;
  const sessions = DEMO_SESSIONS;
  const breathing = DEMO_BREATHING;
  const challenges = DEMO_CHALLENGES;

  const handleJoinSession = useCallback((session: YogaSession) => {
    if (session.participants >= session.maxParticipants) {
      Alert.alert('Full', 'This session is at capacity. Check back for openings.');
      return;
    }
    Alert.alert(
      'Joined!',
      `You're registered for "${session.title}" with ${session.instructor}.\n\nLocation: ${session.location}\nReward: ${session.hotkReward} hOTK on attendance.`,
    );
  }, []);

  const handleStartBreathing = useCallback((exercise: BreathingExercise) => {
    Alert.alert(
      exercise.name,
      `${exercise.description}\n\nDuration: ~${exercise.durationMin} minutes (${exercise.rounds} rounds)\n\nBenefits: ${exercise.benefits}\n\nReward: 100 hOTK per session.`,
    );
  }, []);

  const handleJoinChallenge = useCallback((challenge: YogaChallenge) => {
    if (challenge.active) {
      Alert.alert(
        'Challenge Progress',
        `Day ${challenge.currentDay} of ${challenge.durationDays}\n\n${challenge.participants} participants.\nComplete for ${challenge.hotkReward} hOTK.`,
      );
    }
  }, []);

  const handleRegisterInstructor = useCallback(() => {
    if (!instructorName.trim()) { Alert.alert('Required', 'Enter your name.'); return; }
    if (!instructorStyle.trim()) { Alert.alert('Required', 'Describe your teaching style.'); return; }
    Alert.alert(
      'Registration Submitted',
      `Thank you, ${instructorName.trim()}!\n\nYour instructor profile is under review. You'll earn hOTK for every session you lead.\n\nStyle: ${instructorStyle.trim()}`,
    );
    setInstructorName('');
    setInstructorStyle('');
  }, [instructorName, instructorStyle]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    poseCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    poseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    poseIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    poseIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    poseName: { color: t.text.primary, fontSize: 16, fontWeight: '700', flex: 1 },
    poseSanskrit: { color: t.text.muted, fontSize: 13, fontStyle: 'italic' },
    poseDifficulty: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    poseDifficultyText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    poseDescription: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    poseBenefits: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 6 },
    poseHold: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    sessionCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sessionTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    sessionMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    sessionInstructor: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 4 },
    sessionLevel: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
    sessionLevelText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    sessionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    sessionParticipants: { color: t.text.muted, fontSize: 12 },
    sessionReward: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    breathingCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    breathingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    breathingIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    breathingIconText: { color: t.accent.blue, fontSize: 18, fontWeight: '700' },
    breathingName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    breathingTechnique: { color: t.accent.blue, fontSize: 12, fontWeight: '600' },
    breathingDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    breathingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    breathingDuration: { color: t.text.muted, fontSize: 12 },
    startBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
    startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    challengeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    challengeTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    challengeDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    challengeProgress: { marginTop: 12 },
    progressBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 6 },
    progressBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.orange },
    challengeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    challengeMetaText: { color: t.text.muted, fontSize: 12 },
    challengeReward: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    activeTag: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
    activeTagText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    instructorSection: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    instructorTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    instructorDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    streakCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    streakNumber: { color: t.accent.orange, fontSize: 56, fontWeight: '900' },
    streakLabel: { color: t.text.muted, fontSize: 14, fontWeight: '600', marginTop: 4 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'practice', label: 'Practice' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'breathing', label: 'Breathing' },
    { key: 'challenges', label: 'Challenges' },
  ];

  // ─── Practice Tab ───

  const renderPractice = () => (
    <>
      {/* Stats Overview */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0, marginBottom: 8 }]}>Your Practice</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalSessions}</Text>
            <Text style={s.statLabel}>Sessions</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{stats.totalHOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>hOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{stats.streakDays}</Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
        </View>
        <View style={[s.statRow, { marginTop: 12 }]}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.hoursLogged}</Text>
            <Text style={s.statLabel}>Hours Logged</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.bestStreak}</Text>
            <Text style={s.statLabel}>Best Streak</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { fontSize: 14 }]}>{stats.favoriteStyle}</Text>
            <Text style={s.statLabel}>Favorite</Text>
          </View>
        </View>
      </View>

      {/* Streak */}
      <View style={s.streakCard}>
        <Text style={s.streakNumber}>{stats.streakDays}</Text>
        <Text style={s.streakLabel}>Day Practice Streak</Text>
      </View>

      {/* Pose Library */}
      <Text style={s.sectionTitle}>Pose Library</Text>
      {poses.map((pose) => {
        const expanded = selectedPose === pose.id;
        return (
          <TouchableOpacity key={pose.id} style={s.poseCard} onPress={() => setSelectedPose(expanded ? null : pose.id)}>
            <View style={s.poseHeader}>
              <View style={[s.poseIcon, { backgroundColor: DIFFICULTY_COLORS[pose.difficulty] }]}>
                <Text style={s.poseIconText}>{pose.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.poseName}>{pose.name}</Text>
                <Text style={s.poseSanskrit}>{pose.sanskrit}</Text>
              </View>
              <View style={[s.poseDifficulty, { backgroundColor: DIFFICULTY_COLORS[pose.difficulty] }]}>
                <Text style={s.poseDifficultyText}>{pose.difficulty}</Text>
              </View>
            </View>
            {expanded && (
              <>
                <Text style={s.poseDescription}>{pose.description}</Text>
                <Text style={s.poseBenefits}>Benefits: {pose.benefits}</Text>
                <Text style={s.poseHold}>Hold: {pose.holdSeconds} seconds</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Yoga connects body, mind, and community.{'\n'}Every practice session earns hOTK — teach others to earn even more.
        </Text>
      </View>
    </>
  );

  // ─── Sessions Tab ───

  const renderSessions = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Community Sessions</Text>
      {sessions.map((session) => {
        const dt = new Date(session.dateTime);
        const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const full = session.participants >= session.maxParticipants;
        return (
          <View key={session.id} style={s.sessionCard}>
            <Text style={s.sessionTitle}>{session.title}</Text>
            <Text style={s.sessionInstructor}>Instructor: {session.instructor}</Text>
            <Text style={s.sessionMeta}>{dateStr} at {timeStr} | {session.durationMin} min | {session.location}</Text>
            <View style={[s.sessionLevel, { backgroundColor: DIFFICULTY_COLORS[session.level] }]}>
              <Text style={s.sessionLevelText}>{session.level}</Text>
            </View>
            <View style={s.sessionFooter}>
              <Text style={s.sessionParticipants}>{session.participants}/{session.maxParticipants} joined</Text>
              <Text style={s.sessionReward}>{session.hotkReward} hOTK</Text>
              <TouchableOpacity style={[s.joinBtn, full && { opacity: 0.5 }]} onPress={() => handleJoinSession(session)}>
                <Text style={s.joinBtnText}>{full ? 'Full' : 'Join'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Instructor Registration */}
      <View style={s.instructorSection}>
        <Text style={s.instructorTitle}>Become an Instructor</Text>
        <Text style={s.instructorDesc}>
          Share your practice with the community. Lead sessions and earn hOTK for every class you teach.
        </Text>
        <TextInput
          style={s.input}
          placeholder="Your name"
          placeholderTextColor={t.text.muted}
          value={instructorName}
          onChangeText={setInstructorName}
        />
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Your teaching style and experience"
          placeholderTextColor={t.text.muted}
          value={instructorStyle}
          onChangeText={setInstructorStyle}
          multiline
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleRegisterInstructor}>
          <Text style={s.submitText}>Register as Instructor</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Breathing Tab ───

  const renderBreathing = () => (
    <>
      <Text style={s.sectionTitle}>Pranayama Exercises</Text>
      {breathing.map((exercise) => (
        <View key={exercise.id} style={s.breathingCard}>
          <View style={s.breathingHeader}>
            <View style={s.breathingIcon}>
              <Text style={s.breathingIconText}>{exercise.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.breathingName}>{exercise.name}</Text>
              <Text style={s.breathingTechnique}>{exercise.technique}</Text>
            </View>
          </View>
          <Text style={s.breathingDesc}>{exercise.description}</Text>
          <Text style={[s.breathingDesc, { color: t.accent.green, fontWeight: '600', marginBottom: 4 }]}>
            Benefits: {exercise.benefits}
          </Text>
          <View style={s.breathingMeta}>
            <Text style={s.breathingDuration}>~{exercise.durationMin} min | {exercise.rounds} rounds</Text>
            <TouchableOpacity style={s.startBtn} onPress={() => handleStartBreathing(exercise)}>
              <Text style={s.startBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Breathwork is the bridge between body and mind.{'\n'}Consistent pranayama practice earns 100 hOTK per session.
        </Text>
      </View>
    </>
  );

  // ─── Challenges Tab ───

  const renderChallenges = () => (
    <>
      <Text style={s.sectionTitle}>Active Challenges</Text>
      {challenges.map((challenge) => {
        const progress = Math.round((challenge.currentDay / challenge.durationDays) * 100);
        return (
          <TouchableOpacity key={challenge.id} style={s.challengeCard} onPress={() => handleJoinChallenge(challenge)}>
            <Text style={s.challengeTitle}>{challenge.title}</Text>
            <Text style={s.challengeDesc}>{challenge.description}</Text>
            {challenge.active && (
              <View style={s.activeTag}>
                <Text style={s.activeTagText}>ACTIVE</Text>
              </View>
            )}
            <View style={s.challengeProgress}>
              <Text style={s.challengeMetaText}>Day {challenge.currentDay} of {challenge.durationDays}</Text>
              <View style={s.progressBarOuter}>
                <View style={[s.progressBarInner, { width: `${progress}%` }]} />
              </View>
            </View>
            <View style={s.challengeMeta}>
              <Text style={s.challengeMetaText}>{challenge.participants} participants</Text>
              <Text style={s.challengeReward}>{challenge.hotkReward} hOTK reward</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Challenges build discipline and community.{'\n'}Complete a challenge to earn bonus hOTK and unlock badges.
        </Text>
      </View>
    </>
  );

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'practice': return renderPractice();
      case 'sessions': return renderSessions();
      case 'breathing': return renderBreathing();
      case 'challenges': return renderChallenges();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Yoga</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((t) => (
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
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
