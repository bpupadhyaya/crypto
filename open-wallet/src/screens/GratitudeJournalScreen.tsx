import { fonts } from '../utils/theme';
/**
 * Gratitude Journal Screen — Article I (nOTK) of The Human Constitution.
 *
 * "Gratitude is the bridge between receiving value and recognizing it.
 *  A daily practice of gratitude strengthens the human bonds that
 *  Open Chain seeks to preserve and celebrate."
 *
 * Features:
 * - Daily gratitude entry (3 things you're grateful for today)
 * - Gratitude streak tracking (consecutive days)
 * - Monthly reflection summaries
 * - Gratitude chain — link entries to on-chain Gratitude Transactions (send nOTK)
 * - Gratitude patterns — most common themes over time
 * - Community gratitude board preview (link to GratitudeWall)
 * - Demo: 15-day streak, 5 recent entries, 3 gratitude themes
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  linkedTx?: string;
  linkedRecipient?: string;
}

interface GratitudeTheme {
  theme: string;
  icon: string;
  count: number;
  color: string;
}

interface MonthSummary {
  month: string;
  entriesCount: number;
  topTheme: string;
  linkedTxCount: number;
  streak: number;
}

// ─── Demo Data ───

const DEMO_ENTRIES: GratitudeEntry[] = [
  {
    id: 'ge-1',
    date: '2026-03-29',
    items: [
      'My mother called to check on me today',
      'Found a peaceful moment during morning walk',
      'A stranger held the door open and smiled',
    ],
  },
  {
    id: 'ge-2',
    date: '2026-03-28',
    items: [
      'Teacher from high school reached out after 10 years',
      'Community garden harvest was plentiful',
      'Good health — felt strong during exercise',
    ],
    linkedTx: 'A3F7B2...8C1D',
    linkedRecipient: 'Mrs. Patel (Teacher)',
  },
  {
    id: 'ge-3',
    date: '2026-03-27',
    items: [
      'Children laughing in the park',
      'Fresh bread from the local bakery',
      'Clear night sky — saw the stars',
    ],
  },
  {
    id: 'ge-4',
    date: '2026-03-26',
    items: [
      'My partner cooked my favorite meal',
      'Productive day at work — felt accomplished',
      'Neighbor helped fix the fence without being asked',
    ],
    linkedTx: 'D9E4C1...7A2B',
    linkedRecipient: 'Neighbor (Ram)',
  },
  {
    id: 'ge-5',
    date: '2026-03-25',
    items: [
      'Morning meditation brought deep calm',
      'Received a thoughtful message from an old friend',
      'Beautiful sunset on the way home',
    ],
  },
];

const DEMO_THEMES: GratitudeTheme[] = [
  { theme: 'Family & Loved Ones', icon: '\u{1F49B}', count: 34, color: '#ef4444' },
  { theme: 'Nature & Beauty', icon: '\u{1F33F}', count: 22, color: '#22c55e' },
  { theme: 'Community & Kindness', icon: '\u{1F91D}', count: 18, color: '#8b5cf6' },
];

const DEMO_MONTH_SUMMARY: MonthSummary = {
  month: 'March 2026',
  entriesCount: 27,
  topTheme: 'Family & Loved Ones',
  linkedTxCount: 4,
  streak: 15,
};

const DEMO_STREAK = 15;
const DEMO_TOTAL_ENTRIES = 89;
const DEMO_TOTAL_LINKED = 12;

export function GratitudeJournalScreen({ onClose }: Props) {
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    streakCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    streakItem: { alignItems: 'center' },
    streakNumber: { color: t.text.primary, fontSize: 28, fontWeight: fonts.heavy },
    streakLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
    streakFire: { fontSize: 24, marginBottom: 4 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    inputNumber: { color: t.accent.purple, fontSize: 16, fontWeight: fonts.heavy, marginRight: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardDate: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    cardItem: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginTop: 6 },
    linkedBadge: { backgroundColor: t.accent.purple + '15', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
    linkedText: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.bold },
    themeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
    themeIcon: { fontSize: 32 },
    themeLabel: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    themeCount: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    themeBar: { height: 6, backgroundColor: t.border, borderRadius: 3, marginTop: 6 },
    themeFill: { height: 6, borderRadius: 3 },
    monthCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 12 },
    monthTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, textAlign: 'center' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 16, gap: 16 },
    monthStat: { alignItems: 'center', minWidth: 80 },
    monthStatNumber: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    monthStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    communityPreview: { backgroundColor: t.accent.purple + '08', borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    communityTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 8 },
    communitySubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    communityBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, marginTop: 12 },
    communityBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const streak = demoMode ? DEMO_STREAK : 0;
  const totalEntries = demoMode ? DEMO_TOTAL_ENTRIES : 0;
  const totalLinked = demoMode ? DEMO_TOTAL_LINKED : 0;
  const entries = demoMode ? DEMO_ENTRIES : [];
  const themes = demoMode ? DEMO_THEMES : [];
  const monthSummary = demoMode ? DEMO_MONTH_SUMMARY : null;
  const maxThemeCount = themes.length > 0 ? Math.max(...themes.map(th => th.count)) : 1;

  // ─── Save Today's Entry ───
  const handleSave = useCallback(() => {
    const items = [gratitude1.trim(), gratitude2.trim(), gratitude3.trim()].filter(Boolean);
    if (items.length === 0) {
      Alert.alert('Write Something', 'Enter at least one thing you are grateful for today.');
      return;
    }

    if (demoMode) {
      Alert.alert(
        'Gratitude Saved (Demo)',
        `${items.length} gratitude ${items.length === 1 ? 'item' : 'items'} recorded for today.\n\nYour streak continues! Keep reflecting daily to strengthen your gratitude practice.`,
      );
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
    } else {
      Alert.alert('Gratitude Saved', 'Your daily gratitude has been recorded. You can link it to an on-chain Gratitude Transaction anytime.');
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
    }
  }, [gratitude1, gratitude2, gratitude3, demoMode]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Gratitude Journal</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F64F}'}</Text>
          <Text style={s.heroTitle}>Daily Gratitude Practice</Text>
          <Text style={s.heroSubtitle}>
            Three things you are grateful for today. A simple practice that deepens awareness of the value flowing through your life.
          </Text>
        </View>

        {/* Streak Stats */}
        <View style={s.streakCard}>
          <View style={s.streakItem}>
            <Text style={s.streakFire}>{'\u{1F525}'}</Text>
            <Text style={s.streakNumber}>{streak}</Text>
            <Text style={s.streakLabel}>Day Streak</Text>
          </View>
          <View style={s.streakItem}>
            <Text style={s.streakFire}>{'\u{1F4D6}'}</Text>
            <Text style={s.streakNumber}>{totalEntries}</Text>
            <Text style={s.streakLabel}>Total Entries</Text>
          </View>
          <View style={s.streakItem}>
            <Text style={s.streakFire}>{'\u26D3}'}</Text>
            <Text style={s.streakNumber}>{totalLinked}</Text>
            <Text style={s.streakLabel}>On-Chain Links</Text>
          </View>
        </View>

        {/* Today's Entry */}
        <Text style={s.section}>Today's Gratitude</Text>
        <View style={s.inputCard}>
          <View style={s.inputRow}>
            <Text style={s.inputNumber}>1.</Text>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="I am grateful for..."
              placeholderTextColor={t.text.muted}
              value={gratitude1}
              onChangeText={setGratitude1}
            />
          </View>
        </View>
        <View style={s.inputCard}>
          <View style={s.inputRow}>
            <Text style={s.inputNumber}>2.</Text>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="I am grateful for..."
              placeholderTextColor={t.text.muted}
              value={gratitude2}
              onChangeText={setGratitude2}
            />
          </View>
        </View>
        <View style={s.inputCard}>
          <View style={s.inputRow}>
            <Text style={s.inputNumber}>3.</Text>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="I am grateful for..."
              placeholderTextColor={t.text.muted}
              value={gratitude3}
              onChangeText={setGratitude3}
            />
          </View>
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSave}>
          <Text style={s.submitBtnText}>Save Today's Gratitude</Text>
        </TouchableOpacity>

        {/* Gratitude Patterns */}
        {themes.length > 0 && (
          <>
            <Text style={s.section}>Gratitude Patterns</Text>
            {themes.map((theme) => {
              const barWidth = (theme.count / maxThemeCount) * 100;
              return (
                <View key={theme.theme} style={s.themeCard}>
                  <Text style={s.themeIcon}>{theme.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.themeLabel}>{theme.theme}</Text>
                    <Text style={s.themeCount}>{theme.count} mentions</Text>
                    <View style={s.themeBar}>
                      <View style={[s.themeFill, { width: `${barWidth}%`, backgroundColor: theme.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Recent Entries */}
        {entries.length > 0 && (
          <>
            <Text style={s.section}>Recent Entries</Text>
            {entries.map((entry) => (
              <View key={entry.id} style={s.card}>
                <Text style={s.cardDate}>{entry.date}</Text>
                {entry.items.map((item, idx) => (
                  <Text key={idx} style={s.cardItem}>
                    {idx + 1}. {item}
                  </Text>
                ))}
                {entry.linkedTx && (
                  <View style={s.linkedBadge}>
                    <Text style={s.linkedText}>
                      {'\u26D3'} Linked to Gratitude Tx: {entry.linkedTx}
                    </Text>
                  </View>
                )}
                {entry.linkedRecipient && (
                  <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
                    Sent nOTK to: {entry.linkedRecipient}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Monthly Summary */}
        {monthSummary && (
          <>
            <Text style={s.section}>Monthly Reflection</Text>
            <View style={s.monthCard}>
              <Text style={s.monthTitle}>{monthSummary.month}</Text>
              <View style={s.monthGrid}>
                <View style={s.monthStat}>
                  <Text style={s.monthStatNumber}>{monthSummary.entriesCount}</Text>
                  <Text style={s.monthStatLabel}>Entries</Text>
                </View>
                <View style={s.monthStat}>
                  <Text style={s.monthStatNumber}>{monthSummary.streak}</Text>
                  <Text style={s.monthStatLabel}>Best Streak</Text>
                </View>
                <View style={s.monthStat}>
                  <Text style={s.monthStatNumber}>{monthSummary.linkedTxCount}</Text>
                  <Text style={s.monthStatLabel}>Linked Txs</Text>
                </View>
              </View>
              <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                Top theme: {monthSummary.topTheme}
              </Text>
            </View>
          </>
        )}

        {/* Community Gratitude Board Preview */}
        <Text style={s.section}>Community</Text>
        <View style={s.communityPreview}>
          <Text style={{ fontSize: 36 }}>{'\u{1F30D}'}</Text>
          <Text style={s.communityTitle}>Gratitude Wall</Text>
          <Text style={s.communitySubtitle}>
            See what your community is grateful for. Public gratitude entries and on-chain Gratitude Transactions are celebrated together.
          </Text>
          <TouchableOpacity style={s.communityBtn} onPress={() => Alert.alert('Coming Soon', 'Opens the community Gratitude Wall screen.')}>
            <Text style={s.communityBtnText}>View Gratitude Wall</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.note}>
          Your journal entries are stored locally. Only entries you explicitly link to on-chain Gratitude Transactions become part of the permanent Open Chain record.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
