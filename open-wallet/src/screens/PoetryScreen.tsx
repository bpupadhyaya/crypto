import { fonts } from '../utils/theme';
/**
 * Poetry Screen — Community poetry, spoken word, literary expression.
 *
 * Art I: "Words shape worlds. Poetry is the heartbeat of a community
 *  that dares to feel deeply and speak truthfully."
 * — Human Constitution, Article V, Section 3
 *
 * Features:
 * - Poetry feed — poems shared by community (title, poet, text, style)
 * - Open mic events (spoken word nights, poetry slams)
 * - Submit poem (title, text, style: free verse, haiku, sonnet, spoken word, other)
 * - Poetry circles (small groups meeting to write and share)
 * - Poet of the week (featured community poet)
 * - Appreciation — send OTK to poets
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Poem {
  id: string;
  title: string;
  poet: string;
  poetUID: string;
  text: string;
  style: string;
  likes: number;
  otkReceived: number;
  date: string;
}

interface OpenMicEvent {
  id: string;
  title: string;
  type: 'spoken_word' | 'poetry_slam' | 'open_mic';
  location: string;
  date: string;
  performers: number;
  maxPerformers: number;
  organizer: string;
  otkPrizePool: number;
}

interface FeaturedPoet {
  name: string;
  uid: string;
  poemsShared: number;
  otkReceived: number;
  favoriteStyle: string;
  bio: string;
}

interface PoetryCircle {
  id: string;
  name: string;
  focus: string;
  members: number;
  meetingDay: string;
  meetingTime: string;
  location: string;
  organizer: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const STYLES = [
  { key: 'free_verse', label: 'Free Verse' },
  { key: 'haiku', label: 'Haiku' },
  { key: 'sonnet', label: 'Sonnet' },
  { key: 'spoken_word', label: 'Spoken Word' },
  { key: 'other', label: 'Other' },
];

// ─── Demo Data ───

const DEMO_POEMS: Poem[] = [
  {
    id: 'pm1', title: 'The Weight of Kindness', poet: 'Amara Osei', poetUID: 'openchain1abc...poet_amara',
    text: 'It costs nothing to hold a door,\nto smile at the stranger on floor four,\nto say "I see you" without a word —\nthe quietest revolution ever heard.',
    style: 'free_verse', likes: 58, otkReceived: 1100, date: '2026-03-28',
  },
  {
    id: 'pm2', title: 'Spring Returns', poet: 'Hiro Nakamura', poetUID: 'openchain1def...poet_hiro',
    text: 'Cherry blossoms fall\nChildren laugh beneath the rain\nNew roots find their way',
    style: 'haiku', likes: 43, otkReceived: 780, date: '2026-03-27',
  },
  {
    id: 'pm3', title: 'Brick by Brick', poet: 'Elena Voss', poetUID: 'openchain1ghi...poet_elena',
    text: 'They said the wall was permanent,\nbut we came with questions instead of hammers,\nand the mortar turned to conversation,\nand the stones became stepping stones,\nand what was once a barrier\nbecame a bridge we built together,\nbrick by stubborn brick.',
    style: 'spoken_word', likes: 72, otkReceived: 1450, date: '2026-03-26',
  },
  {
    id: 'pm4', title: 'To My Grandmother\'s Hands', poet: 'Raj Mehta', poetUID: 'openchain1jkl...poet_raj',
    text: 'Your hands knew the language of flour and water,\nof soil and seedlings and sleeping children.\nEvery crease a chapter, every callus a prayer.\nI write these words with fingers you shaped —\nstill reaching for the warmth you left behind.',
    style: 'free_verse', likes: 91, otkReceived: 1820, date: '2026-03-25',
  },
];

const DEMO_EVENTS: OpenMicEvent[] = [
  { id: 'ev1', title: 'First Friday Spoken Word', type: 'spoken_word', location: 'Community Arts Center', date: '2026-04-04', performers: 8, maxPerformers: 15, organizer: 'Elena Voss', otkPrizePool: 3000 },
  { id: 'ev2', title: 'Spring Poetry Slam', type: 'poetry_slam', location: 'Riverside Amphitheater', date: '2026-04-12', performers: 5, maxPerformers: 20, organizer: 'Amara Osei', otkPrizePool: 5000 },
];

const DEMO_FEATURED: FeaturedPoet = {
  name: 'Raj Mehta', uid: 'openchain1jkl...poet_raj', poemsShared: 27, otkReceived: 8400, favoriteStyle: 'free_verse',
  bio: 'Raj writes about family, memory, and the quiet acts of love that hold communities together. His grandmother series has become a beloved fixture of our poetry feed.',
};

const DEMO_CIRCLE: PoetryCircle = {
  id: 'pc1', name: 'The Ink Well', focus: 'Writing and sharing new work in a supportive circle', members: 9, meetingDay: 'Wednesday', meetingTime: '7:00 PM', location: 'Public Library, Room B', organizer: 'Hiro Nakamura',
};

type Tab = 'feed' | 'events' | 'write' | 'circles';

const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'events', label: 'Events' },
  { key: 'write', label: 'Write' },
  { key: 'circles', label: 'Circles' },
];

export function PoetryScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('feed');
  const [writeTitle, setWriteTitle] = useState('');
  const [writeText, setWriteText] = useState('');
  const [writeStyle, setWriteStyle] = useState('');
  const [appreciateId, setAppreciateId] = useState<string | null>(null);
  const [appreciateAmount, setAppreciateAmount] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const poems = DEMO_POEMS;
  const events = DEMO_EVENTS;
  const featured = DEMO_FEATURED;
  const circle = DEMO_CIRCLE;

  const handleSubmitPoem = useCallback(() => {
    if (!writeTitle.trim()) { Alert.alert('Required', 'Enter a title for your poem.'); return; }
    if (!writeText.trim()) { Alert.alert('Required', 'Write your poem.'); return; }
    if (!writeStyle) { Alert.alert('Required', 'Select a style.'); return; }

    Alert.alert(
      'Poem Shared',
      `"${writeTitle}" has been shared with the community.\nStyle: ${writeStyle}`,
    );
    setWriteTitle('');
    setWriteText('');
    setWriteStyle('');
    setTab('feed');
  }, [writeTitle, writeText, writeStyle]);

  const handleAppreciate = useCallback((poemId: string, poet: string) => {
    if (appreciateId === poemId && appreciateAmount) {
      const amount = parseFloat(appreciateAmount);
      if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid OTK amount.'); return; }
      Alert.alert('Appreciation Sent', `${amount} OTK sent to ${poet} for their poem.`);
      setAppreciateId(null);
      setAppreciateAmount('');
    } else {
      setAppreciateId(poemId);
      setAppreciateAmount('');
    }
  }, [appreciateId, appreciateAmount]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.purple + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.purple },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    poemCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12 },
    poemTitle: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold, fontStyle: 'italic' },
    poemMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    poemText: { color: t.text.secondary, fontSize: 14, marginTop: 12, lineHeight: 22, fontStyle: 'italic' },
    poemStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    statText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    appreciateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    appreciateInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: 14 },
    appreciateBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
    appreciateBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    featuredCard: { backgroundColor: t.accent.orange + '12', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    featuredLabel: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.heavy, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    featuredName: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    featuredBio: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    featuredStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.accent.orange + '20' },
    featuredStatValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    featuredStatLabel: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    eventType: { color: t.accent.purple, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    eventMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    eventParticipants: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 6 },
    eventPrize: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    poemInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 160, textAlignVertical: 'top' },
    styleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    styleChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.primary },
    styleChipActive: { backgroundColor: t.accent.purple },
    styleLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    styleLabelActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    circleCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    circleName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    circleFocus: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
    circleMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    circleMembers: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  // ─── Feed Tab ───
  const renderFeed = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'📝'}</Text>
        <Text style={s.heroTitle}>Poetry Feed</Text>
        <Text style={s.heroSubtitle}>
          Words from the heart of our community.{'\n'}Read, feel, and appreciate.
        </Text>
      </View>

      <View style={s.featuredCard}>
        <Text style={s.featuredLabel}>Poet of the Week</Text>
        <Text style={s.featuredName}>{featured.name}</Text>
        <Text style={s.featuredBio}>{featured.bio}</Text>
        <View style={s.featuredStats}>
          <View>
            <Text style={s.featuredStatValue}>{featured.poemsShared}</Text>
            <Text style={s.featuredStatLabel}>Poems</Text>
          </View>
          <View>
            <Text style={s.featuredStatValue}>{featured.otkReceived.toLocaleString()}</Text>
            <Text style={s.featuredStatLabel}>OTK Received</Text>
          </View>
          <View>
            <Text style={s.featuredStatValue}>{featured.favoriteStyle.replace('_', ' ')}</Text>
            <Text style={s.featuredStatLabel}>Style</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>{poems.length} Recent Poems</Text>
      {poems.map((poem) => (
        <View key={poem.id} style={s.poemCard}>
          <Text style={s.poemTitle}>{poem.title}</Text>
          <Text style={s.poemMeta}>by {poem.poet}  ·  {poem.style.replace('_', ' ')}  ·  {poem.date}</Text>
          <Text style={s.poemText}>{poem.text}</Text>
          <View style={s.poemStats}>
            <Text style={s.statText}>{poem.likes} likes</Text>
            <Text style={s.statText}>{poem.otkReceived} OTK received</Text>
          </View>
          <View style={s.appreciateRow}>
            {appreciateId === poem.id ? (
              <>
                <TextInput
                  style={s.appreciateInput}
                  placeholder="OTK amount"
                  placeholderTextColor={t.text.muted}
                  keyboardType="numeric"
                  value={appreciateAmount}
                  onChangeText={setAppreciateAmount}
                />
                <TouchableOpacity style={s.appreciateBtn} onPress={() => handleAppreciate(poem.id, poem.poet)}>
                  <Text style={s.appreciateBtnText}>Send</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.appreciateBtn} onPress={() => handleAppreciate(poem.id, poem.poet)}>
                <Text style={s.appreciateBtnText}>Appreciate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Events Tab ───
  const renderEvents = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'🎤'}</Text>
        <Text style={s.heroTitle}>Open Mic & Slams</Text>
        <Text style={s.heroSubtitle}>
          Spoken word nights and poetry slams.{'\n'}Step up, speak out, be heard.
        </Text>
      </View>
      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{ev.title}</Text>
          <Text style={s.eventType}>{ev.type.replace('_', ' ')}</Text>
          <Text style={s.eventMeta}>{ev.location}  ·  {ev.date}</Text>
          <Text style={s.eventMeta}>Organized by {ev.organizer}</Text>
          <Text style={s.eventParticipants}>{ev.performers}/{ev.maxPerformers} performer slots filled</Text>
          <Text style={s.eventPrize}>{ev.otkPrizePool} OTK prize pool</Text>
          <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Signed Up', `You signed up to perform at "${ev.title}".`)}>
            <Text style={s.joinBtnText}>Sign Up to Perform</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Write Tab ───
  const renderWrite = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'✍️'}</Text>
        <Text style={s.heroTitle}>Share Your Poetry</Text>
        <Text style={s.heroSubtitle}>
          Write from the heart and share with the community.{'\n'}Earn OTK when others appreciate your words.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Title</Text>
        <TextInput
          style={s.input}
          placeholder="Poem title"
          placeholderTextColor={t.text.muted}
          value={writeTitle}
          onChangeText={setWriteTitle}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Your Poem</Text>
        <TextInput
          style={s.poemInput}
          placeholder="Let the words flow..."
          placeholderTextColor={t.text.muted}
          multiline
          value={writeText}
          onChangeText={setWriteText}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Style</Text>
        <View style={s.styleRow}>
          {STYLES.map((st) => (
            <TouchableOpacity
              key={st.key}
              style={[s.styleChip, writeStyle === st.key && s.styleChipActive]}
              onPress={() => setWriteStyle(st.key)}
            >
              <Text style={[s.styleLabel, writeStyle === st.key && s.styleLabelActive]}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitPoem}>
        <Text style={s.submitBtnText}>Share Poem</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        Your poem will appear in the community feed.{'\n'}
        Other members can send OTK to show appreciation for your words.
      </Text>
    </>
  );

  // ─── Circles Tab ───
  const renderCircles = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'🔮'}</Text>
        <Text style={s.heroTitle}>Poetry Circles</Text>
        <Text style={s.heroSubtitle}>
          Small groups gathering to write and share.{'\n'}Find your voice among kindred spirits.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Active Circles</Text>
      <View style={s.circleCard}>
        <Text style={s.circleName}>{circle.name}</Text>
        <Text style={s.circleFocus}>{circle.focus}</Text>
        <Text style={s.circleMeta}>{circle.meetingDay}s at {circle.meetingTime}  ·  {circle.location}</Text>
        <Text style={s.circleMeta}>Organized by {circle.organizer}</Text>
        <Text style={s.circleMembers}>{circle.members} members</Text>
        <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Joined', `You joined "${circle.name}" poetry circle.`)}>
          <Text style={s.joinBtnText}>Join Circle</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.note}>
        Poetry circles meet regularly to share work-in-progress,{'\n'}
        give feedback, and grow together as writers.{'\n'}
        Start your own circle — anyone can organize.
      </Text>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Poetry</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((t_) => (
          <TouchableOpacity
            key={t_.key}
            style={[s.tabBtn, tab === t_.key && s.tabActive]}
            onPress={() => setTab(t_.key)}
          >
            <Text style={[s.tabText, tab === t_.key && s.tabTextActive]}>{t_.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'feed' && renderFeed()}
        {tab === 'events' && renderEvents()}
        {tab === 'write' && renderWrite()}
        {tab === 'circles' && renderCircles()}
      </ScrollView>
    </SafeAreaView>
  );
}
