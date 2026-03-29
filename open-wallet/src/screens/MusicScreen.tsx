/**
 * Music Screen — Community music and performances.
 *
 * "Art enriches the soul; shared art enriches the community.
 *  Every performance, every lesson, every jam session is a gift
 *  of human creativity — and it deserves recognition."
 * — Human Constitution, Article I
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'events' | 'share' | 'jam' | 'lessons';

interface Performance {
  id: string;
  title: string;
  type: 'concert' | 'open_mic' | 'jam_session' | 'recital';
  date: string;
  location: string;
  performer: string;
  attendees: number;
}

interface SharedTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioHash: string;
  votes: number;
  onPlaylist: boolean;
}

interface JamSeeker {
  id: string;
  musician: string;
  instrument: string;
  genres: string[];
  experience: string;
  available: string;
}

interface MusicLesson {
  id: string;
  teacher: string;
  instrument: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  eOTKRate: number;
  rating: number;
  students: number;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'events', label: 'Events', icon: '\u{1F3B5}' },
  { key: 'share', label: 'Share', icon: '\u{1F3B6}' },
  { key: 'jam', label: 'Jam', icon: '\u{1F3B8}' },
  { key: 'lessons', label: 'Lessons', icon: '\u{1F3BC}' },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  concert: 'Concert',
  open_mic: 'Open Mic',
  jam_session: 'Jam Session',
  recital: 'Recital',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  concert: '\u{1F3A4}',
  open_mic: '\u{1F399}',
  jam_session: '\u{1F941}',
  recital: '\u{1F3B9}',
};

// ─── Demo Data ───

const DEMO_EVENTS: Performance[] = [
  {
    id: 'evt-1',
    title: 'Community Open Mic Night',
    type: 'open_mic',
    date: '2026-04-05 19:00',
    location: 'Riverside Park Amphitheater',
    performer: 'Various Artists',
    attendees: 42,
  },
  {
    id: 'evt-2',
    title: 'Spring Jazz Concert',
    type: 'concert',
    date: '2026-04-12 20:00',
    location: 'Community Hall',
    performer: 'Open Chain Jazz Ensemble',
    attendees: 128,
  },
  {
    id: 'evt-3',
    title: 'Sunday Acoustic Jam',
    type: 'jam_session',
    date: '2026-04-06 14:00',
    location: 'Central Library Garden',
    performer: 'Open to all',
    attendees: 15,
  },
];

const DEMO_TRACKS: SharedTrack[] = [
  {
    id: 'trk-1',
    title: 'Morning Light',
    artist: 'Ava Chen',
    genre: 'Ambient',
    audioHash: 'sha256:a1b2c3d4e5f6...',
    votes: 34,
    onPlaylist: true,
  },
  {
    id: 'trk-2',
    title: 'Neighborhood Blues',
    artist: 'Marcus Rivera',
    genre: 'Blues',
    audioHash: 'sha256:f6e5d4c3b2a1...',
    votes: 27,
    onPlaylist: true,
  },
  {
    id: 'trk-3',
    title: 'Gratitude Waltz',
    artist: 'Yuki Tanaka',
    genre: 'Classical',
    audioHash: 'sha256:1a2b3c4d5e6f...',
    votes: 19,
    onPlaylist: false,
  },
  {
    id: 'trk-4',
    title: 'Chain of Kindness',
    artist: 'Priya Sharma',
    genre: 'Folk',
    audioHash: 'sha256:6f5e4d3c2b1a...',
    votes: 15,
    onPlaylist: false,
  },
];

const DEMO_JAM_SEEKERS: JamSeeker[] = [
  {
    id: 'jam-1',
    musician: 'Leo Park',
    instrument: 'Guitar',
    genres: ['Blues', 'Rock', 'Jazz'],
    experience: '8 years',
    available: 'Weekends',
  },
  {
    id: 'jam-2',
    musician: 'Sofia Mendez',
    instrument: 'Violin',
    genres: ['Classical', 'Folk', 'World'],
    experience: '12 years',
    available: 'Evenings',
  },
];

const DEMO_LESSONS: MusicLesson[] = [
  {
    id: 'les-1',
    teacher: 'David Okafor',
    instrument: 'Piano',
    level: 'beginner',
    eOTKRate: 5,
    rating: 4.8,
    students: 14,
  },
  {
    id: 'les-2',
    teacher: 'Maria Santos',
    instrument: 'Guitar',
    level: 'intermediate',
    eOTKRate: 8,
    rating: 4.9,
    students: 9,
  },
];

export function MusicScreen({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [appreciating, setAppreciating] = useState<string | null>(null);
  const [votingTrack, setVotingTrack] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.purple },
    tabLabel: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabLabelActive: { color: '#fff' },
    tabIcon: { fontSize: 18, marginBottom: 2 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardSubtitle: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    cardMuted: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
    chip: { backgroundColor: t.bg.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    chipText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    appreciateBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', marginTop: 10 },
    appreciateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    voteBtn: { backgroundColor: t.accent.blue + '20', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8 },
    voteBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: '700' },
    playlistBadge: { backgroundColor: t.accent.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    playlistBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    rateText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    eOTK: { color: t.accent.orange, fontSize: 13, fontWeight: '700' },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
    levelText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    emptyText: { color: t.text.muted, textAlign: 'center', marginTop: 20, fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 12 },
    stat: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
  }), [t]);

  const levelColors: Record<string, string> = {
    beginner: t.accent.green,
    intermediate: t.accent.blue,
    advanced: t.accent.purple,
  };

  const handleAppreciate = useCallback(async (performerId: string, name: string) => {
    setAppreciating(performerId);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1000));
      Alert.alert('Appreciation Sent (Demo)', `1 OTK sent to ${name} as appreciation for their performance.`);
    } else {
      Alert.alert('Send Appreciation', `Send OTK to ${name} for their performance? (Coming soon on mainnet)`);
    }
    setAppreciating(null);
  }, [demoMode]);

  const handleVote = useCallback(async (trackId: string, trackTitle: string) => {
    setVotingTrack(trackId);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 500));
      Alert.alert('Vote Cast (Demo)', `You voted for "${trackTitle}" to be on the community playlist.`);
    } else {
      Alert.alert('Vote', `Vote for "${trackTitle}"? (Coming soon on mainnet)`);
    }
    setVotingTrack(null);
  }, [demoMode]);

  // ─── Events Tab ───
  const renderEvents = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F3B5}'}</Text>
        <Text style={s.heroTitle}>Community Music & Performances</Text>
        <Text style={s.heroSubtitle}>
          Concerts, open mics, jam sessions, and recitals. Art enriches the community — every performance deserves recognition.
        </Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>3</Text>
          <Text style={s.statLabel}>Upcoming</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>185</Text>
          <Text style={s.statLabel}>Attendees</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statValue}>42</Text>
          <Text style={s.statLabel}>OTK Sent</Text>
        </View>
      </View>

      <Text style={s.section}>Upcoming Performances</Text>
      {DEMO_EVENTS.map((evt) => (
        <View key={evt.id} style={s.card}>
          <View style={s.row}>
            <Text style={{ fontSize: 24 }}>{EVENT_TYPE_ICONS[evt.type]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{evt.title}</Text>
              <Text style={s.cardSubtitle}>{evt.performer}</Text>
            </View>
          </View>
          <View style={[s.badge, { backgroundColor: t.accent.blue }]}>
            <Text style={s.badgeText}>{EVENT_TYPE_LABELS[evt.type]}</Text>
          </View>
          <Text style={s.cardMuted}>{evt.date}  •  {evt.location}</Text>
          <Text style={s.cardMuted}>{evt.attendees} attending</Text>
          <TouchableOpacity
            style={s.appreciateBtn}
            onPress={() => handleAppreciate(evt.id, evt.performer)}
            disabled={appreciating === evt.id}
          >
            {appreciating === evt.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.appreciateBtnText}>Send OTK Appreciation</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Share Tab ───
  const renderShare = () => (
    <>
      <Text style={s.section}>Shared Compositions</Text>
      <Text style={{ color: t.text.muted, fontSize: 12, marginHorizontal: 24, marginBottom: 12 }}>
        Share your music with the community. Compositions are identified by audio hash for authenticity.
      </Text>
      {DEMO_TRACKS.map((trk) => (
        <View key={trk.id} style={s.card}>
          <Text style={s.cardTitle}>{trk.title}</Text>
          <Text style={s.cardSubtitle}>{trk.artist}  •  {trk.genre}</Text>
          <Text style={s.cardMuted}>Hash: {trk.audioHash}</Text>
          {trk.onPlaylist && (
            <View style={s.playlistBadge}>
              <Text style={s.playlistBadgeText}>Community Playlist</Text>
            </View>
          )}
          <TouchableOpacity
            style={s.voteBtn}
            onPress={() => handleVote(trk.id, trk.title)}
            disabled={votingTrack === trk.id}
          >
            {votingTrack === trk.id ? (
              <ActivityIndicator color={t.accent.blue} size="small" />
            ) : (
              <>
                <Text style={s.voteBtnText}>{trk.votes}</Text>
                <Text style={s.voteBtnText}>Vote for Playlist</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <Text style={s.section}>Community Playlist</Text>
      {DEMO_TRACKS.filter((tr) => tr.onPlaylist).map((trk) => (
        <View key={`pl-${trk.id}`} style={s.card}>
          <View style={s.row}>
            <Text style={{ fontSize: 20 }}>{'\u{1F3B6}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{trk.title}</Text>
              <Text style={s.cardSubtitle}>{trk.artist}  •  {trk.votes} votes</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Jam Tab ───
  const renderJam = () => (
    <>
      <Text style={s.section}>Jam Session Finder</Text>
      <Text style={{ color: t.text.muted, fontSize: 12, marginHorizontal: 24, marginBottom: 12 }}>
        Find fellow musicians to play with. Match by instrument, genre, and availability.
      </Text>
      {DEMO_JAM_SEEKERS.map((js) => (
        <View key={js.id} style={s.card}>
          <View style={s.row}>
            <Text style={{ fontSize: 24 }}>{'\u{1F3B8}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{js.musician}</Text>
              <Text style={s.cardSubtitle}>{js.instrument}  •  {js.experience}</Text>
            </View>
          </View>
          <View style={s.chipRow}>
            {js.genres.map((g) => (
              <View key={g} style={s.chip}>
                <Text style={s.chipText}>{g}</Text>
              </View>
            ))}
          </View>
          <Text style={s.cardMuted}>Available: {js.available}</Text>
          <TouchableOpacity style={s.appreciateBtn}>
            <Text style={s.appreciateBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Lessons Tab ───
  const renderLessons = () => (
    <>
      <Text style={s.section}>Music Lessons</Text>
      <Text style={{ color: t.text.muted, fontSize: 12, marginHorizontal: 24, marginBottom: 12 }}>
        Community members teaching instruments. Teachers earn eOTK for sharing knowledge.
      </Text>
      {DEMO_LESSONS.map((les) => (
        <View key={les.id} style={s.card}>
          <View style={s.row}>
            <Text style={{ fontSize: 24 }}>{'\u{1F3BC}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{les.teacher}</Text>
              <Text style={s.cardSubtitle}>{les.instrument}</Text>
            </View>
          </View>
          <View style={[s.levelBadge, { backgroundColor: levelColors[les.level] }]}>
            <Text style={s.levelText}>{les.level.toUpperCase()}</Text>
          </View>
          <View style={s.rateRow}>
            <Text style={s.rateText}>{'\u{2B50}'} {les.rating}</Text>
            <Text style={s.rateText}>  •  {les.students} students</Text>
          </View>
          <Text style={s.eOTK}>{les.eOTKRate} eOTK / lesson</Text>
          <TouchableOpacity style={s.appreciateBtn}>
            <Text style={s.appreciateBtnText}>Book Lesson</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'events': return renderEvents();
      case 'share': return renderShare();
      case 'jam': return renderJam();
      case 'lessons': return renderLessons();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Music</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {renderContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
