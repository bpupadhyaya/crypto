// Package keeper — Regional Aggregate Value Tracking.
//
// Article X of The Human Constitution:
// "Nations are measured not by GDP, but by the aggregate human
// value their citizens create."
//
// This module tracks aggregate OTK metrics by region, enabling
// the self-correcting feedback loop described in Article V.

package keeper

import (
	"encoding/json"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// RegionalAggregate tracks total human value contribution for a region.
type RegionalAggregate struct {
	Region           string            `json:"region"`
	TotalPositiveOTK int64             `json:"total_positive_otk"`
	TotalNegativeOTK int64             `json:"total_negative_otk"`
	NetOTK           int64             `json:"net_otk"`
	ChannelBreakdown map[string]int64  `json:"channel_breakdown"` // channel → net OTK
	RegisteredUIDs   int64             `json:"registered_uids"`
	ActiveUIDs       int64             `json:"active_uids"`       // active in last 30 days
	GratitudeCount   int64             `json:"gratitude_count"`
	MilestoneCount   int64             `json:"milestone_count"`
	AvgContribution  int64             `json:"avg_contribution"`  // per UID
	HealthScore      int64             `json:"health_score"`      // 0-100
	LastUpdated      int64             `json:"last_updated"`
}

// DefaultRegions — initial set covering major world regions.
var DefaultRegions = []string{
	"global",
	"south-asia",       // India, Pakistan, Bangladesh, Nepal, Sri Lanka
	"east-asia",        // China, Japan, Korea
	"southeast-asia",   // Vietnam, Thailand, Philippines, Indonesia
	"east-africa",      // Kenya, Tanzania, Uganda, Ethiopia
	"west-africa",      // Nigeria, Ghana, Senegal
	"northern-europe",  // UK, Germany, Nordics
	"southern-europe",  // Spain, Italy, Greece
	"north-america",    // USA, Canada
	"south-america",    // Brazil, Argentina, Colombia
	"middle-east",      // UAE, Saudi, Turkey
	"oceania",          // Australia, NZ
}

// GetRegionalAggregate retrieves metrics for a region.
func (k Keeper) GetRegionalAggregate(ctx sdk.Context, region string) RegionalAggregate {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("region/" + region))
	if bz == nil {
		return RegionalAggregate{
			Region:           region,
			ChannelBreakdown: map[string]int64{},
		}
	}
	var ra RegionalAggregate
	_ = json.Unmarshal(bz, &ra)
	return ra
}

// GetAllRegionalAggregates returns metrics for all regions.
func (k Keeper) GetAllRegionalAggregates(ctx sdk.Context) []RegionalAggregate {
	var aggregates []RegionalAggregate
	for _, region := range DefaultRegions {
		aggregates = append(aggregates, k.GetRegionalAggregate(ctx, region))
	}
	return aggregates
}

// UpdateRegionalAggregate records value contribution to a region.
func (k Keeper) UpdateRegionalAggregate(ctx sdk.Context, region, channel string, amount int64, isPositive bool) {
	ra := k.GetRegionalAggregate(ctx, region)

	if isPositive {
		ra.TotalPositiveOTK += amount
	} else {
		ra.TotalNegativeOTK += amount
	}
	ra.NetOTK = ra.TotalPositiveOTK - ra.TotalNegativeOTK

	if ra.ChannelBreakdown == nil {
		ra.ChannelBreakdown = map[string]int64{}
	}
	if isPositive {
		ra.ChannelBreakdown[channel] += amount
	} else {
		ra.ChannelBreakdown[channel] -= amount
	}

	// Recalculate health score (0-100)
	if ra.RegisteredUIDs > 0 {
		ra.AvgContribution = ra.NetOTK / ra.RegisteredUIDs
		// Health score: based on activity, gratitude, and milestone completion
		activityScore := min64(ra.ActiveUIDs*100/ra.RegisteredUIDs, 40)   // max 40
		gratitudeScore := min64(ra.GratitudeCount*100/max64(ra.RegisteredUIDs, 1), 30)  // max 30
		milestoneScore := min64(ra.MilestoneCount*100/max64(ra.RegisteredUIDs, 1), 30)  // max 30
		ra.HealthScore = activityScore + gratitudeScore + milestoneScore
	}

	ra.LastUpdated = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(ra)
	store.Set([]byte("region/"+region), bz)

	// Also update global aggregate
	if region != "global" {
		k.UpdateRegionalAggregate(ctx, "global", channel, amount, isPositive)
	}
}

// RecordRegionalActivity records various activities for a region.
func (k Keeper) RecordRegionalActivity(ctx sdk.Context, region string, activityType string) {
	ra := k.GetRegionalAggregate(ctx, region)

	switch activityType {
	case "uid_registered":
		ra.RegisteredUIDs++
		ra.ActiveUIDs++
	case "gratitude":
		ra.GratitudeCount++
	case "milestone":
		ra.MilestoneCount++
	case "active":
		ra.ActiveUIDs++
	}

	ra.LastUpdated = ctx.BlockHeight()
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(ra)
	store.Set([]byte("region/"+region), bz)
}

// GetAlertRegions returns regions with health score below threshold (need attention).
func (k Keeper) GetAlertRegions(ctx sdk.Context, threshold int64) []RegionalAggregate {
	var alerts []RegionalAggregate
	for _, region := range DefaultRegions {
		ra := k.GetRegionalAggregate(ctx, region)
		if ra.HealthScore > 0 && ra.HealthScore < threshold {
			alerts = append(alerts, ra)
		}
	}
	return alerts
}

func min64(a, b int64) int64 {
	if a < b { return a }
	return b
}

func max64(a, b int64) int64 {
	if a > b { return a }
	return b
}

// GetRegionalLeaderboard returns regions ranked by net OTK.
func (k Keeper) GetRegionalLeaderboard(ctx sdk.Context) []RegionalAggregate {
	aggregates := k.GetAllRegionalAggregates(ctx)
	// Simple bubble sort by NetOTK descending
	for i := 0; i < len(aggregates); i++ {
		for j := i + 1; j < len(aggregates); j++ {
			if aggregates[j].NetOTK > aggregates[i].NetOTK {
				aggregates[i], aggregates[j] = aggregates[j], aggregates[i]
			}
		}
	}
	return aggregates
}
