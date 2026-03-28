// Package keeper — Governance Parameters.
//
// Chain parameters that can be modified via governance proposals.
// One-human-one-vote applies to parameter changes too.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ChainParams represents modifiable chain parameters.
type ChainParams struct {
	// Minting
	BaseMintRate     int64 `json:"base_mint_rate"`      // Base OTK per milestone (uotk)
	GratitudeBonus   int64 `json:"gratitude_bonus_bps"` // Basis points bonus for gratitude
	StakingAPY       int64 `json:"staking_apy_bps"`     // Basis points (500 = 5%)

	// Oracle
	MinVerifiers         int   `json:"min_verifiers"`
	VerificationWindow   int64 `json:"verification_window_blocks"`
	MinVerifierAccuracy  int64 `json:"min_verifier_accuracy"`

	// Governance
	VotingPeriodBlocks   int64 `json:"voting_period_blocks"`
	QuorumPercent        int64 `json:"quorum_percent"`        // 33 = 33%
	PassThresholdPercent int64 `json:"pass_threshold_percent"` // 50 = 50%

	// Token Factory
	MaxTokenNameLength   int   `json:"max_token_name_length"`
	MaxInitialSupply     int64 `json:"max_initial_supply"`

	// Messaging
	MaxMessageLength     int   `json:"max_message_length"`

	// Updated via governance
	LastUpdatedBlock     int64  `json:"last_updated_block"`
	LastUpdatedProposal  string `json:"last_updated_proposal"`
}

// DefaultChainParams returns sensible defaults.
func DefaultChainParams() ChainParams {
	return ChainParams{
		BaseMintRate:         100000000,  // 100 OTK base per milestone
		GratitudeBonus:       100,        // 1% bonus
		StakingAPY:           500,        // 5% APY
		MinVerifiers:         2,
		VerificationWindow:   100800,     // ~7 days
		MinVerifierAccuracy:  60,
		VotingPeriodBlocks:   100800,     // ~7 days
		QuorumPercent:        33,
		PassThresholdPercent: 50,
		MaxTokenNameLength:   64,
		MaxInitialSupply:     1000000000000, // 1 trillion
		MaxMessageLength:     256,
	}
}

// GetChainParams retrieves current chain parameters.
func (k Keeper) GetChainParams(ctx sdk.Context) ChainParams {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("chain_params"))
	if bz == nil {
		return DefaultChainParams()
	}
	var params ChainParams
	if err := json.Unmarshal(bz, &params); err != nil {
		return DefaultChainParams()
	}
	return params
}

// SetChainParams stores updated chain parameters.
func (k Keeper) SetChainParams(ctx sdk.Context, params ChainParams) error {
	store := ctx.KVStore(k.storeKey)
	bz, err := json.Marshal(params)
	if err != nil {
		return err
	}
	store.Set([]byte("chain_params"), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"chain_params_updated",
		sdk.NewAttribute("staking_apy_bps", fmt.Sprintf("%d", params.StakingAPY)),
		sdk.NewAttribute("min_verifiers", fmt.Sprintf("%d", params.MinVerifiers)),
		sdk.NewAttribute("voting_period", fmt.Sprintf("%d", params.VotingPeriodBlocks)),
		sdk.NewAttribute("updated_at", fmt.Sprintf("%d", ctx.BlockHeight())),
	))
	return nil
}

// UpdateParamFromProposal applies a parameter change from an executed governance proposal.
func (k Keeper) UpdateParamFromProposal(ctx sdk.Context, proposalID, paramName string, value int64) error {
	params := k.GetChainParams(ctx)

	switch paramName {
	case "base_mint_rate":
		params.BaseMintRate = value
	case "gratitude_bonus_bps":
		params.GratitudeBonus = value
	case "staking_apy_bps":
		params.StakingAPY = value
	case "min_verifiers":
		params.MinVerifiers = int(value)
	case "verification_window_blocks":
		params.VerificationWindow = value
	case "min_verifier_accuracy":
		params.MinVerifierAccuracy = value
	case "voting_period_blocks":
		params.VotingPeriodBlocks = value
	case "quorum_percent":
		params.QuorumPercent = value
	case "pass_threshold_percent":
		params.PassThresholdPercent = value
	case "max_message_length":
		params.MaxMessageLength = int(value)
	default:
		return fmt.Errorf("unknown parameter: %s", paramName)
	}

	params.LastUpdatedBlock = ctx.BlockHeight()
	params.LastUpdatedProposal = proposalID
	return k.SetChainParams(ctx, params)
}
