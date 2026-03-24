/**
 * Global wallet state — Zustand store.
 * Single source of truth for the app.
 */

import { create } from 'zustand';
import { ChainId, Balance, Token, WalletAccount } from '../core/abstractions/types';

export type AppMode = 'simple' | 'pro';
export type WalletStatus = 'locked' | 'unlocked' | 'onboarding';

interface WalletState {
  // ─── App Mode ───
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // ─── Wallet Status ───
  status: WalletStatus;
  setStatus: (status: WalletStatus) => void;

  // ─── Accounts ───
  accounts: WalletAccount[];
  activeAccountId: string | null;
  setActiveAccount: (id: string) => void;
  addAccount: (account: WalletAccount) => void;

  // ─── Balances ───
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
  totalUsdValue: number;

  // ─── Active Chain ───
  activeChainId: ChainId | 'all';
  setActiveChain: (chainId: ChainId | 'all') => void;

  // ─── UI State ───
  isRefreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  locale: string;
  setLocale: (locale: string) => void;

  // ─── Supported Chains ───
  supportedChains: ChainId[];
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Mode
  mode: 'simple',
  setMode: (mode) => set({ mode }),

  // Status
  status: 'onboarding',
  setStatus: (status) => set({ status }),

  // Accounts
  accounts: [],
  activeAccountId: null,
  setActiveAccount: (id) => set({ activeAccountId: id }),
  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
      activeAccountId: state.activeAccountId ?? account.id,
    })),

  // Balances
  balances: [],
  setBalances: (balances) =>
    set({
      balances,
      totalUsdValue: balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0),
    }),
  totalUsdValue: 0,

  // Chain
  activeChainId: 'all',
  setActiveChain: (chainId) => set({ activeChainId: chainId }),

  // UI
  isRefreshing: false,
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  locale: 'en',
  setLocale: (locale) => set({ locale }),

  // Chains
  supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],
}));
