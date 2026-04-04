import { fonts } from '../utils/theme';
/**
 * Food Security Screen — Article I of The Human Constitution.
 *
 * "Every dimension of human contribution is valued equally."
 *
 * Tracks food availability, community gardens, and meal sharing to ensure
 * no one goes hungry. Food security is the most fundamental need — without
 * it, no other human development is possible.
 *
 * Features:
 * - Food security score for your region (0-100)
 * - Community gardens map/list — join or start, track harvests
 * - Meal sharing network — offer surplus, request when in need
 * - Food bank integration — donations and distributions
 * - Seasonal crop calendar — what's growing in your region
 * - Surplus food alerts — reduce waste by connecting surplus to need
 * - Nutrition education — basic guides per region
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// ─── Types ───

interface Props {
  onClose: () => void;
}

type TabKey = 'dashboard' | 'gardens' | 'sharing' | 'education';

interface FoodSecurityData {
  score: number;           // 0-100
  availability: number;    // 0-100
  affordability: number;   // 0-100
  distribution: number;    // 0-100
  trend: 'improving' | 'stable' | 'declining';
  region: string;
}

interface CommunityGarden {
  id: string;
  name: string;
  location: string;
  members: number;
  plotsTotal: number;
  plotsAvailable: number;
  currentCrops: string[];
  harvestThisSeason: number; // kg
  status: 'active' | 'planning' | 'dormant';
}

interface MealShare {
  id: string;
  type: 'offer' | 'request';
  description: string;
  portions: number;
  postedBy: string;
  distance: string;
  timePosted: string;
  dietary: string[];
  status: 'available' | 'claimed' | 'expired';
}

interface FoodBank {
  id: string;
  name: string;
  donationsThisMonth: number; // kg
  distributionsThisMonth: number; // kg
  familiesServed: number;
  needLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface CropSeason {
  crop: string;
  icon: string;
  plantMonth: string;
  harvestMonth: string;
  status: 'in-season' | 'upcoming' | 'off-season';
  tip: string;
}

interface NutritionGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  readTime: string;
}

interface SurplusAlert {
  id: string;
  item: string;
  quantity: string;
  source: string;
  expiresIn: string;
  distance: string;
}

// ─── Constants ───

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'gardens', label: 'Gardens' },
  { key: 'sharing', label: 'Sharing' },
  { key: 'education', label: 'Education' },
];

const SCORE_COLORS: Record<string, string> = {
  excellent: '#22c55e',
  good: '#4ade80',
  moderate: '#eab308',
  poor: '#f97316',
  critical: '#ef4444',
};

const NEED_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const GARDEN_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  planning: '#3b82f6',
  dormant: '#8E8E93',
};

const SEASON_COLORS: Record<string, string> = {
  'in-season': '#22c55e',
  upcoming: '#3b82f6',
  'off-season': '#8E8E93',
};

// ─── Demo Data ───

const DEMO_FOOD_SECURITY: FoodSecurityData = {
  score: 74,
  availability: 82,
  affordability: 65,
  distribution: 75,
  trend: 'improving',
  region: 'Portland Metro',
};

const DEMO_GARDENS: CommunityGarden[] = [
  {
    id: 'g1', name: 'Riverside Community Garden', location: '0.8 mi away',
    members: 34, plotsTotal: 50, plotsAvailable: 8,
    currentCrops: ['Tomatoes', 'Kale', 'Peppers', 'Herbs'],
    harvestThisSeason: 420, status: 'active',
  },
  {
    id: 'g2', name: 'Eastside Urban Farm', location: '1.5 mi away',
    members: 22, plotsTotal: 30, plotsAvailable: 3,
    currentCrops: ['Squash', 'Beans', 'Corn', 'Lettuce'],
    harvestThisSeason: 310, status: 'active',
  },
  {
    id: 'g3', name: 'Hilltop Starter Garden', location: '2.1 mi away',
    members: 8, plotsTotal: 20, plotsAvailable: 14,
    currentCrops: [],
    harvestThisSeason: 0, status: 'planning',
  },
];

const DEMO_MEAL_SHARES: MealShare[] = [
  {
    id: 'm1', type: 'offer', description: 'Fresh vegetable soup — made too much!',
    portions: 4, postedBy: 'Maria K.', distance: '0.3 mi',
    timePosted: '20 min ago', dietary: ['vegetarian', 'gluten-free'],
    status: 'available',
  },
  {
    id: 'm2', type: 'offer', description: 'Rice and dal with salad',
    portions: 3, postedBy: 'Raj P.', distance: '0.7 mi',
    timePosted: '45 min ago', dietary: ['vegan'],
    status: 'available',
  },
  {
    id: 'm3', type: 'request', description: 'Family of 4 — anything appreciated',
    portions: 4, postedBy: 'Anonymous', distance: '1.2 mi',
    timePosted: '1 hr ago', dietary: [],
    status: 'available',
  },
  {
    id: 'm4', type: 'offer', description: 'Homemade bread — 3 loaves',
    portions: 6, postedBy: 'Sam W.', distance: '0.5 mi',
    timePosted: '2 hrs ago', dietary: ['vegetarian'],
    status: 'available',
  },
];

const DEMO_FOOD_BANKS: FoodBank[] = [
  { id: 'fb1', name: 'Community Food Pantry', donationsThisMonth: 2_400, distributionsThisMonth: 2_100, familiesServed: 180, needLevel: 'moderate' },
  { id: 'fb2', name: 'Eastside Food Bank', donationsThisMonth: 1_800, distributionsThisMonth: 2_500, familiesServed: 220, needLevel: 'high' },
];

const DEMO_CROPS: CropSeason[] = [
  { crop: 'Tomatoes', icon: 'T', plantMonth: 'Apr', harvestMonth: 'Aug', status: 'in-season', tip: 'Stake early for best yields. Water deeply, less frequently.' },
  { crop: 'Kale', icon: 'K', plantMonth: 'Mar', harvestMonth: 'Nov', status: 'in-season', tip: 'Cold-hardy. Harvest outer leaves first for continuous growth.' },
  { crop: 'Squash', icon: 'S', plantMonth: 'May', harvestMonth: 'Oct', status: 'in-season', tip: 'Needs space. 1 plant can yield 5-10 lbs per season.' },
  { crop: 'Garlic', icon: 'G', plantMonth: 'Oct', harvestMonth: 'Jul', status: 'upcoming', tip: 'Plant in fall for summer harvest. Needs cold to develop bulbs.' },
  { crop: 'Peas', icon: 'P', plantMonth: 'Feb', harvestMonth: 'Jun', status: 'off-season', tip: 'Cool-season crop. Provide trellis support for climbing varieties.' },
];

const DEMO_SURPLUS: SurplusAlert[] = [
  { id: 's1', item: 'Zucchini (15 lbs)', quantity: '15 lbs', source: 'Riverside Garden', expiresIn: '2 days', distance: '0.8 mi' },
  { id: 's2', item: 'Day-old bread (20 loaves)', quantity: '20 loaves', source: 'Main St Bakery', expiresIn: '1 day', distance: '0.4 mi' },
  { id: 's3', item: 'Canned goods assortment', quantity: '50 cans', source: 'Food Drive', expiresIn: '6 months', distance: '1.1 mi' },
];

const DEMO_GUIDES: NutritionGuide[] = [
  { id: 'n1', title: 'Eating Well on a Budget', category: 'Basics', summary: 'How to get complete nutrition for under $5/day with seasonal, local produce and simple recipes.', readTime: '4 min' },
  { id: 'n2', title: 'Seasonal Eating Guide', category: 'Seasonal', summary: 'Why eating in-season saves money, tastes better, and supports local farmers. Monthly breakdown included.', readTime: '5 min' },
  { id: 'n3', title: 'Preserving the Harvest', category: 'Skills', summary: 'Canning, drying, and fermenting basics to extend your garden bounty through winter months.', readTime: '7 min' },
  { id: 'n4', title: 'Child Nutrition Essentials', category: 'Family', summary: 'Key nutrients for growing children, affordable sources, and simple meal ideas that kids enjoy.', readTime: '5 min' },
  { id: 'n5', title: 'Community Kitchen Guide', category: 'Community', summary: 'How to start a community kitchen: food safety, equipment, scheduling, and recipes that scale.', readTime: '8 min' },
];

// ─── Helpers ───

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

function scoreColor(score: number): string {
  if (score >= 85) return SCORE_COLORS.excellent;
  if (score >= 70) return SCORE_COLORS.good;
  if (score >= 50) return SCORE_COLORS.moderate;
  if (score >= 30) return SCORE_COLORS.poor;
  return SCORE_COLORS.critical;
}

const TREND_ICONS: Record<string, string> = {
  improving: '\u2191',
  stable: '\u2192',
  declining: '\u2193',
};

// ─── Component ───

export function FoodSecurityScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedGarden, setSelectedGarden] = useState<CommunityGarden | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    bigScore: { fontSize: 48, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 4 },
    scoreLabel: { fontSize: fonts.md, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 2 },
    region: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginBottom: 16 },
    barContainer: { height: 8, backgroundColor: t.border, borderRadius: 4, marginVertical: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    gardenName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 2 },
    gardenLocation: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 8 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.bg.primary },
    tagText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    shareCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    shareType: { fontSize: fonts.xs, fontWeight: fonts.bold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 6 },
    shareDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, marginBottom: 4 },
    shareMeta: { color: t.text.muted, fontSize: fonts.xs, marginBottom: 2 },
    dietaryTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 4, marginTop: 4 },
    dietaryText: { fontSize: fonts.xxs, fontWeight: fonts.semibold },
    actionBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    secondaryBtn: { borderWidth: 1, borderColor: t.accent.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    secondaryBtnText: { color: t.accent.blue, fontSize: fonts.md, fontWeight: fonts.bold },
    cropRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    cropIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cropIconText: { fontSize: fonts.md, fontWeight: fonts.heavy, color: '#fff' },
    cropName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    cropTiming: { color: t.text.muted, fontSize: fonts.xs },
    cropTip: { color: t.text.secondary, fontSize: fonts.xs, fontStyle: 'italic', marginTop: 2 },
    cropStatus: { fontSize: fonts.xs, fontWeight: fonts.bold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', color: '#fff' },
    alertCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#f97316' },
    alertItem: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 2 },
    alertMeta: { color: t.text.muted, fontSize: fonts.xs },
    guideCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    guideCategory: { color: t.accent.blue, fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    guideTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 4 },
    guideSummary: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 18, marginBottom: 4 },
    guideRead: { color: t.text.muted, fontSize: fonts.xs },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 8 },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    backBtn: { paddingVertical: 12, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.md },
    foodBankCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 10 },
    fbName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 6 },
    fbNeedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
    fbNeedText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
  }), [t]);

  // ─── Dashboard Tab ───

  const renderDashboard = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see sample food security data.</Text>;
    }

    const data = DEMO_FOOD_SECURITY;
    const sc = scoreColor(data.score);

    return (
      <>
        <Text style={st.subtitle}>
          Track food availability, affordability, and distribution in your region.
          A score of 100 means everyone has reliable access to nutritious food.
        </Text>

        {/* Big Score */}
        <View style={st.card}>
          <Text style={[st.bigScore, { color: sc }]}>{data.score}</Text>
          <Text style={[st.scoreLabel, { color: sc }]}>
            {scoreLabel(data.score)} {TREND_ICONS[data.trend]}
          </Text>
          <Text style={st.region}>{data.region}</Text>

          <View style={st.divider} />

          {/* Breakdown bars */}
          {[
            { label: 'Availability', value: data.availability },
            { label: 'Affordability', value: data.affordability },
            { label: 'Distribution', value: data.distribution },
          ].map(item => (
            <View key={item.label} style={{ marginBottom: 10 }}>
              <View style={st.row}>
                <Text style={st.label}>{item.label}</Text>
                <Text style={st.val}>{item.value}/100</Text>
              </View>
              <View style={st.barContainer}>
                <View style={[st.barFill, {
                  width: `${item.value}%`,
                  backgroundColor: scoreColor(item.value),
                }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.green }]}>3</Text>
            <Text style={st.summaryLabel}>Community Gardens</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.blue }]}>4</Text>
            <Text style={st.summaryLabel}>Meals Available</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#f97316' }]}>3</Text>
            <Text style={st.summaryLabel}>Surplus Alerts</Text>
          </View>
        </View>

        {/* Food Banks */}
        <Text style={st.section}>Food Banks</Text>
        {DEMO_FOOD_BANKS.map(fb => (
          <View key={fb.id} style={st.foodBankCard}>
            <Text style={st.fbName}>{fb.name}</Text>
            <View style={[st.fbNeedBadge, { backgroundColor: NEED_COLORS[fb.needLevel] }]}>
              <Text style={st.fbNeedText}>Need: {fb.needLevel.toUpperCase()}</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Donations this month</Text>
              <Text style={st.val}>{fb.donationsThisMonth.toLocaleString()} kg</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Distributed</Text>
              <Text style={st.val}>{fb.distributionsThisMonth.toLocaleString()} kg</Text>
            </View>
            <View style={st.row}>
              <Text style={st.label}>Families served</Text>
              <Text style={st.val}>{fb.familiesServed}</Text>
            </View>
          </View>
        ))}

        {/* Surplus Alerts */}
        <Text style={st.section}>Surplus Food Alerts</Text>
        {DEMO_SURPLUS.map(s => (
          <View key={s.id} style={st.alertCard}>
            <Text style={st.alertItem}>{s.item}</Text>
            <Text style={st.alertMeta}>
              {s.source} — {s.distance} — Expires in {s.expiresIn}
            </Text>
          </View>
        ))}
      </>
    );
  }, [demoMode, st, t]);

  // ─── Gardens Tab ───

  const renderGardens = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see community gardens.</Text>;
    }

    if (selectedGarden) {
      const g = selectedGarden;
      return (
        <>
          <Text style={st.gardenName}>{g.name}</Text>
          <Text style={st.gardenLocation}>{g.location}</Text>
          <View style={[st.statusBadge, { backgroundColor: GARDEN_STATUS_COLORS[g.status] }]}>
            <Text style={st.statusText}>{g.status.toUpperCase()}</Text>
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <Text style={st.label}>Members</Text>
            <Text style={st.val}>{g.members}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Plots available</Text>
            <Text style={st.val}>{g.plotsAvailable} of {g.plotsTotal}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Harvest this season</Text>
            <Text style={st.val}>{g.harvestThisSeason} kg</Text>
          </View>

          {g.currentCrops.length > 0 && (
            <>
              <Text style={st.section}>Current Crops</Text>
              <View style={st.tagRow}>
                {g.currentCrops.map(crop => (
                  <View key={crop} style={st.tag}>
                    <Text style={st.tagText}>{crop}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {g.plotsAvailable > 0 && (
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Join Garden', `Request sent to join ${g.name}!`)}
            >
              <Text style={st.actionBtnText}>Join This Garden</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={st.backBtn} onPress={() => setSelectedGarden(null)}>
            <Text style={st.backText}>Back to Gardens</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={st.subtitle}>
          Community gardens grow food, build connections, and strengthen food security.
          Join an existing garden or start one in your neighborhood.
        </Text>

        {DEMO_GARDENS.map(g => (
          <TouchableOpacity key={g.id} style={st.card} onPress={() => setSelectedGarden(g)}>
            <View style={st.row}>
              <Text style={st.gardenName}>{g.name}</Text>
              <View style={[st.statusBadge, { backgroundColor: GARDEN_STATUS_COLORS[g.status], marginBottom: 0 }]}>
                <Text style={st.statusText}>{g.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={st.gardenLocation}>{g.location}</Text>
            <View style={st.row}>
              <Text style={st.label}>{g.members} members</Text>
              <Text style={st.val}>{g.plotsAvailable} plots open</Text>
            </View>
            {g.currentCrops.length > 0 && (
              <View style={st.tagRow}>
                {g.currentCrops.map(crop => (
                  <View key={crop} style={st.tag}>
                    <Text style={st.tagText}>{crop}</Text>
                  </View>
                ))}
              </View>
            )}
            {g.harvestThisSeason > 0 && (
              <Text style={st.label}>Harvested: {g.harvestThisSeason} kg this season</Text>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={st.secondaryBtn}
          onPress={() => Alert.alert('Start a Garden', 'Coming soon — register interest in starting a community garden in your area.')}
        >
          <Text style={st.secondaryBtnText}>Start a New Garden</Text>
        </TouchableOpacity>
      </>
    );
  }, [demoMode, st, selectedGarden]);

  // ─── Sharing Tab ───

  const renderSharing = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see meal sharing network.</Text>;
    }

    const offers = DEMO_MEAL_SHARES.filter(m => m.type === 'offer');
    const requests = DEMO_MEAL_SHARES.filter(m => m.type === 'request');

    return (
      <>
        <Text style={st.subtitle}>
          Share surplus meals with neighbors or request help when you need it.
          No one should go hungry when food is nearby.
        </Text>

        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: t.accent.green }]}>{offers.length}</Text>
            <Text style={st.summaryLabel}>Meals Offered</Text>
          </View>
          <View style={st.summaryCard}>
            <Text style={[st.summaryNum, { color: '#f97316' }]}>{requests.length}</Text>
            <Text style={st.summaryLabel}>Requests</Text>
          </View>
        </View>

        <Text style={st.section}>Available Meals</Text>
        {offers.map(m => (
          <View key={m.id} style={st.shareCard}>
            <Text style={[st.shareType, { backgroundColor: t.accent.green, color: '#fff' }]}>OFFERING</Text>
            <Text style={st.shareDesc}>{m.description}</Text>
            <Text style={st.shareMeta}>{m.portions} portions — {m.distance} — {m.timePosted}</Text>
            <Text style={st.shareMeta}>By {m.postedBy}</Text>
            {m.dietary.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                {m.dietary.map(d => (
                  <View key={d} style={[st.dietaryTag, { backgroundColor: t.bg.primary }]}>
                    <Text style={[st.dietaryText, { color: t.text.secondary }]}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Claim Meal', `Request sent to ${m.postedBy}!`)}
            >
              <Text style={st.actionBtnText}>Claim This Meal</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={st.section}>Requests</Text>
        {requests.map(m => (
          <View key={m.id} style={st.shareCard}>
            <Text style={[st.shareType, { backgroundColor: '#f97316', color: '#fff' }]}>REQUEST</Text>
            <Text style={st.shareDesc}>{m.description}</Text>
            <Text style={st.shareMeta}>{m.portions} portions needed — {m.distance} — {m.timePosted}</Text>
            <TouchableOpacity
              style={st.actionBtn}
              onPress={() => Alert.alert('Help Out', 'Thank you! Your offer to help has been sent.')}
            >
              <Text style={st.actionBtnText}>I Can Help</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 8 }} />
        <TouchableOpacity
          style={st.secondaryBtn}
          onPress={() => Alert.alert('Share a Meal', 'Coming soon — post surplus food to share with your community.')}
        >
          <Text style={st.secondaryBtnText}>Offer a Meal</Text>
        </TouchableOpacity>
      </>
    );
  }, [demoMode, st, t]);

  // ─── Education Tab ───

  const renderEducation = useCallback(() => {
    if (!demoMode) {
      return <Text style={st.empty}>Enable demo mode to see nutrition education.</Text>;
    }

    return (
      <>
        <Text style={st.subtitle}>
          Knowledge is the foundation of food security. Learn what grows in your region,
          how to eat well affordably, and how to preserve food.
        </Text>

        {/* Seasonal Crop Calendar */}
        <Text style={st.section}>Seasonal Crop Calendar</Text>
        {DEMO_CROPS.map(crop => (
          <View key={crop.crop} style={st.cropRow}>
            <View style={[st.cropIcon, { backgroundColor: SEASON_COLORS[crop.status] }]}>
              <Text style={st.cropIconText}>{crop.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={st.cropName}>{crop.crop}</Text>
                <Text style={[st.cropStatus, { backgroundColor: SEASON_COLORS[crop.status] }]}>
                  {crop.status === 'in-season' ? 'IN SEASON' : crop.status === 'upcoming' ? 'UPCOMING' : 'OFF SEASON'}
                </Text>
              </View>
              <Text style={st.cropTiming}>Plant: {crop.plantMonth} — Harvest: {crop.harvestMonth}</Text>
              <Text style={st.cropTip}>{crop.tip}</Text>
            </View>
          </View>
        ))}

        {/* Nutrition Guides */}
        <Text style={st.section}>Nutrition Guides</Text>
        {DEMO_GUIDES.map(guide => (
          <TouchableOpacity
            key={guide.id}
            style={st.guideCard}
            onPress={() => Alert.alert(guide.title, guide.summary)}
          >
            <Text style={st.guideCategory}>{guide.category}</Text>
            <Text style={st.guideTitle}>{guide.title}</Text>
            <Text style={st.guideSummary}>{guide.summary}</Text>
            <Text style={st.guideRead}>{guide.readTime} read</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  }, [demoMode, st]);

  // ─── Render ───

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'gardens': return renderGardens();
      case 'sharing': return renderSharing();
      case 'education': return renderEducation();
    }
  }, [activeTab, renderDashboard, renderGardens, renderSharing, renderEducation]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Food Security</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll}>
        <View style={st.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[st.tab, activeTab === tab.key && st.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                setSelectedGarden(null);
              }}
            >
              <Text style={[st.tabText, activeTab === tab.key && st.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
