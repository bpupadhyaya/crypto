/**
 * Root Layout — Ultra-fast state-based screen switching.
 *
 * Key optimization: Once tabs are mounted, they NEVER unmount.
 * Lock screen overlays on top (absolute positioning), so locking
 * is instant regardless of how much data tabs have loaded.
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
  // Track if tabs have ever been shown (once true, tabs stay mounted forever)
  const [tabsEverShown, setTabsEverShown] = useState(false);

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

  // Reset prefetch flags when locked
  useEffect(() => {
    if (status === 'locked') {
      priceServiceStarted = false;
      balancePrefetched = false;
    }
  }, [status]);

  // Once unlocked, tabs stay mounted forever
  useEffect(() => {
    if (status === 'unlocked') {
      setTabsEverShown(true);
      // Restart price service on re-unlock
      if (!priceServiceStarted) {
        priceServiceStarted = true;
        const enabledTokens = useWalletStore.getState().enabledTokens;
        import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
      }
    }
  }, [status]);

  const isUnlocked = status === 'unlocked';
  const showOnboarding = status !== 'unlocked' && !hasVault;
  const showPinSetup = status === 'pin_setup';
  const showLock = status === 'locked' || (status !== 'unlocked' && hasVault && !showPinSetup);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <View style={styles.root}>
        {/* Tabs — mounted once, never unmounted. Hidden behind overlay when locked. */}
        {tabsEverShown && (
          <View style={[styles.layer, !isUnlocked && styles.hidden]} pointerEvents={isUnlocked ? 'auto' : 'none'}>
            <Slot />
          </View>
        )}

        {/* Auth overlay — sits on top of tabs */}
        {showPinSetup && (
          <View style={styles.overlay}>
            <PinSetupScreen />
          </View>
        )}
        {showLock && (
          <View style={styles.overlay}>
            <UnlockScreen />
          </View>
        )}
        {showOnboarding && (
          <View style={styles.overlay}>
            <OnboardingScreen />
          </View>
        )}
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  layer: { ...StyleSheet.absoluteFillObject },
  hidden: { opacity: 0 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
});
