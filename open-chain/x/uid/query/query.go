// Package query defines the UID module's query types.
//
// Queries:
//   - QueryUID: Get Universal ID by address
//   - QueryUIDByProof: Lookup UID by proof hash
//   - QueryDisclosures: List selective disclosure claims for a UID

package query

import (
	"openchain/x/uid/types"
)

// QueryUIDRequest queries a Universal ID by account address.
type QueryUIDRequest struct {
	Address string `json:"address"`
}

type QueryUIDResponse struct {
	UID *types.UniversalID `json:"uid"`
}

// QueryDisclosuresRequest lists selective disclosures for a UID.
type QueryDisclosuresRequest struct {
	UID string `json:"uid"`
}

type QueryDisclosuresResponse struct {
	Disclosures []types.SelectiveDisclosure `json:"disclosures"`
}

// QueryUIDCountRequest returns total number of registered UIDs.
type QueryUIDCountRequest struct{}

type QueryUIDCountResponse struct {
	Count int64 `json:"count"`
}
