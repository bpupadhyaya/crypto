/**
 * Network Stats Screen — P2P network statistics.
 *
 * View connected peers, block production, and bandwidth usage.
 * Demo mode with sample network data.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// ─── Types ───

interface Peer {
  id: string;
  address: string;
  region: string;
  latency: number;
  connected: string;
  version: string;
  blocks: number;
}

interface Block {
  height: number;
  hash: string;
  txCount: number;
  size: number;
  timestamp: string;
  validator: string;
}

interface Props {
  onClose: () => void;
}

// ─── Demo Data ───

const DEMO_PEERS: Peer[] = [
  { id: '1', address: 'openchain1abc...peer_01', region: 'US-West', latency: 24, connected: '2d 14h', version: '0.9.1', blocks: 48210 },
  { id: '2', address: 'openchain1def...peer_02', region: 'EU-Central', latency: 89, connected: '5d 3h', version: '0.9.1', blocks: 48208 },
  { id: '3', address: 'openchain1ghi...peer_03', region: 'Asia-East', latency: 142, connected: '1d 8h', version: '0.9.0', blocks: 48205 },
  { id: '4', address: 'openchain1jkl...peer_04', region: 'US-East', latency: 31, connected: '8d 22h', version: '0.9.1', blocks: 48210 },
  { id: '5', address: 'openchain1mno...peer_05', region: 'SA-South', latency: 178, connected: '3d 6h', version: '0.9.1', blocks: 48207 },
  { id: '6', address: 'openchain1pqr...peer_06', region: 'AF-West', latency: 201, connected: '12h', version: '0.9.0', blocks: 48200 },
];

const DEMO_BLOCKS: Block[] = [
  { height: 48210, hash: '0xfa8c...3e21', txCount: 42, size: 18400, timestamp: '2026-03-31 14:32', validator: 'validator_alpha' },
  { height: 48209, hash: '0xbb71...9f44', txCount: 38, size: 16200, timestamp: '2026-03-31 14:28', validator: 'validator_beta' },
  { height: 48208, hash: '0xcc52...1a88', txCount: 51, size: 21800, timestamp: '2026-03-31 14:24', validator: 'validator_gamma' },
  { height: 48207, hash: '0xdd93...7c12', txCount: 29, size: 12400, timestamp: '2026-03-31 14:20', validator: 'validator_alpha' },
  { height: 48206, hash: '0xee14...5d67', txCount: 45, size: 19600, timestamp: '2026-03-31 14:16', validator: 'validator_delta' },
  { height: 48205, hash: '0xff85...8e93', txCount: 33, size: 14100, timestamp: '2026-03-31 14:12', validator: 'validator_beta' },
];

type Tab = 'peers' | 'blocks' | 'bandwidth';

export function NetworkStatsScreen({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('peers');
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();

  const bandwidthStats = useMemo(() => ({
    inbound: '12.4 MB/h', outbound: '8.7 MB/h', total24h: '482 MB',
    peakHour: '14:00-15:00', avgBlockSize: '17.1 KB', syncStatus: '100%',
  }), []);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '800' },
    closeBtn: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingBottom: 40 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12 },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginHorizontal: 4 },
    tabActive: { backgroundColor: t.accent.blue + '20' },
    tabText: { color: t.text.muted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: t.accent.blue },
    card: { backgroundColor: t.bg.secondary, borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
    sectionTitle: { color: t.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 12, marginHorizontal: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    summaryItem: { alignItems: 'center' },
    summaryValue: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    summaryLabel: { color: t.text.muted, fontSize: 11, marginTop: 2 },
    peerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    peerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent.green, marginRight: 12 },
    peerInfo: { flex: 1 },
    peerAddr: { color: t.text.primary, fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
    peerMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    peerLatency: { fontSize: 14, fontWeight: '700' },
    blockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    blockHeight: { width: 64 },
    blockNum: { color: t.accent.blue, fontSize: 14, fontWeight: '800' },
    blockInfo: { flex: 1 },
    blockHash: { color: t.text.primary, fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
    blockMeta: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    blockSize: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    bwRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: t.bg.primary, borderBottomWidth: 1 },
    bwLabel: { color: t.text.secondary, fontSize: 14 },
    bwValue: { color: t.text.primary, fontSize: 14, fontWeight: '700' },
    demoTag: { backgroundColor: t.accent.orange + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'center', marginBottom: 12 },
    demoText: { color: t.accent.orange, fontSize: 11, fontWeight: '700' },
  }), [t]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'peers', label: 'Peers' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'bandwidth', label: 'Bandwidth' },
  ];

  const renderPeers = () => (
    <>
      <View style={s.card}>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.green }]}>{DEMO_PEERS.length}</Text><Text style={s.summaryLabel}>Connected</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryValue}>{DEMO_BLOCKS[0].height.toLocaleString()}</Text><Text style={s.summaryLabel}>Block Height</Text></View>
          <View style={s.summaryItem}><Text style={[s.summaryValue, { color: t.accent.blue }]}>4m</Text><Text style={s.summaryLabel}>Block Time</Text></View>
        </View>
      </View>
      <Text style={s.sectionTitle}>Connected Peers</Text>
      <View style={s.card}>
        {DEMO_PEERS.map((p) => (
          <View key={p.id} style={s.peerRow}>
            <View style={s.peerDot} />
            <View style={s.peerInfo}>
              <Text style={s.peerAddr}>{p.address}</Text>
              <Text style={s.peerMeta}>{p.region} | v{p.version} | {p.connected} | blk #{p.blocks}</Text>
            </View>
            <Text style={[s.peerLatency, { color: p.latency < 50 ? t.accent.green : p.latency < 150 ? t.accent.orange : t.accent.red }]}>{p.latency}ms</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderBlocks = () => (
    <>
      <Text style={s.sectionTitle}>Recent Blocks</Text>
      <View style={s.card}>
        {DEMO_BLOCKS.map((b) => (
          <View key={b.height} style={s.blockRow}>
            <View style={s.blockHeight}><Text style={s.blockNum}>#{b.height}</Text></View>
            <View style={s.blockInfo}>
              <Text style={s.blockHash}>{b.hash}</Text>
              <Text style={s.blockMeta}>{b.timestamp} | {b.txCount} txs | {b.validator}</Text>
            </View>
            <Text style={s.blockSize}>{(b.size / 1024).toFixed(1)}KB</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderBandwidth = () => (
    <>
      <Text style={s.sectionTitle}>Bandwidth Usage</Text>
      <View style={s.card}>
        {Object.entries(bandwidthStats).map(([key, val]) => (
          <View key={key} style={s.bwRow}>
            <Text style={s.bwLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</Text>
            <Text style={s.bwValue}>{val}</Text>
          </View>
        ))}
      </View>
      <View style={[s.card, { alignItems: 'center' }]}>
        <Text style={[s.bwLabel, { textAlign: 'center', lineHeight: 20 }]}>
          Open Chain uses minimal bandwidth.{'\n'}
          P2P gossip protocol optimizes data relay{'\n'}
          across all connected peers.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.closeBtn}>{'\u2190'} Back</Text></TouchableOpacity>
        <Text style={s.title}>Network Stats</Text>
        <View style={{ width: 60 }} />
      </View>
      {demoMode && (<View style={s.demoTag}><Text style={s.demoText}>DEMO MODE</Text></View>)}
      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity key={tb.key} style={[s.tabBtn, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {tab === 'peers' && renderPeers()}
        {tab === 'blocks' && renderBlocks()}
        {tab === 'bandwidth' && renderBandwidth()}
      </ScrollView>
    </SafeAreaView>
  );
}
