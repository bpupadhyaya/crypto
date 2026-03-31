/**
 * Feedback Form Screen — Structured feedback form for app improvement.
 *
 * Provides tabs for general feedback, bug reports, and feature
 * suggestions with structured input fields and submission.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'feedback' | 'bugs' | 'suggestions';

interface RatingOption {
  value: number;
  label: string;
  icon: string;
}

interface RecentSubmission {
  id: string;
  type: string;
  title: string;
  date: string;
  status: 'submitted' | 'reviewed' | 'resolved';
}

// --- Demo data ---

const RATINGS: RatingOption[] = [
  { value: 1, label: 'Poor', icon: '\u{1F61E}' },
  { value: 2, label: 'Fair', icon: '\u{1F610}' },
  { value: 3, label: 'Good', icon: '\u{1F642}' },
  { value: 4, label: 'Great', icon: '\u{1F60A}' },
  { value: 5, label: 'Amazing', icon: '\u{1F929}' },
];

const BUG_CATEGORIES = ['Wallet', 'Transactions', 'Display', 'Network', 'Security', 'Other'];

const RECENT: RecentSubmission[] = [
  { id: 'rs1', type: 'Bug', title: 'Solana balance not updating', date: '2026-03-25', status: 'resolved' },
  { id: 'rs2', type: 'Suggestion', title: 'Add portfolio export as CSV', date: '2026-03-22', status: 'reviewed' },
  { id: 'rs3', type: 'Feedback', title: 'Love the achievement system', date: '2026-03-20', status: 'submitted' },
];

const STATUS_ICON: Record<string, string> = { submitted: '\u{1F4E8}', reviewed: '\u{1F440}', resolved: '\u2705' };
const STATUS_LABEL: Record<string, string> = { submitted: 'Submitted', reviewed: 'Under Review', resolved: 'Resolved' };

// --- Component ---

interface Props {
  onClose: () => void;
}

export function FeedbackFormScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('feedback');
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugCategory, setBugCategory] = useState('');
  const [sugTitle, setSugTitle] = useState('');
  const [sugDesc, setSugDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'feedback', label: 'Feedback' },
    { key: 'bugs', label: 'Bugs' },
    { key: 'suggestions', label: 'Ideas' },
  ];

  const handleSubmit = () => setSubmitted(true);
  const handleReset = () => { setSubmitted(false); setRating(0); setFeedbackText(''); setBugTitle(''); setBugDesc(''); setBugCategory(''); setSugTitle(''); setSugDesc(''); };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeText: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    textArea: { height: 100, textAlignVertical: 'top' },
    ratingRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    ratingBtn: { alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 2 },
    ratingIcon: { fontSize: 28 },
    ratingLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    categoryChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
    categoryText: { fontSize: 12, fontWeight: '600' },
    successCard: { backgroundColor: t.accent.green + '20', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 16 },
    successIcon: { fontSize: 48, marginBottom: 8 },
    successTitle: { color: t.accent.green, fontSize: 18, fontWeight: '700', marginBottom: 4 },
    successText: { color: t.text.secondary, fontSize: 13, textAlign: 'center' },
    resetBtn: { backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: t.border },
    resetText: { color: t.accent.blue, fontSize: 14, fontWeight: '600' },
    recentCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    recentIcon: { fontSize: 18, marginRight: 10 },
    recentInfo: { flex: 1 },
    recentTitle: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    recentMeta: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    recentStatus: { fontSize: 11, fontWeight: '700' },
  }), [t]);

  const statusColor = (s: string) => s === 'resolved' ? t.accent.green : s === 'reviewed' ? t.accent.yellow : t.text.muted;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Feedback</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => { setTab(tb.key); setSubmitted(false); }}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {submitted ? (
          <>
            <View style={st.successCard}>
              <Text style={st.successIcon}>{'\u{1F389}'}</Text>
              <Text style={st.successTitle}>Thank You!</Text>
              <Text style={st.successText}>Your {tab === 'bugs' ? 'bug report' : tab === 'suggestions' ? 'suggestion' : 'feedback'} has been submitted. We review every submission.</Text>
            </View>
            <TouchableOpacity style={st.resetBtn} onPress={handleReset}><Text style={st.resetText}>Submit Another</Text></TouchableOpacity>
          </>
        ) : (
          <>
            {tab === 'feedback' && (
              <>
                <Text style={st.section}>Rate Your Experience</Text>
                <View style={st.card}>
                  <View style={st.ratingRow}>
                    {RATINGS.map(r => (
                      <TouchableOpacity key={r.value} style={[st.ratingBtn, { borderColor: rating === r.value ? t.accent.blue : 'transparent' }]} onPress={() => setRating(r.value)}>
                        <Text style={st.ratingIcon}>{r.icon}</Text>
                        <Text style={[st.ratingLabel, { color: rating === r.value ? t.accent.blue : t.text.muted }]}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={st.inputLabel}>Tell us more</Text>
                  <TextInput style={[st.input, st.textArea]} value={feedbackText} onChangeText={setFeedbackText} placeholder="What do you think about Open Wallet?" placeholderTextColor={t.text.muted} multiline />
                  <TouchableOpacity style={st.submitBtn} onPress={handleSubmit}><Text style={st.submitText}>Submit Feedback</Text></TouchableOpacity>
                </View>
              </>
            )}

            {tab === 'bugs' && (
              <>
                <Text style={st.section}>Report a Bug</Text>
                <View style={st.card}>
                  <Text style={st.inputLabel}>Category</Text>
                  <View style={st.categoryRow}>
                    {BUG_CATEGORIES.map(cat => (
                      <TouchableOpacity key={cat} style={[st.categoryChip, { borderColor: bugCategory === cat ? t.accent.red : t.border, backgroundColor: bugCategory === cat ? t.accent.red + '20' : 'transparent' }]} onPress={() => setBugCategory(cat)}>
                        <Text style={[st.categoryText, { color: bugCategory === cat ? t.accent.red : t.text.muted }]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={st.inputLabel}>Bug Title</Text>
                  <TextInput style={st.input} value={bugTitle} onChangeText={setBugTitle} placeholder="Brief description" placeholderTextColor={t.text.muted} />
                  <Text style={st.inputLabel}>Steps to Reproduce</Text>
                  <TextInput style={[st.input, st.textArea]} value={bugDesc} onChangeText={setBugDesc} placeholder="1. Go to...\n2. Tap on...\n3. See error" placeholderTextColor={t.text.muted} multiline />
                  <TouchableOpacity style={[st.submitBtn, { backgroundColor: t.accent.red }]} onPress={handleSubmit}><Text style={st.submitText}>Report Bug</Text></TouchableOpacity>
                </View>
              </>
            )}

            {tab === 'suggestions' && (
              <>
                <Text style={st.section}>Suggest a Feature</Text>
                <View style={st.card}>
                  <Text style={st.inputLabel}>Feature Title</Text>
                  <TextInput style={st.input} value={sugTitle} onChangeText={setSugTitle} placeholder="What would you like to see?" placeholderTextColor={t.text.muted} />
                  <Text style={st.inputLabel}>Description</Text>
                  <TextInput style={[st.input, st.textArea]} value={sugDesc} onChangeText={setSugDesc} placeholder="Describe the feature and how it would help..." placeholderTextColor={t.text.muted} multiline />
                  <TouchableOpacity style={[st.submitBtn, { backgroundColor: t.accent.purple }]} onPress={handleSubmit}><Text style={st.submitText}>Submit Idea</Text></TouchableOpacity>
                </View>
              </>
            )}

            <Text style={st.section}>Recent Submissions</Text>
            {RECENT.map(item => (
              <View key={item.id} style={st.recentCard}>
                <Text style={st.recentIcon}>{STATUS_ICON[item.status]}</Text>
                <View style={st.recentInfo}>
                  <Text style={st.recentTitle}>{item.title}</Text>
                  <Text style={st.recentMeta}>{item.type} - {item.date}</Text>
                </View>
                <Text style={[st.recentStatus, { color: statusColor(item.status) }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
