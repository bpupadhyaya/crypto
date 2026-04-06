#!/bin/bash
#
# Deploy Open Wallet to connected Android phones.
# PRESERVES user data (wallets, settings, PIN).
#
# Usage:
#   ./deploy.sh                    # Deploy to all connected phones
#   ./deploy.sh 192.168.1.148:36013  # Deploy to specific phone
#   ./deploy.sh --build             # Build first, then deploy
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APK="$SCRIPT_DIR/android/app/build/outputs/apk/release/app-release.apk"

# Build if requested or APK doesn't exist
if [ "$1" = "--build" ] || [ ! -f "$APK" ]; then
  echo "Building release APK..."
  cd "$SCRIPT_DIR/android" && ./gradlew assembleRelease 2>&1 | tail -3
  cd "$SCRIPT_DIR"
  shift 2>/dev/null || true
fi

if [ ! -f "$APK" ]; then
  echo "Error: APK not found at $APK"
  echo "Run: ./deploy.sh --build"
  exit 1
fi

# Get target devices
if [ -n "$1" ]; then
  DEVICES="$@"
else
  DEVICES=$(adb devices | grep -v "List\|^$\|offline\|emulator" | awk '{print $1}')
fi

if [ -z "$DEVICES" ]; then
  echo "No devices connected."
  exit 1
fi

echo "Deploying to:"
for device in $DEVICES; do
  echo "  $device"
done
echo ""

for device in $DEVICES; do
  echo "=== $device ==="
  # install -r = reinstall, PRESERVES user data (wallets, PIN, settings)
  # NEVER use 'pm clear' or 'uninstall' — that destroys wallet data
  adb -s "$device" install -r "$APK" 2>&1 | tail -1
  adb -s "$device" shell "am start -n com.equalinformation.openwallet/.MainActivity" 2>&1 | tail -1
  echo ""
done

echo "Deploy complete. User data preserved."
