/**
 * P2P Connection Manager — connects to Open Chain peers directly.
 * No central server. Uses WebSocket connections to CometBFT nodes
 * running on peer phones.
 *
 * Architecture:
 *   Each phone runs CometBFT → exposes WebSocket on port 26657 →
 *   other phones connect directly to that IP:port. No central server.
 *
 * When P2P mode is enabled, the manager uses NodeRunner to start a local
 * node and routes all balance/tx/history queries through the local node's
 * REST API (localhost:1317). If the local node isn't available, it falls
 * back to connecting to a peer's REST API.
 *
 * Auto-discovers peers via mDNS and connects to their REST endpoints.
 */

import { NodeRunner, nodeRunner, type NodeConfig } from '../../p2p/nodeRunner';

// ─── Types ───

export interface P2PConfig {
  /** Bootstrap peer addresses: "ip:port" or "peerID@ip:port" */
  bootstrapPeers: string[];
  /** Enable mDNS for local network peer discovery (testing) */
  enableMDNS: boolean;
  /** CometBFT chain ID */
  chainID: string;
  /** Local data directory for node state */
  dataDir: string;
  /** WebSocket port for CometBFT RPC (default 26657) */
  wsPort?: number;
  /** If true, start a local node via NodeRunner on start() */
  useLocalNode?: boolean;
  /** Validator key for local node (if this phone is a validator) */
  validatorKey?: string;
}

export interface PeerInfo {
  id: string;
  address: string;
  latency: number;
  lastSeen: number;
}

interface BlockHeader {
  height: number;
  hash: string;
  time: string;
  proposer: string;
  numTxs: number;
}

type EventCallback<T> = (data: T) => void;

// ─── P2P Manager ───

export class P2PManager {
  private started = false;
  private peerId: string = '';
  private peers: Map<string, PeerInfo> = new Map();
  private sockets: Map<string, WebSocket> = new Map();
  private latestHeight = 0;
  private config: P2PConfig | null = null;
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private mdnsTimer: ReturnType<typeof setInterval> | null = null;

  // NodeRunner integration — manages the embedded local node
  private localNodeRunner: NodeRunner = nodeRunner;
  private localNodeActive = false;
  private nodeBlockUnsub: (() => void) | null = null;

  // Event listeners
  private blockListeners: EventCallback<BlockHeader>[] = [];
  private peerListeners: EventCallback<PeerInfo[]>[] = [];
  private txListeners: EventCallback<{ hash: string; height: number }>[] = [];

  // ─── Lifecycle ───

  async start(config: P2PConfig): Promise<string> {
    if (this.started) {
      throw new Error('P2P manager already running');
    }

    this.config = config;
    // Generate a local peer ID (in production, derived from node key)
    this.peerId = `ow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // Start local node via NodeRunner if requested (P2P mode)
    if (config.useLocalNode !== false) {
      try {
        const nodeConfig: NodeConfig = {
          chainId: config.chainID,
          validatorKey: config.validatorKey,
          bootstrapPeers: config.bootstrapPeers,
          enableMDNS: config.enableMDNS,
        };
        await this.localNodeRunner.start(nodeConfig);
        this.localNodeActive = true;

        // Use the node's peer ID if available
        const nodeStatus = this.localNodeRunner.getStatus();
        if (nodeStatus.peerId) {
          this.peerId = nodeStatus.peerId;
        }

        // Subscribe to blocks from the local node
        this.nodeBlockUnsub = this.localNodeRunner.onNewBlock((height) => {
          if (height > this.latestHeight) {
            this.latestHeight = height;
          }
          const header: BlockHeader = {
            height,
            hash: '',
            time: new Date().toISOString(),
            proposer: '',
            numTxs: 0,
          };
          for (const listener of this.blockListeners) {
            try { listener(header); } catch { /* listener error */ }
          }
        });
      } catch {
        // Local node failed to start; continue with peer connections
        this.localNodeActive = false;
      }
    }

    // Connect to bootstrap peers (WebSocket connections for direct RPC)
    for (const peer of config.bootstrapPeers) {
      this.connectToPeer(peer);
    }

    // Start mDNS discovery if enabled (for local network testing)
    if (config.enableMDNS) {
      this.startMDNSDiscovery();
    }

    this.started = true;
    return this.peerId;
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Stop local node if we started it
    if (this.localNodeActive) {
      if (this.nodeBlockUnsub) {
        this.nodeBlockUnsub();
        this.nodeBlockUnsub = null;
      }
      await this.localNodeRunner.stop();
      this.localNodeActive = false;
    }

    // Close all WebSocket connections
    for (const [id, ws] of this.sockets) {
      ws.close(1000, 'P2P manager stopping');
      this.sockets.delete(id);
    }

    // Clear reconnect timers
    for (const [, timer] of this.reconnectTimers) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    // Stop mDNS
    if (this.mdnsTimer) {
      clearInterval(this.mdnsTimer);
      this.mdnsTimer = null;
    }

    this.peers.clear();
    this.started = false;
    this.notifyPeerUpdate();
  }

  isRunning(): boolean {
    return this.started;
  }

  getPeerId(): string {
    return this.peerId;
  }

  // ─── Peer Management ───

  async getPeers(): Promise<PeerInfo[]> {
    return Array.from(this.peers.values());
  }

  async addPeer(address: string): Promise<void> {
    if (!this.started) throw new Error('P2P manager not running');
    this.connectToPeer(address);
  }

  async removePeer(peerId: string): Promise<void> {
    const ws = this.sockets.get(peerId);
    if (ws) {
      ws.close(1000, 'Peer removed');
      this.sockets.delete(peerId);
    }
    this.peers.delete(peerId);
    const timer = this.reconnectTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(peerId);
    }
    this.notifyPeerUpdate();
  }

  // ─── Chain Queries (via connected peers) ───

  async broadcastTransaction(txHex: string): Promise<void> {
    // Prefer local node for broadcast (direct mempool insertion)
    if (this.localNodeActive) {
      try {
        await this.localNodeRunner.broadcastTx(txHex);
        return;
      } catch {
        // Fall through to peer broadcast
      }
    }

    const ws = this.getBestPeer();
    if (!ws) throw new Error('No connected peers');

    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'broadcast_tx_sync',
      params: { tx: txHex },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Broadcast timeout')), 10_000);
      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.id === request.id) {
            clearTimeout(timeout);
            ws.removeEventListener('message', handler);
            if (data.error) {
              reject(new Error(data.error.message ?? 'Broadcast failed'));
            } else if (data.result?.code !== 0) {
              reject(new Error(data.result?.log ?? 'Transaction rejected'));
            } else {
              resolve();
            }
          }
        } catch { /* ignore parse errors from other messages */ }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify(request));
    });
  }

  async getLatestHeight(): Promise<number> {
    // Check local node first
    if (this.localNodeActive) {
      const nodeStatus = this.localNodeRunner.getStatus();
      if (nodeStatus.latestBlock > 0) {
        this.latestHeight = nodeStatus.latestBlock;
        return this.latestHeight;
      }
    }

    if (this.latestHeight > 0) return this.latestHeight;

    const ws = this.getBestPeer();
    if (!ws) return 0;

    return this.rpcCall(ws, 'status', {}).then((result) => {
      const height = parseInt(result?.sync_info?.latest_block_height ?? '0', 10);
      this.latestHeight = height;
      return height;
    }).catch(() => 0);
  }

  async getBlockHeader(height: number): Promise<BlockHeader | null> {
    const ws = this.getBestPeer();
    if (!ws) return null;

    try {
      const result = await this.rpcCall(ws, 'block', { height: String(height) });
      const header = result?.block?.header;
      if (!header) return null;

      return {
        height: parseInt(header.height, 10),
        hash: result.block_id?.hash ?? '',
        time: header.time,
        proposer: header.proposer_address,
        numTxs: parseInt(header.num_txs ?? '0', 10),
      };
    } catch {
      return null;
    }
  }

  async getAccountBalance(address: string): Promise<{ denom: string; amount: string }[]> {
    // Prefer local node REST if active
    if (this.localNodeActive) {
      try {
        const restBase = this.localNodeRunner.getRestBase();
        const res = await fetch(
          `${restBase}/cosmos/bank/v1beta1/balances/${address}`,
          { signal: AbortSignal.timeout(8_000) }
        );
        if (res.ok) {
          const data = await res.json();
          return data.balances ?? [];
        }
      } catch {
        // Fall through to peer query
      }
    }

    // Fall back to peer REST endpoints
    const peerAddress = this.getBestPeerAddress();
    if (peerAddress) {
      const data = await this.queryAccountViaREST(address, peerAddress);
      if (data?.balances) return data.balances;
    }

    // Last resort: WebSocket ABCI query
    const ws = this.getBestPeer();
    if (!ws) return [];

    try {
      const result = await this.rpcCall(ws, 'abci_query', {
        path: `/cosmos.bank.v1beta1.Query/AllBalances`,
        data: '',
        height: '0',
        prove: false,
      });
      // In production, decode protobuf response
      return [];
    } catch {
      return [];
    }
  }

  async queryAccountViaREST(address: string, peerAddress?: string): Promise<any> {
    // Try local node REST first if active
    if (this.localNodeActive) {
      try {
        const restBase = this.localNodeRunner.getRestBase();
        const response = await fetch(
          `${restBase}/cosmos/bank/v1beta1/balances/${address}`,
          { signal: AbortSignal.timeout(8_000) }
        );
        if (response.ok) return response.json();
      } catch {
        // Fall through to peer
      }
    }

    if (!peerAddress) return null;

    // Direct REST query to peer's CometBFT REST endpoint (port 1317)
    const restBase = peerAddress.replace(/:\d+$/, ':1317');
    try {
      const response = await fetch(
        `http://${restBase}/cosmos/bank/v1beta1/balances/${address}`,
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  async queryTxHistoryViaREST(address: string, peerAddress?: string, limit: number = 20): Promise<any> {
    // Build the REST base — prefer local node, then peer
    let restBase: string | null = null;

    if (this.localNodeActive) {
      restBase = this.localNodeRunner.getRestBase();
    }

    if (!restBase && peerAddress) {
      restBase = `http://${peerAddress.replace(/:\d+$/, ':1317')}`;
    }

    // Also try discovered peers from the node runner
    if (!restBase) {
      const discovered = this.localNodeRunner.getPeerAddresses();
      for (const addr of discovered) {
        const host = addr.includes(':') ? addr.split(':')[0] : addr;
        restBase = `http://${host}:1317`;
        break; // Use first available
      }
    }

    if (!restBase) return null;

    try {
      const sentUrl = `${restBase}/cosmos/tx/v1beta1/txs?events=transfer.sender%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;
      const recvUrl = `${restBase}/cosmos/tx/v1beta1/txs?events=transfer.recipient%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;

      const [sentRes, recvRes] = await Promise.all([
        fetch(sentUrl, { signal: AbortSignal.timeout(8_000) }),
        fetch(recvUrl, { signal: AbortSignal.timeout(8_000) }),
      ]);

      return {
        sent: sentRes.ok ? await sentRes.json() : null,
        received: recvRes.ok ? await recvRes.json() : null,
      };
    } catch {
      return null;
    }
  }

  // ─── Event Subscriptions ───

  onNewBlock(callback: EventCallback<BlockHeader>): () => void {
    this.blockListeners.push(callback);
    return () => {
      this.blockListeners = this.blockListeners.filter((cb) => cb !== callback);
    };
  }

  onPeerUpdate(callback: EventCallback<PeerInfo[]>): () => void {
    this.peerListeners.push(callback);
    return () => {
      this.peerListeners = this.peerListeners.filter((cb) => cb !== callback);
    };
  }

  onNewTransaction(callback: EventCallback<{ hash: string; height: number }>): () => void {
    this.txListeners.push(callback);
    return () => {
      this.txListeners = this.txListeners.filter((cb) => cb !== callback);
    };
  }

  // ─── Private: Connection Logic ───

  private connectToPeer(address: string): void {
    // Parse address: could be "ip:port" or "peerId@ip:port"
    const parts = address.split('@');
    const hostPort = parts.length > 1 ? parts[1] : parts[0];
    const peerId = parts.length > 1 ? parts[0] : hostPort;
    const wsPort = this.config?.wsPort ?? 26657;

    // Ensure we have host:port format
    const wsAddress = hostPort.includes(':') ? hostPort : `${hostPort}:${wsPort}`;
    const wsUrl = `ws://${wsAddress}/websocket`;

    if (this.sockets.has(peerId)) return; // Already connected

    try {
      const ws = new WebSocket(wsUrl);
      const connectStart = Date.now();

      ws.onopen = () => {
        const latency = Date.now() - connectStart;
        const peerInfo: PeerInfo = {
          id: peerId,
          address: wsAddress,
          latency,
          lastSeen: Date.now(),
        };
        this.peers.set(peerId, peerInfo);
        this.sockets.set(peerId, ws);
        this.notifyPeerUpdate();

        // Subscribe to new blocks
        this.subscribeToBlocks(ws, peerId);
      };

      ws.onmessage = (event) => {
        this.handleMessage(peerId, event);
      };

      ws.onerror = () => {
        // Will trigger onclose
      };

      ws.onclose = () => {
        this.sockets.delete(peerId);
        this.peers.delete(peerId);
        this.notifyPeerUpdate();

        // Reconnect after delay (if still running)
        if (this.started) {
          const timer = setTimeout(() => {
            this.reconnectTimers.delete(peerId);
            this.connectToPeer(address);
          }, 5_000);
          this.reconnectTimers.set(peerId, timer);
        }
      };
    } catch {
      // WebSocket construction failed; schedule retry
      if (this.started) {
        const timer = setTimeout(() => {
          this.reconnectTimers.delete(peerId);
          this.connectToPeer(address);
        }, 5_000);
        this.reconnectTimers.set(peerId, timer);
      }
    }
  }

  private subscribeToBlocks(ws: WebSocket, _peerId: string): void {
    const request = {
      jsonrpc: '2.0',
      id: 'block-sub',
      method: 'subscribe',
      params: { query: "tm.event='NewBlock'" },
    };
    ws.send(JSON.stringify(request));
  }

  private handleMessage(peerId: string, event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string);

      // Update peer last seen
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.lastSeen = Date.now();
      }

      // Handle new block events
      if (data.result?.data?.type === 'tendermint/event/NewBlock') {
        const block = data.result.data.value?.block;
        if (block?.header) {
          const header: BlockHeader = {
            height: parseInt(block.header.height, 10),
            hash: data.result.data.value?.block_id?.hash ?? '',
            time: block.header.time,
            proposer: block.header.proposer_address,
            numTxs: parseInt(block.header.num_txs ?? '0', 10),
          };

          if (header.height > this.latestHeight) {
            this.latestHeight = header.height;
          }

          for (const listener of this.blockListeners) {
            try { listener(header); } catch { /* listener error */ }
          }
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private async rpcCall(ws: WebSocket, method: string, params: Record<string, any>): Promise<any> {
    const id = Date.now() + Math.random();
    const request = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.removeEventListener('message', handler);
        reject(new Error(`RPC timeout: ${method}`));
      }, 8_000);

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.id === id) {
            clearTimeout(timeout);
            ws.removeEventListener('message', handler);
            if (data.error) {
              reject(new Error(data.error.message));
            } else {
              resolve(data.result);
            }
          }
        } catch { /* ignore */ }
      };

      ws.addEventListener('message', handler);
      ws.send(JSON.stringify(request));
    });
  }

  private getBestPeer(): WebSocket | null {
    // Return the socket with lowest latency
    let bestPeer: PeerInfo | null = null;
    for (const peer of this.peers.values()) {
      if (!bestPeer || peer.latency < bestPeer.latency) {
        bestPeer = peer;
      }
    }
    return bestPeer ? this.sockets.get(bestPeer.id) ?? null : null;
  }

  /** Get the address of the best connected peer */
  getBestPeerAddress(): string | null {
    let bestPeer: PeerInfo | null = null;
    for (const peer of this.peers.values()) {
      if (!bestPeer || peer.latency < bestPeer.latency) {
        bestPeer = peer;
      }
    }
    return bestPeer?.address ?? null;
  }

  private notifyPeerUpdate(): void {
    const peerList = Array.from(this.peers.values());
    for (const listener of this.peerListeners) {
      try { listener(peerList); } catch { /* listener error */ }
    }
  }

  /** Whether the local embedded node is active */
  isLocalNodeActive(): boolean {
    return this.localNodeActive;
  }

  /** Get the NodeRunner instance for direct access */
  getNodeRunner(): NodeRunner {
    return this.localNodeRunner;
  }

  private startMDNSDiscovery(): void {
    // mDNS discovery for local network testing.
    // In production, this uses react-native-zeroconf to browse for
    // _openchain._tcp services on the local WiFi network.
    //
    // For the 10-phone testnet, each phone advertises:
    //   Service: _openchain._tcp
    //   Port: 26657 (RPC), 1317 (REST), 26656 (P2P)
    //   TXT: chainId=openchain-testnet-1, peerId=<id>
    //
    // Discovery flow:
    //   1. Browse _openchain._tcp every 10s
    //   2. For each discovered service, extract IP
    //   3. Attempt WebSocket connection to <IP>:26657
    //   4. Add to peers map
    //
    // Placeholder: uses NodeRunner's peer discovery (via net_info RPC)
    // to transitively find peers on the local network.
    this.mdnsTimer = setInterval(async () => {
      if (!this.localNodeActive) return;

      // Pull discovered peers from the node runner
      const discoveredAddresses = this.localNodeRunner.getPeerAddresses();
      for (const addr of discoveredAddresses) {
        // Check if we already have a connection to this peer
        const host = addr.includes(':') ? addr.split(':')[0] : addr;
        const alreadyConnected = Array.from(this.peers.values()).some(
          (p) => p.address.startsWith(host)
        );
        if (!alreadyConnected) {
          this.connectToPeer(addr);
        }
      }
    }, 10_000);
  }
}

// Singleton
export const p2pManager = new P2PManager();
