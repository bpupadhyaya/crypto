// Package types defines the types for the Achievement module.
//
// Achievements are non-transferable (soulbound) tokens representing verified
// human development milestones on Open Chain. When a milestone is verified and
// OTK is minted, the achiever also receives a permanent achievement NFT.

package types

import "fmt"

const (
	ModuleName = "achievement"
	StoreKey   = ModuleName
)

// Achievement is a non-transferable (soulbound) token representing a verified milestone.
type Achievement struct {
	ID          string            `json:"id"`           // Unique achievement ID
	UID         string            `json:"uid"`          // Owner's Universal ID
	MilestoneID string            `json:"milestone_id"` // Reference to the verified milestone
	Channel     string            `json:"channel"`      // nurture, education, health, etc.
	Title       string            `json:"title"`        // Human-readable title
	Description string            `json:"description"`  // What was achieved
	Level       int               `json:"level"`        // 1=bronze, 2=silver, 3=gold, 4=platinum, 5=diamond
	MintedAt    int64             `json:"minted_at"`    // Block height
	ImageURI    string            `json:"image_uri"`    // URI to achievement image/badge
	Metadata    map[string]string `json:"metadata"`     // Additional data
}

// GetAchievementLevel determines the level based on OTK mint amount.
// Higher value milestones produce rarer achievements.
func GetAchievementLevel(channel string, mintAmount int64) int {
	// Based on OTK minted (in micro-OTK): higher value = rarer achievement
	if mintAmount >= 10000000000 { // >= 10,000 OTK
		return 5 // diamond
	}
	if mintAmount >= 1000000000 { // >= 1,000 OTK
		return 4 // platinum
	}
	if mintAmount >= 100000000 { // >= 100 OTK
		return 3 // gold
	}
	if mintAmount >= 10000000 { // >= 10 OTK
		return 2 // silver
	}
	return 1 // bronze: < 10 OTK
}

// LevelNames maps achievement level to human-readable name.
var LevelNames = map[int]string{
	1: "Bronze",
	2: "Silver",
	3: "Gold",
	4: "Platinum",
	5: "Diamond",
}

// LevelColors maps achievement level to display color (hex).
var LevelColors = map[int]string{
	1: "#cd7f32",
	2: "#c0c0c0",
	3: "#ffd700",
	4: "#e5e4e2",
	5: "#b9f2ff",
}

// GenesisState defines the achievement module's genesis state.
type GenesisState struct {
	Achievements []Achievement `json:"achievements"`
}

// Proto.Message interface methods for GenesisState.
func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("GenesisState{achievements: %d}", len(g.Achievements)) }

// DefaultGenesisState returns the default genesis state — empty.
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Achievements: []Achievement{},
	}
}
