import { fonts } from '../utils/theme';
/**
 * Fee Estimator Screen — Estimate transaction fees across all chains.
 *
 * Compare fees, view historical fee trends, estimate costs.
 * Demo mode with sample fee data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface ChainFee {
  chain: string;
  symbol: string;
  avgFee: string;
  avgFeeUSD: string;
  speed: string;
  congestion: 'low' | 'medium' | 'high';
}

interface FeeRecord {
  date: string;
  chain: string;
  fee: string;
  feeUSD: string;
  txType: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_CHAINS: ChainFee[] = [
  { chain: 'Open Chain', symbol: 'OTK', avgFee: '0.001', avgFeeUSD: '$0.00', speed: '~4 min', congestion: 'low' },
  { chain: 'Solana', symbol: 'SOL', avgFee: '0.00025', avgFeeUSD: '$0.04', speed: '~0.4s', congestion: 'low' },
  { chain: 'Ethereum', symbol: 'ETH', avgFee: '0.0021', avgFeeUSD: '$7.42', speed: '~12s', congestion: 'high' },
  { chain: 'Bitcoin', symbol: 'BTC', avgFee: '0.00008', avgFeeUSD: '$6.80', speed: '~10 min', congestion: 'medium' },
  { chain: 'Polygon', symbol: 'MATIC', avgFee: '0.003', avgFeeUSD: '$0.002', speed: '~2s', congestion: 'low' },
  { chain: 'Avalanche', symbol: 'AVAX', avgFee: '0.001', avgFeeUSD: '$0.03', speed: '~1s', congestion: 'low' },
];

const DEMO_HISTORY: FeeRecord[] = [
  { date: '2026-03-31', chain: 'Open Chain', fee: '0.001 OTK', feeUSD: '$0.00', txType: 'Transfer' },
  { date: '2026-03-30', chain: 'Solana', fee: '0.00025 SOL', feeUSD: '$0.04', txType: 'Swap' },
  { date: '2026-03-29', chain: 'Ethereum', fee: '0.0031 ETH', feeUSD: '$10.96', txType: 'Bridge' },
  { date: '2026-03-28', chain: 'Open Chain', fee: '0.001 OTK', feeUSD: '$0.00', txType: 'Governance Vote' },
  { date: '2026-03-27', chain: 'Polygon', fee: '0.005 MATIC', feeUSD: '$0.003', txType: 'Transfer' },
  { date: '2026-03-26', chain: 'Bitcoin', fee: '0.00012 BTC', feeUSD: '$10.20', txType: 'Transfer' },
];

type Tab = 'estimate' | 'compare' | 'history';
const CONGESTION_COLORS: Record<string, string> = { low: '#34C759', medium: '#FF9500', high: '#FF3B30' };

export function FeeEstimatorScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('estimate');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('Open Chain');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const estimatedFee = useMemo(() => {
    const chain = DEMO_CHAINS.find((c) => c.chain === selectedChain);
    return chain || DEMO_CHAINS[0];
  }, [selectedChain]);

  const handleEstimate = useCallback(() => {
    // Fee is independent of amount on most chains, shown for context
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
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    chainPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chainChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    chainActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    chainText: { color: t.text.muted, fontSize: 13, fontWeight: fonts.semibold },
    chainTextActive: { color: t.accent.green },
    resultBox: { backgroundColor: t.accent.green + '12', borderRadius: 14, padding: 20, alignItems: 'center' },
    resultFee: { color: t.accent.green, fontSize: 28, fontWeight: fonts.heavy },
    resultUSD: { color: t.text.muted, fontSize: 14, marginTop: 4 },
    resultMeta: { color: t.text.secondary, fontSize: 13, marginTop: 8, textAlign: 'center' },
    compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    compareInfo: { flex: 1 },
    compareName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.bold },
    compareMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    compareRight: { alignItems: 'flex-end' },
    compareFee: { color: t.text.primary, fontSize: 15, fontWeight: fonts.heavy },
    compareUSD: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    congestionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    congestionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    congestionText: { fontSize: 11, fontWeight: fonts.semibold },
    histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    histInfo: { flex: 1 },
    histChain: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold },
    histMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    histFee: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.bold },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'estimate', label: 'Estimate' },
    { key: 'compare', label: 'Compare' },
    { key: 'history', label: 'History' },
  ];

  const renderEstimate = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Estimate Fee</Text>
      <View style={s.chainPicker}>
        {DEMO_CHAINS.map((c) => (
          <TouchableOpacity key={c.chain} style={[s.chainChip, selectedChain === c.chain && s.chainActive]} onPress={() => setSelectedChain(c.chain)}>
            <Text style={[s.chainText, selectedChain === c.chain && s.chainTextActive]}>{c.chain}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Amount to send (optional)" placeholderTextColor={t.text.muted} keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <View style={s.resultBox}>
        <Text style={s.resultFee}>{estimatedFee.avgFee} {estimatedFee.symbol}</Text>
        <Text style={s.resultUSD}>{estimatedFee.avgFeeUSD}</Text>
        <Text style={s.resultMeta}>Speed: {estimatedFee.speed} | Congestion: {estimatedFee.congestion}</Text>
      </View>
    </View>
  );

  const renderCompare = () => (
    <>
      <Text style={s.sectionTitle}>Fee Comparison</Text>
      <View style={s.card}>
        {DEMO_CHAINS.map((c) => (
          <View key={c.chain} style={s.compareRow}>
            <View style={s.compareInfo}>
              <Text style={s.compareName}>{c.chain}</Text>
              <Text style={s.compareMeta}>Speed: {c.speed}</Text>
              <View style={s.congestionRow}>
                <View style={[s.congestionDot, { backgroundColor: CONGESTION_COLORS[c.congestion] }]} />
                <Text style={[s.congestionText, { color: CONGESTION_COLORS[c.congestion] }]}>{c.congestion}</Text>
              </View>
            </View>
            <View style={s.compareRight}>
              <Text style={s.compareFee}>{c.avgFee} {c.symbol}</Text>
              <Text style={s.compareUSD}>{c.avgFeeUSD}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const renderHistory = () => (
    <>
      <Text style={s.sectionTitle}>Fee History</Text>
      <View style={s.card}>
        {DEMO_HISTORY.map((h, i) => (
          <View key={i} style={s.histRow}>
            <View style={s.histInfo}>
              <Text style={s.histChain}>{h.chain} — {h.txType}</Text>
              <Text style={s.histMeta}>{h.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.histFee}>{h.fee}</Text>
              <Text style={[s.histMeta, { marginTop: 0 }]}>{h.feeUSD}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Fee Estimator</Text>
        <View style={{ width: 60 }} />
      </View>
      {demoMode && (<View style={s.demoTag}><Text style={s.demoText}>DEMO MODE</Text></View>)}
      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'estimate' && renderEstimate()}
        {tab === 'compare' && renderCompare()}
        {tab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}
