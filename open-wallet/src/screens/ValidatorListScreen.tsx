/**
 * Validator List Screen — Browse and compare all chain validators.
 *
 * View active validators, compare performance, delegate stake.
 * Demo mode with sample validator data.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Validator {
  id: string;
  name: string;
  address: string;
  stake: number;
  delegators: number;
  uptime: number;
  blocksProduced: number;
  commission: number;
  status: 'active' | 'jailed' | 'inactive';
  region: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_VALIDATORS: Validator[] = [
  { id: '1', name: 'validator_alpha', address: 'openchain1abc...val_alpha', stake: 52000, delegators: 284, uptime: 99.98, blocksProduced: 12480, commission: 5, status: 'active', region: 'US-West' },
  { id: '2', name: 'validator_beta', address: 'openchain1def...val_beta', stake: 38000, delegators: 196, uptime: 99.92, blocksProduced: 11240, commission: 3, status: 'active', region: 'EU-Central' },
  { id: '3', name: 'validator_gamma', address: 'openchain1ghi...val_gamma', stake: 45000, delegators: 231, uptime: 99.95, blocksProduced: 11890, commission: 4, status: 'active', region: 'Asia-East' },
  { id: '4', name: 'validator_delta', address: 'openchain1jkl...val_delta', stake: 28000, delegators: 142, uptime: 99.87, blocksProduced: 9820, commission: 6, status: 'active', region: 'US-East' },
  { id: '5', name: 'validator_epsilon', address: 'openchain1mno...val_eps', stake: 15000, delegators: 78, uptime: 98.42, blocksProduced: 6240, commission: 8, status: 'active', region: 'SA-South' },
  { id: '6', name: 'validator_zeta', address: 'openchain1pqr...val_zeta', stake: 8000, delegators: 34, uptime: 87.20, blocksProduced: 2100, commission: 10, status: 'jailed', region: 'AF-West' },
  { id: '7', name: 'validator_eta', address: 'openchain1stu...val_eta', stake: 12000, delegators: 56, uptime: 0, blocksProduced: 4500, commission: 5, status: 'inactive', region: 'EU-North' },
];

type Tab = 'active' | 'compare' | 'delegate';
const STATUS_COLORS: Record<string, string> = { active: '#34C759', jailed: '#FF3B30', inactive: '#8E8E93' };

export function ValidatorListScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [compareIds, setCompareIds] = useState<string[]>(['1', '2']);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const activeValidators = useMemo(() => DEMO_VALIDATORS.filter((v) => v.status === 'active'), []);
  const totalStake = useMemo(() => DEMO_VALIDATORS.reduce((s, v) => s + v.stake, 0), []);

  const handleDelegate = useCallback((val: Validator) => {
    Alert.alert('Delegate to Validator', `Delegate OTK to ${val.name}?\n\nCommission: ${val.commission}%\nUptime: ${val.uptime}%\nRegion: ${val.region}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delegate', onPress: () => Alert.alert('Delegated', `Stake delegated to ${val.name}.`) },
    ]);
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.green + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.accent.green },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    valRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    valDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    valInfo: { flex: 1 },
    valName: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    valMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    valRight: { alignItems: 'flex-end' },
    valStake: { color: t.accent.green, fontSize: 14, fontWeight: '800' },
    valUptime: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    compareHeader: { flexDirection: 'row', borderBottomColor: t.bg.primary, borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
    compareCol: { flex: 1, alignItems: 'center' },
    compareName: { color: t.accent.blue, fontSize: 13, fontWeight: '700' },
    compareMetricRow: { flexDirection: 'row', paddingVertical: 8, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    compareLabel: { width: 80, color: t.text.muted, fontSize: 12 },
    compareValue: { flex: 1, textAlign: 'center', color: t.text.primary, fontSize: 13, fontWeight: '600' },
    selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginBottom: 12 },
    selectChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: t.border },
    selectActive: { borderColor: t.accent.blue, backgroundColor: t.accent.blue + '15' },
    selectText: { color: t.text.muted, fontSize: 12, fontWeight: '600' },
    selectTextActive: { color: t.accent.blue },
    delegateBtn: { backgroundColor: t.accent.green, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    delegateBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'compare', label: 'Compare' },
    { key: 'delegate', label: 'Delegate' },
  ];

  const renderActive = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.green }]}>{activeValidators.length}</Text><Text style={s.summaryLabel}>Active</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{totalStake.toLocaleString()}</Text><Text style={s.summaryLabel}>Total Staked</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{DEMO_VALIDATORS.length}</Text><Text style={s.summaryLabel}>Total</Text></View>
        </View>
      </View>
      <Text style={s.sectionTitle}>All Validators</Text>
      <View style={s.card}>
        {DEMO_VALIDATORS.map((v) => (
          <View key={v.id} style={s.valRow}>
            <View style={[s.valDot, { backgroundColor: STATUS_COLORS[v.status] }]} />
            <View style={s.valInfo}>
              <Text style={s.valName}>{v.name}</Text>
              <Text style={s.valMeta}>{v.region} | {v.delegators} delegators | {v.commission}% comm</Text>
            </View>
            <View style={s.valRight}>
              <Text style={s.valStake}>{v.stake.toLocaleString()}</Text>
              <Text style={s.valUptime}>{v.uptime}% up</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  const compareMetrics = ['Stake', 'Delegators', 'Uptime', 'Blocks', 'Commission', 'Region'];
  const getMetric = (v: Validator, m: string) => {
    switch (m) {
      case 'Stake': return v.stake.toLocaleString();
      case 'Delegators': return String(v.delegators);
      case 'Uptime': return `${v.uptime}%`;
      case 'Blocks': return v.blocksProduced.toLocaleString();
      case 'Commission': return `${v.commission}%`;
      case 'Region': return v.region;
      default: return '';
    }
  };

  const compared = useMemo(() => DEMO_VALIDATORS.filter((v) => compareIds.includes(v.id)), [compareIds]);

  const renderCompare = () => (
    <>
      <View style={s.selectRow}>
        {activeValidators.map((v) => (
          <TouchableOpacity key={v.id} style={[s.selectChip, compareIds.includes(v.id) && s.selectActive]} onPress={() => toggleCompare(v.id)}>
            <Text style={[s.selectText, compareIds.includes(v.id) && s.selectTextActive]}>{v.name.split('_')[1]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.card}>
        <View style={s.compareHeader}>
          <View style={{ width: 80 }} />
          {compared.map((v) => (<View key={v.id} style={s.compareCol}><Text style={s.compareName}>{v.name.split('_')[1]}</Text></View>))}
        </View>
        {compareMetrics.map((m) => (
          <View key={m} style={s.compareMetricRow}>
            <Text style={s.compareLabel}>{m}</Text>
            {compared.map((v) => (<Text key={v.id} style={s.compareValue}>{getMetric(v, m)}</Text>))}
          </View>
        ))}
      </View>
    </>
  );

  const renderDelegate = () => (
    <>
      <Text style={s.sectionTitle}>Choose a Validator</Text>
      <View style={s.card}>
        {activeValidators.map((v) => (
          <View key={v.id} style={s.valRow}>
            <View style={s.valInfo}>
              <Text style={s.valName}>{v.name}</Text>
              <Text style={s.valMeta}>{v.uptime}% uptime | {v.commission}% commission | {v.stake.toLocaleString()} staked</Text>
            </View>
            <TouchableOpacity style={s.delegateBtn} onPress={() => handleDelegate(v)}>
              <Text style={s.delegateBtnText}>Delegate</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Validators</Text>
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
        {tab === 'active' && renderActive()}
        {tab === 'compare' && renderCompare()}
        {tab === 'delegate' && renderDelegate()}
      </ScrollView>
    </SafeAreaView>
  );
}
