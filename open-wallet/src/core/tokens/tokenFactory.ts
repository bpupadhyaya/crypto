/**
 * Token Factory — Create custom tokens on Open Chain.
 *
 * In demo mode, simulates token creation and stores results locally.
 * In production, constructs a MsgCreateDenom transaction via Cosmos SDK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CREATED_TOKENS_KEY = 'open_wallet_created_tokens';

export interface TokenCreateParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  description: string;
  creator: string;
}

export interface CreatedToken extends TokenCreateParams {
  denom: string;
  txHash: string;
  createdAt: number;
}

/**
 * Create a new token on Open Chain.
 * Demo mode: simulates creation with a fake tx hash and stores locally.
 * Real mode: would construct and broadcast a MsgCreateDenom transaction.
 */
export async function createToken(
  params: TokenCreateParams,
  _mnemonic: string,
  _accountIndex: number,
): Promise<{ txHash: string; denom: string }> {
  // Validate inputs
  if (!params.name || params.name.length < 1 || params.name.length > 64) {
    throw new Error('Token name must be 1-64 characters');
  }
  if (!params.symbol || params.symbol.length < 2 || params.symbol.length > 12) {
    throw new Error('Token symbol must be 2-12 characters');
  }
  if (params.decimals < 0 || params.decimals > 18) {
    throw new Error('Decimals must be between 0 and 18');
  }
  if (params.initialSupply <= 0 || params.initialSupply > 1_000_000_000_000) {
    throw new Error('Initial supply must be between 1 and 1 trillion');
  }
  if (!params.creator) {
    throw new Error('Creator address is required');
  }

  // Generate deterministic-looking denom and tx hash
  const timestamp = Date.now();
  const symbolLower = params.symbol.toLowerCase();
  const denom = `factory/${params.creator}/${symbolLower}`;
  const txHash = generateTxHash(params.symbol, timestamp);

  // Store the created token
  const token: CreatedToken = {
    ...params,
    denom,
    txHash,
    createdAt: timestamp,
  };

  const existing = await loadCreatedTokens();
  existing.push(token);
  await AsyncStorage.setItem(CREATED_TOKENS_KEY, JSON.stringify(existing));

  return { txHash, denom };
}

/**
 * Get all tokens created by a specific address.
 */
export async function getCreatedTokens(creator: string): Promise<CreatedToken[]> {
  const all = await loadCreatedTokens();
  return all.filter((t) => t.creator === creator);
}

/**
 * Get all locally stored created tokens.
 */
async function loadCreatedTokens(): Promise<CreatedToken[]> {
  try {
    const raw = await AsyncStorage.getItem(CREATED_TOKENS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CreatedToken[];
  } catch {
    return [];
  }
}

/**
 * Generate a realistic-looking transaction hash for demo mode.
 */
function generateTxHash(symbol: string, timestamp: number): string {
  const chars = '0123456789ABCDEF';
  let hash = '';
  // Use symbol + timestamp as seed for determinism
  let seed = timestamp;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i) * (i + 1);
  }
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    hash += chars[seed % 16];
  }
  return hash;
}
