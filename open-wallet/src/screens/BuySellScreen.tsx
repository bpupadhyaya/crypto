/**
 * Buy/Sell Screen — Fiat on/off ramp via WebView.
 *
 * Supports multiple providers (MoonPay, Transak, Ramp).
 * Opens the provider's hosted widget in a secure WebView.
 * User completes KYC and payment within the widget.
 * Purchased crypto is sent to the wallet address.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { isTestnet } from '../core/network';
import type { ChainId } from '../core/abstractions/types';

// ─── Provider Configuration ───

type FiatProvider = 'moonpay' | 'transak' | 'ramp';
type RampMode = 'buy' | 'sell';

interface ProviderConfig {
  name: string;
  description: string;
  supportedCurrencies: string[];
  buyUrl: (params: RampParams) => string;
  sellUrl: (params: RampParams) => string;
  testMode: boolean;
}

interface RampParams {
  walletAddress: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  amount?: string;
}

const PROVIDERS: Record<FiatProvider, ProviderConfig> = {
  moonpay: {
    name: 'MoonPay',
    description: 'Buy & sell crypto with card, bank, or Apple Pay',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
    buyUrl: (p) =>
      `https://buy${isTestnet() ? '-sandbox' : ''}.moonpay.com?` +
      `apiKey=${isTestnet() ? 'pk_test_open_wallet' : 'pk_live_open_wallet'}` +
      `&currencyCode=${p.cryptoCurrency.toLowerCase()}` +
      `&walletAddress=${p.walletAddress}` +
      `&baseCurrencyCode=${p.fiatCurrency.toLowerCase()}` +
      (p.amount ? `&baseCurrencyAmount=${p.amount}` : ''),
    sellUrl: (p) =>
      `https://sell${isTestnet() ? '-sandbox' : ''}.moonpay.com?` +
      `apiKey=${isTestnet() ? 'pk_test_open_wallet' : 'pk_live_open_wallet'}` +
      `&quoteCurrencyCode=${p.fiatCurrency.toLowerCase()}` +
      `&baseCurrencyCode=${p.cryptoCurrency.toLowerCase()}` +
      `&walletAddress=${p.walletAddress}`,
    testMode: true,
  },
  transak: {
    name: 'Transak',
    description: 'Buy crypto in 150+ countries with local payment methods',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
    buyUrl: (p) =>
      `https://global${isTestnet() ? '-stg' : ''}.transak.com?` +
      `apiKey=${isTestnet() ? 'transak_test_key' : 'transak_live_key'}` +
      `&cryptoCurrencyCode=${p.cryptoCurrency}` +
      `&walletAddress=${p.walletAddress}` +
      `&fiatCurrency=${p.fiatCurrency}` +
      (p.amount ? `&fiatAmount=${p.amount}` : ''),
    sellUrl: (p) =>
      `https://global${isTestnet() ? '-stg' : ''}.transak.com?` +
      `apiKey=${isTestnet() ? 'transak_test_key' : 'transak_live_key'}` +
      `&productsAvailed=SELL` +
      `&cryptoCurrencyCode=${p.cryptoCurrency}` +
      `&walletAddress=${p.walletAddress}`,
    testMode: true,
  },
  ramp: {
    name: 'Ramp',
    description: 'Fast on-ramp with instant bank transfers',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    buyUrl: (p) =>
      `https://app.ramp.network?` +
      `hostApiKey=${isTestnet() ? 'ramp_test_key' : 'ramp_live_key'}` +
      `&swapAsset=${p.cryptoCurrency}` +
      `&userAddress=${p.walletAddress}` +
      `&fiatCurrency=${p.fiatCurrency}` +
      (p.amount ? `&fiatValue=${p.amount}` : ''),
    sellUrl: () => '', // Ramp doesn't support sell yet
    testMode: false,
  },
};

const CRYPTO_OPTIONS: Array<{ symbol: string; chain: ChainId; name: string }> = [
  { symbol: 'ETH', chain: 'ethereum', name: 'Ethereum' },
  { symbol: 'BTC', chain: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'SOL', chain: 'solana', name: 'Solana' },
  { symbol: 'USDC', chain: 'ethereum', name: 'USD Coin' },
  { symbol: 'USDT', chain: 'ethereum', name: 'Tether' },
];

interface Props {
  onClose: () => void;
}

export function BuySellScreen({ onClose }: Props) {
  const [rampMode, setRampMode] = useState<RampMode>('buy');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [selectedProvider, setSelectedProvider] = useState<FiatProvider>('moonpay');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const { addresses, currency } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.green },
    tabText: { color: t.text.secondary, fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 8, marginTop: 16 },
    cryptoRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: t.bg.card },
    chipActive: { backgroundColor: t.accent.green },
    chipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    chipTextActive: { color: t.bg.primary },
    amountRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
    amountChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, backgroundColor: t.bg.card },
    amountChipActive: { backgroundColor: t.accent.blue },
    amountText: { color: t.text.secondary, fontSize: 15, fontWeight: '600' },
    amountTextActive: { color: '#fff' },
    providerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    providerCardActive: { borderWidth: 2, borderColor: t.accent.green },
    providerName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    providerDesc: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    providerBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    providerBadgeText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    buyBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    buyBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    testnetNote: { color: t.accent.yellow, fontSize: 12, textAlign: 'center', marginTop: 12, marginHorizontal: 20 },
    addressNote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, marginHorizontal: 20, lineHeight: 18 },
  }), [t]);

  const walletAddress = addresses[selectedCrypto.chain] ?? '';
  const provider = PROVIDERS[selectedProvider];

  const handleProceed = useCallback(async () => {
    if (!walletAddress) {
      Alert.alert('No Address', `No ${selectedCrypto.chain} address found. Please create a wallet first.`);
      return;
    }

    const params: RampParams = {
      walletAddress,
      cryptoCurrency: selectedCrypto.symbol,
      fiatCurrency: currency,
      amount,
    };

    const url = rampMode === 'buy' ? provider.buyUrl(params) : provider.sellUrl(params);
    if (!url) {
      Alert.alert('Not Available', `${provider.name} doesn't support ${rampMode === 'sell' ? 'selling' : 'buying'} yet.`);
      return;
    }

    setLoading(true);
    try {
      // Open in external browser for now (WebView requires native rebuild)
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open the payment provider. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to open provider');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, selectedCrypto, currency, amount, rampMode, provider]);

  const amounts = ['50', '100', '250', '500', '1000'];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Buy & Sell</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Buy / Sell Toggle */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, rampMode === 'buy' && s.tabActive]} onPress={() => setRampMode('buy')}>
          <Text style={[s.tabText, rampMode === 'buy' && s.tabTextActive]}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, rampMode === 'sell' && s.tabActive]} onPress={() => setRampMode('sell')}>
          <Text style={[s.tabText, rampMode === 'sell' && s.tabTextActive]}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Crypto Selection */}
      <Text style={s.section}>{rampMode === 'buy' ? 'Buy' : 'Sell'}</Text>
      <View style={s.cryptoRow}>
        {CRYPTO_OPTIONS.map((c) => (
          <TouchableOpacity
            key={c.symbol}
            style={[s.chip, selectedCrypto.symbol === c.symbol && s.chipActive]}
            onPress={() => setSelectedCrypto(c)}
          >
            <Text style={[s.chipText, selectedCrypto.symbol === c.symbol && s.chipTextActive]}>
              {c.symbol}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount Selection */}
      <Text style={s.section}>Amount ({currency})</Text>
      <View style={s.amountRow}>
        {amounts.map((a) => (
          <TouchableOpacity
            key={a}
            style={[s.amountChip, amount === a && s.amountChipActive]}
            onPress={() => setAmount(a)}
          >
            <Text style={[s.amountText, amount === a && s.amountTextActive]}>
              ${a}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Provider Selection */}
      <Text style={s.section}>Provider</Text>
      {(Object.entries(PROVIDERS) as [FiatProvider, ProviderConfig][]).map(([key, prov]) => (
        <TouchableOpacity
          key={key}
          style={[s.providerCard, selectedProvider === key && s.providerCardActive]}
          onPress={() => setSelectedProvider(key)}
        >
          <Text style={s.providerName}>{prov.name}</Text>
          <Text style={s.providerDesc}>{prov.description}</Text>
          {selectedProvider === key && (
            <View style={s.providerBadge}>
              <Text style={s.providerBadgeText}>Selected</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Proceed Button */}
      <TouchableOpacity
        style={[s.buyBtn, { backgroundColor: rampMode === 'buy' ? t.accent.green : t.accent.orange }]}
        onPress={handleProceed}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.buyBtnText}>
            {rampMode === 'buy' ? `Buy ${selectedCrypto.symbol}` : `Sell ${selectedCrypto.symbol}`}
          </Text>
        )}
      </TouchableOpacity>

      {isTestnet() && (
        <Text style={s.testnetNote}>
          Testnet mode — using sandbox providers. No real money will be charged.
        </Text>
      )}

      <Text style={s.addressNote}>
        {selectedCrypto.symbol} will be {rampMode === 'buy' ? 'sent to' : 'sent from'} your wallet address:{'\n'}
        {walletAddress ? `${walletAddress.slice(0, 12)}...${walletAddress.slice(-8)}` : 'No address'}
      </Text>
    </SafeAreaView>
  );
}
