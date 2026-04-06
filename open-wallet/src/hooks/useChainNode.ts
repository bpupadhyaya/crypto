/**
 * React hook for monitoring the embedded Open Chain node.
 *
 * Provides real-time chain status (height, peers, syncing)
 * and local balance queries via the node's RPC.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getChainNodeStatus,
  queryLocalBalance,
  type ChainNodeStatus,
} from '../core/chain/chainService';

/**
 * Hook that monitors the local chain node status.
 * Auto-refreshes every 10 seconds.
 */
export function useChainNode() {
  return useQuery({
    queryKey: ['chainNodeStatus'],
    queryFn: getChainNodeStatus,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

/**
 * Hook that queries OTK balance from the local chain node.
 * This is the P2P balance — no external servers involved.
 */
export function useLocalOTKBalance(address: string | undefined) {
  return useQuery({
    queryKey: ['localOTKBalance', address],
    queryFn: () => queryLocalBalance(address ?? ''),
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
