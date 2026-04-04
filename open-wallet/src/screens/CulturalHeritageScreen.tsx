import { fonts } from '../utils/theme';
/**
 * Cultural Heritage Screen — Preserve cultural traditions, oral histories, indigenous knowledge.
 *
 * Article I: "Every cultural tradition carries irreplaceable human wisdom."
 * nOTK rewards knowledge keepers who share and preserve heritage.
 *
 * Features:
 * - Heritage registry — catalogue of cultural practices, recipes, stories, songs, crafts by region
 * - Oral history recording — submit hash of recorded stories (audio/video stored off-chain)
 * - Knowledge keepers — elders who maintain traditions, earn nOTK for sharing
 * - Endangered practices alert — traditions at risk of being lost (few practitioners)
 * - Cultural exchange — share heritage between regions
 * - Apprenticeship connections — young people learning traditional skills from elders
 * - Heritage preservation fund (OTK allocated to protect traditions)
 * - Demo: 4 heritage items across 3 regions, 2 knowledge keepers
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface HeritageItem {
  id: string;
  title: string;
  category: 'practice' | 'recipe' | 'story' | 'song' | 'craft';
  region: string;
  description: string;
  keeperUID: string;
  keeperName: string;
  practitioners: number;
  endangered: boolean;
  oralHistoryHash: string | null;
  nOTKAllocated: number;
  dateAdded: string;
}

interface KnowledgeKeeper {
  uid: string;
  name: string;
  region: string;
  traditions: number;
  apprentices: number;
  nOTKEarned: number;
  yearsActive: number;
  specialties: string[];
}

interface Apprenticeship {
  id: string;
  tradition: string;
  keeperName: string;
  keeperUID: string;
  region: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  spotsOpen: number;
  durationMonths: number;
  nOTKStipend: number;
}

interface CulturalExchange {
  id: string;
  fromRegion: string;
  toRegion: string;
  tradition: string;
  participants: number;
  status: 'proposed' | 'active' | 'completed';
  nOTKFunded: number;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const CATEGORIES = [
  { key: 'practice', label: 'Practice', icon: 'P' },
  { key: 'recipe', label: 'Recipe', icon: 'R' },
  { key: 'story', label: 'Story', icon: 'S' },
  { key: 'song', label: 'Song', icon: '~' },
  { key: 'craft', label: 'Craft', icon: 'C' },
] as const;

const RISK_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  endangered: '#FF9500',
  vulnerable: '#FFCC00',
  stable: '#34C759',
};

// ─── Demo Data ───

const DEMO_KEEPERS: KnowledgeKeeper[] = [
  {
    uid: 'openchain1abc...keeper_amara',
    name: 'Amara Okafor',
    region: 'West Africa',
    traditions: 12,
    apprentices: 5,
    nOTKEarned: 24600,
    yearsActive: 38,
    specialties: ['Adire textile dyeing', 'Yoruba oral poetry', 'Herbal medicine'],
  },
  {
    uid: 'openchain1def...keeper_hana',
    name: 'Hana Takahashi',
    region: 'East Asia',
    traditions: 8,
    apprentices: 3,
    nOTKEarned: 18200,
    yearsActive: 45,
    specialties: ['Washi papermaking', 'Tea ceremony', 'Haiku composition'],
  },
];

const DEMO_HERITAGE: HeritageItem[] = [
  {
    id: 'h1',
    title: 'Adire Textile Dyeing',
    category: 'craft',
    region: 'West Africa',
    description: 'Traditional indigo resist-dyeing technique using cassava paste patterns on cloth. Practiced by Yoruba women for centuries.',
    keeperUID: 'openchain1abc...keeper_amara',
    keeperName: 'Amara Okafor',
    practitioners: 23,
    endangered: true,
    oralHistoryHash: 'sha256:a1b2c3d4e5f6...',
    nOTKAllocated: 8500,
    dateAdded: '2026-02-14',
  },
  {
    id: 'h2',
    title: 'Washi Papermaking',
    category: 'craft',
    region: 'East Asia',
    description: 'Hand-crafted Japanese paper made from kozo, mitsumata, and gampi fibers using traditional nagashizuki technique.',
    keeperUID: 'openchain1def...keeper_hana',
    keeperName: 'Hana Takahashi',
    practitioners: 156,
    endangered: false,
    oralHistoryHash: 'sha256:f7e8d9c0b1a2...',
    nOTKAllocated: 4200,
    dateAdded: '2026-01-20',
  },
  {
    id: 'h3',
    title: 'Quechua Star Lore',
    category: 'story',
    region: 'South America',
    description: 'Andean astronomical knowledge passed through oral tradition — constellations, planting calendars, and cosmological narratives.',
    keeperUID: 'openchain1ghi...keeper_inti',
    keeperName: 'Inti Quispe',
    practitioners: 7,
    endangered: true,
    oralHistoryHash: null,
    nOTKAllocated: 12000,
    dateAdded: '2026-03-05',
  },
  {
    id: 'h4',
    title: 'Gamelan Composition',
    category: 'song',
    region: 'Southeast Asia',
    description: 'Traditional Javanese ensemble music using bronze percussion, bamboo flutes, and vocal chanting in pentatonic scales.',
    keeperUID: 'openchain1jkl...keeper_wayan',
    keeperName: 'Wayan Sudarta',
    practitioners: 342,
    endangered: false,
    oralHistoryHash: 'sha256:c3d4e5f6a7b8...',
    nOTKAllocated: 3100,
    dateAdded: '2026-02-28',
  },
];

const DEMO_APPRENTICESHIPS: Apprenticeship[] = [
  { id: 'a1', tradition: 'Adire Textile Dyeing', keeperName: 'Amara Okafor', keeperUID: 'openchain1abc...keeper_amara', region: 'West Africa', skillLevel: 'beginner', spotsOpen: 3, durationMonths: 6, nOTKStipend: 500 },
  { id: 'a2', tradition: 'Washi Papermaking', keeperName: 'Hana Takahashi', keeperUID: 'openchain1def...keeper_hana', region: 'East Asia', skillLevel: 'intermediate', spotsOpen: 1, durationMonths: 12, nOTKStipend: 800 },
  { id: 'a3', tradition: 'Quechua Star Lore', keeperName: 'Inti Quispe', keeperUID: 'openchain1ghi...keeper_inti', region: 'South America', skillLevel: 'beginner', spotsOpen: 5, durationMonths: 3, nOTKStipend: 400 },
];

const DEMO_EXCHANGES: CulturalExchange[] = [
  { id: 'e1', fromRegion: 'West Africa', toRegion: 'East Asia', tradition: 'Textile dyeing techniques', participants: 8, status: 'active', nOTKFunded: 6000 },
  { id: 'e2', fromRegion: 'South America', toRegion: 'Southeast Asia', tradition: 'Agricultural star calendars', participants: 12, status: 'proposed', nOTKFunded: 3500 },
];

const PRESERVATION_FUND = {
  totalOTK: 145000,
  allocated: 27800,
  projects: 4,
  regions: 3,
};

type Tab = 'registry' | 'keepers' | 'endangered' | 'apprentice';

export function CulturalHeritageScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('registry');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitRegion, setSubmitRegion] = useState('');
  const [submitCategory, setSubmitCategory] = useState('');
  const [oralHistoryHash, setOralHistoryHash] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const regions = useMemo(() =>
    [...new Set(DEMO_HERITAGE.map((h) => h.region))].sort(),
    [],
  );

  const filteredHeritage = useMemo(() => {
    let items = DEMO_HERITAGE;
    if (selectedRegion) items = items.filter((h) => h.region === selectedRegion);
    if (selectedCategory) items = items.filter((h) => h.category === selectedCategory);
    return items;
  }, [selectedRegion, selectedCategory]);

  const endangeredItems = useMemo(() =>
    DEMO_HERITAGE.filter((h) => h.endangered).sort((a, b) => a.practitioners - b.practitioners),
    [],
  );

  const handleSubmitHeritage = useCallback(() => {
    if (!submitTitle.trim()) { Alert.alert('Required', 'Enter a tradition name.'); return; }
    if (!submitDescription.trim()) { Alert.alert('Required', 'Describe the tradition.'); return; }
    if (!submitRegion.trim()) { Alert.alert('Required', 'Specify the region.'); return; }
    if (!submitCategory) { Alert.alert('Required', 'Select a category.'); return; }

    Alert.alert(
      'Heritage Submitted',
      `"${submitTitle}" has been submitted to the registry.\n\n` +
      (oralHistoryHash ? `Oral history hash recorded: ${oralHistoryHash.slice(0, 20)}...\n` : 'Consider recording an oral history to preserve this tradition.\n') +
      '\nA knowledge keeper will review and verify.',
    );
    setSubmitTitle('');
    setSubmitDescription('');
    setSubmitRegion('');
    setSubmitCategory('');
    setOralHistoryHash('');
  }, [submitTitle, submitDescription, submitRegion, submitCategory, oralHistoryHash]);

  const handleApply = useCallback((apprenticeship: Apprenticeship) => {
    Alert.alert(
      'Apply for Apprenticeship',
      `Learn "${apprenticeship.tradition}" from ${apprenticeship.keeperName} in ${apprenticeship.region}.\n\n` +
      `Duration: ${apprenticeship.durationMonths} months\n` +
      `Stipend: ${apprenticeship.nOTKStipend} nOTK/month\n\n` +
      'Your application will be reviewed by the knowledge keeper.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => Alert.alert('Applied', 'Your apprenticeship application has been submitted.') },
      ],
    );
  }, []);

  const handleProposeExchange = useCallback(() => {
    Alert.alert(
      'Propose Cultural Exchange',
      'Cultural exchanges connect traditions across regions, funded by the Heritage Preservation Fund.\n\nThis feature allows communities to share knowledge while preserving authenticity.',
      [{ text: 'OK' }],
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
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.orange + '20', borderColor: t.accent.orange },
    filterChipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    filterChipTextActive: { color: t.accent.orange },
    heritageCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    heritageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    heritageTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
    categoryText: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase' },
    heritageDesc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
    heritageMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaText: { color: t.text.muted, fontSize: 11 },
    hashText: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold },
    endangeredBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    endangeredText: { color: '#FF3B30', fontSize: 10, fontWeight: fonts.bold },
    keeperCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    keeperName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    keeperRegion: { color: t.accent.orange, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    keeperStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14, paddingTop: 14, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    specialtyChip: { backgroundColor: t.accent.orange + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    specialtyText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.semibold },
    alertCard: { borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    alertTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    alertPractitioners: { fontSize: 28, fontWeight: fonts.heavy, marginTop: 6 },
    alertLabel: { color: t.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    alertRegion: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    alertFund: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    fundText: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold },
    apprenticeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    apprenticeTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    apprenticeMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    apprenticeDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    detailItem: { alignItems: 'center' },
    detailValue: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    detailLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    applyBtn: { backgroundColor: t.accent.orange, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    applyText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    exchangeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    exchangeRoute: { color: t.accent.orange, fontSize: 13, fontWeight: fonts.bold },
    exchangeTradition: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginTop: 4 },
    exchangeMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    fundCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    fundTotal: { color: t.accent.green, fontSize: 36, fontWeight: fonts.heavy },
    fundTotalLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    fundStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.orange + '20', borderColor: t.accent.orange },
    typeChipText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.orange },
    submitBtn: { backgroundColor: t.accent.orange, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    proposeBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    proposeText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    noHashText: { color: t.text.muted, fontSize: 11, fontStyle: 'italic' },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'registry', label: 'Registry' },
    { key: 'keepers', label: 'Keepers' },
    { key: 'endangered', label: 'Endangered' },
    { key: 'apprentice', label: 'Apprentice' },
  ];

  // ─── Category color helper ───

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'practice': return t.accent.blue;
      case 'recipe': return t.accent.green;
      case 'story': return t.accent.purple;
      case 'song': return '#FF9500';
      case 'craft': return t.accent.orange;
      default: return t.text.muted;
    }
  };

  // ─── Registry Tab ───

  const renderRegistry = () => (
    <>
      {/* Region filters */}
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !selectedRegion && s.filterChipActive]}
          onPress={() => setSelectedRegion(null)}
        >
          <Text style={[s.filterChipText, !selectedRegion && s.filterChipTextActive]}>All Regions</Text>
        </TouchableOpacity>
        {regions.map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.filterChip, selectedRegion === r && s.filterChipActive]}
            onPress={() => setSelectedRegion(selectedRegion === r ? null : r)}
          >
            <Text style={[s.filterChipText, selectedRegion === r && s.filterChipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filters */}
      <View style={s.filterRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[s.filterChip, selectedCategory === c.key && s.filterChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === c.key ? null : c.key)}
          >
            <Text style={[s.filterChipText, selectedCategory === c.key && s.filterChipTextActive]}>
              {c.icon} {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Heritage Items ({filteredHeritage.length})</Text>

      {filteredHeritage.map((item) => (
        <View key={item.id} style={s.heritageCard}>
          <View style={s.heritageHeader}>
            <Text style={s.heritageTitle}>{item.title}</Text>
            <View style={[s.categoryBadge, { backgroundColor: categoryColor(item.category) + '20' }]}>
              <Text style={[s.categoryText, { color: categoryColor(item.category) }]}>{item.category}</Text>
            </View>
          </View>
          <Text style={s.heritageDesc}>{item.description}</Text>
          <View style={s.heritageMeta}>
            <Text style={s.metaText}>{item.region} | {item.practitioners} practitioners</Text>
            {item.endangered && (
              <View style={s.endangeredBadge}>
                <Text style={s.endangeredText}>ENDANGERED</Text>
              </View>
            )}
          </View>
          <View style={[s.heritageMeta, { marginTop: 8 }]}>
            <Text style={s.metaText}>Keeper: {item.keeperName}</Text>
            {item.oralHistoryHash ? (
              <Text style={s.hashText}>Oral history recorded</Text>
            ) : (
              <Text style={s.noHashText}>No oral history yet</Text>
            )}
          </View>
          <View style={[s.heritageMeta, { marginTop: 6 }]}>
            <Text style={s.fundText}>{item.nOTKAllocated.toLocaleString()} nOTK allocated</Text>
            <Text style={s.metaText}>Added {item.dateAdded}</Text>
          </View>
        </View>
      ))}

      {/* Submit new heritage item */}
      <Text style={s.sectionTitle}>Submit a Tradition</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Tradition name"
          placeholderTextColor={t.text.muted}
          value={submitTitle}
          onChangeText={setSubmitTitle}
        />
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Describe the tradition, its history, and significance"
          placeholderTextColor={t.text.muted}
          value={submitDescription}
          onChangeText={setSubmitDescription}
          multiline
        />
        <TextInput
          style={s.input}
          placeholder="Region (e.g., West Africa, East Asia)"
          placeholderTextColor={t.text.muted}
          value={submitRegion}
          onChangeText={setSubmitRegion}
        />
        <View style={s.typeGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.typeChip, submitCategory === c.key && s.typeChipSelected]}
              onPress={() => setSubmitCategory(c.key)}
            >
              <Text style={[s.typeChipText, submitCategory === c.key && s.typeChipTextSelected]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.input}
          placeholder="Oral history hash (optional, e.g., sha256:...)"
          placeholderTextColor={t.text.muted}
          value={oralHistoryHash}
          onChangeText={setOralHistoryHash}
        />
        <Text style={[s.metaText, { marginBottom: 12, marginHorizontal: 4 }]}>
          Audio/video stored off-chain. Submit the content hash to link your recorded oral history.
        </Text>
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmitHeritage}>
          <Text style={s.submitText}>Submit to Registry</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Keepers Tab ───

  const renderKeepers = () => (
    <>
      <Text style={s.sectionTitle}>Knowledge Keepers</Text>
      <Text style={[s.metaText, { marginHorizontal: 20, marginBottom: 16 }]}>
        Elders and practitioners who maintain cultural traditions. They earn nOTK for sharing knowledge and mentoring apprentices.
      </Text>

      {DEMO_KEEPERS.map((keeper) => (
        <View key={keeper.uid} style={s.keeperCard}>
          <Text style={s.keeperName}>{keeper.name}</Text>
          <Text style={s.keeperRegion}>{keeper.region} | {keeper.yearsActive} years active</Text>

          <View style={s.keeperStats}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{keeper.traditions}</Text>
              <Text style={s.statLabel}>Traditions</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{keeper.apprentices}</Text>
              <Text style={s.statLabel}>Apprentices</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{keeper.nOTKEarned.toLocaleString()}</Text>
              <Text style={s.statLabel}>nOTK Earned</Text>
            </View>
          </View>

          <View style={s.specialtiesRow}>
            {keeper.specialties.map((sp) => (
              <View key={sp} style={s.specialtyChip}>
                <Text style={s.specialtyText}>{sp}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Preservation Fund */}
      <Text style={s.sectionTitle}>Heritage Preservation Fund</Text>
      <View style={s.fundCard}>
        <Text style={s.fundTotal}>{PRESERVATION_FUND.totalOTK.toLocaleString()}</Text>
        <Text style={s.fundTotalLabel}>Total OTK in Fund</Text>
        <View style={s.fundStats}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{PRESERVATION_FUND.allocated.toLocaleString()}</Text>
            <Text style={s.statLabel}>Allocated</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{PRESERVATION_FUND.projects}</Text>
            <Text style={s.statLabel}>Projects</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{PRESERVATION_FUND.regions}</Text>
            <Text style={s.statLabel}>Regions</Text>
          </View>
        </View>
      </View>

      {/* Cultural exchanges */}
      <Text style={s.sectionTitle}>Cultural Exchanges</Text>
      {DEMO_EXCHANGES.map((ex) => {
        const statusColor = ex.status === 'active' ? t.accent.green
          : ex.status === 'completed' ? t.accent.blue : t.accent.orange;
        return (
          <View key={ex.id} style={s.exchangeCard}>
            <Text style={s.exchangeRoute}>{ex.fromRegion} &rarr; {ex.toRegion}</Text>
            <Text style={s.exchangeTradition}>{ex.tradition}</Text>
            <Text style={s.exchangeMeta}>
              {ex.participants} participants | {ex.nOTKFunded.toLocaleString()} nOTK funded
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[s.statusText, { color: statusColor }]}>{ex.status}</Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={s.proposeBtn} onPress={handleProposeExchange}>
        <Text style={s.proposeText}>Propose Cultural Exchange</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Endangered Tab ───

  const renderEndangered = () => (
    <>
      <Text style={s.sectionTitle}>Endangered Practices</Text>
      <Text style={[s.metaText, { marginHorizontal: 20, marginBottom: 16 }]}>
        Traditions at risk of being lost. Fewer practitioners means higher urgency for preservation and funding.
      </Text>

      {endangeredItems.map((item) => {
        const riskLevel = item.practitioners <= 10 ? 'critical'
          : item.practitioners <= 25 ? 'endangered'
          : item.practitioners <= 100 ? 'vulnerable' : 'stable';
        const riskColor = RISK_COLORS[riskLevel];
        return (
          <View key={item.id} style={[s.alertCard, { backgroundColor: riskColor + '12' }]}>
            <Text style={s.alertTitle}>{item.title}</Text>
            <Text style={[s.alertPractitioners, { color: riskColor }]}>{item.practitioners}</Text>
            <Text style={s.alertLabel}>known practitioners</Text>
            <Text style={s.alertRegion}>{item.region} | Keeper: {item.keeperName}</Text>
            <View style={s.alertFund}>
              <Text style={s.fundText}>{item.nOTKAllocated.toLocaleString()} nOTK preservation fund</Text>
              <View style={[s.endangeredBadge, { backgroundColor: riskColor + '20' }]}>
                <Text style={[s.endangeredText, { color: riskColor }]}>{riskLevel.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[s.heritageDesc, { marginTop: 10, marginBottom: 0 }]}>{item.description}</Text>
          </View>
        );
      })}

      {endangeredItems.length === 0 && (
        <View style={s.card}>
          <Text style={[s.metaText, { textAlign: 'center' }]}>No endangered practices flagged yet.</Text>
        </View>
      )}

      {/* All items risk overview */}
      <Text style={s.sectionTitle}>Risk Overview</Text>
      <View style={s.card}>
        {DEMO_HERITAGE.map((item) => {
          const riskLevel = item.practitioners <= 10 ? 'critical'
            : item.practitioners <= 25 ? 'endangered'
            : item.practitioners <= 100 ? 'vulnerable' : 'stable';
          const riskColor = RISK_COLORS[riskLevel];
          return (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomColor: t.bg.primary, borderBottomWidth: 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold }}>{item.title}</Text>
                <Text style={{ color: t.text.muted, fontSize: 11 }}>{item.practitioners} practitioners</Text>
              </View>
              <View style={[s.endangeredBadge, { backgroundColor: riskColor + '20' }]}>
                <Text style={[s.endangeredText, { color: riskColor }]}>{riskLevel.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  // ─── Apprentice Tab ───

  const renderApprentice = () => (
    <>
      <Text style={s.sectionTitle}>Apprenticeship Opportunities</Text>
      <Text style={[s.metaText, { marginHorizontal: 20, marginBottom: 16 }]}>
        Learn traditional skills directly from knowledge keepers. Apprentices receive nOTK stipends while preserving heritage.
      </Text>

      {DEMO_APPRENTICESHIPS.map((app) => (
        <View key={app.id} style={s.apprenticeCard}>
          <Text style={s.apprenticeTitle}>{app.tradition}</Text>
          <Text style={s.apprenticeMeta}>
            with {app.keeperName} | {app.region}
          </Text>
          <View style={s.apprenticeDetails}>
            <View style={s.detailItem}>
              <Text style={s.detailValue}>{app.durationMonths}mo</Text>
              <Text style={s.detailLabel}>Duration</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={[s.detailValue, { textTransform: 'capitalize' }]}>{app.skillLevel}</Text>
              <Text style={s.detailLabel}>Level</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailValue}>{app.spotsOpen}</Text>
              <Text style={s.detailLabel}>Spots Open</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={[s.detailValue, { color: t.accent.green }]}>{app.nOTKStipend}</Text>
              <Text style={s.detailLabel}>nOTK/mo</Text>
            </View>
          </View>
          <TouchableOpacity style={s.applyBtn} onPress={() => handleApply(app)}>
            <Text style={s.applyText}>Apply for Apprenticeship</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Cultural exchange section */}
      <Text style={s.sectionTitle}>Cross-Regional Exchanges</Text>
      <Text style={[s.metaText, { marginHorizontal: 20, marginBottom: 16 }]}>
        Share heritage between regions. Exchanges are funded by the Heritage Preservation Fund.
      </Text>

      {DEMO_EXCHANGES.map((ex) => {
        const statusColor = ex.status === 'active' ? t.accent.green
          : ex.status === 'completed' ? t.accent.blue : t.accent.orange;
        return (
          <View key={ex.id} style={s.exchangeCard}>
            <Text style={s.exchangeRoute}>{ex.fromRegion} &rarr; {ex.toRegion}</Text>
            <Text style={s.exchangeTradition}>{ex.tradition}</Text>
            <Text style={s.exchangeMeta}>
              {ex.participants} participants | {ex.nOTKFunded.toLocaleString()} nOTK funded
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[s.statusText, { color: statusColor }]}>{ex.status}</Text>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'registry': return renderRegistry();
      case 'keepers': return renderKeepers();
      case 'endangered': return renderEndangered();
      case 'apprentice': return renderApprentice();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Cultural Heritage</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO DATA</Text>
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

      <ScrollView contentContainerStyle={s.scroll}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
