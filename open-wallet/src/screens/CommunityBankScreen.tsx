import { fonts } from '../utils/theme';
/**
 * Community Bank Screen — Community banking: savings accounts, micro-loans, shared investment.
 *
 * Article I: "Financial inclusion is a fundamental human right."
 * Article III: Community banking empowers collective prosperity through OTK.
 *
 * Features:
 * - Community savings accounts with competitive yields
 * - Micro-loan applications and management
 * - Shared investment pools with transparent returns
 * - Loan repayment tracking
 * - Community credit scoring based on contribution
 * - Demo mode with sample banking data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  apy: number;
  interestEarned: number;
  type: 'personal' | 'community' | 'goal';
  targetAmount: number | null;
  createdDate: string;
}

interface MicroLoan {
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  interestRate: number;
  termMonths: number;
  repaid: number;
  status: 'active' | 'repaid' | 'pending' | 'overdue';
  startDate: string;
  communityScore: number;
}

interface InvestmentPool {
  id: string;
  name: string;
  description: string;
  totalPool: number;
  yourContribution: number;
  currentReturn: number;
  members: number;
  riskLevel: 'low' | 'medium' | 'high';
  minContribution: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const STATUS_COLORS: Record<string, string> = {
  active: '#007AFF',
  repaid: '#34C759',
  pending: '#FF9500',
  overdue: '#FF3B30',
};

const RISK_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_ACCOUNTS: SavingsAccount[] = [
  { id: 'sa1', name: 'General Savings', balance: 45000, apy: 5.2, interestEarned: 1840, type: 'personal', targetAmount: null, createdDate: '2025-06-15' },
  { id: 'sa2', name: 'Community Emergency Pool', balance: 12500, apy: 4.8, interestEarned: 480, type: 'community', targetAmount: null, createdDate: '2025-09-01' },
  { id: 'sa3', name: 'Home Down Payment', balance: 28000, apy: 5.5, interestEarned: 1210, type: 'goal', targetAmount: 50000, createdDate: '2025-03-10' },
  { id: 'sa4', name: 'Education Fund', balance: 8500, apy: 5.0, interestEarned: 340, type: 'goal', targetAmount: 20000, createdDate: '2025-11-20' },
];

const DEMO_LOANS: MicroLoan[] = [
  { id: 'ml1', borrower: 'You', amount: 5000, purpose: 'Small business equipment purchase', interestRate: 3.5, termMonths: 12, repaid: 2800, status: 'active', startDate: '2025-10-01', communityScore: 85 },
  { id: 'ml2', borrower: 'Maria Santos', amount: 2000, purpose: 'Market stall setup for handmade goods', interestRate: 2.5, termMonths: 6, repaid: 2000, status: 'repaid', startDate: '2025-08-15', communityScore: 92 },
  { id: 'ml3', borrower: 'Ahmed Hassan', amount: 8000, purpose: 'Solar panel installation for community center', interestRate: 3.0, termMonths: 18, repaid: 3200, status: 'active', startDate: '2025-12-01', communityScore: 88 },
  { id: 'ml4', borrower: 'Lisa Park', amount: 1500, purpose: 'Emergency medical expenses', interestRate: 0.0, termMonths: 12, repaid: 0, status: 'pending', startDate: '2026-03-28', communityScore: 78 },
];

const DEMO_POOLS: InvestmentPool[] = [
  { id: 'ip1', name: 'Community Growth Fund', description: 'Diversified pool funding local businesses and infrastructure projects.', totalPool: 250000, yourContribution: 5000, currentReturn: 8.2, members: 124, riskLevel: 'low', minContribution: 100 },
  { id: 'ip2', name: 'Innovation Accelerator', description: 'Funding early-stage community tech projects and startups.', totalPool: 85000, yourContribution: 2000, currentReturn: 14.5, members: 48, riskLevel: 'high', minContribution: 500 },
  { id: 'ip3', name: 'Green Energy Pool', description: 'Investment in renewable energy projects across the community.', totalPool: 180000, yourContribution: 3500, currentReturn: 6.8, members: 92, riskLevel: 'medium', minContribution: 250 },
];

type Tab = 'accounts' | 'loans' | 'invest';

export function CommunityBankScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('accounts');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const accounts = DEMO_ACCOUNTS;
  const loans = DEMO_LOANS;
  const pools = DEMO_POOLS;
  const totalSavings = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);
  const totalInterest = useMemo(() => accounts.reduce((sum, a) => sum + a.interestEarned, 0), [accounts]);

  const handleApplyLoan = useCallback(() => {
    const amount = parseInt(loanAmount, 10);
    if (!amount || amount <= 0) { Alert.alert('Required', 'Enter a valid loan amount.'); return; }
    if (!loanPurpose.trim()) { Alert.alert('Required', 'Enter the loan purpose.'); return; }
    Alert.alert('Loan Application', `Applied for ${amount.toLocaleString()} OTK micro-loan.\nPurpose: ${loanPurpose}\nYour application will be reviewed by the community lending committee.`);
    setLoanAmount('');
    setLoanPurpose('');
    setLoanTerm('');
  }, [loanAmount, loanPurpose]);

  const handleInvest = useCallback((pool: InvestmentPool) => {
    Alert.alert('Invest', `Contribute to "${pool.name}"?\nMinimum: ${pool.minContribution} OTK\nCurrent return: ${pool.currentReturn}%`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Invest', onPress: () => Alert.alert('Success', 'Your contribution has been added to the pool.') },
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
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    bigNumber: { color: t.text.primary, fontSize: fonts.hero, fontWeight: fonts.heavy, textAlign: 'center' },
    label: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    accountCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accountName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    accountType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.accent.blue + '20' },
    accountTypeText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold },
    accountBalance: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginTop: 8 },
    accountMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    accountInterest: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
    progressBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    loanCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    loanBorrower: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    loanStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    loanStatusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    loanPurpose: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    loanStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    loanStat: { alignItems: 'center' },
    loanStatVal: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.heavy },
    loanStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    poolCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    poolName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    poolDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    poolStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    poolStat: { alignItems: 'center' },
    poolStatVal: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    poolStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    poolFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    poolRisk: { fontSize: fonts.sm, fontWeight: fonts.bold },
    poolBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    poolBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'accounts', label: 'Accounts' },
    { key: 'loans', label: 'Loans' },
    { key: 'invest', label: 'Invest' },
  ];

  // ─── Accounts Tab ───

  const renderAccounts = () => (
    <>
      <View style={s.card}>
        <Text style={s.label}>Total Savings</Text>
        <Text style={s.bigNumber}>{totalSavings.toLocaleString()} OTK</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>+{totalInterest.toLocaleString()}</Text>
            <Text style={s.summaryLabel}>Interest Earned</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{accounts.length}</Text>
            <Text style={s.summaryLabel}>Accounts</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>My Accounts</Text>
      {accounts.map((acct) => (
        <View key={acct.id} style={s.accountCard}>
          <View style={s.accountHeader}>
            <Text style={s.accountName}>{acct.name}</Text>
            <View style={s.accountType}>
              <Text style={s.accountTypeText}>{acct.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.accountBalance}>{acct.balance.toLocaleString()} OTK</Text>
          <Text style={s.accountMeta}>APY: {acct.apy}% | Since {acct.createdDate}</Text>
          <Text style={s.accountInterest}>+{acct.interestEarned.toLocaleString()} OTK earned</Text>
          {acct.targetAmount && (
            <>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${(acct.balance / acct.targetAmount) * 100}%` }]} />
              </View>
              <Text style={s.accountMeta}>{((acct.balance / acct.targetAmount) * 100).toFixed(1)}% of {acct.targetAmount.toLocaleString()} goal</Text>
            </>
          )}
        </View>
      ))}
    </>
  );

  // ─── Loans Tab ───

  const renderLoans = () => (
    <>
      <Text style={s.sectionTitle}>Micro-Loans</Text>
      {loans.map((loan) => (
        <View key={loan.id} style={s.loanCard}>
          <View style={s.loanHeader}>
            <Text style={s.loanBorrower}>{loan.borrower}</Text>
            <View style={[s.loanStatus, { backgroundColor: STATUS_COLORS[loan.status] }]}>
              <Text style={s.loanStatusText}>{loan.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.loanPurpose}>{loan.purpose}</Text>
          <View style={s.loanStats}>
            <View style={s.loanStat}>
              <Text style={s.loanStatVal}>{loan.amount.toLocaleString()}</Text>
              <Text style={s.loanStatLabel}>Amount (OTK)</Text>
            </View>
            <View style={s.loanStat}>
              <Text style={s.loanStatVal}>{loan.interestRate}%</Text>
              <Text style={s.loanStatLabel}>Rate</Text>
            </View>
            <View style={s.loanStat}>
              <Text style={[s.loanStatVal, { color: t.accent.green }]}>{loan.repaid.toLocaleString()}</Text>
              <Text style={s.loanStatLabel}>Repaid</Text>
            </View>
            <View style={s.loanStat}>
              <Text style={s.loanStatVal}>{loan.communityScore}</Text>
              <Text style={s.loanStatLabel}>Credit Score</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Apply for Micro-Loan</Text>
        <TextInput style={s.input} placeholder="Amount (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={loanAmount} onChangeText={setLoanAmount} />
        <TextInput style={s.input} placeholder="Purpose" placeholderTextColor={t.text.muted} value={loanPurpose} onChangeText={setLoanPurpose} multiline />
        <TextInput style={s.input} placeholder="Term (months)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={loanTerm} onChangeText={setLoanTerm} />
        <TouchableOpacity style={s.submitBtn} onPress={handleApplyLoan}>
          <Text style={s.submitText}>Apply for Loan</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Invest Tab ───

  const renderInvest = () => (
    <>
      <Text style={s.sectionTitle}>Investment Pools</Text>
      {pools.map((pool) => (
        <View key={pool.id} style={s.poolCard}>
          <Text style={s.poolName}>{pool.name}</Text>
          <Text style={s.poolDesc}>{pool.description}</Text>
          <View style={s.poolStats}>
            <View style={s.poolStat}>
              <Text style={s.poolStatVal}>{(pool.totalPool / 1000).toFixed(0)}K</Text>
              <Text style={s.poolStatLabel}>Pool (OTK)</Text>
            </View>
            <View style={s.poolStat}>
              <Text style={[s.poolStatVal, { color: t.accent.green }]}>{pool.currentReturn}%</Text>
              <Text style={s.poolStatLabel}>Return</Text>
            </View>
            <View style={s.poolStat}>
              <Text style={s.poolStatVal}>{pool.members}</Text>
              <Text style={s.poolStatLabel}>Members</Text>
            </View>
            <View style={s.poolStat}>
              <Text style={s.poolStatVal}>{pool.yourContribution.toLocaleString()}</Text>
              <Text style={s.poolStatLabel}>Your OTK</Text>
            </View>
          </View>
          <View style={s.poolFooter}>
            <Text style={[s.poolRisk, { color: RISK_COLORS[pool.riskLevel] }]}>Risk: {pool.riskLevel.toUpperCase()} | Min: {pool.minContribution} OTK</Text>
            <TouchableOpacity style={s.poolBtn} onPress={() => handleInvest(pool)}>
              <Text style={s.poolBtnText}>Invest</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={s.title}>Community Bank</Text>
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
        {tab === 'accounts' && renderAccounts()}
        {tab === 'loans' && renderLoans()}
        {tab === 'invest' && renderInvest()}
      </ScrollView>
    </SafeAreaView>
  );
}
