import { fonts } from '../utils/theme';
/**
 * Impact Report Screen — Annual personal impact report.
 *
 * "The measure of a life well-lived is the value created for others."
 * — Human Constitution, Article IV
 *
 * A comprehensive view of your contributions across all channels for the year:
 * annual summary, channel breakdown, milestones, community impact,
 * environmental impact, governance, gratitude, year-over-year comparison,
 * and a shareable impact card.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

// ─── Channel annual data ───

interface ChannelYear {
  channel: string;
  ticker: string;
  color: string;
  earned: number;
  given: number;
  received: number;
}

const DEMO_CHANNELS: ChannelYear[] = [
  { channel: 'Nurture',    ticker: 'nOTK', color: '#ec4899', earned: 1_840, given: 620,  received: 480 },
  { channel: 'Education',  ticker: 'eOTK', color: '#3b82f6', earned: 1_320, given: 410,  received: 350 },
  { channel: 'Health',     ticker: 'hOTK', color: '#22c55e', earned: 780,   given: 260,  received: 190 },
  { channel: 'Community',  ticker: 'cOTK', color: '#f97316', earned: 1_050, given: 380,  received: 310 },
  { channel: 'Economic',   ticker: 'xOTK', color: '#eab308', earned: 560,   given: 140,  received: 200 },
  { channel: 'Governance', ticker: 'gOTK', color: '#8b5cf6', earned: 340,   given: 90,   received: 120 },
];

// ─── Milestones ───

interface Milestone {
  icon: string;
  title: string;
  date: string;
}

const DEMO_MILESTONES: Milestone[] = [
  { icon: '\uD83C\uDFC6', title: 'Community Pillar — 200+ volunteer hours',       date: 'Jan 2026' },
  { icon: '\uD83C\uDF93', title: 'Knowledge Sharer — Mentored 15 students',       date: 'Mar 2026' },
  { icon: '\uD83D\uDC96', title: 'Nurturing Heart — 20 parenting milestones',     date: 'May 2026' },
  { icon: '\uD83D\uDDF3\uFE0F', title: 'Active Citizen — Voted on 12 proposals',  date: 'Jul 2026' },
  { icon: '\uD83C\uDF31', title: 'Green Guardian — 50 trees planted',             date: 'Sep 2026' },
  { icon: '\uD83E\uDDE2', title: 'Gratitude Magnet — Thanked by 60 people',       date: 'Nov 2026' },
];

// ─── Community impact ───

interface CommunityMetric {
  icon: string;
  label: string;
  value: string;
}

const DEMO_COMMUNITY: CommunityMetric[] = [
  { icon: '\uD83E\uDD1D', label: 'People Helped',           value: '142' },
  { icon: '\uD83D\uDCC1', label: 'Projects Contributed To', value: '18' },
  { icon: '\u23F0',       label: 'Hours Volunteered',        value: '312' },
  { icon: '\uD83C\uDFD8\uFE0F', label: 'Events Organized',  value: '8' },
];

// ─── Environmental impact ───

const DEMO_ENVIRONMENT: CommunityMetric[] = [
  { icon: '\uD83C\uDF33', label: 'Trees Planted',            value: '52' },
  { icon: '\uD83C\uDF2C\uFE0F', label: 'CO\u2082 Offset (kg)', value: '1,240' },
  { icon: '\uD83E\uDDF9', label: 'Cleanup Events',           value: '6' },
  { icon: '\u267B\uFE0F', label: 'Recycling Drives',         value: '4' },
];

// ─── Governance ───

const DEMO_GOVERNANCE: CommunityMetric[] = [
  { icon: '\uD83D\uDDF3\uFE0F', label: 'Votes Cast',           value: '12' },
  { icon: '\uD83D\uDCDD', label: 'Proposals Submitted',    value: '3' },
  { icon: '\uD83D\uDCAC', label: 'Debates Joined',         value: '9' },
  { icon: '\u2696\uFE0F', label: 'Amendments Supported',   value: '5' },
];

// ─── Gratitude ───

interface GratitudeStats {
  given: number;
  received: number;
  mostThanked: string;
  mostGratefulTo: string;
}

const DEMO_GRATITUDE: GratitudeStats = {
  given: 87,
  received: 64,
  mostThanked: 'Maria (your mentee)',
  mostGratefulTo: 'Dad (nOTK gratitude)',
};

// ─── Year-over-year ───

interface YoYMetric {
  label: string;
  thisYear: number;
  lastYear: number;
}

const DEMO_YOY: YoYMetric[] = [
  { label: 'Total OTK Earned',     thisYear: 5_890, lastYear: 3_420 },
  { label: 'People Helped',        thisYear: 142,   lastYear: 88 },
  { label: 'Volunteer Hours',      thisYear: 312,   lastYear: 195 },
  { label: 'Milestones Unlocked',  thisYear: 6,     lastYear: 3 },
  { label: 'Gratitude Received',   thisYear: 64,    lastYear: 38 },
  { label: 'Governance Votes',     thisYear: 12,    lastYear: 5 },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function pctChange(now: number, prev: number): string {
  if (prev === 0) return '+\u221E';
  const pct = Math.round(((now - prev) / prev) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

// ─── Main Component ───

export function ImpactReportScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [reportYear] = useState(2026);

  const totalEarned = useMemo(() => DEMO_CHANNELS.reduce((s, c) => s + c.earned, 0), []);
  const totalGiven = useMemo(() => DEMO_CHANNELS.reduce((s, c) => s + c.given, 0), []);
  const totalReceived = useMemo(() => DEMO_CHANNELS.reduce((s, c) => s + c.received, 0), []);
  const maxChannel = useMemo(() => Math.max(...DEMO_CHANNELS.map(c => c.earned)), []);

  const handleShare = () => {
    Alert.alert(
      'Share Impact Card',
      `Your ${reportYear} Impact Report:\n\n` +
      `Total OTK Earned: ${formatNumber(totalEarned)}\n` +
      `People Helped: 142\n` +
      `Volunteer Hours: 312\n` +
      `Trees Planted: 52\n` +
      `Milestones: ${DEMO_MILESTONES.length}\n\n` +
      'Generated by Open Chain',
      [{ text: 'Copy to Clipboard' }, { text: 'Done' }],
    );
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    demoTag: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    // Hero
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.accent.green, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    // Channel breakdown
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    barLabel: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold, width: 80 },
    barTrack: { flex: 1, height: 18, backgroundColor: t.border, borderRadius: 9, overflow: 'hidden', marginHorizontal: 8 },
    barFill: { height: 18, borderRadius: 9 },
    barValue: { color: t.text.muted, fontSize: 11, width: 50, textAlign: 'right' },
    channelDetail: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
    channelDetailItem: { alignItems: 'center' },
    channelDetailValue: { fontSize: 13, fontWeight: fonts.bold },
    channelDetailLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    // Milestones
    milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    milestoneIcon: { fontSize: 24, width: 36, textAlign: 'center' },
    milestoneContent: { flex: 1, marginLeft: 10 },
    milestoneTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    milestoneDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Metric grid
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricItem: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'center' },
    metricIcon: { fontSize: 28, marginBottom: 6 },
    metricValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    metricLabel: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 4 },
    // Gratitude
    gratRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    gratItem: { alignItems: 'center' },
    gratValue: { fontSize: 28, fontWeight: fonts.heavy },
    gratLabel: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    gratConnection: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8 },
    gratConnLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    gratConnValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    // YoY
    yoyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
    yoyLabel: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold, flex: 1 },
    yoyValues: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    yoyThisYear: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, width: 60, textAlign: 'right' },
    yoyLastYear: { color: t.text.muted, fontSize: 12, width: 60, textAlign: 'right' },
    yoyChange: { fontSize: 13, fontWeight: fonts.heavy, width: 60, textAlign: 'right' },
    // Share
    shareBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    shareBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    footer: { height: 40 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Impact Report</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — Annual Summary */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\uD83D\uDCCA'}</Text>
          <Text style={s.heroTitle}>{reportYear} Annual Report</Text>
          <Text style={s.heroSubtitle}>
            A comprehensive view of your contributions across all value channels this year.
          </Text>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatNumber(totalEarned)}</Text>
              <Text style={s.summaryLabel}>Earned</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatNumber(totalGiven)}</Text>
              <Text style={s.summaryLabel}>Given</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatNumber(totalReceived)}</Text>
              <Text style={s.summaryLabel}>Received</Text>
            </View>
          </View>
        </View>

        {/* Channel Breakdown */}
        <Text style={s.section}>{'\uD83D\uDCC8'}  Channel Breakdown</Text>
        <View style={s.card}>
          {DEMO_CHANNELS.map((ch, i) => (
            <View key={ch.ticker}>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{ch.channel}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${(ch.earned / maxChannel) * 100}%`, backgroundColor: ch.color }]} />
                </View>
                <Text style={s.barValue}>{formatNumber(ch.earned)}</Text>
              </View>
              <View style={s.channelDetail}>
                <View style={s.channelDetailItem}>
                  <Text style={[s.channelDetailValue, { color: ch.color }]}>{formatNumber(ch.earned)}</Text>
                  <Text style={s.channelDetailLabel}>Earned</Text>
                </View>
                <View style={s.channelDetailItem}>
                  <Text style={[s.channelDetailValue, { color: t.accent.orange }]}>{formatNumber(ch.given)}</Text>
                  <Text style={s.channelDetailLabel}>Given</Text>
                </View>
                <View style={s.channelDetailItem}>
                  <Text style={[s.channelDetailValue, { color: t.accent.green }]}>{formatNumber(ch.received)}</Text>
                  <Text style={s.channelDetailLabel}>Received</Text>
                </View>
              </View>
              {i < DEMO_CHANNELS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* Key Milestones */}
        <Text style={s.section}>{'\uD83C\uDFC5'}  Key Milestones This Year</Text>
        <View style={s.card}>
          {DEMO_MILESTONES.map((m, i) => (
            <View key={m.title}>
              <View style={s.milestoneRow}>
                <Text style={s.milestoneIcon}>{m.icon}</Text>
                <View style={s.milestoneContent}>
                  <Text style={s.milestoneTitle}>{m.title}</Text>
                  <Text style={s.milestoneDate}>{m.date}</Text>
                </View>
              </View>
              {i < DEMO_MILESTONES.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* Community Impact */}
        <Text style={s.section}>{'\uD83E\uDD1D'}  Community Impact</Text>
        <View style={s.card}>
          <View style={s.metricGrid}>
            {DEMO_COMMUNITY.map((m) => (
              <View key={m.label} style={s.metricItem}>
                <Text style={s.metricIcon}>{m.icon}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Environmental Impact */}
        <Text style={s.section}>{'\uD83C\uDF0D'}  Environmental Impact</Text>
        <View style={s.card}>
          <View style={s.metricGrid}>
            {DEMO_ENVIRONMENT.map((m) => (
              <View key={m.label} style={s.metricItem}>
                <Text style={s.metricIcon}>{m.icon}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Governance Participation */}
        <Text style={s.section}>{'\uD83C\uDFDB\uFE0F'}  Governance Participation</Text>
        <View style={s.card}>
          <View style={s.metricGrid}>
            {DEMO_GOVERNANCE.map((m) => (
              <View key={m.label} style={s.metricItem}>
                <Text style={s.metricIcon}>{m.icon}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Gratitude */}
        <Text style={s.section}>{'\uD83D\uDE4F'}  Gratitude</Text>
        <View style={s.card}>
          <View style={s.gratRow}>
            <View style={s.gratItem}>
              <Text style={[s.gratValue, { color: t.accent.purple }]}>{DEMO_GRATITUDE.given}</Text>
              <Text style={s.gratLabel}>Given</Text>
            </View>
            <View style={s.gratItem}>
              <Text style={[s.gratValue, { color: t.accent.green }]}>{DEMO_GRATITUDE.received}</Text>
              <Text style={s.gratLabel}>Received</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.gratConnection}>
            <Text style={s.gratConnLabel}>Most thanked you</Text>
            <Text style={s.gratConnValue}>{DEMO_GRATITUDE.mostThanked}</Text>
          </View>
          <View style={s.gratConnection}>
            <Text style={s.gratConnLabel}>You thanked most</Text>
            <Text style={s.gratConnValue}>{DEMO_GRATITUDE.mostGratefulTo}</Text>
          </View>
        </View>

        {/* Year-over-Year */}
        <Text style={s.section}>{'\uD83D\uDD04'}  Year-over-Year</Text>
        <View style={s.card}>
          {/* Column headers */}
          <View style={[s.yoyRow, { paddingVertical: 4 }]}>
            <Text style={[s.yoyLabel, { color: t.text.muted, fontSize: 11 }]}>Metric</Text>
            <View style={s.yoyValues}>
              <Text style={[s.yoyThisYear, { color: t.text.muted, fontSize: 11 }]}>{reportYear}</Text>
              <Text style={[s.yoyLastYear, { fontSize: 11 }]}>{reportYear - 1}</Text>
              <Text style={[s.yoyChange, { color: t.text.muted, fontSize: 11 }]}>Change</Text>
            </View>
          </View>
          <View style={s.divider} />
          {DEMO_YOY.map((m, i) => (
            <View key={m.label}>
              <View style={s.yoyRow}>
                <Text style={s.yoyLabel}>{m.label}</Text>
                <View style={s.yoyValues}>
                  <Text style={s.yoyThisYear}>{formatNumber(m.thisYear)}</Text>
                  <Text style={s.yoyLastYear}>{formatNumber(m.lastYear)}</Text>
                  <Text style={[s.yoyChange, { color: m.thisYear >= m.lastYear ? t.accent.green : t.accent.red }]}>
                    {pctChange(m.thisYear, m.lastYear)}
                  </Text>
                </View>
              </View>
              {i < DEMO_YOY.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* Share Impact Card */}
        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnText}>{'\uD83D\uDCE4'}  Share Impact Card</Text>
        </TouchableOpacity>

        <Text style={s.demoTag}>DEMO DATA \u2014 {reportYear} ANNUAL REPORT</Text>
        <View style={s.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}
