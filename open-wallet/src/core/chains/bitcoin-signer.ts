/**
 * Bitcoin Transaction Signer — using @scure/btc-signer.
 *
 * Supports all 4 standard address types:
 *   - Legacy P2PKH (1...)       — BIP-44: m/44'/0'/...
 *   - Wrapped Segwit P2SH (3...) — BIP-49: m/49'/0'/...
 *   - Native Segwit P2WPKH (bc1q...) — BIP-84: m/84'/0'/...
 *   - Taproot P2TR (bc1p...)    — BIP-86: m/86'/0'/...
 *
 * Flow:
 *   1. Fetch UTXOs from mempool.space API
 *   2. Select UTXOs (simple largest-first for now)
 *   3. Construct transaction with change output
 *   4. Sign locally with HD-derived private key
 *   5. Broadcast via chain provider
 */

import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';
import { HDWallet, BtcAddressType } from '../wallet/hdwallet';
import { getNetworkConfig, isTestnet } from '../network';

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

export type BtcPaymentType = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2tr';

export class BitcoinSigner {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;
  private paymentType: BtcPaymentType;

  constructor(privateKey: Uint8Array, publicKey: Uint8Array, paymentType: BtcPaymentType = 'p2wpkh') {
    this.privateKey = privateKey;
    if (publicKey.length !== 33) {
      throw new Error(`BTC public key must be 33 bytes (compressed), got ${publicKey.length}`);
    }
    this.publicKey = publicKey;
    this.paymentType = paymentType;
  }

  static fromWallet(wallet: HDWallet, accountIndex: number = 0): BitcoinSigner {
    const privateKey = wallet.derivePrivateKey('bitcoin', accountIndex);
    const keyPair = wallet.deriveKey('bitcoin', accountIndex);
    return new BitcoinSigner(privateKey, keyPair.publicKey);
  }

  /**
   * Create a BitcoinSigner for a specific address type using BIP-49/84/86 paths.
   */
  static fromWalletWithType(wallet: HDWallet, btcType: BtcAddressType, accountIndex: number = 0, addressIndex: number = 0): BitcoinSigner {
    const { privateKey, publicKey } = wallet.deriveBtcKey(btcType, accountIndex, addressIndex);
    const paymentType = BTC_TYPE_TO_PAYMENT[btcType];
    return new BitcoinSigner(privateKey, publicKey, paymentType);
  }

  /**
   * Create a BitcoinSigner from a raw private key (hex or WIF format).
   */
  static fromPrivateKey(key: string, paymentType: BtcPaymentType = 'p2wpkh'): BitcoinSigner {
    let privKeyBytes: Uint8Array;

    if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(key)) {
      // WIF format — decode using @scure/btc-signer
      const wifCoder = btc.WIF();
      privKeyBytes = wifCoder.decode(key);
    } else {
      // Hex format
      const hexStr = key.startsWith('0x') ? key.slice(2) : key;
      privKeyBytes = hex.decode(hexStr);
    }

    // Derive compressed public key from private key
    const { secp256k1 } = require('@noble/curves/secp256k1');
    const publicKey = secp256k1.getPublicKey(privKeyBytes, true); // compressed = true

    return new BitcoinSigner(privKeyBytes, publicKey, paymentType);
  }

  /**
   * Get address based on the payment type.
   */
  getAddress(): string {
    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;

    switch (this.paymentType) {
      case 'p2pkh': {
        const payment = btc.p2pkh(this.publicKey, network);
        return payment.address!;
      }
      case 'p2sh-p2wpkh': {
        const inner = btc.p2wpkh(this.publicKey, network);
        const payment = btc.p2sh(inner, network);
        return payment.address!;
      }
      case 'p2wpkh': {
        const payment = btc.p2wpkh(this.publicKey, network);
        return payment.address!;
      }
      case 'p2tr': {
        // Taproot uses the x-only public key (32 bytes, drop the 0x02/0x03 prefix)
        const xOnlyPubkey = this.publicKey.slice(1);
        const payment = btc.p2tr(xOnlyPubkey, undefined, network);
        return payment.address!;
      }
    }
  }

  /**
   * Get all 4 address types from the same key pair.
   * Useful for scanning which address type has funds.
   */
  getAllAddresses(): Record<BtcPaymentType, string> {
    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;
    const xOnlyPubkey = this.publicKey.slice(1);

    return {
      'p2pkh': btc.p2pkh(this.publicKey, network).address!,
      'p2sh-p2wpkh': btc.p2sh(btc.p2wpkh(this.publicKey, network), network).address!,
      'p2wpkh': btc.p2wpkh(this.publicKey, network).address!,
      'p2tr': btc.p2tr(xOnlyPubkey, undefined, network).address!,
    };
  }

  getPaymentType(): BtcPaymentType { return this.paymentType; }

  /**
   * Create and sign a Bitcoin transaction.
   * Returns the raw signed transaction bytes ready for broadcast.
   */
  async createTransaction(
    toAddress: string,
    amountSats: bigint,
    feeRateSatPerVbyte: number,
    memo?: string,  // Optional OP_RETURN memo (used for THORChain swaps)
  ): Promise<Uint8Array> {
    // 1. Fetch UTXOs
    const utxos = await this.fetchUTXOs();
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    // 2. Select UTXOs (simple algorithm: sort by value desc, accumulate)
    const sortedUtxos = utxos
      .filter((u) => u.status.confirmed)
      .sort((a, b) => b.value - a.value);

    let inputTotal = 0n;
    const selectedUtxos: UTXO[] = [];
    const estimatedSize = 140; // rough vbytes for 1-in-2-out P2WPKH
    const fee = BigInt(feeRateSatPerVbyte * estimatedSize);
    const needed = amountSats + fee;

    for (const utxo of sortedUtxos) {
      selectedUtxos.push(utxo);
      inputTotal += BigInt(utxo.value);
      if (inputTotal >= needed) break;
    }

    if (inputTotal < needed) {
      throw new Error(`Insufficient funds: have ${inputTotal} sats, need ${needed} sats`);
    }

    // 3. Build transaction
    const tx = new btc.Transaction();
    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;

    for (const utxo of selectedUtxos) {
      const inputData = this.buildInput(utxo);
      tx.addInput(inputData);
    }

    // Output to recipient
    tx.addOutputAddress(toAddress, amountSats, network);

    // OP_RETURN memo (for THORChain, atomic swaps, etc.)
    if (memo) {
      const memoBytes = new TextEncoder().encode(memo);
      const opReturnScript = new Uint8Array([0x6a, memoBytes.length, ...memoBytes]);
      tx.addOutput({ script: opReturnScript, amount: 0n });
    }

    // Change output (back to self)
    const change = inputTotal - amountSats - fee;
    if (change > 546n) { // dust threshold
      tx.addOutputAddress(this.getAddress(), change, network);
    }

    // 4. Sign
    tx.sign(this.privateKey);
    tx.finalize();

    return tx.extract();
  }

  private buildInput(utxo: UTXO): any {
    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;

    switch (this.paymentType) {
      case 'p2wpkh':
        return {
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: btc.p2wpkh(this.publicKey, network).script,
            amount: BigInt(utxo.value),
          },
        };
      case 'p2sh-p2wpkh': {
        const inner = btc.p2wpkh(this.publicKey, network);
        return {
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: btc.p2sh(inner, network).script,
            amount: BigInt(utxo.value),
          },
          redeemScript: inner.script,
        };
      }
      case 'p2pkh':
        return {
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: btc.p2pkh(this.publicKey, network).script,
            amount: BigInt(utxo.value),
          },
        };
      case 'p2tr': {
        const xOnlyPubkey = this.publicKey.slice(1);
        return {
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: btc.p2tr(xOnlyPubkey, undefined, network).script,
            amount: BigInt(utxo.value),
          },
        };
      }
    }
  }

  private async fetchUTXOs(): Promise<UTXO[]> {
    const address = this.getAddress();
    const apiBase = getNetworkConfig().bitcoin.apiBase;
    const response = await fetch(`${apiBase}/address/${address}/utxo`);
    if (!response.ok) throw new Error('Failed to fetch UTXOs');
    return response.json();
  }
}

// ─── Mapping helpers ───

const BTC_TYPE_TO_PAYMENT: Record<BtcAddressType, BtcPaymentType> = {
  'legacy': 'p2pkh',
  'wrapped-segwit': 'p2sh-p2wpkh',
  'native-segwit': 'p2wpkh',
  'taproot': 'p2tr',
};

/**
 * Scan for Bitcoin funds across all address types and address indices.
 * Returns all addresses that have UTXOs or transaction history.
 *
 * @param wallet HD wallet to scan
 * @param gapLimit Number of empty addresses to scan before stopping (BIP-44 standard: 20)
 * @param accountIndex Account index to scan (default 0)
 */
export async function scanBitcoinAddresses(
  wallet: HDWallet,
  gapLimit: number = 20,
  accountIndex: number = 0,
): Promise<Array<{
  address: string;
  type: BtcAddressType;
  path: string;
  addressIndex: number;
  balance: number;
}>> {
  const apiBase = getNetworkConfig().bitcoin.apiBase;
  const results: Array<{
    address: string;
    type: BtcAddressType;
    path: string;
    addressIndex: number;
    balance: number;
  }> = [];

  const types: BtcAddressType[] = ['legacy', 'wrapped-segwit', 'native-segwit', 'taproot'];

  for (const btcType of types) {
    let consecutiveEmpty = 0;

    for (let addrIdx = 0; addrIdx < 100 && consecutiveEmpty < gapLimit; addrIdx++) {
      const signer = BitcoinSigner.fromWalletWithType(wallet, btcType, accountIndex, addrIdx);
      const address = signer.getAddress();
      const { privateKey, path } = wallet.deriveBtcKey(btcType, accountIndex, addrIdx);

      try {
        const res = await fetch(`${apiBase}/address/${address}`);
        if (!res.ok) continue;
        const data = await res.json();

        const funded = (data.chain_stats?.funded_txo_sum ?? 0) > 0 ||
                       (data.mempool_stats?.funded_txo_sum ?? 0) > 0;
        const balance = (data.chain_stats?.funded_txo_sum ?? 0) - (data.chain_stats?.spent_txo_sum ?? 0);

        if (funded) {
          consecutiveEmpty = 0;
          results.push({ address, type: btcType, path, addressIndex: addrIdx, balance });
        } else {
          consecutiveEmpty++;
        }
      } catch {
        consecutiveEmpty++;
      }
    }
  }

  return results;
}
