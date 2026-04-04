import { fonts } from '../utils/theme';
/**
 * Bridge Screen — Cross-chain token transfers.
 * IBC (Open Chain ↔ Cosmos), Li.Fi (EVM), THORChain (BTC).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { isTestnet, getIBCChannel } from '../core/network';
import { useTheme } from '../hooks/useTheme';
import {
  checkRealTransactionAllowed,
  recordPaperTrade,
  getTrafficLightEmoji,
  type TrafficLight,
  type TradeFlow,
} from '../core/paperTrading';

const BRIDGE_CHAINS = ['openchain', 'cosmos', 'bitcoin', 'ethereum', 'solana', 'avalanche', 'polygon', 'bsc'];
const CHAIN_LABELS: Record<string, string> = {
  openchain: 'Open Chain', cosmos: 'Cosmos',
  bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana',
  avalanche: 'Avalanche', polygon: 'Polygon', bsc: 'BNB Chain',
};

function isIbcRoute(from: string, to: string): boolean {
  return getIBCChannel(from, to) !== undefined;
}

function isBtcRoute(from: string, to: string): boolean {
  return from === 'bitcoin' || to === 'bitcoin';
}

function getRouteLabel(from: string, to: string): string {
  if (isIbcRoute(from, to)) return 'IBC Transfer (native, trustless)';
  if (isBtcRoute(from, to)) return 'THORChain (native, no wrapping)';
  return 'Li.Fi Aggregator (best rate)';
}

export function BridgeScreen({ onClose }: { onClose: () => void }) {
  const [fromChain, setFromChain] = useState('openchain');
  const [toChain, setToChain] = useState('cosmos');
  const [amount, setAmount] = useState('');
  const [bridging, setBridging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaperMode, setIsPaperMode] = useState(false);
  const [paperLight, setPaperLight] = useState<TrafficLight>('red');
  const t = useTheme();

  const fromToken = useMemo(
    () => SUPPORTED_TOKENS.find((tk) => tk.chainId === fromChain && tk.isNative),
    [fromChain]
  );
  const toToken = useMemo(
    () => SUPPORTED_TOKENS.find((tk) => tk.chainId === toChain && tk.isNative),
    [toChain]
  );

  const fromSymbol = fromToken?.symbol ?? fromChain.toUpperCase();
  const toSymbol = toToken?.symbol ?? toChain.toUpperCase();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    scroll: { paddingHorizontal: 20 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 20 },
    label: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    chainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chainChip: { backgroundColor: t.bg.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
    chainChipActive: { backgroundColor: t.accent.purple },
    chainText: { color: t.text.secondary, fontSize: fonts.sm },
    chainTextActive: { color: '#fff', fontWeight: fonts.bold },
    amountCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
    amountLabel: { color: t.text.secondary, fontSize: fonts.lg, fontWeight: fonts.bold, marginRight: 12 },
    amountInput: { flex: 1, color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.semibold, textAlign: 'right' },
    flipBtn: { alignSelf: 'center', backgroundColor: t.accent.purple, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginVertical: -8, zIndex: 1 },
    flipIcon: { color: '#fff', fontSize: fonts.xl, fontWeight: fonts.heavy },
    receiveCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 16 },
    receiveLabel: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1 },
    receiveAmount: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.bold, marginTop: 8 },
    receiveNote: { color: t.text.muted, fontSize: fonts.sm, marginTop: 4 },
    routeCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginTop: 12 },
    routeLabel: { color: t.text.muted, fontSize: fonts.sm },
    routeValue: { color: t.text.secondary, fontSize: fonts.sm },
    bridgeBtn: { backgroundColor: t.accent.purple, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    paperBtn: { backgroundColor: t.accent.blue, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
    bridgeBtnDisabled: { opacity: 0.6 },
    bridgeBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold },
    hint: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  }), [t]);

  const flipChains = useCallback(() => {
    setFromChain(toChain);
    setToChain(fromChain);
    setAmount('');
  }, [fromChain, toChain]);

  const handleBridge = useCallback(async (paperMode: boolean) => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }

    setIsPaperMode(paperMode);

    // For non-IBC routes, show coming-soon alerts
    if (!isIbcRoute(fromChain, toChain) && !paperMode) {
      if (isBtcRoute(fromChain, toChain)) {
        Alert.alert('Coming Soon', 'THORChain bridge integration is under development. Use paper trading to practice this flow.');
        return;
      }
      // EVM routes
      Alert.alert('Coming Soon', 'Li.Fi bridge integration is under development. Use paper trading to practice this flow.');
      return;
    }

    // Check paper trading status for real transactions
    if (!paperMode && !isTestnet()) {
      const flow: TradeFlow = 'swap-lifi'; // bridge flows use swap-lifi for paper tracking
      const check = await checkRealTransactionAllowed(flow);

      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Paper Trade Required`,
          check.message,
          [
            { text: 'Do Paper Trade', onPress: () => handleBridge(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      if (check.light === 'orange') {
        setPaperLight('orange');
      }
    }

    setShowConfirm(true);
  }, [amount, fromChain, toChain]);

  const executeBridge = useCallback(async (vaultPassword?: string) => {
    try {
      setBridging(true);

      // Paper trade mode — simulate
      if (isPaperMode) {
        await new Promise((r) => setTimeout(r, 1500));
        const flow: TradeFlow = 'swap-lifi';
        const status = await recordPaperTrade(flow);
        Alert.alert(
          `${getTrafficLightEmoji(status.light)} Paper Trade Complete`,
          `Bridge ${amount} ${fromSymbol} -> ${toSymbol} (simulated).\n\nPaper trades: ${status.count}/3 recommended.\n\n${status.light === 'green' ? 'You are now cleared for real bridge transactions!' : status.light === 'orange' ? 'You can now use real funds, but we recommend more practice.' : 'Complete at least 1 more paper trade to unlock real transactions.'}`,
        );
        setAmount('');
        setShowConfirm(false);
        setIsPaperMode(false);
        return;
      }

      // Demo mode — simulate success
      const demoMode = useWalletStore.getState().demoMode;
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 1500));
        Alert.alert(
          'Demo Bridge Complete',
          `${amount} ${fromSymbol} bridged to ${toSymbol} (simulated).\n\nThis is a demo — no real funds were moved.`,
        );
        setAmount('');
        setShowConfirm(false);
        return;
      }

      // Real IBC transfer
      if (isIbcRoute(fromChain, toChain)) {
        const store = useWalletStore.getState();
        const password = vaultPassword ?? store.tempVaultPassword;
        if (!password) throw new Error('Wallet not unlocked. Please sign in again.');

        // 1. Unlock vault
        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(password);

        // 2. Restore HD wallet
        const { HDWallet } = await import('../core/wallet/hdwallet');
        const wallet = HDWallet.fromMnemonic(contents.mnemonic);

        // 3. Create signer for source chain
        const { CosmosSigner } = await import('../core/chains/cosmos-signer');
        const signer = CosmosSigner.fromWallet(
          wallet,
          store.activeAccountIndex,
          fromChain as 'openchain' | 'cosmos',
        );

        // 4. Get IBC channel
        const channel = getIBCChannel(fromChain, toChain);
        if (!channel) throw new Error(`No IBC channel for ${fromChain} -> ${toChain}`);

        // 5. Execute IBC transfer
        // Recipient: use the user's own address on the destination chain
        const destSigner = CosmosSigner.fromWallet(
          wallet,
          store.activeAccountIndex,
          toChain as 'openchain' | 'cosmos',
        );
        const destAddress = await destSigner.getAddress();
        const txHash = await signer.sendIbcTransfer(destAddress, amount, channel);

        // 6. Clean up
        wallet.destroy();

        Alert.alert(
          'IBC Transfer Sent',
          `${amount} ${fromSymbol} bridged to ${CHAIN_LABELS[toChain]}.\n\nTx: ${txHash.slice(0, 16)}...${txHash.slice(-8)}\n\nTokens will arrive once a relayer processes the packet (usually 1-5 minutes).`,
        );
        setAmount('');
        setShowConfirm(false);
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Bridge transaction failed';
      if (msg.includes('timed out') || msg.includes('timeout')) {
        msg = 'Network request timed out. Please check your connection and try again.';
      }
      Alert.alert('Bridge Failed', msg);
      throw err; // Re-throw so ConfirmTransactionScreen resets to review
    } finally {
      setBridging(false);
    }
  }, [isPaperMode, amount, fromChain, toChain, fromSymbol, toSymbol]);

  if (showConfirm) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'bridge',
          fromSymbol,
          fromAmount: amount,
          toSymbol,
          toAmount: amount, // 1:1 estimate for IBC; real quote for others
          route: getRouteLabel(fromChain, toChain),
        }}
        onConfirm={executeBridge}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bridge</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Transfer tokens across blockchains</Text>

        {/* From Chain */}
        <Text style={s.label}>From</Text>
        <View style={s.chainRow}>
          {BRIDGE_CHAINS.filter((c) => c !== toChain).map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[s.chainChip, fromChain === chain && s.chainChipActive]}
              onPress={() => setFromChain(chain)}
            >
              <Text style={[s.chainText, fromChain === chain && s.chainTextActive]}>
                {CHAIN_LABELS[chain]?.slice(0, 8) ?? chain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={s.amountCard}>
          <Text style={s.amountLabel}>{fromSymbol}</Text>
          <TextInput
            style={s.amountInput}
            placeholder="0.00"
            placeholderTextColor={t.text.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Flip */}
        <TouchableOpacity style={s.flipBtn} onPress={flipChains}>
          <Text style={s.flipIcon}>↕</Text>
        </TouchableOpacity>

        {/* To Chain */}
        <Text style={s.label}>To</Text>
        <View style={s.chainRow}>
          {BRIDGE_CHAINS.filter((c) => c !== fromChain).map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[s.chainChip, toChain === chain && s.chainChipActive]}
              onPress={() => setToChain(chain)}
            >
              <Text style={[s.chainText, toChain === chain && s.chainTextActive]}>
                {CHAIN_LABELS[chain]?.slice(0, 8) ?? chain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Receive estimate */}
        <View style={s.receiveCard}>
          <Text style={s.receiveLabel}>You receive (estimated)</Text>
          <Text style={s.receiveAmount}>
            {amount && parseFloat(amount) > 0 ? `~${amount} ${toSymbol}` : '—'}
          </Text>
          <Text style={s.receiveNote}>
            {isIbcRoute(fromChain, toChain)
              ? 'IBC transfers are near-instant with minimal fees'
              : 'Fees and slippage may apply'}
          </Text>
        </View>

        {/* Route info */}
        <View style={s.routeCard}>
          <Text style={s.routeLabel}>Route</Text>
          <Text style={s.routeValue}>{getRouteLabel(fromChain, toChain)}</Text>
        </View>

        {/* Paper Trade button */}
        <TouchableOpacity
          style={[s.paperBtn, bridging && s.bridgeBtnDisabled]}
          onPress={() => handleBridge(true)}
          disabled={bridging}
        >
          <Text style={s.bridgeBtnText}>Paper Trade (Practice)</Text>
        </TouchableOpacity>

        {/* Real Bridge button */}
        <TouchableOpacity
          style={[s.bridgeBtn, bridging && s.bridgeBtnDisabled]}
          onPress={() => handleBridge(false)}
          disabled={bridging}
        >
          {bridging ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.bridgeBtnText}>
              Bridge {fromSymbol} → {toSymbol} (Real)
            </Text>
          )}
        </TouchableOpacity>

        {paperLight === 'orange' && (
          <Text style={{ color: t.accent.orange, fontSize: fonts.sm, textAlign: 'center', marginTop: 8 }}>
            You have less than 3 paper trades. We recommend more practice before real bridge transactions.
          </Text>
        )}

        <Text style={s.hint}>
          Paper trades simulate real bridge transactions without moving funds.
          Complete at least 1 paper trade per bridge route before real transactions.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
