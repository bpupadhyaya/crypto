// Package cmd — Open Chain custom CLI commands.
//
// Adds query and tx commands for all Open Chain custom modules.
// These extend the standard Cosmos SDK CLI with Human Constitution features.

package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// AddOpenChainCommands adds custom query and tx commands to the root.
func AddOpenChainCommands(rootCmd *cobra.Command) {
	rootCmd.AddCommand(
		openChainQueryCmd(),
		openChainTxCmd(),
		openChainInfoCmd(),
	)
}

// ─── Info Command ───

func openChainInfoCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "info",
		Short: "Display Open Chain information",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("╔═══════════════════════════════════════════════╗")
			fmt.Println("║           Open Chain v0.5.0-alpha             ║")
			fmt.Println("║     Built for The Human Constitution          ║")
			fmt.Println("╠═══════════════════════════════════════════════╣")
			fmt.Println("║  277 screens  │  68 API endpoints             ║")
			fmt.Println("║  10 languages │  8 swap options               ║")
			fmt.Println("║  30 OTK keepers │ 10 Articles implemented    ║")
			fmt.Println("╠═══════════════════════════════════════════════╣")
			fmt.Println("║  Value Channels:                              ║")
			fmt.Println("║    nOTK (Nurture)    │ eOTK (Education)       ║")
			fmt.Println("║    hOTK (Health)     │ cOTK (Community)       ║")
			fmt.Println("║    xOTK (Economic)   │ gOTK (Governance)      ║")
			fmt.Println("╠═══════════════════════════════════════════════╣")
			fmt.Println("║  Source: github.com/bpupadhyaya/crypto        ║")
			fmt.Println("║  Web:    equalinformation.com                 ║")
			fmt.Println("║  License: MIT                                 ║")
			fmt.Println("╚═══════════════════════════════════════════════╝")
		},
	}
}

// ─── Query Commands ───

func openChainQueryCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "oc-query",
		Short: "Query Open Chain custom modules",
		Long:  "Query OTK, UID, DEX, Governance, Achievement, and other Open Chain modules.",
	}

	cmd.AddCommand(
		// OTK Module
		&cobra.Command{Use: "living-ledger [uid]", Short: "Query Living Ledger", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/otk/v1/living_ledger/%s\n", args[0]) }},
		&cobra.Command{Use: "score [uid]", Short: "Query contribution score", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/otk/v1/contribution_score/%s\n", args[0]) }},
		&cobra.Command{Use: "top-contributors", Short: "Top contributors",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/top_contributors") }},
		&cobra.Command{Use: "peace-index [region]", Short: "Query Peace Index", Args: cobra.MaximumNArgs(1),
			Run: func(cmd *cobra.Command, args []string) {
				r := "global"
				if len(args) > 0 { r = args[0] }
				fmt.Printf("curl localhost:1318/openchain/otk/v1/peace_index/%s\n", r)
			}},
		&cobra.Command{Use: "treasury", Short: "Query community treasury",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/treasury") }},
		&cobra.Command{Use: "notifications [uid]", Short: "Query notifications", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/otk/v1/notifications/%s\n", args[0]) }},

		// UID Module
		&cobra.Command{Use: "uid [address]", Short: "Query Universal ID", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/uid/v1/uid/%s\n", args[0]) }},
		&cobra.Command{Use: "reputation [uid]", Short: "Query reputation", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/uid/v1/reputation/%s\n", args[0]) }},
		&cobra.Command{Use: "family [uid]", Short: "Query family tree", Args: cobra.ExactArgs(1),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/uid/v1/family/%s\n", args[0]) }},

		// DEX Module
		&cobra.Command{Use: "pools", Short: "List liquidity pools",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/dex/v1/pools") }},
		&cobra.Command{Use: "orders [sell] [buy]", Short: "Open orders", Args: cobra.ExactArgs(2),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl localhost:1318/openchain/dex/v1/orders/%s/%s\n", args[0], args[1]) }},
		&cobra.Command{Use: "atomic-swaps [sell] [buy]", Short: "Pending atomic swaps", Args: cobra.ExactArgs(2),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("curl 'localhost:1318/openchain/dex/v1/atomic_swaps?sell=%s&buy=%s'\n", args[0], args[1]) }},

		// Governance
		&cobra.Command{Use: "proposals", Short: "List proposals",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/govuid/v1/proposals") }},
		&cobra.Command{Use: "amendments", Short: "List amendments",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/govuid/v1/amendments") }},

		// Events & Community
		&cobra.Command{Use: "events", Short: "Upcoming events",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/events") }},
		&cobra.Command{Use: "jobs", Short: "Open job listings",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/jobs") }},
		&cobra.Command{Use: "market", Short: "Marketplace listings",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/market") }},
		&cobra.Command{Use: "research", Short: "Research projects",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/research") }},
		&cobra.Command{Use: "insurance-pools", Short: "Insurance pools",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("curl localhost:1318/openchain/otk/v1/insurance_pools") }},
	)

	return cmd
}

// ─── Transaction Commands ───

func openChainTxCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "oc-tx",
		Short: "Submit Open Chain transactions",
		Long:  "Submit transactions to OTK, UID, DEX, and other Open Chain modules.",
	}

	cmd.AddCommand(
		&cobra.Command{Use: "gratitude [to] [channel] [amount] [message]", Short: "Send gratitude", Args: cobra.ExactArgs(4),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Sending gratitude: %s %s to %s — \"%s\"\n", args[2], args[1], args[0], args[3]) }},
		&cobra.Command{Use: "transfer [to] [channel] [amount]", Short: "Value transfer", Args: cobra.ExactArgs(3),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Transferring: %s %s to %s\n", args[2], args[1], args[0]) }},
		&cobra.Command{Use: "swap [pool] [input-denom] [amount]", Short: "DEX swap", Args: cobra.ExactArgs(3),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Swapping: %s %s via pool %s\n", args[2], args[1], args[0]) }},
		&cobra.Command{Use: "order [sell-denom] [buy-denom] [amount] [price]", Short: "Place limit order", Args: cobra.ExactArgs(4),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Order: sell %s %s for %s at price %s\n", args[2], args[0], args[1], args[3]) }},
		&cobra.Command{Use: "register-uid", Short: "Register Universal ID",
			Run: func(cmd *cobra.Command, args []string) { fmt.Println("Registering Universal ID...") }},
		&cobra.Command{Use: "submit-proposal [title] [description]", Short: "Submit governance proposal", Args: cobra.ExactArgs(2),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Proposal: %s\n", args[0]) }},
		&cobra.Command{Use: "vote [proposal-id] [yes|no|abstain]", Short: "Vote on proposal", Args: cobra.ExactArgs(2),
			Run: func(cmd *cobra.Command, args []string) { fmt.Printf("Voting %s on proposal %s\n", args[1], args[0]) }},
	)

	return cmd
}
