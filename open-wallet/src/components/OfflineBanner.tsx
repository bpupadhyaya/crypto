/**
 * Offline/Network Status Banner — shown at top of screen.
 *
 * When offline: red banner with "No internet connection"
 * When online: tappable to show per-chain connection status + P2P peer count.
 * Per-chain status: green dot = connected, red dot = disconnected.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';
import { registry } from '../core/abstractions/registry';

// ─── Chain health check ───

interface ChainStatus {
  chain: string;
  label: string;
  connected: boolean;
  latencyMs: number | null;
}

async function checkChainHealth(chainId: string): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const provider = registry.getChainProvider(chainId);
    // Attempt a lightweight RPC call (getBalance with a dummy address times out fast)
    await Promise.race([
      provider.getBalance('0x0000000000000000000000000000000000000000'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
    return { connected: true, latencyMs: Date.now() - start };
  } catch {
    // If we got a response (even an error), the RPC is reachable
    const elapsed = Date.now() - start;
    // If it timed out (>3.5s), it's likely down; otherwise it responded (possibly with an error)
    return { connected: elapsed < 3500, latencyMs: elapsed < 3500 ? elapsed : null as any };
  }
}

// ─── P2P peer info ───

let cachedPeerCount = 0;

async function getP2PPeerCount(): Promise<number> {
  try {
    const { p2pManager } = await import('../core/providers/mobile/p2p');
    if (!p2pManager.isRunning()) return 0;
    const peers = await p2pManager.getPeers();
    cachedPeerCount = peers.length;
    return peers.length;
  } catch {
    return cachedPeerCount;
  }
}

// ─── Component ───

export const OfflineBanner = React.memo(() => {
  const isOnline = useNetworkStatus();
  const t = useTheme();
  const supportedChains = useWalletStore((s) => s.supportedChains);
  const [showDetail, setShowDetail] = useState(false);
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([]);
  const [peerCount, setPeerCount] = useState(0);
  const [checking, setChecking] = useState(false);

  const chainLabels: Record<string, string> = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    solana: 'Solana',
    cosmos: 'Cosmos',
    openchain: 'Open Chain',
  };

  const refreshStatuses = useCallback(async () => {
    setChecking(true);
    const results: ChainStatus[] = [];
    const checks = supportedChains.map(async (chain) => {
      const health = await checkChainHealth(chain);
      results.push({
        chain,
        label: chainLabels[chain] ?? chain,
        connected: health.connected,
        latencyMs: health.latencyMs,
      });
    });
    await Promise.allSettled(checks);
    // Sort by chain order
    results.sort((a, b) => supportedChains.indexOf(a.chain as any) - supportedChains.indexOf(b.chain as any));
    setChainStatuses(results);

    const peers = await getP2PPeerCount();
    setPeerCount(peers);
    setChecking(false);
  }, [supportedChains]);

  // Refresh when detail modal opens
  useEffect(() => {
    if (showDetail) {
      refreshStatuses();
    }
  }, [showDetail, refreshStatuses]);

  const s = useMemo(() => StyleSheet.create({
    banner: {
      backgroundColor: t.accent.red,
      paddingVertical: 6,
      alignItems: 'center',
    },
    text: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    onlineBanner: {
      backgroundColor: t.bg.card,
      paddingVertical: 4,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    onlineText: {
      color: t.text.muted,
      fontSize: 11,
    },
    greenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: t.accent.green,
    },
    // Detail modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: t.bg.primary,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.bg.card,
    },
    modalTitle: {
      color: t.text.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    closeBtn: {
      color: t.accent.orange,
      fontSize: 15,
      fontWeight: '600',
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      color: t.text.secondary,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    chainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.bg.card,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    chainLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotGreen: {
      backgroundColor: t.accent.green,
    },
    dotRed: {
      backgroundColor: t.accent.red,
    },
    chainName: {
      color: t.text.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    latencyText: {
      color: t.text.muted,
      fontSize: 12,
    },
    peerRow: {
      backgroundColor: t.bg.card,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    peerLabel: {
      color: t.text.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    peerCount: {
      color: t.accent.blue,
      fontSize: 15,
      fontWeight: '700',
    },
    refreshBtn: {
      backgroundColor: t.accent.orange,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 24,
    },
    refreshBtnText: {
      color: t.bg.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    checkingText: {
      color: t.text.muted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
    },
  }), [t]);

  // Offline state: red banner
  if (!isOnline) {
    return (
      <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.8}>
        <View style={s.banner}>
          <Text style={s.text}>No internet connection — tap for details</Text>
        </View>
        {renderDetailModal()}
      </TouchableOpacity>
    );
  }

  // Online: nothing visible unless user taps (detail modal accessible from settings)
  // We keep the modal available but don't show a banner when everything is fine
  return showDetail ? renderDetailModal() : null;

  function renderDetailModal() {
    return (
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Network Status</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={s.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Internet connectivity */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Internet</Text>
              <View style={s.chainRow}>
                <View style={s.chainLeft}>
                  <View style={[s.statusDot, isOnline ? s.dotGreen : s.dotRed]} />
                  <Text style={s.chainName}>Internet Connection</Text>
                </View>
                <Text style={s.latencyText}>{isOnline ? 'Connected' : 'Offline'}</Text>
              </View>
            </View>

            {/* Per-chain status */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Chain RPCs</Text>
              {chainStatuses.length === 0 && !checking && (
                <Text style={s.checkingText}>Tap Refresh to check chain connectivity</Text>
              )}
              {chainStatuses.map((cs) => (
                <View key={cs.chain} style={s.chainRow}>
                  <View style={s.chainLeft}>
                    <View style={[s.statusDot, cs.connected ? s.dotGreen : s.dotRed]} />
                    <Text style={s.chainName}>{cs.label}</Text>
                  </View>
                  <Text style={s.latencyText}>
                    {cs.connected
                      ? cs.latencyMs != null ? `${cs.latencyMs}ms` : 'OK'
                      : 'Unreachable'}
                  </Text>
                </View>
              ))}
              {checking && <Text style={s.checkingText}>Checking connections...</Text>}
            </View>

            {/* P2P peer info (Open Chain) */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>P2P Network</Text>
              <View style={s.peerRow}>
                <Text style={s.peerLabel}>Connected Peers</Text>
                <Text style={s.peerCount}>{peerCount}</Text>
              </View>
            </View>

            {/* Refresh button */}
            <TouchableOpacity style={s.refreshBtn} onPress={refreshStatuses} disabled={checking}>
              <Text style={s.refreshBtnText}>{checking ? 'Checking...' : 'Refresh'}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }
});
