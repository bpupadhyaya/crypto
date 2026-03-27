/**
 * Governance Screen — One-human-one-vote proposals and voting.
 *
 * Each Universal ID gets exactly one vote, regardless of OTK balance.
 * This is democratic governance for humanity, not plutocratic governance for token holders.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'voting' | 'passed' | 'rejected' | 'executed';
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalEligible: number;
  endBlock: number;
}

interface Props {
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  voting: '#2196f3',
  passed: '#4caf50',
  rejected: '#f44336',
  executed: '#9c27b0',
};

// Demo proposals for demo mode
const DEMO_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    title: 'Increase nurture channel minting rate by 10%',
    description: 'Parents and caregivers are undervalued. This proposal increases nOTK minting by 10% for nurture milestones to better recognize the contribution of raising children.',
    proposer: 'openchain1abc...xyz',
    status: 'voting',
    yesVotes: 1247,
    noVotes: 312,
    abstainVotes: 89,
    totalEligible: 5000,
    endBlock: 250000,
  },
  {
    id: 'prop-2',
    title: 'Add mental health as a sub-channel under Health',
    description: 'Mental health contributions (therapy, counseling, peer support) should earn hOTK. This creates a mental_health sub-channel.',
    proposer: 'openchain1def...uvw',
    status: 'passed',
    yesVotes: 3102,
    noVotes: 421,
    abstainVotes: 277,
    totalEligible: 5000,
    endBlock: 200000,
  },
  {
    id: 'prop-3',
    title: 'Reduce governance voting period from 7 to 5 days',
    description: 'Faster governance cycles allow the community to iterate more quickly on policy changes.',
    proposer: 'openchain1ghi...rst',
    status: 'rejected',
    yesVotes: 890,
    noVotes: 2150,
    abstainVotes: 460,
    totalEligible: 5000,
    endBlock: 150000,
  },
];

export function GovernanceScreen({ onClose }: Props) {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voting, setVoting] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    createBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    propCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    propTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    propStatus: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    propVotes: { flexDirection: 'row', gap: 16, marginTop: 12 },
    voteCount: { fontSize: 13, fontWeight: '600' },
    progressBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    quorum: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { minHeight: 120, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    voteRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    voteBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    voteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    backBtn: { color: t.accent.blue, fontSize: 16 },
    detailDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginHorizontal: 20, marginTop: 12 },
    detailProposer: { color: t.text.muted, fontSize: 12, marginHorizontal: 20, marginTop: 8 },
  }), [t]);

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setProposals(DEMO_PROPOSALS);
      setLoading(false);
      return;
    }
    try {
      const restUrl = getNetworkConfig().openchain.restUrl;
      const res = await fetch(`${restUrl}/openchain/govuid/v1/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals ?? []);
      } else {
        setProposals([]);
      }
    } catch {
      setProposals([]);
    }
    setLoading(false);
  }, [demoMode]);

  // Load on mount
  React.useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleCreateProposal = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Enter both title and description.');
      return;
    }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      const newProp: Proposal = {
        id: `prop-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        proposer: addresses.openchain ?? 'demo',
        status: 'voting',
        yesVotes: 0, noVotes: 0, abstainVotes: 0,
        totalEligible: 5000,
        endBlock: 999999,
      };
      setProposals([newProp, ...proposals]);
      Alert.alert('Proposal Created', 'Your proposal is now open for voting.');
      setTitle('');
      setDescription('');
      setView('list');
    } else {
      try {
        const { Vault } = await import('../core/vault/vault');
        const { HDWallet } = await import('../core/wallet/hdwallet');
        const { CosmosSigner } = await import('../core/chains/cosmos-signer');
        const store = useWalletStore.getState();
        const password = store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked');
        const vault = new Vault();
        const { mnemonic } = await vault.unlock(password);
        const wallet = HDWallet.fromMnemonic(mnemonic);
        const signer = CosmosSigner.fromWallet(wallet, store.activeAccountIndex, 'openchain');
        const address = await signer.getAddress();

        const { SigningStargateClient } = await import('@cosmjs/stargate');
        const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
        const config = getNetworkConfig().openchain;
        const signerWallet = await DirectSecp256k1Wallet.fromKey(wallet.derivePrivateKey('openchain', store.activeAccountIndex), config.addressPrefix);
        const client = await SigningStargateClient.connectWithSigner(config.rpcUrl, signerWallet);

        const msg = {
          typeUrl: '/openchain.govuid.v1.MsgSubmitProposal',
          value: {
            creator: address,
            title: title.trim(),
            description: description.trim(),
            voting_period_blocks: 100800, // ~7 days
          },
        };
        const result = await client.signAndBroadcast(address, [msg], { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' });
        client.disconnect();
        wallet.destroy();

        if (result.code === 0) {
          Alert.alert('Proposal Created', `Tx: ${result.transactionHash.slice(0, 16)}...`);
          setTitle('');
          setDescription('');
          setView('list');
          fetchProposals();
        } else {
          Alert.alert('Failed', result.rawLog ?? 'Transaction failed');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create proposal');
      }
    }
    setLoading(false);
  }, [title, description, demoMode, addresses, proposals, fetchProposals]);

  const handleVote = useCallback(async (proposalId: string, vote: 'yes' | 'no' | 'abstain') => {
    setVoting(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1000));
      setProposals(prev => prev.map(p => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          yesVotes: p.yesVotes + (vote === 'yes' ? 1 : 0),
          noVotes: p.noVotes + (vote === 'no' ? 1 : 0),
          abstainVotes: p.abstainVotes + (vote === 'abstain' ? 1 : 0),
        };
      }));
      Alert.alert('Vote Cast', `Your ${vote} vote has been recorded. One human, one vote.`);
    } else {
      try {
        const store = useWalletStore.getState();
        const password = store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked');
        const { Vault } = await import('../core/vault/vault');
        const { HDWallet } = await import('../core/wallet/hdwallet');
        const vault = new Vault();
        const { mnemonic } = await vault.unlock(password);
        const wallet = HDWallet.fromMnemonic(mnemonic);
        const config = getNetworkConfig().openchain;
        const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
        const { SigningStargateClient } = await import('@cosmjs/stargate');
        const signerWallet = await DirectSecp256k1Wallet.fromKey(wallet.derivePrivateKey('openchain', store.activeAccountIndex), config.addressPrefix);
        const [account] = await signerWallet.getAccounts();
        const client = await SigningStargateClient.connectWithSigner(config.rpcUrl, signerWallet);

        const msg = {
          typeUrl: '/openchain.govuid.v1.MsgVote',
          value: { creator: account.address, proposal_id: proposalId, vote },
        };
        const result = await client.signAndBroadcast(account.address, [msg], { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' });
        client.disconnect();
        wallet.destroy();

        if (result.code === 0) {
          Alert.alert('Vote Cast', `Your ${vote} vote has been recorded.`);
          fetchProposals();
        } else {
          Alert.alert('Failed', result.rawLog ?? 'Vote failed');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Vote failed');
      }
    }
    setVoting(false);
    setView('list');
  }, [demoMode, fetchProposals]);

  // ─── Create Proposal View ───
  if (view === 'create') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('list')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>New Proposal</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Title</Text>
            <TextInput style={s.input} placeholder="Proposal title..." placeholderTextColor={t.text.muted} value={title} onChangeText={setTitle} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Description</Text>
            <TextInput style={[s.input, s.descInput]} placeholder="Describe your proposal..." placeholderTextColor={t.text.muted} value={description} onChangeText={setDescription} multiline numberOfLines={6} />
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleCreateProposal} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Proposal</Text>}
          </TouchableOpacity>
          <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 16, marginHorizontal: 24, lineHeight: 18 }}>
            Proposals require a registered Universal ID. Voting period is ~7 days. One human = one vote.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Proposal Detail View ───
  if (view === 'detail' && selectedProposal) {
    const p = selectedProposal;
    const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
    const quorumPct = totalVotes > 0 ? Math.round((totalVotes / p.totalEligible) * 100) : 0;
    const yesPct = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('list')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Proposal</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.propCard}>
            <Text style={s.propTitle}>{p.title}</Text>
            <Text style={[s.propStatus, { color: STATUS_COLORS[p.status] ?? t.text.muted }]}>
              {p.status.toUpperCase()}
            </Text>
          </View>
          <Text style={s.detailDesc}>{p.description}</Text>
          <Text style={s.detailProposer}>Proposed by: {p.proposer.slice(0, 12)}...{p.proposer.slice(-6)}</Text>

          <View style={[s.propCard, { marginTop: 16 }]}>
            <View style={s.propVotes}>
              <Text style={[s.voteCount, { color: t.accent.green }]}>Yes: {p.yesVotes}</Text>
              <Text style={[s.voteCount, { color: t.accent.red }]}>No: {p.noVotes}</Text>
              <Text style={[s.voteCount, { color: t.text.muted }]}>Abstain: {p.abstainVotes}</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${yesPct}%`, backgroundColor: t.accent.green }]} />
            </View>
            <Text style={s.quorum}>Quorum: {quorumPct}% of {p.totalEligible} eligible voters ({totalVotes} voted)</Text>
          </View>

          {p.status === 'voting' && (
            <View style={[s.voteRow, { marginHorizontal: 20 }]}>
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

  // ─── Proposal List View ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Governance</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>One Human, One Vote</Text>
          <Text style={s.heroSubtitle}>
            Every registered Universal ID gets exactly one vote. Token balance doesn't matter — your voice counts equally.
          </Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setView('create')}>
            <Text style={s.createBtnText}>Create Proposal</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Active Proposals</Text>
        {loading ? (
          <ActivityIndicator color={t.accent.blue} style={{ marginTop: 20 }} />
        ) : proposals.length === 0 ? (
          <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No proposals yet. Be the first!</Text>
        ) : (
          proposals.map((p) => {
            const totalVotes = p.yesVotes + p.noVotes + p.abstainVotes;
            const yesPct = totalVotes > 0 ? Math.round((p.yesVotes / totalVotes) * 100) : 0;
            return (
              <TouchableOpacity key={p.id} style={s.propCard} onPress={() => { setSelectedProposal(p); setView('detail'); }}>
                <Text style={s.propTitle}>{p.title}</Text>
                <Text style={[s.propStatus, { color: STATUS_COLORS[p.status] ?? t.text.muted }]}>
                  {p.status.toUpperCase()}
                </Text>
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
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
