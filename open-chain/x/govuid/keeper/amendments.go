// Package keeper — Constitutional Amendments.
//
// Article VI, Section 3 of The Human Constitution:
// - Amendments require two-thirds supermajority
// - Cannot violate Foundational Principles (Article I) — immutable
// - Minimum 90-day public deliberation period
// - Transparent process

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ConstitutionalAmendment represents a proposed change to The Human Constitution.
type ConstitutionalAmendment struct {
	ID                string `json:"id"`
	Title             string `json:"title"`
	ArticleAffected   string `json:"article_affected"`   // e.g., "Article III"
	SectionAffected   string `json:"section_affected"`   // e.g., "Section 2"
	CurrentText       string `json:"current_text"`
	ProposedText      string `json:"proposed_text"`
	Rationale         string `json:"rationale"`
	Proposer          string `json:"proposer"`
	// Voting
	YesVotes          int64  `json:"yes_votes"`
	NoVotes           int64  `json:"no_votes"`
	AbstainVotes      int64  `json:"abstain_votes"`
	TotalEligible     int64  `json:"total_eligible"`
	Status            string `json:"status"` // deliberation, voting, passed, rejected
	// Timeline (90-day deliberation required)
	SubmittedAt       int64  `json:"submitted_at"`
	DeliberationEnds  int64  `json:"deliberation_ends"`  // submitted + 90 days (~1.3M blocks)
	VotingEnds        int64  `json:"voting_ends"`         // deliberation_ends + 30 days
	RatifiedAt        int64  `json:"ratified_at"`
}

const (
	// ~90 days at 6s blocks
	DeliberationPeriodBlocks = 1296000
	// ~30 days voting after deliberation
	AmendmentVotingPeriod    = 432000
	// Two-thirds supermajority required
	SupermajorityThreshold   = 67 // 67%
)

// SubmitAmendment proposes a constitutional amendment.
func (k Keeper) SubmitAmendment(ctx sdk.Context, amendment ConstitutionalAmendment) error {
	if amendment.ArticleAffected == "Article I" {
		return fmt.Errorf("Article I (Foundational Principles) is immutable and cannot be amended")
	}

	amendment.Status = "deliberation"
	amendment.SubmittedAt = ctx.BlockHeight()
	amendment.DeliberationEnds = ctx.BlockHeight() + DeliberationPeriodBlocks
	amendment.VotingEnds = amendment.DeliberationEnds + AmendmentVotingPeriod

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(amendment)
	store.Set([]byte("amendment/"+amendment.ID), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"amendment_submitted",
		sdk.NewAttribute("id", amendment.ID),
		sdk.NewAttribute("article", amendment.ArticleAffected),
		sdk.NewAttribute("proposer", amendment.Proposer),
		sdk.NewAttribute("deliberation_ends_block", fmt.Sprintf("%d", amendment.DeliberationEnds)),
	))
	return nil
}

// VoteOnAmendment records a vote (only during voting period).
func (k Keeper) VoteOnAmendment(ctx sdk.Context, amendmentID, voterUID, vote string) error {
	amendment, err := k.GetAmendment(ctx, amendmentID)
	if err != nil {
		return err
	}

	if amendment.Status != "voting" {
		return fmt.Errorf("amendment is not in voting period (status: %s)", amendment.Status)
	}

	switch vote {
	case "yes":
		amendment.YesVotes++
	case "no":
		amendment.NoVotes++
	case "abstain":
		amendment.AbstainVotes++
	default:
		return fmt.Errorf("invalid vote: %s", vote)
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(amendment)
	store.Set([]byte("amendment/"+amendment.ID), bz)
	return nil
}

// ProcessAmendments moves amendments through their lifecycle.
// Called from EndBlock.
func (k Keeper) ProcessAmendments(ctx sdk.Context) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("amendment/")
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var a ConstitutionalAmendment
		if err := json.Unmarshal(iterator.Value(), &a); err != nil {
			continue
		}

		switch a.Status {
		case "deliberation":
			if ctx.BlockHeight() >= a.DeliberationEnds {
				a.Status = "voting"
				bz, _ := json.Marshal(a)
				store.Set(iterator.Key(), bz)

				ctx.EventManager().EmitEvent(sdk.NewEvent(
					"amendment_voting_started",
					sdk.NewAttribute("id", a.ID),
				))
			}

		case "voting":
			if ctx.BlockHeight() >= a.VotingEnds {
				totalVotes := a.YesVotes + a.NoVotes + a.AbstainVotes
				yesPercent := int64(0)
				if totalVotes > 0 {
					yesPercent = (a.YesVotes * 100) / totalVotes
				}

				if yesPercent >= SupermajorityThreshold {
					a.Status = "passed"
					a.RatifiedAt = ctx.BlockHeight()
				} else {
					a.Status = "rejected"
				}

				bz, _ := json.Marshal(a)
				store.Set(iterator.Key(), bz)

				ctx.EventManager().EmitEvent(sdk.NewEvent(
					"amendment_resolved",
					sdk.NewAttribute("id", a.ID),
					sdk.NewAttribute("status", a.Status),
					sdk.NewAttribute("yes_percent", fmt.Sprintf("%d", yesPercent)),
				))
			}
		}
	}
}

// GetAmendment retrieves an amendment by ID.
func (k Keeper) GetAmendment(ctx sdk.Context, id string) (*ConstitutionalAmendment, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("amendment/" + id))
	if bz == nil {
		return nil, fmt.Errorf("amendment %s not found", id)
	}
	var a ConstitutionalAmendment
	if err := json.Unmarshal(bz, &a); err != nil {
		return nil, err
	}
	return &a, nil
}

// GetAllAmendments returns all amendments.
func (k Keeper) GetAllAmendments(ctx sdk.Context) []ConstitutionalAmendment {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("amendment/")
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var amendments []ConstitutionalAmendment
	for ; iterator.Valid(); iterator.Next() {
		var a ConstitutionalAmendment
		if err := json.Unmarshal(iterator.Value(), &a); err != nil {
			continue
		}
		amendments = append(amendments, a)
	}
	return amendments
}
