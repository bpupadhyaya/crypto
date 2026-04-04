import { fonts } from '../utils/theme';
/**
 * Language Exchange Screen — Cross-cultural language learning.
 *
 * Article IX: "Cross-cultural understanding is the bridge to lasting peace.
 *  Language connects people across regions and dissolves barriers."
 * — Human Constitution
 *
 * Features:
 * - Language profile (speak / want to learn)
 * - Find partners matched by complementary language pairs
 * - Conversation sessions log with notes and progress
 * - Phrase of the day with pronunciation guide
 * - Community language events (conversation cafes, story circles, movie nights)
 * - Progress tracking (vocabulary, conversation hours, fluency)
 * - Cultural notes alongside language
 * - Demo: speaks English+Hindi, learning Japanese
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface LanguageProfile {
  speak: string[];
  learning: string[];
  fluencyLevel: Record<string, number>; // 0-100
  vocabLearned: Record<string, number>;
  conversationHours: number;
}

interface Partner {
  id: string;
  name: string;
  speaks: string[];
  learning: string[];
  location: string;
  rating: number;
  sessionsCompleted: number;
  available: boolean;
  bio: string;
}

interface Session {
  id: string;
  partnerId: string;
  partnerName: string;
  language: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  vocabPracticed: number;
}

interface PhraseOfDay {
  phrase: string;
  translation: string;
  pronunciation: string;
  language: string;
  culturalNote: string;
}

interface LanguageEvent {
  id: string;
  title: string;
  type: 'conversation_cafe' | 'story_circle' | 'movie_night' | 'culture_fair' | 'workshop';
  language: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
  registered: boolean;
}

interface CulturalNote {
  id: string;
  language: string;
  title: string;
  content: string;
  category: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_PROFILE: LanguageProfile = {
  speak: ['English', 'Hindi'],
  learning: ['Japanese'],
  fluencyLevel: { Japanese: 28 },
  vocabLearned: { Japanese: 142 },
  conversationHours: 18.5,
};

const DEMO_PARTNERS: Partner[] = [
  { id: 'lp1', name: 'Yuki Tanaka', speaks: ['Japanese', 'English'], learning: ['Hindi'], location: 'Tokyo, Japan', rating: 4.9, sessionsCompleted: 14, available: true, bio: 'Software engineer who loves Bollywood movies. Want to learn Hindi to understand the songs!' },
  { id: 'lp2', name: 'Kenji Nakamura', speaks: ['Japanese'], learning: ['English'], location: 'Osaka, Japan', rating: 4.7, sessionsCompleted: 8, available: true, bio: 'University student studying international business. Looking for English conversation practice.' },
  { id: 'lp3', name: 'Sakura Ito', speaks: ['Japanese', 'French'], learning: ['Hindi', 'English'], location: 'Kyoto, Japan', rating: 5.0, sessionsCompleted: 22, available: false, bio: 'Tea ceremony instructor. Fascinated by Indian culture and philosophy.' },
  { id: 'lp4', name: 'Haruto Yamada', speaks: ['Japanese'], learning: ['English', 'Hindi'], location: 'Nagoya, Japan', rating: 4.6, sessionsCompleted: 5, available: true, bio: 'Manga artist exploring Indian mythology for new series. Keen to learn both languages.' },
  { id: 'lp5', name: 'Aoi Suzuki', speaks: ['Japanese', 'English'], learning: ['Hindi'], location: 'Sapporo, Japan', rating: 4.8, sessionsCompleted: 11, available: true, bio: 'Yoga instructor who visits India yearly. Wants conversational Hindi for travels.' },
];

const DEMO_SESSIONS: Session[] = [
  { id: 's1', partnerId: 'lp1', partnerName: 'Yuki Tanaka', language: 'Japanese', date: '2026-03-30', time: '09:00', durationMinutes: 45, status: 'scheduled', notes: 'Practice greetings and self-introduction', vocabPracticed: 0 },
  { id: 's2', partnerId: 'lp2', partnerName: 'Kenji Nakamura', language: 'English/Japanese', date: '2026-04-02', time: '18:00', durationMinutes: 60, status: 'scheduled', notes: 'Business vocabulary exchange', vocabPracticed: 0 },
  { id: 's3', partnerId: 'lp1', partnerName: 'Yuki Tanaka', language: 'Japanese', date: '2026-03-25', time: '09:00', durationMinutes: 45, status: 'completed', notes: 'Covered numbers 1-100, days of the week. Yuki taught casual vs polite forms.', vocabPracticed: 24 },
  { id: 's4', partnerId: 'lp2', partnerName: 'Kenji Nakamura', language: 'English/Japanese', date: '2026-03-20', time: '18:00', durationMinutes: 60, status: 'completed', notes: 'Practiced ordering food at a restaurant. Learned 15 food-related words in Japanese.', vocabPracticed: 15 },
];

const DEMO_PHRASE: PhraseOfDay = {
  phrase: '\u4e00\u671f\u4e00\u4f1a',
  translation: 'One time, one meeting — treasure every encounter',
  pronunciation: 'Ichi-go ichi-e',
  language: 'Japanese',
  culturalNote: 'Rooted in the Japanese tea ceremony tradition. It reminds us that each meeting with another person is unique and can never be replicated, so we should cherish every moment together.',
};

const DEMO_EVENTS: LanguageEvent[] = [
  { id: 'e1', title: 'Japanese Conversation Cafe', type: 'conversation_cafe', language: 'Japanese', date: '2026-04-01', time: '10:00', location: 'Virtual - Zoom', attendees: 12, maxAttendees: 20, description: 'Casual conversation practice for all levels. Native speakers moderate small groups.', registered: true },
  { id: 'e2', title: 'Hindi Story Circle', type: 'story_circle', language: 'Hindi', date: '2026-04-05', time: '19:00', location: 'Virtual - Zoom', attendees: 8, maxAttendees: 15, description: 'Share and listen to short stories in Hindi. Great for listening comprehension.', registered: false },
  { id: 'e3', title: 'Japanese Movie Night: Spirited Away', type: 'movie_night', language: 'Japanese', date: '2026-04-08', time: '20:00', location: 'Virtual - Watch Party', attendees: 25, maxAttendees: 50, description: 'Watch with Japanese subtitles, discuss vocabulary and cultural themes afterward.', registered: false },
  { id: 'e4', title: 'Multilingual Culture Fair', type: 'culture_fair', language: 'Multiple', date: '2026-04-12', time: '14:00', location: 'Community Center Hall B', attendees: 40, maxAttendees: 100, description: 'Booths for 10+ languages. Food, games, music, and mini-lessons. Bring a dish from your culture!', registered: true },
  { id: 'e5', title: 'Japanese Calligraphy Workshop', type: 'workshop', language: 'Japanese', date: '2026-04-15', time: '11:00', location: 'Virtual - Zoom', attendees: 6, maxAttendees: 12, description: 'Learn basic kanji through brush calligraphy. Materials list provided on registration.', registered: false },
];

const DEMO_CULTURAL_NOTES: CulturalNote[] = [
  { id: 'cn1', language: 'Japanese', title: 'Bowing Etiquette', content: 'In Japan, bowing (ojigi) is essential. A 15-degree bow for casual greetings, 30 degrees for respect, and 45 degrees for deep apology or gratitude. The depth and duration convey meaning.', category: 'Etiquette' },
  { id: 'cn2', language: 'Japanese', title: 'Gift-Giving Culture', content: 'Gifts are given with both hands and received the same way. Never open a gift in front of the giver. Wrapping matters as much as the gift itself. Avoid sets of 4 (shi = death).', category: 'Social' },
  { id: 'cn3', language: 'Japanese', title: 'Honorific Speech Levels', content: 'Japanese has three politeness levels: casual (plain form), polite (desu/masu), and honorific (keigo). Using the wrong level can cause offense. When in doubt, use polite form.', category: 'Language' },
  { id: 'cn4', language: 'Japanese', title: 'Seasonal Awareness', content: 'Japanese culture deeply values seasons (kisetsukan). Greetings, food, clothing, and even business emails reference the current season. Cherry blossom season (hanami) is practically sacred.', category: 'Culture' },
];

const EVENT_TYPE_ICONS: Record<string, string> = {
  conversation_cafe: '\u2615',
  story_circle: '\ud83d\udcd6',
  movie_night: '\ud83c\udfac',
  culture_fair: '\ud83c\udf0d',
  workshop: '\u270d\ufe0f',
};

const FLUENCY_LABELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Int', 'Advanced', 'Fluent'];
const getFluencyLabel = (pct: number) => FLUENCY_LABELS[Math.min(Math.floor(pct / 17), 5)];

type Tab = 'partners' | 'sessions' | 'learn' | 'events';

export function LanguageExchangeScreen({ onClose }: Props) {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [tab, setTab] = useState<Tab>('partners');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners] = useState(DEMO_PARTNERS);
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [events, setEvents] = useState(DEMO_EVENTS);

  // ── Computed ──

  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const q = searchQuery.toLowerCase();
    return partners.filter(
      (p) => p.name.toLowerCase().includes(q) ||
        p.speaks.some((l) => l.toLowerCase().includes(q)) ||
        p.learning.some((l) => l.toLowerCase().includes(q)),
    );
  }, [searchQuery, partners]);

  const upcomingSessions = useMemo(() =>
    sessions.filter((s) => s.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date)),
  [sessions]);

  const completedSessions = useMemo(() =>
    sessions.filter((s) => s.status === 'completed').sort((a, b) => b.date.localeCompare(a.date)),
  [sessions]);

  const sessionStats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed');
    const totalHours = completed.reduce((sum, s) => sum + s.durationMinutes / 60, 0);
    const totalVocab = completed.reduce((sum, s) => sum + s.vocabPracticed, 0);
    return { count: completed.length, hours: totalHours, vocab: totalVocab };
  }, [sessions]);

  // ── Handlers ──

  const handleConnect = useCallback((partner: Partner) => {
    Alert.alert(
      'Connect with ' + partner.name,
      `Send a language exchange request?\n\nThey speak: ${partner.speaks.join(', ')}\nWant to learn: ${partner.learning.join(', ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: () => Alert.alert('Request Sent', `Your request has been sent to ${partner.name}. You'll be notified when they respond.`) },
      ],
    );
  }, []);

  const handleRegisterEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.map((e) =>
      e.id === eventId ? { ...e, registered: !e.registered, attendees: e.registered ? e.attendees - 1 : e.attendees + 1 } : e,
    ));
  }, []);

  // ── Styles ──

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.blue + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18, fontStyle: 'italic' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    // Profile
    profileCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 12 },
    profileRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    profileLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 4 },
    profileValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    langTag: { backgroundColor: t.accent.blue + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginRight: 6, marginTop: 4 },
    langTagText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold },
    learningTag: { backgroundColor: t.accent.green + '20', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginRight: 6, marginTop: 4 },
    learningTagText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold },
    progressRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: t.border },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    fluencyBar: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
    fluencyFill: { height: 8, backgroundColor: t.accent.green, borderRadius: 4 },
    fluencyText: { color: t.text.secondary, fontSize: 12, marginTop: 4 },
    // Partners
    partnerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    partnerName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    partnerLocation: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    partnerBio: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
    partnerLangs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    partnerStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    partnerStat: { color: t.text.secondary, fontSize: 12 },
    availBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    availText: { fontSize: 10, fontWeight: fonts.bold },
    connectBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    connectBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    // Sessions
    sessionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    sessionPartner: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    sessionLang: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    sessionDateTime: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    sessionNotes: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    sessionVocab: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 6 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    // Phrase of the day
    phraseCard: { backgroundColor: t.accent.blue + '08', borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: t.accent.blue + '20' },
    phraseLabel: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    phraseMain: { color: t.text.primary, fontSize: 28, fontWeight: fonts.heavy, marginTop: 12, textAlign: 'center' },
    phraseTranslation: { color: t.text.secondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    phrasePronunciation: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold, marginTop: 12, textAlign: 'center' },
    phraseCulturalNote: { color: t.text.muted, fontSize: 12, marginTop: 16, lineHeight: 18, fontStyle: 'italic', textAlign: 'center' },
    // Cultural notes
    culturalCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    culturalCategory: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },
    culturalTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    culturalContent: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    // Events
    eventCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    eventIcon: { fontSize: 28 },
    eventTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    eventType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    eventDesc: { color: t.text.secondary, fontSize: 13, marginTop: 10, lineHeight: 18 },
    eventMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    eventDate: { color: t.text.muted, fontSize: 12 },
    eventAttendees: { color: t.text.secondary, fontSize: 12 },
    registerBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-end', marginTop: 8 },
    registerBtnText: { fontSize: 13, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
  }), [t]);

  // ─── Render Helpers ───

  const renderProfile = () => (
    <View style={s.profileCard}>
      <View style={s.profileRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.profileLabel}>I speak</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {DEMO_PROFILE.speak.map((lang) => (
              <View key={lang} style={s.langTag}>
                <Text style={s.langTagText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.profileLabel}>Learning</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {DEMO_PROFILE.learning.map((lang) => (
              <View key={lang} style={s.learningTag}>
                <Text style={s.learningTagText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {DEMO_PROFILE.learning.map((lang) => {
        const level = DEMO_PROFILE.fluencyLevel[lang] || 0;
        return (
          <View key={lang}>
            <Text style={s.profileLabel}>{lang} Fluency</Text>
            <View style={s.fluencyBar}>
              <View style={[s.fluencyFill, { width: `${level}%` }]} />
            </View>
            <Text style={s.fluencyText}>{getFluencyLabel(level)} ({level}%)</Text>
          </View>
        );
      })}
      <View style={s.progressRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_PROFILE.vocabLearned.Japanese || 0}</Text>
          <Text style={s.statLabel}>Words Learned</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{DEMO_PROFILE.conversationHours}</Text>
          <Text style={s.statLabel}>Conv. Hours</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessions.filter((ss) => ss.status === 'completed').length}</Text>
          <Text style={s.statLabel}>Sessions</Text>
        </View>
      </View>
    </View>
  );

  const renderPartners = () => (
    <View style={s.section}>
      {renderProfile()}
      <Text style={[s.sectionTitle, { marginTop: 20 }]}>Find Language Partners</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Search by name or language..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {filteredPartners.map((p) => (
        <View key={p.id} style={s.partnerCard}>
          <Text style={s.partnerName}>{p.name}</Text>
          <Text style={s.partnerLocation}>{p.location}</Text>
          <Text style={s.partnerBio}>{p.bio}</Text>
          <View style={s.partnerLangs}>
            {p.speaks.map((l) => (
              <View key={`s-${l}`} style={s.langTag}>
                <Text style={s.langTagText}>Speaks {l}</Text>
              </View>
            ))}
            {p.learning.map((l) => (
              <View key={`l-${l}`} style={s.learningTag}>
                <Text style={s.learningTagText}>Learning {l}</Text>
              </View>
            ))}
          </View>
          <View style={s.partnerStats}>
            <Text style={s.partnerStat}>{'\u2b50'} {p.rating}  |  {p.sessionsCompleted} sessions</Text>
            <View style={[s.availBadge, { backgroundColor: p.available ? t.accent.green + '20' : t.text.muted + '20' }]}>
              <Text style={[s.availText, { color: p.available ? t.accent.green : t.text.muted }]}>
                {p.available ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          {p.available && (
            <TouchableOpacity style={s.connectBtn} onPress={() => handleConnect(p)}>
              <Text style={s.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderSessions = () => (
    <View style={s.section}>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.count}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.hours.toFixed(1)}</Text>
          <Text style={s.statLabel}>Hours</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sessionStats.vocab}</Text>
          <Text style={s.statLabel}>Vocab Practiced</Text>
        </View>
      </View>

      {upcomingSessions.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Upcoming Sessions</Text>
          {upcomingSessions.map((sess) => (
            <View key={sess.id} style={[s.sessionCard, { borderLeftColor: t.accent.blue }]}>
              <Text style={s.sessionPartner}>{sess.partnerName}</Text>
              <Text style={s.sessionLang}>{sess.language}</Text>
              <Text style={s.sessionDateTime}>{sess.date} at {sess.time} ({sess.durationMinutes} min)</Text>
              {sess.notes ? <Text style={s.sessionNotes}>"{sess.notes}"</Text> : null}
            </View>
          ))}
        </>
      )}

      {completedSessions.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Completed Sessions</Text>
          {completedSessions.map((sess) => (
            <View key={sess.id} style={[s.sessionCard, { borderLeftColor: t.accent.green }]}>
              <Text style={s.sessionPartner}>{sess.partnerName}</Text>
              <Text style={s.sessionLang}>{sess.language}</Text>
              <Text style={s.sessionDateTime}>{sess.date} at {sess.time} ({sess.durationMinutes} min)</Text>
              {sess.notes ? <Text style={s.sessionNotes}>"{sess.notes}"</Text> : null}
              {sess.vocabPracticed > 0 && (
                <Text style={s.sessionVocab}>{'\u2705'} {sess.vocabPracticed} words practiced</Text>
              )}
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderLearn = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Phrase of the Day</Text>
      <View style={s.phraseCard}>
        <Text style={s.phraseLabel}>{'\ud83c\udf1f'} {DEMO_PHRASE.language}</Text>
        <Text style={s.phraseMain}>{DEMO_PHRASE.phrase}</Text>
        <Text style={s.phrasePronunciation}>{DEMO_PHRASE.pronunciation}</Text>
        <Text style={s.phraseTranslation}>{DEMO_PHRASE.translation}</Text>
        <Text style={s.phraseCulturalNote}>{DEMO_PHRASE.culturalNote}</Text>
      </View>

      <Text style={s.sectionTitle}>Cultural Notes</Text>
      {DEMO_CULTURAL_NOTES.map((note) => (
        <View key={note.id} style={s.culturalCard}>
          <Text style={s.culturalCategory}>{note.category}</Text>
          <Text style={s.culturalTitle}>{note.title}</Text>
          <Text style={s.culturalContent}>{note.content}</Text>
        </View>
      ))}
    </View>
  );

  const renderEvents = () => (
    <View style={s.section}>
      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <View style={s.eventHeader}>
            <Text style={s.eventIcon}>{EVENT_TYPE_ICONS[ev.type] || '\ud83c\udf10'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.eventTitle}>{ev.title}</Text>
              <Text style={s.eventType}>{ev.type.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={s.eventDesc}>{ev.description}</Text>
          <View style={s.eventMeta}>
            <Text style={s.eventDate}>{ev.date} at {ev.time}</Text>
            <Text style={s.eventAttendees}>{ev.attendees}/{ev.maxAttendees} attending</Text>
          </View>
          <Text style={[s.eventDate, { marginTop: 4 }]}>{'\ud83d\udccd'} {ev.location}</Text>
          <TouchableOpacity
            style={[s.registerBtn, { backgroundColor: ev.registered ? t.accent.green + '20' : t.accent.blue }]}
            onPress={() => handleRegisterEvent(ev.id)}
          >
            <Text style={[s.registerBtnText, { color: ev.registered ? t.accent.green : '#fff' }]}>
              {ev.registered ? '\u2705 Registered' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // ─── Main Render ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'partners', label: 'Partners' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'learn', label: 'Learn' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Language Exchange</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\ud83c\udf0d'}</Text>
        <Text style={s.heroTitle}>Cross-Cultural Language Learning</Text>
        <Text style={s.heroSub}>"Language connects people across regions and dissolves barriers" {'\u2014'} Art. IX</Text>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>Demo Mode</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'partners' && renderPartners()}
        {tab === 'sessions' && renderSessions()}
        {tab === 'learn' && renderLearn()}
        {tab === 'events' && renderEvents()}
      </ScrollView>
    </SafeAreaView>
  );
}
