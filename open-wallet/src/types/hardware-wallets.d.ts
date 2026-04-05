// Type declarations for hardware wallet libraries
// These provide enough type info for compilation even when packages aren't installed.

declare module '@ledgerhq/react-native-hw-transport-ble' {
  const TransportBLE: {
    observeState(observer: { next: (e: any) => void; error: (e: any) => void; complete: () => void }): { unsubscribe: () => void };
    listen(observer: { next: (e: any) => void; error: (e: any) => void; complete: () => void }): { unsubscribe: () => void };
    open(descriptor: any): Promise<any>;
  };
  export default TransportBLE;
}

declare module '@ledgerhq/hw-app-eth' {
  class Eth {
    constructor(transport: any);
    getAddress(path: string, showOnDevice?: boolean): Promise<{ address: string; publicKey: string }>;
    signTransaction(path: string, rawTxHex: string): Promise<{ r: string; s: string; v: string }>;
  }
  export default Eth;
}

declare module '@ledgerhq/hw-app-btc' {
  class Btc {
    constructor(opts: { transport: any });
    getWalletPublicKey(path: string, opts?: { format?: string }): Promise<{ bitcoinAddress: string; publicKey: string }>;
    signMessage(path: string, messageHex: string): Promise<{ r: string; s: string; v: number }>;
  }
  export default Btc;
}

declare module '@ledgerhq/hw-app-solana' {
  class Solana {
    constructor(transport: any);
    getAddress(path: string): Promise<{ address: { toString(): string } }>;
    signTransaction(path: string, txBuffer: Buffer): Promise<{ signature: Uint8Array }>;
  }
  export default Solana;
}

declare module '@keystonehq/keystone-sdk' {
  export class KeystoneSDK {
    parseMultiAccounts(urData: string): { keys: Array<{ address?: string; publicKey?: string; path?: string }> };
  }
}

declare module '@keystonehq/bc-ur-registry' {
  export class CryptoKeypath {}
  export class PathComponent {}
  export class EthSignRequest {
    static constructETHRequest(
      data: Buffer, dataType: any, path: string,
      xfp?: any, uuid?: Buffer, chainId?: number,
    ): { toUREncoder(maxFragmentLength: number): { nextPart(): string } };
  }
  export class ETHSignature {
    static fromCBOR(data: Buffer): { getSignature(): Buffer };
  }
  export const DataType: { transaction: any };
}

declare module '@trezor/connect' {
  const TrezorConnect: {
    init(opts: any): Promise<void>;
    ethereumGetAddress(opts: any): Promise<{ success: boolean; payload: any }>;
    getAddress(opts: any): Promise<{ success: boolean; payload: any }>;
    ethereumSignTransaction(opts: any): Promise<{ success: boolean; payload: any }>;
    signTransaction(opts: any): Promise<{ success: boolean; payload: any }>;
  };
  export default TrezorConnect;
}

declare module 'trezor-connect' {
  const TrezorConnect: {
    init(opts: any): Promise<void>;
    ethereumGetAddress(opts: any): Promise<{ success: boolean; payload: any }>;
    getAddress(opts: any): Promise<{ success: boolean; payload: any }>;
    ethereumSignTransaction(opts: any): Promise<{ success: boolean; payload: any }>;
    signTransaction(opts: any): Promise<{ success: boolean; payload: any }>;
  };
  export default TrezorConnect;
}
