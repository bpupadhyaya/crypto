import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SendScreen = React.lazy(() => import('../../screens/SendScreen').then(m => ({ default: m.SendScreen })));

export default function Send() {
  return (
    <React.Suspense fallback={<View style={s.loading}><Text style={s.text}>Loading...</Text></View>}>
      <SendScreen />
    </React.Suspense>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#606070', fontSize: 14 },
});
