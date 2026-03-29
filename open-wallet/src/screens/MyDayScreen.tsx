/**
 * My Day Screen — Single dashboard aggregating today's relevant info
 * from across all 246 screens into one scrollable view.
 *
 * "Each day is a new opportunity to nurture, contribute, and grow."
 * — Open Chain Philosophy
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

// ── Demo Data ──────────────────────────────────────────────

const DEMO_EVENTS = [
  { time: '09:00 AM', title: 'Community Standup', icon: '\u{1F91D}' },
  { time: '12:30 PM', title: 'Mentorship Session — Ava', icon: '\u{1F393}' },
  { time: '06:00 PM', title: 'Governance Vote Closes', icon: '\u{1F5F3}\u{FE0F}' },
];

const DEMO_STREAKS = [
  { label: 'Gratitude Journal', days: 15, icon: '\u{1F4D6}', color: '#eab308' },
  { label: 'Meditation', days: 23, icon: '\u{1F9D8}', color: '#8b5cf6' },
  { label: 'Sleep 7h+', days: 7, icon: '\u{1F634}', color: '#3b82f6' },
];

const DEMO_PENDING = [
  { label: '2 Governance Votes', icon: '\u{1F5F3}\u{FE0F}' },
  { label: '1 Guardian Approval', icon: '\u{1F6E1}\u{FE0F}' },
  { label: '3 Unread Messages', icon: '\u{1F4EC}' },
];

const DEMO_COMMUNITY = [
  { label: '1 new job posted in your area', icon: '\u{1F4BC}' },
  { label: '2 cleanup drives this week', icon: '\u{1F33F}' },
  { label: '1 fundraiser near goal — 94%', icon: '\u{1F3AF}' },
];

const DEMO_OTK = {
  total: '12,480.50',
  earnedToday: '+42.5',
  channels: [
    { key: 'nOTK', label: 'Nurture', amount: 4200, max: 5000, color: '#eab308' },
    { key: 'eOTK', label: 'Education', amount: 3100, max: 5000, color: '#3b82f6' },
    { key: 'cOTK', label: 'Community', amount: 2800, max: 5000, color: '#22c55e' },
    { key: 'hOTK', label: 'Health', amount: 2380, max: 5000, color: '#ef4444' },
  ],
};

const DEMO_QUICK_ACTIONS = [
  { label: 'Send', icon: '\u{1F4E4}' },
  { label: 'Receive', icon: '\u{1F4E5}' },
  { label: 'Gratitude', icon: '\u{1F49B}' },
  { label: 'SOS', icon: '\u{1F198}' },
  { label: 'Calendar', icon: '\u{1F4C5}' },
  { label: 'Search', icon: '\u{1F50D}' },
];

const DEMO_WISDOM = {
  quote: 'The best time to plant a tree was twenty years ago. The second best time is now.',
  source: 'Elder Wisdom Archive',
  elder: 'African Proverb',
};

const DEMO_SKY = {
  summary: 'Clear skies tonight. Jupiter visible after 9 PM, near the western horizon.',
  icon: '\u{1F30C}',
};

// ── Helpers ────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────

export function MyDayScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((st) => st.demoMode);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },

    // Greeting
    greetingCard: {
      backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24,
      marginHorizontal: 20, marginTop: 8,
    },
    greetingText: { color: t.text.primary, fontSize: 26, fontWeight: '800' },
    dateText: { color: t.text.secondary, fontSize: 14, marginTop: 4 },
    weatherRow: {
      flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8,
    },
    weatherIcon: { fontSize: 28 },
    weatherText: { color: t.text.primary, fontSize: 16, fontWeight: '600' },
    weatherSub: { color: t.text.muted, fontSize: 13 },

    // Sections
    sectionHeader: {
      color: t.text.secondary, fontSize: 12, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1.5,
      marginLeft: 24, marginBottom: 10, marginTop: 28,
    },

    // Cards
    card: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16,
      marginHorizontal: 20, marginTop: 8,
    },
    cardRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12,
    },
    cardIcon: { fontSize: 22, width: 32, textAlign: 'center' },
    cardTextPrimary: { color: t.text.primary, fontSize: 15, fontWeight: '600', flex: 1 },
    cardTextSecondary: { color: t.text.muted, fontSize: 13 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 2 },

    // Health check
    healthCard: {
      backgroundColor: t.accent.green + '10', borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginTop: 8,
    },
    healthPrompt: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    healthSub: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    healthRow: {
      flexDirection: 'row', justifyContent: 'space-around', marginTop: 16,
    },
    moodBtn: { alignItems: 'center', gap: 4 },
    moodIcon: { fontSize: 32 },
    moodLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600' },
    healthStats: {
      flexDirection: 'row', justifyContent: 'space-around', marginTop: 16,
      paddingTop: 16, borderTopWidth: 1, borderTopColor: t.border,
    },
    healthStat: { alignItems: 'center' },
    healthStatValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    healthStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },

    // Streaks
    streakRow: {
      flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8,
    },
    streakItem: { alignItems: 'center', gap: 4 },
    streakIcon: { fontSize: 28 },
    streakDays: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    streakLabel: { color: t.text.muted, fontSize: 11 },
    streakBar: { width: 48, height: 4, borderRadius: 2, marginTop: 4 },

    // OTK
    otkCard: {
      backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginTop: 8,
    },
    otkHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    },
    otkTotal: { color: t.text.primary, fontSize: 28, fontWeight: '800' },
    otkLabel: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    otkEarned: { color: t.accent.green, fontSize: 16, fontWeight: '700' },
    otkEarnedLabel: { color: t.text.muted, fontSize: 11 },
    channelRow: { marginTop: 16, gap: 10 },
    channelItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    channelLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600', width: 70 },
    channelBarBg: {
      flex: 1, height: 8, borderRadius: 4, backgroundColor: t.bg.primary,
    },
    channelBarFill: { height: 8, borderRadius: 4 },
    channelAmount: { color: t.text.muted, fontSize: 11, width: 44, textAlign: 'right' },

    // Quick Actions
    quickRow: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around',
      paddingHorizontal: 20, marginTop: 8, gap: 12,
    },
    quickBtn: {
      backgroundColor: t.bg.card, borderRadius: 16, width: 96, height: 80,
      alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    quickIcon: { fontSize: 24 },
    quickLabel: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },

    // Wisdom
    wisdomCard: {
      backgroundColor: t.accent.yellow + '10', borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginTop: 8,
    },
    wisdomQuote: {
      color: t.text.primary, fontSize: 15, fontWeight: '600',
      fontStyle: 'italic', lineHeight: 22,
    },
    wisdomSource: { color: t.text.muted, fontSize: 12, marginTop: 8 },

    // Sky
    skyCard: {
      backgroundColor: t.accent.blue + '08', borderRadius: 16, padding: 20,
      marginHorizontal: 20, marginTop: 8,
    },
    skyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    skyIcon: { fontSize: 36 },
    skyText: { color: t.text.primary, fontSize: 14, flex: 1, lineHeight: 20 },

    tapHint: { color: t.text.muted, fontSize: 11, textAlign: 'right', marginRight: 24, marginTop: 6 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>My Day</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* 1. Greeting + Weather */}
        <View style={s.greetingCard}>
          <Text style={s.greetingText}>{getGreeting()}, Bhim</Text>
          <Text style={s.dateText}>{getTodayFormatted()}</Text>
          <View style={s.weatherRow}>
            <Text style={s.weatherIcon}>{'\u{26C5}'}</Text>
            <View>
              <Text style={s.weatherText}>24°C — Partly Cloudy</Text>
              <Text style={s.weatherSub}>Feels like 22°C · UV Index 3</Text>
            </View>
          </View>
        </View>

        {/* 2. Today's Events */}
        <Text style={s.sectionHeader}>Today's Events</Text>
        <TouchableOpacity style={s.card} activeOpacity={0.7}>
          {DEMO_EVENTS.map((ev, i) => (
            <React.Fragment key={ev.title}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.cardRow}>
                <Text style={s.cardIcon}>{ev.icon}</Text>
                <Text style={s.cardTextPrimary}>{ev.title}</Text>
                <Text style={s.cardTextSecondary}>{ev.time}</Text>
              </View>
            </React.Fragment>
          ))}
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to open Calendar</Text>

        {/* 3. Health Check */}
        <Text style={s.sectionHeader}>Health Check</Text>
        <TouchableOpacity style={s.healthCard} activeOpacity={0.7}>
          <Text style={s.healthPrompt}>How are you feeling today?</Text>
          <Text style={s.healthSub}>Tap to log your mood</Text>
          <View style={s.healthRow}>
            {[
              { icon: '\u{1F60A}', label: 'Great' },
              { icon: '\u{1F642}', label: 'Good' },
              { icon: '\u{1F610}', label: 'Okay' },
              { icon: '\u{1F614}', label: 'Low' },
              { icon: '\u{1F61E}', label: 'Rough' },
            ].map((mood) => (
              <TouchableOpacity key={mood.label} style={s.moodBtn} activeOpacity={0.6}>
                <Text style={s.moodIcon}>{mood.icon}</Text>
                <Text style={s.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.healthStats}>
            <View style={s.healthStat}>
              <Text style={s.healthStatValue}>7h 20m</Text>
              <Text style={s.healthStatLabel}>Sleep Last Night</Text>
            </View>
            <View style={s.healthStat}>
              <Text style={s.healthStatValue}>23</Text>
              <Text style={s.healthStatLabel}>Meditation Streak</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to open Wellness</Text>

        {/* 4. Active Streaks */}
        <Text style={s.sectionHeader}>Active Streaks</Text>
        <TouchableOpacity style={s.card} activeOpacity={0.7}>
          <View style={s.streakRow}>
            {DEMO_STREAKS.map((streak) => (
              <View key={streak.label} style={s.streakItem}>
                <Text style={s.streakIcon}>{streak.icon}</Text>
                <Text style={s.streakDays}>{streak.days}</Text>
                <Text style={s.streakLabel}>{streak.label}</Text>
                <View style={[s.streakBar, { backgroundColor: streak.color }]} />
              </View>
            ))}
          </View>
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to view all streaks</Text>

        {/* 5. Pending Actions */}
        <Text style={s.sectionHeader}>Pending Actions</Text>
        <TouchableOpacity style={s.card} activeOpacity={0.7}>
          {DEMO_PENDING.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.cardRow}>
                <Text style={s.cardIcon}>{item.icon}</Text>
                <Text style={s.cardTextPrimary}>{item.label}</Text>
                <Text style={[s.cardTextSecondary, { color: t.accent.orange }]}>{'\u{276F}'}</Text>
              </View>
            </React.Fragment>
          ))}
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to resolve</Text>

        {/* 6. Community Highlights */}
        <Text style={s.sectionHeader}>Community Highlights</Text>
        <TouchableOpacity style={s.card} activeOpacity={0.7}>
          {DEMO_COMMUNITY.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.cardRow}>
                <Text style={s.cardIcon}>{item.icon}</Text>
                <Text style={s.cardTextPrimary}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to open Community Board</Text>

        {/* 7. OTK Summary */}
        <Text style={s.sectionHeader}>OTK Summary</Text>
        <TouchableOpacity style={s.otkCard} activeOpacity={0.7}>
          <View style={s.otkHeaderRow}>
            <View>
              <Text style={s.otkTotal}>{DEMO_OTK.total} OTK</Text>
              <Text style={s.otkLabel}>Total Balance</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.otkEarned}>{DEMO_OTK.earnedToday}</Text>
              <Text style={s.otkEarnedLabel}>Earned Today</Text>
            </View>
          </View>
          <View style={s.channelRow}>
            {DEMO_OTK.channels.map((ch) => (
              <View key={ch.key} style={s.channelItem}>
                <Text style={s.channelLabel}>{ch.label}</Text>
                <View style={s.channelBarBg}>
                  <View
                    style={[
                      s.channelBarFill,
                      { width: `${(ch.amount / ch.max) * 100}%`, backgroundColor: ch.color },
                    ]}
                  />
                </View>
                <Text style={s.channelAmount}>{ch.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to open Portfolio</Text>

        {/* 8. Quick Actions */}
        <Text style={s.sectionHeader}>Quick Actions</Text>
        <View style={s.quickRow}>
          {DEMO_QUICK_ACTIONS.map((action) => (
            <TouchableOpacity key={action.label} style={s.quickBtn} activeOpacity={0.7}>
              <Text style={s.quickIcon}>{action.icon}</Text>
              <Text style={s.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 9. Daily Wisdom */}
        <Text style={s.sectionHeader}>Daily Wisdom</Text>
        <TouchableOpacity style={s.wisdomCard} activeOpacity={0.7}>
          <Text style={s.wisdomQuote}>"{DEMO_WISDOM.quote}"</Text>
          <Text style={s.wisdomSource}>
            — {DEMO_WISDOM.elder} · {DEMO_WISDOM.source}
          </Text>
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to explore Elder Wisdom</Text>

        {/* 10. Tonight's Sky */}
        <Text style={s.sectionHeader}>Tonight's Sky</Text>
        <TouchableOpacity style={s.skyCard} activeOpacity={0.7}>
          <View style={s.skyRow}>
            <Text style={s.skyIcon}>{DEMO_SKY.icon}</Text>
            <Text style={s.skyText}>{DEMO_SKY.summary}</Text>
          </View>
        </TouchableOpacity>
        <Text style={s.tapHint}>Tap to open Astronomy</Text>

      </ScrollView>
    </SafeAreaView>
  );
}
