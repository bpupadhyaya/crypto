import { fonts } from '../utils/theme';
/**
 * Unlock Screen — Multiple sign-in options.
 *
 * Authentication methods:
 *   1. Biometric (fingerprint / Face ID — auto-triggered, prominent button)
 *   2. PIN (default fallback)
 *   3. Password (vault password)
 *   4. Recover via Seed Phrase (12/24 words)
 *   5. Hardware Key (external device: Ledger, Trezor, Keystone)
 *   6. Phone Seed Vault (Solana Saga/Seeker — TRUE cold storage)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import {
  detectBuiltinKey,
  getDemoBuiltinKey,
  importFromSeedVault,
  getDemoSeedVaultAddresses,
  type BuiltinKeyInfo,
} from '../core/hardware/hardwareKeyManager';

type UnlockMode = 'loading' | 'biometric' | 'pin' | 'password' | 'seed-recovery' | 'hardware-key' | 'builtin-key';

export function UnlockScreen() {
  const [mode, setMode] = useState<UnlockMode>('pin');
  const [password, setPassword] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [builtinKey, setBuiltinKey] = useState<BuiltinKeyInfo | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLabel, setBioLabel] = useState('Fingerprint');
  const { setStatus, setAddresses, biometricEnabled, demoMode } = useWalletStore();
  const t = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logo: { color: t.accent.green, fontSize: 40, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 8 },
    title: { color: t.text.primary, fontSize: fonts.xxxl, fontWeight: fonts.heavy, textAlign: 'center' },
    subtitle: { color: t.text.secondary, fontSize: fonts.md, textAlign: 'center', marginTop: 8, marginBottom: 32 },
    input: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, color: t.text.primary, fontSize: fonts.lg, marginBottom: 12 },
    textArea: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, color: t.text.primary, fontSize: fonts.lg, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
    unlockButton: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    unlockButtonText: { color: t.bg.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    linkText: { color: t.accent.blue, fontSize: fonts.md, textAlign: 'center' },
    bottomActions: { paddingHorizontal: 24, paddingBottom: 32 },
    altMethodsTitle: { color: t.text.muted, fontSize: fonts.sm, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 12, marginTop: 8 },
    altMethodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8 },
    altMethodBtn: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
    altMethodText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.semibold },
    builtinIndicator: { borderColor: t.accent.green },
    builtinText: { color: t.accent.green },
    backLink: { marginTop: 16, alignItems: 'center' },
    warningText: { color: t.accent.yellow, fontSize: fonts.sm, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    hwCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
    hwIcon: { fontSize: 48, marginBottom: 12 },
    hwTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold, marginBottom: 4 },
    hwDesc: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', lineHeight: 20 },
    coldStorageCard: {
      backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16,
      alignItems: 'center', borderWidth: 2, borderColor: t.accent.green,
    },
    coldStorageDot: {
      width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent.green, marginBottom: 8,
    },
    coldStorageProvider: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.semibold, marginBottom: 8 },
    coldStorageDesc: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', lineHeight: 20 },
    biometricButton: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: t.accent.green,
    },
    biometricButtonText: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    biometricIcon: { fontSize: fonts.hero, marginBottom: 4 },
    orDivider: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginVertical: 8, textTransform: 'uppercase', letterSpacing: 1 },
  }), [t]);

  useEffect(() => {
    initBiometric();

    // Check if PIN is configured — if not, show password
    authManager.isPinConfigured().then((configured) => {
      if (!configured) setMode('password');
    });

    detectBuiltinKeyAsync();
  }, []);

  const initBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return;
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return;

      setBioAvailable(true);

      // Detect type label for the button — NO auto-trigger, NO auth calls
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBioLabel('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBioLabel('Iris Scan');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBioLabel('Fingerprint');
      } else {
        setBioLabel('Biometrics');
      }
      // IMPORTANT: Do NOT call handleBiometricUnlock(), triggerBiometric(),
      // getVaultPasswordBiometric(), or any authentication function here.
      // User must explicitly tap the biometric button to unlock.
    } catch {
      // Biometric detection failed — PIN pad is the default
    }
  };

  const detectBuiltinKeyAsync = async () => {
    try {
      const info = demoMode ? getDemoBuiltinKey() : await detectBuiltinKey();
      if (info.available && info.isColdStorage) {
        setBuiltinKey(info);
      }
    } catch {
      // No built-in key available
    }
  };

  const deriveAddresses = async (mnemonic: string) => {
    const { HDWallet } = await import('../core/wallet/hdwallet');
    const { EthereumSigner } = await import('../core/chains/ethereum-signer');
    const { BitcoinSigner } = await import('../core/chains/bitcoin-signer');
    const { SolanaSigner } = await import('../core/chains/solana-signer');

    const wallet = HDWallet.fromMnemonic(mnemonic);
    const ethSigner = EthereumSigner.fromWallet(wallet);
    const btcSigner = BitcoinSigner.fromWallet(wallet);
    const solSigner = SolanaSigner.fromWallet(wallet);
    setAddresses({
      ethereum: ethSigner.getAddress(),
      bitcoin: btcSigner.getAddress(),
      solana: solSigner.getAddress(),
    });
    wallet.destroy();
  };

  // ─── Biometric Unlock — uses OS keychain (fingerprint / Face ID / iris / device PIN) ───
  const handleBiometricUnlock = async () => {
    try {
      const vaultPassword = await authManager.getVaultPasswordBiometric('Unlock Open Wallet');
      if (vaultPassword) {
        setUnlockProgress('Decrypting wallet...');
        setMode('loading');

        try {
          const { Vault } = await import('../core/vault/vault');
          const v = new Vault();
          setUnlockProgress('Unlocking vault...');
          const contents = await v.unlock(vaultPassword);
          setUnlockProgress('Deriving addresses...');
          await deriveAddresses(contents.mnemonic);
        } catch {}

        setTempVaultPassword(vaultPassword);
        setUnlockProgress('Loading prices...');
        setStatus('unlocked');
        return;
      }

      // No keychain entry yet (existing user) — fall back to LocalAuthentication directly.
      const isBioEnabled = await authManager.isBiometricEnabled();
      if (!isBioEnabled) return;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Open Wallet',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });
      if (result.success) {
        setUnlockProgress('Loading...');
        setMode('loading');
        setStatus('unlocked');
      }
    } catch {
      // Biometric error — PIN pad is already shown
    }
  };

  const handleDevAutoUnlock = async () => {
    const { DEV_PIN } = await import('../config/devCredentials');
    await handlePinUnlock(DEV_PIN);
  };

  const [unlockProgress, setUnlockProgress] = useState('');

  const handlePinUnlock = async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setPinError(null);
        setUnlockProgress('Decrypting wallet...');
        setMode('loading');

        try {
          const vaultPassword = await authManager.getVaultPassword(pin);
          if (vaultPassword) {
            setUnlockProgress('Deriving addresses...');
            try {
              const { Vault } = await import('../core/vault/vault');
              const v = new Vault();
              const contents = await v.unlock(vaultPassword);
              await deriveAddresses(contents.mnemonic);
            } catch {}

            // Store vault password for session
            setTempVaultPassword(vaultPassword);

            // Migration: store biometric keychain entry
            const isBioEnabled = await authManager.isBiometricEnabled();
            if (isBioEnabled) {
              authManager.storeVaultPasswordBiometric(vaultPassword).catch(() => {});
            }
          }
        } catch {}

        setUnlockProgress('Loading prices...');
        setStatus('unlocked');
      } else {
        const remaining = await authManager.getRemainingAttempts();
        setPinError(`Wrong PIN. ${remaining} attempts remaining.`);
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Authentication failed');
      if ((err as Error)?.message?.includes('Too many')) {
        setMode('password');
      }
    }
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const { Vault } = await import('../core/vault/vault');
      const vault = new Vault();
      const contents = await vault.unlock(password);
      await deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      Alert.alert('Wrong Password', 'The password you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRecovery = async () => {
    const words = seedInput.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Alert.alert('Invalid Phrase', 'Please enter a 12 or 24 word recovery phrase.');
      return;
    }
    if (!recoveryPassword || recoveryPassword.length < 8) {
      Alert.alert('Weak Password', 'Set a new password (8+ characters) to re-encrypt your wallet.');
      return;
    }
    if (recoveryPassword !== recoveryConfirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const mnemonic = words.join(' ');
      const { Vault } = await import('../core/vault/vault');
      const vault = new Vault();
      await vault.create(recoveryPassword, {
        mnemonic,
        accounts: [{
          id: 'default',
          name: 'Recovered Account',
          derivationPaths: {
            bitcoin: "m/44'/0'/0'/0/0",
            ethereum: "m/44'/60'/0'/0/0",
            solana: "m/44'/501'/0'/0'",
            cosmos: "m/44'/118'/0'/0/0",
          },
        }],
        settings: {},
      });

      await deriveAddresses(mnemonic);
      setStatus('unlocked');
    } catch (err) {
      Alert.alert('Recovery Failed', err instanceof Error ? err.message : 'Could not recover wallet.');
    } finally {
      setLoading(false);
    }
  };

  const handleHardwareKeyUnlock = async () => {
    Alert.alert(
      'Hardware Key',
      'Connect your hardware wallet (Ledger, Trezor) via Bluetooth or USB, then confirm on the device to unlock.',
      [{ text: 'OK' }],
    );
  };

  const handleBuiltinKeyUnlock = async () => {
    if (!builtinKey) return;
    setLoading(true);
    try {
      let addresses: Record<string, string>;
      if (demoMode) {
        addresses = getDemoSeedVaultAddresses();
      } else {
        const result = await importFromSeedVault(builtinKey.provider);
        addresses = result.addresses;
      }
      setAddresses(addresses);
      setStatus('unlocked');
    } catch (err) {
      Alert.alert(
        'Seed Vault Error',
        err instanceof Error ? err.message : 'Failed to access phone seed vault.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Manual Biometric Button ───
  const triggerBiometric = async () => {
    try {
      const vaultPassword = await authManager.getVaultPasswordBiometric('Unlock Open Wallet');
      if (vaultPassword) {
        setUnlockProgress('Decrypting wallet...');
        setMode('loading');

        try {
          const { Vault } = await import('../core/vault/vault');
          const v = new Vault();
          setUnlockProgress('Unlocking vault...');
          const contents = await v.unlock(vaultPassword);
          setUnlockProgress('Deriving addresses...');
          await deriveAddresses(contents.mnemonic);
        } catch {}

        setTempVaultPassword(vaultPassword);
        setUnlockProgress('Loading prices...');
        setStatus('unlocked');
        return;
      }

      // No keychain entry yet — fall back to LocalAuthentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Open Wallet',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });
      if (result.success) {
        setUnlockProgress('Loading...');
        setMode('loading');
        setStatus('unlocked');
      }
    } catch {
      Alert.alert('Biometric Unavailable', 'Could not authenticate. Use PIN or enroll biometrics in device Settings.');
    }
  };

  const renderAllBiometricOptions = () => (
    <View>
      <Text style={styles.orDivider}>— or unlock with biometrics —</Text>
      <TouchableOpacity style={styles.biometricButton} onPress={triggerBiometric}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.xxl }}>🔏</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xxs }}>Fingerprint</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.xxl }}>🔓</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xxs }}>Face</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: fonts.xxl }}>👁</Text>
            <Text style={{ color: t.text.muted, fontSize: fonts.xxs }}>Iris</Text>
          </View>
        </View>
        <Text style={[styles.biometricButtonText, { marginTop: 8 }]}>Unlock with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Alternative Methods Bottom Bar ───
  const renderAltMethods = (currentMode: UnlockMode) => (
    <View style={styles.bottomActions}>
      <Text style={styles.altMethodsTitle}>Other sign-in options</Text>
      <View style={styles.altMethodRow}>
        {currentMode !== 'pin' && (
          <TouchableOpacity style={styles.altMethodBtn} onPress={() => setMode('pin')}>
            <Text style={styles.altMethodText}>Use PIN</Text>
          </TouchableOpacity>
        )}
        {currentMode !== 'password' && (
          <TouchableOpacity style={styles.altMethodBtn} onPress={() => setMode('password')}>
            <Text style={styles.altMethodText}>Use Password</Text>
          </TouchableOpacity>
        )}
        {currentMode !== 'seed-recovery' && (
          <TouchableOpacity style={styles.altMethodBtn} onPress={() => setMode('seed-recovery')}>
            <Text style={styles.altMethodText}>Recover with Seed Phrase</Text>
          </TouchableOpacity>
        )}
        {currentMode !== 'hardware-key' && (
          <TouchableOpacity style={styles.altMethodBtn} onPress={() => setMode('hardware-key')}>
            <Text style={styles.altMethodText}>Use Hardware Key</Text>
          </TouchableOpacity>
        )}
        {builtinKey && currentMode !== 'builtin-key' && (
          <TouchableOpacity style={[styles.altMethodBtn, styles.builtinIndicator]} onPress={() => setMode('builtin-key')}>
            <Text style={[styles.altMethodText, styles.builtinText]}>Use Phone's Built-in Key</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── PIN Pad ───
  if (mode === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Biometric button ABOVE PIN pad — easy to reach */}
        {bioAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, { marginTop: 16 }]}
            onPress={triggerBiometric}
          >
            <Text style={styles.biometricButtonText}>Unlock with {bioLabel}</Text>
          </TouchableOpacity>
        )}
        <PinPad
          title="Enter PIN"
          subtitle="Unlock your wallet"
          onComplete={handlePinUnlock}
          error={pinError}
        />
        {renderAltMethods('pin')}
        {__DEV__ && (
          <TouchableOpacity
            onPress={handleDevAutoUnlock}
            style={{ alignItems: 'center', paddingVertical: 10, paddingBottom: 20 }}
          >
            <Text style={{ color: '#f59e0b', fontSize: fonts.sm, fontWeight: fonts.semibold }}>⚡ Dev: Unlock with PIN 123456</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // ─── Password ───
  if (mode === 'password') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>OW</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your password to unlock</Text>

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={t.text.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handlePasswordUnlock}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.unlockButton, loading && styles.buttonDisabled]}
            onPress={handlePasswordUnlock}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={t.bg.primary} />
            ) : (
              <Text style={styles.unlockButtonText}>Unlock</Text>
            )}
          </TouchableOpacity>

          {renderAllBiometricOptions()}
        </View>
        {renderAltMethods('password')}
      </SafeAreaView>
    );
  }

  // ─── Seed Phrase Recovery ───
  if (mode === 'seed-recovery') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={styles.logo}>OW</Text>
          <Text style={styles.title}>Recover Wallet</Text>
          <Text style={styles.subtitle}>Enter your 12 or 24 word recovery phrase to regain access</Text>

          <TextInput
            style={styles.textArea}
            placeholder="Enter recovery phrase..."
            placeholderTextColor={t.text.muted}
            value={seedInput}
            onChangeText={setSeedInput}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="New password (8+ characters)"
            placeholderTextColor={t.text.muted}
            secureTextEntry
            value={recoveryPassword}
            onChangeText={setRecoveryPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={t.text.muted}
            secureTextEntry
            value={recoveryConfirm}
            onChangeText={setRecoveryConfirm}
          />

          <TouchableOpacity
            style={[styles.unlockButton, loading && styles.buttonDisabled]}
            onPress={handleSeedRecovery}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={t.bg.primary} />
            ) : (
              <Text style={styles.unlockButtonText}>Recover & Unlock</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.warningText}>
            This will create a new encrypted vault with your recovered seed phrase. Your old password will no longer work.
          </Text>
        </ScrollView>
        {renderAltMethods('seed-recovery')}
      </SafeAreaView>
    );
  }

  // ─── Hardware Key (external) ───
  if (mode === 'hardware-key') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.hwCard}>
            <Text style={styles.hwIcon}>HW</Text>
            <Text style={styles.hwTitle}>Hardware Key</Text>
            <Text style={styles.hwDesc}>
              Connect your Ledger, Trezor, or Keystone hardware wallet to sign in securely.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.unlockButton, loading && styles.buttonDisabled]}
            onPress={handleHardwareKeyUnlock}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={t.bg.primary} />
            ) : (
              <Text style={styles.unlockButtonText}>Connect Hardware Key</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.warningText}>
            Make sure your hardware wallet is powered on and Bluetooth/USB is enabled.
            Open the crypto app on your device before connecting.
          </Text>
        </View>
        {renderAltMethods('hardware-key')}
      </SafeAreaView>
    );
  }

  // ─── Phone Built-in Key (Solana Saga/Seeker cold storage) ───
  if (mode === 'builtin-key' && builtinKey) {
    const providerNames: Record<string, string> = {
      'solana-saga': 'Solana Saga Seed Vault',
      'solana-seeker': 'Solana Seeker Seed Vault',
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.coldStorageCard}>
            <View style={styles.coldStorageDot} />
            <Text style={styles.hwTitle}>Phone Seed Vault</Text>
            <Text style={styles.coldStorageProvider}>
              {providerNames[builtinKey.provider] || builtinKey.provider}
            </Text>
            <Text style={styles.coldStorageDesc}>
              Your phone has a hardware security module that generates and stores your seed
              phrase. The seed never leaves the hardware — even Open Wallet cannot see it.
              {'\n\n'}
              Authenticate to import your wallet addresses from the seed vault.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.unlockButton, loading && styles.buttonDisabled]}
            onPress={handleBuiltinKeyUnlock}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={t.bg.primary} />
            ) : (
              <Text style={styles.unlockButtonText}>Use Phone's Built-in Key</Text>
            )}
          </TouchableOpacity>
        </View>
        {renderAltMethods('builtin-key')}
      </SafeAreaView>
    );
  }

  // ─── Loading (after PIN/biometric verified, decrypting wallet) ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>OW</Text>
        <ActivityIndicator color={t.accent.green} size="large" style={{ marginTop: 20 }} />
        <Text style={{ color: t.text.secondary, fontSize: fonts.md, marginTop: 16 }}>
          {unlockProgress || 'Unlocking...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
