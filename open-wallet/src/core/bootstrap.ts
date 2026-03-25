/**
 * Bootstrap — Lazy provider initialization.
 *
 * Providers are registered lazily — they don't import heavy crypto
 * libraries until first use. This keeps app startup fast.
 */

import { registry } from './abstractions/registry';

let initialized = false;

export function bootstrapProviders() {
  if (initialized) return;
  initialized = true;

  // Providers are registered lazily — the actual chain libraries
  // (viem, solana web3, etc.) are only imported when first accessed.
  // This is done via dynamic imports in the provider constructors.

  // We register lightweight proxy providers that defer the heavy imports
  registerLazyProviders();
}

function registerLazyProviders() {
  // Chain providers — lazy loaded on first balance check or transaction
  const lazyChain = (chainId: string, importFn: () => Promise<any>) => {
    let instance: any = null;
    const proxy = new Proxy({} as any, {
      get(_target, prop) {
        if (prop === 'meta') {
          return { name: `Lazy${chainId}Provider`, backendType: 'server', version: '0.1.0', capabilities: [] };
        }
        if (prop === 'chainId') return chainId;
        return async (...args: any[]) => {
          if (!instance) {
            const mod = await importFn();
            const ProviderClass = Object.values(mod)[0] as any;
            instance = new ProviderClass();
          }
          return (instance as any)[prop](...args);
        };
      },
    });
    registry.registerChainProvider(chainId, proxy);
  };

  lazyChain('bitcoin', () => import('./providers/server/bitcoin'));
  lazyChain('ethereum', () => import('./providers/server/ethereum'));
  lazyChain('solana', () => import('./providers/server/solana'));

  // Oracle — lazy loaded on first price fetch
  let oracleInstance: any = null;
  const oracleProxy = new Proxy({} as any, {
    get(_target, prop) {
      if (prop === 'meta') {
        return { name: 'LazyOracleProvider', backendType: 'server', version: '0.1.0', capabilities: [] };
      }
      return async (...args: any[]) => {
        if (!oracleInstance) {
          const { ServerOracleProvider } = await import('./providers/server/oracle');
          oracleInstance = new ServerOracleProvider();
        }
        return (oracleInstance as any)[prop](...args);
      };
    },
  });
  registry.registerOracleProvider(oracleProxy);
}
