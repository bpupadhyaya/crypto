import { fonts } from '../utils/theme';
/**
 * Climate Action — Article I of The Human Constitution.
 *
 * "The planet is our shared home — collective action is our shared duty."
 *
 * Community climate infrastructure: personal carbon footprints, climate pledges,
 * community carbon budgets, action events, climate scores, and carbon offset
 * marketplace powered by OTK.
 *
 * Features:
 * - Personal carbon footprint (estimated from lifestyle choices)
 * - Climate pledges (commit to reductions: energy, transport, food, waste)
 * - Community carbon budget (aggregate pledges, progress toward targets)
 * - Climate action events (tree plantings, energy audits, workshops)
 * - Climate score (0-100 based on pledge progress and community participation)
 * - Carbon offset marketplace (support verified offset projects with OTK)
 * - Demo: personal footprint 4.5 tons/year, 3 pledges, community score 58, 2 events
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

interface FootprintCategory {
  id: string;
  label: string;
  icon: string;
  tonsPerYear: number;
  percentage: number;
  color: string;
  tips: string[];
}

interface ClimatePledge {
  id: string;
  title: string;
  category: 'energy' | 'transport' | 'food' | 'waste';
  description: string;
  reductionTons: number;
  progress: number; // 0-100
  startDate: string;
  status: 'active' | 'completed' | 'pending';
}

interface CommunityData {
  totalMembers: number;
  totalPledges: number;
  aggregateReductionTons: number;
  targetReductionTons: number;
  communityScore: number;
  topCategories: { label: string; tons: number }[];
}

interface ActionEvent {
  id: string;
  title: string;
  type: 'tree-planting' | 'energy-audit' | 'workshop' | 'cleanup';
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  otkReward: number;
  description: string;
}

interface OffsetProject {
  id: string;
  name: string;
  type: string;
  location: string;
  tonsCaptured: number;
  priceOTK: number;
  verified: boolean;
  rating: number;
}

const DEMO_FOOTPRINT: FootprintCategory[] = [
  {
    id: 'f1', label: 'Transportation', icon: '\u{1F697}',
    tonsPerYear: 1.8, percentage: 40, color: '#ef4444',
    tips: ['Bike for short trips', 'Carpool to work', 'Use public transit'],
  },
  {
    id: 'f2', label: 'Home Energy', icon: '\u{1F3E0}',
    tonsPerYear: 1.2, percentage: 27, color: '#f59e0b',
    tips: ['Switch to LED bulbs', 'Lower thermostat 2\u00B0', 'Insulate windows'],
  },
  {
    id: 'f3', label: 'Food & Diet', icon: '\u{1F957}',
    tonsPerYear: 0.9, percentage: 20, color: '#22c55e',
    tips: ['Eat less red meat', 'Buy local produce', 'Reduce food waste'],
  },
  {
    id: 'f4', label: 'Waste & Goods', icon: '\u{267B}\uFE0F',
    tonsPerYear: 0.6, percentage: 13, color: '#3b82f6',
    tips: ['Recycle more', 'Buy second-hand', 'Avoid single-use plastic'],
  },
];

const DEMO_PLEDGES: ClimatePledge[] = [
  {
    id: 'p1', title: 'Bike to Work Twice a Week', category: 'transport',
    description: 'Replace car commute with cycling 2 days per week.',
    reductionTons: 0.4, progress: 72, startDate: '2026-01-15', status: 'active',
  },
  {
    id: 'p2', title: 'Meatless Mondays', category: 'food',
    description: 'No meat every Monday — plant-based meals only.',
    reductionTons: 0.15, progress: 85, startDate: '2026-02-01', status: 'active',
  },
  {
    id: 'p3', title: 'Zero Food Waste Month', category: 'waste',
    description: 'Compost all food scraps and plan meals to avoid waste.',
    reductionTons: 0.1, progress: 100, startDate: '2026-02-15', status: 'completed',
  },
];

const DEMO_COMMUNITY: CommunityData = {
  totalMembers: 342,
  totalPledges: 891,
  aggregateReductionTons: 128.5,
  targetReductionTons: 220,
  communityScore: 58,
  topCategories: [
    { label: 'Transport', tons: 52.3 },
    { label: 'Energy', tons: 38.1 },
    { label: 'Food', tons: 24.6 },
    { label: 'Waste', tons: 13.5 },
  ],
};

const DEMO_EVENTS: ActionEvent[] = [
  {
    id: 'e1', title: 'Community Tree Planting', type: 'tree-planting',
    date: '2026-04-05', location: 'Riverside Park',
    participants: 28, maxParticipants: 50, otkReward: 25,
    description: 'Plant 200 native trees along the riverbank. Tools and saplings provided.',
  },
  {
    id: 'e2', title: 'Home Energy Audit Workshop', type: 'energy-audit',
    date: '2026-04-12', location: 'Community Center',
    participants: 15, maxParticipants: 30, otkReward: 15,
    description: 'Learn to audit your home energy usage. Free thermal camera loans.',
  },
];

const DEMO_OFFSETS: OffsetProject[] = [
  {
    id: 'o1', name: 'Mangrove Restoration — Kerala', type: 'Reforestation',
    location: 'Kerala, India', tonsCaptured: 12_500, priceOTK: 8,
    verified: true, rating: 5,
  },
  {
    id: 'o2', name: 'Solar Cookstove Distribution', type: 'Clean Energy',
    location: 'East Africa', tonsCaptured: 8_200, priceOTK: 5,
    verified: true, rating: 4,
  },
  {
    id: 'o3', name: 'Biochar Soil Amendment', type: 'Carbon Capture',
    location: 'Brazil', tonsCaptured: 3_400, priceOTK: 12,
    verified: true, rating: 4,
  },
];

type Tab = 'footprint' | 'pledges' | 'community' | 'action';

const TAB_LABELS: Record<Tab, string> = {
  footprint: 'Footprint',
  pledges: 'Pledges',
  community: 'Community',
  action: 'Action',
};

const CATEGORY_COLORS: Record<string, string> = {
  energy: '#f59e0b',
  transport: '#ef4444',
  food: '#22c55e',
  waste: '#3b82f6',
};

const CATEGORY_ICONS: Record<string, string> = {
  energy: '\u26A1',
  transport: '\u{1F6B2}',
  food: '\u{1F331}',
  waste: '\u267B\uFE0F',
};

const EVENT_ICONS: Record<string, string> = {
  'tree-planting': '\u{1F333}',
  'energy-audit': '\u{1F50D}',
  workshop: '\u{1F4DA}',
  cleanup: '\u{1F9F9}',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#3b82f6',
  completed: '#22c55e',
  pending: '#9ca3af',
};

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

export function ClimateActionScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('footprint');

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
    tabText: { color: t.text.secondary, fontSize: 11, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: 12 },
    val: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold, color: '#fff' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: 10, fontWeight: fonts.semibold, textAlign: 'center' },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    bigNum: { fontSize: 36, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 4 },
    bigLabel: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginBottom: 16 },
    barContainer: { height: 10, backgroundColor: t.border, borderRadius: 5, marginVertical: 6, overflow: 'hidden' },
    barFill: { height: 10, borderRadius: 5 },
    progressLabel: { color: t.text.muted, fontSize: 11, marginBottom: 2 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    categoryIcon: { fontSize: 24, marginRight: 12 },
    categoryMeta: { flex: 1 },
    categoryLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    categoryTons: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    tipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
    tipTag: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tipText: { color: t.text.secondary, fontSize: 11 },
    pledgeProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pledgePercent: { fontSize: 14, fontWeight: fonts.heavy, width: 45, textAlign: 'right' },
    scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
    scoreNum: { fontSize: 32, fontWeight: fonts.heavy },
    scoreLabel: { fontSize: 10, fontWeight: fonts.semibold },
    eventIcon: { fontSize: 28, marginRight: 12 },
    eventMeta: { flex: 1 },
    eventDate: { color: t.text.muted, fontSize: 11 },
    eventDesc: { color: t.text.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
    participants: { color: t.text.secondary, fontSize: 11 },
    otkReward: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold },
    offsetCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    offsetName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 4 },
    offsetType: { fontSize: 10, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    stars: { color: '#f59e0b', fontSize: 12, letterSpacing: 2 },
    joinBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
    joinText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
    offsetBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', marginTop: 8 },
    offsetBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.bold },
  }), [t]);

  const footprint = demoMode ? DEMO_FOOTPRINT : [];
  const pledges = demoMode ? DEMO_PLEDGES : [];
  const community = demoMode ? DEMO_COMMUNITY : null;
  const events = demoMode ? DEMO_EVENTS : [];
  const offsets = demoMode ? DEMO_OFFSETS : [];

  const totalFootprint = useMemo(() => footprint.reduce((s, f) => s + f.tonsPerYear, 0), [footprint]);
  const totalPledgeReduction = useMemo(() => pledges.reduce((s, p) => s + p.reductionTons, 0), [pledges]);

  const renderFootprint = () => (
    <>
      <Text style={[st.bigNum, { color: scoreColor(100 - (totalFootprint / 10) * 100) }]}>
        {totalFootprint.toFixed(1)}
      </Text>
      <Text style={st.bigLabel}>tons CO\u2082 per year (estimated)</Text>

      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>-{totalPledgeReduction.toFixed(1)}</Text>
          <Text style={st.summaryLabel}>Tons Pledged</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>
            {(totalFootprint - totalPledgeReduction).toFixed(1)}
          </Text>
          <Text style={st.summaryLabel}>Net Footprint</Text>
        </View>
      </View>

      <Text style={st.section}>Breakdown by Category</Text>

      {footprint.map(cat => (
        <View key={cat.id} style={st.card}>
          <View style={st.categoryRow}>
            <Text style={st.categoryIcon}>{cat.icon}</Text>
            <View style={st.categoryMeta}>
              <Text style={st.categoryLabel}>{cat.label}</Text>
              <Text style={st.categoryTons}>{cat.tonsPerYear} tons/year ({cat.percentage}%)</Text>
            </View>
          </View>
          <View style={st.barContainer}>
            <View style={[st.barFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
          </View>
          <Text style={[st.label, { marginTop: 6 }]}>Reduction tips:</Text>
          <View style={st.tipRow}>
            {cat.tips.map((tip, i) => (
              <View key={i} style={st.tipTag}>
                <Text style={st.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

  const renderPledges = () => (
    <>
      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.blue }]}>{pledges.length}</Text>
          <Text style={st.summaryLabel}>Active Pledges</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.green }]}>-{totalPledgeReduction.toFixed(2)}</Text>
          <Text style={st.summaryLabel}>Tons Reduction</Text>
        </View>
        <View style={st.summaryCard}>
          <Text style={[st.summaryNum, { color: t.accent.yellow }]}>
            {pledges.filter(p => p.status === 'completed').length}
          </Text>
          <Text style={st.summaryLabel}>Completed</Text>
        </View>
      </View>

      <Text style={st.section}>Your Climate Commitments</Text>

      {pledges.map(pledge => (
        <View key={pledge.id} style={st.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>{CATEGORY_ICONS[pledge.category]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>{pledge.title}</Text>
              <Text style={[st.label, { textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }]}>
                {pledge.category}
              </Text>
            </View>
            <View style={[st.badge, { backgroundColor: STATUS_COLORS[pledge.status] }]}>
              <Text style={st.badgeText}>{pledge.status}</Text>
            </View>
          </View>
          <Text style={[st.label, { marginBottom: 8, lineHeight: 17 }]}>{pledge.description}</Text>
          <View style={st.pledgeProgress}>
            <View style={[st.barContainer, { flex: 1 }]}>
              <View style={[st.barFill, {
                width: `${pledge.progress}%`,
                backgroundColor: CATEGORY_COLORS[pledge.category],
              }]} />
            </View>
            <Text style={[st.pledgePercent, { color: CATEGORY_COLORS[pledge.category] }]}>
              {pledge.progress}%
            </Text>
          </View>
          <View style={[st.row, { marginTop: 6 }]}>
            <Text style={st.label}>Reduction</Text>
            <Text style={st.val}>-{pledge.reductionTons} tons/year</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Started</Text>
            <Text style={st.val}>{pledge.startDate}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderCommunity = () => {
    if (!community) return <Text style={st.empty}>No community data available.</Text>;
    const progressPct = Math.round((community.aggregateReductionTons / community.targetReductionTons) * 100);
    return (
      <>
        {/* Community Climate Score */}
        <View style={[st.scoreCircle, { borderColor: scoreColor(community.communityScore) }]}>
          <Text style={[st.scoreNum, { color: scoreColor(community.communityScore) }]}>
            {community.communityScore}
          </Text>
          <Text style={[st.scoreLabel, { color: t.text.muted }]}>Score</Text>
        </View>
        <Text style={st.bigLabel}>Community Climate Score (0-100)</Text>

        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.blue }]}>{community.totalMembers}</Text>
            <Text style={st.summaryLabel}>Members</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.green }]}>{community.totalPledges}</Text>
            <Text style={st.summaryLabel}>Pledges</Text>
          </View>
        </View>

        <Text style={st.section}>Community Carbon Budget</Text>

        <View style={st.card}>
          <View style={st.row}>
            <Text style={st.label}>Aggregate Reduction</Text>
            <Text style={[st.val, { color: t.accent.green }]}>
              {community.aggregateReductionTons} tons
            </Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Target</Text>
            <Text style={st.val}>{community.targetReductionTons} tons</Text>
          </View>
          <Text style={st.progressLabel}>{progressPct}% of target reached</Text>
          <View style={st.barContainer}>
            <View style={[st.barFill, {
              width: `${Math.min(progressPct, 100)}%`,
              backgroundColor: scoreColor(progressPct),
            }]} />
          </View>
        </View>

        <Text style={st.section}>Reduction by Category</Text>

        {community.topCategories.map((cat, i) => (
          <View key={i} style={st.card}>
            <View style={st.row}>
              <Text style={st.cardTitle}>{cat.label}</Text>
              <Text style={[st.val, { color: t.accent.green, fontSize: 14 }]}>-{cat.tons} tons</Text>
            </View>
            <View style={st.barContainer}>
              <View style={[st.barFill, {
                width: `${(cat.tons / community.aggregateReductionTons) * 100}%`,
                backgroundColor: t.accent.blue,
              }]} />
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderAction = () => (
    <>
      <Text style={st.section}>Upcoming Climate Events</Text>

      {events.map(event => (
        <View key={event.id} style={st.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={st.eventIcon}>{EVENT_ICONS[event.type]}</Text>
            <View style={st.eventMeta}>
              <Text style={st.cardTitle}>{event.title}</Text>
              <Text style={st.eventDate}>{event.date} · {event.location}</Text>
              <Text style={st.eventDesc}>{event.description}</Text>
              <View style={st.eventFooter}>
                <Text style={st.participants}>
                  {event.participants}/{event.maxParticipants} joined
                </Text>
                <Text style={st.otkReward}>+{event.otkReward} OTK</Text>
              </View>
              <View style={st.barContainer}>
                <View style={[st.barFill, {
                  width: `${(event.participants / event.maxParticipants) * 100}%`,
                  backgroundColor: t.accent.green,
                }]} />
              </View>
              <TouchableOpacity style={st.joinBtn}>
                <Text style={st.joinText}>Join Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      <Text style={st.section}>Carbon Offset Marketplace</Text>

      {offsets.map(project => (
        <View key={project.id} style={st.offsetCard}>
          <Text style={[st.offsetType, { color: t.text.muted }]}>{project.type}</Text>
          <Text style={st.offsetName}>{project.name}</Text>
          <View style={st.row}>
            <Text style={st.label}>Location</Text>
            <Text style={st.val}>{project.location}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>CO\u2082 Captured</Text>
            <Text style={st.val}>{project.tonsCaptured.toLocaleString()} tons</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Price</Text>
            <Text style={[st.val, { color: t.accent.blue }]}>{project.priceOTK} OTK / ton</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Rating</Text>
            <Text style={st.stars}>
              {'\u2605'.repeat(project.rating)}{'\u2606'.repeat(5 - project.rating)}
            </Text>
          </View>
          {project.verified && (
            <View style={[st.badge, { backgroundColor: '#22c55e', marginTop: 4 }]}>
              <Text style={st.badgeText}>Verified Project</Text>
            </View>
          )}
          <TouchableOpacity style={st.offsetBtn}>
            <Text style={st.offsetBtnText}>Offset with OTK</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const TABS: Tab[] = ['footprint', 'pledges', 'community', 'action'];

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Climate Action</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Track your carbon footprint, make climate pledges, and join community action.
          Collective effort toward a sustainable future — powered by OTK.
        </Text>

        <View style={st.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!demoMode && (
          <Text style={st.empty}>Enable demo mode to explore climate action features.</Text>
        )}

        {demoMode && activeTab === 'footprint' && renderFootprint()}
        {demoMode && activeTab === 'pledges' && renderPledges()}
        {demoMode && activeTab === 'community' && renderCommunity()}
        {demoMode && activeTab === 'action' && renderAction()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
