import { fonts } from '../utils/theme';
/**
 * Oracle Network Screen — View the oracle verifier network status.
 *
 * Browse verifiers, attestation records, and accuracy metrics.
 * Demo mode with sample oracle data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Verifier {
  id: string;
  name: string;
  channel: string;
  attestations: number;
  accuracy: number;
  stake: number;
  status: 'active' | 'inactive' | 'slashed';
}

interface Attestation {
  id: string;
  verifier: string;
  channel: string;
  subject: string;
  result: 'verified' | 'rejected' | 'disputed';
  date: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_VERIFIERS: Verifier[] = [
  { id: '1', name: 'oracle_family_01', channel: 'nurture', attestations: 1248, accuracy: 99.2, stake: 5000, status: 'active' },
  { id: '2', name: 'oracle_school_01', channel: 'education', attestations: 892, accuracy: 98.7, stake: 4200, status: 'active' },
  { id: '3', name: 'oracle_food_bank', channel: 'volunteer', attestations: 634, accuracy: 97.8, stake: 3800, status: 'active' },
  { id: '4', name: 'oracle_senior_01', channel: 'eldercare', attestations: 456, accuracy: 99.5, stake: 3200, status: 'active' },
  { id: '5', name: 'oracle_gov_01', channel: 'governance', attestations: 312, accuracy: 96.4, stake: 2800, status: 'active' },
  { id: '6', name: 'oracle_community_02', channel: 'volunteer', attestations: 89, accuracy: 72.1, stake: 0, status: 'slashed' },
  { id: '7', name: 'oracle_school_02', channel: 'education', attestations: 245, accuracy: 98.1, stake: 2100, status: 'inactive' },
];

const DEMO_ATTESTATIONS: Attestation[] = [
  { id: '1', verifier: 'oracle_family_01', channel: 'nurture', subject: 'Childcare contribution #4821', result: 'verified', date: '2026-03-30' },
  { id: '2', verifier: 'oracle_school_01', channel: 'education', subject: 'Tutoring session #1247', result: 'verified', date: '2026-03-29' },
  { id: '3', verifier: 'oracle_food_bank', channel: 'volunteer', subject: 'Food distribution #892', result: 'verified', date: '2026-03-28' },
  { id: '4', verifier: 'oracle_community_02', channel: 'volunteer', subject: 'Cleanup report #341', result: 'disputed', date: '2026-03-27' },
  { id: '5', verifier: 'oracle_senior_01', channel: 'eldercare', subject: 'Home visit #567', result: 'verified', date: '2026-03-26' },
  { id: '6', verifier: 'oracle_gov_01', channel: 'governance', subject: 'Vote verification #78', result: 'rejected', date: '2026-03-25' },
];

type Tab = 'verifiers' | 'attestations' | 'accuracy';
const STATUS_COLORS: Record<string, string> = { active: '#34C759', inactive: '#8E8E93', slashed: '#FF3B30' };
const RESULT_COLORS: Record<string, string> = { verified: '#34C759', rejected: '#FF3B30', disputed: '#FF9500' };

export function OracleNetworkScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('verifiers');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const networkStats = useMemo(() => ({
    totalVerifiers: DEMO_VERIFIERS.filter((v) => v.status === 'active').length,
    totalAttestations: DEMO_VERIFIERS.reduce((s, v) => s + v.attestations, 0),
    avgAccuracy: (DEMO_VERIFIERS.filter((v) => v.status === 'active').reduce((s, v) => s + v.accuracy, 0) / DEMO_VERIFIERS.filter((v) => v.status === 'active').length).toFixed(1),
    totalStaked: DEMO_VERIFIERS.reduce((s, v) => s + v.stake, 0),
  }), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    verifierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    verifierInfo: { flex: 1 },
    verifierName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    verifierMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    verifierRight: { alignItems: 'flex-end' },
    verifierAccuracy: { fontSize: fonts.lg, fontWeight: fonts.heavy },
    verifierStatus: { fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2 },
    attRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    attInfo: { flex: 1 },
    attSubject: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    attMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    attResult: { fontSize: fonts.sm, fontWeight: fonts.bold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    accCard: { alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    accName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    accBar: { height: 8, borderRadius: 4, marginTop: 8, width: '100%' },
    accValue: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'verifiers', label: 'Verifiers' },
    { key: 'attestations', label: 'Attestations' },
    { key: 'accuracy', label: 'Accuracy' },
  ];

  const renderVerifiers = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.green }]}>{networkStats.totalVerifiers}</Text><Text style={s.summaryLabel}>Active</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{networkStats.totalAttestations.toLocaleString()}</Text><Text style={s.summaryLabel}>Attestations</Text></View>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.blue }]}>{networkStats.avgAccuracy}%</Text><Text style={s.summaryLabel}>Avg Accuracy</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{networkStats.totalStaked.toLocaleString()}</Text><Text style={s.summaryLabel}>Staked OTK</Text></View>
        </View>
      </View>
      <Text style={s.sectionTitle}>All Verifiers</Text>
      <View style={s.card}>
        {DEMO_VERIFIERS.map((v) => (
          <View key={v.id} style={s.verifierRow}>
            <View style={s.verifierInfo}>
              <Text style={s.verifierName}>{v.name}</Text>
              <Text style={s.verifierMeta}>{v.channel} | {v.attestations} attestations | {v.stake.toLocaleString()} staked</Text>
            </View>
            <View style={s.verifierRight}>
              <Text style={[s.verifierAccuracy, { color: v.accuracy >= 95 ? t.accent.green : v.accuracy >= 85 ? t.accent.orange : t.accent.red }]}>{v.accuracy}%</Text>
              <Text style={[s.verifierStatus, { color: STATUS_COLORS[v.status] }]}>{v.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderAttestations = () => (
    <>
      <Text style={s.sectionTitle}>Recent Attestations</Text>
      <View style={s.card}>
        {DEMO_ATTESTATIONS.map((a) => (
          <View key={a.id} style={s.attRow}>
            <View style={s.attInfo}>
              <Text style={s.attSubject}>{a.subject}</Text>
              <Text style={s.attMeta}>{a.date} | {a.verifier} | {a.channel}</Text>
            </View>
            <Text style={[s.attResult, { color: RESULT_COLORS[a.result], backgroundColor: RESULT_COLORS[a.result] + '20' }]}>{a.result}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderAccuracy = () => (
    <>
      <Text style={s.sectionTitle}>Verifier Accuracy</Text>
      <View style={s.card}>
        {DEMO_VERIFIERS.filter((v) => v.status !== 'slashed').sort((a, b) => b.accuracy - a.accuracy).map((v) => (
          <View key={v.id} style={s.accCard}>
            <Text style={s.accName}>{v.name}</Text>
            <View style={[s.accBar, { backgroundColor: t.bg.primary }]}>
              <View style={[s.accBar, { width: `${v.accuracy}%`, backgroundColor: v.accuracy >= 98 ? t.accent.green : t.accent.blue, position: 'absolute' }]} />
            </View>
            <Text style={s.accValue}>{v.accuracy}% ({v.attestations} attestations)</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Oracle Network</Text>
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
        {tab === 'verifiers' && renderVerifiers()}
        {tab === 'attestations' && renderAttestations()}
        {tab === 'accuracy' && renderAccuracy()}
      </ScrollView>
    </SafeAreaView>
  );
}
