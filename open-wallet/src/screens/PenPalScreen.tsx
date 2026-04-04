import { fonts } from '../utils/theme';
/**
 * Pen Pal Screen — Cross-cultural pen pals, international friendships.
 *
 * Article X: "Every human connection across borders strengthens the
 *  fabric of global peace."
 * — Human Constitution
 *
 * Features:
 * - Find pen pals (matched by age group, interests, languages, regions)
 * - Exchange letters (encrypted on-chain messages, longer-form than messaging)
 * - Cultural exchange topics (daily life, food, traditions, nature, dreams)
 * - Pen pal stats (letters exchanged, countries connected, friendships formed)
 * - Safety guidelines (no personal info sharing, guardian approval for minors)
 * - Demo: 2 active pen pals, 3 letters exchanged, match suggestions
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface PenPal {
  id: string;
  name: string;
  region: string;
  country: string;
  languages: string[];
  interests: string[];
  ageGroup: string;
  lettersExchanged: number;
  since: string;
  lastLetter: string;
}

interface Letter {
  id: string;
  fromPalId: string;
  fromName: string;
  topic: string;
  preview: string;
  date: string;
  read: boolean;
  encrypted: boolean;
}

interface MatchSuggestion {
  id: string;
  name: string;
  region: string;
  country: string;
  languages: string[];
  interests: string[];
  ageGroup: string;
  matchScore: number; // 0-100
  reason: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CULTURAL_TOPICS = [
  { key: 'daily_life', label: 'Daily Life', icon: 'D' },
  { key: 'food', label: 'Food & Cuisine', icon: 'F' },
  { key: 'traditions', label: 'Traditions', icon: 'T' },
  { key: 'nature', label: 'Nature', icon: 'N' },
  { key: 'dreams', label: 'Dreams & Goals', icon: 'G' },
  { key: 'music', label: 'Music & Art', icon: 'M' },
];

const AGE_GROUPS = [
  { key: '8-12', label: '8-12' },
  { key: '13-17', label: '13-17' },
  { key: '18-25', label: '18-25' },
  { key: '26-40', label: '26-40' },
  { key: '41+', label: '41+' },
];

const SAFETY_GUIDELINES = [
  { title: 'No Personal Info', desc: 'Never share your real name, address, phone number, or school/workplace.' },
  { title: 'Guardian Approval', desc: 'Users under 18 must have guardian approval. Guardians can review all letters.' },
  { title: 'Encrypted Letters', desc: 'All letters are end-to-end encrypted on-chain. Only you and your pen pal can read them.' },
  { title: 'Report Concerns', desc: 'If anything makes you uncomfortable, use the report button. Community moderators review within 24 hours.' },
  { title: 'No Meeting IRL', desc: 'Pen pals are for letter exchange only. Never arrange to meet someone in person.' },
  { title: 'Respectful Exchange', desc: 'Be kind, curious, and respectful of cultural differences. This is about learning and friendship.' },
];

// ─── Demo Data ───

const DEMO_PALS: PenPal[] = [
  {
    id: 'pal1',
    name: 'Yuki',
    region: 'East Asia',
    country: 'Japan',
    languages: ['Japanese', 'English'],
    interests: ['nature', 'food', 'traditions'],
    ageGroup: '18-25',
    lettersExchanged: 2,
    since: '2026-02-15',
    lastLetter: '2026-03-25',
  },
  {
    id: 'pal2',
    name: 'Amara',
    region: 'West Africa',
    country: 'Ghana',
    languages: ['Twi', 'English'],
    interests: ['music', 'daily_life', 'dreams'],
    ageGroup: '18-25',
    lettersExchanged: 1,
    since: '2026-03-10',
    lastLetter: '2026-03-22',
  },
];

const DEMO_LETTERS: Letter[] = [
  { id: 'l1', fromPalId: 'pal1', fromName: 'Yuki', topic: 'Spring in Japan', preview: 'The cherry blossoms just started blooming in our neighborhood. Every year my family walks along the river to see them...', date: '2026-03-25', read: true, encrypted: true },
  { id: 'l2', fromPalId: 'pal2', fromName: 'Amara', topic: 'Music in Accra', preview: 'Let me tell you about highlife music! It started in the 1920s and mixes traditional Akan music with Western instruments...', date: '2026-03-22', read: true, encrypted: true },
  { id: 'l3', fromPalId: 'pal1', fromName: 'Yuki', topic: 'Daily Life', preview: 'A typical day for me starts with rice and miso soup for breakfast. Then I take the train to university...', date: '2026-03-12', read: true, encrypted: true },
];

const DEMO_MATCHES: MatchSuggestion[] = [
  { id: 'm1', name: 'Lars', region: 'Northern Europe', country: 'Norway', languages: ['Norwegian', 'English'], interests: ['nature', 'daily_life'], ageGroup: '18-25', matchScore: 92, reason: 'Shared interest in nature and similar age group' },
  { id: 'm2', name: 'Priya', region: 'South Asia', country: 'India', languages: ['Hindi', 'English', 'Tamil'], interests: ['food', 'traditions', 'dreams'], ageGroup: '18-25', matchScore: 87, reason: 'Cultural exchange enthusiast, loves sharing food traditions' },
  { id: 'm3', name: 'Sofia', region: 'South America', country: 'Argentina', languages: ['Spanish', 'English'], interests: ['music', 'dreams', 'daily_life'], ageGroup: '26-40', matchScore: 78, reason: 'Passionate about cross-cultural music and goal sharing' },
  { id: 'm4', name: 'Kofi', region: 'West Africa', country: 'Senegal', languages: ['Wolof', 'French', 'English'], interests: ['traditions', 'nature', 'food'], ageGroup: '18-25', matchScore: 74, reason: 'Interested in sharing West African traditions and local cuisine' },
];

type Tab = 'pals' | 'write' | 'match' | 'safety';

export function PenPalScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('pals');
  const [selectedPal, setSelectedPal] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const pals = DEMO_PALS;
  const letters = DEMO_LETTERS;
  const matches = DEMO_MATCHES;

  const palStats = useMemo(() => ({
    totalPals: pals.length,
    totalLetters: letters.length,
    countriesConnected: new Set(pals.map(p => p.country)).size,
  }), [pals, letters]);

  const handleSendLetter = useCallback(() => {
    if (!selectedPal) { Alert.alert('Required', 'Select a pen pal to write to.'); return; }
    if (!selectedTopic) { Alert.alert('Required', 'Choose a cultural exchange topic.'); return; }
    if (!letterBody.trim() || letterBody.trim().length < 50) {
      Alert.alert('Too Short', 'Letters should be at least 50 characters. Take your time to share something meaningful!');
      return;
    }

    const palName = pals.find(p => p.id === selectedPal)?.name || 'your pen pal';
    Alert.alert(
      'Letter Sent',
      `Your letter about "${CULTURAL_TOPICS.find(ct => ct.key === selectedTopic)?.label}" has been encrypted and sent to ${palName}.\n\nOn-chain delivery ensures it arrives safely.`,
    );
    setSelectedPal('');
    setSelectedTopic('');
    setLetterBody('');
    setTab('pals');
  }, [selectedPal, selectedTopic, letterBody, pals]);

  const handleRequestMatch = useCallback((match: MatchSuggestion) => {
    Alert.alert(
      'Pen Pal Request Sent',
      `A connection request has been sent to ${match.name} in ${match.country}.\n\nThey will receive your request and can choose to accept. You'll be notified when they respond.`,
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
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Stats hero
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' as const },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' as const },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' as const, marginTop: 4, lineHeight: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, width: '100%' as any },
    statItem: { alignItems: 'center' as const },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: 1 },
    // Pal cards
    palCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    palName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    palInfo: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    palLanguages: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    palInterests: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    palMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.bg.primary },
    palMetaText: { color: t.text.muted, fontSize: fonts.xs },
    // Letters
    letterCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    letterFrom: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.bold },
    letterTopic: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    letterPreview: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 20 },
    letterDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 8 },
    letterEncrypted: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    // Full letter view
    fullLetterCard: { backgroundColor: t.bg.secondary, borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16 },
    fullLetterBody: { color: t.text.primary, fontSize: fonts.md, lineHeight: 24, marginTop: 12 },
    backBtn: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold, marginLeft: 20, marginBottom: 12 },
    // Write tab
    writeSection: { marginTop: 8 },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 1 },
    palSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    palChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.primary },
    palChipActive: { backgroundColor: t.accent.blue },
    palChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    palChipTextActive: { color: '#fff' },
    topicRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    topicChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.bg.primary, flexDirection: 'row', alignItems: 'center', gap: 4 },
    topicChipActive: { backgroundColor: t.accent.blue },
    topicIcon: { color: t.text.muted, fontSize: fonts.md, fontWeight: fonts.bold },
    topicIconActive: { color: '#fff' },
    topicLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    topicLabelActive: { color: '#fff' },
    letterInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 180, textAlignVertical: 'top' as const },
    charCount: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'right' as const, marginTop: 4 },
    sendBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center' as const, marginHorizontal: 20, marginTop: 8 },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    // Match tab
    matchCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    matchName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    matchScore: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.heavy },
    matchRegion: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    matchLanguages: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    matchInterests: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    matchReason: { color: t.text.muted, fontSize: fonts.sm, fontStyle: 'italic', marginTop: 8 },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 10, alignItems: 'center' as const, marginTop: 12 },
    connectBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Safety tab
    safetyCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    safetyTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    safetyDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4, lineHeight: 20 },
    safetyHero: { backgroundColor: '#FF3B30' + '12', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' as const },
    safetyHeroTitle: { color: '#FF3B30', fontSize: fonts.lg, fontWeight: fonts.heavy, marginTop: 8 },
    safetyHeroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' as const, marginTop: 4, lineHeight: 20 },
    demoTag: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center' as const, marginBottom: 8 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center' as const, paddingVertical: 40 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'pals', label: 'My Pals' },
    { key: 'write', label: 'Write' },
    { key: 'match', label: 'Find Pals' },
    { key: 'safety', label: 'Safety' },
  ];

  // ─── Render: Pals Tab ───

  const renderPalsTab = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'W'}</Text>
        <Text style={s.heroTitle}>Cross-Cultural Pen Pals</Text>
        <Text style={s.heroSubtitle}>
          Build international friendships through encrypted{'\n'}on-chain letter exchange
        </Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{palStats.totalPals}</Text>
            <Text style={s.statLabel}>Pen Pals</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{palStats.totalLetters}</Text>
            <Text style={s.statLabel}>Letters</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{palStats.countriesConnected}</Text>
            <Text style={s.statLabel}>Countries</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Active Pen Pals</Text>
      {pals.map(pal => (
        <View key={pal.id} style={s.palCard}>
          <Text style={s.palName}>{pal.name}</Text>
          <Text style={s.palInfo}>{pal.country}, {pal.region} -- {pal.ageGroup}</Text>
          <Text style={s.palLanguages}>Languages: {pal.languages.join(', ')}</Text>
          <Text style={s.palInterests}>Interests: {pal.interests.map(i => CULTURAL_TOPICS.find(ct => ct.key === i)?.label || i).join(', ')}</Text>
          <View style={s.palMeta}>
            <Text style={s.palMetaText}>{pal.lettersExchanged} letters exchanged</Text>
            <Text style={s.palMetaText}>Since {pal.since}</Text>
          </View>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Recent Letters</Text>
      {selectedLetter ? (
        <>
          <TouchableOpacity onPress={() => setSelectedLetter(null)}>
            <Text style={s.backBtn}>{'< Back to letters'}</Text>
          </TouchableOpacity>
          <View style={s.fullLetterCard}>
            <Text style={s.letterFrom}>From {selectedLetter.fromName}</Text>
            <Text style={s.letterTopic}>{selectedLetter.topic}</Text>
            <Text style={s.fullLetterBody}>{selectedLetter.preview}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={s.letterDate}>{selectedLetter.date}</Text>
              {selectedLetter.encrypted && <Text style={s.letterEncrypted}>End-to-end encrypted</Text>}
            </View>
          </View>
        </>
      ) : (
        letters.map(letter => (
          <TouchableOpacity key={letter.id} style={s.letterCard} onPress={() => setSelectedLetter(letter)}>
            <Text style={s.letterFrom}>From {letter.fromName}</Text>
            <Text style={s.letterTopic}>{letter.topic}</Text>
            <Text style={s.letterPreview} numberOfLines={2}>{letter.preview}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={s.letterDate}>{letter.date}</Text>
              {letter.encrypted && <Text style={s.letterEncrypted}>Encrypted</Text>}
            </View>
          </TouchableOpacity>
        ))
      )}
    </>
  );

  // ─── Render: Write Tab ───

  const renderWriteTab = () => (
    <View style={s.writeSection}>
      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Write To</Text>
        <View style={s.palSelector}>
          {pals.map(pal => (
            <TouchableOpacity
              key={pal.id}
              style={[s.palChip, selectedPal === pal.id && s.palChipActive]}
              onPress={() => setSelectedPal(pal.id)}
            >
              <Text style={[s.palChipText, selectedPal === pal.id && s.palChipTextActive]}>
                {pal.name} ({pal.country})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Cultural Topic</Text>
        <View style={s.topicRow}>
          {CULTURAL_TOPICS.map(topic => (
            <TouchableOpacity
              key={topic.key}
              style={[s.topicChip, selectedTopic === topic.key && s.topicChipActive]}
              onPress={() => setSelectedTopic(topic.key)}
            >
              <Text style={[s.topicIcon, selectedTopic === topic.key && s.topicIconActive]}>{topic.icon}</Text>
              <Text style={[s.topicLabel, selectedTopic === topic.key && s.topicLabelActive]}>{topic.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Your Letter</Text>
        <TextInput
          style={s.letterInput}
          value={letterBody}
          onChangeText={setLetterBody}
          placeholder="Share something about your culture, daily life, or what you're curious about..."
          placeholderTextColor={t.text.muted}
          multiline
        />
        <Text style={s.charCount}>{letterBody.length} characters (min 50)</Text>
      </View>

      <TouchableOpacity
        style={[s.sendBtn, (!selectedPal || !selectedTopic || letterBody.length < 50) && s.sendBtnDisabled]}
        onPress={handleSendLetter}
      >
        <Text style={s.sendBtnText}>Send Encrypted Letter</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render: Match Tab ───

  const renderMatchTab = () => (
    <>
      <Text style={s.sectionTitle}>Suggested Pen Pals</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Matched by age group, interests, languages, and regions
      </Text>
      {matches.map(match => (
        <View key={match.id} style={s.matchCard}>
          <View style={s.matchHeader}>
            <Text style={s.matchName}>{match.name}</Text>
            <Text style={s.matchScore}>{match.matchScore}% match</Text>
          </View>
          <Text style={s.matchRegion}>{match.country}, {match.region} -- {match.ageGroup}</Text>
          <Text style={s.matchLanguages}>Languages: {match.languages.join(', ')}</Text>
          <Text style={s.matchInterests}>
            Interests: {match.interests.map(i => CULTURAL_TOPICS.find(ct => ct.key === i)?.label || i).join(', ')}
          </Text>
          <Text style={s.matchReason}>{match.reason}</Text>
          <TouchableOpacity style={s.connectBtn} onPress={() => handleRequestMatch(match)}>
            <Text style={s.connectBtnText}>Send Pen Pal Request</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Render: Safety Tab ───

  const renderSafetyTab = () => (
    <>
      <View style={s.safetyHero}>
        <Text style={{ fontSize: fonts.hero }}>!</Text>
        <Text style={s.safetyHeroTitle}>Safety First</Text>
        <Text style={s.safetyHeroSubtitle}>
          Pen pals are about cultural exchange and learning.{'\n'}Follow these guidelines to stay safe.
        </Text>
      </View>

      {SAFETY_GUIDELINES.map((guideline, idx) => (
        <View key={idx} style={s.safetyCard}>
          <Text style={s.safetyTitle}>{guideline.title}</Text>
          <Text style={s.safetyDesc}>{guideline.desc}</Text>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Pen Pals</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => { setTab(t.key); setSelectedLetter(null); }}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {demoMode && <Text style={s.demoTag}>DEMO MODE</Text>}

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'pals' && renderPalsTab()}
        {tab === 'write' && renderWriteTab()}
        {tab === 'match' && renderMatchTab()}
        {tab === 'safety' && renderSafetyTab()}
      </ScrollView>
    </SafeAreaView>
  );
}
