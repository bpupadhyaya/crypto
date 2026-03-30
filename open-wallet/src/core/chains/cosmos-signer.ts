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
   * Send an IBC transfer (e.g. Open Chain ↔ Cosmos Hub).
   *
   * Uses MsgTransfer with a 10-minute timeout. The token arrives
   * on the destination chain once a relayer picks up the packet.
   */
  async sendIbcTransfer(
    toAddress: string,
    amount: string,
    sourceChannel: string,
    sourcePort: string = 'transfer',
  ): Promise<string> {
    const { SigningStargateClient } = await import('@cosmjs/stargate');
    const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');

    const wallet = await DirectSecp256k1Wallet.fromKey(this.privateKey, this.prefix);
    const [account] = await wallet.getAccounts();

    const client = await SigningStargateClient.connectWithSigner(
      this.rpcUrl,
      wallet,
    );

    const microAmount = Math.round(parseFloat(amount) * 1_000_000).toString();

    // Timeout 10 minutes from now, in nanoseconds
    const timeoutTimestampNs = BigInt(Date.now() + 600_000) * BigInt(1_000_000);

    const msg = {
      typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
      value: {
        sourcePort,
        sourceChannel,
        token: { denom: this.denom, amount: microAmount },
        sender: account.address,
        receiver: toAddress,
        timeoutHeight: { revisionNumber: BigInt(0), revisionHeight: BigInt(0) },
        timeoutTimestamp: timeoutTimestampNs,
      },
    };

    const fee = { amount: [{ denom: this.denom, amount: '2000' }], gas: '250000' };

    const result = await client.signAndBroadcast(account.address, [msg], fee, 'IBC transfer via Open Wallet');

    client.disconnect();

    if (result.code !== 0) {
      throw new Error(`IBC transfer failed: ${result.rawLog}`);
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

  /**
   * Sign and broadcast arbitrary Cosmos SDK messages.
   * Used by DEX swaps, order book, atomic swaps, and any custom module transactions.
   *
   * @param messages - Array of { typeUrl, value } messages (e.g., MsgSwap, MsgPlaceLimitOrder)
   * @param fee - Transaction fee { amount: [{ denom, amount }], gas: string }
   * @returns Transaction hash
   */
  async signAndBroadcast(
    messages: Array<{ typeUrl: string; value: any }>,
    fee: { amount: Array<{ denom: string; amount: string }>; gas: string },
  ): Promise<string> {
    const { SigningStargateClient } = await import('@cosmjs/stargate');
    const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
    const { Registry } = await import('@cosmjs/proto-signing');

    const wallet = await DirectSecp256k1Wallet.fromKey(this.privateKey, this.prefix);
    const [account] = await wallet.getAccounts();

    // Create a registry that accepts any message type (custom modules)
    const registry = new Registry();
    for (const msg of messages) {
      // Register each message type as a generic pass-through
      // The chain's module will decode it using its own proto definitions
      if (!registry.lookupType(msg.typeUrl)) {
        registry.register(msg.typeUrl, {
          encode: (value: any, writer: any) => {
            // Encode as JSON bytes for custom modules
            const jsonBytes = new TextEncoder().encode(JSON.stringify(value));
            writer.uint32(10).bytes(jsonBytes);
            return writer;
          },
          decode: (input: any) => input,
          fromPartial: (value: any) => value,
        } as any);
      }
    }

    const client = await SigningStargateClient.connectWithSigner(
      this.rpcUrl,
      wallet,
      { registry },
    );

    const result = await client.signAndBroadcast(
      account.address,
      messages,
      fee,
      'Open Wallet transaction',
    );

    client.disconnect();

    if (result.code !== 0) {
      throw new Error(`Transaction failed (code ${result.code}): ${result.rawLog}`);
    }

    return result.transactionHash;
  }
}
