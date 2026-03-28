// Package types defines the Yield Farming module types.

package types

import "fmt"

const (
	ModuleName = "farming"
	StoreKey   = ModuleName
)

// Farm represents a yield farming pool.
type Farm struct {
	ID            string `json:"id"`
	LPDenom       string `json:"lp_denom"`       // LP token to stake
	RewardDenom   string `json:"reward_denom"`    // Reward token
	RewardPerBlock int64  `json:"reward_per_block"` // Rewards distributed per block
	TotalStaked   int64  `json:"total_staked"`
	APY           int64  `json:"apy_bps"`         // Basis points
	Multiplier    int64  `json:"multiplier"`       // 1x, 2x, 3x
	Enabled       bool   `json:"enabled"`
	StartBlock    int64  `json:"start_block"`
	EndBlock      int64  `json:"end_block"`       // 0 = no end
}

// StakedPosition represents a user's stake in a farm.
type StakedPosition struct {
	Farmer    string `json:"farmer"`
	FarmID    string `json:"farm_id"`
	Amount    int64  `json:"amount"`
	RewardDebt int64 `json:"reward_debt"` // For calculating pending rewards
	StakedAt  int64  `json:"staked_at"`
}

type GenesisState struct {
	Farms []Farm `json:"farms"`
}

func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("FarmingGenesis{%d farms}", len(g.Farms)) }

func DefaultGenesisState() *GenesisState {
	return &GenesisState{Farms: []Farm{
		{ID: "farm-otk-usdt", LPDenom: "lp-otk-usdt", RewardDenom: "uotk", RewardPerBlock: 100000, APY: 12000, Multiplier: 3, Enabled: true},
		{ID: "farm-otk-eth", LPDenom: "lp-otk-eth", RewardDenom: "uotk", RewardPerBlock: 80000, APY: 9500, Multiplier: 2, Enabled: true},
		{ID: "farm-btc-usdt", LPDenom: "lp-btc-usdt", RewardDenom: "uotk", RewardPerBlock: 50000, APY: 4500, Multiplier: 1, Enabled: true},
	}}
}
