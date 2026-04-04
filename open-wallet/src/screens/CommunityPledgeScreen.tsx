import { fonts } from '../utils/theme';
/**
 * Community Pledge — Community-wide pledges for environmental, social, and governance goals.
 *
 * Members can sign pledges committing to specific community goals.
 * Pledges are tracked on-chain and progress is visible to all.
 * This creates collective accountability and shared purpose.
 *
 * Features:
 * - Pledges: browse active community pledges with signing counts
 * - Sign: review and sign pledges you believe in
 * - Progress: track how pledges are progressing toward their goals
 * - Demo mode with sample pledge data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type PledgeTab = 'pledges' | 'sign' | 'progress';

interface Pledge {
  id: string;
  title: string;
  description: string;
  category: 'environmental' | 'social' | 'governance';
  icon: string;
  signers: number;
  goal: number;
  startDate: string;
  endDate: string;
  signed: boolean;
  milestones: PledgeMilestone[];
  progressPercent: number;
}

interface PledgeMilestone {
  label: string;
  target: number;
  current: number;
  completed: boolean;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  environmental: { label: 'Environmental', color: '#22c55e', icon: '\u{1F33F}' },
  social: { label: 'Social', color: '#3b82f6', icon: '\u{1F465}' },
  governance: { label: 'Governance', color: '#eab308', icon: '\u{1F5F3}' },
};

const DEMO_PLEDGES: Pledge[] = [
  {
    id: 'p1', title: 'Carbon Neutral Community', description: 'Commit to reducing personal carbon footprint by 30% this year through shared transportation, local food, and energy conservation.',
    category: 'environmental', icon: '\u{1F30D}', signers: 4200, goal: 10000, startDate: 'Jan 2026', endDate: 'Dec 2026', signed: true, progressPercent: 42,
    milestones: [
      { label: '1,000 signers', target: 1000, current: 1000, completed: true },
      { label: '5,000 signers', target: 5000, current: 4200, completed: false },
      { label: '10,000 signers', target: 10000, current: 4200, completed: false },
    ],
  },
  {
    id: 'p2', title: 'Education for All', description: 'Every signer pledges to teach or mentor at least one person this quarter, ensuring knowledge flows freely.',
    category: 'social', icon: '\u{1F4DA}', signers: 7800, goal: 15000, startDate: 'Mar 2026', endDate: 'Jun 2026', signed: true, progressPercent: 52,
    milestones: [
      { label: '5,000 signers', target: 5000, current: 5000, completed: true },
      { label: '10,000 signers', target: 10000, current: 7800, completed: false },
      { label: '15,000 signers', target: 15000, current: 7800, completed: false },
    ],
  },
  {
    id: 'p3', title: 'Zero Waste Initiative', description: 'Pledge to eliminate single-use plastics and reduce household waste by 50% within 6 months.',
    category: 'environmental', icon: '\u{267B}', signers: 2100, goal: 8000, startDate: 'Feb 2026', endDate: 'Aug 2026', signed: false, progressPercent: 26,
    milestones: [
      { label: '2,000 signers', target: 2000, current: 2100, completed: true },
      { label: '5,000 signers', target: 5000, current: 2100, completed: false },
      { label: '8,000 signers', target: 8000, current: 2100, completed: false },
    ],
  },
  {
    id: 'p4', title: 'Transparent Governance', description: 'Pledge to vote on every governance proposal and share your reasoning publicly to strengthen democratic participation.',
    category: 'governance', icon: '\u{1F3DB}', signers: 5600, goal: 12000, startDate: 'Jan 2026', endDate: 'Dec 2026', signed: false, progressPercent: 47,
    milestones: [
      { label: '3,000 signers', target: 3000, current: 3000, completed: true },
      { label: '6,000 signers', target: 6000, current: 5600, completed: false },
      { label: '12,000 signers', target: 12000, current: 5600, completed: false },
    ],
  },
  {
    id: 'p5', title: 'Neighborhood Support Network', description: 'Build local support networks where every member checks on at least 3 neighbors weekly.',
    category: 'social', icon: '\u{1F3E0}', signers: 3400, goal: 7000, startDate: 'Mar 2026', endDate: 'Sep 2026', signed: true, progressPercent: 49,
    milestones: [
      { label: '2,000 signers', target: 2000, current: 2000, completed: true },
      { label: '4,000 signers', target: 4000, current: 3400, completed: false },
      { label: '7,000 signers', target: 7000, current: 3400, completed: false },
    ],
  },
];

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function CommunityPledgeScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<PledgeTab>('pledges');
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    pledgeTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    pledgeDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 17, marginBottom: 8 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    signedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.accent.green + '20' },
    signedText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    signBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: t.accent.blue },
    signBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    milestoneCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    milestoneLabel: { color: t.text.primary, fontSize: fonts.sm, flex: 1 },
    milestoneVal: { color: t.text.muted, fontSize: fonts.xs },
    backBtn: { paddingVertical: 10, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.md },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  }), [t]);

  const pledges = demoMode ? DEMO_PLEDGES : [];
  const signedCount = pledges.filter(p => p.signed).length;
  const totalSigners = pledges.reduce((s, p) => s + p.signers, 0);
  const unsignedPledges = pledges.filter(p => !p.signed);

  if (selectedPledge) {
    const p = selectedPledge;
    const catMeta = CATEGORY_META[p.category];
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>{p.icon} {p.title}</Text>
          <TouchableOpacity onPress={() => setSelectedPledge(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={[st.badge, { backgroundColor: catMeta.color, alignSelf: 'flex-start', marginBottom: 12 }]}>
            <Text style={st.badgeText}>{catMeta.label}</Text>
          </View>
          <Text style={st.pledgeDesc}>{p.description}</Text>
          <View style={st.card}>
            <View style={st.row}><Text style={st.label}>Signers</Text><Text style={st.val}>{formatCount(p.signers)} / {formatCount(p.goal)}</Text></View>
            <View style={st.barContainer}>
              <View style={[st.barFill, { width: `${p.progressPercent}%`, backgroundColor: catMeta.color }]} />
            </View>
            <View style={st.row}><Text style={st.label}>Period</Text><Text style={st.val}>{p.startDate} - {p.endDate}</Text></View>
            <View style={st.row}><Text style={st.label}>Status</Text><Text style={[st.val, { color: p.signed ? t.accent.green : t.accent.yellow }]}>{p.signed ? 'Signed' : 'Not Signed'}</Text></View>
          </View>
          <Text style={st.section}>Milestones</Text>
          {p.milestones.map((m, i) => (
            <View key={i} style={st.milestoneRow}>
              <View style={[st.milestoneCheck, { borderColor: m.completed ? t.accent.green : t.border, backgroundColor: m.completed ? t.accent.green : 'transparent' }]}>
                {m.completed && <Text style={{ color: '#fff', fontSize: fonts.sm }}>{'\u2713'}</Text>}
              </View>
              <Text style={st.milestoneLabel}>{m.label}</Text>
              <Text style={st.milestoneVal}>{formatCount(m.current)}/{formatCount(m.target)}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Community Pledges</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Collective commitments for a better world. Sign pledges, track progress, hold each other accountable.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{signedCount}</Text>
              <Text style={st.summaryLabel}>You Signed</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{pledges.length}</Text>
              <Text style={st.summaryLabel}>Active Pledges</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{formatCount(totalSigners)}</Text>
              <Text style={st.summaryLabel}>Total Signers</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['pledges', 'sign', 'progress'] as PledgeTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'pledges' && (
          pledges.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see community pledges.</Text>
          ) : pledges.map(p => {
            const catMeta = CATEGORY_META[p.category];
            return (
              <TouchableOpacity key={p.id} style={st.card} onPress={() => setSelectedPledge(p)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: fonts.xxl, marginRight: 8 }}>{p.icon}</Text>
                  <Text style={[st.pledgeTitle, { flex: 1 }]}>{p.title}</Text>
                  {p.signed && <View style={st.signedBadge}><Text style={st.signedText}>Signed</Text></View>}
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barFill, { width: `${p.progressPercent}%`, backgroundColor: catMeta.color }]} />
                </View>
                <View style={st.row}>
                  <Text style={st.label}>{catMeta.icon} {catMeta.label}</Text>
                  <Text style={st.val}>{formatCount(p.signers)} / {formatCount(p.goal)} signers</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {activeTab === 'sign' && (
          unsignedPledges.length === 0 ? (
            <View style={st.card}>
              <Text style={{ color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center' }}>All Pledges Signed!</Text>
              <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4 }}>You have signed every active pledge.</Text>
            </View>
          ) : unsignedPledges.map(p => {
            const catMeta = CATEGORY_META[p.category];
            return (
              <View key={p.id} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: fonts.xxl, marginRight: 8 }}>{p.icon}</Text>
                  <Text style={[st.pledgeTitle, { flex: 1 }]}>{p.title}</Text>
                </View>
                <Text style={st.pledgeDesc}>{p.description}</Text>
                <View style={st.row}><Text style={st.label}>Category</Text><Text style={[st.val, { color: catMeta.color }]}>{catMeta.label}</Text></View>
                <View style={st.row}><Text style={st.label}>Current Signers</Text><Text style={st.val}>{formatCount(p.signers)}</Text></View>
              </View>
            );
          })
        )}

        {activeTab === 'progress' && (
          pledges.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see pledge progress.</Text>
          ) : pledges.map(p => {
            const catMeta = CATEGORY_META[p.category];
            return (
              <TouchableOpacity key={p.id} style={st.card} onPress={() => setSelectedPledge(p)}>
                <Text style={st.pledgeTitle}>{p.icon} {p.title}</Text>
                <View style={st.barContainer}>
                  <View style={[st.barFill, { width: `${p.progressPercent}%`, backgroundColor: catMeta.color }]} />
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Progress</Text>
                  <Text style={[st.val, { color: catMeta.color }]}>{p.progressPercent}%</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Milestones</Text>
                  <Text style={st.val}>{p.milestones.filter(m => m.completed).length}/{p.milestones.length}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample pledge data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
