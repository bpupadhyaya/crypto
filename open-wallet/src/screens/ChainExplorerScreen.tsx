import { fonts } from '../utils/theme';
/**
 * Chain Explorer — On-chain block and transaction explorer.
 *
 * A built-in blockchain explorer for Open Chain. Browse blocks,
 * view transactions, and search for specific addresses or hashes.
 * Full transparency into the chain's operation.
 *
 * Features:
 * - Blocks: browse recent blocks with details
 * - Transactions: view recent transactions across all channels
 * - Search: find blocks, transactions, or addresses by hash/UID
 * - Demo mode with sample chain data
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

interface Props {
  onClose: () => void;
}

type ExplorerTab = 'blocks' | 'transactions' | 'search';

interface Block {
  height: number;
  hash: string;
  timestamp: string;
  txCount: number;
  validator: string;
  size: number;
  totalOTKMinted: number;
  totalOTKBurned: number;
  channels: string[];
}

interface Transaction {
  hash: string;
  type: 'mint' | 'burn' | 'transfer' | 'vote' | 'stake';
  from: string;
  to: string;
  amount: number;
  channel: string;
  channelIcon: string;
  blockHeight: number;
  timestamp: string;
  status: 'confirmed' | 'pending';
  fee: number;
}

const TX_TYPE_COLORS: Record<string, string> = {
  mint: '#22c55e',
  burn: '#ef4444',
  transfer: '#3b82f6',
  vote: '#8b5cf6',
  stake: '#f7931a',
};

const TX_TYPE_LABELS: Record<string, string> = {
  mint: 'Mint',
  burn: 'Burn',
  transfer: 'Transfer',
  vote: 'Vote',
  stake: 'Stake',
};

const DEMO_BLOCKS: Block[] = [
  { height: 48291, hash: '0xab3f7e21...4c88d1', timestamp: '12 sec ago', txCount: 24, validator: 'UID-0042', size: 4_812, totalOTKMinted: 3_200, totalOTKBurned: 500, channels: ['nurture', 'education', 'health'] },
  { height: 48290, hash: '0x9f21cc44...7a33e2', timestamp: '28 sec ago', txCount: 18, validator: 'UID-1108', size: 3_640, totalOTKMinted: 2_450, totalOTKBurned: 0, channels: ['community', 'governance'] },
  { height: 48289, hash: '0x5d88ea12...1b92f7', timestamp: '44 sec ago', txCount: 31, validator: 'UID-0089', size: 6_224, totalOTKMinted: 4_800, totalOTKBurned: 200, channels: ['education', 'economic', 'health'] },
  { height: 48288, hash: '0x1a77bf93...8e55a4', timestamp: '1 min ago', txCount: 12, validator: 'UID-2201', size: 2_488, totalOTKMinted: 1_600, totalOTKBurned: 0, channels: ['nurture'] },
  { height: 48287, hash: '0xcc42de68...3f11b9', timestamp: '1 min ago', txCount: 22, validator: 'UID-0042', size: 4_408, totalOTKMinted: 3_100, totalOTKBurned: 800, channels: ['governance', 'community', 'economic'] },
  { height: 48286, hash: '0x88f1a2b3...9c44d7', timestamp: '2 min ago', txCount: 16, validator: 'UID-3350', size: 3_264, totalOTKMinted: 2_200, totalOTKBurned: 0, channels: ['health', 'nurture'] },
  { height: 48285, hash: '0x44aa9e71...2d88c1', timestamp: '2 min ago', txCount: 28, validator: 'UID-1108', size: 5_616, totalOTKMinted: 3_900, totalOTKBurned: 150, channels: ['education', 'community'] },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { hash: '0xf1a2b3...9c44', type: 'mint', from: 'System', to: 'UID-8372', amount: 150, channel: 'Nurture', channelIcon: '\u{1F49B}', blockHeight: 48291, timestamp: '12 sec ago', status: 'confirmed', fee: 0 },
  { hash: '0xd4e5f6...1a22', type: 'transfer', from: 'UID-4451', to: 'UID-7742', amount: 500, channel: 'Economic', channelIcon: '\u{1F4B0}', blockHeight: 48291, timestamp: '12 sec ago', status: 'confirmed', fee: 0.1 },
  { hash: '0xa7b8c9...3d55', type: 'vote', from: 'UID-1290', to: 'Proposal #47', amount: 0, channel: 'Governance', channelIcon: '\u{1F5F3}', blockHeight: 48290, timestamp: '28 sec ago', status: 'confirmed', fee: 0 },
  { hash: '0x1122aa...8f77', type: 'burn', from: 'UID-9021', to: 'Burn Address', amount: 500, channel: 'Education', channelIcon: '\u{1F4DA}', blockHeight: 48291, timestamp: '12 sec ago', status: 'confirmed', fee: 0 },
  { hash: '0xbb33cc...4e99', type: 'mint', from: 'System', to: 'UID-6673', amount: 300, channel: 'Health', channelIcon: '\u{1FA7A}', blockHeight: 48289, timestamp: '44 sec ago', status: 'confirmed', fee: 0 },
  { hash: '0x55dd66...7a11', type: 'stake', from: 'UID-7742', to: 'Validator Pool', amount: 1000, channel: 'Governance', channelIcon: '\u{1F5F3}', blockHeight: 48289, timestamp: '44 sec ago', status: 'confirmed', fee: 0 },
  { hash: '0xee77ff...2b33', type: 'transfer', from: 'UID-2205', to: 'UID-3318', amount: 250, channel: 'Community', channelIcon: '\u{1F91D}', blockHeight: 48288, timestamp: '1 min ago', status: 'confirmed', fee: 0.1 },
  { hash: '0x99aa00...5c88', type: 'mint', from: 'System', to: 'UID-5530', amount: 200, channel: 'Education', channelIcon: '\u{1F4DA}', blockHeight: 48287, timestamp: '1 min ago', status: 'pending', fee: 0 },
];

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function ChainExplorerScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<ExplorerTab>('blocks');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg },
    scroll: { flex: 1, paddingHorizontal: 16 },
    subtitle: { color: t.text.muted, fontSize: fonts.sm, lineHeight: 19, marginBottom: 16 },
    tabRow: { flexDirection: 'row', marginBottom: 16, gap: 4 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: t.bg.card, alignItems: 'center' },
    tabActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { color: t.text.muted, fontSize: fonts.sm },
    val: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    empty: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.heavy, marginBottom: 2 },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, fontWeight: fonts.semibold, textAlign: 'center' },
    blockHeight: { color: t.accent.blue, fontSize: fonts.xl, fontWeight: fonts.heavy },
    blockHash: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'monospace', marginTop: 2 },
    txHash: { color: t.accent.blue, fontSize: fonts.xs, fontFamily: 'monospace' },
    txAmount: { fontSize: fonts.md, fontWeight: fonts.heavy },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeText: { fontSize: fonts.xs, fontWeight: fonts.bold, color: '#fff' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontSize: fonts.xs, fontWeight: fonts.semibold },
    channelPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    channelPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: t.border },
    channelPillText: { color: t.text.secondary, fontSize: fonts.xs, fontWeight: fonts.semibold },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    liveText: { color: '#22c55e', fontSize: fonts.sm, fontWeight: fonts.bold },
    backBtn: { paddingVertical: 10, alignItems: 'center' },
    backText: { color: t.accent.blue, fontSize: fonts.md },
    searchHint: { color: t.text.muted, fontSize: fonts.sm, textAlign: 'center', marginTop: 20, lineHeight: 19 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  }), [t]);

  const blocks = demoMode ? DEMO_BLOCKS : [];
  const transactions = demoMode ? DEMO_TRANSACTIONS : [];
  const latestBlock = blocks.length > 0 ? blocks[0] : null;
  const totalTxCount = blocks.reduce((s, b) => s + b.txCount, 0);

  if (selectedBlock) {
    const b = selectedBlock;
    const blockTxs = transactions.filter(tx => tx.blockHeight === b.height);
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>Block #{b.height.toLocaleString()}</Text>
          <TouchableOpacity onPress={() => setSelectedBlock(null)}>
            <Text style={st.closeBtn}>Back</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={st.scroll}>
          <View style={st.card}>
            <View style={st.row}><Text style={st.label}>Hash</Text><Text style={st.blockHash}>{b.hash}</Text></View>
            <View style={st.row}><Text style={st.label}>Timestamp</Text><Text style={st.val}>{b.timestamp}</Text></View>
            <View style={st.row}><Text style={st.label}>Validator</Text><Text style={st.val}>{b.validator}</Text></View>
            <View style={st.row}><Text style={st.label}>Transactions</Text><Text style={st.val}>{b.txCount}</Text></View>
            <View style={st.row}><Text style={st.label}>Size</Text><Text style={st.val}>{formatSize(b.size)}</Text></View>
            <View style={st.row}><Text style={st.label}>OTK Minted</Text><Text style={{ color: t.accent.green, fontSize: fonts.sm, fontWeight: fonts.bold }}>+{b.totalOTKMinted.toLocaleString()}</Text></View>
            <View style={st.row}><Text style={st.label}>OTK Burned</Text><Text style={{ color: t.accent.red, fontSize: fonts.sm, fontWeight: fonts.bold }}>-{b.totalOTKBurned.toLocaleString()}</Text></View>
          </View>
          {blockTxs.length > 0 && (
            <>
              <Text style={st.section}>Transactions in Block</Text>
              {blockTxs.map(tx => (
                <View key={tx.hash} style={st.card}>
                  <View style={st.row}>
                    <View style={[st.typeBadge, { backgroundColor: TX_TYPE_COLORS[tx.type] }]}>
                      <Text style={st.typeText}>{TX_TYPE_LABELS[tx.type]}</Text>
                    </View>
                    {tx.amount > 0 && (
                      <Text style={[st.txAmount, { color: tx.type === 'burn' ? t.accent.red : t.accent.green }]}>
                        {tx.type === 'burn' ? '-' : '+'}{tx.amount} OTK
                      </Text>
                    )}
                  </View>
                  <View style={st.row}><Text style={st.label}>From</Text><Text style={st.val}>{tx.from}</Text></View>
                  <View style={st.row}><Text style={st.label}>To</Text><Text style={st.val}>{tx.to}</Text></View>
                  <Text style={st.txHash}>{tx.hash}</Text>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>Chain Explorer</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.closeBtn}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={st.scroll}>
        <Text style={st.subtitle}>
          Explore Open Chain blocks, transactions, and addresses with full transparency.
        </Text>

        {demoMode && latestBlock && (
          <View style={st.summaryRow}>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.blue }]}>#{latestBlock.height.toLocaleString()}</Text>
              <Text style={st.summaryLabel}>Latest Block</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.accent.green }]}>{totalTxCount}</Text>
              <Text style={st.summaryLabel}>Recent Txs</Text>
            </View>
            <View style={st.summaryCard}>
              <Text style={[st.summaryNum, { color: t.text.primary }]}>~16s</Text>
              <Text style={st.summaryLabel}>Block Time</Text>
            </View>
          </View>
        )}

        <View style={st.tabRow}>
          {(['blocks', 'transactions', 'search'] as ExplorerTab[]).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'blocks' && (
          blocks.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see block data.</Text>
          ) : (
            <>
              <View style={st.liveIndicator}>
                <View style={st.liveDot} />
                <Text style={st.liveText}>Live Chain</Text>
              </View>
              {blocks.map(b => (
                <TouchableOpacity key={b.height} style={st.card} onPress={() => setSelectedBlock(b)}>
                  <View style={st.row}>
                    <Text style={st.blockHeight}>#{b.height.toLocaleString()}</Text>
                    <Text style={st.val}>{b.timestamp}</Text>
                  </View>
                  <View style={st.row}><Text style={st.label}>Transactions</Text><Text style={st.val}>{b.txCount}</Text></View>
                  <View style={st.row}><Text style={st.label}>Validator</Text><Text style={st.val}>{b.validator}</Text></View>
                  <View style={st.channelPills}>
                    {b.channels.map(ch => (
                      <View key={ch} style={st.channelPill}>
                        <Text style={st.channelPillText}>{ch}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )
        )}

        {activeTab === 'transactions' && (
          transactions.length === 0 ? (
            <Text style={st.empty}>Enable Demo Mode to see transactions.</Text>
          ) : transactions.map(tx => (
            <View key={tx.hash} style={st.card}>
              <View style={st.row}>
                <View style={[st.typeBadge, { backgroundColor: TX_TYPE_COLORS[tx.type] }]}>
                  <Text style={st.typeText}>{TX_TYPE_LABELS[tx.type]}</Text>
                </View>
                <View style={st.statusRow}>
                  <View style={[st.statusDot, { backgroundColor: tx.status === 'confirmed' ? '#22c55e' : '#eab308' }]} />
                  <Text style={[st.statusText, { color: tx.status === 'confirmed' ? t.accent.green : t.accent.yellow }]}>{tx.status}</Text>
                </View>
              </View>
              <View style={st.row}>
                <Text style={st.label}>From</Text>
                <Text style={st.val}>{tx.from}</Text>
              </View>
              <View style={st.row}>
                <Text style={st.label}>To</Text>
                <Text style={st.val}>{tx.to}</Text>
              </View>
              {tx.amount > 0 && (
                <View style={st.row}>
                  <Text style={st.label}>Amount</Text>
                  <Text style={[st.txAmount, { color: tx.type === 'burn' ? t.accent.red : t.accent.green }]}>
                    {tx.type === 'burn' ? '-' : ''}{tx.amount} {tx.channelIcon}
                  </Text>
                </View>
              )}
              <View style={st.row}>
                <Text style={st.label}>Block</Text>
                <Text style={[st.val, { color: t.accent.blue }]}>#{tx.blockHeight}</Text>
              </View>
              <Text style={st.txHash}>{tx.hash}</Text>
            </View>
          ))
        )}

        {activeTab === 'search' && (
          <View style={st.card}>
            <Text style={st.searchHint}>
              Search the blockchain by block height, transaction hash, or UID address.
              {'\n\n'}In Demo Mode, explore blocks and transactions using the tabs above.
              {'\n\n'}Full search with auto-complete and cross-reference will be available when connected to the P2P network.
            </Text>
          </View>
        )}

        {!demoMode && activeTab !== 'search' && (
          <View style={[st.card, { marginTop: 20 }]}>
            <Text style={{ color: t.text.muted, fontSize: fonts.sm, textAlign: 'center' }}>
              Enable Demo Mode in Settings to see sample chain data.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
