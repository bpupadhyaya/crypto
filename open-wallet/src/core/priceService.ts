/**
 * Background Price Service — runs independently of UI.
 *
 * Fetches prices from CoinGecko in the background on a 30s interval.
 * Stores results in a module-level cache that any component can read.
 * Never blocks UI — fetch failures are silent.
 *
 * Start once on unlock. Prices populate progressively.
 */

import { SUPPORTED_TOKENS } from './tokens/registry';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const REFRESH_INTERVAL = 30_000; // 30 seconds

// ─── Global price cache (survives all component mounts/unmounts) ───
let priceCache: Record<string, number> = {};
let lastFetchTime = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let listeners: Array<() => void> = [];
let running = false;

/** Get current cached prices. */
export function getPrices(): Record<string, number> {
  return priceCache;
}

/** Get last fetch timestamp. */
export function getLastFetchTime(): number {
  return lastFetchTime;
}

/** Subscribe to price updates. Returns unsubscribe function. */
export function onPriceUpdate(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notifyListeners() {
  for (const fn of listeners) {
    try { fn(); } catch {}
  }
}

/** Fetch prices once (non-blocking, silent on failure). */
async function fetchPricesOnce(enabledTokens?: string[]) {
  try {
    const tokens = enabledTokens
      ? SUPPORTED_TOKENS.filter((t) => enabledTokens.includes(t.symbol))
      : SUPPORTED_TOKENS;

    if (tokens.length === 0) return;

    const ids = tokens.map((t) => t.coingeckoId).filter(Boolean).join(',');
    if (!ids) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${COINGECKO_API}?ids=${ids}&vs_currencies=usd`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return;

    const data = await response.json();
    const newPrices: Record<string, number> = { ...priceCache };

    for (const token of tokens) {
      if (data[token.coingeckoId]?.usd) {
        newPrices[token.symbol] = data[token.coingeckoId].usd;
      }
    }

    priceCache = newPrices;
    lastFetchTime = Date.now();
    notifyListeners();
  } catch {
    // Silent — never block UI for price failures
  }
}

/** Start the background price service. Idempotent — safe to call multiple times. */
export function startPriceService(enabledTokens?: string[]) {
  if (running) return;
  running = true;

  // Fetch immediately (non-blocking)
  fetchPricesOnce(enabledTokens);

  // Then every 30 seconds
  intervalId = setInterval(() => fetchPricesOnce(enabledTokens), REFRESH_INTERVAL);
}

/** Stop the background price service. */
export function stopPriceService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
}

/** Force an immediate refresh (e.g., pull-to-refresh). */
export function refreshPricesNow(enabledTokens?: string[]) {
  fetchPricesOnce(enabledTokens);
}

/** Check if service is running. */
export function isPriceServiceRunning(): boolean {
  return running;
}
