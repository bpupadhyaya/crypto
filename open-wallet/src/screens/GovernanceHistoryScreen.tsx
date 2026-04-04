import { fonts } from '../utils/theme';
/**
 * Governance History Screen — Full governance participation history.
 *
 * Shows all proposals voted on, proposals submitted, amendment
 * deliberations, and a timeline of governance score and gOTK earned.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface VoteRecord {
  id: string;
  proposalId: string;
  proposalTitle: string;
  yourVote: 'yes' | 'no' | 'abstain';
  outcome: 'passed' | 'rejected' | 'pending';
  votedAt: string;
  gOtkEarned: number;
}

interface ProposalRecord {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'rejected' | 'active' | 'deliberation';
  submittedAt: string;
  votesFor: number;
  votesAgainst: number;
}

interface AmendmentRecord {
  id: string;
  articleNumber: number;
  articleTitle: string;
  role: 'proposer' | 'deliberator' | 'voter';
  status: 'ratified' | 'deliberation' | 'rejected';
  participatedAt: string;
  gOtkEarned: number;
}

interface TimelineEntry {
  date: string;
  event: string;
  gOtkDelta: number;
  scoreDelta: number;
}

type Tab = 'votes' | 'proposals' | 'amendments' | 'timeline';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_VOTES: VoteRecord[] = [
  { id: 'v_001', proposalId: 'p_010', proposalTitle: 'Increase validator set to 150', yourVote: 'yes', outcome: 'passed', votedAt: '2026-03-28', gOtkEarned: 5 },
  { id: 'v_002', proposalId: 'p_009', proposalTitle: 'Add education channel to minting', yourVote: 'yes', outcome: 'passed', votedAt: '2026-03-25', gOtkEarned: 5 },
  { id: 'v_003', proposalId: 'p_008', proposalTitle: 'Reduce governance quorum to 33%', yourVote: 'no', outcome: 'rejected', votedAt: '2026-03-20', gOtkEarned: 5 },
  { id: 'v_004', proposalId: 'p_007', proposalTitle: 'Fund open-source tooling grants', yourVote: 'yes', outcome: 'passed', votedAt: '2026-03-15', gOtkEarned: 5 },
  { id: 'v_005', proposalId: 'p_006', proposalTitle: 'Enable cross-chain bridge to Cosmos Hub', yourVote: 'yes', outcome: 'passed', votedAt: '2026-03-10', gOtkEarned: 5 },
  { id: 'v_006', proposalId: 'p_005', proposalTitle: 'Amendment: Right to Privacy protections', yourVote: 'yes', outcome: 'passed', votedAt: '2026-03-05', gOtkEarned: 10 },
  { id: 'v_007', proposalId: 'p_004', proposalTitle: 'Increase block size to 4MB', yourVote: 'abstain', outcome: 'pending', votedAt: '2026-02-28', gOtkEarned: 3 },
  { id: 'v_008', proposalId: 'p_003', proposalTitle: 'Establish community moderation council', yourVote: 'yes', outcome: 'passed', votedAt: '2026-02-20', gOtkEarned: 5 },
];

const DEMO_PROPOSALS: ProposalRecord[] = [
  { id: 'sp_001', title: 'Universal childcare credit via nOTK', description: 'Mint nOTK rewards for verified childcare hours, incentivizing nurture value creation across communities.', status: 'passed', submittedAt: '2026-03-12', votesFor: 847, votesAgainst: 112 },
  { id: 'sp_002', title: 'Quarterly seed phrase verification requirement', description: 'Require wallet users to verify seed phrase knowledge every 90 days to maintain full governance voting weight.', status: 'active', submittedAt: '2026-03-26', votesFor: 234, votesAgainst: 89 },
];

const DEMO_AMENDMENTS: AmendmentRecord[] = [
  { id: 'am_001', articleNumber: 7, articleTitle: 'Right to Digital Privacy', role: 'deliberator', status: 'ratified', participatedAt: '2026-03-05', gOtkEarned: 25 },
];

const DEMO_TIMELINE: TimelineEntry[] = [
  { date: '2026-03-28', event: 'Voted on validator set expansion', gOtkDelta: 5, scoreDelta: 1 },
  { date: '2026-03-26', event: 'Submitted seed phrase verification proposal', gOtkDelta: 15, scoreDelta: 3 },
  { date: '2026-03-25', event: 'Voted on education channel', gOtkDelta: 5, scoreDelta: 1 },
  { date: '2026-03-20', event: 'Voted against quorum reduction', gOtkDelta: 5, scoreDelta: 1 },
  { date: '2026-03-15', event: 'Voted on tooling grants', gOtkDelta: 5, scoreDelta: 1 },
  { date: '2026-03-12', event: 'Submitted childcare credit proposal', gOtkDelta: 15, scoreDelta: 3 },
  { date: '2026-03-10', event: 'Voted on Cosmos bridge', gOtkDelta: 5, scoreDelta: 1 },
  { date: '2026-03-05', event: 'Deliberated on Right to Privacy amendment', gOtkDelta: 25, scoreDelta: 5 },
];

// --- Component ---

export function GovernanceHistoryScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('votes');

  const votes = demoMode ? DEMO_VOTES : [];
  const proposals = demoMode ? DEMO_PROPOSALS : [];
  const amendments = demoMode ? DEMO_AMENDMENTS : [];
  const timeline = demoMode ? DEMO_TIMELINE : [];

  const totalGotk = demoMode ? 83 : 0;
  const govScore = demoMode ? 72 : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'votes', label: 'Votes' },
    { key: 'proposals', label: 'Proposals' },
    { key: 'amendments', label: 'Amendments' },
    { key: 'timeline', label: 'Timeline' },
  ];

  const voteColor = (v: string) => v === 'yes' ? t.accent.green : v === 'no' ? t.accent.red : t.accent.orange;
  const outcomeColor = (o: string) => o === 'passed' ? t.accent.green : o === 'rejected' ? t.accent.red : t.accent.orange;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
    scoreStat: { alignItems: 'center' },
    scoreValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, gap: 6 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontWeight: fonts.bold },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    cardDesc: { color: t.text.secondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    metaText: { color: t.text.muted, fontSize: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold },
    voteRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    voteBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    outcomeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    gotkEarned: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, marginTop: 6 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 4 },
    timelineRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderLeftWidth: 2, borderLeftColor: t.border, marginLeft: 20 },
    timelineContent: { flex: 1 },
    timelineDate: { color: t.text.muted, fontSize: 11 },
    timelineEvent: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, marginTop: 2 },
    timelineDeltas: { flexDirection: 'row', gap: 12, marginTop: 4 },
    deltaText: { fontSize: 12, fontWeight: fonts.semibold },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: fonts.semibold },
  }), [t]);

  const renderVotes = () => (
    <FlatList
      data={votes}
      keyExtractor={(v) => v.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.cardTitle}>{item.proposalTitle}</Text>
          <View style={s.voteRow}>
            <View style={[s.voteBadge, { backgroundColor: voteColor(item.yourVote) + '22' }]}>
              <Text style={[s.badgeText, { color: voteColor(item.yourVote) }]}>
                You: {item.yourVote.toUpperCase()}
              </Text>
            </View>
            <View style={[s.outcomeBadge, { backgroundColor: outcomeColor(item.outcome) + '22' }]}>
              <Text style={[s.badgeText, { color: outcomeColor(item.outcome) }]}>
                {item.outcome.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={s.cardMeta}>
            <Text style={s.metaText}>{item.votedAt}</Text>
            <Text style={s.gotkEarned}>+{item.gOtkEarned} gOTK</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={s.empty}><Text style={s.emptyText}>No votes yet</Text></View>
      }
      contentContainerStyle={votes.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderProposals = () => (
    <FlatList
      data={proposals}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardDesc}>{item.description}</Text>
          <View style={s.cardMeta}>
            <Text style={s.metaText}>{item.submittedAt}</Text>
            <View style={[s.badge, { backgroundColor: outcomeColor(item.status) + '22' }]}>
              <Text style={[s.badgeText, { color: outcomeColor(item.status) }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={s.statsRow}>
            <Text style={[s.metaText, { color: t.accent.green }]}>For: {item.votesFor}</Text>
            <Text style={[s.metaText, { color: t.accent.red }]}>Against: {item.votesAgainst}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={s.empty}><Text style={s.emptyText}>No proposals submitted</Text></View>
      }
      contentContainerStyle={proposals.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderAmendments = () => (
    <FlatList
      data={amendments}
      keyExtractor={(a) => a.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.cardTitle}>Article {item.articleNumber}: {item.articleTitle}</Text>
          <View style={s.voteRow}>
            <View style={[s.badge, { backgroundColor: t.accent.blue + '22' }]}>
              <Text style={[s.badgeText, { color: t.accent.blue }]}>{item.role.toUpperCase()}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: outcomeColor(item.status) + '22' }]}>
              <Text style={[s.badgeText, { color: outcomeColor(item.status) }]}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={s.cardMeta}>
            <Text style={s.metaText}>{item.participatedAt}</Text>
            <Text style={s.gotkEarned}>+{item.gOtkEarned} gOTK</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={s.empty}><Text style={s.emptyText}>No amendment participation</Text></View>
      }
      contentContainerStyle={amendments.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderTimeline = () => (
    <ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}>
      {timeline.map((entry, i) => (
        <View key={i} style={s.timelineRow}>
          <View style={[s.timelineDot, { backgroundColor: t.accent.blue }]} />
          <View style={s.timelineContent}>
            <Text style={s.timelineDate}>{entry.date}</Text>
            <Text style={s.timelineEvent}>{entry.event}</Text>
            <View style={s.timelineDeltas}>
              <Text style={[s.deltaText, { color: t.accent.green }]}>+{entry.gOtkDelta} gOTK</Text>
              <Text style={[s.deltaText, { color: t.accent.blue }]}>+{entry.scoreDelta} Score</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Governance History</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.scoreRow}>
        <View style={s.scoreStat}>
          <Text style={s.scoreValue}>{govScore}</Text>
          <Text style={s.scoreLabel}>Gov Score</Text>
        </View>
        <View style={s.scoreStat}>
          <Text style={s.scoreValue}>{totalGotk}</Text>
          <Text style={s.scoreLabel}>gOTK Earned</Text>
        </View>
        <View style={s.scoreStat}>
          <Text style={s.scoreValue}>{votes.length}</Text>
          <Text style={s.scoreLabel}>Votes Cast</Text>
        </View>
        <View style={s.scoreStat}>
          <Text style={s.scoreValue}>{proposals.length}</Text>
          <Text style={s.scoreLabel}>Submitted</Text>
        </View>
      </View>

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'votes' && renderVotes()}
      {tab === 'proposals' && renderProposals()}
      {tab === 'amendments' && renderAmendments()}
      {tab === 'timeline' && renderTimeline()}
    </SafeAreaView>
  );
}
