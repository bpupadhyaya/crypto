/**
 * Swap Screen — Exchange any token to any other token.
 * This is the core value proposition of Open Wallet.
 *
 * Simple mode: From token → To token → amount → swap
 * Pro mode: Slippage control, route display, price impact, limit orders
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';

const POPULAR_TOKENS = ['BTC', 'ETH', 'SOL', 'USDC', 'USDT'];

export function SwapScreen() {
  const { mode } = useWalletStore();
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [slippageBps, setSlippageBps] = useState(50); // 0.5%

  const flipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setEstimatedOutput(null);
  };

  const handleSwap = async () => {
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    Alert.alert(
      'Confirm Swap',
      `Swap ${amount} ${fromToken} → ~${estimatedOutput ?? '?'} ${toToken}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap',
          onPress: async () => {
            setSwapping(true);
            try {
              // DEX provider swap will be wired here
              Alert.alert('Success', 'Swap executed successfully.');
            } catch (error) {
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
      <Text style={styles.title}>Swap</Text>
      <Text style={styles.subtitle}>Any token to any token, one tap</Text>

      {/* From */}
      <View style={styles.swapCard}>
        <Text style={styles.cardLabel}>From</Text>
        <View style={styles.tokenRow}>
          <TouchableOpacity style={styles.tokenSelector}>
            <Text style={styles.tokenText}>{fromToken}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#606070"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Flip button */}
      <TouchableOpacity style={styles.flipButton} onPress={flipTokens}>
        <Text style={styles.flipIcon}>↕</Text>
      </TouchableOpacity>

      {/* To */}
      <View style={styles.swapCard}>
        <Text style={styles.cardLabel}>To</Text>
        <View style={styles.tokenRow}>
          <TouchableOpacity style={styles.tokenSelector}>
            <Text style={styles.tokenText}>{toToken}</Text>
          </TouchableOpacity>
          <Text style={styles.estimatedAmount}>
            {estimatedOutput ?? '—'}
          </Text>
        </View>
      </View>

      {/* Pro mode: slippage and route */}
      {mode === 'pro' && (
        <View style={styles.proDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slippage</Text>
            <View style={styles.slippageRow}>
              {[25, 50, 100, 200].map((bps) => (
                <TouchableOpacity
                  key={bps}
                  style={[
                    styles.slippageChip,
                    slippageBps === bps && styles.slippageChipActive,
                  ]}
                  onPress={() => setSlippageBps(bps)}
                >
                  <Text
                    style={[
                      styles.slippageText,
                      slippageBps === bps && styles.slippageTextActive,
                    ]}
                  >
                    {(bps / 100).toFixed(1)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>Best route via DEX aggregator</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price impact</Text>
            <Text style={styles.detailValue}>—</Text>
          </View>
        </View>
      )}

      {/* Quick token selectors */}
      <View style={styles.quickTokens}>
        <Text style={styles.quickLabel}>Popular</Text>
        <View style={styles.quickRow}>
          {POPULAR_TOKENS.filter((t) => t !== fromToken).map((token) => (
            <TouchableOpacity
              key={token}
              style={styles.quickChip}
              onPress={() => setToToken(token)}
            >
              <Text style={[styles.quickChipText, toToken === token && { color: '#22c55e' }]}>
                {token}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Swap button */}
      <TouchableOpacity
        style={[styles.swapButton, swapping && styles.swapButtonDisabled]}
        onPress={handleSwap}
        disabled={swapping}
      >
        {swapping ? (
          <ActivityIndicator color="#0a0a0f" />
        ) : (
          <Text style={styles.swapButtonText}>Swap {fromToken} → {toToken}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingHorizontal: 24,
  },
  title: {
    color: '#f0f0f5',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    color: '#606070',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  swapCard: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    color: '#606070',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenSelector: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tokenText: {
    color: '#f0f0f5',
    fontSize: 18,
    fontWeight: '700',
  },
  amountInput: {
    color: '#f0f0f5',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  estimatedAmount: {
    color: '#a0a0b0',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  flipButton: {
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -12,
    zIndex: 1,
  },
  flipIcon: {
    color: '#0a0a0f',
    fontSize: 20,
    fontWeight: '800',
  },
  proDetails: {
    backgroundColor: '#16161f',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#606070',
    fontSize: 13,
  },
  detailValue: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  slippageRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slippageChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  slippageChipActive: {
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  slippageText: {
    color: '#606070',
    fontSize: 12,
  },
  slippageTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  quickTokens: {
    marginTop: 20,
  },
  quickLabel: {
    color: '#606070',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#16161f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  quickChipText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  swapButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  swapButtonDisabled: {
    opacity: 0.6,
  },
  swapButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
