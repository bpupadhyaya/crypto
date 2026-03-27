/**
 * React Query hooks for live balance and price fetching.
 * Auto-refreshes every 30 seconds.
 * Uses the provider registry — works with server today, mobile P2P tomorrow.
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { registry } from '../core/abstractions/registry';
import { useWalletStore } from '../store/walletStore';
import type { ChainId, Token, Balance } from '../core/abstractions/types';

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
  const chains = Object.entries(addresses).filter(([_, addr]) => !!addr) as [ChainId, string][];

  const queries = useQueries({
    queries: chains.map(([chainId, address]) => ({
      queryKey: ['balance', chainId, address],
      queryFn: async (): Promise<Balance | null> => {
        try {
          const provider = registry.getChainProvider(chainId);
          // Race with 5-second timeout to prevent UI blocking
          const result = await Promise.race([
            provider.getBalance(address),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
          ]);
          return result;
        } catch {
          return null;
        }
      },
      staleTime: 30_000,
      refetchInterval: 60_000, // reduce refetch frequency
    })),
  });

  const balances = queries
    .map((q) => q.data)
    .filter((b): b is Balance => b != null && b.token != null);

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  return { balances, isLoading, isError };
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

// ─── All Prices Hook ───

export function useAllPrices() {
  const tokens = Object.values(NATIVE_TOKENS);

  return useQuery({
    queryKey: ['prices', tokens.map((t) => t.symbol).join(',')],
    queryFn: async (): Promise<Map<string, number>> => {
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
