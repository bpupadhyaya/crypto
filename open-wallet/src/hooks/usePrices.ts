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
  get24hChanges,
  getLastFetchTime,
  onPriceUpdate,
  startPriceService,
  refreshPricesNow,
} from '../core/priceService';

export function usePrices() {
  const enabledTokens = useWalletStore((s) => s.enabledTokens);
  const [prices, setPrices] = useState<Record<string, number>>(getPrices);
  const [changes, setChanges] = useState<Record<string, number>>(get24hChanges);
  const [lastUpdated, setLastUpdated] = useState<number>(getLastFetchTime);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startPriceService(enabledTokens);

    const unsub = onPriceUpdate(() => {
      setPrices({ ...getPrices() });
      setChanges({ ...get24hChanges() });
      setLastUpdated(getLastFetchTime());
      setLoading(false);
    });

    const current = getPrices();
    if (Object.keys(current).length > 0) {
      setPrices(current);
      setChanges(get24hChanges());
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

  return { prices, changes, loading, lastUpdated, refresh };
}
