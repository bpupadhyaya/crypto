import { fonts } from '../utils/theme';
/**
 * Lend/Borrow Screen — Simple lending protocol on Open Chain.
 *
 * Supply assets to earn interest, borrow against collateral.
 * Health factor monitoring with liquidation warnings.
 * Demo mode provides realistic market rates.
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

interface LendingMarket {
  token: string;
  supplyApy: number;
  borrowApy: number;
  totalSupplied: number;
  totalBorrowed: number;
  utilization: number;
  collateralFactor: number;
  yourSupplied: number;
  yourBorrowed: number;
  price: number;
}

type MarketAction = 'none' | 'supply' | 'withdraw' | 'borrow' | 'repay';

const DEMO_MARKETS: LendingMarket[] = [
  { token: 'OTK', supplyApy: 8.5, borrowApy: 12.4, totalSupplied: 5_200_000, totalBorrowed: 2_800_000, utilization: 53.8, collateralFactor: 0.65, yourSupplied: 10_000, yourBorrowed: 0, price: 0.01 },
  { token: 'BTC', supplyApy: 1.2, borrowApy: 3.8, totalSupplied: 450, totalBorrowed: 180, utilization: 40.0, collateralFactor: 0.80, yourSupplied: 0.05, yourBorrowed: 0, price: 65_000 },
  { token: 'ETH', supplyApy: 2.8, borrowApy: 5.2, totalSupplied: 8_500, totalBorrowed: 4_200, utilization: 49.4, collateralFactor: 0.78, yourSupplied: 2.0, yourBorrowed: 0.5, price: 3_200 },
  { token: 'SOL', supplyApy: 4.5, borrowApy: 8.1, totalSupplied: 120_000, totalBorrowed: 58_000, utilization: 48.3, collateralFactor: 0.70, yourSupplied: 100, yourBorrowed: 0, price: 140 },
  { token: 'USDT', supplyApy: 5.8, borrowApy: 9.2, totalSupplied: 12_000_000, totalBorrowed: 7_800_000, utilization: 65.0, collateralFactor: 0.85, yourSupplied: 0, yourBorrowed: 800, price: 1.0 },
];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatAmount(n: number, token: string): string {
  if (token === 'BTC') return n.toFixed(4);
  if (token === 'ETH') return n.toFixed(3);
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

export function LendBorrowScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [markets] = useState<LendingMarket[]>(DEMO_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<LendingMarket | null>(null);
  const [action, setAction] = useState<MarketAction>('none');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate health factor
  const { totalSuppliedUsd, totalBorrowedUsd, healthFactor } = useMemo(() => {
    let supplied = 0;
    let borrowed = 0;
    let weightedCollateral = 0;

    for (const m of markets) {
      const supUsd = m.yourSupplied * m.price;
      const borUsd = m.yourBorrowed * m.price;
      supplied += supUsd;
      borrowed += borUsd;
      weightedCollateral += supUsd * m.collateralFactor;
    }

    const hf = borrowed > 0 ? weightedCollateral / borrowed : Infinity;
    return { totalSuppliedUsd: supplied, totalBorrowedUsd: borrowed, healthFactor: hf };
  }, [markets]);

  const isLiquidationRisk = healthFactor < 1.2 && healthFactor !== Infinity;
  const isCritical = healthFactor < 1.05 && healthFactor !== Infinity;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    summaryTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.md },
    summaryValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    summaryValueGreen: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.semibold },
    summaryValueRed: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.semibold },
    healthBar: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 8, marginBottom: 4 },
    healthFill: { height: 8, borderRadius: 4 },
    healthLabel: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'right' },
    warningCard: { backgroundColor: t.accent.red + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: t.accent.red + '30' },
    warningTitle: { color: t.accent.red, fontSize: fonts.md, fontWeight: fonts.heavy, marginBottom: 4 },
    warningText: { color: t.accent.red, fontSize: fonts.sm, lineHeight: 18 },
    cautionCard: { backgroundColor: t.accent.yellow + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: t.accent.yellow + '30' },
    cautionTitle: { color: t.accent.yellow, fontSize: fonts.md, fontWeight: fonts.heavy, marginBottom: 4 },
    cautionText: { color: t.accent.yellow, fontSize: fonts.sm, lineHeight: 18 },
    sectionTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
    marketCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    marketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    marketToken: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    marketPrice: { color: t.text.muted, fontSize: fonts.sm },
    apyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    apyLabel: { color: t.text.muted, fontSize: fonts.sm },
    apyValueGreen: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    apyValueRed: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.semibold },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    statLabel: { color: t.text.muted, fontSize: fonts.xs },
    statValue: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    positionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    positionLabel: { color: t.accent.green, fontSize: fonts.sm },
    positionValue: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold },
    borrowedLabel: { color: t.accent.red, fontSize: fonts.sm },
    borrowedValue: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.semibold },
    actionRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    supplyBtn: { backgroundColor: t.accent.green + '20' },
    withdrawBtn: { backgroundColor: t.accent.yellow + '20' },
    borrowBtn: { backgroundColor: t.accent.blue + '20' },
    repayBtn: { backgroundColor: t.accent.red + '20' },
    supplyBtnText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    withdrawBtnText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold },
    borrowBtnText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.bold },
    repayBtnText: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold },
    utilizationBar: { height: 4, backgroundColor: t.border, borderRadius: 2, marginTop: 4, marginBottom: 6 },
    utilizationFill: { height: 4, borderRadius: 2, backgroundColor: t.accent.blue },
    modalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    modalTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 16 },
    inputLabel: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: fonts.lg, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#000', fontSize: fonts.lg, fontWeight: fonts.heavy },
    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    cancelBtnText: { color: t.accent.blue, fontSize: fonts.md },
    collateralTag: { backgroundColor: t.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    collateralText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
  }), [t]);

  const handleSupply = useCallback(() => {
    if (!selectedMarket || !amount) {
      Alert.alert('Missing Amount', 'Enter the amount to supply.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Supplied Successfully',
        `Supplied ${amount} ${selectedMarket.token} at ${selectedMarket.supplyApy}% APY.\n\nYou will earn interest continuously.`,
      );
      setAmount('');
      setAction('none');
      setSelectedMarket(null);
    }, 1500);
  }, [selectedMarket, amount]);

  const handleWithdraw = useCallback(() => {
    if (!selectedMarket || !amount) {
      Alert.alert('Missing Amount', 'Enter the amount to withdraw.');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive number.');
      return;
    }
    if (val > selectedMarket.yourSupplied) {
      Alert.alert('Exceeds Balance', `You only have ${formatAmount(selectedMarket.yourSupplied, selectedMarket.token)} ${selectedMarket.token} supplied.`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Withdrawn Successfully',
        `Withdrew ${amount} ${selectedMarket.token} from the lending pool.\n\nTokens returned to your wallet.`,
      );
      setAmount('');
      setAction('none');
      setSelectedMarket(null);
    }, 1500);
  }, [selectedMarket, amount]);

  const handleBorrow = useCallback(() => {
    if (!selectedMarket || !amount) {
      Alert.alert('Missing Amount', 'Enter the amount to borrow.');
      return;
    }
    if (totalSuppliedUsd <= 0) {
      Alert.alert('No Collateral', 'You need to supply assets as collateral before borrowing.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Borrowed Successfully',
        `Borrowed ${amount} ${selectedMarket.token} at ${selectedMarket.borrowApy}% APY.\n\nMonitor your health factor to avoid liquidation.`,
      );
      setAmount('');
      setAction('none');
      setSelectedMarket(null);
    }, 1500);
  }, [selectedMarket, amount, totalSuppliedUsd]);

  const handleRepay = useCallback(() => {
    if (!selectedMarket || !amount) {
      Alert.alert('Missing Amount', 'Enter the amount to repay.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Repaid Successfully',
        `Repaid ${amount} ${selectedMarket.token}.\n\nYour health factor has improved.`,
      );
      setAmount('');
      setAction('none');
      setSelectedMarket(null);
    }, 1500);
  }, [selectedMarket, amount]);

  // ─── Action Form ───

  if (action !== 'none' && selectedMarket) {
    const titles: Record<MarketAction, string> = {
      none: '',
      supply: `Supply ${selectedMarket.token}`,
      withdraw: `Withdraw ${selectedMarket.token}`,
      borrow: `Borrow ${selectedMarket.token}`,
      repay: `Repay ${selectedMarket.token}`,
    };
    const handlers: Record<MarketAction, () => void> = {
      none: () => {},
      supply: handleSupply,
      withdraw: handleWithdraw,
      borrow: handleBorrow,
      repay: handleRepay,
    };
    const btnColors: Record<MarketAction, string> = {
      none: t.accent.green,
      supply: t.accent.green,
      withdraw: t.accent.yellow,
      borrow: t.accent.blue,
      repay: t.accent.red,
    };

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{titles[action]}</Text>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{selectedMarket.token}</Text>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Price</Text>
              <Text style={s.summaryValue}>{formatUsd(selectedMarket.price)}</Text>
            </View>
            {(action === 'supply' || action === 'withdraw') && (
              <>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Supply APY</Text>
                  <Text style={s.summaryValueGreen}>{selectedMarket.supplyApy}%</Text>
                </View>
                {action === 'withdraw' && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Your Supply</Text>
                    <Text style={s.summaryValue}>{formatAmount(selectedMarket.yourSupplied, selectedMarket.token)} {selectedMarket.token}</Text>
                  </View>
                )}
              </>
            )}
            {(action === 'borrow' || action === 'repay') && (
              <>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Borrow APY</Text>
                  <Text style={s.summaryValueRed}>{selectedMarket.borrowApy}%</Text>
                </View>
                {action === 'repay' && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Your Debt</Text>
                    <Text style={s.summaryValue}>{formatAmount(selectedMarket.yourBorrowed, selectedMarket.token)} {selectedMarket.token}</Text>
                  </View>
                )}
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Health Factor</Text>
                  <Text style={[
                    s.summaryValue,
                    healthFactor < 1.2 ? { color: t.accent.red } : { color: t.accent.green },
                  ]}>
                    {healthFactor === Infinity ? 'Safe' : healthFactor.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            <Text style={[s.inputLabel, { marginTop: 12 }]}>Amount ({selectedMarket.token})</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={t.text.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            {(action === 'withdraw' || action === 'repay') && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[25, 50, 75, 100].map((pct) => {
                  const base = action === 'withdraw' ? selectedMarket.yourSupplied : selectedMarket.yourBorrowed;
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: t.border, alignItems: 'center' }}
                      onPress={() => setAmount(((base * pct) / 100).toFixed(selectedMarket.token === 'BTC' ? 4 : 2))}
                    >
                      <Text style={{ color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold }}>{pct}%</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: btnColors[action] }]}
              onPress={handlers[action]}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={action === 'repay' ? '#fff' : '#000'} />
                : <Text style={[s.submitBtnText, (action === 'borrow' || action === 'repay') && { color: '#fff' }]}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setAction('none'); setSelectedMarket(null); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Market List ───

  const suppliedMarkets = markets.filter((m) => m.yourSupplied > 0);
  const borrowedMarkets = markets.filter((m) => m.yourBorrowed > 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Lend & Borrow</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Your Positions</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total Supplied</Text>
            <Text style={s.summaryValueGreen}>{formatUsd(totalSuppliedUsd)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total Borrowed</Text>
            <Text style={s.summaryValueRed}>{formatUsd(totalBorrowedUsd)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Net Position</Text>
            <Text style={s.summaryValue}>{formatUsd(totalSuppliedUsd - totalBorrowedUsd)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Health Factor</Text>
            <Text style={[
              s.summaryValue,
              healthFactor === Infinity
                ? { color: t.accent.green }
                : healthFactor < 1.2
                  ? { color: t.accent.red }
                  : { color: t.accent.green },
            ]}>
              {healthFactor === Infinity ? 'N/A (no borrows)' : healthFactor.toFixed(2)}
            </Text>
          </View>

          {totalBorrowedUsd > 0 && (
            <>
              <View style={s.healthBar}>
                <View
                  style={[
                    s.healthFill,
                    {
                      width: `${Math.min(Math.max((healthFactor / 3) * 100, 5), 100)}%`,
                      backgroundColor: healthFactor < 1.2 ? t.accent.red : healthFactor < 1.5 ? t.accent.yellow : t.accent.green,
                    },
                  ]}
                />
              </View>
              <Text style={s.healthLabel}>
                {healthFactor < 1.0 ? 'LIQUIDATABLE' : healthFactor < 1.2 ? 'DANGER' : healthFactor < 1.5 ? 'CAUTION' : 'HEALTHY'}
              </Text>
            </>
          )}
        </View>

        {/* Liquidation Warning */}
        {isCritical && (
          <View style={s.warningCard}>
            <Text style={s.warningTitle}>LIQUIDATION WARNING</Text>
            <Text style={s.warningText}>
              Your health factor is {healthFactor.toFixed(2)} — critically low! Your collateral may be liquidated at any moment. Repay debt or add more collateral immediately.
            </Text>
          </View>
        )}
        {isLiquidationRisk && !isCritical && (
          <View style={s.cautionCard}>
            <Text style={s.cautionTitle}>Low Health Factor</Text>
            <Text style={s.cautionText}>
              Your health factor is {healthFactor.toFixed(2)} — approaching liquidation threshold (1.0). Consider repaying some debt or supplying more collateral to improve your position.
            </Text>
          </View>
        )}

        {/* Your Supplied Positions */}
        {suppliedMarkets.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Supplied</Text>
            {suppliedMarkets.map((m) => (
              <View key={`supplied-${m.token}`} style={s.marketCard}>
                <View style={s.marketHeader}>
                  <Text style={s.marketToken}>{m.token}</Text>
                  <Text style={s.apyValueGreen}>{m.supplyApy}% APY</Text>
                </View>
                <View style={s.positionRow}>
                  <Text style={s.positionLabel}>Supplied: {formatAmount(m.yourSupplied, m.token)}</Text>
                  <Text style={s.positionValue}>{formatUsd(m.yourSupplied * m.price)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Your Borrowed Positions */}
        {borrowedMarkets.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Borrowed</Text>
            {borrowedMarkets.map((m) => (
              <View key={`borrowed-${m.token}`} style={s.marketCard}>
                <View style={s.marketHeader}>
                  <Text style={s.marketToken}>{m.token}</Text>
                  <Text style={s.apyValueRed}>{m.borrowApy}% APY</Text>
                </View>
                <View style={s.positionRow}>
                  <Text style={s.borrowedLabel}>Borrowed: {formatAmount(m.yourBorrowed, m.token)}</Text>
                  <Text style={s.borrowedValue}>{formatUsd(m.yourBorrowed * m.price)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* All Markets */}
        <Text style={s.sectionTitle}>Markets</Text>
        {markets.map((market) => (
          <View key={market.token} style={s.marketCard}>
            <View style={s.marketHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.marketToken}>{market.token}</Text>
                <View style={s.collateralTag}>
                  <Text style={s.collateralText}>CF {(market.collateralFactor * 100).toFixed(0)}%</Text>
                </View>
              </View>
              <Text style={s.marketPrice}>{formatUsd(market.price)}</Text>
            </View>

            <View style={s.apyRow}>
              <View>
                <Text style={s.apyLabel}>Supply APY</Text>
                <Text style={s.apyValueGreen}>{market.supplyApy}%</Text>
              </View>
              <View>
                <Text style={s.apyLabel}>Borrow APY</Text>
                <Text style={s.apyValueRed}>{market.borrowApy}%</Text>
              </View>
            </View>

            <View style={s.statsRow}>
              <Text style={s.statLabel}>Total Supplied</Text>
              <Text style={s.statValue}>{formatUsd(market.totalSupplied * market.price)}</Text>
            </View>
            <View style={s.statsRow}>
              <Text style={s.statLabel}>Total Borrowed</Text>
              <Text style={s.statValue}>{formatUsd(market.totalBorrowed * market.price)}</Text>
            </View>

            <View style={s.utilizationBar}>
              <View style={[s.utilizationFill, { width: `${market.utilization}%` }]} />
            </View>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, textAlign: 'right' }}>
              {market.utilization.toFixed(1)}% utilization
            </Text>

            {(market.yourSupplied > 0 || market.yourBorrowed > 0) && (
              <>
                {market.yourSupplied > 0 && (
                  <View style={s.positionRow}>
                    <Text style={s.positionLabel}>Supplied: {formatAmount(market.yourSupplied, market.token)}</Text>
                    <Text style={s.positionValue}>{formatUsd(market.yourSupplied * market.price)}</Text>
                  </View>
                )}
                {market.yourBorrowed > 0 && (
                  <View style={[s.positionRow, market.yourSupplied <= 0 ? {} : { borderTopWidth: 0, paddingTop: 0 }]}>
                    <Text style={s.borrowedLabel}>Borrowed: {formatAmount(market.yourBorrowed, market.token)}</Text>
                    <Text style={s.borrowedValue}>{formatUsd(market.yourBorrowed * market.price)}</Text>
                  </View>
                )}
              </>
            )}

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.supplyBtn]}
                onPress={() => { setSelectedMarket(market); setAction('supply'); }}
              >
                <Text style={s.supplyBtnText}>Supply</Text>
              </TouchableOpacity>
              {market.yourSupplied > 0 && (
                <TouchableOpacity
                  style={[s.actionBtn, s.withdrawBtn]}
                  onPress={() => { setSelectedMarket(market); setAction('withdraw'); }}
                >
                  <Text style={s.withdrawBtnText}>Withdraw</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.actionBtn, s.borrowBtn]}
                onPress={() => { setSelectedMarket(market); setAction('borrow'); }}
              >
                <Text style={s.borrowBtnText}>Borrow</Text>
              </TouchableOpacity>
              {market.yourBorrowed > 0 && (
                <TouchableOpacity
                  style={[s.actionBtn, s.repayBtn]}
                  onPress={() => { setSelectedMarket(market); setAction('repay'); }}
                >
                  <Text style={s.repayBtnText}>Repay</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {!demoMode && markets.length === 0 && (
          <Text style={{ color: t.text.muted, fontSize: fonts.md, textAlign: 'center', paddingVertical: 32 }}>
            No lending markets available. Enable Demo Mode to explore.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
