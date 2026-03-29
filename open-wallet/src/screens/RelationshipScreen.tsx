/**
 * Relationship Screen — Couple/relationship wellness, communication tools.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * nOTK represents nurture value — healthy relationships are the foundation
 * of strong families and communities.
 *
 * Features:
 * - Relationship check-in (1-5 scale per dimension)
 * - Date ideas generator (local, home, adventure)
 * - Communication exercises (active listening, appreciation, conflict resolution)
 * - Shared goals tracker (financial, family, travel, health)
 * - Anniversary/milestone reminders
 * - Relationship resources (books, workshops, counselors)
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

interface CheckInDimension {
  key: string;
  label: string;
  icon: string;
  score: number; // 1-5
  description: string;
}

interface SharedGoal {
  id: string;
  category: string;
  title: string;
  progress: number; // 0-100
  targetDate: string;
  notes: string;
}

interface DateIdea {
  id: string;
  type: 'local' | 'home' | 'adventure';
  title: string;
  description: string;
  cost: string;
  duration: string;
}

interface CommunicationExercise {
  id: string;
  type: 'listening' | 'appreciation' | 'resolution';
  title: string;
  prompt: string;
  duration: string;
}

interface RelationshipResource {
  id: string;
  type: 'book' | 'workshop' | 'counselor';
  title: string;
  author: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CHECK_IN_DIMENSIONS: CheckInDimension[] = [
  { key: 'communication', label: 'Communication', icon: 'C', score: 4, description: 'How well we listen and express ourselves' },
  { key: 'trust', label: 'Trust', icon: 'T', score: 5, description: 'Feeling safe, reliable, and honest' },
  { key: 'intimacy', label: 'Intimacy', icon: 'I', score: 4, description: 'Emotional and physical closeness' },
  { key: 'shared_goals', label: 'Shared Goals', icon: 'G', score: 3, description: 'Alignment on future plans' },
  { key: 'fun', label: 'Fun', icon: 'F', score: 4, description: 'Joy, laughter, and play together' },
];

const GOAL_CATEGORIES = [
  { key: 'financial', label: 'Financial', icon: '$' },
  { key: 'family', label: 'Family', icon: 'F' },
  { key: 'travel', label: 'Travel', icon: 'T' },
  { key: 'health', label: 'Health', icon: 'H' },
];

// ─── Demo Data ───

const DEMO_SCORE = 82;

const DEMO_GOALS: SharedGoal[] = [
  { id: '1', category: 'financial', title: 'Emergency fund — 6 months', progress: 68, targetDate: '2026-12-31', notes: 'Currently at 4.1 months saved' },
  { id: '2', category: 'travel', title: 'Anniversary trip to Japan', progress: 45, targetDate: '2026-09-15', notes: 'Flights booked, planning itinerary' },
  { id: '3', category: 'health', title: 'Run a half marathon together', progress: 30, targetDate: '2026-11-01', notes: 'Training plan started, up to 8K' },
  { id: '4', category: 'family', title: 'Weekly family dinner tradition', progress: 85, targetDate: '2026-06-01', notes: '6 consecutive weeks so far' },
];

const DEMO_DATE_IDEAS: DateIdea[] = [
  { id: '1', type: 'local', title: 'Farmers Market Morning', description: 'Explore the weekend farmers market, pick fresh ingredients, and cook a meal together.', cost: 'Low', duration: '2-3 hours' },
  { id: '2', type: 'home', title: 'Stargazing Blanket Fort', description: 'Set up blankets on the balcony or yard, find constellations, share dreams.', cost: 'Free', duration: '1-2 hours' },
  { id: '3', type: 'adventure', title: 'Sunrise Hike', description: 'Wake up early, hike to a scenic viewpoint, watch the sunrise together.', cost: 'Free', duration: '3-4 hours' },
];

const DEMO_EXERCISES: CommunicationExercise[] = [
  { id: '1', type: 'listening', title: 'The 5-Minute Uninterrupted Share', prompt: 'Set a timer for 5 minutes. One person shares how their week went — the other listens without interrupting. Then switch. End by each saying one thing you appreciated hearing.', duration: '12 min' },
  { id: '2', type: 'appreciation', title: 'Three Things I Noticed', prompt: 'Each person shares three specific things they noticed their partner did this week that they appreciated. Be specific: "I noticed you made coffee before I woke up on Tuesday."', duration: '10 min' },
];

const DEMO_RESOURCES: RelationshipResource[] = [
  { id: '1', type: 'book', title: 'The Seven Principles for Making Marriage Work', author: 'John Gottman', description: 'Research-based strategies for building a strong partnership.' },
  { id: '2', type: 'book', title: 'Hold Me Tight', author: 'Sue Johnson', description: 'Understanding attachment bonds and emotional responsiveness.' },
  { id: '3', type: 'workshop', title: 'Gottman Method Couples Workshop', author: 'The Gottman Institute', description: 'Weekend workshop for strengthening your relationship foundation.' },
  { id: '4', type: 'counselor', title: 'Find a Licensed Couples Therapist', author: 'Psychology Today Directory', description: 'Search for certified relationship counselors in your area.' },
];

type Tab = 'check-in' | 'goals' | 'dates' | 'resources';

export function RelationshipScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('check-in');
  const [dimensions, setDimensions] = useState<CheckInDimension[]>(CHECK_IN_DIMENSIONS);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const relationshipScore = useMemo(() => {
    const total = dimensions.reduce((sum, d) => sum + d.score, 0);
    return Math.round((total / (dimensions.length * 5)) * 100);
  }, [dimensions]);

  const handleScoreChange = useCallback((key: string, newScore: number) => {
    setDimensions((prev) =>
      prev.map((d) => d.key === key ? { ...d, score: newScore } : d)
    );
  }, []);

  const handleAddGoal = useCallback(() => {
    if (!newGoalCategory) { Alert.alert('Required', 'Select a goal category.'); return; }
    if (!newGoalTitle.trim()) { Alert.alert('Required', 'Enter a goal title.'); return; }
    Alert.alert('Goal Added', `"${newGoalTitle}" has been added to your shared goals.`);
    setNewGoalTitle('');
    setNewGoalCategory('');
  }, [newGoalCategory, newGoalTitle]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    scoreHeader: { alignItems: 'center', marginBottom: 16 },
    scoreText: { color: t.text.primary, fontSize: 48, fontWeight: '900', marginTop: 4 },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    scoreBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, width: '100%' },
    scoreBarInner: { height: 8, borderRadius: 4 },
    dimensionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    dimensionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.purple + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    dimensionIconText: { color: t.accent.purple, fontSize: 14, fontWeight: '700' },
    dimensionInfo: { flex: 1 },
    dimensionLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    dimensionDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    scoreButtons: { flexDirection: 'row', gap: 4 },
    scoreBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg.primary },
    scoreBtnActive: { backgroundColor: t.accent.purple },
    scoreBtnText: { color: t.text.muted, fontSize: 12, fontWeight: '700' },
    scoreBtnTextActive: { color: '#fff' },
    goalRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    goalProgress: { color: t.accent.purple, fontSize: 14, fontWeight: '700' },
    goalBarOuter: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8 },
    goalBarInner: { height: 6, borderRadius: 3, backgroundColor: t.accent.purple },
    goalMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    goalCategoryTag: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
    goalCategoryText: { color: t.accent.purple, fontSize: 11, fontWeight: '600' },
    dateCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    dateTypeTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
    dateTypeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    dateTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    dateDesc: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginBottom: 8 },
    dateMeta: { flexDirection: 'row', gap: 16 },
    dateMetaText: { color: t.text.secondary, fontSize: 12 },
    exerciseCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    exerciseTypeTag: { alignSelf: 'flex-start', backgroundColor: t.accent.blue + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
    exerciseTypeText: { color: t.accent.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    exerciseTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
    exercisePrompt: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginBottom: 8 },
    exerciseDuration: { color: t.text.secondary, fontSize: 12 },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resourceTypeTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
    resourceTypeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    resourceTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
    resourceAuthor: { color: t.text.secondary, fontSize: 13, marginBottom: 6 },
    resourceDesc: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    typeChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    educationCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const getDateTypeColor = (type: string) => {
    switch (type) {
      case 'local': return t.accent.blue;
      case 'home': return t.accent.green;
      case 'adventure': return t.accent.orange;
      default: return t.accent.purple;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'book': return t.accent.blue;
      case 'workshop': return t.accent.green;
      case 'counselor': return t.accent.purple;
      default: return t.accent.orange;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return t.accent.green;
    if (score >= 60) return t.accent.blue;
    if (score >= 40) return t.accent.orange;
    return t.accent.red || '#FF3B30';
  };

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'check-in', label: 'Check-In' },
    { key: 'goals', label: 'Goals' },
    { key: 'dates', label: 'Date Ideas' },
    { key: 'resources', label: 'Resources' },
  ];

  // ─── Check-In Tab ───

  const renderCheckIn = () => (
    <>
      <View style={s.card}>
        <View style={s.scoreHeader}>
          <Text style={s.scoreLabel}>Relationship Score</Text>
          <Text style={s.scoreText}>{demoMode ? DEMO_SCORE : relationshipScore}</Text>
          <View style={s.scoreBarOuter}>
            <View style={[s.scoreBarInner, {
              width: `${demoMode ? DEMO_SCORE : relationshipScore}%`,
              backgroundColor: getScoreColor(demoMode ? DEMO_SCORE : relationshipScore),
            }]} />
          </View>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_GOALS.length}</Text>
            <Text style={s.statLabel}>Shared Goals</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{DEMO_DATE_IDEAS.length}</Text>
            <Text style={s.statLabel}>Date Ideas</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_EXERCISES.length}</Text>
            <Text style={s.statLabel}>Exercises</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>How Are We Doing?</Text>
      <View style={s.card}>
        {dimensions.map((dim, idx) => (
          <View key={dim.key} style={[s.dimensionRow, idx === dimensions.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={s.dimensionIcon}>
              <Text style={s.dimensionIconText}>{dim.icon}</Text>
            </View>
            <View style={s.dimensionInfo}>
              <Text style={s.dimensionLabel}>{dim.label}</Text>
              <Text style={s.dimensionDesc}>{dim.description}</Text>
            </View>
            <View style={s.scoreButtons}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.scoreBtn, dim.score >= n && s.scoreBtnActive]}
                  onPress={() => handleScoreChange(dim.key, n)}
                >
                  <Text style={[s.scoreBtnText, dim.score >= n && s.scoreBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Healthy relationships are the foundation of{'\n'}
          strong families and thriving communities.{'\n'}
          Regular check-ins build trust, communication,{'\n'}
          and lasting partnership.
        </Text>
      </View>
    </>
  );

  // ─── Goals Tab ───

  const renderGoals = () => (
    <>
      <Text style={s.sectionTitle}>Shared Goals</Text>
      <View style={s.card}>
        {DEMO_GOALS.map((goal, idx) => {
          const catInfo = GOAL_CATEGORIES.find((c) => c.key === goal.category);
          return (
            <View key={goal.id} style={[s.goalRow, idx === DEMO_GOALS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.goalHeader}>
                <View style={s.goalCategoryTag}>
                  <Text style={s.goalCategoryText}>{catInfo?.icon} {catInfo?.label}</Text>
                </View>
                <Text style={s.goalTitle}>{goal.title}</Text>
                <Text style={s.goalProgress}>{goal.progress}%</Text>
              </View>
              <View style={s.goalBarOuter}>
                <View style={[s.goalBarInner, { width: `${goal.progress}%` }]} />
              </View>
              <Text style={s.goalMeta}>Target: {goal.targetDate} | {goal.notes}</Text>
            </View>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>Add New Goal</Text>
      <View style={s.card}>
        <Text style={[s.dimensionDesc, { marginBottom: 8 }]}>Category</Text>
        <View style={s.typeGrid}>
          {GOAL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.typeChip, newGoalCategory === cat.key && s.typeChipSelected]}
              onPress={() => setNewGoalCategory(cat.key)}
            >
              <Text style={[s.typeChipText, newGoalCategory === cat.key && s.typeChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.input}
          placeholder="What goal do you share?"
          placeholderTextColor={t.text.muted}
          value={newGoalTitle}
          onChangeText={setNewGoalTitle}
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleAddGoal}>
          <Text style={s.submitText}>Add Shared Goal</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Dates Tab ───

  const renderDates = () => (
    <>
      <Text style={s.sectionTitle}>Date Ideas</Text>
      {DEMO_DATE_IDEAS.map((idea) => {
        const typeColor = getDateTypeColor(idea.type);
        return (
          <View key={idea.id} style={s.dateCard}>
            <View style={[s.dateTypeTag, { backgroundColor: typeColor + '20' }]}>
              <Text style={[s.dateTypeText, { color: typeColor }]}>{idea.type}</Text>
            </View>
            <Text style={s.dateTitle}>{idea.title}</Text>
            <Text style={s.dateDesc}>{idea.description}</Text>
            <View style={s.dateMeta}>
              <Text style={s.dateMetaText}>Cost: {idea.cost}</Text>
              <Text style={s.dateMetaText}>Duration: {idea.duration}</Text>
            </View>
          </View>
        );
      })}

      <Text style={s.sectionTitle}>Communication Exercises</Text>
      {DEMO_EXERCISES.map((exercise) => (
        <View key={exercise.id} style={s.exerciseCard}>
          <View style={s.exerciseTypeTag}>
            <Text style={s.exerciseTypeText}>{exercise.type.replace('_', ' ')}</Text>
          </View>
          <Text style={s.exerciseTitle}>{exercise.title}</Text>
          <Text style={s.exercisePrompt}>{exercise.prompt}</Text>
          <Text style={s.exerciseDuration}>Duration: {exercise.duration}</Text>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Spending intentional time together{'\n'}
          strengthens your bond. Even 30 minutes{'\n'}
          of focused connection can transform{'\n'}
          your relationship.
        </Text>
      </View>
    </>
  );

  // ─── Resources Tab ───

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Relationship Resources</Text>
      {DEMO_RESOURCES.map((resource) => {
        const typeColor = getResourceTypeColor(resource.type);
        return (
          <View key={resource.id} style={s.resourceCard}>
            <View style={[s.resourceTypeTag, { backgroundColor: typeColor + '20' }]}>
              <Text style={[s.resourceTypeText, { color: typeColor }]}>{resource.type}</Text>
            </View>
            <Text style={s.resourceTitle}>{resource.title}</Text>
            <Text style={s.resourceAuthor}>{resource.author}</Text>
            <Text style={s.resourceDesc}>{resource.description}</Text>
          </View>
        );
      })}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Seeking help is a sign of strength.{'\n'}
          The best relationships invest in growth.{'\n'}
          Every conversation, every check-in,{'\n'}
          every shared goal builds nOTK value.
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
        <Text style={s.title}>Relationship</Text>
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
        {tab === 'check-in' && renderCheckIn()}
        {tab === 'goals' && renderGoals()}
        {tab === 'dates' && renderDates()}
        {tab === 'resources' && renderResources()}
      </ScrollView>
    </SafeAreaView>
  );
}
