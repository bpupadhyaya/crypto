/**
 * Tab Layout — Redirects to login if signed out.
 */

import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useWalletStore } from '../../store/walletStore';

const ICONS: Record<string, string> = {
  Home: '◉', Send: '↑', Swap: '⇄', Receive: '↓', Settings: '⚙',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={[s.icon, focused && s.iconActive]}>{ICONS[label] ?? '•'}</Text>;
}

export default function TabLayout() {
  const { status } = useWalletStore();

  // Redirect to login/unlock when signed out
  useEffect(() => {
    if (status !== 'unlocked') {
      router.replace('/');
    }
  }, [status]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#f0f0f5',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        tabBarStyle: s.tabBar,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#606070',
        tabBarLabelStyle: s.tabLabel,
        animation: 'none',
        lazy: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'Open Wallet', tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }} />
      <Tabs.Screen name="send" options={{ title: 'Send', tabBarIcon: ({ focused }) => <TabIcon label="Send" focused={focused} /> }} />
      <Tabs.Screen name="swap" options={{ title: 'Swap', tabBarIcon: ({ focused }) => <TabIcon label="Swap" focused={focused} /> }} />
      <Tabs.Screen name="receive" options={{ title: 'Receive', tabBarIcon: ({ focused }) => <TabIcon label="Receive" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} /> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: { backgroundColor: '#0a0a0f', borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, paddingTop: 8, height: 85 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  icon: { fontSize: 22, color: '#606070' },
  iconActive: { color: '#22c55e' },
});
