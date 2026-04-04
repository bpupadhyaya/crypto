import { fonts } from '../utils/theme';
/**
 * Voting Power Screen — Show how voting power works in Open Chain.
 *
 * One-human-one-vote via Universal ID.
 * Your voting history, participation rate, active proposals to nudge.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

/* ─── Types ─── */

interface VotingHistory {
  proposalId: string;
  proposalTitle: string;
  vote: 'yes' | 'no' | 'abstain';
  votedAt: string;
  outcome: 'passed' | 'rejected' | 'voting';
}

interface ActiveProposal {
  id: string;
  title: string;
  status: 'voting';
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligible: number;
  endTime: string;
  hasVoted: boolean;
}

interface NetworkStats {
  totalUIDs: number;
  totalVoters: number; // UIDs that have ever voted
  participationRate: number;
  totalProposals: number;
  activeProposals: number;
}

interface Props {
  onClose: () => void;
}

/* ─── Demo Data ─── */

const DEMO_HISTORY: VotingHistory[] = [
  { proposalId: 'prop-1', proposalTitle: 'Increase nurture channel minting rate by 10%', vote: 'yes', votedAt: '2026-03-25', outcome: 'voting' },
  { proposalId: 'prop-2', proposalTitle: 'Add mental health as a sub-channel under Health', vote: 'yes', votedAt: '2026-03-15', outcome: 'passed' },
  { proposalId: 'prop-3', proposalTitle: 'Reduce governance voting period from 7 to 5 days', vote: 'no', votedAt: '2026-03-05', outcome: 'rejected' },
  { proposalId: 'prop-4', proposalTitle: 'Fund community developer grants', vote: 'yes', votedAt: '2026-02-20', outcome: 'passed' },
  { proposalId: 'prop-5', proposalTitle: 'Create education DAO with treasury allocation', vote: 'abstain', votedAt: '2026-02-10', outcome: 'passed' },
];

const DEMO_ACTIVE: ActiveProposal[] = [
  {
    id: 'prop-1', title: 'Increase nurture channel minting rate by 10%',
    status: 'voting', yesVotes: 1247, noVotes: 312, abstainVotes: 89, totalEligible: 5000,
    endTime: '2026-04-05', hasVoted: true,
  },
  {
    id: 'prop-6', title: 'Enable cross-chain IBC transfers to Cosmos Hub',
    status: 'voting', yesVotes: 890, noVotes: 156, abstainVotes: 45, totalEligible: 5000,
    endTime: '2026-04-08', hasVoted: false,
  },
  {
    id: 'prop-7', title: 'Allocate 10,000 OTK for testnet incentives',
    status: 'voting', yesVotes: 620, noVotes: 280, abstainVotes: 100, totalEligible: 5000,
    endTime: '2026-04-10', hasVoted: false,
  },
];

const DEMO_STATS: NetworkStats = {
  totalUIDs: 5000,
  totalVoters: 3200,
  participationRate: 64,
  totalProposals: 7,
  activeProposals: 3,
};

/* ─── Component ─── */

export function VotingPowerScreen({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<VotingHistory[]>([]);
  const [activeProposals, setActiveProposals] = useState<ActiveProposal[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [tab, setTab] = useState<'overview' | 'history' | 'active'>('overview');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1.5 },
    heroValue: { color: t.accent.blue, fontSize: 56, fontWeight: fonts.heavy, marginTop: 4 },
    heroUnit: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold, marginTop: 4 },
    heroSubtext: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    uidBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
    uidBadgeText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 20, marginTop: 12 },
    statCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, flex: 1, minWidth: '45%', alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'center' },
    participationCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 16 },
    participationLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    participationBar: { height: 12, backgroundColor: t.border, borderRadius: 6, marginTop: 8 },
    participationFill: { height: 12, borderRadius: 6 },
    participationText: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    explainerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 16 },
    explainerTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    explainerRow: { marginBottom: 16 },
    explainerSubtitle: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },
    explainerText: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 20, marginTop: 4 },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8 },
    historyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    historyVote: { fontSize: fonts.sm, fontWeight: fonts.bold },
    historyDate: { color: t.text.muted, fontSize: fonts.sm },
    historyOutcome: { fontSize: fonts.xs, fontWeight: fonts.bold },
    activeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    activeTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    activeVotes: { flexDirection: 'row', gap: 12, marginTop: 8 },
    activeVoteCount: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    nudgeBadge: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    nudgeText: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold },
    votedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    votedText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', lineHeight: 22 },
    loadingContainer: { alignItems: 'center', paddingVertical: 30 },
  }), [t]);

  useEffect(() => {
    setLoading(true);
    if (demoMode) {
      setTimeout(() => {
        setHistory(DEMO_HISTORY);
        setActiveProposals(DEMO_ACTIVE);
        setStats(DEMO_STATS);
        setLoading(false);
      }, 400);
    } else {
      // Production: would fetch from governance module
      setHistory([]);
      setActiveProposals([]);
      setStats({ totalUIDs: 0, totalVoters: 0, participationRate: 0, totalProposals: 0, activeProposals: 0 });
      setLoading(false);
    }
  }, [demoMode]);

  const voteColor = (vote: string) => {
    if (vote === 'yes') return t.accent.green;
    if (vote === 'no') return t.accent.red;
    return t.text.muted;
  };

  const outcomeColor = (outcome: string) => {
    if (outcome === 'passed') return t.accent.green;
    if (outcome === 'rejected') return t.accent.red;
    return t.accent.blue;
  };

  const unvotedCount = activeProposals.filter(p => !p.hasVoted).length;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.title}>Voting Power</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity></View>
        <View style={s.loadingContainer}><ActivityIndicator size="large" color={t.accent.blue} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Voting Power</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <ScrollView>
        {/* Hero: Your Voting Power */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Your Voting Power</Text>
          <Text style={s.heroValue}>1</Text>
          <Text style={s.heroUnit}>VOTE</Text>
          <Text style={s.heroSubtext}>
            Every registered Universal ID gets exactly one vote.{'\n'}Token balance does not affect voting power.
          </Text>
          <View style={s.uidBadge}>
            <Text style={s.uidBadgeText}>Universal ID Verified</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tab, tab === 'overview' && s.tabActive]} onPress={() => setTab('overview')}>
            <Text style={[s.tabText, tab === 'overview' && s.tabTextActive]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'active' && s.tabActive]} onPress={() => setTab('active')}>
            <Text style={[s.tabText, tab === 'active' && s.tabTextActive]}>
              Active{unvotedCount > 0 ? ` (${unvotedCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'history' && s.tabActive]} onPress={() => setTab('history')}>
            <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <>
            {/* Network Stats */}
            <Text style={s.section}>Network Voting Stats</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={s.statValue}>{stats.totalUIDs.toLocaleString()}</Text>
                <Text style={s.statLabel}>Total UIDs</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>{stats.totalVoters.toLocaleString()}</Text>
                <Text style={s.statLabel}>Active Voters</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>{stats.totalProposals}</Text>
                <Text style={s.statLabel}>Total Proposals</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>{stats.activeProposals}</Text>
                <Text style={s.statLabel}>Active Proposals</Text>
              </View>
            </View>

            {/* Participation Rate */}
            <View style={s.participationCard}>
              <Text style={s.participationLabel}>Network Participation Rate</Text>
              <View style={s.participationBar}>
                <View style={[s.participationFill, { width: `${stats.participationRate}%`, backgroundColor: stats.participationRate >= 50 ? t.accent.green : t.accent.orange }]} />
              </View>
              <Text style={s.participationText}>
                {stats.participationRate}% — {stats.totalVoters.toLocaleString()} of {stats.totalUIDs.toLocaleString()} UIDs have voted
              </Text>
            </View>

            {/* Your Stats */}
            <Text style={s.section}>Your Participation</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={[s.statValue, { color: t.accent.green }]}>{history.length}</Text>
                <Text style={s.statLabel}>Proposals Voted</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statValue, { color: t.accent.blue }]}>{history.length > 0 ? Math.round((history.length / (stats.totalProposals || 1)) * 100) : 0}%</Text>
                <Text style={s.statLabel}>Your Participation</Text>
              </View>
            </View>

            {/* Explainer */}
            <View style={s.explainerCard}>
              <Text style={s.explainerTitle}>How Voting Works on Open Chain</Text>
              <View style={s.explainerRow}>
                <Text style={s.explainerSubtitle}>One Human = One Vote</Text>
                <Text style={s.explainerText}>
                  Open Chain governance uses Universal ID verification. Each verified human gets exactly one vote, regardless of how many OTK tokens they hold. This prevents plutocratic capture.
                </Text>
              </View>
              <View style={s.explainerRow}>
                <Text style={s.explainerSubtitle}>Token-Weighted (DAOs)</Text>
                <Text style={s.explainerText}>
                  Individual DAOs can choose token-weighted voting where votes are proportional to token holdings. This is useful for investment DAOs or specialized communities. The base Open Chain governance always uses one-human-one-vote.
                </Text>
              </View>
              <View style={s.explainerRow}>
                <Text style={s.explainerSubtitle}>Quorum & Thresholds</Text>
                <Text style={s.explainerText}>
                  Proposals need 33% quorum (participation) and simple majority (50%+1) to pass. Critical proposals (parameter changes) need 67% supermajority.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Active Proposals Tab */}
        {tab === 'active' && (
          <>
            {unvotedCount > 0 && (
              <View style={[s.nudgeBadge, { marginHorizontal: 20, marginBottom: 12, alignSelf: 'flex-start' }]}>
                <Text style={s.nudgeText}>{unvotedCount} proposal{unvotedCount > 1 ? 's' : ''} awaiting your vote</Text>
              </View>
            )}
            {activeProposals.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyText}>No active proposals right now. Check back later!</Text>
              </View>
            ) : (
              activeProposals.map(p => {
                const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
                const yesPct = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;
                const quorumPct = p.totalEligible > 0 ? Math.round((totalVotes / p.totalEligible) * 100) : 0;
                return (
                  <View key={p.id} style={s.activeCard}>
                    <Text style={s.activeTitle}>{p.title}</Text>
                    <View style={s.activeVotes}>
                      <Text style={[s.activeVoteCount, { color: t.accent.green }]}>Yes: {p.yesVotes}</Text>
                      <Text style={[s.activeVoteCount, { color: t.accent.red }]}>No: {p.noVotes}</Text>
                      <Text style={[s.activeVoteCount, { color: t.text.muted }]}>Abstain: {p.abstainVotes}</Text>
                    </View>
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, { width: `${yesPct}%`, backgroundColor: t.accent.green }]} />
                    </View>
                    <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 4 }}>
                      Quorum: {quorumPct}% | Ends: {p.endTime}
                    </Text>
                    {p.hasVoted ? (
                      <View style={s.votedBadge}>
                        <Text style={s.votedText}>You voted</Text>
                      </View>
                    ) : (
                      <View style={s.nudgeBadge}>
                        <Text style={s.nudgeText}>You haven't voted yet — participate!</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <>
            {history.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyText}>No voting history yet. Participate in proposals to build your record!</Text>
              </View>
            ) : (
              history.map((h, i) => (
                <View key={i} style={s.historyCard}>
                  <Text style={s.historyTitle}>{h.proposalTitle}</Text>
                  <View style={s.historyRow}>
                    <Text style={[s.historyVote, { color: voteColor(h.vote) }]}>
                      Voted: {h.vote.toUpperCase()}
                    </Text>
                    <Text style={s.historyDate}>{h.votedAt}</Text>
                  </View>
                  <Text style={[s.historyOutcome, { color: outcomeColor(h.outcome), marginTop: 4 }]}>
                    Outcome: {h.outcome.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
