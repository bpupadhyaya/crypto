import { fonts } from '../utils/theme';
/**
 * Apprenticeship Screen — Trade apprenticeships, learn-by-doing programs.
 *
 * Article I: "Every person has the right to learn a trade and earn a livelihood
 *  through meaningful work. Masters pass knowledge; apprentices carry it forward."
 * — Human Constitution
 *
 * eOTK = education tokens (stipends for learning)
 * xOTK = experience tokens (earned by masters for teaching)
 *
 * Features:
 * - Available apprenticeships (carpentry, plumbing, electrical, welding, farming, cooking, tailoring)
 * - Apprenticeship detail (master, duration, skills learned, eOTK stipend)
 * - Apply for apprenticeship
 * - My apprenticeship progress (milestones, skills acquired, hours completed)
 * - Master craftsperson profiles (experience, apprentices trained, xOTK earned)
 * - Graduation ceremony (on-chain soulbound trade certificate)
 * - Demo: 4 available, 1 active at 45%, 2 masters
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface Apprenticeship {
  id: string;
  trade: string;
  icon: string;
  masterName: string;
  masterUid: string;
  durationWeeks: number;
  skillsLearned: string[];
  eOTKStipend: number;
  spotsAvailable: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

interface ActiveApprenticeship {
  id: string;
  trade: string;
  masterName: string;
  startDate: string;
  progressPercent: number;
  hoursCompleted: number;
  totalHours: number;
  skillsAcquired: string[];
  milestones: Milestone[];
  eOTKEarned: number;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
  eOTK: number;
}

interface MasterProfile {
  uid: string;
  name: string;
  trade: string;
  yearsExperience: number;
  apprenticesTrained: number;
  xOTKEarned: number;
  rating: number;
  bio: string;
  certifications: string[];
  available: boolean;
}

// ─── Constants ───

const TRADES = [
  { key: 'carpentry', label: 'Carpentry', icon: 'C' },
  { key: 'plumbing', label: 'Plumbing', icon: 'P' },
  { key: 'electrical', label: 'Electrical', icon: 'E' },
  { key: 'welding', label: 'Welding', icon: 'W' },
  { key: 'farming', label: 'Farming', icon: 'F' },
  { key: 'cooking', label: 'Cooking', icon: 'K' },
  { key: 'tailoring', label: 'Tailoring', icon: 'T' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_APPRENTICESHIPS: Apprenticeship[] = [
  {
    id: 'ap1', trade: 'Carpentry', icon: 'C', masterName: 'Henrik Larsson', masterUid: 'uid-master-001',
    durationWeeks: 24, skillsLearned: ['Joinery', 'Cabinet making', 'Wood finishing', 'Blueprint reading'],
    eOTKStipend: 2400, spotsAvailable: 2, difficulty: 'beginner',
    description: 'Learn traditional carpentry from raw timber to finished furniture. Hands-on from day one.',
  },
  {
    id: 'ap2', trade: 'Electrical', icon: 'E', masterName: 'Rosa Gutierrez', masterUid: 'uid-master-002',
    durationWeeks: 32, skillsLearned: ['Wiring', 'Circuit design', 'Safety codes', 'Solar panel install'],
    eOTKStipend: 3200, spotsAvailable: 1, difficulty: 'intermediate',
    description: 'Residential and solar electrical work. Includes NEC code training and hands-on panel installation.',
  },
  {
    id: 'ap3', trade: 'Farming', icon: 'F', masterName: 'Amara Okafor', masterUid: 'uid-master-003',
    durationWeeks: 20, skillsLearned: ['Crop rotation', 'Soil management', 'Irrigation', 'Harvest techniques'],
    eOTKStipend: 2000, spotsAvailable: 3, difficulty: 'beginner',
    description: 'Sustainable farming practices from seed to market. Organic methods, permaculture principles.',
  },
  {
    id: 'ap4', trade: 'Welding', icon: 'W', masterName: 'Dmitri Volkov', masterUid: 'uid-master-004',
    durationWeeks: 28, skillsLearned: ['MIG welding', 'TIG welding', 'Structural welding', 'Metal fabrication'],
    eOTKStipend: 2800, spotsAvailable: 1, difficulty: 'advanced',
    description: 'Industrial welding certification track. MIG, TIG, and structural welding for real-world applications.',
  },
];

const DEMO_ACTIVE: ActiveApprenticeship = {
  id: 'active-1', trade: 'Carpentry', masterName: 'Henrik Larsson',
  startDate: '2026-01-10', progressPercent: 45, hoursCompleted: 216, totalHours: 480,
  skillsAcquired: ['Basic joinery', 'Wood selection', 'Hand tool mastery'],
  milestones: [
    { id: 'm1', title: 'Built first dovetail joint', completed: true, date: '2026-01-28', eOTK: 200 },
    { id: 'm2', title: 'Completed tool safety certification', completed: true, date: '2026-02-10', eOTK: 150 },
    { id: 'm3', title: 'First solo bookshelf project', completed: true, date: '2026-03-01', eOTK: 300 },
    { id: 'm4', title: 'Cabinet door assembly', completed: false, eOTK: 250 },
    { id: 'm5', title: 'Final project: dining table', completed: false, eOTK: 500 },
  ],
  eOTKEarned: 650,
};

const DEMO_MASTERS: MasterProfile[] = [
  {
    uid: 'uid-master-001', name: 'Henrik Larsson', trade: 'Carpentry',
    yearsExperience: 28, apprenticesTrained: 42, xOTKEarned: 126000, rating: 4.9,
    bio: 'Third-generation carpenter from Sweden. Specializes in traditional Scandinavian joinery and sustainable wood sourcing.',
    certifications: ['Master Carpenter Guild', 'Sustainable Forestry', 'Heritage Restoration'],
    available: true,
  },
  {
    uid: 'uid-master-002', name: 'Rosa Gutierrez', trade: 'Electrical',
    yearsExperience: 19, apprenticesTrained: 31, xOTKEarned: 93000, rating: 4.8,
    bio: 'Licensed electrician and solar energy specialist. Passionate about bringing clean energy skills to the next generation.',
    certifications: ['Master Electrician License', 'NABCEP Solar', 'NEC Code Instructor'],
    available: true,
  },
];

// ─── Helpers ───

const formatDuration = (weeks: number): string => {
  if (weeks >= 52) return `${Math.floor(weeks / 52)}y ${weeks % 52}w`;
  return `${weeks} weeks`;
};

const progressBar = (percent: number, color: string): string => {
  const filled = Math.round(percent / 10);
  return '|'.repeat(filled) + '.'.repeat(10 - filled);
};

type Tab = 'browse' | 'my-progress' | 'masters' | 'apply';

export function ApprenticeshipScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedApprenticeship, setSelectedApprenticeship] = useState<Apprenticeship | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<MasterProfile | null>(null);
  const [applyTrade, setApplyTrade] = useState('');
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyExperience, setApplyExperience] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const apprenticeships = DEMO_APPRENTICESHIPS;
  const activeApprenticeship = DEMO_ACTIVE;
  const masters = DEMO_MASTERS;

  const handleApply = useCallback(() => {
    if (!applyTrade) { Alert.alert('Required', 'Select a trade to apply for.'); return; }
    if (!applyMotivation.trim()) { Alert.alert('Required', 'Tell us why you want to learn this trade.'); return; }

    Alert.alert(
      'Application Submitted',
      `Your application for ${applyTrade} apprenticeship has been sent to the master craftsperson.\n\nYou'll receive a response within 48 hours.`,
    );
    setApplyTrade('');
    setApplyMotivation('');
    setApplyExperience('');
    setTab('browse');
  }, [applyTrade, applyMotivation]);

  const handleGraduation = useCallback(() => {
    Alert.alert(
      'Graduation Ceremony',
      'Your soulbound trade certificate will be minted on-chain upon completing all milestones.\n\nThis certificate is non-transferable and permanently proves your trade mastery.',
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
    tabActive: { backgroundColor: t.accent.orange + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.orange },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tradeName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    masterLabel: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    skillTag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 6, marginBottom: 6 },
    skillText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold },
    skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    stipend: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold },
    stipendLabel: { color: t.text.muted, fontSize: 11 },
    diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    spots: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    desc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
    applyBtn: { backgroundColor: t.accent.orange, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    applyBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    detailBack: { color: t.accent.blue, fontSize: 14, marginBottom: 12, marginHorizontal: 20 },
    // Progress
    progressHeader: { alignItems: 'center', marginBottom: 16 },
    progressPercent: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy },
    progressLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    progressBar: { height: 8, backgroundColor: t.bg.card, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.orange },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    milestoneItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    milestoneCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    milestoneTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    milestoneDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    milestoneEOTK: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    gradBtn: { backgroundColor: t.accent.purple + '30', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    gradBtnText: { color: t.accent.purple, fontSize: 15, fontWeight: fonts.bold },
    // Masters
    masterCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    masterName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    masterTrade: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    masterBio: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
    masterStat: { alignItems: 'center' },
    masterStatVal: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    masterStatLbl: { color: t.text.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
    certTag: { backgroundColor: t.accent.purple + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 6, marginBottom: 6 },
    certText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold },
    availBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    availText: { fontSize: 11, fontWeight: fonts.bold },
    // Apply form
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: t.text.primary, fontSize: 15 },
    textArea: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: t.text.primary, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
    tradeSelector: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    tradePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, marginBottom: 8, backgroundColor: t.bg.card },
    tradePillActive: { backgroundColor: t.accent.orange + '20' },
    tradePillText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tradePillTextActive: { color: t.accent.orange },
    durationText: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    ratingText: { color: '#FF9500', fontSize: 13, fontWeight: fonts.semibold },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent.orange + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconText: { color: t.accent.orange, fontSize: 18, fontWeight: fonts.heavy },
  }), [t]);

  // ─── Detail view for a single apprenticeship ───
  if (selectedApprenticeship) {
    const ap = selectedApprenticeship;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Apprenticeship Detail</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSelectedApprenticeship(null)}>
          <Text style={s.detailBack}>Back to Browse</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.tradeName}>{ap.trade}</Text>
                <Text style={s.masterLabel}>Master: {ap.masterName}</Text>
                <Text style={s.durationText}>{formatDuration(ap.durationWeeks)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.stipend}>{ap.eOTKStipend.toLocaleString()} eOTK</Text>
                <Text style={s.stipendLabel}>total stipend</Text>
              </View>
            </View>
            <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[ap.difficulty] }]}>
              <Text style={s.diffText}>{ap.difficulty}</Text>
            </View>
            <Text style={s.desc}>{ap.description}</Text>
            <View style={s.skillRow}>
              {ap.skillsLearned.map((sk) => (
                <View key={sk} style={s.skillTag}><Text style={s.skillText}>{sk}</Text></View>
              ))}
            </View>
            <Text style={s.spots}>{ap.spotsAvailable} spot{ap.spotsAvailable !== 1 ? 's' : ''} available</Text>
            <TouchableOpacity style={s.applyBtn} onPress={() => { setApplyTrade(ap.trade); setTab('apply'); setSelectedApprenticeship(null); }}>
              <Text style={s.applyBtnText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Detail view for a master ───
  if (selectedMaster) {
    const m = selectedMaster;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Master Profile</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSelectedMaster(null)}>
          <Text style={s.detailBack}>Back to Masters</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.masterCard}>
            <Text style={s.masterName}>{m.name}</Text>
            <Text style={s.masterTrade}>{m.trade} Master</Text>
            <Text style={s.ratingText}>{'*'.repeat(Math.round(m.rating))} {m.rating}</Text>
            <Text style={s.masterBio}>{m.bio}</Text>
            <View style={[s.statRow, { marginTop: 16 }]}>
              <View style={s.masterStat}>
                <Text style={s.masterStatVal}>{m.yearsExperience}</Text>
                <Text style={s.masterStatLbl}>Years Exp.</Text>
              </View>
              <View style={s.masterStat}>
                <Text style={s.masterStatVal}>{m.apprenticesTrained}</Text>
                <Text style={s.masterStatLbl}>Apprentices{'\n'}Trained</Text>
              </View>
              <View style={s.masterStat}>
                <Text style={[s.masterStatVal, { color: t.accent.green }]}>{(m.xOTKEarned / 1000).toFixed(0)}k</Text>
                <Text style={s.masterStatLbl}>xOTK{'\n'}Earned</Text>
              </View>
            </View>
            <View style={[s.skillRow, { marginTop: 16 }]}>
              {m.certifications.map((c) => (
                <View key={c} style={s.certTag}><Text style={s.certText}>{c}</Text></View>
              ))}
            </View>
            <View style={[s.availBadge, { backgroundColor: m.available ? t.accent.green + '20' : t.text.muted + '20', marginTop: 12, alignSelf: 'flex-start' }]}>
              <Text style={[s.availText, { color: m.available ? t.accent.green : t.text.muted }]}>
                {m.available ? 'Accepting Apprentices' : 'Not Available'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Apprenticeships</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {([
          { key: 'browse' as Tab, label: 'Browse' },
          { key: 'my-progress' as Tab, label: 'My Progress' },
          { key: 'masters' as Tab, label: 'Masters' },
          { key: 'apply' as Tab, label: 'Apply' },
        ]).map((t) => (
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
        {/* ── Browse ── */}
        {tab === 'browse' && (
          <>
            <Text style={s.sectionTitle}>Available Apprenticeships</Text>
            {apprenticeships.map((ap) => (
              <TouchableOpacity key={ap.id} style={s.card} onPress={() => setSelectedApprenticeship(ap)}>
                <View style={[s.row, { marginBottom: 4 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={s.iconCircle}><Text style={s.iconText}>{ap.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tradeName}>{ap.trade}</Text>
                      <Text style={s.masterLabel}>Master: {ap.masterName}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.stipend}>{ap.eOTKStipend.toLocaleString()}</Text>
                    <Text style={s.stipendLabel}>eOTK stipend</Text>
                  </View>
                </View>
                <View style={[s.row, { marginTop: 6 }]}>
                  <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[ap.difficulty] }]}>
                    <Text style={s.diffText}>{ap.difficulty}</Text>
                  </View>
                  <Text style={s.durationText}>{formatDuration(ap.durationWeeks)}</Text>
                  <Text style={s.spots}>{ap.spotsAvailable} spot{ap.spotsAvailable !== 1 ? 's' : ''}</Text>
                </View>
                <View style={s.skillRow}>
                  {ap.skillsLearned.slice(0, 3).map((sk) => (
                    <View key={sk} style={s.skillTag}><Text style={s.skillText}>{sk}</Text></View>
                  ))}
                  {ap.skillsLearned.length > 3 && (
                    <View style={s.skillTag}><Text style={s.skillText}>+{ap.skillsLearned.length - 3}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── My Progress ── */}
        {tab === 'my-progress' && (
          <>
            <View style={s.card}>
              <View style={s.progressHeader}>
                <Text style={s.progressPercent}>{activeApprenticeship.progressPercent}%</Text>
                <Text style={s.progressLabel}>Apprenticeship Progress</Text>
              </View>
              <Text style={[s.tradeName, { textAlign: 'center' }]}>{activeApprenticeship.trade}</Text>
              <Text style={[s.masterLabel, { textAlign: 'center' }]}>with {activeApprenticeship.masterName}</Text>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${activeApprenticeship.progressPercent}%` }]} />
              </View>
              <View style={s.statRow}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{activeApprenticeship.hoursCompleted}</Text>
                  <Text style={s.statLabel}>Hours Done</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{activeApprenticeship.totalHours}</Text>
                  <Text style={s.statLabel}>Total Hours</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: t.accent.green }]}>{activeApprenticeship.eOTKEarned}</Text>
                  <Text style={s.statLabel}>eOTK Earned</Text>
                </View>
              </View>
            </View>

            <Text style={s.sectionTitle}>Skills Acquired</Text>
            <View style={[s.card, { paddingVertical: 12 }]}>
              <View style={s.skillRow}>
                {activeApprenticeship.skillsAcquired.map((sk) => (
                  <View key={sk} style={s.skillTag}><Text style={s.skillText}>{sk}</Text></View>
                ))}
              </View>
            </View>

            <Text style={s.sectionTitle}>Milestones</Text>
            <View style={s.card}>
              {activeApprenticeship.milestones.map((m) => (
                <View key={m.id} style={s.milestoneItem}>
                  <View style={[s.milestoneCheck, {
                    borderColor: m.completed ? t.accent.green : t.text.muted,
                    backgroundColor: m.completed ? t.accent.green + '20' : 'transparent',
                  }]}>
                    {m.completed && <Text style={{ color: t.accent.green, fontWeight: fonts.heavy, fontSize: 12 }}>+</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.milestoneTitle, !m.completed && { color: t.text.muted }]}>{m.title}</Text>
                    {m.date && <Text style={s.milestoneDate}>{m.date}</Text>}
                  </View>
                  <Text style={s.milestoneEOTK}>{m.eOTK} eOTK</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.gradBtn} onPress={handleGraduation}>
              <Text style={s.gradBtnText}>Graduation Certificate (on completion)</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Masters ── */}
        {tab === 'masters' && (
          <>
            <Text style={s.sectionTitle}>Master Craftspersons</Text>
            {masters.map((m) => (
              <TouchableOpacity key={m.uid} style={s.masterCard} onPress={() => setSelectedMaster(m)}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.masterName}>{m.name}</Text>
                    <Text style={s.masterTrade}>{m.trade} Master</Text>
                  </View>
                  <View style={[s.availBadge, { backgroundColor: m.available ? t.accent.green + '20' : t.text.muted + '20' }]}>
                    <Text style={[s.availText, { color: m.available ? t.accent.green : t.text.muted }]}>
                      {m.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
                <Text style={s.ratingText}>{'*'.repeat(Math.round(m.rating))} {m.rating}</Text>
                <View style={[s.statRow, { marginTop: 12 }]}>
                  <View style={s.masterStat}>
                    <Text style={s.masterStatVal}>{m.yearsExperience}y</Text>
                    <Text style={s.masterStatLbl}>Experience</Text>
                  </View>
                  <View style={s.masterStat}>
                    <Text style={s.masterStatVal}>{m.apprenticesTrained}</Text>
                    <Text style={s.masterStatLbl}>Trained</Text>
                  </View>
                  <View style={s.masterStat}>
                    <Text style={[s.masterStatVal, { color: t.accent.green }]}>{(m.xOTKEarned / 1000).toFixed(0)}k</Text>
                    <Text style={s.masterStatLbl}>xOTK</Text>
                  </View>
                </View>
                <View style={[s.skillRow, { marginTop: 10 }]}>
                  {m.certifications.map((c) => (
                    <View key={c} style={s.certTag}><Text style={s.certText}>{c}</Text></View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── Apply ── */}
        {tab === 'apply' && (
          <>
            <Text style={s.sectionTitle}>Apply for Apprenticeship</Text>
            <View style={s.card}>
              <Text style={s.inputLabel}>Select Trade</Text>
              <View style={s.tradeSelector}>
                {TRADES.map((tr) => (
                  <TouchableOpacity
                    key={tr.key}
                    style={[s.tradePill, applyTrade === tr.label && s.tradePillActive]}
                    onPress={() => setApplyTrade(tr.label)}
                  >
                    <Text style={[s.tradePillText, applyTrade === tr.label && s.tradePillTextActive]}>
                      {tr.icon} {tr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>Why do you want to learn this trade?</Text>
              <TextInput
                style={s.textArea}
                value={applyMotivation}
                onChangeText={setApplyMotivation}
                placeholder="Share your motivation..."
                placeholderTextColor={t.text.muted}
                multiline
              />

              <Text style={s.inputLabel}>Prior experience (optional)</Text>
              <TextInput
                style={s.input}
                value={applyExperience}
                onChangeText={setApplyExperience}
                placeholder="Any relevant experience..."
                placeholderTextColor={t.text.muted}
              />

              <TouchableOpacity style={[s.applyBtn, { marginTop: 20 }]} onPress={handleApply}>
                <Text style={s.applyBtnText}>Submit Application</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
