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
	messagingkeeper "openchain/x/messaging/keeper"
	messagingtypes "openchain/x/messaging/types"
	dexkeeper "openchain/x/dex/keeper"
	dextypes "openchain/x/dex/types"
	govuidkeeper "openchain/x/govuid/keeper"
	otkkeeper "openchain/x/otk/keeper"
	otktypes "openchain/x/otk/types"
	tokenfactorykeeper "openchain/x/tokenfactory/keeper"
	tokenfactorytypes "openchain/x/tokenfactory/types"
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
	tokenFactoryStoreKey := storetypes.NewKVStoreKey(tokenfactorytypes.StoreKey)
	messagingStoreKey := storetypes.NewKVStoreKey(messagingtypes.StoreKey)

	if err := app.RegisterStores(otkStoreKey, uidStoreKey, dexStoreKey, govuidStoreKey, achievementStoreKey, tokenFactoryStoreKey, messagingStoreKey); err != nil {
		return fmt.Errorf("failed to register Open Chain module stores: %w", err)
	}

	// Initialize keepers — order matters (some keepers depend on others)
	app.OTKKeeper = otkkeeper.NewKeeper(app.appCodec, otkStoreKey, app.BankKeeper)
	app.UIDKeeper = uidkeeper.NewKeeper(app.appCodec, uidStoreKey)
	app.GovUIDKeeper = govuidkeeper.NewKeeper(app.appCodec, govuidStoreKey, app.UIDKeeper)
	app.DEXKeeper = dexkeeper.NewKeeper(app.appCodec, dexStoreKey, app.BankKeeper)
	app.AchievementKeeper = achievementkeeper.NewKeeper(app.appCodec, achievementStoreKey)
	app.TokenFactoryKeeper = tokenfactorykeeper.NewKeeper(app.appCodec, tokenFactoryStoreKey, app.BankKeeper)
	app.MessagingKeeper = messagingkeeper.NewKeeper(app.appCodec, messagingStoreKey)

	// Wire cross-module dependencies (set after all keepers initialized)
	app.OTKKeeper.SetAchievementMinter(app.AchievementKeeper)

	return nil
}
