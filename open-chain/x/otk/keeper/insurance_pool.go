// Package keeper — Community Mutual Aid Insurance Pools.
//
// Community members pool OTK to create insurance against common risks:
//   - Health emergencies
//   - Crop/livestock loss
//   - Natural disasters
//   - Job loss
//   - Equipment failure
//
// Claims are approved by pool members via vote (one member one vote).
// No corporate intermediary — pure peer-to-peer mutual aid.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// InsurancePool represents a community mutual aid pool.
type InsurancePool struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	PoolType      string   `json:"pool_type"` // health, crop, disaster, job_loss, equipment, general
	Region        string   `json:"region"`
	Members       int64    `json:"members"`
	TotalPoolOTK  int64    `json:"total_pool_otk"` // micro-OTK
	MonthlyPremium int64   `json:"monthly_premium"` // micro-OTK per member per month
	MaxClaim      int64    `json:"max_claim"`       // maximum single claim
	ActiveClaims  int64    `json:"active_claims"`
	PaidClaims    int64    `json:"paid_claims"`
	TotalPaidOut  int64    `json:"total_paid_out"`
	Status        string   `json:"status"` // active, paused, depleted
	CreatedAt     int64    `json:"created_at"`
	Admins        []string `json:"admins"`
}

// InsuranceClaim represents a claim against a pool.
type InsuranceClaim struct {
	ID          string `json:"id"`
	PoolID      string `json:"pool_id"`
	ClaimantUID string `json:"claimant_uid"`
	Amount      int64  `json:"amount"` // micro-OTK requested
	Reason      string `json:"reason"`
	Evidence    string `json:"evidence"` // hash of supporting documents
	Status      string `json:"status"`   // submitted, voting, approved, rejected, paid
	YesVotes    int64  `json:"yes_votes"`
	NoVotes     int64  `json:"no_votes"`
	VotingEnds  int64  `json:"voting_ends"`
	SubmittedAt int64  `json:"submitted_at"`
	PaidAt      int64  `json:"paid_at,omitempty"`
}

// CreateInsurancePool creates a new community mutual aid pool.
func (k Keeper) CreateInsurancePool(ctx sdk.Context, pool InsurancePool) (*InsurancePool, error) {
	if pool.Name == "" || pool.PoolType == "" {
		return nil, fmt.Errorf("name and pool_type are required")
	}

	pool.Status = "active"
	pool.CreatedAt = ctx.BlockHeight()
	if pool.ID == "" {
		pool.ID = fmt.Sprintf("ins_%s_%d", pool.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(pool)
	store.Set([]byte("ins_pool/"+pool.ID), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent("insurance_pool_created",
		sdk.NewAttribute("id", pool.ID),
		sdk.NewAttribute("type", pool.PoolType),
		sdk.NewAttribute("region", pool.Region),
	))

	return &pool, nil
}

// SubmitInsuranceClaim files a claim against a pool.
func (k Keeper) SubmitInsuranceClaim(ctx sdk.Context, claim InsuranceClaim) (*InsuranceClaim, error) {
	if claim.PoolID == "" || claim.ClaimantUID == "" || claim.Amount <= 0 {
		return nil, fmt.Errorf("pool_id, claimant, and amount are required")
	}

	// Verify pool exists and is active
	pool := k.GetInsurancePool(ctx, claim.PoolID)
	if pool == nil {
		return nil, fmt.Errorf("pool not found")
	}
	if pool.Status != "active" {
		return nil, fmt.Errorf("pool is not active")
	}
	if claim.Amount > pool.MaxClaim {
		return nil, fmt.Errorf("claim exceeds max: %d > %d", claim.Amount, pool.MaxClaim)
	}

	claim.Status = "voting"
	claim.SubmittedAt = ctx.BlockHeight()
	claim.VotingEnds = ctx.BlockHeight() + 50400 // ~3.5 days
	if claim.ID == "" {
		claim.ID = fmt.Sprintf("icl_%s_%d", claim.PoolID, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(claim)
	store.Set([]byte("ins_claim/"+claim.ID), bz)

	// Update pool active claims
	pool.ActiveClaims++
	poolBz, _ := json.Marshal(pool)
	store.Set([]byte("ins_pool/"+pool.ID), poolBz)

	return &claim, nil
}

// VoteOnClaim allows pool members to approve/reject a claim.
func (k Keeper) VoteOnClaim(ctx sdk.Context, claimID, voterUID string, approve bool) error {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("ins_claim/" + claimID))
	if bz == nil {
		return fmt.Errorf("claim not found")
	}

	var claim InsuranceClaim
	_ = json.Unmarshal(bz, &claim)

	if claim.Status != "voting" {
		return fmt.Errorf("claim is not in voting")
	}

	if approve {
		claim.YesVotes++
	} else {
		claim.NoVotes++
	}

	updBz, _ := json.Marshal(claim)
	store.Set([]byte("ins_claim/"+claim.ID), updBz)
	return nil
}

// GetInsurancePool retrieves a pool by ID.
func (k Keeper) GetInsurancePool(ctx sdk.Context, poolID string) *InsurancePool {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("ins_pool/" + poolID))
	if bz == nil {
		return nil
	}
	var pool InsurancePool
	_ = json.Unmarshal(bz, &pool)
	return &pool
}

// GetInsurancePools returns all pools, optionally filtered by type.
func (k Keeper) GetInsurancePools(ctx sdk.Context, poolType string) []InsurancePool {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("ins_pool/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var pools []InsurancePool
	for ; iterator.Valid(); iterator.Next() {
		var pool InsurancePool
		if err := json.Unmarshal(iterator.Value(), &pool); err != nil {
			continue
		}
		if poolType == "" || pool.PoolType == poolType {
			pools = append(pools, pool)
		}
	}
	return pools
}
