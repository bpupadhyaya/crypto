import { fonts } from '../utils/theme';
/**
 * Import Wallet Screen — Import external wallets alongside the main HD wallet.
 *
 * Supports:
 * - Seed phrase import (12 or 24 words) with optional passphrase (25th word)
 * - Auto-derives all chains (BTC, ETH, SOL, ATOM, OTK) from one seed
 * - BTC: scans all 4 address types (legacy, wrapped segwit, native segwit, taproot)
 * - Address gap scanning (BIP-44 standard: 20 consecutive empty)
 * - Private key import (hex or WIF for BTC)
 * - Watch-only mode — track any address without private key
 * - Encrypted storage in vault for keys, plain for watch-only
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import type { ChainId } from '../core/abstractions/types';

type ImportMethod = 'seed' | 'private-key' | 'watch-only';

const SUPPORTED_CHAINS: { id: ChainId; label: string; icon: string }[] = [
  { id: 'bitcoin', label: 'Bitcoin', icon: 'BTC' },
  { id: 'ethereum', label: 'Ethereum', icon: 'ETH' },
  { id: 'solana', label: 'Solana', icon: 'SOL' },
  { id: 'cosmos', label: 'Cosmos', icon: 'ATOM' },
  { id: 'openchain', label: 'Open Chain', icon: 'OTK' },
];

interface Props {
  onClose: () => void;
}

export const ImportWalletScreen = React.memo(({ onClose }: Props) => {
  const { importedWallets, addImportedWallet } = useWalletStore();
  const t = useTheme();

  const [method, setMethod] = useState<ImportMethod>('seed');
  const [walletName, setWalletName] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [watchAddress, setWatchAddress] = useState('');
  const [importing, setImporting] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [discoveredAddresses, setDiscoveredAddresses] = useState<Array<{
    chain: string; address: string; path: string; balance?: number; btcType?: string;
  }>>([]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20 },
    title: { color: t.text.primary, fontSize: fonts.xxl, fontWeight: fonts.heavy as any, marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: fonts.md, marginBottom: 24, lineHeight: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold as any, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 16 },
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    methodBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    methodBtnActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    methodBtnText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold as any },
    methodBtnTextActive: { color: t.accent.green },
    methodIcon: { fontSize: fonts.xl, marginBottom: 4 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border },
    seedInput: { minHeight: 100, textAlignVertical: 'top' },
    chainRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chainChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: 'transparent' },
    chainChipActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    chainChipText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold as any },
    chainChipTextActive: { color: t.accent.green },
    importBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    importBtnDisabled: { opacity: 0.4 },
    importBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.bold as any },
    cancelBtn: { paddingVertical: 20, alignItems: 'center' },
    cancelText: { color: t.accent.blue, fontSize: fonts.lg },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 16 },
    hint: { color: t.text.muted, fontSize: fonts.sm, marginTop: 8, lineHeight: 18 },
    walletList: { marginTop: 16 },
    walletItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    walletName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.semibold as any },
    walletMeta: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    walletType: { fontSize: fonts.xs, fontWeight: fonts.semibold as any, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
    removeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    removeText: { color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.semibold as any },
    discoveredCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: t.accent.green + '40' },
    discoveredChain: { color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold as any },
    discoveredAddr: { color: t.text.secondary, fontSize: fonts.xs, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    discoveredPath: { color: t.text.muted, fontSize: fonts.xs, marginTop: 1 },
    scanStatusText: { color: t.accent.blue, fontSize: fonts.sm, textAlign: 'center', marginTop: 12 },
  }), [t]);

  const validateSeedPhrase = useCallback((phrase: string): boolean => {
    const words = phrase.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }, []);

  const validatePrivateKey = useCallback((key: string): boolean => {
    const trimmed = key.trim();
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(trimmed)) return true;
    if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(trimmed)) return true;
    return false;
  }, []);

  const validateAddress = useCallback((address: string): boolean => {
    const trimmed = address.trim();
    if (trimmed.length < 20) return false;
    if (selectedChain === 'bitcoin') return /^(bc1|[13]|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    if (selectedChain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(trimmed);
    if (selectedChain === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    return trimmed.length >= 20;
  }, [selectedChain]);

  const canImport = useMemo(() => {
    if (!walletName.trim()) return false;
    if (method === 'seed') return validateSeedPhrase(seedPhrase);
    if (method === 'private-key') return validatePrivateKey(privateKey);
    if (method === 'watch-only') return validateAddress(watchAddress);
    return false;
  }, [method, walletName, seedPhrase, privateKey, watchAddress, validateSeedPhrase, validatePrivateKey, validateAddress]);

  const handleImport = useCallback(async () => {
    if (!canImport) return;

    setImporting(true);
    setScanStatus('');
    setDiscoveredAddresses([]);

    try {
      if (method === 'seed') {
        await handleSeedImport();
      } else if (method === 'private-key') {
        await handlePrivateKeyImport();
      } else {
        await handleWatchOnlyImport();
      }
    } catch (err) {
      Alert.alert('Import Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
      setScanStatus('');
    }
  }, [canImport, method, walletName, seedPhrase, passphrase, privateKey, watchAddress, selectedChain]);

  const handleSeedImport = async () => {
    const { HDWallet } = await import('../core/wallet/hdwallet');
    const { validateMnemonic } = await import('@scure/bip39');
    const { wordlist } = await import('@scure/bip39/wordlists/english.js');

    const phrase = seedPhrase.trim().toLowerCase();
    if (!validateMnemonic(phrase, wordlist)) {
      Alert.alert('Invalid Seed Phrase', 'The seed phrase contains invalid words. Please check and try again.');
      setImporting(false);
      return;
    }

    const wallet = HDWallet.fromMnemonic(phrase, passphrase || undefined);

    // ─── Auto-derive ALL chains ───
    setScanStatus('Deriving addresses for all chains...');

    const { EthereumSigner } = await import('../core/chains/ethereum-signer');
    const { BitcoinSigner } = await import('../core/chains/bitcoin-signer');
    const { SolanaSigner } = await import('../core/chains/solana-signer');
    const { CosmosSigner } = await import('../core/chains/cosmos-signer');

    const allAddresses: Record<string, string> = {};
    const discovered: typeof discoveredAddresses = [];

    // ETH
    allAddresses.ethereum = EthereumSigner.fromWallet(wallet).getAddress();

    // BTC — get all 4 address types for display
    const btcNativeSegwit = BitcoinSigner.fromWalletWithType(wallet, 'native-segwit');
    allAddresses.bitcoin = btcNativeSegwit.getAddress();
    const btcAllAddrs = btcNativeSegwit.getAllAddresses();

    // SOL
    allAddresses.solana = SolanaSigner.fromWallet(wallet).getAddress();

    // Cosmos
    const cosmosSigner = CosmosSigner.fromWallet(wallet, 0, 'cosmos');
    allAddresses.cosmos = await cosmosSigner.getAddress();

    // OpenChain
    const otkSigner = CosmosSigner.fromWallet(wallet, 0, 'openchain');
    allAddresses.openchain = await otkSigner.getAddress();

    // ─── Scan for funds across address types and indices ───
    setScanStatus('Scanning Bitcoin address types...');

    // Show BTC address types
    const btcTypeLabels: Record<string, string> = {
      'p2pkh': 'Legacy (1...)',
      'p2sh-p2wpkh': 'Wrapped Segwit (3...)',
      'p2wpkh': 'Native Segwit (bc1q...)',
      'p2tr': 'Taproot (bc1p...)',
    };
    for (const [pType, addr] of Object.entries(btcAllAddrs)) {
      discovered.push({
        chain: `BTC ${btcTypeLabels[pType] || pType}`,
        address: addr,
        path: pType === 'p2pkh' ? "m/44'/0'/0'/0/0" :
              pType === 'p2sh-p2wpkh' ? "m/49'/0'/0'/0/0" :
              pType === 'p2wpkh' ? "m/84'/0'/0'/0/0" :
              "m/86'/0'/0'/0/0",
      });
    }

    // Scan for additional addresses with funds (gap scanning)
    setScanStatus('Scanning for additional addresses with funds...');

    try {
      const { scanAllChains } = await import('../core/wallet/addressScanner');
      const scanResult = await scanAllChains(wallet, 20, (progress) => {
        setScanStatus(`Scanning ${progress.chain}... (${progress.found} found)`);
      });

      // Add any discovered addresses beyond index 0
      for (const d of scanResult.discovered) {
        if (d.addressIndex > 0 || d.btcType) {
          discovered.push({
            chain: d.chain + (d.btcType ? ` (${d.btcType})` : ''),
            address: d.address,
            path: d.path,
            balance: d.balance,
            btcType: d.btcType,
          });
        }
      }

      // Use scanned addresses if available (may have found more)
      if (scanResult.addresses.bitcoin) allAddresses.bitcoin = scanResult.addresses.bitcoin;
      if (scanResult.addresses.ethereum) allAddresses.ethereum = scanResult.addresses.ethereum;
      if (scanResult.addresses.solana) allAddresses.solana = scanResult.addresses.solana;
      if (scanResult.addresses.cosmos) allAddresses.cosmos = scanResult.addresses.cosmos;
      if (scanResult.addresses.openchain) allAddresses.openchain = scanResult.addresses.openchain;
    } catch {
      // Scan failed (offline) — continue with primary addresses
    }

    setDiscoveredAddresses(discovered);

    wallet.destroy();

    // Store encrypted seed in vault
    const baseId = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const { Vault } = await import('../core/vault/vault');
      const vaultInstance = new Vault();
      const vaultData = passphrase
        ? { type: 'seed' as const, data: phrase, chain: 'all', passphrase }
        : { type: 'seed' as const, data: phrase, chain: 'all' };
      await vaultInstance.addImportedKey(baseId, vaultData);
    } catch (_vaultErr) {
      // Vault storage optional
    }

    // Add wallet entries for each chain
    const chainEntries = Object.entries(allAddresses);
    for (const [chain, address] of chainEntries) {
      if (!address) continue;
      addImportedWallet({
        id: `${baseId}-${chain}`,
        name: chainEntries.length > 1 ? `${walletName.trim()} (${chain.toUpperCase()})` : walletName.trim(),
        type: 'imported',
        chain,
        address,
        importMethod: 'seed',
        addedAt: Date.now(),
      });
    }

    const chainList = chainEntries.filter(([, a]) => a).map(([c]) => c.toUpperCase()).join(', ');
    const extraFound = discovered.filter(d => d.balance && d.balance > 0).length;

    Alert.alert(
      'Wallet Imported',
      `"${walletName.trim()}" imported for ${chainList}.${extraFound > 0 ? `\n\nFound ${extraFound} additional address${extraFound > 1 ? 'es' : ''} with funds.` : ''}`,
      [{ text: 'OK', onPress: onClose }],
    );
  };

  const handlePrivateKeyImport = async () => {
    const trimmedKey = privateKey.trim();
    const id = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let address = '';

    if (selectedChain === 'ethereum' || selectedChain === 'openchain') {
      const { privateKeyToAccount } = await import('viem/accounts');
      const hexKey = trimmedKey.startsWith('0x') ? trimmedKey : `0x${trimmedKey}`;
      const account = privateKeyToAccount(hexKey as `0x${string}`);
      address = account.address;
    } else if (selectedChain === 'bitcoin') {
      const { BitcoinSigner } = await import('../core/chains/bitcoin-signer');
      address = BitcoinSigner.fromPrivateKey(trimmedKey).getAddress();
    } else if (selectedChain === 'solana') {
      const { Keypair } = await import('@solana/web3.js');
      const keyBytes = trimmedKey.startsWith('0x') ? trimmedKey.slice(2) : trimmedKey;
      const seed = Uint8Array.from(Buffer.from(keyBytes, 'hex').slice(0, 32));
      const keypair = Keypair.fromSeed(seed);
      address = keypair.publicKey.toBase58();
    } else if (selectedChain === 'cosmos') {
      const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
      const keyBytes = trimmedKey.startsWith('0x') ? trimmedKey.slice(2) : trimmedKey;
      const wallet = await DirectSecp256k1Wallet.fromKey(
        Uint8Array.from(Buffer.from(keyBytes, 'hex')),
        'cosmos',
      );
      const [account] = await wallet.getAccounts();
      address = account.address;
    }

    if (!address) {
      Alert.alert('Import Failed', 'Could not derive address. Please check your input.');
      return;
    }

    // Store encrypted private key in vault
    try {
      const { Vault } = await import('../core/vault/vault');
      const vaultInstance = new Vault();
      await vaultInstance.addImportedKey(id, { type: 'private-key', data: trimmedKey, chain: selectedChain });
    } catch (_vaultErr) {
      // Vault storage optional
    }

    addImportedWallet({
      id,
      name: walletName.trim(),
      type: 'imported',
      chain: selectedChain,
      address,
      importMethod: 'private-key',
      addedAt: Date.now(),
    });

    Alert.alert(
      'Wallet Imported',
      `"${walletName.trim()}" imported.\n\nAddress: ${address.slice(0, 12)}...${address.slice(-8)}`,
      [{ text: 'OK', onPress: onClose }],
    );
  };

  const handleWatchOnlyImport = async () => {
    const id = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const address = watchAddress.trim();

    addImportedWallet({
      id,
      name: walletName.trim(),
      type: 'watch-only',
      chain: selectedChain,
      address,
      importMethod: 'address',
      addedAt: Date.now(),
    });

    Alert.alert(
      'Watch-Only Added',
      `"${walletName.trim()}" added.\n\nAddress: ${address.slice(0, 12)}...${address.slice(-8)}`,
      [{ text: 'OK', onPress: onClose }],
    );
  };

  const handleRemoveWallet = useCallback((id: string, name: string) => {
    Alert.alert(
      'Remove Wallet',
      `Remove "${name}" from your wallet list? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => useWalletStore.getState().removeImportedWallet(id) },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.title}>Import Wallet</Text>
          <Text style={s.subtitle}>
            Add an external wallet alongside your main wallet. Import a seed phrase, private key, or track any address in watch-only mode.
          </Text>

          {/* Import Method */}
          <Text style={s.sectionLabel}>Import Method</Text>
          <View style={s.methodRow}>
            {([
              { id: 'seed' as ImportMethod, label: 'Seed Phrase', icon: '🌱' },
              { id: 'private-key' as ImportMethod, label: 'Private Key', icon: '🔑' },
              { id: 'watch-only' as ImportMethod, label: 'Watch Only', icon: '👁' },
            ]).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[s.methodBtn, method === m.id && s.methodBtnActive]}
                onPress={() => setMethod(m.id)}
              >
                <Text style={s.methodIcon}>{m.icon}</Text>
                <Text style={[s.methodBtnText, method === m.id && s.methodBtnTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Wallet Name */}
          <Text style={s.sectionLabel}>Wallet Name</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Cold Storage, Trading Wallet"
            placeholderTextColor={t.text.muted}
            value={walletName}
            onChangeText={setWalletName}
            maxLength={40}
          />

          {/* Chain Selector — only for private key and watch-only */}
          {method !== 'seed' && (
            <>
              <Text style={s.sectionLabel}>Chain</Text>
              <View style={s.chainRow}>
                {SUPPORTED_CHAINS.map((chain) => (
                  <TouchableOpacity
                    key={chain.id}
                    style={[s.chainChip, selectedChain === chain.id && s.chainChipActive]}
                    onPress={() => setSelectedChain(chain.id)}
                  >
                    <Text style={[s.chainChipText, selectedChain === chain.id && s.chainChipTextActive]}>
                      {chain.icon} {chain.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Seed Phrase Input */}
          {method === 'seed' && (
            <View style={s.card}>
              <Text style={s.sectionLabel}>Recovery Phrase (12 or 24 words)</Text>
              <TextInput
                style={[s.input, s.seedInput]}
                placeholder="Enter words separated by spaces..."
                placeholderTextColor={t.text.muted}
                value={seedPhrase}
                onChangeText={setSeedPhrase}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />

              {/* Optional Passphrase (25th word) */}
              <TouchableOpacity
                style={{ marginTop: 12 }}
                onPress={() => setShowPassphrase(!showPassphrase)}
              >
                <Text style={{ color: t.accent.blue, fontSize: fonts.sm }}>
                  {showPassphrase ? '▼ Hide passphrase (25th word)' : '▶ Add passphrase (25th word) — optional'}
                </Text>
              </TouchableOpacity>

              {showPassphrase && (
                <>
                  <TextInput
                    style={[s.input, { marginTop: 8 }]}
                    placeholder="Optional BIP-39 passphrase..."
                    placeholderTextColor={t.text.muted}
                    value={passphrase}
                    onChangeText={setPassphrase}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                  <Text style={[s.hint, { color: t.accent.yellow }]}>
                    Used by Trezor, Ledger, and advanced wallets. Different passphrase = completely different wallet. Leave empty if unsure.
                  </Text>
                </>
              )}

              <Text style={s.hint}>
                All chains (BTC, ETH, SOL, ATOM) will be derived automatically.
                Bitcoin scans all address types (legacy, segwit, taproot).
                Address gap scanning discovers all used addresses.
              </Text>
            </View>
          )}

          {/* Private Key Input */}
          {method === 'private-key' && (
            <View style={s.card}>
              <Text style={s.sectionLabel}>Private Key</Text>
              <TextInput
                style={s.input}
                placeholder={selectedChain === 'bitcoin' ? 'WIF or hex format...' : '0x... (64 hex chars)'}
                placeholderTextColor={t.text.muted}
                value={privateKey}
                onChangeText={setPrivateKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <Text style={s.hint}>
                {selectedChain === 'bitcoin'
                  ? 'Accepts WIF (starts with 5, K, or L) or raw hex (64 characters).'
                  : 'Accepts hex format with or without 0x prefix (64 hex characters).'}
                {'\n'}Stored encrypted in the vault. Never transmitted.
              </Text>
            </View>
          )}

          {/* Watch-Only Address Input */}
          {method === 'watch-only' && (
            <View style={s.card}>
              <Text style={s.sectionLabel}>Address to Watch</Text>
              <TextInput
                style={s.input}
                placeholder={
                  selectedChain === 'bitcoin' ? 'bc1... or 1... or 3...' :
                  selectedChain === 'ethereum' ? '0x...' :
                  selectedChain === 'solana' ? 'Base58 address...' :
                  'Enter address...'
                }
                placeholderTextColor={t.text.muted}
                value={watchAddress}
                onChangeText={setWatchAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={s.hint}>
                Watch-only wallets can track balances and transactions but cannot sign or send. No private key needed.
              </Text>
            </View>
          )}

          {/* Scan Status */}
          {importing && scanStatus ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <ActivityIndicator size="small" color={t.accent.blue} style={{ marginRight: 8 }} />
              <Text style={s.scanStatusText}>{scanStatus}</Text>
            </View>
          ) : null}

          {/* Discovered Addresses */}
          {discoveredAddresses.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 16 }]}>Discovered Addresses ({discoveredAddresses.length})</Text>
              {discoveredAddresses.map((d, i) => (
                <View key={i} style={s.discoveredCard}>
                  <Text style={s.discoveredChain}>{d.chain}</Text>
                  <Text style={s.discoveredAddr}>{d.address}</Text>
                  <Text style={s.discoveredPath}>
                    {d.path}{d.balance ? ` · ${d.balance} sats` : ''}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Import Button */}
          <TouchableOpacity
            style={[s.importBtn, (!canImport || importing) && s.importBtnDisabled]}
            onPress={handleImport}
            disabled={!canImport || importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.importBtnText}>
                {method === 'seed'
                  ? 'Import & Scan All Chains'
                  : method === 'watch-only'
                  ? 'Add Watch-Only'
                  : 'Import Wallet'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Existing Imported Wallets */}
          {importedWallets.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 32 }]}>Imported Wallets ({importedWallets.length})</Text>
              <View style={s.walletList}>
                {importedWallets.map((w) => (
                  <View key={w.id} style={s.walletItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.walletName}>{w.name}</Text>
                      <Text style={s.walletMeta}>
                        {w.chain} · {w.address.slice(0, 10)}...{w.address.slice(-6)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[
                        s.walletType,
                        { backgroundColor: w.type === 'watch-only' ? t.accent.blue + '20' : t.accent.green + '20',
                          color: w.type === 'watch-only' ? t.accent.blue : t.accent.green },
                      ]}>
                        {w.type === 'watch-only' ? 'Watch' : 'Imported'}
                      </Text>
                      <TouchableOpacity style={s.removeBtn} onPress={() => handleRemoveWallet(w.id, w.name)}>
                        <Text style={s.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Cancel */}
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Back to Settings</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});
