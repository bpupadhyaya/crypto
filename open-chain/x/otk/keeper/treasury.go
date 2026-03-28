// Package keeper — Community Treasury.
//
// The treasury collects a small percentage of all OTK minting
// and distributes funds via governance proposals. This enables
// community-funded development, grants, and public goods.
//
// Treasury sources:
//   - 2% of all milestone mints → treasury
//   - Protocol fees from DEX trades
//   - Lending protocol reserve factor
//
// Treasury usage (via governance):
//   - Development grants
//   - Community events
//   - Infrastructure costs (validators, RPCs)
//   - Ecosystem growth

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Treasury tracks the community fund.
type Treasury struct {
	TotalBalance    int64            `json:"total_balance"`     // uotk
	BalanceByDenom  map[string]int64 `json:"balance_by_denom"`  // all denoms
	TotalCollected  int64            `json:"total_collected"`   // lifetime
	TotalDistributed int64           `json:"total_distributed"` // lifetime
	ContributionRate int64           `json:"contribution_rate"` // basis points (200 = 2%)
}

// GetTreasury retrieves current treasury state.
func (k Keeper) GetTreasury(ctx sdk.Context) Treasury {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("treasury"))
	if bz == nil {
		return Treasury{
			BalanceByDenom:   map[string]int64{},
			ContributionRate: 200, // 2% of minting
		}
	}
	var t Treasury
	_ = json.Unmarshal(bz, &t)
	return t
}

func (k Keeper) setTreasury(ctx sdk.Context, t *Treasury) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(t)
	store.Set([]byte("treasury"), bz)
}

// ContributeToTreasury adds funds to the community treasury.
func (k Keeper) ContributeToTreasury(ctx sdk.Context, denom string, amount int64) {
	t := k.GetTreasury(ctx)
	t.TotalBalance += amount
	t.TotalCollected += amount
	if t.BalanceByDenom == nil {
		t.BalanceByDenom = map[string]int64{}
	}
	t.BalanceByDenom[denom] += amount
	k.setTreasury(ctx, &t)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"treasury_contribution",
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("total", fmt.Sprintf("%d", t.TotalBalance)),
	))
}

// DistributeFromTreasury sends funds from treasury to a recipient.
// Can only be called by governance (via executed proposal).
func (k Keeper) DistributeFromTreasury(ctx sdk.Context, recipient sdk.AccAddress, denom string, amount int64, proposalID string) error {
	t := k.GetTreasury(ctx)

	available := t.BalanceByDenom[denom]
	if available < amount {
		return fmt.Errorf("insufficient treasury funds: have %d, need %d", available, amount)
	}

	// Mint and send (treasury is a virtual pool, funds are minted on demand)
	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.MintCoins(ctx, "otk", coins); err != nil {
		return err
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, "otk", recipient, coins); err != nil {
		return err
	}

	t.BalanceByDenom[denom] -= amount
	t.TotalBalance -= amount
	t.TotalDistributed += amount
	k.setTreasury(ctx, &t)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"treasury_distribution",
		sdk.NewAttribute("recipient", recipient.String()),
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("proposal_id", proposalID),
	))
	return nil
}

// CalculateTreasuryContribution computes the treasury share from a mint.
func (k Keeper) CalculateTreasuryContribution(mintAmount int64) int64 {
	t := k.GetTreasury(sdk.Context{})
	return mintAmount * t.ContributionRate / 10000
}
