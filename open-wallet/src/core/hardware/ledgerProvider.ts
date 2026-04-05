/**
 * Ledger Hardware Wallet Provider — BLE connection for Nano S Plus / Nano X / Stax.
 *
 * Uses @ledgerhq/react-native-hw-transport-ble for Bluetooth Low Energy communication.
 * Each chain has its own Ledger app (@ledgerhq/hw-app-eth, hw-app-btc, hw-app-solana).
 *
 * All imports use variable-based require() to prevent Metro from resolving
 * at bundle time when packages aren't installed.
 */

import type { HardwareWalletProvider } from './hardwareKeyManager';

const LEDGER_PATHS: Record<string, string> = {
  bitcoin: "44'/0'/0'/0/0",
  ethereum: "44'/60'/0'/0/0",
  solana: "44'/501'/0'",
  cosmos: "44'/118'/0'/0/0",
};

// Prevent Metro static resolution
function loadModule(name: string): any {
  try { return require(name); }
  catch { throw new Error(`${name} not installed. Install: npm install ${name}`); }
}

export function createLedgerProvider(): HardwareWalletProvider {
  let transport: any = null;
  let connected = false;

  const getTransportBLE = () => loadModule('@ledgerhq/react-native-hw-transport-ble' + '').default;

  return {
    id: 'ledger',
    name: 'Ledger',
    icon: '🔒',
    type: 'external-ble',
    get connected() { return connected; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      try {
        const TransportBLE = getTransportBLE();
        return new Promise((resolve) => {
          const sub = TransportBLE.observeState({
            next: (e: any) => { resolve(e.type === 'PoweredOn'); sub.unsubscribe(); },
            error: () => resolve(false),
            complete: () => {},
          });
          setTimeout(() => { sub.unsubscribe(); resolve(false); }, 3000);
        });
      } catch { return false; }
    },

    async connect(): Promise<void> {
      const TransportBLE = getTransportBLE();
      const devices: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const sub = TransportBLE.listen({
          next: (e: any) => { if (e.type === 'add') { devices.push(e.descriptor); sub.unsubscribe(); resolve(); } },
          error: (err: Error) => { sub.unsubscribe(); reject(err); },
          complete: () => {},
        });
        setTimeout(() => { sub.unsubscribe(); reject(new Error('No Ledger device found. Make sure Bluetooth is enabled and your Ledger is unlocked.')); }, 15000);
      });
      if (devices.length === 0) throw new Error('No Ledger device found.');
      transport = await TransportBLE.open(devices[0]);
      connected = true;
    },

    async disconnect(): Promise<void> {
      if (transport) { await transport.close(); transport = null; }
      connected = false;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!transport) throw new Error('Ledger not connected');
      const path = LEDGER_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);
      const fullPath = path.replace(/0'\/0\/0$|0'$/, `${accountIndex}'/0/0`);

      if (chain === 'ethereum') {
        const Eth = loadModule('@ledgerhq/hw-app-eth' + '').default;
        return (await new Eth(transport).getAddress(fullPath)).address;
      }
      if (chain === 'bitcoin') {
        const Btc = loadModule('@ledgerhq/hw-app-btc' + '').default;
        return (await new Btc({ transport }).getWalletPublicKey(fullPath, { format: 'bech32' })).bitcoinAddress;
      }
      if (chain === 'solana') {
        const Solana = loadModule('@ledgerhq/hw-app-solana' + '').default;
        return (await new Solana(transport).getAddress(fullPath)).address.toString();
      }
      throw new Error(`Ledger: chain ${chain} not supported`);
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!transport) throw new Error('Ledger not connected');
      const path = LEDGER_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);

      if (chain === 'ethereum') {
        const Eth = loadModule('@ledgerhq/hw-app-eth' + '').default;
        const result = await new Eth(transport).signTransaction(path, Buffer.from(unsignedTx).toString('hex'));
        const r = Buffer.from(result.r, 'hex');
        const s = Buffer.from(result.s, 'hex');
        const v = Buffer.from([parseInt(result.v, 16)]);
        return new Uint8Array([...r, ...s, ...v]);
      }
      if (chain === 'bitcoin') {
        const Btc = loadModule('@ledgerhq/hw-app-btc' + '').default;
        const result = await new Btc({ transport }).signMessage(path, Buffer.from(unsignedTx).toString('hex'));
        return new Uint8Array(Buffer.from(result.r + result.s, 'hex'));
      }
      if (chain === 'solana') {
        const Solana = loadModule('@ledgerhq/hw-app-solana' + '').default;
        const result = await new Solana(transport).signTransaction(path, Buffer.from(unsignedTx));
        return new Uint8Array(result.signature);
      }
      throw new Error(`Ledger signing: chain ${chain} not supported`);
    },
  };
}
