import { fonts } from '../utils/theme';
/**
 * Simple ⇄ Pro mode toggle.
 * Appears in the header. One tap to switch the entire UI.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useWalletStore, AppMode } from '../store/walletStore';

export function ModeToggle() {
  const { mode, setMode } = useWalletStore();

  const toggleMode = () => {
    setMode(mode === 'simple' ? 'pro' : 'simple');
  };

  return (
    <TouchableOpacity style={styles.toggle} onPress={toggleMode} activeOpacity={0.7}>
      <Text style={styles.label}>
        {mode === 'simple' ? 'PRO' : 'SIMPLE'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  label: {
    color: '#a0a0b0',
    fontSize: fonts.xs,
    fontWeight: fonts.bold,
    letterSpacing: 1,
  },
});
