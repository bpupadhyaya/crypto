/**
 * Entry point — routes to onboarding or main tabs.
 */

import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useWalletStore } from '../store/walletStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';

export default function Index() {
  const { status } = useWalletStore();

  useEffect(() => {
    if (status === 'unlocked') {
      router.replace('/(tabs)');
    }
  }, [status]);

  return <OnboardingScreen />;
}
