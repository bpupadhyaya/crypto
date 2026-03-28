/**
 * Spending Limits — Per-token daily/weekly spending controls.
 *
 * Tracks spending against configured limits, provides alerts
 * at 80% threshold, and blocks transactions exceeding limits.
 * Uses AsyncStorage for persistence with automatic period resets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface SpendingLimit {
  token: string;
  chain: string;
  maxAmount: number;
  period: 'daily' | 'weekly';
  spent: number;
  lastReset: number;
  enabled: boolean;
}

export interface SpendingCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  percentUsed: number;
  warning: boolean;   // true when >= 80% used
}

// ─── Storage ───

const LIMITS_KEY = '@spending_limits';

async function loadLimits(): Promise<SpendingLimit[]> {
  try {
    const raw = await AsyncStorage.getItem(LIMITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLimits(limits: SpendingLimit[]): Promise<void> {
  await AsyncStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
}

// ─── Period Reset Logic ───

function getPeriodStart(period: 'daily' | 'weekly'): number {
  const now = new Date();
  if (period === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  // Weekly: start of current week (Monday)
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return monday.getTime();
}

function resetIfNeeded(limit: SpendingLimit): SpendingLimit {
  const periodStart = getPeriodStart(limit.period);
  if (limit.lastReset < periodStart) {
    return { ...limit, spent: 0, lastReset: Date.now() };
  }
  return limit;
}

// ─── Public API ───

export async function getSpendingLimits(): Promise<SpendingLimit[]> {
  const limits = await loadLimits();
  // Auto-reset expired periods
  const updated = limits.map(resetIfNeeded);
  const changed = limits.some((l, i) => l.spent !== updated[i].spent);
  if (changed) await saveLimits(updated);
  return updated;
}

export async function setSpendingLimit(limit: SpendingLimit): Promise<void> {
  if (limit.maxAmount <= 0) throw new Error('Limit must be greater than 0');

  const limits = await loadLimits();
  const idx = limits.findIndex(
    (l) => l.token === limit.token && l.chain === limit.chain && l.period === limit.period,
  );
  if (idx >= 0) {
    limits[idx] = { ...limit, lastReset: limits[idx].lastReset };
  } else {
    limits.push({ ...limit, spent: 0, lastReset: Date.now() });
  }
  await saveLimits(limits);
}

export async function removeSpendingLimit(
  token: string,
  chain: string,
  period: 'daily' | 'weekly',
): Promise<void> {
  const limits = await loadLimits();
  await saveLimits(
    limits.filter((l) => !(l.token === token && l.chain === chain && l.period === period)),
  );
}

export async function checkSpendingLimit(
  token: string,
  amount: number,
): Promise<SpendingCheckResult> {
  const limits = await getSpendingLimits();
  const matching = limits.filter((l) => l.token === token && l.enabled);

  if (matching.length === 0) {
    return { allowed: true, remaining: Infinity, limit: 0, percentUsed: 0, warning: false };
  }

  // Check against the most restrictive matching limit
  for (const lim of matching) {
    const remaining = Math.max(0, lim.maxAmount - lim.spent);
    const percentUsed = lim.maxAmount > 0 ? (lim.spent / lim.maxAmount) * 100 : 0;
    const wouldExceed = lim.spent + amount > lim.maxAmount;

    if (wouldExceed) {
      return {
        allowed: false,
        remaining,
        limit: lim.maxAmount,
        percentUsed: Math.min(100, percentUsed),
        warning: percentUsed >= 80,
      };
    }
  }

  // Find the tightest remaining
  let minRemaining = Infinity;
  let tightestLimit = 0;
  let maxPercent = 0;
  for (const lim of matching) {
    const remaining = lim.maxAmount - lim.spent - amount;
    const pct = ((lim.spent + amount) / lim.maxAmount) * 100;
    if (remaining < minRemaining) {
      minRemaining = remaining;
      tightestLimit = lim.maxAmount;
    }
    if (pct > maxPercent) maxPercent = pct;
  }

  return {
    allowed: true,
    remaining: Math.max(0, minRemaining),
    limit: tightestLimit,
    percentUsed: Math.min(100, maxPercent),
    warning: maxPercent >= 80,
  };
}

export async function recordSpending(token: string, amount: number): Promise<void> {
  const limits = await loadLimits();
  let changed = false;
  for (const lim of limits) {
    if (lim.token === token && lim.enabled) {
      const reset = resetIfNeeded(lim);
      reset.spent += amount;
      Object.assign(lim, reset);
      changed = true;
    }
  }
  if (changed) await saveLimits(limits);
}

// ─── Demo Data ───

export function getDemoSpendingLimits(): SpendingLimit[] {
  const now = Date.now();
  return [
    {
      token: 'BTC',
      chain: 'Bitcoin',
      maxAmount: 0.1,
      period: 'daily',
      spent: 0.065,
      lastReset: now - 3600_000,
      enabled: true,
    },
    {
      token: 'ETH',
      chain: 'Ethereum',
      maxAmount: 2,
      period: 'daily',
      spent: 0.8,
      lastReset: now - 7200_000,
      enabled: true,
    },
    {
      token: 'SOL',
      chain: 'Solana',
      maxAmount: 50,
      period: 'weekly',
      spent: 42,
      lastReset: now - 86400_000,
      enabled: true,
    },
    {
      token: 'USDC',
      chain: 'Ethereum',
      maxAmount: 500,
      period: 'daily',
      spent: 120,
      lastReset: now - 1800_000,
      enabled: true,
    },
    {
      token: 'OTK',
      chain: 'Open Chain',
      maxAmount: 10000,
      period: 'weekly',
      spent: 2500,
      lastReset: now - 172800_000,
      enabled: false,
    },
  ];
}
