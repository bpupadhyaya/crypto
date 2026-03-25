import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SwapScreen = React.lazy(() => import('../../screens/SwapScreen').then(m => ({ default: m.SwapScreen })));

export default function Swap() {
  return (
    <React.Suspense fallback={<View style={s.loading}><Text style={s.text}>Loading...</Text></View>}>
      <SwapScreen />
    </React.Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#606070', fontSize: 14 },
});
