# gomobile Compilation — Build Open Chain for iOS/Android
#
# Produces:
#   - openchain.aar (Android)
#   - OpenChain.xcframework (iOS)
#
# Prerequisites:
#   go install golang.org/x/mobile/cmd/gomobile@latest
#   gomobile init
#
# The mobile package exports functions with gomobile-compatible types
# (string, []byte, int64, error) for React Native bridge.

MOBILE_PKG = openchain/mobile
OUTPUT_DIR = ./build

.PHONY: android ios all clean check

check:
	@which gomobile > /dev/null 2>&1 || (echo "Error: gomobile not found. Run: go install golang.org/x/mobile/cmd/gomobile@latest && gomobile init" && exit 1)
	@echo "gomobile found: $$(which gomobile)"

android: check
	@echo "Building Android AAR..."
	@mkdir -p $(OUTPUT_DIR)
	gomobile bind -target=android -o $(OUTPUT_DIR)/openchain.aar $(MOBILE_PKG)
	@echo "Done: $(OUTPUT_DIR)/openchain.aar"
	@ls -lh $(OUTPUT_DIR)/openchain.aar

ios: check
	@echo "Building iOS XCFramework..."
	@mkdir -p $(OUTPUT_DIR)
	gomobile bind -target=ios -o $(OUTPUT_DIR)/OpenChain.xcframework $(MOBILE_PKG)
	@echo "Done: $(OUTPUT_DIR)/OpenChain.xcframework"
	@ls -lhd $(OUTPUT_DIR)/OpenChain.xcframework

all: android ios
	@echo "Both platforms built successfully."

clean:
	@rm -rf $(OUTPUT_DIR)
	@echo "Build artifacts cleaned."

# Verify the mobile package compiles
verify:
	@echo "Verifying mobile package..."
	go build $(MOBILE_PKG)
	@echo "Mobile package compiles OK."
