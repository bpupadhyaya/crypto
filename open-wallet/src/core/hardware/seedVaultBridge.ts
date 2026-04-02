/**
 * Solana Seed Vault Bridge — Direct integration with Seeker/Saga Seed Vault.
 *
 * The Solana Seeker and Saga phones have a hardware secure element that stores
 * seed phrases. The Seed Vault is accessed via the Mobile Wallet Adapter (MWA)
 * protocol — a standard WebSocket-based protocol the Seed Vault implements.
 *
 * This bridge provides:
 *   1. Detection: Is Seed Vault available on this device?
 *   2. Authorization: Request user approval to use the Seed Vault via MWA
 *   3. Key derivation: Get public keys for Solana (and other chains via BIP44)
 *   4. Signing: Sign transactions inside the secure element
 *
 * The private key NEVER leaves the hardware. All signing happens on-device
 * in the secure element. Only signed transactions and public keys are returned.
 *
 * MWA protocol: transact() opens a local WebSocket to the Seed Vault wallet
 * service on the device. No native module required.
 */

import { Platform, NativeModules } from 'react-native';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { PublicKey } from '@solana/web3.js';

// ─── Types ───

export interface SeedVaultInfo {
  available: boolean;
  model: 'seeker' | 'saga' | 'unknown';
  apiVersion: number;
  hasAuthorizedSeed: boolean;
}

export interface SeedVaultAccount {
  publicKey: string; // base58 Solana public key
  derivationPath: string; // e.g., "m/44'/501'/0'/0'"
  chain: string; // 'solana'
}

// ─── Detection ───

/**
 * Check if this device has a Seed Vault (Solana Seeker or Saga).
 * Returns info about the Seed Vault, or { available: false } on other devices.
 */
export async function detectSeedVault(): Promise<SeedVaultInfo> {
  if (Platform.OS !== 'android') {
    return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
  }

  try {
    let deviceModel = '';
    let deviceBrand = '';
    let deviceManufacturer = '';

    // Path 1: Platform.constants (modern RN)
    try {
      const constants = (Platform as any).constants || {};
      deviceModel = (constants.Model || constants.model || '').toLowerCase();
      deviceBrand = (constants.Brand || constants.brand || '').toLowerCase();
      deviceManufacturer = (constants.Manufacturer || constants.manufacturer || '').toLowerCase();
    } catch { /* ignore */ }

    // Path 2: NativeModules.PlatformConstants (older RN)
    if (!deviceModel && !deviceBrand) {
      try {
        const pc = NativeModules.PlatformConstants;
        if (pc) {
          const pcConstants = pc.getConstants ? pc.getConstants() : pc;
          deviceModel = (pcConstants?.Model || pcConstants?.model || '').toLowerCase();
          deviceBrand = (pcConstants?.Brand || pcConstants?.brand || '').toLowerCase();
          deviceManufacturer = (pcConstants?.Manufacturer || pcConstants?.manufacturer || '').toLowerCase();
        }
      } catch { /* ignore */ }
    }

    // Path 3: Direct NativeModules access
    if (!deviceModel && !deviceBrand) {
      try {
        const modules = NativeModules as any;
        for (const key of ['PlatformConstants', 'DeviceInfo', 'RNDeviceInfo', 'AndroidConstants']) {
          if (modules[key]) {
            const info = modules[key].getConstants ? modules[key].getConstants() : modules[key];
            if (info?.Model || info?.model || info?.Brand || info?.brand) {
              deviceModel = (info.Model || info.model || '').toLowerCase();
              deviceBrand = (info.Brand || info.brand || '').toLowerCase();
              deviceManufacturer = (info.Manufacturer || info.manufacturer || '').toLowerCase();
              break;
            }
          }
        }
      } catch { /* ignore */ }
    }

    console.log(`[SeedVault] Device detection: model="${deviceModel}" brand="${deviceBrand}" manufacturer="${deviceManufacturer}"`);

    const isSeeker = deviceModel.includes('seeker') ||
                     deviceBrand.includes('solanamobile') ||
                     deviceBrand.includes('solana mobile') ||
                     deviceManufacturer.includes('solana');

    const isSaga = deviceModel.includes('saga') ||
                   deviceBrand.includes('osom') ||
                   deviceManufacturer.includes('osom');

    if (!isSeeker && !isSaga) {
      return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
    }

    const detectedModel = isSeeker ? 'seeker' : 'saga';
    return {
      available: true,
      model: detectedModel,
      apiVersion: isSeeker ? 2 : 1,
      hasAuthorizedSeed: false,
    };
  } catch {
    return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
  }
}

// ─── MWA Authorization + Key Retrieval ───

/**
 * Decode an MWA account to a base58 Solana public key.
 * MWA v2 WalletAccount has publicKey: Uint8Array directly.
 * MWA v1 legacy Account has address: base64-encoded 32 raw bytes.
 * Uses atob() — always available in React Native, no Buffer polyfill needed.
 */
function mwaAccountToBase58(account: any): string {
  // WalletAccount (MWA v2) — publicKey Uint8Array available directly
  if (account.publicKey instanceof Uint8Array) {
    return new PublicKey(account.publicKey).toBase58();
  }

  const b64: string = account.address;

  // If it looks like a base58 address already (32–44 chars, no base64-only chars)
  if (b64.length >= 32 && b64.length <= 44 && !/[^1-9A-HJ-NP-Za-km-z]/.test(b64)) {
    return b64;
  }

  // Decode base64 or base64url → Uint8Array using atob (no Buffer required)
  // Normalize base64url to standard base64 first (MWA may use URL-safe encoding)
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new PublicKey(bytes).toBase58();
}

/**
 * Connect to the Seed Vault via Mobile Wallet Adapter.
 * Opens the Seed Vault authorization UI, then returns the Solana public key.
 * The private key NEVER leaves the hardware secure element.
 * Throws with a descriptive message on failure — callers should catch and show to user.
 */
export async function authorizeSeedVaultMWA(): Promise<{ publicKey: string; authToken: string }> {
  if (Platform.OS !== 'android') {
    throw new Error('Seed Vault is only available on Android (Solana Seeker / Saga).');
  }

  return transact(async (wallet) => {
    const authResult = await wallet.authorize({
      cluster: 'mainnet-beta',
      identity: {
        name: 'Open Wallet',
        uri: 'https://openwallet.app',
        icon: 'favicon.ico',
      },
    });

    if (!authResult.accounts || authResult.accounts.length === 0) {
      throw new Error('Seed Vault returned no accounts. Make sure the Seed Vault has been initialized in phone Settings.');
    }

    const pubkey = mwaAccountToBase58(authResult.accounts[0]);
    console.log('[SeedVault] MWA authorized, pubkey:', pubkey);

    return { publicKey: pubkey, authToken: authResult.auth_token };
  });
}

/**
 * Sign a transaction using the Seed Vault via MWA.
 * The transaction is signed inside the secure element — private key never leaves hardware.
 *
 * @param authToken - token from a previous authorize() call
 * @param transactionBytes - base64 encoded transaction to sign
 * @returns base64 encoded signed transaction, or null if failed
 */
export async function signWithSeedVaultMWA(
  authToken: string,
  transactionBytes: string,
): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const result = await transact(async (wallet) => {
      // Reauthorize with existing token
      await wallet.reauthorize({
        auth_token: authToken,
        identity: {
          name: 'Open Wallet',
          uri: 'https://openwallet.app',
          icon: 'favicon.ico',
        },
      });

      const txBytes = Buffer.from(transactionBytes, 'base64');
      const signed = await wallet.signTransactions({
        payloads: [txBytes.toString('base64')],
      });

      return signed.signed_payloads[0] ?? null;
    });

    return result ?? null;
  } catch (err) {
    console.log('[SeedVault] MWA sign failed:', err);
    return null;
  }
}

// ─── Legacy helpers (kept for backward compat) ───

export async function authorizeSeedVault(): Promise<boolean> {
  try {
    const result = await authorizeSeedVaultMWA();
    return !!result.publicKey;
  } catch {
    return false;
  }
}

export async function getSeedVaultPublicKey(_accountIndex: number = 0): Promise<string | null> {
  try {
    const result = await authorizeSeedVaultMWA();
    return result.publicKey;
  } catch {
    return null;
  }
}

export async function signWithSeedVault(transactionBytes: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    return await transact(async (wallet) => {
      await wallet.authorize({
        cluster: 'mainnet-beta',
        identity: { name: 'Open Wallet', uri: 'https://openwallet.app', icon: 'favicon.ico' },
      });
      const signed = await wallet.signTransactions({ payloads: [transactionBytes] });
      return signed.signed_payloads[0] ?? null;
    });
  } catch {
    return null;
  }
}

export async function signMessageWithSeedVault(message: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    // Encode message to base64 using btoa (no Buffer required)
    const msgBase64 = btoa(unescape(encodeURIComponent(message)));
    return await transact(async (wallet) => {
      const authResult = await wallet.authorize({
        cluster: 'mainnet-beta',
        identity: { name: 'Open Wallet', uri: 'https://openwallet.app', icon: 'favicon.ico' },
      });
      const signed = await wallet.signMessages({
        addresses: [authResult.accounts[0].address],
        payloads: [msgBase64],
      });
      return signed.signed_payloads[0] ?? null;
    });
  } catch {
    return null;
  }
}

export async function getSeedVaultAccounts(): Promise<SeedVaultAccount[]> {
  const pubkey = await getSeedVaultPublicKey(0);
  if (!pubkey) return [];
  return [{
    publicKey: pubkey,
    derivationPath: "m/44'/501'/0'/0'",
    chain: 'solana',
  }];
}

// ─── High-level: Connect and Import ───

/**
 * Full Seed Vault connection flow via MWA:
 * 1. Detect if device is Seeker/Saga
 * 2. Open MWA authorization (shows Seed Vault UI)
 * 3. Return the Solana public key
 */
export async function connectSeedVault(): Promise<{
  success: boolean;
  addresses: Record<string, string>;
  model: string;
  message: string;
}> {
  const info = await detectSeedVault();

  try {
    const mwaResult = await authorizeSeedVaultMWA();
    return {
      success: true,
      addresses: { solana: mwaResult.publicKey },
      model: info.model,
      message: `Connected to ${info.model === 'seeker' ? 'Solana Seeker' : 'Solana Saga'} Seed Vault.\n\nYour Solana address: ${mwaResult.publicKey.slice(0, 8)}...${mwaResult.publicKey.slice(-6)}\n\nAll transactions will be signed inside the phone's secure element. Your private key never leaves the hardware.`,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      addresses: {},
      model: info.model,
      message: errMsg,
    };
  }
}

// ─── Export ───

export const SeedVault = {
  detect: detectSeedVault,
  authorize: authorizeSeedVault,
  authorizeMWA: authorizeSeedVaultMWA,
  getPublicKey: getSeedVaultPublicKey,
  getAccounts: getSeedVaultAccounts,
  signTransaction: signWithSeedVault,
  signTransactionMWA: signWithSeedVaultMWA,
  signMessage: signMessageWithSeedVault,
  connect: connectSeedVault,
};

export default SeedVault;
