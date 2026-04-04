import { fonts } from '../utils/theme';
/**
 * Cross-Chain Bridge Screen — Unified bridge view for all supported chains.
 * Source/dest chain selectors, provider comparison (THORChain, Li.Fi, IBC),
 * bridge status tracker, and full bridge history.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

type Tab = 'bridge' | 'status' | 'history' | 'compare';

interface Props { onClose: () => void }

const CHAINS = ['Bitcoin', 'Ethereum', 'Solana', 'Cosmos', 'Open Chain'] as const;
type Chain = typeof CHAINS[number];

const CHAIN_TOKENS: Record<Chain, string[]> = {
  'Bitcoin': ['BTC'],
  'Ethereum': ['ETH', 'USDT', 'USDC', 'WBTC', 'DAI'],
  'Solana': ['SOL', 'USDC', 'RAY'],
  'Cosmos': ['ATOM', 'OSMO', 'USDC'],
  'Open Chain': ['OTK', 'nOTK'],
};

interface BridgeProvider {
  id: string;
  name: string;
  icon: string;
  fee: string;
  time: string;
  security: string;
  securityScore: number;
  routes: string;
  available: boolean;
}

const PROVIDERS: BridgeProvider[] = [
  { id: 'thorchain', name: 'THORChain', icon: '\u26A1', fee: '0.3%', time: '~10 min', security: '4/5', securityScore: 4, routes: 'BTC, ETH, ATOM, SOL', available: true },
  { id: 'lifi', name: 'Li.Fi', icon: '\uD83C\uDF09', fee: '0.1-0.5%', time: '2-15 min', security: '3.5/5', securityScore: 3.5, routes: 'EVM chains', available: true },
  { id: 'ibc', name: 'IBC Protocol', icon: '\uD83D\uDD17', fee: '~0%', time: '~30 sec', security: '5/5', securityScore: 5, routes: 'Cosmos ecosystem', available: true },
];

interface PendingBridge {
  id: string;
  from: Chain;
  to: Chain;
  token: string;
  amount: string;
  provider: string;
  status: string;
  progress: number;
  startedAt: string;
  sourceTx: string;
}

interface CompletedBridge {
  id: string;
  from: Chain;
  to: Chain;
  token: string;
  amount: string;
  provider: string;
  completedAt: string;
  sourceTx: string;
  destTx: string;
  fee: string;
}

const DEMO_PENDING: PendingBridge[] = [
  {
    id: 'pb1', from: 'Bitcoin', to: 'Ethereum', token: 'BTC', amount: '0.15',
    provider: 'THORChain', status: 'Confirming on Bitcoin', progress: 0.4,
    startedAt: '2 min ago', sourceTx: 'bc1q...7f3k',
  },
  {
    id: 'pb2', from: 'Ethereum', to: 'Open Chain', token: 'USDC', amount: '500.00',
    provider: 'Li.Fi', status: 'Bridging via relay', progress: 0.75,
    startedAt: '5 min ago', sourceTx: '0xab3...9e1f',
  },
];

const DEMO_COMPLETED: CompletedBridge[] = [
  {
    id: 'cb1', from: 'Cosmos', to: 'Open Chain', token: 'ATOM', amount: '25.0',
    provider: 'IBC', completedAt: 'Mar 28, 14:22', sourceTx: 'cosmos1...3xk2',
    destTx: 'ochain1...8mv4', fee: '0.001 ATOM',
  },
  {
    id: 'cb2', from: 'Solana', to: 'Ethereum', token: 'SOL', amount: '10.0',
    provider: 'THORChain', completedAt: 'Mar 27, 09:15', sourceTx: '5Xkn...Gp2H',
    destTx: '0xcd7...2a3b', fee: '0.03 SOL',
  },
  {
    id: 'cb3', from: 'Ethereum', to: 'Cosmos', token: 'USDC', amount: '1,200.00',
    provider: 'Li.Fi', completedAt: 'Mar 26, 18:40', sourceTx: '0x91f...bc45',
    destTx: 'cosmos1...7qp9', fee: '$1.80',
  },
];

export function CrossChainBridgeScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('bridge');
  const [sourceChain, setSourceChain] = useState<Chain>('Ethereum');
  const [destChain, setDestChain] = useState<Chain>('Open Chain');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const availableTokens = useMemo(() => CHAIN_TOKENS[sourceChain] || [], [sourceChain]);

  const handleSourceChange = useCallback((chain: Chain) => {
    setSourceChain(chain);
    if (chain === destChain) {
      const other = CHAINS.find(c => c !== chain) || 'Bitcoin';
      setDestChain(other);
    }
    const tokens = CHAIN_TOKENS[chain];
    setSelectedToken(tokens[0]);
  }, [destChain]);

  const handleDestChange = useCallback((chain: Chain) => {
    if (chain === sourceChain) return;
    setDestChain(chain);
  }, [sourceChain]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    placeholder: { width: 60 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: t.bg.card, borderRadius: 12, padding: 3 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.purple },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff', fontWeight: fonts.bold },
    sectionLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10 },
    chainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chainChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    chainChipActive: { backgroundColor: t.accent.purple },
    chainChipDisabled: { opacity: 0.4 },
    chipText: { color: t.text.secondary, fontSize: fonts.sm },
    chipTextActive: { color: '#fff', fontWeight: fonts.bold },
    tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    tokenChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: t.bg.card },
    tokenChipActive: { backgroundColor: t.accent.green },
    tokenText: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tokenTextActive: { color: t.bg.primary, fontWeight: fonts.bold },
    arrowContainer: { alignItems: 'center', marginVertical: 8 },
    arrow: { color: t.accent.green, fontSize: fonts.xxl, fontWeight: fonts.heavy },
    // Provider cards
    providerCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    providerCardSelected: { borderWidth: 2, borderColor: t.accent.green },
    providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    providerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    providerIcon: { fontSize: fonts.xxl },
    providerName: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    providerMeta: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
    metaItem: { gap: 2 },
    metaLabel: { color: t.text.muted, fontSize: fonts.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    metaValue: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    securityHigh: { color: t.accent.green },
    securityMid: { color: t.accent.orange || '#f0a030' },
    bridgeBtn: { backgroundColor: t.accent.purple, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    bridgeBtnText: { color: '#fff', fontSize: fonts.lg, fontWeight: fonts.heavy },
    bridgeBtnDisabled: { opacity: 0.5 },
    // Status cards
    statusCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    statusRoute: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    statusAmount: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.heavy },
    statusLabel: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 6 },
    progressBg: { height: 6, backgroundColor: t.bg.primary, borderRadius: 3 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: t.accent.purple },
    statusMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    statusMetaText: { color: t.text.muted, fontSize: fonts.sm },
    // History cards
    historyCard: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 10 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    historyRoute: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    historyAmount: { color: t.accent.green, fontSize: fonts.md, fontWeight: fonts.bold },
    historyDate: { color: t.text.muted, fontSize: fonts.sm, marginBottom: 4 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    historyLabel: { color: t.text.muted, fontSize: fonts.xs },
    historyValue: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold },
    hashText: { color: t.accent.blue, fontSize: fonts.sm, fontWeight: fonts.medium },
    completeBadge: { backgroundColor: t.accent.green + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    completeBadgeText: { color: t.accent.green, fontSize: fonts.xs, fontWeight: fonts.bold },
    // Compare tab
    compareHeader: { flexDirection: 'row', backgroundColor: t.bg.card, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
    compareCol: { flex: 1, alignItems: 'center' },
    compareLabel: { color: t.text.muted, fontSize: fonts.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    compareValue: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    compareBest: { color: t.accent.green, fontWeight: fonts.heavy },
    emptyText: { color: t.text.muted, fontSize: fonts.md, textAlign: 'center', marginTop: 40 },
    demoTag: { color: t.accent.orange || '#f0a030', fontSize: fonts.xs, fontWeight: fonts.bold, textAlign: 'center', marginBottom: 8 },
  }), [t]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'bridge', label: 'Bridge' },
    { key: 'status', label: 'Status' },
    { key: 'history', label: 'History' },
    { key: 'compare', label: 'Compare' },
  ];

  const renderBridgeTab = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      {demoMode && <Text style={s.demoTag}>DEMO MODE</Text>}

      <Text style={s.sectionLabel}>Source Chain</Text>
      <View style={s.chainRow}>
        {CHAINS.map(chain => (
          <TouchableOpacity
            key={chain}
            style={[s.chainChip, sourceChain === chain && s.chainChipActive]}
            onPress={() => handleSourceChange(chain)}
          >
            <Text style={[s.chipText, sourceChain === chain && s.chipTextActive]}>{chain}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Token</Text>
      <View style={s.tokenRow}>
        {availableTokens.map(tk => (
          <TouchableOpacity
            key={tk}
            style={[s.tokenChip, selectedToken === tk && s.tokenChipActive]}
            onPress={() => setSelectedToken(tk)}
          >
            <Text style={[s.tokenText, selectedToken === tk && s.tokenTextActive]}>{tk}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.arrowContainer}>
        <Text style={s.arrow}>{'\u2193'}</Text>
      </View>

      <Text style={s.sectionLabel}>Destination Chain</Text>
      <View style={s.chainRow}>
        {CHAINS.map(chain => (
          <TouchableOpacity
            key={chain}
            style={[
              s.chainChip,
              destChain === chain && s.chainChipActive,
              chain === sourceChain && s.chainChipDisabled,
            ]}
            onPress={() => handleDestChange(chain)}
            disabled={chain === sourceChain}
          >
            <Text style={[s.chipText, destChain === chain && s.chipTextActive]}>{chain}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>Select Provider</Text>
      {PROVIDERS.map(p => (
        <TouchableOpacity
          key={p.id}
          style={[s.providerCard, selectedProvider === p.id && s.providerCardSelected]}
          onPress={() => setSelectedProvider(p.id)}
        >
          <View style={s.providerHeader}>
            <View style={s.providerLeft}>
              <Text style={s.providerIcon}>{p.icon}</Text>
              <Text style={s.providerName}>{p.name}</Text>
            </View>
            <Text style={[s.metaValue, p.securityScore >= 4.5 ? s.securityHigh : s.securityMid]}>
              {p.security}
            </Text>
          </View>
          <View style={s.providerMeta}>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Fee</Text>
              <Text style={s.metaValue}>{p.fee}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Time</Text>
              <Text style={s.metaValue}>{p.time}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Routes</Text>
              <Text style={s.metaValue}>{p.routes}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[s.bridgeBtn, !selectedProvider && s.bridgeBtnDisabled]}
        disabled={!selectedProvider}
      >
        <Text style={s.bridgeBtnText}>
          Bridge {selectedToken} from {sourceChain} to {destChain}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStatusTab = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionLabel}>Pending Bridges ({DEMO_PENDING.length})</Text>
      {DEMO_PENDING.map(b => (
        <View key={b.id} style={s.statusCard}>
          <View style={s.statusHeader}>
            <Text style={s.statusRoute}>{b.from} {'\u2192'} {b.to}</Text>
            <Text style={s.statusAmount}>{b.amount} {b.token}</Text>
          </View>
          <Text style={s.statusLabel}>{b.status}</Text>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${b.progress * 100}%` }]} />
          </View>
          <View style={s.statusMeta}>
            <Text style={s.statusMetaText}>via {b.provider}</Text>
            <Text style={s.statusMetaText}>Started {b.startedAt}</Text>
          </View>
          <View style={s.statusMeta}>
            <Text style={s.hashText}>Source: {b.sourceTx}</Text>
          </View>
        </View>
      ))}
      {DEMO_PENDING.length === 0 && (
        <Text style={s.emptyText}>No pending bridges</Text>
      )}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionLabel}>Completed Bridges ({DEMO_COMPLETED.length})</Text>
      {DEMO_COMPLETED.map(b => (
        <View key={b.id} style={s.historyCard}>
          <View style={s.historyHeader}>
            <Text style={s.historyRoute}>{b.from} {'\u2192'} {b.to}</Text>
            <Text style={s.historyAmount}>{b.amount} {b.token}</Text>
          </View>
          <Text style={s.historyDate}>{b.completedAt}</Text>
          <View style={s.historyRow}>
            <Text style={s.historyLabel}>Provider</Text>
            <Text style={s.historyValue}>{b.provider}</Text>
          </View>
          <View style={s.historyRow}>
            <Text style={s.historyLabel}>Fee</Text>
            <Text style={s.historyValue}>{b.fee}</Text>
          </View>
          <View style={s.historyRow}>
            <Text style={s.historyLabel}>Source Tx</Text>
            <Text style={s.hashText}>{b.sourceTx}</Text>
          </View>
          <View style={s.historyRow}>
            <Text style={s.historyLabel}>Dest Tx</Text>
            <Text style={s.hashText}>{b.destTx}</Text>
          </View>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <View style={s.completeBadge}>
              <Text style={s.completeBadgeText}>COMPLETE</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderCompareTab = () => (
    <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionLabel}>Provider Comparison</Text>

      {/* Header row */}
      <View style={s.compareHeader}>
        <View style={s.compareCol}>
          <Text style={s.compareLabel}>Provider</Text>
        </View>
        <View style={s.compareCol}>
          <Text style={s.compareLabel}>Fee</Text>
        </View>
        <View style={s.compareCol}>
          <Text style={s.compareLabel}>Speed</Text>
        </View>
        <View style={s.compareCol}>
          <Text style={s.compareLabel}>Security</Text>
        </View>
      </View>

      {PROVIDERS.map(p => {
        const isBestSecurity = p.securityScore === Math.max(...PROVIDERS.map(pp => pp.securityScore));
        return (
          <View key={p.id} style={s.compareHeader}>
            <View style={s.compareCol}>
              <Text style={s.compareValue}>{p.icon} {p.name}</Text>
            </View>
            <View style={s.compareCol}>
              <Text style={s.compareValue}>{p.fee}</Text>
            </View>
            <View style={s.compareCol}>
              <Text style={s.compareValue}>{p.time}</Text>
            </View>
            <View style={s.compareCol}>
              <Text style={[s.compareValue, isBestSecurity && s.compareBest]}>
                {p.security}
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={s.sectionLabel}>Route Coverage</Text>
      {PROVIDERS.map(p => (
        <View key={p.id} style={s.providerCard}>
          <Text style={s.providerName}>{p.icon} {p.name}</Text>
          <Text style={[s.metaValue, { marginTop: 6 }]}>{p.routes}</Text>
          <Text style={[s.metaLabel, { marginTop: 4 }]}>
            {p.id === 'ibc' ? 'Trustless, native Cosmos interchain' :
             p.id === 'thorchain' ? 'Cross-chain, native assets, no wrapping' :
             'EVM aggregator, many routes, wrapped assets'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Cross-Chain Bridge</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.tabRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'bridge' && renderBridgeTab()}
      {tab === 'status' && renderStatusTab()}
      {tab === 'history' && renderHistoryTab()}
      {tab === 'compare' && renderCompareTab()}
    </SafeAreaView>
  );
}
