import { fonts } from '../utils/theme';
/**
 * Tree Planting Screen — Community reforestation, tree tracking, green cover.
 *
 * Article I: "Every act of environmental stewardship strengthens the
 *  community's bond with nature and earns cOTK recognition."
 * Article III: cOTK represents community value.
 *
 * Features:
 * - My trees (trees you've planted with location, species, date, growth status)
 * - Community forest stats (total trees, species diversity, CO2 absorbed, green cover %)
 * - Plant a tree event (organized plantings with OTK rewards)
 * - Tree adoption (adopt and name a community tree, track its growth)
 * - Nursery (community seedling exchange)
 * - cOTK earned per tree planted (verified by photo hash)
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

interface PersonalTree {
  id: string;
  species: string;
  location: string;
  datePlanted: string;
  growthStatus: 'seedling' | 'sapling' | 'young' | 'mature';
  heightCm: number;
  photoHash: string;
  cotkEarned: number;
  verified: boolean;
}

interface CommunityForestStats {
  totalTrees: number;
  speciesCount: number;
  co2AbsorbedKg: number;
  greenCoverPercent: number;
  totalPlanters: number;
  totalCotkDistributed: number;
}

interface PlantingEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  treesGoal: number;
  treesPlanted: number;
  cotkRewardPerTree: number;
  spotsLeft: number;
  organizer: string;
}

interface AdoptableTree {
  id: string;
  species: string;
  location: string;
  ageDays: number;
  heightCm: number;
  adopted: boolean;
  adoptedBy: string | null;
  name: string | null;
}

interface NurserySeedling {
  id: string;
  species: string;
  quantity: number;
  offeredBy: string;
  location: string;
  available: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const GROWTH_ICONS: Record<string, string> = {
  seedling: '.',
  sapling: 'i',
  young: 'Y',
  mature: 'T',
};

const GROWTH_COLORS: Record<string, string> = {
  seedling: '#A8D5BA',
  sapling: '#6BCB77',
  young: '#34C759',
  mature: '#1B8A3E',
};

// ─── Demo Data ───

const DEMO_TREES: PersonalTree[] = [
  { id: 't1', species: 'Red Oak', location: 'Riverside Park', datePlanted: '2026-01-15', growthStatus: 'sapling', heightCm: 45, photoHash: '0xabc1...', cotkEarned: 250, verified: true },
  { id: 't2', species: 'Silver Maple', location: 'Community Garden', datePlanted: '2025-09-22', growthStatus: 'young', heightCm: 120, photoHash: '0xabc2...', cotkEarned: 250, verified: true },
  { id: 't3', species: 'Douglas Fir', location: 'Hilltop Trail', datePlanted: '2025-06-10', growthStatus: 'young', heightCm: 95, photoHash: '0xabc3...', cotkEarned: 250, verified: true },
  { id: 't4', species: 'Japanese Cherry', location: 'School Courtyard', datePlanted: '2026-03-01', growthStatus: 'seedling', heightCm: 18, photoHash: '0xabc4...', cotkEarned: 250, verified: true },
  { id: 't5', species: 'White Pine', location: 'Memorial Lane', datePlanted: '2025-04-20', growthStatus: 'sapling', heightCm: 60, photoHash: '0xabc5...', cotkEarned: 250, verified: true },
  { id: 't6', species: 'Honey Locust', location: 'Riverside Park', datePlanted: '2025-11-08', growthStatus: 'sapling', heightCm: 52, photoHash: '0xabc6...', cotkEarned: 250, verified: true },
  { id: 't7', species: 'Blue Spruce', location: 'North Meadow', datePlanted: '2025-03-14', growthStatus: 'young', heightCm: 110, photoHash: '0xabc7...', cotkEarned: 250, verified: true },
  { id: 't8', species: 'Tulip Poplar', location: 'Community Garden', datePlanted: '2026-02-28', growthStatus: 'seedling', heightCm: 12, photoHash: '0xabc8...', cotkEarned: 250, verified: false },
];

const DEMO_COMMUNITY_STATS: CommunityForestStats = {
  totalTrees: 12400,
  speciesCount: 87,
  co2AbsorbedKg: 248000,
  greenCoverPercent: 14.2,
  totalPlanters: 1840,
  totalCotkDistributed: 3100000,
};

const DEMO_EVENTS: PlantingEvent[] = [
  { id: 'e1', title: 'Spring Reforestation Drive', location: 'Riverside Park East', date: '2026-04-05', treesGoal: 500, treesPlanted: 312, cotkRewardPerTree: 250, spotsLeft: 45, organizer: 'Green Earth Alliance' },
  { id: 'e2', title: 'School Campus Greening', location: 'Lincoln Elementary', date: '2026-04-12', treesGoal: 100, treesPlanted: 0, cotkRewardPerTree: 300, spotsLeft: 60, organizer: 'PTA Green Committee' },
];

const DEMO_ADOPTABLE: AdoptableTree[] = [
  { id: 'a1', species: 'Giant Sequoia', location: 'Central Plaza', ageDays: 730, heightCm: 280, adopted: false, adoptedBy: null, name: null },
  { id: 'a2', species: 'Weeping Willow', location: 'Lake Shore', ageDays: 365, heightCm: 190, adopted: true, adoptedBy: 'openchain1abc...sam', name: 'Willow the Wise' },
  { id: 'a3', species: 'Ginkgo Biloba', location: 'Heritage Walk', ageDays: 1095, heightCm: 420, adopted: false, adoptedBy: null, name: null },
  { id: 'a4', species: 'Magnolia', location: 'Memorial Garden', ageDays: 180, heightCm: 85, adopted: false, adoptedBy: null, name: null },
];

const DEMO_NURSERY: NurserySeedling[] = [
  { id: 'n1', species: 'Red Oak', quantity: 12, offeredBy: 'openchain1abc...gardener_lee', location: 'Community Garden Shed', available: true },
  { id: 'n2', species: 'Lavender', quantity: 30, offeredBy: 'openchain1def...flora_nina', location: 'North Side Nursery', available: true },
  { id: 'n3', species: 'Apple (Honeycrisp)', quantity: 5, offeredBy: 'openchain1ghi...orchard_tom', location: 'Farmers Market Booth 7', available: true },
  { id: 'n4', species: 'Japanese Maple', quantity: 8, offeredBy: 'openchain1jkl...bonsai_yuki', location: 'Heritage Walk Kiosk', available: false },
  { id: 'n5', species: 'Sunflower', quantity: 50, offeredBy: 'openchain1mno...sunny_ava', location: 'School Garden Plot', available: true },
];

type Tab = 'my-trees' | 'community' | 'plant' | 'nursery';

export function TreePlantingScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('my-trees');
  const [adoptName, setAdoptName] = useState('');
  const [selectedAdopt, setSelectedAdopt] = useState<string | null>(null);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const myTrees = DEMO_TREES;
  const stats = DEMO_COMMUNITY_STATS;
  const events = DEMO_EVENTS;
  const adoptable = DEMO_ADOPTABLE;
  const nursery = DEMO_NURSERY;

  const totalPersonalCotk = useMemo(() =>
    myTrees.reduce((sum, tr) => sum + tr.cotkEarned, 0),
    [myTrees],
  );

  const handleAdoptTree = useCallback((treeId: string) => {
    if (!adoptName.trim()) {
      Alert.alert('Name Required', 'Give your adopted tree a name to continue.');
      return;
    }
    Alert.alert(
      'Tree Adopted!',
      `You adopted a tree and named it "${adoptName}". Track its growth in your tree list.`,
    );
    setAdoptName('');
    setSelectedAdopt(null);
  }, [adoptName]);

  const handleClaimSeedling = useCallback((seedling: NurserySeedling) => {
    Alert.alert(
      'Seedling Claimed',
      `You claimed ${seedling.species} seedlings from ${seedling.location}. Coordinate pickup with the donor.`,
    );
  }, []);

  const handleJoinEvent = useCallback((event: PlantingEvent) => {
    Alert.alert(
      'Signed Up!',
      `You joined "${event.title}" on ${event.date}.\nPlant trees and earn ${event.cotkRewardPerTree} cOTK per tree!`,
    );
  }, []);

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
    // My Trees
    treeCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    treeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    treeSpecies: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    growthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    growthText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase' },
    treeMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    treeStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.bg.primary },
    treeStatLabel: { color: t.text.muted, fontSize: fonts.xs },
    treeStatValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    cotkValue: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    verifiedTag: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.semibold },
    pendingTag: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.semibold },
    // Community Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statBox: { width: '48%', backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 12, alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4, textAlign: 'center' },
    greenHighlight: { color: t.accent.green },
    impactCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    impactText: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    // Events
    eventCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    eventTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    eventMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    progressBar: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 10 },
    progressFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    progressText: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    rewardText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    joinBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    joinBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Adoption
    adoptCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    adoptSpecies: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    adoptMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    adoptedBadge: { backgroundColor: t.text.muted + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    adoptedText: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold },
    adoptInput: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 12, color: t.text.primary, fontSize: fonts.md, marginTop: 10 },
    adoptBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    adoptBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    // Nursery
    seedlingCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    seedlingSpecies: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    seedlingMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    seedlingQty: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 4 },
    claimBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    claimBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    unavailableText: { color: t.text.muted, fontSize: fonts.sm, fontStyle: 'italic', marginTop: 8 },
    // Misc
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, marginHorizontal: 20 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  // ─── Tabs ───

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'my-trees', label: 'My Trees' },
    { key: 'community', label: 'Community' },
    { key: 'plant', label: 'Plant' },
    { key: 'nursery', label: 'Nursery' },
  ];

  // ─── My Trees Tab ───

  const renderMyTrees = () => (
    <>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{myTrees.length}</Text>
          <Text style={s.summaryLabel}>Trees Planted</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, s.greenHighlight]}>{totalPersonalCotk.toLocaleString()}</Text>
          <Text style={s.summaryLabel}>cOTK Earned</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{myTrees.filter(tr => tr.verified).length}</Text>
          <Text style={s.summaryLabel}>Verified</Text>
        </View>
      </View>

      {myTrees.map((tree) => (
        <View key={tree.id} style={s.treeCard}>
          <View style={s.treeHeader}>
            <Text style={s.treeSpecies}>{tree.species}</Text>
            <View style={[s.growthBadge, { backgroundColor: GROWTH_COLORS[tree.growthStatus] }]}>
              <Text style={s.growthText}>{tree.growthStatus}</Text>
            </View>
          </View>
          <Text style={s.treeMeta}>{tree.location} -- Planted {tree.datePlanted}</Text>
          <View style={s.treeStats}>
            <View>
              <Text style={s.treeStatLabel}>Height</Text>
              <Text style={s.treeStatValue}>{tree.heightCm} cm</Text>
            </View>
            <View>
              <Text style={s.treeStatLabel}>cOTK</Text>
              <Text style={s.cotkValue}>{tree.cotkEarned}</Text>
            </View>
            <View>
              <Text style={s.treeStatLabel}>Status</Text>
              <Text style={tree.verified ? s.verifiedTag : s.pendingTag}>
                {tree.verified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  // ─── Community Tab ───

  const renderCommunity = () => (
    <>
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Community Forest</Text>
        <View style={s.statsGrid}>
          <View style={s.statBox}>
            <Text style={[s.statValue, s.greenHighlight]}>{stats.totalTrees.toLocaleString()}</Text>
            <Text style={s.statLabel}>Total Trees</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.speciesCount}</Text>
            <Text style={s.statLabel}>Species Diversity</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, s.greenHighlight]}>{(stats.co2AbsorbedKg / 1000).toFixed(0)}t</Text>
            <Text style={s.statLabel}>CO2 Absorbed</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.greenCoverPercent}%</Text>
            <Text style={s.statLabel}>Green Cover</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{stats.totalPlanters.toLocaleString()}</Text>
            <Text style={s.statLabel}>Total Planters</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, s.greenHighlight]}>{(stats.totalCotkDistributed / 1000).toFixed(0)}k</Text>
            <Text style={s.statLabel}>cOTK Distributed</Text>
          </View>
        </View>
      </View>

      <View style={s.impactCard}>
        <Text style={s.impactText}>
          Our community has planted {stats.totalTrees.toLocaleString()} trees across {stats.speciesCount} species.{'\n'}
          Together we have absorbed {(stats.co2AbsorbedKg / 1000).toFixed(0)} tonnes of CO2.{'\n'}
          Every tree counts. Keep planting.
        </Text>
      </View>

      {/* Tree Adoption */}
      <Text style={s.sectionTitle}>Adopt a Tree</Text>
      {adoptable.map((tree) => (
        <View key={tree.id} style={s.adoptCard}>
          <Text style={s.adoptSpecies}>{tree.species}</Text>
          <Text style={s.adoptMeta}>
            {tree.location} -- Age: {Math.floor(tree.ageDays / 365)}y {tree.ageDays % 365}d -- {tree.heightCm} cm
          </Text>
          {tree.adopted ? (
            <View style={s.adoptedBadge}>
              <Text style={s.adoptedText}>Adopted: "{tree.name}"</Text>
            </View>
          ) : (
            <>
              {selectedAdopt === tree.id ? (
                <>
                  <TextInput
                    style={s.adoptInput}
                    placeholder="Name your tree..."
                    placeholderTextColor={t.text.muted}
                    value={adoptName}
                    onChangeText={setAdoptName}
                  />
                  <TouchableOpacity style={s.adoptBtn} onPress={() => handleAdoptTree(tree.id)}>
                    <Text style={s.adoptBtnText}>Confirm Adoption</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[s.adoptBtn, { backgroundColor: t.accent.blue }]}
                  onPress={() => setSelectedAdopt(tree.id)}
                >
                  <Text style={s.adoptBtnText}>Adopt This Tree</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ))}
    </>
  );

  // ─── Plant Tab ───

  const renderPlant = () => (
    <>
      <View style={s.impactCard}>
        <Text style={s.impactText}>
          Join organized planting events.{'\n'}
          Plant a tree, snap a photo, earn cOTK.{'\n'}
          Verified via photo hash on Open Chain.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Upcoming Events</Text>
      {events.map((event) => {
        const progress = event.treesGoal > 0 ? event.treesPlanted / event.treesGoal : 0;
        return (
          <View key={event.id} style={s.eventCard}>
            <Text style={s.eventTitle}>{event.title}</Text>
            <Text style={s.eventMeta}>
              {event.location} -- {event.date}{'\n'}
              Organized by {event.organizer}
            </Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>
              {event.treesPlanted} / {event.treesGoal} trees planted ({Math.round(progress * 100)}%)
            </Text>
            <View style={s.eventFooter}>
              <Text style={s.rewardText}>{event.cotkRewardPerTree} cOTK/tree</Text>
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoinEvent(event)}>
                <Text style={s.joinBtnText}>{event.spotsLeft} spots -- Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </>
  );

  // ─── Nursery Tab ───

  const renderNursery = () => (
    <>
      <View style={s.impactCard}>
        <Text style={s.impactText}>
          Community seedling exchange.{'\n'}
          Share what you grow, plant what you find.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Available Seedlings</Text>
      {nursery.map((seed) => (
        <View key={seed.id} style={s.seedlingCard}>
          <Text style={s.seedlingSpecies}>{seed.species}</Text>
          <Text style={s.seedlingMeta}>
            Offered by {seed.offeredBy.slice(0, 20)}...{'\n'}
            Pickup: {seed.location}
          </Text>
          <Text style={s.seedlingQty}>Quantity: {seed.quantity}</Text>
          {seed.available ? (
            <TouchableOpacity style={s.claimBtn} onPress={() => handleClaimSeedling(seed)}>
              <Text style={s.claimBtnText}>Claim Seedlings</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.unavailableText}>Currently unavailable</Text>
          )}
        </View>
      ))}
    </>
  );

  // ─── Render ───

  const renderContent = () => {
    switch (tab) {
      case 'my-trees': return renderMyTrees();
      case 'community': return renderCommunity();
      case 'plant': return renderPlant();
      case 'nursery': return renderNursery();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Tree Planting</Text>
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
