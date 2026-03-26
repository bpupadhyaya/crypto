/**
 * Backup Screen — View seed phrase + delete wallet.
 * Requires re-authentication before showing sensitive data.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type BackupStep = 'auth' | 'show' | 'verify';

interface Props {
  onClose: () => void;
}

export const BackupScreen = React.memo(({ onClose }: Props) => {
  const [step, setStep] = useState<BackupStep>('auth');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);
  const { setStatus, setHasVault } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { padding: 24 },
    title: { color: t.text.primary, fontSize: 24, fontWeight: '800', marginBottom: 12 },
    warning: { color: t.accent.red, fontSize: 14, lineHeight: 20, marginBottom: 24, backgroundColor: t.accent.red + '10', padding: 16, borderRadius: 12 },
    wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
    wordItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.bg.card, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, width: '30%' },
    wordNumber: { color: t.text.muted, fontSize: 12, marginRight: 6, width: 20 },
    wordText: { color: t.text.primary, fontSize: 14, fontWeight: '500' },
    doneBtn: { backgroundColor: t.accent.green, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    doneBtnText: { color: t.bg.primary, fontSize: 17, fontWeight: '700' },
    deleteBtn: { backgroundColor: t.accent.red + '20', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    deleteText: { color: t.accent.red, fontSize: 16, fontWeight: '700' },
    cancelBtn: { paddingVertical: 20, alignItems: 'center' },
    cancelText: { color: t.accent.blue, fontSize: 16 },
  }), [t]);

  const handlePinAuth = useCallback(async (pin: string) => {
    try {
      const valid = await authManager.verifyPin(pin);
      if (!valid) { setPinError('Wrong PIN'); return; }
      setPinError(null);

      // Get vault password from PIN, unlock vault to get mnemonic
      const vaultPassword = await authManager.getVaultPassword(pin);
      if (vaultPassword) {
        const { Vault } = await import('../core/vault/vault');
        const vault = new Vault();
        const contents = await vault.unlock(vaultPassword);
        setMnemonic(contents.mnemonic.split(' '));
        setStep('show');
      } else {
        Alert.alert('Error', 'Could not retrieve wallet data. Try with password.');
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Auth failed');
    }
  }, []);

  const handleDeleteWallet = useCallback(() => {
    Alert.alert(
      'Delete Wallet',
      'This will permanently delete your wallet from this device. You can only recover it with your 24-word seed phrase.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Final Confirmation', 'Type DELETE to confirm', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const SecureStore = await import('expo-secure-store');
                    await SecureStore.deleteItemAsync('open_wallet_vault');
                    await SecureStore.deleteItemAsync('open_wallet_pin_hash');
                    await SecureStore.deleteItemAsync('open_wallet_pin_salt');
                    await SecureStore.deleteItemAsync('open_wallet_enc_password');
                    await SecureStore.deleteItemAsync('open_wallet_biometric_enabled');
                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                    await AsyncStorage.removeItem('ow-store');
                  } catch {}
                  setHasVault(false);
                  setStatus('onboarding');
                },
              },
            ]);
          },
        },
      ]
    );
  }, [setHasVault, setStatus]);

  // ─── PIN Auth ───
  if (step === 'auth') {
    return (
      <SafeAreaView style={s.container}>
        <PinPad
          title="Verify Identity"
          subtitle="Enter PIN to view recovery phrase"
          onComplete={handlePinAuth}
          error={pinError}
        />
        <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Show Seed Phrase ───
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Recovery Phrase</Text>
        <Text style={s.warning}>
          Never share these words. Anyone with this phrase can steal your funds.
          Write them down and store in a safe place.
        </Text>

        <View style={s.wordGrid}>
          {mnemonic.map((word, i) => (
            <View key={i} style={s.wordItem}>
              <Text style={s.wordNumber}>{i + 1}</Text>
              <Text style={s.wordText}>{word}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteWallet}>
          <Text style={s.deleteText}>Delete Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
});
