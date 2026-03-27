/**
 * Ethereum Transaction Signer — using viem.
 *
 * Constructs and signs EIP-1559 transactions locally.
 * Private key never leaves the device.
 */

import {
  createWalletClient,
  http,
  parseEther,
  type WalletClient,
  type Account,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { HDWallet } from '../wallet/hdwallet';
import { getNetworkConfig, isTestnet } from '../network';

export class EthereumSigner {
  private account: Account;
  private client: WalletClient;
  private chain;

  constructor(privateKey: Uint8Array, rpcUrl?: string) {
    const hexKey = ('0x' + Buffer.from(privateKey).toString('hex')) as `0x${string}`;
    this.account = privateKeyToAccount(hexKey);
    const config = getNetworkConfig().ethereum;
    this.chain = isTestnet() ? sepolia : mainnet;

    this.client = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(rpcUrl ?? config.rpcUrl, { timeout: 10_000 }),
    });
  }

  static fromWallet(wallet: HDWallet, accountIndex: number = 0, rpcUrl?: string): EthereumSigner {
    const privateKey = wallet.derivePrivateKey('ethereum', accountIndex);
    return new EthereumSigner(privateKey, rpcUrl);
  }

  getAddress(): string {
    return this.account.address;
  }

  async sendTransaction(to: string, amountEth: string): Promise<string> {
    const hash = await this.client.sendTransaction({
      account: this.account,
      to: to as `0x${string}`,
      value: parseEther(amountEth),
      chain: this.chain,
    });
    return hash;
  }

  async sendERC20(
    tokenAddress: string,
    to: string,
    amount: bigint,
  ): Promise<string> {
    const hash = await this.client.sendTransaction({
      account: this.account,
      to: tokenAddress as `0x${string}`,
      data: this.encodeERC20Transfer(to, amount),
      chain: this.chain,
    });
    return hash;
  }

  async signMessage(message: string): Promise<string> {
    return this.client.signMessage({
      account: this.account,
      message,
    });
  }

  /**
   * Approve a spender to use ERC-20 tokens.
   */
  async sendERC20Approval(tokenAddress: string, spender: string, amount: bigint): Promise<string> {
    // approve(address,uint256) selector = 0x095ea7b3
    const spenderBytes = spender.slice(2).padStart(64, '0');
    const amountBytes = amount.toString(16).padStart(64, '0');
    const data = `0x095ea7b3${spenderBytes}${amountBytes}` as `0x${string}`;

    const hash = await this.client.sendTransaction({
      account: this.account,
      to: tokenAddress as `0x${string}`,
      data,
      chain: this.chain,
    });
    return hash;
  }

  /**
   * Send a raw contract call (for THORChain router, etc.)
   */
  async sendContractCall(contractAddress: string, data: `0x${string}`, value?: string): Promise<string> {
    const hash = await this.client.sendTransaction({
      account: this.account,
      to: contractAddress as `0x${string}`,
      data,
      value: value ? BigInt(value) : 0n,
      chain: this.chain,
    });
    return hash;
  }

  private encodeERC20Transfer(to: string, amount: bigint): `0x${string}` {
    // transfer(address,uint256) selector = 0xa9059cbb
    const toBytes = to.slice(2).padStart(64, '0');
    const amountBytes = amount.toString(16).padStart(64, '0');
    return `0xa9059cbb${toBytes}${amountBytes}` as `0x${string}`;
  }
}
