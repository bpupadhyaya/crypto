/**
 * Staking Calculator Screen — Project staking rewards.
 *
 * Calculates projected rewards based on amount, token, and period.
 * Shows APY breakdown (base + channel + gratitude bonuses),
 * compound vs simple comparison, and validator selection.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Validator {
  id: string;
  name: string;
  baseApy: number;
  commission: number;
  uptime: number;
  totalStaked: number;
}

interface RewardProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

// --- Constants ---

const STAKING_PERIODS = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
  { label: '1 year', days: 365 },
];

const TOKENS = ['OTK', 'nOTK'];

const DEMO_VALIDATORS: Validator[] = [
  { id: 'v_001', name: 'Open Chain Genesis', baseApy: 5.0, commission: 2.0, uptime: 99.9, totalStaked: 5_000_000 },
  { id: 'v_002', name: 'Community Node Alpha', baseApy: 5.0, commission: 3.0, uptime: 99.5, totalStaked: 2_500_000 },
  { id: 'v_003', name: 'Nurture Validator', baseApy: 5.0, commission: 1.5, uptime: 99.8, totalStaked: 3_200_000 },
  { id: 'v_004', name: 'Peace Index Node', baseApy: 5.0, commission: 5.0, uptime: 98.7, totalStaked: 800_000 },
];

// Demo bonuses
const CHANNEL_BONUS = 1.5;    // % from channel participation
const GRATITUDE_BONUS = 1.5;  // % from gratitude wall contributions

// --- Helpers ---

function calcEffectiveApy(base: number, commission: number): number {
  return base * (1 - commission / 100) + CHANNEL_BONUS + GRATITUDE_BONUS;
}

function calcSimpleRewards(principal: number, apy: number, days: number): RewardProjection {
  const dailyRate = apy / 100 / 365;
  const daily = principal * dailyRate;
  return {
    daily,
    weekly: daily * 7,
    monthly: daily * 30,
    yearly: principal * apy / 100,
  };
}

function calcCompoundRewards(principal: number, apy: number, days: number): RewardProjection {
  const dailyRate = apy / 100 / 365;
  const compoundedTotal = principal * Math.pow(1 + dailyRate, days);
  const totalReward = compoundedTotal - principal;
  const yearlyCompounded = principal * Math.pow(1 + dailyRate, 365) - principal;
  return {
    daily: totalReward / days,
    weekly: (totalReward / days) * 7,
    monthly: (totalReward / days) * 30,
    yearly: yearlyCompounded,
  };
}

function formatNum(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function StakingCalcScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();

  // Demo defaults: 10,000 OTK, first validator, 1 year
  const [amount] = useState(10_000);
  const [token] = useState('OTK');
  const [periodIdx, setPeriodIdx] = useState(3); // 1 year
  const [validatorIdx, setValidatorIdx] = useState(0);

  const period = STAKING_PERIODS[periodIdx];
  const validator = DEMO_VALIDATORS[validatorIdx];
  const effectiveApy = useMemo(
    () => calcEffectiveApy(validator.baseApy, validator.commission),
    [validator],
  );

  const simple = useMemo(
    () => calcSimpleRewards(amount, effectiveApy, period.days),
    [amount, effectiveApy, period.days],
  );

  const compound = useMemo(
    () => calcCompoundRewards(amount, effectiveApy, period.days),
    [amount, effectiveApy, period.days],
  );

  const apyBreakdown = useMemo(() => {
    const netBase = validator.baseApy * (1 - validator.commission / 100);
    return {
      base: validator.baseApy,
      afterCommission: netBase,
      channelBonus: CHANNEL_BONUS,
      gratitudeBonus: GRATITUDE_BONUS,
      effective: netBase + CHANNEL_BONUS + GRATITUDE_BONUS,
    };
  }, [validator]);

  // Historical demo: last 6 months earnings
  const historicalData = useMemo(() => [
    { month: 'Oct 2025', earned: 62 },
    { month: 'Nov 2025', earned: 65 },
    { month: 'Dec 2025', earned: 68 },
    { month: 'Jan 2026', earned: 64 },
    { month: 'Feb 2026', earned: 67 },
    { month: 'Mar 2026', earned: 70 },
  ], []);

  const maxHistorical = useMemo(
    () => Math.max(...historicalData.map(d => d.earned)),
    [historicalData],
  );

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },

    // Demo banner
    demoBanner: { backgroundColor: t.accent.orange + '20', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 12, fontWeight: '600' },

    // Input summary
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 4 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    inputLabel: { color: t.text.secondary, fontSize: 13 },
    inputValue: { color: t.text.primary, fontSize: 16, fontWeight: '700' },

    // Period selector
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    periodBtnActive: { backgroundColor: t.accent.blue },
    periodText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    periodTextActive: { color: '#ffffff' },

    // APY breakdown
    apyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    apyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    apyLabel: { color: t.text.secondary, fontSize: 13 },
    apyValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    apyBonus: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    apyDivider: { height: 1, backgroundColor: t.bg.primary, marginVertical: 8 },
    apyTotal: { color: t.accent.green, fontSize: 18, fontWeight: '700' },

    // Projections
    projCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    projHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    projColTitle: { color: t.text.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', flex: 1, textAlign: 'center' },
    projColTitleFirst: { textAlign: 'left' },
    projRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    projPeriod: { color: t.text.secondary, fontSize: 13, flex: 1 },
    projSimple: { color: t.text.primary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'center' },
    projCompound: { color: t.accent.green, fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'center' },

    // Compound advantage
    advantageRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: t.accent.green + '12', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10 },
    advantageText: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginLeft: 6 },

    // Validator list
    validatorCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    validatorCardActive: { borderWidth: 2, borderColor: t.accent.blue },
    validatorName: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
    validatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    validatorLabel: { color: t.text.muted, fontSize: 12 },
    validatorValue: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    validatorApy: { color: t.accent.green, fontSize: 12, fontWeight: '700' },

    // Historical chart (simple bar)
    chartCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, marginBottom: 8 },
    chartBarWrap: { alignItems: 'center', flex: 1 },
    chartBar: { width: 24, borderRadius: 6, backgroundColor: t.accent.blue },
    chartLabel: { color: t.text.muted, fontSize: 9, marginTop: 4 },
    chartValue: { color: t.text.secondary, fontSize: 10, fontWeight: '600', marginBottom: 2 },
    chartTotal: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    chartTotalText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
  }), [t]);

  const compoundAdvantage = compound.yearly - simple.yearly;

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>Staking Calculator</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Demo banner */}
        {demoMode && (
          <View style={st.demoBanner}>
            <Text style={st.demoText}>Demo Mode — 10,000 OTK at 8% effective APY</Text>
          </View>
        )}

        {/* Input summary */}
        <View style={st.inputCard}>
          <View style={st.inputRow}>
            <Text style={st.inputLabel}>Stake Amount</Text>
            <Text style={st.inputValue}>{amount.toLocaleString()} {token}</Text>
          </View>
          <View style={st.inputRow}>
            <Text style={st.inputLabel}>Staking Period</Text>
            <Text style={st.inputValue}>{period.label}</Text>
          </View>
          <View style={[st.inputRow, { marginBottom: 0 }]}>
            <Text style={st.inputLabel}>Effective APY</Text>
            <Text style={[st.inputValue, { color: t.accent.green }]}>{effectiveApy.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Period selector */}
        <Text style={st.section}>Staking Period</Text>
        <View style={st.periodRow}>
          {STAKING_PERIODS.map((p, i) => (
            <TouchableOpacity
              key={p.days}
              style={[st.periodBtn, periodIdx === i && st.periodBtnActive]}
              onPress={() => setPeriodIdx(i)}
            >
              <Text style={[st.periodText, periodIdx === i && st.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* APY Breakdown */}
        <Text style={st.section}>APY Breakdown</Text>
        <View style={st.apyCard}>
          <View style={st.apyRow}>
            <Text style={st.apyLabel}>Base APY</Text>
            <Text style={st.apyValue}>{apyBreakdown.base.toFixed(1)}%</Text>
          </View>
          <View style={st.apyRow}>
            <Text style={st.apyLabel}>Commission ({validator.commission}%)</Text>
            <Text style={st.apyValue}>-{(apyBreakdown.base - apyBreakdown.afterCommission).toFixed(2)}%</Text>
          </View>
          <View style={st.apyRow}>
            <Text style={st.apyLabel}>Net Base</Text>
            <Text style={st.apyValue}>{apyBreakdown.afterCommission.toFixed(2)}%</Text>
          </View>
          <View style={st.apyDivider} />
          <View style={st.apyRow}>
            <Text style={st.apyLabel}>Channel Participation Bonus</Text>
            <Text style={st.apyBonus}>+{apyBreakdown.channelBonus.toFixed(1)}%</Text>
          </View>
          <View style={st.apyRow}>
            <Text style={st.apyLabel}>Gratitude Wall Bonus</Text>
            <Text style={st.apyBonus}>+{apyBreakdown.gratitudeBonus.toFixed(1)}%</Text>
          </View>
          <View style={st.apyDivider} />
          <View style={[st.apyRow, { marginBottom: 0 }]}>
            <Text style={[st.apyLabel, { fontWeight: '700' }]}>Effective APY</Text>
            <Text style={st.apyTotal}>{apyBreakdown.effective.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Reward Projections */}
        <Text style={st.section}>Projected Rewards</Text>
        <View style={st.projCard}>
          <View style={st.projHeader}>
            <Text style={[st.projColTitle, st.projColTitleFirst]}>Period</Text>
            <Text style={st.projColTitle}>Simple</Text>
            <Text style={st.projColTitle}>Compound</Text>
          </View>
          {([
            { label: 'Daily', s: simple.daily, c: compound.daily },
            { label: 'Weekly', s: simple.weekly, c: compound.weekly },
            { label: 'Monthly', s: simple.monthly, c: compound.monthly },
            { label: 'Yearly', s: simple.yearly, c: compound.yearly },
          ]).map(row => (
            <View key={row.label} style={st.projRow}>
              <Text style={st.projPeriod}>{row.label}</Text>
              <Text style={st.projSimple}>{formatNum(row.s)} {token}</Text>
              <Text style={st.projCompound}>{formatNum(row.c)} {token}</Text>
            </View>
          ))}
          <View style={st.advantageRow}>
            <Text style={{ fontSize: 14 }}>{'\u{1F4C8}'}</Text>
            <Text style={st.advantageText}>
              Compounding earns +{formatNum(compoundAdvantage)} {token}/year more
            </Text>
          </View>
        </View>

        {/* Validator Comparison */}
        <Text style={st.section}>Validator Comparison</Text>
        {DEMO_VALIDATORS.map((v, i) => {
          const vApy = calcEffectiveApy(v.baseApy, v.commission);
          const isActive = i === validatorIdx;
          return (
            <TouchableOpacity
              key={v.id}
              style={[st.validatorCard, isActive && st.validatorCardActive]}
              onPress={() => setValidatorIdx(i)}
            >
              <Text style={st.validatorName}>
                {isActive ? '\u{1F7E2} ' : '\u26AA '}{v.name}
              </Text>
              <View style={st.validatorRow}>
                <Text style={st.validatorLabel}>Effective APY</Text>
                <Text style={st.validatorApy}>{vApy.toFixed(1)}%</Text>
              </View>
              <View style={st.validatorRow}>
                <Text style={st.validatorLabel}>Commission</Text>
                <Text style={st.validatorValue}>{v.commission}%</Text>
              </View>
              <View style={st.validatorRow}>
                <Text style={st.validatorLabel}>Uptime</Text>
                <Text style={st.validatorValue}>{v.uptime}%</Text>
              </View>
              <View style={st.validatorRow}>
                <Text style={st.validatorLabel}>Total Staked</Text>
                <Text style={st.validatorValue}>{v.totalStaked.toLocaleString()} OTK</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Historical Rewards Chart */}
        <Text style={st.section}>Historical Rewards (6 Months)</Text>
        <View style={st.chartCard}>
          <View style={st.chartRow}>
            {historicalData.map(d => {
              const barHeight = Math.max(8, (d.earned / maxHistorical) * 80);
              return (
                <View key={d.month} style={st.chartBarWrap}>
                  <Text style={st.chartValue}>{d.earned}</Text>
                  <View style={[st.chartBar, { height: barHeight }]} />
                  <Text style={st.chartLabel}>{d.month.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
          <View style={st.chartTotal}>
            <Text style={st.chartTotalText}>
              Total earned: {historicalData.reduce((s, d) => s + d.earned, 0)} OTK over 6 months
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
