/**
 * Address Scanner — Scans for funds across all chains, address types, and indices.
 *
 * Used during seed phrase import to discover which addresses have funds.
 * Follows BIP-44 gap limit standard (20 consecutive empty addresses).
 */

import { HDWallet, BtcAddressType } from './hdwallet';
import { BitcoinSigner, scanBitcoinAddresses } from '../chains/bitcoin-signer';
import { getNetworkConfig } from '../network';

export interface DiscoveredAddress {
  chain: string;
  address: string;
  path: string;
  addressIndex: number;
  hasActivity: boolean;
  balance?: number;
  btcType?: BtcAddressType;
}

export interface ScanProgress {
  chain: string;
  scanned: number;
  found: number;
}

/**
 * Scan all chains for addresses with activity from a seed phrase.
 * Returns all chains' primary (index 0) addresses plus any additional
 * addresses with detected on-chain activity.
 *
 * @param wallet HD wallet to scan
 * @param gapLimit Number of empty addresses to scan before stopping (default: 20)
 * @param onProgress Optional callback for progress updates
 */
export async function scanAllChains(
  wallet: HDWallet,
  gapLimit: number = 20,
  onProgress?: (progress: ScanProgress) => void,
): Promise<{
  addresses: Record<string, string>;  // chain → primary address (index 0)
  discovered: DiscoveredAddress[];     // all addresses with activity
}> {
  const addresses: Record<string, string> = {};
  const discovered: DiscoveredAddress[] = [];

  // ─── Bitcoin: scan all 4 address types ───
  onProgress?.({ chain: 'bitcoin', scanned: 0, found: 0 });

  try {
    const btcResults = await scanBitcoinAddresses(wallet, gapLimit, 0);

    // Primary address is native segwit index 0
    const btcSigner = BitcoinSigner.fromWalletWithType(wallet, 'native-segwit', 0, 0);
    addresses.bitcoin = btcSigner.getAddress();

    for (const r of btcResults) {
      discovered.push({
        chain: 'bitcoin',
        address: r.address,
        path: r.path,
        addressIndex: r.addressIndex,
        hasActivity: true,
        balance: r.balance,
        btcType: r.type,
      });
    }

    onProgress?.({ chain: 'bitcoin', scanned: gapLimit * 4, found: btcResults.length });
  } catch {
    // Offline or API error — still set primary address
    const btcSigner = BitcoinSigner.fromWalletWithType(wallet, 'native-segwit', 0, 0);
    addresses.bitcoin = btcSigner.getAddress();
  }

  // ─── Ethereum: scan address indices ───
  onProgress?.({ chain: 'ethereum', scanned: 0, found: 0 });

  try {
    const { EthereumSigner } = await import('../chains/ethereum-signer');
    const ethSigner = EthereumSigner.fromWallet(wallet, 0);
    addresses.ethereum = ethSigner.getAddress();

    const ethResults = await scanEvmAddresses(wallet, 'ethereum', gapLimit);
    for (const r of ethResults) {
      discovered.push(r);
    }

    onProgress?.({ chain: 'ethereum', scanned: gapLimit, found: ethResults.length });
  } catch {
    try {
      const { EthereumSigner } = await import('../chains/ethereum-signer');
      addresses.ethereum = EthereumSigner.fromWallet(wallet, 0).getAddress();
    } catch { /* offline */ }
  }

  // ─── Solana: scan address indices ───
  onProgress?.({ chain: 'solana', scanned: 0, found: 0 });

  try {
    const { SolanaSigner } = await import('../chains/solana-signer');
    const solSigner = SolanaSigner.fromWallet(wallet, 0);
    addresses.solana = solSigner.getAddress();

    const solResults = await scanSolanaAddresses(wallet, gapLimit);
    for (const r of solResults) {
      discovered.push(r);
    }

    onProgress?.({ chain: 'solana', scanned: gapLimit, found: solResults.length });
  } catch {
    try {
      const { SolanaSigner } = await import('../chains/solana-signer');
      addresses.solana = SolanaSigner.fromWallet(wallet, 0).getAddress();
    } catch { /* offline */ }
  }

  // ─── Cosmos: primary address ───
  onProgress?.({ chain: 'cosmos', scanned: 0, found: 0 });

  try {
    const { CosmosSigner } = await import('../chains/cosmos-signer');
    const cosmosSigner = CosmosSigner.fromWallet(wallet, 0, 'cosmos');
    addresses.cosmos = await cosmosSigner.getAddress();

    const otkSigner = CosmosSigner.fromWallet(wallet, 0, 'openchain');
    addresses.openchain = await otkSigner.getAddress();

    onProgress?.({ chain: 'cosmos', scanned: 1, found: 0 });
  } catch {
    // Cosmos scanning not critical
  }

  return { addresses, discovered };
}

/**
 * Scan Ethereum/EVM addresses for activity using RPC balance checks.
 */
async function scanEvmAddresses(
  wallet: HDWallet,
  chainId: string,
  gapLimit: number,
): Promise<DiscoveredAddress[]> {
  const results: DiscoveredAddress[] = [];
  const config = getNetworkConfig().ethereum;
  let consecutiveEmpty = 0;

  for (let addrIdx = 0; addrIdx < 100 && consecutiveEmpty < gapLimit; addrIdx++) {
    try {
      const privateKey = wallet.derivePrivateKey(chainId as any, 0, addrIdx);
      const hexKey = ('0x' + Buffer.from(privateKey).toString('hex')) as `0x${string}`;
      const { privateKeyToAccount } = await import('viem/accounts');
      const account = privateKeyToAccount(hexKey);
      const address = account.address;
      const path = `m/44'/60'/0'/0/${addrIdx}`;

      // Check balance via JSON-RPC
      const res = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
      });

      if (!res.ok) { consecutiveEmpty++; continue; }
      const data = await res.json();
      const balance = parseInt(data.result || '0x0', 16);

      // Also check transaction count (nonce) to detect addresses that had activity
      const nonceRes = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 2,
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
        }),
      });

      const nonceData = await nonceRes.json();
      const nonce = parseInt(nonceData.result || '0x0', 16);

      if (balance > 0 || nonce > 0) {
        consecutiveEmpty = 0;
        results.push({
          chain: chainId, address, path, addressIndex: addrIdx,
          hasActivity: true, balance,
        });
      } else {
        consecutiveEmpty++;
      }
    } catch {
      consecutiveEmpty++;
    }
  }

  return results;
}

/**
 * Scan Solana addresses for activity.
 */
async function scanSolanaAddresses(
  wallet: HDWallet,
  gapLimit: number,
): Promise<DiscoveredAddress[]> {
  const results: DiscoveredAddress[] = [];
  const config = getNetworkConfig().solana;
  let consecutiveEmpty = 0;

  for (let addrIdx = 0; addrIdx < 100 && consecutiveEmpty < gapLimit; addrIdx++) {
    try {
      const { SolanaSigner } = await import('../chains/solana-signer');
      // Solana uses account index, not address index (all hardened)
      const signer = SolanaSigner.fromWallet(wallet, addrIdx);
      const address = signer.getAddress();
      const path = `m/44'/501'/${addrIdx}'/0'`;

      const res = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });

      if (!res.ok) { consecutiveEmpty++; continue; }
      const data = await res.json();
      const balance = data.result?.value ?? 0;

      if (balance > 0) {
        consecutiveEmpty = 0;
        results.push({
          chain: 'solana', address, path, addressIndex: addrIdx,
          hasActivity: true, balance,
        });
      } else {
        consecutiveEmpty++;
      }
    } catch {
      consecutiveEmpty++;
    }
  }

  return results;
}
