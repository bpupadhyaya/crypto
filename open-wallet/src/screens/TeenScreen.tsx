import { fonts } from '../utils/theme';
/**
 * Teen Screen — Safe space for 13-17 year olds.
 *
 * "Every young person deserves a safe environment to grow,
 *  learn, connect, and find their voice."
 * — Human Constitution, Article I
 *
 * Teen dashboard, challenges (earn eOTK), peer connections,
 * skill building, Youth Council voice, and safety resources.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

interface Challenge {
  id: string;
  title: string;
  category: string;
  icon: string;
  eOTKReward: number;
  deadline: string;
  participants: number;
  status: 'active' | 'completed' | 'upcoming';
  description: string;
}

interface PeerConnection {
  id: string;
  name: string;
  age: number;
  interests: string[];
  icon: string;
  guardianApproved: boolean;
}

interface Skill {
  id: string;
  title: string;
  icon: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  eOTKReward: number;
  category: string;
}

interface SafetyResource {
  id: string;
  title: string;
  icon: string;
  description: string;
  type: 'hotline' | 'article' | 'contact' | 'tool';
}

/* ── demo data ── */

const DEMO_CHALLENGES: Challenge[] = [
  { id: 'ch1', title: 'Code Your First App', category: 'Coding', icon: '\u{1F4BB}', eOTKReward: 100, deadline: '2026-04-15', participants: 47, status: 'active', description: 'Build a simple app using any language. Submit a screenshot and code link.' },
  { id: 'ch2', title: 'Digital Art Contest', category: 'Art', icon: '\u{1F3A8}', eOTKReward: 75, deadline: '2026-04-20', participants: 62, status: 'active', description: 'Create original digital art on the theme "My Future World".' },
  { id: 'ch3', title: 'Short Story Sprint', category: 'Writing', icon: '\u{270D}\u{FE0F}', eOTKReward: 80, deadline: '2026-04-10', participants: 35, status: 'active', description: 'Write a 500-word story about kindness. Peer-reviewed by Youth Council.' },
  { id: 'ch4', title: 'Science Fair Prep', category: 'Science', icon: '\u{1F52C}', eOTKReward: 120, deadline: '2026-05-01', participants: 28, status: 'upcoming', description: 'Design an experiment, document your hypothesis and results.' },
  { id: 'ch5', title: '30-Day Fitness Log', category: 'Sports', icon: '\u{1F3C3}', eOTKReward: 60, deadline: '2026-04-30', participants: 89, status: 'completed', description: 'Track 30 days of physical activity. Any sport or exercise counts!' },
];

const DEMO_CONNECTIONS: PeerConnection[] = [
  { id: 'p1', name: 'Alex M.', age: 15, interests: ['Coding', 'Gaming', 'Science'], icon: '\u{1F9D1}\u{200D}\u{1F4BB}', guardianApproved: true },
  { id: 'p2', name: 'Mia R.', age: 14, interests: ['Art', 'Writing', 'Music'], icon: '\u{1F469}\u{200D}\u{1F3A8}', guardianApproved: true },
  { id: 'p3', name: 'Jordan K.', age: 16, interests: ['Sports', 'Cooking', 'Coding'], icon: '\u{1F3C0}', guardianApproved: false },
];

const DEMO_SKILLS: Skill[] = [
  { id: 'sk1', title: 'Basic Cooking', icon: '\u{1F373}', progress: 65, totalLessons: 10, completedLessons: 6, eOTKReward: 50, category: 'Life Skills' },
  { id: 'sk2', title: 'First Aid & CPR', icon: '\u{1FA7A}', progress: 40, totalLessons: 8, completedLessons: 3, eOTKReward: 60, category: 'Life Skills' },
  { id: 'sk3', title: 'Financial Basics', icon: '\u{1F4B0}', progress: 25, totalLessons: 6, completedLessons: 1, eOTKReward: 40, category: 'Money' },
  { id: 'sk4', title: 'Intro to Coding', icon: '\u{1F4BB}', progress: 80, totalLessons: 12, completedLessons: 9, eOTKReward: 80, category: 'Tech' },
];

const DEMO_SAFETY: SafetyResource[] = [
  { id: 'sf1', title: 'Bullying Support', icon: '\u{1F6E1}\u{FE0F}', description: 'If you are being bullied online or in person, find help and strategies here.', type: 'article' },
  { id: 'sf2', title: 'Mental Health Check-In', icon: '\u{1F49A}', description: 'How are you feeling today? Anonymous self-assessment and resources.', type: 'tool' },
  { id: 'sf3', title: 'Crisis Helpline', icon: '\u{1F4DE}', description: 'Talk to someone now. 988 Suicide & Crisis Lifeline — call or text 988.', type: 'hotline' },
  { id: 'sf4', title: 'My Trusted Adults', icon: '\u{1F91D}', description: 'Your guardian-approved trusted adults you can reach out to anytime.', type: 'contact' },
  { id: 'sf5', title: 'Online Safety Guide', icon: '\u{1F512}', description: 'Stay safe online — privacy, passwords, recognizing scams and predators.', type: 'article' },
  { id: 'sf6', title: 'Report a Concern', icon: '\u{1F6A8}', description: 'Something not right? Report anonymously to a trusted moderator.', type: 'tool' },
];

const DEMO_TEEN_OTK = 340;
const DEMO_ACHIEVEMENTS = 7;
const DEMO_ACTIVE_CHALLENGES = 3;
const DEMO_SKILLS_IN_PROGRESS = 4;

type Tab = 'dashboard' | 'challenges' | 'skills' | 'safety';

export function TeenScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardIcon: { fontSize: 32, marginRight: 14 },
    cardInfo: { flex: 1 },
    cardTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    cardDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.purple },
    progressText: { color: t.text.secondary, fontSize: 11, marginTop: 4 },
    eOTKBadge: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    // Challenge styles
    challengeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    challengeHeader: { flexDirection: 'row', alignItems: 'center' },
    challengeIcon: { fontSize: 28, marginRight: 12 },
    challengeInfo: { flex: 1 },
    challengeTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    challengeMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
    challengeMetaText: { color: t.text.muted, fontSize: 11 },
    challengeStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    challengeStatusText: { fontSize: 11, fontWeight: fonts.bold },
    challengeDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border },
    challengeDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    challengeReward: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginTop: 8 },
    joinBtn: { backgroundColor: t.accent.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 10, alignSelf: 'flex-start' },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    // Connection styles
    connectionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    connectionIcon: { fontSize: 32, marginRight: 14 },
    connectionInfo: { flex: 1 },
    connectionName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    connectionAge: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    connectionInterests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    interestChip: { backgroundColor: t.accent.purple + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    interestText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold },
    approvedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    approvedText: { color: t.accent.green, fontSize: 10, fontWeight: fonts.bold },
    pendingBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    pendingText: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold },
    // Skill styles
    skillCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    skillRow: { flexDirection: 'row', alignItems: 'center' },
    skillIcon: { fontSize: 28, marginRight: 12 },
    skillInfo: { flex: 1 },
    skillTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    skillCategory: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    skillProgress: { color: t.text.secondary, fontSize: 11, marginTop: 4 },
    // Safety styles
    safetyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    safetyRow: { flexDirection: 'row', alignItems: 'flex-start' },
    safetyIcon: { fontSize: 28, marginRight: 14 },
    safetyInfo: { flex: 1 },
    safetyTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    safetyDesc: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
    safetyType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
    safetyTypeText: { fontSize: 10, fontWeight: fonts.bold },
    emergencyCard: { backgroundColor: t.accent.red + '10', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: t.accent.red + '30' },
    emergencyTitle: { color: t.accent.red, fontSize: 16, fontWeight: fonts.heavy, marginTop: 8 },
    emergencyDesc: { color: t.text.secondary, fontSize: 13, textAlign: 'center', marginTop: 4 },
    emergencyBtn: { backgroundColor: t.accent.red, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
    emergencyBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    // Voice / Council
    voiceCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
    voiceTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    voiceDesc: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
    voiceBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
    voiceBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
  }), [t]);

  const getStatusStyle = (status: Challenge['status']) => {
    switch (status) {
      case 'active': return { bg: t.accent.green + '20', color: t.accent.green };
      case 'completed': return { bg: t.accent.blue + '20', color: t.accent.blue };
      case 'upcoming': return { bg: t.accent.orange + '20', color: t.accent.orange };
    }
  };

  const getSafetyTypeStyle = (type: SafetyResource['type']) => {
    switch (type) {
      case 'hotline': return { bg: t.accent.red + '20', color: t.accent.red, label: 'Hotline' };
      case 'article': return { bg: t.accent.blue + '20', color: t.accent.blue, label: 'Guide' };
      case 'contact': return { bg: t.accent.green + '20', color: t.accent.green, label: 'Contacts' };
      case 'tool': return { bg: t.accent.purple + '20', color: t.accent.purple, label: 'Tool' };
    }
  };

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'dashboard', label: 'Home' },
      { key: 'challenges', label: 'Challenges' },
      { key: 'skills', label: 'Skills' },
      { key: 'safety', label: 'Safety' },
    ];
    return (
      <View style={s.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDashboard = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Your Activity</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Active Challenges</Text>
        {DEMO_CHALLENGES.filter(c => c.status === 'active').map((ch) => (
          <View key={ch.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>{ch.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { fontSize: 13 }]}>{ch.title}</Text>
              <Text style={s.cardDesc}>Due {ch.deadline}</Text>
            </View>
            <Text style={s.eOTKBadge}>+{ch.eOTKReward}</Text>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Peer Connections</Text>
        {DEMO_CONNECTIONS.filter(c => c.guardianApproved).map((conn) => (
          <View key={conn.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>{conn.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { fontSize: 13 }]}>{conn.name}, {conn.age}</Text>
              <Text style={s.cardDesc}>{conn.interests.join(', ')}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Skills in Progress</Text>
        {DEMO_SKILLS.map((skill) => (
          <View key={skill.id} style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>{skill.icon}</Text>
              <Text style={[s.cardTitle, { fontSize: 13, flex: 1 }]}>{skill.title}</Text>
              <Text style={s.progressText}>{skill.progress}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${skill.progress}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={s.voiceCard}>
        <Text style={{ fontSize: 36 }}>{'\u{1F4E2}'}</Text>
        <Text style={s.voiceTitle}>Teen Voice — Youth Council</Text>
        <Text style={s.voiceDesc}>
          Have an idea to make our community better? Submit it to the Youth Council for review and possible implementation.
        </Text>
        <TouchableOpacity style={s.voiceBtn}>
          <Text style={s.voiceBtnText}>Submit an Idea</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChallenges = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Challenges — Earn eOTK</Text>
      {DEMO_CHALLENGES.map((ch) => {
        const status = getStatusStyle(ch.status);
        const isExpanded = expandedChallenge === ch.id;
        return (
          <TouchableOpacity
            key={ch.id}
            style={s.challengeCard}
            onPress={() => setExpandedChallenge(isExpanded ? null : ch.id)}
            activeOpacity={0.7}
          >
            <View style={s.challengeHeader}>
              <Text style={s.challengeIcon}>{ch.icon}</Text>
              <View style={s.challengeInfo}>
                <Text style={s.challengeTitle}>{ch.title}</Text>
                <View style={s.challengeMeta}>
                  <Text style={s.challengeMetaText}>{ch.category}</Text>
                  <Text style={s.challengeMetaText}>{ch.participants} participants</Text>
                  <Text style={s.challengeMetaText}>Due {ch.deadline}</Text>
                </View>
              </View>
              <View style={[s.challengeStatus, { backgroundColor: status.bg }]}>
                <Text style={[s.challengeStatusText, { color: status.color }]}>
                  {ch.status === 'active' ? 'Active' : ch.status === 'completed' ? 'Done' : 'Soon'}
                </Text>
              </View>
            </View>
            {isExpanded && (
              <View style={s.challengeDetails}>
                <Text style={s.challengeDesc}>{ch.description}</Text>
                <Text style={s.challengeReward}>Reward: +{ch.eOTKReward} eOTK</Text>
                {ch.status === 'active' && (
                  <TouchableOpacity style={s.joinBtn}>
                    <Text style={s.joinBtnText}>Join Challenge</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSkills = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Skill Building</Text>
      <Text style={[s.cardDesc, { marginBottom: 16 }]}>
        Real-world skills that matter. Complete lessons, earn eOTK, build your future.
      </Text>
      {DEMO_SKILLS.map((skill) => (
        <View key={skill.id} style={s.skillCard}>
          <View style={s.skillRow}>
            <Text style={s.skillIcon}>{skill.icon}</Text>
            <View style={s.skillInfo}>
              <Text style={s.skillTitle}>{skill.title}</Text>
              <Text style={s.skillCategory}>{skill.category}</Text>
            </View>
            <Text style={s.eOTKBadge}>+{skill.eOTKReward} eOTK</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${skill.progress}%` }]} />
          </View>
          <Text style={s.skillProgress}>
            {skill.completedLessons}/{skill.totalLessons} lessons — {skill.progress}% complete
          </Text>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F31F}'}</Text>
        <Text style={s.cardTitle}>Suggest a Skill</Text>
        <Text style={[s.cardDesc, { textAlign: 'center', marginTop: 4 }]}>
          Want to learn something not listed? Submit a suggestion to the Youth Council.
        </Text>
      </View>
    </View>
  );

  const renderSafety = () => (
    <View style={s.section}>
      <View style={s.emergencyCard}>
        <Text style={{ fontSize: 36 }}>{'\u{1F198}'}</Text>
        <Text style={s.emergencyTitle}>Need Help Right Now?</Text>
        <Text style={s.emergencyDesc}>
          If you are in danger or having a crisis, reach out immediately.
        </Text>
        <TouchableOpacity style={s.emergencyBtn}>
          <Text style={s.emergencyBtnText}>Call 988 Crisis Line</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Safety Resources</Text>
      {DEMO_SAFETY.map((resource) => {
        const typeStyle = getSafetyTypeStyle(resource.type);
        return (
          <View key={resource.id} style={s.safetyCard}>
            <View style={s.safetyRow}>
              <Text style={s.safetyIcon}>{resource.icon}</Text>
              <View style={s.safetyInfo}>
                <Text style={s.safetyTitle}>{resource.title}</Text>
                <Text style={s.safetyDesc}>{resource.description}</Text>
                <View style={[s.safetyType, { backgroundColor: typeStyle.bg }]}>
                  <Text style={[s.safetyTypeText, { color: typeStyle.color }]}>{typeStyle.label}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <View style={[s.card, { alignItems: 'center', marginTop: 8 }]}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F49C}'}</Text>
        <Text style={s.cardTitle}>You Are Not Alone</Text>
        <Text style={[s.cardDesc, { textAlign: 'center', marginTop: 4, lineHeight: 20 }]}>
          Every adult in this community has pledged to protect young members. Your guardians are always notified of your connections and activities.
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'challenges': return renderChallenges();
      case 'skills': return renderSkills();
      case 'safety': return renderSafety();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Teen Space</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F680}'}</Text>
          <Text style={s.heroTitle}>Welcome to Your Space</Text>
          <Text style={s.heroSubtitle}>
            Challenge yourself, build skills, connect safely
          </Text>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_TEEN_OTK}</Text>
              <Text style={s.statLabel}>eOTK Earned</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{DEMO_ACHIEVEMENTS}</Text>
              <Text style={s.statLabel}>Achievements</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{DEMO_ACTIVE_CHALLENGES}</Text>
              <Text style={s.statLabel}>Challenges</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{DEMO_SKILLS_IN_PROGRESS}</Text>
              <Text style={s.statLabel}>Skills</Text>
            </View>
          </View>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>Demo Mode — Sample Data</Text>
          </View>
        )}

        {renderTabs()}
        {renderContent()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
