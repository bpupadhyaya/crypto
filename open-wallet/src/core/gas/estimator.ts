/**
 * Unified Gas/Fee Estimation Service — estimates fees across all chains.
 *
 * Bitcoin: mempool.space fee API (sat/vbyte recommendations)
 * Ethereum: eth_gasPrice + EIP-1559 baseFee/priorityFee
 * Solana: getRecentPrioritizationFees
 * Cosmos/OpenChain: near-zero fixed fee
 *
 * Returns three speed tiers (slow/medium/fast) with estimated times and USD cost.
 */

import { getNetworkConfig, isTestnet } from '../network';
import { getPrices } from '../priceService';

// ─── Types ───

export interface FeeLevel {
  fee: string;          // fee in native token (human-readable)
  timeEstimate: string; // e.g. "~30 min"
}

export interface FeeEstimate {
  chain: string;
  slow: FeeLevel;     // ~30 min confirmation
  medium: FeeLevel;   // ~5 min confirmation
  fast: FeeLevel;     // ~1 min confirmation
  baseFeeUsd: number; // medium fee in USD
}

// ─── Chain-specific estimators ───

async function estimateBitcoinFees(): Promise<FeeEstimate> {
  const config = getNetworkConfig();
  const apiBase = config.bitcoin.apiBase;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `${apiBase}/v1/fees/recommended`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) throw new Error('Fee API error');
    const data = await response.json();

    // mempool.space returns sat/vbyte for fastestFee, halfHourFee, hourFee
    // Average transaction size ~140 vbytes (1-in, 2-out SegWit)
    const avgVbytes = 140;
    const slowSats = (data.hourFee ?? 2) * avgVbytes;
    const medSats = (data.halfHourFee ?? 5) * avgVbytes;
    const fastSats = (data.fastestFee ?? 10) * avgVbytes;

    const tobtc = (sats: number) => (sats / 1e8).toFixed(8);
    const prices = getPrices();
    const btcPrice = prices['BTC'] ?? 0;
    const medUsd = (medSats / 1e8) * btcPrice;

    return {
      chain: 'bitcoin',
      slow: { fee: `${tobtc(slowSats)} BTC`, timeEstimate: '~60 min' },
      medium: { fee: `${tobtc(medSats)} BTC`, timeEstimate: '~30 min' },
      fast: { fee: `${tobtc(fastSats)} BTC`, timeEstimate: '~10 min' },
      baseFeeUsd: Math.round(medUsd * 100) / 100,
    };
  } catch {
    // Fallback defaults (testnet-safe)
    return {
      chain: 'bitcoin',
      slow: { fee: '0.00000280 BTC', timeEstimate: '~60 min' },
      medium: { fee: '0.00000700 BTC', timeEstimate: '~30 min' },
      fast: { fee: '0.00001400 BTC', timeEstimate: '~10 min' },
      baseFeeUsd: 0,
    };
  }
}

async function estimateEthereumFees(): Promise<FeeEstimate> {
  const config = getNetworkConfig();
  const rpcUrl = config.ethereum.rpcUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Fetch both gasPrice and baseFee via batch RPC
    const batchBody = JSON.stringify([
      { jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] },
      { jsonrpc: '2.0', id: 2, method: 'eth_maxPriorityFeePerGas', params: [] },
      { jsonrpc: '2.0', id: 3, method: 'eth_getBlockByNumber', params: ['latest', false] },
    ]);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: batchBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error('RPC error');
    const results = await response.json();

    // Parse results (may be array or single for non-batch endpoints)
    const gasData = Array.isArray(results) ? results : [results];
    const gasPriceHex = gasData.find((r: any) => r.id === 1)?.result;
    const priorityFeeHex = gasData.find((r: any) => r.id === 2)?.result;
    const blockData = gasData.find((r: any) => r.id === 3)?.result;

    const gasPriceWei = gasPriceHex ? parseInt(gasPriceHex, 16) : 20e9;
    const priorityFeeWei = priorityFeeHex ? parseInt(priorityFeeHex, 16) : 1.5e9;
    const baseFeeWei = blockData?.baseFeePerGas
      ? parseInt(blockData.baseFeePerGas, 16)
      : gasPriceWei * 0.7;

    // Standard transfer gas limit
    const gasLimit = 21000;

    // Three tiers based on priority fee multiplier
    const slowGwei = (baseFeeWei + priorityFeeWei * 0.5) / 1e9;
    const medGwei = (baseFeeWei + priorityFeeWei) / 1e9;
    const fastGwei = (baseFeeWei + priorityFeeWei * 2) / 1e9;

    const toEth = (gwei: number) => ((gwei * gasLimit) / 1e9).toFixed(8);
    const prices = getPrices();
    const ethPrice = prices['ETH'] ?? 0;
    const medUsd = ((medGwei * gasLimit) / 1e9) * ethPrice;

    return {
      chain: 'ethereum',
      slow: { fee: `${toEth(slowGwei)} ETH`, timeEstimate: '~5 min' },
      medium: { fee: `${toEth(medGwei)} ETH`, timeEstimate: '~1 min' },
      fast: { fee: `${toEth(fastGwei)} ETH`, timeEstimate: '~15 sec' },
      baseFeeUsd: Math.round(medUsd * 100) / 100,
    };
  } catch {
    return {
      chain: 'ethereum',
      slow: { fee: '0.00021000 ETH', timeEstimate: '~5 min' },
      medium: { fee: '0.00042000 ETH', timeEstimate: '~1 min' },
      fast: { fee: '0.00063000 ETH', timeEstimate: '~15 sec' },
      baseFeeUsd: 0,
    };
  }
}

async function estimateSolanaFees(): Promise<FeeEstimate> {
  const config = getNetworkConfig();
  const rpcUrl = config.solana.rpcUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPrioritizationFees',
        params: [],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error('RPC error');
    const data = await response.json();

    // Extract priority fees from recent slots
    const fees: number[] = (data.result ?? [])
      .map((entry: any) => entry.prioritizationFee ?? 0)
      .filter((f: number) => f > 0);

    // Base fee is always 5000 lamports (0.000005 SOL) for a transfer
    const baseLamports = 5000;

    // Priority fee percentiles
    const sorted = fees.sort((a: number, b: number) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 100;

    const slowLamports = baseLamports + p25;
    const medLamports = baseLamports + p50;
    const fastLamports = baseLamports + p75;

    const toSol = (lamports: number) => (lamports / 1e9).toFixed(9);
    const prices = getPrices();
    const solPrice = prices['SOL'] ?? 0;
    const medUsd = (medLamports / 1e9) * solPrice;

    return {
      chain: 'solana',
      slow: { fee: `${toSol(slowLamports)} SOL`, timeEstimate: '~30 sec' },
      medium: { fee: `${toSol(medLamports)} SOL`, timeEstimate: '~12 sec' },
      fast: { fee: `${toSol(fastLamports)} SOL`, timeEstimate: '~5 sec' },
      baseFeeUsd: Math.round(medUsd * 10000) / 10000,
    };
  } catch {
    return {
      chain: 'solana',
      slow: { fee: '0.000005000 SOL', timeEstimate: '~30 sec' },
      medium: { fee: '0.000005000 SOL', timeEstimate: '~12 sec' },
      fast: { fee: '0.000010000 SOL', timeEstimate: '~5 sec' },
      baseFeeUsd: 0,
    };
  }
}

function estimateCosmosFixedFee(chain: 'cosmos' | 'openchain'): FeeEstimate {
  const denom = chain === 'cosmos' ? 'ATOM' : 'OTK';
  // Cosmos chains have near-zero fees — fixed small amount
  const fee = chain === 'cosmos' ? '0.002000' : '0.000100';
  const prices = getPrices();
  const price = chain === 'cosmos' ? (prices['ATOM'] ?? 0) : (prices['OTK'] ?? 0);
  const usd = parseFloat(fee) * price;

  return {
    chain,
    slow: { fee: `${fee} ${denom}`, timeEstimate: '~6 sec' },
    medium: { fee: `${fee} ${denom}`, timeEstimate: '~6 sec' },
    fast: { fee: `${fee} ${denom}`, timeEstimate: '~6 sec' },
    baseFeeUsd: Math.round(usd * 10000) / 10000,
  };
}

// ─── Public API ───

/**
 * Fetch fee estimates for a specific chain.
 * Returns three speed tiers with estimated time and fee in native token.
 */
export async function estimateFees(chain: string): Promise<FeeEstimate> {
  switch (chain) {
    case 'bitcoin':
      return estimateBitcoinFees();
    case 'ethereum':
      return estimateEthereumFees();
    case 'solana':
      return estimateSolanaFees();
    case 'cosmos':
      return estimateCosmosFixedFee('cosmos');
    case 'openchain':
      return estimateCosmosFixedFee('openchain');
    default:
      // Unknown chain — return a zero-fee placeholder
      return {
        chain,
        slow: { fee: '0', timeEstimate: 'unknown' },
        medium: { fee: '0', timeEstimate: 'unknown' },
        fast: { fee: '0', timeEstimate: 'unknown' },
        baseFeeUsd: 0,
      };
  }
}

/**
 * Fetch fee estimates for all supported chains in parallel.
 */
export async function estimateAllFees(): Promise<Record<string, FeeEstimate>> {
  const chains = ['bitcoin', 'ethereum', 'solana', 'cosmos', 'openchain'];
  const results = await Promise.allSettled(chains.map((c) => estimateFees(c)));

  const map: Record<string, FeeEstimate> = {};
  for (let i = 0; i < chains.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      map[chains[i]] = result.value;
    }
  }
  return map;
}

/**
 * Parse the fee string (e.g. "0.00042000 ETH") to a raw number.
 */
export function parseFeeAmount(feeStr: string): number {
  const parts = feeStr.split(' ');
  return parseFloat(parts[0]) || 0;
}
