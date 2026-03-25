/**
 * Entry point — fast routing based on wallet state.
 * All screens are lazy-loaded.
 */

import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useWalletStore } from '../store/walletStore';

const OnboardingScreen = React.lazy(() =>
  import('../screens/OnboardingScreen').then(m => ({ default: m.OnboardingScreen }))
);
const UnlockScreen = React.lazy(() =>
  import('../screens/UnlockScreen').then(m => ({ default: m.UnlockScreen }))
);
const PinSetupScreen = React.lazy(() =>
  import('../screens/PinSetupScreen').then(m => ({ default: m.PinSetupScreen }))
);

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

function Loading() {
  return (
    <View style={s.loading}>
      <Text style={s.logo}>OW</Text>
      <ActivityIndicator color="#22c55e" style={{ marginTop: 16 }} />
    </View>
  );
}

export default function Index() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (status === 'unlocked') {
      router.replace('/(tabs)');
    }
  }, [status]);

  return (
    <React.Suspense fallback={<Loading />}>
      {status === 'pin_setup' ? (
        <PinSetupScreen />
      ) : hasVault && status !== 'unlocked' ? (
        <UnlockScreen />
      ) : (
        <OnboardingScreen />
      )}
    </React.Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  logo: { color: '#22c55e', fontSize: 40, fontWeight: '900' },
});
