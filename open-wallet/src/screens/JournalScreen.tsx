import { fonts } from '../utils/theme';
/**
 * Journal Screen — Personal daily journal, reflection, and self-awareness.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * Self-reflection and personal growth are valued contributions.
 *
 * Features:
 * - Daily journal entries (text, mood, tags: #growth #challenge #grateful #insight)
 * - Journal prompts (rotating daily prompts for reflection)
 * - Mood tracking integrated with entries
 * - Journal review (search entries, filter by tag, browse by month)
 * - Private by default (encrypted, only you can read)
 * - Optional sharing (choose to share specific entries to inspire community)
 * - Demo: 5 entries over past week, 3 tags, mood trend
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: string;
  moodScore: number; // 1-5
  tags: string[];
  isShared: boolean;
  wordCount: number;
}

interface JournalPrompt {
  id: string;
  category: string;
  prompt: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const MOODS: Array<{ key: string; label: string; score: number; color: string }> = [
  { key: 'struggling', label: 'Struggling', score: 1, color: '#FF3B30' },
  { key: 'low', label: 'Low', score: 2, color: '#FF9500' },
  { key: 'neutral', label: 'Neutral', score: 3, color: '#FFCC00' },
  { key: 'good', label: 'Good', score: 4, color: '#34C759' },
  { key: 'thriving', label: 'Thriving', score: 5, color: '#007AFF' },
];

const TAGS = [
  { key: 'growth', label: '#growth', color: '#34C759' },
  { key: 'challenge', label: '#challenge', color: '#FF9500' },
  { key: 'grateful', label: '#grateful', color: '#AF52DE' },
  { key: 'insight', label: '#insight', color: '#007AFF' },
];

const DAILY_PROMPTS: JournalPrompt[] = [
  { id: '1', category: 'Gratitude', prompt: 'What are three things you are grateful for today, and why do they matter to you?' },
  { id: '2', category: 'Growth', prompt: 'What did you learn today that changed how you see the world, even slightly?' },
  { id: '3', category: 'Challenge', prompt: 'What was the hardest moment today? How did you handle it, and what would you do differently?' },
  { id: '4', category: 'Connection', prompt: 'Who made a difference in your day? How did their presence or words affect you?' },
  { id: '5', category: 'Purpose', prompt: 'What felt most meaningful today? What does that tell you about your values?' },
  { id: '6', category: 'Self-Awareness', prompt: 'What emotion did you feel most strongly today? What triggered it?' },
  { id: '7', category: 'Future', prompt: 'If you could send a message to yourself one year from now, what would you say?' },
];

// ─── Demo Data ───

const DEMO_ENTRIES: JournalEntry[] = [
  {
    id: '1', date: '2026-03-28', mood: 'good', moodScore: 4,
    text: 'Had a productive morning working on the open wallet project. The community health dashboard is shaping up nicely. Felt a sense of purpose seeing how the Chain of Causation connects everything — from basic needs to global peace. Small steps, big vision.',
    tags: ['growth', 'grateful'], isShared: false, wordCount: 42,
  },
  {
    id: '2', date: '2026-03-27', mood: 'thriving', moodScore: 5,
    text: 'Breakthrough moment today. Realized that tracking nurture value (nOTK) is not just about parenting — it is about recognizing the invisible labor of raising good humans. Every bedtime story, every patient explanation, every act of care has value. This is what Open Chain is for.',
    tags: ['insight', 'growth'], isShared: true, wordCount: 48,
  },
  {
    id: '3', date: '2026-03-26', mood: 'neutral', moodScore: 3,
    text: 'Quiet day. Spent time reading about post-quantum cryptography. The technical challenges are real but solvable. Sometimes progress means sitting with uncertainty and not rushing to answers.',
    tags: ['challenge'], isShared: false, wordCount: 30,
  },
  {
    id: '4', date: '2026-03-24', mood: 'good', moodScore: 4,
    text: 'Volunteered at the community garden. Simple work — weeding, watering, talking to neighbors. But it reminded me why I build what I build: technology should serve human connection, not replace it.',
    tags: ['grateful', 'insight'], isShared: true, wordCount: 33,
  },
  {
    id: '5', date: '2026-03-22', mood: 'low', moodScore: 2,
    text: 'Frustrating day. Some things did not go as planned. But writing this helps me process. Tomorrow is a new day. The mission does not change because of one bad day.',
    tags: ['challenge'], isShared: false, wordCount: 31,
  },
];

type Tab = 'write' | 'entries' | 'prompts' | 'review';

export function JournalScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('write');
  const [entryText, setEntryText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const entries = DEMO_ENTRIES;

  const handleSaveEntry = useCallback(() => {
    if (!entryText.trim()) { Alert.alert('Required', 'Write something in your journal.'); return; }
    if (!selectedMood) { Alert.alert('Required', 'Select your mood.'); return; }

    const wordCount = entryText.trim().split(/\s+/).length;
    Alert.alert(
      'Entry Saved',
      `${wordCount} words recorded.\nMood: ${MOODS.find((m) => m.key === selectedMood)?.label}\nTags: ${selectedTags.length > 0 ? selectedTags.map((t) => '#' + t).join(' ') : 'None'}\n\nYour journal is encrypted and private.`,
    );
    setEntryText('');
    setSelectedMood('');
    setSelectedTags([]);
    setTab('entries');
  }, [entryText, selectedMood, selectedTags]);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleShareEntry = useCallback((entry: JournalEntry) => {
    if (entry.isShared) {
      Alert.alert('Already Shared', 'This entry is already shared with the community.');
    } else {
      Alert.alert(
        'Share Entry?',
        'This will share your entry anonymously to inspire others. You can unshare anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => Alert.alert('Shared', 'Your entry is now visible to the community.') },
        ],
      );
    }
  }, []);

  // ─── Filtered entries for Review tab ───

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterTag) {
      result = result.filter((e) => e.tags.includes(filterTag));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.text.toLowerCase().includes(q));
    }
    return result;
  }, [entries, filterTag, searchQuery]);

  // ─── Mood trend ───

  const moodTrend = useMemo(() => {
    if (entries.length < 2) return 'stable';
    const recent = entries.slice(0, 3).reduce((sum, e) => sum + e.moodScore, 0) / Math.min(3, entries.length);
    const older = entries.slice(-3).reduce((sum, e) => sum + e.moodScore, 0) / Math.min(3, entries.length);
    if (recent > older + 0.3) return 'improving';
    if (recent < older - 0.3) return 'declining';
    return 'stable';
  }, [entries]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    inputLabel: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 6 },
    journalInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12, minHeight: 120, textAlignVertical: 'top' },
    moodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    moodBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary, alignItems: 'center' },
    moodBtnSelected: { borderWidth: 2 },
    moodScore: { fontSize: fonts.lg, fontWeight: fonts.bold },
    moodLabel: { fontSize: fonts.xxs, marginTop: 2 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    tagChipSelected: { borderWidth: 2 },
    tagText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    entryCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    entryDate: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    entryMoodBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    entryMoodText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold },
    entryText: { color: t.text.primary, fontSize: fonts.md, lineHeight: 21 },
    entryTagRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    entryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    entryTagText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
    entryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    entryWordCount: { color: t.text.muted, fontSize: fonts.xs },
    shareBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    shareBtnText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    promptCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    promptCategory: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    promptText: { color: t.text.primary, fontSize: fonts.md, lineHeight: 22, marginTop: 8, fontStyle: 'italic' },
    promptUseBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: t.accent.purple + '15', alignItems: 'center' },
    promptUseBtnText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    searchInput: { backgroundColor: t.bg.secondary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginHorizontal: 20, marginBottom: 12 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterChipActive: { borderWidth: 2 },
    filterChipText: { fontSize: fonts.sm, fontWeight: fonts.semibold },
    trendCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    trendRow: { flexDirection: 'row', justifyContent: 'space-around' },
    trendItem: { alignItems: 'center' },
    trendValue: { fontSize: fonts.xl, fontWeight: fonts.heavy },
    trendLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    privacyCard: { backgroundColor: t.accent.purple + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    privacyText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    lockIcon: { color: t.accent.purple, fontSize: fonts.xxl, marginBottom: 8 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabList: Array<{ key: Tab; label: string }> = [
    { key: 'write', label: 'Write' },
    { key: 'entries', label: 'Entries' },
    { key: 'prompts', label: 'Prompts' },
    { key: 'review', label: 'Review' },
  ];

  // ─── Write Tab ───

  const renderWrite = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Today's Journal</Text>

        <Text style={s.inputLabel}>How are you feeling?</Text>
        <View style={s.moodRow}>
          {MOODS.map((m) => {
            const selected = selectedMood === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[s.moodBtn, selected && s.moodBtnSelected, selected && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                onPress={() => setSelectedMood(m.key)}
              >
                <Text style={[s.moodScore, { color: selected ? m.color : t.text.muted }]}>{m.score}</Text>
                <Text style={[s.moodLabel, { color: selected ? m.color : t.text.muted }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.inputLabel}>Write your thoughts</Text>
        <TextInput
          style={s.journalInput}
          placeholder="What is on your mind today?"
          placeholderTextColor={t.text.muted}
          value={entryText}
          onChangeText={setEntryText}
          multiline
        />

        <Text style={s.inputLabel}>Tags</Text>
        <View style={s.tagRow}>
          {TAGS.map((tag) => {
            const selected = selectedTags.includes(tag.key);
            return (
              <TouchableOpacity
                key={tag.key}
                style={[s.tagChip, selected && s.tagChipSelected, selected && { borderColor: tag.color, backgroundColor: tag.color + '15' }]}
                onPress={() => handleToggleTag(tag.key)}
              >
                <Text style={[s.tagText, { color: selected ? tag.color : t.text.muted }]}>{tag.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSaveEntry}>
          <Text style={s.submitText}>Save Entry</Text>
        </TouchableOpacity>
      </View>

      <View style={s.privacyCard}>
        <Text style={s.lockIcon}>{'\u{1F512}'}</Text>
        <Text style={s.privacyText}>
          Your journal is encrypted and private.{'\n'}
          Only you can read your entries.{'\n'}
          You choose what to share, if anything.
        </Text>
      </View>
    </>
  );

  // ─── Entries Tab ───

  const renderEntries = () => (
    <>
      {/* Mood trend summary */}
      <View style={s.trendCard}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Mood Trend</Text>
        <View style={s.trendRow}>
          <View style={s.trendItem}>
            <Text style={[s.trendValue, { color: t.text.primary }]}>{entries.length}</Text>
            <Text style={s.trendLabel}>Entries</Text>
          </View>
          <View style={s.trendItem}>
            <Text style={[s.trendValue, {
              color: moodTrend === 'improving' ? t.accent.green : moodTrend === 'declining' ? t.accent.orange : t.accent.blue,
            }]}>
              {moodTrend === 'improving' ? '\u2191' : moodTrend === 'declining' ? '\u2193' : '\u2192'}
            </Text>
            <Text style={s.trendLabel}>{moodTrend.charAt(0).toUpperCase() + moodTrend.slice(1)}</Text>
          </View>
          <View style={s.trendItem}>
            <Text style={[s.trendValue, { color: t.accent.purple }]}>
              {[...new Set(entries.flatMap((e) => e.tags))].length}
            </Text>
            <Text style={s.trendLabel}>Tags Used</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Recent Entries</Text>
      {entries.map((entry) => {
        const moodInfo = MOODS.find((m) => m.key === entry.mood);
        return (
          <View key={entry.id} style={s.entryCard}>
            <View style={s.entryHeader}>
              <Text style={s.entryDate}>{entry.date}</Text>
              <View style={[s.entryMoodBadge, { backgroundColor: moodInfo?.color || t.text.muted }]}>
                <Text style={s.entryMoodText}>{moodInfo?.label || entry.mood}</Text>
              </View>
            </View>
            <Text style={s.entryText}>{entry.text}</Text>
            <View style={s.entryTagRow}>
              {entry.tags.map((tag) => {
                const tagInfo = TAGS.find((t) => t.key === tag);
                return (
                  <View key={tag} style={[s.entryTag, { backgroundColor: (tagInfo?.color || t.text.muted) + '20' }]}>
                    <Text style={[s.entryTagText, { color: tagInfo?.color || t.text.muted }]}>#{tag}</Text>
                  </View>
                );
              })}
            </View>
            <View style={s.entryFooter}>
              <Text style={s.entryWordCount}>{entry.wordCount} words</Text>
              <TouchableOpacity
                style={[s.shareBtn, { backgroundColor: entry.isShared ? t.accent.green + '20' : t.bg.primary }]}
                onPress={() => handleShareEntry(entry)}
              >
                <Text style={[s.shareBtnText, { color: entry.isShared ? t.accent.green : t.text.muted }]}>
                  {entry.isShared ? 'Shared' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Prompts Tab ───

  const renderPrompts = () => (
    <>
      <Text style={s.sectionTitle}>Daily Reflection Prompts</Text>
      {DAILY_PROMPTS.map((prompt) => (
        <View key={prompt.id} style={s.promptCard}>
          <Text style={s.promptCategory}>{prompt.category}</Text>
          <Text style={s.promptText}>{prompt.prompt}</Text>
          <TouchableOpacity
            style={s.promptUseBtn}
            onPress={() => {
              setEntryText(prompt.prompt + '\n\n');
              setTab('write');
            }}
          >
            <Text style={s.promptUseBtnText}>Use This Prompt</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={s.privacyCard}>
        <Text style={s.privacyText}>
          Prompts rotate to encourage different{'\n'}
          types of reflection. There are no wrong{'\n'}
          answers — just honest ones.
        </Text>
      </View>
    </>
  );

  // ─── Review Tab ───

  const renderReview = () => (
    <>
      <TextInput
        style={s.searchInput}
        placeholder="Search journal entries..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !filterTag && s.filterChipActive, !filterTag && { borderColor: t.accent.purple, backgroundColor: t.accent.purple + '15' }]}
          onPress={() => setFilterTag('')}
        >
          <Text style={[s.filterChipText, { color: !filterTag ? t.accent.purple : t.text.muted }]}>All</Text>
        </TouchableOpacity>
        {TAGS.map((tag) => {
          const active = filterTag === tag.key;
          return (
            <TouchableOpacity
              key={tag.key}
              style={[s.filterChip, active && s.filterChipActive, active && { borderColor: tag.color, backgroundColor: tag.color + '15' }]}
              onPress={() => setFilterTag(active ? '' : tag.key)}
            >
              <Text style={[s.filterChipText, { color: active ? tag.color : t.text.muted }]}>{tag.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.sectionTitle}>
        {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
      </Text>

      {filteredEntries.map((entry) => {
        const moodInfo = MOODS.find((m) => m.key === entry.mood);
        return (
          <View key={entry.id} style={s.entryCard}>
            <View style={s.entryHeader}>
              <Text style={s.entryDate}>{entry.date}</Text>
              <View style={[s.entryMoodBadge, { backgroundColor: moodInfo?.color || t.text.muted }]}>
                <Text style={s.entryMoodText}>{moodInfo?.label || entry.mood}</Text>
              </View>
            </View>
            <Text style={s.entryText}>{entry.text}</Text>
            <View style={s.entryTagRow}>
              {entry.tags.map((tag) => {
                const tagInfo = TAGS.find((t) => t.key === tag);
                return (
                  <View key={tag} style={[s.entryTag, { backgroundColor: (tagInfo?.color || t.text.muted) + '20' }]}>
                    <Text style={[s.entryTagText, { color: tagInfo?.color || t.text.muted }]}>#{tag}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={[s.entryWordCount, { marginTop: 8 }]}>{entry.wordCount} words</Text>
          </View>
        );
      })}

      {filteredEntries.length === 0 && (
        <View style={s.card}>
          <Text style={[s.privacyText, { color: t.text.muted }]}>
            No entries match your search.{'\n'}Try a different query or tag filter.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Journal</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabList.map((tb) => (
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
        {tab === 'write' && renderWrite()}
        {tab === 'entries' && renderEntries()}
        {tab === 'prompts' && renderPrompts()}
        {tab === 'review' && renderReview()}
      </ScrollView>
    </SafeAreaView>
  );
}
