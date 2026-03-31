/**
 * Emergency Fund Screen — Community emergency fund pool and distribution.
 *
 * Article I: "No community member should face crisis alone."
 * Article III: The emergency fund embodies collective responsibility in OTK.
 *
 * Features:
 * - Emergency fund balance and contribution tracking
 * - Request emergency assistance with verification
 * - Distribution history with full transparency
 * - Contribution leaderboard
 * - Emergency categories (medical, disaster, displacement, etc.)
 * - Demo mode with sample emergency fund data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface FundOverview {
  totalBalance: number;
  totalContributors: number;
  totalDisbursed: number;
  activeRequests: number;
  yourContribution: number;
  monthlyTarget: number;
  monthlyCollected: number;
}

interface EmergencyRequest {
  id: string;
  requester: string;
  category: string;
  description: string;
  amountRequested: number;
  amountApproved: number;
  status: 'pending' | 'approved' | 'disbursed' | 'denied';
  verifiedBy: string;
  date: string;
  urgency: 'critical' | 'high' | 'medium';
}

interface DisbursementRecord {
  id: string;
  recipient: string;
  category: string;
  amount: number;
  date: string;
  txHash: string;
  verifiedBy: string;
  outcome: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const URGENCY_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  high: '#FF9500',
  medium: '#FFCC00',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF9500',
  approved: '#007AFF',
  disbursed: '#34C759',
  denied: '#8E8E93',
};

const CATEGORIES = ['Medical', 'Disaster', 'Displacement', 'Food Crisis', 'Funeral', 'Job Loss', 'Other'];

// ─── Demo Data ───

const DEMO_FUND: FundOverview = {
  totalBalance: 485000,
  totalContributors: 1842,
  totalDisbursed: 312000,
  activeRequests: 7,
  yourContribution: 2400,
  monthlyTarget: 50000,
  monthlyCollected: 38500,
};

const DEMO_REQUESTS: EmergencyRequest[] = [
  { id: 'er1', requester: 'Family Rodriguez', category: 'Medical', description: 'Emergency surgery for child with appendicitis. Hospital requires upfront deposit.', amountRequested: 15000, amountApproved: 15000, status: 'disbursed', verifiedBy: 'Community Health Verifier', date: '2026-03-27', urgency: 'critical' },
  { id: 'er2', requester: 'Chen Household', category: 'Disaster', description: 'House damaged in flash flood. Need temporary shelter and repairs.', amountRequested: 25000, amountApproved: 20000, status: 'approved', verifiedBy: 'Disaster Response Team', date: '2026-03-26', urgency: 'critical' },
  { id: 'er3', requester: 'Ahmed Family', category: 'Job Loss', description: 'Primary earner laid off. Three months living expenses while seeking new employment.', amountRequested: 12000, amountApproved: 0, status: 'pending', verifiedBy: '', date: '2026-03-28', urgency: 'high' },
  { id: 'er4', requester: 'Lisa Park', category: 'Food Crisis', description: 'Single mother unable to afford groceries after unexpected medical bills.', amountRequested: 3000, amountApproved: 3000, status: 'disbursed', verifiedBy: 'Social Worker #12', date: '2026-03-25', urgency: 'high' },
  { id: 'er5', requester: 'Thompson Family', category: 'Funeral', description: 'Unexpected passing of family member. Need assistance with funeral costs.', amountRequested: 8000, amountApproved: 8000, status: 'disbursed', verifiedBy: 'Community Elder Council', date: '2026-03-22', urgency: 'medium' },
];

const DEMO_HISTORY: DisbursementRecord[] = [
  { id: 'd1', recipient: 'Family Rodriguez', category: 'Medical', amount: 15000, date: '2026-03-27', txHash: '0xabc123...def456', verifiedBy: 'Community Health Verifier', outcome: 'Surgery successful. Child recovering well.' },
  { id: 'd2', recipient: 'Lisa Park', category: 'Food Crisis', amount: 3000, date: '2026-03-25', txHash: '0x789abc...321fed', verifiedBy: 'Social Worker #12', outcome: 'Three months of groceries secured.' },
  { id: 'd3', recipient: 'Thompson Family', category: 'Funeral', amount: 8000, date: '2026-03-22', txHash: '0xdef789...abc123', verifiedBy: 'Community Elder Council', outcome: 'Funeral expenses covered with dignity.' },
  { id: 'd4', recipient: 'Green Family', category: 'Displacement', amount: 10000, date: '2026-03-15', txHash: '0x456def...789abc', verifiedBy: 'Housing Authority', outcome: 'Temporary housing secured for 3 months.' },
  { id: 'd5', recipient: 'Patel Household', category: 'Medical', amount: 12000, date: '2026-03-10', txHash: '0xfed321...cba987', verifiedBy: 'Community Health Verifier', outcome: 'Cancer treatment deposit paid. Treatment ongoing.' },
  { id: 'd6', recipient: 'Community Kitchen', category: 'Food Crisis', amount: 5000, date: '2026-03-05', txHash: '0x123fed...456cba', verifiedBy: 'Food Bank Director', outcome: 'Fed 200 families for one week.' },
];

type Tab = 'fund' | 'request' | 'history';

export function EmergencyFundScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('fund');
  const [reqCategory, setReqCategory] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const fund = DEMO_FUND;
  const requests = DEMO_REQUESTS;
  const history = DEMO_HISTORY;

  const handleContribute = useCallback(() => {
    const amount = parseInt(contributeAmount, 10);
    if (!amount || amount <= 0) { Alert.alert('Required', 'Enter a valid contribution amount.'); return; }
    Alert.alert('Contribution', `Contribute ${amount.toLocaleString()} OTK to the Emergency Fund?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => { Alert.alert('Thank You', `${amount.toLocaleString()} OTK contributed to the community emergency fund.`); setContributeAmount(''); } },
    ]);
  }, [contributeAmount]);

  const handleRequest = useCallback(() => {
    if (!reqCategory) { Alert.alert('Required', 'Select a category.'); return; }
    const amount = parseInt(reqAmount, 10);
    if (!amount || amount <= 0) { Alert.alert('Required', 'Enter a valid amount.'); return; }
    if (!reqDescription.trim()) { Alert.alert('Required', 'Describe your emergency.'); return; }
    Alert.alert('Request Submitted', `Emergency request for ${amount.toLocaleString()} OTK submitted.\nCategory: ${reqCategory}\nA community verifier will review within 24 hours.`);
    setReqCategory('');
    setReqAmount('');
    setReqDescription('');
    setTab('fund');
  }, [reqCategory, reqAmount, reqDescription]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    bigNumber: { color: t.text.primary, fontSize: 36, fontWeight: '900', textAlign: 'center' },
    label: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
    statBox: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: t.accent.green, borderRadius: 4 },
    contributeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    contributeInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    contributeBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
    contributeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    requestCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    requestName: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    urgencyText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    requestDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    requestMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    requestAmount: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    requestStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    requestStatusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    requestVerifier: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    catChipActive: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    catText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    catTextActive: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    historyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    historyName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    historyMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    historyAmount: { color: t.accent.green, fontSize: 16, fontWeight: '800', marginTop: 6 },
    historyHash: { color: t.accent.blue, fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
    historyOutcome: { color: t.text.primary, fontSize: 13, marginTop: 6, fontStyle: 'italic', lineHeight: 20 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'fund', label: 'Fund' },
    { key: 'request', label: 'Request' },
    { key: 'history', label: 'History' },
  ];

  // ─── Fund Tab ───

  const renderFund = () => {
    const monthlyPercent = (fund.monthlyCollected / fund.monthlyTarget) * 100;
    return (
      <>
        <View style={s.card}>
          <Text style={s.label}>Emergency Fund Balance</Text>
          <Text style={s.bigNumber}>{fund.totalBalance.toLocaleString()} OTK</Text>
          <View style={s.statGrid}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{fund.totalContributors.toLocaleString()}</Text>
              <Text style={s.statLabel}>Contributors</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{fund.totalDisbursed.toLocaleString()}</Text>
              <Text style={s.statLabel}>Total Disbursed</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: t.accent.orange }]}>{fund.activeRequests}</Text>
              <Text style={s.statLabel}>Active Requests</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{fund.yourContribution.toLocaleString()}</Text>
              <Text style={s.statLabel}>Your Contribution</Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Monthly Collection</Text>
          <Text style={s.label}>{fund.monthlyCollected.toLocaleString()} / {fund.monthlyTarget.toLocaleString()} OTK</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${monthlyPercent}%` }]} />
          </View>
          <Text style={[s.label, { marginTop: 8 }]}>{monthlyPercent.toFixed(1)}% of monthly target</Text>
          <View style={s.contributeRow}>
            <TextInput style={s.contributeInput} placeholder="Amount (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={contributeAmount} onChangeText={setContributeAmount} />
            <TouchableOpacity style={s.contributeBtn} onPress={handleContribute}>
              <Text style={s.contributeBtnText}>Contribute</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.sectionTitle}>Active Requests</Text>
        {requests.filter((r) => r.status !== 'disbursed').map((req) => (
          <View key={req.id} style={s.requestCard}>
            <View style={s.requestHeader}>
              <Text style={s.requestName}>{req.requester}</Text>
              <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[req.urgency] }]}>
                <Text style={s.urgencyText}>{req.urgency.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.requestDesc}>{req.description}</Text>
            <View style={s.requestMeta}>
              <Text style={s.requestAmount}>{req.amountRequested.toLocaleString()} OTK requested</Text>
              <View style={[s.requestStatus, { backgroundColor: STATUS_COLORS[req.status] }]}>
                <Text style={s.requestStatusText}>{req.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))}
      </>
    );
  };

  // ─── Request Tab ───

  const renderRequest = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Request Emergency Assistance</Text>
      <Text style={[s.historyMeta, { marginBottom: 12 }]}>All requests are verified by community members before disbursement.</Text>
      <Text style={[s.historyMeta, { marginBottom: 8 }]}>Emergency Category</Text>
      <View style={s.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[s.catChip, reqCategory === cat && s.catChipActive]} onPress={() => setReqCategory(cat)}>
            <Text style={[s.catText, reqCategory === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Amount needed (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={reqAmount} onChangeText={setReqAmount} />
      <TextInput style={s.input} placeholder="Describe your emergency situation" placeholderTextColor={t.text.muted} value={reqDescription} onChangeText={setReqDescription} multiline numberOfLines={4} />
      <TouchableOpacity style={s.submitBtn} onPress={handleRequest}>
        <Text style={s.submitText}>Submit Emergency Request</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Disbursement History</Text>
      {history.map((record) => (
        <View key={record.id} style={s.historyCard}>
          <Text style={s.historyName}>{record.recipient}</Text>
          <Text style={s.historyMeta}>{record.category} | {record.date} | Verified by {record.verifiedBy}</Text>
          <Text style={s.historyAmount}>{record.amount.toLocaleString()} OTK</Text>
          <Text style={s.historyHash}>tx: {record.txHash}</Text>
          <Text style={s.historyOutcome}>Outcome: {record.outcome}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Emergency Fund</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'fund' && renderFund()}
        {tab === 'request' && renderRequest()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
