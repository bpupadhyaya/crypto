/**
 * Onboarding Screen — First-time wallet setup.
 * Create new wallet or restore from seed phrase.
 */

import React, { useState, useMemo } from 'react';
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
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type OnboardingStep = 'welcome' | 'create' | 'backup' | 'verify_recovery' | 'restore' | 'password';

export function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [mnemonic, setMnemonic] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const { setStatus, setHasVault, setAddresses, setTempVaultPassword } = useWalletStore();
  const t = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg.primary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      color: t.accent.green,
      fontSize: 48,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
    },
    title: {
      color: t.text.primary,
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
    },
    subtitle: {
      color: t.text.secondary,
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
      backgroundColor: t.accent.green,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 16,
    },
    primaryButtonText: {
      color: t.bg.primary,
      fontSize: 17,
      fontWeight: '700',
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 8,
    },
    secondaryButtonText: {
      color: t.text.secondary,
      fontSize: 17,
      fontWeight: '600',
    },
    footer: {
      color: t.text.muted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 32,
    },
    stepTitle: {
      color: t.text.primary,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 12,
    },
    stepDesc: {
      color: t.text.secondary,
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
      backgroundColor: t.bg.card,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      width: '30%',
    },
    wordNumber: {
      color: t.text.muted,
      fontSize: 12,
      marginRight: 6,
      width: 20,
    },
    wordText: {
      color: t.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    textArea: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 16,
      color: t.text.primary,
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 8,
    },
    input: {
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 16,
      color: t.text.primary,
      fontSize: 16,
      marginBottom: 12,
    },
  }), [t]);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const { HDWallet } = await import('../core/wallet/hdwallet');
      const wallet = HDWallet.generate({ strength: 256 });
      setMnemonic(wallet.getMnemonic());
      wallet.destroy();
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
    const phraseToUse = step === 'password' && restoreInput ? restoreInput : mnemonic;

    try {
      // Step 1: Create and encrypt vault (lazy import — not loaded at startup)
      const { Vault } = await import('../core/vault/vault');
      const vaultInstance = new Vault();
      await vaultInstance.create(password, {
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Alert.alert('Vault Error', `Vault creation failed: ${msg}`);
      setLoading(false);
      return;
    }

    try {
      // Step 2: Derive addresses (lazy import — heavy libs loaded only here)
      const { HDWallet } = await import('../core/wallet/hdwallet');
      const { EthereumSigner } = await import('../core/chains/ethereum-signer');
      const { BitcoinSigner } = await import('../core/chains/bitcoin-signer');
      const { SolanaSigner } = await import('../core/chains/solana-signer');

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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      Alert.alert('Key Error', `Address derivation failed: ${msg}`);
      setLoading(false);
      return;
    }

    setHasVault(true);
    setTempVaultPassword(password);
    setLoading(false);
    setStatus('pin_setup' as any);
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
                <ActivityIndicator color={t.bg.primary} />
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

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.secondaryButton, { marginBottom: 8 }]}
              onPress={async () => { const Clipboard = await import('expo-clipboard'); Clipboard.setStringAsync(mnemonic); Alert.alert('Copied', 'Seed phrase copied (dev only)'); }}
            >
              <Text style={[styles.secondaryButtonText, { color: t.accent.yellow }]}>Copy (Dev Only)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              Alert.alert(
                'Verify Your Recovery Phrase',
                'To confirm you saved your seed phrase correctly, we will now ask you to re-enter it.\n\nThis is mandatory — it guarantees you can recover your wallet if anything happens to your device.',
                [{ text: 'Continue', onPress: () => setStep('verify_recovery') }]
              );
            }}
          >
            <Text style={styles.primaryButtonText}>I've Saved It — Verify Now</Text>
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

  // ─── Verify Recovery (Mandatory) ───
  if (step === 'verify_recovery') {
    const handleVerify = () => {
      const inputWords = verifyInput.trim().toLowerCase().split(/\s+/);
      const originalWords = mnemonic.trim().toLowerCase().split(/\s+/);
      if (inputWords.length !== originalWords.length || inputWords.join(' ') !== originalWords.join(' ')) {
        Alert.alert(
          'Incorrect',
          'The recovery phrase you entered does not match. Please check your saved phrase and try again.\n\nThis verification is mandatory to protect your funds.',
        );
        return;
      }
      Alert.alert(
        '✅ Recovery Verified',
        'Your recovery phrase is correct. Your wallet can be recovered from this phrase.\n\nNow set a password to encrypt your wallet on this device.',
        [{ text: 'Continue', onPress: () => setStep('password') }]
      );
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify Recovery Phrase</Text>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>
            Re-enter your {mnemonic.split(' ').length}-word recovery phrase to confirm you saved it correctly. This is mandatory.
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            placeholder="Enter your recovery phrase..."
            placeholderTextColor={t.text.muted}
            value={verifyInput}
            onChangeText={setVerifyInput}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleVerify}>
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          </TouchableOpacity>
          <Text style={{ color: t.accent.yellow, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
            ⚠️ If you cannot re-enter your recovery phrase, go back and save it again. Without it, your wallet cannot be recovered if your device is lost.
          </Text>
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
            placeholderTextColor={t.text.muted}
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
          placeholderTextColor={t.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={t.text.muted}
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
            <ActivityIndicator color={t.bg.primary} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
