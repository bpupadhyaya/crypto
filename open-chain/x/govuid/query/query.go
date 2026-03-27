// Package query defines the govuid module's query types.
//
// Queries:
//   - QueryProposal: Get a governance proposal by ID
//   - QueryProposals: List proposals (optionally filtered by status)
//   - QueryVotes: Get all votes for a proposal
//   - QueryTally: Get current tally for a proposal

package query

import (
	"openchain/x/govuid/types"
)

// QueryProposalRequest queries a proposal by ID.
type QueryProposalRequest struct {
	ProposalID uint64 `json:"proposal_id"`
}

type QueryProposalResponse struct {
	Proposal *types.Proposal `json:"proposal"`
}

// QueryProposalsRequest lists proposals with optional status filter.
type QueryProposalsRequest struct {
	Status types.ProposalStatus `json:"status,omitempty"` // Empty = all
}

type QueryProposalsResponse struct {
	Proposals []types.Proposal `json:"proposals"`
}

// QueryVotesRequest queries votes for a proposal.
type QueryVotesRequest struct {
	ProposalID uint64 `json:"proposal_id"`
}

type QueryVotesResponse struct {
	Votes []types.Vote `json:"votes"`
}

// QueryTallyRequest queries the current tally for a proposal.
type QueryTallyRequest struct {
	ProposalID uint64 `json:"proposal_id"`
}

type QueryTallyResponse struct {
	Tally types.TallyResult `json:"tally"`
}
