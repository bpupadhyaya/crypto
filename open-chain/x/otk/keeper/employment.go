// Package keeper — Employment & Job Matching.
//
// Economic participation is a dimension of human value (xOTK).
// This module tracks:
//   - Job listings posted by community members and organizations
//   - Skill-based matching between seekers and opportunities
//   - Gig/task completion and payment tracking
//   - Regional employment stats feeding into economic health
//
// Creating employment earns xOTK (10 OTK per job filled).

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// JobListing represents a job or gig opportunity.
type JobListing struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	PostedBy    string   `json:"posted_by"`  // UID of poster
	JobType     string   `json:"job_type"`   // full_time, part_time, gig, volunteer, apprentice
	Category    string   `json:"category"`   // technology, agriculture, education, health, construction, services, creative
	Skills      []string `json:"skills"`     // required skills
	PayType     string   `json:"pay_type"`   // otk, fiat, time_exchange, volunteer
	PayAmount   int64    `json:"pay_amount"` // in micro-OTK if OTK payment
	Region      string   `json:"region"`
	Remote      bool     `json:"remote"`
	Status      string   `json:"status"` // open, filled, closed, expired
	Applicants  int64    `json:"applicants"`
	PostedAt    int64    `json:"posted_at"`
	FilledAt    int64    `json:"filled_at,omitempty"`
	FilledBy    string   `json:"filled_by,omitempty"`
}

// JobApplication tracks applications to listings.
type JobApplication struct {
	ListingID   string `json:"listing_id"`
	ApplicantID string `json:"applicant_id"`
	Message     string `json:"message"`
	Status      string `json:"status"` // applied, shortlisted, accepted, rejected
	AppliedAt   int64  `json:"applied_at"`
}

// RegionalEmploymentStats tracks employment health.
type RegionalEmploymentStats struct {
	Region        string `json:"region"`
	TotalListings int64  `json:"total_listings"`
	OpenListings  int64  `json:"open_listings"`
	FilledJobs    int64  `json:"filled_jobs"`
	TotalXOTK     int64  `json:"total_xotk_earned"` // from employment activity
	ActiveSeekers int64  `json:"active_seekers"`
	MatchRate     int64  `json:"match_rate"` // percentage of listings that get filled
	LastUpdated   int64  `json:"last_updated"`
}

// PostJob creates a new job listing.
func (k Keeper) PostJob(ctx sdk.Context, job JobListing) (*JobListing, error) {
	if job.Title == "" || job.PostedBy == "" {
		return nil, fmt.Errorf("title and posted_by are required")
	}

	job.Status = "open"
	job.PostedAt = ctx.BlockHeight()
	if job.ID == "" {
		job.ID = fmt.Sprintf("job_%s_%d", job.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(job)
	store.Set([]byte("job/"+job.ID), bz)

	// Index by region
	regionKey := fmt.Sprintf("job_region/%s/%s", job.Region, job.ID)
	store.Set([]byte(regionKey), []byte(job.ID))

	// Update stats
	stats := k.GetEmploymentStats(ctx, job.Region)
	stats.TotalListings++
	stats.OpenListings++
	stats.LastUpdated = ctx.BlockHeight()
	k.setEmploymentStats(ctx, stats)

	ctx.EventManager().EmitEvent(sdk.NewEvent("job_posted",
		sdk.NewAttribute("id", job.ID),
		sdk.NewAttribute("title", job.Title),
		sdk.NewAttribute("type", job.JobType),
		sdk.NewAttribute("region", job.Region),
	))

	return &job, nil
}

// ApplyToJob records an application.
func (k Keeper) ApplyToJob(ctx sdk.Context, app JobApplication) error {
	if app.ListingID == "" || app.ApplicantID == "" {
		return fmt.Errorf("listing_id and applicant_id are required")
	}

	app.Status = "applied"
	app.AppliedAt = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("job_app/%s/%s", app.ListingID, app.ApplicantID)
	bz, _ := json.Marshal(app)
	store.Set([]byte(key), bz)

	// Increment applicant count
	jobBz := store.Get([]byte("job/" + app.ListingID))
	if jobBz != nil {
		var job JobListing
		_ = json.Unmarshal(jobBz, &job)
		job.Applicants++
		updBz, _ := json.Marshal(job)
		store.Set([]byte("job/"+job.ID), updBz)
	}

	return nil
}

// FillJob marks a listing as filled and rewards the poster with xOTK.
func (k Keeper) FillJob(ctx sdk.Context, listingID, filledBy string) error {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("job/" + listingID))
	if bz == nil {
		return fmt.Errorf("job listing not found")
	}

	var job JobListing
	_ = json.Unmarshal(bz, &job)
	job.Status = "filled"
	job.FilledAt = ctx.BlockHeight()
	job.FilledBy = filledBy

	updBz, _ := json.Marshal(job)
	store.Set([]byte("job/"+job.ID), updBz)

	// Update stats
	stats := k.GetEmploymentStats(ctx, job.Region)
	stats.OpenListings--
	stats.FilledJobs++
	stats.TotalXOTK += 10000000 // 10 xOTK for creating employment
	if stats.TotalListings > 0 {
		stats.MatchRate = stats.FilledJobs * 100 / stats.TotalListings
	}
	stats.LastUpdated = ctx.BlockHeight()
	k.setEmploymentStats(ctx, stats)

	ctx.EventManager().EmitEvent(sdk.NewEvent("job_filled",
		sdk.NewAttribute("id", listingID),
		sdk.NewAttribute("filled_by", filledBy),
		sdk.NewAttribute("xotk_reward", "10000000"),
	))

	return nil
}

// GetOpenJobs returns open job listings, optionally filtered by region.
func (k Keeper) GetOpenJobs(ctx sdk.Context, region string, limit int) []JobListing {
	store := ctx.KVStore(k.storeKey)
	var prefix []byte
	if region != "" {
		prefix = []byte(fmt.Sprintf("job_region/%s/", region))
	} else {
		prefix = []byte("job/")
	}

	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var jobs []JobListing
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var job JobListing
		var jobBz []byte

		if region != "" {
			// Index stores job IDs, need to look up actual job
			jobID := string(iterator.Value())
			jobBz = store.Get([]byte("job/" + jobID))
		} else {
			jobBz = iterator.Value()
		}

		if jobBz == nil {
			continue
		}
		if err := json.Unmarshal(jobBz, &job); err != nil {
			continue
		}
		if job.Status == "open" {
			jobs = append(jobs, job)
			count++
		}
	}
	return jobs
}

// GetEmploymentStats retrieves regional employment statistics.
func (k Keeper) GetEmploymentStats(ctx sdk.Context, region string) *RegionalEmploymentStats {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("emp_stats/" + region))
	if bz == nil {
		return &RegionalEmploymentStats{Region: region}
	}
	var s RegionalEmploymentStats
	_ = json.Unmarshal(bz, &s)
	return &s
}

func (k Keeper) setEmploymentStats(ctx sdk.Context, s *RegionalEmploymentStats) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(s)
	store.Set([]byte("emp_stats/"+s.Region), bz)
}
