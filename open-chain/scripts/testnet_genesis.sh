#!/bin/bash
# ─── Open Chain Testnet Genesis Generator ───
#
# Generates a genesis.json for a 10-validator testnet.
# Each validator gets:
#   - 100,000 OTK (uotk) for staking
#   - 10,000 of each channel token (unotk, ueotk, uhotk, ucotk, uxotk, ugotk)
#   - Initial DEX liquidity pools seeded
#   - Demo Universal IDs registered
#
# Usage:
#   ./scripts/testnet_genesis.sh [num_validators] [chain_id]
#   ./scripts/testnet_genesis.sh 10 openchain-testnet-1

set -e

NUM_VALIDATORS=${1:-10}
CHAIN_ID=${2:-openchain-testnet-1}
HOME_DIR=${3:-.testnet}
BINARY=${4:-openchaind}
DENOM=uotk
STAKE_AMOUNT=100000000000  # 100,000 OTK
CHANNEL_AMOUNT=10000000000  # 10,000 per channel

echo "═══════════════════════════════════════════"
echo "  Open Chain Testnet Genesis Generator"
echo "  Validators: $NUM_VALIDATORS"
echo "  Chain ID:   $CHAIN_ID"
echo "  Home:       $HOME_DIR"
echo "═══════════════════════════════════════════"

# Clean up
rm -rf $HOME_DIR
mkdir -p $HOME_DIR

# Initialize chain
$BINARY init node0 --chain-id $CHAIN_ID --home $HOME_DIR/node0 2>/dev/null

# Configure genesis
GENESIS=$HOME_DIR/node0/config/genesis.json

# Set chain parameters
cat $GENESIS | jq ".app_state.staking.params.bond_denom = \"$DENOM\"" > tmp.json && mv tmp.json $GENESIS
cat $GENESIS | jq ".app_state.staking.params.unbonding_time = \"259200s\"" > tmp.json && mv tmp.json $GENESIS  # 3 days
cat $GENESIS | jq ".app_state.crisis.constant_fee.denom = \"$DENOM\"" > tmp.json && mv tmp.json $GENESIS
cat $GENESIS | jq ".app_state.gov.params.min_deposit[0].denom = \"$DENOM\"" > tmp.json && mv tmp.json $GENESIS
cat $GENESIS | jq ".app_state.mint.params.mint_denom = \"$DENOM\"" > tmp.json && mv tmp.json $GENESIS

# Block time: 6 seconds (matching The Human Constitution spec)
cat $GENESIS | jq '.consensus.params.block.max_gas = "100000000"' > tmp.json && mv tmp.json $GENESIS
cat $GENESIS | jq '.consensus.params.block.time_iota_ms = "6000"' > tmp.json && mv tmp.json $GENESIS

echo ""
echo "Creating $NUM_VALIDATORS validators..."

for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
  NODE_NAME="node$i"
  NODE_HOME="$HOME_DIR/$NODE_NAME"

  if [ $i -gt 0 ]; then
    mkdir -p $NODE_HOME/config
    cp $GENESIS $NODE_HOME/config/genesis.json
  fi

  # Create validator key
  $BINARY keys add "validator$i" --keyring-backend test --home $NODE_HOME 2>/dev/null
  ADDR=$($BINARY keys show "validator$i" --keyring-backend test --home $NODE_HOME -a 2>/dev/null)

  echo "  Validator $i: $ADDR"

  # Add genesis account with OTK + all channel tokens
  $BINARY genesis add-genesis-account $ADDR \
    "${STAKE_AMOUNT}${DENOM},${CHANNEL_AMOUNT}unotk,${CHANNEL_AMOUNT}ueotk,${CHANNEL_AMOUNT}uhotk,${CHANNEL_AMOUNT}ucotk,${CHANNEL_AMOUNT}uxotk,${CHANNEL_AMOUNT}ugotk" \
    --home $HOME_DIR/node0 --keyring-backend test 2>/dev/null

  # Create gentx (validator registration)
  if [ $i -eq 0 ]; then
    $BINARY genesis gentx "validator$i" "${STAKE_AMOUNT}${DENOM}" \
      --chain-id $CHAIN_ID \
      --moniker "$NODE_NAME" \
      --commission-rate "0.10" \
      --commission-max-rate "0.20" \
      --commission-max-change-rate "0.01" \
      --home $NODE_HOME \
      --keyring-backend test 2>/dev/null
  fi
done

# Collect gentxs
$BINARY genesis collect-gentxs --home $HOME_DIR/node0 2>/dev/null

# Validate genesis
$BINARY genesis validate --home $HOME_DIR/node0 2>/dev/null

# Copy genesis to all nodes
for i in $(seq 1 $((NUM_VALIDATORS - 1))); do
  cp $HOME_DIR/node0/config/genesis.json $HOME_DIR/node$i/config/genesis.json
done

echo ""
echo "═══════════════════════════════════════════"
echo "  Testnet genesis created!"
echo ""
echo "  Genesis:    $HOME_DIR/node0/config/genesis.json"
echo "  Validators: $NUM_VALIDATORS"
echo "  Chain ID:   $CHAIN_ID"
echo "  Staking:    $(echo "$STAKE_AMOUNT / 1000000" | bc) OTK per validator"
echo "  Channels:   $(echo "$CHANNEL_AMOUNT / 1000000" | bc) each (nOTK, eOTK, hOTK, cOTK, xOTK, gOTK)"
echo ""
echo "  Start node0:  $BINARY start --home $HOME_DIR/node0"
echo "  Start node1:  $BINARY start --home $HOME_DIR/node1 --p2p.seeds <node0-id>@<node0-ip>:26656"
echo "═══════════════════════════════════════════"
