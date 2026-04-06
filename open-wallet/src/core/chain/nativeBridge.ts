/**
 * Native Bridge — calls the embedded Open Chain gomobile library via React Native NativeModules.
 *
 * Android: Uses ChainNodeModule.kt which calls mobile.Mobile.* (gomobile AAR)
 * iOS: Will use OpenChain.xcframework (same Go code, different binding)
 *
 * This replaces the localhost HTTP approach with direct in-process calls.
 */

import { NativeModules, Platform } from 'react-native';

const { OpenChainNode } = NativeModules;

/**
 * Check if the native chain module is available.
 */
export function isNativeChainAvailable(): boolean {
  return OpenChainNode != null;
}

/**
 * Start the embedded P2P chain node.
 * @param config Node configuration (chain ID, peers, ports, etc.)
 * @returns The node's peer ID
 */
export async function startNativeNode(config?: {
  chainId?: string;
  listenAddr?: string;
  enableMDNS?: boolean;
  bootstrapPeers?: string[];
}): Promise<string> {
  if (!OpenChainNode) {
    throw new Error('Open Chain native module not available. Rebuild the app with the AAR/xcframework.');
  }

  const configJSON = JSON.stringify({
    chain_id: config?.chainId ?? 'openchain-p2p-1',
    listen_addr: config?.listenAddr ?? '0.0.0.0:26656',
    enable_mdns: config?.enableMDNS ?? true,
    enable_dht: true,
    bootstrap_peers: config?.bootstrapPeers ?? [],
  });

  return OpenChainNode.startNode(configJSON);
}

/**
 * Stop the embedded chain node.
 */
export async function stopNativeNode(): Promise<void> {
  if (!OpenChainNode) return;
  await OpenChainNode.stopNode();
}

/**
 * Get the node's current status.
 * Returns JSON string with peer_id, peer_count, latest_height, syncing, chain_id.
 */
export async function getNativeNodeStatus(): Promise<{
  peer_id: string;
  peer_count: number;
  latest_height: number;
  syncing: boolean;
  chain_id: string;
} | null> {
  if (!OpenChainNode) return null;
  try {
    const json = await OpenChainNode.getNodeStatus();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Get connected peers as JSON array.
 */
export async function getNativePeers(): Promise<any[]> {
  if (!OpenChainNode) return [];
  try {
    const json = await OpenChainNode.getPeers();
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/**
 * Broadcast a transaction to the P2P network.
 * @param txHex Hex-encoded transaction bytes
 */
export async function broadcastNativeTx(txHex: string): Promise<void> {
  if (!OpenChainNode) throw new Error('Chain node not available');
  await OpenChainNode.broadcastTransaction(txHex);
}

/**
 * Query balance for an address from local state.
 */
export async function queryNativeBalance(address: string): Promise<{
  address: string;
  balances: Array<{ denom: string; amount: string }>;
}> {
  if (!OpenChainNode) return { address, balances: [] };
  try {
    const json = await OpenChainNode.getBalance(address);
    return JSON.parse(json);
  } catch {
    return { address, balances: [] };
  }
}

/**
 * Check if this node is configured as a validator.
 */
export async function isNativeValidator(): Promise<boolean> {
  if (!OpenChainNode) return false;
  try {
    return await OpenChainNode.isValidator();
  } catch {
    return false;
  }
}
