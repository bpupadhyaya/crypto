import { fonts } from '../utils/theme';
/**
 * Liquidity Pool Screen — Manage AMM liquidity pools on Open Chain DEX.
 *
 * View pools, add/remove liquidity, create new pairs, track LP positions.
 * Demo mode provides realistic sample pool data.
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

interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  tvl: number;
  apy: number;
  volume24h: number;
  yourLiquidity: number;
  yourShare: number;
  lpTokens: number;
  feeRate: number;
}

type PoolAction = 'none' | 'add' | 'remove' | 'create';

const DEMO_POOLS: Pool[] = [
  { id: 'otk-usdt', tokenA: 'OTK', tokenB: 'USDT', tvl: 2_450_000, apy: 124.5, volume24h: 890_000, yourLiquidity: 1_250, yourShare: 0.051, lpTokens: 125.0, feeRate: 0.3 },
  { id: 'otk-eth', tokenA: 'OTK', tokenB: 'ETH', tvl: 1_800_000, apy: 98.2, volume24h: 650_000, yourLiquidity: 800, yourShare: 0.044, lpTokens: 80.0, feeRate: 0.3 },
  { id: 'btc-usdt', tokenA: 'BTC', tokenB: 'USDT', tvl: 5_200_000, apy: 42.8, volume24h: 2_100_000, yourLiquidity: 2_500, yourShare: 0.048, lpTokens: 25.0, feeRate: 0.05 },
  { id: 'eth-usdt', tokenA: 'ETH', tokenB: 'USDT', tvl: 3_800_000, apy: 35.6, volume24h: 1_500_000, yourLiquidity: 0, yourShare: 0, lpTokens: 0, feeRate: 0.3 },
  { id: 'sol-usdt', tokenA: 'SOL', tokenB: 'USDT', tvl: 1_200_000, apy: 58.3, volume24h: 420_000, yourLiquidity: 0, yourShare: 0, lpTokens: 0, feeRate: 0.3 },
  { id: 'otk-btc', tokenA: 'OTK', tokenB: 'BTC', tvl: 950_000, apy: 145.0, volume24h: 310_000, yourLiquidity: 500, yourShare: 0.053, lpTokens: 50.0, feeRate: 0.3 },
];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function LiquidityScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [pools] = useState<Pool[]>(DEMO_POOLS);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [action, setAction] = useState<PoolAction>('none');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenA, setNewTokenA] = useState('');
  const [newTokenB, setNewTokenB] = useState('');
  const [newAmountA, setNewAmountA] = useState('');
  const [newAmountB, setNewAmountB] = useState('');

  const totalLiquidity = useMemo(
    () => pools.reduce((sum, p) => sum + p.yourLiquidity, 0),
    [pools],
  );

  const totalLpValue = useMemo(
    () => pools.filter((p) => p.lpTokens > 0).reduce((sum, p) => sum + p.lpTokens, 0),
    [pools],
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    summaryTitle: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: t.text.muted, fontSize: 14 },
    summaryValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    summaryValueGreen: { color: t.accent.green, fontSize: 14, fontWeight: fonts.semibold },
    poolCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    poolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    poolPair: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    poolApy: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    poolStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    poolStatLabel: { color: t.text.muted, fontSize: 12 },
    poolStatValue: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    positionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    positionLabel: { color: t.accent.green, fontSize: 12 },
    positionValue: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    addBtn: { backgroundColor: t.accent.green + '20' },
    removeBtn: { backgroundColor: t.accent.red + '20' },
    addBtnText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    removeBtnText: { color: t.accent.red, fontSize: 13, fontWeight: fonts.bold },
    modalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    modalTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, marginBottom: 16 },
    inputLabel: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#000', fontSize: 16, fontWeight: fonts.heavy },
    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    cancelBtnText: { color: t.accent.blue, fontSize: 15 },
    warning: { backgroundColor: t.accent.yellow + '15', borderRadius: 10, padding: 12, marginBottom: 16 },
    warningText: { color: t.accent.yellow, fontSize: 12, lineHeight: 18 },
    createBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    createBtnText: { color: t.accent.purple, fontSize: 15, fontWeight: fonts.bold },
    feeTag: { backgroundColor: t.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    feeText: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold },
    sectionTitle: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
    lpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    lpLabel: { color: t.text.muted, fontSize: 13 },
    lpValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
  }), [t]);

  const handleAddLiquidity = useCallback(() => {
    if (!selectedPool || !amountA || !amountB) {
      Alert.alert('Missing Amounts', 'Enter amounts for both tokens.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Liquidity Added',
        `Added ${amountA} ${selectedPool.tokenA} + ${amountB} ${selectedPool.tokenB} to the ${selectedPool.tokenA}/${selectedPool.tokenB} pool.\n\nLP tokens minted to your wallet.`,
      );
      setAmountA('');
      setAmountB('');
      setAction('none');
      setSelectedPool(null);
    }, 1500);
  }, [selectedPool, amountA, amountB]);

  const handleRemoveLiquidity = useCallback(() => {
    if (!selectedPool || !removePercent) {
      Alert.alert('Missing Amount', 'Enter the percentage to withdraw.');
      return;
    }
    const pct = parseFloat(removePercent);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      Alert.alert('Invalid Percentage', 'Enter a value between 1 and 100.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const removedValue = (selectedPool.yourLiquidity * pct) / 100;
      Alert.alert(
        'Liquidity Removed',
        `Withdrew ${pct}% (~${formatUsd(removedValue)}) from ${selectedPool.tokenA}/${selectedPool.tokenB}.\n\nLP tokens burned. Tokens returned to your wallet.`,
      );
      setRemovePercent('');
      setAction('none');
      setSelectedPool(null);
    }, 1500);
  }, [selectedPool, removePercent]);

  const handleCreatePool = useCallback(() => {
    if (!newTokenA || !newTokenB || !newAmountA || !newAmountB) {
      Alert.alert('Missing Fields', 'Fill in all fields to create a new pool.');
      return;
    }
    if (newTokenA.toUpperCase() === newTokenB.toUpperCase()) {
      Alert.alert('Invalid Pair', 'Tokens must be different.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Pool Created',
        `New ${newTokenA.toUpperCase()}/${newTokenB.toUpperCase()} pool created with initial liquidity of ${newAmountA} ${newTokenA.toUpperCase()} + ${newAmountB} ${newTokenB.toUpperCase()}.\n\nYou are the first liquidity provider!`,
      );
      setNewTokenA('');
      setNewTokenB('');
      setNewAmountA('');
      setNewAmountB('');
      setShowCreateForm(false);
    }, 2000);
  }, [newTokenA, newTokenB, newAmountA, newAmountB]);

  // ─── Add Liquidity Form ───

  if (action === 'add' && selectedPool) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Add Liquidity</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selectedPool.tokenA}/{selectedPool.tokenB}</Text>

            <View style={s.warning}>
              <Text style={s.warningText}>
                Impermanent Loss Warning: When the price ratio of the two tokens changes after you provide liquidity, you may receive less value than if you had simply held. The higher the divergence, the greater the loss. Consider this risk before providing liquidity.
              </Text>
            </View>

            <Text style={s.inputLabel}>{selectedPool.tokenA} Amount</Text>
            <TextInput
              style={s.input}
              placeholder={`0.00 ${selectedPool.tokenA}`}
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={amountA}
              onChangeText={setAmountA}
            />

            <Text style={s.inputLabel}>{selectedPool.tokenB} Amount</Text>
            <TextInput
              style={s.input}
              placeholder={`0.00 ${selectedPool.tokenB}`}
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={amountB}
              onChangeText={setAmountB}
            />

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Pool Fee</Text>
              <Text style={s.summaryValue}>{selectedPool.feeRate}%</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Current APY</Text>
              <Text style={s.summaryValueGreen}>{selectedPool.apy.toFixed(1)}%</Text>
            </View>

            <TouchableOpacity style={s.submitBtn} onPress={handleAddLiquidity} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnText}>Add Liquidity</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setAction('none'); setSelectedPool(null); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Remove Liquidity Form ───

  if (action === 'remove' && selectedPool) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Remove Liquidity</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selectedPool.tokenA}/{selectedPool.tokenB}</Text>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Your Position</Text>
              <Text style={s.summaryValue}>{formatUsd(selectedPool.yourLiquidity)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>LP Tokens</Text>
              <Text style={s.summaryValue}>{selectedPool.lpTokens.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Pool Share</Text>
              <Text style={s.summaryValue}>{selectedPool.yourShare.toFixed(3)}%</Text>
            </View>

            <Text style={[s.inputLabel, { marginTop: 12 }]}>Withdraw Percentage (%)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 50"
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={removePercent}
              onChangeText={setRemovePercent}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {[25, 50, 75, 100].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: t.border, alignItems: 'center' }}
                  onPress={() => setRemovePercent(String(pct))}
                >
                  <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold }}>{pct}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            {removePercent ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>You will receive</Text>
                <Text style={s.summaryValueGreen}>~{formatUsd((selectedPool.yourLiquidity * Math.min(parseFloat(removePercent) || 0, 100)) / 100)}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.red }]} onPress={handleRemoveLiquidity} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[s.submitBtnText, { color: '#fff' }]}>Remove Liquidity</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setAction('none'); setSelectedPool(null); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Create Pool Form ───

  if (showCreateForm) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Create Pool</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Liquidity Pool</Text>

            <View style={s.warning}>
              <Text style={s.warningText}>
                You are creating a new trading pair. You set the initial price ratio by the amounts you deposit. Make sure the ratio reflects current market prices to avoid arbitrage losses.
              </Text>
            </View>

            <Text style={s.inputLabel}>Token A Symbol</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. OTK"
              placeholderTextColor={t.text.muted}
              value={newTokenA}
              onChangeText={setNewTokenA}
              autoCapitalize="characters"
            />

            <Text style={s.inputLabel}>Token B Symbol</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. USDC"
              placeholderTextColor={t.text.muted}
              value={newTokenB}
              onChangeText={setNewTokenB}
              autoCapitalize="characters"
            />

            <Text style={s.inputLabel}>{newTokenA || 'Token A'} Initial Amount</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={newAmountA}
              onChangeText={setNewAmountA}
            />

            <Text style={s.inputLabel}>{newTokenB || 'Token B'} Initial Amount</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={newAmountB}
              onChangeText={setNewAmountB}
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleCreatePool} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.submitBtnText}>Create Pool</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreateForm(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Pool List ───

  const yourPools = pools.filter((p) => p.yourLiquidity > 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Liquidity Pools</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Your Liquidity</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total Provided</Text>
            <Text style={s.summaryValueGreen}>{formatUsd(totalLiquidity)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>LP Tokens Held</Text>
            <Text style={s.summaryValue}>{totalLpValue.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Active Pools</Text>
            <Text style={s.summaryValue}>{yourPools.length}</Text>
          </View>
        </View>

        {/* LP Token Balances */}
        {yourPools.length > 0 && (
          <>
            <Text style={s.sectionTitle}>LP Token Balances</Text>
            <View style={s.summaryCard}>
              {yourPools.map((p) => (
                <View key={p.id} style={s.lpRow}>
                  <Text style={s.lpLabel}>{p.tokenA}/{p.tokenB} LP</Text>
                  <Text style={s.lpValue}>{p.lpTokens.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Create Pool */}
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreateForm(true)}>
          <Text style={s.createBtnText}>+ Create New Pool</Text>
        </TouchableOpacity>

        {/* Impermanent Loss Warning */}
        <View style={s.warning}>
          <Text style={s.warningText}>
            Impermanent Loss: Providing liquidity carries risk. If token prices diverge significantly from when you deposited, you may withdraw less total value than you put in. Always research before providing liquidity.
          </Text>
        </View>

        {/* All Pools */}
        <Text style={s.sectionTitle}>Available Pools</Text>
        {pools.map((pool) => (
          <View key={pool.id} style={s.poolCard}>
            <View style={s.poolHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.poolPair}>{pool.tokenA}/{pool.tokenB}</Text>
                <View style={s.feeTag}>
                  <Text style={s.feeText}>{pool.feeRate}%</Text>
                </View>
              </View>
              <Text style={s.poolApy}>{pool.apy.toFixed(1)}% APY</Text>
            </View>

            <View style={s.poolStats}>
              <View>
                <Text style={s.poolStatLabel}>TVL</Text>
                <Text style={s.poolStatValue}>{formatUsd(pool.tvl)}</Text>
              </View>
              <View>
                <Text style={s.poolStatLabel}>24h Volume</Text>
                <Text style={s.poolStatValue}>{formatUsd(pool.volume24h)}</Text>
              </View>
              <View>
                <Text style={s.poolStatLabel}>Your Share</Text>
                <Text style={s.poolStatValue}>{pool.yourShare > 0 ? `${pool.yourShare.toFixed(3)}%` : '—'}</Text>
              </View>
            </View>

            {pool.yourLiquidity > 0 && (
              <View style={s.positionRow}>
                <Text style={s.positionLabel}>Your Position: {formatUsd(pool.yourLiquidity)}</Text>
                <Text style={s.positionValue}>LP: {pool.lpTokens.toFixed(2)}</Text>
              </View>
            )}

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.addBtn]}
                onPress={() => { setSelectedPool(pool); setAction('add'); }}
              >
                <Text style={s.addBtnText}>+ Add</Text>
              </TouchableOpacity>
              {pool.yourLiquidity > 0 && (
                <TouchableOpacity
                  style={[s.actionBtn, s.removeBtn]}
                  onPress={() => { setSelectedPool(pool); setAction('remove'); }}
                >
                  <Text style={s.removeBtnText}>- Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {!demoMode && pools.length === 0 && (
          <Text style={{ color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 32 }}>
            No pools available. Enable Demo Mode to explore.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
