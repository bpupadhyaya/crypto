/**
 * Push Notifications — Transaction confirmations, price alerts, staking rewards.
 *
 * Uses expo-notifications for local notifications.
 * Remote push (APNs/FCM) can be added later for server-triggered alerts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions.
 * Call this once during app initialization.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Send a local notification for transaction confirmation.
 */
export async function notifyTransactionConfirmed(params: {
  type: 'send' | 'receive' | 'swap' | 'stake';
  amount: string;
  token: string;
  txHash?: string;
}): Promise<void> {
  const titles: Record<string, string> = {
    send: `Sent ${params.amount} ${params.token}`,
    receive: `Received ${params.amount} ${params.token}`,
    swap: `Swapped ${params.amount} ${params.token}`,
    stake: `Staked ${params.amount} ${params.token}`,
  };

  const bodies: Record<string, string> = {
    send: `Your transaction has been confirmed on the network.`,
    receive: `${params.amount} ${params.token} has been added to your wallet.`,
    swap: `Your swap has been executed successfully.`,
    stake: `Your OTK has been delegated. You'll start earning rewards.`,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[params.type] ?? 'Transaction Confirmed',
      body: bodies[params.type] ?? 'Your transaction was successful.',
      data: { txHash: params.txHash, type: params.type },
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
}

/**
 * Send a local notification for price alert trigger.
 */
export async function notifyPriceAlert(params: {
  token: string;
  direction: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
}): Promise<void> {
  const direction = params.direction === 'above' ? 'risen above' : 'fallen below';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${params.token} Price Alert`,
      body: `${params.token} has ${direction} $${params.targetPrice.toFixed(2)}. Current: $${params.currentPrice.toFixed(2)}`,
      data: { type: 'price_alert', token: params.token },
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Send a local notification for staking rewards.
 */
export async function notifyStakingRewards(params: {
  amount: string;
  validator: string;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Staking Rewards',
      body: `You earned ${params.amount} OTK from ${params.validator}. Claim in the Staking screen.`,
      data: { type: 'staking_reward' },
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Send a local notification for Universal ID registration.
 */
export async function notifyUIDRegistered(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Universal ID Created',
      body: 'Your Universal ID has been registered on Open Chain. Welcome to the network.',
      data: { type: 'uid_registered' },
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Schedule a daily reminder to check staking rewards.
 */
export async function scheduleDailyStakingReminder(): Promise<void> {
  // Cancel existing
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Staking Rewards Available',
      body: 'Check your staking positions for new rewards.',
      data: { type: 'staking_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Get the Expo push token for remote notifications.
 * This is used for server-triggered notifications (future feature).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Open Wallet',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
