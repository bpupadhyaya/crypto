/**
 * Tab Layout — Bottom navigation for the main wallet screens.
 * Adapts tab count based on Simple/Pro mode.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useWalletStore } from '../../store/walletStore';
import { ModeToggle } from '../../components/ModeToggle';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '◉',
    Send: '↑',
    Swap: '⇄',
    Receive: '↓',
    Settings: '⚙',
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export default function TabLayout() {
  const { mode } = useWalletStore();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#f0f0f5',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerRight: () => <ModeToggle />,
        headerRightContainerStyle: { paddingRight: 16 },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#606070',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Open Wallet',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ focused }) => <TabIcon label="Send" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          tabBarIcon: ({ focused }) => <TabIcon label="Swap" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          title: 'Receive',
          tabBarIcon: ({ focused }) => <TabIcon label="Receive" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0f',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    paddingTop: 8,
    height: 85,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
    color: '#606070',
  },
  tabIconActive: {
    color: '#22c55e',
  },
});
