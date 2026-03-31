import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'pending' | 'my-attestations' | 'accuracy';

interface Props {
  onClose: () => void;
}

interface PendingVerification {
  id: string;
  submitter: string;
  milestone: string;
  channel: string;
  evidence: string;
  otkAmount: number;
  submittedAt: string;
}

interface Attestation {
  id: string;
  milestone: string;
  verdict: 'approved' | 'rejected' | 'flagged';
  attestedAt: string;
  otkReward: number;
  consensusMatch: boolean;
}

interface AccuracyMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

const DEMO_PENDING: PendingVerification[] = [
  { id: '1', submitter: 'User_7a3f', milestone: 'Completed 10 elder visits', channel: 'Eldercare', evidence: '10 check-in logs with timestamps and elder confirmations', otkAmount: 200, submittedAt: '2026-03-30' },
  { id: '2', submitter: 'User_b2c1', milestone: 'Tutored 5 students for 20 hours', channel: 'Education', evidence: 'Session logs, student feedback forms, progress reports', otkAmount: 350, submittedAt: '2026-03-29' },
  { id: '3', submitter: 'User_d4e9', milestone: 'Organized community cleanup', channel: 'Community', evidence: 'Before/after descriptions, 15 participant sign-ins', otkAmount: 180, submittedAt: '2026-03-28' },
  { id: '4', submitter: 'User_f1a8', milestone: 'Mediated 3 neighborhood disputes', channel: 'Peace', evidence: 'Resolution summaries signed by all parties', otkAmount: 280, submittedAt: '2026-03-27' },
];

const DEMO_ATTESTATIONS: Attestation[] = [
  { id: '1', milestone: 'Child literacy program completion', verdict: 'approved', attestedAt: '2026-03-25', otkReward: 15, consensusMatch: true },
  { id: '2', milestone: 'Weekly elder storytelling sessions', verdict: 'approved', attestedAt: '2026-03-23', otkReward: 15, consensusMatch: true },
  { id: '3', milestone: 'Fraudulent community hours claim', verdict: 'rejected', attestedAt: '2026-03-20', otkReward: 20, consensusMatch: true },
  { id: '4', milestone: 'Tool library establishment', verdict: 'approved', attestedAt: '2026-03-18', otkReward: 15, consensusMatch: false },
  { id: '5', milestone: 'Suspicious education grant request', verdict: 'flagged', attestedAt: '2026-03-15', otkReward: 10, consensusMatch: true },
];

const DEMO_METRICS: AccuracyMetric[] = [
  { label: 'Overall Accuracy', value: '94.2%', trend: 'up' },
  { label: 'Consensus Match Rate', value: '91.7%', trend: 'stable' },
  { label: 'Total Attestations', value: '127', trend: 'up' },
  { label: 'OTK Earned (Verifying)', value: '1,905', trend: 'up' },
  { label: 'Avg Response Time', value: '2.3 hrs', trend: 'down' },
  { label: 'Streak (Correct)', value: '18', trend: 'up' },
];

export function VerifierDashboardScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: 18, fontWeight: '700', color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: 16, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: 14, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: '600' },
        content: { flex: 1 },
        pendingCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        pendingChannel: { fontSize: 11, fontWeight: '600', color: t.accent.green, textTransform: 'uppercase', marginBottom: 4 },
        pendingMilestone: { fontSize: 15, fontWeight: '700', color: t.text.primary, marginBottom: 4 },
        pendingEvidence: { fontSize: 13, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        pendingMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
        pendingSubmitter: { fontSize: 12, color: t.text.secondary },
        pendingOtk: { fontSize: 12, fontWeight: '600', color: t.accent.green },
        actionRow: { flexDirection: 'row', gap: 8 },
        approveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: t.accent.green + '20', alignItems: 'center' },
        approveText: { fontSize: 13, fontWeight: '600', color: t.accent.green },
        rejectButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F4433620', alignItems: 'center' },
        rejectText: { fontSize: 13, fontWeight: '600', color: '#F44336' },
        flagButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FF980020', alignItems: 'center' },
        flagText: { fontSize: 13, fontWeight: '600', color: '#FF9800' },
        attestCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        attestInfo: { flex: 1 },
        attestMilestone: { fontSize: 14, fontWeight: '600', color: t.text.primary, marginBottom: 2 },
        attestDate: { fontSize: 12, color: t.text.secondary },
        attestRight: { alignItems: 'flex-end' },
        verdictBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
        consensusText: { fontSize: 11, color: t.text.secondary },
        metricGrid: { padding: 12 },
        metricCard: { marginBottom: 8, marginHorizontal: 4, padding: 16, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        metricLabel: { fontSize: 14, color: t.text.secondary },
        metricRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        metricValue: { fontSize: 18, fontWeight: '700', color: t.text.primary },
        trendText: { fontSize: 12 },
        sectionLabel: { fontSize: 14, fontWeight: '600', color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: 13, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const verdictColor = (v: string) => {
    if (v === 'approved') return t.accent.green;
    if (v === 'rejected') return '#F44336';
    return '#FF9800';
  };

  const trendSymbol = (trend: string) => {
    if (trend === 'up') return { symbol: '+', color: t.accent.green };
    if (trend === 'down') return { symbol: '-', color: '#F44336' };
    return { symbol: '=', color: t.text.secondary };
  };

  const renderPending = useCallback(
    ({ item }: { item: PendingVerification }) => (
      <View style={styles.pendingCard}>
        <Text style={styles.pendingChannel}>{item.channel}</Text>
        <Text style={styles.pendingMilestone}>{item.milestone}</Text>
        <Text style={styles.pendingEvidence}>Evidence: {item.evidence}</Text>
        <View style={styles.pendingMeta}>
          <Text style={styles.pendingSubmitter}>{item.submitter} - {item.submittedAt}</Text>
          <Text style={styles.pendingOtk}>{item.otkAmount} OTK at stake</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.approveButton}><Text style={styles.approveText}>Approve</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
          <TouchableOpacity style={styles.flagButton}><Text style={styles.flagText}>Flag</Text></TouchableOpacity>
        </View>
      </View>
    ),
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <FlatList
            data={demoMode ? DEMO_PENDING : []}
            keyExtractor={(item) => item.id}
            renderItem={renderPending}
            ListHeaderComponent={<Text style={styles.sectionLabel}>{demoMode ? DEMO_PENDING.length : 0} pending verifications</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No pending verifications</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'my-attestations':
        return (
          <FlatList
            data={demoMode ? DEMO_ATTESTATIONS : []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.attestCard}>
                <View style={styles.attestInfo}>
                  <Text style={styles.attestMilestone}>{item.milestone}</Text>
                  <Text style={styles.attestDate}>{item.attestedAt} | +{item.otkReward} OTK</Text>
                </View>
                <View style={styles.attestRight}>
                  <Text style={[styles.verdictBadge, { color: verdictColor(item.verdict) }]}>{item.verdict}</Text>
                  <Text style={styles.consensusText}>{item.consensusMatch ? 'Consensus matched' : 'Disputed'}</Text>
                </View>
              </View>
            )}
            ListHeaderComponent={<Text style={styles.sectionLabel}>Your Attestation History</Text>}
            ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No attestations yet</Text></View>}
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'accuracy':
        return (
          <ScrollView style={styles.metricGrid}>
            <Text style={styles.sectionLabel}>Your Verifier Metrics</Text>
            {(demoMode ? DEMO_METRICS : []).map((metric) => {
              const t = trendSymbol(metric.trend);
              return (
                <View key={metric.label} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <View style={styles.metricRight}>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={[styles.trendText, { color: t.color }]}>{t.symbol}</Text>
                  </View>
                </View>
              );
            })}
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'my-attestations', label: 'My Attestations' },
    { key: 'accuracy', label: 'Accuracy' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verifier Dashboard</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
