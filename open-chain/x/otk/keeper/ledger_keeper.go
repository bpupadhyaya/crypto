// Package keeper — Living Ledger state management.
//
// Stores and retrieves Living Ledger data for each Universal ID.
// The Living Ledger is the heart of Open Chain — it records every
// value transfer, milestone, and gratitude transaction.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/otk/types"
)

// GetLivingLedger retrieves the Living Ledger for a Universal ID.
// Creates a new empty ledger if none exists.
func (k Keeper) GetLivingLedger(ctx sdk.Context, uid string) (*types.LivingLedger, error) {
	store := ctx.KVStore(k.storeKey)
	key := ledgerKey(uid)

	bz := store.Get(key)
	if bz == nil {
		return types.NewLivingLedger(uid), nil
	}

	var ledger types.LivingLedger
	if err := json.Unmarshal(bz, &ledger); err != nil {
		return nil, fmt.Errorf("failed to unmarshal ledger for %s: %w", uid, err)
	}
	return &ledger, nil
}

// SetLivingLedger stores the Living Ledger for a Universal ID.
func (k Keeper) SetLivingLedger(ctx sdk.Context, ledger *types.LivingLedger) error {
	store := ctx.KVStore(k.storeKey)
	key := ledgerKey(ledger.UID)

	bz, err := json.Marshal(ledger)
	if err != nil {
		return fmt.Errorf("failed to marshal ledger for %s: %w", ledger.UID, err)
	}

	store.Set(key, bz)
	return nil
}

// RecordValueTransfer updates both sender's and receiver's Living Ledgers.
func (k Keeper) RecordValueTransfer(ctx sdk.Context, fromUID, toUID, channel string, amount int64, ring types.ContributionRing, isGratitude bool) error {
	// Update sender's ledger
	senderLedger, err := k.GetLivingLedger(ctx, fromUID)
	if err != nil {
		return err
	}
	senderLedger.RecordGiven(channel, amount)
	if isGratitude {
		senderLedger.RecordGratitude(amount, false)
	}
	if err := k.SetLivingLedger(ctx, senderLedger); err != nil {
		return err
	}

	// Update receiver's ledger
	receiverLedger, err := k.GetLivingLedger(ctx, toUID)
	if err != nil {
		return err
	}
	receiverLedger.RecordReceived(channel, amount, ring)
	if isGratitude {
		receiverLedger.RecordGratitude(amount, true)
	}
	if err := k.SetLivingLedger(ctx, receiverLedger); err != nil {
		return err
	}

	// Emit ledger update event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"living_ledger_update",
		sdk.NewAttribute("from_uid", fromUID),
		sdk.NewAttribute("to_uid", toUID),
		sdk.NewAttribute("channel", channel),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("is_gratitude", fmt.Sprintf("%t", isGratitude)),
	))

	return nil
}

// RecordMilestoneMint updates the Living Ledger for a milestone mint.
func (k Keeper) RecordMilestoneMint(ctx sdk.Context, uid, channel string, amount int64) error {
	ledger, err := k.GetLivingLedger(ctx, uid)
	if err != nil {
		return err
	}
	ledger.RecordMinted(channel, amount)
	return k.SetLivingLedger(ctx, ledger)
}

// GetContributionScore returns the contribution score for a UID.
func (k Keeper) GetContributionScore(ctx sdk.Context, uid string) (int64, error) {
	ledger, err := k.GetLivingLedger(ctx, uid)
	if err != nil {
		return 0, err
	}
	return ledger.GetContributionScore(), nil
}

// StoreLedgerEntry appends a single entry to the ledger history.
func (k Keeper) StoreLedgerEntry(ctx sdk.Context, entry types.LedgerEntry) error {
	store := ctx.KVStore(k.storeKey)

	// Key: ledger_entry/{uid}/{timestamp}
	key := []byte(fmt.Sprintf("ledger_entry/%s/%d", entry.ToUID, entry.Timestamp))

	bz, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	store.Set(key, bz)
	return nil
}

// GetLedgerEntries retrieves recent ledger entries for a UID.
func (k Keeper) GetLedgerEntries(ctx sdk.Context, uid string, limit int) ([]types.LedgerEntry, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("ledger_entry/%s/", uid))

	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var entries []types.LedgerEntry
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var entry types.LedgerEntry
		if err := json.Unmarshal(iterator.Value(), &entry); err != nil {
			continue
		}
		entries = append(entries, entry)
		count++
	}

	return entries, nil
}

func ledgerKey(uid string) []byte {
	return []byte(fmt.Sprintf("living_ledger/%s", uid))
}
