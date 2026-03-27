// Package keeper implements the DEX module — AMM pools + Order Book.

package keeper

import (
	"encoding/json"
	"fmt"
	"math"
	"sync/atomic"

	sdkmath "cosmossdk.io/math"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/dex/types"
)

// orderSeq is a per-process atomic counter for generating unique order IDs.
var orderSeq atomic.Int64

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// ─── AMM Pool Operations ───

// CreatePool creates a new liquidity pool.
func (k Keeper) CreatePool(ctx sdk.Context, creator sdk.AccAddress, tokenA, tokenB string, amountA, amountB int64, feeRate int64) (*types.LiquidityPool, error) {
	poolID := fmt.Sprintf("pool-%s-%s", tokenA, tokenB)

	// Transfer tokens from creator to module
	coins := sdk.NewCoins(
		sdk.NewCoin(tokenA, sdkmath.NewInt(amountA)),
		sdk.NewCoin(tokenB, sdkmath.NewInt(amountB)),
	)
	if err := k.bank.SendCoinsFromAccountToModule(ctx, creator, types.ModuleName, coins); err != nil {
		return nil, fmt.Errorf("failed to deposit: %w", err)
	}

	// Mint LP tokens (sqrt of product)
	lpSupply := int64(math.Sqrt(float64(amountA) * float64(amountB)))

	pool := &types.LiquidityPool{
		ID: poolID, TokenA: tokenA, TokenB: tokenB,
		ReserveA: amountA, ReserveB: amountB, LPSupply: lpSupply, FeeRate: feeRate,
	}

	k.setPool(ctx, pool)

	// Mint LP tokens to creator
	lpCoins := sdk.NewCoins(sdk.NewCoin(poolID+"-lp", sdkmath.NewInt(lpSupply)))
	if err := k.bank.MintCoins(ctx, types.ModuleName, lpCoins); err != nil {
		return nil, err
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, creator, lpCoins); err != nil {
		return nil, err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent("pool_created",
		sdk.NewAttribute("pool_id", poolID),
		sdk.NewAttribute("token_a", tokenA),
		sdk.NewAttribute("token_b", tokenB),
	))

	return pool, nil
}

// Swap executes an AMM swap. Returns output amount.
func (k Keeper) Swap(ctx sdk.Context, sender sdk.AccAddress, poolID string, inputDenom string, inputAmount int64) (int64, error) {
	pool, err := k.getPool(ctx, poolID)
	if err != nil {
		return 0, err
	}

	var inputReserve, outputReserve *int64
	var outputDenom string

	if inputDenom == pool.TokenA {
		inputReserve = &pool.ReserveA
		outputReserve = &pool.ReserveB
		outputDenom = pool.TokenB
	} else if inputDenom == pool.TokenB {
		inputReserve = &pool.ReserveB
		outputReserve = &pool.ReserveA
		outputDenom = pool.TokenA
	} else {
		return 0, fmt.Errorf("token %s not in pool %s", inputDenom, poolID)
	}

	// Apply fee
	feeAmount := inputAmount * pool.FeeRate / 10000
	inputAfterFee := inputAmount - feeAmount

	// Constant product: dy = y * dx / (x + dx)
	outputAmount := (*outputReserve * inputAfterFee) / (*inputReserve + inputAfterFee)
	if outputAmount <= 0 {
		return 0, fmt.Errorf("output amount too small")
	}

	// Transfer input from sender to module
	inputCoins := sdk.NewCoins(sdk.NewCoin(inputDenom, sdkmath.NewInt(inputAmount)))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, sender, types.ModuleName, inputCoins); err != nil {
		return 0, err
	}

	// Transfer output from module to sender
	outputCoins := sdk.NewCoins(sdk.NewCoin(outputDenom, sdkmath.NewInt(outputAmount)))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, sender, outputCoins); err != nil {
		return 0, err
	}

	// Update reserves
	*inputReserve += inputAmount
	*outputReserve -= outputAmount
	k.setPool(ctx, pool)

	ctx.EventManager().EmitEvent(sdk.NewEvent("swap",
		sdk.NewAttribute("pool_id", poolID),
		sdk.NewAttribute("input", fmt.Sprintf("%d%s", inputAmount, inputDenom)),
		sdk.NewAttribute("output", fmt.Sprintf("%d%s", outputAmount, outputDenom)),
		sdk.NewAttribute("fee", fmt.Sprintf("%d%s", feeAmount, inputDenom)),
	))

	return outputAmount, nil
}

// ─── Order Book Operations ───

// PlaceLimitOrder places a limit order on the order book.
func (k Keeper) PlaceLimitOrder(ctx sdk.Context, maker sdk.AccAddress, sellDenom, buyDenom string, sellAmount, price int64) (*types.LimitOrder, error) {
	orderID := fmt.Sprintf("order-%d-%d", ctx.BlockHeight(), orderSeq.Add(1))

	// Lock sell tokens
	coins := sdk.NewCoins(sdk.NewCoin(sellDenom, sdkmath.NewInt(sellAmount)))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, maker, types.ModuleName, coins); err != nil {
		return nil, fmt.Errorf("failed to lock tokens: %w", err)
	}

	order := &types.LimitOrder{
		ID: orderID, Maker: maker.String(),
		SellDenom: sellDenom, BuyDenom: buyDenom,
		SellAmount: sellAmount, Price: price,
		FilledPct: 0, Status: "open",
		CreatedAt: ctx.BlockHeight(),
		ExpiresAt: ctx.BlockHeight() + 100800, // ~7 days at 6s blocks
	}

	k.setOrder(ctx, order)

	ctx.EventManager().EmitEvent(sdk.NewEvent("limit_order_placed",
		sdk.NewAttribute("order_id", orderID),
		sdk.NewAttribute("maker", maker.String()),
		sdk.NewAttribute("sell", fmt.Sprintf("%d%s", sellAmount, sellDenom)),
		sdk.NewAttribute("price", fmt.Sprintf("%d", price)),
	))

	return order, nil
}

// FillOrder fills a limit order (taker buys from maker).
func (k Keeper) FillOrder(ctx sdk.Context, taker sdk.AccAddress, orderID string) error {
	order, err := k.getOrder(ctx, orderID)
	if err != nil {
		return err
	}
	if order.Status != "open" {
		return fmt.Errorf("order %s is %s", orderID, order.Status)
	}

	// Calculate buy amount: sellAmount * price / 1e8
	buyAmount := order.SellAmount * order.Price / 1e8

	// Transfer buy tokens from taker to maker
	maker, _ := sdk.AccAddressFromBech32(order.Maker)
	buyCoins := sdk.NewCoins(sdk.NewCoin(order.BuyDenom, sdkmath.NewInt(buyAmount)))
	if err := k.bank.SendCoins(ctx, taker, maker, buyCoins); err != nil {
		return fmt.Errorf("taker insufficient funds: %w", err)
	}

	// Release sell tokens from module to taker
	sellCoins := sdk.NewCoins(sdk.NewCoin(order.SellDenom, sdkmath.NewInt(order.SellAmount)))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, taker, sellCoins); err != nil {
		return err
	}

	order.Status = "filled"
	order.FilledPct = 100
	k.setOrder(ctx, order)

	ctx.EventManager().EmitEvent(sdk.NewEvent("limit_order_filled",
		sdk.NewAttribute("order_id", orderID),
		sdk.NewAttribute("taker", taker.String()),
	))

	return nil
}

// CancelOrder cancels an open order, refunding locked tokens.
func (k Keeper) CancelOrder(ctx sdk.Context, maker sdk.AccAddress, orderID string) error {
	order, err := k.getOrder(ctx, orderID)
	if err != nil {
		return err
	}
	if order.Maker != maker.String() {
		return fmt.Errorf("only maker can cancel")
	}
	if order.Status != "open" {
		return fmt.Errorf("order is %s", order.Status)
	}

	// Refund locked tokens
	refund := sdk.NewCoins(sdk.NewCoin(order.SellDenom, sdkmath.NewInt(order.SellAmount)))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, maker, refund); err != nil {
		return err
	}

	order.Status = "cancelled"
	k.setOrder(ctx, order)
	return nil
}

// ─── Storage ───

func (k Keeper) setPool(ctx sdk.Context, pool *types.LiquidityPool) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(pool)
	store.Set([]byte("pool/"+pool.ID), bz)
}

func (k Keeper) getPool(ctx sdk.Context, id string) (*types.LiquidityPool, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("pool/" + id))
	if bz == nil {
		return nil, fmt.Errorf("pool %s not found", id)
	}
	var pool types.LiquidityPool
	if err := json.Unmarshal(bz, &pool); err != nil {
		return nil, err
	}
	return &pool, nil
}

func (k Keeper) setOrder(ctx sdk.Context, order *types.LimitOrder) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(order)
	store.Set([]byte("order/"+order.ID), bz)
}

func (k Keeper) getOrder(ctx sdk.Context, id string) (*types.LimitOrder, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("order/" + id))
	if bz == nil {
		return nil, fmt.Errorf("order %s not found", id)
	}
	var order types.LimitOrder
	if err := json.Unmarshal(bz, &order); err != nil {
		return nil, err
	}
	return &order, nil
}

// GetOpenOrders returns open orders for a trading pair.
func (k Keeper) GetOpenOrders(ctx sdk.Context, sellDenom, buyDenom string) []types.LimitOrder {
	store := ctx.KVStore(k.storeKey)
	iter := store.Iterator([]byte("order/"), storetypes.PrefixEndBytes([]byte("order/")))
	defer iter.Close()

	var orders []types.LimitOrder
	for ; iter.Valid(); iter.Next() {
		var order types.LimitOrder
		if err := json.Unmarshal(iter.Value(), &order); err != nil {
			continue
		}
		if order.Status == "open" && order.SellDenom == sellDenom && order.BuyDenom == buyDenom {
			orders = append(orders, order)
		}
	}
	return orders
}
