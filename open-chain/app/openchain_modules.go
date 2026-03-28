package app

// registerOpenChainModules registers all custom Open Chain modules and initializes keepers.
//
// Modules:
//   - x/otk: Multi-channel Open Token — human value representation
//   - x/uid: Universal ID — privacy-preserving human identity
//   - x/dex: Decentralized exchange — AMM + order book
//   - x/govuid: One-human-one-vote governance
//   - x/achievement: Soulbound milestone NFTs

import (
	"fmt"

	storetypes "cosmossdk.io/store/types"

	achievementkeeper "openchain/x/achievement/keeper"
	achievementtypes "openchain/x/achievement/types"
	dexkeeper "openchain/x/dex/keeper"
	dextypes "openchain/x/dex/types"
	govuidkeeper "openchain/x/govuid/keeper"
	otkkeeper "openchain/x/otk/keeper"
	otktypes "openchain/x/otk/types"
	uidkeeper "openchain/x/uid/keeper"
	uidtypes "openchain/x/uid/types"
)

func (app *App) registerOpenChainModules() error {
	// Register store keys for all custom modules
	otkStoreKey := storetypes.NewKVStoreKey(otktypes.StoreKey)
	uidStoreKey := storetypes.NewKVStoreKey(uidtypes.StoreKey)
	dexStoreKey := storetypes.NewKVStoreKey(dextypes.StoreKey)
	govuidStoreKey := storetypes.NewKVStoreKey("govuid")
	achievementStoreKey := storetypes.NewKVStoreKey(achievementtypes.StoreKey)

	if err := app.RegisterStores(otkStoreKey, uidStoreKey, dexStoreKey, govuidStoreKey, achievementStoreKey); err != nil {
		return fmt.Errorf("failed to register Open Chain module stores: %w", err)
	}

	// Initialize keepers — order matters (some keepers depend on others)
	app.OTKKeeper = otkkeeper.NewKeeper(app.appCodec, otkStoreKey, app.BankKeeper)
	app.UIDKeeper = uidkeeper.NewKeeper(app.appCodec, uidStoreKey)
	app.GovUIDKeeper = govuidkeeper.NewKeeper(app.appCodec, govuidStoreKey, app.UIDKeeper)
	app.DEXKeeper = dexkeeper.NewKeeper(app.appCodec, dexStoreKey, app.BankKeeper)
	app.AchievementKeeper = achievementkeeper.NewKeeper(app.appCodec, achievementStoreKey)

	return nil
}
