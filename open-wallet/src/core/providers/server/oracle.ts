/**
 * Oracle Provider — Server Implementation.
 *
 * Uses CoinGecko free API for price feeds.
 * Will be replaced by MobileOracleProvider when phones can
 * aggregate prices from DEXs directly via P2P consensus.
 */

import {
  IOracleProvider,
} from '../../abstractions/interfaces';
import {
  Token,
  ProviderMeta,
} from '../../abstractions/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map our chain IDs to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  ATOM: 'cosmos',
  USDC: 'usd-coin',
  USDT: 'tether',
  OTK: 'open-token', // placeholder — Open Token (OTK)
};

export class ServerOracleProvider implements IOracleProvider {
  readonly meta: ProviderMeta = {
    name: 'ServerOracleProvider',
    backendType: 'server',
    version: '0.1.0',
    capabilities: ['price', 'price-history'],
  };

  private cache = new Map<string, { price: number; timestamp: number }>();
  private cacheTtl = 30_000; // 30 seconds

  async getPrice(token: Token): Promise<number> {
    const cached = this.cache.get(token.symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.price;
    }

    const coingeckoId = COINGECKO_IDS[token.symbol];
    if (!coingeckoId) return 0;

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );

    if (!response.ok) return 0;

    const data = await response.json();
    const price = data[coingeckoId]?.usd ?? 0;

    this.cache.set(token.symbol, { price, timestamp: Date.now() });
    return price;
  }

  async getPrices(tokens: Token[]): Promise<Map<string, number>> {
    const ids = tokens
      .map((t) => COINGECKO_IDS[t.symbol])
      .filter(Boolean)
      .join(',');

    const result = new Map<string, number>();

    if (!ids) return result;

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`
    );

    if (!response.ok) return result;

    const data = await response.json();

    for (const token of tokens) {
      const coingeckoId = COINGECKO_IDS[token.symbol];
      if (coingeckoId && data[coingeckoId]) {
        const price = data[coingeckoId].usd;
        result.set(token.symbol, price);
        this.cache.set(token.symbol, { price, timestamp: Date.now() });
      }
    }

    return result;
  }

  async getPriceHistory(
    token: Token,
    days: number
  ): Promise<Array<{ timestamp: number; price: number }>> {
    const coingeckoId = COINGECKO_IDS[token.symbol];
    if (!coingeckoId) return [];

    const response = await fetch(
      `${COINGECKO_API}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.prices ?? []).map(([timestamp, price]: [number, number]) => ({
      timestamp,
      price,
    }));
  }
}
