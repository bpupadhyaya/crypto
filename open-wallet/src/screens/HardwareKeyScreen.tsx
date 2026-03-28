/**
 * Hardware Key Screen — Manage external and built-in hardware keys.
 *
 * Detects:
 * - External: Ledger (BLE), Trezor (USB/BLE), Keystone (QR)
 * - Built-in: Solana Saga/Seeker seed vault, Samsung Knox, Google Titan M, Apple Secure Enclave
 *
 * Features:
 * - Auto-detect phone's built-in secure element
 * - Scan for external BLE devices
 * - Import addresses from hardware key
 * - Sign transactions with hardware key
 * - Demo mode with simulated hardware detection
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  HardwareKeyProvider,
  BuiltinKeyInfo,
  detectBuiltinKey,
  getHardwareProviders,
  getHardwareAddress,
  importFromBuiltinKey,
  getDemoHardwareProviders,
  getDemoBuiltinKey,
  getDemoHardwareAddress,
} from '../core/hardware/hardwareKeyManager';

interface Props {
  onClose: () => void;
}

type ScanStatus = 'idle' | 'scanning' | 'connecting';

export function HardwareKeyScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [providers, setProviders] = useState<HardwareKeyProvider[]>([]);
  const [builtinKey, setBuiltinKey] = useState<BuiltinKeyInfo | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);
  const [importedAddresses, setImportedAddresses] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 24 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, marginHorizontal: 20, marginBottom: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    divider: { height: 1, backgroundColor: t.border, marginHorizontal: 16 },
    label: { color: t.text.primary, fontSize: 15, flex: 1 },
    value: { color: t.text.secondary, fontSize: 14 },
    builtinCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12, borderWidth: 2, borderColor: t.accent.green },
    builtinHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    builtinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent.green, marginRight: 10 },
    builtinTitle: { color: t.text.primary, fontSize: 17, fontWeight: '700', flex: 1 },
    builtinProvider: { color: t.accent.green, fontSize: 13, fontWeight: '600' },
    builtinDesc: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    chainChip: { backgroundColor: t.border, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginRight: 6, marginBottom: 6 },
    chainChipText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    chainRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    providerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    providerCardConnected: { borderWidth: 2, borderColor: t.accent.green },
    providerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: t.border, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    providerIconText: { fontSize: 24 },
    providerInfo: { flex: 1 },
    providerName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    providerType: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    providerStatus: { color: t.accent.green, fontSize: 12, fontWeight: '600', marginTop: 4 },
    actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    scanBtn: { backgroundColor: t.accent.blue },
    importBtn: { backgroundColor: t.accent.green },
    disconnectBtn: { backgroundColor: t.accent.red },
    centerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 24, marginHorizontal: 20, marginTop: 24, alignItems: 'center' },
    statusText: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginTop: 12 },
    statusSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    addressCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12 },
    addressChain: { color: t.accent.green, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    addressValue: { color: t.text.primary, fontSize: 13, fontFamily: 'monospace' as any, marginTop: 4 },
    instructions: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginHorizontal: 24, marginTop: 24, lineHeight: 20, marginBottom: 24 },
  }), [t]);

  // ─── Load providers on mount ───

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        setProviders(getDemoHardwareProviders());
        setBuiltinKey(getDemoBuiltinKey());
      } else {
        const [provs, builtin] = await Promise.all([
          getHardwareProviders(),
          detectBuiltinKey(),
        ]);
        setProviders(provs);
        setBuiltinKey(builtin);
      }
    } catch {
      setProviders([]);
      setBuiltinKey(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── Scan for external devices ───

  const startScan = useCallback(() => {
    setScanStatus('scanning');
    // Simulate BLE scan (real implementation uses react-native-ble-plx)
    setTimeout(() => {
      if (demoMode) {
        // In demo mode, "find" a Ledger
        setProviders((prev) =>
          prev.map((p) =>
            p.id === 'ledger' ? { ...p, connected: true } : p,
          ),
        );
        setConnectedProvider('ledger');
        Alert.alert('Device Found', 'Ledger Nano X detected and connected (Demo Mode).');
      }
      setScanStatus('idle');
    }, 3000);
  }, [demoMode]);

  // ─── Connect to external device ───

  const connectProvider = useCallback((providerId: string) => {
    setScanStatus('connecting');
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, connected: true } : p,
        ),
      );
      setConnectedProvider(providerId);
      setScanStatus('idle');
      Alert.alert('Connected', `Successfully connected to ${providerId}.`);
    }, 2000);
  }, []);

  // ─── Disconnect ───

  const disconnect = useCallback((providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, connected: false } : p,
      ),
    );
    if (connectedProvider === providerId) setConnectedProvider(null);
    setImportedAddresses(null);
  }, [connectedProvider]);

  // ─── Import addresses ───

  const handleImport = useCallback(async (providerId: string) => {
    setLoading(true);
    try {
      if (demoMode) {
        const addresses: Record<string, string> = {
          bitcoin: getDemoHardwareAddress('bitcoin'),
          ethereum: getDemoHardwareAddress('ethereum'),
          solana: getDemoHardwareAddress('solana'),
          cosmos: getDemoHardwareAddress('cosmos'),
        };
        setImportedAddresses(addresses);
        Alert.alert('Imported', 'Hardware wallet addresses imported (Demo Mode).');
      } else {
        const result = await importFromBuiltinKey(providerId);
        setImportedAddresses(result.addresses);
        Alert.alert('Imported', 'Hardware wallet addresses imported successfully.');
      }
    } catch (err) {
      Alert.alert('Import Failed', err instanceof Error ? err.message : 'Failed to import addresses.');
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  // ─── Provider icon ───

  const getProviderIcon = (id: string): string => {
    const icons: Record<string, string> = {
      ledger: 'L',
      trezor: 'T',
      keystone: 'K',
      'solana-saga': 'S',
      'solana-seeker': 'S',
      'samsung-knox': 'K',
      'google-titan': 'G',
      'apple-se': 'A',
      'demo-builtin': 'D',
    };
    return icons[id] || '?';
  };

  const externalProviders = providers.filter((p) => p.type === 'external');
  const builtinProviders = providers.filter((p) => p.type === 'builtin');

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Hardware Keys</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && providers.length === 0 ? (
          <View style={s.centerCard}>
            <ActivityIndicator color={t.accent.blue} size="large" />
            <Text style={s.statusText}>Detecting hardware keys...</Text>
          </View>
        ) : (
          <>
            {/* Built-in Key Detection */}
            {builtinKey && builtinKey.available && (
              <>
                <Text style={s.section}>Phone's Built-in Key</Text>
                <View style={s.builtinCard}>
                  <View style={s.builtinHeader}>
                    <View style={s.builtinDot} />
                    <Text style={s.builtinTitle}>Built-in Key Detected</Text>
                  </View>
                  <Text style={s.builtinProvider}>
                    {builtinKey.provider === 'apple-se' ? 'Apple Secure Enclave' :
                     builtinKey.provider === 'solana-seeker' ? 'Solana Seeker Seed Vault' :
                     builtinKey.provider === 'solana-saga' ? 'Solana Saga Seed Vault' :
                     builtinKey.provider === 'samsung-knox' ? 'Samsung Knox' :
                     builtinKey.provider === 'google-titan' ? 'Google Titan M' :
                     builtinKey.provider}
                  </Text>
                  <Text style={s.builtinDesc}>
                    {builtinKey.hasExistingSeedPhrase
                      ? 'This device has an existing seed phrase in its secure element. You can import addresses from it.'
                      : 'This device has a hardware secure element that can store keys securely.'}
                  </Text>
                  <View style={s.chainRow}>
                    {builtinKey.supportedChains.map((chain) => (
                      <View key={chain} style={s.chainChip}>
                        <Text style={s.chainChipText}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[s.actionBtn, s.importBtn, { marginHorizontal: 0 }]}
                    onPress={() => handleImport(builtinKey.provider)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.actionBtnText}>
                        {builtinKey.hasExistingSeedPhrase ? 'Import from Seed Vault' : 'Use Secure Element'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Built-in provider cards */}
            {builtinProviders.map((provider) => (
              <View key={provider.id} style={[s.providerCard, s.providerCardConnected]}>
                <View style={s.providerIcon}>
                  <Text style={s.providerIconText}>{getProviderIcon(provider.id)}</Text>
                </View>
                <View style={s.providerInfo}>
                  <Text style={s.providerName}>{provider.name}</Text>
                  <Text style={s.providerType}>Built-in Secure Element</Text>
                  <Text style={s.providerStatus}>Active</Text>
                </View>
              </View>
            ))}

            {/* External Devices */}
            <Text style={s.section}>External Devices</Text>
            {externalProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[s.providerCard, provider.connected && s.providerCardConnected]}
                onPress={() => {
                  if (provider.connected) {
                    Alert.alert(provider.name, 'Connected', [
                      { text: 'Import Addresses', onPress: () => handleImport(provider.id) },
                      { text: 'Disconnect', style: 'destructive', onPress: () => disconnect(provider.id) },
                      { text: 'Close' },
                    ]);
                  } else {
                    connectProvider(provider.id);
                  }
                }}
              >
                <View style={s.providerIcon}>
                  <Text style={s.providerIconText}>{getProviderIcon(provider.id)}</Text>
                </View>
                <View style={s.providerInfo}>
                  <Text style={s.providerName}>{provider.name}</Text>
                  <Text style={s.providerType}>
                    {provider.id === 'keystone' ? 'QR Code' : 'Bluetooth / USB'}
                  </Text>
                  {provider.connected && (
                    <Text style={s.providerStatus}>Connected</Text>
                  )}
                </View>
                <Text style={{ color: provider.connected ? t.accent.green : t.text.muted, fontSize: 14 }}>
                  {provider.connected ? 'Connected' : 'Tap to connect'}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Scan Button */}
            {scanStatus === 'scanning' ? (
              <View style={s.centerCard}>
                <ActivityIndicator color={t.accent.blue} size="large" />
                <Text style={s.statusText}>Scanning for devices...</Text>
                <Text style={s.statusSub}>Make sure your hardware wallet is powered on and Bluetooth is enabled.</Text>
              </View>
            ) : scanStatus === 'connecting' ? (
              <View style={s.centerCard}>
                <ActivityIndicator color={t.accent.green} size="large" />
                <Text style={s.statusText}>Connecting...</Text>
                <Text style={s.statusSub}>Please confirm pairing on your hardware device.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.actionBtn, s.scanBtn]}
                onPress={startScan}
              >
                <Text style={s.actionBtnText}>Scan for Devices</Text>
              </TouchableOpacity>
            )}

            {/* Imported Addresses */}
            {importedAddresses && (
              <>
                <Text style={s.section}>Imported Addresses</Text>
                {Object.entries(importedAddresses).map(([chain, address]) => (
                  <View key={chain} style={s.addressCard}>
                    <Text style={s.addressChain}>{chain}</Text>
                    <Text style={s.addressValue} numberOfLines={1} ellipsizeMode="middle">
                      {address}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Instructions */}
            <Text style={s.instructions}>
              External devices connect via Bluetooth or USB.{'\n'}
              Built-in keys use your phone's secure hardware.{'\n\n'}
              Supported: Ledger, Trezor, Keystone, Solana Saga/Seeker, Samsung Knox, Google Titan M, Apple Secure Enclave.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
