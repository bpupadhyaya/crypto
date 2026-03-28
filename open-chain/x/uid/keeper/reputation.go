// Package keeper — On-chain reputation system.
//
// Reputation is computed from activity across all linked chains:
// transaction count, account age, gratitude sent/received, governance
// participation, and verification contributions. The score determines
// a user's trust level: newcomer → active → trusted → elder → guardian.
//
// "Reputation is earned by contribution, not by wealth. One human's lifetime
//  of teaching is worth more than a thousand speculative trades."
//  — Human Constitution, Article IV

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Reputation represents a user's on-chain reputation computed from all activity.
type Reputation struct {
	UID              string `json:"uid"`
	Score            int64  `json:"score"`             // 0-1000
	TransactionCount int64  `json:"tx_count"`
	AccountAge       int64  `json:"account_age"`       // blocks since registration
	GratitudeScore   int64  `json:"gratitude_score"`
	GovernanceScore  int64  `json:"governance_score"`
	VerifierScore    int64  `json:"verifier_score"`
	Level            string `json:"level"`             // newcomer, active, trusted, elder, guardian
}

// Reputation levels and their score thresholds
const (
	LevelNewcomer = "newcomer"  // 0-100
	LevelActive   = "active"    // 101-300
	LevelTrusted  = "trusted"   // 301-600
	LevelElder    = "elder"     // 601-800
	LevelGuardian = "guardian"  // 801-1000

	// Maximum score
	MaxReputationScore int64 = 1000
)

// Score weights for each component (out of 1000 total)
const (
	WeightTransactions int64 = 200 // Up to 200 points for transaction activity
	WeightAccountAge   int64 = 150 // Up to 150 points for longevity
	WeightGratitude    int64 = 300 // Up to 300 points for gratitude (highest weight)
	WeightGovernance   int64 = 200 // Up to 200 points for governance participation
	WeightVerifier     int64 = 150 // Up to 150 points for verification contributions
)

// Thresholds for computing component scores
const (
	// Transaction count milestones
	TxThresholdLow    int64 = 10
	TxThresholdMid    int64 = 100
	TxThresholdHigh   int64 = 1000

	// Account age milestones (in blocks, ~6s per block)
	AgeThreshold1Month  int64 = 432000   // ~30 days
	AgeThreshold6Month  int64 = 2592000  // ~180 days
	AgeThreshold1Year   int64 = 5256000  // ~365 days
	AgeThreshold3Year   int64 = 15768000 // ~1095 days

	// Gratitude milestones
	GratitudeThresholdLow  int64 = 5
	GratitudeThresholdMid  int64 = 50
	GratitudeThresholdHigh int64 = 200

	// Governance participation milestones
	GovThresholdLow  int64 = 3
	GovThresholdMid  int64 = 20
	GovThresholdHigh int64 = 100

	// Verifier milestones
	VerifierThresholdLow  int64 = 5
	VerifierThresholdMid  int64 = 50
	VerifierThresholdHigh int64 = 200
)

// Store key prefix for reputation
func reputationKey(uid string) []byte {
	return []byte(fmt.Sprintf("uid/reputation/%s", uid))
}

// GetReputation retrieves the reputation for a Universal ID.
// Returns a zero-value Reputation if none exists yet.
func (k Keeper) GetReputation(ctx sdk.Context, uid string) Reputation {
	store := ctx.KVStore(k.storeKey)
	key := reputationKey(uid)

	bz := store.Get(key)
	if bz == nil {
		return Reputation{
			UID:   uid,
			Score: 0,
			Level: LevelNewcomer,
		}
	}

	var rep Reputation
	if err := json.Unmarshal(bz, &rep); err != nil {
		// Return default on unmarshal error
		return Reputation{
			UID:   uid,
			Score: 0,
			Level: LevelNewcomer,
		}
	}
	return rep
}

// UpdateReputation recalculates reputation from all sources for a UID.
// This aggregates transaction count, account age, gratitude, governance,
// and verifier contributions into a single 0-1000 score.
func (k Keeper) UpdateReputation(ctx sdk.Context, uid string) {
	store := ctx.KVStore(k.storeKey)

	// Get current reputation (or default)
	rep := k.GetReputation(ctx, uid)

	// Calculate account age from block height
	// Look up registration block from the UID record
	rep.AccountAge = k.calculateAccountAge(ctx, uid)

	// Calculate component scores
	txScore := calculateTxScore(rep.TransactionCount)
	ageScore := calculateAgeScore(rep.AccountAge)
	gratScore := calculateGratitudeScore(rep.GratitudeScore)
	govScore := calculateGovernanceScore(rep.GovernanceScore)
	verScore := calculateVerifierScore(rep.VerifierScore)

	// Total score is sum of weighted components, capped at MaxReputationScore
	totalScore := txScore + ageScore + gratScore + govScore + verScore
	if totalScore > MaxReputationScore {
		totalScore = MaxReputationScore
	}
	if totalScore < 0 {
		totalScore = 0
	}

	rep.Score = totalScore
	rep.Level = GetReputationLevel(totalScore)

	// Persist
	bz, err := json.Marshal(&rep)
	if err != nil {
		return // silently fail — reputation is non-critical
	}
	store.Set(reputationKey(uid), bz)

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"reputation_updated",
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("score", fmt.Sprintf("%d", rep.Score)),
		sdk.NewAttribute("level", rep.Level),
	))
}

// GetReputationLevel maps a score (0-1000) to a human-readable level.
func GetReputationLevel(score int64) string {
	switch {
	case score <= 100:
		return LevelNewcomer
	case score <= 300:
		return LevelActive
	case score <= 600:
		return LevelTrusted
	case score <= 800:
		return LevelElder
	default:
		return LevelGuardian
	}
}

// IncrementTransactionCount adds to the transaction count and recalculates reputation.
func (k Keeper) IncrementTransactionCount(ctx sdk.Context, uid string, count int64) {
	rep := k.GetReputation(ctx, uid)
	rep.TransactionCount += count

	// Save intermediate state
	bz, err := json.Marshal(&rep)
	if err != nil {
		return
	}
	store := ctx.KVStore(k.storeKey)
	store.Set(reputationKey(uid), bz)

	// Recalculate
	k.UpdateReputation(ctx, uid)
}

// AddGratitudePoints awards gratitude points and recalculates reputation.
func (k Keeper) AddGratitudePoints(ctx sdk.Context, uid string, points int64) {
	rep := k.GetReputation(ctx, uid)
	rep.GratitudeScore += points

	bz, err := json.Marshal(&rep)
	if err != nil {
		return
	}
	store := ctx.KVStore(k.storeKey)
	store.Set(reputationKey(uid), bz)

	k.UpdateReputation(ctx, uid)
}

// AddGovernancePoints awards governance participation points.
func (k Keeper) AddGovernancePoints(ctx sdk.Context, uid string, points int64) {
	rep := k.GetReputation(ctx, uid)
	rep.GovernanceScore += points

	bz, err := json.Marshal(&rep)
	if err != nil {
		return
	}
	store := ctx.KVStore(k.storeKey)
	store.Set(reputationKey(uid), bz)

	k.UpdateReputation(ctx, uid)
}

// AddVerifierPoints awards points for verification contributions (oracle, milestone).
func (k Keeper) AddVerifierPoints(ctx sdk.Context, uid string, points int64) {
	rep := k.GetReputation(ctx, uid)
	rep.VerifierScore += points

	bz, err := json.Marshal(&rep)
	if err != nil {
		return
	}
	store := ctx.KVStore(k.storeKey)
	store.Set(reputationKey(uid), bz)

	k.UpdateReputation(ctx, uid)
}

// calculateAccountAge computes the age in blocks since UID registration.
func (k Keeper) calculateAccountAge(ctx sdk.Context, uid string) int64 {
	// Iterate over UID store to find registration block
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("uid/addr/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var record struct {
			ID        string `json:"id"`
			CreatedAt int64  `json:"created_at"`
		}
		if err := json.Unmarshal(iterator.Value(), &record); err != nil {
			continue
		}
		if record.ID == uid {
			currentBlock := ctx.BlockHeight()
			if currentBlock > record.CreatedAt {
				return currentBlock - record.CreatedAt
			}
			return 0
		}
	}
	return 0
}

// Component score calculators — each returns a weighted score contribution

func calculateTxScore(txCount int64) int64 {
	switch {
	case txCount >= TxThresholdHigh:
		return WeightTransactions
	case txCount >= TxThresholdMid:
		return WeightTransactions * 75 / 100
	case txCount >= TxThresholdLow:
		return WeightTransactions * 40 / 100
	case txCount > 0:
		return WeightTransactions * 10 / 100
	default:
		return 0
	}
}

func calculateAgeScore(ageBlocks int64) int64 {
	switch {
	case ageBlocks >= AgeThreshold3Year:
		return WeightAccountAge
	case ageBlocks >= AgeThreshold1Year:
		return WeightAccountAge * 75 / 100
	case ageBlocks >= AgeThreshold6Month:
		return WeightAccountAge * 50 / 100
	case ageBlocks >= AgeThreshold1Month:
		return WeightAccountAge * 25 / 100
	default:
		return 0
	}
}

func calculateGratitudeScore(gratitudePoints int64) int64 {
	switch {
	case gratitudePoints >= GratitudeThresholdHigh:
		return WeightGratitude
	case gratitudePoints >= GratitudeThresholdMid:
		return WeightGratitude * 70 / 100
	case gratitudePoints >= GratitudeThresholdLow:
		return WeightGratitude * 30 / 100
	case gratitudePoints > 0:
		return WeightGratitude * 10 / 100
	default:
		return 0
	}
}

func calculateGovernanceScore(govPoints int64) int64 {
	switch {
	case govPoints >= GovThresholdHigh:
		return WeightGovernance
	case govPoints >= GovThresholdMid:
		return WeightGovernance * 70 / 100
	case govPoints >= GovThresholdLow:
		return WeightGovernance * 30 / 100
	case govPoints > 0:
		return WeightGovernance * 10 / 100
	default:
		return 0
	}
}

func calculateVerifierScore(verifierPoints int64) int64 {
	switch {
	case verifierPoints >= VerifierThresholdHigh:
		return WeightVerifier
	case verifierPoints >= VerifierThresholdMid:
		return WeightVerifier * 70 / 100
	case verifierPoints >= VerifierThresholdLow:
		return WeightVerifier * 30 / 100
	case verifierPoints > 0:
		return WeightVerifier * 10 / 100
	default:
		return 0
	}
}

// GetReputationBreakdown returns a human-readable breakdown of each component score.
func (k Keeper) GetReputationBreakdown(ctx sdk.Context, uid string) map[string]int64 {
	rep := k.GetReputation(ctx, uid)
	return map[string]int64{
		"transactions": calculateTxScore(rep.TransactionCount),
		"account_age":  calculateAgeScore(rep.AccountAge),
		"gratitude":    calculateGratitudeScore(rep.GratitudeScore),
		"governance":   calculateGovernanceScore(rep.GovernanceScore),
		"verifier":     calculateVerifierScore(rep.VerifierScore),
		"total":        rep.Score,
	}
}
