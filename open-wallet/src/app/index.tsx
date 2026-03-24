/**
 * Entry point — routes based on wallet state:
 *   - No vault → Onboarding (create/restore wallet)
 *   - Vault exists, locked → Unlock (password/biometric)
 *   - Unlocked → Main tabs
 */

import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useWalletStore } from '../store/walletStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';

export default function Index() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (status === 'unlocked') {
      router.replace('/(tabs)');
    }
  }, [status]);

  // Vault exists but locked → show unlock
  if (hasVault && status !== 'unlocked') {
    return <UnlockScreen />;
  }

  // No vault → show onboarding
  return <OnboardingScreen />;
}
