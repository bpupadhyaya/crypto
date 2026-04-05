/**
 * Ledger Hardware Wallet Provider — BLE connection for Nano S Plus / Nano X / Stax.
 *
 * Uses @ledgerhq/react-native-hw-transport-ble for Bluetooth Low Energy communication.
 * Each chain has its own Ledger app (@ledgerhq/hw-app-eth, hw-app-btc, hw-app-solana).
 *
 * Flow:
 *   1. Scan for BLE devices
 *   2. User selects their Ledger
 *   3. Connect via BLE transport
 *   4. Open the correct app on Ledger (e.g., Ethereum app)
 *   5. Derive address / sign transaction
 */

import type { HardwareWalletProvider } from './hardwareKeyManager';

// BIP-44 derivation paths for Ledger
const LEDGER_PATHS: Record<string, string> = {
  bitcoin: "44'/0'/0'/0/0",
  ethereum: "44'/60'/0'/0/0",
  solana: "44'/501'/0'",
  cosmos: "44'/118'/0'/0/0",
};

export function createLedgerProvider(): HardwareWalletProvider {
  let transport: any = null;
  let connected = false;
  let deviceId: string | null = null;

  return {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔒',
    type: 'external-ble',
    get connected() { return connected; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      try {
        const TransportBLE = (await import('@ledgerhq/react-native-hw-transport-ble')).default;
        // Check if BLE is available
        return new Promise((resolve) => {
          const sub = TransportBLE.observeState({
            next: (e: any) => {
              resolve(e.type === 'PoweredOn');
              sub.unsubscribe();
            },
            error: () => resolve(false),
            complete: () => {},
          });
          setTimeout(() => { sub.unsubscribe(); resolve(false); }, 3000);
        });
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      const TransportBLE = (await import('@ledgerhq/react-native-hw-transport-ble')).default;

      // Scan for devices
      const devices: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const sub = TransportBLE.listen({
          next: (e: any) => {
            if (e.type === 'add') {
              devices.push(e.descriptor);
              // Auto-connect to first device found
              sub.unsubscribe();
              resolve();
            }
          },
          error: (err: Error) => { sub.unsubscribe(); reject(err); },
          complete: () => {},
        });
        // Timeout after 15 seconds
        setTimeout(() => { sub.unsubscribe(); reject(new Error('No Ledger device found. Make sure Bluetooth is enabled and your Ledger is unlocked.')); }, 15000);
      });

      if (devices.length === 0) {
        throw new Error('No Ledger device found.');
      }

      // Connect to first device
      transport = await TransportBLE.open(devices[0]);
      deviceId = devices[0].id ?? devices[0].name ?? 'ledger';
      connected = true;
    },

    async disconnect(): Promise<void> {
      if (transport) {
        await transport.close();
        transport = null;
      }
      connected = false;
      deviceId = null;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!transport) throw new Error('Ledger not connected');
      const path = LEDGER_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);

      // Replace account index in path
      const fullPath = path.replace(/0'\/0\/0$|0'$/, `${accountIndex}'/0/0`);

      if (chain === 'ethereum') {
        const Eth = (await import('@ledgerhq/hw-app-eth')).default;
        const eth = new Eth(transport);
        const result = await eth.getAddress(fullPath);
        return result.address;
      }

      if (chain === 'bitcoin') {
        const Btc = (await import('@ledgerhq/hw-app-btc')).default;
        const btc = new Btc({ transport });
        const result = await btc.getWalletPublicKey(fullPath, { format: 'bech32' });
        return result.bitcoinAddress;
      }

      if (chain === 'solana') {
        const Solana = (await import('@ledgerhq/hw-app-solana')).default;
        const sol = new Solana(transport);
        const result = await sol.getAddress(fullPath);
        return result.address.toString();
      }

      throw new Error(`Ledger: chain ${chain} not yet supported`);
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!transport) throw new Error('Ledger not connected');
      const path = LEDGER_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);

      if (chain === 'ethereum') {
        const Eth = (await import('@ledgerhq/hw-app-eth')).default;
        const eth = new Eth(transport);
        const txHex = Buffer.from(unsignedTx).toString('hex');
        const result = await eth.signTransaction(path, txHex);
        // Combine r, s, v into signature bytes
        const r = Buffer.from(result.r, 'hex');
        const s = Buffer.from(result.s, 'hex');
        const v = Buffer.from([parseInt(result.v, 16)]);
        return new Uint8Array([...r, ...s, ...v]);
      }

      if (chain === 'bitcoin') {
        const Btc = (await import('@ledgerhq/hw-app-btc')).default;
        const btc = new Btc({ transport });
        // Bitcoin signing requires PSBT format — return raw signature
        const txHex = Buffer.from(unsignedTx).toString('hex');
        const result = await btc.signMessage(path, txHex);
        return new Uint8Array(Buffer.from(result.r + result.s, 'hex'));
      }

      if (chain === 'solana') {
        const Solana = (await import('@ledgerhq/hw-app-solana')).default;
        const sol = new Solana(transport);
        const result = await sol.signTransaction(path, Buffer.from(unsignedTx));
        return new Uint8Array(result.signature);
      }

      throw new Error(`Ledger signing: chain ${chain} not supported`);
    },
  };
}
