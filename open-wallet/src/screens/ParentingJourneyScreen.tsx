/**
 * Parenting Journey Screen — Track and celebrate parenting milestones.
 *
 * "Every parent's sleepless night deserves recognition."
 * — The Human Constitution
 *
 * Shows a timeline of milestones, OTK earned, achievement badges,
 * upcoming milestones based on child age, and community comparisons.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onClose: () => void;
}

interface ParentingMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  otkEarned: number;
  badge: string;
  verified: boolean;
}

interface UpcomingMilestone {
  title: string;
  expectedAge: string;
  otkReward: number;
  badge: string;
}

// Demo data: a sample parenting journey
const DEMO_MILESTONES: ParentingMilestone[] = [
  { id: 'm1', title: 'First Smile', description: 'Baby smiled for the first time', date: '2024-03-15', otkEarned: 50, badge: '\u{1F60A}', verified: true },
  { id: 'm2', title: 'First Word', description: 'Said "mama" for the first time', date: '2024-08-22', otkEarned: 100, badge: '\u{1F5E3}\u{FE0F}', verified: true },
  { id: 'm3', title: 'First Steps', description: 'Took first independent steps', date: '2025-01-10', otkEarned: 150, badge: '\u{1F6B6}', verified: true },
  { id: 'm4', title: 'First Night Through', description: 'Slept through the entire night', date: '2025-04-03', otkEarned: 200, badge: '\u{1F31B}', verified: true },
  { id: 'm5', title: 'First Day of School', description: 'Started preschool', date: '2026-01-15', otkEarned: 300, badge: '\u{1F3EB}', verified: true },
  { id: 'm6', title: 'Grade Level Reading', description: 'Reading at or above grade level', date: '2026-03-01', otkEarned: 250, badge: '\u{1F4D6}', verified: false },
];

const DEMO_UPCOMING: UpcomingMilestone[] = [
  { title: 'First Bicycle Ride', expectedAge: '4-5 years', otkReward: 100, badge: '\u{1F6B2}' },
  { title: 'Swimming Proficiency', expectedAge: '5-6 years', otkReward: 150, badge: '\u{1F3CA}' },
  { title: 'First Creative Project', expectedAge: '4-6 years', otkReward: 120, badge: '\u{1F3A8}' },
  { title: 'Basic Math Skills', expectedAge: '5-6 years', otkReward: 200, badge: '\u{1F522}' },
  { title: 'Empathy Milestone', expectedAge: '4-7 years', otkReward: 250, badge: '\u{2764}\u{FE0F}' },
];

const DEMO_COMMUNITY_AVG = {
  totalMilestones: 4.2,
  totalOTK: 620,
  avgVerifiedPct: 78,
};

export function ParentingJourneyScreen({ onClose }: Props) {
  const [selectedChild] = useState('Child 1 (age 3)');
  const t = useTheme();

  const totalOTK = useMemo(() => DEMO_MILESTONES.reduce((sum, m) => sum + m.otkEarned, 0), []);
  const verifiedCount = useMemo(() => DEMO_MILESTONES.filter(m => m.verified).length, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20, fontStyle: 'italic' },
    // Score card
    scoreCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-around' },
    scoreItem: { alignItems: 'center' },
    scoreValue: { color: t.accent.purple, fontSize: 24, fontWeight: '800' },
    scoreLabel: { color: t.text.muted, fontSize: 11, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    // Child selector
    childBadge: { backgroundColor: t.accent.green + '20', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'center', marginTop: 16 },
    childBadgeText: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    // Timeline
    timelineItem: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4 },
    timelineLine: { width: 2, backgroundColor: t.accent.purple + '40', marginRight: 16 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent.purple, position: 'absolute', left: -6, top: 12 },
    timelineDotUnverified: { backgroundColor: t.accent.yellow },
    timelineContent: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, flex: 1, marginBottom: 12 },
    timelineBadge: { fontSize: 28 },
    timelineTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 4 },
    timelineDesc: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    timelineDate: { color: t.text.secondary, fontSize: 12, marginTop: 6 },
    timelineOTK: { color: t.accent.green, fontSize: 13, fontWeight: '700', marginTop: 4 },
    timelineStatus: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    statusVerified: { color: t.accent.green },
    statusPending: { color: t.accent.yellow },
    // Upcoming
    upcomingCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    upcomingBadge: { fontSize: 28 },
    upcomingInfo: { flex: 1 },
    upcomingTitle: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    upcomingAge: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    upcomingOTK: { color: t.accent.orange, fontSize: 13, fontWeight: '700' },
    // Community comparison
    communityCard: { backgroundColor: t.accent.blue + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8 },
    communityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    communityLabel: { color: t.text.secondary, fontSize: 13 },
    communityValue: { color: t.text.primary, fontSize: 13, fontWeight: '700' },
    communityYou: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },
    // Sleepless nights message
    sleeplessCard: { backgroundColor: t.accent.purple + '15', borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 24, alignItems: 'center' },
    sleeplessIcon: { fontSize: 40, marginBottom: 8 },
    sleeplessTitle: { color: t.text.primary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
    sleeplessSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Parenting Journey</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F31F}'}</Text>
          <Text style={s.heroTitle}>Every Milestone Matters</Text>
          <Text style={s.heroSubtitle}>
            "Every parent's sleepless night deserves recognition."
          </Text>
        </View>

        {/* Parenting Score */}
        <View style={s.scoreCard}>
          <View style={s.scoreItem}>
            <Text style={s.scoreValue}>{totalOTK}</Text>
            <Text style={s.scoreLabel}>nOTK Earned</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={s.scoreValue}>{DEMO_MILESTONES.length}</Text>
            <Text style={s.scoreLabel}>Milestones</Text>
          </View>
          <View style={s.scoreItem}>
            <Text style={s.scoreValue}>{verifiedCount}</Text>
            <Text style={s.scoreLabel}>Verified</Text>
          </View>
        </View>

        {/* Child selector */}
        <View style={s.childBadge}>
          <Text style={s.childBadgeText}>{selectedChild}</Text>
        </View>

        {/* Milestone Timeline */}
        <Text style={s.section}>Milestone Timeline</Text>
        <View style={{ marginLeft: 28 }}>
          {DEMO_MILESTONES.map((milestone) => (
            <View key={milestone.id} style={s.timelineItem}>
              <View style={s.timelineLine}>
                <View style={[s.timelineDot, !milestone.verified && s.timelineDotUnverified]} />
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineBadge}>{milestone.badge}</Text>
                <Text style={s.timelineTitle}>{milestone.title}</Text>
                <Text style={s.timelineDesc}>{milestone.description}</Text>
                <Text style={s.timelineDate}>{milestone.date}</Text>
                <Text style={s.timelineOTK}>+{milestone.otkEarned} nOTK</Text>
                <Text style={[s.timelineStatus, milestone.verified ? s.statusVerified : s.statusPending]}>
                  {milestone.verified ? 'Verified on-chain' : 'Pending verification'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Upcoming Milestones */}
        <Text style={s.section}>Upcoming Milestones (Auto-Suggested)</Text>
        {DEMO_UPCOMING.map((m, i) => (
          <View key={i} style={s.upcomingCard}>
            <Text style={s.upcomingBadge}>{m.badge}</Text>
            <View style={s.upcomingInfo}>
              <Text style={s.upcomingTitle}>{m.title}</Text>
              <Text style={s.upcomingAge}>Expected: {m.expectedAge}</Text>
            </View>
            <Text style={s.upcomingOTK}>+{m.otkReward} nOTK</Text>
          </View>
        ))}

        {/* Community Comparison */}
        <Text style={s.section}>Community Comparison (Anonymized)</Text>
        <View style={s.communityCard}>
          <View style={s.communityRow}>
            <Text style={s.communityLabel}>Avg milestones (same age group)</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={s.communityValue}>{DEMO_COMMUNITY_AVG.totalMilestones}</Text>
              <Text style={s.communityYou}>You: {DEMO_MILESTONES.length}</Text>
            </View>
          </View>
          <View style={s.communityRow}>
            <Text style={s.communityLabel}>Avg nOTK earned</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={s.communityValue}>{DEMO_COMMUNITY_AVG.totalOTK}</Text>
              <Text style={s.communityYou}>You: {totalOTK}</Text>
            </View>
          </View>
          <View style={s.communityRow}>
            <Text style={s.communityLabel}>Avg verified %</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={s.communityValue}>{DEMO_COMMUNITY_AVG.avgVerifiedPct}%</Text>
              <Text style={s.communityYou}>You: {Math.round(verifiedCount / DEMO_MILESTONES.length * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Emotional messaging */}
        <View style={s.sleeplessCard}>
          <Text style={s.sleeplessIcon}>{'\u{1F31B}'}</Text>
          <Text style={s.sleeplessTitle}>Every Sleepless Night Counted</Text>
          <Text style={s.sleeplessSubtitle}>
            You have been recognized for {DEMO_MILESTONES.length} milestones and earned {totalOTK} nOTK. The late nights, the early mornings, the endless patience — it is all recorded on Open Chain as a permanent testament to your dedication.
          </Text>
        </View>

        <Text style={s.note}>
          Parenting milestones are verified through the Milestone Oracle network and recorded on Open Chain. nOTK earned through parenting ripples up to your own parents through family tree attribution.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
