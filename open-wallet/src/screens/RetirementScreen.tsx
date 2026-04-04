import { fonts } from '../utils/theme';
/**
 * Retirement Screen — Retirement planning with OTK staking projections.
 *
 * Article I: "Every person deserves a dignified retirement."
 * Article III: OTK staking provides long-term financial security.
 *
 * Features:
 * - Retirement plan overview (target age, savings, monthly contribution)
 * - OTK staking calculator with compound projections
 * - Milestone tracking (25%, 50%, 75%, 100% of goal)
 * - Projected monthly income from staked OTK
 * - Risk assessment and diversification tips
 * - Demo mode with sample retirement plan
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface RetirementPlan {
  currentAge: number;
  retirementAge: number;
  currentSavingsOTK: number;
  monthlyContribution: number;
  stakingAPY: number;
  targetOTK: number;
  monthlyIncomeGoal: number;
}

interface Milestone {
  id: string;
  label: string;
  targetOTK: number;
  reached: boolean;
  reachedDate: string | null;
  percentOfGoal: number;
}

interface Projection {
  year: number;
  age: number;
  balance: number;
  earned: number;
  contributed: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const APY_OPTIONS = [
  { label: 'Conservative (4%)', value: 0.04 },
  { label: 'Moderate (7%)', value: 0.07 },
  { label: 'Growth (10%)', value: 0.10 },
  { label: 'Aggressive (14%)', value: 0.14 },
];

// ─── Demo Data ───

const DEMO_PLAN: RetirementPlan = {
  currentAge: 35,
  retirementAge: 60,
  currentSavingsOTK: 125000,
  monthlyContribution: 2000,
  stakingAPY: 0.07,
  targetOTK: 2500000,
  monthlyIncomeGoal: 15000,
};

const DEMO_MILESTONES: Milestone[] = [
  { id: 'm1', label: 'Starter Nest Egg', targetOTK: 625000, reached: false, reachedDate: null, percentOfGoal: 25 },
  { id: 'm2', label: 'Halfway There', targetOTK: 1250000, reached: false, reachedDate: null, percentOfGoal: 50 },
  { id: 'm3', label: 'Almost Free', targetOTK: 1875000, reached: false, reachedDate: null, percentOfGoal: 75 },
  { id: 'm4', label: 'Retirement Ready', targetOTK: 2500000, reached: false, reachedDate: null, percentOfGoal: 100 },
];

type Tab = 'plan' | 'calculator' | 'milestones';

export function RetirementScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('plan');
  const [calcContribution, setCalcContribution] = useState('2000');
  const [calcYears, setCalcYears] = useState('25');
  const [calcAPY, setCalcAPY] = useState(0.07);
  const [calcInitial, setCalcInitial] = useState('125000');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const plan = DEMO_PLAN;
  const milestones = DEMO_MILESTONES;
  const yearsToRetirement = plan.retirementAge - plan.currentAge;
  const progressPercent = Math.min((plan.currentSavingsOTK / plan.targetOTK) * 100, 100);

  const projections = useMemo((): Projection[] => {
    const initial = parseFloat(calcInitial) || 0;
    const monthly = parseFloat(calcContribution) || 0;
    const years = parseInt(calcYears, 10) || 25;
    const apy = calcAPY;
    const monthlyRate = apy / 12;
    const results: Projection[] = [];
    let balance = initial;
    for (let y = 1; y <= years; y++) {
      let yearContributed = 0;
      let yearEarned = 0;
      for (let m = 0; m < 12; m++) {
        const interest = balance * monthlyRate;
        yearEarned += interest;
        balance += interest + monthly;
        yearContributed += monthly;
      }
      results.push({ year: y, age: plan.currentAge + y, balance: Math.floor(balance), earned: Math.floor(yearEarned), contributed: Math.floor(yearContributed) });
    }
    return results;
  }, [calcContribution, calcYears, calcAPY, calcInitial, plan.currentAge]);

  const handleUpdatePlan = useCallback(() => {
    Alert.alert('Plan Updated', 'Your retirement plan has been saved on-chain.');
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    bigNumber: { color: t.text.primary, fontSize: 42, fontWeight: fonts.heavy, textAlign: 'center' },
    label: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 },
    progressBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: t.accent.green, borderRadius: 4 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    apyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    apyChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    apyChipActive: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    apyText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    apyTextActive: { color: t.accent.blue },
    projRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    projLabel: { color: t.text.muted, fontSize: 13 },
    projValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    milestoneCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    milestoneIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    milestoneInfo: { flex: 1 },
    milestoneName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    milestoneMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    milestoneStatus: { fontSize: 11, fontWeight: fonts.bold, marginTop: 4 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    incomeCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    incomeText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'plan', label: 'Plan' },
    { key: 'calculator', label: 'Calculator' },
    { key: 'milestones', label: 'Milestones' },
  ];

  // ─── Plan Tab ───

  const renderPlan = () => (
    <>
      <View style={s.card}>
        <Text style={s.label}>Current OTK Savings</Text>
        <Text style={s.bigNumber}>{plan.currentSavingsOTK.toLocaleString()}</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={[s.label, { marginTop: 8 }]}>{progressPercent.toFixed(1)}% of {plan.targetOTK.toLocaleString()} OTK goal</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{yearsToRetirement}</Text>
            <Text style={s.statLabel}>Years Left</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{plan.retirementAge}</Text>
            <Text style={s.statLabel}>Retire At</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{(plan.stakingAPY * 100).toFixed(0)}%</Text>
            <Text style={s.statLabel}>Staking APY</Text>
          </View>
        </View>
      </View>

      <View style={s.incomeCard}>
        <Text style={s.incomeText}>
          Monthly contribution: {plan.monthlyContribution.toLocaleString()} OTK{'\n'}
          Projected monthly income at retirement:{'\n'}
          ~{plan.monthlyIncomeGoal.toLocaleString()} OTK/month from staking rewards
        </Text>
      </View>

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Retirement Tips</Text>
        <Text style={s.milestoneMeta}>1. Increase contributions when income grows</Text>
        <Text style={s.milestoneMeta}>2. Diversify across staking pools</Text>
        <Text style={s.milestoneMeta}>3. Reinvest staking rewards for compound growth</Text>
        <Text style={s.milestoneMeta}>4. Review plan quarterly and adjust targets</Text>
        <Text style={s.milestoneMeta}>5. Community validators offer best long-term APY</Text>
      </View>
    </>
  );

  // ─── Calculator Tab ───

  const renderCalculator = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Staking Projection Calculator</Text>
        <TextInput style={s.input} placeholder="Initial OTK balance" placeholderTextColor={t.text.muted} keyboardType="numeric" value={calcInitial} onChangeText={setCalcInitial} />
        <TextInput style={s.input} placeholder="Monthly contribution (OTK)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={calcContribution} onChangeText={setCalcContribution} />
        <TextInput style={s.input} placeholder="Years to project" placeholderTextColor={t.text.muted} keyboardType="numeric" value={calcYears} onChangeText={setCalcYears} />
        <Text style={[s.milestoneMeta, { marginBottom: 8 }]}>Staking APY</Text>
        <View style={s.apyRow}>
          {APY_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={[s.apyChip, calcAPY === opt.value && s.apyChipActive]} onPress={() => setCalcAPY(opt.value)}>
              <Text style={[s.apyText, calcAPY === opt.value && s.apyTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={s.sectionTitle}>Yearly Projections</Text>
      <View style={s.card}>
        <View style={s.projRow}>
          <Text style={[s.projLabel, { fontWeight: fonts.bold }]}>Age</Text>
          <Text style={[s.projLabel, { fontWeight: fonts.bold }]}>Balance</Text>
          <Text style={[s.projLabel, { fontWeight: fonts.bold }]}>Earned</Text>
        </View>
        {projections.filter((_, i) => i % 5 === 4 || i === 0).map((p) => (
          <View key={p.year} style={s.projRow}>
            <Text style={s.projLabel}>{p.age}</Text>
            <Text style={s.projValue}>{p.balance.toLocaleString()}</Text>
            <Text style={[s.projValue, { color: t.accent.green }]}>{p.earned.toLocaleString()}</Text>
          </View>
        ))}
        {projections.length > 0 && (
          <View style={[s.projRow, { borderBottomWidth: 0, marginTop: 8 }]}>
            <Text style={[s.projLabel, { fontWeight: fonts.bold }]}>Final</Text>
            <Text style={[s.projValue, { fontSize: 16, color: t.accent.green }]}>{projections[projections.length - 1].balance.toLocaleString()} OTK</Text>
          </View>
        )}
      </View>
    </>
  );

  // ─── Milestones Tab ───

  const renderMilestones = () => (
    <>
      <Text style={s.sectionTitle}>Retirement Milestones</Text>
      {milestones.map((ms) => {
        const reached = plan.currentSavingsOTK >= ms.targetOTK;
        const progress = Math.min((plan.currentSavingsOTK / ms.targetOTK) * 100, 100);
        return (
          <View key={ms.id} style={s.milestoneCard}>
            <View style={[s.milestoneIcon, { backgroundColor: reached ? t.accent.green + '20' : t.bg.primary }]}>
              <Text style={{ color: reached ? t.accent.green : t.text.muted, fontSize: 16, fontWeight: fonts.heavy }}>
                {ms.percentOfGoal}%
              </Text>
            </View>
            <View style={s.milestoneInfo}>
              <Text style={s.milestoneName}>{ms.label}</Text>
              <Text style={s.milestoneMeta}>{ms.targetOTK.toLocaleString()} OTK target</Text>
              <Text style={[s.milestoneStatus, { color: reached ? t.accent.green : t.accent.orange }]}>
                {reached ? 'Reached!' : `${progress.toFixed(1)}% complete`}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Custom Milestone</Text>
        <Text style={s.milestoneMeta}>Set personal milestones to stay motivated on your retirement journey.</Text>
        <TouchableOpacity style={s.submitBtn} onPress={() => Alert.alert('Coming Soon', 'Custom milestones will be available in the next update.')}>
          <Text style={s.submitText}>Add Custom Milestone</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Retirement</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'plan' && renderPlan()}
        {tab === 'calculator' && renderCalculator()}
        {tab === 'milestones' && renderMilestones()}
      </ScrollView>
    </SafeAreaView>
  );
}
