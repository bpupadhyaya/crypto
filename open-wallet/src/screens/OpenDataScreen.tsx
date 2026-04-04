import { fonts } from '../utils/theme';
/**
 * Open Data Screen — Community open data portal (anonymized aggregate data).
 *
 * Features:
 * - Browse community datasets
 * - Visualize data with simple charts
 * - Contribute anonymized data
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

interface Dataset {
  id: string;
  name: string;
  category: string;
  records: number;
  contributors: number;
  lastUpdated: string;
  description: string;
  license: string;
}

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface DataViz {
  id: string;
  title: string;
  dataset: string;
  type: 'bar' | 'distribution';
  data: DataPoint[];
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_DATASETS: Dataset[] = [
  { id: 'd1', name: 'Community Air Quality Index', category: 'Environment', records: 45200, contributors: 128, lastUpdated: '2026-03-28', description: 'Hourly AQI readings from community sensors.', license: 'CC-BY-4.0' },
  { id: 'd2', name: 'Local Food Prices', category: 'Economy', records: 12800, contributors: 342, lastUpdated: '2026-03-27', description: 'Weekly grocery prices from 15 local markets.', license: 'CC-BY-4.0' },
  { id: 'd3', name: 'Public Transit Usage', category: 'Transport', records: 89000, contributors: 56, lastUpdated: '2026-03-28', description: 'Anonymized ridership data by route and time.', license: 'ODbL' },
  { id: 'd4', name: 'Community Health Indicators', category: 'Health', records: 5600, contributors: 890, lastUpdated: '2026-03-25', description: 'Aggregated wellness metrics (no individual data).', license: 'CC-BY-4.0' },
  { id: 'd5', name: 'Energy Consumption Patterns', category: 'Energy', records: 23400, contributors: 445, lastUpdated: '2026-03-26', description: 'Neighborhood-level energy usage trends.', license: 'CC0' },
  { id: 'd6', name: 'Volunteer Hour Logs', category: 'Community', records: 8900, contributors: 234, lastUpdated: '2026-03-28', description: 'Community service hours by category and area.', license: 'CC-BY-4.0' },
];

const DEMO_VIZZES: DataViz[] = [
  { id: 'v1', title: 'Air Quality This Week', dataset: 'Community Air Quality Index', type: 'bar', data: [
    { label: 'Mon', value: 42, color: '#34C759' }, { label: 'Tue', value: 55, color: '#FF9500' },
    { label: 'Wed', value: 38, color: '#34C759' }, { label: 'Thu', value: 61, color: '#FF9500' },
    { label: 'Fri', value: 45, color: '#34C759' }, { label: 'Sat', value: 35, color: '#34C759' },
    { label: 'Sun', value: 40, color: '#34C759' },
  ]},
  { id: 'v2', title: 'Transit Ridership by Route', dataset: 'Public Transit Usage', type: 'bar', data: [
    { label: 'Route 1', value: 12400, color: '#007AFF' }, { label: 'Route 5', value: 9800, color: '#007AFF' },
    { label: 'Route 12', value: 7200, color: '#007AFF' }, { label: 'Route 22', value: 5600, color: '#007AFF' },
    { label: 'Route 30', value: 3400, color: '#007AFF' },
  ]},
  { id: 'v3', title: 'Volunteer Hours by Category', dataset: 'Volunteer Hour Logs', type: 'bar', data: [
    { label: 'Tutoring', value: 2400, color: '#AF52DE' }, { label: 'Food Bank', value: 1800, color: '#AF52DE' },
    { label: 'Eldercare', value: 1500, color: '#AF52DE' }, { label: 'Cleanup', value: 1200, color: '#AF52DE' },
    { label: 'Mentoring', value: 900, color: '#AF52DE' },
  ]},
];

const CAT_COLORS: Record<string, string> = {
  Environment: '#34C759', Economy: '#FF9500', Transport: '#007AFF',
  Health: '#FF3B30', Energy: '#AF52DE', Community: '#FF9500',
};

type Tab = 'datasets' | 'visualize' | 'contribute';

export function OpenDataScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('datasets');
  const [contribDataset, setContribDataset] = useState('');
  const [contribData, setContribData] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleContribute = useCallback(() => {
    if (!contribDataset) { Alert.alert('Required', 'Select a dataset.'); return; }
    if (!contribData.trim()) { Alert.alert('Required', 'Enter data to contribute.'); return; }
    Alert.alert('Data Submitted', `Your anonymized data has been contributed to "${contribDataset}". Thank you!\n\n+25 cOTK earned.`);
    setContribDataset(''); setContribData('');
  }, [contribDataset, contribData]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 12, marginHorizontal: 20 },
    dsCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    dsName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    dsMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    dsDesc: { color: t.text.muted, fontSize: fonts.sm, marginTop: 6, lineHeight: 19 },
    dsStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    dsStat: { alignItems: 'center' },
    dsStatVal: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.heavy },
    dsStatLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    catText: { color: '#fff', fontSize: fonts.xs, fontWeight: fonts.semibold },
    vizCard: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    vizTitle: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, marginBottom: 12 },
    vizDataset: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 12 },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    barLabel: { color: t.text.muted, fontSize: fonts.xs, width: 60 },
    barTrack: { flex: 1, height: 16, borderRadius: 4, backgroundColor: t.bg.primary, marginHorizontal: 8 },
    barFill: { height: 16, borderRadius: 4 },
    barValue: { color: t.text.muted, fontSize: fonts.xs, width: 50, textAlign: 'right' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    chipSelected: { backgroundColor: t.accent.blue + '20', borderColor: t.accent.blue },
    chipText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    chipTextSelected: { color: t.accent.blue },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    labelText: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 6, fontWeight: fonts.semibold },
    privacyNote: { color: t.text.muted, fontSize: fonts.xs, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: fonts.xs, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'datasets', label: 'Datasets' },
    { key: 'visualize', label: 'Visualize' },
    { key: 'contribute', label: 'Contribute' },
  ];

  const renderDatasets = () => (
    <>
      <Text style={s.sectionTitle}>Community Datasets</Text>
      {DEMO_DATASETS.map((ds) => (
        <View key={ds.id} style={s.dsCard}>
          <Text style={s.dsName}>{ds.name}</Text>
          <Text style={s.dsMeta}>Updated: {ds.lastUpdated} | License: {ds.license}</Text>
          <Text style={s.dsDesc}>{ds.description}</Text>
          <View style={[s.catBadge, { backgroundColor: CAT_COLORS[ds.category] || t.text.muted }]}>
            <Text style={s.catText}>{ds.category}</Text>
          </View>
          <View style={s.dsStats}>
            <View style={s.dsStat}>
              <Text style={s.dsStatVal}>{(ds.records / 1000).toFixed(1)}K</Text>
              <Text style={s.dsStatLabel}>Records</Text>
            </View>
            <View style={s.dsStat}>
              <Text style={s.dsStatVal}>{ds.contributors}</Text>
              <Text style={s.dsStatLabel}>Contributors</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const renderVisualize = () => (
    <>
      <Text style={s.sectionTitle}>Data Visualizations</Text>
      {DEMO_VIZZES.map((viz) => {
        const maxVal = Math.max(...viz.data.map(d => d.value));
        return (
          <View key={viz.id} style={s.vizCard}>
            <Text style={s.vizTitle}>{viz.title}</Text>
            <Text style={s.vizDataset}>{viz.dataset}</Text>
            {viz.data.map((d) => (
              <View key={d.label} style={s.barRow}>
                <Text style={s.barLabel}>{d.label}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${(d.value / maxVal) * 100}%` as any, backgroundColor: d.color }]} />
                </View>
                <Text style={s.barValue}>{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </>
  );

  const renderContribute = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Contribute Data</Text>
      <Text style={s.labelText}>Select Dataset</Text>
      <View style={s.chipGrid}>
        {DEMO_DATASETS.map((ds) => (
          <TouchableOpacity key={ds.id} style={[s.chip, contribDataset === ds.name && s.chipSelected]} onPress={() => setContribDataset(ds.name)}>
            <Text style={[s.chipText, contribDataset === ds.name && s.chipTextSelected]}>{ds.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]} placeholder="Enter your data (will be anonymized)..." placeholderTextColor={t.text.muted} value={contribData} onChangeText={setContribData} multiline />
      <TouchableOpacity style={s.submitBtn} onPress={handleContribute}>
        <Text style={s.submitText}>Submit Data</Text>
      </TouchableOpacity>
      <Text style={s.privacyNote}>All contributed data is anonymized and aggregated. No individual data is ever stored or shared.</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Open Data</Text>
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
        {tab === 'datasets' && renderDatasets()}
        {tab === 'visualize' && renderVisualize()}
        {tab === 'contribute' && renderContribute()}
      </ScrollView>
    </SafeAreaView>
  );
}
