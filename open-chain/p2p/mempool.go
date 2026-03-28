package p2p

import (
	"sync"
	"time"
)

// MempoolEntry holds a transaction in the mempool with metadata.
type MempoolEntry struct {
	TxHash    string
	TxBytes   []byte
	AddedAt   time.Time
	Size      int
}

// Mempool is an in-memory transaction pool that receives txs from peers,
// deduplicates them, and orders them FIFO (since Open Chain fees are near-zero).
type Mempool struct {
	mu       sync.RWMutex
	txs      map[string]*MempoolEntry // hash -> entry
	order    []string                 // FIFO order of tx hashes
	maxSize  int                      // max number of transactions
}

// NewMempool creates a new transaction mempool with the given capacity.
func NewMempool(maxSize int) *Mempool {
	if maxSize <= 0 {
		maxSize = 10000
	}
	return &Mempool{
		txs:     make(map[string]*MempoolEntry),
		order:   make([]string, 0, maxSize),
		maxSize: maxSize,
	}
}

// Add inserts a transaction into the mempool. Returns false if it already exists
// or the mempool is full.
func (m *Mempool) Add(txHash string, txBytes []byte) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Deduplicate.
	if _, exists := m.txs[txHash]; exists {
		return false
	}

	// Check capacity.
	if len(m.txs) >= m.maxSize {
		return false
	}

	entry := &MempoolEntry{
		TxHash:  txHash,
		TxBytes: txBytes,
		AddedAt: time.Now(),
		Size:    len(txBytes),
	}

	m.txs[txHash] = entry
	m.order = append(m.order, txHash)
	return true
}

// Has checks whether a transaction is already in the mempool.
func (m *Mempool) Has(txHash string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, exists := m.txs[txHash]
	return exists
}

// Get returns a transaction's bytes by hash, or nil if not found.
func (m *Mempool) Get(txHash string) []byte {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if entry, ok := m.txs[txHash]; ok {
		return entry.TxBytes
	}
	return nil
}

// Remove deletes a transaction from the mempool (e.g., after it's included in a block).
func (m *Mempool) Remove(txHash string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.txs, txHash)
	// Remove from order slice.
	for i, h := range m.order {
		if h == txHash {
			m.order = append(m.order[:i], m.order[i+1:]...)
			break
		}
	}
}

// ReapMaxTxs returns up to maxTxs transactions in FIFO order for block creation.
// This does not remove them from the mempool — call Remove after block is committed.
func (m *Mempool) ReapMaxTxs(maxTxs int) [][]byte {
	m.mu.RLock()
	defer m.mu.RUnlock()

	count := maxTxs
	if count > len(m.order) {
		count = len(m.order)
	}

	txs := make([][]byte, 0, count)
	for i := 0; i < count; i++ {
		hash := m.order[i]
		if entry, ok := m.txs[hash]; ok {
			txs = append(txs, entry.TxBytes)
		}
	}
	return txs
}

// Size returns the current number of transactions in the mempool.
func (m *Mempool) Size() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.txs)
}

// Flush removes all transactions from the mempool.
func (m *Mempool) Flush() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.txs = make(map[string]*MempoolEntry)
	m.order = m.order[:0]
}

// RemoveBatch removes multiple transactions at once (after block commit).
func (m *Mempool) RemoveBatch(txHashes []string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	toRemove := make(map[string]bool, len(txHashes))
	for _, h := range txHashes {
		delete(m.txs, h)
		toRemove[h] = true
	}

	// Rebuild order slice without removed hashes.
	newOrder := make([]string, 0, len(m.order)-len(txHashes))
	for _, h := range m.order {
		if !toRemove[h] {
			newOrder = append(newOrder, h)
		}
	}
	m.order = newOrder
}

// PruneOld removes transactions older than the given duration.
func (m *Mempool) PruneOld(maxAge time.Duration) int {
	m.mu.Lock()
	defer m.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	var pruned int
	var toRemove []string

	for hash, entry := range m.txs {
		if entry.AddedAt.Before(cutoff) {
			toRemove = append(toRemove, hash)
		}
	}

	toRemoveSet := make(map[string]bool, len(toRemove))
	for _, h := range toRemove {
		delete(m.txs, h)
		toRemoveSet[h] = true
		pruned++
	}

	newOrder := make([]string, 0, len(m.order)-pruned)
	for _, h := range m.order {
		if !toRemoveSet[h] {
			newOrder = append(newOrder, h)
		}
	}
	m.order = newOrder

	return pruned
}
