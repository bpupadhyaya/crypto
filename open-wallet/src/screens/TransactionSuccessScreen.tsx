import { fonts } from '../utils/theme';
/**
 * Transaction Success Screen — shown after a transaction completes.
 * Displays confirmation details with explorer link and share options.
 */

import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Linking, Share, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../hooks/useTheme';
import { getExplorerUrl } from '../core/explorers';

export type TransactionType = 'Sent' | 'Received' | 'Swapped' | 'Bridged' | 'Staked';

interface Props {
  type: TransactionType;
  amount: string;
  token: string;
  recipient?: string;
  txHash: string;
  chain: string;
  testnet?: boolean;
  isGratitude?: boolean;
  onDone: () => void;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const TransactionSuccessScreen = React.memo(({
  type,
  amount,
  token,
  recipient,
  txHash,
  chain,
  testnet = false,
  isGratitude = false,
  onDone,
}: Props) => {
  const t = useTheme();

  const explorerUrl = useMemo(
    () => getExplorerUrl(chain, txHash, testnet),
    [chain, txHash, testnet],
  );

  const handleCopyHash = async () => {
    try {
      await Clipboard.setStringAsync(txHash);
      Alert.alert('Copied', 'Transaction hash copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  };

  const handleViewExplorer = () => {
    Linking.openURL(explorerUrl).catch(() => {
      Alert.alert('Error', 'Could not open block explorer.');
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${type} ${amount} ${token} on ${chain}\nTx: ${explorerUrl}`,
      });
    } catch {}
  };

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    checkmark: { fontSize: 72, marginBottom: 16 },
    celebration: { fontSize: 48, marginBottom: 8 },
    title: { color: t.text.primary, fontSize: 28, fontWeight: fonts.heavy, marginBottom: 8 },
    subtitle: { color: t.accent.green, fontSize: 16, fontWeight: fonts.semibold, marginBottom: 32 },
    card: { backgroundColor: t.bg.card, borderRadius: 20, padding: 20, width: '100%', marginBottom: 24 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    label: { color: t.text.muted, fontSize: 14 },
    value: { color: t.text.primary, fontSize: 14, fontWeight: fonts.semibold, maxWidth: '60%', textAlign: 'right' },
    hashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    hashText: { color: t.accent.blue, fontSize: 14, fontWeight: fonts.semibold },
    copyBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, backgroundColor: t.accent.blue + '20' },
    copyBtnText: { color: t.accent.blue, fontSize: 12, fontWeight: fonts.bold },
    divider: { height: 1, backgroundColor: t.border, marginVertical: 4 },
    explorerBtn: {
      width: '100%', paddingVertical: 16, borderRadius: 16,
      backgroundColor: t.accent.blue + '15', alignItems: 'center', marginBottom: 12,
    },
    explorerBtnText: { color: t.accent.blue, fontSize: 16, fontWeight: fonts.bold },
    shareBtn: {
      width: '100%', paddingVertical: 16, borderRadius: 16,
      backgroundColor: t.accent.purple + '15', alignItems: 'center', marginBottom: 12,
    },
    shareBtnText: { color: t.accent.purple, fontSize: 16, fontWeight: fonts.bold },
    doneBtn: {
      width: '100%', paddingVertical: 16, borderRadius: 16,
      backgroundColor: t.accent.green, alignItems: 'center', marginBottom: 32,
    },
    doneBtnText: { color: '#000', fontSize: 16, fontWeight: fonts.heavy },
  }), [t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        {/* Celebration for gratitude transactions */}
        {isGratitude && <Text style={s.celebration}>{'🎉🎊✨'}</Text>}

        {/* Green checkmark */}
        <Text style={s.checkmark}>{'✅'}</Text>

        <Text style={s.title}>Transaction Complete</Text>
        <Text style={s.subtitle}>{type} Successfully</Text>

        {/* Details card */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>Type</Text>
            <Text style={s.value}>{type}</Text>
          </View>
          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.label}>Amount</Text>
            <Text style={s.value}>{amount} {token}</Text>
          </View>
          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.label}>Chain</Text>
            <Text style={s.value}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>
          </View>

          {recipient && (
            <>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.label}>Recipient</Text>
                <Text style={s.value}>{truncateAddress(recipient)}</Text>
              </View>
            </>
          )}

          <View style={s.divider} />
          <View style={s.hashRow}>
            <Text style={s.label}>Tx Hash</Text>
            <TouchableOpacity style={s.copyBtn} onPress={handleCopyHash}>
              <Text style={s.copyBtnText}>{truncateAddress(txHash)}  Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={s.explorerBtn} onPress={handleViewExplorer}>
          <Text style={s.explorerBtnText}>View on Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnText}>Share Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.doneBtn} onPress={onDone}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});
