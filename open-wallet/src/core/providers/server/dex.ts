/**
 * DEX Aggregator Provider — Server Implementation.
 *
 * Routes through the best available DEX for each chain:
 *   - EVM chains: 1inch Aggregation Protocol (best prices across 300+ DEXs)
 *   - Solana: Jupiter Aggregator (best prices across Solana DEXs)
 *   - Cross-chain: delegates to BridgeProvider
 *
 * Will be replaced by MobileDexProvider when phones can run
 * local AMM computation and P2P order matching.
 */

import {
  IDexProvider,
} from '../../abstractions/interfaces';
import {
  ChainId,
  Token,
  Transaction,
  SwapQuote,
  ProviderMeta,
} from '../../abstractions/types';

// ─── 1inch API (EVM chains) ───

const ONEINCH_API = 'https://api.1inch.dev/swap/v6.0';
const ONEINCH_CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  base: 8453,
};

// ─── Jupiter API (Solana) ───

const JUPITER_API = 'https://quote-api.jup.ag/v6';

// ─── Well-known stablecoin addresses ───

const USDC_ADDRESSES: Record<string, string> = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

const USDT_ADDRESSES: Record<string, string> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

export class ServerDexProvider implements IDexProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerDexProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['swap', 'quote', 'multi-dex-aggregation'],
  };

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
    slippageBps: number = 50,
  ): Promise<SwapQuote> {
    // Same chain → DEX swap
    if (fromToken.chainId === toToken.chainId) {
      if (fromToken.chainId === 'solana') {
        return this.getJupiterQuote(fromToken, toToken, amount, slippageBps);
      }
      if (ONEINCH_CHAIN_IDS[fromToken.chainId]) {
        return this.get1inchQuote(fromToken, toToken, amount, slippageBps);
      }
    }

    // Cross-chain → needs bridge (throw to indicate bridge needed)
    throw new Error(
      `Cross-chain swap ${fromToken.chainId}→${toToken.chainId} requires bridge provider`
    );
  }

  async executeSwap(
    quote: SwapQuote,
    signerFn: (data: Uint8Array) => Promise<Uint8Array>,
  ): Promise<Transaction> {
    // Build the swap transaction from the quote, sign it, and broadcast
    // Implementation depends on chain — delegated to chain provider
    throw new Error('executeSwap: wire to chain provider for signing + broadcast');
  }

  async getSupportedTokens(chainId: ChainId): Promise<Token[]> {
    if (chainId === 'solana') {
      return this.getJupiterTokens();
    }

    const evmChainId = ONEINCH_CHAIN_IDS[chainId];
    if (evmChainId) {
      return this.get1inchTokens(evmChainId, chainId);
    }

    return [];
  }

  async getTokenPrice(token: Token): Promise<number> {
    // Delegate to oracle provider — this is a convenience method
    return 0;
  }

  // ─── 1inch Implementation ───

  private async get1inchQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
    slippageBps: number,
  ): Promise<SwapQuote> {
    const chainId = ONEINCH_CHAIN_IDS[fromToken.chainId];
    const fromAddress = fromToken.contractAddress ?? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // native
    const toAddress = toToken.contractAddress ?? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    const params = new URLSearchParams({
      src: fromAddress,
      dst: toAddress,
      amount: amount.toString(),
      includeGas: 'true',
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${ONEINCH_API}/${chainId}/quote?${params}`, { headers });

    if (!response.ok) {
      throw new Error(`1inch quote failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: BigInt(data.dstAmount),
      route: `1inch (${data.protocols?.length ?? 0} routes)`,
      estimatedFeeUsd: parseFloat(data.gas ?? '0') * 0.00003, // rough estimate
      provider: '1inch',
      expiresAt: Date.now() + 30_000, // 30 second validity
      priceImpact: 0, // 1inch doesn't always return this
    };
  }

  private async get1inchTokens(chainId: number, ourChainId: ChainId): Promise<Token[]> {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(`${ONEINCH_API}/${chainId}/tokens`, { headers });
    if (!response.ok) return [];

    const data = await response.json();
    const tokens = data.tokens ?? {};

    return Object.values(tokens).slice(0, 100).map((t: any) => ({
      symbol: t.symbol,
      name: t.name,
      chainId: ourChainId,
      decimals: t.decimals,
      contractAddress: t.address,
      logoUri: t.logoURI,
    }));
  }

  // ─── Jupiter Implementation ───

  private async getJupiterQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
    slippageBps: number,
  ): Promise<SwapQuote> {
    const fromMint = fromToken.contractAddress ?? 'So11111111111111111111111111111111111111112'; // SOL
    const toMint = toToken.contractAddress ?? 'So11111111111111111111111111111111111111112';

    const params = new URLSearchParams({
      inputMint: fromMint,
      outputMint: toMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JUPITER_API}/quote?${params}`);

    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: BigInt(data.outAmount),
      route: `Jupiter (${data.routePlan?.length ?? 0} hops)`,
      estimatedFeeUsd: 0.001, // Solana fees are negligible
      provider: 'jupiter',
      expiresAt: Date.now() + 30_000,
      priceImpact: parseFloat(data.priceImpactPct ?? '0'),
    };
  }

  private async getJupiterTokens(): Promise<Token[]> {
    const response = await fetch('https://token.jup.ag/strict');
    if (!response.ok) return [];

    const tokens = await response.json();

    return tokens.slice(0, 100).map((t: any) => ({
      symbol: t.symbol,
      name: t.name,
      chainId: 'solana' as ChainId,
      decimals: t.decimals,
      contractAddress: t.address,
      logoUri: t.logoURI,
    }));
  }
}
