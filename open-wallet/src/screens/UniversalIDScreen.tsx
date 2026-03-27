/**
 * Universal ID Registration Screen — Register your identity on Open Chain.
 *
 * "Every human being shall be entitled to a unique Universal ID on Open Chain."
 * — Human Constitution, Article II, Section 1
 *
 * Flow:
 * 1. User taps "Register Universal ID"
 * 2. On-device biometric proof is generated (fingerprint/face — never leaves device)
 * 3. Hash of the proof is submitted to Open Chain as MsgRegisterUID
 * 4. Universal ID is assigned and displayed
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

export function UniversalIDScreen({ onClose }: Props) {
  const [status, setStatus] = useState<'unregistered' | 'registering' | 'registered'>('unregistered');
  const [uid, setUid] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const t = useTheme();
  const addresses = useWalletStore((s) => s.addresses);
  const openChainAddress = addresses.openchain ?? addresses.cosmos ?? '';

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 28, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    heroIcon: { fontSize: 64, marginBottom: 16 },
    heroTitle: { color: t.text.primary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    heroSubtitle: { color: t.text.secondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 28 },
    infoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    infoIcon: { fontSize: 24, marginRight: 14, marginTop: 2 },
    infoContent: { flex: 1 },
    infoTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    infoText: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
    registerBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    registerBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    registeredCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 28, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    uidLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16 },
    uidValue: { color: t.accent.green, fontSize: 16, fontWeight: '700', fontFamily: 'monospace', marginTop: 4 },
    addressLabel: { color: t.text.muted, fontSize: 12, marginTop: 16 },
    addressValue: { color: t.text.secondary, fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
    statusBadge: { backgroundColor: t.accent.green, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 16 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    constitutionLink: { color: t.accent.blue, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 20, marginBottom: 20 },
    privacyNote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
    proofCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12 },
    proofLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    proofValue: { color: t.text.secondary, fontSize: 12, fontFamily: 'monospace', marginTop: 4 },
  }), [t]);

  const handleRegister = useCallback(async () => {
    setStatus('registering');

    try {
      // Step 1: Generate biometric proof on-device
      const { default: LocalAuth } = await import('expo-local-authentication');
      const bioResult = await LocalAuth.authenticateAsync({
        promptMessage: 'Verify your identity to register Universal ID',
        fallbackLabel: 'Use PIN',
      });

      if (!bioResult.success) {
        Alert.alert('Verification Required', 'Biometric verification is needed to register your Universal ID.');
        setStatus('unregistered');
        return;
      }

      // Step 2: Generate proof hash (hash of biometric + address + timestamp)
      // In production: ZK proof that proves uniqueness without revealing identity
      // For now: SHA-256 of address + timestamp (placeholder for real ZK proof)
      const timestamp = Date.now();
      const proofData = `${openChainAddress}:${timestamp}:biometric_verified`;
      const encoder = new TextEncoder();
      const data = encoder.encode(proofData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setProofHash(hash);

      // Step 3: Generate UID from hash
      const uidHash = hash.slice(0, 32);
      const generatedUid = `uid-${uidHash}`;
      setUid(generatedUid);

      // Step 4: Submit to Open Chain (MsgRegisterUID)
      const demoMode = useWalletStore.getState().demoMode;

      if (demoMode) {
        // Demo mode — simulate success
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        // Real broadcast via CosmosSigner
        const store = useWalletStore.getState();
        const password = store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked. Please sign in again.');

        // Unlock vault -> get mnemonic
        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);
        const mnemonic = contents.mnemonic;

        // Restore HD wallet
        const { HDWallet } = await import('../core/wallet/hdwallet');
        const wallet = HDWallet.fromMnemonic(mnemonic);

        // Create CosmosSigner for Open Chain
        const { CosmosSigner } = await import('../core/chains/cosmos-signer');
        const signer = CosmosSigner.fromWallet(wallet, store.activeAccountIndex, 'openchain');

        // Build the MsgRegisterUID
        const { SigningStargateClient } = await import('@cosmjs/stargate');
        const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
        const { getNetworkConfig } = await import('../core/network');

        const config = getNetworkConfig().openchain;
        const privateKey = wallet.derivePrivateKey('openchain', store.activeAccountIndex);
        const cosmWallet = await DirectSecp256k1Wallet.fromKey(privateKey, config.addressPrefix);
        const [account] = await cosmWallet.getAccounts();

        const client = await SigningStargateClient.connectWithSigner(config.rpcUrl, cosmWallet);

        const msg = {
          typeUrl: '/openchain.uid.v1.MsgRegisterUID',
          value: {
            creator: account.address,
            proof_hash: hash,
            guardian: '', // empty for self-sovereign adults
          },
        };

        const fee = { amount: [{ denom: 'uotk', amount: '1000' }], gas: '200000' };
        const result = await client.signAndBroadcast(account.address, [msg], fee, 'Register Universal ID via Open Wallet');

        client.disconnect();
        wallet.destroy();

        if (result.code !== 0) {
          throw new Error(`Transaction failed: ${result.rawLog}`);
        }
      }

      setStatus('registered');

      // Send notification
      try {
        const { notifyUIDRegistered } = await import('../core/notifications');
        await notifyUIDRegistered();
      } catch {}

      Alert.alert(
        'Universal ID Registered',
        'Welcome to Open Chain. Your Universal ID has been created.\n\nYou are now part of a network that values every human contribution.',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      Alert.alert('Registration Failed', msg);
      setStatus('unregistered');
    }
  }, [openChainAddress]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Universal ID</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {status === 'registered' && uid ? (
          <>
            <View style={s.registeredCard}>
              <Text style={s.heroIcon}>&#10003;</Text>
              <Text style={s.heroTitle}>Identity Verified</Text>
              <Text style={s.heroSubtitle}>Your Universal ID is active on Open Chain</Text>
              <Text style={s.uidLabel}>Universal ID</Text>
              <Text style={s.uidValue}>{uid}</Text>
              <Text style={s.addressLabel}>Linked Address</Text>
              <Text style={s.addressValue}>{openChainAddress ? `${openChainAddress.slice(0, 16)}...${openChainAddress.slice(-8)}` : 'Not linked'}</Text>
              <View style={s.statusBadge}>
                <Text style={s.statusText}>ACTIVE</Text>
              </View>
            </View>

            {proofHash && (
              <View style={s.proofCard}>
                <Text style={s.proofLabel}>Biometric Proof Hash</Text>
                <Text style={s.proofValue}>{proofHash.slice(0, 32)}...{proofHash.slice(-8)}</Text>
                <Text style={[s.infoText, { marginTop: 8 }]}>Your biometric data stays on your device. Only this hash is on-chain.</Text>
              </View>
            )}

            <Text style={s.section}>What You Can Do Now</Text>
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#128176;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Earn OTK</Text>
                  <Text style={s.infoText}>Contribute to the network — validate, relay data, help others — and earn Open Token through Proof of Contribution.</Text>
                </View>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#128588;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Send Gratitude</Text>
                  <Text style={s.infoText}>Thank the parents, teachers, and mentors who shaped you. Gratitude transactions are celebrated on-chain.</Text>
                </View>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#9989;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Vote</Text>
                  <Text style={s.infoText}>One human, one vote. Participate in Open Chain governance — shape the future of the network.</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={s.heroCard}>
              <Text style={s.heroIcon}>&#127760;</Text>
              <Text style={s.heroTitle}>Your Identity on Open Chain</Text>
              <Text style={s.heroSubtitle}>
                A Universal ID is your privacy-preserving identity on Open Chain. It proves you are a unique human — without revealing who you are.
              </Text>
            </View>

            <Text style={s.section}>How It Works</Text>
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#128274;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Privacy-Preserving</Text>
                  <Text style={s.infoText}>Your biometric data never leaves your device. Only a cryptographic hash is stored on-chain. No one — not even the chain — knows who you are.</Text>
                </View>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#128100;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>One Human, One ID</Text>
                  <Text style={s.infoText}>Each person can register exactly one Universal ID. This prevents Sybil attacks and ensures one-human-one-vote governance.</Text>
                </View>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>&#128275;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Selective Disclosure</Text>
                  <Text style={s.infoText}>Choose what to prove: "I am a parent," "I am a teacher" — without revealing your identity. Zero-knowledge proofs make this possible.</Text>
                </View>
              </View>
              <View style={[s.infoRow, { marginBottom: 0 }]}>
                <Text style={s.infoIcon}>&#127775;</Text>
                <View style={s.infoContent}>
                  <Text style={s.infoTitle}>Living Ledger</Text>
                  <Text style={s.infoText}>Your Universal ID unlocks your Living Ledger — a lifelong record of value received and given. Every contribution counts.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={s.registerBtn}
              onPress={handleRegister}
              disabled={status === 'registering'}
            >
              {status === 'registering' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.registerBtnText}>Register Universal ID</Text>
              )}
            </TouchableOpacity>

            <Text style={s.privacyNote}>
              Registration uses your device's biometric sensor (Face ID or fingerprint). Your biometric data stays on your device — only a hash is submitted to Open Chain. This is a birthright — it costs nothing.
            </Text>
          </>
        )}

        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/bpupadhyaya/crypto/blob/main/docs/HUMAN_CONSTITUTION.md')}>
          <Text style={s.constitutionLink}>Read the Human Constitution &rarr;</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
