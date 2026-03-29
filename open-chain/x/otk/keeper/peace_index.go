// Package keeper — Open Chain Peace Index.
//
// Article X, Section 1: "We envision a world where..."
// - Every parent knows their sacrifice is seen and valued
// - Every teacher knows their impact ripples through generations
// - Communities compete for quality of human beings they raise
// - Nations are measured by aggregate human value
// - War becomes irrational because every person's needs are met
//
// The Peace Index is a composite score (0-100) measuring progress
// toward this vision. It's the ultimate metric of The Human Constitution.

package keeper

import (
	"encoding/json"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// PeaceIndex is the composite score measuring progress toward world peace.
type PeaceIndex struct {
	Score               int64  `json:"score"`                // 0-100
	NeedsMetScore       int64  `json:"needs_met_score"`       // Are basic needs addressed?
	EducationScore      int64  `json:"education_score"`       // Are children being educated?
	CommunityHealth     int64  `json:"community_health"`      // Are communities thriving?
	GovernanceScore     int64  `json:"governance_score"`       // Are citizens engaged?
	GratitudeDensity    int64  `json:"gratitude_density"`      // How much appreciation flows?
	CorrectionBalance   int64  `json:"correction_balance"`     // Are problems being addressed?
	Region              string `json:"region"`
	TotalUIDs           int64  `json:"total_uids"`
	TotalMilestones     int64  `json:"total_milestones"`
	TotalGratitude      int64  `json:"total_gratitude"`
	Trend               string `json:"trend"`                 // improving, stable, declining
	LastUpdated         int64  `json:"last_updated"`
}

// CalculatePeaceIndex computes the peace index for a region.
func (k Keeper) CalculatePeaceIndex(ctx sdk.Context, region string) PeaceIndex {
	ra := k.GetRegionalAggregate(ctx, region)

	// Each component scored 0-100, then weighted averaged
	var needsMet, education, community, governance, gratitude, correction int64

	// Needs Met: based on net positive value flow
	if ra.NetOTK > 0 && ra.RegisteredUIDs > 0 {
		avgValue := ra.NetOTK / ra.RegisteredUIDs
		needsMet = min64(avgValue/1000000, 100) // 1 OTK per person = 100
	}

	// Education: based on education channel activity
	eduOTK := ra.ChannelBreakdown["education"]
	if ra.RegisteredUIDs > 0 && eduOTK > 0 {
		education = min64(eduOTK/(ra.RegisteredUIDs*500000), 100) // 0.5 eOTK per person = 100
	}

	// Community Health: from the health score already calculated
	community = ra.HealthScore

	// Governance: participation rate
	if ra.RegisteredUIDs > 0 && ra.ActiveUIDs > 0 {
		governance = min64(ra.ActiveUIDs*100/ra.RegisteredUIDs, 100)
	}

	// Gratitude Density: gratitude transactions per person
	if ra.RegisteredUIDs > 0 && ra.GratitudeCount > 0 {
		gratitude = min64(ra.GratitudeCount*20/ra.RegisteredUIDs, 100) // 5 gratitude per person = 100
	}

	// Correction Balance: ratio of positive to negative (higher = better)
	if ra.TotalPositiveOTK > 0 {
		if ra.TotalNegativeOTK == 0 {
			correction = 100 // No negative = perfect
		} else {
			ratio := ra.TotalPositiveOTK / max64(ra.TotalNegativeOTK, 1)
			correction = min64(ratio*10, 100) // 10:1 positive:negative = 100
		}
	}

	// Weighted composite (all dimensions equally important)
	score := (needsMet + education + community + governance + gratitude + correction) / 6

	// Determine trend
	trend := "stable"
	stored := k.getStoredPeaceIndex(ctx, region)
	if stored.Score > 0 {
		if score > stored.Score+2 {
			trend = "improving"
		} else if score < stored.Score-2 {
			trend = "declining"
		}
	}

	index := PeaceIndex{
		Score:             score,
		NeedsMetScore:     needsMet,
		EducationScore:    education,
		CommunityHealth:   community,
		GovernanceScore:   governance,
		GratitudeDensity:  gratitude,
		CorrectionBalance: correction,
		Region:            region,
		TotalUIDs:         ra.RegisteredUIDs,
		TotalMilestones:   ra.MilestoneCount,
		TotalGratitude:    ra.GratitudeCount,
		Trend:             trend,
		LastUpdated:       ctx.BlockHeight(),
	}

	// Store for trend calculation
	k.storePeaceIndex(ctx, &index)

	return index
}

// GetGlobalPeaceIndex computes the worldwide peace index.
func (k Keeper) GetGlobalPeaceIndex(ctx sdk.Context) PeaceIndex {
	return k.CalculatePeaceIndex(ctx, "global")
}

// GetAllRegionalPeaceIndices computes peace index for all regions.
func (k Keeper) GetAllRegionalPeaceIndices(ctx sdk.Context) []PeaceIndex {
	var indices []PeaceIndex
	for _, region := range DefaultRegions {
		indices = append(indices, k.CalculatePeaceIndex(ctx, region))
	}
	return indices
}

func (k Keeper) getStoredPeaceIndex(ctx sdk.Context, region string) PeaceIndex {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("peace_index/" + region))
	if bz == nil {
		return PeaceIndex{Region: region}
	}
	var index PeaceIndex
	_ = json.Unmarshal(bz, &index)
	return index
}

func (k Keeper) storePeaceIndex(ctx sdk.Context, index *PeaceIndex) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(index)
	store.Set([]byte("peace_index/"+index.Region), bz)
}
