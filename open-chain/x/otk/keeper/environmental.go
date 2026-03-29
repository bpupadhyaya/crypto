// Package keeper — Environmental Impact Tracking.
//
// Tracks environmental contributions as a dimension of human value.
// Environmental activities earn OTK across relevant channels:
//   - Tree planting → community OTK (cOTK)
//   - Cleanup drives → community OTK (cOTK)
//   - Renewable energy → economic OTK (xOTK)
//   - Water conservation → health OTK (hOTK)
//
// Regional environmental health scores feed into the Peace Index.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// EnvironmentalActivity represents a verified environmental contribution.
type EnvironmentalActivity struct {
	UID           string  `json:"uid"`
	ActivityType  string  `json:"activity_type"` // tree_planting, cleanup, recycling, renewable, water_conservation, composting, reforestation
	Description   string  `json:"description"`
	CarbonOffset  float64 `json:"carbon_offset_kg"` // estimated CO2 offset in kg
	OTKEarned     int64   `json:"otk_earned"`
	Channel       string  `json:"channel"` // which OTK channel
	Region        string  `json:"region"`
	Verified      bool    `json:"verified"`
	BlockHeight   int64   `json:"block_height"`
}

// EnvironmentalProfile tracks a person's cumulative environmental impact.
type EnvironmentalProfile struct {
	UID             string  `json:"uid"`
	TotalActivities int64   `json:"total_activities"`
	TotalCarbonKg   float64 `json:"total_carbon_offset_kg"`
	TotalOTKEarned  int64   `json:"total_otk_earned"`
	TreesPlanted    int64   `json:"trees_planted"`
	CleanupHours    int64   `json:"cleanup_hours"`
	RecyclingKg     float64 `json:"recycling_kg"`
	EcoScore        int64   `json:"eco_score"` // 0-100
	EcoLevel        string  `json:"eco_level"` // aware, active, champion, guardian, legend
	LastActive      int64   `json:"last_active"`
}

// RegionalEnvironmentalHealth tracks aggregate environmental metrics.
type RegionalEnvironmentalHealth struct {
	Region            string  `json:"region"`
	AirQualityScore   int64   `json:"air_quality_score"`   // 0-100
	WaterQualityScore int64   `json:"water_quality_score"`  // 0-100
	GreenCoverScore   int64   `json:"green_cover_score"`    // 0-100
	WasteManagement   int64   `json:"waste_management"`     // 0-100
	RenewableAdoption int64   `json:"renewable_adoption"`   // 0-100
	OverallScore      int64   `json:"overall_score"`        // 0-100 (feeds into Peace Index)
	TotalCarbonOffset float64 `json:"total_carbon_offset_kg"`
	ActiveParticipants int64  `json:"active_participants"`
	LastUpdated       int64   `json:"last_updated"`
}

// OTK rewards per activity type
var ecoRewards = map[string]int64{
	"tree_planting":      500000,  // 0.5 OTK per tree
	"cleanup":            200000,  // 0.2 OTK per hour
	"recycling":          100000,  // 0.1 OTK per kg
	"renewable":          1000000, // 1 OTK per installation
	"water_conservation": 300000,  // 0.3 OTK per activity
	"composting":         150000,  // 0.15 OTK per batch
	"reforestation":      2000000, // 2 OTK per hectare participation
}

// Carbon offset estimates per activity (kg CO2)
var carbonEstimates = map[string]float64{
	"tree_planting":      22.0,  // 22 kg/year per tree
	"cleanup":            5.0,   // indirect through waste diversion
	"recycling":          2.5,   // per kg recycled
	"renewable":          1000.0,// per solar panel installed
	"water_conservation": 3.0,   // per activity
	"composting":         8.0,   // per batch
	"reforestation":      500.0, // per hectare
}

func ecoChannel(activityType string) string {
	switch activityType {
	case "renewable":
		return "economic"
	case "water_conservation":
		return "health"
	default:
		return "community"
	}
}

func ecoLevel(score int64) string {
	switch {
	case score >= 90:
		return "legend"
	case score >= 70:
		return "guardian"
	case score >= 50:
		return "champion"
	case score >= 30:
		return "active"
	default:
		return "aware"
	}
}

// RecordEnvironmentalActivity records a verified environmental contribution.
func (k Keeper) RecordEnvironmentalActivity(ctx sdk.Context, activity EnvironmentalActivity) error {
	if activity.UID == "" || activity.ActivityType == "" {
		return fmt.Errorf("uid and activity_type are required")
	}

	reward, ok := ecoRewards[activity.ActivityType]
	if !ok {
		return fmt.Errorf("unknown activity type: %s", activity.ActivityType)
	}

	activity.OTKEarned = reward
	activity.Channel = ecoChannel(activity.ActivityType)
	activity.CarbonOffset = carbonEstimates[activity.ActivityType]
	activity.BlockHeight = ctx.BlockHeight()
	activity.Verified = true

	// Store activity
	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("eco/%s/%d", activity.UID, ctx.BlockHeight())
	bz, _ := json.Marshal(activity)
	store.Set([]byte(key), bz)

	// Update profile
	profile := k.GetEnvironmentalProfile(ctx, activity.UID)
	profile.TotalActivities++
	profile.TotalCarbonKg += activity.CarbonOffset
	profile.TotalOTKEarned += activity.OTKEarned
	profile.LastActive = ctx.BlockHeight()

	switch activity.ActivityType {
	case "tree_planting", "reforestation":
		profile.TreesPlanted++
	case "cleanup":
		profile.CleanupHours++
	case "recycling":
		profile.RecyclingKg += activity.CarbonOffset / 2.5
	}

	// Recalculate eco score
	profile.EcoScore = k.calculateEcoScore(profile)
	profile.EcoLevel = ecoLevel(profile.EcoScore)
	k.setEnvironmentalProfile(ctx, activity.UID, profile)

	// Update regional health
	if activity.Region != "" {
		k.updateRegionalEnvironment(ctx, activity.Region, activity)
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"environmental_activity",
		sdk.NewAttribute("uid", activity.UID),
		sdk.NewAttribute("type", activity.ActivityType),
		sdk.NewAttribute("carbon_offset_kg", fmt.Sprintf("%.1f", activity.CarbonOffset)),
		sdk.NewAttribute("otk_earned", fmt.Sprintf("%d", activity.OTKEarned)),
		sdk.NewAttribute("eco_score", fmt.Sprintf("%d", profile.EcoScore)),
	))

	return nil
}

func (k Keeper) calculateEcoScore(p *EnvironmentalProfile) int64 {
	score := int64(0)
	// Activity diversity (up to 30 points)
	if p.TreesPlanted > 0 { score += 10 }
	if p.CleanupHours > 0 { score += 10 }
	if p.RecyclingKg > 0 { score += 10 }
	// Volume (up to 40 points)
	if p.TotalActivities > 50 { score += 40 } else { score += p.TotalActivities * 40 / 50 }
	// Carbon impact (up to 30 points)
	if p.TotalCarbonKg > 1000 { score += 30 } else { score += int64(p.TotalCarbonKg) * 30 / 1000 }
	if score > 100 { score = 100 }
	return score
}

// GetEnvironmentalProfile retrieves a person's environmental profile.
func (k Keeper) GetEnvironmentalProfile(ctx sdk.Context, uid string) *EnvironmentalProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("eco_profile/" + uid))
	if bz == nil {
		return &EnvironmentalProfile{UID: uid}
	}
	var p EnvironmentalProfile
	_ = json.Unmarshal(bz, &p)
	return &p
}

func (k Keeper) setEnvironmentalProfile(ctx sdk.Context, uid string, p *EnvironmentalProfile) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(p)
	store.Set([]byte("eco_profile/"+uid), bz)
}

// GetRegionalEnvironmentalHealth retrieves environmental health for a region.
func (k Keeper) GetRegionalEnvironmentalHealth(ctx sdk.Context, region string) *RegionalEnvironmentalHealth {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("eco_region/" + region))
	if bz == nil {
		return &RegionalEnvironmentalHealth{Region: region, AirQualityScore: 50, WaterQualityScore: 50, GreenCoverScore: 50, WasteManagement: 50, RenewableAdoption: 30, OverallScore: 46}
	}
	var h RegionalEnvironmentalHealth
	_ = json.Unmarshal(bz, &h)
	return &h
}

func (k Keeper) updateRegionalEnvironment(ctx sdk.Context, region string, activity EnvironmentalActivity) {
	h := k.GetRegionalEnvironmentalHealth(ctx, region)
	h.TotalCarbonOffset += activity.CarbonOffset
	h.ActiveParticipants++
	h.LastUpdated = ctx.BlockHeight()

	// Nudge relevant scores based on activity type
	switch activity.ActivityType {
	case "tree_planting", "reforestation":
		if h.GreenCoverScore < 100 { h.GreenCoverScore++ }
	case "cleanup", "recycling", "composting":
		if h.WasteManagement < 100 { h.WasteManagement++ }
	case "water_conservation":
		if h.WaterQualityScore < 100 { h.WaterQualityScore++ }
	case "renewable":
		if h.RenewableAdoption < 100 { h.RenewableAdoption++ }
	}

	h.OverallScore = (h.AirQualityScore + h.WaterQualityScore + h.GreenCoverScore + h.WasteManagement + h.RenewableAdoption) / 5

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(h)
	store.Set([]byte("eco_region/"+region), bz)
}
