// Package keeper — Nurture Value Tracking.
//
// Article I: "The greatest investment any civilization can make is
// in the raising and education of its children."
// Article III: nOTK represents parenting, caregiving, emotional support.
//
// This is the HEART of Open Chain. Every sleepless night, every
// lullaby, every scraped knee tended, every bedtime story —
// all of it creates value that has never been measured before.
//
// nOTK is the channel that makes Open Chain different from every
// other blockchain. No other system in history has attempted to
// quantify and recognize the labor of love that parents provide.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// NurtureMilestone represents a parenting/caregiving achievement.
type NurtureMilestone struct {
	ParentUID     string `json:"parent_uid"`
	ChildUID      string `json:"child_uid"`
	MilestoneType string `json:"milestone_type"`
	Description   string `json:"description"`
	ChildAge      string `json:"child_age"`      // e.g., "3 months", "2 years"
	NOTKEarned    int64  `json:"notk_earned"`
	Verified      bool   `json:"verified"`
	BlockHeight   int64  `json:"block_height"`
}

// ParentProfile tracks a parent's nurture contributions.
type ParentProfile struct {
	UID                string `json:"uid"`
	ChildrenCount      int64  `json:"children_count"`
	TotalMilestones    int64  `json:"total_milestones"`
	TotalNOTK          int64  `json:"total_notk"`
	GratitudeReceived  int64  `json:"gratitude_received"` // from children
	GratitudeGiven     int64  `json:"gratitude_given"`    // to their own parents
	SleeplessNights    int64  `json:"sleepless_nights"`   // estimated/self-reported
	ParentLevel        string `json:"parent_level"`
	LongestCareStreak  int64  `json:"longest_care_streak"` // consecutive days
}

// Predefined nurture milestones (universal across cultures)
var NurtureMilestoneTypes = map[string]int64{
	"birth":           10000000,  // 10 nOTK — bringing life into the world
	"first_smile":     500000,    // 0.5 nOTK
	"first_word":      1000000,   // 1 nOTK
	"first_step":      1000000,   // 1 nOTK
	"first_year":      5000000,   // 5 nOTK — surviving the first year
	"potty_trained":   2000000,   // 2 nOTK
	"first_day_school": 3000000,  // 3 nOTK
	"reads_first_book": 2000000,  // 2 nOTK
	"rides_bicycle":   1000000,   // 1 nOTK
	"swims":           1000000,   // 1 nOTK
	"grade_level":     5000000,   // 5 nOTK — reading/math at grade level
	"teenager":        3000000,   // 3 nOTK — surviving the teen years
	"graduates":       10000000,  // 10 nOTK — completes education
	"independent":     5000000,   // 5 nOTK — becomes independent
	"daily_care":      100000,    // 0.1 nOTK — per day of consistent care
	"sleepless_night":  50000,    // 0.05 nOTK — yes, even this counts
}

// Parent levels
func GetParentLevel(notk int64) string {
	if notk >= 100000000000 { return "guardian_angel" } // 100k+ nOTK
	if notk >= 10000000000 { return "devoted" }         // 10k+
	if notk >= 1000000000 { return "loving" }            // 1k+
	if notk >= 100000000 { return "caring" }             // 100+
	return "new_parent"
}

// RecordNurtureMilestone logs a parenting milestone.
func (k Keeper) RecordNurtureMilestone(ctx sdk.Context, milestone NurtureMilestone) error {
	if milestone.ParentUID == "" || milestone.ChildUID == "" {
		return fmt.Errorf("parent and child UIDs required")
	}

	// Look up reward for this milestone type
	reward, exists := NurtureMilestoneTypes[milestone.MilestoneType]
	if !exists {
		reward = 500000 // default 0.5 nOTK for custom milestones
	}
	milestone.NOTKEarned = reward
	milestone.BlockHeight = ctx.BlockHeight()

	// Store
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("nurture/%s/%s/%d", milestone.ParentUID, milestone.ChildUID, milestone.BlockHeight))
	bz, _ := json.Marshal(milestone)
	store.Set(key, bz)

	// Update parent profile
	k.updateParentProfile(ctx, milestone)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"nurture_milestone",
		sdk.NewAttribute("parent_uid", milestone.ParentUID),
		sdk.NewAttribute("child_uid", milestone.ChildUID),
		sdk.NewAttribute("type", milestone.MilestoneType),
		sdk.NewAttribute("notk_earned", fmt.Sprintf("%d", milestone.NOTKEarned)),
		sdk.NewAttribute("child_age", milestone.ChildAge),
	))

	return nil
}

// GetParentProfile returns a parent's nurture profile.
func (k Keeper) GetParentProfile(ctx sdk.Context, uid string) ParentProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("parent_profile/" + uid))
	if bz == nil {
		return ParentProfile{UID: uid, ParentLevel: "new_parent"}
	}
	var profile ParentProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

// GetNurtureMilestones returns all nurture milestones for a parent.
func (k Keeper) GetNurtureMilestones(ctx sdk.Context, parentUID string) []NurtureMilestone {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("nurture/%s/", parentUID))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var milestones []NurtureMilestone
	for ; iterator.Valid(); iterator.Next() {
		var m NurtureMilestone
		if err := json.Unmarshal(iterator.Value(), &m); err != nil {
			continue
		}
		milestones = append(milestones, m)
	}
	return milestones
}

func (k Keeper) updateParentProfile(ctx sdk.Context, milestone NurtureMilestone) {
	profile := k.GetParentProfile(ctx, milestone.ParentUID)
	profile.TotalMilestones++
	profile.TotalNOTK += milestone.NOTKEarned

	if milestone.MilestoneType == "sleepless_night" {
		profile.SleeplessNights++
	}

	profile.ParentLevel = GetParentLevel(profile.TotalNOTK)

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("parent_profile/"+milestone.ParentUID), bz)
}
