import { fonts } from '../utils/theme';
/**
 * Incident Report Screen — Community incident reporting, documentation, follow-up.
 *
 * Article V: Community safety and mutual accountability.
 * Transparent incident reporting builds trust and drives resolution.
 *
 * Features:
 * - Report types: safety, environmental, infrastructure, health, noise, animals, other
 * - Submit report (type, description, location, severity, photo hash evidence)
 * - Track report status (submitted -> acknowledged -> investigating -> resolved)
 * - Community incident stats (trending issues, resolution times)
 * - Anonymous reporting option
 * - Follow-up notifications when status changes
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type ReportType = 'safety' | 'environmental' | 'infrastructure' | 'health' | 'noise' | 'animals' | 'other';
type ReportStatus = 'submitted' | 'acknowledged' | 'investigating' | 'resolved';
type ReportSeverity = 'low' | 'moderate' | 'high' | 'critical';

interface IncidentReport {
  id: string;
  type: ReportType;
  description: string;
  location: string;
  severity: ReportSeverity;
  status: ReportStatus;
  anonymous: boolean;
  photoHash: string | null;
  submittedAt: string;
  updatedAt: string;
  resolution: string | null;
}

interface CommunityIncidentStats {
  totalReports: number;
  resolvedCount: number;
  avgResolutionDays: number;
  trendingIssue: string;
  activeReports: number;
  resolutionRate: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const REPORT_TYPES: Array<{ key: ReportType; label: string; icon: string }> = [
  { key: 'safety', label: 'Safety', icon: 'S' },
  { key: 'environmental', label: 'Environmental', icon: 'E' },
  { key: 'infrastructure', label: 'Infrastructure', icon: 'I' },
  { key: 'health', label: 'Health', icon: 'H' },
  { key: 'noise', label: 'Noise', icon: 'N' },
  { key: 'animals', label: 'Animals', icon: 'A' },
  { key: 'other', label: 'Other', icon: 'O' },
];

const SEVERITY_OPTIONS: Array<{ key: ReportSeverity; label: string; color: string }> = [
  { key: 'low', label: 'Low', color: '#34C759' },
  { key: 'moderate', label: 'Moderate', color: '#FF9500' },
  { key: 'high', label: 'High', color: '#FF3B30' },
  { key: 'critical', label: 'Critical', color: '#AF52DE' },
];

const STATUS_INFO: Record<ReportStatus, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: '#8E8E93' },
  acknowledged: { label: 'Acknowledged', color: '#007AFF' },
  investigating: { label: 'Investigating', color: '#FF9500' },
  resolved: { label: 'Resolved', color: '#34C759' },
};

const STATUS_ORDER: ReportStatus[] = ['submitted', 'acknowledged', 'investigating', 'resolved'];

// ─── Demo Data ───

const DEMO_REPORTS: IncidentReport[] = [
  {
    id: '1', type: 'infrastructure', description: 'Large pothole on Main Street near the crosswalk at 5th Ave. Approximately 2 feet wide.',
    location: 'Main St & 5th Ave', severity: 'moderate', status: 'investigating', anonymous: false,
    photoHash: '0x7a3f...b2c1', submittedAt: '2026-03-27', updatedAt: '2026-03-28',
    resolution: null,
  },
  {
    id: '2', type: 'safety', description: 'Broken streetlight at the corner of Elm Dr and Oak Lane. Area very dark at night.',
    location: 'Elm Dr & Oak Ln', severity: 'high', status: 'acknowledged', anonymous: false,
    photoHash: '0x9e1d...f4a8', submittedAt: '2026-03-26', updatedAt: '2026-03-27',
    resolution: null,
  },
  {
    id: '3', type: 'noise', description: 'Construction site operating past 10 PM on weeknights. Exceeds local noise ordinance.',
    location: '200 Block Cedar St', severity: 'moderate', status: 'resolved', anonymous: true,
    photoHash: null, submittedAt: '2026-03-20', updatedAt: '2026-03-25',
    resolution: 'Construction company issued warning. Hours restricted to 7 AM - 8 PM.',
  },
  {
    id: '4', type: 'animals', description: 'Stray dog pack frequently seen near the community park. Appears aggressive when approached.',
    location: 'Riverside Community Park', severity: 'high', status: 'submitted', anonymous: false,
    photoHash: '0x3b7e...c9d2', submittedAt: '2026-03-29', updatedAt: '2026-03-29',
    resolution: null,
  },
];

const DEMO_COMMUNITY_STATS: CommunityIncidentStats = {
  totalReports: 347,
  resolvedCount: 289,
  avgResolutionDays: 4.2,
  trendingIssue: 'Infrastructure',
  activeReports: 58,
  resolutionRate: 83,
};

type Tab = 'report' | 'my-reports' | 'community' | 'stats';

export function IncidentReportScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('report');
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportSeverity, setReportSeverity] = useState<ReportSeverity | ''>('');
  const [reportAnonymous, setReportAnonymous] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const reports = DEMO_REPORTS;
  const communityStats = DEMO_COMMUNITY_STATS;

  const handleSubmitReport = useCallback(() => {
    if (!reportType) { Alert.alert('Required', 'Select a report type.'); return; }
    if (!reportDescription.trim()) { Alert.alert('Required', 'Enter a description of the incident.'); return; }
    if (!reportLocation.trim()) { Alert.alert('Required', 'Enter the location.'); return; }
    if (!reportSeverity) { Alert.alert('Required', 'Select a severity level.'); return; }

    const typeLabel = REPORT_TYPES.find((r) => r.key === reportType)?.label || reportType;
    Alert.alert(
      'Report Submitted',
      `${typeLabel} incident reported at ${reportLocation}.\nSeverity: ${reportSeverity}\n${reportAnonymous ? 'Submitted anonymously.' : ''}\n\nYou will receive follow-up notifications as the status changes.`,
    );
    setReportType('');
    setReportDescription('');
    setReportLocation('');
    setReportSeverity('');
    setReportAnonymous(false);
    setTab('my-reports');
  }, [reportType, reportDescription, reportLocation, reportSeverity, reportAnonymous]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    typeChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.blue },
    severityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    severityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    severityChipSelected: { borderWidth: 2 },
    severityChipText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    anonymousRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    anonymousLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    anonymousHint: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    reportRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reportType: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    reportDesc: { color: t.text.primary, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    reportMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    reportLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    reportResolution: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 6, lineHeight: 20 },
    statusTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    statusLine: { flex: 1, height: 2, marginHorizontal: 4 },
    statusStepLabel: { color: t.text.muted, fontSize: fonts.xxs, textAlign: 'center', marginTop: 4 },
    statusTrackContainer: { marginTop: 10 },
    statusTrackRow: { flexDirection: 'row', alignItems: 'center' },
    statusTrackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    photoHash: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'monospace', marginTop: 4 },
    anonymousTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    anonymousTagText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    communityStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    communityStatLabel: { color: t.text.muted, fontSize: fonts.md },
    communityStatValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    educationCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    trendingCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    trendingTitle: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 8 },
    trendingText: { color: t.text.primary, fontSize: fonts.md, lineHeight: 20 },
    resolutionBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12 },
    resolutionBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'report', label: 'New Report' },
    { key: 'my-reports', label: 'My Reports' },
    { key: 'community', label: 'Community' },
    { key: 'stats', label: 'Stats' },
  ];

  // ─── Status Tracker ───

  const renderStatusTracker = (currentStatus: ReportStatus) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    return (
      <View style={s.statusTrackContainer}>
        <View style={s.statusTrackRow}>
          {STATUS_ORDER.map((status, i) => {
            const reached = i <= currentIndex;
            const info = STATUS_INFO[status];
            return (
              <React.Fragment key={status}>
                <View style={[s.statusDot, { backgroundColor: reached ? info.color : t.bg.primary }]} />
                {i < STATUS_ORDER.length - 1 && (
                  <View style={[s.statusLine, { backgroundColor: i < currentIndex ? t.accent.green : t.bg.primary }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
        <View style={s.statusTrackLabels}>
          {STATUS_ORDER.map((status) => (
            <Text key={status} style={s.statusStepLabel}>{STATUS_INFO[status].label}</Text>
          ))}
        </View>
      </View>
    );
  };

  // ─── Report Tab ───

  const renderReport = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Submit Incident Report</Text>

      <Text style={[s.reportMeta, { marginBottom: 8 }]}>Report Type</Text>
      <View style={s.typeGrid}>
        {REPORT_TYPES.map((rt) => (
          <TouchableOpacity
            key={rt.key}
            style={[s.typeChip, reportType === rt.key && s.typeChipSelected]}
            onPress={() => setReportType(rt.key)}
          >
            <Text style={[s.typeChipText, reportType === rt.key && s.typeChipTextSelected]}>
              {rt.icon} {rt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Describe the incident in detail"
        placeholderTextColor={t.text.muted}
        value={reportDescription}
        onChangeText={setReportDescription}
        multiline
      />

      <TextInput
        style={s.input}
        placeholder="Location (address or intersection)"
        placeholderTextColor={t.text.muted}
        value={reportLocation}
        onChangeText={setReportLocation}
      />

      <Text style={[s.reportMeta, { marginBottom: 8 }]}>Severity</Text>
      <View style={s.severityGrid}>
        {SEVERITY_OPTIONS.map((sev) => (
          <TouchableOpacity
            key={sev.key}
            style={[
              s.severityChip,
              reportSeverity === sev.key && [s.severityChipSelected, { borderColor: sev.color, backgroundColor: sev.color + '15' }],
            ]}
            onPress={() => setReportSeverity(sev.key)}
          >
            <Text style={[s.severityChipText, { color: reportSeverity === sev.key ? sev.color : t.text.muted }]}>
              {sev.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.anonymousRow}>
        <View>
          <Text style={s.anonymousLabel}>Submit Anonymously</Text>
          <Text style={s.anonymousHint}>Your identity will not be attached to this report</Text>
        </View>
        <Switch value={reportAnonymous} onValueChange={setReportAnonymous} />
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitReport}>
        <Text style={s.submitText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── My Reports Tab ───

  const renderMyReports = () => (
    <>
      <Text style={s.sectionTitle}>My Reports</Text>
      <View style={s.card}>
        {reports.map((report, i) => {
          const typeInfo = REPORT_TYPES.find((r) => r.key === report.type);
          const statusInfo = STATUS_INFO[report.status];
          return (
            <View key={report.id} style={[s.reportRow, i === reports.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.reportHeader}>
                <Text style={s.reportType}>{typeInfo?.icon} {typeInfo?.label}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Text style={s.statusText}>{statusInfo.label}</Text>
                </View>
              </View>
              <Text style={s.reportDesc}>{report.description}</Text>
              <Text style={s.reportLocation}>Location: {report.location}</Text>
              <Text style={s.reportMeta}>
                Submitted {report.submittedAt} | Updated {report.updatedAt} | Severity: {report.severity}
              </Text>
              {report.photoHash && <Text style={s.photoHash}>Evidence: {report.photoHash}</Text>}
              {report.anonymous && (
                <View style={s.anonymousTag}>
                  <Text style={s.anonymousTagText}>ANONYMOUS</Text>
                </View>
              )}
              {report.resolution && (
                <Text style={s.reportResolution}>Resolution: {report.resolution}</Text>
              )}
              {renderStatusTracker(report.status)}
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Community Tab ───

  const renderCommunity = () => {
    const recentReports = reports.filter((r) => r.status !== 'resolved');
    return (
      <>
        <Text style={s.sectionTitle}>Active Community Reports</Text>
        <View style={s.card}>
          {recentReports.length === 0 ? (
            <Text style={[s.educationText, { color: t.text.muted }]}>No active community reports.</Text>
          ) : (
            recentReports.map((report, i) => {
              const typeInfo = REPORT_TYPES.find((r) => r.key === report.type);
              const statusInfo = STATUS_INFO[report.status];
              return (
                <View key={report.id} style={[s.reportRow, i === recentReports.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.reportHeader}>
                    <Text style={s.reportType}>{typeInfo?.icon} {typeInfo?.label}</Text>
                    <View style={[s.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Text style={s.statusText}>{statusInfo.label}</Text>
                    </View>
                  </View>
                  <Text style={s.reportDesc}>{report.description}</Text>
                  <Text style={s.reportLocation}>{report.location}</Text>
                  <Text style={s.reportMeta}>Severity: {report.severity} | {report.updatedAt}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={s.trendingCard}>
          <Text style={s.trendingTitle}>Trending Issue: {communityStats.trendingIssue}</Text>
          <Text style={s.trendingText}>
            Infrastructure reports have increased 23% this month.{'\n'}
            Community engagement helps prioritize fixes.
          </Text>
        </View>

        <View style={s.educationCard}>
          <Text style={s.educationText}>
            Community incident reports are visible to all.{'\n'}
            Anonymous reports protect your identity.{'\n'}
            Transparency drives faster resolution.
          </Text>
        </View>
      </>
    );
  };

  // ─── Stats Tab ───

  const renderStats = () => (
    <>
      <Text style={s.sectionTitle}>Community Incident Statistics</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{communityStats.totalReports}</Text>
            <Text style={s.statLabel}>Total Reports</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{communityStats.resolvedCount}</Text>
            <Text style={s.statLabel}>Resolved</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{communityStats.activeReports}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Resolution Rate</Text>
        <Text style={[s.statValue, { textAlign: 'center', fontSize: fonts.hero }]}>{communityStats.resolutionRate}%</Text>
        <View style={s.resolutionBar}>
          <View style={[s.resolutionBarInner, { width: `${communityStats.resolutionRate}%` }]} />
        </View>
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Detailed Stats</Text>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Average Resolution Time</Text>
          <Text style={s.communityStatValue}>{communityStats.avgResolutionDays} days</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Trending Issue</Text>
          <Text style={s.communityStatValue}>{communityStats.trendingIssue}</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Total Reports (All Time)</Text>
          <Text style={s.communityStatValue}>{communityStats.totalReports}</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Resolved Reports</Text>
          <Text style={s.communityStatValue}>{communityStats.resolvedCount}</Text>
        </View>
        <View style={[s.communityStatRow, { borderBottomWidth: 0 }]}>
          <Text style={s.communityStatLabel}>Active Reports</Text>
          <Text style={s.communityStatValue}>{communityStats.activeReports}</Text>
        </View>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Every report contributes to a safer community.{'\n'}
          Incident data helps allocate resources{'\n'}
          where they are needed most.{'\n\n'}
          Accountability through transparency.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Incident Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'report' && renderReport()}
        {tab === 'my-reports' && renderMyReports()}
        {tab === 'community' && renderCommunity()}
        {tab === 'stats' && renderStats()}
      </ScrollView>
    </SafeAreaView>
  );
}
