import { fonts } from '../utils/theme';
/**
 * Veteran Screen — Military-to-civilian transition support and veteran community.
 *
 * Article I: "Every community member deserves support during life transitions.
 *  Veterans who served their communities carry unique skills and experiences
 *  that enrich civilian life."
 * — Human Constitution, Article I
 *
 * Features:
 * - Transition resources (employment, education, housing, health)
 * - Veteran peer network (connect with other veterans)
 * - Skills translation (military skills mapped to civilian jobs)
 * - Mental health & wellness (PTSD support, crisis lines, peer counselors)
 * - Veteran mentors (experienced transitioned vets guiding new ones)
 * - Community recognition (acknowledge service, welcome ceremonies)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type TabKey = 'resources' | 'network' | 'skills' | 'wellness';

interface TransitionResource {
  id: string;
  title: string;
  category: 'employment' | 'education' | 'housing' | 'health';
  description: string;
  provider: string;
  eligibility: string;
  icon: string;
}

interface VeteranMentor {
  id: string;
  name: string;
  branch: string;
  yearsServed: number;
  transitionYear: number;
  currentRole: string;
  specialties: string[];
  available: boolean;
}

interface SkillTranslation {
  id: string;
  militarySkill: string;
  militaryRole: string;
  civilianEquivalents: string[];
  certifications: string[];
  averageSalary: string;
}

interface CrisisResource {
  id: string;
  name: string;
  contact: string;
  available: string;
  description: string;
}

interface PeerConnection {
  id: string;
  name: string;
  branch: string;
  location: string;
  interests: string[];
  transitioned: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'resources', label: 'Resources', icon: 'R' },
  { key: 'network', label: 'Network', icon: 'N' },
  { key: 'skills', label: 'Skills', icon: 'S' },
  { key: 'wellness', label: 'Wellness', icon: 'W' },
];

const RESOURCE_CATEGORIES = [
  { key: 'employment', label: 'Employment', icon: 'E' },
  { key: 'education', label: 'Education', icon: 'D' },
  { key: 'housing', label: 'Housing', icon: 'H' },
  { key: 'health', label: 'Health', icon: '+' },
];

const BRANCH_COLORS: Record<string, string> = {
  Army: '#4B5320',
  Navy: '#000080',
  'Air Force': '#00308F',
  Marines: '#CC0000',
  'Coast Guard': '#FF6600',
};

// ─── Demo Data ───

const DEMO_RESOURCES: TransitionResource[] = [
  {
    id: 'r1',
    title: 'Veterans Employment Program',
    category: 'employment',
    description: 'Resume workshops, interview prep, and job placement for transitioning service members. Connects veterans with employers who value military experience.',
    provider: 'Community Workforce Center',
    eligibility: 'All veterans and active-duty transitioning',
    icon: 'E',
  },
  {
    id: 'r2',
    title: 'GI Bill Education Benefits',
    category: 'education',
    description: 'Tuition assistance for college, vocational training, and certification programs. Includes housing allowance and book stipend.',
    provider: 'Department of Veterans Affairs',
    eligibility: 'Post-9/11 veterans with 90+ days of service',
    icon: 'D',
  },
  {
    id: 'r3',
    title: 'Veteran Housing Assistance',
    category: 'housing',
    description: 'VA home loans with no down payment, transitional housing, and emergency shelter for veterans in need.',
    provider: 'Veterans Housing Authority',
    eligibility: 'All honorably discharged veterans',
    icon: 'H',
  },
  {
    id: 'r4',
    title: 'Veteran Health Services',
    category: 'health',
    description: 'Comprehensive healthcare including primary care, specialty care, mental health, and prescription services at VA facilities.',
    provider: 'VA Medical Center',
    eligibility: 'Enrolled veterans with VA healthcare',
    icon: '+',
  },
];

const DEMO_MENTORS: VeteranMentor[] = [
  {
    id: 'm1',
    name: 'James Rivera',
    branch: 'Army',
    yearsServed: 12,
    transitionYear: 2020,
    currentRole: 'Software Engineering Manager',
    specialties: ['Tech careers', 'Leadership transition', 'Interview prep'],
    available: true,
  },
  {
    id: 'm2',
    name: 'Sarah Chen',
    branch: 'Navy',
    yearsServed: 8,
    transitionYear: 2022,
    currentRole: 'Healthcare Administrator',
    specialties: ['Healthcare careers', 'Education benefits', 'Family support'],
    available: true,
  },
];

const DEMO_SKILL_TRANSLATIONS: SkillTranslation[] = [
  {
    id: 's1',
    militarySkill: 'Combat Medic / Field Medicine',
    militaryRole: 'Army 68W / Navy Corpsman',
    civilianEquivalents: ['Emergency Medical Technician', 'Paramedic', 'Registered Nurse', 'Physician Assistant'],
    certifications: ['NREMT', 'RN License', 'BLS/ACLS'],
    averageSalary: '$45,000 - $95,000',
  },
  {
    id: 's2',
    militarySkill: 'Logistics & Supply Chain',
    militaryRole: 'Army 92A / Marine 0431',
    civilianEquivalents: ['Supply Chain Manager', 'Logistics Coordinator', 'Operations Manager', 'Warehouse Director'],
    certifications: ['CSCP', 'CLTD', 'PMP'],
    averageSalary: '$55,000 - $110,000',
  },
  {
    id: 's3',
    militarySkill: 'Signals Intelligence / Cybersecurity',
    militaryRole: 'Army 35S / Air Force 1N4',
    civilianEquivalents: ['Cybersecurity Analyst', 'Information Security Manager', 'Network Security Engineer', 'Threat Intelligence Analyst'],
    certifications: ['CompTIA Security+', 'CISSP', 'CEH'],
    averageSalary: '$75,000 - $140,000',
  },
];

const DEMO_CRISIS_RESOURCES: CrisisResource[] = [
  { id: 'c1', name: 'Veterans Crisis Line', contact: '988 (Press 1)', available: '24/7', description: 'Immediate support for veterans in emotional distress or suicidal crisis.' },
  { id: 'c2', name: 'Crisis Text Line', contact: 'Text 838255', available: '24/7', description: 'Text-based crisis support for veterans who prefer texting.' },
  { id: 'c3', name: 'Vet Center Peer Counseling', contact: 'Local Vet Center', available: 'Business hours + evenings', description: 'Free readjustment counseling from fellow veterans who understand.' },
];

const DEMO_PEERS: PeerConnection[] = [
  { id: 'p1', name: 'Marcus Thompson', branch: 'Marines', location: 'Portland, OR', interests: ['Hiking', 'Woodworking', 'Tech'], transitioned: true },
  { id: 'p2', name: 'Elena Vasquez', branch: 'Air Force', location: 'Denver, CO', interests: ['Running', 'Photography', 'Volunteering'], transitioned: true },
  { id: 'p3', name: 'David Kim', branch: 'Army', location: 'Austin, TX', interests: ['Coding', 'Gaming', 'Fitness'], transitioned: false },
  { id: 'p4', name: 'Rachel Okafor', branch: 'Navy', location: 'San Diego, CA', interests: ['Sailing', 'Cooking', 'Education'], transitioned: true },
];

// ─── Component ───

export function VeteranScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('resources');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: t.bg.card, borderRadius: 16, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabIcon: { fontSize: fonts.lg, marginBottom: 2 },
    tabLabel: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.bold },
    tabLabelActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    cardDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    cardMeta: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    categoryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 8 },
    categoryChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 72 },
    categoryChipActive: { backgroundColor: t.accent.blue },
    categoryIcon: { fontSize: fonts.xl, marginBottom: 2 },
    categoryLabel: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    categoryLabelActive: { color: '#fff' },
    mentorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    mentorName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    mentorBranch: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
    mentorRole: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    mentorSpecialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    specialtyChip: { backgroundColor: t.accent.blue + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    specialtyText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    availableDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginRight: 6 },
    availableRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    availableText: { color: '#34C759', fontSize: fonts.sm, fontWeight: fonts.semibold },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 12 },
    connectBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    skillCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    skillMilitary: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    skillRole: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    skillArrow: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 8, marginBottom: 4 },
    civilianList: { marginTop: 4 },
    civilianItem: { color: t.text.primary, fontSize: fonts.sm, marginBottom: 2, paddingLeft: 8 },
    certRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    certChip: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    certText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    salaryText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 8 },
    crisisCard: { backgroundColor: '#FF3B3020', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: '#FF3B3040' },
    crisisName: { color: '#FF3B30', fontSize: fonts.lg, fontWeight: fonts.heavy },
    crisisContact: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold, marginTop: 6 },
    crisisAvail: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    crisisDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    peerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    peerName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    peerLocation: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    peerInterests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    interestChip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    interestText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', padding: 40 },
    demoLabel: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    recognitionCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' },
    recognitionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginTop: 8 },
    recognitionDesc: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  }), [t]);

  const filteredResources = useMemo(() => {
    if (!selectedCategory) return DEMO_RESOURCES;
    return DEMO_RESOURCES.filter(r => r.category === selectedCategory);
  }, [selectedCategory]);

  const handleConnect = useCallback((name: string) => {
    Alert.alert('Connection Request', `Send peer connection request to ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Connect', onPress: () => Alert.alert('Sent', `Connection request sent to ${name}.`) },
    ]);
  }, []);

  const handleMentorRequest = useCallback((name: string) => {
    Alert.alert('Mentor Request', `Request mentoring session with ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request', onPress: () => Alert.alert('Requested', `Mentoring request sent to ${name}. They will respond within 48 hours.`) },
    ]);
  }, []);

  // ─── Tab Renderers ───

  const renderResources = useCallback(() => (
    <>
      <Text style={s.section}>Resource Categories</Text>
      <View style={s.categoryRow}>
        <TouchableOpacity
          style={[s.categoryChip, !selectedCategory && s.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.categoryIcon]}>*</Text>
          <Text style={[s.categoryLabel, !selectedCategory && s.categoryLabelActive]}>All</Text>
        </TouchableOpacity>
        {RESOURCE_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, selectedCategory === cat.key && s.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={s.categoryIcon}>{cat.icon}</Text>
            <Text style={[s.categoryLabel, selectedCategory === cat.key && s.categoryLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>Available Resources</Text>
      {filteredResources.map(res => (
        <View key={res.id} style={s.card}>
          <Text style={s.cardTitle}>[{res.icon}] {res.title}</Text>
          <Text style={s.cardDesc}>{res.description}</Text>
          <Text style={s.cardMeta}>Provider: {res.provider}</Text>
          <Text style={s.cardMeta}>Eligibility: {res.eligibility}</Text>
          <View style={[s.badge, { backgroundColor: t.accent.blue }]}>
            <Text style={s.badgeText}>{res.category.toUpperCase()}</Text>
          </View>
        </View>
      ))}

      <Text style={s.section}>Veteran Mentors</Text>
      {DEMO_MENTORS.map(mentor => (
        <View key={mentor.id} style={s.mentorCard}>
          <Text style={s.mentorName}>{mentor.name}</Text>
          <Text style={[s.mentorBranch, { color: BRANCH_COLORS[mentor.branch] || t.text.secondary }]}>
            {mentor.branch} -- {mentor.yearsServed} years -- Transitioned {mentor.transitionYear}
          </Text>
          <Text style={s.mentorRole}>{mentor.currentRole}</Text>
          <View style={s.mentorSpecialties}>
            {mentor.specialties.map(sp => (
              <View key={sp} style={s.specialtyChip}>
                <Text style={s.specialtyText}>{sp}</Text>
              </View>
            ))}
          </View>
          {mentor.available && (
            <View style={s.availableRow}>
              <View style={s.availableDot} />
              <Text style={s.availableText}>Available for mentoring</Text>
            </View>
          )}
          <TouchableOpacity style={s.connectBtn} onPress={() => handleMentorRequest(mentor.name)}>
            <Text style={s.connectBtnText}>Request Mentoring</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  ), [s, t, filteredResources, selectedCategory, handleMentorRequest]);

  const renderNetwork = useCallback(() => (
    <>
      <View style={s.recognitionCard}>
        <Text style={[s.heroIcon]}>*</Text>
        <Text style={s.recognitionTitle}>Thank You For Your Service</Text>
        <Text style={s.recognitionDesc}>
          This community honors and welcomes all who have served. Your sacrifice and dedication strengthen us all.
        </Text>
      </View>

      <Text style={s.section}>Veteran Peer Network</Text>
      {DEMO_PEERS.map(peer => (
        <View key={peer.id} style={s.peerCard}>
          <Text style={s.peerName}>{peer.name}</Text>
          <Text style={[s.mentorBranch, { color: BRANCH_COLORS[peer.branch] || t.text.secondary }]}>
            {peer.branch}
          </Text>
          <Text style={s.peerLocation}>{peer.location}</Text>
          <View style={[s.statusChip, { backgroundColor: peer.transitioned ? '#34C75920' : '#FF950020' }]}>
            <Text style={{ color: peer.transitioned ? '#34C759' : '#FF9500', fontSize: fonts.xs, fontWeight: fonts.bold }}>
              {peer.transitioned ? 'Transitioned' : 'Transitioning'}
            </Text>
          </View>
          <View style={s.peerInterests}>
            {peer.interests.map(int => (
              <View key={int} style={s.interestChip}>
                <Text style={s.interestText}>{int}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.connectBtn} onPress={() => handleConnect(peer.name)}>
            <Text style={s.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={s.section}>Community Welcome Ceremonies</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Monthly Veteran Welcome</Text>
        <Text style={s.cardDesc}>
          Join us the first Saturday of every month for a community welcome ceremony honoring newly transitioned veterans. Share stories, build connections, and find your place.
        </Text>
        <Text style={s.cardMeta}>Next: April 5, 2026 -- Community Center, 10:00 AM</Text>
      </View>
    </>
  ), [s, t, handleConnect]);

  const renderSkills = useCallback(() => (
    <>
      <Text style={s.section}>Military-to-Civilian Skills Translation</Text>
      {DEMO_SKILL_TRANSLATIONS.map(skill => (
        <View key={skill.id} style={s.skillCard}>
          <Text style={s.skillMilitary}>{skill.militarySkill}</Text>
          <Text style={s.skillRole}>{skill.militaryRole}</Text>
          <Text style={s.skillArrow}>Translates to:</Text>
          <View style={s.civilianList}>
            {skill.civilianEquivalents.map(eq => (
              <Text key={eq} style={s.civilianItem}>- {eq}</Text>
            ))}
          </View>
          <View style={s.certRow}>
            {skill.certifications.map(cert => (
              <View key={cert} style={s.certChip}>
                <Text style={s.certText}>{cert}</Text>
              </View>
            ))}
          </View>
          <Text style={s.salaryText}>Salary Range: {skill.averageSalary}</Text>
        </View>
      ))}

      <Text style={s.section}>Get Started</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Skills Assessment</Text>
        <Text style={s.cardDesc}>
          Complete a comprehensive skills assessment to discover which civilian careers best match your military training and experience. Our AI-powered tool maps your MOS/rate to in-demand roles.
        </Text>
        <TouchableOpacity
          style={[s.connectBtn, { marginTop: 12 }]}
          onPress={() => Alert.alert('Skills Assessment', 'Skills assessment tool coming soon. Your military experience is valuable — we will help you translate it.')}
        >
          <Text style={s.connectBtnText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    </>
  ), [s]);

  const renderWellness = useCallback(() => (
    <>
      <Text style={s.section}>Crisis Resources -- Always Available</Text>
      {DEMO_CRISIS_RESOURCES.map(cr => (
        <View key={cr.id} style={s.crisisCard}>
          <Text style={s.crisisName}>{cr.name}</Text>
          <Text style={s.crisisContact}>{cr.contact}</Text>
          <Text style={s.crisisAvail}>{cr.available}</Text>
          <Text style={s.crisisDesc}>{cr.description}</Text>
        </View>
      ))}

      <Text style={s.section}>Mental Health Support</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>PTSD Support Program</Text>
        <Text style={s.cardDesc}>
          Evidence-based treatment programs including Cognitive Processing Therapy (CPT) and Prolonged Exposure (PE). Group and individual sessions available with veteran-trained therapists.
        </Text>
        <Text style={s.cardMeta}>VA Medical Center -- Referral or walk-in</Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Peer Counseling Network</Text>
        <Text style={s.cardDesc}>
          Talk with fellow veterans who have walked the same path. Our trained peer counselors are veterans themselves — they understand what you are going through because they have been there.
        </Text>
        <Text style={s.cardMeta}>Vet Centers -- Free and confidential</Text>
      </View>

      <Text style={s.section}>Wellness Programs</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Veteran Fitness & Wellness</Text>
        <Text style={s.cardDesc}>
          Physical fitness programs, adaptive sports, yoga, and mindfulness sessions designed specifically for veterans. Maintain the camaraderie and discipline of service in a civilian setting.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Family Readjustment Support</Text>
        <Text style={s.cardDesc}>
          Reintegration support for veterans and their families. Couples counseling, family workshops, and children's programs to help the whole family navigate the transition together.
        </Text>
      </View>
    </>
  ), [s]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'resources': return renderResources();
      case 'network': return renderNetwork();
      case 'skills': return renderSkills();
      case 'wellness': return renderWellness();
      default: return null;
    }
  }, [activeTab, renderResources, renderNetwork, renderSkills, renderWellness]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Veteran Support</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>*</Text>
          <Text style={s.heroTitle}>Military-to-Civilian Transition</Text>
          <Text style={s.heroSubtitle}>
            Resources, mentors, and community for veterans{'\n'}transitioning to civilian life
          </Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={s.tabIcon}>{tab.icon}</Text>
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderContent()}

        {demoMode && <Text style={s.demoLabel}>DEMO MODE -- Sample veteran data</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
