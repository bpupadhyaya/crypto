import { fonts } from '../utils/theme';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'given' | 'received' | 'trends';

interface Props {
  onClose: () => void;
}

interface GratitudeEntry {
  id: string;
  person: string;
  message: string;
  otkAttached: number;
  date: string;
  channel: string;
}

interface TrendData {
  period: string;
  given: number;
  received: number;
  otkGiven: number;
  otkReceived: number;
}

const DEMO_GIVEN: GratitudeEntry[] = [
  { id: '1', person: 'Maria G.', message: 'Thank you for watching my kids during the emergency.', otkAttached: 50, date: '2026-03-30', channel: 'Nurture' },
  { id: '2', person: 'Elder Chen', message: 'Your stories about the old neighborhood mean so much.', otkAttached: 30, date: '2026-03-28', channel: 'Eldercare' },
  { id: '3', person: 'James K.', message: 'The math tutoring changed my daughter\'s confidence.', otkAttached: 40, date: '2026-03-25', channel: 'Education' },
  { id: '4', person: 'Aisha R.', message: 'You mediated our dispute fairly and with compassion.', otkAttached: 60, date: '2026-03-22', channel: 'Peace' },
  { id: '5', person: 'Community Garden', message: 'Grateful for the shared tools and seed exchange.', otkAttached: 25, date: '2026-03-20', channel: 'Community' },
];

const DEMO_RECEIVED: GratitudeEntry[] = [
  { id: '1', person: 'Carlos M.', message: 'Your coding workshop opened a new world for me.', otkAttached: 45, date: '2026-03-29', channel: 'Education' },
  { id: '2', person: 'Lin W.', message: 'Thank you for visiting my grandmother every week.', otkAttached: 35, date: '2026-03-27', channel: 'Eldercare' },
  { id: '3', person: 'User_a3f2', message: 'The open-source contribution you reviewed was top-notch.', otkAttached: 20, date: '2026-03-24', channel: 'Open Source' },
  { id: '4', person: 'Fatima H.', message: 'You helped me understand the governance proposal.', otkAttached: 15, date: '2026-03-21', channel: 'Governance' },
  { id: '5', person: 'Block 7 Parents', message: 'The after-school program you started is a blessing.', otkAttached: 80, date: '2026-03-18', channel: 'Nurture' },
];

const DEMO_TRENDS: TrendData[] = [
  { period: 'This Week', given: 8, received: 6, otkGiven: 205, otkReceived: 195 },
  { period: 'Last Week', given: 5, received: 9, otkGiven: 140, otkReceived: 260 },
  { period: 'Week 3', given: 7, received: 4, otkGiven: 180, otkReceived: 110 },
  { period: 'Week 4', given: 3, received: 7, otkGiven: 90, otkReceived: 210 },
  { period: 'Month Total', given: 23, received: 26, otkGiven: 615, otkReceived: 775 },
];

const INSIGHT_MESSAGES = [
  'You give gratitude most on Wednesdays and Fridays.',
  'Eldercare is your top channel for giving thanks.',
  'You have a 5-week streak of expressing gratitude.',
  'People appreciate your educational contributions most.',
  'Your gratitude network spans 14 unique community members.',
];

export function GratitudeAnalyticsScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('given');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: 18, fontWeight: fonts.bold, color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: 16, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: 14, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: fonts.semibold },
        content: { flex: 1 },
        summaryRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 12 },
        summaryCard: { flex: 1, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center' },
        summaryValue: { fontSize: 22, fontWeight: fonts.bold, color: t.accent.green },
        summaryLabel: { fontSize: 11, color: t.text.secondary, marginTop: 2 },
        entryCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        entryPerson: { fontSize: 15, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
        entryMessage: { fontSize: 13, color: t.text.secondary, lineHeight: 18, fontStyle: 'italic', marginBottom: 8 },
        entryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
        entryChannel: { fontSize: 11, fontWeight: fonts.semibold, color: t.accent.green, textTransform: 'uppercase' },
        entryOtk: { fontSize: 12, fontWeight: fonts.semibold, color: t.accent.green },
        entryDate: { fontSize: 12, color: t.text.secondary },
        trendCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        trendPeriod: { fontSize: 14, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 8 },
        trendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
        trendLabel: { fontSize: 13, color: t.text.secondary },
        trendValue: { fontSize: 13, fontWeight: fonts.semibold, color: t.text.primary },
        insightCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: t.accent.green + '10', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: t.accent.green },
        insightText: { fontSize: 13, color: t.text.primary, lineHeight: 18 },
        sectionLabel: { fontSize: 14, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
        emptyState: { margin: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, alignItems: 'center' },
        emptyText: { fontSize: 13, color: t.text.secondary },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const givenData = demoMode ? DEMO_GIVEN : [];
  const receivedData = demoMode ? DEMO_RECEIVED : [];
  const trendData = demoMode ? DEMO_TRENDS : [];

  const totalGivenOtk = useMemo(() => givenData.reduce((s, e) => s + e.otkAttached, 0), [givenData]);
  const totalReceivedOtk = useMemo(() => receivedData.reduce((s, e) => s + e.otkAttached, 0), [receivedData]);

  const renderEntries = (entries: GratitudeEntry[], direction: string) => (
    <ScrollView>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{entries.length}</Text>
          <Text style={styles.summaryLabel}>Total {direction}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{direction === 'Given' ? totalGivenOtk : totalReceivedOtk}</Text>
          <Text style={styles.summaryLabel}>OTK {direction}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{new Set(entries.map((e) => e.channel)).size}</Text>
          <Text style={styles.summaryLabel}>Channels</Text>
        </View>
      </View>
      <Text style={styles.sectionLabel}>Recent Gratitude {direction}</Text>
      {entries.length === 0 ? (
        <View style={styles.emptyState}><Text style={styles.emptyText}>No gratitude {direction.toLowerCase()} yet</Text></View>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <Text style={styles.entryPerson}>{entry.person}</Text>
            <Text style={styles.entryMessage}>"{entry.message}"</Text>
            <View style={styles.entryFooter}>
              <Text style={styles.entryChannel}>{entry.channel}</Text>
              <Text style={styles.entryOtk}>{entry.otkAttached} OTK</Text>
              <Text style={styles.entryDate}>{entry.date}</Text>
            </View>
          </View>
        ))
      )}
      <View style={styles.listFooter} />
    </ScrollView>
  );

  const renderTrends = () => (
    <ScrollView>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalGivenOtk + totalReceivedOtk}</Text>
          <Text style={styles.summaryLabel}>Total OTK Flow</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{givenData.length + receivedData.length}</Text>
          <Text style={styles.summaryLabel}>All Gratitude</Text>
        </View>
      </View>
      <Text style={styles.sectionLabel}>Weekly Breakdown</Text>
      {trendData.map((trend) => (
        <View key={trend.period} style={styles.trendCard}>
          <Text style={styles.trendPeriod}>{trend.period}</Text>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Gratitude Given</Text>
            <Text style={styles.trendValue}>{trend.given} ({trend.otkGiven} OTK)</Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Gratitude Received</Text>
            <Text style={styles.trendValue}>{trend.received} ({trend.otkReceived} OTK)</Text>
          </View>
        </View>
      ))}
      <Text style={styles.sectionLabel}>Insights</Text>
      {(demoMode ? INSIGHT_MESSAGES : []).map((msg, idx) => (
        <View key={idx} style={styles.insightCard}>
          <Text style={styles.insightText}>{msg}</Text>
        </View>
      ))}
      <View style={styles.listFooter} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'given': return renderEntries(givenData, 'Given');
      case 'received': return renderEntries(receivedData, 'Received');
      case 'trends': return renderTrends();
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'given', label: 'Given' },
    { key: 'received', label: 'Received' },
    { key: 'trends', label: 'Trends' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gratitude Analytics</Text>
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
