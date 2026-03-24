/**
 * Swap hook — fetches real quotes from DEX/Bridge providers.
 * Auto-detects whether same-chain (DEX) or cross-chain (bridge).
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { registry } from '../core/abstractions/registry';
import type { Token, SwapQuote } from '../core/abstractions/types';

export function useSwapQuote(
  fromToken: Token | null,
  toToken: Token | null,
  amount: bigint | null,
  slippageBps: number = 50,
) {
  return useQuery({
    queryKey: ['swap-quote', fromToken?.symbol, toToken?.symbol, amount?.toString(), slippageBps],
    queryFn: async (): Promise<SwapQuote | null> => {
      if (!fromToken || !toToken || !amount || amount <= 0n) return null;

      try {
        // Same chain → DEX
        if (fromToken.chainId === toToken.chainId) {
          const dex = registry.getDexProvider(fromToken.chainId);
          return await dex.getQuote(fromToken, toToken, amount, slippageBps);
        }

        // Cross-chain → Bridge
        const bridge = registry.getBridgeProvider();
        return await bridge.getBridgeQuote(fromToken, toToken, amount);
      } catch (error) {
        console.warn('Quote fetch failed:', error);
        return null;
      }
    },
    enabled: !!fromToken && !!toToken && !!amount && amount > 0n,
    staleTime: 15_000, // quotes expire fast
    refetchInterval: 15_000,
  });
}

export function useSwapExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(async (
    quote: SwapQuote,
    signerFn: (data: Uint8Array) => Promise<Uint8Array>,
  ) => {
    setIsExecuting(true);
    setError(null);
    setTxHash(null);

    try {
      if (quote.fromToken.chainId === quote.toToken.chainId) {
        const dex = registry.getDexProvider(quote.fromToken.chainId);
        const tx = await dex.executeSwap(quote, signerFn);
        setTxHash(tx.hash ?? tx.id);
      } else {
        const bridge = registry.getBridgeProvider();
        const tx = await bridge.executeBridge(quote, signerFn);
        setTxHash(tx.hash ?? tx.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return { executeSwap, isExecuting, txHash, error };
}
