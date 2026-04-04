import { fonts } from '../utils/theme';
/**
 * Gardening Screen — Personal gardening tracker, plant care, garden community.
 *
 * Article I: "Growing food is a fundamental act of self-reliance and community care."
 * Article III: eOTK represents the value of nurturing life.
 *
 * Features:
 * - My garden — track plants (name, species, planted date, care schedule, growth stage)
 * - Plant care reminders (watering, fertilizing, pruning)
 * - Garden journal (photos hash, notes, harvest log)
 * - Community garden tips (seasonal advice, pest management)
 * - Seed saving and sharing (link to permaculture seed bank)
 * - Harvest tracker (what you grew, weight, shared with community)
 * - Demo mode with sample data (6 plants, 3 care reminders, 2 harvests)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Plant {
  id: string;
  name: string;
  species: string;
  plantedDate: string;
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest-ready' | 'dormant';
  careSchedule: string;
  lastWatered: string;
  icon: string;
}

interface CareReminder {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'harvest';
  dueDate: string;
  recurring: boolean;
  intervalDays: number;
  done: boolean;
}

interface JournalEntry {
  id: string;
  date: string;
  note: string;
  photoHash: string;
  plantIds: string[];
  tags: string[];
}

interface GardenTip {
  id: string;
  title: string;
  category: 'seasonal' | 'pest' | 'soil' | 'companion' | 'organic';
  content: string;
  author: string;
  authorUID: string;
  likes: number;
}

interface HarvestRecord {
  id: string;
  plantName: string;
  harvestDate: string;
  weightKg: number;
  sharedWithCommunity: boolean;
  sharedWeightKg: number;
  eotkEarned: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const GROWTH_STAGES: Record<string, { label: string; color: string }> = {
  seedling: { label: 'Seedling', color: '#8E8E93' },
  vegetative: { label: 'Vegetative', color: '#34C759' },
  flowering: { label: 'Flowering', color: '#AF52DE' },
  fruiting: { label: 'Fruiting', color: '#FF9500' },
  'harvest-ready': { label: 'Harvest Ready', color: '#FF3B30' },
  dormant: { label: 'Dormant', color: '#636366' },
};

const CARE_ICONS: Record<string, string> = {
  water: 'W',
  fertilize: 'F',
  prune: 'P',
  repot: 'R',
  harvest: 'H',
};

const CARE_COLORS: Record<string, string> = {
  water: '#007AFF',
  fertilize: '#34C759',
  prune: '#AF52DE',
  repot: '#FF9500',
  harvest: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_PLANTS: Plant[] = [
  { id: 'pl1', name: 'Cherry Tomatoes', species: 'Solanum lycopersicum', plantedDate: '2026-02-15', growthStage: 'fruiting', careSchedule: 'Water daily, fertilize weekly', lastWatered: '2026-03-28', icon: 'T' },
  { id: 'pl2', name: 'Basil', species: 'Ocimum basilicum', plantedDate: '2026-03-01', growthStage: 'vegetative', careSchedule: 'Water every 2 days, pinch flowers', lastWatered: '2026-03-28', icon: 'B' },
  { id: 'pl3', name: 'Sunflowers', species: 'Helianthus annuus', plantedDate: '2026-02-20', growthStage: 'flowering', careSchedule: 'Water every 3 days, full sun', lastWatered: '2026-03-27', icon: 'S' },
  { id: 'pl4', name: 'Mint', species: 'Mentha spicata', plantedDate: '2026-01-10', growthStage: 'harvest-ready', careSchedule: 'Water daily, contain roots', lastWatered: '2026-03-29', icon: 'M' },
  { id: 'pl5', name: 'Bell Peppers', species: 'Capsicum annuum', plantedDate: '2026-02-25', growthStage: 'flowering', careSchedule: 'Water every 2 days, stake plants', lastWatered: '2026-03-28', icon: 'P' },
  { id: 'pl6', name: 'Lettuce Mix', species: 'Lactuca sativa', plantedDate: '2026-03-10', growthStage: 'vegetative', careSchedule: 'Water daily, partial shade OK', lastWatered: '2026-03-29', icon: 'L' },
];

const DEMO_REMINDERS: CareReminder[] = [
  { id: 'r1', plantId: 'pl1', plantName: 'Cherry Tomatoes', type: 'fertilize', dueDate: '2026-03-30', recurring: true, intervalDays: 7, done: false },
  { id: 'r2', plantId: 'pl3', plantName: 'Sunflowers', type: 'water', dueDate: '2026-03-30', recurring: true, intervalDays: 3, done: false },
  { id: 'r3', plantId: 'pl4', plantName: 'Mint', type: 'harvest', dueDate: '2026-03-29', recurring: false, intervalDays: 0, done: false },
];

const DEMO_JOURNAL: JournalEntry[] = [
  { id: 'j1', date: '2026-03-28', note: 'Tomatoes showing first red fruits! Should be ready to pick in a few days. Basil growing strong.', photoHash: 'QmTom...abc123', plantIds: ['pl1', 'pl2'], tags: ['progress', 'fruit'] },
  { id: 'j2', date: '2026-03-25', note: 'Sunflowers are 4 feet tall now, beautiful golden blooms attracting bees. Great for the garden ecosystem.', photoHash: 'QmSun...def456', plantIds: ['pl3'], tags: ['bloom', 'pollinators'] },
  { id: 'j3', date: '2026-03-20', note: 'Planted lettuce mix in the raised bed. Added compost from the community pile. Peppers have first flowers.', photoHash: 'QmLet...ghi789', plantIds: ['pl5', 'pl6'], tags: ['planting', 'compost'] },
];

const DEMO_TIPS: GardenTip[] = [
  { id: 't1', title: 'Spring Companion Planting Guide', category: 'companion', content: 'Plant basil near tomatoes to repel pests and improve flavor. Marigolds around the garden edge deter aphids.', author: 'GreenThumb42', authorUID: 'openchain1abc...green42', likes: 87 },
  { id: 't2', title: 'Natural Pest Control: Aphids', category: 'pest', content: 'Spray diluted neem oil (1 tsp per quart of water) on affected plants. Ladybugs are natural predators — attract them with dill and fennel.', author: 'OrganicSarah', authorUID: 'openchain1def...sarah', likes: 134 },
  { id: 't3', title: 'Soil pH for Vegetables', category: 'soil', content: 'Most vegetables prefer pH 6.0-7.0. Test your soil with a simple kit. Add lime to raise pH or sulfur to lower it. Compost naturally buffers pH.', author: 'SoilScience_Jo', authorUID: 'openchain1ghi...jo', likes: 62 },
  { id: 't4', title: 'Late March: What to Plant Now', category: 'seasonal', content: 'Direct sow: peas, radishes, spinach, carrots. Start indoors: tomatoes, peppers, eggplant. Transplant cool-weather crops if frost risk is past.', author: 'SeasonalSam', authorUID: 'openchain1jkl...sam', likes: 201 },
];

const DEMO_HARVESTS: HarvestRecord[] = [
  { id: 'h1', plantName: 'Mint', harvestDate: '2026-03-22', weightKg: 0.3, sharedWithCommunity: true, sharedWeightKg: 0.15, eotkEarned: 150 },
  { id: 'h2', plantName: 'Lettuce Mix', harvestDate: '2026-03-26', weightKg: 0.8, sharedWithCommunity: true, sharedWeightKg: 0.4, eotkEarned: 400 },
];

type Tab = 'garden' | 'care' | 'journal' | 'tips';

export function GardeningScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('garden');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const totalHarvested = useMemo(() =>
    DEMO_HARVESTS.reduce((sum, h) => sum + h.weightKg, 0),
    [],
  );
  const totalShared = useMemo(() =>
    DEMO_HARVESTS.reduce((sum, h) => sum + h.sharedWeightKg, 0),
    [],
  );
  const totalEotk = useMemo(() =>
    DEMO_HARVESTS.reduce((sum, h) => sum + h.eotkEarned, 0),
    [],
  );

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    // Garden
    plantCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    plantRow: { flexDirection: 'row', alignItems: 'center' },
    plantIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    plantIconText: { color: t.accent.green, fontSize: 16, fontWeight: fonts.bold },
    plantInfo: { flex: 1 },
    plantName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    plantSpecies: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 1 },
    plantMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    stageBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    stageText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    summaryCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    summaryText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, width: '100%' },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // Care
    reminderCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    reminderRow: { flexDirection: 'row', alignItems: 'center' },
    reminderIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    reminderIconText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    reminderInfo: { flex: 1 },
    reminderTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    reminderMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    reminderDone: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    reminderDoneText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    // Journal
    journalCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    journalDate: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.bold },
    journalNote: { color: t.text.primary, fontSize: 14, marginTop: 6, lineHeight: 20 },
    journalMeta: { color: t.text.muted, fontSize: 11, marginTop: 6 },
    journalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    journalTag: { backgroundColor: t.accent.green + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    journalTagText: { color: t.accent.green, fontSize: 11, fontWeight: fonts.semibold },
    addJournalBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    addJournalText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    // Harvest
    harvestCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    harvestName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    harvestMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    harvestShared: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, marginTop: 4 },
    harvestEotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginTop: 2 },
    // Tips
    tipCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    tipCategory: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase', marginTop: 2 },
    tipContent: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 19 },
    tipFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    tipAuthor: { color: t.text.muted, fontSize: 12 },
    tipLikes: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.semibold },
    // Seed bank
    seedBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: t.accent.blue + '30' },
    seedBtnText: { color: t.accent.blue, fontSize: 15, fontWeight: fonts.bold },
    // Demo
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'garden', label: 'My Garden' },
    { key: 'care', label: 'Care' },
    { key: 'journal', label: 'Journal' },
    { key: 'tips', label: 'Tips' },
  ];

  // ─── Garden Tab ───

  const renderGarden = () => (
    <>
      <View style={s.summaryCard}>
        <Text style={s.summaryText}>Your Garden — {DEMO_PLANTS.length} Plants Growing</Text>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalHarvested.toFixed(1)} kg</Text>
            <Text style={s.statLabel}>Harvested</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{totalShared.toFixed(1)} kg</Text>
            <Text style={s.statLabel}>Shared</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{totalEotk}</Text>
            <Text style={s.statLabel}>eOTK Earned</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>My Plants</Text>
      {DEMO_PLANTS.map((pl) => {
        const stage = GROWTH_STAGES[pl.growthStage];
        return (
          <View key={pl.id} style={s.plantCard}>
            <View style={s.plantRow}>
              <View style={s.plantIcon}>
                <Text style={s.plantIconText}>{pl.icon}</Text>
              </View>
              <View style={s.plantInfo}>
                <Text style={s.plantName}>{pl.name}</Text>
                <Text style={s.plantSpecies}>{pl.species}</Text>
              </View>
            </View>
            <View style={[s.stageBadge, { backgroundColor: stage.color }]}>
              <Text style={s.stageText}>{stage.label}</Text>
            </View>
            <Text style={s.plantMeta}>
              Planted: {pl.plantedDate} | Last watered: {pl.lastWatered}
            </Text>
            <Text style={s.plantMeta}>{pl.careSchedule}</Text>
          </View>
        );
      })}

      <Text style={s.sectionTitle}>Harvest Log</Text>
      {DEMO_HARVESTS.map((h) => (
        <View key={h.id} style={s.harvestCard}>
          <Text style={s.harvestName}>{h.plantName}</Text>
          <Text style={s.harvestMeta}>
            {h.harvestDate} | {h.weightKg} kg harvested
          </Text>
          {h.sharedWithCommunity && (
            <Text style={s.harvestShared}>
              Shared {h.sharedWeightKg} kg with community
            </Text>
          )}
          <Text style={s.harvestEotk}>+{h.eotkEarned} eOTK</Text>
        </View>
      ))}
    </>
  );

  // ─── Care Tab ───

  const handleMarkDone = useCallback((reminder: CareReminder) => {
    const action = reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1);
    Alert.alert(
      'Done!',
      `${action} for ${reminder.plantName} marked complete.${reminder.recurring ? `\n\nNext reminder in ${reminder.intervalDays} days.` : ''}`,
    );
  }, []);

  const renderCare = () => (
    <>
      <Text style={s.sectionTitle}>Care Reminders</Text>
      {DEMO_REMINDERS.map((rem) => {
        const iconColor = CARE_COLORS[rem.type] || t.text.muted;
        return (
          <View key={rem.id} style={s.reminderCard}>
            <View style={s.reminderRow}>
              <View style={[s.reminderIcon, { backgroundColor: iconColor }]}>
                <Text style={s.reminderIconText}>{CARE_ICONS[rem.type]}</Text>
              </View>
              <View style={s.reminderInfo}>
                <Text style={s.reminderTitle}>
                  {rem.type.charAt(0).toUpperCase() + rem.type.slice(1)} — {rem.plantName}
                </Text>
                <Text style={s.reminderMeta}>
                  Due: {rem.dueDate}{rem.recurring ? ` | Every ${rem.intervalDays} days` : ' | One-time'}
                </Text>
              </View>
              <TouchableOpacity style={s.reminderDone} onPress={() => handleMarkDone(rem)}>
                <Text style={s.reminderDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Text style={s.sectionTitle}>Plant Care Overview</Text>
      <View style={s.card}>
        {DEMO_PLANTS.map((pl) => (
          <View key={pl.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 }}>
            <Text style={{ color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold }}>{pl.icon} {pl.name}</Text>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>Watered: {pl.lastWatered}</Text>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Journal Tab ───

  const renderJournal = () => (
    <>
      <Text style={s.sectionTitle}>Garden Journal</Text>

      <TouchableOpacity
        style={s.addJournalBtn}
        onPress={() => Alert.alert(
          'New Journal Entry',
          'Add a note about your garden today.\n\nPhotos are hashed and stored on Open Chain for permanent record.',
        )}
      >
        <Text style={s.addJournalText}>+ New Journal Entry</Text>
      </TouchableOpacity>

      {DEMO_JOURNAL.map((entry) => (
        <View key={entry.id} style={s.journalCard}>
          <Text style={s.journalDate}>{entry.date}</Text>
          <Text style={s.journalNote}>{entry.note}</Text>
          <Text style={s.journalMeta}>
            Photo: {entry.photoHash.substring(0, 12)}...
          </Text>
          <View style={s.journalTags}>
            {entry.tags.map((tag) => (
              <View key={tag} style={s.journalTag}>
                <Text style={s.journalTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Tips Tab ───

  const renderTips = () => (
    <>
      <Text style={s.sectionTitle}>Community Garden Tips</Text>

      <TouchableOpacity
        style={s.seedBtn}
        onPress={() => Alert.alert(
          'Seed Saving & Sharing',
          'Connect to the permaculture seed bank.\n\nSave seeds from your harvest and share with the community. Earn eOTK for every seed packet shared.\n\nBuilding food sovereignty, one seed at a time.',
        )}
      >
        <Text style={s.seedBtnText}>Seed Saving & Sharing Network</Text>
      </TouchableOpacity>

      {DEMO_TIPS.map((tip) => (
        <View key={tip.id} style={s.tipCard}>
          <Text style={s.tipTitle}>{tip.title}</Text>
          <Text style={s.tipCategory}>{tip.category}</Text>
          <Text style={s.tipContent}>{tip.content}</Text>
          <View style={s.tipFooter}>
            <Text style={s.tipAuthor}>by {tip.author}</Text>
            <Text style={s.tipLikes}>{'*'} {tip.likes} likes</Text>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Gardening</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'garden' && renderGarden()}
        {tab === 'care' && renderCare()}
        {tab === 'journal' && renderJournal()}
        {tab === 'tips' && renderTips()}
      </ScrollView>
    </SafeAreaView>
  );
}
