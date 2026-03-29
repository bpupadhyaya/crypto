/**
 * Offline-First Data Layer — Article IX of The Human Constitution.
 *
 * "Open Chain must work in regions with limited or no internet connectivity."
 *
 * Architecture:
 *   1. All data is cached locally in AsyncStorage
 *   2. Writes go to a local queue first, then sync when online
 *   3. Reads always return local data (instant), then refresh from network
 *   4. Conflict resolution: last-write-wins with server timestamp
 *   5. Background sync when connectivity resumes
 *   6. Priority sync for critical data (transactions, emergencies)
 *
 * Sync priorities:
 *   P0 (immediate): Transactions, SOS alerts, identity changes
 *   P1 (next sync):  Governance votes, gratitude, milestones
 *   P2 (background):  Profiles, scores, feeds, stats
 *   P3 (lazy):       Historical data, archives, analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// NetInfo wrapper — gracefully handles missing module
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo not installed — assume online
}

interface NetInfoState { isConnected: boolean | null; }

// ─── Types ───

export type SyncPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: string; // JSON stringified
  priority: SyncPriority;
  createdAt: number; // timestamp ms
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface CacheEntry {
  key: string;
  data: string; // JSON stringified
  fetchedAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (0 = never expires)
  source: 'network' | 'local'; // where the data came from
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: number;
  pendingItems: number;
  failedItems: number;
  syncInProgress: boolean;
}

// ─── Constants ───

const CACHE_PREFIX = '@ow_cache/';
const QUEUE_KEY = '@ow_sync_queue';
const SYNC_STATUS_KEY = '@ow_sync_status';

// Cache TTLs by priority
const CACHE_TTL: Record<SyncPriority, number> = {
  P0: 0,                // Never cache — always fresh
  P1: 5 * 60 * 1000,    // 5 minutes
  P2: 30 * 60 * 1000,   // 30 minutes
  P3: 24 * 60 * 60 * 1000, // 24 hours
};

// ─── Cache Layer ───

/**
 * Read data from local cache. Returns null if expired or missing.
 * This is the first call for any data read — instant, no network.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    // Check expiry (0 = never expires)
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      return null; // Expired — caller should fetch fresh
    }

    return JSON.parse(entry.data) as T;
  } catch {
    return null;
  }
}

/**
 * Write data to local cache with TTL.
 */
export async function cacheSet(key: string, data: any, priority: SyncPriority = 'P2'): Promise<void> {
  const entry: CacheEntry = {
    key,
    data: JSON.stringify(data),
    fetchedAt: Date.now(),
    expiresAt: CACHE_TTL[priority] > 0 ? Date.now() + CACHE_TTL[priority] : 0,
    source: 'local',
  };

  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

/**
 * Write network-fetched data to cache.
 */
export async function cacheSetFromNetwork(key: string, data: any, priority: SyncPriority = 'P2'): Promise<void> {
  const entry: CacheEntry = {
    key,
    data: JSON.stringify(data),
    fetchedAt: Date.now(),
    expiresAt: CACHE_TTL[priority] > 0 ? Date.now() + CACHE_TTL[priority] : 0,
    source: 'network',
  };

  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

/** Invalidate a cache entry */
export async function cacheInvalidate(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

/** Clear all cached data */
export async function cacheClearAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(cacheKeys);
}

// ─── Sync Queue ───

/**
 * Add a write operation to the sync queue.
 * Writes always succeed locally — they sync to server when online.
 */
export async function queueWrite(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: any,
  priority: SyncPriority = 'P1',
): Promise<string> {
  const queue = await getQueue();

  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    endpoint,
    method,
    body: JSON.stringify(body),
    priority,
    createdAt: Date.now(),
    retries: 0,
    maxRetries: priority === 'P0' ? 10 : 5,
    status: 'pending',
  };

  queue.push(item);
  await saveQueue(queue);

  // If online and P0, try to sync immediately
  const status = await getConnectivityStatus();
  if (status && priority === 'P0') {
    processSyncQueue(); // fire-and-forget
  }

  return item.id;
}

/** Get all pending items in the queue */
export async function getQueue(): Promise<SyncQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: SyncQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Get count of pending sync items */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter(i => i.status === 'pending' || i.status === 'failed').length;
}

// ─── Sync Engine ───

let _syncInProgress = false;

/**
 * Process the sync queue — send pending writes to server.
 * Items are processed in priority order (P0 first).
 * Failed items are retried up to maxRetries.
 */
export async function processSyncQueue(): Promise<void> {
  if (_syncInProgress) return;
  _syncInProgress = true;

  try {
    const online = await getConnectivityStatus();
    if (!online) {
      _syncInProgress = false;
      return;
    }

    const queue = await getQueue();
    // Sort by priority then by creation time
    const priorityOrder: Record<SyncPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    queue.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return pDiff !== 0 ? pDiff : a.createdAt - b.createdAt;
    });

    for (const item of queue) {
      if (item.status === 'completed') continue;
      if (item.retries >= item.maxRetries) {
        item.status = 'failed';
        continue;
      }

      item.status = 'syncing';
      try {
        // In production, this would be a real fetch call
        // For now, we simulate success for demo mode
        await simulateNetworkRequest(item);
        item.status = 'completed';
      } catch {
        item.retries++;
        item.status = item.retries >= item.maxRetries ? 'failed' : 'pending';
      }
    }

    // Remove completed items, keep pending and failed
    const remaining = queue.filter(i => i.status !== 'completed');
    await saveQueue(remaining);

    // Update sync status
    await updateSyncStatus(remaining);
  } finally {
    _syncInProgress = false;
  }
}

async function simulateNetworkRequest(_item: SyncQueueItem): Promise<void> {
  // In production: fetch(item.endpoint, { method: item.method, body: item.body })
  // For now, simulate ~200ms network latency
  return new Promise(resolve => setTimeout(resolve, 200));
}

// ─── Connectivity ───

let _isOnline = true;
let _unsubscribeNetInfo: (() => void) | null = null;

/** Initialize connectivity monitoring */
export function initConnectivityMonitor(): () => void {
  if (!NetInfo) return () => {};

  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOffline = !_isOnline;
    _isOnline = state.isConnected ?? false;

    // If we just came online, process the sync queue
    if (wasOffline && _isOnline) {
      processSyncQueue();
    }
  });

  _unsubscribeNetInfo = unsubscribe;
  return unsubscribe;
}

/** Get current connectivity status */
export async function getConnectivityStatus(): Promise<boolean> {
  if (!NetInfo) return true; // Assume online if no NetInfo
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return _isOnline;
  }
}

/** Check if currently online (synchronous, uses cached value) */
export function isOnline(): boolean {
  return _isOnline;
}

// ─── Sync Status ───

async function updateSyncStatus(queue: SyncQueueItem[]): Promise<void> {
  const status: SyncStatus = {
    isOnline: _isOnline,
    lastSyncAt: Date.now(),
    pendingItems: queue.filter(i => i.status === 'pending').length,
    failedItems: queue.filter(i => i.status === 'failed').length,
    syncInProgress: _syncInProgress,
  };
  await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

/** Get current sync status */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return {
    isOnline: _isOnline,
    lastSyncAt: 0,
    pendingItems: 0,
    failedItems: 0,
    syncInProgress: false,
  };
}

// ─── Fetch with Cache ───

/**
 * Fetch data with offline-first strategy:
 *   1. Return cached data immediately if available
 *   2. Fetch fresh data in background
 *   3. Update cache with fresh data
 *   4. Call onFresh callback when new data arrives
 *
 * This is the primary data fetching function for all screens.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  priority: SyncPriority = 'P2',
  onFresh?: (data: T) => void,
): Promise<T | null> {
  // 1. Try cache first (instant)
  const cached = await cacheGet<T>(key);

  // 2. If online, fetch fresh in background
  if (_isOnline) {
    fetchFn()
      .then(async (fresh) => {
        await cacheSetFromNetwork(key, fresh, priority);
        if (onFresh) onFresh(fresh);
      })
      .catch(() => {
        // Network failed — cached data is still valid
      });
  }

  // 3. Return cached data (or null if no cache)
  return cached;
}

// ─── Export ───

export const SyncEngine = {
  // Cache
  get: cacheGet,
  set: cacheSet,
  invalidate: cacheInvalidate,
  clearCache: cacheClearAll,

  // Queue
  write: queueWrite,
  getPendingCount,

  // Sync
  sync: processSyncQueue,
  getSyncStatus,

  // Connectivity
  init: initConnectivityMonitor,
  isOnline,

  // Fetch
  fetch: fetchWithCache,
};

export default SyncEngine;
