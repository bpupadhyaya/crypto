/**
 * LoadingOverlay — Full-screen loading indicator with optional message.
 * Use when a screen is fetching data or processing a transaction.
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...', subMessage }: Props) {
  const t = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.card, { backgroundColor: t.bg.card }]}>
          <ActivityIndicator size="large" color={t.accent.green} />
          <Text style={[styles.message, { color: t.text.primary }]}>{message}</Text>
          {subMessage && <Text style={[styles.sub, { color: t.text.muted }]}>{subMessage}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 20, padding: 32, alignItems: 'center', minWidth: 200 },
  message: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  sub: { fontSize: 13, marginTop: 8, textAlign: 'center' },
});
