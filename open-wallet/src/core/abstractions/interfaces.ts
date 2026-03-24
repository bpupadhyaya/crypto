/**
 * CORE ABSTRACTION LAYER — The Plugin Architecture
 *
 * Every backend service is defined as an interface. Each interface has:
 *   - A ServerProvider (works today, uses APIs/servers)
 *   - A MobileProvider (stub today, implements when phone hardware is ready)
 *   - A HybridProvider (transitional, uses both)
 *
 * The wallet code ONLY talks to these interfaces. It never knows whether
 * the backend is a server, a phone peer, or a hybrid. This is how we
 * migrate from server → mobile without changing the app.
 *
 * "Design for mobile-first, build with best available today,
 *  migrate to mobile-only as tech catches up."
 */

import {
  ChainId,
  Token,
  Balance,
  Transaction,
  SwapQuote,
  SignedTransaction,
  KeyPair,
  ProviderMeta,
} from './types';

// ─── Chain Provider ─────────────────────────────────────────
// Abstracts interaction with any blockchain.
// Server: uses RPC nodes / API services
// Mobile: uses light client / P2P network

export interface IChainProvider {
  readonly meta: ProviderMeta;
  readonly chainId: ChainId;

  getBalance(address: string, token?: Token): Promise<Balance>;
  getTransactionHistory(address: string, limit?: number): Promise<Transaction[]>;
  getTransaction(hash: string): Promise<Transaction | null>;
  broadcastTransaction(signedTx: SignedTransaction): Promise<string>; // returns tx hash
  estimateFee(from: string, to: string, amount: bigint, token?: Token): Promise<bigint>;
  getBlockHeight(): Promise<number>;
  isAddressValid(address: string): boolean;
}

// ─── DEX Provider ───────────────────────────────────────────
// Abstracts decentralized exchange / swap functionality.
// Server: uses 1inch API, Jupiter API, Osmosis API
// Mobile: P2P order matching (future)

export interface IDexProvider {
  readonly meta: ProviderMeta;

  getQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint,
    slippageBps?: number
  ): Promise<SwapQuote>;

  executeSwap(
    quote: SwapQuote,
    signerFn: (data: Uint8Array) => Promise<Uint8Array>
  ): Promise<Transaction>;

  getSupportedTokens(chainId: ChainId): Promise<Token[]>;
  getTokenPrice(token: Token): Promise<number>; // USD price
}

// ─── Bridge Provider ────────────────────────────────────────
// Abstracts cross-chain token transfers.
// Server: uses THORChain, Li.Fi, Wormhole APIs
// Mobile: P2P relay network (future)

export interface IBridgeProvider {
  readonly meta: ProviderMeta;

  getBridgeQuote(
    fromToken: Token,
    toToken: Token,
    amount: bigint
  ): Promise<SwapQuote>;

  executeBridge(
    quote: SwapQuote,
    signerFn: (data: Uint8Array) => Promise<Uint8Array>
  ): Promise<Transaction>;

  getSupportedRoutes(): Promise<Array<{ from: ChainId; to: ChainId }>>;
  getBridgeStatus(txHash: string): Promise<'pending' | 'in_transit' | 'completed' | 'failed'>;
}

// ─── Oracle Provider ────────────────────────────────────────
// Abstracts price feeds and market data.
// Server: CoinGecko API, Chainlink
// Mobile: P2P price consensus from peer wallets (future)

export interface IOracleProvider {
  readonly meta: ProviderMeta;

  getPrice(token: Token): Promise<number>; // USD
  getPrices(tokens: Token[]): Promise<Map<string, number>>;
  getPriceHistory(
    token: Token,
    days: number
  ): Promise<Array<{ timestamp: number; price: number }>>;
}

// ─── Validator Provider ─────────────────────────────────────
// Abstracts block validation for Open Chain.
// Server: Cosmos SDK validators on dedicated servers
// Mobile: phone-based probabilistic validation (future)

export interface IValidatorProvider {
  readonly meta: ProviderMeta;

  validateBlock(blockData: Uint8Array): Promise<boolean>;
  getCurrentValidators(): Promise<Array<{ address: string; stake: bigint; isPhone: boolean }>>;
  getChainProof(): Promise<Uint8Array>; // ZK-succinct proof of chain state
  submitVote(blockHash: string, approve: boolean): Promise<void>;
}

// ─── Storage Provider ───────────────────────────────────────
// Abstracts transaction indexing and history storage.
// Server: Indexed database (like Etherscan)
// Mobile: Local SQLite + P2P query (future)

export interface IStorageProvider {
  readonly meta: ProviderMeta;

  store(key: string, value: Uint8Array): Promise<void>;
  retrieve(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// ─── Network Provider ───────────────────────────────────────
// Abstracts peer-to-peer communication.
// Server: HTTPS to API endpoints
// Mobile: libp2p mesh network (future)

export interface INetworkProvider {
  readonly meta: ProviderMeta;

  sendMessage(peerId: string, data: Uint8Array): Promise<void>;
  broadcastMessage(topic: string, data: Uint8Array): Promise<void>;
  onMessage(topic: string, handler: (data: Uint8Array, peerId: string) => void): void;
  getPeers(): Promise<string[]>;
  getConnectionType(): 'server' | 'p2p' | 'hybrid';
}

// ─── Fiat Provider ──────────────────────────────────────────
// Abstracts fiat on/off ramp and bank integration.
// Server: MoonPay, Transak, Plaid APIs
// Mobile: P2P fiat exchange (future)

export interface IFiatProvider {
  readonly meta: ProviderMeta;

  getBuyQuote(fiatCurrency: string, token: Token, fiatAmount: number): Promise<{
    tokenAmount: bigint;
    feeUsd: number;
    provider: string;
  }>;

  getSellQuote(token: Token, amount: bigint, fiatCurrency: string): Promise<{
    fiatAmount: number;
    feeUsd: number;
    provider: string;
  }>;

  getSupportedCurrencies(): Promise<string[]>;
  getSupportedPaymentMethods(): Promise<string[]>;
}

// ─── Provider Registry ──────────────────────────────────────
// Central registry that the wallet uses to get the current provider
// for each service. During migration, providers can be swapped
// without touching any wallet code.

export interface IProviderRegistry {
  getChainProvider(chainId: ChainId): IChainProvider;
  getDexProvider(chainId?: ChainId): IDexProvider;
  getBridgeProvider(): IBridgeProvider;
  getOracleProvider(): IOracleProvider;
  getValidatorProvider(): IValidatorProvider;
  getStorageProvider(): IStorageProvider;
  getNetworkProvider(): INetworkProvider;
  getFiatProvider(): IFiatProvider;

  // Migration support
  getBackendType(service: string): 'server' | 'hybrid' | 'mobile';
  getMigrationStatus(): Map<string, { current: string; target: string; readiness: number }>;
}
