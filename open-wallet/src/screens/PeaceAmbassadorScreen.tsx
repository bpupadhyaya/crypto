import { fonts } from '../utils/theme';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'program' | 'missions' | 'impact';

interface Props {
  onClose: () => void;
}

interface ProgramLevel {
  id: string;
  level: number;
  title: string;
  description: string;
  requirement: string;
  otkReward: number;
  achieved: boolean;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  otkReward: number;
  deadline: string;
  status: 'available' | 'in-progress' | 'completed';
  participants: number;
}

interface ImpactMetric {
  label: string;
  value: string;
  description: string;
}

const DEMO_LEVELS: ProgramLevel[] = [
  { id: '1', level: 1, title: 'Peace Listener', description: 'Learn to listen deeply and without judgment. The foundation of all peace work.', requirement: 'Complete 5 active listening sessions', otkReward: 50, achieved: true },
  { id: '2', level: 2, title: 'Peace Speaker', description: 'Express truth with compassion. Learn non-violent communication techniques.', requirement: 'Facilitate 3 dialogue sessions', otkReward: 100, achieved: true },
  { id: '3', level: 3, title: 'Peace Mediator', description: 'Help others resolve conflicts through structured mediation.', requirement: 'Successfully mediate 5 disputes', otkReward: 200, achieved: false },
  { id: '4', level: 4, title: 'Peace Builder', description: 'Create lasting peace infrastructure in your community.', requirement: 'Establish 1 peace zone + train 3 new listeners', otkReward: 500, achieved: false },
  { id: '5', level: 5, title: 'Peace Ambassador (Art X)', description: 'Lead peace initiatives across communities. The highest honor in the peace program.', requirement: 'Impact 100+ people + maintain 12-month peace record', otkReward: 1000, achieved: false },
];

const DEMO_MISSIONS: Mission[] = [
  { id: '1', title: 'Neighborhood Listening Walk', description: 'Walk through your neighborhood and have 5 genuine conversations with people you don\'t usually talk to.', category: 'Listening', difficulty: 'beginner', otkReward: 30, deadline: '2026-04-15', status: 'available', participants: 45 },
  { id: '2', title: 'Conflict Journal - 7 Days', description: 'Keep a journal for 7 days noting every conflict you witness or experience, and reflect on root causes.', category: 'Awareness', difficulty: 'beginner', otkReward: 40, deadline: '2026-04-10', status: 'in-progress', participants: 78 },
  { id: '3', title: 'Cross-Community Dialogue', description: 'Organize a dialogue session between two groups that typically don\'t interact.', category: 'Mediation', difficulty: 'intermediate', otkReward: 150, deadline: '2026-04-30', status: 'available', participants: 12 },
  { id: '4', title: 'Peace Zone Proposal', description: 'Write and submit a proposal to establish a new peace zone in an area that needs one.', category: 'Building', difficulty: 'advanced', otkReward: 250, deadline: '2026-05-15', status: 'available', participants: 5 },
  { id: '5', title: 'Youth Peace Workshop', description: 'Design and deliver a 2-hour peace workshop for young people ages 12-18.', category: 'Education', difficulty: 'intermediate', otkReward: 200, deadline: '2026-04-20', status: 'completed', participants: 23 },
  { id: '6', title: 'Gratitude Chain Letter', description: 'Start a gratitude chain: write to 3 people, ask each to write to 3 more. Track the chain.', category: 'Connection', difficulty: 'beginner', otkReward: 60, deadline: '2026-04-08', status: 'in-progress', participants: 156 },
];

const DEMO_IMPACT: ImpactMetric[] = [
  { label: 'People Reached', value: '247', description: 'Individuals directly impacted by your peace work' },
  { label: 'Conflicts Resolved', value: '8', description: 'Disputes where you helped find resolution' },
  { label: 'Peace Hours', value: '124', description: 'Hours dedicated to peace activities' },
  { label: 'OTK Earned (Peace)', value: '890', description: 'OTK earned through peace ambassador activities' },
  { label: 'Missions Completed', value: '12', description: 'Peace missions successfully finished' },
  { label: 'Community Rating', value: '4.8/5', description: 'Average feedback score from mission participants' },
];

const PEACE_PRINCIPLES = [
  'Listen before you speak. Understand before you judge.',
  'Every conflict is an opportunity to build stronger connection.',
  'Peace is not the absence of conflict — it is the presence of justice.',
  'One person choosing peace creates ripples that reach the whole world.',
];

export function PeaceAmbassadorScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('program');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: 16, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: 14, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: fonts.semibold },
        content: { flex: 1 },
        levelCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        levelCardAchieved: { borderColor: t.accent.green, backgroundColor: t.accent.green + '08' },
        levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
        levelTitle: { fontSize: 15, fontWeight: fonts.bold, color: t.text.primary },
        levelBadge: { fontSize: 11, fontWeight: fonts.semibold },
        levelDesc: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 6 },
        levelReq: { fontSize: 12, color: t.accent.green, marginBottom: 4 },
        levelReward: { fontSize: 12, fontWeight: fonts.semibold, color: t.accent.green },
        missionCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        missionTitle: { fontSize: 15, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
        missionDesc: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        missionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
        metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: t.bg.primary },
        metaChipText: { fontSize: 11, color: t.text.secondary },
        missionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        missionOtk: { fontSize: 13, fontWeight: fonts.semibold, color: t.accent.green },
        missionParticipants: { fontSize: 12, color: t.text.secondary },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
        statusText: { fontSize: 11, fontWeight: fonts.semibold },
        impactCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        impactValue: { fontSize: 24, fontWeight: fonts.bold, color: t.accent.green, marginBottom: 2 },
        impactLabel: { fontSize: 14, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 2 },
        impactDesc: { fontSize: 12, color: t.text.secondary },
        principleCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: t.accent.green + '10', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: t.accent.green },
        principleText: { fontSize: 14, fontStyle: 'italic', color: t.text.primary, lineHeight: 20 },
        sectionLabel: { fontSize: 14, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: 13, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const missionStatus = (status: string) => {
    if (status === 'completed') return { bg: t.accent.green + '20', color: t.accent.green };
    if (status === 'in-progress') return { bg: '#FF980020', color: '#FF9800' };
    return { bg: t.accent.green + '20', color: t.accent.green };
  };

  const renderMission = useCallback(
    ({ item }: { item: Mission }) => {
      const s = missionStatus(item.status);
      return (
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>{item.title}</Text>
          <Text style={styles.missionDesc}>{item.description}</Text>
          <View style={styles.missionMeta}>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>{item.category}</Text></View>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>{item.difficulty}</Text></View>
            <View style={styles.metaChip}><Text style={styles.metaChipText}>Due {item.deadline}</Text></View>
          </View>
          <View style={styles.missionFooter}>
            <Text style={styles.missionOtk}>{item.otkReward} OTK</Text>
            <Text style={styles.missionParticipants}>{item.participants} joined</Text>
            <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusText, { color: s.color }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      );
    },
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'program':
        return (
          <ScrollView>
            <Text style={styles.sectionLabel}>Ambassador Levels</Text>
            {(demoMode ? DEMO_LEVELS : []).map((level) => (
              <View key={level.id} style={[styles.levelCard, level.achieved && styles.levelCardAchieved]}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelTitle}>Level {level.level}: {level.title}</Text>
                  <Text style={[styles.levelBadge, { color: level.achieved ? t.accent.green : t.text.secondary }]}>
                    {level.achieved ? 'ACHIEVED' : 'LOCKED'}
                  </Text>
                </View>
                <Text style={styles.levelDesc}>{level.description}</Text>
                <Text style={styles.levelReq}>Requirement: {level.requirement}</Text>
                <Text style={styles.levelReward}>Reward: {level.otkReward} OTK</Text>
              </View>
            ))}
            {!demoMode && <View style={styles.emptyState}><Text style={styles.emptyText}>Enable demo mode to see program levels</Text></View>}
            <View style={styles.listFooter} />
          </ScrollView>
        );

      case 'missions':
        return (
          <FlatList
            data={demoMode ? DEMO_MISSIONS : []}
            keyExtractor={(item) => item.id}
            renderItem={renderMission}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Peace Missions</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No missions available</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'impact':
        return (
          <ScrollView>
            <Text style={styles.sectionLabel}>Your Peace Impact</Text>
            {(demoMode ? DEMO_IMPACT : []).map((metric) => (
              <View key={metric.label} style={styles.impactCard}>
                <Text style={styles.impactValue}>{metric.value}</Text>
                <Text style={styles.impactLabel}>{metric.label}</Text>
                <Text style={styles.impactDesc}>{metric.description}</Text>
              </View>
            ))}
            <Text style={styles.sectionLabel}>Peace Principles</Text>
            {PEACE_PRINCIPLES.map((principle, idx) => (
              <View key={idx} style={styles.principleCard}>
                <Text style={styles.principleText}>"{principle}"</Text>
              </View>
            ))}
            {!demoMode && <View style={styles.emptyState}><Text style={styles.emptyText}>No impact data yet</Text></View>}
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'program', label: 'Program' },
    { key: 'missions', label: 'Missions' },
    { key: 'impact', label: 'Impact' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Peace Ambassador</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
