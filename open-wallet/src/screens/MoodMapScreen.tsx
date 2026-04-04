import { fonts } from '../utils/theme';
/**
 * Mood Map — Community mood aggregate showing collective wellbeing.
 *
 * Anonymized mood data from community members is aggregated to show
 * how the community is feeling. This helps identify when support is
 * needed and celebrates when things are going well. All data is
 * privacy-preserving — individual moods are never exposed.
 *
 * Features:
 * - Today: current community mood snapshot with distribution
 * - Trends: mood trends over time (daily, weekly, monthly)
 * - Support: resources and actions when mood is low
 * - Demo mode with sample mood data
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

type MoodTab = 'today' | 'trends' | 'support';

interface MoodLevel {
  label: string;
  icon: string;
  color: string;
  count: number;
  percentage: number;
}

interface MoodTrend {
  period: string;
  averageScore: number;
  dominantMood: string;
  dominantIcon: string;
  participationRate: number;
  change: number;
}

interface SupportResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'community' | 'action' | 'hotline';
  icon: string;
  available: boolean;
}

const MOOD_LEVELS: MoodLevel[] = [
  { label: 'Thriving', icon: '\u{1F929}', color: '#22c55e', count: 3420, percentage: 38 },
  { label: 'Good', icon: '\u{1F60A}', color: '#84cc16', count: 2700, percentage: 30 },
  { label: 'Neutral', icon: '\u{1F610}', color: '#eab308', count: 1530, percentage: 17 },
  { label: 'Struggling', icon: '\u{1F614}', color: '#f97316', count: 900, percentage: 10 },
  { label: 'Crisis', icon: '\u{1F61E}', color: '#ef4444', count: 450, percentage: 5 },
];

const DEMO_TRENDS: MoodTrend[] = [
  { period: 'Today', averageScore: 7.8, dominantMood: 'Thriving', dominantIcon: '\u{1F929}', participationRate: 72, change: 0.3 },
  { period: 'This Week', averageScore: 7.5, dominantMood: 'Good', dominantIcon: '\u{1F60A}', participationRate: 68, change: 0.2 },
  { period: 'Last Week', averageScore: 7.3, dominantMood: 'Good', dominantIcon: '\u{1F60A}', participationRate: 65, change: -0.1 },
  { period: 'This Month', averageScore: 7.4, dominantMood: 'Good', dominantIcon: '\u{1F60A}', participationRate: 70, change: 0.5 },
  { period: 'Last Month', averageScore: 6.9, dominantMood: 'Neutral', dominantIcon: '\u{1F610}', participationRate: 62, change: -0.3 },
  { period: '3 Months Ago', averageScore: 7.2, dominantMood: 'Good', dominantIcon: '\u{1F60A}', participationRate: 58, change: 0.1 },
];

const DEMO_SUPPORT: SupportResource[] = [
  { id: 'sr1', title: 'Community Listening Circle', description: 'Weekly peer support group — share and be heard in a safe space. Every Tuesday at 7 PM.', type: 'community', icon: '\u{1F465}', available: true },
  { id: 'sr2', title: 'Mindfulness Guide', description: 'A curated collection of meditation and breathing exercises contributed by the community.', type: 'article', icon: '\u{1F4D6}', available: true },
  { id: 'sr3', title: 'Buddy Match', description: 'Get paired with a community buddy for daily check-ins and mutual support.', type: 'action', icon: '\u{1F91D}', available: true },
  { id: 'sr4', title: 'Crisis Support Line', description: 'Confidential 24/7 support line for community members in immediate need.', type: 'hotline', icon: '\u{1F4DE}', available: true },
  { id: 'sr5', title: 'Wellness Challenge', description: 'Join a 7-day wellness challenge with daily activities to boost mood and earn hOTK.', type: 'action', icon: '\u{1F3AF}', available: true },
  { id: 'sr6', title: 'Gratitude Wall', description: 'Read and post messages of gratitude — scientifically proven to improve wellbeing.', type: 'community', icon: '\u{1F49B}', available: true },
];

const TYPE_COLORS: Record<string, string> = {
  article: '#3b82f6',
  community: '#8b5cf6',
  action: '#22c55e',
  hotline: '#ef4444',
};

const TYPE_LABELS: Record<string, string> = {
  article: 'Read',
  community: 'Join',
  action: 'Start',
  hotline: 'Call',
};

export function MoodMapScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<MoodTab>('today');

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    moodIcon: { fontSize: 32, textAlign: 'center', marginBottom: 4 },
    moodLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    barContainer: { height: 10, backgroundColor: t.border, borderRadius: 5, overflow: 'hidden', flex: 1, marginHorizontal: 10 },
    barFill: { height: 10, borderRadius: 5 },
    moodCount: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, width: 50, textAlign: 'right' },
    moodPct: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.heavy, width: 40 },
    overallScore: { fontSize: 48, fontWeight: fonts.heavy, textAlign: 'center' },
    overallLabel: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
    trendScore: { fontSize: 18, fontWeight: fonts.heavy },
    trendChange: { fontSize: 12, fontWeight: fonts.bold },
    trendPeriod: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    privacyNote: { color: t.text.muted, fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
    resourceTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 4 },
    resourceDesc: { color: t.text.secondary, fontSize: 12, lineHeight: 17 },
    actionBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    actionText: { color: '#fff', fontSize: 12, fontWeight: fonts.bold },
    totalParticipants: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  }), [t]);

  const totalParticipants = MOOD_LEVELS.reduce((s, m) => s + m.count, 0);
  const overallScore = demoMode ? 7.8 : 0;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Mood Map</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Anonymized community mood aggregate — see how the community is feeling collectively.
        </Text>
        <Text style={st.privacyNote}>All mood data is anonymized. Individual moods are never exposed.</Text>

        {demoMode && (
          <>
            <Text style={[st.overallScore, { color: t.accent.green }]}>{overallScore}</Text>
            <Text style={st.overallLabel}>Community Mood Score (out of 10)</Text>
            <Text style={st.totalParticipants}>{totalParticipants.toLocaleString()} participants today</Text>
          </>
        )}

        <View style={st.tabRow}>
          {(['today', 'trends', 'support'] as MoodTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'today' && (
          !demoMode ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see mood data.</Text>
          ) : (
            <>
              {MOOD_LEVELS.map(mood => (
                <View key={mood.label} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24, marginRight: 8 }}>{mood.icon}</Text>
                  <Text style={st.moodPct}>{mood.percentage}%</Text>
                  <View style={st.barContainer}>
                    <View style={[st.barFill, { width: `${mood.percentage}%`, backgroundColor: mood.color }]} />
                  </View>
                  <Text style={st.moodCount}>{mood.count.toLocaleString()}</Text>
                </View>
              ))}
              <View style={st.summaryRow}>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.green }]}>68%</Text>
                  <Text style={st.summaryLabel}>Positive</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.yellow }]}>17%</Text>
                  <Text style={st.summaryLabel}>Neutral</Text>
                </View>
                <View style={st.summaryCard}>
                  <Text style={[st.summaryNum, { color: t.accent.red }]}>15%</Text>
                  <Text style={st.summaryLabel}>Needs Support</Text>
                </View>
              </View>
            </>
          )
        )}

        {activeTab === 'trends' && (
          !demoMode ? (
            <Text style={st.empty}>Enable Demo Mode to see mood trends.</Text>
          ) : DEMO_TRENDS.map((tr, i) => (
            <View key={i} style={st.card}>
              <View style={st.row}>
                <Text style={st.trendPeriod}>{tr.period}</Text>
                <Text style={{ fontSize: 20 }}>{tr.dominantIcon}</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Average Score</Text>
                <Text style={[st.trendScore, { color: tr.averageScore >= 7 ? t.accent.green : tr.averageScore >= 5 ? t.accent.yellow : t.accent.red }]}>
                  {tr.averageScore.toFixed(1)}
                </Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Change</Text>
                <Text style={[st.trendChange, { color: tr.change >= 0 ? t.accent.green : t.accent.red }]}>
                  {tr.change >= 0 ? '+' : ''}{tr.change.toFixed(1)}
                </Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>Participation</Text>
                <Text style={st.val}>{tr.participationRate}%</Text>
              </View>
            </View>
          ))
        )}

        {activeTab === 'support' && (
          DEMO_SUPPORT.map(res => {
            const color = TYPE_COLORS[res.type] || t.accent.blue;
            return (
              <View key={res.id} style={st.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{res.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.resourceTitle}>{res.title}</Text>
                    <Text style={st.resourceDesc}>{res.description}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[st.actionBtn, { backgroundColor: color }]}>
                    <Text style={st.actionText}>{TYPE_LABELS[res.type]}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {!demoMode && activeTab !== 'support' && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample mood data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
