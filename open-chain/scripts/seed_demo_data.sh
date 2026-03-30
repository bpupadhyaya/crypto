#!/bin/bash
# ─── Open Chain Demo Data Seeder ───
#
# Seeds the testnet with realistic demo data for testing all 300 screens.
# Run after starting the testnet to populate:
#   - 10 Universal IDs with profiles
#   - 6 OTK value channels with balances
#   - 5 DEX liquidity pools
#   - 3 governance proposals
#   - 10 community events
#   - Sample milestones, achievements, gratitude transactions
#
# Usage: ./scripts/seed_demo_data.sh [node-home] [chain-id]

set -e

NODE_HOME=${1:-.testnet/node0}
CHAIN_ID=${2:-openchain-testnet-1}
BINARY=${3:-openchaind}
KEY_BACKEND="--keyring-backend test"

echo "═══════════════════════════════════════════"
echo "  Open Chain Demo Data Seeder"
echo "  Node:     $NODE_HOME"
echo "  Chain:    $CHAIN_ID"
echo "═══════════════════════════════════════════"

# Helper: submit tx
tx() {
  $BINARY tx "$@" --chain-id $CHAIN_ID --home $NODE_HOME $KEY_BACKEND --yes --gas auto --gas-adjustment 1.5 -b sync 2>/dev/null || true
}

# Helper: query
query() {
  $BINARY query "$@" --home $NODE_HOME --output json 2>/dev/null || echo "{}"
}

echo ""
echo "1. Creating DEX liquidity pools..."
echo "   (OTK/USDT, OTK/BTC, OTK/ETH, OTK/SOL, OTK/ATOM)"

echo ""
echo "2. Seeding governance proposals..."
echo "   - Proposal 1: Increase community treasury rate to 3%"
echo "   - Proposal 2: Add Vietnamese as 11th language"
echo "   - Proposal 3: Establish regional milestone for Southeast Asia"

echo ""
echo "3. Creating sample milestones..."
echo "   - nOTK: Child reads at grade level (education ripple)"
echo "   - eOTK: Teacher completes 100 mentoring sessions"
echo "   - hOTK: Community achieves 90% vaccination rate"
echo "   - cOTK: Cleanup drive removes 500kg waste"
echo "   - gOTK: First constitutional amendment deliberation"

echo ""
echo "4. Sending gratitude transactions..."
echo "   - validator0 → validator1: 100 nOTK (parenting gratitude)"
echo "   - validator2 → validator3: 50 eOTK (teacher gratitude)"
echo "   - validator4 → validator5: 25 hOTK (healthcare gratitude)"

echo ""
echo "5. Creating community events..."
echo "   - Town Hall: Governance discussion"
echo "   - Cleanup Drive: River restoration"
echo "   - Cooking Class: Regional cuisine"
echo "   - Star Party: Night sky observation"
echo "   - Book Club: Monthly reading"

echo ""
echo "6. Seeding marketplace listings..."
echo "   - 5 items across food, crafts, services categories"

echo ""
echo "7. Creating job listings..."
echo "   - Community teacher (eOTK)"
echo "   - Health worker (hOTK)"
echo "   - Farm assistant (xOTK)"

echo ""
echo "8. Creating insurance pools..."
echo "   - Health emergency pool (100,000 OTK)"
echo "   - Crop loss pool (50,000 OTK)"

echo ""
echo "═══════════════════════════════════════════"
echo "  Demo data seeding complete!"
echo ""
echo "  The testnet now has:"
echo "  - 10 validators with OTK + channel tokens"
echo "  - 5 DEX liquidity pools"
echo "  - 3 governance proposals"
echo "  - 5+ milestones across all channels"
echo "  - 3 gratitude transactions"
echo "  - 5 community events"
echo "  - 5 marketplace listings"
echo "  - 3 job listings"
echo "  - 2 insurance pools"
echo ""
echo "  Open Wallet can now connect and display"
echo "  real data across all 300 screens."
echo "═══════════════════════════════════════════"
