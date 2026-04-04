import { fonts } from '../utils/theme';
/**
 * Identity & Reputation Screen — Unified cross-chain identity view.
 *
 * Shows the user's Universal ID with all linked addresses across chains,
 * reputation score with level badge, score breakdown, and a QR code
 * for sharing identity. Allows linking new chain addresses by signing
 * a proof message.
 *
 * "Your identity is yours. It spans every chain you touch, but belongs
 *  only to you." — Human Constitution, Article II
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

// Supported chains for linking
const SUPPORTED_CHAINS = [
  { id: 'bitcoin', label: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'ethereum', label: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'solana', label: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'openchain', label: 'Open Chain', symbol: 'OTK', color: '#00C853' },
  { id: 'cosmos', label: 'Cosmos', symbol: 'ATOM', color: '#2E3148' },
] as const;

// Reputation levels with display info
const REPUTATION_LEVELS = [
  { level: 'newcomer', label: 'Newcomer', min: 0, max: 100, color: '#9E9E9E', badge: 'N' },
  { level: 'active', label: 'Active', min: 101, max: 300, color: '#2196F3', badge: 'A' },
  { level: 'trusted', label: 'Trusted', min: 301, max: 600, color: '#4CAF50', badge: 'T' },
  { level: 'elder', label: 'Elder', min: 601, max: 800, color: '#FF9800', badge: 'E' },
  { level: 'guardian', label: 'Guardian', min: 801, max: 1000, color: '#9C27B0', badge: 'G' },
] as const;

// Demo data for sample linked addresses and reputation
const DEMO_LINKED_ADDRESSES: Record<string, { address: string; verified: boolean }> = {
  bitcoin: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', verified: true },
  ethereum: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', verified: true },
  solana: { address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', verified: true },
  openchain: { address: 'openchain1abc123def456ghi789jkl012mno345pqr678', verified: true },
  cosmos: { address: 'cosmos1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh', verified: false },
};

const DEMO_REPUTATION = {
  uid: 'uid-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  score: 520,
  txCount: 156,
  accountAge: 3200000, // ~222 days
  gratitudeScore: 42,
  governanceScore: 18,
  verifierScore: 35,
  level: 'trusted',
};

const DEMO_UID = 'uid-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

type LinkingState = 'idle' | 'selecting' | 'signing' | 'submitting';

export function IdentityScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [linkedAddresses, setLinkedAddresses] = useState<Record<string, { address: string; verified: boolean }>>({});
  const [reputation, setReputation] = useState(DEMO_REPUTATION);
  const [linkingState, setLinkingState] = useState<LinkingState>('idle');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    // Identity card
    idCard: { backgroundColor: t.bg.card, borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center', borderWidth: 1, borderColor: t.border },
    idIcon: { fontSize: 48, marginBottom: 12 },
    idLabel: { color: t.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
    idValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, fontFamily: 'monospace', marginTop: 4 },
    // Reputation section
    repCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16 },
    repHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    repTitle: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    repBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    repBadgeText: { color: '#fff', fontSize: 18, fontWeight: fonts.heavy },
    repScore: { color: t.text.primary, fontSize: 36, fontWeight: fonts.heavy, textAlign: 'center' },
    repScoreLabel: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },
    repLevel: { textAlign: 'center', fontSize: 16, fontWeight: fonts.bold, marginTop: 8 },
    repBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 16 },
    repFill: { height: 8, borderRadius: 4 },
    // Score breakdown
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    breakdownLabel: { color: t.text.secondary, fontSize: 14 },
    breakdownValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    breakdownBar: { height: 4, backgroundColor: t.border, borderRadius: 2, flex: 1, marginHorizontal: 12 },
    breakdownFill: { height: 4, borderRadius: 2 },
    divider: { height: 1, backgroundColor: t.border },
    // Linked addresses
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    chainCard: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    chainRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    chainDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    chainInfo: { flex: 1 },
    chainName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold },
    chainAddr: { color: t.text.muted, fontSize: 12, fontFamily: 'monospace', marginTop: 2 },
    verifiedBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    verifiedText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.bold },
    unverifiedBadge: { backgroundColor: t.accent.yellow + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    unverifiedText: { color: t.accent.yellow, fontSize: 11, fontWeight: fonts.bold },
    notLinkedText: { color: t.text.muted, fontSize: 13, fontStyle: 'italic' },
    // Link button
    linkBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    linkBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    // Chain selector
    selectorOverlay: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16 },
    selectorTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    selectorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    selectorLabel: { color: t.text.primary, fontSize: 15, marginLeft: 12 },
    selectorSymbol: { color: t.text.muted, fontSize: 13, marginLeft: 'auto' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelText: { color: t.accent.red, fontSize: 15, fontWeight: fonts.semibold },
    // QR
    qrCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    qrPlaceholder: { width: 200, height: 200, backgroundColor: t.border, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    qrText: { color: t.text.muted, fontSize: 14 },
    shareBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 12 },
    shareBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    // Level thresholds
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    levelLabel: { fontSize: 13 },
    levelRange: { color: t.text.muted, fontSize: 12 },
    // Empty state
    emptyCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 32, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { color: t.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  }), [t]);

  // Load identity data
  useEffect(() => {
    loadIdentityData();
  }, []);

  const loadIdentityData = useCallback(async () => {
    setLoading(true);
    try {
      if (demoMode) {
        // Demo mode: use sample data
        await new Promise((r) => setTimeout(r, 600));
        setUid(DEMO_UID);
        setLinkedAddresses(DEMO_LINKED_ADDRESSES);
        setReputation(DEMO_REPUTATION);
      } else {
        // Real mode: query Open Chain for identity link and reputation
        const store = useWalletStore.getState();
        const openChainAddr = store.addresses.openchain ?? store.addresses.cosmos ?? '';

        if (!openChainAddr) {
          setUid(null);
          setLoading(false);
          return;
        }

        try {
          const { getNetworkConfig } = await import('../core/network');
          const config = getNetworkConfig().openchain;

          // Query UID
          const uidRes = await fetch(`${config.restUrl}/openchain/uid/v1/uid/${openChainAddr}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (uidRes.ok) {
            const uidData = await uidRes.json();
            setUid(uidData.uid?.id ?? null);

            if (uidData.uid?.id) {
              // Query linked addresses
              const linkRes = await fetch(`${config.restUrl}/openchain/uid/v1/links/${uidData.uid.id}`, {
                signal: AbortSignal.timeout(8000),
              });
              if (linkRes.ok) {
                const linkData = await linkRes.json();
                const addrs: Record<string, { address: string; verified: boolean }> = {};
                if (linkData.link?.linked_addresses) {
                  for (const [chain, addr] of Object.entries(linkData.link.linked_addresses)) {
                    addrs[chain] = {
                      address: addr as string,
                      verified: linkData.link.verified_links?.[chain] ?? false,
                    };
                  }
                }
                setLinkedAddresses(addrs);
              }

              // Query reputation
              const repRes = await fetch(`${config.restUrl}/openchain/uid/v1/reputation/${uidData.uid.id}`, {
                signal: AbortSignal.timeout(8000),
              });
              if (repRes.ok) {
                const repData = await repRes.json();
                if (repData.reputation) {
                  setReputation({
                    uid: repData.reputation.uid,
                    score: parseInt(repData.reputation.score) || 0,
                    txCount: parseInt(repData.reputation.tx_count) || 0,
                    accountAge: parseInt(repData.reputation.account_age) || 0,
                    gratitudeScore: parseInt(repData.reputation.gratitude_score) || 0,
                    governanceScore: parseInt(repData.reputation.governance_score) || 0,
                    verifierScore: parseInt(repData.reputation.verifier_score) || 0,
                    level: repData.reputation.level || 'newcomer',
                  });
                }
              }
            }
          }
        } catch {
          // Network error — use defaults
        }

        // Also add wallet's own addresses as linked
        const walletAddrs: Record<string, { address: string; verified: boolean }> = {};
        if (store.addresses.bitcoin) walletAddrs.bitcoin = { address: store.addresses.bitcoin, verified: true };
        if (store.addresses.ethereum) walletAddrs.ethereum = { address: store.addresses.ethereum, verified: true };
        if (store.addresses.solana) walletAddrs.solana = { address: store.addresses.solana, verified: true };
        if (store.addresses.openchain) walletAddrs.openchain = { address: store.addresses.openchain, verified: true };
        if (store.addresses.cosmos) walletAddrs.cosmos = { address: store.addresses.cosmos, verified: true };
        setLinkedAddresses((prev) => ({ ...walletAddrs, ...prev }));
      }
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  // Link a new address
  const handleLinkAddress = useCallback(async (chainId: string) => {
    setLinkingState('signing');
    setSelectedChain(chainId);

    try {
      if (demoMode) {
        // Demo: simulate signing and linking
        await new Promise((r) => setTimeout(r, 1200));
        const demoAddr = `demo_${chainId}_${Date.now().toString(16).slice(-8)}`;
        setLinkedAddresses((prev) => ({
          ...prev,
          [chainId]: { address: demoAddr, verified: true },
        }));
        Alert.alert('Address Linked', `${chainId} address linked to your Universal ID.`);
      } else {
        // Real: sign proof message with chain-specific key
        const store = useWalletStore.getState();
        const password = store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked');

        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);
        const { HDWallet } = await import('../core/wallet/hdwallet');
        const wallet = HDWallet.fromMnemonic(contents.mnemonic);

        const chainAddr = store.addresses[chainId as keyof typeof store.addresses] ?? '';
        if (!chainAddr) throw new Error(`No ${chainId} address found in wallet`);

        // Sign the proof message: "link:<uid>:<chain>:<address>"
        const proofMessage = `link:${uid}:${chainId}:${chainAddr}`;
        const encoder = new TextEncoder();
        const msgBytes = encoder.encode(proofMessage);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBytes);
        const privateKey = wallet.derivePrivateKey(chainId, store.activeAccountIndex);

        // Submit link transaction to Open Chain
        setLinkingState('submitting');
        const { getNetworkConfig } = await import('../core/network');
        const config = getNetworkConfig().openchain;
        const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
        const { SigningStargateClient } = await import('@cosmjs/stargate');

        const cosmWallet = await DirectSecp256k1Wallet.fromKey(
          wallet.derivePrivateKey('openchain', store.activeAccountIndex),
          config.addressPrefix,
        );
        const [account] = await cosmWallet.getAccounts();
        const client = await SigningStargateClient.connectWithSigner(config.rpcUrl, cosmWallet);

        const msg = {
          typeUrl: '/openchain.uid.v1.MsgLinkAddress',
          value: {
            creator: account.address,
            uid: uid,
            chain: chainId,
            address: chainAddr,
            proof: Array.from(new Uint8Array(hashBuffer)),
          },
        };

        const fee = { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' };
        const result = await client.signAndBroadcast(account.address, [msg], fee, 'Link address via Open Wallet');
        client.disconnect();
        wallet.destroy();

        if (result.code !== 0) throw new Error(`Transaction failed: ${result.rawLog}`);

        setLinkedAddresses((prev) => ({
          ...prev,
          [chainId]: { address: chainAddr, verified: true },
        }));
        Alert.alert('Address Linked', `${chainId} address linked to your Universal ID.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Linking failed';
      Alert.alert('Link Failed', msg);
    } finally {
      setLinkingState('idle');
      setSelectedChain(null);
    }
  }, [demoMode, uid]);

  // Share identity via QR / system share
  const handleShare = useCallback(async () => {
    if (!uid) return;
    try {
      await Share.share({
        message: `My Universal ID: ${uid}\nVerify at: https://explorer.openchain.org/uid/${uid}`,
        title: 'My Universal ID',
      });
    } catch {}
  }, [uid]);

  // Get level info for current score
  const currentLevel = useMemo(() => {
    return REPUTATION_LEVELS.find((l) => l.level === reputation.level) ?? REPUTATION_LEVELS[0];
  }, [reputation.level]);

  // Score breakdown items
  const breakdownItems = useMemo(() => [
    { label: 'Transactions', value: reputation.txCount, max: 1000, color: t.accent.blue },
    { label: 'Account Age', value: Math.floor(reputation.accountAge / 14400), max: 365, suffix: ' days', color: t.accent.green },
    { label: 'Gratitude', value: reputation.gratitudeScore, max: 200, color: t.accent.purple ?? '#9C27B0' },
    { label: 'Governance', value: reputation.governanceScore, max: 100, color: t.accent.orange ?? '#FF9800' },
    { label: 'Verifier', value: reputation.verifierScore, max: 200, color: t.accent.yellow },
  ], [reputation, t]);

  const truncateAddr = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Identity</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={t.accent.green} />
          <Text style={{ color: t.text.muted, fontSize: 14, marginTop: 12 }}>Loading identity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!uid) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Identity</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
        </View>
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>&#128100;</Text>
          <Text style={s.emptyTitle}>No Universal ID</Text>
          <Text style={s.emptySubtitle}>
            Register a Universal ID first to link addresses and build your reputation across chains.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Identity</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Universal ID Card */}
        <View style={s.idCard}>
          <Text style={s.idIcon}>&#127760;</Text>
          <Text style={s.idLabel}>Universal ID</Text>
          <Text style={s.idValue}>{uid}</Text>
          <Text style={[s.idLabel, { marginTop: 12 }]}>
            {Object.keys(linkedAddresses).length} chain{Object.keys(linkedAddresses).length !== 1 ? 's' : ''} linked
          </Text>
        </View>

        {/* Reputation Score */}
        <View style={s.repCard}>
          <View style={s.repHeader}>
            <Text style={s.repTitle}>Reputation</Text>
            <View style={[s.repBadge, { backgroundColor: currentLevel.color }]}>
              <Text style={s.repBadgeText}>{currentLevel.badge}</Text>
            </View>
          </View>

          <Text style={s.repScore}>{reputation.score}</Text>
          <Text style={s.repScoreLabel}>out of 1000</Text>
          <Text style={[s.repLevel, { color: currentLevel.color }]}>{currentLevel.label}</Text>

          {/* Progress bar */}
          <View style={s.repBar}>
            <View style={[s.repFill, {
              width: `${Math.min(100, (reputation.score / 1000) * 100)}%`,
              backgroundColor: currentLevel.color,
            }]} />
          </View>

          {/* Level thresholds */}
          <View style={{ marginTop: 16 }}>
            {REPUTATION_LEVELS.map((level) => (
              <View key={level.level} style={s.levelRow}>
                <Text style={[s.levelLabel, {
                  color: level.level === reputation.level ? level.color : t.text.muted,
                  fontWeight: level.level === reputation.level ? '700' : '400',
                }]}>
                  {level.level === reputation.level ? '> ' : '  '}{level.label}
                </Text>
                <Text style={s.levelRange}>{level.min}-{level.max}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Score Breakdown */}
        <Text style={s.section}>Score Breakdown</Text>
        <View style={[s.chainCard, { padding: 16 }]}>
          {breakdownItems.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.breakdownRow}>
                <Text style={[s.breakdownLabel, { width: 100 }]}>{item.label}</Text>
                <View style={s.breakdownBar}>
                  <View style={[s.breakdownFill, {
                    width: `${Math.min(100, (item.value / item.max) * 100)}%`,
                    backgroundColor: item.color,
                  }]} />
                </View>
                <Text style={[s.breakdownValue, { width: 60, textAlign: 'right' }]}>
                  {item.value}{item.suffix ?? ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Linked Addresses */}
        <Text style={s.section}>Linked Addresses</Text>
        <View style={s.chainCard}>
          {SUPPORTED_CHAINS.map((chain, i) => {
            const linked = linkedAddresses[chain.id];
            return (
              <View key={chain.id}>
                {i > 0 && <View style={s.divider} />}
                <TouchableOpacity
                  style={s.chainRow}
                  onPress={() => {
                    if (!linked) {
                      handleLinkAddress(chain.id);
                    }
                  }}
                  disabled={linkingState !== 'idle'}
                >
                  <View style={[s.chainDot, { backgroundColor: chain.color }]} />
                  <View style={s.chainInfo}>
                    <Text style={s.chainName}>{chain.label} ({chain.symbol})</Text>
                    {linked ? (
                      <Text style={s.chainAddr}>{truncateAddr(linked.address)}</Text>
                    ) : (
                      <Text style={s.notLinkedText}>Tap to link</Text>
                    )}
                  </View>
                  {linked ? (
                    linked.verified ? (
                      <View style={s.verifiedBadge}>
                        <Text style={s.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={s.unverifiedBadge}>
                        <Text style={s.unverifiedText}>Pending</Text>
                      </View>
                    )
                  ) : (
                    linkingState !== 'idle' && selectedChain === chain.id ? (
                      <ActivityIndicator size="small" color={t.accent.blue} />
                    ) : (
                      <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>+ Link</Text>
                    )
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* QR Code / Share */}
        <Text style={s.section}>Share Identity</Text>
        <View style={s.qrCard}>
          {showQR ? (
            <>
              <View style={s.qrPlaceholder}>
                <Text style={s.qrText}>QR: {uid.slice(0, 16)}...</Text>
                <Text style={[s.qrText, { fontSize: 11, marginTop: 4 }]}>(QR rendering requires expo-qrcode)</Text>
              </View>
              <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center' }}>
                Scan to verify this identity on Open Chain
              </Text>
            </>
          ) : (
            <TouchableOpacity onPress={() => setShowQR(true)} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>&#128206;</Text>
              <Text style={{ color: t.accent.blue, fontSize: 15, fontWeight: fonts.semibold }}>Show QR Code</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
            <Text style={s.shareBtnText}>Share Identity</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
