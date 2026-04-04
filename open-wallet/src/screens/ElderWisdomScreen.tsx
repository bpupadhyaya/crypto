import { fonts } from '../utils/theme';
/**
 * Elder Wisdom Screen — Elder knowledge sharing, wisdom preservation.
 *
 * "The wisdom of elders is the root system of civilization.
 *  Without it, every generation starts from scratch."
 * — Human Constitution, Article I
 *
 * Wisdom feed, ask an elder, elder profiles, legacy stories.
 * Elders earn nOTK for sharing; community sends nOTK as gratitude.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

type Tab = 'wisdom' | 'ask' | 'elders' | 'legacy';

type WisdomCategory = 'life_lessons' | 'career' | 'relationships' | 'health' | 'spirituality' | 'practical_skills';

interface WisdomEntry {
  id: string;
  elderUid: string;
  elderName: string;
  category: WisdomCategory;
  title: string;
  excerpt: string;
  nOTKEarned: number;
  date: string;
  bookmarked: boolean;
  likes: number;
}

interface ElderProfile {
  uid: string;
  name: string;
  expertise: WisdomCategory[];
  wisdomCount: number;
  nOTKEarned: number;
  answersGiven: number;
  bio: string;
}

interface ElderQuestion {
  id: string;
  askerName: string;
  category: WisdomCategory;
  question: string;
  date: string;
  answerCount: number;
  status: 'open' | 'answered';
}

interface LegacyStory {
  id: string;
  elderUid: string;
  elderName: string;
  title: string;
  previewText: string;
  chainHash: string;
  wordCount: number;
  date: string;
  nOTKEarned: number;
}

/* ── category config ── */

const CATEGORIES: { key: WisdomCategory; label: string; icon: string }[] = [
  { key: 'life_lessons', label: 'Life Lessons', icon: '\u{1F331}' },
  { key: 'career', label: 'Career', icon: '\u{1F4BC}' },
  { key: 'relationships', label: 'Relationships', icon: '\u{1F491}' },
  { key: 'health', label: 'Health', icon: '\u{1FA7A}' },
  { key: 'spirituality', label: 'Spirituality', icon: '\u{1F54A}' },
  { key: 'practical_skills', label: 'Practical Skills', icon: '\u{1F527}' },
];

/* ── demo data ── */

const DEMO_WISDOM: WisdomEntry[] = [
  {
    id: 'w1', elderUid: 'uid-elder-001', elderName: 'Margaret Chen',
    category: 'life_lessons', title: 'The Gift of Patience',
    excerpt: 'When I was 30, I wanted everything immediately. By 60, I learned that the most meaningful things in life are grown slowly — relationships, character, understanding. Patience is not waiting; it is tending.',
    nOTKEarned: 45, date: '2026-03-20', bookmarked: false, likes: 128,
  },
  {
    id: 'w2', elderUid: 'uid-elder-002', elderName: 'James Okonkwo',
    category: 'career', title: 'Choose Problems, Not Titles',
    excerpt: 'I spent 40 years in engineering. The happiest people I worked with chose the problems they wanted to solve, not the titles they wanted to hold. Find the problem that keeps you awake with excitement, not dread.',
    nOTKEarned: 62, date: '2026-03-18', bookmarked: true, likes: 215,
  },
  {
    id: 'w3', elderUid: 'uid-elder-001', elderName: 'Margaret Chen',
    category: 'relationships', title: 'Listen More Than You Speak',
    excerpt: 'My grandmother told me: "You have two ears and one mouth for a reason." After 50 years of marriage, I can tell you she was right. The deepest connections form when someone feels truly heard.',
    nOTKEarned: 38, date: '2026-03-15', bookmarked: false, likes: 97,
  },
  {
    id: 'w4', elderUid: 'uid-elder-002', elderName: 'James Okonkwo',
    category: 'practical_skills', title: 'Learn to Fix Things Yourself',
    excerpt: 'Every young person should learn basic repair — plumbing, sewing, cooking, changing a tire. These skills save money, build confidence, and teach you how things work. Independence starts with competence.',
    nOTKEarned: 51, date: '2026-03-12', bookmarked: false, likes: 183,
  },
];

const DEMO_ELDERS: ElderProfile[] = [
  {
    uid: 'uid-elder-001', name: 'Margaret Chen',
    expertise: ['life_lessons', 'relationships', 'health'],
    wisdomCount: 24, nOTKEarned: 720, answersGiven: 45,
    bio: 'Retired teacher, 50 years of marriage, grandmother of 7. I believe every generation carries a torch that must be passed forward.',
  },
  {
    uid: 'uid-elder-002', name: 'James Okonkwo',
    expertise: ['career', 'practical_skills', 'life_lessons'],
    wisdomCount: 31, nOTKEarned: 930, answersGiven: 58,
    bio: 'Mechanical engineer for 40 years, community volunteer. If I can help one young person avoid a mistake I made, my life has extra meaning.',
  },
];

const DEMO_QUESTIONS: ElderQuestion[] = [
  {
    id: 'q1', askerName: 'Priya S.', category: 'career',
    question: 'How do you know when it is time to change careers? I am 28 and feel stuck but scared to leap.',
    date: '2026-03-25', answerCount: 3, status: 'answered',
  },
  {
    id: 'q2', askerName: 'David R.', category: 'relationships',
    question: 'What is the most important thing you wish you had known about marriage before getting married?',
    date: '2026-03-26', answerCount: 5, status: 'answered',
  },
  {
    id: 'q3', askerName: 'Amira K.', category: 'life_lessons',
    question: 'What is one habit from your youth that you are most grateful you developed?',
    date: '2026-03-27', answerCount: 0, status: 'open',
  },
];

const DEMO_LEGACY: LegacyStory[] = [
  {
    id: 'leg1', elderUid: 'uid-elder-001', elderName: 'Margaret Chen',
    title: 'From Shanghai to San Francisco: A Life in Two Worlds',
    previewText: 'I was born in 1948 in a small village outside Shanghai. My earliest memory is the sound of my grandmother singing while she cooked. That song carried me across an ocean...',
    chainHash: '0x7a3f...c2e1', wordCount: 12400, date: '2026-03-10', nOTKEarned: 150,
  },
  {
    id: 'leg2', elderUid: 'uid-elder-002', elderName: 'James Okonkwo',
    title: 'Building Bridges: An Engineer\'s Journey from Lagos to the World',
    previewText: 'When I was twelve, the bridge in our village collapsed during the rains. I watched the engineers rebuild it. That day, I knew what I wanted to do with my life...',
    chainHash: '0x9b1d...f4a8', wordCount: 9800, date: '2026-03-14', nOTKEarned: 120,
  },
];

/* ── tabs config ── */

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'wisdom', label: 'Wisdom', icon: '\u{1F4D6}' },
  { key: 'ask', label: 'Ask', icon: '\u{2753}' },
  { key: 'elders', label: 'Elders', icon: '\u{1F9D3}' },
  { key: 'legacy', label: 'Legacy', icon: '\u{1F3DB}' },
];

export function ElderWisdomScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('wisdom');
  const [selectedCategory, setSelectedCategory] = useState<WisdomCategory | 'all'>('all');
  const [wisdomEntries, setWisdomEntries] = useState(DEMO_WISDOM);
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState<WisdomCategory>('life_lessons');
  const [gratitudeAmount, setGratitudeAmount] = useState('');

  const filteredWisdom = useMemo(() => {
    if (selectedCategory === 'all') return wisdomEntries;
    return wisdomEntries.filter((w) => w.category === selectedCategory);
  }, [wisdomEntries, selectedCategory]);

  const toggleBookmark = useCallback((id: string) => {
    setWisdomEntries((prev) =>
      prev.map((w) => w.id === id ? { ...w, bookmarked: !w.bookmarked } : w),
    );
  }, []);

  const handleAskQuestion = useCallback(() => {
    if (!questionText.trim()) {
      Alert.alert('Question Required', 'Please type your question before submitting.');
      return;
    }
    Alert.alert(
      'Question Submitted',
      'Your question has been shared with community elders. You will be notified when someone responds.',
    );
    setQuestionText('');
  }, [questionText]);

  const handleSendGratitude = useCallback((elderName: string) => {
    const amt = parseFloat(gratitudeAmount);
    if (!gratitudeAmount.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Amount Required', 'Enter a valid nOTK amount to send as gratitude.');
      return;
    }
    Alert.alert(
      'Gratitude Sent',
      `${amt} nOTK sent to ${elderName}. Thank you for honoring their wisdom.`,
    );
    setGratitudeAmount('');
  }, [gratitudeAmount]);

  const handleShareWisdom = useCallback((title: string) => {
    Alert.alert('Shared', `"${title}" has been shared with your community.`);
  }, []);

  const getCategoryLabel = useCallback((cat: WisdomCategory) => {
    return CATEGORIES.find((c) => c.key === cat)?.label ?? cat;
  }, []);

  const getCategoryIcon = useCallback((cat: WisdomCategory) => {
    return CATEGORIES.find((c) => c.key === cat)?.icon ?? '\u{1F4AC}';
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12 },
    sectionSub: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12, lineHeight: 18 },
    // Category filter
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 12 },
    catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
    catChipActive: { backgroundColor: t.accent.purple },
    catLabel: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    catLabelActive: { color: '#fff' },
    // Wisdom cards
    wisdomCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    wisdomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    wisdomCat: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accent.purple + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    wisdomCatText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.semibold },
    wisdomTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 8 },
    wisdomExcerpt: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 6 },
    wisdomElderName: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, fontStyle: 'italic' },
    wisdomFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    wisdomStat: { color: t.text.muted, fontSize: fonts.xs },
    wisdomActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    actionText: { fontSize: fonts.lg },
    nOTKBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    nOTKText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    // Ask section
    askInput: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: t.border },
    askCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    askSubmitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    askSubmitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    questionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    questionText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, lineHeight: 20 },
    questionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    questionAsker: { color: t.text.muted, fontSize: fonts.sm },
    questionStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    questionStatusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    questionAnswers: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6 },
    // Elder profiles
    elderCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    elderName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    elderBio: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 6 },
    elderExpertise: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    expertTag: { backgroundColor: t.accent.purple + '15', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    expertTagText: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.semibold },
    elderStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border },
    elderStatBox: { alignItems: 'center' },
    elderStatVal: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    elderStatLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    gratitudeRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
    gratitudeInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border },
    gratitudeBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
    gratitudeBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    // Legacy stories
    legacyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: t.accent.purple },
    legacyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    legacyElder: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    legacyPreview: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 8, fontStyle: 'italic' },
    legacyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    legacyHash: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'monospace' },
    legacyWords: { color: t.text.muted, fontSize: fonts.xs },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, lineHeight: 22 },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 20, lineHeight: 18 },
  }), [t]);

  /* ── renderers ── */

  const renderWisdomTab = () => (
    <>
      {/* Category filter */}
      <View style={s.catRow}>
        <TouchableOpacity
          style={[s.catChip, selectedCategory === 'all' && s.catChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[s.catLabel, selectedCategory === 'all' && s.catLabelActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.catChip, selectedCategory === cat.key && s.catChipActive]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={s.actionText}>{cat.icon}</Text>
            <Text style={[s.catLabel, selectedCategory === cat.key && s.catLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Wisdom Feed</Text>
        {filteredWisdom.length === 0 ? (
          <Text style={s.emptyText}>No wisdom entries in this category yet.{'\n'}Be the first elder to share.</Text>
        ) : (
          filteredWisdom.map((w) => (
            <View key={w.id} style={s.wisdomCard}>
              <View style={s.wisdomHeader}>
                <View style={s.wisdomCat}>
                  <Text style={{ fontSize: fonts.sm }}>{getCategoryIcon(w.category)}</Text>
                  <Text style={s.wisdomCatText}>{getCategoryLabel(w.category)}</Text>
                </View>
                <View style={s.nOTKBadge}>
                  <Text style={s.nOTKText}>{w.nOTKEarned} nOTK</Text>
                </View>
              </View>
              <Text style={s.wisdomTitle}>{w.title}</Text>
              <Text style={s.wisdomExcerpt}>{w.excerpt}</Text>
              <Text style={s.wisdomElderName}>— {w.elderName}</Text>
              <View style={s.wisdomFooter}>
                <Text style={s.wisdomStat}>{w.likes} inspired  ·  {w.date}</Text>
                <View style={s.wisdomActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => toggleBookmark(w.id)}>
                    <Text style={s.actionText}>{w.bookmarked ? '\u{1F516}' : '\u{1F517}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleShareWisdom(w.title)}>
                    <Text style={s.actionText}>{'\u{1F4E4}'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );

  const renderAskTab = () => (
    <>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Ask an Elder</Text>
        <Text style={s.sectionSub}>
          Submit a question to community elders. Their experience spans decades — let their wisdom guide you.
        </Text>
        <TextInput
          style={s.askInput}
          placeholder="What would you like to ask...?"
          placeholderTextColor={t.text.muted}
          multiline
          value={questionText}
          onChangeText={setQuestionText}
        />
        <View style={s.askCatRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, questionCategory === cat.key && s.catChipActive]}
              onPress={() => setQuestionCategory(cat.key)}
            >
              <Text style={{ fontSize: fonts.sm }}>{cat.icon}</Text>
              <Text style={[s.catLabel, questionCategory === cat.key && s.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.askSubmitBtn} onPress={handleAskQuestion}>
          <Text style={s.askSubmitText}>Submit Question</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Community Questions</Text>
        {DEMO_QUESTIONS.map((q) => (
          <View key={q.id} style={s.questionCard}>
            <View style={s.wisdomCat}>
              <Text style={{ fontSize: fonts.sm }}>{getCategoryIcon(q.category)}</Text>
              <Text style={s.wisdomCatText}>{getCategoryLabel(q.category)}</Text>
            </View>
            <Text style={[s.questionText, { marginTop: 8 }]}>{q.question}</Text>
            <View style={s.questionMeta}>
              <Text style={s.questionAsker}>Asked by {q.askerName}  ·  {q.date}</Text>
              <View style={[s.questionStatus, { backgroundColor: q.status === 'answered' ? t.accent.green + '20' : t.accent.orange + '20' }]}>
                <Text style={[s.questionStatusText, { color: q.status === 'answered' ? t.accent.green : t.accent.orange }]}>
                  {q.status === 'answered' ? 'Answered' : 'Open'}
                </Text>
              </View>
            </View>
            {q.answerCount > 0 && (
              <Text style={s.questionAnswers}>{q.answerCount} elder{q.answerCount !== 1 ? 's' : ''} responded</Text>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const renderEldersTab = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recognized Elders</Text>
      <Text style={s.sectionSub}>
        Community elders who share their wisdom earn nOTK. Send gratitude to those whose advice helped you.
      </Text>
      {DEMO_ELDERS.map((elder) => (
        <View key={elder.uid} style={s.elderCard}>
          <Text style={{ fontSize: fonts.hero, marginBottom: 6 }}>{'\u{1F9D3}'}</Text>
          <Text style={s.elderName}>{elder.name}</Text>
          <Text style={s.elderBio}>{elder.bio}</Text>
          <View style={s.elderExpertise}>
            {elder.expertise.map((exp) => (
              <View key={exp} style={s.expertTag}>
                <Text style={s.expertTagText}>{getCategoryIcon(exp)} {getCategoryLabel(exp)}</Text>
              </View>
            ))}
          </View>
          <View style={s.elderStats}>
            <View style={s.elderStatBox}>
              <Text style={s.elderStatVal}>{elder.wisdomCount}</Text>
              <Text style={s.elderStatLabel}>Wisdom Shared</Text>
            </View>
            <View style={s.elderStatBox}>
              <Text style={s.elderStatVal}>{elder.answersGiven}</Text>
              <Text style={s.elderStatLabel}>Answers</Text>
            </View>
            <View style={s.elderStatBox}>
              <Text style={[s.elderStatVal, { color: t.accent.green }]}>{elder.nOTKEarned}</Text>
              <Text style={s.elderStatLabel}>nOTK Earned</Text>
            </View>
          </View>
          <View style={s.gratitudeRow}>
            <TextInput
              style={s.gratitudeInput}
              placeholder="nOTK amount"
              placeholderTextColor={t.text.muted}
              keyboardType="numeric"
              value={gratitudeAmount}
              onChangeText={setGratitudeAmount}
            />
            <TouchableOpacity style={s.gratitudeBtn} onPress={() => handleSendGratitude(elder.name)}>
              <Text style={s.gratitudeBtnText}>Send Gratitude</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderLegacyTab = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Legacy Stories</Text>
      <Text style={s.sectionSub}>
        Long-form life stories preserved on-chain. Each story is hashed and stored permanently — a digital legacy for future generations.
      </Text>
      {DEMO_LEGACY.map((story) => (
        <View key={story.id} style={s.legacyCard}>
          <Text style={s.legacyTitle}>{story.title}</Text>
          <Text style={s.legacyElder}>by {story.elderName}</Text>
          <Text style={s.legacyPreview}>{story.previewText}</Text>
          <View style={s.legacyMeta}>
            <View>
              <Text style={s.legacyHash}>Chain: {story.chainHash}</Text>
              <Text style={s.legacyWords}>{story.wordCount.toLocaleString()} words  ·  {story.date}</Text>
            </View>
            <View style={s.nOTKBadge}>
              <Text style={s.nOTKText}>{story.nOTKEarned} nOTK</Text>
            </View>
          </View>
        </View>
      ))}
      <Text style={s.note}>
        Legacy stories are hashed and the reference stored on Open Chain.{'\n'}
        The full text is preserved in decentralized storage.{'\n'}
        Elders earn nOTK for preserving their life stories.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Elder Wisdom</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F9D3}'}</Text>
        <Text style={s.heroTitle}>Wisdom of the Elders</Text>
        <Text style={s.heroSub}>
          "Honor those who walked before you. Their wisdom is the foundation upon which you build."
        </Text>
      </View>

      {/* Demo tag */}
      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'wisdom' && renderWisdomTab()}
        {activeTab === 'ask' && renderAskTab()}
        {activeTab === 'elders' && renderEldersTab()}
        {activeTab === 'legacy' && renderLegacyTab()}
      </ScrollView>
    </SafeAreaView>
  );
}
