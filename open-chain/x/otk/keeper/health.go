// Package keeper — Health Value Tracking.
//
// Article III: hOTK represents healthcare, wellness, nutrition.
//
// Tracks health milestones: vaccination, wellness checkups, community
// health initiatives. Healthcare workers earn hOTK when their patients
// achieve health milestones.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// HealthMilestone tracks a health achievement.
type HealthMilestone struct {
	PatientUID     string   `json:"patient_uid"`
	MilestoneType  string   `json:"milestone_type"` // vaccination, checkup, nutrition, fitness, mental_health
	Description    string   `json:"description"`
	HealthWorkerUIDs []string `json:"health_worker_uids"` // contributing healthcare workers
	Verified       bool     `json:"verified"`
	BlockHeight    int64    `json:"block_height"`
}

// CommunityHealthStats tracks health metrics for a community/region.
type CommunityHealthStats struct {
	Region              string `json:"region"`
	VaccinationRate     int64  `json:"vaccination_rate_bps"`     // basis points (9500 = 95%)
	WellnessCheckupRate int64  `json:"wellness_checkup_rate_bps"`
	NutritionScore      int64  `json:"nutrition_score"`          // 0-100
	MentalHealthScore   int64  `json:"mental_health_score"`      // 0-100
	HealthWorkerCount   int64  `json:"health_worker_count"`
	MilestonesCompleted int64  `json:"milestones_completed"`
	TotalHOTKMinted     int64  `json:"total_hotk_minted"`
	LastUpdated         int64  `json:"last_updated"`
}

// RecordHealthMilestone records a health achievement.
func (k Keeper) RecordHealthMilestone(ctx sdk.Context, milestone HealthMilestone) error {
	if milestone.PatientUID == "" {
		return fmt.Errorf("patient UID required")
	}

	milestone.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("health_milestone/%s/%d", milestone.PatientUID, milestone.BlockHeight))
	bz, _ := json.Marshal(milestone)
	store.Set(key, bz)

	// Update community health stats for the patient's region
	// (Region would be determined from the patient's selective disclosure)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"health_milestone",
		sdk.NewAttribute("patient_uid", milestone.PatientUID),
		sdk.NewAttribute("type", milestone.MilestoneType),
		sdk.NewAttribute("health_workers", fmt.Sprintf("%d", len(milestone.HealthWorkerUIDs))),
	))

	return nil
}

// GetHealthMilestones returns all health milestones for a patient.
func (k Keeper) GetHealthMilestones(ctx sdk.Context, patientUID string) []HealthMilestone {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("health_milestone/%s/", patientUID))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var milestones []HealthMilestone
	for ; iterator.Valid(); iterator.Next() {
		var m HealthMilestone
		if err := json.Unmarshal(iterator.Value(), &m); err != nil {
			continue
		}
		milestones = append(milestones, m)
	}
	return milestones
}

// GetCommunityHealthStats returns health metrics for a region.
func (k Keeper) GetCommunityHealthStats(ctx sdk.Context, region string) CommunityHealthStats {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("community_health/" + region))
	if bz == nil {
		return CommunityHealthStats{Region: region}
	}
	var stats CommunityHealthStats
	_ = json.Unmarshal(bz, &stats)
	return stats
}

// UpdateCommunityHealthStats recalculates health metrics for a region.
func (k Keeper) UpdateCommunityHealthStats(ctx sdk.Context, region string, milestoneType string) {
	stats := k.GetCommunityHealthStats(ctx, region)
	stats.MilestonesCompleted++
	stats.LastUpdated = ctx.BlockHeight()

	switch milestoneType {
	case "vaccination":
		stats.VaccinationRate += 10 // simplified — real implementation would calculate from population
	case "checkup":
		stats.WellnessCheckupRate += 10
	case "nutrition":
		if stats.NutritionScore < 100 {
			stats.NutritionScore++
		}
	case "mental_health":
		if stats.MentalHealthScore < 100 {
			stats.MentalHealthScore++
		}
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(stats)
	store.Set([]byte("community_health/"+region), bz)
}
