import React from 'react';
import { HomeScreen } from '../../screens/HomeScreen';
import { SimpleModeHomeScreen } from '../../screens/SimpleModeHomeScreen';
import { useWalletStore } from '../../store/walletStore';

export default function TabIndex() {
  const mode = useWalletStore((s) => s.mode);
  const setMode = useWalletStore((s) => s.setMode);

  if (mode === 'simple') {
    return <SimpleModeHomeScreen onSwitchToPro={() => setMode('pro')} />;
  }

  return <HomeScreen />;
}
