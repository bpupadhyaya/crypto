// Package types defines the types for the Universal ID (UID) module.
//
// Universal ID provides privacy-preserving, ZK-based unique human identity.
// Every human gets a cryptographic identifier — functionally a wallet address.
// ZK proofs allow selective disclosure without revealing real identity.
//
// "No central authority shall hold a registry of Universal IDs matched to
//  real identities. The system is designed so that such a registry cannot exist."
//  — Human Constitution, Article II, Section 1.4

package types

const (
	ModuleName = "uid"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// UniversalID represents a unique human identity on Open Chain.
type UniversalID struct {
	// ID is the on-chain identifier (derived from biometric proof hash)
	ID string `json:"id"`

	// Address is the Cosmos SDK account address linked to this UID
	Address string `json:"address"`

	// CreatedAt is the block height at which this UID was registered
	CreatedAt int64 `json:"created_at"`

	// ProofHash is the hash of the ZK proof that verified uniqueness
	// The actual biometric data never leaves the user's device
	ProofHash string `json:"proof_hash"`

	// Status: active, suspended, or revoked
	Status UIDStatus `json:"status"`

	// Guardian is the UID of the parent/guardian (for minors)
	// Empty string means self-sovereign (age of agency reached)
	Guardian string `json:"guardian,omitempty"`
}

type UIDStatus string

const (
	StatusActive    UIDStatus = "active"
	StatusSuspended UIDStatus = "suspended" // Temporarily suspended (dispute)
	StatusRevoked   UIDStatus = "revoked"   // Permanently revoked (duplicate detected)
)

// SelectiveDisclosure represents a ZK proof claim.
// The verifier learns only that the claim is true, nothing else.
type SelectiveDisclosure struct {
	UID       string `json:"uid"`
	ClaimType string `json:"claim_type"` // e.g., "is_parent_of", "is_teacher", "resides_in"
	ClaimHash string `json:"claim_hash"` // Hash of the ZK proof
	Verified  bool   `json:"verified"`
	ExpiresAt int64  `json:"expires_at"` // Block height expiry
}

// Supported claim types for selective disclosure
const (
	ClaimIsParentOf  = "is_parent_of"
	ClaimIsChildOf   = "is_child_of"
	ClaimIsTeacher   = "is_teacher"
	ClaimResidesIn   = "resides_in"
	ClaimHasCredential = "has_credential"
	ClaimIsAdult     = "is_adult" // Age of agency reached
)

// GenesisState defines the UID module's genesis state.
type GenesisState struct {
	UIDs []UniversalID `json:"uids"`
}

// DefaultGenesisState returns the default genesis state — empty.
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		UIDs: []UniversalID{},
	}
}
