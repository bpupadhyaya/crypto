import { fonts } from '../utils/theme';
/**
 * Roadmap Screen — Open Chain/Wallet development roadmap and milestones.
 *
 * Shows current, upcoming, and completed development milestones
 * for the Open Wallet, Open Chain, and Open Token projects.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'current' | 'upcoming' | 'completed';

interface Milestone {
  id: string;
  title: string;
  description: string;
  project: 'wallet' | 'chain' | 'token';
  target: string;
  progress: number; // 0-100
}

// --- Demo data ---

const PROJECT_ICON: Record<string, string> = { wallet: '\u{1F4B0}', chain: '\u26D3\uFE0F', token: '\u{1FA99}' };
const PROJECT_LABEL: Record<string, string> = { wallet: 'Open Wallet', chain: 'Open Chain', token: 'Open Token' };

const CURRENT: Milestone[] = [
  { id: 'c1', title: 'Atomic Swap Engine', description: 'Built-in trustless cross-chain atomic swaps as always-available fallback.', project: 'wallet', target: 'Q1 2026', progress: 85 },
  { id: 'c2', title: 'Multi-Channel Minting', description: 'OTK minting across nurture, education, health, community, governance, and economic channels.', project: 'token', target: 'Q1 2026', progress: 70 },
  { id: 'c3', title: 'Light Validator Node', description: 'Mobile-first light validator for P2P network participation.', project: 'chain', target: 'Q1 2026', progress: 60 },
  { id: 'c4', title: 'Protobuf Wire Format', description: 'Binary serialization for efficient P2P message exchange between validators.', project: 'chain', target: 'Q1 2026', progress: 45 },
  { id: 'c5', title: 'Bridge Protocol', description: 'Cross-chain bridge for secure asset transfers between supported networks.', project: 'wallet', target: 'Q1 2026', progress: 35 },
];

const UPCOMING: Milestone[] = [
  { id: 'u1', title: 'Hardware Wallet Integration', description: 'Support for Solana Saga seed vault and external hardware signers.', project: 'wallet', target: 'Q2 2026', progress: 0 },
  { id: 'u2', title: 'Governance Module', description: 'On-chain proposal creation, voting, and execution framework.', project: 'chain', target: 'Q2 2026', progress: 0 },
  { id: 'u3', title: 'Universal ID System', description: 'One human = one identity, biometric-verified on-chain identity.', project: 'chain', target: 'Q3 2026', progress: 0 },
  { id: 'u4', title: 'DEX Order Book', description: 'Fully decentralized order book exchange within the wallet.', project: 'wallet', target: 'Q3 2026', progress: 0 },
  { id: 'u5', title: 'Full P2P Network', description: '100% peer-to-peer operation with no server dependency.', project: 'chain', target: 'Q4 2026', progress: 0 },
];

const COMPLETED: Milestone[] = [
  { id: 'd1', title: 'Multi-Chain Wallet', description: 'Support for Bitcoin, Ethereum, Solana, Polygon, and Open Chain.', project: 'wallet', target: 'Q4 2025', progress: 100 },
  { id: 'd2', title: 'PQC Encryption', description: 'Post-quantum cryptography for transaction signing and key storage.', project: 'wallet', target: 'Q4 2025', progress: 100 },
  { id: 'd3', title: 'PoH + PoC Consensus', description: 'Proof of Humanity plus Proof of Contribution consensus design.', project: 'chain', target: 'Q4 2025', progress: 100 },
  { id: 'd4', title: 'Nurture Value Tracking', description: 'nOTK tracking for quantifying human nurture contributions.', project: 'token', target: 'Q1 2026', progress: 100 },
  { id: 'd5', title: 'Paper Trading Safety', description: 'Mandatory paper trading practice before real money transactions.', project: 'wallet', target: 'Q4 2025', progress: 100 },
  { id: 'd6', title: 'Achievement System', description: 'Soulbound milestone achievement NFTs bound to Universal ID.', project: 'chain', target: 'Q1 2026', progress: 100 },
  { id: 'd7', title: 'Peace Index Dashboard', description: 'Global and personal peace index visualization and tracking.', project: 'chain', target: 'Q1 2026', progress: 100 },
  { id: 'd8', title: 'Basic Needs Assessment', description: 'Needs tracking, resource matching, and basic needs dashboard.', project: 'chain', target: 'Q1 2026', progress: 100 },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function RoadmapScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('current');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'current', label: 'Current' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ];

  const data = tab === 'current' ? CURRENT : tab === 'upcoming' ? UPCOMING : COMPLETED;

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    cardTarget: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    cardDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 19, marginBottom: 10 },
    projectBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    projectText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginLeft: 4 },
    progressBg: { height: 6, borderRadius: 3, backgroundColor: t.border, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    progressLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'right' },
    summaryCard: {
      backgroundColor: t.bg.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryBox: { alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
  }), [t]);

  const projectColor = (p: string) => p === 'wallet' ? t.accent.blue : p === 'chain' ? t.accent.green : t.accent.purple;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Roadmap</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => setTab(tb.key)}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <View style={st.summaryCard}>
          <View style={st.summaryRow}>
            <View style={st.summaryBox}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{CURRENT.length}</Text>
              <Text style={st.summaryLabel}>In Progress</Text>
            </View>
            <View style={st.summaryBox}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{UPCOMING.length}</Text>
              <Text style={st.summaryLabel}>Upcoming</Text>
            </View>
            <View style={st.summaryBox}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{COMPLETED.length}</Text>
              <Text style={st.summaryLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <Text style={st.section}>{tab === 'current' ? 'In Progress' : tab === 'upcoming' ? 'Planned' : 'Done'}</Text>
        {data.map(item => (
          <View key={item.id} style={[st.card, { borderLeftColor: projectColor(item.project) }]}>
            <View style={st.projectBadge}>
              <Text style={{ fontSize: fonts.md }}>{PROJECT_ICON[item.project]}</Text>
              <Text style={st.projectText}>{PROJECT_LABEL[item.project]}</Text>
            </View>
            <View style={st.cardHeader}>
              <Text style={st.cardTitle}>{item.title}</Text>
              <Text style={st.cardTarget}>{item.target}</Text>
            </View>
            <Text style={st.cardDesc}>{item.description}</Text>
            <View style={st.progressBg}>
              <View style={[st.progressFill, { width: `${item.progress}%`, backgroundColor: projectColor(item.project) }]} />
            </View>
            <Text style={st.progressLabel}>{item.progress}%</Text>
          </View>
        ))}
        {/* Vision note */}
        {tab === 'upcoming' && (
          <View style={{ backgroundColor: t.accent.green + '15', borderRadius: 14, padding: 16, marginTop: 8 }}>
            <Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 4 }}>
              Our Vision
            </Text>
            <Text style={{ color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 }}>
              Open Chain models all human value transfer. Raising children, education, community building — quantified and rewarded. World peace through better upbringing.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
