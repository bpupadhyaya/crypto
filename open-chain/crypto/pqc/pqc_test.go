package pqc

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"testing"
)

func TestGenerateHybridKeyPair(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}
	if len(kp.Classical.PublicKey) != ed25519.PublicKeySize {
		t.Errorf("classical public key length = %d, want %d", len(kp.Classical.PublicKey), ed25519.PublicKeySize)
	}
	if len(kp.Classical.PrivateKey) != ed25519.PrivateKeySize {
		t.Errorf("classical private key length = %d, want %d", len(kp.Classical.PrivateKey), ed25519.PrivateKeySize)
	}
	if kp.Version != CurrentVersion {
		t.Errorf("version = %d, want %d", kp.Version, CurrentVersion)
	}
	// Without a registered PQC signer, post-quantum should be unavailable.
	if kp.PostQuantum.Available {
		t.Error("PostQuantum.Available should be false without registered signer")
	}
}

func TestSignAndVerify(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}

	msg := []byte("open chain transaction payload")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}

	if !Verify(kp, msg, sig) {
		t.Error("Verify returned false for valid signature")
	}
}

func TestVerifyRejectsTamperedMessage(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}

	msg := []byte("original message")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}

	tampered := []byte("tampered message")
	if Verify(kp, tampered, sig) {
		t.Error("Verify should reject tampered message")
	}
}

func TestVerifyRejectsTamperedSignature(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}

	msg := []byte("hello")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}

	// Flip a byte in the classical signature.
	sig.ClassicalSig[0] ^= 0xff
	if Verify(kp, msg, sig) {
		t.Error("Verify should reject tampered classical signature")
	}
}

func TestVerifyNilInputs(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	msg := []byte("test")
	sig, _ := kp.Sign(msg)

	if Verify(nil, msg, sig) {
		t.Error("Verify(nil key) should return false")
	}
	if Verify(kp, msg, nil) {
		t.Error("Verify(nil sig) should return false")
	}
}

func TestSerializeDeserializeRoundTrip(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}

	data, err := kp.SerializePublicKey()
	if err != nil {
		t.Fatalf("SerializePublicKey: %v", err)
	}

	restored, err := DeserializePublicKey(data)
	if err != nil {
		t.Fatalf("DeserializePublicKey: %v", err)
	}

	if !bytes.Equal(kp.Classical.PublicKey, restored.Classical.PublicKey) {
		t.Error("classical public key mismatch after round trip")
	}
	if kp.PostQuantum.Available != restored.PostQuantum.Available {
		t.Error("PostQuantum.Available mismatch after round trip")
	}
	if kp.PostQuantum.Algorithm != restored.PostQuantum.Algorithm {
		t.Error("PostQuantum.Algorithm mismatch after round trip")
	}
	if kp.Version != restored.Version {
		t.Error("Version mismatch after round trip")
	}
}

func TestSerializeDeserializeVerify(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair: %v", err)
	}

	msg := []byte("round trip verification")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}

	data, err := kp.SerializePublicKey()
	if err != nil {
		t.Fatalf("SerializePublicKey: %v", err)
	}
	restored, err := DeserializePublicKey(data)
	if err != nil {
		t.Fatalf("DeserializePublicKey: %v", err)
	}

	if !Verify(restored, msg, sig) {
		t.Error("Verify should succeed with deserialized public key")
	}
}

func TestMigrationFromClassicalKey(t *testing.T) {
	// Generate a standalone Ed25519 key pair.
	_, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("ed25519.GenerateKey: %v", err)
	}

	kp, err := UpgradeToHybrid(priv)
	if err != nil {
		t.Fatalf("UpgradeToHybrid: %v", err)
	}

	// The classical public key should match the original.
	expectedPub := priv.Public().(ed25519.PublicKey)
	if !bytes.Equal(kp.Classical.PublicKey, expectedPub) {
		t.Error("upgraded key has wrong classical public key")
	}

	// Sign and verify with the migrated key.
	msg := []byte("migrated transaction")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign after migration: %v", err)
	}
	if !Verify(kp, msg, sig) {
		t.Error("Verify failed after migration")
	}
}

func TestUpgradeToHybridBadKey(t *testing.T) {
	_, err := UpgradeToHybrid([]byte("too-short"))
	if err == nil {
		t.Error("UpgradeToHybrid should reject short key")
	}
}

func TestIsPQCReady(t *testing.T) {
	tests := []struct {
		name   string
		status MigrationStatus
		want   bool
	}{
		{"fully migrated", MigrationStatus{HasClassical: true, HasPQC: true, Version: CurrentVersion}, true},
		{"classical only", MigrationStatus{HasClassical: true, HasPQC: false, Version: CurrentVersion}, false},
		{"old version", MigrationStatus{HasClassical: true, HasPQC: true, Version: 0}, false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsPQCReady(tc.status); got != tc.want {
				t.Errorf("IsPQCReady = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestDeserializePublicKeyErrors(t *testing.T) {
	// Too short.
	if _, err := DeserializePublicKey([]byte{0, 1}); err == nil {
		t.Error("expected error for truncated input")
	}
}

// mockPQCSigner is a trivial mock to test the PQC path.
type mockPQCSigner struct{}

func (m *mockPQCSigner) Algorithm() string { return "mock-pqc" }

func (m *mockPQCSigner) GenerateKey() (pub, priv []byte, err error) {
	pub = make([]byte, 32)
	priv = make([]byte, 64)
	_, _ = rand.Read(pub)
	_, _ = rand.Read(priv)
	return pub, priv, nil
}

func (m *mockPQCSigner) Sign(privateKey, message []byte) ([]byte, error) {
	// Trivial "signature": HMAC-like hash using private key prefix.
	// NOT cryptographically secure — only for testing the plumbing.
	sig := make([]byte, 64)
	copy(sig, privateKey[:min(32, len(privateKey))])
	for i, b := range message {
		sig[i%64] ^= b
	}
	return sig, nil
}

func (m *mockPQCSigner) Verify(publicKey, message, signature []byte) bool {
	// Accept any signature that is 64 bytes (mock).
	return len(signature) == 64
}

func TestWithMockPQCSigner(t *testing.T) {
	// Register mock signer.
	old := globalPQCSigner
	RegisterPQCSigner(&mockPQCSigner{})
	defer func() { globalPQCSigner = old }()

	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair with mock PQC: %v", err)
	}
	if !kp.PostQuantum.Available {
		t.Error("PostQuantum should be available with mock signer")
	}
	if kp.PostQuantum.Algorithm != "mock-pqc" {
		t.Errorf("algorithm = %q, want %q", kp.PostQuantum.Algorithm, "mock-pqc")
	}

	msg := []byte("hybrid test message")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if len(sig.PostQuantumSig) == 0 {
		t.Error("PostQuantumSig should be populated with mock signer")
	}
	if !Verify(kp, msg, sig) {
		t.Error("Verify should pass with mock PQC signer")
	}

	// Verify that missing PQC sig fails when key says PQC is available.
	sig.PostQuantumSig = nil
	if Verify(kp, msg, sig) {
		t.Error("Verify should reject missing PQC sig when key has PQC available")
	}
}

func TestMigrationWithMockPQCSigner(t *testing.T) {
	old := globalPQCSigner
	RegisterPQCSigner(&mockPQCSigner{})
	defer func() { globalPQCSigner = old }()

	_, priv, _ := ed25519.GenerateKey(rand.Reader)
	kp, err := UpgradeToHybrid(priv)
	if err != nil {
		t.Fatalf("UpgradeToHybrid with mock PQC: %v", err)
	}
	if !kp.PostQuantum.Available {
		t.Error("PostQuantum should be available after migration with mock signer")
	}

	msg := []byte("migrated hybrid")
	sig, err := kp.Sign(msg)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if !Verify(kp, msg, sig) {
		t.Error("Verify failed after hybrid migration with mock signer")
	}
}
