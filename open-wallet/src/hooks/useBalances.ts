/**
 * React Query hooks for live balance and price fetching.
 * Auto-refreshes every 30 seconds.
 * Uses the provider registry — works with server today, mobile P2P tomorrow.
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { registry } from '../core/abstractions/registry';
import { useWalletStore } from '../store/walletStore';
import type { ChainId, Token, Balance } from '../core/abstractions/types';

// ─── Default dev balance template ───

const DEV_BALANCE_DECIMALS: Record<string, { chainId: string; name: string; decimals: number }> = {
  BTC:  { chainId: 'bitcoin',    name: 'Bitcoin',    decimals: 8 },
  ETH:  { chainId: 'ethereum',   name: 'Ethereum',   decimals: 18 },
  SOL:  { chainId: 'solana',     name: 'Solana',     decimals: 9 },
  ADA:  { chainId: 'cardano',    name: 'Cardano',    decimals: 6 },
  XRP:  { chainId: 'xrp',        name: 'XRP',        decimals: 6 },
  DOGE: { chainId: 'dogecoin',   name: 'Dogecoin',   decimals: 8 },
  DOT:  { chainId: 'polkadot',   name: 'Polkadot',   decimals: 10 },
  AVAX: { chainId: 'avalanche',  name: 'Avalanche',  decimals: 18 },
  LINK: { chainId: 'ethereum',   name: 'Chainlink',  decimals: 18 },
  SUI:  { chainId: 'sui',        name: 'Sui',        decimals: 9 },
  POL:  { chainId: 'polygon',    name: 'Polygon',    decimals: 18 },
  BNB:  { chainId: 'bsc',        name: 'BNB',        decimals: 18 },
  TON:  { chainId: 'ton',        name: 'Toncoin',    decimals: 9 },
  USDT: { chainId: 'ethereum',   name: 'Tether',     decimals: 6 },
  USDC: { chainId: 'ethereum',   name: 'USD Coin',   decimals: 6 },
  OTK:  { chainId: 'openchain',  name: 'Open Token', decimals: 6 },
  ATOM: { chainId: 'cosmos',     name: 'Cosmos',     decimals: 6 },
};

function buildDemoBalances(devBalances: Record<string, number>): Balance[] {
  return Object.entries(devBalances)
    .filter(([sym, amount]) => amount > 0 && DEV_BALANCE_DECIMALS[sym])
    .map(([sym, amount]) => {
      const meta = DEV_BALANCE_DECIMALS[sym];
      return {
        token: { symbol: sym, name: meta.name, chainId: meta.chainId, decimals: meta.decimals },
        amount: BigInt(Math.round(amount * Math.pow(10, meta.decimals))),
        usdValue: undefined,
      };
    });
}

// ─── Well-known native tokens ───

const NATIVE_TOKENS: Record<ChainId, Token> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', chainId: 'bitcoin', decimals: 8 },
  ethereum: { symbol: 'ETH', name: 'Ethereum', chainId: 'ethereum', decimals: 18 },
  solana: { symbol: 'SOL', name: 'Solana', chainId: 'solana', decimals: 9 },
  cosmos: { symbol: 'ATOM', name: 'Cosmos', chainId: 'cosmos', decimals: 6 },
  openchain: { symbol: 'OTK', name: 'Open Token', chainId: 'openchain', decimals: 6 },
};

// ─── Balance Hook ───

export function useBalance(chainId: ChainId, address: string | undefined) {
  return useQuery({
    queryKey: ['balance', chainId, address],
    queryFn: async (): Promise<Balance | null> => {
      if (!address) return null;
      try {
        const provider = registry.getChainProvider(chainId);
        return await provider.getBalance(address);
      } catch {
        return null;
      }
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ─── All Balances Hook ───

export function useAllBalances(addresses: Partial<Record<ChainId, string>>) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const devBalances = useWalletStore((s) => s.devBalances);
  const chains = Object.entries(addresses).filter(([_, addr]) => !!addr) as [ChainId, string][];

  // Always call useQueries (hooks must not be conditional), but disable when demo
  const queries = useQueries({
    queries: demoMode ? [] : chains.map(([chainId, address]) => ({
      queryKey: ['balance', chainId, address],
      queryFn: async (): Promise<Balance | null> => {
        try {
          const provider = registry.getChainProvider(chainId);
          const result = await Promise.race([
            provider.getBalance(address),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ]);
          return result;
        } catch {
          return null;
        }
      },
      staleTime: 30_000,
      refetchInterval: 60_000,
    })),
  });

  if (demoMode) {
    return { balances: buildDemoBalances(devBalances), isLoading: false, isError: false };
  }

  // If registry queries returned results, use them
  const balances = queries
    .map((q) => q.data)
    .filter((b): b is Balance => b != null && b.token != null);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  return { balances, isLoading, isError };
}

/**
 * Hook that returns real on-chain balances as a simple symbol → amount map.
 * Used by SwapScreen for balance validation on mainnet.
 * Falls back to devBalances in demo/testnet mode.
 */
export function useRealBalances(addresses: Partial<Record<string, string>>) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const devBalances = useWalletStore((s) => s.devBalances);

  return useQuery({
    queryKey: ['realBalances', demoMode, ...Object.values(addresses)],
    queryFn: async (): Promise<Record<string, number>> => {
      if (demoMode) return devBalances;
      const { fetchAllBalances } = await import('../core/balances/balanceFetcher');
      return fetchAllBalances(addresses);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ─── Price Hook ───

export function useTokenPrice(token: Token) {
  return useQuery({
    queryKey: ['price', token.symbol],
    queryFn: async (): Promise<number> => {
      try {
        const oracle = registry.getOracleProvider();
        return await oracle.getPrice(token);
      } catch {
        return 0;
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ─── Demo prices (no network needed) ───

const DEMO_PRICES = new Map<string, number>([
  ['BTC', 87000], ['ETH', 2100], ['SOL', 140], ['ADA', 0.45], ['XRP', 0.52],
  ['DOGE', 0.08], ['DOT', 4.50], ['AVAX', 22], ['LINK', 14], ['SUI', 1.10],
  ['POL', 0.55], ['BNB', 600], ['TON', 3.50], ['USDT', 1.00], ['USDC', 1.00],
  ['OTK', 0.01], ['ATOM', 7.50],
]);

// ─── All Prices Hook ───

export function useAllPrices() {
  const demoMode = useWalletStore((s) => s.demoMode);
  const tokens = Object.values(NATIVE_TOKENS);

  return useQuery({
    queryKey: ['prices', demoMode ? 'demo' : tokens.map((t) => t.symbol).join(',')],
    queryFn: async (): Promise<Map<string, number>> => {
      // Demo mode — return hardcoded prices instantly
      if (demoMode) return DEMO_PRICES;
      try {
        const oracle = registry.getOracleProvider();
        return await oracle.getPrices(tokens);
      } catch {
        return new Map();
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ─── Combined Balance + Price Hook ───

export function usePortfolio(addresses: Partial<Record<ChainId, string>>) {
  const { balances, isLoading: balancesLoading } = useAllBalances(addresses);
  const { data: prices, isLoading: pricesLoading } = useAllPrices();

  const enrichedBalances: Balance[] = balances.filter((b) => b?.token).map((balance) => {
    const price = prices?.get(balance.token.symbol) ?? 0;
    const decimals = balance.token.decimals;
    const humanAmount = Number(balance.amount) / Math.pow(10, decimals);
    return {
      ...balance,
      usdValue: humanAmount * price,
    };
  });

  const totalUsdValue = enrichedBalances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0);

  return {
    balances: enrichedBalances,
    totalUsdValue,
    isLoading: balancesLoading || pricesLoading,
  };
}

export { NATIVE_TOKENS };
