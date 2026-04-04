import { fonts } from '../utils/theme';
/**
 * Community Constitution Screen — Local community constitution/charter.
 *
 * Displays the community charter (local rules and values), allows members
 * to propose and vote on amendments, and shows the historical evolution
 * of community governance over time.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type ConstitutionTab = 'charter' | 'amend' | 'vote' | 'history';

interface CharterArticle {
  id: string;
  number: number;
  title: string;
  text: string;
  adoptedAt: number;
  lastAmended?: number;
}

type AmendmentStatus = 'proposed' | 'voting' | 'adopted' | 'rejected';

interface Amendment {
  id: string;
  articleId: string;
  articleNumber: number;
  title: string;
  proposedChange: string;
  rationale: string;
  proposedBy: string;
  status: AmendmentStatus;
  votesFor: number;
  votesAgainst: number;
  totalEligible: number;
  proposedAt: number;
  votingEnds?: number;
  resolvedAt?: number;
}

interface HistoryEntry {
  id: string;
  type: 'adopted' | 'amended' | 'rejected';
  description: string;
  date: number;
  votesFor: number;
  votesAgainst: number;
}

// --- Demo data ---

const NOW = Date.now();
const DAY = 86_400_000;

const DEMO_ARTICLES: CharterArticle[] = [
  {
    id: 'art_01', number: 1, title: 'Equal Voice',
    text: 'Every resident has one vote in community decisions, regardless of wealth, age, or status. No member may hold more voting power than another.',
    adoptedAt: NOW - 365 * DAY,
  },
  {
    id: 'art_02', number: 2, title: 'Shared Resources',
    text: 'Community resources — land, water, tools, and shared infrastructure — belong to all residents collectively. Access shall be managed transparently and equitably.',
    adoptedAt: NOW - 365 * DAY,
  },
  {
    id: 'art_03', number: 3, title: 'Care for Young and Old',
    text: 'The community shall ensure that children receive education, nutrition, and emotional support, and that elders receive dignity, care, and opportunities to share wisdom.',
    adoptedAt: NOW - 365 * DAY,
  },
  {
    id: 'art_04', number: 4, title: 'Transparent Governance',
    text: 'All community decisions, budgets, and policies shall be recorded on-chain and accessible to every resident. No decision may be made in secret.',
    adoptedAt: NOW - 365 * DAY, lastAmended: NOW - 120 * DAY,
  },
  {
    id: 'art_05', number: 5, title: 'Environmental Stewardship',
    text: 'Residents shall protect and restore the local environment. Development must balance human needs with ecological sustainability for future generations.',
    adoptedAt: NOW - 300 * DAY,
  },
];

const DEMO_AMENDMENTS: Amendment[] = [
  {
    id: 'amd_001', articleId: 'art_04', articleNumber: 4,
    title: 'Add Digital Privacy Clause',
    proposedChange: 'Append to Article 4: "While governance is transparent, individual members\' personal data and private communications shall be protected. On-chain records shall use pseudonymous identifiers unless the member consents to public identification."',
    rationale: 'As more governance moves on-chain, we need explicit privacy protections for individual members while maintaining transparency of decisions.',
    proposedBy: 'Privacy Working Group',
    status: 'voting',
    votesFor: 67,
    votesAgainst: 12,
    totalEligible: 150,
    proposedAt: NOW - 10 * DAY,
    votingEnds: NOW + 4 * DAY,
  },
];

const DEMO_HISTORY: HistoryEntry[] = [
  {
    id: 'hist_001', type: 'adopted',
    description: 'Original charter adopted with Articles 1-4.',
    date: NOW - 365 * DAY, votesFor: 142, votesAgainst: 3,
  },
  {
    id: 'hist_002', type: 'adopted',
    description: 'Article 5 (Environmental Stewardship) added to charter.',
    date: NOW - 300 * DAY, votesFor: 128, votesAgainst: 15,
  },
  {
    id: 'hist_003', type: 'amended',
    description: 'Article 4 amended to require on-chain recording of all budget decisions.',
    date: NOW - 120 * DAY, votesFor: 110, votesAgainst: 22,
  },
  {
    id: 'hist_004', type: 'rejected',
    description: 'Proposed amendment to allow weighted voting based on residency length. Rejected by community vote.',
    date: NOW - 80 * DAY, votesFor: 35, votesAgainst: 98,
  },
];

// --- Helpers ---

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(epoch: number): number {
  return Math.max(0, Math.ceil((epoch - NOW) / DAY));
}

const STATUS_LABELS: Record<AmendmentStatus, string> = {
  proposed: 'Proposed', voting: 'Voting Open', adopted: 'Adopted', rejected: 'Rejected',
};

const STATUS_COLORS: Record<AmendmentStatus, string> = {
  proposed: '#f5a623', voting: '#007aff', adopted: '#34c759', rejected: '#ff3b30',
};

const HISTORY_ICONS: Record<string, string> = {
  adopted: '\u2705',
  amended: '\u{1F4DD}',
  rejected: '\u274C',
};

// --- Component ---

interface Props {
  onClose: () => void;
}

export function CommunityConstitutionScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<ConstitutionTab>('charter');
  const [amendArticle, setAmendArticle] = useState('');
  const [amendTitle, setAmendTitle] = useState('');
  const [amendChange, setAmendChange] = useState('');
  const [amendRationale, setAmendRationale] = useState('');

  const tabs: { key: ConstitutionTab; label: string }[] = [
    { key: 'charter', label: `Charter (${DEMO_ARTICLES.length})` },
    { key: 'amend', label: 'Propose' },
    { key: 'vote', label: `Vote (${DEMO_AMENDMENTS.filter(a => a.status === 'voting').length})` },
    { key: 'history', label: 'History' },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
    tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    articleNumber: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 4 },
    cardTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 6 },
    cardText: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 21 },
    cardMeta: { color: t.text.muted, fontSize: fonts.xs, marginTop: 10 },
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    voteBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10, backgroundColor: t.bg.primary },
    voteBarFor: { backgroundColor: '#34c759' },
    voteBarAgainst: { backgroundColor: '#ff3b30' },
    voteStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    voteFor: { color: '#34c759', fontSize: fonts.sm, fontWeight: fonts.bold },
    voteAgainst: { color: '#ff3b30', fontSize: fonts.sm, fontWeight: fonts.bold },
    voteRemaining: { color: t.text.muted, fontSize: fonts.sm },
    voteBtnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    voteYesBtn: { flex: 1, backgroundColor: '#34c759', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    voteNoBtn: { flex: 1, backgroundColor: '#ff3b30', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    changeText: { color: t.text.primary, fontSize: fonts.sm, lineHeight: 20, fontStyle: 'italic', backgroundColor: t.bg.primary, borderRadius: 8, padding: 12, marginTop: 8 },
    rationaleText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 19, marginTop: 8 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    historyIcon: { fontSize: fonts.xl, marginRight: 8 },
    historyRow: { flexDirection: 'row', alignItems: 'flex-start' },
    historyContent: { flex: 1 },
    historyDesc: { color: t.text.primary, fontSize: fonts.md, lineHeight: 20 },
    historyVotes: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    historyDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const renderCharter = () => (
    <View>
      <Text style={st.section}>Community Charter</Text>
      {DEMO_ARTICLES.map(a => (
        <View key={a.id} style={st.card}>
          <Text style={st.articleNumber}>Article {a.number}</Text>
          <Text style={st.cardTitle}>{a.title}</Text>
          <Text style={st.cardText}>{a.text}</Text>
          <Text style={st.cardMeta}>
            Adopted {formatDate(a.adoptedAt)}
            {a.lastAmended ? ` \u2022 Last amended ${formatDate(a.lastAmended)}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderAmend = () => (
    <View>
      <Text style={st.section}>Propose an Amendment</Text>
      <Text style={st.inputLabel}>Article Number</Text>
      <TextInput
        style={st.input}
        placeholder="e.g. 4"
        placeholderTextColor={t.text.muted}
        value={amendArticle}
        onChangeText={setAmendArticle}
        keyboardType="numeric"
      />
      <Text style={st.inputLabel}>Amendment Title</Text>
      <TextInput
        style={st.input}
        placeholder="Short title for the amendment"
        placeholderTextColor={t.text.muted}
        value={amendTitle}
        onChangeText={setAmendTitle}
      />
      <Text style={st.inputLabel}>Proposed Change</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="Describe the exact change to the article text..."
        placeholderTextColor={t.text.muted}
        value={amendChange}
        onChangeText={setAmendChange}
        multiline
      />
      <Text style={st.inputLabel}>Rationale</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="Why is this change needed?"
        placeholderTextColor={t.text.muted}
        value={amendRationale}
        onChangeText={setAmendRationale}
        multiline
      />
      <View style={st.card}>
        <Text style={st.cardText}>
          {'\u{2139}\uFE0F'} Amendments require a community vote. A simple majority (50%+1) of eligible voters must approve for the amendment to be adopted. Voting remains open for 14 days.
        </Text>
      </View>
      <TouchableOpacity style={st.submitBtn}>
        <Text style={st.submitBtnText}>{'\u{1F4DC}'} Submit Amendment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVote = () => {
    const voting = DEMO_AMENDMENTS.filter(a => a.status === 'voting');
    return (
      <View>
        <Text style={st.section}>Active Votes</Text>
        {voting.length === 0 ? (
          <Text style={st.emptyText}>No amendments currently up for vote.</Text>
        ) : voting.map(a => {
          const totalVotes = a.votesFor + a.votesAgainst;
          const forPct = totalVotes > 0 ? (a.votesFor / totalVotes) * 100 : 50;
          const againstPct = 100 - forPct;
          const participation = totalVotes > 0 ? Math.round((totalVotes / a.totalEligible) * 100) : 0;
          return (
            <View key={a.id} style={st.card}>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[a.status] }]}>
                <Text style={st.statusText}>{STATUS_LABELS[a.status]}</Text>
              </View>
              <Text style={st.articleNumber}>Amendment to Article {a.articleNumber}</Text>
              <Text style={st.cardTitle}>{a.title}</Text>
              <Text style={st.changeText}>{a.proposedChange}</Text>
              <Text style={st.rationaleText}>{a.rationale}</Text>
              <View style={st.voteBar}>
                <View style={[st.voteBarFor, { width: `${forPct}%` }]} />
                <View style={[st.voteBarAgainst, { width: `${againstPct}%` }]} />
              </View>
              <View style={st.voteStats}>
                <Text style={st.voteFor}>{'\u2705'} {a.votesFor} For</Text>
                <Text style={st.voteAgainst}>{'\u274C'} {a.votesAgainst} Against</Text>
                <Text style={st.voteRemaining}>{participation}% participation</Text>
              </View>
              <View style={st.voteBtnRow}>
                <TouchableOpacity style={st.voteYesBtn}>
                  <Text style={st.voteBtnText}>{'\u2705'} Vote For</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.voteNoBtn}>
                  <Text style={st.voteBtnText}>{'\u274C'} Vote Against</Text>
                </TouchableOpacity>
              </View>
              <Text style={st.cardMeta}>
                Proposed by {a.proposedBy} {'\u2022'} {formatDate(a.proposedAt)}
                {a.votingEnds ? ` \u2022 Voting ends in ${daysUntil(a.votingEnds)} days` : ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderHistory = () => (
    <View>
      <Text style={st.section}>Charter History</Text>
      {DEMO_HISTORY.map(h => (
        <View key={h.id} style={st.card}>
          <View style={st.historyRow}>
            <Text style={st.historyIcon}>{HISTORY_ICONS[h.type]}</Text>
            <View style={st.historyContent}>
              <Text style={st.historyDesc}>{h.description}</Text>
              <Text style={st.historyVotes}>
                For: {h.votesFor} {'\u2022'} Against: {h.votesAgainst}
              </Text>
              <Text style={st.historyDate}>{formatDate(h.date)}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{'\u{1F4DC}'} Community Charter</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tabBtn, tab === tb.key && st.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.scroll}>
        {tab === 'charter' && renderCharter()}
        {tab === 'amend' && renderAmend()}
        {tab === 'vote' && renderVote()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
