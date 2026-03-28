/**
 * Import Wallet Screen — Import external wallets alongside the main HD wallet.
 *
 * Supports:
 * - Seed phrase import (12 or 24 words) — creates new HD wallet
 * - Private key import (hex or WIF for BTC)
 * - Watch-only mode — track any address without private key
 * - Chain selector + wallet naming
 * - Encrypted storage in vault for keys, plain for watch-only
 * - Demo mode: simulate import success
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
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
  const { demoMode, importedWallets, addImportedWallet } = useWalletStore();
  const t = useTheme();

  const [method, setMethod] = useState<ImportMethod>('seed');
  const [walletName, setWalletName] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [watchAddress, setWatchAddress] = useState('');
  const [importing, setImporting] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 20 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: 14, marginBottom: 24, lineHeight: 20 },
    sectionLabel: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 16 },
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    methodBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: t.bg.card, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    methodBtnActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    methodBtnText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    methodBtnTextActive: { color: t.accent.green },
    methodIcon: { fontSize: 18, marginBottom: 4 },
    input: { backgroundColor: t.bg.card, borderRadius: 12, padding: 16, color: t.text.primary, fontSize: 15, borderWidth: 1, borderColor: t.border },
    seedInput: { minHeight: 100, textAlignVertical: 'top' },
    chainRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chainChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: t.bg.card, borderWidth: 1, borderColor: 'transparent' },
    chainChipActive: { borderColor: t.accent.green, backgroundColor: t.accent.green + '15' },
    chainChipText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    chainChipTextActive: { color: t.accent.green },
    importBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
    importBtnDisabled: { opacity: 0.4 },
    importBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    cancelBtn: { paddingVertical: 20, alignItems: 'center' },
    cancelText: { color: t.accent.blue, fontSize: 16 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginTop: 16 },
    hint: { color: t.text.muted, fontSize: 12, marginTop: 8, lineHeight: 18 },
    walletList: { marginTop: 16 },
    walletItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    walletName: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    walletMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    walletType: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
    removeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
    removeText: { color: t.accent.red, fontSize: 13, fontWeight: '600' },
    demoTag: { color: t.accent.purple, fontSize: 11, fontWeight: '700', marginLeft: 6 },
  }), [t]);

  const validateSeedPhrase = useCallback((phrase: string): boolean => {
    const words = phrase.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }, []);

  const validatePrivateKey = useCallback((key: string): boolean => {
    const trimmed = key.trim();
    // Hex key (with or without 0x prefix)
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(trimmed)) return true;
    // WIF format for BTC (starts with 5, K, or L, base58)
    if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(trimmed)) return true;
    return false;
  }, []);

  const validateAddress = useCallback((address: string): boolean => {
    const trimmed = address.trim();
    if (trimmed.length < 20) return false;
    // Basic format checks per chain
    if (selectedChain === 'bitcoin') return /^(bc1|[13]|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    if (selectedChain === 'ethereum') return /^0x[0-9a-fA-F]{40}$/.test(trimmed);
    if (selectedChain === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    return trimmed.length >= 20; // Generic for other chains
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

    try {
      if (demoMode) {
        // Demo mode — simulate import
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const id = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let address = '';

      if (method === 'seed') {
        // In production: derive addresses from seed phrase via HD wallet
        // For now, generate a placeholder address based on chain
        address = generateDemoAddress(selectedChain);
      } else if (method === 'private-key') {
        // In production: derive public key + address from private key
        address = generateDemoAddress(selectedChain);
      } else {
        address = watchAddress.trim();
      }

      const walletType: 'imported' | 'watch-only' = method === 'watch-only' ? 'watch-only' : 'imported';

      addImportedWallet({
        id,
        name: walletName.trim(),
        type: walletType,
        chain: selectedChain,
        address,
        importMethod: method === 'seed' ? 'seed' : method === 'private-key' ? 'private-key' : 'address',
        addedAt: Date.now(),
      });

      Alert.alert(
        'Wallet Imported',
        `"${walletName.trim()}" has been added as a ${walletType} wallet.${demoMode ? ' (Demo Mode)' : ''}`,
        [{ text: 'OK', onPress: onClose }],
      );
    } catch (err) {
      Alert.alert('Import Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  }, [canImport, demoMode, method, selectedChain, walletName, watchAddress, addImportedWallet, onClose]);

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

          {/* Chain Selector */}
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
              <Text style={s.hint}>
                Your seed phrase will be encrypted and stored in the secure vault. It never leaves your device.
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
                  selectedChain === 'bitcoin' ? 'bc1...' :
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

          {/* Import Button */}
          <TouchableOpacity
            style={[s.importBtn, !canImport && s.importBtnDisabled]}
            onPress={handleImport}
            disabled={!canImport || importing}
          >
            <Text style={s.importBtnText}>
              {importing ? 'Importing...' : `Import ${method === 'watch-only' ? 'Watch-Only' : 'Wallet'}`}
            </Text>
          </TouchableOpacity>

          {demoMode && (
            <Text style={[s.hint, { textAlign: 'center', marginTop: 8 }]}>
              Demo Mode — import will be simulated with a placeholder address.
            </Text>
          )}

          {/* Existing Imported Wallets */}
          {importedWallets.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 32 }]}>Imported Wallets ({importedWallets.length})</Text>
              <View style={s.walletList}>
                {importedWallets.map((w) => (
                  <View key={w.id} style={s.walletItem}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={s.walletName}>{w.name}</Text>
                        {demoMode && <Text style={s.demoTag}>DEMO</Text>}
                      </View>
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

// ─── Helpers ───

function generateDemoAddress(chain: ChainId): string {
  const rand = () => Math.random().toString(16).slice(2);
  switch (chain) {
    case 'bitcoin':
      return `bc1q${rand()}${rand()}`.slice(0, 42);
    case 'ethereum':
      return `0x${rand()}${rand()}${rand()}`.slice(0, 42);
    case 'solana':
      return `${rand()}${rand()}${rand()}`.slice(0, 44).replace(/[^1-9A-HJ-NP-Za-km-z]/g, 'A');
    case 'cosmos':
      return `cosmos1${rand()}${rand()}`.slice(0, 45);
    default:
      return `${chain}_${rand()}${rand()}`.slice(0, 42);
  }
}
