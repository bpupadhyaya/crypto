// Package keeper — Insurance Fund for the Lending Protocol.
//
// The insurance fund protects lenders from bad debt caused by
// failed liquidations. A percentage of borrowing interest
// is directed to the fund. If a position becomes underwater
// (collateral < debt after liquidation), the insurance fund
// covers the shortfall.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/lending/types"
)

// InsuranceFund tracks the protocol's safety reserves.
type InsuranceFund struct {
	TotalFund      int64            `json:"total_fund"`       // Total insurance fund balance (uotk)
	Contributions  int64            `json:"contributions"`     // Lifetime contributions from interest
	Payouts        int64            `json:"payouts"`           // Lifetime payouts for bad debt
	FundByDenom    map[string]int64 `json:"fund_by_denom"`    // Per-denom reserves
	ContributionRate int64          `json:"contribution_rate"` // Basis points of interest (default: 1000 = 10%)
}

// GetInsuranceFund retrieves the current insurance fund state.
func (k Keeper) GetInsuranceFund(ctx sdk.Context) InsuranceFund {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("insurance_fund"))
	if bz == nil {
		return InsuranceFund{
			FundByDenom:      map[string]int64{},
			ContributionRate: 1000, // 10% of interest goes to insurance
		}
	}
	var fund InsuranceFund
	_ = json.Unmarshal(bz, &fund)
	return fund
}

func (k Keeper) setInsuranceFund(ctx sdk.Context, fund *InsuranceFund) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(fund)
	store.Set([]byte("insurance_fund"), bz)
}

// ContributeToInsurance adds a portion of interest payments to the fund.
func (k Keeper) ContributeToInsurance(ctx sdk.Context, denom string, amount int64) {
	fund := k.GetInsuranceFund(ctx)
	fund.TotalFund += amount
	fund.Contributions += amount
	if fund.FundByDenom == nil {
		fund.FundByDenom = map[string]int64{}
	}
	fund.FundByDenom[denom] += amount
	k.setInsuranceFund(ctx, &fund)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"insurance_contribution",
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("total_fund", fmt.Sprintf("%d", fund.TotalFund)),
	))
}

// CoverBadDebt uses insurance fund to cover a shortfall from failed liquidation.
func (k Keeper) CoverBadDebt(ctx sdk.Context, denom string, shortfall int64) error {
	fund := k.GetInsuranceFund(ctx)

	available := fund.FundByDenom[denom]
	if available < shortfall {
		// Use whatever is available
		shortfall = available
	}

	if shortfall <= 0 {
		return fmt.Errorf("insurance fund insufficient for %s", denom)
	}

	fund.FundByDenom[denom] -= shortfall
	fund.TotalFund -= shortfall
	fund.Payouts += shortfall
	k.setInsuranceFund(ctx, &fund)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"insurance_payout",
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", shortfall)),
		sdk.NewAttribute("remaining_fund", fmt.Sprintf("%d", fund.TotalFund)),
	))
	return nil
}

// Liquidate checks positions with health factor < 1.0 and liquidates them.
// Called from EndBlock periodically.
func (k Keeper) CheckLiquidations(ctx sdk.Context) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("position/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var pos types.Position
		if err := json.Unmarshal(iterator.Value(), &pos); err != nil {
			continue
		}

		hf := k.CalculateHealthFactor(ctx, &pos)
		if hf >= 1.0 {
			continue
		}

		// Liquidate: seize collateral to cover debt
		for denom, borrowed := range pos.Borrowed {
			supplied := pos.Supplied[denom]
			if supplied >= borrowed {
				// Sufficient collateral — clear debt
				pos.Supplied[denom] -= borrowed
				pos.Borrowed[denom] = 0
			} else {
				// Insufficient — use insurance fund for shortfall
				shortfall := borrowed - supplied
				pos.Supplied[denom] = 0
				pos.Borrowed[denom] = 0
				_ = k.CoverBadDebt(ctx, denom, shortfall)
			}
		}

		pos.HealthFactor = k.CalculateHealthFactor(ctx, &pos)
		k.setPosition(ctx, &pos)

		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"position_liquidated",
			sdk.NewAttribute("address", pos.Address),
			sdk.NewAttribute("health_factor", fmt.Sprintf("%.2f", hf)),
		))
	}
}
