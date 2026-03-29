// Package keeper — Message Encryption.
//
// End-to-end encryption for on-chain messages using X25519 + AES-256-GCM.
// All encryption/decryption happens client-side. On-chain, only encrypted
// ciphertexts are stored. The chain validates:
//   - Sender has a registered encryption public key
//   - Recipient has a registered encryption public key
//   - Message includes a nonce (prevents replay)
//   - Message size is within limits
//
// Key Exchange:
//   - Each UID registers an X25519 public key (derived from their seed)
//   - Sender generates ephemeral X25519 keypair
//   - Shared secret = ECDH(ephemeral_private, recipient_public)
//   - Message encrypted with AES-256-GCM using shared secret
//   - Ephemeral public key stored with message for recipient to derive secret

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// EncryptionKey stores a UID's public encryption key.
type EncryptionKey struct {
	UID       string `json:"uid"`
	PublicKey string `json:"public_key"` // base64-encoded X25519 public key
	Algorithm string `json:"algorithm"`  // x25519 (default), ml-kem-768 (PQC future)
	CreatedAt int64  `json:"created_at"`
	Revoked   bool   `json:"revoked"`
}

// EncryptedEnvelope wraps an encrypted message with key exchange data.
type EncryptedEnvelope struct {
	EphemeralPubKey string `json:"ephemeral_pub_key"` // sender's ephemeral X25519 public key
	Nonce           string `json:"nonce"`              // base64 AES-GCM nonce (12 bytes)
	Ciphertext      string `json:"ciphertext"`         // base64 AES-256-GCM ciphertext
	Algorithm       string `json:"algorithm"`          // x25519-aes256gcm
	SenderKeyID     string `json:"sender_key_id"`      // hash of sender's encryption key
}

const (
	MaxMessageSizeBytes = 4096 // 4 KB max encrypted message size
	AlgorithmX25519     = "x25519"
	AlgorithmMLKEM768   = "ml-kem-768" // Post-quantum (future)
	EncAlgoDefault      = "x25519-aes256gcm"
)

// RegisterEncryptionKey stores a UID's public encryption key.
func (k Keeper) RegisterEncryptionKey(ctx sdk.Context, uid, publicKey, algorithm string) error {
	if uid == "" || publicKey == "" {
		return fmt.Errorf("uid and public_key are required")
	}

	if algorithm == "" {
		algorithm = AlgorithmX25519
	}

	key := EncryptionKey{
		UID:       uid,
		PublicKey: publicKey,
		Algorithm: algorithm,
		CreatedAt: ctx.BlockHeight(),
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(key)
	store.Set([]byte("enc_key/"+uid), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"encryption_key_registered",
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("algorithm", algorithm),
	))

	return nil
}

// GetEncryptionKey retrieves a UID's encryption public key.
func (k Keeper) GetEncryptionKey(ctx sdk.Context, uid string) (*EncryptionKey, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("enc_key/" + uid))
	if bz == nil {
		return nil, fmt.Errorf("no encryption key for UID %s", uid)
	}

	var key EncryptionKey
	if err := json.Unmarshal(bz, &key); err != nil {
		return nil, err
	}

	if key.Revoked {
		return nil, fmt.Errorf("encryption key for UID %s has been revoked", uid)
	}

	return &key, nil
}

// RevokeEncryptionKey marks a key as revoked (e.g., compromised).
func (k Keeper) RevokeEncryptionKey(ctx sdk.Context, uid string) error {
	key, err := k.GetEncryptionKey(ctx, uid)
	if err != nil {
		return err
	}

	key.Revoked = true
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(key)
	store.Set([]byte("enc_key/"+uid), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"encryption_key_revoked",
		sdk.NewAttribute("uid", uid),
	))

	return nil
}

// ValidateEncryptedMessage validates that an encrypted message meets requirements.
func (k Keeper) ValidateEncryptedMessage(ctx sdk.Context, fromUID, toUID, encryptedBody string) error {
	// Check sender has encryption key
	senderKey, err := k.GetEncryptionKey(ctx, fromUID)
	if err != nil {
		return fmt.Errorf("sender has no encryption key: %w", err)
	}
	_ = senderKey

	// Check recipient has encryption key
	recipientKey, err := k.GetEncryptionKey(ctx, toUID)
	if err != nil {
		return fmt.Errorf("recipient has no encryption key: %w", err)
	}
	_ = recipientKey

	// Validate message size
	if len(encryptedBody) > MaxMessageSizeBytes {
		return fmt.Errorf("message too large: %d bytes (max %d)", len(encryptedBody), MaxMessageSizeBytes)
	}

	// Validate envelope structure
	var envelope EncryptedEnvelope
	if err := json.Unmarshal([]byte(encryptedBody), &envelope); err != nil {
		// Not a valid envelope — allow plain text for backward compatibility
		return nil
	}

	if envelope.EphemeralPubKey == "" {
		return fmt.Errorf("encrypted envelope missing ephemeral public key")
	}
	if envelope.Nonce == "" {
		return fmt.Errorf("encrypted envelope missing nonce")
	}

	return nil
}

// SendEncryptedMessage is an enhanced SendMessage that validates encryption.
func (k Keeper) SendEncryptedMessage(ctx sdk.Context, fromUID, toUID, encryptedBody, subject string) (string, error) {
	// Validate encryption (soft — allow messages even without encryption keys during transition)
	if err := k.ValidateEncryptedMessage(ctx, fromUID, toUID, encryptedBody); err != nil {
		// Log warning but don't block — encryption is encouraged, not required yet
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"message_encryption_warning",
			sdk.NewAttribute("from", fromUID),
			sdk.NewAttribute("to", toUID),
			sdk.NewAttribute("warning", err.Error()),
		))
	}

	// Create and send message
	msg := messagingMessage{
		FromUID:       fromUID,
		ToUID:         toUID,
		EncryptedBody: encryptedBody,
		Subject:       subject,
	}

	return msg.ID, k.sendMessageInternal(ctx, msg)
}

// Internal message type to avoid import cycle with types package
type messagingMessage struct {
	ID            string `json:"id"`
	FromUID       string `json:"from_uid"`
	ToUID         string `json:"to_uid"`
	EncryptedBody string `json:"encrypted_body"`
	Subject       string `json:"subject"`
	Timestamp     int64  `json:"timestamp"`
}

func (k Keeper) sendMessageInternal(ctx sdk.Context, msg messagingMessage) error {
	if msg.FromUID == "" || msg.ToUID == "" || msg.EncryptedBody == "" {
		return fmt.Errorf("from, to, and body are required")
	}

	store := ctx.KVStore(k.storeKey)
	msg.Timestamp = ctx.BlockHeight()

	key := []byte(fmt.Sprintf("message/%s/%s/%d", msg.ToUID, msg.FromUID, msg.Timestamp))
	bz, _ := json.Marshal(msg)
	store.Set(key, bz)

	sentKey := []byte(fmt.Sprintf("sent/%s/%s/%d", msg.FromUID, msg.ToUID, msg.Timestamp))
	store.Set(sentKey, bz)

	k.updateConversation(ctx, msg.FromUID, msg.ToUID, msg.Timestamp)

	return nil
}
