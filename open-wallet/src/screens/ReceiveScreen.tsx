import { fonts } from '../utils/theme';
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

const CHAIN_LABELS: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  cosmos: 'Cosmos',
  openchain: 'Open Chain',
};

const CHAIN_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  cosmos: 'ATOM',
  openchain: 'OTK',
};

const SYMBOL_TO_CHAIN: Record<string, ChainId> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', ATOM: 'cosmos',
  OTK: 'openchain', USDT: 'ethereum', USDC: 'ethereum',
};

export function ReceiveScreen() {
  const { mode, supportedChains, addresses, selectedTokenSymbol, selectedTokenChain, setSelectedTokenContext } = useWalletStore();
  const initialChain = selectedTokenChain ?? (selectedTokenSymbol ? SYMBOL_TO_CHAIN[selectedTokenSymbol] : null) ?? 'solana';
  const [selectedChain, setSelectedChain] = useState<ChainId>(initialChain);

  React.useEffect(() => {
    if (selectedTokenSymbol || selectedTokenChain) {
      if (selectedTokenChain) setSelectedChain(selectedTokenChain);
      else if (selectedTokenSymbol && SYMBOL_TO_CHAIN[selectedTokenSymbol]) setSelectedChain(SYMBOL_TO_CHAIN[selectedTokenSymbol]);
      setSelectedTokenContext(null, null);
    }
  }, []);
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
      fontSize: fonts.xxl,
      fontWeight: fonts.heavy,
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
      fontSize: fonts.md,
    },
    chainButtonTextActive: {
      color: t.bg.primary,
      fontWeight: fonts.bold,
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
      fontSize: fonts.sm,
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
      fontSize: fonts.sm,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    address: {
      color: t.text.primary,
      fontSize: fonts.sm,
      fontFamily: 'monospace',
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    copyHint: {
      color: t.accent.green,
      fontSize: fonts.sm,
      fontWeight: fonts.semibold,
    },
    warningText: {
      color: t.accent.orange,
      fontSize: fonts.sm,
      marginTop: 16,
      textAlign: 'center',
      lineHeight: 18,
    },
  }), [t]);

  const copyAddress = async () => {
    const { secureCopy } = await import('../core/security/secureClipboard');
    await secureCopy(address, 'Address', 60000);
  };

  const shareAddress = async () => {
    await Share.share({
      message: address,
      title: `My ${CHAIN_LABELS[selectedChain] ?? selectedChain} address`,
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
              {CHAIN_LABELS[chain] ?? chain.charAt(0).toUpperCase() + chain.slice(1)}
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
          Scan to send {CHAIN_SYMBOLS[selectedChain] ?? selectedChain.toUpperCase()} ({CHAIN_LABELS[selectedChain] ?? selectedChain})
        </Text>
      </View>

      {/* Address */}
      <TouchableOpacity style={styles.addressCard} onPress={copyAddress} onLongPress={shareAddress}>
        <Text style={styles.addressLabel}>Your {CHAIN_LABELS[selectedChain] ?? selectedChain} ({CHAIN_SYMBOLS[selectedChain] ?? selectedChain.toUpperCase()}) address</Text>
        <Text style={styles.address} numberOfLines={2} ellipsizeMode="middle">
          {address}
        </Text>
        <Text style={styles.copyHint}>Tap to copy • Long press to share</Text>
      </TouchableOpacity>

      {mode === 'pro' && (
        <Text style={styles.warningText}>
          Only send {CHAIN_SYMBOLS[selectedChain] ?? selectedChain.toUpperCase()} and {CHAIN_LABELS[selectedChain] ?? selectedChain}-compatible tokens to this address.
          Sending other tokens may result in permanent loss.
        </Text>
      )}
    </SafeAreaView>
  );
}
