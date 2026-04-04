import { fonts } from '../utils/theme';
/**
 * Budget Screen — Article VI of The Human Constitution.
 *
 * Community-level budgeting with transparent public finance.
 * Every OTK spent is visible on-chain. Budget proposals require
 * governance votes (one human = one vote). Full transparency
 * ensures accountability at every level.
 *
 * Features:
 * - Community budget overview (income sources, expense categories, balance)
 * - Budget proposals — propose community spending (requires governance vote)
 * - Spending transparency — every OTK spent is visible on-chain
 * - Budget categories: infrastructure, education, health, safety, environment, social, admin
 * - Revenue sources: treasury allocation, taxes, donations, grants
 * - Historical budgets by quarter
 * - Demo: current quarter budget, 3 expense categories, 2 proposals
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

type Tab = 'overview' | 'proposals' | 'transparency' | 'history';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocated: number;
  spent: number;
}

interface RevenueSource {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface BudgetProposal {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  proposer: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  submittedDate: string;
}

interface TransactionRecord {
  id: string;
  description: string;
  category: string;
  amount: number;
  recipient: string;
  date: string;
  txHash: string;
  proposalId: string;
}

interface QuarterBudget {
  quarter: string;
  year: number;
  totalRevenue: number;
  totalExpense: number;
  surplus: number;
  categories: Array<{ name: string; spent: number }>;
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: 'infrastructure', name: 'Infrastructure', icon: '\u{1F3D7}', color: '#f7931a', allocated: 12000, spent: 8400 },
  { id: 'education', name: 'Education', icon: '\u{1F4DA}', color: '#3b82f6', allocated: 10000, spent: 7200 },
  { id: 'health', name: 'Health', icon: '\u{1FA7A}', color: '#22c55e', allocated: 9000, spent: 6100 },
  { id: 'safety', name: 'Public Safety', icon: '\u{1F6E1}', color: '#ef4444', allocated: 5000, spent: 3800 },
  { id: 'environment', name: 'Environment', icon: '\u{1F33F}', color: '#10b981', allocated: 4000, spent: 2900 },
  { id: 'social', name: 'Social Services', icon: '\u{1F91D}', color: '#8b5cf6', allocated: 6000, spent: 4500 },
  { id: 'admin', name: 'Administration', icon: '\u{1F4CB}', color: '#6b7280', allocated: 4000, spent: 2100 },
];

const REVENUE_SOURCES: RevenueSource[] = [
  { id: 'treasury', name: 'Treasury Allocation', amount: 30000, color: '#22c55e' },
  { id: 'taxes', name: 'Community Taxes', amount: 12000, color: '#3b82f6' },
  { id: 'donations', name: 'Donations', amount: 5000, color: '#f7931a' },
  { id: 'grants', name: 'Grants', amount: 3000, color: '#8b5cf6' },
];

const DEMO_PROPOSALS: BudgetProposal[] = [
  {
    id: 'bp-1',
    title: 'Build community solar microgrid',
    description: 'Install solar panels and battery storage for the community center, reducing energy costs by 60% and providing backup power during outages.',
    category: 'infrastructure',
    amount: 4500,
    proposer: 'openchain1abc...xyz',
    status: 'pending',
    votesFor: 823,
    votesAgainst: 156,
    submittedDate: 'Mar 22',
  },
  {
    id: 'bp-2',
    title: 'Free after-school coding program',
    description: 'Fund a 6-month coding bootcamp for youth ages 12-18, covering instructors, equipment, and supplies. Targets 50 students per cohort.',
    category: 'education',
    amount: 3200,
    proposer: 'openchain1def...uvw',
    status: 'approved',
    votesFor: 1450,
    votesAgainst: 210,
    submittedDate: 'Mar 15',
  },
];

const DEMO_TRANSACTIONS: TransactionRecord[] = [
  { id: 'tx-1', description: 'Teacher salaries — March', category: 'education', amount: 2400, recipient: 'openchain1edu...fund', date: 'Mar 28', txHash: '0xabc123...def', proposalId: 'bp-7' },
  { id: 'tx-2', description: 'Road repair — Oak Street', category: 'infrastructure', amount: 1800, recipient: 'openchain1inf...ops', date: 'Mar 25', txHash: '0xdef456...ghi', proposalId: 'bp-5' },
  { id: 'tx-3', description: 'Community clinic supplies', category: 'health', amount: 950, recipient: 'openchain1hlt...med', date: 'Mar 22', txHash: '0xghi789...jkl', proposalId: 'bp-3' },
  { id: 'tx-4', description: 'Park cleanup equipment', category: 'environment', amount: 600, recipient: 'openchain1env...grn', date: 'Mar 20', txHash: '0xjkl012...mno', proposalId: 'bp-2' },
  { id: 'tx-5', description: 'Emergency shelter maintenance', category: 'social', amount: 1200, recipient: 'openchain1soc...srv', date: 'Mar 18', txHash: '0xmno345...pqr', proposalId: 'bp-1' },
];

const DEMO_HISTORY: QuarterBudget[] = [
  { quarter: 'Q1', year: 2026, totalRevenue: 50000, totalExpense: 35000, surplus: 15000, categories: [{ name: 'Infrastructure', spent: 8400 }, { name: 'Education', spent: 7200 }, { name: 'Health', spent: 6100 }, { name: 'Social', spent: 4500 }, { name: 'Other', spent: 8800 }] },
  { quarter: 'Q4', year: 2025, totalRevenue: 48000, totalExpense: 42000, surplus: 6000, categories: [{ name: 'Infrastructure', spent: 11000 }, { name: 'Education', spent: 9500 }, { name: 'Health', spent: 8000 }, { name: 'Social', spent: 6000 }, { name: 'Other', spent: 7500 }] },
  { quarter: 'Q3', year: 2025, totalRevenue: 45000, totalExpense: 38000, surplus: 7000, categories: [{ name: 'Infrastructure', spent: 9000 }, { name: 'Education', spent: 8500 }, { name: 'Health', spent: 7500 }, { name: 'Social', spent: 5500 }, { name: 'Other', spent: 7500 }] },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  executed: '#8b5cf6',
};

const CATEGORY_ICON: Record<string, string> = {
  infrastructure: '\u{1F3D7}',
  education: '\u{1F4DA}',
  health: '\u{1FA7A}',
  safety: '\u{1F6E1}',
  environment: '\u{1F33F}',
  social: '\u{1F91D}',
  admin: '\u{1F4CB}',
};

export function BudgetScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [proposals, setProposals] = useState<BudgetProposal[]>(DEMO_PROPOSALS);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('infrastructure');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const totalRevenue = REVENUE_SOURCES.reduce((sum, r) => sum + r.amount, 0);
  const totalAllocated = BUDGET_CATEGORIES.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = BUDGET_CATEGORIES.reduce((sum, c) => sum + c.spent, 0);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
    heroLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    heroValue: { color: t.accent.green, fontSize: fonts.hero, fontWeight: fonts.heavy, marginTop: 4 },
    heroSub: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, textAlign: 'center', lineHeight: 18 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, padding: 14, alignItems: 'center' },
    statLabel: { color: t.text.muted, fontSize: fonts.xs },
    statValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginTop: 4 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    catLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    catIcon: { fontSize: fonts.xl, marginRight: 10 },
    catName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    catAmount: { color: t.text.secondary, fontSize: fonts.sm, textAlign: 'right' },
    bar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 4, marginBottom: 10 },
    barFill: { height: 6, borderRadius: 3 },
    revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    revDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    revName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    revAmount: { color: t.text.secondary, fontSize: fonts.md },
    propCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    propTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    propMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    propCategory: { color: t.text.muted, fontSize: fonts.sm },
    propStatus: { fontSize: fonts.sm, fontWeight: fonts.bold },
    propAmount: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.heavy, marginTop: 8 },
    propDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 8 },
    propVotes: { flexDirection: 'row', gap: 16, marginTop: 10 },
    voteCount: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    createBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'center', marginBottom: 16 },
    createBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
    cancelBtnText: { color: t.accent.blue, fontSize: fonts.md },
    txCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    txDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    txMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    txCategory: { color: t.text.muted, fontSize: fonts.sm },
    txDate: { color: t.text.muted, fontSize: fonts.sm },
    txAmount: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 6 },
    txHash: { color: t.accent.blue, fontSize: fonts.xs, marginTop: 4 },
    txRecipient: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    quarterCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    quarterTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    quarterStats: { flexDirection: 'row', gap: 12, marginTop: 12 },
    qStat: { flex: 1, alignItems: 'center' },
    qStatLabel: { color: t.text.muted, fontSize: fonts.xs },
    qStatValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 2 },
    qCatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 4 },
    qCatName: { color: t.text.secondary, fontSize: fonts.sm },
    qCatSpent: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.bg.primary },
    catChipActive: { backgroundColor: t.accent.blue },
    catChipText: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: t.text.muted },
    catChipTextActive: { color: '#fff' },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 20, fontSize: fonts.md },
  }), [t]);

  const handleCreateProposal = useCallback(async () => {
    if (!newTitle.trim() || !newDescription.trim() || !newAmount.trim()) {
      Alert.alert('Required', 'Enter title, description, and amount.');
      return;
    }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid positive amount.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const newProp: BudgetProposal = {
        id: `bp-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        amount,
        proposer: 'openchain1you...demo',
        status: 'pending',
        votesFor: 0,
        votesAgainst: 0,
        submittedDate: 'Mar 29',
      };
      setProposals([newProp, ...proposals]);
      Alert.alert('Proposal Submitted', 'Your budget proposal is now open for community vote.');
      setNewTitle('');
      setNewDescription('');
      setNewAmount('');
      setShowCreateForm(false);
    }
    setLoading(false);
  }, [newTitle, newDescription, newAmount, newCategory, demoMode, proposals]);

  // ─── Tab Bar ───
  const renderTabs = () => (
    <View style={s.tabRow}>
      {(['overview', 'proposals', 'transparency', 'history'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[s.tab, activeTab === tab && s.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
            {tab === 'overview' ? 'Overview' : tab === 'proposals' ? 'Proposals' : tab === 'transparency' ? 'Spending' : 'History'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Overview Tab ───
  const renderOverview = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>Q1 2026 Budget Balance</Text>
        <Text style={s.heroValue}>{(totalRevenue - totalSpent).toLocaleString()} OTK</Text>
        <Text style={s.heroSub}>
          Every OTK collected and spent is visible on-chain. Budget proposals require one-human-one-vote approval.
        </Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Revenue</Text>
          <Text style={[s.statValue, { color: t.accent.green }]}>{totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Allocated</Text>
          <Text style={s.statValue}>{totalAllocated.toLocaleString()}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Spent</Text>
          <Text style={[s.statValue, { color: t.accent.red }]}>{totalSpent.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={s.section}>Revenue Sources</Text>
      <View style={s.card}>
        {REVENUE_SOURCES.map((rev) => (
          <View key={rev.id} style={s.revenueRow}>
            <View style={[s.revDot, { backgroundColor: rev.color }]} />
            <Text style={s.revName}>{rev.name}</Text>
            <Text style={s.revAmount}>{rev.amount.toLocaleString()} OTK</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Expense Categories</Text>
      <View style={s.card}>
        {BUDGET_CATEGORIES.map((cat) => {
          const pct = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
          return (
            <View key={cat.id}>
              <View style={s.catRow}>
                <View style={s.catLeft}>
                  <Text style={s.catIcon}>{cat.icon}</Text>
                  <Text style={s.catName}>{cat.name}</Text>
                </View>
                <Text style={s.catAmount}>{cat.spent.toLocaleString()} / {cat.allocated.toLocaleString()}</Text>
              </View>
              <View style={s.bar}>
                <View style={[s.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── Proposals Tab ───
  const renderProposals = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      {!showCreateForm && (
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreateForm(true)}>
          <Text style={s.createBtnText}>+ New Budget Proposal</Text>
        </TouchableOpacity>
      )}

      {showCreateForm && (
        <View style={s.card}>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Title</Text>
            <TextInput style={s.input} placeholder="Proposal title..." placeholderTextColor={t.text.muted} value={newTitle} onChangeText={setNewTitle} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Description</Text>
            <TextInput style={[s.input, s.descInput]} placeholder="Describe the spending purpose..." placeholderTextColor={t.text.muted} value={newDescription} onChangeText={setNewDescription} multiline numberOfLines={4} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Amount (OTK)</Text>
            <TextInput style={s.input} placeholder="0" placeholderTextColor={t.text.muted} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Category</Text>
            <View style={s.catPicker}>
              {BUDGET_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, newCategory === cat.id && s.catChipActive]}
                  onPress={() => setNewCategory(cat.id)}
                >
                  <Text style={[s.catChipText, newCategory === cat.id && s.catChipTextActive]}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleCreateProposal} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Proposal</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreateForm(false)}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.section}>Budget Proposals</Text>
      {proposals.length === 0 ? (
        <Text style={s.emptyText}>No budget proposals yet. Be the first to propose!</Text>
      ) : (
        proposals.map((prop) => {
          const totalVotes = prop.votesFor + prop.votesAgainst;
          const forPct = totalVotes > 0 ? Math.round((prop.votesFor / totalVotes) * 100) : 0;
          return (
            <View key={prop.id} style={s.propCard}>
              <Text style={s.propTitle}>{prop.title}</Text>
              <View style={s.propMeta}>
                <Text style={s.propCategory}>{CATEGORY_ICON[prop.category] ?? ''} {prop.category}</Text>
                <Text style={[s.propStatus, { color: STATUS_COLORS[prop.status] ?? t.text.muted }]}>
                  {prop.status.toUpperCase()}
                </Text>
              </View>
              <Text style={s.propAmount}>{prop.amount.toLocaleString()} OTK</Text>
              <Text style={s.propDesc}>{prop.description}</Text>
              <View style={s.propVotes}>
                <Text style={[s.voteCount, { color: t.accent.green }]}>For: {prop.votesFor}</Text>
                <Text style={[s.voteCount, { color: t.accent.red }]}>Against: {prop.votesAgainst}</Text>
              </View>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${forPct}%`, backgroundColor: t.accent.green }]} />
              </View>
              <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 4 }}>
                Submitted {prop.submittedDate} by {prop.proposer}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  // ─── Transparency Tab ───
  const renderTransparency = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <View style={[s.heroCard, { backgroundColor: t.accent.blue + '10' }]}>
        <Text style={s.heroLabel}>Total On-Chain Spending</Text>
        <Text style={[s.heroValue, { color: t.accent.blue }]}>{totalSpent.toLocaleString()} OTK</Text>
        <Text style={s.heroSub}>
          Every community expenditure is recorded on-chain with full traceability. Click any transaction to verify.
        </Text>
      </View>

      <Text style={s.section}>Recent Expenditures</Text>
      {DEMO_TRANSACTIONS.map((tx) => (
        <View key={tx.id} style={s.txCard}>
          <Text style={s.txDesc}>{tx.description}</Text>
          <View style={s.txMeta}>
            <Text style={s.txCategory}>{CATEGORY_ICON[tx.category] ?? ''} {tx.category}</Text>
            <Text style={s.txDate}>{tx.date}</Text>
          </View>
          <Text style={s.txAmount}>-{tx.amount.toLocaleString()} OTK</Text>
          <Text style={s.txRecipient}>To: {tx.recipient}</Text>
          <Text style={s.txHash}>Tx: {tx.txHash}</Text>
        </View>
      ))}
    </ScrollView>
  );

  // ─── History Tab ───
  const renderHistory = () => (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.section}>Historical Budgets</Text>
      {DEMO_HISTORY.map((q) => (
        <View key={`${q.quarter}-${q.year}`} style={s.quarterCard}>
          <Text style={s.quarterTitle}>{q.quarter} {q.year}</Text>
          <View style={s.quarterStats}>
            <View style={s.qStat}>
              <Text style={s.qStatLabel}>Revenue</Text>
              <Text style={[s.qStatValue, { color: t.accent.green }]}>{q.totalRevenue.toLocaleString()}</Text>
            </View>
            <View style={s.qStat}>
              <Text style={s.qStatLabel}>Expense</Text>
              <Text style={[s.qStatValue, { color: t.accent.red }]}>{q.totalExpense.toLocaleString()}</Text>
            </View>
            <View style={s.qStat}>
              <Text style={s.qStatLabel}>Surplus</Text>
              <Text style={[s.qStatValue, { color: q.surplus >= 0 ? t.accent.green : t.accent.red }]}>
                {q.surplus >= 0 ? '+' : ''}{q.surplus.toLocaleString()}
              </Text>
            </View>
          </View>
          {q.categories.map((cat, i) => (
            <View key={i} style={s.qCatRow}>
              <Text style={s.qCatName}>{cat.name}</Text>
              <Text style={s.qCatSpent}>{cat.spent.toLocaleString()} OTK</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Budget</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      {renderTabs()}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'proposals' && renderProposals()}
      {activeTab === 'transparency' && renderTransparency()}
      {activeTab === 'history' && renderHistory()}
    </SafeAreaView>
  );
}
