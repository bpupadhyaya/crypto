import { fonts } from '../utils/theme';
/**
 * Send Screen — Send tokens to another address.
 * Wired to real transaction signers (BTC/ETH/SOL).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { ConfirmTransactionScreen } from './ConfirmTransactionScreen';
import { QRScanner } from '../components/QRScanner';
import { registry } from '../core/abstractions/registry';
import { isTestnet } from '../core/network';
import { useTheme } from '../hooks/useTheme';
import { checkRealTransactionAllowed, recordPaperTrade, getSendFlow, getTrafficLightColor, getTrafficLightEmoji, type TrafficLight } from '../core/paperTrading';
import type { ChainId } from '../core/abstractions/types';
import { getChainFeeEstimate, onFeeUpdate, refreshFeesNow } from '../core/gas/feeService';
import { parseFeeAmount, type FeeEstimate } from '../core/gas/estimator';
import { getPrices } from '../core/priceService';
import { resolveName, isNameServiceInput, type ResolvedAddress } from '../core/names/resolver';

// ─── Module-level caches to avoid repeated expensive operations ───
import { prewarmedModules } from '../core/prewarmer';
let cachedVaultContents: { mnemonic: string; password: string } | null = null;

// Uses pre-warmed modules from global prewarmer (started during lock screen)
// Falls back to dynamic import if prewarmer hasn't finished yet

export function SendScreen() {
  const { mode, supportedChains, addresses } = useWalletStore();
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaperMode, setIsPaperMode] = useState(false);
  const [paperLight, setPaperLight] = useState<TrafficLight>('red');
  const [showScanner, setShowScanner] = useState(false);
  const [feeSpeed, setFeeSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [chainFeeEstimate, setChainFeeEstimate] = useState<FeeEstimate | undefined>(undefined);
  const [resolvedAddr, setResolvedAddr] = useState<ResolvedAddress | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const t = useTheme();

  // Subscribe to background fee service updates
  useEffect(() => {
    const update = () => setChainFeeEstimate(getChainFeeEstimate(selectedChain));
    update(); // Read current cached value
    refreshFeesNow(); // Trigger fresh fetch when send screen opens
    const unsub = onFeeUpdate(update);
    return unsub;
  }, [selectedChain]);

  // ─── Name service resolution with 500ms debounce ───
  useEffect(() => {
    if (!isNameServiceInput(recipient)) {
      setResolvedAddr(null);
      setIsResolving(false);
      return;
    }
    setIsResolving(true);
    const timer = setTimeout(async () => {
      try {
        const result = await resolveName(recipient);
        setResolvedAddr(result);
      } catch {
        setResolvedAddr(null);
      } finally {
        setIsResolving(false);
      }
    }, 500);
    return () => { clearTimeout(timer); setIsResolving(false); };
  }, [recipient]);

  // The effective recipient address — use resolved address if available
  const effectiveRecipient = resolvedAddr?.address ?? recipient;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary, paddingHorizontal: 24 },
    chainSelector: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap', marginTop: 8 },
    chainButton: { backgroundColor: t.bg.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
    chainButtonActive: { backgroundColor: t.accent.orange },
    chainButtonText: { color: t.text.secondary, fontSize: 14 },
    chainButtonTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    fromCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 16 },
    fromAddress: { color: t.text.muted, fontSize: 12, fontFamily: 'monospace' },
    fieldLabel: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    inputWrapper: { position: 'relative', marginBottom: 16 },
    input: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, color: t.text.primary, fontSize: 16, borderWidth: 1, borderColor: 'transparent' },
    inputError: { borderColor: t.accent.red + '40' },
    inputValid: { borderColor: t.accent.green + '40' },
    validIcon: { position: 'absolute', right: 16, top: 16, color: t.accent.green, fontSize: 18, fontWeight: fonts.bold },
    invalidIcon: { position: 'absolute', right: 16, top: 16, color: t.accent.red, fontSize: 18, fontWeight: fonts.bold },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    tokenBadge: { backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16 },
    tokenBadgeText: { color: t.text.secondary, fontSize: 14, fontWeight: fonts.bold },
    feeCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginBottom: 16 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    feeLabel: { color: t.text.muted, fontSize: 13 },
    feeValue: { color: t.text.secondary, fontSize: 13 },
    feeValueBold: { color: t.text.primary, fontSize: 13, fontWeight: fonts.bold },
    sendButton: { backgroundColor: t.accent.orange, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
    sendButtonDisabled: { opacity: 0.6 },
    sendButtonText: { color: t.bg.primary, fontSize: 17, fontWeight: fonts.bold },
    hint: { color: t.text.muted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
    feeSpeedRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    feeSpeedBtn: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    feeSpeedBtnActive: { borderColor: t.accent.orange },
    feeSpeedLabel: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, marginBottom: 2 },
    feeSpeedLabelActive: { color: t.accent.orange },
    feeSpeedFee: { color: t.text.muted, fontSize: 10 },
    feeSpeedTime: { color: t.text.muted, fontSize: 10, marginTop: 1 },
    feeUsd: { color: t.text.muted, fontSize: 11, marginTop: 4, textAlign: 'right' },
    nearZeroFee: { color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold, textAlign: 'center', paddingVertical: 8 },
  }), [t]);

  const senderAddress = addresses[selectedChain] ?? '';

  // Testnet sample addresses for easy testing (EIP-55 checksummed)
  const testAddresses: Record<string, string> = {
    ethereum: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    bitcoin: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    solana: 'GKvqsuNcnwWqPzzuhLmGi4rzzh55FhJtGizkhHaEJqiV',
    cosmos: 'cosmos1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh',
    openchain: 'openchain1uex2f65j96r2x0zh52y0npgqc2edc5t068ul88',
  };

  const fillTestAddress = useCallback(() => {
    setRecipient(testAddresses[selectedChain] ?? '');
    setAmount('0.001');
  }, [selectedChain]);

  // Validate address (basic check — no heavy imports)
  // If a name-service name resolved successfully, treat it as valid.
  const isAddressValid = useMemo(() => {
    if (!recipient.trim()) return null;
    // If still resolving a name, don't mark invalid yet
    if (isNameServiceInput(recipient)) {
      if (isResolving) return null;
      return resolvedAddr ? true : false;
    }
    const addr = recipient.trim();
    if (selectedChain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(addr);
    if (selectedChain === 'bitcoin') return /^(bc1|tb1|[13mn2])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
    if (selectedChain === 'solana') return addr.length >= 32 && addr.length <= 44;
    if (selectedChain === 'openchain') return /^openchain[a-z0-9]{39}$/.test(addr);
    if (selectedChain === 'cosmos') return /^cosmos[a-z0-9]{39}$/.test(addr);
    return addr.length > 10;
  }, [recipient, selectedChain, resolvedAddr, isResolving]);

  const chainSymbol = useMemo(() => {
    const symbols: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cosmos: 'ATOM', openchain: 'OTK' };
    return symbols[selectedChain] ?? selectedChain.toUpperCase();
  }, [selectedChain]);

  // Estimate fee when amount and recipient are set
  const estimateFee = useCallback(async () => {
    if (!effectiveRecipient.trim() || !amount.trim() || parseFloat(amount) <= 0 || isAddressValid !== true) return;
    try {
      const provider = registry.getChainProvider(selectedChain);
      const decimals = selectedChain === 'bitcoin' ? 8 : selectedChain === 'ethereum' ? 18 : 9;
      const rawAmount = BigInt(Math.round(parseFloat(amount) * 10 ** decimals));
      const fee = await provider.estimateFee(senderAddress, effectiveRecipient.trim(), rawAmount);
      const feeHuman = Number(fee) / 10 ** decimals;
      setEstimatedFee(feeHuman < 0.000001 ? '<0.000001' : feeHuman.toFixed(6));
    } catch {
      setEstimatedFee(null);
    }
  }, [recipient, amount, selectedChain, senderAddress, isAddressValid]);

  // Trigger fee estimation when inputs change
  React.useEffect(() => {
    const timer = setTimeout(estimateFee, 500);
    return () => clearTimeout(timer);
  }, [estimateFee]);

  const handleSend = async () => {
    if (!recipient.trim()) {
      Alert.alert('Missing Address', 'Please enter a recipient address.');
      return;
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (isAddressValid === false) {
      Alert.alert('Invalid Address', `This is not a valid ${selectedChain} address.`);
      return;
    }
    if (effectiveRecipient.trim().toLowerCase() === senderAddress.toLowerCase()) {
      Alert.alert('Same Address', 'You cannot send to your own address.');
      return;
    }

    // Check balance before proceeding
    const demoMode = useWalletStore.getState().demoMode;
    try {
      const decimals = selectedChain === 'bitcoin' ? 8 : selectedChain === 'ethereum' ? 18 : selectedChain === 'openchain' ? 6 : selectedChain === 'cosmos' ? 6 : 9;
      let humanBalance = 0;
      if (demoMode) {
        // Use demo balances — no RPC call
        const demoAmounts: Record<string, number> = { bitcoin: 0.5, ethereum: 5, solana: 1000, cosmos: 100, openchain: 10000 };
        humanBalance = demoAmounts[selectedChain] ?? 0;
      } else if (senderAddress) {
        const provider = registry.getChainProvider(selectedChain);
        const balance = await provider.getBalance(senderAddress);
        humanBalance = Number(balance.amount) / 10 ** decimals;
      }
      if (humanBalance < parseFloat(amount)) {
        Alert.alert(
          'Insufficient Balance',
          `You have ${humanBalance.toFixed(6)} ${chainSymbol} but are trying to send ${amount} ${chainSymbol}.${isTestnet() ? '\n\nGet free testnet tokens from a faucet.' : ''}`
        );
        return;
      }
    } catch {
      // Network error — let user proceed, will fail at broadcast
    }

    // Check paper trading status (unless already in paper mode)
    if (!isPaperMode && !isTestnet()) {
      const flow = getSendFlow(selectedChain);
      const check = await checkRealTransactionAllowed(flow);

      if (!check.allowed) {
        Alert.alert(
          `${getTrafficLightEmoji(check.light)} Paper Trade Required`,
          check.message,
          [
            { text: 'Do Paper Trade', onPress: () => setIsPaperMode(true) },
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
  };

  const executeSend = async (vaultPassword?: string) => {
    try {
      setSending(true);

      // Paper trade mode — simulate without real transaction
      if (isPaperMode) {
        await new Promise((r) => setTimeout(r, 1500));
        const flow = getSendFlow(selectedChain);
        const status = await recordPaperTrade(flow);
        Alert.alert(
          `${getTrafficLightEmoji(status.light)} Paper Trade Complete`,
          `${amount} ${chainSymbol} sent (simulated).\n\nPaper trades completed: ${status.count}/3 recommended.\n\n${status.light === 'green' ? 'You are now cleared for real transactions on this flow!' : status.light === 'orange' ? 'You can now use real funds, but we recommend more practice.' : 'Complete at least 1 more paper trade to unlock real transactions.'}`,
        );
        setAmount('');
        setRecipient('');
        setShowConfirm(false);
        setIsPaperMode(false);
        return;
      }

      // Demo mode — simulate success without touching the chain
      if (useWalletStore.getState().demoMode) {
        await new Promise((r) => setTimeout(r, 1500));
        Alert.alert(
          'Demo Send Complete',
          `${amount} ${chainSymbol} sent (simulated).\n\nThis is a demo transaction — no real funds were moved.`,
        );
        setAmount('');
        setRecipient('');
        setShowConfirm(false);
        return;
      }

      // Use password passed from auth flow, fall back to store
      const store = useWalletStore.getState();
      const password = vaultPassword ?? store.tempVaultPassword;
      if (!password) throw new Error('Wallet not unlocked. Please sign in again.');

      // 1. Unlock vault → get mnemonic (cached after first unlock)
      let mnemonic: string;
      if (cachedVaultContents && cachedVaultContents.password === password) {
        mnemonic = cachedVaultContents.mnemonic;
      } else {
        const VaultClass = prewarmedModules.Vault ?? (await import('../core/vault/vault')).Vault;
        const vault = new VaultClass();
        const contents = await vault.unlock(password);
        mnemonic = contents.mnemonic;
        cachedVaultContents = { mnemonic, password };
      }

      // 2. Restore HD wallet
      const HDWalletClass = prewarmedModules.HDWallet ?? (await import('../core/wallet/hdwallet')).HDWallet;
      const wallet = HDWalletClass.fromMnemonic(mnemonic);

      let txHash: string;

      // 3. Sign & broadcast based on chain
      if (selectedChain === 'ethereum') {
        const EthSigner = prewarmedModules.EthereumSigner ?? (await import('../core/chains/ethereum-signer')).EthereumSigner;
        const signer = EthSigner.fromWallet(wallet, store.activeAccountIndex);
        txHash = await signer.sendTransaction(effectiveRecipient.trim(), amount.trim());
      } else if (selectedChain === 'solana') {
        const SolSigner = prewarmedModules.SolanaSigner ?? (await import('../core/chains/solana-signer')).SolanaSigner;
        const signer = SolSigner.fromWallet(wallet, store.activeAccountIndex);
        txHash = await signer.sendSOL(effectiveRecipient.trim(), parseFloat(amount));
      } else if (selectedChain === 'bitcoin') {
        const BtcSigner = prewarmedModules.BitcoinSigner ?? (await import('../core/chains/bitcoin-signer')).BitcoinSigner;
        const signer = BtcSigner.fromWallet(wallet, store.activeAccountIndex);
        const decimals = 8;
        const amountSats = BigInt(Math.round(parseFloat(amount) * 10 ** decimals));
        // Use medium fee rate (10 sat/vbyte for testnet, real estimate for mainnet)
        const feeRate = isTestnet() ? 10 : 20;
        const rawTx = await signer.createTransaction(effectiveRecipient.trim(), amountSats, feeRate);
        // Broadcast via provider
        const provider = registry.getChainProvider('bitcoin');
        txHash = await provider.broadcastTransaction({
          chainId: 'bitcoin',
          rawTransaction: rawTx,
          hash: '',
        });
      } else if (selectedChain === 'openchain' || selectedChain === 'cosmos') {
        // Cosmos SDK chains (Open Chain, Cosmos Hub) — use @cosmjs/stargate
        const { CosmosSigner } = await import('../core/chains/cosmos-signer');
        const signer = CosmosSigner.fromWallet(wallet, store.activeAccountIndex, selectedChain as 'openchain' | 'cosmos');
        txHash = await signer.sendTokens(effectiveRecipient.trim(), amount.trim());
      } else {
        throw new Error(`Unsupported chain: ${selectedChain}`);
      }

      // 4. Clean up private key material
      wallet.destroy();

      // 5. Show success
      Alert.alert(
        'Transaction Sent',
        `${amount} ${chainSymbol} sent successfully!\n\nTx: ${txHash.slice(0, 16)}...${txHash.slice(-8)}`,
        [{ text: 'OK' }]
      );
      setAmount('');
      setRecipient('');
      setShowConfirm(false);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Transaction failed';
      // Make common errors more user-friendly
      if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
        msg = `Not enough ${chainSymbol} to cover this transaction and gas fees.${isTestnet() ? ' Get free testnet tokens from a faucet.' : ''}`;
      } else if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('too long')) {
        msg = 'Network request timed out. Please check your connection and try again.';
      } else if (msg.includes('nonce') || msg.includes('replacement')) {
        msg = 'Transaction conflict. Please wait a moment and try again.';
      }
      Alert.alert('Send Failed', msg);
      throw err; // Re-throw so ConfirmTransactionScreen resets to review
    } finally {
      setSending(false);
    }
  };

  if (showScanner) {
    return (
      <QRScanner
        onScan={(data) => { setRecipient(data); setShowScanner(false); }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  if (showConfirm) {
    return (
      <ConfirmTransactionScreen
        tx={{
          type: 'send',
          fromSymbol: chainSymbol,
          fromAmount: amount,
          recipient: effectiveRecipient,
          fee: chainFeeEstimate
            ? parseFeeAmount(chainFeeEstimate[feeSpeed].fee).toFixed(6)
            : estimatedFee ?? undefined,
        }}
        onConfirm={executeSend}
        onCancel={() => setShowConfirm(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Chain selector */}
        <View style={styles.chainSelector}>
          {supportedChains.map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[styles.chainButton, selectedChain === chain && styles.chainButtonActive]}
              onPress={() => { setSelectedChain(chain); setRecipient(''); }}
            >
              <Text style={[styles.chainButtonText, selectedChain === chain && styles.chainButtonTextActive]}>
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* From (your address) */}
        {mode === 'pro' && senderAddress && (
          <View style={styles.fromCard}>
            <Text style={styles.fieldLabel}>From</Text>
            <Text style={styles.fromAddress} numberOfLines={1} ellipsizeMode="middle">
              {senderAddress}
            </Text>
          </View>
        )}

        {/* Recipient */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.fieldLabel}>To</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {isTestnet() && (
              <TouchableOpacity onPress={fillTestAddress}>
                <Text style={{ color: t.accent.yellow, fontSize: 13, fontWeight: fonts.semibold }}>Test Address</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowScanner(true)}>
              <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              isAddressValid === false && styles.inputError,
              isAddressValid === true && styles.inputValid,
            ]}
            placeholder={`${chainSymbol} address or name (.eth, .sol, .crypto)`}
            placeholderTextColor={t.text.muted}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isAddressValid === true && <Text style={styles.validIcon}>✓</Text>}
          {isAddressValid === false && <Text style={styles.invalidIcon}>✗</Text>}
        </View>
        {/* Name resolution indicator */}
        {isResolving && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
            <ActivityIndicator size="small" color={t.text.muted} />
            <Text style={{ color: t.text.muted, fontSize: 12 }}>Resolving name...</Text>
          </View>
        )}
        {resolvedAddr && !isResolving && (
          <View style={{ backgroundColor: t.bg.card, borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <Text style={{ color: t.accent.green, fontSize: 12, fontWeight: fonts.semibold, marginBottom: 2 }}>
              Resolved via {resolvedAddr.nameService}
            </Text>
            <Text style={{ color: t.text.secondary, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1} ellipsizeMode="middle">
              {resolvedAddr.address}
            </Text>
          </View>
        )}
        {isNameServiceInput(recipient) && !isResolving && !resolvedAddr && recipient.trim().length > 0 && (
          <Text style={{ color: t.accent.red, fontSize: 12, marginBottom: 8 }}>
            Could not resolve this name. Check spelling and try again.
          </Text>
        )}

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="0.00"
            placeholderTextColor={t.text.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenBadgeText}>{chainSymbol}</Text>
          </View>
        </View>

        {/* Fee speed selector */}
        {chainFeeEstimate && (selectedChain === 'cosmos' || selectedChain === 'openchain') ? (
          <View style={styles.feeCard}>
            <Text style={styles.nearZeroFee}>Near-zero fee ({chainFeeEstimate.medium.fee})</Text>
          </View>
        ) : chainFeeEstimate ? (
          <View style={styles.feeCard}>
            <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Fee Speed</Text>
            <View style={styles.feeSpeedRow}>
              {(['slow', 'medium', 'fast'] as const).map((speed) => {
                const level = chainFeeEstimate[speed];
                const active = feeSpeed === speed;
                return (
                  <TouchableOpacity
                    key={speed}
                    style={[styles.feeSpeedBtn, active && styles.feeSpeedBtnActive]}
                    onPress={() => setFeeSpeed(speed)}
                  >
                    <Text style={[styles.feeSpeedLabel, active && styles.feeSpeedLabelActive]}>
                      {speed === 'slow' ? 'Slow' : speed === 'medium' ? 'Medium' : 'Fast'}
                    </Text>
                    <Text style={styles.feeSpeedFee}>{level.fee}</Text>
                    <Text style={styles.feeSpeedTime}>{level.timeEstimate}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {chainFeeEstimate.baseFeeUsd > 0 && (
              <Text style={styles.feeUsd}>
                ~${chainFeeEstimate.baseFeeUsd.toFixed(2)} USD (medium)
              </Text>
            )}
            {mode === 'pro' && amount && (
              <View style={[styles.feeRow, { marginTop: 8 }]}>
                <Text style={styles.feeLabel}>Total</Text>
                <Text style={styles.feeValueBold}>
                  {(parseFloat(amount || '0') + parseFeeAmount(chainFeeEstimate[feeSpeed].fee)).toFixed(6)} {chainSymbol}
                </Text>
              </View>
            )}
          </View>
        ) : estimatedFee ? (
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Network fee</Text>
              <Text style={styles.feeValue}>{estimatedFee} {chainSymbol}</Text>
            </View>
            {mode === 'pro' && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Total</Text>
                <Text style={styles.feeValueBold}>
                  {(parseFloat(amount || '0') + parseFloat(estimatedFee)).toFixed(6)} {chainSymbol}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Paper Trade button */}
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: t.accent.purple, marginBottom: 10 }]}
          onPress={() => { setIsPaperMode(true); handleSend(); }}
        >
          <Text style={styles.sendButtonText}>📝 Paper Trade (Practice)</Text>
        </TouchableOpacity>

        {/* Real Send button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={() => { setIsPaperMode(false); handleSend(); }}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={t.bg.primary} />
          ) : (
            <Text style={styles.sendButtonText}>Send {chainSymbol} (Real)</Text>
          )}
        </TouchableOpacity>

        {paperLight === 'orange' && (
          <Text style={{ color: t.accent.orange, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            🟡 You have less than 3 paper trades. We recommend more practice before real transactions.
          </Text>
        )}

        <Text style={styles.hint}>
          Paper trades simulate real transactions without moving real funds. Complete at least 1 paper trade per flow before real money transactions.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
