/**
 * Swap Engine — Aggregates all 8 swap options.
 *
 * Built-in (always available):
 * 1. Open Wallet Atomic Swap (P2P HTLC) — Security 5/5
 * 2. Open Wallet DEX (AMM on Open Chain) — Security 4/5
 * 3. Open Wallet Order Book (limit orders) — Security 4.5/5
 *
 * External (optional liquidity):
 * 4. THORChain — Security 3.5/5
 * 5. 1inch — Security 3.5/5
 * 6. Jupiter — Security 3.5/5
 * 7. Li.Fi Bridge — Security 3/5
 * 8. Osmosis IBC — Security 4/5
 */

import { getDEXQuote, type DEXQuote } from './dex';
import { getOrderBookQuote } from './orderbook';
import { getAllExternalQuotes, type ExternalQuote } from './external';

export interface SwapOption {
  id: string;
  name: string;
  icon: string;
  category: 'built-in' | 'external';
  securityRating: number;
  securityNote: string;
  speed: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fee: string;
  route: string;
  available: boolean;
  error?: string;
  priceImpact: number;
  alwaysAvailable: boolean; // true = can never go down
}

/**
 * Get all swap options for a pair — both built-in and external.
 * Returns sorted by best output (highest toAmount first).
 */
export async function getAllSwapOptions(params: {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  fromAddress: string;
  toAddress: string;
  slippageBps?: number;
}): Promise<SwapOption[]> {
  const { fromToken, toToken, fromAmount, fromAddress, toAddress, slippageBps } = params;
  const options: SwapOption[] = [];

  // Fetch all quotes in parallel
  const [dexQuote, obQuote, externalQuotes] = await Promise.all([
    getDEXQuote(fromToken, toToken, fromAmount, slippageBps).catch(() => null),
    getOrderBookQuote(fromToken, toToken, fromAmount).catch(() => null),
    getAllExternalQuotes(fromToken, toToken, fromAmount, fromAddress, toAddress).catch(() => []),
  ]);

  // 1. Open Wallet Atomic Swap (always available)
  const atomicEstimate = estimateAtomicOutput(fromToken, toToken, fromAmount);
  options.push({
    id: 'ow-atomic',
    name: 'Open Wallet Atomic Swap',
    icon: '🔐',
    category: 'built-in',
    securityRating: 5,
    securityNote: 'Pure cryptography (HTLC). Zero dependency. Never hacked. Works as long as Bitcoin and Ethereum exist.',
    speed: '~15-60 min',
    fromToken, toToken, fromAmount,
    toAmount: atomicEstimate,
    fee: 'Network fees only',
    route: 'P2P Atomic Swap (HTLC)',
    available: true,
    priceImpact: 0,
    alwaysAvailable: true,
  });

  // 2. Open Wallet DEX
  if (dexQuote) {
    options.push({
      id: 'ow-dex',
      name: 'Open Wallet DEX',
      icon: '🏊',
      category: 'built-in',
      securityRating: 4,
      securityNote: 'AMM pool on Open Chain. Our chain, our code, our control. No flash loan risk.',
      speed: '~5 sec',
      fromToken, toToken, fromAmount,
      toAmount: dexQuote.toAmount,
      fee: `~$${dexQuote.feeUsd.toFixed(2)}`,
      route: dexQuote.route,
      available: true,
      priceImpact: dexQuote.priceImpact,
      alwaysAvailable: false, // depends on Open Chain
    });
  }

  // 3. Open Wallet Order Book
  if (obQuote) {
    options.push({
      id: 'ow-orderbook',
      name: 'Open Wallet Order Book',
      icon: '📋',
      category: 'built-in',
      securityRating: 4.5,
      securityNote: 'On-chain limit orders. Set your own price. Settlement via atomic swap.',
      speed: obQuote.fillable ? 'Instant' : 'Waiting for match',
      fromToken, toToken, fromAmount,
      toAmount: obQuote.toAmount,
      fee: '~$0.01',
      route: `Order Book (${obQuote.numOrders} orders)`,
      available: obQuote.fillable,
      priceImpact: 0,
      alwaysAvailable: false,
    });
  }

  // 4-8. External providers
  for (const eq of externalQuotes as ExternalQuote[]) {
    options.push({
      id: `ext-${eq.provider.toLowerCase().replace(/\s+/g, '-')}`,
      name: eq.provider,
      icon: eq.providerIcon,
      category: 'external',
      securityRating: eq.securityRating,
      securityNote: eq.securityNote,
      speed: eq.speed,
      fromToken, toToken, fromAmount,
      toAmount: eq.toAmount,
      fee: eq.feeUsd || `~$${eq.fee.toFixed(2)}`,
      route: eq.route,
      available: eq.available,
      error: eq.error,
      priceImpact: eq.priceImpact,
      alwaysAvailable: false,
    });
  }

  // Sort: available first, then by best output
  options.sort((a, b) => {
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return b.toAmount - a.toAmount;
  });

  return options;
}

/**
 * Estimate atomic swap output (market price minus ~0.3% for network fees).
 */
function estimateAtomicOutput(fromToken: string, toToken: string, amount: number): number {
  const prices: Record<string, number> = {
    BTC: 62000, ETH: 2000, SOL: 87, USDT: 1, USDC: 1, OTK: 0.10,
    ATOM: 8, DOT: 6, AVAX: 25, LINK: 12, ADA: 0.45,
  };
  const fromUsd = (prices[fromToken] ?? 1) * amount;
  const toPrice = prices[toToken] ?? 1;
  return (fromUsd * 0.997) / toPrice; // 0.3% for network fees
}

export { type DEXQuote } from './dex';
export { type ExternalQuote } from './external';
export { type AtomicSwapOrder } from './atomic';
