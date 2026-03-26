/**
 * Network Configuration — Testnet / Mainnet toggle.
 *
 * Controls which RPC endpoints and chain parameters are used.
 * Testnet is the default for safety — switch to mainnet when ready.
 */

export type NetworkMode = 'testnet' | 'mainnet';

interface NetworkConfig {
  bitcoin: { apiBase: string; addressPrefix: string };
  ethereum: { rpcUrl: string; chainId: number; chainName: string };
  solana: { rpcUrl: string; cluster: 'devnet' | 'testnet' | 'mainnet-beta' };
  openchain: { rpcUrl: string; restUrl: string; chainId: string; addressPrefix: string };
}

const TESTNET_CONFIG: NetworkConfig = {
  bitcoin: {
    apiBase: 'https://mempool.space/testnet/api',
    addressPrefix: 'tb1',
  },
  ethereum: {
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
    chainName: 'Sepolia',
  },
  solana: {
    rpcUrl: 'https://api.devnet.solana.com',
    cluster: 'devnet',
  },
  openchain: {
    rpcUrl: 'http://localhost:26657',
    restUrl: 'http://localhost:1317',
    chainId: 'openchain-testnet-1',
    addressPrefix: 'openchain',
  },
};

const MAINNET_CONFIG: NetworkConfig = {
  bitcoin: {
    apiBase: 'https://mempool.space/api',
    addressPrefix: 'bc1',
  },
  ethereum: {
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    chainName: 'Ethereum',
  },
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    cluster: 'mainnet-beta',
  },
  openchain: {
    rpcUrl: 'https://rpc.openchain.network', // future mainnet RPC
    restUrl: 'https://api.openchain.network', // future mainnet REST
    chainId: 'openchain-1',
    addressPrefix: 'openchain',
  },
};

let currentMode: NetworkMode = 'testnet';
const listeners: Array<(mode: NetworkMode) => void> = [];

export function getNetworkMode(): NetworkMode {
  return currentMode;
}

export function setNetworkMode(mode: NetworkMode): void {
  currentMode = mode;
  for (const fn of listeners) fn(mode);
}

export function onNetworkModeChange(fn: (mode: NetworkMode) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function getNetworkConfig(): NetworkConfig {
  return currentMode === 'testnet' ? TESTNET_CONFIG : MAINNET_CONFIG;
}

export function isTestnet(): boolean {
  return currentMode === 'testnet';
}
