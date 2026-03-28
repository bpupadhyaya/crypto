/**
 * Native Bridge — React Native ↔ gomobile communication.
 *
 * When gomobile bindings are compiled (openchain.aar / OpenChain.xcframework),
 * this bridge provides typed access to the native Go functions.
 *
 * Until gomobile is compiled, falls back to the WebSocket-based nodeRunner.
 */

import { NativeModules, Platform } from 'react-native';

// The native module will be available after gomobile compilation + linking
const NativeOpenChain = NativeModules.OpenChain;

export interface NativeBridge {
  available: boolean;
  startNode(configJSON: string): Promise<string>;
  stopNode(): Promise<void>;
  getPeers(): Promise<string>;
  broadcastTransaction(txHex: string): Promise<void>;
  getBlockHeader(height: number): Promise<string>;
  getBalance(address: string): Promise<string>;
  getLatestHeight(): Promise<number>;
  isValidator(): Promise<boolean>;
  getNodeStatus(): Promise<string>;
  initValidator(mnemonic: string, chainID: string): Promise<void>;
  getValidatorAddress(): Promise<string>;
  signBlock(blockBytes: string): Promise<string>;
}

/**
 * Get the native bridge if gomobile bindings are available.
 * Falls back to null if not compiled/linked yet.
 */
export function getNativeBridge(): NativeBridge | null {
  if (!NativeOpenChain) {
    return null;
  }

  return {
    available: true,
    startNode: (config) => NativeOpenChain.StartNode(config),
    stopNode: () => NativeOpenChain.StopNode(),
    getPeers: () => NativeOpenChain.GetPeers(),
    broadcastTransaction: (tx) => NativeOpenChain.BroadcastTransaction(tx),
    getBlockHeader: (h) => NativeOpenChain.GetBlockHeader(h),
    getBalance: (addr) => NativeOpenChain.GetBalance(addr),
    getLatestHeight: () => NativeOpenChain.GetLatestHeight(),
    isValidator: () => NativeOpenChain.IsValidator(),
    getNodeStatus: () => NativeOpenChain.GetNodeStatus(),
    initValidator: (mnemonic, chainID) => NativeOpenChain.InitValidator(mnemonic, chainID),
    getValidatorAddress: () => NativeOpenChain.GetValidatorAddress(),
    signBlock: (block) => NativeOpenChain.SignBlock(block),
  };
}

/**
 * Check if native gomobile bindings are available.
 */
export function isNativeBridgeAvailable(): boolean {
  return !!NativeOpenChain;
}

/**
 * Get platform-specific info for gomobile compilation.
 */
export function getCompilationInfo(): { platform: string; nativeAvailable: boolean; instructions: string } {
  const platform = Platform.OS;
  const available = isNativeBridgeAvailable();

  if (available) {
    return { platform, nativeAvailable: true, instructions: 'Native bridge active. gomobile bindings loaded.' };
  }

  const instructions = platform === 'android'
    ? 'Run: cd open-chain/mobile && make android\nCopy openchain.aar to android/app/libs/\nAdd implementation files("libs/openchain.aar") to build.gradle'
    : 'Run: cd open-chain/mobile && make ios\nDrag OpenChain.xcframework into Xcode project\nLink framework in Build Phases';

  return { platform, nativeAvailable: false, instructions };
}
