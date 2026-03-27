/**
 * Live prices hook — reads from the global background price service.
 *
 * The price service runs independently of any component.
 * This hook just subscribes to updates and returns the latest cache.
 * Zero blocking, zero fetching on mount — prices are already there.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import {
  getPrices,
  getLastFetchTime,
  onPriceUpdate,
  startPriceService,
  refreshPricesNow,
} from '../core/priceService';

export function usePrices() {
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const [prices, setPrices] = useState<Record<string, number>>(getPrices);
  const [lastUpdated, setLastUpdated] = useState<number>(getLastFetchTime);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure the background service is running
    startPriceService(enabledTokens);

    // Subscribe to price updates from the background service
    const unsub = onPriceUpdate(() => {
      setPrices({ ...getPrices() });
      setLastUpdated(getLastFetchTime());
      setLoading(false);
    });

    // Seed with current cache (may already have data)
    const current = getPrices();
    if (Object.keys(current).length > 0) {
      setPrices(current);
      setLastUpdated(getLastFetchTime());
    }

    return unsub;
  }, [enabledTokens]);

  const refresh = useCallback(() => {
    setLoading(true);
    refreshPricesNow(enabledTokens);
  }, [enabledTokens]);

  // Check price alerts
  useEffect(() => {
    const alerts = useWalletStore.getState().priceAlerts;
    for (const alert of alerts) {
      if (!alert.enabled || alert.triggered) continue;
      const price = prices[alert.symbol];
      if (!price) continue;
      const hit = alert.direction === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice;
      if (hit) {
        useWalletStore.setState((s) => ({
          priceAlerts: s.priceAlerts.map((a) => a.id === alert.id ? { ...a, triggered: true } : a),
        }));
        Alert.alert('Price Alert', `${alert.symbol} is now $${price.toLocaleString()} (${alert.direction} $${alert.targetPrice.toLocaleString()})`);
      }
    }
  }, [prices]);

  return { prices, loading, lastUpdated, refresh };
}
