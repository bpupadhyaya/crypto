/**
 * Cross-Chain Portfolio Screen — Portfolio view across all 5 chains combined.
 *
 * Shows unified holdings, per-chain breakdowns, and allocation percentages
 * across Bitcoin, Ethereum, Solana, Polygon, and Open Chain.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'overview' | 'chains' | 'allocation';

interface ChainHolding {
  chain: string;
  symbol: string;
  balance: number;
  usdValue: number;
  color: string;
  icon: string;
}

// --- Demo data ---

const CHAIN_HOLDINGS: ChainHolding[] = [
  { chain: 'Bitcoin', symbol: 'BTC', balance: 0.125, usdValue: 8750, color: '#f7931a', icon: '\u20BF' },
  { chain: 'Ethereum', symbol: 'ETH', balance: 3.42, usdValue: 6156, color: '#627eea', icon: '\u039E' },
  { chain: 'Solana', symbol: 'SOL', balance: 85.5, usdValue: 3420, color: '#9945ff', icon: '\u25CE' },
  { chain: 'Polygon', symbol: 'MATIC', balance: 4200, usdValue: 2520, color: '#8247e5', icon: '\u2B23' },
  { chain: 'Open Chain', symbol: 'OTK', balance: 15000, usdValue: 0, color: '#00d4aa', icon: '\u25C7' },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function CrossChainPortfolioScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('overview');

  const totalUsd = useMemo(() => CHAIN_HOLDINGS.reduce((s, h) => s + h.usdValue, 0), []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'chains', label: 'Chains' },
    { key: 'allocation', label: 'Allocation' },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    totalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
    totalLabel: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    totalValue: { color: t.text.primary, fontSize: 36, fontWeight: '800' },
    totalChains: { color: t.text.secondary, fontSize: 13, marginTop: 8 },
    chainCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4 },
    chainIcon: { fontSize: 28, marginRight: 14, width: 36, textAlign: 'center' },
    chainInfo: { flex: 1 },
    chainName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    chainBalance: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    chainUsd: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    chainPercent: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'right' },
    allocCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    allocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    allocBar: { height: 10, borderRadius: 5, marginLeft: 8, flex: 1 },
    allocLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600', width: 80 },
    allocPercent: { color: t.text.primary, fontSize: 12, fontWeight: '700', width: 44, textAlign: 'right' },
    barBg: { height: 10, borderRadius: 5, backgroundColor: t.border, flex: 1, marginHorizontal: 8, overflow: 'hidden' },
    barFill: { height: 10, borderRadius: 5 },
    noteCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginTop: 8 },
    noteText: { color: t.text.muted, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.purple + '30', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
  }), [t]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Cross-Chain Portfolio</Text>
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
        <View style={st.demoTag}><Text style={st.demoTagText}>DEMO MODE</Text></View>

        {tab === 'overview' && (
          <>
            <View style={st.totalCard}>
              <Text style={st.totalLabel}>Total Portfolio Value</Text>
              <Text style={st.totalValue}>${totalUsd.toLocaleString()}</Text>
              <Text style={st.totalChains}>{CHAIN_HOLDINGS.length} chains connected</Text>
            </View>
            <Text style={st.section}>Holdings</Text>
            {CHAIN_HOLDINGS.map(h => (
              <View key={h.chain} style={[st.chainCard, { borderLeftColor: h.color }]}>
                <Text style={st.chainIcon}>{h.icon}</Text>
                <View style={st.chainInfo}>
                  <Text style={st.chainName}>{h.chain}</Text>
                  <Text style={st.chainBalance}>{h.balance.toLocaleString()} {h.symbol}</Text>
                </View>
                <View>
                  <Text style={st.chainUsd}>{h.usdValue > 0 ? `$${h.usdValue.toLocaleString()}` : 'N/A'}</Text>
                  <Text style={st.chainPercent}>{totalUsd > 0 ? ((h.usdValue / totalUsd) * 100).toFixed(1) : '0.0'}%</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'chains' && (
          <>
            <Text style={st.section}>Chain Details</Text>
            {CHAIN_HOLDINGS.map(h => (
              <View key={h.chain} style={st.allocCard}>
                <Text style={[st.chainName, { marginBottom: 8 }]}>{h.icon} {h.chain}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: t.text.muted, fontSize: 12 }}>Balance</Text>
                  <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>{h.balance.toLocaleString()} {h.symbol}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: t.text.muted, fontSize: 12 }}>USD Value</Text>
                  <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>{h.usdValue > 0 ? `$${h.usdValue.toLocaleString()}` : 'Non-monetary'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.text.muted, fontSize: 12 }}>Status</Text>
                  <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: '600' }}>Connected</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'allocation' && (
          <>
            <Text style={st.section}>Allocation Breakdown</Text>
            <View style={st.allocCard}>
              {CHAIN_HOLDINGS.filter(h => h.usdValue > 0).map(h => {
                const pct = totalUsd > 0 ? (h.usdValue / totalUsd) * 100 : 0;
                return (
                  <View key={h.chain} style={st.allocRow}>
                    <Text style={st.allocLabel}>{h.symbol}</Text>
                    <View style={st.barBg}>
                      <View style={[st.barFill, { width: `${pct}%`, backgroundColor: h.color }]} />
                    </View>
                    <Text style={st.allocPercent}>{pct.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
            <View style={st.noteCard}>
              <Text style={st.noteText}>
                OTK tokens on Open Chain carry non-monetary human value and are excluded from USD allocation percentages.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
