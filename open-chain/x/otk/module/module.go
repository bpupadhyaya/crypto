// Package module defines the OTK AppModule for integration with Cosmos SDK.

package module

import (
	"encoding/json"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"

	"openchain/x/otk/keeper"
	"openchain/x/otk/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

// AppModuleBasic implements the AppModuleBasic interface for the OTK module.
type AppModuleBasic struct{}

func (AppModuleBasic) Name() string { return types.ModuleName }

func (AppModuleBasic) RegisterLegacyAminoCodec(_ *codec.LegacyAmino) {}

func (AppModuleBasic) RegisterInterfaces(_ cdctypes.InterfaceRegistry) {}

func (AppModuleBasic) RegisterGRPCGatewayRoutes(_ client.Context, _ *runtime.ServeMux) {}

func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(types.DefaultGenesisState())
}

func (AppModuleBasic) ValidateGenesis(_ codec.JSONCodec, _ client.TxEncodingConfig, _ json.RawMessage) error {
	return nil
}

// AppModule implements the AppModule interface for the OTK module.
type AppModule struct {
	AppModuleBasic
	keeper *keeper.Keeper
}

func NewAppModule(cdc codec.Codec, keeper *keeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: AppModuleBasic{},
		keeper:         keeper,
	}
}

func (am AppModule) RegisterServices(_ module.Configurator) {}

func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, data json.RawMessage) {
	// No pre-mine — genesis is empty per Human Constitution Article III
}

func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(types.DefaultGenesisState())
}

func (am AppModule) ConsensusVersion() uint64 { return 1 }

func (am AppModule) BeginBlock(ctx sdk.Context) {}

// EndBlock checks for verified milestones and triggers minting,
// distributes staking rewards, and slashes inaccurate verifiers.
// This is the ABCI lifecycle hook that wires P2P minting consensus
// into the block production cycle:
//  1. Expire old milestones past their verification window
//  2. Process verified milestones — mint OTK for those that reached attestation threshold
//  3. Distribute staking rewards (every N blocks)
//  4. Slash inaccurate verifiers (suspend those below accuracy threshold)
func (am AppModule) EndBlock(ctx sdk.Context) {
	// Expire old milestones
	am.keeper.ExpireOldMilestones(ctx)
	// Check verified milestones and mint OTK
	am.keeper.ProcessVerifiedMilestones(ctx)
	// Distribute staking rewards (internally checks block interval)
	_ = am.keeper.DistributeStakingRewards(ctx)
	// Slash verifiers with accuracy below threshold
	am.keeper.SlashInaccurateVerifiers(ctx)
}

func (am AppModule) IsOnePerModuleType() {}

func (am AppModule) IsAppModule() {}
