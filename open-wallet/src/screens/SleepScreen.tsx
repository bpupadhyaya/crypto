/**
 * Sleep Screen — Sleep tracking and sleep wellness.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents health value — consistent healthy sleep patterns earn hOTK.
 *
 * Features:
 * - Sleep log (bedtime, wake time, quality 1-5, notes)
 * - Sleep stats (average hours, consistency score, weekly chart as text bars)
 * - Sleep hygiene tips (reduce screen time, consistent schedule, dark room, temperature)
 * - Sleep challenges (community challenges like "7 hours for 7 days")
 * - hOTK earned for consistent healthy sleep patterns
 * - Demo: 7-day sleep history, average 7.2 hours, consistency score 78
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  hoursSlept: number;
  quality: number; // 1-5
  notes: string;
  hotkEarned: number;
}

interface SleepChallenge {
  id: string;
  title: string;
  description: string;
  goal: string;
  participants: number;
  daysLeft: number;
  joined: boolean;
  progress: number; // 0-100
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const QUALITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Poor', color: '#FF3B30' },
  2: { label: 'Fair', color: '#FF9500' },
  3: { label: 'Good', color: '#FFCC00' },
  4: { label: 'Great', color: '#34C759' },
  5: { label: 'Excellent', color: '#007AFF' },
};

const HYGIENE_TIPS = [
  { icon: 'S', title: 'Reduce Screen Time', detail: 'Avoid screens 1 hour before bed. Blue light suppresses melatonin production and delays sleep onset.' },
  { icon: 'C', title: 'Consistent Schedule', detail: 'Go to bed and wake up at the same time every day, even on weekends. Your circadian rhythm thrives on consistency.' },
  { icon: 'D', title: 'Dark Room', detail: 'Use blackout curtains or a sleep mask. Even small amounts of light can disrupt deep sleep cycles.' },
  { icon: 'T', title: 'Temperature', detail: 'Keep your bedroom between 60-67°F (15-19°C). A cool room promotes deeper, more restorative sleep.' },
  { icon: 'E', title: 'Exercise Timing', detail: 'Regular exercise improves sleep quality, but finish vigorous workouts at least 3 hours before bedtime.' },
  { icon: 'N', title: 'No Late Caffeine', detail: 'Avoid caffeine after 2 PM. Its half-life is 5-6 hours, meaning half is still in your system at bedtime.' },
];

// ─── Demo Data ───

const DEMO_SLEEP_ENTRIES: SleepEntry[] = [
  { id: '1', date: '2026-03-28', bedtime: '10:30 PM', wakeTime: '6:15 AM', hoursSlept: 7.75, quality: 4, notes: 'Fell asleep quickly, no interruptions', hotkEarned: 150 },
  { id: '2', date: '2026-03-27', bedtime: '11:00 PM', wakeTime: '6:30 AM', hoursSlept: 7.5, quality: 4, notes: 'Good consistent night', hotkEarned: 150 },
  { id: '3', date: '2026-03-26', bedtime: '10:45 PM', wakeTime: '5:45 AM', hoursSlept: 7.0, quality: 3, notes: 'Woke up once around 3 AM', hotkEarned: 120 },
  { id: '4', date: '2026-03-25', bedtime: '11:15 PM', wakeTime: '6:00 AM', hoursSlept: 6.75, quality: 3, notes: 'Took a while to fall asleep', hotkEarned: 100 },
  { id: '5', date: '2026-03-24', bedtime: '10:15 PM', wakeTime: '6:00 AM', hoursSlept: 7.75, quality: 5, notes: 'Best sleep this week, very refreshed', hotkEarned: 180 },
  { id: '6', date: '2026-03-23', bedtime: '10:30 PM', wakeTime: '5:30 AM', hoursSlept: 7.0, quality: 3, notes: 'Early morning alarm', hotkEarned: 120 },
  { id: '7', date: '2026-03-22', bedtime: '11:30 PM', wakeTime: '6:45 AM', hoursSlept: 7.25, quality: 4, notes: 'Stayed up reading but slept well', hotkEarned: 140 },
];

const DEMO_CHALLENGES: SleepChallenge[] = [
  { id: '1', title: '7 Hours for 7 Days', description: 'Sleep at least 7 hours every night for a full week.', goal: '7+ hours x 7 nights', participants: 342, daysLeft: 4, joined: true, progress: 71 },
  { id: '2', title: 'Early Bird Week', description: 'Wake up before 6:30 AM for 5 consecutive days.', goal: 'Wake < 6:30 AM x 5 days', participants: 189, daysLeft: 6, joined: false, progress: 0 },
  { id: '3', title: 'Screen-Free Evenings', description: 'No screens after 9 PM for 7 days straight.', goal: 'No screens after 9 PM x 7', participants: 267, daysLeft: 10, joined: false, progress: 0 },
  { id: '4', title: 'Consistent Bedtime', description: 'Go to bed within a 30-minute window for 10 days.', goal: 'Same bedtime ±15 min x 10', participants: 156, daysLeft: 8, joined: true, progress: 40 },
];

// ─── Stats Helpers ───

function computeStats(entries: SleepEntry[]) {
  const totalHours = entries.reduce((sum, e) => sum + e.hoursSlept, 0);
  const avgHours = entries.length > 0 ? totalHours / entries.length : 0;
  const avgQuality = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.quality, 0) / entries.length
    : 0;
  const totalHotk = entries.reduce((sum, e) => sum + e.hotkEarned, 0);

  // Consistency score: how close each night is to the average (0-100)
  const deviations = entries.map((e) => Math.abs(e.hoursSlept - avgHours));
  const avgDeviation = deviations.length > 0
    ? deviations.reduce((sum, d) => sum + d, 0) / deviations.length
    : 0;
  const consistencyScore = Math.round(Math.max(0, 100 - avgDeviation * 40));

  return { avgHours: Math.round(avgHours * 10) / 10, avgQuality: Math.round(avgQuality * 10) / 10, totalHotk, consistencyScore };
}

function renderTextBar(hours: number, maxHours: number): string {
  const barLength = Math.round((hours / maxHours) * 20);
  return '\u2588'.repeat(barLength) + '\u2591'.repeat(20 - barLength);
}

type Tab = 'log' | 'stats' | 'tips' | 'challenges';

export function SleepScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('log');
  const [bedtime, setBedtime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState(0);
  const [notes, setNotes] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const entries = DEMO_SLEEP_ENTRIES;
  const challenges = DEMO_CHALLENGES;
  const stats = useMemo(() => computeStats(entries), [entries]);

  const handleLogSleep = useCallback(() => {
    if (!bedtime.trim()) { Alert.alert('Required', 'Enter your bedtime.'); return; }
    if (!wakeTime.trim()) { Alert.alert('Required', 'Enter your wake time.'); return; }
    if (quality === 0) { Alert.alert('Required', 'Rate your sleep quality (1-5).'); return; }

    const hotkEstimate = quality >= 4 ? 150 : quality >= 3 ? 120 : 80;
    Alert.alert(
      'Sleep Logged',
      `Bedtime: ${bedtime}\nWake: ${wakeTime}\nQuality: ${QUALITY_LABELS[quality].label}\nEstimated hOTK: ${hotkEstimate}\n\nConsistent healthy sleep earns more hOTK.`,
    );
    setBedtime('');
    setWakeTime('');
    setQuality(0);
    setNotes('');
    setTab('stats');
  }, [bedtime, wakeTime, quality]);

  const handleJoinChallenge = useCallback((challenge: SleepChallenge) => {
    if (challenge.joined) {
      Alert.alert('Already Joined', `You are already participating in "${challenge.title}".`);
    } else {
      Alert.alert('Joined!', `You joined "${challenge.title}".\n${challenge.participants + 1} participants.\n${challenge.daysLeft} days remaining.`);
    }
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    inputLabel: { color: t.text.muted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    qualityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    qualityBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary, alignItems: 'center' },
    qualityBtnSelected: { borderWidth: 2 },
    qualityNumber: { fontSize: 16, fontWeight: '700' },
    qualityLabel: { fontSize: 10, marginTop: 2 },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 24, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    chartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    chartDate: { color: t.text.muted, fontSize: 11, width: 50 },
    chartBar: { color: t.accent.blue, fontSize: 11, fontFamily: 'Courier', flex: 1 },
    chartHours: { color: t.text.primary, fontSize: 12, fontWeight: '600', width: 45, textAlign: 'right' },
    entryRow: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 12 },
    entryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    entryIconText: { fontSize: 14, fontWeight: '700' },
    entryInfo: { flex: 1 },
    entryTitle: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    entryMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    entryRight: { alignItems: 'flex-end', justifyContent: 'center' },
    entryHotk: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    tipCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tipIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.blue + '20', justifyContent: 'center', alignItems: 'center' },
    tipIconText: { color: t.accent.blue, fontSize: 14, fontWeight: '700' },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 10 },
    tipDetail: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
    challengeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    challengeTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    challengeDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
    challengeMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    progressBarOuter: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 10 },
    progressBarInner: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    challengeBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    challengeBtnJoined: { backgroundColor: t.accent.green + '20' },
    challengeBtnJoin: { backgroundColor: t.accent.blue },
    challengeBtnText: { fontSize: 13, fontWeight: '700' },
    educationCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'log', label: 'Log Sleep' },
    { key: 'stats', label: 'Stats' },
    { key: 'tips', label: 'Tips' },
    { key: 'challenges', label: 'Challenges' },
  ];

  // ─── Log Tab ───

  const renderLog = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Log Tonight's Sleep</Text>

        <Text style={s.inputLabel}>Bedtime</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. 10:30 PM"
          placeholderTextColor={t.text.muted}
          value={bedtime}
          onChangeText={setBedtime}
        />

        <Text style={s.inputLabel}>Wake Time</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. 6:15 AM"
          placeholderTextColor={t.text.muted}
          value={wakeTime}
          onChangeText={setWakeTime}
        />

        <Text style={s.inputLabel}>Sleep Quality</Text>
        <View style={s.qualityRow}>
          {[1, 2, 3, 4, 5].map((q) => {
            const info = QUALITY_LABELS[q];
            const selected = quality === q;
            return (
              <TouchableOpacity
                key={q}
                style={[s.qualityBtn, selected && s.qualityBtnSelected, selected && { borderColor: info.color, backgroundColor: info.color + '15' }]}
                onPress={() => setQuality(q)}
              >
                <Text style={[s.qualityNumber, { color: selected ? info.color : t.text.muted }]}>{q}</Text>
                <Text style={[s.qualityLabel, { color: selected ? info.color : t.text.muted }]}>{info.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.inputLabel}>Notes (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="How did you sleep?"
          placeholderTextColor={t.text.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleLogSleep}>
          <Text style={s.submitText}>Log Sleep</Text>
        </TouchableOpacity>
      </View>

      {/* Recent entries */}
      <Text style={s.sectionTitle}>Recent Entries</Text>
      <View style={s.card}>
        {entries.slice(0, 3).map((entry) => {
          const qInfo = QUALITY_LABELS[entry.quality];
          return (
            <View key={entry.id} style={s.entryRow}>
              <View style={[s.entryIcon, { backgroundColor: qInfo.color + '20' }]}>
                <Text style={[s.entryIconText, { color: qInfo.color }]}>{entry.quality}</Text>
              </View>
              <View style={s.entryInfo}>
                <Text style={s.entryTitle}>{entry.hoursSlept}h — {qInfo.label}</Text>
                <Text style={s.entryMeta}>{entry.date} | {entry.bedtime} - {entry.wakeTime}</Text>
                {entry.notes ? <Text style={s.entryMeta}>{entry.notes}</Text> : null}
              </View>
              <View style={s.entryRight}>
                <Text style={s.entryHotk}>+{entry.hotkEarned} hOTK</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Stats Tab ───

  const renderStats = () => {
    const maxHours = Math.max(...entries.map((e) => e.hoursSlept), 8);
    return (
      <>
        <View style={s.card}>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{stats.avgHours}</Text>
              <Text style={s.statLabel}>Avg Hours</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: stats.consistencyScore >= 70 ? t.accent.green : t.accent.orange }]}>
                {stats.consistencyScore}
              </Text>
              <Text style={s.statLabel}>Consistency</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.blue }]}>{stats.avgQuality}</Text>
              <Text style={s.statLabel}>Avg Quality</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{stats.totalHotk}</Text>
              <Text style={s.statLabel}>Total hOTK</Text>
            </View>
          </View>
        </View>

        {/* Weekly Chart */}
        <Text style={s.sectionTitle}>7-Day Sleep Chart</Text>
        <View style={s.card}>
          {entries.map((entry) => (
            <View key={entry.id} style={s.chartRow}>
              <Text style={s.chartDate}>{entry.date.slice(5)}</Text>
              <Text style={s.chartBar}>{renderTextBar(entry.hoursSlept, maxHours)}</Text>
              <Text style={s.chartHours}>{entry.hoursSlept}h</Text>
            </View>
          ))}
          <View style={{ marginTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1, paddingTop: 10 }}>
            <Text style={[s.entryMeta, { textAlign: 'center' }]}>
              Target: 7-9 hours | Your avg: {stats.avgHours}h
            </Text>
          </View>
        </View>

        {/* Sleep history */}
        <Text style={s.sectionTitle}>Full History</Text>
        <View style={s.card}>
          {entries.map((entry) => {
            const qInfo = QUALITY_LABELS[entry.quality];
            return (
              <View key={entry.id} style={s.entryRow}>
                <View style={[s.entryIcon, { backgroundColor: qInfo.color + '20' }]}>
                  <Text style={[s.entryIconText, { color: qInfo.color }]}>{entry.quality}</Text>
                </View>
                <View style={s.entryInfo}>
                  <Text style={s.entryTitle}>{entry.hoursSlept}h — {qInfo.label}</Text>
                  <Text style={s.entryMeta}>{entry.date} | {entry.bedtime} - {entry.wakeTime}</Text>
                </View>
                <View style={s.entryRight}>
                  <Text style={s.entryHotk}>+{entry.hotkEarned} hOTK</Text>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  // ─── Tips Tab ───

  const renderTips = () => (
    <>
      <Text style={s.sectionTitle}>Sleep Hygiene Tips</Text>
      {HYGIENE_TIPS.map((tip, idx) => (
        <View key={idx} style={s.tipCard}>
          <View style={s.tipIcon}>
            <Text style={s.tipIconText}>{tip.icon}</Text>
          </View>
          <Text style={s.tipTitle}>{tip.title}</Text>
          <Text style={s.tipDetail}>{tip.detail}</Text>
        </View>
      ))}
      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Sleep is the foundation of health.{'\n'}
          Adults need 7-9 hours per night.{'\n'}
          Consistent sleep patterns improve memory,{'\n'}
          immune function, and emotional resilience.{'\n\n'}
          Your rest fuels humanity's progress.
        </Text>
      </View>
    </>
  );

  // ─── Challenges Tab ───

  const renderChallenges = () => (
    <>
      <Text style={s.sectionTitle}>Community Sleep Challenges</Text>
      {challenges.map((ch) => (
        <View key={ch.id} style={s.challengeCard}>
          <Text style={s.challengeTitle}>{ch.title}</Text>
          <Text style={s.challengeDesc}>{ch.description}</Text>
          <Text style={s.challengeMeta}>
            Goal: {ch.goal} | {ch.participants} participants | {ch.daysLeft} days left
          </Text>
          {ch.joined && (
            <>
              <View style={s.progressBarOuter}>
                <View style={[s.progressBarInner, { width: `${ch.progress}%` }]} />
              </View>
              <Text style={[s.entryMeta, { marginTop: 4 }]}>{ch.progress}% complete</Text>
            </>
          )}
          <TouchableOpacity
            style={[s.challengeBtn, ch.joined ? s.challengeBtnJoined : s.challengeBtnJoin]}
            onPress={() => handleJoinChallenge(ch)}
          >
            <Text style={[s.challengeBtnText, { color: ch.joined ? t.accent.green : '#fff' }]}>
              {ch.joined ? 'In Progress' : 'Join Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Better sleep together.{'\n'}
          Community challenges help you stay{'\n'}
          accountable and build healthy habits.{'\n'}
          Complete challenges to earn bonus hOTK.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sleep</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'log' && renderLog()}
        {tab === 'stats' && renderStats()}
        {tab === 'tips' && renderTips()}
        {tab === 'challenges' && renderChallenges()}
      </ScrollView>
    </SafeAreaView>
  );
}
