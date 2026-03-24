/**
 * Core types used across the Open Wallet ecosystem.
 * These are chain-agnostic, backend-agnostic primitives.
 */

export type ChainId =
  | 'bitcoin'
  | 'ethereum'
  | 'solana'
  | 'cardano'
  | 'cosmos'
  | 'openchain'
  | string; // extensible for future chains

export type TokenSymbol = string; // 'BTC', 'ETH', 'SOL', 'USDC', 'OPEN', etc.

export interface Token {
  symbol: TokenSymbol;
  name: string;
  chainId: ChainId;
  decimals: number;
  contractAddress?: string; // undefined for native tokens
  logoUri?: string;
}

export interface Balance {
  token: Token;
  amount: bigint; // raw amount in smallest unit
  usdValue?: number;
}

export interface Transaction {
  id: string;
  chainId: ChainId;
  from: string;
  to: string;
  amount: bigint;
  token: Token;
  fee?: bigint;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  hash?: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: bigint;
  toAmount: bigint;
  route: string; // human-readable route description
  estimatedFeeUsd: number;
  provider: string; // which DEX/bridge
  expiresAt: number;
  priceImpact: number; // percentage
}

export interface SignedTransaction {
  chainId: ChainId;
  rawTransaction: Uint8Array;
  hash: string;
}

export interface KeyPair {
  publicKey: Uint8Array;
  chainId: ChainId;
  address: string;
  derivationPath: string;
}

export interface WalletAccount {
  id: string;
  name: string;
  chains: Map<ChainId, KeyPair>;
  createdAt: number;
}

export type BackendType = 'server' | 'hybrid' | 'mobile';

/**
 * Metadata about the current backend provider.
 * Used for the progressive migration tracker.
 */
export interface ProviderMeta {
  name: string;
  backendType: BackendType;
  version: string;
  capabilities: string[];
}
