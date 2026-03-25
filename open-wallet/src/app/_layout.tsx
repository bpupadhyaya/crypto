/**
 * Root Layout — Auth gate + tabs.
 * Direct imports (no React.lazy) = one bundle = fast.
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletStore } from '../store/walletStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';

let providersInitialized = false;
function ensureProviders() {
  if (providersInitialized) return;
  providersInitialized = true;
  import('../core/bootstrap').then((m) => m.bootstrapProviders());
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, gcTime: 60_000 } },
});

export default function RootLayout() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => { ensureProviders(); }, []);

  // Not unlocked — show auth screen directly (no routing overhead)
  if (status !== 'unlocked') {
    return (
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {status === 'pin_setup' ? (
          <PinSetupScreen />
        ) : hasVault ? (
          <UnlockScreen />
        ) : (
          <OnboardingScreen />
        )}
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
