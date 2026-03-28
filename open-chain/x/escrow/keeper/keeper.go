// Package keeper implements the Escrow module — on-chain escrow with dispute resolution.

package keeper

import (
	"encoding/json"
	"fmt"
	"sync/atomic"

	sdkmath "cosmossdk.io/math"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/escrow/types"
)

// escrowSeq is a per-process atomic counter for generating unique escrow IDs.
var escrowSeq atomic.Int64

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// ─── Escrow Operations ───

// CreateEscrow creates a new escrow contract. The seller specifies the buyer, amount, and expiry.
func (k Keeper) CreateEscrow(ctx sdk.Context, seller sdk.AccAddress, buyer string, amount int64, denom, description, arbiter string, expiresIn int64) (*types.EscrowContract, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("escrow amount must be positive")
	}
	if seller.String() == buyer {
		return nil, fmt.Errorf("seller and buyer cannot be the same address")
	}

	escrowID := fmt.Sprintf("escrow-%d-%d", ctx.BlockHeight(), escrowSeq.Add(1))

	escrow := &types.EscrowContract{
		ID:          escrowID,
		Seller:      seller.String(),
		Buyer:       buyer,
		Amount:      amount,
		Denom:       denom,
		Description: description,
		Status:      "created",
		Arbiter:     arbiter,
		CreatedAt:   ctx.BlockHeight(),
		ExpiresAt:   ctx.BlockHeight() + expiresIn,
	}

	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_created",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("seller", seller.String()),
		sdk.NewAttribute("buyer", buyer),
		sdk.NewAttribute("amount", fmt.Sprintf("%d%s", amount, denom)),
	))

	return escrow, nil
}

// FundEscrow deposits funds from the buyer into the module account.
func (k Keeper) FundEscrow(ctx sdk.Context, buyer sdk.AccAddress, escrowID string) error {
	escrow, err := k.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}
	if escrow.Status != "created" {
		return fmt.Errorf("escrow %s is %s, expected created", escrowID, escrow.Status)
	}
	if buyer.String() != escrow.Buyer {
		return fmt.Errorf("only the designated buyer can fund this escrow")
	}
	if ctx.BlockHeight() > escrow.ExpiresAt {
		return fmt.Errorf("escrow %s has expired", escrowID)
	}

	// Transfer funds from buyer to module account
	coins := sdk.NewCoins(sdk.NewCoin(escrow.Denom, sdkmath.NewInt(escrow.Amount)))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, buyer, types.ModuleName, coins); err != nil {
		return fmt.Errorf("failed to fund escrow: %w", err)
	}

	escrow.Status = "funded"
	escrow.FundedAt = ctx.BlockHeight()
	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_funded",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("buyer", buyer.String()),
	))

	return nil
}

// ReleaseEscrow releases funds to the seller. Only the buyer can confirm receipt.
func (k Keeper) ReleaseEscrow(ctx sdk.Context, buyer sdk.AccAddress, escrowID string) error {
	escrow, err := k.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}
	if escrow.Status != "funded" {
		return fmt.Errorf("escrow %s is %s, expected funded", escrowID, escrow.Status)
	}
	if buyer.String() != escrow.Buyer {
		return fmt.Errorf("only the buyer can release funds")
	}

	// Transfer funds from module to seller
	seller, err := sdk.AccAddressFromBech32(escrow.Seller)
	if err != nil {
		return fmt.Errorf("invalid seller address: %w", err)
	}
	coins := sdk.NewCoins(sdk.NewCoin(escrow.Denom, sdkmath.NewInt(escrow.Amount)))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, seller, coins); err != nil {
		return fmt.Errorf("failed to release escrow: %w", err)
	}

	escrow.Status = "released"
	escrow.ReleasedAt = ctx.BlockHeight()
	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_released",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("seller", escrow.Seller),
	))

	return nil
}

// DisputeEscrow raises a dispute on a funded escrow. Either party can raise.
func (k Keeper) DisputeEscrow(ctx sdk.Context, sender sdk.AccAddress, escrowID string) error {
	escrow, err := k.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}
	if escrow.Status != "funded" {
		return fmt.Errorf("escrow %s is %s, can only dispute funded escrows", escrowID, escrow.Status)
	}
	addr := sender.String()
	if addr != escrow.Buyer && addr != escrow.Seller {
		return fmt.Errorf("only buyer or seller can raise a dispute")
	}
	if escrow.Arbiter == "" {
		return fmt.Errorf("no arbiter assigned — cannot dispute")
	}

	escrow.Status = "disputed"
	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_disputed",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("raised_by", addr),
		sdk.NewAttribute("arbiter", escrow.Arbiter),
	))

	return nil
}

// ResolveDispute allows the arbiter to resolve a dispute.
// releaseToSeller == true → funds go to seller; false → refund to buyer.
func (k Keeper) ResolveDispute(ctx sdk.Context, arbiter sdk.AccAddress, escrowID string, releaseToSeller bool) error {
	escrow, err := k.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}
	if escrow.Status != "disputed" {
		return fmt.Errorf("escrow %s is %s, expected disputed", escrowID, escrow.Status)
	}
	if arbiter.String() != escrow.Arbiter {
		return fmt.Errorf("only the assigned arbiter can resolve this dispute")
	}

	coins := sdk.NewCoins(sdk.NewCoin(escrow.Denom, sdkmath.NewInt(escrow.Amount)))

	if releaseToSeller {
		seller, err := sdk.AccAddressFromBech32(escrow.Seller)
		if err != nil {
			return fmt.Errorf("invalid seller address: %w", err)
		}
		if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, seller, coins); err != nil {
			return err
		}
		escrow.Status = "released"
		escrow.ReleasedAt = ctx.BlockHeight()
	} else {
		buyerAddr, err := sdk.AccAddressFromBech32(escrow.Buyer)
		if err != nil {
			return fmt.Errorf("invalid buyer address: %w", err)
		}
		if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, buyerAddr, coins); err != nil {
			return err
		}
		escrow.Status = "refunded"
	}

	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_dispute_resolved",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("arbiter", arbiter.String()),
		sdk.NewAttribute("outcome", map[bool]string{true: "released_to_seller", false: "refunded_to_buyer"}[releaseToSeller]),
	))

	return nil
}

// RefundEscrow refunds the buyer if the escrow has expired without being completed.
func (k Keeper) RefundEscrow(ctx sdk.Context, escrowID string) error {
	escrow, err := k.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}
	if escrow.Status != "funded" {
		return fmt.Errorf("escrow %s is %s, can only refund funded escrows", escrowID, escrow.Status)
	}
	if ctx.BlockHeight() <= escrow.ExpiresAt {
		return fmt.Errorf("escrow %s has not yet expired", escrowID)
	}

	buyerAddr, err := sdk.AccAddressFromBech32(escrow.Buyer)
	if err != nil {
		return fmt.Errorf("invalid buyer address: %w", err)
	}

	coins := sdk.NewCoins(sdk.NewCoin(escrow.Denom, sdkmath.NewInt(escrow.Amount)))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, buyerAddr, coins); err != nil {
		return err
	}

	escrow.Status = "expired"
	k.setEscrow(ctx, escrow)

	ctx.EventManager().EmitEvent(sdk.NewEvent("escrow_expired_refund",
		sdk.NewAttribute("escrow_id", escrowID),
		sdk.NewAttribute("buyer", escrow.Buyer),
	))

	return nil
}

// ─── Queries ───

// GetEscrow returns a single escrow by ID.
func (k Keeper) GetEscrow(ctx sdk.Context, id string) (*types.EscrowContract, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("escrow/" + id))
	if bz == nil {
		return nil, fmt.Errorf("escrow %s not found", id)
	}
	var escrow types.EscrowContract
	if err := json.Unmarshal(bz, &escrow); err != nil {
		return nil, err
	}
	return &escrow, nil
}

// GetEscrowsByUser returns all escrows where the given address is buyer or seller.
func (k Keeper) GetEscrowsByUser(ctx sdk.Context, addr string) []types.EscrowContract {
	store := ctx.KVStore(k.storeKey)
	iter := store.Iterator([]byte("escrow/"), storetypes.PrefixEndBytes([]byte("escrow/")))
	defer iter.Close()

	var result []types.EscrowContract
	for ; iter.Valid(); iter.Next() {
		var escrow types.EscrowContract
		if err := json.Unmarshal(iter.Value(), &escrow); err != nil {
			continue
		}
		if escrow.Buyer == addr || escrow.Seller == addr {
			result = append(result, escrow)
		}
	}
	return result
}

// GetDisputesByArbiter returns all disputed escrows assigned to the given arbiter.
func (k Keeper) GetDisputesByArbiter(ctx sdk.Context, arbiter string) []types.EscrowContract {
	store := ctx.KVStore(k.storeKey)
	iter := store.Iterator([]byte("escrow/"), storetypes.PrefixEndBytes([]byte("escrow/")))
	defer iter.Close()

	var result []types.EscrowContract
	for ; iter.Valid(); iter.Next() {
		var escrow types.EscrowContract
		if err := json.Unmarshal(iter.Value(), &escrow); err != nil {
			continue
		}
		if escrow.Status == "disputed" && escrow.Arbiter == arbiter {
			result = append(result, escrow)
		}
	}
	return result
}

// ─── Storage ───

func (k Keeper) setEscrow(ctx sdk.Context, escrow *types.EscrowContract) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(escrow)
	store.Set([]byte("escrow/"+escrow.ID), bz)
}
