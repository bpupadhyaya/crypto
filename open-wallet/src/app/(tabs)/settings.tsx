import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen = React.lazy(() => import('../../screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));

export default function Settings() {
  return (
    <React.Suspense fallback={<View style={s.loading}><Text style={s.text}>Loading...</Text></View>}>
      <SettingsScreen />
    </React.Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#606070', fontSize: 14 },
});
