/**
 * Background notification service — monitors for incoming transactions.
 * Runs alongside the price service, checking for new transactions
 * directed at the user's addresses.
 *
 * Polls every 60 seconds. When a new incoming transaction is detected,
 * shows a local push notification via expo-notifications and stores
 * the entry in AsyncStorage for the NotificationHistoryScreen.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface NotificationEntry {
  id: string;
  timestamp: number;
  chain: string;
  amount: string;
  token: string;
  sender: string;
  txHash: string;
}

const STORAGE_KEY = '@open_wallet_notification_history';
const MAX_ENTRIES = 100;
const POLL_INTERVAL = 60_000; // 60 seconds

// ─── State ───

let lastTxCounts: Record<string, number> = {};
let running = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

// ─── Notification History Persistence ───

export async function getNotificationHistory(): Promise<NotificationEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotificationEntry[];
  } catch {
    return [];
  }
}

async function appendNotification(entry: NotificationEntry): Promise<void> {
  try {
    const history = await getNotificationHistory();
    history.unshift(entry);
    // Cap at MAX_ENTRIES
    const trimmed = history.slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage write failed — non-critical
  }
}

export async function clearNotificationHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── Transaction Checking ───

/**
 * Check for new incoming transactions across all chains.
 * Uses the chain registry to query transaction history.
 * Compares tx count with last known — if increased, shows notification.
 */
async function checkForNewTransactions(addresses: Record<string, string>): Promise<void> {
  let registry: any;
  try {
    registry = (await import('./abstractions/registry')).registry;
  } catch {
    return; // Registry not available yet
  }

  for (const [chainId, address] of Object.entries(addresses)) {
    if (!address) continue;

    try {
      const provider = registry.getChainProvider(chainId);
      const txs = await Promise.race([
        provider.getTransactionHistory(address, 5),
        new Promise<null>((_, rej) => setTimeout(() => rej('timeout'), 10_000)),
      ]);

      if (!txs || !Array.isArray(txs)) continue;

      const prevCount = lastTxCounts[chainId] ?? -1;
      const currentCount = txs.length;

      // First run: just record the count, don't notify
      if (prevCount === -1) {
        lastTxCounts[chainId] = currentCount;
        continue;
      }

      // If new transactions appeared
      if (currentCount > prevCount) {
        const newTxs = txs.slice(0, currentCount - prevCount);
        for (const tx of newTxs) {
          // Only notify on incoming (received) transactions
          const isIncoming =
            (tx.type === 'receive') ||
            (tx.direction === 'incoming') ||
            (tx.to?.toLowerCase() === address.toLowerCase());

          if (!isIncoming) continue;

          const amount = tx.amount ?? tx.value ?? '?';
          const token = tx.token ?? tx.symbol ?? chainId.toUpperCase();
          const sender = tx.from ?? tx.sender ?? 'Unknown';
          const truncatedSender = sender.length > 8
            ? `${sender.slice(0, 4)}...${sender.slice(-4)}`
            : sender;

          // Show local notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Received ${amount} ${token}`,
              body: `From ${truncatedSender} on ${chainId}`,
              data: { type: 'incoming_tx', chain: chainId, txHash: tx.hash ?? '' },
              sound: 'default',
            },
            trigger: null, // Immediate
          });

          // Store in history
          await appendNotification({
            id: `${chainId}-${tx.hash ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            chain: chainId,
            amount: String(amount),
            token,
            sender,
            txHash: tx.hash ?? '',
          });
        }
      }

      lastTxCounts[chainId] = currentCount;
    } catch {
      // Chain query failed — skip silently
    }
  }
}

// ─── Service Lifecycle ───

/**
 * Start the background notification service.
 * Polls every 60 seconds for new incoming transactions.
 * Skip if demo mode — no real transactions to monitor.
 */
export function startNotificationService(addresses: Record<string, string>): void {
  if (running) return;
  running = true;

  // Reset counts so first poll establishes baseline
  lastTxCounts = {};

  // Initial check after a short delay (let app settle)
  setTimeout(() => {
    checkForNewTransactions(addresses);
  }, 5_000);

  // Poll every 60 seconds
  intervalId = setInterval(() => {
    checkForNewTransactions(addresses);
  }, POLL_INTERVAL);
}

/**
 * Stop the background notification service.
 */
export function stopNotificationService(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
  lastTxCounts = {};
}

export function isNotificationServiceRunning(): boolean {
  return running;
}
