import { fonts } from '../utils/theme';
/**
 * Community Vault Screen — Community shared vault for collective savings.
 *
 * View vault balance, deposit OTK, request withdrawals.
 * Demo mode with sample vault data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface VaultMember {
  name: string;
  deposited: number;
  share: number;
}

interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  member: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_MEMBERS: VaultMember[] = [
  { name: 'You', deposited: 2400, share: 18.5 },
  { name: 'Member_Sarah', deposited: 3200, share: 24.6 },
  { name: 'Member_Marco', deposited: 1800, share: 13.8 },
  { name: 'Member_Anika', deposited: 2900, share: 22.3 },
  { name: 'Member_James', deposited: 1500, share: 11.5 },
  { name: 'Member_Yuki', deposited: 1200, share: 9.3 },
];

const DEMO_TXS: VaultTransaction[] = [
  { id: '1', type: 'deposit', member: 'Member_Anika', amount: 500, date: '2026-03-29', status: 'completed' },
  { id: '2', type: 'withdraw', member: 'Member_Marco', amount: 200, date: '2026-03-28', status: 'pending' },
  { id: '3', type: 'deposit', member: 'You', amount: 400, date: '2026-03-26', status: 'completed' },
  { id: '4', type: 'deposit', member: 'Member_Sarah', amount: 800, date: '2026-03-24', status: 'completed' },
  { id: '5', type: 'withdraw', member: 'Member_Yuki', amount: 300, date: '2026-03-22', status: 'rejected' },
  { id: '6', type: 'deposit', member: 'Member_James', amount: 500, date: '2026-03-20', status: 'completed' },
];

type Tab = 'vault' | 'deposit' | 'withdraw';
const VAULT_TOTAL = 13000;
const STATUS_COLORS: Record<string, string> = { completed: '#34C759', pending: '#FF9500', rejected: '#FF3B30' };

export function CommunityVaultScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('vault');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleDeposit = useCallback(() => {
    const amt = parseInt(depositAmount, 10);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    Alert.alert('Deposited', `${amt} OTK deposited to community vault.`);
    setDepositAmount('');
  }, [depositAmount]);

  const handleWithdraw = useCallback(() => {
    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    if (!withdrawReason.trim()) { Alert.alert('Required', 'Provide a reason for withdrawal.'); return; }
    Alert.alert('Requested', `Withdrawal of ${amt} OTK submitted for community approval.`);
    setWithdrawAmount('');
    setWithdrawReason('');
  }, [withdrawAmount, withdrawReason]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    vaultTotal: { color: t.accent.green, fontSize: 42, fontWeight: fonts.heavy, textAlign: 'center' },
    vaultLabel: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    memberInfo: { flex: 1 },
    memberName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    memberMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    memberShare: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    txInfo: { flex: 1 },
    txDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    txMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    txAmount: { fontSize: fonts.md, fontWeight: fonts.heavy },
    txStatus: { fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2, textAlign: 'right' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    withdrawBtn: { backgroundColor: t.accent.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    infoText: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 18 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'vault', label: 'Vault' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'withdraw', label: 'Withdraw' },
  ];

  const renderVault = () => (
    <>
      <View style={s.card}>
        <Text style={s.vaultLabel}>Community Vault Balance</Text>
        <Text style={s.vaultTotal}>{VAULT_TOTAL.toLocaleString()}</Text>
        <Text style={s.vaultLabel}>{DEMO_MEMBERS.length} members</Text>
      </View>
      <Text style={s.sectionTitle}>Members</Text>
      <View style={s.card}>
        {DEMO_MEMBERS.map((m, i) => (
          <View key={i} style={s.memberRow}>
            <View style={s.memberInfo}>
              <Text style={[s.memberName, m.name === 'You' && { color: t.accent.green }]}>{m.name}</Text>
              <Text style={s.memberMeta}>{m.deposited.toLocaleString()} OTK deposited</Text>
            </View>
            <Text style={s.memberShare}>{m.share}%</Text>
          </View>
        ))}
      </View>
      <Text style={s.sectionTitle}>Recent Activity</Text>
      <View style={s.card}>
        {DEMO_TXS.slice(0, 4).map((tx) => (
          <View key={tx.id} style={s.txRow}>
            <View style={s.txInfo}>
              <Text style={s.txDesc}>{tx.member}</Text>
              <Text style={s.txMeta}>{tx.date}</Text>
            </View>
            <View>
              <Text style={[s.txAmount, { color: tx.type === 'deposit' ? t.accent.green : t.accent.orange }]}>
                {tx.type === 'deposit' ? '+' : '-'}{tx.amount} OTK
              </Text>
              <Text style={[s.txStatus, { color: STATUS_COLORS[tx.status] }]}>{tx.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderDeposit = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Deposit to Vault</Text>
      <TextInput style={s.input} placeholder="Amount (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={depositAmount} onChangeText={setDepositAmount} />
      <TouchableOpacity style={s.submitBtn} onPress={handleDeposit}>
        <Text style={s.submitText}>Deposit</Text>
      </TouchableOpacity>
      <Text style={s.infoText}>Deposits are instant. Your vault share updates automatically.</Text>
    </View>
  );

  const renderWithdraw = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Request Withdrawal</Text>
      <TextInput style={s.input} placeholder="Amount (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
      <TextInput style={s.input} placeholder="Reason for withdrawal" placeholderTextColor={t.text.muted} value={withdrawReason} onChangeText={setWithdrawReason} multiline />
      <TouchableOpacity style={s.withdrawBtn} onPress={handleWithdraw}>
        <Text style={s.submitText}>Request Withdrawal</Text>
      </TouchableOpacity>
      <Text style={s.infoText}>Withdrawals require majority approval from vault members.{'\n'}Processing time: 24-48 hours.</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Community Vault</Text>
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
        {tab === 'vault' && renderVault()}
        {tab === 'deposit' && renderDeposit()}
        {tab === 'withdraw' && renderWithdraw()}
      </ScrollView>
    </SafeAreaView>
  );
}
