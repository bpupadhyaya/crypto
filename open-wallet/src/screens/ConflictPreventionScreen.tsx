import { fonts } from '../utils/theme';
/**
 * Conflict Prevention Screen — Early warning systems, conflict prevention before escalation.
 *
 * Article V: "Prevention of conflict through early detection, community dialogue,
 * and trained peace ambassadors ensures that grievances are addressed before
 * they escalate into violence."
 * — Human Constitution, Article V
 *
 * Features:
 * - Community tension indicators (grievance reports, negative OTK trends, dispute frequency)
 * - Early warning dashboard — regions/communities showing signs of conflict
 * - Prevention tools: dialogue sessions, town halls, facilitated conversations
 * - Peace ambassadors — trained community members for de-escalation
 * - Intervention history — past preventions with outcomes
 * - Demo: 2 tension indicators, 3 prevention tools, 1 ambassador
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface TensionIndicator {
  id: string;
  region: string;
  level: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  grievanceReports: number;
  negativeOtkTrend: number; // percentage decline
  disputeFrequency: number; // per week
  lastUpdated: string;
  summary: string;
  triggers: string[];
}

interface PreventionTool {
  id: string;
  name: string;
  type: 'dialogue' | 'town_hall' | 'facilitated' | 'mediation' | 'workshop';
  icon: string;
  description: string;
  scheduledDate?: string;
  region: string;
  participantsExpected: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'available';
}

interface PeaceAmbassador {
  id: string;
  name: string;
  region: string;
  specialization: string;
  interventions: number;
  successRate: number;
  certifiedSince: string;
  available: boolean;
  languages: string[];
  bio: string;
}

interface InterventionRecord {
  id: string;
  title: string;
  region: string;
  date: string;
  type: string;
  ambassadorName: string;
  tensionBefore: string;
  tensionAfter: string;
  outcome: 'resolved' | 'de_escalated' | 'ongoing' | 'referred';
  summary: string;
  participantCount: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_INDICATORS: TensionIndicator[] = [
  {
    id: 'ti1',
    region: 'Riverside District',
    level: 'elevated',
    grievanceReports: 14,
    negativeOtkTrend: -12,
    disputeFrequency: 5,
    lastUpdated: '2026-03-28',
    summary: 'Rising tensions around water access. Grievance reports have doubled in the past 2 weeks. Multiple disputes between upstream and downstream neighborhoods.',
    triggers: ['Water scarcity', 'Resource allocation dispute', 'Unresolved prior grievance'],
  },
  {
    id: 'ti2',
    region: 'Northgate Commons',
    level: 'moderate',
    grievanceReports: 7,
    negativeOtkTrend: -5,
    disputeFrequency: 2,
    lastUpdated: '2026-03-27',
    summary: 'Moderate tension following rezoning announcement. Some residents feel excluded from the decision-making process. Community trust indicators declining.',
    triggers: ['Rezoning decision', 'Perceived exclusion', 'Economic anxiety'],
  },
];

const DEMO_PREVENTION_TOOLS: PreventionTool[] = [
  {
    id: 'pt1',
    name: 'Water Access Dialogue Session',
    type: 'dialogue',
    icon: '\u{1F4AC}',
    description: 'Structured dialogue between upstream and downstream neighborhood representatives to co-create a fair water sharing schedule.',
    scheduledDate: '2026-04-02',
    region: 'Riverside District',
    participantsExpected: 30,
    status: 'scheduled',
  },
  {
    id: 'pt2',
    name: 'Northgate Community Town Hall',
    type: 'town_hall',
    icon: '\u{1F3DB}',
    description: 'Open town hall for all Northgate residents to voice concerns about the rezoning plan. City planners will present and take questions.',
    scheduledDate: '2026-04-05',
    region: 'Northgate Commons',
    participantsExpected: 120,
    status: 'scheduled',
  },
  {
    id: 'pt3',
    name: 'Facilitated Neighborhood Conversation',
    type: 'facilitated',
    icon: '\u{1F91D}',
    description: 'Small-group facilitated conversation to rebuild trust between longtime residents and new arrivals. Trained facilitator guides the discussion.',
    region: 'Riverside District',
    participantsExpected: 15,
    status: 'available',
  },
];

const DEMO_AMBASSADORS: PeaceAmbassador[] = [
  {
    id: 'pa1',
    name: 'Amara Diallo',
    region: 'Riverside District',
    specialization: 'Resource conflict mediation',
    interventions: 23,
    successRate: 91,
    certifiedSince: '2024-06-15',
    available: true,
    languages: ['English', 'French', 'Wolof'],
    bio: 'Community elder and trained mediator. Specializes in water and land disputes. Has successfully de-escalated 21 of 23 interventions over 2 years.',
  },
];

const DEMO_HISTORY: InterventionRecord[] = [
  {
    id: 'ih1',
    title: 'Market Square Vendor Dispute',
    region: 'Central Market',
    date: '2026-03-10',
    type: 'Mediation',
    ambassadorName: 'Amara Diallo',
    tensionBefore: 'high',
    tensionAfter: 'low',
    outcome: 'resolved',
    summary: 'Long-standing dispute between established vendors and newcomers over stall allocation. Three mediation sessions resulted in a fair rotation system accepted by all parties.',
    participantCount: 18,
  },
  {
    id: 'ih2',
    title: 'School District Boundary Grievance',
    region: 'Northgate Commons',
    date: '2026-02-22',
    type: 'Town Hall + Dialogue',
    ambassadorName: 'Kenji Watanabe',
    tensionBefore: 'elevated',
    tensionAfter: 'moderate',
    outcome: 'de_escalated',
    summary: 'Parents protested school boundary changes. A town hall followed by small-group dialogues reduced hostility. A joint committee was formed to review the decision.',
    participantCount: 85,
  },
  {
    id: 'ih3',
    title: 'Youth Gang Tension — West Side',
    region: 'West Side',
    date: '2026-01-15',
    type: 'Workshop + Mentoring',
    ambassadorName: 'Rosa Martinez',
    tensionBefore: 'critical',
    tensionAfter: 'moderate',
    outcome: 'de_escalated',
    summary: 'Rising youth violence was addressed through a 6-week workshop series and mentorship pairing. Violent incidents dropped 60% in the following month.',
    participantCount: 42,
  },
];

type Tab = 'indicators' | 'prevention' | 'ambassadors' | 'history';

export function ConflictPreventionScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('indicators');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const levelColor = useCallback((level: string) => {
    switch (level) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF6B35';
      case 'elevated': return t.accent.orange;
      case 'moderate': return '#FFD60A';
      case 'low': return t.accent.green;
      default: return t.text.muted;
    }
  }, [t]);

  const outcomeColor = useCallback((outcome: string) => {
    switch (outcome) {
      case 'resolved': return t.accent.green;
      case 'de_escalated': return t.accent.blue;
      case 'ongoing': return t.accent.orange;
      case 'referred': return t.text.muted;
      default: return t.text.muted;
    }
  }, [t]);

  const outcomeLabel = useCallback((outcome: string) => {
    switch (outcome) {
      case 'resolved': return 'Resolved';
      case 'de_escalated': return 'De-escalated';
      case 'ongoing': return 'Ongoing';
      case 'referred': return 'Referred';
      default: return outcome;
    }
  }, []);

  const handleRequestDialogue = useCallback((tool: PreventionTool) => {
    Alert.alert(
      'Request Submitted',
      `Your request to join "${tool.name}" has been submitted. You will be notified when confirmed.`,
    );
  }, []);

  const handleContactAmbassador = useCallback((ambassador: PeaceAmbassador) => {
    Alert.alert(
      'Contact Sent',
      `A message has been sent to ${ambassador.name}. They will respond within 24 hours.`,
    );
  }, []);

  const handleReportTension = useCallback(() => {
    Alert.alert(
      'Report Submitted',
      'Your tension report has been filed and will be reviewed by the conflict prevention team within 48 hours.',
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 4, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    indicatorCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    indicatorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    indicatorRegion: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    levelText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    indicatorSummary: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metricBox: { alignItems: 'center', flex: 1 },
    metricValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    metricLabel: { color: t.text.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
    triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    triggerChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    triggerText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    toolCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    toolHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    toolIcon: { fontSize: 28 },
    toolName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    toolDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    toolMeta: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    ambassadorCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    ambassadorName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    ambassadorSpec: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginTop: 2 },
    ambassadorBio: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
    ambassadorMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    statBox: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    langRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    langChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    langText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    contactBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    contactBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    historyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    historyTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    historyMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    historySummary: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
    tensionChange: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    tensionLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    outcomeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    outcomeText: { fontSize: 11, fontWeight: fonts.bold },
    reportBtn: { backgroundColor: t.accent.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8 },
    reportBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 12, lineHeight: 18 },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'indicators', label: 'Indicators' },
    { key: 'prevention', label: 'Prevention' },
    { key: 'ambassadors', label: 'Ambassadors' },
    { key: 'history', label: 'History' },
  ];

  // ─── Indicators Tab ───

  const renderIndicators = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F6A8}'}</Text>
        <Text style={s.heroTitle}>Early Warning System</Text>
        <Text style={s.heroSubtitle}>
          Monitoring community tensions to prevent conflict before escalation. Grievance reports, OTK trends, and dispute frequency are tracked in real time.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Tension Indicators</Text>
      {DEMO_INDICATORS.map((ind) => (
        <View key={ind.id} style={s.indicatorCard}>
          <View style={s.indicatorHeader}>
            <Text style={s.indicatorRegion}>{ind.region}</Text>
            <View style={[s.levelBadge, { backgroundColor: levelColor(ind.level) + '20' }]}>
              <Text style={[s.levelText, { color: levelColor(ind.level) }]}>{ind.level}</Text>
            </View>
          </View>
          <Text style={s.indicatorSummary}>{ind.summary}</Text>
          <View style={s.metricRow}>
            <View style={s.metricBox}>
              <Text style={[s.metricValue, { color: levelColor(ind.level) }]}>{ind.grievanceReports}</Text>
              <Text style={s.metricLabel}>Grievance Reports</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={[s.metricValue, { color: '#FF3B30' }]}>{ind.negativeOtkTrend}%</Text>
              <Text style={s.metricLabel}>OTK Trend</Text>
            </View>
            <View style={s.metricBox}>
              <Text style={[s.metricValue, { color: levelColor(ind.level) }]}>{ind.disputeFrequency}/wk</Text>
              <Text style={s.metricLabel}>Disputes</Text>
            </View>
          </View>
          <View style={s.triggerRow}>
            {ind.triggers.map((trigger, i) => (
              <View key={i} style={s.triggerChip}>
                <Text style={s.triggerText}>{trigger}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.toolMeta, { marginTop: 8 }]}>Updated: {ind.lastUpdated}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.reportBtn} onPress={handleReportTension}>
        <Text style={s.reportBtnText}>Report Community Tension</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        Early detection saves lives. Report tensions before they escalate — every voice matters in conflict prevention.
      </Text>
    </>
  );

  // ─── Prevention Tab ───

  const statusColorFn = useCallback((status: string) => {
    switch (status) {
      case 'scheduled': return t.accent.blue;
      case 'in_progress': return t.accent.orange;
      case 'completed': return t.accent.green;
      case 'available': return t.accent.purple;
      default: return t.text.muted;
    }
  }, [t]);

  const renderPrevention = () => (
    <>
      <Text style={s.sectionTitle}>Prevention Tools</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Dialogue sessions, town halls, and facilitated conversations — tools to address conflict at its root.
      </Text>

      {DEMO_PREVENTION_TOOLS.map((tool) => (
        <View key={tool.id} style={s.toolCard}>
          <View style={s.toolHeader}>
            <Text style={s.toolIcon}>{tool.icon}</Text>
            <Text style={s.toolName}>{tool.name}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColorFn(tool.status) + '20' }]}>
            <Text style={[s.statusText, { color: statusColorFn(tool.status) }]}>
              {tool.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={s.toolDesc}>{tool.description}</Text>
          <Text style={s.toolMeta}>Region: {tool.region}</Text>
          <Text style={s.toolMeta}>Expected participants: {tool.participantsExpected}</Text>
          {tool.scheduledDate && (
            <Text style={s.toolMeta}>Scheduled: {tool.scheduledDate}</Text>
          )}
          <TouchableOpacity style={s.joinBtn} onPress={() => handleRequestDialogue(tool)}>
            <Text style={s.joinBtnText}>
              {tool.status === 'available' ? 'Request This Tool' : 'Join Session'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Ambassadors Tab ───

  const renderAmbassadors = () => (
    <>
      <Text style={s.sectionTitle}>Peace Ambassadors</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Trained community members dedicated to de-escalation and conflict resolution.
      </Text>

      {DEMO_AMBASSADORS.map((amb) => (
        <View key={amb.id} style={s.ambassadorCard}>
          <Text style={s.ambassadorName}>{amb.name}</Text>
          <Text style={s.ambassadorSpec}>{amb.specialization}</Text>
          <Text style={s.ambassadorBio}>{amb.bio}</Text>
          <Text style={s.ambassadorMeta}>Region: {amb.region}</Text>
          <Text style={s.ambassadorMeta}>Certified since: {amb.certifiedSince}</Text>

          <View style={s.langRow}>
            {amb.languages.map((lang, i) => (
              <View key={i} style={s.langChip}>
                <Text style={s.langText}>{lang}</Text>
              </View>
            ))}
          </View>

          <View style={s.statRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{amb.interventions}</Text>
              <Text style={s.statLabel}>Interventions</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{amb.successRate}%</Text>
              <Text style={s.statLabel}>Success Rate</Text>
            </View>
          </View>

          <View style={[s.availBadge, { backgroundColor: amb.available ? t.accent.green + '20' : t.accent.orange + '20' }]}>
            <Text style={{ color: amb.available ? t.accent.green : t.accent.orange, fontSize: 11, fontWeight: fonts.bold }}>
              {amb.available ? 'AVAILABLE' : 'BUSY'}
            </Text>
          </View>

          {amb.available && (
            <TouchableOpacity style={s.contactBtn} onPress={() => handleContactAmbassador(amb)}>
              <Text style={s.contactBtnText}>Contact Ambassador</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <Text style={s.note}>
        Peace ambassadors earn pOTK (peace OTK) for every successful intervention. Become an ambassador by completing the de-escalation certification program.
      </Text>
    </>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Intervention History</Text>
      <Text style={[s.note, { marginTop: 0, marginBottom: 16 }]}>
        Past conflict preventions and their outcomes — evidence that early intervention works.
      </Text>

      {DEMO_HISTORY.map((rec) => (
        <View key={rec.id} style={s.historyCard}>
          <Text style={s.historyTitle}>{rec.title}</Text>
          <Text style={s.historyMeta}>{rec.region} | {rec.date} | {rec.type}</Text>
          <Text style={s.historyMeta}>Ambassador: {rec.ambassadorName} | {rec.participantCount} participants</Text>
          <Text style={s.historySummary}>{rec.summary}</Text>

          <View style={s.tensionChange}>
            <Text style={s.tensionLabel}>Tension:</Text>
            <View style={[s.levelBadge, { backgroundColor: levelColor(rec.tensionBefore) + '20' }]}>
              <Text style={[s.levelText, { color: levelColor(rec.tensionBefore) }]}>{rec.tensionBefore}</Text>
            </View>
            <Text style={{ color: t.text.muted, fontSize: 14 }}>{'\u2192'}</Text>
            <View style={[s.levelBadge, { backgroundColor: levelColor(rec.tensionAfter) + '20' }]}>
              <Text style={[s.levelText, { color: levelColor(rec.tensionAfter) }]}>{rec.tensionAfter}</Text>
            </View>
          </View>

          <View style={[s.outcomeBadge, { backgroundColor: outcomeColor(rec.outcome) + '20' }]}>
            <Text style={[s.outcomeText, { color: outcomeColor(rec.outcome) }]}>
              {outcomeLabel(rec.outcome)}
            </Text>
          </View>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold }}>
          {DEMO_HISTORY.filter((h) => h.outcome === 'resolved').length} Resolved | {DEMO_HISTORY.filter((h) => h.outcome === 'de_escalated').length} De-escalated
        </Text>
        <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4 }}>
          Total participants across all interventions: {DEMO_HISTORY.reduce((sum, h) => sum + h.participantCount, 0)}
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
        <Text style={s.title}>Conflict Prevention</Text>
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
        {tab === 'indicators' && renderIndicators()}
        {tab === 'prevention' && renderPrevention()}
        {tab === 'ambassadors' && renderAmbassadors()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
