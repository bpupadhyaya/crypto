/**
 * Action buttons — adapts to Simple and Pro mode.
 * Simple: 3 large buttons (Send, Receive, Swap) — maximum clarity
 * Pro: Compact row with additional actions (Bridge, Stake, History)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWalletStore } from '../store/walletStore';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

function SimpleButton({ icon, label, onPress, color = '#22c55e' }: ActionButtonProps) {
  return (
    <TouchableOpacity style={styles.simpleButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.simpleIconCircle, { backgroundColor: color + '20' }]}>
        <Text style={[styles.simpleIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.simpleLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProButton({ icon, label, onPress, color = '#3b82f6' }: ActionButtonProps) {
  return (
    <TouchableOpacity style={styles.proButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.proIcon, { color }]}>{icon}</Text>
      <Text style={styles.proLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ActionButtons() {
  const { mode } = useWalletStore();

  const handleSend = () => { /* navigate to send screen */ };
  const handleReceive = () => { /* navigate to receive screen */ };
  const handleSwap = () => { /* navigate to swap screen */ };
  const handleBridge = () => { /* navigate to bridge screen */ };
  const handleStake = () => { /* navigate to stake screen */ };
  const handleHistory = () => { /* navigate to history screen */ };

  if (mode === 'simple') {
    return (
      <View style={styles.simpleContainer}>
        <SimpleButton icon="↑" label="Send" onPress={handleSend} color="#f97316" />
        <SimpleButton icon="↓" label="Receive" onPress={handleReceive} color="#22c55e" />
        <SimpleButton icon="⇄" label="Swap" onPress={handleSwap} color="#3b82f6" />
      </View>
    );
  }

  // Pro mode — more actions in compact layout
  return (
    <View style={styles.proContainer}>
      <ProButton icon="↑" label="Send" onPress={handleSend} color="#f97316" />
      <ProButton icon="↓" label="Receive" onPress={handleReceive} color="#22c55e" />
      <ProButton icon="⇄" label="Swap" onPress={handleSwap} color="#3b82f6" />
      <ProButton icon="⇆" label="Bridge" onPress={handleBridge} color="#8b5cf6" />
      <ProButton icon="◎" label="Stake" onPress={handleStake} color="#eab308" />
      <ProButton icon="☰" label="History" onPress={handleHistory} color="#a0a0b0" />
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Simple Mode ───
  simpleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  simpleButton: {
    alignItems: 'center',
    flex: 1,
  },
  simpleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  simpleIcon: {
    fontSize: 28,
    fontWeight: '700',
  },
  simpleLabel: {
    color: '#f0f0f5',
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Pro Mode ───
  proContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  proButton: {
    alignItems: 'center',
    backgroundColor: '#16161f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '15%',
    minWidth: 52,
  },
  proIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  proLabel: {
    color: '#a0a0b0',
    fontSize: 11,
  },
});
