/**
 * Mobile Open Chain Provider — P2P Implementation.
 *
 * Implements IChainProvider but gets data from the P2P network
 * instead of a central server. Connects to CometBFT nodes running
 * on peer phones via the P2PManager.
 *
 * Data flow:
 *   Wallet → MobileOpenChainProvider → P2PManager → WebSocket → Peer's CometBFT
 *
 * No HTTP calls to external servers. All queries go through connected peers.
 */

import { IChainProvider } from '../../abstractions/interfaces';
import {
  Balance,
  Token,
  Transaction,
  SignedTransaction,
  ProviderMeta,
} from '../../abstractions/types';
import { P2PManager } from './p2p';

const OTK_TOKEN: Token = {
  symbol: 'OTK',
  name: 'Open Token',
  chainId: 'openchain',
  decimals: 6,
};

export class MobileOpenChainProvider implements IChainProvider {
  readonly meta: ProviderMeta = {
    name: 'MobileOpenChainProvider',
    backendType: 'mobile',
    version: '0.1.0',
    capabilities: ['balance', 'send', 'history', 'p2p'],
  };

  readonly chainId = 'openchain' as const;

  constructor(private p2p: P2PManager) {}

  async getBalance(address: string, _token?: Token): Promise<Balance> {
    const peerAddress = this.p2p.getBestPeerAddress();
    if (!peerAddress) {
      return { token: OTK_TOKEN, amount: 0n, usdValue: undefined };
    }

    try {
      const data = await this.p2p.queryAccountViaREST(address, peerAddress);
      if (!data) {
        return { token: OTK_TOKEN, amount: 0n, usdValue: undefined };
      }

      const otkBalance = data.balances?.find((b: any) => b.denom === 'uotk');
      const amount = otkBalance ? BigInt(otkBalance.amount) : 0n;

      return {
        token: OTK_TOKEN,
        amount,
        usdValue: undefined,
      };
    } catch {
      return { token: OTK_TOKEN, amount: 0n, usdValue: undefined };
    }
  }

  async broadcastTransaction(signedTx: SignedTransaction): Promise<string> {
    // Convert raw tx bytes to base64 for CometBFT broadcast
    const txBytes = this.uint8ArrayToBase64(signedTx.rawTransaction);
    await this.p2p.broadcastTransaction(txBytes);
    return signedTx.hash;
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<Transaction[]> {
    const peerAddress = this.p2p.getBestPeerAddress();
    if (!peerAddress) return [];

    try {
      const data = await this.p2p.queryTxHistoryViaREST(address, peerAddress, limit);
      if (!data) return [];

      const txs: Transaction[] = [];

      if (data.sent?.tx_responses) {
        for (const txResp of data.sent.tx_responses) {
          txs.push(this.parseTxResponse(txResp, address));
        }
      }

      if (data.received?.tx_responses) {
        for (const txResp of data.received.tx_responses) {
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
    const peerAddress = this.p2p.getBestPeerAddress();
    if (!peerAddress) return null;

    const restBase = peerAddress.replace(/:\d+$/, ':1317');
    try {
      const response = await fetch(
        `http://${restBase}/cosmos/tx/v1beta1/txs/${hash}`,
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!response.ok) return null;

      const data = await response.json();
      return this.parseTxResponse(data.tx_response, '');
    } catch {
      return null;
    }
  }

  async estimateFee(_from: string, _to: string, _amount: bigint): Promise<bigint> {
    // Open Chain has near-zero fixed fees (per Human Constitution)
    return 1000n;
  }

  async getBlockHeight(): Promise<number> {
    return this.p2p.getLatestHeight();
  }

  isAddressValid(address: string): boolean {
    return /^openchain[a-z0-9]{39}$/.test(address);
  }

  // ─── Private Helpers ───

  private parseTxResponse(txResp: any, _userAddress: string): Transaction {
    const events = txResp.events ?? txResp.logs?.[0]?.events ?? [];
    const transferEvent = events.find((e: any) => e.type === 'transfer');
    const attrs = transferEvent?.attributes ?? [];

    const sender = attrs.find((a: any) => a.key === 'sender')?.value ?? '';
    const recipient = attrs.find((a: any) => a.key === 'recipient')?.value ?? '';
    const amountStr = attrs.find((a: any) => a.key === 'amount')?.value ?? '0uotk';

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

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
