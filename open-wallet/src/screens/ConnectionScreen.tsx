import { fonts } from '../utils/theme';
/**
 * Connection Screen — Manage chain RPC connections and custom nodes.
 *
 * Allows viewing active connections, adding custom RPC endpoints,
 * and testing connection latency across all supported chains.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useWalletStore } from '../store/walletStore';

// --- Types ---

type Tab = 'connections' | 'custom' | 'test';

interface RpcConnection {
  id: string;
  chain: string;
  url: string;
  status: 'connected' | 'degraded' | 'offline';
  latency: number; // ms
  isCustom: boolean;
}

// --- Demo data ---

const STATUS_ICON: Record<string, string> = { connected: '\u{1F7E2}', degraded: '\u{1F7E1}', offline: '\u{1F534}' };

const CONNECTIONS: RpcConnection[] = [
  { id: 'rpc1', chain: 'Bitcoin', url: 'https://btc-rpc.openchain.io', status: 'connected', latency: 45, isCustom: false },
  { id: 'rpc2', chain: 'Ethereum', url: 'https://eth-rpc.openchain.io', status: 'connected', latency: 32, isCustom: false },
  { id: 'rpc3', chain: 'Solana', url: 'https://sol-rpc.openchain.io', status: 'degraded', latency: 180, isCustom: false },
  { id: 'rpc4', chain: 'Polygon', url: 'https://poly-rpc.openchain.io', status: 'connected', latency: 28, isCustom: false },
  { id: 'rpc5', chain: 'Open Chain', url: 'https://node.openchain.io', status: 'connected', latency: 15, isCustom: false },
  { id: 'rpc6', chain: 'Solana', url: 'https://my-solana-node.example.com', status: 'offline', latency: 0, isCustom: true },
];

// --- Component ---

interface Props {
  onClose: () => void;
}

export function ConnectionScreen({ onClose }: Props) {
  const t = useTheme();
  const walletStore = useWalletStore();
  const [tab, setTab] = useState<Tab>('connections');
  const [customUrl, setCustomUrl] = useState('');
  const [customChain, setCustomChain] = useState('');
  const [testing, setTesting] = useState<string | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'connections', label: 'Connections' },
    { key: 'custom', label: 'Custom' },
    { key: 'test', label: 'Test' },
  ];

  const defaultConns = useMemo(() => CONNECTIONS.filter(c => !c.isCustom), []);
  const customConns = useMemo(() => CONNECTIONS.filter(c => c.isCustom), []);

  const latencyColor = (ms: number) => ms === 0 ? t.accent.red : ms < 50 ? t.accent.green : ms < 100 ? t.accent.yellow : t.accent.orange;

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.bold },
    closeText: { color: t.accent.blue, fontSize: fonts.lg },
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 10, backgroundColor: t.bg.card, overflow: 'hidden' },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.semibold },
    tabTextActive: { color: '#fff' },
    scroll: { paddingHorizontal: 16, paddingBottom: 40 },
    section: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
    connCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 10 },
    connHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    connChain: { color: t.text.primary, fontSize: fonts.md, fontWeight: fonts.bold },
    connStatus: { fontSize: fonts.sm },
    connUrl: { color: t.text.muted, fontSize: fonts.xs, fontFamily: 'Courier', marginBottom: 6 },
    connLatency: { fontSize: fonts.sm, fontWeight: fonts.bold },
    customBadge: { backgroundColor: t.accent.purple + '30', borderRadius: 4, paddingVertical: 1, paddingHorizontal: 6 },
    customBadgeText: { color: t.accent.purple, fontSize: fonts.xxs, fontWeight: fonts.bold },
    inputCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 16 },
    inputLabel: { color: t.text.secondary, fontSize: fonts.sm, fontWeight: fonts.semibold, marginBottom: 6 },
    input: { backgroundColor: t.bg.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: t.text.primary, fontSize: fonts.md, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    addBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    addBtnText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
    testBtn: { backgroundColor: t.accent.blue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 8 },
    testBtnText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.semibold },
    testResult: { color: t.text.secondary, fontSize: fonts.sm, marginTop: 6, textAlign: 'center' },
    summaryCard: { backgroundColor: t.bg.card, borderRadius: 14, padding: 16, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryBox: { alignItems: 'center' },
    summaryNum: { fontSize: fonts.xl, fontWeight: fonts.bold, color: t.text.primary },
    summaryLabel: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
  }), [t]);

  const connectedCount = CONNECTIONS.filter(c => c.status === 'connected').length;
  const avgLatency = Math.round(CONNECTIONS.filter(c => c.latency > 0).reduce((s, c) => s + c.latency, 0) / CONNECTIONS.filter(c => c.latency > 0).length);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Connections</Text>
        <TouchableOpacity onPress={onClose}><Text style={st.closeText}>Back</Text></TouchableOpacity>
      </View>

      <View style={st.tabRow}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[st.tabBtn, tab === tb.key && st.tabBtnActive]} onPress={() => setTab(tb.key)}>
            <Text style={[st.tabText, tab === tb.key && st.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {tab === 'connections' && (
          <>
            <View style={st.summaryCard}>
              <View style={st.summaryRow}>
                <View style={st.summaryBox}>
                  <Text style={[st.summaryNum, { color: t.accent.green }]}>{connectedCount}</Text>
                  <Text style={st.summaryLabel}>Connected</Text>
                </View>
                <View style={st.summaryBox}>
                  <Text style={st.summaryNum}>{CONNECTIONS.length}</Text>
                  <Text style={st.summaryLabel}>Total Nodes</Text>
                </View>
                <View style={st.summaryBox}>
                  <Text style={st.summaryNum}>{avgLatency}ms</Text>
                  <Text style={st.summaryLabel}>Avg Latency</Text>
                </View>
              </View>
            </View>
            <Text style={st.section}>Active Connections</Text>
            {defaultConns.map(conn => (
              <View key={conn.id} style={st.connCard}>
                <View style={st.connHeader}>
                  <Text style={st.connChain}>{conn.chain}</Text>
                  <Text style={st.connStatus}>{STATUS_ICON[conn.status]} {conn.status}</Text>
                </View>
                <Text style={st.connUrl}>{conn.url}</Text>
                <Text style={[st.connLatency, { color: latencyColor(conn.latency) }]}>
                  {conn.latency > 0 ? `${conn.latency}ms` : 'N/A'}
                </Text>
              </View>
            ))}
          </>
        )}

        {tab === 'custom' && (
          <>
            <Text style={st.section}>Add Custom Node</Text>
            <View style={st.inputCard}>
              <Text style={st.inputLabel}>Chain Name</Text>
              <TextInput style={st.input} value={customChain} onChangeText={setCustomChain} placeholder="e.g. Solana" placeholderTextColor={t.text.muted} />
              <Text style={st.inputLabel}>RPC URL</Text>
              <TextInput style={st.input} value={customUrl} onChangeText={setCustomUrl} placeholder="https://..." placeholderTextColor={t.text.muted} autoCapitalize="none" />
              <TouchableOpacity style={st.addBtn}><Text style={st.addBtnText}>Add Node</Text></TouchableOpacity>
            </View>
            <Text style={st.section}>Custom Nodes ({customConns.length})</Text>
            {customConns.map(conn => (
              <View key={conn.id} style={st.connCard}>
                <View style={st.connHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={st.connChain}>{conn.chain}</Text>
                    <View style={st.customBadge}><Text style={st.customBadgeText}>CUSTOM</Text></View>
                  </View>
                  <Text style={st.connStatus}>{STATUS_ICON[conn.status]} {conn.status}</Text>
                </View>
                <Text style={st.connUrl}>{conn.url}</Text>
              </View>
            ))}
          </>
        )}

        {tab === 'test' && (
          <>
            <Text style={st.section}>Connection Tests</Text>
            {CONNECTIONS.map(conn => (
              <View key={conn.id} style={st.connCard}>
                <View style={st.connHeader}>
                  <Text style={st.connChain}>{conn.chain}</Text>
                  <Text style={st.connStatus}>{STATUS_ICON[conn.status]}</Text>
                </View>
                <Text style={st.connUrl}>{conn.url}</Text>
                <TouchableOpacity style={st.testBtn} onPress={() => setTesting(conn.id)}>
                  <Text style={st.testBtnText}>{testing === conn.id ? 'Testing...' : 'Run Test'}</Text>
                </TouchableOpacity>
                {testing === conn.id && (
                  <Text style={st.testResult}>Latency: {conn.latency > 0 ? `${conn.latency}ms` : 'Unreachable'}</Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
