/**
 * Keystone Hardware Wallet Provider — Air-gapped via QR code exchange.
 *
 * Keystone is the most secure hardware wallet option because it has NO
 * electronic connection (no USB, no Bluetooth). Communication is entirely
 * through QR codes scanned by the phone camera.
 *
 * Flow:
 *   1. Keystone displays a QR code with its public keys (UR format)
 *   2. Open Wallet scans the QR code via camera
 *   3. To sign: Open Wallet shows a QR code with the unsigned transaction
 *   4. User scans that QR with Keystone's camera
 *   5. Keystone signs internally, displays signature as QR
 *   6. Open Wallet scans the signature QR
 *
 * Uses Uniform Resources (UR) encoding from @keystonehq/bc-ur-registry
 * and @keystonehq/keystone-sdk for higher-level wallet operations.
 */

import type { HardwareWalletProvider } from './hardwareKeyManager';

interface KeystoneAccount {
  chain: string;
  address: string;
  publicKey: string;
  path: string;
}

export function createKeystoneProvider(): HardwareWalletProvider {
  let connected = false;
  let accounts: KeystoneAccount[] = [];
  let pendingSignCallback: ((signature: Uint8Array) => void) | null = null;
  let pendingSignReject: ((error: Error) => void) | null = null;

  return {
    id: 'keystone',
    name: 'Keystone',
    icon: '🛡',
    type: 'external-qr',
    get connected() { return connected; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      // Keystone is always "available" — it just needs camera access
      try {
        await import('@keystonehq/keystone-sdk');
        return true;
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      // For Keystone, "connect" means the user has scanned the account QR.
      // This is triggered by the UI when the user scans the Keystone's sync QR code.
      // The actual QR scanning is done by the QRScanner component.
      // Here we just mark as ready — the accounts will be populated by parseKeystoneQR().
      connected = true;
    },

    async disconnect(): Promise<void> {
      connected = false;
      accounts = [];
    },

    async getAddress(chain: string, _accountIndex: number): Promise<string> {
      const account = accounts.find(a => a.chain === chain);
      if (account) return account.address;
      throw new Error(`No ${chain} address from Keystone. Please re-sync by scanning the account QR code.`);
    },

    async signTransaction(_chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      // The signing flow for Keystone is:
      // 1. Encode the unsigned tx as a UR QR code
      // 2. Display it on screen for the user to scan with Keystone
      // 3. Wait for the user to scan the signed result back
      //
      // This requires UI coordination (showing/scanning QR codes).
      // The provider returns a Promise that resolves when the signature QR is scanned.

      return new Promise<Uint8Array>((resolve, reject) => {
        pendingSignCallback = resolve;
        pendingSignReject = reject;

        // Timeout after 5 minutes (user needs time to scan)
        setTimeout(() => {
          if (pendingSignReject) {
            pendingSignReject(new Error('Keystone signing timed out. Please try again.'));
            pendingSignCallback = null;
            pendingSignReject = null;
          }
        }, 300000);
      });
    },
  };
}

/**
 * Parse a Keystone sync QR code (UR format) to extract accounts.
 * Called by the QR scanner when a Keystone sync code is detected.
 */
export async function parseKeystoneAccountQR(urData: string): Promise<KeystoneAccount[]> {
  try {
    const { KeystoneSDK } = await import('@keystonehq/keystone-sdk');
    const sdk = new KeystoneSDK();

    // Parse the UR-encoded account data
    const accounts: KeystoneAccount[] = [];

    // Keystone uses crypto-multi-accounts UR type
    const parsed = sdk.parseMultiAccounts(urData);

    if (parsed.keys) {
      for (const key of parsed.keys) {
        const chain = detectChainFromPath(key.path ?? '');
        accounts.push({
          chain,
          address: key.address ?? '',
          publicKey: key.publicKey ?? '',
          path: key.path ?? '',
        });
      }
    }

    return accounts;
  } catch (err) {
    throw new Error(`Failed to parse Keystone QR: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Encode an unsigned transaction as a UR QR code for Keystone to scan.
 * Returns the UR-encoded string to display as a QR code.
 */
export async function encodeTransactionForKeystone(
  chain: string,
  unsignedTx: Uint8Array,
  path: string,
): Promise<string> {
  const { CryptoKeypath, PathComponent } = await import('@keystonehq/bc-ur-registry');

  if (chain === 'ethereum') {
    const { EthSignRequest, DataType } = await import('@keystonehq/bc-ur-registry');
    const uuid = crypto.getRandomValues(new Uint8Array(16));
    const request = EthSignRequest.constructETHRequest(
      Buffer.from(unsignedTx),
      DataType.transaction,
      path,
      undefined, // xfp
      Buffer.from(uuid),
      1, // chainId
    );
    return request.toUREncoder(400).nextPart();
  }

  // Generic fallback — encode as raw bytes
  return Buffer.from(unsignedTx).toString('base64');
}

/**
 * Parse a signed transaction QR from Keystone.
 * Returns the signature bytes.
 */
export async function parseKeystoneSignatureQR(urData: string): Promise<Uint8Array> {
  try {
    const { ETHSignature } = await import('@keystonehq/bc-ur-registry');
    const sig = ETHSignature.fromCBOR(Buffer.from(urData, 'hex'));
    return new Uint8Array(sig.getSignature());
  } catch {
    // Try raw base64 decode as fallback
    return Uint8Array.from(atob(urData), c => c.charCodeAt(0));
  }
}

function detectChainFromPath(path: string): string {
  if (path.includes("44'/0'") || path.includes("84'/0'") || path.includes("49'/0'")) return 'bitcoin';
  if (path.includes("44'/60'")) return 'ethereum';
  if (path.includes("44'/501'")) return 'solana';
  if (path.includes("44'/118'")) return 'cosmos';
  return 'unknown';
}
