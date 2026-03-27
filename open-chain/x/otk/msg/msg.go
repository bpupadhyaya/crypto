// Package msg defines the OTK module's transaction messages.
//
// Messages:
//   - MsgValueTransfer: Transfer value between Universal IDs (any channel)
//   - MsgMintMilestone: Mint OTK when a milestone is verified
//   - MsgGratitude: Special gratitude transaction (child → parent/teacher)

package msg

import (
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ─── MsgValueTransfer ───

// MsgValueTransfer transfers value between two addresses on a specific channel.
type MsgValueTransfer struct {
	FromAddress string `json:"from_address"`
	ToAddress   string `json:"to_address"`
	Channel     string `json:"channel"` // xotk, notk, eotk, hotk, cotk, gotk
	Amount      int64  `json:"amount"`  // in micro-units (uotk)
	IsGratitude bool   `json:"is_gratitude"`
	Memo        string `json:"memo"`
}

func (m MsgValueTransfer) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.FromAddress); err != nil {
		return fmt.Errorf("invalid sender: %w", err)
	}
	if _, err := sdk.AccAddressFromBech32(m.ToAddress); err != nil {
		return fmt.Errorf("invalid recipient: %w", err)
	}
	if m.Amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	if !isValidChannel(m.Channel) {
		return fmt.Errorf("invalid channel: %s", m.Channel)
	}
	return nil
}

func (m MsgValueTransfer) GetSigners() []sdk.AccAddress {
	from, _ := sdk.AccAddressFromBech32(m.FromAddress)
	return []sdk.AccAddress{from}
}

// ─── MsgMintMilestone ───

// MsgMintMilestone mints OTK when a human development milestone is verified.
// Only authorized verifiers can submit this message.
type MsgMintMilestone struct {
	Verifier    string `json:"verifier"`     // Address of the verifier
	UID         string `json:"uid"`          // Universal ID of the person
	Channel     string `json:"channel"`      // Which value channel to mint
	BaseAmount  int64  `json:"base_amount"`  // Base OTK to mint (before ripple)
	Description string `json:"description"`  // Human-readable milestone
	// Ring recipients (JSON-encoded map of ring → []address)
	RingRecipients string `json:"ring_recipients"`
}

func (m MsgMintMilestone) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Verifier); err != nil {
		return fmt.Errorf("invalid verifier: %w", err)
	}
	if m.UID == "" {
		return fmt.Errorf("uid is required")
	}
	if m.BaseAmount <= 0 {
		return fmt.Errorf("base amount must be positive")
	}
	if !isValidChannel(m.Channel) {
		return fmt.Errorf("invalid channel: %s", m.Channel)
	}
	return nil
}

func (m MsgMintMilestone) GetSigners() []sdk.AccAddress {
	verifier, _ := sdk.AccAddressFromBech32(m.Verifier)
	return []sdk.AccAddress{verifier}
}

// ─── MsgGratitude ───

// MsgGratitude is a special value transfer from a grown person to those who raised them.
// It carries special significance on-chain (visible, celebrated).
type MsgGratitude struct {
	FromAddress string `json:"from_address"` // The person expressing gratitude
	ToAddress   string `json:"to_address"`   // Parent, teacher, mentor
	Channel     string `json:"channel"`      // Usually notk or eotk
	Amount      int64  `json:"amount"`
	Message     string `json:"message"` // Personal gratitude message (stored on-chain)
}

func (m MsgGratitude) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.FromAddress); err != nil {
		return fmt.Errorf("invalid sender: %w", err)
	}
	if _, err := sdk.AccAddressFromBech32(m.ToAddress); err != nil {
		return fmt.Errorf("invalid recipient: %w", err)
	}
	if m.Amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	return nil
}

func (m MsgGratitude) GetSigners() []sdk.AccAddress {
	from, _ := sdk.AccAddressFromBech32(m.FromAddress)
	return []sdk.AccAddress{from}
}

// ─── Helpers ───

func isValidChannel(ch string) bool {
	switch ch {
	case "economic", "nurture", "education", "health", "community", "governance":
		return true
	// Also accept denom form
	case "uxotk", "unotk", "ueotk", "uhotk", "ucotk", "ugotk", "uotk":
		return true
	}
	return false
}
