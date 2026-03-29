// Package keeper — Civic Participation & Governance Value Tracking.
//
// Article III: gOTK represents civic participation, voting, policy, leadership.
// Article VI: One human, one vote. Every Universal ID holder has exactly one vote.
//
// This module tracks civic engagement: voting, proposals, discussions,
// community leadership. Engaged citizens earn gOTK.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// CivicActivity tracks a citizen's governance engagement.
type CivicActivity struct {
	UID           string `json:"uid"`
	ActivityType  string `json:"activity_type"` // vote, propose, discuss, lead, organize
	Description   string `json:"description"`
	ProposalID    string `json:"proposal_id,omitempty"`
	GOTKEarned    int64  `json:"gotk_earned"`
	BlockHeight   int64  `json:"block_height"`
}

// CivicProfile tracks a citizen's governance engagement profile.
type CivicProfile struct {
	UID              string `json:"uid"`
	TotalVotes       int64  `json:"total_votes"`
	TotalProposals   int64  `json:"total_proposals"`
	TotalDiscussions int64  `json:"total_discussions"`
	TotalGOTK        int64  `json:"total_gotk"`
	ParticipationRate int64 `json:"participation_rate_bps"` // basis points (10000 = 100%)
	CivicLevel       string `json:"civic_level"` // observer, voter, advocate, leader, statesperson
	LastActive       int64  `json:"last_active"`
}

// Civic levels based on activity
func GetCivicLevel(votes, proposals int64) string {
	total := votes + proposals*5 // proposals count 5x
	if total >= 100 { return "statesperson" }
	if total >= 50 { return "leader" }
	if total >= 20 { return "advocate" }
	if total >= 5 { return "voter" }
	return "observer"
}

// RecordCivicActivity logs a governance action and awards gOTK.
func (k Keeper) RecordCivicActivity(ctx sdk.Context, activity CivicActivity) error {
	if activity.UID == "" {
		return fmt.Errorf("UID required for civic activity")
	}

	// Calculate gOTK reward based on activity type
	rewardMap := map[string]int64{
		"vote":     100000,   // 0.1 gOTK per vote
		"propose":  1000000,  // 1 gOTK per proposal
		"discuss":  50000,    // 0.05 gOTK per discussion
		"lead":     2000000,  // 2 gOTK for leadership
		"organize": 500000,   // 0.5 gOTK for organizing
	}

	activity.GOTKEarned = rewardMap[activity.ActivityType]
	if activity.GOTKEarned == 0 {
		activity.GOTKEarned = 50000 // default
	}
	activity.BlockHeight = ctx.BlockHeight()

	// Store activity
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("civic/%s/%d", activity.UID, activity.BlockHeight))
	bz, _ := json.Marshal(activity)
	store.Set(key, bz)

	// Update civic profile
	k.updateCivicProfile(ctx, activity)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"civic_activity",
		sdk.NewAttribute("uid", activity.UID),
		sdk.NewAttribute("type", activity.ActivityType),
		sdk.NewAttribute("gotk_earned", fmt.Sprintf("%d", activity.GOTKEarned)),
	))

	return nil
}

// GetCivicProfile returns a citizen's governance engagement profile.
func (k Keeper) GetCivicProfile(ctx sdk.Context, uid string) CivicProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("civic_profile/" + uid))
	if bz == nil {
		return CivicProfile{UID: uid, CivicLevel: "observer"}
	}
	var profile CivicProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

// GetCivicActivities returns a citizen's governance activity history.
func (k Keeper) GetCivicActivities(ctx sdk.Context, uid string) []CivicActivity {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("civic/%s/", uid))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var activities []CivicActivity
	for ; iterator.Valid(); iterator.Next() {
		var a CivicActivity
		if err := json.Unmarshal(iterator.Value(), &a); err != nil {
			continue
		}
		activities = append(activities, a)
	}
	return activities
}

func (k Keeper) updateCivicProfile(ctx sdk.Context, activity CivicActivity) {
	profile := k.GetCivicProfile(ctx, activity.UID)
	profile.TotalGOTK += activity.GOTKEarned
	profile.LastActive = ctx.BlockHeight()

	switch activity.ActivityType {
	case "vote":
		profile.TotalVotes++
	case "propose":
		profile.TotalProposals++
	case "discuss":
		profile.TotalDiscussions++
	}

	profile.CivicLevel = GetCivicLevel(profile.TotalVotes, profile.TotalProposals)

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("civic_profile/"+activity.UID), bz)
}
