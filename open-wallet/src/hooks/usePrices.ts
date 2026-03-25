/**
 * Live prices — lightweight, debounced, cached.
 */

import { useState, useEffect, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS } from '../core/tokens/registry';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const FETCH_INTERVAL = 60_000; // 60s (was 30s — reduces API load)

// Module-level cache — survives component remounts
let cachedPrices: Record<string, number> = {};
let lastFetchTime = 0;

export function usePrices() {
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const [prices, setPrices] = useState<Record<string, number>>(cachedPrices);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchPrices = async () => {
      // Skip if fetched recently
      if (Date.now() - lastFetchTime < FETCH_INTERVAL / 2) return;

      const tokens = SUPPORTED_TOKENS.filter((t) => enabledTokens.includes(t.symbol));
      if (tokens.length === 0) return;

      const ids = tokens.map((t) => t.coingeckoId).join(',');

      try {
        const response = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`);
        if (!response.ok) return;

        const data = await response.json();
        const newPrices: Record<string, number> = { ...cachedPrices };

        for (const token of tokens) {
          if (data[token.coingeckoId]?.usd) {
            newPrices[token.symbol] = data[token.coingeckoId].usd;
          }
        }

        cachedPrices = newPrices;
        lastFetchTime = Date.now();
        if (mountedRef.current) setPrices(newPrices);
      } catch {}
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, FETCH_INTERVAL);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [enabledTokens]);

  return { prices };
}
