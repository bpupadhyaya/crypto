import { fonts } from '../utils/theme';
/**
 * Emergency Kit Screen — Digital emergency kit: important docs, contacts, plans.
 *
 * One secure place for everything you need in an emergency: verified documents,
 * emergency contacts, and action plans. Encrypted on-chain, accessible anywhere.
 * "Prepared people protect communities."
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

interface EmergencyDoc {
  id: string;
  title: string;
  type: string;
  icon: string;
  verified: boolean;
  lastUpdated: string;
  expiresAt: string | null;
}

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  icon: string;
  priority: number;
}

interface ActionStep {
  id: string;
  order: number;
  title: string;
  description: string;
  completed: boolean;
}

const DEMO_DOCS: EmergencyDoc[] = [
  { id: 'd1', title: 'Medical ID Card', type: 'Medical', icon: '\u{1F3E5}', verified: true, lastUpdated: '2026-02-15', expiresAt: '2027-02-15' },
  { id: 'd2', title: 'Insurance Policy', type: 'Insurance', icon: '\u{1F4CB}', verified: true, lastUpdated: '2026-01-10', expiresAt: '2027-01-10' },
  { id: 'd3', title: 'Passport Copy', type: 'Identity', icon: '\u{1F4D8}', verified: true, lastUpdated: '2025-11-20', expiresAt: '2031-11-20' },
  { id: 'd4', title: 'Blood Type Record', type: 'Medical', icon: '\u{1FA78}', verified: true, lastUpdated: '2025-08-05', expiresAt: null },
  { id: 'd5', title: 'Allergy List', type: 'Medical', icon: '\u26A0\uFE0F', verified: false, lastUpdated: '2026-03-01', expiresAt: null },
  { id: 'd6', title: 'Home Deed', type: 'Property', icon: '\u{1F3E0}', verified: true, lastUpdated: '2024-06-15', expiresAt: null },
];

const DEMO_CONTACTS: EmergencyContact[] = [
  { id: 'c1', name: 'Dr. Anita Sharma', relation: 'Family Doctor', phone: '+1-555-0101', icon: '\u{1F469}\u200D\u2695\uFE0F', priority: 1 },
  { id: 'c2', name: 'Rajesh Patel', relation: 'Spouse', phone: '+1-555-0102', icon: '\u{1F468}', priority: 1 },
  { id: 'c3', name: 'Maya Krishnan', relation: 'Neighbor / First Aid', phone: '+1-555-0103', icon: '\u{1F469}', priority: 2 },
  { id: 'c4', name: 'Community Center', relation: 'Safe Shelter', phone: '+1-555-0104', icon: '\u{1F3DB}\uFE0F', priority: 2 },
  { id: 'c5', name: 'Fire Department', relation: 'Emergency Service', phone: '911', icon: '\u{1F6A8}', priority: 1 },
];

const DEMO_PLAN: ActionStep[] = [
  { id: 's1', order: 1, title: 'Ensure personal safety', description: 'Move to a safe location. Check for injuries on yourself and family members.', completed: false },
  { id: 's2', order: 2, title: 'Call emergency services', description: 'Dial 911 or local emergency number. Provide location and situation details.', completed: false },
  { id: 's3', order: 3, title: 'Contact family members', description: 'Use the priority contact list above. Confirm everyone is safe.', completed: false },
  { id: 's4', order: 4, title: 'Grab emergency go-bag', description: 'Located by the front door. Contains water, first aid, flashlight, charger.', completed: false },
  { id: 's5', order: 5, title: 'Head to meeting point', description: 'Family meeting point: Community Center parking lot, NE corner.', completed: false },
  { id: 's6', order: 6, title: 'Notify community network', description: 'Send status update via Open Chain community alert system.', completed: false },
  { id: 's7', order: 7, title: 'Document the situation', description: 'Take photos, note damage, save timestamps for insurance claims.', completed: false },
];

export function EmergencyKitScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'documents' | 'contacts' | 'plan'>('documents');
  const [planSteps, setPlanSteps] = useState(DEMO_PLAN);

  const toggleStep = (id: string) => {
    setPlanSteps(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleAddDoc = () => Alert.alert('Add Document', 'Upload and verify a new emergency document. Encrypted storage on Open Chain.');
  const handleAddContact = () => Alert.alert('Add Contact', 'Add a new emergency contact to your kit.');

  const completedSteps = planSteps.filter(s => s.completed).length;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    warningBanner: { backgroundColor: '#ef4444' + '15', borderRadius: 12, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    warningText: { color: '#ef4444', fontSize: 13, fontWeight: fonts.semibold, lineHeight: 20 },
    docCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    docIcon: { fontSize: 28 },
    docInfo: { flex: 1 },
    docTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    docMeta: { color: t.text.muted, fontSize: 12 },
    docBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    docBadgeText: { fontSize: 10, fontWeight: fonts.bold },
    addBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: t.accent.blue + '30', borderStyle: 'dashed' },
    addBtnText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.bold },
    contactCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    contactIcon: { fontSize: 28 },
    contactInfo: { flex: 1 },
    contactName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    contactRelation: { color: t.text.secondary, fontSize: 12 },
    contactPhone: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    priorityDot: { width: 10, height: 10, borderRadius: 5 },
    progressCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 20 },
    progressTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8 },
    progressBarBg: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    progressLabel: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    stepCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    stepCheckText: { color: '#fff', fontSize: 12, fontWeight: fonts.heavy },
    stepInfo: { flex: 1 },
    stepTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 2 },
    stepDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    stepNum: { color: t.text.muted, fontSize: 11, fontWeight: fonts.bold, marginTop: 4 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Emergency Kit</Text>
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

        <Text style={s.quote}>"Prepared people protect communities."</Text>

        <View style={s.tabRow}>
          {(['documents', 'contacts', 'plan'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'documents' ? 'Documents' : tab === 'contacts' ? 'Contacts' : 'Plan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'documents' && (
          <>
            <View style={s.warningBanner}>
              <Text style={s.warningText}>All documents are encrypted and stored on-chain. Only you and your designated contacts can access them.</Text>
            </View>
            {DEMO_DOCS.map(doc => (
              <View key={doc.id} style={s.docCard}>
                <Text style={s.docIcon}>{doc.icon}</Text>
                <View style={s.docInfo}>
                  <Text style={s.docTitle}>{doc.title}</Text>
                  <Text style={s.docMeta}>{doc.type} \u00B7 Updated {doc.lastUpdated}{doc.expiresAt ? ` \u00B7 Exp ${doc.expiresAt}` : ''}</Text>
                </View>
                <View style={[s.docBadge, { backgroundColor: doc.verified ? t.accent.green + '20' : t.accent.yellow + '20' }]}>
                  <Text style={[s.docBadgeText, { color: doc.verified ? t.accent.green : t.accent.yellow }]}>{doc.verified ? 'Verified' : 'Pending'}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={handleAddDoc}>
              <Text style={s.addBtnText}>+ Add Document</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'contacts' && (
          <>
            <Text style={s.sectionTitle}>Emergency Contacts</Text>
            {DEMO_CONTACTS.map(c => (
              <View key={c.id} style={s.contactCard}>
                <Text style={s.contactIcon}>{c.icon}</Text>
                <View style={s.contactInfo}>
                  <Text style={s.contactName}>{c.name}</Text>
                  <Text style={s.contactRelation}>{c.relation}</Text>
                </View>
                <Text style={s.contactPhone}>{c.phone}</Text>
                <View style={[s.priorityDot, { backgroundColor: c.priority === 1 ? '#ef4444' : t.accent.yellow }]} />
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={handleAddContact}>
              <Text style={s.addBtnText}>+ Add Contact</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'plan' && (
          <>
            <View style={s.progressCard}>
              <Text style={s.progressTitle}>Emergency Plan Progress</Text>
              <View style={s.progressBarBg}>
                <View style={[s.progressBarFill, { width: `${(completedSteps / planSteps.length) * 100}%` }]} />
              </View>
              <Text style={s.progressLabel}>{completedSteps} of {planSteps.length} steps reviewed</Text>
            </View>
            <Text style={s.sectionTitle}>Action Steps</Text>
            {planSteps.map(step => (
              <TouchableOpacity key={step.id} style={s.stepCard} onPress={() => toggleStep(step.id)}>
                <View style={[s.stepCheck, { borderColor: step.completed ? t.accent.green : t.border, backgroundColor: step.completed ? t.accent.green : 'transparent' }]}>
                  {step.completed && <Text style={s.stepCheckText}>{'\u2713'}</Text>}
                </View>
                <View style={s.stepInfo}>
                  <Text style={[s.stepTitle, step.completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{step.title}</Text>
                  <Text style={s.stepDesc}>{step.description}</Text>
                  <Text style={s.stepNum}>Step {step.order}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
