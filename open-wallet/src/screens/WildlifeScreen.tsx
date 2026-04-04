import { fonts } from '../utils/theme';
/**
 * Wildlife Screen — Wildlife conservation, nature observation, biodiversity tracking.
 *
 * Article I: "Humanity's stewardship of the natural world is a sacred trust —
 *  every species observed, every habitat protected, strengthens the web of life."
 * — Human Constitution
 *
 * Features:
 * - Wildlife sightings log (species, location, date, photo hash, notes)
 * - Regional biodiversity score (species count, endangered species, habitat health)
 * - Conservation projects (habitat restoration, wildlife corridors, species protection)
 * - Nature observation events (bird watching, nature walks, citizen science)
 * - Endangered species alerts
 * - cOTK earned for verified wildlife observations
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

interface WildlifeSighting {
  id: string;
  species: string;
  scientificName: string;
  category: string;
  location: string;
  coordinates: string;
  date: string;
  photoHash: string;
  notes: string;
  verified: boolean;
  cotkEarned: number;
  observerUID: string;
  endangered: boolean;
}

interface BiodiversityScore {
  region: string;
  totalSpecies: number;
  endangeredSpecies: number;
  habitatHealthPct: number;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

interface ConservationProject {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  volunteers: number;
  cotkFunded: number;
  progress: number;
  startDate: string;
  status: string;
}

interface NatureEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  spotsLeft: number;
  cotkReward: number;
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const SPECIES_CATEGORIES = [
  { key: 'bird', label: 'Birds', icon: 'B' },
  { key: 'mammal', label: 'Mammals', icon: 'M' },
  { key: 'reptile', label: 'Reptiles', icon: 'R' },
  { key: 'amphibian', label: 'Amphibians', icon: 'A' },
  { key: 'insect', label: 'Insects', icon: 'I' },
  { key: 'plant', label: 'Plants', icon: 'P' },
  { key: 'marine', label: 'Marine', icon: 'W' },
];

const THREAT_COLORS: Record<string, string> = {
  endangered: '#FF3B30',
  vulnerable: '#FF9500',
  safe: '#34C759',
};

// ─── Demo Data ───

const DEMO_SIGHTINGS: WildlifeSighting[] = [
  { id: 's1', species: 'Red-tailed Hawk', scientificName: 'Buteo jamaicensis', category: 'bird', location: 'Oak Ridge Trail', coordinates: '37.7749,-122.4194', date: '2026-03-28', photoHash: 'sha256:a1b2c3d4...', notes: 'Spotted soaring above the ridge at dawn. Wingspan approx 120cm. Carrying prey.', verified: true, cotkEarned: 150, observerUID: 'you', endangered: false },
  { id: 's2', species: 'Monarch Butterfly', scientificName: 'Danaus plexippus', category: 'insect', location: 'Riverside Milkweed Patch', coordinates: '37.7850,-122.4100', date: '2026-03-27', photoHash: 'sha256:e5f6g7h8...', notes: 'Small cluster of 12 monarchs on milkweed. Early migration group. Tagged two for tracking.', verified: true, cotkEarned: 200, observerUID: 'you', endangered: true },
  { id: 's3', species: 'Western Pond Turtle', scientificName: 'Actinemys marmorata', category: 'reptile', location: 'Willow Creek Pond', coordinates: '37.7700,-122.4300', date: '2026-03-25', photoHash: 'sha256:i9j0k1l2...', notes: 'Three juveniles basking on log. Habitat appears healthy. Water quality good.', verified: true, cotkEarned: 250, observerUID: 'you', endangered: true },
  { id: 's4', species: 'Coyote', scientificName: 'Canis latrans', category: 'mammal', location: 'North Meadow', coordinates: '37.7900,-122.4050', date: '2026-03-24', photoHash: 'sha256:m3n4o5p6...', notes: 'Adult pair with two pups at dawn. Healthy coat, normal behavior. Den nearby.', verified: false, cotkEarned: 0, observerUID: 'you', endangered: false },
  { id: 's5', species: 'California Newt', scientificName: 'Taricha torosa', category: 'amphibian', location: 'Fern Creek Crossing', coordinates: '37.7680,-122.4250', date: '2026-03-22', photoHash: 'sha256:q7r8s9t0...', notes: 'Breeding migration observed. Counted 8 adults crossing the trail toward the pond.', verified: true, cotkEarned: 180, observerUID: 'you', endangered: false },
];

const DEMO_BIODIVERSITY: BiodiversityScore = {
  region: 'Bay Area Watershed',
  totalSpecies: 342,
  endangeredSpecies: 28,
  habitatHealthPct: 68,
  overallScore: 71,
  trend: 'improving',
  lastUpdated: '2026-03-28',
};

const DEMO_PROJECTS: ConservationProject[] = [
  { id: 'p1', title: 'Willow Creek Habitat Restoration', category: 'habitat_restoration', description: 'Restoring native riparian vegetation along 2.5 miles of Willow Creek to support endangered pond turtles and spawning salmon.', location: 'Willow Creek Watershed', volunteers: 34, cotkFunded: 45000, progress: 62, startDate: '2025-09-15', status: 'active' },
  { id: 'p2', title: 'Urban Wildlife Corridor — East-West', category: 'wildlife_corridor', description: 'Creating safe passage for wildlife between regional parks through native plantings, underpasses, and reduced lighting zones.', location: 'Central Metro Area', volunteers: 18, cotkFunded: 28000, progress: 35, startDate: '2026-01-10', status: 'active' },
];

const DEMO_EVENTS: NatureEvent[] = [
  { id: 'e1', title: 'Spring Bird Count', type: 'citizen_science', date: '2026-04-05', location: 'Regional Park Network', spotsLeft: 25, cotkReward: 300, description: 'Annual citizen science bird count. Teams of 3-4 survey designated zones. All skill levels welcome.' },
  { id: 'e2', title: 'Twilight Nature Walk — Amphibian Migration', type: 'nature_walk', date: '2026-04-02', location: 'Fern Creek Trail', spotsLeft: 12, cotkReward: 150, description: 'Guided evening walk to observe California Newt breeding migration. Bring headlamps and rain gear.' },
];

type Tab = 'sightings' | 'biodiversity' | 'conservation' | 'events';

export function WildlifeScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('sightings');
  const [logSpecies, setLogSpecies] = useState('');
  const [logCategory, setLogCategory] = useState('');
  const [logLocation, setLogLocation] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const sightings = DEMO_SIGHTINGS;
  const biodiversity = DEMO_BIODIVERSITY;
  const projects = DEMO_PROJECTS;
  const events = DEMO_EVENTS;

  const totalCotk = useMemo(() =>
    sightings.reduce((sum, s) => sum + s.cotkEarned, 0),
    [sightings],
  );

  const handleLogSighting = useCallback(() => {
    if (!logSpecies.trim()) { Alert.alert('Required', 'Enter the species name.'); return; }
    if (!logCategory) { Alert.alert('Required', 'Select a species category.'); return; }
    if (!logLocation.trim()) { Alert.alert('Required', 'Enter the observation location.'); return; }

    Alert.alert(
      'Sighting Logged',
      `${logSpecies} observed at ${logLocation}.\n\nAwaiting verification for cOTK reward.`,
    );
    setLogSpecies('');
    setLogCategory('');
    setLogLocation('');
    setLogNotes('');
  }, [logSpecies, logCategory, logLocation]);

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
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, marginHorizontal: 20, marginTop: 8, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 8 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    sightingCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sightingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    sightingSpecies: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    endangeredBadge: { backgroundColor: '#FF3B30' + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    endangeredText: { color: '#FF3B30', fontSize: fonts.xs, fontWeight: fonts.bold },
    sightingSciName: { color: t.text.muted, fontSize: fonts.sm, fontStyle: 'italic', marginTop: 2 },
    sightingMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    sightingNotes: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 20 },
    sightingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    sightingHash: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'monospace' },
    sightingCotk: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    verifiedTag: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    pendingTag: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    bioScoreCard: { backgroundColor: t.accent.green + '08', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    bioScoreNum: { color: t.accent.green, fontSize: 64, fontWeight: fonts.heavy },
    bioScoreLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    bioRegion: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginTop: 8 },
    bioTrend: { fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    bioDetailRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%' },
    bioDetailItem: { alignItems: 'center' },
    bioDetailValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    bioDetailLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    alertCard: { backgroundColor: '#FF3B30' + '10', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    alertTitle: { color: '#FF3B30', fontSize: fonts.md, fontWeight: fonts.bold },
    alertText: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4, lineHeight: 20 },
    projectCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    projectTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    projectCategory: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    projectDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 20 },
    projectMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8 },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: t.bg.primary, marginTop: 10 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.green },
    projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    projectCotk: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventType: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
    eventMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6 },
    eventDesc: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8, lineHeight: 20 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    eventCotk: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    typeChipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    typeChipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    typeChipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'sightings', label: 'Sightings' },
    { key: 'biodiversity', label: 'Biodiversity' },
    { key: 'conservation', label: 'Conservation' },
    { key: 'events', label: 'Events' },
  ];

  // ─── Sightings Tab ───

  const renderSightings = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>W</Text>
        <Text style={s.heroTitle}>Wildlife Observations</Text>
        <Text style={s.heroSubtitle}>
          Log species sightings, earn cOTK for verified observations, and contribute to citizen science.
        </Text>
      </View>

      <View style={s.statRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sightings.length}</Text>
          <Text style={s.statLabel}>Sightings</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{sightings.filter(sg => sg.verified).length}</Text>
          <Text style={s.statLabel}>Verified</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>{totalCotk}</Text>
          <Text style={s.statLabel}>cOTK Earned</Text>
        </View>
      </View>

      {/* Log new sighting */}
      <Text style={s.sectionTitle}>Log Sighting</Text>
      <View style={s.card}>
        <TextInput style={s.input} placeholder="Species name" placeholderTextColor={t.text.muted} value={logSpecies} onChangeText={setLogSpecies} />

        <View style={s.typeGrid}>
          {SPECIES_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.typeChip, logCategory === cat.key && s.typeChipSelected]}
              onPress={() => setLogCategory(cat.key)}
            >
              <Text style={[s.typeChipText, logCategory === cat.key && s.typeChipTextSelected]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} placeholder="Location" placeholderTextColor={t.text.muted} value={logLocation} onChangeText={setLogLocation} />
        <TextInput style={s.input} placeholder="Notes (behavior, count, conditions)" placeholderTextColor={t.text.muted} value={logNotes} onChangeText={setLogNotes} multiline />

        <TouchableOpacity style={s.submitBtn} onPress={handleLogSighting}>
          <Text style={s.submitText}>Log Sighting</Text>
        </TouchableOpacity>
      </View>

      {/* Recent sightings */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Recent Sightings</Text>

      {sightings.map((sg) => (
        <View key={sg.id} style={s.sightingCard}>
          <View style={s.sightingHeader}>
            <Text style={s.sightingSpecies}>{sg.species}</Text>
            {sg.endangered && (
              <View style={s.endangeredBadge}>
                <Text style={s.endangeredText}>ENDANGERED</Text>
              </View>
            )}
          </View>
          <Text style={s.sightingSciName}>{sg.scientificName}</Text>
          <Text style={s.sightingMeta}>{sg.date}  |  {sg.location}  |  {SPECIES_CATEGORIES.find(c => c.key === sg.category)?.label}</Text>
          <Text style={s.sightingNotes}>{sg.notes}</Text>
          <View style={s.sightingFooter}>
            <Text style={s.sightingHash}>{sg.photoHash}</Text>
            {sg.verified ? (
              <Text style={s.verifiedTag}>Verified  +{sg.cotkEarned} cOTK</Text>
            ) : (
              <Text style={s.pendingTag}>Pending verification</Text>
            )}
          </View>
        </View>
      ))}
    </>
  );

  // ─── Biodiversity Tab ───

  const trendColor = biodiversity.trend === 'improving' ? t.accent.green : biodiversity.trend === 'stable' ? t.accent.orange : '#FF3B30';

  const renderBiodiversity = () => (
    <>
      <View style={s.bioScoreCard}>
        <Text style={s.bioScoreNum}>{biodiversity.overallScore}</Text>
        <Text style={s.bioScoreLabel}>Biodiversity Score</Text>
        <Text style={s.bioRegion}>{biodiversity.region}</Text>
        <Text style={[s.bioTrend, { color: trendColor }]}>
          {biodiversity.trend === 'improving' ? 'Trend: Improving' : biodiversity.trend === 'stable' ? 'Trend: Stable' : 'Trend: Declining'}
        </Text>

        <View style={s.bioDetailRow}>
          <View style={s.bioDetailItem}>
            <Text style={s.bioDetailValue}>{biodiversity.totalSpecies}</Text>
            <Text style={s.bioDetailLabel}>Species</Text>
          </View>
          <View style={s.bioDetailItem}>
            <Text style={[s.bioDetailValue, { color: '#FF3B30' }]}>{biodiversity.endangeredSpecies}</Text>
            <Text style={s.bioDetailLabel}>Endangered</Text>
          </View>
          <View style={s.bioDetailItem}>
            <Text style={s.bioDetailValue}>{biodiversity.habitatHealthPct}%</Text>
            <Text style={s.bioDetailLabel}>Habitat Health</Text>
          </View>
        </View>
      </View>

      {/* Endangered species alert */}
      <View style={s.alertCard}>
        <Text style={s.alertTitle}>Endangered Species Alert</Text>
        <Text style={s.alertText}>
          {biodiversity.endangeredSpecies} endangered species detected in {biodiversity.region}. Recent sightings of Monarch Butterfly and Western Pond Turtle require continued habitat monitoring. Report all sightings to earn bonus cOTK.
        </Text>
      </View>

      <Text style={s.sectionTitle}>How the Score is Calculated</Text>
      <View style={s.card}>
        <Text style={[s.heroSubtitle, { textAlign: 'left' }]}>
          The biodiversity score combines species count (40%), habitat health (35%), and endangered species recovery trends (25%). Community observations directly improve data accuracy. Every verified sighting contributes to the regional assessment.
        </Text>
      </View>
    </>
  );

  // ─── Conservation Tab ───

  const renderConservation = () => (
    <>
      <Text style={s.sectionTitle}>Active Conservation Projects</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Habitat restoration, wildlife corridors, and species protection — funded by community cOTK.
      </Text>

      {projects.map((p) => (
        <View key={p.id} style={s.projectCard}>
          <Text style={s.projectTitle}>{p.title}</Text>
          <Text style={s.projectCategory}>{p.category.replace(/_/g, ' ')}</Text>
          <Text style={s.projectDesc}>{p.description}</Text>
          <Text style={s.projectMeta}>{p.location}  |  Started {p.startDate}  |  {p.volunteers} volunteers</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${p.progress}%` }]} />
          </View>
          <View style={s.projectFooter}>
            <Text style={s.projectCotk}>{p.cotkFunded.toLocaleString()} cOTK funded  |  {p.progress}% complete</Text>
            <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Joined', `You joined "${p.title}". Check Events tab for volunteer days.`)}>
              <Text style={s.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Events Tab ───

  const renderEvents = () => (
    <>
      <Text style={s.sectionTitle}>Nature Observation Events</Text>
      <Text style={[s.heroSubtitle, { marginHorizontal: 20, marginBottom: 16 }]}>
        Bird watching, nature walks, citizen science — observe, learn, and earn cOTK.
      </Text>

      {events.map((ev) => (
        <View key={ev.id} style={s.eventCard}>
          <Text style={s.eventTitle}>{ev.title}</Text>
          <Text style={s.eventType}>{ev.type.replace(/_/g, ' ')}</Text>
          <Text style={s.eventMeta}>{ev.date}  |  {ev.location}  |  {ev.spotsLeft} spots left</Text>
          <Text style={s.eventDesc}>{ev.description}</Text>
          <View style={s.eventFooter}>
            <Text style={s.eventCotk}>+{ev.cotkReward} cOTK reward</Text>
            <TouchableOpacity style={s.joinBtn} onPress={() => Alert.alert('Signed Up', `You registered for "${ev.title}".`)}>
              <Text style={s.joinBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Wildlife</Text>
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
        {tab === 'sightings' && renderSightings()}
        {tab === 'biodiversity' && renderBiodiversity()}
        {tab === 'conservation' && renderConservation()}
        {tab === 'events' && renderEvents()}
      </ScrollView>
    </SafeAreaView>
  );
}
