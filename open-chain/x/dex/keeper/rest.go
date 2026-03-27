// REST API handlers for the DEX module.
// These are called by Open Wallet to execute swaps and manage orders.
//
// Endpoints:
//   POST /dex/swap          — Execute AMM swap
//   POST /dex/order         — Place limit order
//   POST /dex/order/fill    — Fill limit order
//   POST /dex/order/cancel  — Cancel limit order
//   GET  /dex/pools         — List all pools
//   GET  /dex/orders        — List open orders for a pair
//   POST /dex/pool          — Create new pool

package keeper

// REST handler types (used by the wallet's HTTP client)

type SwapRequest struct {
	Sender      string `json:"sender"`
	PoolID      string `json:"pool_id"`
	InputDenom  string `json:"input_denom"`
	InputAmount int64  `json:"input_amount"`
}

type SwapResponse struct {
	OutputAmount int64  `json:"output_amount"`
	OutputDenom  string `json:"output_denom"`
	TxHash       string `json:"tx_hash"`
}

type PlaceOrderRequest struct {
	Maker      string `json:"maker"`
	SellDenom  string `json:"sell_denom"`
	BuyDenom   string `json:"buy_denom"`
	SellAmount int64  `json:"sell_amount"`
	Price      int64  `json:"price"` // price * 1e8
}

type PlaceOrderResponse struct {
	OrderID string `json:"order_id"`
	TxHash  string `json:"tx_hash"`
}

type FillOrderRequest struct {
	Taker   string `json:"taker"`
	OrderID string `json:"order_id"`
}

type CancelOrderRequest struct {
	Maker   string `json:"maker"`
	OrderID string `json:"order_id"`
}
