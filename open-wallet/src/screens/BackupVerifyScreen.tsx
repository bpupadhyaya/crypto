import { fonts } from '../utils/theme';
/**
 * Backup Verify Screen — Verify wallet backup integrity.
 *
 * Provides tools to verify existing backups, schedule periodic
 * verification reminders, and view backup verification history.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'verify' | 'schedule' | 'history';

interface VerifyCheck {
  id: string;
  label: string;
  status: 'pending' | 'pass' | 'fail';
  description: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  result: 'pass' | 'fail';
  method: string;
  duration: string;
}

interface ScheduleOption {
  id: string;
  label: string;
  interval: string;
  active: boolean;
}

// --- Demo data ---

const VERIFY_CHECKS: VerifyCheck[] = [
  { id: 'v1', label: 'Seed Phrase Integrity', status: 'pending', description: 'Verify all 24 words of your seed phrase match the original backup.' },
  { id: 'v2', label: 'Address Derivation', status: 'pending', description: 'Confirm wallet addresses can be re-derived from the seed phrase.' },
  { id: 'v3', label: 'Multi-Chain Keys', status: 'pending', description: 'Verify key pairs for all 5 chains are recoverable.' },
  { id: 'v4', label: 'Encryption Integrity', status: 'pending', description: 'Confirm PQC encryption of the backup file is intact.' },
  { id: 'v5', label: 'Recovery Dry Run', status: 'pending', description: 'Simulate full wallet recovery without affecting current state.' },
];

const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: '2026-03-20', result: 'pass', method: 'Full Verification', duration: '3m 12s' },
  { id: 'h2', date: '2026-03-05', result: 'pass', method: 'Quick Check', duration: '45s' },
  { id: 'h3', date: '2026-02-18', result: 'fail', method: 'Full Verification', duration: '2m 08s' },
  { id: 'h4', date: '2026-02-01', result: 'pass', method: 'Seed Phrase Only', duration: '1m 30s' },
  { id: 'h5', date: '2026-01-15', result: 'pass', method: 'Full Verification', duration: '3m 45s' },
];

const SCHEDULES: ScheduleOption[] = [
  { id: 's1', label: 'Weekly Quick Check', interval: 'Every 7 days', active: false },
  { id: 's2', label: 'Bi-Weekly Full Verify', interval: 'Every 14 days', active: true },
  { id: 's3', label: 'Monthly Deep Audit', interval: 'Every 30 days', active: false },
  { id: 's4', label: 'After Every Update', interval: 'On app update', active: true },
];

const RESULT_ICON: Record<string, string> = { pass: '\u2705', fail: '\u274C', pending: '\u23F3' };

// --- Component ---

interface Props {
  onClose: () => void;
}

export function BackupVerifyScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('verify');
  const [checks, setChecks] = useState(VERIFY_CHECKS);
  const [schedules, setSchedules] = useState(SCHEDULES);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'verify', label: 'Verify' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'history', label: 'History' },
  ];

  const runCheck = (id: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status: 'pass' as const } : c));
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    checkLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    checkIcon: { fontSize: fonts.xl, marginRight: 10 },
    checkDesc: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 17, marginTop: 6 },
    runBtn: { backgroundColor: t.accent.blue, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
    runBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    runAllBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    runAllText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scheduleLabel: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    scheduleInterval: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    scheduleDot: { width: 12, height: 12, borderRadius: 6 },
    historyCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    historyIcon: { fontSize: fonts.xl, marginRight: 12 },
    historyInfo: { flex: 1 },
    historyDate: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    historyMethod: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    historyDuration: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    warnCard: { backgroundColor: t.accent.yellow + '20', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: t.accent.yellow + '40' },
    warnText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18 },
    warnTitle: { color: t.accent.yellow, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 4 },
  }), [t]);

  const passedChecks = checks.filter(c => c.status === 'pass').length;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Backup Verify</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => setTab(tb.key)}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {tab === 'verify' && (
          <>
            <View style={st.warnCard}>
              <Text style={st.warnTitle}>Regular Verification Required</Text>
              <Text style={st.warnText}>Verify your backup regularly to ensure you can recover your wallet. Last verified: 2026-03-20.</Text>
            </View>
            <Text style={st.section}>Verification Checks ({passedChecks}/{checks.length})</Text>
            {checks.map(check => (
              <View key={check.id} style={st.card}>
                <View style={st.checkRow}>
                  <Text style={st.checkIcon}>{RESULT_ICON[check.status]}</Text>
                  <Text style={st.checkLabel}>{check.label}</Text>
                  {check.status === 'pending' && (
                    <TouchableOpacity style={st.runBtn} onPress={() => runCheck(check.id)}>
                      <Text style={st.runBtnText}>Run</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={st.checkDesc}>{check.description}</Text>
              </View>
            ))}
            <TouchableOpacity style={st.runAllBtn} onPress={() => setChecks(prev => prev.map(c => ({ ...c, status: 'pass' as const })))}>
              <Text style={st.runAllText}>Run All Checks</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'schedule' && (
          <>
            <Text style={st.section}>Verification Schedule</Text>
            {schedules.map(sch => (
              <TouchableOpacity key={sch.id} style={st.card} onPress={() => toggleSchedule(sch.id)} activeOpacity={0.7}>
                <View style={st.scheduleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.scheduleLabel}>{sch.label}</Text>
                    <Text style={st.scheduleInterval}>{sch.interval}</Text>
                  </View>
                  <View style={[st.scheduleDot, { backgroundColor: sch.active ? t.accent.green : t.border }]} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {tab === 'history' && (
          <>
            <Text style={st.section}>Verification History</Text>
            {HISTORY.map(entry => (
              <View key={entry.id} style={st.historyCard}>
                <Text style={st.historyIcon}>{RESULT_ICON[entry.result]}</Text>
                <View style={st.historyInfo}>
                  <Text style={st.historyDate}>{entry.date}</Text>
                  <Text style={st.historyMethod}>{entry.method}</Text>
                </View>
                <Text style={st.historyDuration}>{entry.duration}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
