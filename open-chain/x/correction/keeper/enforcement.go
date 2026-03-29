// Package keeper — Correction Enforcement.
//
// When a correction report is confirmed (community consensus reached),
// this enforcement module applies -OTK to the target's balance.
// This is the mechanism by which The Human Constitution holds people accountable
// while ensuring due process (Article V).
//
// Enforcement flow:
//   1. Report submitted → community reviews
//   2. Min 3 verifiers approve → report confirmed
//   3. Enforcement applies -OTK via burn from target's account
//   4. Target can contest → if governance reverses, OTK is restored
//   5. All enforcement is recorded in the Living Ledger

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// CorrectionEnforcement tracks the actual application of -OTK.
type CorrectionEnforcement struct {
	ReportID    string `json:"report_id"`
	TargetUID   string `json:"target_uid"`
	Channel     string `json:"channel"`
	Amount      int64  `json:"amount"`     // amount burned
	EnforcedAt  int64  `json:"enforced_at"` // block height
	Reversed    bool   `json:"reversed"`    // true if governance reversed
	ReversedAt  int64  `json:"reversed_at,omitempty"`
	ReverseNote string `json:"reverse_note,omitempty"`
}

// EnforceConfirmedCorrections processes all confirmed but unenforced reports.
// Called from EndBlock. Burns -OTK from target accounts.
func (k Keeper) EnforceConfirmedCorrections(ctx sdk.Context, bankBurn func(ctx sdk.Context, addr sdk.AccAddress, denom string, amount int64) error) {
	store := ctx.KVStore(k.storeKey)

	// Iterate all reports looking for confirmed + unenforced
	prefix := reportPrefix
	iter := store.Iterator(prefix, prefixEndBytes(prefix))
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		var report correctionReportForEnforcement
		if err := json.Unmarshal(iter.Value(), &report); err != nil {
			continue
		}

		if report.Status != "confirmed" {
			continue
		}

		// Check if already enforced
		enfKey := []byte(fmt.Sprintf("cenf/%s", report.ID))
		if store.Has(enfKey) {
			continue
		}

		// Apply -OTK: burn from target's account
		targetAddr, err := sdk.AccAddressFromBech32(report.TargetUID)
		if err != nil {
			// UID may not be a valid address — skip
			continue
		}

		// Determine the channel denom
		denom := channelToDenom(report.Channel)
		if denom == "" {
			denom = "uotk"
		}

		// Attempt to burn
		if bankBurn != nil {
			if err := bankBurn(ctx, targetAddr, denom, report.Amount); err != nil {
				// If target doesn't have enough, burn what they have
				ctx.EventManager().EmitEvent(sdk.NewEvent(
					"correction_enforcement_partial",
					sdk.NewAttribute("report_id", report.ID),
					sdk.NewAttribute("error", err.Error()),
				))
				continue
			}
		}

		// Record enforcement
		enforcement := CorrectionEnforcement{
			ReportID:   report.ID,
			TargetUID:  report.TargetUID,
			Channel:    report.Channel,
			Amount:     report.Amount,
			EnforcedAt: ctx.BlockHeight(),
		}
		enfBz, _ := json.Marshal(enforcement)
		store.Set(enfKey, enfBz)

		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"correction_enforced",
			sdk.NewAttribute("report_id", report.ID),
			sdk.NewAttribute("target_uid", report.TargetUID),
			sdk.NewAttribute("channel", report.Channel),
			sdk.NewAttribute("amount_burned", fmt.Sprintf("%d", report.Amount)),
			sdk.NewAttribute("denom", denom),
		))
	}
}

// ReverseEnforcement restores -OTK when governance reverses a correction.
func (k Keeper) ReverseEnforcement(ctx sdk.Context, reportID, reason string, bankMint func(ctx sdk.Context, addr sdk.AccAddress, denom string, amount int64) error) error {
	store := ctx.KVStore(k.storeKey)
	enfKey := []byte(fmt.Sprintf("cenf/%s", reportID))

	bz := store.Get(enfKey)
	if bz == nil {
		return fmt.Errorf("no enforcement record for report %s", reportID)
	}

	var enforcement CorrectionEnforcement
	if err := json.Unmarshal(bz, &enforcement); err != nil {
		return err
	}

	if enforcement.Reversed {
		return fmt.Errorf("enforcement for report %s already reversed", reportID)
	}

	// Restore OTK to target
	targetAddr, err := sdk.AccAddressFromBech32(enforcement.TargetUID)
	if err != nil {
		return err
	}

	denom := channelToDenom(enforcement.Channel)
	if denom == "" {
		denom = "uotk"
	}

	if bankMint != nil {
		if err := bankMint(ctx, targetAddr, denom, enforcement.Amount); err != nil {
			return fmt.Errorf("failed to restore OTK: %w", err)
		}
	}

	// Update enforcement record
	enforcement.Reversed = true
	enforcement.ReversedAt = ctx.BlockHeight()
	enforcement.ReverseNote = reason
	updatedBz, _ := json.Marshal(enforcement)
	store.Set(enfKey, updatedBz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"correction_enforcement_reversed",
		sdk.NewAttribute("report_id", reportID),
		sdk.NewAttribute("target_uid", enforcement.TargetUID),
		sdk.NewAttribute("amount_restored", fmt.Sprintf("%d", enforcement.Amount)),
		sdk.NewAttribute("reason", reason),
	))

	return nil
}

// GetEnforcement retrieves an enforcement record.
func (k Keeper) GetEnforcement(ctx sdk.Context, reportID string) (*CorrectionEnforcement, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(fmt.Sprintf("cenf/%s", reportID)))
	if bz == nil {
		return nil, fmt.Errorf("no enforcement for report %s", reportID)
	}
	var e CorrectionEnforcement
	if err := json.Unmarshal(bz, &e); err != nil {
		return nil, err
	}
	return &e, nil
}

// GetAllEnforcements returns all enforcement records.
func (k Keeper) GetAllEnforcements(ctx sdk.Context) []CorrectionEnforcement {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("cenf/")
	iter := store.Iterator(prefix, prefixEndBytes(prefix))
	defer iter.Close()

	var enforcements []CorrectionEnforcement
	for ; iter.Valid(); iter.Next() {
		var e CorrectionEnforcement
		if err := json.Unmarshal(iter.Value(), &e); err != nil {
			continue
		}
		enforcements = append(enforcements, e)
	}
	return enforcements
}

// --- Internal types & helpers ---

// correctionReportForEnforcement is a subset of CorrectionReport fields needed for enforcement.
type correctionReportForEnforcement struct {
	ID        string `json:"id"`
	TargetUID string `json:"target_uid"`
	Channel   string `json:"channel"`
	Amount    int64  `json:"amount"`
	Status    string `json:"status"`
}

func channelToDenom(channel string) string {
	switch channel {
	case "economic":
		return "uxotk"
	case "nurture":
		return "unotk"
	case "education":
		return "ueotk"
	case "health":
		return "uhotk"
	case "community":
		return "ucotk"
	case "governance":
		return "ugotk"
	default:
		return "uotk"
	}
}

func prefixEndBytes(prefix []byte) []byte {
	if len(prefix) == 0 {
		return nil
	}
	end := make([]byte, len(prefix))
	copy(end, prefix)
	for i := len(end) - 1; i >= 0; i-- {
		end[i]++
		if end[i] != 0 {
			return end
		}
	}
	return nil
}
