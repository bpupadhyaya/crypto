import { fonts } from '../utils/theme';
/**
 * Gas Optimize Screen — Gas fee optimization across chains.
 *
 * Shows current gas prices on all supported chains, gas history trends,
 * optimal send times, batching suggestions, and gas price alerts.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface ChainGas {
  chain: string;
  symbol: string;
  currentGwei: number;
  low: number;
  average: number;
  high: number;
  unit: string;
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

interface GasHistoryPoint {
  time: string;
  gwei: number;
}

interface OptimalTime {
  chain: string;
  bestTime: string;
  expectedGwei: number;
  savings: string;
}

interface BatchSuggestion {
  id: string;
  description: string;
  txCount: number;
  estimatedSavings: string;
  chains: string[];
}

interface GasAlert {
  id: string;
  chain: string;
  threshold: number;
  unit: string;
  enabled: boolean;
  createdAt: string;
}

type Tab = 'current' | 'history' | 'optimize' | 'alerts';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_GAS: ChainGas[] = [
  { chain: 'Bitcoin', symbol: 'BTC', currentGwei: 12, low: 8, average: 15, high: 25, unit: 'sat/vB', trend: 'falling', lastUpdated: '2 min ago' },
  { chain: 'Ethereum', symbol: 'ETH', currentGwei: 24, low: 18, average: 28, high: 45, unit: 'gwei', trend: 'rising', lastUpdated: '30 sec ago' },
  { chain: 'Solana', symbol: 'SOL', currentGwei: 0.00025, low: 0.0001, average: 0.0003, high: 0.001, unit: 'SOL', trend: 'stable', lastUpdated: '1 min ago' },
  { chain: 'Cosmos', symbol: 'ATOM', currentGwei: 0.005, low: 0.003, average: 0.006, high: 0.01, unit: 'ATOM', trend: 'falling', lastUpdated: '45 sec ago' },
  { chain: 'Open Chain', symbol: 'OTK', currentGwei: 0.001, low: 0.0005, average: 0.001, high: 0.003, unit: 'OTK', trend: 'stable', lastUpdated: '15 sec ago' },
];

const DEMO_HISTORY: GasHistoryPoint[] = [
  { time: '00:00', gwei: 20 }, { time: '02:00', gwei: 15 }, { time: '04:00', gwei: 12 },
  { time: '06:00', gwei: 18 }, { time: '08:00', gwei: 32 }, { time: '10:00', gwei: 38 },
  { time: '12:00', gwei: 35 }, { time: '14:00', gwei: 28 }, { time: '16:00', gwei: 42 },
  { time: '18:00', gwei: 45 }, { time: '20:00', gwei: 30 }, { time: '22:00', gwei: 24 },
];

const DEMO_OPTIMAL: OptimalTime[] = [
  { chain: 'Ethereum', bestTime: 'Sun 4:00 AM UTC', expectedGwei: 12, savings: '58% less than peak' },
  { chain: 'Bitcoin', bestTime: 'Sat 6:00 AM UTC', expectedGwei: 6, savings: '52% less than peak' },
  { chain: 'Solana', bestTime: 'Any time (consistently low)', expectedGwei: 0.00025, savings: 'Minimal variation' },
  { chain: 'Cosmos', bestTime: 'Tue 3:00 AM UTC', expectedGwei: 0.003, savings: '40% less than peak' },
  { chain: 'Open Chain', bestTime: 'Any time (flat fee)', expectedGwei: 0.001, savings: 'Fixed gas model' },
];

const DEMO_BATCHING: BatchSuggestion[] = [
  { id: 'b_001', description: 'Combine 3 pending token transfers into single batch', txCount: 3, estimatedSavings: '~$4.20 in gas', chains: ['Ethereum'] },
  { id: 'b_002', description: 'Consolidate 2 staking rewards claims', txCount: 2, estimatedSavings: '~$1.80 in gas', chains: ['Cosmos', 'Open Chain'] },
];

const DEMO_ALERTS: GasAlert[] = [
  { id: 'a_001', chain: 'Ethereum', threshold: 15, unit: 'gwei', enabled: true, createdAt: '2026-03-25' },
  { id: 'a_002', chain: 'Bitcoin', threshold: 8, unit: 'sat/vB', enabled: true, createdAt: '2026-03-27' },
];

// --- Component ---

export function GasOptimizeScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('current');
  const [alerts, setAlerts] = useState<GasAlert[]>(demoMode ? DEMO_ALERTS : []);
  const [newAlertChain, setNewAlertChain] = useState('Ethereum');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');
  const [historyChain, setHistoryChain] = useState('Ethereum');

  const gasData = demoMode ? DEMO_GAS : [];
  const history = demoMode ? DEMO_HISTORY : [];
  const optimal = demoMode ? DEMO_OPTIMAL : [];
  const batching = demoMode ? DEMO_BATCHING : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'current', label: 'Current' },
    { key: 'history', label: 'History' },
    { key: 'optimize', label: 'Optimize' },
    { key: 'alerts', label: 'Alerts' },
  ];

  const trendIcon = (tr: string) => tr === 'rising' ? '\u2191' : tr === 'falling' ? '\u2193' : '\u2192';
  const trendColor = (tr: string) => tr === 'rising' ? t.accent.red : tr === 'falling' ? t.accent.green : t.accent.orange;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    placeholder: { width: 50 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, gap: 6 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontWeight: fonts.bold },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    chainName: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    gasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    currentGas: { fontSize: fonts.xxl, fontWeight: fonts.heavy },
    gasUnit: { color: t.text.muted, fontSize: fonts.sm },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendText: { fontSize: fonts.md, fontWeight: fonts.bold },
    gasLevels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border },
    gasLevel: { alignItems: 'center' },
    gasLevelLabel: { color: t.text.muted, fontSize: fonts.xs },
    gasLevelValue: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 2 },
    updatedText: { color: t.text.muted, fontSize: fonts.xs, marginTop: 6 },
    sectionTitle: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, paddingHorizontal: 16, marginBottom: 10, marginTop: 8 },
    chartContainer: { marginHorizontal: 16, backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4, marginTop: 8 },
    chartBar: { flex: 1, borderRadius: 4 },
    chartLabel: { color: t.text.muted, fontSize: 8, textAlign: 'center', marginTop: 4 },
    chartChainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
    chartChainBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    chartChainBtnActive: { backgroundColor: t.accent.blue },
    chartChainText: { color: t.text.secondary, fontSize: fonts.sm },
    chartChainTextActive: { color: '#fff', fontWeight: fonts.semibold },
    optimalCard: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    optimalChain: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    optimalTime: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.semibold, marginTop: 4 },
    optimalGas: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    optimalSavings: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 4 },
    batchCard: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    batchDesc: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    batchMeta: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 4 },
    batchSavings: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 6 },
    batchBtn: { backgroundColor: t.accent.green, borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
    batchBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    alertCard: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertInfo: { flex: 1 },
    alertChain: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    alertThreshold: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 2 },
    alertDate: { color: t.text.muted, fontSize: fonts.xs, marginTop: 4 },
    toggleBtn: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3 },
    toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    newAlertCard: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginTop: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 10 },
    addAlertBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    addAlertBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    chainSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.text.secondary, fontSize: fonts.lg, fontWeight: fonts.semibold },
  }), [t]);

  const maxGwei = Math.max(...history.map((h) => h.gwei), 1);

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleAddAlert = () => {
    const threshold = parseFloat(newAlertThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert('Invalid Threshold', 'Enter a valid gas threshold.');
      return;
    }
    const chainGas = gasData.find((g) => g.chain === newAlertChain);
    const newAlert: GasAlert = {
      id: `a_${Date.now()}`,
      chain: newAlertChain,
      threshold,
      unit: chainGas?.unit || 'gwei',
      enabled: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAlerts((prev) => [...prev, newAlert]);
    setNewAlertThreshold('');
    Alert.alert('Alert Created', `You'll be notified when ${newAlertChain} gas drops below ${threshold}.`);
  };

  const handleDeleteAlert = (id: string) => {
    Alert.alert('Delete Alert', 'Remove this gas alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAlerts((prev) => prev.filter((a) => a.id !== id)) },
    ]);
  };

  const renderCurrent = () => (
    <FlatList
      data={gasData}
      keyExtractor={(g) => g.chain}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.chainName}>{item.chain}</Text>
          <View style={s.gasRow}>
            <View>
              <Text style={[s.currentGas, { color: t.text.primary }]}>{item.currentGwei}</Text>
              <Text style={s.gasUnit}>{item.unit}</Text>
            </View>
            <View style={s.trendBadge}>
              <Text style={[s.trendText, { color: trendColor(item.trend) }]}>
                {trendIcon(item.trend)} {item.trend}
              </Text>
            </View>
          </View>
          <View style={s.gasLevels}>
            <View style={s.gasLevel}>
              <Text style={s.gasLevelLabel}>Low</Text>
              <Text style={[s.gasLevelValue, { color: t.accent.green }]}>{item.low}</Text>
            </View>
            <View style={s.gasLevel}>
              <Text style={s.gasLevelLabel}>Average</Text>
              <Text style={s.gasLevelValue}>{item.average}</Text>
            </View>
            <View style={s.gasLevel}>
              <Text style={s.gasLevelLabel}>High</Text>
              <Text style={[s.gasLevelValue, { color: t.accent.red }]}>{item.high}</Text>
            </View>
          </View>
          <Text style={s.updatedText}>Updated {item.lastUpdated}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={s.empty}><Text style={s.emptyText}>No gas data available</Text></View>
      }
      contentContainerStyle={gasData.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderHistory = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.chartChainRow}>
        {gasData.map((g) => (
          <TouchableOpacity
            key={g.chain}
            style={[s.chartChainBtn, historyChain === g.chain && s.chartChainBtnActive]}
            onPress={() => setHistoryChain(g.chain)}
          >
            <Text style={[s.chartChainText, historyChain === g.chain && s.chartChainTextActive]}>{g.chain}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.sectionTitle}>{historyChain} Gas — 24h</Text>
      <View style={s.chartContainer}>
        <View style={s.chartRow}>
          {history.map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={[s.chartBar, {
                height: (h.gwei / maxGwei) * 100,
                backgroundColor: h.gwei > 35 ? t.accent.red : h.gwei > 20 ? t.accent.orange : t.accent.green,
              }]} />
              <Text style={s.chartLabel}>{h.time.slice(0, 2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderOptimize = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.sectionTitle}>Optimal Send Times</Text>
      {optimal.map((item, i) => (
        <View key={i} style={s.optimalCard}>
          <Text style={s.optimalChain}>{item.chain}</Text>
          <Text style={s.optimalTime}>{item.bestTime}</Text>
          <Text style={s.optimalGas}>Expected gas: {item.expectedGwei}</Text>
          <Text style={s.optimalSavings}>{item.savings}</Text>
        </View>
      ))}

      <Text style={s.sectionTitle}>Batching Suggestions</Text>
      {batching.map((item) => (
        <View key={item.id} style={s.batchCard}>
          <Text style={s.batchDesc}>{item.description}</Text>
          <Text style={s.batchMeta}>{item.txCount} transactions \u00B7 {item.chains.join(', ')}</Text>
          <Text style={s.batchSavings}>Save {item.estimatedSavings}</Text>
          <TouchableOpacity style={s.batchBtn} onPress={() => Alert.alert('Batch Executed', 'Transactions batched successfully.')}>
            <Text style={s.batchBtnText}>Execute Batch</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderAlerts = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.sectionTitle}>Active Alerts</Text>
      {alerts.map((item) => (
        <TouchableOpacity key={item.id} style={s.alertCard} onLongPress={() => handleDeleteAlert(item.id)}>
          <View style={s.alertInfo}>
            <Text style={s.alertChain}>{item.chain}</Text>
            <Text style={s.alertThreshold}>Notify below {item.threshold} {item.unit}</Text>
            <Text style={s.alertDate}>Created {item.createdAt}</Text>
          </View>
          <TouchableOpacity
            style={[s.toggleBtn, { backgroundColor: item.enabled ? t.accent.green : t.text.muted }]}
            onPress={() => handleToggleAlert(item.id)}
          >
            <View style={[s.toggleDot, { alignSelf: item.enabled ? 'flex-end' : 'flex-start' }]} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <Text style={s.sectionTitle}>Add New Alert</Text>
      <View style={s.newAlertCard}>
        <View style={s.chainSelectRow}>
          {gasData.map((g) => (
            <TouchableOpacity
              key={g.chain}
              style={[s.chartChainBtn, newAlertChain === g.chain && s.chartChainBtnActive]}
              onPress={() => setNewAlertChain(g.chain)}
            >
              <Text style={[s.chartChainText, newAlertChain === g.chain && s.chartChainTextActive]}>{g.chain}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={s.input}
          placeholder="Gas threshold"
          placeholderTextColor={t.text.muted}
          value={newAlertThreshold}
          onChangeText={setNewAlertThreshold}
          keyboardType="numeric"
        />
        <TouchableOpacity style={s.addAlertBtn} onPress={handleAddAlert}>
          <Text style={s.addAlertBtnText}>Create Alert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Gas Optimizer</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'current' && renderCurrent()}
      {tab === 'history' && renderHistory()}
      {tab === 'optimize' && renderOptimize()}
      {tab === 'alerts' && renderAlerts()}
    </SafeAreaView>
  );
}
