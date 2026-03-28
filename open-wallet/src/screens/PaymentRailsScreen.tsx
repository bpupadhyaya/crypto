/**
 * Payment Rails Screen — Buy/sell crypto via regional payment systems.
 * UPI (India), M-Pesa (Africa), FedNow (USA), SEPA (EU), PIX (Brazil), etc.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, Linking,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getPrices } from '../core/priceService';
import {
  PAYMENT_RAILS, type PaymentRailConfig, type PaymentRail,
  createPaymentIntent, detectRailForLocale,
} from '../core/payments/rails';

interface Props {
  onClose: () => void;
}

export function PaymentRailsScreen({ onClose }: Props) {
  const [selectedRail, setSelectedRail] = useState<PaymentRailConfig | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('SOL');
  const locale = useWalletStore((s) => s.locale);
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  // Auto-detect best rail for user's locale
  const detectedRail = useMemo(() => detectRailForLocale(locale), [locale]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    heroCard: { backgroundColor: t.accent.green + '10', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
    heroTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
    heroSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginTop: 16 },
    railCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    railCardActive: { borderWidth: 2, borderColor: t.accent.green },
    railIcon: { fontSize: 28, marginRight: 12 },
    railInfo: { flex: 1 },
    railName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    railRegion: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    railMeta: { color: t.text.secondary, fontSize: 11, marginTop: 2 },
    railFee: { alignItems: 'flex-end' },
    railFeeText: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    railTime: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    detected: { backgroundColor: t.accent.green + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
    detectedText: { color: t.accent.green, fontSize: 10, fontWeight: '700' },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 16 },
    inputLabel: { color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 20, fontWeight: '600' },
    cryptoRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    cryptoChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    cryptoChipActive: { backgroundColor: t.accent.green },
    cryptoText: { color: t.text.secondary, fontSize: 13 },
    cryptoTextActive: { color: '#fff', fontWeight: '700' },
    estimate: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 12 },
    buyBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
    buyBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  }), [t]);

  const prices = getPrices();
  const cryptoPrice = prices[selectedCrypto] ?? 0;
  const fiatAmount = parseFloat(amount) || 0;
  const cryptoAmount = cryptoPrice > 0 ? fiatAmount / cryptoPrice : 0;

  const handleBuy = useCallback(() => {
    if (!selectedRail) { Alert.alert('Select Rail', 'Choose a payment method.'); return; }
    if (fiatAmount <= 0) { Alert.alert('Amount', 'Enter an amount.'); return; }

    if (demoMode) {
      Alert.alert(
        'Demo Purchase',
        `${selectedRail.currencySymbol}${fiatAmount.toFixed(2)} via ${selectedRail.name} → ~${cryptoAmount.toFixed(6)} ${selectedCrypto}\n\nThis is a demo transaction.`,
      );
      return;
    }

    const intent = createPaymentIntent({
      rail: selectedRail.id,
      fiatAmount,
      cryptoSymbol: selectedCrypto,
      cryptoPrice,
      receiverAddress: '',
    });

    // Try to open the payment app
    Linking.canOpenURL(intent.paymentURI).then((supported) => {
      if (supported) {
        Linking.openURL(intent.paymentURI);
      } else {
        Alert.alert(
          'Payment Ready',
          `Reference: ${intent.reference}\n\nSend ${selectedRail.currencySymbol}${fiatAmount.toFixed(2)} via ${selectedRail.name}.\n\nYou'll receive ~${cryptoAmount.toFixed(6)} ${selectedCrypto} once payment is confirmed.`,
        );
      }
    });
  }, [selectedRail, fiatAmount, cryptoAmount, selectedCrypto, cryptoPrice, demoMode]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Buy with Local Currency</Text>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>Pay with Your Local System</Text>
          <Text style={s.heroSub}>
            Buy crypto using the payment system your country already uses. No credit card needed — just your regular banking app.
          </Text>
        </View>

        <Text style={s.section}>Choose Payment Method</Text>
        {PAYMENT_RAILS.map((rail) => (
          <TouchableOpacity
            key={rail.id}
            style={[s.railCard, selectedRail?.id === rail.id && s.railCardActive]}
            onPress={() => setSelectedRail(rail)}
          >
            <Text style={s.railIcon}>{rail.icon}</Text>
            <View style={s.railInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.railName}>{rail.name}</Text>
                {detectedRail?.id === rail.id && (
                  <View style={s.detected}><Text style={s.detectedText}>DETECTED</Text></View>
                )}
              </View>
              <Text style={s.railRegion}>{rail.region} ({rail.currency})</Text>
              <Text style={s.railMeta}>Min: {rail.currencySymbol}{rail.minAmount} — Max: {rail.currencySymbol}{rail.maxAmount.toLocaleString()}</Text>
            </View>
            <View style={s.railFee}>
              <Text style={s.railFeeText}>{rail.fee}</Text>
              <Text style={s.railTime}>{rail.estimatedTime}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {selectedRail && (
          <>
            <View style={s.inputCard}>
              <Text style={s.inputLabel}>Amount ({selectedRail.currency})</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={t.text.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={s.section}>Buy</Text>
            <View style={s.cryptoRow}>
              {['BTC', 'ETH', 'SOL', 'OTK'].map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={[s.cryptoChip, selectedCrypto === sym && s.cryptoChipActive]}
                  onPress={() => setSelectedCrypto(sym)}
                >
                  <Text style={[s.cryptoText, selectedCrypto === sym && s.cryptoTextActive]}>{sym}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {fiatAmount > 0 && cryptoPrice > 0 && (
              <Text style={s.estimate}>
                {selectedRail.currencySymbol}{fiatAmount.toFixed(2)} = ~{cryptoAmount.toFixed(6)} {selectedCrypto}
              </Text>
            )}

            <TouchableOpacity style={s.buyBtn} onPress={handleBuy}>
              <Text style={s.buyBtnText}>Pay with {selectedRail.name}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
