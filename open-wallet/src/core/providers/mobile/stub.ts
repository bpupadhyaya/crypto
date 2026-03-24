/**
 * Mobile Provider Stubs — Future P2P implementations.
 *
 * These stubs exist to document the migration path. Each one will be
 * implemented when mobile hardware is ready for that specific task.
 *
 * The ProviderRegistry can swap any server provider with its mobile
 * counterpart without changing wallet code. Example:
 *
 *   // Today (server):
 *   registry.registerChainProvider('bitcoin', new ServerBitcoinProvider());
 *
 *   // Future (mobile):
 *   registry.registerChainProvider('bitcoin', new MobileBitcoinProvider());
 *
 * Migration requirements are documented for each stub.
 */

import {
  IChainProvider,
  IDexProvider,
  IBridgeProvider,
  IOracleProvider,
  IValidatorProvider,
  INetworkProvider,
} from '../../abstractions/interfaces';

/**
 * Mobile Bitcoin Provider
 * Tech needed: Neutrino/SPV light client compiled to mobile native
 * Hardware needed: Phone CPU capable of validating block headers (~2028)
 * Readiness: 0%
 */
// export class MobileBitcoinProvider implements IChainProvider { ... }

/**
 * Mobile Ethereum Provider
 * Tech needed: Helios light client (Rust → mobile native via UniFFI)
 * Hardware needed: Phone with 8GB+ RAM, stable network (~2028)
 * Readiness: 0%
 */
// export class MobileEthereumProvider implements IChainProvider { ... }

/**
 * Mobile Solana Provider
 * Tech needed: TinyDancer light client
 * Hardware needed: Phone with high-bandwidth connection (~2029)
 * Readiness: 0%
 */
// export class MobileSolanaProvider implements IChainProvider { ... }

/**
 * Mobile DEX Provider
 * Tech needed: libp2p order book, local AMM computation
 * Hardware needed: Phone NPU > 30 TOPS for price computation (~2030)
 * Readiness: 0%
 */
// export class MobileDexProvider implements IDexProvider { ... }

/**
 * Mobile Bridge Relay Provider
 * Tech needed: libp2p relay network, ZK proof verification on phone
 * Hardware needed: Phone NPU > 50 TOPS (~2030)
 * Readiness: 0%
 */
// export class MobileBridgeProvider implements IBridgeProvider { ... }

/**
 * Mobile Oracle Provider
 * Tech needed: P2P price consensus protocol among wallet peers
 * Hardware needed: P2P mesh with >1M phones for reliable consensus (~2031)
 * Readiness: 0%
 */
// export class MobileOracleProvider implements IOracleProvider { ... }

/**
 * Mobile Validator Provider (Open Chain)
 * Tech needed: CometBFT light validation on mobile, ZK proof gen
 * Hardware needed: Phone NPU > 50 TOPS, 6G connectivity (~2032)
 * Readiness: 0%
 */
// export class MobileValidatorProvider implements IValidatorProvider { ... }

/**
 * Mobile Network Provider (libp2p)
 * Tech needed: libp2p compiled to mobile native, NAT traversal
 * Hardware needed: Any modern phone with internet (~2027, earliest migration)
 * Readiness: 10% (libp2p mobile bindings exist but are experimental)
 */
// export class MobileNetworkProvider implements INetworkProvider { ... }

// Placeholder export so the module isn't empty
export const MOBILE_PROVIDERS_STATUS = {
  bitcoin: { readiness: 0, estimatedYear: 2028 },
  ethereum: { readiness: 0, estimatedYear: 2028 },
  solana: { readiness: 0, estimatedYear: 2029 },
  dex: { readiness: 0, estimatedYear: 2030 },
  bridge: { readiness: 0, estimatedYear: 2030 },
  oracle: { readiness: 0, estimatedYear: 2031 },
  validator: { readiness: 0, estimatedYear: 2032 },
  network: { readiness: 10, estimatedYear: 2027 },
} as const;
