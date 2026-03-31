/**
 * Impact Calculator — Calculate the ripple impact of your contributions.
 *
 * Every OTK contribution creates a ripple effect. A mentoring session
 * doesn't just help one person — it creates downstream value as that
 * person helps others. This screen quantifies that chain of impact.
 *
 * Features:
 * - Calculate: input a contribution and see projected ripple effect
 * - Ripple: visualize how your existing contributions have multiplied
 * - Compare: benchmark your impact against community averages
 * - Demo mode with sample impact data
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

type ImpactTab = 'calculate' | 'ripple' | 'compare';

interface RippleEntry {
  id: string;
  originalAction: string;
  channel: string;
  icon: string;
  directOTK: number;
  rippleMultiplier: number;
  totalImpact: number;
  peopleReached: number;
  generations: number;
  timestamp: string;
}

interface CompareMetric {
  label: string;
  yours: number;
  communityAvg: number;
  unit: string;
  icon: string;
}

interface CalculatorOption {
  label: string;
  channel: string;
  icon: string;
  baseOTK: number;
  multiplier: number;
  reach: number;
}

const CALCULATOR_OPTIONS: CalculatorOption[] = [
  { label: 'Mentor a student (1 hour)', channel: 'nurture', icon: '\u{1F49B}', baseOTK: 150, multiplier: 3.2, reach: 8 },
  { label: 'Teach a workshop (2 hours)', channel: 'education', icon: '\u{1F4DA}', baseOTK: 300, multiplier: 4.5, reach: 25 },
  { label: 'Organize community cleanup', channel: 'community', icon: '\u{1F91D}', baseOTK: 200, multiplier: 2.8, reach: 40 },
  { label: 'Lead a wellness session', channel: 'health', icon: '\u{1FA7A}', baseOTK: 180, multiplier: 2.5, reach: 15 },
  { label: 'Draft governance proposal', channel: 'governance', icon: '\u{1F5F3}', baseOTK: 250, multiplier: 5.0, reach: 500 },
  { label: 'Fund community project', channel: 'economic', icon: '\u{1F4B0}', baseOTK: 500, multiplier: 3.8, reach: 100 },
];

const DEMO_RIPPLES: RippleEntry[] = [
  { id: 'r1', originalAction: 'Mentored 3 students in coding', channel: 'education', icon: '\u{1F4DA}', directOTK: 450, rippleMultiplier: 4.2, totalImpact: 1890, peopleReached: 37, generations: 3, timestamp: '2 weeks ago' },
  { id: 'r2', originalAction: 'Led parenting workshop', channel: 'nurture', icon: '\u{1F49B}', directOTK: 300, rippleMultiplier: 3.5, totalImpact: 1050, peopleReached: 22, generations: 2, timestamp: '1 month ago' },
  { id: 'r3', originalAction: 'Organized neighborhood watch', channel: 'community', icon: '\u{1F91D}', directOTK: 200, rippleMultiplier: 2.9, totalImpact: 580, peopleReached: 45, generations: 2, timestamp: '1 month ago' },
  { id: 'r4', originalAction: 'Published health guide', channel: 'health', icon: '\u{1FA7A}', directOTK: 250, rippleMultiplier: 5.1, totalImpact: 1275, peopleReached: 120, generations: 4, timestamp: '2 months ago' },
  { id: 'r5', originalAction: 'Voted on 12 proposals', channel: 'governance', icon: '\u{1F5F3}', directOTK: 120, rippleMultiplier: 6.0, totalImpact: 720, peopleReached: 2000, generations: 1, timestamp: '3 months ago' },
];

const DEMO_COMPARE: CompareMetric[] = [
  { label: 'Ripple Multiplier', yours: 3.8, communityAvg: 2.4, unit: 'x', icon: '\u{1F30A}' },
  { label: 'People Reached', yours: 224, communityAvg: 85, unit: '', icon: '\u{1F465}' },
  { label: 'Total Impact OTK', yours: 5515, communityAvg: 2100, unit: 'OTK', icon: '\u{2B50}' },
  { label: 'Active Channels', yours: 5, communityAvg: 2.3, unit: '', icon: '\u{1F4CA}' },
  { label: 'Ripple Generations', yours: 4, communityAvg: 1.8, unit: 'gen', icon: '\u{1F333}' },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ImpactCalculatorScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<ImpactTab>('calculate');
  const [selectedOption, setSelectedOption] = useState<CalculatorOption | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    optionLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    resultCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: t.accent.green + '30' },
    resultTitle: { color: t.accent.green, fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    resultNum: { fontSize: 28, fontWeight: '900', color: t.accent.green, textAlign: 'center' },
    resultSubtext: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    compareYours: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    compareAvg: { color: t.text.muted, fontSize: 14, fontWeight: '600' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 15 },
  }), [t]);

  const ripples = demoMode ? DEMO_RIPPLES : [];
  const compareMetrics = demoMode ? DEMO_COMPARE : [];
  const totalDirectOTK = ripples.reduce((s, r) => s + r.directOTK, 0);
  const totalImpact = ripples.reduce((s, r) => s + r.totalImpact, 0);
  const totalReached = ripples.reduce((s, r) => s + r.peopleReached, 0);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Impact Calculator</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Every contribution creates a ripple. See how your impact multiplies through the community.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{formatNum(totalDirectOTK)}</Text>
              <Text style={st.summaryLabel}>Direct OTK</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{formatNum(totalImpact)}</Text>
              <Text style={st.summaryLabel}>Total Impact</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{formatNum(totalReached)}</Text>
              <Text style={st.summaryLabel}>People Reached</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['calculate', 'ripple', 'compare'] as ImpactTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'calculate' && (
          selectedOption ? (
            <>
              <View style={st.resultCard}>
                <Text style={st.resultTitle}>Projected Ripple Impact</Text>
                <Text style={st.resultNum}>{formatNum(Math.round(selectedOption.baseOTK * selectedOption.multiplier))} OTK</Text>
                <Text style={st.resultSubtext}>from {selectedOption.baseOTK} direct OTK</Text>
              </View>
              <View style={st.card}>
                <View style={st.row}><Text style={st.label}>Action</Text><Text style={st.val}>{selectedOption.label}</Text></View>
                <View style={st.row}><Text style={st.label}>Direct OTK</Text><Text style={st.val}>{selectedOption.baseOTK}</Text></View>
                <View style={st.row}><Text style={st.label}>Ripple Multiplier</Text><Text style={st.val}>{selectedOption.multiplier}x</Text></View>
                <View style={st.row}><Text style={st.label}>Est. People Reached</Text><Text style={st.val}>{selectedOption.reach}</Text></View>
                <View style={st.row}><Text style={st.label}>Channel</Text><Text style={st.val}>{selectedOption.icon} {selectedOption.channel}</Text></View>
              </View>
              <TouchableOpacity style={st.backBtn} onPress={() => setSelectedOption(null)}>
                <Text style={st.backText}>Try Another Action</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={st.section}>Choose an action to calculate</Text>
              {CALCULATOR_OPTIONS.map((opt, i) => (
                <TouchableOpacity key={i} style={st.card} onPress={() => setSelectedOption(opt)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{opt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={st.optionLabel}>{opt.label}</Text>
                      <Text style={st.label}>{opt.baseOTK} base OTK | {opt.multiplier}x multiplier</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )
        )}

        {activeTab === 'ripple' && (
          ripples.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see your ripple history.</Text>
          ) : ripples.map(r => (
            <View key={r.id} style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700' }}>{r.originalAction}</Text>
                  <Text style={{ color: t.text.muted, fontSize: 11 }}>{r.timestamp}</Text>
                </View>
              </View>
              <View style={st.row}><Text style={st.label}>Direct</Text><Text style={st.val}>{r.directOTK} OTK</Text></View>
              <View style={st.row}><Text style={st.label}>Multiplier</Text><Text style={{ color: t.accent.green, fontSize: 12, fontWeight: '700' }}>{r.rippleMultiplier}x</Text></View>
              <View style={st.row}><Text style={st.label}>Total Impact</Text><Text style={{ color: t.accent.green, fontSize: 14, fontWeight: '800' }}>{formatNum(r.totalImpact)} OTK</Text></View>
              <View style={st.row}><Text style={st.label}>People Reached</Text><Text style={st.val}>{r.peopleReached}</Text></View>
              <View style={st.row}><Text style={st.label}>Ripple Generations</Text><Text style={st.val}>{r.generations}</Text></View>
            </View>
          ))
        )}

        {activeTab === 'compare' && (
          compareMetrics.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see comparison data.</Text>
          ) : compareMetrics.map((m, i) => {
            const pct = m.communityAvg > 0 ? Math.min((m.yours / (m.communityAvg * 2)) * 100, 100) : 50;
            return (
              <View key={i} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{m.icon}</Text>
                  <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 }}>{m.label}</Text>
                </View>
                <View style={st.row}>
                  <View><Text style={st.label}>You</Text><Text style={st.compareYours}>{m.yours}{m.unit}</Text></View>
                  <View style={{ alignItems: 'flex-end' }}><Text style={st.label}>Community Avg</Text><Text style={st.compareAvg}>{m.communityAvg}{m.unit}</Text></View>
                </View>
                <View style={st.barContainer}>
                  <View style={[st.barFill, { width: `${pct}%`, backgroundColor: t.accent.green }]} />
                </View>
              </View>
            );
          })
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample impact data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
