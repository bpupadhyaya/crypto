/**
 * Barrier-Free Screen — Art IX: Universal design assessment, barrier-free community planning.
 *
 * Every human deserves access. This screen empowers communities to audit,
 * report, and improve accessibility of public spaces for all abilities.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface AccessibilityRating {
  wheelchair: number; // 1-5
  vision: number;
  hearing: number;
  cognitive: number;
}

interface AuditedLocation {
  id: string;
  name: string;
  type: 'venue' | 'path' | 'building' | 'transit';
  address: string;
  ratings: AccessibilityRating;
  overallScore: number;
  auditor: string;
  auditDate: string;
  notes: string;
}

interface BarrierReport {
  id: string;
  location: string;
  category: 'broken_ramp' | 'missing_sign' | 'blocked_path' | 'no_audio' | 'other';
  description: string;
  reporter: string;
  reportDate: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Champion {
  id: string;
  name: string;
  auditsCompleted: number;
  barriersReported: number;
  badgeLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinedDate: string;
}

interface Props {
  onClose: () => void;
}

type TabKey = 'audit' | 'barriers' | 'guidelines' | 'champions';

const TAB_LABELS: Record<TabKey, string> = {
  audit: 'Audit',
  barriers: 'Barriers',
  guidelines: 'Guidelines',
  champions: 'Champions',
};

const CATEGORY_LABELS: Record<string, string> = {
  broken_ramp: 'Broken Ramp',
  missing_sign: 'Missing Sign',
  blocked_path: 'Blocked Path',
  no_audio: 'No Audio Signal',
  other: 'Other',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#8bc34a',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

const BADGE_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

const RATING_LABELS = ['Wheelchair', 'Vision', 'Hearing', 'Cognitive'];
const RATING_KEYS: (keyof AccessibilityRating)[] = ['wheelchair', 'vision', 'hearing', 'cognitive'];

const DEMO_LOCATIONS: AuditedLocation[] = [
  {
    id: 'loc-1',
    name: 'Central Community Library',
    type: 'building',
    address: '200 Main Street',
    ratings: { wheelchair: 4, vision: 3, hearing: 2, cognitive: 4 },
    overallScore: 72,
    auditor: 'openchain1abc...xyz',
    auditDate: '2026-03-15',
    notes: 'Elevator works well. Braille signage partial. No hearing loop in meeting rooms.',
  },
  {
    id: 'loc-2',
    name: 'Riverside Park Trail',
    type: 'path',
    address: 'Riverside Park, East Entrance',
    ratings: { wheelchair: 2, vision: 3, hearing: 5, cognitive: 4 },
    overallScore: 60,
    auditor: 'openchain1def...uvw',
    auditDate: '2026-03-10',
    notes: 'Trail surface uneven in sections. Tactile markers at intersections. Good signage.',
  },
  {
    id: 'loc-3',
    name: 'Town Hall',
    type: 'building',
    address: '1 Civic Center Plaza',
    ratings: { wheelchair: 4, vision: 4, hearing: 3, cognitive: 3 },
    overallScore: 75,
    auditor: 'openchain1ghi...rst',
    auditDate: '2026-02-28',
    notes: 'Ramp access good. Hearing assistance available on request. Complex wayfinding.',
  },
  {
    id: 'loc-4',
    name: 'Metro Station — Oak Street',
    type: 'transit',
    address: 'Oak Street & 5th Avenue',
    ratings: { wheelchair: 3, vision: 2, hearing: 3, cognitive: 2 },
    overallScore: 55,
    auditor: 'openchain1jkl...opq',
    auditDate: '2026-03-20',
    notes: 'Elevator frequently out of service. No tactile paving on platform edge. Confusing signage.',
  },
];

const DEMO_BARRIERS: BarrierReport[] = [
  {
    id: 'bar-1',
    location: 'Metro Station — Oak Street',
    category: 'broken_ramp',
    description: 'The wheelchair ramp on the east entrance has a cracked surface and is too steep at the top. Creates a tipping hazard for wheelchair users.',
    reporter: 'openchain1abc...xyz',
    reportDate: '2026-03-22',
    status: 'open',
    priority: 'high',
  },
  {
    id: 'bar-2',
    location: 'Central Community Library',
    category: 'no_audio',
    description: 'Meeting Room B has no hearing loop installed despite being the main public event space. Deaf and hard-of-hearing community members cannot participate.',
    reporter: 'openchain1def...uvw',
    reportDate: '2026-03-18',
    status: 'in_progress',
    priority: 'medium',
  },
];

const DEMO_CHAMPIONS: Champion[] = [
  { id: 'ch-1', name: 'Accessibility Alliance', auditsCompleted: 47, barriersReported: 23, badgeLevel: 'platinum', joinedDate: '2025-06-01' },
  { id: 'ch-2', name: 'Inclusive Futures Group', auditsCompleted: 31, barriersReported: 15, badgeLevel: 'gold', joinedDate: '2025-09-15' },
  { id: 'ch-3', name: 'WheelFree Advocates', auditsCompleted: 18, barriersReported: 9, badgeLevel: 'silver', joinedDate: '2025-11-20' },
  { id: 'ch-4', name: 'See For All', auditsCompleted: 8, barriersReported: 5, badgeLevel: 'bronze', joinedDate: '2026-01-10' },
];

const GUIDELINES = [
  { title: 'Wheelchair Access', items: ['Ramp slope max 1:12', 'Doorways min 32" clear width', 'Accessible restrooms on every floor', 'Smooth, firm ground surfaces', 'Lowered counters and service points'] },
  { title: 'Vision Accessibility', items: ['Braille signage at all decision points', 'Tactile ground indicators', 'High contrast wayfinding', 'Audio announcements in transit', 'Large print alternatives available'] },
  { title: 'Hearing Accessibility', items: ['Hearing loop systems in public spaces', 'Visual fire alarms and alerts', 'Sign language interpretation available', 'Captioning on all video displays', 'Quiet spaces for lip reading'] },
  { title: 'Cognitive Accessibility', items: ['Simple, clear signage with icons', 'Consistent navigation patterns', 'Quiet rest areas available', 'Staff trained in inclusive communication', 'Easy-read versions of key information'] },
];

export function BarrierFreeScreen({ onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('audit');
  const [locations, setLocations] = useState<AuditedLocation[]>(DEMO_LOCATIONS);
  const [barriers, setBarriers] = useState<BarrierReport[]>(DEMO_BARRIERS);
  const [loading, setLoading] = useState(false);

  // Audit form
  const [auditName, setAuditName] = useState('');
  const [auditAddress, setAuditAddress] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditRatings, setAuditRatings] = useState<AccessibilityRating>({ wheelchair: 3, vision: 3, hearing: 3, cognitive: 3 });
  const [showAuditForm, setShowAuditForm] = useState(false);

  // Barrier form
  const [barrierLocation, setBarrierLocation] = useState('');
  const [barrierDescription, setBarrierDescription] = useState('');
  const [barrierCategory, setBarrierCategory] = useState<BarrierReport['category']>('other');
  const [showBarrierForm, setShowBarrierForm] = useState(false);

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const communityScore = useMemo(() => {
    if (locations.length === 0) return 0;
    return Math.round(locations.reduce((sum, l) => sum + l.overallScore, 0) / locations.length);
  }, [locations]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center', marginBottom: 16 },
    heroEmoji: { fontSize: 40, marginBottom: 12 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
    scoreValue: { fontSize: 32, fontWeight: '800' },
    scoreLabel: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    statBox: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 16 },
    locCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    locName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    locAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    locType: { color: t.accent.blue, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    ratingRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    ratingItem: { alignItems: 'center', flex: 1 },
    ratingLabel: { color: t.text.muted, fontSize: 10, marginBottom: 4 },
    ratingDots: { flexDirection: 'row', gap: 3 },
    ratingDot: { width: 8, height: 8, borderRadius: 4 },
    locScore: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginTop: 10 },
    locNotes: { color: t.text.secondary, fontSize: 12, lineHeight: 18, marginTop: 6 },
    locAuditor: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    barrierCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    barrierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    barrierCategory: { fontSize: 12, fontWeight: '700' },
    barrierPriority: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', color: '#fff' },
    barrierLocation: { color: t.text.primary, fontSize: 14, fontWeight: '600', marginTop: 6 },
    barrierDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
    barrierStatus: { color: t.text.muted, fontSize: 12, marginTop: 8, fontWeight: '600' },
    guideCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guideTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
    guideItem: { color: t.text.secondary, fontSize: 13, lineHeight: 22, paddingLeft: 12 },
    champCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    champBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    champBadgeText: { fontSize: 20 },
    champInfo: { flex: 1 },
    champName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    champStats: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    champLevel: { fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
    addBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12, alignSelf: 'center' },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 32 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    ratingSelector: { flexDirection: 'row', gap: 8, marginTop: 6 },
    ratingSelectorBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    ratingSelectorText: { fontSize: 14, fontWeight: '700' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    categoryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2 },
    categoryBtnText: { fontSize: 12, fontWeight: '600' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, marginHorizontal: 40 },
  }), [t]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#ffc107';
    return '#f44336';
  }, []);

  const handleSubmitAudit = useCallback(async () => {
    if (!auditName.trim() || !auditAddress.trim()) {
      Alert.alert('Required', 'Please enter a location name and address.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      const avg = Math.round(((auditRatings.wheelchair + auditRatings.vision + auditRatings.hearing + auditRatings.cognitive) / 4) * 20);
      const newLoc: AuditedLocation = {
        id: `loc-${Date.now()}`,
        name: auditName.trim(),
        type: 'building',
        address: auditAddress.trim(),
        ratings: { ...auditRatings },
        overallScore: avg,
        auditor: 'you',
        auditDate: new Date().toISOString().split('T')[0],
        notes: auditNotes.trim(),
      };
      setLocations((prev) => [newLoc, ...prev]);
      Alert.alert('Audit Submitted', 'Thank you! Your accessibility audit helps the entire community.');
      setAuditName('');
      setAuditAddress('');
      setAuditNotes('');
      setAuditRatings({ wheelchair: 3, vision: 3, hearing: 3, cognitive: 3 });
      setShowAuditForm(false);
    } else {
      Alert.alert('Coming Soon', 'On-chain audits will be available when the network launches.');
    }
    setLoading(false);
  }, [auditName, auditAddress, auditNotes, auditRatings, demoMode]);

  const handleSubmitBarrier = useCallback(async () => {
    if (!barrierLocation.trim() || !barrierDescription.trim()) {
      Alert.alert('Required', 'Please enter a location and description.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const newBarrier: BarrierReport = {
        id: `bar-${Date.now()}`,
        location: barrierLocation.trim(),
        category: barrierCategory,
        description: barrierDescription.trim(),
        reporter: 'you',
        reportDate: new Date().toISOString().split('T')[0],
        status: 'open',
        priority: 'medium',
      };
      setBarriers((prev) => [newBarrier, ...prev]);
      Alert.alert('Barrier Reported', 'Your report will help make this space accessible for everyone.');
      setBarrierLocation('');
      setBarrierDescription('');
      setBarrierCategory('other');
      setShowBarrierForm(false);
    } else {
      Alert.alert('Coming Soon', 'On-chain barrier reporting will be available when the network launches.');
    }
    setLoading(false);
  }, [barrierLocation, barrierDescription, barrierCategory, demoMode]);

  const renderRatingDots = useCallback((value: number) => (
    <View style={s.ratingDots}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[s.ratingDot, { backgroundColor: i <= value ? getScoreColor(value * 20) : t.border }]}
        />
      ))}
    </View>
  ), [s, t, getScoreColor]);

  const renderAuditTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'♿'}</Text>
        <Text style={s.heroTitle}>Community Accessibility</Text>
        <View style={[s.scoreCircle, { borderColor: getScoreColor(communityScore) }]}>
          <Text style={[s.scoreValue, { color: getScoreColor(communityScore) }]}>{communityScore}</Text>
        </View>
        <Text style={s.scoreLabel}>Community Score (0-100)</Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{locations.length}</Text>
            <Text style={s.statLabel}>Audited</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{barriers.filter((b) => b.status === 'open').length}</Text>
            <Text style={s.statLabel}>Open Barriers</Text>
          </View>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAuditForm(!showAuditForm)}>
          <Text style={s.addBtnText}>{showAuditForm ? 'Cancel' : 'Audit a Location'}</Text>
        </TouchableOpacity>
      </View>

      {showAuditForm && (
        <>
          <Text style={s.section}>New Accessibility Audit</Text>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Location Name</Text>
            <TextInput
              style={s.input}
              value={auditName}
              onChangeText={setAuditName}
              placeholder="e.g., Central Park Playground"
              placeholderTextColor={t.text.muted}
            />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Address</Text>
            <TextInput
              style={s.input}
              value={auditAddress}
              onChangeText={setAuditAddress}
              placeholder="e.g., 100 Park Avenue"
              placeholderTextColor={t.text.muted}
            />
          </View>
          {RATING_KEYS.map((key, idx) => (
            <View key={key} style={s.inputCard}>
              <Text style={s.inputLabel}>{RATING_LABELS[idx]} (1-5)</Text>
              <View style={s.ratingSelector}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      s.ratingSelectorBtn,
                      { borderColor: auditRatings[key] === val ? t.accent.blue : t.border, backgroundColor: auditRatings[key] === val ? t.accent.blue : 'transparent' },
                    ]}
                    onPress={() => setAuditRatings((prev) => ({ ...prev, [key]: val }))}
                  >
                    <Text style={[s.ratingSelectorText, { color: auditRatings[key] === val ? '#fff' : t.text.secondary }]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Notes</Text>
            <TextInput
              style={[s.input, s.descInput]}
              value={auditNotes}
              onChangeText={setAuditNotes}
              placeholder="Observations, issues, positives..."
              placeholderTextColor={t.text.muted}
              multiline
            />
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmitAudit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Submit Audit</Text>}
          </TouchableOpacity>
        </>
      )}

      <Text style={s.section}>Audited Locations ({locations.length})</Text>
      {locations.map((loc) => (
        <View key={loc.id} style={s.locCard}>
          <Text style={s.locName}>{loc.name}</Text>
          <Text style={s.locAddress}>{loc.address}</Text>
          <Text style={s.locType}>{loc.type}</Text>
          <View style={s.ratingRow}>
            {RATING_KEYS.map((key, idx) => (
              <View key={key} style={s.ratingItem}>
                <Text style={s.ratingLabel}>{RATING_LABELS[idx]}</Text>
                {renderRatingDots(loc.ratings[key])}
              </View>
            ))}
          </View>
          <Text style={[s.locScore, { color: getScoreColor(loc.overallScore) }]}>
            Overall: {loc.overallScore}/100
          </Text>
          {loc.notes ? <Text style={s.locNotes}>{loc.notes}</Text> : null}
          <Text style={s.locAuditor}>Audited by {loc.auditor} on {loc.auditDate}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderBarriersTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'🚧'}</Text>
        <Text style={s.heroTitle}>Report Barriers</Text>
        <Text style={s.heroSubtitle}>
          Broken ramps, missing signs, blocked paths —{'\n'}
          report them so they get fixed.
        </Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowBarrierForm(!showBarrierForm)}>
          <Text style={s.addBtnText}>{showBarrierForm ? 'Cancel' : 'Report a Barrier'}</Text>
        </TouchableOpacity>
      </View>

      {showBarrierForm && (
        <>
          <Text style={s.section}>New Barrier Report</Text>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Location</Text>
            <TextInput
              style={s.input}
              value={barrierLocation}
              onChangeText={setBarrierLocation}
              placeholder="Where is the barrier?"
              placeholderTextColor={t.text.muted}
            />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Category</Text>
            <View style={s.categoryRow}>
              {(Object.keys(CATEGORY_LABELS) as BarrierReport['category'][]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.categoryBtn, { borderColor: barrierCategory === cat ? t.accent.blue : t.border, backgroundColor: barrierCategory === cat ? t.accent.blue + '20' : 'transparent' }]}
                  onPress={() => setBarrierCategory(cat)}
                >
                  <Text style={[s.categoryBtnText, { color: barrierCategory === cat ? t.accent.blue : t.text.secondary }]}>{CATEGORY_LABELS[cat]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Description</Text>
            <TextInput
              style={[s.input, s.descInput]}
              value={barrierDescription}
              onChangeText={setBarrierDescription}
              placeholder="Describe the barrier and its impact..."
              placeholderTextColor={t.text.muted}
              multiline
            />
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmitBarrier} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Submit Report</Text>}
          </TouchableOpacity>
        </>
      )}

      <Text style={s.section}>Reported Barriers ({barriers.length})</Text>
      {barriers.length === 0 ? (
        <Text style={s.emptyText}>No barriers reported yet. Help your community by reporting accessibility issues.</Text>
      ) : (
        barriers.map((bar) => (
          <View key={bar.id} style={s.barrierCard}>
            <View style={s.barrierHeader}>
              <Text style={[s.barrierCategory, { color: t.accent.blue }]}>{CATEGORY_LABELS[bar.category]}</Text>
              <Text style={[s.barrierPriority, { backgroundColor: PRIORITY_COLORS[bar.priority] }]}>
                {bar.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={s.barrierLocation}>{bar.location}</Text>
            <Text style={s.barrierDesc}>{bar.description}</Text>
            <Text style={s.barrierStatus}>
              Status: {bar.status === 'in_progress' ? 'In Progress' : bar.status === 'open' ? 'Open' : 'Resolved'} | Reported {bar.reportDate}
            </Text>
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderGuidelinesTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'📋'}</Text>
        <Text style={s.heroTitle}>Universal Design Guidelines</Text>
        <Text style={s.heroSubtitle}>
          Best practices for creating inclusive spaces{'\n'}
          that work for everyone, regardless of ability.
        </Text>
      </View>
      {GUIDELINES.map((guide) => (
        <View key={guide.title} style={s.guideCard}>
          <Text style={s.guideTitle}>{guide.title}</Text>
          {guide.items.map((item, i) => (
            <Text key={i} style={s.guideItem}>{'\u2022'} {item}</Text>
          ))}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderChampionsTab = () => (
    <ScrollView>
      <View style={s.heroCard}>
        <Text style={s.heroEmoji}>{'🏆'}</Text>
        <Text style={s.heroTitle}>Accessibility Champions</Text>
        <Text style={s.heroSubtitle}>
          Volunteers who audit spaces and advocate{'\n'}
          for barrier-free communities.
        </Text>
      </View>
      <Text style={s.section}>Leaderboard</Text>
      {DEMO_CHAMPIONS.map((champ) => (
        <View key={champ.id} style={s.champCard}>
          <View style={[s.champBadge, { backgroundColor: BADGE_COLORS[champ.badgeLevel] + '30' }]}>
            <Text style={s.champBadgeText}>
              {champ.badgeLevel === 'platinum' ? '💎' : champ.badgeLevel === 'gold' ? '🥇' : champ.badgeLevel === 'silver' ? '🥈' : '🥉'}
            </Text>
          </View>
          <View style={s.champInfo}>
            <Text style={s.champName}>{champ.name}</Text>
            <Text style={s.champStats}>{champ.auditsCompleted} audits | {champ.barriersReported} barriers reported</Text>
            <Text style={[s.champLevel, { color: BADGE_COLORS[champ.badgeLevel] }]}>{champ.badgeLevel}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Barrier-Free</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, tab === key && s.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={tab === key ? s.tabTextActive : s.tabText}>{TAB_LABELS[key]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'audit' && renderAuditTab()}
      {tab === 'barriers' && renderBarriersTab()}
      {tab === 'guidelines' && renderGuidelinesTab()}
      {tab === 'champions' && renderChampionsTab()}
    </SafeAreaView>
  );
}
