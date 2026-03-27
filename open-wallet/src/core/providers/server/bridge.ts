/**
 * Bridge Provider — Server Implementation (Li.Fi aggregator).
 *
 * Li.Fi aggregates 15+ bridges and finds the cheapest/fastest route:
 *   - Stargate, Across, Hop, Celer, Connext, Wormhole, etc.
 *   - Supports EVM ↔ EVM, EVM ↔ Solana, and BTC via wrapped assets
 *
 * For native BTC swaps (no wrapping), we also integrate THORChain.
 *
 * Will be replaced by MobileBridgeProvider when phones can run
 * relay networks via libp2p.
 */

import {
  IBridgeProvider,
} from '../../abstractions/interfaces';
import {
  ChainId,
  Token,
  Transaction,
  SwapQuote,
  ProviderMeta,
} from '../../abstractions/types';

const LIFI_API = 'https://li.quest/v1';

// Li.Fi chain IDs
const LIFI_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  base: 8453,
  solana: 1151111081099710,
};

// THORChain for native BTC swaps
const THORCHAIN_API = 'https://thornode.ninerealms.com/thorchain';

export class ServerBridgeProvider implements IBridgeProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerBridgeProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['cross-chain-swap', 'bridge-aggregation', 'native-btc-swap'],
  };

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getBridgeQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
  ): Promise<SwapQuote> {
    // Native BTC → use THORChain for trustless swap
    if (fromToken.chainId === 'bitcoin' || toToken.chainId === 'bitcoin') {
      return this.getThorChainQuote(fromToken, toToken, amount);
    }

    // EVM ↔ EVM or EVM ↔ Solana → use Li.Fi aggregator
    return this.getLiFiQuote(fromToken, toToken, amount);
  }

  async executeBridge(
    quote: SwapQuote,
    signerFn: (data: Uint8Array) => Promise<Uint8Array>,
  ): Promise<Transaction> {
    // Build bridge tx from quote, sign, broadcast
    throw new Error('executeBridge: wire to chain provider for signing + broadcast');
  }

  async getSupportedRoutes(): Promise<Array<{ from: ChainId; to: ChainId }>> {
    const chains = Object.keys(LIFI_CHAIN_IDS) as ChainId[];
    const routes: Array<{ from: ChainId; to: ChainId }> = [];

    // All EVM↔EVM and EVM↔Solana combinations
    for (const from of chains) {
      for (const to of chains) {
        if (from !== to) {
          routes.push({ from, to });
        }
      }
    }

    // BTC routes via THORChain
    routes.push({ from: 'bitcoin', to: 'ethereum' });
    routes.push({ from: 'ethereum', to: 'bitcoin' });
    routes.push({ from: 'bitcoin', to: 'cosmos' });
    routes.push({ from: 'cosmos', to: 'bitcoin' });

    // IBC routes (Open Chain ↔ Cosmos Hub)
    routes.push({ from: 'openchain', to: 'cosmos' });
    routes.push({ from: 'cosmos', to: 'openchain' });

    return routes;
  }

  async getBridgeStatus(txHash: string): Promise<'pending' | 'in_transit' | 'completed' | 'failed'> {
    const response = await fetch(`${LIFI_API}/status?txHash=${txHash}`);
    if (!response.ok) return 'pending';

    const data = await response.json();

    switch (data.status) {
      case 'DONE': return 'completed';
      case 'FAILED': return 'failed';
      case 'PENDING': return 'in_transit';
      default: return 'pending';
    }
  }

  // ─── Li.Fi Implementation ───

  private async getLiFiQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
  ): Promise<SwapQuote> {
    const fromChainId = LIFI_CHAIN_IDS[fromToken.chainId];
    const toChainId = LIFI_CHAIN_IDS[toToken.chainId];

    if (!fromChainId || !toChainId) {
      throw new Error(`Unsupported bridge route: ${fromToken.chainId} → ${toToken.chainId}`);
    }

    const fromAddress = fromToken.contractAddress ?? '0x0000000000000000000000000000000000000000';
    const toAddress = toToken.contractAddress ?? '0x0000000000000000000000000000000000000000';

    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString(),
      fromToken: fromAddress,
      toToken: toAddress,
      fromAmount: amount.toString(),
      order: 'CHEAPEST',
    });

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.apiKey) headers['x-lifi-api-key'] = this.apiKey;

    const response = await fetch(`${LIFI_API}/quote?${params}`, { headers });

    if (!response.ok) {
      throw new Error(`Li.Fi quote failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: BigInt(data.estimate?.toAmount ?? '0'),
      route: `${data.toolDetails?.name ?? 'Li.Fi'} (${data.estimate?.executionDuration ?? '?'}s)`,
      estimatedFeeUsd: parseFloat(data.estimate?.gasCosts?.[0]?.amountUSD ?? '0'),
      provider: 'lifi',
      expiresAt: Date.now() + 60_000, // 60 second validity for bridge quotes
      priceImpact: 0,
    };
  }

  // ─── THORChain Implementation (Native BTC swaps) ───

  private async getThorChainQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
  ): Promise<SwapQuote> {
    // THORChain asset notation
    const fromAsset = this.toThorAsset(fromToken);
    const toAsset = this.toThorAsset(toToken);

    const params = new URLSearchParams({
      from_asset: fromAsset,
      to_asset: toAsset,
      amount: amount.toString(),
    });

    const response = await fetch(`${THORCHAIN_API}/quote/swap?${params}`);

    if (!response.ok) {
      throw new Error(`THORChain quote failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: BigInt(data.expected_amount_out ?? '0'),
      route: `THORChain (native swap, ~${Math.ceil((data.outbound_delay_seconds ?? 600) / 60)}min)`,
      estimatedFeeUsd: parseFloat(data.fees?.total_bps ?? '0') / 100,
      provider: 'thorchain',
      expiresAt: Date.now() + 120_000, // 2 minute validity
      priceImpact: parseFloat(data.slip_bps ?? '0') / 100,
    };
  }

  private toThorAsset(token: Token): string {
    const map: Record<string, string> = {
      bitcoin: 'BTC.BTC',
      ethereum: 'ETH.ETH',
      cosmos: 'GAIA.ATOM',
    };

    if (token.contractAddress && token.chainId === 'ethereum') {
      return `ETH.${token.symbol}-${token.contractAddress}`;
    }

    return map[token.chainId] ?? `${token.chainId.toUpperCase()}.${token.symbol}`;
  }
}
