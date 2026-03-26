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

	"github.com/bpupadhyaya/openchain/x/otk/types"
)

// Keeper manages the OTK module state.
type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

// NewKeeper creates a new OTK keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
		bank:     bank,
	}
}

// MintForMilestone mints OTK when a human development milestone is verified.
// OTK is distributed across contribution rings using the ripple attribution formula.
//
// Example: Child reads at grade level (eOTK milestone, 200 OTK base)
//   - Ring 2 (parents): 200/4 = 50 eOTK
//   - Ring 3 (teachers): 200/9 = 22 eOTK
//   - Ring 4 (community): 200/16 = 12 eOTK
//   - Ring 5 (city): 200/25 = 8 eOTK
//   - Ring 6 (country): 200/36 = 5 eOTK
//   - Ring 7 (humanity): 200/49 = 4 eOTK
func (k Keeper) MintForMilestone(ctx sdk.Context, milestone types.Milestone, ringRecipients map[types.ContributionRing][]sdk.AccAddress) error {
	if !milestone.Verified {
		return fmt.Errorf("milestone %s not yet verified", milestone.ID)
	}

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

		coins := sdk.NewCoins(sdk.NewCoin(milestone.Channel, perRecipient))

		for _, addr := range recipients {
			if err := k.bank.MintCoins(ctx, types.ModuleName, coins); err != nil {
				return fmt.Errorf("failed to mint %s for ring %d: %w", milestone.Channel, ring, err)
			}
			if err := k.bank.SendCoinsFromModuleToAccount(ctx, types.ModuleName, addr, coins); err != nil {
				return fmt.Errorf("failed to send %s to %s: %w", milestone.Channel, addr, err)
			}
		}
	}

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"milestone_minted",
		sdk.NewAttribute("milestone_id", milestone.ID),
		sdk.NewAttribute("uid", milestone.UID),
		sdk.NewAttribute("channel", milestone.Channel),
		sdk.NewAttribute("base_amount", milestone.MintAmount.String()),
	))

	return nil
}

// TransferValue records a value transfer between Universal IDs.
// This is the core operation — representing any human contribution.
func (k Keeper) TransferValue(ctx sdk.Context, transfer types.ValueTransfer) error {
	// Positive value transfer: mint OTK for the recipient
	// Negative value transfer: burn OTK from the source (correction)
	coins := sdk.NewCoins(sdk.NewCoin(transfer.Channel, transfer.Amount))

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

	return nil
}

// GetChannelBalance returns the balance for a specific value channel.
func (k Keeper) GetChannelBalance(ctx sdk.Context, addr sdk.AccAddress, channel string) math.Int {
	coin := k.bank.GetBalance(ctx, addr, channel)
	return coin.Amount
}

// GetTotalValue returns the weighted composite OTK value for an address.
// Weights are governance-determined (default: equal weight).
func (k Keeper) GetTotalValue(ctx sdk.Context, addr sdk.AccAddress) math.Int {
	total := math.ZeroInt()
	for _, channel := range types.AllChannels() {
		balance := k.GetChannelBalance(ctx, addr, channel)
		total = total.Add(balance)
	}
	return total
}
