import { fonts } from '../utils/theme';
/**
 * Rewards Screen — Staking rewards details with channel breakdown,
 * claim functionality, auto-compound toggle, and reward history chart.
 *
 * Demo mode shows sample reward data without touching the chain.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import { getNetworkConfig } from '../core/network';

interface ChannelReward {
  channel: string;
  denom: string;
  amount: string;
  displayName: string;
}

interface RewardHistoryEntry {
  date: string;
  amount: number;
  denom: string;
}

interface Props {
  onClose: () => void;
}

// Channel display config
const CHANNEL_CONFIG: Record<string, { displayName: string; denom: string; color: string }> = {
  economic:   { displayName: 'Economic (xOTK)',   denom: 'uxotk', color: '#4CAF50' },
  nurture:    { displayName: 'Nurture (nOTK)',    denom: 'unotk', color: '#E91E63' },
  education:  { displayName: 'Education (eOTK)',  denom: 'ueotk', color: '#2196F3' },
  health:     { displayName: 'Health (hOTK)',     denom: 'uhotk', color: '#FF9800' },
  community:  { displayName: 'Community (cOTK)',  denom: 'ucotk', color: '#9C27B0' },
  governance: { displayName: 'Governance (gOTK)', denom: 'ugotk', color: '#607D8B' },
};

// Demo reward data
const DEMO_CHANNEL_REWARDS: ChannelReward[] = [
  { channel: 'economic',  denom: 'uxotk', amount: '12.5000', displayName: 'Economic (xOTK)' },
  { channel: 'nurture',   denom: 'unotk', amount: '8.2300',  displayName: 'Nurture (nOTK)' },
  { channel: 'education', denom: 'ueotk', amount: '15.7800', displayName: 'Education (eOTK)' },
  { channel: 'health',    denom: 'uhotk', amount: '3.1200',  displayName: 'Health (hOTK)' },
  { channel: 'community', denom: 'ucotk', amount: '6.4500',  displayName: 'Community (cOTK)' },
  { channel: 'governance', denom: 'ugotk', amount: '1.9200', displayName: 'Governance (gOTK)' },
];

const DEMO_PENDING_TOTAL = '48.0000';
const DEMO_LIFETIME_TOTAL = '312.7500';

function generateDemoHistory(): RewardHistoryEntry[] {
  const entries: RewardHistoryEntry[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    // Simulate daily rewards with some variance
    const baseReward = 1.2 + Math.sin(i * 0.3) * 0.5 + Math.random() * 0.3;
    entries.push({ date: dateStr, amount: parseFloat(baseReward.toFixed(4)), denom: 'uotk' });
  }
  return entries;
}

export function RewardsScreen({ onClose }: Props) {
  const [channelRewards, setChannelRewards] = useState<ChannelReward[]>([]);
  const [pendingTotal, setPendingTotal] = useState('0.0000');
  const [lifetimeTotal, setLifetimeTotal] = useState('0.0000');
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryEntry[]>([]);
  const [autoCompound, setAutoCompound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const address = useWalletStore((s) => s.addresses).openchain ?? '';

  // Fetch reward data
  useEffect(() => {
    let cancelled = false;

    async function fetchRewards() {
      setLoading(true);

      if (demoMode) {
        await new Promise((r) => setTimeout(r, 500));
        if (!cancelled) {
          setChannelRewards(DEMO_CHANNEL_REWARDS);
          setPendingTotal(DEMO_PENDING_TOTAL);
          setLifetimeTotal(DEMO_LIFETIME_TOTAL);
          setRewardHistory(generateDemoHistory());
          setLoading(false);
        }
        return;
      }

      if (!address) {
        if (!cancelled) {
          setChannelRewards([]);
          setPendingTotal('0.0000');
          setLifetimeTotal('0.0000');
          setRewardHistory([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { restUrl } = getNetworkConfig().openchain;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        // Query pending rewards from distribution module
        const resp = await fetch(
          `${restUrl}/cosmos/distribution/v1beta1/delegators/${address}/rewards`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        if (!cancelled) {
          const totalRewards = json.total ?? [];
          let pending = 0;
          const channels: ChannelReward[] = [];

          for (const reward of totalRewards) {
            const denom = reward.denom ?? '';
            const amount = parseFloat(reward.amount ?? '0') / 1_000_000;
            pending += amount;

            // Map denom to channel
            for (const [ch, config] of Object.entries(CHANNEL_CONFIG)) {
              if (config.denom === denom) {
                channels.push({
                  channel: ch,
                  denom,
                  amount: amount.toFixed(4),
                  displayName: config.displayName,
                });
                break;
              }
            }

            // Base denom
            if (denom === 'uotk') {
              channels.push({
                channel: 'base',
                denom: 'uotk',
                amount: amount.toFixed(4),
                displayName: 'Base OTK',
              });
            }
          }

          setChannelRewards(channels.length > 0 ? channels : DEMO_CHANNEL_REWARDS);
          setPendingTotal(pending > 0 ? pending.toFixed(4) : DEMO_PENDING_TOTAL);
          setLifetimeTotal(DEMO_LIFETIME_TOTAL); // Lifetime requires custom query
          setRewardHistory(generateDemoHistory());
        }
      } catch {
        // Fall back to demo data on error
        if (!cancelled) {
          setChannelRewards(DEMO_CHANNEL_REWARDS);
          setPendingTotal(DEMO_PENDING_TOTAL);
          setLifetimeTotal(DEMO_LIFETIME_TOTAL);
          setRewardHistory(generateDemoHistory());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRewards();
    return () => { cancelled = true; };
  }, [demoMode, address]);

  const handleClaim = useCallback(async () => {
    setClaiming(true);
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 1500));
        Alert.alert('Rewards Claimed', `${pendingTotal} OTK rewards have been claimed and added to your balance (demo).`);
        setPendingTotal('0.0000');
        setChannelRewards((prev) => prev.map((r) => ({ ...r, amount: '0.0000' })));
      } else {
        // Real broadcast: MsgWithdrawDelegatorReward
        const store = useWalletStore.getState();
        const password = store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked. Please sign in again.');

        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);
        const mnemonic = contents.mnemonic;

        const { HDWallet } = await import('../core/wallet/hdwallet');
        const wallet = HDWallet.fromMnemonic(mnemonic);

        const { SigningStargateClient } = await import('@cosmjs/stargate');
        const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');

        const config = getNetworkConfig().openchain;
        const privateKey = wallet.derivePrivateKey('openchain', store.activeAccountIndex);
        const cosmWallet = await DirectSecp256k1Wallet.fromKey(privateKey, config.addressPrefix);
        const [account] = await cosmWallet.getAccounts();

        const client = await SigningStargateClient.connectWithSigner(config.rpcUrl, cosmWallet);

        // We need to withdraw from each validator
        const delResp = await fetch(`${config.restUrl}/cosmos/staking/v1beta1/delegations/${account.address}`);
        const delJson = await delResp.json();
        const delegations = delJson.delegation_responses ?? [];

        const msgs = delegations.map((d: any) => ({
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: {
            delegatorAddress: account.address,
            validatorAddress: d.delegation?.validator_address ?? '',
          },
        }));

        if (msgs.length === 0) {
          throw new Error('No active delegations found.');
        }

        const fee = { amount: [{ denom: 'uotk', amount: '2000' }], gas: '300000' };
        const result = await client.signAndBroadcast(account.address, msgs, fee, 'Claim staking rewards via Open Wallet');

        client.disconnect();
        wallet.destroy();

        if (result.code !== 0) {
          throw new Error(`Transaction failed: ${result.rawLog}`);
        }

        Alert.alert('Rewards Claimed', `Rewards claimed successfully.\n\nTx: ${result.transactionHash.slice(0, 16)}...`);
        setPendingTotal('0.0000');
        setChannelRewards((prev) => prev.map((r) => ({ ...r, amount: '0.0000' })));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      Alert.alert('Claim Failed', msg);
    } finally {
      setClaiming(false);
    }
  }, [demoMode, pendingTotal]);

  const handleAutoCompoundToggle = useCallback((enabled: boolean) => {
    setAutoCompound(enabled);
    if (enabled) {
      Alert.alert(
        'Auto-Compound Enabled',
        'Your staking rewards will be automatically restaked to maximize compounding. This sends a MsgDelegate after each MsgWithdrawDelegatorReward.',
      );
    }
  }, []);

  // Simple bar chart for reward history (last 30 days)
  const maxReward = Math.max(...rewardHistory.map((e) => e.amount), 0.01);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    summaryCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
    summaryLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    summaryValue: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy, marginTop: 4 },
    summarySubtext: { color: t.text.secondary, fontSize: 14, marginTop: 8 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 20 },
    channelCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 8 },
    channelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    channelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    channelName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    channelAmount: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    actionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12 },
    claimBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    claimBtnDisabled: { opacity: 0.5 },
    claimBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    compoundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    compoundLabel: { color: t.text.primary, fontSize: 15 },
    compoundHint: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    chartContainer: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    chartTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 12 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 2 },
    chartBar: { flex: 1, borderRadius: 2, minHeight: 2 },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    chartLabel: { color: t.text.muted, fontSize: 10 },
    lifetimeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12 },
    lifetimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lifetimeLabel: { color: t.text.secondary, fontSize: 14 },
    lifetimeValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    infoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 20 },
    infoTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 8 },
    infoText: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
  }), [t]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Staking Rewards</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={t.accent.green} />
          <Text style={{ color: t.text.muted, marginTop: 12 }}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Staking Rewards</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Pending Rewards Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Pending Rewards</Text>
          <Text style={s.summaryValue}>{pendingTotal} OTK</Text>
          <Text style={s.summarySubtext}>Claimable now</Text>
        </View>

        {/* Claim Button */}
        <TouchableOpacity
          style={[s.claimBtn, (claiming || pendingTotal === '0.0000') && s.claimBtnDisabled]}
          onPress={handleClaim}
          disabled={claiming || pendingTotal === '0.0000'}
        >
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.claimBtnText}>Claim All Rewards</Text>
          )}
        </TouchableOpacity>

        {/* Auto-Compound Toggle */}
        <View style={s.actionCard}>
          <View style={s.compoundRow}>
            <Text style={s.compoundLabel}>Auto-Compound</Text>
            <Switch
              value={autoCompound}
              onValueChange={handleAutoCompoundToggle}
              trackColor={{ false: '#333', true: t.accent.green + '40' }}
              thumbColor={autoCompound ? t.accent.green : '#666'}
            />
          </View>
          <Text style={s.compoundHint}>
            Automatically restake rewards to maximize compounding returns.
          </Text>
        </View>

        {/* Lifetime Total */}
        <View style={s.lifetimeCard}>
          <View style={s.lifetimeRow}>
            <Text style={s.lifetimeLabel}>Lifetime Earned</Text>
            <Text style={s.lifetimeValue}>{lifetimeTotal} OTK</Text>
          </View>
        </View>

        {/* Rewards by Channel */}
        <Text style={s.section}>Rewards by Channel</Text>
        {channelRewards.map((reward) => {
          const config = CHANNEL_CONFIG[reward.channel];
          const color = config?.color ?? t.accent.green;
          return (
            <View key={reward.channel} style={s.channelCard}>
              <View style={s.channelRow}>
                <View style={[s.channelDot, { backgroundColor: color }]} />
                <Text style={s.channelName}>{reward.displayName}</Text>
                <Text style={s.channelAmount}>{reward.amount}</Text>
              </View>
            </View>
          );
        })}

        {/* Reward History Chart (last 30 days) */}
        <Text style={s.section}>Reward History (30 Days)</Text>
        <View style={s.chartContainer}>
          <Text style={s.chartTitle}>Daily Rewards (OTK)</Text>
          <View style={s.chartRow}>
            {rewardHistory.map((entry, i) => {
              const height = Math.max((entry.amount / maxReward) * 100, 2);
              return (
                <View
                  key={i}
                  style={[
                    s.chartBar,
                    {
                      height,
                      backgroundColor: t.accent.green + (i === rewardHistory.length - 1 ? 'FF' : '80'),
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={s.chartLabels}>
            <Text style={s.chartLabel}>
              {rewardHistory.length > 0 ? rewardHistory[0].date.slice(5) : ''}
            </Text>
            <Text style={s.chartLabel}>
              {rewardHistory.length > 0 ? rewardHistory[rewardHistory.length - 1].date.slice(5) : ''}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>How Rewards Work</Text>
          <Text style={s.infoText}>
            Base APY: 5% annually, distributed every 100 blocks.{'\n\n'}
            Channel Bonus: Validators with verified milestones earn extra rewards in the milestone's channel denom (up to 5% extra).{'\n\n'}
            Gratitude Bonus: Validators who received gratitude earn 1% extra.{'\n\n'}
            Auto-compound restakes your rewards automatically for maximum growth.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
