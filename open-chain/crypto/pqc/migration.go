package pqc

import (
	"crypto/ed25519"
	"errors"
	"fmt"
)

// MigrationStatus tracks PQC readiness for a single account.
type MigrationStatus struct {
	Address      string
	HasClassical bool  // true for all accounts
	HasPQC       bool  // false until migration
	MigratedAt   int64 // block height at which migration occurred
	Version      int   // current key version
}

// UpgradeToHybrid takes an existing Ed25519 private key (64 bytes) and
// produces a HybridKeyPair that retains the classical key and generates
// fresh PQC key material (when a PQC signer is registered).
func UpgradeToHybrid(classicalPrivKey []byte) (*HybridKeyPair, error) {
	if len(classicalPrivKey) != ed25519.PrivateKeySize {
		return nil, errors.New("pqc: classical private key must be 64 bytes (Ed25519)")
	}

	priv := ed25519.PrivateKey(classicalPrivKey)
	pub := priv.Public().(ed25519.PublicKey)

	kp := &HybridKeyPair{
		Classical: ClassicalKey{
			PublicKey:  []byte(pub),
			PrivateKey: classicalPrivKey,
		},
		PostQuantum: PostQuantumKey{
			Algorithm: "ml-dsa-65",
			Available: false,
		},
		Version: CurrentVersion,
	}

	if globalPQCSigner != nil {
		pqPub, pqPriv, err := globalPQCSigner.GenerateKey()
		if err != nil {
			return nil, fmt.Errorf("pqc: pqc keygen during migration: %w", err)
		}
		kp.PostQuantum.PublicKey = pqPub
		kp.PostQuantum.PrivateKey = pqPriv
		kp.PostQuantum.Available = true
		kp.PostQuantum.Algorithm = globalPQCSigner.Algorithm()
	}

	return kp, nil
}

// IsPQCReady reports whether the account has been migrated to hybrid keys.
func IsPQCReady(status MigrationStatus) bool {
	return status.HasClassical && status.HasPQC && status.Version >= CurrentVersion
}
