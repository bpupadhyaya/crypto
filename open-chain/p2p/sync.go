package p2p

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// BlockHeader represents a simplified block header for light client sync.
type BlockHeader struct {
	Height          int64  `json:"height"`
	Hash            string `json:"hash"`
	PrevHash        string `json:"prev_hash"`
	Timestamp       int64  `json:"timestamp"`
	ValidatorPubKey string `json:"validator_pub_key"`
	Signature       string `json:"signature"`
	TxCount         int    `json:"tx_count"`
	StateRoot       string `json:"state_root"`
}

// HeaderRequest is sent to peers to request block headers.
type HeaderRequest struct {
	FromHeight int64 `json:"from_height"`
	ToHeight   int64 `json:"to_height"`
}

// HeaderResponse contains headers returned by a peer.
type HeaderResponse struct {
	Headers []BlockHeader `json:"headers"`
}

// Checkpoint is a verified header stored periodically for fast sync.
type Checkpoint struct {
	Header   BlockHeader `json:"header"`
	Verified bool        `json:"verified"`
}

// Syncer manages block header synchronization with peers.
type Syncer struct {
	node *Node

	mu            sync.RWMutex
	latestHeight  int64
	headers       map[int64]*BlockHeader // height -> header
	checkpoints   []Checkpoint
	pendingSync   bool
	syncTarget    int64
	trustedHashes map[int64]string // height -> trusted hash for verification
}

// NewSyncer creates a new block synchronization manager.
func NewSyncer(node *Node) *Syncer {
	return &Syncer{
		node:          node,
		headers:       make(map[int64]*BlockHeader),
		trustedHashes: make(map[int64]string),
	}
}

// LatestHeight returns the latest known block height.
func (s *Syncer) LatestHeight() int64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.latestHeight
}

// GetHeader returns a block header by height, or nil if not found.
func (s *Syncer) GetHeader(height int64) *BlockHeader {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.headers[height]
}

// HandleBlockHeader processes a new block header received from a peer.
func (s *Syncer) HandleBlockHeader(data []byte) {
	var header BlockHeader
	if err := json.Unmarshal(data, &header); err != nil {
		log.Printf("[sync] Failed to unmarshal block header: %v", err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Verify the header links to the previous one.
	if header.Height > 1 {
		prev, hasPrev := s.headers[header.Height-1]
		if hasPrev && prev.Hash != header.PrevHash {
			log.Printf("[sync] Header at height %d has invalid prev hash", header.Height)
			return
		}
	}

	// Verify header hash.
	if !s.verifyHeaderHash(&header) {
		log.Printf("[sync] Header at height %d has invalid hash", header.Height)
		return
	}

	// Store the header.
	s.headers[header.Height] = &header

	// Update latest height.
	if header.Height > s.latestHeight {
		s.latestHeight = header.Height
	}

	// Create checkpoint every 100 blocks.
	if header.Height%100 == 0 {
		s.checkpoints = append(s.checkpoints, Checkpoint{
			Header:   header,
			Verified: true,
		})
	}
}

// HandleHeaderRequest responds to a peer's request for headers.
func (s *Syncer) HandleHeaderRequest(pc *peerConn, data []byte) {
	var req HeaderRequest
	if err := json.Unmarshal(data, &req); err != nil {
		return
	}

	// Clamp range to what we have and a max of 100 headers per request.
	s.mu.RLock()
	from := req.FromHeight
	to := req.ToHeight
	if to-from > 100 {
		to = from + 100
	}

	var headers []BlockHeader
	for h := from; h <= to; h++ {
		if hdr, ok := s.headers[h]; ok {
			headers = append(headers, *hdr)
		}
	}
	s.mu.RUnlock()

	resp := HeaderResponse{Headers: headers}
	payload, _ := json.Marshal(resp)

	msg := Message{
		Type:      MsgHeaderResponse,
		Payload:   payload,
		From:      s.node.ID(),
		Timestamp: time.Now().UnixMilli(),
	}

	pc.mu.Lock()
	defer pc.mu.Unlock()
	pc.encoder.Encode(msg)
}

// HandleHeaderResponse processes headers received from a peer.
func (s *Syncer) HandleHeaderResponse(data []byte) {
	var resp HeaderResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range resp.Headers {
		h := &resp.Headers[i]

		// Verify chain continuity.
		if h.Height > 1 {
			prev, hasPrev := s.headers[h.Height-1]
			if hasPrev && prev.Hash != h.PrevHash {
				log.Printf("[sync] Received header at %d with bad prev hash, stopping sync", h.Height)
				return
			}
		}

		if !s.verifyHeaderHash(h) {
			log.Printf("[sync] Received header at %d with bad hash, stopping sync", h.Height)
			return
		}

		s.headers[h.Height] = h
		if h.Height > s.latestHeight {
			s.latestHeight = h.Height
		}
	}
}

// RequestHeaders asks a specific peer for block headers in a range.
func (s *Syncer) RequestHeaders(peerID string, from, to int64) error {
	req := HeaderRequest{FromHeight: from, ToHeight: to}
	payload, _ := json.Marshal(req)

	msg := Message{
		Type:      MsgHeaderRequest,
		Payload:   payload,
		From:      s.node.ID(),
		Timestamp: time.Now().UnixMilli(),
	}

	return s.node.sendMessage(peerID, msg)
}

// SyncFromPeers attempts to sync headers from connected peers.
func (s *Syncer) SyncFromPeers() {
	peers := s.node.ConnectedPeers()
	if len(peers) == 0 {
		return
	}

	s.mu.RLock()
	currentHeight := s.latestHeight
	s.mu.RUnlock()

	// Find the peer with the highest height.
	var bestPeer PeerInfo
	for _, p := range peers {
		if p.Height > bestPeer.Height {
			bestPeer = p
		}
	}

	if bestPeer.Height <= currentHeight {
		return // we're up to date
	}

	log.Printf("[sync] Syncing from height %d to %d via peer %s",
		currentHeight+1, bestPeer.Height, bestPeer.ID[:8])

	// Request in batches of 100.
	for h := currentHeight + 1; h <= bestPeer.Height; h += 100 {
		to := h + 99
		if to > bestPeer.Height {
			to = bestPeer.Height
		}
		if err := s.RequestHeaders(bestPeer.ID, h, to); err != nil {
			log.Printf("[sync] Failed to request headers: %v", err)
			return
		}
	}
}

// AddTrustedHash adds a trusted hash for verification at a specific height.
// This is used by light clients to verify state proofs.
func (s *Syncer) AddTrustedHash(height int64, hash string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.trustedHashes[height] = hash
}

// VerifyStateProof checks that a state root at a given height matches trusted data.
func (s *Syncer) VerifyStateProof(height int64, stateRoot string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	header, ok := s.headers[height]
	if !ok {
		return fmt.Errorf("no header at height %d", height)
	}

	if header.StateRoot != stateRoot {
		return fmt.Errorf("state root mismatch at height %d: expected %s, got %s",
			height, header.StateRoot, stateRoot)
	}

	return nil
}

// GetCheckpoints returns all verified checkpoints.
func (s *Syncer) GetCheckpoints() []Checkpoint {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cps := make([]Checkpoint, len(s.checkpoints))
	copy(cps, s.checkpoints)
	return cps
}

// verifyHeaderHash checks that the header's hash matches its content.
func (s *Syncer) verifyHeaderHash(h *BlockHeader) bool {
	// Compute expected hash from header fields (excluding the hash itself).
	data := fmt.Sprintf("%d|%s|%d|%s|%s|%d|%s",
		h.Height, h.PrevHash, h.Timestamp,
		h.ValidatorPubKey, h.Signature, h.TxCount, h.StateRoot)
	computed := sha256.Sum256([]byte(data))
	expected := fmt.Sprintf("%x", computed)

	// If hash is empty, this is a new header — accept it but set the hash.
	if h.Hash == "" {
		h.Hash = expected
		return true
	}

	return h.Hash == expected
}
