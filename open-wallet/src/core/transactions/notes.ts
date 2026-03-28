/**
 * Transaction Notes & Tags — attach personal metadata to transactions.
 *
 * Notes, tags, and categories are persisted locally in AsyncStorage.
 * This is purely client-side; nothing leaves the device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───

export interface TxNote {
  txHash: string;
  note: string;
  tags: string[];       // e.g., ['business', 'payment', 'donation']
  category: string;     // income, expense, transfer, swap, gift
  createdAt: number;
}

const STORAGE_KEY = '@open_wallet/tx_notes';

// ─── Internal helpers ───

async function loadAll(): Promise<Record<string, TxNote>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveAll(notes: Record<string, TxNote>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ─── Public API ───

/**
 * Set (create or update) a note on a transaction.
 */
export async function setTxNote(
  txHash: string,
  note: string,
  tags: string[],
  category: string,
): Promise<void> {
  const all = await loadAll();
  const existing = all[txHash];
  all[txHash] = {
    txHash,
    note,
    tags,
    category,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await saveAll(all);
}

/**
 * Get the note for a specific transaction, or null if none exists.
 */
export async function getTxNote(txHash: string): Promise<TxNote | null> {
  const all = await loadAll();
  return all[txHash] ?? null;
}

/**
 * Delete the note for a specific transaction.
 */
export async function deleteTxNote(txHash: string): Promise<void> {
  const all = await loadAll();
  delete all[txHash];
  await saveAll(all);
}

/**
 * Search notes by tag — returns all notes that contain the given tag.
 */
export async function searchByTag(tag: string): Promise<TxNote[]> {
  const all = await loadAll();
  const lower = tag.toLowerCase();
  return Object.values(all).filter((n) =>
    n.tags.some((t) => t.toLowerCase() === lower),
  );
}

/**
 * Search notes by category.
 */
export async function searchByCategory(category: string): Promise<TxNote[]> {
  const all = await loadAll();
  const lower = category.toLowerCase();
  return Object.values(all).filter(
    (n) => n.category.toLowerCase() === lower,
  );
}

/**
 * Get all stored notes, sorted by creation date (newest first).
 */
export async function getAllNotes(): Promise<TxNote[]> {
  const all = await loadAll();
  return Object.values(all).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Search notes by free-text query (matches note text and tags).
 */
export async function searchNotes(query: string): Promise<TxNote[]> {
  const all = await loadAll();
  const lower = query.toLowerCase();
  return Object.values(all).filter(
    (n) =>
      n.note.toLowerCase().includes(lower) ||
      n.tags.some((t) => t.toLowerCase().includes(lower)) ||
      n.txHash.toLowerCase().includes(lower),
  );
}
