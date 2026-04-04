import { fonts } from '../utils/theme';
/**
 * PIN Setup Screen — Shown after wallet creation.
 * Sets up 6-digit PIN + auto-enables biometric if available.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { PinPad } from '../components/PinPad';
import { authManager } from '../core/auth/auth';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type SetupStep = 'create' | 'confirm';

export function PinSetupScreen() {
  const [step, setStep] = useState<SetupStep>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setStatus, setBiometricEnabled, tempVaultPassword, setTempVaultPassword } = useWalletStore();
  const t = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
  }), [t]);

  /** Enable biometric if hardware supports it — no re-prompt needed since vault password was stored in keychain during PIN setup. */
  const autoEnableBiometric = async () => {
    try {
      const enabled = await authManager.enableBiometric();
      if (enabled) setBiometricEnabled(true);
    } catch {
      // Not critical — user can still unlock with PIN
    }
  };

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

    setError(null);
    setStatus('unlocked');

    // Store PIN + enable biometric in background
    const pw = tempVaultPassword;
    setTempVaultPassword(null);
    authManager.setupPin(pin, pw ?? undefined).then(() => autoEnableBiometric()).catch(() => {});
  };

  const handleDevAutoPin = async () => {
    const { DEV_PIN } = await import('../config/devCredentials');
    const pw = tempVaultPassword;
    setTempVaultPassword(null);
    authManager.setupPin(DEV_PIN, pw ?? undefined).then(() => autoEnableBiometric()).catch(() => {});
    setStatus('unlocked');
  };

  return (
    <SafeAreaView style={styles.container}>
      <PinPad
        key={step}
        title={step === 'create' ? 'Set Your PIN' : 'Confirm PIN'}
        subtitle={step === 'create' ? 'Choose a 6-digit PIN for quick unlock' : 'Enter the same PIN again'}
        onComplete={step === 'create' ? handlePinCreate : handlePinConfirm}
        error={error}
      />
      {(
        <TouchableOpacity
          onPress={handleDevAutoPin}
          style={{ alignItems: 'center', paddingVertical: 12, paddingBottom: 24 }}
        >
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: fonts.semibold }}>⚡ Dev: Set PIN 123456 & Continue</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
