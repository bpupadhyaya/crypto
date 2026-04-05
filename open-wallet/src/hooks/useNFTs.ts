/**
 * useNFTs — React Query hook for fetching NFTs across Ethereum and Solana.
 *
 * Caches metadata in AsyncStorage with a 10-minute TTL.
 * Uses React Query with 60s stale time for in-memory freshness.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNFTs, type NFTItem } from '../core/nft/nftFetcher';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  nfts: NFTItem[];
  timestamp: number;
}

function cacheKey(chain: string, address: string): string {
  return `nft_cache_${chain}_${address}`;
}

async function getCachedNFTs(addresses: { ethereum?: string; solana?: string }): Promise<NFTItem[] | null> {
  try {
    const now = Date.now();
    const allNfts: NFTItem[] = [];
    let allValid = true;

    for (const [chain, address] of Object.entries(addresses)) {
      if (!address) continue;
      const raw = await AsyncStorage.getItem(cacheKey(chain, address));
      if (!raw) { allValid = false; break; }
      const entry: CacheEntry = JSON.parse(raw);
      if (now - entry.timestamp > CACHE_TTL_MS) { allValid = false; break; }
      allNfts.push(...entry.nfts);
    }

    return allValid && allNfts.length > 0 ? allNfts : null;
  } catch {
    return null;
  }
}

async function setCachedNFTs(
  addresses: { ethereum?: string; solana?: string },
  nfts: NFTItem[],
): Promise<void> {
  try {
    const now = Date.now();
    for (const [chain, address] of Object.entries(addresses)) {
      if (!address) continue;
      const chainNfts = nfts.filter((n) => n.chain === chain);
      const entry: CacheEntry = { nfts: chainNfts, timestamp: now };
      await AsyncStorage.setItem(cacheKey(chain, address), JSON.stringify(entry));
    }
  } catch {
    // Cache write failure is non-fatal
  }
}

export function useNFTs(addresses: { ethereum?: string; solana?: string }) {
  const queryClient = useQueryClient();

  const hasAddresses = !!(addresses.ethereum || addresses.solana);

  const query = useQuery({
    queryKey: ['nfts', addresses.ethereum || '', addresses.solana || ''],
    queryFn: async (): Promise<NFTItem[]> => {
      // Try cache first
      const cached = await getCachedNFTs(addresses);
      if (cached) return cached;

      // Fetch fresh
      const nfts = await fetchNFTs(addresses);

      // Persist to cache
      await setCachedNFTs(addresses, nfts);

      return nfts;
    },
    enabled: hasAddresses,
    staleTime: 60_000, // 60 seconds
    refetchInterval: 120_000, // Refetch every 2 minutes in background
  });

  const refresh = () => {
    // Clear AsyncStorage cache for these addresses, then refetch
    const keys: string[] = [];
    if (addresses.ethereum) keys.push(cacheKey('ethereum', addresses.ethereum));
    if (addresses.solana) keys.push(cacheKey('solana', addresses.solana));

    Promise.all(keys.map((k) => AsyncStorage.removeItem(k).catch(() => {}))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    });
  };

  return {
    nfts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refresh,
  };
}
