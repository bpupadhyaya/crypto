// Package keeper — Governance Proposal Execution.
//
// When a proposal passes, this module executes the proposed action.
// Proposal types:
//   - param_change: Change a chain parameter
//   - treasury_spend: Distribute funds from OTK treasury
//   - correction_reverse: Reverse a confirmed correction report
//   - text: Informational proposal (no execution)
//   - upgrade: Software upgrade signal
//   - emergency: Emergency parameter override (shorter voting)

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/govuid/types"
)

// ProposalAction defines the executable content of a proposal.
type ProposalAction struct {
	Type   string          `json:"type"`   // param_change, treasury_spend, correction_reverse, text, upgrade, emergency
	Params json.RawMessage `json:"params"` // type-specific parameters
}

// ParamChangeAction changes a chain parameter.
type ParamChangeAction struct {
	Module string `json:"module"` // target module (otk, uid, dex, etc.)
	Key    string `json:"key"`    // parameter key
	Value  string `json:"value"`  // new value
}

// TreasurySpendAction distributes funds from treasury.
type TreasurySpendAction struct {
	Recipient string `json:"recipient"` // bech32 address
	Denom     string `json:"denom"`     // uotk, unotk, etc.
	Amount    int64  `json:"amount"`    // micro-units
	Reason    string `json:"reason"`    // human-readable justification
}

// CorrectionReverseAction reverses a confirmed correction report.
type CorrectionReverseAction struct {
	ReportID string `json:"report_id"`
	Reason   string `json:"reason"`
}

// UpgradeAction signals a software upgrade.
type UpgradeAction struct {
	Name   string `json:"name"`   // upgrade name
	Height int64  `json:"height"` // target block height
	Info   string `json:"info"`   // upgrade info (binary URL, etc.)
}

// ExecutePassedProposals finds all passed proposals and executes their actions.
// Called from EndBlock after tallying.
func (k Keeper) ExecutePassedProposals(ctx sdk.Context) {
	proposals := k.GetProposals(ctx, types.ProposalStatusPassed)
	for _, p := range proposals {
		if p.Executed {
			continue
		}

		if err := k.executeProposal(ctx, &p); err != nil {
			ctx.EventManager().EmitEvent(sdk.NewEvent(
				"proposal_execution_failed",
				sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
				sdk.NewAttribute("error", err.Error()),
			))
			continue
		}

		p.Executed = true
		k.setProposal(ctx, &p)

		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"proposal_executed",
			sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
			sdk.NewAttribute("title", p.Title),
		))
	}
}

func (k Keeper) executeProposal(ctx sdk.Context, p *types.Proposal) error {
	if p.ActionType == "" || p.ActionType == "text" {
		// Text proposals have no execution — they're informational
		return nil
	}

	switch p.ActionType {
	case "param_change":
		return k.executeParamChange(ctx, p)
	case "treasury_spend":
		return k.executeTreasurySpend(ctx, p)
	case "correction_reverse":
		return k.executeCorrectionReverse(ctx, p)
	case "upgrade":
		return k.executeUpgrade(ctx, p)
	case "emergency":
		return k.executeParamChange(ctx, p) // same as param_change
	default:
		return fmt.Errorf("unknown proposal action type: %s", p.ActionType)
	}
}

func (k Keeper) executeParamChange(ctx sdk.Context, p *types.Proposal) error {
	var action ParamChangeAction
	if err := json.Unmarshal([]byte(p.ActionData), &action); err != nil {
		return fmt.Errorf("invalid param_change action data: %w", err)
	}

	// Store the parameter change in the governance param store
	store := ctx.KVStore(k.storeKey)
	paramKey := fmt.Sprintf("gov_param/%s/%s", action.Module, action.Key)
	store.Set([]byte(paramKey), []byte(action.Value))

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"param_changed",
		sdk.NewAttribute("module", action.Module),
		sdk.NewAttribute("key", action.Key),
		sdk.NewAttribute("value", action.Value),
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
	))

	return nil
}

func (k Keeper) executeTreasurySpend(ctx sdk.Context, p *types.Proposal) error {
	var action TreasurySpendAction
	if err := json.Unmarshal([]byte(p.ActionData), &action); err != nil {
		return fmt.Errorf("invalid treasury_spend action data: %w", err)
	}

	// Validate recipient address
	_, err := sdk.AccAddressFromBech32(action.Recipient)
	if err != nil {
		return fmt.Errorf("invalid recipient address: %w", err)
	}

	// Store the approved spend for the OTK module to process
	store := ctx.KVStore(k.storeKey)
	spendKey := fmt.Sprintf("approved_spend/%d", p.ID)
	bz, _ := json.Marshal(action)
	store.Set([]byte(spendKey), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"treasury_spend_approved",
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
		sdk.NewAttribute("recipient", action.Recipient),
		sdk.NewAttribute("denom", action.Denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", action.Amount)),
		sdk.NewAttribute("reason", action.Reason),
	))

	return nil
}

func (k Keeper) executeCorrectionReverse(ctx sdk.Context, p *types.Proposal) error {
	var action CorrectionReverseAction
	if err := json.Unmarshal([]byte(p.ActionData), &action); err != nil {
		return fmt.Errorf("invalid correction_reverse action data: %w", err)
	}

	// Store the approved reversal for the Correction module to process
	store := ctx.KVStore(k.storeKey)
	reversalKey := fmt.Sprintf("approved_reversal/%s", action.ReportID)
	store.Set([]byte(reversalKey), []byte(action.Reason))

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_reversal_approved",
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
		sdk.NewAttribute("report_id", action.ReportID),
		sdk.NewAttribute("reason", action.Reason),
	))

	return nil
}

func (k Keeper) executeUpgrade(ctx sdk.Context, p *types.Proposal) error {
	var action UpgradeAction
	if err := json.Unmarshal([]byte(p.ActionData), &action); err != nil {
		return fmt.Errorf("invalid upgrade action data: %w", err)
	}

	// Store upgrade plan
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(action)
	store.Set([]byte("upgrade_plan"), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"upgrade_planned",
		sdk.NewAttribute("name", action.Name),
		sdk.NewAttribute("height", fmt.Sprintf("%d", action.Height)),
		sdk.NewAttribute("proposal_id", fmt.Sprintf("%d", p.ID)),
	))

	return nil
}

// GetApprovedSpend retrieves a treasury spend that was approved by governance.
func (k Keeper) GetApprovedSpend(ctx sdk.Context, proposalID uint64) (*TreasurySpendAction, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(fmt.Sprintf("approved_spend/%d", proposalID)))
	if bz == nil {
		return nil, fmt.Errorf("no approved spend for proposal %d", proposalID)
	}
	var action TreasurySpendAction
	if err := json.Unmarshal(bz, &action); err != nil {
		return nil, err
	}
	return &action, nil
}
