/**
 * External Swap Providers — Optional liquidity sources.
 *
 * These are external protocols that provide deep liquidity but
 * depend on third-party services. If any goes down, Open Wallet
 * falls back to built-in options (Atomic Swap, DEX, Order Book).
 *
 * Providers:
 * - THORChain: Cross-chain native swaps (Security: 3.5/5)
 * - 1inch: Ethereum DEX aggregator (Security: 3.5/5)
 * - Jupiter: Solana DEX aggregator (Security: 3.5/5)
 * - Li.Fi: Cross-chain bridge aggregator (Security: 3/5)
 * - Osmosis: Cosmos IBC DEX (Security: 4/5)
 */

export interface ExternalQuote {
  provider: string;
  providerIcon: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  feeUsd: string;
  speed: string;
  route: string;
  securityRating: number;   // out of 5
  securityNote: string;
  available: boolean;
  error?: string;
  priceImpact: number;
}

// ─── THORChain ───

export async function getTHORChainQuote(
  fromToken: string, toToken: string, amount: number, destAddress: string,
): Promise<ExternalQuote> {
  const base: ExternalQuote = {
    provider: 'THORChain', providerIcon: '⚡',
    fromToken, toToken, fromAmount: amount, toAmount: 0,
    fee: 0, feeUsd: '', speed: '~10-30 min',
    route: `THORChain (${fromToken} → ${toToken})`,
    securityRating: 3.5,
    securityNote: 'Decentralized liquidity network. Hacked in 2021 ($13M), recovered. Battle-tested since.',
    available: false, priceImpact: 0,
  };

  try {
    const THORCHAIN_ASSETS: Record<string, string> = {
      BTC: 'BTC.BTC', ETH: 'ETH.ETH',
      USDT: 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
      USDC: 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
      SOL: 'SOL.SOL',
    };
    const fromAsset = THORCHAIN_ASSETS[fromToken];
    const toAsset = THORCHAIN_ASSETS[toToken];
    if (!fromAsset || !toAsset) return { ...base, error: 'Pair not supported' };

    const amountBase = Math.round(amount * 1e8);
    const url = `https://thornode.ninerealms.com/thorchain/quote/swap?from_asset=${fromAsset}&to_asset=${toAsset}&amount=${amountBase}&destination=${destAddress}&slippage_bps=100&affiliate_bps=0`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ...base, error: 'THORChain unavailable' };
    const data = await res.json();
    if (data.error) return { ...base, error: data.error };

    const output = Number(data.expected_amount_out) / 1e8;
    const totalFee = Number(data.fees?.total || 0) / 1e8;

    return {
      ...base, toAmount: output, fee: totalFee,
      // THORChain always returns total_usd for valid quotes.
      // Avoid hardcoded prices in the fallback — use 0 if unavailable.
      feeUsd: `$${Number(data.fees?.total_usd || 0).toFixed(2)}`,
      available: true, priceImpact: Number(data.slippage_bps || 0) / 100,
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Failed' };
  }
}

// ─── 1inch (Ethereum) ───

export async function get1inchQuote(
  fromToken: string, toToken: string, amount: number,
): Promise<ExternalQuote> {
  const base: ExternalQuote = {
    provider: '1inch', providerIcon: '📊',
    fromToken, toToken, fromAmount: amount, toAmount: 0,
    fee: 0, feeUsd: '', speed: '~30 sec',
    route: `1inch Aggregator (100+ Ethereum DEXs)`,
    securityRating: 3.5,
    securityNote: 'DEX aggregator on Ethereum. Not hacked directly. MEV/sandwich attack risk on Ethereum.',
    available: false, priceImpact: 0,
  };

  try {
    const TOKEN_ADDRESSES: Record<string, string> = {
      ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    };

    const from = TOKEN_ADDRESSES[fromToken];
    const to = TOKEN_ADDRESSES[toToken];
    if (!from || !to) return { ...base, error: 'Ethereum tokens only' };

    const decimals = fromToken === 'ETH' ? 18 : fromToken === 'WBTC' ? 8 : 6;
    const amountWei = BigInt(Math.round(amount * 10 ** decimals)).toString();

    // 1inch v6 requires an API key. Without it the request returns 401.
    const apiKey = (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_ONEINCH_API_KEY : undefined) ?? '';
    if (!apiKey) {
      return { ...base, error: 'API key required (set EXPO_PUBLIC_ONEINCH_API_KEY — free at portal.1inch.dev)' };
    }

    const url = `https://api.1inch.dev/swap/v6.0/1/quote?src=${from}&dst=${to}&amount=${amountWei}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { ...base, error: 'API key invalid — check EXPO_PUBLIC_ONEINCH_API_KEY in .env' };
      }
      return { ...base, error: '1inch API unavailable' };
    }
    const data = await res.json();

    const outDecimals = toToken === 'ETH' ? 18 : toToken === 'WBTC' ? 8 : 6;
    const output = Number(data.dstAmount || data.toAmount || 0) / 10 ** outDecimals;

    return { ...base, toAmount: output, fee: amount * 0.002, feeUsd: '~0.2% + gas', available: output > 0, priceImpact: 0.1 };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Failed' };
  }
}

// ─── Jupiter (Solana) ───

export async function getJupiterQuote(
  fromToken: string, toToken: string, amount: number,
): Promise<ExternalQuote> {
  const base: ExternalQuote = {
    provider: 'Jupiter', providerIcon: '⚡',
    fromToken, toToken, fromAmount: amount, toAmount: 0,
    fee: 0, feeUsd: '', speed: '~2 sec',
    route: `Jupiter (Solana DEXs — Raydium, Orca, etc.)`,
    securityRating: 3.5,
    securityNote: 'Solana DEX aggregator. Not hacked. Solana ecosystem has had bridge exploits.',
    available: false, priceImpact: 0,
  };

  try {
    const MINT_ADDRESSES: Record<string, string> = {
      SOL: 'So11111111111111111111111111111111111111112',
      USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    };

    const inputMint = MINT_ADDRESSES[fromToken];
    const outputMint = MINT_ADDRESSES[toToken];
    if (!inputMint || !outputMint) return { ...base, error: 'Solana tokens only' };

    const decimals = fromToken === 'SOL' ? 9 : 6;
    const amountLamports = Math.round(amount * 10 ** decimals);

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=100`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ...base, error: 'Jupiter API unavailable' };
    const data = await res.json();

    const outDecimals = toToken === 'SOL' ? 9 : 6;
    const output = Number(data.outAmount || 0) / 10 ** outDecimals;

    return { ...base, toAmount: output, fee: amount * 0.001, feeUsd: `~$${(amount * 0.001 * 87).toFixed(2)}`, available: output > 0, priceImpact: Number(data.priceImpactPct || 0) };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Failed' };
  }
}

// ─── Li.Fi (Cross-chain Bridge) ───

export async function getLiFiQuote(
  fromToken: string, toToken: string, amount: number, fromAddress: string, toAddress: string,
): Promise<ExternalQuote> {
  const base: ExternalQuote = {
    provider: 'Li.Fi Bridge', providerIcon: '🌉',
    fromToken, toToken, fromAmount: amount, toAmount: 0,
    fee: 0, feeUsd: '', speed: '~2-20 min',
    route: `Li.Fi (Stargate, Hop, Across, Connext)`,
    securityRating: 3,
    securityNote: 'Bridge aggregator. Bridges are #1 hack target in crypto (Wormhole $320M, Ronin $625M). Use with caution for large amounts.',
    available: false, priceImpact: 0,
  };

  try {
    const CHAIN_IDS: Record<string, number> = { ethereum: 1, polygon: 137, arbitrum: 42161, optimism: 10, bsc: 56, avalanche: 43114 };
    const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
      ethereum: { ETH: '0x0000000000000000000000000000000000000000', USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    };

    const fromChainId = CHAIN_IDS.ethereum;
    const toChainId = CHAIN_IDS.ethereum;
    const fromAddr = TOKEN_ADDRESSES.ethereum?.[fromToken];
    const toAddr = TOKEN_ADDRESSES.ethereum?.[toToken];
    if (!fromAddr || !toAddr) return { ...base, error: 'Pair not supported via Li.Fi' };

    const decimals = fromToken === 'ETH' ? 18 : 6;
    const amountWei = BigInt(Math.round(amount * 10 ** decimals)).toString();

    const url = `https://li.quest/v1/quote?fromChain=${fromChainId}&toChain=${toChainId}&fromToken=${fromAddr}&toToken=${toAddr}&fromAmount=${amountWei}&fromAddress=${fromAddress}&toAddress=${toAddress}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { ...base, error: 'Li.Fi API unavailable' };
    const data = await res.json();

    const outDecimals = toToken === 'ETH' ? 18 : 6;
    const output = Number(data.estimate?.toAmount || 0) / 10 ** outDecimals;

    return { ...base, toAmount: output, fee: Number(data.estimate?.gasCosts?.[0]?.amountUSD || 0), feeUsd: `~$${Number(data.estimate?.gasCosts?.[0]?.amountUSD || 2).toFixed(2)}`, available: output > 0, priceImpact: 0.2 };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Failed' };
  }
}

// ─── Osmosis (IBC) ───

export async function getOsmosisQuote(
  fromToken: string, toToken: string, amount: number,
): Promise<ExternalQuote> {
  const base: ExternalQuote = {
    provider: 'Osmosis (IBC)', providerIcon: '🌊',
    fromToken, toToken, fromAmount: amount, toAmount: 0,
    fee: 0, feeUsd: '', speed: '~15 sec',
    route: `Osmosis DEX via IBC`,
    securityRating: 4,
    securityNote: 'Cosmos IBC DEX. IBC protocol has never been hacked. Osmosis had a minor LP bug in 2022 ($5M, patched).',
    available: false, priceImpact: 0,
  };

  try {
    const OSMOSIS_DENOMS: Record<string, string> = {
      ATOM: 'uatom', OSMO: 'uosmo', OTK: 'uotk',
      USDT: 'ibc/4ABBEF4C8926DDDB320AE5188CFD63267ABBCEFC0583E4AE05D6E5AA2401DDAB',
      USDC: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
    };

    const fromDenom = OSMOSIS_DENOMS[fromToken];
    const toDenom = OSMOSIS_DENOMS[toToken];
    if (!fromDenom || !toDenom) return { ...base, error: 'Not available on Osmosis' };

    // Osmosis SQS (Sidecar Query Service)
    const decimals = fromToken === 'ATOM' || fromToken === 'OSMO' ? 6 : fromToken === 'OTK' ? 6 : 6;
    const amountIn = Math.round(amount * 10 ** decimals);

    const url = `https://sqs.osmosis.zone/router/quote?tokenIn=${amountIn}${fromDenom}&tokenOutDenom=${toDenom}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ...base, error: 'Osmosis unavailable' };
    const data = await res.json();

    const outDecimals = 6;
    const output = Number(data.amount_out || 0) / 10 ** outDecimals;

    return { ...base, toAmount: output, fee: amount * 0.003, feeUsd: `~$${(amount * 0.003).toFixed(2)}`, available: output > 0, priceImpact: Number(data.price_impact || 0) * 100 };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : 'Failed' };
  }
}

// ─── Aggregate All External Quotes ───

/**
 * Fetch quotes from all available external providers in parallel.
 * Returns all results, including unavailable ones (for UI display).
 */
export async function getAllExternalQuotes(
  fromToken: string, toToken: string, amount: number,
  fromAddress: string, toAddress: string,
): Promise<ExternalQuote[]> {
  const results = await Promise.allSettled([
    getTHORChainQuote(fromToken, toToken, amount, toAddress),
    get1inchQuote(fromToken, toToken, amount),
    getJupiterQuote(fromToken, toToken, amount),
    getLiFiQuote(fromToken, toToken, amount, fromAddress, toAddress),
    getOsmosisQuote(fromToken, toToken, amount),
  ]);

  return results.map((r) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      provider: 'Unknown', providerIcon: '❌',
      fromToken, toToken, fromAmount: amount, toAmount: 0,
      fee: 0, feeUsd: '', speed: '', route: '',
      securityRating: 0, securityNote: '', available: false,
      error: 'Provider unreachable', priceImpact: 0,
    };
  });
}
