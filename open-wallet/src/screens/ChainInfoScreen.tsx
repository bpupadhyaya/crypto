import { fonts } from '../utils/theme';
/**
 * Chain Info Screen — Information about each supported blockchain.
 * Shows chain details, network status, block height, and explorer links.
 * Demo mode with sample data, live data fetched from RPC when available.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';
import { getNetworkConfig, isTestnet } from '../core/network';

// ─── Chain metadata ───

interface ChainMeta {
  id: string;
  name: string;
  icon: string;
  consensus: string;
  avgBlockTime: string;
  finality: string;
  nativeToken: string;
  explorerUrl: string;
  description: string;
}

const CHAIN_META: ChainMeta[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    icon: 'BTC',
    consensus: 'Proof of Work (SHA-256)',
    avgBlockTime: '~10 minutes',
    finality: '~60 minutes (6 confirmations)',
    nativeToken: 'BTC',
    explorerUrl: 'https://mempool.space',
    description: 'The original cryptocurrency and largest by market cap. Bitcoin uses proof-of-work mining to secure a decentralized ledger of transactions. Its fixed supply of 21 million coins makes it a deflationary store of value.',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: 'ETH',
    consensus: 'Proof of Stake (Casper FFG)',
    avgBlockTime: '~12 seconds',
    finality: '~15 minutes (2 epochs)',
    nativeToken: 'ETH',
    explorerUrl: 'https://etherscan.io',
    description: 'The leading smart contract platform. Ethereum supports DeFi, NFTs, and thousands of decentralized applications through its EVM. Post-Merge, it uses proof-of-stake for consensus, dramatically reducing energy usage.',
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: 'SOL',
    consensus: 'Proof of History + Tower BFT',
    avgBlockTime: '~400 milliseconds',
    finality: '~2 seconds (optimistic)',
    nativeToken: 'SOL',
    explorerUrl: 'https://explorer.solana.com',
    description: 'A high-performance blockchain designed for speed and low cost. Solana uses Proof of History to order transactions before consensus, achieving thousands of TPS with sub-second finality.',
  },
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    icon: 'ATOM',
    consensus: 'CometBFT (Tendermint)',
    avgBlockTime: '~6 seconds',
    finality: '~6 seconds (instant)',
    nativeToken: 'ATOM',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    description: 'The Internet of Blockchains. Cosmos enables interoperability between independent blockchains through IBC (Inter-Blockchain Communication). Its SDK makes it easy to build application-specific chains.',
  },
  {
    id: 'openchain',
    name: 'Open Chain',
    icon: 'OTK',
    consensus: 'PoH + PoC (Proof of Contribution)',
    avgBlockTime: '~5 seconds',
    finality: '~5 seconds (instant)',
    nativeToken: 'OTK',
    explorerUrl: 'https://github.com/bpupadhyaya/crypto',
    description: 'Open Chain models all human value transfer. Built on Cosmos SDK with a unique Proof of Contribution consensus — one human = one vote, earned by contributing. No pre-mine, no founder allocation, flat rewards. Designed to quantify parenting, education, and community contributions.',
  },
];

interface ChainStatus {
  blockHeight: string;
  networkStatus: 'online' | 'offline' | 'loading';
  lastChecked: number;
}

interface Props {
  onClose: () => void;
}

export const ChainInfoScreen = React.memo(({ onClose }: Props) => {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ChainStatus>>({});
  const [fetching, setFetching] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    title: { color: t.text.primary, fontSize: 22, fontWeight: fonts.heavy, textAlign: 'center', marginBottom: 4 },
    subtitle: { color: t.text.muted, fontSize: 13, textAlign: 'center', marginBottom: 20 },
    // Chain card
    chainCard: { backgroundColor: t.bg.card, borderRadius: 20, padding: 18, marginBottom: 12 },
    chainHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    chainIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    chainIconText: { fontSize: 18, fontWeight: fonts.heavy, color: '#fff' },
    chainName: { color: t.text.primary, fontSize: 17, fontWeight: fonts.bold },
    chainConsensus: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    // Status row
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border },
    statusItem: { alignItems: 'center', flex: 1 },
    statusLabel: { color: t.text.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    statusValue: { color: t.text.primary, fontSize: 13, fontWeight: fonts.semibold },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    statusOnline: { backgroundColor: t.accent.green },
    statusOffline: { backgroundColor: t.accent.red },
    statusLoading: { backgroundColor: t.accent.yellow },
    // Detail view
    detailSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    detailLabel: { color: t.text.muted, fontSize: 13 },
    detailValue: { color: t.text.secondary, fontSize: 13, fontWeight: fonts.semibold, maxWidth: '55%', textAlign: 'right' },
    description: { color: t.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 12 },
    explorerBtn: { backgroundColor: t.accent.blue + '15', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    explorerBtnText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold },
    // Toggle
    expandText: { color: t.accent.blue, fontSize: 13, fontWeight: fonts.semibold, marginTop: 10, textAlign: 'center' },
    // Network badge
    networkBadge: { alignSelf: 'center', backgroundColor: isTestnet() ? t.accent.yellow + '20' : t.accent.green + '20', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginBottom: 16 },
    networkBadgeText: { fontSize: 12, fontWeight: fonts.semibold, color: isTestnet() ? t.accent.yellow : t.accent.green },
    // Back
    backBtn: { paddingVertical: 16, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: 16 },
  }), [t]);

  // Fetch block heights from RPC
  const fetchStatuses = useCallback(async () => {
    setFetching(true);
    const config = getNetworkConfig();
    const newStatuses: Record<string, ChainStatus> = {};

    // Demo mode: use sample data
    if (demoMode) {
      const demoHeights: Record<string, string> = {
        bitcoin: '885,142',
        ethereum: '19,847,321',
        solana: '267,432,891',
        cosmos: '22,145,678',
        openchain: '1,234',
      };
      for (const chain of CHAIN_META) {
        newStatuses[chain.id] = {
          blockHeight: demoHeights[chain.id] ?? 'N/A',
          networkStatus: chain.id === 'openchain' ? 'offline' : 'online',
          lastChecked: Date.now(),
        };
      }
      setStatuses(newStatuses);
      setFetching(false);
      return;
    }

    // Real fetches with timeouts
    const fetchPromises = CHAIN_META.map(async (chain) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let height = 'N/A';
        let status: 'online' | 'offline' = 'offline';

        if (chain.id === 'ethereum') {
          const resp = await fetch(config.ethereum.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
            signal: controller.signal,
          });
          const data = await resp.json();
          if (data.result) {
            const num = parseInt(data.result, 16);
            height = num.toLocaleString();
            status = 'online';
          }
        } else if (chain.id === 'bitcoin') {
          const resp = await fetch(`${config.bitcoin.apiBase}/blocks/tip/height`, {
            signal: controller.signal,
          });
          const text = await resp.text();
          const num = parseInt(text, 10);
          if (!isNaN(num)) {
            height = num.toLocaleString();
            status = 'online';
          }
        } else if (chain.id === 'solana') {
          const resp = await fetch(config.solana.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'getSlot', params: [], id: 1 }),
            signal: controller.signal,
          });
          const data = await resp.json();
          if (data.result) {
            height = data.result.toLocaleString();
            status = 'online';
          }
        } else if (chain.id === 'cosmos' || chain.id === 'openchain') {
          const rpcUrl = chain.id === 'cosmos'
            ? 'https://rpc.cosmos.network'
            : config.openchain.rpcUrl;
          const resp = await fetch(`${rpcUrl}/status`, {
            signal: controller.signal,
          });
          const data = await resp.json();
          if (data.result?.sync_info?.latest_block_height) {
            height = parseInt(data.result.sync_info.latest_block_height, 10).toLocaleString();
            status = 'online';
          }
        }

        clearTimeout(timeout);
        newStatuses[chain.id] = { blockHeight: height, networkStatus: status, lastChecked: Date.now() };
      } catch {
        newStatuses[chain.id] = { blockHeight: 'N/A', networkStatus: 'offline', lastChecked: Date.now() };
      }
    });

    await Promise.allSettled(fetchPromises);
    setStatuses(newStatuses);
    setFetching(false);
  }, [demoMode]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getIconColor = (id: string): string => {
    const colors: Record<string, string> = {
      bitcoin: '#f7931a',
      ethereum: '#627eea',
      solana: '#9945ff',
      cosmos: '#2e3148',
      openchain: t.accent.green,
    };
    return colors[id] ?? t.accent.blue;
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>Supported Chains</Text>
        <Text style={s.subtitle}>
          Information about each blockchain supported by Open Wallet
        </Text>

        <View style={s.networkBadge}>
          <Text style={s.networkBadgeText}>
            {isTestnet() ? 'Testnet Mode' : 'Mainnet Mode'}
          </Text>
        </View>

        {fetching && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <ActivityIndicator color={t.text.muted} size="small" />
            <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 4 }}>Fetching network status...</Text>
          </View>
        )}

        {CHAIN_META.map((chain) => {
          const status = statuses[chain.id];
          const isExpanded = selectedChain === chain.id;
          const iconColor = getIconColor(chain.id);

          return (
            <TouchableOpacity
              key={chain.id}
              style={s.chainCard}
              onPress={() => setSelectedChain(isExpanded ? null : chain.id)}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={s.chainHeader}>
                <View style={[s.chainIcon, { backgroundColor: iconColor }]}>
                  <Text style={s.chainIconText}>{chain.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chainName}>{chain.name}</Text>
                  <Text style={s.chainConsensus}>{chain.consensus}</Text>
                </View>
                {status && (
                  <View style={[
                    s.statusDot,
                    status.networkStatus === 'online' ? s.statusOnline
                      : status.networkStatus === 'loading' ? s.statusLoading
                      : s.statusOffline,
                  ]} />
                )}
              </View>

              {/* Quick stats row */}
              <View style={s.statusRow}>
                <View style={s.statusItem}>
                  <Text style={s.statusLabel}>Block Height</Text>
                  <Text style={s.statusValue}>
                    {status?.blockHeight ?? (fetching ? '...' : 'N/A')}
                  </Text>
                </View>
                <View style={s.statusItem}>
                  <Text style={s.statusLabel}>Block Time</Text>
                  <Text style={s.statusValue}>{chain.avgBlockTime}</Text>
                </View>
                <View style={s.statusItem}>
                  <Text style={s.statusLabel}>Status</Text>
                  <Text style={[
                    s.statusValue,
                    {
                      color: status?.networkStatus === 'online' ? t.accent.green
                        : status?.networkStatus === 'offline' ? t.accent.red
                        : t.text.muted,
                    },
                  ]}>
                    {status?.networkStatus === 'online' ? 'Online'
                      : status?.networkStatus === 'offline' ? 'Offline'
                      : '...'}
                  </Text>
                </View>
              </View>

              {/* Expanded detail view */}
              {isExpanded && (
                <View style={s.detailSection}>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Native Token</Text>
                    <Text style={s.detailValue}>{chain.nativeToken}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Finality</Text>
                    <Text style={s.detailValue}>{chain.finality}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Consensus</Text>
                    <Text style={s.detailValue}>{chain.consensus}</Text>
                  </View>

                  <Text style={s.description}>{chain.description}</Text>

                  <TouchableOpacity
                    style={s.explorerBtn}
                    onPress={() => Linking.openURL(chain.explorerUrl)}
                  >
                    <Text style={s.explorerBtnText}>Open Block Explorer</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.expandText}>
                {isExpanded ? 'Tap to collapse' : 'Tap for details'}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={s.backBtn} onPress={onClose}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
});
