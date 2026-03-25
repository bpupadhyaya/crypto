/**
 * Root Layout — Minimal, fast startup.
 * Heavy modules (i18n, crypto, providers) are lazy-loaded.
 */

// Polyfills — must be first
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
import 'react-native-get-random-values';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Lazy init — don't block startup
let providersInitialized = false;
function ensureProviders() {
  if (providersInitialized) return;
  providersInitialized = true;
  import('../core/bootstrap').then((m) => m.bootstrapProviders());
}

// i18n — lazy, non-blocking
import('../i18n').catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, gcTime: 60_000 },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
  return (
    <View style={s.errorContainer}>
      <Text style={s.errorIcon}>!</Text>
      <Text style={s.errorTitle}>Something went wrong</Text>
      <Text style={s.errorMessage}>{msg}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={resetErrorBoundary}>
        <Text style={s.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  React.useEffect(() => { ensureProviders(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
          animation: 'none', // fastest transition
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}

const s = StyleSheet.create({
  errorContainer: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorIcon: { color: '#f97316', fontSize: 48, fontWeight: '900', marginBottom: 16 },
  errorTitle: { color: '#f0f0f5', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  errorMessage: { color: '#a0a0b0', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: { backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
  retryText: { color: '#0a0a0f', fontSize: 16, fontWeight: '700' },
});
