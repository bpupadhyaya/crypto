/**
 * Portfolio History Tracker — Snapshots portfolio value over time for charts.
 * Stores up to 2000 snapshots in AsyncStorage, prunes oldest when full.
 * Runs a background service taking snapshots every 15 minutes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Balance } from '../abstractions/types';

// ─── Types ───

export interface PortfolioSnapshot {
  timestamp: number;
  totalUsd: number;
  breakdown: Record<string, number>; // token symbol → usd value
}

// ─── Constants ───

const STORAGE_KEY = 'portfolio-history';
const MAX_SNAPSHOTS = 2000;
const SNAPSHOT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Internal State ───

let snapshotTimer: ReturnType<typeof setInterval> | null = null;
let cachedSnapshots: PortfolioSnapshot[] | null = null;

// ─── Storage Helpers ───

async function loadSnapshots(): Promise<PortfolioSnapshot[]> {
  if (cachedSnapshots !== null) return cachedSnapshots;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedSnapshots = JSON.parse(raw) as PortfolioSnapshot[];
      return cachedSnapshots;
    }
  } catch {
    // Corrupted data — start fresh
  }
  cachedSnapshots = [];
  return cachedSnapshots;
}

async function saveSnapshots(snapshots: PortfolioSnapshot[]): Promise<void> {
  cachedSnapshots = snapshots;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ─── Public API ───

/**
 * Take a snapshot of the current portfolio value.
 * Appends to history, pruning oldest if over MAX_SNAPSHOTS.
 */
export async function takeSnapshot(
  balances: Balance[],
  prices: Record<string, number>,
): Promise<void> {
  const breakdown: Record<string, number> = {};
  let totalUsd = 0;

  for (const balance of balances) {
    if (!balance.token) continue;
    const symbol = balance.token.symbol;
    const decimals = balance.token.decimals;
    const humanAmount = Number(balance.amount) / Math.pow(10, decimals);
    const price = prices[symbol] ?? 0;
    const usdValue = balance.usdValue ?? humanAmount * price;

    breakdown[symbol] = (breakdown[symbol] ?? 0) + usdValue;
    totalUsd += usdValue;
  }

  const snapshot: PortfolioSnapshot = {
    timestamp: Date.now(),
    totalUsd,
    breakdown,
  };

  const snapshots = await loadSnapshots();
  snapshots.push(snapshot);

  // Prune oldest if over limit
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  }

  await saveSnapshots(snapshots);
}

/**
 * Get historical snapshots filtered by time period.
 */
export async function getSnapshots(
  period: '24h' | '7d' | '30d' | '90d' | '1y',
): Promise<PortfolioSnapshot[]> {
  const now = Date.now();
  const periodMs: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  };

  const cutoff = now - (periodMs[period] ?? periodMs['30d']);
  const snapshots = await loadSnapshots();
  return snapshots.filter((s) => s.timestamp >= cutoff);
}

/**
 * Get all stored snapshots (no time filter).
 */
export async function getAllSnapshots(): Promise<PortfolioSnapshot[]> {
  return loadSnapshots();
}

/**
 * Clear all stored snapshots.
 */
export async function clearSnapshots(): Promise<void> {
  cachedSnapshots = [];
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── Snapshot Service ───

// References for the service to call takeSnapshot with current data
let balanceProvider: (() => Balance[]) | null = null;
let priceProvider: (() => Record<string, number>) | null = null;

/**
 * Start the automatic snapshot service.
 * Takes a snapshot every 15 minutes using the provided data accessors.
 * If no providers given, snapshots must be taken manually via takeSnapshot().
 */
export function startSnapshotService(
  getBalances?: () => Balance[],
  getPrices?: () => Record<string, number>,
): void {
  if (snapshotTimer !== null) return; // Already running

  if (getBalances) balanceProvider = getBalances;
  if (getPrices) priceProvider = getPrices;

  snapshotTimer = setInterval(async () => {
    if (balanceProvider && priceProvider) {
      try {
        await takeSnapshot(balanceProvider(), priceProvider());
      } catch {
        // Silently continue — don't crash the service
      }
    }
  }, SNAPSHOT_INTERVAL_MS);
}

/**
 * Stop the automatic snapshot service.
 */
export function stopSnapshotService(): void {
  if (snapshotTimer !== null) {
    clearInterval(snapshotTimer);
    snapshotTimer = null;
  }
  balanceProvider = null;
  priceProvider = null;
}

/**
 * Check if the snapshot service is currently running.
 */
export function isSnapshotServiceRunning(): boolean {
  return snapshotTimer !== null;
}
