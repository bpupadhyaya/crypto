// Package keeper implements the Messaging module state management.

package keeper

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"openchain/x/messaging/types"
)

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey}
}

// SendMessage stores an encrypted message on-chain.
func (k Keeper) SendMessage(ctx sdk.Context, msg types.Message) error {
	if msg.FromUID == "" || msg.ToUID == "" || msg.EncryptedBody == "" {
		return fmt.Errorf("from, to, and encrypted body are required")
	}

	// Generate message ID
	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%d:%s", msg.FromUID, msg.ToUID, ctx.BlockHeight(), msg.Nonce)))
	msg.ID = fmt.Sprintf("msg_%x", hash[:16])
	msg.Timestamp = ctx.BlockHeight()
	msg.Read = false

	// Store message
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("message/%s/%s/%d", msg.ToUID, msg.FromUID, msg.Timestamp))
	bz, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	store.Set(key, bz)

	// Also store by sender for sent messages view
	sentKey := []byte(fmt.Sprintf("sent/%s/%s/%d", msg.FromUID, msg.ToUID, msg.Timestamp))
	store.Set(sentKey, bz)

	// Update conversation
	k.updateConversation(ctx, msg.FromUID, msg.ToUID, msg.Timestamp)

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"message_sent",
		sdk.NewAttribute("from", msg.FromUID),
		sdk.NewAttribute("to", msg.ToUID),
		sdk.NewAttribute("message_id", msg.ID),
	))

	return nil
}

// GetMessages returns messages for a UID (inbox).
func (k Keeper) GetMessages(ctx sdk.Context, uid string, limit int) ([]types.Message, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("message/%s/", uid))
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var messages []types.Message
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var msg types.Message
		if err := json.Unmarshal(iterator.Value(), &msg); err != nil {
			continue
		}
		messages = append(messages, msg)
		count++
	}
	return messages, nil
}

// GetConversations returns active conversations for a UID.
func (k Keeper) GetConversations(ctx sdk.Context, uid string) ([]types.Conversation, error) {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("conversation/%s/", uid))
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var convos []types.Conversation
	for ; iterator.Valid(); iterator.Next() {
		var c types.Conversation
		if err := json.Unmarshal(iterator.Value(), &c); err != nil {
			continue
		}
		convos = append(convos, c)
	}
	return convos, nil
}

func (k Keeper) updateConversation(ctx sdk.Context, fromUID, toUID string, blockHeight int64) {
	store := ctx.KVStore(k.storeKey)

	// Normalize key so both participants see the same conversation
	p1, p2 := fromUID, toUID
	if p1 > p2 {
		p1, p2 = p2, p1
	}

	key1 := []byte(fmt.Sprintf("conversation/%s/%s", p1, p2))
	key2 := []byte(fmt.Sprintf("conversation/%s/%s", p2, p1))

	var convo types.Conversation
	bz := store.Get(key1)
	if bz != nil {
		_ = json.Unmarshal(bz, &convo)
	}

	convo.Participants = [2]string{p1, p2}
	convo.LastAt = blockHeight
	convo.MessageCount++

	data, _ := json.Marshal(convo)
	store.Set(key1, data)
	store.Set(key2, data)
}
