import { fonts } from '../utils/theme';
/**
 * Disability Support Screen — Accessibility services & inclusion dashboard.
 *
 * Article IX: "Every person deserves full access to community life,
 * regardless of ability. Inclusion is a right, not a privilege."
 *
 * Features:
 * - Accessibility needs profile (mobility, vision, hearing, cognitive, chronic illness)
 * - Assistive resources directory (equipment lending, service animals, interpreters)
 * - Community accessibility map (wheelchair-friendly venues, braille signage, ramps)
 * - Advocacy — report accessibility barriers, track resolution
 * - Peer support network — connect with others with similar needs
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

type NeedCategory = 'mobility' | 'vision' | 'hearing' | 'cognitive' | 'chronic';

interface AccessibilityNeed {
  category: NeedCategory;
  label: string;
  severity: 'mild' | 'moderate' | 'significant';
  assistiveTools: string[];
  active: boolean;
}

interface AssistiveResource {
  id: string;
  name: string;
  type: 'equipment' | 'service_animal' | 'interpreter' | 'transport' | 'therapy';
  provider: string;
  available: boolean;
  distance: string;
  description: string;
}

interface AccessibleVenue {
  id: string;
  name: string;
  features: string[];
  rating: number; // 1-5 accessibility rating
  address: string;
  verified: boolean;
}

interface BarrierReport {
  id: string;
  location: string;
  type: string;
  description: string;
  status: 'reported' | 'under_review' | 'in_progress' | 'resolved';
  reportedDate: string;
  resolvedDate?: string;
}

interface PeerConnection {
  id: string;
  name: string;
  needs: NeedCategory[];
  sharedInterests: string[];
  lastActive: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const NEED_COLORS: Record<NeedCategory, string> = {
  mobility: '#007AFF',
  vision: '#AF52DE',
  hearing: '#FF9500',
  cognitive: '#34C759',
  chronic: '#FF3B30',
};

const NEED_ICONS: Record<NeedCategory, string> = {
  mobility: '\u267F',
  vision: '\uD83D\uDC41',
  hearing: '\uD83D\uDC42',
  cognitive: '\uD83E\uDDE0',
  chronic: '\u2764\uFE0F',
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: '#34C759',
  moderate: '#FF9500',
  significant: '#FF3B30',
};

const STATUS_COLORS: Record<string, string> = {
  reported: '#8E8E93',
  under_review: '#FF9500',
  in_progress: '#007AFF',
  resolved: '#34C759',
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  equipment: 'Equipment Lending',
  service_animal: 'Service Animal',
  interpreter: 'Interpreter',
  transport: 'Accessible Transport',
  therapy: 'Therapy Service',
};

// ─── Demo Data ───

const DEMO_NEEDS: AccessibilityNeed[] = [
  {
    category: 'mobility',
    label: 'Lower Limb Mobility',
    severity: 'moderate',
    assistiveTools: ['Wheelchair', 'Ramp access required', 'Accessible parking'],
    active: true,
  },
  {
    category: 'hearing',
    label: 'Partial Hearing Loss',
    severity: 'mild',
    assistiveTools: ['Hearing aid', 'Captioned media', 'Sign language interpreter'],
    active: true,
  },
];

const DEMO_RESOURCES: AssistiveResource[] = [
  {
    id: 'r1',
    name: 'Community Wheelchair Library',
    type: 'equipment',
    provider: 'Open Chain Mobility Hub',
    available: true,
    distance: '0.8 mi',
    description: 'Free short-term wheelchair lending. Manual and powered chairs available.',
  },
  {
    id: 'r2',
    name: 'ASL Interpreter Network',
    type: 'interpreter',
    provider: 'Regional Deaf Services',
    available: true,
    distance: 'Remote',
    description: 'On-demand ASL interpreters for appointments, meetings, and events.',
  },
  {
    id: 'r3',
    name: 'Accessible Ride Service',
    type: 'transport',
    provider: 'Community Transit Co-op',
    available: true,
    distance: '1.2 mi',
    description: 'Wheelchair-accessible vehicles with trained drivers. Book 24h in advance.',
  },
  {
    id: 'r4',
    name: 'Hearing Aid Loaner Program',
    type: 'equipment',
    provider: 'Lions Club Hearing Foundation',
    available: false,
    distance: '2.1 mi',
    description: 'Temporary hearing aids while yours is being repaired. Waitlist: ~3 days.',
  },
];

const DEMO_VENUES: AccessibleVenue[] = [
  {
    id: 'v1',
    name: 'Central Community Center',
    features: ['Wheelchair ramps', 'Elevator', 'Accessible restrooms', 'Hearing loop'],
    rating: 5,
    address: '100 Main St',
    verified: true,
  },
  {
    id: 'v2',
    name: 'Riverside Public Library',
    features: ['Braille signage', 'Wheelchair accessible', 'Large print collection', 'Audio books'],
    rating: 4,
    address: '250 River Rd',
    verified: true,
  },
  {
    id: 'v3',
    name: 'Green Park & Trail',
    features: ['Paved accessible path', 'Accessible parking', 'Rest benches every 200m'],
    rating: 3,
    address: '45 Park Ave',
    verified: false,
  },
];

const DEMO_BARRIERS: BarrierReport[] = [
  {
    id: 'b1',
    location: 'City Hall — East Entrance',
    type: 'Missing ramp',
    description: 'East entrance has 3 steps with no ramp alternative. Nearest accessible entrance is 200m away.',
    status: 'in_progress',
    reportedDate: '2026-03-15',
  },
  {
    id: 'b2',
    location: 'Metro Station — Platform B',
    type: 'Broken elevator',
    description: 'Elevator to Platform B has been out of service for 2 weeks. No temporary alternative provided.',
    status: 'under_review',
    reportedDate: '2026-03-22',
  },
  {
    id: 'b3',
    location: 'Maple Street Grocery',
    type: 'Narrow aisles',
    description: 'Aisles too narrow for wheelchair passage. Requested store redesign.',
    status: 'resolved',
    reportedDate: '2026-02-10',
    resolvedDate: '2026-03-05',
  },
];

const DEMO_PEERS: PeerConnection[] = [
  {
    id: 'p1',
    name: 'Sarah M.',
    needs: ['mobility'],
    sharedInterests: ['Adaptive sports', 'Advocacy'],
    lastActive: '2026-03-28',
  },
  {
    id: 'p2',
    name: 'James K.',
    needs: ['hearing'],
    sharedInterests: ['Music therapy', 'Tech accessibility'],
    lastActive: '2026-03-27',
  },
  {
    id: 'p3',
    name: 'Aisha R.',
    needs: ['mobility', 'chronic'],
    sharedInterests: ['Barrier reporting', 'Policy change'],
    lastActive: '2026-03-29',
  },
];

type Tab = 'profile' | 'resources' | 'accessibility' | 'advocacy';

export function DisabilitySupportScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const needs = DEMO_NEEDS;
  const resources = DEMO_RESOURCES;
  const venues = DEMO_VENUES;
  const barriers = DEMO_BARRIERS;
  const peers = DEMO_PEERS;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
    needCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    needHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    needIcon: { fontSize: fonts.xxl, marginRight: 10 },
    needLabel: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    severityText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    toolChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, marginBottom: 6 },
    toolText: { color: t.text.secondary, fontSize: fonts.sm },
    toolRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    resourceCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    resourceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    resourceName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    availBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    availText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    resourceType: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 4 },
    resourceProvider: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    resourceDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 },
    resourceDistance: { color: t.text.muted, fontSize: fonts.xs, marginTop: 6 },
    venueCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    venueName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    venueAddress: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 8 },
    venueRating: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    venueStars: { color: t.accent.orange, fontSize: fonts.md, marginRight: 6 },
    venueVerified: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap' },
    featureChip: { backgroundColor: t.accent.green + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
    featureText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    barrierCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    barrierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    barrierLocation: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    barrierType: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 4 },
    barrierDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 },
    barrierDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 6 },
    peerCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    peerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    peerName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    peerActive: { color: t.text.muted, fontSize: fonts.xs },
    peerNeeds: { flexDirection: 'row', marginBottom: 8 },
    peerNeedChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 6 },
    peerNeedText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.semibold },
    peerInterests: { color: t.text.secondary, fontSize: fonts.sm },
    connectBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    connectText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    reportBtn: { backgroundColor: t.accent.orange, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignSelf: 'center', marginTop: 8, marginBottom: 16 },
    reportText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    addNeedBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' },
    addNeedText: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'profile', label: 'Profile' },
    { key: 'resources', label: 'Resources' },
    { key: 'accessibility', label: 'Map' },
    { key: 'advocacy', label: 'Advocacy' },
  ];

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Every person deserves full access to community life.{'\n'}
          Your accessibility profile helps match you with resources{'\n'}
          and connect with supportive peers.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Your Accessibility Needs</Text>
      {needs.map((need) => (
        <View key={need.category} style={s.needCard}>
          <View style={s.needHeader}>
            <Text style={s.needIcon}>{NEED_ICONS[need.category]}</Text>
            <Text style={s.needLabel}>{need.label}</Text>
            <View style={[s.severityBadge, { backgroundColor: SEVERITY_COLORS[need.severity] }]}>
              <Text style={s.severityText}>{need.severity}</Text>
            </View>
          </View>
          <View style={s.toolRow}>
            {need.assistiveTools.map((tool) => (
              <View key={tool} style={s.toolChip}>
                <Text style={s.toolText}>{tool}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={s.addNeedBtn}
        onPress={() => Alert.alert('Add Need', 'Select a new accessibility need category to add to your profile.')}
      >
        <Text style={s.addNeedText}>+ Add Accessibility Need</Text>
      </TouchableOpacity>

      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{needs.length}</Text>
            <Text style={s.statLabel}>Active Needs</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{resources.filter((r) => r.available).length}</Text>
            <Text style={s.statLabel}>Resources Available</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{venues.length}</Text>
            <Text style={s.statLabel}>Accessible Venues</Text>
          </View>
        </View>
      </View>

      {/* Peer Support */}
      <Text style={s.sectionTitle}>Peer Support Network</Text>
      {peers.map((peer) => (
        <View key={peer.id} style={s.peerCard}>
          <View style={s.peerHeader}>
            <Text style={s.peerName}>{peer.name}</Text>
            <Text style={s.peerActive}>Active {peer.lastActive}</Text>
          </View>
          <View style={s.peerNeeds}>
            {peer.needs.map((need) => (
              <View key={need} style={[s.peerNeedChip, { backgroundColor: NEED_COLORS[need] }]}>
                <Text style={s.peerNeedText}>{need}</Text>
              </View>
            ))}
          </View>
          <Text style={s.peerInterests}>Interests: {peer.sharedInterests.join(', ')}</Text>
          <TouchableOpacity
            style={s.connectBtn}
            onPress={() => Alert.alert('Connect', `Send a connection request to ${peer.name}?`)}
          >
            <Text style={s.connectText}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Resources Tab ───

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Assistive Resources Directory</Text>
      {resources.map((res) => (
        <View key={res.id} style={s.resourceCard}>
          <View style={s.resourceHeader}>
            <Text style={s.resourceName}>{res.name}</Text>
            <View style={[s.availBadge, { backgroundColor: res.available ? t.accent.green + '20' : t.accent.red + '20' }]}>
              <Text style={[s.availText, { color: res.available ? t.accent.green : t.accent.red }]}>
                {res.available ? 'AVAILABLE' : 'WAITLIST'}
              </Text>
            </View>
          </View>
          <Text style={s.resourceType}>{RESOURCE_TYPE_LABELS[res.type] || res.type}</Text>
          <Text style={s.resourceProvider}>{res.provider}</Text>
          <Text style={s.resourceDesc}>{res.description}</Text>
          <Text style={s.resourceDistance}>{res.distance} away</Text>
        </View>
      ))}

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Know a resource that should be listed here?{'\n'}
          Community-sourced directories help everyone.
        </Text>
      </View>
    </>
  );

  // ─── Accessibility Map Tab ───

  const renderAccessibility = () => (
    <>
      <Text style={s.sectionTitle}>Community Accessibility Map</Text>
      {venues.map((venue) => (
        <View key={venue.id} style={s.venueCard}>
          <Text style={s.venueName}>{venue.name}</Text>
          <Text style={s.venueAddress}>{venue.address}</Text>
          <View style={s.venueRating}>
            <Text style={s.venueStars}>
              {'\u2605'.repeat(venue.rating)}{'\u2606'.repeat(5 - venue.rating)}
            </Text>
            {venue.verified && <Text style={s.venueVerified}>Verified</Text>}
          </View>
          <View style={s.featureRow}>
            {venue.features.map((feat) => (
              <View key={feat} style={s.featureChip}>
                <Text style={s.featureText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Help build the accessibility map.{'\n'}
          Rate venues you visit and report what works.
        </Text>
      </View>
    </>
  );

  // ─── Advocacy Tab ───

  const renderAdvocacy = () => (
    <>
      <Text style={s.sectionTitle}>Barrier Reports</Text>
      {barriers.map((barrier) => {
        const statusColor = STATUS_COLORS[barrier.status] || t.text.muted;
        return (
          <View key={barrier.id} style={s.barrierCard}>
            <View style={s.barrierHeader}>
              <Text style={s.barrierLocation}>{barrier.location}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={s.statusText}>{barrier.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={s.barrierType}>{barrier.type}</Text>
            <Text style={s.barrierDesc}>{barrier.description}</Text>
            <Text style={s.barrierDate}>
              Reported: {barrier.reportedDate}
              {barrier.resolvedDate ? ` | Resolved: ${barrier.resolvedDate}` : ''}
            </Text>
          </View>
        );
      })}

      <TouchableOpacity
        style={s.reportBtn}
        onPress={() => Alert.alert('Report Barrier', 'Describe the accessibility barrier you encountered. Your report helps improve access for everyone.')}
      >
        <Text style={s.reportText}>Report New Barrier</Text>
      </TouchableOpacity>

      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{barriers.length}</Text>
            <Text style={s.statLabel}>Total Reports</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{barriers.filter((b) => b.status === 'resolved').length}</Text>
            <Text style={s.statLabel}>Resolved</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.orange }]}>{barriers.filter((b) => b.status !== 'resolved').length}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Accessibility is a right, not a privilege.{'\n\n'}
          Every barrier you report moves us closer{'\n'}
          to a fully inclusive community.{'\n\n'}
          Together we build a world where everyone belongs.
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
        <Text style={s.title}>Disability Support</Text>
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
        {tab === 'resources' && renderResources()}
        {tab === 'accessibility' && renderAccessibility()}
        {tab === 'advocacy' && renderAdvocacy()}
      </ScrollView>
    </SafeAreaView>
  );
}
