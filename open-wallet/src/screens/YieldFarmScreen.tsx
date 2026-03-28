/**
 * Yield Farm Screen — Stake LP tokens to earn extra OTK rewards.
 *
 * View farms, stake/unstake LP tokens, claim and harvest rewards.
 * Demo mode provides realistic sample farm data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface Farm {
  id: string;
  lpToken: string;
  rewardToken: string;
  apy: number;
  totalStaked: number;
  yourStaked: number;
  pendingRewards: number;
  multiplier: string;
  depositFee: number;
}

type FarmAction = 'none' | 'stake' | 'unstake';

const DEMO_FARMS: Farm[] = [
  { id: 'otk-usdt', lpToken: 'OTK/USDT LP', rewardToken: 'OTK', apy: 120, totalStaked: 1_850_000, yourStaked: 125.0, pendingRewards: 42.5, multiplier: '40x', depositFee: 0 },
  { id: 'otk-eth', lpToken: 'OTK/ETH LP', rewardToken: 'OTK', apy: 95, totalStaked: 1_200_000, yourStaked: 80.0, pendingRewards: 18.3, multiplier: '30x', depositFee: 0 },
  { id: 'btc-usdt', lpToken: 'BTC/USDT LP', rewardToken: 'OTK', apy: 45, totalStaked: 3_500_000, yourStaked: 25.0, pendingRewards: 5.2, multiplier: '15x', depositFee: 0 },
  { id: 'eth-usdt', lpToken: 'ETH/USDT LP', rewardToken: 'OTK', apy: 38, totalStaked: 2_800_000, yourStaked: 0, pendingRewards: 0, multiplier: '12x', depositFee: 0 },
  { id: 'sol-usdt', lpToken: 'SOL/USDT LP', rewardToken: 'OTK', apy: 65, totalStaked: 900_000, yourStaked: 0, pendingRewards: 0, multiplier: '20x', depositFee: 0 },
  { id: 'otk-btc', lpToken: 'OTK/BTC LP', rewardToken: 'OTK', apy: 150, totalStaked: 650_000, yourStaked: 50.0, pendingRewards: 28.7, multiplier: '50x', depositFee: 0 },
];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function YieldFarmScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [farms] = useState<Farm[]>(DEMO_FARMS);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [action, setAction] = useState<FarmAction>('none');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPendingRewards = useMemo(
    () => farms.reduce((sum, f) => sum + f.pendingRewards, 0),
    [farms],
  );

  const totalStakedValue = useMemo(
    () => farms.reduce((sum, f) => sum + f.yourStaked, 0),
    [farms],
  );

  const activeFarms = useMemo(
    () => farms.filter((f) => f.yourStaked > 0),
    [farms],
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    summaryTitle: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: t.text.muted, fontSize: 14 },
    summaryValue: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    summaryValueGreen: { color: t.accent.green, fontSize: 14, fontWeight: '600' },
    harvestBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    harvestBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
    harvestBtnDisabled: { backgroundColor: t.border },
    farmCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    farmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    farmName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    farmApy: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    farmStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    farmStatLabel: { color: t.text.muted, fontSize: 12 },
    farmStatValue: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    rewardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    rewardLabel: { color: t.accent.green, fontSize: 12 },
    rewardValue: { color: t.accent.green, fontSize: 12, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    stakeBtn: { backgroundColor: t.accent.green + '20' },
    unstakeBtn: { backgroundColor: t.accent.red + '20' },
    claimBtn: { backgroundColor: t.accent.purple + '20' },
    stakeBtnText: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    unstakeBtnText: { color: t.accent.red, fontSize: 13, fontWeight: '700' },
    claimBtnText: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },
    multiplierTag: { backgroundColor: t.accent.purple + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    multiplierText: { color: t.accent.purple, fontSize: 10, fontWeight: '700' },
    modalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    modalTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 16 },
    inputLabel: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    cancelBtnText: { color: t.accent.blue, fontSize: 15 },
    sectionTitle: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  }), [t]);

  const handleStake = useCallback(() => {
    if (!selectedFarm || !amount) {
      Alert.alert('Missing Amount', 'Enter the number of LP tokens to stake.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Staked Successfully',
        `Staked ${amount} ${selectedFarm.lpToken} in the farm.\n\nYou will start earning ${selectedFarm.rewardToken} rewards immediately.`,
      );
      setAmount('');
      setAction('none');
      setSelectedFarm(null);
    }, 1500);
  }, [selectedFarm, amount]);

  const handleUnstake = useCallback(() => {
    if (!selectedFarm || !amount) {
      Alert.alert('Missing Amount', 'Enter the number of LP tokens to unstake.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive number.');
      return;
    }
    if (val > selectedFarm.yourStaked) {
      Alert.alert('Exceeds Balance', `You only have ${selectedFarm.yourStaked} LP tokens staked.`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Unstaked Successfully',
        `Unstaked ${amount} ${selectedFarm.lpToken}.\n\nPending rewards have also been claimed.`,
      );
      setAmount('');
      setAction('none');
      setSelectedFarm(null);
    }, 1500);
  }, [selectedFarm, amount]);

  const handleClaimRewards = useCallback((farm: Farm) => {
    if (farm.pendingRewards <= 0) {
      Alert.alert('No Rewards', 'No pending rewards to claim.');
      return;
    }
    Alert.alert(
      'Claim Rewards',
      `Claim ${farm.pendingRewards.toFixed(2)} ${farm.rewardToken} from ${farm.lpToken}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: () => {
            Alert.alert('Rewards Claimed', `${farm.pendingRewards.toFixed(2)} ${farm.rewardToken} sent to your wallet.`);
          },
        },
      ],
    );
  }, []);

  const handleHarvestAll = useCallback(() => {
    if (totalPendingRewards <= 0) {
      Alert.alert('No Rewards', 'No pending rewards across any farm.');
      return;
    }
    Alert.alert(
      'Harvest All',
      `Claim ${totalPendingRewards.toFixed(2)} OTK total rewards from all farms?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Harvest All',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert('All Rewards Harvested', `${totalPendingRewards.toFixed(2)} OTK claimed from ${activeFarms.length} farms and sent to your wallet.`);
            }, 2000);
          },
        },
      ],
    );
  }, [totalPendingRewards, activeFarms.length]);

  // ─── Stake/Unstake Form ───

  if ((action === 'stake' || action === 'unstake') && selectedFarm) {
    const isStake = action === 'stake';
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{isStake ? 'Stake LP Tokens' : 'Unstake LP Tokens'}</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selectedFarm.lpToken}</Text>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Farm APY</Text>
              <Text style={s.summaryValueGreen}>{selectedFarm.apy}%</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Reward Token</Text>
              <Text style={s.summaryValue}>{selectedFarm.rewardToken}</Text>
            </View>
            {!isStake && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Currently Staked</Text>
                <Text style={s.summaryValue}>{selectedFarm.yourStaked.toFixed(2)} LP</Text>
              </View>
            )}
            {selectedFarm.pendingRewards > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Pending Rewards</Text>
                <Text style={s.summaryValueGreen}>{selectedFarm.pendingRewards.toFixed(2)} {selectedFarm.rewardToken}</Text>
              </View>
            )}

            <Text style={[s.inputLabel, { marginTop: 12 }]}>LP Token Amount</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            {!isStake && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[25, 50, 75, 100].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: t.border, alignItems: 'center' }}
                    onPress={() => setAmount(((selectedFarm.yourStaked * pct) / 100).toFixed(2))}
                  >
                    <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600' }}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, !isStake && { backgroundColor: t.accent.red }]}
              onPress={isStake ? handleStake : handleUnstake}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={isStake ? '#000' : '#fff'} />
                : <Text style={[s.submitBtnText, !isStake && { color: '#fff' }]}>{isStake ? 'Stake' : 'Unstake'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setAction('none'); setSelectedFarm(null); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Farm List ───

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Yield Farming</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Your Farming</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total LP Staked</Text>
            <Text style={s.summaryValue}>{totalStakedValue.toFixed(2)} LP</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Pending Rewards</Text>
            <Text style={s.summaryValueGreen}>{totalPendingRewards.toFixed(2)} OTK</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Active Farms</Text>
            <Text style={s.summaryValue}>{activeFarms.length}</Text>
          </View>

          <TouchableOpacity
            style={[s.harvestBtn, totalPendingRewards <= 0 && s.harvestBtnDisabled]}
            onPress={handleHarvestAll}
            disabled={loading || totalPendingRewards <= 0}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.harvestBtnText}>Harvest All ({totalPendingRewards.toFixed(2)} OTK)</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Your Staked Positions */}
        {activeFarms.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Your Positions</Text>
            {activeFarms.map((farm) => (
              <View key={`staked-${farm.id}`} style={s.farmCard}>
                <View style={s.farmHeader}>
                  <Text style={s.farmName}>{farm.lpToken}</Text>
                  <Text style={s.farmApy}>{farm.apy}% APY</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.farmStatLabel}>Staked</Text>
                  <Text style={s.farmStatValue}>{farm.yourStaked.toFixed(2)} LP</Text>
                </View>
                <View style={s.rewardRow}>
                  <Text style={s.rewardLabel}>Pending: {farm.pendingRewards.toFixed(2)} {farm.rewardToken}</Text>
                  <TouchableOpacity onPress={() => handleClaimRewards(farm)}>
                    <Text style={s.claimBtnText}>Claim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* All Farms */}
        <Text style={s.sectionTitle}>Available Farms</Text>
        {farms.map((farm) => (
          <View key={farm.id} style={s.farmCard}>
            <View style={s.farmHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.farmName}>{farm.lpToken}</Text>
                <View style={s.multiplierTag}>
                  <Text style={s.multiplierText}>{farm.multiplier}</Text>
                </View>
              </View>
              <Text style={s.farmApy}>{farm.apy}% APY</Text>
            </View>

            <View style={s.farmStats}>
              <View>
                <Text style={s.farmStatLabel}>Total Staked</Text>
                <Text style={s.farmStatValue}>{formatUsd(farm.totalStaked)}</Text>
              </View>
              <View>
                <Text style={s.farmStatLabel}>Earn</Text>
                <Text style={s.farmStatValue}>{farm.rewardToken}</Text>
              </View>
              <View>
                <Text style={s.farmStatLabel}>Deposit Fee</Text>
                <Text style={s.farmStatValue}>{farm.depositFee}%</Text>
              </View>
            </View>

            {farm.yourStaked > 0 && (
              <View style={s.rewardRow}>
                <Text style={s.rewardLabel}>Staked: {farm.yourStaked.toFixed(2)} LP</Text>
                <Text style={s.rewardValue}>+{farm.pendingRewards.toFixed(2)} {farm.rewardToken}</Text>
              </View>
            )}

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.stakeBtn]}
                onPress={() => { setSelectedFarm(farm); setAction('stake'); }}
              >
                <Text style={s.stakeBtnText}>Stake</Text>
              </TouchableOpacity>
              {farm.yourStaked > 0 && (
                <>
                  <TouchableOpacity
                    style={[s.actionBtn, s.unstakeBtn]}
                    onPress={() => { setSelectedFarm(farm); setAction('unstake'); }}
                  >
                    <Text style={s.unstakeBtnText}>Unstake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, s.claimBtn]}
                    onPress={() => handleClaimRewards(farm)}
                  >
                    <Text style={s.claimBtnText}>Claim</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {!demoMode && farms.length === 0 && (
          <Text style={s.emptyText}>No farms available. Enable Demo Mode to explore.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
