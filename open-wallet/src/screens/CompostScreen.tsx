import { fonts } from '../utils/theme';
/**
 * Compost Screen — Community composting network, collection points, soil output.
 *
 * Features:
 * - Composting sites with capacity and status
 * - Contribute organic waste to nearby sites
 * - Track soil output and distribution
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

interface CompostSite {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentFill: number;
  acceptingTypes: string[];
  status: 'active' | 'full' | 'curing';
  nextPickup: string;
}

interface SoilOutput {
  id: string;
  site: string;
  batchDate: string;
  volume: number;
  quality: 'premium' | 'standard' | 'compost-tea';
  distributed: number;
  available: number;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_SITES: CompostSite[] = [
  { id: 's1', name: 'Riverside Community Bin', location: '123 River Rd', capacity: 500, currentFill: 320, acceptingTypes: ['food scraps', 'yard waste', 'paper'], status: 'active', nextPickup: '2026-03-31' },
  { id: 's2', name: 'Park Avenue Drop-off', location: '456 Park Ave', capacity: 300, currentFill: 298, acceptingTypes: ['food scraps', 'yard waste'], status: 'full', nextPickup: '2026-03-30' },
  { id: 's3', name: 'Green School Garden', location: '789 School St', capacity: 200, currentFill: 45, acceptingTypes: ['food scraps', 'leaves'], status: 'active', nextPickup: '2026-04-02' },
  { id: 's4', name: 'Downtown Worm Farm', location: '101 Main St', capacity: 150, currentFill: 150, acceptingTypes: ['food scraps only'], status: 'curing', nextPickup: 'N/A (curing)' },
  { id: 's5', name: 'Hillside Composting Hub', location: '222 Hill Dr', capacity: 800, currentFill: 410, acceptingTypes: ['food scraps', 'yard waste', 'cardboard'], status: 'active', nextPickup: '2026-04-01' },
];

const DEMO_OUTPUT: SoilOutput[] = [
  { id: 'o1', site: 'Riverside Community Bin', batchDate: '2026-03-15', volume: 120, quality: 'premium', distributed: 85, available: 35 },
  { id: 'o2', site: 'Downtown Worm Farm', batchDate: '2026-03-10', volume: 60, quality: 'compost-tea', distributed: 45, available: 15 },
  { id: 'o3', site: 'Hillside Composting Hub', batchDate: '2026-03-01', volume: 200, quality: 'standard', distributed: 180, available: 20 },
  { id: 'o4', site: 'Green School Garden', batchDate: '2026-02-20', volume: 40, quality: 'premium', distributed: 40, available: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  active: '#34C759',
  full: '#FF9500',
  curing: '#007AFF',
};

const QUALITY_COLORS: Record<string, string> = {
  premium: '#34C759',
  standard: '#FF9500',
  'compost-tea': '#007AFF',
};

type Tab = 'sites' | 'contribute' | 'output';

export function CompostScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('sites');
  const [selectedSite, setSelectedSite] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [wasteWeight, setWasteWeight] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleContribute = useCallback(() => {
    if (!selectedSite) { Alert.alert('Required', 'Select a composting site.'); return; }
    const weight = parseFloat(wasteWeight);
    if (!weight || weight <= 0) { Alert.alert('Required', 'Enter a valid weight.'); return; }
    if (!wasteType) { Alert.alert('Required', 'Select waste type.'); return; }
    const cotk = Math.round(weight * 5);
    Alert.alert('Contribution Logged', `${weight} lbs of ${wasteType} logged at ${selectedSite}.\n\nEstimated cOTK: +${cotk}`);
    setSelectedSite(''); setWasteType(''); setWasteWeight('');
  }, [selectedSite, wasteType, wasteWeight]);

  const WASTE_TYPES = ['food scraps', 'yard waste', 'paper', 'cardboard', 'leaves'];

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
    siteCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    siteName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    siteMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    fillRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    fillBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: t.bg.primary, marginRight: 8 },
    fillInner: { height: 8, borderRadius: 4 },
    fillText: { color: t.text.muted, fontSize: 11, width: 45, textAlign: 'right' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold, textTransform: 'uppercase' },
    typeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    typeTag: { backgroundColor: t.bg.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    typeTagText: { color: t.text.muted, fontSize: 11 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    chipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    chipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    chipTextSelected: { color: t.accent.green },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    labelText: { color: t.text.muted, fontSize: 12, marginBottom: 6, fontWeight: fonts.semibold },
    outputCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    outputSite: { color: t.text.primary, fontSize: 14, fontWeight: fonts.bold },
    outputMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    outputVolume: { color: t.accent.green, fontSize: 16, fontWeight: fonts.heavy, marginTop: 6 },
    qualityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
    qualityText: { color: '#fff', fontSize: 11, fontWeight: fonts.semibold },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'sites', label: 'Sites' },
    { key: 'contribute', label: 'Contribute' },
    { key: 'output', label: 'Output' },
  ];

  const renderSites = () => (
    <>
      <Text style={s.sectionTitle}>Composting Sites</Text>
      {DEMO_SITES.map((site) => {
        const fillPct = Math.round((site.currentFill / site.capacity) * 100);
        const fillColor = fillPct >= 90 ? '#FF3B30' : fillPct >= 60 ? '#FF9500' : '#34C759';
        return (
          <View key={site.id} style={s.siteCard}>
            <Text style={s.siteName}>{site.name}</Text>
            <Text style={s.siteMeta}>{site.location} | Next pickup: {site.nextPickup}</Text>
            <View style={s.fillRow}>
              <View style={s.fillBar}>
                <View style={[s.fillInner, { width: `${fillPct}%` as any, backgroundColor: fillColor }]} />
              </View>
              <Text style={s.fillText}>{fillPct}%</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[site.status] }]}>
              <Text style={s.statusText}>{site.status}</Text>
            </View>
            <View style={s.typeTags}>
              {site.acceptingTypes.map((type) => (
                <View key={type} style={s.typeTag}><Text style={s.typeTagText}>{type}</Text></View>
              ))}
            </View>
          </View>
        );
      })}
    </>
  );

  const renderContribute = () => {
    const activeSites = DEMO_SITES.filter(s => s.status === 'active');
    return (
      <View style={s.card}>
        <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Log Contribution</Text>
        <Text style={s.labelText}>Select Site</Text>
        <View style={s.chipGrid}>
          {activeSites.map((site) => (
            <TouchableOpacity key={site.id} style={[s.chip, selectedSite === site.name && s.chipSelected]} onPress={() => setSelectedSite(site.name)}>
              <Text style={[s.chipText, selectedSite === site.name && s.chipTextSelected]}>{site.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.labelText}>Waste Type</Text>
        <View style={s.chipGrid}>
          {WASTE_TYPES.map((wt) => (
            <TouchableOpacity key={wt} style={[s.chip, wasteType === wt && s.chipSelected]} onPress={() => setWasteType(wt)}>
              <Text style={[s.chipText, wasteType === wt && s.chipTextSelected]}>{wt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={s.input} placeholder="Weight (lbs)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={wasteWeight} onChangeText={setWasteWeight} />
        <TouchableOpacity style={s.submitBtn} onPress={handleContribute}>
          <Text style={s.submitText}>Log Contribution</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOutput = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_OUTPUT.reduce((sum, o) => sum + o.volume, 0)}</Text>
            <Text style={s.summaryLabel}>Total Gallons</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_OUTPUT.reduce((sum, o) => sum + o.available, 0)}</Text>
            <Text style={s.summaryLabel}>Available</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{DEMO_OUTPUT.length}</Text>
            <Text style={s.summaryLabel}>Batches</Text>
          </View>
        </View>
      </View>
      {DEMO_OUTPUT.map((o) => (
        <View key={o.id} style={s.outputCard}>
          <Text style={s.outputSite}>{o.site}</Text>
          <Text style={s.outputMeta}>Batch: {o.batchDate} | Distributed: {o.distributed} gal</Text>
          <Text style={s.outputVolume}>{o.available} gal available</Text>
          <View style={[s.qualityBadge, { backgroundColor: QUALITY_COLORS[o.quality] }]}>
            <Text style={s.qualityText}>{o.quality.toUpperCase()}</Text>
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
        <Text style={s.title}>Composting</Text>
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
        {tab === 'sites' && renderSites()}
        {tab === 'contribute' && renderContribute()}
        {tab === 'output' && renderOutput()}
      </ScrollView>
    </SafeAreaView>
  );
}
