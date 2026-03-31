// Package keeper — OTK Query Server.
//
// Handles all query requests from the wallet and REST API.
// Each query returns a structured JSON response.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// QueryServer handles OTK module queries.
type QueryServer struct {
	keeper *Keeper
}

// NewQueryServer creates a new query server.
func NewQueryServer(k *Keeper) QueryServer {
	return QueryServer{keeper: k}
}

// ─── Living Ledger ───

type LivingLedgerResponse struct {
	UID       string                 `json:"uid"`
	Ledger    map[string]interface{} `json:"ledger"`
	Score     int64                  `json:"contribution_score"`
	Rank      int64                  `json:"rank"`
	TotalUIDs int64                  `json:"total_uids"`
}

func (qs QueryServer) QueryLivingLedger(ctx sdk.Context, uid string) LivingLedgerResponse {
	ledger, _ := qs.keeper.GetLivingLedger(ctx, uid)
	score, _ := qs.keeper.GetContributionScore(ctx, uid)
	rank, totalUIDs, _ := qs.keeper.GetRank(ctx, uid)

	var ledgerMap map[string]interface{}
	if ledger != nil {
		bz, _ := json.Marshal(ledger)
		_ = json.Unmarshal(bz, &ledgerMap)
	}

	return LivingLedgerResponse{
		UID:       uid,
		Ledger:    ledgerMap,
		Score:     score,
		Rank:      rank,
		TotalUIDs: totalUIDs,
	}
}

// ─── Channel Balances ───

type ChannelBalancesResponse struct {
	UID      string            `json:"uid"`
	Balances map[string]string `json:"balances"`
	Total    string            `json:"total"`
}

func (qs QueryServer) QueryChannelBalances(ctx sdk.Context, addrStr string) (*ChannelBalancesResponse, error) {
	addr, err := sdk.AccAddressFromBech32(addrStr)
	if err != nil {
		return nil, fmt.Errorf("invalid address: %w", err)
	}

	channels := []string{"uotk", "unotk", "ueotk", "uhotk", "ucotk", "uxotk", "ugotk"}
	balances := make(map[string]string)
	for _, ch := range channels {
		bal := qs.keeper.GetChannelBalance(ctx, addr, ch)
		balances[ch] = bal.String()
	}

	total := qs.keeper.GetTotalValue(ctx, addr)

	return &ChannelBalancesResponse{
		UID:      addrStr,
		Balances: balances,
		Total:    total.String(),
	}, nil
}

// ─── Peace Index ───

type PeaceIndexResponse struct {
	Global    interface{}   `json:"global"`
	Regions   []interface{} `json:"regions"`
}

func (qs QueryServer) QueryPeaceIndex(ctx sdk.Context) PeaceIndexResponse {
	global := qs.keeper.GetGlobalPeaceIndex(ctx)
	regions := qs.keeper.GetAllRegionalPeaceIndices(ctx)

	var regionInterfaces []interface{}
	for _, r := range regions {
		regionInterfaces = append(regionInterfaces, r)
	}

	return PeaceIndexResponse{
		Global:  global,
		Regions: regionInterfaces,
	}
}

// ─── Community Overview ───

type CommunityOverviewResponse struct {
	TotalOTKMinted   string `json:"total_otk_minted"`
	TreasuryBalance  string `json:"treasury_balance"`
	ActiveVerifiers  int    `json:"active_verifiers"`
	PendingMilestones int   `json:"pending_milestones"`
	PeaceIndex       interface{} `json:"peace_index"`
}

func (qs QueryServer) QueryCommunityOverview(ctx sdk.Context) CommunityOverviewResponse {
	treasury := qs.keeper.GetTreasury(ctx)
	verifiers, _ := qs.keeper.GetActiveVerifiers(ctx, "")
	milestones, _ := qs.keeper.GetPendingMilestones(ctx)
	peaceIndex := qs.keeper.GetGlobalPeaceIndex(ctx)

	return CommunityOverviewResponse{
		TotalOTKMinted:    fmt.Sprintf("%d", treasury.TotalCollected),
		TreasuryBalance:   fmt.Sprintf("%d", treasury.TotalBalance),
		ActiveVerifiers:   len(verifiers),
		PendingMilestones: len(milestones),
		PeaceIndex:        peaceIndex,
	}
}

// ─── Dispatch Query ───

func (qs QueryServer) DispatchQuery(ctx sdk.Context, queryType string, params map[string]string) (interface{}, error) {
	switch queryType {
	case "living_ledger":
		uid := params["uid"]
		if uid == "" {
			return nil, fmt.Errorf("uid required")
		}
		return qs.QueryLivingLedger(ctx, uid), nil

	case "channel_balances":
		addr := params["address"]
		if addr == "" {
			return nil, fmt.Errorf("address required")
		}
		return qs.QueryChannelBalances(ctx, addr)

	case "peace_index":
		return qs.QueryPeaceIndex(ctx), nil

	case "community_overview":
		return qs.QueryCommunityOverview(ctx), nil

	default:
		return nil, fmt.Errorf("unknown query type: %s", queryType)
	}
}
