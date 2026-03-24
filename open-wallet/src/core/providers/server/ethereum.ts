/**
 * Ethereum Chain Provider — Server Implementation (viem).
 *
 * Uses viem (modern, type-safe, tree-shakeable) instead of ethers.js.
 * viem is ~35x faster for ABI encoding and 30% lighter.
 *
 * Will be replaced by MobileEthereumProvider when phones can run
 * Helios light client with sufficient performance.
 */

import {
  createPublicClient,
  http,
  formatEther,
  parseEther,
  isAddress,
  type PublicClient,
  type Chain,
} from 'viem';
import { mainnet } from 'viem/chains';
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

const ETH_TOKEN: Token = {
  symbol: 'ETH',
  name: 'Ethereum',
  chainId: 'ethereum',
  decimals: 18,
};

// ERC-20 balanceOf ABI fragment
const erc20BalanceOfAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export class ServerEthereumProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerEthereumProvider',
    backendType: 'server',
    version: '0.2.0',
    capabilities: ['balance', 'send', 'history', 'erc20'],
  };

  readonly chainId = 'ethereum' as const;
  private client: PublicClient;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl ?? 'https://eth.llamarpc.com'),
    });
  }

  async getBalance(address: string, token?: Token): Promise<Balance> {
    if (!token || token.symbol === 'ETH') {
      const balance = await this.client.getBalance({
        address: address as `0x${string}`,
      });
      return {
        token: ETH_TOKEN,
        amount: balance,
        usdValue: undefined,
      };
    }

    // ERC-20 token balance
    if (!token.contractAddress) {
      throw new Error(`No contract address for token ${token.symbol}`);
    }

    const balance = await this.client.readContract({
      address: token.contractAddress as `0x${string}`,
      abi: erc20BalanceOfAbi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    return {
      token,
      amount: balance,
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, _limit?: number): Promise<Transaction[]> {
    // viem doesn't have built-in tx history — requires indexer (Etherscan, Alchemy)
    // This will be a separate IndexerProvider in production
    return [];
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.client.getTransaction({
      hash: hash as `0x${string}`,
    });
    if (!tx) return null;

    const receipt = await this.client.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });

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
    const hexTx = ('0x' + Buffer.from(signedTx.rawTransaction).toString('hex')) as `0x${string}`;
    const hash = await this.client.sendRawTransaction({
      serializedTransaction: hexTx,
    });
    return hash;
  }

  async estimateFee(from: string, to: string, amount: bigint, _token?: Token): Promise<bigint> {
    const gasEstimate = await this.client.estimateGas({
      account: from as `0x${string}`,
      to: to as `0x${string}`,
      value: amount,
    });
    const gasPrice = await this.client.getGasPrice();
    return gasEstimate * gasPrice;
  }

  async getBlockHeight(): Promise<number> {
    const block = await this.client.getBlockNumber();
    return Number(block);
  }

  isAddressValid(address: string): boolean {
    return isAddress(address);
  }
}
