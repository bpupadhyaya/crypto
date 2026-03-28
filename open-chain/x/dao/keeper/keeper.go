package keeper

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"

	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"

	"openchain/x/dao/types"
)

type Keeper struct {
	cdc      codec.Codec
	storeKey storetypes.StoreKey
	bank     bankkeeper.Keeper
}

func NewKeeper(cdc codec.Codec, storeKey storetypes.StoreKey, bank bankkeeper.Keeper) *Keeper {
	return &Keeper{cdc: cdc, storeKey: storeKey, bank: bank}
}

// CreateDAO creates a new DAO.
func (k Keeper) CreateDAO(ctx sdk.Context, dao types.DAO) error {
	if dao.Name == "" || dao.Creator == "" {
		return fmt.Errorf("name and creator required")
	}
	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%d", dao.Name, dao.Creator, ctx.BlockHeight())))
	dao.ID = fmt.Sprintf("dao_%x", hash[:8])
	dao.CreatedAt = ctx.BlockHeight()
	dao.Members = append(dao.Members, dao.Creator)
	dao.Admins = []string{dao.Creator}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(dao)
	store.Set([]byte("dao/"+dao.ID), bz)

	// Index by member
	for _, m := range dao.Members {
		k.addMemberIndex(ctx, m, dao.ID)
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent("dao_created",
		sdk.NewAttribute("dao_id", dao.ID),
		sdk.NewAttribute("name", dao.Name),
		sdk.NewAttribute("creator", dao.Creator),
	))
	return nil
}

// GetDAO retrieves a DAO by ID.
func (k Keeper) GetDAO(ctx sdk.Context, daoID string) (*types.DAO, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("dao/" + daoID))
	if bz == nil {
		return nil, fmt.Errorf("DAO %s not found", daoID)
	}
	var dao types.DAO
	_ = json.Unmarshal(bz, &dao)
	return &dao, nil
}

// GetDAOsByMember returns all DAOs a user is a member of.
func (k Keeper) GetDAOsByMember(ctx sdk.Context, member string) ([]types.DAO, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("member_daos/" + member))
	if bz == nil {
		return []types.DAO{}, nil
	}
	var daoIDs []string
	_ = json.Unmarshal(bz, &daoIDs)

	var daos []types.DAO
	for _, id := range daoIDs {
		dao, err := k.GetDAO(ctx, id)
		if err == nil {
			daos = append(daos, *dao)
		}
	}
	return daos, nil
}

// CreateProposal creates a new proposal in a DAO.
func (k Keeper) CreateProposal(ctx sdk.Context, prop types.DAOProposal) error {
	dao, err := k.GetDAO(ctx, prop.DAOID)
	if err != nil {
		return err
	}

	// Check proposer is a member
	isMember := false
	for _, m := range dao.Members {
		if m == prop.Proposer {
			isMember = true
			break
		}
	}
	if !isMember {
		return fmt.Errorf("proposer %s is not a member of DAO %s", prop.Proposer, prop.DAOID)
	}

	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%d", prop.DAOID, prop.Title, ctx.BlockHeight())))
	prop.ID = fmt.Sprintf("dprop_%x", hash[:8])
	prop.Status = "voting"
	prop.CreatedAt = ctx.BlockHeight()
	prop.EndsAt = ctx.BlockHeight() + 50400 // ~3.5 days

	dao.ProposalCount++
	k.setDAO(ctx, dao)

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(prop)
	store.Set([]byte(fmt.Sprintf("dao_prop/%s/%s", prop.DAOID, prop.ID)), bz)
	return nil
}

// VoteOnProposal records a vote on a DAO proposal.
func (k Keeper) VoteOnProposal(ctx sdk.Context, daoID, propID, voter, vote string) error {
	dao, err := k.GetDAO(ctx, daoID)
	if err != nil {
		return err
	}

	isMember := false
	for _, m := range dao.Members {
		if m == voter {
			isMember = true
			break
		}
	}
	if !isMember {
		return fmt.Errorf("voter is not a DAO member")
	}

	prop, err := k.getProposal(ctx, daoID, propID)
	if err != nil {
		return err
	}
	if prop.Status != "voting" {
		return fmt.Errorf("proposal is not in voting status")
	}

	switch vote {
	case "yes":
		prop.YesVotes++
	case "no":
		prop.NoVotes++
	case "abstain":
		prop.AbstainVotes++
	default:
		return fmt.Errorf("invalid vote: %s", vote)
	}

	// Check if threshold met (>50% of members)
	totalVotes := prop.YesVotes + prop.NoVotes + prop.AbstainVotes
	memberCount := int64(len(dao.Members))
	if totalVotes*2 >= memberCount { // quorum: 50%
		if prop.YesVotes > prop.NoVotes {
			prop.Status = "passed"
		} else {
			prop.Status = "rejected"
		}
	}

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(prop)
	store.Set([]byte(fmt.Sprintf("dao_prop/%s/%s", daoID, propID)), bz)
	return nil
}

func (k Keeper) getProposal(ctx sdk.Context, daoID, propID string) (*types.DAOProposal, error) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte(fmt.Sprintf("dao_prop/%s/%s", daoID, propID)))
	if bz == nil {
		return nil, fmt.Errorf("proposal not found")
	}
	var prop types.DAOProposal
	_ = json.Unmarshal(bz, &prop)
	return &prop, nil
}

func (k Keeper) setDAO(ctx sdk.Context, dao *types.DAO) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(dao)
	store.Set([]byte("dao/"+dao.ID), bz)
}

func (k Keeper) addMemberIndex(ctx sdk.Context, member, daoID string) {
	store := ctx.KVStore(k.storeKey)
	key := []byte("member_daos/" + member)
	var ids []string
	if bz := store.Get(key); bz != nil {
		_ = json.Unmarshal(bz, &ids)
	}
	ids = append(ids, daoID)
	bz, _ := json.Marshal(ids)
	store.Set(key, bz)
}
