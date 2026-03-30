// Package keeper — DEX Message Server.
//
// Handles all DEX transaction messages routed from the Cosmos SDK message router.
// This is the critical bridge between wallet transactions and on-chain execution.
//
// Message types:
//   - MsgSwap: Execute an AMM pool swap
//   - MsgPlaceLimitOrder: Place a limit order on the order book
//   - MsgFillOrder: Fill an existing limit order
//   - MsgCancelOrder: Cancel an open limit order
//   - MsgCreatePool: Create a new AMM liquidity pool
//   - MsgCreateAtomicSwapOrder: Post an atomic swap order for P2P matching

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// MsgServer implements the DEX module's message handlers.
type MsgServer struct {
	keeper *Keeper
}

// NewMsgServer creates a new DEX message server.
func NewMsgServer(k *Keeper) MsgServer {
	return MsgServer{keeper: k}
}

// ─── MsgSwap ───

// MsgSwap is sent by the wallet to execute an AMM pool swap.
type MsgSwap struct {
	Sender        string `json:"sender"`
	PoolID        string `json:"pool_id"`
	TokenIn       Coin   `json:"token_in"`
	TokenOutDenom string `json:"token_out_denom"`
	MinAmountOut  string `json:"min_amount_out"`
}

type Coin struct {
	Denom  string `json:"denom"`
	Amount string `json:"amount"`
}

func (ms MsgServer) HandleMsgSwap(ctx sdk.Context, msg *MsgSwap) (int64, error) {
	sender, err := sdk.AccAddressFromBech32(msg.Sender)
	if err != nil {
		return 0, fmt.Errorf("invalid sender: %w", err)
	}

	// Parse amount
	var inputAmount int64
	if _, err := fmt.Sscanf(msg.TokenIn.Amount, "%d", &inputAmount); err != nil {
		return 0, fmt.Errorf("invalid amount: %w", err)
	}

	// Execute swap via keeper
	outputAmount, err := ms.keeper.Swap(ctx, sender, msg.PoolID, msg.TokenIn.Denom, inputAmount)
	if err != nil {
		return 0, err
	}

	// Check minimum output
	if msg.MinAmountOut != "" && msg.MinAmountOut != "0" {
		var minOut int64
		fmt.Sscanf(msg.MinAmountOut, "%d", &minOut)
		if outputAmount < minOut {
			return 0, fmt.Errorf("slippage: output %d < minimum %d", outputAmount, minOut)
		}
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent("msg_swap_executed",
		sdk.NewAttribute("sender", msg.Sender),
		sdk.NewAttribute("pool", msg.PoolID),
		sdk.NewAttribute("input", fmt.Sprintf("%s %s", msg.TokenIn.Amount, msg.TokenIn.Denom)),
		sdk.NewAttribute("output", fmt.Sprintf("%d %s", outputAmount, msg.TokenOutDenom)),
	))

	return outputAmount, nil
}

// ─── MsgPlaceLimitOrder ───

type MsgPlaceLimitOrder struct {
	Sender      string `json:"sender"`
	SellToken   Coin   `json:"sell_token"`
	BuyDenom    string `json:"buy_denom"`
	MinBuyAmount string `json:"min_buy_amount"`
	Price       string `json:"price"`
	OrderType   string `json:"order_type"` // limit, market
}

func (ms MsgServer) HandleMsgPlaceLimitOrder(ctx sdk.Context, msg *MsgPlaceLimitOrder) (string, error) {
	sender, err := sdk.AccAddressFromBech32(msg.Sender)
	if err != nil {
		return "", fmt.Errorf("invalid sender: %w", err)
	}

	var sellAmount int64
	fmt.Sscanf(msg.SellToken.Amount, "%d", &sellAmount)

	var price int64
	// Price is in 1e8 fixed point (e.g., "0.50000000" = 50000000)
	var priceFloat float64
	fmt.Sscanf(msg.Price, "%f", &priceFloat)
	price = int64(priceFloat * 1e8)

	if msg.OrderType == "market" {
		// Market order: find best matching order and fill immediately
		orders := ms.keeper.GetOpenOrders(ctx, msg.BuyDenom, msg.SellToken.Denom)
		if len(orders) > 0 {
			// Fill the best order
			if err := ms.keeper.FillOrder(ctx, sender, orders[0].ID); err != nil {
				return "", fmt.Errorf("market order fill failed: %w", err)
			}
			return orders[0].ID, nil
		}
		// No matching orders — fall through to place as limit order
	}

	order, err := ms.keeper.PlaceLimitOrder(ctx, sender, msg.SellToken.Denom, msg.BuyDenom, sellAmount, price)
	if err != nil {
		return "", err
	}

	return order.ID, nil
}

// ─── MsgCreatePool ───

type MsgCreatePool struct {
	Creator string `json:"creator"`
	TokenA  string `json:"token_a"`
	TokenB  string `json:"token_b"`
	AmountA string `json:"amount_a"`
	AmountB string `json:"amount_b"`
	FeeRate string `json:"fee_rate"` // basis points, e.g., "30" = 0.3%
}

func (ms MsgServer) HandleMsgCreatePool(ctx sdk.Context, msg *MsgCreatePool) (string, error) {
	creator, err := sdk.AccAddressFromBech32(msg.Creator)
	if err != nil {
		return "", fmt.Errorf("invalid creator: %w", err)
	}

	var amountA, amountB, feeRate int64
	fmt.Sscanf(msg.AmountA, "%d", &amountA)
	fmt.Sscanf(msg.AmountB, "%d", &amountB)
	fmt.Sscanf(msg.FeeRate, "%d", &feeRate)
	if feeRate == 0 {
		feeRate = 30 // default 0.3%
	}

	pool, err := ms.keeper.CreatePool(ctx, creator, msg.TokenA, msg.TokenB, amountA, amountB, feeRate)
	if err != nil {
		return "", err
	}

	return pool.ID, nil
}

// ─── MsgFillOrder ───

type MsgFillOrder struct {
	Taker   string `json:"taker"`
	OrderID string `json:"order_id"`
}

func (ms MsgServer) HandleMsgFillOrder(ctx sdk.Context, msg *MsgFillOrder) error {
	taker, err := sdk.AccAddressFromBech32(msg.Taker)
	if err != nil {
		return fmt.Errorf("invalid taker: %w", err)
	}
	return ms.keeper.FillOrder(ctx, taker, msg.OrderID)
}

// ─── MsgCancelOrder ───

type MsgCancelOrder struct {
	Maker   string `json:"maker"`
	OrderID string `json:"order_id"`
}

func (ms MsgServer) HandleMsgCancelOrder(ctx sdk.Context, msg *MsgCancelOrder) error {
	maker, err := sdk.AccAddressFromBech32(msg.Maker)
	if err != nil {
		return fmt.Errorf("invalid maker: %w", err)
	}
	return ms.keeper.CancelOrder(ctx, maker, msg.OrderID)
}

// ─── MsgCreateAtomicSwapOrder ───

// AtomicSwapOrder is a P2P swap request posted to the chain's mempool.
// Counterparties can discover these orders and initiate HTLC-based swaps.
type AtomicSwapOrder struct {
	ID                     string `json:"id"`
	Initiator              string `json:"initiator"`               // Open Chain address
	InitiatorSourceAddress string `json:"initiator_source_address"` // BTC/ETH address
	SourceChain            string `json:"source_chain"`            // bitcoin, ethereum, solana
	DestChain              string `json:"dest_chain"`
	SellAmount             string `json:"sell_amount"`
	SellDenom              string `json:"sell_denom"`
	BuyAmount              string `json:"buy_amount"`
	BuyDenom               string `json:"buy_denom"`
	SecretHash             string `json:"secret_hash"`
	InitiatorTimelock      string `json:"initiator_timelock"`
	ParticipantTimelock    string `json:"participant_timelock"`
	Status                 string `json:"status"` // pending, matched, htlc_created, completed, expired
	CreatedAt              int64  `json:"created_at"`
	MatchedBy              string `json:"matched_by,omitempty"`
}

type MsgCreateAtomicSwapOrder struct {
	Initiator              string `json:"initiator"`
	InitiatorSourceAddress string `json:"initiator_source_address"`
	SourceChain            string `json:"source_chain"`
	DestChain              string `json:"dest_chain"`
	SellAmount             string `json:"sell_amount"`
	SellDenom              string `json:"sell_denom"`
	BuyAmount              string `json:"buy_amount"`
	BuyDenom               string `json:"buy_denom"`
	SecretHash             string `json:"secret_hash"`
	InitiatorTimelock      string `json:"initiator_timelock"`
	ParticipantTimelock    string `json:"participant_timelock"`
}

func (ms MsgServer) HandleMsgCreateAtomicSwapOrder(ctx sdk.Context, msg *MsgCreateAtomicSwapOrder) (string, error) {
	if msg.Initiator == "" || msg.SecretHash == "" {
		return "", fmt.Errorf("initiator and secret_hash are required")
	}

	orderID := fmt.Sprintf("atomic-%d-%s", ctx.BlockHeight(), msg.SecretHash[:8])

	order := AtomicSwapOrder{
		ID:                     orderID,
		Initiator:              msg.Initiator,
		InitiatorSourceAddress: msg.InitiatorSourceAddress,
		SourceChain:            msg.SourceChain,
		DestChain:              msg.DestChain,
		SellAmount:             msg.SellAmount,
		SellDenom:              msg.SellDenom,
		BuyAmount:              msg.BuyAmount,
		BuyDenom:               msg.BuyDenom,
		SecretHash:             msg.SecretHash,
		InitiatorTimelock:      msg.InitiatorTimelock,
		ParticipantTimelock:    msg.ParticipantTimelock,
		Status:                 "pending",
		CreatedAt:              ctx.BlockHeight(),
	}

	// Store the atomic swap order
	store := ctx.KVStore(ms.keeper.storeKey)
	bz, _ := json.Marshal(order)
	store.Set([]byte("atomic_swap/"+orderID), bz)

	// Also index by sell/buy pair for easy discovery
	pairKey := fmt.Sprintf("atomic_pair/%s-%s/%s", msg.SellDenom, msg.BuyDenom, orderID)
	store.Set([]byte(pairKey), []byte(orderID))

	ctx.EventManager().EmitEvent(sdk.NewEvent("atomic_swap_order_created",
		sdk.NewAttribute("order_id", orderID),
		sdk.NewAttribute("initiator", msg.Initiator),
		sdk.NewAttribute("sell", fmt.Sprintf("%s %s", msg.SellAmount, msg.SellDenom)),
		sdk.NewAttribute("buy", fmt.Sprintf("%s %s", msg.BuyAmount, msg.BuyDenom)),
		sdk.NewAttribute("source_chain", msg.SourceChain),
		sdk.NewAttribute("dest_chain", msg.DestChain),
	))

	return orderID, nil
}

// ─── MsgMatchAtomicSwap ───

type MsgMatchAtomicSwap struct {
	Participant        string `json:"participant"`
	OrderID            string `json:"order_id"`
	ParticipantAddress string `json:"participant_address"` // Address on dest chain
}

func (ms MsgServer) HandleMsgMatchAtomicSwap(ctx sdk.Context, msg *MsgMatchAtomicSwap) error {
	store := ctx.KVStore(ms.keeper.storeKey)
	bz := store.Get([]byte("atomic_swap/" + msg.OrderID))
	if bz == nil {
		return fmt.Errorf("atomic swap order %s not found", msg.OrderID)
	}

	var order AtomicSwapOrder
	_ = json.Unmarshal(bz, &order)

	if order.Status != "pending" {
		return fmt.Errorf("order is not pending (status: %s)", order.Status)
	}

	order.Status = "matched"
	order.MatchedBy = msg.Participant

	updBz, _ := json.Marshal(order)
	store.Set([]byte("atomic_swap/"+msg.OrderID), updBz)

	ctx.EventManager().EmitEvent(sdk.NewEvent("atomic_swap_matched",
		sdk.NewAttribute("order_id", msg.OrderID),
		sdk.NewAttribute("participant", msg.Participant),
	))

	return nil
}

// ─── Query: Get Pending Atomic Swap Orders ───

func (ms MsgServer) GetPendingAtomicSwaps(ctx sdk.Context, sellDenom, buyDenom string) []AtomicSwapOrder {
	store := ctx.KVStore(ms.keeper.storeKey)
	prefix := []byte(fmt.Sprintf("atomic_pair/%s-%s/", sellDenom, buyDenom))

	iter := store.Iterator(prefix, prefixEndBytes(prefix))
	defer iter.Close()

	var orders []AtomicSwapOrder
	for ; iter.Valid(); iter.Next() {
		orderID := string(iter.Value())
		orderBz := store.Get([]byte("atomic_swap/" + orderID))
		if orderBz == nil {
			continue
		}
		var order AtomicSwapOrder
		if err := json.Unmarshal(orderBz, &order); err != nil {
			continue
		}
		if order.Status == "pending" {
			orders = append(orders, order)
		}
	}
	return orders
}

// ─── Dispatch ───

// DispatchMsg routes a raw JSON message to the appropriate handler.
func (ms MsgServer) DispatchMsg(ctx sdk.Context, msgType string, data []byte) (string, error) {
	switch msgType {
	case "dex/MsgSwap", "/openchain.dex.v1.MsgSwap":
		var msg MsgSwap
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		output, err := ms.HandleMsgSwap(ctx, &msg)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("swap_output:%d", output), nil

	case "dex/MsgPlaceLimitOrder", "/openchain.dex.v1.MsgPlaceLimitOrder":
		var msg MsgPlaceLimitOrder
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return ms.HandleMsgPlaceLimitOrder(ctx, &msg)

	case "dex/MsgCreatePool", "/openchain.dex.v1.MsgCreatePool":
		var msg MsgCreatePool
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return ms.HandleMsgCreatePool(ctx, &msg)

	case "dex/MsgFillOrder", "/openchain.dex.v1.MsgFillOrder":
		var msg MsgFillOrder
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return "", ms.HandleMsgFillOrder(ctx, &msg)

	case "dex/MsgCancelOrder", "/openchain.dex.v1.MsgCancelOrder":
		var msg MsgCancelOrder
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return "", ms.HandleMsgCancelOrder(ctx, &msg)

	case "dex/MsgCreateAtomicSwapOrder", "/openchain.dex.v1.MsgCreateAtomicSwapOrder":
		var msg MsgCreateAtomicSwapOrder
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return ms.HandleMsgCreateAtomicSwapOrder(ctx, &msg)

	case "dex/MsgMatchAtomicSwap", "/openchain.dex.v1.MsgMatchAtomicSwap":
		var msg MsgMatchAtomicSwap
		if err := json.Unmarshal(data, &msg); err != nil {
			return "", err
		}
		return "", ms.HandleMsgMatchAtomicSwap(ctx, &msg)

	default:
		return "", fmt.Errorf("unknown DEX message type: %s", msgType)
	}
}

func prefixEndBytes(prefix []byte) []byte {
	if len(prefix) == 0 {
		return nil
	}
	end := make([]byte, len(prefix))
	copy(end, prefix)
	for i := len(end) - 1; i >= 0; i-- {
		end[i]++
		if end[i] != 0 {
			return end
		}
	}
	return nil
}
