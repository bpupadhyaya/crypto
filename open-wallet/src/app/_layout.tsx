/**
 * Root Layout — Controls what's shown based on wallet status.
 * No routing for auth state — just conditional rendering (fastest, most reliable).
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useWalletStore } from '../store/walletStore';

let providersInitialized = false;
function ensureProviders() {
  if (providersInitialized) return;
  providersInitialized = true;
  import('../core/bootstrap').then((m) => m.bootstrapProviders());
}
import('../i18n').catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, gcTime: 60_000 } },
});

const OnboardingScreen = React.lazy(() =>
  import('../screens/OnboardingScreen').then(m => ({ default: m.OnboardingScreen }))
);
const UnlockScreen = React.lazy(() =>
  import('../screens/UnlockScreen').then(m => ({ default: m.UnlockScreen }))
);
const PinSetupScreen = React.lazy(() =>
  import('../screens/PinSetupScreen').then(m => ({ default: m.PinSetupScreen }))
);

function Loading() {
  return (
    <View style={s.loading}>
      <Text style={s.logo}>OW</Text>
      <ActivityIndicator color="#22c55e" style={{ marginTop: 16 }} />
    </View>
  );
}

function AuthGate() {
  const { status, hasVault } = useWalletStore();

  if (status === 'unlocked') {
    return null; // Let Stack/tabs render
  }

  return (
    <React.Suspense fallback={<Loading />}>
      {status === 'pin_setup' ? (
        <PinSetupScreen />
      ) : hasVault ? (
        <UnlockScreen />
      ) : (
        <OnboardingScreen />
      )}
    </React.Suspense>
  );
}

export default function RootLayout() {
  const { status } = useWalletStore();

  useEffect(() => { ensureProviders(); }, []);

  // If not unlocked, show auth screens (no routing needed)
  if (status !== 'unlocked') {
    return (
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGate />
      </QueryClientProvider>
    );
  }

  // Unlocked — show tabs
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  logo: { color: '#22c55e', fontSize: 40, fontWeight: '900' },
});
