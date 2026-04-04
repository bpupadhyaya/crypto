import { fonts } from '../utils/theme';
/**
 * Public Speaking Screen — Community speaking opportunities and presentation skills.
 *
 * "Every voice matters. The courage to speak transforms communities
 *  and ignites change in those who listen."
 * — Human Constitution, Article I
 *
 * Browse speaking opportunities, join practice sessions,
 * learn speaking tips, and connect with experienced speakers.
 * eOTK earned for speaking at community events.
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

interface SpeakingOpportunity {
  id: string;
  title: string;
  event: string;
  date: string;
  location: string;
  audienceSize: string;
  topic: string;
  eOTK: number;
  status: 'open' | 'filled';
}

interface PracticeSession {
  id: string;
  title: string;
  host: string;
  date: string;
  participants: number;
  maxParticipants: number;
  focus: string;
}

interface SpeakingTip {
  id: string;
  category: 'structure' | 'delivery' | 'nerves' | 'storytelling' | 'visual-aids';
  title: string;
  summary: string;
  icon: string;
}

interface SpeakerProfile {
  id: string;
  name: string;
  specialties: string[];
  eventsSpoken: number;
  rating: number;
  available: boolean;
  eOTKEarned: number;
}

/* ── demo data ── */

const DEMO_OPPORTUNITIES: SpeakingOpportunity[] = [
  { id: 'opp1', title: 'Keynote: Building Community Trust', event: 'Town Hall Assembly', date: '2026-04-10', location: 'Community Center', audienceSize: '80-120', topic: 'Community Building', eOTK: 50, status: 'open' },
  { id: 'opp2', title: 'Workshop: Teach a Skill', event: 'Weekend Skills Fair', date: '2026-04-18', location: 'Library Hall', audienceSize: '20-40', topic: 'Any Skill', eOTK: 30, status: 'open' },
  { id: 'opp3', title: 'Panel: Youth Voices', event: 'Youth Leadership Summit', date: '2026-04-25', location: 'High School Auditorium', audienceSize: '150-200', topic: 'Youth Empowerment', eOTK: 40, status: 'filled' },
];

const DEMO_PRACTICE_SESSIONS: PracticeSession[] = [
  { id: 'ps1', title: 'Open Mic Practice Night', host: 'Speaker Circle', date: '2026-04-05', participants: 6, maxParticipants: 12, focus: 'Free topic — practice anything' },
  { id: 'ps2', title: 'Storytelling Workshop', host: 'Clara Osei', date: '2026-04-12', participants: 8, maxParticipants: 10, focus: 'Personal narratives and audience connection' },
];

const DEMO_TIPS: SpeakingTip[] = [
  { id: 'tip1', category: 'structure', title: 'The Power of Three', summary: 'Organize your talk into three main points. Audiences remember three things far better than five or seven. Open with a hook, deliver three ideas, close with a call to action.', icon: '\u{1F4DD}' },
  { id: 'tip2', category: 'delivery', title: 'Pause for Impact', summary: 'Silence is your most powerful tool. Pause after key points to let them land. A 3-second pause feels long to you but perfect to the audience.', icon: '\u{23F8}\u{FE0F}' },
  { id: 'tip3', category: 'nerves', title: 'Reframe Nervousness as Excitement', summary: 'Your body cannot tell the difference between anxiety and excitement. Say "I am excited" before speaking. Channel the energy into enthusiasm.', icon: '\u{1F4AA}' },
  { id: 'tip4', category: 'storytelling', title: 'Start with a Story', summary: 'Open with a personal anecdote. Stories bypass the analytical mind and create emotional connection. Make the audience feel before they think.', icon: '\u{1F4D6}' },
];

const DEMO_SPEAKERS: SpeakerProfile[] = [
  { id: 'spk1', name: 'Marcus Johnson', specialties: ['Keynotes', 'Motivational', 'Community Events'], eventsSpoken: 24, rating: 4.9, available: true, eOTKEarned: 720 },
  { id: 'spk2', name: 'Priya Nair', specialties: ['Workshops', 'Technical Talks', 'Panel Discussions'], eventsSpoken: 18, rating: 4.8, available: true, eOTKEarned: 540 },
];

type Tab = 'opportunities' | 'practice' | 'tips' | 'speakers';

export function PublicSpeakingScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
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
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold },
    eOTKBadge: { backgroundColor: t.accent.green + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    eOTKText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    disabledBtn: { backgroundColor: t.text.muted + '40' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { backgroundColor: t.accent.purple + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    tagText: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.semibold },
    tipIcon: { fontSize: 28, marginBottom: 8 },
    tipCategory: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    tipSummary: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    participantBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8 },
    participantFill: { height: 6, backgroundColor: t.accent.purple, borderRadius: 3 },
    participantText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    mentorLink: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 8 },
  }), [t]);

  const renderOpportunities = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Speaking Opportunities</Text>
      {DEMO_OPPORTUNITIES.map((opp) => (
        <View key={opp.id} style={s.card}>
          <Text style={s.cardTitle}>{opp.title}</Text>
          <Text style={s.cardSub}>{opp.event}</Text>
          <Text style={s.cardMeta}>{opp.date} | {opp.location} | {opp.audienceSize} people</Text>
          <View style={s.row}>
            <View style={[s.badge, { backgroundColor: opp.status === 'open' ? t.accent.green + '20' : t.accent.red + '20' }]}>
              <Text style={[s.badgeText, { color: opp.status === 'open' ? t.accent.green : t.accent.red }]}>
                {opp.status === 'open' ? 'Open' : 'Filled'}
              </Text>
            </View>
            <View style={s.eOTKBadge}>
              <Text style={s.eOTKText}>+{opp.eOTK} eOTK</Text>
            </View>
          </View>
          {opp.status === 'open' && (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Alert.alert('Applied (Demo)', `You applied to speak at "${opp.event}". In production, this registers your interest on Open Chain and earns ${opp.eOTK} eOTK upon completion.`)}
            >
              <Text style={s.actionBtnText}>Apply to Speak</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderPractice = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Practice Sessions</Text>
      <Text style={[s.cardMeta, { marginBottom: 12 }]}>Safe space to practice speeches and get peer feedback</Text>
      {DEMO_PRACTICE_SESSIONS.map((ps) => {
        const fillPct = (ps.participants / ps.maxParticipants) * 100;
        return (
          <View key={ps.id} style={s.card}>
            <Text style={s.cardTitle}>{ps.title}</Text>
            <Text style={s.cardSub}>Hosted by {ps.host}</Text>
            <Text style={s.cardMeta}>{ps.date} | Focus: {ps.focus}</Text>
            <View style={s.participantBar}>
              <View style={[s.participantFill, { width: `${fillPct}%` }]} />
            </View>
            <Text style={s.participantText}>{ps.participants}/{ps.maxParticipants} participants</Text>
            <TouchableOpacity
              style={[s.actionBtn, ps.participants >= ps.maxParticipants && s.disabledBtn]}
              onPress={() => {
                if (ps.participants >= ps.maxParticipants) return;
                Alert.alert('Joined (Demo)', `You joined "${ps.title}". In production, this reserves your spot and notifies the host.`);
              }}
            >
              <Text style={s.actionBtnText}>{ps.participants >= ps.maxParticipants ? 'Full' : 'Join Session'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderTips = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Speaking Tips</Text>
      {DEMO_TIPS.map((tip) => (
        <View key={tip.id} style={s.card}>
          <Text style={s.tipIcon}>{tip.icon}</Text>
          <Text style={s.tipCategory}>{tip.category.replace('-', ' ')}</Text>
          <Text style={s.cardTitle}>{tip.title}</Text>
          <Text style={s.tipSummary}>{tip.summary}</Text>
        </View>
      ))}
    </View>
  );

  const renderSpeakers = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Community Speakers</Text>
      <Text style={[s.cardMeta, { marginBottom: 12 }]}>Experienced speakers available to mentor you</Text>
      {DEMO_SPEAKERS.map((spk) => (
        <View key={spk.id} style={s.card}>
          <Text style={s.cardTitle}>{spk.name}</Text>
          <View style={s.tagRow}>
            {spk.specialties.map((spec) => (
              <View key={spec} style={s.tag}>
                <Text style={s.tagText}>{spec}</Text>
              </View>
            ))}
          </View>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{spk.eventsSpoken}</Text>
              <Text style={s.statLabel}>Events</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{spk.rating}/5</Text>
              <Text style={s.statLabel}>Rating</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.purple }]}>{spk.eOTKEarned}</Text>
              <Text style={s.statLabel}>eOTK Earned</Text>
            </View>
          </View>
          <View style={[s.badge, { backgroundColor: spk.available ? t.accent.green + '20' : t.accent.red + '20' }]}>
            <Text style={[s.badgeText, { color: spk.available ? t.accent.green : t.accent.red }]}>
              {spk.available ? 'Available to Mentor' : 'Unavailable'}
            </Text>
          </View>
          {spk.available && (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => Alert.alert('Mentorship Request (Demo)', `Request sent to ${spk.name}. In production, this creates a mentorship connection via Open Chain.`)}
            >
              <Text style={s.actionBtnText}>Request Mentorship</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'opportunities', label: 'Speak' },
    { key: 'practice', label: 'Practice' },
    { key: 'tips', label: 'Tips' },
    { key: 'speakers', label: 'Speakers' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Public Speaking</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F3A4}'}</Text>
          <Text style={s.heroTitle}>Find Your Voice</Text>
          <Text style={s.heroSub}>
            "Every voice matters. The courage to speak transforms communities and ignites change in those who listen."
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

        {activeTab === 'opportunities' && renderOpportunities()}
        {activeTab === 'practice' && renderPractice()}
        {activeTab === 'tips' && renderTips()}
        {activeTab === 'speakers' && renderSpeakers()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
