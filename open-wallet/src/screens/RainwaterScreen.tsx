/**
 * Rainwater Screen — Rainwater harvesting systems, community water collection.
 *
 * Features:
 * - Harvesting systems overview with capacity/levels
 * - DIY guide for setting up rainwater collection
 * - Rainfall data and collection statistics
 * - Demo mode with sample data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface HarvestSystem {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentLevel: number;
  type: 'barrel' | 'cistern' | 'underground';
  status: 'collecting' | 'full' | 'maintenance';
  lastCollected: string;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  cost: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RainfallData {
  month: string;
  rainfall: number;
  collected: number;
  used: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_SYSTEMS: HarvestSystem[] = [
  { id: 'h1', name: 'Community Center Cistern', location: '100 Main St', capacity: 5000, currentLevel: 3200, type: 'cistern', status: 'collecting', lastCollected: '2026-03-28' },
  { id: 'h2', name: 'School Garden Barrels', location: '789 School St', capacity: 600, currentLevel: 580, type: 'barrel', status: 'full', lastCollected: '2026-03-27' },
  { id: 'h3', name: 'Park Underground Tank', location: 'Riverside Park', capacity: 10000, currentLevel: 4500, type: 'underground', status: 'collecting', lastCollected: '2026-03-28' },
  { id: 'h4', name: 'Library Rain Barrels', location: '456 Library Ln', capacity: 400, currentLevel: 120, type: 'barrel', status: 'collecting', lastCollected: '2026-03-25' },
  { id: 'h5', name: 'Farm Co-op Cistern', location: '222 Farm Rd', capacity: 8000, currentLevel: 0, type: 'cistern', status: 'maintenance', lastCollected: 'N/A' },
];

const DEMO_GUIDE: GuideStep[] = [
  { id: 'g1', title: 'Assess Your Roof', description: 'Measure catchment area. A 1,000 sq ft roof can collect ~600 gallons per inch of rain.', cost: 'Free', difficulty: 'beginner' },
  { id: 'g2', title: 'Choose Collection Method', description: 'Rain barrels (55 gal) for small needs, cisterns (500+ gal) for larger gardens or community use.', cost: '$50-500', difficulty: 'beginner' },
  { id: 'g3', title: 'Install Gutters & Downspouts', description: 'Direct water from roof to collection point. Use first-flush diverters to discard initial dirty water.', cost: '$100-300', difficulty: 'intermediate' },
  { id: 'g4', title: 'Set Up Filtration', description: 'Install mesh screens for debris. Add sediment filter for garden use. For potable use, add UV + carbon filters.', cost: '$50-500', difficulty: 'intermediate' },
  { id: 'g5', title: 'Distribution System', description: 'Gravity-fed for garden irrigation. Add pump for pressurized use. Connect to drip irrigation for efficiency.', cost: '$100-400', difficulty: 'advanced' },
  { id: 'g6', title: 'Maintenance Schedule', description: 'Clean gutters quarterly. Check screens monthly. Flush filters biannually. Test water quality annually.', cost: '$20/year', difficulty: 'beginner' },
];

const DEMO_RAINFALL: RainfallData[] = [
  { month: 'Oct 2025', rainfall: 3.2, collected: 1920, used: 1800 },
  { month: 'Nov 2025', rainfall: 4.1, collected: 2460, used: 1200 },
  { month: 'Dec 2025', rainfall: 5.8, collected: 3480, used: 800 },
  { month: 'Jan 2026', rainfall: 6.2, collected: 3720, used: 600 },
  { month: 'Feb 2026', rainfall: 4.5, collected: 2700, used: 1100 },
  { month: 'Mar 2026', rainfall: 3.8, collected: 2280, used: 2000 },
];

const STATUS_COLORS: Record<string, string> = {
  collecting: '#34C759',
  full: '#007AFF',
  maintenance: '#FF9500',
};

const DIFF_COLORS: Record<string, string> = {
  beginner: '#34C759',
  intermediate: '#FF9500',
  advanced: '#FF3B30',
};

type Tab = 'systems' | 'guide' | 'data';

export function RainwaterScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('systems');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const totalCapacity = useMemo(() => DEMO_SYSTEMS.reduce((s, h) => s + h.capacity, 0), []);
  const totalStored = useMemo(() => DEMO_SYSTEMS.reduce((s, h) => s + h.currentLevel, 0), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    sysCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    sysName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    sysMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    levelBar: { flex: 1, height: 10, borderRadius: 5, backgroundColor: t.bg.primary, marginRight: 8 },
    levelFill: { height: 10, borderRadius: 5 },
    levelText: { color: t.text.muted, fontSize: 12, width: 60, textAlign: 'right' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    guideCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    guideTitle: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    guideDesc: { color: t.text.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
    guideMeta: { color: t.text.muted, fontSize: 12, marginTop: 8 },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    diffText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    dataRow: { flexDirection: 'row', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1, alignItems: 'center' },
    dataMonth: { color: t.text.primary, fontSize: 13, fontWeight: '600', width: 80 },
    dataBar: { flex: 1, marginHorizontal: 8 },
    dataBarInner: { height: 14, borderRadius: 4, backgroundColor: t.accent.blue + '40' },
    dataValue: { color: t.text.muted, fontSize: 12, width: 60, textAlign: 'right' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'systems', label: 'Systems' },
    { key: 'guide', label: 'Guide' },
    { key: 'data', label: 'Data' },
  ];

  const renderSystems = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_SYSTEMS.length}</Text>
            <Text style={s.summaryLabel}>Systems</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.blue }]}>{totalStored.toLocaleString()}</Text>
            <Text style={s.summaryLabel}>Gal Stored</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalCapacity.toLocaleString()}</Text>
            <Text style={s.summaryLabel}>Total Capacity</Text>
          </View>
        </View>
      </View>
      {DEMO_SYSTEMS.map((sys) => {
        const pct = Math.round((sys.currentLevel / sys.capacity) * 100);
        return (
          <View key={sys.id} style={s.sysCard}>
            <Text style={s.sysName}>{sys.name}</Text>
            <Text style={s.sysMeta}>{sys.location} | {sys.type} | Last: {sys.lastCollected}</Text>
            <View style={s.levelRow}>
              <View style={s.levelBar}>
                <View style={[s.levelFill, { width: `${pct}%` as any, backgroundColor: STATUS_COLORS[sys.status] }]} />
              </View>
              <Text style={s.levelText}>{sys.currentLevel}/{sys.capacity}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[sys.status] }]}>
              <Text style={s.statusText}>{sys.status}</Text>
            </View>
          </View>
        );
      })}
    </>
  );

  const renderGuide = () => (
    <>
      <Text style={s.sectionTitle}>DIY Rainwater Harvesting Guide</Text>
      {DEMO_GUIDE.map((step, idx) => (
        <View key={step.id} style={s.guideCard}>
          <Text style={s.guideTitle}>Step {idx + 1}: {step.title}</Text>
          <Text style={s.guideDesc}>{step.description}</Text>
          <Text style={s.guideMeta}>Est. cost: {step.cost}</Text>
          <View style={[s.diffBadge, { backgroundColor: DIFF_COLORS[step.difficulty] }]}>
            <Text style={s.diffText}>{step.difficulty.toUpperCase()}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderData = () => {
    const maxRain = Math.max(...DEMO_RAINFALL.map(d => d.rainfall));
    return (
      <>
        <Text style={s.sectionTitle}>Rainfall & Collection Data</Text>
        <View style={s.card}>
          {DEMO_RAINFALL.map((d) => (
            <View key={d.month} style={s.dataRow}>
              <Text style={s.dataMonth}>{d.month}</Text>
              <View style={s.dataBar}>
                <View style={[s.dataBarInner, { width: `${(d.rainfall / maxRain) * 100}%` as any }]} />
              </View>
              <Text style={s.dataValue}>{d.rainfall}" | {d.collected}g</Text>
            </View>
          ))}
        </View>
        <View style={s.card}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{DEMO_RAINFALL.reduce((s, d) => s + d.rainfall, 0).toFixed(1)}"</Text>
              <Text style={s.summaryLabel}>Total Rainfall</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: t.accent.blue }]}>{DEMO_RAINFALL.reduce((s, d) => s + d.collected, 0).toLocaleString()}</Text>
              <Text style={s.summaryLabel}>Gal Collected</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_RAINFALL.reduce((s, d) => s + d.used, 0).toLocaleString()}</Text>
              <Text style={s.summaryLabel}>Gal Used</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Rainwater</Text>
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
        {tab === 'systems' && renderSystems()}
        {tab === 'guide' && renderGuide()}
        {tab === 'data' && renderData()}
      </ScrollView>
    </SafeAreaView>
  );
}
