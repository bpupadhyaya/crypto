import { fonts } from '../utils/theme';
/**
 * Delegation Screen — Advanced staking delegation management.
 *
 * Redelegate, undelegate, search/filter/sort validators,
 * pending undelegations with countdown timers.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig } from '../core/network';

/* ─── Types ─── */

interface Validator {
  address: string;
  moniker: string;
  commission: number;
  votingPower: number;
  uptime: number;
  blocksProposed: number;
  delegators: number;
  apy: number;
  status: 'active' | 'inactive' | 'jailed';
}

interface Delegation {
  validatorAddress: string;
  validatorMoniker: string;
  amount: string;
  rewards: string;
  since: string;
}

interface Undelegation {
  validatorMoniker: string;
  amount: string;
  completionTime: string; // ISO date string
}

type SortField = 'votingPower' | 'commission' | 'uptime' | 'apy';
type ViewState = 'main' | 'validator-detail' | 'redelegate' | 'undelegate';

interface Props {
  onClose: () => void;
}

/* ─── Demo Data: 10 validators matching 10-phone testnet ─── */

const DEMO_VALIDATORS: Validator[] = [
  { address: 'openchainvaloper1...phone01', moniker: 'Phone-1 (Bhim)', commission: 5, votingPower: 50000, uptime: 99.9, blocksProposed: 4521, delegators: 47, apy: 12.5, status: 'active' },
  { address: 'openchainvaloper1...phone02', moniker: 'Phone-2 (Alice)', commission: 3, votingPower: 42000, uptime: 99.7, blocksProposed: 3980, delegators: 35, apy: 13.1, status: 'active' },
  { address: 'openchainvaloper1...phone03', moniker: 'Phone-3 (Bob)', commission: 2, votingPower: 38000, uptime: 99.5, blocksProposed: 3650, delegators: 28, apy: 13.5, status: 'active' },
  { address: 'openchainvaloper1...phone04', moniker: 'Phone-4 (Carol)', commission: 1, votingPower: 35000, uptime: 98.8, blocksProposed: 3200, delegators: 22, apy: 14.0, status: 'active' },
  { address: 'openchainvaloper1...phone05', moniker: 'Phone-5 (Dave)', commission: 4, votingPower: 31000, uptime: 99.2, blocksProposed: 2870, delegators: 19, apy: 12.8, status: 'active' },
  { address: 'openchainvaloper1...phone06', moniker: 'Phone-6 (Eve)', commission: 3, votingPower: 27000, uptime: 98.5, blocksProposed: 2400, delegators: 15, apy: 13.3, status: 'active' },
  { address: 'openchainvaloper1...phone07', moniker: 'Phone-7 (Frank)', commission: 6, votingPower: 22000, uptime: 97.8, blocksProposed: 1950, delegators: 12, apy: 11.8, status: 'active' },
  { address: 'openchainvaloper1...phone08', moniker: 'Phone-8 (Grace)', commission: 2, votingPower: 18000, uptime: 99.1, blocksProposed: 1600, delegators: 10, apy: 13.7, status: 'active' },
  { address: 'openchainvaloper1...phone09', moniker: 'Phone-9 (Heidi)', commission: 0, votingPower: 15000, uptime: 96.5, blocksProposed: 1200, delegators: 8, apy: 14.5, status: 'active' },
  { address: 'openchainvaloper1...phone10', moniker: 'Phone-10 (Ivan)', commission: 5, votingPower: 10000, uptime: 94.2, blocksProposed: 800, delegators: 5, apy: 12.0, status: 'jailed' },
];

const DEMO_DELEGATIONS: Delegation[] = [
  { validatorAddress: 'openchainvaloper1...phone01', validatorMoniker: 'Phone-1 (Bhim)', amount: '1,000.00', rewards: '12.50', since: '2026-02-01' },
  { validatorAddress: 'openchainvaloper1...phone03', validatorMoniker: 'Phone-3 (Bob)', amount: '500.00', rewards: '6.75', since: '2026-02-15' },
  { validatorAddress: 'openchainvaloper1...phone08', validatorMoniker: 'Phone-8 (Grace)', amount: '250.00', rewards: '3.42', since: '2026-03-01' },
];

const DEMO_UNDELEGATIONS: Undelegation[] = [
  { validatorMoniker: 'Phone-10 (Ivan)', amount: '200.00', completionTime: '2026-04-18T00:00:00Z' },
];

/* ─── Component ─── */

export function DelegationScreen({ onClose }: Props) {
  const [view, setView] = useState<ViewState>('main');
  const [tab, setTab] = useState<'validators' | 'delegations' | 'undelegating'>('delegations');
  const [validators, setValidators] = useState<Validator[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [undelegations, setUndelegations] = useState<Undelegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Validator list controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('votingPower');

  // Selected validator
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);

  // Redelegate
  const [redelegateFrom, setRedelegateFrom] = useState<string>('');
  const [redelegateAmount, setRedelegateAmount] = useState('');

  // Undelegate
  const [undelegateAmount, setUndelegateAmount] = useState('');

  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    backBtn: { color: t.accent.blue, fontSize: fonts.lg },
    summaryCard: { backgroundColor: t.accent.green + '10', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center' },
    summaryLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1.5 },
    summaryValue: { color: t.accent.green, fontSize: fonts.hero, fontWeight: fonts.heavy, marginTop: 4 },
    summarySubtext: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 8 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 10, marginTop: 16 },
    searchBar: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 12, color: t.text.primary, fontSize: fonts.md },
    sortRow: { flexDirection: 'row', gap: 6, marginHorizontal: 20, marginBottom: 12, flexWrap: 'wrap' },
    sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: t.border },
    sortChipActive: { backgroundColor: t.accent.green },
    sortChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    sortChipTextActive: { color: t.bg.primary },
    validatorCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    validatorName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    validatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    validatorLabel: { color: t.text.muted, fontSize: fonts.sm },
    validatorValue: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    delegationCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    delegationName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    delegationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    delegationLabel: { color: t.text.muted, fontSize: fonts.sm },
    delegationValue: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    rewardsValue: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.bold },
    undelegationCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10 },
    countdown: { color: t.accent.orange, fontSize: fonts.md, fontWeight: fonts.bold, marginTop: 8 },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md },
    submitBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    detailCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, marginHorizontal: 20 },
    detailName: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy, textAlign: 'center' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    detailLabel: { color: t.text.muted, fontSize: fonts.md },
    detailValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', lineHeight: 22 },
    loadingContainer: { alignItems: 'center', paddingVertical: 30 },
    fromPicker: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginHorizontal: 20, marginTop: 8 },
    fromOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
    fromOptionActive: { backgroundColor: t.accent.green + '20' },
    fromOptionText: { color: t.text.primary, fontSize: fonts.md },
    fromOptionAmount: { color: t.text.muted, fontSize: fonts.sm },
  }), [t]);

  /* ─── Fetch Data ─── */

  useEffect(() => {
    setLoading(true);
    if (demoMode) {
      setTimeout(() => {
        setValidators(DEMO_VALIDATORS);
        setDelegations(DEMO_DELEGATIONS);
        setUndelegations(DEMO_UNDELEGATIONS);
        setLoading(false);
      }, 400);
    } else {
      // Production: fetch from Cosmos staking + distribution modules
      const fetchData = async () => {
        try {
          const { restUrl } = getNetworkConfig().openchain;
          const valResp = await fetch(`${restUrl}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`);
          if (valResp.ok) {
            const data = await valResp.json();
            setValidators((data.validators ?? []).map((v: any) => ({
              address: v.operator_address ?? '',
              moniker: v.description?.moniker ?? 'Unknown',
              commission: parseFloat(v.commission?.commission_rates?.rate ?? '0') * 100,
              votingPower: parseInt(v.tokens ?? '0', 10) / 1_000_000,
              uptime: 99.0,
              blocksProposed: 0,
              delegators: 0,
              apy: 12.0,
              status: v.jailed ? 'jailed' as const : v.status === 'BOND_STATUS_BONDED' ? 'active' as const : 'inactive' as const,
            })));
          }
        } catch {
          setValidators(DEMO_VALIDATORS);
        }
        setDelegations([]);
        setUndelegations([]);
        setLoading(false);
      };
      fetchData();
    }
  }, [demoMode]);

  /* ─── Filtered & Sorted Validators ─── */

  const filteredValidators = useMemo(() => {
    let list = [...validators];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v => v.moniker.toLowerCase().includes(q) || v.address.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortField) {
        case 'votingPower': return b.votingPower - a.votingPower;
        case 'commission': return a.commission - b.commission;
        case 'uptime': return b.uptime - a.uptime;
        case 'apy': return b.apy - a.apy;
        default: return 0;
      }
    });
    return list;
  }, [validators, searchQuery, sortField]);

  /* ─── Countdown Helper ─── */

  const getCountdown = useCallback((completionTime: string): string => {
    const now = new Date().getTime();
    const end = new Date(completionTime).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Complete — ready to claim';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  }, []);

  /* ─── Redelegate ─── */

  const handleRedelegate = useCallback(async () => {
    if (!redelegateFrom) { Alert.alert('Required', 'Select which delegation to move from.'); return; }
    if (!redelegateAmount.trim() || parseFloat(redelegateAmount) <= 0) { Alert.alert('Invalid Amount', 'Enter a valid amount.'); return; }
    if (!selectedValidator) return;

    setProcessing(true);
    if (demoMode) {
      await new Promise(r => setTimeout(r, 1500));
      // Move stake in demo
      const fromDel = delegations.find(d => d.validatorAddress === redelegateFrom);
      if (fromDel) {
        const moveAmount = parseFloat(redelegateAmount);
        const fromAmount = parseFloat(fromDel.amount.replace(/,/g, ''));
        if (moveAmount > fromAmount) { Alert.alert('Insufficient', 'Cannot redelegate more than staked.'); setProcessing(false); return; }
        setDelegations(prev => {
          const updated = prev.map(d => {
            if (d.validatorAddress === redelegateFrom) {
              const remaining = fromAmount - moveAmount;
              return remaining > 0 ? { ...d, amount: remaining.toFixed(2) } : null;
            }
            return d;
          }).filter(Boolean) as Delegation[];
          const existing = updated.find(d => d.validatorAddress === selectedValidator.address);
          if (existing) {
            return updated.map(d => d.validatorAddress === selectedValidator.address
              ? { ...d, amount: (parseFloat(d.amount.replace(/,/g, '')) + moveAmount).toFixed(2) }
              : d);
          }
          return [...updated, {
            validatorAddress: selectedValidator.address,
            validatorMoniker: selectedValidator.moniker,
            amount: moveAmount.toFixed(2),
            rewards: '0.00',
            since: new Date().toISOString().split('T')[0],
          }];
        });
        Alert.alert('Redelegated', `Moved ${redelegateAmount} OTK from ${fromDel.validatorMoniker} to ${selectedValidator.moniker}. No unbonding period.`);
      }
      setRedelegateAmount(''); setRedelegateFrom('');
      setView('main'); setTab('delegations');
    } else {
      Alert.alert('Coming Soon', 'Redelegation on mainnet is under development.');
    }
    setProcessing(false);
  }, [redelegateFrom, redelegateAmount, selectedValidator, delegations, demoMode]);

  /* ─── Undelegate ─── */

  const handleUndelegate = useCallback(async () => {
    if (!undelegateAmount.trim() || parseFloat(undelegateAmount) <= 0) { Alert.alert('Invalid Amount', 'Enter a valid amount.'); return; }
    if (!selectedValidator) return;

    const del = delegations.find(d => d.validatorAddress === selectedValidator.address);
    if (!del) { Alert.alert('No Delegation', 'You have no delegation with this validator.'); return; }

    setProcessing(true);
    if (demoMode) {
      await new Promise(r => setTimeout(r, 1500));
      const amount = parseFloat(undelegateAmount);
      const staked = parseFloat(del.amount.replace(/,/g, ''));
      if (amount > staked) { Alert.alert('Insufficient', 'Cannot undelegate more than staked.'); setProcessing(false); return; }

      // Add to undelegations
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + 21);
      setUndelegations(prev => [...prev, {
        validatorMoniker: selectedValidator.moniker,
        amount: amount.toFixed(2),
        completionTime: completionDate.toISOString(),
      }]);

      // Reduce delegation
      setDelegations(prev => prev.map(d => {
        if (d.validatorAddress === selectedValidator.address) {
          const remaining = staked - amount;
          return remaining > 0 ? { ...d, amount: remaining.toFixed(2) } : null;
        }
        return d;
      }).filter(Boolean) as Delegation[]);

      Alert.alert('Undelegation Started', `${amount.toFixed(2)} OTK is now unbonding from ${selectedValidator.moniker}. Completion in 21 days.`);
      setUndelegateAmount('');
      setView('main'); setTab('undelegating');
    } else {
      Alert.alert('Coming Soon', 'Undelegation on mainnet is under development.');
    }
    setProcessing(false);
  }, [undelegateAmount, selectedValidator, delegations, demoMode]);

  /* ─── Totals ─── */

  const totalStaked = useMemo(() =>
    delegations.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0), [delegations]);
  const totalRewards = useMemo(() =>
    delegations.reduce((sum, d) => sum + parseFloat(d.rewards.replace(/,/g, '')), 0), [delegations]);
  const totalUnbonding = useMemo(() =>
    undelegations.reduce((sum, u) => sum + parseFloat(u.amount.replace(/,/g, '')), 0), [undelegations]);

  /* ─── Validator Detail View ─── */

  if (view === 'validator-detail' && selectedValidator) {
    const v = selectedValidator;
    const statusColor = v.status === 'active' ? t.accent.green : v.status === 'jailed' ? t.accent.red : t.accent.yellow;
    const hasDelegation = delegations.some(d => d.validatorAddress === v.address);

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('main')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Validator</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <View style={s.detailCard}>
            <Text style={s.detailName}>{v.moniker}</Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20', alignSelf: 'center', marginTop: 8 }]}>
              <Text style={[s.statusText, { color: statusColor }]}>{v.status.toUpperCase()}</Text>
            </View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Voting Power</Text><Text style={s.detailValue}>{v.votingPower.toLocaleString()} OTK</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Commission</Text><Text style={s.detailValue}>{v.commission}%</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Uptime</Text><Text style={[s.detailValue, { color: v.uptime >= 99 ? t.accent.green : v.uptime >= 95 ? t.accent.yellow : t.accent.red }]}>{v.uptime}%</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Blocks Proposed</Text><Text style={s.detailValue}>{v.blocksProposed.toLocaleString()}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Delegators</Text><Text style={s.detailValue}>{v.delegators}</Text></View>
            <View style={s.detailRow}><Text style={s.detailLabel}>Est. APY</Text><Text style={[s.detailValue, { color: t.accent.green }]}>{v.apy}%</Text></View>
            <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 12 }}>{v.address}</Text>
          </View>

          {v.status !== 'jailed' && (
            <>
              <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.blue }]} onPress={() => setView('redelegate')}>
                <Text style={s.submitBtnText}>Redelegate to {v.moniker.split(' ')[0]}</Text>
              </TouchableOpacity>
              {hasDelegation && (
                <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.red, marginTop: 12 }]} onPress={() => setView('undelegate')}>
                  <Text style={s.submitBtnText}>Undelegate from {v.moniker.split(' ')[0]}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── Redelegate View ─── */

  if (view === 'redelegate' && selectedValidator) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('validator-detail')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Redelegate</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <Text style={s.section}>Move stake to: {selectedValidator.moniker}</Text>
          <Text style={[s.section, { marginTop: 8 }]}>Select source delegation</Text>
          <View style={s.fromPicker}>
            {delegations.length === 0 ? (
              <Text style={{ color: t.text.muted, textAlign: 'center', padding: 16 }}>No active delegations to redelegate from.</Text>
            ) : (
              delegations.filter(d => d.validatorAddress !== selectedValidator.address).map(d => (
                <TouchableOpacity
                  key={d.validatorAddress}
                  style={[s.fromOption, redelegateFrom === d.validatorAddress && s.fromOptionActive]}
                  onPress={() => setRedelegateFrom(d.validatorAddress)}
                >
                  <Text style={s.fromOptionText}>{d.validatorMoniker}</Text>
                  <Text style={s.fromOptionAmount}>Staked: {d.amount} OTK</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Amount to redelegate (OTK)</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor={t.text.muted} value={redelegateAmount} onChangeText={setRedelegateAmount} keyboardType="decimal-pad" />
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleRedelegate} disabled={processing}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Redelegate</Text>}
          </TouchableOpacity>
          <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 16, marginHorizontal: 24, lineHeight: 18 }}>
            Redelegation moves your stake without unbonding. No waiting period. You cannot redelegate the same tokens again for 21 days.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── Undelegate View ─── */

  if (view === 'undelegate' && selectedValidator) {
    const del = delegations.find(d => d.validatorAddress === selectedValidator.address);
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('validator-detail')}><Text style={s.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Undelegate</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView>
          <Text style={s.section}>Undelegate from: {selectedValidator.moniker}</Text>
          {del && <Text style={{ color: t.text.secondary, marginHorizontal: 24, marginBottom: 12 }}>Currently staked: {del.amount} OTK</Text>}
          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Amount to undelegate (OTK)</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor={t.text.muted} value={undelegateAmount} onChangeText={setUndelegateAmount} keyboardType="decimal-pad" />
          </View>
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: t.accent.red }]} onPress={handleUndelegate} disabled={processing}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Start Unbonding</Text>}
          </TouchableOpacity>
          <Text style={{ color: t.accent.orange, fontSize: fonts.sm, textAlign: 'center', marginTop: 16, marginHorizontal: 24, lineHeight: 20, fontWeight: fonts.semibold }}>
            Unbonding takes 21 days. During this period your tokens will not earn rewards and cannot be transferred.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── Main View ─── */

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Delegation</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Total Delegated</Text>
        <Text style={s.summaryValue}>{totalStaked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OTK</Text>
        <Text style={s.summarySubtext}>
          Rewards: {totalRewards.toFixed(4)} OTK | Unbonding: {totalUnbonding.toFixed(2)} OTK
        </Text>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'delegations' && s.tabActive]} onPress={() => setTab('delegations')}>
          <Text style={[s.tabText, tab === 'delegations' && s.tabTextActive]}>My Stakes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'validators' && s.tabActive]} onPress={() => setTab('validators')}>
          <Text style={[s.tabText, tab === 'validators' && s.tabTextActive]}>Validators</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'undelegating' && s.tabActive]} onPress={() => setTab('undelegating')}>
          <Text style={[s.tabText, tab === 'undelegating' && s.tabTextActive]}>Unbonding</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {loading ? (
          <View style={s.loadingContainer}><ActivityIndicator size="large" color={t.accent.green} /></View>
        ) : (
          <>
            {/* Delegations Tab */}
            {tab === 'delegations' && (
              <>
                {delegations.length === 0 ? (
                  <View style={s.emptyState}>
                    <Text style={s.emptyText}>No active delegations. Go to Validators tab to stake OTK.</Text>
                  </View>
                ) : (
                  delegations.map((d, i) => (
                    <View key={i} style={s.delegationCard}>
                      <Text style={s.delegationName}>{d.validatorMoniker}</Text>
                      <View style={s.delegationRow}>
                        <Text style={s.delegationLabel}>Staked</Text>
                        <Text style={s.delegationValue}>{d.amount} OTK</Text>
                      </View>
                      <View style={s.delegationRow}>
                        <Text style={s.delegationLabel}>Rewards</Text>
                        <Text style={s.rewardsValue}>{d.rewards} OTK</Text>
                      </View>
                      <View style={s.delegationRow}>
                        <Text style={s.delegationLabel}>Since</Text>
                        <Text style={s.delegationValue}>{d.since}</Text>
                      </View>
                      <View style={s.actionRow}>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: t.accent.blue }]}
                          onPress={() => {
                            const v = validators.find(v => v.address === d.validatorAddress);
                            if (v) { setSelectedValidator(v); setView('validator-detail'); }
                          }}
                        >
                          <Text style={s.actionBtnText}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: t.accent.orange }]}
                          onPress={() => Alert.alert('Claim Rewards', `Claiming ${d.rewards} OTK from ${d.validatorMoniker}...`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Claim', onPress: () => Alert.alert('Success', 'Rewards claimed.') },
                          ])}
                        >
                          <Text style={s.actionBtnText}>Claim</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* Validators Tab */}
            {tab === 'validators' && (
              <>
                <TextInput
                  style={s.searchBar}
                  placeholder="Search validators..."
                  placeholderTextColor={t.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <View style={s.sortRow}>
                  {([
                    ['votingPower', 'Voting Power'],
                    ['commission', 'Commission'],
                    ['uptime', 'Uptime'],
                    ['apy', 'APY'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <TouchableOpacity
                      key={field}
                      style={[s.sortChip, sortField === field && s.sortChipActive]}
                      onPress={() => setSortField(field)}
                    >
                      <Text style={[s.sortChipText, sortField === field && s.sortChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filteredValidators.map(v => {
                  const statusColor = v.status === 'active' ? t.accent.green : v.status === 'jailed' ? t.accent.red : t.accent.yellow;
                  return (
                    <TouchableOpacity key={v.address} style={s.validatorCard} onPress={() => { setSelectedValidator(v); setView('validator-detail'); }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.validatorName}>{v.moniker}</Text>
                        <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[s.statusText, { color: statusColor }]}>{v.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={s.validatorRow}>
                        <Text style={s.validatorLabel}>Voting Power</Text>
                        <Text style={s.validatorValue}>{v.votingPower.toLocaleString()} OTK</Text>
                      </View>
                      <View style={s.validatorRow}>
                        <Text style={s.validatorLabel}>Commission</Text>
                        <Text style={s.validatorValue}>{v.commission}%</Text>
                      </View>
                      <View style={s.validatorRow}>
                        <Text style={s.validatorLabel}>Uptime</Text>
                        <Text style={[s.validatorValue, { color: v.uptime >= 99 ? t.accent.green : v.uptime >= 95 ? t.accent.yellow : t.accent.red }]}>{v.uptime}%</Text>
                      </View>
                      <View style={s.validatorRow}>
                        <Text style={s.validatorLabel}>Est. APY</Text>
                        <Text style={[s.validatorValue, { color: t.accent.green }]}>{v.apy}%</Text>
                      </View>
                      <View style={s.validatorRow}>
                        <Text style={s.validatorLabel}>Delegators</Text>
                        <Text style={s.validatorValue}>{v.delegators}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Undelegating Tab */}
            {tab === 'undelegating' && (
              <>
                {undelegations.length === 0 ? (
                  <View style={s.emptyState}>
                    <Text style={s.emptyText}>No pending unbonding. When you undelegate, tokens take 21 days to become available.</Text>
                  </View>
                ) : (
                  undelegations.map((u, i) => (
                    <View key={i} style={s.undelegationCard}>
                      <Text style={s.delegationName}>{u.validatorMoniker}</Text>
                      <View style={s.delegationRow}>
                        <Text style={s.delegationLabel}>Unbonding Amount</Text>
                        <Text style={s.delegationValue}>{u.amount} OTK</Text>
                      </View>
                      <Text style={s.countdown}>{getCountdown(u.completionTime)}</Text>
                      <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 4 }}>
                        Completes: {new Date(u.completionTime).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
