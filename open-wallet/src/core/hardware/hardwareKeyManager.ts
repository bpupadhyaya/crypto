/**
 * Hardware Key Manager — Pre-bundled native hardware wallet integration.
 *
 * SECURITY: No WebView for signing, no external code execution, no runtime downloads.
 * All signing logic ships with the app. Native modules loaded via try/catch at runtime.
 *
 * THREE CATEGORIES of hardware security:
 *
 * 1. EXTERNAL HARDWARE WALLETS (connect to phone)
 *    - Ledger Nano X / Stax / Flex — BLE (Bluetooth)
 *    - Trezor Model T / Safe 3 / Safe 5 — USB-C (OTG cable)
 *    - Keystone 3 Pro — QR code (air-gapped, camera)
 *
 * 2. PHONE COLD STORAGE (true cold storage — seed never leaves hardware)
 *    - Solana Saga — Seed Vault API
 *    - Solana Seeker — Seed Vault API
 *
 * 3. PHONE SECURITY ENHANCEMENT (protects app-generated keys, NOT a seed vault)
 *    - Samsung Knox Vault (S21+) — hardware-backed key storage
 *    - Apple Secure Enclave — biometric-protected vault
 *    - Google Titan M — secure boot + key attestation
 */

import { Platform } from 'react-native';
import { detectSeedVault } from './seedVaultBridge';

// ─── Types ───

export type HardwareWalletType =
  | 'external-ble'
  | 'external-usb'
  | 'external-qr'
  | 'phone-cold-storage'
  | 'phone-security';

export interface HardwareWalletProvider {
  id: string;
  name: string;
  icon: string;
  type: HardwareWalletType;
  connected: boolean;
  supportedChains: string[];

  // Discovery
  detect(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Key operations
  getAddress(chain: string, accountIndex: number): Promise<string>;
  signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array>;

  // For phone cold storage only
  hasSeedVault?(): Promise<boolean>;
  importFromSeedVault?(): Promise<Record<string, string>>; // chain → address
}

/** Simplified provider info for UI lists (no methods). */
export interface HardwareProviderInfo {
  id: string;
  name: string;
  icon: string;
  type: HardwareWalletType;
  connected: boolean;
  supportedChains: string[];
  connectionMethod: string;
  description: string;
}

/** Legacy BuiltinKeyInfo — kept for backward compat with UnlockScreen. */
export interface BuiltinKeyInfo {
  available: boolean;
  provider: 'solana-saga' | 'solana-seeker' | 'samsung-knox' | 'google-titan' | 'apple-se' | 'none';
  isColdStorage: boolean;          // true = Saga/Seeker, false = Knox/SE/Titan
  hasExistingSeedPhrase: boolean;   // only true for cold storage devices
  supportedChains: string[];
}

// ─── Derivation Paths ───

const DERIVATION_PATHS: Record<string, string> = {
  bitcoin: "m/44'/0'/0'/0/0",
  ethereum: "m/44'/60'/0'/0/0",
  solana: "m/44'/501'/0'/0'",
  cosmos: "m/44'/118'/0'/0/0",
  openchain: "m/44'/9999'/0'/0/0",
};

// ─── Native Module Loader ───
// Metro bundler requires static strings in require() calls.
// Since hardware wallet libraries are optional (not installed by default),
// we return null and show install instructions when the user tries to use them.

function tryLoadModule(_moduleName: string): any | null {
  // Hardware wallet native modules are not pre-installed.
  // When user tries to connect a device, they'll get clear instructions.
  // To enable: npm install <module> and rebuild.
  return null;
}

// ─── Demo Mode Addresses ───

const DEMO_ADDRESSES: Record<string, string> = {
  bitcoin: 'bc1qhw_demo_hardware_key_btc_address',
  ethereum: '0xHW_DEMO_1234567890abcdef1234567890abcdef',
  solana: 'HWDemoKey111111111111111111111111111111111',
  cosmos: 'cosmos1hwdemo1234567890abcdefghijklmnop',
  openchain: 'ow1hwdemo1234567890abcdefghijklmnop',
};

const DEMO_SIGNATURE = new Uint8Array(64).fill(0xDE);

// ─── Provider Implementations (imported from dedicated files) ───

// Re-export the real providers from their dedicated implementation files
export { createLedgerProvider } from './ledgerProvider';
export { createTrezorProvider } from './trezorProvider';
export { createKeystoneProvider } from './keystoneProvider';

/**
 * LEGACY STUBS BELOW — kept as fallback reference.
 * The real implementations are in ledgerProvider.ts, trezorProvider.ts, keystoneProvider.ts.
 * getAllProviders() now imports from those files.
 */

/**
 * Ledger Nano X / Stax / Flex — connects via Bluetooth Low Energy.
 * Requires: @ledgerhq/react-native-hw-transport-ble, @ledgerhq/hw-app-eth, etc.
 */
function createLedgerProvider(): HardwareWalletProvider {
  let _connected = false;
  let _transport: any = null;
  const BLE_MODULE = '@ledgerhq/react-native-hw-transport-ble';
  const ETH_APP = '@ledgerhq/hw-app-eth';
  const BTC_APP = '@ledgerhq/hw-app-btc';
  const SOL_APP = '@ledgerhq/hw-app-solana';

  return {
    id: 'ledger',
    name: 'Ledger',
    icon: 'L',
    type: 'external-ble',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      const TransportBLE = tryLoadModule(BLE_MODULE);
      if (!TransportBLE) {
        console.warn(`Ledger BLE library not installed. Run: npm install ${BLE_MODULE}`);
        return false;
      }
      try {
        // Check if BLE is available and can scan for Ledger devices
        const isSupported = await TransportBLE.default.isSupported();
        return isSupported;
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      const TransportBLE = tryLoadModule(BLE_MODULE);
      if (!TransportBLE) {
        throw new Error(`Ledger BLE library not installed. Run: npm install ${BLE_MODULE}`);
      }
      try {
        // Scan for Ledger devices and connect to the first one found
        _transport = await TransportBLE.default.create();
        _connected = true;
      } catch (err) {
        _connected = false;
        throw new Error(`Failed to connect to Ledger via BLE: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },

    async disconnect(): Promise<void> {
      if (_transport) {
        try { await _transport.close(); } catch { /* ignore */ }
        _transport = null;
      }
      _connected = false;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!_connected || !_transport) {
        throw new Error('Ledger not connected. Call connect() first.');
      }
      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain for Ledger: ${chain}`);

      const pathWithIndex = path.replace(/\/0'?$/, `/${accountIndex}'`);

      if (chain === 'ethereum') {
        const EthApp = tryLoadModule(ETH_APP);
        if (!EthApp) throw new Error(`Install: npm install ${ETH_APP}`);
        const app = new EthApp.default(_transport);
        const result = await app.getAddress(pathWithIndex);
        return result.address;
      }
      if (chain === 'bitcoin') {
        const BtcApp = tryLoadModule(BTC_APP);
        if (!BtcApp) throw new Error(`Install: npm install ${BTC_APP}`);
        const app = new BtcApp.default({ transport: _transport });
        const result = await app.getWalletPublicKey(pathWithIndex);
        return result.bitcoinAddress;
      }
      if (chain === 'solana') {
        const SolApp = tryLoadModule(SOL_APP);
        if (!SolApp) throw new Error(`Install: npm install ${SOL_APP}`);
        const app = new SolApp.default(_transport);
        const result = await app.getAddress(pathWithIndex);
        return result.address;
      }
      throw new Error(`Chain ${chain} not yet supported on Ledger integration`);
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!_connected || !_transport) {
        throw new Error('Ledger not connected. Call connect() first.');
      }
      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain for Ledger: ${chain}`);

      if (chain === 'ethereum') {
        const EthApp = tryLoadModule(ETH_APP);
        if (!EthApp) throw new Error(`Install: npm install ${ETH_APP}`);
        const app = new EthApp.default(_transport);
        const sig = await app.signTransaction(path, Buffer.from(unsignedTx).toString('hex'));
        // Combine r, s, v into signature bytes
        const r = Buffer.from(sig.r, 'hex');
        const s = Buffer.from(sig.s, 'hex');
        const v = Buffer.from([parseInt(sig.v, 16)]);
        return new Uint8Array([...r, ...s, ...v]);
      }
      if (chain === 'solana') {
        const SolApp = tryLoadModule(SOL_APP);
        if (!SolApp) throw new Error(`Install: npm install ${SOL_APP}`);
        const app = new SolApp.default(_transport);
        const sig = await app.signTransaction(path, Buffer.from(unsignedTx));
        return new Uint8Array(sig.signature);
      }
      throw new Error(`Chain ${chain} signing not yet supported on Ledger`);
    },
  };
}

/**
 * Trezor Model T / Safe 3 / Safe 5 — connects via USB-C OTG cable.
 * Requires: @trezor/connect-mobile
 */
function createTrezorProvider(): HardwareWalletProvider {
  let _connected = false;
  const TREZOR_MODULE = '@trezor/connect-mobile';

  return {
    id: 'trezor',
    name: 'Trezor',
    icon: 'T',
    type: 'external-usb',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana'],

    async detect(): Promise<boolean> {
      const TrezorConnect = tryLoadModule(TREZOR_MODULE);
      if (!TrezorConnect) {
        console.warn(`Trezor library not installed. Run: npm install ${TREZOR_MODULE}`);
        return false;
      }
      return true; // USB detection happens on connect
    },

    async connect(): Promise<void> {
      const TrezorConnect = tryLoadModule(TREZOR_MODULE);
      if (!TrezorConnect) {
        throw new Error(`Trezor library not installed. Run: npm install ${TREZOR_MODULE}`);
      }
      try {
        await TrezorConnect.default.init({
          manifest: {
            email: 'support@openwallet.org',
            appUrl: 'https://openwallet.org',
          },
        });
        // Verify device is present
        const features = await TrezorConnect.default.getFeatures();
        if (!features.success) throw new Error('No Trezor device found');
        _connected = true;
      } catch (err) {
        _connected = false;
        throw new Error(`Failed to connect to Trezor via USB: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },

    async disconnect(): Promise<void> {
      const TrezorConnect = tryLoadModule(TREZOR_MODULE);
      if (TrezorConnect) {
        try { TrezorConnect.default.dispose(); } catch { /* ignore */ }
      }
      _connected = false;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!_connected) throw new Error('Trezor not connected. Call connect() first.');
      const TrezorConnect = tryLoadModule(TREZOR_MODULE);
      if (!TrezorConnect) throw new Error(`Install: npm install ${TREZOR_MODULE}`);

      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain for Trezor: ${chain}`);
      const pathWithIndex = path.replace(/\/0'?$/, `/${accountIndex}'`);

      if (chain === 'ethereum') {
        const result = await TrezorConnect.default.ethereumGetAddress({ path: pathWithIndex });
        if (!result.success) throw new Error(result.payload.error);
        return result.payload.address;
      }
      if (chain === 'bitcoin') {
        const result = await TrezorConnect.default.getAddress({ path: pathWithIndex, coin: 'btc' });
        if (!result.success) throw new Error(result.payload.error);
        return result.payload.address;
      }
      if (chain === 'solana') {
        const result = await TrezorConnect.default.solanaGetAddress({ path: pathWithIndex });
        if (!result.success) throw new Error(result.payload.error);
        return result.payload.address;
      }
      throw new Error(`Chain ${chain} not yet supported on Trezor integration`);
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!_connected) throw new Error('Trezor not connected. Call connect() first.');
      const TrezorConnect = tryLoadModule(TREZOR_MODULE);
      if (!TrezorConnect) throw new Error(`Install: npm install ${TREZOR_MODULE}`);

      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain for Trezor: ${chain}`);

      if (chain === 'ethereum') {
        const hexTx = Buffer.from(unsignedTx).toString('hex');
        const result = await TrezorConnect.default.ethereumSignTransaction({
          path,
          transaction: hexTx,
        });
        if (!result.success) throw new Error(result.payload.error);
        const { r, s, v } = result.payload;
        return new Uint8Array([
          ...Buffer.from(r.replace('0x', ''), 'hex'),
          ...Buffer.from(s.replace('0x', ''), 'hex'),
          parseInt(v, 16),
        ]);
      }
      if (chain === 'solana') {
        const result = await TrezorConnect.default.solanaSignTransaction({
          path,
          serializedTx: Buffer.from(unsignedTx).toString('hex'),
        });
        if (!result.success) throw new Error(result.payload.error);
        return Buffer.from(result.payload.signature, 'hex');
      }
      throw new Error(`Chain ${chain} signing not yet supported on Trezor`);
    },
  };
}

/**
 * Keystone 3 Pro — air-gapped, communicates via QR codes (camera).
 * Requires: @keystonehq/keystone-sdk, @keystonehq/animated-qr
 */
function createKeystoneProvider(): HardwareWalletProvider {
  let _connected = false;
  let _cachedAddresses: Record<string, string> = {};
  const KEYSTONE_SDK = '@keystonehq/keystone-sdk';

  return {
    id: 'keystone',
    name: 'Keystone',
    icon: 'K',
    type: 'external-qr',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      const SDK = tryLoadModule(KEYSTONE_SDK);
      if (!SDK) {
        console.warn(`Keystone SDK not installed. Run: npm install ${KEYSTONE_SDK} @keystonehq/animated-qr`);
        return false;
      }
      return true; // QR-based — always "detectable" if SDK is present
    },

    async connect(): Promise<void> {
      const SDK = tryLoadModule(KEYSTONE_SDK);
      if (!SDK) {
        throw new Error(`Keystone SDK not installed. Run: npm install ${KEYSTONE_SDK} @keystonehq/animated-qr`);
      }
      // Connection via QR means scanning the Keystone's sync QR code
      // which contains extended public keys for all chains.
      // The actual QR scanning UI is in HardwareKeyScreen.
      _connected = true;
    },

    async disconnect(): Promise<void> {
      _connected = false;
      _cachedAddresses = {};
    },

    async getAddress(chain: string, _accountIndex: number): Promise<string> {
      if (!_connected) throw new Error('Keystone not connected. Scan sync QR first.');
      // Addresses are extracted from the sync QR scanned during connect()
      if (_cachedAddresses[chain]) return _cachedAddresses[chain];
      throw new Error(`No ${chain} address from Keystone. Re-scan the sync QR code.`);
    },

    async signTransaction(_chain: string, _unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!_connected) throw new Error('Keystone not connected. Scan sync QR first.');
      // Signing flow:
      // 1. App encodes unsigned tx as animated QR
      // 2. User scans QR with Keystone device
      // 3. Keystone shows tx details → user confirms on device
      // 4. Keystone shows signed tx as animated QR
      // 5. User scans signed QR with phone camera
      // The actual QR exchange UI is handled by HardwareKeyScreen.
      throw new Error('Keystone signing requires QR code exchange. Use the camera interface.');
    },
  };
}

/**
 * Solana Saga — Phone cold storage via Seed Vault API.
 * TRUE cold storage: seed generated in hardware, NEVER leaves the secure element.
 * Even Open Wallet cannot see the seed phrase.
 * Requires: @solana-mobile/seed-vault-lib
 */
function createSolanaSagaProvider(): HardwareWalletProvider {
  let _connected = false;
  let _authToken: any = null;
  const SEED_VAULT_MODULE = '@solana-mobile/seed-vault-lib';

  return {
    id: 'solana-saga',
    name: 'Solana Saga Seed Vault',
    icon: 'SV',
    type: 'phone-cold-storage',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['solana', 'ethereum', 'bitcoin'],

    async detect(): Promise<boolean> {
      if (Platform.OS !== 'android') return false;
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (SeedVault) {
        try {
          return await SeedVault.SeedVaultLib.isAvailable(false); // false = check Saga specifically
        } catch {
          return false;
        }
      }
      // Fallback: detect by device model when native library is not installed
      const info = await detectSeedVault();
      return info.available && info.model === 'saga';
    },

    async connect(): Promise<void> {
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) {
        throw new Error(`Solana Seed Vault library not installed. Run: npm install ${SEED_VAULT_MODULE}`);
      }
      try {
        _authToken = await SeedVault.SeedVaultLib.authorizeNewSeed();
        _connected = true;
      } catch (err) {
        _connected = false;
        throw new Error(`Failed to authorize Seed Vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },

    async disconnect(): Promise<void> {
      _authToken = null;
      _connected = false;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!_connected || !_authToken) throw new Error('Seed Vault not authorized. Call connect() first.');
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) throw new Error(`Install: npm install ${SEED_VAULT_MODULE}`);

      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);
      const uri = path.replace(/\/0'?$/, `/${accountIndex}'`);

      const pubkey = await SeedVault.SeedVaultLib.getPublicKey(_authToken, uri);
      // Convert public key to chain-specific address format
      return pubkey.toBase58 ? pubkey.toBase58() : pubkey.toString();
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!_connected || !_authToken) throw new Error('Seed Vault not authorized. Call connect() first.');
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) throw new Error(`Install: npm install ${SEED_VAULT_MODULE}`);

      // Seed Vault signs the transaction inside the secure element.
      // The private key NEVER leaves the hardware.
      const signatures = await SeedVault.SeedVaultLib.signTransactions(
        _authToken,
        [unsignedTx],
      );
      return new Uint8Array(signatures[0]);
    },

    async hasSeedVault(): Promise<boolean> {
      return this.detect();
    },

    async importFromSeedVault(): Promise<Record<string, string>> {
      const addresses: Record<string, string> = {};
      for (const chain of this.supportedChains) {
        try {
          addresses[chain] = await this.getAddress(chain, 0);
        } catch {
          // Chain not available on this device
        }
      }
      return addresses;
    },
  };
}

/**
 * Solana Seeker — Phone cold storage via Seed Vault API (newer model).
 * Same Seed Vault API as Saga but with additional capabilities.
 */
function createSolanaSeekerProvider(): HardwareWalletProvider {
  let _connected = false;
  let _authToken: any = null;
  const SEED_VAULT_MODULE = '@solana-mobile/seed-vault-lib';

  return {
    id: 'solana-seeker',
    name: 'Solana Seeker Seed Vault',
    icon: 'SV',
    type: 'phone-cold-storage',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['solana', 'ethereum', 'bitcoin'],

    async detect(): Promise<boolean> {
      if (Platform.OS !== 'android') return false;
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (SeedVault) {
        try {
          // Seeker has an updated Seed Vault API
          const available = await SeedVault.SeedVaultLib.isAvailable(true); // true = include Seeker
          if (!available) return false;
          // Distinguish Seeker from Saga by checking device model or API version
          const info = await SeedVault.SeedVaultLib.getDeviceInfo?.();
          return info?.model === 'seeker' || info?.apiVersion >= 2;
        } catch {
          return false;
        }
      }
      // Fallback: detect by device model when native library is not installed
      const info = await detectSeedVault();
      return info.available && info.model === 'seeker';
    },

    async connect(): Promise<void> {
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) {
        throw new Error(`Solana Seed Vault library not installed. Run: npm install ${SEED_VAULT_MODULE}`);
      }
      try {
        _authToken = await SeedVault.SeedVaultLib.authorizeNewSeed();
        _connected = true;
      } catch (err) {
        _connected = false;
        throw new Error(`Failed to authorize Seed Vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },

    async disconnect(): Promise<void> {
      _authToken = null;
      _connected = false;
    },

    async getAddress(chain: string, accountIndex: number): Promise<string> {
      if (!_connected || !_authToken) throw new Error('Seed Vault not authorized. Call connect() first.');
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) throw new Error(`Install: npm install ${SEED_VAULT_MODULE}`);

      const path = DERIVATION_PATHS[chain];
      if (!path) throw new Error(`Unsupported chain: ${chain}`);
      const uri = path.replace(/\/0'?$/, `/${accountIndex}'`);

      const pubkey = await SeedVault.SeedVaultLib.getPublicKey(_authToken, uri);
      return pubkey.toBase58 ? pubkey.toBase58() : pubkey.toString();
    },

    async signTransaction(chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      if (!_connected || !_authToken) throw new Error('Seed Vault not authorized. Call connect() first.');
      const SeedVault = tryLoadModule(SEED_VAULT_MODULE);
      if (!SeedVault) throw new Error(`Install: npm install ${SEED_VAULT_MODULE}`);

      const signatures = await SeedVault.SeedVaultLib.signTransactions(
        _authToken,
        [unsignedTx],
      );
      return new Uint8Array(signatures[0]);
    },

    async hasSeedVault(): Promise<boolean> {
      return this.detect();
    },

    async importFromSeedVault(): Promise<Record<string, string>> {
      const addresses: Record<string, string> = {};
      for (const chain of this.supportedChains) {
        try {
          addresses[chain] = await this.getAddress(chain, 0);
        } catch {
          // Chain not available
        }
      }
      return addresses;
    },
  };
}

/**
 * Samsung Knox Vault (S21+) — Phone security ENHANCEMENT.
 * Protects app-generated keys with hardware-backed storage.
 * NOT a cold storage wallet — does NOT have its own seed vault.
 * Requires: react-native-keychain (with strongbox support)
 */
function createSamsungKnoxProvider(): HardwareWalletProvider {
  let _connected = false;
  const KEYCHAIN_MODULE = 'react-native-keychain';

  return {
    id: 'samsung-knox',
    name: 'Samsung Knox Vault',
    icon: 'KV',
    type: 'phone-security',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      if (Platform.OS !== 'android') return false;
      const Keychain = tryLoadModule(KEYCHAIN_MODULE);
      if (!Keychain) {
        console.warn(`Keychain library not installed. Run: npm install ${KEYCHAIN_MODULE}`);
        return false;
      }
      try {
        // Check for Samsung-specific StrongBox (Knox Vault)
        const level = await Keychain.default.getSecurityLevel?.();
        return level === 'SECURE_HARDWARE'; // Knox Vault reports SECURE_HARDWARE
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      const detected = await this.detect();
      if (!detected) throw new Error('Samsung Knox Vault not available on this device.');
      _connected = true;
    },

    async disconnect(): Promise<void> {
      _connected = false;
    },

    async getAddress(_chain: string, _accountIndex: number): Promise<string> {
      // Knox doesn't derive addresses — it protects keys the app generates.
      throw new Error(
        'Samsung Knox is a security enhancement, not a key derivation device. ' +
        'It protects your app-generated keys with hardware-backed encryption.',
      );
    },

    async signTransaction(_chain: string, unsignedTx: Uint8Array): Promise<Uint8Array> {
      // Knox protects the key storage; actual signing uses the app's keys
      // which are stored in Knox-protected keystore.
      throw new Error(
        'Samsung Knox enhances key protection but does not sign directly. ' +
        'Keys stored in Knox Vault are used by the app\'s software signer.',
      );
    },
  };
}

/**
 * Apple Secure Enclave — Phone security ENHANCEMENT.
 * Biometric-protected vault for app-generated keys.
 * NOT a cold storage wallet — does NOT have its own seed.
 * Available on all modern iPhones (A7+).
 * Requires: react-native-keychain or expo-secure-store
 */
function createAppleSecureEnclaveProvider(): HardwareWalletProvider {
  let _connected = false;
  const KEYCHAIN_MODULE = 'react-native-keychain';

  return {
    id: 'apple-se',
    name: 'Apple Secure Enclave',
    icon: 'SE',
    type: 'phone-security',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      if (Platform.OS !== 'ios') return false;
      const Keychain = tryLoadModule(KEYCHAIN_MODULE);
      if (!Keychain) {
        console.warn(`Keychain library not installed. Run: npm install ${KEYCHAIN_MODULE}`);
        return false;
      }
      try {
        const biometryType = await Keychain.default.getSupportedBiometryType?.();
        // If biometry is available, Secure Enclave is present
        return biometryType !== null && biometryType !== undefined;
      } catch {
        // Secure Enclave exists on all modern iOS devices even without biometry
        return true;
      }
    },

    async connect(): Promise<void> {
      const detected = await this.detect();
      if (!detected) throw new Error('Apple Secure Enclave not available.');
      _connected = true;
    },

    async disconnect(): Promise<void> {
      _connected = false;
    },

    async getAddress(_chain: string, _accountIndex: number): Promise<string> {
      throw new Error(
        'Apple Secure Enclave is a security enhancement, not a key derivation device. ' +
        'It protects your app-generated keys with biometric-gated hardware encryption.',
      );
    },

    async signTransaction(_chain: string, _unsignedTx: Uint8Array): Promise<Uint8Array> {
      throw new Error(
        'Apple Secure Enclave enhances key protection but does not sign directly. ' +
        'Keys stored in Secure Enclave are used by the app\'s software signer.',
      );
    },
  };
}

/**
 * Google Titan M — Phone security ENHANCEMENT.
 * Secure boot + key attestation chip.
 * NOT a cold storage wallet.
 * Requires: react-native-keychain (with StrongBox support)
 */
function createGoogleTitanProvider(): HardwareWalletProvider {
  let _connected = false;
  const KEYCHAIN_MODULE = 'react-native-keychain';

  return {
    id: 'google-titan',
    name: 'Google Titan M',
    icon: 'TM',
    type: 'phone-security',
    get connected() { return _connected; },
    set connected(v: boolean) { _connected = v; },
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

    async detect(): Promise<boolean> {
      if (Platform.OS !== 'android') return false;
      const Keychain = tryLoadModule(KEYCHAIN_MODULE);
      if (!Keychain) {
        console.warn(`Keychain library not installed. Run: npm install ${KEYCHAIN_MODULE}`);
        return false;
      }
      try {
        const level = await Keychain.default.getSecurityLevel?.();
        // Titan M reports as StrongBox Keymaster
        return level === 'SECURE_HARDWARE';
      } catch {
        return false;
      }
    },

    async connect(): Promise<void> {
      const detected = await this.detect();
      if (!detected) throw new Error('Google Titan M chip not available on this device.');
      _connected = true;
    },

    async disconnect(): Promise<void> {
      _connected = false;
    },

    async getAddress(_chain: string, _accountIndex: number): Promise<string> {
      throw new Error(
        'Google Titan M is a security enhancement, not a key derivation device. ' +
        'It provides secure boot and key attestation for your app-generated keys.',
      );
    },

    async signTransaction(_chain: string, _unsignedTx: Uint8Array): Promise<Uint8Array> {
      throw new Error(
        'Google Titan M enhances key protection but does not sign directly. ' +
        'Keys stored in Titan M-protected keystore are used by the app\'s software signer.',
      );
    },
  };
}

// ─── Provider Registry ───

let _providers: HardwareWalletProvider[] | null = null;

function getAllProviders(): HardwareWalletProvider[] {
  if (!_providers) {
    // Import real implementations from dedicated provider files
    const { createLedgerProvider: ledger } = require('./ledgerProvider');
    const { createTrezorProvider: trezor } = require('./trezorProvider');
    const { createKeystoneProvider: keystone } = require('./keystoneProvider');
    _providers = [
      // External hardware wallets (real implementations)
      ledger(),
      trezor(),
      keystone(),
      // Phone cold storage
      createSolanaSagaProvider(),
      createSolanaSeekerProvider(),
      // Phone security enhancement
      createSamsungKnoxProvider(),
      createAppleSecureEnclaveProvider(),
      createGoogleTitanProvider(),
    ];
  }
  return _providers;
}

/** Get a specific provider by ID. */
export function getProvider(id: string): HardwareWalletProvider | undefined {
  return getAllProviders().find((p) => p.id === id);
}

/** Get all providers of a specific type. */
export function getProvidersByType(type: HardwareWalletType): HardwareWalletProvider[] {
  return getAllProviders().filter((p) => p.type === type);
}

// ─── Public API ───

/**
 * Detect all available hardware providers.
 * Returns info objects (no methods) suitable for UI rendering.
 */
export async function getHardwareProviders(): Promise<HardwareProviderInfo[]> {
  const providers = getAllProviders();
  const infos: HardwareProviderInfo[] = [];

  for (const p of providers) {
    const connectionMethods: Record<HardwareWalletType, string> = {
      'external-ble': 'Bluetooth',
      'external-usb': 'USB-C',
      'external-qr': 'QR Code',
      'phone-cold-storage': 'Built-in Seed Vault',
      'phone-security': 'System Integration',
    };
    const descriptions: Record<string, string> = {
      'ledger': 'Connect via Bluetooth. Supports Nano X, Stax, and Flex.',
      'trezor': 'Connect via USB-C OTG cable. Supports Model T, Safe 3, and Safe 5.',
      'keystone': 'Air-gapped signing via QR codes. Supports Keystone 3 Pro.',
      'solana-saga': 'Hardware seed vault. Seed never leaves the secure element.',
      'solana-seeker': 'Hardware seed vault. Seed never leaves the secure element.',
      'samsung-knox': 'Enhanced key protection using Knox Vault hardware.',
      'apple-se': 'Biometric-protected vault encryption for app keys.',
      'google-titan': 'Secure boot and key attestation via Titan M chip.',
    };

    infos.push({
      id: p.id,
      name: p.name,
      icon: p.icon,
      type: p.type,
      connected: p.connected,
      supportedChains: p.supportedChains,
      connectionMethod: connectionMethods[p.type],
      description: descriptions[p.id] || '',
    });
  }

  return infos;
}

/**
 * Detect if the phone has built-in cold storage (Solana Saga/Seeker Seed Vault).
 * This is TRUE cold storage — the seed never leaves hardware.
 */
export async function detectColdStorage(): Promise<HardwareWalletProvider | null> {
  const coldStorageProviders = getProvidersByType('phone-cold-storage');
  for (const p of coldStorageProviders) {
    try {
      const detected = await p.detect();
      if (detected) return p;
    } catch {
      // Continue checking
    }
  }
  return null;
}

/**
 * Detect phone security enhancements (Knox, Secure Enclave, Titan M).
 * These protect app keys but are NOT cold storage.
 */
export async function detectSecurityEnhancements(): Promise<HardwareProviderInfo[]> {
  const secProviders = getProvidersByType('phone-security');
  const detected: HardwareProviderInfo[] = [];

  for (const p of secProviders) {
    try {
      const available = await p.detect();
      if (available) {
        detected.push({
          id: p.id,
          name: p.name,
          icon: p.icon,
          type: p.type,
          connected: p.connected,
          supportedChains: p.supportedChains,
          connectionMethod: 'System Integration',
          description: p.id === 'samsung-knox'
            ? 'Enhanced key protection using Knox Vault hardware.'
            : p.id === 'apple-se'
            ? 'Biometric-protected vault encryption.'
            : 'Secure boot and key attestation.',
        });
      }
    } catch {
      // Continue
    }
  }

  return detected;
}

/**
 * Detect if the phone has a built-in key (backward compat for UnlockScreen).
 * Returns BuiltinKeyInfo with the CORRECT classification:
 *   - Saga/Seeker = cold storage (isColdStorage: true, hasExistingSeedPhrase: true)
 *   - Knox/SE/Titan = security enhancement (isColdStorage: false, hasExistingSeedPhrase: false)
 */
export async function detectBuiltinKey(): Promise<BuiltinKeyInfo> {
  const noKey: BuiltinKeyInfo = {
    available: false,
    provider: 'none',
    isColdStorage: false,
    hasExistingSeedPhrase: false,
    supportedChains: [],
  };

  try {
    // Priority 1: Check for TRUE cold storage (Solana phones)
    const coldStorage = await detectColdStorage();
    if (coldStorage) {
      return {
        available: true,
        provider: coldStorage.id as BuiltinKeyInfo['provider'],
        isColdStorage: true,
        hasExistingSeedPhrase: true, // Seed vault has its own seed
        supportedChains: coldStorage.supportedChains,
      };
    }

    // Priority 2: Check for phone security enhancements
    const enhancements = await detectSecurityEnhancements();
    if (enhancements.length > 0) {
      const best = enhancements[0]; // First detected
      return {
        available: true,
        provider: best.id as BuiltinKeyInfo['provider'],
        isColdStorage: false,
        hasExistingSeedPhrase: false, // These don't have their own seed
        supportedChains: best.supportedChains,
      };
    }

    return noKey;
  } catch {
    return noKey;
  }
}

/**
 * Sign a transaction using a hardware key provider.
 */
export async function signWithHardwareKey(
  providerId: string,
  chain: string,
  txBytes: Uint8Array,
): Promise<Uint8Array> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown hardware provider: ${providerId}`);
  if (!provider.connected) throw new Error(`${provider.name} is not connected.`);
  return provider.signTransaction(chain, txBytes);
}

/**
 * Get an address from a hardware key for a specific chain.
 */
export async function getHardwareAddress(
  providerId: string,
  chain: string,
  accountIndex: number = 0,
): Promise<string> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown hardware provider: ${providerId}`);
  if (!provider.connected) throw new Error(`${provider.name} is not connected.`);
  return provider.getAddress(chain, accountIndex);
}

/**
 * Import wallet addresses from a phone cold storage seed vault.
 * Only works with phone-cold-storage providers (Saga/Seeker).
 */
export async function importFromSeedVault(
  providerId: string,
): Promise<{ addresses: Record<string, string> }> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown hardware provider: ${providerId}`);
  if (provider.type !== 'phone-cold-storage') {
    throw new Error(
      `${provider.name} is a ${provider.type} device, not cold storage. ` +
      'Only Solana Saga/Seeker can import from Seed Vault.',
    );
  }
  if (!provider.importFromSeedVault) {
    throw new Error(`${provider.name} does not support seed vault import.`);
  }
  if (!provider.connected) {
    await provider.connect();
  }
  const addresses = await provider.importFromSeedVault();
  return { addresses };
}

// ─── Demo Mode ───

/**
 * Get simulated hardware providers for demo mode.
 */
export function getDemoHardwareProviders(): HardwareProviderInfo[] {
  return [
    {
      id: 'ledger',
      name: 'Ledger',
      icon: 'L',
      type: 'external-ble',
      connected: false,
      supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
      connectionMethod: 'Bluetooth',
      description: 'Connect via Bluetooth. Supports Nano X, Stax, and Flex.',
    },
    {
      id: 'trezor',
      name: 'Trezor',
      icon: 'T',
      type: 'external-usb',
      connected: false,
      supportedChains: ['bitcoin', 'ethereum', 'solana'],
      connectionMethod: 'USB-C',
      description: 'Connect via USB-C OTG cable. Supports Model T, Safe 3, and Safe 5.',
    },
    {
      id: 'keystone',
      name: 'Keystone',
      icon: 'K',
      type: 'external-qr',
      connected: false,
      supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
      connectionMethod: 'QR Code',
      description: 'Air-gapped signing via QR codes. Supports Keystone 3 Pro.',
    },
    {
      id: 'demo-cold-storage',
      name: 'Phone Seed Vault (Demo)',
      icon: 'SV',
      type: 'phone-cold-storage',
      connected: true,
      supportedChains: ['solana', 'ethereum', 'bitcoin'],
      connectionMethod: 'Built-in Seed Vault',
      description: 'Hardware seed vault. Seed never leaves the secure element.',
    },
    {
      id: 'demo-security',
      name: 'Phone Security (Demo)',
      icon: 'SE',
      type: 'phone-security',
      connected: true,
      supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
      connectionMethod: 'System Integration',
      description: 'Enhanced key protection using hardware-backed encryption.',
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
    isColdStorage: Platform.OS !== 'ios', // Seeker is cold storage, Apple SE is not
    hasExistingSeedPhrase: Platform.OS !== 'ios',
    supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  };
}

/**
 * Get a demo address for a chain.
 */
export function getDemoHardwareAddress(chain: string): string {
  return DEMO_ADDRESSES[chain] || `${chain}_hw_demo_address`;
}

/**
 * Get demo addresses for all chains.
 */
export function getDemoSeedVaultAddresses(): Record<string, string> {
  return { ...DEMO_ADDRESSES };
}

/**
 * Demo mode sign — returns a fake signature.
 */
export function getDemoSignature(): Uint8Array {
  return new Uint8Array(DEMO_SIGNATURE);
}

/**
 * Create a hardware wallet signer function compatible with secureSign().
 * Used by the signing pipeline to delegate signing to a hardware device.
 */
export function createHardwareWalletSigner(
  providerId: string,
  chain: string,
  demoMode: boolean = false,
): (unsignedTx: Uint8Array) => Promise<{ signature: Uint8Array; signedTx: Uint8Array }> {
  return async (unsignedTx: Uint8Array) => {
    if (demoMode) {
      return {
        signature: getDemoSignature(),
        signedTx: new Uint8Array([...unsignedTx, ...getDemoSignature()]),
      };
    }

    const provider = getProvider(providerId);
    if (!provider) throw new Error(`Unknown hardware provider: ${providerId}`);
    if (!provider.connected) throw new Error(`${provider.name} is not connected.`);

    const signature = await provider.signTransaction(chain, unsignedTx);
    // signedTx = original tx bytes + signature appended (chain-specific encoding)
    const signedTx = new Uint8Array(unsignedTx.length + signature.length);
    signedTx.set(unsignedTx, 0);
    signedTx.set(signature, unsignedTx.length);

    return { signature, signedTx };
  };
}
