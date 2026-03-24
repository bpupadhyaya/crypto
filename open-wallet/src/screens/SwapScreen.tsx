/**
 * Swap Screen — Exchange any token to any other token.
 * Core value proposition of Open Wallet.
 *
 * Wired to real DEX/Bridge providers:
 *   Same chain → 1inch (EVM) or Jupiter (Solana)
 *   Cross chain → Li.Fi aggregator or THORChain (native BTC)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useSwapQuote } from '../hooks/useSwap';
import { NATIVE_TOKENS } from '../hooks/useBalances';
import type { Token, ChainId } from '../core/abstractions/types';

const POPULAR_TOKENS: Token[] = [
  { symbol: 'BTC', name: 'Bitcoin', chainId: 'bitcoin', decimals: 8 },
  { symbol: 'ETH', name: 'Ethereum', chainId: 'ethereum', decimals: 18 },
  { symbol: 'SOL', name: 'Solana', chainId: 'solana', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'ethereum', decimals: 6,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDT', name: 'Tether', chainId: 'ethereum', decimals: 6,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
];

function findToken(symbol: string): Token {
  return POPULAR_TOKENS.find((t) => t.symbol === symbol) ?? POPULAR_TOKENS[1];
}

export function SwapScreen() {
  const { mode } = useWalletStore();
  const [fromSymbol, setFromSymbol] = useState('ETH');
  const [toSymbol, setToSymbol] = useState('USDC');
  const [amountStr, setAmountStr] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [swapping, setSwapping] = useState(false);

  const fromToken = useMemo(() => findToken(fromSymbol), [fromSymbol]);
  const toToken = useMemo(() => findToken(toSymbol), [toSymbol]);

  // Parse amount to bigint in token's smallest unit
  const parsedAmount = useMemo(() => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) return null;
    return BigInt(Math.floor(num * Math.pow(10, fromToken.decimals)));
  }, [amountStr, fromToken]);

  // Fetch real quote from DEX/Bridge
  const { data: quote, isLoading: quoteLoading } = useSwapQuote(
    fromToken,
    toToken,
    parsedAmount,
    slippageBps,
  );

  // Format output amount
  const estimatedOutput = useMemo(() => {
    if (!quote) return null;
    const num = Number(quote.toAmount) / Math.pow(10, toToken.decimals);
    return num < 0.001 ? '<0.001' : num.toFixed(num < 1 ? 6 : num < 100 ? 4 : 2);
  }, [quote, toToken]);

  const isCrossChain = fromToken.chainId !== toToken.chainId;

  const flipTokens = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmountStr('');
  };

  const handleSwap = () => {
    if (!amountStr.trim() || parseFloat(amountStr) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!quote) {
      Alert.alert('No Quote', 'Waiting for price quote. Please try again.');
      return;
    }

    Alert.alert(
      'Confirm Swap',
      `Swap ${amountStr} ${fromSymbol} → ~${estimatedOutput} ${toSymbol}\n\nRoute: ${quote.route}\nFee: ~$${quote.estimatedFeeUsd.toFixed(2)}${quote.priceImpact > 0.5 ? `\nPrice Impact: ${quote.priceImpact.toFixed(2)}%` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: async () => {
            setSwapping(true);
            try {
              // In production: get signer from unlocked wallet, execute via provider
              // For now: simulate success
              await new Promise((r) => setTimeout(r, 2000));
              Alert.alert('Success', `Swapped ${amountStr} ${fromSymbol} → ${estimatedOutput} ${toSymbol}`);
              setAmountStr('');
            } catch {
              Alert.alert('Failed', 'Swap failed. Please try again.');
            } finally {
              setSwapping(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Swap</Text>
        <Text style={styles.subtitle}>
          {isCrossChain ? 'Cross-chain bridge swap' : 'Any token to any token, one tap'}
        </Text>

        {/* From */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>From</Text>
          <View style={styles.tokenRow}>
            <TouchableOpacity style={styles.tokenSelector}>
              <Text style={styles.tokenText}>{fromSymbol}</Text>
              <Text style={styles.chainBadge}>{fromToken.chainId}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#606070"
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Flip */}
        <TouchableOpacity style={styles.flipButton} onPress={flipTokens}>
          <Text style={styles.flipIcon}>↕</Text>
        </TouchableOpacity>

        {/* To */}
        <View style={styles.swapCard}>
          <Text style={styles.cardLabel}>To {isCrossChain && '(cross-chain)'}</Text>
          <View style={styles.tokenRow}>
            <TouchableOpacity style={styles.tokenSelector}>
              <Text style={styles.tokenText}>{toSymbol}</Text>
              <Text style={styles.chainBadge}>{toToken.chainId}</Text>
            </TouchableOpacity>
            <View style={styles.outputArea}>
              {quoteLoading && parsedAmount ? (
                <ActivityIndicator color="#22c55e" size="small" />
              ) : (
                <Text style={styles.estimatedAmount}>
                  {estimatedOutput ?? '—'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Quote details */}
        {quote && (
          <View style={styles.quoteDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Route</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{quote.route}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. fee</Text>
              <Text style={styles.detailValue}>~${quote.estimatedFeeUsd.toFixed(2)}</Text>
            </View>
            {quote.priceImpact > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price impact</Text>
                <Text style={[
                  styles.detailValue,
                  quote.priceImpact > 1 && { color: '#f97316' },
                  quote.priceImpact > 5 && { color: '#ef4444' },
                ]}>
                  {quote.priceImpact.toFixed(2)}%
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider</Text>
              <Text style={styles.detailValue}>{quote.provider}</Text>
            </View>
          </View>
        )}

        {/* Pro mode: slippage */}
        {mode === 'pro' && (
          <View style={styles.slippageSection}>
            <Text style={styles.detailLabel}>Slippage tolerance</Text>
            <View style={styles.slippageRow}>
              {[25, 50, 100, 200].map((bps) => (
                <TouchableOpacity
                  key={bps}
                  style={[styles.slippageChip, slippageBps === bps && styles.slippageChipActive]}
                  onPress={() => setSlippageBps(bps)}
                >
                  <Text style={[styles.slippageText, slippageBps === bps && styles.slippageTextActive]}>
                    {(bps / 100).toFixed(1)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick token selectors */}
        <View style={styles.quickTokens}>
          <Text style={styles.quickLabel}>Swap to</Text>
          <View style={styles.quickRow}>
            {POPULAR_TOKENS.filter((t) => t.symbol !== fromSymbol).map((token) => (
              <TouchableOpacity
                key={token.symbol}
                style={[styles.quickChip, toSymbol === token.symbol && styles.quickChipActive]}
                onPress={() => setToSymbol(token.symbol)}
              >
                <Text style={[styles.quickChipText, toSymbol === token.symbol && { color: '#22c55e' }]}>
                  {token.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Swap button */}
        <TouchableOpacity
          style={[styles.swapButton, (swapping || !quote) && styles.swapButtonDisabled]}
          onPress={handleSwap}
          disabled={swapping || (!quote && !!parsedAmount)}
        >
          {swapping ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.swapButtonText}>
              {isCrossChain ? `Bridge ${fromSymbol} → ${toSymbol}` : `Swap ${fromSymbol} → ${toSymbol}`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 24 },
  title: { color: '#f0f0f5', fontSize: 24, fontWeight: '800', marginTop: 16 },
  subtitle: { color: '#606070', fontSize: 13, marginTop: 4, marginBottom: 20 },
  swapCard: { backgroundColor: '#16161f', borderRadius: 16, padding: 16 },
  cardLabel: { color: '#606070', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tokenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tokenSelector: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  tokenText: { color: '#f0f0f5', fontSize: 18, fontWeight: '700' },
  chainBadge: { color: '#606070', fontSize: 10, textTransform: 'uppercase', marginTop: 2 },
  amountInput: { color: '#f0f0f5', fontSize: 24, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  outputArea: { flex: 1, marginLeft: 16, alignItems: 'flex-end' },
  estimatedAmount: { color: '#a0a0b0', fontSize: 24, fontWeight: '600', textAlign: 'right' },
  flipButton: { alignSelf: 'center', backgroundColor: '#22c55e', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -12, zIndex: 1 },
  flipIcon: { color: '#0a0a0f', fontSize: 20, fontWeight: '800' },
  quoteDetails: { backgroundColor: '#16161f', borderRadius: 12, padding: 16, marginTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailLabel: { color: '#606070', fontSize: 13 },
  detailValue: { color: '#a0a0b0', fontSize: 13, maxWidth: '60%' },
  slippageSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  slippageRow: { flexDirection: 'row', gap: 6 },
  slippageChip: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  slippageChipActive: { backgroundColor: 'rgba(34,197,94,0.2)' },
  slippageText: { color: '#606070', fontSize: 12 },
  slippageTextActive: { color: '#22c55e', fontWeight: '600' },
  quickTokens: { marginTop: 20 },
  quickLabel: { color: '#606070', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickChip: { backgroundColor: '#16161f', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  quickChipActive: { borderWidth: 1, borderColor: '#22c55e30' },
  quickChipText: { color: '#a0a0b0', fontSize: 14 },
  swapButton: { backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
  swapButtonDisabled: { opacity: 0.6 },
  swapButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
});
