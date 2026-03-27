// Package types defines the Open Chain DEX module types.
//
// Two components:
// 1. AMM Liquidity Pools (constant product x*y=k)
// 2. Order Book (limit orders with atomic settlement)

package types

const (
	ModuleName = "dex"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// LiquidityPool represents an AMM pool.
type LiquidityPool struct {
	ID       string `json:"id"`
	TokenA   string `json:"token_a"`   // denom
	TokenB   string `json:"token_b"`   // denom
	ReserveA int64  `json:"reserve_a"` // in base units
	ReserveB int64  `json:"reserve_b"`
	LPSupply int64  `json:"lp_supply"` // total LP tokens
	FeeRate  int64  `json:"fee_rate"`  // basis points (30 = 0.3%)
}

// LimitOrder represents an on-chain limit order.
type LimitOrder struct {
	ID         string `json:"id"`
	Maker      string `json:"maker"`       // bech32 address
	SellDenom  string `json:"sell_denom"`
	BuyDenom   string `json:"buy_denom"`
	SellAmount int64  `json:"sell_amount"` // in base units
	Price      int64  `json:"price"`       // price * 1e8 (fixed point)
	FilledPct  int64  `json:"filled_pct"`  // 0-100
	Status     string `json:"status"`      // open, filled, cancelled, expired
	CreatedAt  int64  `json:"created_at"`  // block height
	ExpiresAt  int64  `json:"expires_at"`
}

// GenesisState for the DEX module.
type GenesisState struct {
	Pools  []LiquidityPool `json:"pools"`
	Orders []LimitOrder    `json:"orders"`
}

func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Pools:  []LiquidityPool{},
		Orders: []LimitOrder{},
	}
}
