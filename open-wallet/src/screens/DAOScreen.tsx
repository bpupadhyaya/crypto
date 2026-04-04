import { fonts } from '../utils/theme';
/**
 * DAO Screen — Create and manage Decentralized Autonomous Organizations.
 *
 * Users can create DAOs on Open Chain, manage treasuries,
 * propose actions, and vote (one-member-one-vote or token-weighted).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

/* ─── Types ─── */

type VotingModel = 'one-member-one-vote' | 'token-weighted';

interface DAOMember {
  address: string;
  name: string;
  joinedDate: string;
  votingPower: number; // 1 for one-member-one-vote, token balance for weighted
}

interface DAOProposal {
  id: string;
  title: string;
  description: string;
  type: 'spend' | 'parameter' | 'membership' | 'general';
  proposer: string;
  status: 'voting' | 'passed' | 'rejected' | 'executed';
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligible: number;
  endTime: string;
  amount?: string;
  recipient?: string;
}

interface DAO {
  id: string;
  name: string;
  description: string;
  token: string;
  votingModel: VotingModel;
  memberCount: number;
  treasuryBalance: string;
  treasuryDenom: string;
  members: DAOMember[];
  proposals: DAOProposal[];
  createdDate: string;
  role: 'creator' | 'member' | 'admin';
}

interface Props {
  onClose: () => void;
}

/* ─── Demo Data ─── */

const DEMO_DAOS: DAO[] = [
  {
    id: 'dao-1',
    name: 'Open Chain Foundation',
    description: 'The core governance DAO for Open Chain protocol upgrades, treasury allocation, and ecosystem development.',
    token: 'OTK',
    votingModel: 'one-member-one-vote',
    memberCount: 5,
    treasuryBalance: '50,000',
    treasuryDenom: 'OTK',
    createdDate: '2026-01-15',
    role: 'member',
    members: [
      { address: 'openchain1abc...001', name: 'Bhim', joinedDate: '2026-01-15', votingPower: 1 },
      { address: 'openchain1abc...002', name: 'Alice', joinedDate: '2026-01-16', votingPower: 1 },
      { address: 'openchain1abc...003', name: 'Bob', joinedDate: '2026-01-20', votingPower: 1 },
      { address: 'openchain1abc...004', name: 'Carol', joinedDate: '2026-02-01', votingPower: 1 },
      { address: 'openchain1abc...005', name: 'Dave', joinedDate: '2026-02-10', votingPower: 1 },
    ],
    proposals: [
      {
        id: 'dp-1', title: 'Fund developer grants program', description: 'Allocate 5,000 OTK from treasury to fund open-source developer grants for building Open Chain tooling.',
        type: 'spend', proposer: 'Alice', status: 'voting', yesVotes: 2, noVotes: 1, abstainVotes: 0, totalEligible: 5, endTime: '2026-04-05',
        amount: '5,000 OTK', recipient: 'openchain1grants...fund',
      },
      {
        id: 'dp-2', title: 'Reduce proposal voting period to 5 days', description: 'Speed up governance by reducing the default voting period from 7 to 5 days.',
        type: 'parameter', proposer: 'Bob', status: 'passed', yesVotes: 4, noVotes: 1, abstainVotes: 0, totalEligible: 5, endTime: '2026-03-20',
      },
      {
        id: 'dp-3', title: 'Add Eve as foundation member', description: 'Eve has been a consistent contributor to Open Chain documentation and testing.',
        type: 'membership', proposer: 'Carol', status: 'voting', yesVotes: 1, noVotes: 0, abstainVotes: 1, totalEligible: 5, endTime: '2026-04-08',
      },
    ],
  },
  {
    id: 'dao-2',
    name: 'Education Fund DAO',
    description: 'Funding education initiatives worldwide — scholarships, courses, learning materials. Earn eOTK by teaching.',
    token: 'eOTK',
    votingModel: 'token-weighted',
    memberCount: 12,
    treasuryBalance: '10,000',
    treasuryDenom: 'eOTK',
    createdDate: '2026-02-01',
    role: 'admin',
    members: [
      { address: 'openchain1edu...001', name: 'Bhim', joinedDate: '2026-02-01', votingPower: 500 },
      { address: 'openchain1edu...002', name: 'Teacher1', joinedDate: '2026-02-05', votingPower: 300 },
      { address: 'openchain1edu...003', name: 'Teacher2', joinedDate: '2026-02-08', votingPower: 250 },
      { address: 'openchain1edu...004', name: 'Student1', joinedDate: '2026-02-10', votingPower: 100 },
      { address: 'openchain1edu...005', name: 'Student2', joinedDate: '2026-02-12', votingPower: 80 },
      { address: 'openchain1edu...006', name: 'Mentor1', joinedDate: '2026-02-15', votingPower: 400 },
      { address: 'openchain1edu...007', name: 'Mentor2', joinedDate: '2026-02-18', votingPower: 350 },
      { address: 'openchain1edu...008', name: 'Researcher1', joinedDate: '2026-02-20', votingPower: 200 },
      { address: 'openchain1edu...009', name: 'Researcher2', joinedDate: '2026-02-22', votingPower: 180 },
      { address: 'openchain1edu...010', name: 'Admin1', joinedDate: '2026-02-25', votingPower: 150 },
      { address: 'openchain1edu...011', name: 'Admin2', joinedDate: '2026-03-01', votingPower: 120 },
      { address: 'openchain1edu...012', name: 'Contributor1', joinedDate: '2026-03-05', votingPower: 90 },
    ],
    proposals: [
      {
        id: 'ep-1', title: 'Scholarship fund for 10 students', description: 'Allocate 2,000 eOTK to sponsor 10 students in developing regions for a 6-month coding bootcamp.',
        type: 'spend', proposer: 'Teacher1', status: 'voting', yesVotes: 1500, noVotes: 200, abstainVotes: 100, totalEligible: 2720, endTime: '2026-04-10',
        amount: '2,000 eOTK', recipient: 'openchain1scholar...fund',
      },
    ],
  },
  {
    id: 'dao-3',
    name: 'Community Builders',
    description: 'Reward community contributions — docs, translations, events, support. Building the Open Chain ecosystem together.',
    token: 'cOTK',
    votingModel: 'one-member-one-vote',
    memberCount: 8,
    treasuryBalance: '25,000',
    treasuryDenom: 'cOTK',
    createdDate: '2026-02-15',
    role: 'member',
    members: [
      { address: 'openchain1com...001', name: 'Bhim', joinedDate: '2026-02-15', votingPower: 1 },
      { address: 'openchain1com...002', name: 'Builder1', joinedDate: '2026-02-16', votingPower: 1 },
      { address: 'openchain1com...003', name: 'Builder2', joinedDate: '2026-02-18', votingPower: 1 },
      { address: 'openchain1com...004', name: 'Builder3', joinedDate: '2026-02-20', votingPower: 1 },
      { address: 'openchain1com...005', name: 'Builder4', joinedDate: '2026-02-22', votingPower: 1 },
      { address: 'openchain1com...006', name: 'Builder5', joinedDate: '2026-02-25', votingPower: 1 },
      { address: 'openchain1com...007', name: 'Builder6', joinedDate: '2026-03-01', votingPower: 1 },
      { address: 'openchain1com...008', name: 'Builder7', joinedDate: '2026-03-05', votingPower: 1 },
    ],
    proposals: [
      {
        id: 'cp-1', title: 'Fund community meetups in 5 cities', description: 'Allocate 3,000 cOTK to organize Open Chain community meetups in NYC, London, Tokyo, Mumbai, and Nairobi.',
        type: 'spend', proposer: 'Builder1', status: 'voting', yesVotes: 3, noVotes: 0, abstainVotes: 2, totalEligible: 8, endTime: '2026-04-12',
        amount: '3,000 cOTK', recipient: 'openchain1meetups...fund',
      },
      {
        id: 'cp-2', title: 'Remove inactive member Builder6', description: 'Builder6 has not participated in any votes for 60 days. Proposing removal per DAO rules.',
        type: 'membership', proposer: 'Builder2', status: 'rejected', yesVotes: 2, noVotes: 5, abstainVotes: 1, totalEligible: 8, endTime: '2026-03-25',
      },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  voting: '#2196f3',
  passed: '#4caf50',
  rejected: '#f44336',
  executed: '#9c27b0',
};

const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  spend: 'Treasury Spend',
  parameter: 'Change Parameter',
  membership: 'Membership',
  general: 'General',
};

/* ─── Component ─── */

export function DAOScreen({ onClose }: Props) {
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'propose' | 'proposal-detail'>('list');
  const [daos, setDaos] = useState<DAO[]>([]);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);

  // Create DAO form
  const [daoName, setDaoName] = useState('');
  const [daoDesc, setDaoDesc] = useState('');
  const [daoToken, setDaoToken] = useState('');
  const [daoVotingModel, setDaoVotingModel] = useState<VotingModel>('one-member-one-vote');

  // Propose form
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propType, setPropType] = useState<DAOProposal['type']>('general');
  const [propAmount, setPropAmount] = useState('');
  const [propRecipient, setPropRecipient] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    backBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    createBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
    createBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    daoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    daoName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    daoDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, lineHeight: 18 },
    daoMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
    metaItem: { alignItems: 'center' },
    metaValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    metaLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
    roleBadgeText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    descInput: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.border },
    toggleBtnActive: { backgroundColor: t.accent.blue },
    toggleBtnText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    toggleBtnTextActive: { color: '#fff' },
    detailHeader: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, alignItems: 'center' },
    detailName: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    detailDesc: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    detailMeta: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    treasuryCard: { backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    treasuryLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1.5 },
    treasuryValue: { color: t.accent.green, fontSize: fonts.xxxl, fontWeight: fonts.heavy, marginTop: 4 },
    treasuryDenom: { color: t.text.secondary, fontSize: fonts.md, marginTop: 2 },
    memberCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 8 },
    memberName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    memberAddr: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    memberJoined: { color: t.text.muted, fontSize: fonts.xs },
    propCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    propTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    propType: { fontSize: fonts.xs, fontWeight: fonts.bold, marginTop: 4 },
    propStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
    propVotes: { flexDirection: 'row', gap: 16, marginTop: 12 },
    voteCount: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    quorum: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    voteRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginHorizontal: 20 },
    voteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    proposeBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16, alignSelf: 'center' },
    proposeBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    spendDetail: { backgroundColor: t.accent.yellow + '10', borderRadius: 12, padding: 12, marginHorizontal: 20, marginTop: 12 },
    spendLabel: { color: t.text.muted, fontSize: fonts.sm },
    spendValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 2 },
    votingModelBadge: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
    votingModelText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
  }), [t]);

  useEffect(() => {
    setLoading(true);
    if (demoMode) {
      setTimeout(() => { setDaos(DEMO_DAOS); setLoading(false); }, 400);
    } else {
      // In production, would fetch from Open Chain DAO module
      setDaos([]);
      setLoading(false);
    }
  }, [demoMode]);

  /* ─── Create DAO ─── */

  const handleCreateDAO = useCallback(async () => {
    if (!daoName.trim()) { Alert.alert('Required', 'Enter a DAO name.'); return; }
    if (!daoDesc.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!daoToken.trim()) { Alert.alert('Required', 'Enter a token symbol.'); return; }

    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      const newDAO: DAO = {
        id: `dao-${Date.now()}`,
        name: daoName.trim(),
        description: daoDesc.trim(),
        token: daoToken.trim().toUpperCase(),
        votingModel: daoVotingModel,
        memberCount: 1,
        treasuryBalance: '0',
        treasuryDenom: daoToken.trim().toUpperCase(),
        createdDate: new Date().toISOString().split('T')[0],
        role: 'creator',
        members: [{ address: 'openchain1you...000', name: 'You', joinedDate: new Date().toISOString().split('T')[0], votingPower: 1 }],
        proposals: [],
      };
      setDaos(prev => [newDAO, ...prev]);
      Alert.alert('DAO Created', `${daoName.trim()} is now live on Open Chain.`);
      setDaoName(''); setDaoDesc(''); setDaoToken('');
      setView('list');
    } else {
      Alert.alert('Coming Soon', 'DAO creation on mainnet is under development.');
    }
    setLoading(false);
  }, [daoName, daoDesc, daoToken, daoVotingModel, demoMode]);

  /* ─── Propose Action ─── */

  const handlePropose = useCallback(async () => {
    if (!propTitle.trim() || !propDesc.trim()) {
      Alert.alert('Required', 'Enter both title and description.');
      return;
    }
    if (propType === 'spend' && (!propAmount.trim() || !propRecipient.trim())) {
      Alert.alert('Required', 'Treasury spends require an amount and recipient.');
      return;
    }
    if (!selectedDAO) return;

    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200));
      const newProp: DAOProposal = {
        id: `prop-${Date.now()}`,
        title: propTitle.trim(),
        description: propDesc.trim(),
        type: propType,
        proposer: 'You',
        status: 'voting',
        yesVotes: 0, noVotes: 0, abstainVotes: 0,
        totalEligible: selectedDAO.memberCount,
        endTime: '2026-04-15',
        amount: propType === 'spend' ? propAmount.trim() : undefined,
        recipient: propType === 'spend' ? propRecipient.trim() : undefined,
      };
      setDaos(prev => prev.map(d =>
        d.id === selectedDAO.id ? { ...d, proposals: [newProp, ...d.proposals] } : d
      ));
      setSelectedDAO(prev => prev ? { ...prev, proposals: [newProp, ...prev.proposals] } : prev);
      Alert.alert('Proposal Submitted', 'Your proposal is now open for voting.');
      setPropTitle(''); setPropDesc(''); setPropAmount(''); setPropRecipient('');
      setView('detail');
    } else {
      Alert.alert('Coming Soon', 'DAO proposals on mainnet are under development.');
    }
    setLoading(false);
  }, [propTitle, propDesc, propType, propAmount, propRecipient, selectedDAO, demoMode]);

  /* ─── Vote ─── */

  const handleVote = useCallback(async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    if (!selectedDAO) return;
    setVoting(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      const voteWeight = selectedDAO.votingModel === 'one-member-one-vote' ? 1 : 500;
      const updateProps = (proposals: DAOProposal[]) => proposals.map(p => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          yesVotes: p.yesVotes + (vote === 'yes' ? voteWeight : 0),
          noVotes: p.noVotes + (vote === 'no' ? voteWeight : 0),
          abstainVotes: p.abstainVotes + (vote === 'abstain' ? voteWeight : 0),
        };
      });
      setDaos(prev => prev.map(d =>
        d.id === selectedDAO.id ? { ...d, proposals: updateProps(d.proposals) } : d
      ));
      setSelectedDAO(prev => prev ? { ...prev, proposals: updateProps(prev.proposals) } : prev);
      const model = selectedDAO.votingModel === 'one-member-one-vote' ? 'One member, one vote.' : `Your token weight: ${voteWeight}.`;
      Alert.alert('Vote Cast', `Your ${vote} vote has been recorded. ${model}`);
    }
    setVoting(false);
    setView('detail');
  }, [selectedDAO, demoMode]);

  /* ─── Detail Tab State ─── */
  const [detailTab, setDetailTab] = useState<'proposals' | 'members' | 'treasury'>('proposals');

  /* ─── Create DAO View ─── */

  if (view === 'create') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('list')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Create DAO</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>DAO Name</Text>
            <TextInput style={s.input} placeholder="e.g. Education Fund DAO" placeholderTextColor={t.text.muted} value={daoName} onChangeText={setDaoName} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Description</Text>
            <TextInput style={[s.input, s.descInput]} placeholder="What is this DAO's mission?" placeholderTextColor={t.text.muted} value={daoDesc} onChangeText={setDaoDesc} multiline numberOfLines={4} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Token (existing or new via Token Factory)</Text>
            <TextInput style={s.input} placeholder="e.g. OTK, eOTK, or new symbol" placeholderTextColor={t.text.muted} value={daoToken} onChangeText={setDaoToken} autoCapitalize="characters" />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Voting Model</Text>
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, daoVotingModel === 'one-member-one-vote' && s.toggleBtnActive]}
                onPress={() => setDaoVotingModel('one-member-one-vote')}
              >
                <Text style={[s.toggleBtnText, daoVotingModel === 'one-member-one-vote' && s.toggleBtnTextActive]}>1 Member = 1 Vote</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, daoVotingModel === 'token-weighted' && s.toggleBtnActive]}
                onPress={() => setDaoVotingModel('token-weighted')}
              >
                <Text style={[s.toggleBtnText, daoVotingModel === 'token-weighted' && s.toggleBtnTextActive]}>Token Weighted</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 8, lineHeight: 16 }}>
              {daoVotingModel === 'one-member-one-vote'
                ? 'Democratic: every member gets exactly one vote, regardless of token holdings.'
                : 'Plutocratic: votes are weighted by token balance. More tokens = more influence.'}
            </Text>
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleCreateDAO} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Create DAO</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── Propose Action View ─── */

  if (view === 'propose' && selectedDAO) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('detail')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>New Proposal</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Proposal Type</Text>
            <View style={[s.toggleRow, { flexWrap: 'wrap' }]}>
              {(['general', 'spend', 'parameter', 'membership'] as const).map(pt => (
                <TouchableOpacity
                  key={pt}
                  style={[s.toggleBtn, { flex: 0, paddingHorizontal: 16 }, propType === pt && s.toggleBtnActive]}
                  onPress={() => setPropType(pt)}
                >
                  <Text style={[s.toggleBtnText, propType === pt && s.toggleBtnTextActive]}>{PROPOSAL_TYPE_LABELS[pt]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Title</Text>
            <TextInput style={s.input} placeholder="Proposal title..." placeholderTextColor={t.text.muted} value={propTitle} onChangeText={setPropTitle} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Description</Text>
            <TextInput style={[s.input, s.descInput]} placeholder="Describe your proposal..." placeholderTextColor={t.text.muted} value={propDesc} onChangeText={setPropDesc} multiline numberOfLines={4} />
          </View>
          {propType === 'spend' && (
            <>
              <View style={s.inputCard}>
                <Text style={s.inputLabel}>Amount</Text>
                <TextInput style={s.input} placeholder={`e.g. 1000 ${selectedDAO.treasuryDenom}`} placeholderTextColor={t.text.muted} value={propAmount} onChangeText={setPropAmount} />
              </View>
              <View style={s.inputCard}>
                <Text style={s.inputLabel}>Recipient Address</Text>
                <TextInput style={s.input} placeholder="openchain1..." placeholderTextColor={t.text.muted} value={propRecipient} onChangeText={setPropRecipient} />
              </View>
            </>
          )}
          <TouchableOpacity style={s.submitBtn} onPress={handlePropose} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Proposal</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── Proposal Detail View ─── */

  if (view === 'proposal-detail' && selectedProposal && selectedDAO) {
    const p = selectedProposal;
    const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
    const yesPct = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;
    const quorumPct = p.totalEligible > 0 ? Math.round((totalVotes / p.totalEligible) * 100) : 0;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('detail')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Proposal</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.propCard}>
            <Text style={[s.propType, { color: t.accent.blue }]}>{PROPOSAL_TYPE_LABELS[p.type] ?? 'General'}</Text>
            <Text style={s.propTitle}>{p.title}</Text>
            <Text style={[s.propStatus, { color: STATUS_COLORS[p.status] ?? t.text.muted }]}>
              {p.status.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: t.text.secondary, fontSize: fonts.md, lineHeight: 22, marginHorizontal: 20, marginTop: 12 }}>{p.description}</Text>
          <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginHorizontal: 20, marginTop: 8 }}>Proposed by: {p.proposer}</Text>
          <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginHorizontal: 20, marginTop: 4 }}>Voting ends: {p.endTime}</Text>

          {p.amount && (
            <View style={s.spendDetail}>
              <Text style={s.spendLabel}>Treasury Spend</Text>
              <Text style={s.spendValue}>{p.amount}</Text>
              {p.recipient && <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 4 }}>To: {p.recipient}</Text>}
            </View>
          )}

          <View style={[s.propCard, { marginTop: 16 }]}>
            <View style={s.propVotes}>
              <Text style={[s.voteCount, { color: t.accent.green }]}>Yes: {p.yesVotes}</Text>
              <Text style={[s.voteCount, { color: t.accent.red }]}>No: {p.noVotes}</Text>
              <Text style={[s.voteCount, { color: t.text.muted }]}>Abstain: {p.abstainVotes}</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${yesPct}%`, backgroundColor: t.accent.green }]} />
            </View>
            <Text style={s.quorum}>
              Quorum: {quorumPct}% ({totalVotes} of {p.totalEligible} {selectedDAO.votingModel === 'one-member-one-vote' ? 'members' : 'weight'} voted)
            </Text>
          </View>

          {p.status === 'voting' && (
            <View style={s.voteRow}>
              <TouchableOpacity style={[s.voteBtn, { backgroundColor: t.accent.green }]} onPress={() => handleVote(p.id, 'yes')} disabled={voting}>
                <Text style={s.voteBtnText}>{voting ? '...' : 'Yes'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.voteBtn, { backgroundColor: t.accent.red }]} onPress={() => handleVote(p.id, 'no')} disabled={voting}>
                <Text style={s.voteBtnText}>{voting ? '...' : 'No'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.voteBtn, { backgroundColor: t.text.muted }]} onPress={() => handleVote(p.id, 'abstain')} disabled={voting}>
                <Text style={s.voteBtnText}>{voting ? '...' : 'Abstain'}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── DAO Detail View ─── */

  if (view === 'detail' && selectedDAO) {
    const dao = selectedDAO;
    const roleColor = dao.role === 'creator' ? t.accent.purple : dao.role === 'admin' ? t.accent.orange : t.accent.blue;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setView('list'); setDetailTab('proposals'); }}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>{dao.name}</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.detailHeader}>
            <Text style={s.detailName}>{dao.name}</Text>
            <Text style={s.detailDesc}>{dao.description}</Text>
            <View style={s.detailMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaValue}>{dao.memberCount}</Text>
                <Text style={s.metaLabel}>Members</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaValue}>{dao.proposals.length}</Text>
                <Text style={s.metaLabel}>Proposals</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaValue}>{dao.token}</Text>
                <Text style={s.metaLabel}>Token</Text>
              </View>
            </View>
            <View style={s.votingModelBadge}>
              <Text style={s.votingModelText}>
                {dao.votingModel === 'one-member-one-vote' ? '1 Member = 1 Vote' : 'Token Weighted'}
              </Text>
            </View>
            <View style={[s.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[s.roleBadgeText, { color: roleColor }]}>{dao.role.toUpperCase()}</Text>
            </View>
          </View>

          {/* Treasury */}
          <View style={s.treasuryCard}>
            <Text style={s.treasuryLabel}>DAO Treasury</Text>
            <Text style={s.treasuryValue}>{dao.treasuryBalance}</Text>
            <Text style={s.treasuryDenom}>{dao.treasuryDenom}</Text>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, detailTab === 'proposals' && s.tabActive]} onPress={() => setDetailTab('proposals')}>
              <Text style={[s.tabText, detailTab === 'proposals' && s.tabTextActive]}>Proposals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, detailTab === 'members' && s.tabActive]} onPress={() => setDetailTab('members')}>
              <Text style={[s.tabText, detailTab === 'members' && s.tabTextActive]}>Members</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, detailTab === 'treasury' && s.tabActive]} onPress={() => setDetailTab('treasury')}>
              <Text style={[s.tabText, detailTab === 'treasury' && s.tabTextActive]}>History</Text>
            </TouchableOpacity>
          </View>

          {detailTab === 'proposals' && (
            <>
              <TouchableOpacity style={s.proposeBtn} onPress={() => setView('propose')}>
                <Text style={s.proposeBtnText}>New Proposal</Text>
              </TouchableOpacity>
              {dao.proposals.length === 0 ? (
                <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No proposals yet. Be the first!</Text>
              ) : (
                <>
                  <Text style={s.section}>Active & Past Proposals</Text>
                  {dao.proposals.map(p => {
                    const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
                    const yesPct = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;
                    return (
                      <TouchableOpacity key={p.id} style={s.propCard} onPress={() => { setSelectedProposal(p); setView('proposal-detail'); }}>
                        <Text style={[s.propType, { color: t.accent.blue }]}>{PROPOSAL_TYPE_LABELS[p.type]}</Text>
                        <Text style={s.propTitle}>{p.title}</Text>
                        <Text style={[s.propStatus, { color: STATUS_COLORS[p.status] ?? t.text.muted }]}>{p.status.toUpperCase()}</Text>
                        <View style={s.propVotes}>
                          <Text style={[s.voteCount, { color: t.accent.green }]}>Yes: {p.yesVotes}</Text>
                          <Text style={[s.voteCount, { color: t.accent.red }]}>No: {p.noVotes}</Text>
                          <Text style={[s.voteCount, { color: t.text.muted }]}>Abstain: {p.abstainVotes}</Text>
                        </View>
                        <View style={s.progressBar}>
                          <View style={[s.progressFill, { width: `${yesPct}%`, backgroundColor: t.accent.green }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}

          {detailTab === 'members' && (
            <>
              <Text style={s.section}>{dao.memberCount} Members</Text>
              {dao.members.map((m, i) => (
                <View key={i} style={s.memberCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.memberName}>{m.name}</Text>
                    <Text style={s.memberJoined}>Joined {m.joinedDate}</Text>
                  </View>
                  <Text style={s.memberAddr}>{m.address}</Text>
                  {dao.votingModel === 'token-weighted' && (
                    <Text style={{ color: t.accent.blue, fontSize: fonts.sm, marginTop: 4 }}>Voting weight: {m.votingPower}</Text>
                  )}
                </View>
              ))}
            </>
          )}

          {detailTab === 'treasury' && (
            <>
              <Text style={s.section}>Treasury History</Text>
              <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20, marginHorizontal: 20, lineHeight: 20 }}>
                Treasury transactions will appear here once proposals involving treasury spends are executed. Created {dao.createdDate}.
              </Text>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── DAO List View ─── */

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>DAOs</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>Decentralized Autonomous Organizations</Text>
          <Text style={s.heroSubtitle}>
            Create or join DAOs on Open Chain. Manage treasuries, propose actions, and vote collectively.
          </Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setView('create')}>
            <Text style={s.createBtnText}>Create DAO</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Your DAOs</Text>
        {loading ? (
          <ActivityIndicator color={t.accent.blue} style={{ marginTop: 20 }} />
        ) : daos.length === 0 ? (
          <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No DAOs yet. Create one or get invited!</Text>
        ) : (
          daos.map(dao => {
            const roleColor = dao.role === 'creator' ? t.accent.purple : dao.role === 'admin' ? t.accent.orange : t.accent.blue;
            return (
              <TouchableOpacity key={dao.id} style={s.daoCard} onPress={() => { setSelectedDAO(dao); setView('detail'); }}>
                <Text style={s.daoName}>{dao.name}</Text>
                <Text style={s.daoDesc} numberOfLines={2}>{dao.description}</Text>
                <View style={s.daoMeta}>
                  <View style={s.metaItem}>
                    <Text style={s.metaValue}>{dao.memberCount}</Text>
                    <Text style={s.metaLabel}>Members</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Text style={s.metaValue}>{dao.treasuryBalance}</Text>
                    <Text style={s.metaLabel}>{dao.treasuryDenom}</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Text style={s.metaValue}>{dao.proposals.filter(p => p.status === 'voting').length}</Text>
                    <Text style={s.metaLabel}>Active</Text>
                  </View>
                </View>
                <View style={[s.roleBadge, { backgroundColor: roleColor + '20' }]}>
                  <Text style={[s.roleBadgeText, { color: roleColor }]}>{dao.role.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
