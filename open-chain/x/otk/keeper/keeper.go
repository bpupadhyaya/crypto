// Package keeper implements the OTK module's state management.
//
// The keeper handles:
// - Multi-channel OTK minting (when milestones are verified)
// - Value transfers between Universal IDs
// - Ripple attribution across contribution rings
// - Gratitude transactions
// - Negative value (correction mechanism)

package keeper

import (
	"fmt"

	"cosmossdk.io/math"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/otk/types"
)

// AchievementMinter is the interface for minting achievements (avoids circular import).
type AchievementMinter interface {
	MintAchievementFromData(ctx sdk.Context, data interface{}) error
}

// Keeper manages the OTK module state.
type Keeper struct {
	cdc          codec.Codec
	storeKey     storetypes.StoreKey
	bank         bankkeeper.Keeper
	achievements AchievementMinter // optional — set after init to avoid circular deps
}

// SetAchievementMinter sets the achievement keeper after initialization.
func (k *Keeper) SetAchievementMinter(m AchievementMinter) {
	k.achievements = m
}

// NewKeeper creates a new OTK keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
		bank:     bank,
	}
}

// InitTreasury initializes the OTK module treasury at genesis.
// Sets the default contribution rate and ensures the module account is ready for minting.
func (k Keeper) InitTreasury(ctx sdk.Context) {
	store := ctx.KVStore(k.storeKey)
	// Default contribution rate: 5% of minted OTK goes to the treasury
	store.Set([]byte("treasury/contribution_rate_bps"), []byte("500"))
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"otk_treasury_initialized",
		sdk.NewAttribute("contribution_rate_bps", "500"),
	))
}

// MintForMilestone mints OTK when a human development milestone is verified.
// OTK is distributed across contribution rings using the ripple attribution formula.
//
// Multi-channel minting:
//  1. Mint channel-specific denom (e.g., unotk for nurture channel)
//  2. Also mint equivalent uotk (aggregate denom)
//  3. Update the Living Ledger with channel breakdown
//
// Example: Child reads at grade level (education channel, 200 OTK base)
//   - Ring 2 (parents): 200/4 = 50 ueotk + 50 uotk
//   - Ring 3 (teachers): 200/9 = 22 ueotk + 22 uotk
//   - Ring 4 (community): 200/16 = 12 ueotk + 12 uotk
//   - Ring 5 (city): 200/25 = 8 ueotk + 8 uotk
//   - Ring 6 (country): 200/36 = 5 ueotk + 5 uotk
//   - Ring 7 (humanity): 200/49 = 4 ueotk + 4 uotk
func (k Keeper) MintForMilestone(ctx sdk.Context, milestone types.Milestone, ringRecipients map[types.ContributionRing][]sdk.AccAddress) error {
	if !milestone.Verified {
		return fmt.Errorf("milestone %s not yet verified", milestone.ID)
	}

	// Resolve channel name to on-chain denom
	channelDenom := types.ChannelDenom(milestone.Channel)
	if channelDenom == "" {
		return fmt.Errorf("unknown channel %q: no denom mapping found", milestone.Channel)
	}

	var totalMinted math.Int = math.ZeroInt()

	for ring, recipients := range ringRecipients {
		attribution := types.RippleAttribution(milestone.MintAmount, ring)
		if attribution.IsZero() {
			continue
		}

		// Split attribution equally among recipients in this ring
		perRecipient := attribution.Quo(math.NewInt(int64(len(recipients))))
		if perRecipient.IsZero() {
			continue
		}

		// Mint both channel-specific denom AND aggregate uotk
		channelCoin := sdk.NewCoin(channelDenom, perRecipient)
		aggregateCoin := sdk.NewCoin(types.BaseDenom, perRecipient)
		coins := sdk.NewCoins(channelCoin, aggregateCoin)

		for _, addr := range recipients {
			if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
				return fmt.Errorf("failed to mint %s+%s for ring %d: %w", channelDenom, types.BaseDenom, ring, err)
			}
			if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, addr, coins); err != nil {
				return fmt.Errorf("failed to send %s+%s to %s: %w", channelDenom, types.BaseDenom, addr, err)
			}
			totalMinted = totalMinted.Add(perRecipient)
		}
	}

	// Update the Living Ledger with channel breakdown
	if err := k.RecordMilestoneMint(ctx, milestone.UID, milestone.Channel, totalMinted.Int64()); err != nil {
		return fmt.Errorf("failed to update living ledger: %w", err)
	}

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"milestone_minted",
		sdk.NewAttribute("milestone_id", milestone.ID),
		sdk.NewAttribute("uid", milestone.UID),
		sdk.NewAttribute("channel", milestone.Channel),
		sdk.NewAttribute("channel_denom", channelDenom),
		sdk.NewAttribute("aggregate_denom", types.BaseDenom),
		sdk.NewAttribute("base_amount", milestone.MintAmount.String()),
		sdk.NewAttribute("total_minted", totalMinted.String()),
	))

	return nil
}

// TransferValue records a value transfer between Universal IDs.
// This is the core operation — representing any human contribution.
func (k Keeper) TransferValue(ctx sdk.Context, transfer types.ValueTransfer) error {
	// Resolve channel name to denom
	channelDenom := types.ChannelDenom(transfer.Channel)
	if channelDenom == "" {
		return fmt.Errorf("unknown channel %q: no denom mapping found", transfer.Channel)
	}

	// Transfer both channel-specific and aggregate denoms
	channelCoin := sdk.NewCoin(channelDenom, transfer.Amount)
	aggregateCoin := sdk.NewCoin(types.BaseDenom, transfer.Amount)
	coins := sdk.NewCoins(channelCoin, aggregateCoin)

	if transfer.Positive {
		// Mint and send to recipient
		if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
			return err
		}
		toAddr, err := sdk.AccAddressFromBech32(transfer.ToUID)
		if err != nil {
			return fmt.Errorf("invalid recipient UID: %w", err)
		}
		if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, toAddr, coins); err != nil {
			return err
		}
	} else {
		// Negative value — burn from source
		fromAddr, err := sdk.AccAddressFromBech32(transfer.FromUID)
		if err != nil {
			return fmt.Errorf("invalid source UID: %w", err)
		}
		if err := k.bank.SendCoinsFromAccountToModule(ctx, fromAddr, types.ModuleName, coins); err != nil {
			return err
		}
		if err := k.bank.BurnCoins(ctx, types.ModuleName, coins); err != nil {
			return err
		}
	}

	eventType := "value_transfer"
	if transfer.IsGratitude {
		eventType = "gratitude_transfer"
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		eventType,
		sdk.NewAttribute("from", transfer.FromUID),
		sdk.NewAttribute("to", transfer.ToUID),
		sdk.NewAttribute("channel", transfer.Channel),
		sdk.NewAttribute("amount", transfer.Amount.String()),
		sdk.NewAttribute("ring", fmt.Sprintf("%d", transfer.Ring)),
		sdk.NewAttribute("positive", fmt.Sprintf("%t", transfer.Positive)),
	))

	// Emit celebration event for gratitude transactions
	if transfer.IsGratitude {
		amount := transfer.Amount.Int64()
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"gratitude_celebration",
			sdk.NewAttribute("from_uid", transfer.FromUID),
			sdk.NewAttribute("to_uid", transfer.ToUID),
			sdk.NewAttribute("channel", transfer.Channel),
			sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
			sdk.NewAttribute("message", transfer.Memo),
			sdk.NewAttribute("celebration_type", getCelebrationType(amount)),
		))
	}

	return nil
}

// GetChannelBalance returns the balance for a specific value channel.
// Accepts either a channel name ("nurture") or denom ("unotk").
func (k Keeper) GetChannelBalance(ctx sdk.Context, addr sdk.AccAddress, channel string) math.Int {
	// If it's already a denom, use directly; otherwise resolve from channel name
	denom := channel
	if d := types.ChannelDenom(channel); d != "" {
		denom = d
	}
	coin := k.bank.GetBalance(ctx, addr, denom)
	return coin.Amount
}

// GetAggregateBalance returns the aggregate uotk balance for an address.
func (k Keeper) GetAggregateBalance(ctx sdk.Context, addr sdk.AccAddress) math.Int {
	coin := k.bank.GetBalance(ctx, addr, types.BaseDenom)
	return coin.Amount
}

// GetTotalValue returns the weighted composite OTK value for an address.
// This sums all channel-specific balances. The aggregate uotk balance
// should equal this sum (1 OTK = sum of all channels).
func (k Keeper) GetTotalValue(ctx sdk.Context, addr sdk.AccAddress) math.Int {
	total := math.ZeroInt()
	for _, denom := range types.AllDenoms() {
		coin := k.bank.GetBalance(ctx, addr, denom)
		total = total.Add(coin.Amount)
	}
	return total
}

// HandleGratitude processes a gratitude transaction end-to-end:
// validates UIDs, mints channel-specific OTK to recipient, records in
// the Living Ledger, emits a celebration event, and returns tx info.
func (k Keeper) HandleGratitude(ctx sdk.Context, fromUID, toUID, channel string, amount int64, message string) (string, error) {
	// Validate sender has an active UID (parseable as an address)
	fromAddr, err := sdk.AccAddressFromBech32(fromUID)
	if err != nil {
		return "", fmt.Errorf("sender does not have an active UID: %w", err)
	}

	// Validate recipient UID exists (parseable as an address)
	toAddr, err := sdk.AccAddressFromBech32(toUID)
	if err != nil {
		return "", fmt.Errorf("recipient UID does not exist: %w", err)
	}

	// Resolve channel to denom for multi-channel minting
	channelDenom := types.ChannelDenom(channel)
	if channelDenom == "" {
		return "", fmt.Errorf("unknown channel %q", channel)
	}

	mintAmount := math.NewInt(amount)

	// Mint channel-specific OTK and aggregate OTK to recipient
	channelCoin := sdk.NewCoin(channelDenom, mintAmount)
	aggregateCoin := sdk.NewCoin(types.BaseDenom, mintAmount)
	coins := sdk.NewCoins(channelCoin, aggregateCoin)

	if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return "", fmt.Errorf("failed to mint gratitude OTK: %w", err)
	}
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, toAddr, coins); err != nil {
		return "", fmt.Errorf("failed to send gratitude OTK: %w", err)
	}

	// Record in Living Ledger as gratitude
	if err := k.RecordValueTransfer(ctx, fromUID, toUID, channel, amount, types.RingFamily, true); err != nil {
		return "", fmt.Errorf("failed to record gratitude in ledger: %w", err)
	}

	// Update score index for both parties
	k.UpdateScoreIndex(ctx, fromUID)
	k.UpdateScoreIndex(ctx, toUID)

	// Emit celebration event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"gratitude_celebration",
		sdk.NewAttribute("from_uid", fromUID),
		sdk.NewAttribute("to_uid", toUID),
		sdk.NewAttribute("channel", channel),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("message", message),
		sdk.NewAttribute("celebration_type", getCelebrationType(amount)),
	))

	// Generate tx hash info from context
	txHash := fmt.Sprintf("%X", ctx.TxBytes())
	_ = fromAddr // used for validation above

	return txHash, nil
}

// getCelebrationType returns the celebration tier for a gratitude amount.
func getCelebrationType(amount int64) string {
	if amount >= 1000000 {
		return "legendary" // >= 1 OTK
	}
	if amount >= 100000 {
		return "epic" // >= 0.1 OTK
	}
	if amount >= 10000 {
		return "great" // >= 0.01 OTK
	}
	return "heartfelt"
}
