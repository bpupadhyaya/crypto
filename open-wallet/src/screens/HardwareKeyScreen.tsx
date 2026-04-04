import { fonts } from '../utils/theme';
/**
 * Hardware Key Screen — Manage hardware wallet connections.
 *
 * Three sections matching the device categories:
 *
 * 1. PHONE COLD STORAGE (Solana Saga/Seeker)
 *    - Green card when detected: "Phone Seed Vault Detected"
 *    - Import keys from seed vault (seed never leaves hardware)
 *
 * 2. EXTERNAL HARDWARE WALLETS (Ledger, Trezor, Keystone)
 *    - Ledger: Connect via Bluetooth with scan button
 *    - Trezor: Connect via USB
 *    - Keystone: Scan QR Code with camera button
 *
 * 3. PHONE SECURITY ENHANCEMENT (Knox, Secure Enclave, Titan M)
 *    - Toggle/info for hardware-backed key protection
 *    - These protect app keys, not a replacement for seed phrase
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import {
  type HardwareProviderInfo,
  type BuiltinKeyInfo,
  detectBuiltinKey,
  getHardwareProviders,
  detectSecurityEnhancements,
  importFromSeedVault,
  getDemoHardwareProviders,
  getDemoBuiltinKey,
  getDemoHardwareAddress,
  getDemoSeedVaultAddresses,
  getProvider,
} from '../core/hardware/hardwareKeyManager';

interface Props {
  onClose: () => void;
}

type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected';

export function HardwareKeyScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [providers, setProviders] = useState<HardwareProviderInfo[]>([]);
  const [builtinKey, setBuiltinKey] = useState<BuiltinKeyInfo | null>(null);
  const [securityEnhancements, setSecurityEnhancements] = useState<HardwareProviderInfo[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [importedAddresses, setImportedAddresses] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [knoxEnabled, setKnoxEnabled] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    title: { color: t.text.primary, fontSize: 20, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: 16 },

    sectionHeader: {
      color: t.text.secondary, fontSize: 12, fontWeight: fonts.bold, textTransform: 'uppercase',
      letterSpacing: 1.5, marginLeft: 24, marginBottom: 12, marginTop: 28,
    },

    // ─── Section 1: Cold Storage ───
    coldStorageCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginHorizontal: 20,
      marginBottom: 12, borderWidth: 2, borderColor: t.accent.green,
    },
    coldStorageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    coldStorageDot: {
      width: 12, height: 12, borderRadius: 6, backgroundColor: t.accent.green, marginRight: 10,
    },
    coldStorageTitle: { color: t.text.primary, fontSize: 18, fontWeight: fonts.heavy, flex: 1 },
    coldStorageProvider: {
      color: t.accent.green, fontSize: 14, fontWeight: fonts.semibold, marginBottom: 8,
    },
    coldStorageDesc: { color: t.text.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 },

    // ─── Section 2: External Devices ───
    externalCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20,
      marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    },
    externalCardConnected: { borderWidth: 2, borderColor: t.accent.green },
    providerIcon: {
      width: 48, height: 48, borderRadius: 12, backgroundColor: t.border,
      justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    providerIconText: { fontSize: 20, fontWeight: fonts.bold, color: t.text.primary },
    providerInfo: { flex: 1 },
    providerName: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold },
    providerMethod: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    providerStatusText: { fontSize: 12, fontWeight: fonts.semibold, marginTop: 4 },

    // ─── Section 3: Security Enhancement ───
    securityCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20,
      marginBottom: 12,
    },
    securityRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    securityLabel: { color: t.text.primary, fontSize: 15, fontWeight: fonts.semibold, flex: 1 },
    securitySub: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    securityInfo: {
      color: t.text.muted, fontSize: 13, lineHeight: 20, marginHorizontal: 24,
      marginTop: 8, marginBottom: 12,
    },

    // ─── Shared ───
    actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    actionBtnFull: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: fonts.bold },
    greenBtn: { backgroundColor: t.accent.green },
    blueBtn: { backgroundColor: t.accent.blue },

    chainRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    chainChip: {
      backgroundColor: t.border, borderRadius: 8, paddingVertical: 4,
      paddingHorizontal: 10, marginRight: 6, marginBottom: 6,
    },
    chainChipText: { color: t.text.secondary, fontSize: 12, fontWeight: fonts.semibold },

    addressCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginHorizontal: 20,
      marginBottom: 12,
    },
    addressChain: {
      color: t.accent.green, fontSize: 12, fontWeight: fonts.bold,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    addressValue: {
      color: t.text.primary, fontSize: 13, fontFamily: 'monospace' as any, marginTop: 4,
    },

    centerCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 24, marginHorizontal: 20,
      marginTop: 24, alignItems: 'center',
    },
    statusText: { color: t.text.primary, fontSize: 16, fontWeight: fonts.bold, marginTop: 12 },
    statusSub: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    bottomPadding: { height: 40 },
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
        setSecurityEnhancements(
          getDemoHardwareProviders().filter((p) => p.type === 'phone-security'),
        );
      } else {
        const [provs, builtin, secEnhancements] = await Promise.all([
          getHardwareProviders(),
          detectBuiltinKey(),
          detectSecurityEnhancements(),
        ]);
        setProviders(provs);
        setBuiltinKey(builtin);
        setSecurityEnhancements(secEnhancements);
      }
    } catch {
      setProviders([]);
      setBuiltinKey(null);
      setSecurityEnhancements([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Connection helpers ───

  const getStatus = (id: string): ConnectionStatus =>
    connectionStatuses[id] || 'disconnected';

  const setStatus = (id: string, status: ConnectionStatus) =>
    setConnectionStatuses((prev) => ({ ...prev, [id]: status }));

  // ─── Scan for BLE devices (Ledger) ───

  const handleLedgerScan = useCallback(() => {
    setStatus('ledger', 'scanning');
    if (demoMode) {
      setTimeout(() => {
        setStatus('ledger', 'connected');
        Alert.alert('Device Found', 'Ledger Nano X detected and connected (Demo Mode).');
      }, 3000);
    } else {
      const provider = getProvider('ledger');
      if (!provider) {
        Alert.alert('Not Available', 'Ledger BLE library not installed.');
        setStatus('ledger', 'disconnected');
        return;
      }
      provider.connect()
        .then(() => setStatus('ledger', 'connected'))
        .catch((err) => {
          setStatus('ledger', 'disconnected');
          Alert.alert('Connection Failed', err instanceof Error ? err.message : 'Failed to connect.');
        });
    }
  }, [demoMode]);

  // ─── Connect Trezor via USB ───

  const handleTrezorConnect = useCallback(() => {
    setStatus('trezor', 'connecting');
    if (demoMode) {
      setTimeout(() => {
        setStatus('trezor', 'connected');
        Alert.alert('Connected', 'Trezor connected via USB (Demo Mode).');
      }, 2000);
    } else {
      const provider = getProvider('trezor');
      if (!provider) {
        Alert.alert('Not Available', 'Trezor library not installed.');
        setStatus('trezor', 'disconnected');
        return;
      }
      provider.connect()
        .then(() => setStatus('trezor', 'connected'))
        .catch((err) => {
          setStatus('trezor', 'disconnected');
          Alert.alert('Connection Failed', err instanceof Error ? err.message : 'Failed to connect.');
        });
    }
  }, [demoMode]);

  // ─── Keystone QR scan ───

  const handleKeystoneScan = useCallback(() => {
    setStatus('keystone', 'scanning');
    if (demoMode) {
      setTimeout(() => {
        setStatus('keystone', 'connected');
        Alert.alert('QR Synced', 'Keystone 3 Pro synced via QR code (Demo Mode).');
      }, 2500);
    } else {
      const provider = getProvider('keystone');
      if (!provider) {
        Alert.alert('Not Available', 'Keystone SDK not installed.');
        setStatus('keystone', 'disconnected');
        return;
      }
      // In real implementation, this would open camera for QR scanning
      provider.connect()
        .then(() => setStatus('keystone', 'connected'))
        .catch((err) => {
          setStatus('keystone', 'disconnected');
          Alert.alert('Scan Failed', err instanceof Error ? err.message : 'Failed to scan QR.');
        });
    }
  }, [demoMode]);

  // ─── Disconnect ───

  const handleDisconnect = useCallback((providerId: string) => {
    if (!demoMode) {
      const provider = getProvider(providerId);
      if (provider) provider.disconnect().catch(() => {});
    }
    setStatus(providerId, 'disconnected');
    if (importedAddresses) setImportedAddresses(null);
  }, [demoMode, importedAddresses]);

  // ─── Import from Seed Vault (cold storage) ───

  const handleSeedVaultImport = useCallback(async () => {
    if (!builtinKey) return;
    setLoading(true);
    try {
      if (demoMode) {
        const addresses = getDemoSeedVaultAddresses();
        setImportedAddresses(addresses);
        Alert.alert('Imported', 'Seed vault addresses imported (Demo Mode).');
      } else {
        const result = await importFromSeedVault(builtinKey.provider);
        setImportedAddresses(result.addresses);
        Alert.alert('Imported', 'Addresses imported from hardware seed vault.');
      }
    } catch (err) {
      Alert.alert('Import Failed', err instanceof Error ? err.message : 'Failed to import.');
    } finally {
      setLoading(false);
    }
  }, [builtinKey, demoMode]);

  // ─── Import from external device ───

  const handleExternalImport = useCallback(async (providerId: string) => {
    setLoading(true);
    try {
      if (demoMode) {
        const addresses: Record<string, string> = {
          bitcoin: getDemoHardwareAddress('bitcoin'),
          ethereum: getDemoHardwareAddress('ethereum'),
          solana: getDemoHardwareAddress('solana'),
        };
        setImportedAddresses(addresses);
        Alert.alert('Imported', 'Hardware wallet addresses imported (Demo Mode).');
      } else {
        const provider = getProvider(providerId);
        if (!provider) throw new Error('Provider not found');
        const addresses: Record<string, string> = {};
        for (const chain of provider.supportedChains) {
          try {
            addresses[chain] = await provider.getAddress(chain, 0);
          } catch { /* chain not supported */ }
        }
        setImportedAddresses(addresses);
        Alert.alert('Imported', 'Hardware wallet addresses imported.');
      }
    } catch (err) {
      Alert.alert('Import Failed', err instanceof Error ? err.message : 'Failed to import.');
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  // ─── Status display helpers ───

  const statusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return t.accent.green;
      case 'scanning': case 'connecting': return t.accent.yellow;
      default: return t.text.muted;
    }
  };

  const statusLabel = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'scanning': return 'Scanning...';
      case 'connecting': return 'Connecting...';
      default: return 'Not connected';
    }
  };

  // ─── Filter providers by type ───

  const externalProviders = providers.filter(
    (p) => p.type === 'external-ble' || p.type === 'external-usb' || p.type === 'external-qr',
  );
  const coldStorageProviders = providers.filter((p) => p.type === 'phone-cold-storage');
  const hasColdStorage = builtinKey?.isColdStorage === true || coldStorageProviders.length > 0;

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
            <Text style={s.statusText}>Detecting hardware...</Text>
          </View>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════
                SECTION 1: Phone Cold Storage (Solana Saga/Seeker)
                ═══════════════════════════════════════════════ */}
            {hasColdStorage && (
              <>
                <Text style={s.sectionHeader}>Phone Cold Storage</Text>
                <View style={s.coldStorageCard}>
                  <View style={s.coldStorageHeader}>
                    <View style={s.coldStorageDot} />
                    <Text style={s.coldStorageTitle}>Phone Seed Vault Detected</Text>
                  </View>
                  {builtinKey && (
                    <Text style={s.coldStorageProvider}>
                      {builtinKey.provider === 'solana-saga' ? 'Solana Saga Seed Vault' :
                       builtinKey.provider === 'solana-seeker' ? 'Solana Seeker Seed Vault' :
                       'Phone Seed Vault'}
                    </Text>
                  )}
                  <Text style={s.coldStorageDesc}>
                    Your phone has a hardware security module that generates and stores your seed
                    phrase. The seed never leaves the hardware — even Open Wallet cannot see it.
                  </Text>
                  {builtinKey && (
                    <View style={s.chainRow}>
                      {builtinKey.supportedChains.map((chain) => (
                        <View key={chain} style={s.chainChip}>
                          <Text style={s.chainChipText}>
                            {chain.charAt(0).toUpperCase() + chain.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.actionBtn, s.greenBtn]}
                    onPress={handleSeedVaultImport}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.actionBtnText}>Use Phone's Built-in Key</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ═══════════════════════════════════════════════
                SECTION 2: External Hardware Wallets
                ═══════════════════════════════════════════════ */}
            <Text style={s.sectionHeader}>External Hardware Wallets</Text>

            {/* Ledger — BLE */}
            {externalProviders.filter((p) => p.id === 'ledger').map((p) => {
              const status = getStatus(p.id);
              return (
                <View key={p.id} style={[s.externalCard, status === 'connected' && s.externalCardConnected]}>
                  <View style={s.providerIcon}>
                    <Text style={s.providerIconText}>{p.icon}</Text>
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>{p.name}</Text>
                    <Text style={s.providerMethod}>Connect via Bluetooth</Text>
                    <Text style={[s.providerStatusText, { color: statusColor(status) }]}>
                      {statusLabel(status)}
                    </Text>
                  </View>
                  {status === 'connected' ? (
                    <View>
                      <TouchableOpacity
                        onPress={() => handleExternalImport(p.id)}
                        style={{ marginBottom: 8 }}
                      >
                        <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold }}>Import</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDisconnect(p.id)}>
                        <Text style={{ color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold }}>Disconnect</Text>
                      </TouchableOpacity>
                    </View>
                  ) : status === 'scanning' ? (
                    <ActivityIndicator color={t.accent.blue} size="small" />
                  ) : (
                    <TouchableOpacity onPress={handleLedgerScan}>
                      <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>Scan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* Trezor — USB */}
            {externalProviders.filter((p) => p.id === 'trezor').map((p) => {
              const status = getStatus(p.id);
              return (
                <View key={p.id} style={[s.externalCard, status === 'connected' && s.externalCardConnected]}>
                  <View style={s.providerIcon}>
                    <Text style={s.providerIconText}>{p.icon}</Text>
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>{p.name}</Text>
                    <Text style={s.providerMethod}>Connect via USB</Text>
                    <Text style={[s.providerStatusText, { color: statusColor(status) }]}>
                      {statusLabel(status)}
                    </Text>
                  </View>
                  {status === 'connected' ? (
                    <View>
                      <TouchableOpacity
                        onPress={() => handleExternalImport(p.id)}
                        style={{ marginBottom: 8 }}
                      >
                        <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold }}>Import</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDisconnect(p.id)}>
                        <Text style={{ color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold }}>Disconnect</Text>
                      </TouchableOpacity>
                    </View>
                  ) : status === 'connecting' ? (
                    <ActivityIndicator color={t.accent.blue} size="small" />
                  ) : (
                    <TouchableOpacity onPress={handleTrezorConnect}>
                      <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* Keystone — QR */}
            {externalProviders.filter((p) => p.id === 'keystone').map((p) => {
              const status = getStatus(p.id);
              return (
                <View key={p.id} style={[s.externalCard, status === 'connected' && s.externalCardConnected]}>
                  <View style={s.providerIcon}>
                    <Text style={s.providerIconText}>{p.icon}</Text>
                  </View>
                  <View style={s.providerInfo}>
                    <Text style={s.providerName}>{p.name}</Text>
                    <Text style={s.providerMethod}>Scan QR Code</Text>
                    <Text style={[s.providerStatusText, { color: statusColor(status) }]}>
                      {statusLabel(status)}
                    </Text>
                  </View>
                  {status === 'connected' ? (
                    <View>
                      <TouchableOpacity
                        onPress={() => handleExternalImport(p.id)}
                        style={{ marginBottom: 8 }}
                      >
                        <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold }}>Import</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDisconnect(p.id)}>
                        <Text style={{ color: t.accent.red, fontSize: 13, fontWeight: fonts.semibold }}>Disconnect</Text>
                      </TouchableOpacity>
                    </View>
                  ) : status === 'scanning' ? (
                    <ActivityIndicator color={t.accent.blue} size="small" />
                  ) : (
                    <TouchableOpacity onPress={handleKeystoneScan}>
                      <Text style={{ color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold }}>Scan QR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* ═══════════════════════════════════════════════
                SECTION 3: Phone Security Enhancement
                ═══════════════════════════════════════════════ */}
            <Text style={s.sectionHeader}>Phone Security</Text>

            {/* Samsung Knox */}
            {(securityEnhancements.some((e) => e.id === 'samsung-knox') ||
              demoMode) && (
              <View style={s.securityCard}>
                <View style={s.securityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.securityLabel}>Samsung Knox Vault</Text>
                    <Text style={s.securitySub}>Enhanced key protection</Text>
                  </View>
                  <Switch
                    value={knoxEnabled}
                    onValueChange={setKnoxEnabled}
                    trackColor={{ false: t.border, true: t.accent.green }}
                  />
                </View>
              </View>
            )}

            {/* Apple Secure Enclave */}
            {(securityEnhancements.some((e) => e.id === 'apple-se') ||
              (demoMode && false)) && ( // Only show on iOS in demo
              <View style={s.securityCard}>
                <View style={s.securityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.securityLabel}>Apple Secure Enclave</Text>
                    <Text style={s.securitySub}>Biometric vault encryption</Text>
                  </View>
                  <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: fonts.semibold }}>
                    Active
                  </Text>
                </View>
              </View>
            )}

            {/* Google Titan M */}
            {(securityEnhancements.some((e) => e.id === 'google-titan') ||
              demoMode) && (
              <View style={s.securityCard}>
                <View style={s.securityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.securityLabel}>Google Titan M</Text>
                    <Text style={s.securitySub}>Secure boot + key attestation</Text>
                  </View>
                  <Text style={{ color: t.text.muted, fontSize: 13 }}>
                    {securityEnhancements.some((e) => e.id === 'google-titan')
                      ? 'Available'
                      : 'Not detected'}
                  </Text>
                </View>
              </View>
            )}

            <Text style={s.securityInfo}>
              Phone security features protect your app-generated keys with hardware-backed
              encryption. They are not a replacement for your seed phrase — always keep your
              recovery phrase backed up securely.
            </Text>

            {/* ═══════════════════════════════════════════════
                Imported Addresses (from any source)
                ═══════════════════════════════════════════════ */}
            {importedAddresses && (
              <>
                <Text style={s.sectionHeader}>Imported Addresses</Text>
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

            <View style={s.bottomPadding} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
