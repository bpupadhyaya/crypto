import { fonts } from '../utils/theme';
/**
 * Gratitude Wall Screen — A public celebration board of gratitude flowing
 * across Open Chain.
 *
 * "When gratitude becomes visible, it transforms societies."
 * — The Human Constitution, Article III, Section 4
 *
 * This is the heart of the Constitution — a live feed of humans recognizing
 * other humans for the value they create. Beautiful, emotional, public.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
  onSendGratitude?: () => void;
}

type CelebrationTier = 'heartfelt' | 'great' | 'epic' | 'legendary';

interface GratitudeEntry {
  id: string;
  fromUID: string; // anonymized
  toUID: string;   // anonymized
  channel: string;
  channelIcon: string;
  amount: number;
  tier: CelebrationTier;
  message: string;
  timestamp: string;
  isPublic: boolean; // opted in to Wall of Thanks
}

interface GratitudeStats {
  today: number;
  thisWeek: number;
  allTime: number;
  todayAmount: number;
  thisWeekAmount: number;
  allTimeAmount: number;
}

interface ChannelStat {
  channel: string;
  icon: string;
  count: number;
  percentage: number;
}

const TIER_CONFIG: Record<CelebrationTier, { label: string; icon: string; color: string; minAmount: number }> = {
  heartfelt: { label: 'Heartfelt', icon: '\u{1F49B}', color: '#FFD700', minAmount: 1 },
  great: { label: 'Great', icon: '\u{1F31F}', color: '#FF8C00', minAmount: 100 },
  epic: { label: 'Epic', icon: '\u{1F525}', color: '#FF4500', minAmount: 500 },
  legendary: { label: 'Legendary', icon: '\u{1F451}', color: '#9B59B6', minAmount: 1000 },
};

// Demo live feed
const DEMO_FEED: GratitudeEntry[] = [
  { id: 'gw1', fromUID: 'uid-...a3f2', toUID: 'uid-...b7c1', channel: 'nOTK', channelIcon: '\u{1F49B}', amount: 500, tier: 'great', message: 'For 20 years of unconditional love and support', timestamp: '2 min ago', isPublic: true },
  { id: 'gw2', fromUID: 'uid-...d4e8', toUID: 'uid-...f9a0', channel: 'eOTK', channelIcon: '\u{1F4DA}', amount: 1200, tier: 'legendary', message: 'You changed my life when you taught me to read at age 7', timestamp: '5 min ago', isPublic: true },
  { id: 'gw3', fromUID: 'uid-...c1b2', toUID: 'uid-...e3d4', channel: 'cOTK', channelIcon: '\u{1F91D}', amount: 80, tier: 'heartfelt', message: 'Thank you for cleaning up our neighborhood every morning', timestamp: '8 min ago', isPublic: true },
  { id: 'gw4', fromUID: 'uid-...f5a6', toUID: 'uid-...g7h8', channel: 'hOTK', channelIcon: '\u{1FA7A}', amount: 2000, tier: 'legendary', message: 'You saved my mothers life with your care and dedication', timestamp: '12 min ago', isPublic: true },
  { id: 'gw5', fromUID: 'uid-...i9j0', toUID: 'uid-...k1l2', channel: 'nOTK', channelIcon: '\u{1F49B}', amount: 300, tier: 'great', message: 'Every bedtime story you told shaped my imagination', timestamp: '15 min ago', isPublic: true },
  { id: 'gw6', fromUID: 'uid-...m3n4', toUID: 'uid-...o5p6', channel: 'eOTK', channelIcon: '\u{1F4DA}', amount: 150, tier: 'great', message: 'Best math teacher I ever had — you made numbers beautiful', timestamp: '18 min ago', isPublic: true },
  { id: 'gw7', fromUID: 'uid-...q7r8', toUID: 'uid-...s9t0', channel: 'cOTK', channelIcon: '\u{1F91D}', amount: 600, tier: 'epic', message: 'You organized our entire community garden project', timestamp: '22 min ago', isPublic: true },
  { id: 'gw8', fromUID: 'uid-...u1v2', toUID: 'uid-...w3x4', channel: 'nOTK', channelIcon: '\u{1F49B}', amount: 50, tier: 'heartfelt', message: 'A small thank you for always being there', timestamp: '25 min ago', isPublic: false },
  { id: 'gw9', fromUID: 'uid-...y5z6', toUID: 'uid-...a7b8', channel: 'gOTK', channelIcon: '\u{1F3DB}\u{FE0F}', amount: 800, tier: 'epic', message: 'Your public service improved our entire district', timestamp: '30 min ago', isPublic: true },
  { id: 'gw10', fromUID: 'uid-...c9d0', toUID: 'uid-...e1f2', channel: 'hOTK', channelIcon: '\u{1FA7A}', amount: 400, tier: 'great', message: 'You helped me through the darkest months of recovery', timestamp: '35 min ago', isPublic: true },
];

const DEMO_STATS: GratitudeStats = {
  today: 14892,
  thisWeek: 98437,
  allTime: 4872301,
  todayAmount: 2847500,
  thisWeekAmount: 18934200,
  allTimeAmount: 912847300,
};

const DEMO_CHANNEL_STATS: ChannelStat[] = [
  { channel: 'nOTK (Nurture)', icon: '\u{1F49B}', count: 1847293, percentage: 38 },
  { channel: 'eOTK (Education)', icon: '\u{1F4DA}', count: 1218472, percentage: 25 },
  { channel: 'cOTK (Community)', icon: '\u{1F91D}', count: 974612, percentage: 20 },
  { channel: 'hOTK (Health)', icon: '\u{1FA7A}', count: 487230, percentage: 10 },
  { channel: 'gOTK (Governance)', icon: '\u{1F3DB}\u{FE0F}', count: 243615, percentage: 5 },
  { channel: 'wOTK (Wellness)', icon: '\u{1F9D8}', count: 101079, percentage: 2 },
];

const DEMO_WALL_OF_THANKS: GratitudeEntry[] = DEMO_FEED.filter(e => e.isPublic && (e.tier === 'epic' || e.tier === 'legendary'));

type TabKey = 'feed' | 'stats' | 'wall' | 'channels';

export function GratitudeWallScreen({ onClose, onSendGratitude }: Props) {
  const [tab, setTab] = useState<TabKey>('feed');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const t = useTheme();

  // Gentle pulse animation for the hero
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '15', borderRadius: 24, padding: 28, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 56, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20, fontStyle: 'italic' },
    heroStatsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    heroStat: { alignItems: 'center' },
    heroStatValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    heroStatLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16, gap: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    // Feed styles
    feedCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    feedChannel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    feedChannelIcon: { fontSize: 20 },
    feedChannelLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    feedTier: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    feedTierIcon: { fontSize: 16 },
    feedTierLabel: { fontSize: 12, fontWeight: fonts.bold },
    feedUIDs: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    feedMessage: { color: t.text.primary, fontSize: 14, marginTop: 8, lineHeight: 20 },
    feedFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    feedAmount: { color: t.accent.green, fontSize: 14, fontWeight: fonts.heavy },
    feedTime: { color: t.text.muted, fontSize: 11 },
    // Stats styles
    statsCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    statsLabel: { color: t.text.secondary, fontSize: 13 },
    statsValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    // Channel styles
    channelCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginHorizontal: 20, marginTop: 8 },
    channelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    channelIcon: { fontSize: 24 },
    channelName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    channelCount: { color: t.text.secondary, fontSize: 12 },
    channelBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
    channelBarFill: { height: 6, backgroundColor: t.accent.purple, borderRadius: 3 },
    channelPct: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.bold, marginTop: 4 },
    // Wall of Thanks
    wallCard: { borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8, borderWidth: 2 },
    wallMessage: { color: t.text.primary, fontSize: 16, fontWeight: fonts.semibold, lineHeight: 24, textAlign: 'center' },
    wallFrom: { color: t.text.muted, fontSize: 12, marginTop: 10, textAlign: 'center' },
    wallAmount: { fontSize: 14, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 6 },
    // Send button
    sendBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 30 },
    sendBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
  }), [t]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'feed', label: 'Live Feed' },
    { key: 'stats', label: 'Stats' },
    { key: 'wall', label: 'Wall' },
    { key: 'channels', label: 'Channels' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Gratitude Wall</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {/* Hero with pulse */}
        <Animated.View style={[s.heroCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.heroIcon}>{'\u{1F49C}'}</Text>
          <Text style={s.heroTitle}>The World's Gratitude</Text>
          <Text style={s.heroSubtitle}>
            {"\"When gratitude becomes visible, it transforms societies.\"\n— The Human Constitution"}
          </Text>
          <View style={s.heroStatsRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{(DEMO_STATS.today).toLocaleString()}</Text>
              <Text style={s.heroStatLabel}>Today</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{(DEMO_STATS.thisWeek / 1000).toFixed(0)}k</Text>
              <Text style={s.heroStatLabel}>This Week</Text>
            </View>
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{(DEMO_STATS.allTime / 1000000).toFixed(1)}M</Text>
              <Text style={s.heroStatLabel}>All Time</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Live Feed Tab ── */}
        {tab === 'feed' && (
          <>
            <Text style={s.section}>LIVE GRATITUDE STREAM</Text>
            {DEMO_FEED.map(entry => {
              const tierCfg = TIER_CONFIG[entry.tier];
              return (
                <View key={entry.id} style={s.feedCard}>
                  <View style={s.feedHeader}>
                    <View style={s.feedChannel}>
                      <Text style={s.feedChannelIcon}>{entry.channelIcon}</Text>
                      <Text style={s.feedChannelLabel}>{entry.channel}</Text>
                    </View>
                    <View style={s.feedTier}>
                      <Text style={s.feedTierIcon}>{tierCfg.icon}</Text>
                      <Text style={[s.feedTierLabel, { color: tierCfg.color }]}>{tierCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={s.feedUIDs}>{entry.fromUID} {'\u{2192}'} {entry.toUID}</Text>
                  <Text style={s.feedMessage}>"{entry.message}"</Text>
                  <View style={s.feedFooter}>
                    <Text style={s.feedAmount}>+{entry.amount.toLocaleString()} {entry.channel}</Text>
                    <Text style={s.feedTime}>{entry.timestamp}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ── Stats Tab ── */}
        {tab === 'stats' && (
          <>
            <Text style={s.section}>GRATITUDE STATISTICS</Text>
            <View style={s.statsCard}>
              <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 12 }}>Transaction Count</Text>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>Today</Text>
                <Text style={s.statsValue}>{DEMO_STATS.today.toLocaleString()}</Text>
              </View>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>This Week</Text>
                <Text style={s.statsValue}>{DEMO_STATS.thisWeek.toLocaleString()}</Text>
              </View>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>All Time</Text>
                <Text style={s.statsValue}>{DEMO_STATS.allTime.toLocaleString()}</Text>
              </View>
            </View>

            <View style={[s.statsCard, { marginTop: 12 }]}>
              <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 12 }}>OTK Volume</Text>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>Today</Text>
                <Text style={[s.statsValue, { color: t.accent.green }]}>{(DEMO_STATS.todayAmount / 1000).toLocaleString()}k OTK</Text>
              </View>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>This Week</Text>
                <Text style={[s.statsValue, { color: t.accent.green }]}>{(DEMO_STATS.thisWeekAmount / 1000000).toFixed(1)}M OTK</Text>
              </View>
              <View style={s.statsRow}>
                <Text style={s.statsLabel}>All Time</Text>
                <Text style={[s.statsValue, { color: t.accent.green }]}>{(DEMO_STATS.allTimeAmount / 1000000).toFixed(0)}M OTK</Text>
              </View>
            </View>

            <Text style={s.section}>CELEBRATION TIERS</Text>
            <View style={s.statsCard}>
              {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                <View key={key} style={[s.statsRow, { alignItems: 'center' }]}>
                  <Text style={{ color: t.text.secondary, fontSize: 13 }}>
                    {cfg.icon} {cfg.label}
                  </Text>
                  <Text style={[s.statsValue, { color: cfg.color }]}>
                    {cfg.minAmount === 1 ? '1-99' : cfg.minAmount === 100 ? '100-499' : cfg.minAmount === 500 ? '500-999' : '1,000+'} OTK
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Wall of Thanks Tab ── */}
        {tab === 'wall' && (
          <>
            <Text style={s.section}>WALL OF THANKS</Text>
            <View style={[{ backgroundColor: t.bg.card, borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 8 }]}>
              <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
                Featured gratitude messages from people who chose to share their thanks publicly. Opt in when sending gratitude to appear here.
              </Text>
            </View>
            {DEMO_WALL_OF_THANKS.map(entry => {
              const tierCfg = TIER_CONFIG[entry.tier];
              return (
                <View key={entry.id} style={[s.wallCard, { borderColor: tierCfg.color, backgroundColor: tierCfg.color + '10' }]}>
                  <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{tierCfg.icon}</Text>
                  <Text style={s.wallMessage}>"{entry.message}"</Text>
                  <Text style={s.wallFrom}>{entry.fromUID} {'\u{2192}'} {entry.toUID} via {entry.channel}</Text>
                  <Text style={[s.wallAmount, { color: tierCfg.color }]}>+{entry.amount.toLocaleString()} {entry.channel}</Text>
                </View>
              );
            })}

            {DEMO_FEED.filter(e => e.isPublic && e.tier !== 'epic' && e.tier !== 'legendary').slice(0, 4).map(entry => {
              const tierCfg = TIER_CONFIG[entry.tier];
              return (
                <View key={entry.id} style={[s.wallCard, { borderColor: tierCfg.color + '40', backgroundColor: t.bg.card }]}>
                  <Text style={[s.wallMessage, { fontSize: 14 }]}>"{entry.message}"</Text>
                  <Text style={s.wallFrom}>{entry.channelIcon} {entry.channel} — {entry.timestamp}</Text>
                </View>
              );
            })}
          </>
        )}

        {/* ── Channels Tab ── */}
        {tab === 'channels' && (
          <>
            <Text style={s.section}>TOP GRATITUDE CHANNELS</Text>
            {DEMO_CHANNEL_STATS.map(ch => (
              <View key={ch.channel} style={s.channelCard}>
                <View style={s.channelRow}>
                  <Text style={s.channelIcon}>{ch.icon}</Text>
                  <Text style={s.channelName}>{ch.channel}</Text>
                  <Text style={s.channelCount}>{(ch.count / 1000).toFixed(0)}k</Text>
                </View>
                <View style={s.channelBar}>
                  <View style={[s.channelBarFill, { width: `${ch.percentage}%` as any }]} />
                </View>
                <Text style={s.channelPct}>{ch.percentage}% of all gratitude</Text>
              </View>
            ))}
          </>
        )}

        {/* Send Gratitude button — always visible */}
        <TouchableOpacity style={s.sendBtn} onPress={onSendGratitude || (() => {})}>
          <Text style={s.sendBtnText}>Send Gratitude</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
