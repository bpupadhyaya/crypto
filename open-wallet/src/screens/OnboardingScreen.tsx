/**
 * Onboarding Screen — First-time wallet setup.
 * Create new wallet or restore from seed phrase.
 *
 * Hardened seed phrase verification:
 *   1. Show seed phrase
 *   2. Require re-ordering ALL shuffled words
 *   3. Checkbox: "I understand losing means losing funds"
 *   4. Warning about paper vs screenshot
 *   5. Second verification: enter specific word positions
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getProvider } from '../core/hardware/hardwareKeyManager';

type OnboardingStep =
  | 'welcome'
  | 'create'
  | 'backup'
  | 'verify_shuffle'
  | 'verify_spot_check'
  | 'restore'
  | 'password';

export function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [mnemonic, setMnemonic] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // On Android, always show Seed Vault option — detection happens when user taps it
  const seedVaultAvailable = Platform.OS === 'android';
  const seedVaultName = 'Solana Seed Vault';

  // Shuffle verification state
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [acknowledgedLoss, setAcknowledgedLoss] = useState(false);
  const [acknowledgedPaper, setAcknowledgedPaper] = useState(false);

  // Spot-check verification state
  const [spotCheckIndices, setSpotCheckIndices] = useState<number[]>([]);
  const [spotCheckAnswers, setSpotCheckAnswers] = useState<Record<number, string>>({});

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
    scrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 32,
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
      marginTop: 24,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: t.accent.green,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 16,
    },
    primaryButtonDisabled: {
      backgroundColor: t.accent.green,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 16,
      opacity: 0.4,
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
    // Shuffle verification styles
    shuffleArea: {
      minHeight: 80,
      backgroundColor: t.bg.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    selectedWordChip: {
      backgroundColor: t.accent.green + '20',
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: t.accent.green,
    },
    selectedWordText: {
      color: t.accent.green,
      fontSize: 13,
      fontWeight: '600',
    },
    wordPool: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
    },
    poolWordChip: {
      backgroundColor: t.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    poolWordChipUsed: {
      opacity: 0.25,
    },
    poolWordText: {
      color: t.text.primary,
      fontSize: 13,
      fontWeight: '500',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: t.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: t.accent.green,
      borderColor: t.accent.green,
    },
    checkboxMark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    checkboxLabel: {
      color: t.text.secondary,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    warningBox: {
      backgroundColor: t.accent.yellow + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.accent.yellow + '40',
    },
    warningText: {
      color: t.accent.yellow,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '500',
    },
    spotCheckCard: {
      backgroundColor: t.bg.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    spotCheckLabel: {
      color: t.text.secondary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 8,
    },
    spotCheckInput: {
      backgroundColor: t.bg.primary,
      borderRadius: 10,
      padding: 12,
      color: t.text.primary,
      fontSize: 16,
    },
    progressText: {
      color: t.text.muted,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
  }), [t]);

  // ─── Helpers ───

  const shuffleArray = useCallback(<T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const pickRandomIndices = useCallback((total: number, count: number): number[] => {
    const indices: number[] = [];
    while (indices.length < count) {
      const r = Math.floor(Math.random() * total);
      if (!indices.includes(r)) indices.push(r);
    }
    return indices.sort((a, b) => a - b);
  }, []);

  // ─── Handlers ───

  const handleUseSeedVault = async () => {
    setLoading(true);
    try {
      const { connectSeedVault } = await import('../core/hardware/seedVaultBridge');
      const result = await connectSeedVault();

      if (result.success) {
        Object.entries(result.addresses).forEach(([chain, addr]) => {
          setAddresses({ [chain]: addr } as any);
        });
        setHasVault(true);
        setStatus('unlocked');
        Alert.alert('Seed Vault Connected', result.message);
        return;
      }

      // connectSeedVault now surfaces the real error message
      Alert.alert(
        'Seed Vault',
        `${result.message}\n\nAlternatively, you can create a new wallet or restore from a seed phrase.`,
        [
          { text: 'Create New Wallet', onPress: handleCreateWallet },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Seed Vault',
        `Connection failed: ${msg}\n\nYou can create a new wallet or restore from a seed phrase instead.`,
        [
          { text: 'Create New Wallet', onPress: handleCreateWallet },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

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

  const startShuffleVerification = () => {
    const words = mnemonic.split(' ');
    setShuffledWords(shuffleArray(words));
    setSelectedWords([]);
    setAcknowledgedLoss(false);
    setAcknowledgedPaper(false);
    setStep('verify_shuffle');
  };

  const handleWordSelect = (word: string) => {
    // Find the first unused occurrence of this word
    const usedCounts: Record<string, number> = {};
    for (const w of selectedWords) {
      usedCounts[w] = (usedCounts[w] || 0) + 1;
    }

    const availableCount = shuffledWords.filter((w) => w === word).length;
    const usedCount = usedCounts[word] || 0;

    if (usedCount < availableCount) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleWordDeselect = (index: number) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const handleShuffleVerify = () => {
    const originalWords = mnemonic.split(' ');
    if (selectedWords.length !== originalWords.length) {
      Alert.alert('Incomplete', `Please select all ${originalWords.length} words in the correct order.`);
      return;
    }

    if (!acknowledgedLoss) {
      Alert.alert('Required', 'Please acknowledge that losing your seed phrase means losing your funds.');
      return;
    }

    if (!acknowledgedPaper) {
      Alert.alert('Required', 'Please confirm you have written this down on paper.');
      return;
    }

    const correct = selectedWords.every((w, i) => w === originalWords[i]);
    if (!correct) {
      Alert.alert(
        'Incorrect Order',
        'The words are not in the correct order. Please try again.\n\nGo back and carefully check your written copy.',
        [{ text: 'Try Again', onPress: () => { setSelectedWords([]); setShuffledWords(shuffleArray(originalWords)); } }],
      );
      return;
    }

    // Start spot-check verification
    const indices = pickRandomIndices(originalWords.length, 3);
    setSpotCheckIndices(indices);
    setSpotCheckAnswers({});
    setStep('verify_spot_check');
  };

  const handleSpotCheckVerify = () => {
    const originalWords = mnemonic.split(' ');
    let allCorrect = true;

    for (const idx of spotCheckIndices) {
      const answer = (spotCheckAnswers[idx] || '').trim().toLowerCase();
      if (answer !== originalWords[idx].toLowerCase()) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      Alert.alert(
        'Incorrect',
        'One or more answers are wrong. Please check your written recovery phrase and try again.',
        [{ text: 'Try Again', onPress: () => setSpotCheckAnswers({}) }],
      );
      return;
    }

    Alert.alert(
      'Recovery Verified',
      'Your recovery phrase is correct and verified. Your wallet can be recovered from this phrase.\n\nNow set a password to encrypt your wallet on this device.',
      [{ text: 'Continue', onPress: () => setStep('password') }],
    );
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

      // Derive Cosmos/OpenChain address
      const { CosmosSigner } = await import('../core/chains/cosmos-signer');
      const cosmosSigner = CosmosSigner.fromWallet(wallet, 0, 'openchain');
      const cosmosAddr = await cosmosSigner.getAddress();

      setAddresses({
        ethereum: ethSigner.getAddress(),
        bitcoin: btcSigner.getAddress(),
        solana: solSigner.getAddress(),
        openchain: cosmosAddr,
        cosmos: cosmosAddr,
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

  // ─── Dev Quickstart (DEV builds only) ───

  const handleDevQuickstart = async () => {
    if (!__DEV__) return;
    const { DEV_MNEMONIC, DEV_PASSWORD } = await import('../config/devCredentials');
    setLoading(true);
    try {
      const { Vault } = await import('../core/vault/vault');
      const vaultInstance = new Vault();
      await vaultInstance.create(DEV_PASSWORD, {
        mnemonic: DEV_MNEMONIC,
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

      const { HDWallet } = await import('../core/wallet/hdwallet');
      const { EthereumSigner } = await import('../core/chains/ethereum-signer');
      const { BitcoinSigner } = await import('../core/chains/bitcoin-signer');
      const { SolanaSigner } = await import('../core/chains/solana-signer');
      const { CosmosSigner } = await import('../core/chains/cosmos-signer');

      const wallet = HDWallet.fromMnemonic(DEV_MNEMONIC);
      const cosmosAddr = await CosmosSigner.fromWallet(wallet, 0, 'openchain').getAddress();
      setAddresses({
        ethereum: EthereumSigner.fromWallet(wallet).getAddress(),
        bitcoin: BitcoinSigner.fromWallet(wallet).getAddress(),
        solana: SolanaSigner.fromWallet(wallet).getAddress(),
        openchain: cosmosAddr,
        cosmos: cosmosAddr,
      });
      wallet.destroy();

      setHasVault(true);
      setTempVaultPassword(DEV_PASSWORD);
      setStatus('pin_setup' as any);
    } catch (err) {
      Alert.alert('Dev Quickstart Error', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Hardware wallet connection handler ───
  const handleHardwareWallet = (type: string) => {
    if (type === 'seed-vault') {
      handleUseSeedVault();
    } else {
      Alert.alert(
        `Connect ${type === 'ledger' ? 'Ledger' : type === 'trezor' ? 'Trezor' : type === 'keystone' ? 'Keystone' : 'Hardware Wallet'}`,
        type === 'ledger'
          ? 'Make sure your Ledger is unlocked and Bluetooth is enabled.\n\n1. Open the Ledger Live app on your Ledger\n2. Enable Bluetooth in Ledger settings\n3. Tap "Connect" below to pair'
          : type === 'trezor'
          ? 'Connect your Trezor via USB-C or Bluetooth.\n\n1. Unlock your Trezor device\n2. Connect via cable or enable Bluetooth\n3. Tap "Connect" below to pair'
          : type === 'keystone'
          ? 'Scan the QR code on your Keystone device.\n\n1. Navigate to the sync screen on Keystone\n2. The camera will open to scan the QR code'
          : 'Follow the instructions for your hardware wallet.',
        [
          {
            text: 'Connect',
            onPress: async () => {
              setLoading(true);
              try {
                const { getProvider } = await import('../core/hardware/hardwareKeyManager');
                const provider = getProvider(type);
                if (!provider) {
                  Alert.alert('Not Available', `${type} support requires the corresponding library. This will be fully available in the next release.\n\nFor now, you can create a new wallet or restore from a seed phrase.`);
                  return;
                }
                await provider.connect();
                if (provider.connected) {
                  const address = await provider.getAddress('ethereum', 0);
                  Alert.alert('Connected!', `${provider.name} connected.\nAddress: ${address.slice(0, 10)}...${address.slice(-6)}`);
                }
              } catch (err) {
                Alert.alert('Connection Failed', err instanceof Error ? err.message : 'Could not connect to hardware wallet. Please try again.');
              } finally {
                setLoading(false);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  // ─── Welcome ───
  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8, paddingBottom: 30 }}>
          <Text style={[styles.logo, { fontSize: 28, marginBottom: 0 }]}>OW</Text>
          <Text style={[styles.title, { fontSize: 20 }]}>Open Wallet</Text>
          <Text style={[styles.subtitle, { fontSize: 12, marginTop: 4, lineHeight: 18 }]}>
            Your money. Your control.{'\n'}
            Every token. Every chain. One app.
          </Text>

          {/* ─── Software Wallet ─── */}
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

          {/* ─── Hardware Wallets (always visible) ─── */}
          <Text style={{
            color: t.text.secondary, fontSize: 11, fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: 1.2,
            marginTop: 16, marginBottom: 8, textAlign: 'center',
          }}>
            Connect Hardware Wallet
          </Text>

          {/* Built-in Seed Vault (Seeker/Saga) */}
          {seedVaultAvailable && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: t.accent.purple, marginBottom: 6, paddingVertical: 12 }]}
              onPress={() => handleHardwareWallet('seed-vault')}
              disabled={loading}
            >
              <Text style={[styles.primaryButtonText, { fontSize: 14 }]}>Solana Seeker / Saga Seed Vault</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 }}>Built-in secure element — keys never leave hardware</Text>
            </TouchableOpacity>
          )}

          {/* Ledger */}
          <TouchableOpacity
            style={[styles.secondaryButton, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}
            onPress={() => handleHardwareWallet('ledger')}
            disabled={loading}
          >
            <View>
              <Text style={styles.secondaryButtonText}>Ledger</Text>
              <Text style={{ color: t.text.muted, fontSize: 11 }}>Nano S Plus / Nano X / Stax — via Bluetooth</Text>
            </View>
          </TouchableOpacity>

          {/* Trezor */}
          <TouchableOpacity
            style={[styles.secondaryButton, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}
            onPress={() => handleHardwareWallet('trezor')}
            disabled={loading}
          >
            <View>
              <Text style={styles.secondaryButtonText}>Trezor</Text>
              <Text style={{ color: t.text.muted, fontSize: 11 }}>Model T / Model One / Safe 3 — via USB-C</Text>
            </View>
          </TouchableOpacity>

          {/* Keystone */}
          <TouchableOpacity
            style={[styles.secondaryButton, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}
            onPress={() => handleHardwareWallet('keystone')}
            disabled={loading}
          >
            <View>
              <Text style={styles.secondaryButtonText}>Keystone</Text>
              <Text style={{ color: t.text.muted, fontSize: 11 }}>Air-gapped — via QR code scan</Text>
            </View>
          </TouchableOpacity>

          {/* Solana Saga / Seeker shown for iOS too (won't detect but explains) */}
          {!seedVaultAvailable && (
            <TouchableOpacity
              style={[styles.secondaryButton, { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }]}
              onPress={() => handleHardwareWallet('seed-vault')}
              disabled={loading}
            >
              <View>
                <Text style={[styles.secondaryButtonText, { fontSize: 14 }]}>Solana Seeker / Saga</Text>
                <Text style={{ color: t.text.muted, fontSize: 10 }}>Built-in Seed Vault — for Solana phones only</Text>
              </View>
            </TouchableOpacity>
          )}

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 16, borderColor: '#f59e0b', borderStyle: 'dashed' }]}
              onPress={handleDevQuickstart}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: '#f59e0b', fontSize: 13 }]}>⚡ Dev Quickstart</Text>
              <Text style={{ color: '#f59e0b88', fontSize: 10, marginTop: 2 }}>test seed · devpassword123 · PIN 123456</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.footer, { marginTop: 12, fontSize: 11 }]}>
            Hardware wallets keep your keys offline.
          </Text>
          <Text style={[styles.footer, { fontSize: 10, marginTop: 4 }]}>
            100% Open Source · Post-Quantum Encrypted
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Backup (show seed phrase) ───
  if (step === 'backup') {
    const words = mnemonic.split(' ');
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepTitle}>Save Your Recovery Phrase</Text>
          <Text style={styles.stepDesc}>
            Write these {words.length} words down in order. This is the ONLY way to recover your wallet. Never share it.
          </Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              IMPORTANT: Write this down on PAPER. Do NOT take a screenshot — screenshots can be leaked through cloud backups, malware, or device theft.
            </Text>
          </View>

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
              style={[styles.secondaryButton, { marginBottom: 6 }]}
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
                'To confirm you saved your seed phrase correctly, you will need to put ALL words back in the correct order from a shuffled list.\n\nThis is mandatory — it guarantees you can recover your wallet.',
                [{ text: 'Continue', onPress: startShuffleVerification }],
              );
            }}
          >
            <Text style={styles.primaryButtonText}>I've Written It Down — Verify Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => { setMnemonic(''); setStep('welcome'); }}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Verify Shuffle (put ALL words in correct order) ───
  if (step === 'verify_shuffle') {
    const originalWords = mnemonic.split(' ');
    const totalWords = originalWords.length;

    // Track which pool words are used
    const usedCounts: Record<string, number> = {};
    for (const w of selectedWords) {
      usedCounts[w] = (usedCounts[w] || 0) + 1;
    }

    const isComplete = selectedWords.length === totalWords;
    const canSubmit = isComplete && acknowledgedLoss && acknowledgedPaper;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepTitle}>Verify Recovery Phrase</Text>
          <Text style={styles.stepDesc}>
            Tap the words below in the correct order (1 through {totalWords}) to rebuild your recovery phrase.
          </Text>

          <Text style={styles.progressText}>
            {selectedWords.length} of {totalWords} words selected
          </Text>

          {/* Selected words area */}
          <View style={styles.shuffleArea}>
            {selectedWords.length === 0 ? (
              <Text style={{ color: t.text.muted, fontSize: 14 }}>Tap words below to add them in order...</Text>
            ) : (
              selectedWords.map((word, i) => (
                <TouchableOpacity
                  key={`selected-${i}`}
                  style={styles.selectedWordChip}
                  onPress={() => handleWordDeselect(i)}
                >
                  <Text style={styles.selectedWordText}>{i + 1}. {word}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Word pool (shuffled) */}
          <View style={styles.wordPool}>
            {shuffledWords.map((word, i) => {
              const totalOfThisWord = shuffledWords.filter((w) => w === word).length;
              const usedOfThisWord = usedCounts[word] || 0;
              // Count how many of this specific word (by index) before this one are the same
              const sameWordsBefore = shuffledWords.slice(0, i).filter((w) => w === word).length;
              const isUsed = sameWordsBefore < usedOfThisWord;

              return (
                <TouchableOpacity
                  key={`pool-${i}`}
                  style={[styles.poolWordChip, isUsed && styles.poolWordChipUsed]}
                  onPress={() => !isUsed && handleWordSelect(word)}
                  disabled={isUsed}
                >
                  <Text style={styles.poolWordText}>{word}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Acknowledgment checkboxes */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcknowledgedLoss(!acknowledgedLoss)}
          >
            <View style={[styles.checkbox, acknowledgedLoss && styles.checkboxChecked]}>
              {acknowledgedLoss && <Text style={styles.checkboxMark}>v</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand that losing my seed phrase means losing my funds forever. There is no recovery without it.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcknowledgedPaper(!acknowledgedPaper)}
          >
            <View style={[styles.checkbox, acknowledgedPaper && styles.checkboxChecked]}>
              {acknowledgedPaper && <Text style={styles.checkboxMark}>v</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I have written this down on paper (NOT a screenshot). I will store it in a safe, secure location.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={canSubmit ? styles.primaryButton : styles.primaryButtonDisabled}
            onPress={handleShuffleVerify}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryButtonText}>Verify Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              Alert.alert('Go Back?', 'You will need to start verification again.', [
                { text: 'Cancel' },
                { text: 'Go Back', onPress: () => setStep('backup') },
              ]);
            }}
          >
            <Text style={styles.secondaryButtonText}>Back to Seed Phrase</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Verify Spot Check (enter specific word positions) ───
  if (step === 'verify_spot_check') {
    const allAnswered = spotCheckIndices.every(
      (idx) => (spotCheckAnswers[idx] || '').trim().length > 0,
    );

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepTitle}>Final Verification</Text>
          <Text style={styles.stepDesc}>
            Almost done. Enter the specific words at these positions from your written recovery phrase.
          </Text>

          {spotCheckIndices.map((idx) => (
            <View key={idx} style={styles.spotCheckCard}>
              <Text style={styles.spotCheckLabel}>Word #{idx + 1}</Text>
              <TextInput
                style={styles.spotCheckInput}
                placeholder={`Enter word #${idx + 1}`}
                placeholderTextColor={t.text.muted}
                value={spotCheckAnswers[idx] || ''}
                onChangeText={(text) =>
                  setSpotCheckAnswers({ ...spotCheckAnswers, [idx]: text })
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}

          <TouchableOpacity
            style={allAnswered ? styles.primaryButton : styles.primaryButtonDisabled}
            onPress={handleSpotCheckVerify}
            disabled={!allAnswered}
          >
            <Text style={styles.primaryButtonText}>Complete Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('verify_shuffle')}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
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
