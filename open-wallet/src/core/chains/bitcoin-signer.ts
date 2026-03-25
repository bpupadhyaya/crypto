/**
 * Bitcoin Transaction Signer — using @scure/btc-signer.
 *
 * Constructs and signs P2WPKH (native segwit) transactions locally.
 * Uses audited @scure libraries (same family as viem's noble-curves).
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
import { HDWallet } from '../wallet/hdwallet';
import { getNetworkConfig, isTestnet } from '../network';

interface UTXO {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

export class BitcoinSigner {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;

  constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    // Must be 33-byte compressed SEC1 public key (from HD derivation)
    // NOT 32-byte Schnorr key — p2wpkh requires compressed format
    if (publicKey.length !== 33) {
      throw new Error(`BTC public key must be 33 bytes (compressed), got ${publicKey.length}`);
    }
    this.publicKey = publicKey;
  }

  static fromWallet(wallet: HDWallet, accountIndex: number = 0): BitcoinSigner {
    const privateKey = wallet.derivePrivateKey('bitcoin', accountIndex);
    const keyPair = wallet.deriveKey('bitcoin', accountIndex);
    return new BitcoinSigner(privateKey, keyPair.publicKey);
  }

  /**
   * Get the P2WPKH (native segwit) address.
   * Returns bc1q... on mainnet, tb1q... on testnet.
   */
  getAddress(): string {
    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;
    const payment = btc.p2wpkh(this.publicKey, network);
    return payment.address!;
  }

  /**
   * Create and sign a Bitcoin transaction.
   * Returns the raw signed transaction bytes ready for broadcast.
   */
  async createTransaction(
    toAddress: string,
    amountSats: bigint,
    feeRateSatPerVbyte: number,
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

    for (const utxo of selectedUtxos) {
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: btc.p2wpkh(this.publicKey).script,
          amount: BigInt(utxo.value),
        },
      });
    }

    const network = isTestnet() ? btc.TEST_NETWORK : btc.NETWORK;

    // Output to recipient
    tx.addOutputAddress(toAddress, amountSats, network);

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

  private async fetchUTXOs(): Promise<UTXO[]> {
    const address = this.getAddress();
    const apiBase = getNetworkConfig().bitcoin.apiBase;
    const response = await fetch(`${apiBase}/address/${address}/utxo`);
    if (!response.ok) throw new Error('Failed to fetch UTXOs');
    return response.json();
  }
}
