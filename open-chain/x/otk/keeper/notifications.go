// Package keeper — Chain Event Notification Triggers.
//
// Monitors on-chain events and generates push notification payloads
// for the wallet to display. Events are stored in a per-UID notification
// queue that the wallet polls or subscribes to via WebSocket.
//
// Notification types:
//   - transaction: incoming/outgoing OTK transfers
//   - governance: new proposals, vote reminders, results
//   - gratitude: received gratitude transaction
//   - milestone: milestone verified, OTK minted
//   - community: new events, cleanup drives, emergencies
//   - safety: disaster alerts, SOS nearby
//   - social: new messages, mentions
//   - system: sync status, upgrades

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Notification represents a push notification payload.
type Notification struct {
	ID        string `json:"id"`
	UID       string `json:"uid"`       // recipient UID
	Type      string `json:"type"`      // transaction, governance, gratitude, milestone, community, safety, social, system
	Priority  string `json:"priority"`  // urgent, important, normal, info
	Title     string `json:"title"`
	Body      string `json:"body"`
	Action    string `json:"action"`    // deep link: openwallet://screen/...
	Read      bool   `json:"read"`
	CreatedAt int64  `json:"created_at"`
}

// EmitNotification creates a notification for a specific UID.
func (k Keeper) EmitNotification(ctx sdk.Context, uid, notifType, priority, title, body, action string) {
	notif := Notification{
		ID:        fmt.Sprintf("notif_%s_%d", uid, ctx.BlockHeight()),
		UID:       uid,
		Type:      notifType,
		Priority:  priority,
		Title:     title,
		Body:      body,
		Action:    action,
		Read:      false,
		CreatedAt: ctx.BlockHeight(),
	}

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("notif/%s/%d", uid, ctx.BlockHeight())
	bz, _ := json.Marshal(notif)
	store.Set([]byte(key), bz)

	ctx.EventManager().EmitEvent(sdk.NewEvent("notification",
		sdk.NewAttribute("uid", uid),
		sdk.NewAttribute("type", notifType),
		sdk.NewAttribute("title", title),
	))
}

// GetNotifications retrieves unread notifications for a UID.
func (k Keeper) GetNotifications(ctx sdk.Context, uid string, limit int, includeRead bool) []Notification {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("notif/%s/", uid))
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var notifs []Notification
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var n Notification
		if err := json.Unmarshal(iterator.Value(), &n); err != nil {
			continue
		}
		if !includeRead && n.Read {
			continue
		}
		notifs = append(notifs, n)
		count++
	}
	return notifs
}

// MarkNotificationRead marks a notification as read.
func (k Keeper) MarkNotificationRead(ctx sdk.Context, uid string, notifID string) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("notif/%s/", uid))
	iterator := store.Iterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var n Notification
		if err := json.Unmarshal(iterator.Value(), &n); err != nil {
			continue
		}
		if n.ID == notifID {
			n.Read = true
			bz, _ := json.Marshal(n)
			store.Set(iterator.Key(), bz)
			return
		}
	}
}

// ─── Trigger Functions (called from EndBlock or event handlers) ───

// NotifyGratitudeReceived sends notification when gratitude OTK is received.
func (k Keeper) NotifyGratitudeReceived(ctx sdk.Context, recipientUID, senderUID, channel string, amount int64) {
	otkAmount := float64(amount) / 1_000_000
	k.EmitNotification(ctx, recipientUID,
		"gratitude", "important",
		"Gratitude Received!",
		fmt.Sprintf("You received %.2f %s OTK from %s...%s", otkAmount, channel, senderUID[:8], senderUID[len(senderUID)-4:]),
		"openwallet://screen/gratitude-wall",
	)
}

// NotifyMilestoneVerified sends notification when a milestone is verified.
func (k Keeper) NotifyMilestoneVerified(ctx sdk.Context, uid, milestoneID, channel string, amount int64) {
	otkAmount := float64(amount) / 1_000_000
	k.EmitNotification(ctx, uid,
		"milestone", "important",
		"Milestone Verified!",
		fmt.Sprintf("Your milestone was verified! %.2f %s OTK minted.", otkAmount, channel),
		"openwallet://screen/achievements",
	)
}

// NotifyProposalCreated sends notification to all UIDs about a new governance proposal.
func (k Keeper) NotifyProposalCreated(ctx sdk.Context, uid, proposalTitle string, proposalID uint64) {
	k.EmitNotification(ctx, uid,
		"governance", "normal",
		"New Proposal: "+proposalTitle,
		fmt.Sprintf("Proposal #%d needs your vote. One human, one vote.", proposalID),
		fmt.Sprintf("openwallet://screen/governance?proposalId=%d", proposalID),
	)
}

// NotifyEmergencyAlert sends urgent notification for emergencies.
func (k Keeper) NotifyEmergencyAlert(ctx sdk.Context, uid, alertType, description, region string) {
	k.EmitNotification(ctx, uid,
		"safety", "urgent",
		fmt.Sprintf("ALERT: %s in %s", alertType, region),
		description,
		"openwallet://screen/disaster-response",
	)
}

// NotifyIncomingTransfer sends notification for OTK received.
func (k Keeper) NotifyIncomingTransfer(ctx sdk.Context, recipientUID, senderUID, denom string, amount int64) {
	otkAmount := float64(amount) / 1_000_000
	k.EmitNotification(ctx, recipientUID,
		"transaction", "normal",
		"OTK Received",
		fmt.Sprintf("%.2f %s received from %s...%s", otkAmount, denom, senderUID[:8], senderUID[len(senderUID)-4:]),
		"openwallet://screen/living-ledger",
	)
}

// NotifySwapCompleted sends notification when an atomic swap completes.
func (k Keeper) NotifySwapCompleted(ctx sdk.Context, uid, fromSymbol, toSymbol string, fromAmount, toAmount float64) {
	k.EmitNotification(ctx, uid,
		"transaction", "important",
		"Swap Completed!",
		fmt.Sprintf("%.4f %s swapped to %.4f %s", fromAmount, fromSymbol, toAmount, toSymbol),
		"openwallet://screen/swap",
	)
}

// NotifyCleanupDrive sends community notification for upcoming cleanup.
func (k Keeper) NotifyCleanupDrive(ctx sdk.Context, uid, driveName, location string) {
	k.EmitNotification(ctx, uid,
		"community", "normal",
		"Cleanup Drive: "+driveName,
		"Join the community cleanup at "+location+". Earn cOTK!",
		"openwallet://screen/cleanup-drive",
	)
}
