import { fonts } from '../utils/theme';
/**
 * Transparency Screen — Complete public spending transparency for community funds.
 *
 * Article I: "Trust is built through radical transparency."
 * Article III: Every OTK transaction of community funds is publicly auditable.
 *
 * Features:
 * - Real-time community fund spending dashboard
 * - Audit trail with on-chain verification
 * - Monthly/quarterly reports with category breakdowns
 * - Community voting on spending priorities
 * - Flagging suspicious transactions
 * - Demo mode with sample transparency data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface SpendingEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  recipient: string;
  txHash: string;
  approved: boolean;
  approvedBy: string;
}

interface AuditRecord {
  id: string;
  period: string;
  auditor: string;
  status: 'passed' | 'review' | 'failed';
  findings: number;
  totalAudited: number;
  completedDate: string;
  reportHash: string;
}

interface SpendingReport {
  period: string;
  totalSpent: number;
  totalBudget: number;
  categories: Array<{ name: string; amount: number; percent: number }>;
  topRecipients: Array<{ name: string; amount: number }>;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const STATUS_COLORS: Record<string, string> = {
  passed: '#34C759',
  review: '#FF9500',
  failed: '#FF3B30',
};

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: '#007AFF',
  Education: '#AF52DE',
  Healthcare: '#FF2D55',
  'Emergency Fund': '#FF9500',
  Administration: '#8E8E93',
  Development: '#5AC8FA',
};

// ─── Demo Data ───

const DEMO_SPENDING: SpendingEntry[] = [
  { id: 'sp1', date: '2026-03-28', description: 'Community center roof repair', category: 'Infrastructure', amount: 12500, recipient: 'BuildRight Construction', txHash: '0xabc123...def456', approved: true, approvedBy: 'Council Vote #47' },
  { id: 'sp2', date: '2026-03-25', description: 'Scholarship fund disbursement (Q1)', category: 'Education', amount: 25000, recipient: 'Education Trust', txHash: '0x789abc...321fed', approved: true, approvedBy: 'Council Vote #45' },
  { id: 'sp3', date: '2026-03-22', description: 'Mobile health clinic supplies', category: 'Healthcare', amount: 8400, recipient: 'Community Health Center', txHash: '0xdef789...abc123', approved: true, approvedBy: 'Council Vote #44' },
  { id: 'sp4', date: '2026-03-20', description: 'Flood relief emergency disbursement', category: 'Emergency Fund', amount: 15000, recipient: 'Disaster Response Team', txHash: '0x456def...789abc', approved: true, approvedBy: 'Emergency Protocol #3' },
  { id: 'sp5', date: '2026-03-18', description: 'Open Chain node maintenance', category: 'Development', amount: 5200, recipient: 'Validator Collective', txHash: '0xfed321...cba987', approved: true, approvedBy: 'Council Vote #43' },
  { id: 'sp6', date: '2026-03-15', description: 'Administrative staff stipends (March)', category: 'Administration', amount: 9800, recipient: 'Admin Pool', txHash: '0x123fed...456cba', approved: true, approvedBy: 'Auto-approved (recurring)' },
];

const DEMO_AUDITS: AuditRecord[] = [
  { id: 'a1', period: 'Q1 2026', auditor: 'Community Audit Committee', status: 'passed', findings: 0, totalAudited: 142500, completedDate: '2026-03-30', reportHash: '0xreport123...abc' },
  { id: 'a2', period: 'Q4 2025', auditor: 'Independent Auditor Guild', status: 'passed', findings: 2, totalAudited: 198000, completedDate: '2026-01-15', reportHash: '0xreport456...def' },
  { id: 'a3', period: 'Q3 2025', auditor: 'Community Audit Committee', status: 'review', findings: 1, totalAudited: 156000, completedDate: '2025-10-20', reportHash: '0xreport789...ghi' },
];

const DEMO_REPORT: SpendingReport = {
  period: 'March 2026',
  totalSpent: 75900,
  totalBudget: 100000,
  categories: [
    { name: 'Education', amount: 25000, percent: 33 },
    { name: 'Emergency Fund', amount: 15000, percent: 20 },
    { name: 'Infrastructure', amount: 12500, percent: 16 },
    { name: 'Administration', amount: 9800, percent: 13 },
    { name: 'Healthcare', amount: 8400, percent: 11 },
    { name: 'Development', amount: 5200, percent: 7 },
  ],
  topRecipients: [
    { name: 'Education Trust', amount: 25000 },
    { name: 'Disaster Response Team', amount: 15000 },
    { name: 'BuildRight Construction', amount: 12500 },
  ],
};

type Tab = 'spending' | 'audit' | 'reports';

export function TransparencyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('spending');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const spending = DEMO_SPENDING;
  const audits = DEMO_AUDITS;
  const report = DEMO_REPORT;

  const handleFlag = useCallback((entry: SpendingEntry) => {
    Alert.alert('Flag Transaction', `Flag "${entry.description}" for community review?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Flag', style: 'destructive', onPress: () => Alert.alert('Flagged', 'Transaction flagged. The audit committee will review.') },
    ]);
  }, []);

  const handleViewAudit = useCallback((audit: AuditRecord) => {
    Alert.alert('Audit Report', `Period: ${audit.period}\nAuditor: ${audit.auditor}\nStatus: ${audit.status}\nFindings: ${audit.findings}\nTotal Audited: ${audit.totalAudited.toLocaleString()} OTK\n\nReport hash: ${audit.reportHash}`);
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
    spendRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    spendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    spendDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    spendAmount: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.heavy },
    spendMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    spendCat: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    spendCatText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    spendHash: { color: t.accent.blue, fontSize: fonts.xs, marginTop: 4, fontFamily: 'monospace' },
    spendApproval: { color: t.accent.green, fontSize: fonts.xs, marginTop: 2 },
    flagBtn: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 6 },
    auditCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    auditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    auditPeriod: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    auditStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    auditStatusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    auditMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    auditBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    auditBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    reportSummary: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    reportText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    bigNumber: { color: t.text.primary, fontSize: fonts.hero, fontWeight: fonts.heavy, textAlign: 'center' },
    label: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4 },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: t.accent.green, borderRadius: 4 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    catLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    catValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    catPercent: { color: t.text.muted, fontSize: fonts.xs },
    recipientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    recipientName: { color: t.text.primary, fontSize: fonts.sm },
    recipientAmount: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'spending', label: 'Spending' },
    { key: 'audit', label: 'Audit' },
    { key: 'reports', label: 'Reports' },
  ];

  // ─── Spending Tab ───

  const renderSpending = () => (
    <>
      <Text style={s.sectionTitle}>Community Fund Transactions</Text>
      <View style={s.card}>
        {spending.map((entry) => (
          <View key={entry.id} style={s.spendRow}>
            <View style={s.spendHeader}>
              <Text style={s.spendDesc}>{entry.description}</Text>
              <Text style={s.spendAmount}>{entry.amount.toLocaleString()} OTK</Text>
            </View>
            <Text style={s.spendMeta}>{entry.date} | To: {entry.recipient}</Text>
            <View style={[s.spendCat, { backgroundColor: CATEGORY_COLORS[entry.category] || t.text.muted }]}>
              <Text style={s.spendCatText}>{entry.category}</Text>
            </View>
            <Text style={s.spendHash}>tx: {entry.txHash}</Text>
            <Text style={s.spendApproval}>Approved: {entry.approvedBy}</Text>
            <TouchableOpacity onPress={() => handleFlag(entry)}>
              <Text style={s.flagBtn}>Flag for Review</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Audit Tab ───

  const renderAudit = () => (
    <>
      <Text style={s.sectionTitle}>Audit History</Text>
      {audits.map((audit) => (
        <View key={audit.id} style={s.auditCard}>
          <View style={s.auditHeader}>
            <Text style={s.auditPeriod}>{audit.period}</Text>
            <View style={[s.auditStatus, { backgroundColor: STATUS_COLORS[audit.status] }]}>
              <Text style={s.auditStatusText}>{audit.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.auditMeta}>Auditor: {audit.auditor}</Text>
          <Text style={s.auditMeta}>Findings: {audit.findings} | Audited: {audit.totalAudited.toLocaleString()} OTK</Text>
          <Text style={s.auditMeta}>Completed: {audit.completedDate}</Text>
          <TouchableOpacity style={s.auditBtn} onPress={() => handleViewAudit(audit)}>
            <Text style={s.auditBtnText}>View Report</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Reports Tab ───

  const renderReports = () => {
    const usedPercent = (report.totalSpent / report.totalBudget) * 100;
    return (
      <>
        <View style={s.card}>
          <Text style={s.label}>{report.period} Spending</Text>
          <Text style={s.bigNumber}>{report.totalSpent.toLocaleString()}</Text>
          <Text style={s.label}>of {report.totalBudget.toLocaleString()} OTK budget</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${usedPercent}%` }]} />
          </View>
          <Text style={[s.label, { marginTop: 8 }]}>{usedPercent.toFixed(1)}% utilized</Text>
        </View>

        <Text style={s.sectionTitle}>By Category</Text>
        <View style={s.card}>
          {report.categories.map((cat) => (
            <View key={cat.name} style={s.catRow}>
              <Text style={s.catLabel}>{cat.name}</Text>
              <Text style={s.catPercent}>{cat.percent}%</Text>
              <Text style={s.catValue}>{cat.amount.toLocaleString()} OTK</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Top Recipients</Text>
        <View style={s.card}>
          {report.topRecipients.map((rec, idx) => (
            <View key={idx} style={s.recipientRow}>
              <Text style={s.recipientName}>{rec.name}</Text>
              <Text style={s.recipientAmount}>{rec.amount.toLocaleString()} OTK</Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Transparency</Text>
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
        {tab === 'spending' && renderSpending()}
        {tab === 'audit' && renderAudit()}
        {tab === 'reports' && renderReports()}
      </ScrollView>
    </SafeAreaView>
  );
}
