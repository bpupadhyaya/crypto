/**
 * Open Chain Provider — Server Implementation.
 *
 * Connects to Open Chain's CometBFT RPC and Cosmos REST API.
 * Handles OTK (Open Token) balance queries, transfers, and history.
 *
 * Uses standard Cosmos SDK REST endpoints:
 *   - /cosmos/bank/v1beta1/balances/{address} — balance
 *   - /cosmos/tx/v1beta1/txs — broadcast + history
 *   - /cosmos/base/tendermint/v1beta1/blocks/latest — block height
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
import { getNetworkConfig } from '../../network';

const OTK_TOKEN: Token = {
  symbol: 'OTK',
  name: 'Open Token',
  chainId: 'openchain',
  decimals: 6, // 1 OTK = 1,000,000 uotk
};

export class ServerOpenChainProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerOpenChainProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'staking'],
  };

  readonly chainId = 'openchain' as const;

  private get restUrl(): string {
    return getNetworkConfig().openchain.restUrl;
  }

  private get rpcUrl(): string {
    return getNetworkConfig().openchain.rpcUrl;
  }

  async getBalance(address: string, _token?: Token): Promise<Balance> {
    const response = await fetch(
      `${this.restUrl}/cosmos/bank/v1beta1/balances/${address}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      return { token: OTK_TOKEN, amount: 0n, usdValue: undefined };
    }

    const data = await response.json();
    const otkBalance = data.balances?.find((b: any) => b.denom === 'uotk');
    const amount = otkBalance ? BigInt(otkBalance.amount) : 0n;

    return {
      token: OTK_TOKEN,
      amount,
      usdValue: undefined,
    };
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    // Query txs sent by this address
    const sentUrl = `${this.restUrl}/cosmos/tx/v1beta1/txs?events=transfer.sender%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;
    // Query txs received by this address
    const recvUrl = `${this.restUrl}/cosmos/tx/v1beta1/txs?events=transfer.recipient%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;

    try {
      const [sentRes, recvRes] = await Promise.all([
        fetch(sentUrl, { signal: AbortSignal.timeout(10_000) }),
        fetch(recvUrl, { signal: AbortSignal.timeout(10_000) }),
      ]);

      const txs: Transaction[] = [];

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        for (const txResp of sentData.tx_responses ?? []) {
          txs.push(this.parseTxResponse(txResp, address));
        }
      }

      if (recvRes.ok) {
        const recvData = await recvRes.json();
        for (const txResp of recvData.tx_responses ?? []) {
          // Avoid duplicates
          if (!txs.find((t) => t.hash === txResp.txhash)) {
            txs.push(this.parseTxResponse(txResp, address));
          }
        }
      }

      return txs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    } catch {
      return [];
    }
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const response = await fetch(
        `${this.restUrl}/cosmos/tx/v1beta1/txs/${hash}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!response.ok) return null;

      const data = await response.json();
      return this.parseTxResponse(data.tx_response, '');
    } catch {
      return null;
    }
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    // Broadcast via Cosmos REST API
    const txBytes = Buffer.from(signedTx.rawTransaction).toString('base64');

    const response = await fetch(`${this.restUrl}/cosmos/tx/v1beta1/txs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_bytes: txBytes,
        mode: 'BROADCAST_MODE_SYNC',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Broadcast failed: ${error}`);
    }

    const data = await response.json();
    if (data.tx_response?.code !== 0) {
      throw new Error(`Tx failed: ${data.tx_response?.raw_log ?? 'Unknown error'}`);
    }

    return data.tx_response.txhash;
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    // Open Chain has near-zero fixed fees (per Human Constitution)
    // Default: 1000 uotk = 0.001 OTK
    return 1000n;
  }

  async getBlockHeight(): Promise<number> {
    try {
      const response = await fetch(
        `${this.restUrl}/cosmos/base/tendermint/v1beta1/blocks/latest`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!response.ok) return 0;

      const data = await response.json();
      return parseInt(data.block?.header?.height ?? '0', 10);
    } catch {
      return 0;
    }
  }

  isAddressValid(address: string): boolean {
    // Open Chain uses bech32 with 'openchain' prefix
    return /^openchain[a-z0-9]{39}$/.test(address);
  }

  private parseTxResponse(txResp: any, userAddress: string): Transaction {
    // Extract transfer events
    const events = txResp.events ?? txResp.logs?.[0]?.events ?? [];
    const transferEvent = events.find((e: any) => e.type === 'transfer');
    const attrs = transferEvent?.attributes ?? [];

    const sender = attrs.find((a: any) => a.key === 'sender')?.value ?? '';
    const recipient = attrs.find((a: any) => a.key === 'recipient')?.value ?? '';
    const amountStr = attrs.find((a: any) => a.key === 'amount')?.value ?? '0uotk';

    // Parse amount (e.g., "500000uotk" → 500000n)
    const amountMatch = amountStr.match(/^(\d+)/);
    const amount = amountMatch ? BigInt(amountMatch[1]) : 0n;

    return {
      id: txResp.txhash,
      chainId: 'openchain',
      from: sender,
      to: recipient,
      amount,
      token: OTK_TOKEN,
      fee: BigInt(txResp.gas_used ?? 0),
      status: txResp.code === 0 ? 'confirmed' : 'failed',
      timestamp: txResp.timestamp ? new Date(txResp.timestamp).getTime() : Date.now(),
      blockNumber: parseInt(txResp.height ?? '0', 10),
      hash: txResp.txhash,
    };
  }
}
