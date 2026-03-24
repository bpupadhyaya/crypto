/**
 * Global wallet state — Zustand store with persistence.
 * Persists mode, locale, and account metadata to AsyncStorage.
 * Sensitive data (keys, mnemonic) is in the encrypted Vault, NOT here.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChainId, Balance, WalletAccount } from '../core/abstractions/types';

export type AppMode = 'simple' | 'pro';
export type WalletStatus = 'locked' | 'unlocked' | 'onboarding' | 'pin_setup';

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

  // ─── Balances (not persisted — fetched fresh) ───
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
  totalUsdValue: number;

  // ─── Active Chain ───
  activeChainId: ChainId | 'all';
  setActiveChain: (chainId: ChainId | 'all') => void;

  // ─── Addresses (derived from HD wallet, cached here for quick access) ───
  addresses: Partial<Record<ChainId, string>>;
  setAddresses: (addresses: Partial<Record<ChainId, string>>) => void;

  // ─── UI State ───
  isRefreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  locale: string;
  setLocale: (locale: string) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;

  // ─── Supported Chains ───
  supportedChains: ChainId[];

  // ─── Vault ───
  hasVault: boolean;
  setHasVault: (has: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      // Mode
      mode: 'simple',
      setMode: (mode) => set({ mode }),

      // Status — always starts locked or onboarding, determined at launch
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

      // Balances — transient, not persisted
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

      // Addresses
      addresses: {},
      setAddresses: (addresses) => set({ addresses }),

      // UI
      isRefreshing: false,
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      biometricEnabled: false,
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      // Chains
      supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos'],

      // Vault
      hasVault: false,
      setHasVault: (has) => set({ hasVault: has }),
    }),
    {
      name: 'open-wallet-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user preferences and account metadata — NOT balances or sensitive data
      partialize: (state) => ({
        mode: state.mode,
        locale: state.locale,
        biometricEnabled: state.biometricEnabled,
        activeChainId: state.activeChainId,
        addresses: state.addresses,
        hasVault: state.hasVault,
      }),
    }
  )
);
