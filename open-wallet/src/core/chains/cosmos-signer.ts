/**
 * Cosmos Transaction Signer — using @cosmjs/stargate.
 *
 * Signs and broadcasts transactions on Cosmos SDK chains
 * (Open Chain, Cosmos Hub, Osmosis, etc.)
 * Private key never leaves the device.
 */

import { HDWallet } from '../wallet/hdwallet';
import { getNetworkConfig } from '../network';

export class CosmosSigner {
  private privateKey: Uint8Array;
  private chainId: string;
  private rpcUrl: string;
  private prefix: string;
  private denom: string;

  constructor(
    privateKey: Uint8Array,
    options: { chainId?: string; rpcUrl?: string; prefix?: string; denom?: string } = {}
  ) {
    this.privateKey = privateKey;
    const config = getNetworkConfig().openchain;
    this.chainId = options.chainId ?? config.chainId;
    this.rpcUrl = options.rpcUrl ?? config.rpcUrl;
    this.prefix = options.prefix ?? config.addressPrefix;
    this.denom = options.denom ?? 'uotk';
  }

  static fromWallet(
    wallet: HDWallet,
    accountIndex: number = 0,
    chain: 'openchain' | 'cosmos' = 'openchain'
  ): CosmosSigner {
    const privateKey = wallet.derivePrivateKey(chain, accountIndex);
    const config = getNetworkConfig();

    if (chain === 'openchain') {
      return new CosmosSigner(privateKey, {
        chainId: config.openchain.chainId,
        rpcUrl: config.openchain.rpcUrl,
        prefix: config.openchain.addressPrefix,
        denom: 'uotk',
      });
    }
    // Cosmos Hub
    return new CosmosSigner(privateKey, {
      chainId: 'cosmoshub-4',
      rpcUrl: 'https://rpc.cosmos.network',
      prefix: 'cosmos',
      denom: 'uatom',
    });
  }

  /**
   * Send native tokens (OTK or ATOM).
   */
  async sendTokens(toAddress: string, amount: string): Promise<string> {
    // Dynamic import to keep bundle small
    const { SigningStargateClient } = await import('@cosmjs/stargate');
    const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');

    // Create wallet from private key
    const wallet = await DirectSecp256k1Wallet.fromKey(this.privateKey, this.prefix);
    const [account] = await wallet.getAccounts();

    // Connect to chain
    const client = await SigningStargateClient.connectWithSigner(
      this.rpcUrl,
      wallet,
    );

    // Parse amount to micro units
    const microAmount = Math.round(parseFloat(amount) * 1_000_000).toString();

    // Send
    const result = await client.sendTokens(
      account.address,
      toAddress,
      [{ denom: this.denom, amount: microAmount }],
      { amount: [{ denom: this.denom, amount: '1000' }], gas: '200000' }, // near-zero fee
    );

    client.disconnect();

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }

    return result.transactionHash;
  }

  /**
   * Get the bech32 address for this key.
   */
  async getAddress(): Promise<string> {
    const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
    const wallet = await DirectSecp256k1Wallet.fromKey(this.privateKey, this.prefix);
    const [account] = await wallet.getAccounts();
    return account.address;
  }
}
