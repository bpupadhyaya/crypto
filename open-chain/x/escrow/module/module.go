// Package module defines the Escrow AppModule for Cosmos SDK integration.

package module

import (
	"encoding/json"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"

	"openchain/x/escrow/keeper"
	"openchain/x/escrow/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

type AppModuleBasic struct{}

func (AppModuleBasic) Name() string                                                          { return types.ModuleName }
func (AppModuleBasic) RegisterLegacyAminoCodec(_ *codec.LegacyAmino)                         {}
func (AppModuleBasic) RegisterInterfaces(_ cdctypes.InterfaceRegistry)                        {}
func (AppModuleBasic) RegisterGRPCGatewayRoutes(_ client.Context, _ *runtime.ServeMux)        {}
func (AppModuleBasic) DefaultGenesis(_ codec.JSONCodec) json.RawMessage                       { return []byte("{}") }
func (AppModuleBasic) ValidateGenesis(_ codec.JSONCodec, _ client.TxEncodingConfig, _ json.RawMessage) error { return nil }

type AppModule struct {
	AppModuleBasic
	keeper *keeper.Keeper
}

func NewAppModule(cdc codec.Codec, keeper *keeper.Keeper) AppModule {
	return AppModule{AppModuleBasic: AppModuleBasic{}, keeper: keeper}
}

func (am AppModule) RegisterServices(_ module.Configurator) {}
func (am AppModule) InitGenesis(ctx sdk.Context, _ codec.JSONCodec, _ json.RawMessage) {
	// Escrow module initialized — no pre-configured escrows at genesis
	ctx.Logger().Info("Escrow module initialized")
}
func (am AppModule) ExportGenesis(_ sdk.Context, _ codec.JSONCodec) json.RawMessage { return []byte("{}") }
func (am AppModule) ConsensusVersion() uint64 { return 1 }
func (am AppModule) BeginBlock(_ sdk.Context) {}
func (am AppModule) EndBlock(_ sdk.Context)   {}
func (am AppModule) IsOnePerModuleType()      {}
func (am AppModule) IsAppModule()             {}
