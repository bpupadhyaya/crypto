/**
 * Debate Screen — Structured community debates, deliberation, civil discourse.
 *
 * Art VI: "Every person has the right to express their views and to hear
 *  opposing views in a structured, respectful environment."
 * — The Human Constitution, Article VI
 *
 * Features:
 * - Active debates (topic, positions, moderator, schedule)
 * - Structured format: opening statements, rebuttals, audience questions, closing
 * - Participate as debater or audience member
 * - Propose a topic for debate
 * - Debate archive with outcomes and community takeaways
 * - Civil discourse guidelines prominently displayed
 * - gOTK earned for moderation and thoughtful participation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type Tab = 'active' | 'propose' | 'archive' | 'guidelines';

interface DebatePosition {
  label: string;
  advocate: string;
}

interface DebateEvent {
  id: string;
  topic: string;
  description: string;
  positions: DebatePosition[];
  moderator: string;
  date: string;
  time: string;
  venue: string;
  status: 'upcoming' | 'live' | 'completed';
  format: string[];
  audienceSize: number;
  maxAudience: number;
  gotkReward: number;
  joinedAs: 'none' | 'debater' | 'audience';
}

interface ArchivedDebate {
  id: string;
  topic: string;
  date: string;
  moderator: string;
  positions: DebatePosition[];
  outcome: string;
  takeaways: string[];
  audienceSize: number;
  gotkDistributed: number;
}

interface TopicProposal {
  id: string;
  topic: string;
  proposedBy: string;
  date: string;
  description: string;
  votes: number;
  voted: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'active', label: 'Active', icon: '\u{1F3A4}' },
  { key: 'propose', label: 'Propose', icon: '\u{1F4DD}' },
  { key: 'archive', label: 'Archive', icon: '\u{1F4DA}' },
  { key: 'guidelines', label: 'Guidelines', icon: '\u{1F4DC}' },
];

const DEBATE_FORMAT = [
  { step: 'Opening Statements', duration: '5 min each', icon: '\u{1F3A4}' },
  { step: 'Rebuttals', duration: '3 min each', icon: '\u{1F504}' },
  { step: 'Audience Questions', duration: '15 min', icon: '\u{2753}' },
  { step: 'Closing Statements', duration: '3 min each', icon: '\u{1F3C1}' },
];

const CIVIL_DISCOURSE_GUIDELINES = [
  { title: 'Respect the Person', desc: 'Attack ideas, never people. Every participant deserves dignity regardless of their position.' },
  { title: 'Listen Actively', desc: 'Seek to understand before responding. Steelman the opposing view before critiquing it.' },
  { title: 'Evidence Over Emotion', desc: 'Support claims with evidence. Acknowledge when you lack data. Changing your mind is a sign of strength.' },
  { title: 'Stay on Topic', desc: 'Address the specific question being debated. Avoid whataboutism and tangential arguments.' },
  { title: 'Assume Good Faith', desc: 'Assume others are participating honestly. Question reasoning, not motives.' },
  { title: 'Time Limits Matter', desc: 'Respect the format. Concise arguments are stronger arguments. Yield time gracefully.' },
  { title: 'Moderation is Sacred', desc: 'The moderator ensures fairness. Follow their guidance. Moderators earn gOTK for their service.' },
  { title: 'Outcome Over Victory', desc: 'The goal is collective understanding, not winning. The best debates leave everyone wiser.' },
];

// ─── Demo Data ───

const DEMO_ACTIVE_DEBATES: DebateEvent[] = [
  {
    id: 'd1', topic: 'Should our community prioritize local food production over imported goods?',
    description: 'As food prices rise, should we invest community resources in local farms and gardens, even if imported food is currently cheaper? This debate examines trade-offs between food security, cost, and environmental impact.',
    positions: [
      { label: 'For Local Production', advocate: 'Dr. Elena Torres' },
      { label: 'For Open Trade', advocate: 'Marcus Webb' },
    ],
    moderator: 'Sarah Chen', date: '2026-04-05', time: '2:00 PM',
    venue: 'Community Center Main Hall', status: 'upcoming',
    format: ['Opening Statements', 'Rebuttals', 'Audience Q&A', 'Closing'],
    audienceSize: 34, maxAudience: 100, gotkReward: 50,
    joinedAs: 'none',
  },
  {
    id: 'd2', topic: 'Is universal basic income more effective than targeted social programs?',
    description: 'With growing economic uncertainty, which approach better serves community members: a universal basic income for all, or targeted programs addressing specific needs? We examine evidence from pilot programs worldwide.',
    positions: [
      { label: 'UBI is Better', advocate: 'Prof. James Liu' },
      { label: 'Targeted Programs', advocate: 'Amina Hassan' },
    ],
    moderator: 'David Park', date: '2026-04-12', time: '3:00 PM',
    venue: 'Virtual — Jitsi Meet', status: 'upcoming',
    format: ['Opening Statements', 'Rebuttals', 'Audience Q&A', 'Closing'],
    audienceSize: 67, maxAudience: 500, gotkReward: 50,
    joinedAs: 'none',
  },
  {
    id: 'd3', topic: 'Should technology education be mandatory in all schools starting at age 6?',
    description: 'As technology shapes every aspect of life, should formal tech education begin in first grade? Or does early screen time harm development? Experts debate the right age and approach.',
    positions: [
      { label: 'Start Early', advocate: 'To Be Determined' },
      { label: 'Wait Until Later', advocate: 'To Be Determined' },
    ],
    moderator: 'Pending', date: '2026-04-20', time: 'TBD',
    venue: 'Public Library Auditorium', status: 'upcoming',
    format: ['Opening Statements', 'Rebuttals', 'Audience Q&A', 'Closing'],
    audienceSize: 12, maxAudience: 80, gotkReward: 50,
    joinedAs: 'none',
  },
];

const DEMO_ARCHIVED_DEBATES: ArchivedDebate[] = [
  {
    id: 'a1', topic: 'Should community spaces be car-free zones?',
    date: '2026-03-15', moderator: 'Sarah Chen',
    positions: [
      { label: 'Yes, Car-Free', advocate: 'Lena Martinez' },
      { label: 'Balanced Access', advocate: 'Tom Richards' },
    ],
    outcome: 'Community voted 62-38 for a phased approach: pedestrian-priority zones on weekends expanding to full car-free zones over 2 years, with exceptions for accessibility needs.',
    takeaways: [
      'Accessibility must be preserved for elderly and disabled residents',
      'Weekend pilot programs help communities adjust gradually',
      'Local businesses need loading zone solutions',
      'Air quality and safety data strongly favor car-free zones',
    ],
    audienceSize: 78, gotkDistributed: 3900,
  },
  {
    id: 'a2', topic: 'How should community funds be allocated: infrastructure vs. education?',
    date: '2026-03-01', moderator: 'David Park',
    positions: [
      { label: 'Infrastructure First', advocate: 'Robert Kim' },
      { label: 'Education First', advocate: 'Dr. Patricia Nguyen' },
    ],
    outcome: 'Consensus reached: 60% infrastructure, 40% education with annual review. Both sides agreed that education investment yields long-term infrastructure savings through a more capable workforce.',
    takeaways: [
      'False dichotomy — both are essential and interconnected',
      'Education investment reduces long-term infrastructure costs',
      'Annual review mechanism ensures adaptive allocation',
      'Community input should drive specific project priorities',
    ],
    audienceSize: 92, gotkDistributed: 4600,
  },
];

const DEMO_PROPOSALS: TopicProposal[] = [
  {
    id: 'p1', topic: 'Should our community adopt a four-day work week pilot program?',
    proposedBy: 'Community Member #427', date: '2026-03-25',
    description: 'Exploring whether local businesses and organizations would benefit from a four-day work week, following successful pilots in Iceland and the UK.',
    votes: 45, voted: false,
  },
  {
    id: 'p2', topic: 'Is social media regulation a community responsibility or an individual one?',
    proposedBy: 'Youth Council', date: '2026-03-27',
    description: 'With rising concern about social media impact on mental health, especially among youth, should communities set norms or leave it to individuals?',
    votes: 31, voted: false,
  },
];

// ─── Component ───

export function DebateScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [debates, setDebates] = useState(DEMO_ACTIVE_DEBATES);
  const [proposals, setProposals] = useState(DEMO_PROPOSALS);
  const [showPropose, setShowPropose] = useState(false);
  const [proposeTopic, setProposeTopic] = useState('');
  const [proposeDesc, setProposeDesc] = useState('');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: t.bg.card, marginHorizontal: 4 },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabLabel: { color: t.text.secondary, fontSize: 11, fontWeight: '600', marginTop: 2 },
    tabLabelActive: { color: '#fff' },
    tabIcon: { fontSize: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { color: t.accent.purple, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    metaBadge: { backgroundColor: t.bg.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    metaText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    secondaryBtn: { backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    secondaryBtnText: { color: t.accent.purple, fontSize: 14, fontWeight: '700' },
    outlineBtn: { borderWidth: 1, borderColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    outlineBtnText: { color: t.accent.purple, fontSize: 14, fontWeight: '700' },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center', marginBottom: 8 },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    positionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    positionCard: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, alignItems: 'center' },
    positionLabel: { color: t.accent.purple, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    positionAdvocate: { color: t.text.secondary, fontSize: 12, textAlign: 'center' },
    formatCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    formatStep: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.bg.primary },
    formatStepLast: { borderBottomWidth: 0 },
    formatIcon: { fontSize: 24, marginRight: 12 },
    formatStepName: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    formatStepDuration: { color: t.text.muted, fontSize: 12 },
    guidelineCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guidelineNumber: { color: t.accent.purple, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    guidelineTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    guidelineDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20 },
    outcomeCard: { backgroundColor: t.accent.purple + '10', borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 8 },
    outcomeLabel: { color: t.accent.purple, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    outcomeText: { color: t.text.primary, fontSize: 13, lineHeight: 20 },
    takeawayItem: { flexDirection: 'row', marginBottom: 6, paddingRight: 16 },
    takeawayBullet: { color: t.accent.purple, fontSize: 14, marginRight: 8, marginTop: 1 },
    takeawayText: { color: t.text.secondary, fontSize: 13, lineHeight: 20, flex: 1 },
    voteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    voteCount: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    gotkBadge: { backgroundColor: '#f59e0b20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    gotkText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusUpcoming: { backgroundColor: '#3b82f620' },
    statusLive: { backgroundColor: '#22c55e20' },
    statusText: { fontSize: 12, fontWeight: '700' },
    btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    btnHalf: { flex: 1 },
  }), [t]);

  const handleJoinDebate = useCallback((id: string, role: 'debater' | 'audience') => {
    setDebates(prev => prev.map(d => {
      if (d.id !== id) return d;
      if (d.joinedAs === role) {
        return { ...d, joinedAs: 'none', audienceSize: role === 'audience' ? d.audienceSize - 1 : d.audienceSize };
      }
      const prevAudience = d.joinedAs === 'audience' ? d.audienceSize - 1 : d.audienceSize;
      return {
        ...d,
        joinedAs: role,
        audienceSize: role === 'audience' ? prevAudience + 1 : prevAudience,
      };
    }));
  }, []);

  const handleVoteProposal = useCallback((id: string) => {
    setProposals(prev => prev.map(p =>
      p.id === id ? { ...p, voted: !p.voted, votes: p.voted ? p.votes - 1 : p.votes + 1 } : p
    ));
  }, []);

  const handleSubmitProposal = useCallback(() => {
    if (!proposeTopic.trim() || !proposeDesc.trim()) {
      Alert.alert('Missing Fields', 'Please provide both a topic and description.');
      return;
    }
    Alert.alert('Topic Proposed', `"${proposeTopic}" has been submitted. Community members can now vote on it.`);
    setProposeTopic('');
    setProposeDesc('');
    setShowPropose(false);
  }, [proposeTopic, proposeDesc]);

  // ─── Render Helpers ───

  const renderActive = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F3A4}'}</Text>
        <Text style={s.heroTitle}>Community Debates</Text>
        <Text style={s.heroSubtitle}>
          Structured deliberation on the issues that matter.{'\n'}Earn gOTK for thoughtful participation and moderation.
        </Text>
      </View>

      <Text style={s.section}>Debate Format</Text>
      <View style={s.formatCard}>
        {DEBATE_FORMAT.map((step, i) => (
          <View key={step.step} style={[s.formatStep, i === DEBATE_FORMAT.length - 1 && s.formatStepLast]}>
            <Text style={s.formatIcon}>{step.icon}</Text>
            <Text style={s.formatStepName}>{step.step}</Text>
            <Text style={s.formatStepDuration}>{step.duration}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Active & Upcoming Debates</Text>
      {debates.map(d => (
        <View key={d.id} style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={[s.statusBadge, d.status === 'live' ? s.statusLive : s.statusUpcoming]}>
              <Text style={[s.statusText, { color: d.status === 'live' ? '#22c55e' : '#3b82f6' }]}>
                {d.status === 'live' ? '\u{1F534} LIVE' : '\u{1F4C5} Upcoming'}
              </Text>
            </View>
            <View style={s.gotkBadge}>
              <Text style={s.gotkText}>+{d.gotkReward} gOTK</Text>
            </View>
          </View>
          <Text style={s.cardTitle}>{d.topic}</Text>
          <Text style={s.cardDesc}>{d.description}</Text>

          <Text style={[s.section, { marginLeft: 0, marginTop: 12 }]}>Positions</Text>
          <View style={s.positionRow}>
            {d.positions.map((pos, i) => (
              <View key={i} style={s.positionCard}>
                <Text style={s.positionLabel}>{pos.label}</Text>
                <Text style={s.positionAdvocate}>{pos.advocate}</Text>
              </View>
            ))}
          </View>

          <View style={s.cardMeta}>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F9D1}\u{200D}\u{2696}'} {d.moderator}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {d.date}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F552}'} {d.time}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4CD}'} {d.venue}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F465}'} {d.audienceSize}/{d.maxAudience}</Text></View>
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[d.joinedAs === 'debater' ? s.secondaryBtn : s.outlineBtn, s.btnHalf]}
              onPress={() => handleJoinDebate(d.id, 'debater')}
            >
              <Text style={d.joinedAs === 'debater' ? s.secondaryBtnText : s.outlineBtnText}>
                {d.joinedAs === 'debater' ? 'Leave as Debater' : 'Join as Debater'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[d.joinedAs === 'audience' ? s.secondaryBtn : s.actionBtn, s.btnHalf]}
              onPress={() => handleJoinDebate(d.id, 'audience')}
            >
              <Text style={d.joinedAs === 'audience' ? s.secondaryBtnText : s.actionBtnText}>
                {d.joinedAs === 'audience' ? 'Leave Audience' : 'Join Audience'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPropose = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4DD}'}</Text>
        <Text style={s.heroTitle}>Propose a Topic</Text>
        <Text style={s.heroSubtitle}>
          Suggest topics that matter to the community.{'\n'}The most-voted topics become scheduled debates.
        </Text>
      </View>

      <Text style={s.section}>Community Proposals</Text>
      {proposals.map(p => (
        <View key={p.id} style={s.card}>
          <Text style={s.cardTitle}>{p.topic}</Text>
          <Text style={s.cardDesc}>{p.description}</Text>
          <View style={s.cardMeta}>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F9D1}'} {p.proposedBy}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {p.date}</Text></View>
          </View>
          <View style={s.voteRow}>
            <TouchableOpacity
              style={p.voted ? s.secondaryBtn : s.actionBtn}
              onPress={() => handleVoteProposal(p.id)}
            >
              <Text style={p.voted ? s.secondaryBtnText : s.actionBtnText}>
                {p.voted ? 'Remove Vote' : '\u{1F44D} Vote for This'}
              </Text>
            </TouchableOpacity>
            <Text style={s.voteCount}>{p.votes} votes</Text>
          </View>
        </View>
      ))}

      <Text style={s.section}>Submit New Topic</Text>
      {showPropose ? (
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Debate Topic</Text>
          <TextInput style={s.input} value={proposeTopic} onChangeText={setProposeTopic} placeholder="Frame as a clear question" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Description</Text>
          <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} value={proposeDesc} onChangeText={setProposeDesc} placeholder="Why should we debate this? What are the key perspectives?" placeholderTextColor={t.text.muted} multiline />

          <TouchableOpacity style={s.actionBtn} onPress={handleSubmitProposal}>
            <Text style={s.actionBtnText}>Submit Proposal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowPropose(false)}>
            <Text style={s.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[s.actionBtn, { marginHorizontal: 20 }]} onPress={() => setShowPropose(true)}>
          <Text style={s.actionBtnText}>{'\u{2795}'} Propose a Topic</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderArchive = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4DA}'}</Text>
        <Text style={s.heroTitle}>Debate Archive</Text>
        <Text style={s.heroSubtitle}>
          Past debates with outcomes and community takeaways.{'\n'}Learn from every conversation.
        </Text>
      </View>

      <Text style={s.section}>Past Debates</Text>
      {DEMO_ARCHIVED_DEBATES.map(d => (
        <View key={d.id} style={s.card}>
          <Text style={s.cardTitle}>{d.topic}</Text>
          <View style={s.cardMeta}>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {d.date}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F9D1}\u{200D}\u{2696}'} {d.moderator}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F465}'} {d.audienceSize} attended</Text></View>
            <View style={s.gotkBadge}><Text style={s.gotkText}>{d.gotkDistributed} gOTK distributed</Text></View>
          </View>

          <View style={s.positionRow}>
            {d.positions.map((pos, i) => (
              <View key={i} style={s.positionCard}>
                <Text style={s.positionLabel}>{pos.label}</Text>
                <Text style={s.positionAdvocate}>{pos.advocate}</Text>
              </View>
            ))}
          </View>

          <View style={s.outcomeCard}>
            <Text style={s.outcomeLabel}>Outcome</Text>
            <Text style={s.outcomeText}>{d.outcome}</Text>
          </View>

          <Text style={[s.section, { marginLeft: 0, marginTop: 12 }]}>Community Takeaways</Text>
          {d.takeaways.map((tw, i) => (
            <View key={i} style={s.takeawayItem}>
              <Text style={s.takeawayBullet}>{'\u{2022}'}</Text>
              <Text style={s.takeawayText}>{tw}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  const renderGuidelines = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4DC}'}</Text>
        <Text style={s.heroTitle}>Civil Discourse Guidelines</Text>
        <Text style={s.heroSubtitle}>
          The foundation of meaningful debate is mutual respect.{'\n'}These guidelines govern all community debates.
        </Text>
      </View>

      <Text style={s.section}>Our Principles</Text>
      {CIVIL_DISCOURSE_GUIDELINES.map((g, i) => (
        <View key={i} style={s.guidelineCard}>
          <Text style={s.guidelineNumber}>{i + 1}</Text>
          <Text style={s.guidelineTitle}>{g.title}</Text>
          <Text style={s.guidelineDesc}>{g.desc}</Text>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center', marginTop: 8 }]}>
        <Text style={[s.cardTitle, { textAlign: 'center', marginBottom: 8 }]}>Become a Moderator</Text>
        <Text style={[s.cardDesc, { textAlign: 'center' }]}>
          Moderators uphold these guidelines and ensure fair, productive debates. Earn gOTK for every debate you moderate.
        </Text>
        <TouchableOpacity style={[s.actionBtn, { width: '100%' }]} onPress={() => Alert.alert('Moderator Application', 'Your application to become a debate moderator has been submitted. The community will review your history of civil participation.')}>
          <Text style={s.actionBtnText}>{'\u{1F9D1}\u{200D}\u{2696}'} Apply to Moderate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F3A4}'} Community Debates</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={s.tabIcon}>{tb.icon}</Text>
            <Text style={[s.tabLabel, tab === tb.key && s.tabLabelActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'active' && renderActive()}
        {tab === 'propose' && renderPropose()}
        {tab === 'archive' && renderArchive()}
        {tab === 'guidelines' && renderGuidelines()}
      </ScrollView>
    </SafeAreaView>
  );
}
