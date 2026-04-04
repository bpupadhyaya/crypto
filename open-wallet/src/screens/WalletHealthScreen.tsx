import { fonts } from '../utils/theme';
/**
 * Wallet Health Screen — Overall wallet security and health assessment.
 *
 * Displays security checks, health scores, and actionable improvement
 * suggestions across all configured wallets and chains.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'health' | 'checks' | 'improve';

interface HealthCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

interface Improvement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// --- Demo data ---

const HEALTH_CHECKS: HealthCheck[] = [
  { id: 'hc1', label: 'Backup Verified', status: 'pass', detail: 'Seed phrase backup was verified on 2026-03-20.' },
  { id: 'hc2', label: 'Biometric Lock', status: 'pass', detail: 'Face ID is enabled for wallet access.' },
  { id: 'hc3', label: 'Multi-Chain Sync', status: 'warn', detail: 'Solana RPC connection intermittent.' },
  { id: 'hc4', label: 'Software Update', status: 'pass', detail: 'Running latest version 0.9.4.' },
  { id: 'hc5', label: 'Transaction Signing', status: 'pass', detail: 'PQC signing module active.' },
  { id: 'hc6', label: 'Recovery Phrase Test', status: 'fail', detail: 'Recovery phrase has not been tested in 90+ days.' },
  { id: 'hc7', label: 'Network Encryption', status: 'pass', detail: 'All RPC connections use TLS 1.3.' },
];

const IMPROVEMENTS: Improvement[] = [
  { id: 'imp1', title: 'Test Recovery Phrase', description: 'Verify your seed phrase recovery flow to ensure wallet can be restored.', priority: 'high' },
  { id: 'imp2', title: 'Add Hardware Wallet', description: 'Connect a Solana Saga seed vault or hardware signer for cold storage.', priority: 'medium' },
  { id: 'imp3', title: 'Enable Auto-Lock Timer', description: 'Set wallet to auto-lock after 2 minutes of inactivity.', priority: 'medium' },
  { id: 'imp4', title: 'Diversify Across Chains', description: 'Spread holdings across multiple chains to reduce single-chain risk.', priority: 'low' },
  { id: 'imp5', title: 'Review Address Book', description: 'Audit saved addresses and remove any unused entries.', priority: 'low' },
];

const STATUS_ICON: Record<string, string> = { pass: '\u2705', warn: '\u26A0\uFE0F', fail: '\u274C' };
const PRIORITY_ICON: Record<string, string> = { high: '\u{1F534}', medium: '\u{1F7E1}', low: '\u{1F7E2}' };

// --- Component ---

interface Props {
  onClose: () => void;
}

export function WalletHealthScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('health');

  const score = useMemo(() => {
    const total = HEALTH_CHECKS.length;
    const passed = HEALTH_CHECKS.filter(c => c.status === 'pass').length;
    return Math.round((passed / total) * 100);
  }, []);

  const scoreColor = score >= 80 ? t.accent.green : score >= 50 ? t.accent.yellow : t.accent.red;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'health', label: 'Health' },
    { key: 'checks', label: 'Checks' },
    { key: 'improve', label: 'Improve' },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    scoreCircle: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
    scoreNum: { fontSize: 36, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryBox: { alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.bold },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    checkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    checkIcon: { fontSize: 20, marginRight: 12 },
    checkLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, flex: 1 },
    checkDetail: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    impCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4 },
    impTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 4 },
    impDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    impPriority: { fontSize: 11, fontWeight: fonts.bold, marginTop: 6 },
  }), [t]);

  const passCount = HEALTH_CHECKS.filter(c => c.status === 'pass').length;
  const warnCount = HEALTH_CHECKS.filter(c => c.status === 'warn').length;
  const failCount = HEALTH_CHECKS.filter(c => c.status === 'fail').length;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Wallet Health</Text>
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
        {tab === 'health' && (
          <>
            <View style={[st.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[st.scoreNum, { color: scoreColor }]}>{score}</Text>
              <Text style={st.scoreLabel}>Health Score</Text>
            </View>
            <View style={st.card}>
              <View style={st.summaryRow}>
                <View style={st.summaryBox}>
                  <Text style={[st.summaryNum, { color: t.accent.green }]}>{passCount}</Text>
                  <Text style={st.summaryLabel}>Passed</Text>
                </View>
                <View style={st.summaryBox}>
                  <Text style={[st.summaryNum, { color: t.accent.yellow }]}>{warnCount}</Text>
                  <Text style={st.summaryLabel}>Warnings</Text>
                </View>
                <View style={st.summaryBox}>
                  <Text style={[st.summaryNum, { color: t.accent.red }]}>{failCount}</Text>
                  <Text style={st.summaryLabel}>Failed</Text>
                </View>
              </View>
            </View>
            <Text style={st.section}>Quick Summary</Text>
            <View style={st.card}>
              <Text style={{ color: t.text.secondary, fontSize: 13, lineHeight: 20 }}>
                Your wallet is in good shape overall. Address the failed recovery phrase test to bring your score to 100%.
              </Text>
            </View>
          </>
        )}

        {tab === 'checks' && (
          <>
            <Text style={st.section}>Security Checks</Text>
            {HEALTH_CHECKS.map(check => (
              <View key={check.id} style={st.checkRow}>
                <Text style={st.checkIcon}>{STATUS_ICON[check.status]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.checkLabel}>{check.label}</Text>
                  <Text style={st.checkDetail}>{check.detail}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'improve' && (
          <>
            <Text style={st.section}>Improvements</Text>
            {IMPROVEMENTS.map(imp => {
              const borderColor = imp.priority === 'high' ? t.accent.red : imp.priority === 'medium' ? t.accent.yellow : t.accent.green;
              return (
                <View key={imp.id} style={[st.impCard, { borderLeftColor: borderColor }]}>
                  <Text style={st.impTitle}>{imp.title}</Text>
                  <Text style={st.impDesc}>{imp.description}</Text>
                  <Text style={[st.impPriority, { color: borderColor }]}>
                    {PRIORITY_ICON[imp.priority]} {imp.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
