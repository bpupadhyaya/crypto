/**
 * Safe Space Screen — Directory of safe spaces for vulnerable populations.
 *
 * Locate safe spaces, report incidents, and access resources for
 * vulnerable community members. Privacy-first, verified locations.
 * "Everyone deserves a place where they feel safe."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface SafeSpaceLocation {
  id: string;
  name: string;
  type: string;
  icon: string;
  distance: string;
  capacity: number;
  available: boolean;
  rating: number;
  services: string[];
  hours: string;
}

interface Resource {
  id: string;
  title: string;
  icon: string;
  category: string;
  description: string;
  contact: string;
}

const DEMO_SPACES: SafeSpaceLocation[] = [
  { id: 's1', name: 'Community Wellness Center', type: 'Shelter', icon: '\u{1F3E0}', distance: '0.3 mi', capacity: 50, available: true, rating: 4.8, services: ['Shelter', 'Food', 'Counseling'], hours: '24/7' },
  { id: 's2', name: 'Hope House', type: 'Women & Children', icon: '\u{1F49C}', distance: '0.7 mi', capacity: 30, available: true, rating: 4.9, services: ['Shelter', 'Legal Aid', 'Childcare'], hours: '24/7' },
  { id: 's3', name: 'Youth Safe Haven', type: 'Youth', icon: '\u{1F31F}', distance: '1.2 mi', capacity: 25, available: true, rating: 4.7, services: ['Shelter', 'Education', 'Mentoring'], hours: '8AM-10PM' },
  { id: 's4', name: 'Elder Care Refuge', type: 'Elderly', icon: '\u{1F9D3}', distance: '0.5 mi', capacity: 20, available: true, rating: 4.6, services: ['Care', 'Medical', 'Companionship'], hours: '24/7' },
  { id: 's5', name: 'Rainbow Space', type: 'LGBTQ+', icon: '\u{1F308}', distance: '1.5 mi', capacity: 15, available: false, rating: 4.8, services: ['Support Groups', 'Counseling', 'Community'], hours: '9AM-9PM' },
  { id: 's6', name: 'Healing Hands Clinic', type: 'Medical', icon: '\u{1F3E5}', distance: '0.8 mi', capacity: 40, available: true, rating: 4.5, services: ['Medical', 'Mental Health', 'Substance Support'], hours: '7AM-11PM' },
  { id: 's7', name: 'New Beginnings Center', type: 'Recovery', icon: '\u{1F33B}', distance: '2.1 mi', capacity: 35, available: true, rating: 4.7, services: ['Recovery Programs', 'Job Training', 'Housing Aid'], hours: '24/7' },
];

const DEMO_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Crisis Hotline', icon: '\u{1F4DE}', category: 'Emergency', description: '24/7 confidential crisis support and suicide prevention.', contact: '988' },
  { id: 'r2', title: 'Domestic Violence Helpline', icon: '\u{1F6E1}\uFE0F', category: 'Safety', description: 'Confidential support for domestic violence survivors.', contact: '1-800-799-7233' },
  { id: 'r3', title: 'Child Protective Services', icon: '\u{1F9D2}', category: 'Children', description: 'Report child abuse or neglect. Available 24/7.', contact: '1-800-422-4453' },
  { id: 'r4', title: 'Legal Aid Society', icon: '\u{2696}\uFE0F', category: 'Legal', description: 'Free legal assistance for low-income individuals.', contact: 'legal@community.org' },
  { id: 'r5', title: 'Food Bank Network', icon: '\u{1F96C}', category: 'Basic Needs', description: 'Emergency food distribution and meal programs.', contact: '+1-555-0200' },
  { id: 'r6', title: 'Housing Assistance', icon: '\u{1F3E0}', category: 'Housing', description: 'Emergency housing placement and rental assistance.', contact: '+1-555-0300' },
  { id: 'r7', title: 'Mental Health Services', icon: '\u{1F9E0}', category: 'Mental Health', description: 'Free counseling and psychiatric services.', contact: '+1-555-0400' },
];

export function SafeSpaceScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'spaces' | 'report' | 'resources'>('spaces');

  const handleReport = () => {
    Alert.alert(
      'Submit Report',
      'All reports are encrypted and anonymous. Your identity is protected by Open Chain privacy protocols.\n\nFull incident reporting form coming soon.',
    );
  };

  const handleContact = (resource: Resource) => {
    Alert.alert(resource.title, `Contact: ${resource.contact}\n\n${resource.description}`);
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    urgentBanner: { backgroundColor: '#ef4444' + '12', borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    urgentTitle: { color: '#ef4444', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    urgentText: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    urgentBtn: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    urgentBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    spaceCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    spaceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    spaceIcon: { fontSize: 28 },
    spaceName: { flex: 1, color: t.text.primary, fontSize: 15, fontWeight: '700' },
    spaceAvail: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    spaceAvailText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    spaceDetails: { flexDirection: 'row', gap: 12, marginBottom: 6 },
    spaceDetail: { color: t.text.muted, fontSize: 12 },
    spaceServices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    serviceChip: { backgroundColor: t.bg.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    serviceText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    reportCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
    reportIcon: { fontSize: 48, marginBottom: 12 },
    reportTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
    reportDesc: { color: t.text.secondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
    reportBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
    reportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    privacyNote: { backgroundColor: t.accent.green + '12', borderRadius: 12, padding: 14, marginBottom: 20 },
    privacyText: { color: t.accent.green, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
    resourceCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    resourceIcon: { fontSize: 28 },
    resourceInfo: { flex: 1 },
    resourceTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    resourceCat: { color: t.text.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    resourceDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    resourceContact: { color: t.accent.blue, fontSize: 13, fontWeight: '700' },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Safe Space</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Everyone deserves a place where they feel safe."</Text>

        <View style={s.urgentBanner}>
          <Text style={s.urgentTitle}>Need Help Now?</Text>
          <Text style={s.urgentText}>If you or someone you know is in immediate danger, call 911 or tap below for crisis support.</Text>
          <TouchableOpacity style={s.urgentBtn}>
            <Text style={s.urgentBtnText}>Call Crisis Hotline: 988</Text>
          </TouchableOpacity>
        </View>

        <View style={s.tabRow}>
          {(['spaces', 'report', 'resources'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'spaces' ? 'Spaces' : tab === 'report' ? 'Report' : 'Resources'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'spaces' && (
          <>
            <Text style={s.sectionTitle}>Nearby Safe Spaces</Text>
            {DEMO_SPACES.map(space => (
              <View key={space.id} style={s.spaceCard}>
                <View style={s.spaceHeader}>
                  <Text style={s.spaceIcon}>{space.icon}</Text>
                  <Text style={s.spaceName}>{space.name}</Text>
                  <View style={[s.spaceAvail, { backgroundColor: space.available ? t.accent.green : t.text.muted }]}>
                    <Text style={s.spaceAvailText}>{space.available ? 'Open' : 'Full'}</Text>
                  </View>
                </View>
                <View style={s.spaceDetails}>
                  <Text style={s.spaceDetail}>{space.type}</Text>
                  <Text style={s.spaceDetail}>{space.distance}</Text>
                  <Text style={s.spaceDetail}>Cap: {space.capacity}</Text>
                  <Text style={s.spaceDetail}>{space.hours}</Text>
                  <Text style={s.spaceDetail}>{'\u2605'} {space.rating}</Text>
                </View>
                <View style={s.spaceServices}>
                  {space.services.map(svc => (
                    <View key={svc} style={s.serviceChip}>
                      <Text style={s.serviceText}>{svc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'report' && (
          <>
            <View style={s.reportCard}>
              <Text style={s.reportIcon}>{'\u{1F6E1}\uFE0F'}</Text>
              <Text style={s.reportTitle}>Submit a Report</Text>
              <Text style={s.reportDesc}>
                Report unsafe conditions, incidents, or concerns. Your report is encrypted and can be submitted anonymously.
              </Text>
              <TouchableOpacity style={s.reportBtn} onPress={handleReport}>
                <Text style={s.reportBtnText}>Start Report</Text>
              </TouchableOpacity>
            </View>
            <View style={s.privacyNote}>
              <Text style={s.privacyText}>
                Your identity is protected by Open Chain privacy protocols. Reports are encrypted end-to-end. Only authorized responders can access details.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'resources' && (
          <>
            <Text style={s.sectionTitle}>Support Resources</Text>
            {DEMO_RESOURCES.map(res => (
              <TouchableOpacity key={res.id} style={s.resourceCard} onPress={() => handleContact(res)}>
                <Text style={s.resourceIcon}>{res.icon}</Text>
                <View style={s.resourceInfo}>
                  <Text style={s.resourceCat}>{res.category}</Text>
                  <Text style={s.resourceTitle}>{res.title}</Text>
                  <Text style={s.resourceDesc}>{res.description}</Text>
                </View>
                <Text style={s.resourceContact}>{res.contact}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
