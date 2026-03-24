/**
 * Open Wallet — The universal crypto wallet.
 *
 * Mission: Maintaining and improving human life at near-zero cost.
 * Architecture: Mobile-first, plugin-based backends, progressive P2P migration.
 */

import React from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useWalletStore } from './src/store/walletStore';

export default function App() {
  const { status } = useWalletStore();

  if (status === 'onboarding') {
    return <OnboardingScreen />;
  }

  return <HomeScreen />;
}
