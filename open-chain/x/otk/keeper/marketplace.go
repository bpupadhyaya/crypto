// Package keeper — Local Marketplace.
//
// Community-level exchange of goods and services tracked on-chain.
// Supports OTK payments, time exchange, and barter. Every transaction
// strengthens the local economy and earns xOTK for participants.
//
// Categories: food, crafts, services, equipment, clothing, electronics, furniture, other

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// MarketListing represents a good or service for sale/exchange.
type MarketListing struct {
	ID          string `json:"id"`
	SellerUID   string `json:"seller_uid"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"` // food, crafts, services, equipment, clothing, electronics, furniture, other
	PriceType   string `json:"price_type"` // otk, time, barter, free
	PriceOTK    int64  `json:"price_otk,omitempty"` // micro-OTK
	PriceDesc   string `json:"price_desc,omitempty"` // for barter/time descriptions
	Condition   string `json:"condition"` // new, like_new, good, fair, for_parts
	Region      string `json:"region"`
	Status      string `json:"status"` // available, reserved, sold, expired
	Views       int64  `json:"views"`
	PostedAt    int64  `json:"posted_at"`
}

// MarketTransaction records a completed marketplace exchange.
type MarketTransaction struct {
	ListingID string `json:"listing_id"`
	SellerUID string `json:"seller_uid"`
	BuyerUID  string `json:"buyer_uid"`
	PriceOTK  int64  `json:"price_otk"`
	XOTKEarned int64 `json:"xotk_earned"` // bonus for local commerce
	CompletedAt int64 `json:"completed_at"`
	Rating      int64 `json:"rating"` // 1-5
}

// RegionalMarketStats tracks local commerce health.
type RegionalMarketStats struct {
	Region          string `json:"region"`
	ActiveListings  int64  `json:"active_listings"`
	TotalSold       int64  `json:"total_sold"`
	TotalOTKVolume  int64  `json:"total_otk_volume"`
	TotalXOTKEarned int64  `json:"total_xotk_earned"`
	UniqueTraders   int64  `json:"unique_traders"`
	LastUpdated     int64  `json:"last_updated"`
}

// PostMarketListing creates a new listing.
func (k Keeper) PostMarketListing(ctx sdk.Context, listing MarketListing) (*MarketListing, error) {
	if listing.Title == "" || listing.SellerUID == "" {
		return nil, fmt.Errorf("title and seller are required")
	}

	listing.Status = "available"
	listing.PostedAt = ctx.BlockHeight()
	if listing.ID == "" {
		listing.ID = fmt.Sprintf("mkt_%s_%d", listing.Region, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(listing)
	store.Set([]byte("market/"+listing.ID), bz)

	// Index by category
	catKey := fmt.Sprintf("market_cat/%s/%s", listing.Category, listing.ID)
	store.Set([]byte(catKey), []byte(listing.ID))

	// Update stats
	stats := k.GetMarketStats(ctx, listing.Region)
	stats.ActiveListings++
	stats.LastUpdated = ctx.BlockHeight()
	k.setMarketStats(ctx, stats)

	ctx.EventManager().EmitEvent(sdk.NewEvent("market_listing_posted",
		sdk.NewAttribute("id", listing.ID),
		sdk.NewAttribute("title", listing.Title),
		sdk.NewAttribute("category", listing.Category),
		sdk.NewAttribute("price_type", listing.PriceType),
	))

	return &listing, nil
}

// CompleteMarketTransaction records a sale and rewards participants.
func (k Keeper) CompleteMarketTransaction(ctx sdk.Context, listingID, buyerUID string, rating int64) error {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("market/" + listingID))
	if bz == nil {
		return fmt.Errorf("listing not found")
	}

	var listing MarketListing
	_ = json.Unmarshal(bz, &listing)

	if listing.Status != "available" && listing.Status != "reserved" {
		return fmt.Errorf("listing is not available")
	}

	listing.Status = "sold"
	updBz, _ := json.Marshal(listing)
	store.Set([]byte("market/"+listing.ID), updBz)

	// Record transaction
	xotkReward := int64(500000) // 0.5 xOTK per transaction
	tx := MarketTransaction{
		ListingID:   listingID,
		SellerUID:   listing.SellerUID,
		BuyerUID:    buyerUID,
		PriceOTK:    listing.PriceOTK,
		XOTKEarned:  xotkReward,
		CompletedAt: ctx.BlockHeight(),
		Rating:      rating,
	}
	txBz, _ := json.Marshal(tx)
	txKey := fmt.Sprintf("market_tx/%d/%s", ctx.BlockHeight(), listingID)
	store.Set([]byte(txKey), txBz)

	// Update stats
	stats := k.GetMarketStats(ctx, listing.Region)
	stats.ActiveListings--
	stats.TotalSold++
	stats.TotalOTKVolume += listing.PriceOTK
	stats.TotalXOTKEarned += xotkReward
	stats.LastUpdated = ctx.BlockHeight()
	k.setMarketStats(ctx, stats)

	ctx.EventManager().EmitEvent(sdk.NewEvent("market_transaction",
		sdk.NewAttribute("listing_id", listingID),
		sdk.NewAttribute("buyer", buyerUID),
		sdk.NewAttribute("seller", listing.SellerUID),
		sdk.NewAttribute("xotk_reward", fmt.Sprintf("%d", xotkReward)),
	))

	return nil
}

// GetMarketListings returns active listings, optionally filtered by category.
func (k Keeper) GetMarketListings(ctx sdk.Context, category string, limit int) []MarketListing {
	store := ctx.KVStore(k.storeKey)
	var prefix []byte
	if category != "" {
		prefix = []byte(fmt.Sprintf("market_cat/%s/", category))
	} else {
		prefix = []byte("market/")
	}

	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var listings []MarketListing
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var listing MarketListing
		var listingBz []byte

		if category != "" {
			listingID := string(iterator.Value())
			listingBz = store.Get([]byte("market/" + listingID))
		} else {
			listingBz = iterator.Value()
		}

		if listingBz == nil {
			continue
		}
		if err := json.Unmarshal(listingBz, &listing); err != nil {
			continue
		}
		if listing.Status == "available" {
			listings = append(listings, listing)
			count++
		}
	}
	return listings
}

// GetMarketStats retrieves regional marketplace statistics.
func (k Keeper) GetMarketStats(ctx sdk.Context, region string) *RegionalMarketStats {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("market_stats/" + region))
	if bz == nil {
		return &RegionalMarketStats{Region: region}
	}
	var s RegionalMarketStats
	_ = json.Unmarshal(bz, &s)
	return &s
}

func (k Keeper) setMarketStats(ctx sdk.Context, s *RegionalMarketStats) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(s)
	store.Set([]byte("market_stats/"+s.Region), bz)
}
