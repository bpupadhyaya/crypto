import { fonts } from '../utils/theme';
/**
 * Community Infrastructure — Article I of The Human Constitution.
 *
 * "Infrastructure is the backbone of community life — roads, bridges, water,
 * electricity, internet, public buildings, and parks sustain human flourishing."
 *
 * Features:
 * - Infrastructure categories: roads, bridges, water pipes, electricity, internet, public buildings, parks
 * - Report issues (pothole, broken pipe, power outage, damaged bridge)
 * - Track issue resolution (reported -> acknowledged -> assigned -> fixing -> resolved)
 * - Community infrastructure score (0-100: condition, maintenance, access)
 * - Upcoming maintenance schedule
 * - Demo: infrastructure score 73, 4 reported issues, 2 resolved, 1 maintenance scheduled
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

type Tab = 'dashboard' | 'report' | 'issues' | 'schedule';

type IssueStatus = 'reported' | 'acknowledged' | 'assigned' | 'fixing' | 'resolved';

interface InfraCategory {
  id: string;
  label: string;
  icon: string;
  score: number;
  issueCount: number;
}

interface InfraIssue {
  id: string;
  category: string;
  type: string;
  description: string;
  location: string;
  status: IssueStatus;
  reportedAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MaintenanceItem {
  id: string;
  category: string;
  description: string;
  scheduledDate: string;
  duration: string;
  impact: string;
}

const CATEGORIES: InfraCategory[] = [
  { id: 'roads', label: 'Roads', icon: '\u{1F6E3}', score: 68, issueCount: 2 },
  { id: 'bridges', label: 'Bridges', icon: '\u{1F309}', score: 82, issueCount: 0 },
  { id: 'water', label: 'Water Pipes', icon: '\u{1F6B0}', score: 61, issueCount: 1 },
  { id: 'electricity', label: 'Electricity', icon: '\u{26A1}', score: 78, issueCount: 1 },
  { id: 'internet', label: 'Internet', icon: '\u{1F310}', score: 85, issueCount: 0 },
  { id: 'buildings', label: 'Public Buildings', icon: '\u{1F3DB}', score: 70, issueCount: 0 },
  { id: 'parks', label: 'Parks', icon: '\u{1F333}', score: 74, issueCount: 0 },
];

const ISSUE_TYPES: Record<string, string[]> = {
  roads: ['Pothole', 'Cracked Pavement', 'Faded Markings', 'Flooding'],
  bridges: ['Damaged Railing', 'Structural Crack', 'Erosion'],
  water: ['Broken Pipe', 'Low Pressure', 'Contamination', 'Leak'],
  electricity: ['Power Outage', 'Downed Line', 'Flickering', 'Transformer Issue'],
  internet: ['Outage', 'Slow Speed', 'Cable Damage'],
  buildings: ['Structural Damage', 'Accessibility Issue', 'Maintenance Needed'],
  parks: ['Damaged Equipment', 'Overgrown', 'Litter', 'Lighting Issue'],
};

const STATUS_ORDER: IssueStatus[] = ['reported', 'acknowledged', 'assigned', 'fixing', 'resolved'];

const STATUS_COLORS: Record<IssueStatus, string> = {
  reported: '#ef4444',
  acknowledged: '#f97316',
  assigned: '#eab308',
  fixing: '#3b82f6',
  resolved: '#22c55e',
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  fixing: 'Fixing',
  resolved: 'Resolved',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const DEMO_ISSUES: InfraIssue[] = [
  {
    id: 'ISS-001', category: 'roads', type: 'Pothole',
    description: 'Large pothole on Main Street near intersection with Oak Ave',
    location: 'Main St & Oak Ave', status: 'fixing', reportedAt: '2026-03-25',
    updatedAt: '2026-03-28', priority: 'high',
  },
  {
    id: 'ISS-002', category: 'water', type: 'Broken Pipe',
    description: 'Water main break causing street flooding on Elm Road',
    location: 'Elm Road, Block 4', status: 'assigned', reportedAt: '2026-03-27',
    updatedAt: '2026-03-28', priority: 'critical',
  },
  {
    id: 'ISS-003', category: 'electricity', type: 'Power Outage',
    description: 'Intermittent power outage affecting 12 homes in Cedar district',
    location: 'Cedar District', status: 'resolved', reportedAt: '2026-03-22',
    updatedAt: '2026-03-26', priority: 'high',
  },
  {
    id: 'ISS-004', category: 'roads', type: 'Cracked Pavement',
    description: 'Sidewalk cracking near school entrance, potential tripping hazard',
    location: 'Pine St, near School', status: 'resolved', reportedAt: '2026-03-20',
    updatedAt: '2026-03-25', priority: 'medium',
  },
];

const DEMO_MAINTENANCE: MaintenanceItem[] = [
  {
    id: 'MNT-001', category: 'water',
    description: 'Annual water pipe inspection and valve replacement on River Road',
    scheduledDate: '2026-04-05', duration: '3 days',
    impact: 'Reduced water pressure in River Road area during work hours',
  },
];

const REPORT_CATEGORIES = CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }));

export function InfrastructureScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore(s => s.demoMode);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [reportCategory, setReportCategory] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 22, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    categoryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg.card },
    categoryIconText: { fontSize: 20 },
    categoryLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    scoreBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
    scoreFill: { height: 6, borderRadius: 3 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: fonts.bold, color: '#fff' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusStep: { flex: 1, alignItems: 'center' },
    statusLine: { height: 2, flex: 1 },
    statusLabel: { fontSize: 9, marginTop: 2 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    issueTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    issueDesc: { color: t.text.muted, fontSize: 12, lineHeight: 17, marginBottom: 4 },
    issueLocation: { color: t.text.secondary, fontSize: 11 },
    reportOption: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    reportOptionText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    reportOptionIcon: { fontSize: 22 },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 15 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    confirmCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 20, marginBottom: 12, alignItems: 'center' },
    confirmText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', marginTop: 8 },
    confirmSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
    scheduleDate: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    scheduleDuration: { color: t.text.secondary, fontSize: 12, marginBottom: 4 },
    scheduleImpact: { color: t.text.muted, fontSize: 11, lineHeight: 16 },
    progressTrack: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 },
  }), [t]);

  const issues = demoMode ? DEMO_ISSUES : [];
  const maintenance = demoMode ? DEMO_MAINTENANCE : [];

  const overallScore = useMemo(() => {
    if (!demoMode) return 0;
    return Math.round(CATEGORIES.reduce((s, c) => s + c.score, 0) / CATEGORIES.length);
  }, [demoMode]);

  const openIssues = useMemo(() => issues.filter(i => i.status !== 'resolved'), [issues]);
  const resolvedIssues = useMemo(() => issues.filter(i => i.status === 'resolved'), [issues]);

  const scoreColor = (score: number) => {
    if (score >= 80) return t.accent.green;
    if (score >= 60) return t.accent.yellow;
    return t.accent.red;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'report', label: 'Report' },
    { key: 'issues', label: 'Issues' },
    { key: 'schedule', label: 'Schedule' },
  ];

  const renderStatusProgress = (currentStatus: IssueStatus) => {
    const currentIdx = STATUS_ORDER.indexOf(currentStatus);
    return (
      <View style={st.progressTrack}>
        {STATUS_ORDER.map((s, i) => {
          const active = i <= currentIdx;
          const color = active ? STATUS_COLORS[currentStatus] : t.border;
          return (
            <React.Fragment key={s}>
              {i > 0 && <View style={[st.statusLine, { backgroundColor: active ? STATUS_COLORS[currentStatus] : t.border }]} />}
              <View style={st.statusStep}>
                <View style={[st.statusDot, { backgroundColor: color }]} />
                <Text style={[st.statusLabel, { color: active ? STATUS_COLORS[currentStatus] : t.text.muted }]}>{STATUS_LABELS[s]}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderDashboard = () => (
    <>
      <Text style={st.subtitle}>
        Community infrastructure monitoring — track condition, report issues, and follow maintenance schedules.
      </Text>

      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: scoreColor(overallScore) }]}>{overallScore}</Text>
          <Text style={st.summaryLabel}>Infra Score</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.red }]}>{openIssues.length}</Text>
          <Text style={st.summaryLabel}>Open Issues</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>{resolvedIssues.length}</Text>
          <Text style={st.summaryLabel}>Resolved</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{maintenance.length}</Text>
          <Text style={st.summaryLabel}>Scheduled</Text>
        </View>
      </View>

      <Text style={st.section}>Categories</Text>
      {CATEGORIES.map(cat => (
        <View key={cat.id} style={st.card}>
          <View style={st.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={st.categoryIconText}>{cat.icon}</Text>
              <Text style={st.categoryLabel}>{cat.label}</Text>
            </View>
            <Text style={[st.val, { color: scoreColor(cat.score), fontSize: 16, fontWeight: fonts.heavy }]}>{cat.score}</Text>
          </View>
          <View style={st.scoreBar}>
            <View style={[st.scoreFill, { width: `${cat.score}%`, backgroundColor: scoreColor(cat.score) }]} />
          </View>
          {cat.issueCount > 0 && (
            <Text style={[st.label, { marginTop: 6, color: t.accent.red }]}>
              {cat.issueCount} open issue{cat.issueCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      ))}
    </>
  );

  const renderReport = () => {
    if (reportType) {
      return (
        <>
          <View style={st.confirmCard}>
            <Text style={{ fontSize: 40 }}>{'\u2705'}</Text>
            <Text style={st.confirmText}>Report: {reportType}</Text>
            <Text style={st.confirmSub}>
              Category: {REPORT_CATEGORIES.find(c => c.id === reportCategory)?.label}{'\n'}
              In demo mode, reports are simulated. In live mode, this would be submitted to your community's infrastructure tracker.
            </Text>
          </View>
          <TouchableOpacity style={st.backBtn} onPress={() => { setReportType(null); setReportCategory(null); }}>
            <Text style={st.backText}>Report Another Issue</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (reportCategory) {
      const types = ISSUE_TYPES[reportCategory] || [];
      return (
        <>
          <Text style={st.section}>Select Issue Type</Text>
          {types.map(type => (
            <TouchableOpacity key={type} style={st.reportOption} onPress={() => setReportType(type)}>
              <Text style={st.reportOptionText}>{type}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={st.backBtn} onPress={() => setReportCategory(null)}>
            <Text style={st.backText}>Back to Categories</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={st.subtitle}>
          Report an infrastructure issue in your community. Select a category, then describe the problem.
        </Text>
        <Text style={st.section}>Select Category</Text>
        {REPORT_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={st.reportOption} onPress={() => setReportCategory(cat.id)}>
            <Text style={st.reportOptionIcon}>{cat.icon}</Text>
            <Text style={st.reportOptionText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderIssues = () => {
    if (!demoMode || issues.length === 0) {
      return <Text style={st.empty}>No reported issues. Use the Report tab to submit one.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Track the resolution of reported infrastructure issues in your community.
        </Text>

        {openIssues.length > 0 && (
          <>
            <Text style={st.section}>Open Issues ({openIssues.length})</Text>
            {openIssues.map(issue => (
              <View key={issue.id} style={st.card}>
                <View style={st.row}>
                  <Text style={st.issueTitle}>{issue.type}</Text>
                  <View style={[st.badge, { backgroundColor: PRIORITY_COLORS[issue.priority] }]}>
                    <Text style={st.badgeText}>{issue.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={st.issueDesc}>{issue.description}</Text>
                <Text style={st.issueLocation}>{'\u{1F4CD}'} {issue.location}</Text>
                <View style={st.row}>
                  <Text style={st.label}>Reported: {issue.reportedAt}</Text>
                  <Text style={st.label}>Updated: {issue.updatedAt}</Text>
                </View>
                {renderStatusProgress(issue.status)}
              </View>
            ))}
          </>
        )}

        {resolvedIssues.length > 0 && (
          <>
            <Text style={st.section}>Resolved ({resolvedIssues.length})</Text>
            {resolvedIssues.map(issue => (
              <View key={issue.id} style={[st.card, { opacity: 0.7 }]}>
                <View style={st.row}>
                  <Text style={st.issueTitle}>{issue.type}</Text>
                  <View style={[st.badge, { backgroundColor: '#22c55e' }]}>
                    <Text style={st.badgeText}>RESOLVED</Text>
                  </View>
                </View>
                <Text style={st.issueDesc}>{issue.description}</Text>
                <Text style={st.issueLocation}>{'\u{1F4CD}'} {issue.location}</Text>
                <View style={st.row}>
                  <Text style={st.label}>Reported: {issue.reportedAt}</Text>
                  <Text style={st.label}>Resolved: {issue.updatedAt}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </>
    );
  };

  const renderSchedule = () => {
    if (!demoMode || maintenance.length === 0) {
      return <Text style={st.empty}>No scheduled maintenance at this time.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Upcoming infrastructure maintenance in your community. Plan ahead to minimize disruption.
        </Text>
        <Text style={st.section}>Upcoming Maintenance</Text>
        {maintenance.map(item => (
          <View key={item.id} style={st.card}>
            <Text style={st.cardTitle}>{item.description}</Text>
            <View style={st.divider} />
            <View style={st.row}>
              <Text style={st.label}>Scheduled</Text>
              <Text style={st.scheduleDate}>{item.scheduledDate}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Duration</Text>
              <Text style={st.scheduleDuration}>{item.duration}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Category</Text>
              <Text style={st.val}>{CATEGORIES.find(c => c.id === item.category)?.label}</Text>
            </View>
            <View style={st.divider} />
            <Text style={st.label}>Impact</Text>
            <Text style={st.scheduleImpact}>{item.impact}</Text>
          </View>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Infrastructure</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <View style={st.tabRow}>
          {tabs.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[st.tab, tab === key && st.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[st.tabText, tab === key && st.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'dashboard' && renderDashboard()}
        {tab === 'report' && renderReport()}
        {tab === 'issues' && renderIssues()}
        {tab === 'schedule' && renderSchedule()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
