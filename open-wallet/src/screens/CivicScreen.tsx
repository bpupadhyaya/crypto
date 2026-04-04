import { fonts } from '../utils/theme';
/**
 * Civic Participation Screen — Governance engagement dashboard.
 *
 * Article I: "One human, one vote — your voice matters equally."
 * gOTK represents governance participation value.
 *
 * Features:
 * - Civic profile: level badge (observer -> statesperson), total gOTK
 * - Recent civic activities (votes, proposals, discussions)
 * - Active proposals you haven't voted on (nudge)
 * - Civic leaderboard (most engaged citizens)
 * - Participation rate visualization
 * - Demo mode
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface CivicProfile {
  uid: string;
  totalGOTK: number;
  totalVotes: number;
  totalProposals: number;
  totalDiscussions: number;
  participationRate: number; // 0-100
  civicLevel: string;
}

interface CivicActivity {
  id: string;
  uid: string;
  type: 'vote' | 'proposal' | 'discussion' | 'amendment';
  title: string;
  gotkEarned: number;
  date: string;
  outcome?: string;
}

interface UnvotedProposal {
  id: string;
  title: string;
  category: string;
  votesFor: number;
  votesAgainst: number;
  totalEligible: number;
  daysLeft: number;
}

interface CivicLeaderEntry {
  uid: string;
  totalGOTK: number;
  participationRate: number;
  totalVotes: number;
  civicLevel: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CIVIC_LEVELS: Record<string, { label: string; color: string }> = {
  observer: { label: 'Observer', color: '#8E8E93' },
  citizen: { label: 'Citizen', color: '#34C759' },
  advocate: { label: 'Advocate', color: '#007AFF' },
  leader: { label: 'Leader', color: '#AF52DE' },
  statesperson: { label: 'Statesperson', color: '#FF9500' },
};

const LEVEL_THRESHOLDS: Record<string, string> = {
  observer: '0-9 votes',
  citizen: '10-29 votes',
  advocate: '30-74 votes',
  leader: '75-149 votes',
  statesperson: '150+ votes',
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  vote: '#007AFF',
  proposal: '#AF52DE',
  discussion: '#34C759',
  amendment: '#FF9500',
};

// ─── Demo Data ───

const DEMO_PROFILE: CivicProfile = {
  uid: 'you',
  totalGOTK: 9200,
  totalVotes: 42,
  totalProposals: 3,
  totalDiscussions: 18,
  participationRate: 78,
  civicLevel: 'advocate',
};

const DEMO_ACTIVITIES: CivicActivity[] = [
  { id: '1', uid: 'you', type: 'vote', title: 'Voted YES on: Increase nurture channel minting rate by 10%', gotkEarned: 200, date: '2026-03-28', outcome: 'Pending' },
  { id: '2', uid: 'you', type: 'discussion', title: 'Comment on: Mental health sub-channel proposal', gotkEarned: 50, date: '2026-03-27' },
  { id: '3', uid: 'you', type: 'proposal', title: 'Submitted: Add preventive care bonus to hOTK minting', gotkEarned: 500, date: '2026-03-25', outcome: 'Voting' },
  { id: '4', uid: 'you', type: 'vote', title: 'Voted YES on: Add mental health as health sub-channel', gotkEarned: 200, date: '2026-03-22', outcome: 'Passed' },
  { id: '5', uid: 'you', type: 'vote', title: 'Voted NO on: Reduce governance voting period to 5 days', gotkEarned: 200, date: '2026-03-20', outcome: 'Rejected' },
  { id: '6', uid: 'you', type: 'discussion', title: 'Started thread: Universal childcare credit in nOTK', gotkEarned: 50, date: '2026-03-18' },
  { id: '7', uid: 'you', type: 'amendment', title: 'Proposed amendment to education milestone definitions', gotkEarned: 300, date: '2026-03-15', outcome: 'Under Review' },
  { id: '8', uid: 'you', type: 'vote', title: 'Voted YES on: Community board moderation guidelines', gotkEarned: 200, date: '2026-03-12', outcome: 'Passed' },
];

const DEMO_UNVOTED: UnvotedProposal[] = [
  { id: 'u1', title: 'Increase teacher eOTK for rural areas by 25%', category: 'Education', votesFor: 842, votesAgainst: 156, totalEligible: 5000, daysLeft: 4 },
  { id: 'u2', title: 'Create emergency relief sub-channel under cOTK', category: 'Community', votesFor: 1200, votesAgainst: 380, totalEligible: 5000, daysLeft: 2 },
  { id: 'u3', title: 'Mandate quarterly wellness checkup for streak eligibility', category: 'Health', votesFor: 567, votesAgainst: 890, totalEligible: 5000, daysLeft: 6 },
];

const DEMO_LEADERBOARD: CivicLeaderEntry[] = [
  { uid: 'openchain1abc...civic_anna', totalGOTK: 28400, participationRate: 96, totalVotes: 187, civicLevel: 'statesperson' },
  { uid: 'openchain1def...voice_kenji', totalGOTK: 24100, participationRate: 92, totalVotes: 162, civicLevel: 'statesperson' },
  { uid: 'openchain1ghi...advocate_priya', totalGOTK: 18600, participationRate: 88, totalVotes: 124, civicLevel: 'leader' },
  { uid: 'openchain1jkl...leader_omar', totalGOTK: 15200, participationRate: 84, totalVotes: 98, civicLevel: 'leader' },
  { uid: 'openchain1mno...citizen_lisa', totalGOTK: 12400, participationRate: 82, totalVotes: 82, civicLevel: 'leader' },
  DEMO_PROFILE as unknown as CivicLeaderEntry,
  { uid: 'openchain1pqr...voter_chen', totalGOTK: 7800, participationRate: 72, totalVotes: 52, civicLevel: 'advocate' },
  { uid: 'openchain1stu...new_fatima', totalGOTK: 3200, participationRate: 45, totalVotes: 18, civicLevel: 'citizen' },
];

type Tab = 'profile' | 'activity' | 'unvoted' | 'leaderboard';

export function CivicScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const profile = DEMO_PROFILE;
  const activities = DEMO_ACTIVITIES;
  const unvoted = DEMO_UNVOTED;
  const leaderboard = useMemo(() =>
    [...DEMO_LEADERBOARD].sort((a, b) => b.totalGOTK - a.totalGOTK),
    [],
  );

  const levelInfo = CIVIC_LEVELS[profile.civicLevel] || CIVIC_LEVELS.observer;

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
    profileHeader: { alignItems: 'center', marginBottom: 16 },
    levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    levelText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold, textTransform: 'uppercase' },
    gotkText: { color: t.text.primary, fontSize: 48, fontWeight: fonts.heavy, marginTop: 4 },
    gotkLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    participationBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 16, width: '100%' },
    participationBarInner: { height: 8, borderRadius: 4, backgroundColor: t.accent.blue },
    participationText: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, textAlign: 'center' },
    heroCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    activityRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    activityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 5 },
    activityInfo: { flex: 1 },
    activityTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    activityMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    activityRight: { alignItems: 'flex-end', justifyContent: 'center' },
    activityGotk: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },
    activityOutcome: { fontSize: fonts.xs, marginTop: 2 },
    nudgeCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    nudgeTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    nudgeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    nudgeVotes: { flexDirection: 'row', gap: 16, marginTop: 8 },
    nudgeVoteText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    nudgeProgressOuter: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 8 },
    nudgeProgressInner: { height: 6, borderRadius: 3 },
    nudgeAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    nudgeDaysLeft: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold },
    voteNowBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    voteNowText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    rankNum: { width: 32, color: t.text.muted, fontSize: fonts.lg, fontWeight: fonts.heavy, textAlign: 'center' },
    leaderInfo: { flex: 1, marginLeft: 8 },
    leaderName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    leaderMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    leaderRight: { alignItems: 'flex-end' },
    leaderGotk: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.heavy },
    leaderGlabel: { color: t.text.muted, fontSize: fonts.xs },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'profile', label: 'Profile' },
    { key: 'activity', label: 'Activity' },
    { key: 'unvoted', label: `Unvoted (${unvoted.length})` },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  // ─── Profile Tab ───

  const renderProfile = () => (
    <>
      <View style={s.card}>
        <View style={s.profileHeader}>
          <Text style={s.gotkLabel}>Total gOTK Earned</Text>
          <Text style={s.gotkText}>{profile.totalGOTK.toLocaleString()}</Text>
          <View style={[s.levelBadge, { backgroundColor: levelInfo.color }]}>
            <Text style={s.levelText}>{levelInfo.label}</Text>
          </View>
          <Text style={[s.activityMeta, { marginTop: 6 }]}>{LEVEL_THRESHOLDS[profile.civicLevel]}</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.totalVotes}</Text>
            <Text style={s.statLabel}>Votes Cast</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.purple }]}>{profile.totalProposals}</Text>
            <Text style={s.statLabel}>Proposals</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{profile.totalDiscussions}</Text>
            <Text style={s.statLabel}>Discussions</Text>
          </View>
        </View>

        {/* Participation rate */}
        <View style={s.participationBarOuter}>
          <View style={[s.participationBarInner, { width: `${profile.participationRate}%` }]} />
        </View>
        <Text style={s.participationText}>
          Participation Rate: {profile.participationRate}% of all eligible votes
        </Text>
      </View>

      {/* Next level */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Next Level</Text>
        {profile.civicLevel === 'statesperson' ? (
          <Text style={s.heroText}>You are a Statesperson. Your civic dedication inspires others.</Text>
        ) : (
          <Text style={[s.activityMeta, { textAlign: 'center' }]}>
            {profile.civicLevel === 'observer' && `${10 - profile.totalVotes} votes to Citizen`}
            {profile.civicLevel === 'citizen' && `${30 - profile.totalVotes} votes to Advocate`}
            {profile.civicLevel === 'advocate' && `${75 - profile.totalVotes} votes to Leader`}
            {profile.civicLevel === 'leader' && `${150 - profile.totalVotes} votes to Statesperson`}
          </Text>
        )}
      </View>

      <View style={s.heroCard}>
        <Text style={s.heroText}>
          One human, one vote — your voice matters equally.{'\n\n'}
          Every vote earns 200 gOTK.{'\n'}
          Proposals earn 500 gOTK.{'\n'}
          Discussions earn 50 gOTK.{'\n\n'}
          Democracy works when everyone participates.
        </Text>
      </View>
    </>
  );

  // ─── Activity Tab ───

  const renderActivity = () => (
    <>
      <Text style={s.sectionTitle}>Recent Civic Activity</Text>
      <View style={s.card}>
        {activities.map((act) => (
          <View key={act.id} style={s.activityRow}>
            <View style={[s.activityDot, { backgroundColor: ACTIVITY_TYPE_COLORS[act.type] || t.text.muted }]} />
            <View style={s.activityInfo}>
              <Text style={s.activityTitle}>{act.title}</Text>
              <Text style={s.activityMeta}>
                {act.date} | {act.type}
              </Text>
            </View>
            <View style={s.activityRight}>
              <Text style={s.activityGotk}>+{act.gotkEarned} gOTK</Text>
              {act.outcome && (
                <Text style={[s.activityOutcome, {
                  color: act.outcome === 'Passed' ? t.accent.green
                    : act.outcome === 'Rejected' ? t.accent.red
                    : t.accent.orange
                }]}>
                  {act.outcome}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Unvoted Tab ───

  const renderUnvoted = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          You have {unvoted.length} proposal{unvoted.length !== 1 ? 's' : ''} waiting for your vote.{'\n'}
          Every vote counts. Make your voice heard.
        </Text>
      </View>

      {unvoted.map((prop) => {
        const totalVotes = prop.votesFor + prop.votesAgainst;
        const forPct = totalVotes > 0 ? Math.round((prop.votesFor / totalVotes) * 100) : 50;
        return (
          <View key={prop.id} style={s.nudgeCard}>
            <Text style={s.nudgeTitle}>{prop.title}</Text>
            <Text style={s.nudgeMeta}>{prop.category}</Text>
            <View style={s.nudgeVotes}>
              <Text style={[s.nudgeVoteText, { color: t.accent.green }]}>For: {prop.votesFor}</Text>
              <Text style={[s.nudgeVoteText, { color: t.accent.red }]}>Against: {prop.votesAgainst}</Text>
            </View>
            <View style={s.nudgeProgressOuter}>
              <View style={[s.nudgeProgressInner, { width: `${forPct}%`, backgroundColor: t.accent.green }]} />
            </View>
            <View style={s.nudgeAction}>
              <Text style={s.nudgeDaysLeft}>{prop.daysLeft} day{prop.daysLeft !== 1 ? 's' : ''} left</Text>
              <TouchableOpacity
                style={s.voteNowBtn}
                onPress={() => Alert.alert('Vote', `Navigate to Governance to vote on "${prop.title}".`)}
              >
                <Text style={s.voteNowText}>Vote Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Leaderboard Tab ───

  const renderLeaderboard = () => (
    <>
      <Text style={s.sectionTitle}>Most Engaged Citizens</Text>
      <View style={s.card}>
        {leaderboard.map((entry, idx) => {
          const isYou = entry.uid === 'you';
          const lInfo = CIVIC_LEVELS[entry.civicLevel] || CIVIC_LEVELS.observer;
          return (
            <View key={entry.uid} style={[s.leaderRow, isYou && { backgroundColor: t.accent.blue + '10', borderRadius: 10, paddingHorizontal: 8 }]}>
              <Text style={[s.rankNum, idx < 3 && { color: t.accent.orange }]}>
                #{idx + 1}
              </Text>
              <View style={s.leaderInfo}>
                <Text style={[s.leaderName, isYou && { color: t.accent.blue }]}>
                  {isYou ? 'You' : entry.uid.split('...')[1] || entry.uid}
                </Text>
                <Text style={s.leaderMeta}>
                  <Text style={{ color: lInfo.color }}>{lInfo.label}</Text>
                  {' | '}{entry.totalVotes} votes | {entry.participationRate}% rate
                </Text>
              </View>
              <View style={s.leaderRight}>
                <Text style={s.leaderGotk}>{entry.totalGOTK.toLocaleString()}</Text>
                <Text style={s.leaderGlabel}>gOTK</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Civic Participation</Text>
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
        {tab === 'profile' && renderProfile()}
        {tab === 'activity' && renderActivity()}
        {tab === 'unvoted' && renderUnvoted()}
        {tab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}
