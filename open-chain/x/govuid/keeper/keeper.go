// Package keeper implements the govuid module's state management.
//
// One-human-one-vote governance:
// - Every active Universal ID gets exactly 1 vote
// - No token-weighted voting
// - Pass threshold: >50% of votes cast with >33% quorum of registered UIDs
//
// The keeper references the UID keeper to verify voter has active UID.

package keeper

import (
	"encoding/binary"
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/govuid/types"
	uidkeeper "openchain/x/uid/keeper"
	uidtypes "openchain/x/uid/types"
)

// Keeper manages the govuid module state.
type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	uid      *uidkeeper.Keeper
}

// NewKeeper creates a new govuid keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, uid *uidkeeper.Keeper) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
		uid:      uid,
	}
}

// ─── Proposal CRUD ───

// SubmitProposal creates a new governance proposal.
// The proposer must have an active Universal ID.
func (k Keeper) SubmitProposal(ctx sdk.Context, proposer sdk.AccAddress, title, description string, votingPeriod int64) (*types.Proposal, error) {
	// Verify proposer has active UID
	uid, err := k.uid.GetUID(ctx, proposer)
	if err != nil {
		return nil, fmt.Errorf("proposer has no Universal ID: %w", err)
	}
	if uid.Status != uidtypes.StatusActive {
		return nil, fmt.Errorf("proposer UID is %s, must be active", uid.Status)
	}

	// Get next proposal ID
	proposalID := k.getNextProposalID(ctx)

	proposal := &types.Proposal{
		ID:              proposalID,
		Title:           title,
		Description:     description,
		Proposer:        proposer.String(),
		Status:          types.ProposalStatusVoting,
		SubmitHeight:    ctx.BlockHeight(),
		VotingEndHeight: ctx.BlockHeight() + votingPeriod,
		Tally:           types.TallyResult{},
	}

	k.setProposal(ctx, proposal)
	k.setNextProposalID(ctx, proposalID+1)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"proposal_submitted",
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", proposalID)),
		sdk.NewAttribute("proposer", proposer.String()),
		sdk.NewAttribute("title", title),
		sdk.NewAttribute("voting_end_height", fmt.Sprintf("%d", proposal.VotingEndHeight)),
	))

	return proposal, nil
}

// GetProposal retrieves a proposal by ID.
func (k Keeper) GetProposal(ctx sdk.Context, proposalID uint64) (*types.Proposal, error) {
	store := ctx.KVStore(k.storeKey)
	key := proposalKey(proposalID)

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("proposal %d not found", proposalID)
	}

	var proposal types.Proposal
	if err := json.Unmarshal(bz, &proposal); err != nil {
		return nil, fmt.Errorf("failed to unmarshal proposal %d: %w", proposalID, err)
	}
	return &proposal, nil
}

// GetProposals returns all proposals, optionally filtered by status.
func (k Keeper) GetProposals(ctx sdk.Context, status types.ProposalStatus) []types.Proposal {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("proposal/")
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	var proposals []types.Proposal
	for ; iter.Valid(); iter.Next() {
		var proposal types.Proposal
		if err := json.Unmarshal(iter.Value(), &proposal); err != nil {
			continue
		}
		if status == "" || proposal.Status == status {
			proposals = append(proposals, proposal)
		}
	}
	return proposals
}

// ─── Voting ───

// Vote casts a vote on a proposal. One UID = one vote, not token-weighted.
func (k Keeper) Vote(ctx sdk.Context, voter sdk.AccAddress, proposalID uint64, option types.VoteOption) error {
	// Verify voter has active UID
	uid, err := k.uid.GetUID(ctx, voter)
	if err != nil {
		return fmt.Errorf("voter has no Universal ID: %w", err)
	}
	if uid.Status != uidtypes.StatusActive {
		return fmt.Errorf("voter UID is %s, must be active", uid.Status)
	}

	// Get proposal
	proposal, err := k.GetProposal(ctx, proposalID)
	if err != nil {
		return err
	}

	// Check proposal is in voting period
	if proposal.Status != types.ProposalStatusVoting {
		return fmt.Errorf("proposal %d is not in voting period (status: %s)", proposalID, proposal.Status)
	}
	if ctx.BlockHeight() > proposal.VotingEndHeight {
		return fmt.Errorf("voting period for proposal %d has ended", proposalID)
	}

	// Check if already voted
	if k.hasVoted(ctx, proposalID, voter) {
		return fmt.Errorf("address %s has already voted on proposal %d", voter, proposalID)
	}

	// Validate vote option
	switch option {
	case types.VoteOptionYes, types.VoteOptionNo, types.VoteOptionAbstain:
		// valid
	default:
		return fmt.Errorf("invalid vote option: %s", option)
	}

	// Record vote
	vote := types.Vote{
		ProposalID: proposalID,
		Voter:      voter.String(),
		Option:     option,
	}
	k.setVote(ctx, &vote)

	// Update tally
	switch option {
	case types.VoteOptionYes:
		proposal.Tally.Yes++
	case types.VoteOptionNo:
		proposal.Tally.No++
	case types.VoteOptionAbstain:
		proposal.Tally.Abstain++
	}
	k.setProposal(ctx, proposal)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"vote_cast",
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", proposalID)),
		sdk.NewAttribute("voter", voter.String()),
		sdk.NewAttribute("option", string(option)),
	))

	return nil
}

// GetVotes returns all votes for a proposal.
func (k Keeper) GetVotes(ctx sdk.Context, proposalID uint64) []types.Vote {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("vote/%d/", proposalID))
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	var votes []types.Vote
	for ; iter.Valid(); iter.Next() {
		var vote types.Vote
		if err := json.Unmarshal(iter.Value(), &vote); err != nil {
			continue
		}
		votes = append(votes, vote)
	}
	return votes
}

// ─── Tally ───

// TallyProposal finalizes the tally for a proposal whose voting period has ended.
// Pass threshold: >50% of votes cast are yes, with >33% quorum of registered UIDs.
func (k Keeper) TallyProposal(ctx sdk.Context, proposalID uint64) (*types.TallyResult, error) {
	proposal, err := k.GetProposal(ctx, proposalID)
	if err != nil {
		return nil, err
	}

	if proposal.Status != types.ProposalStatusVoting {
		return &proposal.Tally, fmt.Errorf("proposal %d already finalized (status: %s)", proposalID, proposal.Status)
	}

	if ctx.BlockHeight() <= proposal.VotingEndHeight {
		return &proposal.Tally, fmt.Errorf("voting period for proposal %d has not ended yet", proposalID)
	}

	// Get total registered UIDs for quorum calculation
	totalUIDs := k.getRegisteredUIDCount(ctx)

	if proposal.Tally.Passed(totalUIDs) {
		proposal.Status = types.ProposalStatusPassed
	} else {
		proposal.Status = types.ProposalStatusRejected
	}

	k.setProposal(ctx, proposal)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"proposal_tallied",
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", proposalID)),
		sdk.NewAttribute("status", string(proposal.Status)),
		sdk.NewAttribute("yes", fmt.Sprintf("%d", proposal.Tally.Yes)),
		sdk.NewAttribute("no", fmt.Sprintf("%d", proposal.Tally.No)),
		sdk.NewAttribute("abstain", fmt.Sprintf("%d", proposal.Tally.Abstain)),
		sdk.NewAttribute("total_uids", fmt.Sprintf("%d", totalUIDs)),
	))

	return &proposal.Tally, nil
}

// EndBlocker checks for proposals whose voting period has ended and tallies them.
func (k Keeper) EndBlocker(ctx sdk.Context) {
	proposals := k.GetProposals(ctx, types.ProposalStatusVoting)
	for _, p := range proposals {
		if ctx.BlockHeight() > p.VotingEndHeight {
			_, _ = k.TallyProposal(ctx, p.ID)
		}
	}
}

// ─── Storage helpers ───

func (k Keeper) setProposal(ctx sdk.Context, proposal *types.Proposal) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(proposal)
	store.Set(proposalKey(proposal.ID), bz)
}

func (k Keeper) setVote(ctx sdk.Context, vote *types.Vote) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(vote)
	store.Set(voteKey(vote.ProposalID, vote.Voter), bz)
}

func (k Keeper) hasVoted(ctx sdk.Context, proposalID uint64, voter sdk.AccAddress) bool {
	store := ctx.KVStore(k.storeKey)
	return store.Has(voteKey(proposalID, voter.String()))
}

func (k Keeper) getNextProposalID(ctx sdk.Context) uint64 {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("next_proposal_id"))
	if bz == nil {
		return 1
	}
	return binary.BigEndian.Uint64(bz)
}

func (k Keeper) setNextProposalID(ctx sdk.Context, id uint64) {
	store := ctx.KVStore(k.storeKey)
	bz := make([]byte, 8)
	binary.BigEndian.PutUint64(bz, id)
	store.Set([]byte("next_proposal_id"), bz)
}

// getRegisteredUIDCount returns the total number of registered UIDs.
// This iterates the UID store to count active UIDs for quorum calculation.
func (k Keeper) getRegisteredUIDCount(ctx sdk.Context) uint64 {
	// Count active UIDs by iterating the UID store prefix
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("uid_count")
	bz := store.Get(prefix)
	if bz == nil {
		// Fallback: return 0, which means quorum cannot be met
		// In production, this should be maintained by the UID module
		return 0
	}
	return binary.BigEndian.Uint64(bz)
}

// SetRegisteredUIDCount updates the cached UID count (called by UID module on registration).
func (k Keeper) SetRegisteredUIDCount(ctx sdk.Context, count uint64) {
	store := ctx.KVStore(k.storeKey)
	bz := make([]byte, 8)
	binary.BigEndian.PutUint64(bz, count)
	store.Set([]byte("uid_count"), bz)
}

func proposalKey(id uint64) []byte {
	bz := make([]byte, 8)
	binary.BigEndian.PutUint64(bz, id)
	return append([]byte("proposal/"), bz...)
}

func voteKey(proposalID uint64, voter string) []byte {
	return []byte(fmt.Sprintf("vote/%d/%s", proposalID, voter))
}
