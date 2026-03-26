/**
 * Staking Screen — Delegate OTK to validators, earn rewards.
 *
 * Phase 1: UI + mock staking data
 * Phase 2: Real Cosmos SDK staking module integration
 * Phase 3: Open Chain PoH/PoC validator participation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Validator {
  address: string;
  moniker: string;
  commission: number;
  votingPower: string;
  status: 'active' | 'inactive';
  uptime: number;
}

interface StakedPosition {
  validator: string;
  moniker: string;
  amount: string;
  rewards: string;
  since: string;
}

interface Props {
  onClose: () => void;
}

const MOCK_VALIDATORS: Validator[] = [
  { address: 'openchain1val1...abc', moniker: 'Open Validator 1', commission: 5, votingPower: '500 OTK', status: 'active', uptime: 99.9 },
  { address: 'openchain1val2...def', moniker: 'Community Node', commission: 3, votingPower: '320 OTK', status: 'active', uptime: 99.5 },
  { address: 'openchain1val3...ghi', moniker: 'Mobile Validator Alpha', commission: 2, votingPower: '150 OTK', status: 'active', uptime: 98.8 },
  { address: 'openchain1val4...jkl', moniker: 'Humanity Node', commission: 1, votingPower: '80 OTK', status: 'active', uptime: 97.5 },
  { address: 'openchain1val5...mno', moniker: 'Education DAO', commission: 0, votingPower: '50 OTK', status: 'active', uptime: 99.2 },
];

const MOCK_STAKED: StakedPosition[] = [];

export function StakingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<'stake' | 'positions'>('stake');
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);
  const [positions, setPositions] = useState<StakedPosition[]>(MOCK_STAKED);
  const t = useTheme();
  const currency = useWalletStore((s) => s.currency);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    summaryCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
    summaryLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    summaryValue: { color: t.accent.green, fontSize: 36, fontWeight: '800', marginTop: 4 },
    summarySubtext: { color: t.text.secondary, fontSize: 14, marginTop: 8 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 8 },
    validatorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    validatorCardSelected: { borderWidth: 2, borderColor: t.accent.green },
    validatorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    validatorName: { color: t.text.primary, fontSize: 16, fontWeight: '700', flex: 1 },
    validatorBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    validatorBadgeText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    validatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    validatorLabel: { color: t.text.muted, fontSize: 13 },
    validatorValue: { color: t.text.secondary, fontSize: 13 },
    stakeInputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 16 },
    stakeInputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    stakeInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    stakeBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    stakeBtnDisabled: { opacity: 0.5 },
    stakeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    positionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    positionName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    positionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    positionLabel: { color: t.text.muted, fontSize: 13 },
    positionValue: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    rewardsValue: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    claimBtn: { backgroundColor: t.accent.green + '20', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 10, alignSelf: 'flex-start' },
    claimBtnText: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    infoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 20 },
    infoTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
    infoText: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
  }), [t]);

  const totalStaked = positions.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalRewards = positions.reduce((sum, p) => sum + parseFloat(p.rewards), 0);

  const handleStake = useCallback(async () => {
    if (!selectedValidator) {
      Alert.alert('Select Validator', 'Please select a validator to delegate to.');
      return;
    }
    if (!stakeAmount.trim() || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid staking amount.');
      return;
    }

    setStaking(true);
    // Simulate staking (real implementation uses Cosmos SDK staking module)
    setTimeout(() => {
      const newPosition: StakedPosition = {
        validator: selectedValidator.address,
        moniker: selectedValidator.moniker,
        amount: stakeAmount,
        rewards: '0.00',
        since: new Date().toISOString().split('T')[0],
      };
      setPositions((prev) => [...prev, newPosition]);
      setStaking(false);
      setStakeAmount('');
      setTab('positions');
      Alert.alert('Staked', `Successfully delegated ${stakeAmount} OTK to ${selectedValidator.moniker}.\n\nYou'll start earning rewards in the next epoch.`);
    }, 2000);
  }, [selectedValidator, stakeAmount]);

  const handleClaim = useCallback((moniker: string) => {
    Alert.alert('Claim Rewards', `Claiming rewards from ${moniker}...`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Claim', onPress: () => Alert.alert('Success', 'Rewards claimed and added to your balance.') },
    ]);
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Staking</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Total Staked</Text>
        <Text style={s.summaryValue}>{totalStaked.toFixed(2)} OTK</Text>
        <Text style={s.summarySubtext}>Rewards earned: {totalRewards.toFixed(4)} OTK</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'stake' && s.tabActive]} onPress={() => setTab('stake')}>
          <Text style={[s.tabText, tab === 'stake' && s.tabTextActive]}>Stake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'positions' && s.tabActive]} onPress={() => setTab('positions')}>
          <Text style={[s.tabText, tab === 'positions' && s.tabTextActive]}>Positions ({positions.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {tab === 'stake' && (
          <>
            {/* Validators */}
            <Text style={s.section}>Validators</Text>
            {MOCK_VALIDATORS.map((v) => (
              <TouchableOpacity
                key={v.address}
                style={[s.validatorCard, selectedValidator?.address === v.address && s.validatorCardSelected]}
                onPress={() => setSelectedValidator(v)}
              >
                <View style={s.validatorHeader}>
                  <Text style={s.validatorName}>{v.moniker}</Text>
                  <View style={s.validatorBadge}>
                    <Text style={s.validatorBadgeText}>{v.uptime}%</Text>
                  </View>
                </View>
                <View style={s.validatorRow}>
                  <Text style={s.validatorLabel}>Commission</Text>
                  <Text style={s.validatorValue}>{v.commission}%</Text>
                </View>
                <View style={s.validatorRow}>
                  <Text style={s.validatorLabel}>Voting Power</Text>
                  <Text style={s.validatorValue}>{v.votingPower}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Stake Input */}
            {selectedValidator && (
              <View style={s.stakeInputCard}>
                <Text style={s.stakeInputLabel}>Amount to stake (OTK)</Text>
                <TextInput
                  style={s.stakeInput}
                  placeholder="0.00"
                  placeholderTextColor={t.text.muted}
                  value={stakeAmount}
                  onChangeText={setStakeAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <TouchableOpacity
              style={[s.stakeBtn, (!selectedValidator || staking) && s.stakeBtnDisabled]}
              onPress={handleStake}
              disabled={!selectedValidator || staking}
            >
              {staking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.stakeBtnText}>
                  {selectedValidator ? `Stake OTK with ${selectedValidator.moniker}` : 'Select a validator'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Info */}
            <View style={s.infoCard}>
              <Text style={s.infoTitle}>How Open Chain Staking Works</Text>
              <Text style={s.infoText}>
                Open Chain uses Proof of Humanity + Proof of Contribution.{'\n\n'}
                Unlike traditional PoS, your rewards are based on participation — not wealth. Every validator earns the same base reward per epoch.{'\n\n'}
                Staking OTK helps secure the network and gives you governance voting power (one human = one vote, regardless of stake size).
              </Text>
            </View>
          </>
        )}

        {tab === 'positions' && (
          <>
            {positions.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>📊</Text>
                <Text style={s.emptyText}>
                  No staked positions yet.{'\n'}Delegate OTK to a validator to start earning rewards and securing the network.
                </Text>
              </View>
            ) : (
              positions.map((p, i) => (
                <View key={i} style={s.positionCard}>
                  <Text style={s.positionName}>{p.moniker}</Text>
                  <View style={s.positionRow}>
                    <Text style={s.positionLabel}>Staked</Text>
                    <Text style={s.positionValue}>{p.amount} OTK</Text>
                  </View>
                  <View style={s.positionRow}>
                    <Text style={s.positionLabel}>Rewards</Text>
                    <Text style={s.rewardsValue}>{p.rewards} OTK</Text>
                  </View>
                  <View style={s.positionRow}>
                    <Text style={s.positionLabel}>Since</Text>
                    <Text style={s.positionValue}>{p.since}</Text>
                  </View>
                  <TouchableOpacity style={s.claimBtn} onPress={() => handleClaim(p.moniker)}>
                    <Text style={s.claimBtnText}>Claim Rewards</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
