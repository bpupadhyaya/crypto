// Package keeper — Housing Security Tracking.
//
// Shelter is a fundamental human need. This module tracks:
//   - Regional housing security scores
//   - Community housing initiatives (co-housing, land trusts)
//   - Emergency shelter availability
//   - Housing improvement funds (community OTK pools)
//
// Housing activities earn cOTK (community channel).

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// HousingInitiative represents a community housing project.
type HousingInitiative struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	InitType    string `json:"init_type"` // co_housing, land_trust, building_coop, improvement
	Region      string `json:"region"`
	Description string `json:"description"`
	Members     int64  `json:"members"`
	OTKPool     int64  `json:"otk_pool"`    // community funds allocated
	OTKGoal     int64  `json:"otk_goal"`    // funding target
	Status      string `json:"status"`      // planning, fundraising, building, active, completed
	Units       int64  `json:"units"`       // housing units
	CreatedAt   int64  `json:"created_at"`
}

// EmergencyShelter tracks available emergency housing.
type EmergencyShelter struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Region      string `json:"region"`
	ShelterType string `json:"shelter_type"` // shelter, temporary, host_family
	Capacity    int64  `json:"capacity"`
	Available   int64  `json:"available"`
	Contact     string `json:"contact"`
	Services    string `json:"services"` // comma-separated: meals, medical, childcare, pets
	Status      string `json:"status"`   // open, full, closed
}

// RegionalHousingScore tracks housing security for a region.
type RegionalHousingScore struct {
	Region        string `json:"region"`
	Affordability int64  `json:"affordability"` // 0-100
	Stability     int64  `json:"stability"`     // 0-100
	Quality       int64  `json:"quality"`       // 0-100
	Access        int64  `json:"access"`        // 0-100
	OverallScore  int64  `json:"overall_score"` // 0-100
	Initiatives   int64  `json:"initiatives"`
	Shelters      int64  `json:"shelters"`
	LastUpdated   int64  `json:"last_updated"`
}

// HousingNeed represents a person's housing needs assessment.
type HousingNeed struct {
	UID           string `json:"uid"`
	CurrentStatus string `json:"current_status"` // owned, renting, unstable, homeless, temporary
	TypeNeeded    string `json:"type_needed"`     // apartment, house, shared, emergency, accessible
	HouseholdSize int64  `json:"household_size"`
	Urgency       string `json:"urgency"` // low, medium, high, emergency
	Region        string `json:"region"`
	SubmittedAt   int64  `json:"submitted_at"`
	Status        string `json:"status"` // submitted, matched, resolved
}

// RegisterHousingInitiative creates a community housing project.
func (k Keeper) RegisterHousingInitiative(ctx sdk.Context, init HousingInitiative) error {
	if init.Name == "" || init.Region == "" {
		return fmt.Errorf("name and region are required")
	}

	init.Status = "planning"
	init.CreatedAt = ctx.BlockHeight()
	if init.ID == "" {
		init.ID = fmt.Sprintf("hi_%s_%d", init.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(init)
	store.Set([]byte("housing_init/"+init.ID), bz)

	// Update regional score
	score := k.GetRegionalHousingScore(ctx, init.Region)
	score.Initiatives++
	score.LastUpdated = ctx.BlockHeight()
	k.setHousingScore(ctx, score)

	ctx.EventManager().EmitEvent(sdk.NewEvent("housing_initiative_created",
		sdk.NewAttribute("id", init.ID),
		sdk.NewAttribute("type", init.InitType),
		sdk.NewAttribute("region", init.Region),
	))

	return nil
}

// RegisterEmergencyShelter adds an emergency shelter.
func (k Keeper) RegisterEmergencyShelter(ctx sdk.Context, shelter EmergencyShelter) error {
	if shelter.Name == "" || shelter.Region == "" {
		return fmt.Errorf("name and region are required")
	}

	shelter.Status = "open"
	if shelter.ID == "" {
		shelter.ID = fmt.Sprintf("es_%s_%d", shelter.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(shelter)
	store.Set([]byte("shelter/"+shelter.ID), bz)

	score := k.GetRegionalHousingScore(ctx, shelter.Region)
	score.Shelters++
	score.Access++
	if score.Access > 100 { score.Access = 100 }
	score.OverallScore = (score.Affordability + score.Stability + score.Quality + score.Access) / 4
	score.LastUpdated = ctx.BlockHeight()
	k.setHousingScore(ctx, score)

	return nil
}

// SubmitHousingNeed records a housing needs assessment.
func (k Keeper) SubmitHousingNeed(ctx sdk.Context, need HousingNeed) error {
	if need.UID == "" {
		return fmt.Errorf("uid is required")
	}

	need.SubmittedAt = ctx.BlockHeight()
	need.Status = "submitted"

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(need)
	store.Set([]byte("housing_need/"+need.UID), bz)

	return nil
}

// GetRegionalHousingScore retrieves housing security for a region.
func (k Keeper) GetRegionalHousingScore(ctx sdk.Context, region string) *RegionalHousingScore {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("housing_score/" + region))
	if bz == nil {
		return &RegionalHousingScore{
			Region: region, Affordability: 60, Stability: 70,
			Quality: 65, Access: 60, OverallScore: 64,
		}
	}
	var s RegionalHousingScore
	_ = json.Unmarshal(bz, &s)
	return &s
}

func (k Keeper) setHousingScore(ctx sdk.Context, s *RegionalHousingScore) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(s)
	store.Set([]byte("housing_score/"+s.Region), bz)
}
