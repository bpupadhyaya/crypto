/**
 * What's New Screen — In-app release notes for current version.
 */

import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

const RELEASE_NOTES = [
  { version: '0.3.0-alpha', date: 'March 2026', items: [
    'Bridge screen with IBC cross-chain transfers',
    'Governance: create proposals, vote (one human = one vote)',
    'Milestone Oracle: verify milestones, register as verifier',
    'Contribution Scores: personal score + global leaderboard',
    'Demo balance mode for UI testing without real funds',
    '1inch, Jupiter, Osmosis swap execution',
    'Multi-channel OTK minting (6 denoms)',
    'In-app Privacy Policy',
    'Quick lock button on dashboard',
    '24h price change indicators',
    'Background price service (loads during lock screen)',
    'All 27 screens wired to real chain data',
  ]},
  { version: '0.2.0-alpha', date: 'March 2026', items: [
    'End-to-end BTC/USDT/USDC swaps via THORChain',
    '8 swap options with security ratings',
    'Mandatory paper trading before real money',
    'Wallet recovery verification',
    'Privacy policy with global crypto regulatory clauses',
  ]},
  { version: '0.1.0-alpha', date: 'March 2026', items: [
    'Multi-chain wallet: BTC, ETH, SOL, Cosmos, Open Chain',
    'Real transaction signing (testnet + mainnet)',
    'Open Token (OTK) as native token',
    'Open Chain: Cosmos SDK blockchain',
    'Universal ID, Living Ledger, Gratitude',
    'Dark/light theme, 5 languages',
    '100% open source',
  ]},
];

export function WhatsNewScreen({ onClose }: Props) {
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    versionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    versionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    versionText: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    dateText: { color: t.text.muted, fontSize: 13 },
    item: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 4 },
    externalBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 12, padding: 16, marginTop: 8, alignItems: 'center' },
    externalText: { color: t.accent.blue, fontSize: 14, fontWeight: '600' },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>What's New</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {RELEASE_NOTES.map((release) => (
          <View key={release.version} style={s.versionCard}>
            <View style={s.versionHeader}>
              <Text style={s.versionText}>{release.version}</Text>
              <Text style={s.dateText}>{release.date}</Text>
            </View>
            {release.items.map((item, i) => (
              <Text key={i} style={s.item}>{'\u2022'} {item}</Text>
            ))}
          </View>
        ))}
        <TouchableOpacity style={s.externalBtn} onPress={() => Linking.openURL('https://bpupadhyaya.github.io/release-notes-openwallet.html')}>
          <Text style={s.externalText}>Full Release Notes on Web</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
