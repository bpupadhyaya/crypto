import { fonts } from '../utils/theme';
/**
 * Progress Report Screen — Monthly progress report across all activities.
 *
 * A single scrollable view showing a comprehensive monthly summary of
 * contributions, milestones, OTK earned, and growth across all value channels.
 * "What gets measured gets improved."
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface ChannelProgress {
  channel: string;
  icon: string;
  color: string;
  otkEarned: number;
  prevOTK: number;
  milestones: number;
  activities: number;
  highlight: string;
}

interface WeekSummary {
  week: string;
  otkEarned: number;
  activities: number;
  topChannel: string;
}

const CHANNEL_DATA: ChannelProgress[] = [
  { channel: 'Nurture', icon: '\u{1F49B}', color: '#ec4899', otkEarned: 450, prevOTK: 380, milestones: 2, activities: 18, highlight: 'Child reading milestone achieved' },
  { channel: 'Education', icon: '\u{1F4DA}', color: '#3b82f6', otkEarned: 320, prevOTK: 290, milestones: 1, activities: 12, highlight: 'Completed mentoring 3 students' },
  { channel: 'Health', icon: '\u{1F49A}', color: '#10b981', otkEarned: 180, prevOTK: 200, milestones: 1, activities: 8, highlight: 'Annual wellness checkup verified' },
  { channel: 'Community', icon: '\u{1F91D}', color: '#f59e0b', otkEarned: 270, prevOTK: 210, milestones: 1, activities: 15, highlight: 'Led neighborhood cleanup drive' },
  { channel: 'Governance', icon: '\u{1F3DB}\uFE0F', color: '#8b5cf6', otkEarned: 90, prevOTK: 75, milestones: 0, activities: 4, highlight: 'Voted on 3 community proposals' },
  { channel: 'Economic', icon: '\u{1F4B0}', color: '#06b6d4', otkEarned: 140, prevOTK: 120, milestones: 0, activities: 6, highlight: 'Completed financial literacy course' },
];

const WEEKLY_DATA: WeekSummary[] = [
  { week: 'Week 1 (Mar 1-7)', otkEarned: 320, activities: 14, topChannel: 'Nurture' },
  { week: 'Week 2 (Mar 8-14)', otkEarned: 380, activities: 17, topChannel: 'Community' },
  { week: 'Week 3 (Mar 15-21)', otkEarned: 410, activities: 19, topChannel: 'Education' },
  { week: 'Week 4 (Mar 22-28)', otkEarned: 340, activities: 13, topChannel: 'Nurture' },
];

const DEMO_MONTH = 'March 2026';
const DEMO_TOTAL_OTK = 1450;
const DEMO_PREV_TOTAL = 1275;
const DEMO_TOTAL_MILESTONES = 5;
const DEMO_TOTAL_ACTIVITIES = 63;
const DEMO_RANK = 12;
const DEMO_RANK_CHANGE = 3;

export function ProgressReportScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();

  const totalGrowth = useMemo(() => {
    return Math.round(((DEMO_TOTAL_OTK - DEMO_PREV_TOTAL) / DEMO_PREV_TOTAL) * 100);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold },
    monthLabel: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', marginBottom: 4 },
    reportTitle: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 20 },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    summaryItem: { alignItems: 'center' },
    summaryNum: { fontSize: fonts.xxxl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    growthBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent.green + '15', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'center' },
    growthText: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy, marginBottom: 12, marginTop: 8 },
    channelCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    channelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    channelIcon: { fontSize: fonts.xxl },
    channelName: { flex: 1, fontSize: fonts.md, fontWeight: fonts.bold },
    channelOTK: { fontSize: fonts.lg, fontWeight: fonts.heavy },
    channelChange: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    channelStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    channelStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    channelStatLabel: { color: t.text.muted, fontSize: fonts.sm },
    channelStatVal: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
    channelHighlight: { color: t.text.secondary, fontSize: fonts.sm, fontStyle: 'italic', lineHeight: 18 },
    barBg: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    weekCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    weekLabel: { flex: 1, color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    weekOTK: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.heavy, marginRight: 12 },
    weekAct: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, width: 50, textAlign: 'right' },
    weekTop: { color: t.text.secondary, fontSize: fonts.sm, width: 70, textAlign: 'right' },
    rankCard: { backgroundColor: t.accent.purple + '15', borderRadius: 14, padding: 16, marginBottom: 20, alignItems: 'center' },
    rankNum: { color: t.accent.purple, fontSize: fonts.hero, fontWeight: fonts.heavy },
    rankLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    rankChange: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 2 },
    footer: { backgroundColor: t.bg.card, borderRadius: 14, padding: 20, marginTop: 8, alignItems: 'center' },
    footerText: { color: t.text.secondary, fontSize: fonts.md, textAlign: 'center', lineHeight: 22 },
    footerBold: { color: t.text.primary, fontWeight: fonts.bold },
  }), [t]);

  const maxOTK = Math.max(...CHANNEL_DATA.map(c => c.otkEarned));

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Progress Report</Text>
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

        <Text style={s.monthLabel}>{DEMO_MONTH}</Text>
        <Text style={s.reportTitle}>Monthly Progress Report</Text>

        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: t.accent.green }]}>{DEMO_TOTAL_OTK}</Text>
              <Text style={s.summaryLabel}>OTK Earned</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: t.accent.blue }]}>{DEMO_TOTAL_MILESTONES}</Text>
              <Text style={s.summaryLabel}>Milestones</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNum, { color: t.accent.purple }]}>{DEMO_TOTAL_ACTIVITIES}</Text>
              <Text style={s.summaryLabel}>Activities</Text>
            </View>
          </View>
          <View style={s.growthBadge}>
            <Text style={s.growthText}>{'\u2191'} {totalGrowth}% vs last month</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>By Value Channel</Text>
        {CHANNEL_DATA.map(ch => {
          const change = Math.round(((ch.otkEarned - ch.prevOTK) / ch.prevOTK) * 100);
          return (
            <View key={ch.channel} style={s.channelCard}>
              <View style={s.channelHeader}>
                <Text style={s.channelIcon}>{ch.icon}</Text>
                <Text style={[s.channelName, { color: ch.color }]}>{ch.channel}</Text>
                <Text style={[s.channelOTK, { color: ch.color }]}>{ch.otkEarned} OTK</Text>
                <Text style={[s.channelChange, { color: change >= 0 ? t.accent.green : '#ef4444' }]}>
                  {change >= 0 ? '\u2191' : '\u2193'}{Math.abs(change)}%
                </Text>
              </View>
              <View style={s.channelStats}>
                <View style={s.channelStat}>
                  <Text style={s.channelStatLabel}>Milestones:</Text>
                  <Text style={s.channelStatVal}>{ch.milestones}</Text>
                </View>
                <View style={s.channelStat}>
                  <Text style={s.channelStatLabel}>Activities:</Text>
                  <Text style={s.channelStatVal}>{ch.activities}</Text>
                </View>
              </View>
              <Text style={s.channelHighlight}>{ch.highlight}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${(ch.otkEarned / maxOTK) * 100}%`, backgroundColor: ch.color }]} />
              </View>
            </View>
          );
        })}

        <Text style={s.sectionTitle}>Weekly Breakdown</Text>
        {WEEKLY_DATA.map(w => (
          <View key={w.week} style={s.weekCard}>
            <Text style={s.weekLabel}>{w.week}</Text>
            <Text style={s.weekOTK}>{w.otkEarned}</Text>
            <Text style={s.weekAct}>{w.activities} acts</Text>
            <Text style={s.weekTop}>{w.topChannel}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>Community Ranking</Text>
        <View style={s.rankCard}>
          <Text style={s.rankNum}>#{DEMO_RANK}</Text>
          <Text style={s.rankLabel}>in your community</Text>
          <Text style={s.rankChange}>{'\u2191'} {DEMO_RANK_CHANGE} positions this month</Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>
            <Text style={s.footerBold}>Keep going!</Text> Your contributions across all channels are building a better community. Every action counts toward the Peace Index.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
