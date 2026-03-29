/**
 * Emergency Preparedness Screen — Disaster readiness & community resilience.
 *
 * Article I: "The right to life includes the right to be prepared.
 * Community resilience begins with individual readiness."
 *
 * Features:
 * - Preparedness score (0-100: supplies, plan, training, communication)
 * - Emergency kit checklist (water, food, first aid, documents, tools)
 * - Family emergency plan (meeting points, contact chain, evacuation routes)
 * - Community drills (scheduled exercises, participation tracking)
 * - Training modules (first aid, CPR, fire safety, earthquake safety)
 * - Demo mode
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface ScoreBreakdown {
  category: string;
  score: number; // 0-100
  maxPoints: number;
  label: string;
  color: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: string;
  notes?: string;
}

interface ChecklistCategory {
  id: string;
  name: string;
  icon: string;
  items: ChecklistItem[];
}

interface MeetingPoint {
  id: string;
  name: string;
  address: string;
  type: 'primary' | 'secondary' | 'out_of_area';
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  order: number;
}

interface EvacuationRoute {
  id: string;
  name: string;
  description: string;
  destination: string;
}

interface CommunityDrill {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  registered: boolean;
}

interface TrainingModule {
  id: string;
  title: string;
  type: string;
  duration: string;
  completed: boolean;
  completedDate?: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SCORE_THRESHOLDS: Array<{ min: number; label: string; color: string }> = [
  { min: 80, label: 'Well Prepared', color: '#34C759' },
  { min: 60, label: 'Moderately Prepared', color: '#FF9500' },
  { min: 40, label: 'Needs Improvement', color: '#FF9500' },
  { min: 0, label: 'At Risk', color: '#FF3B30' },
];

// ─── Demo Data ───

const DEMO_SCORE = 62;

const DEMO_BREAKDOWN: ScoreBreakdown[] = [
  { category: 'supplies', score: 70, maxPoints: 25, label: 'Supplies', color: '#007AFF' },
  { category: 'plan', score: 55, maxPoints: 25, label: 'Emergency Plan', color: '#AF52DE' },
  { category: 'training', score: 45, maxPoints: 25, label: 'Training', color: '#FF9500' },
  { category: 'communication', score: 78, maxPoints: 25, label: 'Communication', color: '#34C759' },
];

const DEMO_CHECKLISTS: ChecklistCategory[] = [
  {
    id: 'water',
    name: 'Water & Hydration',
    icon: '\uD83D\uDCA7',
    items: [
      { id: 'w1', name: '1 gallon per person per day (3-day supply)', checked: true, quantity: '9 gallons' },
      { id: 'w2', name: 'Water purification tablets', checked: true, quantity: '50 tablets' },
      { id: 'w3', name: 'Portable water filter', checked: false },
    ],
  },
  {
    id: 'food',
    name: 'Food & Nutrition',
    icon: '\uD83C\uDF5E',
    items: [
      { id: 'f1', name: 'Non-perishable food (3-day supply)', checked: true, quantity: '3 days' },
      { id: 'f2', name: 'Manual can opener', checked: true },
      { id: 'f3', name: 'Energy bars / dried fruit', checked: true, quantity: '12 bars' },
      { id: 'f4', name: 'Baby food / special dietary items', checked: false, notes: 'Check expiration dates monthly' },
    ],
  },
  {
    id: 'medical',
    name: 'First Aid & Medical',
    icon: '\u2695\uFE0F',
    items: [
      { id: 'm1', name: 'First aid kit', checked: true },
      { id: 'm2', name: 'Prescription medications (7-day supply)', checked: false, notes: 'Rotate every 3 months' },
      { id: 'm3', name: 'N95 masks', checked: true, quantity: '10 masks' },
      { id: 'm4', name: 'Hand sanitizer', checked: true },
      { id: 'm5', name: 'Thermometer', checked: false },
    ],
  },
];

const DEMO_MEETING_POINTS: MeetingPoint[] = [
  { id: 'mp1', name: 'Front yard oak tree', address: 'Home — immediately outside', type: 'primary' },
  { id: 'mp2', name: 'Community Center parking lot', address: '100 Main St', type: 'secondary' },
  { id: 'mp3', name: 'Aunt Maria\'s house', address: '450 Elm St, Neighboring City', type: 'out_of_area' },
];

const DEMO_CONTACTS: EmergencyContact[] = [
  { id: 'c1', name: 'Partner (Alex)', role: 'Primary contact', phone: '555-0101', order: 1 },
  { id: 'c2', name: 'Neighbor (Sam)', role: 'Local backup', phone: '555-0202', order: 2 },
  { id: 'c3', name: 'Aunt Maria', role: 'Out-of-area contact', phone: '555-0303', order: 3 },
];

const DEMO_ROUTES: EvacuationRoute[] = [
  { id: 'r1', name: 'Route A — North', description: 'Main St north to Highway 1, exit at mile 12', destination: 'Regional Shelter at Fairgrounds' },
  { id: 'r2', name: 'Route B — East', description: 'Oak Ave east to Route 7, follow signs', destination: 'Neighboring City Community Center' },
];

const DEMO_DRILLS: CommunityDrill[] = [
  { id: 'd1', title: 'Earthquake Drop-Cover-Hold Drill', type: 'Earthquake', date: '2026-04-05', location: 'Community Center', participants: 42, maxParticipants: 100, registered: true },
  { id: 'd2', title: 'Neighborhood Evacuation Exercise', type: 'Evacuation', date: '2026-04-15', location: 'District 4 — Starting at Park', participants: 28, maxParticipants: 60, registered: false },
];

const DEMO_TRAINING: TrainingModule[] = [
  { id: 't1', title: 'Basic First Aid', type: 'First Aid', duration: '2 hours', completed: true, completedDate: '2026-02-10', description: 'Wound care, splints, shock management, choking response.' },
  { id: 't2', title: 'CPR & AED Certification', type: 'CPR', duration: '3 hours', completed: true, completedDate: '2026-01-15', description: 'Adult and child CPR, AED operation, rescue breathing.' },
  { id: 't3', title: 'Fire Safety & Extinguisher Use', type: 'Fire Safety', duration: '1.5 hours', completed: false, description: 'Fire types, extinguisher operation (PASS method), escape planning.' },
  { id: 't4', title: 'Earthquake Safety Fundamentals', type: 'Earthquake', duration: '1 hour', completed: false, description: 'Drop-cover-hold, securing furniture, post-quake safety assessment.' },
];

type Tab = 'score' | 'kit' | 'plan' | 'training';

export function EmergencyPrepScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('score');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const overallScore = DEMO_SCORE;
  const breakdown = DEMO_BREAKDOWN;
  const checklists = DEMO_CHECKLISTS;
  const meetingPoints = DEMO_MEETING_POINTS;
  const contacts = DEMO_CONTACTS;
  const routes = DEMO_ROUTES;
  const drills = DEMO_DRILLS;
  const training = DEMO_TRAINING;

  const scoreInfo = useMemo(() =>
    SCORE_THRESHOLDS.find((th) => overallScore >= th.min) || SCORE_THRESHOLDS[SCORE_THRESHOLDS.length - 1],
    [overallScore],
  );

  const totalChecked = useMemo(() =>
    checklists.reduce((sum, cat) => sum + cat.items.filter((i) => i.checked).length, 0),
    [checklists],
  );
  const totalItems = useMemo(() =>
    checklists.reduce((sum, cat) => sum + cat.items.length, 0),
    [checklists],
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    scoreCircle: { alignItems: 'center', marginBottom: 20 },
    scoreValue: { color: t.text.primary, fontSize: 64, fontWeight: '900' },
    scoreLabel: { fontSize: 16, fontWeight: '700', marginTop: 4 },
    scoreSubLabel: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    breakdownLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    breakdownBarOuter: { flex: 1, height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginHorizontal: 12 },
    breakdownBarInner: { height: 8, borderRadius: 4 },
    breakdownScore: { color: t.text.muted, fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },
    categoryCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryIcon: { fontSize: 20, marginRight: 10 },
    categoryName: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    categoryCount: { color: t.text.muted, fontSize: 12 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
    checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    checkMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
    checkInfo: { flex: 1 },
    checkName: { color: t.text.primary, fontSize: 14 },
    checkNameDone: { color: t.text.muted, fontSize: 14, textDecorationLine: 'line-through' },
    checkMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    planCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    planSectionTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
    meetingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    meetingType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 10 },
    meetingTypeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    meetingInfo: { flex: 1 },
    meetingName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    meetingAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    contactOrder: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    contactOrderText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    contactInfo: { flex: 1 },
    contactName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    contactRole: { color: t.text.muted, fontSize: 12, marginTop: 1 },
    contactPhone: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    routeRow: { paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    routeName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    routeDesc: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    routeDest: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 4 },
    drillCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    drillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    drillTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    drillType: { color: t.accent.orange, fontSize: 11, fontWeight: '600', marginBottom: 4 },
    drillMeta: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    drillParticipants: { color: t.text.secondary, fontSize: 12, marginBottom: 8 },
    drillProgressOuter: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginBottom: 10 },
    drillProgressInner: { height: 6, borderRadius: 3, backgroundColor: t.accent.blue },
    registerBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
    registerText: { fontSize: 13, fontWeight: '600' },
    trainingCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    trainingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    trainingTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    completedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    completedText: { fontSize: 10, fontWeight: '700' },
    trainingType: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginBottom: 4 },
    trainingDuration: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    trainingDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    trainingDate: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    startBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    startText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'score', label: 'Score' },
    { key: 'kit', label: 'Kit' },
    { key: 'plan', label: 'Plan' },
    { key: 'training', label: 'Training' },
  ];

  const meetingTypeColors: Record<string, string> = {
    primary: t.accent.green,
    secondary: t.accent.blue,
    out_of_area: t.accent.purple,
  };

  // ─── Score Tab ───

  const renderScore = () => (
    <>
      <View style={s.card}>
        <View style={s.scoreCircle}>
          <Text style={s.scoreValue}>{overallScore}</Text>
          <Text style={[s.scoreLabel, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
          <Text style={s.scoreSubLabel}>Preparedness Score out of 100</Text>
        </View>

        {breakdown.map((cat) => (
          <View key={cat.category} style={s.breakdownRow}>
            <Text style={s.breakdownLabel}>{cat.label}</Text>
            <View style={s.breakdownBarOuter}>
              <View style={[s.breakdownBarInner, { width: `${cat.score}%`, backgroundColor: cat.color }]} />
            </View>
            <Text style={s.breakdownScore}>{cat.score}%</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalChecked}/{totalItems}</Text>
            <Text style={s.statLabel}>Kit Items Ready</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{training.filter((tr) => tr.completed).length}/{training.length}</Text>
            <Text style={s.statLabel}>Training Done</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{drills.filter((d) => d.registered).length}</Text>
            <Text style={s.statLabel}>Drills Registered</Text>
          </View>
        </View>
      </View>

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          The right to life includes the right to be prepared.{'\n\n'}
          Improve your score by completing your emergency kit,{'\n'}
          finalizing your family plan, and taking training courses.{'\n\n'}
          Community resilience begins with you.
        </Text>
      </View>
    </>
  );

  // ─── Kit Tab ───

  const renderKit = () => (
    <>
      <Text style={s.sectionTitle}>Emergency Kit Checklist</Text>
      {checklists.map((cat) => {
        const catChecked = cat.items.filter((i) => i.checked).length;
        return (
          <View key={cat.id} style={s.categoryCard}>
            <View style={s.categoryHeader}>
              <Text style={s.categoryIcon}>{cat.icon}</Text>
              <Text style={s.categoryName}>{cat.name}</Text>
              <Text style={s.categoryCount}>{catChecked}/{cat.items.length}</Text>
            </View>
            {cat.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.checkRow}
                onPress={() => Alert.alert(
                  item.checked ? 'Uncheck Item' : 'Check Item',
                  `Mark "${item.name}" as ${item.checked ? 'not ready' : 'ready'}?`,
                )}
              >
                <View style={[s.checkBox, {
                  backgroundColor: item.checked ? t.accent.green : 'transparent',
                  borderColor: item.checked ? t.accent.green : t.text.muted,
                }]}>
                  {item.checked && <Text style={s.checkMark}>{'\u2713'}</Text>}
                </View>
                <View style={s.checkInfo}>
                  <Text style={item.checked ? s.checkNameDone : s.checkName}>{item.name}</Text>
                  {item.quantity && <Text style={s.checkMeta}>Qty: {item.quantity}</Text>}
                  {item.notes && <Text style={s.checkMeta}>{item.notes}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
    </>
  );

  // ─── Plan Tab ───

  const renderPlan = () => (
    <>
      {/* Meeting Points */}
      <Text style={s.sectionTitle}>Family Emergency Plan</Text>
      <View style={s.planCard}>
        <Text style={s.planSectionTitle}>Meeting Points</Text>
        {meetingPoints.map((mp) => (
          <View key={mp.id} style={s.meetingRow}>
            <View style={[s.meetingType, { backgroundColor: meetingTypeColors[mp.type] || t.text.muted }]}>
              <Text style={s.meetingTypeText}>{mp.type.replace('_', ' ')}</Text>
            </View>
            <View style={s.meetingInfo}>
              <Text style={s.meetingName}>{mp.name}</Text>
              <Text style={s.meetingAddress}>{mp.address}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Contact Chain */}
      <View style={s.planCard}>
        <Text style={s.planSectionTitle}>Contact Chain</Text>
        {contacts.map((contact) => (
          <View key={contact.id} style={s.contactRow}>
            <View style={s.contactOrder}>
              <Text style={s.contactOrderText}>{contact.order}</Text>
            </View>
            <View style={s.contactInfo}>
              <Text style={s.contactName}>{contact.name}</Text>
              <Text style={s.contactRole}>{contact.role}</Text>
            </View>
            <Text style={s.contactPhone}>{contact.phone}</Text>
          </View>
        ))}
      </View>

      {/* Evacuation Routes */}
      <View style={s.planCard}>
        <Text style={s.planSectionTitle}>Evacuation Routes</Text>
        {routes.map((route) => (
          <View key={route.id} style={s.routeRow}>
            <Text style={s.routeName}>{route.name}</Text>
            <Text style={s.routeDesc}>{route.description}</Text>
            <Text style={s.routeDest}>Destination: {route.destination}</Text>
          </View>
        ))}
      </View>

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          A plan only works if everyone knows it.{'\n\n'}
          Review your family emergency plan together{'\n'}
          at least once every 6 months.
        </Text>
      </View>
    </>
  );

  // ─── Training Tab ───

  const renderTraining = () => (
    <>
      {/* Community Drills */}
      <Text style={s.sectionTitle}>Upcoming Community Drills</Text>
      {drills.map((drill) => {
        const fillPct = Math.round((drill.participants / drill.maxParticipants) * 100);
        return (
          <View key={drill.id} style={s.drillCard}>
            <View style={s.drillHeader}>
              <Text style={s.drillTitle}>{drill.title}</Text>
            </View>
            <Text style={s.drillType}>{drill.type}</Text>
            <Text style={s.drillMeta}>{drill.date} | {drill.location}</Text>
            <Text style={s.drillParticipants}>{drill.participants}/{drill.maxParticipants} registered</Text>
            <View style={s.drillProgressOuter}>
              <View style={[s.drillProgressInner, { width: `${fillPct}%` }]} />
            </View>
            <TouchableOpacity
              style={[s.registerBtn, {
                backgroundColor: drill.registered ? t.accent.green + '20' : t.accent.blue,
              }]}
              onPress={() => {
                if (drill.registered) {
                  Alert.alert('Already Registered', `You are registered for "${drill.title}".`);
                } else {
                  Alert.alert('Register', `Register for "${drill.title}" on ${drill.date}?`);
                }
              }}
            >
              <Text style={[s.registerText, {
                color: drill.registered ? t.accent.green : '#fff',
              }]}>
                {drill.registered ? 'Registered' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Training Modules */}
      <Text style={s.sectionTitle}>Training Modules</Text>
      {training.map((mod) => (
        <View key={mod.id} style={s.trainingCard}>
          <View style={s.trainingHeader}>
            <Text style={s.trainingTitle}>{mod.title}</Text>
            <View style={[s.completedBadge, {
              backgroundColor: mod.completed ? t.accent.green + '20' : t.accent.orange + '20',
            }]}>
              <Text style={[s.completedText, {
                color: mod.completed ? t.accent.green : t.accent.orange,
              }]}>
                {mod.completed ? 'COMPLETED' : 'NOT STARTED'}
              </Text>
            </View>
          </View>
          <Text style={s.trainingType}>{mod.type}</Text>
          <Text style={s.trainingDuration}>Duration: {mod.duration}</Text>
          <Text style={s.trainingDesc}>{mod.description}</Text>
          {mod.completedDate && (
            <Text style={s.trainingDate}>Completed: {mod.completedDate}</Text>
          )}
          {!mod.completed && (
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => Alert.alert('Start Training', `Begin "${mod.title}" module? Estimated time: ${mod.duration}.`)}
            >
              <Text style={s.startText}>Start Module</Text>
            </TouchableOpacity>
          )}
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
        <Text style={s.title}>Emergency Prep</Text>
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
        {tab === 'score' && renderScore()}
        {tab === 'kit' && renderKit()}
        {tab === 'plan' && renderPlan()}
        {tab === 'training' && renderTraining()}
      </ScrollView>
    </SafeAreaView>
  );
}
