// Package keeper — Milestone Oracle Network.
//
// Manages verifier registration and multi-source milestone verification.
// Verifiers are registered UIDs that can attest to human development milestones.
// A milestone requires attestations from multiple independent verifiers before
// OTK is minted (configurable threshold, default: 2 of 3).

package keeper

import (
	"encoding/json"
	"fmt"

	"cosmossdk.io/math"
	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/otk/types"
)

// ─── Verifier Types ───

// VerifierStatus represents the status of a registered verifier.
type VerifierStatus string

const (
	VerifierActive    VerifierStatus = "active"
	VerifierSuspended VerifierStatus = "suspended"
	VerifierRevoked   VerifierStatus = "revoked"
)

// Verifier is a registered entity that can attest to milestones.
type Verifier struct {
	UID          string         `json:"uid"`           // Universal ID of the verifier
	Address      string         `json:"address"`       // Bech32 address
	Name         string         `json:"name"`          // Human-readable name
	Channels     []string       `json:"channels"`      // Channels they can verify (e.g., "education", "health")
	Status       VerifierStatus `json:"status"`
	Attestations int64          `json:"attestations"`  // Total attestations made
	Accuracy     int64          `json:"accuracy"`       // Accuracy score (0-100)
	RegisteredAt int64          `json:"registered_at"` // Block height
}

// Attestation is a single verifier's claim that a milestone is genuine.
type Attestation struct {
	MilestoneID string `json:"milestone_id"`
	VerifierUID string `json:"verifier_uid"`
	Approved    bool   `json:"approved"`    // true = verified, false = rejected
	Evidence    string `json:"evidence"`    // Hash of supporting evidence
	BlockHeight int64  `json:"block_height"`
}

// PendingMilestone tracks a milestone awaiting sufficient attestations.
type PendingMilestone struct {
	MilestoneID   string        `json:"milestone_id"`
	UID           string        `json:"uid"`
	Channel       string        `json:"channel"`
	Description   string        `json:"description"`
	MintAmount    int64         `json:"mint_amount"`
	Attestations  []Attestation `json:"attestations"`
	Threshold     int           `json:"threshold"`     // Required approvals
	SubmittedAt   int64         `json:"submitted_at"`  // Block height
	ExpiresAt     int64         `json:"expires_at"`    // Block height (default: ~7 days)
	Status        string        `json:"status"`        // "pending", "verified", "rejected", "expired"
}

// OracleParams configures the milestone oracle network.
type OracleParams struct {
	MinVerifiers       int   `json:"min_verifiers"`        // Min verifiers per attestation (default: 2)
	VerificationWindow int64 `json:"verification_window"`  // Blocks to collect attestations (default: ~7 days = 100800 at 6s)
	MinAccuracy        int64 `json:"min_accuracy"`         // Min accuracy score to remain active (default: 60)
}

// DefaultOracleParams returns sensible defaults.
func DefaultOracleParams() OracleParams {
	return OracleParams{
		MinVerifiers:       2,
		VerificationWindow: 100800, // ~7 days at 6s blocks
		MinAccuracy:        60,
	}
}

// ─── Verifier Registration ───

// RegisterVerifier registers a new verifier on the oracle network.
func (k Keeper) RegisterVerifier(ctx sdk.Context, verifier Verifier) error {
	// Check if already registered
	existing, err := k.GetVerifier(ctx, verifier.UID)
	if err == nil && existing != nil {
		return fmt.Errorf("verifier %s already registered", verifier.UID)
	}

	verifier.Status = VerifierActive
	verifier.Attestations = 0
	verifier.Accuracy = 100 // Start with perfect score
	verifier.RegisteredAt = ctx.BlockHeight()

	if err := k.setVerifier(ctx, &verifier); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"verifier_registered",
		sdk.NewAttribute("uid", verifier.UID),
		sdk.NewAttribute("channels", fmt.Sprintf("%v", verifier.Channels)),
	))

	return nil
}

// GetVerifier retrieves a verifier by UID.
func (k Keeper) GetVerifier(ctx sdk.Context, uid string) (*Verifier, error) {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("verifier/%s", uid))

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("verifier %s not found", uid)
	}

	var v Verifier
	if err := json.Unmarshal(bz, &v); err != nil {
		return nil, err
	}
	return &v, nil
}

func (k Keeper) setVerifier(ctx sdk.Context, v *Verifier) error {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("verifier/%s", v.UID))

	bz, err := json.Marshal(v)
	if err != nil {
		return err
	}
	store.Set(key, bz)
	return nil
}

// GetActiveVerifiers returns all active verifiers for a given channel.
func (k Keeper) GetActiveVerifiers(ctx sdk.Context, channel string) ([]Verifier, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("verifier/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var verifiers []Verifier
	for ; iterator.Valid(); iterator.Next() {
		var v Verifier
		if err := json.Unmarshal(iterator.Value(), &v); err != nil {
			continue
		}
		if v.Status != VerifierActive {
			continue
		}
		for _, ch := range v.Channels {
			if ch == channel {
				verifiers = append(verifiers, v)
				break
			}
		}
	}
	return verifiers, nil
}

// SuspendVerifier suspends a verifier (e.g., accuracy below threshold).
func (k Keeper) SuspendVerifier(ctx sdk.Context, uid string) error {
	v, err := k.GetVerifier(ctx, uid)
	if err != nil {
		return err
	}
	v.Status = VerifierSuspended
	return k.setVerifier(ctx, v)
}

// ─── Milestone Submission & Verification ───

// SubmitMilestone creates a pending milestone awaiting verifier attestations.
func (k Keeper) SubmitMilestone(ctx sdk.Context, milestoneID, uid, channel, description string, mintAmount int64) error {
	params := DefaultOracleParams()

	pm := PendingMilestone{
		MilestoneID:  milestoneID,
		UID:          uid,
		Channel:      channel,
		Description:  description,
		MintAmount:   mintAmount,
		Attestations: []Attestation{},
		Threshold:    params.MinVerifiers,
		SubmittedAt:  ctx.BlockHeight(),
		ExpiresAt:    ctx.BlockHeight() + params.VerificationWindow,
		Status:       "pending",
	}

	if err := k.setPendingMilestone(ctx, &pm); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"milestone_submitted",
		sdk.NewAttribute("milestone_id", milestoneID),
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("channel", channel),
		sdk.NewAttribute("mint_amount", fmt.Sprintf("%d", mintAmount)),
	))

	return nil
}

// AttestMilestone records a verifier's attestation for a pending milestone.
func (k Keeper) AttestMilestone(ctx sdk.Context, milestoneID, verifierUID string, approved bool, evidence string) error {
	// Verify the verifier is registered and active
	verifier, err := k.GetVerifier(ctx, verifierUID)
	if err != nil {
		return fmt.Errorf("verifier not found: %w", err)
	}
	if verifier.Status != VerifierActive {
		return fmt.Errorf("verifier %s is not active (status: %s)", verifierUID, verifier.Status)
	}

	// Get the pending milestone
	pm, err := k.GetPendingMilestone(ctx, milestoneID)
	if err != nil {
		return err
	}
	if pm.Status != "pending" {
		return fmt.Errorf("milestone %s is not pending (status: %s)", milestoneID, pm.Status)
	}
	if ctx.BlockHeight() > pm.ExpiresAt {
		pm.Status = "expired"
		_ = k.setPendingMilestone(ctx, pm)
		return fmt.Errorf("milestone %s has expired", milestoneID)
	}

	// Check verifier hasn't already attested
	for _, a := range pm.Attestations {
		if a.VerifierUID == verifierUID {
			return fmt.Errorf("verifier %s has already attested to milestone %s", verifierUID, milestoneID)
		}
	}

	// Check verifier is authorized for this channel
	authorized := false
	for _, ch := range verifier.Channels {
		if ch == pm.Channel {
			authorized = true
			break
		}
	}
	if !authorized {
		return fmt.Errorf("verifier %s is not authorized for channel %s", verifierUID, pm.Channel)
	}

	// Record attestation
	attestation := Attestation{
		MilestoneID: milestoneID,
		VerifierUID: verifierUID,
		Approved:    approved,
		Evidence:    evidence,
		BlockHeight: ctx.BlockHeight(),
	}
	pm.Attestations = append(pm.Attestations, attestation)

	// Update verifier stats
	verifier.Attestations++
	_ = k.setVerifier(ctx, verifier)

	// Check if threshold met
	approvals := 0
	rejections := 0
	for _, a := range pm.Attestations {
		if a.Approved {
			approvals++
		} else {
			rejections++
		}
	}

	if approvals >= pm.Threshold {
		pm.Status = "verified"
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"milestone_verified",
			sdk.NewAttribute("milestone_id", milestoneID),
			sdk.NewAttribute("uid", pm.UID),
			sdk.NewAttribute("approvals", fmt.Sprintf("%d", approvals)),
		))
	} else if rejections >= pm.Threshold {
		pm.Status = "rejected"
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"milestone_rejected",
			sdk.NewAttribute("milestone_id", milestoneID),
			sdk.NewAttribute("uid", pm.UID),
			sdk.NewAttribute("rejections", fmt.Sprintf("%d", rejections)),
		))
	}

	return k.setPendingMilestone(ctx, pm)
}

// GetPendingMilestone retrieves a pending milestone by ID.
func (k Keeper) GetPendingMilestone(ctx sdk.Context, milestoneID string) (*PendingMilestone, error) {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("pending_milestone/%s", milestoneID))

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("pending milestone %s not found", milestoneID)
	}

	var pm PendingMilestone
	if err := json.Unmarshal(bz, &pm); err != nil {
		return nil, err
	}
	return &pm, nil
}

func (k Keeper) setPendingMilestone(ctx sdk.Context, pm *PendingMilestone) error {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("pending_milestone/%s", pm.MilestoneID))

	bz, err := json.Marshal(pm)
	if err != nil {
		return err
	}
	store.Set(key, bz)
	return nil
}

// GetPendingMilestones returns all pending milestones (for EndBlocker processing).
func (k Keeper) GetPendingMilestones(ctx sdk.Context) ([]PendingMilestone, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("pending_milestone/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var milestones []PendingMilestone
	for ; iterator.Valid(); iterator.Next() {
		var pm PendingMilestone
		if err := json.Unmarshal(iterator.Value(), &pm); err != nil {
			continue
		}
		if pm.Status == "pending" {
			milestones = append(milestones, pm)
		}
	}
	return milestones, nil
}

// GetVerifiedMilestones returns all milestones with status "verified" that
// have not yet been executed (minted). Called from EndBlock to process minting.
func (k Keeper) GetVerifiedMilestones(ctx sdk.Context) ([]PendingMilestone, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("pending_milestone/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var milestones []PendingMilestone
	for ; iterator.Valid(); iterator.Next() {
		var pm PendingMilestone
		if err := json.Unmarshal(iterator.Value(), &pm); err != nil {
			continue
		}
		if pm.Status == "verified" {
			milestones = append(milestones, pm)
		}
	}
	return milestones, nil
}

// ProcessVerifiedMilestones finds milestones that reached attestation threshold
// and triggers OTK minting. Called from EndBlock.
//
// P2P minting flow:
//  1. User submits milestone -> creates MsgSubmitMilestone tx
//  2. Tx gossips to all peers via mempool
//  3. Verifiers see pending milestone, submit MsgAttestMilestone
//  4. Attestation txs gossip to all peers
//  5. When threshold met, status becomes "verified"
//  6. EndBlock calls this function -- next block proposer includes the mint
//  7. All validators verify the mint and include in consensus
//  8. OTK is minted -- all nodes update state
func (k Keeper) ProcessVerifiedMilestones(ctx sdk.Context) {
	milestones, err := k.GetVerifiedMilestones(ctx)
	if err != nil {
		return
	}

	for _, pm := range milestones {
		// Build Milestone struct for minting
		milestone := types.Milestone{
			ID:         pm.MilestoneID,
			UID:        pm.UID,
			Channel:    pm.Channel,
			MintAmount: math.NewInt(pm.MintAmount),
			Verified:   true,
		}

		// Mint with ripple attribution to default rings.
		// For now, mint directly to the UID's address (Ring Self).
		addr, err := sdk.AccAddressFromBech32(pm.UID)
		if err != nil {
			// UID may not be a valid bech32 address yet -- skip
			continue
		}
		rings := map[types.ContributionRing][]sdk.AccAddress{
			types.RingSelf: {addr},
		}

		if err := k.MintForMilestone(ctx, milestone, rings); err != nil {
			// Log but don't halt the chain on mint failure
			ctx.EventManager().EmitEvent(sdk.NewEvent(
				"milestone_mint_failed",
				sdk.NewAttribute("milestone_id", pm.MilestoneID),
				sdk.NewAttribute("error", err.Error()),
			))
			continue
		}

		// Mark as executed so it's not processed again
		pm.Status = "executed"
		_ = k.setPendingMilestone(ctx, &pm)

		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"milestone_executed",
			sdk.NewAttribute("milestone_id", pm.MilestoneID),
			sdk.NewAttribute("uid", pm.UID),
			sdk.NewAttribute("channel", pm.Channel),
			sdk.NewAttribute("mint_amount", fmt.Sprintf("%d", pm.MintAmount)),
		))
	}
}

// ExpireOldMilestones marks expired pending milestones. Called from EndBlocker.
func (k Keeper) ExpireOldMilestones(ctx sdk.Context) {
	milestones, err := k.GetPendingMilestones(ctx)
	if err != nil {
		return
	}

	for _, pm := range milestones {
		if ctx.BlockHeight() > pm.ExpiresAt {
			pm.Status = "expired"
			_ = k.setPendingMilestone(ctx, &pm)

			ctx.EventManager().EmitEvent(sdk.NewEvent(
				"milestone_expired",
				sdk.NewAttribute("milestone_id", pm.MilestoneID),
				sdk.NewAttribute("uid", pm.UID),
			))
		}
	}
}
