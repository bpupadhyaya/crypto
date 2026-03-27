/**
 * THORChain Swap Provider — Native cross-chain swaps without leaving the app.
 *
 * THORChain enables native BTC ↔ USDT (and other pairs) without wrapping,
 * bridging tokens, or redirecting to external websites.
 *
 * Flow:
 *   1. Query THORChain for swap quote (amount, fees, slippage, vault address)
 *   2. User confirms the quote
 *   3. App constructs a transaction to THORChain's vault with a memo
 *   4. THORChain processes the swap and sends output to user's destination address
 *
 * API: https://thornode.ninerealms.com (public, no API key needed)
 */

const THORNODE_API = 'https://thornode.ninerealms.com';
const MIDGARD_API = 'https://midgard.ninerealms.com/v2';

// THORChain asset identifiers
const THORCHAIN_ASSETS: Record<string, string> = {
  'BTC': 'BTC.BTC',
  'ETH': 'ETH.ETH',
  'USDT': 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
  'USDC': 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
  'SOL': 'SOL.SOL', // THORChain added Solana support
};

export interface SwapQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;         // Human-readable input amount
  expectedOutput: string;     // Human-readable expected output
  minimumOutput: string;      // After slippage
  fees: {
    affiliate: string;
    outbound: string;
    liquidity: string;
    total: string;
    totalUsd: string;
  };
  slippageBps: number;
  route: string;
  vaultAddress: string;       // Send funds here
  memo: string;               // Include this memo in the transaction
  expiry: number;             // Unix timestamp
  estimatedTimeSeconds: number;
  priceImpactPercent: number;
}

/**
 * Get a swap quote from THORChain.
 * This tells you exactly how much you'll receive, the fees, and the vault to send to.
 */
export async function getSwapQuote(params: {
  fromSymbol: string;
  toSymbol: string;
  amount: number;                // Human-readable amount (e.g., 0.01 BTC)
  destinationAddress: string;    // Where to receive the output
  slippageBps?: number;          // Slippage tolerance in basis points (default: 100 = 1%)
  affiliateBps?: number;         // Affiliate fee (0 for Open Wallet — no fees)
}): Promise<SwapQuote> {
  const fromAsset = THORCHAIN_ASSETS[params.fromSymbol];
  const toAsset = THORCHAIN_ASSETS[params.toSymbol];

  if (!fromAsset || !toAsset) {
    throw new Error(`Unsupported swap pair: ${params.fromSymbol} → ${params.toSymbol}`);
  }

  // Convert to base units (THORChain uses 8 decimal places for all assets)
  const amountInBaseUnits = Math.round(params.amount * 1e8);
  const slippageBps = params.slippageBps ?? 100;

  // Query THORChain quote endpoint
  const url = `${THORNODE_API}/thorchain/quote/swap` +
    `?from_asset=${fromAsset}` +
    `&to_asset=${toAsset}` +
    `&amount=${amountInBaseUnits}` +
    `&destination=${params.destinationAddress}` +
    `&slippage_bps=${slippageBps}` +
    `&affiliate_bps=${params.affiliateBps ?? 0}` +
    `&affiliate=ow`; // Open Wallet affiliate tag (0 fee)

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`THORChain quote failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`THORChain: ${data.error}`);
  }

  // Parse the response
  const expectedOutput = Number(data.expected_amount_out) / 1e8;
  const fees = data.fees || {};
  const totalFee = Number(fees.total || 0) / 1e8;
  const outboundFee = Number(fees.outbound || 0) / 1e8;
  const liquidityFee = Number(fees.liquidity || 0) / 1e8;
  const affiliateFee = Number(fees.affiliate || 0) / 1e8;

  return {
    fromAsset,
    toAsset,
    fromAmount: params.amount.toString(),
    expectedOutput: expectedOutput.toFixed(6),
    minimumOutput: ((expectedOutput * (1 - slippageBps / 10000))).toFixed(6),
    fees: {
      affiliate: affiliateFee.toFixed(6),
      outbound: outboundFee.toFixed(6),
      liquidity: liquidityFee.toFixed(6),
      total: totalFee.toFixed(6),
      totalUsd: data.fees?.total_usd ? `$${Number(data.fees.total_usd).toFixed(2)}` : 'N/A',
    },
    slippageBps,
    route: `THORChain (${params.fromSymbol} → ${params.toSymbol})`,
    vaultAddress: data.inbound_address || '',
    memo: data.memo || '',
    expiry: data.expiry || (Date.now() / 1000 + 600),
    estimatedTimeSeconds: data.estimated_time || 600,
    priceImpactPercent: Number(data.slippage_bps || 0) / 100,
  };
}

/**
 * Get supported swap pools from THORChain.
 */
export async function getSupportedPools(): Promise<Array<{ asset: string; status: string; volume24h: string }>> {
  try {
    const response = await fetch(`${MIDGARD_API}/pools`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];

    const pools = await response.json();
    return pools.map((p: any) => ({
      asset: p.asset,
      status: p.status,
      volume24h: p.volume24h || '0',
    }));
  } catch {
    return [];
  }
}

/**
 * Check if a swap pair is supported.
 */
export function isSwapSupported(fromSymbol: string, toSymbol: string): boolean {
  return !!(THORCHAIN_ASSETS[fromSymbol] && THORCHAIN_ASSETS[toSymbol]);
}

/**
 * Get the list of supported tokens for swapping.
 */
export function getSupportedSwapTokens(): string[] {
  return Object.keys(THORCHAIN_ASSETS);
}
