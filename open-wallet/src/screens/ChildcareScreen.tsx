import { fonts } from '../utils/theme';
/**
 * Childcare Screen — Community childcare co-ops, babysitting exchange.
 *
 * Article I (nOTK): "Nurturing the next generation is a shared responsibility."
 * nOTK recognizes the immeasurable value of caring for children.
 *
 * Features:
 * - Childcare co-op dashboard (members, schedule, hours bank)
 * - Offer childcare (availability, ages, activities)
 * - Request childcare (date, duration, number of children, special needs)
 * - Hours tracking (give hours, receive hours, balance)
 * - Trusted caregivers with community ratings
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

interface CoOp {
  id: string;
  name: string;
  memberCount: number;
  totalHoursExchanged: number;
  activeCaregivers: number;
  upcomingSessions: number;
  foundedDate: string;
  nOTKEarned: number;
}

interface Caregiver {
  id: string;
  name: string;
  uid: string;
  ageGroups: string[];
  activities: string[];
  rating: number;
  reviewCount: number;
  hoursGiven: number;
  hoursReceived: number;
  verified: boolean;
  availability: string;
  specialSkills: string;
}

interface CareSession {
  id: string;
  caregiverName: string;
  date: string;
  time: string;
  duration: number;
  childrenCount: number;
  ageGroup: string;
  activity: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  nOTKAwarded: number;
}

interface HoursBalance {
  given: number;
  received: number;
  balance: number;
  nOTKEarned: number;
  monthlyGiven: number;
  monthlyReceived: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const AGE_GROUPS = [
  { key: 'infant', label: 'Infant (0-1)', icon: 'I' },
  { key: 'toddler', label: 'Toddler (1-3)', icon: 'T' },
  { key: 'preschool', label: 'Preschool (3-5)', icon: 'P' },
  { key: 'school', label: 'School Age (5-12)', icon: 'S' },
];

const ACTIVITIES = [
  { key: 'play', label: 'Free Play' },
  { key: 'reading', label: 'Reading' },
  { key: 'arts', label: 'Arts & Crafts' },
  { key: 'outdoor', label: 'Outdoor Play' },
  { key: 'music', label: 'Music' },
  { key: 'homework', label: 'Homework Help' },
];

// ─── Demo Data ───

const DEMO_COOP: CoOp = {
  id: 'coop1',
  name: 'Neighborhood Kids Co-Op',
  memberCount: 24,
  totalHoursExchanged: 1862,
  activeCaregivers: 14,
  upcomingSessions: 7,
  foundedDate: '2025-06-15',
  nOTKEarned: 46550,
};

const DEMO_CAREGIVERS: Caregiver[] = [
  { id: 'c1', name: 'Elena', uid: 'openchain1abc...care_elena', ageGroups: ['toddler', 'preschool'], activities: ['arts', 'reading', 'music'], rating: 4.9, reviewCount: 42, hoursGiven: 186, hoursReceived: 124, verified: true, availability: 'Mon, Wed, Fri — mornings', specialSkills: 'Early childhood education certified' },
  { id: 'c2', name: 'James', uid: 'openchain1def...care_james', ageGroups: ['school', 'preschool'], activities: ['outdoor', 'homework', 'play'], rating: 4.7, reviewCount: 28, hoursGiven: 134, hoursReceived: 98, verified: true, availability: 'Weekends, Tue/Thu afternoons', specialSkills: 'Former teacher, first aid certified' },
  { id: 'c3', name: 'Priya', uid: 'openchain1ghi...care_priya', ageGroups: ['infant', 'toddler'], activities: ['play', 'reading', 'music'], rating: 4.8, reviewCount: 35, hoursGiven: 210, hoursReceived: 156, verified: true, availability: 'Mon-Fri — afternoons', specialSkills: 'Pediatric nurse, bilingual (English/Hindi)' },
];

const DEMO_SESSIONS: CareSession[] = [
  { id: 's1', caregiverName: 'Elena', date: '2026-03-31', time: '9:00 AM', duration: 3, childrenCount: 2, ageGroup: 'preschool', activity: 'Arts & Crafts', status: 'upcoming', nOTKAwarded: 0 },
  { id: 's2', caregiverName: 'James', date: '2026-04-01', time: '2:00 PM', duration: 2, childrenCount: 3, ageGroup: 'school', activity: 'Outdoor Play', status: 'upcoming', nOTKAwarded: 0 },
  { id: 's3', caregiverName: 'Priya', date: '2026-03-28', time: '1:00 PM', duration: 4, childrenCount: 1, ageGroup: 'toddler', activity: 'Reading', status: 'completed', nOTKAwarded: 600 },
  { id: 's4', caregiverName: 'Elena', date: '2026-03-26', time: '10:00 AM', duration: 2, childrenCount: 2, ageGroup: 'preschool', activity: 'Music', status: 'completed', nOTKAwarded: 400 },
  { id: 's5', caregiverName: 'James', date: '2026-03-24', time: '3:00 PM', duration: 3, childrenCount: 4, ageGroup: 'school', activity: 'Homework Help', status: 'completed', nOTKAwarded: 720 },
];

const DEMO_BALANCE: HoursBalance = {
  given: 86,
  received: 72,
  balance: 14,
  nOTKEarned: 12400,
  monthlyGiven: 12,
  monthlyReceived: 8,
};

type Tab = 'co-op' | 'find' | 'offer' | 'hours';

export function ChildcareScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('co-op');
  const [requestDate, setRequestDate] = useState('');
  const [requestDuration, setRequestDuration] = useState('');
  const [requestChildren, setRequestChildren] = useState('');
  const [requestAge, setRequestAge] = useState('');
  const [requestNeeds, setRequestNeeds] = useState('');
  const [offerAvailability, setOfferAvailability] = useState('');
  const [offerAges, setOfferAges] = useState<string[]>([]);
  const [offerActivities, setOfferActivities] = useState<string[]>([]);
  const [offerSkills, setOfferSkills] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const coop = DEMO_COOP;
  const caregivers = DEMO_CAREGIVERS;
  const sessions = DEMO_SESSIONS;
  const balance = DEMO_BALANCE;

  const toggleOfferAge = useCallback((key: string) => {
    setOfferAges((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }, []);

  const toggleOfferActivity = useCallback((key: string) => {
    setOfferActivities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }, []);

  const handleRequestCare = useCallback(() => {
    if (!requestDate.trim()) { Alert.alert('Required', 'Enter a date.'); return; }
    const dur = parseInt(requestDuration, 10);
    if (!dur || dur <= 0) { Alert.alert('Required', 'Enter duration in hours.'); return; }
    const children = parseInt(requestChildren, 10);
    if (!children || children <= 0) { Alert.alert('Required', 'Enter number of children.'); return; }

    Alert.alert(
      'Request Submitted',
      `Childcare request for ${children} child(ren) on ${requestDate}\nDuration: ${dur} hours\n\nMatching caregivers will be notified.`,
    );
    setRequestDate('');
    setRequestDuration('');
    setRequestChildren('');
    setRequestAge('');
    setRequestNeeds('');
    setTab('co-op');
  }, [requestDate, requestDuration, requestChildren]);

  const handleOfferCare = useCallback(() => {
    if (!offerAvailability.trim()) { Alert.alert('Required', 'Enter your availability.'); return; }
    if (offerAges.length === 0) { Alert.alert('Required', 'Select at least one age group.'); return; }

    Alert.alert(
      'Offer Submitted',
      `Your childcare offer is now visible to co-op members.\nAge groups: ${offerAges.join(', ')}\nAvailability: ${offerAvailability}`,
    );
    setOfferAvailability('');
    setOfferAges([]);
    setOfferActivities([]);
    setOfferSkills('');
    setTab('co-op');
  }, [offerAvailability, offerAges]);

  const handleContactCaregiver = useCallback((caregiver: Caregiver) => {
    Alert.alert(
      caregiver.name,
      `Rating: ${caregiver.rating}/5 (${caregiver.reviewCount} reviews)\nAvailability: ${caregiver.availability}\nSkills: ${caregiver.specialSkills}\n\nHours given: ${caregiver.hoursGiven} | Received: ${caregiver.hoursReceived}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Request Care', onPress: () => {
          setTab('co-op');
          Alert.alert('Request Sent', `Your childcare request has been sent to ${caregiver.name}.`);
        }},
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 },
    statItem: { alignItems: 'center', minWidth: 80 },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textAlign: 'center' },
    impactCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    impactText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    coopName: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 4 },
    coopSince: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginBottom: 16 },
    sessionCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    sessionStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    sessionStatusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    sessionMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    sessionDetail: { color: t.text.primary, fontSize: fonts.sm, marginTop: 6 },
    sessionNOTK: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 6 },
    caregiverCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    caregiverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    caregiverName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    caregiverRating: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold },
    reviewCount: { color: t.text.muted, fontSize: fonts.xs, marginLeft: 4 },
    caregiverMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    caregiverSkill: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    caregiverTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tagChip: { backgroundColor: t.accent.green + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    caregiverFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    verifiedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    verifiedText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    contactBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    contactBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    balanceCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    balanceNumber: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy },
    balanceLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    balanceSign: { fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    hourRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    hourItem: { alignItems: 'center' },
    hourValue: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    hourLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    monthlyCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    monthlyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 8 },
    monthlyRow: { flexDirection: 'row', justifyContent: 'space-between' },
    monthlyLabel: { color: t.text.muted, fontSize: fonts.sm },
    monthlyValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'co-op', label: 'Co-Op' },
    { key: 'find', label: 'Find Care' },
    { key: 'offer', label: 'Offer Care' },
    { key: 'hours', label: 'Hours' },
  ];

  // ─── Co-Op Tab ───

  const renderCoOp = () => (
    <>
      <View style={s.card}>
        <Text style={s.coopName}>{coop.name}</Text>
        <Text style={s.coopSince}>Since {coop.foundedDate}</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{coop.memberCount}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{coop.activeCaregivers}</Text>
            <Text style={s.statLabel}>Caregivers</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{coop.totalHoursExchanged.toLocaleString()}</Text>
            <Text style={s.statLabel}>Hours Exchanged</Text>
          </View>
        </View>
      </View>

      <View style={s.impactCard}>
        <Text style={s.impactText}>
          {coop.nOTKEarned.toLocaleString()} nOTK earned by co-op members.{'\n'}
          {coop.upcomingSessions} sessions scheduled this week.{'\n'}
          Every hour of care nurtures the future.
        </Text>
      </View>

      {/* Upcoming Sessions */}
      <Text style={s.sectionTitle}>Upcoming Sessions</Text>
      {sessions.filter((ses) => ses.status === 'upcoming').map((ses) => (
        <View key={ses.id} style={s.sessionCard}>
          <View style={s.sessionHeader}>
            <Text style={s.sessionName}>{ses.caregiverName}</Text>
            <View style={[s.sessionStatus, { backgroundColor: t.accent.blue + '20' }]}>
              <Text style={[s.sessionStatusText, { color: t.accent.blue }]}>UPCOMING</Text>
            </View>
          </View>
          <Text style={s.sessionMeta}>{ses.date} | {ses.time} | {ses.duration} hours</Text>
          <Text style={s.sessionDetail}>
            {ses.childrenCount} child(ren) | {ses.ageGroup} | {ses.activity}
          </Text>
        </View>
      ))}

      {/* Recent Completed */}
      <Text style={s.sectionTitle}>Recent Sessions</Text>
      {sessions.filter((ses) => ses.status === 'completed').map((ses) => (
        <View key={ses.id} style={s.sessionCard}>
          <View style={s.sessionHeader}>
            <Text style={s.sessionName}>{ses.caregiverName}</Text>
            <View style={[s.sessionStatus, { backgroundColor: t.accent.green + '20' }]}>
              <Text style={[s.sessionStatusText, { color: t.accent.green }]}>COMPLETED</Text>
            </View>
          </View>
          <Text style={s.sessionMeta}>{ses.date} | {ses.time} | {ses.duration} hours</Text>
          <Text style={s.sessionDetail}>
            {ses.childrenCount} child(ren) | {ses.ageGroup} | {ses.activity}
          </Text>
          {ses.nOTKAwarded > 0 && (
            <Text style={s.sessionNOTK}>+{ses.nOTKAwarded} nOTK</Text>
          )}
        </View>
      ))}
    </>
  );

  // ─── Find Care Tab ───

  const renderFind = () => (
    <>
      <Text style={s.sectionTitle}>Trusted Caregivers</Text>
      {caregivers.map((cg) => (
        <View key={cg.id} style={s.caregiverCard}>
          <View style={s.caregiverHeader}>
            <Text style={s.caregiverName}>{cg.name}</Text>
            <View style={s.caregiverRating}>
              <Text style={s.ratingText}>{cg.rating}</Text>
              <Text style={s.reviewCount}>({cg.reviewCount})</Text>
            </View>
          </View>
          <Text style={s.caregiverMeta}>{cg.availability}</Text>
          <Text style={s.caregiverSkill}>{cg.specialSkills}</Text>
          <View style={s.caregiverTags}>
            {cg.ageGroups.map((ag) => (
              <View key={ag} style={s.tagChip}>
                <Text style={s.tagText}>{AGE_GROUPS.find((a) => a.key === ag)?.label || ag}</Text>
              </View>
            ))}
            {cg.activities.map((act) => (
              <View key={act} style={[s.tagChip, { backgroundColor: t.accent.blue + '15' }]}>
                <Text style={[s.tagText, { color: t.accent.blue }]}>
                  {ACTIVITIES.find((a) => a.key === act)?.label || act}
                </Text>
              </View>
            ))}
          </View>
          <View style={s.caregiverFooter}>
            {cg.verified && (
              <View style={s.verifiedBadge}>
                <Text style={s.verifiedText}>VERIFIED</Text>
              </View>
            )}
            <TouchableOpacity style={s.contactBtn} onPress={() => handleContactCaregiver(cg)}>
              <Text style={s.contactBtnText}>Request Care</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Request Form */}
      <View style={[s.card, { marginTop: 8 }]}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Request Childcare</Text>

        <TextInput
          style={s.input}
          placeholder="Date (e.g. 2026-04-02)"
          placeholderTextColor={t.text.muted}
          value={requestDate}
          onChangeText={setRequestDate}
        />

        <TextInput
          style={s.input}
          placeholder="Duration (hours)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={requestDuration}
          onChangeText={setRequestDuration}
        />

        <TextInput
          style={s.input}
          placeholder="Number of children"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={requestChildren}
          onChangeText={setRequestChildren}
        />

        <Text style={[s.caregiverMeta, { marginBottom: 8 }]}>Age Group</Text>
        <View style={s.typeGrid}>
          {AGE_GROUPS.map((ag) => (
            <TouchableOpacity
              key={ag.key}
              style={[s.typeChip, requestAge === ag.key && s.typeChipSelected]}
              onPress={() => setRequestAge(ag.key)}
            >
              <Text style={[s.typeChipText, requestAge === ag.key && s.typeChipTextSelected]}>
                {ag.icon} {ag.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder="Special needs or notes (optional)"
          placeholderTextColor={t.text.muted}
          value={requestNeeds}
          onChangeText={setRequestNeeds}
          multiline
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleRequestCare}>
          <Text style={s.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Offer Care Tab ───

  const renderOffer = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Offer Childcare</Text>

      <TextInput
        style={s.input}
        placeholder="Your availability (e.g. Mon/Wed 9 AM - 1 PM)"
        placeholderTextColor={t.text.muted}
        value={offerAvailability}
        onChangeText={setOfferAvailability}
      />

      <Text style={[s.caregiverMeta, { marginBottom: 8 }]}>Age Groups You Can Care For</Text>
      <View style={s.typeGrid}>
        {AGE_GROUPS.map((ag) => (
          <TouchableOpacity
            key={ag.key}
            style={[s.typeChip, offerAges.includes(ag.key) && s.typeChipSelected]}
            onPress={() => toggleOfferAge(ag.key)}
          >
            <Text style={[s.typeChipText, offerAges.includes(ag.key) && s.typeChipTextSelected]}>
              {ag.icon} {ag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.caregiverMeta, { marginBottom: 8 }]}>Activities You Can Offer</Text>
      <View style={s.typeGrid}>
        {ACTIVITIES.map((act) => (
          <TouchableOpacity
            key={act.key}
            style={[s.typeChip, offerActivities.includes(act.key) && s.typeChipSelected]}
            onPress={() => toggleOfferActivity(act.key)}
          >
            <Text style={[s.typeChipText, offerActivities.includes(act.key) && s.typeChipTextSelected]}>
              {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Special skills or certifications (optional)"
        placeholderTextColor={t.text.muted}
        value={offerSkills}
        onChangeText={setOfferSkills}
        multiline
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleOfferCare}>
        <Text style={s.submitText}>Submit Offer</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Hours Tab ───

  const renderHours = () => (
    <>
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Hours Balance</Text>
        <Text style={s.balanceNumber}>{balance.balance}</Text>
        <Text style={[s.balanceSign, { color: balance.balance >= 0 ? t.accent.green : t.accent.red || '#FF3B30' }]}>
          {balance.balance >= 0 ? 'You have hours to use' : 'You owe hours to the co-op'}
        </Text>
        <View style={s.hourRow}>
          <View style={s.hourItem}>
            <Text style={[s.hourValue, { color: t.accent.green }]}>{balance.given}</Text>
            <Text style={s.hourLabel}>Hours Given</Text>
          </View>
          <View style={s.hourItem}>
            <Text style={[s.hourValue, { color: t.accent.blue }]}>{balance.received}</Text>
            <Text style={s.hourLabel}>Hours Received</Text>
          </View>
          <View style={s.hourItem}>
            <Text style={[s.hourValue, { color: t.accent.green }]}>{balance.nOTKEarned.toLocaleString()}</Text>
            <Text style={s.hourLabel}>nOTK Earned</Text>
          </View>
        </View>
      </View>

      {/* Monthly Summary */}
      <View style={s.monthlyCard}>
        <Text style={s.monthlyTitle}>This Month</Text>
        <View style={s.monthlyRow}>
          <Text style={s.monthlyLabel}>Hours Given</Text>
          <Text style={s.monthlyValue}>{balance.monthlyGiven}</Text>
        </View>
        <View style={[s.monthlyRow, { marginTop: 6 }]}>
          <Text style={s.monthlyLabel}>Hours Received</Text>
          <Text style={s.monthlyValue}>{balance.monthlyReceived}</Text>
        </View>
        <View style={[s.monthlyRow, { marginTop: 6 }]}>
          <Text style={s.monthlyLabel}>Net</Text>
          <Text style={[s.monthlyValue, { color: t.accent.green }]}>+{balance.monthlyGiven - balance.monthlyReceived}</Text>
        </View>
      </View>

      <View style={s.impactCard}>
        <Text style={s.impactText}>
          In the co-op, every hour you give is an hour you can receive.{'\n'}
          Your care earns nOTK — nurture value recognized on-chain.{'\n'}
          Caring for children is the highest human investment.
        </Text>
      </View>

      {/* All Sessions for hours context */}
      <Text style={s.sectionTitle}>Session History</Text>
      {sessions.filter((ses) => ses.status === 'completed').map((ses) => (
        <View key={ses.id} style={s.sessionCard}>
          <View style={s.sessionHeader}>
            <Text style={s.sessionName}>{ses.caregiverName}</Text>
            <Text style={s.sessionNOTK}>+{ses.nOTKAwarded} nOTK</Text>
          </View>
          <Text style={s.sessionMeta}>
            {ses.date} | {ses.duration}h | {ses.childrenCount} child(ren)
          </Text>
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
        <Text style={s.title}>Childcare</Text>
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
        {tab === 'co-op' && renderCoOp()}
        {tab === 'find' && renderFind()}
        {tab === 'offer' && renderOffer()}
        {tab === 'hours' && renderHours()}
      </ScrollView>
    </SafeAreaView>
  );
}
