// Package keeper — Community Events Backend.
//
// Unified event system that powers the CalendarScreen and feeds into
// all community screens. Events from governance, health, education,
// culture, sports, environment, worship are tracked here.

package keeper

import (
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// CommunityEvent represents any community event.
type CommunityEvent struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"` // governance, health, education, community, sports, culture, worship, environment, personal
	Region      string   `json:"region"`
	Location    string   `json:"location"`
	StartBlock  int64    `json:"start_block"`  // approximate block height
	EndBlock    int64    `json:"end_block"`
	OrganizerID string   `json:"organizer_id"` // UID
	Attendees   int64    `json:"attendees"`
	MaxCapacity int64    `json:"max_capacity"` // 0 = unlimited
	OTKReward   int64    `json:"otk_reward"`   // reward for attending
	Channel     string   `json:"channel"`      // which OTK channel
	Tags        []string `json:"tags"`
	Status      string   `json:"status"` // upcoming, active, completed, cancelled
	CreatedAt   int64    `json:"created_at"`
}

// CreateEvent registers a new community event.
func (k Keeper) CreateEvent(ctx sdk.Context, event CommunityEvent) (*CommunityEvent, error) {
	if event.Title == "" || event.OrganizerID == "" {
		return nil, fmt.Errorf("title and organizer required")
	}

	event.Status = "upcoming"
	event.CreatedAt = ctx.BlockHeight()
	if event.ID == "" {
		event.ID = fmt.Sprintf("evt_%s_%d", event.Category, ctx.BlockHeight())
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(event)
	store.Set([]byte("event/"+event.ID), bz)

	// Index by category
	catKey := fmt.Sprintf("event_cat/%s/%s", event.Category, event.ID)
	store.Set([]byte(catKey), []byte(event.ID))

	// Index by region
	regKey := fmt.Sprintf("event_reg/%s/%s", event.Region, event.ID)
	store.Set([]byte(regKey), []byte(event.ID))

	ctx.EventManager().EmitEvent(sdk.NewEvent("community_event_created",
		sdk.NewAttribute("id", event.ID),
		sdk.NewAttribute("title", event.Title),
		sdk.NewAttribute("category", event.Category),
	))

	return &event, nil
}

// RSVPEvent records an attendee RSVP.
func (k Keeper) RSVPEvent(ctx sdk.Context, eventID, uid string) error {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("event/" + eventID))
	if bz == nil {
		return fmt.Errorf("event not found")
	}

	var event CommunityEvent
	_ = json.Unmarshal(bz, &event)

	if event.MaxCapacity > 0 && event.Attendees >= event.MaxCapacity {
		return fmt.Errorf("event is full")
	}

	event.Attendees++
	updBz, _ := json.Marshal(event)
	store.Set([]byte("event/"+eventID), updBz)

	// Record RSVP
	rsvpKey := fmt.Sprintf("event_rsvp/%s/%s", eventID, uid)
	store.Set([]byte(rsvpKey), []byte("confirmed"))

	return nil
}

// GetUpcomingEvents returns upcoming events, optionally filtered by category.
func (k Keeper) GetUpcomingEvents(ctx sdk.Context, category string, limit int) []CommunityEvent {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte("event/")
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var events []CommunityEvent
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		var event CommunityEvent
		if err := json.Unmarshal(iterator.Value(), &event); err != nil {
			continue
		}
		if event.Status != "upcoming" && event.Status != "active" {
			continue
		}
		if category != "" && event.Category != category {
			continue
		}
		events = append(events, event)
		count++
	}
	return events
}

// GetEventsByRegion returns events for a specific region.
func (k Keeper) GetEventsByRegion(ctx sdk.Context, region string, limit int) []CommunityEvent {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("event_reg/%s/", region))
	iterator := store.ReverseIterator(prefix, storetypes.PrefixEndBytes(prefix))
	defer iterator.Close()

	var events []CommunityEvent
	count := 0
	for ; iterator.Valid() && count < limit; iterator.Next() {
		eventID := string(iterator.Value())
		eventBz := store.Get([]byte("event/" + eventID))
		if eventBz == nil {
			continue
		}
		var event CommunityEvent
		if err := json.Unmarshal(eventBz, &event); err != nil {
			continue
		}
		events = append(events, event)
		count++
	}
	return events
}
