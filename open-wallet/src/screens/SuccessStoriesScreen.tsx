import { fonts } from '../utils/theme';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

type Tab = 'stories' | 'submit' | 'inspire';

interface Props {
  onClose: () => void;
}

interface Story {
  id: string;
  author: string;
  channel: string;
  title: string;
  excerpt: string;
  otkEarned: number;
  date: string;
  likes: number;
}

const DEMO_STORIES: Story[] = [
  { id: '1', author: 'Maria G.', channel: 'Nurture', title: 'Teaching my daughter financial literacy', excerpt: 'Started using OTK to teach my 12-year-old about value exchange...', otkEarned: 450, date: '2026-03-28', likes: 34 },
  { id: '2', author: 'James K.', channel: 'Eldercare', title: 'Connecting generations through storytelling', excerpt: 'Our local elder circle now meets weekly, sharing wisdom that earns OTK...', otkEarned: 320, date: '2026-03-25', likes: 52 },
  { id: '3', author: 'Aisha R.', channel: 'Education', title: 'Free math tutoring transformed our block', excerpt: 'What started as helping one neighbor kid became a community movement...', otkEarned: 780, date: '2026-03-22', likes: 89 },
  { id: '4', author: 'Carlos M.', channel: 'Community', title: 'Building a tool library from nothing', excerpt: 'We pooled resources and now 40 families share tools instead of buying...', otkEarned: 560, date: '2026-03-20', likes: 67 },
  { id: '5', author: 'Lin W.', channel: 'Peace', title: 'Mediation circle resolved 3 disputes', excerpt: 'Our neighborhood peace circle has become a model for conflict resolution...', otkEarned: 410, date: '2026-03-18', likes: 45 },
];

const INSPIRATION_QUOTES = [
  { id: '1', text: 'Every small act of nurture compounds into world peace.', attribution: 'Open Chain Principle #1' },
  { id: '2', text: 'The value you create for others is the only wealth that matters.', attribution: 'Human Constitution, Article 3' },
  { id: '3', text: 'One human, one vote, one voice — this is true equality.', attribution: 'OTK Consensus Design' },
  { id: '4', text: 'Raise a child well, and you raise the whole world.', attribution: 'Nurture Value Thesis' },
  { id: '5', text: 'Open source is not just code — it is how humanity should operate.', attribution: 'Open Wallet Vision' },
];

export function SuccessStoriesScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [activeTab, setActiveTab] = useState<Tab>('stories');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitBody, setSubmitBody] = useState('');
  const [submitChannel, setSubmitChannel] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: t.bg.primary },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
        headerTitle: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
        closeButton: { padding: 8 },
        closeText: { fontSize: fonts.lg, color: t.accent.green },
        tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.border },
        tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
        activeTab: { borderBottomWidth: 2, borderBottomColor: t.accent.green },
        tabText: { fontSize: fonts.md, color: t.text.secondary },
        activeTabText: { color: t.accent.green, fontWeight: fonts.semibold },
        content: { flex: 1 },
        storyCard: { marginHorizontal: 16, marginTop: 12, padding: 16, backgroundColor: t.bg.card, borderRadius: 12, borderWidth: 1, borderColor: t.border },
        storyChannel: { fontSize: fonts.xs, fontWeight: fonts.semibold, color: t.accent.green, textTransform: 'uppercase', marginBottom: 4 },
        storyTitle: { fontSize: fonts.lg, fontWeight: fonts.bold, color: t.text.primary, marginBottom: 4 },
        storyExcerpt: { fontSize: fonts.sm, color: t.text.secondary, lineHeight: 18, marginBottom: 8 },
        storyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        storyAuthor: { fontSize: fonts.sm, color: t.text.secondary },
        storyStats: { flexDirection: 'row', gap: 12 },
        statText: { fontSize: fonts.sm, color: t.text.secondary },
        otkBadge: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: t.accent.green },
        formContainer: { padding: 16 },
        label: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.primary, marginBottom: 6, marginTop: 16 },
        input: { backgroundColor: t.bg.card, borderRadius: 8, borderWidth: 1, borderColor: t.border, padding: 12, fontSize: fonts.md, color: t.text.primary },
        textArea: { height: 120, textAlignVertical: 'top' },
        submitButton: { marginTop: 24, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
        submitButtonText: { fontSize: fonts.lg, fontWeight: fonts.bold, color: '#FFFFFF' },
        demoNotice: { margin: 16, padding: 12, backgroundColor: t.bg.card, borderRadius: 8, borderWidth: 1, borderColor: t.border },
        demoText: { fontSize: fonts.sm, color: t.text.secondary, textAlign: 'center' },
        quoteCard: { marginHorizontal: 16, marginTop: 16, padding: 20, backgroundColor: t.bg.card, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: t.accent.green },
        quoteText: { fontSize: fonts.lg, fontStyle: 'italic', color: t.text.primary, lineHeight: 24, marginBottom: 8 },
        quoteAttribution: { fontSize: fonts.sm, color: t.text.secondary, textAlign: 'right' },
        sectionHeader: { fontSize: fonts.md, fontWeight: fonts.semibold, color: t.text.secondary, marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
        listFooter: { height: 32 },
      }),
    [t],
  );

  const handleSubmit = useCallback(() => {
    setSubmitTitle('');
    setSubmitBody('');
    setSubmitChannel('');
  }, []);

  const renderStory = useCallback(
    ({ item }: { item: Story }) => (
      <View style={styles.storyCard}>
        <Text style={styles.storyChannel}>{item.channel}</Text>
        <Text style={styles.storyTitle}>{item.title}</Text>
        <Text style={styles.storyExcerpt}>{item.excerpt}</Text>
        <View style={styles.storyMeta}>
          <Text style={styles.storyAuthor}>{item.author} - {item.date}</Text>
          <View style={styles.storyStats}>
            <Text style={styles.otkBadge}>{item.otkEarned} OTK</Text>
            <Text style={styles.statText}>{item.likes} likes</Text>
          </View>
        </View>
      </View>
    ),
    [styles],
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'stories':
        return (
          <FlatList
            data={demoMode ? DEMO_STORIES : []}
            keyExtractor={(item) => item.id}
            renderItem={renderStory}
            ListHeaderComponent={
              demoMode ? (
                <View style={styles.demoNotice}>
                  <Text style={styles.demoText}>Demo mode - showing sample success stories</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.demoNotice}>
                <Text style={styles.demoText}>No stories yet. Be the first to share!</Text>
              </View>
            }
            ListFooterComponent={<View style={styles.listFooter} />}
          />
        );

      case 'submit':
        return (
          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Story Title</Text>
            <TextInput style={styles.input} value={submitTitle} onChangeText={setSubmitTitle} placeholder="What did you accomplish?" placeholderTextColor={t.text.secondary} />
            <Text style={styles.label}>OTK Channel</Text>
            <TextInput style={styles.input} value={submitChannel} onChangeText={setSubmitChannel} placeholder="e.g. Nurture, Education, Community" placeholderTextColor={t.text.secondary} />
            <Text style={styles.label}>Your Story</Text>
            <TextInput style={[styles.input, styles.textArea]} value={submitBody} onChangeText={setSubmitBody} placeholder="Share how OTK helped you make a difference..." placeholderTextColor={t.text.secondary} multiline />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Story</Text>
            </TouchableOpacity>
            <View style={styles.listFooter} />
          </ScrollView>
        );

      case 'inspire':
        return (
          <ScrollView>
            <Text style={styles.sectionHeader}>Principles to Live By</Text>
            {INSPIRATION_QUOTES.map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <Text style={styles.quoteAttribution}>- {quote.attribution}</Text>
              </View>
            ))}
            <View style={styles.listFooter} />
          </ScrollView>
        );
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stories', label: 'Stories' },
    { key: 'submit', label: 'Submit' },
    { key: 'inspire', label: 'Inspire' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Success Stories</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}
