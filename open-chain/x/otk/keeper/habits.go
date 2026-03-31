// Package keeper — Habit Tracking.
//
// Tracks daily habits for personal growth. Consistent habits
// earn hOTK. Streak bonuses multiply rewards.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Habit represents a tracked daily habit.
type Habit struct {
	ID          string `json:"id"`
	UID         string `json:"uid"`
	Name        string `json:"name"`
	Category    string `json:"category"` // health, learning, social, mindfulness, fitness, productivity
	Streak      int64  `json:"streak"`
	LongestStrk int64  `json:"longest_streak"`
	TotalDays   int64  `json:"total_days"`
	HOTKEarned  int64  `json:"hotk_earned"`
	LastDone    int64  `json:"last_done"` // block height
	CreatedAt   int64  `json:"created_at"`
}

// RecordHabitCompletion marks a habit as done for today.
func (k Keeper) RecordHabitCompletion(ctx sdk.Context, uid, habitID string) error {
	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("habit/%s/%s", uid, habitID)
	bz := store.Get([]byte(key))
	if bz == nil {
		return fmt.Errorf("habit not found")
	}

	var habit Habit
	_ = json.Unmarshal(bz, &habit)

	blocksPerDay := int64(14400)
	if ctx.BlockHeight()-habit.LastDone <= blocksPerDay*2 {
		habit.Streak++
	} else {
		habit.Streak = 1
	}

	if habit.Streak > habit.LongestStrk {
		habit.LongestStrk = habit.Streak
	}

	habit.TotalDays++
	habit.LastDone = ctx.BlockHeight()

	// hOTK reward: 50 per completion + 200 bonus per 7-day streak
	reward := int64(50000)
	if habit.Streak > 0 && habit.Streak%7 == 0 {
		reward += 200000
	}
	habit.HOTKEarned += reward

	updBz, _ := json.Marshal(habit)
	store.Set([]byte(key), updBz)

	return nil
}

// CreateHabit registers a new habit to track.
func (k Keeper) CreateHabit(ctx sdk.Context, uid, name, category string) (*Habit, error) {
	habit := Habit{
		ID:        fmt.Sprintf("hab_%s_%d", uid, ctx.BlockHeight()),
		UID:       uid,
		Name:      name,
		Category:  category,
		CreatedAt: ctx.BlockHeight(),
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(habit)
	store.Set([]byte(fmt.Sprintf("habit/%s/%s", uid, habit.ID)), bz)

	return &habit, nil
}
