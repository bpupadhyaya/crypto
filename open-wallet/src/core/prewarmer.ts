/**
 * Pre-warmer — eagerly imports heavy modules during lock screen.
 *
 * By the time user enters PIN and reaches a screen that needs signers,
 * vault, or HD wallet, these modules are already in JS memory.
 *
 * This eliminates the 500-1500ms cold-import delay on first transaction.
 */

// Cached module references — shared across all screens
export let prewarmedModules: {
  Vault?: any;
  HDWallet?: any;
  EthereumSigner?: any;
  SolanaSigner?: any;
  BitcoinSigner?: any;
  CosmosSigner?: any;
  SigningStargateClient?: any;
  DirectSecp256k1Wallet?: any;
} = {};

let started = false;

/**
 * Start pre-warming heavy crypto modules in background.
 * Call this on app launch (even before unlock).
 * Non-blocking — failures are silent.
 */
export function startPrewarmer() {
  if (started) return;
  started = true;

  // Phase 1: Core wallet modules (needed for unlock + address derivation)
  Promise.all([
    import('./vault/vault'),
    import('./wallet/hdwallet'),
  ]).then(([vault, hd]) => {
    prewarmedModules.Vault = vault.Vault;
    prewarmedModules.HDWallet = hd.HDWallet;
  }).catch(() => {});

  // Phase 2: Chain signers (needed for send/swap/bridge — slightly delayed)
  setTimeout(() => {
    Promise.all([
      import('./chains/ethereum-signer'),
      import('./chains/solana-signer'),
      import('./chains/bitcoin-signer'),
      import('./chains/cosmos-signer'),
    ]).then(([eth, sol, btc, cosmos]) => {
      prewarmedModules.EthereumSigner = eth.EthereumSigner;
      prewarmedModules.SolanaSigner = sol.SolanaSigner;
      prewarmedModules.BitcoinSigner = btc.BitcoinSigner;
      prewarmedModules.CosmosSigner = cosmos.CosmosSigner;
    }).catch(() => {});
  }, 200);

  // Phase 3: Cosmos SDK signing (needed for staking/governance/gratitude)
  setTimeout(() => {
    Promise.all([
      import('@cosmjs/stargate'),
      import('@cosmjs/proto-signing'),
    ]).then(([stargate, proto]) => {
      prewarmedModules.SigningStargateClient = stargate.SigningStargateClient;
      prewarmedModules.DirectSecp256k1Wallet = proto.DirectSecp256k1Wallet;
    }).catch(() => {});
  }, 500);
}
