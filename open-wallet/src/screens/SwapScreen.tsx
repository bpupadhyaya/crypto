import { fonts } from '../utils/theme';
/**
 * Swap Screen — 8 swap options with security ratings, pros/cons.
 *
 * Built-in (always available):
 * 🔐 Open Wallet Atomic Swap (5/5) — P2P, standalone, ALWAYS works
 * 🏊 Open Wallet DEX (4/5) — AMM on Open Chain
 * 📋 Open Wallet Order Book (4.5/5) — Limit orders
 *
 * External (more liquidity):
 * ⚡ THORChain (3.5/5) · 📊 1inch (3.5/5) · ⚡ Jupiter (3.5/5)
 * 🌉 Li.Fi (3/5) · 🌊 Osmosis (4/5)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { useTheme } from '../hooks/useTheme';
import { getAllSwapOptions, type SwapOption } from '../core/swap';
import { executeSwapTransaction } from '../core/swap/executor';
import { checkRealTransactionAllowed, recordPaperTrade, getSwapFlow, getTrafficLightEmoji } from '../core/paperTrading';
import { isTestnet } from '../core/network';
import type { Token } from '../core/abstractions/types';
import { detectChainFromAddress, STABLECOIN_CHAINS, CHAIN_ICONS, CHAIN_COLORS, type StablecoinChain } from '../core/chains/addressDetection';

const SWAP_TOKENS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'OTK', 'ATOM'];

export function SwapScreen() {
  const { mode, addresses, setStablecoinChain, demoMode, updateDevBalance, devBalances } = useWalletStore();
  const [fromSymbol, setFromSymbol] = useState('BTC');
  const [toSymbol, setToSymbol] = useState('USDT');
  const [amountStr, setAmountStr] = useState('');
  const [options, setOptions] = useState<SwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SwapOption | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stablecoin destination chain state
  const isStablecoinSwap = toSymbol === 'USDC' || toSymbol === 'USDT';
  const [destAddress, setDestAddress] = useState('');
  const [detectedChain, setDetectedChain] = useState<StablecoinChain | null>(null);
  const [isChainAmbiguous, setIsChainAmbiguous] = useState(false);
  const [confirmedChain, setConfirmedChain] = useState<StablecoinChain | null>(null);
  const [showChainPicker, setShowChainPicker] = useState(false);
  const [chainPickerCandidates, setChainPickerCandidates] = useState<StablecoinChain[]>([]);
  const [useOwnAddress, setUseOwnAddress] = useState(true); // default: receive to own wallet

  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 20 },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy, marginTop: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4, marginBottom: 16 },
    // Token selector
    tokenRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    tokenChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: t.bg.card },
    tokenChipActive: { backgroundColor: t.accent.green },
    tokenChipText: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    tokenChipTextActive: { color: t.bg.primary },
    // Swap card
    swapCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 8 },
    cardLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    amountInput: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.semibold },
    flipBtn: { alignSelf: 'center', backgroundColor: t.accent.green, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -12, zIndex: 1 },
    flipIcon: { color: t.bg.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    toCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
    toAmount: { color: t.text.secondary, fontSize: fonts.xl, fontWeight: fonts.bold },
    toLabel: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    // Section headers
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
    sectionTitle: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5 },
    compareBtn: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    // Option cards
    optionCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    optionCardSelected: { borderWidth: 2, borderColor: t.accent.green },
    optionCardUnavailable: { opacity: 0.5 },
    optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    optionIcon: { fontSize: fonts.xxl, marginRight: 10 },
    optionName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold, flex: 1 },
    optionAmount: { color: t.accent.green, fontSize: fonts.lg, fontWeight: fonts.heavy },
    optionAmountUnavail: { color: t.text.muted, fontSize: fonts.md },
    optionMeta: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: t.text.muted, fontSize: fonts.sm },
    securityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    securityText: { fontSize: fonts.xs, fontWeight: fonts.bold },
    // Expanded details
    expandedBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border },
    expandedLabel: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 8 },
    expandedText: { color: t.text.secondary, fontSize: fonts.sm, lineHeight: 20, marginTop: 2 },
    expandBtn: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold, marginTop: 8 },
    // Fallback note
    fallbackNote: { backgroundColor: t.accent.green + '10', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 20 },
    fallbackText: { color: t.accent.green, fontSize: fonts.sm, lineHeight: 18, textAlign: 'center' },
    // Swap button
    swapBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
    swapBtnDisabled: { opacity: 0.5 },
    swapBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    // Loading
    loadingBox: { padding: 40, alignItems: 'center' },
    loadingText: { color: t.text.muted, fontSize: fonts.md, marginTop: 12 },
  }), [t]);

  // Fetch quotes when amount, tokens, or destination address changes
  useEffect(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { setOptions([]); setSelectedOption(null); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const fromAddr = addresses.ethereum ?? addresses.bitcoin ?? '';
        // For stablecoin swaps, use the user-entered destination address so that
        // THORChain (and other providers) can return a quote for the correct destination.
        const effectiveToAddr = destAddress.trim() || (addresses.ethereum ?? '');
        const results = await getAllSwapOptions({
          fromToken: fromSymbol, toToken: toSymbol,
          fromAmount: amount, fromAddress: fromAddr, toAddress: effectiveToAddr,
          slippageBps,
        });
        setOptions(results);
      } catch {
        setOptions([]);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [amountStr, fromSymbol, toSymbol, addresses, destAddress, slippageBps]);

  const flipTokens = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmountStr('');
    setOptions([]);
    setSelectedOption(null);
    setDestAddress('');
    setDetectedChain(null);
    setConfirmedChain(null);
    setIsChainAmbiguous(false);
    setUseOwnAddress(true);
  }, [fromSymbol, toSymbol]);

  // When destination address changes, detect chain
  const handleDestAddressChange = useCallback((addr: string) => {
    setDestAddress(addr);
    setDetectedChain(null);
    setConfirmedChain(null);
    setIsChainAmbiguous(false);

    if (addr.trim().length < 10) return;
    const result = detectChainFromAddress(addr);
    if (!result.chain) return;

    setDetectedChain(result.chain);
    setIsChainAmbiguous(result.ambiguous);

    if (result.ambiguous) {
      // EVM address — let user pick which chain
      setChainPickerCandidates(result.candidates);
      setShowChainPicker(true);
    } else {
      // Unambiguous — confirm with user
      Alert.alert(
        `${CHAIN_ICONS[result.chain]} Detected: ${result.chain}`,
        `This address appears to be on ${result.chain}.\nReceive ${toSymbol} on ${result.chain}?`,
        [
          { text: 'Yes, use ' + result.chain, onPress: () => setConfirmedChain(result.chain) },
          {
            text: 'Choose different chain',
            onPress: () => { setChainPickerCandidates(STABLECOIN_CHAINS); setShowChainPicker(true); },
          },
        ],
      );
    }
  }, [toSymbol]);

  // Slippage tolerance
  const [slippageBps, setSlippageBps] = useState(50); // 0.5% default
  const SLIPPAGE_OPTIONS = [
    { label: '0.1%', value: 10 },
    { label: '0.5%', value: 50 },
    { label: '1%', value: 100 },
    { label: '3%', value: 300 },
    { label: '5%', value: 500 },
  ];

  const [isPaperSwap, setIsPaperSwap] = useState(false);

  const handleSwap = useCallback(async (paperMode: boolean = false) => {
    if (!selectedOption) {
      Alert.alert('Select Option', 'Please choose a swap method.');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to swap.');
      return;
    }

    // Balance check — prevent attempting a swap with insufficient funds
    {
      let available = 0;
      if (demoMode || isTestnet()) {
        const { devBalances: liveBalances } = useWalletStore.getState();
        available = liveBalances[fromSymbol] ?? 0;
      } else {
        // Real balance check on mainnet
        try {
          const { fetchAllBalances } = await import('../core/balances/balanceFetcher');
          const realBalances = await fetchAllBalances(addresses);
          available = realBalances[fromSymbol] ?? 0;
        } catch {
          // If balance fetch fails, allow the swap attempt — the chain will reject if insufficient
          available = Infinity;
        }
      }
      if (amountNum > available) {
        Alert.alert(
          'Insufficient Balance',
          `Available: ${available.toFixed(8)} ${fromSymbol}\nYou entered: ${amountNum} ${fromSymbol}`,
        );
        return;
      }
    }

    // For stablecoin swaps, chain selection is required
    if (isStablecoinSwap && !confirmedChain) {
      Alert.alert(
        'Select Chain',
        `Please select which chain you want to receive ${toSymbol} on.`,
      );
      return;
    }

    // For external address, require address input
    if (isStablecoinSwap && !useOwnAddress && !destAddress.trim()) {
      Alert.alert(
        'Destination Address Required',
        `Please enter the wallet address where you want to receive ${toSymbol}.`,
      );
      return;
    }

    setIsPaperSwap(paperMode);

    // Check paper trading for real swaps
    if (!paperMode && !isTestnet()) {
      const flow = getSwapFlow(selectedOption.id);
      const check = await checkRealTransactionAllowed(flow);
      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Practice Trade Recommended`,
          check.message,
          [
            { text: 'Practice Now', onPress: () => { setIsPaperSwap(true); setShowConfirm(true); } },
            { text: 'Not Now', style: 'cancel' },
          ]
        );
        return;
      }
    }

    setShowConfirm(true);
  }, [selectedOption, amountStr, fromSymbol, toSymbol, demoMode, isStablecoinSwap, destAddress, confirmedChain, useOwnAddress]);

  const executeSwap = useCallback(async (vaultPassword?: string, onProgress?: (update: any) => void) => {
    if (isPaperSwap) {
      await new Promise((r) => setTimeout(r, 1500));
      const flow = getSwapFlow(selectedOption?.id ?? '');
      const status = await recordPaperTrade(flow);
      // Save chain association for dashboard display
      if (isStablecoinSwap && confirmedChain) {
        setStablecoinChain(toSymbol, confirmedChain);
      }
      // Update dev balances so dashboard reflects the swap
      if (demoMode || isTestnet()) {
        const toAmount = selectedOption?.toAmount ?? 0;
        updateDevBalance(fromSymbol, -parseFloat(amountStr));
        updateDevBalance(toSymbol, toAmount);
      }
      // Record paper swap to history
      const { recordSwap } = await import('../core/swap/swapHistory');
      await recordSwap({
        from: fromSymbol, to: toSymbol,
        fromAmount: parseFloat(amountStr), toAmount: selectedOption?.toAmount ?? 0,
        provider: selectedOption?.name ?? 'Unknown', status: 'completed',
        isPaper: true, chain: confirmedChain ?? undefined,
      });

      Alert.alert(
        `${getTrafficLightEmoji(status.light)} Practice Swap Complete`,
        `${amountStr} ${fromSymbol} → ${selectedOption?.toAmount.toFixed(4)} ${toSymbol} (simulated)\n\nVia: ${selectedOption?.name}${confirmedChain ? `\nChain: ${CHAIN_ICONS[confirmedChain]} ${confirmedChain}` : ''}\nPractice trades completed: ${status.count}/3 recommended\n\n${status.light === 'green' ? 'Wonderful! You\'re now cleared for real transactions. The path is verified and you\'re ready to go.' : `We recommend ${3 - status.count} more practice trade${3 - status.count > 1 ? 's' : ''} to fully verify this transaction path. Each one helps ensure your real funds will arrive safely.`}`
      );
    } else {
      // Demo mode — simulate a successful real swap without touching any network
      if (demoMode || isTestnet()) {
        await new Promise((r) => setTimeout(r, 1800));
        const fakeTxHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
        const toAmount = selectedOption?.toAmount ?? 0;
        if (isStablecoinSwap && confirmedChain) setStablecoinChain(toSymbol, confirmedChain);
        updateDevBalance(fromSymbol, -parseFloat(amountStr));
        updateDevBalance(toSymbol, toAmount);
        // Record dev swap to history
        const { recordSwap: recordDevSwap } = await import('../core/swap/swapHistory');
        await recordDevSwap({
          from: fromSymbol, to: toSymbol,
          fromAmount: parseFloat(amountStr), toAmount,
          provider: selectedOption?.name ?? 'Unknown', txHash: fakeTxHash,
          status: 'completed', isPaper: false, chain: confirmedChain ?? undefined,
        });

        Alert.alert(
          '✅ Swap Executed (Dev Mode)',
          `${amountStr} ${fromSymbol} → ~${selectedOption?.toAmount.toFixed(4)} ${toSymbol}\n\nVia: ${selectedOption?.name}${confirmedChain ? `\nChain: ${CHAIN_ICONS[confirmedChain]} ${confirmedChain}` : ''}\n\nTx: ${fakeTxHash.slice(0, 16)}...${fakeTxHash.slice(-8)}\n\n⚡ Simulated in dev/testnet mode. No real funds moved.`,
        );
      } else {
      // Real swap execution
      const password = vaultPassword ?? useWalletStore.getState().tempVaultPassword;
      if (!password) {
        Alert.alert('Error', 'Wallet not unlocked. Please sign in again.');
        throw new Error('Wallet not unlocked');
      }

      try {
        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);

        const result = await executeSwapTransaction({
          option: selectedOption!,
          fromAmount: parseFloat(amountStr),
          fromSymbol, toSymbol,
          mnemonic: contents.mnemonic,
          accountIndex: useWalletStore.getState().activeAccountIndex,
          fromAddress: addresses.bitcoin ?? addresses.ethereum ?? '',
          toAddress: destAddress.trim() || (addresses.ethereum ?? ''),
          onProgress,
        });

        if (result.success && isStablecoinSwap && confirmedChain) {
          setStablecoinChain(toSymbol, confirmedChain);
        }

        // Record real swap to history
        const { recordSwap: recordRealSwap } = await import('../core/swap/swapHistory');
        await recordRealSwap({
          from: fromSymbol, to: toSymbol,
          fromAmount: parseFloat(amountStr), toAmount: selectedOption?.toAmount ?? 0,
          provider: result.provider, txHash: result.txHash,
          status: result.success ? 'completed' : 'failed',
          isPaper: false, chain: confirmedChain ?? undefined,
        });

        Alert.alert(
          result.success ? 'Swap Initiated' : 'Swap Failed',
          result.message,
        );

        if (!result.success) throw new Error(result.message);
      } catch (err) {
        throw err;
      }
      } // end real-swap else
    }
    setAmountStr('');
    setOptions([]);
    setSelectedOption(null);
    setShowConfirm(false);
    setIsPaperSwap(false);
  }, [amountStr, fromSymbol, toSymbol, selectedOption, isPaperSwap, addresses, isStablecoinSwap, confirmedChain, setStablecoinChain, demoMode, updateDevBalance]);

  const getSecurityColor = (rating: number) => {
    if (rating >= 4.5) return t.accent.green;
    if (rating >= 3.5) return t.accent.yellow;
    return t.accent.orange;
  };

  const getSecurityBg = (rating: number) => getSecurityColor(rating) + '20';

  if (showConfirm && selectedOption) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'swap',
          fromSymbol, fromAmount: amountStr,
          toSymbol, toAmount: selectedOption.toAmount.toFixed(4),
          fee: selectedOption.fee,
          route: `${selectedOption.name} (Security: ${selectedOption.securityRating}/5)`,
          swapProviderId: selectedOption.id,
          swapProviderName: selectedOption.name,
        }}
        onConfirm={executeSwap}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  const builtIn = options.filter((o) => o.category === 'built-in');
  const external = options.filter((o) => o.category === 'external');

  const renderOption = (opt: SwapOption) => {
    const isExpanded = expandedId === opt.id;
    const isSelected = selectedOption?.id === opt.id;
    return (
      <TouchableOpacity
        key={opt.id}
        style={[s.optionCard, isSelected && s.optionCardSelected, !opt.available && s.optionCardUnavailable]}
        onPress={() => opt.available && setSelectedOption(opt)}
        activeOpacity={0.7}
      >
        <View style={s.optionHeader}>
          <View style={s.optionLeft}>
            <Text style={s.optionIcon}>{opt.icon}</Text>
            <Text style={s.optionName} numberOfLines={1}>{opt.name}</Text>
          </View>
          {opt.available ? (
            <Text style={s.optionAmount}>~{opt.toAmount.toFixed(2)} {toSymbol}</Text>
          ) : (
            <Text style={s.optionAmountUnavail}>{opt.error ?? 'Unavailable'}</Text>
          )}
        </View>

        <View style={s.optionMeta}>
          <View style={[s.securityBadge, { backgroundColor: getSecurityBg(opt.securityRating) }]}>
            <Text style={[s.securityText, { color: getSecurityColor(opt.securityRating) }]}>
              {'★'.repeat(Math.floor(opt.securityRating))}{opt.securityRating % 1 ? '½' : ''} {opt.securityRating}/5
            </Text>
          </View>
          <View style={s.metaBadge}><Text style={s.metaText}>{opt.speed}</Text></View>
          <View style={s.metaBadge}><Text style={s.metaText}>Fee: {opt.fee}</Text></View>
          {opt.priceImpact > 0.1 && (
            <View style={s.metaBadge}><Text style={[s.metaText, { color: t.accent.orange }]}>Impact: {opt.priceImpact.toFixed(1)}%</Text></View>
          )}
          {opt.alwaysAvailable && (
            <View style={[s.securityBadge, { backgroundColor: t.accent.green + '20' }]}>
              <Text style={[s.securityText, { color: t.accent.green }]}>ALWAYS ON</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : opt.id)}>
          <Text style={s.expandBtn}>{isExpanded ? 'Hide Details' : 'Learn More'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.expandedBox}>
            <Text style={s.expandedLabel}>Security</Text>
            <Text style={s.expandedText}>{opt.securityNote}</Text>
            <Text style={s.expandedLabel}>Route</Text>
            <Text style={s.expandedText}>{opt.route}</Text>
            <Text style={s.expandedLabel}>How It Works</Text>
            <Text style={s.expandedText}>
              {opt.id === 'ow-atomic' ? 'Hash Time-Locked Contracts (HTLC) between you and a counterparty. Pure cryptography — if either party fails, both get refunded automatically. No intermediary involved.' :
               opt.id === 'ow-dex' ? 'Automated Market Maker (AMM) pool on Open Chain. Your tokens swap against pooled liquidity. Price determined by constant product formula (x × y = k). Near-zero fees.' :
               opt.id === 'ow-orderbook' ? 'You fill a limit order from another user. Settlement is atomic (all-or-nothing). Set your own price. If no matching order exists, your order waits.' :
               `External protocol: ${opt.route}. Your transaction is processed by the protocol's smart contracts/validators. Open Wallet signs locally — your keys never leave your device.`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Swap</Text>
        <Text style={s.subtitle}>8 options — you choose. Your keys, your decision.</Text>

        {/* From */}
        <Text style={s.cardLabel}>From</Text>
        <View style={s.tokenRow}>
          {SWAP_TOKENS.filter((t) => t !== toSymbol).map((sym) => (
            <TouchableOpacity key={sym} style={[s.tokenChip, fromSymbol === sym && s.tokenChipActive]} onPress={() => { setFromSymbol(sym); setOptions([]); setSelectedOption(null); }}>
              <Text style={[s.tokenChipText, fromSymbol === sym && s.tokenChipTextActive]}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.swapCard}>
          <TextInput style={s.amountInput} placeholder="0.00" placeholderTextColor={t.text.muted} value={amountStr} onChangeText={setAmountStr} keyboardType="decimal-pad" />
        </View>

        {/* Flip */}
        <TouchableOpacity style={s.flipBtn} onPress={flipTokens}>
          <Text style={s.flipIcon}>↕</Text>
        </TouchableOpacity>

        {/* To */}
        <Text style={s.cardLabel}>To</Text>
        <View style={s.tokenRow}>
          {SWAP_TOKENS.filter((t) => t !== fromSymbol).map((sym) => (
            <TouchableOpacity key={sym} style={[s.tokenChip, toSymbol === sym && s.tokenChipActive]} onPress={() => { setToSymbol(sym); setOptions([]); setDestAddress(''); setDetectedChain(null); setConfirmedChain(null); setSelectedOption(null); }}>
              <Text style={[s.tokenChipText, toSymbol === sym && s.tokenChipTextActive]}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stablecoin chain selection + optional external address */}
        {isStablecoinSwap && (
          <View style={{ marginBottom: 16 }}>
            {/* Chain selector — always shown for stablecoin swaps */}
            <Text style={s.cardLabel}>Receive {toSymbol} on which chain?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {STABLECOIN_CHAINS.map((chain) => (
                  <TouchableOpacity
                    key={chain}
                    style={[
                      s.tokenChip,
                      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
                      confirmedChain === chain && { backgroundColor: CHAIN_COLORS[chain] + '30', borderWidth: 1.5, borderColor: CHAIN_COLORS[chain] },
                    ]}
                    onPress={() => {
                      setConfirmedChain(chain);
                      // Auto-set own address based on chain
                      if (useOwnAddress) {
                        const ownAddr = chain === 'Solana' ? (addresses.solana ?? '')
                          : chain === 'Cosmos' ? (addresses.cosmos ?? '')
                          : (addresses.ethereum ?? ''); // EVM chains share ETH address
                        setDestAddress(ownAddr);
                      }
                    }}
                  >
                    <Text style={{ fontSize: fonts.lg }}>{CHAIN_ICONS[chain]}</Text>
                    <Text style={[
                      s.tokenChipText,
                      confirmedChain === chain && { color: CHAIN_COLORS[chain], fontWeight: fonts.bold },
                    ]}>{chain}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Own address vs external toggle */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TouchableOpacity
                style={[s.tokenChip, useOwnAddress && s.tokenChipActive]}
                onPress={() => {
                  setUseOwnAddress(true);
                  setDestAddress('');
                  // Re-set own address for selected chain
                  if (confirmedChain) {
                    const ownAddr = confirmedChain === 'Solana' ? (addresses.solana ?? '')
                      : confirmedChain === 'Cosmos' ? (addresses.cosmos ?? '')
                      : (addresses.ethereum ?? '');
                    setDestAddress(ownAddr);
                  }
                }}
              >
                <Text style={[s.tokenChipText, useOwnAddress && s.tokenChipTextActive]}>My Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tokenChip, !useOwnAddress && s.tokenChipActive]}
                onPress={() => { setUseOwnAddress(false); setDestAddress(''); }}
              >
                <Text style={[s.tokenChipText, !useOwnAddress && s.tokenChipTextActive]}>External Address</Text>
              </TouchableOpacity>
            </View>

            {/* Show address input only for external */}
            {!useOwnAddress && (
              <View style={[s.swapCard, { paddingVertical: 12 }]}>
                <TextInput
                  style={[s.amountInput, { fontSize: fonts.sm }]}
                  placeholder="Paste destination wallet address"
                  placeholderTextColor={t.text.muted}
                  value={destAddress}
                  onChangeText={handleDestAddressChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Show confirmed chain + address summary */}
            {confirmedChain && useOwnAddress && (
              <View style={{ backgroundColor: CHAIN_COLORS[confirmedChain] + '15', borderRadius: 12, padding: 12, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: fonts.lg }}>{CHAIN_ICONS[confirmedChain]}</Text>
                  <Text style={{ color: CHAIN_COLORS[confirmedChain], fontWeight: fonts.bold, fontSize: fonts.sm }}>
                    Receive {toSymbol} on {confirmedChain}
                  </Text>
                </View>
                <Text style={{ color: t.text.muted, fontSize: fonts.xs, marginTop: 4 }} numberOfLines={1}>
                  {destAddress ? `To: ${destAddress.slice(0, 12)}...${destAddress.slice(-8)}` : 'Using your own wallet address'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Chain Picker Modal */}
        <Modal visible={showChainPicker} transparent animationType="slide" onRequestClose={() => setShowChainPicker(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: t.bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
              <Text style={{ color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold, marginBottom: 4 }}>Select Destination Chain</Text>
              <Text style={{ color: t.text.muted, fontSize: fonts.sm, marginBottom: 16 }}>
                {isChainAmbiguous
                  ? 'EVM address works on multiple chains — choose which one:'
                  : `Select the chain to receive ${toSymbol} on:`}
              </Text>
              {chainPickerCandidates.map((chain) => (
                <TouchableOpacity
                  key={chain}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border, gap: 12 }}
                  onPress={() => { setConfirmedChain(chain); setShowChainPicker(false); }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: CHAIN_COLORS[chain] + '25', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: fonts.xl }}>{CHAIN_ICONS[chain]}</Text>
                  </View>
                  <Text style={{ flex: 1, color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold }}>{chain}</Text>
                  {confirmedChain === chain && <Text style={{ color: t.accent.green, fontSize: fonts.xl }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', paddingVertical: 14 }} onPress={() => setShowChainPicker(false)}>
                <Text style={{ color: t.text.muted, fontSize: fonts.md }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Loading */}
        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={t.accent.green} size="large" />
            <Text style={s.loadingText}>Fetching quotes from 8 providers...</Text>
          </View>
        )}

        {/* Built-in Options */}
        {builtIn.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Built Into Open Wallet (Always Available)</Text>
            </View>
            {builtIn.map(renderOption)}
          </>
        )}

        {/* External Options */}
        {external.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>External Protocols (More Liquidity)</Text>
            </View>
            {external.map(renderOption)}
          </>
        )}

        {/* Fallback note */}
        {options.length > 0 && (
          <View style={s.fallbackNote}>
            <Text style={s.fallbackText}>
              🔐 Open Wallet Atomic Swap is ALWAYS available as fallback. It uses pure cryptography — no external service, protocol, or API can shut it down.
            </Text>
          </View>
        )}

        {/* Slippage Tolerance */}
        {options.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[s.sectionTitle, { marginBottom: 8 }]}>Slippage Tolerance</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SLIPPAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSlippageBps(opt.value)}
                  style={[
                    s.tokenChip,
                    slippageBps === opt.value && s.tokenChipActive,
                  ]}
                >
                  <Text style={[
                    s.tokenChipText,
                    slippageBps === opt.value && s.tokenChipTextActive,
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {slippageBps >= 300 && (
              <Text style={{ color: t.accent.yellow, fontSize: fonts.xs, marginTop: 6 }}>
                High slippage — you may receive significantly less than quoted.
              </Text>
            )}
          </View>
        )}

        {/* Swap buttons */}
        {selectedOption && (
          <>
            <TouchableOpacity style={[s.swapBtn, { backgroundColor: t.accent.purple }]} onPress={() => handleSwap(true)}>
              <Text style={s.swapBtnText}>📝 Paper Swap (Practice)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.swapBtn, { marginTop: 10 }]} onPress={() => handleSwap(false)}>
              <Text style={s.swapBtnText}>
                {demoMode || isTestnet() ? `⚡ Swap via ${selectedOption.name} (Dev)` : `Swap via ${selectedOption.name} (Real)`}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
