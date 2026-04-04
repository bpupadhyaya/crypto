import { fonts } from '../utils/theme';
/**
 * Contribution History Screen — Full history of all contributions across channels.
 *
 * Browse all contributions, filter by channel, view timeline.
 * Demo mode with sample contribution data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Contribution {
  id: string;
  channel: string;
  description: string;
  otkEarned: number;
  date: string;
  verified: boolean;
  verifier: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CHANNEL_COLORS: Record<string, string> = {
  nurture: '#FF9500', education: '#007AFF', volunteer: '#34C759',
  eldercare: '#AF52DE', governance: '#FF3B30', gratitude: '#5AC8FA',
};

const CHANNELS = ['all', 'nurture', 'education', 'volunteer', 'eldercare', 'governance', 'gratitude'];

// ─── Demo Data ───

const DEMO_CONTRIBUTIONS: Contribution[] = [
  { id: '1', channel: 'nurture', description: 'Morning childcare routine (3 children)', otkEarned: 500, date: '2026-03-30', verified: true, verifier: 'oracle_family_01' },
  { id: '2', channel: 'education', description: 'Math tutoring for middle school students', otkEarned: 720, date: '2026-03-27', verified: true, verifier: 'oracle_school_01' },
  { id: '3', channel: 'volunteer', description: 'Food bank weekend distribution', otkEarned: 1800, date: '2026-03-25', verified: true, verifier: 'oracle_food_bank' },
  { id: '4', channel: 'eldercare', description: 'Home visits for elderly neighbors', otkEarned: 420, date: '2026-03-22', verified: true, verifier: 'oracle_senior_01' },
  { id: '5', channel: 'gratitude', description: 'Community appreciation wall posting', otkEarned: 50, date: '2026-03-21', verified: true, verifier: 'oracle_gratitude' },
  { id: '6', channel: 'governance', description: 'Proposal #47 review and vote', otkEarned: 80, date: '2026-03-20', verified: true, verifier: 'oracle_gov_01' },
  { id: '7', channel: 'nurture', description: 'After-school homework assistance', otkEarned: 350, date: '2026-03-19', verified: true, verifier: 'oracle_family_01' },
  { id: '8', channel: 'volunteer', description: 'River bank cleanup drive', otkEarned: 1500, date: '2026-03-18', verified: false, verifier: '' },
  { id: '9', channel: 'education', description: 'Youth coding workshop facilitation', otkEarned: 600, date: '2026-03-16', verified: true, verifier: 'oracle_school_02' },
  { id: '10', channel: 'eldercare', description: 'Grocery delivery for homebound seniors', otkEarned: 300, date: '2026-03-14', verified: true, verifier: 'oracle_senior_02' },
];

type Tab = 'all' | 'by-channel' | 'timeline';

export function ContributionHistoryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    if (channelFilter === 'all') return DEMO_CONTRIBUTIONS;
    return DEMO_CONTRIBUTIONS.filter((c) => c.channel === channelFilter);
  }, [channelFilter]);

  const channelSummary = useMemo(() => {
    const map: Record<string, { count: number; otk: number }> = {};
    DEMO_CONTRIBUTIONS.forEach((c) => {
      if (!map[c.channel]) map[c.channel] = { count: 0, otk: 0 };
      map[c.channel].count++;
      map[c.channel].otk += c.otkEarned;
    });
    return Object.entries(map).sort((a, b) => b[1].otk - a[1].otk);
  }, []);

  const totalOtk = useMemo(() => DEMO_CONTRIBUTIONS.reduce((s, c) => s + c.otkEarned, 0), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    totalRow: { alignItems: 'center', marginBottom: 16 },
    totalValue: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy },
    totalLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    contribRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    contribDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    contribInfo: { flex: 1 },
    contribDesc: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    contribMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    contribOtk: { color: t.accent.green, fontSize: 15, fontWeight: fonts.heavy },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    filterActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    filterText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, textTransform: 'capitalize' },
    filterTextActive: { color: t.accent.green },
    channelCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    channelDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
    channelInfo: { flex: 1 },
    channelName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, textTransform: 'capitalize' },
    channelMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    channelOtk: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'by-channel', label: 'By Channel' },
    { key: 'timeline', label: 'Timeline' },
  ];

  const renderAll = () => (
    <>
      <View style={s.card}>
        <View style={s.totalRow}>
          <Text style={s.totalValue}>{totalOtk.toLocaleString()}</Text>
          <Text style={s.totalLabel}>Total OTK earned from contributions</Text>
        </View>
      </View>
      <Text style={s.sectionTitle}>All Contributions ({DEMO_CONTRIBUTIONS.length})</Text>
      <View style={s.card}>
        {DEMO_CONTRIBUTIONS.map((c) => (
          <View key={c.id} style={s.contribRow}>
            <View style={[s.contribDot, { backgroundColor: CHANNEL_COLORS[c.channel] || t.text.muted }]} />
            <View style={s.contribInfo}>
              <Text style={s.contribDesc}>{c.description}</Text>
              <Text style={s.contribMeta}>{c.date} | {c.channel} | {c.verified ? 'Verified' : 'Pending'}</Text>
            </View>
            <Text style={s.contribOtk}>+{c.otkEarned}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderByChannel = () => (
    <>
      <Text style={s.sectionTitle}>By Channel</Text>
      <View style={s.card}>
        {channelSummary.map(([ch, data]) => (
          <View key={ch} style={s.channelCard}>
            <View style={[s.channelDot, { backgroundColor: CHANNEL_COLORS[ch] || t.text.muted }]} />
            <View style={s.channelInfo}>
              <Text style={s.channelName}>{ch}</Text>
              <Text style={s.channelMeta}>{data.count} contributions</Text>
            </View>
            <Text style={s.channelOtk}>{data.otk.toLocaleString()} OTK</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderTimeline = () => (
    <>
      <View style={s.filterRow}>
        {CHANNELS.map((ch) => (
          <TouchableOpacity key={ch} style={[s.filterChip, channelFilter === ch && s.filterActive]} onPress={() => setChannelFilter(ch)}>
            <Text style={[s.filterText, channelFilter === ch && s.filterTextActive]}>{ch}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.card}>
        {filtered.map((c) => (
          <View key={c.id} style={s.contribRow}>
            <View style={[s.contribDot, { backgroundColor: CHANNEL_COLORS[c.channel] || t.text.muted }]} />
            <View style={s.contribInfo}>
              <Text style={s.contribDesc}>{c.description}</Text>
              <Text style={s.contribMeta}>{c.date} | +{c.otkEarned} OTK</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Contributions</Text>
        <View style={{ width: 60 }} />
      </View>
      {demoMode && (<View style={s.demoTag}><Text style={s.demoText}>DEMO MODE</Text></View>)}
      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'all' && renderAll()}
        {tab === 'by-channel' && renderByChannel()}
        {tab === 'timeline' && renderTimeline()}
      </ScrollView>
    </SafeAreaView>
  );
}
