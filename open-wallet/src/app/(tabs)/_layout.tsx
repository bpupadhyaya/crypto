/**
 * Tab Layout — Static, memoized. Zero re-renders.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { OfflineBanner } from '../../components/OfflineBanner';

const ICONS: Record<string, string> = { Home: '◉', Send: '↑', Swap: '⇄', Receive: '↓', Settings: '⚙' };

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
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
    <OfflineBanner />
    <Tabs screenOptions={SCREEN_OPTIONS}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'Open Wallet', tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }} />
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
});
