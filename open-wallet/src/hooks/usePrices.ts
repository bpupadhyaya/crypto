/**
 * Live price hook — fetches USD prices for enabled tokens.
 * Uses CoinGecko free API. Caches for 30s.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS } from '../core/tokens/registry';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

export function usePrices(): {
  prices: Record<string, number>;
  loading: boolean;
  refresh: () => void;
} {
  const { enabledTokens } = useWalletStore();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchPrices = useCallback(async () => {
    const tokens = SUPPORTED_TOKENS.filter((t) => enabledTokens.includes(t.symbol));
    if (tokens.length === 0) return;

    const ids = tokens.map((t) => t.coingeckoId).join(',');

    setLoading(true);
    try {
      const response = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`);
      if (!response.ok) return;

      const data = await response.json();
      const newPrices: Record<string, number> = {};

      for (const token of tokens) {
        if (data[token.coingeckoId]?.usd) {
          newPrices[token.symbol] = data[token.coingeckoId].usd;
        }
      }

      setPrices(newPrices);
    } catch {
      // Network error — keep cached prices
    } finally {
      setLoading(false);
    }
  }, [enabledTokens]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, refresh: fetchPrices };
}
