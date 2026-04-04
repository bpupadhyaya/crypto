import { fonts } from '../utils/theme';
/**
 * Volunteer Screen — Track community service and volunteer impact.
 *
 * Article I: "Every community volunteer's effort deserves recognition."
 * Article III: cOTK represents community value.
 *
 * Features:
 * - Volunteer profile (total hours, services, cOTK earned, level badge)
 * - Log community service (type, hours, description, beneficiaries)
 * - Service history timeline
 * - Upcoming volunteer opportunities (community-posted)
 * - Volunteer leaderboard (top contributors by hours)
 * - Impact visualization
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

interface VolunteerProfile {
  uid: string;
  totalHours: number;
  totalServices: number;
  totalCOTK: number;
  totalBeneficiaries: number;
  topServiceType: string;
  volunteerLevel: string;
}

interface CommunityServiceRecord {
  id: string;
  volunteerUID: string;
  serviceType: string;
  description: string;
  hoursServed: number;
  beneficiariesCount: number;
  organizationUID: string;
  verified: boolean;
  cotkEarned: number;
  date: string;
}

interface VolunteerOpportunity {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  hours: number;
  cotkReward: number;
  spotsLeft: number;
  postedBy: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SERVICE_TYPES = [
  { key: 'cleanup', label: 'Cleanup', icon: '~' },
  { key: 'tutoring', label: 'Tutoring', icon: 'T' },
  { key: 'eldercare', label: 'Elder Care', icon: 'E' },
  { key: 'food_bank', label: 'Food Bank', icon: 'F' },
  { key: 'coaching', label: 'Coaching', icon: 'C' },
  { key: 'mentoring', label: 'Mentoring', icon: 'M' },
];

const LEVEL_COLORS: Record<string, string> = {
  helper: '#8E8E93',
  regular: '#34C759',
  dedicated: '#007AFF',
  champion: '#AF52DE',
  legend: '#FF9500',
};

const LEVEL_THRESHOLDS: Record<string, string> = {
  helper: '0-10 hours',
  regular: '11-50 hours',
  dedicated: '51-200 hours',
  champion: '201-500 hours',
  legend: '500+ hours',
};

// ─── Demo Data ───

const DEMO_PROFILE: VolunteerProfile = {
  uid: 'you',
  totalHours: 127,
  totalServices: 34,
  totalCOTK: 18400,
  totalBeneficiaries: 256,
  topServiceType: 'tutoring',
  volunteerLevel: 'dedicated',
};

const DEMO_SERVICES: CommunityServiceRecord[] = [
  { id: '1', volunteerUID: 'you', serviceType: 'tutoring', description: 'Math tutoring for middle school students', hoursServed: 4, beneficiariesCount: 8, organizationUID: 'org_school_district', verified: true, cotkEarned: 720, date: '2026-03-27' },
  { id: '2', volunteerUID: 'you', serviceType: 'food_bank', description: 'Weekend food distribution at community center', hoursServed: 6, beneficiariesCount: 45, organizationUID: 'org_food_bank', verified: true, cotkEarned: 1800, date: '2026-03-25' },
  { id: '3', volunteerUID: 'you', serviceType: 'eldercare', description: 'Home visits for elderly neighbors', hoursServed: 3, beneficiariesCount: 4, organizationUID: 'org_senior_center', verified: true, cotkEarned: 420, date: '2026-03-22' },
  { id: '4', volunteerUID: 'you', serviceType: 'cleanup', description: 'River bank cleanup drive', hoursServed: 5, beneficiariesCount: 200, organizationUID: 'org_green_earth', verified: true, cotkEarned: 1500, date: '2026-03-20' },
  { id: '5', volunteerUID: 'you', serviceType: 'mentoring', description: 'Career mentoring for at-risk youth', hoursServed: 2, beneficiariesCount: 3, organizationUID: 'org_youth_futures', verified: false, cotkEarned: 0, date: '2026-03-18' },
  { id: '6', volunteerUID: 'you', serviceType: 'coaching', description: 'Youth basketball coaching at rec center', hoursServed: 3, beneficiariesCount: 15, organizationUID: 'org_parks_rec', verified: true, cotkEarned: 600, date: '2026-03-15' },
];

const DEMO_OPPORTUNITIES: VolunteerOpportunity[] = [
  { id: 'o1', title: 'Community Garden Planting Day', category: 'cleanup', location: 'Riverside Park', date: '2026-04-02', hours: 4, cotkReward: 400, spotsLeft: 8, postedBy: 'org_green_earth' },
  { id: 'o2', title: 'After-School Homework Help', category: 'tutoring', location: 'Lincoln Elementary', date: '2026-04-03', hours: 2, cotkReward: 200, spotsLeft: 5, postedBy: 'org_school_district' },
  { id: 'o3', title: 'Senior Center Game Day', category: 'eldercare', location: 'Sunshine Senior Center', date: '2026-04-05', hours: 3, cotkReward: 300, spotsLeft: 12, postedBy: 'org_senior_center' },
  { id: 'o4', title: 'Weekend Food Drive', category: 'food_bank', location: 'Community Center', date: '2026-04-06', hours: 5, cotkReward: 500, spotsLeft: 20, postedBy: 'org_food_bank' },
  { id: 'o5', title: 'Youth Coding Workshop', category: 'mentoring', location: 'Public Library', date: '2026-04-08', hours: 3, cotkReward: 300, spotsLeft: 3, postedBy: 'org_youth_futures' },
];

const DEMO_LEADERBOARD: VolunteerProfile[] = [
  { uid: 'openchain1abc...volunteer_sam', totalHours: 542, totalServices: 128, totalCOTK: 72400, totalBeneficiaries: 1850, topServiceType: 'food_bank', volunteerLevel: 'legend' },
  { uid: 'openchain1def...helper_maria', totalHours: 384, totalServices: 96, totalCOTK: 51200, totalBeneficiaries: 920, topServiceType: 'eldercare', volunteerLevel: 'champion' },
  { uid: 'openchain1ghi...coach_raj', totalHours: 256, totalServices: 64, totalCOTK: 34100, totalBeneficiaries: 480, topServiceType: 'coaching', volunteerLevel: 'champion' },
  { uid: 'openchain1jkl...tutor_li', totalHours: 198, totalServices: 52, totalCOTK: 28600, totalBeneficiaries: 340, topServiceType: 'tutoring', volunteerLevel: 'dedicated' },
  { uid: 'openchain1mno...green_yuki', totalHours: 145, totalServices: 38, totalCOTK: 19800, totalBeneficiaries: 3200, topServiceType: 'cleanup', volunteerLevel: 'dedicated' },
  DEMO_PROFILE,
  { uid: 'openchain1pqr...mentor_aisha', totalHours: 89, totalServices: 24, totalCOTK: 12100, totalBeneficiaries: 72, topServiceType: 'mentoring', volunteerLevel: 'regular' },
  { uid: 'openchain1stu...care_carlos', totalHours: 45, totalServices: 12, totalCOTK: 6400, totalBeneficiaries: 156, topServiceType: 'food_bank', volunteerLevel: 'regular' },
];

type Tab = 'profile' | 'log' | 'history' | 'opportunities' | 'leaderboard';

export function VolunteerScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [logType, setLogType] = useState('');
  const [logHours, setLogHours] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logBeneficiaries, setLogBeneficiaries] = useState('');
  const [logOrg, setLogOrg] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const profile = DEMO_PROFILE;
  const services = DEMO_SERVICES;
  const opportunities = DEMO_OPPORTUNITIES;
  const leaderboard = useMemo(() =>
    [...DEMO_LEADERBOARD].sort((a, b) => b.totalHours - a.totalHours),
    [],
  );

  const handleLogService = useCallback(() => {
    if (!logType) { Alert.alert('Required', 'Select a service type.'); return; }
    const hours = parseInt(logHours, 10);
    if (!hours || hours <= 0) { Alert.alert('Required', 'Enter valid hours.'); return; }
    if (!logDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }

    const bene = parseInt(logBeneficiaries, 10) || 0;
    const base = hours * 100;
    const multiplier = Math.min(100 + bene * 10, 300);
    const cotk = Math.floor(base * multiplier / 100);

    Alert.alert(
      'Service Logged',
      `${hours} hours of ${logType} recorded.\nEstimated cOTK: ${cotk}\n\nAwaiting organization verification.`,
    );
    setLogType('');
    setLogHours('');
    setLogDescription('');
    setLogBeneficiaries('');
    setLogOrg('');
    setTab('history');
  }, [logType, logHours, logDescription, logBeneficiaries]);

  const levelColor = LEVEL_COLORS[profile.volunteerLevel] || t.text.muted;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 16 },
    levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    levelText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold, textTransform: 'uppercase' },
    hoursText: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy, marginTop: 4 },
    hoursLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    impactCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    impactText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    serviceRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    serviceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    serviceIconText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    serviceInfo: { flex: 1 },
    serviceTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    serviceMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    serviceRight: { alignItems: 'flex-end', justifyContent: 'center' },
    serviceCotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    serviceVerified: { fontSize: 11, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    oppCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    oppTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    oppMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    oppReward: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    oppCotkText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    oppSignup: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    oppSignupText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    rankNum: { width: 32, color: t.text.muted, fontSize: 16, fontWeight: fonts.heavy, textAlign: 'center' },
    leaderInfo: { flex: 1, marginLeft: 8 },
    leaderName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    leaderMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    leaderHours: { alignItems: 'flex-end' },
    leaderHoursText: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    leaderHoursLabel: { color: t.text.muted, fontSize: 10 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'profile', label: 'Profile' },
    { key: 'log', label: 'Log Service' },
    { key: 'history', label: 'History' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.profileHeader}>
          <Text style={s.hoursLabel}>Total Hours Volunteered</Text>
          <Text style={s.hoursText}>{profile.totalHours}</Text>
          <View style={[s.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={s.levelText}>{profile.volunteerLevel}</Text>
          </View>
          <Text style={[s.serviceMeta, { marginTop: 6 }]}>{LEVEL_THRESHOLDS[profile.volunteerLevel]}</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.totalServices}</Text>
            <Text style={s.statLabel}>Services</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{profile.totalCOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>cOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.totalBeneficiaries}</Text>
            <Text style={s.statLabel}>People Helped</Text>
          </View>
        </View>
      </View>

      <View style={s.impactCard}>
        <Text style={s.impactText}>
          You have helped {profile.totalBeneficiaries} people across {profile.totalServices} services.{'\n'}
          Your top contribution: {profile.topServiceType}.{'\n'}
          Every hour matters. Thank you.
        </Text>
      </View>

      {/* Next level progress */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Next Level</Text>
        {profile.volunteerLevel === 'legend' ? (
          <Text style={s.impactText}>You are a Legend. Keep inspiring others.</Text>
        ) : (
          <Text style={[s.serviceMeta, { textAlign: 'center' }]}>
            {profile.volunteerLevel === 'helper' && `${10 - profile.totalHours} hours to Regular`}
            {profile.volunteerLevel === 'regular' && `${50 - profile.totalHours} hours to Dedicated`}
            {profile.volunteerLevel === 'dedicated' && `${200 - profile.totalHours} hours to Champion`}
            {profile.volunteerLevel === 'champion' && `${500 - profile.totalHours} hours to Legend`}
          </Text>
        )}
      </View>
    </>
  );

  // ─── Log Service Tab ───

  const renderLog = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Log Community Service</Text>

      <Text style={[s.serviceMeta, { marginBottom: 8 }]}>Service Type</Text>
      <View style={s.typeGrid}>
        {SERVICE_TYPES.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[s.typeChip, logType === st.key && s.typeChipSelected]}
            onPress={() => setLogType(st.key)}
          >
            <Text style={[s.typeChipText, logType === st.key && s.typeChipTextSelected]}>
              {st.icon} {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Hours served"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={logHours}
        onChangeText={setLogHours}
      />

      <TextInput
        style={s.input}
        placeholder="Description of service"
        placeholderTextColor={t.text.muted}
        value={logDescription}
        onChangeText={setLogDescription}
        multiline
      />

      <TextInput
        style={s.input}
        placeholder="Number of beneficiaries (optional)"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={logBeneficiaries}
        onChangeText={setLogBeneficiaries}
      />

      <TextInput
        style={s.input}
        placeholder="Organization UID (for verification)"
        placeholderTextColor={t.text.muted}
        value={logOrg}
        onChangeText={setLogOrg}
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleLogService}>
        <Text style={s.submitText}>Submit Service Record</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── History Tab ───

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Service History</Text>
      <View style={s.card}>
        {services.map((svc) => {
          const typeInfo = SERVICE_TYPES.find((st) => st.key === svc.serviceType);
          return (
            <View key={svc.id} style={s.serviceRow}>
              <View style={s.serviceIcon}>
                <Text style={s.serviceIconText}>{typeInfo?.icon || '?'}</Text>
              </View>
              <View style={s.serviceInfo}>
                <Text style={s.serviceTitle}>{svc.description}</Text>
                <Text style={s.serviceMeta}>
                  {svc.date} | {svc.hoursServed}h | {svc.beneficiariesCount} people
                </Text>
              </View>
              <View style={s.serviceRight}>
                {svc.verified ? (
                  <Text style={s.serviceCotk}>+{svc.cotkEarned} cOTK</Text>
                ) : (
                  <Text style={[s.serviceVerified, { color: t.accent.orange }]}>Pending</Text>
                )}
                <Text style={[s.serviceVerified, { color: svc.verified ? t.accent.green : t.text.muted }]}>
                  {svc.verified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Opportunities Tab ───

  const renderOpportunities = () => (
    <>
      <Text style={s.sectionTitle}>Upcoming Volunteer Opportunities</Text>
      {opportunities.map((opp) => (
        <View key={opp.id} style={s.oppCard}>
          <Text style={s.oppTitle}>{opp.title}</Text>
          <Text style={s.oppMeta}>
            {opp.location} | {opp.date} | {opp.hours} hours
          </Text>
          <Text style={s.oppMeta}>{opp.spotsLeft} spots left</Text>
          <View style={s.oppReward}>
            <Text style={s.oppCotkText}>+{opp.cotkReward} cOTK</Text>
            <TouchableOpacity
              style={s.oppSignup}
              onPress={() => Alert.alert('Signed Up', `You signed up for "${opp.title}". See you there!`)}
            >
              <Text style={s.oppSignupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Leaderboard Tab ───

  const renderLeaderboard = () => (
    <>
      <Text style={s.sectionTitle}>Top Volunteers</Text>
      <View style={s.card}>
        {leaderboard.map((vol, idx) => {
          const isYou = vol.uid === 'you';
          const lColor = LEVEL_COLORS[vol.volunteerLevel] || t.text.muted;
          return (
            <View key={vol.uid} style={[s.leaderRow, isYou && { backgroundColor: t.accent.green + '10', borderRadius: 10, paddingHorizontal: 8 }]}>
              <Text style={[s.rankNum, idx < 3 && { color: t.accent.orange }]}>
                #{idx + 1}
              </Text>
              <View style={s.leaderInfo}>
                <Text style={[s.leaderName, isYou && { color: t.accent.green }]}>
                  {isYou ? 'You' : vol.uid.split('...')[1] || vol.uid}
                </Text>
                <Text style={s.leaderMeta}>
                  <Text style={{ color: lColor }}>{vol.volunteerLevel}</Text>
                  {' | '}{vol.totalServices} services | {vol.totalBeneficiaries.toLocaleString()} helped
                </Text>
              </View>
              <View style={s.leaderHours}>
                <Text style={s.leaderHoursText}>{vol.totalHours}</Text>
                <Text style={s.leaderHoursLabel}>hours</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Volunteer</Text>
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
        {tab === 'profile' && renderProfile()}
        {tab === 'log' && renderLog()}
        {tab === 'history' && renderHistory()}
        {tab === 'opportunities' && renderOpportunities()}
        {tab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}
