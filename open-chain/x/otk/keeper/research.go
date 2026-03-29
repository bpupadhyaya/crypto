// Package keeper — Community Research Collaboration.
//
// Open research projects where community members contribute data,
// analysis, and expertise. Research outputs are open-access and
// earn eOTK for contributors.
//
// Research categories: health, agriculture, education, environment,
// technology, social science, economics, culture.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ResearchProject represents a community research initiative.
type ResearchProject struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Category      string   `json:"category"` // health, agriculture, education, environment, technology, social, economics, culture
	LeadUID       string   `json:"lead_uid"`
	Contributors  int64    `json:"contributors"`
	DataPoints    int64    `json:"data_points"`
	Status        string   `json:"status"` // recruiting, active, analysis, published, archived
	Region        string   `json:"region"`
	EOTKPool      int64    `json:"eotk_pool"` // total eOTK allocated
	OutputHash    string   `json:"output_hash,omitempty"` // hash of published results
	StartedAt     int64    `json:"started_at"`
	PublishedAt   int64    `json:"published_at,omitempty"`
}

// ResearchContribution tracks individual contributions to a project.
type ResearchContribution struct {
	ProjectID     string `json:"project_id"`
	ContributorID string `json:"contributor_id"`
	ContribType   string `json:"contrib_type"` // data, analysis, review, expertise, funding
	Description   string `json:"description"`
	DataHash      string `json:"data_hash,omitempty"` // hash of contributed data
	EOTKEarned    int64  `json:"eotk_earned"`
	BlockHeight   int64  `json:"block_height"`
}

var researchRewards = map[string]int64{
	"data":      100000,  // 0.1 eOTK per data contribution
	"analysis":  500000,  // 0.5 eOTK per analysis
	"review":    300000,  // 0.3 eOTK per peer review
	"expertise": 1000000, // 1 eOTK per expert consultation
	"funding":   0,       // funding is its own reward
}

// CreateResearchProject starts a new community research initiative.
func (k Keeper) CreateResearchProject(ctx sdk.Context, project ResearchProject) (*ResearchProject, error) {
	if project.Title == "" || project.LeadUID == "" {
		return nil, fmt.Errorf("title and lead are required")
	}

	project.Status = "recruiting"
	project.StartedAt = ctx.BlockHeight()
	if project.ID == "" {
		project.ID = fmt.Sprintf("res_%s_%d", project.Category, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(project)
	store.Set([]byte("research/"+project.ID), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent("research_project_created",
		sdk.NewAttribute("id", project.ID),
		sdk.NewAttribute("title", project.Title),
		sdk.NewAttribute("category", project.Category),
	))

	return &project, nil
}

// ContributeToResearch records a contribution to a project.
func (k Keeper) ContributeToResearch(ctx sdk.Context, contrib ResearchContribution) error {
	if contrib.ProjectID == "" || contrib.ContributorID == "" {
		return fmt.Errorf("project_id and contributor_id are required")
	}

	reward := researchRewards[contrib.ContribType]
	contrib.EOTKEarned = reward
	contrib.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("research_contrib/%s/%s/%d", contrib.ProjectID, contrib.ContributorID, ctx.BlockHeight())
	bz, _ := json.Marshal(contrib)
	store.Set([]byte(key), bz)

	// Update project stats
	projBz := store.Get([]byte("research/" + contrib.ProjectID))
	if projBz != nil {
		var proj ResearchProject
		_ = json.Unmarshal(projBz, &proj)
		proj.Contributors++
		if contrib.ContribType == "data" {
			proj.DataPoints++
		}
		proj.EOTKPool += reward
		updBz, _ := json.Marshal(proj)
		store.Set([]byte("research/"+proj.ID), updBz)
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent("research_contribution",
		sdk.NewAttribute("project_id", contrib.ProjectID),
		sdk.NewAttribute("contributor", contrib.ContributorID),
		sdk.NewAttribute("type", contrib.ContribType),
		sdk.NewAttribute("eotk_earned", fmt.Sprintf("%d", reward)),
	))

	return nil
}

// GetResearchProjects returns projects optionally filtered by category.
func (k Keeper) GetResearchProjects(ctx sdk.Context, category string, limit int) []ResearchProject {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("research/")
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var projects []ResearchProject
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var proj ResearchProject
		if err := json.Unmarshal(iterator.Value(), &proj); err != nil {
			continue
		}
		if category == "" || proj.Category == category {
			projects = append(projects, proj)
			count++
		}
	}
	return projects
}
