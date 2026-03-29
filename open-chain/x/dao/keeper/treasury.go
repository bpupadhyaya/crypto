// Package keeper — DAO Treasury Operations.
//
// Each DAO can maintain its own treasury funded by member contributions.
// Treasury spending requires a passed DAO proposal (majority vote).
// This enables community-governed resource allocation at the local level.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/dao/types"
)

// DAOTreasury tracks a DAO's shared funds.
type DAOTreasury struct {
	DAOID           string            `json:"dao_id"`
	TotalBalance    int64             `json:"total_balance"` // uotk
	BalanceByDenom  map[string]int64  `json:"balance_by_denom"`
	TotalDeposited  int64             `json:"total_deposited"`
	TotalSpent      int64             `json:"total_spent"`
	SpendHistory    []TreasurySpend   `json:"spend_history"`
}

// TreasurySpend records a single treasury expenditure.
type TreasurySpend struct {
	ProposalID  string `json:"proposal_id"`
	Recipient   string `json:"recipient"`
	Denom       string `json:"denom"`
	Amount      int64  `json:"amount"`
	Reason      string `json:"reason"`
	BlockHeight int64  `json:"block_height"`
}

// GetDAOTreasury retrieves a DAO's treasury.
func (k Keeper) GetDAOTreasury(ctx sdk.Context, daoID string) DAOTreasury {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("dao_treasury/" + daoID))
	if bz == nil {
		return DAOTreasury{
			DAOID:          daoID,
			BalanceByDenom: map[string]int64{},
			SpendHistory:   []TreasurySpend{},
		}
	}
	var t DAOTreasury
	_ = json.Unmarshal(bz, &t)
	return t
}

func (k Keeper) setDAOTreasury(ctx sdk.Context, t *DAOTreasury) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(t)
	store.Set([]byte("dao_treasury/"+t.DAOID), bz)
}

// DepositToDAO adds funds to a DAO's treasury.
// The depositor must be a member. Funds are tracked but held in the bank module.
func (k Keeper) DepositToDAO(ctx sdk.Context, daoID, depositor, denom string, amount int64) error {
	dao, err := k.GetDAO(ctx, daoID)
	if err != nil {
		return err
	}

	isMember := false
	for _, m := range dao.Members {
		if m == depositor {
			isMember = true
			break
		}
	}
	if !isMember {
		return fmt.Errorf("only members can deposit to DAO treasury")
	}

	// Transfer from depositor to DAO module account
	depositorAddr, err := sdk.AccAddressFromBech32(depositor)
	if err != nil {
		return err
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromAccountToModule(ctx, depositorAddr, "dao", coins); err != nil {
		return fmt.Errorf("transfer failed: %w", err)
	}

	// Update treasury tracking
	t := k.GetDAOTreasury(ctx, daoID)
	t.TotalBalance += amount
	t.TotalDeposited += amount
	if t.BalanceByDenom == nil {
		t.BalanceByDenom = map[string]int64{}
	}
	t.BalanceByDenom[denom] += amount
	k.setDAOTreasury(ctx, &t)

	ctx.EventManager().EmitEvent(sdk.NewEvent("dao_deposit",
		sdk.NewAttribute("dao_id", daoID),
		sdk.NewAttribute("depositor", depositor),
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
	))

	return nil
}

// SpendFromDAO distributes funds from DAO treasury to a recipient.
// Requires an approved DAO proposal.
func (k Keeper) SpendFromDAO(ctx sdk.Context, daoID, proposalID, recipient, denom string, amount int64, reason string) error {
	t := k.GetDAOTreasury(ctx, daoID)

	available := t.BalanceByDenom[denom]
	if available < amount {
		return fmt.Errorf("insufficient DAO treasury: have %d, need %d", available, amount)
	}

	// Send from DAO module account to recipient
	recipientAddr, err := sdk.AccAddressFromBech32(recipient)
	if err != nil {
		return fmt.Errorf("invalid recipient: %w", err)
	}

	coins := sdk.NewCoins(sdk.NewInt64Coin(denom, amount))
	if err := k.bank.SendCoinsFromModuleToAccount(ctx, "dao", recipientAddr, coins); err != nil {
		return fmt.Errorf("spend failed: %w", err)
	}

	// Update treasury
	t.BalanceByDenom[denom] -= amount
	t.TotalBalance -= amount
	t.TotalSpent += amount
	t.SpendHistory = append(t.SpendHistory, TreasurySpend{
		ProposalID:  proposalID,
		Recipient:   recipient,
		Denom:       denom,
		Amount:      amount,
		Reason:      reason,
		BlockHeight: ctx.BlockHeight(),
	})
	k.setDAOTreasury(ctx, &t)

	ctx.EventManager().EmitEvent(sdk.NewEvent("dao_spend",
		sdk.NewAttribute("dao_id", daoID),
		sdk.NewAttribute("proposal_id", proposalID),
		sdk.NewAttribute("recipient", recipient),
		sdk.NewAttribute("denom", denom),
		sdk.NewAttribute("amount", fmt.Sprintf("%d", amount)),
		sdk.NewAttribute("reason", reason),
	))

	return nil
}

// CreateSpendProposal creates a DAO proposal to spend treasury funds.
func (k Keeper) CreateSpendProposal(ctx sdk.Context, daoID, proposer, recipient, denom string, amount int64, reason string) error {
	actionData := fmt.Sprintf(`{"recipient":"%s","denom":"%s","amount":%d,"reason":"%s"}`, recipient, denom, amount, reason)

	prop := types.DAOProposal{
		DAOID:       daoID,
		Title:       fmt.Sprintf("Treasury Spend: %d %s to %s", amount, denom, recipient[:12]+"..."),
		Description: reason,
		Proposer:    proposer,
		ActionType:  "treasury_spend",
		ActionData:  actionData,
	}

	return k.CreateProposal(ctx, prop)
}

// ExecutePassedProposals processes passed DAO proposals with actions.
func (k Keeper) ExecutePassedProposals(ctx sdk.Context) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("dao_prop/")
	iter := store.Iterator(prefix, prefixEndBytes(prefix))
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		var prop types.DAOProposal
		if err := json.Unmarshal(iter.Value(), &prop); err != nil {
			continue
		}
		if prop.Status != "passed" || prop.Executed {
			continue
		}

		if prop.ActionType == "treasury_spend" {
			var action struct {
				Recipient string `json:"recipient"`
				Denom     string `json:"denom"`
				Amount    int64  `json:"amount"`
				Reason    string `json:"reason"`
			}
			if err := json.Unmarshal([]byte(prop.ActionData), &action); err == nil {
				if err := k.SpendFromDAO(ctx, prop.DAOID, prop.ID, action.Recipient, action.Denom, action.Amount, action.Reason); err != nil {
					continue
				}
			}
		}

		prop.Executed = true
		bz, _ := json.Marshal(prop)
		store.Set(iter.Key(), bz)
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
