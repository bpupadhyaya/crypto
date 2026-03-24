/**
 * Ethereum Chain Provider — Server Implementation.
 *
 * Uses ethers.js with JSON-RPC provider (Infura/Alchemy/public nodes).
 * Will be replaced by MobileEthereumProvider when phones can run
 * light clients with sufficient performance.
 */

import { ethers } from 'ethers';
import {
  IChainProvider,
  IDexProvider,
} from '../../abstractions/interfaces';
import {
  Balance,
  Token,
  Transaction,
  SwapQuote,
  SignedTransaction,
  ProviderMeta,
} from '../../abstractions/types';

const ETH_TOKEN: Token = {
  symbol: 'ETH',
  name: 'Ethereum',
  chainId: 'ethereum',
  decimals: 18,
};

export class ServerEthereumProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerEthereumProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'erc20'],
  };

  readonly chainId = 'ethereum' as const;
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl?: string) {
    // Default to public endpoint; user should configure their own
    this.provider = new ethers.JsonRpcProvider(
      rpcUrl ?? 'https://eth.llamarpc.com'
    );
  }

  async getBalance(address: string, token?: Token): Promise<Balance> {
    if (!token || token.symbol === 'ETH') {
      const balance = await this.provider.getBalance(address);
      return {
        token: ETH_TOKEN,
        amount: balance,
        usdValue: undefined, // oracle provider handles pricing
      };
    }

    // ERC-20 token balance
    if (!token.contractAddress) {
      throw new Error(`No contract address for token ${token.symbol}`);
    }

    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(token.contractAddress, abi, this.provider);
    const balance = await contract.balanceOf(address);

    return {
      token,
      amount: balance,
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, _limit?: number): Promise<Transaction[]> {
    // Basic implementation — in production, use an indexer like Etherscan API
    // This is intentionally simple; the indexer will be a separate provider
    return [];
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const tx = await this.provider.getTransaction(hash);
    if (!tx) return null;

    const receipt = await tx.wait();

    return {
      id: tx.hash,
      chainId: 'ethereum',
      from: tx.from,
      to: tx.to ?? '',
      amount: tx.value,
      token: ETH_TOKEN,
      fee: receipt ? receipt.gasUsed * receipt.gasPrice : undefined,
      status: receipt?.status === 1 ? 'confirmed' : 'failed',
      timestamp: Date.now(),
      blockNumber: receipt?.blockNumber,
      hash: tx.hash,
    };
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    const hexTx = '0x' + Buffer.from(signedTx.rawTransaction).toString('hex');
    const response = await this.provider.broadcastTransaction(hexTx);
    return response.hash;
  }

  async estimateFee(from: string, to: string, amount: bigint, _token?: Token): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    const gasEstimate = await this.provider.estimateGas({
      from,
      to,
      value: amount,
    });
    const gasPrice = feeData.gasPrice ?? BigInt(0);
    return gasEstimate * gasPrice;
  }

  async getBlockHeight(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  isAddressValid(address: string): boolean {
    return ethers.isAddress(address);
  }
}
