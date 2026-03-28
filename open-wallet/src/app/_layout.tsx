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

// Direct imports — lightweight screens
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';

let providersInitialized = false;
let priceServiceStarted = false;
let balancePrefetched = false;

async function prefetchBalances() {
  if (balancePrefetched) return;
  balancePrefetched = true;
  try {
    const addresses = useWalletStore.getState().addresses;
    const demoMode = useWalletStore.getState().demoMode;
    if (demoMode) return;

    await new Promise((r) => setTimeout(r, 1000));
    const { registry } = await import('../core/abstractions/registry');

    for (const [chainId, address] of Object.entries(addresses)) {
      if (!address) continue;
      try {
        const provider = registry.getChainProvider(chainId);
        const [balance] = await Promise.all([
          Promise.race([
            provider.getBalance(address),
            new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000)),
          ]),
          Promise.race([
            provider.getTransactionHistory(address, 10).then((txs: any) => {
              queryClient.setQueryData(['tx-history-prefetch', chainId, address], txs);
            }),
            new Promise((r) => setTimeout(r, 3000)),
          ]).catch(() => {}),
        ]);
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
      import('../core/bootstrap').then((m) => m.bootstrapProviders());
      import('../core/notifications').then((m) => m.requestNotificationPermissions());
      import('../core/prewarmer').then((m) => m.startPrewarmer());
      prefetchBalances();
    }
    if (!priceServiceStarted) {
      priceServiceStarted = true;
      const enabledTokens = useWalletStore.getState().enabledTokens;
      import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
    }
  }, []);

  // Restart services on re-unlock, reset flags on lock
  useEffect(() => {
    if (status === 'locked') {
      priceServiceStarted = false;
      balancePrefetched = false;
      import('../core/priceService').then((m) => m.stopPriceService()).catch(() => {});
    }
    if (status === 'unlocked') {
      if (!priceServiceStarted) {
        priceServiceStarted = true;
        const enabledTokens = useWalletStore.getState().enabledTokens;
        import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
      }
      if (!balancePrefetched) {
        prefetchBalances();
      }
    }
  }, [status]);

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
