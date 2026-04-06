#!/bin/bash
#
# Open Chain — Add a new phone to an existing P2P network
#
# Usage: ./add_phone_to_network.sh <new_phone_adb_id> <existing_phone_adb_id>
# Example: ./add_phone_to_network.sh 192.168.1.150:5555 192.168.1.148:36013
#
# The existing phone must already be running a validator node.
# The new phone will:
#   1. Get the openchaind binary pushed
#   2. Sync genesis from the existing phone
#   3. Create a new validator account
#   4. Join the network as a new validator

set -e

NEW_PHONE="${1:?Usage: $0 <new_phone_adb> <existing_phone_adb>}"
EXISTING_PHONE="${2:?Usage: $0 <new_phone_adb> <existing_phone_adb>}"
NODE_DIR="/data/local/tmp/openchain"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BINARY="openchaind-android-arm64"
LOCAL_STAGING="/tmp/openchain-add-phone"

echo "========================================="
echo " Adding phone to Open Chain network"
echo "========================================="
echo "New phone:      $NEW_PHONE"
echo "Existing phone: $EXISTING_PHONE"

# Get IPs
NEW_IP=$(adb -s $NEW_PHONE shell "ip addr show wlan0" | grep "inet " | awk '{print $2}' | cut -d/ -f1 | tr -d '\r\n')
EXIST_IP=$(adb -s $EXISTING_PHONE shell "ip addr show wlan0" | grep "inet " | awk '{print $2}' | cut -d/ -f1 | tr -d '\r\n')
echo "New phone IP:      $NEW_IP"
echo "Existing phone IP: $EXIST_IP"

# Get chain ID from existing node
CHAIN_ID=$(curl -s http://$EXIST_IP:26657/status | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['node_info']['network'])")
echo "Chain ID: $CHAIN_ID"

# Get existing node ID
EXIST_NODE_ID=$(curl -s http://$EXIST_IP:26657/status | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['node_info']['id'])")
echo "Existing node ID: $EXIST_NODE_ID"

# Push binary
echo "Pushing binary..."
adb -s $NEW_PHONE shell "mkdir -p $NODE_DIR"
adb -s $NEW_PHONE push "$SCRIPT_DIR/$BINARY" $NODE_DIR/openchaind
adb -s $NEW_PHONE shell "chmod 755 $NODE_DIR/openchaind"

# Get next validator number
VALIDATOR_NUM=$(curl -s http://$EXIST_IP:26657/net_info | python3 -c "import sys,json; print(int(json.load(sys.stdin)['result']['n_peers']) + 2)")
echo "This will be validator-$VALIDATOR_NUM"

# Initialize node
adb -s $NEW_PHONE shell "rm -rf $NODE_DIR/node"
adb -s $NEW_PHONE shell "$NODE_DIR/openchaind init validator-$VALIDATOR_NUM --chain-id $CHAIN_ID --home $NODE_DIR/node" > /dev/null 2>&1

# Pull genesis from existing node and push to new phone
mkdir -p $LOCAL_STAGING
curl -s http://$EXIST_IP:26657/genesis | python3 -c "import sys,json; json.dump(json.load(sys.stdin)['result']['genesis'], open('$LOCAL_STAGING/genesis.json','w'), indent=2)"
adb -s $NEW_PHONE push $LOCAL_STAGING/genesis.json $NODE_DIR/node/config/genesis.json

# Create priv_validator_state.json
adb -s $NEW_PHONE shell "echo '{\"height\":\"0\",\"round\":0,\"step\":0}' > $NODE_DIR/node/data/priv_validator_state.json"

# Configure peers
NEW_NODE_ID=$(adb -s $NEW_PHONE shell "$NODE_DIR/openchaind comet show-node-id --home $NODE_DIR/node" 2>/dev/null | tr -d '\r\n')
echo "New node ID: $NEW_NODE_ID"

adb -s $NEW_PHONE shell "sed -i 's/persistent_peers = \"\"/persistent_peers = \"${EXIST_NODE_ID}@${EXIST_IP}:26656\"/' $NODE_DIR/node/config/config.toml"
adb -s $NEW_PHONE shell "sed -i 's|laddr = \"tcp://127.0.0.1:26657\"|laddr = \"tcp://0.0.0.0:26657\"|' $NODE_DIR/node/config/config.toml"
adb -s $NEW_PHONE shell "sed -i 's/allow_duplicate_ip = false/allow_duplicate_ip = true/' $NODE_DIR/node/config/config.toml"
adb -s $NEW_PHONE shell "sed -i 's/minimum-gas-prices = \"\"/minimum-gas-prices = \"0uotk\"/' $NODE_DIR/node/config/app.toml"

# Start the node (it will sync from existing peers)
echo "Starting node..."
adb -s $NEW_PHONE shell "nohup $NODE_DIR/openchaind start --home $NODE_DIR/node --minimum-gas-prices 0uotk > $NODE_DIR/node.log 2>&1 &"

sleep 10

echo ""
echo "========================================="
echo " Phone added!"
echo "========================================="
echo "New validator: $NEW_IP:26657"
echo "Node ID: $NEW_NODE_ID"
echo ""
echo "Check status: curl http://$NEW_IP:26657/status"
echo ""
echo "Note: This phone joins as a full node (syncs blocks)."
echo "To promote to validator, submit a create-validator tx."
