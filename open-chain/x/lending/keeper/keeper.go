// Package keeper implements the Lending module state management.

package keeper

import (
	"encoding/json"
	"fmt"
	"math"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/lending/types"
)

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// Supply deposits tokens into the lending pool.
func (k Keeper) Supply(ctx sdk.Context, supplier sdk.AccAddress, denom string, amount int64) error {
	market, err := k.GetMarket(ctx, denom)
	if err != nil {
		return err
	}
	if !market.Enabled {
		return fmt.Errorf("market %s is not enabled", denom)
	}

	// Transfer tokens from user to module
	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, supplier, types.ModuleName, coins); err != nil {
		return err
	}

	// Update position
	pos := k.GetPosition(ctx, supplier.String())
	if pos.Supplied == nil {
		pos.Supplied = make(map[string]int64)
	}
	pos.Supplied[denom] += amount
	pos.Address = supplier.String()
	k.setPosition(ctx, &pos)

	// Update market
	market.TotalSupplied += amount
	k.setMarket(ctx, market)

	ctx.EventManager().EmitEvent(sdk.NewEvent("lending_supply",
		sdk.NewAttribute("supplier", supplier.String()),
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
	))
	return nil
}

// Borrow takes tokens from the lending pool against collateral.
func (k Keeper) Borrow(ctx sdk.Context, borrower sdk.AccAddress, denom string, amount int64) error {
	market, err := k.GetMarket(ctx, denom)
	if err != nil {
		return err
	}
	if market.TotalSupplied-market.TotalBorrowed < amount {
		return fmt.Errorf("insufficient liquidity in %s market", denom)
	}

	pos := k.GetPosition(ctx, borrower.String())

	// Check health factor after borrow
	if pos.Borrowed == nil {
		pos.Borrowed = make(map[string]int64)
	}
	pos.Borrowed[denom] += amount
	pos.Address = borrower.String()

	hf := k.CalculateHealthFactor(ctx, &pos)
	if hf < 1.0 {
		return fmt.Errorf("borrow would bring health factor below 1.0 (%.2f)", hf)
	}

	// Send tokens to borrower
	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, borrower, coins); err != nil {
		return err
	}

	pos.HealthFactor = hf
	k.setPosition(ctx, &pos)

	market.TotalBorrowed += amount
	k.setMarket(ctx, market)

	ctx.EventManager().EmitEvent(sdk.NewEvent("lending_borrow",
		sdk.NewAttribute("borrower", borrower.String()),
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("health_factor", fmt.Sprintf("%.2f", hf)),
	))
	return nil
}

// Repay returns borrowed tokens to the pool.
func (k Keeper) Repay(ctx sdk.Context, borrower sdk.AccAddress, denom string, amount int64) error {
	pos := k.GetPosition(ctx, borrower.String())
	borrowed := pos.Borrowed[denom]
	if borrowed == 0 {
		return fmt.Errorf("no outstanding borrow for %s", denom)
	}
	if amount > borrowed {
		amount = borrowed
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, borrower, types.ModuleName, coins); err != nil {
		return err
	}

	pos.Borrowed[denom] -= amount
	pos.HealthFactor = k.CalculateHealthFactor(ctx, &pos)
	k.setPosition(ctx, &pos)

	market, _ := k.GetMarket(ctx, denom)
	if market != nil {
		market.TotalBorrowed -= amount
		k.setMarket(ctx, market)
	}
	return nil
}

// CalculateHealthFactor computes the health factor for a position.
// HF = (sum of supplied * collateral_factor) / (sum of borrowed)
// HF >= 1.0 is safe, < 1.0 is liquidatable.
func (k Keeper) CalculateHealthFactor(ctx sdk.Context, pos *types.Position) float64 {
	var totalCollateral, totalDebt float64

	for denom, amount := range pos.Supplied {
		market, err := k.GetMarket(ctx, denom)
		if err != nil {
			continue
		}
		collateralValue := float64(amount) * float64(market.CollateralFactor) / 10000.0
		totalCollateral += collateralValue
	}

	for _, amount := range pos.Borrowed {
		totalDebt += float64(amount)
	}

	if totalDebt == 0 {
		return math.MaxFloat64
	}
	return totalCollateral / totalDebt
}

// GetMarket retrieves a lending market.
func (k Keeper) GetMarket(ctx sdk.Context, denom string) (*types.Market, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("market/" + denom))
	if bz == nil {
		// Check defaults
		for _, m := range types.DefaultGenesisState().Markets {
			if m.Denom == denom {
				return &m, nil
			}
		}
		return nil, fmt.Errorf("market %s not found", denom)
	}
	var m types.Market
	if err := json.Unmarshal(bz, &m); err != nil {
		return nil, err
	}
	return &m, nil
}

// GetAllMarkets returns all lending markets.
func (k Keeper) GetAllMarkets(ctx sdk.Context) []types.Market {
	defaults := types.DefaultGenesisState().Markets
	markets := make([]types.Market, 0, len(defaults))
	for _, d := range defaults {
		m, err := k.GetMarket(ctx, d.Denom)
		if err == nil {
			markets = append(markets, *m)
		} else {
			markets = append(markets, d)
		}
	}
	return markets
}

func (k Keeper) GetPosition(ctx sdk.Context, address string) types.Position {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("position/" + address))
	if bz == nil {
		return types.Position{Address: address, Supplied: map[string]int64{}, Borrowed: map[string]int64{}, HealthFactor: math.MaxFloat64}
	}
	var pos types.Position
	_ = json.Unmarshal(bz, &pos)
	return pos
}

func (k Keeper) setPosition(ctx sdk.Context, pos *types.Position) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(pos)
	store.Set([]byte("position/"+pos.Address), bz)
}

// InitMarket persists a lending market during genesis initialization.
func (k Keeper) InitMarket(ctx sdk.Context, m *types.Market) {
	k.setMarket(ctx, m)
}

func (k Keeper) setMarket(ctx sdk.Context, m *types.Market) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(m)
	store.Set([]byte("market/"+m.Denom), bz)
}
