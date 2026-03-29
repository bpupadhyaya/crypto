/**
 * Youth Council Screen — Youth governance under Art VI of The Human Constitution.
 *
 * Gives young people (ages 13-25) a structured voice in community decisions.
 * Youth proposals are mentor-reviewed before going to vote. Participation earns gOTK.
 *
 * Features:
 * - Elected youth council representatives with terms and regions
 * - Youth proposals (mentor-reviewed before community vote)
 * - Youth-specific voting on proposals (gOTK earned by participation)
 * - Discussion forum for debate before voting
 * - Youth mentor assignment
 * - Impact tracker — proposals that became community initiatives
 * - Youth leadership program (badges, governance skills)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface CouncilMember {
  id: string;
  name: string;
  age: number;
  region: string;
  role: string;
  termStart: string;
  termEnd: string;
  proposalsAuthored: number;
  votesParticipated: number;
  badges: string[];
  mentorName: string;
}

interface YouthProposal {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'mentor-review' | 'voting' | 'passed' | 'rejected' | 'implemented';
  mentorName: string;
  mentorApproved: boolean;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligible: number;
  discussionCount: number;
  gotkReward: number;
  createdDate: string;
  voteEndDate: string;
}

interface DiscussionPost {
  id: string;
  proposalId: string;
  authorName: string;
  authorAge: number;
  message: string;
  date: string;
  likes: number;
}

interface CompletedInitiative {
  id: string;
  proposalId: string;
  title: string;
  authorName: string;
  implementedDate: string;
  impactDescription: string;
  beneficiaries: number;
  gotkDistributed: number;
  category: string;
}

interface LeadershipBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_COUNCIL: CouncilMember[] = [
  {
    id: 'c1', name: 'Aisha Patel', age: 19, region: 'South Asia',
    role: 'Council Chair', termStart: '2026-01-15', termEnd: '2027-01-15',
    proposalsAuthored: 4, votesParticipated: 12, badges: ['First Proposal', 'Debate Champion', 'Mentor Star'],
    mentorName: 'Dr. Ravi Sharma',
  },
  {
    id: 'c2', name: 'Marcus Johnson', age: 22, region: 'North America',
    role: 'Vice Chair', termStart: '2026-01-15', termEnd: '2027-01-15',
    proposalsAuthored: 3, votesParticipated: 11, badges: ['First Proposal', 'Community Builder'],
    mentorName: 'Prof. Linda Torres',
  },
  {
    id: 'c3', name: 'Emilia Bergstrom', age: 16, region: 'Europe',
    role: 'Secretary', termStart: '2026-03-01', termEnd: '2027-03-01',
    proposalsAuthored: 1, votesParticipated: 6, badges: ['First Vote', 'Rising Voice'],
    mentorName: 'Hans Mueller',
  },
];

const DEMO_PROPOSALS: YouthProposal[] = [
  {
    id: 'yp1', title: 'Youth Mental Health First Aid Training',
    description: 'Require every school in participating communities to offer free mental health first aid workshops for students aged 14-18. Trained peer counselors earn gOTK for each session they lead.',
    authorId: 'c1', authorName: 'Aisha Patel',
    status: 'voting', mentorName: 'Dr. Ravi Sharma', mentorApproved: true,
    yesVotes: 187, noVotes: 23, abstainVotes: 14, totalEligible: 500,
    discussionCount: 34, gotkReward: 150, createdDate: '2026-03-10', voteEndDate: '2026-04-10',
  },
  {
    id: 'yp2', title: 'Open Source Coding Bootcamp for Teens',
    description: 'A 12-week free coding bootcamp teaching open-source development to teens aged 13-17. Graduates contribute to Open Chain codebase and earn gOTK for merged pull requests.',
    authorId: 'c2', authorName: 'Marcus Johnson',
    status: 'voting', mentorName: 'Prof. Linda Torres', mentorApproved: true,
    yesVotes: 210, noVotes: 8, abstainVotes: 22, totalEligible: 500,
    discussionCount: 47, gotkReward: 200, createdDate: '2026-03-05', voteEndDate: '2026-04-05',
  },
  {
    id: 'yp3', title: 'Community Garden Youth Leadership Program',
    description: 'Youth-led community gardens in 5 pilot neighborhoods. Young people plan, plant, and distribute produce to food-insecure families. Mentor oversight ensures safety.',
    authorId: 'c3', authorName: 'Emilia Bergstrom',
    status: 'mentor-review', mentorName: 'Hans Mueller', mentorApproved: false,
    yesVotes: 0, noVotes: 0, abstainVotes: 0, totalEligible: 500,
    discussionCount: 12, gotkReward: 175, createdDate: '2026-03-22', voteEndDate: '',
  },
];

const DEMO_DISCUSSIONS: DiscussionPost[] = [
  { id: 'd1', proposalId: 'yp1', authorName: 'Kai Yamamoto', authorAge: 17, message: 'This is so needed. Two of my friends dropped out because they had no one to talk to. Peer counselors who actually understand what we go through would make a huge difference.', date: '2026-03-12', likes: 28 },
  { id: 'd2', proposalId: 'yp1', authorName: 'Sara Okonkwo', authorAge: 20, message: 'How do we ensure the training is evidence-based? I suggest partnering with WHO-certified programs. We should also have adult backup for emergencies.', date: '2026-03-13', likes: 41 },
  { id: 'd3', proposalId: 'yp1', authorName: 'Aisha Patel', authorAge: 19, message: 'Great point Sara. Updated the proposal to require WHO Youth Mental Health certification for all trainers. Adult mental health professionals will be on-call during every session.', date: '2026-03-14', likes: 35 },
  { id: 'd4', proposalId: 'yp2', authorName: 'Dev Anand', authorAge: 15, message: 'Can we include hardware projects too? Some of us want to build things, not just write software.', date: '2026-03-07', likes: 19 },
  { id: 'd5', proposalId: 'yp2', authorName: 'Marcus Johnson', authorAge: 22, message: 'Absolutely, Dev. I am adding a hardware track with Arduino/Raspberry Pi projects. Great suggestion!', date: '2026-03-08', likes: 24 },
  { id: 'd6', proposalId: 'yp3', authorName: 'Lina Park', authorAge: 14, message: 'We already have a small plot behind our school. Can we be one of the pilot neighborhoods?', date: '2026-03-23', likes: 8 },
];

const DEMO_INITIATIVES: CompletedInitiative[] = [
  {
    id: 'i1', proposalId: 'yp-old-1', title: 'Youth-Led River Cleanup Campaign',
    authorName: 'Former Council: Tomoko Hayashi',
    implementedDate: '2025-11-15',
    impactDescription: 'Youth volunteers cleaned 12 km of riverbank across 3 cities. 450 young people participated over 6 weekends. Local councils adopted the program as an annual event.',
    beneficiaries: 2800, gotkDistributed: 4500, category: 'Environment',
  },
];

const DEMO_BADGES: LeadershipBadge[] = [
  { id: 'b1', name: 'First Vote', description: 'Cast your first vote on a youth proposal', icon: '1', earned: true, earnedDate: '2026-02-10' },
  { id: 'b2', name: 'First Proposal', description: 'Author your first youth proposal', icon: '2', earned: false },
  { id: 'b3', name: 'Debate Champion', description: 'Contribute 10+ discussion posts', icon: '3', earned: true, earnedDate: '2026-03-15' },
  { id: 'b4', name: 'Community Builder', description: 'Get a proposal passed by majority vote', icon: '4', earned: false },
  { id: 'b5', name: 'Mentor Star', description: 'Complete a full term as youth council member', icon: '5', earned: false },
  { id: 'b6', name: 'Rising Voice', description: 'Participate in 5+ proposal votes', icon: '6', earned: true, earnedDate: '2026-03-20' },
  { id: 'b7', name: 'Impact Maker', description: 'Have a proposal become a real community initiative', icon: '7', earned: false },
  { id: 'b8', name: 'Peer Mentor', description: 'Guide a younger member through their first proposal', icon: '8', earned: false },
];

type Tab = 'council' | 'proposals' | 'impact';

export function YouthCouncilScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('council');
  const [proposals, setProposals] = useState(DEMO_PROPOSALS);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // New proposal form
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Discussion
  const [newComment, setNewComment] = useState('');
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null);

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.purple },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    statBox: { alignItems: 'center' },
    statValue: { color: t.accent.purple, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    memberName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    memberRole: { color: t.accent.purple, fontSize: 13, fontWeight: '600', marginTop: 2 },
    memberMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    memberDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    detailLabel: { color: t.text.muted, fontSize: 12 },
    detailValue: { color: t.text.primary, fontSize: 12, fontWeight: '600' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    badgePill: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgePillText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    proposalTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    proposalAuthor: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    proposalDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
    voteBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12, backgroundColor: t.bg.primary },
    voteBarYes: { backgroundColor: t.accent.green },
    voteBarNo: { backgroundColor: t.accent.red ?? '#f44336' },
    voteBarAbstain: { backgroundColor: t.accent.orange },
    voteLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    voteLegendText: { color: t.text.muted, fontSize: 11 },
    voteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    voteBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    rewardText: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 8 },
    discussBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    discussBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    discussionCard: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, marginTop: 8 },
    discussAuthor: { color: t.accent.purple, fontSize: 12, fontWeight: '700' },
    discussAge: { color: t.text.muted, fontSize: 11 },
    discussMessage: { color: t.text.primary, fontSize: 13, lineHeight: 19, marginTop: 4 },
    discussMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    discussDate: { color: t.text.muted, fontSize: 11 },
    discussLikes: { color: t.text.muted, fontSize: 11 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    newProposalBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    newProposalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    mentorNote: { backgroundColor: t.accent.orange + '10', borderRadius: 10, padding: 10, marginTop: 8 },
    mentorNoteText: { color: t.accent.orange, fontSize: 12, fontStyle: 'italic' },
    initiativeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    initiativeTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    initiativeCategory: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 2 },
    initiativeDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    initiativeStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    initiativeStat: { alignItems: 'center' },
    initiativeStatVal: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    initiativeStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    initiativeMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    leadershipTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20, marginTop: 20 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
    badgeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, width: '47%' },
    badgeCardEarned: { borderWidth: 1, borderColor: t.accent.green },
    badgeCardLocked: { opacity: 0.5 },
    badgeIcon: { fontSize: 24, marginBottom: 6 },
    badgeName: { color: t.text.primary, fontSize: 13, fontWeight: '700' },
    badgeDescText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    badgeEarnedDate: { color: t.accent.green, fontSize: 10, fontWeight: '600', marginTop: 4 },
    commentRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    commentInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, padding: 10, color: t.text.primary, fontSize: 13 },
    commentSendBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
    commentSendText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  }), [t]);

  const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    draft: { color: t.text.muted, label: 'Draft' },
    'mentor-review': { color: t.accent.orange, label: 'Mentor Review' },
    voting: { color: t.accent.blue, label: 'Open for Vote' },
    passed: { color: t.accent.green, label: 'Passed' },
    rejected: { color: t.accent.red ?? '#f44336', label: 'Rejected' },
    implemented: { color: t.accent.purple, label: 'Implemented' },
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'council', label: 'Council' },
    { key: 'proposals', label: 'Proposals' },
    { key: 'impact', label: 'Impact' },
  ];

  // ─── Handlers ───

  const handleVote = useCallback((proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== proposalId || p.status !== 'voting') return p;
        return {
          ...p,
          yesVotes: p.yesVotes + (vote === 'yes' ? 1 : 0),
          noVotes: p.noVotes + (vote === 'no' ? 1 : 0),
          abstainVotes: p.abstainVotes + (vote === 'abstain' ? 1 : 0),
        };
      }),
    );
    Alert.alert('Vote Recorded', `Your "${vote}" vote has been cast. +25 gOTK earned for civic participation.`);
  }, []);

  const handleSubmitProposal = useCallback(() => {
    if (!newTitle.trim()) { Alert.alert('Required', 'Enter a proposal title.'); return; }
    if (!newDesc.trim()) { Alert.alert('Required', 'Describe your proposal.'); return; }

    Alert.alert(
      'Proposal Submitted',
      'Your proposal has been submitted for mentor review. Your assigned mentor will review it within 48 hours before it goes to a vote.',
    );
    setNewTitle('');
    setNewDesc('');
    setShowNewProposal(false);
  }, [newTitle, newDesc]);

  const handlePostComment = useCallback((proposalId: string) => {
    if (!newComment.trim()) return;
    Alert.alert('Comment Posted', 'Your discussion comment has been added. +5 gOTK for participating in debate.');
    setNewComment('');
  }, [newComment]);

  // ─── Council Tab ───

  const renderCouncil = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Youth Council</Text>
        <Text style={s.heroSubtitle}>
          Art VI: Young people have the right to participate in decisions that shape their future. Elected representatives ages 13-25 guide youth governance.
        </Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{DEMO_COUNCIL.length}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{proposals.filter((p) => p.status === 'voting').length}</Text>
            <Text style={s.statLabel}>Active Votes</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{DEMO_INITIATIVES.length}</Text>
            <Text style={s.statLabel}>Initiatives</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Elected Representatives</Text>

      {DEMO_COUNCIL.map((member) => (
        <TouchableOpacity
          key={member.id}
          style={s.card}
          onPress={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
          activeOpacity={0.7}
        >
          <Text style={s.memberName}>{member.name}, {member.age}</Text>
          <Text style={s.memberRole}>{member.role}</Text>
          <Text style={s.memberMeta}>{member.region}</Text>

          {expandedMember === member.id && (
            <View style={s.memberDetail}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Term</Text>
                <Text style={s.detailValue}>{member.termStart} to {member.termEnd}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Proposals Authored</Text>
                <Text style={s.detailValue}>{member.proposalsAuthored}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Votes Participated</Text>
                <Text style={s.detailValue}>{member.votesParticipated}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Mentor</Text>
                <Text style={s.detailValue}>{member.mentorName}</Text>
              </View>
              <Text style={[s.detailLabel, { marginTop: 8, marginBottom: 4 }]}>Badges</Text>
              <View style={s.badgeRow}>
                {member.badges.map((badge) => (
                  <View key={badge} style={s.badgePill}>
                    <Text style={s.badgePillText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </>
  );

  // ─── Proposals Tab ───

  const renderProposals = () => {
    const proposalDiscussions = (proposalId: string) =>
      DEMO_DISCUSSIONS.filter((d) => d.proposalId === proposalId);

    return (
      <>
        <TouchableOpacity
          style={s.newProposalBtn}
          onPress={() => setShowNewProposal(!showNewProposal)}
        >
          <Text style={s.newProposalBtnText}>
            {showNewProposal ? 'Cancel' : 'Submit a Youth Proposal'}
          </Text>
        </TouchableOpacity>

        {showNewProposal && (
          <View style={[s.card, { marginBottom: 16 }]}>
            <Text style={s.sectionTitle}>New Proposal</Text>
            <TextInput
              style={s.input}
              placeholder="Proposal title"
              placeholderTextColor={t.text.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[s.input, s.descInput]}
              placeholder="Describe your proposal — what problem does it solve? How will it help young people?"
              placeholderTextColor={t.text.muted}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />
            <View style={s.mentorNote}>
              <Text style={s.mentorNoteText}>
                Your proposal will be reviewed by an assigned mentor before it goes to a community vote. This ensures proposals are well-structured and feasible.
              </Text>
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={handleSubmitProposal}>
              <Text style={s.submitText}>Submit for Mentor Review</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.sectionTitle}>Active & Recent Proposals</Text>

        {proposals.map((proposal) => {
          const config = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
          const expanded = expandedProposal === proposal.id;
          const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
          const discussions = proposalDiscussions(proposal.id);
          const showingDiscussion = activeDiscussion === proposal.id;

          return (
            <TouchableOpacity
              key={proposal.id}
              style={s.card}
              onPress={() => setExpandedProposal(expanded ? null : proposal.id)}
              activeOpacity={0.7}
            >
              <Text style={s.proposalTitle}>{proposal.title}</Text>
              <Text style={s.proposalAuthor}>
                by {proposal.authorName} | Mentor: {proposal.mentorName}
              </Text>
              <View style={[s.statusBadge, { backgroundColor: config.color + '20' }]}>
                <Text style={[s.statusText, { color: config.color }]}>{config.label}</Text>
              </View>

              {expanded && (
                <>
                  <Text style={s.proposalDesc}>{proposal.description}</Text>

                  {!proposal.mentorApproved && (
                    <View style={s.mentorNote}>
                      <Text style={s.mentorNoteText}>
                        Awaiting mentor review by {proposal.mentorName}. The proposal will open for voting once approved.
                      </Text>
                    </View>
                  )}

                  {proposal.status === 'voting' && totalVotes > 0 && (
                    <>
                      <View style={s.voteBar}>
                        <View style={[s.voteBarYes, { flex: proposal.yesVotes }]} />
                        <View style={[s.voteBarNo, { flex: proposal.noVotes }]} />
                        <View style={[s.voteBarAbstain, { flex: proposal.abstainVotes }]} />
                      </View>
                      <View style={s.voteLegend}>
                        <Text style={s.voteLegendText}>Yes: {proposal.yesVotes}</Text>
                        <Text style={s.voteLegendText}>No: {proposal.noVotes}</Text>
                        <Text style={s.voteLegendText}>Abstain: {proposal.abstainVotes}</Text>
                      </View>
                      <Text style={[s.voteLegendText, { marginTop: 4 }]}>
                        {totalVotes} of {proposal.totalEligible} eligible voters ({Math.round((totalVotes / proposal.totalEligible) * 100)}% turnout)
                      </Text>
                    </>
                  )}

                  {proposal.status === 'voting' && (
                    <>
                      <View style={s.voteActions}>
                        <TouchableOpacity
                          style={[s.voteBtn, { backgroundColor: t.accent.green }]}
                          onPress={() => handleVote(proposal.id, 'yes')}
                        >
                          <Text style={s.voteBtnText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.voteBtn, { backgroundColor: t.accent.red ?? '#f44336' }]}
                          onPress={() => handleVote(proposal.id, 'no')}
                        >
                          <Text style={s.voteBtnText}>No</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.voteBtn, { backgroundColor: t.accent.orange }]}
                          onPress={() => handleVote(proposal.id, 'abstain')}
                        >
                          <Text style={s.voteBtnText}>Abstain</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={s.rewardText}>+25 gOTK for voting | +{proposal.gotkReward} gOTK if proposal passes</Text>
                    </>
                  )}

                  {/* Discussion */}
                  <TouchableOpacity
                    style={s.discussBtn}
                    onPress={() => setActiveDiscussion(showingDiscussion ? null : proposal.id)}
                  >
                    <Text style={s.discussBtnText}>
                      {showingDiscussion ? 'Hide Discussion' : `Discussion (${proposal.discussionCount})`}
                    </Text>
                  </TouchableOpacity>

                  {showingDiscussion && (
                    <>
                      {discussions.map((post) => (
                        <View key={post.id} style={s.discussionCard}>
                          <Text style={s.discussAuthor}>
                            {post.authorName} <Text style={s.discussAge}>(age {post.authorAge})</Text>
                          </Text>
                          <Text style={s.discussMessage}>{post.message}</Text>
                          <View style={s.discussMeta}>
                            <Text style={s.discussDate}>{post.date}</Text>
                            <Text style={s.discussLikes}>{post.likes} likes</Text>
                          </View>
                        </View>
                      ))}
                      <View style={s.commentRow}>
                        <TextInput
                          style={s.commentInput}
                          placeholder="Join the discussion..."
                          placeholderTextColor={t.text.muted}
                          value={newComment}
                          onChangeText={setNewComment}
                        />
                        <TouchableOpacity
                          style={s.commentSendBtn}
                          onPress={() => handlePostComment(proposal.id)}
                        >
                          <Text style={s.commentSendText}>Post</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {proposal.voteEndDate ? (
                    <Text style={[s.memberMeta, { marginTop: 8 }]}>
                      Vote ends: {proposal.voteEndDate}
                    </Text>
                  ) : null}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  // ─── Impact Tab ───

  const renderImpact = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Youth Impact</Text>
        <Text style={s.heroSubtitle}>
          Proposals that became real community initiatives — proof that youth governance creates change.
        </Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{DEMO_INITIATIVES.length}</Text>
            <Text style={s.statLabel}>Initiatives</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{DEMO_INITIATIVES.reduce((sum, i) => sum + i.beneficiaries, 0).toLocaleString()}</Text>
            <Text style={s.statLabel}>Beneficiaries</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{DEMO_INITIATIVES.reduce((sum, i) => sum + i.gotkDistributed, 0).toLocaleString()}</Text>
            <Text style={s.statLabel}>gOTK Distributed</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Completed Initiatives</Text>

      {DEMO_INITIATIVES.map((initiative) => (
        <View key={initiative.id} style={s.initiativeCard}>
          <Text style={s.initiativeTitle}>{initiative.title}</Text>
          <Text style={s.initiativeCategory}>{initiative.category}</Text>
          <Text style={s.initiativeDesc}>{initiative.impactDescription}</Text>
          <View style={s.initiativeStats}>
            <View style={s.initiativeStat}>
              <Text style={s.initiativeStatVal}>{initiative.beneficiaries.toLocaleString()}</Text>
              <Text style={s.initiativeStatLabel}>Beneficiaries</Text>
            </View>
            <View style={s.initiativeStat}>
              <Text style={s.initiativeStatVal}>{initiative.gotkDistributed.toLocaleString()}</Text>
              <Text style={s.initiativeStatLabel}>gOTK Distributed</Text>
            </View>
          </View>
          <Text style={s.initiativeMeta}>
            Led by {initiative.authorName} | Implemented {initiative.implementedDate}
          </Text>
        </View>
      ))}

      {/* Leadership Badges */}
      <Text style={s.leadershipTitle}>Youth Leadership Program</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 12, textAlign: 'left' }]}>
        Earn badges by participating in governance. Build skills that matter.
      </Text>
      <View style={s.badgeGrid}>
        {DEMO_BADGES.map((badge) => (
          <View
            key={badge.id}
            style={[s.badgeCard, badge.earned ? s.badgeCardEarned : s.badgeCardLocked]}
          >
            <Text style={s.badgeIcon}>{badge.earned ? badge.icon : '?'}</Text>
            <Text style={s.badgeName}>{badge.name}</Text>
            <Text style={s.badgeDescText}>{badge.description}</Text>
            {badge.earned && badge.earnedDate && (
              <Text style={s.badgeEarnedDate}>Earned {badge.earnedDate}</Text>
            )}
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Youth Council</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'council' && renderCouncil()}
        {tab === 'proposals' && renderProposals()}
        {tab === 'impact' && renderImpact()}
      </ScrollView>
    </SafeAreaView>
  );
}
