// Package keeper implements the Achievement module's state management.
//
// The keeper handles:
// - Minting soulbound achievement NFTs when milestones are verified
// - Querying achievements by UID, channel, or ID
// - Achievement counts and statistics
//
// Achievements are NON-TRANSFERABLE (soulbound). No transfer function exists.
// This is intentional — achievements represent personal human development
// and cannot be bought, sold, or traded.

package keeper

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/achievement/types"
)

// Store key prefixes for achievement data.
var (
	achievementPrefix      = []byte("ach/")  // ach/{id} -> Achievement
	uidAchievementPrefix   = []byte("uach/") // uach/{uid}/{id} -> achievement ID
	uidCountPrefix         = []byte("acnt/") // acnt/{uid} -> count
	channelAchievementPrefix = []byte("cach/") // cach/{uid}/{channel}/{id} -> achievement ID
)

// Keeper manages the Achievement module state.
type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
}

// NewKeeper creates a new Achievement keeper.
func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey) *Keeper {
	return &Keeper{
		cdc:      cdc,
		storeKey: storeKey,
	}
}

// MintAchievement stores a new soulbound achievement and emits an event.
// This is called when a milestone is verified and OTK is minted.
func (k Keeper) MintAchievement(ctx sdk.Context, achievement types.Achievement) error {
	store := ctx.KVStore(k.storeKey)

	// Generate deterministic ID if not set
	if achievement.ID == "" {
		hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%d", achievement.UID, achievement.MilestoneID, achievement.MintedAt)))
		achievement.ID = fmt.Sprintf("ach_%x", hash[:16])
	}

	// Set minted block height
	if achievement.MintedAt == 0 {
		achievement.MintedAt = ctx.BlockHeight()
	}

	// Marshal and store the achievement
	bz, err := json.Marshal(achievement)
	if err != nil {
		return fmt.Errorf("failed to marshal achievement: %w", err)
	}

	// Store by ID
	store.Set(achievementKey(achievement.ID), bz)

	// Index by UID
	store.Set(uidAchievementKey(achievement.UID, achievement.ID), []byte(achievement.ID))

	// Index by UID + channel
	store.Set(channelAchievementKey(achievement.UID, achievement.Channel, achievement.ID), []byte(achievement.ID))

	// Increment count
	count := k.GetAchievementCount(ctx, achievement.UID)
	store.Set(uidCountKey(achievement.UID), int64ToBytes(count+1))

	// Emit event
	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"achievement_minted",
		sdk.NewAttribute("achievement_id", achievement.ID),
		sdk.NewAttribute("uid", achievement.UID),
		sdk.NewAttribute("milestone_id", achievement.MilestoneID),
		sdk.NewAttribute("channel", achievement.Channel),
		sdk.NewAttribute("title", achievement.Title),
		sdk.NewAttribute("level", fmt.Sprintf("%d", achievement.Level)),
		sdk.NewAttribute("level_name", types.LevelNames[achievement.Level]),
		sdk.NewAttribute("soulbound", "true"),
	))

	return nil
}

// GetAchievement retrieves a single achievement by ID.
func (k Keeper) GetAchievement(ctx sdk.Context, id string) (*types.Achievement, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(achievementKey(id))
	if bz == nil {
		return nil, fmt.Errorf("achievement %s not found", id)
	}

	var ach types.Achievement
	if err := json.Unmarshal(bz, &ach); err != nil {
		return nil, fmt.Errorf("failed to unmarshal achievement %s: %w", id, err)
	}
	return &ach, nil
}

// GetAchievements retrieves all achievements for a UID.
func (k Keeper) GetAchievements(ctx sdk.Context, uid string) ([]types.Achievement, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := append(uidAchievementPrefix, []byte(uid+"/")...)

	var achievements []types.Achievement
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		achID := string(iter.Value())
		ach, err := k.GetAchievement(ctx, achID)
		if err != nil {
			continue // skip corrupted entries
		}
		achievements = append(achievements, *ach)
	}

	return achievements, nil
}

// GetAchievementCount returns the total number of achievements for a UID.
func (k Keeper) GetAchievementCount(ctx sdk.Context, uid string) int64 {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(uidCountKey(uid))
	if bz == nil {
		return 0
	}
	return bytesToInt64(bz)
}

// GetAchievementsByChannel retrieves all achievements for a UID in a specific channel.
func (k Keeper) GetAchievementsByChannel(ctx sdk.Context, uid string, channel string) ([]types.Achievement, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := append(channelAchievementPrefix, []byte(uid+"/"+channel+"/")...)

	var achievements []types.Achievement
	iter := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		achID := string(iter.Value())
		ach, err := k.GetAchievement(ctx, achID)
		if err != nil {
			continue
		}
		achievements = append(achievements, *ach)
	}

	return achievements, nil
}

// AchievementStats holds aggregate statistics for a UID's achievements.
type AchievementStats struct {
	UID            string         `json:"uid"`
	TotalCount     int64          `json:"total_count"`
	ByChannel      map[string]int `json:"by_channel"`
	ByLevel        map[int]int    `json:"by_level"`
	HighestLevel   int            `json:"highest_level"`
	LatestMintedAt int64          `json:"latest_minted_at"`
}

// GetAchievementStats returns aggregate achievement statistics for a UID.
func (k Keeper) GetAchievementStats(ctx sdk.Context, uid string) (*AchievementStats, error) {
	achievements, err := k.GetAchievements(ctx, uid)
	if err != nil {
		return nil, err
	}

	stats := &AchievementStats{
		UID:        uid,
		TotalCount: k.GetAchievementCount(ctx, uid),
		ByChannel:  make(map[string]int),
		ByLevel:    make(map[int]int),
	}

	for _, ach := range achievements {
		stats.ByChannel[ach.Channel]++
		stats.ByLevel[ach.Level]++
		if ach.Level > stats.HighestLevel {
			stats.HighestLevel = ach.Level
		}
		if ach.MintedAt > stats.LatestMintedAt {
			stats.LatestMintedAt = ach.MintedAt
		}
	}

	return stats, nil
}

// --- Key construction helpers ---

func achievementKey(id string) []byte {
	return append(achievementPrefix, []byte(id)...)
}

func uidAchievementKey(uid, id string) []byte {
	return append(uidAchievementPrefix, []byte(uid+"/"+id)...)
}

func uidCountKey(uid string) []byte {
	return append(uidCountPrefix, []byte(uid)...)
}

func channelAchievementKey(uid, channel, id string) []byte {
	return append(channelAchievementPrefix, []byte(uid+"/"+channel+"/"+id)...)
}

// --- Byte conversion helpers ---

func int64ToBytes(n int64) []byte {
	bz := make([]byte, 8)
	bz[0] = byte(n >> 56)
	bz[1] = byte(n >> 48)
	bz[2] = byte(n >> 40)
	bz[3] = byte(n >> 32)
	bz[4] = byte(n >> 24)
	bz[5] = byte(n >> 16)
	bz[6] = byte(n >> 8)
	bz[7] = byte(n)
	return bz
}

func bytesToInt64(bz []byte) int64 {
	if len(bz) < 8 {
		return 0
	}
	return int64(bz[0])<<56 | int64(bz[1])<<48 | int64(bz[2])<<40 | int64(bz[3])<<32 |
		int64(bz[4])<<24 | int64(bz[5])<<16 | int64(bz[6])<<8 | int64(bz[7])
}
