/**
 * Yield Optimizer Screen — Art I (xOTK)
 *
 * Auto-compound staking + yield farming optimization.
 * Compare APY across protocols, toggle auto-compound, project earnings.
 * Demo mode returns realistic mock data without touching the chain.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Switch, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface YieldPosition {
  id: string;
  name: string;
  type: 'staking' | 'lp' | 'farming';
  token: string;
  amount: number;
  apy: number;
  earned: number;
  autoCompound: boolean;
  protocol: string;
}

interface ProtocolYield {
  protocol: string;
  type: 'staking' | 'lp' | 'farming';
  token: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
}

interface Props {
  onClose: () => void;
}

const DEMO_POSITIONS: YieldPosition[] = [
  {
    id: 'pos-1',
    name: 'OTK Staking',
    type: 'staking',
    token: 'OTK',
    amount: 5_000,
    apy: 5.2,
    earned: 42.80,
    autoCompound: true,
    protocol: 'Open Chain',
  },
  {
    id: 'pos-2',
    name: 'OTK-USDC LP',
    type: 'lp',
    token: 'OTK-USDC',
    amount: 3_000,
    apy: 12.4,
    earned: 61.20,
    autoCompound: false,
    protocol: 'Open DEX',
  },
  {
    id: 'pos-3',
    name: 'OTK Yield Farm',
    type: 'farming',
    token: 'OTK',
    amount: 2_000,
    apy: 18.6,
    earned: 58.50,
    autoCompound: true,
    protocol: 'Open Farm',
  },
];

const DEMO_COMPARISONS: ProtocolYield[] = [
  { protocol: 'Open Chain', type: 'staking', token: 'OTK', apy: 5.2, tvl: '$1.2M', risk: 'Low' },
  { protocol: 'Open Chain', type: 'staking', token: 'OTK', apy: 6.8, tvl: '$800K', risk: 'Low' },
  { protocol: 'Open DEX', type: 'lp', token: 'OTK-USDC', apy: 12.4, tvl: '$450K', risk: 'Medium' },
  { protocol: 'Open DEX', type: 'lp', token: 'OTK-ETH', apy: 14.8, tvl: '$320K', risk: 'Medium' },
  { protocol: 'Open Farm', type: 'farming', token: 'OTK', apy: 18.6, tvl: '$180K', risk: 'High' },
  { protocol: 'Open Farm', type: 'farming', token: 'OTK-BTC', apy: 22.1, tvl: '$95K', risk: 'High' },
];

export function YieldOptimizerScreen({ onClose }: Props) {
  const [tab, setTab] = useState<'positions' | 'compare' | 'calculator' | 'settings'>('positions');
  const [positions, setPositions] = useState<YieldPosition[]>(DEMO_POSITIONS);
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState('10000');
  const [calcApy, setCalcApy] = useState('12.4');
  const [calcMonths, setCalcMonths] = useState('12');

  // Settings state
  const [batchHarvest, setBatchHarvest] = useState(true);
  const [gasOptimize, setGasOptimize] = useState(true);
  const [compoundFreq, setCompoundFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const totalDeposited = useMemo(
    () => positions.reduce((sum, p) => sum + p.amount, 0),
    [positions],
  );

  const totalEarned = useMemo(
    () => positions.reduce((sum, p) => sum + p.earned, 0),
    [positions],
  );

  const projectedValue = useMemo(() => {
    const principal = parseFloat(calcAmount) || 0;
    const apy = parseFloat(calcApy) || 0;
    const months = parseInt(calcMonths, 10) || 0;
    // Compound daily
    const days = months * 30;
    const dailyRate = apy / 100 / 365;
    return principal * Math.pow(1 + dailyRate, days);
  }, [calcAmount, calcApy, calcMonths]);

  const projectedEarnings = useMemo(
    () => projectedValue - (parseFloat(calcAmount) || 0),
    [projectedValue, calcAmount],
  );

  const handleToggleAutoCompound = useCallback((posId: string) => {
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== posId) return p;
        const next = !p.autoCompound;
        Alert.alert(
          next ? 'Auto-Compound Enabled' : 'Auto-Compound Disabled',
          `${p.name}: rewards will ${next ? 'be reinvested automatically' : 'accumulate without reinvestment'}${demoMode ? ' (demo)' : ''}.`,
        );
        return { ...p, autoCompound: next };
      }),
    );
  }, [demoMode]);

  const handleHarvestAll = useCallback(() => {
    const totalHarvest = positions.reduce((sum, p) => sum + p.earned, 0);
    Alert.alert(
      'Harvest All Rewards',
      `Claim ${totalHarvest.toFixed(2)} OTK from ${positions.length} positions?${batchHarvest ? '\n\nBatch mode: single transaction to save gas.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Harvest',
          onPress: () => {
            setPositions((prev) => prev.map((p) => ({ ...p, earned: 0 })));
            Alert.alert('Success', `Harvested ${totalHarvest.toFixed(2)} OTK${demoMode ? ' (demo)' : ''}.`);
          },
        },
      ],
    );
  }, [positions, batchHarvest, demoMode]);

  const typeLabel = (type: YieldPosition['type']) => {
    switch (type) {
      case 'staking': return 'Staking';
      case 'lp': return 'Liquidity';
      case 'farming': return 'Farming';
    }
  };

  const riskColor = (risk: ProtocolYield['risk']) => {
    switch (risk) {
      case 'Low': return t.accent.green;
      case 'Medium': return t.accent.yellow ?? '#f5a623';
      case 'High': return t.accent.red;
    }
  };

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
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', flex: 1 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    typeBadgeText: { fontSize: 11, fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    label: { color: t.text.muted, fontSize: 13 },
    value: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    apyValue: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    compoundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.bg.primary },
    compoundLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    harvestBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 12, marginBottom: 8 },
    harvestBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    compareCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    compareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    compareProtocol: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    riskBadgeText: { fontSize: 11, fontWeight: '700' },
    compareApy: { color: t.accent.green, fontSize: 24, fontWeight: '800', marginVertical: 4 },
    calcCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    calcLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    calcInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    resultCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    resultLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    resultValue: { color: t.accent.green, fontSize: 32, fontWeight: '800', marginTop: 4 },
    resultSub: { color: t.text.secondary, fontSize: 14, marginTop: 8 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.bg.primary },
    settingLabel: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    settingDesc: { color: t.text.muted, fontSize: 12, marginTop: 2, maxWidth: '70%' },
    freqRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    freqChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.primary, alignItems: 'center' },
    freqChipActive: { backgroundColor: t.accent.green },
    freqChipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    freqChipTextActive: { color: '#fff' },
    infoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12 },
    infoTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
    infoText: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
  }), [t]);

  const tabItems: Array<{ key: typeof tab; label: string }> = [
    { key: 'positions', label: 'Positions' },
    { key: 'compare', label: 'Compare' },
    { key: 'calculator', label: 'Calc' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Yield Optimizer</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Total Deposited</Text>
        <Text style={s.summaryValue}>${totalDeposited.toLocaleString()}</Text>
        <Text style={s.summarySubtext}>Earned: {totalEarned.toFixed(2)} OTK</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabItems.map((ti) => (
          <TouchableOpacity
            key={ti.key}
            style={[s.tab, tab === ti.key && s.tabActive]}
            onPress={() => setTab(ti.key)}
          >
            <Text style={[s.tabText, tab === ti.key && s.tabTextActive]}>{ti.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {/* ---- Positions Tab ---- */}
        {tab === 'positions' && (
          <>
            <Text style={s.section}>Active Positions</Text>
            {positions.map((pos) => (
              <View key={pos.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{pos.name}</Text>
                  <View style={[s.typeBadge, { backgroundColor: (pos.type === 'staking' ? t.accent.green : pos.type === 'lp' ? t.accent.blue : t.accent.red) + '20' }]}>
                    <Text style={[s.typeBadgeText, { color: pos.type === 'staking' ? t.accent.green : pos.type === 'lp' ? t.accent.blue : t.accent.red }]}>
                      {typeLabel(pos.type)}
                    </Text>
                  </View>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Protocol</Text>
                  <Text style={s.value}>{pos.protocol}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Deposited</Text>
                  <Text style={s.value}>{pos.amount.toLocaleString()} {pos.token}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>APY</Text>
                  <Text style={s.apyValue}>{pos.apy}%</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Earned</Text>
                  <Text style={s.apyValue}>{pos.earned.toFixed(2)} OTK</Text>
                </View>
                <View style={s.compoundRow}>
                  <Text style={s.compoundLabel}>Auto-Compound</Text>
                  <Switch
                    value={pos.autoCompound}
                    onValueChange={() => handleToggleAutoCompound(pos.id)}
                    trackColor={{ false: t.bg.primary, true: t.accent.green + '60' }}
                    thumbColor={pos.autoCompound ? t.accent.green : t.text.muted}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={s.harvestBtn} onPress={handleHarvestAll}>
              <Text style={s.harvestBtnText}>Harvest All ({totalEarned.toFixed(2)} OTK)</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ---- Compare Tab ---- */}
        {tab === 'compare' && (
          <>
            <Text style={s.section}>Yield Comparison</Text>
            {DEMO_COMPARISONS.map((comp, i) => (
              <View key={i} style={s.compareCard}>
                <View style={s.compareHeader}>
                  <Text style={s.compareProtocol}>{comp.protocol}</Text>
                  <View style={[s.riskBadge, { backgroundColor: riskColor(comp.risk) + '20' }]}>
                    <Text style={[s.riskBadgeText, { color: riskColor(comp.risk) }]}>{comp.risk}</Text>
                  </View>
                </View>
                <Text style={s.compareApy}>{comp.apy}% APY</Text>
                <View style={s.row}>
                  <Text style={s.label}>Type</Text>
                  <Text style={s.value}>{typeLabel(comp.type)}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Token</Text>
                  <Text style={s.value}>{comp.token}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>TVL</Text>
                  <Text style={s.value}>{comp.tvl}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ---- Calculator Tab ---- */}
        {tab === 'calculator' && (
          <>
            <View style={s.calcCard}>
              <Text style={[s.calcLabel, { marginTop: 0 }]}>Deposit Amount (USD)</Text>
              <TextInput
                style={s.calcInput}
                value={calcAmount}
                onChangeText={setCalcAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={t.text.muted}
              />

              <Text style={s.calcLabel}>APY (%)</Text>
              <TextInput
                style={s.calcInput}
                value={calcApy}
                onChangeText={setCalcApy}
                keyboardType="decimal-pad"
                placeholderTextColor={t.text.muted}
              />

              <Text style={s.calcLabel}>Time Period (months)</Text>
              <TextInput
                style={s.calcInput}
                value={calcMonths}
                onChangeText={setCalcMonths}
                keyboardType="number-pad"
                placeholderTextColor={t.text.muted}
              />
            </View>

            <View style={s.resultCard}>
              <Text style={s.resultLabel}>Projected Value</Text>
              <Text style={s.resultValue}>${projectedValue.toFixed(2)}</Text>
              <Text style={s.resultSub}>
                Earnings: +${projectedEarnings.toFixed(2)} over {calcMonths} months
              </Text>
            </View>

            <View style={s.infoCard}>
              <Text style={s.infoTitle}>Auto-Compound Advantage</Text>
              <Text style={s.infoText}>
                Auto-compounding reinvests your earned rewards back into the position, earning yield on yield.{'\n\n'}
                At 12.4% APY, $10,000 becomes ~$11,240 in one year with daily compounding — versus $11,240 without. The difference grows significantly over longer periods.
              </Text>
            </View>
          </>
        )}

        {/* ---- Settings Tab ---- */}
        {tab === 'settings' && (
          <>
            <View style={s.card}>
              <View style={s.settingRow}>
                <View>
                  <Text style={s.settingLabel}>Batch Harvest</Text>
                  <Text style={s.settingDesc}>Combine all harvests into a single transaction to save gas</Text>
                </View>
                <Switch
                  value={batchHarvest}
                  onValueChange={setBatchHarvest}
                  trackColor={{ false: t.bg.primary, true: t.accent.green + '60' }}
                  thumbColor={batchHarvest ? t.accent.green : t.text.muted}
                />
              </View>

              <View style={s.settingRow}>
                <View>
                  <Text style={s.settingLabel}>Gas Optimization</Text>
                  <Text style={s.settingDesc}>Wait for low gas periods to execute auto-compounds</Text>
                </View>
                <Switch
                  value={gasOptimize}
                  onValueChange={setGasOptimize}
                  trackColor={{ false: t.bg.primary, true: t.accent.green + '60' }}
                  thumbColor={gasOptimize ? t.accent.green : t.text.muted}
                />
              </View>

              <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={s.settingLabel}>Compound Frequency</Text>
                  <Text style={s.settingDesc}>How often to reinvest earned rewards</Text>
                </View>
              </View>
              <View style={s.freqRow}>
                {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[s.freqChip, compoundFreq === f && s.freqChipActive]}
                    onPress={() => setCompoundFreq(f)}
                  >
                    <Text style={[s.freqChipText, compoundFreq === f && s.freqChipTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.infoCard}>
              <Text style={s.infoTitle}>Gas Optimization</Text>
              <Text style={s.infoText}>
                On Open Chain, gas fees are minimal by design. But when bridging to other chains, batch harvesting can save 40-60% in fees by combining multiple reward claims into a single transaction.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
