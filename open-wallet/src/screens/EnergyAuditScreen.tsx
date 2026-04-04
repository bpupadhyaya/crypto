import { fonts } from '../utils/theme';
/**
 * Energy Audit Screen — Home energy audit, efficiency tips, savings calculator.
 *
 * Features:
 * - Room-by-room energy audit checklist
 * - Efficiency tips with estimated savings
 * - Savings calculator (before/after comparison)
 * - Demo mode with sample audit data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface AuditItem {
  id: string;
  room: string;
  item: string;
  status: 'good' | 'needs-improvement' | 'critical';
  savings: number;
  recommendation: string;
}

interface EnergyTip {
  id: string;
  title: string;
  category: string;
  annualSavings: number;
  difficulty: 'easy' | 'moderate' | 'advanced';
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_AUDIT: AuditItem[] = [
  { id: '1', room: 'Kitchen', item: 'Refrigerator (15+ years old)', status: 'critical', savings: 180, recommendation: 'Replace with Energy Star model' },
  { id: '2', room: 'Kitchen', item: 'LED lighting', status: 'good', savings: 0, recommendation: 'Already efficient' },
  { id: '3', room: 'Living Room', item: 'Window insulation', status: 'needs-improvement', savings: 120, recommendation: 'Add weatherstripping' },
  { id: '4', room: 'Living Room', item: 'Smart thermostat', status: 'good', savings: 0, recommendation: 'Properly programmed' },
  { id: '5', room: 'Bedroom', item: 'Ceiling fan', status: 'good', savings: 0, recommendation: 'Good alternative to AC' },
  { id: '6', room: 'Bathroom', item: 'Water heater', status: 'needs-improvement', savings: 95, recommendation: 'Lower to 120°F, add insulation blanket' },
  { id: '7', room: 'Garage', item: 'Door seal', status: 'critical', savings: 60, recommendation: 'Replace worn garage door seal' },
  { id: '8', room: 'Attic', item: 'Insulation depth', status: 'needs-improvement', savings: 200, recommendation: 'Add R-38 insulation' },
];

const DEMO_TIPS: EnergyTip[] = [
  { id: 't1', title: 'Switch to LED bulbs', category: 'Lighting', annualSavings: 75, difficulty: 'easy', description: 'Replace all incandescent bulbs with LED. Each bulb saves ~$8/year.' },
  { id: 't2', title: 'Seal air leaks', category: 'Insulation', annualSavings: 200, difficulty: 'moderate', description: 'Use caulk and weatherstripping around windows and doors.' },
  { id: 't3', title: 'Smart power strips', category: 'Electronics', annualSavings: 100, difficulty: 'easy', description: 'Eliminate phantom loads from devices on standby.' },
  { id: 't4', title: 'Programmable thermostat', category: 'HVAC', annualSavings: 180, difficulty: 'easy', description: 'Set back 7-10°F for 8 hours/day to save up to 10%.' },
  { id: 't5', title: 'Upgrade insulation', category: 'Insulation', annualSavings: 350, difficulty: 'advanced', description: 'Add attic insulation to R-38 or higher for maximum savings.' },
  { id: 't6', title: 'Low-flow fixtures', category: 'Water', annualSavings: 60, difficulty: 'easy', description: 'Install low-flow showerheads and faucet aerators.' },
  { id: 't7', title: 'Solar water heater', category: 'Water', annualSavings: 300, difficulty: 'advanced', description: 'Pre-heat water with solar thermal panels.' },
];

const STATUS_COLORS: Record<string, string> = {
  'good': '#34C759',
  'needs-improvement': '#FF9500',
  'critical': '#FF3B30',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  'easy': '#34C759',
  'moderate': '#FF9500',
  'advanced': '#FF3B30',
};

type Tab = 'audit' | 'tips' | 'calculator';

export function EnergyAuditScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('audit');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [homeSize, setHomeSize] = useState('');
  const [homeAge, setHomeAge] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const totalSavings = useMemo(() =>
    DEMO_AUDIT.reduce((sum, a) => sum + a.savings, 0),
    [],
  );

  const handleCalculate = useCallback(() => {
    const bill = parseFloat(monthlyBill);
    if (!bill || bill <= 0) { Alert.alert('Required', 'Enter your monthly energy bill.'); return; }
    const size = parseInt(homeSize, 10) || 1500;
    const age = parseInt(homeAge, 10) || 20;
    const savingsPercent = Math.min(15 + (age > 20 ? 10 : 0) + (size > 2000 ? 5 : 0), 35);
    const monthlySaved = Math.round(bill * savingsPercent / 100);
    Alert.alert(
      'Estimated Savings',
      `Based on your $${bill}/mo bill:\n\nPotential savings: ${savingsPercent}%\nMonthly: ~$${monthlySaved}\nAnnual: ~$${monthlySaved * 12}\n\nRun a full audit for personalized recommendations.`,
    );
  }, [monthlyBill, homeSize, homeAge]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    auditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    auditInfo: { flex: 1 },
    auditItem: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    auditRoom: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    auditSaving: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    tipCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    tipMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    tipSavings: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginTop: 8 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    calcBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    calcText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'audit', label: 'Audit' },
    { key: 'tips', label: 'Tips' },
    { key: 'calculator', label: 'Calculator' },
  ];

  const renderAudit = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_AUDIT.length}</Text>
            <Text style={s.summaryLabel}>Items Checked</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: '#FF3B30' }]}>{DEMO_AUDIT.filter(a => a.status === 'critical').length}</Text>
            <Text style={s.summaryLabel}>Critical</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>${totalSavings}</Text>
            <Text style={s.summaryLabel}>Annual Savings</Text>
          </View>
        </View>
        {DEMO_AUDIT.map((item) => (
          <View key={item.id} style={s.auditRow}>
            <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <View style={s.auditInfo}>
              <Text style={s.auditItem}>{item.item}</Text>
              <Text style={s.auditRoom}>{item.room} — {item.recommendation}</Text>
            </View>
            {item.savings > 0 && (
              <Text style={s.auditSaving}>${item.savings}/yr</Text>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const renderTips = () => (
    <>
      <Text style={s.sectionTitle}>Energy Efficiency Tips</Text>
      {DEMO_TIPS.map((tip) => (
        <View key={tip.id} style={s.tipCard}>
          <Text style={s.tipTitle}>{tip.title}</Text>
          <Text style={s.tipMeta}>{tip.category} — {tip.description}</Text>
          <Text style={s.tipSavings}>Save ~${tip.annualSavings}/year</Text>
          <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[tip.difficulty] }]}>
            <Text style={s.diffText}>{tip.difficulty.toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderCalculator = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Savings Calculator</Text>
      <TextInput
        style={s.input}
        placeholder="Monthly energy bill ($)"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={monthlyBill}
        onChangeText={setMonthlyBill}
      />
      <TextInput
        style={s.input}
        placeholder="Home size (sq ft, optional)"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={homeSize}
        onChangeText={setHomeSize}
      />
      <TextInput
        style={s.input}
        placeholder="Home age in years (optional)"
        placeholderTextColor={t.text.muted}
        keyboardType="numeric"
        value={homeAge}
        onChangeText={setHomeAge}
      />
      <TouchableOpacity style={s.calcBtn} onPress={handleCalculate}>
        <Text style={s.calcText}>Calculate Savings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Energy Audit</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'audit' && renderAudit()}
        {tab === 'tips' && renderTips()}
        {tab === 'calculator' && renderCalculator()}
      </ScrollView>
    </SafeAreaView>
  );
}
