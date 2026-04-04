import { fonts } from '../utils/theme';
/**
 * Election Screen — Formal community elections.
 *
 * "Leadership in a just society is earned through trust,
 *  not purchased with wealth. One Universal ID, one vote —
 *  anonymous by default, transparent by design."
 * — Human Constitution, Article VI
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'active' | 'candidates' | 'results' | 'history';

interface Candidate {
  id: string;
  name: string;
  uid: string;
  platform: string;
  experience: string;
  endorsements: number;
  votes: number;
}

interface Election {
  id: string;
  title: string;
  position: string;
  status: 'open' | 'closed';
  startDate: string;
  endDate: string;
  totalVoters: number;
  totalCast: number;
  candidates: Candidate[];
  winnerId?: string;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'active', label: 'Active', icon: '\u{1F5F3}' },
  { key: 'candidates', label: 'Candidates', icon: '\u{1F9D1}\u{200D}\u{1F4BC}' },
  { key: 'results', label: 'Results', icon: '\u{1F4CA}' },
  { key: 'history', label: 'History', icon: '\u{1F4DC}' },
];

// ─── Demo Data ───

const DEMO_ACTIVE_ELECTION: Election = {
  id: 'elec-1',
  title: 'Community Council Election — Spring 2026',
  position: 'Council Representative (Seat 3)',
  status: 'open',
  startDate: '2026-03-25',
  endDate: '2026-04-08',
  totalVoters: 5000,
  totalCast: 1847,
  candidates: [
    {
      id: 'cand-1',
      name: 'Amara Osei',
      uid: 'uid-amara-osei-7x9k',
      platform: 'Expand nurture channel rewards for single parents. Increase community music and art programs. Establish mentorship pipelines for youth.',
      experience: 'Community organizer for 6 years, co-founded 3 local support groups, mentored 40+ youth',
      endorsements: 28,
      votes: 742,
    },
    {
      id: 'cand-2',
      name: 'Raj Patel',
      uid: 'uid-raj-patel-3m2n',
      platform: 'Focus on education infrastructure. Build peer-to-peer tutoring networks. Create skill certification pathways that earn eOTK.',
      experience: 'Former teacher of 15 years, education policy advocate, built 2 community learning centers',
      endorsements: 22,
      votes: 631,
    },
    {
      id: 'cand-3',
      name: 'Elena Vasquez',
      uid: 'uid-elena-vasquez-8p4q',
      platform: 'Strengthen elder care programs. Bridge intergenerational knowledge gaps. Ensure every elder has a gratitude pathway.',
      experience: 'Elder care coordinator for 10 years, managed intergenerational programs, volunteer network leader',
      endorsements: 19,
      votes: 474,
    },
  ],
};

const DEMO_PAST_ELECTION: Election = {
  id: 'elec-0',
  title: 'Community Coordinator Election — Winter 2025',
  position: 'Wellness Coordinator',
  status: 'closed',
  startDate: '2025-12-01',
  endDate: '2025-12-15',
  totalVoters: 4200,
  totalCast: 3180,
  candidates: [
    {
      id: 'past-1',
      name: 'James Mwangi',
      uid: 'uid-james-mwangi-2k7r',
      platform: 'Holistic wellness programs covering physical, mental, and community health.',
      experience: 'Wellness practitioner, 8 years in public health',
      endorsements: 35,
      votes: 1890,
    },
    {
      id: 'past-2',
      name: 'Lin Wei',
      uid: 'uid-lin-wei-9t3s',
      platform: 'Technology-driven wellness tracking and preventive care.',
      experience: 'Health tech developer, former nurse',
      endorsements: 18,
      votes: 1290,
    },
  ],
  winnerId: 'past-1',
};

export function ElectionScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabLabelActive: { color: '#fff' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    cardSubtitle: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    cardMuted: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 12 },
    stat: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    progressBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 10 },
    progressFill: { height: 8, borderRadius: 4 },
    voteBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    voteBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    voteBtnDisabled: { backgroundColor: t.border },
    selectedBorder: { borderWidth: 2, borderColor: t.accent.blue },
    checkMark: { position: 'absolute', top: 12, right: 12, backgroundColor: t.accent.blue, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    checkText: { color: '#fff', fontSize: 14, fontWeight: fonts.heavy },
    winnerBadge: { backgroundColor: t.accent.green, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    winnerText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    endorseCount: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.bold, marginTop: 4 },
    platformText: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    experienceText: { color: t.text.muted, fontSize: 12, lineHeight: 18, marginTop: 6, fontStyle: 'italic' },
    runBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    runBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    votedBanner: { backgroundColor: t.accent.green + '15', borderRadius: 12, padding: 14, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    votedText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    anonNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 24, marginTop: 8, lineHeight: 16 },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 20, fontSize: 14 },
  }), [t]);

  const activeElection = DEMO_ACTIVE_ELECTION;
  const pastElection = DEMO_PAST_ELECTION;
  const turnoutPct = Math.round((activeElection.totalCast / activeElection.totalVoters) * 100);

  const handleCastVote = useCallback(async () => {
    if (!selectedCandidate) {
      Alert.alert('Select a Candidate', 'Please select a candidate before casting your vote.');
      return;
    }
    const candidate = activeElection.candidates.find((c) => c.id === selectedCandidate);
    if (!candidate) return;

    setVoting(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      setHasVoted(true);
      Alert.alert(
        'Vote Cast (Demo)',
        `Your anonymous vote for ${candidate.name} has been recorded.\n\nOne UID, one vote. Your ballot is anonymous by default.`,
      );
    } else {
      Alert.alert('Cast Vote', `Vote for ${candidate.name}? (Coming soon on mainnet)`);
    }
    setVoting(false);
  }, [selectedCandidate, demoMode, activeElection]);

  const handleRunForOffice = useCallback(() => {
    if (demoMode) {
      Alert.alert(
        'Declare Candidacy (Demo)',
        'To run for office, you will submit your platform, experience, and credentials. Your Universal ID must be verified.\n\nThis feature is available in demo mode for preview.',
      );
    } else {
      Alert.alert('Run for Office', 'Candidacy declaration coming soon on mainnet.');
    }
  }, [demoMode]);

  // ─── Active Tab ───
  const renderActive = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F5F3}'}</Text>
        <Text style={s.heroTitle}>Community Elections</Text>
        <Text style={s.heroSubtitle}>
          One Universal ID, one vote. Anonymous by default, transparent by design. Leadership is earned through trust.
        </Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>1</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>{activeElection.totalCast}</Text>
          <Text style={s.statLabel}>Votes Cast</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>{turnoutPct}%</Text>
          <Text style={s.statLabel}>Turnout</Text>
        </View>
      </View>

      <Text style={s.section}>Current Election</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>{activeElection.title}</Text>
        <Text style={s.cardSubtitle}>{activeElection.position}</Text>
        <View style={[s.badge, { backgroundColor: t.accent.green }]}>
          <Text style={s.badgeText}>VOTING OPEN</Text>
        </View>
        <Text style={s.cardMuted}>
          {activeElection.startDate} — {activeElection.endDate}
        </Text>
        <Text style={s.cardMuted}>
          {activeElection.candidates.length} candidates  •  {activeElection.totalCast} / {activeElection.totalVoters} voted
        </Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${turnoutPct}%`, backgroundColor: t.accent.blue }]} />
        </View>
      </View>

      {hasVoted ? (
        <View style={s.votedBanner}>
          <Text style={s.votedText}>Your vote has been cast anonymously</Text>
        </View>
      ) : (
        <>
          <Text style={s.section}>Cast Your Ballot</Text>
          {activeElection.candidates.map((cand) => (
            <TouchableOpacity
              key={cand.id}
              style={[s.card, selectedCandidate === cand.id && s.selectedBorder]}
              onPress={() => setSelectedCandidate(cand.id)}
            >
              {selectedCandidate === cand.id && (
                <View style={s.checkMark}>
                  <Text style={s.checkText}>{'\u2713'}</Text>
                </View>
              )}
              <Text style={s.cardTitle}>{cand.name}</Text>
              <Text style={s.cardMuted}>{cand.uid}</Text>
              <Text style={s.endorseCount}>{cand.endorsements} endorsements</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.voteBtn, { marginHorizontal: 20 }, !selectedCandidate && s.voteBtnDisabled]}
            onPress={handleCastVote}
            disabled={voting || !selectedCandidate}
          >
            {voting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.voteBtnText}>Cast Anonymous Ballot</Text>
            )}
          </TouchableOpacity>
          <Text style={s.anonNote}>
            Your vote is anonymous by default. No one — not even validators — can link your ballot to your Universal ID.
          </Text>
        </>
      )}
    </>
  );

  // ─── Candidates Tab ───
  const renderCandidates = () => (
    <>
      <Text style={s.section}>Candidate Profiles</Text>
      {activeElection.candidates.map((cand) => (
        <View key={cand.id} style={s.card}>
          <View style={s.row}>
            <Text style={{ fontSize: 24 }}>{'\u{1F9D1}\u{200D}\u{1F4BC}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{cand.name}</Text>
              <Text style={s.cardMuted}>{cand.uid}</Text>
            </View>
          </View>
          <Text style={s.endorseCount}>{cand.endorsements} endorsements</Text>

          <Text style={[s.section, { marginLeft: 0, marginTop: 16, marginBottom: 4 }]}>Platform</Text>
          <Text style={s.platformText}>{cand.platform}</Text>

          <Text style={[s.section, { marginLeft: 0, marginTop: 12, marginBottom: 4 }]}>Experience</Text>
          <Text style={s.experienceText}>{cand.experience}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.runBtn} onPress={handleRunForOffice}>
        <Text style={s.runBtnText}>Run for Office</Text>
      </TouchableOpacity>
      <Text style={s.anonNote}>
        Declare your candidacy, submit your platform, and let the community decide. A verified Universal ID is required.
      </Text>
    </>
  );

  // ─── Results Tab ───
  const renderResults = () => {
    const totalVotes = activeElection.candidates.reduce((sum, c) => sum + c.votes, 0);

    return (
      <>
        <Text style={s.section}>Live Tally — {activeElection.title}</Text>
        <View style={s.card}>
          <View style={[s.badge, { backgroundColor: t.accent.blue }]}>
            <Text style={s.badgeText}>VOTING IN PROGRESS</Text>
          </View>
          <Text style={s.cardMuted}>{totalVotes} votes cast of {activeElection.totalVoters} eligible</Text>
        </View>

        {activeElection.candidates
          .slice()
          .sort((a, b) => b.votes - a.votes)
          .map((cand, idx) => {
            const pct = totalVotes > 0 ? Math.round((cand.votes / totalVotes) * 100) : 0;
            const barColor = idx === 0 ? t.accent.green : idx === 1 ? t.accent.blue : t.accent.orange;
            return (
              <View key={cand.id} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.cardTitle}>{idx + 1}. {cand.name}</Text>
                  <Text style={[s.cardTitle, { color: barColor }]}>{pct}%</Text>
                </View>
                <Text style={s.cardMuted}>{cand.votes} votes</Text>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}

        <Text style={s.anonNote}>
          Results update in real-time during the voting period. Final results are certified after the election closes.
        </Text>
      </>
    );
  };

  // ─── History Tab ───
  const renderHistory = () => {
    const winner = pastElection.candidates.find((c) => c.id === pastElection.winnerId);
    const pastTotal = pastElection.candidates.reduce((sum, c) => sum + c.votes, 0);
    const pastTurnout = Math.round((pastElection.totalCast / pastElection.totalVoters) * 100);

    return (
      <>
        <Text style={s.section}>Past Elections</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>{pastElection.title}</Text>
          <Text style={s.cardSubtitle}>{pastElection.position}</Text>
          <View style={[s.badge, { backgroundColor: t.text.muted }]}>
            <Text style={s.badgeText}>CLOSED</Text>
          </View>
          <Text style={s.cardMuted}>
            {pastElection.startDate} — {pastElection.endDate}
          </Text>
          <Text style={s.cardMuted}>
            Turnout: {pastTurnout}% ({pastElection.totalCast} / {pastElection.totalVoters})
          </Text>

          {winner && (
            <View style={{ marginTop: 12 }}>
              <View style={s.winnerBadge}>
                <Text style={s.winnerText}>WINNER</Text>
              </View>
              <Text style={[s.cardTitle, { marginTop: 6 }]}>{winner.name}</Text>
              <Text style={s.cardMuted}>{winner.votes} votes ({pastTotal > 0 ? Math.round((winner.votes / pastTotal) * 100) : 0}%)</Text>
            </View>
          )}
        </View>

        <Text style={s.section}>All Candidates</Text>
        {pastElection.candidates
          .slice()
          .sort((a, b) => b.votes - a.votes)
          .map((cand) => {
            const pct = pastTotal > 0 ? Math.round((cand.votes / pastTotal) * 100) : 0;
            const isWinner = cand.id === pastElection.winnerId;
            return (
              <View key={cand.id} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.cardTitle}>{cand.name}</Text>
                  <Text style={[s.cardTitle, { color: isWinner ? t.accent.green : t.text.muted }]}>{pct}%</Text>
                </View>
                <Text style={s.cardMuted}>{cand.votes} votes</Text>
                {isWinner && (
                  <View style={s.winnerBadge}>
                    <Text style={s.winnerText}>ELECTED</Text>
                  </View>
                )}
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: isWinner ? t.accent.green : t.text.muted }]} />
                </View>
              </View>
            );
          })}
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'active': return renderActive();
      case 'candidates': return renderCandidates();
      case 'results': return renderResults();
      case 'history': return renderHistory();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Elections</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
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

      <ScrollView>
        {renderContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
