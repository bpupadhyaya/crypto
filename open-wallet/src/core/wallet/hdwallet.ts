/**
 * HD Wallet — BIP-39 / BIP-44 hierarchical deterministic wallet.
 *
 * Uses @scure/bip39 + @scure/bip32 (audited by Cure53, by Paul Miller
 * who also authored noble-curves used by viem). These are the gold standard
 * for JS crypto libraries — audited, tree-shakeable, no dependencies.
 *
 * Key derivation paths (BIP-44):
 *   m/44'/0'/0'/0/0    → Bitcoin
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

export interface HDWalletConfig {
  strength?: 128 | 256; // 12 or 24 words
}

export class HDWallet {
  private seed: Uint8Array | null = null;
  private mnemonic: string | null = null;

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
    // Seed not derived here — done lazily in deriveKey/derivePrivateKey
    return wallet;
  }

  /**
   * Restore wallet from existing mnemonic phrase.
   * Derives seed immediately since caller will need keys.
   */
  static fromMnemonic(mnemonic: string): HDWallet {
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase');
    }
    const wallet = new HDWallet();
    wallet.mnemonic = mnemonic;
    wallet.seed = mnemonicToSeedSync(mnemonic);
    return wallet;
  }

  /**
   * Ensure seed is derived (lazy initialization).
   */
  private ensureSeed(): void {
    if (!this.seed && this.mnemonic) {
      this.seed = mnemonicToSeedSync(this.mnemonic);
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
   * Derive a key pair for a specific chain and account index.
   * Uses BIP-44 path: m/44'/<coin_type>'/<account>'/0/0
   */
  deriveKey(chainId: ChainId, accountIndex: number = 0): KeyPair {
    this.ensureSeed();

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}. Register coin type first.`);
    }

    // Solana uses hardened derivation at all levels
    const path = chainId === 'solana'
      ? `m/44'/501'/${accountIndex}'/0'`
      : `m/44'/${coinType}'/${accountIndex}'/0/0`;

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
   */
  derivePrivateKey(chainId: ChainId, accountIndex: number = 0): Uint8Array {
    this.ensureSeed();

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const path = chainId === 'solana'
      ? `m/44'/501'/${accountIndex}'/0'`
      : `m/44'/${coinType}'/${accountIndex}'/0/0`;

    const hdkey = HDKey.fromMasterSeed(this.seed!);
    const derived = hdkey.derive(path);

    if (!derived.privateKey) throw new Error('Key derivation failed');
    return derived.privateKey;
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
  }
}
