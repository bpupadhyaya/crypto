/**
 * Solana Chain Provider — Server Implementation.
 *
 * Uses @solana/web3.js with JSON-RPC endpoint.
 * Will be replaced by MobileSolanaProvider when phones can run
 * Solana light clients (TinyDancer or similar).
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
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

const SOL_TOKEN: Token = {
  symbol: 'SOL',
  name: 'Solana',
  chainId: 'solana',
  decimals: 9,
};

export class ServerSolanaProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerSolanaProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'spl-tokens'],
  };

  readonly chainId = 'solana' as const;
  private connection: Connection;

  constructor(rpcUrl?: string) {
    this.connection = new Connection(
      rpcUrl ?? clusterApiUrl('mainnet-beta'),
      'confirmed'
    );
  }

  async getBalance(address: string, token?: Token): Promise<Balance> {
    const pubkey = new PublicKey(address);

    if (!token || token.symbol === 'SOL') {
      const balance = await this.connection.getBalance(pubkey);
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

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      pubkey,
      { mint: new PublicKey(token.contractAddress) }
    );

    const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.amount ?? '0';

    return {
      token,
      amount: BigInt(balance),
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    const pubkey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });

    return signatures.map((sig) => ({
      id: sig.signature,
      chainId: 'solana' as const,
      from: address,
      to: '', // would need to parse full tx for recipient
      amount: BigInt(0),
      token: SOL_TOKEN,
      status: sig.err ? 'failed' as const : 'confirmed' as const,
      timestamp: (sig.blockTime ?? 0) * 1000,
      blockNumber: sig.slot,
      hash: sig.signature,
    }));
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.connection.getParsedTransaction(hash);
    if (!tx) return null;

    return {
      id: hash,
      chainId: 'solana',
      from: tx.transaction.message.accountKeys[0]?.pubkey.toString() ?? '',
      to: tx.transaction.message.accountKeys[1]?.pubkey.toString() ?? '',
      amount: BigInt(0), // would need to parse instructions
      token: SOL_TOKEN,
      fee: BigInt(tx.meta?.fee ?? 0),
      status: tx.meta?.err ? 'failed' : 'confirmed',
      timestamp: (tx.blockTime ?? 0) * 1000,
      blockNumber: tx.slot,
      hash,
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const signature = await this.connection.sendRawTransaction(
      signedTx.rawTransaction,
      { skipPreflight: false }
    );
    return signature;
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    // Solana has relatively fixed fees
    const fees = await this.connection.getRecentPrioritizationFees();
    const baseFee = 5000n; // 5000 lamports base
    const priorityFee = fees.length > 0
      ? BigInt(Math.max(...fees.map(f => f.prioritizationFee)))
      : 0n;
    return baseFee + priorityFee;
  }

  async getBlockHeight(): Promise<number> {
    return this.connection.getSlot();
  }

  isAddressValid(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}
