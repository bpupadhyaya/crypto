import { fonts } from '../utils/theme';
/**
 * Immigration Support Screen — Newcomer integration and community welcome programs.
 *
 * Article IX: "Every newcomer deserves a path to belonging."
 * Community welcome programs, buddy systems, language resources, and
 * cultural orientation help newcomers integrate and thrive.
 *
 * Features:
 * - Welcome guide: step-by-step for new community members (housing, services, culture)
 * - Buddy system: match newcomers with established community members
 * - Language resources: language classes, translation help
 * - Document assistance: help with forms, applications, registration
 * - Cultural orientation events
 * - Community integration score (connections made, services accessed, events attended)
 * - Demo: 3 buddies available, 2 events, integration score 45
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface GuideStep {
  id: string;
  order: number;
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

interface Buddy {
  id: string;
  name: string;
  languages: string[];
  yearsInCommunity: number;
  specialty: string;
  available: boolean;
  matchScore: number;
}

interface LanguageResource {
  id: string;
  type: string;
  language: string;
  provider: string;
  schedule: string;
  level: string;
  free: boolean;
}

interface DocumentService {
  id: string;
  name: string;
  description: string;
  provider: string;
  nextAvailable: string;
  free: boolean;
}

interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: number;
  category: string;
}

interface IntegrationScore {
  overall: number;
  connectionsMade: number;
  servicesAccessed: number;
  eventsAttended: number;
  guideProgress: number;
  buddyMeetings: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_GUIDE_STEPS: GuideStep[] = [
  { id: '1', order: 1, title: 'Register with Community Center', description: 'Visit the local community center to register and receive your welcome packet with essential contacts and resources.', category: 'services', completed: true },
  { id: '2', order: 2, title: 'Find Housing Support', description: 'Connect with housing assistance programs for temporary and permanent accommodation options.', category: 'housing', completed: true },
  { id: '3', order: 3, title: 'Open a Local Bank Account', description: 'Set up a bank account for receiving payments and managing finances. Bring ID and proof of address.', category: 'services', completed: false },
  { id: '4', order: 4, title: 'Enroll in Language Classes', description: 'Sign up for free language classes to improve communication and access more opportunities.', category: 'language', completed: false },
  { id: '5', order: 5, title: 'Attend Cultural Orientation', description: 'Join a cultural orientation session to learn about local customs, laws, and community norms.', category: 'culture', completed: false },
  { id: '6', order: 6, title: 'Meet Your Buddy', description: 'Get matched with a community buddy who will help you navigate your first weeks and introduce you to neighbors.', category: 'social', completed: true },
  { id: '7', order: 7, title: 'Access Healthcare', description: 'Register with a local clinic and learn about available healthcare services and insurance options.', category: 'services', completed: false },
  { id: '8', order: 8, title: 'Explore Public Transit', description: 'Learn about bus routes, train schedules, and transportation passes available in your area.', category: 'services', completed: false },
];

const DEMO_BUDDIES: Buddy[] = [
  { id: '1', name: 'Maria G.', languages: ['Spanish', 'English'], yearsInCommunity: 8, specialty: 'Housing & Services', available: true, matchScore: 92 },
  { id: '2', name: 'Ahmed K.', languages: ['Arabic', 'English', 'French'], yearsInCommunity: 5, specialty: 'Employment & Education', available: true, matchScore: 85 },
  { id: '3', name: 'Li Wei', languages: ['Mandarin', 'English'], yearsInCommunity: 12, specialty: 'Healthcare & Family', available: true, matchScore: 78 },
];

const DEMO_LANGUAGE_RESOURCES: LanguageResource[] = [
  { id: '1', type: 'Class', language: 'English', provider: 'Community Learning Center', schedule: 'Mon/Wed/Fri 10AM', level: 'Beginner', free: true },
  { id: '2', type: 'Class', language: 'English', provider: 'Community Learning Center', schedule: 'Tue/Thu 2PM', level: 'Intermediate', free: true },
  { id: '3', type: 'Translation', language: 'Spanish', provider: 'Volunteer Translators Network', schedule: 'On-demand', level: 'All', free: true },
  { id: '4', type: 'Translation', language: 'Arabic', provider: 'Volunteer Translators Network', schedule: 'On-demand', level: 'All', free: true },
  { id: '5', type: 'Conversation', language: 'English', provider: 'Coffee & Chat Group', schedule: 'Saturdays 11AM', level: 'All', free: true },
];

const DEMO_DOCUMENT_SERVICES: DocumentService[] = [
  { id: '1', name: 'Form Filling Assistance', description: 'Help completing government forms, applications, and registrations.', provider: 'Community Center', nextAvailable: '2026-03-31', free: true },
  { id: '2', name: 'Document Translation', description: 'Certified translation of personal documents (birth certificates, diplomas, etc.).', provider: 'Legal Aid Society', nextAvailable: '2026-04-02', free: true },
  { id: '3', name: 'Legal Consultation', description: 'Free 30-minute consultation on immigration paperwork and rights.', provider: 'Pro Bono Legal Clinic', nextAvailable: '2026-04-05', free: true },
];

const DEMO_EVENTS: CulturalEvent[] = [
  { id: '1', title: 'Newcomer Welcome Dinner', description: 'Monthly community dinner to welcome new arrivals. Meet neighbors, share food from your culture, and make friends.', date: '2026-04-05', location: 'Community Hall', attendees: 45, category: 'social' },
  { id: '2', title: 'Cultural Exchange Festival', description: 'Celebrate the diversity of our community with music, dance, food, and storytelling from around the world.', date: '2026-04-12', location: 'Central Park Pavilion', attendees: 120, category: 'culture' },
];

const DEMO_INTEGRATION_SCORE: IntegrationScore = {
  overall: 45,
  connectionsMade: 8,
  servicesAccessed: 3,
  eventsAttended: 2,
  guideProgress: 38,
  buddyMeetings: 4,
};

type Tab = 'guide' | 'buddy' | 'resources' | 'events';

export function ImmigrationSupportScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('guide');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const guideSteps = DEMO_GUIDE_STEPS;
  const buddies = DEMO_BUDDIES;
  const languageResources = DEMO_LANGUAGE_RESOURCES;
  const documentServices = DEMO_DOCUMENT_SERVICES;
  const events = DEMO_EVENTS;
  const integrationScore = DEMO_INTEGRATION_SCORE;

  const completedSteps = guideSteps.filter((g) => g.completed).length;
  const totalSteps = guideSteps.length;

  const handleRequestBuddy = useCallback((buddy: Buddy) => {
    Alert.alert(
      'Buddy Request Sent',
      `Your request to connect with ${buddy.name} has been sent.\n\nSpecialty: ${buddy.specialty}\nLanguages: ${buddy.languages.join(', ')}\n\nYou will be notified when they accept.`,
    );
  }, []);

  const handleToggleStep = useCallback((step: GuideStep) => {
    Alert.alert(
      step.completed ? 'Mark Incomplete?' : 'Mark Complete?',
      `${step.title}\n\n${step.completed ? 'This will mark the step as not yet completed.' : 'Great progress! This step will be marked as done.'}`,
    );
  }, []);

  const handleJoinEvent = useCallback((event: CulturalEvent) => {
    Alert.alert(
      'RSVP Confirmed',
      `You are registered for "${event.title}".\n\nDate: ${event.date}\nLocation: ${event.location}\nAttendees: ${event.attendees + 1}\n\nWe look forward to seeing you there!`,
    );
  }, []);

  const handleBookService = useCallback((service: DocumentService) => {
    Alert.alert(
      'Appointment Requested',
      `${service.name}\n\nProvider: ${service.provider}\nNext available: ${service.nextAvailable}\nCost: ${service.free ? 'Free' : 'Paid'}\n\nYou will receive a confirmation shortly.`,
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
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Integration score
    scoreCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    scoreNumber: { color: t.accent.blue, fontSize: 48, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    scoreBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 12, width: '100%' },
    scoreBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    // Guide steps
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    stepCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
    stepCheckDone: { backgroundColor: t.accent.green, borderColor: t.accent.green },
    stepCheckPending: { borderColor: t.text.muted, backgroundColor: 'transparent' },
    stepCheckText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    stepInfo: { flex: 1 },
    stepTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    stepTitleDone: { textDecorationLine: 'line-through', color: t.text.muted },
    stepDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 18 },
    stepCategory: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold, textTransform: 'uppercase', marginTop: 4 },
    progressText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, textAlign: 'center', marginBottom: 12 },
    // Buddy cards
    buddyCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    buddyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    buddyName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    buddyMatch: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    buddyDetail: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    buddySpecialty: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
    connectBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Resources
    resourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    resourceInfo: { flex: 1 },
    resourceTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    resourceMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    resourceTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    resourceTagText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    freeTag: { backgroundColor: t.accent.green + '20' },
    freeTagText: { color: t.accent.green },
    // Events
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    eventDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 8 },
    eventMeta: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 4 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    joinBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Document services
    serviceCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    serviceName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    serviceDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginBottom: 8 },
    serviceMeta: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 4 },
    bookBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
    bookBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Misc
    educationCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'guide', label: 'Guide' },
    { key: 'buddy', label: 'Buddy' },
    { key: 'resources', label: 'Resources' },
    { key: 'events', label: 'Events' },
  ];

  // ─── Guide Tab ───

  const renderGuide = () => (
    <>
      {/* Integration Score */}
      <View style={s.scoreCard}>
        <Text style={s.scoreLabel}>Integration Score</Text>
        <Text style={s.scoreNumber}>{integrationScore.overall}</Text>
        <View style={s.scoreBarOuter}>
          <View style={[s.scoreBarInner, { width: `${integrationScore.overall}%` }]} />
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{integrationScore.connectionsMade}</Text>
            <Text style={s.statLabel}>Connections</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{integrationScore.servicesAccessed}</Text>
            <Text style={s.statLabel}>Services</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{integrationScore.eventsAttended}</Text>
            <Text style={s.statLabel}>Events</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{integrationScore.buddyMeetings}</Text>
            <Text style={s.statLabel}>Buddy Meets</Text>
          </View>
        </View>
      </View>

      {/* Welcome Guide Steps */}
      <Text style={s.sectionTitle}>Welcome Guide</Text>
      <Text style={s.progressText}>{completedSteps}/{totalSteps} steps completed</Text>
      <View style={s.card}>
        {guideSteps.map((step) => (
          <TouchableOpacity key={step.id} style={s.stepRow} onPress={() => handleToggleStep(step)}>
            <View style={[s.stepCheck, step.completed ? s.stepCheckDone : s.stepCheckPending]}>
              {step.completed && <Text style={s.stepCheckText}>{'✓'}</Text>}
            </View>
            <View style={s.stepInfo}>
              <Text style={[s.stepTitle, step.completed && s.stepTitleDone]}>{step.order}. {step.title}</Text>
              <Text style={s.stepDesc}>{step.description}</Text>
              <Text style={s.stepCategory}>{step.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Every newcomer deserves a path to belonging.{'\n'}
          Complete each step at your own pace.{'\n'}
          Your community is here to help.
        </Text>
      </View>
    </>
  );

  // ─── Buddy Tab ───

  const renderBuddy = () => (
    <>
      <Text style={s.sectionTitle}>Available Buddies</Text>
      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Buddies are established community members{'\n'}
          who volunteer to help newcomers settle in.{'\n'}
          They can help with navigating services,{'\n'}
          introductions, and everyday questions.
        </Text>
      </View>

      {buddies.map((buddy) => (
        <View key={buddy.id} style={s.buddyCard}>
          <View style={s.buddyHeader}>
            <Text style={s.buddyName}>{buddy.name}</Text>
            <Text style={s.buddyMatch}>{buddy.matchScore}% match</Text>
          </View>
          <Text style={s.buddySpecialty}>{buddy.specialty}</Text>
          <Text style={s.buddyDetail}>Languages: {buddy.languages.join(', ')}</Text>
          <Text style={s.buddyDetail}>{buddy.yearsInCommunity} years in community</Text>
          <TouchableOpacity style={s.connectBtn} onPress={() => handleRequestBuddy(buddy)}>
            <Text style={s.connectBtnText}>Request Buddy</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Resources Tab ───

  const renderResources = () => (
    <>
      <Text style={s.sectionTitle}>Language Resources</Text>
      <View style={s.card}>
        {languageResources.map((res) => (
          <View key={res.id} style={s.resourceRow}>
            <View style={s.resourceInfo}>
              <Text style={s.resourceTitle}>{res.type}: {res.language}</Text>
              <Text style={s.resourceMeta}>{res.provider} | {res.schedule} | {res.level}</Text>
            </View>
            {res.free && (
              <View style={[s.resourceTag, s.freeTag]}>
                <Text style={[s.resourceTagText, s.freeTagText]}>FREE</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Document Assistance</Text>
      {documentServices.map((svc) => (
        <View key={svc.id} style={s.serviceCard}>
          <Text style={s.serviceName}>{svc.name}</Text>
          <Text style={s.serviceDesc}>{svc.description}</Text>
          <Text style={s.serviceMeta}>Provider: {svc.provider}</Text>
          <Text style={s.serviceMeta}>Next available: {svc.nextAvailable} | {svc.free ? 'Free' : 'Paid'}</Text>
          <TouchableOpacity style={s.bookBtn} onPress={() => handleBookService(svc)}>
            <Text style={s.bookBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Events Tab ───

  const renderEvents = () => (
    <>
      <Text style={s.sectionTitle}>Cultural Orientation Events</Text>
      {events.map((event) => (
        <View key={event.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{event.title}</Text>
          <Text style={s.eventDesc}>{event.description}</Text>
          <Text style={s.eventMeta}>Date: {event.date}</Text>
          <Text style={s.eventMeta}>Location: {event.location}</Text>
          <Text style={s.eventMeta}>Attendees: {event.attendees} registered</Text>
          <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinEvent(event)}>
            <Text style={s.joinBtnText}>RSVP</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Cultural events build bridges between{'\n'}
          long-time residents and newcomers.{'\n'}
          Every connection strengthens the community.{'\n\n'}
          Attending events increases your integration score.
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
        <Text style={s.title}>Immigration Support</Text>
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
        {tab === 'guide' && renderGuide()}
        {tab === 'buddy' && renderBuddy()}
        {tab === 'resources' && renderResources()}
        {tab === 'events' && renderEvents()}
      </ScrollView>
    </SafeAreaView>
  );
}
