/**
 * Community Awards Screen — Community recognition ceremonies.
 *
 * Browse award categories, nominate community members, vote on nominees,
 * and view past winners of recognition awards like Volunteer of the Month,
 * Teacher Impact, Parent Champion, and more.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type AwardTab = 'nominees' | 'nominate' | 'winners' | 'categories';

interface AwardCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Nominee {
  id: string;
  name: string;
  categoryId: string;
  reason: string;
  nominatedBy: string;
  votes: number;
  nominatedAt: number;
}

interface Winner {
  id: string;
  name: string;
  categoryId: string;
  period: string;
  reason: string;
  otkReward: number;
  awardedAt: number;
}

// --- Demo data ---

const CATEGORIES: AwardCategory[] = [
  { id: 'cat_01', name: 'Volunteer of the Month', icon: '\u{1F9E1}', description: 'Recognizes outstanding volunteer service to the community.' },
  { id: 'cat_02', name: 'Teacher Impact', icon: '\u{1F4DA}', description: 'Honors educators who have made a lasting difference in students\u2019 lives.' },
  { id: 'cat_03', name: 'Parent Champion', icon: '\u{1F3E0}', description: 'Celebrates parents who go above and beyond for their children and community.' },
  { id: 'cat_04', name: 'Youth Leader', icon: '\u{1F31F}', description: 'Recognizes young people who demonstrate exceptional leadership.' },
  { id: 'cat_05', name: 'Elder Wisdom', icon: '\u{1F9D3}', description: 'Honors elders who share knowledge and mentor the next generation.' },
  { id: 'cat_06', name: 'Environmental Hero', icon: '\u{1F33F}', description: 'Celebrates individuals protecting and improving the local environment.' },
  { id: 'cat_07', name: 'Innovation Pioneer', icon: '\u{1F4A1}', description: 'Recognizes creative problem-solvers who build tools for community benefit.' },
];

const DEMO_NOMINEES: Nominee[] = [
  {
    id: 'nom_001', name: 'Amara Osei', categoryId: 'cat_01',
    reason: 'Organized 12 weekend cleanup events at the community park and recruited 80+ volunteers.',
    nominatedBy: 'David Chen', votes: 47, nominatedAt: Date.now() - 5 * 86_400_000,
  },
  {
    id: 'nom_002', name: 'Priya Sharma', categoryId: 'cat_02',
    reason: 'Developed a free after-school coding program that graduated 35 students this quarter.',
    nominatedBy: 'Leila Ahmed', votes: 62, nominatedAt: Date.now() - 3 * 86_400_000,
  },
  {
    id: 'nom_003', name: 'James Okonkwo', categoryId: 'cat_04',
    reason: 'Led the youth council\u2019s food drive that collected 2,000 meals for families in need.',
    nominatedBy: 'Maria Lopez', votes: 31, nominatedAt: Date.now() - 7 * 86_400_000,
  },
];

const DEMO_WINNERS: Winner[] = [
  {
    id: 'win_001', name: 'Elena Vasquez', categoryId: 'cat_06',
    period: 'February 2026', reason: 'Planted 300 native trees along the river corridor and organized monthly nature walks.',
    otkReward: 500, awardedAt: Date.now() - 30 * 86_400_000,
  },
  {
    id: 'win_002', name: 'Samuel Kim', categoryId: 'cat_05',
    period: 'January 2026', reason: 'Mentored 20 young entrepreneurs through the community business incubator program.',
    otkReward: 500, awardedAt: Date.now() - 60 * 86_400_000,
  },
];

// --- Helpers ---

function getCategoryName(id: string): string {
  return CATEGORIES.find(c => c.id === id)?.name ?? 'Unknown';
}

function getCategoryIcon(id: string): string {
  return CATEGORIES.find(c => c.id === id)?.icon ?? '\u{1F3C6}';
}

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// --- Component ---

interface Props {
  onClose: () => void;
}

export function CommunityAwardsScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);

  const [tab, setTab] = useState<AwardTab>('nominees');
  const [nomName, setNomName] = useState('');
  const [nomCategory, setNomCategory] = useState(CATEGORIES[0].id);
  const [nomReason, setNomReason] = useState('');

  const tabs: { key: AwardTab; label: string }[] = [
    { key: 'nominees', label: `Nominees (${DEMO_NOMINEES.length})` },
    { key: 'nominate', label: 'Nominate' },
    { key: 'winners', label: `Winners (${DEMO_WINNERS.length})` },
    { key: 'categories', label: `Categories (${CATEGORIES.length})` },
  ];

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 4 },
    tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSub: { color: t.text.secondary, fontSize: 13, lineHeight: 19 },
    cardMeta: { color: t.text.muted, fontSize: 11, marginTop: 8 },
    voteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    voteCount: { color: t.accent.blue, fontSize: 15, fontWeight: '700' },
    voteBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 16 },
    voteBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    badge: { backgroundColor: t.bg.primary, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', marginBottom: 8 },
    badgeText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.bg.card },
    catBtnActive: { backgroundColor: t.accent.blue },
    catBtnText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    catBtnTextActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    winnerReward: { color: '#f5a623', fontSize: 13, fontWeight: '700', marginTop: 6 },
    catIcon: { fontSize: 28, textAlign: 'center', marginBottom: 8 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  const renderNominees = () => (
    <View>
      <Text style={st.section}>Current Nominees</Text>
      {DEMO_NOMINEES.map(n => (
        <View key={n.id} style={st.card}>
          <View style={st.badge}>
            <Text style={st.badgeText}>{getCategoryIcon(n.categoryId)} {getCategoryName(n.categoryId)}</Text>
          </View>
          <Text style={st.cardTitle}>{n.name}</Text>
          <Text style={st.cardSub}>{n.reason}</Text>
          <Text style={st.cardMeta}>Nominated by {n.nominatedBy} {'\u2022'} {formatDate(n.nominatedAt)}</Text>
          <View style={st.voteRow}>
            <Text style={st.voteCount}>{'\u{1F44D}'} {n.votes} votes</Text>
            <TouchableOpacity style={st.voteBtn}>
              <Text style={st.voteBtnText}>Vote</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderNominate = () => (
    <View>
      <Text style={st.section}>Nominate Someone</Text>
      <Text style={st.inputLabel}>Nominee Name</Text>
      <TextInput
        style={st.input}
        placeholder="Who deserves recognition?"
        placeholderTextColor={t.text.muted}
        value={nomName}
        onChangeText={setNomName}
      />
      <Text style={st.inputLabel}>Category</Text>
      <View style={st.catRow}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[st.catBtn, nomCategory === c.id && st.catBtnActive]}
            onPress={() => setNomCategory(c.id)}
          >
            <Text style={[st.catBtnText, nomCategory === c.id && st.catBtnTextActive]}>
              {c.icon} {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={st.inputLabel}>Reason for Nomination</Text>
      <TextInput
        style={[st.input, st.textArea]}
        placeholder="Why does this person deserve this award?"
        placeholderTextColor={t.text.muted}
        value={nomReason}
        onChangeText={setNomReason}
        multiline
      />
      <TouchableOpacity style={st.submitBtn}>
        <Text style={st.submitBtnText}>{'\u{1F3C6}'} Submit Nomination</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWinners = () => (
    <View>
      <Text style={st.section}>Past Winners</Text>
      {DEMO_WINNERS.map(w => (
        <View key={w.id} style={st.card}>
          <View style={st.badge}>
            <Text style={st.badgeText}>{getCategoryIcon(w.categoryId)} {getCategoryName(w.categoryId)}</Text>
          </View>
          <Text style={st.cardTitle}>{'\u{1F3C6}'} {w.name}</Text>
          <Text style={st.cardSub}>{w.reason}</Text>
          <Text style={st.winnerReward}>{'\u{1F4B0}'} {w.otkReward} OTK reward</Text>
          <Text style={st.cardMeta}>{w.period} {'\u2022'} Awarded {formatDate(w.awardedAt)}</Text>
        </View>
      ))}
    </View>
  );

  const renderCategories = () => (
    <View>
      <Text style={st.section}>Award Categories</Text>
      {CATEGORIES.map(c => (
        <View key={c.id} style={st.card}>
          <Text style={st.catIcon}>{c.icon}</Text>
          <Text style={st.cardTitle}>{c.name}</Text>
          <Text style={st.cardSub}>{c.description}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{'\u{1F3C6}'} Community Awards</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[st.tabBtn, tab === tb.key && st.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.scroll}>
        {tab === 'nominees' && renderNominees()}
        {tab === 'nominate' && renderNominate()}
        {tab === 'winners' && renderWinners()}
        {tab === 'categories' && renderCategories()}
      </ScrollView>
    </SafeAreaView>
  );
}
