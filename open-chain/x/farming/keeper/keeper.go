package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/farming/types"
)

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// Stake deposits LP tokens into a farm.
func (k Keeper) Stake(ctx sdk.Context, farmer sdk.AccAddress, farmID string, amount int64) error {
	farm, err := k.GetFarm(ctx, farmID)
	if err != nil {
		return err
	}
	if !farm.Enabled {
		return fmt.Errorf("farm %s is not active", farmID)
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(farm.LPDenom, amount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, farmer, types.ModuleName, coins); err != nil {
		return err
	}

	pos := k.GetStakedPosition(ctx, farmer.String(), farmID)
	pos.Farmer = farmer.String()
	pos.FarmID = farmID
	pos.Amount += amount
	pos.StakedAt = ctx.BlockHeight()
	k.setStakedPosition(ctx, &pos)

	farm.TotalStaked += amount
	k.setFarm(ctx, farm)

	ctx.EventManager().EmitEvent(sdk.NewEvent("farm_stake",
		sdk.NewAttribute("farmer", farmer.String()),
		sdk.NewAttribute("farm_id", farmID),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
	))
	return nil
}

// Unstake withdraws LP tokens from a farm.
func (k Keeper) Unstake(ctx sdk.Context, farmer sdk.AccAddress, farmID string, amount int64) error {
	pos := k.GetStakedPosition(ctx, farmer.String(), farmID)
	if pos.Amount < amount {
		return fmt.Errorf("insufficient staked amount")
	}

	farm, _ := k.GetFarm(ctx, farmID)
	if farm == nil {
		return fmt.Errorf("farm not found")
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(farm.LPDenom, amount))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, farmer, coins); err != nil {
		return err
	}

	pos.Amount -= amount
	k.setStakedPosition(ctx, &pos)
	farm.TotalStaked -= amount
	k.setFarm(ctx, farm)
	return nil
}

// ClaimRewards mints and sends pending rewards to farmer.
func (k Keeper) ClaimRewards(ctx sdk.Context, farmer sdk.AccAddress, farmID string) (int64, error) {
	pos := k.GetStakedPosition(ctx, farmer.String(), farmID)
	if pos.Amount == 0 {
		return 0, fmt.Errorf("no staked position")
	}

	farm, _ := k.GetFarm(ctx, farmID)
	if farm == nil {
		return 0, fmt.Errorf("farm not found")
	}

	// Simple reward calculation: proportional share * blocks since stake * reward per block
	blocksSinceStake := ctx.BlockHeight() - pos.StakedAt
	if blocksSinceStake <= 0 || farm.TotalStaked == 0 {
		return 0, nil
	}

	shareRatio := float64(pos.Amount) / float64(farm.TotalStaked)
	rewards := int64(shareRatio * float64(farm.RewardPerBlock) * float64(blocksSinceStake))
	rewards -= pos.RewardDebt

	if rewards <= 0 {
		return 0, nil
	}

	rewardCoins := sdk.NewCoins(sdk.NewInt64Coin(farm.RewardDenom, rewards))
	if err := k.bank.MintCoins(ctx, types.ModuleName, rewardCoins); err != nil {
		return 0, err
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, farmer, rewardCoins); err != nil {
		return 0, err
	}

	pos.RewardDebt += rewards
	pos.StakedAt = ctx.BlockHeight()
	k.setStakedPosition(ctx, &pos)
	return rewards, nil
}

func (k Keeper) GetFarm(ctx sdk.Context, farmID string) (*types.Farm, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("farm/" + farmID))
	if bz == nil {
		for _, f := range types.DefaultGenesisState().Farms {
			if f.ID == farmID {
				return &f, nil
			}
		}
		return nil, fmt.Errorf("farm %s not found", farmID)
	}
	var f types.Farm
	_ = json.Unmarshal(bz, &f)
	return &f, nil
}

func (k Keeper) GetAllFarms(ctx sdk.Context) []types.Farm {
	defaults := types.DefaultGenesisState().Farms
	farms := make([]types.Farm, 0, len(defaults))
	for _, d := range defaults {
		f, err := k.GetFarm(ctx, d.ID)
		if err == nil {
			farms = append(farms, *f)
		} else {
			farms = append(farms, d)
		}
	}
	return farms
}

func (k Keeper) GetStakedPosition(ctx sdk.Context, farmer, farmID string) types.StakedPosition {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(fmt.Sprintf("stake/%s/%s", farmer, farmID)))
	if bz == nil {
		return types.StakedPosition{Farmer: farmer, FarmID: farmID}
	}
	var pos types.StakedPosition
	_ = json.Unmarshal(bz, &pos)
	return pos
}

func (k Keeper) setStakedPosition(ctx sdk.Context, pos *types.StakedPosition) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(pos)
	store.Set([]byte(fmt.Sprintf("stake/%s/%s", pos.Farmer, pos.FarmID)), bz)
}

func (k Keeper) setFarm(ctx sdk.Context, f *types.Farm) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(f)
	store.Set([]byte("farm/"+f.ID), bz)
}
