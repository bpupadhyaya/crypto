package app

// registerOpenChainModules registers all custom Open Chain modules and initializes keepers.
//
// Modules:
//   - x/otk: Multi-channel Open Token — human value representation
//   - x/uid: Universal ID — privacy-preserving human identity
//   - x/dex: Decentralized exchange — AMM + order book
//   - x/govuid: One-human-one-vote governance
//   - x/achievement: Soulbound milestone NFTs
//   - x/correction: Article V correction mechanism (-OTK for verified harm)

import (
	"fmt"

	storetypes "cosmossdk.io/store/types"

	achievementkeeper "openchain/x/achievement/keeper"
	achievementtypes "openchain/x/achievement/types"
	correctionkeeper "openchain/x/correction/keeper"
	correctiontypes "openchain/x/correction/types"
	daokeeper "openchain/x/dao/keeper"
	daotypes "openchain/x/dao/types"
	dexkeeper "openchain/x/dex/keeper"
	dextypes "openchain/x/dex/types"
	escrowkeeper "openchain/x/escrow/keeper"
	escrowtypes "openchain/x/escrow/types"
	farmingkeeper "openchain/x/farming/keeper"
	farmingtypes "openchain/x/farming/types"
	govuidkeeper "openchain/x/govuid/keeper"
	lendingkeeper "openchain/x/lending/keeper"
	lendingtypes "openchain/x/lending/types"
	messagingkeeper "openchain/x/messaging/keeper"
	messagingtypes "openchain/x/messaging/types"
	otkkeeper "openchain/x/otk/keeper"
	otktypes "openchain/x/otk/types"
	tokenfactorykeeper "openchain/x/tokenfactory/keeper"
	tokenfactorytypes "openchain/x/tokenfactory/types"
	uidkeeper "openchain/x/uid/keeper"
	uidtypes "openchain/x/uid/types"
)

// Module dependency graph (determines initialization order):
//
//   OTK          → BankKeeper, AchievementKeeper
//   UID          → (none)
//   GovUID       → UIDKeeper
//   DEX          → BankKeeper
//   Achievement  → (none)
//   TokenFactory → BankKeeper
//   Messaging    → (none)
//   Lending      → BankKeeper
//   Farming      → BankKeeper
//   Escrow       → BankKeeper
//   DAO          → BankKeeper
//   Correction   → (none)
//
// Modules with no dependencies (UID, Achievement, Messaging, Correction) can be
// initialized in any order. Modules depending on BankKeeper must come after the
// bank module is set up. GovUID must come after UID. OTK cross-module dep on
// AchievementKeeper is resolved post-init via SetAchievementMinter.
func (app *App) registerOpenChainModules() error {
	// Register store keys for all custom modules
	otkStoreKey := storetypes.NewKVStoreKey(otktypes.StoreKey)
	uidStoreKey := storetypes.NewKVStoreKey(uidtypes.StoreKey)
	dexStoreKey := storetypes.NewKVStoreKey(dextypes.StoreKey)
	govuidStoreKey := storetypes.NewKVStoreKey("govuid")
	achievementStoreKey := storetypes.NewKVStoreKey(achievementtypes.StoreKey)
	tokenFactoryStoreKey := storetypes.NewKVStoreKey(tokenfactorytypes.StoreKey)
	messagingStoreKey := storetypes.NewKVStoreKey(messagingtypes.StoreKey)
	lendingStoreKey := storetypes.NewKVStoreKey(lendingtypes.StoreKey)
	escrowStoreKey := storetypes.NewKVStoreKey(escrowtypes.StoreKey)
	farmingStoreKey := storetypes.NewKVStoreKey(farmingtypes.StoreKey)
	daoStoreKey := storetypes.NewKVStoreKey(daotypes.StoreKey)
	correctionStoreKey := storetypes.NewKVStoreKey(correctiontypes.StoreKey)

	if err := app.RegisterStores(otkStoreKey, uidStoreKey, dexStoreKey, govuidStoreKey, achievementStoreKey, tokenFactoryStoreKey, messagingStoreKey, lendingStoreKey, farmingStoreKey, escrowStoreKey, daoStoreKey, correctionStoreKey); err != nil {
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
	app.LendingKeeper = lendingkeeper.NewKeeper(app.appCodec, lendingStoreKey, app.BankKeeper)
	app.EscrowKeeper = escrowkeeper.NewKeeper(app.appCodec, escrowStoreKey, app.BankKeeper)
	app.FarmingKeeper = farmingkeeper.NewKeeper(app.appCodec, farmingStoreKey, app.BankKeeper)
	app.DAOKeeper = daokeeper.NewKeeper(app.appCodec, daoStoreKey, app.BankKeeper)
	app.CorrectionKeeper = correctionkeeper.NewKeeper(app.appCodec, correctionStoreKey)

	// Wire cross-module dependencies (set after all keepers initialized)
	app.OTKKeeper.SetAchievementMinter(app.AchievementKeeper)

	return nil
}
