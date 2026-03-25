/**
 * Network status hook — detects online/offline state.
 * Shows banner when offline, queues operations.
 */

import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkConnectivity = async () => {
      try {
        // Lightweight connectivity check — HEAD request to known endpoint
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setIsOnline(response.ok || response.status === 204);
      } catch {
        setIsOnline(false);
      }
    };

    // Check on mount
    checkConnectivity();

    // Re-check when app comes to foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkConnectivity();
    });

    // Periodic check every 30s
    interval = setInterval(checkConnectivity, 30_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
