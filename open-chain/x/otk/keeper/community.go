// Package keeper — Community Service Value Tracking.
//
// Article I: "Every community volunteer's effort deserves recognition."
// Article III: cOTK represents community value — volunteering, service, mutual aid.
//
// This module tracks community service contributions and volunteer impact.
// When volunteers serve their community, they earn cOTK proportional to
// hours served and people helped — making invisible service visible on-chain.

package keeper

import (
	"encoding/json"
	"fmt"
	"sort"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// CommunityService tracks a single volunteer service contribution.
type CommunityService struct {
	VolunteerUID      string `json:"volunteer_uid"`
	ServiceType       string `json:"service_type"`       // cleanup, tutoring, eldercare, food_bank, coaching, mentoring
	Description       string `json:"description"`
	HoursServed       int64  `json:"hours_served"`
	BeneficiariesCount int64 `json:"beneficiaries_count"`
	OrganizationUID   string `json:"organization_uid"` // verifying org
	Verified          bool   `json:"verified"`
	COTKEarned        int64  `json:"cotk_earned"`
	BlockHeight       int64  `json:"block_height"`
}

// VolunteerProfile tracks a volunteer's cumulative impact.
type VolunteerProfile struct {
	UID                string `json:"uid"`
	TotalHours         int64  `json:"total_hours"`
	TotalServices      int64  `json:"total_services"`
	TotalCOTK          int64  `json:"total_cotk"`
	TotalBeneficiaries int64  `json:"total_beneficiaries"`
	TopServiceType     string `json:"top_service_type"`
	VolunteerLevel     string `json:"volunteer_level"` // helper, regular, dedicated, champion, legend
}

// volunteerLevel returns the level string based on total hours served.
// helper (0-10h), regular (11-50h), dedicated (51-200h), champion (201-500h), legend (500+h)
func volunteerLevel(hours int64) string {
	switch {
	case hours > 500:
		return "legend"
	case hours > 200:
		return "champion"
	case hours > 50:
		return "dedicated"
	case hours > 10:
		return "regular"
	default:
		return "helper"
	}
}

// cotkForService calculates the cOTK reward for a community service.
// Base: 100 cOTK per hour, with a beneficiary multiplier.
func cotkForService(hours, beneficiaries int64) int64 {
	base := hours * 100 // 100 micro-cOTK per hour
	if beneficiaries > 0 {
		// +10% per beneficiary, capped at 3x
		multiplier := 100 + beneficiaries*10
		if multiplier > 300 {
			multiplier = 300
		}
		base = base * multiplier / 100
	}
	return base
}

// RecordCommunityService records a volunteer's community service contribution
// and updates their profile with accumulated hours, cOTK, and level.
func (k Keeper) RecordCommunityService(ctx sdk.Context, service CommunityService) error {
	if service.VolunteerUID == "" {
		return fmt.Errorf("volunteer UID required")
	}
	if service.HoursServed <= 0 {
		return fmt.Errorf("hours served must be positive")
	}
	if service.ServiceType == "" {
		return fmt.Errorf("service type required")
	}

	service.BlockHeight = ctx.BlockHeight()
	service.COTKEarned = cotkForService(service.HoursServed, service.BeneficiariesCount)

	// Store the service record
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("community_service/%s/%d", service.VolunteerUID, service.BlockHeight))
	bz, _ := json.Marshal(service)
	store.Set(key, bz)

	// Update volunteer profile
	k.updateVolunteerProfile(ctx, service)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"community_service",
		sdk.NewAttribute("volunteer_uid", service.VolunteerUID),
		sdk.NewAttribute("service_type", service.ServiceType),
		sdk.NewAttribute("hours_served", fmt.Sprintf("%d", service.HoursServed)),
		sdk.NewAttribute("beneficiaries", fmt.Sprintf("%d", service.BeneficiariesCount)),
		sdk.NewAttribute("cotk_earned", fmt.Sprintf("%d", service.COTKEarned)),
		sdk.NewAttribute("verified", fmt.Sprintf("%t", service.Verified)),
	))

	return nil
}

// GetVolunteerProfile returns a volunteer's cumulative profile.
func (k Keeper) GetVolunteerProfile(ctx sdk.Context, uid string) VolunteerProfile {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("volunteer_profile/" + uid))
	if bz == nil {
		return VolunteerProfile{UID: uid, VolunteerLevel: "helper"}
	}
	var profile VolunteerProfile
	_ = json.Unmarshal(bz, &profile)
	return profile
}

// GetTopVolunteers returns the top volunteers by total hours, up to limit.
func (k Keeper) GetTopVolunteers(ctx sdk.Context, limit int) []VolunteerProfile {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("volunteer_profile/")
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var profiles []VolunteerProfile
	for ; iterator.Valid(); iterator.Next() {
		var p VolunteerProfile
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

// GetCommunityServices returns all community service records for a volunteer.
func (k Keeper) GetCommunityServices(ctx sdk.Context, uid string) []CommunityService {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("community_service/%s/", uid))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var services []CommunityService
	for ; iterator.Valid(); iterator.Next() {
		var s CommunityService
		if err := json.Unmarshal(iterator.Value(), &s); err != nil {
			continue
		}
		services = append(services, s)
	}
	return services
}

// updateVolunteerProfile recalculates a volunteer's profile after a new service.
func (k Keeper) updateVolunteerProfile(ctx sdk.Context, service CommunityService) {
	profile := k.GetVolunteerProfile(ctx, service.VolunteerUID)
	profile.TotalHours += service.HoursServed
	profile.TotalServices++
	profile.TotalCOTK += service.COTKEarned
	profile.TotalBeneficiaries += service.BeneficiariesCount
	profile.VolunteerLevel = volunteerLevel(profile.TotalHours)

	// Update top service type by counting service records
	typeCounts := k.countServiceTypes(ctx, service.VolunteerUID)
	topType := ""
	topCount := int64(0)
	for sType, count := range typeCounts {
		if count > topCount {
			topCount = count
			topType = sType
		}
	}
	if topType != "" {
		profile.TopServiceType = topType
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(profile)
	store.Set([]byte("volunteer_profile/"+service.VolunteerUID), bz)
}

// countServiceTypes counts how many services of each type a volunteer has done.
func (k Keeper) countServiceTypes(ctx sdk.Context, uid string) map[string]int64 {
	services := k.GetCommunityServices(ctx, uid)
	counts := make(map[string]int64)
	for _, s := range services {
		counts[s.ServiceType]++
	}
	return counts
}
