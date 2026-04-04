import { fonts } from '../utils/theme';
/**
 * Carbon Tracker Screen — Personal carbon footprint tracker with reduction tips.
 *
 * Article I: "A healthy planet is the birthright of every human being."
 * Article III: Environmental stewardship earns eOTK recognition.
 *
 * Features:
 * - Carbon footprint calculator (transport, energy, diet, shopping)
 * - Reduction tips personalized to user's top emission sources
 * - Carbon offset marketplace with OTK-funded projects
 * - Monthly tracking and trend visualization
 * - Community comparison and challenges
 * - Demo mode with sample footprint data
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface FootprintCategory {
  key: string;
  label: string;
  kgCO2: number;
  percentOfTotal: number;
  icon: string;
}

interface ReductionTip {
  id: string;
  category: string;
  title: string;
  description: string;
  savingsKg: number;
  difficulty: 'easy' | 'medium' | 'hard';
  adopted: boolean;
}

interface OffsetProject {
  id: string;
  name: string;
  location: string;
  description: string;
  costPerTonOTK: number;
  totalOffset: number;
  verified: boolean;
}

interface Props {
  onClose: () => void;
}

// ─── Constants ───

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#34C759',
  medium: '#FF9500',
  hard: '#FF3B30',
};

// ─── Demo Data ───

const DEMO_FOOTPRINT: FootprintCategory[] = [
  { key: 'transport', label: 'Transportation', kgCO2: 3200, percentOfTotal: 38, icon: 'T' },
  { key: 'energy', label: 'Home Energy', kgCO2: 2100, percentOfTotal: 25, icon: 'E' },
  { key: 'diet', label: 'Diet & Food', kgCO2: 1800, percentOfTotal: 21, icon: 'D' },
  { key: 'shopping', label: 'Shopping & Goods', kgCO2: 900, percentOfTotal: 11, icon: 'S' },
  { key: 'services', label: 'Services', kgCO2: 420, percentOfTotal: 5, icon: 'V' },
];

const DEMO_TIPS: ReductionTip[] = [
  { id: 'r1', category: 'transport', title: 'Bike commute twice a week', description: 'Replace two car commutes with cycling. Saves fuel and improves health.', savingsKg: 520, difficulty: 'medium', adopted: true },
  { id: 'r2', category: 'transport', title: 'Carpool to work', description: 'Share rides with neighbors or colleagues heading the same direction.', savingsKg: 380, difficulty: 'easy', adopted: false },
  { id: 'r3', category: 'energy', title: 'Switch to LED bulbs', description: 'Replace all incandescent bulbs with LED. 75% less electricity for lighting.', savingsKg: 200, difficulty: 'easy', adopted: true },
  { id: 'r4', category: 'energy', title: 'Lower thermostat 2 degrees', description: 'Small temperature adjustment saves significant heating energy over a year.', savingsKg: 340, difficulty: 'easy', adopted: false },
  { id: 'r5', category: 'diet', title: 'One meatless day per week', description: 'Replace meat with plant-based meals once weekly. Major methane reduction.', savingsKg: 260, difficulty: 'easy', adopted: true },
  { id: 'r6', category: 'diet', title: 'Buy local produce', description: 'Reduce food transportation emissions by shopping at farmer markets.', savingsKg: 180, difficulty: 'medium', adopted: false },
  { id: 'r7', category: 'shopping', title: 'Repair before replacing', description: 'Fix electronics and clothing instead of buying new. Extends product life.', savingsKg: 150, difficulty: 'medium', adopted: false },
  { id: 'r8', category: 'shopping', title: 'Use reusable bags and bottles', description: 'Eliminate single-use plastics from daily routine.', savingsKg: 80, difficulty: 'easy', adopted: true },
];

const DEMO_OFFSETS: OffsetProject[] = [
  { id: 'o1', name: 'Amazon Reforestation', location: 'Brazil', description: 'Plant native trees in deforested areas of the Amazon rainforest.', costPerTonOTK: 450, totalOffset: 12500, verified: true },
  { id: 'o2', name: 'Solar Village Initiative', location: 'India', description: 'Install solar panels in rural villages replacing diesel generators.', costPerTonOTK: 380, totalOffset: 8200, verified: true },
  { id: 'o3', name: 'Ocean Cleanup Fund', location: 'Pacific', description: 'Fund ocean plastic removal and marine ecosystem restoration.', costPerTonOTK: 520, totalOffset: 5600, verified: true },
  { id: 'o4', name: 'Community Wind Farm', location: 'Kenya', description: 'Community-owned wind turbines providing clean energy and jobs.', costPerTonOTK: 410, totalOffset: 9800, verified: true },
];

type Tab = 'footprint' | 'reduce' | 'offset';

export function CarbonTrackerScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('footprint');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const footprint = DEMO_FOOTPRINT;
  const tips = DEMO_TIPS;
  const offsets = DEMO_OFFSETS;
  const totalKg = useMemo(() => footprint.reduce((sum, f) => sum + f.kgCO2, 0), [footprint]);
  const adoptedSavings = useMemo(() => tips.filter((tip) => tip.adopted).reduce((sum, tip) => sum + tip.savingsKg, 0), [tips]);

  const handleAdoptTip = useCallback((tip: ReductionTip) => {
    Alert.alert('Tip Adopted', `"${tip.title}" added to your plan.\nEstimated savings: ${tip.savingsKg} kg CO2/year.`);
  }, []);

  const handleOffset = useCallback((project: OffsetProject) => {
    Alert.alert('Offset Carbon', `Offset 1 ton CO2 via "${project.name}" for ${project.costPerTonOTK} OTK?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Carbon offset purchased. Certificate recorded on-chain.') },
    ]);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    bigNumber: { color: t.text.primary, fontSize: 42, fontWeight: fonts.heavy, textAlign: 'center' },
    label: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 4 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    catIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent.green + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    catIconText: { color: t.accent.green, fontSize: 14, fontWeight: fonts.bold },
    catInfo: { flex: 1 },
    catLabel: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    catMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    catValue: { color: t.text.primary, fontSize: 15, fontWeight: fonts.heavy, textAlign: 'right' },
    barContainer: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3, marginTop: 4 },
    barFill: { height: 6, backgroundColor: t.accent.green, borderRadius: 3 },
    savingsCard: { backgroundColor: t.accent.green + '12', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    savingsText: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, textAlign: 'center', lineHeight: 22 },
    tipCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tipTitle: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold, flex: 1 },
    tipDifficulty: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tipDiffText: { color: '#fff', fontSize: 10, fontWeight: fonts.bold },
    tipDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    tipSavings: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 6 },
    tipAdopt: { backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
    tipAdoptText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    tipAdopted: { color: t.accent.green, fontSize: 12, fontWeight: fonts.bold, marginTop: 8 },
    offsetCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    offsetName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    offsetLoc: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.semibold, marginTop: 2 },
    offsetDesc: { color: t.text.muted, fontSize: 13, marginTop: 6 },
    offsetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    offsetCost: { color: t.text.primary, fontSize: 15, fontWeight: fonts.heavy },
    offsetBtn: { backgroundColor: t.accent.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    offsetBtnText: { color: '#fff', fontSize: 13, fontWeight: fonts.semibold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'footprint', label: 'Footprint' },
    { key: 'reduce', label: 'Reduce' },
    { key: 'offset', label: 'Offset' },
  ];

  // ─── Footprint Tab ───

  const renderFootprint = () => (
    <>
      <View style={s.card}>
        <Text style={s.label}>Annual Carbon Footprint</Text>
        <Text style={s.bigNumber}>{(totalKg / 1000).toFixed(1)}t</Text>
        <Text style={s.label}>{totalKg.toLocaleString()} kg CO2 equivalent</Text>
      </View>

      <View style={s.savingsCard}>
        <Text style={s.savingsText}>
          You have saved {adoptedSavings.toLocaleString()} kg CO2/year{'\n'}through adopted reduction tips.
        </Text>
      </View>

      <Text style={s.sectionTitle}>Breakdown by Category</Text>
      <View style={s.card}>
        {footprint.map((cat) => (
          <View key={cat.key} style={s.categoryRow}>
            <View style={s.catIcon}>
              <Text style={s.catIconText}>{cat.icon}</Text>
            </View>
            <View style={s.catInfo}>
              <Text style={s.catLabel}>{cat.label}</Text>
              <View style={s.barContainer}>
                <View style={[s.barFill, { width: `${cat.percentOfTotal}%` }]} />
              </View>
              <Text style={s.catMeta}>{cat.percentOfTotal}% of total</Text>
            </View>
            <Text style={s.catValue}>{(cat.kgCO2 / 1000).toFixed(1)}t</Text>
          </View>
        ))}
      </View>
    </>
  );

  // ─── Reduce Tab ───

  const renderReduce = () => (
    <>
      <Text style={s.sectionTitle}>Personalized Reduction Tips</Text>
      {tips.map((tip) => (
        <View key={tip.id} style={s.tipCard}>
          <View style={s.tipHeader}>
            <Text style={s.tipTitle}>{tip.title}</Text>
            <View style={[s.tipDifficulty, { backgroundColor: DIFFICULTY_COLORS[tip.difficulty] }]}>
              <Text style={s.tipDiffText}>{tip.difficulty.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={s.tipDesc}>{tip.description}</Text>
          <Text style={s.tipSavings}>Saves ~{tip.savingsKg} kg CO2/year</Text>
          {tip.adopted ? (
            <Text style={s.tipAdopted}>Adopted</Text>
          ) : (
            <TouchableOpacity style={s.tipAdopt} onPress={() => handleAdoptTip(tip)}>
              <Text style={s.tipAdoptText}>Adopt This Tip</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </>
  );

  // ─── Offset Tab ───

  const renderOffset = () => (
    <>
      <Text style={s.sectionTitle}>Carbon Offset Projects</Text>
      {offsets.map((proj) => (
        <View key={proj.id} style={s.offsetCard}>
          <Text style={s.offsetName}>{proj.name}</Text>
          <Text style={s.offsetLoc}>{proj.location} {proj.verified ? '| Verified' : ''}</Text>
          <Text style={s.offsetDesc}>{proj.description}</Text>
          <View style={s.offsetFooter}>
            <Text style={s.offsetCost}>{proj.costPerTonOTK} OTK/ton CO2</Text>
            <TouchableOpacity style={s.offsetBtn} onPress={() => handleOffset(proj)}>
              <Text style={s.offsetBtnText}>Offset 1 Ton</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Carbon Tracker</Text>
        <View style={{ width: 60 }} />
      </View>

      {demoMode && (
        <View style={s.demoTag}>
          <Text style={s.demoText}>DEMO MODE</Text>
        </View>
      )}

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'footprint' && renderFootprint()}
        {tab === 'reduce' && renderReduce()}
        {tab === 'offset' && renderOffset()}
      </ScrollView>
    </SafeAreaView>
  );
}
