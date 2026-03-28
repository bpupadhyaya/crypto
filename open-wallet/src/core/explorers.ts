/**
 * Block explorer URLs for each supported chain.
 * Returns the full URL for a given transaction hash.
 */

const EXPLORER_MAP: Record<string, string> = {
  bitcoin: 'https://mempool.space/tx/',
  ethereum: 'https://etherscan.io/tx/',
  solana: 'https://solscan.io/tx/',
  cosmos: 'https://www.mintscan.com/cosmos/txs/',
  openchain: 'https://explorer.openchain.network/tx/',
};

// Testnet variants
const TESTNET_EXPLORER_MAP: Record<string, string> = {
  bitcoin: 'https://mempool.space/testnet/tx/',
  ethereum: 'https://sepolia.etherscan.io/tx/',
  solana: 'https://solscan.io/tx/', // append ?cluster=devnet
  cosmos: 'https://www.mintscan.com/cosmos/txs/',
  openchain: 'https://explorer.openchain.network/tx/',
};

/**
 * Get the block explorer URL for a transaction.
 * @param chain - Chain identifier (e.g., 'bitcoin', 'ethereum', 'solana')
 * @param txHash - The transaction hash
 * @param testnet - Whether to use testnet explorer (default: false)
 */
export function getExplorerUrl(chain: string, txHash: string, testnet = false): string {
  const map = testnet ? TESTNET_EXPLORER_MAP : EXPLORER_MAP;
  const base = map[chain.toLowerCase()];

  if (!base) {
    // Fallback: return a search-friendly URL
    return `https://blockscan.com/tx/${txHash}`;
  }

  // Solana devnet needs a query parameter
  if (chain.toLowerCase() === 'solana' && testnet) {
    return `${base}${txHash}?cluster=devnet`;
  }

  return `${base}${txHash}`;
}
