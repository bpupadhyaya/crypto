import { fonts } from '../utils/theme';
/**
 * Vision Board Screen — Personal and community vision setting, goal visualization.
 *
 * "A society that envisions peace will build peace. Vision precedes action,
 *  and shared vision precedes collective transformation."
 * — Human Constitution, Article I
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

type Tab = 'personal' | 'community' | 'progress' | 'inspire';

type GoalCategory = 'health' | 'career' | 'relationships' | 'learning' | 'community' | 'financial';

interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  milestones: Milestone[];
  targetDate: string;
  createdDate: string;
  completed: boolean;
  completedDate?: string;
  isShared: boolean;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface CommunityVision {
  id: string;
  title: string;
  description: string;
  author: string;
  votes: number;
  hasVoted: boolean;
  category: string;
  supporters: number;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal', icon: '\u{1F31F}' },
  { key: 'community', label: 'Community', icon: '\u{1F30D}' },
  { key: 'progress', label: 'Progress', icon: '\u{1F4CA}' },
  { key: 'inspire', label: 'Inspire', icon: '\u{1F4A1}' },
];

const CATEGORIES: { key: GoalCategory; label: string; icon: string; color: string }[] = [
  { key: 'health', label: 'Health', icon: '\u{1F49A}', color: '#34C759' },
  { key: 'career', label: 'Career', icon: '\u{1F4BC}', color: '#007AFF' },
  { key: 'relationships', label: 'Relationships', icon: '\u{1F495}', color: '#FF2D55' },
  { key: 'learning', label: 'Learning', icon: '\u{1F4DA}', color: '#AF52DE' },
  { key: 'community', label: 'Community', icon: '\u{1F91D}', color: '#FF9500' },
  { key: 'financial', label: 'Financial', icon: '\u{1F4B0}', color: '#30D158' },
];

const DEMO_GOALS: Goal[] = [
  {
    id: '1', title: 'Run a marathon', category: 'health',
    description: 'Complete a full 42km marathon by end of year.',
    milestones: [
      { id: 'm1', title: 'Run 5K without stopping', completed: true },
      { id: 'm2', title: 'Complete half-marathon', completed: true },
      { id: 'm3', title: 'Run 30K training', completed: false },
      { id: 'm4', title: 'Race day — full marathon', completed: false },
    ],
    targetDate: '2026-12-31', createdDate: '2026-01-15', completed: false, isShared: true,
  },
  {
    id: '2', title: 'Learn Rust programming', category: 'learning',
    description: 'Master Rust for systems programming and blockchain development.',
    milestones: [
      { id: 'm1', title: 'Complete Rust Book', completed: true },
      { id: 'm2', title: 'Build a CLI tool', completed: false },
      { id: 'm3', title: 'Contribute to open-source Rust project', completed: false },
    ],
    targetDate: '2026-09-30', createdDate: '2026-02-01', completed: false, isShared: false,
  },
  {
    id: '3', title: 'Mentor 5 junior developers', category: 'community',
    description: 'Give back by mentoring new developers entering the field.',
    milestones: [
      { id: 'm1', title: 'Find mentees through community board', completed: true },
      { id: 'm2', title: 'Weekly sessions for 3 months', completed: false },
      { id: 'm3', title: 'All mentees land first contributions', completed: false },
    ],
    targetDate: '2026-12-31', createdDate: '2026-01-20', completed: false, isShared: true,
  },
  {
    id: '4', title: 'Emergency fund — 6 months expenses', category: 'financial',
    description: 'Build a safety net of 6 months living expenses.',
    milestones: [
      { id: 'm1', title: 'Save 1 month', completed: true },
      { id: 'm2', title: 'Save 3 months', completed: true },
      { id: 'm3', title: 'Save 6 months', completed: false },
    ],
    targetDate: '2026-08-31', createdDate: '2025-11-01', completed: false, isShared: false,
  },
  {
    id: '5', title: 'Deepen family connections', category: 'relationships',
    description: 'Spend more intentional time with family. Weekly calls, monthly visits.',
    milestones: [
      { id: 'm1', title: 'Set up weekly family call', completed: true },
      { id: 'm2', title: 'Plan quarterly family gathering', completed: true },
      { id: 'm3', title: 'Create family photo album', completed: false },
    ],
    targetDate: '2026-12-31', createdDate: '2026-01-01', completed: false, isShared: false,
  },
  {
    id: '6', title: 'Launch open-source health tool', category: 'career',
    description: 'Ship a free nutrition tracking tool to help people eat better at near-zero cost.',
    milestones: [
      { id: 'm1', title: 'Design MVP', completed: true },
      { id: 'm2', title: 'Build core features', completed: true },
      { id: 'm3', title: 'Beta testing with 50 users', completed: true },
      { id: 'm4', title: 'Public launch', completed: true },
    ],
    targetDate: '2026-03-01', createdDate: '2025-09-01', completed: true, completedDate: '2026-02-28', isShared: true,
  },
];

const DEMO_COMMUNITY_VISIONS: CommunityVision[] = [
  {
    id: 'cv1', title: 'Universal digital literacy by 2030',
    description: 'Every person should have access to free digital education and tools. No one left behind in the digital age.',
    author: 'Community Council', votes: 342, hasVoted: true, category: 'Education', supporters: 187,
  },
  {
    id: 'cv2', title: 'Zero-cost emergency healthcare network',
    description: 'Build a peer-to-peer network where basic emergency medical care is accessible to everyone, everywhere, at no cost.',
    author: 'Health Working Group', votes: 518, hasVoted: false, category: 'Health', supporters: 293,
  },
];

export function VisionBoardScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [goals, setGoals] = useState<Goal[]>(demoMode ? DEMO_GOALS : []);
  const [communityVisions, setCommunityVisions] = useState<CommunityVision[]>(demoMode ? DEMO_COMMUNITY_VISIONS : []);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    tabLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabLabelActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    categoryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 12 },
    categoryChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
    categoryChipActive: { backgroundColor: t.accent.purple },
    categoryLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    categoryLabelActive: { color: '#fff' },
    goalTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    goalDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
    goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    goalCategoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    goalCategoryText: { fontSize: 11, fontWeight: fonts.bold },
    goalDate: { color: t.text.muted, fontSize: 12 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 12 },
    progressFill: { height: 8, borderRadius: 4 },
    progressText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold, marginTop: 6, textAlign: 'right' },
    milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    milestoneCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    milestoneCheckDone: { backgroundColor: t.accent.green, borderColor: t.accent.green },
    milestoneCheckPending: { borderColor: t.text.muted },
    milestoneCheckMark: { color: '#fff', fontSize: 13, fontWeight: fonts.heavy },
    milestoneTitle: { color: t.text.primary, fontSize: 14, flex: 1 },
    milestoneTitleDone: { textDecorationLine: 'line-through', color: t.text.muted },
    completedBadge: { backgroundColor: t.accent.green + '15', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10 },
    completedBadgeText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    addBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 10 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    smallBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.bg.primary },
    smallBtnText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    dangerBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.accent.red + '15' },
    dangerBtnText: { color: t.accent.red, fontSize: 12, fontWeight: fonts.semibold },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    voteBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
    voteBtnVoted: { backgroundColor: t.accent.green },
    voteBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    voteCount: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.bold },
    supporterCount: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    communityAuthor: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 6 },
    celebrationOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    celebrationCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 32, alignItems: 'center', marginHorizontal: 40 },
    celebrationIcon: { fontSize: 64, marginBottom: 12 },
    celebrationTitle: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy, textAlign: 'center' },
    celebrationSubtitle: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    celebrationBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20 },
    celebrationBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 20, backgroundColor: t.bg.card, borderRadius: 16, marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryNumber: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sharedBadge: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    sharedBadgeText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold },
    demoBadge: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    demoBadgeText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 15, textAlign: 'center' },
    inspireCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 12, borderLeftWidth: 4 },
    inspireQuote: { color: t.text.primary, fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
    inspireAuthor: { color: t.text.muted, fontSize: 13, marginTop: 8 },
    inspireGoalTitle: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.bold, marginTop: 12 },
    inspireProgress: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
  }), [t]);

  const getCategoryInfo = (key: GoalCategory) => CATEGORIES.find(c => c.key === key)!;

  const getGoalProgress = (goal: Goal): number => {
    if (goal.milestones.length === 0) return goal.completed ? 100 : 0;
    const done = goal.milestones.filter(m => m.completed).length;
    return Math.round((done / goal.milestones.length) * 100);
  };

  const handleToggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const updated = {
        ...g,
        milestones: g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m),
      };
      const allDone = updated.milestones.every(m => m.completed);
      if (allDone && !g.completed) {
        updated.completed = true;
        updated.completedDate = new Date().toISOString().split('T')[0];
        setTimeout(() => setShowCelebration(goalId), 300);
      } else if (!allDone && g.completed) {
        updated.completed = false;
        updated.completedDate = undefined;
      }
      return updated;
    }));
  }, []);

  const handleAddGoal = useCallback(() => {
    if (!newTitle.trim() || !selectedCategory) {
      Alert.alert('Required', 'Title and category are required.');
      return;
    }
    const goal: Goal = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: selectedCategory,
      description: newDescription.trim(),
      milestones: newMilestones.filter(m => m.trim()).map((m, i) => ({
        id: `m${i}`, title: m.trim(), completed: false,
      })),
      targetDate: newTargetDate || '2026-12-31',
      createdDate: new Date().toISOString().split('T')[0],
      completed: false,
      isShared: false,
    };
    setGoals(prev => [...prev, goal]);
    setShowAddGoal(false);
    setNewTitle('');
    setNewDescription('');
    setNewTargetDate('');
    setNewMilestones(['']);
    setSelectedCategory(null);
  }, [newTitle, selectedCategory, newDescription, newMilestones, newTargetDate]);

  const handleRemoveGoal = useCallback((id: string) => {
    Alert.alert('Remove Goal', 'Remove this goal from your vision board?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setGoals(prev => prev.filter(g => g.id !== id)) },
    ]);
  }, []);

  const handleVote = useCallback((id: string) => {
    setCommunityVisions(prev => prev.map(v => {
      if (v.id !== id) return v;
      return { ...v, hasVoted: !v.hasVoted, votes: v.hasVoted ? v.votes - 1 : v.votes + 1 };
    }));
  }, []);

  const handleToggleShare = useCallback((id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isShared: !g.isShared } : g));
  }, []);

  const filteredGoals = filterCategory === 'all' ? goals : goals.filter(g => g.category === filterCategory);
  const completedCount = goals.filter(g => g.completed).length;
  const activeCount = goals.filter(g => !g.completed).length;
  const totalMilestones = goals.reduce((sum, g) => sum + g.milestones.length, 0);
  const completedMilestones = goals.reduce((sum, g) => sum + g.milestones.filter(m => m.completed).length, 0);

  const renderGoalCard = (goal: Goal) => {
    const cat = getCategoryInfo(goal.category);
    const progress = getGoalProgress(goal);

    return (
      <View key={goal.id} style={s.card}>
        <View style={s.goalMeta}>
          <View style={[s.goalCategoryBadge, { backgroundColor: cat.color + '20' }]}>
            <Text style={[s.goalCategoryText, { color: cat.color }]}>{cat.icon} {cat.label}</Text>
          </View>
          <Text style={s.goalDate}>{'\u{1F4C5}'} {goal.targetDate}</Text>
        </View>

        <Text style={[s.goalTitle, { marginTop: 10 }]}>{goal.title}</Text>
        {goal.description ? <Text style={s.goalDesc}>{goal.description}</Text> : null}

        {goal.completed && (
          <View style={s.completedBadge}>
            <Text style={s.completedBadgeText}>{'\u{1F389}'} Completed {goal.completedDate || ''}</Text>
          </View>
        )}

        {goal.isShared && (
          <View style={s.sharedBadge}>
            <Text style={s.sharedBadgeText}>{'\u{1F310}'} Shared with community</Text>
          </View>
        )}

        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: goal.completed ? t.accent.green : cat.color }]} />
        </View>
        <Text style={s.progressText}>{progress}% complete</Text>

        {goal.milestones.map((ms) => (
          <TouchableOpacity key={ms.id} style={s.milestoneRow} onPress={() => handleToggleMilestone(goal.id, ms.id)}>
            <View style={[s.milestoneCheck, ms.completed ? s.milestoneCheckDone : s.milestoneCheckPending]}>
              {ms.completed && <Text style={s.milestoneCheckMark}>{'\u2713'}</Text>}
            </View>
            <Text style={[s.milestoneTitle, ms.completed && s.milestoneTitleDone]}>{ms.title}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.actionRow}>
          <TouchableOpacity style={s.smallBtn} onPress={() => handleToggleShare(goal.id)}>
            <Text style={s.smallBtnText}>{goal.isShared ? '\u{1F512} Unshare' : '\u{1F310} Share'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dangerBtn} onPress={() => handleRemoveGoal(goal.id)}>
            <Text style={s.dangerBtnText}>{'\u{1F5D1}'} Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPersonal = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F31F}'}</Text>
        <Text style={s.heroTitle}>Your Vision Board</Text>
        <Text style={s.heroSubtitle}>
          Set meaningful goals, track milestones, and celebrate achievements. Your vision shapes your future.
        </Text>
      </View>

      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{activeCount}</Text>
          <Text style={s.summaryLabel}>Active</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{completedCount}</Text>
          <Text style={s.summaryLabel}>Completed</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryNumber}>{completedMilestones}/{totalMilestones}</Text>
          <Text style={s.summaryLabel}>Milestones</Text>
        </View>
      </View>

      <Text style={s.section}>{'\u{1F3AF}'} Filter by Category</Text>
      <View style={s.categoryRow}>
        <TouchableOpacity style={[s.categoryChip, filterCategory === 'all' && s.categoryChipActive]} onPress={() => setFilterCategory('all')}>
          <Text style={[s.categoryLabel, filterCategory === 'all' && s.categoryLabelActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.key} style={[s.categoryChip, filterCategory === cat.key && s.categoryChipActive]} onPress={() => setFilterCategory(cat.key)}>
            <Text style={[s.categoryLabel, filterCategory === cat.key && s.categoryLabelActive]}>{cat.icon} {cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>{'\u{1F4CB}'} Goals</Text>

      {filteredGoals.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>{'\u{1F31F}'}</Text>
          <Text style={s.emptyText}>No goals yet.{'\n'}Start by setting your first vision.</Text>
        </View>
      ) : (
        filteredGoals.map(renderGoalCard)
      )}

      {showAddGoal ? (
        <View style={s.card}>
          <Text style={s.inputLabel}>Goal Title</Text>
          <TextInput style={s.input} value={newTitle} onChangeText={setNewTitle} placeholder="What do you want to achieve?" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Category</Text>
          <View style={s.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.key} style={[s.categoryChip, selectedCategory === cat.key && { backgroundColor: cat.color }]} onPress={() => setSelectedCategory(cat.key)}>
                <Text style={[s.categoryLabel, selectedCategory === cat.key && { color: '#fff' }]}>{cat.icon} {cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.inputLabel}>Description</Text>
          <TextInput style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]} value={newDescription} onChangeText={setNewDescription} placeholder="Why is this important to you?" placeholderTextColor={t.text.muted} multiline />

          <Text style={s.inputLabel}>Target Date (YYYY-MM-DD)</Text>
          <TextInput style={s.input} value={newTargetDate} onChangeText={setNewTargetDate} placeholder="2026-12-31" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Milestones</Text>
          {newMilestones.map((ms, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={ms}
                onChangeText={(v) => { const updated = [...newMilestones]; updated[i] = v; setNewMilestones(updated); }}
                placeholder={`Milestone ${i + 1}`}
                placeholderTextColor={t.text.muted}
              />
              {i === newMilestones.length - 1 && (
                <TouchableOpacity style={[s.smallBtn, { justifyContent: 'center' }]} onPress={() => setNewMilestones(prev => [...prev, ''])}>
                  <Text style={s.smallBtnText}>{'\u2795'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={[s.addBtn, { flex: 1, marginHorizontal: 0 }]} onPress={handleAddGoal}>
              <Text style={s.addBtnText}>Save Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.addBtn, { flex: 1, marginHorizontal: 0, backgroundColor: t.bg.card }]} onPress={() => setShowAddGoal(false)}>
              <Text style={[s.addBtnText, { color: t.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddGoal(true)}>
          <Text style={s.addBtnText}>{'\u2795'} Set New Goal</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderCommunity = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F30D}'}</Text>
        <Text style={s.heroTitle}>Community Vision</Text>
        <Text style={s.heroSubtitle}>
          Shared aspirations voted on by the community. Together, we shape a better world.
        </Text>
      </View>

      <Text style={s.section}>{'\u{1F5F3}'} Community Aspirations</Text>

      {communityVisions.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>{'\u{1F30D}'}</Text>
          <Text style={s.emptyText}>No community visions yet.{'\n'}Be the first to propose one.</Text>
        </View>
      ) : (
        communityVisions.map((vision) => (
          <View key={vision.id} style={s.card}>
            <View style={s.goalMeta}>
              <View style={[s.goalCategoryBadge, { backgroundColor: t.accent.purple + '20' }]}>
                <Text style={[s.goalCategoryText, { color: t.accent.purple }]}>{vision.category}</Text>
              </View>
              <Text style={s.voteCount}>{'\u{1F5F3}'} {vision.votes} votes</Text>
            </View>

            <Text style={[s.goalTitle, { marginTop: 10 }]}>{vision.title}</Text>
            <Text style={s.goalDesc}>{vision.description}</Text>
            <Text style={s.communityAuthor}>Proposed by: {vision.author}</Text>
            <Text style={s.supporterCount}>{vision.supporters} supporters pledged action</Text>

            <View style={s.actionRow}>
              <TouchableOpacity style={[s.voteBtn, vision.hasVoted && s.voteBtnVoted]} onPress={() => handleVote(vision.id)}>
                <Text style={s.voteBtnText}>{vision.hasVoted ? '\u2713 Voted' : '\u{1F5F3} Vote'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.smallBtn} onPress={() => Alert.alert('Support', 'Pledge your support to take action toward this vision.')}>
                <Text style={s.smallBtnText}>{'\u{1F91D}'} Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => Alert.alert('Propose', 'Submit a new community vision for voting.')}>
        <Text style={s.addBtnText}>{'\u2795'} Propose Vision</Text>
      </TouchableOpacity>
    </>
  );

  const renderProgress = () => {
    const overallProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + getGoalProgress(g), 0) / goals.length)
      : 0;

    return (
      <>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4CA}'}</Text>
          <Text style={s.heroTitle}>Progress Dashboard</Text>
          <Text style={s.heroSubtitle}>
            Track how far you have come. Every milestone matters.
          </Text>
        </View>

        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{overallProgress}%</Text>
            <Text style={s.summaryLabel}>Overall</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{completedCount}</Text>
            <Text style={s.summaryLabel}>Goals Done</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{completedMilestones}</Text>
            <Text style={s.summaryLabel}>Milestones</Text>
          </View>
        </View>

        <Text style={s.section}>{'\u{1F3C6}'} Completed Goals</Text>
        {goals.filter(g => g.completed).length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'\u{1F3AF}'}</Text>
            <Text style={s.emptyText}>No completed goals yet.{'\n'}Keep going!</Text>
          </View>
        ) : (
          goals.filter(g => g.completed).map(renderGoalCard)
        )}

        <Text style={s.section}>{'\u{1F525}'} In Progress</Text>
        {goals.filter(g => !g.completed).length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'\u{1F31F}'}</Text>
            <Text style={s.emptyText}>All goals completed! Set new ones.</Text>
          </View>
        ) : (
          goals.filter(g => !g.completed).sort((a, b) => getGoalProgress(b) - getGoalProgress(a)).map(renderGoalCard)
        )}

        <Text style={s.section}>{'\u{1F4C5}'} Annual Vision Review</Text>
        <View style={s.card}>
          <Text style={s.goalTitle}>{'\u{1F4D6}'} 2026 Vision Review</Text>
          <Text style={s.goalDesc}>
            Take time to reflect on your goals. What worked? What changed? Set new intentions for the coming year.
          </Text>
          <Text style={[s.goalDate, { marginTop: 8 }]}>
            Next review: December 2026
          </Text>
          <TouchableOpacity style={[s.addBtn, { marginHorizontal: 0, marginTop: 12 }]} onPress={() => Alert.alert('Review', 'Annual vision review helps you realign goals with your evolving values.')}>
            <Text style={s.addBtnText}>Start Review</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderInspire = () => {
    const sharedGoals = goals.filter(g => g.isShared);

    return (
      <>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F4A1}'}</Text>
          <Text style={s.heroTitle}>Inspire Others</Text>
          <Text style={s.heroSubtitle}>
            Share your goals and progress to inspire others on their journey. Vulnerability creates connection.
          </Text>
        </View>

        <Text style={s.section}>{'\u{1F310}'} Your Shared Goals</Text>
        {sharedGoals.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>{'\u{1F4A1}'}</Text>
            <Text style={s.emptyText}>No shared goals yet.{'\n'}Share a goal to inspire your community.</Text>
          </View>
        ) : (
          sharedGoals.map((goal) => {
            const cat = getCategoryInfo(goal.category);
            const progress = getGoalProgress(goal);
            return (
              <View key={goal.id} style={[s.inspireCard, { borderLeftColor: cat.color }]}>
                <Text style={s.inspireGoalTitle}>{cat.icon} {goal.title}</Text>
                {goal.description ? <Text style={s.inspireQuote}>"{goal.description}"</Text> : null}
                <Text style={s.inspireProgress}>{progress}% complete — {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</Text>
                {goal.completed && <Text style={s.inspireAuthor}>{'\u{1F389}'} Goal achieved!</Text>}
              </View>
            );
          })
        )}

        <Text style={s.section}>{'\u{2728}'} Community Inspiration</Text>
        <View style={[s.inspireCard, { borderLeftColor: t.accent.purple }]}>
          <Text style={s.inspireQuote}>"The best way to predict the future is to create it."</Text>
          <Text style={s.inspireAuthor}>— Peter Drucker</Text>
        </View>
        <View style={[s.inspireCard, { borderLeftColor: t.accent.green }]}>
          <Text style={s.inspireQuote}>"A society that envisions peace will build peace. Vision precedes action."</Text>
          <Text style={s.inspireAuthor}>— Human Constitution</Text>
        </View>
        <View style={[s.inspireCard, { borderLeftColor: t.accent.orange }]}>
          <Text style={s.inspireQuote}>"What you do makes a difference, and you have to decide what kind of difference you want to make."</Text>
          <Text style={s.inspireAuthor}>— Jane Goodall</Text>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => Alert.alert('Share', 'Choose a goal to share with the community and inspire others.')}>
          <Text style={s.addBtnText}>{'\u{1F4A1}'} Share Your Journey</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F31F}'} Vision Board</Text>
        {demoMode && (
          <View style={s.demoBadge}>
            <Text style={s.demoBadgeText}>DEMO</Text>
          </View>
        )}
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'personal' && renderPersonal()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'inspire' && renderInspire()}
      </ScrollView>

      {showCelebration && (
        <View style={s.celebrationOverlay}>
          <View style={s.celebrationCard}>
            <Text style={s.celebrationIcon}>{'\u{1F389}'}</Text>
            <Text style={s.celebrationTitle}>Goal Achieved!</Text>
            <Text style={s.celebrationSubtitle}>
              Congratulations! You completed "{goals.find(g => g.id === showCelebration)?.title}". Your dedication inspires others.
            </Text>
            <TouchableOpacity style={s.celebrationBtn} onPress={() => setShowCelebration(null)}>
              <Text style={s.celebrationBtnText}>Celebrate!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
