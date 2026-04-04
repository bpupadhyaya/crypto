import { fonts } from '../utils/theme';
/**
 * Cross-Chain Identity Screen — Article II: Identity Linking.
 *
 * Links a single Universal ID to identities on other blockchains.
 * Features:
 *   - Link Ethereum, Solana, Cosmos, Bitcoin addresses to one UID
 *   - Verify ownership via signed message
 *   - View all linked identities
 *   - Manage cross-chain reputation aggregation
 *   - Privacy controls per chain (selective disclosure)
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props { onClose: () => void; }

interface LinkedIdentity {
  chain: string;
  chainIcon: string;
  address: string;
  verified: boolean;
  linkedAt: string;
  reputationScore: number;
  privacy: 'public' | 'selective' | 'private';
}

const DEMO_IDENTITIES: LinkedIdentity[] = [
  { chain: 'Open Chain', chainIcon: 'OC', address: 'open1abc...xyz', verified: true, linkedAt: '2026-01-15', reputationScore: 850, privacy: 'public' },
  { chain: 'Ethereum', chainIcon: 'ETH', address: '0x1234...abcd', verified: true, linkedAt: '2026-02-01', reputationScore: 720, privacy: 'selective' },
  { chain: 'Solana', chainIcon: 'SOL', address: 'Abc...XYZ', verified: true, linkedAt: '2026-02-15', reputationScore: 680, privacy: 'selective' },
  { chain: 'Cosmos', chainIcon: 'ATOM', address: 'cosmos1...def', verified: true, linkedAt: '2026-03-01', reputationScore: 590, privacy: 'public' },
  { chain: 'Bitcoin', chainIcon: 'BTC', address: 'bc1q...xyz', verified: false, linkedAt: '', reputationScore: 0, privacy: 'private' },
];

const AVAILABLE_CHAINS = [
  { chain: 'Ethereum', icon: 'ETH', color: '#627EEA' },
  { chain: 'Solana', icon: 'SOL', color: '#9945FF' },
  { chain: 'Cosmos', icon: 'ATOM', color: '#2E3148' },
  { chain: 'Bitcoin', icon: 'BTC', color: '#F7931A' },
  { chain: 'Polygon', icon: 'MATIC', color: '#8247E5' },
  { chain: 'Avalanche', icon: 'AVAX', color: '#E84142' },
  { chain: 'Arbitrum', icon: 'ARB', color: '#28A0F0' },
  { chain: 'Optimism', icon: 'OP', color: '#FF0420' },
];

export function CrossChainIdentityScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [tab, setTab] = useState<'linked' | 'link-new' | 'reputation'>('linked');
  const [identities] = useState<LinkedIdentity[]>(demoMode ? DEMO_IDENTITIES : []);
  const [selectedChain, setSelectedChain] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    close: { color: t.accent.blue, fontSize: 16 },
    tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
    tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12 },
    chainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chainIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.border, alignItems: 'center', justifyContent: 'center' },
    chainIconText: { color: t.text.primary, fontSize: 14, fontWeight: fonts.heavy },
    chainName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    chainAddr: { color: t.text.secondary, fontSize: 13, fontFamily: 'monospace' },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    verifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent.green },
    unverifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.text.muted },
    verifiedText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    metaLabel: { color: t.text.muted, fontSize: 12 },
    metaValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    privacyChip: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 20, marginTop: 16, marginBottom: 8 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginHorizontal: 16, marginBottom: 12 },
    chainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    chainTile: { width: '22%' as any, paddingVertical: 12, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    chainTileActive: { borderWidth: 2, borderColor: t.accent.blue },
    chainTileIcon: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 4 },
    chainTileName: { color: t.text.secondary, fontSize: 10, fontWeight: fonts.semibold },
    verifyBtn: { marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: t.accent.blue, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    repCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, alignItems: 'center' },
    repScore: { color: t.accent.green, fontSize: 48, fontWeight: fonts.heavy },
    repLabel: { color: t.text.secondary, fontSize: 13 },
    repBreakdown: { marginTop: 12, width: '100%' },
    repRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },
    infoBox: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 16 },
    infoText: { color: t.accent.blue, fontSize: 13, lineHeight: 20 },
  }), [t]);

  const aggregateReputation = identities.filter(i => i.verified).reduce((sum, i) => sum + i.reputationScore, 0);
  const verifiedCount = identities.filter(i => i.verified).length;
  const avgReputation = verifiedCount > 0 ? Math.round(aggregateReputation / verifiedCount) : 0;

  const handleVerify = () => {
    if (!selectedChain || !addressInput) {
      Alert.alert('Error', 'Select a chain and enter your address');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      Alert.alert('Verification Sent', `Sign this message on ${selectedChain} to verify ownership:\n\n"I link this address to Open Chain UID: open1abc...xyz"\n\nOnce signed, paste the signature to complete verification.`);
    }, 1000);
  };

  const privacyColor = (p: string) => p === 'public' ? t.accent.green : p === 'selective' ? t.accent.yellow : t.text.muted;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}><Text style={st.close}>Close</Text></TouchableOpacity>
        <Text style={st.title}>Cross-Chain ID</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={st.tabs}>
        {(['linked', 'link-new', 'reputation'] as const).map(t2 => (
          <TouchableOpacity key={t2} style={[st.tab, tab === t2 && st.tabActive]} onPress={() => setTab(t2)}>
            <Text style={[st.tabText, tab === t2 && st.tabTextActive]}>
              {t2 === 'linked' ? `Linked (${verifiedCount})` : t2 === 'link-new' ? 'Link New' : 'Reputation'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 'linked' && (
          <>
            <View style={st.infoBox}>
              <Text style={st.infoText}>Your Universal ID is linked across {verifiedCount} chains. One identity, one human, one vote — regardless of which chain you use.</Text>
            </View>
            {identities.map((id, i) => (
              <View key={i} style={st.card}>
                <View style={st.chainRow}>
                  <View style={st.chainIcon}><Text style={st.chainIconText}>{id.chainIcon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.chainName}>{id.chain}</Text>
                    <Text style={st.chainAddr}>{id.address}</Text>
                  </View>
                  <View style={st.verifiedBadge}>
                    <View style={id.verified ? st.verifiedDot : st.unverifiedDot} />
                    <Text style={[st.verifiedText, !id.verified && { color: t.text.muted }]}>{id.verified ? 'Verified' : 'Unverified'}</Text>
                  </View>
                </View>
                {id.verified && (
                  <View style={st.metaRow}>
                    <View><Text style={st.metaLabel}>Reputation</Text><Text style={st.metaValue}>{id.reputationScore}</Text></View>
                    <View><Text style={st.metaLabel}>Linked</Text><Text style={st.metaValue}>{id.linkedAt}</Text></View>
                    <View><Text style={st.metaLabel}>Privacy</Text>
                      <View style={[st.privacyChip, { backgroundColor: privacyColor(id.privacy) + '20' }]}>
                        <Text style={{ color: privacyColor(id.privacy), fontSize: 11, fontWeight: fonts.bold }}>{id.privacy}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {tab === 'link-new' && (
          <>
            <Text style={st.section}>SELECT CHAIN</Text>
            <View style={st.chainGrid}>
              {AVAILABLE_CHAINS.map(c => (
                <TouchableOpacity key={c.chain} style={[st.chainTile, selectedChain === c.chain && st.chainTileActive]} onPress={() => setSelectedChain(c.chain)}>
                  <Text style={[st.chainTileIcon, { color: c.color }]}>{c.icon}</Text>
                  <Text style={st.chainTileName}>{c.chain}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={st.section}>YOUR ADDRESS ON {selectedChain.toUpperCase() || '...'}</Text>
            <TextInput style={st.input} placeholder="Paste your address" placeholderTextColor={t.text.muted} value={addressInput} onChangeText={setAddressInput} autoCapitalize="none" />
            <TouchableOpacity style={st.verifyBtn} onPress={handleVerify}>
              <Text style={st.btnText}>{verifying ? 'Generating Challenge...' : 'Verify Ownership'}</Text>
            </TouchableOpacity>
            <Text style={[st.infoText, { textAlign: 'center', marginTop: 16, marginHorizontal: 32 }]}>
              You'll sign a message on {selectedChain || 'the selected chain'} to prove you own this address. Your private keys never leave your device.
            </Text>
          </>
        )}

        {tab === 'reputation' && (
          <>
            <View style={st.repCard}>
              <Text style={st.repLabel}>Aggregate Cross-Chain Reputation</Text>
              <Text style={st.repScore}>{avgReputation}</Text>
              <Text style={st.repLabel}>Based on {verifiedCount} linked chains</Text>
              <View style={st.repBreakdown}>
                {identities.filter(i => i.verified).map((id, i) => (
                  <View key={i} style={st.repRow}>
                    <Text style={st.metaLabel}>{id.chain}</Text>
                    <Text style={st.metaValue}>{id.reputationScore}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={st.infoBox}>
              <Text style={st.infoText}>Your reputation is the average across all verified chains. It reflects your contribution history, governance participation, and community standing across the entire blockchain ecosystem.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
