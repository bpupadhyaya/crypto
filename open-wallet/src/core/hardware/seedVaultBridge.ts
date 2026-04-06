/**
 * Solana Seed Vault Bridge — Direct integration with Seeker/Saga Seed Vault.
 *
 * Uses @solana-mobile/seed-vault-lib which talks directly to the Seed Vault
 * system service via Android content provider. This has NOTHING to do with
 * MWA / Phantom / any other wallet app. It accesses the hardware secure
 * element on the phone itself.
 *
 * Flow:
 *   1. Check availability: SeedVault.isSeedVaultAvailable()
 *   2. Request permission: ACCESS_SEED_VAULT
 *   3. Authorize: SeedVault.authorizeNewSeed() — shows Seed Vault system UI
 *   4. Get public key: SeedVault.getPublicKey(authToken, derivationPath)
 *   5. Sign: SeedVault.signTransaction(authToken, derivationPath, tx)
 *
 * Private key NEVER leaves the hardware secure element.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { PublicKey } from '@solana/web3.js';

// ─── Types ───

export interface SeedVaultInfo {
  available: boolean;
  model: 'seeker' | 'saga' | 'unknown';
  apiVersion: number;
  hasAuthorizedSeed: boolean;
}

export interface SeedVaultAccount {
  publicKey: string;
  derivationPath: string;
  chain: string;
}

// Seed Vault uses BIP derivation URI format, NOT raw BIP-44 path.
// Format: bip44:<coin_type>'/<account>'/<change>'
const SOLANA_DERIVATION_PATH = "bip44:501'/0'/0'";
const SEED_VAULT_PERMISSION = 'com.solanamobile.seedvault.ACCESS_SEED_VAULT';

// ─── Lazy-load the native module ───
// Compiled into the Android build via auto-linking when running `expo run:android`.

function getSeedVaultNative() {
  const { SeedVault } = require('@solana-mobile/seed-vault-lib');
  return SeedVault;
}

// ─── Permission ───

async function ensurePermission(): Promise<void> {
  const already = await PermissionsAndroid.check(SEED_VAULT_PERMISSION as any);
  if (already) return;

  const result = await PermissionsAndroid.request(SEED_VAULT_PERMISSION as any, {
    title: 'Seed Vault Access',
    message: 'Open Wallet needs permission to access the Seed Vault secure element to read your public key.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Seed Vault permission denied. Please grant access in App Settings.');
  }
}

// ─── Helpers ───

function decodeBase64PublicKey(b64: string): string {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new PublicKey(bytes).toBase58();
}

function keyResultToBase58(keyResult: any): string {
  if (keyResult.publicKey instanceof Uint8Array) {
    return new PublicKey(keyResult.publicKey).toBase58();
  }
  return decodeBase64PublicKey(keyResult.publicKeyEncoded as string);
}

// ─── Detection ───

export async function detectSeedVault(): Promise<SeedVaultInfo> {
  if (Platform.OS !== 'android') {
    return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
  }

  try {
    const SeedVault = getSeedVaultNative();
    const available = await SeedVault.isSeedVaultAvailable(false);
    if (!available) {
      return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
    }

    const constants = (Platform as any).constants || {};
    const model = (constants.Model || constants.model || '').toLowerCase();
    const brand = (constants.Brand || constants.brand || '').toLowerCase();
    const detectedModel: 'seeker' | 'saga' | 'unknown' =
      model.includes('seeker') || brand.includes('solanamobile') ? 'seeker' :
      model.includes('saga') || brand.includes('osom') ? 'saga' : 'unknown';

    const seeds = await SeedVault.getAuthorizedSeeds().catch(() => []);

    return {
      available: true,
      model: detectedModel,
      apiVersion: detectedModel === 'seeker' ? 2 : 1,
      hasAuthorizedSeed: seeds.length > 0,
    };
  } catch {
    return { available: false, model: 'unknown', apiVersion: 0, hasAuthorizedSeed: false };
  }
}

// ─── Authorization ───

export async function authorizeSeedVault(): Promise<boolean> {
  try {
    await connectSeedVault();
    return true;
  } catch {
    return false;
  }
}

// ─── Key Retrieval ───

export async function getSeedVaultPublicKey(accountIndex: number = 0): Promise<string | null> {
  try {
    const SeedVault = getSeedVaultNative();
    await ensurePermission();

    let authToken: number;
    const seeds = await SeedVault.getAuthorizedSeeds();
    if (seeds.length > 0) {
      authToken = seeds[0].authToken;
    } else {
      const result = await SeedVault.authorizeNewSeed();
      authToken = result.authToken;
    }

    const path = `m/44'/501'/${accountIndex}'/0'`;
    const keyResult = await SeedVault.getPublicKey(authToken, path);
    return keyResultToBase58(keyResult);
  } catch (err) {
    console.log('[SeedVault] getPublicKey failed:', err);
    return null;
  }
}

export async function getSeedVaultAccounts(): Promise<SeedVaultAccount[]> {
  const pubkey = await getSeedVaultPublicKey(0);
  if (!pubkey) return [];
  return [{ publicKey: pubkey, derivationPath: SOLANA_DERIVATION_PATH, chain: 'solana' }];
}

// ─── Signing ───

export async function signWithSeedVault(transactionBytes: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const SeedVault = getSeedVaultNative();
    await ensurePermission();

    const seeds = await SeedVault.getAuthorizedSeeds();
    if (seeds.length === 0) throw new Error('No authorized seed. Call connectSeedVault() first.');

    const result = await SeedVault.signTransaction(
      seeds[0].authToken,
      SOLANA_DERIVATION_PATH,
      transactionBytes,
    );
    return result.signatures[0] ?? null;
  } catch {
    return null;
  }
}

export async function signMessageWithSeedVault(message: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const SeedVault = getSeedVaultNative();
    await ensurePermission();

    const seeds = await SeedVault.getAuthorizedSeeds();
    if (seeds.length === 0) throw new Error('No authorized seed.');

    const msgBase64 = btoa(unescape(encodeURIComponent(message)));
    const result = await SeedVault.signMessage(
      seeds[0].authToken,
      SOLANA_DERIVATION_PATH,
      msgBase64,
    );
    return result.signatures[0] ?? null;
  } catch {
    return null;
  }
}

// ─── High-level Connect ───

/**
 * Full Seed Vault connection flow:
 * 1. Check Seed Vault is available on this device
 * 2. Request ACCESS_SEED_VAULT permission
 * 3. Authorize (shows Seed Vault SYSTEM UI — nothing to do with Phantom or MWA)
 * 4. Derive Solana public key from the hardware secure element
 */
export async function connectSeedVault(): Promise<{
  success: boolean;
  addresses: Record<string, string>;
  model: string;
  message: string;
}> {
  if (Platform.OS !== 'android') {
    return { success: false, addresses: {}, model: 'unknown', message: 'Seed Vault is only available on Android.' };
  }

  const SeedVault = getSeedVaultNative();

  // Step 1: Availability
  const available = await SeedVault.isSeedVaultAvailable(false);
  if (!available) {
    return {
      success: false, addresses: {}, model: 'unknown',
      message: 'Seed Vault is not available on this device. It is built into Solana Seeker and Saga phones.',
    };
  }

  // Step 2: Permission
  await ensurePermission();

  // Step 3: Authorize — shows Seed Vault SYSTEM UI (phone's own UI, not any wallet app)
  let authToken: number;
  const existing = await SeedVault.getAuthorizedSeeds();
  if (existing.length > 0) {
    authToken = existing[0].authToken;
  } else {
    // Try authorizeNewSeed first (creates new seed), fall back to createNewSeed
    try {
      const result = await SeedVault.authorizeNewSeed();
      authToken = result.authToken;
    } catch {
      const result = await SeedVault.createNewSeed();
      authToken = result.authToken;
    }
  }

  // Step 4: Get public key
  // Each app has its own isolated account space in Seed Vault.
  // We use resolveDerivationPathForPurpose to let the Seed Vault
  // resolve and create the Solana account for our app.
  let pubkey: string;

  try {
    // Use purpose=0 (SignSolanaTransaction) to resolve the Solana derivation path.
    // This is the correct Seed Vault API — it creates the account if needed.
    const resolvedPath = await SeedVault.resolveDerivationPathForPurpose(
      SOLANA_DERIVATION_PATH,
      0, // SeedPurpose.SignSolanaTransaction
    );

    const keyResult = await SeedVault.getPublicKey(authToken, resolvedPath);
    pubkey = keyResultToBase58(keyResult);
  } catch (e1: any) {
    // Fallback: try getPublicKeys (plural) which may auto-create
    try {
      const keyResults = await SeedVault.getPublicKeys(authToken, [SOLANA_DERIVATION_PATH]);
      if (keyResults.length > 0) {
        pubkey = keyResultToBase58(keyResults[0]);
      } else {
        throw new Error('empty result');
      }
    } catch (e2: any) {
      // Last fallback: try with purpose-resolved path using raw URI format
      try {
        // The Seed Vault URI format: "bip44:501'/0'/0'"
        // Some versions need just the coin path after bip44:
        const altPaths = [
          "bip44:501'/0'/0'",
          "bip44:501'",
          "m/44'/501'/0'/0'",
        ];
        let found = false;
        for (const path of altPaths) {
          try {
            const resolved = await SeedVault.resolveDerivationPathForPurpose(path, 0);
            const keyResult = await SeedVault.getPublicKey(authToken, resolved);
            pubkey = keyResultToBase58(keyResult);
            found = true;
            break;
          } catch { /* try next */ }
        }
        if (!found) throw new Error('all paths failed');
      } catch (e3: any) {
        return {
          success: false, addresses: {}, model: 'unknown',
          message: `Seed Vault connected but could not derive a Solana key.\n\nError: ${e1?.message ?? 'unknown'}\n\nThis may be a Seed Vault API version issue. Please try:\n1. Open Seed Vault in device Settings\n2. Check that a seed exists\n3. Try again`,
        };
      }
    }
  }

  const constants = (Platform as any).constants || {};
  const model = (constants.Model || '').toLowerCase();
  const brand = (constants.Brand || '').toLowerCase();
  const deviceName =
    model.includes('seeker') || brand.includes('solanamobile') ? 'Solana Seeker' :
    model.includes('saga') || brand.includes('osom') ? 'Solana Saga' : 'Seed Vault device';
  const detectedModel =
    model.includes('seeker') ? 'seeker' :
    model.includes('saga') ? 'saga' : 'unknown';

  return {
    success: true,
    addresses: { solana: pubkey },
    model: detectedModel,
    message: `Connected to ${deviceName} Seed Vault.\n\nSolana address: ${pubkey.slice(0, 8)}...${pubkey.slice(-6)}\n\nAll transactions are signed inside the secure element. Your private key never leaves the hardware.`,
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
