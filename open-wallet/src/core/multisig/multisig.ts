/**
 * Multi-Signature Wallet — Core logic for M-of-N signature wallets.
 *
 * Manages multi-sig wallet creation, transaction proposals,
 * signing, and execution tracking. Uses AsyncStorage for persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface MultiSigWallet {
  id: string;
  name: string;
  threshold: number;   // M signatures required
  signers: string[];   // N signer addresses
  createdAt: number;
}

export interface PendingMultiSigTx {
  id: string;
  walletId: string;
  type: 'send' | 'swap' | 'stake';
  description: string;
  amount?: number;
  token?: string;
  to?: string;
  signatures: string[];       // addresses that have signed
  requiredSignatures: number;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  executed: boolean;
  rejected: boolean;
  rejectedBy: string[];
}

export interface ExecutedMultiSigTx extends PendingMultiSigTx {
  executedAt: number;
}

// ─── Storage Keys ───

const WALLETS_KEY = '@multisig_wallets';
const PENDING_TXS_KEY = '@multisig_pending_txs';
const EXECUTED_TXS_KEY = '@multisig_executed_txs';

// ─── Helpers ───

function generateId(): string {
  return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function saveJSON<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── Wallet CRUD ───

export async function getMultiSigWallets(): Promise<MultiSigWallet[]> {
  return loadJSON<MultiSigWallet[]>(WALLETS_KEY, []);
}

export async function createMultiSigWallet(params: {
  name: string;
  threshold: number;
  signers: string[];
}): Promise<MultiSigWallet> {
  if (params.threshold < 1) throw new Error('Threshold must be at least 1');
  if (params.threshold > params.signers.length) {
    throw new Error(`Threshold (${params.threshold}) cannot exceed number of signers (${params.signers.length})`);
  }
  if (params.signers.length < 2) throw new Error('Multi-sig requires at least 2 signers');

  const wallet: MultiSigWallet = {
    id: generateId(),
    name: params.name.trim(),
    threshold: params.threshold,
    signers: [...params.signers],
    createdAt: Date.now(),
  };

  const wallets = await getMultiSigWallets();
  wallets.push(wallet);
  await saveJSON(WALLETS_KEY, wallets);
  return wallet;
}

export async function deleteMultiSigWallet(walletId: string): Promise<void> {
  const wallets = await getMultiSigWallets();
  await saveJSON(WALLETS_KEY, wallets.filter((w) => w.id !== walletId));
  // Also remove pending txs for this wallet
  const pending = await getPendingTxs(walletId);
  if (pending.length > 0) {
    const allPending = await loadJSON<PendingMultiSigTx[]>(PENDING_TXS_KEY, []);
    await saveJSON(PENDING_TXS_KEY, allPending.filter((t) => t.walletId !== walletId));
  }
}

// ─── Transaction Proposals ───

export async function proposeTx(
  walletId: string,
  tx: {
    type: 'send' | 'swap' | 'stake';
    description: string;
    amount?: number;
    token?: string;
    to?: string;
    createdBy: string;
    expiresInHours?: number;
  },
): Promise<PendingMultiSigTx> {
  const wallets = await getMultiSigWallets();
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) throw new Error('Multi-sig wallet not found');

  const pending: PendingMultiSigTx = {
    id: generateId(),
    walletId,
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    token: tx.token,
    to: tx.to,
    signatures: [],
    requiredSignatures: wallet.threshold,
    createdBy: tx.createdBy,
    createdAt: Date.now(),
    expiresAt: Date.now() + (tx.expiresInHours ?? 48) * 3600_000,
    executed: false,
    rejected: false,
    rejectedBy: [],
  };

  const allPending = await loadJSON<PendingMultiSigTx[]>(PENDING_TXS_KEY, []);
  allPending.push(pending);
  await saveJSON(PENDING_TXS_KEY, allPending);
  return pending;
}

export async function signTx(txId: string, signerAddress: string): Promise<PendingMultiSigTx> {
  const allPending = await loadJSON<PendingMultiSigTx[]>(PENDING_TXS_KEY, []);
  const idx = allPending.findIndex((t) => t.id === txId);
  if (idx === -1) throw new Error('Transaction not found');

  const tx = allPending[idx];
  if (tx.executed) throw new Error('Transaction already executed');
  if (tx.rejected) throw new Error('Transaction was rejected');
  if (Date.now() > tx.expiresAt) throw new Error('Transaction expired');
  if (tx.signatures.includes(signerAddress)) throw new Error('Already signed');

  tx.signatures.push(signerAddress);

  // Auto-execute when threshold met
  if (tx.signatures.length >= tx.requiredSignatures) {
    tx.executed = true;
    // Move to executed history
    const executed = await loadJSON<ExecutedMultiSigTx[]>(EXECUTED_TXS_KEY, []);
    executed.unshift({ ...tx, executedAt: Date.now() });
    await saveJSON(EXECUTED_TXS_KEY, executed);
    // Remove from pending
    allPending.splice(idx, 1);
  }

  await saveJSON(PENDING_TXS_KEY, allPending);
  return tx;
}

export async function rejectTx(txId: string, signerAddress: string): Promise<PendingMultiSigTx> {
  const allPending = await loadJSON<PendingMultiSigTx[]>(PENDING_TXS_KEY, []);
  const idx = allPending.findIndex((t) => t.id === txId);
  if (idx === -1) throw new Error('Transaction not found');

  const tx = allPending[idx];
  if (tx.executed) throw new Error('Transaction already executed');
  if (!tx.rejectedBy.includes(signerAddress)) {
    tx.rejectedBy.push(signerAddress);
  }

  // If enough rejections to make threshold impossible, mark rejected
  const wallets = await getMultiSigWallets();
  const wallet = wallets.find((w) => w.id === tx.walletId);
  const totalSigners = wallet?.signers.length ?? 0;
  if (tx.rejectedBy.length > totalSigners - tx.requiredSignatures) {
    tx.rejected = true;
  }

  await saveJSON(PENDING_TXS_KEY, allPending);
  return tx;
}

export async function getPendingTxs(walletId: string): Promise<PendingMultiSigTx[]> {
  const all = await loadJSON<PendingMultiSigTx[]>(PENDING_TXS_KEY, []);
  return all
    .filter((t) => t.walletId === walletId && !t.executed && !t.rejected)
    .filter((t) => Date.now() <= t.expiresAt);
}

export async function getExecutedTxs(walletId: string): Promise<ExecutedMultiSigTx[]> {
  const all = await loadJSON<ExecutedMultiSigTx[]>(EXECUTED_TXS_KEY, []);
  return all.filter((t) => t.walletId === walletId);
}

// ─── Demo Data ───

export function getDemoMultiSigWallet(): MultiSigWallet {
  return {
    id: 'demo_multisig_1',
    name: 'Family Vault',
    threshold: 2,
    signers: [
      '0xAlice...a1b2',
      '0xBob...c3d4',
      '0xCharlie...e5f6',
    ],
    createdAt: Date.now() - 7 * 86400_000,
  };
}

export function getDemoPendingTxs(): PendingMultiSigTx[] {
  return [
    {
      id: 'demo_tx_1',
      walletId: 'demo_multisig_1',
      type: 'send',
      description: 'Send 0.5 ETH to 0xDave...7890',
      amount: 0.5,
      token: 'ETH',
      to: '0xDave...7890',
      signatures: ['0xAlice...a1b2'],
      requiredSignatures: 2,
      createdBy: '0xAlice...a1b2',
      createdAt: Date.now() - 3600_000,
      expiresAt: Date.now() + 47 * 3600_000,
      executed: false,
      rejected: false,
      rejectedBy: [],
    },
    {
      id: 'demo_tx_2',
      walletId: 'demo_multisig_1',
      type: 'swap',
      description: 'Swap 1 ETH for USDC on Uniswap',
      amount: 1,
      token: 'ETH',
      signatures: [],
      requiredSignatures: 2,
      createdBy: '0xBob...c3d4',
      createdAt: Date.now() - 7200_000,
      expiresAt: Date.now() + 40 * 3600_000,
      executed: false,
      rejected: false,
      rejectedBy: [],
    },
  ];
}

export function getDemoExecutedTxs(): ExecutedMultiSigTx[] {
  return [
    {
      id: 'demo_exec_1',
      walletId: 'demo_multisig_1',
      type: 'send',
      description: 'Send 0.1 BTC to hardware wallet',
      amount: 0.1,
      token: 'BTC',
      to: 'bc1q...xyz',
      signatures: ['0xAlice...a1b2', '0xBob...c3d4'],
      requiredSignatures: 2,
      createdBy: '0xAlice...a1b2',
      createdAt: Date.now() - 3 * 86400_000,
      expiresAt: Date.now() - 1 * 86400_000,
      executed: true,
      rejected: false,
      rejectedBy: [],
      executedAt: Date.now() - 2.5 * 86400_000,
    },
    {
      id: 'demo_exec_2',
      walletId: 'demo_multisig_1',
      type: 'stake',
      description: 'Stake 10 ETH on Lido',
      amount: 10,
      token: 'ETH',
      signatures: ['0xBob...c3d4', '0xCharlie...e5f6'],
      requiredSignatures: 2,
      createdBy: '0xCharlie...e5f6',
      createdAt: Date.now() - 5 * 86400_000,
      expiresAt: Date.now() - 3 * 86400_000,
      executed: true,
      rejected: false,
      rejectedBy: [],
      executedAt: Date.now() - 4.5 * 86400_000,
    },
  ];
}
