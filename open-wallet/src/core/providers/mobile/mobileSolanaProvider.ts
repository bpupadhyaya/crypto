/**
 * Mobile Solana Provider — Configurable RPC.
 *
 * For Solana in P2P mode, connects to configurable RPC endpoints
 * instead of hardcoded public ones. In full P2P, would connect to
 * a local Solana light client (TinyDancer) or directly to known
 * validator IPs.
 *
 * Currently falls back to direct RPC with user-configurable endpoints,
 * removing dependency on default public infrastructure.
 */

import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { IChainProvider } from '../../abstractions/interfaces';
import {
  Balance,
  Token,
  Transaction,
  SignedTransaction,
  ProviderMeta,
} from '../../abstractions/types';

const SOL_TOKEN: Token = {
  symbol: 'SOL',
  name: 'Solana',
  chainId: 'solana',
  decimals: 9,
};

export interface MobileSolanaConfig {
  /** Primary RPC endpoint (user-configurable) */
  rpcUrl: string;
  /** Fallback RPC endpoints */
  fallbackRpcUrls?: string[];
  /** Connection timeout in ms */
  timeout?: number;
}

export class MobileSolanaProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'MobileSolanaProvider',
    backendType: 'mobile',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'configurable-rpc'],
  };

  readonly chainId = 'solana' as const;

  private connection: Connection;
  private fallbackConnections: Connection[];
  private timeout: number;

  constructor(config: MobileSolanaConfig) {
    this.timeout = config.timeout ?? 10_000;
    this.connection = new Connection(config.rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: this.timeout,
    });
    this.fallbackConnections = (config.fallbackRpcUrls ?? []).map(
      (url) => new Connection(url, { commitment: 'confirmed' })
    );
  }

  /** Switch to a different RPC endpoint at runtime */
  switchEndpoint(rpcUrl: string): void {
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: this.timeout,
    });
  }

  async getBalance(address: string, token?: Token): Promise<Balance> {
    const pubkey = new PublicKey(address);

    if (!token || token.symbol === 'SOL') {
      const balance = await this.withFallback((conn) => conn.getBalance(pubkey));
      return {
        token: SOL_TOKEN,
        amount: BigInt(balance),
        usdValue: undefined,
      };
    }

    // SPL token balance
    if (!token.contractAddress) {
      throw new Error(`No contract address for token ${token.symbol}`);
    }

    const tokenAccounts = await this.withFallback((conn) =>
      conn.getParsedTokenAccountsByOwner(pubkey, {
        mint: new PublicKey(token.contractAddress!),
      })
    );

    const balance =
      tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.amount ?? '0';

    return {
      token,
      amount: BigInt(balance),
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    const pubkey = new PublicKey(address);
    const signatures = await this.withFallback((conn) =>
      conn.getSignaturesForAddress(pubkey, { limit })
    );

    return signatures.map((sig) => ({
      id: sig.signature,
      chainId: 'solana' as const,
      from: address,
      to: '',
      amount: BigInt(0),
      token: SOL_TOKEN,
      status: sig.err ? ('failed' as const) : ('confirmed' as const),
      timestamp: (sig.blockTime ?? 0) * 1000,
      blockNumber: sig.slot,
      hash: sig.signature,
    }));
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.withFallback((conn) => conn.getParsedTransaction(hash));
    if (!tx) return null;

    return {
      id: hash,
      chainId: 'solana',
      from: tx.transaction.message.accountKeys[0]?.pubkey.toString() ?? '',
      to: tx.transaction.message.accountKeys[1]?.pubkey.toString() ?? '',
      amount: BigInt(0),
      token: SOL_TOKEN,
      fee: BigInt(tx.meta?.fee ?? 0),
      status: tx.meta?.err ? 'failed' : 'confirmed',
      timestamp: (tx.blockTime ?? 0) * 1000,
      blockNumber: tx.slot,
      hash,
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const signature = await this.withFallback((conn) =>
      conn.sendRawTransaction(signedTx.rawTransaction, { skipPreflight: false })
    );
    return signature;
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    const fees = await this.withFallback((conn) => conn.getRecentPrioritizationFees());
    const baseFee = 5000n;
    const priorityFee =
      fees.length > 0 ? BigInt(Math.max(...fees.map((f) => f.prioritizationFee))) : 0n;
    return baseFee + priorityFee;
  }

  async getBlockHeight(): Promise<number> {
    return this.withFallback((conn) => conn.getSlot());
  }

  isAddressValid(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private: Fallback Logic ───

  private async withFallback<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    try {
      return await fn(this.connection);
    } catch (primaryError) {
      // Try fallback connections
      for (const fallback of this.fallbackConnections) {
        try {
          return await fn(fallback);
        } catch {
          continue;
        }
      }
      throw primaryError;
    }
  }
}
