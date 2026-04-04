import { fonts } from '../utils/theme';
/**
 * Automation Screen — price-based rules that trigger buy/sell/send actions.
 * "If BTC drops below $80,000, buy $100 worth"
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, Switch, ScrollView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { usePrices } from '../hooks/usePrices';
import {
  type AutomationRule,
  type AutomationExecution,
  getAutomationRules,
  createAutomationRule,
  updateRuleStatus,
  deleteAutomationRule,
  getAutomationHistory,
  getDemoRules,
} from '../core/automation/alerts';

interface Props {
  onClose: () => void;
}

type Tab = 'rules' | 'history';
type Action = AutomationRule['action'];
type Direction = AutomationRule['direction'];

const TOKENS = ['BTC', 'ETH', 'SOL', 'OTK', 'ADA', 'USDC'];
const ACTION_LABELS: Record<Action, string> = { buy: 'Buy', sell: 'Sell', send: 'Send' };
const ACTION_COLORS_KEY: Record<Action, 'green' | 'red' | 'blue'> = { buy: 'green', sell: 'red', send: 'blue' };

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function describeRule(rule: AutomationRule): string {
  const dir = rule.direction === 'above' ? 'rises above' : 'drops below';
  const price = rule.targetPrice < 1
    ? `$${rule.targetPrice}`
    : `$${rule.targetPrice.toLocaleString()}`;

  if (rule.action === 'buy') {
    return `If ${rule.token} ${dir} ${price}, buy $${rule.amount} worth`;
  } else if (rule.action === 'sell') {
    return `If ${rule.token} ${dir} ${price}, sell ${rule.amount}%`;
  } else {
    const to = rule.recipient ? ` to ${rule.recipient.slice(0, 12)}...` : '';
    return `If ${rule.token} ${dir} ${price}, send ${rule.amount} ${rule.token}${to}`;
  }
}

export const AutomationScreen = React.memo(({ onClose }: Props) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const { prices } = usePrices();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [history, setHistory] = useState<AutomationExecution[]>([]);
  const [tab, setTab] = useState<Tab>('rules');
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [direction, setDirection] = useState<Direction>('below');
  const [targetPrice, setTargetPrice] = useState('');
  const [action, setAction] = useState<Action>('buy');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [label, setLabel] = useState('');

  const loadData = useCallback(async () => {
    if (demoMode) {
      setRules(getDemoRules());
      setHistory([]);
      return;
    }
    const [r, h] = await Promise.all([
      getAutomationRules(),
      getAutomationHistory(),
    ]);
    setRules(r);
    setHistory(h);
  }, [demoMode]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = useCallback(async () => {
    const price = parseFloat(targetPrice);
    const amt = parseFloat(amount);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid', 'Enter a valid target price.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    if (action === 'send' && !recipient.trim()) {
      Alert.alert('Missing', 'Enter a recipient address for send action.');
      return;
    }

    await createAutomationRule({
      token: selectedToken,
      direction,
      targetPrice: price,
      action,
      amount: amt,
      recipient: action === 'send' ? recipient.trim() : undefined,
      label: label.trim() || undefined,
    });

    setTargetPrice('');
    setAmount('');
    setRecipient('');
    setLabel('');
    setShowAdd(false);
    loadData();
  }, [selectedToken, direction, targetPrice, action, amount, recipient, label, loadData]);

  const handleToggle = useCallback(async (rule: AutomationRule) => {
    if (demoMode) return;
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    await updateRuleStatus(rule.id, newStatus);
    loadData();
  }, [demoMode, loadData]);

  const handleDelete = useCallback(async (rule: AutomationRule) => {
    if (demoMode) return;
    Alert.alert('Delete Rule', `Delete "${rule.label || describeRule(rule)}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAutomationRule(rule.id);
          loadData();
        },
      },
    ]);
  }, [demoMode, loadData]);

  const activeRules = rules.filter((r) => r.status !== 'triggered');
  const triggeredRules = rules.filter((r) => r.status === 'triggered');
  const currentPrice = prices[selectedToken] ?? 0;

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    addBtn: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    tabTextActive: { color: t.bg.primary },
    addForm: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
    formLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    tokenRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tokenChip: { backgroundColor: t.bg.primary, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    tokenActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: 13 },
    tokenTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    currentPrice: { color: t.text.muted, fontSize: 13, marginBottom: 12 },
    dirRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    dirBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    dirActive: { backgroundColor: t.accent.green + '20' },
    dirActiveRed: { backgroundColor: t.accent.red + '20' },
    dirText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    dirTextActive: { color: t.accent.green },
    dirTextActiveRed: { color: t.accent.red },
    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    actionBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    actionActive: { borderWidth: 2 },
    saveBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { color: t.bg.primary, fontSize: 15, fontWeight: fonts.bold },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardDesc: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, lineHeight: 20, marginBottom: 8 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: fonts.bold },
    cardActions: { flexDirection: 'row', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12, alignItems: 'center' },
    toggleLabel: { color: t.text.secondary, fontSize: 13, marginRight: 4 },
    deleteBtn: { marginLeft: 'auto' },
    deleteBtnText: { color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
    historyRow: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 8 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyAction: { fontSize: 14, fontWeight: fonts.semibold },
    historyDate: { color: t.text.muted, fontSize: 12 },
    historyDetail: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: fonts.semibold },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  }), [t]);

  const renderRule = useCallback(({ item }: { item: AutomationRule }) => {
    const colorKey = ACTION_COLORS_KEY[item.action];
    const isActive = item.status === 'active';

    return (
      <View style={s.card}>
        <Text style={s.cardDesc}>{describeRule(item)}</Text>
        {item.label && (
          <Text style={{ color: t.text.muted, fontSize: 12, marginBottom: 6 }}>{item.label}</Text>
        )}
        <View style={s.cardMeta}>
          <View style={[s.badge, { backgroundColor: t.accent[colorKey] + '20' }]}>
            <Text style={[s.badgeText, { color: t.accent[colorKey] }]}>
              {ACTION_LABELS[item.action].toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: t.text.muted, fontSize: 11 }}>
            Created {formatDate(item.createdAt)}
          </Text>
        </View>

        <View style={s.cardActions}>
          <Text style={s.toggleLabel}>{isActive ? 'Active' : 'Paused'}</Text>
          <Switch
            value={isActive}
            onValueChange={() => handleToggle(item)}
            trackColor={{ false: '#333', true: t.accent.green + '40' }}
            thumbColor={isActive ? t.accent.green : '#666'}
          />
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={s.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [s, t, handleToggle, handleDelete]);

  const renderTriggered = useCallback(({ item }: { item: AutomationRule }) => {
    const colorKey = ACTION_COLORS_KEY[item.action];
    return (
      <View style={[s.card, { opacity: 0.7 }]}>
        <Text style={s.cardDesc}>{describeRule(item)}</Text>
        <View style={s.cardMeta}>
          <View style={[s.badge, { backgroundColor: t.accent[colorKey] + '20' }]}>
            <Text style={[s.badgeText, { color: t.accent[colorKey] }]}>TRIGGERED</Text>
          </View>
          {item.triggeredAt && (
            <Text style={{ color: t.text.muted, fontSize: 11 }}>
              {formatDate(item.triggeredAt)}
            </Text>
          )}
        </View>
      </View>
    );
  }, [s, t]);

  const renderExecution = useCallback(({ item }: { item: AutomationExecution }) => (
    <View style={s.historyRow}>
      <View style={s.historyHeader}>
        <Text style={[s.historyAction, { color: t.accent[ACTION_COLORS_KEY[item.action]] }]}>
          {ACTION_LABELS[item.action]} {item.token}
        </Text>
        <Text style={s.historyDate}>{formatDate(item.executedAt)}</Text>
      </View>
      <Text style={s.historyDetail}>
        Amount: {item.amount} | Price at trigger: ${item.priceAtTrigger.toLocaleString()}
      </Text>
    </View>
  ), [s, t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'<-'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Automation</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtn}>{showAdd ? 'Cancel' : '+ Rule'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'rules' && s.tabActive]} onPress={() => setTab('rules')}>
          <Text style={[s.tabText, tab === 'rules' && s.tabTextActive]}>Rules ({rules.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'history' && s.tabActive]} onPress={() => setTab('history')}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>History ({history.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Add Form */}
      {showAdd && (
        <ScrollView style={{ maxHeight: 500 }}>
          <View style={s.addForm}>
            <Text style={s.formLabel}>Label (optional)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Buy the dip"
              placeholderTextColor={t.text.muted}
              value={label}
              onChangeText={setLabel}
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
            {currentPrice > 0 && (
              <Text style={s.currentPrice}>Current: ${currentPrice.toLocaleString()}</Text>
            )}

            <Text style={s.formLabel}>Condition</Text>
            <View style={s.dirRow}>
              <TouchableOpacity
                style={[s.dirBtn, direction === 'above' && s.dirActive]}
                onPress={() => setDirection('above')}
              >
                <Text style={[s.dirText, direction === 'above' && s.dirTextActive]}>Rises Above</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.dirBtn, direction === 'below' && s.dirActiveRed]}
                onPress={() => setDirection('below')}
              >
                <Text style={[s.dirText, direction === 'below' && s.dirTextActiveRed]}>Drops Below</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.formLabel}>Target Price (USD)</Text>
            <TextInput
              style={s.input}
              placeholder="80000"
              placeholderTextColor={t.text.muted}
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
            />

            <Text style={s.formLabel}>Action</Text>
            <View style={s.actionRow}>
              {(['buy', 'sell', 'send'] as const).map((a) => {
                const colorKey = ACTION_COLORS_KEY[a];
                const isSelected = action === a;
                return (
                  <TouchableOpacity
                    key={a}
                    style={[s.actionBtn, isSelected && { backgroundColor: t.accent[colorKey] + '20', borderWidth: 2, borderColor: t.accent[colorKey] }]}
                    onPress={() => setAction(a)}
                  >
                    <Text style={[s.dirText, isSelected && { color: t.accent[colorKey] }]}>
                      {ACTION_LABELS[a]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.formLabel}>
              {action === 'buy' ? 'Amount (USD)' : action === 'sell' ? 'Percentage to sell' : 'Amount to send'}
            </Text>
            <TextInput
              style={s.input}
              placeholder={action === 'buy' ? '100' : action === 'sell' ? '10' : '1000'}
              placeholderTextColor={t.text.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {action === 'send' && (
              <>
                <Text style={s.formLabel}>Recipient</Text>
                <TextInput
                  style={s.input}
                  placeholder="Wallet address or name"
                  placeholderTextColor={t.text.muted}
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                />
              </>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={handleCreate}>
              <Text style={s.saveBtnText}>Create Rule</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Content */}
      {tab === 'rules' ? (
        <FlatList
          data={[...activeRules, ...triggeredRules]}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) =>
            item.status === 'triggered' ? renderTriggered({ item }) : renderRule({ item })
          }
          ListHeaderComponent={
            triggeredRules.length > 0 && activeRules.length > 0 ? (
              <>
                {activeRules.length > 0 && <Text style={s.sectionLabel}>Active Rules</Text>}
              </>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No automation rules</Text>
              <Text style={s.emptyHint}>
                Create rules to automatically buy, sell, or send tokens when prices hit your targets.
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
              <Text style={s.emptyHint}>Triggered rules and their results will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
});
