import { fonts } from '../utils/theme';
/**
 * Future Vision Screen — The Human Constitution's vision for 2030 and 2035.
 *
 * Tracks progress toward 2030 and 2035 goals, personal contributions,
 * and a community pledge wall for collective commitment.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface VisionGoal {
  id: string;
  title: string;
  description: string;
  progressPct: number;
  myContribution: string;
  milestones: string[];
}

interface Pledge {
  id: string;
  uid: string;
  name: string;
  message: string;
  date: string;
}

type TabKey = '2030' | '2035' | 'my-contribution' | 'pledge';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const GOALS_2030: VisionGoal[] = [
  {
    id: 'g30_01', title: 'Universal Nurture Tracking',
    description: 'Every child on Open Chain has a Living Ledger documenting care received.',
    progressPct: 42, myContribution: 'Tracked 2 children, mentored 1 parent',
    milestones: ['100K children tracked', 'Nurture scoring live', '50 regions active'],
  },
  {
    id: 'g30_02', title: 'One Million Universal IDs',
    description: 'One million verified humans on Open Chain with sovereign identity.',
    progressPct: 31, myContribution: 'Onboarded 8 community members',
    milestones: ['500K UIDs issued', 'PQC encryption standard', 'Biometric verification'],
  },
  {
    id: 'g30_03', title: 'Peace Index in 50 Regions',
    description: 'Active Peace Index measurement and conflict resolution in 50+ regions.',
    progressPct: 24, myContribution: 'Participated in 3 restorative circles',
    milestones: ['12 regions active', '30 regions by mid-2028', '50 regions by 2030'],
  },
  {
    id: 'g30_04', title: 'Zero-Cost Education Platform',
    description: 'Free, high-quality education accessible to every Open Chain member.',
    progressPct: 48, myContribution: 'Created 2 courses, mentored 5 students',
    milestones: ['1,000 courses', 'Peer review system', 'Credential verification'],
  },
  {
    id: 'g30_05', title: 'Community Governance in 100 Councils',
    description: 'Democratic self-governance operating in 100 local councils.',
    progressPct: 30, myContribution: 'Active in 1 council, voted on 12 proposals',
    milestones: ['25 councils operational', '50 by 2028', '100 by 2030'],
  },
];

const GOALS_2035: VisionGoal[] = [
  {
    id: 'g35_01', title: '10 Million Connected Humans',
    description: 'A global network of 10M humans cooperating through Open Chain.',
    progressPct: 8, myContribution: 'Ambassador in my region',
    milestones: ['1M by 2030', '5M by 2033', '10M by 2035'],
  },
  {
    id: 'g35_02', title: 'Self-Sustaining OTK Economy',
    description: 'OTK as a functional medium of exchange for basic human needs.',
    progressPct: 12, myContribution: 'Traded 200 OTK for real goods',
    milestones: ['10K active traders', 'Cross-border exchange', 'Stable value floor'],
  },
  {
    id: 'g35_03', title: 'Intergenerational Wealth Transfer',
    description: 'Every person can pass knowledge, values, and resources to next generation.',
    progressPct: 6, myContribution: 'Created Living Ledger for 2 children',
    milestones: ['Legacy tools built', 'Ancestry chain complete', '100K legacy plans'],
  },
  {
    id: 'g35_04', title: 'Global Conflict Early Warning',
    description: 'AI-assisted early warning system preventing conflicts before they escalate.',
    progressPct: 15, myContribution: 'Submitted 3 incident reports',
    milestones: ['Data pipeline built', 'Pattern detection live', '20 conflicts prevented'],
  },
  {
    id: 'g35_05', title: 'Constitution Ratified by 1M',
    description: 'The Human Constitution signed and upheld by one million people.',
    progressPct: 18, myContribution: 'Signed constitution, recruited 5 signatories',
    milestones: ['Draft ratified', '100K signatories', '1M signatories'],
  },
];

const DEMO_PLEDGES: Pledge[] = [
  { id: 'p01', uid: 'uid_demo_self', name: 'Bhim', message: 'I pledge to nurture every child I can reach.', date: '2026-03-20' },
  { id: 'p02', uid: 'uid_002', name: 'Priya S.', message: 'Education is freedom. I commit to teaching 10 people this year.', date: '2026-03-18' },
  { id: 'p03', uid: 'uid_003', name: 'Carlos R.', message: 'Peace begins at home. I will resolve conflicts with compassion.', date: '2026-03-15' },
  { id: 'p04', uid: 'uid_004', name: 'Amina K.', message: 'Every elder deserves dignity. I pledge my time to eldercare.', date: '2026-03-12' },
  { id: 'p05', uid: 'uid_005', name: 'Wei L.', message: 'I will plant 100 trees and track every one on Open Chain.', date: '2026-03-10' },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: '2030', label: '2030' },
  { key: '2035', label: '2035' },
  { key: 'my-contribution', label: 'My Part' },
  { key: 'pledge', label: 'Pledge' },
];

// --- Component ---

export function FutureVisionScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [activeTab, setActiveTab] = useState<TabKey>('2030');
  const [pledges, setPledges] = useState(DEMO_PLEDGES);
  const [newPledge, setNewPledge] = useState('');

  const overall2030 = useMemo(
    () => Math.round(GOALS_2030.reduce((s, g) => s + g.progressPct, 0) / GOALS_2030.length),
    [],
  );

  const overall2035 = useMemo(
    () => Math.round(GOALS_2035.reduce((s, g) => s + g.progressPct, 0) / GOALS_2035.length),
    [],
  );

  const pctColor = (pct: number) => {
    if (pct >= 40) return '#22c55e';
    if (pct >= 20) return '#f59e0b';
    return '#ef4444';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
    tabText: { fontSize: 13, color: t.text.secondary },
    tabTextActive: { color: t.accent.green, fontWeight: fonts.semibold },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 8 },
    overallBox: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20,
      alignItems: 'center', borderWidth: 1, borderColor: t.border, marginBottom: 12,
    },
    bigPct: { fontSize: 42, fontWeight: fonts.heavy },
    overallLabel: { fontSize: 14, color: t.text.secondary, marginTop: 4 },
    card: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 12, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    value: { fontSize: 15, color: t.text.primary, fontWeight: fonts.semibold },
    label: { fontSize: 13, color: t.text.secondary },
    desc: { fontSize: 12, color: t.text.secondary, lineHeight: 18, marginTop: 4 },
    bar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    barFill: { height: 6, borderRadius: 3 },
    milestoneChip: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: t.bg.primary, marginRight: 6, marginTop: 6,
    },
    milestoneText: { fontSize: 11, color: t.text.primary },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    contribution: {
      fontSize: 12, color: t.accent.green, fontWeight: fonts.medium,
      marginTop: 8, fontStyle: 'italic',
    },
    pledgeCard: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: t.border,
      borderLeftWidth: 4, borderLeftColor: t.accent.green,
    },
    pledgeName: { fontSize: 14, fontWeight: fonts.semibold, color: t.text.primary },
    pledgeMessage: { fontSize: 13, color: t.text.primary, lineHeight: 20, marginTop: 4 },
    pledgeDate: { fontSize: 11, color: t.text.secondary, marginTop: 4 },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 8,
      padding: 10, fontSize: 14, color: t.text.primary, marginBottom: 10,
      backgroundColor: t.bg.card, minHeight: 60, textAlignVertical: 'top',
    },
    button: {
      backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 12,
      alignItems: 'center', marginTop: 4,
    },
    buttonText: { color: '#fff', fontWeight: fonts.semibold, fontSize: 15 },
    buttonDisabled: { opacity: 0.5 },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20 },
  }), [t]);

  const renderGoals = (goals: VisionGoal[], year: string, overallPct: number) => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <View style={styles.overallBox}>
          <Text style={[styles.bigPct, { color: pctColor(overallPct) }]}>{overallPct}%</Text>
          <Text style={styles.overallLabel}>{year} Vision Progress</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{year} Goals ({goals.length})</Text>
        {goals.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.value, { flex: 1 }]}>{g.title}</Text>
              <Text style={[styles.value, { color: pctColor(g.progressPct) }]}>
                {g.progressPct}%
              </Text>
            </View>
            <Text style={styles.desc}>{g.description}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, {
                width: `${g.progressPct}%`, backgroundColor: pctColor(g.progressPct),
              }]} />
            </View>
            <View style={styles.chipRow}>
              {g.milestones.map((m, i) => (
                <View key={i} style={styles.milestoneChip}>
                  <Text style={styles.milestoneText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderMyContribution = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Contributions to 2030 Goals</Text>
        {GOALS_2030.map((g) => (
          <View key={g.id} style={styles.card}>
            <Text style={styles.value}>{g.title}</Text>
            <Text style={styles.contribution}>{g.myContribution}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, {
                width: `${g.progressPct}%`, backgroundColor: pctColor(g.progressPct),
              }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Contributions to 2035 Goals</Text>
        {GOALS_2035.map((g) => (
          <View key={g.id} style={styles.card}>
            <Text style={styles.value}>{g.title}</Text>
            <Text style={styles.contribution}>{g.myContribution}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, {
                width: `${g.progressPct}%`, backgroundColor: pctColor(g.progressPct),
              }]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const handleAddPledge = () => {
    if (!newPledge.trim()) return;
    const p: Pledge = {
      id: `p_${Date.now()}`, uid: 'uid_demo_self', name: 'You',
      message: newPledge.trim(), date: '2026-03-30',
    };
    setPledges((prev) => [p, ...prev]);
    setNewPledge('');
  };

  const renderPledge = () => (
    <ScrollView style={styles.scroll}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Pledge Wall</Text>
        <Text style={styles.infoText}>
          Sign your commitment to the Human Constitution's vision.
          Each pledge is recorded on Open Chain as a permanent declaration.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Write your pledge</Text>
        <TextInput
          style={styles.input}
          placeholder="I pledge to..."
          placeholderTextColor={t.text.secondary}
          value={newPledge}
          onChangeText={setNewPledge}
          multiline
        />
        <TouchableOpacity
          style={[styles.button, !newPledge.trim() && styles.buttonDisabled]}
          onPress={handleAddPledge}
          disabled={!newPledge.trim()}
        >
          <Text style={styles.buttonText}>Sign Pledge</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Pledges ({pledges.length})</Text>
        {pledges.map((p) => (
          <View key={p.id} style={styles.pledgeCard}>
            <Text style={styles.pledgeName}>{p.name}</Text>
            <Text style={styles.pledgeMessage}>"{p.message}"</Text>
            <Text style={styles.pledgeDate}>{p.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Future Vision</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === '2030' && renderGoals(GOALS_2030, '2030', overall2030)}
      {activeTab === '2035' && renderGoals(GOALS_2035, '2035', overall2035)}
      {activeTab === 'my-contribution' && renderMyContribution()}
      {activeTab === 'pledge' && renderPledge()}
    </SafeAreaView>
  );
}
