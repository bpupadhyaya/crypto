/**
 * Swap History — Persists completed swap records to AsyncStorage.
 *
 * Records are stored locally and survive app restarts.
 * Used by TokenSwapHistoryScreen to show real swap history.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'open_wallet_swap_history';
const MAX_RECORDS = 500;

export interface SwapRecord {
  id: string;
  date: number;          // Unix timestamp
  from: string;          // Token symbol
  to: string;            // Token symbol
  fromAmount: number;
  toAmount: number;
  provider: string;      // e.g., 'THORChain', '1inch', 'Atomic Swap'
  txHash?: string;
  status: 'completed' | 'pending' | 'failed';
  fee?: string;
  chain?: string;        // Destination chain for stablecoin swaps
  isPaper: boolean;      // Whether this was a practice trade
}

let cachedHistory: SwapRecord[] | null = null;

/**
 * Record a completed swap.
 */
export async function recordSwap(record: Omit<SwapRecord, 'id' | 'date'>): Promise<SwapRecord> {
  const entry: SwapRecord = {
    ...record,
    id: `swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: Date.now(),
  };

  const history = await getSwapHistory();
  history.unshift(entry);

  // Keep only last MAX_RECORDS
  if (history.length > MAX_RECORDS) {
    history.length = MAX_RECORDS;
  }

  cachedHistory = history;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return entry;
}

/**
 * Get all swap history records.
 */
export async function getSwapHistory(): Promise<SwapRecord[]> {
  if (cachedHistory) return cachedHistory;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedHistory = stored ? JSON.parse(stored) : [];
  } catch {
    cachedHistory = [];
  }

  return cachedHistory!;
}

/**
 * Update a swap record's status (e.g., pending → completed).
 */
export async function updateSwapStatus(
  id: string,
  status: SwapRecord['status'],
  txHash?: string,
): Promise<void> {
  const history = await getSwapHistory();
  const record = history.find(r => r.id === id);
  if (!record) return;

  record.status = status;
  if (txHash) record.txHash = txHash;

  cachedHistory = history;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Clear all swap history.
 */
export async function clearSwapHistory(): Promise<void> {
  cachedHistory = [];
  await AsyncStorage.removeItem(STORAGE_KEY);
}
