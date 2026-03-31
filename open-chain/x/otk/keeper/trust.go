// Package keeper — Trust Network.
//
// Tracks trust relationships between UIDs. Trust is directional:
// "I trust you" doesn't mean "you trust me". Trust scores affect:
//   - Milestone verification weight
//   - Governance proposal endorsements
//   - Marketplace seller reputation
//   - Social recovery guardian eligibility

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// TrustRelation represents a directional trust assertion.
type TrustRelation struct {
	TrusterUID string `json:"truster_uid"`
	TrusteeUID string `json:"trustee_uid"`
	Level      int    `json:"level"` // 1-5 (1=basic, 5=absolute)
	Context    string `json:"context"` // general, financial, governance, verification, personal
	CreatedAt  int64  `json:"created_at"`
}

// TrustScore aggregates trust received by a UID.
type TrustScore struct {
	UID           string `json:"uid"`
	TotalTrusters int64  `json:"total_trusters"`
	AvgLevel      float64 `json:"avg_level"`
	Contexts      map[string]int64 `json:"contexts"` // count per context
}

// SetTrust creates or updates a trust relationship.
func (k Keeper) SetTrust(ctx sdk.Context, truster, trustee, context string, level int) error {
	if truster == trustee {
		return fmt.Errorf("cannot trust yourself")
	}
	if level < 1 || level > 5 {
		return fmt.Errorf("trust level must be 1-5")
	}

	rel := TrustRelation{
		TrusterUID: truster,
		TrusteeUID: trustee,
		Level:      level,
		Context:    context,
		CreatedAt:  ctx.BlockHeight(),
	}

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("trust/%s/%s", truster, trustee)
	bz, _ := json.Marshal(rel)
	store.Set([]byte(key), bz)

	// Reverse index
	revKey := fmt.Sprintf("trusted_by/%s/%s", trustee, truster)
	store.Set([]byte(revKey), bz)

	return nil
}

// GetTrustScore returns aggregate trust received by a UID.
func (k Keeper) GetTrustScore(ctx sdk.Context, uid string) *TrustScore {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("trusted_by/%s/", uid))
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	score := &TrustScore{UID: uid, Contexts: map[string]int64{}}
	totalLevel := int64(0)

	for ; iter.Valid(); iter.Next() {
		var rel TrustRelation
		if err := json.Unmarshal(iter.Value(), &rel); err != nil {
			continue
		}
		score.TotalTrusters++
		totalLevel += int64(rel.Level)
		score.Contexts[rel.Context]++
	}

	if score.TotalTrusters > 0 {
		score.AvgLevel = float64(totalLevel) / float64(score.TotalTrusters)
	}

	return score
}

// GetTrustedBy returns all UIDs that trust the given UID.
func (k Keeper) GetTrustedBy(ctx sdk.Context, uid string) []TrustRelation {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("trusted_by/%s/", uid))
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	var relations []TrustRelation
	for ; iter.Valid(); iter.Next() {
		var rel TrustRelation
		if err := json.Unmarshal(iter.Value(), &rel); err != nil {
			continue
		}
		relations = append(relations, rel)
	}
	return relations
}
