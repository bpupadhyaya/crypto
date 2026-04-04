import { fonts } from '../utils/theme';
/**
 * My Impact Screen — Personal impact visualization across all value channels.
 *
 * "Reputation is earned by contribution, not by wealth."
 * — Human Constitution, Article IV
 *
 * Shows Your Story narrative, Impact Rings (like Apple Watch), Ripple Map,
 * Achievement Wall, and an inspirational footer.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

// ─── Impact data model ───

interface ChannelImpact {
  channel: string;
  ticker: string;
  color: string;
  balance: number;
  transactions: number;
  ringPercent: number; // 0-100
}

interface RippleRing {
  level: number;
  label: string;
  description: string;
  count: number;
  icon: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ─── Demo data ───

const DEMO_CHANNELS: ChannelImpact[] = [
  { channel: 'Nurture', ticker: 'nOTK', color: '#ec4899', balance: 1_250, transactions: 48, ringPercent: 82 },
  { channel: 'Education', ticker: 'eOTK', color: '#3b82f6', balance: 890, transactions: 35, ringPercent: 65 },
  { channel: 'Health', ticker: 'hOTK', color: '#22c55e', balance: 420, transactions: 22, ringPercent: 45 },
  { channel: 'Community', ticker: 'cOTK', color: '#f97316', balance: 680, transactions: 41, ringPercent: 58 },
  { channel: 'Economic', ticker: 'xOTK', color: '#eab308', balance: 310, transactions: 18, ringPercent: 35 },
  { channel: 'Governance', ticker: 'gOTK', color: '#8b5cf6', balance: 150, transactions: 8, ringPercent: 22 },
];

const DEMO_RIPPLE: RippleRing[] = [
  { level: 1, label: 'Self', description: 'Your direct achievements', count: 24, icon: '\uD83C\uDFAF' },
  { level: 2, label: 'Family', description: 'Family milestones you contributed to', count: 12, icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' },
  { level: 3, label: 'Mentees', description: 'Students and mentees you helped', count: 15, icon: '\uD83C\uDF93' },
  { level: 4, label: 'Community', description: 'Community members impacted', count: 42, icon: '\uD83C\uDFD8\uFE0F' },
  { level: 5, label: 'Wider', description: 'Regional and global ripples', count: 156, icon: '\uD83C\uDF0D' },
];

const DEMO_BADGES: Badge[] = [
  { id: 'b1', name: 'First Steps', description: 'Registered your Universal ID', icon: '\uD83C\uDD94', earned: '2025-06-15', rarity: 'common' },
  { id: 'b2', name: 'Nurturing Heart', description: 'Recorded 10 parenting milestones', icon: '\uD83D\uDC96', earned: '2025-08-20', rarity: 'rare' },
  { id: 'b3', name: 'Knowledge Sharer', description: 'Helped 15 students achieve milestones', icon: '\uD83D\uDCDA', earned: '2025-11-10', rarity: 'epic' },
  { id: 'b4', name: 'Community Pillar', description: 'Volunteered 200+ hours', icon: '\uD83C\uDFDB\uFE0F', earned: '2026-01-05', rarity: 'epic' },
  { id: 'b5', name: 'Gratitude Magnet', description: 'Received gratitude from 42 people', icon: '\uD83E\uDDE2', earned: '2026-02-14', rarity: 'legendary' },
  { id: 'b6', name: 'Active Citizen', description: 'Voted on 8 governance proposals', icon: '\uD83D\uDDF3\uFE0F', earned: '2026-03-01', rarity: 'rare' },
  { id: 'b7', name: 'Wellness Champion', description: 'Completed 30-day wellness streak', icon: '\uD83C\uDFC6', earned: '2026-03-20', rarity: 'rare' },
];

const YOUR_STORY = "You've raised 3 children through 12 milestones, taught 15 students, volunteered 200 hours, voted on 8 proposals, and received gratitude from 42 people. Your contributions have rippled outward to touch 156 lives across your community and beyond.";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function MyImpactScreen({ onClose }: Props) {
  const t = useTheme();

  const totalOTK = useMemo(() => DEMO_CHANNELS.reduce((sum, c) => sum + c.balance, 0), []);
  const totalTx = useMemo(() => DEMO_CHANNELS.reduce((sum, c) => sum + c.transactions, 0), []);

  const rarityColor = (r: Badge['rarity']): string => {
    switch (r) {
      case 'common': return t.text.muted;
      case 'rare': return t.accent.blue;
      case 'epic': return t.accent.purple;
      case 'legendary': return t.accent.orange;
    }
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8 },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },
    demoTag: { color: t.accent.orange, fontSize: 10, fontWeight: fonts.bold, textAlign: 'center', marginTop: 12 },
    // Story
    storyCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 12 },
    storyTitle: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginBottom: 12 },
    storyText: { color: t.text.primary, fontSize: 14, lineHeight: 22 },
    storySummary: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: t.accent.green + '30' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.accent.green, fontSize: 20, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    // Impact rings
    ringsContainer: { alignItems: 'center', paddingVertical: 20, marginHorizontal: 20, marginTop: 8 },
    ringWrapper: { alignItems: 'center', justifyContent: 'center' },
    ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    ringBar: { height: 24, borderRadius: 12, marginRight: 8 },
    ringLabel: { fontSize: 12, fontWeight: fonts.bold, width: 50 },
    ringPercent: { fontSize: 12, fontWeight: fonts.semibold, width: 40, textAlign: 'right' },
    ringBalance: { color: t.text.muted, fontSize: 11, width: 60, textAlign: 'right' },
    // Ripple
    rippleContainer: { marginHorizontal: 20, marginTop: 8 },
    rippleRing: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    rippleIcon: { fontSize: 28, width: 44, textAlign: 'center' },
    rippleContent: { flex: 1, marginLeft: 8 },
    rippleLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    rippleDesc: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    rippleCount: { backgroundColor: t.accent.green + '20', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
    rippleCountText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.heavy },
    rippleLine: { width: 2, height: 16, backgroundColor: t.accent.green + '30', marginLeft: 21 },
    // Badges
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginTop: 8 },
    badgeCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, width: '47%' as unknown as number, alignItems: 'center' },
    badgeIcon: { fontSize: 32, marginBottom: 8 },
    badgeName: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, textAlign: 'center' },
    badgeDesc: { color: t.text.muted, fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 },
    badgeRarity: { fontSize: 10, fontWeight: fonts.heavy, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
    badgeDate: { color: t.text.muted, fontSize: 9, marginTop: 2 },
    // Footer
    footer: { marginTop: 32, marginBottom: 20, paddingHorizontal: 40, alignItems: 'center' },
    footerText: { color: t.text.muted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
    footerHeart: { color: t.accent.green, fontSize: 24, marginBottom: 8 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Impact</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Your Story Card ─── */}
        <View style={s.storyCard}>
          <Text style={s.storyTitle}>Your Story</Text>
          <Text style={s.storyText}>{YOUR_STORY}</Text>
          <View style={s.storySummary}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{formatNumber(totalOTK)}</Text>
              <Text style={s.summaryLabel}>Total OTK</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{totalTx}</Text>
              <Text style={s.summaryLabel}>Transactions</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{DEMO_BADGES.length}</Text>
              <Text style={s.summaryLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* ─── Impact Rings ─── */}
        <Text style={s.section}>Impact Rings</Text>
        <View style={[s.card, { paddingVertical: 16 }]}>
          <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
            Each ring shows your progress in a value channel
          </Text>
          {DEMO_CHANNELS.map((ch) => (
            <View key={ch.ticker} style={s.ringRow}>
              <Text style={[s.ringLabel, { color: ch.color }]}>{ch.ticker}</Text>
              <View style={{ flex: 1, height: 24, backgroundColor: t.border, borderRadius: 12, overflow: 'hidden', marginHorizontal: 8 }}>
                <View style={[s.ringBar, {
                  backgroundColor: ch.color,
                  width: `${ch.ringPercent}%` as unknown as number,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }]} />
              </View>
              <Text style={[s.ringPercent, { color: ch.color }]}>{ch.ringPercent}%</Text>
              <Text style={s.ringBalance}>{formatNumber(ch.balance)}</Text>
            </View>
          ))}
          <Text style={{ color: t.text.muted, fontSize: 10, textAlign: 'center', marginTop: 12 }}>
            Inner to outer: nOTK (nurture) {'\u2192'} eOTK (education) {'\u2192'} hOTK (health) {'\u2192'} cOTK (community) {'\u2192'} xOTK (economic) {'\u2192'} gOTK (governance)
          </Text>
        </View>

        {/* ─── Ripple Map ─── */}
        <Text style={s.section}>Ripple Map</Text>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          <Text style={{ color: t.text.muted, fontSize: 11, textAlign: 'center', paddingTop: 16, paddingHorizontal: 16 }}>
            How your contributions rippled outward
          </Text>
          {DEMO_RIPPLE.map((ring, idx) => (
            <View key={ring.level}>
              <View style={s.rippleRing}>
                <Text style={s.rippleIcon}>{ring.icon}</Text>
                <View style={s.rippleContent}>
                  <Text style={s.rippleLabel}>
                    Ring {ring.level}: {ring.label}
                  </Text>
                  <Text style={s.rippleDesc}>{ring.description}</Text>
                </View>
                <View style={s.rippleCount}>
                  <Text style={s.rippleCountText}>{ring.count}</Text>
                </View>
              </View>
              {idx < DEMO_RIPPLE.length - 1 && (
                <View style={s.rippleLine} />
              )}
            </View>
          ))}
          <View style={{ paddingVertical: 12 }} />
        </View>

        {/* ─── Achievement Wall ─── */}
        <Text style={s.section}>Achievement Wall</Text>
        <Text style={{ color: t.text.muted, fontSize: 11, marginLeft: 24, marginBottom: 8 }}>
          Soulbound badges earned on your journey
        </Text>
        <View style={s.badgeGrid}>
          {DEMO_BADGES.map((badge) => (
            <View key={badge.id} style={[s.badgeCard, { borderWidth: 1, borderColor: rarityColor(badge.rarity) + '40' }]}>
              <Text style={s.badgeIcon}>{badge.icon}</Text>
              <Text style={s.badgeName}>{badge.name}</Text>
              <Text style={s.badgeDesc}>{badge.description}</Text>
              <Text style={[s.badgeRarity, { color: rarityColor(badge.rarity) }]}>{badge.rarity}</Text>
              <Text style={s.badgeDate}>{badge.earned}</Text>
            </View>
          ))}
        </View>

        {/* Demo tag */}
        <Text style={s.demoTag}>DEMO MODE — Sample impact story</Text>

        {/* ─── Inspirational Footer ─── */}
        <View style={s.footer}>
          <Text style={s.footerHeart}>{'\u2764\uFE0F'}</Text>
          <Text style={s.footerText}>
            Every contribution matters.{'\n'}
            Every act of kindness ripples outward.{'\n'}
            Your story is still being written.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
