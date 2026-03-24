/**
 * Unlock Screen — Shown when vault exists but wallet is locked.
 * Password field + biometric button (if enabled).
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
import { Vault } from '../core/vault/vault';
import { HDWallet } from '../core/wallet/hdwallet';
import { EthereumSigner } from '../core/chains/ethereum-signer';
import { BitcoinSigner } from '../core/chains/bitcoin-signer';
import { SolanaSigner } from '../core/chains/solana-signer';
import { useWalletStore } from '../store/walletStore';

const vault = new Vault();

export function UnlockScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setStatus, setAddresses, biometricEnabled } = useWalletStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    if (biometricEnabled) {
      const available = await vault.isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        handleBiometricUnlock();
      }
    }
  };

  const deriveAddresses = (mnemonic: string) => {
    const wallet = HDWallet.fromMnemonic(mnemonic);
    const ethSigner = EthereumSigner.fromWallet(wallet);
    const btcSigner = BitcoinSigner.fromWallet(wallet);
    const solSigner = SolanaSigner.fromWallet(wallet);

    const addresses: Partial<Record<string, string>> = {
      ethereum: ethSigner.getAddress(),
      bitcoin: btcSigner.getAddress(),
      solana: solSigner.getAddress(),
    };

    setAddresses(addresses);
    wallet.destroy();
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const contents = await vault.unlock(password);
      deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      Alert.alert('Wrong Password', 'The password you entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setLoading(true);
    try {
      const contents = await vault.unlockWithBiometrics();
      deriveAddresses(contents.mnemonic);
      setStatus('unlocked');
    } catch {
      // Biometric failed — user can try password
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricUnlock}
            disabled={loading}
          >
            <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footer}>
          Post-Quantum Encrypted • AES-256-GCM
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    color: '#22c55e',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#f0f0f5',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 16,
    color: '#f0f0f5',
    fontSize: 16,
    marginBottom: 16,
  },
  unlockButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  unlockButtonText: {
    color: '#0a0a0f',
    fontSize: 17,
    fontWeight: '700',
  },
  biometricButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  biometricText: {
    color: '#a0a0b0',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    color: '#606070',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});
