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
let balancePrefetched = false;

// Pre-fetch balances during lock screen — seed React Query cache
async function prefetchBalances() {
  if (balancePrefetched) return;
  balancePrefetched = true;
  try {
    const addresses = useWalletStore.getState().addresses;
    const demoMode = useWalletStore.getState().demoMode;
    if (demoMode) return; // Demo mode uses hardcoded balances, no prefetch needed

    // Wait for providers to be ready (bootstrap runs in parallel)
    await new Promise((r) => setTimeout(r, 1000));
    const { registry } = await import('../core/abstractions/registry');

    for (const [chainId, address] of Object.entries(addresses)) {
      if (!address) continue;
      try {
        const provider = registry.getChainProvider(chainId);
        const balance = await Promise.race([
          provider.getBalance(address),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000)),
        ]);
        // Seed React Query cache so useAllBalances returns instantly
        queryClient.setQueryData(['balance', chainId, address], balance);
      } catch {}
    }
  } catch {}
}

export default function RootLayout() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (!providersInitialized) {
      providersInitialized = true;
      // All run in parallel during lock screen — non-blocking
      import('../core/bootstrap').then((m) => m.bootstrapProviders());
      import('../core/notifications').then((m) => m.requestNotificationPermissions());
      import('../core/prewarmer').then((m) => m.startPrewarmer());
      // Pre-fetch balances after a brief delay (providers need to initialize first)
      prefetchBalances();
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
