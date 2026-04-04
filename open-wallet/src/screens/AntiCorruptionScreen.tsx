import { fonts } from '../utils/theme';
/**
 * Anti-Corruption Screen — Transparency reporting, public spending watchdog.
 *
 * Article VI of The Human Constitution: Government transparency and accountability.
 *
 * Features:
 * - Submit and browse transparency reports
 * - Public spending watchdog dashboard
 * - Transparency scores for institutions
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Report {
  id: string;
  title: string;
  category: string;
  institution: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'investigating' | 'resolved' | 'dismissed';
  date: string;
  upvotes: number;
  description: string;
}

interface SpendingItem {
  id: string;
  institution: string;
  category: string;
  amount: number;
  description: string;
  year: string;
  flagged: boolean;
  flagReason?: string;
}

interface TransparencyScore {
  id: string;
  institution: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  reports: number;
  resolved: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_REPORTS: Report[] = [
  { id: 'r1', title: 'Unexplained road contract cost overrun', category: 'Infrastructure', institution: 'City Public Works', severity: 'high', status: 'investigating', date: '2026-03-25', upvotes: 142, description: '$2.3M over budget with no public explanation.' },
  { id: 'r2', title: 'Missing meeting minutes — School Board', category: 'Education', institution: 'School Board', severity: 'medium', status: 'submitted', date: '2026-03-27', upvotes: 67, description: '3 months of meeting minutes not published.' },
  { id: 'r3', title: 'Park renovation funds disbursement delay', category: 'Parks', institution: 'Parks Department', severity: 'low', status: 'resolved', date: '2026-03-15', upvotes: 34, description: 'Approved funds delayed 6 months. Now released.' },
  { id: 'r4', title: 'No-bid contract for IT services', category: 'Technology', institution: 'City IT Department', severity: 'critical', status: 'investigating', date: '2026-03-20', upvotes: 289, description: '$500K IT contract awarded without competitive bidding.' },
  { id: 'r5', title: 'Water quality data not published', category: 'Environment', institution: 'Water Authority', severity: 'high', status: 'submitted', date: '2026-03-28', upvotes: 198, description: 'Quarterly water quality reports overdue by 2 quarters.' },
];

const DEMO_SPENDING: SpendingItem[] = [
  { id: 's1', institution: 'City Public Works', category: 'Road Maintenance', amount: 12500000, description: 'Annual road repair and resurfacing', year: '2026', flagged: true, flagReason: '35% over previous year with fewer projects' },
  { id: 's2', institution: 'School Board', category: 'Teacher Salaries', amount: 45000000, description: 'K-12 teacher compensation', year: '2026', flagged: false },
  { id: 's3', institution: 'Parks Department', category: 'Park Maintenance', amount: 3200000, description: 'Grounds keeping and facility upkeep', year: '2026', flagged: false },
  { id: 's4', institution: 'City IT Department', category: 'Software Licenses', amount: 2100000, description: 'Enterprise software and cloud services', year: '2026', flagged: true, flagReason: 'No public breakdown of vendor costs' },
  { id: 's5', institution: 'Water Authority', category: 'Infrastructure', amount: 8700000, description: 'Pipe replacement and treatment plant upgrades', year: '2026', flagged: false },
];

const DEMO_SCORES: TransparencyScore[] = [
  { id: 'ts1', institution: 'School Board', score: 72, trend: 'down', reports: 12, resolved: 8 },
  { id: 'ts2', institution: 'Parks Department', score: 88, trend: 'up', reports: 5, resolved: 5 },
  { id: 'ts3', institution: 'City Public Works', score: 45, trend: 'down', reports: 28, resolved: 10 },
  { id: 'ts4', institution: 'City IT Department', score: 38, trend: 'down', reports: 15, resolved: 3 },
  { id: 'ts5', institution: 'Water Authority', score: 62, trend: 'stable', reports: 9, resolved: 5 },
  { id: 'ts6', institution: 'Fire Department', score: 95, trend: 'up', reports: 2, resolved: 2 },
];

const SEV_COLORS: Record<string, string> = { low: '#34C759', medium: '#FF9500', high: '#FF3B30', critical: '#AF52DE' };
const STATUS_COLORS: Record<string, string> = { submitted: '#FF9500', investigating: '#007AFF', resolved: '#34C759', dismissed: '#8E8E93' };
const TREND_ARROWS: Record<string, string> = { up: '+', down: '-', stable: '=' };

type Tab = 'reports' | 'watchdog' | 'transparency';

export function AntiCorruptionScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('reports');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleSubmitReport = useCallback(() => {
    if (!reportTitle.trim()) { Alert.alert('Required', 'Enter a report title.'); return; }
    if (!reportDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    Alert.alert('Report Submitted', 'Your transparency report has been submitted anonymously. It will be reviewed by community watchdogs.');
    setReportTitle(''); setReportDesc('');
  }, [reportTitle, reportDesc]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: '#FF3B30' + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#FF3B30' },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    reportCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    reportTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    reportMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    reportDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    upvotes: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    spendRow: { paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    spendInst: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    spendMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    spendAmount: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginTop: 4 },
    flagBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    flagText: { color: '#FF3B30', fontSize: 11, fontWeight: fonts.semibold },
    scoreCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    scoreRow: { flexDirection: 'row', alignItems: 'center' },
    scoreCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    scoreNum: { color: '#fff', fontSize: 18, fontWeight: fonts.heavy },
    scoreInfo: { flex: 1 },
    scoreName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    scoreMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    trendText: { fontSize: 13, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'reports', label: 'Reports' },
    { key: 'watchdog', label: 'Watchdog' },
    { key: 'transparency', label: 'Transparency' },
  ];

  const getScoreColor = (score: number) => score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF3B30';

  const renderReports = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Submit a Report</Text>
        <TextInput style={s.input} placeholder="Report title" placeholderTextColor={t.text.muted} value={reportTitle} onChangeText={setReportTitle} />
        <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe the issue..." placeholderTextColor={t.text.muted} value={reportDesc} onChangeText={setReportDesc} multiline />
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitReport}>
          <Text style={s.submitText}>Submit Anonymously</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.sectionTitle}>Recent Reports</Text>
      {DEMO_REPORTS.map((r) => (
        <View key={r.id} style={s.reportCard}>
          <Text style={s.reportTitle}>{r.title}</Text>
          <Text style={s.reportMeta}>{r.institution} | {r.date}</Text>
          <Text style={s.reportDesc}>{r.description}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: SEV_COLORS[r.severity] }]}><Text style={s.badgeText}>{r.severity}</Text></View>
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[r.status] }]}><Text style={s.badgeText}>{r.status}</Text></View>
          </View>
          <Text style={s.upvotes}>{r.upvotes} community upvotes</Text>
        </View>
      ))}
    </>
  );

  const renderWatchdog = () => (
    <>
      <Text style={s.sectionTitle}>Public Spending Monitor</Text>
      <View style={s.card}>
        {DEMO_SPENDING.map((sp) => (
          <View key={sp.id} style={s.spendRow}>
            <Text style={s.spendInst}>{sp.institution}</Text>
            <Text style={s.spendMeta}>{sp.category} — {sp.description}</Text>
            <Text style={s.spendAmount}>${(sp.amount / 1000000).toFixed(1)}M</Text>
            {sp.flagged && (
              <View style={s.flagBadge}><Text style={s.flagText}>FLAGGED: {sp.flagReason}</Text></View>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const renderTransparency = () => (
    <>
      <Text style={s.sectionTitle}>Transparency Scores</Text>
      {DEMO_SCORES.sort((a, b) => b.score - a.score).map((ts) => (
        <View key={ts.id} style={s.scoreCard}>
          <View style={s.scoreRow}>
            <View style={[s.scoreCircle, { backgroundColor: getScoreColor(ts.score) }]}>
              <Text style={s.scoreNum}>{ts.score}</Text>
            </View>
            <View style={s.scoreInfo}>
              <Text style={s.scoreName}>{ts.institution}</Text>
              <Text style={s.scoreMeta}>{ts.reports} reports | {ts.resolved} resolved</Text>
              <Text style={[s.trendText, { color: ts.trend === 'up' ? '#34C759' : ts.trend === 'down' ? '#FF3B30' : t.text.muted }]}>
                Trend: {TREND_ARROWS[ts.trend]} {ts.trend}
              </Text>
            </View>
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
        <Text style={s.title}>Anti-Corruption</Text>
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
        {tab === 'reports' && renderReports()}
        {tab === 'watchdog' && renderWatchdog()}
        {tab === 'transparency' && renderTransparency()}
      </ScrollView>
    </SafeAreaView>
  );
}
