import { fonts } from '../utils/theme';
/**
 * Allergy Screen — Allergy management and community allergy awareness.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents health value — managing allergies protects community wellbeing.
 *
 * Features:
 * - My allergies profile (food, environmental, medication, insect — severity levels)
 * - Allergy alerts (pollen count, air quality, food recalls in region)
 * - Allergy-friendly venues (restaurants, events, spaces that accommodate)
 * - Emergency action plan (epinephrine locations, emergency procedures)
 * - Community allergy awareness education
 * - Share allergy card (QR for restaurants, events, caregivers)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

type AllergyCategory = 'food' | 'environmental' | 'medication' | 'insect';
type Severity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

interface Allergy {
  id: string;
  name: string;
  category: AllergyCategory;
  severity: Severity;
  triggers: string[];
  diagnosed: string;
  notes: string;
}

interface AllergyAlert {
  id: string;
  type: 'pollen' | 'air_quality' | 'food_recall';
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high';
  region: string;
  date: string;
  active: boolean;
}

interface AllergyFriendlyVenue {
  id: string;
  name: string;
  type: 'restaurant' | 'event' | 'space';
  accommodations: string[];
  rating: number;
  distance: string;
  verified: boolean;
}

interface EmergencyAction {
  id: string;
  step: number;
  title: string;
  description: string;
  critical: boolean;
}

interface EpinephrineLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  available: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const ALLERGY_CATEGORIES: Array<{ key: AllergyCategory; label: string; icon: string }> = [
  { key: 'food', label: 'Food', icon: 'F' },
  { key: 'environmental', label: 'Environmental', icon: 'E' },
  { key: 'medication', label: 'Medication', icon: 'M' },
  { key: 'insect', label: 'Insect', icon: 'I' },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  'mild': '#34C759',
  'moderate': '#FF9500',
  'severe': '#FF3B30',
  'life-threatening': '#AF52DE',
};

const ALERT_SEVERITY_COLORS: Record<string, string> = {
  low: '#34C759',
  moderate: '#FF9500',
  high: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_ALLERGIES: Allergy[] = [
  {
    id: '1', name: 'Peanuts', category: 'food', severity: 'life-threatening',
    triggers: ['Peanut butter', 'Tree nuts', 'Cross-contaminated foods'],
    diagnosed: '2018-06-15', notes: 'Carry epinephrine at all times.',
  },
  {
    id: '2', name: 'Pollen (Birch)', category: 'environmental', severity: 'moderate',
    triggers: ['Spring birch pollen', 'Oral allergy syndrome with apples'],
    diagnosed: '2020-03-01', notes: 'Seasonal — worst in April/May.',
  },
  {
    id: '3', name: 'Penicillin', category: 'medication', severity: 'severe',
    triggers: ['Penicillin', 'Amoxicillin', 'Related beta-lactam antibiotics'],
    diagnosed: '2015-11-20', notes: 'Use azithromycin or fluoroquinolones instead.',
  },
];

const DEMO_ALERTS: AllergyAlert[] = [
  {
    id: '1', type: 'pollen', title: 'High Pollen Count — Birch',
    description: 'Birch pollen levels are very high in your region today. Limit outdoor exposure if sensitive.',
    severity: 'high', region: 'Metro Area', date: '2026-03-29', active: true,
  },
  {
    id: '2', type: 'food_recall', title: 'Snack Bar Recall — Undeclared Peanuts',
    description: 'NutriBar brand "Berry Blast" bars recalled due to undeclared peanut protein. Lot #2026-A through 2026-D.',
    severity: 'high', region: 'Nationwide', date: '2026-03-28', active: true,
  },
];

const DEMO_VENUES: AllergyFriendlyVenue[] = [
  {
    id: '1', name: 'Green Leaf Bistro', type: 'restaurant',
    accommodations: ['Nut-free kitchen', 'Allergen menu available', 'Staff trained'],
    rating: 4.8, distance: '0.5 mi', verified: true,
  },
  {
    id: '2', name: 'Safe Eats Cafe', type: 'restaurant',
    accommodations: ['Top-8 allergen free', 'Dedicated prep area', 'EpiPen on site'],
    rating: 4.9, distance: '1.2 mi', verified: true,
  },
  {
    id: '3', name: 'Community Park Festival', type: 'event',
    accommodations: ['Allergen-labeled food vendors', 'Medical tent with epinephrine'],
    rating: 4.5, distance: '2.0 mi', verified: true,
  },
  {
    id: '4', name: 'Harmony Coworking Space', type: 'space',
    accommodations: ['Nut-free policy', 'HEPA air filtration', 'Scent-free zone'],
    rating: 4.6, distance: '0.8 mi', verified: false,
  },
];

const DEMO_EMERGENCY_ACTIONS: EmergencyAction[] = [
  { id: '1', step: 1, title: 'Recognize Symptoms', description: 'Hives, swelling, difficulty breathing, dizziness, rapid pulse. Any combination = act immediately.', critical: true },
  { id: '2', step: 2, title: 'Administer Epinephrine', description: 'Use auto-injector on outer thigh. Can inject through clothing. Hold for 10 seconds.', critical: true },
  { id: '3', step: 3, title: 'Call Emergency Services', description: 'Call 911 immediately. State "anaphylaxis in progress." Give location clearly.', critical: true },
  { id: '4', step: 4, title: 'Position & Monitor', description: 'Lie flat with legs elevated (unless breathing difficulty — sit up). Stay with person. Second dose in 5-15 min if no improvement.', critical: false },
  { id: '5', step: 5, title: 'Inform Responders', description: 'Show allergy card. State known allergens, medications given, and time of onset.', critical: false },
];

const DEMO_EPI_LOCATIONS: EpinephrineLocation[] = [
  { id: '1', name: 'Community Pharmacy', address: '123 Main St', distance: '0.3 mi', available: true },
  { id: '2', name: 'Fire Station #7', address: '456 Oak Ave', distance: '0.6 mi', available: true },
  { id: '3', name: 'School Nurse Office', address: '789 Elm Dr', distance: '0.9 mi', available: true },
];

type Tab = 'profile' | 'alerts' | 'venues' | 'emergency';

export function AllergyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const allergies = DEMO_ALLERGIES;
  const alerts = DEMO_ALERTS;
  const venues = DEMO_VENUES;
  const emergencyActions = DEMO_EMERGENCY_ACTIONS;
  const epiLocations = DEMO_EPI_LOCATIONS;

  const handleShareCard = useCallback(() => {
    Alert.alert(
      'Share Allergy Card',
      'Generate a QR code containing your allergy profile.\nSafe to share with restaurants, events, and caregivers.\n\nNo personal health data is stored on-chain — only the QR hash for verification.',
    );
  }, []);

  const handleReportVenue = useCallback((venue: AllergyFriendlyVenue) => {
    Alert.alert(
      venue.name,
      `${venue.accommodations.join(', ')}\n\nRating: ${venue.rating}/5 | ${venue.distance}\n${venue.verified ? 'Community Verified' : 'Awaiting Verification'}`,
    );
  }, []);

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
    allergyRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    allergyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    allergyName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    severityText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    allergyCategory: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    allergyTriggers: { color: t.text.primary, fontSize: 13, marginTop: 6, lineHeight: 20 },
    allergyNotes: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
    alertRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, flex: 1, marginRight: 8 },
    alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    alertBadgeText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    alertDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    alertMeta: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    venueRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    venueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    venueName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    venueType: { color: t.text.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: fonts.semibold },
    venueAccommodations: { color: t.text.primary, fontSize: 13, marginTop: 6, lineHeight: 20 },
    venueStats: { flexDirection: 'row', marginTop: 6, gap: 12 },
    venueStat: { color: t.text.muted, fontSize: 12 },
    venueVerified: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    emergencyStep: { flexDirection: 'row', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    stepNumber: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    stepNumberText: { color: '#fff', fontSize: 14, fontWeight: fonts.heavy },
    stepContent: { flex: 1 },
    stepTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    stepDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 20 },
    criticalTag: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    criticalText: { color: '#FF3B30', fontSize: 10, fontWeight: fonts.bold },
    epiCard: { backgroundColor: t.accent.green + '12', borderRadius: 12, padding: 14, marginTop: 8 },
    epiName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    epiAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    epiStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    epiDistance: { color: t.text.muted, fontSize: 12 },
    epiAvailable: { fontSize: 12, fontWeight: fonts.semibold },
    shareBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    shareBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    educationCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'profile', label: 'My Allergies' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'venues', label: 'Venues' },
    { key: 'emergency', label: 'Emergency' },
  ];

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{allergies.length}</Text>
            <Text style={s.statLabel}>Known Allergies</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#FF3B30' }]}>
              {allergies.filter((a) => a.severity === 'life-threatening' || a.severity === 'severe').length}
            </Text>
            <Text style={s.statLabel}>Severe / Critical</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>
              {ALLERGY_CATEGORIES.filter((c) => allergies.some((a) => a.category === c.key)).length}
            </Text>
            <Text style={s.statLabel}>Categories</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>My Allergies</Text>
      <View style={s.card}>
        {allergies.map((allergy, i) => (
          <View key={allergy.id} style={[s.allergyRow, i === allergies.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={s.allergyHeader}>
              <Text style={s.allergyName}>{allergy.name}</Text>
              <View style={[s.severityBadge, { backgroundColor: SEVERITY_COLORS[allergy.severity] }]}>
                <Text style={s.severityText}>{allergy.severity}</Text>
              </View>
            </View>
            <Text style={s.allergyCategory}>
              {ALLERGY_CATEGORIES.find((c) => c.key === allergy.category)?.label} | Diagnosed {allergy.diagnosed}
            </Text>
            <Text style={s.allergyTriggers}>Triggers: {allergy.triggers.join(', ')}</Text>
            <Text style={s.allergyNotes}>{allergy.notes}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.shareBtn} onPress={handleShareCard}>
        <Text style={s.shareBtnText}>Share Allergy Card (QR)</Text>
      </TouchableOpacity>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Your allergy data stays on your device.{'\n'}
          The QR card shares only what you approve.{'\n'}
          No health data is stored on-chain.
        </Text>
      </View>
    </>
  );

  // ─── Alerts Tab ───

  const renderAlerts = () => (
    <>
      <Text style={s.sectionTitle}>Active Allergy Alerts</Text>
      {alerts.length === 0 ? (
        <View style={s.card}>
          <Text style={[s.educationText, { color: t.text.muted }]}>No active alerts in your region.</Text>
        </View>
      ) : (
        <View style={s.card}>
          {alerts.map((alert, i) => (
            <View key={alert.id} style={[s.alertRow, i === alerts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.alertHeader}>
                <Text style={s.alertTitle}>{alert.title}</Text>
                <View style={[s.alertBadge, { backgroundColor: ALERT_SEVERITY_COLORS[alert.severity] }]}>
                  <Text style={s.alertBadgeText}>{alert.severity}</Text>
                </View>
              </View>
              <Text style={s.alertDesc}>{alert.description}</Text>
              <Text style={s.alertMeta}>{alert.date} | {alert.region} | {alert.type.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Alerts are matched to your allergy profile.{'\n'}
          Pollen, air quality, and food recall data{'\n'}
          sourced from public health agencies.{'\n\n'}
          Community awareness protects everyone.
        </Text>
      </View>
    </>
  );

  // ─── Venues Tab ───

  const renderVenues = () => (
    <>
      <Text style={s.sectionTitle}>Allergy-Friendly Venues</Text>
      <View style={s.card}>
        {venues.map((venue, i) => (
          <TouchableOpacity
            key={venue.id}
            style={[s.venueRow, i === venues.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => handleReportVenue(venue)}
          >
            <View style={s.venueHeader}>
              <Text style={s.venueName}>{venue.name}</Text>
              <Text style={s.venueType}>{venue.type}</Text>
            </View>
            <Text style={s.venueAccommodations}>{venue.accommodations.join(' | ')}</Text>
            <View style={s.venueStats}>
              <Text style={s.venueStat}>{venue.rating}/5</Text>
              <Text style={s.venueStat}>{venue.distance}</Text>
              <Text style={venue.verified ? s.venueVerified : s.venueStat}>
                {venue.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Venues are community-verified.{'\n'}
          Contribute by reviewing allergy-friendly{'\n'}
          restaurants, events, and spaces near you.
        </Text>
      </View>
    </>
  );

  // ─── Emergency Tab ───

  const renderEmergency = () => (
    <>
      <Text style={s.sectionTitle}>Emergency Action Plan</Text>
      <View style={s.card}>
        {emergencyActions.map((action, i) => (
          <View key={action.id} style={[s.emergencyStep, i === emergencyActions.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.stepNumber, { backgroundColor: action.critical ? '#FF3B30' : t.accent.blue }]}>
              <Text style={s.stepNumberText}>{action.step}</Text>
            </View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>{action.title}</Text>
              <Text style={s.stepDesc}>{action.description}</Text>
              {action.critical && (
                <View style={s.criticalTag}>
                  <Text style={s.criticalText}>CRITICAL</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Nearest Epinephrine Locations</Text>
      {epiLocations.map((loc) => (
        <View key={loc.id} style={[s.card, { marginBottom: 10 }]}>
          <View style={s.epiCard}>
            <Text style={s.epiName}>{loc.name}</Text>
            <Text style={s.epiAddress}>{loc.address}</Text>
            <View style={s.epiStats}>
              <Text style={s.epiDistance}>{loc.distance}</Text>
              <Text style={[s.epiAvailable, { color: loc.available ? t.accent.green : '#FF3B30' }]}>
                {loc.available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.shareBtn} onPress={handleShareCard}>
        <Text style={s.shareBtnText}>Share Allergy Card (QR)</Text>
      </TouchableOpacity>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Share your allergy card with a QR code.{'\n'}
          Restaurants, event staff, and caregivers{'\n'}
          can scan to see your critical allergies.{'\n\n'}
          Seconds matter in anaphylaxis.
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
        <Text style={s.title}>Allergies</Text>
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
        {tab === 'alerts' && renderAlerts()}
        {tab === 'venues' && renderVenues()}
        {tab === 'emergency' && renderEmergency()}
      </ScrollView>
    </SafeAreaView>
  );
}
