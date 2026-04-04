import { fonts } from '../utils/theme';
/**
 * Disaster Response Screen — Coordinate disaster relief via The Human Constitution.
 *
 * Article I (hOTK): "When disaster strikes, the chain of human value
 *  activates — resources flow to those in need, responders are recognized,
 *  and recovery is tracked transparently on-chain."
 *
 * Features:
 * - Active disaster alerts (flood, earthquake, storm, fire, pandemic)
 * - Relief coordination (volunteer, donate OTK, offer shelter/food/medical)
 * - Resource needs board (needed vs offered, gap analysis)
 * - Emergency fund pools (per disaster, crowdfunded)
 * - Responder check-in (mark safe, report status)
 * - Recovery tracking (emergency → relief → recovery → rebuild)
 * - Historical disasters with impact metrics
 * - Demo data: 2 active alerts, 3 historical events
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface Props {
  onClose: () => void;
}

type Tab = 'alerts' | 'respond' | 'resources' | 'history';

type DisasterType = 'flood' | 'earthquake' | 'storm' | 'fire' | 'pandemic';
type RecoveryPhase = 'emergency' | 'relief' | 'recovery' | 'rebuild' | 'resolved';
type AlertSeverity = 'critical' | 'severe' | 'moderate';

interface DisasterAlert {
  id: string;
  type: DisasterType;
  name: string;
  location: string;
  severity: AlertSeverity;
  phase: RecoveryPhase;
  startDate: string;
  affectedPeople: number;
  responders: number;
  fundPool: number;
  fundGoal: number;
  safeCheckins: number;
  needsHelp: number;
  description: string;
}

interface ResourceNeed {
  id: string;
  disasterId: string;
  category: string;
  item: string;
  quantityNeeded: number;
  quantityOffered: number;
  unit: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface HistoricalDisaster {
  id: string;
  type: DisasterType;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  affectedPeople: number;
  totalResponders: number;
  totalFundRaised: number;
  totalOTKDistributed: number;
  recoveryDays: number;
  livesHelped: number;
}

type ReliefAction = 'volunteer' | 'donate' | 'shelter' | 'food' | 'medical';

// ─── Constants ───

const DISASTER_ICONS: Record<DisasterType, string> = {
  flood: '!F',
  earthquake: '!E',
  storm: '!S',
  fire: '!R',
  pandemic: '!P',
};

const DISASTER_COLORS: Record<DisasterType, string> = {
  flood: '#3b82f6',
  earthquake: '#f59e0b',
  storm: '#8b5cf6',
  fire: '#ef4444',
  pandemic: '#22c55e',
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#ef4444',
  severe: '#f59e0b',
  moderate: '#3b82f6',
};

const PHASE_LABELS: Record<RecoveryPhase, string> = {
  emergency: 'EMERGENCY',
  relief: 'RELIEF',
  recovery: 'RECOVERY',
  rebuild: 'REBUILD',
  resolved: 'RESOLVED',
};

const PHASE_COLORS: Record<RecoveryPhase, string> = {
  emergency: '#ef4444',
  relief: '#f59e0b',
  recovery: '#3b82f6',
  rebuild: '#22c55e',
  resolved: '#8E8E93',
};

const PHASE_ORDER: RecoveryPhase[] = ['emergency', 'relief', 'recovery', 'rebuild', 'resolved'];

const RELIEF_ACTIONS: { key: ReliefAction; label: string; icon: string; desc: string }[] = [
  { key: 'volunteer', label: 'Volunteer', icon: 'V', desc: 'Join rescue and aid teams on the ground' },
  { key: 'donate', label: 'Donate OTK', icon: '$', desc: 'Contribute to the emergency fund pool' },
  { key: 'shelter', label: 'Offer Shelter', icon: 'H', desc: 'Open your home to displaced families' },
  { key: 'food', label: 'Provide Food', icon: 'F', desc: 'Donate meals or food supplies' },
  { key: 'medical', label: 'Medical Aid', icon: '+', desc: 'Provide medical supplies or expertise' },
];

const URGENCY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
};

// ─── Demo Data ───

const DEMO_ACTIVE_ALERTS: DisasterAlert[] = [
  {
    id: 'da1',
    type: 'flood',
    name: 'Coastal Flooding — Bay Region',
    location: 'Bay Area, Pacific Coast',
    severity: 'critical',
    phase: 'emergency',
    startDate: '2026-03-26',
    affectedPeople: 45000,
    responders: 1280,
    fundPool: 234500,
    fundGoal: 500000,
    safeCheckins: 31200,
    needsHelp: 4800,
    description: 'Severe coastal flooding after 3 days of heavy rain. Multiple neighborhoods evacuated. Dam overflow risk elevated.',
  },
  {
    id: 'da2',
    type: 'earthquake',
    name: 'Highland Earthquake M6.2',
    location: 'Highland Province, Central Region',
    severity: 'severe',
    phase: 'relief',
    startDate: '2026-03-22',
    affectedPeople: 18000,
    responders: 640,
    fundPool: 178200,
    fundGoal: 300000,
    safeCheckins: 15400,
    needsHelp: 1200,
    description: 'Magnitude 6.2 earthquake centered 12km NW of Highland City. Structural damage to older buildings. Aftershocks continuing.',
  },
];

const DEMO_RESOURCE_NEEDS: ResourceNeed[] = [
  { id: 'r1', disasterId: 'da1', category: 'Shelter', item: 'Emergency tents', quantityNeeded: 500, quantityOffered: 180, unit: 'units', urgency: 'critical' },
  { id: 'r2', disasterId: 'da1', category: 'Food', item: 'MRE packs', quantityNeeded: 10000, quantityOffered: 6200, unit: 'packs', urgency: 'high' },
  { id: 'r3', disasterId: 'da1', category: 'Medical', item: 'First aid kits', quantityNeeded: 800, quantityOffered: 450, unit: 'kits', urgency: 'high' },
  { id: 'r4', disasterId: 'da1', category: 'Transport', item: 'Rescue boats', quantityNeeded: 50, quantityOffered: 22, unit: 'boats', urgency: 'critical' },
  { id: 'r5', disasterId: 'da1', category: 'Clothing', item: 'Blankets', quantityNeeded: 3000, quantityOffered: 2800, unit: 'units', urgency: 'medium' },
  { id: 'r6', disasterId: 'da2', category: 'Shelter', item: 'Temporary housing', quantityNeeded: 200, quantityOffered: 120, unit: 'units', urgency: 'high' },
  { id: 'r7', disasterId: 'da2', category: 'Medical', item: 'Surgical supplies', quantityNeeded: 300, quantityOffered: 280, unit: 'kits', urgency: 'medium' },
  { id: 'r8', disasterId: 'da2', category: 'Infrastructure', item: 'Structural engineers', quantityNeeded: 40, quantityOffered: 12, unit: 'personnel', urgency: 'critical' },
];

const DEMO_HISTORICAL: HistoricalDisaster[] = [
  {
    id: 'dh1',
    type: 'storm',
    name: 'Typhoon Mara',
    location: 'Island Province, South Coast',
    startDate: '2025-11-10',
    endDate: '2025-12-28',
    affectedPeople: 120000,
    totalResponders: 4500,
    totalFundRaised: 1250000,
    totalOTKDistributed: 890000,
    recoveryDays: 48,
    livesHelped: 98000,
  },
  {
    id: 'dh2',
    type: 'fire',
    name: 'Northern Wildfire Complex',
    location: 'Northern Forest Region',
    startDate: '2025-08-15',
    endDate: '2025-09-22',
    affectedPeople: 35000,
    totalResponders: 2100,
    totalFundRaised: 680000,
    totalOTKDistributed: 520000,
    recoveryDays: 38,
    livesHelped: 32000,
  },
  {
    id: 'dh3',
    type: 'pandemic',
    name: 'Regional Flu Outbreak',
    location: 'Metro Region',
    startDate: '2025-01-05',
    endDate: '2025-03-15',
    affectedPeople: 250000,
    totalResponders: 8200,
    totalFundRaised: 2100000,
    totalOTKDistributed: 1750000,
    recoveryDays: 69,
    livesHelped: 220000,
  },
];

// ─── Component ───

export function DisasterResponseScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ReliefAction | null>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [safeStatus, setSafeStatus] = useState<Record<string, boolean>>({});
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const activeAlerts = DEMO_ACTIVE_ALERTS;
  const resourceNeeds = DEMO_RESOURCE_NEEDS;
  const historicalDisasters = DEMO_HISTORICAL;

  const filteredResources = useMemo(() => {
    if (resourceFilter === 'all') return resourceNeeds;
    return resourceNeeds.filter(r => r.disasterId === resourceFilter);
  }, [resourceFilter, resourceNeeds]);

  const handleMarkSafe = useCallback((disasterId: string) => {
    setSafeStatus(prev => ({ ...prev, [disasterId]: true }));
    Alert.alert('Checked In', 'You have been marked as SAFE. Your status is visible to your community.');
  }, []);

  const handleReportNeedHelp = useCallback((disasterId: string) => {
    Alert.alert(
      'Help Request Sent',
      'Your location and status have been shared with nearby responders. Help is on the way.',
    );
  }, []);

  const handleRelief = useCallback((action: ReliefAction, disasterId: string) => {
    if (action === 'donate') {
      const amt = parseInt(donateAmount, 10);
      if (!amt || amt <= 0) {
        Alert.alert('Invalid Amount', 'Enter a valid OTK amount to donate.');
        return;
      }
      Alert.alert(
        'Donation Recorded',
        `${amt.toLocaleString()} OTK donated to the emergency fund.\n\nhOTK earned: ${Math.floor(amt * 1.5)}\nThank you for your generosity.`,
      );
      setDonateAmount('');
    } else if (action === 'volunteer') {
      Alert.alert('Volunteer Registered', 'You have been added to the responder roster. Check your messages for deployment instructions.');
    } else if (action === 'shelter') {
      Alert.alert('Shelter Offer Recorded', 'Your shelter offer is now visible to displaced families in the affected area. Coordination team will follow up.');
    } else if (action === 'food') {
      Alert.alert('Food Donation Logged', 'Your food contribution has been logged. A pickup or drop-off location will be assigned shortly.');
    } else if (action === 'medical') {
      Alert.alert('Medical Aid Registered', 'Your medical expertise/supplies offer has been shared with the medical coordination unit.');
    }
    setSelectedAction(null);
  }, [donateAmount]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: '#ef4444' + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#ef4444' },
    // Hero
    heroCard: { backgroundColor: '#ef4444' + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center', marginBottom: 16 },
    heroIcon: { fontSize: 40, fontWeight: fonts.heavy, color: '#ef4444', marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    // Cards
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardTitleRow: { flex: 1, marginRight: 8 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    cardLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    severityText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    cardDescription: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginBottom: 12 },
    // Stats row
    statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    statBox: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, minWidth: 80, alignItems: 'center', flex: 1 },
    statValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textTransform: 'uppercase', textAlign: 'center' },
    // Fund bar
    fundBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
    fundFill: { height: 8, borderRadius: 4 },
    fundLabel: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    // Phase tracker
    phaseRow: { flexDirection: 'row', gap: 4, marginTop: 12 },
    phaseStep: { flex: 1, height: 6, borderRadius: 3 },
    phaseLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    // Check-in
    checkinRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    safeBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    safeBtnDone: { flex: 1, backgroundColor: '#22c55e' + '30', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    helpBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    checkinText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    checkinTextDone: { color: '#22c55e', fontSize: fonts.md, fontWeight: fonts.bold },
    // Section
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    sectionSubtitle: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 16, marginHorizontal: 20, lineHeight: 18 },
    // Relief actions
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
    actionChip: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, alignItems: 'center', minWidth: 90, flex: 1 },
    actionChipActive: { backgroundColor: '#ef4444' },
    actionIcon: { fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 4 },
    actionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    actionLabelActive: { color: '#fff' },
    actionDesc: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 2 },
    // Selected action form
    actionForm: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    actionFormTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 12 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Resource needs
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: t.bg.secondary },
    filterChipActive: { backgroundColor: '#ef4444' + '20' },
    filterText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: '#ef4444' },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    resourceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    resourceItem: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    urgencyText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    resourceCategory: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 6 },
    resourceBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
    resourceFill: { height: 6, borderRadius: 3 },
    resourceNumbers: { flexDirection: 'row', justifyContent: 'space-between' },
    resourceNumText: { color: t.text.muted, fontSize: fonts.xs },
    gapText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    // History
    historyCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    historyType: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    historyTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    historyTypeText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    historyName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    historyLocation: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    historyDates: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 },
    historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    historyStatBox: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, minWidth: 80, flex: 1, alignItems: 'center' },
    historyStatValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.heavy },
    historyStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    // Disaster selector
    disasterSelector: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    disasterChip: { flex: 1, backgroundColor: t.bg.secondary, borderRadius: 12, padding: 12, alignItems: 'center' },
    disasterChipActive: { borderWidth: 2, borderColor: '#ef4444' },
    disasterChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4, textAlign: 'center' },
    disasterChipTextActive: { color: '#ef4444' },
    // Empty
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, marginHorizontal: 40 },
  }), [t]);

  const formatNum = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
    return n.toLocaleString();
  };

  // ─── Render: Alerts Tab ───

  const renderAlerts = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>!!</Text>
        <Text style={s.heroTitle}>Disaster Response Center</Text>
        <Text style={s.heroSubtitle}>
          Coordinating relief through The Human Constitution.{'\n'}
          Every responder earns hOTK. Every donor earns recognition.
        </Text>
      </View>

      {activeAlerts.map(alert => {
        const fundPercent = Math.min((alert.fundPool / alert.fundGoal) * 100, 100);
        const phaseIndex = PHASE_ORDER.indexOf(alert.phase);
        const isSafe = safeStatus[alert.id];

        return (
          <View key={alert.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>
                  {DISASTER_ICONS[alert.type]} {alert.name}
                </Text>
                <Text style={s.cardLocation}>{alert.location}</Text>
              </View>
              <View style={[s.severityBadge, { backgroundColor: SEVERITY_COLORS[alert.severity] }]}>
                <Text style={s.severityText}>{alert.severity}</Text>
              </View>
            </View>

            <Text style={s.cardDescription}>{alert.description}</Text>

            <View style={s.statRow}>
              <View style={s.statBox}>
                <Text style={s.statValue}>{formatNum(alert.affectedPeople)}</Text>
                <Text style={s.statLabel}>Affected</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statValue}>{formatNum(alert.responders)}</Text>
                <Text style={s.statLabel}>Responders</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statValue}>{formatNum(alert.safeCheckins)}</Text>
                <Text style={s.statLabel}>Safe</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: '#ef4444' }]}>{formatNum(alert.needsHelp)}</Text>
                <Text style={s.statLabel}>Need Help</Text>
              </View>
            </View>

            {/* Fund Pool */}
            <Text style={s.fundLabel}>
              Emergency Fund: {formatNum(alert.fundPool)} / {formatNum(alert.fundGoal)} OTK
            </Text>
            <View style={s.fundBar}>
              <View style={[s.fundFill, { width: `${fundPercent}%`, backgroundColor: fundPercent < 50 ? '#f59e0b' : '#22c55e' }]} />
            </View>

            {/* Recovery Phase Tracker */}
            <View style={s.phaseRow}>
              {PHASE_ORDER.slice(0, 4).map((phase, i) => (
                <View
                  key={phase}
                  style={[
                    s.phaseStep,
                    { backgroundColor: i <= phaseIndex ? PHASE_COLORS[alert.phase] : t.bg.primary },
                  ]}
                />
              ))}
            </View>
            <Text style={s.phaseLabel}>
              Phase: {PHASE_LABELS[alert.phase]}
            </Text>

            {/* Check-in */}
            <View style={s.checkinRow}>
              <TouchableOpacity
                style={isSafe ? s.safeBtnDone : s.safeBtn}
                onPress={() => !isSafe && handleMarkSafe(alert.id)}
              >
                <Text style={isSafe ? s.checkinTextDone : s.checkinText}>
                  {isSafe ? 'MARKED SAFE' : 'I AM SAFE'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.helpBtn}
                onPress={() => handleReportNeedHelp(alert.id)}
              >
                <Text style={s.checkinText}>NEED HELP</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Render: Respond Tab ───

  const renderRespond = () => (
    <>
      <Text style={s.sectionTitle}>Select Disaster</Text>
      <View style={s.disasterSelector}>
        {activeAlerts.map(alert => (
          <TouchableOpacity
            key={alert.id}
            style={[s.disasterChip, selectedAlert === alert.id && s.disasterChipActive]}
            onPress={() => setSelectedAlert(alert.id)}
          >
            <Text style={{ fontSize: fonts.xl, fontWeight: fonts.heavy, color: DISASTER_COLORS[alert.type] }}>
              {DISASTER_ICONS[alert.type]}
            </Text>
            <Text style={[s.disasterChipText, selectedAlert === alert.id && s.disasterChipTextActive]} numberOfLines={2}>
              {alert.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedAlert ? (
        <>
          <Text style={s.sectionTitle}>How Can You Help?</Text>
          <Text style={s.sectionSubtitle}>
            Choose an action below. All relief contributions are recorded on-chain and earn hOTK recognition.
          </Text>
          <View style={s.actionRow}>
            {RELIEF_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.key}
                style={[s.actionChip, selectedAction === action.key && s.actionChipActive]}
                onPress={() => setSelectedAction(selectedAction === action.key ? null : action.key)}
              >
                <Text style={[s.actionIcon, selectedAction === action.key && { color: '#fff' }]}>
                  {action.icon}
                </Text>
                <Text style={[s.actionLabel, selectedAction === action.key && s.actionLabelActive]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedAction && (
            <View style={s.actionForm}>
              <Text style={s.actionFormTitle}>
                {RELIEF_ACTIONS.find(a => a.key === selectedAction)?.desc}
              </Text>
              {selectedAction === 'donate' ? (
                <>
                  <TextInput
                    style={s.input}
                    placeholder="Amount (OTK)"
                    placeholderTextColor={t.text.muted}
                    keyboardType="numeric"
                    value={donateAmount}
                    onChangeText={setDonateAmount}
                  />
                  <TouchableOpacity
                    style={s.submitBtn}
                    onPress={() => handleRelief('donate', selectedAlert)}
                  >
                    <Text style={s.submitBtnText}>Donate to Emergency Fund</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={s.submitBtn}
                  onPress={() => handleRelief(selectedAction, selectedAlert)}
                >
                  <Text style={s.submitBtnText}>
                    {selectedAction === 'volunteer' ? 'Register as Volunteer' :
                     selectedAction === 'shelter' ? 'Offer My Shelter' :
                     selectedAction === 'food' ? 'Log Food Donation' :
                     'Register Medical Aid'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      ) : (
        <Text style={s.emptyText}>Select a disaster above to coordinate your relief response.</Text>
      )}
    </>
  );

  // ─── Render: Resources Tab ───

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Resource Needs Board</Text>
      <Text style={s.sectionSubtitle}>
        Real-time view of what is needed, what has been offered, and where the gaps remain.
      </Text>

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, resourceFilter === 'all' && s.filterChipActive]}
          onPress={() => setResourceFilter('all')}
        >
          <Text style={[s.filterText, resourceFilter === 'all' && s.filterTextActive]}>All Disasters</Text>
        </TouchableOpacity>
        {activeAlerts.map(alert => (
          <TouchableOpacity
            key={alert.id}
            style={[s.filterChip, resourceFilter === alert.id && s.filterChipActive]}
            onPress={() => setResourceFilter(alert.id)}
          >
            <Text style={[s.filterText, resourceFilter === alert.id && s.filterTextActive]}>
              {DISASTER_ICONS[alert.type]} {alert.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredResources.map(resource => {
        const fillPercent = Math.min((resource.quantityOffered / resource.quantityNeeded) * 100, 100);
        const gap = resource.quantityNeeded - resource.quantityOffered;
        const fillColor = fillPercent >= 80 ? '#22c55e' : fillPercent >= 50 ? '#f59e0b' : '#ef4444';

        return (
          <View key={resource.id} style={s.resourceCard}>
            <View style={s.resourceHeader}>
              <Text style={s.resourceItem}>{resource.item}</Text>
              <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[resource.urgency] }]}>
                <Text style={s.urgencyText}>{resource.urgency}</Text>
              </View>
            </View>
            <Text style={s.resourceCategory}>{resource.category}</Text>
            <View style={s.resourceBar}>
              <View style={[s.resourceFill, { width: `${fillPercent}%`, backgroundColor: fillColor }]} />
            </View>
            <View style={s.resourceNumbers}>
              <Text style={s.resourceNumText}>
                Offered: {resource.quantityOffered} {resource.unit}
              </Text>
              <Text style={s.resourceNumText}>
                Needed: {resource.quantityNeeded} {resource.unit}
              </Text>
            </View>
            {gap > 0 && (
              <Text style={[s.gapText, { color: fillColor, marginTop: 4 }]}>
                GAP: {gap} {resource.unit} still needed
              </Text>
            )}
          </View>
        );
      })}
    </>
  );

  // ─── Render: History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Historical Disaster Response</Text>
      <Text style={s.sectionSubtitle}>
        Past disasters and the community's collective response. Every effort is permanently recorded on-chain.
      </Text>

      {historicalDisasters.map(disaster => (
        <View key={disaster.id} style={s.historyCard}>
          <View style={s.historyType}>
            <View style={[s.historyTypeBadge, { backgroundColor: DISASTER_COLORS[disaster.type] }]}>
              <Text style={s.historyTypeText}>{disaster.type}</Text>
            </View>
            <View style={[s.historyTypeBadge, { backgroundColor: PHASE_COLORS['resolved'] }]}>
              <Text style={s.historyTypeText}>RESOLVED</Text>
            </View>
          </View>
          <Text style={s.historyName}>{disaster.name}</Text>
          <Text style={s.historyLocation}>{disaster.location}</Text>
          <Text style={s.historyDates}>
            {disaster.startDate} to {disaster.endDate} ({disaster.recoveryDays} days)
          </Text>

          <View style={s.historyGrid}>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{formatNum(disaster.affectedPeople)}</Text>
              <Text style={s.historyStatLabel}>Affected</Text>
            </View>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{formatNum(disaster.totalResponders)}</Text>
              <Text style={s.historyStatLabel}>Responders</Text>
            </View>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{formatNum(disaster.livesHelped)}</Text>
              <Text style={s.historyStatLabel}>Lives Helped</Text>
            </View>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{formatNum(disaster.totalFundRaised)}</Text>
              <Text style={s.historyStatLabel}>OTK Raised</Text>
            </View>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{formatNum(disaster.totalOTKDistributed)}</Text>
              <Text style={s.historyStatLabel}>OTK Distributed</Text>
            </View>
            <View style={s.historyStatBox}>
              <Text style={s.historyStatValue}>{disaster.recoveryDays}d</Text>
              <Text style={s.historyStatLabel}>Recovery Time</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Tabs ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'alerts', label: 'Alerts' },
    { key: 'respond', label: 'Respond' },
    { key: 'resources', label: 'Resources' },
    { key: 'history', label: 'History' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Disaster Response</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'alerts' && renderAlerts()}
        {tab === 'respond' && renderRespond()}
        {tab === 'resources' && renderResources()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
