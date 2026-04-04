import { fonts } from '../utils/theme';
/**
 * Advanced Alerts Screen — Percentage change, portfolio value, volume,
 * and multi-condition alerts with demo mode and notification triggers.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

export type AlertType = 'pct-change' | 'portfolio-value' | 'volume' | 'multi-condition';

export interface AdvancedAlert {
  id: string;
  type: AlertType;
  name: string;
  conditions: AlertCondition[];
  operator: 'AND' | 'OR'; // for multi-condition
  enabled: boolean;
  triggered: boolean;
  lastChecked: number | null;
  createdAt: number;
}

export interface AlertCondition {
  symbol?: string;
  metric: 'price-pct' | 'portfolio-total' | 'volume-24h' | 'price-above' | 'price-below';
  threshold: number;
  timeframe?: '1h' | '4h' | '24h'; // for pct change
  direction?: 'above' | 'below' | 'drop' | 'rise';
}

// ─── Demo Alerts ───

const DEMO_ALERTS: AdvancedAlert[] = [
  {
    id: 'demo-1',
    type: 'pct-change',
    name: 'BTC drops 5% in 1 hour',
    conditions: [{ symbol: 'BTC', metric: 'price-pct', threshold: 5, timeframe: '1h', direction: 'drop' }],
    operator: 'AND',
    enabled: true,
    triggered: false,
    lastChecked: Date.now() - 60000,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'demo-2',
    type: 'portfolio-value',
    name: 'Portfolio below $10,000',
    conditions: [{ metric: 'portfolio-total', threshold: 10000, direction: 'below' }],
    operator: 'AND',
    enabled: true,
    triggered: true,
    lastChecked: Date.now() - 120000,
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'demo-3',
    type: 'volume',
    name: 'SOL 24h volume exceeds $1B',
    conditions: [{ symbol: 'SOL', metric: 'volume-24h', threshold: 1000000000, direction: 'above' }],
    operator: 'AND',
    enabled: true,
    triggered: false,
    lastChecked: Date.now() - 300000,
    createdAt: Date.now() - 259200000,
  },
  {
    id: 'demo-4',
    type: 'multi-condition',
    name: 'BTC > $100k AND ETH > $5k',
    conditions: [
      { symbol: 'BTC', metric: 'price-above', threshold: 100000 },
      { symbol: 'ETH', metric: 'price-above', threshold: 5000 },
    ],
    operator: 'AND',
    enabled: true,
    triggered: false,
    lastChecked: Date.now() - 180000,
    createdAt: Date.now() - 345600000,
  },
  {
    id: 'demo-5',
    type: 'pct-change',
    name: 'ETH rises 10% in 24h',
    conditions: [{ symbol: 'ETH', metric: 'price-pct', threshold: 10, timeframe: '24h', direction: 'rise' }],
    operator: 'AND',
    enabled: false,
    triggered: true,
    lastChecked: Date.now() - 600000,
    createdAt: Date.now() - 432000000,
  },
];

// ─── Alert Type Config ───

const ALERT_TYPE_CONFIG: { key: AlertType; label: string; icon: string; description: string }[] = [
  { key: 'pct-change', label: 'Price Change %', icon: '%', description: 'Alert on percentage price change in a timeframe' },
  { key: 'portfolio-value', label: 'Portfolio Value', icon: '$', description: 'Alert when total portfolio crosses a threshold' },
  { key: 'volume', label: 'Volume Alert', icon: 'V', description: 'Alert when 24h trading volume crosses a threshold' },
  { key: 'multi-condition', label: 'Multi-Condition', icon: '&', description: 'Combine multiple conditions with AND/OR' },
];

const TOKENS = ['BTC', 'ETH', 'SOL', 'ATOM', 'ADA', 'USDC', 'OTK'];
const TIMEFRAMES: { key: '1h' | '4h' | '24h'; label: string }[] = [
  { key: '1h', label: '1 Hour' },
  { key: '4h', label: '4 Hours' },
  { key: '24h', label: '24 Hours' },
];

// ─── Main Screen ───

export const AdvancedAlertsScreen = React.memo(({ onClose }: { onClose: () => void }) => {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const [alerts, setAlerts] = useState<AdvancedAlert[]>(demoMode ? DEMO_ALERTS : []);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newType, setNewType] = useState<AlertType>('pct-change');
  const [newSymbol, setNewSymbol] = useState('BTC');
  const [newThreshold, setNewThreshold] = useState('');
  const [newTimeframe, setNewTimeframe] = useState<'1h' | '4h' | '24h'>('1h');
  const [newDirection, setNewDirection] = useState<'above' | 'below' | 'drop' | 'rise'>('drop');
  const [newOperator, setNewOperator] = useState<'AND' | 'OR'>('AND');

  // Multi-condition: second condition
  const [newSymbol2, setNewSymbol2] = useState('ETH');
  const [newThreshold2, setNewThreshold2] = useState('');
  const [newDirection2, setNewDirection2] = useState<'above' | 'below'>('above');

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const createAlert = useCallback(() => {
    const threshold = parseFloat(newThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert('Invalid', 'Enter a valid threshold value.');
      return;
    }

    let name = '';
    const conditions: AlertCondition[] = [];

    switch (newType) {
      case 'pct-change': {
        const dirLabel = newDirection === 'drop' ? 'drops' : 'rises';
        name = `${newSymbol} ${dirLabel} ${threshold}% in ${newTimeframe}`;
        conditions.push({
          symbol: newSymbol,
          metric: 'price-pct',
          threshold,
          timeframe: newTimeframe,
          direction: newDirection,
        });
        break;
      }
      case 'portfolio-value': {
        const dirLabel = newDirection === 'below' ? 'below' : 'above';
        name = `Portfolio ${dirLabel} $${threshold.toLocaleString()}`;
        conditions.push({
          metric: 'portfolio-total',
          threshold,
          direction: newDirection === 'below' || newDirection === 'drop' ? 'below' : 'above',
        });
        break;
      }
      case 'volume': {
        const formatted = threshold >= 1e9 ? `$${(threshold / 1e9).toFixed(1)}B` : threshold >= 1e6 ? `$${(threshold / 1e6).toFixed(0)}M` : `$${threshold.toLocaleString()}`;
        name = `${newSymbol} 24h volume exceeds ${formatted}`;
        conditions.push({
          symbol: newSymbol,
          metric: 'volume-24h',
          threshold,
          direction: 'above',
        });
        break;
      }
      case 'multi-condition': {
        const threshold2 = parseFloat(newThreshold2);
        if (isNaN(threshold2) || threshold2 <= 0) {
          Alert.alert('Invalid', 'Enter a valid second threshold.');
          return;
        }
        const dir1 = newDirection === 'above' || newDirection === 'rise' ? 'above' : 'below';
        const dir2Label = newDirection2 === 'above' ? '>' : '<';
        const dir1Label = dir1 === 'above' ? '>' : '<';
        name = `${newSymbol} ${dir1Label} $${threshold.toLocaleString()} ${newOperator} ${newSymbol2} ${dir2Label} $${threshold2.toLocaleString()}`;
        conditions.push(
          { symbol: newSymbol, metric: dir1 === 'above' ? 'price-above' : 'price-below', threshold },
          { symbol: newSymbol2, metric: newDirection2 === 'above' ? 'price-above' : 'price-below', threshold: threshold2 },
        );
        break;
      }
    }

    const newAlert: AdvancedAlert = {
      id: Date.now().toString(),
      type: newType,
      name,
      conditions,
      operator: newOperator,
      enabled: true,
      triggered: false,
      lastChecked: null,
      createdAt: Date.now(),
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setShowCreate(false);
    setNewThreshold('');
    setNewThreshold2('');
  }, [newType, newSymbol, newThreshold, newTimeframe, newDirection, newOperator, newSymbol2, newThreshold2, newDirection2]);

  const getTypeIcon = (type: AlertType): string => {
    const cfg = ALERT_TYPE_CONFIG.find((c) => c.key === type);
    return cfg?.icon ?? '?';
  };

  const getTypeColor = (type: AlertType): string => {
    switch (type) {
      case 'pct-change': return t.accent.orange;
      case 'portfolio-value': return t.accent.blue;
      case 'volume': return t.accent.purple;
      case 'multi-condition': return t.accent.green;
    }
  };

  const formatTimeSince = (ts: number | null): string => {
    if (!ts) return 'Never';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy },
    addBtn: { color: t.accent.green, fontSize: 15, fontWeight: fonts.bold },
    // Create form
    form: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
    formTitle: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
    typeChip: { backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeActive: { borderWidth: 2, borderColor: t.accent.green },
    typeIcon: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    typeIconText: { color: '#fff', fontSize: 11, fontWeight: fonts.heavy },
    typeText: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold },
    typeTextActive: { color: t.accent.green },
    fieldLabel: { color: t.text.muted, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 6, marginTop: 10 },
    tokenRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    tokenChip: { backgroundColor: t.bg.primary, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    tokenActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: 13 },
    tokenTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginTop: 6 },
    dirRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    dirBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    dirActive: { backgroundColor: t.accent.green + '20' },
    dirActiveRed: { backgroundColor: t.accent.red + '20' },
    dirText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.semibold },
    dirTextActive: { color: t.accent.green },
    dirTextActiveRed: { color: t.accent.red },
    opRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    opBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    opActive: { backgroundColor: t.accent.blue + '20' },
    opText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.bold },
    opTextActive: { color: t.accent.blue },
    saveBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    saveBtnText: { color: t.bg.primary, fontSize: 15, fontWeight: fonts.bold },
    // Alert rows
    alertCard: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 10 },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    alertTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    alertTagDot: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    alertTagText: { fontSize: 11, fontWeight: fonts.bold },
    alertName: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold },
    alertMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    alertStatus: { fontSize: 12, fontWeight: fonts.semibold },
    alertChecked: { color: t.text.muted, fontSize: 11 },
    alertActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    deleteBtn: { color: t.accent.red, fontSize: 16, fontWeight: fonts.bold },
    // Empty
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { color: t.text.secondary, fontSize: 17, fontWeight: fonts.bold },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
    demoTag: { color: t.accent.yellow, fontSize: 11, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8, marginTop: 4 },
    conditionSep: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.heavy, textAlign: 'center', marginVertical: 8 },
  }), [t]);

  const renderAlert = useCallback(({ item }: { item: AdvancedAlert }) => {
    const typeColor = getTypeColor(item.type);
    return (
      <View style={s.alertCard}>
        <View style={s.alertHeader}>
          <View style={{ flex: 1 }}>
            <View style={s.alertTypeTag}>
              <View style={[s.alertTagDot, { backgroundColor: typeColor }]}>
                <Text style={s.typeIconText}>{getTypeIcon(item.type)}</Text>
              </View>
              <Text style={[s.alertTagText, { color: typeColor }]}>
                {ALERT_TYPE_CONFIG.find((c) => c.key === item.type)?.label ?? item.type}
              </Text>
            </View>
            <Text style={s.alertName}>{item.name}</Text>
          </View>
          <View style={s.alertActions}>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleAlert(item.id)}
              trackColor={{ false: '#333', true: t.accent.green + '40' }}
              thumbColor={item.enabled ? t.accent.green : '#666'}
            />
            <TouchableOpacity onPress={() => deleteAlert(item.id)}>
              <Text style={s.deleteBtn}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.alertMeta}>
          <Text style={[s.alertStatus, { color: item.triggered ? t.accent.green : item.enabled ? t.accent.blue : t.text.muted }]}>
            {item.triggered ? 'Triggered' : item.enabled ? 'Active' : 'Paused'}
          </Text>
          <Text style={s.alertChecked}>Last checked: {formatTimeSince(item.lastChecked)}</Text>
        </View>
      </View>
    );
  }, [s, t, toggleAlert, deleteAlert]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Advanced Alerts</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Text style={s.addBtn}>{showCreate ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {demoMode && <Text style={s.demoTag}>DEMO MODE</Text>}

      {showCreate && (
        <View style={s.form}>
          <Text style={s.formTitle}>Create Alert</Text>

          {/* Alert Type Selector */}
          <View style={s.typeRow}>
            {ALERT_TYPE_CONFIG.map((cfg) => (
              <TouchableOpacity
                key={cfg.key}
                style={[s.typeChip, newType === cfg.key && s.typeActive]}
                onPress={() => setNewType(cfg.key)}
              >
                <View style={[s.typeIcon, { backgroundColor: getTypeColor(cfg.key) }]}>
                  <Text style={s.typeIconText}>{cfg.icon}</Text>
                </View>
                <Text style={[s.typeText, newType === cfg.key && s.typeTextActive]}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Token selector (for non-portfolio types) */}
          {newType !== 'portfolio-value' && (
            <>
              <Text style={s.fieldLabel}>Token{newType === 'multi-condition' ? ' (Condition 1)' : ''}</Text>
              <View style={s.tokenRow}>
                {TOKENS.map((sym) => (
                  <TouchableOpacity
                    key={sym}
                    style={[s.tokenChip, newSymbol === sym && s.tokenActive]}
                    onPress={() => setNewSymbol(sym)}
                  >
                    <Text style={[s.tokenText, newSymbol === sym && s.tokenTextActive]}>{sym}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Threshold */}
          <Text style={s.fieldLabel}>
            {newType === 'pct-change' ? 'Percentage (%)' :
             newType === 'volume' ? 'Volume (USD)' :
             newType === 'multi-condition' ? 'Price (USD) - Condition 1' :
             'Portfolio Value (USD)'}
          </Text>
          <TextInput
            style={s.input}
            placeholder={newType === 'pct-change' ? 'e.g. 5' : newType === 'volume' ? 'e.g. 1000000000' : 'e.g. 100000'}
            placeholderTextColor={t.text.muted}
            value={newThreshold}
            onChangeText={setNewThreshold}
            keyboardType="decimal-pad"
          />

          {/* Direction */}
          {newType === 'pct-change' && (
            <>
              <Text style={s.fieldLabel}>Direction</Text>
              <View style={s.dirRow}>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'drop' && s.dirActiveRed]}
                  onPress={() => setNewDirection('drop')}
                >
                  <Text style={[s.dirText, newDirection === 'drop' && s.dirTextActiveRed]}>Drop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'rise' && s.dirActive]}
                  onPress={() => setNewDirection('rise')}
                >
                  <Text style={[s.dirText, newDirection === 'rise' && s.dirTextActive]}>Rise</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Timeframe</Text>
              <View style={s.dirRow}>
                {TIMEFRAMES.map((tf) => (
                  <TouchableOpacity
                    key={tf.key}
                    style={[s.dirBtn, newTimeframe === tf.key && s.dirActive]}
                    onPress={() => setNewTimeframe(tf.key)}
                  >
                    <Text style={[s.dirText, newTimeframe === tf.key && s.dirTextActive]}>{tf.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {newType === 'portfolio-value' && (
            <>
              <Text style={s.fieldLabel}>Trigger When</Text>
              <View style={s.dirRow}>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'below' && s.dirActiveRed]}
                  onPress={() => setNewDirection('below')}
                >
                  <Text style={[s.dirText, newDirection === 'below' && s.dirTextActiveRed]}>Below</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'above' && s.dirActive]}
                  onPress={() => setNewDirection('above')}
                >
                  <Text style={[s.dirText, newDirection === 'above' && s.dirTextActive]}>Above</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Multi-condition: second condition */}
          {newType === 'multi-condition' && (
            <>
              <Text style={s.fieldLabel}>Direction (Condition 1)</Text>
              <View style={s.dirRow}>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'above' && s.dirActive]}
                  onPress={() => setNewDirection('above')}
                >
                  <Text style={[s.dirText, newDirection === 'above' && s.dirTextActive]}>Above</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection === 'below' && s.dirActiveRed]}
                  onPress={() => setNewDirection('below')}
                >
                  <Text style={[s.dirText, newDirection === 'below' && s.dirTextActiveRed]}>Below</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Operator</Text>
              <View style={s.opRow}>
                <TouchableOpacity
                  style={[s.opBtn, newOperator === 'AND' && s.opActive]}
                  onPress={() => setNewOperator('AND')}
                >
                  <Text style={[s.opText, newOperator === 'AND' && s.opTextActive]}>AND</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.opBtn, newOperator === 'OR' && s.opActive]}
                  onPress={() => setNewOperator('OR')}
                >
                  <Text style={[s.opText, newOperator === 'OR' && s.opTextActive]}>OR</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Token (Condition 2)</Text>
              <View style={s.tokenRow}>
                {TOKENS.map((sym) => (
                  <TouchableOpacity
                    key={sym}
                    style={[s.tokenChip, newSymbol2 === sym && s.tokenActive]}
                    onPress={() => setNewSymbol2(sym)}
                  >
                    <Text style={[s.tokenText, newSymbol2 === sym && s.tokenTextActive]}>{sym}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Price (USD) - Condition 2</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. 5000"
                placeholderTextColor={t.text.muted}
                value={newThreshold2}
                onChangeText={setNewThreshold2}
                keyboardType="decimal-pad"
              />

              <Text style={s.fieldLabel}>Direction (Condition 2)</Text>
              <View style={s.dirRow}>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection2 === 'above' && s.dirActive]}
                  onPress={() => setNewDirection2('above')}
                >
                  <Text style={[s.dirText, newDirection2 === 'above' && s.dirTextActive]}>Above</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.dirBtn, newDirection2 === 'below' && s.dirActiveRed]}
                  onPress={() => setNewDirection2('below')}
                >
                  <Text style={[s.dirText, newDirection2 === 'below' && s.dirTextActiveRed]}>Below</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={s.saveBtn} onPress={createAlert}>
            <Text style={s.saveBtnText}>Create Alert</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        renderItem={renderAlert}
        contentContainerStyle={alerts.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No Advanced Alerts</Text>
            <Text style={s.emptyHint}>
              Create percentage change, portfolio value, volume, or multi-condition alerts to stay informed.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
});
