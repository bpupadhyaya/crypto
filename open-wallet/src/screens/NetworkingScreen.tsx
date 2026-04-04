import { fonts } from '../utils/theme';
/**
 * Networking Screen — Professional connections and skill-based networking.
 *
 * "No one succeeds alone. The connections we build become the bridges
 *  others will cross."
 * — Human Constitution, Article I
 *
 * Manage your professional profile, find complementary connections,
 * attend networking events, and propose collaborations.
 * xOTK earned for meaningful professional connections.
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

/* ── data types ── */

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface UserProfile {
  name: string;
  skills: Skill[];
  interests: string[];
  lookingFor: string[];
  experience: string;
  connectionsCount: number;
  xOTKEarned: number;
}

interface SuggestedConnection {
  id: string;
  name: string;
  skills: string[];
  matchReason: string;
  matchScore: number;
  mutualConnections: number;
}

interface NetworkingEvent {
  id: string;
  title: string;
  type: 'mixer' | 'workshop' | 'meetup';
  date: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
}

interface CollabProposal {
  id: string;
  title: string;
  author: string;
  skills_needed: string[];
  description: string;
  interested: number;
  status: 'open' | 'in-progress' | 'closed';
}

/* ── demo data ── */

const DEMO_PROFILE: UserProfile = {
  name: 'You',
  skills: [
    { name: 'JavaScript', level: 'advanced' },
    { name: 'Community Organizing', level: 'intermediate' },
    { name: 'Public Speaking', level: 'beginner' },
    { name: 'Project Management', level: 'advanced' },
  ],
  interests: ['Open Source', 'Education', 'Sustainability'],
  lookingFor: ['Technical Co-founder', 'Design Partner', 'Community Builder'],
  experience: 'Software developer with 5 years of experience, passionate about community tools and open-source projects.',
  connectionsCount: 14,
  xOTKEarned: 280,
};

const DEMO_CONNECTIONS: SuggestedConnection[] = [
  { id: 'conn1', name: 'Sofia Martinez', skills: ['UX Design', 'Figma', 'User Research'], matchReason: 'Complements your dev skills — she needs a technical partner', matchScore: 92, mutualConnections: 3 },
  { id: 'conn2', name: 'Raj Patel', skills: ['Blockchain', 'Solidity', 'DeFi'], matchReason: 'Shares your interest in open source and decentralized tools', matchScore: 87, mutualConnections: 2 },
  { id: 'conn3', name: 'Amara Diallo', skills: ['Education', 'Curriculum Design', 'Teaching'], matchReason: 'Looking for tech partner for education platform', matchScore: 85, mutualConnections: 1 },
];

const DEMO_EVENTS: NetworkingEvent[] = [
  { id: 'evt1', title: 'Builders Mixer', type: 'mixer', date: '2026-04-08', location: 'Innovation Hub', attendees: 24, maxAttendees: 40, description: 'Casual mixer for builders, makers, and creators. Share what you are working on and find collaborators.' },
  { id: 'evt2', title: 'Skills Exchange Workshop', type: 'workshop', date: '2026-04-15', location: 'Library Co-working', attendees: 12, maxAttendees: 20, description: 'Teach one skill, learn one skill. 15-minute lightning exchanges with fellow professionals.' },
];

const DEMO_PROPOSALS: CollabProposal[] = [
  { id: 'prop1', title: 'Community Learning Platform', author: 'Amara Diallo', skills_needed: ['React Native', 'Backend', 'UI Design'], description: 'Building a free platform for community-led courses. Need a dev and designer to bring the vision to life.', interested: 5, status: 'open' },
  { id: 'prop2', title: 'Local Food Network App', author: 'Chen Wei', skills_needed: ['Mobile Dev', 'Mapping', 'Community Outreach'], description: 'Connecting local farmers directly with neighborhood buyers. Reduce food waste, support local economy.', interested: 8, status: 'open' },
  { id: 'prop3', title: 'Open Source Tutoring Tool', author: 'You', skills_needed: ['AI/ML', 'Education', 'Content Creation'], description: 'An adaptive tutoring tool that personalizes learning paths. Looking for ML expertise and educators.', interested: 3, status: 'in-progress' },
];

type Tab = 'profile' | 'connect' | 'events' | 'collaborate';

export function NetworkingScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const levelColor = useMemo(() => ({
    beginner: t.accent.orange,
    intermediate: t.accent.blue,
    advanced: t.accent.green,
    expert: t.accent.purple,
  }), [t]);

  const eventTypeIcon: Record<string, string> = {
    mixer: '\u{1F378}',
    workshop: '\u{1F6E0}\u{FE0F}',
    meetup: '\u{1F91D}',
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    cardSub: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { backgroundColor: t.accent.blue + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    tagText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold },
    skillTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
    skillTagText: { fontSize: 11, fontWeight: fonts.semibold },
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold },
    actionBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    profileSection: { marginTop: 16 },
    profileLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    profileText: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    matchScore: { backgroundColor: t.accent.green + '20', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
    matchScoreText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.heavy },
    matchReason: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
    mutualText: { color: t.text.secondary, fontSize: 11, marginTop: 4 },
    participantBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8 },
    participantFill: { height: 6, backgroundColor: t.accent.blue, borderRadius: 3 },
    participantText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    eventType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    eventDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    proposalStatus: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    interestedText: { color: t.text.secondary, fontSize: 12, marginTop: 8 },
    mentorLink: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginTop: 12 },
    editBtn: { backgroundColor: t.accent.blue + '20', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start', marginTop: 12 },
    editBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold },
  }), [t]);

  const renderProfile = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Your Professional Profile</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>{DEMO_PROFILE.name}</Text>
        <Text style={s.profileText}>{DEMO_PROFILE.experience}</Text>

        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_PROFILE.connectionsCount}</Text>
            <Text style={s.statLabel}>Connections</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_PROFILE.xOTKEarned}</Text>
            <Text style={s.statLabel}>xOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_PROFILE.skills.length}</Text>
            <Text style={s.statLabel}>Skills</Text>
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Skills</Text>
          <View style={s.tagRow}>
            {DEMO_PROFILE.skills.map((skill) => (
              <View key={skill.name} style={[s.skillTag, { borderColor: levelColor[skill.level] + '60', backgroundColor: levelColor[skill.level] + '15' }]}>
                <Text style={[s.skillTagText, { color: levelColor[skill.level] }]}>{skill.name} ({skill.level})</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Interests</Text>
          <View style={s.tagRow}>
            {DEMO_PROFILE.interests.map((interest) => (
              <View key={interest} style={s.tag}>
                <Text style={s.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.profileSection}>
          <Text style={s.profileLabel}>Looking For</Text>
          <View style={s.tagRow}>
            {DEMO_PROFILE.lookingFor.map((item) => (
              <View key={item} style={[s.tag, { backgroundColor: t.accent.purple + '20' }]}>
                <Text style={[s.tagText, { color: t.accent.purple }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={s.editBtn}
          onPress={() => Alert.alert('Edit Profile (Demo)', 'In production, you can update your skills, interests, and bio. Changes are stored on Open Chain.')}
        >
          <Text style={s.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConnect = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Suggested Connections</Text>
      <Text style={[s.cardMeta, { marginBottom: 12 }]}>Matched by complementary skills and shared interests</Text>
      {DEMO_CONNECTIONS.map((conn) => (
        <View key={conn.id} style={s.card}>
          <View style={s.row}>
            <Text style={s.cardTitle}>{conn.name}</Text>
            <View style={s.matchScore}>
              <Text style={s.matchScoreText}>{conn.matchScore}% match</Text>
            </View>
          </View>
          <View style={s.tagRow}>
            {conn.skills.map((skill) => (
              <View key={skill} style={s.tag}>
                <Text style={s.tagText}>{skill}</Text>
              </View>
            ))}
          </View>
          <Text style={s.matchReason}>{conn.matchReason}</Text>
          <Text style={s.mutualText}>{conn.mutualConnections} mutual connection{conn.mutualConnections !== 1 ? 's' : ''}</Text>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => Alert.alert('Connection Request (Demo)', `Request sent to ${conn.name}. In production, this creates a professional connection on Open Chain and earns xOTK for both parties.`)}
          >
            <Text style={s.actionBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={() => Alert.alert('MentorMatch (Demo)', 'In production, this links to the Mentorship screen for deeper mentoring relationships.')}>
        <Text style={s.mentorLink}>Looking for a mentor? Visit MentorMatch</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEvents = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Networking Events</Text>
      {DEMO_EVENTS.map((evt) => {
        const fillPct = (evt.attendees / evt.maxAttendees) * 100;
        return (
          <View key={evt.id} style={s.card}>
            <Text style={s.eventType}>{eventTypeIcon[evt.type]} {evt.type}</Text>
            <Text style={s.cardTitle}>{evt.title}</Text>
            <Text style={s.cardMeta}>{evt.date} | {evt.location}</Text>
            <Text style={s.eventDesc}>{evt.description}</Text>
            <View style={s.participantBar}>
              <View style={[s.participantFill, { width: `${fillPct}%` }]} />
            </View>
            <Text style={s.participantText}>{evt.attendees}/{evt.maxAttendees} attendees</Text>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Alert.alert('RSVP (Demo)', `You RSVP'd to "${evt.title}". In production, this reserves your spot and earns xOTK for attendance.`)}
            >
              <Text style={s.actionBtnText}>RSVP</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderCollaborate = () => {
    const statusColor: Record<string, string> = {
      'open': t.accent.green,
      'in-progress': t.accent.blue,
      'closed': t.accent.red,
    };

    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Collaboration Proposals</Text>
        <Text style={[s.cardMeta, { marginBottom: 12 }]}>Pitch project ideas and find partners</Text>
        {DEMO_PROPOSALS.map((prop) => (
          <View key={prop.id} style={s.card}>
            <View style={s.row}>
              <Text style={s.cardTitle}>{prop.title}</Text>
              <View style={[s.proposalStatus, { backgroundColor: (statusColor[prop.status] || t.text.muted) + '20' }]}>
                <Text style={[s.badgeText, { color: statusColor[prop.status] || t.text.muted }]}>
                  {prop.status === 'in-progress' ? 'In Progress' : prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={s.cardSub}>by {prop.author}</Text>
            <Text style={[s.profileText, { marginTop: 8 }]}>{prop.description}</Text>
            <View style={s.profileSection}>
              <Text style={[s.profileLabel, { marginBottom: 4 }]}>Skills Needed</Text>
              <View style={s.tagRow}>
                {prop.skills_needed.map((skill) => (
                  <View key={skill} style={[s.tag, { backgroundColor: t.accent.purple + '20' }]}>
                    <Text style={[s.tagText, { color: t.accent.purple }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={s.interestedText}>{prop.interested} people interested</Text>
            {prop.status === 'open' && prop.author !== 'You' && (
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => Alert.alert('Interest Expressed (Demo)', `You expressed interest in "${prop.title}". In production, this notifies ${prop.author} and earns xOTK when collaboration begins.`)}
              >
                <Text style={s.actionBtnText}>I'm Interested</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={[s.actionBtn, { alignSelf: 'center', marginTop: 4, paddingHorizontal: 24 }]}
          onPress={() => Alert.alert('New Proposal (Demo)', 'In production, you can create a collaboration proposal describing your project idea, skills needed, and timeline.')}
        >
          <Text style={s.actionBtnText}>Create Proposal</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'connect', label: 'Connect' },
    { key: 'events', label: 'Events' },
    { key: 'collaborate', label: 'Collab' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Networking</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F310}'}</Text>
          <Text style={s.heroTitle}>Build Meaningful Connections</Text>
          <Text style={s.heroSub}>
            "No one succeeds alone. The connections we build become the bridges others will cross."
          </Text>
        </View>

        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
        </View>

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

        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'connect' && renderConnect()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'collaborate' && renderCollaborate()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
