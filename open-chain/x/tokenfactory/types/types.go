// Package types defines types for the Token Factory module.
//
// Allows users to create custom tokens on Open Chain.
// Each token is a standard bank module denom with custom metadata.

package types

import "fmt"

const (
	ModuleName = "tokenfactory"
	StoreKey   = ModuleName
)

// TokenMetadata stores information about a user-created token.
type TokenMetadata struct {
	Denom         string `json:"denom"`          // On-chain denom (e.g., "factory/openchain1abc/mytoken")
	Name          string `json:"name"`           // Human-readable name
	Symbol        string `json:"symbol"`         // Ticker symbol
	Decimals      int    `json:"decimals"`       // Usually 6
	InitialSupply int64  `json:"initial_supply"` // In base units
	Description   string `json:"description"`
	Creator       string `json:"creator"`        // Bech32 address
	CreatedAt     int64  `json:"created_at"`     // Block height
}

// GenesisState for token factory.
type GenesisState struct {
	Tokens []TokenMetadata `json:"tokens"`
}

func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("TokenFactoryGenesis{%d tokens}", len(g.Tokens)) }

func DefaultGenesisState() *GenesisState {
	return &GenesisState{Tokens: []TokenMetadata{}}
}

// MakeDenom creates the on-chain denom for a factory token.
// Format: factory/{creator}/{symbol}
func MakeDenom(creator, symbol string) string {
	return fmt.Sprintf("factory/%s/%s", creator, symbol)
}
