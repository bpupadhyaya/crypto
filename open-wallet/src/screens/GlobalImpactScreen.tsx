/**
 * Global Impact Screen — Worldwide impact of Open Chain.
 *
 * "Nations are measured not by GDP, but by the aggregate human value
 *  their citizens create."
 * — Human Constitution, Article X
 *
 * Shows a simplified world map colored by health score, animated global
 * counters, channel comparison chart, and the Chain of Causation
 * visualization from Article I.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Region health model ───

type HealthLevel = 'thriving' | 'moderate' | 'needs-attention';

interface Region {
  id: string;
  name: string;
  health: HealthLevel;
  peaceIndex: number;
  uids: number;
  otk: number;
}

const DEMO_REGIONS: Region[] = [
  { id: 'na', name: 'North America', health: 'thriving', peaceIndex: 78, uids: 4_200_000, otk: 18_500_000 },
  { id: 'sa', name: 'South America', health: 'moderate', peaceIndex: 62, uids: 2_800_000, otk: 9_200_000 },
  { id: 'eu', name: 'Europe', health: 'thriving', peaceIndex: 82, uids: 5_100_000, otk: 22_400_000 },
  { id: 'af', name: 'Africa', health: 'needs-attention', peaceIndex: 41, uids: 1_600_000, otk: 4_800_000 },
  { id: 'me', name: 'Middle East', health: 'moderate', peaceIndex: 55, uids: 1_200_000, otk: 3_600_000 },
  { id: 'sa2', name: 'South Asia', health: 'moderate', peaceIndex: 58, uids: 3_400_000, otk: 11_000_000 },
  { id: 'ea', name: 'East Asia', health: 'thriving', peaceIndex: 75, uids: 4_800_000, otk: 20_100_000 },
  { id: 'oc', name: 'Oceania', health: 'thriving', peaceIndex: 80, uids: 900_000, otk: 4_200_000 },
];

// ─── Global counter model ───

interface GlobalCounter {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
}

const DEMO_COUNTERS: GlobalCounter[] = [
  { label: 'Universal IDs Registered', value: 24_000_000, icon: '\uD83C\uDD94' },
  { label: 'Total OTK Minted', value: 93_800_000, icon: '\uD83E\uDE99' },
  { label: 'Gratitude Transactions', value: 156_000_000, icon: '\uD83D\uDE4F' },
  { label: 'Milestones Verified', value: 42_500_000, icon: '\u2705' },
  { label: 'Community Service Hours', value: 78_200_000, suffix: 'hrs', icon: '\uD83E\uDD1D' },
  { label: "Children's Milestones", value: 31_400_000, icon: '\uD83D\uDC76' },
];

// ─── Channel comparison model ───

interface ChannelActivity {
  channel: string;
  ticker: string;
  color: string;
  transactions: number;
}

const DEMO_CHANNELS: ChannelActivity[] = [
  { channel: 'Nurture', ticker: 'nOTK', color: '#ec4899', transactions: 28_400_000 },
  { channel: 'Education', ticker: 'eOTK', color: '#3b82f6', transactions: 22_100_000 },
  { channel: 'Health', ticker: 'hOTK', color: '#22c55e', transactions: 15_600_000 },
  { channel: 'Community', ticker: 'cOTK', color: '#f97316', transactions: 12_800_000 },
  { channel: 'Economic', ticker: 'xOTK', color: '#eab308', transactions: 9_200_000 },
  { channel: 'Governance', ticker: 'gOTK', color: '#8b5cf6', transactions: 5_700_000 },
];

// ─── Chain of Causation (Article I) ───

interface CausationStep {
  label: string;
  metric: string;
  metricValue: string;
  icon: string;
}

const CHAIN_OF_CAUSATION: CausationStep[] = [
  { label: 'Better Upbringing', metric: 'Children nurtured', metricValue: '31.4M', icon: '\uD83D\uDC76' },
  { label: 'Capable Individuals', metric: 'Skills certified', metricValue: '18.2M', icon: '\uD83C\uDF93' },
  { label: 'Needs Met', metric: 'Basic needs addressed', metricValue: '89%', icon: '\u2705' },
  { label: 'Resistant to Manipulation', metric: 'Informed citizens', metricValue: '76%', icon: '\uD83D\uDEE1\uFE0F' },
  { label: 'Harmony', metric: 'Community health score', metricValue: '72/100', icon: '\uD83E\uDD1D' },
  { label: 'Peace', metric: 'Global peace index', metricValue: '68/100', icon: '\u262E\uFE0F' },
];

// ─── Animated counter hook ───

function useAnimatedCounter(target: number, duration: number = 1500): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - (startTime.current ?? Date.now());
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(target * eased));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return current;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ─── Animated Counter Component ───

function AnimatedCounter({ counter }: { counter: GlobalCounter }) {
  const animated = useAnimatedCounter(counter.value, 2000);
  const t = useTheme();
  return (
    <View style={{ width: '48%' as unknown as number, marginBottom: 16 }}>
      <Text style={{ fontSize: 24, textAlign: 'center' }}>{counter.icon}</Text>
      <Text style={{ color: t.accent.green, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 4 }}>
        {formatNumber(animated)}{counter.suffix ? ` ${counter.suffix}` : ''}
      </Text>
      <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
        {counter.label}
      </Text>
    </View>
  );
}

// ─── Main Component ───

export function GlobalImpactScreen({ onClose }: Props) {
  const t = useTheme();

  const healthColor = (h: HealthLevel): string => {
    switch (h) {
      case 'thriving': return t.accent.green;
      case 'moderate': return t.accent.yellow;
      case 'needs-attention': return t.accent.red;
    }
  };

  const maxChannel = useMemo(() => Math.max(...DEMO_CHANNELS.map(c => c.transactions)), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8 },
    quote: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginHorizontal: 24, marginTop: 8, lineHeight: 18 },
    attribution: { color: t.text.muted, fontSize: 10, textAlign: 'center', marginTop: 4, marginBottom: 8 },
    demoTag: { color: t.accent.orange, fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 12 },
    // Map
    mapContainer: { marginHorizontal: 20, marginTop: 8 },
    regionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
    regionDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    regionName: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    regionScore: { fontSize: 13, fontWeight: '700' },
    regionMeta: { color: t.text.muted, fontSize: 11, marginLeft: 12 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    // Counters
    countersGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 },
    // Channel bar chart
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    barLabel: { color: t.text.primary, fontSize: 12, fontWeight: '600', width: 80 },
    barTrack: { flex: 1, height: 20, backgroundColor: t.border, borderRadius: 10, overflow: 'hidden', marginHorizontal: 8 },
    barFill: { height: 20, borderRadius: 10 },
    barValue: { color: t.text.muted, fontSize: 11, width: 50, textAlign: 'right' },
    // Chain of causation
    causationStep: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    causationIcon: { fontSize: 24, width: 40, textAlign: 'center' },
    causationContent: { flex: 1, marginLeft: 8 },
    causationLabel: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    causationMetric: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    causationValue: { color: t.accent.green, fontWeight: '700' },
    arrow: { color: t.text.muted, fontSize: 20, textAlign: 'center', marginVertical: -4 },
    // Legend
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: t.text.muted, fontSize: 11 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Global Impact</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quote */}
        <Text style={s.quote}>
          "Nations are measured not by GDP, but by the aggregate human value their citizens create."
        </Text>
        <Text style={s.attribution}>— Human Constitution, Article X</Text>

        {/* ─── World Map (Simplified) ─── */}
        <Text style={s.section}>World Health Map</Text>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          {/* Legend */}
          <View style={[s.legendRow, { paddingTop: 16 }]}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: t.accent.green }]} />
              <Text style={s.legendText}>Thriving</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: t.accent.yellow }]} />
              <Text style={s.legendText}>Moderate</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: t.accent.red }]} />
              <Text style={s.legendText}>Needs Attention</Text>
            </View>
          </View>

          {DEMO_REGIONS.map((region, idx) => (
            <View key={region.id}>
              {idx > 0 && <View style={s.divider} />}
              <View style={s.regionRow}>
                <View style={[s.regionDot, { backgroundColor: healthColor(region.health) }]} />
                <Text style={s.regionName}>{region.name}</Text>
                <Text style={[s.regionScore, { color: healthColor(region.health) }]}>
                  {region.peaceIndex}/100
                </Text>
                <Text style={s.regionMeta}>{formatNumber(region.uids)} IDs</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Global Counters (Animated) ─── */}
        <Text style={s.section}>Global Counters</Text>
        <View style={s.countersGrid}>
          {DEMO_COUNTERS.map((counter) => (
            <AnimatedCounter key={counter.label} counter={counter} />
          ))}
        </View>

        {/* ─── Channel Comparison Bar Chart ─── */}
        <Text style={s.section}>Channel Activity</Text>
        <View style={[s.card, { paddingVertical: 16 }]}>
          {DEMO_CHANNELS.map((ch) => (
            <View key={ch.ticker} style={s.barRow}>
              <Text style={s.barLabel}>{ch.ticker}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, {
                  backgroundColor: ch.color,
                  width: `${(ch.transactions / maxChannel) * 100}%` as unknown as number,
                }]} />
              </View>
              <Text style={s.barValue}>{formatNumber(ch.transactions)}</Text>
            </View>
          ))}
          <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            Total transactions by value channel
          </Text>
        </View>

        {/* ─── Chain of Causation (Article I) ─── */}
        <Text style={s.section}>The Chain of Causation</Text>
        <View style={s.card}>
          <Text style={{ color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
            From Article I: The path from better upbringing to world peace, measured by Open Chain data.
          </Text>
          {CHAIN_OF_CAUSATION.map((step, idx) => (
            <View key={step.label}>
              <View style={s.causationStep}>
                <Text style={s.causationIcon}>{step.icon}</Text>
                <View style={s.causationContent}>
                  <Text style={s.causationLabel}>{step.label}</Text>
                  <Text style={s.causationMetric}>
                    {step.metric}: <Text style={s.causationValue}>{step.metricValue}</Text>
                  </Text>
                </View>
              </View>
              {idx < CHAIN_OF_CAUSATION.length - 1 && (
                <Text style={s.arrow}>{'\u2193'}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Demo tag */}
        <Text style={s.demoTag}>DEMO MODE — Sample data for visualization</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
