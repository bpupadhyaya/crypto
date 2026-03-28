/**
 * Tab Layout — Static, memoized. Zero re-renders.
 */

import React, { useState, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, InteractionManager } from 'react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ToastContainer } from '../../components/Toast';
import { useWalletStore } from '../../store/walletStore';

const ICONS: Record<string, string> = { Home: '◉', Send: '↑', Swap: '⇄', Receive: '↓', Settings: '⚙' };

// Lock screen shown instantly as local state — no waiting for Zustand propagation
let showLockOverlay: ((show: boolean) => void) | null = null;

const LockButton = React.memo(() => {
  const setStatus = useWalletStore((s) => s.setStatus);
  const handleLock = useCallback(() => {
    // 1. Show black overlay INSTANTLY (local state, no Zustand)
    showLockOverlay?.(true);
    // 2. Set Zustand state after overlay is visible (deferred)
    requestAnimationFrame(() => {
      setStatus('locked');
      import('../../core/priceService').then((m) => m.stopPriceService()).catch(() => {});
    });
  }, [setStatus]);
  return (
    <TouchableOpacity onPress={handleLock} style={{ paddingRight: 16, paddingLeft: 8 }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={{ fontSize: 20, color: '#606070' }}>🔒</Text>
    </TouchableOpacity>
  );
});

const TabIcon = React.memo(({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={[st.icon, focused && st.iconActive]}>{ICONS[label] ?? '•'}</Text>
));

// Static — never changes, defined once at module level
const SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#f0f0f5',
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 18 },
  tabBarStyle: { backgroundColor: '#0a0a0f', borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, paddingTop: 8, height: 85 },
  tabBarActiveTintColor: '#22c55e',
  tabBarInactiveTintColor: '#606070',
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
  animation: 'none' as const,
  lazy: true,
};

export default React.memo(function TabLayout() {
  const [lockOverlay, setLockOverlay] = useState(false);
  const status = useWalletStore((s) => s.status);
  showLockOverlay = setLockOverlay;

  // Clear overlay when unlocked
  React.useEffect(() => {
    if (status === 'unlocked' && lockOverlay) {
      setLockOverlay(false);
    }
  }, [status, lockOverlay]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
    {lockOverlay && <View style={st.lockOverlay} />}
    <OfflineBanner />
    <ToastContainer />
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        headerTitle: 'Open Wallet',
        tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        headerRight: () => <LockButton />,
      }} />
      <Tabs.Screen name="send" options={{ title: 'Send', tabBarIcon: ({ focused }) => <TabIcon label="Send" focused={focused} /> }} />
      <Tabs.Screen name="swap" options={{ title: 'Swap', tabBarIcon: ({ focused }) => <TabIcon label="Swap" focused={focused} /> }} />
      <Tabs.Screen name="receive" options={{ title: 'Receive', tabBarIcon: ({ focused }) => <TabIcon label="Receive" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} /> }} />
    </Tabs>
    </View>
  );
});

const st = StyleSheet.create({
  icon: { fontSize: 22, color: '#606070' },
  iconActive: { color: '#22c55e' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a0f', zIndex: 100 },
});
