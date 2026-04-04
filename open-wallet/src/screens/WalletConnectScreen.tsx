import { fonts } from '../utils/theme';
/**
 * WalletConnect Screen — Connect Open Wallet to dApps.
 *
 * Phase 1: UI + mock pairing flow via QR scan
 * Phase 2: Real WalletConnect v2 SDK integration
 *
 * Real integration requires: @walletconnect/react-native-compat
 * + @walletconnect/web3wallet
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface DAppSession {
  id: string;
  name: string;
  url: string;
  icon: string;
  chain: string;
  connectedAt: number;
}

interface Props {
  onClose: () => void;
}

export function WalletConnectScreen({ onClose }: Props) {
  const [sessions, setSessions] = useState<DAppSession[]>([]);
  const [wcUri, setWcUri] = useState('');
  const [connecting, setConnecting] = useState(false);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 24 },
    inputRow: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginBottom: 16 },
    input: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    scanBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
    scanBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    connectBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    connectBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold, marginBottom: 8 },
    emptyDesc: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', lineHeight: 22 },
    sessionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    sessionIcon: { fontSize: fonts.hero, marginRight: 14 },
    sessionInfo: { flex: 1 },
    sessionName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    sessionUrl: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    sessionChain: { color: t.accent.blue, fontSize: fonts.sm, marginTop: 4 },
    disconnectBtn: { backgroundColor: t.accent.red + '20', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
    disconnectText: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold },
    dappGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
    dappCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, alignItems: 'center', width: '47%' },
    dappIcon: { fontSize: fonts.hero, marginBottom: 8 },
    dappName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    dappType: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    instructions: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 20 },
  }), [t]);

  const POPULAR_DAPPS = [
    { name: 'Uniswap', icon: '🦄', type: 'DEX' },
    { name: 'OpenSea', icon: '🌊', type: 'NFT' },
    { name: 'Aave', icon: '👻', type: 'Lending' },
    { name: 'Lido', icon: '🏔️', type: 'Staking' },
    { name: '1inch', icon: '🐴', type: 'Aggregator' },
    { name: 'Curve', icon: '🔄', type: 'DEX' },
  ];

  const connectDApp = useCallback(async () => {
    const uri = wcUri.trim();
    if (!uri) {
      Alert.alert('Enter URI', 'Paste a WalletConnect URI or scan a QR code.');
      return;
    }

    setConnecting(true);

    // Simulate WalletConnect pairing (real implementation uses @walletconnect/web3wallet)
    setTimeout(() => {
      const newSession: DAppSession = {
        id: `session-${Date.now()}`,
        name: 'DApp',
        url: uri.includes('uniswap') ? 'uniswap.org' : 'app.example.com',
        icon: '🌐',
        chain: 'Ethereum',
        connectedAt: Date.now(),
      };
      setSessions((prev) => [...prev, newSession]);
      setWcUri('');
      setConnecting(false);
      Alert.alert('Connected', `Successfully connected to ${newSession.url}`);
    }, 2000);
  }, [wcUri]);

  const disconnectSession = useCallback((id: string) => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect this dApp?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }},
    ]);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>WalletConnect</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Connect Input */}
        <Text style={s.section}>Connect to dApp</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Paste WalletConnect URI..."
            placeholderTextColor={t.text.muted}
            value={wcUri}
            onChangeText={setWcUri}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={s.scanBtn} onPress={() => Alert.alert('QR Scanner', 'Open the dApp, click "Connect Wallet", and scan the QR code.')}>
            <Text style={s.scanBtnText}>Scan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.connectBtn} onPress={connectDApp} disabled={connecting}>
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.connectBtnText}>Connect</Text>
          )}
        </TouchableOpacity>

        {/* Active Sessions */}
        {sessions.length > 0 && (
          <>
            <Text style={s.section}>Active Sessions ({sessions.length})</Text>
            {sessions.map((session) => (
              <View key={session.id} style={s.sessionCard}>
                <Text style={s.sessionIcon}>{session.icon}</Text>
                <View style={s.sessionInfo}>
                  <Text style={s.sessionName}>{session.name}</Text>
                  <Text style={s.sessionUrl}>{session.url}</Text>
                  <Text style={s.sessionChain}>{session.chain}</Text>
                </View>
                <TouchableOpacity style={s.disconnectBtn} onPress={() => disconnectSession(session.id)}>
                  <Text style={s.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Popular dApps */}
        <Text style={s.section}>Popular dApps</Text>
        <View style={s.dappGrid}>
          {POPULAR_DAPPS.map((dapp) => (
            <TouchableOpacity key={dapp.name} style={s.dappCard} onPress={() => Alert.alert(dapp.name, `Open ${dapp.name} in your browser, then click "Connect Wallet" → "WalletConnect" → scan or paste the URI.`)}>
              <Text style={s.dappIcon}>{dapp.icon}</Text>
              <Text style={s.dappName}>{dapp.name}</Text>
              <Text style={s.dappType}>{dapp.type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {sessions.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔗</Text>
            <Text style={s.emptyTitle}>No Connected dApps</Text>
            <Text style={s.emptyDesc}>
              Connect your wallet to decentralized apps like Uniswap, OpenSea, Aave, and more. Paste a WalletConnect URI above or scan a QR code.
            </Text>
          </View>
        )}

        <Text style={s.instructions}>
          1. Open a dApp in your browser{'\n'}
          2. Click "Connect Wallet" → "WalletConnect"{'\n'}
          3. Copy the URI or scan the QR code{'\n'}
          4. Approve the connection in Open Wallet
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
