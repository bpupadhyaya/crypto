/**
 * Root Layout — App-level providers and error boundaries.
 * This wraps the entire application.
 */

// MUST be first imports — polyfills for React Native (Hermes engine)
// Buffer: used by viem, ethers, bitcoinjs — not available in Hermes
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;
// crypto.getRandomValues: used by @scure/bip39, @noble/hashes, viem
import 'react-native-get-random-values';

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { bootstrapProviders } from '../core/bootstrap';

import '../i18n';

// Initialize providers on app start
bootstrapProviders();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — prices/balances refresh interval
      retry: 2,
    },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>!</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={resetErrorBoundary}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0a0a0f' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    color: '#f97316',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#f0f0f5',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#a0a0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '700',
  },
});
