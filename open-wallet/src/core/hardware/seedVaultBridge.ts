/**
 * Solana Seed Vault Bridge — Direct integration with Seeker/Saga Seed Vault.
 *
 * The Solana Seeker and Saga phones have a hardware secure element that stores
 * seed phrases. The Seed Vault API is accessed via Android Intents / native modules.
 *
 * This bridge provides:
 *   1. Detection: Is Seed Vault available on this device?
 *   2. Authorization: Request user approval to use the Seed Vault
 *   3. Key derivation: Get public keys for Solana (and other chains via BIP44)
 *   4. Signing: Sign transactions inside the secure element
 *
 * The private key NEVER leaves the hardware. All signing happens on-device
 * in the secure element. Only signed transactions and public keys are returned.
 *
 * For React Native, we use NativeModules to communicate with the Android side.
 * On non-Solana phones, all methods gracefully return false/null.
 */

import { Platform, NativeModules } from 'react-native';

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
    // React Native on Android provides Platform.constants with device info
    // Fields: Model (string), Brand (string), Manufacturer (string)
    // On Seeker: Model="Seeker", Brand="solanamobile", Manufacturer="Solana Mobile Inc."
    // On Saga: Model="Saga", Brand="OSOM", Manufacturer="OSOM Products Inc."

    // Access constants - try multiple paths since RN versions differ
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
        // Some RN versions put it under different names
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

    // Log for debugging (visible in Metro console)
    console.log(`[SeedVault] Device detection: model="${deviceModel}" brand="${deviceBrand}" manufacturer="${deviceManufacturer}"`);

    // Detect Seeker: model="seeker", brand="solanamobile", manufacturer="solana mobile inc."
    const isSeeker = deviceModel.includes('seeker') ||
                     deviceBrand.includes('solanamobile') ||
                     deviceBrand.includes('solana mobile') ||
                     deviceManufacturer.includes('solana');

    // Detect Saga: model="saga", brand="osom", manufacturer="osom"
    const isSaga = deviceModel.includes('saga') ||
                   deviceBrand.includes('osom') ||
                   deviceManufacturer.includes('osom');

    if (!isSeeker && !isSaga) {
      // Method 3: Check if Seed Vault app/service exists on the device
      // Some Solana phones might not match model strings but still have Seed Vault
      try {
        const SeedVaultModule = NativeModules.SeedVaultModule;
        if (SeedVaultModule) {
          return {
            available: true,
            model: 'unknown',
            apiVersion: 1,
            hasAuthorizedSeed: false,
          };
        }
      } catch { /* no seed vault module */ }

      return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
    }

    // Device is Seeker or Saga — Seed Vault is available
    const detectedModel = isSeeker ? 'seeker' : 'saga';

    // Try to access Seed Vault native module for more info
    try {
      const SeedVaultModule = NativeModules.SeedVaultModule;
      if (SeedVaultModule?.getInfo) {
        const info = await SeedVaultModule.getInfo();
        return {
          available: true,
          model: detectedModel as 'seeker' | 'saga',
          apiVersion: info?.apiVersion || (isSeeker ? 2 : 1),
          hasAuthorizedSeed: info?.hasAuthorizedSeed || false,
        };
      }
    } catch { /* native module not available yet, but device is still Seeker/Saga */ }

    return {
      available: true,
      model: detectedModel as 'seeker' | 'saga',
      apiVersion: isSeeker ? 2 : 1,
      hasAuthorizedSeed: false,
    };
  } catch {
    return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
  }
}

// ─── Authorization ───

/**
 * Request user authorization to use the Seed Vault.
 * This opens the system Seed Vault prompt where the user approves access.
 * Returns true if authorized, false if denied or unavailable.
 */
export async function authorizeSeedVault(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const SeedVaultModule = NativeModules.SeedVaultModule;
    if (SeedVaultModule?.authorize) {
      const result = await SeedVaultModule.authorize();
      return result === true;
    }

    // Fallback: use Android Intent to request Seed Vault authorization
    const { Linking } = await import('react-native');
    // The Seed Vault app on Seeker/Saga responds to this intent
    const canOpen = await Linking.canOpenURL('solana-seed-vault://authorize');
    if (canOpen) {
      await Linking.openURL('solana-seed-vault://authorize');
      return true; // User will be prompted by Seed Vault app
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Key Derivation ───

/**
 * Get the Solana public key from the Seed Vault.
 * The private key stays in the secure element — only the public key is returned.
 *
 * @param accountIndex - BIP44 account index (default 0)
 * @returns Solana public key in base58, or null if not available
 */
export async function getSeedVaultPublicKey(accountIndex: number = 0): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const SeedVaultModule = NativeModules.SeedVaultModule;
    if (SeedVaultModule?.getPublicKey) {
      const pubkey = await SeedVaultModule.getPublicKey(accountIndex);
      return pubkey;
    }

    // If native module not available, try via wallet standard
    return null;
  } catch {
    return null;
  }
}

/**
 * Get all accounts from the Seed Vault (Solana addresses).
 */
export async function getSeedVaultAccounts(): Promise<SeedVaultAccount[]> {
  const pubkey = await getSeedVaultPublicKey(0);
  if (!pubkey) return [];

  return [{
    publicKey: pubkey,
    derivationPath: "m/44'/501'/0'/0'",
    chain: 'solana',
  }];
}

// ─── Signing ───

/**
 * Sign a transaction using the Seed Vault.
 * The transaction bytes are sent to the secure element, signed there,
 * and only the signature is returned. Private key never leaves hardware.
 *
 * @param transactionBytes - base64 encoded transaction to sign
 * @returns base64 encoded signed transaction, or null if failed
 */
export async function signWithSeedVault(transactionBytes: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const SeedVaultModule = NativeModules.SeedVaultModule;
    if (SeedVaultModule?.signTransaction) {
      const signed = await SeedVaultModule.signTransaction(transactionBytes);
      return signed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign a message (not transaction) using the Seed Vault.
 * Used for authentication, proof-of-ownership, etc.
 */
export async function signMessageWithSeedVault(message: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  try {
    const SeedVaultModule = NativeModules.SeedVaultModule;
    if (SeedVaultModule?.signMessage) {
      return await SeedVaultModule.signMessage(message);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── High-level: Connect and Import ───

/**
 * Full Seed Vault connection flow:
 * 1. Detect if Seed Vault is available
 * 2. Request authorization
 * 3. Get public key
 * 4. Return addresses for the wallet
 *
 * This is the main function called from OnboardingScreen.
 */
export async function connectSeedVault(): Promise<{
  success: boolean;
  addresses: Record<string, string>;
  model: string;
  message: string;
}> {
  // Step 1: Detect
  const info = await detectSeedVault();
  if (!info.available) {
    return {
      success: false,
      addresses: {},
      model: 'unknown',
      message: 'This device does not have a Seed Vault. The Seed Vault is available on Solana Seeker and Solana Saga phones.',
    };
  }

  // Step 2: Authorize
  const authorized = await authorizeSeedVault();
  if (!authorized) {
    return {
      success: false,
      addresses: {},
      model: info.model,
      message: 'Seed Vault authorization was not granted. Please try again and approve the Seed Vault prompt.',
    };
  }

  // Step 3: Get public key
  const pubkey = await getSeedVaultPublicKey(0);
  if (!pubkey) {
    return {
      success: false,
      addresses: {},
      model: info.model,
      message: 'Could not retrieve your Solana address from the Seed Vault. Please ensure the Seed Vault has been initialized in your phone settings.',
    };
  }

  // Step 4: Return addresses
  // Seed Vault primarily gives us Solana addresses
  // Other chain addresses would need separate derivation
  return {
    success: true,
    addresses: {
      solana: pubkey,
    },
    model: info.model,
    message: `Connected to ${info.model === 'seeker' ? 'Solana Seeker' : 'Solana Saga'} Seed Vault.\n\nYour Solana address: ${pubkey.slice(0, 8)}...${pubkey.slice(-6)}\n\nAll transactions will be signed inside the phone's secure element. Your private key never leaves the hardware.`,
  };
}

// ─── Export ───

export const SeedVault = {
  detect: detectSeedVault,
  authorize: authorizeSeedVault,
  getPublicKey: getSeedVaultPublicKey,
  getAccounts: getSeedVaultAccounts,
  signTransaction: signWithSeedVault,
  signMessage: signMessageWithSeedVault,
  connect: connectSeedVault,
};

export default SeedVault;
