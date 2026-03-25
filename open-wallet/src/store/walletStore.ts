/**
 * Global wallet state — Zustand.
 * Selectors prevent unnecessary re-renders.
 * Persistence is non-blocking, debounced.
 */

import { create } from 'zustand';
import type { ChainId, Balance } from '../core/abstractions/types';
import { type NetworkMode, setNetworkMode } from '../core/network';

export type AppMode = 'simple' | 'pro';
export type WalletStatus = 'locked' | 'unlocked' | 'onboarding' | 'pin_setup';

interface WalletState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
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
  currency: string;
  setCurrency: (currency: string) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  supportedChains: ChainId[];
  enabledTokens: string[];
  toggleToken: (symbol: string, enabled: boolean) => void;
  hasVault: boolean;
  setHasVault: (has: boolean) => void;
  tempVaultPassword: string | null;
  setTempVaultPassword: (pw: string | null) => void;

  // ─── Address Book ───
  contacts: Array<{ id: string; name: string; address: string; chain: string }>;
  addContact: (contact: { id: string; name: string; address: string; chain: string }) => void;
  removeContact: (id: string) => void;

  // ─── Multi-Account ───
  accounts: Array<{ name: string; index: number }>;
  activeAccountIndex: number;
  addAccountEntry: (name: string) => void;
  switchAccount: (index: number) => void;

  // ─── Price Alerts ───
  priceAlerts: Array<{ id: string; symbol: string; targetPrice: number; direction: 'above' | 'below'; enabled: boolean; triggered: boolean }>;
  addPriceAlert: (alert: { id: string; symbol: string; targetPrice: number; direction: 'above' | 'below'; enabled: boolean; triggered: boolean }) => void;
  removePriceAlert: (id: string) => void;
  togglePriceAlert: (id: string) => void;
}

const DEFAULT_TOKENS = ['BTC', 'ETH', 'USDT', 'XRP', 'USDC', 'SOL', 'ADA', 'LINK', 'AVAX', 'SUI', 'POL', 'DOT', 'DOGE', 'BNB', 'TON'];

export const useWalletStore = create<WalletState>((set) => ({
  mode: 'simple',
  setMode: (mode) => { set({ mode }); schedulePersist(); },
  networkMode: 'testnet' as NetworkMode,
  setNetworkMode: (mode) => { setNetworkMode(mode); set({ networkMode: mode }); schedulePersist(); },
  status: 'onboarding',
  setStatus: (status) => set({ status }),
  balances: [],
  setBalances: (balances) => set({ balances, totalUsdValue: balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0) }),
  totalUsdValue: 0,
  activeChainId: 'all',
  setActiveChain: (chainId) => set({ activeChainId: chainId }),
  addresses: {},
  setAddresses: (addresses) => { set({ addresses }); schedulePersist(); },
  locale: 'en',
  setLocale: (locale) => { set({ locale }); schedulePersist(); },
  currency: 'usd',
  setCurrency: (currency) => { set({ currency }); schedulePersist(); },
  biometricEnabled: false,
  setBiometricEnabled: (enabled) => { set({ biometricEnabled: enabled }); schedulePersist(); },
  supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
  enabledTokens: DEFAULT_TOKENS,
  toggleToken: (symbol, enabled) => {
    set((state) => ({
      enabledTokens: enabled
        ? [...state.enabledTokens, symbol]
        : state.enabledTokens.filter((s) => s !== symbol),
    }));
    schedulePersist();
  },
  hasVault: false,
  setHasVault: (has) => { set({ hasVault: has }); schedulePersist(); },
  tempVaultPassword: null,
  setTempVaultPassword: (pw) => set({ tempVaultPassword: pw }),
  contacts: [],
  addContact: (contact) => { set((s) => ({ contacts: [...s.contacts, contact] })); schedulePersist(); },
  removeContact: (id) => { set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })); schedulePersist(); },
  accounts: [{ name: 'Main Account', index: 0 }],
  activeAccountIndex: 0,
  addAccountEntry: (name) => { set((s) => ({ accounts: [...s.accounts, { name, index: s.accounts.length }] })); schedulePersist(); },
  switchAccount: (index) => { set({ activeAccountIndex: index }); schedulePersist(); },
  priceAlerts: [],
  addPriceAlert: (alert) => { set((s) => ({ priceAlerts: [...s.priceAlerts, alert] })); schedulePersist(); },
  removePriceAlert: (id) => { set((s) => ({ priceAlerts: s.priceAlerts.filter((a) => a.id !== id) })); schedulePersist(); },
  togglePriceAlert: (id) => { set((s) => ({ priceAlerts: s.priceAlerts.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a) })); schedulePersist(); },
}));

// ─── Non-blocking persistence ───

let asyncStorageModule: any = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(doPersist, 500);
}

async function doPersist() {
  try {
    if (!asyncStorageModule) {
      asyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    }
    const s = useWalletStore.getState();
    await asyncStorageModule.setItem('ow-store', JSON.stringify({
      mode: s.mode, networkMode: s.networkMode, locale: s.locale, currency: s.currency, biometricEnabled: s.biometricEnabled,
      addresses: s.addresses, hasVault: s.hasVault, enabledTokens: s.enabledTokens,
      contacts: s.contacts, accounts: s.accounts, activeAccountIndex: s.activeAccountIndex, priceAlerts: s.priceAlerts,
    }));
  } catch {}
}

// Restore on boot (non-blocking)
// CRITICAL: never overwrite status if user has already interacted
(async () => {
  try {
    if (!asyncStorageModule) {
      asyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    }
    const raw = await asyncStorageModule.getItem('ow-store');
    if (raw) {
      const d = JSON.parse(raw);
      const currentStatus = useWalletStore.getState().status;
      // Only set status from storage if user hasn't already changed it
      const shouldSetStatus = currentStatus === 'onboarding' && !useWalletStore.getState().hasVault;
      // Restore network mode
      const restoredNetworkMode = d.networkMode ?? 'testnet';
      setNetworkMode(restoredNetworkMode);
      useWalletStore.setState({
        mode: d.mode ?? 'simple',
        networkMode: restoredNetworkMode,
        locale: d.locale ?? 'en',
        currency: d.currency ?? 'usd',
        biometricEnabled: d.biometricEnabled ?? false,
        addresses: d.addresses ?? {},
        hasVault: d.hasVault ?? false,
        enabledTokens: d.enabledTokens ?? DEFAULT_TOKENS,
        contacts: d.contacts ?? [],
        accounts: d.accounts ?? [{ name: 'Main Account', index: 0 }],
        activeAccountIndex: d.activeAccountIndex ?? 0,
        priceAlerts: d.priceAlerts ?? [],
        ...(shouldSetStatus ? { status: d.hasVault ? 'locked' : 'onboarding' } : {}),
      });
    }
  } catch {}
})();
