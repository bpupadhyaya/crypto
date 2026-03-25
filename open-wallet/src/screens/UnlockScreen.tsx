/**
 * Unlock Screen — Biometric → PIN → Password flow.
 *
 * On launch:
 *   1. If biometric enabled → auto-prompt Face ID / fingerprint
 *   2. If biometric fails or not enabled → show PIN pad
 *   3. If PIN fails 5x → locked for 30s, then require full password
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';

type UnlockMode = 'loading' | 'biometric' | 'pin' | 'password';

export function UnlockScreen() {
  // Show PIN immediately — fastest path. Check biometric in background.
  const [mode, setMode] = useState<UnlockMode>('pin');
  const [password, setPassword] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setStatus, setAddresses, biometricEnabled } = useWalletStore();

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
  }, []);

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
        // Addresses are already persisted in store from initial creation
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
        <View style={styles.bottomActions}>
          <TouchableOpacity onPress={() => setMode('password')}>
            <Text style={styles.linkText}>Use password instead</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            authManager.authenticateWithBiometric().then(async (result) => {
              if (result.success) await unlockVaultWithStoredCredentials();
            }).catch(() => {});
          }}>
            <Text style={styles.linkText}>Try biometric</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Password ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.passwordContent}>
        <Text style={styles.logo}>OW</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your password to unlock</Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#606070"
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
            <ActivityIndicator color="#0a0a0f" />
          ) : (
            <Text style={styles.unlockButtonText}>Unlock</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode('pin')} style={{ marginTop: 16 }}>
          <Text style={styles.linkText}>Use PIN instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  passwordContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { color: '#22c55e', fontSize: 40, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  title: { color: '#f0f0f5', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#a0a0b0', fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: { backgroundColor: '#16161f', borderRadius: 16, padding: 16, color: '#f0f0f5', fontSize: 16, marginBottom: 16 },
  unlockButton: { backgroundColor: '#22c55e', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  unlockButtonText: { color: '#0a0a0f', fontSize: 17, fontWeight: '700' },
  linkText: { color: '#3b82f6', fontSize: 14, textAlign: 'center' },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 40 },
});
