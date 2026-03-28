/**
 * Offline Manager — Full offline support for Open Wallet.
 *
 * When the device loses connectivity:
 * - Cached balances are shown (from last successful sync)
 * - Transactions can be signed and queued locally
 * - Queued transactions auto-broadcast when connectivity returns
 *
 * Pending transactions persist in AsyncStorage so they survive app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface PendingTx {
  id: string;
  chain: string;
  signedTxHex: string;
  createdAt: number;
  description: string;
}

export interface OfflineState {
  isOffline: boolean;
  lastOnlineAt: number;
  pendingTxQueue: PendingTx[];
  cachedBalances: Record<string, Record<string, number>>; // chain → address → balance
  cachedPrices: Record<string, number>;
}

// ─── Storage Keys ───

const STORAGE_KEY_PENDING_TXS = '@openWallet:offlinePendingTxs';
const STORAGE_KEY_CACHED_BALANCES = '@openWallet:offlineCachedBalances';
const STORAGE_KEY_CACHED_PRICES = '@openWallet:offlineCachedPrices';
const STORAGE_KEY_LAST_ONLINE = '@openWallet:offlineLastOnline';

// ─── In-Memory State ───

let state: OfflineState = {
  isOffline: false,
  lastOnlineAt: Date.now(),
  pendingTxQueue: [],
  cachedBalances: {},
  cachedPrices: {},
};

let listeners: Array<(s: OfflineState) => void> = [];
let connectivityCheckInterval: ReturnType<typeof setInterval> | null = null;
let initialized = false;

// ─── Persistence Helpers ───

async function persistPendingTxs(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PENDING_TXS, JSON.stringify(state.pendingTxQueue));
  } catch {}
}

async function persistCachedBalances(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CACHED_BALANCES, JSON.stringify(state.cachedBalances));
  } catch {}
}

async function persistCachedPrices(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CACHED_PRICES, JSON.stringify(state.cachedPrices));
  } catch {}
}

async function persistLastOnline(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LAST_ONLINE, String(state.lastOnlineAt));
  } catch {}
}

// ─── Initialization ───

export async function initOfflineManager(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    const [txsJson, balancesJson, pricesJson, lastOnlineStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_PENDING_TXS),
      AsyncStorage.getItem(STORAGE_KEY_CACHED_BALANCES),
      AsyncStorage.getItem(STORAGE_KEY_CACHED_PRICES),
      AsyncStorage.getItem(STORAGE_KEY_LAST_ONLINE),
    ]);

    if (txsJson) state.pendingTxQueue = JSON.parse(txsJson);
    if (balancesJson) state.cachedBalances = JSON.parse(balancesJson);
    if (pricesJson) state.cachedPrices = JSON.parse(pricesJson);
    if (lastOnlineStr) state.lastOnlineAt = parseInt(lastOnlineStr, 10);
  } catch {}

  // Start connectivity monitoring
  startConnectivityCheck();
  notifyListeners();
}

// ─── Connectivity Detection ───

async function checkConnectivity(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

function startConnectivityCheck(): void {
  if (connectivityCheckInterval) return;

  const check = async () => {
    const online = await checkConnectivity();
    const wasOffline = state.isOffline;

    state.isOffline = !online;
    if (online) {
      state.lastOnlineAt = Date.now();
      persistLastOnline();
    }

    // Auto-broadcast when coming back online
    if (wasOffline && online && state.pendingTxQueue.length > 0) {
      broadcastPendingTxs();
    }

    notifyListeners();
  };

  // Check immediately, then every 15 seconds
  check();
  connectivityCheckInterval = setInterval(check, 15_000);
}

export function stopConnectivityCheck(): void {
  if (connectivityCheckInterval) {
    clearInterval(connectivityCheckInterval);
    connectivityCheckInterval = null;
  }
}

// ─── Listeners ───

function notifyListeners(): void {
  for (const fn of listeners) {
    try { fn(state); } catch {}
  }
}

export function onOfflineStateChange(fn: (s: OfflineState) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// ─── Public API ───

export function isOffline(): boolean {
  return state.isOffline;
}

export function getOfflineState(): OfflineState {
  return { ...state };
}

export function getLastOnlineAt(): number {
  return state.lastOnlineAt;
}

// ─── Pending Transaction Queue ───

export function queueOfflineTx(tx: PendingTx): void {
  state.pendingTxQueue.push(tx);
  persistPendingTxs();
  notifyListeners();
}

export function getPendingTxs(): PendingTx[] {
  return [...state.pendingTxQueue];
}

export function removePendingTx(id: string): void {
  state.pendingTxQueue = state.pendingTxQueue.filter((tx) => tx.id !== id);
  persistPendingTxs();
  notifyListeners();
}

export function clearPendingTxs(): void {
  state.pendingTxQueue = [];
  persistPendingTxs();
  notifyListeners();
}

export async function broadcastPendingTxs(): Promise<{ success: number; failed: number }> {
  if (state.isOffline) {
    return { success: 0, failed: state.pendingTxQueue.length };
  }

  let success = 0;
  let failed = 0;
  const remaining: PendingTx[] = [];

  for (const tx of state.pendingTxQueue) {
    try {
      const broadcasted = await broadcastSingleTx(tx);
      if (broadcasted) {
        success++;
      } else {
        failed++;
        remaining.push(tx);
      }
    } catch {
      failed++;
      remaining.push(tx);
    }
  }

  state.pendingTxQueue = remaining;
  persistPendingTxs();
  notifyListeners();

  return { success, failed };
}

/** Broadcast a single signed transaction to its chain's RPC. */
async function broadcastSingleTx(tx: PendingTx): Promise<boolean> {
  // Chain-specific broadcast endpoints
  const endpoints: Record<string, string> = {
    bitcoin: 'https://mempool.space/api/tx',
    ethereum: 'https://eth.llamarpc.com',
    solana: 'https://api.mainnet-beta.solana.com',
  };

  const endpoint = endpoints[tx.chain];
  if (!endpoint) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    if (tx.chain === 'bitcoin') {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: tx.signedTxHex,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    }

    if (tx.chain === 'ethereum') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [tx.signedTxHex],
          id: 1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return !data.error;
    }

    if (tx.chain === 'solana') {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'sendTransaction',
          params: [tx.signedTxHex, { encoding: 'base64' }],
          id: 1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return !data.error;
    }

    clearTimeout(timeoutId);
    return false;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

// ─── Cached Balances ───

export function getCachedBalance(chain: string, address: string): number | null {
  return state.cachedBalances[chain]?.[address] ?? null;
}

export function setCachedBalance(chain: string, address: string, balance: number): void {
  if (!state.cachedBalances[chain]) {
    state.cachedBalances[chain] = {};
  }
  state.cachedBalances[chain][address] = balance;
  persistCachedBalances();
}

export function getAllCachedBalances(): Record<string, Record<string, number>> {
  return { ...state.cachedBalances };
}

// ─── Cached Prices ───

export function getCachedPrice(symbol: string): number | null {
  return state.cachedPrices[symbol] ?? null;
}

export function setCachedPrices(prices: Record<string, number>): void {
  state.cachedPrices = { ...state.cachedPrices, ...prices };
  persistCachedPrices();
}

export function getAllCachedPrices(): Record<string, number> {
  return { ...state.cachedPrices };
}
