/**
 * Living Ledger Screen — View your lifelong record of human value.
 *
 * "The Living Ledger begins at Universal ID registration and continues indefinitely."
 * — Human Constitution, Article IV, Section 1
 *
 * Shows:
 * - Total value received and given across all channels
 * - Channel breakdown (nOTK, eOTK, hOTK, cOTK, xOTK, gOTK)
 * - Contribution score
 * - Gratitude received/given
 * - Recent ledger entries
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
  onSendGratitude?: () => void;
}

// Mock data for display — real data comes from Open Chain query
const MOCK_LEDGER = {
  totalReceived: 1250,
  totalGiven: 480,
  netValue: 770,
  gratitudeReceived: 200,
  gratitudeGiven: 150,
  milestonesAchieved: 8,
  contributionScore: 2860,
  channels: {
    xotk: { received: 500, given: 300, label: 'Economic', icon: '\u{1F4B0}', color: '#f7931a' },
    notk: { received: 350, given: 50, label: 'Nurture', icon: '\u{1F49B}', color: '#ef4444' },
    eotk: { received: 200, given: 80, label: 'Education', icon: '\u{1F4DA}', color: '#3b82f6' },
    hotk: { received: 100, given: 20, label: 'Health', icon: '\u{1FA7A}', color: '#22c55e' },
    cotk: { received: 80, given: 25, label: 'Community', icon: '\u{1F91D}', color: '#8b5cf6' },
    gotk: { received: 20, given: 5, label: 'Governance', icon: '\u{1F5F3}', color: '#eab308' },
  },
  recentEntries: [
    { type: 'gratitude', from: 'uid-a83f...', to: 'You', channel: 'notk', amount: 50, message: 'Thank you for everything, Mom', time: '2h ago' },
    { type: 'minted', from: 'System', to: 'You', channel: 'eotk', amount: 200, message: 'Milestone: Primary education completed', time: '1d ago' },
    { type: 'given', from: 'You', to: 'uid-7b2c...', channel: 'eotk', amount: 30, message: 'Tutoring session', time: '3d ago' },
    { type: 'received', from: 'uid-4e9a...', to: 'You', channel: 'cotk', amount: 15, message: 'Community cleanup participation', time: '5d ago' },
    { type: 'gratitude', from: 'uid-c12d...', to: 'You', channel: 'eotk', amount: 100, message: 'Your teaching changed my life', time: '1w ago' },
  ],
};

export function LivingLedgerScreen({ onClose, onSendGratitude }: Props) {
  const t = useTheme();
  const ledger = MOCK_LEDGER;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scoreCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    scoreLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
    scoreValue: { color: t.accent.green, fontSize: 42, fontWeight: '900', marginTop: 4 },
    scoreSubtext: { color: t.text.secondary, fontSize: 13, marginTop: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    summaryItem: { alignItems: 'center' },
    summaryNumber: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 28 },
    channelCard: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    channelRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    channelIcon: { fontSize: 24, marginRight: 12 },
    channelInfo: { flex: 1 },
    channelName: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    channelValues: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    channelBar: { height: 4, borderRadius: 2, marginTop: 6 },
    channelAmount: { color: t.text.secondary, fontSize: 14, fontWeight: '700' },
    entryCard: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' },
    entryRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    entryType: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    entryTime: { color: t.text.muted, fontSize: 11 },
    entryMessage: { color: t.text.secondary, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
    entryAmount: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginTop: 4 },
    gratitudeBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    gratitudeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    quote: { color: t.text.muted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginHorizontal: 32, marginTop: 24, lineHeight: 20 },
  }), [t]);

  const maxChannelReceived = Math.max(...Object.values(ledger.channels).map(c => c.received));

  const typeColors: Record<string, string> = {
    gratitude: t.accent.purple,
    minted: t.accent.green,
    given: t.accent.orange,
    received: t.accent.blue,
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Living Ledger</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Contribution Score */}
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>Contribution Score</Text>
          <Text style={s.scoreValue}>{ledger.contributionScore.toLocaleString()}</Text>
          <Text style={s.scoreSubtext}>{ledger.milestonesAchieved} milestones achieved</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNumber, { color: t.accent.green }]}>{ledger.totalReceived}</Text>
              <Text style={s.summaryLabel}>Received</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNumber, { color: t.accent.orange }]}>{ledger.totalGiven}</Text>
              <Text style={s.summaryLabel}>Given</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryNumber, { color: t.accent.purple }]}>{ledger.gratitudeReceived}</Text>
              <Text style={s.summaryLabel}>Gratitude</Text>
            </View>
          </View>
        </View>

        {/* Value Channels */}
        <Text style={s.section}>Value Channels</Text>
        <View style={s.channelCard}>
          {Object.entries(ledger.channels).map(([key, ch], i) => (
            <View key={key} style={[s.channelRow, i === Object.keys(ledger.channels).length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.channelIcon}>{ch.icon}</Text>
              <View style={s.channelInfo}>
                <Text style={s.channelName}>{ch.label}</Text>
                <Text style={s.channelValues}>Received: {ch.received} | Given: {ch.given}</Text>
                <View style={[s.channelBar, { width: `${(ch.received / maxChannelReceived) * 100}%`, backgroundColor: ch.color }]} />
              </View>
              <Text style={s.channelAmount}>{ch.received - ch.given}</Text>
            </View>
          ))}
        </View>

        {/* Send Gratitude */}
        <TouchableOpacity style={s.gratitudeBtn} onPress={onSendGratitude}>
          <Text style={s.gratitudeBtnText}>Send Gratitude</Text>
        </TouchableOpacity>

        {/* Recent Activity */}
        <Text style={s.section}>Recent Activity</Text>
        <View style={s.entryCard}>
          {ledger.recentEntries.map((entry, i) => (
            <View key={i} style={[s.entryRow, i === ledger.recentEntries.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.entryHeader}>
                <Text style={[s.entryType, { color: typeColors[entry.type] ?? t.text.muted }]}>
                  {entry.type === 'gratitude' ? 'Gratitude' : entry.type === 'minted' ? 'Milestone' : entry.type === 'given' ? 'Given' : 'Received'}
                </Text>
                <Text style={s.entryTime}>{entry.time}</Text>
              </View>
              <Text style={s.entryMessage}>{entry.message}</Text>
              <Text style={[s.entryAmount, { color: entry.type === 'given' ? t.accent.orange : t.accent.green }]}>
                {entry.type === 'given' ? '-' : '+'}{entry.amount} {entry.channel.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        <Text style={s.quote}>
          "The world is all about value transfer. When we make it visible, we make it better."
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
