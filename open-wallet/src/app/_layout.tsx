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
import { useWalletStore } from '../store/walletStore';

// Direct imports — no lazy loading, no dynamic imports, no Suspense
// These are lightweight screens (just UI components)
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';

let providersInitialized = false;

export default function RootLayout() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (!providersInitialized) {
      providersInitialized = true;
      import('../core/bootstrap').then((m) => m.bootstrapProviders());
      import('../core/notifications').then((m) => m.requestNotificationPermissions());
    }
  }, []);

  // Auth screens — rendered directly, no routing overhead
  if (status === 'pin_setup') {
    return <><StatusBar style="light" /><PinSetupScreen /></>;
  }
  if (status !== 'unlocked' && hasVault) {
    return <><StatusBar style="light" /><UnlockScreen /></>;
  }
  if (status !== 'unlocked') {
    return <><StatusBar style="light" /><OnboardingScreen /></>;
  }

  // Unlocked — use expo-router only for tabs
  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
