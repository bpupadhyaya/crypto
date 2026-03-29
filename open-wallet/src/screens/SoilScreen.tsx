/**
 * Soil Screen — Soil health science, composting, regenerative agriculture.
 *
 * Article I: "The earth beneath our feet sustains all human life.
 *  Understanding and nurturing soil health is a fundamental
 *  responsibility of every community."
 * — Human Constitution, Article I
 *
 * Features:
 * - Soil testing guide (how to test pH, nutrients, organic matter, microbes)
 * - Community soil map (soil quality data by area, crowd-sourced)
 * - Composting techniques (hot, cold, vermicompost, bokashi)
 * - Cover crop guide (which cover crops for which soil needs)
 * - Soil workshops (learn soil science — earn eOTK)
 * - Regenerative practices (no-till, mulching, crop rotation)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface SoilTest {
  id: string;
  testType: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'moderate' | 'advanced';
  tools: string[];
  idealRange: string;
  steps: string[];
}

interface CompostMethod {
  id: string;
  name: string;
  icon: string;
  timeToFinish: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  bestFor: string;
  materials: string[];
}

interface CoverCrop {
  id: string;
  name: string;
  icon: string;
  season: string;
  soilBenefit: string;
  nitrogenFixer: boolean;
  growthTime: string;
  bestFor: string;
}

interface SoilWorkshop {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  eotkReward: number;
  spotsLeft: number;
  level: string;
  topics: string[];
}

interface RegenerativePractice {
  id: string;
  name: string;
  icon: string;
  description: string;
  benefits: string[];
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_SOIL_TESTS: SoilTest[] = [
  {
    id: 'st1', testType: 'pH Test', description: 'Measure soil acidity/alkalinity',
    icon: 'pH', difficulty: 'easy', tools: ['pH test kit', 'Distilled water', 'Clean container'],
    idealRange: '6.0 - 7.0 for most plants',
    steps: ['Collect soil from 6" depth', 'Mix with distilled water', 'Apply test solution', 'Compare color to chart'],
  },
  {
    id: 'st2', testType: 'Nutrient Test', description: 'Check N-P-K levels and trace minerals',
    icon: 'NPK', difficulty: 'moderate', tools: ['NPK test kit', 'Soil probe', 'Clean jars'],
    idealRange: 'N: 40-80 ppm, P: 25-50 ppm, K: 150-250 ppm',
    steps: ['Collect samples from multiple spots', 'Air-dry the soil', 'Extract with test solution', 'Read results with color chart'],
  },
  {
    id: 'st3', testType: 'Organic Matter', description: 'Measure decomposed plant and animal material',
    icon: 'OM', difficulty: 'easy', tools: ['Oven or sun-drying area', 'Scale', 'Metal container'],
    idealRange: '3% - 6% for healthy soil',
    steps: ['Weigh fresh soil sample', 'Dry completely at 105C', 'Weigh again', 'Calculate loss percentage'],
  },
  {
    id: 'st4', testType: 'Microbe Activity', description: 'Assess biological health of soil ecosystem',
    icon: 'MB', difficulty: 'advanced', tools: ['Cotton underwear (burial test)', 'Ruler', 'Calendar'],
    idealRange: '80%+ decomposition in 60 days',
    steps: ['Bury clean cotton fabric 6" deep', 'Mark the spot clearly', 'Retrieve after 60 days', 'Assess decomposition level'],
  },
];

const DEMO_COMPOST_METHODS: CompostMethod[] = [
  {
    id: 'cm1', name: 'Hot Composting', icon: 'H',
    timeToFinish: '4-8 weeks', difficulty: 'intermediate',
    description: 'Rapid decomposition through maintained high temperatures (130-160F). Kills weed seeds and pathogens.',
    bestFor: 'Large volumes of yard and kitchen waste',
    materials: ['Green materials (nitrogen)', 'Brown materials (carbon)', 'Water', 'Pitchfork for turning'],
  },
  {
    id: 'cm2', name: 'Cold Composting', icon: 'C',
    timeToFinish: '6-12 months', difficulty: 'beginner',
    description: 'Passive pile method. Add materials as available and let nature do the work. Minimal effort required.',
    bestFor: 'Beginners and low-effort composting',
    materials: ['Kitchen scraps', 'Yard waste', 'Leaves', 'Cardboard'],
  },
  {
    id: 'cm3', name: 'Vermicompost', icon: 'V',
    timeToFinish: '3-6 months', difficulty: 'intermediate',
    description: 'Worms (red wigglers) break down food scraps into nutrient-rich castings. Works indoors or outdoors.',
    bestFor: 'Apartments and small spaces, kitchen scraps',
    materials: ['Worm bin', 'Red wiggler worms', 'Bedding (newspaper/cardboard)', 'Food scraps'],
  },
];

const DEMO_COVER_CROPS: CoverCrop[] = [
  {
    id: 'cc1', name: 'Crimson Clover', icon: 'CC',
    season: 'Fall/Winter', soilBenefit: 'Fixes nitrogen, prevents erosion',
    nitrogenFixer: true, growthTime: '60-90 days',
    bestFor: 'Nitrogen-depleted soil, erosion-prone areas',
  },
  {
    id: 'cc2', name: 'Winter Rye', icon: 'WR',
    season: 'Fall/Winter', soilBenefit: 'Deep root structure, breaks compaction',
    nitrogenFixer: false, growthTime: '60-120 days',
    bestFor: 'Compacted soil, weed suppression',
  },
  {
    id: 'cc3', name: 'Buckwheat', icon: 'BW',
    season: 'Spring/Summer', soilBenefit: 'Attracts pollinators, fast biomass',
    nitrogenFixer: false, growthTime: '30-45 days',
    bestFor: 'Quick cover between plantings, pollinator support',
  },
  {
    id: 'cc4', name: 'Hairy Vetch', icon: 'HV',
    season: 'Fall/Winter', soilBenefit: 'Heavy nitrogen fixation, weed suppression',
    nitrogenFixer: true, growthTime: '90-120 days',
    bestFor: 'Heavy nitrogen needs, organic farms',
  },
  {
    id: 'cc5', name: 'Daikon Radish', icon: 'DR',
    season: 'Fall', soilBenefit: 'Deep taproot breaks hardpan, bio-drilling',
    nitrogenFixer: false, growthTime: '45-60 days',
    bestFor: 'Compacted subsoil, improving drainage',
  },
];

const DEMO_WORKSHOPS: SoilWorkshop[] = [
  {
    id: 'w1', title: 'Soil Science Fundamentals', instructor: 'Dr. Elaine Ingham',
    date: '2026-04-05', duration: '3 hours', eotkReward: 450, spotsLeft: 15,
    level: 'Beginner', topics: ['Soil food web', 'Microbe identification', 'Soil structure'],
  },
  {
    id: 'w2', title: 'Advanced Composting Masterclass', instructor: 'Prof. David Johnson',
    date: '2026-04-12', duration: '4 hours', eotkReward: 600, spotsLeft: 8,
    level: 'Intermediate', topics: ['Fungal-dominant compost', 'Compost tea', 'Johnson-Su bioreactor'],
  },
];

const REGEN_PRACTICES: RegenerativePractice[] = [
  {
    id: 'rp1', name: 'No-Till Farming', icon: 'NT',
    description: 'Avoid disturbing soil structure to preserve fungal networks and microorganism habitats.',
    benefits: ['Preserves soil structure', 'Increases water retention', 'Builds carbon in soil', 'Protects mycorrhizal networks'],
  },
  {
    id: 'rp2', name: 'Mulching', icon: 'ML',
    description: 'Cover soil surface with organic materials to retain moisture, suppress weeds, and feed soil life.',
    benefits: ['Moisture retention', 'Temperature regulation', 'Weed suppression', 'Slow nutrient release'],
  },
  {
    id: 'rp3', name: 'Crop Rotation', icon: 'CR',
    description: 'Alternate different crop families across seasons to prevent nutrient depletion and break pest cycles.',
    benefits: ['Balanced nutrient use', 'Pest cycle disruption', 'Disease prevention', 'Improved soil biology'],
  },
];

type Tab = 'test' | 'compost' | 'crops' | 'workshops';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#34C759',
  beginner: '#34C759',
  moderate: '#FF9500',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

// ─── Component ───

export function SoilScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('test');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [expandedCompost, setExpandedCompost] = useState<string | null>(null);
  const demoMode = useWalletStore(s => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.green },
    tabLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabLabelActive: { color: '#fff' },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    iconText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    cardInfo: { flex: 1 },
    cardTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    cardSubtitle: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    cardDesc: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
    difficultyBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
    difficultyText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    stepRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
    stepNumber: { color: t.accent.green, fontSize: 13, fontWeight: '800', width: 20 },
    stepText: { color: t.text.secondary, fontSize: 13, flex: 1, lineHeight: 20 },
    toolPill: { backgroundColor: t.accent.green + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginTop: 6 },
    toolText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    idealRange: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 8 },
    materialPill: { backgroundColor: t.accent.blue + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginTop: 6 },
    materialText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    bestFor: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 6 },
    cropCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cropName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    seasonBadge: { backgroundColor: t.accent.blue + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    seasonText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    nitrogenBadge: { backgroundColor: t.accent.green + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6, alignSelf: 'flex-start' },
    nitrogenText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    cropBenefit: { color: t.text.secondary, fontSize: 13, marginTop: 6 },
    cropGrowth: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    workshopCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    workshopTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    workshopInstructor: { color: t.text.secondary, fontSize: 13, marginTop: 2 },
    workshopMeta: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
    metaPill: { backgroundColor: t.bg.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    metaText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    eotkBadge: { backgroundColor: t.accent.purple + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    eotkText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    topicRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
    topicPill: { backgroundColor: t.accent.green + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    topicText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    regenCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    regenHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    regenName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    regenDesc: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
    benefitPill: { backgroundColor: t.accent.green + '10', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginTop: 6 },
    benefitText: { color: t.accent.green, fontSize: 11, fontWeight: '600' },
    soilMapCard: { backgroundColor: t.accent.green + '08', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 10, alignItems: 'center' },
    soilMapTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700', marginTop: 8 },
    soilMapDesc: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
    soilMapBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24, marginTop: 12 },
    soilMapBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', padding: 40 },
  }), [t]);

  const toggleTest = useCallback((id: string) => {
    setExpandedTest(prev => prev === id ? null : id);
  }, []);

  const toggleCompost = useCallback((id: string) => {
    setExpandedCompost(prev => prev === id ? null : id);
  }, []);

  // ─── Tab: Soil Testing ───

  const renderTest = () => (
    <>
      <Text style={s.section}>Soil Testing Guide</Text>

      <View style={s.soilMapCard}>
        <Text style={{ fontSize: 32 }}>M</Text>
        <Text style={s.soilMapTitle}>Community Soil Map</Text>
        <Text style={s.soilMapDesc}>
          Crowd-sourced soil quality data from your area.{'\n'}
          Contribute your test results to help neighbors.
        </Text>
        <TouchableOpacity style={s.soilMapBtn}>
          <Text style={s.soilMapBtnText}>View Soil Map</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Testing Methods</Text>
      {DEMO_SOIL_TESTS.map(test => (
        <TouchableOpacity
          key={test.id}
          style={s.card}
          onPress={() => toggleTest(test.id)}
          activeOpacity={0.7}
        >
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: DIFFICULTY_COLORS[test.difficulty] || '#8E8E93' }]}>
              <Text style={s.iconText}>{test.icon}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{test.testType}</Text>
              <Text style={s.cardSubtitle}>{test.description}</Text>
              <View style={[s.difficultyBadge, { backgroundColor: (DIFFICULTY_COLORS[test.difficulty] || '#8E8E93') + '15' }]}>
                <Text style={[s.difficultyText, { color: DIFFICULTY_COLORS[test.difficulty] || '#8E8E93' }]}>
                  {test.difficulty}
                </Text>
              </View>
            </View>
          </View>

          {expandedTest === test.id && (
            <View style={s.expandedSection}>
              <Text style={s.idealRange}>Ideal range: {test.idealRange}</Text>

              <Text style={[s.section, { marginLeft: 0, marginTop: 12 }]}>Tools needed</Text>
              <View style={s.pillRow}>
                {test.tools.map(tool => (
                  <View key={tool} style={s.toolPill}>
                    <Text style={s.toolText}>{tool}</Text>
                  </View>
                ))}
              </View>

              <Text style={[s.section, { marginLeft: 0, marginTop: 12 }]}>Steps</Text>
              {test.steps.map((step, i) => (
                <View key={i} style={s.stepRow}>
                  <Text style={s.stepNumber}>{i + 1}.</Text>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </>
  );

  // ─── Tab: Composting ───

  const renderCompost = () => (
    <>
      <Text style={s.section}>Composting Techniques</Text>

      {DEMO_COMPOST_METHODS.map(method => (
        <TouchableOpacity
          key={method.id}
          style={s.card}
          onPress={() => toggleCompost(method.id)}
          activeOpacity={0.7}
        >
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: DIFFICULTY_COLORS[method.difficulty] || '#8E8E93' }]}>
              <Text style={s.iconText}>{method.icon}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{method.name}</Text>
              <Text style={s.cardSubtitle}>Time: {method.timeToFinish}</Text>
              <View style={[s.difficultyBadge, { backgroundColor: (DIFFICULTY_COLORS[method.difficulty] || '#8E8E93') + '15' }]}>
                <Text style={[s.difficultyText, { color: DIFFICULTY_COLORS[method.difficulty] || '#8E8E93' }]}>
                  {method.difficulty}
                </Text>
              </View>
            </View>
          </View>

          {expandedCompost === method.id && (
            <View style={s.expandedSection}>
              <Text style={s.cardDesc}>{method.description}</Text>
              <Text style={s.bestFor}>Best for: {method.bestFor}</Text>

              <Text style={[s.section, { marginLeft: 0, marginTop: 12 }]}>Materials</Text>
              <View style={s.pillRow}>
                {method.materials.map(mat => (
                  <View key={mat} style={s.materialPill}>
                    <Text style={s.materialText}>{mat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Text style={s.section}>Regenerative Practices</Text>
      {REGEN_PRACTICES.map(practice => (
        <View key={practice.id} style={s.regenCard}>
          <View style={s.regenHeader}>
            <View style={[s.iconCircle, { backgroundColor: t.accent.green }]}>
              <Text style={s.iconText}>{practice.icon}</Text>
            </View>
            <Text style={s.regenName}>{practice.name}</Text>
          </View>
          <Text style={s.regenDesc}>{practice.description}</Text>
          <View style={s.pillRow}>
            {practice.benefits.map(b => (
              <View key={b} style={s.benefitPill}>
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Tab: Cover Crops ───

  const renderCrops = () => (
    <>
      <Text style={s.section}>Cover Crop Guide</Text>

      {DEMO_COVER_CROPS.map(crop => (
        <View key={crop.id} style={s.cropCard}>
          <View style={s.cropHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.iconCircle, { backgroundColor: crop.nitrogenFixer ? t.accent.green : t.accent.blue, width: 40, height: 40, borderRadius: 20 }]}>
                <Text style={[s.iconText, { fontSize: 13 }]}>{crop.icon}</Text>
              </View>
              <Text style={s.cropName}>{crop.name}</Text>
            </View>
            <View style={s.seasonBadge}>
              <Text style={s.seasonText}>{crop.season}</Text>
            </View>
          </View>
          <Text style={s.cropBenefit}>{crop.soilBenefit}</Text>
          <Text style={s.cropGrowth}>Growth time: {crop.growthTime}</Text>
          <Text style={s.bestFor}>Best for: {crop.bestFor}</Text>
          {crop.nitrogenFixer && (
            <View style={s.nitrogenBadge}>
              <Text style={s.nitrogenText}>Nitrogen Fixer</Text>
            </View>
          )}
        </View>
      ))}
    </>
  );

  // ─── Tab: Workshops ───

  const renderWorkshops = () => (
    <>
      <Text style={s.section}>Upcoming Soil Workshops</Text>

      {DEMO_WORKSHOPS.map(ws => (
        <View key={ws.id} style={s.workshopCard}>
          <Text style={s.workshopTitle}>{ws.title}</Text>
          <Text style={s.workshopInstructor}>{ws.instructor}</Text>

          <View style={s.workshopMeta}>
            <View style={s.metaPill}>
              <Text style={s.metaText}>{ws.date}</Text>
            </View>
            <View style={s.metaPill}>
              <Text style={s.metaText}>{ws.duration}</Text>
            </View>
            <View style={s.metaPill}>
              <Text style={s.metaText}>{ws.level}</Text>
            </View>
            <View style={s.metaPill}>
              <Text style={s.metaText}>{ws.spotsLeft} spots left</Text>
            </View>
            <View style={s.eotkBadge}>
              <Text style={s.eotkText}>+{ws.eotkReward} eOTK</Text>
            </View>
          </View>

          <View style={s.topicRow}>
            {ws.topics.map(topic => (
              <View key={topic} style={s.topicPill}>
                <Text style={s.topicText}>{topic}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.joinBtn}>
            <Text style={s.joinBtnText}>Join Workshop (Earn eOTK)</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  // ─── Main Render ───

  const TABS: { key: Tab; label: string }[] = [
    { key: 'test', label: 'Soil Test' },
    { key: 'compost', label: 'Compost' },
    { key: 'crops', label: 'Crops' },
    { key: 'workshops', label: 'Workshops' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Soil Health</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>S</Text>
        <Text style={s.heroTitle}>Soil Science & Regenerative Agriculture</Text>
        <Text style={s.heroSubtitle}>
          Healthy soil feeds communities. Learn to test, compost,{'\n'}
          and regenerate the earth beneath your feet.
        </Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabLabel, tab === tb.key && s.tabLabelActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'test' && renderTest()}
        {tab === 'compost' && renderCompost()}
        {tab === 'crops' && renderCrops()}
        {tab === 'workshops' && renderWorkshops()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
