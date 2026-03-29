/**
 * Family Finance — Article II of The Human Constitution.
 *
 * "The family is the first economy. When families manage resources together
 *  with transparency and love, children learn that wealth is stewardship."
 *
 * Shared family financial management: budgets, allowances, savings goals,
 * and financial education for children.
 *
 * Features:
 * - Family budget dashboard with shared expenses and contributions
 * - Allowance management for children (weekly/monthly recurring)
 * - Family savings goals (education, vacation, emergency, home)
 * - Expense categories with spending breakdown
 * - Family members with contribution tracking
 * - Shared transactions log visible to guardians
 * - Age-appropriate financial education tips for children
 * - Demo mode: family of 4, 3 goals, 5 categories, 2 children
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

type FinanceTab = 'budget' | 'allowances' | 'goals' | 'education';

interface FamilyMember {
  id: string;
  name: string;
  role: 'guardian' | 'child';
  age: number;
  avatar: string;
  monthlyContribution: number;
  totalContributed: number;
}

interface Allowance {
  childId: string;
  childName: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  nextPayment: string;
  totalPaid: number;
  savingsPercent: number;
  status: 'active' | 'paused';
}

interface SavingsGoal {
  id: string;
  label: string;
  icon: string;
  target: number;
  current: number;
  monthlyContribution: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface ExpenseCategory {
  key: string;
  label: string;
  icon: string;
  budgeted: number;
  spent: number;
}

interface FamilyTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  type: 'expense' | 'income' | 'allowance' | 'savings';
}

interface EducationTip {
  id: string;
  ageRange: string;
  title: string;
  content: string;
  category: 'saving' | 'spending' | 'earning' | 'sharing';
}

const DEMO_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'Parent A', role: 'guardian', age: 42, avatar: '\u{1F9D1}', monthlyContribution: 4200, totalContributed: 50400 },
  { id: 'm2', name: 'Parent B', role: 'guardian', age: 39, avatar: '\u{1F9D1}', monthlyContribution: 3800, totalContributed: 45600 },
  { id: 'c1', name: 'Alex (15)', role: 'child', age: 15, avatar: '\u{1F9D2}', monthlyContribution: 0, totalContributed: 0 },
  { id: 'c2', name: 'Maya (10)', role: 'child', age: 10, avatar: '\u{1F467}', monthlyContribution: 0, totalContributed: 0 },
];

const DEMO_ALLOWANCES: Allowance[] = [
  { childId: 'c1', childName: 'Alex (15)', amount: 60, frequency: 'weekly', nextPayment: 'Apr 1, 2026', totalPaid: 2880, savingsPercent: 30, status: 'active' },
  { childId: 'c2', childName: 'Maya (10)', amount: 120, frequency: 'monthly', nextPayment: 'Apr 1, 2026', totalPaid: 1320, savingsPercent: 20, status: 'active' },
];

const DEMO_GOALS: SavingsGoal[] = [
  { id: 'g1', label: 'Education Fund', icon: '\u{1F393}', target: 50000, current: 28500, monthlyContribution: 800, targetDate: 'Sep 2030', priority: 'high' },
  { id: 'g2', label: 'Family Vacation', icon: '\u{2708}\u{FE0F}', target: 6000, current: 3200, monthlyContribution: 400, targetDate: 'Jul 2026', priority: 'medium' },
  { id: 'g3', label: 'Emergency Fund', icon: '\u{1F6E1}\u{FE0F}', target: 15000, current: 11200, monthlyContribution: 500, targetDate: 'Dec 2026', priority: 'high' },
];

const DEMO_CATEGORIES: ExpenseCategory[] = [
  { key: 'food', label: 'Food & Groceries', icon: '\u{1F34E}', budgeted: 1200, spent: 1045 },
  { key: 'education', label: 'Education', icon: '\u{1F4DA}', budgeted: 800, spent: 720 },
  { key: 'health', label: 'Health & Medical', icon: '\u{1FA7A}', budgeted: 600, spent: 380 },
  { key: 'transport', label: 'Transport', icon: '\u{1F697}', budgeted: 500, spent: 465 },
  { key: 'housing', label: 'Housing & Utilities', icon: '\u{1F3E0}', budgeted: 2800, spent: 2800 },
];

const DEMO_TRANSACTIONS: FamilyTransaction[] = [
  { id: 't1', date: 'Mar 28', description: 'Weekly groceries', amount: 156, category: 'food', paidBy: 'Parent A', type: 'expense' },
  { id: 't2', date: 'Mar 27', description: 'Alex weekly allowance', amount: 60, category: 'allowance', paidBy: 'Family', type: 'allowance' },
  { id: 't3', date: 'Mar 27', description: 'School supplies', amount: 45, category: 'education', paidBy: 'Parent B', type: 'expense' },
  { id: 't4', date: 'Mar 26', description: 'Electricity bill', amount: 180, category: 'housing', paidBy: 'Parent A', type: 'expense' },
  { id: 't5', date: 'Mar 26', description: 'Pediatric checkup', amount: 120, category: 'health', paidBy: 'Parent B', type: 'expense' },
  { id: 't6', date: 'Mar 25', description: 'Education fund deposit', amount: 800, category: 'savings', paidBy: 'Family', type: 'savings' },
  { id: 't7', date: 'Mar 25', description: 'Bus passes', amount: 90, category: 'transport', paidBy: 'Parent A', type: 'expense' },
  { id: 't8', date: 'Mar 24', description: 'After-school tutoring', amount: 200, category: 'education', paidBy: 'Parent B', type: 'expense' },
  { id: 't9', date: 'Mar 23', description: 'Emergency fund deposit', amount: 500, category: 'savings', paidBy: 'Family', type: 'savings' },
  { id: 't10', date: 'Mar 22', description: 'Family dinner out', amount: 85, category: 'food', paidBy: 'Parent A', type: 'expense' },
];

const DEMO_TIPS: EducationTip[] = [
  { id: 'e1', ageRange: '5-8', title: 'The Three Jars', content: 'Help your child set up three jars labeled Save, Spend, and Share. Every time they receive money, divide it equally. This teaches the foundation of budgeting.', category: 'saving' },
  { id: 'e2', ageRange: '8-12', title: 'Needs vs. Wants', content: 'Before any purchase, ask: "Is this a need or a want?" Needs keep us healthy and safe. Wants make life fun but can wait. Both matter, but needs come first.', category: 'spending' },
  { id: 'e3', ageRange: '10-14', title: 'Earning Through Contribution', content: 'Encourage children to earn extra by contributing to the household or community. Mowing lawns, tutoring younger kids, or helping neighbors builds work ethic and financial independence.', category: 'earning' },
  { id: 'e4', ageRange: '12-16', title: 'The Power of Compound Growth', content: 'Show your teen how saving $10/week grows over time. After 1 year: $520. After 5 years with modest growth: over $3,000. Starting early is the biggest advantage.', category: 'saving' },
  { id: 'e5', ageRange: '8-14', title: 'Giving Makes Us Richer', content: 'Set aside a portion of allowance for causes your child cares about. Generosity builds empathy and teaches that money is a tool for good, not just for self.', category: 'sharing' },
  { id: 'e6', ageRange: '13-17', title: 'Budget Your Own Month', content: 'Give your teenager a monthly budget challenge. Provide a fixed amount for discretionary spending and let them plan. Running out early teaches more than any lecture.', category: 'spending' },
  { id: 'e7', ageRange: '6-10', title: 'The Lemonade Stand Principle', content: 'Even a simple venture teaches cost, revenue, and profit. Buy lemons for $2, sell lemonade for $5, and learn that effort creates value.', category: 'earning' },
];

const TAB_LABELS: Record<FinanceTab, string> = {
  budget: 'Budget',
  allowances: 'Allowances',
  goals: 'Goals',
  education: 'Education',
};

function progressColor(pct: number): string {
  if (pct >= 95) return '#ef4444';
  if (pct >= 80) return '#eab308';
  if (pct >= 50) return '#22c55e';
  return '#16a34a';
}

function priorityColor(p: string): string {
  if (p === 'high') return '#ef4444';
  if (p === 'medium') return '#eab308';
  return '#22c55e';
}

const tipCategoryColors: Record<string, string> = {
  saving: '#16a34a',
  spending: '#3b82f6',
  earning: '#eab308',
  sharing: '#a855f7',
};

export function FamilyFinanceScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<FinanceTab>('budget');

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
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    memberAvatar: { fontSize: 28 },
    memberName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    memberRole: { color: t.text.muted, fontSize: 11, textTransform: 'capitalize' },
    memberAmount: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginLeft: 'auto' },
    txRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    txDesc: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    txMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    txAmount: { fontSize: 14, fontWeight: '700' },
    goalCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    goalIcon: { fontSize: 28 },
    goalLabel: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    goalPriority: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', color: '#fff' },
    goalNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    goalStat: { alignItems: 'center' },
    goalStatNum: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    goalStatLabel: { color: t.text.muted, fontSize: 10 },
    allowanceCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    allowanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    allowanceName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    allowanceAmount: { color: t.accent.green, fontSize: 18, fontWeight: '800' },
    allowanceFreq: { color: t.text.muted, fontSize: 11 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
    statusText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    tipCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    tipTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 },
    tipAge: { color: t.text.muted, fontSize: 10, fontWeight: '600' },
    tipCategory: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', color: '#fff' },
    tipContent: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    highlightCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  }), [t]);

  const members = demoMode ? DEMO_MEMBERS : [];
  const allowances = demoMode ? DEMO_ALLOWANCES : [];
  const goals = demoMode ? DEMO_GOALS : [];
  const categories = demoMode ? DEMO_CATEGORIES : [];
  const transactions = demoMode ? DEMO_TRANSACTIONS : [];
  const tips = demoMode ? DEMO_TIPS : [];

  const totalBudget = useMemo(() => categories.reduce((s, c) => s + c.budgeted, 0), [categories]);
  const totalSpent = useMemo(() => categories.reduce((s, c) => s + c.spent, 0), [categories]);
  const totalIncome = useMemo(() => members.reduce((s, m) => s + m.monthlyContribution, 0), [members]);
  const totalSavingsGoal = useMemo(() => goals.reduce((s, g) => s + g.target, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current, 0), [goals]);

  const renderBudgetTab = () => (
    <>
      <Text style={st.subtitle}>
        Shared family finances — transparent, collaborative, and secure.
        Every family member sees where money goes.
      </Text>

      {/* Summary Cards */}
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>${totalIncome.toLocaleString()}</Text>
          <Text style={st.summaryLabel}>Monthly Income</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>${totalBudget.toLocaleString()}</Text>
          <Text style={st.summaryLabel}>Budgeted</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: totalSpent > totalBudget ? t.accent.red : t.accent.green }]}>${totalSpent.toLocaleString()}</Text>
          <Text style={st.summaryLabel}>Spent</Text>
        </View>
      </View>

      {/* Expense Categories */}
      <Text style={st.section}>Expense Categories</Text>
      {categories.map((cat) => {
        const pct = Math.round((cat.spent / cat.budgeted) * 100);
        return (
          <View key={cat.key} style={st.card}>
            <View style={st.row}>
              <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>
                {cat.icon}  {cat.label}
              </Text>
              <Text style={[st.val, { color: progressColor(pct) }]}>{pct}%</Text>
            </View>
            <View style={st.barContainer}>
              <View style={[st.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: progressColor(pct) }]} />
            </View>
            <View style={st.row}>
              <Text style={st.label}>${cat.spent.toLocaleString()} spent</Text>
              <Text style={st.label}>${cat.budgeted.toLocaleString()} budgeted</Text>
            </View>
          </View>
        );
      })}

      {/* Family Members */}
      <Text style={st.section}>Family Members</Text>
      <View style={st.card}>
        {members.map((m, i) => (
          <View key={m.id} style={[st.memberRow, i === members.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={st.memberAvatar}>{m.avatar}</Text>
            <View>
              <Text style={st.memberName}>{m.name}</Text>
              <Text style={st.memberRole}>{m.role} — age {m.age}</Text>
            </View>
            {m.monthlyContribution > 0 && (
              <Text style={st.memberAmount}>+${m.monthlyContribution.toLocaleString()}/mo</Text>
            )}
          </View>
        ))}
      </View>

      {/* Recent Transactions */}
      <Text style={st.section}>Shared Transactions</Text>
      <View style={st.card}>
        {transactions.map((tx, i) => (
          <View key={tx.id} style={[st.txRow, i === transactions.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={st.row}>
              <Text style={st.txDesc}>{tx.description}</Text>
              <Text style={[st.txAmount, {
                color: tx.type === 'expense' || tx.type === 'allowance' ? t.accent.red : t.accent.green,
              }]}>
                {tx.type === 'expense' || tx.type === 'allowance' ? '-' : '+'}${tx.amount}
              </Text>
            </View>
            <Text style={st.txMeta}>{tx.date} — {tx.paidBy} — {tx.category}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderAllowancesTab = () => (
    <>
      <Text style={st.subtitle}>
        Teach financial responsibility through regular allowances.
        Children learn budgeting, saving, and delayed gratification.
      </Text>

      {/* Allowance Summary */}
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{allowances.length}</Text>
          <Text style={st.summaryLabel}>Active Allowances</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>
            ${allowances.reduce((s, a) => s + a.totalPaid, 0).toLocaleString()}
          </Text>
          <Text style={st.summaryLabel}>Total Paid</Text>
        </View>
      </View>

      {allowances.map((a) => (
        <View key={a.childId} style={st.allowanceCard}>
          <View style={st.allowanceHeader}>
            <View>
              <Text style={st.allowanceName}>{a.childName}</Text>
              <Text style={st.allowanceFreq}>{a.frequency} allowance</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={st.allowanceAmount}>${a.amount}</Text>
              <Text style={st.allowanceFreq}>per {a.frequency === 'weekly' ? 'week' : 'month'}</Text>
            </View>
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <Text style={st.label}>Next payment</Text>
            <Text style={st.val}>{a.nextPayment}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Total paid to date</Text>
            <Text style={st.val}>${a.totalPaid.toLocaleString()}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Savings requirement</Text>
            <Text style={[st.val, { color: t.accent.green }]}>{a.savingsPercent}% must save</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Status</Text>
            <View style={[st.statusBadge, { backgroundColor: a.status === 'active' ? t.accent.green : t.accent.yellow }]}>
              <Text style={st.statusText}>{a.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* Breakdown */}
          <View style={st.divider} />
          <Text style={[st.label, { marginBottom: 6 }]}>Monthly breakdown (estimated)</Text>
          {(() => {
            const monthly = a.frequency === 'weekly' ? a.amount * 4 : a.amount;
            const savingsAmt = Math.round(monthly * a.savingsPercent / 100);
            const spendAmt = monthly - savingsAmt;
            return (
              <>
                <View style={st.row}>
                  <Text style={st.label}>Total per month</Text>
                  <Text style={st.val}>${monthly}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Savings portion</Text>
                  <Text style={[st.val, { color: t.accent.green }]}>${savingsAmt}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Spending portion</Text>
                  <Text style={[st.val, { color: t.accent.blue }]}>${spendAmt}</Text>
                </View>
              </>
            );
          })()}
        </View>
      ))}
    </>
  );

  const renderGoalsTab = () => (
    <>
      <Text style={st.subtitle}>
        Family savings goals build security and shared purpose.
        Every contribution, no matter how small, moves the family forward.
      </Text>

      {/* Goals Summary */}
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>${totalSaved.toLocaleString()}</Text>
          <Text style={st.summaryLabel}>Total Saved</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>${totalSavingsGoal.toLocaleString()}</Text>
          <Text style={st.summaryLabel}>Total Goal</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.text.primary }]}>{Math.round((totalSaved / totalSavingsGoal) * 100)}%</Text>
          <Text style={st.summaryLabel}>Overall</Text>
        </View>
      </View>

      {goals.map((g) => {
        const pct = Math.round((g.current / g.target) * 100);
        const remaining = g.target - g.current;
        const monthsLeft = g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : 0;
        return (
          <View key={g.id} style={st.goalCard}>
            <View style={st.goalHeader}>
              <Text style={st.goalIcon}>{g.icon}</Text>
              <Text style={st.goalLabel}>{g.label}</Text>
              <Text style={[st.goalPriority, { backgroundColor: priorityColor(g.priority) }]}>
                {g.priority.toUpperCase()}
              </Text>
            </View>

            <View style={st.barContainer}>
              <View style={[st.barFill, { width: `${pct}%`, backgroundColor: t.accent.green }]} />
            </View>
            <View style={st.row}>
              <Text style={st.label}>${g.current.toLocaleString()} saved</Text>
              <Text style={st.val}>{pct}% of ${g.target.toLocaleString()}</Text>
            </View>

            <View style={st.divider} />

            <View style={st.goalNumbers}>
              <View style={st.goalStat}>
                <Text style={st.goalStatNum}>${g.monthlyContribution}</Text>
                <Text style={st.goalStatLabel}>Monthly</Text>
              </View>
              <View style={st.goalStat}>
                <Text style={st.goalStatNum}>${remaining.toLocaleString()}</Text>
                <Text style={st.goalStatLabel}>Remaining</Text>
              </View>
              <View style={st.goalStat}>
                <Text style={st.goalStatNum}>{monthsLeft} mo</Text>
                <Text style={st.goalStatLabel}>Est. Time</Text>
              </View>
              <View style={st.goalStat}>
                <Text style={st.goalStatNum}>{g.targetDate}</Text>
                <Text style={st.goalStatLabel}>Target</Text>
              </View>
            </View>
          </View>
        );
      })}
    </>
  );

  const renderEducationTab = () => (
    <>
      <Text style={st.subtitle}>
        Financial literacy starts at home. Age-appropriate tips to help
        your children build healthy money habits for life.
      </Text>

      {/* Category Legend */}
      <View style={[st.summaryRow, { marginBottom: 12 }]}>
        {(['saving', 'spending', 'earning', 'sharing'] as const).map((cat) => (
          <View key={cat} style={[st.summaryCard, { paddingVertical: 8 }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tipCategoryColors[cat], marginBottom: 4 }} />
            <Text style={[st.summaryLabel, { textTransform: 'capitalize' }]}>{cat}</Text>
          </View>
        ))}
      </View>

      {tips.map((tip) => (
        <View key={tip.id} style={st.tipCard}>
          <View style={st.tipHeader}>
            <Text style={st.tipTitle}>{tip.title}</Text>
            <Text style={[st.tipCategory, { backgroundColor: tipCategoryColors[tip.category] }]}>
              {tip.category.toUpperCase()}
            </Text>
          </View>
          <Text style={st.tipAge}>Ages {tip.ageRange}</Text>
          <Text style={st.tipContent}>{tip.content}</Text>
        </View>
      ))}

      {/* Key Principles */}
      <Text style={st.section}>Key Principles</Text>
      <View style={[st.highlightCard, { backgroundColor: t.accent.green + '10', borderColor: t.accent.green + '30' }]}>
        <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          Start Early, Start Simple
        </Text>
        <Text style={{ color: t.text.secondary, fontSize: 12, lineHeight: 18 }}>
          Children as young as 5 can understand basic financial concepts.
          The key is making it concrete — real coins, real jars, real choices.
          Abstract concepts like interest and inflation can wait until they
          have a foundation of saving and spending wisely.
        </Text>
      </View>
      <View style={[st.highlightCard, { backgroundColor: t.accent.blue + '10', borderColor: t.accent.blue + '30' }]}>
        <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          Model Transparency
        </Text>
        <Text style={{ color: t.text.secondary, fontSize: 12, lineHeight: 18 }}>
          When children see the family budget openly discussed, they learn that
          money management is normal and important — not secret or stressful.
          Open Chain makes family finances visible, collaborative, and educational.
        </Text>
      </View>
      <View style={[st.highlightCard, { backgroundColor: t.accent.yellow + '10', borderColor: t.accent.yellow + '30' }]}>
        <Text style={{ color: t.accent.yellow, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          Let Them Fail Small
        </Text>
        <Text style={{ color: t.text.secondary, fontSize: 12, lineHeight: 18 }}>
          A child who spends their entire allowance on day one and has nothing
          left for the week learns more than any lecture could teach. Small
          failures now prevent big financial mistakes later.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Family Finance</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Tab Bar */}
        <View style={st.tabRow}>
          {(Object.keys(TAB_LABELS) as FinanceTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!demoMode && (
          <Text style={st.empty}>
            Enable demo mode to explore Family Finance features.
          </Text>
        )}

        {demoMode && activeTab === 'budget' && renderBudgetTab()}
        {demoMode && activeTab === 'allowances' && renderAllowancesTab()}
        {demoMode && activeTab === 'goals' && renderGoalsTab()}
        {demoMode && activeTab === 'education' && renderEducationTab()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
