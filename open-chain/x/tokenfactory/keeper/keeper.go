// Package keeper implements the Token Factory module's state management.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/tokenfactory/types"
)

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// CreateToken creates a new custom token on Open Chain.
func (k Keeper) CreateToken(ctx sdk.Context, meta types.TokenMetadata) error {
	// Validate
	if meta.Symbol == "" || meta.Creator == "" || meta.InitialSupply <= 0 {
		return fmt.Errorf("invalid token metadata: symbol, creator, and initial supply required")
	}

	// Generate denom
	meta.Denom = types.MakeDenom(meta.Creator, meta.Symbol)
	meta.CreatedAt = ctx.BlockHeight()

	// Check if denom already exists
	existing, _ := k.GetToken(ctx, meta.Denom)
	if existing != nil {
		return fmt.Errorf("token %s already exists", meta.Denom)
	}

	// Mint initial supply to creator
	creatorAddr, err := sdk.AccAddressFromBech32(meta.Creator)
	if err != nil {
		return fmt.Errorf("invalid creator address: %w", err)
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(meta.Denom, meta.InitialSupply))
	if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return fmt.Errorf("failed to mint initial supply: %w", err)
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, creatorAddr, coins); err != nil {
		return fmt.Errorf("failed to send to creator: %w", err)
	}

	// Store metadata
	if err := k.setToken(ctx, &meta); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"token_created",
		sdk.NewAttribute("denom", meta.Denom),
		sdk.NewAttribute("symbol", meta.Symbol),
		sdk.NewAttribute("creator", meta.Creator),
		sdk.NewAttribute("initial_supply", fmt.Sprintf("%d", meta.InitialSupply)),
	))

	return nil
}

// GetToken retrieves token metadata by denom.
func (k Keeper) GetToken(ctx sdk.Context, denom string) (*types.TokenMetadata, error) {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("token/%s", denom))
	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("token %s not found", denom)
	}
	var meta types.TokenMetadata
	if err := json.Unmarshal(bz, &meta); err != nil {
		return nil, err
	}
	return &meta, nil
}

// GetTokensByCreator returns all tokens created by an address.
func (k Keeper) GetTokensByCreator(ctx sdk.Context, creator string) ([]types.TokenMetadata, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("token/factory/" + creator + "/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var tokens []types.TokenMetadata
	for ; iterator.Valid(); iterator.Next() {
		var meta types.TokenMetadata
		if err := json.Unmarshal(iterator.Value(), &meta); err != nil {
			continue
		}
		tokens = append(tokens, meta)
	}
	return tokens, nil
}

// GetAllTokens returns all factory-created tokens.
func (k Keeper) GetAllTokens(ctx sdk.Context) ([]types.TokenMetadata, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("token/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var tokens []types.TokenMetadata
	for ; iterator.Valid(); iterator.Next() {
		var meta types.TokenMetadata
		if err := json.Unmarshal(iterator.Value(), &meta); err != nil {
			continue
		}
		tokens = append(tokens, meta)
	}
	return tokens, nil
}

// MintAdditional mints more supply of an existing factory token.
// Only the original creator can mint more.
func (k Keeper) MintAdditional(ctx sdk.Context, creator, denom string, amount int64) error {
	token, err := k.GetToken(ctx, denom)
	if err != nil {
		return err
	}
	if token.Creator != creator {
		return fmt.Errorf("only the creator can mint additional supply")
	}

	creatorAddr, err := sdk.AccAddressFromBech32(creator)
	if err != nil {
		return err
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return err
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, creatorAddr, coins); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"token_minted",
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("creator", creator),
	))
	return nil
}

// BurnTokens burns supply of a factory token from the creator's account.
func (k Keeper) BurnTokens(ctx sdk.Context, creator, denom string, amount int64) error {
	token, err := k.GetToken(ctx, denom)
	if err != nil {
		return err
	}
	if token.Creator != creator {
		return fmt.Errorf("only the creator can burn tokens")
	}

	creatorAddr, err := sdk.AccAddressFromBech32(creator)
	if err != nil {
		return err
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, creatorAddr, types.ModuleName, coins); err != nil {
		return fmt.Errorf("insufficient balance to burn: %w", err)
	}
	if err := k.bank.BurnCoins(ctx, types.ModuleName, coins); err != nil {
		return err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"token_burned",
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("creator", creator),
	))
	return nil
}

func (k Keeper) setToken(ctx sdk.Context, meta *types.TokenMetadata) error {
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("token/%s", meta.Denom))
	bz, err := json.Marshal(meta)
	if err != nil {
		return err
	}
	store.Set(key, bz)
	return nil
}
