/**
 * Community Radar — Real-time pulse of community activity.
 *
 * A live feed showing what's happening across the Open Chain community
 * right now: recent contributions, trending topics, and important alerts
 * that need attention.
 *
 * Features:
 * - Activity feed: recent OTK mints, burns, transfers, governance votes
 * - Trending: most active channels, rising contributors, hot discussions
 * - Alerts: system-wide alerts, governance deadlines, community milestones
 * - Demo mode with sample activity data
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

type RadarTab = 'activity' | 'trending' | 'alerts';

interface ActivityItem {
  id: string;
  type: 'mint' | 'burn' | 'transfer' | 'vote' | 'pledge';
  actor: string;
  description: string;
  channel: string;
  amount: number;
  timestamp: string;
  icon: string;
}

interface TrendingItem {
  id: string;
  label: string;
  category: string;
  score: number;
  change: number;
  icon: string;
}

interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  body: string;
  timestamp: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  warning: '#eab308',
  urgent: '#ef4444',
};

const TYPE_COLORS: Record<string, string> = {
  mint: '#22c55e',
  burn: '#ef4444',
  transfer: '#3b82f6',
  vote: '#8b5cf6',
  pledge: '#f7931a',
};

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'mint', actor: 'UID-8372', description: 'Earned nOTK for mentoring session', channel: 'nurture', amount: 150, timestamp: '2 min ago', icon: '\u{1F49B}' },
  { id: 'a2', type: 'vote', actor: 'UID-1290', description: 'Voted on Proposal #47: Park Renovation', channel: 'governance', amount: 0, timestamp: '5 min ago', icon: '\u{1F5F3}' },
  { id: 'a3', type: 'transfer', actor: 'UID-4451', description: 'Sent eOTK to community garden project', channel: 'economic', amount: 500, timestamp: '8 min ago', icon: '\u{1F4B0}' },
  { id: 'a4', type: 'mint', actor: 'UID-6673', description: 'Earned hOTK for 30-day wellness streak', channel: 'health', amount: 300, timestamp: '12 min ago', icon: '\u{1FA7A}' },
  { id: 'a5', type: 'burn', actor: 'System', description: 'Correction: false credential claim by UID-9021', channel: 'education', amount: 200, timestamp: '15 min ago', icon: '\u{1F4DA}' },
  { id: 'a6', type: 'pledge', actor: 'UID-3318', description: 'Signed Environmental Stewardship Pledge', channel: 'community', amount: 0, timestamp: '18 min ago', icon: '\u{1F91D}' },
  { id: 'a7', type: 'mint', actor: 'UID-7742', description: 'Earned edOTK for teaching coding workshop', channel: 'education', amount: 250, timestamp: '22 min ago', icon: '\u{1F4DA}' },
  { id: 'a8', type: 'transfer', actor: 'UID-2205', description: 'Donated to Sahel Region recovery fund', channel: 'community', amount: 1000, timestamp: '30 min ago', icon: '\u{1F91D}' },
];

const DEMO_TRENDING: TrendingItem[] = [
  { id: 't1', label: 'Nurture Channel', category: 'Channel', score: 45200, change: 12, icon: '\u{1F49B}' },
  { id: 't2', label: 'Park Renovation Vote', category: 'Governance', score: 8340, change: 89, icon: '\u{1F5F3}' },
  { id: 't3', label: 'Coding Workshops', category: 'Education', score: 6100, change: 34, icon: '\u{1F4DA}' },
  { id: 't4', label: 'Community Gardens', category: 'Economic', score: 4800, change: 22, icon: '\u{1F331}' },
  { id: 't5', label: 'Wellness Streaks', category: 'Health', score: 3900, change: 15, icon: '\u{1FA7A}' },
  { id: 't6', label: 'Mentorship Network', category: 'Nurture', score: 3200, change: 8, icon: '\u{1F91D}' },
];

const DEMO_ALERTS: AlertItem[] = [
  { id: 'al1', severity: 'urgent', title: 'Sahel Region Needs Support', body: 'Health channel trending critically negative. Community resources requested.', timestamp: '1 hour ago' },
  { id: 'al2', severity: 'warning', title: 'Governance Vote Closing Soon', body: 'Proposal #47 (Park Renovation) closes in 6 hours. 72% participation so far.', timestamp: '2 hours ago' },
  { id: 'al3', severity: 'info', title: 'Milestone: 1M Total OTK Minted', body: 'The community has collectively earned over 1 million OTK this month.', timestamp: '5 hours ago' },
  { id: 'al4', severity: 'info', title: 'New Skill Tree Unlocked', body: 'Advanced Environmental Stewardship path now available for contributors.', timestamp: '8 hours ago' },
];

function formatScore(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function CommunityRadarScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<RadarTab>('activity');

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
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    activityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    activityActor: { color: t.accent.blue, fontSize: 12, fontWeight: '700' },
    activityDesc: { color: t.text.primary, fontSize: 13, marginTop: 2 },
    activityTime: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    activityAmount: { fontSize: 14, fontWeight: '800' },
    trendScore: { color: t.text.primary, fontSize: 16, fontWeight: '800' },
    trendChange: { fontSize: 12, fontWeight: '700' },
    trendLabel: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    trendCategory: { color: t.text.muted, fontSize: 11 },
    alertTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    alertBody: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    alertTime: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    liveText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  }), [t]);

  const activity = demoMode ? DEMO_ACTIVITY : [];
  const trending = demoMode ? DEMO_TRENDING : [];
  const alerts = demoMode ? DEMO_ALERTS : [];

  const TAB_LABELS: Record<RadarTab, string> = {
    activity: 'Activity',
    trending: 'Trending',
    alerts: `Alerts (${alerts.length})`,
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Community Radar</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Real-time pulse of community activity across all Open Chain channels.
        </Text>

        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{activity.length}</Text>
              <Text style={st.summaryLabel}>Recent Events</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{trending.length}</Text>
              <Text style={st.summaryLabel}>Trending</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{alerts.length}</Text>
              <Text style={st.summaryLabel}>Alerts</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['activity', 'trending', 'alerts'] as RadarTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'activity' && (
          activity.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see sample activity.</Text>
          ) : (
            <>
              <View style={st.liveIndicator}>
                <View style={st.liveDot} />
                <Text style={st.liveText}>Live Feed</Text>
              </View>
              {activity.map(item => (
                <View key={item.id} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={[st.activityIcon, { backgroundColor: (TYPE_COLORS[item.type] || t.accent.blue) + '20' }]}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.activityActor}>{item.actor}</Text>
                    <Text style={st.activityDesc}>{item.description}</Text>
                    <Text style={st.activityTime}>{item.timestamp}</Text>
                  </View>
                  {item.amount > 0 && (
                    <Text style={[st.activityAmount, { color: item.type === 'burn' ? t.accent.red : t.accent.green }]}>
                      {item.type === 'burn' ? '-' : '+'}{item.amount}
                    </Text>
                  )}
                </View>
              ))}
            </>
          )
        )}

        {activeTab === 'trending' && (
          trending.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see trending topics.</Text>
          ) : trending.map((item, i) => (
            <View key={item.id} style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.trendLabel}>{item.label}</Text>
                <Text style={st.trendCategory}>{item.category} #{i + 1}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={st.trendScore}>{formatScore(item.score)}</Text>
                <Text style={[st.trendChange, { color: t.accent.green }]}>+{item.change}%</Text>
              </View>
            </View>
          ))
        )}

        {activeTab === 'alerts' && (
          alerts.length === 0 ? (
            <Text style={st.empty}>No alerts at this time.</Text>
          ) : alerts.map(item => (
            <View key={item.id} style={[st.card, { borderLeftWidth: 3, borderLeftColor: SEVERITY_COLORS[item.severity] }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={[st.severityDot, { backgroundColor: SEVERITY_COLORS[item.severity] }]} />
                <Text style={st.alertTitle}>{item.title}</Text>
              </View>
              <Text style={st.alertBody}>{item.body}</Text>
              <Text style={st.alertTime}>{item.timestamp}</Text>
            </View>
          ))
        )}

        {!demoMode && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample community radar data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
