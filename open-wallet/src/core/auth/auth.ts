/**
 * Authentication Manager — PIN, Biometric, Password.
 *
 * Security model:
 *   1. Password → creates vault (first time only, or recovery)
 *   2. PIN (6-digit) → quick unlock, stored encrypted in secure store
 *   3. Biometric → fastest unlock, wraps PIN behind Face ID / fingerprint
 *
 * Flow:
 *   App launch → try biometric → success? unlock
 *                              → fail? show PIN pad
 *                                       → fail 3x? require full password
 *
 * Sensitive actions (send, view seed) → re-verify with biometric or PIN
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { sha256 } from '@noble/hashes/sha2.js';

const PIN_HASH_KEY = 'open_wallet_pin_hash';
const PIN_SALT_KEY = 'open_wallet_pin_salt';
const BIOMETRIC_ENABLED_KEY = 'open_wallet_biometric_enabled';
const FAILED_ATTEMPTS_KEY = 'open_wallet_failed_attempts';
const LOCK_UNTIL_KEY = 'open_wallet_lock_until';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000; // 30 seconds after max attempts

export type AuthMethod = 'biometric' | 'pin' | 'password';

export interface AuthResult {
  success: boolean;
  method: AuthMethod;
  error?: string;
}

export class AuthManager {
  // ─── PIN Management ───

  /**
   * Set up a 6-digit PIN. Called after first password-based vault creation.
   * PIN is hashed with SHA-256 + salt before storage — never stored in plaintext.
   */
  async setupPin(pin: string): Promise<void> {
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const saltHex = toHex(salt);

    const hash = sha256(new TextEncoder().encode(pin + saltHex));
    const hashHex = toHex(hash);

    await SecureStore.setItemAsync(PIN_HASH_KEY, hashHex);
    await SecureStore.setItemAsync(PIN_SALT_KEY, saltHex);
    await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, '0');
  }

  /**
   * Verify a PIN attempt.
   */
  async verifyPin(pin: string): Promise<boolean> {
    // Check lockout
    const lockUntil = await SecureStore.getItemAsync(LOCK_UNTIL_KEY);
    if (lockUntil && Date.now() < parseInt(lockUntil, 10)) {
      const remaining = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 1000);
      throw new Error(`Too many attempts. Try again in ${remaining} seconds.`);
    }

    const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    const storedSalt = await SecureStore.getItemAsync(PIN_SALT_KEY);

    if (!storedHash || !storedSalt) {
      throw new Error('No PIN configured');
    }

    const hash = sha256(new TextEncoder().encode(pin + storedSalt));
    const hashHex = toHex(hash);

    if (hashHex === storedHash) {
      // Success — reset failed attempts
      await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, '0');
      return true;
    }

    // Failed — increment attempts
    const attempts = parseInt(await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY) ?? '0', 10) + 1;
    await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_PIN_ATTEMPTS) {
      await SecureStore.setItemAsync(LOCK_UNTIL_KEY, (Date.now() + LOCKOUT_DURATION_MS).toString());
      throw new Error('Too many failed attempts. Locked for 30 seconds.');
    }

    return false;
  }

  async isPinConfigured(): Promise<boolean> {
    const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
    return hash !== null;
  }

  async changePin(currentPin: string, newPin: string): Promise<void> {
    const valid = await this.verifyPin(currentPin);
    if (!valid) throw new Error('Current PIN is incorrect');
    await this.setupPin(newPin);
  }

  // ─── Biometric Management ───

  /**
   * Check if biometric hardware is available and enrolled.
   */
  async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType: string;
  }> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { available: false, biometryType: 'none' };

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return { available: false, biometryType: 'none' };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let biometryType = 'biometric';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'Fingerprint';
    }

    return { available: true, biometryType };
  }

  /**
   * Enable biometric unlock. Stores a flag — actual biometric prompt
   * happens at unlock time via the OS.
   */
  async enableBiometric(): Promise<boolean> {
    const { available } = await this.isBiometricAvailable();
    if (!available) return false;

    // Verify biometric works by prompting
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric unlock for Open Wallet',
      fallbackLabel: 'Cancel',
    });

    if (!result.success) return false;

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  }

  async disableBiometric(): Promise<void> {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Authenticate with biometric (Face ID / fingerprint).
   */
  async authenticateWithBiometric(reason?: string): Promise<AuthResult> {
    const enabled = await this.isBiometricEnabled();
    if (!enabled) {
      return { success: false, method: 'biometric', error: 'Biometric not enabled' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason ?? 'Unlock Open Wallet',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });

    return {
      success: result.success,
      method: 'biometric',
      error: result.success ? undefined : 'Biometric authentication failed',
    };
  }

  // ─── Unified Auth Flow ───

  /**
   * Attempt the best available authentication method.
   * Order: Biometric → PIN → Password
   */
  async getBestAuthMethod(): Promise<AuthMethod> {
    const biometricEnabled = await this.isBiometricEnabled();
    if (biometricEnabled) return 'biometric';

    const pinConfigured = await this.isPinConfigured();
    if (pinConfigured) return 'pin';

    return 'password';
  }

  /**
   * Re-authenticate for sensitive actions (send crypto, view seed phrase).
   * Uses biometric if available, falls back to PIN.
   */
  async reAuthenticate(reason: string): Promise<AuthResult> {
    // Try biometric first
    const biometricEnabled = await this.isBiometricEnabled();
    if (biometricEnabled) {
      const result = await this.authenticateWithBiometric(reason);
      if (result.success) return result;
      // Biometric failed — fall through to PIN
    }

    // PIN fallback — caller should show PIN pad
    return {
      success: false,
      method: 'pin',
      error: 'Please enter your PIN',
    };
  }

  /**
   * Get remaining failed attempts before lockout.
   */
  async getRemainingAttempts(): Promise<number> {
    const attempts = parseInt(await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY) ?? '0', 10);
    return Math.max(0, MAX_PIN_ATTEMPTS - attempts);
  }
}

// Singleton
export const authManager = new AuthManager();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
