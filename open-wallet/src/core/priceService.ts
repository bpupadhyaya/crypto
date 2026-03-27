/**
 * Background Price Service — runs independently of UI.
 *
 * Two-batch strategy for fast initial display:
 *   Batch 1: Top 5 tokens (BTC, ETH, SOL, USDT, USDC) — fires immediately
 *   Batch 2: Remaining tokens — fires right after batch 1
 *
 * Prices populate progressively. UI subscribes and re-renders as each batch arrives.
 * Never blocks UI — fetch failures are silent.
 */

import { SUPPORTED_TOKENS } from './tokens/registry';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const REFRESH_INTERVAL = 30_000; // 30 seconds

// Priority tokens — fetched first (what user sees at top of Home screen)
const PRIORITY_SYMBOLS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'OTK'];

// ─── Global price cache ───
let priceCache: Record<string, number> = {};
let changeCache: Record<string, number> = {}; // 24h change %
let lastFetchTime = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let listeners: Array<() => void> = [];
let running = false;

export function getPrices(): Record<string, number> {
  return priceCache;
}

export function get24hChanges(): Record<string, number> {
  return changeCache;
}

export function getLastFetchTime(): number {
  return lastFetchTime;
}

export function onPriceUpdate(fn: () => void): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

function notifyListeners() {
  for (const fn of listeners) {
    try { fn(); } catch {}
  }
}

/** Fetch a batch of token prices and merge into cache. */
async function fetchBatch(tokenSymbols: string[]): Promise<boolean> {
  const tokens = SUPPORTED_TOKENS.filter((t) => tokenSymbols.includes(t.symbol) && t.coingeckoId);
  if (tokens.length === 0) return false;

  const ids = tokens.map((t) => t.coingeckoId).join(',');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(
      `${COINGECKO_API}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!response.ok) return false;

    const data = await response.json();
    let updated = false;

    for (const token of tokens) {
      if (data[token.coingeckoId]?.usd) {
        priceCache[token.symbol] = data[token.coingeckoId].usd;
        updated = true;
      }
      if (data[token.coingeckoId]?.usd_24h_change != null) {
        changeCache[token.symbol] = data[token.coingeckoId].usd_24h_change;
      }
    }

    if (updated) {
      lastFetchTime = Date.now();
      notifyListeners();
    }
    return true;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

/** Two-batch fetch: priority tokens first, then the rest. */
async function fetchAllPrices(enabledTokens?: string[]) {
  const allSymbols = enabledTokens
    ? enabledTokens
    : SUPPORTED_TOKENS.map((t) => t.symbol);

  // Batch 1: Priority tokens (user sees these first)
  const batch1 = allSymbols.filter((s) => PRIORITY_SYMBOLS.includes(s));
  const batch2 = allSymbols.filter((s) => !PRIORITY_SYMBOLS.includes(s));

  // Fire batch 1 — UI updates as soon as top tokens arrive
  if (batch1.length > 0) {
    await fetchBatch(batch1);
  }

  // Fire batch 2 — remaining tokens
  if (batch2.length > 0) {
    await fetchBatch(batch2);
  }
}

export function startPriceService(enabledTokens?: string[]) {
  if (running) return;
  running = true;

  // Fetch immediately (non-blocking, two batches)
  fetchAllPrices(enabledTokens);

  // Refresh every 30 seconds
  intervalId = setInterval(() => fetchAllPrices(enabledTokens), REFRESH_INTERVAL);
}

export function stopPriceService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
}

export function refreshPricesNow(enabledTokens?: string[]) {
  fetchAllPrices(enabledTokens);
}

export function isPriceServiceRunning(): boolean {
  return running;
}
