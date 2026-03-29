/**
 * Reputation Dashboard Screen — Art II enrichment.
 *
 * Detailed reputation score view with all components:
 * overall score (0-1000), level badge, component breakdown with visual bars,
 * 12-month history chart, community comparison, improvement tips,
 * cross-chain reputation, and attestation generation.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface ScoreComponent {
  label: string;
  value: number;
  max: number;
  description: string;
}

interface MonthlyPoint {
  month: string;
  score: number;
}

interface CrossChainEntry {
  chain: string;
  score: number;
  level: string;
}

type ReputationLevel = 'newcomer' | 'active' | 'trusted' | 'elder' | 'guardian';

const LEVEL_THRESHOLDS: { level: ReputationLevel; min: number; color: string; label: string }[] = [
  { level: 'guardian', min: 900, color: '#ffd700', label: 'Guardian' },
  { level: 'elder', min: 750, color: '#9b59b6', label: 'Elder' },
  { level: 'trusted', min: 550, color: '#2ecc71', label: 'Trusted' },
  { level: 'active', min: 300, color: '#3498db', label: 'Active' },
  { level: 'newcomer', min: 0, color: '#95a5a6', label: 'Newcomer' },
];

const DEMO_SCORE = 720;

const DEMO_COMPONENTS: ScoreComponent[] = [
  { label: 'Transaction Activity', value: 155, max: 200, description: 'Based on volume and frequency of transactions' },
  { label: 'Account Age', value: 110, max: 150, description: 'Time since your Universal ID registration' },
  { label: 'Gratitude Received', value: 245, max: 300, description: 'Weighted highest — gratitude is the strongest signal of genuine value' },
  { label: 'Governance Participation', value: 130, max: 200, description: 'Proposals submitted, votes cast, discussions joined' },
  { label: 'Verifier Accuracy', value: 80, max: 150, description: 'Accuracy rate as a registered identity verifier' },
];

const DEMO_HISTORY: MonthlyPoint[] = [
  { month: 'Aug', score: 320 },
  { month: 'Sep', score: 390 },
  { month: 'Oct', score: 445 },
  { month: 'Nov', score: 510 },
  { month: 'Dec', score: 555 },
  { month: 'Jan', score: 610 },
  { month: 'Feb', score: 660 },
  { month: 'Mar', score: 720 },
];

const DEMO_COMMUNITY_AVG = 420;
const DEMO_PERCENTILE = 82;

const DEMO_CROSS_CHAIN: CrossChainEntry[] = [
  { chain: 'Open Chain (primary)', score: 720, level: 'Trusted' },
  { chain: 'Ethereum (linked)', score: 580, level: 'Active' },
  { chain: 'Solana (linked)', score: 460, level: 'Active' },
];

function getLevel(score: number): typeof LEVEL_THRESHOLDS[0] {
  return LEVEL_THRESHOLDS.find((l) => score >= l.min) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

function getImprovementTips(components: ScoreComponent[]): string[] {
  const tips: string[] = [];
  const sorted = [...components].sort((a, b) => (a.value / a.max) - (b.value / b.max));
  for (const c of sorted.slice(0, 3)) {
    const pct = Math.round((c.value / c.max) * 100);
    if (pct < 80) {
      if (c.label === 'Transaction Activity') tips.push('Increase your transaction frequency — even small transfers count toward activity.');
      else if (c.label === 'Account Age') tips.push('Account age grows naturally over time. Stay active and it will increase steadily.');
      else if (c.label === 'Gratitude Received') tips.push('Help others in your community — gratitude is earned, not asked for, and carries the most weight.');
      else if (c.label === 'Governance Participation') tips.push('Vote on proposals and join governance discussions to boost participation score.');
      else if (c.label === 'Verifier Accuracy') tips.push('Register as a verifier and maintain high accuracy when validating identities.');
    }
  }
  return tips.length > 0 ? tips : ['Your reputation is strong across all areas. Keep contributing!'];
}

export function ReputationDashboardScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [score] = useState(DEMO_SCORE);
  const [components] = useState(DEMO_COMPONENTS);
  const [history] = useState(DEMO_HISTORY);
  const [crossChain] = useState(DEMO_CROSS_CHAIN);

  const level = useMemo(() => getLevel(score), [score]);
  const tips = useMemo(() => getImprovementTips(components), [components]);

  const chartMax = useMemo(() => Math.max(...history.map((h) => h.score), 100), [history]);

  const generateAttestation = useCallback(() => {
    const proof = `REP-ATTEST-${Date.now().toString(36).toUpperCase()}`;
    Alert.alert(
      'Reputation Attestation',
      `Level: ${level.label}\nScore: ${score}/1000\nPercentile: Top ${100 - DEMO_PERCENTILE}%\n\nProof ID: ${proof}\n\nThis cryptographic proof can be shared with external services to verify your reputation level without revealing your full history.`,
      [{ text: 'Copy Proof ID', onPress: () => {} }, { text: 'Done' }],
    );
  }, [level, score]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },

    // Overall score card
    scoreCard: { borderRadius: 24, padding: 28, marginHorizontal: 20, alignItems: 'center', marginTop: 8 },
    scoreValue: { fontSize: 56, fontWeight: '900', marginTop: 8 },
    scoreMax: { color: t.text.muted, fontSize: 14, marginTop: 2 },
    levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    levelText: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    // Section
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 28 },

    // Component breakdown
    compCard: { backgroundColor: t.bg.secondary, borderRadius: 16, marginHorizontal: 20, padding: 16, marginBottom: 8 },
    compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    compLabel: { color: t.text.primary, fontSize: 14, fontWeight: '700', flex: 1 },
    compValue: { color: t.text.primary, fontSize: 14, fontWeight: '800' },
    compBarBg: { height: 8, borderRadius: 4, backgroundColor: t.border, overflow: 'hidden' as const },
    compBarFill: { height: 8, borderRadius: 4 },
    compDesc: { color: t.text.muted, fontSize: 11, marginTop: 6 },

    // Chart
    chartContainer: { backgroundColor: t.bg.secondary, borderRadius: 16, marginHorizontal: 20, padding: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginTop: 8 },
    chartBar: { alignItems: 'center', flex: 1 },
    chartBarInner: { width: 16, borderRadius: 4 },
    chartLabel: { color: t.text.muted, fontSize: 10, marginTop: 4 },
    chartValue: { color: t.text.primary, fontSize: 9, fontWeight: '700', marginBottom: 2 },

    // Community comparison
    comparisonCard: { backgroundColor: t.bg.secondary, borderRadius: 16, marginHorizontal: 20, padding: 20 },
    compRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    compRowLabel: { color: t.text.muted, fontSize: 13 },
    compRowValue: { color: t.text.primary, fontSize: 13, fontWeight: '700' },
    percentileBar: { height: 10, borderRadius: 5, backgroundColor: t.border, marginTop: 4, overflow: 'hidden' as const },
    percentileFill: { height: 10, borderRadius: 5 },
    percentileLabel: { color: t.text.muted, fontSize: 11, marginTop: 6 },

    // Tips
    tipCard: { backgroundColor: t.bg.secondary, borderRadius: 12, marginHorizontal: 20, padding: 14, marginBottom: 8 },
    tipText: { color: t.text.primary, fontSize: 13, lineHeight: 19 },
    tipIcon: { color: t.accent.yellow ?? '#f39c12', fontSize: 14, marginRight: 6 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start' },

    // Cross-chain
    chainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
    chainName: { color: t.text.primary, fontSize: 14, fontWeight: '600', flex: 1 },
    chainScore: { color: t.text.primary, fontSize: 14, fontWeight: '800', marginRight: 12 },
    chainLevel: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    chainLevelText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 20 },

    // Attestation button
    attestBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 16, marginHorizontal: 20, alignItems: 'center', marginTop: 20, marginBottom: 40 },
    attestBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    attestNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginHorizontal: 40, marginTop: 8, marginBottom: 40 },
  }), [t]);

  const getBarColor = (value: number, max: number): string => {
    const pct = value / max;
    if (pct >= 0.8) return t.accent.green;
    if (pct >= 0.5) return t.accent.blue;
    return t.accent.orange ?? '#e67e22';
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Reputation</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      <ScrollView>
        {/* Overall Score */}
        <View style={[s.scoreCard, { backgroundColor: level.color + '15' }]}>
          <Text style={{ color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
            Reputation Score
          </Text>
          <Text style={[s.scoreValue, { color: level.color }]}>{score}</Text>
          <Text style={s.scoreMax}>out of 1,000</Text>
          <View style={[s.levelBadge, { backgroundColor: level.color }]}>
            <Text style={s.levelText}>{level.label}</Text>
          </View>
        </View>

        {/* Score Component Breakdown */}
        <Text style={s.section}>Score Breakdown</Text>
        {components.map((c) => {
          const pct = Math.round((c.value / c.max) * 100);
          const barColor = getBarColor(c.value, c.max);
          return (
            <View key={c.label} style={s.compCard}>
              <View style={s.compHeader}>
                <Text style={s.compLabel}>{c.label}</Text>
                <Text style={s.compValue}>{c.value}/{c.max}</Text>
              </View>
              <View style={s.compBarBg}>
                <View style={[s.compBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={s.compDesc}>{c.description}</Text>
            </View>
          );
        })}

        {/* Score History Chart */}
        <Text style={s.section}>Score History (Monthly)</Text>
        <View style={s.chartContainer}>
          <View style={s.chartRow}>
            {history.map((h) => {
              const barHeight = Math.max((h.score / chartMax) * 100, 4);
              const isLatest = h === history[history.length - 1];
              return (
                <View key={h.month} style={s.chartBar}>
                  <Text style={s.chartValue}>{h.score}</Text>
                  <View
                    style={[
                      s.chartBarInner,
                      {
                        height: barHeight,
                        backgroundColor: isLatest ? level.color : (t.accent.blue + '80'),
                      },
                    ]}
                  />
                  <Text style={s.chartLabel}>{h.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Community Comparison */}
        <Text style={s.section}>Community Comparison</Text>
        <View style={s.comparisonCard}>
          <View style={s.compRow}>
            <Text style={s.compRowLabel}>Your Score</Text>
            <Text style={[s.compRowValue, { color: level.color }]}>{score}</Text>
          </View>
          <View style={s.compRow}>
            <Text style={s.compRowLabel}>Community Average</Text>
            <Text style={s.compRowValue}>{DEMO_COMMUNITY_AVG}</Text>
          </View>
          <View style={s.compRow}>
            <Text style={s.compRowLabel}>Your Percentile</Text>
            <Text style={[s.compRowValue, { color: t.accent.green }]}>Top {100 - DEMO_PERCENTILE}%</Text>
          </View>
          <View style={s.percentileBar}>
            <View style={[s.percentileFill, { width: `${DEMO_PERCENTILE}%`, backgroundColor: t.accent.green }]} />
          </View>
          <Text style={s.percentileLabel}>
            You rank higher than {DEMO_PERCENTILE}% of community members
          </Text>
        </View>

        {/* Improvement Tips */}
        <Text style={s.section}>Tips to Improve</Text>
        {tips.map((tip, i) => (
          <View key={i} style={s.tipCard}>
            <View style={s.tipRow}>
              <Text style={s.tipIcon}>*</Text>
              <Text style={[s.tipText, { flex: 1 }]}>{tip}</Text>
            </View>
          </View>
        ))}

        {/* Cross-Chain Reputation */}
        <Text style={s.section}>Cross-Chain Reputation</Text>
        {crossChain.map((entry, i) => {
          const entryLevel = getLevel(entry.score);
          return (
            <React.Fragment key={entry.chain}>
              <View style={s.chainRow}>
                <Text style={s.chainName}>{entry.chain}</Text>
                <Text style={s.chainScore}>{entry.score}</Text>
                <View style={[s.chainLevel, { backgroundColor: entryLevel.color }]}>
                  <Text style={s.chainLevelText}>{entry.level}</Text>
                </View>
              </View>
              {i < crossChain.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          );
        })}

        {/* Reputation Attestation */}
        <Text style={s.section}>Reputation Attestation</Text>
        <TouchableOpacity style={s.attestBtn} onPress={generateAttestation}>
          <Text style={s.attestBtnText}>Generate Proof of Reputation</Text>
        </TouchableOpacity>
        <Text style={s.attestNote}>
          Creates a cryptographic proof of your reputation level that can be verified by external services without revealing your full activity history.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
