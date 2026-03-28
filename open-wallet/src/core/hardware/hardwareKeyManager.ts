/**
 * Hardware Key Manager — Support for external and built-in hardware key storage.
 *
 * External: Ledger (BLE), Trezor (USB/BLE), Keystone (QR)
 * Built-in: Solana Saga/Seeker (seed vault), Samsung Knox, Google Titan M, Apple Secure Enclave
 */

import { Platform } from 'react-native';

// ─── Types ───

export interface HardwareKeyProvider {
  id: string;
  name: string;
  type: 'external' | 'builtin';
  connected: boolean;
  supportsChains: string[];
}

export interface BuiltinKeyInfo {
  available: boolean;
  provider: 'solana-saga' | 'solana-seeker' | 'samsung-knox' | 'google-titan' | 'apple-se' | 'none';
  hasExistingSeedPhrase: boolean;
  supportedChains: string[];
}

// ─── External Device Registry ───

const EXTERNAL_PROVIDERS: Omit<HardwareKeyProvider, 'connected'>[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    type: 'external',
    supportsChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  },
  {
    id: 'trezor',
    name: 'Trezor',
    type: 'external',
    supportsChains: ['bitcoin', 'ethereum', 'solana'],
  },
  {
    id: 'keystone',
    name: 'Keystone',
    type: 'external',
    supportsChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  },
];

// ─── Built-in Key Detection ───

/**
 * Detect if the phone has a built-in hardware key (secure element with seed phrase).
 * Checks for: Solana Saga/Seeker seed vault, Samsung Knox, Google Titan M, Apple Secure Enclave.
 */
export async function detectBuiltinKey(): Promise<BuiltinKeyInfo> {
  const noKey: BuiltinKeyInfo = {
    available: false,
    provider: 'none',
    hasExistingSeedPhrase: false,
    supportedChains: [],
  };

  try {
    if (Platform.OS === 'ios') {
      // Apple Secure Enclave — available on all modern iPhones
      // Real implementation would use expo-secure-store or react-native-keychain
      // to check for Secure Enclave capabilities
      return {
        available: true,
        provider: 'apple-se',
        hasExistingSeedPhrase: false,
        supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
      };
    }

    if (Platform.OS === 'android') {
      // Check for Solana Saga / Seeker seed vault
      // Real implementation would use @solana-mobile/seed-vault-lib
      try {
        // Attempt to detect Saga/Seeker seed vault API
        const isSolanaDevice = await detectSolanaSeedVault();
        if (isSolanaDevice) {
          return {
            available: true,
            provider: 'solana-seeker',
            hasExistingSeedPhrase: true,
            supportedChains: ['solana', 'ethereum', 'bitcoin'],
          };
        }
      } catch {
        // Not a Solana device, continue checking
      }

      // Check for Samsung Knox
      try {
        const isKnox = await detectSamsungKnox();
        if (isKnox) {
          return {
            available: true,
            provider: 'samsung-knox',
            hasExistingSeedPhrase: false,
            supportedChains: ['bitcoin', 'ethereum', 'solana'],
          };
        }
      } catch {
        // Not Samsung Knox
      }

      // Check for Google Titan M chip
      try {
        const hasTitan = await detectGoogleTitan();
        if (hasTitan) {
          return {
            available: true,
            provider: 'google-titan',
            hasExistingSeedPhrase: false,
            supportedChains: ['bitcoin', 'ethereum', 'solana'],
          };
        }
      } catch {
        // No Titan M
      }
    }

    return noKey;
  } catch {
    return noKey;
  }
}

/**
 * Get all available hardware key providers (external + built-in).
 */
export async function getHardwareProviders(): Promise<HardwareKeyProvider[]> {
  const providers: HardwareKeyProvider[] = [];

  // Add external providers (not connected by default)
  for (const ext of EXTERNAL_PROVIDERS) {
    providers.push({ ...ext, connected: false });
  }

  // Detect built-in key
  const builtin = await detectBuiltinKey();
  if (builtin.available && builtin.provider !== 'none') {
    const providerNames: Record<string, string> = {
      'solana-saga': 'Solana Saga Seed Vault',
      'solana-seeker': 'Solana Seeker Seed Vault',
      'samsung-knox': 'Samsung Knox Secure Element',
      'google-titan': 'Google Titan M Chip',
      'apple-se': 'Apple Secure Enclave',
    };

    providers.push({
      id: builtin.provider,
      name: providerNames[builtin.provider] || builtin.provider,
      type: 'builtin',
      connected: true, // built-in is always "connected"
      supportsChains: builtin.supportedChains,
    });
  }

  return providers;
}

/**
 * Sign a transaction using a hardware key (external or builtin).
 * @param provider Provider ID (e.g., 'ledger', 'trezor', 'apple-se', 'solana-seeker')
 * @param txBytes Raw transaction bytes to sign
 * @param derivationPath HD derivation path (e.g., "m/44'/60'/0'/0/0")
 * @returns Signature bytes
 */
export async function signWithHardwareKey(
  provider: string,
  txBytes: Uint8Array,
  derivationPath: string,
): Promise<Uint8Array> {
  switch (provider) {
    case 'ledger':
      return signWithLedger(txBytes, derivationPath);
    case 'trezor':
      return signWithTrezor(txBytes, derivationPath);
    case 'keystone':
      return signWithKeystone(txBytes, derivationPath);
    case 'solana-saga':
    case 'solana-seeker':
      return signWithSolanaSeedVault(txBytes, derivationPath);
    case 'samsung-knox':
      return signWithKnox(txBytes, derivationPath);
    case 'google-titan':
      return signWithTitan(txBytes, derivationPath);
    case 'apple-se':
      return signWithSecureEnclave(txBytes, derivationPath);
    default:
      throw new Error(`Unknown hardware provider: ${provider}`);
  }
}

/**
 * Get an address from a hardware key for a specific chain.
 * @param provider Provider ID
 * @param chain Chain name (e.g., 'ethereum', 'bitcoin', 'solana')
 * @returns Address string
 */
export async function getHardwareAddress(provider: string, chain: string): Promise<string> {
  const derivationPaths: Record<string, string> = {
    bitcoin: "m/44'/0'/0'/0/0",
    ethereum: "m/44'/60'/0'/0/0",
    solana: "m/44'/501'/0'/0'",
    cosmos: "m/44'/118'/0'/0/0",
  };

  const path = derivationPaths[chain];
  if (!path) throw new Error(`Unsupported chain: ${chain}`);

  // In a real implementation, this would communicate with the hardware device
  // to derive the public key and compute the address without exposing the private key
  switch (provider) {
    case 'ledger':
      return getLedgerAddress(chain, path);
    case 'trezor':
      return getTrezorAddress(chain, path);
    case 'solana-saga':
    case 'solana-seeker':
      return getSolanaSeedVaultAddress(chain, path);
    case 'apple-se':
      return getSecureEnclaveAddress(chain, path);
    case 'samsung-knox':
    case 'google-titan':
      return getGenericHWAddress(provider, chain, path);
    default:
      throw new Error(`Unknown hardware provider: ${provider}`);
  }
}

/**
 * Import wallet addresses from the phone's built-in seed phrase.
 * @param provider Built-in provider ID
 * @returns Map of chain name to address
 */
export async function importFromBuiltinKey(
  provider: string,
): Promise<{ addresses: Record<string, string> }> {
  const chains = ['bitcoin', 'ethereum', 'solana', 'cosmos'];
  const addresses: Record<string, string> = {};

  for (const chain of chains) {
    try {
      addresses[chain] = await getHardwareAddress(provider, chain);
    } catch {
      // Chain not supported by this provider
    }
  }

  return { addresses };
}

// ─── Internal: Detection helpers ───
// These are stubs — real implementations require native modules

async function detectSolanaSeedVault(): Promise<boolean> {
  // Real: check for @solana-mobile/seed-vault-lib availability
  // Would call SeedVault.isAvailable()
  return false;
}

async function detectSamsungKnox(): Promise<boolean> {
  // Real: check for Samsung Knox SDK
  return false;
}

async function detectGoogleTitan(): Promise<boolean> {
  // Real: check for StrongBox Keymaster (Titan M)
  // KeyProperties.SECURITY_LEVEL_STRONGBOX
  return false;
}

// ─── Internal: Signing helpers (stubs) ───

async function signWithLedger(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  // Real: use @ledgerhq/hw-app-eth, @ledgerhq/hw-app-btc, etc.
  // Transport via BLE: @ledgerhq/react-native-hw-transport-ble
  throw new Error('Ledger signing requires native BLE connection. Connect device first.');
}

async function signWithTrezor(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  // Real: use @trezor/connect-mobile
  throw new Error('Trezor signing requires native USB/BLE connection. Connect device first.');
}

async function signWithKeystone(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  // Real: encode tx as QR, scan signed QR response
  throw new Error('Keystone signing requires QR code exchange. Use camera to scan.');
}

async function signWithSolanaSeedVault(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  // Real: use @solana-mobile/seed-vault-lib
  // SeedVault.signTransaction(authToken, txBytes)
  throw new Error('Solana Seed Vault signing requires Saga/Seeker device.');
}

async function signWithKnox(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  throw new Error('Samsung Knox signing requires Knox SDK integration.');
}

async function signWithTitan(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  throw new Error('Google Titan signing requires StrongBox Keymaster integration.');
}

async function signWithSecureEnclave(txBytes: Uint8Array, _path: string): Promise<Uint8Array> {
  // Real: use expo-secure-store or react-native-keychain with Secure Enclave
  throw new Error('Apple Secure Enclave signing requires native keychain integration.');
}

// ─── Internal: Address derivation helpers (stubs) ───

async function getLedgerAddress(_chain: string, _path: string): Promise<string> {
  throw new Error('Ledger address derivation requires connected device.');
}

async function getTrezorAddress(_chain: string, _path: string): Promise<string> {
  throw new Error('Trezor address derivation requires connected device.');
}

async function getSolanaSeedVaultAddress(_chain: string, _path: string): Promise<string> {
  throw new Error('Seed Vault address requires Saga/Seeker device.');
}

async function getSecureEnclaveAddress(_chain: string, _path: string): Promise<string> {
  throw new Error('Secure Enclave address requires native keychain integration.');
}

async function getGenericHWAddress(_provider: string, _chain: string, _path: string): Promise<string> {
  throw new Error('Hardware address derivation requires native integration.');
}

// ─── Demo Mode Helpers ───

/**
 * Get simulated hardware providers for demo mode.
 */
export function getDemoHardwareProviders(): HardwareKeyProvider[] {
  return [
    ...EXTERNAL_PROVIDERS.map((p) => ({ ...p, connected: false })),
    {
      id: 'demo-builtin',
      name: 'Phone Secure Element (Simulated)',
      type: 'builtin' as const,
      connected: true,
      supportsChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
    },
  ];
}

/**
 * Get simulated built-in key info for demo mode.
 */
export function getDemoBuiltinKey(): BuiltinKeyInfo {
  return {
    available: true,
    provider: Platform.OS === 'ios' ? 'apple-se' : 'solana-seeker',
    hasExistingSeedPhrase: true,
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  };
}

/**
 * Get a demo address for a chain.
 */
export function getDemoHardwareAddress(chain: string): string {
  const demoAddresses: Record<string, string> = {
    bitcoin: 'bc1qhw_demo_hardware_key_btc_address',
    ethereum: '0xHW_DEMO_1234567890abcdef1234567890abcdef',
    solana: 'HWDemoKey111111111111111111111111111111111',
    cosmos: 'cosmos1hwdemo1234567890abcdefghijklmnop',
  };
  return demoAddresses[chain] || `${chain}_hw_demo_address`;
}
