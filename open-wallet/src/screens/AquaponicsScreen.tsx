import { fonts } from '../utils/theme';
/**
 * Aquaponics Screen — Modern sustainable farming: aquaponics, hydroponics,
 * vertical farming, and aeroponics.
 *
 * "Food sovereignty begins with knowledge — every community deserves
 *  the ability to grow its own nutrition sustainably."
 * — Human Constitution, Article I
 *
 * Features:
 * - System types guide (aquaponics, hydroponics, vertical, aeroponics)
 * - Community systems (shared facilities, production, crops)
 * - Build your own (step-by-step guides for home systems)
 * - Harvest log (what community systems produce)
 * - Classes (learn to build and maintain systems — earn eOTK)
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

/* ── data types ── */

interface SystemType {
  id: string;
  name: string;
  icon: string;
  description: string;
  howItWorks: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

interface CommunitySystem {
  id: string;
  name: string;
  type: string;
  location: string;
  crops: string[];
  monthlyYieldKg: number;
  members: number;
  eOTKEarned: number;
  icon: string;
  status: 'active' | 'building' | 'planned';
}

interface BuildGuide {
  id: string;
  title: string;
  systemType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCost: string;
  timeToComplete: string;
  steps: string[];
  materialsCount: number;
  icon: string;
  eOTKReward: number;
}

interface HarvestEntry {
  id: string;
  systemName: string;
  crop: string;
  quantityKg: number;
  date: string;
  icon: string;
}

interface FarmingClass {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  spots: number;
  spotsTotal: number;
  eOTKReward: number;
  icon: string;
  level: string;
}

/* ── demo data ── */

const SYSTEM_TYPES: SystemType[] = [
  {
    id: 'st1', name: 'Aquaponics', icon: '\u{1F41F}',
    description: 'Fish and plants grow together in a symbiotic cycle. Fish waste feeds plants; plants filter water for fish.',
    howItWorks: 'Fish produce ammonia-rich waste. Bacteria convert it to nitrates. Plants absorb nitrates as fertilizer. Clean water returns to fish.',
    pros: ['No soil needed', 'Fish + vegetables', 'Very water-efficient', 'Organic by design'],
    cons: ['Requires fish care knowledge', 'Power needed for pumps', 'Initial setup cost'],
    bestFor: 'Communities wanting protein + produce in one system',
  },
  {
    id: 'st2', name: 'Hydroponics', icon: '\u{1F4A7}',
    description: 'Plants grow in nutrient-rich water solutions without soil. Roots absorb nutrients directly.',
    howItWorks: 'Nutrient solution is mixed with water and delivered to plant roots via various methods (NFT, DWC, drip). No soil needed.',
    pros: ['Fast growth', 'Space efficient', 'Year-round growing', 'Precise nutrient control'],
    cons: ['Needs nutrient monitoring', 'Power for pumps/lights', 'No fish protein'],
    bestFor: 'Urban growers with limited space',
  },
  {
    id: 'st3', name: 'Vertical Farming', icon: '\u{1F331}',
    description: 'Crops are stacked in vertical layers, maximizing production per square meter.',
    howItWorks: 'Shelving or tower systems hold plants vertically. LED lights and automated irrigation support growth in minimal floor space.',
    pros: ['Maximum space efficiency', 'Indoor growing', 'Climate independent', 'Scalable'],
    cons: ['High energy for lighting', 'Higher initial investment', 'Limited crop variety'],
    bestFor: 'Dense urban environments and apartments',
  },
  {
    id: 'st4', name: 'Aeroponics', icon: '\u{1F32B}\u{FE0F}',
    description: 'Plant roots are suspended in air and misted with nutrient solution.',
    howItWorks: 'Roots hang in a closed chamber. Misters spray nutrient solution at timed intervals. Roots get maximum oxygen.',
    pros: ['Fastest growth rates', 'Uses least water', 'Highest yields', 'No growing medium'],
    cons: ['Most complex setup', 'Requires precise timing', 'Pump failure = crop loss'],
    bestFor: 'Advanced growers seeking maximum efficiency',
  },
];

const DEMO_COMMUNITY_SYSTEMS: CommunitySystem[] = [
  {
    id: 'cs1', name: 'Green Valley Aquaponics', type: 'Aquaponics',
    location: 'Community Center, Block A', crops: ['Lettuce', 'Basil', 'Tilapia', 'Mint'],
    monthlyYieldKg: 120, members: 18, eOTKEarned: 3600, icon: '\u{1F41F}', status: 'active',
  },
  {
    id: 'cs2', name: 'Rooftop Hydro Garden', type: 'Hydroponics',
    location: 'Public Library Rooftop', crops: ['Tomatoes', 'Peppers', 'Strawberries', 'Herbs'],
    monthlyYieldKg: 85, members: 12, eOTKEarned: 2040, icon: '\u{1F345}', status: 'active',
  },
];

const DEMO_BUILD_GUIDES: BuildGuide[] = [
  {
    id: 'bg1', title: 'Mason Jar Herb Garden', systemType: 'Hydroponics',
    difficulty: 'beginner', estimatedCost: '$15-25', timeToComplete: '1 hour',
    steps: ['Gather materials', 'Prepare net cups', 'Mix nutrient solution', 'Plant herb seedlings', 'Place under sunlight', 'Monitor water level weekly'],
    materialsCount: 6, icon: '\u{1F33F}', eOTKReward: 30,
  },
  {
    id: 'bg2', title: 'Bucket Aquaponics System', systemType: 'Aquaponics',
    difficulty: 'intermediate', estimatedCost: '$50-80', timeToComplete: '3-4 hours',
    steps: ['Set up fish bucket', 'Build grow bed from container', 'Install water pump', 'Add grow media', 'Cycle system for 2 weeks', 'Add fish and plants', 'Monitor ammonia levels'],
    materialsCount: 10, icon: '\u{1F41F}', eOTKReward: 60,
  },
  {
    id: 'bg3', title: 'PVC Vertical Tower', systemType: 'Vertical Farming',
    difficulty: 'intermediate', estimatedCost: '$40-60', timeToComplete: '2-3 hours',
    steps: ['Cut PVC pipe to lengths', 'Drill planting holes', 'Assemble tower structure', 'Install drip irrigation', 'Fill with growing medium', 'Plant seedlings', 'Connect to water reservoir'],
    materialsCount: 8, icon: '\u{1F331}', eOTKReward: 50,
  },
];

const DEMO_HARVEST: HarvestEntry[] = [
  { id: 'h1', systemName: 'Green Valley Aquaponics', crop: 'Lettuce', quantityKg: 18.5, date: '2026-03-25', icon: '\u{1F96C}' },
  { id: 'h2', systemName: 'Green Valley Aquaponics', crop: 'Tilapia', quantityKg: 8.2, date: '2026-03-22', icon: '\u{1F41F}' },
  { id: 'h3', systemName: 'Rooftop Hydro Garden', crop: 'Tomatoes', quantityKg: 12.0, date: '2026-03-24', icon: '\u{1F345}' },
  { id: 'h4', systemName: 'Rooftop Hydro Garden', crop: 'Strawberries', quantityKg: 4.3, date: '2026-03-23', icon: '\u{1F353}' },
  { id: 'h5', systemName: 'Green Valley Aquaponics', crop: 'Basil', quantityKg: 3.1, date: '2026-03-20', icon: '\u{1F33F}' },
];

const DEMO_CLASS: FarmingClass = {
  id: 'fc1', title: 'Intro to Aquaponics — Build Your First System',
  instructor: 'Maria Santos', date: '2026-04-12', duration: '3 hours',
  spots: 8, spotsTotal: 15, eOTKReward: 75, icon: '\u{1F393}', level: 'Beginner',
};

const DIFFICULTY_COLORS: Record<string, string> = { beginner: '#4CAF50', intermediate: '#FF9800', advanced: '#F44336' };

type Tab = 'guide' | 'systems' | 'build' | 'harvest';

export function AquaponicsScreen({ onClose }: Props) {
  const t = useTheme();
  const demoMode = useWalletStore((s) => s.demoMode);
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    heroQuote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.muted, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    sublabel: { color: t.text.secondary, fontSize: 12, marginTop: 2 },
    muted: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    eotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    badge: { fontSize: 36, marginRight: 12 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    // System type guide
    systemCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    systemHeader: { flexDirection: 'row', alignItems: 'center' },
    systemIcon: { fontSize: 36, marginRight: 12 },
    systemName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    systemDesc: { color: t.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 20 },
    systemHow: { color: t.text.muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
    prosConsRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
    prosConsCol: { flex: 1 },
    prosConsTitle: { color: t.text.primary, fontSize: 12, fontWeight: fonts.bold, marginBottom: 4 },
    prosItem: { color: t.accent.green, fontSize: 11, lineHeight: 18 },
    consItem: { color: t.accent.orange, fontSize: 11, lineHeight: 18 },
    bestFor: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 8 },
    expandArrow: { color: t.text.muted, fontSize: 16, marginLeft: 'auto' },
    // Community systems
    communityCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    communityName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    communityType: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    communityLocation: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    communityStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
    cropsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    cropChip: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    cropText: { color: t.text.secondary, fontSize: 11 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    // Build guides
    guideCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    guideHeader: { flexDirection: 'row', alignItems: 'center' },
    guideIcon: { fontSize: 32, marginRight: 12 },
    guideInfo: { flex: 1 },
    guideTitle: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    guideType: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold, marginTop: 2 },
    guideMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
    guideMetaText: { color: t.text.muted, fontSize: 11 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
    diffText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    stepItem: { flexDirection: 'row', paddingVertical: 6 },
    stepNum: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.heavy, width: 24 },
    stepText: { color: t.text.secondary, fontSize: 13, flex: 1 },
    // Harvest
    harvestCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    harvestIcon: { fontSize: 28, marginRight: 12 },
    harvestInfo: { flex: 1 },
    harvestCrop: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    harvestSystem: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    harvestQty: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold },
    harvestDate: { color: t.text.muted, fontSize: 10, marginTop: 2, textAlign: 'right' },
    // Class
    classCard: { backgroundColor: t.accent.purple + '10', borderRadius: 20, padding: 20, marginBottom: 16 },
    classTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy, textAlign: 'center', marginTop: 8 },
    classInstructor: { color: t.accent.purple, fontSize: 13, fontWeight: fonts.semibold, textAlign: 'center', marginTop: 4 },
    classDetail: { color: t.text.secondary, fontSize: 12, textAlign: 'center', marginTop: 2 },
    classStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    classStatValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, textAlign: 'center' },
    classStatLabel: { color: t.text.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
    note: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
  }), [t]);

  const totalHarvest = useMemo(() => DEMO_HARVEST.reduce((sum, h) => sum + h.quantityKg, 0), []);

  const renderTabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: 'guide', label: 'Guide' },
      { key: 'systems', label: 'Systems' },
      { key: 'build', label: 'Build' },
      { key: 'harvest', label: 'Harvest' },
    ];
    return (
      <View style={s.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGuide = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>System Types</Text>
      {SYSTEM_TYPES.map((sys) => {
        const expanded = expandedSystem === sys.id;
        return (
          <TouchableOpacity
            key={sys.id}
            style={s.systemCard}
            activeOpacity={0.7}
            onPress={() => setExpandedSystem(expanded ? null : sys.id)}
          >
            <View style={s.systemHeader}>
              <Text style={s.systemIcon}>{sys.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.systemName}>{sys.name}</Text>
                <Text style={s.sublabel}>{sys.description}</Text>
              </View>
              <Text style={s.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</Text>
            </View>
            {expanded && (
              <>
                <Text style={s.systemHow}>{sys.howItWorks}</Text>
                <View style={s.prosConsRow}>
                  <View style={s.prosConsCol}>
                    <Text style={s.prosConsTitle}>Pros</Text>
                    {sys.pros.map((p) => (
                      <Text key={p} style={s.prosItem}>{'\u2022'} {p}</Text>
                    ))}
                  </View>
                  <View style={s.prosConsCol}>
                    <Text style={s.prosConsTitle}>Cons</Text>
                    {sys.cons.map((c) => (
                      <Text key={c} style={s.consItem}>{'\u2022'} {c}</Text>
                    ))}
                  </View>
                </View>
                <Text style={s.bestFor}>Best for: {sys.bestFor}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSystems = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Community Systems</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{DEMO_COMMUNITY_SYSTEMS.length}</Text>
            <Text style={s.statLabel}>Active Systems</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_COMMUNITY_SYSTEMS.reduce((sum, cs) => sum + cs.members, 0)}</Text>
            <Text style={s.statLabel}>Members</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_COMMUNITY_SYSTEMS.reduce((sum, cs) => sum + cs.monthlyYieldKg, 0)} kg</Text>
            <Text style={s.statLabel}>Monthly Yield</Text>
          </View>
        </View>
      </View>
      {DEMO_COMMUNITY_SYSTEMS.map((cs) => (
        <View key={cs.id} style={s.communityCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.badge}>{cs.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.communityName}>{cs.name}</Text>
              <Text style={s.communityType}>{cs.type}</Text>
              <Text style={s.communityLocation}>{cs.location}</Text>
            </View>
          </View>
          <View style={s.communityStats}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{cs.monthlyYieldKg}</Text>
              <Text style={s.statLabel}>kg/month</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{cs.members}</Text>
              <Text style={s.statLabel}>Members</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green, fontSize: 16 }]}>{cs.eOTKEarned}</Text>
              <Text style={s.statLabel}>eOTK</Text>
            </View>
          </View>
          <View style={s.cropsRow}>
            {cs.crops.map((crop) => (
              <View key={crop} style={s.cropChip}>
                <Text style={s.cropText}>{crop}</Text>
              </View>
            ))}
          </View>
          <View style={[s.statusBadge, { backgroundColor: cs.status === 'active' ? t.accent.green + '20' : t.accent.orange + '20' }]}>
            <Text style={[s.statusText, { color: cs.status === 'active' ? t.accent.green : t.accent.orange }]}>{cs.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderBuild = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Build Your Own</Text>
      {DEMO_BUILD_GUIDES.map((guide) => {
        const expanded = expandedGuide === guide.id;
        return (
          <TouchableOpacity
            key={guide.id}
            style={s.guideCard}
            activeOpacity={0.7}
            onPress={() => setExpandedGuide(expanded ? null : guide.id)}
          >
            <View style={s.guideHeader}>
              <Text style={s.guideIcon}>{guide.icon}</Text>
              <View style={s.guideInfo}>
                <Text style={s.guideTitle}>{guide.title}</Text>
                <Text style={s.guideType}>{guide.systemType}</Text>
              </View>
              <Text style={s.eotk}>+{guide.eOTKReward} eOTK</Text>
            </View>
            <View style={s.guideMeta}>
              <View style={[s.diffBadge, { backgroundColor: DIFFICULTY_COLORS[guide.difficulty] }]}>
                <Text style={s.diffText}>{guide.difficulty}</Text>
              </View>
              <Text style={s.guideMetaText}>Cost: {guide.estimatedCost}</Text>
              <Text style={s.guideMetaText}>Time: {guide.timeToComplete}</Text>
              <Text style={s.guideMetaText}>{guide.materialsCount} materials</Text>
            </View>
            {expanded && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.label, { marginBottom: 8 }]}>Steps:</Text>
                {guide.steps.map((step, idx) => (
                  <View key={idx} style={s.stepItem}>
                    <Text style={s.stepNum}>{idx + 1}.</Text>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Class section */}
      <Text style={[s.sectionTitle, { marginTop: 20 }]}>Upcoming Classes</Text>
      <View style={s.classCard}>
        <Text style={{ fontSize: 40, textAlign: 'center' }}>{DEMO_CLASS.icon}</Text>
        <Text style={s.classTitle}>{DEMO_CLASS.title}</Text>
        <Text style={s.classInstructor}>Instructor: {DEMO_CLASS.instructor}</Text>
        <Text style={s.classDetail}>{DEMO_CLASS.date} {'\u2022'} {DEMO_CLASS.duration} {'\u2022'} {DEMO_CLASS.level}</Text>
        <View style={s.classStats}>
          <View>
            <Text style={s.classStatValue}>{DEMO_CLASS.spotsTotal - DEMO_CLASS.spots}/{DEMO_CLASS.spotsTotal}</Text>
            <Text style={s.classStatLabel}>Enrolled</Text>
          </View>
          <View>
            <Text style={s.classStatValue}>{DEMO_CLASS.spots}</Text>
            <Text style={s.classStatLabel}>Spots Left</Text>
          </View>
          <View>
            <Text style={[s.classStatValue, { color: t.accent.green }]}>+{DEMO_CLASS.eOTKReward}</Text>
            <Text style={s.classStatLabel}>eOTK Reward</Text>
          </View>
        </View>
      </View>
      <Text style={s.note}>
        Complete a build guide or attend a class to earn eOTK. Your sustainable farming knowledge strengthens the entire community.
      </Text>
    </View>
  );

  const renderHarvest = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Harvest Log</Text>
      <View style={s.card}>
        <View style={s.statRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalHarvest.toFixed(1)}</Text>
            <Text style={s.statLabel}>kg Total</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.green }]}>{DEMO_HARVEST.length}</Text>
            <Text style={s.statLabel}>Entries</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: t.accent.blue }]}>{DEMO_COMMUNITY_SYSTEMS.length}</Text>
            <Text style={s.statLabel}>Systems</Text>
          </View>
        </View>
      </View>
      {DEMO_HARVEST.map((entry) => (
        <View key={entry.id} style={s.harvestCard}>
          <Text style={s.harvestIcon}>{entry.icon}</Text>
          <View style={s.harvestInfo}>
            <Text style={s.harvestCrop}>{entry.crop}</Text>
            <Text style={s.harvestSystem}>{entry.systemName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.harvestQty}>{entry.quantityKg} kg</Text>
            <Text style={s.harvestDate}>{entry.date}</Text>
          </View>
        </View>
      ))}
      <Text style={s.note}>
        Every harvest is logged on Open Chain — a transparent record of what your community grows. Food sovereignty starts with data.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Sustainable Farming</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <Text style={s.heroIcon}>{'\u{1F331}'}</Text>
          <Text style={s.heroTitle}>Grow Your Own Future</Text>
          <Text style={s.heroQuote}>
            "Food sovereignty begins with knowledge — every community deserves the ability to grow its own nutrition sustainably."
            {'\n'}— Human Constitution, Article I
          </Text>
        </View>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE — Sample Data</Text>
          </View>
        )}

        {renderTabs()}

        {activeTab === 'guide' && renderGuide()}
        {activeTab === 'systems' && renderSystems()}
        {activeTab === 'build' && renderBuild()}
        {activeTab === 'harvest' && renderHarvest()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
