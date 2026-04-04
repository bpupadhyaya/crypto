import { fonts } from '../utils/theme';
/**
 * Accessibility Map Screen — Map of wheelchair/hearing/vision-accessible locations.
 *
 * Features:
 * - Browse accessible locations by category
 * - Rate accessibility of locations
 * - Report accessibility issues
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

interface AccessibleLocation {
  id: string;
  name: string;
  address: string;
  category: string;
  wheelchair: number;
  hearing: number;
  vision: number;
  overall: number;
  reviews: number;
  features: string[];
}

interface AccessReport {
  id: string;
  location: string;
  issue: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  date: string;
  upvotes: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_LOCATIONS: AccessibleLocation[] = [
  { id: 'l1', name: 'City Hall', address: '100 Main St', category: 'Government', wheelchair: 4.5, hearing: 3.8, vision: 4.0, overall: 4.1, reviews: 45, features: ['Ramp entry', 'Elevator', 'Hearing loop', 'Braille signage'] },
  { id: 'l2', name: 'Central Library', address: '200 Book Ave', category: 'Library', wheelchair: 4.8, hearing: 4.2, vision: 4.5, overall: 4.5, reviews: 72, features: ['Auto doors', 'Elevator', 'Large print', 'Screen readers', 'Quiet room'] },
  { id: 'l3', name: 'Green Park', address: '300 Park Ln', category: 'Park', wheelchair: 3.2, hearing: 4.5, vision: 3.0, overall: 3.6, reviews: 38, features: ['Paved paths', 'Accessible restroom'] },
  { id: 'l4', name: 'Community Health Center', address: '400 Health St', category: 'Healthcare', wheelchair: 4.7, hearing: 4.0, vision: 4.3, overall: 4.3, reviews: 56, features: ['Ramp entry', 'Elevator', 'Sign language', 'Tactile maps'] },
  { id: 'l5', name: 'Metro Station - Central', address: '500 Transit Rd', category: 'Transport', wheelchair: 3.5, hearing: 3.0, vision: 3.2, overall: 3.2, reviews: 89, features: ['Elevator (often broken)', 'Tactile strips'] },
  { id: 'l6', name: 'Riverside Shopping Center', address: '600 Commerce Blvd', category: 'Shopping', wheelchair: 4.2, hearing: 3.5, vision: 3.8, overall: 3.8, reviews: 63, features: ['Auto doors', 'Elevator', 'Accessible parking'] },
];

const DEMO_REPORTS: AccessReport[] = [
  { id: 'ar1', location: 'Metro Station - Central', issue: 'Elevator out of service for 2 weeks', category: 'Wheelchair', status: 'open', date: '2026-03-27', upvotes: 156 },
  { id: 'ar2', location: 'Green Park', issue: 'Path near playground needs repaving', category: 'Wheelchair', status: 'in-progress', date: '2026-03-20', upvotes: 42 },
  { id: 'ar3', location: 'City Hall', issue: 'Hearing loop not working in Room 204', category: 'Hearing', status: 'resolved', date: '2026-03-10', upvotes: 28 },
  { id: 'ar4', location: 'Riverside Shopping Center', issue: 'Missing Braille on restroom signs', category: 'Vision', status: 'open', date: '2026-03-25', upvotes: 35 },
  { id: 'ar5', location: 'Metro Station - Central', issue: 'No audio announcements on Platform 2', category: 'Vision', status: 'open', date: '2026-03-28', upvotes: 78 },
];

const STATUS_COLORS: Record<string, string> = { open: '#FF3B30', 'in-progress': '#FF9500', resolved: '#34C759' };

type Tab = 'map' | 'rate' | 'report';

export function AccessibilityMapScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('map');
  const [ratingLocation, setRatingLocation] = useState('');
  const [ratingWheelchair, setRatingWheelchair] = useState('');
  const [ratingHearing, setRatingHearing] = useState('');
  const [ratingVision, setRatingVision] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportIssue, setReportIssue] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleRate = useCallback(() => {
    if (!ratingLocation) { Alert.alert('Required', 'Select a location.'); return; }
    Alert.alert('Rating Submitted', `Thank you for rating ${ratingLocation}. Your feedback helps others!`);
    setRatingLocation(''); setRatingWheelchair(''); setRatingHearing(''); setRatingVision('');
  }, [ratingLocation]);

  const handleReport = useCallback(() => {
    if (!reportLocation.trim()) { Alert.alert('Required', 'Enter the location.'); return; }
    if (!reportIssue.trim()) { Alert.alert('Required', 'Describe the issue.'); return; }
    Alert.alert('Report Submitted', 'Your accessibility report has been submitted. The community will review it.');
    setReportLocation(''); setReportIssue('');
  }, [reportLocation, reportIssue]);

  const getScoreColor = (score: number) => score >= 4 ? '#34C759' : score >= 3 ? '#FF9500' : '#FF3B30';

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    locCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    locName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    locMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    scoreItem: { alignItems: 'center' },
    scoreValue: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    featureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    featureTag: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    featureText: { color: t.text.muted, fontSize: fonts.xs },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    chipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    chipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    chipTextSelected: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    labelText: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 6, fontWeight: fonts.semibold },
    reportCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    reportLoc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    reportIssue: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 19 },
    reportMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    statusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'map', label: 'Map' },
    { key: 'rate', label: 'Rate' },
    { key: 'report', label: 'Report' },
  ];

  const renderMap = () => (
    <>
      <Text style={s.sectionTitle}>Accessible Locations</Text>
      {DEMO_LOCATIONS.map((loc) => (
        <View key={loc.id} style={s.locCard}>
          <Text style={s.locName}>{loc.name}</Text>
          <Text style={s.locMeta}>{loc.address} | {loc.category} | {loc.reviews} reviews</Text>
          <View style={s.scoreRow}>
            <View style={s.scoreItem}>
              <Text style={[s.scoreValue, { color: getScoreColor(loc.wheelchair) }]}>{loc.wheelchair}</Text>
              <Text style={s.scoreLabel}>Wheelchair</Text>
            </View>
            <View style={s.scoreItem}>
              <Text style={[s.scoreValue, { color: getScoreColor(loc.hearing) }]}>{loc.hearing}</Text>
              <Text style={s.scoreLabel}>Hearing</Text>
            </View>
            <View style={s.scoreItem}>
              <Text style={[s.scoreValue, { color: getScoreColor(loc.vision) }]}>{loc.vision}</Text>
              <Text style={s.scoreLabel}>Vision</Text>
            </View>
            <View style={s.scoreItem}>
              <Text style={[s.scoreValue, { color: getScoreColor(loc.overall) }]}>{loc.overall}</Text>
              <Text style={s.scoreLabel}>Overall</Text>
            </View>
          </View>
          <View style={s.featureTags}>
            {loc.features.map((f) => (
              <View key={f} style={s.featureTag}><Text style={s.featureText}>{f}</Text></View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  const renderRate = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Rate Accessibility</Text>
      <Text style={s.labelText}>Select Location</Text>
      <View style={s.chipGrid}>
        {DEMO_LOCATIONS.map((loc) => (
          <TouchableOpacity key={loc.id} style={[s.chip, ratingLocation === loc.name && s.chipSelected]} onPress={() => setRatingLocation(loc.name)}>
            <Text style={[s.chipText, ratingLocation === loc.name && s.chipTextSelected]}>{loc.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Wheelchair access (1-5)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={ratingWheelchair} onChangeText={setRatingWheelchair} />
      <TextInput style={s.input} placeholder="Hearing access (1-5)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={ratingHearing} onChangeText={setRatingHearing} />
      <TextInput style={s.input} placeholder="Vision access (1-5)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={ratingVision} onChangeText={setRatingVision} />
      <TouchableOpacity style={s.submitBtn} onPress={handleRate}>
        <Text style={s.submitText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReport = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Report an Issue</Text>
        <TextInput style={s.input} placeholder="Location name" placeholderTextColor={t.text.muted} value={reportLocation} onChangeText={setReportLocation} />
        <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Describe the accessibility issue..." placeholderTextColor={t.text.muted} value={reportIssue} onChangeText={setReportIssue} multiline />
        <TouchableOpacity style={s.submitBtn} onPress={handleReport}>
          <Text style={s.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.sectionTitle}>Recent Reports</Text>
      {DEMO_REPORTS.map((r) => (
        <View key={r.id} style={s.reportCard}>
          <Text style={s.reportLoc}>{r.location}</Text>
          <Text style={s.reportIssue}>{r.issue}</Text>
          <Text style={s.reportMeta}>{r.category} | {r.date} | {r.upvotes} upvotes</Text>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[r.status] }]}>
            <Text style={s.statusText}>{r.status}</Text>
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
        <Text style={s.title}>Accessibility Map</Text>
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
        {tab === 'map' && renderMap()}
        {tab === 'rate' && renderRate()}
        {tab === 'report' && renderReport()}
      </ScrollView>
    </SafeAreaView>
  );
}
