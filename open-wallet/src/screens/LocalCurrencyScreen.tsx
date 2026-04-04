import { fonts } from '../utils/theme';
/**
 * Local Currency Screen — Community local currency creation and management.
 *
 * Features:
 * - Browse community currencies
 * - Create a new local currency
 * - Exchange between local currencies and OTK
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

interface LocalCurrency {
  id: string;
  name: string;
  symbol: string;
  community: string;
  totalSupply: number;
  holders: number;
  otkRate: number;
  description: string;
  created: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_CURRENCIES: LocalCurrency[] = [
  { id: 'lc1', name: 'Riverside Credits', symbol: 'RVC', community: 'Riverside Neighborhood', totalSupply: 50000, holders: 234, otkRate: 0.5, description: 'Local exchange for Riverside shops and services', created: '2026-01-15' },
  { id: 'lc2', name: 'Green Tokens', symbol: 'GRT', community: 'Eco Village Co-op', totalSupply: 25000, holders: 89, otkRate: 1.2, description: 'Earned through eco-friendly actions, spent at local markets', created: '2026-02-01' },
  { id: 'lc3', name: 'Harbor Hours', symbol: 'HBH', community: 'Harbor District', totalSupply: 10000, holders: 156, otkRate: 2.0, description: 'Time-based currency: 1 HBH = 1 hour of community service', created: '2025-11-20' },
  { id: 'lc4', name: 'Farm Fresh Bucks', symbol: 'FFB', community: 'Valley Farmers Market', totalSupply: 30000, holders: 312, otkRate: 0.8, description: 'Support local farmers, earn by buying local produce', created: '2026-03-01' },
  { id: 'lc5', name: 'Campus Coins', symbol: 'CPC', community: 'State University Area', totalSupply: 75000, holders: 1240, otkRate: 0.3, description: 'Student and campus business exchange currency', created: '2025-09-01' },
];

type Tab = 'currencies' | 'create' | 'exchange';

export function LocalCurrencyScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('currencies');
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newSupply, setNewSupply] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [exchangeFrom, setExchangeFrom] = useState('OTK');
  const [exchangeTo, setExchangeTo] = useState('RVC');
  const [exchangeAmount, setExchangeAmount] = useState('');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const handleCreate = useCallback(() => {
    if (!newName.trim()) { Alert.alert('Required', 'Enter currency name.'); return; }
    if (!newSymbol.trim() || newSymbol.length > 5) { Alert.alert('Required', 'Enter a symbol (max 5 chars).'); return; }
    const supply = parseInt(newSupply, 10);
    if (!supply || supply <= 0) { Alert.alert('Required', 'Enter valid initial supply.'); return; }
    Alert.alert('Currency Created', `${newName} (${newSymbol.toUpperCase()}) created with ${supply.toLocaleString()} initial supply.\n\nPending community governance approval.`);
    setNewName(''); setNewSymbol(''); setNewSupply(''); setNewDesc('');
  }, [newName, newSymbol, newSupply]);

  const handleExchange = useCallback(() => {
    const amount = parseFloat(exchangeAmount);
    if (!amount || amount <= 0) { Alert.alert('Required', 'Enter a valid amount.'); return; }
    const fromCurrency = DEMO_CURRENCIES.find(c => c.symbol === exchangeFrom);
    const toCurrency = DEMO_CURRENCIES.find(c => c.symbol === exchangeTo);
    const fromRate = fromCurrency?.otkRate || 1;
    const toRate = toCurrency?.otkRate || 1;
    const result = (amount * fromRate / toRate).toFixed(2);
    Alert.alert('Exchange Preview', `${amount} ${exchangeFrom} = ${result} ${exchangeTo}\n\nConfirm to proceed.`);
  }, [exchangeAmount, exchangeFrom, exchangeTo]);

  const allSymbols = useMemo(() => ['OTK', ...DEMO_CURRENCIES.map(c => c.symbol)], []);

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
    currCard: { backgroundColor: t.bg.secondary, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    currName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    currSymbol: { color: t.accent.green, fontSize: 13, fontWeight: fonts.bold, marginTop: 2 },
    currMeta: { color: t.text.muted, fontSize: 12, marginTop: 4 },
    currDesc: { color: t.text.muted, fontSize: 13, marginTop: 8, lineHeight: 19 },
    statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopColor: t.bg.primary, borderTopWidth: 1 },
    statItem: { alignItems: 'center' },
    statValue: { color: t.text.primary, fontSize: 16, fontWeight: fonts.heavy },
    statLabel: { color: t.text.muted, fontSize: 10, marginTop: 2 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    labelText: { color: t.text.muted, fontSize: 12, marginBottom: 6, fontWeight: fonts.semibold },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: t.bg.primary },
    chipSelected: { backgroundColor: t.accent.green + '20', borderColor: t.accent.green },
    chipText: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold },
    chipTextSelected: { color: t.accent.green },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: fonts.bold },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'currencies', label: 'Currencies' },
    { key: 'create', label: 'Create' },
    { key: 'exchange', label: 'Exchange' },
  ];

  const renderCurrencies = () => (
    <>
      <Text style={s.sectionTitle}>Community Currencies</Text>
      {DEMO_CURRENCIES.map((c) => (
        <View key={c.id} style={s.currCard}>
          <Text style={s.currName}>{c.name}</Text>
          <Text style={s.currSymbol}>{c.symbol}</Text>
          <Text style={s.currMeta}>{c.community} | Since {c.created}</Text>
          <Text style={s.currDesc}>{c.description}</Text>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{c.totalSupply.toLocaleString()}</Text>
              <Text style={s.statLabel}>Supply</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{c.holders}</Text>
              <Text style={s.statLabel}>Holders</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: t.accent.green }]}>{c.otkRate}</Text>
              <Text style={s.statLabel}>OTK Rate</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const renderCreate = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Create Local Currency</Text>
      <TextInput style={s.input} placeholder="Currency name" placeholderTextColor={t.text.muted} value={newName} onChangeText={setNewName} />
      <TextInput style={s.input} placeholder="Symbol (e.g., RVC)" placeholderTextColor={t.text.muted} value={newSymbol} onChangeText={setNewSymbol} maxLength={5} autoCapitalize="characters" />
      <TextInput style={s.input} placeholder="Initial supply" placeholderTextColor={t.text.muted} keyboardType="numeric" value={newSupply} onChangeText={setNewSupply} />
      <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Description (purpose, how it's earned/spent)" placeholderTextColor={t.text.muted} value={newDesc} onChangeText={setNewDesc} multiline />
      <TouchableOpacity style={s.submitBtn} onPress={handleCreate}>
        <Text style={s.submitText}>Create Currency</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExchange = () => (
    <View style={s.card}>
      <Text style={[s.sectionTitle, { marginHorizontal: 0 }]}>Currency Exchange</Text>
      <Text style={s.labelText}>From</Text>
      <View style={s.chipGrid}>
        {allSymbols.map((sym) => (
          <TouchableOpacity key={sym} style={[s.chip, exchangeFrom === sym && s.chipSelected]} onPress={() => setExchangeFrom(sym)}>
            <Text style={[s.chipText, exchangeFrom === sym && s.chipTextSelected]}>{sym}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={s.input} placeholder="Amount" placeholderTextColor={t.text.muted} keyboardType="numeric" value={exchangeAmount} onChangeText={setExchangeAmount} />
      <Text style={s.labelText}>To</Text>
      <View style={s.chipGrid}>
        {allSymbols.map((sym) => (
          <TouchableOpacity key={sym} style={[s.chip, exchangeTo === sym && s.chipSelected]} onPress={() => setExchangeTo(sym)}>
            <Text style={[s.chipText, exchangeTo === sym && s.chipTextSelected]}>{sym}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.submitBtn} onPress={handleExchange}>
        <Text style={s.submitText}>Preview Exchange</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Local Currency</Text>
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
        {tab === 'currencies' && renderCurrencies()}
        {tab === 'create' && renderCreate()}
        {tab === 'exchange' && renderExchange()}
      </ScrollView>
    </SafeAreaView>
  );
}
