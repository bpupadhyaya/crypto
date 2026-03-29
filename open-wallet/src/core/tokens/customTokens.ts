/**
 * Custom Token Registry — user-added tokens that work like built-in ones.
 *
 * Users can add any token by:
 * 1. Pasting a contract address (auto-detects name, symbol, decimals)
 * 2. Searching CoinGecko by name
 * 3. Manual entry (name, symbol, chain, decimals, contract)
 *
 * Custom tokens get the same features as built-in tokens:
 * swap, send, receive, price tracking, portfolio inclusion.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TokenInfo } from './registry';

const CUSTOM_TOKENS_KEY = 'ow-custom-tokens';

// Module-level cache
let customTokensCache: TokenInfo[] = [];
let loaded = false;

/** Load custom tokens from storage. */
export async function loadCustomTokens(): Promise<TokenInfo[]> {
  if (loaded) return customTokensCache;
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_TOKENS_KEY);
    if (raw) {
      customTokensCache = JSON.parse(raw);
    }
  } catch {}
  loaded = true;
  return customTokensCache;
}

/** Get cached custom tokens (sync). */
export function getCustomTokens(): TokenInfo[] {
  return customTokensCache;
}

/** Add a custom token. */
export async function addCustomToken(token: TokenInfo): Promise<void> {
  // Prevent duplicates
  if (customTokensCache.some((t) => t.symbol === token.symbol && t.chainId === token.chainId)) {
    throw new Error(`${token.symbol} on ${token.chainId} already exists`);
  }
  customTokensCache.push(token);
  await AsyncStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(customTokensCache));
}

/** Remove a custom token. */
export async function removeCustomToken(symbol: string, chainId: string): Promise<void> {
  customTokensCache = customTokensCache.filter(
    (t) => !(t.symbol === symbol && t.chainId === chainId)
  );
  await AsyncStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(customTokensCache));
}

/** Get all tokens (built-in + custom). */
export function getAllTokens(builtInTokens: TokenInfo[]): TokenInfo[] {
  return [...builtInTokens, ...customTokensCache];
}

/**
 * Auto-detect token info from a contract address.
 * Queries the blockchain to get name, symbol, decimals.
 */
export async function detectTokenFromAddress(
  contractAddress: string,
  chainId: string,
): Promise<Partial<TokenInfo> | null> {
  try {
    if (chainId === 'ethereum' || chainId === 'polygon' || chainId === 'avalanche' || chainId === 'bsc') {
      return await detectERC20Token(contractAddress, chainId);
    }
    if (chainId === 'solana') {
      return await detectSPLToken(contractAddress);
    }
    return null;
  } catch {
    return null;
  }
}

/** Detect ERC-20 token via eth_call. */
async function detectERC20Token(
  address: string,
  chainId: string,
): Promise<Partial<TokenInfo> | null> {
  const rpcUrls: Record<string, string> = {
    ethereum: 'https://eth.llamarpc.com',
    polygon: 'https://polygon-rpc.com',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    bsc: 'https://bsc-dataseed.binance.org',
  };

  const rpc = rpcUrls[chainId];
  if (!rpc) return null;

  // name() = 0x06fdde03, symbol() = 0x95d89b41, decimals() = 0x313ce567
  const calls = [
    { data: '0x06fdde03', field: 'name' },
    { data: '0x95d89b41', field: 'symbol' },
    { data: '0x313ce567', field: 'decimals' },
  ];

  const results: Record<string, string> = {};

  for (const call of calls) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_call',
          params: [{ to: address, data: call.data }, 'latest'],
        }),
      });
      const json = await res.json();
      if (json.result && json.result !== '0x') {
        results[call.field] = json.result;
      }
    } catch {}
  }

  if (!results.symbol) return null;

  // Decode results
  const decodeString = (hex: string): string => {
    try {
      // ABI-encoded string: skip selector + offset + length, then decode
      const data = hex.slice(2); // remove 0x
      const offset = parseInt(data.slice(0, 64), 16) * 2;
      const length = parseInt(data.slice(offset, offset + 64), 16);
      const strHex = data.slice(offset + 64, offset + 64 + length * 2);
      return Buffer.from(strHex, 'hex').toString('utf8').replace(/\0/g, '');
    } catch {
      return '';
    }
  };

  const name = decodeString(results.name || '0x');
  const symbol = decodeString(results.symbol || '0x');
  const decimals = results.decimals ? parseInt(results.decimals, 16) : 18;

  if (!symbol) return null;

  return {
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    chainId,
    decimals,
    contractAddress: address,
    coingeckoId: '',
    isNative: false,
    color: generateColorFromSymbol(symbol),
  } as Partial<TokenInfo>;
}

/** Detect SPL token on Solana. */
async function detectSPLToken(mintAddress: string): Promise<Partial<TokenInfo> | null> {
  // Query Solana token list API
  try {
    const res = await fetch(`https://token.jup.ag/strict`, { signal: AbortSignal.timeout(5000) });
    const tokens = await res.json();
    const match = tokens.find((t: any) => t.address === mintAddress);
    if (match) {
      return {
        symbol: match.symbol,
        name: match.name,
        chainId: 'solana',
        decimals: match.decimals,
        contractAddress: mintAddress,
        coingeckoId: '',
        isNative: false,
        color: generateColorFromSymbol(match.symbol),
      } as Partial<TokenInfo>;
    }
  } catch {}
  return null;
}

/** Search CoinGecko for tokens by name or symbol. */
export async function searchTokens(query: string): Promise<Array<{
  id: string; name: string; symbol: string; thumb: string; market_cap_rank: number;
}>> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data = await res.json();
    return (data.coins || []).slice(0, 20);
  } catch {
    return [];
  }
}

/** Generate a consistent color from a token symbol. */
function generateColorFromSymbol(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
