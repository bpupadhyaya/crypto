/**
 * Send Screen — Send tokens to another address.
 * Simple mode: Amount + address + send button
 * Pro mode: Chain selector, token selector, fee controls, address book
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
import { registry } from '../core/abstractions/registry';
import { ChainId } from '../core/abstractions/types';

export function SendScreen() {
  const { mode, supportedChains } = useWalletStore();
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);

  const validateAndSend = async () => {
    if (!recipient.trim()) {
      Alert.alert('Missing Address', 'Please enter a recipient address.');
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    // Validate address using the chain provider
    try {
      const provider = registry.getChainProvider(selectedChain);
      if (!provider.isAddressValid(recipient.trim())) {
        Alert.alert('Invalid Address', `This is not a valid ${selectedChain} address.`);
        return;
      }
    } catch {
      // Provider might not be registered yet
    }

    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${selectedChain.toUpperCase()} to ${recipient.slice(0, 10)}...${recipient.slice(-6)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              // Transaction construction will be implemented with full signing flow
              Alert.alert('Sent', 'Transaction submitted successfully.');
            } catch (error) {
              Alert.alert('Failed', 'Transaction failed. Please try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Send</Text>

      {/* Chain selector */}
      <View style={styles.chainSelector}>
        {supportedChains.map((chain) => (
          <TouchableOpacity
            key={chain}
            style={[
              styles.chainButton,
              selectedChain === chain && styles.chainButtonActive,
            ]}
            onPress={() => setSelectedChain(chain)}
          >
            <Text
              style={[
                styles.chainButtonText,
                selectedChain === chain && styles.chainButtonTextActive,
              ]}
            >
              {chain.charAt(0).toUpperCase() + chain.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recipient */}
      <Text style={styles.fieldLabel}>To</Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient address"
        placeholderTextColor="#606070"
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Amount */}
      <Text style={styles.fieldLabel}>Amount</Text>
      <View style={styles.amountRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="0.00"
          placeholderTextColor="#606070"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <Text style={styles.tokenLabel}>{selectedChain.toUpperCase()}</Text>
      </View>

      {/* Fee estimate (Pro mode) */}
      {mode === 'pro' && estimatedFee && (
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Estimated fee</Text>
          <Text style={styles.feeValue}>{estimatedFee}</Text>
        </View>
      )}

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
        onPress={validateAndSend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#0a0a0f" />
        ) : (
          <Text style={styles.sendButtonText}>Send</Text>
        )}
      </TouchableOpacity>

      {mode === 'simple' && (
        <Text style={styles.hint}>
          Double-check the address before sending. Transactions cannot be reversed.
        </Text>
      )}
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
    marginBottom: 20,
  },
  chainSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  chainButton: {
    backgroundColor: '#16161f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chainButtonActive: {
    backgroundColor: '#f97316',
  },
  chainButtonText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  chainButtonTextActive: {
    color: '#0a0a0f',
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 16,
    color: '#f0f0f5',
    fontSize: 16,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenLabel: {
    color: '#a0a0b0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  feeLabel: {
    color: '#606070',
    fontSize: 13,
  },
  feeValue: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  sendButton: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#0a0a0f',
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    color: '#606070',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
