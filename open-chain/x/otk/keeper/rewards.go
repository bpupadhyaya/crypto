// Package keeper — Staking Rewards Distributor.
//
// Distributes OTK staking rewards in channel-specific denoms based on
// each validator's contribution score and gratitude received.
//
// Reward formula:
//   - Base APY: 5% annually, distributed per block
//   - Channel bonus: validators with verified milestones get extra rewards
//     in the milestone's channel denom
//   - Gratitude bonus: validators who received gratitude get 1% extra

package keeper

import (
	"encoding/json"
	"fmt"
	"math"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/otk/types"
)

const (
	// BaseAPY is 5% annually.
	BaseAPY = 0.05

	// GratitudeBonusRate is 1% extra for validators who received gratitude.
	GratitudeBonusRate = 0.01

	// BlocksPerYear assumes 6-second block times.
	BlocksPerYear int64 = 5_256_000 // 365.25 * 24 * 60 * 60 / 6

	// RewardDistributionInterval is how often rewards are distributed (every 100 blocks).
	RewardDistributionInterval int64 = 100

	// ChannelBonusPerMilestone is the extra reward rate per verified milestone (0.1%).
	ChannelBonusPerMilestone = 0.001

	// MaxChannelBonus caps channel bonus at 5%.
	MaxChannelBonus = 0.05
)

// StakerRewardInfo stores pending reward state for a staker.
type StakerRewardInfo struct {
	Address        string   `json:"address"`
	PendingRewards []Reward `json:"pending_rewards"`
	TotalEarned    []Reward `json:"total_earned"`
	LastClaimBlock int64    `json:"last_claim_block"`
}

// Reward represents a reward amount in a specific denom.
type Reward struct {
	Denom  string `json:"denom"`
	Amount int64  `json:"amount"`
}

// DistributeStakingRewards calculates and distributes OTK staking rewards.
// Called from EndBlock every RewardDistributionInterval blocks.
//
// Reward formula:
//   - Base APY: 5% annually, distributed per block
//   - Channel bonus: validators with verified milestones get extra rewards
//     in the milestone's channel denom
//   - Gratitude bonus: validators who received gratitude get 1% extra
func (k Keeper) DistributeStakingRewards(ctx sdk.Context) error {
	// Only distribute every N blocks
	if ctx.BlockHeight()%RewardDistributionInterval != 0 {
		return nil
	}

	// Iterate all stakers (addresses with uotk staking records)
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("staker/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var distributedTotal int64

	for ; iterator.Valid(); iterator.Next() {
		var info StakerRewardInfo
		if err := json.Unmarshal(iterator.Value(), &info); err != nil {
			continue
		}

		addr, err := sdk.AccAddressFromBech32(info.Address)
		if err != nil {
			continue
		}

		// Get staked balance (uotk held in staking)
		stakedBalance := k.bank.GetBalance(ctx, addr, types.BaseDenom)
		if stakedBalance.IsZero() {
			continue
		}

		// Calculate reward rates
		baseRate, bonusRate := k.GetValidatorRewardRate(ctx, info.Address)
		totalRate := baseRate + bonusRate

		// Per-interval reward = stakedAmount * totalRate * (interval / blocks_per_year)
		intervalFraction := float64(RewardDistributionInterval) / float64(BlocksPerYear)
		rewardAmount := int64(math.Floor(float64(stakedBalance.Amount.Int64()) * totalRate * intervalFraction))

		if rewardAmount <= 0 {
			continue
		}

		// Determine reward denoms based on validator's contribution channels
		rewards := k.calculateChannelRewards(ctx, info.Address, rewardAmount, bonusRate, totalRate)

		// Mint and send rewards
		for _, reward := range rewards {
			if reward.Amount <= 0 {
				continue
			}

			coins := sdk.NewCoins(sdk.NewInt64Coin(reward.Denom, reward.Amount))
			if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
				ctx.EventManager().EmitEvent(sdk.NewEvent(
					"reward_mint_failed",
					sdk.NewAttribute("address", info.Address),
					sdk.NewAttribute("error", err.Error()),
				))
				continue
			}
			if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, addr, coins); err != nil {
				continue
			}
		}

		// Update pending rewards
		info.PendingRewards = addRewards(info.PendingRewards, rewards)
		info.TotalEarned = addRewards(info.TotalEarned, rewards)

		if err := k.setStakerRewardInfo(ctx, &info); err != nil {
			continue
		}

		distributedTotal += rewardAmount
	}

	if distributedTotal > 0 {
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"staking_rewards_distributed",
			sdk.NewAttribute("block_height", fmt.Sprintf("%d", ctx.BlockHeight())),
			sdk.NewAttribute("total_distributed", fmt.Sprintf("%d", distributedTotal)),
		))
	}

	return nil
}

// GetValidatorRewardRate returns the reward rate for a validator
// based on their contribution score and gratitude received.
//
// Returns:
//   - baseRate: the base APY (5% for all validators)
//   - bonusRate: additional rate from channel milestones and gratitude
func (k Keeper) GetValidatorRewardRate(ctx sdk.Context, validatorAddr string) (baseRate, bonusRate float64) {
	baseRate = BaseAPY

	// Look up the validator's Living Ledger for contribution data
	ledger, err := k.GetLivingLedger(ctx, validatorAddr)
	if err != nil {
		return baseRate, 0
	}

	// Channel bonus: 0.1% per verified milestone, capped at 5%
	milestoneBonus := float64(ledger.MilestonesAchieved) * ChannelBonusPerMilestone
	if milestoneBonus > MaxChannelBonus {
		milestoneBonus = MaxChannelBonus
	}

	// Gratitude bonus: 1% if they've received any gratitude
	gratitudeBonus := 0.0
	if ledger.GratitudeReceived > 0 {
		gratitudeBonus = GratitudeBonusRate
	}

	bonusRate = milestoneBonus + gratitudeBonus
	return baseRate, bonusRate
}

// GetPendingRewards returns unclaimed rewards for an address.
func (k Keeper) GetPendingRewards(ctx sdk.Context, addr sdk.AccAddress) sdk.Coins {
	info, err := k.getStakerRewardInfo(ctx, addr.String())
	if err != nil || info == nil {
		return sdk.NewCoins()
	}

	coins := sdk.NewCoins()
	for _, r := range info.PendingRewards {
		if r.Amount > 0 {
			coins = coins.Add(sdk.NewInt64Coin(r.Denom, r.Amount))
		}
	}
	return coins
}

// calculateChannelRewards splits a reward amount across base and channel-specific denoms.
func (k Keeper) calculateChannelRewards(ctx sdk.Context, validatorAddr string, totalReward int64, bonusRate, totalRate float64) []Reward {
	var rewards []Reward

	if totalRate <= 0 {
		return rewards
	}

	// Base reward always in uotk
	basePortion := int64(math.Floor(float64(totalReward) * BaseAPY / totalRate))
	if basePortion > 0 {
		rewards = append(rewards, Reward{Denom: types.BaseDenom, Amount: basePortion})
	}

	// Bonus rewards in channel-specific denoms
	if bonusRate <= 0 {
		return rewards
	}

	bonusPortion := totalReward - basePortion

	// Get the validator's ledger to determine which channels they contributed to
	ledger, err := k.GetLivingLedger(ctx, validatorAddr)
	if err != nil || ledger == nil {
		// If no ledger, put bonus in base denom
		if bonusPortion > 0 {
			rewards = append(rewards, Reward{Denom: types.BaseDenom, Amount: bonusPortion})
		}
		return rewards
	}

	// Distribute bonus across channels proportional to channel activity
	totalChannelActivity := int64(0)
	channelActivity := make(map[string]int64)
	for ch, cl := range ledger.Channels {
		activity := cl.Minted + cl.Received
		if activity > 0 {
			channelActivity[ch] = activity
			totalChannelActivity += activity
		}
	}

	if totalChannelActivity == 0 || len(channelActivity) == 0 {
		// No channel activity — put bonus in base denom
		if bonusPortion > 0 {
			rewards = append(rewards, Reward{Denom: types.BaseDenom, Amount: bonusPortion})
		}
		return rewards
	}

	var distributed int64
	channelList := types.AllChannels()
	for i, ch := range channelList {
		activity, ok := channelActivity[ch]
		if !ok || activity <= 0 {
			continue
		}
		denom := types.ChannelDenom(ch)
		if denom == "" {
			continue
		}

		var channelReward int64
		if i == len(channelList)-1 {
			// Last channel gets remainder to avoid rounding errors
			channelReward = bonusPortion - distributed
		} else {
			channelReward = int64(math.Floor(float64(bonusPortion) * float64(activity) / float64(totalChannelActivity)))
		}

		if channelReward > 0 {
			rewards = append(rewards, Reward{Denom: denom, Amount: channelReward})
			distributed += channelReward
		}
	}

	// If there's any undistributed remainder, add to base denom
	remainder := bonusPortion - distributed
	if remainder > 0 {
		rewards = append(rewards, Reward{Denom: types.BaseDenom, Amount: remainder})
	}

	return rewards
}

// addRewards merges new rewards into an existing reward slice.
func addRewards(existing, added []Reward) []Reward {
	denomMap := make(map[string]int64)
	for _, r := range existing {
		denomMap[r.Denom] += r.Amount
	}
	for _, r := range added {
		denomMap[r.Denom] += r.Amount
	}
	var result []Reward
	for denom, amount := range denomMap {
		result = append(result, Reward{Denom: denom, Amount: amount})
	}
	return result
}

// RegisterStaker registers an address as a staker for reward tracking.
func (k Keeper) RegisterStaker(ctx sdk.Context, addr string) error {
	existing, _ := k.getStakerRewardInfo(ctx, addr)
	if existing != nil {
		return nil // already registered
	}

	info := &StakerRewardInfo{
		Address:        addr,
		PendingRewards: []Reward{},
		TotalEarned:    []Reward{},
		LastClaimBlock: ctx.BlockHeight(),
	}
	return k.setStakerRewardInfo(ctx, info)
}

// ClaimRewards claims pending rewards for an address, resetting the pending balance.
func (k Keeper) ClaimRewards(ctx sdk.Context, addr sdk.AccAddress) (sdk.Coins, error) {
	info, err := k.getStakerRewardInfo(ctx, addr.String())
	if err != nil || info == nil {
		return sdk.NewCoins(), fmt.Errorf("no staker record found for %s", addr)
	}

	claimed := sdk.NewCoins()
	for _, r := range info.PendingRewards {
		if r.Amount > 0 {
			claimed = claimed.Add(sdk.NewInt64Coin(r.Denom, r.Amount))
		}
	}

	// Reset pending rewards
	info.PendingRewards = []Reward{}
	info.LastClaimBlock = ctx.BlockHeight()

	if err := k.setStakerRewardInfo(ctx, info); err != nil {
		return sdk.NewCoins(), err
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"rewards_claimed",
		sdk.NewAttribute("address", addr.String()),
		sdk.NewAttribute("amount", claimed.String()),
		sdk.NewAttribute("block_height", fmt.Sprintf("%d", ctx.BlockHeight())),
	))

	return claimed, nil
}

// ─── KV Store Helpers ───

func stakerKey(addr string) []byte {
	return []byte(fmt.Sprintf("staker/%s", addr))
}

func (k Keeper) getStakerRewardInfo(ctx sdk.Context, addr string) (*StakerRewardInfo, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(stakerKey(addr))
	if bz == nil {
		return nil, fmt.Errorf("staker %s not found", addr)
	}
	var info StakerRewardInfo
	if err := json.Unmarshal(bz, &info); err != nil {
		return nil, err
	}
	return &info, nil
}

func (k Keeper) setStakerRewardInfo(ctx sdk.Context, info *StakerRewardInfo) error {
	store := ctx.KVStore(k.storeKey)
	bz, err := json.Marshal(info)
	if err != nil {
		return err
	}
	store.Set(stakerKey(info.Address), bz)
	return nil
}
