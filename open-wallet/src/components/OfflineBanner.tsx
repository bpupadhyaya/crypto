/**
 * Offline banner — shown at top of screen when no network.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';

export const OfflineBanner = React.memo(() => {
  const isOnline = useNetworkStatus();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    banner: {
      backgroundColor: t.accent.red,
      paddingVertical: 6,
      alignItems: 'center',
    },
    text: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
  }), [t]);

  if (isOnline) return null;

  return (
    <View style={s.banner}>
      <Text style={s.text}>No internet connection</Text>
    </View>
  );
});
