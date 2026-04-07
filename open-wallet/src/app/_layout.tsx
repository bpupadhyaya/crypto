/**
 * Root Layout — Tabs never unmount after first unlock.
 * Lock screen renders on top as a simple overlay.
 * Lock/unlock is instant — no tab teardown.
 */

import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletStore } from '../store/walletStore';
import { SplashScreen } from '../components/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  startSession, endSession, recordActivity, onAutoLock, setAutoLockTimeout,
} from '../core/security/sessionManager';

let providersInitialized = false;
let priceServiceStarted = false;
let feeServiceStarted = false;
let balancePrefetched = false;
let notificationServiceStarted = false;

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
  const autoLockTimeout = useWalletStore((s) => s.autoLockTimeout);
  const hasBeenUnlocked = useRef(false);
  const [showSplash, setShowSplash] = useState(true);

  if (status === 'unlocked') hasBeenUnlocked.current = true;
  // Reset when user signs out (goes back to onboarding)
  if (status === 'onboarding' || (!hasVault && status !== 'unlocked' && status !== 'pin_setup')) {
    hasBeenUnlocked.current = false;
  }

  // ─── Session Manager: auto-lock on inactivity ───
  useEffect(() => {
    const unsub = onAutoLock(() => {
      useWalletStore.getState().setStatus('locked');
    });
    return unsub;
  }, []);

  // Start/end session when wallet locks/unlocks
  useEffect(() => {
    if (status === 'unlocked') {
      startSession(autoLockTimeout);
      // Auto-start the embedded P2P chain node
      import('../core/chain/chainService').then(m => m.startChainNode()).catch(() => {});
    } else if (status === 'locked') {
      try { endSession(); } catch { /* ignore SecureStore errors during lock */ }
    }
  }, [status]);

  // Sync timeout changes into the running session
  useEffect(() => {
    setAutoLockTimeout(autoLockTimeout);
  }, [autoLockTimeout]);

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
    if (!feeServiceStarted) {
      feeServiceStarted = true;
      import('../core/gas/feeService').then((m) => m.startFeeService());
    }
  }, []);

  useEffect(() => {
    if (status === 'locked') {
      priceServiceStarted = false;
      feeServiceStarted = false;
      balancePrefetched = false;
      notificationServiceStarted = false;
      import('../core/notificationService').then((m) => m.stopNotificationService()).catch(() => {});
      import('../core/gas/feeService').then((m) => m.stopFeeService()).catch(() => {});
    }
    if (status === 'unlocked' && !priceServiceStarted) {
      priceServiceStarted = true;
      // Delay heavy background work so UI stays responsive for user interaction
      setTimeout(() => {
        const enabledTokens = useWalletStore.getState().enabledTokens;
        import('../core/priceService').then((m) => m.startPriceService(enabledTokens));
        if (!feeServiceStarted) {
          feeServiceStarted = true;
          import('../core/gas/feeService').then((m) => m.startFeeService());
        }
        if (!balancePrefetched) prefetchBalances();

        // Start notification service (skip demo mode)
        if (!notificationServiceStarted && !useWalletStore.getState().demoMode) {
          notificationServiceStarted = true;
          const addresses = useWalletStore.getState().addresses as Record<string, string>;
          import('../core/notificationService').then((m) => m.startNotificationService(addresses));
        }
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

  // After first unlock: tabs stay mounted forever, lock screen uses native Modal
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Slot />
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <Modal visible={needsUnlock} animationType="none" presentationStyle="fullScreen" statusBarTranslucent>
          <UnlockScreen />
        </Modal>
        <Modal visible={needsPinSetup} animationType="none" presentationStyle="fullScreen" statusBarTranslucent>
          <PinSetupScreen />
        </Modal>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
