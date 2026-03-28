// Package keeper — On-Chain Price Oracle.
//
// Decentralized price feeds for Open Chain.
// Validators submit price reports. Median price is used.
// This enables on-chain DeFi (lending liquidations, swap pricing)
// without relying on external oracles like Chainlink.

package keeper

import (
	"encoding/json"
	"fmt"
	"sort"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// PriceReport is a validator's price submission.
type PriceReport struct {
	Denom       string `json:"denom"`
	PriceUSD    int64  `json:"price_usd"`    // Price in micro-USD (1 USD = 1,000,000)
	Reporter    string `json:"reporter"`     // Validator address
	BlockHeight int64  `json:"block_height"`
}

// AggregatedPrice is the median price from all validators.
type AggregatedPrice struct {
	Denom       string `json:"denom"`
	PriceUSD    int64  `json:"price_usd"`
	ReportCount int    `json:"report_count"`
	UpdatedAt   int64  `json:"updated_at"`
}

// SubmitPriceReport records a validator's price report.
func (k Keeper) SubmitPriceReport(ctx sdk.Context, report PriceReport) error {
	if report.Denom == "" || report.PriceUSD <= 0 {
		return fmt.Errorf("invalid price report")
	}
	report.BlockHeight = ctx.BlockHeight()

	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("price_report/%s/%s", report.Denom, report.Reporter))
	bz, _ := json.Marshal(report)
	store.Set(key, bz)
	return nil
}

// GetAggregatedPrice computes the median price from all recent reports.
func (k Keeper) GetAggregatedPrice(ctx sdk.Context, denom string) AggregatedPrice {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("price_report/%s/", denom))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var prices []int64
	currentHeight := ctx.BlockHeight()

	for ; iterator.Valid(); iterator.Next() {
		var report PriceReport
		if err := json.Unmarshal(iterator.Value(), &report); err != nil {
			continue
		}
		// Only use reports from the last 100 blocks (~10 minutes)
		if currentHeight-report.BlockHeight <= 100 {
			prices = append(prices, report.PriceUSD)
		}
	}

	if len(prices) == 0 {
		return AggregatedPrice{Denom: denom, PriceUSD: 0, ReportCount: 0, UpdatedAt: currentHeight}
	}

	sort.Slice(prices, func(i, j int) bool { return prices[i] < prices[j] })
	median := prices[len(prices)/2]

	return AggregatedPrice{
		Denom:       denom,
		PriceUSD:    median,
		ReportCount: len(prices),
		UpdatedAt:   currentHeight,
	}
}

// GetAllPrices returns aggregated prices for all denoms.
func (k Keeper) GetAllPrices(ctx sdk.Context) []AggregatedPrice {
	denoms := []string{"uotk", "ubtc", "ueth", "usol", "uatom", "uusdt", "uusdc"}
	var prices []AggregatedPrice
	for _, d := range denoms {
		p := k.GetAggregatedPrice(ctx, d)
		if p.ReportCount > 0 {
			prices = append(prices, p)
		}
	}
	return prices
}
