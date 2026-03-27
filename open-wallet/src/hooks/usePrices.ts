/**
 * Live prices — lightweight, debounced, cached.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
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
  const [lastUpdated, setLastUpdated] = useState<number>(lastFetchTime);
  const [loading, setLoading] = useState(false);
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
        if (mountedRef.current) setLoading(true);
        const response = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) { if (mountedRef.current) setLoading(false); return; }

        const data = await response.json();
        const newPrices: Record<string, number> = { ...cachedPrices };

        for (const token of tokens) {
          if (data[token.coingeckoId]?.usd) {
            newPrices[token.symbol] = data[token.coingeckoId].usd;
          }
        }

        cachedPrices = newPrices;
        lastFetchTime = Date.now();
        if (mountedRef.current) {
          setPrices(newPrices);
          setLastUpdated(lastFetchTime);
          setLoading(false);
        }
      } catch { if (mountedRef.current) setLoading(false); }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, FETCH_INTERVAL);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [enabledTokens]);

  const refresh = useCallback(() => {
    lastFetchTime = 0; // force refetch
    const tokens = SUPPORTED_TOKENS.filter((t) => enabledTokens.includes(t.symbol));
    if (tokens.length === 0) return;
    const ids = tokens.map((t) => t.coingeckoId).join(',');
    setLoading(true);
    fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`)
      .then((r) => r.json())
      .then((data) => {
        const newPrices: Record<string, number> = { ...cachedPrices };
        for (const token of tokens) {
          if (data[token.coingeckoId]?.usd) newPrices[token.symbol] = data[token.coingeckoId].usd;
        }
        cachedPrices = newPrices;
        lastFetchTime = Date.now();
        if (mountedRef.current) { setPrices(newPrices); setLastUpdated(lastFetchTime); setLoading(false); }
      })
      .catch(() => { if (mountedRef.current) setLoading(false); });
  }, [enabledTokens]);

  // Check price alerts
  useEffect(() => {
    const alerts = useWalletStore.getState().priceAlerts;
    for (const alert of alerts) {
      if (!alert.enabled || alert.triggered) continue;
      const price = prices[alert.symbol];
      if (!price) continue;
      const hit = alert.direction === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice;
      if (hit) {
        useWalletStore.setState((s) => ({
          priceAlerts: s.priceAlerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a),
        }));
        Alert.alert('Price Alert', `${alert.symbol} is now $${price.toLocaleString()} (${alert.direction} $${alert.targetPrice.toLocaleString()})`);
      }
    }
  }, [prices]);

  return { prices, loading, lastUpdated, refresh };
}
