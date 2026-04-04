import { fonts } from '../utils/theme';
/**
 * Milestone Tracker Screen — Track all OTK milestones across all value channels.
 *
 * View, filter, and manage milestones in various states: all, pending
 * verification, and fully verified. Each milestone earns OTK when verified.
 * "Every milestone is a step toward collective prosperity."
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

interface Milestone {
  id: string;
  title: string;
  channel: string;
  icon: string;
  status: 'pending' | 'verified' | 'in_review';
  otkReward: number;
  verifiers: number;
  requiredVerifiers: number;
  submittedAt: string;
  verifiedAt: string | null;
  description: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  Nurture: '#ec4899',
  Education: '#3b82f6',
  Health: '#10b981',
  Community: '#f59e0b',
  Governance: '#8b5cf6',
  Economic: '#06b6d4',
};

const DEMO_MILESTONES: Milestone[] = [
  { id: 'ms1', title: 'Child Grade-Level Reading', channel: 'Nurture', icon: '\u{1F49B}', status: 'verified', otkReward: 200, verifiers: 3, requiredVerifiers: 3, submittedAt: '2026-03-10', verifiedAt: '2026-03-15', description: 'Child achieved grade-level reading proficiency, verified by educators.' },
  { id: 'ms2', title: 'Mentored 5 Students', channel: 'Education', icon: '\u{1F4DA}', status: 'verified', otkReward: 150, verifiers: 4, requiredVerifiers: 3, submittedAt: '2026-03-05', verifiedAt: '2026-03-12', description: 'Successfully mentored 5 students through exam preparation.' },
  { id: 'ms3', title: 'Community Garden Launch', channel: 'Community', icon: '\u{1F91D}', status: 'in_review', otkReward: 100, verifiers: 2, requiredVerifiers: 3, submittedAt: '2026-03-22', verifiedAt: null, description: 'Organized and launched community garden serving 50 families.' },
  { id: 'ms4', title: 'Annual Health Checkup', channel: 'Health', icon: '\u{1F49A}', status: 'verified', otkReward: 50, verifiers: 2, requiredVerifiers: 2, submittedAt: '2026-03-01', verifiedAt: '2026-03-03', description: 'Completed annual comprehensive health screening and vaccination.' },
  { id: 'ms5', title: 'Financial Literacy Course', channel: 'Economic', icon: '\u{1F4B0}', status: 'pending', otkReward: 90, verifiers: 0, requiredVerifiers: 2, submittedAt: '2026-03-28', verifiedAt: null, description: 'Completed 8-week financial literacy and budgeting course.' },
  { id: 'ms6', title: 'Governance Proposal Submitted', channel: 'Governance', icon: '\u{1F3DB}\uFE0F', status: 'in_review', otkReward: 60, verifiers: 1, requiredVerifiers: 3, submittedAt: '2026-03-25', verifiedAt: null, description: 'Submitted proposal for improved community park lighting.' },
  { id: 'ms7', title: 'Emergency First Aid Training', channel: 'Health', icon: '\u{1F49A}', status: 'pending', otkReward: 75, verifiers: 0, requiredVerifiers: 2, submittedAt: '2026-03-29', verifiedAt: null, description: 'Completed certified first aid and CPR training course.' },
  { id: 'ms8', title: 'Elder Care Support (30 days)', channel: 'Nurture', icon: '\u{1F49B}', status: 'verified', otkReward: 180, verifiers: 3, requiredVerifiers: 3, submittedAt: '2026-02-28', verifiedAt: '2026-03-08', description: 'Provided daily support to elderly community member for 30 consecutive days.' },
  { id: 'ms9', title: 'Youth Workshop Organized', channel: 'Education', icon: '\u{1F4DA}', status: 'pending', otkReward: 120, verifiers: 0, requiredVerifiers: 3, submittedAt: '2026-03-30', verifiedAt: null, description: 'Organized coding workshop for 20 youth participants.' },
  { id: 'ms10', title: 'Neighborhood Watch Setup', channel: 'Community', icon: '\u{1F91D}', status: 'in_review', otkReward: 80, verifiers: 2, requiredVerifiers: 3, submittedAt: '2026-03-20', verifiedAt: null, description: 'Established neighborhood watch program with 15 volunteers.' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b' },
  in_review: { label: 'In Review', color: '#3b82f6' },
  verified: { label: 'Verified', color: '#10b981' },
};

export function MilestoneTrackerScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified'>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return DEMO_MILESTONES;
    if (activeTab === 'pending') return DEMO_MILESTONES.filter(m => m.status === 'pending' || m.status === 'in_review');
    return DEMO_MILESTONES.filter(m => m.status === 'verified');
  }, [activeTab]);

  const stats = useMemo(() => ({
    total: DEMO_MILESTONES.length,
    verified: DEMO_MILESTONES.filter(m => m.status === 'verified').length,
    pending: DEMO_MILESTONES.filter(m => m.status !== 'verified').length,
    totalOTK: DEMO_MILESTONES.filter(m => m.status === 'verified').reduce((a, m) => a + m.otkReward, 0),
  }), []);

  const handleDetail = (ms: Milestone) => {
    Alert.alert(ms.title, `${ms.description}\n\nChannel: ${ms.channel}\nReward: ${ms.otkReward} OTK\nVerifiers: ${ms.verifiers}/${ms.requiredVerifiers}\nStatus: ${STATUS_CONFIG[ms.status].label}`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: fonts.md, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    statNum: { fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 2 },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    msCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    msHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    msIcon: { fontSize: fonts.xxl },
    msTitle: { flex: 1, color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    msBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    msBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    msDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18, marginBottom: 10 },
    msFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    msChannel: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    msReward: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.heavy },
    msVerifiers: { color: t.text.muted, fontSize: fonts.sm },
    msDate: { color: t.text.muted, fontSize: fonts.xs, marginLeft: 'auto' as any },
    progressBarBg: { height: 4, backgroundColor: t.border, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
    progressBarFill: { height: 4, borderRadius: 2 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginBottom: 12 },
    footer: { backgroundColor: t.bg.card, borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 16 },
    footerText: { color: t.text.secondary, fontSize: fonts.sm, textAlign: 'center', lineHeight: 20 },
    footerBold: { color: t.text.primary, fontWeight: fonts.bold },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Milestone Tracker</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Every milestone is a step toward collective prosperity."</Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.blue }]}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.green }]}>{stats.verified}</Text>
            <Text style={s.statLabel}>Verified</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.green }]}>{stats.totalOTK}</Text>
            <Text style={s.statLabel}>OTK Earned</Text>
          </View>
        </View>

        <View style={s.tabRow}>
          {(['all', 'pending', 'verified'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Verified'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <Text style={s.emptyText}>No milestones in this category.</Text>
        ) : (
          filtered.map(ms => {
            const statusConf = STATUS_CONFIG[ms.status];
            const progress = ms.requiredVerifiers > 0 ? ms.verifiers / ms.requiredVerifiers : 0;
            return (
              <TouchableOpacity key={ms.id} style={s.msCard} onPress={() => handleDetail(ms)}>
                <View style={s.msHeader}>
                  <Text style={s.msIcon}>{ms.icon}</Text>
                  <Text style={s.msTitle}>{ms.title}</Text>
                  <View style={[s.msBadge, { backgroundColor: statusConf.color }]}>
                    <Text style={s.msBadgeText}>{statusConf.label}</Text>
                  </View>
                </View>
                <Text style={s.msDesc} numberOfLines={2}>{ms.description}</Text>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: statusConf.color }]} />
                </View>
                <View style={s.msFooter}>
                  <Text style={[s.msChannel, { color: CHANNEL_COLORS[ms.channel] || t.text.secondary }]}>{ms.channel}</Text>
                  <Text style={s.msReward}>{ms.otkReward} OTK</Text>
                  <Text style={s.msVerifiers}>{ms.verifiers}/{ms.requiredVerifiers} verifiers</Text>
                  <Text style={s.msDate}>{ms.status === 'verified' ? ms.verifiedAt : ms.submittedAt}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>
            <Text style={s.footerBold}>Milestones</Text> are verified contributions across all
            value channels. Each verified milestone mints OTK as recognition
            of your positive impact on the community.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
