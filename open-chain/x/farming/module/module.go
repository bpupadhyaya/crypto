package module

import (
	"encoding/json"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"

	"openchain/x/farming/keeper"
	"openchain/x/farming/types"
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
func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage                     { return cdc.MustMarshalJSON(types.DefaultGenesisState()) }
func (AppModuleBasic) ValidateGenesis(_ codec.JSONCodec, _ client.TxEncodingConfig, _ json.RawMessage) error { return nil }

type AppModule struct {
	AppModuleBasic
	keeper *keeper.Keeper
}

func NewAppModule(cdc codec.Codec, keeper *keeper.Keeper) AppModule {
	return AppModule{AppModuleBasic: AppModuleBasic{}, keeper: keeper}
}

func (am AppModule) RegisterServices(_ module.Configurator) {}

func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, data json.RawMessage) {
	// Initialize default yield farms from genesis state
	for _, farm := range types.DefaultGenesisState().Farms {
		am.keeper.InitFarm(ctx, &farm)
	}
}

func (am AppModule) ExportGenesis(_ sdk.Context, cdc codec.JSONCodec) json.RawMessage { return cdc.MustMarshalJSON(types.DefaultGenesisState()) }
func (am AppModule) ConsensusVersion() uint64 { return 1 }
func (am AppModule) BeginBlock(_ sdk.Context) {}

// EndBlock — no per-block work needed for the farming module.
// Yield farming rewards are calculated lazily on ClaimRewards based on
// the staker's share of the pool and elapsed blocks since their last claim.
// This avoids O(stakers) iteration every block.
func (am AppModule) EndBlock(_ sdk.Context) {}

func (am AppModule) IsOnePerModuleType() {}
func (am AppModule) IsAppModule()        {}
