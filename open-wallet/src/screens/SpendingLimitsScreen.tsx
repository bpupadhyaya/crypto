/**
 * Spending Limits Screen — Configure and monitor per-token spending limits.
 *
 * Features:
 * - Set daily/weekly limits per token
 * - Visual progress bars showing usage
 * - Warnings at 80% threshold
 * - Add/edit/remove limits
 * - Demo mode with sample limits
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  type SpendingLimit,
  getSpendingLimits,
  setSpendingLimit,
  removeSpendingLimit,
  getDemoSpendingLimits,
} from '../core/security/spendingLimits';

interface Props {
  onClose: () => void;
}

export const SpendingLimitsScreen = React.memo(({ onClose }: Props) => {
  const t = useTheme();
  const { demoMode } = useWalletStore();
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Add/edit form
  const [formToken, setFormToken] = useState('');
  const [formChain, setFormChain] = useState('');
  const [formMax, setFormMax] = useState('');
  const [formPeriod, setFormPeriod] = useState<'daily' | 'weekly'>('daily');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: 14, marginBottom: 20 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tokenName: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    chainBadge: { backgroundColor: t.border, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8 },
    chainText: { color: t.text.secondary, fontSize: 11, fontWeight: '600' },
    periodBadge: { borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, marginLeft: 6 },
    periodText: { fontSize: 11, fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    label: { color: t.text.secondary, fontSize: 13 },
    value: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    progressContainer: { height: 10, backgroundColor: t.border, borderRadius: 5, marginTop: 8, marginBottom: 4, overflow: 'hidden' },
    progressFill: { height: 10, borderRadius: 5 },
    warningText: { color: t.accent.orange, fontSize: 12, fontWeight: '600', marginTop: 4 },
    blockedText: { color: t.accent.red, fontSize: 12, fontWeight: '700', marginTop: 4 },
    statusText: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 4 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    btnGreen: { flex: 1, backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnRed: { flex: 1, backgroundColor: t.accent.red + '20', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnBlue: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnTextRed: { color: t.accent.red, fontSize: 14, fontWeight: '700' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: t.border },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: t.border },
    periodBtnActive: { backgroundColor: t.accent.blue },
    periodBtnText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    periodBtnTextActive: { color: '#fff' },
    backBtn: { paddingVertical: 20, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
    empty: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    demoTag: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, alignSelf: 'flex-start', marginBottom: 12 },
    demoText: { color: t.accent.purple, fontSize: 11, fontWeight: '700' },
    disabledOverlay: { opacity: 0.5 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  }), [t]);

  // ─── Load Data ───

  const loadData = useCallback(async () => {
    if (demoMode) {
      setLimits(getDemoSpendingLimits());
    } else {
      const loaded = await getSpendingLimits();
      setLimits(loaded);
    }
  }, [demoMode]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Handlers ───

  const resetForm = () => {
    setFormToken(''); setFormChain(''); setFormMax(''); setFormPeriod('daily');
    setShowAdd(false); setEditIndex(null);
  };

  const handleSave = async () => {
    if (!formToken.trim()) { Alert.alert('Error', 'Enter a token symbol'); return; }
    if (!formChain.trim()) { Alert.alert('Error', 'Enter a chain name'); return; }
    const max = parseFloat(formMax);
    if (isNaN(max) || max <= 0) { Alert.alert('Error', 'Enter a valid limit amount'); return; }

    if (demoMode) {
      const newLimit: SpendingLimit = {
        token: formToken.toUpperCase(),
        chain: formChain,
        maxAmount: max,
        period: formPeriod,
        spent: 0,
        lastReset: Date.now(),
        enabled: true,
      };
      if (editIndex !== null) {
        setLimits((prev) => prev.map((l, i) => i === editIndex ? { ...l, maxAmount: max, period: formPeriod } : l));
      } else {
        setLimits((prev) => [...prev, newLimit]);
      }
      resetForm();
      return;
    }

    try {
      const existing = editIndex !== null ? limits[editIndex] : null;
      await setSpendingLimit({
        token: formToken.toUpperCase(),
        chain: formChain,
        maxAmount: max,
        period: formPeriod,
        spent: existing?.spent ?? 0,
        lastReset: existing?.lastReset ?? Date.now(),
        enabled: true,
      });
      resetForm();
      await loadData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleRemove = async (lim: SpendingLimit) => {
    Alert.alert('Remove Limit', `Remove ${lim.period} limit for ${lim.token}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          if (demoMode) {
            setLimits((prev) => prev.filter((l) => !(l.token === lim.token && l.chain === lim.chain && l.period === lim.period)));
            return;
          }
          await removeSpendingLimit(lim.token, lim.chain, lim.period);
          await loadData();
        },
      },
    ]);
  };

  const handleToggle = async (idx: number, enabled: boolean) => {
    if (demoMode) {
      setLimits((prev) => prev.map((l, i) => i === idx ? { ...l, enabled } : l));
      return;
    }
    const lim = limits[idx];
    await setSpendingLimit({ ...lim, enabled });
    await loadData();
  };

  const handleEdit = (idx: number) => {
    const lim = limits[idx];
    setFormToken(lim.token);
    setFormChain(lim.chain);
    setFormMax(String(lim.maxAmount));
    setFormPeriod(lim.period);
    setEditIndex(idx);
    setShowAdd(true);
  };

  // ─── Render Helpers ───

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return t.accent.red;
    if (pct >= 80) return t.accent.orange;
    if (pct >= 50) return t.accent.yellow;
    return t.accent.green;
  };

  const getStatusMessage = (pct: number, remaining: number, token: string) => {
    if (pct >= 100) return { text: `Limit reached - transactions blocked`, style: s.blockedText };
    if (pct >= 80) return { text: `Warning: ${remaining.toFixed(4)} ${token} remaining`, style: s.warningText };
    return { text: `${remaining.toFixed(4)} ${token} remaining`, style: s.statusText };
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>Spending Limits</Text>
        <Text style={s.subtitle}>Control how much you can spend per token</Text>

        {demoMode && (
          <View style={s.demoTag}>
            <Text style={s.demoText}>DEMO MODE</Text>
          </View>
        )}

        {/* Add / Edit Form */}
        {!showAdd ? (
          <TouchableOpacity style={s.btnBlue} onPress={() => setShowAdd(true)}>
            <Text style={s.btnText}>+ Add Spending Limit</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.card, { marginBottom: 20 }]}>
            <Text style={{ color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
              {editIndex !== null ? 'Edit Limit' : 'New Spending Limit'}
            </Text>

            <Text style={s.inputLabel}>Token Symbol</Text>
            <TextInput style={s.input} value={formToken} onChangeText={setFormToken}
              placeholder="e.g., BTC" placeholderTextColor={t.text.muted} autoCapitalize="characters" />

            <Text style={s.inputLabel}>Chain</Text>
            <TextInput style={s.input} value={formChain} onChangeText={setFormChain}
              placeholder="e.g., Bitcoin" placeholderTextColor={t.text.muted} />

            <Text style={s.inputLabel}>Maximum Amount</Text>
            <TextInput style={s.input} value={formMax} onChangeText={setFormMax}
              placeholder="0.1" placeholderTextColor={t.text.muted} keyboardType="decimal-pad" />

            <Text style={s.inputLabel}>Period</Text>
            <View style={s.periodRow}>
              {(['daily', 'weekly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.periodBtn, formPeriod === p && s.periodBtnActive]}
                  onPress={() => setFormPeriod(p)}
                >
                  <Text style={[s.periodBtnText, formPeriod === p && s.periodBtnTextActive]}>
                    {p === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnRed} onPress={resetForm}>
                <Text style={s.btnTextRed}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnGreen} onPress={handleSave}>
                <Text style={s.btnText}>{editIndex !== null ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Limits List */}
        {limits.length === 0 ? (
          <Text style={s.empty}>No spending limits configured</Text>
        ) : limits.map((lim, idx) => {
          const pct = lim.maxAmount > 0 ? (lim.spent / lim.maxAmount) * 100 : 0;
          const remaining = Math.max(0, lim.maxAmount - lim.spent);
          const status = getStatusMessage(pct, remaining, lim.token);
          const color = getProgressColor(pct);

          return (
            <View key={`${lim.token}-${lim.chain}-${lim.period}`} style={[s.card, !lim.enabled && s.disabledOverlay]}>
              <View style={s.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.tokenName}>{lim.token}</Text>
                  <View style={s.chainBadge}>
                    <Text style={s.chainText}>{lim.chain}</Text>
                  </View>
                  <View style={[s.periodBadge, { backgroundColor: lim.period === 'daily' ? t.accent.blue + '20' : t.accent.purple + '20' }]}>
                    <Text style={[s.periodText, { color: lim.period === 'daily' ? t.accent.blue : t.accent.purple }]}>
                      {lim.period === 'daily' ? 'Daily' : 'Weekly'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={s.row}>
                <Text style={s.label}>Spent</Text>
                <Text style={s.value}>{lim.spent.toFixed(4)} / {lim.maxAmount} {lim.token}</Text>
              </View>

              <View style={s.row}>
                <Text style={s.label}>Usage</Text>
                <Text style={[s.value, { color }]}>{Math.min(100, pct).toFixed(1)}%</Text>
              </View>

              <View style={s.progressContainer}>
                <View style={[s.progressFill, {
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor: color,
                }]} />
              </View>

              <Text style={status.style}>{status.text}</Text>

              <View style={s.toggleRow}>
                <Text style={s.label}>Enabled</Text>
                <Switch
                  value={lim.enabled}
                  onValueChange={(val) => handleToggle(idx, val)}
                  trackColor={{ false: '#333', true: t.accent.green + '40' }}
                  thumbColor={lim.enabled ? t.accent.green : '#666'}
                />
              </View>

              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnRed} onPress={() => handleRemove(lim)}>
                  <Text style={s.btnTextRed}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnGreen} onPress={() => handleEdit(idx)}>
                  <Text style={s.btnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={s.backBtn} onPress={onClose}>
        <Text style={s.backText}>Back to Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
});
