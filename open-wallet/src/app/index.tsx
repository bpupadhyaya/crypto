/**
 * Entry point — routes based on wallet state:
 *   - No vault → Onboarding (create/restore wallet)
 *   - Vault created, needs PIN → PIN setup + optional biometric
 *   - Vault exists, locked → Unlock (biometric → PIN → password)
 *   - Unlocked → Main tabs
 */

import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useWalletStore } from '../store/walletStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';

export default function Index() {
  const { status, hasVault } = useWalletStore();

  useEffect(() => {
    if (status === 'unlocked') {
      router.replace('/(tabs)');
    }
  }, [status]);

  // Just created vault → set up PIN + biometric
  if (status === 'pin_setup') {
    return <PinSetupScreen />;
  }

  // Vault exists but locked → unlock (biometric → PIN → password)
  if (hasVault && status !== 'unlocked') {
    return <UnlockScreen />;
  }

  // No vault → onboarding
  return <OnboardingScreen />;
}
