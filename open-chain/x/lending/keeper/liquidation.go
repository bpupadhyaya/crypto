// Package keeper — Proper Liquidation Engine.
//
// Replaces the naive full-seizure approach with protocol-grade liquidation:
//   - Partial liquidation (50% of debt per liquidation event)
//   - Liquidator incentive (5% bonus on seized collateral)
//   - Close factor enforcement (max 50% of debt liquidatable at once)
//   - Liquidation penalty applied to borrower
//   - Insurance fund covers any shortfall after liquidation
//
// Game theory: external liquidators are incentivized to monitor positions
// and liquidate unhealthy ones for profit, keeping the protocol solvent.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/lending/types"
)

const (
	// CloseFactor is the maximum fraction of debt that can be liquidated at once (50%)
	CloseFactor = 5000 // basis points

	// LiquidationIncentive is the bonus the liquidator receives (5%)
	LiquidationIncentive = 500 // basis points

	// LiquidationPenalty is the penalty applied to the borrower (10%)
	LiquidationPenalty = 1000 // basis points

	// LiquidationThreshold is the health factor below which liquidation is allowed
	LiquidationThreshold = 1.0
)

// LiquidationEvent records a liquidation for auditing.
type LiquidationEvent struct {
	Borrower        string `json:"borrower"`
	Liquidator      string `json:"liquidator"`
	DebtDenom       string `json:"debt_denom"`
	DebtRepaid      int64  `json:"debt_repaid"`
	CollateralDenom string `json:"collateral_denom"`
	CollateralSeized int64 `json:"collateral_seized"`
	LiquidatorBonus int64  `json:"liquidator_bonus"`
	InsuranceCut    int64  `json:"insurance_cut"`
	BlockHeight     int64  `json:"block_height"`
}

// Liquidate allows an external liquidator to repay a portion of an unhealthy
// position's debt in exchange for discounted collateral.
func (k Keeper) Liquidate(ctx sdk.Context, liquidatorAddr sdk.AccAddress, borrowerAddr string, debtDenom string, repayAmount int64) (*LiquidationEvent, error) {
	// Get borrower's position
	pos, err := k.getPositionByAddress(ctx, borrowerAddr)
	if err != nil {
		return nil, fmt.Errorf("borrower position not found: %w", err)
	}

	// Check health factor is below threshold
	hf := k.CalculateHealthFactor(ctx, pos)
	if hf >= LiquidationThreshold {
		return nil, fmt.Errorf("position is healthy (HF=%.2f), cannot liquidate", hf)
	}

	// Enforce close factor — can only repay up to 50% of the debt
	totalDebt := pos.Borrowed[debtDenom]
	if totalDebt <= 0 {
		return nil, fmt.Errorf("borrower has no debt in %s", debtDenom)
	}

	maxRepay := totalDebt * CloseFactor / 10000
	if repayAmount > maxRepay {
		repayAmount = maxRepay
	}
	if repayAmount <= 0 {
		return nil, fmt.Errorf("repay amount too small")
	}

	// Calculate collateral to seize (repay amount + liquidation incentive)
	collateralToSeize := repayAmount * (10000 + LiquidationIncentive) / 10000
	liquidatorBonus := repayAmount * LiquidationIncentive / 10000
	insuranceCut := repayAmount * LiquidationPenalty / 10000 / 2 // Half of penalty to insurance

	// Find collateral denom (use the denom with highest balance)
	collateralDenom := debtDenom // default: same denom
	highestBalance := int64(0)
	for denom, balance := range pos.Supplied {
		if balance > highestBalance {
			highestBalance = balance
			collateralDenom = denom
		}
	}

	// Check sufficient collateral
	availableCollateral := pos.Supplied[collateralDenom]
	if collateralToSeize > availableCollateral {
		collateralToSeize = availableCollateral
		// Shortfall covered by insurance
		shortfall := (repayAmount + liquidatorBonus) - availableCollateral
		if shortfall > 0 {
			_ = k.CoverBadDebt(ctx, debtDenom, shortfall)
		}
	}

	// Execute liquidation:
	// 1. Transfer repayAmount from liquidator to protocol (reduces borrower's debt)
	coins := sdk.NewCoins(sdk.NewInt64Coin(debtDenom, repayAmount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, liquidatorAddr, "lending", coins); err != nil {
		return nil, fmt.Errorf("liquidator payment failed: %w", err)
	}

	// 2. Transfer seized collateral to liquidator (with bonus)
	seizedCoins := sdk.NewCoins(sdk.NewInt64Coin(collateralDenom, collateralToSeize))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, "lending", liquidatorAddr, seizedCoins); err != nil {
		return nil, fmt.Errorf("collateral transfer failed: %w", err)
	}

	// 3. Update borrower's position
	pos.Borrowed[debtDenom] -= repayAmount
	pos.Supplied[collateralDenom] -= collateralToSeize

	// 4. Contribute penalty to insurance fund
	if insuranceCut > 0 {
		k.ContributeToInsurance(ctx, debtDenom, insuranceCut)
	}

	// 5. Recalculate and save
	pos.HealthFactor = k.CalculateHealthFactor(ctx, pos)
	k.setPosition(ctx, pos)

	event := &LiquidationEvent{
		Borrower:         borrowerAddr,
		Liquidator:       liquidatorAddr.String(),
		DebtDenom:        debtDenom,
		DebtRepaid:       repayAmount,
		CollateralDenom:  collateralDenom,
		CollateralSeized: collateralToSeize,
		LiquidatorBonus:  liquidatorBonus,
		InsuranceCut:     insuranceCut,
		BlockHeight:      ctx.BlockHeight(),
	}

	// Store liquidation event for history
	k.recordLiquidation(ctx, event)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"liquidation",
		sdk.NewAttribute("borrower", borrowerAddr),
		sdk.NewAttribute("liquidator", liquidatorAddr.String()),
		sdk.NewAttribute("debt_denom", debtDenom),
		sdk.NewAttribute("debt_repaid", fmt.Sprintf("%d", repayAmount)),
		sdk.NewAttribute("collateral_seized", fmt.Sprintf("%d", collateralToSeize)),
		sdk.NewAttribute("liquidator_bonus", fmt.Sprintf("%d", liquidatorBonus)),
		sdk.NewAttribute("new_health_factor", fmt.Sprintf("%.2f", pos.HealthFactor)),
	))

	return event, nil
}

// CheckAndAutoLiquidate is called from EndBlock. For positions below threshold,
// it performs partial auto-liquidation (protocol acts as liquidator).
func (k Keeper) CheckAndAutoLiquidate(ctx sdk.Context) {
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
		if hf >= LiquidationThreshold {
			continue
		}

		// Auto-liquidate: protocol seizes 50% of each borrowed denom
		for denom, borrowed := range pos.Borrowed {
			if borrowed <= 0 {
				continue
			}

			repayAmount := borrowed * CloseFactor / 10000
			if repayAmount <= 0 {
				continue
			}

			// Seize collateral proportionally
			penalty := repayAmount * LiquidationPenalty / 10000
			seizeAmount := repayAmount + penalty

			supplied := pos.Supplied[denom]
			if seizeAmount > supplied {
				// Shortfall
				shortfall := seizeAmount - supplied
				pos.Supplied[denom] = 0
				_ = k.CoverBadDebt(ctx, denom, shortfall)
			} else {
				pos.Supplied[denom] -= seizeAmount
			}

			pos.Borrowed[denom] -= repayAmount

			// Penalty goes to insurance fund
			if penalty > 0 {
				k.ContributeToInsurance(ctx, denom, penalty)
			}

			ctx.EventManager().EmitEvent(sdk.NewEvent(
				"auto_liquidation",
				sdk.NewAttribute("borrower", pos.Address),
				sdk.NewAttribute("denom", denom),
				sdk.NewAttribute("debt_cleared", fmt.Sprintf("%d", repayAmount)),
				sdk.NewAttribute("collateral_seized", fmt.Sprintf("%d", seizeAmount)),
				sdk.NewAttribute("penalty_to_insurance", fmt.Sprintf("%d", penalty)),
			))
		}

		pos.HealthFactor = k.CalculateHealthFactor(ctx, &pos)
		k.setPosition(ctx, &pos)
	}
}

// GetLiquidationHistory returns recent liquidation events.
func (k Keeper) GetLiquidationHistory(ctx sdk.Context, limit int) []LiquidationEvent {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("liquidation/")
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var events []LiquidationEvent
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var e LiquidationEvent
		if err := json.Unmarshal(iterator.Value(), &e); err != nil {
			continue
		}
		events = append(events, e)
		count++
	}
	return events
}

func (k Keeper) recordLiquidation(ctx sdk.Context, event *LiquidationEvent) {
	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("liquidation/%d/%s", event.BlockHeight, event.Borrower)
	bz, _ := json.Marshal(event)
	store.Set([]byte(key), bz)
}

func (k Keeper) getPositionByAddress(ctx sdk.Context, addr string) (*types.Position, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("position/" + addr))
	if bz == nil {
		return nil, fmt.Errorf("position not found for %s", addr)
	}
	var pos types.Position
	if err := json.Unmarshal(bz, &pos); err != nil {
		return nil, err
	}
	return &pos, nil
}
