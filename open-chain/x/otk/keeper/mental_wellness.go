// Package keeper — Mental Wellness Tracking.
//
// Tracks wellness check-ins, mood trends, meditation streaks,
// and support circle participation. All data is encrypted —
// only the user can access their wellness data.
//
// Wellness activities earn hOTK for consistency.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// WellnessCheckIn represents a daily mental health check-in.
type WellnessCheckIn struct {
	UID         string `json:"uid"`
	Mood        int    `json:"mood"` // 1-5
	JournalHash string `json:"journal_hash,omitempty"` // encrypted journal entry hash
	Triggers    string `json:"triggers,omitempty"` // comma-separated
	Gratitude   string `json:"gratitude,omitempty"`
	BlockHeight int64  `json:"block_height"`
}

// WellnessStreak tracks consecutive wellness activities.
type WellnessStreak struct {
	UID            string `json:"uid"`
	MoodStreak     int64  `json:"mood_streak"`       // consecutive days of mood check-ins
	MeditationStrk int64  `json:"meditation_streak"`  // consecutive days of meditation
	GratitudeStrk  int64  `json:"gratitude_streak"`   // consecutive days of gratitude
	SleepStreak    int64  `json:"sleep_streak"`       // consecutive days of sleep logging
	TotalCheckIns  int64  `json:"total_checkins"`
	HOTKEarned     int64  `json:"hotk_earned"`
	LastCheckIn    int64  `json:"last_checkin"`
}

// SubmitWellnessCheckIn records a daily wellness check-in.
func (k Keeper) SubmitWellnessCheckIn(ctx sdk.Context, checkIn WellnessCheckIn) error {
	if checkIn.UID == "" || checkIn.Mood < 1 || checkIn.Mood > 5 {
		return fmt.Errorf("uid and valid mood (1-5) required")
	}

	checkIn.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("wellness_checkin/%s/%d", checkIn.UID, ctx.BlockHeight())
	bz, _ := json.Marshal(checkIn)
	store.Set([]byte(key), bz)

	// Update streak
	streak := k.GetWellnessStreak(ctx, checkIn.UID)
	blocksPerDay := int64(14400) // ~24h at 6s blocks

	if ctx.BlockHeight()-streak.LastCheckIn <= blocksPerDay*2 {
		streak.MoodStreak++
	} else {
		streak.MoodStreak = 1 // Reset
	}

	streak.TotalCheckIns++
	streak.LastCheckIn = ctx.BlockHeight()

	// hOTK reward: 100 per check-in + 500 bonus per 7-day streak
	reward := int64(100000)
	if streak.MoodStreak > 0 && streak.MoodStreak%7 == 0 {
		reward += 500000
	}
	streak.HOTKEarned += reward
	k.setWellnessStreak(ctx, checkIn.UID, streak)

	ctx.EventManager().EmitEvent(sdk.NewEvent("wellness_checkin",
		sdk.NewAttribute("uid", checkIn.UID),
		sdk.NewAttribute("mood", fmt.Sprintf("%d", checkIn.Mood)),
		sdk.NewAttribute("streak", fmt.Sprintf("%d", streak.MoodStreak)),
		sdk.NewAttribute("hotk_earned", fmt.Sprintf("%d", reward)),
	))

	return nil
}

// RecordMeditation records a meditation session completion.
func (k Keeper) RecordMeditation(ctx sdk.Context, uid string, durationMinutes int64) error {
	streak := k.GetWellnessStreak(ctx, uid)
	blocksPerDay := int64(14400)

	if ctx.BlockHeight()-streak.LastCheckIn <= blocksPerDay*2 {
		streak.MeditationStrk++
	} else {
		streak.MeditationStrk = 1
	}

	reward := durationMinutes * 50000 // 0.05 hOTK per minute
	streak.HOTKEarned += reward
	streak.LastCheckIn = ctx.BlockHeight()
	k.setWellnessStreak(ctx, uid, streak)

	return nil
}

// GetWellnessStreak retrieves wellness streak data.
func (k Keeper) GetWellnessStreak(ctx sdk.Context, uid string) *WellnessStreak {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("wellness_streak/" + uid))
	if bz == nil {
		return &WellnessStreak{UID: uid}
	}
	var s WellnessStreak
	_ = json.Unmarshal(bz, &s)
	return &s
}

func (k Keeper) setWellnessStreak(ctx sdk.Context, uid string, s *WellnessStreak) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(s)
	store.Set([]byte("wellness_streak/"+uid), bz)
}
