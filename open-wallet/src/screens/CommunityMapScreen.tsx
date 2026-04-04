import { fonts } from '../utils/theme';
/**
 * Community Map — Article IX of The Human Constitution.
 *
 * "Directory of all community resources in one place."
 *
 * Every person should know what help exists around them. This screen
 * catalogs health clinics, schools, food banks, shelters, legal aid,
 * transport, worship, and recreation — community-submitted, verified,
 * and rated. Accessibility info included.
 *
 * Features:
 * - Resource categories: health, education, food, water, shelter, legal, transport, worship, recreation
 * - Each resource: name, type, address/location, hours, contact, rating
 * - Search and filter by category
 * - Add new resource (community-submitted, verified)
 * - Favorites / bookmarks
 * - Accessibility info per resource (wheelchair, hearing, vision)
 * - Demo: 12 resources across categories, 2 favorites
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type Tab = 'browse' | 'search' | 'add' | 'favorites';

type Category =
  | 'health' | 'education' | 'food' | 'water'
  | 'shelter' | 'legal' | 'transport' | 'worship' | 'recreation';

interface AccessibilityInfo {
  wheelchair: boolean;
  hearing: boolean;
  vision: boolean;
}

interface Resource {
  id: string;
  name: string;
  category: Category;
  address: string;
  hours: string;
  contact: string;
  rating: number;
  ratingCount: number;
  verified: boolean;
  accessibility: AccessibilityInfo;
  description: string;
  isFavorite: boolean;
}

const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  health:     { label: 'Health',     icon: '\u{1FA7A}', color: '#ef4444' },
  education:  { label: 'Education',  icon: '\u{1F4DA}', color: '#3b82f6' },
  food:       { label: 'Food',       icon: '\u{1F34E}', color: '#22c55e' },
  water:      { label: 'Water',      icon: '\u{1F4A7}', color: '#06b6d4' },
  shelter:    { label: 'Shelter',    icon: '\u{1F3E0}', color: '#f97316' },
  legal:      { label: 'Legal',      icon: '\u{2696}',  color: '#8b5cf6' },
  transport:  { label: 'Transport',  icon: '\u{1F68C}', color: '#6366f1' },
  worship:    { label: 'Worship',    icon: '\u{1F54C}', color: '#eab308' },
  recreation: { label: 'Recreation', icon: '\u{26BD}',  color: '#14b8a6' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Category[];

const DEMO_RESOURCES: Resource[] = [
  {
    id: 'r1', name: 'Valley Community Clinic', category: 'health',
    address: '450 Elm Street', hours: 'Mon-Sat 8am-6pm', contact: '+1 555-0101',
    rating: 4.6, ratingCount: 128, verified: true,
    accessibility: { wheelchair: true, hearing: true, vision: false },
    description: 'Free primary care, dental, and mental health services. Walk-ins welcome.',
    isFavorite: true,
  },
  {
    id: 'r2', name: 'Sunrise Public Library', category: 'education',
    address: '22 Oak Avenue', hours: 'Daily 9am-8pm', contact: '+1 555-0102',
    rating: 4.8, ratingCount: 256, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: true },
    description: 'Free internet, tutoring programs, GED prep, children\'s reading hour.',
    isFavorite: false,
  },
  {
    id: 'r3', name: 'Harvest Food Bank', category: 'food',
    address: '180 River Road', hours: 'Tue-Thu 10am-4pm, Sat 9am-1pm', contact: '+1 555-0103',
    rating: 4.7, ratingCount: 89, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Weekly food distribution. No ID required. Serves 500+ families per week.',
    isFavorite: true,
  },
  {
    id: 'r4', name: 'Clean Water Station #7', category: 'water',
    address: 'Market Square', hours: '24/7', contact: 'N/A',
    rating: 4.2, ratingCount: 45, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Filtered drinking water station. Bring your own container.',
    isFavorite: false,
  },
  {
    id: 'r5', name: 'Hope House Shelter', category: 'shelter',
    address: '88 Pine Street', hours: 'Check-in 5pm-9pm', contact: '+1 555-0105',
    rating: 4.3, ratingCount: 62, verified: true,
    accessibility: { wheelchair: true, hearing: true, vision: true },
    description: 'Emergency overnight shelter. 60 beds. Meals provided. Case workers on-site.',
    isFavorite: false,
  },
  {
    id: 'r6', name: 'Legal Aid Society', category: 'legal',
    address: '310 Justice Blvd, Suite 200', hours: 'Mon-Fri 9am-5pm', contact: '+1 555-0106',
    rating: 4.5, ratingCount: 74, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Free legal representation for housing, immigration, and family law matters.',
    isFavorite: false,
  },
  {
    id: 'r7', name: 'Community Bus Route #3', category: 'transport',
    address: 'Central Terminal', hours: 'Daily 6am-10pm, every 20 min', contact: '+1 555-0107',
    rating: 3.9, ratingCount: 210, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Free community bus connecting downtown, hospital, school district, and market.',
    isFavorite: false,
  },
  {
    id: 'r8', name: 'Interfaith Center', category: 'worship',
    address: '55 Unity Lane', hours: 'Daily 7am-9pm', contact: '+1 555-0108',
    rating: 4.9, ratingCount: 180, verified: true,
    accessibility: { wheelchair: true, hearing: true, vision: true },
    description: 'Multi-faith worship space. Meditation room. Community meals on Sundays.',
    isFavorite: false,
  },
  {
    id: 'r9', name: 'Riverside Park & Sports Complex', category: 'recreation',
    address: 'Riverside Drive', hours: 'Daily 6am-10pm', contact: '+1 555-0109',
    rating: 4.4, ratingCount: 320, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Soccer fields, basketball courts, playground, walking trails. Free access.',
    isFavorite: false,
  },
  {
    id: 'r10', name: 'Neighborhood Health Promoters', category: 'health',
    address: 'Mobile — various locations', hours: 'By appointment', contact: '+1 555-0110',
    rating: 4.7, ratingCount: 53, verified: false,
    accessibility: { wheelchair: false, hearing: false, vision: false },
    description: 'Community health workers offering home visits, health education, and referrals.',
    isFavorite: false,
  },
  {
    id: 'r11', name: 'Adult Literacy Center', category: 'education',
    address: '14 School Lane', hours: 'Mon-Fri 10am-6pm', contact: '+1 555-0111',
    rating: 4.6, ratingCount: 41, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: true },
    description: 'Free English classes, computer literacy, job readiness training.',
    isFavorite: false,
  },
  {
    id: 'r12', name: 'Community Kitchen Co-op', category: 'food',
    address: '72 Baker Street', hours: 'Mon-Sat 11am-2pm', contact: '+1 555-0112',
    rating: 4.5, ratingCount: 97, verified: true,
    accessibility: { wheelchair: true, hearing: false, vision: false },
    description: 'Pay-what-you-can hot meals. Volunteer cooks welcome. Dietary options available.',
    isFavorite: false,
  },
];

const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
  { key: 'browse', label: 'Browse', icon: '\u{1F4CB}' },
  { key: 'search', label: 'Search', icon: '\u{1F50D}' },
  { key: 'add', label: 'Add', icon: '\u{2795}' },
  { key: 'favorites', label: 'Saved', icon: '\u{2B50}' },
];

const ACCESSIBILITY_ICONS: { key: keyof AccessibilityInfo; icon: string; label: string }[] = [
  { key: 'wheelchair', icon: '\u{267F}', label: 'Wheelchair' },
  { key: 'hearing', icon: '\u{1F442}', label: 'Hearing' },
  { key: 'vision', icon: '\u{1F441}', label: 'Vision' },
];

export function CommunityMapScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(DEMO_RESOURCES.filter(r => r.isFavorite).map(r => r.id))
  );

  // New resource form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.bg.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
    catChipActive: { borderWidth: 2 },
    catChipText: { fontSize: 12, fontWeight: fonts.semibold },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { color: '#eab308', fontSize: 14, fontWeight: fonts.bold },
    ratingCount: { color: t.text.muted, fontSize: 11 },
    verifiedBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    verifiedText: { color: '#fff', fontSize: 9, fontWeight: fonts.bold },
    unverifiedBadge: { backgroundColor: t.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    unverifiedText: { color: t.text.muted, fontSize: 9, fontWeight: fonts.bold },
    accessRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    accessBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: t.accent.blue + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    accessText: { color: t.accent.blue, fontSize: 10, fontWeight: fonts.semibold },
    favBtn: { padding: 6 },
    favText: { fontSize: 20 },
    searchInput: { backgroundColor: t.bg.card, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    formInput: { backgroundColor: t.bg.card, borderRadius: 10, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: t.border },
    formLabel: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    ctaBtn: { backgroundColor: t.accent.blue, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    ctaText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    successCard: { backgroundColor: '#22c55e' + '18', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 12 },
    successText: { color: '#22c55e', fontSize: 16, fontWeight: fonts.bold, marginTop: 8 },
    successSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  }), [t]);

  const resources = demoMode ? DEMO_RESOURCES : [];

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '\u2605';
    if (half) stars += '\u00BD';
    return stars;
  };

  const renderResourceCard = (res: Resource) => {
    const meta = CATEGORY_META[res.category];
    const accessFeatures = ACCESSIBILITY_ICONS.filter(a => res.accessibility[a.key]);

    return (
      <View key={res.id} style={st.card}>
        <View style={[st.row, { alignItems: 'center', marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[st.iconCircle, { backgroundColor: meta.color + '22' }]}>
              <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>{res.name}</Text>
              <Text style={st.label}>{meta.label} \u2022 {res.address}</Text>
            </View>
          </View>
          <TouchableOpacity style={st.favBtn} onPress={() => toggleFavorite(res.id)}>
            <Text style={st.favText}>{favorites.has(res.id) ? '\u2B50' : '\u2606'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[st.label, { marginBottom: 6 }]}>{res.description}</Text>

        <View style={st.divider} />

        <View style={st.row}>
          <Text style={st.label}>Hours</Text>
          <Text style={st.val}>{res.hours}</Text>
        </View>
        <View style={st.row}>
          <Text style={st.label}>Contact</Text>
          <Text style={st.val}>{res.contact}</Text>
        </View>
        <View style={[st.row, { alignItems: 'center' }]}>
          <View style={st.ratingRow}>
            <Text style={st.ratingText}>{renderStars(res.rating)} {res.rating}</Text>
            <Text style={st.ratingCount}>({res.ratingCount})</Text>
          </View>
          {res.verified ? (
            <View style={st.verifiedBadge}><Text style={st.verifiedText}>VERIFIED</Text></View>
          ) : (
            <View style={st.unverifiedBadge}><Text style={st.unverifiedText}>PENDING</Text></View>
          )}
        </View>

        {accessFeatures.length > 0 && (
          <View style={st.accessRow}>
            {accessFeatures.map(a => (
              <View key={a.key} style={st.accessBadge}>
                <Text style={{ fontSize: 12 }}>{a.icon}</Text>
                <Text style={st.accessText}>{a.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  /* ---- Tab: Browse ---- */

  const filteredBrowse = useMemo(() => {
    if (!selectedCategory) return resources;
    return resources.filter(r => r.category === selectedCategory);
  }, [resources, selectedCategory]);

  const renderBrowse = () => (
    <View>
      <Text style={st.subtitle}>
        All community resources in one place. Tap a category to filter.
      </Text>

      <View style={st.catRow}>
        <TouchableOpacity
          style={[st.catChip, !selectedCategory && { backgroundColor: t.accent.blue + '22', borderColor: t.accent.blue, borderWidth: 2 }]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[st.catChipText, { color: !selectedCategory ? t.accent.blue : t.text.secondary }]}>All</Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[st.catChip, active && { backgroundColor: meta.color + '22', borderColor: meta.color, borderWidth: 2 }]}
              onPress={() => setSelectedCategory(active ? null : cat)}
            >
              <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
              <Text style={[st.catChipText, { color: active ? meta.color : t.text.secondary }]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredBrowse.length === 0
        ? <Text style={st.empty}>No resources found.</Text>
        : filteredBrowse.map(renderResourceCard)
      }
    </View>
  );

  /* ---- Tab: Search ---- */

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return resources.filter(r =>
      r.name.toLowerCase().includes(q)
      || r.category.toLowerCase().includes(q)
      || r.description.toLowerCase().includes(q)
      || r.address.toLowerCase().includes(q)
    );
  }, [resources, searchQuery]);

  const renderSearch = () => (
    <View>
      <Text style={st.subtitle}>
        Search by name, category, location, or keyword.
      </Text>
      <TextInput
        style={st.searchInput}
        placeholder="Search resources..."
        placeholderTextColor={t.text.muted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
      />
      {searchQuery.trim() === '' ? (
        <Text style={st.empty}>Type to search community resources.</Text>
      ) : searchResults.length === 0 ? (
        <Text style={st.empty}>No results for "{searchQuery}".</Text>
      ) : (
        <>
          <Text style={st.section}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
          {searchResults.map(renderResourceCard)}
        </>
      )}
    </View>
  );

  /* ---- Tab: Add ---- */

  const renderAdd = () => {
    if (submitted) {
      return (
        <View style={st.successCard}>
          <Text style={{ fontSize: 40 }}>{'\u2705'}</Text>
          <Text style={st.successText}>Resource Submitted!</Text>
          <Text style={st.successSub}>It will be visible after community verification.</Text>
          <TouchableOpacity
            style={[st.ctaBtn, { marginTop: 16, width: '100%' }]}
            onPress={() => {
              setSubmitted(false);
              setNewName(''); setNewCategory(null); setNewAddress('');
              setNewHours(''); setNewContact(''); setNewDescription('');
            }}
          >
            <Text style={st.ctaText}>Add Another</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <Text style={st.subtitle}>
          Know a community resource not listed? Add it here. Community members will verify it.
        </Text>

        <View style={st.card}>
          <Text style={st.formLabel}>Resource Name</Text>
          <TextInput
            style={st.formInput}
            placeholder="e.g., Community Health Center"
            placeholderTextColor={t.text.muted}
            value={newName}
            onChangeText={setNewName}
          />

          <Text style={st.formLabel}>Category</Text>
          <View style={[st.catRow, { marginBottom: 10 }]}>
            {ALL_CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const active = newCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[st.catChip, active && { backgroundColor: meta.color + '22', borderColor: meta.color, borderWidth: 2 }]}
                  onPress={() => setNewCategory(active ? null : cat)}
                >
                  <Text style={{ fontSize: 12 }}>{meta.icon}</Text>
                  <Text style={[st.catChipText, { color: active ? meta.color : t.text.secondary, fontSize: 10 }]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={st.formLabel}>Address / Location</Text>
          <TextInput
            style={st.formInput}
            placeholder="Street address or description"
            placeholderTextColor={t.text.muted}
            value={newAddress}
            onChangeText={setNewAddress}
          />

          <Text style={st.formLabel}>Hours</Text>
          <TextInput
            style={st.formInput}
            placeholder="e.g., Mon-Fri 9am-5pm"
            placeholderTextColor={t.text.muted}
            value={newHours}
            onChangeText={setNewHours}
          />

          <Text style={st.formLabel}>Contact</Text>
          <TextInput
            style={st.formInput}
            placeholder="Phone, email, or website"
            placeholderTextColor={t.text.muted}
            value={newContact}
            onChangeText={setNewContact}
          />

          <Text style={st.formLabel}>Description</Text>
          <TextInput
            style={[st.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="What services does this resource provide?"
            placeholderTextColor={t.text.muted}
            value={newDescription}
            onChangeText={setNewDescription}
            multiline
          />

          <TouchableOpacity
            style={[st.ctaBtn, { opacity: (newName && newCategory && newAddress) ? 1 : 0.5 }]}
            onPress={() => {
              if (newName && newCategory && newAddress) setSubmitted(true);
            }}
          >
            <Text style={st.ctaText}>Submit for Verification</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ---- Tab: Favorites ---- */

  const favoriteResources = useMemo(
    () => resources.filter(r => favorites.has(r.id)),
    [resources, favorites]
  );

  const renderFavorites = () => {
    if (favoriteResources.length === 0) {
      return <Text style={st.empty}>No saved resources yet. Tap the star on any resource to save it.</Text>;
    }
    return (
      <View>
        <Text style={st.subtitle}>
          Your bookmarked resources for quick access.
        </Text>
        {favoriteResources.map(renderResourceCard)}
      </View>
    );
  };

  /* ---- Main ---- */

  const renderContent = () => {
    switch (activeTab) {
      case 'browse': return renderBrowse();
      case 'search': return renderSearch();
      case 'add': return renderAdd();
      case 'favorites': return renderFavorites();
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>{'\u{1F5FA}'} Community Map</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        {/* Tabs */}
        <View style={st.tabRow}>
          {TAB_CONFIG.map(tc => (
            <TouchableOpacity
              key={tc.key}
              style={[st.tab, activeTab === tc.key && st.tabActive]}
              onPress={() => setActiveTab(tc.key)}
            >
              <Text style={[st.tabText, activeTab === tc.key && st.tabTextActive]}>
                {tc.icon} {tc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {demoMode ? renderContent() : (
          <Text style={st.empty}>Enable demo mode to explore community resources.</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
