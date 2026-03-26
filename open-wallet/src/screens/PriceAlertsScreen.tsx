/**
 * Price Alerts — Notify when a token hits a target price.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert, Switch,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS } from '../core/tokens/registry';
import { usePrices } from '../hooks/usePrices';
import { useTheme } from '../hooks/useTheme';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  enabled: boolean;
  triggered: boolean;
}

interface Props {
  onClose: () => void;
}

export const PriceAlertsScreen = React.memo(({ onClose }: Props) => {
  const alerts = useWalletStore((s) => s.priceAlerts);
  const addAlert = useWalletStore((s) => s.addPriceAlert);
  const removeAlert = useWalletStore((s) => s.removePriceAlert);
  const toggleAlert = useWalletStore((s) => s.togglePriceAlert);
  const { prices } = usePrices();
  const t = useTheme();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    addBtn: { color: t.accent.green, fontSize: 15, fontWeight: '700' },
    addForm: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
    tokenRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tokenChip: { backgroundColor: t.bg.primary, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
    tokenActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: 13 },
    tokenTextActive: { color: t.bg.primary, fontWeight: '700' },
    currentPrice: { color: t.text.muted, fontSize: 13, marginBottom: 12 },
    directionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    dirBtn: { flex: 1, backgroundColor: t.bg.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    dirActive: { backgroundColor: t.accent.green + '20' },
    dirActiveRed: { backgroundColor: t.accent.red + '20' },
    dirText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    dirTextActive: { color: t.accent.green },
    dirTextActiveRed: { color: t.accent.red },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    saveBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { color: t.bg.primary, fontSize: 15, fontWeight: '700' },
    alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border },
    alertInfo: { flex: 1 },
    alertSymbol: { color: t.text.primary, fontSize: 16, fontWeight: '600' },
    alertTarget: { color: t.text.secondary, fontSize: 14, marginTop: 2 },
    alertTriggered: { color: t.accent.green, fontSize: 12, fontWeight: '700', marginTop: 2 },
    alertActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    deleteBtn: { color: t.accent.red, fontSize: 18, fontWeight: '700' },
    empty: { alignItems: 'center' },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4 },
  }), [t]);

  const handleAdd = useCallback(() => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid', 'Enter a valid price.');
      return;
    }
    addAlert({
      id: Date.now().toString(),
      symbol: selectedSymbol,
      targetPrice: price,
      direction,
      enabled: true,
      triggered: false,
    });
    setTargetPrice('');
    setShowAdd(false);
  }, [selectedSymbol, targetPrice, direction, addAlert]);

  const currentPrice = prices[selectedSymbol] ?? 0;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Price Alerts</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtn}>{showAdd ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addForm}>
          {/* Token selector */}
          <View style={s.tokenRow}>
            {['BTC', 'ETH', 'SOL', 'USDC', 'ADA'].map((sym) => (
              <TouchableOpacity
                key={sym}
                style={[s.tokenChip, selectedSymbol === sym && s.tokenActive]}
                onPress={() => setSelectedSymbol(sym)}
              >
                <Text style={[s.tokenText, selectedSymbol === sym && s.tokenTextActive]}>{sym}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {currentPrice > 0 && (
            <Text style={s.currentPrice}>Current: ${currentPrice.toLocaleString()}</Text>
          )}

          {/* Direction */}
          <View style={s.directionRow}>
            <TouchableOpacity
              style={[s.dirBtn, direction === 'above' && s.dirActive]}
              onPress={() => setDirection('above')}
            >
              <Text style={[s.dirText, direction === 'above' && s.dirTextActive]}>Above ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.dirBtn, direction === 'below' && s.dirActiveRed]}
              onPress={() => setDirection('below')}
            >
              <Text style={[s.dirText, direction === 'below' && s.dirTextActiveRed]}>Below ↓</Text>
            </TouchableOpacity>
          </View>

          {/* Target price */}
          <TextInput
            style={s.input}
            placeholder="Target price (USD)"
            placeholderTextColor={t.text.muted}
            value={targetPrice}
            onChangeText={setTargetPrice}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleAdd}>
            <Text style={s.saveBtnText}>Create Alert</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={s.alertRow}>
            <View style={s.alertInfo}>
              <Text style={s.alertSymbol}>{item.symbol}</Text>
              <Text style={s.alertTarget}>
                {item.direction === 'above' ? '↑' : '↓'} ${item.targetPrice.toLocaleString()}
              </Text>
              {item.triggered && <Text style={s.alertTriggered}>Triggered!</Text>}
            </View>
            <View style={s.alertActions}>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleAlert(item.id)}
                trackColor={{ false: '#333', true: t.accent.green + '40' }}
                thumbColor={item.enabled ? t.accent.green : '#666'}
              />
              <TouchableOpacity onPress={() => removeAlert(item.id)}>
                <Text style={s.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No price alerts</Text>
            <Text style={s.emptyHint}>Get notified when tokens hit your target price</Text>
          </View>
        }
        contentContainerStyle={alerts.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined}
      />
    </SafeAreaView>
  );
});
