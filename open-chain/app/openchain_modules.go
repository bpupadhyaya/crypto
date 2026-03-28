package app

// registerOpenChainModules registers custom Open Chain modules and initializes keepers.
//
// Modules:
//   - x/otk: Multi-channel Open Token — human value representation
//   - x/uid: Universal ID — privacy-preserving human identity
//   - x/dex: Decentralized exchange — AMM + order book
//   - x/govuid: One-human-one-vote governance

import (
	"fmt"

	storetypes "cosmossdk.io/store/types"

	dextypes "openchain/x/dex/types"
	govuidkeeper "openchain/x/govuid/keeper"
	otkkeeper "openchain/x/otk/keeper"
	otktypes "openchain/x/otk/types"
	uidkeeper "openchain/x/uid/keeper"
	uidtypes "openchain/x/uid/types"
)

func (app *App) registerOpenChainModules() error {
	// Register store keys for custom modules
	otkStoreKey := storetypes.NewKVStoreKey(otktypes.StoreKey)
	uidStoreKey := storetypes.NewKVStoreKey(uidtypes.StoreKey)
	dexStoreKey := storetypes.NewKVStoreKey(dextypes.StoreKey)
	govuidStoreKey := storetypes.NewKVStoreKey("govuid")

	if err := app.RegisterStores(otkStoreKey, uidStoreKey, dexStoreKey, govuidStoreKey); err != nil {
		return fmt.Errorf("failed to register Open Chain module stores: %w", err)
	}

	// Initialize keepers
	app.OTKKeeper = otkkeeper.NewKeeper(app.appCodec, otkStoreKey, app.BankKeeper)
	app.UIDKeeper = uidkeeper.NewKeeper(app.appCodec, uidStoreKey)
	app.GovUIDKeeper = govuidkeeper.NewKeeper(app.appCodec, govuidStoreKey, app.UIDKeeper)

	return nil
}
