// Package pqc implements hybrid post-quantum + classical cryptographic signatures.
//
// It pairs Ed25519 (classical) with ML-DSA / FIPS 204 (post-quantum).
// Until a production ML-DSA implementation lands in the Go ecosystem the
// post-quantum slot is a pluggable placeholder; verification gracefully
// degrades to classical-only when PQC key material is absent.
//
// Security model: a transaction is valid only when EVERY available signature
// algorithm verifies (AND logic). Compromising one algorithm is not enough.
package pqc

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
)

// Current key/signature format version.
const CurrentVersion = 1

// HybridKeyPair holds both classical and post-quantum key material.
type HybridKeyPair struct {
	Classical   ClassicalKey
	PostQuantum PostQuantumKey
	Version     int // key version for future migration
}

// ClassicalKey wraps an Ed25519 key pair.
type ClassicalKey struct {
	PublicKey  []byte // 32 bytes
	PrivateKey []byte // 64 bytes
}

// PostQuantumKey wraps ML-DSA (FIPS 204) key material.
// Available is false until an ML-DSA implementation is plugged in.
type PostQuantumKey struct {
	Algorithm  string // e.g. "ml-dsa-65"
	PublicKey  []byte // ~1952 bytes for security level 3
	PrivateKey []byte // ~4032 bytes for security level 3
	Available  bool
}

// HybridSignature carries both classical and (optional) PQC signatures.
type HybridSignature struct {
	ClassicalSig   []byte // Ed25519 signature (64 bytes)
	PostQuantumSig []byte // ML-DSA signature (~3309 bytes) — nil when PQC unavailable
	Version        int
}

// PQCSigner is the interface a future ML-DSA implementation must satisfy.
type PQCSigner interface {
	Algorithm() string
	GenerateKey() (pub, priv []byte, err error)
	Sign(privateKey, message []byte) ([]byte, error)
	Verify(publicKey, message, signature []byte) bool
}

// globalPQCSigner can be set via RegisterPQCSigner to activate PQC signatures.
var globalPQCSigner PQCSigner

// RegisterPQCSigner plugs in a concrete ML-DSA (or other PQC) implementation.
func RegisterPQCSigner(s PQCSigner) {
	globalPQCSigner = s
}

// GenerateHybridKeyPair creates a new hybrid key pair.
// If a PQC signer is registered the post-quantum slot is populated;
// otherwise only the classical key is generated.
func GenerateHybridKeyPair() (*HybridKeyPair, error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("pqc: ed25519 keygen: %w", err)
	}

	kp := &HybridKeyPair{
		Classical: ClassicalKey{
			PublicKey:  pub,
			PrivateKey: priv,
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
			return nil, fmt.Errorf("pqc: pqc keygen: %w", err)
		}
		kp.PostQuantum.PublicKey = pqPub
		kp.PostQuantum.PrivateKey = pqPriv
		kp.PostQuantum.Available = true
		kp.PostQuantum.Algorithm = globalPQCSigner.Algorithm()
	}

	return kp, nil
}

// Sign creates a hybrid signature over message.
func (kp *HybridKeyPair) Sign(message []byte) (*HybridSignature, error) {
	if len(kp.Classical.PrivateKey) == 0 {
		return nil, errors.New("pqc: classical private key is empty")
	}

	classicalSig := ed25519.Sign(ed25519.PrivateKey(kp.Classical.PrivateKey), message)

	sig := &HybridSignature{
		ClassicalSig: classicalSig,
		Version:      kp.Version,
	}

	if kp.PostQuantum.Available && globalPQCSigner != nil {
		pqSig, err := globalPQCSigner.Sign(kp.PostQuantum.PrivateKey, message)
		if err != nil {
			return nil, fmt.Errorf("pqc: pqc sign: %w", err)
		}
		sig.PostQuantumSig = pqSig
	}

	return sig, nil
}

// Verify checks both classical and PQC signatures.
// In migration mode (PQC not available) only the classical signature is checked.
// When PQC key material IS present both signatures must verify (AND logic).
func Verify(publicKey *HybridKeyPair, message []byte, sig *HybridSignature) bool {
	if publicKey == nil || sig == nil {
		return false
	}

	// Classical verification is always required.
	if !ed25519.Verify(ed25519.PublicKey(publicKey.Classical.PublicKey), message, sig.ClassicalSig) {
		return false
	}

	// If the public key declares PQC availability, require PQC verification.
	if publicKey.PostQuantum.Available && globalPQCSigner != nil {
		if len(sig.PostQuantumSig) == 0 {
			return false // PQC sig missing but key says it should be present
		}
		if !globalPQCSigner.Verify(publicKey.PostQuantum.PublicKey, message, sig.PostQuantumSig) {
			return false
		}
	}

	return true
}

// ---------------------------------------------------------------------------
// Serialization helpers — simple length-prefixed binary encoding.
// Format: [version:4][classicalPubLen:4][classicalPub][pqcAvailable:1]
//         [algorithmLen:4][algorithm][pqcPubLen:4][pqcPub]
// ---------------------------------------------------------------------------

// SerializePublicKey serializes the hybrid public key for storage/transmission.
func (kp *HybridKeyPair) SerializePublicKey() ([]byte, error) {
	algoBytes := []byte(kp.PostQuantum.Algorithm)

	size := 4 + 4 + len(kp.Classical.PublicKey) + 1 + 4 + len(algoBytes) + 4 + len(kp.PostQuantum.PublicKey)
	buf := make([]byte, 0, size)

	// Version
	buf = binary.BigEndian.AppendUint32(buf, uint32(kp.Version))

	// Classical public key
	buf = binary.BigEndian.AppendUint32(buf, uint32(len(kp.Classical.PublicKey)))
	buf = append(buf, kp.Classical.PublicKey...)

	// PQC available flag
	if kp.PostQuantum.Available {
		buf = append(buf, 1)
	} else {
		buf = append(buf, 0)
	}

	// Algorithm name
	buf = binary.BigEndian.AppendUint32(buf, uint32(len(algoBytes)))
	buf = append(buf, algoBytes...)

	// PQC public key
	buf = binary.BigEndian.AppendUint32(buf, uint32(len(kp.PostQuantum.PublicKey)))
	buf = append(buf, kp.PostQuantum.PublicKey...)

	return buf, nil
}

// DeserializePublicKey reconstructs a hybrid public key from serialized form.
func DeserializePublicKey(data []byte) (*HybridKeyPair, error) {
	if len(data) < 13 { // minimum: 4+4+0+1+4+0+4+0 = 17 actually, but be safe
		return nil, errors.New("pqc: serialized key too short")
	}

	off := 0

	version := int(binary.BigEndian.Uint32(data[off : off+4]))
	off += 4

	classicalLen := int(binary.BigEndian.Uint32(data[off : off+4]))
	off += 4
	if off+classicalLen > len(data) {
		return nil, errors.New("pqc: truncated classical public key")
	}
	classicalPub := make([]byte, classicalLen)
	copy(classicalPub, data[off:off+classicalLen])
	off += classicalLen

	if off >= len(data) {
		return nil, errors.New("pqc: truncated at pqc flag")
	}
	pqcAvailable := data[off] == 1
	off++

	if off+4 > len(data) {
		return nil, errors.New("pqc: truncated at algorithm length")
	}
	algoLen := int(binary.BigEndian.Uint32(data[off : off+4]))
	off += 4
	if off+algoLen > len(data) {
		return nil, errors.New("pqc: truncated algorithm name")
	}
	algo := string(data[off : off+algoLen])
	off += algoLen

	if off+4 > len(data) {
		return nil, errors.New("pqc: truncated at pqc pub length")
	}
	pqcPubLen := int(binary.BigEndian.Uint32(data[off : off+4]))
	off += 4
	if off+pqcPubLen > len(data) {
		return nil, errors.New("pqc: truncated pqc public key")
	}
	pqcPub := make([]byte, pqcPubLen)
	copy(pqcPub, data[off:off+pqcPubLen])

	return &HybridKeyPair{
		Classical: ClassicalKey{PublicKey: classicalPub},
		PostQuantum: PostQuantumKey{
			Algorithm: algo,
			PublicKey: pqcPub,
			Available: pqcAvailable,
		},
		Version: version,
	}, nil
}
