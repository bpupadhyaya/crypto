import { fonts } from '../utils/theme';
/**
 * Inter-Regional Cooperation Screen — The Human Constitution, Article VI.
 *
 * "No region prospers alone. Inter-regional cooperation — the sharing of
 *  education, health, culture, and resources — is the bridge between
 *  isolated communities and a unified humanity."
 * — Human Constitution, Article VI, Section 2
 *
 * Features:
 * - Active partnerships between regions with OTK flows
 * - Cooperation proposal submission
 * - Partnership milestones and impact metrics
 * - Cultural exchange programs and resource sharing
 * - Demo data with inter-regional partnerships
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type CooperationTab = 'partnerships' | 'propose' | 'impact';

type PartnershipType = 'education' | 'health' | 'economic' | 'cultural';

interface CulturalExchange {
  name: string;
  type: 'language' | 'artisan' | 'music' | 'cuisine';
  participants: number;
  otkAllocated: number;
}

interface ResourceShare {
  resource: string;
  type: 'food' | 'medical' | 'educational';
  fromRegion: string;
  toRegion: string;
  quantity: string;
  otkValue: number;
}

interface Milestone {
  date: string;
  description: string;
  otkReleased: number;
}

interface Partnership {
  id: string;
  regionA: string;
  regionB: string;
  type: PartnershipType;
  title: string;
  description: string;
  otkExchanged: number;
  beneficiaries: number;
  startDate: string;
  durationMonths: number;
  status: 'active' | 'proposed' | 'completed';
  milestones: Milestone[];
  culturalExchanges: CulturalExchange[];
  resourceSharing: ResourceShare[];
}

const TYPE_META: Record<PartnershipType, { label: string; icon: string; color: string }> = {
  education: { label: 'Education', icon: '\u{1F4DA}', color: '#3b82f6' },
  health:    { label: 'Health',    icon: '\u{1FA7A}', color: '#22c55e' },
  economic:  { label: 'Economic',  icon: '\u{1F4B0}', color: '#f7931a' },
  cultural:  { label: 'Cultural',  icon: '\u{1F3AD}', color: '#8b5cf6' },
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  proposed: '#eab308',
  completed: '#3b82f6',
};

const DEMO_PARTNERSHIPS: Partnership[] = [
  {
    id: 'p1',
    regionA: 'South Asia',
    regionB: 'East Africa',
    type: 'education',
    title: 'Education Exchange',
    description: 'South Asian universities partner with East African schools to share STEM curricula, teacher training, and digital learning materials.',
    otkExchanged: 2_400_000,
    beneficiaries: 85_000,
    startDate: '2026-01-15',
    durationMonths: 24,
    status: 'active',
    milestones: [
      { date: '2026-01-15', description: 'Partnership signed, initial OTK allocation', otkReleased: 600_000 },
      { date: '2026-03-01', description: '12 teacher exchanges completed', otkReleased: 400_000 },
      { date: '2026-03-20', description: '5,000 students enrolled in shared digital courses', otkReleased: 500_000 },
    ],
    culturalExchanges: [
      { name: 'Swahili-Hindi Language Bridge', type: 'language', participants: 3_200, otkAllocated: 120_000 },
      { name: 'East African Textile + South Asian Weaving', type: 'artisan', participants: 450, otkAllocated: 85_000 },
    ],
    resourceSharing: [
      { resource: 'Digital Textbooks', type: 'educational', fromRegion: 'South Asia', toRegion: 'East Africa', quantity: '15,000 copies', otkValue: 180_000 },
      { resource: 'Solar-Powered Tablets', type: 'educational', fromRegion: 'South Asia', toRegion: 'East Africa', quantity: '2,000 units', otkValue: 320_000 },
    ],
  },
  {
    id: 'p2',
    regionA: 'Northern Europe',
    regionB: 'Sahel Region',
    type: 'health',
    title: 'Healthcare Capacity Building',
    description: 'Northern European medical institutions support Sahel Region with telemedicine infrastructure, medical supplies, and training for community health workers.',
    otkExchanged: 3_100_000,
    beneficiaries: 120_000,
    startDate: '2025-11-01',
    durationMonths: 36,
    status: 'active',
    milestones: [
      { date: '2025-11-01', description: 'Memorandum of cooperation signed', otkReleased: 800_000 },
      { date: '2026-01-10', description: 'Telemedicine hubs established in 8 villages', otkReleased: 600_000 },
      { date: '2026-02-28', description: '200 community health workers trained', otkReleased: 450_000 },
      { date: '2026-03-15', description: 'Infant mortality reduced 12% in target areas', otkReleased: 700_000 },
    ],
    culturalExchanges: [
      { name: 'Traditional Medicine Knowledge Exchange', type: 'artisan', participants: 180, otkAllocated: 60_000 },
    ],
    resourceSharing: [
      { resource: 'Medical Supplies Kit', type: 'medical', fromRegion: 'Northern Europe', toRegion: 'Sahel Region', quantity: '5,000 kits', otkValue: 500_000 },
      { resource: 'Vaccine Cold Storage Units', type: 'medical', fromRegion: 'Northern Europe', toRegion: 'Sahel Region', quantity: '25 units', otkValue: 275_000 },
    ],
  },
  {
    id: 'p3',
    regionA: 'Southeast Asia',
    regionB: 'Central America',
    type: 'economic',
    title: 'Microfinance & Agriculture Exchange',
    description: 'Southeast Asian microfinance cooperatives share best practices with Central American farming communities, enabling sustainable agriculture and fair trade.',
    otkExchanged: 1_800_000,
    beneficiaries: 42_000,
    startDate: '2026-02-01',
    durationMonths: 18,
    status: 'active',
    milestones: [
      { date: '2026-02-01', description: 'Pilot program launched in 3 communities', otkReleased: 400_000 },
      { date: '2026-03-10', description: '500 micro-loans issued through cooperative model', otkReleased: 350_000 },
    ],
    culturalExchanges: [
      { name: 'Tropical Farming Techniques Workshop', type: 'artisan', participants: 600, otkAllocated: 45_000 },
      { name: 'Traditional Cuisine Exchange Festival', type: 'cuisine', participants: 2_000, otkAllocated: 30_000 },
      { name: 'Tagalog-Spanish Language Circle', type: 'language', participants: 800, otkAllocated: 25_000 },
    ],
    resourceSharing: [
      { resource: 'Rice Seed Varieties', type: 'food', fromRegion: 'Southeast Asia', toRegion: 'Central America', quantity: '10 tons', otkValue: 95_000 },
      { resource: 'Organic Farming Guides', type: 'educational', fromRegion: 'Central America', toRegion: 'Southeast Asia', quantity: '3,000 copies', otkValue: 40_000 },
    ],
  },
  {
    id: 'p4',
    regionA: 'East Africa',
    regionB: 'Appalachia',
    type: 'cultural',
    title: 'Music & Storytelling Bridge',
    description: 'A cultural cooperation bridging East African and Appalachian traditions through shared music heritage, storytelling, and craft apprenticeships.',
    otkExchanged: 650_000,
    beneficiaries: 15_000,
    startDate: '2026-03-01',
    durationMonths: 12,
    status: 'active',
    milestones: [
      { date: '2026-03-01', description: 'Virtual concert series launched', otkReleased: 150_000 },
      { date: '2026-03-20', description: '8 artisan apprenticeships established', otkReleased: 100_000 },
    ],
    culturalExchanges: [
      { name: 'Banjo Roots: African + Appalachian Music', type: 'music', participants: 5_000, otkAllocated: 120_000 },
      { name: 'Basket Weaving Apprenticeship', type: 'artisan', participants: 120, otkAllocated: 35_000 },
      { name: 'Oral Storytelling Archive', type: 'artisan', participants: 800, otkAllocated: 50_000 },
    ],
    resourceSharing: [
      { resource: 'Musical Instruments', type: 'educational', fromRegion: 'East Africa', toRegion: 'Appalachia', quantity: '200 instruments', otkValue: 45_000 },
    ],
  },
];

function formatOTK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const EXCHANGE_TYPE_ICONS: Record<string, string> = {
  language: '\u{1F4AC}',
  artisan: '\u{1F9F6}',
  music: '\u{1F3B5}',
  cuisine: '\u{1F372}',
};

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  food: '\u{1F33E}',
  medical: '\u{1F489}',
  educational: '\u{1F4D6}',
};

export function InterRegionalScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<CooperationTab>('partnerships');
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);

  // Proposal form state
  const [propRegionA, setPropRegionA] = useState('');
  const [propRegionB, setPropRegionB] = useState('');
  const [propType, setPropType] = useState<PartnershipType>('education');
  const [propTitle, setPropTitle] = useState('');
  const [propDescription, setPropDescription] = useState('');

  const partnerships = demoMode ? DEMO_PARTNERSHIPS : [];

  // Aggregate impact metrics
  const totalOTK = useMemo(() => partnerships.reduce((s, p) => s + p.otkExchanged, 0), [partnerships]);
  const totalBeneficiaries = useMemo(() => partnerships.reduce((s, p) => s + p.beneficiaries, 0), [partnerships]);
  const totalExchanges = useMemo(() => partnerships.reduce((s, p) => s + p.culturalExchanges.length, 0), [partnerships]);
  const totalResources = useMemo(() => partnerships.reduce((s, p) => s + p.resourceSharing.length, 0), [partnerships]);
  const totalMilestones = useMemo(() => partnerships.reduce((s, p) => s + p.milestones.length, 0), [partnerships]);
  const milestonesCompleted = totalMilestones; // all demo milestones are completed
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    partnerships.forEach(p => { set.add(p.regionA); set.add(p.regionB); });
    return set.size;
  }, [partnerships]);

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
    tabText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    connectionLine: { color: t.accent.purple, fontSize: 14, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 6 },
    regionPair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
    regionChip: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    regionChipText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.bold },
    connector: { color: t.accent.purple, fontSize: 18, fontWeight: fonts.heavy },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 8 },
    typeBadgeText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    bigNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    desc: { color: t.text.muted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
    milestoneCard: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: t.accent.green },
    milestoneDate: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    milestoneText: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 2 },
    milestoneOTK: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    exchangeCard: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, marginBottom: 8 },
    exchangeTitle: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginBottom: 2 },
    exchangeMeta: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    resourceCard: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: t.accent.purple },
    resourceName: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold, marginBottom: 2 },
    resourceFlow: { color: t.accent.blue, fontSize: 11, fontWeight: fonts.semibold, marginBottom: 2 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 },
    textArea: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    typeChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', flexDirection: 'row', gap: 6 },
    typeChipActive: { backgroundColor: t.accent.purple },
    typeLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    typeLabelActive: { color: '#fff' },
    submitBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16 },
    submitBtnText: { color: '#fff', fontSize: 17, fontWeight: fonts.bold },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    impactCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
    impactRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    impactChip: { backgroundColor: t.bg.primary, borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 90 },
    impactNum: { fontSize: 18, fontWeight: fonts.heavy, marginBottom: 2 },
    impactLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 10 },
    barContainer: { height: 6, backgroundColor: t.border, borderRadius: 3, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
  }), [t]);

  const handleSubmitProposal = useCallback(() => {
    if (!propRegionA.trim() || !propRegionB.trim()) {
      Alert.alert('Regions Required', 'Enter both regions for the cooperation proposal.');
      return;
    }
    if (!propTitle.trim()) {
      Alert.alert('Title Required', 'Give your cooperation proposal a title.');
      return;
    }
    if (!propDescription.trim()) {
      Alert.alert('Description Required', 'Describe the purpose and goals of this cooperation.');
      return;
    }

    Alert.alert(
      'Proposal Submitted',
      `Your inter-regional cooperation proposal "${propTitle}" between ${propRegionA} and ${propRegionB} has been submitted for governance review.\n\nType: ${TYPE_META[propType].label}\n\nCommunity delegates from both regions will vote on this proposal.`,
      [{ text: 'OK' }]
    );
    setPropRegionA('');
    setPropRegionB('');
    setPropTitle('');
    setPropDescription('');
    setPropType('education');
  }, [propRegionA, propRegionB, propTitle, propDescription, propType]);

  // --- Partnership Detail View ---
  if (selectedPartnership) {
    const p = selectedPartnership;
    const meta = TYPE_META[p.type];
    const elapsed = Math.min(
      Math.round((Date.now() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)),
      p.durationMonths
    );
    const progressPct = Math.min((elapsed / p.durationMonths) * 100, 100);

    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Partnership</Text>
          <TouchableOpacity onPress={() => setSelectedPartnership(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          {/* Connection Header */}
          <View style={st.regionPair}>
            <View style={st.regionChip}><Text style={st.regionChipText}>{p.regionA}</Text></View>
            <Text style={st.connector}>{'\u2194'}</Text>
            <View style={st.regionChip}><Text style={st.regionChipText}>{p.regionB}</Text></View>
          </View>
          <View style={[st.typeBadge, { backgroundColor: meta.color }]}>
            <Text style={st.typeBadgeText}>{meta.icon} {meta.label}</Text>
          </View>
          <Text style={[st.cardTitle, { textAlign: 'center', fontSize: 18, marginBottom: 8 }]}>{p.title}</Text>
          <Text style={st.desc}>{p.description}</Text>

          {/* Key Metrics */}
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{formatOTK(p.otkExchanged)}</Text>
              <Text style={st.summaryLabel}>OTK Exchanged</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{p.beneficiaries.toLocaleString()}</Text>
              <Text style={st.summaryLabel}>Beneficiaries</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.purple }]}>{elapsed}/{p.durationMonths}</Text>
              <Text style={st.summaryLabel}>Months</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={st.card}>
            <View style={st.row}>
              <Text style={st.label}>Partnership Progress</Text>
              <Text style={st.val}>{progressPct.toFixed(0)}%</Text>
            </View>
            <View style={st.barContainer}>
              <View style={[st.barFill, { width: `${progressPct}%`, backgroundColor: meta.color }]} />
            </View>
            <View style={st.row}>
              <Text style={st.label}>Started</Text>
              <Text style={st.val}>{p.startDate}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Status</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[p.status], marginBottom: 0 }]}>
                <Text style={st.statusText}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Text>
              </View>
            </View>
          </View>

          {/* Milestones */}
          <Text style={st.section}>Milestones ({p.milestones.length})</Text>
          {p.milestones.map((m, i) => (
            <View key={i} style={st.milestoneCard}>
              <Text style={st.milestoneDate}>{m.date}</Text>
              <Text style={st.milestoneText}>{m.description}</Text>
              <Text style={st.milestoneOTK}>+{formatOTK(m.otkReleased)} OTK released</Text>
            </View>
          ))}

          {/* Cultural Exchanges */}
          {p.culturalExchanges.length > 0 && (
            <>
              <Text style={st.section}>Cultural Exchanges ({p.culturalExchanges.length})</Text>
              {p.culturalExchanges.map((ex, i) => (
                <View key={i} style={st.exchangeCard}>
                  <Text style={st.exchangeTitle}>{EXCHANGE_TYPE_ICONS[ex.type] || '\u{1F310}'} {ex.name}</Text>
                  <Text style={st.exchangeMeta}>{ex.participants.toLocaleString()} participants</Text>
                  <Text style={st.exchangeMeta}>{formatOTK(ex.otkAllocated)} OTK allocated</Text>
                </View>
              ))}
            </>
          )}

          {/* Resource Sharing */}
          {p.resourceSharing.length > 0 && (
            <>
              <Text style={st.section}>Resource Sharing ({p.resourceSharing.length})</Text>
              {p.resourceSharing.map((rs, i) => (
                <View key={i} style={st.resourceCard}>
                  <Text style={st.resourceName}>{RESOURCE_TYPE_ICONS[rs.type] || '\u{1F4E6}'} {rs.resource}</Text>
                  <Text style={st.resourceFlow}>{rs.fromRegion} {'\u2192'} {rs.toRegion}</Text>
                  <View style={st.row}>
                    <Text style={st.label}>Quantity: {rs.quantity}</Text>
                    <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.bold }}>{formatOTK(rs.otkValue)} OTK</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Main Dashboard ---
  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Inter-Regional</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Cooperation between regions builds the bridges of humanity. Track partnerships, propose new ones, and measure their impact across communities.
        </Text>

        {/* Global Summary */}
        {demoMode && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{formatOTK(totalOTK)}</Text>
              <Text style={st.summaryLabel}>OTK Exchanged</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>{totalBeneficiaries.toLocaleString()}</Text>
              <Text style={st.summaryLabel}>Beneficiaries</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.purple }]}>{uniqueRegions}</Text>
              <Text style={st.summaryLabel}>Regions</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={st.tabRow}>
          {(['partnerships', 'propose', 'impact'] as CooperationTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === 'partnerships' ? `Partnerships (${partnerships.length})` : tab === 'propose' ? 'Propose' : 'Impact'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Partnerships Tab */}
        {activeTab === 'partnerships' && (
          partnerships.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see sample inter-regional partnerships.</Text>
          ) : partnerships.map(p => {
            const meta = TYPE_META[p.type];
            return (
              <TouchableOpacity key={p.id} style={st.card} onPress={() => setSelectedPartnership(p)}>
                {/* Region Connection */}
                <View style={st.regionPair}>
                  <View style={st.regionChip}><Text style={st.regionChipText}>{p.regionA}</Text></View>
                  <Text style={st.connector}>+</Text>
                  <View style={st.regionChip}><Text style={st.regionChipText}>{p.regionB}</Text></View>
                </View>
                <Text style={[st.cardTitle, { textAlign: 'center', marginBottom: 6 }]}>{p.title}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={[st.typeBadge, { backgroundColor: meta.color, marginBottom: 0 }]}>
                    <Text style={st.typeBadgeText}>{meta.icon} {meta.label}</Text>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[p.status], marginBottom: 0 }]}>
                    <Text style={st.statusText}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Text>
                  </View>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>OTK Exchanged</Text>
                  <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.bold }}>{formatOTK(p.otkExchanged)}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Beneficiaries</Text>
                  <Text style={st.val}>{p.beneficiaries.toLocaleString()}</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Duration</Text>
                  <Text style={st.val}>{p.durationMonths} months</Text>
                </View>
                <View style={st.row}>
                  <Text style={st.label}>Milestones</Text>
                  <Text style={st.val}>{p.milestones.length} completed</Text>
                </View>
                {p.culturalExchanges.length > 0 && (
                  <View style={st.row}>
                    <Text style={st.label}>Cultural Exchanges</Text>
                    <Text style={st.val}>{p.culturalExchanges.length} active</Text>
                  </View>
                )}
                {p.resourceSharing.length > 0 && (
                  <View style={st.row}>
                    <Text style={st.label}>Resources Shared</Text>
                    <Text style={st.val}>{p.resourceSharing.length} items</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Propose Tab */}
        {activeTab === 'propose' && (
          <>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: 'center', marginBottom: 4 }]}>Propose a New Partnership</Text>
              <Text style={st.desc}>
                Any community member can propose an inter-regional cooperation. Delegates from both regions will review and vote on the proposal through governance.
              </Text>
            </View>

            <Text style={st.section}>Partnership Type</Text>
            <View style={st.typeRow}>
              {(Object.keys(TYPE_META) as PartnershipType[]).map(key => {
                const meta = TYPE_META[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[st.typeChip, propType === key && st.typeChipActive]}
                    onPress={() => setPropType(key)}
                  >
                    <Text>{meta.icon}</Text>
                    <Text style={[st.typeLabel, propType === key && st.typeLabelActive]}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Region A</Text>
              <TextInput
                style={st.input}
                placeholder="e.g. South Asia"
                placeholderTextColor={t.text.muted}
                value={propRegionA}
                onChangeText={setPropRegionA}
              />
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Region B</Text>
              <TextInput
                style={st.input}
                placeholder="e.g. East Africa"
                placeholderTextColor={t.text.muted}
                value={propRegionB}
                onChangeText={setPropRegionB}
              />
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Partnership Title</Text>
              <TextInput
                style={st.input}
                placeholder="e.g. Teacher Exchange Program"
                placeholderTextColor={t.text.muted}
                value={propTitle}
                onChangeText={setPropTitle}
              />
            </View>

            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Description & Goals</Text>
              <TextInput
                style={st.textArea}
                placeholder="Describe the cooperation purpose, expected outcomes, and how OTK will flow between regions..."
                placeholderTextColor={t.text.muted}
                value={propDescription}
                onChangeText={setPropDescription}
                multiline
                numberOfLines={5}
              />
            </View>

            <TouchableOpacity style={st.submitBtn} onPress={handleSubmitProposal}>
              <Text style={st.submitBtnText}>Submit Proposal</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          partnerships.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode in Settings to see impact data.</Text>
          ) : (
            <>
              {/* Aggregate Impact */}
              <View style={st.impactCard}>
                <Text style={[st.cardTitle, { marginBottom: 12 }]}>Global Cooperation Impact</Text>
                <View style={st.impactRow}>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.accent.green }]}>{formatOTK(totalOTK)}</Text>
                    <Text style={st.impactLabel}>OTK Exchanged</Text>
                  </View>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.accent.blue }]}>{totalBeneficiaries.toLocaleString()}</Text>
                    <Text style={st.impactLabel}>Lives Touched</Text>
                  </View>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.accent.purple }]}>{partnerships.length}</Text>
                    <Text style={st.impactLabel}>Partnerships</Text>
                  </View>
                </View>
                <View style={st.impactRow}>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.text.primary }]}>{uniqueRegions}</Text>
                    <Text style={st.impactLabel}>Regions Connected</Text>
                  </View>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.accent.green }]}>{milestonesCompleted}</Text>
                    <Text style={st.impactLabel}>Milestones Hit</Text>
                  </View>
                  <View style={st.impactChip}>
                    <Text style={[st.impactNum, { color: t.accent.blue }]}>{totalExchanges}</Text>
                    <Text style={st.impactLabel}>Cultural Exchanges</Text>
                  </View>
                </View>
              </View>

              {/* By Type Breakdown */}
              <Text style={st.section}>Impact by Type</Text>
              {(Object.keys(TYPE_META) as PartnershipType[]).map(type => {
                const meta = TYPE_META[type];
                const typePartnerships = partnerships.filter(p => p.type === type);
                if (typePartnerships.length === 0) return null;
                const typeOTK = typePartnerships.reduce((s, p) => s + p.otkExchanged, 0);
                const typeBenef = typePartnerships.reduce((s, p) => s + p.beneficiaries, 0);
                return (
                  <View key={type} style={st.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 22, marginRight: 10 }}>{meta.icon}</Text>
                      <Text style={st.cardTitle}>{meta.label}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Active Partnerships</Text>
                      <Text style={st.val}>{typePartnerships.length}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>OTK Exchanged</Text>
                      <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.bold }}>{formatOTK(typeOTK)}</Text>
                    </View>
                    <View style={st.row}>
                      <Text style={st.label}>Beneficiaries</Text>
                      <Text style={st.val}>{typeBenef.toLocaleString()}</Text>
                    </View>
                    <View style={st.barContainer}>
                      <View style={[st.barFill, { width: `${Math.min((typeOTK / totalOTK) * 100, 100)}%`, backgroundColor: meta.color }]} />
                    </View>
                  </View>
                );
              })}

              {/* Resource Sharing Summary */}
              <Text style={st.section}>Resource Sharing ({totalResources} items)</Text>
              {partnerships.flatMap(p => p.resourceSharing).map((rs, i) => (
                <View key={i} style={st.resourceCard}>
                  <Text style={st.resourceName}>{RESOURCE_TYPE_ICONS[rs.type] || '\u{1F4E6}'} {rs.resource}</Text>
                  <Text style={st.resourceFlow}>{rs.fromRegion} {'\u2192'} {rs.toRegion}</Text>
                  <View style={st.row}>
                    <Text style={st.label}>{rs.quantity}</Text>
                    <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.bold }}>{formatOTK(rs.otkValue)} OTK</Text>
                  </View>
                </View>
              ))}

              {/* Cultural Exchange Summary */}
              <Text style={st.section}>Cultural Exchanges ({totalExchanges} programs)</Text>
              {partnerships.flatMap(p => p.culturalExchanges).map((ex, i) => (
                <View key={i} style={st.exchangeCard}>
                  <Text style={st.exchangeTitle}>{EXCHANGE_TYPE_ICONS[ex.type] || '\u{1F310}'} {ex.name}</Text>
                  <Text style={st.exchangeMeta}>{ex.participants.toLocaleString()} participants | {formatOTK(ex.otkAllocated)} OTK</Text>
                </View>
              ))}
            </>
          )
        )}

        {!demoMode && activeTab !== 'propose' && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample inter-regional cooperation data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
