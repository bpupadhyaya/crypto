/**
 * Global wallet state — Zustand store.
 * Uses in-memory state for instant startup.
 * Persists to AsyncStorage in background (non-blocking).
 */

import { create } from 'zustand';
import { ChainId, Balance } from '../core/abstractions/types';

export type AppMode = 'simple' | 'pro';
export type WalletStatus = 'locked' | 'unlocked' | 'onboarding' | 'pin_setup';

interface WalletState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  status: WalletStatus;
  setStatus: (status: WalletStatus) => void;
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
  totalUsdValue: number;
  activeChainId: ChainId | 'all';
  setActiveChain: (chainId: ChainId | 'all') => void;
  addresses: Partial<Record<ChainId, string>>;
  setAddresses: (addresses: Partial<Record<ChainId, string>>) => void;
  locale: string;
  setLocale: (locale: string) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  supportedChains: ChainId[];
  enabledTokens: string[];
  toggleToken: (symbol: string, enabled: boolean) => void;
  hasVault: boolean;
  setHasVault: (has: boolean) => void;
  tempVaultPassword: string | null;
  setTempVaultPassword: (pw: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  mode: 'simple',
  setMode: (mode) => { set({ mode }); persistState(); },
  status: 'onboarding',
  setStatus: (status) => set({ status }),
  balances: [],
  setBalances: (balances) => set({
    balances,
    totalUsdValue: balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0),
  }),
  totalUsdValue: 0,
  activeChainId: 'all',
  setActiveChain: (chainId) => set({ activeChainId: chainId }),
  addresses: {},
  setAddresses: (addresses) => { set({ addresses }); persistState(); },
  locale: 'en',
  setLocale: (locale) => { set({ locale }); persistState(); },
  biometricEnabled: false,
  setBiometricEnabled: (enabled) => { set({ biometricEnabled: enabled }); persistState(); },
  supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  enabledTokens: ['BTC', 'ETH', 'USDT', 'XRP', 'USDC', 'SOL', 'ADA', 'LINK', 'AVAX', 'SUI', 'POL', 'DOT', 'DOGE', 'BNB', 'TON'],
  toggleToken: (symbol, enabled) => {
    set((state) => ({
      enabledTokens: enabled
        ? [...state.enabledTokens, symbol]
        : state.enabledTokens.filter((s) => s !== symbol),
    }));
    persistState();
  },
  hasVault: false,
  setHasVault: (has) => { set({ hasVault: has }); persistState(); },
  tempVaultPassword: null,
  setTempVaultPassword: (pw) => set({ tempVaultPassword: pw }),
}));

// ─── Lightweight persistence (non-blocking) ───

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistState() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const state = useWalletStore.getState();
      const data = {
        mode: state.mode,
        locale: state.locale,
        biometricEnabled: state.biometricEnabled,
        addresses: state.addresses,
        hasVault: state.hasVault,
        enabledTokens: state.enabledTokens,
      };
      await AsyncStorage.setItem('open-wallet-store', JSON.stringify(data));
    } catch {}
  }, 500); // debounce 500ms
}

// Restore state on first import (non-blocking)
(async () => {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const stored = await AsyncStorage.getItem('open-wallet-store');
    if (stored) {
      const data = JSON.parse(stored);
      useWalletStore.setState({
        mode: data.mode ?? 'simple',
        locale: data.locale ?? 'en',
        biometricEnabled: data.biometricEnabled ?? false,
        addresses: data.addresses ?? {},
        hasVault: data.hasVault ?? false,
        enabledTokens: data.enabledTokens ?? ['BTC', 'ETH', 'USDT', 'XRP', 'USDC', 'SOL', 'ADA', 'LINK', 'AVAX', 'SUI', 'POL', 'DOT', 'DOGE', 'BNB', 'TON'],
        status: data.hasVault ? 'locked' : 'onboarding',
      });
    }
  } catch {}
})();
