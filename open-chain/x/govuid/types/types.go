// Package types defines the types for the Governance-by-UID (govuid) module.
//
// One-human-one-vote governance: voting power = 1 per active Universal ID.
// This is NOT token-weighted — every verified human has equal voice.
//
// "Governance shall be one-human-one-vote. No amount of wealth shall grant
//  additional influence over collective decisions."
//  — Human Constitution, Article V, Section 2

package types

import "fmt"

const (
	ModuleName = "govuid"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// ProposalStatus represents the lifecycle stage of a governance proposal.
type ProposalStatus string

const (
	ProposalStatusVoting   ProposalStatus = "PROPOSAL_STATUS_VOTING"
	ProposalStatusPassed   ProposalStatus = "PROPOSAL_STATUS_PASSED"
	ProposalStatusRejected ProposalStatus = "PROPOSAL_STATUS_REJECTED"
	ProposalStatusExecuted ProposalStatus = "PROPOSAL_STATUS_EXECUTED"
)

// VoteOption represents a vote choice.
type VoteOption string

const (
	VoteOptionYes     VoteOption = "yes"
	VoteOptionNo      VoteOption = "no"
	VoteOptionAbstain VoteOption = "abstain"
)

// Proposal represents a governance proposal.
type Proposal struct {
	ID              uint64         `json:"id"`
	Title           string         `json:"title"`
	Description     string         `json:"description"`
	Proposer        string         `json:"proposer"` // bech32 address (must have active UID)
	Status          ProposalStatus `json:"status"`
	SubmitHeight    int64          `json:"submit_height"`
	VotingEndHeight int64          `json:"voting_end_height"` // SubmitHeight + VotingPeriod
	Tally           TallyResult    `json:"tally"`
	// Execution fields — what happens when the proposal passes
	ActionType string `json:"action_type,omitempty"` // param_change, treasury_spend, correction_reverse, text, upgrade, emergency
	ActionData string `json:"action_data,omitempty"` // JSON-encoded action parameters
	Executed   bool   `json:"executed,omitempty"`     // true after execution
}

// Vote represents a single vote on a proposal.
type Vote struct {
	ProposalID uint64     `json:"proposal_id"`
	Voter      string     `json:"voter"` // bech32 address
	Option     VoteOption `json:"option"`
}

// TallyResult holds the current tally for a proposal.
type TallyResult struct {
	Yes     uint64 `json:"yes"`
	No      uint64 `json:"no"`
	Abstain uint64 `json:"abstain"`
}

// TotalVotes returns the total number of votes cast.
func (t TallyResult) TotalVotes() uint64 {
	return t.Yes + t.No + t.Abstain
}

// Passed checks if the proposal passes: >50% of votes cast are yes,
// and >33% of registered UIDs participated (quorum).
func (t TallyResult) Passed(totalRegisteredUIDs uint64) bool {
	totalVotes := t.TotalVotes()
	if totalVotes == 0 || totalRegisteredUIDs == 0 {
		return false
	}

	// Quorum check: >33% of registered UIDs must have voted
	// Using integer math: totalVotes * 100 > totalRegisteredUIDs * 33
	if totalVotes*100 <= totalRegisteredUIDs*33 {
		return false
	}

	// Majority check: >50% of votes cast must be yes
	// Using integer math: yes * 100 > totalVotes * 50
	if t.Yes*100 <= totalVotes*50 {
		return false
	}

	return true
}

// GenesisState defines the govuid module's genesis state.
type GenesisState struct {
	Proposals      []Proposal `json:"proposals"`
	Votes          []Vote     `json:"votes"`
	NextProposalID uint64     `json:"next_proposal_id"`
}

// Proto.Message interface methods for GenesisState.
func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("GenesisState{Proposals: %d}", len(g.Proposals)) }

// DefaultGenesisState returns the default genesis state.
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Proposals:      []Proposal{},
		Votes:          []Vote{},
		NextProposalID: 1,
	}
}
