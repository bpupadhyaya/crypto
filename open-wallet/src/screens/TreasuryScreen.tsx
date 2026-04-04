import { fonts } from '../utils/theme';
/**
 * Treasury Screen — Community fund overview.
 *
 * Shows the Open Chain community treasury funded by
 * 2% of all OTK minting. Distributed via governance proposals.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';

interface Props {
  onClose: () => void;
}

interface TreasuryData {
  totalBalance: number;
  totalCollected: number;
  totalDistributed: number;
  balanceByDenom: Record<string, number>;
  recentDistributions: Array<{ recipient: string; amount: number; denom: string; proposal: string; date: string }>;
}

const DEMO_DATA: TreasuryData = {
  totalBalance: 45000000000,
  totalCollected: 78000000000,
  totalDistributed: 33000000000,
  balanceByDenom: {
    uotk: 20000000000,
    unotk: 8000000000,
    ueotk: 7000000000,
    uhotk: 5000000000,
    ucotk: 3000000000,
    ugotk: 2000000000,
  },
  recentDistributions: [
    { recipient: 'openchain1abc...dev', amount: 5000000000, denom: 'uotk', proposal: 'Prop #12', date: 'Mar 25' },
    { recipient: 'openchain1def...infra', amount: 3000000000, denom: 'uotk', proposal: 'Prop #10', date: 'Mar 20' },
    { recipient: 'openchain1ghi...grant', amount: 2000000000, denom: 'ueotk', proposal: 'Prop #8', date: 'Mar 15' },
  ],
};

const DENOM_LABELS: Record<string, string> = {
  uotk: 'OTK', unotk: 'nOTK', ueotk: 'eOTK', uhotk: 'hOTK', ucotk: 'cOTK', ugotk: 'gOTK',
};

const DENOM_COLORS: Record<string, string> = {
  uotk: '#00c853', unotk: '#ff9800', ueotk: '#2196f3', uhotk: '#e91e63', ucotk: '#9c27b0', ugotk: '#607d8b',
};

export function TreasuryScreen({ onClose }: Props) {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 20 },
    heroLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    heroValue: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy, marginTop: 4 },
    heroSub: { color: t.text.muted, fontSize: 12, marginTop: 8, textAlign: 'center', lineHeight: 18 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 16, padding: 16, alignItems: 'center' },
    statLabel: { color: t.text.muted, fontSize: 11 },
    statValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 4 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },
    channelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    channelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    channelName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    channelAmount: { color: t.text.secondary, fontSize: 14 },
    bar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 4, marginBottom: 12 },
    barFill: { height: 6, borderRadius: 3 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    distRow: { marginBottom: 12 },
    distProposal: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    distDetail: { color: t.text.muted, fontSize: 12, marginTop: 2 },
  }), [t]);

  useEffect(() => {
    if (demoMode) { setData(DEMO_DATA); setLoading(false); return; }
    const fetchData = async () => {
      try {
        const restUrl = getNetworkConfig().openchain.restUrl;
        const res = await fetch(`${restUrl}/openchain/otk/v1/treasury`);
        if (res.ok) { setData(await res.json()); }
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [demoMode]);

  if (loading || !data) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.title}>Community Treasury</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={t.accent.green} size="large" /></View>
      </SafeAreaView>
    );
  }

  const totalOTK = data.totalBalance / 1_000_000;
  const collectedOTK = data.totalCollected / 1_000_000;
  const distributedOTK = data.totalDistributed / 1_000_000;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Community Treasury</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Treasury Balance</Text>
          <Text style={s.heroValue}>{totalOTK.toLocaleString()} OTK</Text>
          <Text style={s.heroSub}>Funded by 2% of all OTK minting. Distributed via one-human-one-vote governance proposals.</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Collected</Text>
            <Text style={s.statValue}>{collectedOTK.toLocaleString()}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Distributed</Text>
            <Text style={s.statValue}>{distributedOTK.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={s.section}>Balance by Channel</Text>
        <View style={s.card}>
          {Object.entries(data.balanceByDenom).map(([denom, amount]) => {
            const pct = data.totalBalance > 0 ? (amount / data.totalBalance) * 100 : 0;
            return (
              <View key={denom}>
                <View style={s.channelRow}>
                  <View style={[s.channelDot, { backgroundColor: DENOM_COLORS[denom] ?? t.text.muted }]} />
                  <Text style={s.channelName}>{DENOM_LABELS[denom] ?? denom}</Text>
                  <Text style={s.channelAmount}>{(amount / 1_000_000).toLocaleString()}</Text>
                </View>
                <View style={s.bar}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: DENOM_COLORS[denom] ?? t.text.muted }]} />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={s.section}>Recent Distributions</Text>
        <View style={s.card}>
          {data.recentDistributions.map((d, i) => (
            <View key={i} style={s.distRow}>
              <Text style={s.distProposal}>{d.proposal}</Text>
              <Text style={s.distDetail}>{(d.amount / 1_000_000).toLocaleString()} {DENOM_LABELS[d.denom] ?? d.denom} to {d.recipient} ({d.date})</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
