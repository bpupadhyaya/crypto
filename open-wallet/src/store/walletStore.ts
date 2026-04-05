/**
 * Global wallet state — Zustand.
 * Selectors prevent unnecessary re-renders.
 * Persistence is non-blocking, debounced.
 */

import { create } from 'zustand';
import type { ChainId, Balance, BackendType } from '../core/abstractions/types';
import { type NetworkMode, setNetworkMode } from '../core/network';
import { type ThemeMode, type DisplayScales, DEFAULT_DISPLAY_SCALES, applyDisplayScales } from '../utils/theme';

export type AppMode = 'simple' | 'pro';
export type WalletStatus = 'locked' | 'unlocked' | 'onboarding' | 'pin_setup';

interface WalletState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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

  // ─── Stablecoin Chain Tracking ───
  stablecoinChains: Partial<Record<string, string>>;
  setStablecoinChain: (symbol: string, chain: string) => void;

  // ─── Dev/Demo Balances (mutable, updated by simulated swaps) ───
  devBalances: Record<string, number>; // symbol → human-readable amount
  updateDevBalance: (symbol: string, delta: number) => void;
  resetDevBalances: () => void;
  setHasVault: (has: boolean) => void;
  tempVaultPassword: string | null;
  setTempVaultPassword: (pw: string | null) => void;

  // ─── Wallet Provider ───
  walletProvider: 'software' | 'seed-vault';
  setWalletProvider: (provider: 'software' | 'seed-vault') => void;

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

  // ─── Imported Wallets ───
  importedWallets: Array<{ id: string; name: string; type: 'imported' | 'watch-only'; chain: string; address: string; importMethod: 'seed' | 'private-key' | 'address'; addedAt: number }>;
  addImportedWallet: (wallet: { id: string; name: string; type: 'imported' | 'watch-only'; chain: string; address: string; importMethod: 'seed' | 'private-key' | 'address'; addedAt: number }) => void;
  removeImportedWallet: (id: string) => void;

  // ─── Accessibility ───
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;
  screenReaderHints: boolean;
  setScreenReaderHints: (enabled: boolean) => void;
  hapticFeedback: boolean;
  setHapticFeedback: (enabled: boolean) => void;

  // ─── P2P / Backend Mode ───
  backendType: BackendType;
  setBackendType: (type: BackendType) => void;
  p2pEnabled: boolean;
  setP2PEnabled: (enabled: boolean) => void;
  p2pBootstrapPeers: string[];
  setP2PBootstrapPeers: (peers: string[]) => void;
  p2pEnableMDNS: boolean;
  setP2PEnableMDNS: (enabled: boolean) => void;

  // ─── Auto-Lock ───
  autoLockTimeout: number; // ms, 0 = never
  setAutoLockTimeout: (ms: number) => void;

  // ─── Persona Onboarding (Art IX) ───
  persona: string | null;
  setPersona: (persona: string | null) => void;
  personaInterests: string[];
  setPersonaInterests: (interests: string[]) => void;
  personaRegion: string | null;
  setPersonaRegion: (region: string | null) => void;
  personaLanguage: string | null;
  setPersonaLanguage: (language: string | null) => void;
  personaShortcuts: string[];
  setPersonaShortcuts: (shortcuts: string[]) => void;

  // ─── Display Scales (user-adjustable font/icon sizing) ───
  displayScales: DisplayScales;
  setDisplayScale: (key: keyof DisplayScales, value: number) => void;
  resetDisplayScales: () => void;
}

const DEFAULT_TOKENS = ['OTK', 'BTC', 'ETH', 'USDT', 'XRP', 'USDC', 'SOL', 'ADA', 'LINK', 'AVAX', 'SUI', 'POL', 'DOT', 'DOGE', 'BNB', 'TON'];

/** Default dev balances for all supported tokens — only used in __DEV__ builds */
const DEFAULT_DEV_BALANCES: Record<string, number> = {
  BTC: 1.25, ETH: 12.5, SOL: 500, ADA: 10000, XRP: 8000, DOGE: 50000,
  DOT: 800, AVAX: 250, LINK: 1500, SUI: 3000, POL: 20000, BNB: 15,
  TON: 2000, USDT: 5000, USDC: 5000, OTK: 50000, ATOM: 500,
};

export const useWalletStore = create<WalletState>((set) => ({
  mode: 'simple',
  setMode: (mode) => { set({ mode }); schedulePersist(); },
  demoMode: false,
  setDemoMode: (enabled) => { set({ demoMode: enabled }); schedulePersist(); },
  networkMode: 'testnet' as NetworkMode,
  setNetworkMode: (mode) => { setNetworkMode(mode); set({ networkMode: mode }); schedulePersist(); },
  themeMode: 'dark' as ThemeMode,
  setThemeMode: (mode) => { set({ themeMode: mode }); schedulePersist(); },
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
  supportedChains: ['bitcoin', 'ethereum', 'solana', 'cosmos', 'openchain'],
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
  stablecoinChains: {},
  setStablecoinChain: (symbol, chain) => { set((s) => ({ stablecoinChains: { ...s.stablecoinChains, [symbol]: chain } })); schedulePersist(); },
  devBalances: { ...DEFAULT_DEV_BALANCES },
  resetDevBalances: () => { set({ devBalances: { ...DEFAULT_DEV_BALANCES } }); schedulePersist(); },
  updateDevBalance: (symbol, delta) => { set((s) => ({ devBalances: { ...s.devBalances, [symbol]: Math.max(0, (s.devBalances[symbol] ?? 0) + delta) } })); schedulePersist(); },
  tempVaultPassword: null,
  setTempVaultPassword: (pw) => set({ tempVaultPassword: pw }),
  walletProvider: 'software' as const,
  setWalletProvider: (provider) => { set({ walletProvider: provider }); schedulePersist(); },
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
  importedWallets: [],
  addImportedWallet: (wallet) => { set((s) => ({ importedWallets: [...s.importedWallets, wallet] })); schedulePersist(); },
  removeImportedWallet: (id) => { set((s) => ({ importedWallets: s.importedWallets.filter((w) => w.id !== id) })); schedulePersist(); },
  fontSize: 'medium' as const,
  setFontSize: (size) => { set({ fontSize: size }); schedulePersist(); },
  highContrast: false,
  setHighContrast: (enabled) => { set({ highContrast: enabled }); schedulePersist(); },
  reduceMotion: false,
  setReduceMotion: (enabled) => { set({ reduceMotion: enabled }); schedulePersist(); },
  screenReaderHints: false,
  setScreenReaderHints: (enabled) => { set({ screenReaderHints: enabled }); schedulePersist(); },
  hapticFeedback: true,
  setHapticFeedback: (enabled) => { set({ hapticFeedback: enabled }); schedulePersist(); },
  backendType: 'server' as BackendType,
  setBackendType: (type) => { set({ backendType: type }); schedulePersist(); },
  p2pEnabled: false,
  setP2PEnabled: (enabled) => { set({ p2pEnabled: enabled }); schedulePersist(); },
  p2pBootstrapPeers: [],
  setP2PBootstrapPeers: (peers) => { set({ p2pBootstrapPeers: peers }); schedulePersist(); },
  p2pEnableMDNS: false,
  setP2PEnableMDNS: (enabled) => { set({ p2pEnableMDNS: enabled }); schedulePersist(); },
  autoLockTimeout: 5 * 60 * 1000, // default 5 minutes
  setAutoLockTimeout: (ms) => { set({ autoLockTimeout: ms }); schedulePersist(); },
  persona: null,
  setPersona: (persona) => { set({ persona }); schedulePersist(); },
  personaInterests: [],
  setPersonaInterests: (interests) => { set({ personaInterests: interests }); schedulePersist(); },
  personaRegion: null,
  setPersonaRegion: (region) => { set({ personaRegion: region }); schedulePersist(); },
  personaLanguage: null,
  setPersonaLanguage: (language) => { set({ personaLanguage: language }); schedulePersist(); },
  personaShortcuts: [],
  setPersonaShortcuts: (shortcuts) => { set({ personaShortcuts: shortcuts }); schedulePersist(); },
  displayScales: { ...DEFAULT_DISPLAY_SCALES },
  setDisplayScale: (key, value) => {
    set((s) => {
      const updated = { ...s.displayScales, [key]: value };
      applyDisplayScales(updated);
      return { displayScales: updated };
    });
    schedulePersist();
  },
  resetDisplayScales: () => {
    applyDisplayScales(DEFAULT_DISPLAY_SCALES);
    set({ displayScales: { ...DEFAULT_DISPLAY_SCALES } });
    schedulePersist();
  },
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
      mode: s.mode, demoMode: s.demoMode, networkMode: s.networkMode, themeMode: s.themeMode, locale: s.locale, currency: s.currency, biometricEnabled: s.biometricEnabled,
      addresses: s.addresses, hasVault: s.hasVault, enabledTokens: s.enabledTokens,
      contacts: s.contacts, accounts: s.accounts, activeAccountIndex: s.activeAccountIndex, priceAlerts: s.priceAlerts,
      importedWallets: s.importedWallets,
      fontSize: s.fontSize, highContrast: s.highContrast, reduceMotion: s.reduceMotion, screenReaderHints: s.screenReaderHints, hapticFeedback: s.hapticFeedback,
      backendType: s.backendType, p2pEnabled: s.p2pEnabled, p2pBootstrapPeers: s.p2pBootstrapPeers, p2pEnableMDNS: s.p2pEnableMDNS,
      autoLockTimeout: s.autoLockTimeout,
      stablecoinChains: s.stablecoinChains,
      devBalances: s.devBalances,
      persona: s.persona, personaInterests: s.personaInterests, personaRegion: s.personaRegion, personaLanguage: s.personaLanguage, personaShortcuts: s.personaShortcuts,
      displayScales: s.displayScales,
    }));
  } catch {}
}

// Ensure OTK is always in the enabled tokens list (migration for existing users)
function ensureOTK(tokens: string[]): string[] {
  if (!tokens.includes('OTK')) return ['OTK', ...tokens];
  return tokens;
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
        demoMode: d.demoMode ?? false,
        networkMode: restoredNetworkMode,
        themeMode: d.themeMode ?? 'dark',
        locale: d.locale ?? 'en',
        currency: d.currency ?? 'usd',
        biometricEnabled: d.biometricEnabled ?? false,
        addresses: d.addresses ?? {},
        hasVault: d.hasVault ?? false,
        enabledTokens: ensureOTK(d.enabledTokens ?? DEFAULT_TOKENS),
        contacts: d.contacts ?? [],
        accounts: d.accounts ?? [{ name: 'Main Account', index: 0 }],
        activeAccountIndex: d.activeAccountIndex ?? 0,
        priceAlerts: d.priceAlerts ?? [],
        importedWallets: d.importedWallets ?? [],
        fontSize: d.fontSize ?? 'medium',
        highContrast: d.highContrast ?? false,
        reduceMotion: d.reduceMotion ?? false,
        screenReaderHints: d.screenReaderHints ?? false,
        hapticFeedback: d.hapticFeedback ?? true,
        backendType: d.backendType ?? 'server',
        p2pEnabled: d.p2pEnabled ?? false,
        p2pBootstrapPeers: d.p2pBootstrapPeers ?? [],
        p2pEnableMDNS: d.p2pEnableMDNS ?? false,
        autoLockTimeout: d.autoLockTimeout ?? (5 * 60 * 1000),
        stablecoinChains: d.stablecoinChains ?? {},
        devBalances: d.devBalances ?? { ...DEFAULT_DEV_BALANCES },
        displayScales: d.displayScales ?? { ...DEFAULT_DISPLAY_SCALES },
        ...(shouldSetStatus ? { status: d.hasVault ? 'locked' : 'onboarding' } : {}),
      });
      // Apply restored display scales to the fonts system
      const restoredScales = d.displayScales ?? DEFAULT_DISPLAY_SCALES;
      applyDisplayScales(restoredScales);
    }
  } catch {}
})();
