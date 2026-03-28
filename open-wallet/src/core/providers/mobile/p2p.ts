/**
 * P2P Connection Manager — connects to Open Chain peers directly.
 * No central server. Uses WebSocket connections to CometBFT nodes
 * running on peer phones.
 *
 * Architecture:
 *   Each phone runs CometBFT → exposes WebSocket on port 26657 →
 *   other phones connect directly to that IP:port. No central server.
 *
 * This is a WebSocket-based P2P simulation that connects to CometBFT's
 * WebSocket RPC directly on each peer's IP. When gomobile bindings are
 * compiled, this will switch to the embedded CometBFT node via native bridge.
 */

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

    // Connect to bootstrap peers
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
    const ws = this.getBestPeer();
    if (!ws) return [];

    try {
      const result = await this.rpcCall(ws, 'abci_query', {
        path: `/cosmos.bank.v1beta1.Query/AllBalances`,
        data: '', // Would need protobuf encoding in production
        height: '0',
        prove: false,
      });
      // In production, decode protobuf response
      // For now, fall back to REST query on the same peer
      return [];
    } catch {
      return [];
    }
  }

  async queryAccountViaREST(address: string, peerAddress: string): Promise<any> {
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

  async queryTxHistoryViaREST(address: string, peerAddress: string, limit: number = 20): Promise<any> {
    const restBase = peerAddress.replace(/:\d+$/, ':1317');
    try {
      const sentUrl = `http://${restBase}/cosmos/tx/v1beta1/txs?events=transfer.sender%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;
      const recvUrl = `http://${restBase}/cosmos/tx/v1beta1/txs?events=transfer.recipient%3D%27${address}%27&pagination.limit=${limit}&order_by=ORDER_BY_DESC`;

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

  private startMDNSDiscovery(): void {
    // mDNS discovery simulation for local network testing.
    // In production, this would use react-native-zeroconf or the
    // gomobile bridge to discover peers on the local network.
    // For now, it's a no-op placeholder that logs intent.
    this.mdnsTimer = setInterval(() => {
      // Would broadcast mDNS query for _openchain._tcp service
      // and auto-connect to discovered peers
    }, 10_000);
  }
}

// Singleton
export const p2pManager = new P2PManager();
