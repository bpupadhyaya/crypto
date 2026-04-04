import { fonts } from '../utils/theme';
/**
 * Habitat Screen — Habitat restoration, ecosystem management, land stewardship.
 *
 * Article I: "The Earth sustains all life. To care for habitats is to care
 *  for every generation that will follow."
 * — Human Constitution, Article I
 *
 * Features:
 * - Habitat projects (wetland restoration, meadow creation, river cleanup, forest regeneration)
 * - Land stewardship pledges (commit to caring for a piece of land)
 * - Ecosystem health metrics (soil, water, air, biodiversity per area)
 * - Native species planting guide (region-specific native plants)
 * - Invasive species alerts (report and manage invasive species)
 * - cOTK earned for verified stewardship activities
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface HabitatProject {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'active' | 'planned' | 'completed';
  volunteers: number;
  cotkEarned: number;
  areaHectares: number;
  startDate: string;
  description: string;
}

interface StewardshipPledge {
  id: string;
  pledgerUID: string;
  landDescription: string;
  areaHectares: number;
  commitmentYears: number;
  activities: string[];
  cotkEarned: number;
  startDate: string;
  verified: boolean;
}

interface EcosystemMetric {
  id: string;
  area: string;
  soilHealth: number;
  waterQuality: number;
  airQuality: number;
  biodiversityIndex: number;
  lastAssessed: string;
  trend: 'improving' | 'stable' | 'declining';
}

interface NativeSpecies {
  id: string;
  name: string;
  scientificName: string;
  region: string;
  type: 'tree' | 'shrub' | 'flower' | 'grass';
  plantingSeason: string;
  difficulty: 'easy' | 'moderate' | 'advanced';
  benefits: string;
}

interface InvasiveAlert {
  id: string;
  species: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedDate: string;
  reportedBy: string;
  status: 'reported' | 'confirmed' | 'managed' | 'resolved';
  description: string;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const PROJECT_TYPES = [
  { key: 'wetland', label: 'Wetland', icon: 'W' },
  { key: 'meadow', label: 'Meadow', icon: 'M' },
  { key: 'river', label: 'River', icon: 'R' },
  { key: 'forest', label: 'Forest', icon: 'F' },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
  critical: '#AF52DE',
};

const TREND_LABELS: Record<string, string> = {
  improving: 'Improving',
  stable: 'Stable',
  declining: 'Declining',
};

const TREND_COLORS: Record<string, string> = {
  improving: '#34C759',
  stable: '#007AFF',
  declining: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_PROJECTS: HabitatProject[] = [
  {
    id: 'p1', name: 'Willow Creek Wetland Restoration', type: 'wetland',
    location: 'Willow Creek Nature Reserve', status: 'active', volunteers: 34,
    cotkEarned: 12400, areaHectares: 18, startDate: '2026-01-15',
    description: 'Restoring 18 hectares of degraded wetland to support migratory birds and native amphibians.',
  },
  {
    id: 'p2', name: 'Sunridge Meadow Creation', type: 'meadow',
    location: 'Sunridge Community Park', status: 'active', volunteers: 22,
    cotkEarned: 8200, areaHectares: 5, startDate: '2026-02-10',
    description: 'Converting unused municipal land into a wildflower meadow with native pollinator habitat.',
  },
  {
    id: 'p3', name: 'Cedar Valley Forest Regeneration', type: 'forest',
    location: 'Cedar Valley State Forest', status: 'planned', volunteers: 0,
    cotkEarned: 0, areaHectares: 45, startDate: '2026-04-15',
    description: 'Replanting native hardwoods in a fire-damaged section of old-growth forest.',
  },
];

const DEMO_PLEDGES: StewardshipPledge[] = [
  {
    id: 'pl1', pledgerUID: 'you', landDescription: 'Backyard native garden and rain garden',
    areaHectares: 0.05, commitmentYears: 5, activities: ['Native planting', 'Composting', 'Rain water collection'],
    cotkEarned: 2400, startDate: '2025-09-01', verified: true,
  },
  {
    id: 'pl2', pledgerUID: 'you', landDescription: 'Community vacant lot stewardship',
    areaHectares: 0.2, commitmentYears: 3, activities: ['Invasive removal', 'Native seeding', 'Soil remediation'],
    cotkEarned: 4800, startDate: '2026-01-10', verified: true,
  },
];

const DEMO_SPECIES: NativeSpecies[] = [
  { id: 's1', name: 'Red Maple', scientificName: 'Acer rubrum', region: 'Eastern North America', type: 'tree', plantingSeason: 'Spring / Fall', difficulty: 'easy', benefits: 'Shade, fall color, wildlife habitat' },
  { id: 's2', name: 'Black-Eyed Susan', scientificName: 'Rudbeckia hirta', region: 'North America', type: 'flower', plantingSeason: 'Spring', difficulty: 'easy', benefits: 'Pollinators, drought tolerant, erosion control' },
  { id: 's3', name: 'Switchgrass', scientificName: 'Panicum virgatum', region: 'Central/Eastern North America', type: 'grass', plantingSeason: 'Spring', difficulty: 'easy', benefits: 'Erosion control, bird cover, soil building' },
  { id: 's4', name: 'Elderberry', scientificName: 'Sambucus canadensis', region: 'Eastern North America', type: 'shrub', plantingSeason: 'Spring / Fall', difficulty: 'moderate', benefits: 'Edible berries, pollinator support, bird habitat' },
  { id: 's5', name: 'Wild Bergamot', scientificName: 'Monarda fistulosa', region: 'North America', type: 'flower', plantingSeason: 'Spring / Fall', difficulty: 'easy', benefits: 'Native bees, butterflies, medicinal' },
  { id: 's6', name: 'White Oak', scientificName: 'Quercus alba', region: 'Eastern North America', type: 'tree', plantingSeason: 'Fall', difficulty: 'moderate', benefits: 'Long-lived canopy tree, acorns for wildlife, carbon sequestration' },
  { id: 's7', name: 'Serviceberry', scientificName: 'Amelanchier canadensis', region: 'Eastern North America', type: 'shrub', plantingSeason: 'Spring / Fall', difficulty: 'moderate', benefits: 'Edible fruit, spring blooms, bird habitat' },
  { id: 's8', name: 'Little Bluestem', scientificName: 'Schizachyrium scoparium', region: 'Central/Eastern North America', type: 'grass', plantingSeason: 'Spring', difficulty: 'easy', benefits: 'Prairie restoration, fall color, bird nesting' },
];

const DEMO_METRICS: EcosystemMetric[] = [
  { id: 'm1', area: 'Willow Creek Wetland', soilHealth: 72, waterQuality: 68, airQuality: 85, biodiversityIndex: 64, lastAssessed: '2026-03-20', trend: 'improving' },
  { id: 'm2', area: 'Sunridge Meadow', soilHealth: 58, waterQuality: 74, airQuality: 88, biodiversityIndex: 42, lastAssessed: '2026-03-18', trend: 'improving' },
  { id: 'm3', area: 'Cedar Valley Forest', soilHealth: 45, waterQuality: 62, airQuality: 79, biodiversityIndex: 38, lastAssessed: '2026-03-15', trend: 'stable' },
];

const DEMO_ALERTS: InvasiveAlert[] = [
  {
    id: 'a1', species: 'Japanese Knotweed', location: 'Willow Creek east bank',
    severity: 'high', reportedDate: '2026-03-22', reportedBy: 'volunteer_sam',
    status: 'confirmed', description: 'Dense stand spreading along the creek bank, threatening native riparian plants.',
  },
];

type Tab = 'projects' | 'stewardship' | 'species' | 'health';

export function HabitatScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('projects');
  const [pledgeLand, setPledgeLand] = useState('');
  const [pledgeArea, setPledgeArea] = useState('');
  const [pledgeYears, setPledgeYears] = useState('');
  const [pledgeActivities, setPledgeActivities] = useState('');
  const [alertSpecies, setAlertSpecies] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
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
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    heroIcon: { fontSize: 40, marginBottom: 8 },
    heroTitle: { color: t.text.primary, fontSize: 17, fontWeight: fonts.heavy, textAlign: 'center' },
    heroSubtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 },
    projectCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    projectName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    projectMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    projectStatus: { fontSize: 12, fontWeight: fonts.bold, marginTop: 6 },
    projectStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.bg.primary },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    joinBtn: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 10, alignSelf: 'flex-start' },
    joinBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    pledgeRow: { borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingVertical: 14 },
    pledgeLand: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    pledgeMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    pledgeCotk: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold, marginTop: 4 },
    pledgeActivitiesList: { color: t.text.secondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.secondary },
    filterChipActive: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    filterText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    filterTextActive: { color: t.accent.green },
    speciesCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 10 },
    speciesName: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    speciesScientific: { color: t.text.muted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
    speciesMeta: { color: t.text.secondary, fontSize: 12, marginTop: 6 },
    speciesBenefits: { color: t.accent.green, fontSize: 12, marginTop: 4 },
    difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    difficultyText: { fontSize: 11, fontWeight: fonts.bold },
    metricCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    metricArea: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    metricDate: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
    metricItem: { width: '45%', backgroundColor: t.bg.primary, borderRadius: 10, padding: 10, alignItems: 'center' },
    metricValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    metricLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    trendBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginTop: 10 },
    trendText: { fontSize: 12, fontWeight: fonts.bold },
    alertCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12, borderLeftWidth: 4 },
    alertSpeciesName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    alertMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    alertDesc: { color: t.text.secondary, fontSize: 13, marginTop: 6, lineHeight: 20 },
    alertStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    alertStatusText: { fontSize: 11, fontWeight: fonts.bold, textTransform: 'uppercase' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const filteredSpecies = useMemo(() => {
    if (speciesFilter === 'all') return DEMO_SPECIES;
    return DEMO_SPECIES.filter((sp) => sp.type === speciesFilter);
  }, [speciesFilter]);

  const handlePledge = useCallback(() => {
    if (!pledgeLand.trim()) { Alert.alert('Required', 'Describe the land you are pledging to steward.'); return; }
    const area = parseFloat(pledgeArea);
    if (!area || area <= 0) { Alert.alert('Required', 'Enter a valid area in hectares.'); return; }
    const years = parseInt(pledgeYears, 10);
    if (!years || years <= 0) { Alert.alert('Required', 'Enter commitment duration in years.'); return; }

    Alert.alert(
      'Pledge Recorded',
      `You pledged to steward ${area} hectares for ${years} years.\n\nYour pledge will be verified and cOTK rewards will begin accruing.`,
    );
    setPledgeLand('');
    setPledgeArea('');
    setPledgeYears('');
    setPledgeActivities('');
  }, [pledgeLand, pledgeArea, pledgeYears]);

  const handleReportInvasive = useCallback(() => {
    if (!alertSpecies.trim()) { Alert.alert('Required', 'Enter the invasive species name.'); return; }
    if (!alertLocation.trim()) { Alert.alert('Required', 'Enter the location.'); return; }

    Alert.alert(
      'Alert Submitted',
      `Invasive species "${alertSpecies}" reported at ${alertLocation}.\n\nCommunity stewards will be notified.`,
    );
    setAlertSpecies('');
    setAlertLocation('');
    setAlertDescription('');
  }, [alertSpecies, alertLocation]);

  const getDifficultyColor = (d: string) => {
    if (d === 'easy') return '#34C759';
    if (d === 'moderate') return '#FF9500';
    return '#FF3B30';
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return t.accent.green;
    if (status === 'planned') return t.accent.blue;
    return t.text.muted;
  };

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'projects', label: 'Projects' },
    { key: 'stewardship', label: 'Stewardship' },
    { key: 'species', label: 'Species' },
    { key: 'health', label: 'Health' },
  ];

  // ─── Projects Tab ───

  const renderProjects = () => (
    <>
      <View style={s.heroCard}>
        <Text style={s.heroIcon}>{'~'}</Text>
        <Text style={s.heroTitle}>Habitat Restoration</Text>
        <Text style={s.heroSubtitle}>
          Join community projects that restore wetlands, create meadows,{'\n'}
          clean rivers, and regenerate forests. Earn cOTK for every{'\n'}
          verified hour of stewardship.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Active & Planned Projects</Text>
      {DEMO_PROJECTS.map((proj) => (
        <View key={proj.id} style={s.projectCard}>
          <Text style={s.projectName}>{proj.name}</Text>
          <Text style={s.projectMeta}>{proj.location} | {proj.areaHectares} hectares</Text>
          <Text style={s.projectMeta}>{proj.description}</Text>
          <Text style={[s.projectStatus, { color: getStatusColor(proj.status) }]}>
            {proj.status.toUpperCase()} since {proj.startDate}
          </Text>
          <View style={s.projectStats}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{proj.volunteers}</Text>
              <Text style={s.statLabel}>Volunteers</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{proj.cotkEarned.toLocaleString()}</Text>
              <Text style={s.statLabel}>cOTK Earned</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{proj.areaHectares}</Text>
              <Text style={s.statLabel}>Hectares</Text>
            </View>
          </View>
          {proj.status !== 'completed' && (
            <TouchableOpacity
              style={s.joinBtn}
              onPress={() => Alert.alert('Joined', `You joined "${proj.name}". Welcome aboard!`)}
            >
              <Text style={s.joinBtnText}>{proj.status === 'planned' ? 'Pre-Register' : 'Join Project'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </>
  );

  // ─── Stewardship Tab ───

  const renderStewardship = () => (
    <>
      <Text style={s.sectionTitle}>Your Stewardship Pledges</Text>
      <View style={s.card}>
        {DEMO_PLEDGES.map((pledge) => (
          <View key={pledge.id} style={s.pledgeRow}>
            <Text style={s.pledgeLand}>{pledge.landDescription}</Text>
            <Text style={s.pledgeMeta}>
              {pledge.areaHectares} hectares | {pledge.commitmentYears} year commitment | Since {pledge.startDate}
            </Text>
            <Text style={s.pledgeActivitiesList}>
              Activities: {pledge.activities.join(', ')}
            </Text>
            <Text style={s.pledgeCotk}>
              +{pledge.cotkEarned.toLocaleString()} cOTK earned {pledge.verified ? '(Verified)' : '(Pending)'}
            </Text>
          </View>
        ))}
      </View>

      <Text style={s.sectionTitle}>New Stewardship Pledge</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Describe the land (e.g., backyard, community lot)"
          placeholderTextColor={t.text.muted}
          value={pledgeLand}
          onChangeText={setPledgeLand}
        />
        <TextInput
          style={s.input}
          placeholder="Area in hectares"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={pledgeArea}
          onChangeText={setPledgeArea}
        />
        <TextInput
          style={s.input}
          placeholder="Commitment duration (years)"
          placeholderTextColor={t.text.muted}
          keyboardType="numeric"
          value={pledgeYears}
          onChangeText={setPledgeYears}
        />
        <TextInput
          style={s.input}
          placeholder="Planned activities (comma separated)"
          placeholderTextColor={t.text.muted}
          value={pledgeActivities}
          onChangeText={setPledgeActivities}
          multiline
        />
        <TouchableOpacity style={s.submitBtn} onPress={handlePledge}>
          <Text style={s.submitText}>Submit Pledge</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Species Tab ───

  const speciesTypes = [
    { key: 'all', label: 'All' },
    { key: 'tree', label: 'Trees' },
    { key: 'shrub', label: 'Shrubs' },
    { key: 'flower', label: 'Flowers' },
    { key: 'grass', label: 'Grasses' },
  ];

  const renderSpecies = () => (
    <>
      <Text style={s.sectionTitle}>Native Species Planting Guide</Text>

      <View style={s.filterRow}>
        {speciesTypes.map((ft) => (
          <TouchableOpacity
            key={ft.key}
            style={[s.filterChip, speciesFilter === ft.key && s.filterChipActive]}
            onPress={() => setSpeciesFilter(ft.key)}
          >
            <Text style={[s.filterText, speciesFilter === ft.key && s.filterTextActive]}>{ft.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredSpecies.map((sp) => (
        <View key={sp.id} style={s.speciesCard}>
          <Text style={s.speciesName}>{sp.name}</Text>
          <Text style={s.speciesScientific}>{sp.scientificName}</Text>
          <Text style={s.speciesMeta}>
            Region: {sp.region} | Season: {sp.plantingSeason} | Type: {sp.type}
          </Text>
          <Text style={s.speciesBenefits}>Benefits: {sp.benefits}</Text>
          <View style={[s.difficultyBadge, { backgroundColor: getDifficultyColor(sp.difficulty) + '20' }]}>
            <Text style={[s.difficultyText, { color: getDifficultyColor(sp.difficulty) }]}>
              {sp.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Invasive Species Alerts</Text>
      {DEMO_ALERTS.map((alert) => (
        <View key={alert.id} style={[s.alertCard, { borderLeftColor: SEVERITY_COLORS[alert.severity] || t.text.muted }]}>
          <Text style={s.alertSpeciesName}>{alert.species}</Text>
          <Text style={s.alertMeta}>
            {alert.location} | Reported {alert.reportedDate} | Severity: {alert.severity.toUpperCase()}
          </Text>
          <Text style={s.alertDesc}>{alert.description}</Text>
          <View style={[s.alertStatusBadge, { backgroundColor: (SEVERITY_COLORS[alert.severity] || t.text.muted) + '20' }]}>
            <Text style={[s.alertStatusText, { color: SEVERITY_COLORS[alert.severity] || t.text.muted }]}>
              {alert.status}
            </Text>
          </View>
        </View>
      ))}

      <Text style={[s.sectionTitle, { marginTop: 8 }]}>Report Invasive Species</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Species name"
          placeholderTextColor={t.text.muted}
          value={alertSpecies}
          onChangeText={setAlertSpecies}
        />
        <TextInput
          style={s.input}
          placeholder="Location"
          placeholderTextColor={t.text.muted}
          value={alertLocation}
          onChangeText={setAlertLocation}
        />
        <TextInput
          style={s.input}
          placeholder="Description (optional)"
          placeholderTextColor={t.text.muted}
          value={alertDescription}
          onChangeText={setAlertDescription}
          multiline
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleReportInvasive}>
          <Text style={s.submitText}>Submit Alert</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Health Tab ───

  const renderHealth = () => (
    <>
      <Text style={s.sectionTitle}>Ecosystem Health Metrics</Text>
      {DEMO_METRICS.map((metric) => (
        <View key={metric.id} style={s.metricCard}>
          <Text style={s.metricArea}>{metric.area}</Text>
          <Text style={s.metricDate}>Last assessed: {metric.lastAssessed}</Text>
          <View style={s.metricGrid}>
            <View style={s.metricItem}>
              <Text style={s.metricValue}>{metric.soilHealth}</Text>
              <Text style={s.metricLabel}>Soil Health</Text>
            </View>
            <View style={s.metricItem}>
              <Text style={s.metricValue}>{metric.waterQuality}</Text>
              <Text style={s.metricLabel}>Water Quality</Text>
            </View>
            <View style={s.metricItem}>
              <Text style={s.metricValue}>{metric.airQuality}</Text>
              <Text style={s.metricLabel}>Air Quality</Text>
            </View>
            <View style={s.metricItem}>
              <Text style={s.metricValue}>{metric.biodiversityIndex}</Text>
              <Text style={s.metricLabel}>Biodiversity</Text>
            </View>
          </View>
          <View style={[s.trendBadge, { backgroundColor: (TREND_COLORS[metric.trend] || t.text.muted) + '20' }]}>
            <Text style={[s.trendText, { color: TREND_COLORS[metric.trend] || t.text.muted }]}>
              {TREND_LABELS[metric.trend] || metric.trend}
            </Text>
          </View>
        </View>
      ))}

      <View style={[s.heroCard, { marginTop: 4 }]}>
        <Text style={s.heroTitle}>How Metrics Work</Text>
        <Text style={s.heroSubtitle}>
          Each metric is scored 0-100 based on community assessments{'\n'}
          and verified sensor data. Scores improve as stewardship{'\n'}
          activities restore ecosystem function. Higher biodiversity{'\n'}
          means a healthier, more resilient habitat.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Habitat</Text>
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
        {tab === 'projects' && renderProjects()}
        {tab === 'stewardship' && renderStewardship()}
        {tab === 'species' && renderSpecies()}
        {tab === 'health' && renderHealth()}
      </ScrollView>
    </SafeAreaView>
  );
}
