package cmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"openchain/testnet"
)

const (
	flagChainIDGen       = "chain-id"
	flagNumValidatorsGen = "num-validators"
	flagInitialBalance   = "initial-balance"
	flagBlockTimeGen     = "block-time"
	flagOutputDirGen     = "output-dir"
)

// NewTestnetGenerateCmd returns a cobra command that generates a multi-node
// testnet configuration using the Open Chain testnet package.
// This creates genesis.json, validator keys, and per-node config files
// suitable for copying to phones or running locally.
func NewTestnetGenerateCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "testnet generate",
		Short: "Generate a multi-node Open Chain testnet (genesis + validator keys + per-node configs)",
		Long: `Generates a complete testnet configuration for N validator nodes.

Each node gets:
  - A validator key pair (ed25519)
  - A funded account with initial OTK balance
  - A registered Universal ID
  - Per-node config with persistent peers list

The genesis includes all N validators with equal voting power and
initial OTK supply distributed equally (no pre-mine beyond test funds).

Output structure:
  <output-dir>/
    genesis.json          — shared genesis for all nodes
    node0/config/         — validator 0 config
    node1/config/         — validator 1 config
    ...

Example:
  openchaind testnet generate --num-validators 10 --chain-id openchain-testnet-1 --output-dir ./.testnet`,
		RunE: func(cmd *cobra.Command, args []string) error {
			chainID, _ := cmd.Flags().GetString(flagChainIDGen)
			numValidators, _ := cmd.Flags().GetInt(flagNumValidatorsGen)
			initialBalance, _ := cmd.Flags().GetInt64(flagInitialBalance)
			blockTime, _ := cmd.Flags().GetString(flagBlockTimeGen)
			outputDir, _ := cmd.Flags().GetString(flagOutputDirGen)

			config := testnet.TestnetConfig{
				ChainID:        chainID,
				NumValidators:  numValidators,
				InitialBalance: initialBalance,
				BlockTime:      blockTime,
				OutputDir:      outputDir,
			}

			cmd.Printf("Generating %d-node testnet (chain: %s)...\n", numValidators, chainID)

			validators, err := testnet.GenerateTestnet(config)
			if err != nil {
				return fmt.Errorf("testnet generation failed: %w", err)
			}

			// Print summary
			cmd.Printf("\nSuccessfully generated testnet with %d validators:\n\n", len(validators))
			for i, val := range validators {
				cmd.Printf("  Node %d: %s\n", i, val.Name)
				cmd.Printf("    NodeID:  %s\n", val.NodeID)
				cmd.Printf("    P2P:     :%d\n", val.P2PPort)
				cmd.Printf("    RPC:     :%d\n", val.RPCPort)
				cmd.Printf("    Address: %s...\n", val.Address[:16])
				cmd.Println()
			}

			cmd.Printf("Output directory: %s\n", outputDir)
			cmd.Printf("Genesis file:     %s/genesis.json\n", outputDir)

			// Also output JSON summary for scripting
			if verbose, _ := cmd.Flags().GetBool("json"); verbose {
				summary, _ := json.MarshalIndent(validators, "", "  ")
				cmd.Println(string(summary))
			}

			return nil
		},
	}

	cmd.Flags().String(flagChainIDGen, "openchain-testnet-1", "Chain ID for the testnet")
	cmd.Flags().Int(flagNumValidatorsGen, 10, "Number of validator nodes to generate")
	cmd.Flags().Int64(flagInitialBalance, 1000000000, "Initial OTK balance per validator (in uotk)")
	cmd.Flags().String(flagBlockTimeGen, "5s", "Target block time")
	cmd.Flags().String(flagOutputDirGen, "./.testnet", "Output directory for testnet files")
	cmd.Flags().Bool("json", false, "Output validator info as JSON")

	return cmd
}
