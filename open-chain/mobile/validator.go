package mobile

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
)

var (
	validatorInstance *validatorState
	validatorMu      sync.Mutex
)

// validatorState holds the validator's key material derived from a mnemonic.
type validatorState struct {
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
	address    string
	chainID    string
}

// InitValidator derives a validator keypair from a mnemonic and chain ID.
// In production this would use BIP39 + BIP32 derivation; for now we use
// a deterministic seed derived from the mnemonic via SHA-256.
func InitValidator(mnemonic string, chainID string) error {
	validatorMu.Lock()
	defer validatorMu.Unlock()

	if mnemonic == "" {
		return fmt.Errorf("mnemonic is required")
	}
	if chainID == "" {
		chainID = "openchain-testnet-1"
	}

	// Derive a 32-byte seed from mnemonic (simplified; production would use BIP39).
	seedInput := fmt.Sprintf("openchain-validator|%s|%s", chainID, mnemonic)
	seed := sha256.Sum256([]byte(seedInput))

	// Generate Ed25519 keypair from seed.
	privKey := ed25519.NewKeyFromSeed(seed[:])
	pubKey := privKey.Public().(ed25519.PublicKey)

	// Derive address from public key hash.
	addrHash := sha256.Sum256(pubKey)
	address := hex.EncodeToString(addrHash[:20]) // first 20 bytes

	validatorInstance = &validatorState{
		privateKey: privKey,
		publicKey:  pubKey,
		address:    address,
		chainID:    chainID,
	}

	return nil
}

// GetValidatorAddress returns the validator's address as a hex string.
func GetValidatorAddress() (string, error) {
	validatorMu.Lock()
	defer validatorMu.Unlock()

	if validatorInstance == nil {
		return "", fmt.Errorf("validator not initialized")
	}
	return validatorInstance.address, nil
}

// GetValidatorPubKey returns the validator's public key as a hex string.
func GetValidatorPubKey() (string, error) {
	validatorMu.Lock()
	defer validatorMu.Unlock()

	if validatorInstance == nil {
		return "", fmt.Errorf("validator not initialized")
	}
	return hex.EncodeToString(validatorInstance.publicKey), nil
}

// SignBlock signs block bytes with the validator's private key.
// Returns the Ed25519 signature as a byte slice.
func SignBlock(blockBytes []byte) ([]byte, error) {
	validatorMu.Lock()
	defer validatorMu.Unlock()

	if validatorInstance == nil {
		return nil, fmt.Errorf("validator not initialized")
	}

	if len(blockBytes) == 0 {
		return nil, fmt.Errorf("block bytes cannot be empty")
	}

	// Sign the SHA-256 hash of the block bytes.
	hash := sha256.Sum256(blockBytes)
	signature := ed25519.Sign(validatorInstance.privateKey, hash[:])
	return signature, nil
}

// VerifyBlockSignature verifies that a block signature is valid for the
// given public key and block bytes.
func VerifyBlockSignature(pubKeyHex string, blockBytes []byte, signatureBytes []byte) (bool, error) {
	pubKeyBytes, err := hex.DecodeString(pubKeyHex)
	if err != nil {
		return false, fmt.Errorf("invalid public key hex: %w", err)
	}

	if len(pubKeyBytes) != ed25519.PublicKeySize {
		return false, fmt.Errorf("invalid public key size: got %d, want %d", len(pubKeyBytes), ed25519.PublicKeySize)
	}

	pubKey := ed25519.PublicKey(pubKeyBytes)
	hash := sha256.Sum256(blockBytes)
	return ed25519.Verify(pubKey, hash[:], signatureBytes), nil
}
