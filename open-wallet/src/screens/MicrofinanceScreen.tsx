import { fonts } from '../utils/theme';
/**
 * Microfinance Screen — Community micro-loans and savings circles.
 *
 * Manages rotating savings circles where members contribute monthly and
 * one member receives the pot each round, plus micro-loans with low/no
 * interest for community members, including application and repayment.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type MicrofinanceTab = 'circles' | 'loans' | 'apply' | 'repay';

interface CircleMember {
  name: string;
  contributed: boolean;
  receivedRound: number | null; // which round they received the pot
}

interface SavingsCircle {
  id: string;
  name: string;
  monthlyContribution: number; // OTK per member per round
  totalMembers: number;
  members: CircleMember[];
  currentRound: number;
  totalRounds: number;
  nextPayoutDate: number;
  currentRecipient: string;
}

type LoanStatus = 'active' | 'repaid' | 'pending';

interface MicroLoan {
  id: string;
  borrower: string;
  amount: number;       // OTK
  interestRate: number;  // percentage
  purpose: string;
  status: LoanStatus;
  issuedAt: number;
  dueAt: number;
  repaid: number;        // OTK repaid so far
  guarantors: string[];
}

// --- Demo data ---

const NOW = Date.now();
const DAY = 86_400_000;

const DEMO_CIRCLE: SavingsCircle = {
  id: 'sc_001',
  name: 'Sunrise Savings Circle',
  monthlyContribution: 50,
  totalMembers: 8,
  members: [
    { name: 'Amara O.', contributed: true, receivedRound: 1 },
    { name: 'David C.', contributed: true, receivedRound: 2 },
    { name: 'Priya S.', contributed: true, receivedRound: 3 },
    { name: 'You', contributed: true, receivedRound: null },
    { name: 'James K.', contributed: false, receivedRound: null },
    { name: 'Elena V.', contributed: true, receivedRound: null },
    { name: 'Samuel K.', contributed: true, receivedRound: null },
    { name: 'Leila A.', contributed: false, receivedRound: null },
  ],
  currentRound: 4,
  totalRounds: 8,
  nextPayoutDate: NOW + 12 * DAY,
  currentRecipient: 'You',
};

const DEMO_LOANS: MicroLoan[] = [
  {
    id: 'ml_001', borrower: 'Maria Lopez', amount: 200, interestRate: 0,
    purpose: 'Purchase sewing machine for tailoring business.',
    status: 'active', issuedAt: NOW - 45 * DAY, dueAt: NOW + 45 * DAY,
    repaid: 80, guarantors: ['Amara O.', 'David C.'],
  },
  {
    id: 'ml_002', borrower: 'Kwame Asante', amount: 150, interestRate: 1,
    purpose: 'Buy seeds and tools for community garden expansion.',
    status: 'active', issuedAt: NOW - 20 * DAY, dueAt: NOW + 70 * DAY,
    repaid: 30, guarantors: ['Elena V.'],
  },
];

// --- Helpers ---

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(epoch: number): number {
  return Math.max(0, Math.ceil((epoch - NOW) / DAY));
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Active', repaid: 'Repaid', pending: 'Pending Approval',
};

const STATUS_COLORS: Record<LoanStatus, string> = {
  active: '#34c759', repaid: '#8e8e93', pending: '#f5a623',
};

// --- Component ---

interface Props {
  onClose: () => void;
}

export function MicrofinanceScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<MicrofinanceTab>('circles');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  const circle = DEMO_CIRCLE;
  const loans = DEMO_LOANS;

  const tabs: { key: MicrofinanceTab; label: string }[] = [
    { key: 'circles', label: 'Circles' },
    { key: 'loans', label: `Loans (${loans.length})` },
    { key: 'apply', label: 'Apply' },
    { key: 'repay', label: 'Repay' },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
    tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    cardSub: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    statBox: { alignItems: 'center' },
    statNumber: { color: t.text.primary, fontSize: 22, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.bg.primary },
    memberName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    memberStatus: { fontSize: 12, fontWeight: fonts.semibold },
    progressBarBg: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 10 },
    progressBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    highlight: { color: t.accent.blue, fontWeight: fonts.bold },
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    loanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    loanLabel: { color: t.text.secondary, fontSize: 12 },
    loanValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    loanSelect: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, marginBottom: 8 },
    loanSelectActive: { borderWidth: 2, borderColor: t.accent.blue },
    loanSelectText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    loanSelectSub: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const renderCircles = () => (
    <View>
      <Text style={st.section}>My Savings Circle</Text>
      <View style={st.card}>
        <Text style={st.cardTitle}>{'\u{1F4B0}'} {circle.name}</Text>
        <View style={st.statsRow}>
          <View style={st.statBox}>
            <Text style={st.statNumber}>{circle.totalMembers}</Text>
            <Text style={st.statLabel}>Members</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statNumber}>{circle.monthlyContribution}</Text>
            <Text style={st.statLabel}>OTK / Month</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statNumber}>{circle.monthlyContribution * circle.totalMembers}</Text>
            <Text style={st.statLabel}>Pot Size</Text>
          </View>
          <View style={st.statBox}>
            <Text style={st.statNumber}>{circle.currentRound}/{circle.totalRounds}</Text>
            <Text style={st.statLabel}>Round</Text>
          </View>
        </View>
        <Text style={st.cardSub}>
          Next payout: <Text style={st.highlight}>{circle.currentRecipient}</Text> in {daysUntil(circle.nextPayoutDate)} days
        </Text>
        <Text style={st.cardMeta}>Payout date: {formatDate(circle.nextPayoutDate)}</Text>
      </View>

      <Text style={st.section}>Members</Text>
      <View style={st.card}>
        {circle.members.map((m, i) => (
          <View key={i} style={st.memberRow}>
            <Text style={st.memberName}>{m.name}</Text>
            <Text style={[st.memberStatus, { color: m.contributed ? '#34c759' : '#ff3b30' }]}>
              {m.receivedRound != null
                ? `Received (R${m.receivedRound})`
                : m.contributed ? 'Paid' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLoans = () => (
    <View>
      <Text style={st.section}>Micro-Loans</Text>
      {loans.map(l => {
        const pct = l.amount > 0 ? (l.repaid / l.amount) * 100 : 0;
        return (
          <View key={l.id} style={st.card}>
            <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[l.status] }]}>
              <Text style={st.statusText}>{STATUS_LABELS[l.status]}</Text>
            </View>
            <Text style={st.cardTitle}>{l.borrower}</Text>
            <Text style={st.cardSub}>{l.purpose}</Text>
            <View style={st.loanRow}>
              <Text style={st.loanLabel}>Amount</Text>
              <Text style={st.loanValue}>{l.amount} OTK</Text>
            </View>
            <View style={st.loanRow}>
              <Text style={st.loanLabel}>Interest</Text>
              <Text style={st.loanValue}>{l.interestRate}%</Text>
            </View>
            <View style={st.loanRow}>
              <Text style={st.loanLabel}>Repaid</Text>
              <Text style={st.loanValue}>{l.repaid} / {l.amount} OTK</Text>
            </View>
            <View style={st.progressBarBg}>
              <View style={[st.progressBarFill, { width: `${pct}%` }]} />
            </View>
            <View style={st.loanRow}>
              <Text style={st.loanLabel}>Guarantors</Text>
              <Text style={st.loanValue}>{l.guarantors.join(', ')}</Text>
            </View>
            <Text style={st.cardMeta}>
              Issued {formatDate(l.issuedAt)} {'\u2022'} Due {formatDate(l.dueAt)} ({daysUntil(l.dueAt)} days)
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderApply = () => (
    <View>
      <Text style={st.section}>Apply for a Micro-Loan</Text>
      <Text style={st.inputLabel}>Loan Amount (OTK)</Text>
      <TextInput
        style={st.input}
        placeholder="e.g. 200"
        placeholderTextColor={t.text.muted}
        value={loanAmount}
        onChangeText={setLoanAmount}
        keyboardType="numeric"
      />
      <Text style={st.inputLabel}>Purpose</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="What will you use this loan for?"
        placeholderTextColor={t.text.muted}
        value={loanPurpose}
        onChangeText={setLoanPurpose}
        multiline
      />
      <View style={st.card}>
        <Text style={st.cardSub}>
          {'\u{2139}\uFE0F'} Micro-loans are community-backed with low or zero interest. A guarantor from your savings circle must vouch for the loan. Repayment is tracked on-chain.
        </Text>
      </View>
      <TouchableOpacity style={st.submitBtn}>
        <Text style={st.submitBtnText}>{'\u{1F4DD}'} Submit Application</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRepay = () => {
    const activeLoans = loans.filter(l => l.status === 'active');
    return (
      <View>
        <Text style={st.section}>Repay a Loan</Text>
        {activeLoans.length === 0 ? (
          <Text style={st.emptyText}>No active loans to repay.</Text>
        ) : (
          <>
            <Text style={st.inputLabel}>Select Loan</Text>
            {activeLoans.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[st.loanSelect, selectedLoan === l.id && st.loanSelectActive]}
                onPress={() => setSelectedLoan(l.id)}
              >
                <Text style={st.loanSelectText}>{l.borrower} \u2014 {l.amount} OTK</Text>
                <Text style={st.loanSelectSub}>Remaining: {l.amount - l.repaid} OTK {'\u2022'} Due {formatDate(l.dueAt)}</Text>
              </TouchableOpacity>
            ))}
            <Text style={st.inputLabel}>Repayment Amount (OTK)</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. 50"
              placeholderTextColor={t.text.muted}
              value={repayAmount}
              onChangeText={setRepayAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={st.submitBtn}>
              <Text style={st.submitBtnText}>{'\u{1F4B8}'} Make Payment</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{'\u{1F4B0}'} Microfinance</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tabBtn, tab === tb.key && st.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.scroll}>
        {tab === 'circles' && renderCircles()}
        {tab === 'loans' && renderLoans()}
        {tab === 'apply' && renderApply()}
        {tab === 'repay' && renderRepay()}
      </ScrollView>
    </SafeAreaView>
  );
}
