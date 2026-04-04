import { fonts } from '../utils/theme';
/**
 * Film Screen — Community cinema, documentary making, film appreciation.
 *
 * Art I: "Every human being has the right to cultural expression and
 *  participation in the arts."
 * — The Human Constitution, Article I
 *
 * Features:
 * - Movie nights schedule (outdoor, community center, virtual watch parties)
 * - Community films (documentaries/shorts by members, hash references)
 * - Film making workshops (camera, editing, storytelling — earn eOTK)
 * - Film discussion groups (watch, discuss themes, lessons)
 * - Submit a film (title, description, genre, duration, hash)
 * - Demo mode with sample screenings, films, workshops, discussions
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

type Tab = 'screenings' | 'films' | 'workshops' | 'discuss';

interface MovieNight {
  id: string;
  title: string;
  film: string;
  venue: string;
  date: string;
  time: string;
  type: 'outdoor' | 'indoor' | 'virtual';
  description: string;
  capacity: number;
  attending: number;
  rsvped: boolean;
}

interface CommunityFilm {
  id: string;
  title: string;
  creator: string;
  genre: string;
  duration: string;
  description: string;
  contentHash: string;
  dateAdded: string;
  views: number;
  likes: number;
}

interface Workshop {
  id: string;
  title: string;
  instructor: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  eotkReward: number;
  spotsTotal: number;
  spotsLeft: number;
  description: string;
  enrolled: boolean;
}

interface DiscussionGroup {
  id: string;
  film: string;
  topic: string;
  facilitator: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  themes: string[];
  joined: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'screenings', label: 'Screenings', icon: '\u{1F3AC}' },
  { key: 'films', label: 'Films', icon: '\u{1F4FD}' },
  { key: 'workshops', label: 'Workshops', icon: '\u{1F3A5}' },
  { key: 'discuss', label: 'Discuss', icon: '\u{1F4AC}' },
];

const GENRES = ['Documentary', 'Short Film', 'Animation', 'Drama', 'Comedy', 'Experimental'];

// ─── Demo Data ───

const DEMO_MOVIE_NIGHTS: MovieNight[] = [
  {
    id: 'mn1', title: 'Under the Stars: Community Night',
    film: 'The Biggest Little Farm', venue: 'Riverside Park Amphitheater',
    date: '2026-04-05', time: '8:00 PM', type: 'outdoor',
    description: 'Bring blankets and lawn chairs for a beautiful outdoor screening of this award-winning documentary about sustainable farming. Popcorn and lemonade provided by the Community Kitchen.',
    capacity: 200, attending: 142, rsvped: false,
  },
  {
    id: 'mn2', title: 'Documentary Thursday',
    film: 'Won\'t You Be My Neighbor?', venue: 'Community Center Hall A',
    date: '2026-04-10', time: '7:00 PM', type: 'indoor',
    description: 'A heartwarming look at the life and philosophy of Fred Rogers. Perfect for all ages. Discussion session follows the screening.',
    capacity: 80, attending: 53, rsvped: true,
  },
  {
    id: 'mn3', title: 'Global Cinema Watch Party',
    film: 'Capernaum (Subtitled)', venue: 'Virtual — Jitsi Meet',
    date: '2026-04-12', time: '6:00 PM', type: 'virtual',
    description: 'Join from anywhere for this powerful Lebanese drama about childhood poverty and resilience. Synchronized viewing with live chat discussion.',
    capacity: 500, attending: 87, rsvped: false,
  },
];

const DEMO_COMMUNITY_FILMS: CommunityFilm[] = [
  {
    id: 'cf1', title: 'Voices of Oak Street',
    creator: 'Maria Chen', genre: 'Documentary', duration: '22 min',
    description: 'Interviews with long-time residents of Oak Street about how the neighborhood has changed over four decades. Captures the spirit of community resilience.',
    contentHash: 'QmX7f3a...b29e', dateAdded: '2026-03-15', views: 340, likes: 89,
  },
  {
    id: 'cf2', title: 'The Last Beekeeper',
    creator: 'Youth Film Collective', genre: 'Short Film', duration: '11 min',
    description: 'A fictional short about an elderly beekeeper passing on knowledge to a curious teenager. Made entirely by members of the Youth Film Workshop.',
    contentHash: 'QmR4d8c...71af', dateAdded: '2026-03-22', views: 215, likes: 64,
  },
];

const DEMO_WORKSHOPS: Workshop[] = [
  {
    id: 'ws1', title: 'Camera Basics: Tell Your Story',
    instructor: 'David Park', topic: 'Camera & Composition',
    date: '2026-04-08', time: '10:00 AM', duration: '3 hours',
    eotkReward: 150, spotsTotal: 15, spotsLeft: 6,
    description: 'Learn framing, lighting, and shot composition using your phone camera. No experience needed. Instructors earn eOTK for teaching.',
    enrolled: false,
  },
];

const DEMO_DISCUSSION_GROUPS: DiscussionGroup[] = [
  {
    id: 'dg1', film: 'The Biggest Little Farm',
    topic: 'What can our community learn from regenerative farming?',
    facilitator: 'Sarah M.', date: '2026-04-06', time: '10:00 AM',
    participants: 12, maxParticipants: 20,
    themes: ['Sustainability', 'Patience', 'Ecosystem Thinking'],
    joined: false,
  },
];

// ─── Component ───

export function FilmScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('screenings');
  const [movieNights, setMovieNights] = useState(DEMO_MOVIE_NIGHTS);
  const [workshops, setWorkshops] = useState(DEMO_WORKSHOPS);
  const [discussions, setDiscussions] = useState(DEMO_DISCUSSION_GROUPS);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitGenre, setSubmitGenre] = useState('Documentary');
  const [submitDuration, setSubmitDuration] = useState('');
  const [submitHash, setSubmitHash] = useState('');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: t.bg.card, marginHorizontal: 4 },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabLabel: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold, marginTop: 2 },
    tabLabelActive: { color: '#fff' },
    tabIcon: { fontSize: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    cardSubtitle: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 6 },
    cardDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 10 },
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    metaBadge: { backgroundColor: t.bg.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    metaText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    actionBtn: { backgroundColor: t.accent.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    secondaryBtn: { backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    secondaryBtnText: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.bold },
    disabledBtn: { opacity: 0.5 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 40, lineHeight: 22 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center', marginBottom: 8 },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    genreChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.primary },
    genreChipActive: { backgroundColor: t.accent.purple },
    genreLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    genreLabelActive: { color: '#fff' },
    themeTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    themeText: { color: t.accent.purple, fontSize: 12, fontWeight: fonts.semibold },
    filmHashLabel: { color: t.text.muted, fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
    statText: { color: t.text.muted, fontSize: 12 },
    typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    outdoorBadge: { backgroundColor: '#22c55e20' },
    indoorBadge: { backgroundColor: '#3b82f620' },
    virtualBadge: { backgroundColor: '#a855f720' },
    typeBadgeText: { fontSize: 12, fontWeight: fonts.semibold },
  }), [t]);

  const handleRSVP = useCallback((id: string) => {
    setMovieNights(prev => prev.map(mn =>
      mn.id === id ? { ...mn, rsvped: !mn.rsvped, attending: mn.rsvped ? mn.attending - 1 : mn.attending + 1 } : mn
    ));
  }, []);

  const handleEnrollWorkshop = useCallback((id: string) => {
    setWorkshops(prev => prev.map(ws =>
      ws.id === id && ws.spotsLeft > 0
        ? { ...ws, enrolled: !ws.enrolled, spotsLeft: ws.enrolled ? ws.spotsLeft + 1 : ws.spotsLeft - 1 }
        : ws
    ));
  }, []);

  const handleJoinDiscussion = useCallback((id: string) => {
    setDiscussions(prev => prev.map(dg =>
      dg.id === id && dg.participants < dg.maxParticipants
        ? { ...dg, joined: !dg.joined, participants: dg.joined ? dg.participants - 1 : dg.participants + 1 }
        : dg
    ));
  }, []);

  const handleSubmitFilm = useCallback(() => {
    if (!submitTitle.trim() || !submitDesc.trim() || !submitDuration.trim() || !submitHash.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
      return;
    }
    Alert.alert('Film Submitted', `"${submitTitle}" has been submitted for community review. Once approved, it will appear in the Films tab.`);
    setSubmitTitle('');
    setSubmitDesc('');
    setSubmitDuration('');
    setSubmitHash('');
    setShowSubmit(false);
  }, [submitTitle, submitDesc, submitDuration, submitHash]);

  const venueTypeColor = (type: string) => {
    if (type === 'outdoor') return '#22c55e';
    if (type === 'indoor') return '#3b82f6';
    return '#a855f7';
  };

  const venueTypeBadge = (type: string) => {
    if (type === 'outdoor') return s.outdoorBadge;
    if (type === 'indoor') return s.indoorBadge;
    return s.virtualBadge;
  };

  // ─── Render Helpers ───

  const renderScreenings = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F3AC}'}</Text>
        <Text style={s.heroTitle}>Community Cinema</Text>
        <Text style={s.heroSubtitle}>
          Outdoor screenings, community center showings, and virtual watch parties.{'\n'}Film brings us together.
        </Text>
      </View>

      <Text style={s.section}>Upcoming Screenings</Text>
      {movieNights.map(mn => (
        <View key={mn.id} style={s.card}>
          <Text style={s.cardTitle}>{mn.title}</Text>
          <Text style={s.cardSubtitle}>{'\u{1F3A5}'} {mn.film}</Text>
          <Text style={s.cardDesc}>{mn.description}</Text>
          <View style={s.cardMeta}>
            <View style={[s.typeBadge, venueTypeBadge(mn.type)]}>
              <Text style={[s.typeBadgeText, { color: venueTypeColor(mn.type) }]}>
                {mn.type === 'outdoor' ? '\u{1F333}' : mn.type === 'indoor' ? '\u{1F3DB}' : '\u{1F4BB}'} {mn.type.charAt(0).toUpperCase() + mn.type.slice(1)}
              </Text>
            </View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4CD}'} {mn.venue}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {mn.date}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F552}'} {mn.time}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F465}'} {mn.attending}/{mn.capacity}</Text></View>
          </View>
          <TouchableOpacity
            style={[mn.rsvped ? s.secondaryBtn : s.actionBtn]}
            onPress={() => handleRSVP(mn.id)}
          >
            <Text style={mn.rsvped ? s.secondaryBtnText : s.actionBtnText}>
              {mn.rsvped ? 'Cancel RSVP' : 'RSVP'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderFilms = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4FD}'}</Text>
        <Text style={s.heroTitle}>Community Films</Text>
        <Text style={s.heroSubtitle}>
          Documentaries and shorts made by community members.{'\n'}Every story matters.
        </Text>
      </View>

      <Text style={s.section}>Featured Films</Text>
      {DEMO_COMMUNITY_FILMS.map(film => (
        <View key={film.id} style={s.card}>
          <Text style={s.cardTitle}>{film.title}</Text>
          <Text style={s.cardSubtitle}>{'\u{1F3A8}'} {film.creator} | {film.genre} | {film.duration}</Text>
          <Text style={s.cardDesc}>{film.description}</Text>
          <Text style={s.filmHashLabel}>Hash: {film.contentHash}</Text>
          <View style={s.statsRow}>
            <Text style={s.statText}>{'\u{1F441}'} {film.views} views</Text>
            <Text style={s.statText}>{'\u{2764}'} {film.likes} likes</Text>
            <Text style={s.statText}>{'\u{1F4C5}'} {film.dateAdded}</Text>
          </View>
        </View>
      ))}

      <Text style={s.section}>Submit Your Film</Text>
      {showSubmit ? (
        <View style={s.inputCard}>
          <Text style={s.inputLabel}>Title</Text>
          <TextInput style={s.input} value={submitTitle} onChangeText={setSubmitTitle} placeholder="Film title" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Description</Text>
          <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} value={submitDesc} onChangeText={setSubmitDesc} placeholder="What is your film about?" placeholderTextColor={t.text.muted} multiline />

          <Text style={s.inputLabel}>Genre</Text>
          <View style={s.genreRow}>
            {GENRES.map(g => (
              <TouchableOpacity key={g} style={[s.genreChip, submitGenre === g && s.genreChipActive]} onPress={() => setSubmitGenre(g)}>
                <Text style={[s.genreLabel, submitGenre === g && s.genreLabelActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.inputLabel}>Duration</Text>
          <TextInput style={s.input} value={submitDuration} onChangeText={setSubmitDuration} placeholder="e.g., 15 min" placeholderTextColor={t.text.muted} />

          <Text style={s.inputLabel}>Content Hash</Text>
          <TextInput style={s.input} value={submitHash} onChangeText={setSubmitHash} placeholder="IPFS or content hash" placeholderTextColor={t.text.muted} />

          <TouchableOpacity style={s.actionBtn} onPress={handleSubmitFilm}>
            <Text style={s.actionBtnText}>Submit Film</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => setShowSubmit(false)}>
            <Text style={s.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[s.actionBtn, { marginHorizontal: 20 }]} onPress={() => setShowSubmit(true)}>
          <Text style={s.actionBtnText}>{'\u{1F4E4}'} Submit a Film</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderWorkshops = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F3A5}'}</Text>
        <Text style={s.heroTitle}>Film Making Workshops</Text>
        <Text style={s.heroSubtitle}>
          Learn camera work, editing, and storytelling.{'\n'}Teach a workshop and earn eOTK.
        </Text>
      </View>

      <Text style={s.section}>Upcoming Workshops</Text>
      {workshops.map(ws => (
        <View key={ws.id} style={s.card}>
          <Text style={s.cardTitle}>{ws.title}</Text>
          <Text style={s.cardSubtitle}>{'\u{1F9D1}\u{200D}\u{1F3EB}'} {ws.instructor} | {ws.topic}</Text>
          <Text style={s.cardDesc}>{ws.description}</Text>
          <View style={s.cardMeta}>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {ws.date}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F552}'} {ws.time}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{23F1}'} {ws.duration}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1FA91}'} {ws.spotsLeft}/{ws.spotsTotal} spots</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4DA}'} +{ws.eotkReward} eOTK for teaching</Text></View>
          </View>
          <TouchableOpacity
            style={[ws.enrolled ? s.secondaryBtn : s.actionBtn, ws.spotsLeft === 0 && !ws.enrolled && s.disabledBtn]}
            onPress={() => handleEnrollWorkshop(ws.id)}
            disabled={ws.spotsLeft === 0 && !ws.enrolled}
          >
            <Text style={ws.enrolled ? s.secondaryBtnText : s.actionBtnText}>
              {ws.enrolled ? 'Unenroll' : ws.spotsLeft === 0 ? 'Full' : 'Enroll'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={[s.cardTitle, { textAlign: 'center', marginBottom: 8 }]}>Want to Teach?</Text>
        <Text style={[s.cardDesc, { textAlign: 'center' }]}>
          Share your film making skills with the community. You will earn eOTK for every workshop you teach.
        </Text>
        <TouchableOpacity style={[s.actionBtn, { width: '100%' }]} onPress={() => Alert.alert('Coming Soon', 'Workshop proposal form will be available in the next update.')}>
          <Text style={s.actionBtnText}>{'\u{1F3A4}'} Propose a Workshop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDiscuss = () => (
    <View>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'\u{1F4AC}'}</Text>
        <Text style={s.heroTitle}>Film Discussion Groups</Text>
        <Text style={s.heroSubtitle}>
          Watch together, discuss themes, share lessons.{'\n'}Every perspective enriches the conversation.
        </Text>
      </View>

      <Text style={s.section}>Active Discussion Groups</Text>
      {discussions.map(dg => (
        <View key={dg.id} style={s.card}>
          <Text style={s.cardTitle}>{'\u{1F3AC}'} {dg.film}</Text>
          <Text style={s.cardSubtitle}>{dg.topic}</Text>
          <View style={s.cardMeta}>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F9D1}'} {dg.facilitator}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F4C5}'} {dg.date}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F552}'} {dg.time}</Text></View>
            <View style={s.metaBadge}><Text style={s.metaText}>{'\u{1F465}'} {dg.participants}/{dg.maxParticipants}</Text></View>
          </View>
          <View style={[s.cardMeta, { marginBottom: 4 }]}>
            {dg.themes.map(theme => (
              <View key={theme} style={s.themeTag}>
                <Text style={s.themeText}>{theme}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[dg.joined ? s.secondaryBtn : s.actionBtn]}
            onPress={() => handleJoinDiscussion(dg.id)}
          >
            <Text style={dg.joined ? s.secondaryBtnText : s.actionBtnText}>
              {dg.joined ? 'Leave Group' : 'Join Discussion'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{'\u{1F3AC}'} Community Cinema</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={s.tabIcon}>{tb.icon}</Text>
            <Text style={[s.tabLabel, tab === tb.key && s.tabLabelActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'screenings' && renderScreenings()}
        {tab === 'films' && renderFilms()}
        {tab === 'workshops' && renderWorkshops()}
        {tab === 'discuss' && renderDiscuss()}
      </ScrollView>
    </SafeAreaView>
  );
}
