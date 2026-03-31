/**
 * Token Burn — Transparent OTK burn tracking for negative value corrections.
 *
 * When negative actions are identified and verified through governance,
 * OTK is burned (destroyed) as a correction mechanism. This screen
 * provides full transparency into burn events: why they happened,
 * who was affected, and aggregate statistics.
 *
 * Features:
 * - Burns: chronological list of recent burn events
 * - Reasons: breakdown of burn reasons by category
 * - Stats: aggregate burn statistics and trends
 * - Demo mode with sample burn data
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

type BurnTab = 'burns' | 'reasons' | 'stats';

interface BurnEvent {
  id: string;
  amount: number;
  channel: string;
  channelIcon: string;
  reason: string;
  category: string;
  verifiedBy: number;
  affectedUID: string;
  timestamp: string;
  blockHeight: number;
  txHash: string;
}

interface BurnReason {
  category: string;
  icon: string;
  color: string;
  count: number;
  totalBurned: number;
  percentage: number;
  description: string;
}

interface BurnStat {
  label: string;
  value: string;
  change: number;
  icon: string;
}

const DEMO_BURNS: BurnEvent[] = [
  { id: 'b1', amount: 500, channel: 'Education', channelIcon: '\u{1F4DA}', reason: 'False credential claim — unverified teaching certification', category: 'fraud', verifiedBy: 12, affectedUID: 'UID-9021', timestamp: '2 hours ago', blockHeight: 48291, txHash: '0xab3f...7e21' },
  { id: 'b2', amount: 200, channel: 'Community', channelIcon: '\u{1F91D}', reason: 'Plagiarized community article submitted as original work', category: 'plagiarism', verifiedBy: 8, affectedUID: 'UID-5542', timestamp: '6 hours ago', blockHeight: 48185, txHash: '0xcd92...1a44' },
  { id: 'b3', amount: 1000, channel: 'Economic', channelIcon: '\u{1F4B0}', reason: 'Sybil attack attempt — multiple fake UIDs for token farming', category: 'sybil', verifiedBy: 25, affectedUID: 'UID-7103', timestamp: '1 day ago', blockHeight: 47920, txHash: '0xef18...9b33' },
  { id: 'b4', amount: 150, channel: 'Health', channelIcon: '\u{1FA7A}', reason: 'Fabricated wellness activity logs over 2-week period', category: 'fraud', verifiedBy: 6, affectedUID: 'UID-3387', timestamp: '2 days ago', blockHeight: 47650, txHash: '0x7721...4c88' },
  { id: 'b5', amount: 300, channel: 'Nurture', channelIcon: '\u{1F49B}', reason: 'Inflated mentoring hours — actual time was 30% of claimed', category: 'inflation', verifiedBy: 10, affectedUID: 'UID-8814', timestamp: '3 days ago', blockHeight: 47410, txHash: '0x55aa...2d11' },
  { id: 'b6', amount: 800, channel: 'Governance', channelIcon: '\u{1F5F3}', reason: 'Vote manipulation through coordinated influence campaign', category: 'manipulation', verifiedBy: 18, affectedUID: 'UID-2290', timestamp: '5 days ago', blockHeight: 46880, txHash: '0x9932...6f77' },
];

const DEMO_REASONS: BurnReason[] = [
  { category: 'Fraud', icon: '\u{26A0}', color: '#ef4444', count: 145, totalBurned: 89500, percentage: 35, description: 'False claims, fabricated evidence, or misrepresentation of contributions.' },
  { category: 'Sybil Attack', icon: '\u{1F47E}', color: '#8b5cf6', count: 23, totalBurned: 72000, percentage: 28, description: 'Creating fake identities to earn undeserved tokens.' },
  { category: 'Manipulation', icon: '\u{1F3AD}', color: '#f97316', count: 34, totalBurned: 51000, percentage: 20, description: 'Coordinated schemes to game voting or reward systems.' },
  { category: 'Inflation', icon: '\u{1F4C8}', color: '#eab308', count: 67, totalBurned: 25500, percentage: 10, description: 'Exaggerating the scope or duration of genuine contributions.' },
  { category: 'Plagiarism', icon: '\u{1F4CB}', color: '#3b82f6', count: 41, totalBurned: 18000, percentage: 7, description: 'Claiming credit for others\' work or contributions.' },
];

const DEMO_STATS: BurnStat[] = [
  { label: 'Total OTK Burned', value: '256K', change: -12, icon: '\u{1F525}' },
  { label: 'Burn Events (All Time)', value: '310', change: -8, icon: '\u{1F4CA}' },
  { label: 'Avg Burn Amount', value: '826', change: -5, icon: '\u{1F4B1}' },
  { label: 'Burn Rate (30d)', value: '0.03%', change: -15, icon: '\u{1F4C9}' },
  { label: 'Governance Verified', value: '98.7%', change: 1, icon: '\u{2705}' },
  { label: 'Unique Offenders', value: '287', change: -10, icon: '\u{1F465}' },
];

function formatOTK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function TokenBurnScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<BurnTab>('burns');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    burnAmount: { color: t.accent.red, fontSize: 18, fontWeight: '900' },
    burnReason: { color: t.text.secondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
    burnMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 6, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    reasonTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    reasonDesc: { color: t.text.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
    reasonCount: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    statCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    statIcon: { fontSize: 24, marginRight: 12 },
    statLabel: { color: t.text.muted, fontSize: 12 },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statChange: { fontSize: 12, fontWeight: '700' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    verifiedText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    txHash: { color: t.accent.blue, fontSize: 11, fontFamily: 'monospace' },
    transparencyNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
  }), [t]);

  const burns = demoMode ? DEMO_BURNS : [];
  const reasons = demoMode ? DEMO_REASONS : [];
  const stats = demoMode ? DEMO_STATS : [];
  const totalBurned = burns.reduce((s, b) => s + b.amount, 0);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Token Burns</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Transparent tracking of OTK burns — corrections for verified negative actions.
        </Text>
        <Text style={st.transparencyNote}>Every burn is governance-verified and recorded on-chain for full transparency.</Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.red }]}>{formatOTK(totalBurned)}</Text>
              <Text style={st.summaryLabel}>Recent Burns</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.text.primary }]}>{burns.length}</Text>
              <Text style={st.summaryLabel}>Events</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>98.7%</Text>
              <Text style={st.summaryLabel}>Verified</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['burns', 'reasons', 'stats'] as BurnTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'burns' && (
          burns.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see burn events.</Text>
          ) : burns.map(b => (
            <View key={b.id} style={[st.card, { borderLeftWidth: 3, borderLeftColor: t.accent.red }]}>
              <View style={st.row}>
                <Text style={st.burnAmount}>-{b.amount} OTK</Text>
                <Text style={{ fontSize: 18 }}>{b.channelIcon}</Text>
              </View>
              <Text style={st.burnReason}>{b.reason}</Text>
              <View style={[st.row, { marginTop: 8 }]}>
                <Text style={st.label}>Affected</Text>
                <Text style={st.val}>{b.affectedUID}</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Channel</Text>
                <Text style={st.val}>{b.channel}</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Block</Text>
                <Text style={st.val}>#{b.blockHeight.toLocaleString()}</Text>
              </View>
              <View style={st.verifiedBadge}>
                <Text style={st.verifiedText}>{'\u2713'} Verified by {b.verifiedBy} validators</Text>
              </View>
              <Text style={[st.burnMeta, { marginTop: 4 }]}>{b.timestamp} | {b.txHash}</Text>
            </View>
          ))
        )}

        {activeTab === 'reasons' && (
          reasons.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see burn reasons.</Text>
          ) : reasons.map(r => (
            <View key={r.category} style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.reasonTitle}>{r.category}</Text>
                  <Text style={st.reasonCount}>{r.count} events | {formatOTK(r.totalBurned)} OTK burned</Text>
                </View>
                <Text style={{ color: r.color, fontSize: 16, fontWeight: '800' }}>{r.percentage}%</Text>
              </View>
              <View style={st.barContainer}>
                <View style={[st.barFill, { width: `${r.percentage}%`, backgroundColor: r.color }]} />
              </View>
              <Text style={st.reasonDesc}>{r.description}</Text>
            </View>
          ))
        )}

        {activeTab === 'stats' && (
          stats.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see burn statistics.</Text>
          ) : stats.map((s, i) => (
            <View key={i} style={st.statCard}>
              <Text style={st.statIcon}>{s.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.statLabel}>{s.label}</Text>
                <Text style={st.statValue}>{s.value}</Text>
              </View>
              <Text style={[st.statChange, { color: s.change <= 0 ? t.accent.green : t.accent.red }]}>
                {s.change > 0 ? '+' : ''}{s.change}%
              </Text>
            </View>
          ))
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample burn data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
