// Package keeper implements the Universal ID module's state management.
//
// Handles:
// - UID registration (one per unique human)
// - Selective disclosure (ZK proof claims)
// - Guardian management (parents registering children)
// - Status transitions (active, suspended, revoked)

package keeper

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/bpupadhyaya/openchain/x/uid/types"
)

// Keeper manages the Universal ID module state.
type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
}

// NewKeeper creates a new UID keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
	}
}

// RegisterUID creates a new Universal ID for a human.
// The proofHash is the hash of the ZK biometric uniqueness proof.
// The actual biometric data never leaves the user's device.
func (k Keeper) RegisterUID(ctx sdk.Context, address sdk.AccAddress, proofHash string, guardian string) (*types.UniversalID, error) {
	store := ctx.KVStore(k.storeKey)

	// Check if this address already has a UID
	key := uidKeyFromAddress(address)
	if store.Has(key) {
		return nil, fmt.Errorf("address %s already has a Universal ID", address)
	}

	// Check if this proof hash is already used (prevents duplicate registration)
	proofKey := proofKeyFromHash(proofHash)
	if store.Has(proofKey) {
		return nil, fmt.Errorf("this biometric proof has already been used to register a Universal ID")
	}

	// Generate UID from proof hash + address
	uidHash := sha256.Sum256([]byte(proofHash + address.String()))
	uid := &types.UniversalID{
		ID:        "uid-" + hex.EncodeToString(uidHash[:16]),
		Address:   address.String(),
		CreatedAt: ctx.BlockHeight(),
		ProofHash: proofHash,
		Status:    types.StatusActive,
		Guardian:  guardian,
	}

	// Store UID
	bz, err := k.cdc.Marshal(uid)
	if err != nil {
		return nil, err
	}
	store.Set(key, bz)
	store.Set(proofKey, key) // Index: proof hash → address

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"uid_registered",
		sdk.NewAttribute("uid", uid.ID),
		sdk.NewAttribute("address", uid.Address),
		sdk.NewAttribute("guardian", uid.Guardian),
	))

	return uid, nil
}

// GetUID retrieves a Universal ID by account address.
func (k Keeper) GetUID(ctx sdk.Context, address sdk.AccAddress) (*types.UniversalID, error) {
	store := ctx.KVStore(k.storeKey)
	key := uidKeyFromAddress(address)

	bz := store.Get(key)
	if bz == nil {
		return nil, fmt.Errorf("no Universal ID found for address %s", address)
	}

	var uid types.UniversalID
	if err := k.cdc.Unmarshal(bz, &uid); err != nil {
		return nil, err
	}
	return &uid, nil
}

// HasUID checks if an address has a registered Universal ID.
func (k Keeper) HasUID(ctx sdk.Context, address sdk.AccAddress) bool {
	store := ctx.KVStore(k.storeKey)
	return store.Has(uidKeyFromAddress(address))
}

// AddSelectiveDisclosure registers a ZK proof claim for a UID.
func (k Keeper) AddSelectiveDisclosure(ctx sdk.Context, disclosure types.SelectiveDisclosure) error {
	store := ctx.KVStore(k.storeKey)
	key := disclosureKey(disclosure.UID, disclosure.ClaimType)

	bz, err := k.cdc.Marshal(&disclosure)
	if err != nil {
		return err
	}
	store.Set(key, bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"selective_disclosure",
		sdk.NewAttribute("uid", disclosure.UID),
		sdk.NewAttribute("claim_type", disclosure.ClaimType),
		sdk.NewAttribute("verified", fmt.Sprintf("%t", disclosure.Verified)),
	))

	return nil
}

// TransferGuardianship transfers guardian role (e.g., when child reaches age of agency).
func (k Keeper) TransferGuardianship(ctx sdk.Context, address sdk.AccAddress) error {
	uid, err := k.GetUID(ctx, address)
	if err != nil {
		return err
	}

	if uid.Guardian == "" {
		return fmt.Errorf("UID %s is already self-sovereign", uid.ID)
	}

	uid.Guardian = "" // Self-sovereign now
	store := ctx.KVStore(k.storeKey)
	bz, err := k.cdc.Marshal(uid)
	if err != nil {
		return err
	}
	store.Set(uidKeyFromAddress(address), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"guardianship_transferred",
		sdk.NewAttribute("uid", uid.ID),
		sdk.NewAttribute("status", "self_sovereign"),
	))

	return nil
}

// Store key helpers
func uidKeyFromAddress(addr sdk.AccAddress) []byte {
	return append([]byte("uid/addr/"), addr.Bytes()...)
}

func proofKeyFromHash(hash string) []byte {
	return append([]byte("uid/proof/"), []byte(hash)...)
}

func disclosureKey(uid, claimType string) []byte {
	return []byte(fmt.Sprintf("uid/disclosure/%s/%s", uid, claimType))
}
