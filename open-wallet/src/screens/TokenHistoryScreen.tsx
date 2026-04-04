import { fonts } from '../utils/theme';
/**
 * Token History Screen — Complete OTK token history.
 *
 * All minting, burning, and transfer events in one timeline.
 * Demo mode with sample transaction data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface TokenEvent {
  id: string;
  type: 'mint' | 'burn' | 'transfer';
  amount: number;
  channel: string;
  date: string;
  txHash: string;
  note: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_EVENTS: TokenEvent[] = [
  { id: '1', type: 'mint', amount: 500, channel: 'nurture', date: '2026-03-30', txHash: '0xabc1...f1e2', note: 'Childcare contribution verified' },
  { id: '2', type: 'transfer', amount: 200, channel: 'peer', date: '2026-03-29', txHash: '0xdef3...a4b5', note: 'Sent to openchain1abc...tutor_li' },
  { id: '3', type: 'mint', amount: 720, channel: 'education', date: '2026-03-27', txHash: '0xghi6...c7d8', note: 'Math tutoring session logged' },
  { id: '4', type: 'burn', amount: 100, channel: 'governance', date: '2026-03-26', txHash: '0xjkl9...e0f1', note: 'Proposal fee burned' },
  { id: '5', type: 'mint', amount: 1800, channel: 'volunteer', date: '2026-03-25', txHash: '0xmno2...g3h4', note: 'Food bank distribution verified' },
  { id: '6', type: 'transfer', amount: 350, channel: 'peer', date: '2026-03-24', txHash: '0xpqr5...i6j7', note: 'Received from openchain1def...helper_maria' },
  { id: '7', type: 'burn', amount: 50, channel: 'fee', date: '2026-03-23', txHash: '0xstu8...k9l0', note: 'Network fee burned' },
  { id: '8', type: 'mint', amount: 420, channel: 'eldercare', date: '2026-03-22', txHash: '0xvwx1...m2n3', note: 'Elder home visit verified' },
  { id: '9', type: 'transfer', amount: 150, channel: 'peer', date: '2026-03-21', txHash: '0xabc2...o4p5', note: 'Sent to openchain1ghi...coach_raj' },
  { id: '10', type: 'mint', amount: 600, channel: 'education', date: '2026-03-20', txHash: '0xdef4...q6r7', note: 'Youth coding workshop facilitation' },
];

type Tab = 'all' | 'minted' | 'burned';

const TYPE_COLORS: Record<string, string> = { mint: '#34C759', burn: '#FF3B30', transfer: '#007AFF' };
const TYPE_LABELS: Record<string, string> = { mint: 'Minted', burn: 'Burned', transfer: 'Transfer' };
const TYPE_PREFIX: Record<string, string> = { mint: '+', burn: '-', transfer: '~' };

export function TokenHistoryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const filtered = useMemo(() => {
    if (tab === 'all') return DEMO_EVENTS;
    if (tab === 'minted') return DEMO_EVENTS.filter((e) => e.type === 'mint');
    return DEMO_EVENTS.filter((e) => e.type === 'burn');
  }, [tab]);

  const totals = useMemo(() => ({
    minted: DEMO_EVENTS.filter((e) => e.type === 'mint').reduce((s, e) => s + e.amount, 0),
    burned: DEMO_EVENTS.filter((e) => e.type === 'burn').reduce((s, e) => s + e.amount, 0),
    transferred: DEMO_EVENTS.filter((e) => e.type === 'transfer').reduce((s, e) => s + e.amount, 0),
  }), []);

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
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { fontSize: 20, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    eventDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    eventInfo: { flex: 1 },
    eventNote: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    eventMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    eventAmount: { fontSize: 16, fontWeight: fonts.heavy },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'minted', label: 'Minted' },
    { key: 'burned', label: 'Burned' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Token History</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: t.accent.green }]}>{totals.minted.toLocaleString()}</Text>
              <Text style={s.summaryLabel}>Total Minted</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: t.accent.red }]}>{totals.burned.toLocaleString()}</Text>
              <Text style={s.summaryLabel}>Total Burned</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: t.accent.blue }]}>{totals.transferred.toLocaleString()}</Text>
              <Text style={s.summaryLabel}>Transferred</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Transactions ({filtered.length})</Text>
        <View style={s.card}>
          {filtered.map((ev) => (
            <View key={ev.id} style={s.eventRow}>
              <View style={[s.eventDot, { backgroundColor: TYPE_COLORS[ev.type] }]} />
              <View style={s.eventInfo}>
                <Text style={s.eventNote}>{ev.note}</Text>
                <Text style={s.eventMeta}>{ev.date} | {ev.channel} | {ev.txHash}</Text>
              </View>
              <Text style={[s.eventAmount, { color: TYPE_COLORS[ev.type] }]}>
                {TYPE_PREFIX[ev.type]}{ev.amount} OTK
              </Text>
            </View>
          ))}
        </View>

        <View style={[s.card, { alignItems: 'center' }]}>
          <Text style={[s.eventMeta, { textAlign: 'center' }]}>
            {TYPE_LABELS.mint}: tokens created via verified contributions{'\n'}
            {TYPE_LABELS.burn}: tokens permanently removed from supply{'\n'}
            {TYPE_LABELS.transfer}: tokens moved between accounts
          </Text>
        </View>

        <View style={[s.card, { alignItems: 'center' }]}>
          <Text style={[s.eventNote, { textAlign: 'center', marginBottom: 8 }]}>
            Net Balance Impact
          </Text>
          <Text style={[s.eventAmount, { color: t.accent.green, fontSize: 24 }]}>
            +{(totals.minted - totals.burned).toLocaleString()} OTK
          </Text>
          <Text style={[s.eventMeta, { marginTop: 8, textAlign: 'center' }]}>
            All token events are recorded on-chain and immutable.{'\n'}
            Minting requires oracle verification.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
