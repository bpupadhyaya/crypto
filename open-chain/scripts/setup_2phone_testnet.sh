#!/bin/bash
#
# Open Chain — 2-Phone P2P Testnet Setup
#
# Usage: ./setup_2phone_testnet.sh <phone_a_adb_id> <phone_b_adb_id>
# Example: ./setup_2phone_testnet.sh 192.168.1.148:36013 192.168.1.101:36557
#
# Prerequisites:
# - Both phones connected via ADB (wireless or USB)
# - openchaind-android-arm64 binary already built
# - Both phones on same WiFi network

set -e

PHONE_A="${1:?Usage: $0 <phone_a_adb> <phone_b_adb>}"
PHONE_B="${2:?Usage: $0 <phone_a_adb> <phone_b_adb>}"
NODE_DIR="/data/local/tmp/openchain"
CHAIN_ID="openchain-p2p-1"
BINARY="openchaind-android-arm64"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_STAGING="/tmp/openchain-2phone"

echo "========================================="
echo " Open Chain 2-Phone P2P Testnet Setup"
echo "========================================="
echo "Phone A: $PHONE_A"
echo "Phone B: $PHONE_B"
echo ""

# Get WiFi IPs
IP_A=$(adb -s $PHONE_A shell "ip addr show wlan0" | grep "inet " | awk '{print $2}' | cut -d/ -f1 | tr -d '\r\n')
IP_B=$(adb -s $PHONE_B shell "ip addr show wlan0" | grep "inet " | awk '{print $2}' | cut -d/ -f1 | tr -d '\r\n')
echo "Phone A WiFi IP: $IP_A"
echo "Phone B WiFi IP: $IP_B"

# Step 1: Build binary if needed
if [ ! -f "$SCRIPT_DIR/$BINARY" ]; then
  echo "Building openchaind for Android ARM64..."
  cd "$SCRIPT_DIR"
  GOOS=android GOARCH=arm64 CGO_ENABLED=0 go build -o $BINARY ./cmd/openchaind
fi

# Step 2: Push binary to both phones
echo "Pushing binary to phones..."
adb -s $PHONE_A shell "mkdir -p $NODE_DIR"
adb -s $PHONE_B shell "mkdir -p $NODE_DIR"
adb -s $PHONE_A push "$SCRIPT_DIR/$BINARY" $NODE_DIR/openchaind &
adb -s $PHONE_B push "$SCRIPT_DIR/$BINARY" $NODE_DIR/openchaind &
wait
adb -s $PHONE_A shell "chmod 755 $NODE_DIR/openchaind"
adb -s $PHONE_B shell "chmod 755 $NODE_DIR/openchaind"

# Step 3: Initialize nodes on each phone
echo "Initializing nodes..."
adb -s $PHONE_A shell "rm -rf $NODE_DIR/node && $NODE_DIR/openchaind init validator-0 --chain-id $CHAIN_ID --home $NODE_DIR/node" > /dev/null 2>&1
adb -s $PHONE_B shell "rm -rf $NODE_DIR/node && $NODE_DIR/openchaind init validator-1 --chain-id $CHAIN_ID --home $NODE_DIR/node" > /dev/null 2>&1

# Step 4: Create accounts and gentx on each phone
echo "Creating validator accounts..."

# Phone A: create account and gentx
adb -s $PHONE_A shell "$NODE_DIR/openchaind keys add validator-0 --keyring-backend test --home $NODE_DIR/node" > /dev/null 2>&1
VAL0_ADDR=$(adb -s $PHONE_A shell "$NODE_DIR/openchaind keys show validator-0 -a --keyring-backend test --home $NODE_DIR/node" | tr -d '\r\n')
echo "Validator 0 address: $VAL0_ADDR"

# Phone B: create account and gentx
adb -s $PHONE_B shell "$NODE_DIR/openchaind keys add validator-1 --keyring-backend test --home $NODE_DIR/node" > /dev/null 2>&1
VAL1_ADDR=$(adb -s $PHONE_B shell "$NODE_DIR/openchaind keys show validator-1 -a --keyring-backend test --home $NODE_DIR/node" | tr -d '\r\n')
echo "Validator 1 address: $VAL1_ADDR"

# Step 5: Add genesis accounts on Phone A (use as genesis coordinator)
echo "Adding genesis accounts..."
adb -s $PHONE_A shell "$NODE_DIR/openchaind genesis add-genesis-account $VAL0_ADDR 1000000000uotk --keyring-backend test --home $NODE_DIR/node" 2>&1 | tail -1
adb -s $PHONE_A shell "$NODE_DIR/openchaind genesis add-genesis-account $VAL1_ADDR 1000000000uotk --keyring-backend test --home $NODE_DIR/node" 2>&1 | tail -1

# Step 6: Create gentx on Phone A
echo "Creating genesis transaction..."
adb -s $PHONE_A shell "$NODE_DIR/openchaind genesis gentx validator-0 500000000uotk --chain-id $CHAIN_ID --keyring-backend test --home $NODE_DIR/node" 2>&1 | tail -1

# Step 7: Pull genesis from Phone A, push to Phone B for its gentx
echo "Syncing genesis..."
mkdir -p $LOCAL_STAGING
adb -s $PHONE_A pull $NODE_DIR/node/config/genesis.json $LOCAL_STAGING/genesis.json
adb -s $PHONE_B push $LOCAL_STAGING/genesis.json $NODE_DIR/node/config/genesis.json

# Create gentx on Phone B
adb -s $PHONE_B shell "$NODE_DIR/openchaind genesis gentx validator-1 500000000uotk --chain-id $CHAIN_ID --keyring-backend test --home $NODE_DIR/node" 2>&1 | tail -1

# Step 8: Collect gentxs - pull Phone B's gentx, push to Phone A
echo "Collecting genesis transactions..."
mkdir -p $LOCAL_STAGING/gentx
adb -s $PHONE_B pull $NODE_DIR/node/config/gentx/ $LOCAL_STAGING/gentx/ 2>/dev/null || true
# Push B's gentx to A
for f in $LOCAL_STAGING/gentx/*.json; do
  [ -f "$f" ] && adb -s $PHONE_A push "$f" "$NODE_DIR/node/config/gentx/$(basename $f)"
done

# Step 9: Collect gentx and validate genesis on Phone A
echo "Collecting and validating genesis..."
adb -s $PHONE_A shell "$NODE_DIR/openchaind genesis collect-gentxs --home $NODE_DIR/node" 2>&1 | tail -1
adb -s $PHONE_A shell "$NODE_DIR/openchaind genesis validate-genesis --home $NODE_DIR/node" 2>&1 | tail -1

# Step 10: Pull final genesis and push to Phone B
echo "Distributing final genesis..."
adb -s $PHONE_A pull $NODE_DIR/node/config/genesis.json $LOCAL_STAGING/final-genesis.json
adb -s $PHONE_B push $LOCAL_STAGING/final-genesis.json $NODE_DIR/node/config/genesis.json

# Step 11: Configure peers
echo "Configuring P2P..."
NODE0_TMID=$(adb -s $PHONE_A shell "$NODE_DIR/openchaind comet show-node-id --home $NODE_DIR/node" 2>/dev/null | tr -d '\r\n')
NODE1_TMID=$(adb -s $PHONE_B shell "$NODE_DIR/openchaind comet show-node-id --home $NODE_DIR/node" 2>/dev/null | tr -d '\r\n')
echo "Node 0 ID: $NODE0_TMID"
echo "Node 1 ID: $NODE1_TMID"

# Phone A peers to Phone B, Phone B peers to Phone A
adb -s $PHONE_A shell "sed -i 's/persistent_peers = \"\"/persistent_peers = \"${NODE1_TMID}@${IP_B}:26656\"/' $NODE_DIR/node/config/config.toml"
adb -s $PHONE_B shell "sed -i 's/persistent_peers = \"\"/persistent_peers = \"${NODE0_TMID}@${IP_A}:26656\"/' $NODE_DIR/node/config/config.toml"

# Open RPC to all interfaces
adb -s $PHONE_A shell "sed -i 's|laddr = \"tcp://127.0.0.1:26657\"|laddr = \"tcp://0.0.0.0:26657\"|' $NODE_DIR/node/config/config.toml"
adb -s $PHONE_B shell "sed -i 's|laddr = \"tcp://127.0.0.1:26657\"|laddr = \"tcp://0.0.0.0:26657\"|' $NODE_DIR/node/config/config.toml"

# Allow duplicate IPs (testnet)
adb -s $PHONE_A shell "sed -i 's/allow_duplicate_ip = false/allow_duplicate_ip = true/' $NODE_DIR/node/config/config.toml"
adb -s $PHONE_B shell "sed -i 's/allow_duplicate_ip = false/allow_duplicate_ip = true/' $NODE_DIR/node/config/config.toml"

# Set min gas price
adb -s $PHONE_A shell "sed -i 's/minimum-gas-prices = \"\"/minimum-gas-prices = \"0uotk\"/' $NODE_DIR/node/config/app.toml"
adb -s $PHONE_B shell "sed -i 's/minimum-gas-prices = \"\"/minimum-gas-prices = \"0uotk\"/' $NODE_DIR/node/config/app.toml"

# Enable API
adb -s $PHONE_A shell "sed -i '0,/enable = false/s/enable = false/enable = true/' $NODE_DIR/node/config/app.toml"
adb -s $PHONE_B shell "sed -i '0,/enable = false/s/enable = false/enable = true/' $NODE_DIR/node/config/app.toml"

echo ""
echo "========================================="
echo " Setup Complete!"
echo "========================================="
echo ""
echo "Start nodes with:"
echo "  adb -s $PHONE_A shell \"nohup $NODE_DIR/openchaind start --home $NODE_DIR/node --minimum-gas-prices 0uotk > $NODE_DIR/node.log 2>&1 &\""
echo "  adb -s $PHONE_B shell \"nohup $NODE_DIR/openchaind start --home $NODE_DIR/node --minimum-gas-prices 0uotk > $NODE_DIR/node.log 2>&1 &\""
echo ""
echo "Check status:"
echo "  curl http://$IP_A:26657/status"
echo "  curl http://$IP_B:26657/status"
echo ""
echo "Check peers:"
echo "  curl http://$IP_A:26657/net_info"
