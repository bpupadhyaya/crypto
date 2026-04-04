import { fonts } from '../utils/theme';
/**
 * Wellness Check Screen — Quick daily wellness self-assessment across dimensions.
 *
 * A single scrollable view for assessing physical, mental, emotional,
 * social, and spiritual wellness. Track trends and earn hOTK for
 * consistent self-care monitoring.
 * "Knowing yourself is the beginning of all wellness."
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

interface WellnessDimension {
  key: string;
  title: string;
  icon: string;
  color: string;
  question: string;
  tips: string[];
}

interface HistoryDay {
  date: string;
  scores: Record<string, number>;
  average: number;
}

const DIMENSIONS: WellnessDimension[] = [
  {
    key: 'physical', title: 'Physical', icon: '\u{1F4AA}', color: '#ef4444',
    question: 'How does your body feel today?',
    tips: ['Get 7-8 hours of sleep', 'Stay hydrated', 'Move for 30 minutes'],
  },
  {
    key: 'mental', title: 'Mental', icon: '\u{1F9E0}', color: '#3b82f6',
    question: 'How clear and focused is your mind?',
    tips: ['Take breaks every 90 min', 'Practice mindfulness', 'Limit screen time'],
  },
  {
    key: 'emotional', title: 'Emotional', icon: '\u{1F49C}', color: '#8b5cf6',
    question: 'How are you feeling emotionally?',
    tips: ['Name your emotions', 'Talk to someone you trust', 'Practice gratitude'],
  },
  {
    key: 'social', title: 'Social', icon: '\u{1F91D}', color: '#f59e0b',
    question: 'How connected do you feel to others?',
    tips: ['Reach out to a friend', 'Attend a community event', 'Practice active listening'],
  },
  {
    key: 'spiritual', title: 'Spiritual', icon: '\u{1F54A}\uFE0F', color: '#10b981',
    question: 'How aligned do you feel with your purpose?',
    tips: ['Reflect on your values', 'Spend time in nature', 'Practice meditation'],
  },
];

const SCORE_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Below Average',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

const DEMO_HISTORY: HistoryDay[] = [
  { date: 'Mar 29', scores: { physical: 4, mental: 3, emotional: 4, social: 5, spiritual: 4 }, average: 4.0 },
  { date: 'Mar 28', scores: { physical: 3, mental: 4, emotional: 3, social: 4, spiritual: 3 }, average: 3.4 },
  { date: 'Mar 27', scores: { physical: 4, mental: 4, emotional: 4, social: 3, spiritual: 4 }, average: 3.8 },
  { date: 'Mar 26', scores: { physical: 5, mental: 3, emotional: 4, social: 4, spiritual: 5 }, average: 4.2 },
  { date: 'Mar 25', scores: { physical: 3, mental: 2, emotional: 3, social: 3, spiritual: 3 }, average: 2.8 },
  { date: 'Mar 24', scores: { physical: 4, mental: 4, emotional: 5, social: 4, spiritual: 4 }, average: 4.2 },
  { date: 'Mar 23', scores: { physical: 4, mental: 3, emotional: 3, social: 5, spiritual: 4 }, average: 3.8 },
];

const DEMO_STREAK = 7;
const DEMO_HOTK_EARNED = 35;

export function WellnessCheckScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [scores, setScores] = useState<Record<string, number>>({});

  const allScored = DIMENSIONS.every(d => scores[d.key] !== undefined);
  const currentAverage = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }, [scores]);

  const weeklyAvg = useMemo(() => {
    const avgs = DEMO_HISTORY.map(h => h.average);
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
  }, []);

  const handleSubmit = () => {
    Alert.alert('Wellness Check Saved', `Today\'s average: ${currentAverage}/5\n\nYou earned 5 hOTK for self-care monitoring.\nStreak: ${DEMO_STREAK + 1} days!`);
  };

  const setScore = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    demoTag: { backgroundColor: t.accent.yellow + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center', marginBottom: 16 },
    demoText: { color: t.accent.yellow, fontSize: 12, fontWeight: fonts.bold },
    quote: { color: t.text.secondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 12 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: fonts.heavy, marginBottom: 2 },
    statLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
    dimCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    dimHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    dimIcon: { fontSize: 24 },
    dimTitle: { flex: 1, fontSize: 15, fontWeight: fonts.bold },
    dimSelected: { fontSize: 16, fontWeight: fonts.heavy },
    dimQuestion: { color: t.text.secondary, fontSize: 13, marginBottom: 12 },
    scoreRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    scoreBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 2 },
    scoreBtnNum: { fontSize: 16, fontWeight: fonts.heavy },
    scoreBtnLabel: { fontSize: 9, fontWeight: fonts.semibold, marginTop: 2 },
    tipsSection: { marginTop: 4 },
    tipText: { color: t.text.muted, fontSize: 12, lineHeight: 18, marginLeft: 8 },
    submitCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, marginTop: 8 },
    submitAvg: { fontSize: 40, fontWeight: fonts.heavy, marginBottom: 4 },
    submitLabel: { color: t.text.secondary, fontSize: 14, marginBottom: 4 },
    submitMood: { fontSize: 16, fontWeight: fonts.bold, marginBottom: 16 },
    submitBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    historyTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12, marginTop: 8 },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    historyDate: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8 },
    historyScores: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    historyChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyChipIcon: { fontSize: 12 },
    historyChipVal: { fontSize: 12, fontWeight: fonts.bold, color: '#fff' },
    historyAvg: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    footer: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
    footerText: { color: t.text.secondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  }), [t]);

  const getScoreColor = (score: number, dim: WellnessDimension) => {
    if (score >= 4) return dim.color;
    if (score >= 3) return t.accent.yellow;
    return '#ef4444';
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Wellness Check</Text>
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

        <Text style={s.quote}>"Knowing yourself is the beginning of all wellness."</Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.blue }]}>{DEMO_STREAK}</Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.green }]}>{weeklyAvg}</Text>
            <Text style={s.statLabel}>7-Day Avg</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: t.accent.purple }]}>{DEMO_HOTK_EARNED}</Text>
            <Text style={s.statLabel}>hOTK Earned</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Today's Check-In</Text>
        {DIMENSIONS.map(dim => {
          const selected = scores[dim.key];
          return (
            <View key={dim.key} style={s.dimCard}>
              <View style={s.dimHeader}>
                <Text style={s.dimIcon}>{dim.icon}</Text>
                <Text style={[s.dimTitle, { color: dim.color }]}>{dim.title}</Text>
                {selected !== undefined && (
                  <Text style={[s.dimSelected, { color: dim.color }]}>{selected}/5</Text>
                )}
              </View>
              <Text style={s.dimQuestion}>{dim.question}</Text>
              <View style={s.scoreRow}>
                {[1, 2, 3, 4, 5].map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      s.scoreBtn,
                      {
                        borderColor: selected === val ? dim.color : t.border,
                        backgroundColor: selected === val ? dim.color + '20' : 'transparent',
                      },
                    ]}
                    onPress={() => setScore(dim.key, val)}
                  >
                    <Text style={[s.scoreBtnNum, { color: selected === val ? dim.color : t.text.secondary }]}>{val}</Text>
                    <Text style={[s.scoreBtnLabel, { color: selected === val ? dim.color : t.text.muted }]}>
                      {SCORE_LABELS[val]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selected !== undefined && selected <= 2 && (
                <View style={s.tipsSection}>
                  {dim.tips.map(tip => (
                    <Text key={tip} style={s.tipText}>{'\u2022'} {tip}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {allScored && (
          <View style={s.submitCard}>
            <Text style={[s.submitAvg, { color: currentAverage >= 3.5 ? t.accent.green : currentAverage >= 2.5 ? t.accent.yellow : '#ef4444' }]}>
              {currentAverage}
            </Text>
            <Text style={s.submitLabel}>Today's Wellness Score</Text>
            <Text style={[s.submitMood, { color: currentAverage >= 4 ? t.accent.green : currentAverage >= 3 ? t.accent.blue : '#ef4444' }]}>
              {currentAverage >= 4 ? 'Thriving' : currentAverage >= 3 ? 'Managing' : 'Needs Attention'}
            </Text>
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.green }]} onPress={handleSubmit}>
              <Text style={s.submitBtnText}>Save Check-In (+5 hOTK)</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.historyTitle}>Recent History</Text>
        {DEMO_HISTORY.map(day => (
          <View key={day.date} style={s.historyCard}>
            <Text style={s.historyDate}>{day.date}</Text>
            <View style={s.historyScores}>
              {DIMENSIONS.map(dim => {
                const val = day.scores[dim.key] || 0;
                return (
                  <View key={dim.key} style={[s.historyChip, { backgroundColor: getScoreColor(val, dim) }]}>
                    <Text style={s.historyChipIcon}>{dim.icon}</Text>
                    <Text style={s.historyChipVal}>{val}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={s.historyAvg}>Average: {day.average}/5</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>
            Consistent self-monitoring builds awareness. You earn 5 hOTK for each daily check-in. Keep your streak alive!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
