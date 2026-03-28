/**
 * Recurring Payments Screen — schedule automatic crypto payments.
 * Create, pause, resume, cancel recurring payments with execution history.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import {
  type RecurringPayment,
  type PaymentExecution,
  getRecurringPayments,
  createRecurringPayment,
  updatePaymentStatus,
  deleteRecurringPayment,
  checkDuePayments,
  markExecuted,
  getExecutionHistory,
  getDemoPayments,
} from '../core/automation/recurring';

interface Props {
  onClose: () => void;
}

type Tab = 'active' | 'history';
type Frequency = RecurringPayment['frequency'];

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const TOKENS = ['USDC', 'USDT', 'SOL', 'BTC', 'ETH', 'OTK'];
const CHAINS: Record<string, string> = {
  USDC: 'ethereum', USDT: 'ethereum', SOL: 'solana',
  BTC: 'bitcoin', ETH: 'ethereum', OTK: 'openchain',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(ts: number): string {
  const diff = ts - Date.now();
  if (diff < 0) return 'Overdue';
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export const RecurringPaymentsScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [history, setHistory] = useState<PaymentExecution[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [showAdd, setShowAdd] = useState(false);
  const [duePayments, setDuePayments] = useState<RecurringPayment[]>([]);

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [label, setLabel] = useState('');

  const loadData = useCallback(async () => {
    if (demoMode) {
      setPayments(getDemoPayments());
      setHistory([]);
      return;
    }
    const [p, h, due] = await Promise.all([
      getRecurringPayments(),
      getExecutionHistory(),
      checkDuePayments(),
    ]);
    setPayments(p);
    setHistory(h);
    setDuePayments(due);
  }, [demoMode]);

  useEffect(() => { loadData(); }, [loadData]);

  // Show alert for due payments
  useEffect(() => {
    if (duePayments.length > 0) {
      Alert.alert(
        'Payments Due',
        `${duePayments.length} recurring payment(s) are due. Review and confirm execution.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Execute All',
            onPress: async () => {
              for (const p of duePayments) {
                await markExecuted(p.id);
              }
              loadData();
            },
          },
        ],
      );
    }
  }, [duePayments, loadData]);

  const handleCreate = useCallback(async () => {
    const amt = parseFloat(amount);
    if (!recipient.trim()) {
      Alert.alert('Missing', 'Enter a recipient address.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }

    const now = Date.now();
    const nextMap: Record<Frequency, number> = {
      daily: now + 86400000,
      weekly: now + 7 * 86400000,
      monthly: now + 30 * 86400000,
    };

    await createRecurringPayment({
      recipient: recipient.trim(),
      amount: amt,
      token: selectedToken,
      chain: CHAINS[selectedToken] ?? 'ethereum',
      frequency,
      nextExecution: nextMap[frequency],
      label: label.trim() || undefined,
    });

    setRecipient('');
    setAmount('');
    setLabel('');
    setShowAdd(false);
    loadData();
  }, [recipient, amount, selectedToken, frequency, label, loadData]);

  const handleToggle = useCallback(async (payment: RecurringPayment) => {
    if (demoMode) return;
    const newStatus = payment.status === 'active' ? 'paused' : 'active';
    await updatePaymentStatus(payment.id, newStatus);
    loadData();
  }, [demoMode, loadData]);

  const handleCancel = useCallback(async (payment: RecurringPayment) => {
    if (demoMode) return;
    Alert.alert('Cancel Payment', `Cancel "${payment.label || payment.recipient}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Payment',
        style: 'destructive',
        onPress: async () => {
          await deleteRecurringPayment(payment.id);
          loadData();
        },
      },
    ]);
  }, [demoMode, loadData]);

  const handleExecute = useCallback(async (payment: RecurringPayment) => {
    if (demoMode) return;
    Alert.alert(
      'Execute Payment',
      `Send ${payment.amount} ${payment.token} to ${payment.recipient.slice(0, 12)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: async () => {
            await markExecuted(payment.id);
            loadData();
          },
        },
      ],
    );
  }, [demoMode, loadData]);

  const activePayments = payments.filter((p) => p.status !== 'cancelled');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    addBtn: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    addForm: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
    formLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    tokenRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tokenChip: { backgroundColor: t.bg.primary, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    tokenActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: 13 },
    tokenTextActive: { color: t.bg.primary, fontWeight: '700' },
    freqRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    freqBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    freqActive: { backgroundColor: t.accent.green + '20' },
    freqText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    freqTextActive: { color: t.accent.green },
    saveBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { color: t.bg.primary, fontSize: 15, fontWeight: '700' },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardLabel: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    cardAmount: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    cardRecipient: { color: t.text.muted, fontSize: 12, marginBottom: 4 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeActive: { backgroundColor: t.accent.green + '20' },
    badgePaused: { backgroundColor: t.accent.yellow + '20' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    badgeTextActive: { color: t.accent.green },
    badgeTextPaused: { color: t.accent.yellow },
    nextDate: { color: t.text.secondary, fontSize: 12 },
    overdueText: { color: t.accent.red, fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12 },
    actionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    actionPause: { backgroundColor: t.accent.yellow + '15' },
    actionResume: { backgroundColor: t.accent.green + '15' },
    actionExecute: { backgroundColor: t.accent.blue + '15' },
    actionCancel: { backgroundColor: t.accent.red + '15' },
    actionText: { fontSize: 13, fontWeight: '600' },
    historyRow: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 8 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyAmount: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    historyDate: { color: t.text.muted, fontSize: 12 },
    historyRecipient: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  }), [t]);

  const renderPayment = useCallback(({ item }: { item: RecurringPayment }) => {
    const isOverdue = item.status === 'active' && item.nextExecution <= Date.now();
    const isPaused = item.status === 'paused';

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardLabel} numberOfLines={1}>
            {item.label || `${item.token} to ${item.recipient.slice(0, 8)}...`}
          </Text>
          <Text style={s.cardAmount}>
            {item.amount} {item.token}
          </Text>
        </View>

        <Text style={s.cardRecipient} numberOfLines={1}>
          To: {item.recipient}
        </Text>

        <View style={s.cardMeta}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={[s.badge, isPaused ? s.badgePaused : s.badgeActive]}>
              <Text style={[s.badgeText, isPaused ? s.badgeTextPaused : s.badgeTextActive]}>
                {isPaused ? 'PAUSED' : FREQUENCY_LABELS[item.frequency]}
              </Text>
            </View>
            <Text style={{ color: t.text.muted, fontSize: 11 }}>
              {item.executionCount} executed
            </Text>
          </View>
          {!isPaused && (
            <Text style={isOverdue ? s.overdueText : s.nextDate}>
              {isOverdue ? 'OVERDUE' : `Next: ${formatRelative(item.nextExecution)}`}
            </Text>
          )}
        </View>

        <View style={s.actions}>
          {item.status === 'active' ? (
            <TouchableOpacity style={[s.actionBtn, s.actionPause]} onPress={() => handleToggle(item)}>
              <Text style={[s.actionText, { color: t.accent.yellow }]}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.actionBtn, s.actionResume]} onPress={() => handleToggle(item)}>
              <Text style={[s.actionText, { color: t.accent.green }]}>Resume</Text>
            </TouchableOpacity>
          )}
          {isOverdue && (
            <TouchableOpacity style={[s.actionBtn, s.actionExecute]} onPress={() => handleExecute(item)}>
              <Text style={[s.actionText, { color: t.accent.blue }]}>Execute</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.actionBtn, s.actionCancel]} onPress={() => handleCancel(item)}>
            <Text style={[s.actionText, { color: t.accent.red }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [s, t, handleToggle, handleCancel, handleExecute]);

  const renderExecution = useCallback(({ item }: { item: PaymentExecution }) => (
    <View style={s.historyRow}>
      <View style={s.historyHeader}>
        <Text style={s.historyAmount}>{item.amount} {item.token}</Text>
        <Text style={s.historyDate}>{formatDate(item.executedAt)}</Text>
      </View>
      <Text style={s.historyRecipient} numberOfLines={1}>To: {item.recipient}</Text>
    </View>
  ), [s]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'<-'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Recurring Payments</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtn}>{showAdd ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'active' && s.tabActive]} onPress={() => setTab('active')}>
          <Text style={[s.tabText, tab === 'active' && s.tabTextActive]}>Active ({activePayments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'history' && s.tabActive]} onPress={() => setTab('history')}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>History ({history.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Add Form */}
      {showAdd && (
        <View style={s.addForm}>
          <Text style={s.formLabel}>Label (optional)</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Monthly rent"
            placeholderTextColor={t.text.muted}
            value={label}
            onChangeText={setLabel}
          />

          <Text style={s.formLabel}>Recipient Address</Text>
          <TextInput
            style={s.input}
            placeholder="Wallet address"
            placeholderTextColor={t.text.muted}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
          />

          <Text style={s.formLabel}>Token</Text>
          <View style={s.tokenRow}>
            {TOKENS.map((tok) => (
              <TouchableOpacity
                key={tok}
                style={[s.tokenChip, selectedToken === tok && s.tokenActive]}
                onPress={() => setSelectedToken(tok)}
              >
                <Text style={[s.tokenText, selectedToken === tok && s.tokenTextActive]}>{tok}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.formLabel}>Amount</Text>
          <TextInput
            style={s.input}
            placeholder="0.00"
            placeholderTextColor={t.text.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={s.formLabel}>Frequency</Text>
          <View style={s.freqRow}>
            {(['daily', 'weekly', 'monthly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.freqBtn, frequency === f && s.freqActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[s.freqText, frequency === f && s.freqTextActive]}>
                  {FREQUENCY_LABELS[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleCreate}>
            <Text style={s.saveBtnText}>Create Recurring Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {tab === 'active' ? (
        <FlatList
          data={activePayments}
          keyExtractor={(p) => p.id}
          renderItem={renderPayment}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No recurring payments</Text>
              <Text style={s.emptyHint}>
                Schedule automatic crypto payments — DCA, rent, donations, and more.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(h) => h.id}
          renderItem={renderExecution}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No execution history</Text>
              <Text style={s.emptyHint}>Executed payments will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
});
