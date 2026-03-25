/**
 * Token Registry — O(1) lookups via pre-built Maps.
 */

import type { Token, ChainId } from '../abstractions/types';

export interface TokenInfo extends Token {
  coingeckoId: string;
  isNative: boolean;
  color: string;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  { symbol: 'BTC', name: 'Bitcoin', chainId: 'bitcoin', decimals: 8, coingeckoId: 'bitcoin', isNative: true, color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', chainId: 'ethereum', decimals: 18, coingeckoId: 'ethereum', isNative: true, color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', chainId: 'solana', decimals: 9, coingeckoId: 'solana', isNative: true, color: '#9945ff' },
  { symbol: 'ADA', name: 'Cardano', chainId: 'cardano', decimals: 6, coingeckoId: 'cardano', isNative: true, color: '#0033ad' },
  { symbol: 'XRP', name: 'XRP', chainId: 'xrp', decimals: 6, coingeckoId: 'ripple', isNative: true, color: '#23292f' },
  { symbol: 'DOGE', name: 'Dogecoin', chainId: 'dogecoin', decimals: 8, coingeckoId: 'dogecoin', isNative: true, color: '#c3a634' },
  { symbol: 'DOT', name: 'Polkadot', chainId: 'polkadot', decimals: 10, coingeckoId: 'polkadot', isNative: true, color: '#e6007a' },
  { symbol: 'AVAX', name: 'Avalanche', chainId: 'avalanche', decimals: 18, coingeckoId: 'avalanche-2', isNative: true, color: '#e84142' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'ethereum', decimals: 18, contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA', coingeckoId: 'chainlink', isNative: false, color: '#2a5ada' },
  { symbol: 'SUI', name: 'Sui', chainId: 'sui', decimals: 9, coingeckoId: 'sui', isNative: true, color: '#4da2ff' },
  { symbol: 'POL', name: 'Polygon', chainId: 'polygon', decimals: 18, coingeckoId: 'matic-network', isNative: true, color: '#8247e5' },
  { symbol: 'BNB', name: 'BNB', chainId: 'bsc', decimals: 18, coingeckoId: 'binancecoin', isNative: true, color: '#f3ba2f' },
  { symbol: 'TON', name: 'Toncoin', chainId: 'ton', decimals: 9, coingeckoId: 'the-open-network', isNative: true, color: '#0098ea' },
  { symbol: 'USDT', name: 'Tether', chainId: 'ethereum', decimals: 6, contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', coingeckoId: 'tether', isNative: false, color: '#26a17b' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'ethereum', decimals: 6, contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', coingeckoId: 'usd-coin', isNative: false, color: '#2775ca' },
];

// Pre-built Maps for O(1) lookups
const TOKEN_MAP = new Map<string, TokenInfo>(SUPPORTED_TOKENS.map((t) => [t.symbol, t]));
const CHAIN_MAP = new Map<string, TokenInfo[]>();
SUPPORTED_TOKENS.forEach((t) => {
  const list = CHAIN_MAP.get(t.chainId) ?? [];
  list.push(t);
  CHAIN_MAP.set(t.chainId, list);
});
const COINGECKO_IDS_STR = SUPPORTED_TOKENS.map((t) => t.coingeckoId).join(',');

export const getToken = (symbol: string): TokenInfo | undefined => TOKEN_MAP.get(symbol);
export const getTokensForChain = (chainId: ChainId): TokenInfo[] => CHAIN_MAP.get(chainId) ?? [];
export const getNativeTokens = (): TokenInfo[] => SUPPORTED_TOKENS.filter((t) => t.isNative);
export const getCoingeckoIdsString = (): string => COINGECKO_IDS_STR;
