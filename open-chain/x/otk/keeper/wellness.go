// Package keeper — Wellness & Preventive Health Tracking.
//
// Article III: hOTK represents healthcare, wellness, nutrition.
//
// Track wellness milestones: regular checkups, fitness goals,
// nutrition improvements, mental health care. Preventive health
// is valued — not just treatment after illness.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// WellnessMilestone tracks a health/wellness achievement.
type WellnessMilestone struct {
	UID           string `json:"uid"`
	Category      string `json:"category"`    // checkup, fitness, nutrition, mental_health, preventive
	Description   string `json:"description"`
	Frequency     string `json:"frequency"`   // one_time, daily, weekly, monthly, annual
	StreakDays    int64  `json:"streak_days"` // consecutive days maintained
	HOTKEarned    int64  `json:"hotk_earned"`
	Verified      bool   `json:"verified"`
	BlockHeight   int64  `json:"block_height"`
}

// WellnessProfile tracks a person's overall wellness engagement.
type WellnessProfile struct {
	UID                string `json:"uid"`
	CheckupCount       int64  `json:"checkup_count"`
	FitnessGoals       int64  `json:"fitness_goals"`
	NutritionMilestones int64 `json:"nutrition_milestones"`
	MentalHealthCare   int64  `json:"mental_health_care"`
	PreventiveCare     int64  `json:"preventive_care"`
	TotalHOTK          int64  `json:"total_hotk"`
	LongestStreak      int64  `json:"longest_streak"`
	WellnessScore      int64  `json:"wellness_score"` // 0-100
	WellnessLevel      string `json:"wellness_level"` // starting, aware, active, thriving, inspiring
}

// Wellness levels
func GetWellnessLevel(score int64) string {
	if score >= 80 { return "inspiring" }
	if score >= 60 { return "thriving" }
	if score >= 40 { return "active" }
	if score >= 20 { return "aware" }
	return "starting"
}

// RecordWellnessMilestone logs a wellness achievement.
func (k Keeper) RecordWellnessMilestone(ctx sdk.Context, milestone WellnessMilestone) error {
	if milestone.UID == "" {
		return fmt.Errorf("UID required")
	}

	// Calculate hOTK reward
	rewardMap := map[string]int64{
		"checkup":       500000,   // 0.5 hOTK per checkup
		"fitness":       200000,   // 0.2 hOTK per fitness goal
		"nutrition":     300000,   // 0.3 hOTK per nutrition milestone
		"mental_health": 500000,   // 0.5 hOTK for mental health care
		"preventive":    1000000,  // 1.0 hOTK for preventive care (vaccination, screening)
	}

	milestone.HOTKEarned = rewardMap[milestone.Category]
	if milestone.HOTKEarned == 0 {
		milestone.HOTKEarned = 200000
	}

	// Streak bonus: 10% extra per 7 consecutive days
	if milestone.StreakDays >= 7 {
		streakBonus := (milestone.StreakDays / 7) * (milestone.HOTKEarned / 10)
		milestone.HOTKEarned += streakBonus
	}

	milestone.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("wellness/%s/%d", milestone.UID, milestone.BlockHeight))
	bz, _ := json.Marshal(milestone)
	store.Set(key, bz)

	// Update profile
	k.updateWellnessProfile(ctx, milestone)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"wellness_milestone",
		sdk.NewAttribute("uid", milestone.UID),
		sdk.NewAttribute("category", milestone.Category),
		sdk.NewAttribute("hotk_earned", fmt.Sprintf("%d", milestone.HOTKEarned)),
		sdk.NewAttribute("streak_days", fmt.Sprintf("%d", milestone.StreakDays)),
	))

	return nil
}

// GetWellnessProfile returns a person's wellness profile.
func (k Keeper) GetWellnessProfile(ctx sdk.Context, uid string) WellnessProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("wellness_profile/" + uid))
	if bz == nil {
		return WellnessProfile{UID: uid, WellnessLevel: "starting"}
	}
	var profile WellnessProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

func (k Keeper) updateWellnessProfile(ctx sdk.Context, milestone WellnessMilestone) {
	profile := k.GetWellnessProfile(ctx, milestone.UID)
	profile.TotalHOTK += milestone.HOTKEarned

	switch milestone.Category {
	case "checkup":
		profile.CheckupCount++
	case "fitness":
		profile.FitnessGoals++
	case "nutrition":
		profile.NutritionMilestones++
	case "mental_health":
		profile.MentalHealthCare++
	case "preventive":
		profile.PreventiveCare++
	}

	if milestone.StreakDays > profile.LongestStreak {
		profile.LongestStreak = milestone.StreakDays
	}

	// Calculate wellness score (0-100)
	total := profile.CheckupCount + profile.FitnessGoals + profile.NutritionMilestones + profile.MentalHealthCare + profile.PreventiveCare
	profile.WellnessScore = min64(total*5, 100) // 5 points per milestone, cap at 100
	profile.WellnessLevel = GetWellnessLevel(profile.WellnessScore)

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("wellness_profile/"+milestone.UID), bz)
}
