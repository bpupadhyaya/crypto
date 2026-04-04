import { fonts } from '../utils/theme';
/**
 * Regional Dashboard Screen — Dashboard for your specific region's metrics.
 *
 * Shows local Open Chain activity, channel performance, and regional rank.
 * Demo mode with sample regional data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface RegionMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

interface ChannelStat {
  name: string;
  participants: number;
  otkMinted: number;
  color: string;
}

interface RankEntry {
  region: string;
  score: number;
  population: number;
  isYours: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_METRICS: RegionMetric[] = [
  { label: 'Active Contributors', value: '2,847', change: '+12%', positive: true },
  { label: 'OTK Minted (30d)', value: '184,200', change: '+8%', positive: true },
  { label: 'Peace Index', value: '78.4', change: '+2.1', positive: true },
  { label: 'Needs Resolved', value: '342', change: '+15%', positive: true },
  { label: 'Avg Response Time', value: '4.2h', change: '-18%', positive: true },
  { label: 'Unmet Needs', value: '87', change: '-5%', positive: true },
];

const DEMO_CHANNELS: ChannelStat[] = [
  { name: 'Nurture', participants: 845, otkMinted: 52400, color: '#FF9500' },
  { name: 'Education', participants: 632, otkMinted: 38100, color: '#007AFF' },
  { name: 'Volunteer', participants: 521, otkMinted: 31200, color: '#34C759' },
  { name: 'Eldercare', participants: 298, otkMinted: 18900, color: '#AF52DE' },
  { name: 'Governance', participants: 184, otkMinted: 12400, color: '#FF3B30' },
  { name: 'Gratitude', participants: 367, otkMinted: 31200, color: '#5AC8FA' },
];

const DEMO_RANKINGS: RankEntry[] = [
  { region: 'Portland Metro', score: 92.1, population: 18420, isYours: false },
  { region: 'Boulder County', score: 89.7, population: 12850, isYours: false },
  { region: 'Austin Central', score: 86.3, population: 24100, isYours: true },
  { region: 'Minneapolis NE', score: 84.9, population: 9870, isYours: false },
  { region: 'Asheville Area', score: 82.4, population: 7640, isYours: false },
  { region: 'Burlington VT', score: 80.1, population: 5430, isYours: false },
  { region: 'Santa Cruz', score: 78.8, population: 8920, isYours: false },
  { region: 'Ann Arbor', score: 77.5, population: 11200, isYours: false },
];

type Tab = 'overview' | 'channels' | 'rank';

export function RegionalDashboardScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    regionName: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 16 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    metricLabel: { color: t.text.secondary, fontSize: 14 },
    metricRight: { flexDirection: 'row', alignItems: 'center' },
    metricValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginRight: 8 },
    metricChange: { fontSize: 12, fontWeight: fonts.semibold },
    channelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    channelDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    channelInfo: { flex: 1 },
    channelName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    channelMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    channelOtk: { color: t.accent.green, fontSize: 15, fontWeight: fonts.heavy },
    rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    rankNum: { width: 32, color: t.text.muted, fontSize: 16, fontWeight: fonts.heavy, textAlign: 'center' },
    rankInfo: { flex: 1, marginLeft: 8 },
    rankName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    rankMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    rankScore: { color: t.accent.blue, fontSize: 18, fontWeight: fonts.heavy },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'channels', label: 'Channels' },
    { key: 'rank', label: 'Rank' },
  ];

  const renderOverview = () => (
    <>
      <View style={s.card}>
        <Text style={s.regionName}>Austin Central Region</Text>
        {DEMO_METRICS.map((m, i) => (
          <View key={i} style={s.metricRow}>
            <Text style={s.metricLabel}>{m.label}</Text>
            <View style={s.metricRight}>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={[s.metricChange, { color: m.positive ? t.accent.green : t.accent.red }]}>{m.change}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderChannels = () => (
    <>
      <Text style={s.sectionTitle}>Channel Activity</Text>
      <View style={s.card}>
        {DEMO_CHANNELS.map((ch, i) => (
          <View key={i} style={s.channelRow}>
            <View style={[s.channelDot, { backgroundColor: ch.color }]} />
            <View style={s.channelInfo}>
              <Text style={s.channelName}>{ch.name}</Text>
              <Text style={s.channelMeta}>{ch.participants} participants</Text>
            </View>
            <Text style={s.channelOtk}>{ch.otkMinted.toLocaleString()} OTK</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderRank = () => (
    <>
      <Text style={s.sectionTitle}>Regional Rankings</Text>
      <View style={s.card}>
        {DEMO_RANKINGS.map((r, i) => (
          <View key={i} style={[s.rankRow, r.isYours && { backgroundColor: t.accent.blue + '10', borderRadius: 10, paddingHorizontal: 8 }]}>
            <Text style={[s.rankNum, i < 3 && { color: t.accent.orange }]}>#{i + 1}</Text>
            <View style={s.rankInfo}>
              <Text style={[s.rankName, r.isYours && { color: t.accent.blue }]}>{r.region}{r.isYours ? ' (You)' : ''}</Text>
              <Text style={s.rankMeta}>{r.population.toLocaleString()} contributors</Text>
            </View>
            <Text style={s.rankScore}>{r.score}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>My Region</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}><Text style={s.demoText}>DEMO MODE</Text></View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'overview' && renderOverview()}
        {tab === 'channels' && renderChannels()}
        {tab === 'rank' && renderRank()}
      </ScrollView>
    </SafeAreaView>
  );
}
