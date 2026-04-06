/**
 * Chain Service — Manages the embedded Open Chain validator node.
 *
 * On Android: Runs the openchaind binary as a background process.
 * On iOS: Uses the gomobile framework (future).
 *
 * The chain node runs on each phone, making Open Wallet fully P2P.
 * No servers needed — each phone is a validator.
 *
 * Lifecycle:
 *   1. App starts → extractChainBinary() (first time only)
 *   2. App unlocked → startChainNode()
 *   3. Node discovers peers via mDNS on local WiFi
 *   4. Node syncs blocks and participates in consensus
 *   5. App locked → node continues running (background)
 *   6. App killed → node stops, restarts on next launch
 */

import { Platform } from 'react-native';
import { getNetworkConfig } from '../network';

export interface ChainNodeStatus {
  running: boolean;
  height: number;
  peers: number;
  syncing: boolean;
  chainId: string;
  nodeId: string;
}

const CHAIN_NODE_PORT = 26657;
const CHAIN_REST_PORT = 1317;

let nodeRunning = false;
let statusPollInterval: ReturnType<typeof setInterval> | null = null;
let lastStatus: ChainNodeStatus = {
  running: false, height: 0, peers: 0, syncing: false, chainId: '', nodeId: '',
};

/**
 * Check if the local chain node is running by querying its RPC.
 */
export async function getChainNodeStatus(): Promise<ChainNodeStatus> {
  try {
    const res = await fetch(`http://localhost:${CHAIN_NODE_PORT}/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ...lastStatus, running: false };

    const data = await res.json();
    const result = data.result;

    lastStatus = {
      running: true,
      height: parseInt(result.sync_info.latest_block_height, 10),
      peers: 0, // Will fetch from net_info
      syncing: result.sync_info.catching_up,
      chainId: result.node_info.network,
      nodeId: result.node_info.id,
    };

    // Get peer count
    try {
      const netRes = await fetch(`http://localhost:${CHAIN_NODE_PORT}/net_info`, {
        signal: AbortSignal.timeout(2000),
      });
      if (netRes.ok) {
        const netData = await netRes.json();
        lastStatus.peers = parseInt(netData.result.n_peers, 10);
      }
    } catch { /* ignore */ }

    nodeRunning = true;
    return lastStatus;
  } catch {
    nodeRunning = false;
    return { running: false, height: 0, peers: 0, syncing: false, chainId: '', nodeId: '' };
  }
}

/**
 * Query the local chain node's REST API for account balance.
 */
export async function queryLocalBalance(address: string): Promise<number> {
  try {
    const res = await fetch(
      `http://localhost:${CHAIN_REST_PORT}/cosmos/bank/v1beta1/balances/${address}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const balances: Array<{ denom: string; amount: string }> = data.balances ?? [];
    const otk = balances.find(b => b.denom === 'uotk');
    if (!otk) return 0;
    return parseInt(otk.amount, 10) / 1e6; // uotk → OTK
  } catch {
    return 0;
  }
}

/**
 * Submit a signed transaction to the local chain node.
 */
export async function submitTransaction(txBytes: string): Promise<{ hash: string; code: number }> {
  const res = await fetch(`http://localhost:${CHAIN_NODE_PORT}/broadcast_tx_sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'broadcast_tx_sync',
      params: { tx: txBytes },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Chain RPC error: ${res.status}`);
  const data = await res.json();

  if (data.error) throw new Error(data.error.message ?? 'RPC error');

  return {
    hash: data.result?.hash ?? '',
    code: data.result?.code ?? -1,
  };
}

/**
 * Start polling the chain node status.
 * Updates lastStatus every 10 seconds.
 */
export function startStatusPolling(onUpdate?: (status: ChainNodeStatus) => void): void {
  if (statusPollInterval) return;

  statusPollInterval = setInterval(async () => {
    const status = await getChainNodeStatus();
    onUpdate?.(status);
  }, 10000);

  // Immediate first check
  getChainNodeStatus().then(status => onUpdate?.(status));
}

/**
 * Stop polling.
 */
export function stopStatusPolling(): void {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
}

/**
 * Check if the chain node is reachable.
 */
export async function isChainNodeRunning(): Promise<boolean> {
  const status = await getChainNodeStatus();
  return status.running;
}

/**
 * Get the latest block height from the local node.
 */
export async function getLatestHeight(): Promise<number> {
  const status = await getChainNodeStatus();
  return status.height;
}
