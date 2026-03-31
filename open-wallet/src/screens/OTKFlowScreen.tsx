/**
 * OTK Flow Screen — Visualize OTK flow: where it comes from, where it goes.
 *
 * A clear picture of all OTK inflows (earned through contributions) and
 * outflows (spent, donated, transferred), plus the net balance trend.
 * "Understand the flow of value in your life."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface FlowEntry {
  id: string;
  label: string;
  amount: number;
  channel: string;
  icon: string;
  date: string;
  type: 'inflow' | 'outflow';
}

interface NetPeriod {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

const DEMO_INFLOWS: FlowEntry[] = [
  { id: 'i1', label: 'Child reading milestone', amount: 200, channel: 'Nurture', icon: '\u{1F49B}', date: '2026-03-28', type: 'inflow' },
  { id: 'i2', label: 'Mentoring session (3 students)', amount: 120, channel: 'Education', icon: '\u{1F4DA}', date: '2026-03-27', type: 'inflow' },
  { id: 'i3', label: 'Community cleanup organized', amount: 80, channel: 'Community', icon: '\u{1F91D}', date: '2026-03-26', type: 'inflow' },
  { id: 'i4', label: 'Governance vote participation', amount: 30, channel: 'Governance', icon: '\u{1F3DB}\uFE0F', date: '2026-03-25', type: 'inflow' },
  { id: 'i5', label: 'Wellness checkup verified', amount: 50, channel: 'Health', icon: '\u{1F49A}', date: '2026-03-24', type: 'inflow' },
  { id: 'i6', label: 'Financial literacy course', amount: 90, channel: 'Economic', icon: '\u{1F4B0}', date: '2026-03-23', type: 'inflow' },
  { id: 'i7', label: 'Bedtime stories (7 days)', amount: 70, channel: 'Nurture', icon: '\u{1F49B}', date: '2026-03-22', type: 'inflow' },
  { id: 'i8', label: 'Neighbor assistance', amount: 40, channel: 'Community', icon: '\u{1F91D}', date: '2026-03-21', type: 'inflow' },
];

const DEMO_OUTFLOWS: FlowEntry[] = [
  { id: 'o1', label: 'Donated to school fund', amount: 150, channel: 'Education', icon: '\u{1F3EB}', date: '2026-03-28', type: 'outflow' },
  { id: 'o2', label: 'Community garden supplies', amount: 60, channel: 'Community', icon: '\u{1F331}', date: '2026-03-27', type: 'outflow' },
  { id: 'o3', label: 'Health supplies for elderly', amount: 40, channel: 'Health', icon: '\u{1F48A}', date: '2026-03-25', type: 'outflow' },
  { id: 'o4', label: 'Language course enrollment', amount: 80, channel: 'Education', icon: '\u{1F4D6}', date: '2026-03-23', type: 'outflow' },
  { id: 'o5', label: 'Transfer to family member', amount: 100, channel: 'Economic', icon: '\u{1F4B8}', date: '2026-03-21', type: 'outflow' },
];

const NET_PERIODS: NetPeriod[] = [
  { period: 'This Week', inflow: 430, outflow: 250, net: 180 },
  { period: 'Last Week', inflow: 350, outflow: 180, net: 170 },
  { period: 'Week 3', inflow: 410, outflow: 200, net: 210 },
  { period: 'Week 2', inflow: 290, outflow: 140, net: 150 },
  { period: 'Week 1', inflow: 320, outflow: 160, net: 160 },
];

export function OTKFlowScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'inflow' | 'outflow' | 'net'>('inflow');

  const totalInflow = useMemo(() => DEMO_INFLOWS.reduce((a, e) => a + e.amount, 0), []);
  const totalOutflow = useMemo(() => DEMO_OUTFLOWS.reduce((a, e) => a + e.amount, 0), []);
  const netFlow = totalInflow - totalOutflow;

  const inflowByChannel = useMemo(() => {
    const map: Record<string, number> = {};
    DEMO_INFLOWS.forEach(e => { map[e.channel] = (map[e.channel] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const outflowByChannel = useMemo(() => {
    const map: Record<string, number> = {};
    DEMO_OUTFLOWS.forEach(e => { map[e.channel] = (map[e.channel] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: '700' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 14, padding: 16, alignItems: 'center' },
    summaryNum: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', marginBottom: 12 },
    flowCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    flowIcon: { fontSize: 24 },
    flowInfo: { flex: 1 },
    flowLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    flowMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    flowAmount: { fontSize: 16, fontWeight: '800' },
    channelBreakdown: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 20 },
    breakdownTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    breakdownLabel: { flex: 1, color: t.text.primary, fontSize: 13, fontWeight: '600' },
    breakdownVal: { fontSize: 14, fontWeight: '800', marginRight: 8 },
    breakdownBarBg: { flex: 2, height: 8, backgroundColor: t.border, borderRadius: 4, overflow: 'hidden' },
    breakdownBarFill: { height: 8, borderRadius: 4 },
    netCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    netPeriod: { flex: 1, color: t.text.primary, fontSize: 14, fontWeight: '600' },
    netIn: { color: t.accent.green, fontSize: 13, fontWeight: '700', width: 60, textAlign: 'right' },
    netOut: { color: '#ef4444', fontSize: 13, fontWeight: '700', width: 60, textAlign: 'right' },
    netVal: { fontSize: 14, fontWeight: '800', width: 70, textAlign: 'right' },
    netHeader: { flexDirection: 'row', backgroundColor: t.bg.card, borderRadius: 10, padding: 12, marginBottom: 8 },
    netHeaderLabel: { color: t.text.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    balanceCard: { backgroundColor: t.accent.green + '12', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: t.accent.green + '30' },
    balanceNum: { fontSize: 36, fontWeight: '900' },
    balanceLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 4 },
  }), [t]);

  const maxInflow = inflowByChannel.length > 0 ? inflowByChannel[0][1] : 1;
  const maxOutflow = outflowByChannel.length > 0 ? outflowByChannel[0][1] : 1;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>OTK Flow</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        <Text style={s.quote}>"Understand the flow of value in your life."</Text>

        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={[s.summaryNum, { color: t.accent.green }]}>+{totalInflow}</Text>
            <Text style={s.summaryLabel}>Total Inflow</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryNum, { color: '#ef4444' }]}>-{totalOutflow}</Text>
            <Text style={s.summaryLabel}>Total Outflow</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryNum, { color: netFlow >= 0 ? t.accent.green : '#ef4444' }]}>{netFlow >= 0 ? '+' : ''}{netFlow}</Text>
            <Text style={s.summaryLabel}>Net Flow</Text>
          </View>
        </View>

        <View style={s.tabRow}>
          {(['inflow', 'outflow', 'net'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === 'inflow' ? 'Inflow' : tab === 'outflow' ? 'Outflow' : 'Net'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'inflow' && (
          <>
            <View style={s.channelBreakdown}>
              <Text style={s.breakdownTitle}>Inflow by Channel</Text>
              {inflowByChannel.map(([ch, val]) => (
                <View key={ch} style={s.breakdownRow}>
                  <Text style={s.breakdownLabel}>{ch}</Text>
                  <Text style={[s.breakdownVal, { color: t.accent.green }]}>{val}</Text>
                  <View style={s.breakdownBarBg}>
                    <View style={[s.breakdownBarFill, { width: `${(val / maxInflow) * 100}%`, backgroundColor: t.accent.green }]} />
                  </View>
                </View>
              ))}
            </View>
            <Text style={s.sectionTitle}>Recent Inflows</Text>
            {DEMO_INFLOWS.map(e => (
              <View key={e.id} style={s.flowCard}>
                <Text style={s.flowIcon}>{e.icon}</Text>
                <View style={s.flowInfo}>
                  <Text style={s.flowLabel}>{e.label}</Text>
                  <Text style={s.flowMeta}>{e.channel} \u00B7 {e.date}</Text>
                </View>
                <Text style={[s.flowAmount, { color: t.accent.green }]}>+{e.amount}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === 'outflow' && (
          <>
            <View style={s.channelBreakdown}>
              <Text style={s.breakdownTitle}>Outflow by Channel</Text>
              {outflowByChannel.map(([ch, val]) => (
                <View key={ch} style={s.breakdownRow}>
                  <Text style={s.breakdownLabel}>{ch}</Text>
                  <Text style={[s.breakdownVal, { color: '#ef4444' }]}>{val}</Text>
                  <View style={s.breakdownBarBg}>
                    <View style={[s.breakdownBarFill, { width: `${(val / maxOutflow) * 100}%`, backgroundColor: '#ef4444' }]} />
                  </View>
                </View>
              ))}
            </View>
            <Text style={s.sectionTitle}>Recent Outflows</Text>
            {DEMO_OUTFLOWS.map(e => (
              <View key={e.id} style={s.flowCard}>
                <Text style={s.flowIcon}>{e.icon}</Text>
                <View style={s.flowInfo}>
                  <Text style={s.flowLabel}>{e.label}</Text>
                  <Text style={s.flowMeta}>{e.channel} \u00B7 {e.date}</Text>
                </View>
                <Text style={[s.flowAmount, { color: '#ef4444' }]}>-{e.amount}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === 'net' && (
          <>
            <View style={s.balanceCard}>
              <Text style={[s.balanceNum, { color: t.accent.green }]}>+{netFlow} OTK</Text>
              <Text style={s.balanceLabel}>Net flow this month</Text>
            </View>
            <Text style={s.sectionTitle}>Weekly Net Flow</Text>
            <View style={s.netHeader}>
              <Text style={[s.netHeaderLabel, { flex: 1 }]}>Period</Text>
              <Text style={[s.netHeaderLabel, { width: 60, textAlign: 'right' }]}>In</Text>
              <Text style={[s.netHeaderLabel, { width: 60, textAlign: 'right' }]}>Out</Text>
              <Text style={[s.netHeaderLabel, { width: 70, textAlign: 'right' }]}>Net</Text>
            </View>
            {NET_PERIODS.map(p => (
              <View key={p.period} style={s.netCard}>
                <Text style={s.netPeriod}>{p.period}</Text>
                <Text style={s.netIn}>+{p.inflow}</Text>
                <Text style={s.netOut}>-{p.outflow}</Text>
                <Text style={[s.netVal, { color: p.net >= 0 ? t.accent.green : '#ef4444' }]}>
                  {p.net >= 0 ? '+' : ''}{p.net}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
