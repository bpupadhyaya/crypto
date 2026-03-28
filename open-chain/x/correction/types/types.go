// Package types defines the types for the Correction module.
//
// The Correction module implements Article V of The Human Constitution:
// negative OTK (-OTK) represents harm done. -OTK is applied when verified
// negative outcomes occur, using ring-based attribution with community
// consensus (minimum 3 verifiers). The accused has the right to contest,
// provide counter-evidence, and resolve through governance. Wrong
// determinations can be reversed.

package types

import "fmt"

const (
	ModuleName = "correction"
	StoreKey   = ModuleName

	// MinVerifiers is the minimum number of verifiers who must agree
	// before -OTK can be applied. This is intentionally higher than
	// the threshold for positive milestones (Article V requirement).
	MinVerifiers = 3
)

// Status constants for correction reports.
const (
	StatusReported    = "reported"
	StatusUnderReview = "under_review"
	StatusContested   = "contested"
	StatusConfirmed   = "confirmed"
	StatusReversed    = "reversed"
)

// CorrectionReport represents a community-submitted report of harm
// that may result in -OTK being applied to the target's Living Ledger.
type CorrectionReport struct {
	ID              string         `json:"id"`
	ReporterUID     string         `json:"reporter_uid"`
	TargetUID       string         `json:"target_uid"`
	Channel         string         `json:"channel"`      // nurture, education, health, community, etc.
	Description     string         `json:"description"`
	Evidence        string         `json:"evidence"`      // hash of evidence
	Amount          int64          `json:"amount"`         // proposed -OTK amount
	Status          string         `json:"status"`         // reported, under_review, contested, confirmed, reversed
	Verifications   []Verification `json:"verifications"`
	ContestEvidence string         `json:"contest_evidence"` // target's counter-evidence
	CreatedAt       int64          `json:"created_at"`
	ResolvedAt      int64          `json:"resolved_at"`
}

// Verification is a single verifier's assessment of a correction report.
type Verification struct {
	VerifierUID string `json:"verifier_uid"`
	Approved    bool   `json:"approved"`
	BlockHeight int64  `json:"block_height"`
}

// ApprovalCount returns the number of verifiers who approved the report.
func (r *CorrectionReport) ApprovalCount() int {
	count := 0
	for _, v := range r.Verifications {
		if v.Approved {
			count++
		}
	}
	return count
}

// DenialCount returns the number of verifiers who denied the report.
func (r *CorrectionReport) DenialCount() int {
	count := 0
	for _, v := range r.Verifications {
		if !v.Approved {
			count++
		}
	}
	return count
}

// HasVerifierVoted checks whether a given verifier has already voted.
func (r *CorrectionReport) HasVerifierVoted(verifierUID string) bool {
	for _, v := range r.Verifications {
		if v.VerifierUID == verifierUID {
			return true
		}
	}
	return false
}

// GenesisState defines the correction module's genesis state.
type GenesisState struct {
	Reports []CorrectionReport `json:"reports"`
}

// Proto.Message interface methods for GenesisState.
func (g *GenesisState) ProtoMessage()  {}
func (g *GenesisState) Reset()         { *g = GenesisState{} }
func (g *GenesisState) String() string { return fmt.Sprintf("GenesisState{reports: %d}", len(g.Reports)) }

// DefaultGenesisState returns the default genesis state — empty.
func DefaultGenesisState() *GenesisState {
	return &GenesisState{
		Reports: []CorrectionReport{},
	}
}
