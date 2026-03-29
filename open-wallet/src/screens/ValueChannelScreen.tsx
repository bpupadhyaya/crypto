/**
 * Value Channel Dashboard — Unified view of ALL 6 OTK value channels.
 *
 * This is THE overview screen that shows the full vision of The Human Constitution —
 * all value channels in one place.
 *
 * Channels:
 * - nOTK (Nurture): parenting milestones, family tree
 * - eOTK (Education): learning journey, teacher impact
 * - hOTK (Health): wellness score, checkups, fitness
 * - cOTK (Community): volunteer hours, services
 * - xOTK (Economic): trade, employment, donations
 * - gOTK (Governance): votes, proposals, civic level
 *
 * "Every dimension of human contribution is valued equally."
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface ChannelData {
  key: string;
  symbol: string;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  balance: number;
  level: string;
  recentActivity: string;
  recentDate: string;
  weight: number; // governance-configurable weight (0-100, sums to 100)
  screenKey: string; // navigation key for SettingsScreen
}

interface Props {
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

// ─── Demo Data ───

const buildDemoChannels = (accentColors: { green: string; orange: string; blue: string; purple: string; red: string; yellow: string }): ChannelData[] => [
  {
    key: 'nOTK',
    symbol: 'nOTK',
    name: 'Nurture',
    fullName: 'Nurture Channel',
    icon: 'N',
    color: accentColors.purple,
    balance: 22400,
    level: 'Devoted',
    recentActivity: 'First steps milestone recorded',
    recentDate: '2026-03-26',
    weight: 18,
    screenKey: 'parenting-journey',
  },
  {
    key: 'eOTK',
    symbol: 'eOTK',
    name: 'Education',
    fullName: 'Education Channel',
    icon: 'E',
    color: accentColors.blue,
    balance: 18200,
    level: 'Scholar',
    recentActivity: 'Completed data science certification',
    recentDate: '2026-03-24',
    weight: 18,
    screenKey: 'education-hub',
  },
  {
    key: 'hOTK',
    symbol: 'hOTK',
    name: 'Health',
    fullName: 'Health Channel',
    icon: 'H',
    color: accentColors.green,
    balance: 14600,
    level: 'Thriving',
    recentActivity: 'Annual dental checkup completed',
    recentDate: '2026-03-25',
    weight: 18,
    screenKey: 'wellness',
  },
  {
    key: 'cOTK',
    symbol: 'cOTK',
    name: 'Community',
    fullName: 'Community Channel',
    icon: 'C',
    color: accentColors.orange,
    balance: 18400,
    level: 'Dedicated',
    recentActivity: 'Math tutoring for middle school students',
    recentDate: '2026-03-27',
    weight: 18,
    screenKey: 'volunteer',
  },
  {
    key: 'xOTK',
    symbol: 'xOTK',
    name: 'Economic',
    fullName: 'Economic Channel',
    icon: 'X',
    color: accentColors.yellow,
    balance: 8600,
    level: 'Active',
    recentActivity: 'Completed 3 peer-to-peer trades',
    recentDate: '2026-03-23',
    weight: 10,
    screenKey: 'defi',
  },
  {
    key: 'gOTK',
    symbol: 'gOTK',
    name: 'Governance',
    fullName: 'Governance Channel',
    icon: 'G',
    color: accentColors.red,
    balance: 9200,
    level: 'Advocate',
    recentActivity: 'Voted on nurture channel minting proposal',
    recentDate: '2026-03-28',
    weight: 18,
    screenKey: 'civic',
  },
];

export function ValueChannelScreen({ onClose, onNavigate }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const channels = useMemo(() => buildDemoChannels(t.accent), [t.accent]);

  const totalOTK = useMemo(() =>
    channels.reduce((sum, ch) => sum + ch.balance, 0),
    [channels],
  );

  const compositeScore = useMemo(() => {
    // Weighted score based on normalized balances
    const maxBalance = Math.max(...channels.map((c) => c.balance));
    if (maxBalance === 0) return 0;
    const weighted = channels.reduce((sum, ch) => {
      const normalized = (ch.balance / maxBalance) * 100;
      return sum + (normalized * ch.weight / 100);
    }, 0);
    return Math.round(weighted);
  }, [channels]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    // Total score card
    totalCard: { backgroundColor: t.bg.secondary, borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
    totalLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
    totalValue: { color: t.text.primary, fontSize: 48, fontWeight: '900', marginTop: 4 },
    totalOtkLabel: { color: t.accent.green, fontSize: 14, fontWeight: '700', marginTop: 4 },
    compositeRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' },
    compositeItem: { alignItems: 'center' },
    compositeValue: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    compositeLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Channel weight bar
    weightBarContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 16, width: '100%' },
    weightSegment: { height: 8 },
    weightLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
    weightLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    weightDot: { width: 8, height: 8, borderRadius: 4 },
    weightLabelText: { color: t.text.muted, fontSize: 10 },
    // Channel grid
    channelGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
    channelCard: { borderRadius: 16, padding: 16, width: '47%' },
    channelIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    channelIconText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    channelSymbol: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    channelName: { color: t.text.muted, fontSize: 11, marginBottom: 8 },
    channelBalance: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    channelLevel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
    channelActivity: { color: t.text.muted, fontSize: 11, marginTop: 6, lineHeight: 15 },
    channelDate: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    channelTapHint: { color: t.accent.blue, fontSize: 11, fontWeight: '600', marginTop: 8 },
    // Philosophy card
    philosophyCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    philosophyText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const handleChannelTap = (channel: ChannelData) => {
    if (onNavigate) {
      onNavigate(channel.screenKey);
    } else {
      Alert.alert(channel.fullName, `Navigate to ${channel.name} channel.\n\nBalance: ${channel.balance.toLocaleString()} ${channel.symbol}\nLevel: ${channel.level}`);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Value Channels</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Total Composite Score */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Total OTK Balance</Text>
          <Text style={s.totalValue}>{totalOTK.toLocaleString()}</Text>
          <Text style={s.totalOtkLabel}>across all 6 channels</Text>

          <View style={s.compositeRow}>
            <View style={s.compositeItem}>
              <Text style={s.compositeValue}>{compositeScore}</Text>
              <Text style={s.compositeLabel}>Composite Score</Text>
            </View>
            <View style={s.compositeItem}>
              <Text style={s.compositeValue}>6</Text>
              <Text style={s.compositeLabel}>Active Channels</Text>
            </View>
          </View>

          {/* Channel weight visualization */}
          <View style={s.weightBarContainer}>
            {channels.map((ch) => (
              <View key={ch.key} style={[s.weightSegment, { width: `${ch.weight}%`, backgroundColor: ch.color }]} />
            ))}
          </View>
          <View style={s.weightLegend}>
            {channels.map((ch) => (
              <View key={ch.key} style={s.weightLegendItem}>
                <View style={[s.weightDot, { backgroundColor: ch.color }]} />
                <Text style={s.weightLabelText}>{ch.symbol} {ch.weight}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Channel Grid */}
        <Text style={s.sectionTitle}>Your Channels</Text>
        <View style={s.channelGrid}>
          {channels.map((ch) => (
            <TouchableOpacity
              key={ch.key}
              style={[s.channelCard, { backgroundColor: ch.color + '12' }]}
              onPress={() => handleChannelTap(ch)}
              activeOpacity={0.7}
            >
              <View style={[s.channelIconCircle, { backgroundColor: ch.color }]}>
                <Text style={s.channelIconText}>{ch.icon}</Text>
              </View>
              <Text style={[s.channelSymbol, { color: ch.color }]}>{ch.symbol}</Text>
              <Text style={s.channelName}>{ch.name}</Text>
              <Text style={s.channelBalance}>{ch.balance.toLocaleString()}</Text>
              <Text style={[s.channelLevel, { color: ch.color }]}>{ch.level}</Text>
              <Text style={s.channelActivity} numberOfLines={2}>{ch.recentActivity}</Text>
              <Text style={s.channelDate}>{ch.recentDate}</Text>
              <Text style={s.channelTapHint}>Open channel</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Philosophy */}
        <View style={s.philosophyCard}>
          <Text style={s.philosophyText}>
            Every dimension of human contribution is valued equally.{'\n\n'}
            Raising a child. Teaching a student. Staying healthy.{'\n'}
            Serving your community. Building the economy.{'\n'}
            Governing wisely.{'\n\n'}
            This is The Human Constitution.{'\n'}
            All value channels, one humanity.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
