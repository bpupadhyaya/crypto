/**
 * Universal Exchange — Any token to any token, across any chain.
 *
 * Routing engine that finds the best path for any token pair:
 * 1. Same chain, same DEX: Direct swap (ETH->USDT on Ethereum via 1inch)
 * 2. Cross-chain, supported bridge: Bridge + swap (BTC->SOL via THORChain BTC->ETH + bridge)
 * 3. Through stablecoin: Token A -> USDT -> Token B (most universal path)
 * 4. IBC route: Cosmos chains (OTK->ATOM via IBC)
 * 5. Atomic swap: Direct P2P when counterparty available
 *
 * Supports: BTC, ETH, SOL, USDT, USDC, OTK, ATOM, AVAX, LINK, DOT, ADA, WBTC, DAI, OSMO
 */

import { getLivePrice, getAllLivePrices, calculateLiveSwapEstimate } from './prices';

// ─── Types ───

export interface ExchangeRoute {
  id: string;
  steps: ExchangeStep[];
  totalEstimatedOutput: number;
  totalFeeUsd: number;
  totalTimeSeconds: number;
  provider: string;           // Primary provider name for display
  rank: 'best-price' | 'fastest' | 'lowest-fee' | 'most-secure' | 'alternative';
  securityRating: number;     // Minimum across all steps
}

export interface ExchangeStep {
  type: 'swap' | 'bridge' | 'wrap' | 'unwrap';
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  provider: string;   // THORChain, 1inch, Jupiter, Osmosis, Atomic, DEX, Li.Fi
  estimatedOutput: number;
  feeUsd: number;
  timeSeconds: number;
}

export interface ExchangeExecutionResult {
  success: boolean;
  txHashes: string[];
  message: string;
}

// ─── Token / Chain Metadata ───

export interface TokenInfo {
  symbol: string;
  name: string;
  chain: string;         // Primary chain
  chains: string[];      // All chains this token exists on
  decimals: number;
  coingeckoId?: string;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  { symbol: 'BTC',  name: 'Bitcoin',    chain: 'bitcoin',   chains: ['bitcoin'],            decimals: 8  },
  { symbol: 'ETH',  name: 'Ethereum',   chain: 'ethereum',  chains: ['ethereum'],           decimals: 18 },
  { symbol: 'SOL',  name: 'Solana',     chain: 'solana',    chains: ['solana'],             decimals: 9  },
  { symbol: 'USDT', name: 'Tether',     chain: 'ethereum',  chains: ['ethereum', 'solana'], decimals: 6  },
  { symbol: 'USDC', name: 'USD Coin',   chain: 'ethereum',  chains: ['ethereum', 'solana'], decimals: 6  },
  { symbol: 'OTK',  name: 'Open Token', chain: 'openchain', chains: ['openchain'],          decimals: 6  },
  { symbol: 'ATOM', name: 'Cosmos',     chain: 'cosmos',    chains: ['cosmos'],             decimals: 6  },
  { symbol: 'WBTC', name: 'Wrapped BTC',chain: 'ethereum',  chains: ['ethereum'],           decimals: 8  },
  { symbol: 'DAI',  name: 'Dai',        chain: 'ethereum',  chains: ['ethereum'],           decimals: 18 },
  { symbol: 'LINK', name: 'Chainlink',  chain: 'ethereum',  chains: ['ethereum'],           decimals: 18 },
  { symbol: 'OSMO', name: 'Osmosis',    chain: 'cosmos',    chains: ['cosmos'],             decimals: 6  },
  { symbol: 'AVAX', name: 'Avalanche',  chain: 'avalanche', chains: ['avalanche'],          decimals: 18 },
  { symbol: 'DOT',  name: 'Polkadot',   chain: 'polkadot',  chains: ['polkadot'],           decimals: 10 },
  { symbol: 'ADA',  name: 'Cardano',    chain: 'cardano',   chains: ['cardano'],            decimals: 6  },
];

function getTokenInfo(symbol: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}

function getChainForToken(symbol: string): string {
  return getTokenInfo(symbol)?.chain ?? 'unknown';
}

// ─── Provider Capability Matrix ───

/**
 * Which providers can handle which token pairs, and on which chains.
 */

const THORCHAIN_TOKENS = new Set(['BTC', 'ETH', 'USDT', 'USDC', 'SOL']);
const ONEINCH_TOKENS = new Set(['ETH', 'USDT', 'USDC', 'WBTC', 'DAI', 'LINK']);
const JUPITER_TOKENS = new Set(['SOL', 'USDT', 'USDC']);
const OSMOSIS_TOKENS = new Set(['ATOM', 'OTK', 'OSMO', 'USDT', 'USDC']);
const DEX_TOKENS = new Set(['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'OTK', 'ATOM']);
const STABLECOINS = new Set(['USDT', 'USDC']);

function canTHORChainHandle(from: string, to: string): boolean {
  return THORCHAIN_TOKENS.has(from) && THORCHAIN_TOKENS.has(to) && from !== to;
}

function can1inchHandle(from: string, to: string): boolean {
  return ONEINCH_TOKENS.has(from) && ONEINCH_TOKENS.has(to) && from !== to;
}

function canJupiterHandle(from: string, to: string): boolean {
  return JUPITER_TOKENS.has(from) && JUPITER_TOKENS.has(to) && from !== to;
}

function canOsmosisHandle(from: string, to: string): boolean {
  return OSMOSIS_TOKENS.has(from) && OSMOSIS_TOKENS.has(to) && from !== to;
}

function canDEXHandle(from: string, to: string): boolean {
  return DEX_TOKENS.has(from) && DEX_TOKENS.has(to) && from !== to;
}

function isSameChain(from: string, to: string): boolean {
  return getChainForToken(from) === getChainForToken(to);
}

// ─── Route Finding ───

/**
 * Find all possible routes for a token pair.
 * Returns routes sorted by estimated output (best first).
 */
export async function findExchangeRoutes(params: {
  fromToken: string;
  toToken: string;
  fromChain: string;
  toChain: string;
  amount: number;
}): Promise<ExchangeRoute[]> {
  const { fromToken, toToken, fromChain, toChain, amount } = params;

  if (fromToken === toToken && fromChain === toChain) return [];
  if (amount <= 0) return [];

  const prices = await getAllLivePrices();
  const fromPrice = prices[fromToken] ?? 0;
  const toPrice = prices[toToken] ?? 0;

  if (fromPrice === 0 || toPrice === 0) return [];

  const routes: ExchangeRoute[] = [];
  let routeIndex = 0;

  const makeId = () => `route-${++routeIndex}`;

  // ─── Strategy 1: Direct swap on same chain ───

  // 1a. Open Wallet DEX (direct pool)
  if (canDEXHandle(fromToken, toToken)) {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.3);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: 'openchain', toChain: 'openchain',
        provider: 'Open Wallet DEX',
        estimatedOutput: output,
        feeUsd: amount * fromPrice * 0.003,
        timeSeconds: 5,
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: amount * fromPrice * 0.003,
      totalTimeSeconds: 5,
      provider: 'Open Wallet DEX',
      rank: 'alternative',
      securityRating: 4,
    });
  }

  // 1b. 1inch (Ethereum same-chain)
  if (can1inchHandle(fromToken, toToken)) {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.2);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: 'ethereum', toChain: 'ethereum',
        provider: '1inch',
        estimatedOutput: output,
        feeUsd: amount * fromPrice * 0.002 + 5, // gas
        timeSeconds: 30,
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: amount * fromPrice * 0.002 + 5,
      totalTimeSeconds: 30,
      provider: '1inch',
      rank: 'alternative',
      securityRating: 3.5,
    });
  }

  // 1c. Jupiter (Solana same-chain)
  if (canJupiterHandle(fromToken, toToken)) {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.1);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: 'solana', toChain: 'solana',
        provider: 'Jupiter',
        estimatedOutput: output,
        feeUsd: 0.01,
        timeSeconds: 2,
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: 0.01,
      totalTimeSeconds: 2,
      provider: 'Jupiter',
      rank: 'alternative',
      securityRating: 3.5,
    });
  }

  // 1d. Osmosis IBC (Cosmos ecosystem)
  if (canOsmosisHandle(fromToken, toToken)) {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.3);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: getChainForToken(fromToken), toChain: getChainForToken(toToken),
        provider: 'Osmosis IBC',
        estimatedOutput: output,
        feeUsd: 0.05,
        timeSeconds: 15,
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: 0.05,
      totalTimeSeconds: 15,
      provider: 'Osmosis IBC',
      rank: 'alternative',
      securityRating: 4,
    });
  }

  // ─── Strategy 2: Cross-chain direct via THORChain ───

  if (canTHORChainHandle(fromToken, toToken)) {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.5);
    const feeUsd = Math.max(amount * fromPrice * 0.005, 2);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: getChainForToken(fromToken), toChain: getChainForToken(toToken),
        provider: 'THORChain',
        estimatedOutput: output,
        feeUsd,
        timeSeconds: 600,
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: feeUsd,
      totalTimeSeconds: 600,
      provider: 'THORChain',
      rank: 'alternative',
      securityRating: 3.5,
    });
  }

  // ─── Strategy 3: Through stablecoin bridge (most universal) ───
  // Token A -> USDT -> Token B
  // Only if not already a direct route or if cross-chain

  const stableBridge = 'USDT';
  const canRouteViaStable = fromToken !== stableBridge && toToken !== stableBridge;

  if (canRouteViaStable) {
    // Leg 1: fromToken -> USDT
    const leg1Provider = pickBestLeg(fromToken, stableBridge);
    // Leg 2: USDT -> toToken
    const leg2Provider = pickBestLeg(stableBridge, toToken);

    if (leg1Provider && leg2Provider) {
      const usdtAmount = estimateOutput(amount, fromPrice, 1, leg1Provider.feePercent);
      const finalOutput = estimateOutput(usdtAmount, 1, toPrice, leg2Provider.feePercent);
      const totalFee = amount * fromPrice * (leg1Provider.feePercent / 100) + usdtAmount * (leg2Provider.feePercent / 100);
      const totalTime = leg1Provider.timeSeconds + leg2Provider.timeSeconds;

      routes.push({
        id: makeId(),
        steps: [
          {
            type: 'swap',
            fromToken, toToken: stableBridge,
            fromChain: getChainForToken(fromToken), toChain: leg1Provider.toChain,
            provider: leg1Provider.name,
            estimatedOutput: usdtAmount,
            feeUsd: amount * fromPrice * (leg1Provider.feePercent / 100),
            timeSeconds: leg1Provider.timeSeconds,
          },
          {
            type: leg2Provider.isBridge ? 'bridge' : 'swap',
            fromToken: stableBridge, toToken,
            fromChain: leg1Provider.toChain, toChain: getChainForToken(toToken),
            provider: leg2Provider.name,
            estimatedOutput: finalOutput,
            feeUsd: usdtAmount * (leg2Provider.feePercent / 100),
            timeSeconds: leg2Provider.timeSeconds,
          },
        ],
        totalEstimatedOutput: finalOutput,
        totalFeeUsd: totalFee,
        totalTimeSeconds: totalTime,
        provider: `${leg1Provider.name} + ${leg2Provider.name}`,
        rank: 'alternative',
        securityRating: Math.min(leg1Provider.security, leg2Provider.security),
      });
    }
  }

  // ─── Strategy 4: Atomic Swap (always available as fallback) ───

  {
    const output = estimateOutput(amount, fromPrice, toPrice, 0.3);
    routes.push({
      id: makeId(),
      steps: [{
        type: 'swap',
        fromToken, toToken,
        fromChain: getChainForToken(fromToken), toChain: getChainForToken(toToken),
        provider: 'Atomic Swap',
        estimatedOutput: output,
        feeUsd: 0, // network fees only, no protocol fee
        timeSeconds: 2400, // 15-60 min
      }],
      totalEstimatedOutput: output,
      totalFeeUsd: 0,
      totalTimeSeconds: 2400,
      provider: 'Atomic Swap',
      rank: 'most-secure',
      securityRating: 5,
    });
  }

  // ─── Strategy 5: USDC bridge path (alternative stablecoin) ───

  const altStable = 'USDC';
  const canRouteViaUsdc = fromToken !== altStable && toToken !== altStable && canRouteViaStable;

  if (canRouteViaUsdc) {
    const leg1 = pickBestLeg(fromToken, altStable);
    const leg2 = pickBestLeg(altStable, toToken);

    if (leg1 && leg2) {
      const usdcAmount = estimateOutput(amount, fromPrice, 1, leg1.feePercent);
      const finalOutput = estimateOutput(usdcAmount, 1, toPrice, leg2.feePercent);
      const totalFee = amount * fromPrice * (leg1.feePercent / 100) + usdcAmount * (leg2.feePercent / 100);
      const totalTime = leg1.timeSeconds + leg2.timeSeconds;

      routes.push({
        id: makeId(),
        steps: [
          {
            type: 'swap',
            fromToken, toToken: altStable,
            fromChain: getChainForToken(fromToken), toChain: leg1.toChain,
            provider: leg1.name,
            estimatedOutput: usdcAmount,
            feeUsd: amount * fromPrice * (leg1.feePercent / 100),
            timeSeconds: leg1.timeSeconds,
          },
          {
            type: leg2.isBridge ? 'bridge' : 'swap',
            fromToken: altStable, toToken,
            fromChain: leg1.toChain, toChain: getChainForToken(toToken),
            provider: leg2.name,
            estimatedOutput: finalOutput,
            feeUsd: usdcAmount * (leg2.feePercent / 100),
            timeSeconds: leg2.timeSeconds,
          },
        ],
        totalEstimatedOutput: finalOutput,
        totalFeeUsd: totalFee,
        totalTimeSeconds: totalTime,
        provider: `${leg1.name} + ${leg2.name} (via USDC)`,
        rank: 'alternative',
        securityRating: Math.min(leg1.security, leg2.security),
      });
    }
  }

  // ─── Rank routes ───

  routes.sort((a, b) => b.totalEstimatedOutput - a.totalEstimatedOutput);

  // Assign ranks
  if (routes.length > 0) {
    routes[0].rank = 'best-price';
  }

  const fastest = routes.reduce((best, r) =>
    r.totalTimeSeconds < best.totalTimeSeconds ? r : best, routes[0]);
  if (fastest && fastest.rank !== 'best-price') {
    fastest.rank = 'fastest';
  }

  const cheapest = routes.reduce((best, r) =>
    r.totalFeeUsd < best.totalFeeUsd ? r : best, routes[0]);
  if (cheapest && cheapest.rank !== 'best-price' && cheapest.rank !== 'fastest') {
    cheapest.rank = 'lowest-fee';
  }

  // Atomic swap is always most-secure
  const atomicRoute = routes.find((r) => r.provider === 'Atomic Swap');
  if (atomicRoute && atomicRoute.rank !== 'best-price') {
    atomicRoute.rank = 'most-secure';
  }

  return routes;
}

// ─── Route Execution ───

/**
 * Execute a selected exchange route.
 * For multi-step routes, executes steps sequentially.
 */
export async function executeExchangeRoute(
  route: ExchangeRoute,
  mnemonic: string,
  accountIndex: number,
  addresses: Record<string, string>,
): Promise<ExchangeExecutionResult> {
  const txHashes: string[] = [];

  try {
    for (const step of route.steps) {
      const result = await executeStep(step, mnemonic, accountIndex, addresses);
      if (!result.success) {
        return {
          success: false,
          txHashes,
          message: `Step failed (${step.provider}): ${result.message}`,
        };
      }
      if (result.txHash) {
        txHashes.push(result.txHash);
      }
    }

    return {
      success: true,
      txHashes,
      message: `Exchange complete! ${route.steps.length} step${route.steps.length > 1 ? 's' : ''} executed via ${route.provider}.`,
    };
  } catch (err) {
    return {
      success: false,
      txHashes,
      message: err instanceof Error ? err.message : 'Exchange failed',
    };
  }
}

// ─── Step Execution (delegates to existing swap executors) ───

async function executeStep(
  step: ExchangeStep,
  mnemonic: string,
  accountIndex: number,
  addresses: Record<string, string>,
): Promise<{ success: boolean; txHash?: string; message: string }> {
  const { executeSwapTransaction } = await import('./executor');

  // Map provider name to swap option ID used by the executor
  const providerToOptionId: Record<string, string> = {
    'THORChain':       'ext-thorchain',
    '1inch':           'ext-1inch',
    'Jupiter':         'ext-jupiter',
    'Osmosis IBC':     'ext-osmosis-(ibc)',
    'Atomic Swap':     'ow-atomic',
    'Open Wallet DEX': 'ow-dex',
    'Li.Fi':           'ext-li.fi-bridge',
  };

  const optionId = providerToOptionId[step.provider] ?? 'ow-dex';

  const fakeOption = {
    id: optionId,
    name: step.provider,
    icon: '',
    category: 'external' as const,
    securityRating: 3.5,
    securityNote: '',
    speed: '',
    fromToken: step.fromToken,
    toToken: step.toToken,
    fromAmount: 0,
    toAmount: step.estimatedOutput,
    fee: `~$${step.feeUsd.toFixed(2)}`,
    route: `${step.provider} (${step.fromToken} -> ${step.toToken})`,
    available: true,
    priceImpact: 0,
    alwaysAvailable: false,
  };

  const result = await executeSwapTransaction({
    option: fakeOption,
    fromAmount: 0, // not used for option dispatch
    fromSymbol: step.fromToken,
    toSymbol: step.toToken,
    mnemonic,
    accountIndex,
    fromAddress: addresses[step.fromChain] ?? addresses.ethereum ?? '',
    toAddress: addresses[step.toChain] ?? addresses.ethereum ?? '',
  });

  return {
    success: result.success,
    txHash: result.txHash,
    message: result.message,
  };
}

// ─── Helpers ───

function estimateOutput(
  amount: number,
  fromPriceUsd: number,
  toPriceUsd: number,
  feePercent: number,
): number {
  if (toPriceUsd === 0) return 0;
  const valueUsd = amount * fromPriceUsd;
  const afterFee = valueUsd * (1 - feePercent / 100);
  return afterFee / toPriceUsd;
}

interface LegProvider {
  name: string;
  feePercent: number;
  timeSeconds: number;
  security: number;
  toChain: string;
  isBridge: boolean;
}

/**
 * Pick the best provider for a single-leg swap.
 * Returns null if no provider can handle the pair.
 */
function pickBestLeg(from: string, to: string): LegProvider | null {
  // Direct same-chain is cheapest/fastest
  if (canJupiterHandle(from, to)) {
    return { name: 'Jupiter', feePercent: 0.1, timeSeconds: 2, security: 3.5, toChain: 'solana', isBridge: false };
  }
  if (can1inchHandle(from, to)) {
    return { name: '1inch', feePercent: 0.2, timeSeconds: 30, security: 3.5, toChain: 'ethereum', isBridge: false };
  }
  if (canOsmosisHandle(from, to)) {
    return { name: 'Osmosis IBC', feePercent: 0.3, timeSeconds: 15, security: 4, toChain: 'cosmos', isBridge: false };
  }
  if (canTHORChainHandle(from, to)) {
    return { name: 'THORChain', feePercent: 0.5, timeSeconds: 600, security: 3.5, toChain: getChainForToken(to), isBridge: true };
  }
  if (canDEXHandle(from, to)) {
    return { name: 'Open Wallet DEX', feePercent: 0.3, timeSeconds: 5, security: 4, toChain: 'openchain', isBridge: false };
  }
  return null;
}

/**
 * Get rank label for display.
 */
export function getRankLabel(rank: ExchangeRoute['rank']): string {
  switch (rank) {
    case 'best-price':  return 'Best Price';
    case 'fastest':     return 'Fastest';
    case 'lowest-fee':  return 'Lowest Fee';
    case 'most-secure': return 'Most Secure';
    case 'alternative': return 'Alternative';
  }
}

/**
 * Get rank color for display.
 */
export function getRankColor(rank: ExchangeRoute['rank']): string {
  switch (rank) {
    case 'best-price':  return '#22c55e';
    case 'fastest':     return '#3b82f6';
    case 'lowest-fee':  return '#f59e0b';
    case 'most-secure': return '#8b5cf6';
    case 'alternative': return '#6b7280';
  }
}
