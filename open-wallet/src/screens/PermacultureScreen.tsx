import { fonts } from '../utils/theme';
/**
 * Permaculture Screen — Sustainable agriculture, permaculture design,
 * soil health.
 *
 * Article I: "Every dimension of human contribution is valued equally."
 * Caring for the soil is caring for future generations — permaculture
 * designs systems that regenerate rather than deplete.
 *
 * Features:
 * - Permaculture zones guide (Zone 0: home -> Zone 5: wild)
 * - Soil health tracker (pH, organic matter, moisture, biodiversity)
 * - Companion planting guide (what grows well together)
 * - Seed bank — community seed sharing and preservation
 * - Water harvesting techniques (swales, keyline, rain gardens)
 * - Community permaculture projects (food forests, polyculture fields)
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface PermacultureZone {
  zone: number;
  name: string;
  description: string;
  examples: string[];
  color: string;
}

interface SoilData {
  location: string;
  ph: number;
  organicMatter: number; // percentage
  moisture: number; // percentage
  biodiversityScore: number; // 1-10
  lastTested: string;
}

interface CompanionPair {
  id: string;
  plantA: string;
  plantB: string;
  benefit: string;
  iconA: string;
  iconB: string;
}

interface SeedListing {
  id: string;
  name: string;
  variety: string;
  contributor: string;
  available: number;
  type: string;
  region: string;
}

interface WaterTechnique {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  waterSaved: string;
}

interface CommunityProject {
  id: string;
  name: string;
  type: string;
  participants: number;
  area: string;
  status: string;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const ZONE_COLORS: Record<number, string> = {
  0: '#FF6B35',
  1: '#34C759',
  2: '#007AFF',
  3: '#AF52DE',
  4: '#FFD60A',
  5: '#8B6914',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#34C759',
  planning: '#FF9500',
  established: '#007AFF',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: '#34C759',
  Intermediate: '#FF9500',
  Advanced: '#AF52DE',
};

// ─── Demo Data ───

const DEMO_ZONES: PermacultureZone[] = [
  { zone: 0, name: 'Home', description: 'The dwelling itself — energy efficiency, food preservation, seed storage.', examples: ['Kitchen composting', 'Seed drying rack', 'Solar panels', 'Rainwater collection from roof'], color: ZONE_COLORS[0] },
  { zone: 1, name: 'Kitchen Garden', description: 'Highest maintenance, visited daily — herbs, salad greens, high-yield vegetables.', examples: ['Herbs (basil, mint, cilantro)', 'Salad greens', 'Tomatoes', 'Worm composting bin'], color: ZONE_COLORS[1] },
  { zone: 2, name: 'Perennial Garden', description: 'Densely planted food systems — fruit trees, berries, larger vegetables.', examples: ['Fruit trees', 'Berry bushes', 'Compost bays', 'Chicken coop'], color: ZONE_COLORS[2] },
  { zone: 3, name: 'Farm Zone', description: 'Broadscale crops, orchards, pasture — less frequent maintenance.', examples: ['Grain crops', 'Large orchard', 'Pasture rotation', 'Pond/dam'], color: ZONE_COLORS[3] },
  { zone: 4, name: 'Semi-Wild', description: 'Managed wild — timber, foraging, wild food harvesting.', examples: ['Timber woodlot', 'Wild mushroom logs', 'Foraging areas', 'Wildlife corridors'], color: ZONE_COLORS[4] },
  { zone: 5, name: 'Wild', description: 'Untouched wilderness — observation only, learning from nature\'s design.', examples: ['Native forest', 'Wetlands', 'Wildlife habitat', 'Observation and learning'], color: ZONE_COLORS[5] },
];

const DEMO_SOIL: SoilData = {
  location: 'Community Garden Plot #7',
  ph: 6.4,
  organicMatter: 5.2,
  moisture: 38,
  biodiversityScore: 7,
  lastTested: '2026-03-15',
};

const DEMO_COMPANION_PAIRS: CompanionPair[] = [
  { id: '1', plantA: 'Tomato', plantB: 'Basil', benefit: 'Basil repels aphids and whiteflies, improves tomato flavor.', iconA: 'T', iconB: 'B' },
  { id: '2', plantA: 'Corn', plantB: 'Beans', benefit: 'Beans fix nitrogen; corn provides a trellis (Three Sisters).', iconA: 'C', iconB: 'Bn' },
  { id: '3', plantA: 'Carrot', plantB: 'Onion', benefit: 'Onion deters carrot fly; carrot deters onion fly.', iconA: 'Ca', iconB: 'O' },
  { id: '4', plantA: 'Squash', plantB: 'Nasturtium', benefit: 'Nasturtiums trap aphids away from squash plants.', iconA: 'S', iconB: 'N' },
  { id: '5', plantA: 'Apple Tree', plantB: 'Comfrey', benefit: 'Comfrey mines deep nutrients, mulch-maker, attracts pollinators.', iconA: 'A', iconB: 'Cf' },
];

const DEMO_SEEDS: SeedListing[] = [
  { id: '1', name: 'Cherokee Purple Tomato', variety: 'Heirloom', contributor: 'Maria G.', available: 25, type: 'Vegetable', region: 'Zone 5-9' },
  { id: '2', name: 'Scarlet Runner Bean', variety: 'Open-pollinated', contributor: 'Community Seed Library', available: 50, type: 'Legume', region: 'Zone 4-10' },
  { id: '3', name: 'Lemon Balm', variety: 'Heirloom', contributor: 'David K.', available: 40, type: 'Herb', region: 'Zone 3-7' },
  { id: '4', name: 'Painted Mountain Corn', variety: 'Heritage', contributor: 'Indigenous Seeds Collective', available: 15, type: 'Grain', region: 'Zone 3-8' },
];

const DEMO_WATER_TECHNIQUES: WaterTechnique[] = [
  { id: '1', name: 'Swales on Contour', description: 'Shallow ditches dug along contour lines to slow, spread, and sink rainwater into the soil.', difficulty: 'Intermediate', waterSaved: 'High — captures thousands of gallons per rain event' },
  { id: '2', name: 'Keyline Design', description: 'Plowing pattern that directs water from valleys to ridges, distributing moisture evenly across the landscape.', difficulty: 'Advanced', waterSaved: 'Very High — transforms arid land over seasons' },
  { id: '3', name: 'Rain Gardens', description: 'Depressed garden beds planted with native species that absorb and filter stormwater runoff.', difficulty: 'Beginner', waterSaved: 'Moderate — 30% reduction in runoff' },
  { id: '4', name: 'Hugelkultur Beds', description: 'Raised beds built over buried logs that act as sponges, holding moisture for years.', difficulty: 'Intermediate', waterSaved: 'High — reduces watering needs by 70%' },
];

const DEMO_PROJECTS: CommunityProject[] = [
  { id: '1', name: 'Riverside Food Forest', type: 'Food Forest', participants: 34, area: '2.5 acres', status: 'active', description: 'A seven-layer food forest with 40+ species of fruit, nut, and support trees. Community harvest days every Saturday.' },
  { id: '2', name: 'School Polyculture Garden', type: 'Polyculture Field', participants: 22, area: '0.5 acres', status: 'active', description: 'Students design and maintain polyculture beds — learning ecology through growing food.' },
  { id: '3', name: 'Neighborhood Seed Library', type: 'Seed Bank', participants: 56, area: 'Community Center', status: 'established', description: 'Free seed lending library with 200+ varieties. Borrow seeds, return seeds from your harvest.' },
];

type Tab = 'guide' | 'soil' | 'seeds' | 'projects';

export function PermacultureScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('guide');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

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
    heroCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    // Zones
    zoneCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    zoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    zoneBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    zoneBadgeText: { color: '#fff', fontSize: 16, fontWeight: fonts.heavy },
    zoneName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    zoneDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18, marginBottom: 8 },
    exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    exampleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    exampleTagText: { fontSize: 11, fontWeight: fonts.semibold },
    // Soil
    soilCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    soilLocation: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    soilRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    soilLabel: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    soilValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.heavy },
    soilBarOuter: { height: 8, backgroundColor: t.bg.primary, borderRadius: 4, marginTop: 4, flex: 1, marginLeft: 12 },
    soilBarInner: { height: 8, borderRadius: 4 },
    soilMeta: { color: t.text.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },
    // Companion planting
    companionCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    companionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    companionIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
    companionIconText: { color: '#fff', fontSize: 11, fontWeight: fonts.heavy },
    companionPlus: { color: t.text.muted, fontSize: 18, fontWeight: '300', marginHorizontal: 4 },
    companionNames: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, flex: 1, marginLeft: 8 },
    companionBenefit: { color: t.text.secondary, fontSize: 13, lineHeight: 18 },
    // Water
    waterCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    waterName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    waterDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
    waterMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    difficultyTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    difficultyText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },
    waterSaved: { color: t.text.muted, fontSize: 12, flex: 1, marginLeft: 10 },
    // Seeds
    seedCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    seedName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    seedVariety: { color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    seedMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    seedAvailable: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginTop: 4 },
    requestSeedBtn: { backgroundColor: t.accent.green + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    requestSeedText: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    // Projects
    projectCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    projectName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    projectMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    projectDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 18, marginTop: 6 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'guide', label: 'Guide' },
    { key: 'soil', label: 'Soil' },
    { key: 'seeds', label: 'Seeds' },
    { key: 'projects', label: 'Projects' },
  ];

  // ─── Guide Tab ───

  const renderGuide = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Permaculture designs human systems that mimic{'\n'}
          the patterns found in nature.{'\n\n'}
          Care for the earth. Care for people.{'\n'}
          Share the surplus.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Permaculture Zones</Text>
      {DEMO_ZONES.map((zone) => (
        <View key={zone.zone} style={s.zoneCard}>
          <View style={s.zoneHeader}>
            <View style={[s.zoneBadge, { backgroundColor: zone.color }]}>
              <Text style={s.zoneBadgeText}>{zone.zone}</Text>
            </View>
            <Text style={s.zoneName}>Zone {zone.zone}: {zone.name}</Text>
          </View>
          <Text style={s.zoneDesc}>{zone.description}</Text>
          <View style={s.exampleRow}>
            {zone.examples.map((ex) => (
              <View key={ex} style={[s.exampleTag, { backgroundColor: zone.color + '20' }]}>
                <Text style={[s.exampleTagText, { color: zone.color }]}>{ex}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Companion Planting */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Companion Planting</Text>
      {DEMO_COMPANION_PAIRS.map((pair) => (
        <View key={pair.id} style={s.companionCard}>
          <View style={s.companionHeader}>
            <View style={[s.companionIcon, { backgroundColor: t.accent.green }]}>
              <Text style={s.companionIconText}>{pair.iconA}</Text>
            </View>
            <Text style={s.companionPlus}>+</Text>
            <View style={[s.companionIcon, { backgroundColor: '#AF52DE' }]}>
              <Text style={s.companionIconText}>{pair.iconB}</Text>
            </View>
            <Text style={s.companionNames}>{pair.plantA} + {pair.plantB}</Text>
          </View>
          <Text style={s.companionBenefit}>{pair.benefit}</Text>
        </View>
      ))}

      {/* Water Harvesting */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Water Harvesting Techniques</Text>
      {DEMO_WATER_TECHNIQUES.map((tech) => (
        <View key={tech.id} style={s.waterCard}>
          <Text style={s.waterName}>{tech.name}</Text>
          <Text style={s.waterDesc}>{tech.description}</Text>
          <View style={s.waterMeta}>
            <View style={[s.difficultyTag, { backgroundColor: DIFFICULTY_COLORS[tech.difficulty] || '#8E8E93' }]}>
              <Text style={s.difficultyText}>{tech.difficulty}</Text>
            </View>
            <Text style={s.waterSaved}>{tech.waterSaved}</Text>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Soil Tab ───

  const renderSoil = () => {
    const phColor = DEMO_SOIL.ph >= 6.0 && DEMO_SOIL.ph <= 7.0 ? t.accent.green : t.accent.orange;
    const omColor = DEMO_SOIL.organicMatter >= 5.0 ? t.accent.green : DEMO_SOIL.organicMatter >= 3.0 ? t.accent.orange : '#FF3B30';
    const moistColor = DEMO_SOIL.moisture >= 30 && DEMO_SOIL.moisture <= 60 ? t.accent.green : t.accent.orange;
    const bioColor = DEMO_SOIL.biodiversityScore >= 7 ? t.accent.green : DEMO_SOIL.biodiversityScore >= 4 ? t.accent.orange : '#FF3B30';

    return (
      <>
        <View style={s.heroCard}>
          <Text style={s.heroText}>
            Healthy soil is alive — teeming with billions{'\n'}
            of organisms in every handful.{'\n\n'}
            Feed the soil, and the soil feeds you.
          </Text>
        </View>

        <Text style={s.sectionTitle}>Soil Health Report</Text>
        <View style={s.soilCard}>
          <Text style={s.soilLocation}>{DEMO_SOIL.location}</Text>

          <View style={s.soilRow}>
            <Text style={s.soilLabel}>pH Level</Text>
            <Text style={[s.soilValue, { color: phColor }]}>{DEMO_SOIL.ph}</Text>
          </View>
          <View style={[s.soilRow, { alignItems: 'center' }]}>
            <Text style={s.soilLabel}>Organic Matter</Text>
            <View style={s.soilBarOuter}>
              <View style={[s.soilBarInner, { width: `${Math.min(DEMO_SOIL.organicMatter * 10, 100)}%`, backgroundColor: omColor }]} />
            </View>
            <Text style={[s.soilValue, { marginLeft: 8, color: omColor }]}>{DEMO_SOIL.organicMatter}%</Text>
          </View>
          <View style={[s.soilRow, { alignItems: 'center' }]}>
            <Text style={s.soilLabel}>Moisture</Text>
            <View style={s.soilBarOuter}>
              <View style={[s.soilBarInner, { width: `${DEMO_SOIL.moisture}%`, backgroundColor: moistColor }]} />
            </View>
            <Text style={[s.soilValue, { marginLeft: 8, color: moistColor }]}>{DEMO_SOIL.moisture}%</Text>
          </View>
          <View style={s.soilRow}>
            <Text style={s.soilLabel}>Biodiversity Score</Text>
            <Text style={[s.soilValue, { color: bioColor }]}>{DEMO_SOIL.biodiversityScore}/10</Text>
          </View>

          <Text style={s.soilMeta}>Last tested: {DEMO_SOIL.lastTested}</Text>
        </View>

        {/* Soil tips */}
        <View style={s.card}>
          <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Improve Your Soil</Text>
          <Text style={s.heroText}>
            Add compost regularly to boost organic matter.{'\n'}
            Mulch to retain moisture and protect soil life.{'\n'}
            Avoid tilling — let the worms do the work.{'\n'}
            Plant cover crops in off-seasons.{'\n'}
            Test soil annually to track improvements.
          </Text>
        </View>
      </>
    );
  };

  // ─── Seeds Tab ───

  const renderSeeds = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Seeds are the memory of the earth.{'\n\n'}
          Share seeds, preserve biodiversity,{'\n'}
          and keep heritage varieties alive.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Community Seed Bank</Text>
      {DEMO_SEEDS.map((seed) => (
        <View key={seed.id} style={s.seedCard}>
          <Text style={s.seedName}>{seed.name}</Text>
          <Text style={s.seedVariety}>{seed.variety} — {seed.type}</Text>
          <Text style={s.seedMeta}>Contributed by {seed.contributor} | {seed.region}</Text>
          <Text style={s.seedAvailable}>{seed.available} packets available</Text>
          <TouchableOpacity
            style={s.requestSeedBtn}
            onPress={() => Alert.alert('Request Seeds', `Request ${seed.name} seeds from the community seed bank.`)}
          >
            <Text style={s.requestSeedText}>Request Seeds</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Projects Tab ───

  const renderProjects = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroText}>
          Permaculture is a team sport.{'\n\n'}
          Join a community project and grow{'\n'}
          abundance together.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Community Projects</Text>
      {DEMO_PROJECTS.map((proj) => {
        const statusColor = STATUS_COLORS[proj.status] || '#8E8E93';
        return (
          <View key={proj.id} style={s.projectCard}>
            <View style={s.projectHeader}>
              <Text style={s.projectName}>{proj.name}</Text>
              <View style={[s.statusTag, { backgroundColor: statusColor }]}>
                <Text style={s.statusText}>{proj.status}</Text>
              </View>
            </View>
            <Text style={s.projectMeta}>{proj.type} | {proj.participants} participants | {proj.area}</Text>
            <Text style={s.projectDesc}>{proj.description}</Text>
            <TouchableOpacity
              style={s.joinBtn}
              onPress={() => Alert.alert('Join Project', `Request to join "${proj.name}".`)}
            >
              <Text style={s.joinBtnText}>Join This Project</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Permaculture</Text>
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
        {tab === 'guide' && renderGuide()}
        {tab === 'soil' && renderSoil()}
        {tab === 'seeds' && renderSeeds()}
        {tab === 'projects' && renderProjects()}
      </ScrollView>
    </SafeAreaView>
  );
}
