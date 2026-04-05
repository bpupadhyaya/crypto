/**
 * Trezor Hardware Wallet Provider — USB-C connection for Model T / Safe 3 / Model One.
 *
 * Uses @trezor/connect for communication. On mobile, Trezor Connect works
 * via a WebView bridge that handles the USB communication through the
 * Trezor Bridge service or direct WebUSB.
 *
 * Note: Trezor support on React Native is limited compared to desktop.
 * Full support requires either:
 *   1. Trezor Bridge running on a companion device
 *   2. WebUSB (Chrome-based WebView)
 *   3. USB OTG with native Android USB module
 *
 * Flow:
 *   1. Detect Trezor via USB
 *   2. Initialize TrezorConnect with manifest
 *   3. Get address via getAddress() — shows on Trezor screen for confirmation
 *   4. Sign via signTransaction() — shows details on Trezor screen
 */

import type { HardwareWalletProvider } from './hardwareKeyManager';

// BIP-44 paths for Trezor
const TREZOR_PATHS: Record<string, string> = {
  bitcoin: "m/84'/0'/0'/0/0",     // Native segwit (Trezor default)
  ethereum: "m/44'/60'/0'/0/0",
  solana: "m/44'/501'/0'/0'",
  cosmos: "m/44'/118'/0'/0/0",
};

let trezorConnect: any = null;
let initialized = false;

async function ensureTrezorConnect(): Promise<any> {
  if (trezorConnect && initialized) return trezorConnect;

  try {
    // Use variable-based require to prevent Metro from resolving at bundle time
    const moduleName = '@trezor/' + 'connect';
    try {
      trezorConnect = require(moduleName);
    } catch {
      throw new Error('Trezor Connect not installed. Install: npm install @trezor/connect');
    }

    const TC = trezorConnect.default ?? trezorConnect;

    await TC.init({
      manifest: {
        email: 'support@equalinformation.com',
        appUrl: 'https://openwallet.app',
      },
      connectSrc: 'https://connect.trezor.io/9/',
      lazyLoad: true,
    });

    initialized = true;
    return TC;
  } catch (err) {
    throw new Error(`Trezor Connect not available. Install: npm install @trezor/connect\n\n${err instanceof Error ? err.message : ''}`);
  }
}

export function createTrezorProvider(): HardwareWalletProvider {
  let connected = false;
  let cachedAddresses: Record<string, string> = {};

  return {
    id: 'trezor',
    name: 'Trezor',
    icon: '🔐',
    type: 'external-usb',
    get connected() { return connected; },
    supportedChains: ['bitcoin', 'ethereum'],

    async detect(): Promise<boolean> {
      try {
        await ensureTrezorConnect();
        return true;
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      const TC = await ensureTrezorConnect();

      // Test connection by requesting the first ETH address
      const result = await TC.ethereumGetAddress({
        path: TREZOR_PATHS.ethereum,
        showOnTrezor: false,
      });

      if (!result.success) {
        throw new Error(result.payload?.error ?? 'Failed to connect to Trezor. Make sure it is unlocked and connected via USB-C.');
      }

      cachedAddresses.ethereum = result.payload.address;
      connected = true;
    },

    async disconnect(): Promise<void> {
      connected = false;
      cachedAddresses = {};
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      const TC = await ensureTrezorConnect();
      const basePath = TREZOR_PATHS[chain];
      if (!basePath) throw new Error(`Trezor: chain ${chain} not supported`);

      // Replace account index in path
      const path = basePath.replace(/0'\/0\/0$/, `${accountIndex}'/0/0`);

      if (chain === 'ethereum') {
        const result = await TC.ethereumGetAddress({
          path,
          showOnTrezor: true, // User confirms on device
        });
        if (!result.success) throw new Error(result.payload?.error ?? 'Failed to get address');
        cachedAddresses.ethereum = result.payload.address;
        return result.payload.address;
      }

      if (chain === 'bitcoin') {
        const result = await TC.getAddress({
          path,
          coin: 'btc',
          showOnTrezor: true,
        });
        if (!result.success) throw new Error(result.payload?.error ?? 'Failed to get address');
        cachedAddresses.bitcoin = result.payload.address;
        return result.payload.address;
      }

      throw new Error(`Trezor: getAddress for ${chain} not implemented. Trezor supports Bitcoin and Ethereum.`);
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      const TC = await ensureTrezorConnect();

      if (chain === 'ethereum') {
        // Parse the unsigned transaction
        const txHex = Buffer.from(unsignedTx).toString('hex');
        const result = await TC.ethereumSignTransaction({
          path: TREZOR_PATHS.ethereum,
          transaction: {
            to: '', // Will be parsed from tx data
            value: '0x0',
            data: `0x${txHex}`,
            chainId: 1,
            nonce: '0x0',
            gasLimit: '0x5208',
            maxFeePerGas: '0x0',
            maxPriorityFeePerGas: '0x0',
          },
        });

        if (!result.success) {
          throw new Error(result.payload?.error ?? 'Trezor signing failed or was cancelled');
        }

        const r = Buffer.from(result.payload.r.replace('0x', ''), 'hex');
        const s = Buffer.from(result.payload.s.replace('0x', ''), 'hex');
        const v = Buffer.from([parseInt(result.payload.v, 16)]);
        return new Uint8Array([...r, ...s, ...v]);
      }

      if (chain === 'bitcoin') {
        // Bitcoin signing requires PSBT — simplified here
        const result = await TC.signTransaction({
          coin: 'btc',
          inputs: [],  // Would need to be populated with UTXOs
          outputs: [], // Would need to be populated with destinations
        });

        if (!result.success) {
          throw new Error(result.payload?.error ?? 'Trezor Bitcoin signing failed');
        }

        return new Uint8Array(Buffer.from(result.payload.serializedTx, 'hex'));
      }

      throw new Error(`Trezor: signing for ${chain} not supported. Use Bitcoin or Ethereum.`);
    },
  };
}
