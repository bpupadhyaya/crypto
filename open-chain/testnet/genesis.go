// Package testnet provides tools for generating multi-node testnet configurations.
//
// GenerateTestnet creates genesis.json + validator keys for N nodes.
// Each node gets:
//   - A validator key pair (ed25519)
//   - A funded account with initial OTK balance
//   - A registered Universal ID
//
// The genesis includes:
//   - All N validators with equal voting power
//   - Initial OTK supply distributed equally
//   - Registered UIDs for all validators
//   - Chain parameters (block time, max validators, etc.)

package testnet

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/cosmos/cosmos-sdk/crypto/hd"
	"github.com/cosmos/go-bip39"
)

// TestnetConfig configures the testnet generation.
type TestnetConfig struct {
	ChainID        string
	NumValidators  int
	InitialBalance int64  // OTK per validator (in uotk)
	BlockTime      string // e.g., "5s"
	OutputDir      string
}

// ValidatorInfo holds all info for a single testnet validator node.
type ValidatorInfo struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	PubKey  string `json:"pub_key"`
	PrivKey string `json:"priv_key"` // only for testing -- never store in production
	NodeID  string `json:"node_id"`
	P2PPort int    `json:"p2p_port"`
	RPCPort int    `json:"rpc_port"`
	Mnemonic string `json:"mnemonic"`
}

// GenesisDoc represents the genesis.json structure for the testnet.
type GenesisDoc struct {
	GenesisTime   string              `json:"genesis_time"`
	ChainID       string              `json:"chain_id"`
	ConsensusParams ConsensusParams   `json:"consensus_params"`
	Validators    []GenesisValidator  `json:"validators"`
	AppState      GenesisAppState     `json:"app_state"`
}

// ConsensusParams holds chain-level consensus parameters.
type ConsensusParams struct {
	Block    BlockParams    `json:"block"`
	Evidence EvidenceParams `json:"evidence"`
	Validator ValidatorParams `json:"validator"`
}

// BlockParams configures block production.
type BlockParams struct {
	MaxBytes   string `json:"max_bytes"`
	MaxGas     string `json:"max_gas"`
	TimeIotaMs string `json:"time_iota_ms"`
}

// EvidenceParams configures evidence handling.
type EvidenceParams struct {
	MaxAgeNumBlocks string `json:"max_age_num_blocks"`
	MaxAgeDuration  string `json:"max_age_duration"`
}

// ValidatorParams configures allowed validator key types.
type ValidatorParams struct {
	PubKeyTypes []string `json:"pub_key_types"`
}

// GenesisValidator is a validator entry in genesis.
type GenesisValidator struct {
	Address string            `json:"address"`
	PubKey  GenesisValidatorPubKey `json:"pub_key"`
	Power   string            `json:"power"`
	Name    string            `json:"name"`
}

// GenesisValidatorPubKey holds the validator's public key.
type GenesisValidatorPubKey struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// GenesisAppState holds the initial application state.
type GenesisAppState struct {
	Accounts []GenesisAccount `json:"accounts"`
	UIDs     []GenesisUID     `json:"uids"`
	OTK      GenesisOTK       `json:"otk"`
}

// GenesisAccount is a funded account in genesis.
type GenesisAccount struct {
	Address string `json:"address"`
	Balance int64  `json:"balance"`
	Denom   string `json:"denom"`
}

// GenesisUID is a registered Universal ID in genesis.
type GenesisUID struct {
	UID     string `json:"uid"`
	Address string `json:"address"`
	Name    string `json:"name"`
}

// GenesisOTK holds the OTK module genesis state.
type GenesisOTK struct {
	InitialSupply int64 `json:"initial_supply"`
	MaxValidators int   `json:"max_validators"`
}

// DefaultTestnetConfig returns a sensible default for a 10-node testnet.
func DefaultTestnetConfig() TestnetConfig {
	return TestnetConfig{
		ChainID:        "openchain-testnet-1",
		NumValidators:  10,
		InitialBalance: 1000000000, // 1000 OTK per validator
		BlockTime:      "5s",
		OutputDir:      "./.testnet",
	}
}

// GenerateTestnet creates genesis.json + validator keys for N nodes.
func GenerateTestnet(config TestnetConfig) ([]ValidatorInfo, error) {
	if config.NumValidators <= 0 {
		return nil, fmt.Errorf("num_validators must be > 0, got %d", config.NumValidators)
	}
	if config.ChainID == "" {
		config.ChainID = "openchain-testnet-1"
	}
	if config.OutputDir == "" {
		config.OutputDir = "./.testnet"
	}
	if config.InitialBalance <= 0 {
		config.InitialBalance = 1000000000
	}
	if config.BlockTime == "" {
		config.BlockTime = "5s"
	}

	// Create output directory
	if err := os.MkdirAll(config.OutputDir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create output dir: %w", err)
	}

	validators := make([]ValidatorInfo, config.NumValidators)

	for i := 0; i < config.NumValidators; i++ {
		val, err := generateValidator(i)
		if err != nil {
			return nil, fmt.Errorf("failed to generate validator %d: %w", i, err)
		}
		validators[i] = val
	}

	// Generate genesis document
	genesis, err := generateGenesis(config, validators)
	if err != nil {
		return nil, fmt.Errorf("failed to generate genesis: %w", err)
	}

	// Write genesis.json
	genesisBytes, err := json.MarshalIndent(genesis, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to marshal genesis: %w", err)
	}

	genesisPath := filepath.Join(config.OutputDir, "genesis.json")
	if err := os.WriteFile(genesisPath, genesisBytes, 0o644); err != nil {
		return nil, fmt.Errorf("failed to write genesis.json: %w", err)
	}

	// Write per-node directories
	for i, val := range validators {
		nodeDir := filepath.Join(config.OutputDir, fmt.Sprintf("node%d", i))
		if err := os.MkdirAll(filepath.Join(nodeDir, "config"), 0o755); err != nil {
			return nil, fmt.Errorf("failed to create node%d dir: %w", i, err)
		}

		// Copy genesis to each node
		nodeGenesisPath := filepath.Join(nodeDir, "config", "genesis.json")
		if err := os.WriteFile(nodeGenesisPath, genesisBytes, 0o644); err != nil {
			return nil, fmt.Errorf("failed to write node%d genesis: %w", i, err)
		}

		// Write validator key info
		valBytes, err := json.MarshalIndent(val, "", "  ")
		if err != nil {
			return nil, err
		}
		keyPath := filepath.Join(nodeDir, "config", "validator_key.json")
		if err := os.WriteFile(keyPath, valBytes, 0o600); err != nil {
			return nil, fmt.Errorf("failed to write node%d key: %w", i, err)
		}

		// Write persistent peers config
		peersConfig := GeneratePeerConfig(validators)
		configMap := GeneratePhoneConfig(val, validators, fmt.Sprintf("192.168.1.%d", 10+i))
		configMap["persistent_peers"] = peersConfig

		configBytes, err := json.MarshalIndent(configMap, "", "  ")
		if err != nil {
			return nil, err
		}
		configPath := filepath.Join(nodeDir, "config", "peers.json")
		if err := os.WriteFile(configPath, configBytes, 0o644); err != nil {
			return nil, fmt.Errorf("failed to write node%d peers config: %w", i, err)
		}
	}

	return validators, nil
}

// generateValidator creates a single validator with keys and ports.
func generateValidator(index int) (ValidatorInfo, error) {
	// Generate ed25519 key pair
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return ValidatorInfo{}, fmt.Errorf("key generation failed: %w", err)
	}

	// Generate mnemonic for key recovery
	entropy, err := bip39.NewEntropy(256)
	if err != nil {
		return ValidatorInfo{}, fmt.Errorf("entropy generation failed: %w", err)
	}
	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		return ValidatorInfo{}, fmt.Errorf("mnemonic generation failed: %w", err)
	}

	// Derive address from mnemonic using Cosmos HD path
	seed := bip39.NewSeed(mnemonic, "")
	master, ch := hd.ComputeMastersFromSeed(seed)
	derivedPriv, err := hd.DerivePrivateKeyForPath(master, ch, "m/44'/118'/0'/0/0")
	if err != nil {
		return ValidatorInfo{}, fmt.Errorf("key derivation failed: %w", err)
	}
	_ = derivedPriv // We use the ed25519 key for validator identity

	// NodeID is the first 20 bytes of the public key hex
	nodeID := hex.EncodeToString(pub[:20])

	// Address is the hex of the full public key (simplified for testnet)
	address := hex.EncodeToString(pub)

	return ValidatorInfo{
		Name:     fmt.Sprintf("validator-%d", index),
		Address:  address,
		PubKey:   hex.EncodeToString(pub),
		PrivKey:  hex.EncodeToString(priv),
		NodeID:   nodeID,
		P2PPort:  26656 + (index * 10),
		RPCPort:  26657 + (index * 10),
		Mnemonic: mnemonic,
	}, nil
}

// generateGenesis creates the genesis document for the testnet.
func generateGenesis(config TestnetConfig, validators []ValidatorInfo) (*GenesisDoc, error) {
	genValidators := make([]GenesisValidator, len(validators))
	accounts := make([]GenesisAccount, len(validators))
	uids := make([]GenesisUID, len(validators))

	for i, val := range validators {
		genValidators[i] = GenesisValidator{
			Address: val.Address,
			PubKey: GenesisValidatorPubKey{
				Type:  "ed25519",
				Value: val.PubKey,
			},
			Power: "10", // Equal voting power for all validators
			Name:  val.Name,
		}
		accounts[i] = GenesisAccount{
			Address: val.Address,
			Balance: config.InitialBalance,
			Denom:   "uotk",
		}
		uids[i] = GenesisUID{
			UID:     fmt.Sprintf("uid-%s", val.NodeID[:8]),
			Address: val.Address,
			Name:    val.Name,
		}
	}

	genesis := &GenesisDoc{
		GenesisTime: time.Now().UTC().Format(time.RFC3339),
		ChainID:     config.ChainID,
		ConsensusParams: ConsensusParams{
			Block: BlockParams{
				MaxBytes:   "22020096",
				MaxGas:     "-1",
				TimeIotaMs: "1000",
			},
			Evidence: EvidenceParams{
				MaxAgeNumBlocks: "100000",
				MaxAgeDuration:  "172800000000000",
			},
			Validator: ValidatorParams{
				PubKeyTypes: []string{"ed25519"},
			},
		},
		Validators: genValidators,
		AppState: GenesisAppState{
			Accounts: accounts,
			UIDs:     uids,
			OTK: GenesisOTK{
				InitialSupply: config.InitialBalance * int64(config.NumValidators),
				MaxValidators: config.NumValidators,
			},
		},
	}

	return genesis, nil
}
