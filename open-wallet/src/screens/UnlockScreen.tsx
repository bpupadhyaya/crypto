/**
 * Unlock Screen — Multiple sign-in options.
 *
 * Authentication methods:
 *   1. PIN (default)
 *   2. Biometric (Face ID / fingerprint — auto-try)
 *   3. Password (vault password)
 *   4. Recover via Seed Phrase (12/24 words)
 *   5. Hardware Key (external device)
 *   6. Phone Built-in Key (Solana Saga/Seeker style secure element)
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
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { detectBuiltinKey, getDemoBuiltinKey, type BuiltinKeyInfo } from '../core/hardware/hardwareKeyManager';

type UnlockMode = 'loading' | 'biometric' | 'pin' | 'password' | 'seed-recovery' | 'hardware-key' | 'builtin-key';

export function UnlockScreen() {
  // Show PIN immediately — fastest path. Check biometric in background.
  const [mode, setMode] = useState<UnlockMode>('pin');
  const [password, setPassword] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [builtinKey, setBuiltinKey] = useState<BuiltinKeyInfo | null>(null);
  const { setStatus, setAddresses, biometricEnabled, demoMode } = useWalletStore();
  const t = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logo: { color: t.accent.green, fontSize: 40, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
    title: { color: t.text.primary, fontSize: 28, fontWeight: '800', textAlign: 'center' },
    subtitle: { color: t.text.secondary, fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 32 },
    input: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, color: t.text.primary, fontSize: 16, marginBottom: 12 },
    textArea: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, color: t.text.primary, fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 },
    unlockButton: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    unlockButtonText: { color: t.bg.primary, fontSize: 17, fontWeight: '700' },
    linkText: { color: t.accent.blue, fontSize: 14, textAlign: 'center' },
    bottomActions: { paddingHorizontal: 24, paddingBottom: 32 },
    altMethodsTitle: { color: t.text.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700', textAlign: 'center', marginBottom: 12, marginTop: 8 },
    altMethodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 8 },
    altMethodBtn: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
    altMethodText: { color: t.accent.blue, fontSize: 13, fontWeight: '600' },
    builtinIndicator: { borderColor: t.accent.green },
    builtinText: { color: t.accent.green },
    backLink: { marginTop: 16, alignItems: 'center' },
    warningText: { color: t.accent.yellow, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    hwCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
    hwIcon: { fontSize: 48, marginBottom: 12 },
    hwTitle: { color: t.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
    hwDesc: { color: t.text.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  }), [t]);

  useEffect(() => {
    // Try biometric in background (non-blocking)
    if (biometricEnabled) {
      authManager.authenticateWithBiometric().then(async (result) => {
        if (result.success) {
          await unlockVaultWithStoredCredentials();
        }
      }).catch(() => {});
    }

    // Check if PIN is configured — if not, show password
    authManager.isPinConfigured().then((configured) => {
      if (!configured) setMode('password');
    });

    // Detect built-in hardware key
    detectBuiltinKeyAsync();
  }, []);

  const detectBuiltinKeyAsync = async () => {
    try {
      const info = demoMode ? getDemoBuiltinKey() : await detectBuiltinKey();
      if (info.available) {
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

  const unlockVaultWithStoredCredentials = async () => {
    try {
      const { Vault } = await import('../core/vault/vault');
      const vault = new Vault();
      const contents = await vault.unlockWithBiometrics();
      await deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      setMode('pin');
    }
  };

  const handlePinUnlock = async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setPinError(null);
        // UNLOCK IMMEDIATELY — show Home screen right away
        setStatus('unlocked');

        // Vault decrypt + address refresh happens in background (non-blocking)
        authManager.getVaultPassword(pin).then(async (vaultPassword) => {
          if (vaultPassword) {
            try {
              const { Vault } = await import('../core/vault/vault');
              const v = new Vault();
              const contents = await v.unlock(vaultPassword);
              await deriveAddresses(contents.mnemonic);
            } catch {}
          }
        });
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

      // Re-create vault with the recovered seed
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
    // Hardware key unlock — would communicate with external device
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
      // In a real implementation, this would access the phone's secure element
      // to retrieve or derive keys without exposing the seed phrase
      const providerNames: Record<string, string> = {
        'solana-saga': 'Solana Saga Seed Vault',
        'solana-seeker': 'Solana Seeker Seed Vault',
        'samsung-knox': 'Samsung Knox',
        'google-titan': 'Google Titan M',
        'apple-se': 'Apple Secure Enclave',
      };
      Alert.alert(
        'Built-in Key',
        `Authenticating with ${providerNames[builtinKey.provider] || builtinKey.provider}...\n\nThis would use your phone's secure hardware to unlock the wallet without exposing your seed phrase.`,
      );
    } finally {
      setLoading(false);
    }
  };

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
        {builtinKey && builtinKey.available && currentMode !== 'builtin-key' && (
          <TouchableOpacity style={[styles.altMethodBtn, styles.builtinIndicator]} onPress={() => setMode('builtin-key')}>
            <Text style={[styles.altMethodText, styles.builtinText]}>Use Phone's Built-in Key</Text>
          </TouchableOpacity>
        )}
        {biometricEnabled && currentMode !== 'biometric' && (
          <TouchableOpacity
            style={styles.altMethodBtn}
            onPress={() => {
              authManager.authenticateWithBiometric().then(async (result) => {
                if (result.success) await unlockVaultWithStoredCredentials();
              }).catch(() => {});
            }}
          >
            <Text style={styles.altMethodText}>Try Biometric</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── PIN Pad ───
  if (mode === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        <PinPad
          title="Enter PIN"
          subtitle="Unlock your wallet"
          onComplete={handlePinUnlock}
          error={pinError}
        />
        {renderAltMethods('pin')}
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

  // ─── Hardware Key ───
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

  // ─── Phone Built-in Key ───
  if (mode === 'builtin-key' && builtinKey) {
    const providerNames: Record<string, string> = {
      'solana-saga': 'Solana Saga Seed Vault',
      'solana-seeker': 'Solana Seeker Seed Vault',
      'samsung-knox': 'Samsung Knox Secure Element',
      'google-titan': 'Google Titan M Chip',
      'apple-se': 'Apple Secure Enclave',
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.hwCard, { borderWidth: 2, borderColor: t.accent.green }]}>
            <Text style={styles.hwIcon}>SE</Text>
            <Text style={styles.hwTitle}>Phone's Built-in Key</Text>
            <Text style={[styles.hwDesc, { color: t.accent.green, fontWeight: '600', marginBottom: 8 }]}>
              {providerNames[builtinKey.provider] || builtinKey.provider}
            </Text>
            <Text style={styles.hwDesc}>
              {builtinKey.hasExistingSeedPhrase
                ? 'Your phone has an existing seed phrase in its secure element. Authenticate to unlock.'
                : 'Use your phone\'s secure hardware to authenticate and unlock your wallet.'}
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
              <Text style={styles.unlockButtonText}>Authenticate with Secure Element</Text>
            )}
          </TouchableOpacity>
        </View>
        {renderAltMethods('builtin-key')}
      </SafeAreaView>
    );
  }

  // ─── Fallback: Loading ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator color={t.accent.green} size="large" />
      </View>
    </SafeAreaView>
  );
}
