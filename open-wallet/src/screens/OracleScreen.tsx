import { fonts } from '../utils/theme';
/**
 * Oracle Screen — Milestone verification network.
 *
 * Verifiers attest to human development milestones.
 * When enough verifiers approve, OTK is minted for the achiever.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';

interface PendingMilestone {
  id: string;
  uid: string;
  channel: string;
  description: string;
  mintAmount: number;
  approvals: number;
  rejections: number;
  threshold: number;
  status: string;
}

interface Props {
  onClose: () => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  nurture: 'Nurture', education: 'Education', health: 'Health',
  community: 'Community', economic: 'Economic', governance: 'Governance',
};

const DEMO_MILESTONES: PendingMilestone[] = [
  { id: 'ms-1', uid: 'uid-a1b2c3', channel: 'education', description: 'Child reads at grade level (age 8)', mintAmount: 200000000, approvals: 1, rejections: 0, threshold: 2, status: 'pending' },
  { id: 'ms-2', uid: 'uid-d4e5f6', channel: 'nurture', description: 'Parent completes first year of caregiving', mintAmount: 500000000, approvals: 2, rejections: 0, threshold: 2, status: 'verified' },
  { id: 'ms-3', uid: 'uid-g7h8i9', channel: 'health', description: 'Community health worker vaccinates 100 children', mintAmount: 300000000, approvals: 0, rejections: 0, threshold: 2, status: 'pending' },
  { id: 'ms-4', uid: 'uid-j0k1l2', channel: 'community', description: 'Volunteer organizes neighborhood cleanup (50+ participants)', mintAmount: 150000000, approvals: 1, rejections: 1, threshold: 2, status: 'pending' },
];

export function OracleScreen({ onClose }: Props) {
  const [view, setView] = useState<'milestones' | 'register'>('milestones');
  const [milestones, setMilestones] = useState<PendingMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [attesting, setAttesting] = useState<string | null>(null);
  const [regChannels, setRegChannels] = useState<string[]>(['education']);
  const [regName, setRegName] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.orange + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    regBtn: { backgroundColor: t.accent.orange, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
    regBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    msTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    msChannel: { fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    msUid: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    msMint: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 6 },
    msStatus: { fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
    attestRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    attestBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    attestText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    attestCount: { color: t.text.muted, fontSize: fonts.xs, marginTop: 8 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    chipActive: { backgroundColor: t.accent.orange },
    chipText: { color: t.text.secondary, fontSize: fonts.sm },
    chipTextActive: { color: '#fff', fontWeight: fonts.bold },
    submitBtn: { backgroundColor: t.accent.orange, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
  }), [t]);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setMilestones(DEMO_MILESTONES);
      setLoading(false);
      return;
    }
    try {
      const restUrl = getNetworkConfig().openchain.restUrl;
      const res = await fetch(`${restUrl}/openchain/otk/v1/pending_milestones`);
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones ?? []);
      }
    } catch { /* network error */ }
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const handleAttest = useCallback(async (milestoneId: string, approved: boolean) => {
    setAttesting(milestoneId);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1000));
      setMilestones(prev => prev.map(m => {
        if (m.id !== milestoneId) return m;
        const updated = { ...m, approvals: m.approvals + (approved ? 1 : 0), rejections: m.rejections + (approved ? 0 : 1) };
        if (updated.approvals >= updated.threshold) updated.status = 'verified';
        if (updated.rejections >= updated.threshold) updated.status = 'rejected';
        return updated;
      }));
      Alert.alert(approved ? 'Approved' : 'Rejected', `Your attestation has been recorded.`);
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
          typeUrl: '/openchain.otk.v1.MsgAttestMilestone',
          value: { creator: account.address, milestone_id: milestoneId, verifier_uid: account.address, approved, evidence: '' },
        };
        const result = await client.signAndBroadcast(account.address, [msg], { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' });
        client.disconnect();
        wallet.destroy();
        if (result.code === 0) {
          Alert.alert('Attestation Recorded', `Tx: ${result.transactionHash.slice(0, 16)}...`);
          fetchMilestones();
        } else {
          Alert.alert('Failed', result.rawLog ?? 'Attestation failed');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Attestation failed');
      }
    }
    setAttesting(null);
  }, [demoMode, fetchMilestones]);

  const handleRegister = useCallback(async () => {
    if (!regName.trim()) { Alert.alert('Required', 'Enter your verifier name.'); return; }
    if (regChannels.length === 0) { Alert.alert('Required', 'Select at least one channel.'); return; }
    setLoading(true);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      Alert.alert('Registered', `You are now a verifier for: ${regChannels.map(c => CHANNEL_LABELS[c]).join(', ')}`);
      setView('milestones');
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
          typeUrl: '/openchain.otk.v1.MsgRegisterVerifier',
          value: { creator: account.address, uid: account.address, name: regName.trim(), channels: regChannels },
        };
        const result = await client.signAndBroadcast(account.address, [msg], { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' });
        client.disconnect();
        wallet.destroy();
        if (result.code === 0) {
          Alert.alert('Registered', 'You are now a milestone verifier.');
          setView('milestones');
        } else {
          Alert.alert('Failed', result.rawLog ?? 'Registration failed');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Registration failed');
      }
    }
    setLoading(false);
  }, [regName, regChannels, demoMode]);

  const toggleChannel = (ch: string) => {
    setRegChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  // ─── Register View ───
  if (view === 'register') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('milestones')}><Text style={s.closeBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Become a Verifier</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Your Name</Text>
            <TextInput style={s.input} placeholder="Dr. Smith, Teacher Jane, etc." placeholderTextColor={t.text.muted} value={regName} onChangeText={setRegName} />
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Channels You Can Verify</Text>
            <View style={s.chipRow}>
              {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                <TouchableOpacity key={key} style={[s.chip, regChannels.includes(key) && s.chipActive]} onPress={() => toggleChannel(key)}>
                  <Text style={[s.chipText, regChannels.includes(key) && s.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Register as Verifier</Text>}
          </TouchableOpacity>
          <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 16, marginHorizontal: 24, lineHeight: 18 }}>
            Verifiers attest to human development milestones. When enough independent verifiers approve a milestone, OTK is minted for the achiever. Your accuracy is tracked.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Milestones View ───
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Milestone Oracle</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>Verify Human Milestones</Text>
          <Text style={s.heroSub}>
            Attest to real-world achievements — reading milestones, healthcare contributions, community service. Your attestation helps mint OTK for those who earned it.
          </Text>
          <TouchableOpacity style={s.regBtn} onPress={() => setView('register')}>
            <Text style={s.regBtnText}>Become a Verifier</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Pending Milestones</Text>
        {loading ? (
          <ActivityIndicator color={t.accent.orange} style={{ marginTop: 20 }} />
        ) : milestones.filter(m => m.status === 'pending').length === 0 ? (
          <Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 20 }}>No pending milestones</Text>
        ) : (
          milestones.filter(m => m.status === 'pending').map(m => (
            <View key={m.id} style={s.card}>
              <Text style={s.msTitle}>{m.description}</Text>
              <Text style={[s.msChannel, { color: t.accent.orange }]}>{CHANNEL_LABELS[m.channel] ?? m.channel}</Text>
              <Text style={s.msUid}>UID: {m.uid}</Text>
              <Text style={s.msMint}>Mint: {(m.mintAmount / 1_000_000).toFixed(2)} OTK</Text>
              <Text style={s.attestCount}>Approvals: {m.approvals}/{m.threshold} required</Text>
              <View style={s.attestRow}>
                <TouchableOpacity style={[s.attestBtn, { backgroundColor: t.accent.green }]} onPress={() => handleAttest(m.id, true)} disabled={attesting === m.id}>
                  <Text style={s.attestText}>{attesting === m.id ? '...' : 'Approve'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.attestBtn, { backgroundColor: t.accent.red }]} onPress={() => handleAttest(m.id, false)} disabled={attesting === m.id}>
                  <Text style={s.attestText}>{attesting === m.id ? '...' : 'Reject'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={s.section}>Verified</Text>
        {milestones.filter(m => m.status === 'verified').map(m => (
          <View key={m.id} style={s.card}>
            <Text style={s.msTitle}>{m.description}</Text>
            <Text style={[s.msStatus, { color: t.accent.green }]}>VERIFIED — OTK minted</Text>
            <Text style={s.msMint}>{(m.mintAmount / 1_000_000).toFixed(2)} OTK distributed</Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
