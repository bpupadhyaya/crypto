/**
 * Root Layout — Ultra-fast state-based screen switching.
 * No expo-router overhead for auth screens.
 * Tabs only load after unlock (deferred).
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletStore } from '../store/walletStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Direct imports — no lazy loading, no dynamic imports, no Suspense
// These are lightweight screens (just UI components)
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';

let providersInitialized = false;
let priceServiceStarted = false;

export default function RootLayout() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (!providersInitialized) {
      providersInitialized = true;
      // All of these run in parallel during lock screen — non-blocking
      import('../core/bootstrap').then((m) => m.bootstrapProviders());
      import('../core/notifications').then((m) => m.requestNotificationPermissions());
      import('../core/prewarmer').then((m) => m.startPrewarmer());
    }
    if (!priceServiceStarted) {
      priceServiceStarted = true;
      const enabledTokens = useWalletStore.getState().enabledTokens;
      import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
    }
  }, []);

  // Auth screens — rendered directly, no routing overhead
  if (status === 'pin_setup') {
    return <QueryClientProvider client={queryClient}><StatusBar style="light" /><PinSetupScreen /></QueryClientProvider>;
  }
  if (status !== 'unlocked' && hasVault) {
    return <QueryClientProvider client={queryClient}><StatusBar style="light" /><UnlockScreen /></QueryClientProvider>;
  }
  if (status !== 'unlocked') {
    return <QueryClientProvider client={queryClient}><StatusBar style="light" /><OnboardingScreen /></QueryClientProvider>;
  }

  // Unlocked — use expo-router only for tabs
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Slot />
    </QueryClientProvider>
  );
}
