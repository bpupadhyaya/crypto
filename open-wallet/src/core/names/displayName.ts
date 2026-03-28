/**
 * Display Name Resolution — show human-friendly names for addresses.
 *
 * Priority:
 * 1. Address book (local contacts) — instant
 * 2. Name service reverse resolution — async with cache
 * 3. Truncated address — fallback
 */

import { useWalletStore } from '../../store/walletStore';
import { reverseResolve } from './resolver';

// ─── In-memory cache for reverse-resolved names ───

const nameCache = new Map<string, { name: string | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Truncate an address for display: 0x1234...abcd
 */
export function truncateAddress(address: string, prefixLen = 6, suffixLen = 4): string {
  if (address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Get a human-friendly display name for an address.
 *
 * Checks in order:
 * 1. Address book (synchronous, from Zustand store)
 * 2. Reverse name service resolution (async, cached)
 * 3. Truncated address (fallback)
 */
export async function getDisplayName(address: string, chain: string): Promise<string> {
  if (!address) return '';

  // 1. Check address book
  const contactName = getContactName(address, chain);
  if (contactName) return contactName;

  // 2. Check reverse resolution cache
  const cacheKey = `${chain}:${address.toLowerCase()}`;
  const cached = nameCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    if (cached.name) return cached.name;
    return truncateAddress(address);
  }

  // 3. Try reverse resolution (async)
  try {
    const name = await reverseResolve(address, chain);
    nameCache.set(cacheKey, { name, timestamp: Date.now() });
    if (name) return name;
  } catch {
    nameCache.set(cacheKey, { name: null, timestamp: Date.now() });
  }

  // 4. Fallback: truncated address
  return truncateAddress(address);
}

/**
 * Synchronous check of address book only.
 * Useful when you need immediate display without waiting for network.
 */
export function getContactName(address: string, chain: string): string | null {
  const { contacts } = useWalletStore.getState();
  const normalized = address.toLowerCase();
  const contact = contacts.find(
    (c) => c.address.toLowerCase() === normalized && (c.chain === chain || c.chain === 'all'),
  );
  return contact?.name ?? null;
}

/**
 * Synchronous display name — uses cache and address book only, never awaits network.
 * Returns truncated address if nothing is cached.
 */
export function getDisplayNameSync(address: string, chain: string): string {
  if (!address) return '';

  // 1. Check address book
  const contactName = getContactName(address, chain);
  if (contactName) return contactName;

  // 2. Check cache
  const cacheKey = `${chain}:${address.toLowerCase()}`;
  const cached = nameCache.get(cacheKey);
  if (cached && cached.name && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.name;
  }

  // 3. Truncated address
  return truncateAddress(address);
}

/**
 * Clear the reverse resolution cache (useful on network mode change).
 */
export function clearNameCache(): void {
  nameCache.clear();
}
