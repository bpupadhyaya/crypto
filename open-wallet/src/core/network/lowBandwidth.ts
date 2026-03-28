/**
 * Low Bandwidth Support — Optimize for 2G/3G connections.
 *
 * "Works on 2G networks" — Human Constitution, Article IX
 *
 * When enabled:
 *   - Reduces concurrent requests (1 for 2G, 3 for 3G)
 *   - Caches responses aggressively
 *   - Disables price charts and non-essential data
 *   - Compresses requests where possible
 *   - Extends refresh intervals (120s vs 30s)
 */

import { Platform } from 'react-native';

// ─── Types ───

export type ConnectionSpeed = '2g' | '3g' | '4g' | 'wifi';

export interface LowBandwidthConfig {
  enabled: boolean;
  maxConcurrentRequests: number;
  cacheAggressively: boolean;
  disablePriceCharts: boolean;
  compressRequests: boolean;
  reduceRefreshInterval: number;   // in seconds
  skipNonEssentialData: boolean;
}

// ─── Configs per speed tier ───

const BANDWIDTH_CONFIGS: Record<ConnectionSpeed, LowBandwidthConfig> = {
  '2g': {
    enabled: true,
    maxConcurrentRequests: 1,
    cacheAggressively: true,
    disablePriceCharts: true,
    compressRequests: true,
    reduceRefreshInterval: 120,
    skipNonEssentialData: true,
  },
  '3g': {
    enabled: true,
    maxConcurrentRequests: 3,
    cacheAggressively: true,
    disablePriceCharts: true,
    compressRequests: true,
    reduceRefreshInterval: 60,
    skipNonEssentialData: true,
  },
  '4g': {
    enabled: false,
    maxConcurrentRequests: 6,
    cacheAggressively: false,
    disablePriceCharts: false,
    compressRequests: false,
    reduceRefreshInterval: 30,
    skipNonEssentialData: false,
  },
  'wifi': {
    enabled: false,
    maxConcurrentRequests: 10,
    cacheAggressively: false,
    disablePriceCharts: false,
    compressRequests: false,
    reduceRefreshInterval: 15,
    skipNonEssentialData: false,
  },
};

// ─── State ───

let _manualOverride: boolean | null = null;  // null = auto-detect
let _detectedSpeed: ConnectionSpeed = 'wifi';

// ─── Detection ───

/**
 * Detect connection speed using the Network Information API (web)
 * or NetInfo (React Native). Falls back to 'wifi' if unavailable.
 */
export async function detectConnectionSpeed(): Promise<ConnectionSpeed> {
  try {
    // Try React Native NetInfo
    // @ts-ignore — optional dependency
    const NetInfo = await import(/* webpackIgnore: true */ '@react-native-community/netinfo').catch(() => null);
    if (NetInfo) {
      const state = await NetInfo.default.fetch();
      if (state.type === 'wifi' || state.type === 'ethernet') {
        _detectedSpeed = 'wifi';
        return 'wifi';
      }
      if (state.type === 'cellular') {
        const gen = (state.details as any)?.cellularGeneration;
        if (gen === '2g') { _detectedSpeed = '2g'; return '2g'; }
        if (gen === '3g') { _detectedSpeed = '3g'; return '3g'; }
        if (gen === '4g' || gen === '5g') { _detectedSpeed = '4g'; return '4g'; }
      }
    }

    // Web fallback using Navigator.connection
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const conn = (navigator as any).connection;
      if (conn?.effectiveType) {
        const eff = conn.effectiveType as string;
        if (eff === 'slow-2g' || eff === '2g') { _detectedSpeed = '2g'; return '2g'; }
        if (eff === '3g') { _detectedSpeed = '3g'; return '3g'; }
        if (eff === '4g') { _detectedSpeed = '4g'; return '4g'; }
      }
    }
  } catch {
    // Detection failed, assume good connection
  }

  _detectedSpeed = 'wifi';
  return 'wifi';
}

// ─── Config ───

/**
 * Get the low bandwidth config for a given connection speed.
 */
export function getLowBandwidthConfig(speed: ConnectionSpeed): LowBandwidthConfig {
  return BANDWIDTH_CONFIGS[speed] ?? BANDWIDTH_CONFIGS['wifi'];
}

/**
 * Get the currently active low bandwidth config, considering manual override.
 */
export function getActiveBandwidthConfig(): LowBandwidthConfig {
  if (_manualOverride === true) {
    // Forced on — use 2G config
    return BANDWIDTH_CONFIGS['2g'];
  }
  if (_manualOverride === false) {
    // Forced off — use wifi config
    return BANDWIDTH_CONFIGS['wifi'];
  }
  // Auto-detect
  return BANDWIDTH_CONFIGS[_detectedSpeed];
}

/**
 * Returns true if we're in a low bandwidth situation (2G or 3G, or manually enabled).
 */
export function isLowBandwidth(): boolean {
  if (_manualOverride !== null) return _manualOverride;
  return _detectedSpeed === '2g' || _detectedSpeed === '3g';
}

/**
 * Manually enable or disable low bandwidth mode.
 * Pass null to return to auto-detection.
 */
export function setLowBandwidthOverride(enabled: boolean | null): void {
  _manualOverride = enabled;
}

/**
 * Get the current manual override state.
 */
export function getLowBandwidthOverride(): boolean | null {
  return _manualOverride;
}

/**
 * Get the detected connection speed.
 */
export function getDetectedSpeed(): ConnectionSpeed {
  return _detectedSpeed;
}

// ─── Request Queue (for 2G/3G throttling) ───

let _activeRequests = 0;
const _pendingQueue: Array<() => void> = [];

/**
 * Wraps a fetch/request in a concurrency limiter based on bandwidth config.
 * Use this to throttle network requests on slow connections.
 */
export async function throttledRequest<T>(fn: () => Promise<T>): Promise<T> {
  const config = getActiveBandwidthConfig();
  const maxConcurrent = config.maxConcurrentRequests;

  if (_activeRequests >= maxConcurrent) {
    // Wait for a slot
    await new Promise<void>((resolve) => _pendingQueue.push(resolve));
  }

  _activeRequests++;
  try {
    return await fn();
  } finally {
    _activeRequests--;
    if (_pendingQueue.length > 0) {
      const next = _pendingQueue.shift();
      next?.();
    }
  }
}

// ─── Cache ───

const _cache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Cache-aware fetch wrapper. On low bandwidth, caches aggressively.
 */
export function getCachedData<T>(key: string): T | null {
  const config = getActiveBandwidthConfig();
  const entry = _cache.get(key);
  if (!entry) return null;

  const maxAge = config.cacheAggressively
    ? 5 * 60 * 1000    // 5 minutes on slow connections
    : 30 * 1000;         // 30 seconds on fast connections

  if (Date.now() - entry.timestamp > maxAge) {
    _cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCachedData(key: string, data: unknown): void {
  _cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  _cache.clear();
}
