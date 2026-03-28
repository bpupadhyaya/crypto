/**
 * Persistence Audit — Verify and clean up all persisted app state.
 *
 * Scans AsyncStorage for all Open Wallet keys, checks for stale or corrupt
 * entries, and provides cleanup utilities.
 *
 * SecureStore keys are checked by attempting to read known key patterns.
 * AsyncStorage keys are enumerated and validated for JSON integrity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface PersistenceAudit {
  asyncStorageKeys: string[];
  secureStoreKeys: string[];
  totalSizeBytes: number;
  staleKeys: string[];   // keys that can be cleaned up
  corruptKeys: string[]; // keys that fail JSON parse
}

// Known key prefixes used by Open Wallet
const OW_KEY_PREFIXES = [
  'ow-',           // general app state
  'tooltip_shown_', // feature tooltip tracking
  'tutorialCompleted',
  'walletState',
  'vault_',
  'pin_',
  'biometric_',
  'notification_',
  'price_alert_',
  'paper_trade',
  '@react-native-async-storage',
];

// Known SecureStore keys (expo-secure-store)
const KNOWN_SECURE_KEYS = [
  'ow-vault-encrypted',
  'ow-pin-hash',
  'ow-biometric-key',
  'ow-session-token',
];

// Keys that are considered stale if they haven't been updated recently
const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Audit ───

/**
 * Run a full persistence audit across AsyncStorage and SecureStore.
 * Returns a summary of all stored keys, sizes, and any issues found.
 */
export async function runPersistenceAudit(): Promise<PersistenceAudit> {
  const result: PersistenceAudit = {
    asyncStorageKeys: [],
    secureStoreKeys: [],
    totalSizeBytes: 0,
    staleKeys: [],
    corruptKeys: [],
  };

  // ─── AsyncStorage Scan ───
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    result.asyncStorageKeys = [...allKeys];

    // Check each key for corruption and size
    const pairs = await AsyncStorage.multiGet(allKeys);
    for (const [key, value] of pairs) {
      if (value == null) continue;

      // Accumulate size (approximate — UTF-16 string bytes)
      const byteSize = key.length * 2 + (value?.length ?? 0) * 2;
      result.totalSizeBytes += byteSize;

      // Check for corrupt JSON (keys that should be JSON but aren't)
      if (value && value.startsWith('{') || value && value.startsWith('[')) {
        try {
          JSON.parse(value);
        } catch {
          result.corruptKeys.push(key);
        }
      }

      // Check for staleness — keys with timestamps
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            // Check for common timestamp fields
            const ts = parsed.updatedAt ?? parsed.lastUpdated ?? parsed.timestamp ?? parsed.lastPaperTradeAt;
            if (typeof ts === 'number' && ts > 0 && Date.now() - ts > STALE_THRESHOLD_MS) {
              result.staleKeys.push(key);
            }
          }
        } catch {
          // Not JSON — skip staleness check
        }
      }
    }
  } catch {
    // AsyncStorage unavailable — running in test environment
  }

  // ─── SecureStore Scan ───
  // SecureStore doesn't support enumeration, so we check known keys
  try {
    const SecureStore = await import('expo-secure-store');
    for (const key of KNOWN_SECURE_KEYS) {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value != null) {
          result.secureStoreKeys.push(key);
          result.totalSizeBytes += key.length * 2 + value.length * 2;
        }
      } catch {
        // Key doesn't exist or access denied
      }
    }
  } catch {
    // expo-secure-store not available
  }

  return result;
}

/**
 * Clean up stale data from AsyncStorage.
 * Returns the approximate number of bytes freed.
 *
 * Only removes keys identified as stale — never touches active data.
 * Skips vault, PIN, and biometric keys for safety.
 */
export async function cleanupStaleData(): Promise<number> {
  const audit = await runPersistenceAudit();
  let bytesFreed = 0;

  // Safety: never delete vault, pin, or biometric keys
  const safeToDelete = audit.staleKeys.filter(
    (key) =>
      !key.startsWith('vault_') &&
      !key.startsWith('ow-vault') &&
      !key.startsWith('pin_') &&
      !key.startsWith('ow-pin') &&
      !key.startsWith('biometric_') &&
      !key.startsWith('ow-biometric') &&
      !key.startsWith('walletState')
  );

  if (safeToDelete.length === 0) return 0;

  try {
    // Measure sizes before deletion
    const pairs = await AsyncStorage.multiGet(safeToDelete);
    for (const [key, value] of pairs) {
      if (value != null) {
        bytesFreed += key.length * 2 + value.length * 2;
      }
    }

    await AsyncStorage.multiRemove(safeToDelete);
  } catch {
    // Cleanup failed silently
    return 0;
  }

  return bytesFreed;
}

/**
 * Remove corrupt keys from AsyncStorage.
 * Returns the number of keys removed.
 */
export async function removeCorruptKeys(): Promise<number> {
  const audit = await runPersistenceAudit();
  if (audit.corruptKeys.length === 0) return 0;

  try {
    await AsyncStorage.multiRemove(audit.corruptKeys);
    return audit.corruptKeys.length;
  } catch {
    return 0;
  }
}

/**
 * Get a human-readable summary of persisted storage.
 */
export function formatAuditSummary(audit: PersistenceAudit): string {
  const kb = (audit.totalSizeBytes / 1024).toFixed(1);
  const lines = [
    `AsyncStorage: ${audit.asyncStorageKeys.length} keys`,
    `SecureStore: ${audit.secureStoreKeys.length} keys`,
    `Total size: ~${kb} KB`,
    `Stale keys: ${audit.staleKeys.length}`,
    `Corrupt keys: ${audit.corruptKeys.length}`,
  ];
  return lines.join('\n');
}
