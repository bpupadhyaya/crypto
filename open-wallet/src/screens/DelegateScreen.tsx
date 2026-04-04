import { fonts } from '../utils/theme';
/**
 * Delegate Screen — Delegate your governance power to a representative.
 *
 * Browse representatives, delegate voting power, track delegation history.
 * Demo mode with sample delegate data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Representative {
  id: string;
  name: string;
  address: string;
  votesReceived: number;
  proposalsVoted: number;
  alignment: number;
  specialty: string;
  active: boolean;
}

interface DelegationRecord {
  id: string;
  representative: string;
  amount: number;
  date: string;
  status: 'active' | 'revoked' | 'expired';
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_REPS: Representative[] = [
  { id: '1', name: 'Council_Sarah', address: 'openchain1abc...sarah', votesReceived: 12400, proposalsVoted: 47, alignment: 92, specialty: 'Education', active: true },
  { id: '2', name: 'Delegate_Marco', address: 'openchain1def...marco', votesReceived: 8900, proposalsVoted: 38, alignment: 87, specialty: 'Infrastructure', active: true },
  { id: '3', name: 'Voice_Anika', address: 'openchain1ghi...anika', votesReceived: 15200, proposalsVoted: 52, alignment: 95, specialty: 'Community', active: true },
  { id: '4', name: 'Rep_James', address: 'openchain1jkl...james', votesReceived: 6100, proposalsVoted: 29, alignment: 78, specialty: 'Treasury', active: true },
  { id: '5', name: 'Steward_Yuki', address: 'openchain1mno...yuki', votesReceived: 3400, proposalsVoted: 15, alignment: 84, specialty: 'Environment', active: false },
];

const DEMO_HISTORY: DelegationRecord[] = [
  { id: '1', representative: 'Voice_Anika', amount: 500, date: '2026-03-28', status: 'active' },
  { id: '2', representative: 'Council_Sarah', amount: 300, date: '2026-03-15', status: 'revoked' },
  { id: '3', representative: 'Delegate_Marco', amount: 200, date: '2026-02-20', status: 'expired' },
];

type Tab = 'delegate' | 'representatives' | 'history';
const STATUS_COLORS: Record<string, string> = { active: '#34C759', revoked: '#FF3B30', expired: '#8E8E93' };

export function DelegateScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('delegate');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const currentDelegation = DEMO_HISTORY.find((d) => d.status === 'active');
  const votingPower = 1200;

  const handleDelegate = useCallback((rep: Representative) => {
    Alert.alert('Delegate', `Delegate voting power to ${rep.name}?\nSpecialty: ${rep.specialty}\nAlignment: ${rep.alignment}%`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delegate', onPress: () => Alert.alert('Delegated', `Your voting power is now delegated to ${rep.name}.`) },
    ]);
  }, []);

  const handleRevoke = useCallback(() => {
    Alert.alert('Revoke Delegation', 'Remove your current delegation? Your voting power returns to you.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => Alert.alert('Revoked', 'Delegation removed.') },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    powerValue: { color: t.accent.purple, fontSize: 42, fontWeight: fonts.heavy, textAlign: 'center' },
    powerLabel: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    activeBox: { backgroundColor: t.accent.green + '12', borderRadius: 12, padding: 16, marginTop: 16 },
    activeLabel: { color: t.text.muted, fontSize: fonts.sm },
    activeName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginTop: 4 },
    activeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    revokeBtn: { backgroundColor: t.accent.red + '20', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    revokeText: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold },
    repRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    repInfo: { flex: 1 },
    repName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    repMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    repAlign: { fontSize: fonts.sm, fontWeight: fonts.bold, marginRight: 12 },
    delegateBtn: { backgroundColor: t.accent.purple, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    delegateBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    histInfo: { flex: 1 },
    histName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    histMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    histStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'delegate', label: 'Delegate' },
    { key: 'representatives', label: 'Representatives' },
    { key: 'history', label: 'History' },
  ];

  const renderDelegate = () => (
    <>
      <View style={s.card}>
        <Text style={s.powerLabel}>Your Voting Power</Text>
        <Text style={s.powerValue}>{votingPower}</Text>
        <Text style={[s.powerLabel, { marginTop: 8 }]}>OTK staked for governance</Text>
        {currentDelegation && (
          <View style={s.activeBox}>
            <Text style={s.activeLabel}>Currently Delegated To</Text>
            <Text style={s.activeName}>{currentDelegation.representative}</Text>
            <Text style={s.activeMeta}>Since {currentDelegation.date} | {currentDelegation.amount} OTK</Text>
            <TouchableOpacity style={s.revokeBtn} onPress={handleRevoke}>
              <Text style={s.revokeText}>Revoke Delegation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );

  const renderReps = () => (
    <>
      <Text style={s.sectionTitle}>Representatives</Text>
      <View style={s.card}>
        {DEMO_REPS.filter((r) => r.active).map((rep) => (
          <View key={rep.id} style={s.repRow}>
            <View style={s.repInfo}>
              <Text style={s.repName}>{rep.name}</Text>
              <Text style={s.repMeta}>{rep.specialty} | {rep.proposalsVoted} votes | {rep.votesReceived.toLocaleString()} delegated</Text>
            </View>
            <Text style={[s.repAlign, { color: rep.alignment >= 90 ? t.accent.green : rep.alignment >= 80 ? t.accent.blue : t.accent.orange }]}>{rep.alignment}%</Text>
            <TouchableOpacity style={s.delegateBtn} onPress={() => handleDelegate(rep)}>
              <Text style={s.delegateBtnText}>Delegate</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Delegation History</Text>
      <View style={s.card}>
        {DEMO_HISTORY.map((d) => (
          <View key={d.id} style={s.histRow}>
            <View style={s.histInfo}>
              <Text style={s.histName}>{d.representative}</Text>
              <Text style={s.histMeta}>{d.date} | {d.amount} OTK</Text>
            </View>
            <Text style={[s.histStatus, { color: STATUS_COLORS[d.status], backgroundColor: STATUS_COLORS[d.status] + '20' }]}>{d.status}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Delegate</Text>
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
        {tab === 'delegate' && renderDelegate()}
        {tab === 'representatives' && renderReps()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
