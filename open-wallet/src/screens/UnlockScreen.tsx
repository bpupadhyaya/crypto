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
import { Vault } from '../core/vault/vault';
import { HDWallet } from '../core/wallet/hdwallet';
import { EthereumSigner } from '../core/chains/ethereum-signer';
import { BitcoinSigner } from '../core/chains/bitcoin-signer';
import { SolanaSigner } from '../core/chains/solana-signer';
import { useWalletStore } from '../store/walletStore';

type UnlockMode = 'loading' | 'biometric' | 'pin' | 'password';

const vault = new Vault();

export function UnlockScreen() {
  const [mode, setMode] = useState<UnlockMode>('loading');
  const [password, setPassword] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setStatus, setAddresses } = useWalletStore();

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const bestMethod = await authManager.getBestAuthMethod();

    if (bestMethod === 'biometric') {
      const result = await authManager.authenticateWithBiometric();
      if (result.success) {
        await unlockVaultWithStoredCredentials();
        return;
      }
      // Biometric failed — fall to PIN
    }

    const pinConfigured = await authManager.isPinConfigured();
    setMode(pinConfigured ? 'pin' : 'password');
  };

  const deriveAddresses = (mnemonic: string) => {
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
    // Biometric success — unlock vault using stored master key
    try {
      const contents = await vault.unlockWithBiometrics();
      deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      // Biometric vault unlock failed — fall to PIN
      setMode('pin');
    }
  };

  const handlePinUnlock = async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (valid) {
        setPinError(null);
        // PIN verified — retrieve vault password and decrypt
        const vaultPassword = await authManager.getVaultPassword(pin);
        if (vaultPassword) {
          const contents = await vault.unlock(vaultPassword);
          deriveAddresses(contents.mnemonic);
        }
        // Even without vault password (e.g., older setup), addresses
        // are persisted in Zustand store from initial creation
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
      const contents = await vault.unlock(password);
      deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      Alert.alert('Wrong Password', 'The password you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading ───
  if (mode === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.logo}>OW</Text>
          <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity onPress={initAuth}>
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
