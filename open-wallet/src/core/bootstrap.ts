/**
 * Bootstrap — Initialize the Open Wallet provider registry.
 *
 * This is where server providers are registered today.
 * During migration, swap any line to its mobile equivalent:
 *
 *   BEFORE: registry.registerChainProvider('bitcoin', new ServerBitcoinProvider());
 *   AFTER:  registry.registerChainProvider('bitcoin', new MobileBitcoinProvider());
 *
 * The rest of the app doesn't change.
 */

import { registry } from './abstractions/registry';
import { ServerBitcoinProvider } from './providers/server/bitcoin';
import { ServerEthereumProvider } from './providers/server/ethereum';
import { ServerSolanaProvider } from './providers/server/solana';
import { ServerOracleProvider } from './providers/server/oracle';

export function bootstrapProviders() {
  // ─── Chain Providers (Server → Mobile migration path) ───
  registry.registerChainProvider('bitcoin', new ServerBitcoinProvider());
  registry.registerChainProvider('ethereum', new ServerEthereumProvider());
  registry.registerChainProvider('solana', new ServerSolanaProvider());

  // ─── Oracle (Server → P2P migration path) ───
  registry.registerOracleProvider(new ServerOracleProvider());

  // ─── DEX, Bridge, Fiat — TODO: implement in next phase ───
  // registry.registerDexProvider(new Server1inchProvider());
  // registry.registerBridgeProvider(new ServerLiFiProvider());
  // registry.registerFiatProvider(new ServerMoonPayProvider());

  // ─── Validator, Network — Open Chain specific, Phase 3+ ───
  // registry.registerValidatorProvider(new ServerCosmosValidator());
  // registry.registerNetworkProvider(new ServerHttpProvider());

  console.log('[Open Wallet] Providers initialized');
  console.log('[Open Wallet] Registered chains:', registry.getRegisteredChains());
  console.log('[Open Wallet] Migration status:', Object.fromEntries(registry.getMigrationStatus()));
}
