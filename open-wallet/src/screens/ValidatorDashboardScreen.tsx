import { fonts } from '../utils/theme';
/**
 * Validator Dashboard — for users running a validator node.
 *
 * Shows validator-specific information when the phone is
 * running as a P2P validator node on Open Chain.
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

interface ValidatorStats {
  moniker: string;
  address: string;
  votingPower: number;
  commission: number;
  delegators: number;
  totalDelegated: number;
  selfDelegated: number;
  blocksProposed: number;
  uptime: number;
  jailed: boolean;
  missedBlocks: number;
  rewards: number;
}

const DEMO_STATS: ValidatorStats = {
  moniker: 'Open Chain Validator (Your Phone)',
  address: 'openchainvaloper1abc...xyz',
  votingPower: 10,
  commission: 5,
  delegators: 47,
  totalDelegated: 125000,
  selfDelegated: 10000,
  blocksProposed: 1234,
  uptime: 99.7,
  jailed: false,
  missedBlocks: 3,
  rewards: 4500,
};

export function ValidatorDashboardScreen({ onClose }: Props) {
  const [stats, setStats] = useState<ValidatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    statusCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16 },
    statusIcon: { fontSize: 48, marginBottom: 8 },
    statusText: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    statusSub: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 12 },
    cardTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    label: { color: t.text.muted, fontSize: fonts.md },
    value: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    valueGreen: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.semibold },
    valueRed: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.semibold },
    uptimeBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 4, marginBottom: 8 },
    uptimeFill: { height: 8, borderRadius: 4 },
  }), [t]);

  useEffect(() => {
    if (demoMode) {
      setStats(DEMO_STATS);
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const restUrl = getNetworkConfig().openchain.restUrl;
        const address = addresses.openchain;
        if (!address) { setLoading(false); return; }
        const res = await fetch(`${restUrl}/cosmos/staking/v1beta1/validators/${address}`);
        if (res.ok) {
          const data = await res.json();
          const v = data.validator;
          setStats({
            moniker: v?.description?.moniker ?? 'Validator',
            address: address,
            votingPower: parseInt(v?.tokens ?? '0') / 1_000_000,
            commission: parseFloat(v?.commission?.commission_rates?.rate ?? '0') * 100,
            delegators: 0,
            totalDelegated: parseInt(v?.tokens ?? '0') / 1_000_000,
            selfDelegated: 0,
            blocksProposed: 0,
            uptime: 100,
            jailed: v?.jailed ?? false,
            missedBlocks: 0,
            rewards: 0,
          });
        }
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, [demoMode, addresses]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.title}>Validator Dashboard</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={t.accent.green} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.title}>Validator Dashboard</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ color: t.text.muted, fontSize: fonts.lg, textAlign: 'center' }}>Not running as a validator. Start your P2P node first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const uptimeColor = stats.uptime >= 99 ? t.accent.green : stats.uptime >= 95 ? t.accent.yellow : t.accent.red;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Validator Dashboard</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Status */}
        <View style={[s.statusCard, { backgroundColor: stats.jailed ? t.accent.red + '15' : t.accent.green + '15' }]}>
          <Text style={s.statusIcon}>{stats.jailed ? '\u26D4' : '\u2705'}</Text>
          <Text style={[s.statusText, { color: stats.jailed ? t.accent.red : t.accent.green }]}>
            {stats.jailed ? 'JAILED' : 'ACTIVE'}
          </Text>
          <Text style={s.statusSub}>{stats.moniker}</Text>
        </View>

        {/* Performance */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Performance</Text>
          <View style={s.row}>
            <Text style={s.label}>Uptime</Text>
            <Text style={[s.value, { color: uptimeColor }]}>{stats.uptime.toFixed(1)}%</Text>
          </View>
          <View style={s.uptimeBar}>
            <View style={[s.uptimeFill, { width: `${stats.uptime}%`, backgroundColor: uptimeColor }]} />
          </View>
          <View style={s.row}>
            <Text style={s.label}>Blocks Proposed</Text>
            <Text style={s.value}>{stats.blocksProposed.toLocaleString()}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Missed Blocks</Text>
            <Text style={stats.missedBlocks > 10 ? s.valueRed : s.value}>{stats.missedBlocks}</Text>
          </View>
        </View>

        {/* Delegation */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Delegation</Text>
          <View style={s.row}>
            <Text style={s.label}>Voting Power</Text>
            <Text style={s.value}>{stats.votingPower.toLocaleString()} OTK</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Total Delegated</Text>
            <Text style={s.value}>{stats.totalDelegated.toLocaleString()} OTK</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Self-Delegated</Text>
            <Text style={s.value}>{stats.selfDelegated.toLocaleString()} OTK</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Delegators</Text>
            <Text style={s.value}>{stats.delegators}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Commission</Text>
            <Text style={s.value}>{stats.commission}%</Text>
          </View>
        </View>

        {/* Rewards */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Rewards</Text>
          <View style={s.row}>
            <Text style={s.label}>Pending Commission Rewards</Text>
            <Text style={s.valueGreen}>{stats.rewards.toLocaleString()} OTK</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
