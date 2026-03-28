// Package types defines the Messaging module types.
//
// On-chain encrypted messaging between Universal IDs.
// Messages are stored as encrypted blobs — only the recipient can decrypt.

package types

import "fmt"

const (
	ModuleName = "messaging"
	StoreKey   = ModuleName
)

// Message represents an encrypted on-chain message.
type Message struct {
	ID            string `json:"id"`
	FromUID       string `json:"from_uid"`
	ToUID         string `json:"to_uid"`
	EncryptedBody string `json:"encrypted_body"` // Base64 encoded encrypted content
	Nonce         string `json:"nonce"`           // Encryption nonce
	Timestamp     int64  `json:"timestamp"`       // Block height
	Read          bool   `json:"read"`
}

// Conversation tracks message threads between two UIDs.
type Conversation struct {
	Participants [2]string `json:"participants"`
	LastMessage  string    `json:"last_message"` // Truncated preview (encrypted)
	LastAt       int64     `json:"last_at"`
	MessageCount int64     `json:"message_count"`
}

// GenesisState for messaging.
type GenesisState struct{}

func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("MessagingGenesis{}") }

func DefaultGenesisState() *GenesisState { return &GenesisState{} }
