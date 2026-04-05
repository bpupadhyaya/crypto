/**
 * Real Balance Fetcher — fetches on-chain balances from RPC endpoints.
 *
 * Used in production (mainnet) to get actual wallet balances.
 * Falls back gracefully to 0 for any chain that fails.
 */

import { getNetworkConfig } from '../network';

interface BalanceResult {
  symbol: string;
  balance: number;  // Human-readable amount (e.g., 1.5 BTC, not satoshis)
  raw: bigint;
}

/**
 * Fetch all balances for the given addresses.
 * Returns symbol → human-readable balance map.
 */
export async function fetchAllBalances(
  addresses: Partial<Record<string, string>>,
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const config = getNetworkConfig();

  const fetchers: Promise<void>[] = [];

  if (addresses.bitcoin) {
    fetchers.push(
      fetchBtcBalance(addresses.bitcoin, config.bitcoin.apiBase)
        .then(b => { results.BTC = b; })
        .catch(() => { results.BTC = 0; })
    );
  }

  if (addresses.ethereum) {
    fetchers.push(
      fetchEthBalance(addresses.ethereum, config.ethereum.rpcUrl)
        .then(b => { results.ETH = b; })
        .catch(() => { results.ETH = 0; })
    );

    // Also fetch ERC-20 stablecoins
    fetchers.push(
      fetchErc20Balance(addresses.ethereum, config.ethereum.rpcUrl,
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6) // USDT
        .then(b => { results.USDT = b; })
        .catch(() => { results.USDT = 0; })
    );
    fetchers.push(
      fetchErc20Balance(addresses.ethereum, config.ethereum.rpcUrl,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6) // USDC
        .then(b => { results.USDC = b; })
        .catch(() => { results.USDC = 0; })
    );
  }

  if (addresses.solana) {
    fetchers.push(
      fetchSolBalance(addresses.solana, config.solana.rpcUrl)
        .then(b => { results.SOL = b; })
        .catch(() => { results.SOL = 0; })
    );
  }

  if (addresses.cosmos) {
    fetchers.push(
      fetchCosmosBalance(addresses.cosmos, config.openchain.restUrl, 'uatom', 6)
        .then(b => { results.ATOM = b; })
        .catch(() => { results.ATOM = 0; })
    );
  }

  if (addresses.openchain) {
    fetchers.push(
      fetchCosmosBalance(addresses.openchain, config.openchain.restUrl, 'uotk', 6)
        .then(b => { results.OTK = b; })
        .catch(() => { results.OTK = 0; })
    );
  }

  await Promise.allSettled(fetchers);
  return results;
}

// ─── Bitcoin (mempool.space API) ───

async function fetchBtcBalance(address: string, apiBase: string): Promise<number> {
  const res = await fetch(`${apiBase}/address/${address}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return 0;
  const data = await res.json();

  const funded = data.chain_stats?.funded_txo_sum ?? 0;
  const spent = data.chain_stats?.spent_txo_sum ?? 0;
  const mempoolFunded = data.mempool_stats?.funded_txo_sum ?? 0;
  const mempoolSpent = data.mempool_stats?.spent_txo_sum ?? 0;

  const totalSats = (funded - spent) + (mempoolFunded - mempoolSpent);
  return totalSats / 1e8;
}

// ─── Ethereum (JSON-RPC) ───

async function fetchEthBalance(address: string, rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const wei = BigInt(data.result || '0x0');
  return Number(wei) / 1e18;
}

// ─── ERC-20 Token Balance ───

async function fetchErc20Balance(
  address: string, rpcUrl: string, tokenAddress: string, decimals: number,
): Promise<number> {
  // balanceOf(address) selector: 0x70a08231
  const paddedAddr = address.slice(2).padStart(64, '0');
  const calldata = `0x70a08231${paddedAddr}`;

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_call',
      params: [{ to: tokenAddress, data: calldata }, 'latest'],
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const raw = BigInt(data.result || '0x0');
  return Number(raw) / Math.pow(10, decimals);
}

// ─── Solana (JSON-RPC) ───

async function fetchSolBalance(address: string, rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getBalance',
      params: [address],
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const lamports = data.result?.value ?? 0;
  return lamports / 1e9;
}

// ─── Cosmos/OpenChain (REST API) ───

async function fetchCosmosBalance(
  address: string, restUrl: string, denom: string, decimals: number,
): Promise<number> {
  const res = await fetch(
    `${restUrl}/cosmos/bank/v1beta1/balances/${address}`,
    { signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  const balances: Array<{ denom: string; amount: string }> = data.balances ?? [];
  const entry = balances.find(b => b.denom === denom);
  if (!entry) return 0;
  return parseInt(entry.amount, 10) / Math.pow(10, decimals);
}
