/**
 * Bootstrap — Initialize the Open Wallet provider registry.
 *
 * Every provider registered here can be swapped to its mobile equivalent
 * by changing one line. The rest of the app doesn't change.
 */

import { registry } from './abstractions/registry';
import { ServerBitcoinProvider } from './providers/server/bitcoin';
import { ServerEthereumProvider } from './providers/server/ethereum';
import { ServerSolanaProvider } from './providers/server/solana';
import { ServerOracleProvider } from './providers/server/oracle';
import { ServerDexProvider } from './providers/server/dex';
import { ServerBridgeProvider } from './providers/server/bridge';

export function bootstrapProviders() {
  // ─── Chain Providers ───
  registry.registerChainProvider('bitcoin', new ServerBitcoinProvider());
  registry.registerChainProvider('ethereum', new ServerEthereumProvider());
  registry.registerChainProvider('solana', new ServerSolanaProvider());

  // ─── DEX Aggregator ───
  const dex = new ServerDexProvider(); // pass API key via env in production
  registry.registerDexProvider(dex); // default for all chains
  registry.registerDexProvider(dex, 'ethereum');
  registry.registerDexProvider(dex, 'solana');

  // ─── Bridge (Cross-Chain) ───
  registry.registerBridgeProvider(new ServerBridgeProvider());

  // ─── Oracle (Price Feeds) ───
  registry.registerOracleProvider(new ServerOracleProvider());
}
