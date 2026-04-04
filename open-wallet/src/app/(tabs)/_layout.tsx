import { fonts } from '../../utils/theme';
/**
 * Tab Layout — Rebuilds when display scales change so all screens get new font sizes.
 */

import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ToastContainer } from '../../components/Toast';
import { useWalletStore } from '../../store/walletStore';

const ICONS: Record<string, string> = { Home: '◉', Send: '↑', Swap: '⇄', Receive: '↓', Settings: '⚙' };

function LockButton() {
  return (
    <TouchableOpacity
      onPress={() => Alert.alert('Lock Wallet', 'Lock your wallet?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Lock', style: 'destructive', onPress: () => setTimeout(() => useWalletStore.getState().setStatus('locked'), 0) },
      ])}
      style={{ paddingRight: 16, paddingLeft: 8 }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={{ fontSize: fonts.xl, color: '#606070' }}>🔒</Text>
    </TouchableOpacity>
  );
}

const TabIcon = React.memo(({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={{ fontSize: fonts.xxl, color: focused ? '#22c55e' : '#606070' }}>{ICONS[label] ?? '•'}</Text>
));

export default function TabLayout() {
  // Subscribe to display scales — forces full tab tree remount when scales change
  const displayScales = useWalletStore((s) => s.displayScales);
  const scaleKey = useMemo(() =>
    `${displayScales.appScale}-${displayScales.contentScale}-${displayScales.menuScale}-${displayScales.iconScale}-${displayScales.weightBoost}`,
  [displayScales]);

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
    headerTintColor: '#f0f0f5',
    headerTitleStyle: { fontWeight: fonts.heavy as const, fontSize: fonts.xl },
    tabBarStyle: { backgroundColor: '#0a0a0f', borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, paddingTop: 8, height: 85 },
    tabBarActiveTintColor: '#22c55e',
    tabBarInactiveTintColor: '#606070',
    tabBarLabelStyle: { fontSize: fonts.xs, fontWeight: fonts.semibold as const },
    animation: 'none' as const,
    lazy: true,
  }), [scaleKey]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
    <OfflineBanner />
    <ToastContainer />
    <Tabs screenOptions={screenOptions}>
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
}

const st = StyleSheet.create({
  icon: { fontSize: fonts.xxl, color: '#606070' },
  iconActive: { color: '#22c55e' },
});
