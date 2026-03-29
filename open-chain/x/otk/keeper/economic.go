// Package keeper — Economic Value Tracking.
//
// Article III: xOTK represents financial transactions, trade, material value.
//
// Unlike other channels, economic value flows naturally through the
// existing banking/DEX system. This module tracks the economic
// dimension and ensures it's weighted alongside human contributions.
// Economic activity alone is not enough — the Constitution ensures
// parenting (nOTK) and teaching (eOTK) are valued equally.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// EconomicActivity tracks economic contributions.
type EconomicActivity struct {
	UID           string `json:"uid"`
	ActivityType  string `json:"activity_type"` // trade, create, employ, invest, donate
	Description   string `json:"description"`
	Amount        int64  `json:"amount"`        // transaction value in uotk
	XOTKEarned    int64  `json:"xotk_earned"`
	BlockHeight   int64  `json:"block_height"`
}

// EconomicProfile tracks a person's economic contributions.
type EconomicProfile struct {
	UID              string `json:"uid"`
	TotalTrades      int64  `json:"total_trades"`
	TotalCreated     int64  `json:"total_created"`     // jobs, products, services created
	TotalEmployed    int64  `json:"total_employed"`     // people employed
	TotalInvested    int64  `json:"total_invested"`
	TotalDonated     int64  `json:"total_donated"`
	TotalXOTK        int64  `json:"total_xotk"`
	EconomicLevel    string `json:"economic_level"` // participant, contributor, builder, creator, pioneer
}

// Economic levels
func GetEconomicLevel(xotk int64) string {
	if xotk >= 100000000000 { return "pioneer" }    // 100k+ xOTK
	if xotk >= 10000000000 { return "creator" }     // 10k+
	if xotk >= 1000000000 { return "builder" }      // 1k+
	if xotk >= 100000000 { return "contributor" }    // 100+
	return "participant"
}

// RecordEconomicActivity logs an economic contribution.
func (k Keeper) RecordEconomicActivity(ctx sdk.Context, activity EconomicActivity) error {
	if activity.UID == "" {
		return fmt.Errorf("UID required")
	}

	// xOTK reward is proportional to economic value, but capped
	// to prevent financial speculation from dominating
	rewardMap := map[string]int64{
		"trade":   10000,    // 0.01 xOTK per trade (minimal — trading isn't the goal)
		"create":  5000000,  // 5 xOTK for creating a product/service
		"employ":  10000000, // 10 xOTK for employing someone
		"invest":  1000000,  // 1 xOTK for productive investment
		"donate":  2000000,  // 2 xOTK for donation
	}

	activity.XOTKEarned = rewardMap[activity.ActivityType]
	if activity.XOTKEarned == 0 {
		activity.XOTKEarned = 10000
	}
	activity.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("economic/%s/%d", activity.UID, activity.BlockHeight))
	bz, _ := json.Marshal(activity)
	store.Set(key, bz)

	k.updateEconomicProfile(ctx, activity)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"economic_activity",
		sdk.NewAttribute("uid", activity.UID),
		sdk.NewAttribute("type", activity.ActivityType),
		sdk.NewAttribute("xotk_earned", fmt.Sprintf("%d", activity.XOTKEarned)),
	))

	return nil
}

// GetEconomicProfile returns economic contribution profile.
func (k Keeper) GetEconomicProfile(ctx sdk.Context, uid string) EconomicProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("economic_profile/" + uid))
	if bz == nil {
		return EconomicProfile{UID: uid, EconomicLevel: "participant"}
	}
	var profile EconomicProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

func (k Keeper) updateEconomicProfile(ctx sdk.Context, activity EconomicActivity) {
	profile := k.GetEconomicProfile(ctx, activity.UID)
	profile.TotalXOTK += activity.XOTKEarned

	switch activity.ActivityType {
	case "trade":
		profile.TotalTrades++
	case "create":
		profile.TotalCreated++
	case "employ":
		profile.TotalEmployed++
	case "invest":
		profile.TotalInvested += activity.Amount
	case "donate":
		profile.TotalDonated += activity.Amount
	}

	profile.EconomicLevel = GetEconomicLevel(profile.TotalXOTK)

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("economic_profile/"+activity.UID), bz)
}
