/**
 * Art Studio Screen — Creative expression, community art sharing, cultural creation.
 *
 * Article I: "Every human being deserves access to creative expression
 *  as a fundamental dimension of a fulfilling life."
 * — Human Constitution
 *
 * Features:
 * - Community gallery with artwork shared by members
 * - Art categories: visual arts, music, poetry, dance, crafts, digital art, theater
 * - Submit artwork (title, description, medium, hash reference)
 * - Art collaborations — find partners for joint creative projects
 * - Art workshops — community teaching sessions (earn eOTK for teaching)
 * - Appreciation — send OTK to artists whose work moves you
 * - Featured artist of the week
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

interface ArtworkEntry {
  id: string;
  title: string;
  artist: string;
  medium: string;
  category: string;
  description: string;
  hash: string;
  appreciations: number;
  otkReceived: number;
  date: string;
}

interface ArtWorkshop {
  id: string;
  title: string;
  instructor: string;
  category: string;
  description: string;
  date: string;
  spotsLeft: number;
  eotkReward: number;
  durationHours: number;
}

interface ArtCollaboration {
  id: string;
  title: string;
  initiator: string;
  category: string;
  description: string;
  seekingSkills: string[];
  spotsOpen: number;
  status: 'open' | 'in_progress' | 'completed';
}

interface FeaturedArtist {
  uid: string;
  name: string;
  specialty: string;
  totalWorks: number;
  totalAppreciations: number;
  otkEarned: number;
  bio: string;
  featuredWork: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const ART_CATEGORIES = [
  { key: 'visual', label: 'Visual Arts', icon: 'V' },
  { key: 'music', label: 'Music', icon: 'M' },
  { key: 'poetry', label: 'Poetry', icon: 'P' },
  { key: 'dance', label: 'Dance', icon: 'D' },
  { key: 'crafts', label: 'Crafts', icon: 'C' },
  { key: 'digital', label: 'Digital Art', icon: 'X' },
  { key: 'theater', label: 'Theater', icon: 'T' },
];

const MEDIUM_OPTIONS = [
  'Oil on Canvas', 'Watercolor', 'Charcoal', 'Digital Illustration',
  'Sculpture', 'Photography', 'Mixed Media', 'Ceramics',
  'Textile', 'Woodwork', 'Written Word', 'Musical Composition',
  'Choreography', 'Performance', 'Other',
];

// ─── Demo Data ───

const DEMO_GALLERY: ArtworkEntry[] = [
  {
    id: 'art1', title: 'Sunrise Over the Valley', artist: 'openchain1abc...painter_maya',
    medium: 'Oil on Canvas', category: 'visual',
    description: 'A luminous depiction of dawn breaking over a mountain valley, capturing the first golden light.',
    hash: 'Qm7x9kT3...aF2b', appreciations: 47, otkReceived: 2350, date: '2026-03-26',
  },
  {
    id: 'art2', title: 'Echoes of Home', artist: 'openchain1def...musician_kenji',
    medium: 'Musical Composition', category: 'music',
    description: 'A piano piece inspired by childhood memories, blending folk melodies with modern harmonics.',
    hash: 'QmR4nZ8w...cE5d', appreciations: 83, otkReceived: 4150, date: '2026-03-25',
  },
  {
    id: 'art3', title: 'Still Water Speaks', artist: 'openchain1ghi...poet_amara',
    medium: 'Written Word', category: 'poetry',
    description: 'A collection of three poems exploring stillness, reflection, and the quiet strength of patience.',
    hash: 'QmY2pL6v...gH8f', appreciations: 62, otkReceived: 3100, date: '2026-03-24',
  },
  {
    id: 'art4', title: 'Urban Geometry', artist: 'openchain1jkl...digital_sven',
    medium: 'Digital Illustration', category: 'digital',
    description: 'Abstract digital artwork transforming city architecture into flowing geometric patterns.',
    hash: 'QmK8mW1x...jN3g', appreciations: 35, otkReceived: 1750, date: '2026-03-23',
  },
  {
    id: 'art5', title: 'Threads of Heritage', artist: 'openchain1mno...crafter_lila',
    medium: 'Textile', category: 'crafts',
    description: 'A hand-woven tapestry incorporating traditional patterns from three different cultures.',
    hash: 'QmD5qA9z...mP4h', appreciations: 29, otkReceived: 1450, date: '2026-03-22',
  },
];

const DEMO_WORKSHOPS: ArtWorkshop[] = [
  {
    id: 'ws1', title: 'Introduction to Watercolor Landscapes',
    instructor: 'openchain1abc...painter_maya', category: 'visual',
    description: 'Learn foundational watercolor techniques — wet-on-wet, dry brush, and color mixing for natural landscapes.',
    date: '2026-04-05', spotsLeft: 8, eotkReward: 600, durationHours: 3,
  },
  {
    id: 'ws2', title: 'Spoken Word Poetry Workshop',
    instructor: 'openchain1ghi...poet_amara', category: 'poetry',
    description: 'Discover your voice through spoken word. We cover rhythm, imagery, and performance presence.',
    date: '2026-04-08', spotsLeft: 12, eotkReward: 450, durationHours: 2,
  },
];

const DEMO_COLLABORATION: ArtCollaboration = {
  id: 'collab1', title: 'Mural for Community Center',
  initiator: 'openchain1abc...painter_maya', category: 'visual',
  description: 'Seeking collaborators for a large-scale mural celebrating neighborhood diversity. Will cover the east wall of the Riverside Community Center.',
  seekingSkills: ['Mural Painting', 'Design', 'Scaffolding Setup'],
  spotsOpen: 3, status: 'open',
};

const DEMO_FEATURED_ARTIST: FeaturedArtist = {
  uid: 'openchain1def...musician_kenji',
  name: 'Kenji Tanaka',
  specialty: 'Musical Composition',
  totalWorks: 24,
  totalAppreciations: 412,
  otkEarned: 20600,
  bio: 'Kenji blends traditional Japanese instruments with contemporary piano, creating music that bridges generations. His pieces have been shared across 14 Open Chain communities worldwide.',
  featuredWork: 'Echoes of Home',
};

type Tab = 'gallery' | 'submit' | 'workshops' | 'collaborate';

export function ArtStudioScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitMedium, setSubmitMedium] = useState('');
  const [submitHash, setSubmitHash] = useState('');
  const [submitCategory, setSubmitCategory] = useState('visual');
  const { demoMode } = useWalletStore();
  const t = useTheme();

  // ─── Styles ───

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 6 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '700' },
    tabLabelActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    cardSubtitle: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    cardDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 20 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    statText: { color: t.text.secondary, fontSize: 12 },
    statValue: { color: t.accent.purple, fontSize: 13, fontWeight: '700' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.accent.purple + '20' },
    badgeText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    categoryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap', marginBottom: 8 },
    categoryChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center', minWidth: 70 },
    categoryChipActive: { backgroundColor: t.accent.purple },
    categoryIcon: { fontSize: 18, marginBottom: 2 },
    categoryLabel: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    categoryLabelActive: { color: '#fff' },
    appreciateBtn: { backgroundColor: t.accent.purple, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
    appreciateBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    hashText: { color: t.text.muted, fontSize: 11, fontFamily: 'Courier', marginTop: 6 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    mediumRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
    mediumChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.bg.primary },
    mediumChipActive: { backgroundColor: t.accent.purple },
    mediumLabel: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    mediumLabelActive: { color: '#fff' },
    featuredCard: { backgroundColor: t.accent.purple + '10', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: t.accent.purple + '30' },
    featuredBadge: { backgroundColor: t.accent.purple, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
    featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    featuredName: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    featuredSpecialty: { color: t.accent.purple, fontSize: 13, fontWeight: '600', marginTop: 2 },
    featuredBio: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
    featuredStats: { flexDirection: 'row', gap: 16, marginTop: 14 },
    featuredStat: { alignItems: 'center' },
    featuredStatNum: { color: t.text.primary, fontSize: 16, fontWeight: '800' },
    featuredStatLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    skillTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: t.accent.blue + '20', marginRight: 6, marginTop: 6 },
    skillTagText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    statusOpen: { color: t.accent.green, fontWeight: '700', fontSize: 12 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', marginTop: 10 },
    joinBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  }), [t]);

  // ─── Callbacks ───

  const filteredGallery = useMemo(() => {
    if (!selectedCategory) return DEMO_GALLERY;
    return DEMO_GALLERY.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  const handleAppreciate = useCallback((artwork: ArtworkEntry) => {
    if (!demoMode) {
      Alert.alert('Send Appreciation', `Send 50 OTK to ${artwork.artist.slice(0, 20)}... for "${artwork.title}"?`);
    } else {
      Alert.alert('Demo Mode', `Would send 50 OTK appreciation for "${artwork.title}".`);
    }
  }, [demoMode]);

  const handleSubmitArtwork = useCallback(() => {
    if (!submitTitle.trim() || !submitDescription.trim() || !submitMedium || !submitHash.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields including the file hash.');
      return;
    }
    if (demoMode) {
      Alert.alert('Demo Mode', `Artwork "${submitTitle}" would be submitted to the community gallery.`);
    } else {
      Alert.alert('Submitted', `"${submitTitle}" has been submitted to the community gallery for review.`);
    }
    setSubmitTitle('');
    setSubmitDescription('');
    setSubmitMedium('');
    setSubmitHash('');
  }, [submitTitle, submitDescription, submitMedium, submitHash, demoMode]);

  const handleJoinWorkshop = useCallback((workshop: ArtWorkshop) => {
    if (demoMode) {
      Alert.alert('Demo Mode', `Would register for "${workshop.title}" on ${workshop.date}.`);
    } else {
      Alert.alert('Registered', `You are registered for "${workshop.title}". Earn ${workshop.eotkReward} eOTK for attending!`);
    }
  }, [demoMode]);

  const handleJoinCollaboration = useCallback(() => {
    if (demoMode) {
      Alert.alert('Demo Mode', `Would join collaboration "${DEMO_COLLABORATION.title}".`);
    } else {
      Alert.alert('Request Sent', `Your request to join "${DEMO_COLLABORATION.title}" has been sent to the initiator.`);
    }
  }, [demoMode]);

  // ─── Render: Gallery ───

  const renderGallery = () => (
    <>
      {/* Featured Artist of the Week */}
      <Text style={s.section}>Featured Artist of the Week</Text>
      <View style={s.featuredCard}>
        <View style={s.featuredBadge}>
          <Text style={s.featuredBadgeText}>Featured Artist</Text>
        </View>
        <Text style={s.featuredName}>{DEMO_FEATURED_ARTIST.name}</Text>
        <Text style={s.featuredSpecialty}>{DEMO_FEATURED_ARTIST.specialty}</Text>
        <Text style={s.featuredBio}>{DEMO_FEATURED_ARTIST.bio}</Text>
        <View style={s.featuredStats}>
          <View style={s.featuredStat}>
            <Text style={s.featuredStatNum}>{DEMO_FEATURED_ARTIST.totalWorks}</Text>
            <Text style={s.featuredStatLabel}>Works</Text>
          </View>
          <View style={s.featuredStat}>
            <Text style={s.featuredStatNum}>{DEMO_FEATURED_ARTIST.totalAppreciations}</Text>
            <Text style={s.featuredStatLabel}>Appreciations</Text>
          </View>
          <View style={s.featuredStat}>
            <Text style={s.featuredStatNum}>{DEMO_FEATURED_ARTIST.otkEarned.toLocaleString()}</Text>
            <Text style={s.featuredStatLabel}>OTK Earned</Text>
          </View>
        </View>
        <TouchableOpacity style={[s.appreciateBtn, { marginTop: 14 }]} onPress={() => {
          if (demoMode) Alert.alert('Demo Mode', `Would send 100 OTK appreciation to ${DEMO_FEATURED_ARTIST.name}.`);
          else Alert.alert('Send Appreciation', `Send 100 OTK to featured artist ${DEMO_FEATURED_ARTIST.name}?`);
        }}>
          <Text style={s.appreciateBtnText}>Send Appreciation</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <Text style={s.section}>Browse by Category</Text>
      <View style={s.categoryRow}>
        <TouchableOpacity
          style={[s.categoryChip, !selectedCategory && s.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[s.categoryLabel, !selectedCategory && s.categoryLabelActive]}>All</Text>
        </TouchableOpacity>
        {ART_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.categoryChip, selectedCategory === cat.key && s.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.key === selectedCategory ? null : cat.key)}
          >
            <Text style={s.categoryIcon}>{cat.icon}</Text>
            <Text style={[s.categoryLabel, selectedCategory === cat.key && s.categoryLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gallery Items */}
      <Text style={s.section}>Community Gallery</Text>
      {filteredGallery.length === 0 ? (
        <Text style={s.emptyText}>No artworks in this category yet.</Text>
      ) : (
        filteredGallery.map(art => (
          <View key={art.id} style={s.card}>
            <Text style={s.cardTitle}>{art.title}</Text>
            <Text style={s.cardSubtitle}>by {art.artist.slice(0, 24)}...</Text>
            <View style={[s.cardRow, { marginTop: 4 }]}>
              <View style={s.badge}><Text style={s.badgeText}>{ART_CATEGORIES.find(c => c.key === art.category)?.label || art.category}</Text></View>
              <Text style={s.statText}>{art.medium}</Text>
            </View>
            <Text style={s.cardDesc}>{art.description}</Text>
            <Text style={s.hashText}>IPFS: {art.hash}</Text>
            <View style={s.cardRow}>
              <View>
                <Text style={s.statText}>{art.appreciations} appreciations</Text>
                <Text style={s.statValue}>{art.otkReceived.toLocaleString()} OTK received</Text>
              </View>
              <TouchableOpacity style={s.appreciateBtn} onPress={() => handleAppreciate(art)}>
                <Text style={s.appreciateBtnText}>Appreciate 50 OTK</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );

  // ─── Render: Submit ───

  const renderSubmit = () => (
    <>
      <Text style={s.section}>Submit Your Artwork</Text>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Title</Text>
        <TextInput
          style={s.input}
          value={submitTitle}
          onChangeText={setSubmitTitle}
          placeholder="Name your artwork"
          placeholderTextColor={t.text.muted}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Category</Text>
        <View style={s.categoryRow}>
          {ART_CATEGORIES.map(cat => (
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
        <Text style={s.inputLabel}>Medium</Text>
        <View style={s.mediumRow}>
          {MEDIUM_OPTIONS.map(med => (
            <TouchableOpacity
              key={med}
              style={[s.mediumChip, submitMedium === med && s.mediumChipActive]}
              onPress={() => setSubmitMedium(med)}
            >
              <Text style={[s.mediumLabel, submitMedium === med && s.mediumLabelActive]}>{med}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={s.textArea}
          value={submitDescription}
          onChangeText={setSubmitDescription}
          placeholder="Describe your artwork, its inspiration, and meaning"
          placeholderTextColor={t.text.muted}
          multiline
          numberOfLines={5}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>File Hash (IPFS / Off-Chain Reference)</Text>
        <TextInput
          style={s.input}
          value={submitHash}
          onChangeText={setSubmitHash}
          placeholder="QmXyz... or other content hash"
          placeholderTextColor={t.text.muted}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmitArtwork}>
        <Text style={s.submitBtnText}>Submit to Gallery</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Render: Workshops ───

  const renderWorkshops = () => (
    <>
      <Text style={s.section}>Upcoming Workshops</Text>
      <View style={[s.card, { marginBottom: 0 }]}>
        <Text style={[s.statText, { textAlign: 'center', lineHeight: 20 }]}>
          Teach a workshop and earn eOTK (education tokens) for sharing your creative skills with the community.
        </Text>
      </View>

      {DEMO_WORKSHOPS.map(ws => (
        <View key={ws.id} style={s.card}>
          <Text style={s.cardTitle}>{ws.title}</Text>
          <Text style={s.cardSubtitle}>by {ws.instructor.slice(0, 24)}...</Text>
          <View style={[s.cardRow, { marginTop: 4 }]}>
            <View style={s.badge}><Text style={s.badgeText}>{ART_CATEGORIES.find(c => c.key === ws.category)?.label || ws.category}</Text></View>
            <Text style={s.statText}>{ws.durationHours}h</Text>
          </View>
          <Text style={s.cardDesc}>{ws.description}</Text>
          <View style={s.cardRow}>
            <View>
              <Text style={s.statText}>{ws.date}</Text>
              <Text style={s.statText}>{ws.spotsLeft} spots left</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.statValue}>{ws.eotkReward} eOTK reward</Text>
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinWorkshop(ws)}>
                <Text style={s.joinBtnText}>Join Workshop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <Text style={s.section}>Host a Workshop</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Share Your Skills</Text>
        <Text style={s.cardDesc}>
          Have a creative skill to teach? Host a community workshop and earn eOTK for every participant.
          Workshops can be in-person or virtual, covering any art form from painting to digital design.
        </Text>
        <TouchableOpacity style={[s.submitBtn, { marginHorizontal: 0, marginTop: 14 }]} onPress={() => {
          if (demoMode) Alert.alert('Demo Mode', 'Would open workshop creation form.');
          else Alert.alert('Coming Soon', 'Workshop hosting will be available in the next update.');
        }}>
          <Text style={s.submitBtnText}>Create Workshop</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Render: Collaborate ───

  const renderCollaborate = () => (
    <>
      <Text style={s.section}>Open Collaborations</Text>
      <View style={s.card}>
        <View style={[s.cardRow, { marginTop: 0 }]}>
          <Text style={s.cardTitle}>{DEMO_COLLABORATION.title}</Text>
          <Text style={s.statusOpen}>{DEMO_COLLABORATION.status.toUpperCase()}</Text>
        </View>
        <Text style={s.cardSubtitle}>by {DEMO_COLLABORATION.initiator.slice(0, 24)}...</Text>
        <View style={[s.cardRow, { marginTop: 4 }]}>
          <View style={s.badge}><Text style={s.badgeText}>{ART_CATEGORIES.find(c => c.key === DEMO_COLLABORATION.category)?.label || DEMO_COLLABORATION.category}</Text></View>
          <Text style={s.statText}>{DEMO_COLLABORATION.spotsOpen} spots open</Text>
        </View>
        <Text style={s.cardDesc}>{DEMO_COLLABORATION.description}</Text>
        <Text style={[s.section, { marginLeft: 0, marginTop: 14, marginBottom: 4 }]}>Skills Needed</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DEMO_COLLABORATION.seekingSkills.map(skill => (
            <View key={skill} style={s.skillTag}>
              <Text style={s.skillTagText}>{skill}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.joinBtn} onPress={handleJoinCollaboration}>
          <Text style={s.joinBtnText}>Request to Join</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Start a Collaboration</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Find Creative Partners</Text>
        <Text style={s.cardDesc}>
          Have an ambitious creative project? Post a collaboration request and find community members
          with complementary skills. From murals to musicals, the best art is made together.
        </Text>
        <TouchableOpacity style={[s.submitBtn, { marginHorizontal: 0, marginTop: 14 }]} onPress={() => {
          if (demoMode) Alert.alert('Demo Mode', 'Would open collaboration creation form.');
          else Alert.alert('Coming Soon', 'Collaboration posting will be available in the next update.');
        }}>
          <Text style={s.submitBtnText}>Post Collaboration</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Main Render ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'gallery', label: 'Gallery' },
    { key: 'submit', label: 'Submit' },
    { key: 'workshops', label: 'Workshops' },
    { key: 'collaborate', label: 'Collab' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Art Studio</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>A</Text>
          <Text style={s.heroTitle}>Art I</Text>
          <Text style={s.heroSubtitle}>
            Creative expression, community art sharing, and cultural creation.{'\n'}
            Every human deserves a canvas.
          </Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'gallery' && renderGallery()}
        {tab === 'submit' && renderSubmit()}
        {tab === 'workshops' && renderWorkshops()}
        {tab === 'collaborate' && renderCollaborate()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
