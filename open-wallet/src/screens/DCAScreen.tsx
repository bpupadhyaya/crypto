/**
 * DCA Screen — Dollar-cost averaging automation.
 *
 * Schedule recurring buys for any token with configurable frequency.
 * Demo mode returns realistic mock data without executing real trades.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface DCAPlan {
  id: string;
  token: string;
  amountPerPeriod: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  fundingSource: string;
  startDate: string;
  totalInvested: number;
  active: boolean;
}

interface DCAExecution {
  id: string;
  planId: string;
  token: string;
  amount: number;
  price: number;
  date: string;
}

interface DCAPerformance {
  planId: string;
  token: string;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface Props {
  onClose: () => void;
}

const DEMO_PLANS: DCAPlan[] = [
  {
    id: 'dca-1',
    token: 'BTC',
    amountPerPeriod: 25,
    frequency: 'weekly',
    fundingSource: 'USDC Balance',
    startDate: '2026-01-06',
    totalInvested: 300,
    active: true,
  },
  {
    id: 'dca-2',
    token: 'ETH',
    amountPerPeriod: 100,
    frequency: 'monthly',
    fundingSource: 'USDC Balance',
    startDate: '2026-01-01',
    totalInvested: 300,
    active: true,
  },
];

const DEMO_PERFORMANCE: DCAPerformance[] = [
  {
    planId: 'dca-1',
    token: 'BTC',
    avgBuyPrice: 64_250,
    currentPrice: 68_900,
    totalInvested: 300,
    currentValue: 321.72,
    gainLoss: 21.72,
    gainLossPercent: 7.24,
  },
  {
    planId: 'dca-2',
    token: 'ETH',
    avgBuyPrice: 3_180,
    currentPrice: 3_420,
    totalInvested: 300,
    currentValue: 322.64,
    gainLoss: 22.64,
    gainLossPercent: 7.55,
  },
];

const DEMO_HISTORY: DCAExecution[] = [
  { id: 'ex-1', planId: 'dca-1', token: 'BTC', amount: 25, price: 63_800, date: '2026-03-24' },
  { id: 'ex-2', planId: 'dca-1', token: 'BTC', amount: 25, price: 64_100, date: '2026-03-17' },
  { id: 'ex-3', planId: 'dca-1', token: 'BTC', amount: 25, price: 65_200, date: '2026-03-10' },
  { id: 'ex-4', planId: 'dca-1', token: 'BTC', amount: 25, price: 63_500, date: '2026-03-03' },
  { id: 'ex-5', planId: 'dca-2', token: 'ETH', amount: 100, price: 3_150, date: '2026-03-01' },
  { id: 'ex-6', planId: 'dca-2', token: 'ETH', amount: 100, price: 3_210, date: '2026-02-01' },
  { id: 'ex-7', planId: 'dca-2', token: 'ETH', amount: 100, price: 3_180, date: '2026-01-01' },
];

const SUPPORTED_TOKENS = ['BTC', 'ETH', 'OTK', 'SOL', 'USDC'];
const FREQUENCIES: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

export function DCAScreen({ onClose }: Props) {
  const [tab, setTab] = useState<'plans' | 'create' | 'performance' | 'history'>('plans');
  const [plans, setPlans] = useState<DCAPlan[]>(DEMO_PLANS);
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  // Create plan form state
  const [newToken, setNewToken] = useState('BTC');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const totalInvestedAll = useMemo(
    () => plans.reduce((sum, p) => sum + p.totalInvested, 0),
    [plans],
  );

  const handleCreatePlan = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newAmount.trim() || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount per period.');
      return;
    }

    const plan: DCAPlan = {
      id: `dca-${Date.now()}`,
      token: newToken,
      amountPerPeriod: amount,
      frequency: newFrequency,
      fundingSource: 'USDC Balance',
      startDate: new Date().toISOString().split('T')[0],
      totalInvested: 0,
      active: true,
    };

    setPlans((prev) => [...prev, plan]);
    setNewAmount('');
    setTab('plans');
    Alert.alert(
      'DCA Plan Created',
      `${newFrequency.charAt(0).toUpperCase() + newFrequency.slice(1)} buy of $${amount} in ${newToken} starts today${demoMode ? ' (demo)' : ''}.`,
    );
  }, [newToken, newAmount, newFrequency, demoMode]);

  const handleTogglePlan = useCallback((planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, active: !p.active } : p)),
    );
  }, []);

  const handleDeletePlan = useCallback((planId: string, token: string) => {
    Alert.alert('Delete Plan', `Stop DCA for ${token}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setPlans((prev) => prev.filter((p) => p.id !== planId)),
      },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    summaryCard: { backgroundColor: t.accent.blue + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
    summaryLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    summaryValue: { color: t.accent.blue, fontSize: 36, fontWeight: '800', marginTop: 4 },
    summarySubtext: { color: t.text.secondary, fontSize: 14, marginTop: 8 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeActive: { backgroundColor: t.accent.green + '20' },
    badgeInactive: { backgroundColor: t.accent.red + '20' },
    badgeTextActive: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    badgeTextInactive: { color: t.accent.red, fontSize: 11, fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    label: { color: t.text.muted, fontSize: 13 },
    value: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
    toggleBtn: { flex: 1, backgroundColor: t.accent.blue + '20', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    toggleBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: '700' },
    deleteBtn: { backgroundColor: t.accent.red + '20', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
    deleteBtnText: { color: t.accent.red, fontSize: 13, fontWeight: '700' },
    formCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    formLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    formInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tokenChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.primary },
    tokenChipActive: { backgroundColor: t.accent.blue },
    tokenChipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    tokenChipTextActive: { color: '#fff' },
    freqRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    freqChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.primary, alignItems: 'center' },
    freqChipActive: { backgroundColor: t.accent.blue },
    freqChipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    freqChipTextActive: { color: '#fff' },
    createBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    createBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    gainPositive: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    gainNegative: { color: t.accent.red, fontSize: 13, fontWeight: '700' },
    perfValue: { color: t.text.primary, fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 4 },
    historyPrice: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    historyDate: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    infoCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12 },
    infoTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
    infoText: { color: t.text.muted, fontSize: 13, lineHeight: 20 },
  }), [t]);

  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: 'plans', label: 'Plans' },
    { key: 'create', label: 'Create' },
    { key: 'performance', label: 'Stats' },
    { key: 'history', label: 'History' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Dollar-Cost Averaging</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Total DCA Invested</Text>
        <Text style={s.summaryValue}>${totalInvestedAll.toFixed(0)}</Text>
        <Text style={s.summarySubtext}>{plans.filter((p) => p.active).length} active plan{plans.filter((p) => p.active).length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {/* ---- Plans Tab ---- */}
        {tab === 'plans' && (
          <>
            <Text style={s.section}>Active Plans</Text>
            {plans.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>📅</Text>
                <Text style={s.emptyText}>
                  No DCA plans yet.{'\n'}Create one to start building positions automatically.
                </Text>
              </View>
            ) : (
              plans.map((plan) => (
                <View key={plan.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle}>{plan.token} — ${plan.amountPerPeriod}/{plan.frequency}</Text>
                    <View style={[s.badge, plan.active ? s.badgeActive : s.badgeInactive]}>
                      <Text style={plan.active ? s.badgeTextActive : s.badgeTextInactive}>
                        {plan.active ? 'Active' : 'Paused'}
                      </Text>
                    </View>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>Funding Source</Text>
                    <Text style={s.value}>{plan.fundingSource}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>Start Date</Text>
                    <Text style={s.value}>{plan.startDate}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>Total Invested</Text>
                    <Text style={s.value}>${plan.totalInvested.toFixed(2)}</Text>
                  </View>
                  <View style={s.actionRow}>
                    <TouchableOpacity style={s.toggleBtn} onPress={() => handleTogglePlan(plan.id)}>
                      <Text style={s.toggleBtnText}>{plan.active ? 'Pause' : 'Resume'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeletePlan(plan.id, plan.token)}>
                      <Text style={s.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ---- Create Tab ---- */}
        {tab === 'create' && (
          <>
            <View style={s.formCard}>
              <Text style={[s.formLabel, { marginTop: 0 }]}>Select Token</Text>
              <View style={s.tokenRow}>
                {SUPPORTED_TOKENS.map((tk) => (
                  <TouchableOpacity
                    key={tk}
                    style={[s.tokenChip, newToken === tk && s.tokenChipActive]}
                    onPress={() => setNewToken(tk)}
                  >
                    <Text style={[s.tokenChipText, newToken === tk && s.tokenChipTextActive]}>{tk}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>Amount per Period (USD)</Text>
              <TextInput
                style={s.formInput}
                placeholder="25.00"
                placeholderTextColor={t.text.muted}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="decimal-pad"
              />

              <Text style={s.formLabel}>Frequency</Text>
              <View style={s.freqRow}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[s.freqChip, newFrequency === f && s.freqChipActive]}
                    onPress={() => setNewFrequency(f)}
                  >
                    <Text style={[s.freqChipText, newFrequency === f && s.freqChipTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.createBtn} onPress={handleCreatePlan}>
              <Text style={s.createBtnText}>Create DCA Plan</Text>
            </TouchableOpacity>

            <View style={s.infoCard}>
              <Text style={s.infoTitle}>How DCA Works</Text>
              <Text style={s.infoText}>
                Dollar-cost averaging spreads your purchases over time, buying at regular intervals regardless of price.{'\n\n'}
                This reduces the impact of volatility — you buy more when prices are low and less when they are high, resulting in a lower average cost over time.
              </Text>
            </View>
          </>
        )}

        {/* ---- Performance Tab ---- */}
        {tab === 'performance' && (
          <>
            <Text style={s.section}>Plan Performance</Text>
            {DEMO_PERFORMANCE.map((perf) => (
              <View key={perf.planId} style={s.card}>
                <Text style={s.cardTitle}>{perf.token}</Text>
                <Text style={s.perfValue}>${perf.currentValue.toFixed(2)}</Text>
                <View style={s.row}>
                  <Text style={s.label}>Avg Buy Price</Text>
                  <Text style={s.value}>${perf.avgBuyPrice.toLocaleString()}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Current Price</Text>
                  <Text style={s.value}>${perf.currentPrice.toLocaleString()}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Total Invested</Text>
                  <Text style={s.value}>${perf.totalInvested.toFixed(2)}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Gain / Loss</Text>
                  <Text style={perf.gainLoss >= 0 ? s.gainPositive : s.gainNegative}>
                    {perf.gainLoss >= 0 ? '+' : ''}${perf.gainLoss.toFixed(2)} ({perf.gainLossPercent.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ---- History Tab ---- */}
        {tab === 'history' && (
          <>
            <Text style={s.section}>Execution History</Text>
            {DEMO_HISTORY.map((ex) => (
              <View key={ex.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{ex.token}</Text>
                  <Text style={s.historyPrice}>${ex.amount.toFixed(2)}</Text>
                </View>
                <View style={s.row}>
                  <Text style={s.label}>Price at Execution</Text>
                  <Text style={s.value}>${ex.price.toLocaleString()}</Text>
                </View>
                <Text style={s.historyDate}>{ex.date}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
