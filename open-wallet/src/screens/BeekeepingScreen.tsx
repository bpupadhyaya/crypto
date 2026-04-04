import { fonts } from '../utils/theme';
/**
 * Beekeeping Screen -- Community apiaries, pollinator protection, honey sharing.
 *
 * Article I: "Every community's stewardship of nature deserves recognition."
 * eOTK earned for teaching beekeeping skills.
 *
 * Features:
 * - Community hives (location, colony health, honey yield, beekeeper)
 * - Hive inspection log (queen spotted, brood pattern, disease signs, mite count)
 * - Honey harvest tracker and community sharing
 * - Pollinator garden guide (plants that support bees)
 * - Beekeeping classes for beginners (earn eOTK for teaching)
 * - Swarm alerts (report swarms for safe relocation)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface CommunityHive {
  id: string;
  name: string;
  location: string;
  colonyHealth: 'thriving' | 'stable' | 'stressed' | 'critical';
  honeyYieldKg: number;
  beekeeper: string;
  queenAge: string;
  hiveType: string;
  lastInspection: string;
}

interface InspectionLog {
  id: string;
  hiveId: string;
  date: string;
  queenSpotted: boolean;
  broodPattern: 'excellent' | 'good' | 'spotty' | 'poor';
  diseaseSigns: string[];
  miteCount: number;
  temperament: 'calm' | 'moderate' | 'defensive';
  honeyStores: 'full' | 'adequate' | 'low';
  notes: string;
  inspector: string;
}

interface HoneyHarvest {
  id: string;
  hiveId: string;
  date: string;
  yieldKg: number;
  variety: string;
  sharedWithCommunity: number;
  keptByBeekeeper: number;
}

interface PollinatorPlant {
  id: string;
  name: string;
  type: 'flower' | 'herb' | 'shrub' | 'tree';
  bloomSeason: string;
  pollinatorValue: 'high' | 'medium' | 'low';
  nativeTo: string;
  careLevel: 'easy' | 'moderate' | 'expert';
}

interface Props {
  onClose: () => void;
}

// --- Constants ---

const HEALTH_COLORS: Record<string, string> = {
  thriving: '#34C759',
  stable: '#007AFF',
  stressed: '#FF9500',
  critical: '#FF3B30',
};

const BROOD_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  spotty: 'Spotty',
  poor: 'Poor',
};

const PLANT_TYPE_ICONS: Record<string, string> = {
  flower: 'F',
  herb: 'H',
  shrub: 'S',
  tree: 'T',
};

// --- Demo Data ---

const DEMO_HIVES: CommunityHive[] = [
  {
    id: 'h1', name: 'Sunflower Apiary #1', location: 'Riverside Community Garden',
    colonyHealth: 'thriving', honeyYieldKg: 28.5, beekeeper: 'Maria Santos',
    queenAge: '2025 (1 year)', hiveType: 'Langstroth', lastInspection: '2026-03-27',
  },
  {
    id: 'h2', name: 'Hilltop Hive', location: 'Oak Hill Park',
    colonyHealth: 'stable', honeyYieldKg: 15.2, beekeeper: 'James Chen',
    queenAge: '2024 (2 years)', hiveType: 'Top Bar', lastInspection: '2026-03-25',
  },
  {
    id: 'h3', name: 'School Garden Colony', location: 'Lincoln Elementary',
    colonyHealth: 'stressed', honeyYieldKg: 8.0, beekeeper: 'Aisha Patel',
    queenAge: '2026 (new)', hiveType: 'Warre', lastInspection: '2026-03-22',
  },
];

const DEMO_INSPECTIONS: InspectionLog[] = [
  {
    id: 'i1', hiveId: 'h1', date: '2026-03-27', queenSpotted: true,
    broodPattern: 'excellent', diseaseSigns: [], miteCount: 2,
    temperament: 'calm', honeyStores: 'full',
    notes: 'Colony is strong. Queen laying well. Ready for spring flow.',
    inspector: 'Maria Santos',
  },
  {
    id: 'i2', hiveId: 'h3', date: '2026-03-22', queenSpotted: false,
    broodPattern: 'spotty', diseaseSigns: ['chalkbrood'],
    miteCount: 8, temperament: 'defensive', honeyStores: 'low',
    notes: 'Queen not seen. Spotty brood may indicate failing queen. Mite count high, treating with oxalic acid.',
    inspector: 'Aisha Patel',
  },
];

const DEMO_HARVEST: HoneyHarvest = {
  id: 'hv1', hiveId: 'h1', date: '2026-03-15', yieldKg: 12.5,
  variety: 'Wildflower', sharedWithCommunity: 8.0, keptByBeekeeper: 4.5,
};

const DEMO_PLANTS: PollinatorPlant[] = [
  { id: 'p1', name: 'Lavender', type: 'herb', bloomSeason: 'Jun-Aug', pollinatorValue: 'high', nativeTo: 'Mediterranean', careLevel: 'easy' },
  { id: 'p2', name: 'Sunflower', type: 'flower', bloomSeason: 'Jul-Sep', pollinatorValue: 'high', nativeTo: 'North America', careLevel: 'easy' },
  { id: 'p3', name: 'Bee Balm', type: 'flower', bloomSeason: 'Jun-Sep', pollinatorValue: 'high', nativeTo: 'North America', careLevel: 'easy' },
  { id: 'p4', name: 'Linden Tree', type: 'tree', bloomSeason: 'Jun-Jul', pollinatorValue: 'high', nativeTo: 'Northern Hemisphere', careLevel: 'moderate' },
];

type Tab = 'hives' | 'inspect' | 'harvest' | 'garden';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hives', label: 'Hives' },
  { key: 'inspect', label: 'Inspect' },
  { key: 'harvest', label: 'Harvest' },
  { key: 'garden', label: 'Garden' },
];

export function BeekeepingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('hives');
  const [inspQueenSpotted, setInspQueenSpotted] = useState(false);
  const [inspBrood, setInspBrood] = useState('good');
  const [inspMiteCount, setInspMiteCount] = useState('');
  const [inspNotes, setInspNotes] = useState('');
  const [selectedHive, setSelectedHive] = useState('h1');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const hives = DEMO_HIVES;
  const inspections = DEMO_INSPECTIONS;
  const harvest = DEMO_HARVEST;
  const plants = DEMO_PLANTS;

  const handleLogInspection = useCallback(() => {
    const mites = parseInt(inspMiteCount, 10);
    if (isNaN(mites) || mites < 0) { Alert.alert('Required', 'Enter a valid mite count.'); return; }
    if (!inspNotes.trim()) { Alert.alert('Required', 'Add inspection notes.'); return; }

    const hiveName = hives.find(h => h.id === selectedHive)?.name || selectedHive;
    Alert.alert(
      'Inspection Logged',
      `${hiveName}\nQueen: ${inspQueenSpotted ? 'Spotted' : 'Not seen'}\nBrood: ${inspBrood}\nMites: ${mites}\n\nEarned 150 eOTK for hive stewardship.`,
    );
    setInspQueenSpotted(false);
    setInspBrood('good');
    setInspMiteCount('');
    setInspNotes('');
  }, [selectedHive, inspQueenSpotted, inspBrood, inspMiteCount, inspNotes, hives]);

  const handleReportSwarm = useCallback(() => {
    Alert.alert(
      'Swarm Reported',
      'Alert sent to local beekeepers for safe relocation. Thank you for protecting the bees! Earned 100 eOTK.',
    );
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.orange + '20' },
    tabText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.orange },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    heroCard: { backgroundColor: t.accent.orange + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    hiveName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    hiveLocation: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    healthText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailLabel: { color: t.text.muted, fontSize: 13 },
    detailValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    inspectionCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    inspDate: { color: t.text.muted, fontSize: 12, marginBottom: 6 },
    inspRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    inspLabel: { color: t.text.secondary, fontSize: 13 },
    inspValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    inspNotes: { color: t.text.secondary, fontSize: 12, fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
    warningBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    warningText: { color: '#FF3B30', fontSize: 11, fontWeight: fonts.semibold },
    inputCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    toggleRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
    toggleChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.primary },
    toggleChipActive: { backgroundColor: t.accent.orange },
    toggleText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    toggleTextActive: { color: '#fff' },
    actionBtn: { backgroundColor: t.accent.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    swarmBtn: { backgroundColor: '#FF3B30', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 12 },
    swarmBtnText: { color: '#fff', fontSize: 16, fontWeight: fonts.bold },
    harvestCard: { backgroundColor: t.accent.orange + '08', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    harvestBig: { color: t.text.primary, fontSize: 42, fontWeight: fonts.heavy, textAlign: 'center' },
    harvestUnit: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 2 },
    shareRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    plantCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
    plantIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent.green + '20', alignItems: 'center', justifyContent: 'center' },
    plantIconText: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy },
    plantInfo: { flex: 1 },
    plantName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    plantMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    valueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
    valueBadgeText: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoTagText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    selectRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginHorizontal: 20, marginBottom: 12 },
    selectChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.bg.secondary },
    selectChipActive: { backgroundColor: t.accent.orange },
    selectChipText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    selectChipTextActive: { color: '#fff' },
  }), [t]);

  // --- Hives Tab ---
  const renderHives = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Community Apiaries</Text>
        <Text style={s.heroSubtitle}>
          Healthy bees, healthy communities.{'\n'}Monitor hives, share honey, protect pollinators.
        </Text>
      </View>

      <TouchableOpacity style={s.swarmBtn} onPress={handleReportSwarm}>
        <Text style={s.swarmBtnText}>! Report a Swarm</Text>
      </TouchableOpacity>

      <Text style={[s.sectionTitle, { marginTop: 20 }]}>Community Hives ({hives.length})</Text>

      {hives.map(hive => (
        <View key={hive.id} style={s.card}>
          <Text style={s.hiveName}>{hive.name}</Text>
          <Text style={s.hiveLocation}>{hive.location}</Text>
          <View style={[s.healthBadge, { backgroundColor: HEALTH_COLORS[hive.colonyHealth] }]}>
            <Text style={s.healthText}>{hive.colonyHealth}</Text>
          </View>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{hive.honeyYieldKg}</Text>
              <Text style={s.statLabel}>Yield (kg)</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{hive.hiveType}</Text>
              <Text style={s.statLabel}>Hive Type</Text>
            </View>
          </View>
          <View style={[s.detailRow, { marginTop: 12 }]}>
            <Text style={s.detailLabel}>Beekeeper</Text>
            <Text style={s.detailValue}>{hive.beekeeper}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Queen Age</Text>
            <Text style={s.detailValue}>{hive.queenAge}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Last Inspection</Text>
            <Text style={s.detailValue}>{hive.lastInspection}</Text>
          </View>
        </View>
      ))}
    </>
  );

  // --- Inspect Tab ---
  const renderInspect = () => (
    <>
      <Text style={s.sectionTitle}>Recent Inspections</Text>

      {inspections.map(insp => {
        const hive = hives.find(h => h.id === insp.hiveId);
        return (
          <View key={insp.id} style={s.inspectionCard}>
            <Text style={s.hiveName}>{hive?.name || insp.hiveId}</Text>
            <Text style={s.inspDate}>{insp.date} -- {insp.inspector}</Text>
            <View style={s.inspRow}>
              <Text style={s.inspLabel}>Queen Spotted</Text>
              <Text style={s.inspValue}>{insp.queenSpotted ? 'Yes' : 'No'}</Text>
            </View>
            <View style={s.inspRow}>
              <Text style={s.inspLabel}>Brood Pattern</Text>
              <Text style={s.inspValue}>{BROOD_LABELS[insp.broodPattern]}</Text>
            </View>
            <View style={s.inspRow}>
              <Text style={s.inspLabel}>Mite Count</Text>
              <Text style={[s.inspValue, insp.miteCount > 5 ? { color: '#FF3B30' } : {}]}>
                {insp.miteCount} {insp.miteCount > 5 ? '(HIGH)' : ''}
              </Text>
            </View>
            <View style={s.inspRow}>
              <Text style={s.inspLabel}>Temperament</Text>
              <Text style={s.inspValue}>{insp.temperament}</Text>
            </View>
            <View style={s.inspRow}>
              <Text style={s.inspLabel}>Honey Stores</Text>
              <Text style={s.inspValue}>{insp.honeyStores}</Text>
            </View>
            {insp.diseaseSigns.length > 0 && (
              <View style={[s.warningBadge, { marginTop: 8 }]}>
                <Text style={s.warningText}>Disease: {insp.diseaseSigns.join(', ')}</Text>
              </View>
            )}
            <Text style={s.inspNotes}>{insp.notes}</Text>
          </View>
        );
      })}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Log New Inspection</Text>

      <Text style={[s.inputLabel, { marginHorizontal: 20 }]}>Select Hive</Text>
      <View style={s.selectRow}>
        {hives.map(h => (
          <TouchableOpacity
            key={h.id}
            style={[s.selectChip, selectedHive === h.id && s.selectChipActive]}
            onPress={() => setSelectedHive(h.id)}
          >
            <Text style={[s.selectChipText, selectedHive === h.id && s.selectChipTextActive]}>
              {h.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.inputCard}>
        <Text style={s.inputLabel}>Queen Spotted?</Text>
        <View style={s.toggleRow}>
          <TouchableOpacity
            style={[s.toggleChip, inspQueenSpotted && s.toggleChipActive]}
            onPress={() => setInspQueenSpotted(true)}
          >
            <Text style={[s.toggleText, inspQueenSpotted && s.toggleTextActive]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleChip, !inspQueenSpotted && s.toggleChipActive]}
            onPress={() => setInspQueenSpotted(false)}
          >
            <Text style={[s.toggleText, !inspQueenSpotted && s.toggleTextActive]}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.inputLabel}>Brood Pattern</Text>
        <View style={s.toggleRow}>
          {Object.entries(BROOD_LABELS).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.toggleChip, inspBrood === key && s.toggleChipActive]}
              onPress={() => setInspBrood(key)}
            >
              <Text style={[s.toggleText, inspBrood === key && s.toggleTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.inputLabel}>Mite Count (per 100 bees)</Text>
        <TextInput
          style={s.input}
          value={inspMiteCount}
          onChangeText={setInspMiteCount}
          placeholder="0"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
        />

        <Text style={[s.inputLabel, { marginTop: 12 }]}>Notes</Text>
        <TextInput
          style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={inspNotes}
          onChangeText={setInspNotes}
          placeholder="Colony observations, treatments, concerns..."
          placeholderTextColor={t.text.muted}
          multiline
        />
      </View>

      <TouchableOpacity style={s.actionBtn} onPress={handleLogInspection}>
        <Text style={s.actionBtnText}>Log Inspection (+150 eOTK)</Text>
      </TouchableOpacity>
    </>
  );

  // --- Harvest Tab ---
  const renderHarvest = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Honey Harvest</Text>
        <Text style={s.heroSubtitle}>
          Track yields and share the sweetness with your community.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Latest Harvest</Text>
      <View style={s.harvestCard}>
        <Text style={s.harvestBig}>{harvest.yieldKg}</Text>
        <Text style={s.harvestUnit}>kg of {harvest.variety} Honey</Text>
        <Text style={[s.hiveLocation, { textAlign: 'center', marginTop: 4 }]}>
          {hives.find(h => h.id === harvest.hiveId)?.name} -- {harvest.date}
        </Text>
        <View style={s.shareRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{harvest.sharedWithCommunity}</Text>
            <Text style={s.statLabel}>Community (kg)</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{harvest.keptByBeekeeper}</Text>
            <Text style={s.statLabel}>Beekeeper (kg)</Text>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>All-Time Summary</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>51.7</Text>
            <Text style={s.statLabel}>Total Yield (kg)</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>6</Text>
            <Text style={s.statLabel}>Harvests</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>34.2</Text>
            <Text style={s.statLabel}>Shared (kg)</Text>
          </View>
        </View>
        <View style={[s.detailRow, { marginTop: 16 }]}>
          <Text style={s.detailLabel}>Community Share Rate</Text>
          <Text style={[s.detailValue, { color: t.accent.green }]}>66%</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>eOTK Earned from Sharing</Text>
          <Text style={[s.detailValue, { color: t.accent.orange }]}>3,420</Text>
        </View>
      </View>
    </>
  );

  // --- Garden Tab ---
  const renderGarden = () => (
    <>
      <View style={s.heroCard}>
        <Text style={{ fontSize: 48 }}>*</Text>
        <Text style={s.heroTitle}>Pollinator Garden Guide</Text>
        <Text style={s.heroSubtitle}>
          Plant these species to support bees and pollinators in your community.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Recommended Plants ({plants.length})</Text>

      {plants.map(plant => {
        const valueColor = plant.pollinatorValue === 'high' ? '#34C759'
          : plant.pollinatorValue === 'medium' ? '#FF9500' : '#8E8E93';
        return (
          <View key={plant.id} style={s.plantCard}>
            <View style={s.plantIcon}>
              <Text style={s.plantIconText}>{PLANT_TYPE_ICONS[plant.type]}</Text>
            </View>
            <View style={s.plantInfo}>
              <Text style={s.plantName}>{plant.name}</Text>
              <Text style={s.plantMeta}>
                {plant.type} -- Blooms {plant.bloomSeason} -- {plant.careLevel} care
              </Text>
              <Text style={s.plantMeta}>Native to {plant.nativeTo}</Text>
              <View style={[s.valueBadge, { backgroundColor: valueColor + '20' }]}>
                <Text style={[s.valueBadgeText, { color: valueColor }]}>
                  {plant.pollinatorValue} pollinator value
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Beekeeping Classes</Text>
      <View style={s.card}>
        <Text style={s.hiveName}>Beginner Beekeeping 101</Text>
        <Text style={s.hiveLocation}>Teach new beekeepers and earn eOTK</Text>
        <View style={[s.detailRow, { marginTop: 12 }]}>
          <Text style={s.detailLabel}>Next Session</Text>
          <Text style={s.detailValue}>Apr 5, 2026</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Reward</Text>
          <Text style={[s.detailValue, { color: t.accent.orange }]}>500 eOTK per class</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Enrolled</Text>
          <Text style={s.detailValue}>8 / 12 spots</Text>
        </View>
        <TouchableOpacity style={[s.actionBtn, { marginHorizontal: 0, marginTop: 14 }]}>
          <Text style={s.actionBtnText}>Volunteer to Teach</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Beekeeping</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoTagText}>DEMO DATA</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {tab === 'hives' && renderHives()}
        {tab === 'inspect' && renderInspect()}
        {tab === 'harvest' && renderHarvest()}
        {tab === 'garden' && renderGarden()}
      </ScrollView>
    </SafeAreaView>
  );
}
