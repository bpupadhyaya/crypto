/**
 * Token Metadata Service — comprehensive token information for all supported tokens.
 *
 * Provides: symbol, name, chain, decimals, icon placeholder, coingecko ID,
 * contract address (if applicable), and category.
 */

export interface TokenMetadata {
  symbol: string;
  name: string;
  chain: string;
  chains: string[];
  decimals: number;
  icon: string; // emoji placeholder
  coingeckoId: string;
  contractAddress?: string;
  category: 'native' | 'stablecoin' | 'defi' | 'otk' | 'wrapped';
}

export const TOKEN_METADATA: Record<string, TokenMetadata> = {
  // Native chains
  BTC: { symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', chains: ['bitcoin'], decimals: 8, icon: 'B', coingeckoId: 'bitcoin', category: 'native' },
  ETH: { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', chains: ['ethereum'], decimals: 18, icon: 'E', coingeckoId: 'ethereum', category: 'native' },
  SOL: { symbol: 'SOL', name: 'Solana', chain: 'solana', chains: ['solana'], decimals: 9, icon: 'S', coingeckoId: 'solana', category: 'native' },
  ATOM: { symbol: 'ATOM', name: 'Cosmos Hub', chain: 'cosmos', chains: ['cosmos'], decimals: 6, icon: 'A', coingeckoId: 'cosmos', category: 'native' },

  // OTK ecosystem
  OTK: { symbol: 'OTK', name: 'Open Token', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'O', coingeckoId: '', category: 'otk' },
  nOTK: { symbol: 'nOTK', name: 'Nurture OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'n', coingeckoId: '', category: 'otk' },
  eOTK: { symbol: 'eOTK', name: 'Education OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'e', coingeckoId: '', category: 'otk' },
  hOTK: { symbol: 'hOTK', name: 'Health OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'h', coingeckoId: '', category: 'otk' },
  cOTK: { symbol: 'cOTK', name: 'Community OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'c', coingeckoId: '', category: 'otk' },
  xOTK: { symbol: 'xOTK', name: 'Economic OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'x', coingeckoId: '', category: 'otk' },
  gOTK: { symbol: 'gOTK', name: 'Governance OTK', chain: 'openchain', chains: ['openchain'], decimals: 6, icon: 'g', coingeckoId: '', category: 'otk' },

  // Stablecoins
  USDT: { symbol: 'USDT', name: 'Tether USD', chain: 'ethereum', chains: ['ethereum', 'solana'], decimals: 6, icon: '$', coingeckoId: 'tether', contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', category: 'stablecoin' },
  USDC: { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', chains: ['ethereum', 'solana'], decimals: 6, icon: '$', coingeckoId: 'usd-coin', contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', category: 'stablecoin' },
  DAI: { symbol: 'DAI', name: 'Dai', chain: 'ethereum', chains: ['ethereum'], decimals: 18, icon: 'D', coingeckoId: 'dai', contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', category: 'stablecoin' },

  // Wrapped / DeFi
  WBTC: { symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'ethereum', chains: ['ethereum'], decimals: 8, icon: 'W', coingeckoId: 'wrapped-bitcoin', contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', category: 'wrapped' },
  LINK: { symbol: 'LINK', name: 'Chainlink', chain: 'ethereum', chains: ['ethereum'], decimals: 18, icon: 'L', coingeckoId: 'chainlink', contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA', category: 'defi' },
  OSMO: { symbol: 'OSMO', name: 'Osmosis', chain: 'osmosis', chains: ['osmosis', 'cosmos'], decimals: 6, icon: 'O', coingeckoId: 'osmosis', category: 'native' },
};

/** Get metadata for a token symbol */
export function getTokenMetadata(symbol: string): TokenMetadata | undefined {
  return TOKEN_METADATA[symbol.toUpperCase()];
}

/** Get all supported tokens */
export function getAllTokens(): TokenMetadata[] {
  return Object.values(TOKEN_METADATA);
}

/** Get tokens by chain */
export function getTokensByChain(chain: string): TokenMetadata[] {
  return Object.values(TOKEN_METADATA).filter(t => t.chains.includes(chain));
}

/** Get tokens by category */
export function getTokensByCategory(category: TokenMetadata['category']): TokenMetadata[] {
  return Object.values(TOKEN_METADATA).filter(t => t.category === category);
}

/** Get decimals for a token (defaults to 6) */
export function getDecimals(symbol: string): number {
  return TOKEN_METADATA[symbol.toUpperCase()]?.decimals ?? 6;
}

/** Format amount with proper decimals */
export function formatTokenAmount(symbol: string, rawAmount: number | bigint): string {
  const decimals = getDecimals(symbol);
  const amount = Number(rawAmount) / 10 ** decimals;
  if (amount >= 1000000) return (amount / 1000000).toFixed(2) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(2) + 'K';
  if (amount >= 1) return amount.toFixed(2);
  if (amount >= 0.01) return amount.toFixed(4);
  return amount.toFixed(6);
}
