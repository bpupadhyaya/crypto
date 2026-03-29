// Package api implements REST query handlers for Open Chain custom modules.
//
// These handlers are designed to be registered on the Cosmos SDK REST server
// (port 1317) or any standard net/http ServeMux. They read from keeper state
// via an sdk.Context and return JSON responses.
//
// The wallet screens (Open Wallet) query these endpoints to display:
// - Living Ledger data, contribution scores, top contributors
// - Universal ID info, selective disclosures
// - Governance proposals, votes, tallies
// - Soulbound achievements and stats

package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	sdk "github.com/cosmos/cosmos-sdk/types"

	achievementkeeper "openchain/x/achievement/keeper"
	achievementtypes "openchain/x/achievement/types"
	govuidkeeper "openchain/x/govuid/keeper"
	correctionkeeper "openchain/x/correction/keeper"
	daokeeper "openchain/x/dao/keeper"
	dexkeeper "openchain/x/dex/keeper"
	farmingkeeper "openchain/x/farming/keeper"
	lendingkeeper "openchain/x/lending/keeper"
	messagingkeeper "openchain/x/messaging/keeper"
	otkkeeper "openchain/x/otk/keeper"
	tokenfactorykeeper "openchain/x/tokenfactory/keeper"
	uidkeeper "openchain/x/uid/keeper"
)

// Keepers holds references to all custom module keepers needed by REST handlers.
type Keepers struct {
	OTK          *otkkeeper.Keeper
	UID          *uidkeeper.Keeper
	GovUID       *govuidkeeper.Keeper
	Achievement  *achievementkeeper.Keeper
	TokenFactory *tokenfactorykeeper.Keeper
	Messaging    *messagingkeeper.Keeper
	DEX          *dexkeeper.Keeper
	Lending      *lendingkeeper.Keeper
	Farming      *farmingkeeper.Keeper
	Correction   *correctionkeeper.Keeper
	DAO          *daokeeper.Keeper
}

// ContextProvider returns the latest committed sdk.Context for read queries.
// In a live chain, this is typically app.NewContext(true, tmproto.Header{}).
type ContextProvider func() sdk.Context

// RegisterRoutes registers all custom module REST query handlers on the given ServeMux.
// The ctxProvider supplies a read-only sdk.Context for each request.
func RegisterRoutes(mux *http.ServeMux, keepers Keepers, ctxProvider ContextProvider) {
	// ─── OTK Module ───
	mux.HandleFunc("/openchain/otk/v1/living_ledger/", handleLivingLedger(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/contribution_score/", handleContributionScore(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/top_contributors", handleTopContributors(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/pending_milestones", handlePendingMilestones(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/verifier/", handleVerifier(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/channel_balance/", handleChannelBalance(keepers.OTK, ctxProvider))

	// ─── UID Module ───
	mux.HandleFunc("/openchain/uid/v1/uid/", handleUID(keepers.UID, ctxProvider))
	mux.HandleFunc("/openchain/uid/v1/disclosure/", handleDisclosure(keepers.UID, ctxProvider))

	// ─── GovUID Module ───
	mux.HandleFunc("/openchain/govuid/v1/proposals", handleProposals(keepers.GovUID, ctxProvider))
	mux.HandleFunc("/openchain/govuid/v1/proposal/", handleProposal(keepers.GovUID, ctxProvider))
	mux.HandleFunc("/openchain/govuid/v1/votes/", handleVotes(keepers.GovUID, ctxProvider))

	// ─── Achievement Module ───
	mux.HandleFunc("/openchain/achievement/v1/achievements/", handleAchievements(keepers.Achievement, ctxProvider))
	mux.HandleFunc("/openchain/achievement/v1/achievement/", handleAchievement(keepers.Achievement, ctxProvider))
	mux.HandleFunc("/openchain/achievement/v1/stats/", handleAchievementStats(keepers.Achievement, ctxProvider))

	// ─── Token Factory Module ───
	if keepers.TokenFactory != nil {
		mux.HandleFunc("/openchain/tokenfactory/v1/token/", handleToken(keepers.TokenFactory, ctxProvider))
		mux.HandleFunc("/openchain/tokenfactory/v1/tokens/", handleTokensByCreator(keepers.TokenFactory, ctxProvider))
		mux.HandleFunc("/openchain/tokenfactory/v1/tokens", handleAllTokens(keepers.TokenFactory, ctxProvider))
	}

	// ─── Messaging Module ───
	if keepers.Messaging != nil {
		mux.HandleFunc("/openchain/messaging/v1/messages/", handleMessages(keepers.Messaging, ctxProvider))
		mux.HandleFunc("/openchain/messaging/v1/conversations/", handleConversations(keepers.Messaging, ctxProvider))
	}

	// ─── DEX Module ───
	if keepers.DEX != nil {
		mux.HandleFunc("/openchain/dex/v1/pools", handleDEXPools(keepers.DEX, ctxProvider))
		mux.HandleFunc("/openchain/dex/v1/orders/", handleDEXOrders(keepers.DEX, ctxProvider))
	}

	// ─── Lending Module ───
	if keepers.Lending != nil {
		mux.HandleFunc("/openchain/lending/v1/markets", handleLendingMarkets(keepers.Lending, ctxProvider))
		mux.HandleFunc("/openchain/lending/v1/position/", handleLendingPosition(keepers.Lending, ctxProvider))
		mux.HandleFunc("/openchain/lending/v1/insurance", handleInsuranceFund(keepers.Lending, ctxProvider))
	}

	// ─── Farming Module ───
	if keepers.Farming != nil {
		mux.HandleFunc("/openchain/farming/v1/farms", handleFarms(keepers.Farming, ctxProvider))
	}

	// ─── Correction Module ───
	if keepers.Correction != nil {
		mux.HandleFunc("/openchain/correction/v1/reports/target/", handleCorrectionReportsByTarget(keepers.Correction, ctxProvider))
		mux.HandleFunc("/openchain/correction/v1/reports/pending", handlePendingCorrectionReports(keepers.Correction, ctxProvider))
	}

	// ─── DAO Module ───
	if keepers.DAO != nil {
		mux.HandleFunc("/openchain/dao/v1/daos/", handleDAOsByMember(keepers.DAO, ctxProvider))
		mux.HandleFunc("/openchain/dao/v1/dao/", handleDAO(keepers.DAO, ctxProvider))
	}

	// ─── Regional Aggregates ───
	mux.HandleFunc("/openchain/otk/v1/regions", handleRegionalAggregates(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/region/", handleRegionalAggregate(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/alerts", handleAlertRegions(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/treasury", handleTreasury(keepers.OTK, ctxProvider))

	// ─── Amendments ───
	mux.HandleFunc("/openchain/govuid/v1/amendments", handleAmendments(keepers.GovUID, ctxProvider))

	// ─── Value Channel Profiles ───
	mux.HandleFunc("/openchain/otk/v1/volunteer/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/volunteer/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetVolunteerProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})
	mux.HandleFunc("/openchain/otk/v1/wellness/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/wellness/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetWellnessProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})
	mux.HandleFunc("/openchain/otk/v1/civic/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/civic/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetCivicProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})
	mux.HandleFunc("/openchain/otk/v1/economic/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/economic/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetEconomicProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})
	mux.HandleFunc("/openchain/otk/v1/teacher_impact/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/teacher_impact/")
		ctx := ctxProvider()
		impact := keepers.OTK.GetTeacherImpact(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(impact)
	})

	// ─── Price Oracle ───
	mux.HandleFunc("/openchain/otk/v1/prices", handlePrices(keepers.OTK, ctxProvider))
	mux.HandleFunc("/openchain/otk/v1/price/", handlePrice(keepers.OTK, ctxProvider))

	// ─── Chain Params ───
	mux.HandleFunc("/openchain/govuid/v1/params", handleChainParams(keepers.GovUID, ctxProvider))

	// ─── Environmental Impact ───
	mux.HandleFunc("/openchain/otk/v1/environmental/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/environmental/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetEnvironmentalProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})
	mux.HandleFunc("/openchain/otk/v1/eco_region/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/eco_region/")
		ctx := ctxProvider()
		health := keepers.OTK.GetRegionalEnvironmentalHealth(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health)
	})

	// ─── Water & Sanitation ───
	mux.HandleFunc("/openchain/otk/v1/water_score/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/water_score/")
		ctx := ctxProvider()
		score := keepers.OTK.GetRegionalWaterScore(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(score)
	})

	// ─── Housing Security ───
	mux.HandleFunc("/openchain/otk/v1/housing_score/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/housing_score/")
		ctx := ctxProvider()
		score := keepers.OTK.GetRegionalHousingScore(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(score)
	})

	// ─── Lending Liquidation History ───
	if keepers.Lending != nil {
		mux.HandleFunc("/openchain/lending/v1/liquidations", func(w http.ResponseWriter, r *http.Request) {
			ctx := ctxProvider()
			events := keepers.Lending.GetLiquidationHistory(ctx, 50)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(events)
		})
	}

	// ─── Caregiver Profile ───
	mux.HandleFunc("/openchain/otk/v1/caregiver/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/caregiver/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetCaregiverProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})

	// ─── Parent Profile ───
	mux.HandleFunc("/openchain/otk/v1/parent/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/parent/")
		ctx := ctxProvider()
		profile := keepers.OTK.GetParentProfile(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(profile)
	})

	// ─── Peace Index ───
	mux.HandleFunc("/openchain/otk/v1/peace_index/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/peace_index/")
		ctx := ctxProvider()
		idx := keepers.OTK.GetGlobalPeaceIndex(ctx)
		if region != "" && region != "global" {
			regIdx := keepers.OTK.GetRegionalEnvironmentalHealth(ctx, region)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(regIdx)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(idx)
	})

	// ─── Employment / Job Board ───
	mux.HandleFunc("/openchain/otk/v1/jobs", func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		region := r.URL.Query().Get("region")
		jobs := keepers.OTK.GetOpenJobs(ctx, region, 50)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(jobs)
	})
	mux.HandleFunc("/openchain/otk/v1/employment_stats/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/employment_stats/")
		ctx := ctxProvider()
		stats := keepers.OTK.GetEmploymentStats(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	})

	// ─── Marketplace ───
	mux.HandleFunc("/openchain/otk/v1/market", func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		category := r.URL.Query().Get("category")
		listings := keepers.OTK.GetMarketListings(ctx, category, 50)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(listings)
	})
	mux.HandleFunc("/openchain/otk/v1/market_stats/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/market_stats/")
		ctx := ctxProvider()
		stats := keepers.OTK.GetMarketStats(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	})

	// ─── Insurance Pools ───
	mux.HandleFunc("/openchain/otk/v1/insurance_pools", func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		poolType := r.URL.Query().Get("type")
		pools := keepers.OTK.GetInsurancePools(ctx, poolType)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pools)
	})

	// ─── Research Projects ───
	mux.HandleFunc("/openchain/otk/v1/research", func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		category := r.URL.Query().Get("category")
		projects := keepers.OTK.GetResearchProjects(ctx, category, 50)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(projects)
	})

	// ─── Community Events ───
	mux.HandleFunc("/openchain/otk/v1/events", func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		category := r.URL.Query().Get("category")
		events := keepers.OTK.GetUpcomingEvents(ctx, category, 50)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(events)
	})

	// ─── Wellness Streaks ───
	mux.HandleFunc("/openchain/otk/v1/wellness_streak/", func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/wellness_streak/")
		ctx := ctxProvider()
		streak := keepers.OTK.GetWellnessStreak(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(streak)
	})

	// ─── Climate Carbon ───
	mux.HandleFunc("/openchain/otk/v1/carbon/", func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/carbon/")
		ctx := ctxProvider()
		carbon := keepers.OTK.GetCommunityCarbon(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(carbon)
	})

	// ─── DAO Treasury ───
	if keepers.DAO != nil {
		mux.HandleFunc("/openchain/dao/v1/treasury/", func(w http.ResponseWriter, r *http.Request) {
			daoID := strings.TrimPrefix(r.URL.Path, "/openchain/dao/v1/treasury/")
			ctx := ctxProvider()
			treasury := keepers.DAO.GetDAOTreasury(ctx, daoID)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(treasury)
		})
	}
}

// ─── Token Factory Handlers ───

func handleToken(k *tokenfactorykeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		denom := strings.TrimPrefix(r.URL.Path, "/openchain/tokenfactory/v1/token/")
		if denom == "" { http.Error(w, "denom required", 400); return }
		ctx := ctxProvider()
		token, err := k.GetToken(ctx, denom)
		if err != nil { http.Error(w, err.Error(), 404); return }
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(token)
	}
}

func handleTokensByCreator(k *tokenfactorykeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		creator := strings.TrimPrefix(r.URL.Path, "/openchain/tokenfactory/v1/tokens/")
		if creator == "" { http.Error(w, "creator required", 400); return }
		ctx := ctxProvider()
		tokens, _ := k.GetTokensByCreator(ctx, creator)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"tokens": tokens})
	}
}

func handleAllTokens(k *tokenfactorykeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		tokens, _ := k.GetAllTokens(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"tokens": tokens})
	}
}

// ─── Messaging Handlers ───

func handleMessages(k *messagingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/messaging/v1/messages/")
		if uid == "" { http.Error(w, "uid required", 400); return }
		ctx := ctxProvider()
		msgs, _ := k.GetMessages(ctx, uid, 50)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"messages": msgs})
	}
}

func handleConversations(k *messagingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := strings.TrimPrefix(r.URL.Path, "/openchain/messaging/v1/conversations/")
		if uid == "" { http.Error(w, "uid required", 400); return }
		ctx := ctxProvider()
		convos, _ := k.GetConversations(ctx, uid)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"conversations": convos})
	}
}

// ─── Chain Params Handler ───

// ─── Price Oracle Handlers ───

func handlePrices(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		prices := k.GetAllPrices(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"prices": prices})
	}
}

func handlePrice(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		denom := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/price/")
		if denom == "" { http.Error(w, "denom required", 400); return }
		ctx := ctxProvider()
		price := k.GetAggregatedPrice(ctx, denom)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(price)
	}
}

func handleChainParams(k *govuidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		params := k.GetChainParams(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(params)
	}
}

// ─── DEX Handlers ───

func handleDEXPools(k *dexkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"pools": []interface{}{}})
	}
}

func handleDEXOrders(k *dexkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		maker := strings.TrimPrefix(r.URL.Path, "/openchain/dex/v1/orders/")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"maker": maker, "orders": []interface{}{}})
	}
}

// ─── Lending Handlers ───

func handleLendingMarkets(k *lendingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		markets := k.GetAllMarkets(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"markets": markets})
	}
}

func handleLendingPosition(k *lendingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		address := strings.TrimPrefix(r.URL.Path, "/openchain/lending/v1/position/")
		if address == "" { http.Error(w, "address required", 400); return }
		ctx := ctxProvider()
		pos := k.GetPosition(ctx, address)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pos)
	}
}

func handleInsuranceFund(k *lendingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		fund := k.GetInsuranceFund(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(fund)
	}
}

// ─── Farming Handlers ───

func handleFarms(k *farmingkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		farms := k.GetAllFarms(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"farms": farms})
	}
}

// ─── Correction Handlers ───

func handleCorrectionReportsByTarget(k *correctionkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		target := strings.TrimPrefix(r.URL.Path, "/openchain/correction/v1/reports/target/")
		if target == "" { http.Error(w, "target required", 400); return }
		ctx := ctxProvider()
		reports, _ := k.GetReportsByTarget(ctx, target)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"reports": reports})
	}
}

func handlePendingCorrectionReports(k *correctionkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		reports, _ := k.GetPendingReports(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"reports": reports})
	}
}

// ─── DAO Handlers ───

func handleDAOsByMember(k *daokeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		member := strings.TrimPrefix(r.URL.Path, "/openchain/dao/v1/daos/")
		if member == "" { http.Error(w, "member required", 400); return }
		ctx := ctxProvider()
		daos, _ := k.GetDAOsByMember(ctx, member)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"daos": daos})
	}
}

func handleDAO(k *daokeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		daoID := strings.TrimPrefix(r.URL.Path, "/openchain/dao/v1/dao/")
		if daoID == "" { http.Error(w, "dao_id required", 400); return }
		ctx := ctxProvider()
		dao, err := k.GetDAO(ctx, daoID)
		if err != nil { http.Error(w, err.Error(), 404); return }
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dao)
	}
}

// ─── Regional Aggregate Handlers ───

func handleRegionalAggregates(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		regions := k.GetAllRegionalAggregates(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"regions": regions})
	}
}

func handleRegionalAggregate(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		region := strings.TrimPrefix(r.URL.Path, "/openchain/otk/v1/region/")
		if region == "" { http.Error(w, "region required", 400); return }
		ctx := ctxProvider()
		ra := k.GetRegionalAggregate(ctx, region)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ra)
	}
}

func handleAlertRegions(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		threshold := int64(40) // default threshold
		if t := r.URL.Query().Get("threshold"); t != "" {
			if v, err := strconv.ParseInt(t, 10, 64); err == nil { threshold = v }
		}
		ctx := ctxProvider()
		alerts := k.GetAlertRegions(ctx, threshold)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"alerts": alerts, "threshold": threshold})
	}
}

func handleTreasury(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		treasury := k.GetTreasury(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(treasury)
	}
}

// ─── Amendment Handlers ───

func handleAmendments(k *govuidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := ctxProvider()
		amendments := k.GetAllAmendments(ctx)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"amendments": amendments})
	}
}

// ════════════════════════════════════════════════════════════════
// OTK Handlers
// ════════════════════════════════════════════════════════════════

// GET /openchain/otk/v1/living_ledger/{address}
func handleLivingLedger(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		address := extractPathParam(r.URL.Path, "/openchain/otk/v1/living_ledger/")
		if address == "" {
			writeError(w, http.StatusBadRequest, "address is required")
			return
		}

		ctx := ctxProvider()
		ledger, err := k.GetLivingLedger(ctx, address)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, ledger)
	}
}

// GET /openchain/otk/v1/contribution_score/{address}
func handleContributionScore(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		address := extractPathParam(r.URL.Path, "/openchain/otk/v1/contribution_score/")
		if address == "" {
			writeError(w, http.StatusBadRequest, "address is required")
			return
		}

		ctx := ctxProvider()
		score, err := k.GetContributionScore(ctx, address)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		rank, total, rankErr := k.GetRank(ctx, address)
		if rankErr != nil {
			// Score exists but no rank yet — return score with rank=0
			rank = 0
			total = 0
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"score": score,
			"rank":  rank,
			"total": total,
		})
	}
}

// GET /openchain/otk/v1/top_contributors?limit=10
func handleTopContributors(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		limit := 10
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		ctx := ctxProvider()
		contributors := k.GetTopContributors(ctx, limit)

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"contributors": contributors,
		})
	}
}

// GET /openchain/otk/v1/pending_milestones
func handlePendingMilestones(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		ctx := ctxProvider()
		milestones, err := k.GetPendingMilestones(ctx)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if milestones == nil {
			milestones = []otkkeeper.PendingMilestone{}
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"milestones": milestones,
		})
	}
}

// GET /openchain/otk/v1/verifier/{uid}
func handleVerifier(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		uid := extractPathParam(r.URL.Path, "/openchain/otk/v1/verifier/")
		if uid == "" {
			writeError(w, http.StatusBadRequest, "uid is required")
			return
		}

		ctx := ctxProvider()
		verifier, err := k.GetVerifier(ctx, uid)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, verifier)
	}
}

// GET /openchain/otk/v1/channel_balance/{address}/{channel}
func handleChannelBalance(k *otkkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		// Extract two path segments: address and channel
		rest := extractPathParam(r.URL.Path, "/openchain/otk/v1/channel_balance/")
		parts := strings.SplitN(rest, "/", 2)
		if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
			writeError(w, http.StatusBadRequest, "address and channel are required: /channel_balance/{address}/{channel}")
			return
		}
		address := parts[0]
		channel := parts[1]

		addr, err := sdk.AccAddressFromBech32(address)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid address: "+err.Error())
			return
		}

		ctx := ctxProvider()
		balance := k.GetChannelBalance(ctx, addr, channel)

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"address": address,
			"channel": channel,
			"balance": balance.Int64(),
		})
	}
}

// ════════════════════════════════════════════════════════════════
// UID Handlers
// ════════════════════════════════════════════════════════════════

// GET /openchain/uid/v1/uid/{address}
func handleUID(k *uidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		address := extractPathParam(r.URL.Path, "/openchain/uid/v1/uid/")
		if address == "" {
			writeError(w, http.StatusBadRequest, "address is required")
			return
		}

		addr, err := sdk.AccAddressFromBech32(address)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid address: "+err.Error())
			return
		}

		ctx := ctxProvider()
		uid, err := k.GetUID(ctx, addr)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, uid)
	}
}

// GET /openchain/uid/v1/disclosure/{uid}/{claim_type}
func handleDisclosure(k *uidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		rest := extractPathParam(r.URL.Path, "/openchain/uid/v1/disclosure/")
		parts := strings.SplitN(rest, "/", 2)
		if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
			writeError(w, http.StatusBadRequest, "uid and claim_type are required: /disclosure/{uid}/{claim_type}")
			return
		}
		uid := parts[0]
		claimType := parts[1]

		ctx := ctxProvider()
		disclosure, err := k.GetSelectiveDisclosure(ctx, uid, claimType)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, disclosure)
	}
}

// ════════════════════════════════════════════════════════════════
// GovUID Handlers
// ════════════════════════════════════════════════════════════════

// GET /openchain/govuid/v1/proposals
func handleProposals(k *govuidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		ctx := ctxProvider()
		// Pass empty status to get all proposals
		proposals := k.GetProposals(ctx, "")

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"proposals": proposals,
		})
	}
}

// GET /openchain/govuid/v1/proposal/{id}
func handleProposal(k *govuidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		idStr := extractPathParam(r.URL.Path, "/openchain/govuid/v1/proposal/")
		if idStr == "" {
			writeError(w, http.StatusBadRequest, "proposal id is required")
			return
		}

		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid proposal id: "+err.Error())
			return
		}

		ctx := ctxProvider()
		proposal, err := k.GetProposal(ctx, id)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, proposal)
	}
}

// GET /openchain/govuid/v1/votes/{proposal_id}
func handleVotes(k *govuidkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		idStr := extractPathParam(r.URL.Path, "/openchain/govuid/v1/votes/")
		if idStr == "" {
			writeError(w, http.StatusBadRequest, "proposal_id is required")
			return
		}

		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid proposal_id: "+err.Error())
			return
		}

		ctx := ctxProvider()
		votes := k.GetVotes(ctx, id)

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"votes": votes,
		})
	}
}

// ════════════════════════════════════════════════════════════════
// Achievement Handlers
// ════════════════════════════════════════════════════════════════

// GET /openchain/achievement/v1/achievements/{uid}
func handleAchievements(k *achievementkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		uid := extractPathParam(r.URL.Path, "/openchain/achievement/v1/achievements/")
		if uid == "" {
			writeError(w, http.StatusBadRequest, "uid is required")
			return
		}

		ctx := ctxProvider()
		achievements, err := k.GetAchievements(ctx, uid)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if achievements == nil {
			achievements = []achievementtypes.Achievement{}
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"achievements": achievements,
		})
	}
}

// GET /openchain/achievement/v1/achievement/{id}
func handleAchievement(k *achievementkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		id := extractPathParam(r.URL.Path, "/openchain/achievement/v1/achievement/")
		if id == "" {
			writeError(w, http.StatusBadRequest, "achievement id is required")
			return
		}

		ctx := ctxProvider()
		achievement, err := k.GetAchievement(ctx, id)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, achievement)
	}
}

// GET /openchain/achievement/v1/stats/{uid}
func handleAchievementStats(k *achievementkeeper.Keeper, ctxProvider ContextProvider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		uid := extractPathParam(r.URL.Path, "/openchain/achievement/v1/stats/")
		if uid == "" {
			writeError(w, http.StatusBadRequest, "uid is required")
			return
		}

		ctx := ctxProvider()
		stats, err := k.GetAchievementStats(ctx, uid)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, stats)
	}
}

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

// extractPathParam returns the path segment(s) after the given prefix.
// For example, extractPathParam("/a/b/c/foo", "/a/b/c/") returns "foo".
func extractPathParam(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	param := strings.TrimPrefix(path, prefix)
	param = strings.TrimSuffix(param, "/")
	return param
}

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// writeError writes a JSON error response.
func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}
