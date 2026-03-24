/**
 * Bitcoin Chain Provider — Server Implementation.
 *
 * Uses public Bitcoin APIs (Blockstream/Mempool.space) for now.
 * Will be replaced by MobileBitcoinProvider when phones can run
 * SPV/Neutrino light clients with sufficient performance.
 */

import {
  IChainProvider,
} from '../../abstractions/interfaces';
import {
  Balance,
  Token,
  Transaction,
  SignedTransaction,
  ProviderMeta,
} from '../../abstractions/types';

const BTC_TOKEN: Token = {
  symbol: 'BTC',
  name: 'Bitcoin',
  chainId: 'bitcoin',
  decimals: 8,
};

// Using mempool.space API — open source, no API key needed
const API_BASE = 'https://mempool.space/api';

export class ServerBitcoinProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerBitcoinProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'utxo'],
  };

  readonly chainId = 'bitcoin' as const;

  async getBalance(address: string, _token?: Token): Promise<Balance> {
    const response = await fetch(`${API_BASE}/address/${address}`);
    if (!response.ok) throw new Error(`Failed to fetch balance for ${address}`);

    const data = await response.json();
    const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

    return {
      token: BTC_TOKEN,
      amount: BigInt(confirmed + unconfirmed),
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE}/address/${address}/txs`);
    if (!response.ok) return [];

    const txs = await response.json();

    return txs.slice(0, limit).map((tx: any) => ({
      id: tx.txid,
      chainId: 'bitcoin',
      from: address,
      to: tx.vout?.[0]?.scriptpubkey_address ?? '',
      amount: BigInt(tx.vout?.[0]?.value ?? 0),
      token: BTC_TOKEN,
      fee: tx.fee ? BigInt(tx.fee) : undefined,
      status: tx.status.confirmed ? 'confirmed' : 'pending',
      timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
      blockNumber: tx.status.block_height,
      hash: tx.txid,
    }));
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const response = await fetch(`${API_BASE}/tx/${hash}`);
    if (!response.ok) return null;

    const tx = await response.json();

    return {
      id: tx.txid,
      chainId: 'bitcoin',
      from: tx.vin?.[0]?.prevout?.scriptpubkey_address ?? '',
      to: tx.vout?.[0]?.scriptpubkey_address ?? '',
      amount: BigInt(tx.vout?.[0]?.value ?? 0),
      token: BTC_TOKEN,
      fee: tx.fee ? BigInt(tx.fee) : undefined,
      status: tx.status.confirmed ? 'confirmed' : 'pending',
      timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
      blockNumber: tx.status.block_height,
      hash: tx.txid,
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const hexTx = Buffer.from(signedTx.rawTransaction).toString('hex');
    const response = await fetch(`${API_BASE}/tx`, {
      method: 'POST',
      body: hexTx,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Broadcast failed: ${error}`);
    }

    return response.text(); // returns txid
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    const response = await fetch(`${API_BASE}/v1/fees/recommended`);
    if (!response.ok) throw new Error('Failed to fetch fee estimates');

    const fees = await response.json();
    // Estimate for a standard P2WPKH transaction (~140 vbytes)
    const vbytes = 140;
    const satPerVbyte = fees.halfHourFee;
    return BigInt(vbytes * satPerVbyte);
  }

  async getBlockHeight(): Promise<number> {
    const response = await fetch(`${API_BASE}/blocks/tip/height`);
    if (!response.ok) throw new Error('Failed to fetch block height');
    return parseInt(await response.text(), 10);
  }

  isAddressValid(address: string): boolean {
    // Basic validation — supports legacy, segwit, and taproot
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true; // Legacy
    if (/^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/.test(address)) return true; // Bech32/Bech32m
    return false;
  }
}
