import { fonts } from '../utils/theme';
/**
 * Human Rights Screen — Human rights education, monitoring, reporting.
 *
 * Article I of The Human Constitution: "All humans are born free and equal."
 *
 * Features:
 * - Rights overview (UDHR articles)
 * - Monitor rights conditions in your area
 * - Report rights violations
 * - Educational resources
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

interface Right {
  id: string;
  article: number;
  title: string;
  summary: string;
  localScore: number;
}

interface MonitorEntry {
  id: string;
  area: string;
  category: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  incidents: number;
  lastUpdated: string;
}

interface RightsReport {
  id: string;
  title: string;
  category: string;
  location: string;
  severity: 'concern' | 'violation' | 'emergency';
  status: 'submitted' | 'reviewed' | 'action-taken';
  date: string;
  supporters: number;
}

interface EducationResource {
  id: string;
  title: string;
  type: 'course' | 'document' | 'video' | 'workshop';
  topic: string;
  duration: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_RIGHTS: Right[] = [
  { id: 'rt1', article: 1, title: 'Freedom & Equality', summary: 'All human beings are born free and equal in dignity and rights.', localScore: 82 },
  { id: 'rt2', article: 3, title: 'Right to Life', summary: 'Everyone has the right to life, liberty and security of person.', localScore: 90 },
  { id: 'rt3', article: 19, title: 'Freedom of Expression', summary: 'Everyone has the right to freedom of opinion and expression.', localScore: 75 },
  { id: 'rt4', article: 23, title: 'Right to Work', summary: 'Everyone has the right to work, to free choice of employment, to just conditions.', localScore: 68 },
  { id: 'rt5', article: 25, title: 'Right to Adequate Living', summary: 'Everyone has the right to a standard of living adequate for health and well-being.', localScore: 71 },
  { id: 'rt6', article: 26, title: 'Right to Education', summary: 'Everyone has the right to education. Education shall be free in elementary stages.', localScore: 85 },
];

const DEMO_MONITOR: MonitorEntry[] = [
  { id: 'me1', area: 'Downtown District', category: 'Housing Rights', score: 62, trend: 'declining', incidents: 15, lastUpdated: '2026-03-28' },
  { id: 'me2', area: 'Riverside', category: 'Labor Rights', score: 78, trend: 'stable', incidents: 4, lastUpdated: '2026-03-27' },
  { id: 'me3', area: 'East Side', category: 'Education Access', score: 85, trend: 'improving', incidents: 2, lastUpdated: '2026-03-26' },
  { id: 'me4', area: 'Industrial Zone', category: 'Health & Safety', score: 55, trend: 'declining', incidents: 22, lastUpdated: '2026-03-28' },
  { id: 'me5', area: 'Suburb Heights', category: 'Freedom of Assembly', score: 91, trend: 'stable', incidents: 1, lastUpdated: '2026-03-25' },
];

const DEMO_REPORTS: RightsReport[] = [
  { id: 'rr1', title: 'Wage theft at construction sites', category: 'Labor Rights', location: 'Industrial Zone', severity: 'violation', status: 'reviewed', date: '2026-03-25', supporters: 89 },
  { id: 'rr2', title: 'Eviction without proper notice', category: 'Housing Rights', location: 'Downtown', severity: 'violation', status: 'action-taken', date: '2026-03-20', supporters: 156 },
  { id: 'rr3', title: 'School overcrowding concerns', category: 'Education', location: 'East Side', severity: 'concern', status: 'submitted', date: '2026-03-27', supporters: 42 },
  { id: 'rr4', title: 'Unsafe factory conditions', category: 'Health & Safety', location: 'Industrial Zone', severity: 'emergency', status: 'reviewed', date: '2026-03-22', supporters: 234 },
];

const DEMO_EDUCATION: EducationResource[] = [
  { id: 'ed1', title: 'Know Your Rights: Basics', type: 'course', topic: 'Human Rights 101', duration: '2 hours', description: 'Introduction to the Universal Declaration of Human Rights.' },
  { id: 'ed2', title: 'Workers Rights Workshop', type: 'workshop', topic: 'Labor Rights', duration: '3 hours', description: 'Know your rights in the workplace. Wages, safety, discrimination.' },
  { id: 'ed3', title: 'Housing Rights Guide', type: 'document', topic: 'Housing', duration: '30 min read', description: 'Tenant rights, eviction protections, and how to report violations.' },
  { id: 'ed4', title: 'Digital Privacy Rights', type: 'video', topic: 'Privacy', duration: '45 min', description: 'Understanding your right to privacy in the digital age.' },
  { id: 'ed5', title: 'Youth Rights & Advocacy', type: 'course', topic: 'Youth', duration: '1.5 hours', description: 'Empowering young people to advocate for their rights.' },
];

const SEV_COLORS: Record<string, string> = { concern: '#FF9500', violation: '#FF3B30', emergency: '#AF52DE' };
const STATUS_COLORS: Record<string, string> = { submitted: '#FF9500', reviewed: '#007AFF', 'action-taken': '#34C759' };
const TREND_COLORS: Record<string, string> = { improving: '#34C759', declining: '#FF3B30', stable: '#FF9500' };
const TYPE_LABELS: Record<string, string> = { course: 'COURSE', document: 'DOC', video: 'VIDEO', workshop: 'WORKSHOP' };

type Tab = 'rights' | 'monitor' | 'report' | 'education';

export function HumanRightsScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('rights');
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportDesc, setNewReportDesc] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleSubmitReport = useCallback(() => {
    if (!newReportTitle.trim()) { Alert.alert('Required', 'Enter a title for the report.'); return; }
    if (!newReportDesc.trim()) { Alert.alert('Required', 'Describe the issue.'); return; }
    Alert.alert('Report Submitted', 'Your human rights report has been submitted. Community advocates will review it.');
    setNewReportTitle(''); setNewReportDesc('');
  }, [newReportTitle, newReportDesc]);

  const getScoreColor = (score: number) => score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF3B30';

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 3 },
    tabActive: { backgroundColor: '#AF52DE' + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#AF52DE' },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    rightCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    rightHeader: { flexDirection: 'row', alignItems: 'center' },
    articleNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#AF52DE' + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    articleText: { color: '#AF52DE', fontSize: 14, fontWeight: fonts.heavy },
    rightTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    rightSummary: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    rightScore: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    scoreBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginRight: 8 },
    scoreFill: { height: 8, borderRadius: 4 },
    scoreText: { fontSize: 14, fontWeight: fonts.bold, width: 40 },
    monitorCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    monArea: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    monMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    monScore: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    trendBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    trendText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    repCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    repTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    repMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    supporters: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: '#AF52DE', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    eduCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eduTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    eduMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    eduDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#AF52DE' + '20', alignSelf: 'flex-start', marginTop: 8 },
    typeText: { color: '#AF52DE', fontSize: 11, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'rights', label: 'Rights' },
    { key: 'monitor', label: 'Monitor' },
    { key: 'report', label: 'Report' },
    { key: 'education', label: 'Education' },
  ];

  const renderRights = () => (
    <>
      <Text style={s.sectionTitle}>Universal Human Rights</Text>
      {DEMO_RIGHTS.map((r) => (
        <View key={r.id} style={s.rightCard}>
          <View style={s.rightHeader}>
            <View style={s.articleNum}><Text style={s.articleText}>{r.article}</Text></View>
            <Text style={s.rightTitle}>{r.title}</Text>
          </View>
          <Text style={s.rightSummary}>{r.summary}</Text>
          <View style={s.rightScore}>
            <View style={s.scoreBar}>
              <View style={[s.scoreFill, { width: `${r.localScore}%` as any, backgroundColor: getScoreColor(r.localScore) }]} />
            </View>
            <Text style={[s.scoreText, { color: getScoreColor(r.localScore) }]}>{r.localScore}%</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderMonitor = () => (
    <>
      <Text style={s.sectionTitle}>Rights Monitoring</Text>
      {DEMO_MONITOR.map((m) => (
        <View key={m.id} style={s.monitorCard}>
          <Text style={s.monArea}>{m.area}</Text>
          <Text style={s.monMeta}>{m.category} | {m.incidents} incidents | Updated: {m.lastUpdated}</Text>
          <View style={s.monScore}>
            <View style={s.scoreBar}>
              <View style={[s.scoreFill, { width: `${m.score}%` as any, backgroundColor: getScoreColor(m.score) }]} />
            </View>
            <Text style={[s.scoreText, { color: getScoreColor(m.score) }]}>{m.score}%</Text>
          </View>
          <View style={[s.trendBadge, { backgroundColor: TREND_COLORS[m.trend] }]}>
            <Text style={s.trendText}>{m.trend}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderReport = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Report a Rights Issue</Text>
        <TextInput style={s.input} placeholder="Issue title" placeholderTextColor={t.text.muted} value={newReportTitle} onChangeText={setNewReportTitle} />
        <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe the situation..." placeholderTextColor={t.text.muted} value={newReportDesc} onChangeText={setNewReportDesc} multiline />
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitReport}>
          <Text style={s.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.sectionTitle}>Recent Reports</Text>
      {DEMO_REPORTS.map((r) => (
        <View key={r.id} style={s.repCard}>
          <Text style={s.repTitle}>{r.title}</Text>
          <Text style={s.repMeta}>{r.category} | {r.location} | {r.date}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: SEV_COLORS[r.severity] }]}><Text style={s.badgeText}>{r.severity}</Text></View>
            <View style={[s.badge, { backgroundColor: STATUS_COLORS[r.status] }]}><Text style={s.badgeText}>{r.status}</Text></View>
          </View>
          <Text style={s.supporters}>{r.supporters} supporters</Text>
        </View>
      ))}
    </>
  );

  const renderEducation = () => (
    <>
      <Text style={s.sectionTitle}>Educational Resources</Text>
      {DEMO_EDUCATION.map((ed) => (
        <View key={ed.id} style={s.eduCard}>
          <Text style={s.eduTitle}>{ed.title}</Text>
          <Text style={s.eduMeta}>{ed.topic} | {ed.duration}</Text>
          <Text style={s.eduDesc}>{ed.description}</Text>
          <View style={s.typeBadge}>
            <Text style={s.typeText}>{TYPE_LABELS[ed.type]}</Text>
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
        <Text style={s.title}>Human Rights</Text>
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
        {tab === 'rights' && renderRights()}
        {tab === 'monitor' && renderMonitor()}
        {tab === 'report' && renderReport()}
        {tab === 'education' && renderEducation()}
      </ScrollView>
    </SafeAreaView>
  );
}
