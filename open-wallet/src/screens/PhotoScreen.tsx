import { fonts } from '../utils/theme';
/**
 * Photo Screen — Community photography, visual storytelling, photo challenges.
 *
 * Art I: "Creative expression through photography strengthens community bonds
 *  and preserves shared memory."
 * — Human Constitution, Article V, Section 2
 *
 * Features:
 * - Community gallery — photos shared by members (title, photographer, description, hash)
 * - Photo challenges (weekly themes: nature, portraits, community life, architecture)
 * - Submit photo (title, description, category, IPFS hash)
 * - Photography workshops (community members teaching — earn eOTK)
 * - Photo walk events (group photography outings)
 * - Appreciation — send OTK to photographers
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

interface GalleryPhoto {
  id: string;
  title: string;
  photographer: string;
  photographerUID: string;
  description: string;
  ipfsHash: string;
  category: string;
  likes: number;
  otkReceived: number;
  date: string;
}

interface PhotoChallenge {
  id: string;
  theme: string;
  description: string;
  startDate: string;
  endDate: string;
  submissions: number;
  otkPrizePool: number;
  status: 'active' | 'upcoming' | 'completed';
}

interface Workshop {
  id: string;
  title: string;
  instructor: string;
  instructorUID: string;
  topic: string;
  date: string;
  spotsLeft: number;
  eotkReward: number;
}

interface PhotoWalkEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  participants: number;
  maxParticipants: number;
  organizer: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = [
  { key: 'nature', label: 'Nature', icon: 'N' },
  { key: 'portraits', label: 'Portraits', icon: 'P' },
  { key: 'community', label: 'Community Life', icon: 'C' },
  { key: 'architecture', label: 'Architecture', icon: 'A' },
  { key: 'street', label: 'Street', icon: 'S' },
  { key: 'abstract', label: 'Abstract', icon: '~' },
];

// ─── Demo Data ───

const DEMO_GALLERY: GalleryPhoto[] = [
  { id: 'p1', title: 'Golden Hour at the River', photographer: 'Mei Lin', photographerUID: 'openchain1abc...photo_mei', description: 'Sunset reflections along the community riverbank', ipfsHash: 'Qm...abc1', category: 'nature', likes: 42, otkReceived: 850, date: '2026-03-28' },
  { id: 'p2', title: 'Hands That Built This Town', photographer: 'Carlos Rivera', photographerUID: 'openchain1def...photo_carlos', description: 'Portrait series of our community elders', ipfsHash: 'Qm...abc2', category: 'portraits', likes: 67, otkReceived: 1200, date: '2026-03-27' },
  { id: 'p3', title: 'Market Day Morning', photographer: 'Aisha Okafor', photographerUID: 'openchain1ghi...photo_aisha', description: 'The vibrant energy of the Saturday farmers market', ipfsHash: 'Qm...abc3', category: 'community', likes: 38, otkReceived: 620, date: '2026-03-26' },
  { id: 'p4', title: 'Old Library Arches', photographer: 'Sam Patel', photographerUID: 'openchain1jkl...photo_sam', description: 'The forgotten beauty of the 1920s library wing', ipfsHash: 'Qm...abc4', category: 'architecture', likes: 29, otkReceived: 480, date: '2026-03-25' },
  { id: 'p5', title: 'Rain on Cobblestones', photographer: 'Yuki Tanaka', photographerUID: 'openchain1mno...photo_yuki', description: 'Abstract patterns of rain in the old quarter', ipfsHash: 'Qm...abc5', category: 'street', likes: 51, otkReceived: 940, date: '2026-03-24' },
];

const DEMO_CHALLENGES: PhotoChallenge[] = [
  { id: 'c1', theme: 'Community Portraits', description: 'Capture the faces and stories of your neighbors. Show the humanity in everyday interactions.', startDate: '2026-03-24', endDate: '2026-03-31', submissions: 23, otkPrizePool: 5000, status: 'active' },
  { id: 'c2', theme: 'Hidden Architecture', description: 'Find beauty in overlooked structures — doorways, staircases, rooftops, forgotten details.', startDate: '2026-03-31', endDate: '2026-04-07', submissions: 0, otkPrizePool: 5000, status: 'upcoming' },
];

const DEMO_WORKSHOP: Workshop = {
  id: 'w1', title: 'Natural Light Portraiture', instructor: 'Carlos Rivera', instructorUID: 'openchain1def...photo_carlos', topic: 'Using window light and golden hour for compelling portraits', date: '2026-04-05', spotsLeft: 6, eotkReward: 300,
};

const DEMO_EVENTS: PhotoWalkEvent[] = [
  { id: 'e1', title: 'Historic District Walk', location: 'Main Street & 3rd Ave', date: '2026-04-02', participants: 12, maxParticipants: 20, organizer: 'Mei Lin' },
  { id: 'e2', title: 'Sunrise at the Lake', location: 'Mirror Lake Park', date: '2026-04-06', participants: 8, maxParticipants: 15, organizer: 'Yuki Tanaka' },
];

type Tab = 'gallery' | 'challenges' | 'submit' | 'events';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gallery', label: 'Gallery' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'submit', label: 'Submit' },
  { key: 'events', label: 'Events' },
];

export function PhotoScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('gallery');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitCategory, setSubmitCategory] = useState('');
  const [submitHash, setSubmitHash] = useState('');
  const [appreciateId, setAppreciateId] = useState<string | null>(null);
  const [appreciateAmount, setAppreciateAmount] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const gallery = DEMO_GALLERY;
  const challenges = DEMO_CHALLENGES;
  const workshop = DEMO_WORKSHOP;
  const events = DEMO_EVENTS;

  const handleSubmitPhoto = useCallback(() => {
    if (!submitTitle.trim()) { Alert.alert('Required', 'Enter a title for your photo.'); return; }
    if (!submitDescription.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
    if (!submitCategory) { Alert.alert('Required', 'Select a category.'); return; }
    if (!submitHash.trim()) { Alert.alert('Required', 'Enter the IPFS hash of your photo.'); return; }

    Alert.alert(
      'Photo Submitted',
      `"${submitTitle}" submitted to the community gallery.\nCategory: ${submitCategory}\nIPFS: ${submitHash.substring(0, 12)}...`,
    );
    setSubmitTitle('');
    setSubmitDescription('');
    setSubmitCategory('');
    setSubmitHash('');
    setTab('gallery');
  }, [submitTitle, submitDescription, submitCategory, submitHash]);

  const handleAppreciate = useCallback((photoId: string, photographer: string) => {
    if (appreciateId === photoId && appreciateAmount) {
      const amount = parseFloat(appreciateAmount);
      if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid OTK amount.'); return; }
      Alert.alert('Appreciation Sent', `${amount} OTK sent to ${photographer} for their photo.`);
      setAppreciateId(null);
      setAppreciateAmount('');
    } else {
      setAppreciateId(photoId);
      setAppreciateAmount('');
    }
  }, [appreciateId, appreciateAmount]);

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
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    photoCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    photoPlaceholder: { backgroundColor: t.bg.primary, borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    photoPlaceholderText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    photoTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    photoMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    photoDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 19 },
    photoStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    statText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    appreciateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    appreciateInput: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, color: t.text.primary, fontSize: fonts.md },
    appreciateBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
    appreciateBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    challengeCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    challengeTheme: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    challengeDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, lineHeight: 19 },
    challengeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    multiInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, minHeight: 80, textAlignVertical: 'top' },
    categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    categoryChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.primary, alignItems: 'center' },
    categoryChipActive: { backgroundColor: t.accent.purple },
    categoryIcon: { fontSize: fonts.xl, marginBottom: 2 },
    categoryLabel: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    categoryLabelActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    eventParticipants: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 6 },
    workshopCard: { backgroundColor: t.accent.orange + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    workshopTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    workshopMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    workshopTopic: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 19 },
    workshopReward: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 8 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    note: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  // ─── Gallery Tab ───
  const renderGallery = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'📷'}</Text>
        <Text style={s.heroTitle}>Community Gallery</Text>
        <Text style={s.heroSubtitle}>
          Visual stories from our community.{'\n'}Every photo captures a moment of shared life.
        </Text>
      </View>
      <Text style={s.sectionTitle}>{gallery.length} Photos Shared</Text>
      {gallery.map((photo) => (
        <View key={photo.id} style={s.photoCard}>
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>IPFS: {photo.ipfsHash}</Text>
          </View>
          <Text style={s.photoTitle}>{photo.title}</Text>
          <Text style={s.photoMeta}>by {photo.photographer}  ·  {photo.category}  ·  {photo.date}</Text>
          <Text style={s.photoDesc}>{photo.description}</Text>
          <View style={s.photoStats}>
            <Text style={s.statText}>{photo.likes} likes</Text>
            <Text style={s.statText}>{photo.otkReceived} OTK received</Text>
          </View>
          <View style={s.appreciateRow}>
            {appreciateId === photo.id ? (
              <>
                <TextInput
                  style={s.appreciateInput}
                  placeholder="OTK amount"
                  placeholderTextColor={t.text.muted}
                  keyboardType="numeric"
                  value={appreciateAmount}
                  onChangeText={setAppreciateAmount}
                />
                <TouchableOpacity style={s.appreciateBtn} onPress={() => handleAppreciate(photo.id, photo.photographer)}>
                  <Text style={s.appreciateBtnText}>Send</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.appreciateBtn} onPress={() => handleAppreciate(photo.id, photo.photographer)}>
                <Text style={s.appreciateBtnText}>Appreciate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Challenges Tab ───
  const renderChallenges = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'🏆'}</Text>
        <Text style={s.heroTitle}>Photo Challenges</Text>
        <Text style={s.heroSubtitle}>
          Weekly themes to inspire your lens.{'\n'}Submit entries and win from the OTK prize pool.
        </Text>
      </View>
      {challenges.map((ch) => {
        const isActive = ch.status === 'active';
        const statusColor = isActive ? t.accent.green : t.accent.orange;
        return (
          <View key={ch.id} style={s.challengeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.challengeTheme}>{ch.theme}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[s.statusText, { color: statusColor }]}>{ch.status}</Text>
              </View>
            </View>
            <Text style={s.challengeDesc}>{ch.description}</Text>
            <View style={s.challengeMeta}>
              <Text style={s.statText}>{ch.submissions} submissions</Text>
              <Text style={s.statText}>{ch.otkPrizePool} OTK prize</Text>
              <Text style={s.statText}>{ch.startDate} - {ch.endDate}</Text>
            </View>
            {isActive && (
              <TouchableOpacity style={s.joinBtn} onPress={() => setTab('submit')}>
                <Text style={s.joinBtnText}>Submit Entry</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );

  // ─── Submit Tab ───
  const renderSubmit = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'🖼️'}</Text>
        <Text style={s.heroTitle}>Share Your Photo</Text>
        <Text style={s.heroSubtitle}>
          Upload to IPFS and share with the community.{'\n'}Earn OTK when others appreciate your work.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Title</Text>
        <TextInput
          style={s.input}
          placeholder="Photo title"
          placeholderTextColor={t.text.muted}
          value={submitTitle}
          onChangeText={setSubmitTitle}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={s.multiInput}
          placeholder="Tell the story behind this photo..."
          placeholderTextColor={t.text.muted}
          multiline
          value={submitDescription}
          onChangeText={setSubmitDescription}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Category</Text>
        <View style={s.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.categoryChip, submitCategory === cat.key && s.categoryChipActive]}
              onPress={() => setSubmitCategory(cat.key)}
            >
              <Text style={s.categoryIcon}>{cat.icon}</Text>
              <Text style={[s.categoryLabel, submitCategory === cat.key && s.categoryLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>IPFS Hash</Text>
        <TextInput
          style={s.input}
          placeholder="Qm..."
          placeholderTextColor={t.text.muted}
          value={submitHash}
          onChangeText={setSubmitHash}
        />
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitPhoto}>
        <Text style={s.submitBtnText}>Submit Photo</Text>
      </TouchableOpacity>

      <Text style={s.note}>
        Photos are stored on IPFS for permanent, decentralized access.{'\n'}
        Community members can send OTK to show appreciation.
      </Text>
    </>
  );

  // ─── Events Tab ───
  const renderEvents = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'🚶'}</Text>
        <Text style={s.heroTitle}>Photo Events</Text>
        <Text style={s.heroSubtitle}>
          Workshops and photo walks to grow together.{'\n'}Learn, share, and explore through the lens.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Workshop</Text>
      <View style={s.workshopCard}>
        <Text style={s.workshopTitle}>{workshop.title}</Text>
        <Text style={s.workshopMeta}>by {workshop.instructor}  ·  {workshop.date}  ·  {workshop.spotsLeft} spots left</Text>
        <Text style={s.workshopTopic}>{workshop.topic}</Text>
        <Text style={s.workshopReward}>Instructor earns {workshop.eotkReward} eOTK</Text>
        <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Joined', `You joined "${workshop.title}".`)}>
          <Text style={s.joinBtnText}>Join Workshop</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Photo Walks</Text>
      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{ev.title}</Text>
          <Text style={s.eventMeta}>{ev.location}  ·  {ev.date}</Text>
          <Text style={s.eventMeta}>Organized by {ev.organizer}</Text>
          <Text style={s.eventParticipants}>{ev.participants}/{ev.maxParticipants} participants</Text>
          <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Joined', `You joined "${ev.title}".`)}>
            <Text style={s.joinBtnText}>Join Walk</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Photography</Text>
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
        {tab === 'gallery' && renderGallery()}
        {tab === 'challenges' && renderChallenges()}
        {tab === 'submit' && renderSubmit()}
        {tab === 'events' && renderEvents()}
      </ScrollView>
    </SafeAreaView>
  );
}
