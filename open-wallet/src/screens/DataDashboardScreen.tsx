/**
 * Data Dashboard Screen — Personal analytics across all 300 screens.
 *
 * Shows activity heatmap, OTK flow over time, achievement progress,
 * and overall engagement score across the Open Wallet ecosystem.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface ScreenUsage {
  name: string;
  category: string;
  visits: number;
  lastVisited: string;
  avgTimeMin: number;
}

interface OtkFlowMonth {
  month: string;
  earned: number;
  given: number;
  received: number;
}

interface AchievementChannel {
  channel: string;
  total: number;
  earned: number;
  pct: number;
}

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_SCREEN_USAGE: ScreenUsage[] = [
  { name: 'Dashboard', category: 'Core', visits: 482, lastVisited: 'Today', avgTimeMin: 2.1 },
  { name: 'Wallet', category: 'Core', visits: 378, lastVisited: 'Today', avgTimeMin: 3.4 },
  { name: 'Nurture Tracking', category: 'Nurture', visits: 245, lastVisited: 'Today', avgTimeMin: 5.2 },
  { name: 'Community Feed', category: 'Community', visits: 198, lastVisited: 'Yesterday', avgTimeMin: 4.8 },
  { name: 'Achievements', category: 'Core', visits: 176, lastVisited: 'Today', avgTimeMin: 1.9 },
  { name: 'Living Ledger', category: 'Nurture', visits: 162, lastVisited: 'Yesterday', avgTimeMin: 6.1 },
  { name: 'Swap', category: 'Finance', visits: 148, lastVisited: '2 days ago', avgTimeMin: 2.8 },
  { name: 'Governance', category: 'Governance', visits: 134, lastVisited: 'Today', avgTimeMin: 3.5 },
  { name: 'Health Wellness', category: 'Health', visits: 121, lastVisited: '3 days ago', avgTimeMin: 4.2 },
  { name: 'Peace Index', category: 'Peace', visits: 115, lastVisited: 'Yesterday', avgTimeMin: 2.3 },
  { name: 'Education', category: 'Education', visits: 108, lastVisited: '2 days ago', avgTimeMin: 7.1 },
  { name: 'Settings', category: 'Core', visits: 98, lastVisited: 'Today', avgTimeMin: 1.2 },
  { name: 'Cooperative', category: 'Economic', visits: 92, lastVisited: '4 days ago', avgTimeMin: 3.9 },
  { name: 'Address Book', category: 'Core', visits: 87, lastVisited: 'Yesterday', avgTimeMin: 1.5 },
  { name: 'Bridge', category: 'Finance', visits: 76, lastVisited: '3 days ago', avgTimeMin: 2.6 },
  { name: 'Habitat', category: 'Environment', visits: 71, lastVisited: '5 days ago', avgTimeMin: 3.3 },
  { name: 'Ancestry', category: 'Legacy', visits: 65, lastVisited: '1 week ago', avgTimeMin: 8.4 },
  { name: 'Mentorship', category: 'Education', visits: 58, lastVisited: '2 days ago', avgTimeMin: 5.7 },
  { name: 'Renewable Energy', category: 'Environment', visits: 52, lastVisited: '4 days ago', avgTimeMin: 4.1 },
  { name: 'Election', category: 'Governance', visits: 48, lastVisited: '1 week ago', avgTimeMin: 3.8 },
  { name: 'Eldercare', category: 'Nurture', visits: 44, lastVisited: '3 days ago', avgTimeMin: 6.3 },
  { name: 'Incident Report', category: 'Safety', visits: 38, lastVisited: '2 weeks ago', avgTimeMin: 4.5 },
  { name: 'Translation', category: 'Accessibility', visits: 35, lastVisited: '5 days ago', avgTimeMin: 2.0 },
  { name: 'Oracle', category: 'Finance', visits: 32, lastVisited: '1 week ago', avgTimeMin: 2.4 },
  { name: 'Gratitude Wall', category: 'Community', visits: 29, lastVisited: '3 days ago', avgTimeMin: 3.0 },
  { name: 'Pledge', category: 'Governance', visits: 26, lastVisited: '2 weeks ago', avgTimeMin: 1.8 },
  { name: 'Constitution Reader', category: 'Governance', visits: 24, lastVisited: '1 week ago', avgTimeMin: 9.2 },
  { name: 'Basic Needs', category: 'Economic', visits: 21, lastVisited: '4 days ago', avgTimeMin: 3.6 },
  { name: 'Legacy Plan', category: 'Legacy', visits: 18, lastVisited: '2 weeks ago', avgTimeMin: 7.8 },
  { name: 'World Map', category: 'Peace', visits: 15, lastVisited: '1 week ago', avgTimeMin: 4.0 },
];

const DEMO_OTK_FLOW: OtkFlowMonth[] = [
  { month: 'Oct 2025', earned: 120, given: 35, received: 28 },
  { month: 'Nov 2025', earned: 145, given: 42, received: 31 },
  { month: 'Dec 2025', earned: 98, given: 55, received: 40 },
  { month: 'Jan 2026', earned: 178, given: 60, received: 52 },
  { month: 'Feb 2026', earned: 210, given: 48, received: 65 },
  { month: 'Mar 2026', earned: 195, given: 72, received: 58 },
];

const DEMO_CHANNELS: AchievementChannel[] = [
  { channel: 'Nurture', total: 25, earned: 18, pct: 72 },
  { channel: 'Education', total: 20, earned: 11, pct: 55 },
  { channel: 'Health', total: 15, earned: 6, pct: 40 },
  { channel: 'Community', total: 30, earned: 22, pct: 73 },
  { channel: 'Governance', total: 20, earned: 8, pct: 40 },
  { channel: 'Economic', total: 18, earned: 10, pct: 56 },
  { channel: 'Environment', total: 12, earned: 3, pct: 25 },
  { channel: 'Peace', total: 10, earned: 4, pct: 40 },
];

// --- Component ---

export function DataDashboardScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const totalVisits = useMemo(
    () => DEMO_SCREEN_USAGE.reduce((s, u) => s + u.visits, 0), [],
  );

  const totalEarned = useMemo(
    () => DEMO_OTK_FLOW.reduce((s, m) => s + m.earned, 0), [],
  );
  const totalGiven = useMemo(
    () => DEMO_OTK_FLOW.reduce((s, m) => s + m.given, 0), [],
  );
  const totalReceived = useMemo(
    () => DEMO_OTK_FLOW.reduce((s, m) => s + m.received, 0), [],
  );

  const totalAchievements = useMemo(
    () => DEMO_CHANNELS.reduce((s, c) => s + c.earned, 0), [],
  );
  const totalPossible = useMemo(
    () => DEMO_CHANNELS.reduce((s, c) => s + c.total, 0), [],
  );

  const engagementScore = useMemo(() => {
    const screenDiv = Math.min(DEMO_SCREEN_USAGE.length / 30, 1) * 25;
    const visitDiv = Math.min(totalVisits / 3000, 1) * 25;
    const achDiv = (totalAchievements / totalPossible) * 25;
    const otkDiv = Math.min(totalEarned / 1000, 1) * 25;
    return Math.round(screenDiv + visitDiv + achDiv + otkDiv);
  }, [totalVisits, totalAchievements, totalPossible, totalEarned]);

  const heatColor = (visits: number) => {
    if (visits >= 200) return '#22c55e';
    if (visits >= 100) return '#84cc16';
    if (visits >= 50) return '#f59e0b';
    return '#6b7280';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: 18, fontWeight: '700', color: t.text.primary },
    closeBtn: { fontSize: 16, color: t.accent.green },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: t.text.primary, marginBottom: 10 },
    scoreBox: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20,
      alignItems: 'center', borderWidth: 1, borderColor: t.border,
    },
    bigScore: { fontSize: 48, fontWeight: '800', color: t.accent.green },
    scoreLabel: { fontSize: 14, color: t.text.secondary, marginTop: 4 },
    metricsRow: { flexDirection: 'row', marginTop: 16 },
    metric: { flex: 1, alignItems: 'center' },
    metricValue: { fontSize: 18, fontWeight: '700', color: t.text.primary },
    metricLabel: { fontSize: 11, color: t.text.secondary, marginTop: 2 },
    card: {
      backgroundColor: t.bg.card, borderRadius: 10, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: t.border,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    value: { fontSize: 14, color: t.text.primary, fontWeight: '500' },
    label: { fontSize: 12, color: t.text.secondary },
    heatDot: {
      width: 10, height: 10, borderRadius: 5, marginRight: 8,
    },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginTop: 6 },
    barFill: { height: 8, borderRadius: 4 },
    flowRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border,
    },
    flowLabel: { fontSize: 13, color: t.text.primary, width: 80 },
    flowValue: { fontSize: 13, fontWeight: '600', width: 60, textAlign: 'right' },
    earnedColor: { color: '#22c55e' },
    givenColor: { color: '#ef4444' },
    receivedColor: { color: '#3b82f6' },
    channelRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    channelName: { fontSize: 14, color: t.text.primary, width: 90 },
    channelPct: { fontSize: 14, fontWeight: '600', width: 45, textAlign: 'right' },
    infoText: { fontSize: 13, color: t.text.secondary, lineHeight: 20 },
  }), [t]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Dashboard</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Engagement Score */}
        <View style={styles.section}>
          <View style={styles.scoreBox}>
            <Text style={styles.bigScore}>{engagementScore}</Text>
            <Text style={styles.scoreLabel}>Engagement Score (out of 100)</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{DEMO_SCREEN_USAGE.length}</Text>
                <Text style={styles.metricLabel}>Screens Used</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{totalVisits.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Total Visits</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{totalAchievements}/{totalPossible}</Text>
                <Text style={styles.metricLabel}>Achievements</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Heatmap (Top 30 Screens)</Text>
          {DEMO_SCREEN_USAGE.map((s, i) => (
            <View key={i} style={[styles.card, styles.row]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.heatDot, { backgroundColor: heatColor(s.visits) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{s.name}</Text>
                  <Text style={styles.label}>{s.category} | {s.lastVisited}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.value}>{s.visits}</Text>
                <Text style={styles.label}>{s.avgTimeMin}m avg</Text>
              </View>
            </View>
          ))}
        </View>

        {/* OTK Flow */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OTK Flow (6 Months)</Text>
          <View style={[styles.flowRow, { borderBottomWidth: 2 }]}>
            <Text style={[styles.flowLabel, { fontWeight: '600' }]}>Month</Text>
            <Text style={[styles.flowValue, styles.earnedColor]}>Earned</Text>
            <Text style={[styles.flowValue, styles.givenColor]}>Given</Text>
            <Text style={[styles.flowValue, styles.receivedColor]}>Received</Text>
          </View>
          {DEMO_OTK_FLOW.map((m, i) => (
            <View key={i} style={styles.flowRow}>
              <Text style={styles.flowLabel}>{m.month}</Text>
              <Text style={[styles.flowValue, styles.earnedColor]}>{m.earned}</Text>
              <Text style={[styles.flowValue, styles.givenColor]}>{m.given}</Text>
              <Text style={[styles.flowValue, styles.receivedColor]}>{m.received}</Text>
            </View>
          ))}
          <View style={[styles.flowRow, { borderTopWidth: 2, borderTopColor: t.text.primary }]}>
            <Text style={[styles.flowLabel, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.flowValue, styles.earnedColor, { fontWeight: '700' }]}>{totalEarned}</Text>
            <Text style={[styles.flowValue, styles.givenColor, { fontWeight: '700' }]}>{totalGiven}</Text>
            <Text style={[styles.flowValue, styles.receivedColor, { fontWeight: '700' }]}>{totalReceived}</Text>
          </View>
        </View>

        {/* Achievement Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievement Progress by Channel</Text>
          {DEMO_CHANNELS.map((c, i) => (
            <View key={i} style={styles.channelRow}>
              <Text style={styles.channelName}>{c.channel}</Text>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, {
                    width: `${c.pct}%`,
                    backgroundColor: c.pct >= 60 ? '#22c55e' : c.pct >= 40 ? '#f59e0b' : '#ef4444',
                  }]} />
                </View>
              </View>
              <Text style={styles.value}>{c.earned}/{c.total}</Text>
              <Text style={styles.channelPct}>{c.pct}%</Text>
            </View>
          ))}
        </View>

        {demoMode && (
          <View style={[styles.section, { paddingBottom: 32 }]}>
            <Text style={styles.infoText}>
              Demo Mode: Analytics are simulated. In production, all data is stored
              locally and never shared without your explicit consent.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
