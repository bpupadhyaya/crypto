import { fonts } from '../utils/theme';
/**
 * Seasonal Screen — Seasonal living guide, festivals, nature cycles, seasonal food.
 *
 * Article I: "Living in harmony with nature's rhythms is fundamental
 *  to human well-being."
 * — Human Constitution
 *
 * Features:
 * - Current season info (what's happening in nature, weather patterns)
 * - Seasonal festivals and celebrations (cultural events this season)
 * - Seasonal food guide (what to eat, what's in season locally)
 * - Seasonal activities (best outdoor activities for the season)
 * - Seasonal wellness tips (how to stay healthy as seasons change)
 * - Nature observation (phenology: first flowers, bird migration, leaf change)
 * - Demo: Spring season, 4 festivals, 5 seasonal foods, 3 activities
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface SeasonInfo {
  name: string;
  hemisphere: string;
  startDate: string;
  endDate: string;
  description: string;
  weatherPatterns: string[];
  natureEvents: string[];
  wellnessTips: string[];
}

interface Festival {
  id: string;
  name: string;
  culture: string;
  date: string;
  description: string;
  traditions: string[];
  season: string;
}

interface SeasonalFood {
  id: string;
  name: string;
  category: string;
  season: string;
  region: string;
  nutritionNote: string;
  inSeason: boolean;
}

interface SeasonalActivity {
  id: string;
  name: string;
  category: string;
  description: string;
  bestTime: string;
  difficulty: string;
  season: string;
}

interface NatureObservation {
  id: string;
  type: string;
  description: string;
  date: string;
  location: string;
  verified: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const FOOD_CATEGORIES = [
  { key: 'fruit', label: 'Fruits', icon: 'Fr' },
  { key: 'vegetable', label: 'Vegetables', icon: 'Vg' },
  { key: 'herb', label: 'Herbs', icon: 'Hb' },
  { key: 'grain', label: 'Grains', icon: 'Gr' },
];

const ACTIVITY_CATEGORIES = [
  { key: 'outdoor', label: 'Outdoor', icon: 'O' },
  { key: 'gardening', label: 'Gardening', icon: 'G' },
  { key: 'wellness', label: 'Wellness', icon: 'W' },
  { key: 'cultural', label: 'Cultural', icon: 'C' },
];

const OBSERVATION_TYPES = [
  { key: 'bloom', label: 'First Bloom' },
  { key: 'migration', label: 'Bird Migration' },
  { key: 'leaf', label: 'Leaf Change' },
  { key: 'weather', label: 'Weather Shift' },
  { key: 'wildlife', label: 'Wildlife Activity' },
];

// ─── Demo Data ───

const DEMO_SEASON: SeasonInfo = {
  name: 'Spring',
  hemisphere: 'Northern',
  startDate: '2026-03-20',
  endDate: '2026-06-20',
  description: 'Spring is a time of renewal and growth. Days are getting longer, temperatures are rising, and nature is waking up from winter dormancy.',
  weatherPatterns: [
    'Gradually warming temperatures (10-20C / 50-68F)',
    'Frequent rain showers nourishing new growth',
    'Occasional late frosts in early spring',
    'Increasing daylight hours toward the solstice',
  ],
  natureEvents: [
    'Cherry blossoms and wildflowers blooming',
    'Migratory birds returning from the south',
    'Trees leafing out with fresh green foliage',
    'Pollinators (bees, butterflies) becoming active',
    'Amphibians emerging and breeding in ponds',
  ],
  wellnessTips: [
    'Gradually increase outdoor time as daylight grows',
    'Manage seasonal allergies with local honey and air filters',
    'Spring clean your living space for mental clarity',
    'Start a garden -- even small herbs on a windowsill',
    'Adjust sleep schedule as days lengthen',
  ],
};

const DEMO_FESTIVALS: Festival[] = [
  {
    id: 'f1', name: 'Nowruz', culture: 'Persian / Central Asian', date: '2026-03-20',
    description: 'Persian New Year celebrating the vernal equinox. Families gather around a Haft-sin table with seven symbolic items.',
    traditions: ['Haft-sin table', 'House cleaning', 'Fire jumping', 'Visiting elders'],
    season: 'spring',
  },
  {
    id: 'f2', name: 'Holi', culture: 'Indian / South Asian', date: '2026-03-14',
    description: 'Festival of colors celebrating the arrival of spring, the victory of good over evil, and the blossoming of love.',
    traditions: ['Throwing colored powder', 'Bonfires', 'Sharing sweets', 'Community dancing'],
    season: 'spring',
  },
  {
    id: 'f3', name: 'Hanami', culture: 'Japanese', date: '2026-03-25',
    description: 'Cherry blossom viewing. Japanese tradition of appreciating the transient beauty of flowers, particularly cherry blossoms.',
    traditions: ['Picnic under cherry trees', 'Poetry reading', 'Night illumination', 'Tea ceremony'],
    season: 'spring',
  },
  {
    id: 'f4', name: 'Easter / Ostara', culture: 'Western / Pagan', date: '2026-04-05',
    description: 'Celebration of renewal and rebirth. Combines Christian resurrection observance with older spring equinox traditions.',
    traditions: ['Egg decorating', 'Sunrise services', 'Planting seeds', 'Spring feasts'],
    season: 'spring',
  },
];

const DEMO_FOODS: SeasonalFood[] = [
  { id: 'fd1', name: 'Asparagus', category: 'vegetable', season: 'spring', region: 'Temperate', nutritionNote: 'Rich in folate, vitamins A, C, K. Supports digestion.', inSeason: true },
  { id: 'fd2', name: 'Strawberries', category: 'fruit', season: 'spring', region: 'Temperate', nutritionNote: 'High in vitamin C and antioxidants. Supports immune health.', inSeason: true },
  { id: 'fd3', name: 'Peas', category: 'vegetable', season: 'spring', region: 'Temperate', nutritionNote: 'Good source of protein, fiber, and vitamins A, C, K.', inSeason: true },
  { id: 'fd4', name: 'Mint', category: 'herb', season: 'spring', region: 'Global', nutritionNote: 'Aids digestion, freshens breath. Rich in antioxidants.', inSeason: true },
  { id: 'fd5', name: 'Radishes', category: 'vegetable', season: 'spring', region: 'Temperate', nutritionNote: 'Low calorie, high in vitamin C. Supports liver detox.', inSeason: true },
];

const DEMO_ACTIVITIES: SeasonalActivity[] = [
  { id: 'a1', name: 'Nature Walks', category: 'outdoor', description: 'Explore trails as wildflowers bloom and birds return. Perfect time to start a nature journal.', bestTime: 'Morning', difficulty: 'Easy', season: 'spring' },
  { id: 'a2', name: 'Start a Garden', category: 'gardening', description: 'Plant cool-season crops like lettuce, peas, and herbs. Prepare beds for summer planting.', bestTime: 'Morning', difficulty: 'Easy', season: 'spring' },
  { id: 'a3', name: 'Bird Watching', category: 'outdoor', description: 'Spring migration brings diverse species. Great time to learn local bird calls and observe nesting.', bestTime: 'Early morning', difficulty: 'Easy', season: 'spring' },
];

const DEMO_OBSERVATIONS: NatureObservation[] = [
  { id: 'o1', type: 'bloom', description: 'First crocus blooms spotted in the community garden', date: '2026-03-15', location: 'Community Garden', verified: true },
  { id: 'o2', type: 'migration', description: 'Robins returning -- seen first group of 8 in the park', date: '2026-03-18', location: 'Riverside Park', verified: true },
  { id: 'o3', type: 'bloom', description: 'Cherry blossoms starting to open on Main Street trees', date: '2026-03-24', location: 'Main Street', verified: true },
  { id: 'o4', type: 'wildlife', description: 'First bumblebee of the season visiting early crocuses', date: '2026-03-26', location: 'Home garden', verified: false },
  { id: 'o5', type: 'leaf', description: 'Willow trees showing first green leaf buds along the creek', date: '2026-03-28', location: 'Creek Trail', verified: false },
];

type Tab = 'season' | 'festivals' | 'food' | 'nature';

export function SeasonalScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('season');
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [foodFilter, setFoodFilter] = useState<string>('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const season = DEMO_SEASON;
  const festivals = DEMO_FESTIVALS;
  const foods = DEMO_FOODS;
  const activities = DEMO_ACTIVITIES;
  const observations = DEMO_OBSERVATIONS;

  const filteredFoods = useMemo(() => {
    if (!foodFilter) return foods;
    return foods.filter(f => f.category === foodFilter);
  }, [foods, foodFilter]);

  const handleLogObservation = useCallback(() => {
    Alert.alert(
      'Observation Logged',
      'Your nature observation has been recorded.\n\nCommunity phenology data helps track seasonal patterns and climate changes across regions.',
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Season hero
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' as const },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, textAlign: 'center' as const },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' as const, marginTop: 4, lineHeight: 20 },
    heroDates: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 8 },
    seasonDesc: { color: t.text.secondary, fontSize: fonts.md, lineHeight: 22, marginHorizontal: 20, marginBottom: 16 },
    // Bullet lists
    bulletCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    bulletTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 10 },
    bulletItem: { flexDirection: 'row', marginBottom: 8 },
    bulletDot: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.heavy, marginRight: 8, marginTop: 1 },
    bulletText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, flex: 1 },
    // Festival cards
    festivalCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    festivalName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    festivalCulture: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 2 },
    festivalDate: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, marginTop: 4 },
    festivalDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 8 },
    festivalTraditions: { marginTop: 10 },
    traditionLabel: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.bold, marginBottom: 6 },
    traditionItem: { flexDirection: 'row', marginBottom: 4 },
    traditionDot: { color: t.accent.orange, fontSize: fonts.sm, fontWeight: fonts.heavy, marginRight: 6, marginTop: 1 },
    traditionText: { color: t.text.secondary, fontSize: fonts.sm },
    backBtn: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.semibold, marginLeft: 20, marginBottom: 12 },
    // Food cards
    foodFilterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.green },
    filterText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    filterTextActive: { color: '#fff' },
    foodCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    foodName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    inSeasonBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    inSeasonText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    foodCategory: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2, textTransform: 'capitalize' as const },
    foodRegion: { color: t.accent.purple, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    foodNutrition: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 6 },
    // Activity cards
    activityCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    activityName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    activityMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
    activityMetaText: { color: t.text.muted, fontSize: fonts.sm },
    activityDesc: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 8 },
    // Nature observation
    obsCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    obsType: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase' as const, letterSpacing: 1 },
    obsDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 4 },
    obsMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    obsLocation: { color: t.text.muted, fontSize: fonts.sm },
    obsDate: { color: t.text.muted, fontSize: fonts.sm },
    obsVerified: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    logObsBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' as const, marginHorizontal: 20, marginTop: 8 },
    logObsBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    demoTag: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center' as const, marginBottom: 8 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center' as const, paddingVertical: 40 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'season', label: 'Season' },
    { key: 'festivals', label: 'Festivals' },
    { key: 'food', label: 'Food' },
    { key: 'nature', label: 'Nature' },
  ];

  // ─── Render: Season Tab ───

  const renderSeasonTab = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'S'}</Text>
        <Text style={s.heroTitle}>{season.name}</Text>
        <Text style={s.heroSubtitle}>{season.hemisphere} Hemisphere</Text>
        <Text style={s.heroDates}>{season.startDate} to {season.endDate}</Text>
      </View>

      <Text style={s.seasonDesc}>{season.description}</Text>

      <View style={s.bulletCard}>
        <Text style={s.bulletTitle}>Weather Patterns</Text>
        {season.weatherPatterns.map((pattern, idx) => (
          <View key={idx} style={s.bulletItem}>
            <Text style={s.bulletDot}>*</Text>
            <Text style={s.bulletText}>{pattern}</Text>
          </View>
        ))}
      </View>

      <View style={s.bulletCard}>
        <Text style={s.bulletTitle}>What's Happening in Nature</Text>
        {season.natureEvents.map((event, idx) => (
          <View key={idx} style={s.bulletItem}>
            <Text style={s.bulletDot}>*</Text>
            <Text style={s.bulletText}>{event}</Text>
          </View>
        ))}
      </View>

      <View style={s.bulletCard}>
        <Text style={s.bulletTitle}>Seasonal Wellness Tips</Text>
        {season.wellnessTips.map((tip, idx) => (
          <View key={idx} style={s.bulletItem}>
            <Text style={s.bulletDot}>*</Text>
            <Text style={s.bulletText}>{tip}</Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>Seasonal Activities</Text>
      {activities.map(activity => (
        <View key={activity.id} style={s.activityCard}>
          <Text style={s.activityName}>{activity.name}</Text>
          <View style={s.activityMeta}>
            <Text style={s.activityMetaText}>Best: {activity.bestTime}</Text>
            <Text style={s.activityMetaText}>Difficulty: {activity.difficulty}</Text>
          </View>
          <Text style={s.activityDesc}>{activity.description}</Text>
        </View>
      ))}
    </>
  );

  // ─── Render: Festivals Tab ───

  const renderFestivalsTab = () => (
    <>
      {selectedFestival ? (
        <>
          <TouchableOpacity onPress={() => setSelectedFestival(null)}>
            <Text style={s.backBtn}>{'< Back to festivals'}</Text>
          </TouchableOpacity>
          <View style={s.festivalCard}>
            <Text style={s.festivalName}>{selectedFestival.name}</Text>
            <Text style={s.festivalCulture}>{selectedFestival.culture}</Text>
            <Text style={s.festivalDate}>{selectedFestival.date}</Text>
            <Text style={s.festivalDesc}>{selectedFestival.description}</Text>
            <View style={s.festivalTraditions}>
              <Text style={s.traditionLabel}>Traditions</Text>
              {selectedFestival.traditions.map((tradition, idx) => (
                <View key={idx} style={s.traditionItem}>
                  <Text style={s.traditionDot}>*</Text>
                  <Text style={s.traditionText}>{tradition}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={s.sectionTitle}>Spring Festivals Around the World</Text>
          {festivals.map(festival => (
            <TouchableOpacity key={festival.id} style={s.festivalCard} onPress={() => setSelectedFestival(festival)}>
              <Text style={s.festivalName}>{festival.name}</Text>
              <Text style={s.festivalCulture}>{festival.culture}</Text>
              <Text style={s.festivalDate}>{festival.date}</Text>
              <Text style={s.festivalDesc} numberOfLines={2}>{festival.description}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </>
  );

  // ─── Render: Food Tab ───

  const renderFoodTab = () => (
    <>
      <Text style={s.sectionTitle}>What's In Season</Text>

      <View style={s.foodFilterRow}>
        <TouchableOpacity
          style={[s.filterChip, !foodFilter && s.filterChipActive]}
          onPress={() => setFoodFilter('')}
        >
          <Text style={[s.filterText, !foodFilter && s.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {FOOD_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[s.filterChip, foodFilter === cat.key && s.filterChipActive]}
            onPress={() => setFoodFilter(foodFilter === cat.key ? '' : cat.key)}
          >
            <Text style={[s.filterText, foodFilter === cat.key && s.filterTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredFoods.map(food => (
        <View key={food.id} style={s.foodCard}>
          <View style={s.foodHeader}>
            <Text style={s.foodName}>{food.name}</Text>
            {food.inSeason && (
              <View style={s.inSeasonBadge}>
                <Text style={s.inSeasonText}>IN SEASON</Text>
              </View>
            )}
          </View>
          <Text style={s.foodCategory}>{food.category} -- {food.region}</Text>
          <Text style={s.foodNutrition}>{food.nutritionNote}</Text>
        </View>
      ))}
    </>
  );

  // ─── Render: Nature Tab ───

  const renderNatureTab = () => (
    <>
      <Text style={s.sectionTitle}>Community Phenology Log</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Track nature's seasonal markers -- first blooms, bird arrivals, leaf changes
      </Text>

      {observations.map(obs => (
        <View key={obs.id} style={s.obsCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.obsType}>{OBSERVATION_TYPES.find(ot => ot.key === obs.type)?.label || obs.type}</Text>
            {obs.verified && <Text style={s.obsVerified}>Verified</Text>}
          </View>
          <Text style={s.obsDesc}>{obs.description}</Text>
          <View style={s.obsMeta}>
            <Text style={s.obsLocation}>{obs.location}</Text>
            <Text style={s.obsDate}>{obs.date}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.logObsBtn} onPress={handleLogObservation}>
        <Text style={s.logObsBtnText}>Log Nature Observation</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Seasonal Living</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabActive]}
            onPress={() => { setTab(t.key); setSelectedFestival(null); }}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {demoMode && <Text style={s.demoTag}>DEMO MODE</Text>}

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'season' && renderSeasonTab()}
        {tab === 'festivals' && renderFestivalsTab()}
        {tab === 'food' && renderFoodTab()}
        {tab === 'nature' && renderNatureTab()}
      </ScrollView>
    </SafeAreaView>
  );
}
