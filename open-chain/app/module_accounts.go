// Package app — Module Account Registration.
//
// Registers module accounts with the bank module so that custom modules
// can hold and transfer OTK. Without this, modules can't mint, burn,
// or hold tokens.
//
// Each module that interacts with the bank module needs a module account:
//   - otk: mints OTK for milestones, gratitude, staking rewards
//   - dex: holds tokens locked in AMM pools and limit orders
//   - lending: holds supplied and borrowed tokens
//   - farming: holds staked LP tokens and reward pools
//   - escrow: holds escrowed funds during disputes
//   - dao: holds DAO treasury funds
//   - tokenfactory: holds custom token supply

package app

import (
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"

	daotypes "openchain/x/dao/types"
	dextypes "openchain/x/dex/types"
	escrowtypes "openchain/x/escrow/types"
	farmingtypes "openchain/x/farming/types"
	lendingtypes "openchain/x/lending/types"
	otktypes "openchain/x/otk/types"
	tokenfactorytypes "openchain/x/tokenfactory/types"
)

// OpenChainMaccPerms returns the module account permissions for all custom modules.
// These are merged with the standard Cosmos SDK module account permissions.
func OpenChainMaccPerms() map[string][]string {
	return map[string][]string{
		otktypes.ModuleName:          {authtypes.Minter, authtypes.Burner},
		dextypes.ModuleName:          {authtypes.Minter, authtypes.Burner},
		lendingtypes.ModuleName:      {authtypes.Minter, authtypes.Burner},
		farmingtypes.ModuleName:      {authtypes.Minter, authtypes.Burner},
		escrowtypes.ModuleName:       {},
		daotypes.ModuleName:          {},
		tokenfactorytypes.ModuleName: {authtypes.Minter, authtypes.Burner},
	}
}

// OpenChainBlockedAddrs returns addresses that should not receive funds directly.
// Module accounts are blocked to prevent accidental sends.
func OpenChainBlockedAddrs() map[string]bool {
	blocked := make(map[string]bool)
	for acc := range OpenChainMaccPerms() {
		blocked[authtypes.NewModuleAddress(acc).String()] = true
	}
	return blocked
}
