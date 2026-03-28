// Package types defines the DAO module types.
//
// DAOs are on-chain organizations with their own treasury,
// governance rules, and membership management.

package types

import "fmt"

const (
	ModuleName = "dao"
	StoreKey   = ModuleName
)

// VotingMode determines how votes are counted.
type VotingMode string

const (
	VotingModeOneMemberOneVote VotingMode = "one_member_one_vote"
	VotingModeTokenWeighted    VotingMode = "token_weighted"
)

// DAO represents an on-chain organization.
type DAO struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Creator     string     `json:"creator"`
	TokenDenom  string     `json:"token_denom"` // governance token (OTK or custom)
	VotingMode  VotingMode `json:"voting_mode"`
	Members     []string   `json:"members"`     // member addresses
	Admins      []string   `json:"admins"`      // can add/remove members
	TreasuryBalance int64  `json:"treasury_balance"`
	CreatedAt   int64      `json:"created_at"`
	ProposalCount int64    `json:"proposal_count"`
}

// DAOProposal is a proposal within a DAO.
type DAOProposal struct {
	ID          string `json:"id"`
	DAOID       string `json:"dao_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Proposer    string `json:"proposer"`
	ProposalType string `json:"proposal_type"` // spend, parameter, membership
	// For spend proposals
	Recipient   string `json:"recipient,omitempty"`
	Amount      int64  `json:"amount,omitempty"`
	Denom       string `json:"denom,omitempty"`
	// Voting
	YesVotes    int64  `json:"yes_votes"`
	NoVotes     int64  `json:"no_votes"`
	AbstainVotes int64 `json:"abstain_votes"`
	Status      string `json:"status"` // voting, passed, rejected, executed
	CreatedAt   int64  `json:"created_at"`
	EndsAt      int64  `json:"ends_at"`
}

type GenesisState struct {
	DAOs []DAO `json:"daos"`
}

func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("DAOGenesis{%d daos}", len(g.DAOs)) }

func DefaultGenesisState() *GenesisState { return &GenesisState{DAOs: []DAO{}} }
