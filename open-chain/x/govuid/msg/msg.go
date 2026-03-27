// Package msg defines the govuid module's transaction messages.
//
// Messages:
//   - MsgSubmitProposal: Submit a new governance proposal (requires active UID)
//   - MsgVote: Cast a vote on an active proposal (1 UID = 1 vote)

package msg

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ─── MsgSubmitProposal ───

// MsgSubmitProposal submits a new governance proposal.
// The proposer must have an active Universal ID.
type MsgSubmitProposal struct {
	Proposer    string `json:"proposer"`     // bech32 address (must have active UID)
	Title       string `json:"title"`        // Proposal title
	Description string `json:"description"`  // Proposal description
	VotingPeriod int64 `json:"voting_period"` // Duration in blocks
}

func (m MsgSubmitProposal) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Proposer); err != nil {
		return fmt.Errorf("invalid proposer: %w", err)
	}
	if m.Title == "" {
		return fmt.Errorf("title is required")
	}
	if len(m.Title) > 256 {
		return fmt.Errorf("title too long (max 256 chars)")
	}
	if m.Description == "" {
		return fmt.Errorf("description is required")
	}
	if len(m.Description) > 10000 {
		return fmt.Errorf("description too long (max 10000 chars)")
	}
	if m.VotingPeriod <= 0 {
		return fmt.Errorf("voting period must be positive")
	}
	// Minimum 1 day (~14400 blocks at 6s), maximum 30 days (~432000 blocks)
	if m.VotingPeriod < 14400 {
		return fmt.Errorf("voting period too short (min 14400 blocks, ~1 day)")
	}
	if m.VotingPeriod > 432000 {
		return fmt.Errorf("voting period too long (max 432000 blocks, ~30 days)")
	}
	return nil
}

func (m MsgSubmitProposal) GetSigners() []sdk.AccAddress {
	proposer, _ := sdk.AccAddressFromBech32(m.Proposer)
	return []sdk.AccAddress{proposer}
}

// ─── MsgVote ───

// MsgVote casts a vote on an active governance proposal.
// One Universal ID = one vote. Not token-weighted.
type MsgVote struct {
	Voter      string `json:"voter"`       // bech32 address (must have active UID)
	ProposalID uint64 `json:"proposal_id"` // ID of the proposal to vote on
	Option     string `json:"option"`      // "yes", "no", or "abstain"
}

func (m MsgVote) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Voter); err != nil {
		return fmt.Errorf("invalid voter: %w", err)
	}
	if m.ProposalID == 0 {
		return fmt.Errorf("proposal_id is required")
	}
	switch m.Option {
	case "yes", "no", "abstain":
		// valid
	default:
		return fmt.Errorf("invalid vote option %q: must be yes, no, or abstain", m.Option)
	}
	return nil
}

func (m MsgVote) GetSigners() []sdk.AccAddress {
	voter, _ := sdk.AccAddressFromBech32(m.Voter)
	return []sdk.AccAddress{voter}
}
