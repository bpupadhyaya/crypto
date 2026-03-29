// Package keeper — On-chain family relationships linked to Universal IDs.
//
// Family relationships model the bonds between parents, children, guardians,
// mentors, and teachers. When a parenting milestone is verified, OTK
// automatically flows up the family tree via ripple attribution.
//
// "The greatest investment any civilization can make is in the raising and
//  education of its children."
// — The Human Constitution

package keeper

import (
	"encoding/json"
	"fmt"
	"time"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// FamilyRelationship represents an on-chain link between two Universal IDs.
type FamilyRelationship struct {
	ParentUID    string `json:"parent_uid"`
	ChildUID     string `json:"child_uid"`
	Relationship string `json:"relationship"` // parent, guardian, mentor, teacher
	Verified     bool   `json:"verified"`      // both parties confirmed
	CreatedAt    int64  `json:"created_at"`
}

// Relationship types
const (
	RelParent   = "parent"
	RelGuardian = "guardian"
	RelMentor   = "mentor"
	RelTeacher  = "teacher"
)

// Valid relationship types
var validRelationships = map[string]bool{
	RelParent:   true,
	RelGuardian: true,
	RelMentor:   true,
	RelTeacher:  true,
}

// Store key helpers for family relationships
func familyRelKey(parentUID, childUID string) []byte {
	return []byte(fmt.Sprintf("uid/family/%s/%s", parentUID, childUID))
}

func familyChildIndexKey(childUID, parentUID string) []byte {
	return []byte(fmt.Sprintf("uid/family-child/%s/%s", childUID, parentUID))
}

func familyParentPrefix(parentUID string) []byte {
	return []byte(fmt.Sprintf("uid/family/%s/", parentUID))
}

func familyChildPrefix(childUID string) []byte {
	return []byte(fmt.Sprintf("uid/family-child/%s/", childUID))
}

// RegisterRelationship creates a new family relationship between two UIDs.
// The relationship starts unverified — the other party must confirm it.
// Only the "upstream" party (parent/guardian/mentor/teacher) initiates.
func (k Keeper) RegisterRelationship(ctx sdk.Context, parentUID, childUID, relationship string) error {
	// Validate relationship type
	if !validRelationships[relationship] {
		return fmt.Errorf("invalid relationship type %q: must be one of parent, guardian, mentor, teacher", relationship)
	}

	// Prevent self-relationships
	if parentUID == childUID {
		return fmt.Errorf("cannot create a relationship with yourself")
	}

	store := ctx.KVStore(k.storeKey)

	// Check for existing relationship
	key := familyRelKey(parentUID, childUID)
	if store.Has(key) {
		return fmt.Errorf("relationship already exists between %s and %s", parentUID, childUID)
	}

	rel := FamilyRelationship{
		ParentUID:    parentUID,
		ChildUID:     childUID,
		Relationship: relationship,
		Verified:     false,
		CreatedAt:    time.Now().Unix(),
	}

	bz, err := json.Marshal(&rel)
	if err != nil {
		return fmt.Errorf("failed to marshal relationship: %w", err)
	}

	// Store under parent index
	store.Set(key, bz)
	// Store under child index (for reverse lookups)
	store.Set(familyChildIndexKey(childUID, parentUID), bz)

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"family_relationship_registered",
		sdk.NewAttribute("parent_uid", parentUID),
		sdk.NewAttribute("child_uid", childUID),
		sdk.NewAttribute("relationship", relationship),
		sdk.NewAttribute("verified", "false"),
	))

	return nil
}

// ConfirmRelationship allows the child/downstream party to confirm the relationship.
// Once confirmed, milestone ripple attribution becomes active for this link.
func (k Keeper) ConfirmRelationship(ctx sdk.Context, childUID, parentUID string) error {
	store := ctx.KVStore(k.storeKey)

	key := familyRelKey(parentUID, childUID)
	bz := store.Get(key)
	if bz == nil {
		return fmt.Errorf("no pending relationship from %s to %s", parentUID, childUID)
	}

	var rel FamilyRelationship
	if err := json.Unmarshal(bz, &rel); err != nil {
		return fmt.Errorf("failed to unmarshal relationship: %w", err)
	}

	if rel.Verified {
		return fmt.Errorf("relationship between %s and %s is already confirmed", parentUID, childUID)
	}

	rel.Verified = true

	updated, err := json.Marshal(&rel)
	if err != nil {
		return fmt.Errorf("failed to marshal updated relationship: %w", err)
	}

	// Update both indexes
	store.Set(key, updated)
	store.Set(familyChildIndexKey(childUID, parentUID), updated)

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"family_relationship_confirmed",
		sdk.NewAttribute("parent_uid", parentUID),
		sdk.NewAttribute("child_uid", childUID),
		sdk.NewAttribute("relationship", rel.Relationship),
	))

	return nil
}

// GetChildren returns all family relationships where the given UID is the parent/upstream.
func (k Keeper) GetChildren(ctx sdk.Context, parentUID string) []FamilyRelationship {
	store := ctx.KVStore(k.storeKey)
	prefix := familyParentPrefix(parentUID)
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var relationships []FamilyRelationship
	for ; iterator.Valid(); iterator.Next() {
		var rel FamilyRelationship
		if err := json.Unmarshal(iterator.Value(), &rel); err != nil {
			continue
		}
		relationships = append(relationships, rel)
	}
	return relationships
}

// GetParents returns all family relationships where the given UID is the child/downstream.
func (k Keeper) GetParents(ctx sdk.Context, childUID string) []FamilyRelationship {
	store := ctx.KVStore(k.storeKey)
	prefix := familyChildPrefix(childUID)
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var relationships []FamilyRelationship
	for ; iterator.Valid(); iterator.Next() {
		var rel FamilyRelationship
		if err := json.Unmarshal(iterator.Value(), &rel); err != nil {
			continue
		}
		relationships = append(relationships, rel)
	}
	return relationships
}

// GetFamilyTree returns all family relationships connected to the given UID,
// including both upstream (parents/mentors/teachers) and downstream (children).
// This is the full family tree visible from one person's perspective.
func (k Keeper) GetFamilyTree(ctx sdk.Context, uid string) []FamilyRelationship {
	// Collect all relationships where this UID is parent or child
	seen := make(map[string]bool)
	var tree []FamilyRelationship

	// Relationships where uid is the upstream party
	for _, rel := range k.GetChildren(ctx, uid) {
		key := rel.ParentUID + "/" + rel.ChildUID
		if !seen[key] {
			seen[key] = true
			tree = append(tree, rel)
		}
	}

	// Relationships where uid is the downstream party
	for _, rel := range k.GetParents(ctx, uid) {
		key := rel.ParentUID + "/" + rel.ChildUID
		if !seen[key] {
			seen[key] = true
			tree = append(tree, rel)
		}
	}

	return tree
}

// RippleMilestoneAttribution distributes OTK attribution up the family tree
// when a parenting or education milestone is verified. Verified relationships
// receive a share of the milestone's OTK reward.
//
// Attribution percentages:
//   - Direct parent/guardian: 50% of milestone nOTK
//   - Teacher/mentor: 30% of milestone eOTK
//   - Grandparent (parent's parent): 10% of milestone nOTK
//
// Only verified relationships participate in ripple attribution.
func (k Keeper) RippleMilestoneAttribution(ctx sdk.Context, childUID string, milestoneOTK int64) map[string]int64 {
	attribution := make(map[string]int64)

	// Get direct parents/guardians
	parents := k.GetParents(ctx, childUID)
	for _, rel := range parents {
		if !rel.Verified {
			continue
		}

		switch rel.Relationship {
		case RelParent, RelGuardian:
			// Direct parent/guardian gets 50%
			share := milestoneOTK * 50 / 100
			attribution[rel.ParentUID] += share

			// Grandparent ripple: 10% flows to parent's parents
			grandparents := k.GetParents(ctx, rel.ParentUID)
			for _, gp := range grandparents {
				if gp.Verified && (gp.Relationship == RelParent || gp.Relationship == RelGuardian) {
					gpShare := milestoneOTK * 10 / 100
					attribution[gp.ParentUID] += gpShare
				}
			}

		case RelTeacher, RelMentor:
			// Teacher/mentor gets 30%
			share := milestoneOTK * 30 / 100
			attribution[rel.ParentUID] += share
		}
	}

	// Emit ripple event
	if len(attribution) > 0 {
		ctx.EventManager().EmitEvent(sdk.NewEvent(
			"milestone_ripple_attribution",
			sdk.NewAttribute("child_uid", childUID),
			sdk.NewAttribute("milestone_otk", fmt.Sprintf("%d", milestoneOTK)),
			sdk.NewAttribute("recipients", fmt.Sprintf("%d", len(attribution))),
		))
	}

	return attribution
}
