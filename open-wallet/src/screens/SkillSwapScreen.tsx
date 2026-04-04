import { fonts } from '../utils/theme';
/**
 * Skill Swap Screen — Direct skill exchange, teach what you know, learn what you need.
 *
 * Article I: "Every human skill has value. Exchange knowledge freely."
 * No money needed — trade skills directly, powered by Open Chain.
 *
 * Features:
 * - My skills (what I can teach) and my wants (what I want to learn)
 * - Smart matching — find people with complementary skills
 * - Propose swap (I teach X, you teach Y — no money needed)
 * - Swap history with ratings
 * - Community skill map (what skills exist, what's in demand)
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

interface SkillEntry {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'expert';
}

interface SkillMatch {
  id: string;
  personUID: string;
  personName: string;
  theyTeach: string;
  theyWant: string;
  youTeach: string;
  youWant: string;
  matchScore: number;
  distance: string;
}

interface SwapRecord {
  id: string;
  partnerUID: string;
  partnerName: string;
  iGave: string;
  iReceived: string;
  date: string;
  hoursEach: number;
  myRating: number;
  theirRating: number;
  status: 'completed' | 'in-progress' | 'proposed';
}

interface SkillMapEntry {
  skill: string;
  category: string;
  offeredBy: number;
  wantedBy: number;
  demandRatio: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SKILL_CATEGORIES = [
  { key: 'tech', label: 'Technology', icon: 'T' },
  { key: 'language', label: 'Languages', icon: 'L' },
  { key: 'music', label: 'Music', icon: 'M' },
  { key: 'craft', label: 'Crafts', icon: 'C' },
  { key: 'fitness', label: 'Fitness', icon: 'F' },
  { key: 'cooking', label: 'Cooking', icon: 'K' },
  { key: 'academic', label: 'Academic', icon: 'A' },
  { key: 'trade', label: 'Trades', icon: 'W' },
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  expert: '#AF52DE',
};

// ─── Demo Data ───

const DEMO_MY_SKILLS: SkillEntry[] = [
  { id: 's1', name: 'Python Programming', category: 'tech', level: 'expert' },
  { id: 's2', name: 'Guitar', category: 'music', level: 'intermediate' },
  { id: 's3', name: 'Bread Baking', category: 'cooking', level: 'intermediate' },
  { id: 's4', name: 'Calculus', category: 'academic', level: 'expert' },
];

const DEMO_MY_WANTS: SkillEntry[] = [
  { id: 'w1', name: 'Spanish', category: 'language', level: 'beginner' },
  { id: 'w2', name: 'Woodworking', category: 'craft', level: 'beginner' },
  { id: 'w3', name: 'Yoga', category: 'fitness', level: 'beginner' },
];

const DEMO_MATCHES: SkillMatch[] = [
  {
    id: 'm1', personUID: 'openchain1abc...lingua_sofia', personName: 'Sofia M.',
    theyTeach: 'Spanish', theyWant: 'Python Programming',
    youTeach: 'Python Programming', youWant: 'Spanish',
    matchScore: 98, distance: '2.3 km',
  },
  {
    id: 'm2', personUID: 'openchain1def...maker_kenji', personName: 'Kenji T.',
    theyTeach: 'Woodworking', theyWant: 'Guitar',
    youTeach: 'Guitar', youWant: 'Woodworking',
    matchScore: 95, distance: '4.1 km',
  },
];

const DEMO_SWAPS: SwapRecord[] = [
  {
    id: 'sw1', partnerUID: 'openchain1ghi...chef_anna', partnerName: 'Anna K.',
    iGave: 'Python Programming', iReceived: 'Thai Cooking',
    date: '2026-03-20', hoursEach: 3, myRating: 5, theirRating: 5, status: 'completed',
  },
  {
    id: 'sw2', partnerUID: 'openchain1jkl...fit_omar', partnerName: 'Omar R.',
    iGave: 'Calculus', iReceived: 'Yoga',
    date: '2026-03-26', hoursEach: 2, myRating: 0, theirRating: 0, status: 'in-progress',
  },
];

const DEMO_SKILL_MAP: SkillMapEntry[] = [
  { skill: 'Python Programming', category: 'tech', offeredBy: 42, wantedBy: 128, demandRatio: 3.05 },
  { skill: 'Spanish', category: 'language', offeredBy: 67, wantedBy: 89, demandRatio: 1.33 },
  { skill: 'Guitar', category: 'music', offeredBy: 54, wantedBy: 71, demandRatio: 1.31 },
  { skill: 'Woodworking', category: 'craft', offeredBy: 18, wantedBy: 56, demandRatio: 3.11 },
  { skill: 'Yoga', category: 'fitness', offeredBy: 38, wantedBy: 95, demandRatio: 2.50 },
  { skill: 'Bread Baking', category: 'cooking', offeredBy: 22, wantedBy: 47, demandRatio: 2.14 },
  { skill: 'Calculus', category: 'academic', offeredBy: 15, wantedBy: 63, demandRatio: 4.20 },
  { skill: 'Plumbing', category: 'trade', offeredBy: 8, wantedBy: 74, demandRatio: 9.25 },
];

type Tab = 'match' | 'my-skills' | 'swaps' | 'map';

export function SkillSwapScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('match');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [addingType, setAddingType] = useState<'skill' | 'want'>('skill');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const mySkills = DEMO_MY_SKILLS;
  const myWants = DEMO_MY_WANTS;
  const matches = DEMO_MATCHES;
  const swaps = DEMO_SWAPS;
  const skillMap = useMemo(() =>
    [...DEMO_SKILL_MAP].sort((a, b) => b.demandRatio - a.demandRatio),
    [],
  );

  const handleAddEntry = useCallback(() => {
    if (!newSkillName.trim()) { Alert.alert('Required', 'Enter a skill name.'); return; }
    if (!newSkillCategory) { Alert.alert('Required', 'Select a category.'); return; }

    const label = addingType === 'skill' ? 'skill you can teach' : 'skill you want to learn';
    Alert.alert(
      'Added!',
      `"${newSkillName}" added as a ${label}.\nWe'll find matching swap partners.`,
    );
    setNewSkillName('');
    setNewSkillCategory('');
    setTab('match');
  }, [newSkillName, newSkillCategory, addingType]);

  const handleProposeSwap = useCallback((match: SkillMatch) => {
    Alert.alert(
      'Propose Swap?',
      `You teach: ${match.youTeach}\nYou learn: ${match.theyTeach}\nPartner: ${match.personName}\n\nNo money needed — just skill for skill.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Propose', onPress: () => Alert.alert('Sent!', `Swap proposal sent to ${match.personName}.\nThey'll be notified.`) },
      ],
    );
  }, []);

  const handleRateSwap = useCallback((swap: SwapRecord) => {
    Alert.alert(
      'Rate Swap',
      `How was learning "${swap.iReceived}" from ${swap.partnerName}?`,
      [
        { text: '5 Stars', onPress: () => Alert.alert('Rated!', 'Thank you for your feedback.') },
        { text: '4 Stars', onPress: () => Alert.alert('Rated!', 'Thank you for your feedback.') },
        { text: 'Cancel', style: 'cancel' },
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
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Match tab
    matchCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    matchScore: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.accent.green + '20' },
    matchScoreText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.heavy },
    matchExchange: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginTop: 10 },
    matchArrow: { textAlign: 'center', color: t.text.muted, fontSize: 18, marginVertical: 4 },
    matchSkillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    matchSkill: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    matchDistance: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    matchProposeBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    matchProposeText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    noMatchText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 20, marginHorizontal: 20 },
    // My skills
    skillSection: { marginBottom: 16 },
    skillItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    skillIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    skillIconText: { fontSize: 14, fontWeight: fonts.bold },
    skillInfo: { flex: 1 },
    skillName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    skillCategory: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    skillLevel: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    skillLevelText: { fontSize: 10, fontWeight: fonts.bold },
    addForm: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    addToggle: { flexDirection: 'row', marginBottom: 12 },
    addToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    addToggleActive: { backgroundColor: t.accent.blue + '20' },
    addToggleText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    addToggleTextActive: { color: t.accent.blue },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    categoryChipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    categoryChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    categoryChipTextSelected: { color: t.accent.blue },
    levelRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    levelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: t.bg.primary },
    levelBtnActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '10' },
    levelBtnText: { fontSize: 12, fontWeight: fonts.semibold },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    // Swaps history
    swapCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    swapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    swapPartner: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    swapStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    swapStatusText: { fontSize: 10, fontWeight: fonts.bold },
    swapDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, backgroundColor: t.bg.primary, borderRadius: 10, padding: 12 },
    swapSide: { flex: 1 },
    swapLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    swapSkill: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    swapDivider: { width: 1, backgroundColor: t.text.muted + '30', marginHorizontal: 12 },
    swapMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    swapRating: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.bold },
    swapRateBtn: { backgroundColor: t.accent.orange, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
    swapRateText: { color: '#fff', fontSize: 12, fontWeight: fonts.semibold },
    // Skill map
    mapCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    mapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    mapSkillName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    mapCategory: { color: t.text.muted, fontSize: 11 },
    mapStats: { alignItems: 'flex-end' },
    mapDemand: { fontSize: 13, fontWeight: fonts.heavy },
    mapSubtext: { color: t.text.muted, fontSize: 10, marginTop: 1 },
    mapBar: { height: 4, borderRadius: 2, marginTop: 6 },
    mapLegend: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 16 },
    mapLegendText: { color: t.text.muted, fontSize: 11 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabDefs: Array<{ key: Tab; label: string }> = [
    { key: 'match', label: 'Matches' },
    { key: 'my-skills', label: 'My Skills' },
    { key: 'swaps', label: 'Swaps' },
    { key: 'map', label: 'Skill Map' },
  ];

  // ─── Match Tab ───

  const renderMatch = () => (
    <>
      <Text style={s.sectionTitle}>Smart Matches</Text>
      <Text style={[s.noMatchText, { marginTop: 0, marginBottom: 16 }]}>
        People who want what you teach and teach what you want
      </Text>

      {matches.length === 0 ? (
        <Text style={s.noMatchText}>Add skills and wants to find matches.</Text>
      ) : (
        matches.map((match) => (
          <View key={match.id} style={s.matchCard}>
            <View style={s.matchHeader}>
              <Text style={s.matchName}>{match.personName}</Text>
              <View style={s.matchScore}>
                <Text style={s.matchScoreText}>{match.matchScore}% match</Text>
              </View>
            </View>
            <View style={s.matchExchange}>
              <View style={s.matchSkillRow}>
                <Text style={s.matchLabel}>You teach</Text>
                <Text style={s.matchSkill}>{match.youTeach}</Text>
              </View>
              <Text style={s.matchArrow}>{'<->'}</Text>
              <View style={s.matchSkillRow}>
                <Text style={s.matchLabel}>You learn</Text>
                <Text style={s.matchSkill}>{match.theyTeach}</Text>
              </View>
            </View>
            <Text style={s.matchDistance}>{match.distance} away</Text>
            <TouchableOpacity style={s.matchProposeBtn} onPress={() => handleProposeSwap(match)}>
              <Text style={s.matchProposeText}>Propose Swap</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  // ─── My Skills Tab ───

  const renderSkillList = (items: SkillEntry[], label: string, accentColor: string) => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>{label}</Text>
      {items.map((item) => {
        const catInfo = SKILL_CATEGORIES.find((c) => c.key === item.category);
        const lvlColor = LEVEL_COLORS[item.level] || t.text.muted;
        return (
          <View key={item.id} style={s.skillItem}>
            <View style={[s.skillIcon, { backgroundColor: accentColor + '20' }]}>
              <Text style={[s.skillIconText, { color: accentColor }]}>{catInfo?.icon || '?'}</Text>
            </View>
            <View style={s.skillInfo}>
              <Text style={s.skillName}>{item.name}</Text>
              <Text style={s.skillCategory}>{catInfo?.label || item.category}</Text>
            </View>
            <View style={[s.skillLevel, { backgroundColor: lvlColor + '20' }]}>
              <Text style={[s.skillLevelText, { color: lvlColor }]}>{item.level.toUpperCase()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderMySkills = () => (
    <>
      {renderSkillList(mySkills, 'What I Can Teach', t.accent.green)}
      {renderSkillList(myWants, 'What I Want to Learn', t.accent.orange)}

      <View style={s.addForm}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Add New</Text>

        <View style={s.addToggle}>
          <TouchableOpacity
            style={[s.addToggleBtn, addingType === 'skill' && s.addToggleActive]}
            onPress={() => setAddingType('skill')}
          >
            <Text style={[s.addToggleText, addingType === 'skill' && s.addToggleTextActive]}>I Can Teach</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.addToggleBtn, addingType === 'want' && s.addToggleActive]}
            onPress={() => setAddingType('want')}
          >
            <Text style={[s.addToggleText, addingType === 'want' && s.addToggleTextActive]}>I Want to Learn</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={s.input}
          placeholder="Skill name (e.g., Piano, Welding)"
          placeholderTextColor={t.text.muted}
          value={newSkillName}
          onChangeText={setNewSkillName}
        />

        <Text style={[s.skillCategory, { marginBottom: 6 }]}>Category</Text>
        <View style={s.categoryGrid}>
          {SKILL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.categoryChip, newSkillCategory === cat.key && s.categoryChipSelected]}
              onPress={() => setNewSkillCategory(cat.key)}
            >
              <Text style={[s.categoryChipText, newSkillCategory === cat.key && s.categoryChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.skillCategory, { marginBottom: 6 }]}>Level</Text>
        <View style={s.levelRow}>
          {(['beginner', 'intermediate', 'expert'] as const).map((lvl) => {
            const lvlColor = LEVEL_COLORS[lvl];
            return (
              <TouchableOpacity
                key={lvl}
                style={[s.levelBtn, newSkillLevel === lvl && s.levelBtnActive]}
                onPress={() => setNewSkillLevel(lvl)}
              >
                <Text style={[s.levelBtnText, { color: newSkillLevel === lvl ? lvlColor : t.text.muted }]}>
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleAddEntry}>
          <Text style={s.submitText}>{addingType === 'skill' ? 'Add Skill I Teach' : 'Add Skill I Want'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Swaps Tab ───

  const renderSwaps = () => (
    <>
      <Text style={s.sectionTitle}>Swap History</Text>
      {swaps.map((swap) => {
        const statusColor = swap.status === 'completed' ? t.accent.green
          : swap.status === 'in-progress' ? t.accent.blue
          : t.accent.orange;
        return (
          <View key={swap.id} style={s.swapCard}>
            <View style={s.swapHeader}>
              <Text style={s.swapPartner}>{swap.partnerName}</Text>
              <View style={[s.swapStatus, { backgroundColor: statusColor + '20' }]}>
                <Text style={[s.swapStatusText, { color: statusColor }]}>{swap.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={s.swapDetails}>
              <View style={s.swapSide}>
                <Text style={s.swapLabel}>I Taught</Text>
                <Text style={s.swapSkill}>{swap.iGave}</Text>
              </View>
              <View style={s.swapDivider} />
              <View style={s.swapSide}>
                <Text style={s.swapLabel}>I Learned</Text>
                <Text style={s.swapSkill}>{swap.iReceived}</Text>
              </View>
            </View>
            <Text style={s.swapMeta}>{swap.date} | {swap.hoursEach}h each</Text>
            {swap.status === 'completed' && swap.myRating > 0 && (
              <Text style={s.swapRating}>{'*'.repeat(swap.myRating)} / {'*'.repeat(swap.theirRating)}</Text>
            )}
            {swap.status === 'in-progress' && (
              <TouchableOpacity style={s.swapRateBtn} onPress={() => handleRateSwap(swap)}>
                <Text style={s.swapRateText}>Rate Swap</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );

  // ─── Skill Map Tab ───

  const renderMap = () => {
    const maxDemand = Math.max(...skillMap.map((s) => s.demandRatio));
    return (
      <>
        <Text style={s.sectionTitle}>Community Skill Map</Text>
        <View style={s.mapLegend}>
          <Text style={s.mapLegendText}>Sorted by demand (highest first)</Text>
          <Text style={s.mapLegendText}>Higher ratio = more wanted</Text>
        </View>

        <View style={s.mapCard}>
          {skillMap.map((entry) => {
            const barWidth = Math.max((entry.demandRatio / maxDemand) * 100, 10);
            const barColor = entry.demandRatio >= 3 ? t.accent.orange
              : entry.demandRatio >= 2 ? t.accent.blue
              : t.accent.green;
            return (
              <View key={entry.skill} style={s.mapRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mapSkillName}>{entry.skill}</Text>
                  <Text style={s.mapCategory}>
                    {SKILL_CATEGORIES.find((c) => c.key === entry.category)?.label || entry.category}
                  </Text>
                  <View style={[s.mapBar, { width: `${barWidth}%`, backgroundColor: barColor }]} />
                </View>
                <View style={s.mapStats}>
                  <Text style={[s.mapDemand, { color: barColor }]}>{entry.demandRatio.toFixed(1)}x</Text>
                  <Text style={s.mapSubtext}>{entry.offeredBy} teach | {entry.wantedBy} want</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[s.noMatchText, { marginBottom: 16 }]}>
          High demand skills earn more swap opportunities. Add yours!
        </Text>
      </>
    );
  };

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'match': return renderMatch();
      case 'my-skills': return renderMySkills();
      case 'swaps': return renderSwaps();
      case 'map': return renderMap();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Skill Swap</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabDefs.map((td) => (
          <TouchableOpacity
            key={td.key}
            style={[s.tabBtn, tab === td.key && s.tabActive]}
            onPress={() => setTab(td.key)}
          >
            <Text style={[s.tabText, tab === td.key && s.tabTextActive]}>{td.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
