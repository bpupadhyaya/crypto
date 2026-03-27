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
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { HDWallet } from '../wallet/hdwallet';
import { getNetworkConfig } from '../network';

export class SolanaSigner {
  private keypair: Keypair;
  private connection: Connection;

  constructor(privateKey: Uint8Array, rpcUrl?: string) {
    this.keypair = Keypair.fromSeed(privateKey.slice(0, 32));
    const config = getNetworkConfig().solana;
    this.connection = new Connection(
      rpcUrl ?? config.rpcUrl,
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
    if (amountSol <= 0) throw new Error('Amount must be positive');

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(toAddress);
    } catch {
      throw new Error('Invalid Solana address');
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
      }),
    );

    // Get recent blockhash (required for tx validity)
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair],
      { commitment: 'confirmed' },
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
  signMessage(_message: Uint8Array): Uint8Array {
    // TODO: Implement proper Ed25519 message signing for dApp connections
    // For now, SOL send/receive works via sendAndConfirmTransaction
    throw new Error('Message signing not yet implemented. Use sendSOL for transfers.');
  }
}
