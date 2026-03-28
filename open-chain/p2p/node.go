package p2p

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"sync"
	"time"
)

// Node is the core P2P networking node using standard TCP connections.
type Node struct {
	config   NodeConfig
	id       string
	listener net.Listener

	mu    sync.RWMutex
	peers map[string]*peerConn // id -> connection
	subs  map[string][]func([]byte)

	mempool *Mempool
	syncer  *Syncer

	discovery *Discovery

	stopCh chan struct{}
	wg     sync.WaitGroup
}

// peerConn wraps a TCP connection to a remote peer.
type peerConn struct {
	info    PeerInfo
	conn    net.Conn
	encoder *json.Encoder
	decoder *json.Decoder
	mu      sync.Mutex
	stopCh  chan struct{}
}

// NewNode creates a new P2P node with the given configuration.
func NewNode(config NodeConfig) (*Node, error) {
	if config.MaxPeers <= 0 {
		config.MaxPeers = 50
	}
	if config.ChainID == "" {
		config.ChainID = "openchain-testnet-1"
	}

	// Generate a random node ID.
	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return nil, fmt.Errorf("failed to generate node ID: %w", err)
	}
	nodeID := hex.EncodeToString(idBytes)

	n := &Node{
		config: config,
		id:     nodeID,
		peers:  make(map[string]*peerConn),
		subs:   make(map[string][]func([]byte)),
		stopCh: make(chan struct{}),
	}

	n.mempool = NewMempool(10000) // 10k tx capacity
	n.syncer = NewSyncer(n)

	if config.EnableMDNS || config.EnableDHT {
		n.discovery = NewDiscovery(n, config)
	}

	return n, nil
}

// Start begins listening for connections and starts peer discovery.
func (n *Node) Start() error {
	addr := "0.0.0.0:26656"
	if len(n.config.ListenAddrs) > 0 {
		addr = n.config.ListenAddrs[0]
	}

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", addr, err)
	}
	n.listener = ln
	log.Printf("[p2p] Node %s listening on %s (chain: %s)", n.id[:8], addr, n.config.ChainID)

	// Accept incoming connections.
	n.wg.Add(1)
	go n.acceptLoop()

	// Connect to bootstrap peers.
	for _, bp := range n.config.BootstrapPeers {
		go n.connectToPeer(bp)
	}

	// Start discovery.
	if n.discovery != nil {
		n.wg.Add(1)
		go func() {
			defer n.wg.Done()
			n.discovery.Start()
		}()
	}

	// Periodic peer maintenance.
	n.wg.Add(1)
	go n.peerMaintenance()

	return nil
}

// Stop gracefully shuts down the node.
func (n *Node) Stop() error {
	close(n.stopCh)

	if n.listener != nil {
		n.listener.Close()
	}

	if n.discovery != nil {
		n.discovery.Stop()
	}

	n.mu.Lock()
	for _, p := range n.peers {
		p.conn.Close()
	}
	n.mu.Unlock()

	n.wg.Wait()
	log.Printf("[p2p] Node %s stopped", n.id[:8])
	return nil
}

// BroadcastTx gossips a transaction to all connected peers.
func (n *Node) BroadcastTx(txBytes []byte) error {
	// Add to local mempool first.
	txHash := sha256Hash(txBytes)
	n.mempool.Add(txHash, txBytes)

	msg := Message{
		Type:      MsgTransaction,
		Topic:     "tx",
		Payload:   txBytes,
		From:      n.id,
		Timestamp: time.Now().UnixMilli(),
	}
	return n.broadcast(msg)
}

// BroadcastBlock gossips a block header to all connected peers.
func (n *Node) BroadcastBlock(blockBytes []byte) error {
	msg := Message{
		Type:      MsgBlockHeader,
		Topic:     "block",
		Payload:   blockBytes,
		From:      n.id,
		Timestamp: time.Now().UnixMilli(),
	}
	return n.broadcast(msg)
}

// Subscribe registers a handler for messages on a given topic.
func (n *Node) Subscribe(topic string, handler func([]byte)) error {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.subs[topic] = append(n.subs[topic], handler)
	return nil
}

// ConnectedPeers returns information about all connected peers.
func (n *Node) ConnectedPeers() []PeerInfo {
	n.mu.RLock()
	defer n.mu.RUnlock()

	peers := make([]PeerInfo, 0, len(n.peers))
	for _, p := range n.peers {
		peers = append(peers, p.info)
	}
	return peers
}

// ID returns this node's peer ID.
func (n *Node) ID() string {
	return n.id
}

// PeerCount returns the number of connected peers.
func (n *Node) PeerCount() int {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return len(n.peers)
}

// --- internal methods ---

func (n *Node) acceptLoop() {
	defer n.wg.Done()
	for {
		conn, err := n.listener.Accept()
		if err != nil {
			select {
			case <-n.stopCh:
				return
			default:
				log.Printf("[p2p] Accept error: %v", err)
				continue
			}
		}
		go n.handleIncoming(conn)
	}
}

func (n *Node) handleIncoming(conn net.Conn) {
	pc := &peerConn{
		conn:    conn,
		encoder: json.NewEncoder(conn),
		decoder: json.NewDecoder(conn),
		stopCh:  make(chan struct{}),
	}

	// Perform handshake: receive peer info.
	var hello Message
	if err := pc.decoder.Decode(&hello); err != nil {
		conn.Close()
		return
	}
	if hello.Type != MsgPeerInfo {
		conn.Close()
		return
	}

	var info PeerInfo
	if err := json.Unmarshal(hello.Payload, &info); err != nil {
		conn.Close()
		return
	}

	// Validate chain ID.
	if info.ChainID != n.config.ChainID {
		log.Printf("[p2p] Rejected peer %s: wrong chain %s", info.ID[:8], info.ChainID)
		conn.Close()
		return
	}

	// Check max peers.
	n.mu.Lock()
	if len(n.peers) >= n.config.MaxPeers {
		n.mu.Unlock()
		conn.Close()
		return
	}
	info.Connected = true
	info.Addr = conn.RemoteAddr().String()
	pc.info = info
	n.peers[info.ID] = pc
	n.mu.Unlock()

	log.Printf("[p2p] Peer connected: %s (%s)", info.ID[:8], info.Addr)

	// Send our info back.
	n.sendHandshake(pc)

	// Read messages.
	n.readLoop(pc)
}

func (n *Node) connectToPeer(addr string) {
	conn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		log.Printf("[p2p] Failed to connect to %s: %v", addr, err)
		return
	}

	pc := &peerConn{
		conn:    conn,
		encoder: json.NewEncoder(conn),
		decoder: json.NewDecoder(conn),
		stopCh:  make(chan struct{}),
	}

	// Send handshake.
	n.sendHandshake(pc)

	// Receive handshake.
	var hello Message
	if err := pc.decoder.Decode(&hello); err != nil {
		conn.Close()
		return
	}

	var info PeerInfo
	if err := json.Unmarshal(hello.Payload, &info); err != nil {
		conn.Close()
		return
	}

	n.mu.Lock()
	if len(n.peers) >= n.config.MaxPeers {
		n.mu.Unlock()
		conn.Close()
		return
	}
	info.Connected = true
	info.Addr = addr
	pc.info = info
	n.peers[info.ID] = pc
	n.mu.Unlock()

	log.Printf("[p2p] Connected to peer: %s (%s)", info.ID[:8], addr)

	n.readLoop(pc)
}

func (n *Node) sendHandshake(pc *peerConn) {
	info := PeerInfo{
		ID:      n.id,
		ChainID: n.config.ChainID,
		Height:  n.syncer.LatestHeight(),
	}
	payload, _ := json.Marshal(info)
	msg := Message{
		Type:      MsgPeerInfo,
		Payload:   payload,
		From:      n.id,
		Timestamp: time.Now().UnixMilli(),
	}
	pc.mu.Lock()
	defer pc.mu.Unlock()
	pc.encoder.Encode(msg)
}

func (n *Node) readLoop(pc *peerConn) {
	defer func() {
		n.removePeer(pc.info.ID)
		pc.conn.Close()
	}()

	for {
		select {
		case <-n.stopCh:
			return
		case <-pc.stopCh:
			return
		default:
		}

		var msg Message
		if err := pc.decoder.Decode(&msg); err != nil {
			return
		}

		if len(msg.Payload) > MaxMessageSize {
			log.Printf("[p2p] Message too large from %s, dropping", pc.info.ID[:8])
			continue
		}

		n.handleMessage(pc, msg)
	}
}

func (n *Node) handleMessage(pc *peerConn, msg Message) {
	switch msg.Type {
	case MsgTransaction:
		txHash := sha256Hash(msg.Payload)
		if n.mempool.Has(txHash) {
			return // already seen
		}
		n.mempool.Add(txHash, msg.Payload)
		n.notifySubscribers("tx", msg.Payload)
		// Re-gossip to other peers (exclude sender).
		n.broadcastExcept(msg, pc.info.ID)

	case MsgBlockHeader:
		n.syncer.HandleBlockHeader(msg.Payload)
		n.notifySubscribers("block", msg.Payload)
		n.broadcastExcept(msg, pc.info.ID)

	case MsgMilestoneAttestation:
		n.notifySubscribers("milestone", msg.Payload)

	case MsgHeaderRequest:
		n.syncer.HandleHeaderRequest(pc, msg.Payload)

	case MsgHeaderResponse:
		n.syncer.HandleHeaderResponse(msg.Payload)

	case MsgPeerExchange:
		n.handlePeerExchange(msg.Payload)
	}
}

func (n *Node) notifySubscribers(topic string, data []byte) {
	n.mu.RLock()
	handlers := n.subs[topic]
	n.mu.RUnlock()

	for _, h := range handlers {
		go h(data)
	}
}

func (n *Node) broadcast(msg Message) error {
	n.mu.RLock()
	defer n.mu.RUnlock()

	for _, p := range n.peers {
		go func(pc *peerConn) {
			pc.mu.Lock()
			defer pc.mu.Unlock()
			pc.encoder.Encode(msg)
		}(p)
	}
	return nil
}

func (n *Node) broadcastExcept(msg Message, excludeID string) {
	n.mu.RLock()
	defer n.mu.RUnlock()

	for id, p := range n.peers {
		if id == excludeID {
			continue
		}
		go func(pc *peerConn) {
			pc.mu.Lock()
			defer pc.mu.Unlock()
			pc.encoder.Encode(msg)
		}(p)
	}
}

func (n *Node) removePeer(id string) {
	n.mu.Lock()
	defer n.mu.Unlock()
	if _, ok := n.peers[id]; ok {
		delete(n.peers, id)
		log.Printf("[p2p] Peer disconnected: %s", id[:8])
	}
}

func (n *Node) handlePeerExchange(data []byte) {
	var peers []PeerInfo
	if err := json.Unmarshal(data, &peers); err != nil {
		return
	}
	for _, p := range peers {
		n.mu.RLock()
		_, exists := n.peers[p.ID]
		count := len(n.peers)
		n.mu.RUnlock()

		if !exists && count < n.config.MaxPeers && p.ID != n.id {
			go n.connectToPeer(p.Addr)
		}
	}
}

func (n *Node) peerMaintenance() {
	defer n.wg.Done()
	ticker := time.NewTicker(PingInterval)
	defer ticker.Stop()

	pexTicker := time.NewTicker(DHTRefreshInterval)
	defer pexTicker.Stop()

	for {
		select {
		case <-n.stopCh:
			return
		case <-ticker.C:
			// Ping all peers to check liveness (send peer info update).
			n.mu.RLock()
			for _, p := range n.peers {
				go n.sendHandshake(p)
			}
			n.mu.RUnlock()
		case <-pexTicker.C:
			// Peer exchange: share our peer list with all peers.
			n.sharePeerList()
		}
	}
}

func (n *Node) sharePeerList() {
	peers := n.ConnectedPeers()
	payload, _ := json.Marshal(peers)
	msg := Message{
		Type:      MsgPeerExchange,
		Payload:   payload,
		From:      n.id,
		Timestamp: time.Now().UnixMilli(),
	}
	n.broadcast(msg)
}

// sendMessage sends a message to a specific peer.
func (n *Node) sendMessage(peerID string, msg Message) error {
	n.mu.RLock()
	pc, ok := n.peers[peerID]
	n.mu.RUnlock()
	if !ok {
		return fmt.Errorf("peer %s not connected", peerID)
	}
	pc.mu.Lock()
	defer pc.mu.Unlock()
	return pc.encoder.Encode(msg)
}

func sha256Hash(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}
