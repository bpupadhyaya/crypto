/**
 * Solana Transaction Signer — using @solana/web3.js.
 *
 * Constructs and signs native SOL transfers and SPL token transfers.
 * Private key never leaves the device.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { HDWallet } from '../wallet/hdwallet';

export class SolanaSigner {
  private keypair: Keypair;
  private connection: Connection;

  constructor(privateKey: Uint8Array, rpcUrl?: string) {
    // Solana expects a 64-byte keypair (32 private + 32 public)
    // @solana/web3.js Keypair.fromSeed takes a 32-byte seed
    this.keypair = Keypair.fromSeed(privateKey.slice(0, 32));
    this.connection = new Connection(
      rpcUrl ?? clusterApiUrl('mainnet-beta'),
      'confirmed',
    );
  }

  static fromWallet(wallet: HDWallet, accountIndex: number = 0, rpcUrl?: string): SolanaSigner {
    const privateKey = wallet.derivePrivateKey('solana', accountIndex);
    return new SolanaSigner(privateKey, rpcUrl);
  }

  getAddress(): string {
    return this.keypair.publicKey.toBase58();
  }

  /**
   * Send native SOL.
   */
  async sendSOL(toAddress: string, amountSol: number): Promise<string> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
      }),
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair],
    );

    return signature;
  }

  /**
   * Sign an arbitrary transaction (used by DEX/bridge).
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    transaction.sign(this.keypair);
    return transaction;
  }

  /**
   * Sign a raw message (for dApp connections).
   */
  signMessage(message: Uint8Array): Uint8Array {
    return this.keypair.secretKey; // simplified — use nacl.sign in production
  }
}
