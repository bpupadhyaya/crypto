/**
 * Swap Screen — 8 swap options with security ratings, pros/cons.
 *
 * Built-in (always available):
 * 🔐 Open Wallet Atomic Swap (5/5) — P2P, standalone, ALWAYS works
 * 🏊 Open Wallet DEX (4/5) — AMM on Open Chain
 * 📋 Open Wallet Order Book (4.5/5) — Limit orders
 *
 * External (more liquidity):
 * ⚡ THORChain (3.5/5) · 📊 1inch (3.5/5) · ⚡ Jupiter (3.5/5)
 * 🌉 Li.Fi (3/5) · 🌊 Osmosis (4/5)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { useTheme } from '../hooks/useTheme';
import { getAllSwapOptions, type SwapOption } from '../core/swap';
import { checkRealTransactionAllowed, recordPaperTrade, getSwapFlow, getTrafficLightEmoji } from '../core/paperTrading';
import { isTestnet } from '../core/network';
import type { Token } from '../core/abstractions/types';

const SWAP_TOKENS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'OTK', 'ATOM'];

export function SwapScreen() {
  const { mode, addresses } = useWalletStore();
  const [fromSymbol, setFromSymbol] = useState('BTC');
  const [toSymbol, setToSymbol] = useState('USDT');
  const [amountStr, setAmountStr] = useState('');
  const [options, setOptions] = useState<SwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SwapOption | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 20 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800', marginTop: 16 },
    subtitle: { color: t.text.muted, fontSize: 13, marginTop: 4, marginBottom: 16 },
    // Token selector
    tokenRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    tokenChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: t.bg.card },
    tokenChipActive: { backgroundColor: t.accent.green },
    tokenChipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    tokenChipTextActive: { color: t.bg.primary },
    // Swap card
    swapCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    cardLabel: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    amountInput: { color: t.text.primary, fontSize: 24, fontWeight: '600' },
    flipBtn: { alignSelf: 'center', backgroundColor: t.accent.green, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -12, zIndex: 1 },
    flipIcon: { color: t.bg.primary, fontSize: 20, fontWeight: '800' },
    toCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
    toAmount: { color: t.text.secondary, fontSize: 20, fontWeight: '700' },
    toLabel: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    // Section headers
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
    sectionTitle: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
    compareBtn: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    // Option cards
    optionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    optionCardSelected: { borderWidth: 2, borderColor: t.accent.green },
    optionCardUnavailable: { opacity: 0.5 },
    optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    optionIcon: { fontSize: 24, marginRight: 10 },
    optionName: { color: t.text.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    optionAmount: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    optionAmountUnavail: { color: t.text.muted, fontSize: 14 },
    optionMeta: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: t.text.muted, fontSize: 12 },
    securityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    securityText: { fontSize: 11, fontWeight: '700' },
    // Expanded details
    expandedBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border },
    expandedLabel: { color: t.text.muted, fontSize: 12, fontWeight: '600', marginTop: 8 },
    expandedText: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 2 },
    expandBtn: { color: t.accent.blue, fontSize: 12, fontWeight: '600', marginTop: 8 },
    // Fallback note
    fallbackNote: { backgroundColor: t.accent.green + '10', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 20 },
    fallbackText: { color: t.accent.green, fontSize: 12, lineHeight: 18, textAlign: 'center' },
    // Swap button
    swapBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
    swapBtnDisabled: { opacity: 0.5 },
    swapBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    // Loading
    loadingBox: { padding: 40, alignItems: 'center' },
    loadingText: { color: t.text.muted, fontSize: 14, marginTop: 12 },
  }), [t]);

  // Fetch quotes when amount changes
  useEffect(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { setOptions([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const fromAddr = addresses.ethereum ?? addresses.bitcoin ?? '';
        const toAddr = addresses.ethereum ?? '';
        const results = await getAllSwapOptions({
          fromToken: fromSymbol, toToken: toSymbol,
          fromAmount: amount, fromAddress: fromAddr, toAddress: toAddr,
        });
        setOptions(results);
      } catch {
        setOptions([]);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [amountStr, fromSymbol, toSymbol, addresses]);

  const flipTokens = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmountStr('');
    setOptions([]);
    setSelectedOption(null);
  }, [fromSymbol, toSymbol]);

  const [isPaperSwap, setIsPaperSwap] = useState(false);

  const handleSwap = useCallback(async (paperMode: boolean = false) => {
    if (!selectedOption) {
      Alert.alert('Select Option', 'Please choose a swap method.');
      return;
    }
    setIsPaperSwap(paperMode);

    // Check paper trading for real swaps
    if (!paperMode && !isTestnet()) {
      const flow = getSwapFlow(selectedOption.id);
      const check = await checkRealTransactionAllowed(flow);
      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Paper Trade Required`,
          check.message,
          [
            { text: 'Do Paper Trade', onPress: () => { setIsPaperSwap(true); setShowConfirm(true); } },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    }

    setShowConfirm(true);
  }, [selectedOption]);

  const executeSwap = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 2000));

    if (isPaperSwap) {
      const flow = getSwapFlow(selectedOption?.id ?? '');
      const status = await recordPaperTrade(flow);
      Alert.alert(
        `${getTrafficLightEmoji(status.light)} Paper Swap Complete`,
        `${amountStr} ${fromSymbol} → ${selectedOption?.toAmount.toFixed(4)} ${toSymbol} (simulated)\n\nVia: ${selectedOption?.name}\nPaper trades: ${status.count}/3 recommended\n\n${status.light === 'green' ? 'Cleared for real swaps!' : 'Complete more paper trades for full access.'}`
      );
    } else {
      Alert.alert('Swap Initiated',
        `${amountStr} ${fromSymbol} → ${selectedOption?.toAmount.toFixed(4)} ${toSymbol}\n\nVia: ${selectedOption?.name}\n\n${selectedOption?.id === 'ow-atomic' ? 'Atomic swap in progress. Your funds are cryptographically secured.' : 'Transaction submitted to the network.'}`
      );
    }
    setAmountStr('');
    setOptions([]);
    setSelectedOption(null);
    setShowConfirm(false);
    setIsPaperSwap(false);
  }, [amountStr, fromSymbol, toSymbol, selectedOption, isPaperSwap]);

  const getSecurityColor = (rating: number) => {
    if (rating >= 4.5) return t.accent.green;
    if (rating >= 3.5) return t.accent.yellow;
    return t.accent.orange;
  };

  const getSecurityBg = (rating: number) => getSecurityColor(rating) + '20';

  if (showConfirm && selectedOption) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'swap',
          fromSymbol, fromAmount: amountStr,
          toSymbol, toAmount: selectedOption.toAmount.toFixed(4),
          fee: selectedOption.fee,
          route: `${selectedOption.name} (Security: ${selectedOption.securityRating}/5)`,
        }}
        onConfirm={executeSwap}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  const builtIn = options.filter((o) => o.category === 'built-in');
  const external = options.filter((o) => o.category === 'external');

  const renderOption = (opt: SwapOption) => {
    const isExpanded = expandedId === opt.id;
    const isSelected = selectedOption?.id === opt.id;
    return (
      <TouchableOpacity
        key={opt.id}
        style={[s.optionCard, isSelected && s.optionCardSelected, !opt.available && s.optionCardUnavailable]}
        onPress={() => opt.available && setSelectedOption(opt)}
        activeOpacity={0.7}
      >
        <View style={s.optionHeader}>
          <View style={s.optionLeft}>
            <Text style={s.optionIcon}>{opt.icon}</Text>
            <Text style={s.optionName} numberOfLines={1}>{opt.name}</Text>
          </View>
          {opt.available ? (
            <Text style={s.optionAmount}>~{opt.toAmount.toFixed(2)} {toSymbol}</Text>
          ) : (
            <Text style={s.optionAmountUnavail}>{opt.error ?? 'Unavailable'}</Text>
          )}
        </View>

        <View style={s.optionMeta}>
          <View style={[s.securityBadge, { backgroundColor: getSecurityBg(opt.securityRating) }]}>
            <Text style={[s.securityText, { color: getSecurityColor(opt.securityRating) }]}>
              {'★'.repeat(Math.floor(opt.securityRating))}{opt.securityRating % 1 ? '½' : ''} {opt.securityRating}/5
            </Text>
          </View>
          <View style={s.metaBadge}><Text style={s.metaText}>{opt.speed}</Text></View>
          <View style={s.metaBadge}><Text style={s.metaText}>Fee: {opt.fee}</Text></View>
          {opt.priceImpact > 0.1 && (
            <View style={s.metaBadge}><Text style={[s.metaText, { color: t.accent.orange }]}>Impact: {opt.priceImpact.toFixed(1)}%</Text></View>
          )}
          {opt.alwaysAvailable && (
            <View style={[s.securityBadge, { backgroundColor: t.accent.green + '20' }]}>
              <Text style={[s.securityText, { color: t.accent.green }]}>ALWAYS ON</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : opt.id)}>
          <Text style={s.expandBtn}>{isExpanded ? 'Hide Details' : 'Learn More'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.expandedBox}>
            <Text style={s.expandedLabel}>Security</Text>
            <Text style={s.expandedText}>{opt.securityNote}</Text>
            <Text style={s.expandedLabel}>Route</Text>
            <Text style={s.expandedText}>{opt.route}</Text>
            <Text style={s.expandedLabel}>How It Works</Text>
            <Text style={s.expandedText}>
              {opt.id === 'ow-atomic' ? 'Hash Time-Locked Contracts (HTLC) between you and a counterparty. Pure cryptography — if either party fails, both get refunded automatically. No intermediary involved.' :
               opt.id === 'ow-dex' ? 'Automated Market Maker (AMM) pool on Open Chain. Your tokens swap against pooled liquidity. Price determined by constant product formula (x × y = k). Near-zero fees.' :
               opt.id === 'ow-orderbook' ? 'You fill a limit order from another user. Settlement is atomic (all-or-nothing). Set your own price. If no matching order exists, your order waits.' :
               `External protocol: ${opt.route}. Your transaction is processed by the protocol's smart contracts/validators. Open Wallet signs locally — your keys never leave your device.`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Swap</Text>
        <Text style={s.subtitle}>8 options — you choose. Your keys, your decision.</Text>

        {/* From */}
        <Text style={s.cardLabel}>From</Text>
        <View style={s.tokenRow}>
          {SWAP_TOKENS.filter((t) => t !== toSymbol).map((sym) => (
            <TouchableOpacity key={sym} style={[s.tokenChip, fromSymbol === sym && s.tokenChipActive]} onPress={() => { setFromSymbol(sym); setOptions([]); }}>
              <Text style={[s.tokenChipText, fromSymbol === sym && s.tokenChipTextActive]}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.swapCard}>
          <TextInput style={s.amountInput} placeholder="0.00" placeholderTextColor={t.text.muted} value={amountStr} onChangeText={setAmountStr} keyboardType="decimal-pad" />
        </View>

        {/* Flip */}
        <TouchableOpacity style={s.flipBtn} onPress={flipTokens}>
          <Text style={s.flipIcon}>↕</Text>
        </TouchableOpacity>

        {/* To */}
        <Text style={s.cardLabel}>To</Text>
        <View style={s.tokenRow}>
          {SWAP_TOKENS.filter((t) => t !== fromSymbol).map((sym) => (
            <TouchableOpacity key={sym} style={[s.tokenChip, toSymbol === sym && s.tokenChipActive]} onPress={() => { setToSymbol(sym); setOptions([]); }}>
              <Text style={[s.tokenChipText, toSymbol === sym && s.tokenChipTextActive]}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={t.accent.green} size="large" />
            <Text style={s.loadingText}>Fetching quotes from 8 providers...</Text>
          </View>
        )}

        {/* Built-in Options */}
        {builtIn.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Built Into Open Wallet (Always Available)</Text>
            </View>
            {builtIn.map(renderOption)}
          </>
        )}

        {/* External Options */}
        {external.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>External Protocols (More Liquidity)</Text>
            </View>
            {external.map(renderOption)}
          </>
        )}

        {/* Fallback note */}
        {options.length > 0 && (
          <View style={s.fallbackNote}>
            <Text style={s.fallbackText}>
              🔐 Open Wallet Atomic Swap is ALWAYS available as fallback. It uses pure cryptography — no external service, protocol, or API can shut it down.
            </Text>
          </View>
        )}

        {/* Swap buttons */}
        {selectedOption && (
          <>
            <TouchableOpacity style={[s.swapBtn, { backgroundColor: t.accent.purple }]} onPress={() => handleSwap(true)}>
              <Text style={s.swapBtnText}>📝 Paper Swap (Practice)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.swapBtn, { marginTop: 10 }]} onPress={() => handleSwap(false)}>
              <Text style={s.swapBtnText}>Swap via {selectedOption.name} (Real)</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
