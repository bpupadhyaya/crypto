/**
 * Root Layout — Tabs never unmount after first unlock.
 * Lock screen renders on top as a simple overlay.
 * Lock/unlock is instant — no tab teardown.
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletStore } from '../store/walletStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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
    if (useWalletStore.getState().demoMode) return;
    await new Promise((r) => setTimeout(r, 1000));
    const { registry } = await import('../core/abstractions/registry');
    for (const [chainId, address] of Object.entries(addresses)) {
      if (!address) continue;
      try {
        const provider = registry.getChainProvider(chainId);
        const [balance] = await Promise.all([
          Promise.race([provider.getBalance(address), new Promise((_, rej) => setTimeout(() => rej('t'), 3000))]),
          Promise.race([
            provider.getTransactionHistory(address, 10).then((txs: any) => queryClient.setQueryData(['tx-history-prefetch', chainId, address], txs)),
            new Promise((r) => setTimeout(r, 3000)),
          ]).catch(() => {}),
        ]);
        queryClient.setQueryData(['balance', chainId, address], balance);
      } catch {}
    }
  } catch {}
}

export default function RootLayout() {
  const status = useWalletStore((s) => s.status);
  const hasVault = useWalletStore((s) => s.hasVault);
  const hasBeenUnlocked = useRef(false);

  if (status === 'unlocked') hasBeenUnlocked.current = true;

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

  useEffect(() => {
    if (status === 'locked') {
      priceServiceStarted = false;
      balancePrefetched = false;
    }
    if (status === 'unlocked' && !priceServiceStarted) {
      priceServiceStarted = true;
      // Delay heavy background work so UI stays responsive for user interaction
      setTimeout(() => {
        const enabledTokens = useWalletStore.getState().enabledTokens;
        import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
        if (!balancePrefetched) prefetchBalances();
      }, 2000);
    }
  }, [status]);

  const isUnlocked = status === 'unlocked';
  const needsOnboarding = !hasVault && status !== 'unlocked' && status !== 'pin_setup';
  const needsPinSetup = status === 'pin_setup';
  const needsUnlock = !isUnlocked && hasVault && !needsPinSetup;

  // Before first unlock: don't render tabs at all
  if (!hasBeenUnlocked.current) {
    if (needsPinSetup) return <QueryClientProvider client={queryClient}><StatusBar style="light" /><PinSetupScreen /></QueryClientProvider>;
    if (needsOnboarding) return <QueryClientProvider client={queryClient}><StatusBar style="light" /><OnboardingScreen /></QueryClientProvider>;
    if (needsUnlock) return <QueryClientProvider client={queryClient}><StatusBar style="light" /><UnlockScreen /></QueryClientProvider>;
  }

  // After first unlock: tabs stay mounted forever, auth overlays on top
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <View style={s.root}>
        <Slot />
        {needsPinSetup && <View style={s.overlay}><PinSetupScreen /></View>}
        {needsUnlock && <View style={s.overlay}><UnlockScreen /></View>}
      </View>
    </QueryClientProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
});
