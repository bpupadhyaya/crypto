import { fonts } from '../utils/theme';
/**
 * Storytelling Screen — Community storytelling platform, preserving narratives.
 *
 * Article I: "Every community's stories are its living memory —
 *  preserving them is preserving humanity itself."
 * — The Human Constitution
 *
 * Features:
 * - Story feed — community stories sorted by recent/popular/featured
 * - Story categories: personal journey, community history, folk tale,
 *   lesson learned, gratitude story, dream/vision
 * - Submit story (title, category, story text, audio/video hash optional)
 * - Story circles — live storytelling events where people gather to share
 * - Gratitude: send OTK to storytellers whose stories resonated
 * - Featured storyteller of the week
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface Story {
  id: string;
  authorUID: string;
  authorName: string;
  title: string;
  category: StoryCategory;
  body: string;
  mediaHash?: string;
  mediaType?: 'audio' | 'video';
  otkReceived: number;
  likes: number;
  date: string;
  featured: boolean;
}

interface StoryCircle {
  id: string;
  title: string;
  hostName: string;
  hostUID: string;
  theme: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  participants: number;
  maxParticipants: number;
  isLive: boolean;
}

interface FeaturedStoryteller {
  uid: string;
  name: string;
  storiesCount: number;
  totalOTKReceived: number;
  topCategory: string;
  bio: string;
  weekOf: string;
}

interface Props {
  onClose: () => void;
}

type StoryCategory = 'personal_journey' | 'community_history' | 'folk_tale' | 'lesson_learned' | 'gratitude_story' | 'dream_vision';
type Tab = 'stories' | 'share' | 'circles' | 'featured';
type SortMode = 'recent' | 'popular' | 'featured';

// ─── Constants ───

const CATEGORIES: { key: StoryCategory; label: string; icon: string }[] = [
  { key: 'personal_journey', label: 'Personal Journey', icon: 'J' },
  { key: 'community_history', label: 'Community History', icon: 'H' },
  { key: 'folk_tale', label: 'Folk Tale', icon: 'F' },
  { key: 'lesson_learned', label: 'Lesson Learned', icon: 'L' },
  { key: 'gratitude_story', label: 'Gratitude Story', icon: 'G' },
  { key: 'dream_vision', label: 'Dream / Vision', icon: 'D' },
];

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'popular', label: 'Popular' },
  { key: 'featured', label: 'Featured' },
];

// ─── Demo Data ───

const DEMO_STORIES: Story[] = [
  {
    id: 's1', authorUID: 'openchain1abc...narrator_amara', authorName: 'Amara Okafor',
    title: 'How My Grandmother Taught a Village to Read',
    category: 'community_history',
    body: 'In the late 1960s, my grandmother Nneka walked twelve miles each day to the nearest town with books. She carried them back in a basket on her head and opened a reading circle under the old baobab tree. Within two years, 47 adults in our village could read and write. She never asked for payment — she said knowledge was the only wealth that multiplied when shared.',
    otkReceived: 2400, likes: 89, date: '2026-03-28', featured: true,
  },
  {
    id: 's2', authorUID: 'openchain1def...storyteller_kenji', authorName: 'Kenji Tanaka',
    title: 'The Day I Chose Forgiveness Over Revenge',
    category: 'lesson_learned',
    body: 'When my business partner betrayed me, I spent months planning how to destroy him in return. Then my daughter asked me why I was always angry. That question broke something open inside me. I chose to forgive — not for him, but for myself and my family. That decision led me to community work, and eventually to Open Chain. The cOTK I have earned since then is worth more than anything revenge could have given me.',
    otkReceived: 1850, likes: 67, date: '2026-03-27', featured: false,
  },
  {
    id: 's3', authorUID: 'openchain1ghi...dreamer_lucia', authorName: 'Lucia Mendez',
    title: 'A Dream of Bridges Between Communities',
    category: 'dream_vision',
    body: 'I dream of a world where every community is connected not by roads or wires, but by stories. Where a child in the mountains can hear a grandmother in the delta tell tales of resilience. Where a fisherman shares wisdom with a farmer across an ocean. Open Chain is building that bridge. Every story we share here is a plank in that bridge.',
    otkReceived: 3100, likes: 112, date: '2026-03-26', featured: false,
  },
  {
    id: 's4', authorUID: 'openchain1jkl...elder_mikhail', authorName: 'Mikhail Volkov',
    title: 'The Folk Tale of the Patient River',
    category: 'folk_tale',
    body: 'In our village, the elders told of a river that once flowed uphill. It was patient, they said, because it knew that water always finds its level. When the mountain tried to block its path, the river did not fight — it went around, slowly carving a canyon deeper than the mountain was tall. "Be like the river," my grandfather would say. "Patience is the greatest strength."',
    otkReceived: 1200, likes: 54, date: '2026-03-24', featured: false,
  },
];

const DEMO_CIRCLES: StoryCircle[] = [
  {
    id: 'c1', title: 'Elders Speak: Wisdom from the Past',
    hostName: 'Mikhail Volkov', hostUID: 'openchain1jkl...elder_mikhail',
    theme: 'Intergenerational wisdom and folk tales',
    scheduledDate: '2026-04-01', scheduledTime: '18:00 UTC',
    location: 'Virtual — Open Chain Meeting Room',
    participants: 23, maxParticipants: 50, isLive: false,
  },
  {
    id: 'c2', title: 'Stories of Resilience',
    hostName: 'Amara Okafor', hostUID: 'openchain1abc...narrator_amara',
    theme: 'Overcoming adversity through community',
    scheduledDate: '2026-04-03', scheduledTime: '20:00 UTC',
    location: 'Virtual — Open Chain Meeting Room',
    participants: 31, maxParticipants: 50, isLive: false,
  },
];

const DEMO_FEATURED: FeaturedStoryteller = {
  uid: 'openchain1abc...narrator_amara',
  name: 'Amara Okafor',
  storiesCount: 28,
  totalOTKReceived: 34200,
  topCategory: 'community_history',
  bio: 'Amara preserves the oral histories of West African communities, ensuring that the wisdom of elders reaches future generations through Open Chain. Her stories have inspired 12 new storytelling circles across 4 regions.',
  weekOf: '2026-03-24',
};

export function StorytellingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stories');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterCategory, setFilterCategory] = useState<StoryCategory | null>(null);

  // Share tab state
  const [shareTitle, setShareTitle] = useState('');
  const [shareCategory, setShareCategory] = useState<StoryCategory | null>(null);
  const [shareBody, setShareBody] = useState('');
  const [shareMediaHash, setShareMediaHash] = useState('');

  // Gratitude tip state
  const [tippingStoryId, setTippingStoryId] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  // ─── Derived Data ───

  const sortedStories = useMemo(() => {
    let list = [...DEMO_STORIES];
    if (filterCategory) list = list.filter((s) => s.category === filterCategory);
    if (sortMode === 'recent') list.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortMode === 'popular') list.sort((a, b) => b.likes - a.likes);
    else list = list.filter((s) => s.featured);
    return list;
  }, [sortMode, filterCategory]);

  const categoryLabel = useCallback((key: StoryCategory) =>
    CATEGORIES.find((c) => c.key === key)?.label || key,
  []);

  // ─── Handlers ───

  const handleSubmitStory = useCallback(() => {
    if (!shareTitle.trim()) { Alert.alert('Required', 'Enter a story title.'); return; }
    if (!shareCategory) { Alert.alert('Required', 'Select a story category.'); return; }
    if (!shareBody.trim() || shareBody.trim().length < 50) {
      Alert.alert('Required', 'Your story must be at least 50 characters.'); return;
    }

    Alert.alert(
      'Story Shared',
      `"${shareTitle}" has been submitted to the community feed.\n\nCategory: ${categoryLabel(shareCategory)}\n${shareMediaHash ? 'Media attached.' : 'No media attached.'}`,
    );
    setShareTitle('');
    setShareCategory(null);
    setShareBody('');
    setShareMediaHash('');
    setTab('stories');
  }, [shareTitle, shareCategory, shareBody, shareMediaHash, categoryLabel]);

  const handleSendGratitude = useCallback((storyId: string) => {
    const amount = parseInt(tipAmount, 10);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid OTK amount.'); return; }
    const story = DEMO_STORIES.find((s) => s.id === storyId);
    Alert.alert(
      'Gratitude Sent',
      `You sent ${amount} OTK to ${story?.authorName || 'the storyteller'} for their story.\n\nThank you for recognizing the value of shared narratives.`,
    );
    setTippingStoryId(null);
    setTipAmount('');
  }, [tipAmount]);

  const handleJoinCircle = useCallback((circle: StoryCircle) => {
    if (circle.participants >= circle.maxParticipants) {
      Alert.alert('Full', 'This story circle is at capacity. Check back for the next one.');
      return;
    }
    Alert.alert(
      'Joined Circle',
      `You have joined "${circle.title}" hosted by ${circle.hostName}.\n\nDate: ${circle.scheduledDate}\nTime: ${circle.scheduledTime}\nTheme: ${circle.theme}`,
    );
  }, []);

  // ─── Styles ───

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    sortRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
    sortChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card },
    sortChipActive: { backgroundColor: t.accent.blue },
    sortText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    sortTextActive: { color: '#fff' },
    catRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, flexWrap: 'wrap', marginBottom: 12 },
    catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, marginBottom: 4 },
    catChipActive: { backgroundColor: t.accent.purple },
    catText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    catTextActive: { color: '#fff' },
    storyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    storyTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    storyAuthor: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 4 },
    storyCategory: { color: t.accent.purple, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    storyBody: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 22, marginBottom: 12 },
    storyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    storyMetaText: { color: t.text.muted, fontSize: fonts.sm },
    storyOTK: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    storyFeatured: { color: t.accent.orange || '#FF9500', fontSize: fonts.xs, fontWeight: fonts.bold, marginBottom: 4 },
    gratitudeBtn: { backgroundColor: t.accent.purple + '20', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    gratitudeBtnText: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    tipRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
    tipInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: fonts.md },
    tipSendBtn: { backgroundColor: t.accent.green, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    tipSendText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    // Share tab
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    storyInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 160, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    // Circles tab
    circleCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    circleTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 },
    circleHost: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 4 },
    circleTheme: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginBottom: 8 },
    circleDetail: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 2 },
    circleJoinBtn: { backgroundColor: t.accent.green, paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    circleJoinText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    circleLiveBadge: { backgroundColor: '#FF3B30', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
    circleLiveText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.heavy },
    circleSpots: { color: t.accent.orange || '#FF9500', fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    // Featured tab
    featuredCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 12, alignItems: 'center' },
    featuredIcon: { fontSize: 48, marginBottom: 8 },
    featuredName: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginBottom: 4 },
    featuredWeek: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    featuredBio: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
    featuredStatsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    featuredStat: { alignItems: 'center' },
    featuredStatValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    featuredStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    featuredCategory: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.bold },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40, paddingHorizontal: 40 },
  }), [t]);

  // ─── Tab Renderers ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stories', label: 'Stories' },
    { key: 'share', label: 'Share' },
    { key: 'circles', label: 'Circles' },
    { key: 'featured', label: 'Featured' },
  ];

  const renderStories = () => (
    <>
      <Text style={s.section}>Sort By</Text>
      <View style={s.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[s.sortChip, sortMode === opt.key && s.sortChipActive]}
            onPress={() => setSortMode(opt.key)}
          >
            <Text style={[s.sortText, sortMode === opt.key && s.sortTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.section}>Category Filter</Text>
      <View style={s.catRow}>
        <TouchableOpacity
          style={[s.catChip, !filterCategory && s.catChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[s.catText, !filterCategory && s.catTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.catChip, filterCategory === cat.key && s.catChipActive]}
            onPress={() => setFilterCategory(cat.key)}
          >
            <Text style={[s.catText, filterCategory === cat.key && s.catTextActive]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sortedStories.length === 0 ? (
        <Text style={s.emptyText}>No stories match your filter. Try a different category or sort.</Text>
      ) : (
        sortedStories.map((story) => (
          <View key={story.id} style={s.storyCard}>
            {story.featured && <Text style={s.storyFeatured}>* FEATURED</Text>}
            <Text style={s.storyTitle}>{story.title}</Text>
            <Text style={s.storyAuthor}>{story.authorName}</Text>
            <Text style={s.storyCategory}>{categoryLabel(story.category)}</Text>
            <Text style={s.storyBody}>{story.body}</Text>
            <View style={s.storyMeta}>
              <Text style={s.storyMetaText}>{story.date} | {story.likes} likes</Text>
              <Text style={s.storyOTK}>{story.otkReceived.toLocaleString()} OTK received</Text>
            </View>
            {story.mediaHash && (
              <Text style={[s.storyMetaText, { marginTop: 4 }]}>
                [{story.mediaType || 'media'} attached]
              </Text>
            )}

            {tippingStoryId === story.id ? (
              <View style={s.tipRow}>
                <TextInput
                  style={s.tipInput}
                  placeholder="OTK amount..."
                  placeholderTextColor={t.text.muted}
                  keyboardType="numeric"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                />
                <TouchableOpacity style={s.tipSendBtn} onPress={() => handleSendGratitude(story.id)}>
                  <Text style={s.tipSendText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setTippingStoryId(null); setTipAmount(''); }}>
                  <Text style={[s.storyMetaText, { marginLeft: 4 }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.gratitudeBtn} onPress={() => setTippingStoryId(story.id)}>
                <Text style={s.gratitudeBtnText}>Send Gratitude OTK</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </>
  );

  const renderShare = () => (
    <>
      <View style={[s.featuredCard, { alignItems: 'flex-start', borderRadius: 16, padding: 16 }]}>
        <Text style={[s.storyTitle, { marginBottom: 8 }]}>Share Your Story</Text>
        <Text style={s.storyBody}>
          Every story matters. Share your journey, a lesson, a folk tale, or a dream.
          Stories that resonate may receive gratitude OTK from the community.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Title</Text>
        <TextInput
          style={s.input}
          placeholder="Give your story a title..."
          placeholderTextColor={t.text.muted}
          value={shareTitle}
          onChangeText={setShareTitle}
        />
      </View>

      <Text style={s.section}>Category</Text>
      <View style={s.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[s.catChip, shareCategory === cat.key && s.catChipActive]}
            onPress={() => setShareCategory(cat.key)}
          >
            <Text style={[s.catText, shareCategory === cat.key && s.catTextActive]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Your Story</Text>
        <TextInput
          style={s.storyInput}
          placeholder="Tell your story... (minimum 50 characters)"
          placeholderTextColor={t.text.muted}
          multiline
          value={shareBody}
          onChangeText={setShareBody}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Media Hash (Optional)</Text>
        <TextInput
          style={s.input}
          placeholder="IPFS hash for audio or video..."
          placeholderTextColor={t.text.muted}
          value={shareMediaHash}
          onChangeText={setShareMediaHash}
        />
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitStory}>
        <Text style={s.submitBtnText}>Share Story</Text>
      </TouchableOpacity>
    </>
  );

  const renderCircles = () => (
    <>
      <Text style={s.section}>Story Circles</Text>
      <View style={[s.featuredCard, { alignItems: 'flex-start', borderRadius: 16, padding: 16, marginBottom: 16 }]}>
        <Text style={s.storyBody}>
          Story circles are live gatherings where community members share stories around a theme.
          Join one to listen, learn, and connect.
        </Text>
      </View>

      {DEMO_CIRCLES.map((circle) => (
        <View key={circle.id} style={s.circleCard}>
          {circle.isLive && (
            <View style={s.circleLiveBadge}>
              <Text style={s.circleLiveText}>LIVE NOW</Text>
            </View>
          )}
          <Text style={s.circleTitle}>{circle.title}</Text>
          <Text style={s.circleHost}>Hosted by {circle.hostName}</Text>
          <Text style={s.circleTheme}>Theme: {circle.theme}</Text>
          <Text style={s.circleDetail}>Date: {circle.scheduledDate} at {circle.scheduledTime}</Text>
          <Text style={s.circleDetail}>Location: {circle.location}</Text>
          <Text style={s.circleSpots}>
            {circle.participants}/{circle.maxParticipants} participants
            ({circle.maxParticipants - circle.participants} spots left)
          </Text>
          <TouchableOpacity style={s.circleJoinBtn} onPress={() => handleJoinCircle(circle)}>
            <Text style={s.circleJoinText}>{circle.isLive ? 'Join Live' : 'RSVP'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderFeatured = () => {
    const ft = DEMO_FEATURED;
    return (
      <>
        <Text style={s.section}>Storyteller of the Week</Text>
        <View style={s.featuredCard}>
          <Text style={s.featuredIcon}>S</Text>
          <Text style={s.featuredName}>{ft.name}</Text>
          <Text style={s.featuredWeek}>Week of {ft.weekOf}</Text>
          <Text style={s.featuredBio}>{ft.bio}</Text>
          <View style={s.featuredStatsRow}>
            <View style={s.featuredStat}>
              <Text style={s.featuredStatValue}>{ft.storiesCount}</Text>
              <Text style={s.featuredStatLabel}>Stories</Text>
            </View>
            <View style={s.featuredStat}>
              <Text style={s.featuredStatValue}>{ft.totalOTKReceived.toLocaleString()}</Text>
              <Text style={s.featuredStatLabel}>OTK Received</Text>
            </View>
          </View>
          <Text style={s.featuredCategory}>
            Top Category: {categoryLabel(ft.topCategory as StoryCategory)}
          </Text>
        </View>

        <Text style={s.section}>Previous Featured</Text>
        <View style={s.storyCard}>
          <Text style={s.storyAuthor}>Kenji Tanaka</Text>
          <Text style={[s.storyMetaText, { marginTop: 2 }]}>Week of 2026-03-17 | 19 stories | 22,100 OTK</Text>
          <Text style={s.featuredCategory}>Top: Lesson Learned</Text>
        </View>
        <View style={s.storyCard}>
          <Text style={s.storyAuthor}>Lucia Mendez</Text>
          <Text style={[s.storyMetaText, { marginTop: 2 }]}>Week of 2026-03-10 | 15 stories | 18,600 OTK</Text>
          <Text style={s.featuredCategory}>Top: Dream / Vision</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Storytelling</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'stories' && renderStories()}
        {tab === 'share' && renderShare()}
        {tab === 'circles' && renderCircles()}
        {tab === 'featured' && renderFeatured()}
      </ScrollView>
    </SafeAreaView>
  );
}
