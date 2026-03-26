package app

// registerOpenChainModules registers the custom Open Chain modules:
//   - x/otk: Multi-channel Open Token (OTK) — human value representation
//   - x/uid: Universal ID — privacy-preserving human identity
//
// These modules are registered as non-depinject modules (like IBC),
// since they don't have protobuf module config definitions yet.
// They will be migrated to full depinject support as the chain matures.
//
// For now, the OTK module uses the bank module for token operations
// (minting, burning, transfers) and adds custom logic for:
//   - Multi-channel value tracking (nOTK, eOTK, hOTK, cOTK, xOTK, gOTK)
//   - Ripple attribution across contribution rings
//   - Milestone-based minting
//   - Gratitude transactions
//
// The UID module manages Universal ID registration and selective disclosure.

import (
	"fmt"

	storetypes "cosmossdk.io/store/types"

	otktypes "openchain/x/otk/types"
	uidtypes "openchain/x/uid/types"
)

// registerOpenChainModules sets up store keys for OTK and UID modules.
// The actual keeper initialization and module registration will be done
// when protobuf message types are defined (Phase 2).
//
// For Phase 1, we register the store keys so the chain is aware of
// these modules and their data can be persisted.
func (app *App) registerOpenChainModules() error {
	// Register store keys for custom modules
	if err := app.RegisterStores(
		storetypes.NewKVStoreKey(otktypes.StoreKey),
		storetypes.NewKVStoreKey(uidtypes.StoreKey),
	); err != nil {
		return fmt.Errorf("failed to register Open Chain module stores: %w", err)
	}

	// Phase 2 TODO: Initialize keepers and register message handlers
	// app.OTKKeeper = otkkeeper.NewKeeper(...)
	// app.UIDKeeper = uidkeeper.NewKeeper(...)

	// Phase 2 TODO: Register modules with the module manager
	// app.ModuleManager.RegisterLegacyModule(otkmodule.NewAppModule(...))
	// app.ModuleManager.RegisterLegacyModule(uidmodule.NewAppModule(...))

	return nil
}
