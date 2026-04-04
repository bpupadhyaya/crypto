import { fonts } from '../utils/theme';
/**
 * Community Goals Screen — Set and track collective community goals.
 *
 * Article I: "Every human is born with infinite potential worth."
 * Article III: cOTK represents community value — collective goals amplify impact.
 *
 * Features:
 * - Active community goals (e.g., "Plant 1000 trees by December")
 * - Progress tracking with community contributions
 * - Propose new goal (title, target, deadline, category)
 * - Celebrate achieved goals
 * - Demo mode with 3 active goals, 1 achieved
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface CommunityGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  contributors: number;
  proposedBy: string;
  status: 'active' | 'achieved';
  achievedDate?: string;
  myContribution: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_GOALS: CommunityGoal[] = [
  {
    id: 'g1',
    title: 'Plant 1,000 Trees by December',
    description: 'A community-wide effort to plant 1,000 native trees in parks, schools, and empty lots. Each tree removes ~48 lbs of CO2 per year. Together we can make our neighborhood greener and healthier.',
    category: 'Environment',
    target: 1000,
    current: 642,
    unit: 'trees',
    deadline: '2026-12-31',
    contributors: 89,
    proposedBy: 'Urban Roots Collective',
    status: 'active',
    myContribution: 12,
  },
  {
    id: 'g2',
    title: 'Zero Waste Community by 2027',
    description: 'Reduce community landfill waste to zero through composting, recycling, repair cafes, and sharing. Track monthly waste per household and celebrate reductions.',
    category: 'Sustainability',
    target: 100,
    current: 38,
    unit: '% waste reduction',
    deadline: '2027-01-01',
    contributors: 156,
    proposedBy: 'Green Living Network',
    status: 'active',
    myContribution: 0,
  },
  {
    id: 'g3',
    title: '500 Kids Learn to Code',
    description: 'Provide free coding workshops to 500 children aged 8-16. Volunteers teach Scratch, Python, and web basics. Every child deserves digital literacy.',
    category: 'Education',
    target: 500,
    current: 312,
    unit: 'students',
    deadline: '2026-09-01',
    contributors: 42,
    proposedBy: 'Future Coders Foundation',
    status: 'active',
    myContribution: 8,
  },
  {
    id: 'g4',
    title: 'Community Library — 10,000 Books',
    description: 'Build a free community library with 10,000 donated books. The little free library on Maple Street started it — now we are going big. Every book donated earns cOTK.',
    category: 'Education',
    target: 10000,
    current: 10000,
    unit: 'books',
    deadline: '2026-03-01',
    contributors: 234,
    proposedBy: 'Bookworm Alliance',
    status: 'achieved',
    achievedDate: '2026-02-18',
    myContribution: 35,
  },
];

const GOAL_CATEGORIES = ['All', 'Environment', 'Sustainability', 'Education', 'Health', 'Infrastructure', 'Arts'];

type Tab = 'active' | 'propose' | 'achieved';

export function CommunityGoalsScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [goals, setGoals] = useState(DEMO_GOALS);
  const [filterCategory, setFilterCategory] = useState('All');
  const [contributeAmounts, setContributeAmounts] = useState<Record<string, string>>({});

  // Propose form
  const [proposeTitle, setProposeTitle] = useState('');
  const [proposeDesc, setProposeDesc] = useState('');
  const [proposeTarget, setProposeTarget] = useState('');
  const [proposeUnit, setProposeUnit] = useState('');
  const [proposeDeadline, setProposeDeadline] = useState('');
  const [proposeCategory, setProposeCategory] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const activeGoals = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active');
    if (filterCategory === 'All') return active;
    return active.filter((g) => g.category === filterCategory);
  }, [goals, filterCategory]);

  const achievedGoals = useMemo(() => goals.filter((g) => g.status === 'achieved'), [goals]);

  const handleContribute = useCallback((id: string) => {
    const amount = parseInt(contributeAmounts[id] || '0', 10);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid contribution amount.');
      return;
    }
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newCurrent = Math.min(g.current + amount, g.target);
        const newStatus = newCurrent >= g.target ? 'achieved' as const : 'active' as const;
        return {
          ...g,
          current: newCurrent,
          myContribution: g.myContribution + amount,
          contributors: g.myContribution === 0 ? g.contributors + 1 : g.contributors,
          status: newStatus,
          achievedDate: newStatus === 'achieved' ? '2026-03-29' : undefined,
        };
      }),
    );
    setContributeAmounts((prev) => ({ ...prev, [id]: '' }));
    const goal = goals.find((g) => g.id === id);
    Alert.alert('Contribution Recorded!', `You contributed ${amount} ${goal?.unit || 'units'} to "${goal?.title}".`);
  }, [goals, contributeAmounts]);

  const handlePropose = useCallback(() => {
    if (!proposeTitle.trim()) { Alert.alert('Required', 'Enter a goal title.'); return; }
    if (!proposeDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    const target = parseInt(proposeTarget, 10);
    if (!target || target <= 0) { Alert.alert('Required', 'Enter a valid target number.'); return; }
    if (!proposeUnit.trim()) { Alert.alert('Required', 'Enter a unit (e.g., trees, hours, books).'); return; }
    if (!proposeDeadline.trim()) { Alert.alert('Required', 'Enter a deadline.'); return; }
    if (!proposeCategory) { Alert.alert('Required', 'Select a category.'); return; }

    Alert.alert('Goal Proposed!', `"${proposeTitle}" has been submitted for community approval.`);
    setProposeTitle('');
    setProposeDesc('');
    setProposeTarget('');
    setProposeUnit('');
    setProposeDeadline('');
    setProposeCategory('');
    setTab('active');
  }, [proposeTitle, proposeDesc, proposeTarget, proposeUnit, proposeDeadline, proposeCategory]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterActive: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    filterText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.purple },
    goalCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    goalTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    goalDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    goalMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    progressBarBg: { height: 10, backgroundColor: t.bg.primary, borderRadius: 5, marginTop: 10 },
    progressBarFill: { height: 10, borderRadius: 5 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    progressText: { color: t.text.muted, fontSize: 12 },
    currentText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    targetText: { color: t.text.muted, fontSize: 12 },
    contributorsText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    deadlineText: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    myContribution: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    contributeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    contributeInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 14 },
    contributeBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    contributeText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    achievedBanner: { backgroundColor: t.accent.green + '20', borderRadius: 10, padding: 10, marginTop: 8, alignItems: 'center' },
    achievedText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    achievedDate: { color: t.accent.green, fontSize: 11, marginTop: 2 },
    celebrationText: { color: t.text.primary, fontSize: 24, textAlign: 'center', marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.purple + '20', borderColor: t.accent.purple },
    categoryChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    categoryChipTextSelected: { color: t.accent.purple },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    categoryTag: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'active', label: 'Active Goals' },
    { key: 'propose', label: 'Propose' },
    { key: 'achieved', label: 'Achieved' },
  ];

  // ─── Render Helpers ───

  const renderProgressBar = (current: number, target: number, achieved: boolean) => {
    const pct = Math.min((current / target) * 100, 100);
    return (
      <View>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, {
            width: `${pct}%`,
            backgroundColor: achieved ? t.accent.green : t.accent.blue,
          }]} />
        </View>
        <View style={s.progressRow}>
          <Text style={s.currentText}>{current.toLocaleString()}</Text>
          <Text style={s.targetText}>of {target.toLocaleString()} ({Math.round(pct)}%)</Text>
        </View>
      </View>
    );
  };

  const renderGoalCard = (g: CommunityGoal, showContribute: boolean) => (
    <View key={g.id} style={s.goalCard}>
      <Text style={s.goalTitle}>{g.title}</Text>
      <Text style={s.categoryTag}>{g.category}</Text>
      <Text style={s.goalDesc}>{g.description}</Text>
      {renderProgressBar(g.current, g.target, g.status === 'achieved')}
      <Text style={s.goalMeta}>Unit: {g.unit}</Text>
      <Text style={s.contributorsText}>{g.contributors} contributors</Text>
      <Text style={s.deadlineText}>Deadline: {g.deadline}</Text>
      {g.myContribution > 0 && (
        <Text style={s.myContribution}>Your contribution: {g.myContribution} {g.unit}</Text>
      )}
      <Text style={s.goalMeta}>Proposed by: {g.proposedBy}</Text>

      {g.status === 'achieved' && (
        <View style={s.achievedBanner}>
          <Text style={s.celebrationText}>*</Text>
          <Text style={s.achievedText}>Goal Achieved!</Text>
          {g.achievedDate && <Text style={s.achievedDate}>Completed on {g.achievedDate}</Text>}
        </View>
      )}

      {showContribute && g.status === 'active' && (
        <View style={s.contributeRow}>
          <TextInput
            style={s.contributeInput}
            placeholder={`Add ${g.unit}`}
            placeholderTextColor={t.text.muted}
            keyboardType="numeric"
            value={contributeAmounts[g.id] || ''}
            onChangeText={(v) => setContributeAmounts((prev) => ({ ...prev, [g.id]: v }))}
          />
          <TouchableOpacity style={s.contributeBtn} onPress={() => handleContribute(g.id)}>
            <Text style={s.contributeText}>Contribute</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderActive = () => (
    <>
      <View style={s.filterRow}>
        {GOAL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, filterCategory === cat && s.filterActive]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={[s.filterText, filterCategory === cat && s.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.sectionTitle}>Active Goals ({activeGoals.length})</Text>
      {activeGoals.length === 0 ? (
        <Text style={s.emptyText}>No active goals in this category.</Text>
      ) : (
        activeGoals.map((g) => renderGoalCard(g, true))
      )}
    </>
  );

  const renderPropose = () => (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Propose a Community Goal</Text>
      <TextInput style={s.input} placeholder="Goal Title" placeholderTextColor={t.text.muted} value={proposeTitle} onChangeText={setProposeTitle} />
      <TextInput style={[s.input, s.inputMulti]} placeholder="Description — why does this matter?" placeholderTextColor={t.text.muted} value={proposeDesc} onChangeText={setProposeDesc} multiline />
      <TextInput style={s.input} placeholder="Target Number (e.g., 1000)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={proposeTarget} onChangeText={setProposeTarget} />
      <TextInput style={s.input} placeholder="Unit (e.g., trees, hours, meals)" placeholderTextColor={t.text.muted} value={proposeUnit} onChangeText={setProposeUnit} />
      <TextInput style={s.input} placeholder="Deadline (YYYY-MM-DD)" placeholderTextColor={t.text.muted} value={proposeDeadline} onChangeText={setProposeDeadline} />
      <Text style={{ color: t.text.muted, fontSize: 13, marginBottom: 8 }}>Category</Text>
      <View style={s.categoryGrid}>
        {GOAL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.categoryChip, proposeCategory === cat && s.categoryChipSelected]}
            onPress={() => setProposeCategory(cat)}
          >
            <Text style={[s.categoryChipText, proposeCategory === cat && s.categoryChipTextSelected]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handlePropose}>
        <Text style={s.submitText}>Submit Proposal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAchieved = () => (
    <>
      <Text style={s.sectionTitle}>Achieved Goals ({achievedGoals.length})</Text>
      {achievedGoals.length === 0 ? (
        <Text style={s.emptyText}>No goals achieved yet — keep contributing!</Text>
      ) : (
        achievedGoals.map((g) => renderGoalCard(g, false))
      )}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Goals</Text>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'active' && renderActive()}
        {tab === 'propose' && renderPropose()}
        {tab === 'achieved' && renderAchieved()}
      </ScrollView>
    </SafeAreaView>
  );
}
