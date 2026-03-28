#!/usr/bin/env bash
# setup.sh — Generate a 10-node Open Chain testnet configuration.
#
# This script:
#   1. Generates 10 validator keys
#   2. Creates genesis.json with all 10 validators
#   3. Creates per-node config files
#   4. Sets up persistent peers list
#   5. Outputs a directory per node (can be copied to each phone)
#
# Usage:
#   ./setup.sh [output_dir] [chain_id] [num_validators]
#
# Example:
#   ./setup.sh ./testnet-files openchain-testnet-1 10

set -euo pipefail

OUTPUT_DIR="${1:-./.testnet}"
CHAIN_ID="${2:-openchain-testnet-1}"
NUM_VALIDATORS="${3:-10}"
INITIAL_BALANCE="1000000000"  # 1000 OTK per validator in uotk
BLOCK_TIME="5s"
BASE_P2P_PORT=26656
BASE_RPC_PORT=26657

echo "=== Open Chain Testnet Setup ==="
echo "Chain ID:        ${CHAIN_ID}"
echo "Validators:      ${NUM_VALIDATORS}"
echo "Output:          ${OUTPUT_DIR}"
echo "Initial balance: ${INITIAL_BALANCE} uotk per validator"
echo ""

# Check if openchaind binary is available
if command -v openchaind &>/dev/null; then
    echo "Using openchaind binary for key generation..."
    USE_BINARY=true
else
    echo "openchaind not found — using Go testnet generator..."
    USE_BINARY=false
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

if [ "${USE_BINARY}" = true ]; then
    # Use the openchaind testnet command
    openchaind testnet generate \
        --chain-id "${CHAIN_ID}" \
        --num-validators "${NUM_VALIDATORS}" \
        --initial-balance "${INITIAL_BALANCE}" \
        --block-time "${BLOCK_TIME}" \
        --output-dir "${OUTPUT_DIR}"
else
    # Run the Go testnet generator directly
    echo "Building testnet generator..."

    # Find the project root (directory containing go.mod)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

    cd "${PROJECT_ROOT}"

    go run ./cmd/openchaind testnet generate \
        --chain-id "${CHAIN_ID}" \
        --num-validators "${NUM_VALIDATORS}" \
        --initial-balance "${INITIAL_BALANCE}" \
        --block-time "${BLOCK_TIME}" \
        --output-dir "${OUTPUT_DIR}"
fi

echo ""
echo "=== Testnet Setup Complete ==="
echo ""
echo "Generated files:"
echo "  ${OUTPUT_DIR}/genesis.json          — shared genesis for all nodes"
for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
    echo "  ${OUTPUT_DIR}/node${i}/               — config for validator ${i}"
    echo "    config/genesis.json               — copy of genesis"
    echo "    config/validator_key.json          — validator keys (KEEP SECRET)"
    echo "    config/peers.json                  — peer configuration"
done

echo ""
echo "=== Next Steps ==="
echo "1. Edit peers.json in each node directory with actual phone IP addresses"
echo "2. Copy each node directory to the corresponding phone"
echo "3. Start openchaind on each phone with:"
echo "   openchaind start --home /path/to/node<N>"
echo ""
echo "For a quick local test with all 10 nodes on one machine:"
echo "  for i in \$(seq 0 $((NUM_VALIDATORS - 1))); do"
echo "    openchaind start --home ${OUTPUT_DIR}/node\${i} &"
echo "  done"
