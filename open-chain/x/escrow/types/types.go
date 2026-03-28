// Package types defines the Open Chain Escrow module types.
//
// On-chain escrow for peer-to-peer trades with dispute resolution.
// Supports: create, fund, release, dispute, resolve, refund, expire.

package types

const (
	ModuleName = "escrow"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// EscrowContract represents an on-chain escrow between two parties.
type EscrowContract struct {
	ID          string `json:"id"`
	Seller      string `json:"seller"`      // bech32 address — creates the escrow
	Buyer       string `json:"buyer"`        // bech32 address — funds the escrow
	Amount      int64  `json:"amount"`       // in base units
	Denom       string `json:"denom"`        // token denomination
	Description string `json:"description"`  // human-readable trade description
	Status      string `json:"status"`       // created, funded, released, disputed, refunded, expired
	Arbiter     string `json:"arbiter"`      // UID of dispute resolver (optional)
	CreatedAt   int64  `json:"created_at"`   // block height
	ExpiresAt   int64  `json:"expires_at"`   // block height
	FundedAt    int64  `json:"funded_at"`    // block height when buyer deposited
	ReleasedAt  int64  `json:"released_at"`  // block height when funds were released
}

// GenesisState for the Escrow module.
type GenesisState struct {
	Escrows []EscrowContract `json:"escrows"`
}

func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Escrows: []EscrowContract{},
	}
}
