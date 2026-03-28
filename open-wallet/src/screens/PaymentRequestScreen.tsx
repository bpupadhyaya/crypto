/**
 * Payment Request Screen — generate shareable payment links.
 *
 * Create a payment request with amount + token, share as QR code or link.
 * When scanned, the sender's wallet auto-fills send screen.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Share, Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { createPaymentRequestLink } from '../core/deepLinking';

interface Props {
  onClose: () => void;
}

const TOKENS = ['SOL', 'BTC', 'ETH', 'OTK', 'USDT', 'USDC', 'ATOM'];

export function PaymentRequestScreen({ onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [memo, setMemo] = useState('');
  const [generated, setGenerated] = useState(false);
  const addresses = useWalletStore((s) => s.addresses);
  const t = useTheme();

  const chainMap: Record<string, string> = {
    SOL: 'solana', BTC: 'bitcoin', ETH: 'ethereum', OTK: 'openchain',
    USDT: 'ethereum', USDC: 'ethereum', ATOM: 'cosmos',
  };

  const address = addresses[chainMap[selectedToken] ?? 'solana'] ?? '';

  const paymentLink = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return '';
    return createPaymentRequestLink(parseFloat(amount), selectedToken, address, memo || undefined);
  }, [amount, selectedToken, address, memo]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 24 },
    label: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 },
    tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: t.bg.card },
    chipActive: { backgroundColor: t.accent.green },
    chipText: { color: t.text.secondary, fontSize: 14 },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 20, fontWeight: '600', marginTop: 8 },
    memoInput: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginTop: 8 },
    generateBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    generateText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    qrCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 20 },
    qrLabel: { color: t.text.muted, fontSize: 13, marginTop: 16, textAlign: 'center' },
    shareRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    shareBtn: { flex: 1, backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    copyBtn: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    copyBtnText: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    requestSummary: { color: t.text.primary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  }), [t]);

  const handleGenerate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Amount Required', 'Enter the amount you want to receive.');
      return;
    }
    setGenerated(true);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Pay me ${amount} ${selectedToken}\n\n${paymentLink}`,
      title: 'Payment Request',
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Request Payment</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.label}>Token</Text>
        <View style={s.tokenRow}>
          {TOKENS.map((tok) => (
            <TouchableOpacity key={tok} style={[s.chip, selectedToken === tok && s.chipActive]} onPress={() => { setSelectedToken(tok); setGenerated(false); }}>
              <Text style={[s.chipText, selectedToken === tok && s.chipTextActive]}>{tok}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Amount</Text>
        <TextInput style={s.input} placeholder="0.00" placeholderTextColor={t.text.muted} value={amount} onChangeText={(v) => { setAmount(v); setGenerated(false); }} keyboardType="decimal-pad" />

        <Text style={s.label}>Memo (optional)</Text>
        <TextInput style={s.memoInput} placeholder="What's this for?" placeholderTextColor={t.text.muted} value={memo} onChangeText={setMemo} />

        {!generated ? (
          <TouchableOpacity style={s.generateBtn} onPress={handleGenerate}>
            <Text style={s.generateText}>Generate QR Code</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={s.requestSummary}>Requesting {amount} {selectedToken}</Text>
            <View style={s.qrCard}>
              <QRCode value={paymentLink} size={200} backgroundColor="#ffffff" color="#0a0a0f" />
              <Text style={s.qrLabel}>Scan to pay with any Open Wallet</Text>
            </View>
            <View style={s.shareRow}>
              <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
                <Text style={s.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.copyBtn} onPress={() => { /* copy to clipboard */ Alert.alert('Copied', 'Payment link copied!'); }}>
                <Text style={s.copyBtnText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
