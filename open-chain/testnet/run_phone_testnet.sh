#!/bin/bash
# 10-Phone P2P Testnet — Quick Start Script
#
# This script helps set up a 10-phone testnet for Open Chain.
# Run this on a computer connected to the same WiFi as the phones.
#
# Prerequisites:
#   - openchaind binary installed (go install ./cmd/openchaind)
#   - 10 phones on same WiFi network
#   - Each phone has Open Wallet installed
#
# Usage:
#   ./run_phone_testnet.sh generate    # Generate configs
#   ./run_phone_testnet.sh start <n>   # Start node N (0-9)
#   ./run_phone_testnet.sh status      # Check all nodes

set -e

CHAIN_ID="openchain-testnet-1"
NUM_VALIDATORS=10
INITIAL_BALANCE=1000000000  # 1000 OTK per validator
OUTPUT_DIR="$(dirname "$0")/../testnet-config"
OPENCHAIND="${HOME}/go/bin/openchaind"

case "${1:-help}" in
  generate)
    echo "Generating 10-node testnet configuration..."
    mkdir -p "$OUTPUT_DIR"
    $OPENCHAIND testnet generate \
      --chain-id "$CHAIN_ID" \
      --num-validators "$NUM_VALIDATORS" \
      --initial-balance "$INITIAL_BALANCE" \
      --output-dir "$OUTPUT_DIR"
    echo ""
    echo "Done! Config files are in: $OUTPUT_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Copy node0/ to phone 1, node1/ to phone 2, etc."
    echo "  2. On each phone, run: openchaind start --home <node-dir>"
    echo "  3. Or use the QR code sharing in Open Wallet to connect"
    ;;

  start)
    NODE_NUM="${2:-0}"
    NODE_DIR="$OUTPUT_DIR/node${NODE_NUM}"
    if [ ! -d "$NODE_DIR" ]; then
      echo "Error: $NODE_DIR not found. Run 'generate' first."
      exit 1
    fi
    echo "Starting node $NODE_NUM..."
    echo "Chain ID: $CHAIN_ID"
    echo "Config: $NODE_DIR"
    echo ""
    $OPENCHAIND start \
      --home "$NODE_DIR" \
      --minimum-gas-prices "0uotk" \
      --p2p.laddr "tcp://0.0.0.0:$((26656 + NODE_NUM * 10))" \
      --rpc.laddr "tcp://0.0.0.0:$((26657 + NODE_NUM * 10))" \
      --api.address "tcp://0.0.0.0:$((1317 + NODE_NUM))" \
      --grpc.address "0.0.0.0:$((9090 + NODE_NUM))"
    ;;

  status)
    echo "Checking node status..."
    for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
      PORT=$((26657 + i * 10))
      STATUS=$(curl -s "http://localhost:${PORT}/status" 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Block: {d[\"result\"][\"sync_info\"][\"latest_block_height\"]}, Peers: {d[\"result\"][\"n_peers\"]}')" 2>/dev/null || echo "offline")
      echo "  Node $i (port $PORT): $STATUS"
    done
    ;;

  peers)
    echo "Peer addresses for config:"
    for i in $(seq 0 $((NUM_VALIDATORS - 1))); do
      NODE_DIR="$OUTPUT_DIR/node${i}"
      if [ -f "$NODE_DIR/config/validator_key.json" ]; then
        NODE_ID=$(python3 -c "import json; d=json.load(open('$NODE_DIR/config/validator_key.json')); print(d.get('node_id','unknown'))" 2>/dev/null || echo "unknown")
        echo "  Node $i: ${NODE_ID}@<phone-${i}-ip>:$((26656 + i * 10))"
      fi
    done
    ;;

  *)
    echo "Usage: $0 {generate|start <node-num>|status|peers}"
    echo ""
    echo "  generate     - Generate 10-node testnet config"
    echo "  start <n>    - Start node N (0-9)"
    echo "  status       - Check all node statuses"
    echo "  peers        - Show peer addresses for configuration"
    ;;
esac
