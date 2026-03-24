/**
 * Onboarding Screen — First-time wallet setup.
 * Create new wallet or restore from seed phrase.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { HDWallet } from '../core/wallet/hdwallet';
import { Vault } from '../core/vault/vault';
import { EthereumSigner } from '../core/chains/ethereum-signer';
import { BitcoinSigner } from '../core/chains/bitcoin-signer';
import { SolanaSigner } from '../core/chains/solana-signer';
import { useWalletStore } from '../store/walletStore';

type OnboardingStep = 'welcome' | 'create' | 'backup' | 'restore' | 'password';

export function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [mnemonic, setMnemonic] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setStatus, setHasVault, setAddresses, setTempVaultPassword } = useWalletStore();

  const handleCreateWallet = () => {
    setLoading(true);
    try {
      const wallet = HDWallet.generate({ strength: 256 });
      setMnemonic(wallet.getMnemonic());
      wallet.destroy(); // will re-derive from mnemonic after password set
      setStep('backup');
    } catch (_error) {
      Alert.alert('Error', 'Failed to generate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const vault = new Vault();
      const phraseToUse = step === 'password' && restoreInput ? restoreInput : mnemonic;

      await vault.create(password, {
        mnemonic: phraseToUse,
        accounts: [{
          id: 'default',
          name: 'Main Account',
          derivationPaths: {
            bitcoin: "m/44'/0'/0'/0/0",
            ethereum: "m/44'/60'/0'/0/0",
            solana: "m/44'/501'/0'/0'",
            cosmos: "m/44'/118'/0'/0/0",
          },
        }],
        settings: {},
      });

      // Derive addresses from mnemonic
      const wallet = HDWallet.fromMnemonic(phraseToUse);
      const ethSigner = EthereumSigner.fromWallet(wallet);
      const btcSigner = BitcoinSigner.fromWallet(wallet);
      const solSigner = SolanaSigner.fromWallet(wallet);

      setAddresses({
        ethereum: ethSigner.getAddress(),
        bitcoin: btcSigner.getAddress(),
        solana: solSigner.getAddress(),
      });

      wallet.destroy();
      setHasVault(true);
      setTempVaultPassword(password); // pass to PIN setup for encrypted storage
      setStatus('pin_setup' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to create vault. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    const words = restoreInput.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Alert.alert('Invalid Phrase', 'Please enter a 12 or 24 word recovery phrase.');
      return;
    }
    setStep('password');
  };

  // ─── Welcome ───
  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>OW</Text>
          <Text style={styles.title}>Open Wallet</Text>
          <Text style={styles.subtitle}>
            Your money. Your control.{'\n'}
            Every token. Every chain. One app.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0f" />
              ) : (
                <Text style={styles.primaryButtonText}>Create New Wallet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep('restore')}
            >
              <Text style={styles.secondaryButtonText}>Restore Existing Wallet</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            100% Open Source • Post-Quantum Encrypted
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Backup (show seed phrase) ───
  if (step === 'backup') {
    const words = mnemonic.split(' ');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.stepTitle}>Save Your Recovery Phrase</Text>
          <Text style={styles.stepDesc}>
            Write these {words.length} words down in order. This is the ONLY way to recover your wallet. Never share it.
          </Text>

          <View style={styles.wordGrid}>
            {words.map((word, i) => (
              <View key={i} style={styles.wordItem}>
                <Text style={styles.wordNumber}>{i + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep('password')}
          >
            <Text style={styles.primaryButtonText}>I've Saved It</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => { setMnemonic(''); setStep('welcome'); }}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Restore ───
  if (step === 'restore') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.stepTitle}>Restore Your Wallet</Text>
          <Text style={styles.stepDesc}>
            Enter your 12 or 24 word recovery phrase, separated by spaces.
          </Text>

          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Enter recovery phrase..."
            placeholderTextColor="#606070"
            value={restoreInput}
            onChangeText={setRestoreInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleRestore}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('welcome')}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Set Password ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Set Your Password</Text>
        <Text style={styles.stepDesc}>
          This password encrypts your wallet on this device using post-quantum resistant encryption. Choose a strong password.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Password (8+ characters)"
          placeholderTextColor="#606070"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#606070"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0f" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          )}
        </TouchableOpacity>
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
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#f0f0f5',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  buttonGroup: {
    marginTop: 48,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#0a0a0f',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#a0a0b0',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    color: '#606070',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
  stepTitle: {
    color: '#f0f0f5',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  stepDesc: {
    color: '#a0a0b0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161f',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '30%',
  },
  wordNumber: {
    color: '#606070',
    fontSize: 12,
    marginRight: 6,
    width: 20,
  },
  wordText: {
    color: '#f0f0f5',
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 16,
    color: '#f0f0f5',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 16,
    color: '#f0f0f5',
    fontSize: 16,
    marginBottom: 12,
  },
});
