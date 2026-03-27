/**
 * Live Price Feed for Swap Engine.
 * Fetches real-time prices from CoinGecko for accurate swap quotes.
 * Cached for 30 seconds to avoid rate limiting.
 */

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  USDC: 'usd-coin',
  OTK: 'open-token', // placeholder — will use Open Chain oracle
  ATOM: 'cosmos',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  ADA: 'cardano',
};

let priceCache: Record<string, number> = {};
let lastFetchTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Get live USD price for a token.
 */
export async function getLivePrice(symbol: string): Promise<number> {
  await ensurePricesLoaded();
  return priceCache[symbol] ?? 0;
}

/**
 * Get live USD prices for all supported tokens.
 */
export async function getAllLivePrices(): Promise<Record<string, number>> {
  await ensurePricesLoaded();
  return { ...priceCache };
}

/**
 * Calculate swap output based on live prices.
 */
export async function calculateLiveSwapEstimate(
  fromSymbol: string,
  toSymbol: string,
  fromAmount: number,
  feePercent: number = 0.3,
): Promise<number> {
  const prices = await getAllLivePrices();
  const fromPrice = prices[fromSymbol] ?? 0;
  const toPrice = prices[toSymbol] ?? 1;

  if (fromPrice === 0 || toPrice === 0) return 0;

  const fromUsd = fromPrice * fromAmount;
  const fee = fromUsd * (feePercent / 100);
  return (fromUsd - fee) / toPrice;
}

async function ensurePricesLoaded(): Promise<void> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL && Object.keys(priceCache).length > 0) return;

  try {
    const ids = Object.values(COINGECKO_IDS).filter(id => id !== 'open-token').join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!res.ok) return;
    const data = await res.json();

    const newCache: Record<string, number> = {};
    for (const [symbol, cgId] of Object.entries(COINGECKO_IDS)) {
      if (cgId === 'open-token') {
        newCache[symbol] = 0.10; // OTK placeholder price
        continue;
      }
      newCache[symbol] = data[cgId]?.usd ?? 0;
    }

    // Stablecoins fallback
    if (!newCache.USDT || newCache.USDT === 0) newCache.USDT = 1;
    if (!newCache.USDC || newCache.USDC === 0) newCache.USDC = 1;

    priceCache = newCache;
    lastFetchTime = now;
  } catch {
    // Use stale cache or defaults
    if (Object.keys(priceCache).length === 0) {
      // Absolute fallback — better than showing 0
      priceCache = { BTC: 68000, ETH: 2060, SOL: 87, USDT: 1, USDC: 1, OTK: 0.10, ATOM: 8 };
      lastFetchTime = now;
    }
  }
}
