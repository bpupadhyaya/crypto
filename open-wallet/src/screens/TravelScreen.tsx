/**
 * Travel Screen — Community-based ethical tourism, cultural immersion.
 *
 * Article X: "Inter-regional cooperation shall be encouraged through
 *  cultural exchange, shared resources, and mutual respect."
 * — The Human Constitution
 *
 * Features:
 * - Community stays — host visitors or stay with community members (homestay)
 * - Cultural experiences — guided tours, cooking classes, craft workshops by locals
 * - Ethical travel guide — responsible tourism principles per region
 * - Host registration (list your home, set availability, OTK rate)
 * - Traveler reviews and host ratings
 * - Inter-regional cultural bridge (connects Art X inter-regional cooperation)
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

interface CommunityStay {
  id: string;
  hostUID: string;
  hostName: string;
  region: string;
  title: string;
  description: string;
  otkPerNight: number;
  maxGuests: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  available: boolean;
}

interface CulturalExperience {
  id: string;
  hostUID: string;
  hostName: string;
  region: string;
  title: string;
  category: ExperienceCategory;
  description: string;
  durationHours: number;
  otkCost: number;
  rating: number;
  reviewCount: number;
  maxParticipants: number;
  spotsLeft: number;
  nextDate: string;
}

interface EthicalGuide {
  id: string;
  region: string;
  title: string;
  principles: string[];
  culturalNotes: string;
  doList: string[];
  dontList: string[];
}

interface HostRegistration {
  title: string;
  description: string;
  region: string;
  otkPerNight: string;
  maxGuests: string;
  amenities: string;
  availableFrom: string;
  availableTo: string;
}

interface Props {
  onClose: () => void;
}

type ExperienceCategory = 'tour' | 'cooking' | 'craft' | 'music' | 'ceremony' | 'nature';
type Tab = 'stays' | 'experiences' | 'host' | 'guide';

// ─── Constants ───

const EXPERIENCE_CATEGORIES: { key: ExperienceCategory; label: string; icon: string }[] = [
  { key: 'tour', label: 'Guided Tour', icon: 'T' },
  { key: 'cooking', label: 'Cooking Class', icon: 'C' },
  { key: 'craft', label: 'Craft Workshop', icon: 'W' },
  { key: 'music', label: 'Music / Dance', icon: 'M' },
  { key: 'ceremony', label: 'Ceremony', icon: 'R' },
  { key: 'nature', label: 'Nature Walk', icon: 'N' },
];

const STAR_DISPLAY = (rating: number) => `${rating.toFixed(1)}/5.0`;

// ─── Demo Data ───

const DEMO_STAYS: CommunityStay[] = [
  {
    id: 'st1', hostUID: 'openchain1abc...host_priya', hostName: 'Priya Sharma',
    region: 'Rajasthan, India', title: 'Desert Heritage Homestay',
    description: 'A traditional haveli room in the heart of Jaisalmer. Wake up to chai on the rooftop with views of the golden fort. Home-cooked Rajasthani meals included. My family has lived here for five generations — we love sharing our stories and culture with travelers.',
    otkPerNight: 150, maxGuests: 4, rating: 4.9, reviewCount: 47,
    amenities: ['Home meals', 'Rooftop terrace', 'Cultural stories', 'Walking tour guide'],
    available: true,
  },
  {
    id: 'st2', hostUID: 'openchain1def...host_kofi', hostName: 'Kofi Asante',
    region: 'Ashanti Region, Ghana', title: 'Village Compound Stay',
    description: 'Stay in a guest room within our family compound in a traditional Ashanti village. Participate in daily village life — farming, cooking, drumming circles. Experience genuine community living, not just tourism.',
    otkPerNight: 100, maxGuests: 2, rating: 4.8, reviewCount: 31,
    amenities: ['Community meals', 'Drumming lessons', 'Farm experience', 'Language basics'],
    available: true,
  },
  {
    id: 'st3', hostUID: 'openchain1ghi...host_elena', hostName: 'Elena Rossi',
    region: 'Tuscany, Italy', title: 'Olive Farm Cottage',
    description: 'A rustic cottage on our family olive farm in the Chianti hills. Join the harvest season, learn to press olive oil, cook with us in the evening. We believe in slow living and genuine connection with the land and its people.',
    otkPerNight: 200, maxGuests: 3, rating: 4.7, reviewCount: 62,
    amenities: ['Olive oil tasting', 'Cooking evenings', 'Vineyard walks', 'Farm-to-table meals'],
    available: false,
  },
];

const DEMO_EXPERIENCES: CulturalExperience[] = [
  {
    id: 'ex1', hostUID: 'openchain1abc...host_priya', hostName: 'Priya Sharma',
    region: 'Rajasthan, India', title: 'Traditional Block Printing Workshop',
    category: 'craft', description: 'Learn the ancient art of hand block printing on fabric using natural dyes. Take home your own creation.',
    durationHours: 3, otkCost: 80, rating: 4.9, reviewCount: 28,
    maxParticipants: 8, spotsLeft: 3, nextDate: '2026-04-02',
  },
  {
    id: 'ex2', hostUID: 'openchain1def...host_kofi', hostName: 'Kofi Asante',
    region: 'Ashanti Region, Ghana', title: 'West African Drumming Circle',
    category: 'music', description: 'Join a traditional djembe drumming session led by master drummers. Learn rhythms passed down through generations.',
    durationHours: 2, otkCost: 60, rating: 4.8, reviewCount: 19,
    maxParticipants: 12, spotsLeft: 7, nextDate: '2026-04-01',
  },
  {
    id: 'ex3', hostUID: 'openchain1ghi...host_elena', hostName: 'Elena Rossi',
    region: 'Tuscany, Italy', title: 'Nonna\'s Pasta Making Class',
    category: 'cooking', description: 'Learn to make fresh pasta from scratch with recipes that have been in the Rossi family for four generations. Includes a full meal.',
    durationHours: 4, otkCost: 120, rating: 5.0, reviewCount: 43,
    maxParticipants: 6, spotsLeft: 1, nextDate: '2026-04-05',
  },
  {
    id: 'ex4', hostUID: 'openchain1jkl...guide_hiroshi', hostName: 'Hiroshi Yamamoto',
    region: 'Kyoto, Japan', title: 'Temple Garden Meditation Walk',
    category: 'nature', description: 'A guided mindful walk through hidden temple gardens, followed by a tea ceremony. Experience the stillness that Kyoto preserves.',
    durationHours: 3, otkCost: 90, rating: 4.9, reviewCount: 55,
    maxParticipants: 10, spotsLeft: 4, nextDate: '2026-04-03',
  },
];

const DEMO_GUIDES: EthicalGuide[] = [
  {
    id: 'g1', region: 'Rajasthan, India', title: 'Ethical Travel in Rajasthan',
    principles: [
      'Respect local customs around dress and behavior at religious sites',
      'Support community-owned businesses over foreign-owned chains',
      'Ask permission before photographing people',
    ],
    culturalNotes: 'Rajasthan has a rich tradition of hospitality (Atithi Devo Bhava — the guest is God). Respect this by being a thoughtful guest. Remove shoes when entering homes. Accept offered chai or water as a sign of respect.',
    doList: ['Dress modestly at temples and villages', 'Learn a few Hindi/Rajasthani greetings', 'Buy directly from artisans', 'Tip local guides fairly in OTK'],
    dontList: ['Photograph people without consent', 'Haggle aggressively with small vendors', 'Waste water — it is precious in the desert', 'Touch sacred objects without permission'],
  },
  {
    id: 'g2', region: 'Ashanti Region, Ghana', title: 'Responsible Tourism in Ashanti',
    principles: [
      'Engage with communities as equals, not as spectacles',
      'Contribute to the local economy through fair OTK exchanges',
      'Learn about the history before visiting cultural sites',
    ],
    culturalNotes: 'The Ashanti people have a deep tradition of community and respect for elders. Greet elders first in any gathering. The left hand is considered disrespectful for giving/receiving — use your right hand or both hands.',
    doList: ['Greet elders first and with respect', 'Participate in community activities if invited', 'Support local craft markets', 'Learn basic Twi greetings (Akwaaba = Welcome)'],
    dontList: ['Treat village visits as a zoo', 'Refuse offered food or drink without explanation', 'Take cultural artifacts as souvenirs', 'Speak over elders in gatherings'],
  },
];

// ─── Helpers ───

const INITIAL_HOST_FORM: HostRegistration = {
  title: '', description: '', region: '', otkPerNight: '',
  maxGuests: '', amenities: '', availableFrom: '', availableTo: '',
};

export function TravelScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('stays');
  const [filterCategory, setFilterCategory] = useState<ExperienceCategory | null>(null);

  // Host registration state
  const [hostForm, setHostForm] = useState<HostRegistration>(INITIAL_HOST_FORM);

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  // ─── Derived Data ───

  const filteredExperiences = useMemo(() => {
    if (!filterCategory) return DEMO_EXPERIENCES;
    return DEMO_EXPERIENCES.filter((e) => e.category === filterCategory);
  }, [filterCategory]);

  const categoryLabel = useCallback((key: ExperienceCategory) =>
    EXPERIENCE_CATEGORIES.find((c) => c.key === key)?.label || key,
  []);

  // ─── Handlers ───

  const handleBookStay = useCallback((stay: CommunityStay) => {
    if (!stay.available) {
      Alert.alert('Unavailable', `${stay.title} is currently not accepting guests. Check back later.`);
      return;
    }
    Alert.alert(
      'Booking Request Sent',
      `You have requested to stay at "${stay.title}" with ${stay.hostName} in ${stay.region}.\n\nRate: ${stay.otkPerNight} OTK/night\nMax guests: ${stay.maxGuests}\n\nThe host will confirm your booking.`,
    );
  }, []);

  const handleBookExperience = useCallback((exp: CulturalExperience) => {
    if (exp.spotsLeft <= 0) {
      Alert.alert('Full', 'This experience is fully booked. Check the next available date.');
      return;
    }
    Alert.alert(
      'Experience Booked',
      `You have booked "${exp.title}" with ${exp.hostName}.\n\nDate: ${exp.nextDate}\nDuration: ${exp.durationHours} hours\nCost: ${exp.otkCost} OTK\n\nSpots remaining: ${exp.spotsLeft - 1}`,
    );
  }, []);

  const handleHostSubmit = useCallback(() => {
    if (!hostForm.title.trim()) { Alert.alert('Required', 'Enter a listing title.'); return; }
    if (!hostForm.region.trim()) { Alert.alert('Required', 'Enter your region.'); return; }
    if (!hostForm.description.trim()) { Alert.alert('Required', 'Describe your space.'); return; }
    const rate = parseInt(hostForm.otkPerNight, 10);
    if (!rate || rate <= 0) { Alert.alert('Required', 'Enter a valid OTK rate per night.'); return; }
    const guests = parseInt(hostForm.maxGuests, 10);
    if (!guests || guests <= 0) { Alert.alert('Required', 'Enter maximum guests.'); return; }

    Alert.alert(
      'Listing Submitted',
      `"${hostForm.title}" in ${hostForm.region} has been submitted for review.\n\nRate: ${rate} OTK/night\nMax guests: ${guests}\n\nYour listing will appear once approved.`,
    );
    setHostForm(INITIAL_HOST_FORM);
  }, [hostForm]);

  // ─── Styles ───

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    // Stay cards
    stayCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    stayTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    stayHost: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginBottom: 2 },
    stayRegion: { color: t.accent.purple, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    stayDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    stayMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    stayRate: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    stayRating: { color: t.accent.orange || '#FF9500', fontSize: 13, fontWeight: '700' },
    stayAmenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    amenityChip: { backgroundColor: t.bg.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
    amenityText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    stayAvail: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    stayAvailYes: { color: t.accent.green },
    stayAvailNo: { color: '#FF3B30' },
    bookBtn: { backgroundColor: t.accent.green, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    bookBtnDisabled: { backgroundColor: t.bg.primary },
    bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    bookBtnTextDisabled: { color: t.text.muted },
    // Experience cards
    expCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    expTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    expHost: { color: t.accent.blue, fontSize: 13, fontWeight: '600', marginBottom: 2 },
    expCategory: { color: t.accent.purple, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    expDesc: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    expMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    expCost: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    expDuration: { color: t.text.muted, fontSize: 12 },
    expSpots: { color: t.accent.orange || '#FF9500', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    expDate: { color: t.text.muted, fontSize: 12, marginBottom: 10 },
    catRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, flexWrap: 'wrap', marginBottom: 12 },
    catChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.card, marginBottom: 4 },
    catChipActive: { backgroundColor: t.accent.purple },
    catText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    catTextActive: { color: '#fff' },
    // Host registration
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    descInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputHalf: { flex: 1 },
    // Guide cards
    guideCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    guideTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    guideRegion: { color: t.accent.purple, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    guideNotes: { color: t.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    guideSubhead: { color: t.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 8 },
    guidePrinciple: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginBottom: 4, paddingLeft: 8 },
    guideDo: { color: t.accent.green, fontSize: 13, lineHeight: 20, marginBottom: 4, paddingLeft: 8 },
    guideDont: { color: '#FF3B30', fontSize: 13, lineHeight: 20, marginBottom: 4, paddingLeft: 8 },
    heroCard: { backgroundColor: t.accent.purple + '10', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8, marginBottom: 8 },
    heroText: { color: t.text.secondary, fontSize: 14, lineHeight: 22 },
    heroTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 40 },
    reviewCount: { color: t.text.muted, fontSize: 12, marginLeft: 4 },
  }), [t]);

  // ─── Tab Renderers ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stays', label: 'Stays' },
    { key: 'experiences', label: 'Experiences' },
    { key: 'host', label: 'Host' },
    { key: 'guide', label: 'Guide' },
  ];

  const renderStays = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Community Stays</Text>
        <Text style={s.heroText}>
          Stay with real families in real communities. Not a hotel — a home.
          Every booking supports the local community through OTK.
        </Text>
      </View>

      <Text style={s.section}>Available Stays</Text>

      {DEMO_STAYS.map((stay) => (
        <View key={stay.id} style={s.stayCard}>
          <Text style={s.stayTitle}>{stay.title}</Text>
          <Text style={s.stayHost}>{stay.hostName}</Text>
          <Text style={s.stayRegion}>{stay.region}</Text>
          <Text style={s.stayDesc}>{stay.description}</Text>

          <View style={s.stayAmenities}>
            {stay.amenities.map((a, i) => (
              <View key={i} style={s.amenityChip}>
                <Text style={s.amenityText}>{a}</Text>
              </View>
            ))}
          </View>

          <View style={s.stayMeta}>
            <Text style={s.stayRate}>{stay.otkPerNight} OTK/night</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={s.stayRating}>{STAR_DISPLAY(stay.rating)}</Text>
              <Text style={s.reviewCount}>({stay.reviewCount})</Text>
            </View>
          </View>

          <Text style={[s.stayAvail, stay.available ? s.stayAvailYes : s.stayAvailNo]}>
            {stay.available ? 'Available for booking' : 'Currently unavailable'}
          </Text>
          <Text style={{ color: t.text.muted, fontSize: 12, marginBottom: 10 }}>
            Max {stay.maxGuests} guests
          </Text>

          <TouchableOpacity
            style={[s.bookBtn, !stay.available && s.bookBtnDisabled]}
            onPress={() => handleBookStay(stay)}
          >
            <Text style={[s.bookBtnText, !stay.available && s.bookBtnTextDisabled]}>
              {stay.available ? 'Request Booking' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderExperiences = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Cultural Experiences</Text>
        <Text style={s.heroText}>
          Learn from locals. Cook their food, play their music, walk their land.
          Every experience is led by a community member sharing their tradition.
        </Text>
      </View>

      <Text style={s.section}>Filter by Type</Text>
      <View style={s.catRow}>
        <TouchableOpacity
          style={[s.catChip, !filterCategory && s.catChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[s.catText, !filterCategory && s.catTextActive]}>All</Text>
        </TouchableOpacity>
        {EXPERIENCE_CATEGORIES.map((cat) => (
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

      {filteredExperiences.length === 0 ? (
        <Text style={s.emptyText}>No experiences match your filter.</Text>
      ) : (
        filteredExperiences.map((exp) => (
          <View key={exp.id} style={s.expCard}>
            <Text style={s.expTitle}>{exp.title}</Text>
            <Text style={s.expHost}>{exp.hostName} — {exp.region}</Text>
            <Text style={s.expCategory}>{categoryLabel(exp.category)}</Text>
            <Text style={s.expDesc}>{exp.description}</Text>

            <View style={s.expMeta}>
              <Text style={s.expCost}>{exp.otkCost} OTK</Text>
              <Text style={s.expDuration}>{exp.durationHours} hours</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={s.stayRating}>{STAR_DISPLAY(exp.rating)}</Text>
              <Text style={s.reviewCount}>({exp.reviewCount})</Text>
            </View>
            <Text style={s.expSpots}>
              {exp.spotsLeft > 0
                ? `${exp.spotsLeft} spots left (max ${exp.maxParticipants})`
                : 'Fully booked'}
            </Text>
            <Text style={s.expDate}>Next: {exp.nextDate}</Text>

            <TouchableOpacity
              style={[s.bookBtn, exp.spotsLeft <= 0 && s.bookBtnDisabled]}
              onPress={() => handleBookExperience(exp)}
            >
              <Text style={[s.bookBtnText, exp.spotsLeft <= 0 && s.bookBtnTextDisabled]}>
                {exp.spotsLeft > 0 ? 'Book Experience' : 'Fully Booked'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  const renderHost = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Become a Host</Text>
        <Text style={s.heroText}>
          Open your home to travelers and earn OTK while sharing your community's culture.
          Every host strengthens the inter-regional bridge envisioned in Article X.
        </Text>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Listing Title</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., Mountain View Cottage..."
          placeholderTextColor={t.text.muted}
          value={hostForm.title}
          onChangeText={(v) => setHostForm((f) => ({ ...f, title: v }))}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Region</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., Chianti, Tuscany, Italy..."
          placeholderTextColor={t.text.muted}
          value={hostForm.region}
          onChangeText={(v) => setHostForm((f) => ({ ...f, region: v }))}
        />
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Description</Text>
        <TextInput
          style={s.descInput}
          placeholder="Describe your space, your community, what guests can expect..."
          placeholderTextColor={t.text.muted}
          multiline
          value={hostForm.description}
          onChangeText={(v) => setHostForm((f) => ({ ...f, description: v }))}
        />
      </View>

      <View style={s.inputCard}>
        <View style={s.inputRow}>
          <View style={s.inputHalf}>
            <Text style={s.inputLabel}>OTK / Night</Text>
            <TextInput
              style={s.input}
              placeholder="150"
              placeholderTextColor={t.text.muted}
              keyboardType="numeric"
              value={hostForm.otkPerNight}
              onChangeText={(v) => setHostForm((f) => ({ ...f, otkPerNight: v }))}
            />
          </View>
          <View style={s.inputHalf}>
            <Text style={s.inputLabel}>Max Guests</Text>
            <TextInput
              style={s.input}
              placeholder="4"
              placeholderTextColor={t.text.muted}
              keyboardType="numeric"
              value={hostForm.maxGuests}
              onChangeText={(v) => setHostForm((f) => ({ ...f, maxGuests: v }))}
            />
          </View>
        </View>
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Amenities (comma-separated)</Text>
        <TextInput
          style={s.input}
          placeholder="Home meals, Garden, Cultural tours..."
          placeholderTextColor={t.text.muted}
          value={hostForm.amenities}
          onChangeText={(v) => setHostForm((f) => ({ ...f, amenities: v }))}
        />
      </View>

      <View style={s.inputCard}>
        <View style={s.inputRow}>
          <View style={s.inputHalf}>
            <Text style={s.inputLabel}>Available From</Text>
            <TextInput
              style={s.input}
              placeholder="2026-04-01"
              placeholderTextColor={t.text.muted}
              value={hostForm.availableFrom}
              onChangeText={(v) => setHostForm((f) => ({ ...f, availableFrom: v }))}
            />
          </View>
          <View style={s.inputHalf}>
            <Text style={s.inputLabel}>Available To</Text>
            <TextInput
              style={s.input}
              placeholder="2026-12-31"
              placeholderTextColor={t.text.muted}
              value={hostForm.availableTo}
              onChangeText={(v) => setHostForm((f) => ({ ...f, availableTo: v }))}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={handleHostSubmit}>
        <Text style={s.submitBtnText}>Submit Listing</Text>
      </TouchableOpacity>
    </>
  );

  const renderGuide = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroTitle}>Ethical Travel Guide</Text>
        <Text style={s.heroText}>
          Responsible tourism means respecting people, cultures, and environments.
          Each region has its own customs and expectations. Learn before you go.
        </Text>
      </View>

      <Text style={s.section}>Regional Guides</Text>

      {DEMO_GUIDES.map((guide) => (
        <View key={guide.id} style={s.guideCard}>
          <Text style={s.guideTitle}>{guide.title}</Text>
          <Text style={s.guideRegion}>{guide.region}</Text>

          <Text style={s.guideSubhead}>Cultural Notes</Text>
          <Text style={s.guideNotes}>{guide.culturalNotes}</Text>

          <Text style={s.guideSubhead}>Principles</Text>
          {guide.principles.map((p, i) => (
            <Text key={i} style={s.guidePrinciple}>- {p}</Text>
          ))}

          <Text style={s.guideSubhead}>Do</Text>
          {guide.doList.map((d, i) => (
            <Text key={i} style={s.guideDo}>+ {d}</Text>
          ))}

          <Text style={s.guideSubhead}>Don't</Text>
          {guide.dontList.map((d, i) => (
            <Text key={i} style={s.guideDont}>- {d}</Text>
          ))}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Travel</Text>
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
        {tab === 'stays' && renderStays()}
        {tab === 'experiences' && renderExperiences()}
        {tab === 'host' && renderHost()}
        {tab === 'guide' && renderGuide()}
      </ScrollView>
    </SafeAreaView>
  );
}
