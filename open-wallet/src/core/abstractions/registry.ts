/**
 * Provider Registry — The switchboard.
 *
 * Wallet code calls: registry.getChainProvider('bitcoin')
 * Registry returns: whatever implementation is active (server, hybrid, or mobile)
 *
 * To migrate a service from server to mobile:
 *   registry.registerChainProvider('bitcoin', new MobileBtcProvider())
 * That's it. No other code changes needed.
 */

import {
  ChainId,
  BackendType,
  ProviderMeta,
} from './types';

import {
  IChainProvider,
  IDexProvider,
  IBridgeProvider,
  IOracleProvider,
  IValidatorProvider,
  IStorageProvider,
  INetworkProvider,
  IFiatProvider,
  IProviderRegistry,
} from './interfaces';

type ProviderFactory = () => void;

export class ProviderRegistry implements IProviderRegistry {
  private chainProviders = new Map<ChainId, IChainProvider>();
  private dexProviders = new Map<string, IDexProvider>(); // key: chainId or 'default'
  private bridgeProvider: IBridgeProvider | null = null;
  private oracleProvider: IOracleProvider | null = null;
  private validatorProvider: IValidatorProvider | null = null;
  private storageProvider: IStorageProvider | null = null;
  private networkProvider: INetworkProvider | null = null;
  private fiatProvider: IFiatProvider | null = null;

  // ─── Backend Type Switching ───

  private currentBackendType: BackendType = 'server';

  /** Registered factory functions for each backend type */
  private backendFactories = new Map<BackendType, ProviderFactory>();

  /**
   * Register a factory function that sets up all providers for a backend type.
   * Call this at startup for each supported mode (server, mobile, hybrid).
   *
   * Example:
   *   registry.registerBackendFactory('mobile', () => {
   *     registry.registerChainProvider('openchain', new MobileOpenChainProvider(p2p));
   *     registry.registerChainProvider('bitcoin', new MobileBitcoinProvider(config));
   *   });
   */
  registerBackendFactory(type: BackendType, factory: ProviderFactory): void {
    this.backendFactories.set(type, factory);
  }

  /**
   * Switch all providers to a different backend type.
   * Calls the registered factory for that type, replacing all providers.
   *
   * Usage:
   *   registry.setBackendType('mobile');  // switches all providers to P2P
   *   registry.setBackendType('server');  // switches back to server
   */
  setBackendType(type: BackendType): void {
    const factory = this.backendFactories.get(type);
    if (!factory) {
      throw new Error(`No backend factory registered for '${type}'. Register one with registerBackendFactory().`);
    }
    this.currentBackendType = type;
    factory();
  }

  getCurrentBackendType(): BackendType {
    return this.currentBackendType;
  }

  // ─── Registration (used at startup and during migration) ───

  registerChainProvider(chainId: ChainId, provider: IChainProvider): void {
    this.chainProviders.set(chainId, provider);
  }

  registerDexProvider(provider: IDexProvider, chainId?: ChainId): void {
    this.dexProviders.set(chainId ?? 'default', provider);
  }

  registerBridgeProvider(provider: IBridgeProvider): void {
    this.bridgeProvider = provider;
  }

  registerOracleProvider(provider: IOracleProvider): void {
    this.oracleProvider = provider;
  }

  registerValidatorProvider(provider: IValidatorProvider): void {
    this.validatorProvider = provider;
  }

  registerStorageProvider(provider: IStorageProvider): void {
    this.storageProvider = provider;
  }

  registerNetworkProvider(provider: INetworkProvider): void {
    this.networkProvider = provider;
  }

  registerFiatProvider(provider: IFiatProvider): void {
    this.fiatProvider = provider;
  }

  // ─── Retrieval (used by wallet code) ───

  getChainProvider(chainId: ChainId): IChainProvider {
    const provider = this.chainProviders.get(chainId);
    if (!provider) {
      throw new Error(`No chain provider registered for ${chainId}`);
    }
    return provider;
  }

  getDexProvider(chainId?: ChainId): IDexProvider {
    const provider = this.dexProviders.get(chainId ?? 'default');
    if (!provider) {
      throw new Error(`No DEX provider registered for ${chainId ?? 'default'}`);
    }
    return provider;
  }

  getBridgeProvider(): IBridgeProvider {
    if (!this.bridgeProvider) throw new Error('No bridge provider registered');
    return this.bridgeProvider;
  }

  getOracleProvider(): IOracleProvider {
    if (!this.oracleProvider) throw new Error('No oracle provider registered');
    return this.oracleProvider;
  }

  getValidatorProvider(): IValidatorProvider {
    if (!this.validatorProvider) throw new Error('No validator provider registered');
    return this.validatorProvider;
  }

  getStorageProvider(): IStorageProvider {
    if (!this.storageProvider) throw new Error('No storage provider registered');
    return this.storageProvider;
  }

  getNetworkProvider(): INetworkProvider {
    if (!this.networkProvider) throw new Error('No network provider registered');
    return this.networkProvider;
  }

  getFiatProvider(): IFiatProvider {
    if (!this.fiatProvider) throw new Error('No fiat provider registered');
    return this.fiatProvider;
  }

  // ─── Migration Support ───

  getBackendType(service: string): 'server' | 'hybrid' | 'mobile' {
    const providerMap: Record<string, { meta: ProviderMeta } | null> = {
      chain: this.chainProviders.values().next().value ?? null,
      dex: this.dexProviders.values().next().value ?? null,
      bridge: this.bridgeProvider,
      oracle: this.oracleProvider,
      validator: this.validatorProvider,
      storage: this.storageProvider,
      network: this.networkProvider,
      fiat: this.fiatProvider,
    };
    const provider = providerMap[service];
    return provider?.meta.backendType ?? 'server';
  }

  getMigrationStatus(): Map<string, { current: string; target: string; readiness: number }> {
    const status = new Map<string, { current: string; target: string; readiness: number }>();
    const services = ['chain', 'dex', 'bridge', 'oracle', 'validator', 'storage', 'network', 'fiat'];

    for (const service of services) {
      status.set(service, {
        current: this.getBackendType(service),
        target: 'mobile',
        readiness: this.getBackendType(service) === 'mobile' ? 100 :
                   this.getBackendType(service) === 'hybrid' ? 50 : 0,
      });
    }

    return status;
  }

  getRegisteredChains(): ChainId[] {
    return Array.from(this.chainProviders.keys());
  }
}

// Singleton instance
export const registry = new ProviderRegistry();
