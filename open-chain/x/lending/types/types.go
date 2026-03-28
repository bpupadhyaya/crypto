// Package types defines the Lending module types.
//
// On-chain lending protocol: supply assets to earn interest,
// borrow against collateral. Liquidation when health factor drops.

package types

import "fmt"

const (
	ModuleName = "lending"
	StoreKey   = ModuleName
)

// Market represents a lending market for a specific token.
type Market struct {
	Denom          string `json:"denom"`
	TotalSupplied  int64  `json:"total_supplied"`
	TotalBorrowed  int64  `json:"total_borrowed"`
	SupplyAPY      int64  `json:"supply_apy_bps"`   // basis points (500 = 5%)
	BorrowAPY      int64  `json:"borrow_apy_bps"`
	CollateralFactor int64 `json:"collateral_factor_bps"` // 7500 = 75%
	ReserveFactor  int64  `json:"reserve_factor_bps"`     // 1000 = 10%
	Enabled        bool   `json:"enabled"`
}

// Position represents a user's lending/borrowing position.
type Position struct {
	Address   string          `json:"address"`
	Supplied  map[string]int64 `json:"supplied"`  // denom → amount
	Borrowed  map[string]int64 `json:"borrowed"`  // denom → amount
	HealthFactor float64      `json:"health_factor"` // >= 1.0 is safe
}

// LiquidationEvent records a liquidation.
type LiquidationEvent struct {
	Borrower     string `json:"borrower"`
	Liquidator   string `json:"liquidator"`
	DebtDenom    string `json:"debt_denom"`
	DebtAmount   int64  `json:"debt_amount"`
	CollateralDenom string `json:"collateral_denom"`
	CollateralAmount int64 `json:"collateral_amount"`
	BlockHeight  int64  `json:"block_height"`
}

type GenesisState struct {
	Markets []Market `json:"markets"`
}

func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("LendingGenesis{%d markets}", len(g.Markets)) }

func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Markets: []Market{
			{Denom: "uotk", TotalSupplied: 0, TotalBorrowed: 0, SupplyAPY: 300, BorrowAPY: 800, CollateralFactor: 7500, ReserveFactor: 1000, Enabled: true},
			{Denom: "ubtc", TotalSupplied: 0, TotalBorrowed: 0, SupplyAPY: 100, BorrowAPY: 500, CollateralFactor: 8000, ReserveFactor: 1000, Enabled: true},
			{Denom: "ueth", TotalSupplied: 0, TotalBorrowed: 0, SupplyAPY: 200, BorrowAPY: 600, CollateralFactor: 7500, ReserveFactor: 1000, Enabled: true},
			{Denom: "usol", TotalSupplied: 0, TotalBorrowed: 0, SupplyAPY: 250, BorrowAPY: 700, CollateralFactor: 7000, ReserveFactor: 1000, Enabled: true},
			{Denom: "uusdt", TotalSupplied: 0, TotalBorrowed: 0, SupplyAPY: 400, BorrowAPY: 600, CollateralFactor: 9000, ReserveFactor: 500, Enabled: true},
		},
	}
}
