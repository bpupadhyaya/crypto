// Package keeper — Contribution Score Indexer.
//
// Maintains a sorted index of contribution scores keyed by UID.
// Uses a dual-key KV store approach for efficient sorted iteration
// and quick lookups:
//   - score_index/{score_padded}/{uid} → []byte{1} (sorted iteration)
//   - score_reverse/{uid} → score as 20-digit padded string (reverse lookup)

package keeper

import (
	"encoding/binary"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/otk/types"
)

const (
	scoreIndexPrefix   = "score_index/"
	scoreReversePrefix = "score_reverse/"
	scorePadWidth      = 20 // pad scores to 20 digits for lexicographic sort
)

// padScore returns a zero-padded string representation of a score
// for correct lexicographic ordering in the KV store.
func padScore(score int64) string {
	return fmt.Sprintf("%020d", score)
}

// scoreIndexKey returns the key for sorted score iteration.
func scoreIndexKey(score int64, uid string) []byte {
	return []byte(fmt.Sprintf("%s%s/%s", scoreIndexPrefix, padScore(score), uid))
}

// scoreReverseKey returns the key for quick UID → score lookup.
func scoreReverseKey(uid string) []byte {
	return []byte(fmt.Sprintf("%s%s", scoreReversePrefix, uid))
}

// encodeScore encodes a score as 8 bytes (big-endian int64).
func encodeScore(score int64) []byte {
	bz := make([]byte, 8)
	binary.BigEndian.PutUint64(bz, uint64(score))
	return bz
}

// decodeScore decodes 8 bytes (big-endian) back to int64.
func decodeScore(bz []byte) int64 {
	if len(bz) != 8 {
		return 0
	}
	return int64(binary.BigEndian.Uint64(bz))
}

// UpdateScoreIndex recalculates the contribution score for a UID
// and updates the sorted index.
func (k Keeper) UpdateScoreIndex(ctx sdk.Context, uid string) {
	store := ctx.KVStore(k.storeKey)

	// Get current score from the Living Ledger
	newScore, err := k.GetContributionScore(ctx, uid)
	if err != nil {
		return // silently skip if ledger not found
	}

	// Remove old index entry if it exists
	reverseKey := scoreReverseKey(uid)
	oldScoreBz := store.Get(reverseKey)
	if oldScoreBz != nil {
		oldScore := decodeScore(oldScoreBz)
		store.Delete(scoreIndexKey(oldScore, uid))
	}

	// Write new index entry
	store.Set(scoreIndexKey(newScore, uid), []byte{1})

	// Write reverse lookup
	store.Set(reverseKey, encodeScore(newScore))
}

// GetTopContributors returns the top N contributors sorted by score descending.
func (k Keeper) GetTopContributors(ctx sdk.Context, limit int) []types.ContributorScore {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(scoreIndexPrefix)

	// Reverse iterate to get highest scores first
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var results []types.ContributorScore
	rank := int64(1)
	for ; iterator.Valid() && len(results) < limit; iterator.Next() {
		key := string(iterator.Key())

		// Parse key: score_index/{score_padded}/{uid}
		// Skip the prefix, then extract score and uid
		rest := key[len(scoreIndexPrefix):]
		if len(rest) < scorePadWidth+1 {
			continue // malformed key
		}
		uid := rest[scorePadWidth+1:] // skip score + "/"

		// Look up actual score from reverse index
		reverseKey := scoreReverseKey(uid)
		scoreBz := store.Get(reverseKey)
		score := decodeScore(scoreBz)

		results = append(results, types.ContributorScore{
			UID:   uid,
			Score: score,
			Rank:  rank,
		})
		rank++
	}

	return results
}

// GetRank returns the rank and total count for a UID.
// Rank is 1-based (1 = top contributor). Returns error if UID has no score.
func (k Keeper) GetRank(ctx sdk.Context, uid string) (rank int64, total int64, err error) {
	store := ctx.KVStore(k.storeKey)

	// Get this UID's score
	reverseKey := scoreReverseKey(uid)
	scoreBz := store.Get(reverseKey)
	if scoreBz == nil {
		return 0, 0, fmt.Errorf("no score found for UID %s", uid)
	}
	targetScore := decodeScore(scoreBz)

	// Count how many UIDs have a higher score (reverse iterate from top)
	prefix := []byte(scoreIndexPrefix)
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	rank = 0
	total = 0
	found := false
	for ; iterator.Valid(); iterator.Next() {
		total++

		key := string(iterator.Key())
		rest := key[len(scoreIndexPrefix):]
		if len(rest) < scorePadWidth+1 {
			continue
		}
		entryUID := rest[scorePadWidth+1:]
		entryScoreBz := store.Get(scoreReverseKey(entryUID))
		entryScore := decodeScore(entryScoreBz)

		if !found && (entryScore > targetScore || (entryScore == targetScore && entryUID == uid)) {
			if entryUID == uid {
				rank = total
				found = true
			}
		}
	}

	if !found {
		return 0, total, fmt.Errorf("UID %s not found in score index", uid)
	}

	return rank, total, nil
}

// RebuildIndex performs a full reindex of all contribution scores.
// Used during genesis initialization or chain migration.
func (k Keeper) RebuildIndex(ctx sdk.Context) {
	store := ctx.KVStore(k.storeKey)

	// Clear existing index entries
	k.clearPrefix(store, []byte(scoreIndexPrefix))
	k.clearPrefix(store, []byte(scoreReversePrefix))

	// Iterate all living ledgers and rebuild
	ledgerPrefix := []byte("living_ledger/")
	iterator := store.Iterator(ledgerPrefix, storetypes.PrefixEndBytes(ledgerPrefix))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		key := string(iterator.Key())
		uid := key[len("living_ledger/"):]
		k.UpdateScoreIndex(ctx, uid)
	}
}

// clearPrefix deletes all keys with the given prefix from the store.
func (k Keeper) clearPrefix(store storetypes.KVStore, prefix []byte) {
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var keysToDelete [][]byte
	for ; iterator.Valid(); iterator.Next() {
		keysToDelete = append(keysToDelete, iterator.Key())
	}
	for _, key := range keysToDelete {
		store.Delete(key)
	}
}
