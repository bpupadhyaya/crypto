/**
 * Offline banner — shown at top of screen when no network.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner = React.memo(() => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={s.banner}>
      <Text style={s.text}>No internet connection</Text>
    </View>
  );
});

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
