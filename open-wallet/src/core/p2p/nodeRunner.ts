/**
 * P2P Node Runner — orchestrates the full embedded Open Chain node lifecycle.
 *
 * Manages starting/stopping the local CometBFT node, querying balances and
 * broadcasting transactions through the local node, and subscribing to new
 * blocks for real-time updates.
 *
 * Connection strategy (in order of preference):
 *   1. Local node at ws://localhost:26657 (phone runs openchaind)
 *   2. Peer node at ws://<peer-ip>:26657 (connected via mDNS or bootstrap)
 *
 * When gomobile bindings are compiled, start() will invoke the native bridge
 * instead of expecting an external process. Until then, each phone runs
 * `openchaind start` and this class connects via WebSocket + REST.
 */

// ─── Types ───

export interface NodeConfig {
  chainId: string;
  validatorKey?: string;
  bootstrapPeers: string[];
  enableMDNS: boolean;
  /** REST API port (default 1317) */
  restPort?: number;
  /** WebSocket RPC port (default 26657) */
  rpcPort?: number;
  /** gRPC port (default 9090) */
  grpcPort?: number;
}

export interface NodeStatus {
  running: boolean;
  peerId: string;
  connectedPeers: number;
  latestBlock: number;
  syncing: boolean;
  isValidator: boolean;
  chainId: string;
}

export interface BlockInfo {
  height: number;
  hash: string;
  time: string;
  proposer: string;
  numTxs: number;
  appHash: string;
}

type BlockCallback = (height: number) => void;

// ─── Node Runner ───

export class NodeRunner {
  private status: NodeStatus = {
    running: false,
    peerId: '',
    connectedPeers: 0,
    latestBlock: 0,
    syncing: false,
    isValidator: false,
    chainId: '',
  };

  private config: NodeConfig | null = null;
  private ws: WebSocket | null = null;
  private blockCallbacks: BlockCallback[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private statusPollTimer: ReturnType<typeof setInterval> | null = null;
  private peerAddresses: string[] = [];
  private mdnsDiscoveryTimer: ReturnType<typeof setInterval> | null = null;

  // REST base URL for the local or best-available node
  private restBase: string = '';

  // ─── Lifecycle ───

  /**
   * Start the P2P node. Connects to local CometBFT via WebSocket.
   * For the 10-phone testnet, each phone runs `openchaind start` and
   * this method connects to it on localhost.
   */
  async start(config: NodeConfig): Promise<void> {
    if (this.status.running) {
      throw new Error('Node is already running');
    }

    this.config = config;
    const rpcPort = config.rpcPort ?? 26657;
    const restPort = config.restPort ?? 1317;

    this.status.chainId = config.chainId;
    this.status.isValidator = !!config.validatorKey;

    // Try local node first, then fall back to peers
    const localWsUrl = `ws://localhost:${rpcPort}/websocket`;
    this.restBase = `http://localhost:${restPort}`;

    // Store peer addresses for fallback
    this.peerAddresses = [...config.bootstrapPeers];

    const connected = await this.tryConnect(localWsUrl);
    if (!connected) {
      // Try each bootstrap peer until one works
      let peerConnected = false;
      for (const peer of config.bootstrapPeers) {
        const hostPort = peer.includes('@') ? peer.split('@')[1] : peer;
        const host = hostPort.includes(':') ? hostPort.split(':')[0] : hostPort;
        const peerWsUrl = `ws://${host}:${rpcPort}/websocket`;
        this.restBase = `http://${host}:${restPort}`;

        peerConnected = await this.tryConnect(peerWsUrl);
        if (peerConnected) break;
      }

      if (!peerConnected) {
        // No node available yet — start in waiting mode.
        // The node will keep trying to connect in the background.
        this.status.running = true;
        this.status.syncing = true;
        this.startReconnectLoop();
        return;
      }
    }

    this.status.running = true;

    // Fetch initial status
    await this.refreshStatus();

    // Subscribe to new blocks via WebSocket
    this.subscribeToBlocks();

    // Poll status periodically to track peers and sync state
    this.statusPollTimer = setInterval(() => {
      this.refreshStatus().catch(() => {});
    }, 10_000);

    // Start mDNS discovery if enabled
    if (config.enableMDNS) {
      this.startMDNSDiscovery();
    }
  }

  /**
   * Stop the node gracefully. Disconnects WebSocket, stops polling.
   */
  async stop(): Promise<void> {
    if (!this.status.running) return;

    if (this.ws) {
      this.ws.close(1000, 'Node stopping');
      this.ws = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }

    if (this.mdnsDiscoveryTimer) {
      clearInterval(this.mdnsDiscoveryTimer);
      this.mdnsDiscoveryTimer = null;
    }

    this.status = {
      running: false,
      peerId: '',
      connectedPeers: 0,
      latestBlock: 0,
      syncing: false,
      isValidator: false,
      chainId: '',
    };

    this.blockCallbacks = [];
  }

  /**
   * Get current node status snapshot.
   */
  getStatus(): NodeStatus {
    return { ...this.status };
  }

  // ─── Chain Queries (via local REST API) ───

  /**
   * Query balance from the local node's REST API.
   * Goes to localhost:1317 or the connected peer's REST endpoint.
   */
  async getBalance(address: string, denom: string): Promise<number> {
    const url = `${this.restBase}/cosmos/bank/v1beta1/balances/${address}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return 0;

      const data = await res.json();
      const coin = data.balances?.find((b: any) => b.denom === denom);
      return coin ? parseInt(coin.amount, 10) : 0;
    } catch {
      // Try fallback peer REST endpoints
      return this.getBalanceFromPeer(address, denom);
    }
  }

  /**
   * Broadcast a transaction through the local node's mempool.
   * Uses the broadcast_tx_sync RPC method via WebSocket.
   */
  async broadcastTx(txBytes: string): Promise<string> {
    // Try WebSocket RPC first (faster, direct mempool insertion)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.wsBroadcast(txBytes);
    }

    // Fall back to REST broadcast
    const url = `${this.restBase}/cosmos/tx/v1beta1/txs`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_bytes: txBytes,
        mode: 'BROADCAST_MODE_SYNC',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`Broadcast failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.tx_response?.code !== 0) {
      throw new Error(data.tx_response?.raw_log ?? 'Transaction rejected');
    }

    return data.tx_response.txhash;
  }

  /**
   * Subscribe to new block notifications.
   * Returns an unsubscribe function.
   */
  onNewBlock(callback: BlockCallback): () => void {
    this.blockCallbacks.push(callback);
    return () => {
      this.blockCallbacks = this.blockCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get block data at a specific height.
   */
  async getBlock(height: number): Promise<BlockInfo | null> {
    const url = `${this.restBase}/cosmos/base/tendermint/v1beta1/blocks/${height}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return null;

      const data = await res.json();
      const header = data.block?.header;
      if (!header) return null;

      return {
        height: parseInt(header.height, 10),
        hash: data.block_id?.hash ?? '',
        time: header.time,
        proposer: header.proposer_address ?? '',
        numTxs: data.block?.data?.txs?.length ?? 0,
        appHash: header.app_hash ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the REST base URL for direct REST queries by the provider layer.
   */
  getRestBase(): string {
    return this.restBase;
  }

  /**
   * Get all known peer addresses (bootstrap + mDNS discovered).
   */
  getPeerAddresses(): string[] {
    return [...this.peerAddresses];
  }

  // ─── Private: WebSocket Connection ───

  private tryConnect(wsUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5_000);

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          clearTimeout(timeout);
          this.ws = ws;
          this.setupWebSocketHandlers(ws);
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  private setupWebSocketHandlers(ws: WebSocket): void {
    ws.onmessage = (event) => {
      this.handleWsMessage(event);
    };

    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null;
      }
      // Reconnect if still supposed to be running
      if (this.status.running) {
        this.startReconnectLoop();
      }
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }

  private handleWsMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string);

      // Handle new block events from subscription
      if (data.result?.data?.type === 'tendermint/event/NewBlock') {
        const block = data.result.data.value?.block;
        if (block?.header) {
          const height = parseInt(block.header.height, 10);
          if (height > this.status.latestBlock) {
            this.status.latestBlock = height;
            this.status.syncing = false;
          }
          for (const cb of this.blockCallbacks) {
            try { cb(height); } catch { /* listener error */ }
          }
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private subscribeToBlocks(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const request = {
      jsonrpc: '2.0',
      id: 'node-block-sub',
      method: 'subscribe',
      params: { query: "tm.event='NewBlock'" },
    };
    this.ws.send(JSON.stringify(request));
  }

  private startReconnectLoop(): void {
    if (this.reconnectTimer) return; // Already reconnecting

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.status.running || this.ws) return;

      const rpcPort = this.config?.rpcPort ?? 26657;

      // Try local first
      let connected = await this.tryConnect(`ws://localhost:${rpcPort}/websocket`);
      if (connected) {
        const restPort = this.config?.restPort ?? 1317;
        this.restBase = `http://localhost:${restPort}`;
        await this.refreshStatus().catch(() => {});
        this.subscribeToBlocks();
        return;
      }

      // Try peers
      for (const peer of this.peerAddresses) {
        const hostPort = peer.includes('@') ? peer.split('@')[1] : peer;
        const host = hostPort.includes(':') ? hostPort.split(':')[0] : hostPort;
        connected = await this.tryConnect(`ws://${host}:${rpcPort}/websocket`);
        if (connected) {
          const restPort = this.config?.restPort ?? 1317;
          this.restBase = `http://${host}:${restPort}`;
          await this.refreshStatus().catch(() => {});
          this.subscribeToBlocks();
          return;
        }
      }

      // Still no connection — retry
      if (this.status.running) {
        this.startReconnectLoop();
      }
    }, 5_000);
  }

  // ─── Private: WebSocket RPC Broadcast ───

  private wsBroadcast(txBytes: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = Date.now() + Math.random();
      const request = {
        jsonrpc: '2.0',
        id,
        method: 'broadcast_tx_sync',
        params: { tx: txBytes },
      };

      const timeout = setTimeout(() => {
        this.ws?.removeEventListener('message', handler);
        reject(new Error('Broadcast timeout'));
      }, 10_000);

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.id === id) {
            clearTimeout(timeout);
            this.ws?.removeEventListener('message', handler);
            if (data.error) {
              reject(new Error(data.error.message ?? 'Broadcast failed'));
            } else if (data.result?.code !== 0) {
              reject(new Error(data.result?.log ?? 'Transaction rejected'));
            } else {
              resolve(data.result?.hash ?? '');
            }
          }
        } catch { /* ignore */ }
      };

      this.ws.addEventListener('message', handler);
      this.ws.send(JSON.stringify(request));
    });
  }

  // ─── Private: Status Polling ───

  private async refreshStatus(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const result = await this.wsRpcCall('status', {});
      if (result) {
        this.status.peerId = result.node_info?.id ?? this.status.peerId;
        this.status.latestBlock = parseInt(
          result.sync_info?.latest_block_height ?? '0', 10
        );
        this.status.syncing = result.sync_info?.catching_up ?? false;
      }
    } catch {
      // Status poll failed; non-critical
    }

    // Get peer count via net_info
    try {
      const netResult = await this.wsRpcCall('net_info', {});
      if (netResult) {
        this.status.connectedPeers = parseInt(netResult.n_peers ?? '0', 10);

        // Track discovered peer addresses
        const peers = netResult.peers ?? [];
        for (const p of peers) {
          const addr = p.remote_ip
            ? `${p.remote_ip}:${this.config?.rpcPort ?? 26657}`
            : null;
          if (addr && !this.peerAddresses.includes(addr)) {
            this.peerAddresses.push(addr);
          }
        }
      }
    } catch {
      // Non-critical
    }
  }

  private wsRpcCall(method: string, params: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = Date.now() + Math.random();
      const request = { jsonrpc: '2.0', id, method, params };

      const timeout = setTimeout(() => {
        this.ws?.removeEventListener('message', handler);
        reject(new Error(`RPC timeout: ${method}`));
      }, 8_000);

      const handler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.id === id) {
            clearTimeout(timeout);
            this.ws?.removeEventListener('message', handler);
            if (data.error) {
              reject(new Error(data.error.message));
            } else {
              resolve(data.result);
            }
          }
        } catch { /* ignore */ }
      };

      this.ws.addEventListener('message', handler);
      this.ws.send(JSON.stringify(request));
    });
  }

  // ─── Private: Peer Fallback ───

  private async getBalanceFromPeer(address: string, denom: string): Promise<number> {
    for (const peer of this.peerAddresses) {
      const hostPort = peer.includes('@') ? peer.split('@')[1] : peer;
      const host = hostPort.includes(':') ? hostPort.split(':')[0] : hostPort;
      const restPort = this.config?.restPort ?? 1317;
      const url = `http://${host}:${restPort}/cosmos/bank/v1beta1/balances/${address}`;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
        if (!res.ok) continue;

        const data = await res.json();
        const coin = data.balances?.find((b: any) => b.denom === denom);
        if (coin) return parseInt(coin.amount, 10);
      } catch {
        continue;
      }
    }
    return 0;
  }

  // ─── Private: mDNS Discovery ───

  private startMDNSDiscovery(): void {
    // mDNS discovery for local WiFi network.
    // In production, this uses react-native-zeroconf to discover
    // _openchain._tcp services. For the 10-phone testnet, devices
    // advertise their CometBFT RPC endpoint via mDNS.
    //
    // Discovery flow:
    //   1. Browse for _openchain._tcp services
    //   2. For each found service, extract IP and port
    //   3. Add to peerAddresses and attempt WebSocket connection
    //
    // Placeholder: polls net_info to discover peers transitively.
    this.mdnsDiscoveryTimer = setInterval(() => {
      this.refreshStatus().catch(() => {});
    }, 15_000);
  }
}

// Singleton instance
export const nodeRunner = new NodeRunner();
