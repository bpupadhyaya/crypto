import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReceiveScreen = React.lazy(() => import('../../screens/ReceiveScreen').then(m => ({ default: m.ReceiveScreen })));

export default function Receive() {
  return (
    <React.Suspense fallback={<View style={s.loading}><Text style={s.text}>Loading...</Text></View>}>
      <ReceiveScreen />
    </React.Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#606070', fontSize: 14 },
});
