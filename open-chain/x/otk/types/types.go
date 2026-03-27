// Package types defines the types for the OTK (Open Token) module.
//
// OTK is a multi-channel token representing different dimensions of human value:
//   - xOTK: Economic value (traditional crypto transactions)
//   - nOTK: Nurture value (parenting, caregiving, emotional support)
//   - eOTK: Education value (teaching, mentoring, knowledge transfer)
//   - hOTK: Health value (healthcare, wellness, nutrition)
//   - cOTK: Community value (service, volunteer work, social cohesion)
//   - gOTK: Governance value (civic participation, voting, policy)

package types

import (
	"fmt"

	"cosmossdk.io/math"
)

const (
	ModuleName = "otk"
	StoreKey   = ModuleName
	RouterKey  = ModuleName

	// Token denom — the base unit
	BaseDenom = "uotk" // 1 OTK = 1,000,000 uotk (micro-OTK)
)

// Value Channel identifiers (human-readable names)
const (
	ChannelEconomic  = "economic"   // Economic value transfer
	ChannelNurture   = "nurture"    // Parenting, caregiving
	ChannelEducation = "education"  // Teaching, mentoring
	ChannelHealth    = "health"     // Healthcare, wellness
	ChannelCommunity = "community"  // Community service
	ChannelGovern    = "governance" // Governance, civic participation
)

// Channel-specific denoms (micro-units)
const (
	DenomEconomic  = "uxotk" // Economic channel denom
	DenomNurture   = "unotk" // Nurture channel denom
	DenomEducation = "ueotk" // Education channel denom
	DenomHealth    = "uhotk" // Health channel denom
	DenomCommunity = "ucotk" // Community channel denom
	DenomGovern    = "ugotk" // Governance channel denom
)

// ChannelToDenom maps human-readable channel names to on-chain denoms.
var ChannelToDenom = map[string]string{
	ChannelEconomic:  DenomEconomic,
	ChannelNurture:   DenomNurture,
	ChannelEducation: DenomEducation,
	ChannelHealth:    DenomHealth,
	ChannelCommunity: DenomCommunity,
	ChannelGovern:    DenomGovern,
}

// DenomToChannel maps on-chain denoms back to channel names.
var DenomToChannel = map[string]string{
	DenomEconomic:  ChannelEconomic,
	DenomNurture:   ChannelNurture,
	DenomEducation: ChannelEducation,
	DenomHealth:    ChannelHealth,
	DenomCommunity: ChannelCommunity,
	DenomGovern:    ChannelGovern,
}

// AllChannels returns all value channel identifiers.
func AllChannels() []string {
	return []string{
		ChannelEconomic,
		ChannelNurture,
		ChannelEducation,
		ChannelHealth,
		ChannelCommunity,
		ChannelGovern,
	}
}

// AllDenoms returns all channel-specific denoms.
func AllDenoms() []string {
	return []string{
		DenomEconomic,
		DenomNurture,
		DenomEducation,
		DenomHealth,
		DenomCommunity,
		DenomGovern,
	}
}

// ChannelDenom returns the on-chain denom for a channel name.
// Returns empty string if the channel is unknown.
func ChannelDenom(channel string) string {
	return ChannelToDenom[channel]
}

// ContributionRing represents the concentric levels of human value attribution.
type ContributionRing int

const (
	RingSelf      ContributionRing = 1 // Personal growth
	RingFamily    ContributionRing = 2 // Parents, siblings, guardians
	RingMentors   ContributionRing = 3 // Teachers, mentors
	RingCommunity ContributionRing = 4 // Neighborhood, organizations
	RingCity      ContributionRing = 5 // City, region
	RingCountry   ContributionRing = 6 // National level
	RingHumanity  ContributionRing = 7 // Global
)

// RippleAttribution calculates OTK attribution based on contribution ring distance.
// Formula: attribution = base_value / (ring_distance ^ 2)
// Parents (ring 2) get ~25x more attribution than national policy (ring 6).
func RippleAttribution(baseValue math.Int, ring ContributionRing) math.Int {
	if ring <= 0 {
		return math.ZeroInt()
	}
	divisor := int64(ring * ring)
	return baseValue.Quo(math.NewInt(divisor))
}

// ValueTransfer represents a transfer of value between two Universal IDs.
type ValueTransfer struct {
	FromUID   string           `json:"from_uid"`
	ToUID     string           `json:"to_uid"`
	Channel   string           `json:"channel"` // e.g., "notk", "eotk"
	Amount    math.Int         `json:"amount"`
	Ring      ContributionRing `json:"ring"`
	IsGratitude bool           `json:"is_gratitude"` // Gratitude transaction (child → parent)
	Positive  bool             `json:"positive"`      // true = positive value, false = negative
	Memo      string           `json:"memo"`
	Timestamp int64            `json:"timestamp"`
}

// Milestone represents a verifiable human development achievement.
type Milestone struct {
	ID          string           `json:"id"`
	UID         string           `json:"uid"`          // Universal ID of the person
	Channel     string           `json:"channel"`      // Which value channel
	Description string           `json:"description"`
	MintAmount  math.Int         `json:"mint_amount"`  // OTK to mint
	Verifiers   []string         `json:"verifiers"`    // UIDs of verifiers
	Verified    bool             `json:"verified"`
	Timestamp   int64            `json:"timestamp"`
}

// GenesisState defines the OTK module's genesis state.
type GenesisState struct {
	// No pre-mine. Genesis state is empty.
	// All OTK is minted through verified contributions.
}

// Proto.Message interface methods for GenesisState.
func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("GenesisState{}") }

// DefaultGenesisState returns the default genesis state — empty, as per the Human Constitution.
func DefaultGenesisState() *GenesisState {
	return &GenesisState{}
}
