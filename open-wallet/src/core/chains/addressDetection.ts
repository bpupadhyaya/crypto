/**
 * Detect which blockchain network an address belongs to.
 * Used to auto-detect destination chain when swapping to USDC/USDT.
 */

export type StablecoinChain =
  | 'Ethereum'
  | 'Solana'
  | 'Tron'
  | 'BNB Chain'
  | 'Avalanche'
  | 'Polygon'
  | 'Arbitrum'
  | 'Base'
  | 'Optimism'
  | 'Cosmos';

export interface ChainDetectionResult {
  chain: StablecoinChain | null;
  /** true when the EVM address could be multiple chains */
  ambiguous: boolean;
  /** candidate chains when ambiguous */
  candidates: StablecoinChain[];
}

export const STABLECOIN_CHAINS: StablecoinChain[] = [
  'Ethereum',
  'Solana',
  'Tron',
  'BNB Chain',
  'Avalanche',
  'Polygon',
  'Arbitrum',
  'Base',
  'Optimism',
];

export const CHAIN_ICONS: Record<StablecoinChain, string> = {
  'Ethereum':  '⟠',
  'Solana':    '◎',
  'Tron':      '♦',
  'BNB Chain': '🟡',
  'Avalanche': '🔺',
  'Polygon':   '🟣',
  'Arbitrum':  '🔵',
  'Base':      '🔷',
  'Optimism':  '🔴',
  'Cosmos':    '⚛',
};

export const CHAIN_COLORS: Record<StablecoinChain, string> = {
  'Ethereum':  '#627eea',
  'Solana':    '#9945ff',
  'Tron':      '#ef0027',
  'BNB Chain': '#f0b90b',
  'Avalanche': '#e84142',
  'Polygon':   '#8247e5',
  'Arbitrum':  '#2d374b',
  'Base':      '#0052ff',
  'Optimism':  '#ff0420',
  'Cosmos':    '#2e3148',
};

/**
 * Detect chain from address format.
 * Returns ambiguous=true for EVM addresses (0x) since ETH/BNB/Polygon/etc share the same format.
 */
export function detectChainFromAddress(address: string): ChainDetectionResult {
  const addr = address.trim();

  if (!addr) return { chain: null, ambiguous: false, candidates: [] };

  // Tron: starts with T, 34 chars, base58
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) {
    return { chain: 'Tron', ambiguous: false, candidates: ['Tron'] };
  }

  // EVM: 0x + 40 hex chars — ambiguous across ETH/BNB/Polygon/Arbitrum/Avalanche/Base/Optimism
  if (/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    const evmCandidates: StablecoinChain[] = ['Ethereum', 'BNB Chain', 'Polygon', 'Avalanche', 'Arbitrum', 'Base', 'Optimism'];
    return { chain: 'Ethereum', ambiguous: true, candidates: evmCandidates };
  }

  // Cosmos: bech32 with cosmos1 prefix
  if (/^cosmos1[a-z0-9]{38}$/.test(addr)) {
    return { chain: 'Cosmos', ambiguous: false, candidates: ['Cosmos'] };
  }

  // Solana: base58, 32-44 chars, no special prefix
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    return { chain: 'Solana', ambiguous: false, candidates: ['Solana'] };
  }

  return { chain: null, ambiguous: false, candidates: [] };
}
