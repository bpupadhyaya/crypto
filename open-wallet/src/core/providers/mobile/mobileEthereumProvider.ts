/**
 * Mobile Ethereum Provider — Configurable RPC.
 *
 * Same pattern as server provider but with configurable RPC endpoints
 * instead of hardcoded public ones. In full P2P mode, would connect
 * to a local Helios light client running on the phone.
 *
 * Supports runtime endpoint switching and fallback chains for resilience.
 */

import {
  createPublicClient,
  http,
  isAddress,
  type PublicClient,
  type Chain,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { IChainProvider } from '../../abstractions/interfaces';
import {
  Balance,
  Token,
  Transaction,
  SignedTransaction,
  ProviderMeta,
} from '../../abstractions/types';

const ETH_TOKEN: Token = {
  symbol: 'ETH',
  name: 'Ethereum',
  chainId: 'ethereum',
  decimals: 18,
};

const erc20BalanceOfAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface MobileEthereumConfig {
  /** Primary RPC endpoint */
  rpcUrl: string;
  /** Fallback RPC endpoints */
  fallbackRpcUrls?: string[];
  /** Use testnet (Sepolia) */
  testnet?: boolean;
  /** Connection timeout in ms */
  timeout?: number;
  /** Etherscan-compatible API base URL for tx history */
  explorerApiUrl?: string;
}

export class MobileEthereumProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'MobileEthereumProvider',
    backendType: 'mobile',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'erc20', 'configurable-rpc'],
  };

  readonly chainId = 'ethereum' as const;

  private client: PublicClient;
  private fallbackClients: PublicClient[];
  private chain: Chain;
  private explorerApiUrl: string;
  private timeout: number;

  constructor(config: MobileEthereumConfig) {
    this.chain = config.testnet ? sepolia : mainnet;
    this.timeout = config.timeout ?? 10_000;
    this.explorerApiUrl = config.explorerApiUrl ??
      (config.testnet
        ? 'https://api-sepolia.etherscan.io/api'
        : 'https://api.etherscan.io/api');

    this.client = createPublicClient({
      chain: this.chain,
      transport: http(config.rpcUrl, { timeout: this.timeout }),
    });

    this.fallbackClients = (config.fallbackRpcUrls ?? []).map((url) =>
      createPublicClient({
        chain: this.chain,
        transport: http(url, { timeout: this.timeout }),
      })
    );
  }

  /** Switch to a different RPC endpoint at runtime */
  switchEndpoint(rpcUrl: string): void {
    this.client = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl, { timeout: this.timeout }),
    });
  }

  async getBalance(address: string, token?: Token): Promise<Balance> {
    if (!token || token.symbol === 'ETH') {
      const balance = await this.withFallback((c) =>
        c.getBalance({ address: address as `0x${string}` })
      );
      return { token: ETH_TOKEN, amount: balance, usdValue: undefined };
    }

    if (!token.contractAddress) {
      throw new Error(`No contract address for token ${token.symbol}`);
    }

    const balance = await this.withFallback((c) =>
      c.readContract({
        address: token.contractAddress as `0x${string}`,
        abi: erc20BalanceOfAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })
    );

    return { token, amount: balance, usdValue: undefined };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    try {
      const url = `${this.explorerApiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`;
      const response = await fetch(url, { signal: AbortSignal.timeout(this.timeout) });
      if (!response.ok) return [];

      const data = await response.json();
      if (data.status !== '1' || !Array.isArray(data.result)) return [];

      return data.result.map((tx: any) => ({
        id: tx.hash,
        chainId: 'ethereum' as const,
        from: tx.from,
        to: tx.to,
        amount: BigInt(tx.value),
        token: ETH_TOKEN,
        fee: BigInt(tx.gasUsed) * BigInt(tx.gasPrice),
        status: tx.txreceipt_status === '1' ? ('confirmed' as const) : ('failed' as const),
        timestamp: parseInt(tx.timeStamp, 10) * 1000,
        blockNumber: parseInt(tx.blockNumber, 10),
        hash: tx.hash,
      }));
    } catch {
      return [];
    }
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.withFallback((c) =>
      c.getTransaction({ hash: hash as `0x${string}` })
    );
    if (!tx) return null;

    const receipt = await this.withFallback((c) =>
      c.getTransactionReceipt({ hash: hash as `0x${string}` })
    );

    return {
      id: tx.hash,
      chainId: 'ethereum',
      from: tx.from,
      to: tx.to ?? '',
      amount: tx.value,
      token: ETH_TOKEN,
      fee: receipt ? receipt.gasUsed * receipt.effectiveGasPrice : undefined,
      status: receipt?.status === 'success' ? 'confirmed' : 'failed',
      timestamp: Date.now(),
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : undefined,
      hash: tx.hash,
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const hexTx = ('0x' +
      Array.from(signedTx.rawTransaction)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')) as `0x${string}`;

    const hash = await this.withFallback((c) =>
      c.sendRawTransaction({ serializedTransaction: hexTx })
    );
    return hash;
  }

  async estimateFee(from: string, to: string, amount: bigint, _token?: Token): Promise<bigint> {
    const gasEstimate = await this.withFallback((c) =>
      c.estimateGas({
        account: from as `0x${string}`,
        to: to as `0x${string}`,
        value: amount,
      })
    );
    const gasPrice = await this.withFallback((c) => c.getGasPrice());
    return gasEstimate * gasPrice;
  }

  async getBlockHeight(): Promise<number> {
    const block = await this.withFallback((c) => c.getBlockNumber());
    return Number(block);
  }

  isAddressValid(address: string): boolean {
    return isAddress(address);
  }

  // ─── Private: Fallback Logic ───

  private async withFallback<T>(fn: (client: PublicClient) => Promise<T>): Promise<T> {
    try {
      return await fn(this.client);
    } catch (primaryError) {
      for (const fallback of this.fallbackClients) {
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
