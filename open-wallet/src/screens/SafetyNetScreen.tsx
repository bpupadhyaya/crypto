import { fonts } from '../utils/theme';
/**
 * SafetyNet — Art I: Community Safety & Mutual Aid
 *
 * "A safe community is the foundation of human flourishing."
 *
 * Community safety monitoring, neighborhood watch, and mutual aid —
 * because safety is a collective responsibility, not just a police function.
 *
 * Features:
 * - Community safety score (0-100) across crime, responsiveness, trust, infrastructure
 * - Safety alerts — community-reported incidents
 * - Neighborhood watch — registered watchers and patrol schedules
 * - Check-in system — regular check-ins for vulnerable members
 * - Mutual aid network — request and offer help
 * - Safety resources — emergency numbers, safe spaces, shelters
 * - Incident map (text-based recent reports with locations)
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

type TabKey = 'dashboard' | 'alerts' | 'watch' | 'mutual-aid';

interface SafetyScore {
  overall: number;
  crime: number;
  responsiveness: number;
  trust: number;
  infrastructure: number;
}

interface SafetyAlert {
  id: string;
  type: 'theft' | 'hazard' | 'missing_person' | 'suspicious_activity';
  title: string;
  location: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
  reportedBy: string;
}

interface Watcher {
  id: string;
  name: string;
  zone: string;
  patrolSchedule: string;
  active: boolean;
  yearsActive: number;
}

interface CheckIn {
  id: string;
  name: string;
  category: 'elderly' | 'disabled' | 'child' | 'other';
  lastCheckIn: string;
  status: 'ok' | 'overdue' | 'needs_help';
  assignedWatcher: string;
}

interface MutualAidRequest {
  id: string;
  type: 'rides' | 'food' | 'childcare' | 'companionship' | 'repair' | 'medical';
  title: string;
  requestedBy: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'claimed' | 'fulfilled';
  claimedBy?: string;
  postedTime: string;
}

interface SafetyResource {
  name: string;
  type: 'emergency' | 'safe_space' | 'shelter' | 'hotline';
  contact: string;
  address?: string;
  available: string;
}

interface IncidentReport {
  id: string;
  type: string;
  description: string;
  location: string;
  time: string;
}

const ALERT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  theft: { label: 'Theft', icon: '\u{1F6A8}' },
  hazard: { label: 'Hazard', icon: '\u26A0\uFE0F' },
  missing_person: { label: 'Missing Person', icon: '\u{1F50D}' },
  suspicious_activity: { label: 'Suspicious', icon: '\u{1F441}' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const AID_TYPE_ICONS: Record<string, string> = {
  rides: '\u{1F697}',
  food: '\u{1F35E}',
  childcare: '\u{1F476}',
  companionship: '\u{1F91D}',
  repair: '\u{1F527}',
  medical: '\u{1FA7A}',
};

const CHECK_STATUS_COLORS: Record<string, string> = {
  ok: '#22c55e',
  overdue: '#eab308',
  needs_help: '#ef4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  elderly: '\u{1F9D3}',
  disabled: '\u267F',
  child: '\u{1F9D2}',
  other: '\u{1F9D1}',
};

// --- Demo Data ---

const DEMO_SCORE: SafetyScore = {
  overall: 78,
  crime: 72,
  responsiveness: 85,
  trust: 81,
  infrastructure: 74,
};

const DEMO_ALERTS: SafetyAlert[] = [
  {
    id: 'a1', type: 'theft', title: 'Package theft on Elm Street',
    location: '200 block Elm St', time: '2 hours ago', severity: 'medium',
    status: 'active', reportedBy: 'Neighbor Watch #7',
  },
  {
    id: 'a2', type: 'hazard', title: 'Fallen tree blocking sidewalk',
    location: 'Oak Park trail entrance', time: '5 hours ago', severity: 'low',
    status: 'active', reportedBy: 'Community Member',
  },
  {
    id: 'a3', type: 'suspicious_activity', title: 'Unfamiliar vehicle circling block',
    location: 'Maple Ave & 3rd St', time: '1 day ago', severity: 'medium',
    status: 'resolved', reportedBy: 'Watcher Martinez',
  },
];

const DEMO_WATCHERS: Watcher[] = [
  { id: 'w1', name: 'Sarah Chen', zone: 'North District', patrolSchedule: 'Mon/Wed/Fri 6-8 PM', active: true, yearsActive: 3 },
  { id: 'w2', name: 'Marcus Johnson', zone: 'East Side', patrolSchedule: 'Tue/Thu 7-9 PM', active: true, yearsActive: 5 },
  { id: 'w3', name: 'Rosa Martinez', zone: 'Downtown', patrolSchedule: 'Sat/Sun 10 AM-12 PM', active: true, yearsActive: 2 },
  { id: 'w4', name: 'David Park', zone: 'West End', patrolSchedule: 'Mon/Wed 5-7 PM', active: false, yearsActive: 1 },
];

const DEMO_CHECKINS: CheckIn[] = [
  { id: 'c1', name: 'Mrs. Eleanor Voss', category: 'elderly', lastCheckIn: 'Today, 9 AM', status: 'ok', assignedWatcher: 'Sarah Chen' },
  { id: 'c2', name: 'James Whitfield', category: 'disabled', lastCheckIn: 'Yesterday, 3 PM', status: 'ok', assignedWatcher: 'Marcus Johnson' },
  { id: 'c3', name: 'Maria Santos', category: 'elderly', lastCheckIn: '3 days ago', status: 'overdue', assignedWatcher: 'Rosa Martinez' },
  { id: 'c4', name: 'Tommy Liu', category: 'child', lastCheckIn: 'Today, 8 AM', status: 'ok', assignedWatcher: 'Sarah Chen' },
];

const DEMO_AID_REQUESTS: MutualAidRequest[] = [
  {
    id: 'm1', type: 'rides', title: 'Ride to medical appointment',
    requestedBy: 'Mrs. Voss', location: 'North District', urgency: 'high',
    status: 'open', postedTime: '3 hours ago',
  },
  {
    id: 'm2', type: 'food', title: 'Groceries for homebound family',
    requestedBy: 'Community Coordinator', location: 'East Side', urgency: 'medium',
    status: 'claimed', claimedBy: 'Marcus Johnson', postedTime: '1 day ago',
  },
  {
    id: 'm3', type: 'childcare', title: 'After-school supervision needed',
    requestedBy: 'Lin Family', location: 'West End', urgency: 'low',
    status: 'open', postedTime: '2 days ago',
  },
  {
    id: 'm4', type: 'companionship', title: 'Weekly visit for elderly neighbor',
    requestedBy: 'Sarah Chen', location: 'North District', urgency: 'low',
    status: 'fulfilled', claimedBy: 'Community Volunteer', postedTime: '5 days ago',
  },
];

const DEMO_RESOURCES: SafetyResource[] = [
  { name: 'Emergency Services', type: 'emergency', contact: '911', available: '24/7' },
  { name: 'Community Safety Hotline', type: 'hotline', contact: '555-SAFE', available: '6 AM - 11 PM' },
  { name: 'Neighborhood Safe House', type: 'safe_space', contact: '555-0142', address: '45 Community Center Rd', available: '24/7' },
  { name: 'Winter Shelter', type: 'shelter', contact: '555-0199', address: '120 Warmth Ave', available: 'Nov - Mar, 6 PM - 8 AM' },
  { name: 'Crisis Support Line', type: 'hotline', contact: '988', available: '24/7' },
];

const DEMO_INCIDENTS: IncidentReport[] = [
  { id: 'i1', type: 'Theft', description: 'Package stolen from porch', location: '200 Elm St', time: '2 hours ago' },
  { id: 'i2', type: 'Hazard', description: 'Fallen tree on sidewalk', location: 'Oak Park Trail', time: '5 hours ago' },
  { id: 'i3', type: 'Noise', description: 'Loud construction after hours', location: '88 Main St', time: '8 hours ago' },
  { id: 'i4', type: 'Vehicle', description: 'Unfamiliar car circling block', location: 'Maple Ave & 3rd', time: '1 day ago' },
  { id: 'i5', type: 'Vandalism', description: 'Graffiti on community mural', location: 'Central Park Wall', time: '2 days ago' },
];

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'watch', label: 'Watch' },
  { key: 'mutual-aid', label: 'Mutual Aid' },
];

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function SafetyNetScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

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
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    // Score
    scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
    scoreNum: { fontSize: 32, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    scoreRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    scorePill: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 12, alignItems: 'center' },
    scorePillNum: { fontSize: 18, fontWeight: fonts.heavy, marginBottom: 2 },
    scorePillLabel: { color: t.text.muted, fontSize: 9, fontWeight: fonts.semibold, textAlign: 'center' },
    barBg: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    // Alerts
    alertCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
    alertTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    alertMeta: { color: t.text.muted, fontSize: 11 },
    alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
    alertBadgeText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold },
    resolvedTag: { backgroundColor: t.bg.card, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#22c55e' },
    resolvedText: { color: '#22c55e', fontSize: 10, fontWeight: fonts.semibold },
    // Watch
    watcherCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    watcherName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    watcherZone: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    watcherSchedule: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    activeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    // Check-ins
    checkinCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 8 },
    checkinName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    checkinStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    checkinStatusText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold },
    // Mutual Aid
    aidCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
    aidTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    aidMeta: { color: t.text.muted, fontSize: 11 },
    aidStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    aidStatusText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold },
    claimBtn: { backgroundColor: t.accent.blue, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', marginTop: 8 },
    claimBtnText: { color: '#fff', fontSize: 12, fontWeight: fonts.bold },
    // Resources
    resourceCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 8 },
    resourceName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    resourceContact: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold },
    resourceMeta: { color: t.text.muted, fontSize: 11 },
    // Incident list
    incidentRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border },
    incidentType: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, width: 70 },
    incidentDesc: { color: t.text.primary, fontSize: 12, flex: 1 },
    incidentLoc: { color: t.text.muted, fontSize: 11 },
    // Summary cards
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
  }), [t]);

  const score = demoMode ? DEMO_SCORE : { overall: 0, crime: 0, responsiveness: 0, trust: 0, infrastructure: 0 };
  const alerts = demoMode ? DEMO_ALERTS : [];
  const watchers = demoMode ? DEMO_WATCHERS : [];
  const checkins = demoMode ? DEMO_CHECKINS : [];
  const aidRequests = demoMode ? DEMO_AID_REQUESTS : [];
  const resources = demoMode ? DEMO_RESOURCES : [];
  const incidents = demoMode ? DEMO_INCIDENTS : [];

  const activeAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);
  const activeWatchers = useMemo(() => watchers.filter(w => w.active), [watchers]);
  const openAid = useMemo(() => aidRequests.filter(r => r.status === 'open'), [aidRequests]);
  const overdueCheckins = useMemo(() => checkins.filter(c => c.status === 'overdue' || c.status === 'needs_help'), [checkins]);

  // --- Tab renderers ---

  const renderDashboard = () => (
    <>
      {/* Safety Score */}
      <View style={[st.scoreCircle, { borderColor: scoreColor(score.overall) }]}>
        <Text style={[st.scoreNum, { color: scoreColor(score.overall) }]}>{score.overall}</Text>
        <Text style={st.scoreLabel}>SAFETY</Text>
      </View>

      <View style={st.scoreRow}>
        {([
          { key: 'crime' as const, label: 'Crime' },
          { key: 'responsiveness' as const, label: 'Response' },
          { key: 'trust' as const, label: 'Trust' },
          { key: 'infrastructure' as const, label: 'Infra' },
        ]).map(item => (
          <View key={item.key} style={st.scorePill}>
            <Text style={[st.scorePillNum, { color: scoreColor(score[item.key]) }]}>{score[item.key]}</Text>
            <Text style={st.scorePillLabel}>{item.label}</Text>
            <View style={st.barBg}>
              <View style={[st.barFill, { width: `${score[item.key]}%`, backgroundColor: scoreColor(score[item.key]) }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: activeAlerts.length > 0 ? '#ef4444' : '#22c55e' }]}>
            {activeAlerts.length}
          </Text>
          <Text style={st.summaryLabel}>Active Alerts</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{activeWatchers.length}</Text>
          <Text style={st.summaryLabel}>Watchers On Duty</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: openAid.length > 0 ? '#eab308' : '#22c55e' }]}>
            {openAid.length}
          </Text>
          <Text style={st.summaryLabel}>Aid Requests</Text>
        </View>
      </View>

      {/* Overdue Check-ins */}
      {overdueCheckins.length > 0 && (
        <>
          <Text style={st.section}>{'\u26A0\uFE0F'} Overdue Check-ins</Text>
          {overdueCheckins.map(c => (
            <View key={c.id} style={st.checkinCard}>
              <View style={st.row}>
                <Text style={st.checkinName}>{CATEGORY_ICONS[c.category]} {c.name}</Text>
                <View style={[st.checkinStatus, { backgroundColor: CHECK_STATUS_COLORS[c.status] }]}>
                  <Text style={st.checkinStatusText}>{c.status === 'overdue' ? 'OVERDUE' : 'NEEDS HELP'}</Text>
                </View>
              </View>
              <Text style={st.alertMeta}>Last: {c.lastCheckIn} | Watcher: {c.assignedWatcher}</Text>
            </View>
          ))}
        </>
      )}

      {/* Recent Incidents Map (text-based) */}
      <Text style={st.section}>{'\u{1F4CD}'} Recent Incident Reports</Text>
      <View style={st.card}>
        {incidents.map((inc, i) => (
          <View key={inc.id} style={[st.incidentRow, i === incidents.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={st.incidentType}>{inc.type}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.incidentDesc}>{inc.description}</Text>
              <Text style={st.incidentLoc}>{inc.location} · {inc.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Safety Resources */}
      <Text style={st.section}>{'\u{1F6E1}\uFE0F'} Safety Resources</Text>
      {resources.map((res, i) => (
        <View key={i} style={st.resourceCard}>
          <View style={st.row}>
            <Text style={st.resourceName}>{res.name}</Text>
            <Text style={st.resourceContact}>{res.contact}</Text>
          </View>
          <Text style={st.resourceMeta}>
            {res.address ? `${res.address} · ` : ''}{res.available}
          </Text>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </>
  );

  const renderAlerts = () => (
    <>
      <Text style={st.section}>{'\u{1F6A8}'} Community Safety Alerts</Text>
      {alerts.length === 0 ? (
        <Text style={st.empty}>No alerts reported. Your community is safe!</Text>
      ) : (
        alerts.map(alert => (
          <View key={alert.id} style={[st.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={[st.alertBadge, { backgroundColor: SEVERITY_COLORS[alert.severity] }]}>
                <Text style={st.alertBadgeText}>
                  {ALERT_TYPE_LABELS[alert.type]?.icon} {ALERT_TYPE_LABELS[alert.type]?.label} · {alert.severity.toUpperCase()}
                </Text>
              </View>
              {alert.status === 'resolved' && (
                <View style={st.resolvedTag}>
                  <Text style={st.resolvedText}>Resolved</Text>
                </View>
              )}
            </View>
            <Text style={st.alertTitle}>{alert.title}</Text>
            <Text style={st.alertMeta}>{alert.location} · {alert.time}</Text>
            <Text style={st.alertMeta}>Reported by: {alert.reportedBy}</Text>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </>
  );

  const renderWatch = () => (
    <>
      {/* Watchers */}
      <Text style={st.section}>{'\u{1F441}'} Neighborhood Watchers</Text>
      {watchers.length === 0 ? (
        <Text style={st.empty}>No watchers registered yet. Be the first!</Text>
      ) : (
        watchers.map(w => (
          <View key={w.id} style={st.watcherCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={[st.activeDot, { backgroundColor: w.active ? '#22c55e' : '#6b7280' }]} />
              <Text style={st.watcherName}>{w.name}</Text>
            </View>
            <Text style={st.watcherZone}>{w.zone}</Text>
            <Text style={st.watcherSchedule}>Patrol: {w.patrolSchedule}</Text>
            <Text style={st.alertMeta}>{w.yearsActive} year{w.yearsActive !== 1 ? 's' : ''} active</Text>
          </View>
        ))
      )}

      {/* Check-in System */}
      <Text style={st.section}>{'\u2705'} Community Check-ins</Text>
      {checkins.length === 0 ? (
        <Text style={st.empty}>No check-ins scheduled.</Text>
      ) : (
        checkins.map(c => (
          <View key={c.id} style={st.checkinCard}>
            <View style={st.row}>
              <Text style={st.checkinName}>{CATEGORY_ICONS[c.category]} {c.name}</Text>
              <View style={[st.checkinStatus, { backgroundColor: CHECK_STATUS_COLORS[c.status] }]}>
                <Text style={st.checkinStatusText}>
                  {c.status === 'ok' ? 'OK' : c.status === 'overdue' ? 'OVERDUE' : 'NEEDS HELP'}
                </Text>
              </View>
            </View>
            <Text style={st.alertMeta}>Last check-in: {c.lastCheckIn}</Text>
            <Text style={st.alertMeta}>Assigned to: {c.assignedWatcher}</Text>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </>
  );

  const renderMutualAid = () => {
    const statusColors: Record<string, string> = {
      open: '#eab308',
      claimed: t.accent.blue,
      fulfilled: '#22c55e',
    };
    const statusLabels: Record<string, string> = {
      open: 'OPEN',
      claimed: 'CLAIMED',
      fulfilled: 'FULFILLED',
    };

    return (
      <>
        <Text style={st.section}>{'\u{1F91D}'} Mutual Aid Network</Text>

        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#eab308' }]}>{openAid.length}</Text>
            <Text style={st.summaryLabel}>Open Requests</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.blue }]}>
              {aidRequests.filter(r => r.status === 'claimed').length}
            </Text>
            <Text style={st.summaryLabel}>In Progress</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#22c55e' }]}>
              {aidRequests.filter(r => r.status === 'fulfilled').length}
            </Text>
            <Text style={st.summaryLabel}>Fulfilled</Text>
          </View>
        </View>

        {aidRequests.length === 0 ? (
          <Text style={st.empty}>No mutual aid requests. Community is self-sufficient!</Text>
        ) : (
          aidRequests.map(req => (
            <View key={req.id} style={[st.aidCard, { borderLeftColor: URGENCY_COLORS[req.urgency] }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={st.aidTitle}>{AID_TYPE_ICONS[req.type] || '\u{1F4E6}'} {req.title}</Text>
                <View style={[st.aidStatusBadge, { backgroundColor: statusColors[req.status] }]}>
                  <Text style={st.aidStatusText}>{statusLabels[req.status]}</Text>
                </View>
              </View>
              <Text style={st.aidMeta}>Requested by: {req.requestedBy}</Text>
              <Text style={st.aidMeta}>{req.location} · {req.postedTime}</Text>
              {req.claimedBy && (
                <Text style={st.aidMeta}>Helping: {req.claimedBy}</Text>
              )}
              {req.status === 'open' && (
                <TouchableOpacity style={st.claimBtn} activeOpacity={0.7}>
                  <Text style={st.claimBtnText}>Volunteer to Help</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </>
    );
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>SafetyNet</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Community safety monitoring, neighborhood watch, and mutual aid.
          Safety is a collective responsibility — we look out for each other.
        </Text>

        {/* Tabs */}
        <View style={st.tabRow}>
          {TAB_CONFIG.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[st.tab, activeTab === tab.key && st.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[st.tabText, activeTab === tab.key && st.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!demoMode ? (
          <Text style={st.empty}>Enable demo mode to see sample safety data.</Text>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'watch' && renderWatch()}
            {activeTab === 'mutual-aid' && renderMutualAid()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
