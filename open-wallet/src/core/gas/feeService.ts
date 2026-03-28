/**
 * Background Fee Service — runs independently of UI.
 *
 * Same pattern as priceService: starts on app launch, polls fee estimates
 * periodically so they're ready when the user initiates a send.
 *
 * Fee estimates are cached globally. UI subscribes via onFeeUpdate().
 */

import { estimateAllFees, type FeeEstimate } from './estimator';

const REFRESH_INTERVAL = 30_000; // 30 seconds

// ─── Global fee cache ───
let feeCache: Record<string, FeeEstimate> = {};
let lastFetchTime = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let listeners: Array<() => void> = [];
let running = false;

/**
 * Get the latest cached fee estimates for all chains.
 */
export function getFeeEstimates(): Record<string, FeeEstimate> {
  return feeCache;
}

/**
 * Get cached fee estimate for a single chain.
 */
export function getChainFeeEstimate(chain: string): FeeEstimate | undefined {
  return feeCache[chain];
}

/**
 * Get last fetch timestamp.
 */
export function getFeeLastFetchTime(): number {
  return lastFetchTime;
}

/**
 * Subscribe to fee updates. Returns unsubscribe function.
 */
export function onFeeUpdate(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notifyListeners() {
  for (const fn of listeners) {
    try { fn(); } catch { /* ignore listener errors */ }
  }
}

async function refreshFees() {
  try {
    const estimates = await estimateAllFees();
    // Merge into cache (so partial failures don't wipe existing data)
    for (const [chain, estimate] of Object.entries(estimates)) {
      feeCache[chain] = estimate;
    }
    lastFetchTime = Date.now();
    notifyListeners();
  } catch {
    // Silent failure — keep existing cache
  }
}

/**
 * Start the background fee service.
 * Fetches immediately, then refreshes every 30 seconds.
 */
export function startFeeService(): void {
  if (running) return;
  running = true;

  // Fetch immediately (non-blocking)
  refreshFees();

  // Periodic refresh
  intervalId = setInterval(refreshFees, REFRESH_INTERVAL);
}

/**
 * Stop the background fee service.
 */
export function stopFeeService(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
}

/**
 * Force an immediate refresh (e.g. when user opens Send screen).
 */
export function refreshFeesNow(): void {
  refreshFees();
}

/**
 * Check if fee service is currently running.
 */
export function isFeeServiceRunning(): boolean {
  return running;
}
