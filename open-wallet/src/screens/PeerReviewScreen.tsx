import { fonts } from '../utils/theme';
/**
 * Peer Review Screen — Peer review system for community proposals and research.
 *
 * Features:
 * - Pending proposals awaiting review
 * - My reviews history with ratings
 * - Review guidelines and best practices
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Proposal {
  id: string;
  title: string;
  author: string;
  category: string;
  submitted: string;
  deadline: string;
  reviewsNeeded: number;
  reviewsComplete: number;
  cotkReward: number;
}

interface Review {
  id: string;
  proposalTitle: string;
  rating: number;
  verdict: 'approve' | 'revise' | 'reject';
  date: string;
  cotkEarned: number;
  feedback: string;
}

interface Guideline {
  id: string;
  title: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_PENDING: Proposal[] = [
  { id: 'p1', title: 'Community Solar Farm Proposal', author: 'openchain1...solar_collective', category: 'Energy', submitted: '2026-03-25', deadline: '2026-04-05', reviewsNeeded: 5, reviewsComplete: 2, cotkReward: 300 },
  { id: 'p2', title: 'Public Transit Route Optimization', author: 'openchain1...transit_lab', category: 'Transport', submitted: '2026-03-26', deadline: '2026-04-08', reviewsNeeded: 3, reviewsComplete: 0, cotkReward: 200 },
  { id: 'p3', title: 'Youth Mental Health Initiative', author: 'openchain1...health_alliance', category: 'Health', submitted: '2026-03-24', deadline: '2026-04-03', reviewsNeeded: 5, reviewsComplete: 4, cotkReward: 300 },
  { id: 'p4', title: 'Open Source Curriculum for Schools', author: 'openchain1...edu_foundation', category: 'Education', submitted: '2026-03-27', deadline: '2026-04-10', reviewsNeeded: 4, reviewsComplete: 1, cotkReward: 250 },
  { id: 'p5', title: 'Water Quality Monitoring Network', author: 'openchain1...aqua_watch', category: 'Environment', submitted: '2026-03-28', deadline: '2026-04-12', reviewsNeeded: 3, reviewsComplete: 0, cotkReward: 200 },
];

const DEMO_REVIEWS: Review[] = [
  { id: 'r1', proposalTitle: 'Community Garden Expansion', rating: 4, verdict: 'approve', date: '2026-03-20', cotkEarned: 250, feedback: 'Well-structured proposal with clear milestones.' },
  { id: 'r2', proposalTitle: 'Bike Lane Infrastructure Plan', rating: 3, verdict: 'revise', date: '2026-03-18', cotkEarned: 200, feedback: 'Good concept but needs cost breakdown.' },
  { id: 'r3', proposalTitle: 'Free Coding Bootcamp', rating: 5, verdict: 'approve', date: '2026-03-15', cotkEarned: 300, feedback: 'Excellent scope and community impact.' },
  { id: 'r4', proposalTitle: 'Noise Pollution Study', rating: 2, verdict: 'reject', date: '2026-03-12', cotkEarned: 150, feedback: 'Methodology needs significant revision.' },
];

const GUIDELINES: Guideline[] = [
  { id: 'g1', title: 'Be Constructive', description: 'Focus on how the proposal can be improved. Provide specific, actionable feedback rather than vague criticism.' },
  { id: 'g2', title: 'Evaluate Feasibility', description: 'Consider resource requirements, timeline, and technical feasibility. Flag unrealistic assumptions.' },
  { id: 'g3', title: 'Check Community Impact', description: 'Assess how many people benefit and whether the proposal aligns with community needs.' },
  { id: 'g4', title: 'Review Budget', description: 'Ensure the budget is detailed, realistic, and accounts for contingencies.' },
  { id: 'g5', title: 'Conflict of Interest', description: 'Recuse yourself if you have a personal stake. Transparency builds trust.' },
  { id: 'g6', title: 'Timely Reviews', description: 'Complete reviews before the deadline. Late reviews delay community progress.' },
];

const VERDICT_COLORS: Record<string, string> = {
  approve: '#34C759',
  revise: '#FF9500',
  reject: '#FF3B30',
};

type Tab = 'pending' | 'my-reviews' | 'guidelines';

export function PeerReviewScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('pending');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleReview = useCallback((proposal: Proposal) => {
    Alert.alert(
      'Start Review',
      `Review "${proposal.title}"?\n\nDeadline: ${proposal.deadline}\nReward: ${proposal.cotkReward} cOTK`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Begin Review', onPress: () => Alert.alert('Review Started', 'Your review workspace is ready.') },
      ],
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    proposalCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    proposalTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    proposalMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginRight: 8 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.blue },
    progressText: { color: t.text.muted, fontSize: 11 },
    reviewBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    reviewBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    rewardText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 6 },
    reviewRow: { paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    reviewTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    reviewMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    verdictBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    verdictText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    ratingText: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guideTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    guideDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'my-reviews', label: 'My Reviews' },
    { key: 'guidelines', label: 'Guidelines' },
  ];

  const renderPending = () => (
    <>
      <Text style={s.sectionTitle}>Proposals Awaiting Review</Text>
      {DEMO_PENDING.map((p) => (
        <View key={p.id} style={s.proposalCard}>
          <Text style={s.proposalTitle}>{p.title}</Text>
          <Text style={s.proposalMeta}>{p.category} | by {p.author.split('...')[1] || p.author}</Text>
          <Text style={s.proposalMeta}>Deadline: {p.deadline}</Text>
          <View style={s.progressRow}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${(p.reviewsComplete / p.reviewsNeeded) * 100}%` as any }]} />
            </View>
            <Text style={s.progressText}>{p.reviewsComplete}/{p.reviewsNeeded} reviews</Text>
          </View>
          <Text style={s.rewardText}>+{p.cotkReward} cOTK</Text>
          <TouchableOpacity style={s.reviewBtn} onPress={() => handleReview(p)}>
            <Text style={s.reviewBtnText}>Review</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderMyReviews = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_REVIEWS.length}</Text>
            <Text style={s.summaryLabel}>Reviews Done</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_REVIEWS.reduce((s, r) => s + r.cotkEarned, 0)}</Text>
            <Text style={s.summaryLabel}>cOTK Earned</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{(DEMO_REVIEWS.reduce((s, r) => s + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1)}</Text>
            <Text style={s.summaryLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>
      <View style={s.card}>
        {DEMO_REVIEWS.map((r) => (
          <View key={r.id} style={s.reviewRow}>
            <Text style={s.reviewTitle}>{r.proposalTitle}</Text>
            <Text style={s.reviewMeta}>{r.date} — {r.feedback}</Text>
            <Text style={s.ratingText}>{'*'.repeat(r.rating)} ({r.rating}/5)</Text>
            <View style={[s.verdictBadge, { backgroundColor: VERDICT_COLORS[r.verdict] }]}>
              <Text style={s.verdictText}>{r.verdict}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderGuidelines = () => (
    <>
      <Text style={s.sectionTitle}>Review Guidelines</Text>
      {GUIDELINES.map((g) => (
        <View key={g.id} style={s.guideCard}>
          <Text style={s.guideTitle}>{g.title}</Text>
          <Text style={s.guideDesc}>{g.description}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Peer Review</Text>
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
        {tab === 'pending' && renderPending()}
        {tab === 'my-reviews' && renderMyReviews()}
        {tab === 'guidelines' && renderGuidelines()}
      </ScrollView>
    </SafeAreaView>
  );
}
