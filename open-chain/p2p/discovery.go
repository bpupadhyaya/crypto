package p2p

import (
	"encoding/json"
	"log"
	"net"
	"sync"
	"time"
)

// Discovery handles peer discovery via mDNS (multicast) for local network
// and peer exchange (simulated DHT) for internet discovery.
type Discovery struct {
	node   *Node
	config NodeConfig

	mu         sync.RWMutex
	knownPeers map[string]*peerScore // addr -> score info
	stopCh     chan struct{}
}

// peerScore tracks reputation for a peer.
type peerScore struct {
	Addr           string
	Score          int
	LastSeen       time.Time
	FailedAttempts int
}

const (
	// Scoring constants.
	initialScore       = 100
	goodMessageBonus   = 1
	badMessagePenalty  = -10
	connectionPenalty  = -5
	minScoreForConnect = 20
	maxFailedAttempts  = 5
)

// NewDiscovery creates a new discovery service.
func NewDiscovery(node *Node, config NodeConfig) *Discovery {
	return &Discovery{
		node:       node,
		config:     config,
		knownPeers: make(map[string]*peerScore),
		stopCh:     make(chan struct{}),
	}
}

// Start begins discovery services.
func (d *Discovery) Start() {
	if d.config.EnableMDNS {
		go d.mdnsLoop()
	}
	if d.config.EnableDHT {
		go d.dhtRefreshLoop()
	}
}

// Stop shuts down discovery services.
func (d *Discovery) Stop() {
	close(d.stopCh)
}

// AddBootstrapPeer adds a peer address to the known peers list.
func (d *Discovery) AddBootstrapPeer(addr string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if _, exists := d.knownPeers[addr]; !exists {
		d.knownPeers[addr] = &peerScore{
			Addr:     addr,
			Score:    initialScore,
			LastSeen: time.Now(),
		}
	}
}

// RecordGoodBehavior increases a peer's reputation score.
func (d *Discovery) RecordGoodBehavior(addr string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if ps, ok := d.knownPeers[addr]; ok {
		ps.Score += goodMessageBonus
		ps.LastSeen = time.Now()
	}
}

// RecordBadBehavior decreases a peer's reputation score.
func (d *Discovery) RecordBadBehavior(addr string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if ps, ok := d.knownPeers[addr]; ok {
		ps.Score += badMessagePenalty
	}
}

// BestPeers returns known peers sorted by score, filtered by minimum score.
func (d *Discovery) BestPeers(limit int) []string {
	d.mu.RLock()
	defer d.mu.RUnlock()

	var addrs []string
	for _, ps := range d.knownPeers {
		if ps.Score >= minScoreForConnect && ps.FailedAttempts < maxFailedAttempts {
			addrs = append(addrs, ps.Addr)
		}
	}

	if len(addrs) > limit {
		addrs = addrs[:limit]
	}
	return addrs
}

// --- mDNS (multicast) discovery for local network ---

func (d *Discovery) mdnsLoop() {
	// Listen for multicast announcements.
	go d.mdnsListen()

	// Announce ourselves periodically.
	ticker := time.NewTicker(MDNSInterval)
	defer ticker.Stop()

	// Announce immediately.
	d.mdnsAnnounce()

	for {
		select {
		case <-d.stopCh:
			return
		case <-ticker.C:
			d.mdnsAnnounce()
		}
	}
}

func (d *Discovery) mdnsAnnounce() {
	addr, err := net.ResolveUDPAddr("udp4", MulticastAddr)
	if err != nil {
		return
	}

	conn, err := net.DialUDP("udp4", nil, addr)
	if err != nil {
		return
	}
	defer conn.Close()

	// Determine our listen address.
	listenAddr := "0.0.0.0:26656"
	if len(d.config.ListenAddrs) > 0 {
		listenAddr = d.config.ListenAddrs[0]
	}

	announcement := PeerInfo{
		ID:      d.node.ID(),
		Addr:    listenAddr,
		ChainID: d.config.ChainID,
		Height:  d.node.syncer.LatestHeight(),
	}

	data, err := json.Marshal(announcement)
	if err != nil {
		return
	}

	conn.Write(data)
}

func (d *Discovery) mdnsListen() {
	addr, err := net.ResolveUDPAddr("udp4", MulticastAddr)
	if err != nil {
		log.Printf("[discovery] Failed to resolve multicast addr: %v", err)
		return
	}

	conn, err := net.ListenMulticastUDP("udp4", nil, addr)
	if err != nil {
		log.Printf("[discovery] Failed to listen multicast: %v", err)
		return
	}
	defer conn.Close()

	buf := make([]byte, 4096)
	for {
		select {
		case <-d.stopCh:
			return
		default:
		}

		conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		n, _, err := conn.ReadFromUDP(buf)
		if err != nil {
			continue
		}

		var info PeerInfo
		if err := json.Unmarshal(buf[:n], &info); err != nil {
			continue
		}

		// Ignore our own announcements.
		if info.ID == d.node.ID() {
			continue
		}

		// Validate chain ID.
		if info.ChainID != d.config.ChainID {
			continue
		}

		// Track and possibly connect.
		d.mu.Lock()
		if _, exists := d.knownPeers[info.Addr]; !exists {
			d.knownPeers[info.Addr] = &peerScore{
				Addr:     info.Addr,
				Score:    initialScore,
				LastSeen: time.Now(),
			}
		} else {
			d.knownPeers[info.Addr].LastSeen = time.Now()
		}
		d.mu.Unlock()

		// Connect if we don't already have this peer.
		d.node.mu.RLock()
		_, connected := d.node.peers[info.ID]
		peerCount := len(d.node.peers)
		d.node.mu.RUnlock()

		if !connected && peerCount < d.config.MaxPeers {
			go d.node.connectToPeer(info.Addr)
		}
	}
}

// --- DHT-like peer exchange for internet discovery ---

func (d *Discovery) dhtRefreshLoop() {
	ticker := time.NewTicker(DHTRefreshInterval)
	defer ticker.Stop()

	for {
		select {
		case <-d.stopCh:
			return
		case <-ticker.C:
			d.tryConnectKnownPeers()
			d.pruneStale()
		}
	}
}

// tryConnectKnownPeers tries to connect to known peers if we're below MaxPeers.
func (d *Discovery) tryConnectKnownPeers() {
	d.node.mu.RLock()
	peerCount := len(d.node.peers)
	d.node.mu.RUnlock()

	if peerCount >= d.config.MaxPeers {
		return
	}

	needed := d.config.MaxPeers - peerCount
	candidates := d.BestPeers(needed)

	for _, addr := range candidates {
		go d.tryConnect(addr)
	}
}

func (d *Discovery) tryConnect(addr string) {
	d.node.connectToPeer(addr)

	// Update failed attempts on failure (connectToPeer logs but doesn't return error here).
	d.mu.Lock()
	defer d.mu.Unlock()
	if ps, ok := d.knownPeers[addr]; ok {
		ps.FailedAttempts++
		ps.Score += connectionPenalty
	}
}

// pruneStale removes peers that haven't been seen in a long time.
func (d *Discovery) pruneStale() {
	d.mu.Lock()
	defer d.mu.Unlock()

	cutoff := time.Now().Add(-1 * time.Hour)
	for addr, ps := range d.knownPeers {
		if ps.LastSeen.Before(cutoff) || ps.Score < 0 {
			delete(d.knownPeers, addr)
		}
	}
}
