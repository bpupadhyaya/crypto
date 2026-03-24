/**
 * Token Registry — All supported tokens with chain and contract info.
 *
 * Users can enable/disable tokens from this list.
 * New tokens can be added dynamically.
 */

import type { Token, ChainId } from '../abstractions/types';

export interface TokenInfo extends Token {
  coingeckoId: string;
  isNative: boolean; // true for chain's native token (BTC, ETH, SOL, etc.)
  color: string; // brand color for UI
}

/**
 * Initial supported tokens — the 15 most popular + stablecoins.
 * Each maps to its native chain. ERC-20/SPL variants are separate entries.
 */
export const SUPPORTED_TOKENS: TokenInfo[] = [
  // ─── Native chain tokens ───
  {
    symbol: 'BTC', name: 'Bitcoin', chainId: 'bitcoin', decimals: 8,
    coingeckoId: 'bitcoin', isNative: true, color: '#f7931a',
  },
  {
    symbol: 'ETH', name: 'Ethereum', chainId: 'ethereum', decimals: 18,
    coingeckoId: 'ethereum', isNative: true, color: '#627eea',
  },
  {
    symbol: 'SOL', name: 'Solana', chainId: 'solana', decimals: 9,
    coingeckoId: 'solana', isNative: true, color: '#9945ff',
  },
  {
    symbol: 'ADA', name: 'Cardano', chainId: 'cardano', decimals: 6,
    coingeckoId: 'cardano', isNative: true, color: '#0033ad',
  },
  {
    symbol: 'XRP', name: 'XRP', chainId: 'xrp', decimals: 6,
    coingeckoId: 'ripple', isNative: true, color: '#23292f',
  },
  {
    symbol: 'DOGE', name: 'Dogecoin', chainId: 'dogecoin', decimals: 8,
    coingeckoId: 'dogecoin', isNative: true, color: '#c3a634',
  },
  {
    symbol: 'DOT', name: 'Polkadot', chainId: 'polkadot', decimals: 10,
    coingeckoId: 'polkadot', isNative: true, color: '#e6007a',
  },
  {
    symbol: 'AVAX', name: 'Avalanche', chainId: 'avalanche', decimals: 18,
    coingeckoId: 'avalanche-2', isNative: true, color: '#e84142',
  },
  {
    symbol: 'LINK', name: 'Chainlink', chainId: 'ethereum', decimals: 18,
    contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    coingeckoId: 'chainlink', isNative: false, color: '#2a5ada',
  },
  {
    symbol: 'SUI', name: 'Sui', chainId: 'sui', decimals: 9,
    coingeckoId: 'sui', isNative: true, color: '#4da2ff',
  },
  {
    symbol: 'POL', name: 'Polygon', chainId: 'polygon', decimals: 18,
    coingeckoId: 'matic-network', isNative: true, color: '#8247e5',
  },
  {
    symbol: 'BNB', name: 'BNB', chainId: 'bsc', decimals: 18,
    coingeckoId: 'binancecoin', isNative: true, color: '#f3ba2f',
  },
  {
    symbol: 'TON', name: 'Toncoin', chainId: 'ton', decimals: 9,
    coingeckoId: 'the-open-network', isNative: true, color: '#0098ea',
  },

  // ─── Stablecoins ───
  {
    symbol: 'USDT', name: 'Tether', chainId: 'ethereum', decimals: 6,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    coingeckoId: 'tether', isNative: false, color: '#26a17b',
  },
  {
    symbol: 'USDC', name: 'USD Coin', chainId: 'ethereum', decimals: 6,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    coingeckoId: 'usd-coin', isNative: false, color: '#2775ca',
  },
];

/**
 * Get token by symbol.
 */
export function getToken(symbol: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}

/**
 * Get all tokens for a specific chain.
 */
export function getTokensForChain(chainId: ChainId): TokenInfo[] {
  return SUPPORTED_TOKENS.filter((t) => t.chainId === chainId);
}

/**
 * Get all native chain tokens.
 */
export function getNativeTokens(): TokenInfo[] {
  return SUPPORTED_TOKENS.filter((t) => t.isNative);
}

/**
 * CoinGecko ID mapping for price fetching.
 */
export function getCoingeckoIds(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of SUPPORTED_TOKENS) {
    map[token.symbol] = token.coingeckoId;
  }
  return map;
}
