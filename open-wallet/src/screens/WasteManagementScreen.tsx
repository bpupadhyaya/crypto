import { fonts } from '../utils/theme';
/**
 * Waste Management Screen — Community recycling, composting, and waste reduction.
 *
 * Article I: "Every act of waste reduction preserves life for future generations."
 *
 * Features:
 * - Waste reduction score (0-100: recycling rate, composting, waste per person)
 * - Recycling guide — what goes where (categories with items)
 * - Community compost sites — locations, capacity, how to contribute
 * - Waste collection schedule (by area)
 * - Upcycling marketplace — repurpose items instead of discarding
 * - Waste stats (community diversion rate, landfill avoided)
 * - Demo mode with sample data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface WasteScore {
  overall: number;
  recyclingRate: number;
  compostingRate: number;
  wastePerPerson: number; // kg/week — lower is better
  trend: 'improving' | 'stable' | 'declining';
  communityRank: number;
}

interface RecyclingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: string[];
  tips: string;
}

interface CompostSite {
  id: string;
  name: string;
  location: string;
  capacityPercent: number;
  acceptsFood: boolean;
  acceptsYard: boolean;
  hours: string;
  contactUID: string;
}

interface CollectionSchedule {
  area: string;
  recycling: string;
  compost: string;
  general: string;
}

interface UpcycleItem {
  id: string;
  title: string;
  description: string;
  condition: string;
  postedBy: string;
  date: string;
  claimed: boolean;
}

interface CommunityWasteStats {
  diversionRate: number;
  landfillAvoidedKg: number;
  totalRecycledKg: number;
  totalCompostedKg: number;
  activeHouseholds: number;
  monthlyTrend: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_SCORE: WasteScore = {
  overall: 58,
  recyclingRate: 64,
  compostingRate: 42,
  wastePerPerson: 3.2,
  trend: 'improving',
  communityRank: 34,
};

const DEMO_CATEGORIES: RecyclingCategory[] = [
  { id: 'r1', name: 'Paper & Cardboard', icon: 'P', color: '#007AFF', items: ['Newspapers', 'Magazines', 'Cardboard boxes', 'Office paper', 'Paper bags', 'Junk mail'], tips: 'Flatten boxes. Remove tape and staples when possible.' },
  { id: 'r2', name: 'Plastics', icon: '#', color: '#FF9500', items: ['Bottles (#1, #2)', 'Containers (#5)', 'Jugs', 'Tubs'], tips: 'Rinse containers. Check the number — not all plastics are recyclable. No plastic bags.' },
  { id: 'r3', name: 'Glass', icon: 'G', color: '#34C759', items: ['Bottles', 'Jars', 'Food containers'], tips: 'Rinse clean. Remove lids (recycle metal lids separately). No window glass or mirrors.' },
  { id: 'r4', name: 'Metals', icon: 'M', color: '#8E8E93', items: ['Aluminum cans', 'Steel cans', 'Tin foil (clean)', 'Metal lids'], tips: 'Rinse cans. Crush if possible to save space.' },
  { id: 'r5', name: 'Electronics', icon: 'E', color: '#AF52DE', items: ['Phones', 'Laptops', 'Batteries', 'Cables', 'Small appliances'], tips: 'Never put in regular recycling. Use designated e-waste drop-off points.' },
  { id: 'r6', name: 'Compostable', icon: 'C', color: '#5856D6', items: ['Fruit & vegetable scraps', 'Coffee grounds', 'Eggshells', 'Yard waste', 'Paper towels'], tips: 'No meat, dairy, or oils in home compost. Community sites may accept more.' },
];

const DEMO_COMPOST_SITES: CompostSite[] = [
  { id: 'c1', name: 'Riverside Community Garden', location: '245 River Rd', capacityPercent: 62, acceptsFood: true, acceptsYard: true, hours: 'Daily 7am-7pm', contactUID: 'openchain1abc...garden_sam' },
  { id: 'c2', name: 'Lincoln Park Compost Hub', location: '88 Lincoln Ave', capacityPercent: 35, acceptsFood: true, acceptsYard: true, hours: 'Sat-Sun 9am-4pm', contactUID: 'openchain1def...green_maria' },
  { id: 'c3', name: 'School District Drop-off', location: '120 Oak St (behind gym)', capacityPercent: 78, acceptsFood: false, acceptsYard: true, hours: 'Weekdays 8am-3pm', contactUID: 'openchain1ghi...school_raj' },
];

const DEMO_SCHEDULE: CollectionSchedule[] = [
  { area: 'Downtown / Zone A', recycling: 'Monday & Thursday', compost: 'Wednesday', general: 'Tuesday & Friday' },
  { area: 'Riverside / Zone B', recycling: 'Tuesday & Friday', compost: 'Thursday', general: 'Monday & Wednesday' },
  { area: 'Northside / Zone C', recycling: 'Wednesday & Saturday', compost: 'Friday', general: 'Tuesday & Thursday' },
];

const DEMO_UPCYCLE: UpcycleItem[] = [
  { id: 'u1', title: 'Wooden Pallets (x4)', description: 'Good condition, great for garden beds or furniture projects.', condition: 'Good', postedBy: 'openchain1abc...builder_sam', date: '2026-03-28', claimed: false },
  { id: 'u2', title: 'Glass Jars Collection (20+)', description: 'Assorted sizes, cleaned. Perfect for canning or storage.', condition: 'Excellent', postedBy: 'openchain1def...cook_maria', date: '2026-03-27', claimed: false },
  { id: 'u3', title: 'Old Bicycle Frame', description: 'Needs new wheels and chain. Frame is solid steel.', condition: 'Fair', postedBy: 'openchain1ghi...fix_raj', date: '2026-03-25', claimed: false },
  { id: 'u4', title: 'Fabric Scraps Bag', description: 'Mixed fabrics from a quilting project. Good for small crafts.', condition: 'Good', postedBy: 'you', date: '2026-03-24', claimed: true },
];

const DEMO_COMMUNITY_STATS: CommunityWasteStats = {
  diversionRate: 47,
  landfillAvoidedKg: 12400,
  totalRecycledKg: 8200,
  totalCompostedKg: 4200,
  activeHouseholds: 328,
  monthlyTrend: 3.2,
};

type Tab = 'dashboard' | 'guide' | 'compost' | 'upcycle';

export function WasteManagementScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const scoreColor = useMemo(() => {
    if (DEMO_SCORE.overall >= 75) return t.accent.green;
    if (DEMO_SCORE.overall >= 50) return t.accent.orange;
    return '#FF3B30';
  }, [t]);

  const handleClaimItem = useCallback((item: UpcycleItem) => {
    if (item.claimed) {
      Alert.alert('Already Claimed', 'This item has already been claimed.');
      return;
    }
    Alert.alert(
      'Claim Item',
      `Claim "${item.title}"?\n\nYou will be connected with the poster to arrange pickup. Upcycling earns community recognition.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Claim', onPress: () => Alert.alert('Claimed', 'Item claimed. Contact the poster to arrange pickup.') },
      ],
    );
  }, []);

  const handlePostUpcycle = useCallback(() => {
    Alert.alert('Post an Item', 'Share an item you no longer need instead of discarding it.\n\nItems posted to the upcycling marketplace help reduce community waste.');
  }, []);

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
    // Dashboard
    scoreContainer: { alignItems: 'center', marginBottom: 16 },
    scoreValue: { fontSize: 64, fontWeight: fonts.heavy },
    scoreLabel: { color: t.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    trendBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
    trendText: { fontSize: 12, fontWeight: fonts.bold },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
    breakdownItem: { alignItems: 'center' },
    breakdownValue: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    breakdownLabel: { color: t.text.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    breakdownUnit: { color: t.text.muted, fontSize: 10 },
    communityCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    communityTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, marginBottom: 12 },
    communityStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    communityStatLabel: { color: t.text.muted, fontSize: 13 },
    communityStatValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    scheduleCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    scheduleArea: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold, marginBottom: 8 },
    scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    scheduleType: { color: t.text.muted, fontSize: 12 },
    scheduleDay: { color: t.text.primary, fontSize: 12, fontWeight: fonts.semibold },
    // Guide
    categoryCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center' },
    categoryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    categoryIconText: { color: '#fff', fontSize: 14, fontWeight: fonts.bold },
    categoryName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    categoryExpand: { color: t.text.muted, fontSize: 16 },
    categoryItems: { marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    categoryItem: { color: t.text.primary, fontSize: 13, marginBottom: 4, paddingLeft: 8 },
    categoryTip: { color: t.accent.blue, fontSize: 12, marginTop: 8, fontStyle: 'italic', lineHeight: 18 },
    // Compost
    compostCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    compostName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    compostLocation: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    compostMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    capacityBar: { height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginTop: 10 },
    capacityFill: { height: 8, borderRadius: 4 },
    capacityText: { color: t.text.muted, fontSize: 11, marginTop: 4 },
    acceptsTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
    acceptTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    acceptTagText: { fontSize: 11, fontWeight: fonts.semibold },
    // Upcycle
    upcycleCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    upcycleTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    upcycleDesc: { color: t.text.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    upcycleMeta: { color: t.text.muted, fontSize: 12, marginTop: 6 },
    upcycleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    conditionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    conditionText: { fontSize: 12, fontWeight: fonts.semibold },
    claimBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    claimBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    postBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
    postBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'guide', label: 'Recycle Guide' },
    { key: 'compost', label: 'Compost' },
    { key: 'upcycle', label: 'Upcycle' },
  ];

  // ─── Dashboard Tab ───

  const renderDashboard = () => (
    <>
      <View style={s.card}>
        <View style={s.scoreContainer}>
          <Text style={s.scoreLabel}>Waste Reduction Score</Text>
          <Text style={[s.scoreValue, { color: scoreColor }]}>{DEMO_SCORE.overall}</Text>
          <View style={[s.trendBadge, { backgroundColor: DEMO_SCORE.trend === 'improving' ? t.accent.green + '20' : t.accent.orange + '20' }]}>
            <Text style={[s.trendText, { color: DEMO_SCORE.trend === 'improving' ? t.accent.green : t.accent.orange }]}>
              {DEMO_SCORE.trend === 'improving' ? 'Improving' : DEMO_SCORE.trend === 'stable' ? 'Stable' : 'Declining'}
            </Text>
          </View>
        </View>
        <View style={s.breakdownRow}>
          <View style={s.breakdownItem}>
            <Text style={s.breakdownValue}>{DEMO_SCORE.recyclingRate}%</Text>
            <Text style={s.breakdownLabel}>Recycling{'\n'}Rate</Text>
          </View>
          <View style={s.breakdownItem}>
            <Text style={s.breakdownValue}>{DEMO_SCORE.compostingRate}%</Text>
            <Text style={s.breakdownLabel}>Composting{'\n'}Rate</Text>
          </View>
          <View style={s.breakdownItem}>
            <Text style={s.breakdownValue}>{DEMO_SCORE.wastePerPerson}</Text>
            <Text style={s.breakdownLabel}>kg/week{'\n'}per person</Text>
          </View>
        </View>
        <Text style={[s.breakdownLabel, { textAlign: 'center', marginTop: 12 }]}>Community rank: #{DEMO_SCORE.communityRank}</Text>
      </View>

      {/* Community Stats */}
      <View style={s.communityCard}>
        <Text style={s.communityTitle}>Community Waste Stats</Text>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Diversion Rate</Text>
          <Text style={s.communityStatValue}>{DEMO_COMMUNITY_STATS.diversionRate}%</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Landfill Avoided</Text>
          <Text style={s.communityStatValue}>{DEMO_COMMUNITY_STATS.landfillAvoidedKg.toLocaleString()} kg</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Total Recycled</Text>
          <Text style={s.communityStatValue}>{DEMO_COMMUNITY_STATS.totalRecycledKg.toLocaleString()} kg</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Total Composted</Text>
          <Text style={s.communityStatValue}>{DEMO_COMMUNITY_STATS.totalCompostedKg.toLocaleString()} kg</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Active Households</Text>
          <Text style={s.communityStatValue}>{DEMO_COMMUNITY_STATS.activeHouseholds}</Text>
        </View>
        <View style={s.communityStatRow}>
          <Text style={s.communityStatLabel}>Monthly Improvement</Text>
          <Text style={[s.communityStatValue, { color: t.accent.green }]}>+{DEMO_COMMUNITY_STATS.monthlyTrend}%</Text>
        </View>
      </View>

      {/* Collection Schedule */}
      <Text style={s.sectionTitle}>Collection Schedule</Text>
      {DEMO_SCHEDULE.map((sched) => (
        <View key={sched.area} style={s.scheduleCard}>
          <Text style={s.scheduleArea}>{sched.area}</Text>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleType}>Recycling</Text>
            <Text style={s.scheduleDay}>{sched.recycling}</Text>
          </View>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleType}>Compost</Text>
            <Text style={s.scheduleDay}>{sched.compost}</Text>
          </View>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleType}>General</Text>
            <Text style={s.scheduleDay}>{sched.general}</Text>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Guide Tab ───

  const renderGuide = () => (
    <>
      <Text style={s.sectionTitle}>Recycling Guide</Text>
      {DEMO_CATEGORIES.map((cat) => {
        const expanded = expandedCategory === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={s.categoryCard}
            onPress={() => setExpandedCategory(expanded ? null : cat.id)}
            activeOpacity={0.7}
          >
            <View style={s.categoryHeader}>
              <View style={[s.categoryIcon, { backgroundColor: cat.color }]}>
                <Text style={s.categoryIconText}>{cat.icon}</Text>
              </View>
              <Text style={s.categoryName}>{cat.name}</Text>
              <Text style={s.categoryExpand}>{expanded ? '-' : '+'}</Text>
            </View>
            {expanded && (
              <View style={s.categoryItems}>
                {cat.items.map((item, idx) => (
                  <Text key={idx} style={s.categoryItem}>{'  \u2022  '}{item}</Text>
                ))}
                <Text style={s.categoryTip}>{cat.tips}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );

  // ─── Compost Tab ───

  const renderCompost = () => (
    <>
      <Text style={s.sectionTitle}>Community Compost Sites</Text>
      {DEMO_COMPOST_SITES.map((site) => {
        const capColor = site.capacityPercent > 75 ? '#FF3B30' : site.capacityPercent > 50 ? t.accent.orange : t.accent.green;
        return (
          <View key={site.id} style={s.compostCard}>
            <Text style={s.compostName}>{site.name}</Text>
            <Text style={s.compostLocation}>{site.location}</Text>
            <Text style={s.compostMeta}>Hours: {site.hours}</Text>
            <View style={s.capacityBar}>
              <View style={[s.capacityFill, { width: `${site.capacityPercent}%`, backgroundColor: capColor }]} />
            </View>
            <Text style={s.capacityText}>{site.capacityPercent}% capacity</Text>
            <View style={s.acceptsTags}>
              {site.acceptsFood && (
                <View style={[s.acceptTag, { backgroundColor: t.accent.green + '20' }]}>
                  <Text style={[s.acceptTagText, { color: t.accent.green }]}>Food Scraps</Text>
                </View>
              )}
              {site.acceptsYard && (
                <View style={[s.acceptTag, { backgroundColor: t.accent.blue + '20' }]}>
                  <Text style={[s.acceptTagText, { color: t.accent.blue }]}>Yard Waste</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* How to Contribute */}
      <Text style={s.sectionTitle}>How to Contribute</Text>
      <View style={s.card}>
        <Text style={[s.compostMeta, { color: t.text.primary, fontSize: 13, lineHeight: 20, marginBottom: 0 }]}>
          1. Collect food scraps in a countertop bin{'\n'}
          2. Separate yard waste from food waste{'\n'}
          3. Drop off at your nearest compost site during open hours{'\n'}
          4. No meat, dairy, or oils in food scraps{'\n'}
          5. Yard waste: leaves, grass, small branches only{'\n'}
          6. Community composting reduces landfill methane emissions
        </Text>
      </View>
    </>
  );

  // ─── Upcycle Tab ───

  const renderUpcycle = () => (
    <>
      <Text style={s.sectionTitle}>Upcycling Marketplace</Text>
      {DEMO_UPCYCLE.map((item) => {
        const condColor = item.condition === 'Excellent' ? t.accent.green : item.condition === 'Good' ? t.accent.blue : t.accent.orange;
        return (
          <View key={item.id} style={s.upcycleCard}>
            <Text style={s.upcycleTitle}>{item.title}</Text>
            <Text style={s.upcycleDesc}>{item.description}</Text>
            <Text style={s.upcycleMeta}>
              Posted by {item.postedBy === 'you' ? 'You' : item.postedBy.split('...')[1] || item.postedBy} | {item.date}
            </Text>
            <View style={s.upcycleFooter}>
              <View style={[s.conditionBadge, { backgroundColor: condColor + '20' }]}>
                <Text style={[s.conditionText, { color: condColor }]}>{item.condition}</Text>
              </View>
              {item.claimed ? (
                <View style={[s.claimBtn, { backgroundColor: t.text.muted }]}>
                  <Text style={s.claimBtnText}>Claimed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.claimBtn, { backgroundColor: t.accent.green }]}
                  onPress={() => handleClaimItem(item)}
                >
                  <Text style={s.claimBtnText}>Claim</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={s.postBtn} onPress={handlePostUpcycle}>
        <Text style={s.postBtnText}>Post an Item</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Waste Management</Text>
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
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'guide' && renderGuide()}
        {tab === 'compost' && renderCompost()}
        {tab === 'upcycle' && renderUpcycle()}
      </ScrollView>
    </SafeAreaView>
  );
}
