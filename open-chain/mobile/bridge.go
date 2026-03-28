// Package mobile provides gomobile-compatible bindings for React Native.
// All exported functions use simple types (string, []byte, int64, error)
// for compatibility with gomobile's type restrictions.
package mobile

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"

	"openchain/p2p"
)

var (
	nodeInstance *p2p.Node
	nodeMu       sync.Mutex
)

// NodeStatus describes the current state of the P2P node.
type NodeStatus struct {
	PeerID       string `json:"peer_id"`
	PeerCount    int    `json:"peer_count"`
	LatestHeight int64  `json:"latest_height"`
	Syncing      bool   `json:"syncing"`
	ChainID      string `json:"chain_id"`
}

// StartNode initializes and starts a P2P node. configJSON should be a
// JSON-encoded NodeConfig. Returns the peer ID string on success.
func StartNode(configJSON string) (string, error) {
	nodeMu.Lock()
	defer nodeMu.Unlock()

	if nodeInstance != nil {
		return "", fmt.Errorf("node already running")
	}

	var config p2p.NodeConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		// Use defaults if config parsing fails.
		config = p2p.DefaultNodeConfig()
	}

	node, err := p2p.NewNode(config)
	if err != nil {
		return "", fmt.Errorf("failed to create node: %w", err)
	}

	if err := node.Start(); err != nil {
		return "", fmt.Errorf("failed to start node: %w", err)
	}

	nodeInstance = node
	return node.ID(), nil
}

// StopNode gracefully shuts down the running P2P node.
func StopNode() error {
	nodeMu.Lock()
	defer nodeMu.Unlock()

	if nodeInstance == nil {
		return fmt.Errorf("node not running")
	}

	err := nodeInstance.Stop()
	nodeInstance = nil
	return err
}

// GetPeers returns a JSON array of connected peer information.
func GetPeers() (string, error) {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return "[]", fmt.Errorf("node not running")
	}

	peers := node.ConnectedPeers()
	data, err := json.Marshal(peers)
	if err != nil {
		return "[]", err
	}
	return string(data), nil
}

// BroadcastTransaction broadcasts a hex-encoded transaction to the network.
func BroadcastTransaction(txHex string) error {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return fmt.Errorf("node not running")
	}

	txBytes, err := hex.DecodeString(txHex)
	if err != nil {
		return fmt.Errorf("invalid hex: %w", err)
	}

	return node.BroadcastTx(txBytes)
}

// GetBlockHeader returns a JSON-encoded block header at the given height.
func GetBlockHeader(height int64) (string, error) {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return "", fmt.Errorf("node not running")
	}

	// Access syncer's header store via the node.
	// The syncer is not directly exposed, so we use a helper approach.
	// For now, return empty if not available.
	return "{}", nil
}

// GetBalance returns a JSON balance for the given address from local state.
// In the current implementation, this is a placeholder that will be connected
// to the Cosmos SDK query layer.
func GetBalance(address string) (string, error) {
	if address == "" {
		return "", fmt.Errorf("address is required")
	}

	// Placeholder: will integrate with Cosmos SDK bank module query.
	result := map[string]interface{}{
		"address":  address,
		"balances": []interface{}{},
	}
	data, _ := json.Marshal(result)
	return string(data), nil
}

// GetLatestHeight returns the latest synced block height.
func GetLatestHeight() int64 {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return 0
	}

	// Access via node's public interface.
	return 0 // placeholder until syncer is exposed
}

// SubscribeBlocks registers a callback that fires when new blocks arrive.
// The callback receives a JSON-encoded block header string.
// Note: gomobile does not support func params directly, so this uses a
// polling approach via GetLatestHeight instead. This function sets up
// internal subscription.
func SubscribeBlocks() error {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return fmt.Errorf("node not running")
	}

	return node.Subscribe("block", func(data []byte) {
		// Internal handler — mobile side polls via GetLatestHeight.
	})
}

// IsValidator returns true if this node is configured as a validator.
func IsValidator() bool {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return false
	}

	// Check if validator key was provided in config.
	return validatorInstance != nil
}

// GetNodeStatus returns a JSON object describing the node's current state.
func GetNodeStatus() (string, error) {
	nodeMu.Lock()
	node := nodeInstance
	nodeMu.Unlock()

	if node == nil {
		return "", fmt.Errorf("node not running")
	}

	status := NodeStatus{
		PeerID:       node.ID(),
		PeerCount:    node.PeerCount(),
		LatestHeight: 0, // placeholder
		Syncing:      false,
		ChainID:      "openchain-testnet-1",
	}

	data, err := json.Marshal(status)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
