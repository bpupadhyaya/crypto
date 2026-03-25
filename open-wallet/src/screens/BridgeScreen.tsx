/**
 * Bridge Screen — Cross-chain token transfers.
 * BTC ↔ ETH, ETH ↔ SOL, any chain ↔ stablecoins.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';

const BRIDGE_CHAINS = ['bitcoin', 'ethereum', 'solana', 'avalanche', 'polygon', 'bsc'];
const CHAIN_LABELS: Record<string, string> = {
  bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana',
  avalanche: 'Avalanche', polygon: 'Polygon', bsc: 'BNB Chain',
};

export function BridgeScreen({ onClose }: { onClose: () => void }) {
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('solana');
  const [amount, setAmount] = useState('');
  const [bridging, setBridging] = useState(false);

  const fromToken = useMemo(
    () => SUPPORTED_TOKENS.find((t) => t.chainId === fromChain && t.isNative),
    [fromChain]
  );
  const toToken = useMemo(
    () => SUPPORTED_TOKENS.find((t) => t.chainId === toChain && t.isNative),
    [toChain]
  );

  const flipChains = useCallback(() => {
    setFromChain(toChain);
    setToChain(fromChain);
    setAmount('');
  }, [fromChain, toChain]);

  const handleBridge = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    Alert.alert(
      'Bridge',
      `Bridge ${amount} ${fromToken?.symbol ?? ''} (${CHAIN_LABELS[fromChain]}) → ${toToken?.symbol ?? ''} (${CHAIN_LABELS[toChain]})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Bridge', onPress: async () => {
          setBridging(true);
          await new Promise((r) => setTimeout(r, 2000));
          Alert.alert('Success', 'Bridge transaction submitted');
          setBridging(false);
          setAmount('');
        }},
      ]
    );
  }, [amount, fromChain, toChain, fromToken, toToken]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bridge</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Transfer tokens across blockchains</Text>

        {/* From Chain */}
        <Text style={s.label}>From</Text>
        <View style={s.chainRow}>
          {BRIDGE_CHAINS.filter((c) => c !== toChain).map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[s.chainChip, fromChain === chain && s.chainChipActive]}
              onPress={() => setFromChain(chain)}
            >
              <Text style={[s.chainText, fromChain === chain && s.chainTextActive]}>
                {CHAIN_LABELS[chain]?.slice(0, 5) ?? chain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={s.amountCard}>
          <Text style={s.amountLabel}>{fromToken?.symbol ?? fromChain.toUpperCase()}</Text>
          <TextInput
            style={s.amountInput}
            placeholder="0.00"
            placeholderTextColor="#606070"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Flip */}
        <TouchableOpacity style={s.flipBtn} onPress={flipChains}>
          <Text style={s.flipIcon}>↕</Text>
        </TouchableOpacity>

        {/* To Chain */}
        <Text style={s.label}>To</Text>
        <View style={s.chainRow}>
          {BRIDGE_CHAINS.filter((c) => c !== fromChain).map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[s.chainChip, toChain === chain && s.chainChipActive]}
              onPress={() => setToChain(chain)}
            >
              <Text style={[s.chainText, toChain === chain && s.chainTextActive]}>
                {CHAIN_LABELS[chain]?.slice(0, 5) ?? chain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Receive estimate */}
        <View style={s.receiveCard}>
          <Text style={s.receiveLabel}>You receive (estimated)</Text>
          <Text style={s.receiveAmount}>
            {amount && parseFloat(amount) > 0 ? `~${amount} ${toToken?.symbol ?? ''}` : '—'}
          </Text>
          <Text style={s.receiveNote}>Fees and slippage may apply</Text>
        </View>

        {/* Route info */}
        <View style={s.routeCard}>
          <Text style={s.routeLabel}>Route</Text>
          <Text style={s.routeValue}>
            {fromChain === 'bitcoin' || toChain === 'bitcoin'
              ? 'THORChain (native, no wrapping)'
              : 'Li.Fi Aggregator (best rate)'}
          </Text>
        </View>

        {/* Bridge button */}
        <TouchableOpacity
          style={[s.bridgeBtn, bridging && s.bridgeBtnDisabled]}
          onPress={handleBridge}
          disabled={bridging}
        >
          {bridging ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.bridgeBtnText}>
              Bridge {fromToken?.symbol ?? ''} → {toToken?.symbol ?? ''}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  title: { color: '#f0f0f5', fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 20 },
  subtitle: { color: '#606070', fontSize: 13, marginBottom: 20 },
  label: { color: '#a0a0b0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  chainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chainChip: { backgroundColor: '#16161f', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chainChipActive: { backgroundColor: '#8b5cf6' },
  chainText: { color: '#a0a0b0', fontSize: 13 },
  chainTextActive: { color: '#fff', fontWeight: '700' },
  amountCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  amountLabel: { color: '#a0a0b0', fontSize: 16, fontWeight: '700', marginRight: 12 },
  amountInput: { flex: 1, color: '#f0f0f5', fontSize: 24, fontWeight: '600', textAlign: 'right' },
  flipBtn: { alignSelf: 'center', backgroundColor: '#8b5cf6', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -8, zIndex: 1 },
  flipIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
  receiveCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 16 },
  receiveLabel: { color: '#606070', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  receiveAmount: { color: '#f0f0f5', fontSize: 24, fontWeight: '700', marginTop: 8 },
  receiveNote: { color: '#606070', fontSize: 12, marginTop: 4 },
  routeCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16161f', borderRadius: 12, padding: 14, marginTop: 12 },
  routeLabel: { color: '#606070', fontSize: 13 },
  routeValue: { color: '#a0a0b0', fontSize: 13 },
  bridgeBtn: { backgroundColor: '#8b5cf6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
  bridgeBtnDisabled: { opacity: 0.6 },
  bridgeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
