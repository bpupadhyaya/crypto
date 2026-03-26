/**
 * Receive Screen — Display wallet address and QR code.
 * Simple mode: Big QR, one address
 * Pro mode: Chain selector, multiple addresses, copy button
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { ChainId } from '../core/abstractions/types';

export function ReceiveScreen() {
  const { mode, supportedChains, addresses } = useWalletStore();
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const t = useTheme();

  // Use real derived addresses from wallet, fallback to "not available"
  const address = addresses[selectedChain] ?? 'Address not generated yet';

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg.primary,
      paddingHorizontal: 24,
    },
    title: {
      color: t.text.primary,
      fontSize: 24,
      fontWeight: '800',
      marginTop: 16,
      marginBottom: 20,
    },
    chainSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
      flexWrap: 'wrap',
    },
    chainButton: {
      backgroundColor: t.bg.card,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    chainButtonActive: {
      backgroundColor: t.accent.green,
    },
    chainButtonText: {
      color: t.text.secondary,
      fontSize: 14,
    },
    chainButtonTextActive: {
      color: t.bg.primary,
      fontWeight: '700',
    },
    qrContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    qrWrapper: {
      padding: 16,
      backgroundColor: '#ffffff',
      borderRadius: 20,
    },
    qrHint: {
      color: t.text.muted,
      fontSize: 13,
      marginTop: 12,
    },
    addressCard: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    addressLabel: {
      color: t.text.muted,
      fontSize: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    address: {
      color: t.text.primary,
      fontSize: 13,
      fontFamily: 'monospace',
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    copyHint: {
      color: t.accent.green,
      fontSize: 13,
      fontWeight: '600',
    },
    warningText: {
      color: t.accent.orange,
      fontSize: 12,
      marginTop: 16,
      textAlign: 'center',
      lineHeight: 18,
    },
  }), [t]);

  const copyAddress = async () => {
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const shareAddress = async () => {
    await Share.share({
      message: address,
      title: `My ${selectedChain} address`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receive</Text>

      {/* Chain selector */}
      <View style={styles.chainSelector}>
        {supportedChains.map((chain) => (
          <TouchableOpacity
            key={chain}
            style={[
              styles.chainButton,
              selectedChain === chain && styles.chainButtonActive,
            ]}
            onPress={() => setSelectedChain(chain)}
          >
            <Text
              style={[
                styles.chainButtonText,
                selectedChain === chain && styles.chainButtonTextActive,
              ]}
            >
              {chain.charAt(0).toUpperCase() + chain.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* QR Code — memoized to avoid SVG re-render */}
      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          {useMemo(() => (
            <QRCode value={address} size={200} backgroundColor="#ffffff" color="#0a0a0f" />
          ), [address])}
        </View>
        <Text style={styles.qrHint}>
          Scan to send {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)}
        </Text>
      </View>

      {/* Address */}
      <TouchableOpacity style={styles.addressCard} onPress={copyAddress} onLongPress={shareAddress}>
        <Text style={styles.addressLabel}>Your {selectedChain} address</Text>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode="middle">
          {address}
        </Text>
        <Text style={styles.copyHint}>Tap to copy • Long press to share</Text>
      </TouchableOpacity>

      {mode === 'pro' && (
        <Text style={styles.warningText}>
          Only send {selectedChain} and {selectedChain}-compatible tokens to this address.
          Sending other tokens may result in permanent loss.
        </Text>
      )}
    </SafeAreaView>
  );
}
