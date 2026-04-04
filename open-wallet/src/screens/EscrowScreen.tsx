import { fonts } from '../utils/theme';
/**
 * Escrow Screen — Create, fund, release, and manage on-chain escrows.
 *
 * Supports peer-to-peer trades with dispute resolution.
 * Demo mode provides sample escrows for testing.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface EscrowContract {
  id: string;
  seller: string;
  buyer: string;
  amount: number;
  denom: string;
  description: string;
  status: 'created' | 'funded' | 'released' | 'disputed' | 'refunded' | 'expired';
  arbiter: string;
  createdAt: string;
  expiresAt: string;
  fundedAt?: string;
  releasedAt?: string;
}

type EscrowView = 'list' | 'create' | 'detail' | 'history';

const DEMO_ESCROWS: EscrowContract[] = [
  {
    id: 'escrow-101-1', seller: 'openchain1abc...seller', buyer: 'openchain1def...buyer',
    amount: 5000, denom: 'OTK', description: 'Web design for community portal',
    status: 'funded', arbiter: 'openchain1arb...judge1',
    createdAt: '2026-03-25 10:00', expiresAt: '2026-04-25 10:00', fundedAt: '2026-03-25 12:00',
  },
  {
    id: 'escrow-102-2', seller: 'openchain1ghi...seller2', buyer: 'openchain1def...buyer',
    amount: 250, denom: 'SOL', description: 'Smart contract audit services',
    status: 'created', arbiter: 'openchain1arb...judge2',
    createdAt: '2026-03-27 14:00', expiresAt: '2026-04-27 14:00',
  },
  {
    id: 'escrow-103-3', seller: 'openchain1abc...seller', buyer: 'openchain1jkl...buyer2',
    amount: 0.1, denom: 'BTC', description: 'Logo design + brand kit',
    status: 'released', arbiter: '',
    createdAt: '2026-03-10 08:00', expiresAt: '2026-04-10 08:00',
    fundedAt: '2026-03-10 09:00', releasedAt: '2026-03-18 16:00',
  },
  {
    id: 'escrow-104-4', seller: 'openchain1mno...seller3', buyer: 'openchain1def...buyer',
    amount: 1500, denom: 'USDT', description: 'Translation services — English to Hindi',
    status: 'disputed', arbiter: 'openchain1arb...judge1',
    createdAt: '2026-03-20 09:00', expiresAt: '2026-04-20 09:00', fundedAt: '2026-03-20 10:00',
  },
  {
    id: 'escrow-105-5', seller: 'openchain1abc...seller', buyer: 'openchain1pqr...buyer3',
    amount: 10000, denom: 'OTK', description: 'Open-source module contribution',
    status: 'expired', arbiter: 'openchain1arb...judge2',
    createdAt: '2026-02-01 12:00', expiresAt: '2026-03-01 12:00',
  },
];

const STATUS_COLORS: Record<string, string> = {
  created: '#3B82F6',
  funded: '#F59E0B',
  released: '#10B981',
  disputed: '#EF4444',
  refunded: '#8B5CF6',
  expired: '#6B7280',
};

export function EscrowScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [view, setView] = useState<EscrowView>('list');
  const [escrows] = useState<EscrowContract[]>(DEMO_ESCROWS);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowContract | null>(null);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [buyerAddr, setBuyerAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [denom, setDenom] = useState('OTK');
  const [description, setDescription] = useState('');
  const [arbiterAddr, setArbiterAddr] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');

  const activeEscrows = useMemo(() =>
    escrows.filter((e) => ['created', 'funded', 'disputed'].includes(e.status)),
    [escrows]
  );
  const historyEscrows = useMemo(() =>
    escrows.filter((e) => ['released', 'refunded', 'expired'].includes(e.status)),
    [escrows]
  );

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: t.text.secondary, fontSize: fonts.sm },
    value: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.bold, textTransform: 'uppercase', color: '#fff' },
    descText: { color: t.text.secondary, fontSize: fonts.sm, marginBottom: 8, lineHeight: 18 },
    amountText: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.bold, marginBottom: 4 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: fonts.md, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 4, marginLeft: 4 },
    btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimary: { backgroundColor: t.accent.green },
    btnDanger: { backgroundColor: t.accent.red },
    btnSecondary: { backgroundColor: t.accent.blue },
    btnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    denomRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    denomChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: t.bg.card, borderWidth: 1, borderColor: t.border },
    denomActive: { backgroundColor: t.accent.green, borderColor: t.accent.green },
    denomText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    denomTextActive: { color: '#fff' },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', paddingVertical: 40 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.secondary, fontSize: fonts.sm },
    detailValue: { color: t.text.primary, fontSize: fonts.sm, fontWeight: fonts.semibold, maxWidth: '60%', textAlign: 'right' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  }), [t]);

  const handleCreate = useCallback(() => {
    if (!buyerAddr.trim() || !amount.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please fill in buyer address, amount, and description.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Escrow Created', `Escrow for ${amount} ${denom} created successfully. The buyer can now fund it.`);
      setView('list');
      setBuyerAddr('');
      setAmount('');
      setDescription('');
      setArbiterAddr('');
    }, 1200);
  }, [buyerAddr, amount, denom, description]);

  const handleFund = useCallback((escrow: EscrowContract) => {
    Alert.alert('Fund Escrow', `Deposit ${escrow.amount} ${escrow.denom} into escrow?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Fund', onPress: () => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            Alert.alert('Funded', 'Escrow has been funded. Waiting for seller to deliver.');
          }, 1000);
        },
      },
    ]);
  }, []);

  const handleRelease = useCallback((escrow: EscrowContract) => {
    Alert.alert('Release Funds', `Confirm receipt and release ${escrow.amount} ${escrow.denom} to seller?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release', onPress: () => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            Alert.alert('Released', 'Funds have been released to the seller.');
            setSelectedEscrow(null);
            setView('list');
          }, 1000);
        },
      },
    ]);
  }, []);

  const handleDispute = useCallback((escrow: EscrowContract) => {
    if (!escrow.arbiter) {
      Alert.alert('No Arbiter', 'This escrow has no arbiter assigned. Cannot raise a dispute.');
      return;
    }
    Alert.alert('Raise Dispute', 'This will escalate the escrow to the assigned arbiter for resolution. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dispute', style: 'destructive', onPress: () => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            Alert.alert('Disputed', 'Dispute has been raised. The arbiter will review and resolve.');
          }, 1000);
        },
      },
    ]);
  }, []);

  const renderEscrowCard = (escrow: EscrowContract, onPress: () => void) => (
    <TouchableOpacity key={escrow.id} style={st.card} onPress={onPress} activeOpacity={0.7}>
      <View style={st.row}>
        <Text style={st.amountText}>{escrow.amount} {escrow.denom}</Text>
        <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[escrow.status] || '#666' }]}>
          <Text style={st.statusText}>{escrow.status}</Text>
        </View>
      </View>
      <Text style={st.descText}>{escrow.description}</Text>
      <View style={st.row}>
        <Text style={st.label}>Seller</Text>
        <Text style={[st.value, { fontSize: fonts.sm }]}>{escrow.seller.slice(0, 20)}...</Text>
      </View>
      <View style={st.row}>
        <Text style={st.label}>Buyer</Text>
        <Text style={[st.value, { fontSize: fonts.sm }]}>{escrow.buyer.slice(0, 20)}...</Text>
      </View>
      <View style={st.row}>
        <Text style={st.label}>Expires</Text>
        <Text style={st.label}>{escrow.expiresAt}</Text>
      </View>
    </TouchableOpacity>
  );

  // ─── Detail View ───
  if (view === 'detail' && selectedEscrow) {
    const e = selectedEscrow;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => { setSelectedEscrow(null); setView('list'); }}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Escrow Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <View style={st.card}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={st.amountText}>{e.amount} {e.denom}</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[e.status] || '#666' }]}>
                <Text style={st.statusText}>{e.status}</Text>
              </View>
            </View>

            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Escrow ID</Text>
              <Text style={st.detailValue}>{e.id}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Description</Text>
              <Text style={st.detailValue}>{e.description}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Seller</Text>
              <Text style={st.detailValue}>{e.seller}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Buyer</Text>
              <Text style={st.detailValue}>{e.buyer}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Arbiter</Text>
              <Text style={st.detailValue}>{e.arbiter || 'None'}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Created</Text>
              <Text style={st.detailValue}>{e.createdAt}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Expires</Text>
              <Text style={st.detailValue}>{e.expiresAt}</Text>
            </View>
            {e.fundedAt && (
              <View style={st.detailRow}>
                <Text style={st.detailLabel}>Funded</Text>
                <Text style={st.detailValue}>{e.fundedAt}</Text>
              </View>
            )}
            {e.releasedAt && (
              <View style={st.detailRow}>
                <Text style={st.detailLabel}>Released</Text>
                <Text style={st.detailValue}>{e.releasedAt}</Text>
              </View>
            )}
          </View>

          {/* Actions based on status */}
          {e.status === 'created' && (
            <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={() => handleFund(e)} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Fund Escrow</Text>}
            </TouchableOpacity>
          )}
          {e.status === 'funded' && (
            <View style={st.actionRow}>
              <TouchableOpacity style={[st.btn, st.btnPrimary, { flex: 1 }]} onPress={() => handleRelease(e)} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Release Funds</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[st.btn, st.btnDanger, { flex: 1 }]} onPress={() => handleDispute(e)} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Raise Dispute</Text>}
              </TouchableOpacity>
            </View>
          )}
          {e.status === 'disputed' && (
            <View style={[st.card, { backgroundColor: STATUS_COLORS.disputed + '20' }]}>
              <Text style={{ color: STATUS_COLORS.disputed, fontSize: fonts.md, fontWeight: fonts.semibold, textAlign: 'center' }}>
                Dispute in progress — awaiting arbiter resolution
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Create View ───
  if (view === 'create') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Text style={st.closeBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={st.title}>New Escrow</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.inputLabel}>Buyer Address</Text>
          <TextInput
            style={st.input} placeholder="openchain1..." placeholderTextColor={t.text.muted}
            value={buyerAddr} onChangeText={setBuyerAddr} autoCapitalize="none"
          />

          <Text style={st.inputLabel}>Token</Text>
          <View style={st.denomRow}>
            {['OTK', 'SOL', 'ETH', 'BTC', 'USDT'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[st.denomChip, denom === d && st.denomActive]}
                onPress={() => setDenom(d)}
              >
                <Text style={[st.denomText, denom === d && st.denomTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.inputLabel}>Amount</Text>
          <TextInput
            style={st.input} placeholder="0.00" placeholderTextColor={t.text.muted}
            value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
          />

          <Text style={st.inputLabel}>Description</Text>
          <TextInput
            style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="What is this escrow for?" placeholderTextColor={t.text.muted}
            value={description} onChangeText={setDescription} multiline
          />

          <Text style={st.inputLabel}>Arbiter Address (optional)</Text>
          <TextInput
            style={st.input} placeholder="openchain1... (dispute resolver)" placeholderTextColor={t.text.muted}
            value={arbiterAddr} onChangeText={setArbiterAddr} autoCapitalize="none"
          />

          <Text style={st.inputLabel}>Expiry (days)</Text>
          <TextInput
            style={st.input} placeholder="30" placeholderTextColor={t.text.muted}
            value={expiryDays} onChangeText={setExpiryDays} keyboardType="number-pad"
          />

          <TouchableOpacity style={[st.btn, st.btnPrimary, { marginTop: 8 }]} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Create Escrow</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── List View (default) ───
  const showHistory = view === 'history';

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
        <Text style={st.title}>Escrow</Text>
        <TouchableOpacity onPress={() => setView('create')}>
          <Text style={[st.closeBtn, { fontWeight: fonts.bold }]}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.tabRow}>
          <TouchableOpacity style={[st.tab, !showHistory && st.tabActive]} onPress={() => setView('list')}>
            <Text style={[st.tabText, !showHistory && st.tabTextActive]}>Active ({activeEscrows.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.tab, showHistory && st.tabActive]} onPress={() => setView('history')}>
            <Text style={[st.tabText, showHistory && st.tabTextActive]}>History ({historyEscrows.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {(showHistory ? historyEscrows : activeEscrows).length === 0 ? (
          <Text style={st.emptyText}>
            {showHistory ? 'No completed escrows yet.' : 'No active escrows. Create one to get started.'}
          </Text>
        ) : (
          (showHistory ? historyEscrows : activeEscrows).map((e) =>
            renderEscrowCard(e, () => { setSelectedEscrow(e); setView('detail'); })
          )
        )}

        {!demoMode && activeEscrows.length === 0 && !showHistory && (
          <View style={[st.card, { alignItems: 'center' }]}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', lineHeight: 20 }}>
              Enable Demo Mode in Settings to see sample escrows, or create a new escrow to get started with real trades.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
