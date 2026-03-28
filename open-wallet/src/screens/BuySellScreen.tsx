/**
 * Buy/Sell Screen — Fiat on/off ramp via WebView + regional rails.
 *
 * Supports:
 * - ANY token from the registry (via TokenSelector)
 * - Multiple providers: MoonPay, Transak, Ramp
 * - Regional payment rails: UPI, M-Pesa, PIX, SEPA, FedNow, PayNow, PromptPay
 * - Price comparison across providers
 * - Demo mode simulation
 * - Sell (off-ramp) flow
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { usePrices } from '../hooks/usePrices';
import { isTestnet } from '../core/network';
import { TokenSelector } from '../components/TokenSelector';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import {
  PAYMENT_RAILS, getAllRails, createPaymentIntent,
  type PaymentRailConfig, type PaymentRail, type PaymentIntent,
} from '../core/payments/rails';
import type { ChainId } from '../core/abstractions/types';

// ── Provider Configuration ──

type FiatProvider = 'moonpay' | 'transak' | 'ramp';
type RampMode = 'buy' | 'sell';
type ProviderType = 'global' | 'regional';

interface RampParams {
  walletAddress: string;
  cryptoCurrency: string;
  fiatCurrency: string;
  amount?: string;
}

interface ProviderConfig {
  name: string;
  description: string;
  type: ProviderType;
  supportedCurrencies: string[];
  buyUrl: (params: RampParams) => string;
  sellUrl: (params: RampParams) => string;
  testMode: boolean;
  estimatedFeePercent: number;
}

const PROVIDERS: Record<FiatProvider, ProviderConfig> = {
  moonpay: {
    name: 'MoonPay',
    description: 'Buy & sell crypto with card, bank, or Apple Pay',
    type: 'global',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'JPY'],
    estimatedFeePercent: 3.5,
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
    type: 'global',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
    estimatedFeePercent: 2.5,
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
    type: 'global',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    estimatedFeePercent: 2.0,
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

// ── Provider Quote (estimated) ──

interface ProviderQuote {
  providerId: string;
  providerName: string;
  type: ProviderType;
  estimatedCrypto: number;
  feePercent: number;
  feeAmount: number;
  available: boolean;
  // For regional rails
  rail?: PaymentRailConfig;
}

interface Props {
  onClose: () => void;
}

export function BuySellScreen({ onClose }: Props) {
  const [rampMode, setRampMode] = useState<RampMode>('buy');
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(
    SUPPORTED_TOKENS.find((t) => t.symbol === 'ETH') ?? SUPPORTED_TOKENS[0],
  );
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [amountStr, setAmountStr] = useState('100');
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);

  const { addresses, currency, demoMode, balances } = useWalletStore();
  const { prices } = usePrices();
  const t = useTheme();

  // Get token price (from coingeckoId or symbol)
  const tokenPrice = useMemo(() => {
    return prices[selectedToken.coingeckoId] ?? prices[selectedToken.symbol.toLowerCase()] ?? 0;
  }, [prices, selectedToken]);

  const fiatAmount = parseFloat(amountStr) || 0;

  // Build quotes from all providers
  const quotes = useMemo((): ProviderQuote[] => {
    if (fiatAmount <= 0 || tokenPrice <= 0) return [];

    const result: ProviderQuote[] = [];

    // Global providers
    for (const [id, prov] of Object.entries(PROVIDERS) as [FiatProvider, ProviderConfig][]) {
      const feeAmount = fiatAmount * (prov.estimatedFeePercent / 100);
      const netFiat = fiatAmount - feeAmount;
      const estimatedCrypto = netFiat / tokenPrice;

      // Check sell availability
      const sellAvailable = rampMode === 'buy' || (prov.sellUrl({ walletAddress: '', cryptoCurrency: '', fiatCurrency: '' }) !== '');

      result.push({
        providerId: id,
        providerName: prov.name,
        type: 'global',
        estimatedCrypto,
        feePercent: prov.estimatedFeePercent,
        feeAmount,
        available: sellAvailable,
      });
    }

    // Regional rails
    const rails = getAllRails();
    for (const rail of rails) {
      // Rail fee parsing
      const feeStr = rail.fee.replace('%', '');
      const feePercent = parseFloat(feeStr) || 0;
      const feeAmount = fiatAmount * (feePercent / 100);
      const netFiat = fiatAmount - feeAmount;
      const estimatedCrypto = netFiat / tokenPrice;

      result.push({
        providerId: `rail-${rail.id}`,
        providerName: `${rail.name} (${rail.region})`,
        type: 'regional',
        estimatedCrypto,
        feePercent,
        feeAmount,
        available: rail.available,
        rail,
      });
    }

    // Sort by best rate (most crypto received)
    result.sort((a, b) => b.estimatedCrypto - a.estimatedCrypto);

    return result;
  }, [fiatAmount, tokenPrice, rampMode]);

  // Best quote
  const bestQuote = quotes.length > 0 ? quotes[0] : null;

  // Get current balance for selected token (for sell mode)
  const currentBalance = useMemo(() => {
    const bal = balances.find((b) => b.token?.symbol === selectedToken.symbol);
    if (!bal) return 0;
    return Number(bal.amount) / Math.pow(10, bal.token.decimals);
  }, [balances, selectedToken]);

  const walletAddress = addresses[selectedToken.chainId as ChainId] ?? '';

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.green },
    tabSellActive: { backgroundColor: t.accent.orange },
    tabText: { color: t.text.secondary, fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: t.bg.primary },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 8, marginTop: 16 },
    // Token selector button
    tokenBtn: {
      flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16,
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16,
    },
    tokenDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    tokenDotText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    tokenBtnInfo: { flex: 1 },
    tokenBtnSymbol: { color: t.text.primary, fontSize: 18, fontWeight: '700' },
    tokenBtnName: { color: t.text.muted, fontSize: 13, marginTop: 2 },
    tokenBtnChevron: { color: t.text.muted, fontSize: 20 },
    // Amount input
    amountCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    currencySymbol: { color: t.text.muted, fontSize: 28, fontWeight: '600', marginRight: 8 },
    amountInput: { color: t.text.primary, fontSize: 28, fontWeight: '600', flex: 1 },
    amountConverted: { color: t.text.muted, fontSize: 14, marginTop: 8 },
    // Quick amounts
    quickRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
    quickChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.bg.card },
    quickChipActive: { backgroundColor: t.accent.blue },
    quickChipText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    quickChipTextActive: { color: '#fff' },
    // Provider quotes
    quoteCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16,
      marginHorizontal: 20, marginBottom: 10,
    },
    quoteCardBest: { borderWidth: 2, borderColor: t.accent.green },
    quoteCardUnavailable: { opacity: 0.5 },
    quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    quoteLeft: { flex: 1 },
    quoteName: { color: t.text.primary, fontSize: 15, fontWeight: '700' },
    quoteType: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    quoteRight: { alignItems: 'flex-end' },
    quoteAmount: { color: t.accent.green, fontSize: 16, fontWeight: '800' },
    quoteFee: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    bestBadge: {
      position: 'absolute', top: -8, right: 12,
      backgroundColor: t.accent.green, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    },
    bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    // Rail-specific
    railInfo: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    railBadge: { backgroundColor: t.accent.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    railBadgeText: { color: t.accent.blue, fontSize: 11, fontWeight: '600' },
    // Buy/Sell button
    actionBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    actionBtnDisabled: { opacity: 0.5 },
    // Notes
    testnetNote: { color: t.accent.yellow, fontSize: 12, textAlign: 'center', marginTop: 12, marginHorizontal: 20 },
    addressNote: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 8, marginHorizontal: 20, lineHeight: 18, marginBottom: 20 },
    // Payment intent overlay
    intentOverlay: { backgroundColor: t.bg.card, borderRadius: 20, padding: 24, marginHorizontal: 20, marginTop: 20 },
    intentTitle: { color: t.text.primary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
    intentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    intentLabel: { color: t.text.muted, fontSize: 14 },
    intentValue: { color: t.text.primary, fontSize: 14, fontWeight: '600' },
    intentQR: {
      backgroundColor: '#fff', borderRadius: 12, padding: 20, marginVertical: 16,
      alignItems: 'center',
    },
    intentQRText: { color: '#333', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' as string },
    intentUri: {
      backgroundColor: t.bg.primary, borderRadius: 8, padding: 12, marginBottom: 16,
    },
    intentUriText: { color: t.accent.blue, fontSize: 12, textAlign: 'center' },
    intentExpiry: { color: t.accent.yellow, fontSize: 12, textAlign: 'center', marginBottom: 12 },
    intentCancel: { color: t.accent.red, fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
    // Sell balance
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12 },
    balanceLabel: { color: t.text.muted, fontSize: 13 },
    balanceValue: { color: t.text.primary, fontSize: 13, fontWeight: '600' },
    // Demo badge
    demoBadge: { backgroundColor: t.accent.purple + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 20, marginBottom: 12, alignItems: 'center' },
    demoBadgeText: { color: t.accent.purple, fontSize: 12, fontWeight: '700' },
    scroll: { flex: 1 },
  }), [t]);

  // ── Selected quote tracking ──
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const selectedQuote = quotes.find((q) => q.providerId === selectedQuoteId) ?? bestQuote;

  // ── Handlers ──

  const handleTokenSelect = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
  }, []);

  const handleProceed = useCallback(async () => {
    if (!walletAddress && !demoMode) {
      Alert.alert('No Address', `No ${selectedToken.chainId} address found. Please create a wallet first.`);
      return;
    }

    if (!selectedQuote) {
      Alert.alert('No Provider', 'Please enter an amount and select a provider.');
      return;
    }

    // Demo mode — simulate purchase/sale
    if (demoMode) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setLoading(false);

      if (rampMode === 'buy') {
        Alert.alert(
          'Demo Purchase Complete',
          `Simulated purchase of ~${selectedQuote.estimatedCrypto.toFixed(6)} ${selectedToken.symbol} for $${fiatAmount.toFixed(2)} via ${selectedQuote.providerName}.\n\nIn production, you would complete KYC and payment through the provider.`,
        );
      } else {
        Alert.alert(
          'Demo Sale Complete',
          `Simulated sale of ${selectedToken.symbol} for ~$${fiatAmount.toFixed(2)} via ${selectedQuote.providerName}.\n\nIn production, fiat would be sent to your linked bank account.`,
        );
      }
      return;
    }

    // Regional rail — create payment intent
    if (selectedQuote.type === 'regional' && selectedQuote.rail) {
      const intent = createPaymentIntent({
        rail: selectedQuote.rail.id,
        fiatAmount,
        cryptoSymbol: selectedToken.symbol,
        cryptoPrice: tokenPrice,
        receiverAddress: walletAddress,
      });
      setPaymentIntent(intent);
      return;
    }

    // Global provider — open WebView/browser
    const providerId = selectedQuote.providerId as FiatProvider;
    const provider = PROVIDERS[providerId];
    if (!provider) return;

    const params: RampParams = {
      walletAddress,
      cryptoCurrency: selectedToken.symbol,
      fiatCurrency: currency.toUpperCase(),
      amount: amountStr,
    };

    const url = rampMode === 'buy' ? provider.buyUrl(params) : provider.sellUrl(params);
    if (!url) {
      Alert.alert('Not Available', `${provider.name} doesn't support ${rampMode === 'sell' ? 'selling' : 'buying'} yet.`);
      return;
    }

    setLoading(true);
    try {
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
  }, [walletAddress, selectedToken, selectedQuote, fiatAmount, tokenPrice, currency, amountStr, rampMode, demoMode]);

  const handleOpenPaymentURI = useCallback(async () => {
    if (!paymentIntent) return;
    try {
      const canOpen = await Linking.canOpenURL(paymentIntent.paymentURI);
      if (canOpen) {
        await Linking.openURL(paymentIntent.paymentURI);
      } else {
        Alert.alert('Cannot Open', 'Payment app not found. Please scan the QR code instead.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open payment app.');
    }
  }, [paymentIntent]);

  // ── Quick amount chips ──
  const quickAmounts = ['50', '100', '250', '500', '1000'];

  // ── Crypto amount from fiat ──
  const estimatedCrypto = tokenPrice > 0 ? fiatAmount / tokenPrice : 0;

  // ── Render payment intent overlay ──
  if (paymentIntent) {
    const expiresIn = Math.max(0, Math.floor((paymentIntent.expiresAt - Date.now()) / 60000));
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Complete Payment</Text>
          <TouchableOpacity onPress={() => setPaymentIntent(null)}>
            <Text style={s.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.scroll}>
          <View style={s.intentOverlay}>
            <Text style={s.intentTitle}>
              {rampMode === 'buy' ? 'Pay to Buy' : 'Receive Fiat'} {selectedToken.symbol}
            </Text>

            <View style={s.intentRow}>
              <Text style={s.intentLabel}>Amount</Text>
              <Text style={s.intentValue}>{paymentIntent.currency} {paymentIntent.amount.toLocaleString()}</Text>
            </View>
            <View style={s.intentRow}>
              <Text style={s.intentLabel}>You Receive</Text>
              <Text style={s.intentValue}>~{paymentIntent.cryptoAmount.toFixed(6)} {paymentIntent.cryptoSymbol}</Text>
            </View>
            <View style={s.intentRow}>
              <Text style={s.intentLabel}>Rail</Text>
              <Text style={s.intentValue}>{paymentIntent.rail.toUpperCase()}</Text>
            </View>
            <View style={s.intentRow}>
              <Text style={s.intentLabel}>Reference</Text>
              <Text style={s.intentValue}>{paymentIntent.reference}</Text>
            </View>

            {/* QR Code placeholder */}
            <View style={s.intentQR}>
              <Text style={s.intentQRText}>{paymentIntent.qrData}</Text>
            </View>

            {/* Deep link */}
            <TouchableOpacity style={s.intentUri} onPress={handleOpenPaymentURI}>
              <Text style={s.intentUriText}>Open Payment App</Text>
            </TouchableOpacity>

            <Text style={s.intentExpiry}>Expires in {expiresIn} minutes</Text>

            <TouchableOpacity onPress={() => setPaymentIntent(null)}>
              <Text style={s.intentCancel}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Buy & Sell</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Demo mode badge */}
        {demoMode && (
          <View style={s.demoBadge}>
            <Text style={s.demoBadgeText}>DEMO MODE - Simulated transactions</Text>
          </View>
        )}

        {/* Buy / Sell Toggle */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, rampMode === 'buy' && s.tabActive]}
            onPress={() => setRampMode('buy')}
          >
            <Text style={[s.tabText, rampMode === 'buy' && s.tabTextActive]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, rampMode === 'sell' && s.tabSellActive]}
            onPress={() => setRampMode('sell')}
          >
            <Text style={[s.tabText, rampMode === 'sell' && s.tabTextActive]}>Sell</Text>
          </TouchableOpacity>
        </View>

        {/* Token Selection */}
        <Text style={s.section}>{rampMode === 'buy' ? 'Buy' : 'Sell'} Token</Text>
        <TouchableOpacity style={s.tokenBtn} onPress={() => setShowTokenSelector(true)} activeOpacity={0.7}>
          <View style={[s.tokenDot, { backgroundColor: selectedToken.color }]}>
            <Text style={s.tokenDotText}>{selectedToken.symbol.slice(0, 3)}</Text>
          </View>
          <View style={s.tokenBtnInfo}>
            <Text style={s.tokenBtnSymbol}>{selectedToken.symbol}</Text>
            <Text style={s.tokenBtnName}>{selectedToken.name}</Text>
          </View>
          <Text style={s.tokenBtnChevron}>{'>'}</Text>
        </TouchableOpacity>

        {/* Balance (sell mode) */}
        {rampMode === 'sell' && (
          <View style={s.balanceRow}>
            <Text style={s.balanceLabel}>Available Balance</Text>
            <Text style={s.balanceValue}>{currentBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedToken.symbol}</Text>
          </View>
        )}

        {/* Amount Input */}
        <Text style={s.section}>
          {rampMode === 'buy' ? 'Amount to Spend' : 'Fiat Equivalent'}
        </Text>
        <View style={s.amountCard}>
          <View style={s.amountRow}>
            <Text style={s.currencySymbol}>$</Text>
            <TextInput
              style={s.amountInput}
              placeholder="0"
              placeholderTextColor={t.text.muted}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="decimal-pad"
            />
          </View>
          {tokenPrice > 0 && fiatAmount > 0 && (
            <Text style={s.amountConverted}>
              ~ {estimatedCrypto.toFixed(6)} {selectedToken.symbol}
              {tokenPrice > 0 ? ` @ $${tokenPrice >= 1 ? tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : tokenPrice.toFixed(6)}` : ''}
            </Text>
          )}
        </View>

        {/* Quick amounts */}
        <View style={s.quickRow}>
          {quickAmounts.map((a) => (
            <TouchableOpacity
              key={a}
              style={[s.quickChip, amountStr === a && s.quickChipActive]}
              onPress={() => setAmountStr(a)}
            >
              <Text style={[s.quickChipText, amountStr === a && s.quickChipTextActive]}>
                ${a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Provider Comparison */}
        {quotes.length > 0 && (
          <>
            <Text style={s.section}>Providers — Compare Rates</Text>
            {quotes.map((quote, idx) => {
              const isBest = idx === 0;
              const isSelected = (selectedQuoteId ?? bestQuote?.providerId) === quote.providerId;
              return (
                <TouchableOpacity
                  key={quote.providerId}
                  style={[
                    s.quoteCard,
                    isSelected && s.quoteCardBest,
                    !quote.available && s.quoteCardUnavailable,
                  ]}
                  onPress={() => quote.available && setSelectedQuoteId(quote.providerId)}
                  activeOpacity={0.7}
                >
                  {isBest && (
                    <View style={s.bestBadge}>
                      <Text style={s.bestBadgeText}>BEST RATE</Text>
                    </View>
                  )}
                  <View style={s.quoteHeader}>
                    <View style={s.quoteLeft}>
                      <Text style={s.quoteName}>{quote.providerName}</Text>
                      <Text style={s.quoteType}>
                        {quote.type === 'regional' ? 'Regional Rail' : 'Global Provider'}
                      </Text>
                    </View>
                    <View style={s.quoteRight}>
                      <Text style={s.quoteAmount}>
                        ~{quote.estimatedCrypto.toFixed(6)} {selectedToken.symbol}
                      </Text>
                      <Text style={s.quoteFee}>
                        Fee: {quote.feePercent}% (~${quote.feeAmount.toFixed(2)})
                      </Text>
                    </View>
                  </View>
                  {quote.rail && (
                    <View style={s.railInfo}>
                      <View style={s.railBadge}>
                        <Text style={s.railBadgeText}>{quote.rail.currency}</Text>
                      </View>
                      <View style={s.railBadge}>
                        <Text style={s.railBadgeText}>{quote.rail.estimatedTime}</Text>
                      </View>
                      <View style={s.railBadge}>
                        <Text style={s.railBadgeText}>{quote.rail.region}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Proceed Button */}
        <TouchableOpacity
          style={[
            s.actionBtn,
            { backgroundColor: rampMode === 'buy' ? t.accent.green : t.accent.orange },
            (!selectedQuote || loading) && s.actionBtnDisabled,
          ]}
          onPress={handleProceed}
          disabled={loading || !selectedQuote}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.actionBtnText}>
              {rampMode === 'buy'
                ? `Buy ${selectedToken.symbol}${selectedQuote ? ` via ${selectedQuote.providerName}` : ''}`
                : `Sell ${selectedToken.symbol}${selectedQuote ? ` via ${selectedQuote.providerName}` : ''}`}
            </Text>
          )}
        </TouchableOpacity>

        {isTestnet() && (
          <Text style={s.testnetNote}>
            Testnet mode -- using sandbox providers. No real money will be charged.
          </Text>
        )}

        <Text style={s.addressNote}>
          {selectedToken.symbol} will be {rampMode === 'buy' ? 'sent to' : 'sent from'} your wallet address:{'\n'}
          {walletAddress ? `${walletAddress.slice(0, 12)}...${walletAddress.slice(-8)}` : 'No address available'}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Token Selector Modal */}
      <TokenSelector
        visible={showTokenSelector}
        onSelect={handleTokenSelect}
        onClose={() => setShowTokenSelector(false)}
        title={rampMode === 'buy' ? 'Buy Token' : 'Sell Token'}
      />
    </SafeAreaView>
  );
}
