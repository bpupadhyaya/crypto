/**
 * PIN Setup Screen — Shown after wallet creation.
 * Sets up 6-digit PIN + offers biometric enrollment.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';

type SetupStep = 'create' | 'confirm' | 'biometric';

export function PinSetupScreen() {
  const [step, setStep] = useState<SetupStep>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setStatus, setBiometricEnabled, tempVaultPassword, setTempVaultPassword } = useWalletStore();

  const handlePinCreate = (pin: string) => {
    setFirstPin(pin);
    setError(null);
    setStep('confirm');
  };

  const handlePinConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setError('PINs do not match. Try again.');
      setStep('create');
      setFirstPin('');
      return;
    }

    // UNLOCK IMMEDIATELY — PIN setup completes in background
    setError(null);
    setStatus('unlocked');

    // Store PIN hash + encrypted password in background (non-blocking)
    const pw = tempVaultPassword;
    setTempVaultPassword(null);
    authManager.setupPin(pin, pw ?? undefined).catch(() => {});
  };

  const handleEnableBiometric = async () => {
    try {
      const success = await authManager.enableBiometric();
      if (success) {
        setBiometricEnabled(true);
      }
    } catch {
      // User declined — that's fine
    }
    setStatus('unlocked');
  };

  const handleSkipBiometric = () => {
    setStatus('unlocked');
  };

  if (step === 'biometric') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.biometricContent}>
          <Text style={styles.biometricIcon}>🔐</Text>
          <Text style={styles.biometricTitle}>Enable Quick Unlock</Text>
          <Text style={styles.biometricDesc}>
            Use Face ID or fingerprint to unlock your wallet instantly.
            Your PIN remains as a backup.
          </Text>

          <TouchableOpacity style={styles.enableButton} onPress={handleEnableBiometric}>
            <Text style={styles.enableButtonText}>Enable Biometric Unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipBiometric}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PinPad
        title={step === 'create' ? 'Set Your PIN' : 'Confirm PIN'}
        subtitle={step === 'create' ? 'Choose a 6-digit PIN for quick unlock' : 'Enter the same PIN again'}
        onComplete={step === 'create' ? handlePinCreate : handlePinConfirm}
        error={error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  biometricContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  biometricIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  biometricTitle: {
    color: '#f0f0f5',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  biometricDesc: {
    color: '#a0a0b0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  enableButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#0a0a0f',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 18,
    marginTop: 8,
  },
  skipButtonText: {
    color: '#606070',
    fontSize: 16,
  },
});
