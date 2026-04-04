import { fonts } from '../utils/theme';
/**
 * Eldercare Screen — Track and recognize eldercare contributions.
 *
 * "Caring for those who cared for us — the cycle that defines humanity."
 * — The Human Constitution, Article I
 *
 * Every hour spent accompanying an elder to a doctor, every evening of
 * companionship, every act of daily care is a contribution that deserves
 * recognition. This screen makes that invisible labor visible on-chain.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

type CareType = 'companionship' | 'medical_support' | 'daily_living' | 'transportation' | 'emotional_support';

interface EldercareLog {
  id: string;
  careType: CareType;
  hours: number;
  description: string;
  elderUID: string;
  elderName: string;
  notkEarned: number;
  date: string;
}

interface CareRecipient {
  uid: string;
  name: string;
  relationship: string;
  totalHours: number;
  careStartDate: string;
}

interface EldercareMilestone {
  id: string;
  title: string;
  description: string;
  badge: string;
  achieved: boolean;
  progress: number; // 0-100
  notkReward: number;
}

const CARE_TYPES: { key: CareType; label: string; icon: string; desc: string }[] = [
  { key: 'companionship', label: 'Companionship', icon: '\u{1F91D}', desc: 'Visits, conversation, shared meals' },
  { key: 'medical_support', label: 'Medical Support', icon: '\u{1FA7A}', desc: 'Appointments, medication, health monitoring' },
  { key: 'daily_living', label: 'Daily Living', icon: '\u{1F3E0}', desc: 'Cooking, cleaning, personal care' },
  { key: 'transportation', label: 'Transportation', icon: '\u{1F697}', desc: 'Errands, appointments, outings' },
  { key: 'emotional_support', label: 'Emotional Support', icon: '\u{1F49C}', desc: 'Listening, comfort, presence' },
];

const CARE_LEVELS: { label: string; minHours: number; badge: string }[] = [
  { label: 'Helper', minHours: 0, badge: '\u{1F331}' },
  { label: 'Companion', minHours: 51, badge: '\u{1F33F}' },
  { label: 'Caregiver', minHours: 201, badge: '\u{1F333}' },
  { label: 'Guardian', minHours: 501, badge: '\u{1F6E1}\u{FE0F}' },
  { label: 'Angel', minHours: 1001, badge: '\u{1F47C}' },
];

// Demo data
const DEMO_LOGS: EldercareLog[] = [
  { id: 'e1', careType: 'companionship', hours: 3, description: 'Sunday lunch and afternoon walk', elderUID: 'uid-elder-001', elderName: 'Grandmother Mira', notkEarned: 300, date: '2026-03-27' },
  { id: 'e2', careType: 'medical_support', hours: 4, description: 'Accompanied to cardiologist, picked up prescriptions', elderUID: 'uid-elder-001', elderName: 'Grandmother Mira', notkEarned: 600, date: '2026-03-25' },
  { id: 'e3', careType: 'daily_living', hours: 2, description: 'Prepared meals for the week, organized medication', elderUID: 'uid-elder-002', elderName: 'Uncle Raj', notkEarned: 200, date: '2026-03-24' },
  { id: 'e4', careType: 'transportation', hours: 1, description: 'Drove to physical therapy session', elderUID: 'uid-elder-001', elderName: 'Grandmother Mira', notkEarned: 150, date: '2026-03-22' },
  { id: 'e5', careType: 'emotional_support', hours: 2, description: 'Evening call, reminiscing about family stories', elderUID: 'uid-elder-003', elderName: 'Neighbor Mrs. Chen', notkEarned: 200, date: '2026-03-20' },
  { id: 'e6', careType: 'companionship', hours: 5, description: 'Full day outing to the park and lunch', elderUID: 'uid-elder-002', elderName: 'Uncle Raj', notkEarned: 500, date: '2026-03-18' },
];

const DEMO_RECIPIENTS: CareRecipient[] = [
  { uid: 'uid-elder-001', name: 'Grandmother Mira', relationship: 'Grandmother', totalHours: 342, careStartDate: '2024-06-01' },
  { uid: 'uid-elder-002', name: 'Uncle Raj', relationship: 'Uncle', totalHours: 128, careStartDate: '2025-01-15' },
  { uid: 'uid-elder-003', name: 'Neighbor Mrs. Chen', relationship: 'Neighbor', totalHours: 45, careStartDate: '2025-09-01' },
];

const DEMO_MILESTONES: EldercareMilestone[] = [
  { id: 'em1', title: '1 Year of Daily Care', description: 'Provided care for 365 consecutive days', badge: '\u{1F3C6}', achieved: false, progress: 72, notkReward: 5000 },
  { id: 'em2', title: '100 Medical Appointments', description: 'Accompanied an elder to 100 medical visits', badge: '\u{1FA7A}', achieved: false, progress: 34, notkReward: 3000 },
  { id: 'em3', title: '500 Hours of Companionship', description: 'Spent 500 hours in companionship care', badge: '\u{1F91D}', achieved: true, progress: 100, notkReward: 2000 },
  { id: 'em4', title: 'Multi-Elder Caregiver', description: 'Supporting 3 or more elders simultaneously', badge: '\u{1F47C}', achieved: true, progress: 100, notkReward: 1500 },
  { id: 'em5', title: 'Community Eldercare Leader', description: 'Top 10% eldercare hours in your region', badge: '\u{2B50}', achieved: false, progress: 61, notkReward: 4000 },
];

const DEMO_COMMUNITY_STATS = {
  totalCaregivers: 12847,
  totalHoursThisMonth: 458320,
  avgHoursPerCaregiver: 35.7,
  topCareType: 'companionship',
  regionRank: 'Top 15%',
};

function getCareLevel(hours: number): { label: string; badge: string } {
  for (let i = CARE_LEVELS.length - 1; i >= 0; i--) {
    if (hours >= CARE_LEVELS[i].minHours) return CARE_LEVELS[i];
  }
  return CARE_LEVELS[0];
}

type TabKey = 'profile' | 'log' | 'recipients' | 'milestones' | 'community';

export function EldercareScreen({ onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('profile');
  const [logCareType, setLogCareType] = useState<CareType>('companionship');
  const [logHours, setLogHours] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logElderUID, setLogElderUID] = useState('');
  const t = useTheme();

  const totalHours = useMemo(() => DEMO_LOGS.reduce((s, l) => s + l.hours, 0), []);
  const totalNOTK = useMemo(() => DEMO_LOGS.reduce((s, l) => s + l.notkEarned, 0), []);
  const careLevel = useMemo(() => getCareLevel(515), []); // total across all time (demo)

  const handleLog = useCallback(() => {
    if (!logHours || parseInt(logHours) <= 0) {
      Alert.alert('Invalid', 'Please enter valid hours.');
      return;
    }
    if (!logDescription.trim()) {
      Alert.alert('Invalid', 'Please describe the care activity.');
      return;
    }
    Alert.alert('Logged (Demo)', `${logHours}h of ${logCareType.replace('_', ' ')} recorded.\nEstimated nOTK: ${parseInt(logHours) * 100}`);
    setLogHours('');
    setLogDescription('');
    setLogElderUID('');
  }, [logHours, logDescription, logCareType]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16, gap: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    scoreItem: { alignItems: 'center' },
    scoreValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    levelCard: { backgroundColor: t.accent.purple + '18', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    levelBadge: { fontSize: 36 },
    levelTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    levelSub: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    logItem: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginHorizontal: 20, marginTop: 8 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logType: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    logDate: { color: t.text.muted, fontSize: 12 },
    logDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
    logFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    logHours: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    logOTK: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    recipientCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginHorizontal: 20, marginTop: 8 },
    recipientName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    recipientRel: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    recipientStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
    recipientStat: { color: t.text.secondary, fontSize: 12 },
    milestoneCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginHorizontal: 20, marginTop: 8 },
    milestoneRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    milestoneBadge: { fontSize: 28 },
    milestoneTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    milestoneDesc: { color: t.text.muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    milestoneReward: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.bold, marginTop: 6 },
    communityStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    communityLabel: { color: t.text.secondary, fontSize: 13 },
    communityValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
    careTypeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    careChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 70 },
    careChipActive: { backgroundColor: t.accent.purple },
    careChipIcon: { fontSize: 20, marginBottom: 2 },
    careChipLabel: { color: t.text.secondary, fontSize: 10, fontWeight: fonts.semibold },
    careChipLabelActive: { color: '#fff' },
    logBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 30 },
    logBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    achievedBadge: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, marginTop: 4 },
  }), [t]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'log', label: 'Log Care' },
    { key: 'recipients', label: 'Elders' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'community', label: 'Community' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Eldercare</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F47C}'}</Text>
          <Text style={s.heroTitle}>Caring for Those Who Cared for Us</Text>
          <Text style={s.heroSubtitle}>
            {"\"The measure of a society is how it treats its most vulnerable — especially those who spent their lives caring for others.\"\n— The Human Constitution"}
          </Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <>
            <Text style={s.section}>YOUR ELDERCARE PROFILE</Text>
            <View style={s.card}>
              <View style={s.scoreRow}>
                <View style={s.scoreItem}>
                  <Text style={s.scoreValue}>{DEMO_RECIPIENTS.length}</Text>
                  <Text style={s.scoreLabel}>Elders Supported</Text>
                </View>
                <View style={s.scoreItem}>
                  <Text style={s.scoreValue}>{515}</Text>
                  <Text style={s.scoreLabel}>Total Hours</Text>
                </View>
                <View style={s.scoreItem}>
                  <Text style={[s.scoreValue, { color: t.accent.green }]}>{(1950).toLocaleString()}</Text>
                  <Text style={s.scoreLabel}>nOTK Earned</Text>
                </View>
              </View>
            </View>
            <View style={s.levelCard}>
              <Text style={s.levelBadge}>{careLevel.badge}</Text>
              <View>
                <Text style={s.levelTitle}>Level: {careLevel.label}</Text>
                <Text style={s.levelSub}>515 hours — 486 more to reach Angel</Text>
              </View>
            </View>

            {/* Care level breakdown */}
            <Text style={s.section}>CAREGIVER LEVELS</Text>
            {CARE_LEVELS.map(cl => (
              <View key={cl.label} style={[s.card, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
                <Text style={{ fontSize: 24 }}>{cl.badge}</Text>
                <View>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.bold }}>{cl.label}</Text>
                  <Text style={{ color: t.text.muted, fontSize: 12 }}>
                    {cl.minHours === 0 ? '0-50 hours' :
                     cl.minHours === 51 ? '51-200 hours' :
                     cl.minHours === 201 ? '201-500 hours' :
                     cl.minHours === 501 ? '501-1,000 hours' :
                     '1,000+ hours'}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={s.section}>RECENT ACTIVITY</Text>
            {DEMO_LOGS.slice(0, 3).map(log => (
              <View key={log.id} style={s.logItem}>
                <View style={s.logHeader}>
                  <Text style={s.logType}>
                    {CARE_TYPES.find(c => c.key === log.careType)?.icon}{' '}
                    {CARE_TYPES.find(c => c.key === log.careType)?.label}
                  </Text>
                  <Text style={s.logDate}>{log.date}</Text>
                </View>
                <Text style={s.logDesc}>{log.description}</Text>
                <View style={s.logFooter}>
                  <Text style={s.logHours}>{log.hours}h with {log.elderName}</Text>
                  <Text style={s.logOTK}>+{log.notkEarned} nOTK</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Log Eldercare Tab ── */}
        {tab === 'log' && (
          <>
            <Text style={s.section}>LOG ELDERCARE ACTIVITY</Text>
            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Care Type</Text>
              <View style={s.careTypeRow}>
                {CARE_TYPES.map(ct => (
                  <TouchableOpacity
                    key={ct.key}
                    style={[s.careChip, logCareType === ct.key && s.careChipActive]}
                    onPress={() => setLogCareType(ct.key)}
                  >
                    <Text style={s.careChipIcon}>{ct.icon}</Text>
                    <Text style={[s.careChipLabel, logCareType === ct.key && s.careChipLabelActive]}>
                      {ct.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: t.text.muted, fontSize: 12, marginBottom: 16 }}>
                {CARE_TYPES.find(c => c.key === logCareType)?.desc}
              </Text>

              <Text style={s.inputLabel}>Hours</Text>
              <TextInput
                style={s.input}
                value={logHours}
                onChangeText={setLogHours}
                placeholder="Number of hours"
                placeholderTextColor={t.text.muted}
                keyboardType="numeric"
              />

              <Text style={[s.inputLabel, { marginTop: 16 }]}>Elder UID (optional)</Text>
              <TextInput
                style={s.input}
                value={logElderUID}
                onChangeText={setLogElderUID}
                placeholder="uid-..."
                placeholderTextColor={t.text.muted}
              />

              <Text style={[s.inputLabel, { marginTop: 16 }]}>Description</Text>
              <TextInput
                style={s.descInput}
                value={logDescription}
                onChangeText={setLogDescription}
                placeholder="Describe the care you provided..."
                placeholderTextColor={t.text.muted}
                multiline
              />
            </View>

            <TouchableOpacity style={s.logBtn} onPress={handleLog}>
              <Text style={s.logBtnText}>Log Eldercare Activity</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Care Recipients Tab ── */}
        {tab === 'recipients' && (
          <>
            <Text style={s.section}>ELDERS YOU SUPPORT</Text>
            {DEMO_RECIPIENTS.map(r => (
              <View key={r.uid} style={s.recipientCard}>
                <Text style={s.recipientName}>{r.name}</Text>
                <Text style={s.recipientRel}>{r.relationship} — since {r.careStartDate}</Text>
                <View style={s.recipientStats}>
                  <Text style={s.recipientStat}>{r.totalHours}h total</Text>
                  <Text style={[s.recipientStat, { color: t.accent.green }]}>
                    Level: {getCareLevel(r.totalHours).label} {getCareLevel(r.totalHours).badge}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[s.logBtn, { backgroundColor: t.accent.blue }]}>
              <Text style={s.logBtnText}>Link New Elder</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Milestones Tab ── */}
        {tab === 'milestones' && (
          <>
            <Text style={s.section}>ELDERCARE MILESTONES</Text>
            {DEMO_MILESTONES.map(m => (
              <View key={m.id} style={s.milestoneCard}>
                <View style={s.milestoneRow}>
                  <Text style={s.milestoneBadge}>{m.badge}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.milestoneTitle}>{m.title}</Text>
                    <Text style={s.milestoneDesc}>{m.description}</Text>
                  </View>
                </View>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${m.progress}%` as any }]} />
                </View>
                {m.achieved ? (
                  <Text style={s.achievedBadge}>Achieved! +{m.notkReward} nOTK</Text>
                ) : (
                  <Text style={s.milestoneReward}>{m.progress}% — Reward: {m.notkReward} nOTK</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* ── Community Tab ── */}
        {tab === 'community' && (
          <>
            <Text style={s.section}>COMMUNITY ELDERCARE STATS</Text>
            <View style={s.card}>
              <View style={s.communityStatRow}>
                <Text style={s.communityLabel}>Active Caregivers</Text>
                <Text style={s.communityValue}>{DEMO_COMMUNITY_STATS.totalCaregivers.toLocaleString()}</Text>
              </View>
              <View style={s.communityStatRow}>
                <Text style={s.communityLabel}>Total Hours This Month</Text>
                <Text style={s.communityValue}>{DEMO_COMMUNITY_STATS.totalHoursThisMonth.toLocaleString()}</Text>
              </View>
              <View style={s.communityStatRow}>
                <Text style={s.communityLabel}>Avg Hours/Caregiver</Text>
                <Text style={s.communityValue}>{DEMO_COMMUNITY_STATS.avgHoursPerCaregiver}</Text>
              </View>
              <View style={s.communityStatRow}>
                <Text style={s.communityLabel}>Top Care Type</Text>
                <Text style={s.communityValue}>Companionship</Text>
              </View>
              <View style={s.communityStatRow}>
                <Text style={s.communityLabel}>Your Regional Rank</Text>
                <Text style={[s.communityValue, { color: t.accent.green }]}>{DEMO_COMMUNITY_STATS.regionRank}</Text>
              </View>
            </View>

            <Text style={s.section}>CARE TYPE BREAKDOWN</Text>
            <View style={s.card}>
              {CARE_TYPES.map(ct => (
                <View key={ct.key} style={[s.communityStatRow, { alignItems: 'center' }]}>
                  <Text style={s.communityLabel}>{ct.icon} {ct.label}</Text>
                  <Text style={s.communityValue}>
                    {ct.key === 'companionship' ? '38%' :
                     ct.key === 'medical_support' ? '24%' :
                     ct.key === 'daily_living' ? '19%' :
                     ct.key === 'transportation' ? '11%' : '8%'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
