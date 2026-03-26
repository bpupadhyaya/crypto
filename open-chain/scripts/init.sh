#!/bin/bash
# Initialize a single-validator Open Chain testnet.
# Run this once to set up genesis and validator keys.

set -e

CHAIN_ID="openchain-testnet-1"
MONIKER="open-validator-1"
DENOM="uotk"
HOME_DIR="$HOME/.openchain"

echo "=== Open Chain — The Human Value Blockchain ==="
echo "Initializing chain: $CHAIN_ID"
echo ""

# Clean previous state
rm -rf "$HOME_DIR"

# Initialize chain
openchaind init "$MONIKER" --chain-id "$CHAIN_ID" --home "$HOME_DIR"

# Create validator key
openchaind keys add validator --keyring-backend test --home "$HOME_DIR" 2>&1 | tee "$HOME_DIR/validator_key.txt"

# Get validator address
VALIDATOR_ADDR=$(openchaind keys show validator -a --keyring-backend test --home "$HOME_DIR")
echo "Validator address: $VALIDATOR_ADDR"

# Add genesis account with initial OTK for testing
# Note: In production, no pre-mine. This is testnet only.
openchaind genesis add-genesis-account "$VALIDATOR_ADDR" "1000000000${DENOM}" --home "$HOME_DIR"

# Create genesis transaction
openchaind genesis gentx validator "500000000${DENOM}" \
  --chain-id "$CHAIN_ID" \
  --moniker "$MONIKER" \
  --keyring-backend test \
  --home "$HOME_DIR"

# Collect genesis transactions
openchaind genesis collect-gentxs --home "$HOME_DIR"

# Validate genesis
openchaind genesis validate --home "$HOME_DIR"

echo ""
echo "=== Open Chain initialized successfully ==="
echo "Chain ID: $CHAIN_ID"
echo "Home: $HOME_DIR"
echo "Validator: $VALIDATOR_ADDR"
echo ""
echo "To start the chain:"
echo "  openchaind start --home $HOME_DIR"
echo ""
echo "To query balance:"
echo "  openchaind query bank balances $VALIDATOR_ADDR --home $HOME_DIR"
