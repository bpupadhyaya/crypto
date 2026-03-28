package p2p

import "time"

// NodeConfig holds all configuration for a P2P node.
type NodeConfig struct {
	ListenAddrs    []string // e.g., "/ip4/0.0.0.0/tcp/26656"
	BootstrapPeers []string // initial peers to connect to
	MaxPeers       int      // default 50
	EnableMDNS     bool     // true for local network testing
	EnableDHT      bool     // true for internet discovery
	ChainID        string   // "openchain-testnet-1"
	ValidatorKey   []byte   // optional: if this node is a validator
	DataDir        string   // where to store peer data
}

// DefaultNodeConfig returns a sensible default configuration for testnet.
func DefaultNodeConfig() NodeConfig {
	return NodeConfig{
		ListenAddrs:    []string{"0.0.0.0:26656"},
		BootstrapPeers: []string{},
		MaxPeers:       50,
		EnableMDNS:     true,
		EnableDHT:      true,
		ChainID:        "openchain-testnet-1",
		DataDir:        "./data/p2p",
	}
}

// MessageType identifies the kind of P2P message.
type MessageType uint8

const (
	MsgBlockHeader          MessageType = 1
	MsgTransaction          MessageType = 2
	MsgPeerInfo             MessageType = 3
	MsgMilestoneAttestation MessageType = 4
	MsgHeaderRequest        MessageType = 5
	MsgHeaderResponse       MessageType = 6
	MsgPeerExchange         MessageType = 7
)

// Message is the wire format for all P2P communication.
type Message struct {
	Type      MessageType `json:"type"`
	Topic     string      `json:"topic,omitempty"`
	Payload   []byte      `json:"payload"`
	From      string      `json:"from"`
	Timestamp int64       `json:"timestamp"`
}

// PeerInfo describes a connected peer.
type PeerInfo struct {
	ID        string `json:"id"`
	Addr      string `json:"addr"`
	ChainID   string `json:"chain_id"`
	Height    int64  `json:"height"`
	Connected bool   `json:"connected"`
}

// P2P protocol constants.
const (
	ProtocolVersion = "openchain/1.0.0"

	// mDNS service name for local discovery.
	MDNSServiceName = "_openchain._tcp"

	// Multicast address for mDNS-like local peer discovery.
	MulticastAddr = "239.0.0.1:9999"

	// How often to announce on multicast.
	MDNSInterval = 10 * time.Second

	// How often to ping peers.
	PingInterval = 30 * time.Second

	// Peer timeout.
	PeerTimeout = 2 * time.Minute

	// Max message size (1 MB).
	MaxMessageSize = 1 << 20

	// DHT refresh interval.
	DHTRefreshInterval = 5 * time.Minute
)
