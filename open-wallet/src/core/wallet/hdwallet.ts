/**
 * HD Wallet — BIP-39 / BIP-44 hierarchical deterministic wallet.
 *
 * Uses @scure/bip39 + @scure/bip32 (audited by Cure53, by Paul Miller
 * who also authored noble-curves used by viem). These are the gold standard
 * for JS crypto libraries — audited, tree-shakeable, no dependencies.
 *
 * Key derivation paths (BIP-44/49/84/86):
 *   m/44'/0'/0'/0/0    → Bitcoin (legacy P2PKH)
 *   m/49'/0'/0'/0/0    → Bitcoin (wrapped segwit P2SH-P2WPKH)
 *   m/84'/0'/0'/0/0    → Bitcoin (native segwit P2WPKH)
 *   m/86'/0'/0'/0/0    → Bitcoin (taproot P2TR)
 *   m/44'/60'/0'/0/0   → Ethereum
 *   m/44'/501'/0'/0'   → Solana
 *   m/44'/1815'/0'/0/0 → Cardano (future)
 *   m/44'/118'/0'/0/0  → Cosmos/Open Chain
 *
 * The seed phrase is encrypted by the PQC vault and never stored in plaintext.
 */

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { ChainId, KeyPair } from '../abstractions/types';

// BIP-44 coin types (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
const COIN_TYPES: Record<string, number> = {
  bitcoin: 0,
  ethereum: 60,
  solana: 501,
  cardano: 1815,
  cosmos: 118,
  openchain: 9999, // custom — will register with SLIP-44
};

// BIP purpose numbers for Bitcoin address types
export type BtcAddressType = 'legacy' | 'wrapped-segwit' | 'native-segwit' | 'taproot';
const BTC_PURPOSE: Record<BtcAddressType, number> = {
  'legacy': 44,        // P2PKH — 1... addresses
  'wrapped-segwit': 49, // P2SH-P2WPKH — 3... addresses
  'native-segwit': 84,  // P2WPKH — bc1q... addresses
  'taproot': 86,        // P2TR — bc1p... addresses
};

export interface HDWalletConfig {
  strength?: 128 | 256; // 12 or 24 words
  passphrase?: string;  // Optional BIP-39 passphrase (25th word)
}

export class HDWallet {
  private seed: Uint8Array | null = null;
  private mnemonic: string | null = null;
  private passphrase: string = '';

  /**
   * Generate a new wallet with a fresh mnemonic.
   * Does NOT derive seed yet (expensive) — only generates words.
   * Seed is derived lazily when keys are needed.
   */
  static generate(config?: HDWalletConfig): HDWallet {
    const strength = config?.strength ?? 256;
    const mnemonic = generateMnemonic(wordlist, strength);
    const wallet = new HDWallet();
    wallet.mnemonic = mnemonic;
    wallet.passphrase = config?.passphrase ?? '';
    // Seed not derived here — done lazily in deriveKey/derivePrivateKey
    return wallet;
  }

  /**
   * Restore wallet from existing mnemonic phrase.
   * Derives seed immediately since caller will need keys.
   * @param passphrase Optional BIP-39 passphrase (25th word) — different passphrase = different wallet
   */
  static fromMnemonic(mnemonic: string, passphrase?: string): HDWallet {
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase');
    }
    const wallet = new HDWallet();
    wallet.mnemonic = mnemonic;
    wallet.passphrase = passphrase ?? '';
    wallet.seed = mnemonicToSeedSync(mnemonic, wallet.passphrase);
    return wallet;
  }

  /**
   * Ensure seed is derived (lazy initialization).
   */
  private ensureSeed(): void {
    if (!this.seed && this.mnemonic) {
      this.seed = mnemonicToSeedSync(this.mnemonic, this.passphrase);
    }
    if (!this.seed) throw new Error('Wallet not initialized');
  }

  /**
   * Get the mnemonic phrase. Only call when needed (e.g., backup).
   * The vault should encrypt this immediately after.
   */
  getMnemonic(): string {
    if (!this.mnemonic) throw new Error('Wallet not initialized');
    return this.mnemonic;
  }

  /**
   * Get the passphrase (empty string if none).
   */
  getPassphrase(): string {
    return this.passphrase;
  }

  /**
   * Derive a key pair for a specific chain and account index.
   * Uses BIP-44 path: m/44'/<coin_type>'/<account>'/0/<address_index>
   * @param addressIndex Address index within the account (default 0)
   */
  deriveKey(chainId: ChainId, accountIndex: number = 0, addressIndex: number = 0): KeyPair {
    this.ensureSeed();

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}. Register coin type first.`);
    }

    // Solana uses hardened derivation at all levels
    const path = chainId === 'solana'
      ? `m/44'/501'/${accountIndex}'/0'`
      : `m/44'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

    const hdkey = HDKey.fromMasterSeed(this.seed!);
    const derived = hdkey.derive(path);

    if (!derived.publicKey) {
      throw new Error('Key derivation failed');
    }

    return {
      publicKey: derived.publicKey,
      chainId,
      address: '', // chain-specific address encoding done by chain providers
      derivationPath: path,
    };
  }

  /**
   * Derive raw private key bytes for a chain. Used internally for signing.
   * NEVER expose this outside the crypto module.
   * @param addressIndex Address index within the account (default 0)
   */
  derivePrivateKey(chainId: ChainId, accountIndex: number = 0, addressIndex: number = 0): Uint8Array {
    this.ensureSeed();

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const path = chainId === 'solana'
      ? `m/44'/501'/${accountIndex}'/0'`
      : `m/44'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

    const hdkey = HDKey.fromMasterSeed(this.seed!);
    const derived = hdkey.derive(path);

    if (!derived.privateKey) throw new Error('Key derivation failed');
    return derived.privateKey;
  }

  /**
   * Derive Bitcoin key pair using BIP-49/84/86 paths for different address types.
   * @param btcType Address type: legacy (44), wrapped-segwit (49), native-segwit (84), taproot (86)
   * @param accountIndex Account index (default 0)
   * @param addressIndex Address index (default 0)
   */
  deriveBtcKey(btcType: BtcAddressType, accountIndex: number = 0, addressIndex: number = 0): { privateKey: Uint8Array; publicKey: Uint8Array; path: string } {
    this.ensureSeed();

    const purpose = BTC_PURPOSE[btcType];
    const path = `m/${purpose}'/0'/${accountIndex}'/0/${addressIndex}`;

    const hdkey = HDKey.fromMasterSeed(this.seed!);
    const derived = hdkey.derive(path);

    if (!derived.privateKey || !derived.publicKey) throw new Error('Key derivation failed');

    return {
      privateKey: derived.privateKey,
      publicKey: derived.publicKey,
      path,
    };
  }

  /**
   * Derive a key at an arbitrary BIP-32 path.
   * Used for scanning non-standard paths from other wallets.
   */
  deriveAtPath(path: string): { privateKey: Uint8Array; publicKey: Uint8Array } {
    this.ensureSeed();

    const hdkey = HDKey.fromMasterSeed(this.seed!);
    const derived = hdkey.derive(path);

    if (!derived.privateKey || !derived.publicKey) throw new Error('Key derivation failed');

    return { privateKey: derived.privateKey, publicKey: derived.publicKey };
  }

  /**
   * Register a custom chain's coin type for BIP-44 derivation.
   * Used for new chains added in the future.
   */
  static registerCoinType(chainId: ChainId, coinType: number): void {
    COIN_TYPES[chainId] = coinType;
  }

  /**
   * Get all supported chain IDs.
   */
  static getSupportedChains(): ChainId[] {
    return Object.keys(COIN_TYPES);
  }

  /**
   * Securely wipe the seed and mnemonic from memory.
   * Call this when locking the wallet.
   */
  destroy(): void {
    if (this.seed) {
      this.seed.fill(0);
      this.seed = null;
    }
    if (this.mnemonic) {
      this.mnemonic = '';
      this.mnemonic = null;
    }
    this.passphrase = '';
  }
}
