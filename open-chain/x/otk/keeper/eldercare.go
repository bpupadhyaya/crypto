// Package keeper — Eldercare Value Tracking.
//
// Article I: "Caring for those who cared for us — the cycle that defines humanity."
// The Human Constitution recognizes value at every life stage, including elder years.
//
// This module tracks eldercare contributions and caregiver impact.
// When caregivers support elders — companionship, medical support, daily living,
// transportation, emotional support — they earn nOTK proportional to hours invested,
// making this invisible labor visible on-chain.

package keeper

import (
	"encoding/json"
	"fmt"
	"sort"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// EldercareActivity tracks a single eldercare contribution.
type EldercareActivity struct {
	CaregiverUID string `json:"caregiver_uid"`
	ElderUID     string `json:"elder_uid"`
	CareType     string `json:"care_type"` // companionship, medical, daily_living, transport, emotional
	Hours        int64  `json:"hours"`
	Description  string `json:"description"`
	NOTKEarned   int64  `json:"notk_earned"`
	BlockHeight  int64  `json:"block_height"`
}

// CaregiverProfile tracks a caregiver's cumulative eldercare impact.
type CaregiverProfile struct {
	UID             string `json:"uid"`
	EldersSupported int64  `json:"elders_supported"`
	TotalHours      int64  `json:"total_hours"`
	TotalNOTK       int64  `json:"total_notk"`
	CareLevel       string `json:"care_level"` // helper, companion, caregiver, guardian, angel
}

// caregiverLevel returns the level string based on total hours of eldercare.
// helper (0-50h), companion (51-200h), caregiver (201-500h), guardian (501-1000h), angel (1000+h)
func caregiverLevel(hours int64) string {
	switch {
	case hours > 1000:
		return "angel"
	case hours > 500:
		return "guardian"
	case hours > 200:
		return "caregiver"
	case hours > 50:
		return "companion"
	default:
		return "helper"
	}
}

// notkForEldercare calculates the nOTK reward for an eldercare activity.
// Base: 100 nOTK per hour, with a care-type multiplier.
// Medical support and daily living get a 1.5x multiplier (more demanding).
func notkForEldercare(hours int64, careType string) int64 {
	base := hours * 100 // 100 micro-nOTK per hour
	switch careType {
	case "medical":
		base = base * 150 / 100 // 1.5x for medical support
	case "daily_living":
		base = base * 150 / 100 // 1.5x for daily living assistance
	case "transport":
		base = base * 120 / 100 // 1.2x for transportation
	case "emotional":
		base = base * 110 / 100 // 1.1x for emotional support
	default:
		// companionship: 1.0x base rate
	}
	return base
}

// RecordEldercareActivity records a caregiver's eldercare contribution
// and updates their profile with accumulated hours, nOTK, and care level.
func (k Keeper) RecordEldercareActivity(ctx sdk.Context, activity EldercareActivity) error {
	if activity.CaregiverUID == "" {
		return fmt.Errorf("caregiver UID required")
	}
	if activity.ElderUID == "" {
		return fmt.Errorf("elder UID required")
	}
	if activity.Hours <= 0 {
		return fmt.Errorf("hours must be positive")
	}
	if activity.CareType == "" {
		return fmt.Errorf("care type required")
	}

	activity.BlockHeight = ctx.BlockHeight()
	activity.NOTKEarned = notkForEldercare(activity.Hours, activity.CareType)

	// Store the activity record
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("eldercare/%s/%d", activity.CaregiverUID, activity.BlockHeight))
	bz, _ := json.Marshal(activity)
	store.Set(key, bz)

	// Update caregiver profile
	k.updateCaregiverProfile(ctx, activity)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"eldercare_activity",
		sdk.NewAttribute("caregiver_uid", activity.CaregiverUID),
		sdk.NewAttribute("elder_uid", activity.ElderUID),
		sdk.NewAttribute("care_type", activity.CareType),
		sdk.NewAttribute("hours", fmt.Sprintf("%d", activity.Hours)),
		sdk.NewAttribute("notk_earned", fmt.Sprintf("%d", activity.NOTKEarned)),
	))

	return nil
}

// GetCaregiverProfile returns a caregiver's cumulative eldercare profile.
func (k Keeper) GetCaregiverProfile(ctx sdk.Context, uid string) CaregiverProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("caregiver_profile/" + uid))
	if bz == nil {
		return CaregiverProfile{UID: uid, CareLevel: "helper"}
	}
	var profile CaregiverProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

// GetTopCaregivers returns the top caregivers by total hours, up to limit.
func (k Keeper) GetTopCaregivers(ctx sdk.Context, limit int) []CaregiverProfile {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("caregiver_profile/")
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var profiles []CaregiverProfile
	for ; iterator.Valid(); iterator.Next() {
		var p CaregiverProfile
		if err := json.Unmarshal(iterator.Value(), &p); err != nil {
			continue
		}
		profiles = append(profiles, p)
	}

	// Sort by total hours descending
	sort.Slice(profiles, func(i, j int) bool {
		return profiles[i].TotalHours > profiles[j].TotalHours
	})

	if limit > 0 && len(profiles) > limit {
		profiles = profiles[:limit]
	}
	return profiles
}

// GetEldercareActivities returns all eldercare records for a caregiver.
func (k Keeper) GetEldercareActivities(ctx sdk.Context, uid string) []EldercareActivity {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("eldercare/%s/", uid))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var activities []EldercareActivity
	for ; iterator.Valid(); iterator.Next() {
		var a EldercareActivity
		if err := json.Unmarshal(iterator.Value(), &a); err != nil {
			continue
		}
		activities = append(activities, a)
	}
	return activities
}

// updateCaregiverProfile recalculates a caregiver's profile after a new activity.
func (k Keeper) updateCaregiverProfile(ctx sdk.Context, activity EldercareActivity) {
	profile := k.GetCaregiverProfile(ctx, activity.CaregiverUID)
	profile.TotalHours += activity.Hours
	profile.TotalNOTK += activity.NOTKEarned
	profile.CareLevel = caregiverLevel(profile.TotalHours)

	// Track unique elders supported
	if !k.hasEldercareRelation(ctx, activity.CaregiverUID, activity.ElderUID) {
		profile.EldersSupported++
		k.recordEldercareRelation(ctx, activity.CaregiverUID, activity.ElderUID)
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("caregiver_profile/"+profile.UID), bz)
}

// hasEldercareRelation checks if a caregiver-elder relationship already exists.
func (k Keeper) hasEldercareRelation(ctx sdk.Context, caregiverUID, elderUID string) bool {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("eldercare_rel/%s/%s", caregiverUID, elderUID))
	return store.Has(key)
}

// recordEldercareRelation records a new caregiver-elder relationship.
func (k Keeper) recordEldercareRelation(ctx sdk.Context, caregiverUID, elderUID string) {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("eldercare_rel/%s/%s", caregiverUID, elderUID))
	store.Set(key, []byte("1"))
}
