/**
 * Cross-Chain Portfolio Aggregator
 *
 * Aggregates balances across all wallets:
 * - Main HD wallet (derived accounts)
 * - Imported wallets (seed phrase or private key)
 * - Watch-only wallets (address tracking)
 *
 * Provides portfolio-level views: total value, breakdown by chain,
 * and a unified wallet list for the portfolio dashboard.
 */

import { useWalletStore } from '../../store/walletStore';
import type { ChainId } from '../abstractions/types';

// ─── Types ───

export interface WalletEntry {
  id: string;
  name: string;
  type: 'main' | 'imported' | 'watch-only';
  chain: string;
  address: string;
  balance?: number;
  usdValue?: number;
}

export interface PortfolioSummary {
  totalUsdValue: number;
  walletCount: number;
  chainBreakdown: Record<string, number>;
  wallets: WalletEntry[];
}

// ─── Demo balances for simulation ───

const DEMO_BALANCES: Record<string, { balance: number; usdPrice: number }> = {
  bitcoin: { balance: 0.5, usdPrice: 67000 },
  ethereum: { balance: 5.0, usdPrice: 3400 },
  solana: { balance: 1000, usdPrice: 145 },
  cosmos: { balance: 100, usdPrice: 9.5 },
  openchain: { balance: 10000, usdPrice: 0.01 },
};

// ─── Core Functions ───

/**
 * Returns all wallets (main + imported + watch-only) as a unified list.
 * In demo mode, populates balances with simulated values.
 */
export function getAllWallets(): WalletEntry[] {
  const state = useWalletStore.getState();
  const { addresses, accounts, activeAccountIndex, importedWallets, demoMode, balances } = state;
  const wallets: WalletEntry[] = [];

  // Main wallet accounts — one entry per chain that has an address
  const mainAccount = accounts[activeAccountIndex] ?? accounts[0];
  const mainAccountName = mainAccount?.name ?? 'Main Account';

  for (const [chainId, address] of Object.entries(addresses)) {
    if (!address) continue;

    let balance: number | undefined;
    let usdValue: number | undefined;

    if (demoMode) {
      const demo = DEMO_BALANCES[chainId];
      if (demo) {
        balance = demo.balance;
        usdValue = demo.balance * demo.usdPrice;
      }
    } else {
      // Look up from store balances
      const chainBalance = balances.find((b) => b.token.chainId === chainId);
      if (chainBalance) {
        balance = Number(chainBalance.amount) / Math.pow(10, chainBalance.token.decimals);
        usdValue = chainBalance.usdValue;
      }
    }

    wallets.push({
      id: `main-${chainId}`,
      name: mainAccountName,
      type: 'main',
      chain: chainId,
      address,
      balance,
      usdValue,
    });
  }

  // Imported and watch-only wallets
  for (const imported of importedWallets) {
    let balance: number | undefined;
    let usdValue: number | undefined;

    if (demoMode) {
      const demo = DEMO_BALANCES[imported.chain];
      if (demo) {
        // Give imported wallets a fraction of demo balance
        balance = demo.balance * 0.3;
        usdValue = balance * demo.usdPrice;
      }
    }

    wallets.push({
      id: imported.id,
      name: imported.name,
      type: imported.type === 'watch-only' ? 'watch-only' : 'imported',
      chain: imported.chain,
      address: imported.address,
      balance,
      usdValue,
    });
  }

  return wallets;
}

/**
 * Total USD value across all wallets.
 */
export function getTotalPortfolioValue(): number {
  const wallets = getAllWallets();
  return wallets.reduce((sum, w) => sum + (w.usdValue ?? 0), 0);
}

/**
 * Portfolio value broken down by chain.
 * Returns { bitcoin: 33500, ethereum: 17000, solana: 145000, ... }
 */
export function getPortfolioByChain(): Record<string, number> {
  const wallets = getAllWallets();
  const byChain: Record<string, number> = {};

  for (const w of wallets) {
    if (w.usdValue != null) {
      byChain[w.chain] = (byChain[w.chain] ?? 0) + w.usdValue;
    }
  }

  return byChain;
}

/**
 * Full portfolio summary — all wallets, totals, and chain breakdown.
 */
export function getPortfolioSummary(): PortfolioSummary {
  const wallets = getAllWallets();
  const totalUsdValue = wallets.reduce((sum, w) => sum + (w.usdValue ?? 0), 0);
  const chainBreakdown: Record<string, number> = {};

  for (const w of wallets) {
    if (w.usdValue != null) {
      chainBreakdown[w.chain] = (chainBreakdown[w.chain] ?? 0) + w.usdValue;
    }
  }

  return {
    totalUsdValue,
    walletCount: wallets.length,
    chainBreakdown,
    wallets,
  };
}

/**
 * Filter wallets by chain.
 */
export function getWalletsByChain(chainId: ChainId): WalletEntry[] {
  return getAllWallets().filter((w) => w.chain === chainId);
}

/**
 * Filter wallets by type.
 */
export function getWalletsByType(type: 'main' | 'imported' | 'watch-only'): WalletEntry[] {
  return getAllWallets().filter((w) => w.type === type);
}
