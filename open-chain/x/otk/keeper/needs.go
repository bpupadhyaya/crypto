// Package keeper — Basic Needs Tracking.
//
// Article I, Section 3: "When people's basic needs are met, they are
// resilient against manipulation and exploitation."
//
// This module tracks whether communities' basic needs are being met.
// It's the foundation of the Chain of Causation:
//   Met needs → Resilient people → Harmony → Peace
//
// Categories: food, housing, healthcare, education, employment,
// community, safety, wellbeing

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// NeedsCategories are the basic human needs tracked.
var NeedsCategories = []string{
	"food",        // Food security
	"housing",     // Housing stability
	"healthcare",  // Healthcare access
	"education",   // Education access
	"employment",  // Employment opportunity
	"community",   // Community support
	"safety",      // Physical safety
	"wellbeing",   // Mental wellbeing
}

// NeedsAssessment is an individual's self-reported needs status.
type NeedsAssessment struct {
	UID         string          `json:"uid"`
	Scores      map[string]int  `json:"scores"`      // category → 1-5 (1=critical, 5=fully met)
	Region      string          `json:"region"`
	OverallScore int            `json:"overall_score"` // average 1-5
	BlockHeight int64           `json:"block_height"`
}

// RegionalNeeds aggregates needs data for a region.
type RegionalNeeds struct {
	Region           string          `json:"region"`
	CategoryScores   map[string]int64 `json:"category_scores"`   // category → average score (x100 for precision)
	FulfillmentScore int64           `json:"fulfillment_score"`  // 0-100
	AssessmentCount  int64           `json:"assessment_count"`
	MostCritical     string          `json:"most_critical"`      // category with lowest score
	LeastCritical    string          `json:"least_critical"`     // category with highest score
	LastUpdated      int64           `json:"last_updated"`
}

// ResourceOffer is someone offering to help meet a need.
type ResourceOffer struct {
	ProviderUID string `json:"provider_uid"`
	Category    string `json:"category"`
	Description string `json:"description"`
	Available   bool   `json:"available"`
	MatchCount  int64  `json:"match_count"` // successful matches
	BlockHeight int64  `json:"block_height"`
}

// NeedRequest is someone requesting help.
type NeedRequest struct {
	RequesterUID string `json:"requester_uid"`
	Category     string `json:"category"`
	Description  string `json:"description"`
	Urgency      int    `json:"urgency"` // 1-5 (5 = critical)
	Status       string `json:"status"`  // open, matched, resolved
	MatchedWith  string `json:"matched_with,omitempty"`
	BlockHeight  int64  `json:"block_height"`
}

// SubmitNeedsAssessment records an individual's needs status.
func (k Keeper) SubmitNeedsAssessment(ctx sdk.Context, assessment NeedsAssessment) error {
	if assessment.UID == "" {
		return fmt.Errorf("UID required")
	}

	// Calculate overall score
	total := 0
	count := 0
	for _, score := range assessment.Scores {
		total += score
		count++
	}
	if count > 0 {
		assessment.OverallScore = total / count
	}
	assessment.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(assessment)
	store.Set([]byte("needs/"+assessment.UID), bz)

	// Update regional aggregates
	if assessment.Region != "" {
		k.updateRegionalNeeds(ctx, assessment)
	}

	return nil
}

// GetRegionalNeeds returns aggregated needs data for a region.
func (k Keeper) GetRegionalNeeds(ctx sdk.Context, region string) RegionalNeeds {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("regional_needs/" + region))
	if bz == nil {
		return RegionalNeeds{
			Region:         region,
			CategoryScores: map[string]int64{},
		}
	}
	var rn RegionalNeeds
	_ = json.Unmarshal(bz, &rn)
	return rn
}

func (k Keeper) updateRegionalNeeds(ctx sdk.Context, assessment NeedsAssessment) {
	rn := k.GetRegionalNeeds(ctx, assessment.Region)
	rn.AssessmentCount++
	rn.LastUpdated = ctx.BlockHeight()

	if rn.CategoryScores == nil {
		rn.CategoryScores = map[string]int64{}
	}

	// Update running averages (simplified)
	var minScore int64 = 500
	var maxScore int64 = 0
	var minCat, maxCat string

	for cat, score := range assessment.Scores {
		// Running average: new_avg = old_avg + (new_val - old_avg) / count
		oldAvg := rn.CategoryScores[cat]
		newAvg := oldAvg + (int64(score)*100-oldAvg)/rn.AssessmentCount
		rn.CategoryScores[cat] = newAvg

		if newAvg < minScore {
			minScore = newAvg
			minCat = cat
		}
		if newAvg > maxScore {
			maxScore = newAvg
			maxCat = cat
		}
	}

	rn.MostCritical = minCat
	rn.LeastCritical = maxCat

	// Fulfillment score: average of all category scores, normalized to 0-100
	total := int64(0)
	catCount := int64(0)
	for _, score := range rn.CategoryScores {
		total += score
		catCount++
	}
	if catCount > 0 {
		rn.FulfillmentScore = total / catCount * 100 / 500 // normalize 1-5 → 0-100
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(rn)
	store.Set([]byte("regional_needs/"+assessment.Region), bz)
}
