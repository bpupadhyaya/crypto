// Living Ledger — A continuous, lifelong on-chain record of value received and given.
//
// Every Universal ID has a Living Ledger organized by Value Channels.
// Value flows in both directions — received and given — creating a complete
// picture of each person's relationship with humanity.
//
// "The Living Ledger begins at Universal ID registration and continues indefinitely."
// — Human Constitution, Article IV, Section 1

package types

// LivingLedger represents the complete value record for a Universal ID.
type LivingLedger struct {
	UID string `json:"uid"`

	// Channel-specific totals
	Channels map[string]*ChannelLedger `json:"channels"`

	// Aggregate totals
	TotalReceived int64 `json:"total_received"` // All value received across all channels
	TotalGiven    int64 `json:"total_given"`    // All value given across all channels
	NetValue      int64 `json:"net_value"`      // TotalReceived - TotalGiven

	// Gratitude tracking
	GratitudeReceived int64 `json:"gratitude_received"` // Total gratitude received
	GratitudeGiven    int64 `json:"gratitude_given"`    // Total gratitude given

	// Ring attribution totals
	RingAttributions map[int]int64 `json:"ring_attributions"` // ring → total attributed

	// Milestone count
	MilestonesAchieved int `json:"milestones_achieved"`
}

// ChannelLedger tracks value for a specific channel (e.g., nOTK, eOTK).
type ChannelLedger struct {
	Channel  string `json:"channel"`
	Received int64  `json:"received"` // Value received in this channel
	Given    int64  `json:"given"`    // Value given in this channel
	Minted   int64  `json:"minted"`  // Value minted (from milestones) in this channel
	Burned   int64  `json:"burned"`  // Value burned (corrections) in this channel
}

// LedgerEntry represents a single entry in the Living Ledger.
type LedgerEntry struct {
	Timestamp   int64            `json:"timestamp"`
	Channel     string           `json:"channel"`
	FromUID     string           `json:"from_uid"`
	ToUID       string           `json:"to_uid"`
	Amount      int64            `json:"amount"`
	Ring        ContributionRing `json:"ring"`
	EntryType   LedgerEntryType  `json:"entry_type"`
	IsGratitude bool             `json:"is_gratitude"`
	MilestoneID string           `json:"milestone_id,omitempty"`
	TxHash      string           `json:"tx_hash"`
}

type LedgerEntryType string

const (
	EntryReceived  LedgerEntryType = "received"
	EntryGiven     LedgerEntryType = "given"
	EntryMinted    LedgerEntryType = "minted"
	EntryBurned    LedgerEntryType = "burned"
	EntryGratitude LedgerEntryType = "gratitude"
)

// NewLivingLedger creates an empty Living Ledger for a new Universal ID.
func NewLivingLedger(uid string) *LivingLedger {
	channels := make(map[string]*ChannelLedger)
	for _, ch := range AllChannels() {
		channels[ch] = &ChannelLedger{Channel: ch}
	}
	return &LivingLedger{
		UID:              uid,
		Channels:         channels,
		RingAttributions: make(map[int]int64),
	}
}

// RecordReceived records value received by this UID.
func (l *LivingLedger) RecordReceived(channel string, amount int64, ring ContributionRing) {
	l.TotalReceived += amount
	l.NetValue += amount
	if ch, ok := l.Channels[channel]; ok {
		ch.Received += amount
	}
	l.RingAttributions[int(ring)] += amount
}

// RecordGiven records value given by this UID.
func (l *LivingLedger) RecordGiven(channel string, amount int64) {
	l.TotalGiven += amount
	l.NetValue -= amount
	if ch, ok := l.Channels[channel]; ok {
		ch.Given += amount
	}
}

// RecordMinted records OTK minted for a milestone.
func (l *LivingLedger) RecordMinted(channel string, amount int64) {
	l.TotalReceived += amount
	l.NetValue += amount
	l.MilestonesAchieved++
	if ch, ok := l.Channels[channel]; ok {
		ch.Minted += amount
		ch.Received += amount
	}
}

// RecordGratitude records a gratitude transaction.
func (l *LivingLedger) RecordGratitude(amount int64, received bool) {
	if received {
		l.GratitudeReceived += amount
	} else {
		l.GratitudeGiven += amount
	}
}

// GetContributionScore returns a composite score representing this person's
// overall contribution to humanity. Higher is better.
func (l *LivingLedger) GetContributionScore() int64 {
	// Weighted: giving is worth more than receiving
	// Gratitude received is a strong signal
	// Milestones achieved add a fixed bonus
	score := l.TotalGiven*2 + l.GratitudeReceived*3 + int64(l.MilestonesAchieved)*100
	return score
}
