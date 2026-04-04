import { fonts } from '../utils/theme';
/**
 * Neighbor Help Screen — Neighborhood mutual aid, quick help requests.
 *
 * Article I: "No one should struggle alone when neighbors are near.
 *  Small acts of kindness weave the fabric of community."
 * — Human Constitution
 *
 * cOTK = community tokens (earned for helping neighbors)
 *
 * Features:
 * - Quick help board (carry groceries, fix a leak, watch a pet, give a ride)
 * - Offer help (skills, availability, radius)
 * - Neighbor ratings (helpful, reliable, friendly — build community trust)
 * - Help history (given and received)
 * - cOTK earned for helping neighbors
 * - "Pay it forward" chain (help someone, they help someone else)
 * - Demo: 4 help requests, 3 helpers available, help history
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Props {
  onClose: () => void;
}

interface HelpRequest {
  id: string;
  title: string;
  category: string;
  description: string;
  requesterName: string;
  requesterUid: string;
  urgency: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  cOTKReward: number;
  distance: string;
  postedAgo: string;
  status: 'open' | 'claimed' | 'completed';
}

interface HelperProfile {
  uid: string;
  name: string;
  skills: string[];
  availability: string;
  radiusKm: number;
  rating: { helpful: number; reliable: number; friendly: number };
  helpsGiven: number;
  cOTKEarned: number;
  payItForwardChain: number;
}

interface HelpHistoryEntry {
  id: string;
  type: 'given' | 'received';
  title: string;
  partnerName: string;
  date: string;
  cOTK: number;
  category: string;
  payItForward: boolean;
}

interface NeighborRating {
  uid: string;
  name: string;
  helpful: number;
  reliable: number;
  friendly: number;
  totalHelps: number;
  chainLength: number;
}

// ─── Constants ───

const HELP_CATEGORIES = [
  { key: 'groceries', label: 'Carry Groceries', icon: 'G' },
  { key: 'fix', label: 'Fix Something', icon: 'F' },
  { key: 'pet', label: 'Watch a Pet', icon: 'P' },
  { key: 'ride', label: 'Give a Ride', icon: 'R' },
  { key: 'move', label: 'Help Move', icon: 'M' },
  { key: 'tech', label: 'Tech Help', icon: 'T' },
  { key: 'other', label: 'Other', icon: '?' },
];

const URGENCY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_REQUESTS: HelpRequest[] = [
  {
    id: 'hr1', title: 'Help carry groceries upstairs', category: 'groceries',
    description: 'Just got back from the store, have 6 heavy bags and my knee is acting up. Third floor, no elevator.',
    requesterName: 'Mrs. Chen', requesterUid: 'uid-nb-001',
    urgency: 'medium', estimatedMinutes: 15, cOTKReward: 50, distance: '0.2 km', postedAgo: '5 min ago', status: 'open',
  },
  {
    id: 'hr2', title: 'Kitchen faucet leaking', category: 'fix',
    description: 'Slow drip from kitchen faucet. Have tools but not sure how to fix it. Any plumbing knowledge appreciated.',
    requesterName: 'Tom Rodriguez', requesterUid: 'uid-nb-002',
    urgency: 'low', estimatedMinutes: 30, cOTKReward: 80, distance: '0.5 km', postedAgo: '20 min ago', status: 'open',
  },
  {
    id: 'hr3', title: 'Watch my dog for 2 hours', category: 'pet',
    description: 'Emergency dentist appointment. My golden retriever Max is very friendly, just needs someone to sit with him.',
    requesterName: 'Aisha Patel', requesterUid: 'uid-nb-003',
    urgency: 'high', estimatedMinutes: 120, cOTKReward: 150, distance: '0.3 km', postedAgo: '2 min ago', status: 'open',
  },
  {
    id: 'hr4', title: 'Ride to pharmacy', category: 'ride',
    description: 'Need to pick up prescription. Pharmacy is 3 miles away. Happy to cover gas.',
    requesterName: 'James Walker', requesterUid: 'uid-nb-004',
    urgency: 'medium', estimatedMinutes: 25, cOTKReward: 60, distance: '0.1 km', postedAgo: '35 min ago', status: 'open',
  },
];

const DEMO_HELPERS: HelperProfile[] = [
  {
    uid: 'uid-hlp-001', name: 'Maria Santos', skills: ['Groceries', 'Pet care', 'Cooking'],
    availability: 'Weekday mornings', radiusKm: 2,
    rating: { helpful: 4.9, reliable: 4.8, friendly: 5.0 },
    helpsGiven: 47, cOTKEarned: 3200, payItForwardChain: 12,
  },
  {
    uid: 'uid-hlp-002', name: 'David Kim', skills: ['Fix things', 'Tech help', 'Moving'],
    availability: 'Evenings & weekends', radiusKm: 5,
    rating: { helpful: 4.7, reliable: 4.9, friendly: 4.6 },
    helpsGiven: 63, cOTKEarned: 5100, payItForwardChain: 8,
  },
  {
    uid: 'uid-hlp-003', name: 'Fatima Hassan', skills: ['Rides', 'Groceries', 'Elder care'],
    availability: 'Afternoons', radiusKm: 10,
    rating: { helpful: 5.0, reliable: 4.9, friendly: 4.9 },
    helpsGiven: 82, cOTKEarned: 6800, payItForwardChain: 21,
  },
];

const DEMO_HISTORY: HelpHistoryEntry[] = [
  { id: 'hh1', type: 'given', title: 'Helped carry groceries', partnerName: 'Mrs. Chen', date: '2026-03-28', cOTK: 50, category: 'groceries', payItForward: true },
  { id: 'hh2', type: 'received', title: 'Got help fixing shelf', partnerName: 'David Kim', date: '2026-03-26', cOTK: 70, category: 'fix', payItForward: false },
  { id: 'hh3', type: 'given', title: 'Gave ride to clinic', partnerName: 'James Walker', date: '2026-03-24', cOTK: 60, category: 'ride', payItForward: true },
  { id: 'hh4', type: 'given', title: 'Watched neighbor cat', partnerName: 'Lisa Park', date: '2026-03-22', cOTK: 100, category: 'pet', payItForward: false },
  { id: 'hh5', type: 'received', title: 'Tech help with router', partnerName: 'David Kim', date: '2026-03-20', cOTK: 40, category: 'tech', payItForward: true },
  { id: 'hh6', type: 'given', title: 'Helped move furniture', partnerName: 'Tom Rodriguez', date: '2026-03-18', cOTK: 120, category: 'move', payItForward: true },
];

const DEMO_NEIGHBORS: NeighborRating[] = [
  { uid: 'uid-hlp-003', name: 'Fatima Hassan', helpful: 5.0, reliable: 4.9, friendly: 4.9, totalHelps: 82, chainLength: 21 },
  { uid: 'uid-hlp-002', name: 'David Kim', helpful: 4.7, reliable: 4.9, friendly: 4.6, totalHelps: 63, chainLength: 8 },
  { uid: 'uid-hlp-001', name: 'Maria Santos', helpful: 4.9, reliable: 4.8, friendly: 5.0, totalHelps: 47, chainLength: 12 },
  { uid: 'uid-nb-001', name: 'Mrs. Chen', helpful: 4.5, reliable: 4.6, friendly: 4.9, totalHelps: 28, chainLength: 5 },
  { uid: 'uid-nb-004', name: 'James Walker', helpful: 4.3, reliable: 4.4, friendly: 4.7, totalHelps: 15, chainLength: 3 },
];

// ─── Helpers ───

const avgRating = (r: { helpful: number; reliable: number; friendly: number }): number =>
  Math.round(((r.helpful + r.reliable + r.friendly) / 3) * 10) / 10;

type Tab = 'requests' | 'offer' | 'history' | 'neighbors';

export function NeighborHelpScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('requests');
  const [offerSkills, setOfferSkills] = useState<string[]>([]);
  const [offerAvailability, setOfferAvailability] = useState('');
  const [offerRadius, setOfferRadius] = useState('');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestCategory, setNewRequestCategory] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const requests = DEMO_REQUESTS;
  const helpers = DEMO_HELPERS;
  const history = DEMO_HISTORY;
  const neighbors = DEMO_NEIGHBORS;

  const myStats = useMemo(() => ({
    given: history.filter((h) => h.type === 'given').length,
    received: history.filter((h) => h.type === 'received').length,
    cOTKEarned: history.filter((h) => h.type === 'given').reduce((sum, h) => sum + h.cOTK, 0),
    payItForwards: history.filter((h) => h.payItForward).length,
  }), [history]);

  const handleClaimRequest = useCallback((req: HelpRequest) => {
    Alert.alert(
      'Help Offered',
      `You offered to help ${req.requesterName} with "${req.title}".\n\nEstimated time: ${req.estimatedMinutes} min\ncOTK reward: ${req.cOTKReward}\n\nThey'll be notified and can accept your help.`,
    );
  }, []);

  const handleOfferHelp = useCallback(() => {
    if (offerSkills.length === 0) { Alert.alert('Required', 'Select at least one skill you can help with.'); return; }
    if (!offerAvailability.trim()) { Alert.alert('Required', 'Enter your availability.'); return; }
    const radius = parseInt(offerRadius, 10);
    if (!radius || radius <= 0) { Alert.alert('Required', 'Enter a valid radius in km.'); return; }

    Alert.alert(
      'Profile Updated',
      `You're now listed as available to help!\n\nSkills: ${offerSkills.join(', ')}\nAvailability: ${offerAvailability}\nRadius: ${radius} km\n\nNeighbors can now find you when they need help.`,
    );
    setOfferSkills([]);
    setOfferAvailability('');
    setOfferRadius('');
  }, [offerSkills, offerAvailability, offerRadius]);

  const handlePostRequest = useCallback(() => {
    if (!newRequestCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!newRequestTitle.trim()) { Alert.alert('Required', 'Enter a title.'); return; }
    if (!newRequestDescription.trim()) { Alert.alert('Required', 'Describe what you need help with.'); return; }

    Alert.alert(
      'Request Posted',
      `Your help request "${newRequestTitle}" has been posted to the neighborhood board.\n\nNearby helpers will be notified.`,
    );
    setNewRequestTitle('');
    setNewRequestCategory('');
    setNewRequestDescription('');
    setShowNewRequest(false);
  }, [newRequestTitle, newRequestCategory, newRequestDescription]);

  const toggleSkill = useCallback((skill: string) => {
    setOfferSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }, []);

  const handlePayItForward = useCallback(() => {
    Alert.alert(
      'Pay It Forward',
      'When you receive help, you can pledge to help someone else in return.\n\nThis creates a chain of kindness tracked on-chain. The longest chains earn bonus cOTK!',
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    requestTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, flex: 1 },
    requesterName: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    desc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 18 },
    urgencyBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    urgencyText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    metaText: { color: t.text.muted, fontSize: fonts.sm },
    rewardText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    helpBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    helpBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    postBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    postBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Offer
    skillSelector: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    skillPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, marginBottom: 8, backgroundColor: t.bg.card },
    skillPillActive: { backgroundColor: t.accent.green + '20' },
    skillPillText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    skillPillTextActive: { color: t.accent.green },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: t.text.primary, fontSize: fonts.md },
    textArea: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: t.text.primary, fontSize: fonts.md, minHeight: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // History
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.bg.card },
    historyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    historyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, flex: 1 },
    historyMeta: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    historyCOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    payForwardBadge: { backgroundColor: t.accent.purple + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
    payForwardText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold },
    // Neighbors
    neighborCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    neighborName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    ratingRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
    ratingItem: { alignItems: 'center', flex: 1 },
    ratingValue: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    ratingLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    chainBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.accent.purple + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
    chainText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.semibold },
    neighborStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    neighborStatText: { color: t.text.muted, fontSize: fonts.sm },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    iconText: { color: t.accent.green, fontSize: fonts.lg, fontWeight: fonts.heavy },
    categoryTag: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
    categoryText: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.semibold },
    payForwardBtn: { backgroundColor: t.accent.purple + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    payForwardBtnText: { color: t.accent.purple, fontSize: fonts.md, fontWeight: fonts.bold },
    distanceText: { color: t.text.muted, fontSize: fonts.sm },
    timeText: { color: t.text.muted, fontSize: fonts.xs },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Neighbor Help</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {([
          { key: 'requests' as Tab, label: 'Requests' },
          { key: 'offer' as Tab, label: 'Offer Help' },
          { key: 'history' as Tab, label: 'History' },
          { key: 'neighbors' as Tab, label: 'Neighbors' },
        ]).map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* ── Requests ── */}
        {tab === 'requests' && (
          <>
            <TouchableOpacity style={s.postBtn} onPress={() => setShowNewRequest(!showNewRequest)}>
              <Text style={s.postBtnText}>{showNewRequest ? 'Cancel' : 'Post a Help Request'}</Text>
            </TouchableOpacity>

            {showNewRequest && (
              <View style={s.card}>
                <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>New Request</Text>
                <Text style={s.inputLabel}>Category</Text>
                <View style={s.skillSelector}>
                  {HELP_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[s.skillPill, newRequestCategory === cat.key && s.skillPillActive]}
                      onPress={() => setNewRequestCategory(cat.key)}
                    >
                      <Text style={[s.skillPillText, newRequestCategory === cat.key && s.skillPillTextActive]}>
                        {cat.icon} {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.inputLabel}>What do you need help with?</Text>
                <TextInput
                  style={s.input}
                  value={newRequestTitle}
                  onChangeText={setNewRequestTitle}
                  placeholder="e.g., Help carry groceries upstairs"
                  placeholderTextColor={t.text.muted}
                />
                <Text style={s.inputLabel}>Details</Text>
                <TextInput
                  style={s.textArea}
                  value={newRequestDescription}
                  onChangeText={setNewRequestDescription}
                  placeholder="Describe what you need..."
                  placeholderTextColor={t.text.muted}
                  multiline
                />
                <TouchableOpacity style={s.submitBtn} onPress={handlePostRequest}>
                  <Text style={s.submitBtnText}>Post Request</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={s.sectionTitle}>Help Board</Text>
            {requests.map((req) => (
              <View key={req.id} style={s.card}>
                <View style={s.row}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={s.iconCircle}>
                      <Text style={s.iconText}>
                        {HELP_CATEGORIES.find((c) => c.key === req.category)?.icon || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.requestTitle}>{req.title}</Text>
                      <Text style={s.requesterName}>{req.requesterName}</Text>
                    </View>
                  </View>
                </View>
                <View style={[s.urgencyBadge, { backgroundColor: URGENCY_COLORS[req.urgency] }]}>
                  <Text style={s.urgencyText}>{req.urgency}</Text>
                </View>
                <Text style={s.desc}>{req.description}</Text>
                <View style={s.metaRow}>
                  <Text style={s.metaText}>{req.estimatedMinutes} min</Text>
                  <Text style={s.distanceText}>{req.distance}</Text>
                  <Text style={s.timeText}>{req.postedAgo}</Text>
                  <Text style={s.rewardText}>{req.cOTKReward} cOTK</Text>
                </View>
                <TouchableOpacity style={s.helpBtn} onPress={() => handleClaimRequest(req)}>
                  <Text style={s.helpBtnText}>I Can Help</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ── Offer Help ── */}
        {tab === 'offer' && (
          <>
            <Text style={s.sectionTitle}>What Can You Help With?</Text>
            <View style={s.card}>
              <Text style={s.inputLabel}>Skills / Help Types</Text>
              <View style={s.skillSelector}>
                {HELP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.skillPill, offerSkills.includes(cat.label) && s.skillPillActive]}
                    onPress={() => toggleSkill(cat.label)}
                  >
                    <Text style={[s.skillPillText, offerSkills.includes(cat.label) && s.skillPillTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>Availability</Text>
              <TextInput
                style={s.input}
                value={offerAvailability}
                onChangeText={setOfferAvailability}
                placeholder="e.g., Weekday evenings, weekends"
                placeholderTextColor={t.text.muted}
              />

              <Text style={s.inputLabel}>Radius (km)</Text>
              <TextInput
                style={s.input}
                value={offerRadius}
                onChangeText={setOfferRadius}
                placeholder="How far can you travel?"
                placeholderTextColor={t.text.muted}
                keyboardType="numeric"
              />

              <TouchableOpacity style={s.submitBtn} onPress={handleOfferHelp}>
                <Text style={s.submitBtnText}>Start Helping Neighbors</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.sectionTitle}>Available Helpers Nearby</Text>
            {helpers.map((h) => (
              <View key={h.uid} style={s.card}>
                <View style={s.row}>
                  <Text style={s.neighborName}>{h.name}</Text>
                  <Text style={s.rewardText}>{h.cOTKEarned.toLocaleString()} cOTK</Text>
                </View>
                <Text style={s.requesterName}>{h.availability} | {h.radiusKm} km radius</Text>
                <View style={[s.skillSelector, { marginTop: 6 }]}>
                  {h.skills.map((sk) => (
                    <View key={sk} style={s.categoryTag}><Text style={s.categoryText}>{sk}</Text></View>
                  ))}
                </View>
                <View style={s.ratingRow}>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{h.rating.helpful}</Text>
                    <Text style={s.ratingLabel}>Helpful</Text>
                  </View>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{h.rating.reliable}</Text>
                    <Text style={s.ratingLabel}>Reliable</Text>
                  </View>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{h.rating.friendly}</Text>
                    <Text style={s.ratingLabel}>Friendly</Text>
                  </View>
                </View>
                <View style={s.neighborStats}>
                  <Text style={s.neighborStatText}>{h.helpsGiven} helps given</Text>
                  <View style={s.chainBadge}>
                    <Text style={s.chainText}>Pay-it-forward chain: {h.payItForwardChain}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <>
            <View style={s.card}>
              <View style={s.statRow}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{myStats.given}</Text>
                  <Text style={s.statLabel}>Helps Given</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{myStats.received}</Text>
                  <Text style={s.statLabel}>Received</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: t.accent.green }]}>{myStats.cOTKEarned}</Text>
                  <Text style={s.statLabel}>cOTK Earned</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: t.accent.purple }]}>{myStats.payItForwards}</Text>
                  <Text style={s.statLabel}>Pay It Fwd</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={s.payForwardBtn} onPress={handlePayItForward}>
              <Text style={s.payForwardBtnText}>About Pay It Forward Chains</Text>
            </TouchableOpacity>

            <Text style={s.sectionTitle}>Help History</Text>
            <View style={s.card}>
              {history.map((h, i) => (
                <View key={h.id} style={[s.historyItem, i === history.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[s.historyIcon, {
                    backgroundColor: h.type === 'given' ? t.accent.green + '20' : t.accent.blue + '20',
                  }]}>
                    <Text style={{ color: h.type === 'given' ? t.accent.green : t.accent.blue, fontWeight: fonts.heavy, fontSize: fonts.md }}>
                      {h.type === 'given' ? '>' : '<'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={s.historyTitle}>{h.title}</Text>
                      {h.payItForward && (
                        <View style={s.payForwardBadge}>
                          <Text style={s.payForwardText}>PIF</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.historyMeta}>{h.partnerName} | {h.date}</Text>
                  </View>
                  <Text style={s.historyCOTK}>
                    {h.type === 'given' ? '+' : '-'}{h.cOTK} cOTK
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Neighbors ── */}
        {tab === 'neighbors' && (
          <>
            <Text style={s.sectionTitle}>Neighbor Trust Ratings</Text>
            {neighbors.map((n, i) => (
              <View key={n.uid} style={s.neighborCard}>
                <View style={s.row}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[s.iconCircle, { backgroundColor: t.accent.blue + '20' }]}>
                      <Text style={[s.iconText, { color: t.accent.blue }]}>#{i + 1}</Text>
                    </View>
                    <Text style={s.neighborName}>{n.name}</Text>
                  </View>
                  <Text style={s.neighborStatText}>{n.totalHelps} helps</Text>
                </View>
                <View style={s.ratingRow}>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{n.helpful}</Text>
                    <Text style={s.ratingLabel}>Helpful</Text>
                  </View>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{n.reliable}</Text>
                    <Text style={s.ratingLabel}>Reliable</Text>
                  </View>
                  <View style={s.ratingItem}>
                    <Text style={s.ratingValue}>{n.friendly}</Text>
                    <Text style={s.ratingLabel}>Friendly</Text>
                  </View>
                </View>
                {n.chainLength > 0 && (
                  <View style={s.chainBadge}>
                    <Text style={s.chainText}>Pay-it-forward chain: {n.chainLength} links</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
