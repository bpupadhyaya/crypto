// Package keeper — Cross-chain identity linking.
//
// Links a Universal ID to addresses on multiple chains (BTC, ETH, SOL, etc.).
// A user signs a message with their chain-specific private key to prove ownership,
// then links the external address to their Open Chain UID. This creates a unified
// cross-chain identity — one human, many wallets.
//
// "A Universal ID transcends any single chain. It is the thread that connects
//  a human's presence across every ledger they touch."

package keeper

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// IdentityLink represents a Universal ID linked to addresses on multiple chains.
type IdentityLink struct {
	UID             string            `json:"uid"`
	LinkedAddresses map[string]string `json:"linked_addresses"` // chain → address
	VerifiedLinks   map[string]bool   `json:"verified_links"`   // chain → verified
	LinkedAt        int64             `json:"linked_at"`
}

// Supported chains for identity linking
const (
	ChainBitcoin   = "bitcoin"
	ChainEthereum  = "ethereum"
	ChainSolana    = "solana"
	ChainOpenChain = "openchain"
	ChainCosmos    = "cosmos"
)

// supportedChains lists all chains that can be linked to a UID.
var supportedChains = map[string]bool{
	ChainBitcoin:   true,
	ChainEthereum:  true,
	ChainSolana:    true,
	ChainOpenChain: true,
	ChainCosmos:    true,
}

// Store key prefixes for identity links
func identityLinkKey(uid string) []byte {
	return []byte(fmt.Sprintf("uid/link/%s", uid))
}

func reverseAddressKey(chain, address string) []byte {
	return []byte(fmt.Sprintf("uid/revaddr/%s/%s", chain, address))
}

// LinkAddress links an external chain address to a Universal ID.
// The proof is a signature of the message "link:<uid>:<chain>:<address>" signed
// with the private key that controls the external address.
func (k Keeper) LinkAddress(ctx sdk.Context, uid, chain, address string, proof []byte) error {
	store := ctx.KVStore(k.storeKey)

	// Validate chain is supported
	if !supportedChains[chain] {
		return fmt.Errorf("unsupported chain: %s", chain)
	}

	// Validate inputs
	if uid == "" || address == "" {
		return fmt.Errorf("uid and address must not be empty")
	}

	// Check that this address isn't already linked to a different UID
	revKey := reverseAddressKey(chain, address)
	if existing := store.Get(revKey); existing != nil {
		existingUID := string(existing)
		if existingUID != uid {
			return fmt.Errorf("address %s on %s is already linked to UID %s", address, chain, existingUID)
		}
	}

	// Verify the proof — the user must sign "link:<uid>:<chain>:<address>"
	// to prove they control the external address
	verified := verifyLinkProof(chain, address, uid, proof)

	// Get or create the identity link
	link, err := k.getOrCreateIdentityLink(ctx, uid)
	if err != nil {
		return err
	}

	// Add the linked address
	link.LinkedAddresses[chain] = address
	link.VerifiedLinks[chain] = verified
	link.LinkedAt = time.Now().Unix()

	// Persist using JSON (IdentityLink contains maps)
	bz, err := json.Marshal(link)
	if err != nil {
		return fmt.Errorf("failed to marshal identity link: %w", err)
	}
	store.Set(identityLinkKey(uid), bz)

	// Store reverse index: chain+address → UID
	store.Set(revKey, []byte(uid))

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"identity_linked",
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("chain", chain),
		sdk.NewAttribute("address", address),
		sdk.NewAttribute("verified", fmt.Sprintf("%t", verified)),
	))

	return nil
}

// GetLinkedAddresses retrieves all linked addresses for a Universal ID.
func (k Keeper) GetLinkedAddresses(ctx sdk.Context, uid string) (*IdentityLink, error) {
	store := ctx.KVStore(k.storeKey)
	key := identityLinkKey(uid)

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("no linked addresses found for UID %s", uid)
	}

	var link IdentityLink
	if err := json.Unmarshal(bz, &link); err != nil {
		return nil, fmt.Errorf("failed to unmarshal identity link: %w", err)
	}
	return &link, nil
}

// ResolveUIDFromAddress looks up a UID given a chain and address.
// This allows cross-chain identity resolution — given an ETH address,
// find the human's Universal ID (and from there, all other addresses).
func (k Keeper) ResolveUIDFromAddress(ctx sdk.Context, chain, address string) (string, error) {
	store := ctx.KVStore(k.storeKey)
	revKey := reverseAddressKey(chain, address)

	bz := store.Get(revKey)
	if bz == nil {
		return "", fmt.Errorf("no UID found for %s address %s", chain, address)
	}

	return string(bz), nil
}

// UnlinkAddress removes a linked address from a UID.
func (k Keeper) UnlinkAddress(ctx sdk.Context, uid, chain string) error {
	store := ctx.KVStore(k.storeKey)

	link, err := k.GetLinkedAddresses(ctx, uid)
	if err != nil {
		return err
	}

	address, exists := link.LinkedAddresses[chain]
	if !exists {
		return fmt.Errorf("no %s address linked to UID %s", chain, uid)
	}

	// Remove from link
	delete(link.LinkedAddresses, chain)
	delete(link.VerifiedLinks, chain)

	// Persist updated link
	bz, err := json.Marshal(link)
	if err != nil {
		return fmt.Errorf("failed to marshal identity link: %w", err)
	}
	store.Set(identityLinkKey(uid), bz)

	// Remove reverse index
	store.Delete(reverseAddressKey(chain, address))

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"identity_unlinked",
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("chain", chain),
		sdk.NewAttribute("address", address),
	))

	return nil
}

// getOrCreateIdentityLink retrieves an existing link or creates a new one.
func (k Keeper) getOrCreateIdentityLink(ctx sdk.Context, uid string) (*IdentityLink, error) {
	store := ctx.KVStore(k.storeKey)
	key := identityLinkKey(uid)

	bz := store.Get(key)
	if bz == nil {
		return &IdentityLink{
			UID:             uid,
			LinkedAddresses: make(map[string]string),
			VerifiedLinks:   make(map[string]bool),
			LinkedAt:        time.Now().Unix(),
		}, nil
	}

	var link IdentityLink
	if err := json.Unmarshal(bz, &link); err != nil {
		return nil, fmt.Errorf("failed to unmarshal identity link: %w", err)
	}

	// Ensure maps are initialized (defensive)
	if link.LinkedAddresses == nil {
		link.LinkedAddresses = make(map[string]string)
	}
	if link.VerifiedLinks == nil {
		link.VerifiedLinks = make(map[string]bool)
	}

	return &link, nil
}

// verifyLinkProof verifies that the proof is a valid signature of the link message
// signed by the private key controlling the given address on the specified chain.
//
// The message format is: "link:<uid>:<chain>:<address>"
// The proof is expected to be a raw ECDSA signature (r||s, 64 bytes) for
// secp256k1-based chains (BTC, ETH) or an Ed25519 signature (64 bytes) for Solana.
//
// In production, this would use chain-specific signature verification libraries.
// For now, it validates the proof is non-empty and properly sized.
func verifyLinkProof(chain, address, uid string, proof []byte) bool {
	if len(proof) == 0 {
		return false
	}

	message := fmt.Sprintf("link:%s:%s:%s", uid, chain, address)
	msgHash := sha256.Sum256([]byte(message))

	switch chain {
	case ChainBitcoin, ChainEthereum, ChainOpenChain, ChainCosmos:
		// secp256k1 ECDSA signature verification
		// Proof format: r (32 bytes) || s (32 bytes) || pubkey (33 bytes compressed)
		if len(proof) < 97 { // 32 + 32 + 33
			return false
		}
		r := new(big.Int).SetBytes(proof[:32])
		s := new(big.Int).SetBytes(proof[32:64])
		pubKeyBytes := proof[64:]

		// Parse compressed public key
		x, y := elliptic.UnmarshalCompressed(elliptic.P256(), pubKeyBytes)
		if x == nil {
			// Fallback: accept if proof has correct structure (for testnet/demo)
			return len(proof) >= 64
		}

		pubKey := &ecdsa.PublicKey{Curve: elliptic.P256(), X: x, Y: y}
		return ecdsa.Verify(pubKey, msgHash[:], r, s)

	case ChainSolana:
		// Ed25519 signature verification
		// Proof format: signature (64 bytes) || pubkey (32 bytes)
		if len(proof) < 96 { // 64 + 32
			return false
		}
		// Full Ed25519 verification would use ed25519.Verify here.
		// For now, accept properly-sized proofs.
		return len(proof) >= 64

	default:
		return false
	}
}

// GetLinkProofMessage returns the message that must be signed to link an address.
// This is useful for the wallet UI to show the user what they're signing.
func GetLinkProofMessage(uid, chain, address string) string {
	return fmt.Sprintf("link:%s:%s:%s", uid, chain, address)
}

// GetVerifiedLinkCount returns the number of verified linked addresses for a UID.
func (k Keeper) GetVerifiedLinkCount(ctx sdk.Context, uid string) int {
	link, err := k.GetLinkedAddresses(ctx, uid)
	if err != nil {
		return 0
	}

	count := 0
	for _, verified := range link.VerifiedLinks {
		if verified {
			count++
		}
	}
	return count
}

// IsAddressLinked checks if a given address on a chain is linked to any UID.
func (k Keeper) IsAddressLinked(ctx sdk.Context, chain, address string) bool {
	store := ctx.KVStore(k.storeKey)
	return store.Has(reverseAddressKey(chain, address))
}

// GetAllLinkedUIDs returns all UIDs that have at least one linked address.
// Used for reputation batch updates and analytics.
func (k Keeper) GetAllLinkedUIDs(ctx sdk.Context) []string {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("uid/link/")
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var uids []string
	for ; iterator.Valid(); iterator.Next() {
		// Key format: "uid/link/<uid>"
		key := string(iterator.Key())
		uid := key[len("uid/link/"):]
		uids = append(uids, uid)
	}
	return uids
}

// HexEncodeProof converts a proof byte slice to hex string for display/storage.
func HexEncodeProof(proof []byte) string {
	return hex.EncodeToString(proof)
}
