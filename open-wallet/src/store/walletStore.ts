/**
 * Global wallet state — Zustand.
 * Selectors prevent unnecessary re-renders.
 * Persistence is non-blocking, debounced.
 */

import { create } from 'zustand';
import type { ChainId, Balance } from '../core/abstractions/types';

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

  // ─── Address Book ───
  contacts: Array<{ id: string; name: string; address: string; chain: string }>;
  addContact: (contact: { id: string; name: string; address: string; chain: string }) => void;
  removeContact: (id: string) => void;

  // ─── Multi-Account ───
  accounts: Array<{ name: string; index: number }>;
  activeAccountIndex: number;
  addAccountEntry: (name: string) => void;
  switchAccount: (index: number) => void;
}

const DEFAULT_TOKENS = ['BTC', 'ETH', 'USDT', 'XRP', 'USDC', 'SOL', 'ADA', 'LINK', 'AVAX', 'SUI', 'POL', 'DOT', 'DOGE', 'BNB', 'TON'];

export const useWalletStore = create<WalletState>((set) => ({
  mode: 'simple',
  setMode: (mode) => { set({ mode }); schedulePersist(); },
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
  addAccountEntry: (name) => {
    set((s) => ({ accounts: [...s.accounts, { name, index: s.accounts.length }] }));
    schedulePersist();
  },
  switchAccount: (index) => { set({ activeAccountIndex: index }); schedulePersist(); },
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
      mode: s.mode, locale: s.locale, biometricEnabled: s.biometricEnabled,
      addresses: s.addresses, hasVault: s.hasVault, enabledTokens: s.enabledTokens,
      contacts: s.contacts, accounts: s.accounts, activeAccountIndex: s.activeAccountIndex,
    }));
  } catch {}
}

// Restore on boot (non-blocking)
(async () => {
  try {
    if (!asyncStorageModule) {
      asyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    }
    const raw = await asyncStorageModule.getItem('ow-store');
    if (raw) {
      const d = JSON.parse(raw);
      useWalletStore.setState({
        mode: d.mode ?? 'simple',
        locale: d.locale ?? 'en',
        biometricEnabled: d.biometricEnabled ?? false,
        addresses: d.addresses ?? {},
        hasVault: d.hasVault ?? false,
        enabledTokens: d.enabledTokens ?? DEFAULT_TOKENS,
        contacts: d.contacts ?? [],
        accounts: d.accounts ?? [{ name: 'Main Account', index: 0 }],
        activeAccountIndex: d.activeAccountIndex ?? 0,
        status: d.hasVault ? 'locked' : 'onboarding',
      });
    }
  } catch {}
})();
