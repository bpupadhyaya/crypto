/**
 * Deep Linking — handle openwallet:// URLs.
 *
 * Supported deep links:
 *   openwallet://send?to=address&amount=1.5&token=SOL
 *   openwallet://receive
 *   openwallet://swap?from=BTC&to=ETH&amount=0.1
 *   openwallet://connect?uri=wc:...  (WalletConnect)
 *   openwallet://pay?rail=upi&amount=100&currency=INR
 *   openwallet://profile?uid=uid-abc123
 *
 * These URLs can be shared via QR codes, messages, or websites
 * to trigger specific actions in the wallet.
 */

import { Linking } from 'react-native';

export interface DeepLinkAction {
  type: 'send' | 'receive' | 'swap' | 'connect' | 'pay' | 'profile' | 'unknown';
  params: Record<string, string>;
}

/** Parse a deep link URL into an action. */
export function parseDeepLink(url: string): DeepLinkAction {
  try {
    // Handle both openwallet:// and https://openwallet.app/ formats
    const cleaned = url
      .replace('openwallet://', '')
      .replace('https://openwallet.app/', '')
      .replace('com.equalinformation.openwallet://', '');

    const [path, queryString] = cleaned.split('?');
    const params: Record<string, string> = {};

    if (queryString) {
      for (const pair of queryString.split('&')) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }

    switch (path) {
      case 'send':
        return { type: 'send', params };
      case 'receive':
        return { type: 'receive', params };
      case 'swap':
        return { type: 'swap', params };
      case 'connect':
        return { type: 'connect', params };
      case 'pay':
        return { type: 'pay', params };
      case 'profile':
        return { type: 'profile', params };
      default:
        return { type: 'unknown', params: { path, ...params } };
    }
  } catch {
    return { type: 'unknown', params: {} };
  }
}

/** Generate a deep link URL for a send action. */
export function createSendLink(to: string, amount?: number, token?: string): string {
  let url = `openwallet://send?to=${encodeURIComponent(to)}`;
  if (amount) url += `&amount=${amount}`;
  if (token) url += `&token=${encodeURIComponent(token)}`;
  return url;
}

/** Generate a deep link URL for a swap action. */
export function createSwapLink(from: string, to: string, amount?: number): string {
  let url = `openwallet://swap?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  if (amount) url += `&amount=${amount}`;
  return url;
}

/** Generate a deep link for a payment request. */
export function createPaymentRequestLink(amount: number, token: string, address: string, memo?: string): string {
  let url = `openwallet://send?to=${encodeURIComponent(address)}&amount=${amount}&token=${encodeURIComponent(token)}`;
  if (memo) url += `&memo=${encodeURIComponent(memo)}`;
  return url;
}

/** Listen for incoming deep links. Returns unsubscribe function. */
export function onDeepLink(handler: (action: DeepLinkAction) => void): () => void {
  const subscription = Linking.addEventListener('url', (event) => {
    const action = parseDeepLink(event.url);
    handler(action);
  });

  // Also check if app was opened via deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      const action = parseDeepLink(url);
      handler(action);
    }
  });

  return () => subscription.remove();
}
