/**
 * Mobile Bitcoin Provider — Configurable Endpoints.
 *
 * Connects to Bitcoin SPV peers or configurable Electrum/Mempool servers
 * instead of hardcoded public APIs. In full P2P mode, would run a
 * Neutrino/SPV light client directly on the phone.
 *
 * Supports:
 *   - Configurable Mempool.space / Blockstream API endpoints
 *   - Electrum server connections (future)
 *   - Fallback endpoint rotation
 */

import { IChainProvider } from '../../abstractions/interfaces';
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

export interface MobileBitcoinConfig {
  /** Primary API base URL (Mempool.space or Blockstream compatible) */
  apiBase: string;
  /** Fallback API endpoints */
  fallbackApiUrls?: string[];
  /** Electrum server addresses for future SPV mode: "host:port" */
  electrumServers?: string[];
  /** Connection timeout in ms */
  timeout?: number;
}

export class MobileBitcoinProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'MobileBitcoinProvider',
    backendType: 'mobile',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'utxo', 'configurable-endpoints'],
  };

  readonly chainId = 'bitcoin' as const;

  private apiBase: string;
  private fallbackApiUrls: string[];
  private timeout: number;

  constructor(config: MobileBitcoinConfig) {
    this.apiBase = config.apiBase;
    this.fallbackApiUrls = config.fallbackApiUrls ?? [];
    this.timeout = config.timeout ?? 10_000;
  }

  /** Switch to a different API endpoint at runtime */
  switchEndpoint(apiBase: string): void {
    this.apiBase = apiBase;
  }

  async getBalance(address: string, _token?: Token): Promise<Balance> {
    const data = await this.fetchWithFallback(`/address/${address}`);
    const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

    return {
      token: BTC_TOKEN,
      amount: BigInt(confirmed + unconfirmed),
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    try {
      const txs = await this.fetchWithFallback(`/address/${address}/txs`);

      return txs.slice(0, limit).map((tx: any) => ({
        id: tx.txid,
        chainId: 'bitcoin' as const,
        from: address,
        to: tx.vout?.[0]?.scriptpubkey_address ?? '',
        amount: BigInt(tx.vout?.[0]?.value ?? 0),
        token: BTC_TOKEN,
        fee: tx.fee ? BigInt(tx.fee) : undefined,
        status: tx.status.confirmed ? ('confirmed' as const) : ('pending' as const),
        timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
        blockNumber: tx.status.block_height,
        hash: tx.txid,
      }));
    } catch {
      return [];
    }
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const tx = await this.fetchWithFallback(`/tx/${hash}`);
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
    } catch {
      return null;
    }
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const hexTx = Array.from(signedTx.rawTransaction)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const urls = [this.apiBase, ...this.fallbackApiUrls];
    let lastError: Error | null = null;

    for (const base of urls) {
      try {
        const response = await fetch(`${base}/tx`, {
          method: 'POST',
          body: hexTx,
          signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Broadcast failed: ${error}`);
        }
        return response.text();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    throw lastError ?? new Error('All endpoints failed');
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    try {
      const fees = await this.fetchWithFallback('/v1/fees/recommended');
      const vbytes = 140;
      const satPerVbyte = fees.halfHourFee;
      return BigInt(vbytes * satPerVbyte);
    } catch {
      // Fallback: 10 sat/vbyte * 140 vbytes
      return 1400n;
    }
  }

  async getBlockHeight(): Promise<number> {
    try {
      const urls = [this.apiBase, ...this.fallbackApiUrls];
      for (const base of urls) {
        try {
          const response = await fetch(`${base}/blocks/tip/height`, {
            signal: AbortSignal.timeout(this.timeout),
          });
          if (response.ok) {
            return parseInt(await response.text(), 10);
          }
        } catch {
          continue;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }

  isAddressValid(address: string): boolean {
    // Mainnet
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
    if (/^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/.test(address)) return true;
    // Testnet
    if (/^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
    if (/^tb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,62}$/.test(address)) return true;
    return false;
  }

  // ─── Private: Fetch with Fallback ───

  private async fetchWithFallback(path: string): Promise<any> {
    const urls = [this.apiBase, ...this.fallbackApiUrls];
    let lastError: Error | null = null;

    for (const base of urls) {
      try {
        const response = await fetch(`${base}${path}`, {
          signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    throw lastError ?? new Error('All endpoints failed');
  }
}
