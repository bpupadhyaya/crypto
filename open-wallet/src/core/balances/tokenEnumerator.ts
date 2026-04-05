/**
 * Token Auto-Discovery System — finds all tokens a wallet holds.
 *
 * Discovers ERC-20 tokens on Ethereum and SPL tokens on Solana,
 * then fetches their balances. Uses caching to avoid redundant
 * network calls and returns cached data instantly while refreshing
 * in the background.
 *
 * Tokens are classified as verified (on the curated allowlist) or
 * unverified to protect users from scam tokens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getNetworkConfig } from '../network';

// ─── Types ───

export interface DiscoveredToken {
  symbol: string;
  name: string;
  chain: string;
  contractAddress: string;
  decimals: number;
  balance: number;       // Human-readable
  balanceRaw: string;    // Raw on-chain value
  verified: boolean;     // On allowlist
  logoUrl?: string;
}

interface CachedTokenData {
  tokens: DiscoveredToken[];
  timestamp: number;
}

interface CachedMetadata {
  data: JupiterToken[];
  timestamp: number;
}

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// ─── Cache TTLs ───

const BALANCE_TTL_MS = 5 * 60 * 1000;        // 5 minutes
const METADATA_TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours

function cacheKey(chain: string, address: string): string {
  return `discovered_tokens_${chain}_${address}`;
}

const JUPITER_CACHE_KEY = 'jupiter_token_list_cache';

// ─── Curated ERC-20 Allowlist (Ethereum Mainnet) ───
// Top tokens by market cap with real contract addresses, symbols, and decimals.

interface CuratedToken {
  address: string;   // Checksummed Ethereum mainnet address
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

const CURATED_ERC20_TOKENS: CuratedToken[] = [
  // Stablecoins
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT',   name: 'Tether USD',             decimals: 6  },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC',   name: 'USD Coin',               decimals: 6  },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI',    name: 'Dai Stablecoin',         decimals: 18 },
  { address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', symbol: 'BUSD',   name: 'Binance USD',            decimals: 18 },
  { address: '0x0000000000085d4780B73119b644AE5ecd22b376', symbol: 'TUSD',   name: 'TrueUSD',                decimals: 18 },
  { address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1', symbol: 'USDP',   name: 'Pax Dollar',             decimals: 18 },
  { address: '0x853d955aCEf822Db058eb8505911ED77F175b99e', symbol: 'FRAX',   name: 'Frax',                   decimals: 18 },
  { address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', symbol: 'LUSD',   name: 'Liquity USD',            decimals: 18 },

  // Wrapped assets
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC',   name: 'Wrapped BTC',            decimals: 8  },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH',   name: 'Wrapped Ether',          decimals: 18 },
  { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', symbol: 'stETH',  name: 'Lido Staked Ether',      decimals: 18 },
  { address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704', symbol: 'cbETH',  name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
  { address: '0xae78736Cd615f374D3085123A210448E74Fc6393', symbol: 'rETH',   name: 'Rocket Pool ETH',        decimals: 18 },

  // DeFi governance / protocol tokens
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI',    name: 'Uniswap',                decimals: 18 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK',   name: 'Chainlink',              decimals: 18 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE',   name: 'Aave',                   decimals: 18 },
  { address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', symbol: 'MKR',    name: 'Maker',                  decimals: 18 },
  { address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', symbol: 'SNX',    name: 'Synthetix',              decimals: 18 },
  { address: '0xD533a949740bb3306d119CC777fa900bA034cd52', symbol: 'CRV',    name: 'Curve DAO Token',        decimals: 18 },
  { address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', symbol: 'COMP',   name: 'Compound',               decimals: 18 },
  { address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', symbol: 'SUSHI',  name: 'SushiSwap',              decimals: 18 },
  { address: '0xba100000625a3754423978a60c9317c58a424e3D', symbol: 'BAL',    name: 'Balancer',               decimals: 18 },
  { address: '0x111111111117dC0aa78b770fA6A738034120C302', symbol: '1INCH',  name: '1inch',                  decimals: 18 },
  { address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', symbol: 'YFI',    name: 'yearn.finance',          decimals: 18 },
  { address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', symbol: 'LDO',    name: 'Lido DAO',               decimals: 18 },
  { address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72', symbol: 'ENS',    name: 'Ethereum Name Service',  decimals: 18 },

  // Layer 2 / infrastructure
  { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', symbol: 'MATIC',  name: 'Polygon',                decimals: 18 },
  { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB',   name: 'Shiba Inu',              decimals: 18 },
  { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', symbol: 'PEPE',   name: 'Pepe',                   decimals: 18 },
  { address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', symbol: 'BNB',    name: 'BNB (ERC-20)',           decimals: 18 },
  { address: '0x75231F58b43240C9718Dd58B4967c5114342a86c', symbol: 'OKB',    name: 'OKB',                    decimals: 18 },
  { address: '0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3', symbol: 'LEO',    name: 'UNUS SED LEO',           decimals: 18 },
  { address: '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1', symbol: 'TON',    name: 'Toncoin (ERC-20)',       decimals: 9  },
  { address: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF', symbol: 'CHZ',    name: 'Chiliz',                 decimals: 18 },
  { address: '0x4d224452801ACEd8B2F0aebE155379bb5D594381', symbol: 'APE',    name: 'ApeCoin',                decimals: 18 },
  { address: '0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA', symbol: 'GALA',   name: 'Gala',                   decimals: 8  },
  { address: '0xf629cBd94d3791C9250152BD8dfBDF380E2a3B9c', symbol: 'ENJ',    name: 'Enjin Coin',             decimals: 18 },
  { address: '0xbb0E17EF65F82Ab018d8EDd776e8DD940327B28b', symbol: 'AXS',    name: 'Axie Infinity',          decimals: 18 },
  { address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', symbol: 'MANA',   name: 'Decentraland',           decimals: 18 },
  { address: '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC', symbol: 'STORJ',  name: 'Storj',                  decimals: 8  },
];

// Build a lookup map: lowercase address → CuratedToken
const CURATED_MAP = new Map<string, CuratedToken>(
  CURATED_ERC20_TOKENS.map((t) => [t.address.toLowerCase(), t]),
);

// ─── Etherscan Token Discovery ───

interface EtherscanTokenTx {
  contractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
}

/**
 * Discover ERC-20 tokens the user has interacted with via Etherscan API.
 * Returns unique contract addresses found in recent token transfers.
 */
async function discoverERC20Tokens(
  walletAddress: string,
  etherscanApiKey?: string,
): Promise<Map<string, { symbol: string; name: string; decimals: number }>> {
  const keyParam = etherscanApiKey ? `&apikey=${etherscanApiKey}` : '';
  const url =
    `https://api.etherscan.io/api?module=account&action=tokentx` +
    `&address=${walletAddress}&sort=desc&page=1&offset=50${keyParam}`;

  const discovered = new Map<string, { symbol: string; name: string; decimals: number }>();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return discovered;
    const data = await res.json();

    if (data.status !== '1' || !Array.isArray(data.result)) return discovered;

    for (const tx of data.result as EtherscanTokenTx[]) {
      const addr = tx.contractAddress.toLowerCase();
      if (!discovered.has(addr)) {
        discovered.set(addr, {
          symbol: tx.tokenSymbol,
          name: tx.tokenName,
          decimals: parseInt(tx.tokenDecimal, 10) || 18,
        });
      }
    }
  } catch {
    // Etherscan may rate-limit; we proceed with whatever we have
  }

  return discovered;
}

/**
 * Fetch ERC-20 balance for a single token via eth_call to balanceOf.
 */
async function fetchERC20Balance(
  walletAddress: string,
  tokenAddress: string,
  decimals: number,
  rpcUrl: string,
): Promise<{ balance: number; balanceRaw: string }> {
  const paddedAddr = walletAddress.slice(2).padStart(64, '0');
  const calldata = `0x70a08231${paddedAddr}`;

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: tokenAddress, data: calldata }, 'latest'],
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return { balance: 0, balanceRaw: '0' };
  const data = await res.json();
  const raw = BigInt(data.result || '0x0');
  return {
    balance: Number(raw) / Math.pow(10, decimals),
    balanceRaw: raw.toString(),
  };
}

/**
 * Full Ethereum token discovery pipeline:
 * 1. Query Etherscan for recent token transfers
 * 2. Also check all curated tokens (the user may hold tokens without recent txs)
 * 3. Fetch balanceOf for each
 * 4. Return tokens with non-zero balances
 */
async function enumerateEthereumTokens(
  walletAddress: string,
): Promise<DiscoveredToken[]> {
  const config = getNetworkConfig();
  const rpcUrl = config.ethereum.rpcUrl;

  // Step 1: Discover tokens from Etherscan transfer history
  const etherscanTokens = await discoverERC20Tokens(walletAddress);

  // Step 2: Merge with curated list (curated tokens always get checked)
  const tokensToCheck = new Map<string, { symbol: string; name: string; decimals: number }>();

  for (const [addr, meta] of CURATED_MAP) {
    tokensToCheck.set(addr, { symbol: meta.symbol, name: meta.name, decimals: meta.decimals });
  }
  for (const [addr, meta] of etherscanTokens) {
    if (!tokensToCheck.has(addr)) {
      tokensToCheck.set(addr, meta);
    }
  }

  // Step 3: Fetch balances in parallel (batches of 10 to avoid overloading)
  const results: DiscoveredToken[] = [];
  const entries = Array.from(tokensToCheck.entries());
  const BATCH_SIZE = 10;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async ([addr, meta]) => {
        const { balance, balanceRaw } = await fetchERC20Balance(
          walletAddress, addr, meta.decimals, rpcUrl,
        );
        if (balance > 0) {
          const curated = CURATED_MAP.get(addr);
          results.push({
            symbol: curated?.symbol ?? meta.symbol,
            name: curated?.name ?? meta.name,
            chain: 'ethereum',
            contractAddress: addr,
            decimals: meta.decimals,
            balance,
            balanceRaw,
            verified: CURATED_MAP.has(addr),
            logoUrl: curated?.logoUrl,
          });
        }
      }),
    );
  }

  return results;
}

// ─── Jupiter Token List Cache ───

let jupiterCache: JupiterToken[] | null = null;
let jupiterCacheTimestamp = 0;

async function getJupiterTokenList(): Promise<JupiterToken[]> {
  const now = Date.now();

  // Return in-memory cache if fresh
  if (jupiterCache && now - jupiterCacheTimestamp < METADATA_TTL_MS) {
    return jupiterCache;
  }

  // Try AsyncStorage cache
  try {
    const raw = await AsyncStorage.getItem(JUPITER_CACHE_KEY);
    if (raw) {
      const cached: CachedMetadata = JSON.parse(raw);
      if (now - cached.timestamp < METADATA_TTL_MS) {
        jupiterCache = cached.data;
        jupiterCacheTimestamp = cached.timestamp;
        return jupiterCache;
      }
    }
  } catch {}

  // Fetch fresh from Jupiter
  try {
    const res = await fetch('https://token.jup.ag/strict', {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const tokens: JupiterToken[] = await res.json();
      jupiterCache = tokens;
      jupiterCacheTimestamp = now;

      // Persist to AsyncStorage (fire and forget)
      AsyncStorage.setItem(
        JUPITER_CACHE_KEY,
        JSON.stringify({ data: tokens, timestamp: now }),
      ).catch(() => {});

      return tokens;
    }
  } catch {}

  // Return stale cache or empty
  return jupiterCache ?? [];
}

// ─── Solana SPL Token Discovery ───

interface SplTokenAccountValue {
  pubkey: string;
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
          };
        };
      };
    };
  };
}

/**
 * Full Solana SPL token discovery pipeline:
 * 1. getTokenAccountsByOwner to find all SPL token accounts
 * 2. Resolve each mint against Jupiter strict list for metadata
 * 3. Return tokens with non-zero balances
 */
async function enumerateSolanaTokens(
  walletAddress: string,
): Promise<DiscoveredToken[]> {
  const config = getNetworkConfig();
  const rpcUrl = config.solana.rpcUrl;

  // Step 1: Get all token accounts owned by this wallet
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const accounts: SplTokenAccountValue[] = data.result?.value ?? [];

  if (accounts.length === 0) return [];

  // Step 2: Fetch Jupiter token list for metadata resolution
  const jupiterTokens = await getJupiterTokenList();
  const jupiterMap = new Map<string, JupiterToken>(
    jupiterTokens.map((t) => [t.address, t]),
  );

  // Step 3: Map each token account to a DiscoveredToken
  const results: DiscoveredToken[] = [];

  for (const acct of accounts) {
    const info = acct.account.data.parsed.info;
    const mint = info.mint;
    const uiAmount = info.tokenAmount.uiAmount;
    const rawAmount = info.tokenAmount.amount;

    if (uiAmount <= 0) continue;

    const jupiterMeta = jupiterMap.get(mint);

    results.push({
      symbol: jupiterMeta?.symbol ?? 'UNKNOWN',
      name: jupiterMeta?.name ?? `SPL Token ${mint.slice(0, 8)}...`,
      chain: 'solana',
      contractAddress: mint,
      decimals: info.tokenAmount.decimals,
      balance: uiAmount,
      balanceRaw: rawAmount,
      verified: jupiterMap.has(mint),  // On Jupiter strict list
      logoUrl: jupiterMeta?.logoURI,
    });
  }

  return results;
}

// ─── Caching Layer ───

async function getCachedTokens(
  chain: string,
  address: string,
): Promise<DiscoveredToken[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(chain, address));
    if (!raw) return null;
    const cached: CachedTokenData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > BALANCE_TTL_MS) return null;
    return cached.tokens;
  } catch {
    return null;
  }
}

async function setCachedTokens(
  chain: string,
  address: string,
  tokens: DiscoveredToken[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      cacheKey(chain, address),
      JSON.stringify({ tokens, timestamp: Date.now() } as CachedTokenData),
    );
  } catch {}
}

// ─── Main Discovery Function ───

export interface DiscoveryAddresses {
  ethereum?: string;
  solana?: string;
}

/**
 * Discover all tokens across supported chains.
 *
 * Returns cached data immediately if available, then refreshes in background.
 * On first call (no cache), fetches everything fresh.
 */
export async function discoverAllTokens(
  addresses: DiscoveryAddresses,
): Promise<DiscoveredToken[]> {
  const allTokens: DiscoveredToken[] = [];
  const refreshPromises: Promise<void>[] = [];

  // Ethereum ERC-20 discovery
  if (addresses.ethereum) {
    const ethAddr = addresses.ethereum;
    const cached = await getCachedTokens('ethereum', ethAddr);

    if (cached) {
      allTokens.push(...cached);
      // Background refresh
      refreshPromises.push(
        enumerateEthereumTokens(ethAddr)
          .then((tokens) => setCachedTokens('ethereum', ethAddr, tokens))
          .catch(() => {}),
      );
    } else {
      const tokens = await enumerateEthereumTokens(ethAddr);
      allTokens.push(...tokens);
      await setCachedTokens('ethereum', ethAddr, tokens);
    }
  }

  // Solana SPL discovery
  if (addresses.solana) {
    const solAddr = addresses.solana;
    const cached = await getCachedTokens('solana', solAddr);

    if (cached) {
      allTokens.push(...cached);
      // Background refresh
      refreshPromises.push(
        enumerateSolanaTokens(solAddr)
          .then((tokens) => setCachedTokens('solana', solAddr, tokens))
          .catch(() => {}),
      );
    } else {
      const tokens = await enumerateSolanaTokens(solAddr);
      allTokens.push(...tokens);
      await setCachedTokens('solana', solAddr, tokens);
    }
  }

  // Don't await background refreshes — they update cache for next call
  if (refreshPromises.length > 0) {
    Promise.allSettled(refreshPromises);
  }

  return allTokens;
}

// ─── React Query Hook ───

/**
 * Hook for auto-discovering tokens held by the given wallet addresses.
 *
 * Returns verified and unverified tokens with live balances.
 * Refreshes every 5 minutes (aligned with cache TTL).
 *
 * Usage:
 *   const { tokens, isLoading, refresh } = useDiscoveredTokens({
 *     ethereum: '0x1234...',
 *     solana: 'ABC123...',
 *   });
 */
export function useDiscoveredTokens(addresses: DiscoveryAddresses) {
  const queryClient = useQueryClient();

  const queryKey = [
    'discoveredTokens',
    addresses.ethereum ?? '',
    addresses.solana ?? '',
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => discoverAllTokens(addresses),
    enabled: !!(addresses.ethereum || addresses.solana),
    staleTime: BALANCE_TTL_MS,
    refetchInterval: BALANCE_TTL_MS,
    // Return stale data while refetching
    placeholderData: (previousData: DiscoveredToken[] | undefined) => previousData,
  });

  const refresh = useCallback(() => {
    // Invalidate cache keys so next fetch is forced fresh
    if (addresses.ethereum) {
      AsyncStorage.removeItem(cacheKey('ethereum', addresses.ethereum)).catch(() => {});
    }
    if (addresses.solana) {
      AsyncStorage.removeItem(cacheKey('solana', addresses.solana)).catch(() => {});
    }
    queryClient.invalidateQueries({ queryKey });
  }, [addresses.ethereum, addresses.solana, queryClient, queryKey]);

  return {
    tokens: data ?? [],
    isLoading,
    isError,
    refresh,
  };
}

// ─── Utility Exports ───

/** Check if a token contract address is on the curated allowlist. */
export function isVerifiedToken(contractAddress: string): boolean {
  return CURATED_MAP.has(contractAddress.toLowerCase());
}

/** Get curated token info by contract address. */
export function getCuratedTokenInfo(contractAddress: string): CuratedToken | undefined {
  return CURATED_MAP.get(contractAddress.toLowerCase());
}

/** Get the full curated token list (useful for UI display). */
export function getCuratedTokenList(): CuratedToken[] {
  return [...CURATED_ERC20_TOKENS];
}
