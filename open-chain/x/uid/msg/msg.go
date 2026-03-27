// Package msg defines the UID module's transaction messages.
//
// Messages:
//   - MsgRegisterUID: Register a new Universal ID
//   - MsgSelectiveDisclosure: Add a ZK proof claim
//   - MsgTransferGuardianship: Transfer control from guardian to self

package msg

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ─── MsgRegisterUID ───

// MsgRegisterUID registers a new Universal ID on Open Chain.
// The proofHash is the hash of the ZK biometric uniqueness proof.
// The actual biometric data never leaves the user's device.
type MsgRegisterUID struct {
	Creator   string `json:"creator"`    // Address registering the UID
	ProofHash string `json:"proof_hash"` // Hash of ZK biometric proof
	Guardian  string `json:"guardian"`   // Guardian UID (empty for adults)
}

func (m MsgRegisterUID) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return fmt.Errorf("invalid creator: %w", err)
	}
	if m.ProofHash == "" {
		return fmt.Errorf("proof hash is required")
	}
	if len(m.ProofHash) < 32 {
		return fmt.Errorf("proof hash too short (min 32 chars)")
	}
	if m.Guardian != "" {
		if _, err := sdk.AccAddressFromBech32(m.Guardian); err != nil {
			return fmt.Errorf("invalid guardian: %w", err)
		}
	}
	return nil
}

func (m MsgRegisterUID) GetSigners() []sdk.AccAddress {
	creator, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{creator}
}

// ─── MsgSelectiveDisclosure ───

// MsgSelectiveDisclosure adds a verifiable claim to a Universal ID.
// Uses zero-knowledge proofs — verifier learns only that the claim is true.
type MsgSelectiveDisclosure struct {
	UID       string `json:"uid"`
	Creator   string `json:"creator"`
	ClaimType string `json:"claim_type"` // is_parent_of, is_teacher, resides_in, etc.
	ClaimHash string `json:"claim_hash"` // ZK proof hash
}

func (m MsgSelectiveDisclosure) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return fmt.Errorf("invalid creator: %w", err)
	}
	if m.UID == "" {
		return fmt.Errorf("uid is required")
	}
	if m.ClaimType == "" {
		return fmt.Errorf("claim type is required")
	}
	if m.ClaimHash == "" {
		return fmt.Errorf("claim hash is required")
	}
	return nil
}

func (m MsgSelectiveDisclosure) GetSigners() []sdk.AccAddress {
	creator, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{creator}
}

// ─── MsgTransferGuardianship ───

// MsgTransferGuardianship transitions a UID from guardian-controlled to self-sovereign.
// Called when a child reaches the age of agency.
type MsgTransferGuardianship struct {
	Guardian string `json:"guardian"` // Current guardian
	UID      string `json:"uid"`     // UID being released
}

func (m MsgTransferGuardianship) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Guardian); err != nil {
		return fmt.Errorf("invalid guardian: %w", err)
	}
	if m.UID == "" {
		return fmt.Errorf("uid is required")
	}
	return nil
}

func (m MsgTransferGuardianship) GetSigners() []sdk.AccAddress {
	guardian, _ := sdk.AccAddressFromBech32(m.Guardian)
	return []sdk.AccAddress{guardian}
}
