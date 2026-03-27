// Package query defines the OTK module's query types.
//
// Queries:
//   - QueryLivingLedger: Get the Living Ledger for a Universal ID
//   - QueryChannelBalance: Get balance for a specific value channel
//   - QueryContributionScore: Get the contribution score for a UID
//   - QueryMilestones: List milestones achieved by a UID

package query

import (
	"openchain/x/otk/types"
)

// QueryLivingLedgerRequest queries the Living Ledger for a UID.
type QueryLivingLedgerRequest struct {
	UID string `json:"uid"`
}

type QueryLivingLedgerResponse struct {
	Ledger *types.LivingLedger `json:"ledger"`
}

// QueryChannelBalanceRequest queries a specific channel balance.
type QueryChannelBalanceRequest struct {
	Address string `json:"address"`
	Channel string `json:"channel"`
}

type QueryChannelBalanceResponse struct {
	Balance int64  `json:"balance"`
	Channel string `json:"channel"`
}

// QueryContributionScoreRequest queries the contribution score.
type QueryContributionScoreRequest struct {
	UID string `json:"uid"`
}

type QueryContributionScoreResponse struct {
	UID   string `json:"uid"`
	Score int64  `json:"score"`
	Rank  int64  `json:"rank"` // Global rank (0 = not ranked yet)
}

// QueryMilestonesRequest lists milestones for a UID.
type QueryMilestonesRequest struct {
	UID    string `json:"uid"`
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
}

type QueryMilestonesResponse struct {
	Milestones []types.Milestone `json:"milestones"`
	Total      int               `json:"total"`
}

// QueryGratitudeHistoryRequest lists gratitude transactions for a UID.
type QueryGratitudeHistoryRequest struct {
	UID   string `json:"uid"`
	Limit int    `json:"limit"`
}

type QueryGratitudeHistoryResponse struct {
	Entries []types.LedgerEntry `json:"entries"`
}
