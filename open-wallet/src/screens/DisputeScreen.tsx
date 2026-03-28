/**
 * Dispute Resolution Screen — For arbiters to resolve escrow disputes.
 *
 * View assigned disputes, review details from both parties,
 * and resolve by releasing to seller or refunding buyer.
 * Demo mode provides sample disputes.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

interface DisputeCase {
  id: string;
  escrowId: string;
  seller: string;
  buyer: string;
  amount: number;
  denom: string;
  description: string;
  sellerMessage: string;
  buyerMessage: string;
  status: 'pending' | 'resolved_seller' | 'resolved_buyer';
  raisedAt: string;
  resolvedAt?: string;
}

type DisputeView = 'list' | 'detail' | 'history';

const DEMO_DISPUTES: DisputeCase[] = [
  {
    id: 'dispute-1', escrowId: 'escrow-104-4',
    seller: 'openchain1mno...seller3', buyer: 'openchain1def...buyer',
    amount: 1500, denom: 'USDT',
    description: 'Translation services — English to Hindi',
    sellerMessage: 'I delivered all 50 pages of translated documents on time. The buyer accepted delivery but now claims the quality is poor without providing specifics.',
    buyerMessage: 'The translation quality was below the agreed standard. Multiple paragraphs had grammatical errors and incorrect terminology. I requested revisions but the seller refused.',
    status: 'pending', raisedAt: '2026-03-22 14:30',
  },
  {
    id: 'dispute-2', escrowId: 'escrow-201-1',
    seller: 'openchain1xyz...seller4', buyer: 'openchain1uvw...buyer4',
    amount: 3000, denom: 'OTK',
    description: 'Mobile app UI mockups — 10 screens',
    sellerMessage: 'I delivered 10 high-fidelity screens as specified. The buyer wants additional screens that were not in the original agreement.',
    buyerMessage: 'The mockups do not match the design brief I provided. Missing key features like dark mode and accessibility variants that were discussed before escrow creation.',
    status: 'pending', raisedAt: '2026-03-26 09:15',
  },
  {
    id: 'dispute-3', escrowId: 'escrow-150-2',
    seller: 'openchain1aaa...seller5', buyer: 'openchain1bbb...buyer5',
    amount: 0.5, denom: 'ETH',
    description: 'Smart contract development — ERC-20 token',
    sellerMessage: 'Contract was deployed and tested. All functions work as specified.',
    buyerMessage: 'The contract had a critical bug in the transfer function that was discovered after deployment.',
    status: 'resolved_buyer', raisedAt: '2026-03-15 11:00', resolvedAt: '2026-03-17 16:00',
  },
  {
    id: 'dispute-4', escrowId: 'escrow-160-3',
    seller: 'openchain1ccc...seller6', buyer: 'openchain1ddd...buyer6',
    amount: 800, denom: 'SOL',
    description: 'Backend API development — REST endpoints',
    sellerMessage: 'All 12 endpoints delivered with documentation and tests passing.',
    buyerMessage: 'Only 8 endpoints were delivered. Missing 4 critical endpoints for user management.',
    status: 'resolved_seller', raisedAt: '2026-03-12 08:00', resolvedAt: '2026-03-14 12:00',
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  resolved_seller: 'Released to Seller',
  resolved_buyer: 'Refunded to Buyer',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  resolved_seller: '#10B981',
  resolved_buyer: '#8B5CF6',
};

export function DisputeScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [view, setView] = useState<DisputeView>('list');
  const [disputes] = useState<DisputeCase[]>(DEMO_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [loading, setLoading] = useState(false);

  const pendingDisputes = useMemo(() => disputes.filter((d) => d.status === 'pending'), [disputes]);
  const resolvedDisputes = useMemo(() => disputes.filter((d) => d.status !== 'pending'), [disputes]);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: '#fff' },
    amountText: { color: t.text.primary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
    descText: { color: t.text.secondary, fontSize: 13, marginBottom: 8, lineHeight: 18 },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.bg.card },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
    messageCard: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
    messageSender: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    messageText: { color: t.text.primary, fontSize: 14, lineHeight: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border },
    detailLabel: { color: t.text.secondary, fontSize: 13 },
    detailValue: { color: t.text.primary, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
    btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
    btnPrimary: { backgroundColor: t.accent.green },
    btnDanger: { backgroundColor: t.accent.red },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    warningCard: { backgroundColor: t.accent.yellow + '15', borderRadius: 12, padding: 14, marginBottom: 16 },
    warningText: { color: t.accent.yellow, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  }), [t]);

  const handleResolve = useCallback((dispute: DisputeCase, releaseToSeller: boolean) => {
    const action = releaseToSeller ? 'release funds to the seller' : 'refund the buyer';
    Alert.alert(
      'Resolve Dispute',
      `Are you sure you want to ${action}? This action is final and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: releaseToSeller ? 'Release to Seller' : 'Refund Buyer',
          style: releaseToSeller ? 'default' : 'destructive',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert(
                'Dispute Resolved',
                releaseToSeller
                  ? `${dispute.amount} ${dispute.denom} released to seller.`
                  : `${dispute.amount} ${dispute.denom} refunded to buyer.`
              );
              setSelectedDispute(null);
              setView('list');
            }, 1200);
          },
        },
      ]
    );
  }, []);

  const renderDisputeCard = (dispute: DisputeCase, onPress: () => void) => (
    <TouchableOpacity key={dispute.id} style={st.card} onPress={onPress} activeOpacity={0.7}>
      <View style={st.row}>
        <Text style={st.amountText}>{dispute.amount} {dispute.denom}</Text>
        <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[dispute.status] || '#666' }]}>
          <Text style={st.statusText}>{STATUS_LABELS[dispute.status]}</Text>
        </View>
      </View>
      <Text style={st.descText}>{dispute.description}</Text>
      <View style={st.row}>
        <Text style={st.label}>Escrow</Text>
        <Text style={[st.value, { fontSize: 12 }]}>{dispute.escrowId}</Text>
      </View>
      <View style={st.row}>
        <Text style={st.label}>Raised</Text>
        <Text style={st.label}>{dispute.raisedAt}</Text>
      </View>
      {dispute.resolvedAt && (
        <View style={st.row}>
          <Text style={st.label}>Resolved</Text>
          <Text style={st.label}>{dispute.resolvedAt}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ─── Detail View ───
  if (view === 'detail' && selectedDispute) {
    const d = selectedDispute;
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => { setSelectedDispute(null); setView('list'); }}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Dispute Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          {/* Summary */}
          <View style={st.card}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={st.amountText}>{d.amount} {d.denom}</Text>
              <View style={[st.statusBadge, { backgroundColor: STATUS_COLORS[d.status] || '#666' }]}>
                <Text style={st.statusText}>{STATUS_LABELS[d.status]}</Text>
              </View>
            </View>

            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Escrow ID</Text>
              <Text style={st.detailValue}>{d.escrowId}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Description</Text>
              <Text style={st.detailValue}>{d.description}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Seller</Text>
              <Text style={st.detailValue}>{d.seller}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Buyer</Text>
              <Text style={st.detailValue}>{d.buyer}</Text>
            </View>
            <View style={st.detailRow}>
              <Text style={st.detailLabel}>Raised</Text>
              <Text style={st.detailValue}>{d.raisedAt}</Text>
            </View>
            {d.resolvedAt && (
              <View style={st.detailRow}>
                <Text style={st.detailLabel}>Resolved</Text>
                <Text style={st.detailValue}>{d.resolvedAt}</Text>
              </View>
            )}
          </View>

          {/* Messages from parties */}
          <Text style={st.section}>Seller's Statement</Text>
          <View style={[st.messageCard, { borderLeftColor: t.accent.green }]}>
            <Text style={[st.messageSender, { color: t.accent.green }]}>Seller</Text>
            <Text style={st.messageText}>{d.sellerMessage}</Text>
          </View>

          <Text style={st.section}>Buyer's Statement</Text>
          <View style={[st.messageCard, { borderLeftColor: t.accent.blue }]}>
            <Text style={[st.messageSender, { color: t.accent.blue }]}>Buyer</Text>
            <Text style={st.messageText}>{d.buyerMessage}</Text>
          </View>

          {/* Resolution actions */}
          {d.status === 'pending' && (
            <>
              <View style={st.warningCard}>
                <Text style={st.warningText}>
                  Review both statements carefully. Your decision is final and will transfer funds immediately.
                </Text>
              </View>

              <View style={st.actionRow}>
                <TouchableOpacity
                  style={[st.btn, st.btnPrimary, { flex: 1 }]}
                  onPress={() => handleResolve(d, true)}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Release to Seller</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.btn, st.btnDanger, { flex: 1 }]}
                  onPress={() => handleResolve(d, false)}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Refund Buyer</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          {d.status !== 'pending' && (
            <View style={[st.card, { backgroundColor: (STATUS_COLORS[d.status] || '#666') + '20' }]}>
              <Text style={{ color: STATUS_COLORS[d.status], fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                {d.status === 'resolved_seller'
                  ? 'Resolved: Funds released to seller'
                  : 'Resolved: Funds refunded to buyer'}
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── List View ───
  const showHistory = view === 'history';

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
        <Text style={st.title}>Dispute Resolution</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.tabRow}>
          <TouchableOpacity style={[st.tab, !showHistory && st.tabActive]} onPress={() => setView('list')}>
            <Text style={[st.tabText, !showHistory && st.tabTextActive]}>Pending ({pendingDisputes.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.tab, showHistory && st.tabActive]} onPress={() => setView('history')}>
            <Text style={[st.tabText, showHistory && st.tabTextActive]}>Resolved ({resolvedDisputes.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {(showHistory ? resolvedDisputes : pendingDisputes).length === 0 ? (
          <Text style={st.emptyText}>
            {showHistory ? 'No resolved disputes yet.' : 'No pending disputes assigned to you.'}
          </Text>
        ) : (
          (showHistory ? resolvedDisputes : pendingDisputes).map((d) =>
            renderDisputeCard(d, () => { setSelectedDispute(d); setView('detail'); })
          )
        )}

        {!demoMode && pendingDisputes.length === 0 && !showHistory && (
          <View style={[st.card, { alignItems: 'center' }]}>
            <Text style={{ color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Enable Demo Mode in Settings to see sample disputes. Disputes are created when escrow parties raise an issue.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
