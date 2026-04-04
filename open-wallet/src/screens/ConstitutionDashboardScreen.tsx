import { fonts } from '../utils/theme';
/**
 * Constitution Dashboard Screen — Overview of all 10 Articles implementation status.
 *
 * Shows each Article's implementation percentage, live engagement metrics,
 * quick navigation links, and a composite Constitution health score.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

interface Article {
  number: number;
  title: string;
  summary: string;
  implementationPct: number;
  keyFeatures: string[];
  activeUsers: number;
  eventsThisWeek: number;
  relatedScreen: string;
}

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_ARTICLES: Article[] = [
  {
    number: 1, title: 'Right to Nurture',
    summary: 'Every child deserves loving care and support.',
    implementationPct: 78, keyFeatures: ['nOTK Tracking', 'Living Ledger', 'Caregiver Recognition'],
    activeUsers: 14200, eventsThisWeek: 340, relatedScreen: 'NurtureTracking',
  },
  {
    number: 2, title: 'Right to Education',
    summary: 'Knowledge and learning accessible to all.',
    implementationPct: 65, keyFeatures: ['Learning Credits', 'Skill Badges', 'Mentor Matching'],
    activeUsers: 11800, eventsThisWeek: 280, relatedScreen: 'Education',
  },
  {
    number: 3, title: 'Right to Health',
    summary: 'Physical and mental well-being for every person.',
    implementationPct: 52, keyFeatures: ['Health Records', 'Wellness Incentives', 'Community Care'],
    activeUsers: 9600, eventsThisWeek: 195, relatedScreen: 'Health',
  },
  {
    number: 4, title: 'Right to Community',
    summary: 'Belonging and participation in shared spaces.',
    implementationPct: 71, keyFeatures: ['Local Councils', 'Event Coordination', 'Mutual Aid'],
    activeUsers: 18400, eventsThisWeek: 520, relatedScreen: 'Community',
  },
  {
    number: 5, title: 'Right to Governance',
    summary: 'Democratic participation at every level.',
    implementationPct: 45, keyFeatures: ['Voting System', 'Proposal Engine', 'Transparency Dashboard'],
    activeUsers: 7200, eventsThisWeek: 88, relatedScreen: 'Governance',
  },
  {
    number: 6, title: 'Right to Economic Dignity',
    summary: 'Fair exchange of value and basic economic security.',
    implementationPct: 60, keyFeatures: ['OTK Exchange', 'Cooperative Tools', 'Basic Needs'],
    activeUsers: 13100, eventsThisWeek: 410, relatedScreen: 'Economic',
  },
  {
    number: 7, title: 'Right to Environmental Stewardship',
    summary: 'Responsibility to protect and restore the natural world.',
    implementationPct: 38, keyFeatures: ['Carbon Tracking', 'Renewable Projects', 'Habitat Index'],
    activeUsers: 5400, eventsThisWeek: 62, relatedScreen: 'Environment',
  },
  {
    number: 8, title: 'Right to Peace',
    summary: 'Conflict resolution and restorative justice.',
    implementationPct: 33, keyFeatures: ['Peace Index', 'Mediation Tools', 'Restorative Circles'],
    activeUsers: 4100, eventsThisWeek: 45, relatedScreen: 'Peace',
  },
  {
    number: 9, title: 'Right to Identity',
    summary: 'Sovereign control over personal identity and data.',
    implementationPct: 82, keyFeatures: ['Universal ID', 'Privacy Controls', 'Data Portability'],
    activeUsers: 21000, eventsThisWeek: 150, relatedScreen: 'Identity',
  },
  {
    number: 10, title: 'Right to Legacy',
    summary: 'Intergenerational transfer of wisdom and resources.',
    implementationPct: 28, keyFeatures: ['Legacy Planning', 'Ancestry Records', 'Memorial Funds'],
    activeUsers: 3200, eventsThisWeek: 34, relatedScreen: 'Legacy',
  },
];

// --- Component ---

export function ConstitutionDashboardScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const healthScore = useMemo(() => {
    const avg = DEMO_ARTICLES.reduce((sum, a) => sum + a.implementationPct, 0) / DEMO_ARTICLES.length;
    return Math.round(avg);
  }, []);

  const totalUsers = useMemo(
    () => DEMO_ARTICLES.reduce((sum, a) => sum + a.activeUsers, 0),
    [],
  );

  const totalEvents = useMemo(
    () => DEMO_ARTICLES.reduce((sum, a) => sum + a.eventsThisWeek, 0),
    [],
  );

  const pctColor = (pct: number) => {
    if (pct >= 70) return '#22c55e';
    if (pct >= 45) return '#f59e0b';
    return '#ef4444';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
    closeBtn: { fontSize: fonts.lg, color: t.accent.green },
    scroll: { flex: 1 },
    section: { padding: 16, borderBottomWidth: 1, borderBottomColor: t.border },
    sectionTitle: { fontSize: fonts.lg, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 10 },
    healthBox: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20,
      alignItems: 'center', borderWidth: 1, borderColor: t.border,
    },
    healthScore: { fontSize: 48, fontWeight: fonts.heavy },
    healthLabel: { fontSize: fonts.md, color: t.text.secondary, marginTop: 4 },
    metricsRow: { flexDirection: 'row', marginTop: 16 },
    metric: { flex: 1, alignItems: 'center' },
    metricValue: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
    metricLabel: { fontSize: fonts.xs, color: t.text.secondary, marginTop: 2 },
    articleCard: {
      backgroundColor: t.bg.card, borderRadius: 12, padding: 14,
      marginBottom: 12, borderWidth: 1, borderColor: t.border,
    },
    articleHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 6,
    },
    articleNumber: { fontSize: fonts.sm, fontWeight: fonts.bold, color: t.accent.green },
    articleTitle: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, flex: 1, marginLeft: 8 },
    pctText: { fontSize: fonts.lg, fontWeight: fonts.bold },
    progressBar: {
      height: 6, backgroundColor: t.border, borderRadius: 3, marginVertical: 8,
    },
    progressFill: { height: 6, borderRadius: 3 },
    summary: { fontSize: fonts.sm, color: t.text.secondary, marginBottom: 8 },
    featureChip: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: t.bg.primary, marginRight: 6, marginBottom: 4,
    },
    featureText: { fontSize: fonts.xs, color: t.text.primary },
    featureRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statText: { fontSize: fonts.xs, color: t.text.secondary },
    navBtn: {
      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6,
      backgroundColor: t.accent.green, alignSelf: 'flex-start', marginTop: 6,
    },
    navBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    infoText: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 20 },
  }), [t]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Constitution Dashboard</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <View style={styles.healthBox}>
            <Text style={[styles.healthScore, { color: pctColor(healthScore) }]}>
              {healthScore}%
            </Text>
            <Text style={styles.healthLabel}>Constitution Health Score</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{(totalUsers / 1000).toFixed(1)}K</Text>
                <Text style={styles.metricLabel}>Active Users</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{totalEvents.toLocaleString()}</Text>
                <Text style={styles.metricLabel}>Events This Week</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>10</Text>
                <Text style={styles.metricLabel}>Articles</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All 10 Articles</Text>
          {DEMO_ARTICLES.map((a) => (
            <View key={a.number} style={styles.articleCard}>
              <View style={styles.articleHeader}>
                <Text style={styles.articleNumber}>Art. {a.number}</Text>
                <Text style={styles.articleTitle}>{a.title}</Text>
                <Text style={[styles.pctText, { color: pctColor(a.implementationPct) }]}>
                  {a.implementationPct}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${a.implementationPct}%`,
                  backgroundColor: pctColor(a.implementationPct),
                }]} />
              </View>
              <Text style={styles.summary}>{a.summary}</Text>
              <View style={styles.featureRow}>
                {a.keyFeatures.map((f, i) => (
                  <View key={i} style={styles.featureChip}>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{a.activeUsers.toLocaleString()} users</Text>
                <Text style={styles.statText}>{a.eventsThisWeek} events/week</Text>
              </View>
              <TouchableOpacity style={styles.navBtn}>
                <Text style={styles.navBtnText}>Open {a.relatedScreen}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {demoMode && (
          <View style={[styles.section, { paddingBottom: 32 }]}>
            <Text style={styles.infoText}>
              Demo Mode: All metrics are simulated. In production, data is aggregated
              from Open Chain validators across all participating regions.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
