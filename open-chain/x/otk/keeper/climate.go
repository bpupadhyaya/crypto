// Package keeper — Community Climate Action Tracking.
//
// Tracks community-level climate commitments, carbon budgets,
// and collective action toward environmental sustainability.
// Climate data feeds into both the Environmental Health score
// and the Peace Index.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ClimatePledge represents a personal or community climate commitment.
type ClimatePledge struct {
	ID          string  `json:"id"`
	UID         string  `json:"uid"`
	PledgeType  string  `json:"pledge_type"` // personal, household, community, organization
	Category    string  `json:"category"`    // energy, transport, food, waste, water, consumption
	Description string  `json:"description"`
	TargetKgCO2 float64 `json:"target_kg_co2"` // annual reduction target
	CurrentKg   float64 `json:"current_kg_co2"` // current annual emissions
	Progress    float64 `json:"progress"`       // 0-100%
	Status      string  `json:"status"`         // active, achieved, expired
	StartedAt   int64   `json:"started_at"`
	EndsAt      int64   `json:"ends_at"`
}

// CommunityCarbon tracks aggregate carbon data for a region.
type CommunityCarbon struct {
	Region           string  `json:"region"`
	TotalPledges     int64   `json:"total_pledges"`
	ActivePledges    int64   `json:"active_pledges"`
	AchievedPledges  int64   `json:"achieved_pledges"`
	TotalTargetKg    float64 `json:"total_target_kg"`
	TotalReducedKg   float64 `json:"total_reduced_kg"`
	PerCapitaKg      float64 `json:"per_capita_kg"`  // current per-person emissions
	TargetPerCapita  float64 `json:"target_per_capita"`
	CarbonScore      int64   `json:"carbon_score"` // 0-100
	LastUpdated      int64   `json:"last_updated"`
}

// SubmitClimatePledge records a new climate commitment.
func (k Keeper) SubmitClimatePledge(ctx sdk.Context, pledge ClimatePledge) error {
	if pledge.UID == "" || pledge.Category == "" {
		return fmt.Errorf("uid and category required")
	}

	pledge.Status = "active"
	pledge.StartedAt = ctx.BlockHeight()
	if pledge.EndsAt == 0 {
		pledge.EndsAt = ctx.BlockHeight() + 5256000 // ~1 year
	}
	if pledge.ID == "" {
		pledge.ID = fmt.Sprintf("clm_%s_%d", pledge.UID, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(pledge)
	store.Set([]byte("climate_pledge/"+pledge.ID), bz)

	// Update community carbon
	cc := k.GetCommunityCarbon(ctx, "global")
	cc.TotalPledges++
	cc.ActivePledges++
	cc.TotalTargetKg += pledge.TargetKgCO2
	cc.LastUpdated = ctx.BlockHeight()
	k.setCommunityCarbon(ctx, cc)

	ctx.EventManager().EmitEvent(sdk.NewEvent("climate_pledge_submitted",
		sdk.NewAttribute("id", pledge.ID),
		sdk.NewAttribute("uid", pledge.UID),
		sdk.NewAttribute("category", pledge.Category),
		sdk.NewAttribute("target_kg", fmt.Sprintf("%.1f", pledge.TargetKgCO2)),
	))

	return nil
}

// GetCommunityCarbon retrieves regional carbon stats.
func (k Keeper) GetCommunityCarbon(ctx sdk.Context, region string) *CommunityCarbon {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("community_carbon/" + region))
	if bz == nil {
		return &CommunityCarbon{Region: region, PerCapitaKg: 4500, TargetPerCapita: 2000, CarbonScore: 55}
	}
	var cc CommunityCarbon
	_ = json.Unmarshal(bz, &cc)
	return &cc
}

func (k Keeper) setCommunityCarbon(ctx sdk.Context, cc *CommunityCarbon) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(cc)
	store.Set([]byte("community_carbon/"+cc.Region), bz)
}
