import { fonts } from '../utils/theme';
/**
 * DeFi Dashboard — All positions at a glance.
 *
 * Shows staking positions, governance participation, contribution score,
 * and Living Ledger summary in one screen.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';
import { getPrices } from '../core/priceService';

interface Props {
  onClose: () => void;
}

interface StakingPosition {
  validator: string;
  amount: number;
  rewards: number;
}

const DEMO_DATA = {
  staked: [
    { validator: 'Open Chain Validator 1', amount: 500, rewards: 12.5 },
    { validator: 'Community Validator', amount: 200, rewards: 4.8 },
  ],
  contributionScore: 4850,
  contributionRank: 8,
  activeProposals: 3,
  votedProposals: 7,
  gratitudeSent: 15,
  gratitudeReceived: 42,
  totalStakedUsd: 7.0, // 700 OTK * $0.01
  totalRewardsUsd: 0.173,
};

export function DeFiScreen({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(DEMO_DATA);
  const demoMode = useWalletStore((s) => s.demoMode);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    cardTitle: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    statLabel: { color: t.text.muted, fontSize: 14 },
    statValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    statValueGreen: { color: t.accent.green, fontSize: 14, fontWeight: fonts.semibold },
    bigStat: { alignItems: 'center', paddingVertical: 12 },
    bigNumber: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy },
    bigLabel: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 10 },
    stakingRow: { marginBottom: 8 },
    validatorName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    stakingDetail: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  }), [t]);

  useEffect(() => {
    if (demoMode) {
      setData(DEMO_DATA);
      setLoading(false);
      return;
    }
    // Fetch real data
    const fetchData = async () => {
      try {
        const restUrl = getNetworkConfig().openchain.restUrl;
        const address = addresses.openchain;
        if (!address) { setLoading(false); return; }

        const [stakingRes, scoreRes] = await Promise.allSettled([
          fetch(`${restUrl}/cosmos/staking/v1beta1/delegations/${address}`).then(r => r.json()),
          fetch(`${restUrl}/openchain/otk/v1/contribution_score/${address}`).then(r => r.json()),
        ]);

        const staked: StakingPosition[] = [];
        if (stakingRes.status === 'fulfilled' && stakingRes.value.delegation_responses) {
          for (const d of stakingRes.value.delegation_responses) {
            staked.push({
              validator: d.delegation.validator_address.slice(0, 20) + '...',
              amount: parseInt(d.balance.amount) / 1_000_000,
              rewards: 0,
            });
          }
        }

        const score = scoreRes.status === 'fulfilled' ? scoreRes.value.score ?? 0 : 0;
        const rank = scoreRes.status === 'fulfilled' ? scoreRes.value.rank ?? 0 : 0;

        setData({
          ...DEMO_DATA,
          staked,
          contributionScore: score,
          contributionRank: rank,
        });
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [demoMode, addresses]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}><Text style={s.title}>DeFi Dashboard</Text><TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={t.accent.green} size="large" /></View>
      </SafeAreaView>
    );
  }

  const totalStaked = data.staked.reduce((s, p) => s + p.amount, 0);
  const totalRewards = data.staked.reduce((s, p) => s + p.rewards, 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>DeFi Dashboard</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Contribution Score */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contribution Score</Text>
          <View style={s.bigStat}>
            <Text style={s.bigNumber}>{data.contributionScore.toLocaleString()}</Text>
            <Text style={s.bigLabel}>Global Rank #{data.contributionRank}</Text>
          </View>
        </View>

        {/* Staking */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Staking</Text>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total Staked</Text>
            <Text style={s.statValue}>{totalStaked.toFixed(2)} OTK</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Pending Rewards</Text>
            <Text style={s.statValueGreen}>+{totalRewards.toFixed(2)} OTK</Text>
          </View>
          <View style={s.divider} />
          {data.staked.length === 0 ? (
            <Text style={s.emptyText}>No staking positions</Text>
          ) : (
            data.staked.map((pos, i) => (
              <View key={i} style={s.stakingRow}>
                <Text style={s.validatorName}>{pos.validator}</Text>
                <Text style={s.stakingDetail}>{pos.amount.toFixed(2)} OTK staked  |  +{pos.rewards.toFixed(2)} rewards</Text>
              </View>
            ))
          )}
        </View>

        {/* Governance */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Governance</Text>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Active Proposals</Text>
            <Text style={s.statValue}>{data.activeProposals}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Proposals Voted</Text>
            <Text style={s.statValue}>{data.votedProposals}</Text>
          </View>
        </View>

        {/* Gratitude */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Gratitude</Text>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Gratitude Sent</Text>
            <Text style={s.statValue}>{data.gratitudeSent}</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Gratitude Received</Text>
            <Text style={s.statValueGreen}>{data.gratitudeReceived}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
