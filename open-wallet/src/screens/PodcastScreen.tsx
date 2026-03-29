/**
 * Podcast Screen — Community podcasting, audio stories, voice of the community.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * hOTK represents creative and cultural value — sharing knowledge through voice.
 *
 * Features:
 * - Community podcasts (episodes shared by members, topics, duration)
 * - Record & share (submit episode with title, description, topic, audio hash)
 * - Podcast categories: community stories, governance updates, education, culture, interviews
 * - Listen stats (plays, favorites, community feedback)
 * - Featured episode of the week
 * - Start a podcast series (register, describe, set schedule)
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

interface PodcastEpisode {
  id: string;
  title: string;
  creator: string;
  topic: string;
  description: string;
  durationMin: number;
  plays: number;
  favorites: number;
  date: string;
  audioHash: string;
  seriesId: string | null;
  featured: boolean;
  hotkEarned: number;
}

interface PodcastSeries {
  id: string;
  title: string;
  creator: string;
  description: string;
  schedule: string;
  episodeCount: number;
  totalPlays: number;
  subscribers: number;
  topic: string;
  hotkEarned: number;
}

interface ListenStats {
  totalPlays: number;
  totalFavorites: number;
  episodesPublished: number;
  totalHOTK: number;
  topTopic: string;
  listenHours: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const PODCAST_TOPICS = [
  { key: 'community_stories', label: 'Community Stories', icon: 'C' },
  { key: 'governance', label: 'Governance Updates', icon: 'G' },
  { key: 'education', label: 'Education', icon: 'E' },
  { key: 'culture', label: 'Culture', icon: 'U' },
  { key: 'interviews', label: 'Interviews', icon: 'I' },
];

const TOPIC_COLORS: Record<string, string> = {
  community_stories: '#34C759',
  governance: '#007AFF',
  education: '#AF52DE',
  culture: '#FF9500',
  interviews: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_EPISODES: PodcastEpisode[] = [
  { id: '1', title: 'Building Trust in Decentralized Communities', creator: 'Priya Patel', topic: 'community_stories', description: 'How our neighborhood governance council resolved a water access dispute using Open Chain voting — a real story of community-driven consensus.', durationMin: 24, plays: 312, favorites: 67, date: '2026-03-28', audioHash: '0xabc1...def1', seriesId: '1', featured: true, hotkEarned: 840 },
  { id: '2', title: 'Governance Proposal #47: Park Renovation', creator: 'Marcus Chen', topic: 'governance', description: 'Detailed walkthrough of the upcoming park renovation proposal, budget breakdown, and how to cast your vote.', durationMin: 18, plays: 189, favorites: 34, date: '2026-03-27', audioHash: '0xabc2...def2', seriesId: null, featured: false, hotkEarned: 520 },
  { id: '3', title: 'Teaching Crypto to Grandparents', creator: 'Sofia Rodriguez', topic: 'education', description: 'Practical tips from an intergenerational workshop — bridging the digital divide one family at a time.', durationMin: 31, plays: 256, favorites: 89, date: '2026-03-25', audioHash: '0xabc3...def3', seriesId: '2', featured: false, hotkEarned: 720 },
  { id: '4', title: 'Songs of the Solstice Festival', creator: 'Amara Okafor', topic: 'culture', description: 'Audio highlights from our community solstice celebration — music, poetry, and the stories behind the traditions.', durationMin: 42, plays: 198, favorites: 56, date: '2026-03-22', audioHash: '0xabc4...def4', seriesId: null, featured: false, hotkEarned: 580 },
];

const DEMO_SERIES: PodcastSeries[] = [
  { id: '1', title: 'Voices of the Village', creator: 'Priya Patel', description: 'Weekly stories from community members about how decentralized governance is changing their daily lives.', schedule: 'Weekly, Fridays', episodeCount: 12, totalPlays: 3840, subscribers: 234, topic: 'community_stories', hotkEarned: 9600 },
  { id: '2', title: 'Bridge the Gap', creator: 'Sofia Rodriguez', description: 'Education series about making technology accessible to every generation. Tips, tools, and real experiences.', schedule: 'Biweekly, Wednesdays', episodeCount: 6, totalPlays: 1520, subscribers: 128, topic: 'education', hotkEarned: 4200 },
];

const DEMO_STATS: ListenStats = {
  totalPlays: 955,
  totalFavorites: 246,
  episodesPublished: 4,
  totalHOTK: 2660,
  topTopic: 'Community Stories',
  listenHours: 18,
};

const DEMO_FEATURED = DEMO_EPISODES[0];

type Tab = 'listen' | 'record' | 'series' | 'featured';

export function PodcastScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('listen');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [recordTopic, setRecordTopic] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [seriesSchedule, setSeriesSchedule] = useState('');
  const [seriesTopic, setSeriesToPic] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const episodes = DEMO_EPISODES;
  const series = DEMO_SERIES;
  const stats = DEMO_STATS;
  const featured = DEMO_FEATURED;

  const handlePlay = useCallback((episode: PodcastEpisode) => {
    Alert.alert(
      'Now Playing',
      `"${episode.title}" by ${episode.creator}\n\nDuration: ${episode.durationMin} min\nPlays: ${episode.plays}\n\nAudio hash: ${episode.audioHash}`,
    );
  }, []);

  const handleFavorite = useCallback((episode: PodcastEpisode) => {
    Alert.alert('Favorited', `"${episode.title}" added to your favorites.`);
  }, []);

  const handleSubmitEpisode = useCallback(() => {
    if (!recordTitle.trim()) { Alert.alert('Required', 'Enter an episode title.'); return; }
    if (!recordDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!recordTopic) { Alert.alert('Required', 'Select a topic.'); return; }

    const topicLabel = PODCAST_TOPICS.find((t) => t.key === recordTopic)?.label || recordTopic;
    Alert.alert(
      'Episode Submitted',
      `"${recordTitle.trim()}" submitted under ${topicLabel}.\n\nYour episode will be reviewed and published. You'll earn hOTK based on community engagement.`,
    );
    setRecordTitle('');
    setRecordDescription('');
    setRecordTopic('');
    setTab('listen');
  }, [recordTitle, recordDescription, recordTopic]);

  const handleStartSeries = useCallback(() => {
    if (!seriesTitle.trim()) { Alert.alert('Required', 'Enter a series title.'); return; }
    if (!seriesDescription.trim()) { Alert.alert('Required', 'Describe your series.'); return; }
    if (!seriesSchedule.trim()) { Alert.alert('Required', 'Set a publishing schedule.'); return; }
    if (!seriesTopic) { Alert.alert('Required', 'Select a topic.'); return; }

    Alert.alert(
      'Series Created',
      `"${seriesTitle.trim()}" has been registered!\n\nSchedule: ${seriesSchedule.trim()}\nStart publishing episodes to earn hOTK.`,
    );
    setSeriesTitle('');
    setSeriesDescription('');
    setSeriesSchedule('');
    setSeriesToPic('');
  }, [seriesTitle, seriesDescription, seriesSchedule, seriesTopic]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    episodeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    episodeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    episodeTopicIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    episodeTopicIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    episodeTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    episodeCreator: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 2 },
    episodeDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 8 },
    episodeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    episodeDuration: { color: t.text.muted, fontSize: 12 },
    episodeStats: { color: t.text.muted, fontSize: 12 },
    episodeHotk: { color: t.accent.green, fontSize: 13, fontWeight: '700' },
    episodeActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    playBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
    playBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    favBtn: { backgroundColor: t.accent.orange + '20', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
    favBtnText: { color: t.accent.orange, fontSize: 13, fontWeight: '700' },
    topicTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
    topicTagText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    featuredBanner: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    featuredLabel: { color: t.accent.orange, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    featuredTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
    featuredCreator: { color: t.accent.blue, fontSize: 14, fontWeight: '600', marginBottom: 8 },
    featuredDesc: { color: t.text.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
    featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    featuredPlays: { color: t.text.muted, fontSize: 13 },
    featuredHotk: { color: t.accent.green, fontSize: 14, fontWeight: '700' },
    seriesCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    seriesTitle2: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    seriesCreator: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginTop: 2 },
    seriesDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    seriesMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    seriesMetaText: { color: t.text.muted, fontSize: 12 },
    seriesSchedule: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 4 },
    seriesStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    topicChipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    topicChipText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    topicChipTextSelected: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    createSeriesSection: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    createSeriesTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    createSeriesDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
    educationCard: { backgroundColor: t.accent.blue + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    educationText: { color: t.text.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  }), [t]);

  // ─── Tabs ───

  const tabDefs: Array<{ key: Tab; label: string }> = [
    { key: 'listen', label: 'Listen' },
    { key: 'record', label: 'Record' },
    { key: 'series', label: 'Series' },
    { key: 'featured', label: 'Featured' },
  ];

  // ─── Listen Tab ───

  const renderListen = () => (
    <>
      {/* Stats */}
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0, marginBottom: 8 }]}>Your Podcast Stats</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.episodesPublished}</Text>
            <Text style={s.statLabel}>Published</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{stats.totalHOTK.toLocaleString()}</Text>
            <Text style={s.statLabel}>hOTK Earned</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{stats.totalPlays}</Text>
            <Text style={s.statLabel}>Total Plays</Text>
          </View>
        </View>
        <View style={[s.statRow, { marginTop: 12 }]}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.totalFavorites}</Text>
            <Text style={s.statLabel}>Favorites</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.listenHours}</Text>
            <Text style={s.statLabel}>Hours Listened</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { fontSize: 13 }]}>{stats.topTopic}</Text>
            <Text style={s.statLabel}>Top Topic</Text>
          </View>
        </View>
      </View>

      {/* Episodes */}
      <Text style={s.sectionTitle}>Community Episodes</Text>
      {episodes.map((episode) => {
        const topicInfo = PODCAST_TOPICS.find((tp) => tp.key === episode.topic);
        const topicColor = TOPIC_COLORS[episode.topic] || '#8E8E93';
        return (
          <View key={episode.id} style={s.episodeCard}>
            <View style={s.episodeHeader}>
              <View style={[s.episodeTopicIcon, { backgroundColor: topicColor }]}>
                <Text style={s.episodeTopicIconText}>{topicInfo?.icon || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.episodeTitle}>{episode.title}</Text>
                <Text style={s.episodeCreator}>{episode.creator}</Text>
              </View>
            </View>
            <View style={[s.topicTag, { backgroundColor: topicColor }]}>
              <Text style={s.topicTagText}>{topicInfo?.label || episode.topic}</Text>
            </View>
            <Text style={s.episodeDesc}>{episode.description}</Text>
            <View style={s.episodeMeta}>
              <Text style={s.episodeDuration}>{episode.durationMin} min | {episode.date}</Text>
              <Text style={s.episodeStats}>{episode.plays} plays | {episode.favorites} favs</Text>
            </View>
            <View style={[s.episodeMeta, { marginTop: 4 }]}>
              <Text style={s.episodeHotk}>{episode.hotkEarned} hOTK earned</Text>
            </View>
            <View style={s.episodeActions}>
              <TouchableOpacity style={s.playBtn} onPress={() => handlePlay(episode)}>
                <Text style={s.playBtnText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.favBtn} onPress={() => handleFavorite(episode)}>
                <Text style={s.favBtnText}>Favorite</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Record Tab ───

  const renderRecord = () => (
    <>
      <Text style={s.sectionTitle}>Submit an Episode</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Episode title"
          placeholderTextColor={t.text.muted}
          value={recordTitle}
          onChangeText={setRecordTitle}
        />
        <TextInput
          style={[s.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Episode description"
          placeholderTextColor={t.text.muted}
          value={recordDescription}
          onChangeText={setRecordDescription}
          multiline
        />

        <Text style={[s.sectionTitle, { marginHorizontal: 0, fontSize: 14 }]}>Topic</Text>
        <View style={s.topicGrid}>
          {PODCAST_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.key}
              style={[s.topicChip, recordTopic === topic.key && s.topicChipSelected]}
              onPress={() => setRecordTopic(topic.key)}
            >
              <Text style={[s.topicChipText, recordTopic === topic.key && s.topicChipTextSelected]}>{topic.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitEpisode}>
          <Text style={s.submitText}>Submit Episode</Text>
        </TouchableOpacity>
      </View>

      <View style={s.educationCard}>
        <Text style={s.educationText}>
          Your voice matters.{'\n'}Share stories, knowledge, and updates with your community. Earn hOTK based on engagement.
        </Text>
      </View>
    </>
  );

  // ─── Series Tab ───

  const renderSeries = () => (
    <>
      <Text style={s.sectionTitle}>Podcast Series</Text>
      {series.map((s2) => {
        const topicColor = TOPIC_COLORS[s2.topic] || '#8E8E93';
        const topicInfo = PODCAST_TOPICS.find((tp) => tp.key === s2.topic);
        return (
          <View key={s2.id} style={s.seriesCard}>
            <Text style={s.seriesTitle2}>{s2.title}</Text>
            <Text style={s.seriesCreator}>by {s2.creator}</Text>
            <View style={[s.topicTag, { backgroundColor: topicColor }]}>
              <Text style={s.topicTagText}>{topicInfo?.label || s2.topic}</Text>
            </View>
            <Text style={s.seriesDesc}>{s2.description}</Text>
            <Text style={s.seriesSchedule}>Schedule: {s2.schedule}</Text>
            <View style={s.seriesStats}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{s2.episodeCount}</Text>
                <Text style={s.statLabel}>Episodes</Text>
              </View>
              <View style={s.statItem}>
                <Text style={[s.statValue, { color: t.accent.blue }]}>{s2.totalPlays.toLocaleString()}</Text>
                <Text style={s.statLabel}>Plays</Text>
              </View>
              <View style={s.statItem}>
                <Text style={s.statValue}>{s2.subscribers}</Text>
                <Text style={s.statLabel}>Subscribers</Text>
              </View>
              <View style={s.statItem}>
                <Text style={[s.statValue, { color: t.accent.green }]}>{s2.hotkEarned.toLocaleString()}</Text>
                <Text style={s.statLabel}>hOTK</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Start a Series */}
      <View style={s.createSeriesSection}>
        <Text style={s.createSeriesTitle}>Start a Podcast Series</Text>
        <Text style={s.createSeriesDesc}>
          Register your series, describe its purpose, set a schedule, and start publishing episodes.
        </Text>
        <TextInput
          style={s.input}
          placeholder="Series title"
          placeholderTextColor={t.text.muted}
          value={seriesTitle}
          onChangeText={setSeriesTitle}
        />
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Series description"
          placeholderTextColor={t.text.muted}
          value={seriesDescription}
          onChangeText={setSeriesDescription}
          multiline
        />
        <TextInput
          style={s.input}
          placeholder="Schedule (e.g., Weekly, Fridays)"
          placeholderTextColor={t.text.muted}
          value={seriesSchedule}
          onChangeText={setSeriesSchedule}
        />
        <Text style={[s.sectionTitle, { marginHorizontal: 0, fontSize: 14 }]}>Topic</Text>
        <View style={s.topicGrid}>
          {PODCAST_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.key}
              style={[s.topicChip, seriesTopic === topic.key && s.topicChipSelected]}
              onPress={() => setSeriesToPic(topic.key)}
            >
              <Text style={[s.topicChipText, seriesTopic === topic.key && s.topicChipTextSelected]}>{topic.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.submitBtn} onPress={handleStartSeries}>
          <Text style={s.submitText}>Create Series</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Featured Tab ───

  const renderFeatured = () => {
    const topicInfo = PODCAST_TOPICS.find((tp) => tp.key === featured.topic);
    const topicColor = TOPIC_COLORS[featured.topic] || '#8E8E93';
    return (
      <>
        <View style={s.featuredBanner}>
          <Text style={s.featuredLabel}>Episode of the Week</Text>
          <Text style={s.featuredTitle}>{featured.title}</Text>
          <Text style={s.featuredCreator}>by {featured.creator}</Text>
          <View style={[s.topicTag, { backgroundColor: topicColor }]}>
            <Text style={s.topicTagText}>{topicInfo?.label || featured.topic}</Text>
          </View>
          <Text style={s.featuredDesc}>{featured.description}</Text>
          <View style={s.featuredMeta}>
            <Text style={s.featuredPlays}>{featured.durationMin} min | {featured.plays} plays | {featured.favorites} favs</Text>
            <Text style={s.featuredHotk}>{featured.hotkEarned} hOTK</Text>
          </View>
          <View style={[s.episodeActions, { marginTop: 12 }]}>
            <TouchableOpacity style={s.playBtn} onPress={() => handlePlay(featured)}>
              <Text style={s.playBtnText}>Play Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.favBtn} onPress={() => handleFavorite(featured)}>
              <Text style={s.favBtnText}>Favorite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.educationCard}>
          <Text style={s.educationText}>
            The featured episode is chosen by community votes.{'\n'}Create great content and your episode could be next!
          </Text>
        </View>

        {/* Quick stats */}
        <Text style={s.sectionTitle}>Community Podcast Stats</Text>
        <View style={s.card}>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{episodes.length}</Text>
              <Text style={s.statLabel}>Episodes</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.blue }]}>{series.length}</Text>
              <Text style={s.statLabel}>Series</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>
                {episodes.reduce((sum, ep) => sum + ep.plays, 0)}
              </Text>
              <Text style={s.statLabel}>Total Plays</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'listen': return renderListen();
      case 'record': return renderRecord();
      case 'series': return renderSeries();
      case 'featured': return renderFeatured();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Podcasts</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabDefs.map((td) => (
          <TouchableOpacity
            key={td.key}
            style={[s.tabBtn, tab === td.key && s.tabActive]}
            onPress={() => setTab(td.key)}
          >
            <Text style={[s.tabText, tab === td.key && s.tabTextActive]}>{td.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
