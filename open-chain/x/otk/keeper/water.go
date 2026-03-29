// Package keeper — Water & Sanitation Tracking.
//
// Clean water and sanitation are fundamental to human life.
// This module tracks:
//   - Water source registration and quality testing
//   - Sanitation infrastructure projects
//   - Regional water access scores
//   - Issue reporting and resolution
//
// Water activities earn hOTK (health channel).

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// WaterSource represents a community water access point.
type WaterSource struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	SourceType   string  `json:"source_type"` // well, purification, rainwater, spring, municipal
	Region       string  `json:"region"`
	Capacity     int64   `json:"capacity_liters_daily"`
	Quality      int64   `json:"quality_score"` // 0-100
	Households   int64   `json:"households_served"`
	LastTested   int64   `json:"last_tested"` // block height
	Status       string  `json:"status"`      // active, maintenance, contaminated, offline
	RegisteredBy string  `json:"registered_by"`
	RegisteredAt int64   `json:"registered_at"`
}

// WaterQualityTest records a water quality test result.
type WaterQualityTest struct {
	SourceID    string  `json:"source_id"`
	TesterUID   string  `json:"tester_uid"`
	pH          float64 `json:"ph"`
	Turbidity   float64 `json:"turbidity_ntu"`
	Bacteria    string  `json:"bacteria"`    // safe, warning, unsafe
	Chemicals   string  `json:"chemicals"`   // safe, warning, unsafe
	Overall     string  `json:"overall"`     // safe, warning, unsafe
	BlockHeight int64   `json:"block_height"`
	Verified    bool    `json:"verified"`
}

// WaterIssue represents a reported water/sanitation problem.
type WaterIssue struct {
	ID          string `json:"id"`
	ReporterUID string `json:"reporter_uid"`
	IssueType   string `json:"issue_type"` // contamination, shortage, infrastructure, flooding
	Region      string `json:"region"`
	Description string `json:"description"`
	Severity    string `json:"severity"` // low, medium, high, critical
	Status      string `json:"status"`   // open, investigating, resolving, resolved
	ReportedAt  int64  `json:"reported_at"`
	ResolvedAt  int64  `json:"resolved_at,omitempty"`
	Confirms    int64  `json:"confirms"` // community confirmation count
}

// RegionalWaterScore tracks aggregate water access for a region.
type RegionalWaterScore struct {
	Region           string `json:"region"`
	CleanWaterAccess int64  `json:"clean_water_access"` // 0-100
	SanitationAccess int64  `json:"sanitation_access"`  // 0-100
	Infrastructure   int64  `json:"infrastructure"`     // 0-100
	OverallScore     int64  `json:"overall_score"`      // 0-100
	Sources          int64  `json:"sources"`
	OpenIssues       int64  `json:"open_issues"`
	LastUpdated      int64  `json:"last_updated"`
}

// RegisterWaterSource adds a community water source.
func (k Keeper) RegisterWaterSource(ctx sdk.Context, source WaterSource) error {
	if source.Name == "" || source.Region == "" {
		return fmt.Errorf("name and region are required")
	}

	source.Status = "active"
	source.RegisteredAt = ctx.BlockHeight()
	if source.ID == "" {
		source.ID = fmt.Sprintf("ws_%s_%d", source.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(source)
	store.Set([]byte("water_source/"+source.ID), bz)

	// Update regional score
	k.updateWaterScore(ctx, source.Region, 1, 0)

	ctx.EventManager().EmitEvent(sdk.NewEvent("water_source_registered",
		sdk.NewAttribute("id", source.ID),
		sdk.NewAttribute("type", source.SourceType),
		sdk.NewAttribute("region", source.Region),
	))

	return nil
}

// SubmitWaterTest records a water quality test.
func (k Keeper) SubmitWaterTest(ctx sdk.Context, test WaterQualityTest) error {
	if test.SourceID == "" || test.TesterUID == "" {
		return fmt.Errorf("source_id and tester_uid are required")
	}

	test.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("water_test/%s/%d", test.SourceID, ctx.BlockHeight())
	bz, _ := json.Marshal(test)
	store.Set([]byte(key), bz)

	// Update source quality and last tested
	sourceBz := store.Get([]byte("water_source/" + test.SourceID))
	if sourceBz != nil {
		var source WaterSource
		_ = json.Unmarshal(sourceBz, &source)
		source.LastTested = ctx.BlockHeight()
		if test.Overall == "unsafe" {
			source.Status = "contaminated"
		}
		updBz, _ := json.Marshal(source)
		store.Set([]byte("water_source/"+source.ID), updBz)
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent("water_quality_tested",
		sdk.NewAttribute("source_id", test.SourceID),
		sdk.NewAttribute("tester", test.TesterUID),
		sdk.NewAttribute("overall", test.Overall),
	))

	return nil
}

// ReportWaterIssue files a water/sanitation issue report.
func (k Keeper) ReportWaterIssue(ctx sdk.Context, issue WaterIssue) error {
	if issue.ReporterUID == "" || issue.IssueType == "" {
		return fmt.Errorf("reporter and issue_type are required")
	}

	issue.Status = "open"
	issue.ReportedAt = ctx.BlockHeight()
	issue.Confirms = 1
	if issue.ID == "" {
		issue.ID = fmt.Sprintf("wi_%s_%d", issue.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(issue)
	store.Set([]byte("water_issue/"+issue.ID), bz)

	// Update regional score (increment open issues)
	k.updateWaterScore(ctx, issue.Region, 0, 1)

	ctx.EventManager().EmitEvent(sdk.NewEvent("water_issue_reported",
		sdk.NewAttribute("id", issue.ID),
		sdk.NewAttribute("type", issue.IssueType),
		sdk.NewAttribute("severity", issue.Severity),
		sdk.NewAttribute("region", issue.Region),
	))

	return nil
}

// GetRegionalWaterScore retrieves water access score for a region.
func (k Keeper) GetRegionalWaterScore(ctx sdk.Context, region string) *RegionalWaterScore {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("water_score/" + region))
	if bz == nil {
		return &RegionalWaterScore{Region: region, CleanWaterAccess: 50, SanitationAccess: 50, Infrastructure: 50, OverallScore: 50}
	}
	var s RegionalWaterScore
	_ = json.Unmarshal(bz, &s)
	return &s
}

func (k Keeper) updateWaterScore(ctx sdk.Context, region string, newSources, newIssues int64) {
	s := k.GetRegionalWaterScore(ctx, region)
	s.Sources += newSources
	s.OpenIssues += newIssues
	s.LastUpdated = ctx.BlockHeight()

	// Recalculate: more sources = higher access, more issues = lower score
	if newSources > 0 && s.CleanWaterAccess < 100 {
		s.CleanWaterAccess++
		s.Infrastructure++
	}
	if newIssues > 0 && s.CleanWaterAccess > 0 {
		s.CleanWaterAccess--
	}
	s.OverallScore = (s.CleanWaterAccess + s.SanitationAccess + s.Infrastructure) / 3

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(s)
	store.Set([]byte("water_score/"+region), bz)
}
