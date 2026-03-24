/**
 * HD Wallet — BIP-39 / BIP-44 hierarchical deterministic wallet.
 *
 * Generates a single seed phrase that derives keys for ALL chains:
 *   m/44'/0'/0'/0/0  → Bitcoin
 *   m/44'/60'/0'/0/0 → Ethereum
 *   m/44'/501'/0'/0' → Solana
 *   m/44'/1815'/0'/0/0 → Cardano (future)
 *   m/44'/118'/0'/0/0 → Cosmos/Open Chain
 *
 * The seed phrase is the master secret. It is encrypted by the PQC vault
 * and never stored in plaintext.
 */

import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { ChainId, KeyPair } from '../abstractions/types';

// BIP-44 coin types
const COIN_TYPES: Record<string, number> = {
  bitcoin: 0,
  ethereum: 60,
  solana: 501,
  cardano: 1815,
  cosmos: 118,
  openchain: 9999, // our custom coin type (will register with SLIP-44)
};

export interface HDWalletConfig {
  strength?: 128 | 256; // 12 or 24 words
}

export class HDWallet {
  private seed: Buffer | null = null;
  private mnemonic: string | null = null;

  /**
   * Generate a new wallet with a fresh mnemonic.
   * Default: 24 words (256-bit entropy) for maximum security.
   */
  static async generate(config?: HDWalletConfig): Promise<HDWallet> {
    const strength = config?.strength ?? 256;
    const mnemonic = bip39.generateMnemonic(strength);
    return HDWallet.fromMnemonic(mnemonic);
  }

  /**
   * Restore wallet from existing mnemonic phrase.
   */
  static async fromMnemonic(mnemonic: string): Promise<HDWallet> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    const wallet = new HDWallet();
    wallet.mnemonic = mnemonic;
    wallet.seed = await bip39.mnemonicToSeed(mnemonic) as unknown as Buffer;
    return wallet;
  }

  /**
   * Get the mnemonic phrase. Only call this when needed (e.g., backup).
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
    if (!this.seed) throw new Error('Wallet not initialized');

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}. Register coin type first.`);
    }

    // Solana uses hardened derivation at all levels
    if (chainId === 'solana') {
      return this.deriveSolanaKey(accountIndex);
    }

    const path = `m/44'/${coinType}'/${accountIndex}'/0/0`;
    const hdkey = HDKey.fromMasterSeed(Buffer.from(this.seed));
    const derived = hdkey.derive(path);

    if (!derived.privateKey || !derived.publicKey) {
      throw new Error('Key derivation failed');
    }

    return {
      publicKey: new Uint8Array(derived.publicKey),
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
    if (!this.seed) throw new Error('Wallet not initialized');

    const coinType = COIN_TYPES[chainId];
    if (coinType === undefined) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    if (chainId === 'solana') {
      // Solana uses Ed25519 with different derivation
      const path = `m/44'/501'/${accountIndex}'/0'`;
      const hdkey = HDKey.fromMasterSeed(Buffer.from(this.seed));
      const derived = hdkey.derive(path);
      if (!derived.privateKey) throw new Error('Key derivation failed');
      return new Uint8Array(derived.privateKey);
    }

    const path = `m/44'/${coinType}'/${accountIndex}'/0/0`;
    const hdkey = HDKey.fromMasterSeed(Buffer.from(this.seed));
    const derived = hdkey.derive(path);

    if (!derived.privateKey) throw new Error('Key derivation failed');
    return new Uint8Array(derived.privateKey);
  }

  private deriveSolanaKey(accountIndex: number): KeyPair {
    if (!this.seed) throw new Error('Wallet not initialized');

    const path = `m/44'/501'/${accountIndex}'/0'`;
    const hdkey = HDKey.fromMasterSeed(Buffer.from(this.seed));
    const derived = hdkey.derive(path);

    if (!derived.publicKey) throw new Error('Key derivation failed');

    return {
      publicKey: new Uint8Array(derived.publicKey),
      chainId: 'solana',
      address: '', // will be base58-encoded by Solana provider
      derivationPath: path,
    };
  }

  /**
   * Register a custom chain's coin type for BIP-44 derivation.
   * Used for new chains added in the future.
   */
  static registerCoinType(chainId: ChainId, coinType: number): void {
    COIN_TYPES[chainId] = coinType;
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
