/**
 * Multi-Wallet Screen — Manage multiple wallet accounts.
 *
 * Switch between wallets, create new ones (generate or import),
 * assign nicknames, and view aggregate balance across all wallets.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

// --- Types ---

interface WalletAccount {
  id: string;
  name: string;
  address: string;
  chain: string;
  balance: number;
  symbol: string;
  isActive: boolean;
  label?: string;
  createdAt: string;
}

type Tab = 'wallets' | 'create' | 'aggregate';

interface Props {
  onClose: () => void;
}

// --- Demo data ---

const DEMO_WALLETS: WalletAccount[] = [
  {
    id: 'w_001', name: 'Main Wallet', address: 'ochain1qz7v...4f9k2',
    chain: 'Open Chain', balance: 12450, symbol: 'OTK',
    isActive: true, label: 'Primary', createdAt: '2026-01-15',
  },
  {
    id: 'w_002', name: 'Savings', address: '0x8B3a...7c2E',
    chain: 'Ethereum', balance: 2.847, symbol: 'ETH',
    isActive: false, label: 'Long-term hold', createdAt: '2026-02-01',
  },
  {
    id: 'w_003', name: 'Test Wallet', address: 'cosmos1xp4...9m3f',
    chain: 'Cosmos', balance: 500, symbol: 'ATOM',
    isActive: false, label: 'Development testing', createdAt: '2026-03-10',
  },
];

const DEMO_AGGREGATE = {
  totalUsd: 18742.50,
  walletCount: 3,
  chainCount: 3,
  breakdown: [
    { chain: 'Open Chain', balance: 12450, symbol: 'OTK', usdValue: 12450.00 },
    { chain: 'Ethereum', balance: 2.847, symbol: 'ETH', usdValue: 5692.50 },
    { chain: 'Cosmos', balance: 500, symbol: 'ATOM', usdValue: 600.00 },
  ],
};

// --- Component ---

export function MultiWalletScreen({ onClose }: Props) {
  const demoMode = useWalletStore((s) => s.demoMode);
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('wallets');
  const [wallets, setWallets] = useState<WalletAccount[]>(demoMode ? DEMO_WALLETS : []);
  const [createMode, setCreateMode] = useState<'generate' | 'import'>('generate');
  const [newName, setNewName] = useState('');
  const [newChain, setNewChain] = useState('Open Chain');
  const [importKey, setImportKey] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelText, setLabelText] = useState('');

  const aggregate = demoMode ? DEMO_AGGREGATE : { totalUsd: 0, walletCount: 0, chainCount: 0, breakdown: [] };
  const chains = ['Open Chain', 'Ethereum', 'Bitcoin', 'Solana', 'Cosmos'];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'wallets', label: 'Wallets' },
    { key: 'create', label: 'Create' },
    { key: 'aggregate', label: 'Aggregate' },
  ];

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    back: { color: t.accent.blue, fontSize: 16, fontWeight: '600' },
    title: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    placeholder: { width: 50 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, gap: 6 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.card },
    tabBtnActive: { backgroundColor: t.accent.blue },
    tabText: { color: t.text.secondary, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    card: { backgroundColor: t.bg.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
    walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    walletInfo: { flex: 1 },
    walletName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    walletAddress: { color: t.text.muted, fontSize: 12, marginTop: 2 },
    walletChain: { color: t.text.secondary, fontSize: 12, fontWeight: '600', marginTop: 4 },
    walletLabel: { color: t.accent.blue, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
    walletBalance: { alignItems: 'flex-end' },
    balanceAmount: { color: t.text.primary, fontSize: 18, fontWeight: '800' },
    balanceSymbol: { color: t.text.muted, fontSize: 12 },
    activeBadge: { backgroundColor: t.accent.green + '22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
    activeBadgeText: { color: t.accent.green, fontSize: 11, fontWeight: '700' },
    switchBtn: { backgroundColor: t.accent.blue + '22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
    switchBtnText: { color: t.accent.blue, fontSize: 11, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: t.bg.primary },
    actionBtnText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    input: { backgroundColor: t.bg.primary, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 10 },
    chainRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chainChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.bg.primary },
    chainChipActive: { backgroundColor: t.accent.green },
    chainChipText: { color: t.text.secondary, fontSize: 13 },
    chainChipTextActive: { color: '#fff', fontWeight: '700' },
    modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: t.bg.primary },
    modeBtnActive: { backgroundColor: t.accent.blue },
    modeBtnText: { color: t.text.secondary, fontSize: 14, fontWeight: '600' },
    modeBtnTextActive: { color: '#fff', fontWeight: '700' },
    createBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    aggTotal: { alignItems: 'center', paddingVertical: 20 },
    aggTotalLabel: { color: t.text.muted, fontSize: 13 },
    aggTotalValue: { color: t.text.primary, fontSize: 32, fontWeight: '800', marginTop: 4 },
    aggMeta: { color: t.text.secondary, fontSize: 13, marginTop: 4 },
    aggRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
    aggChain: { color: t.text.primary, fontSize: 15, fontWeight: '600' },
    aggBalance: { color: t.text.secondary, fontSize: 13 },
    aggUsd: { color: t.text.primary, fontSize: 15, fontWeight: '700', textAlign: 'right' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.text.secondary, fontSize: 16, fontWeight: '600' },
    emptyHint: { color: t.text.muted, fontSize: 13, marginTop: 4 },
    labelInput: { backgroundColor: t.bg.primary, borderRadius: 8, padding: 8, color: t.text.primary, fontSize: 12, marginTop: 4 },
  }), [t]);

  const handleSwitch = (id: string) => {
    setWallets((prev) => prev.map((w) => ({ ...w, isActive: w.id === id })));
    Alert.alert('Wallet Switched', 'Active wallet updated.');
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Enter a wallet name.');
      return;
    }
    if (createMode === 'import' && !importKey.trim()) {
      Alert.alert('Missing Key', 'Enter a private key or seed phrase to import.');
      return;
    }
    const newWallet: WalletAccount = {
      id: `w_${Date.now()}`,
      name: newName.trim(),
      address: `ochain1${Math.random().toString(36).slice(2, 8)}...${Math.random().toString(36).slice(2, 6)}`,
      chain: newChain,
      balance: 0,
      symbol: newChain === 'Ethereum' ? 'ETH' : newChain === 'Bitcoin' ? 'BTC' : newChain === 'Solana' ? 'SOL' : newChain === 'Cosmos' ? 'ATOM' : 'OTK',
      isActive: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setWallets((prev) => [...prev, newWallet]);
    setNewName('');
    setImportKey('');
    Alert.alert('Wallet Created', `"${newWallet.name}" created on ${newChain}.`);
    setTab('wallets');
  };

  const handleSaveLabel = (id: string) => {
    setWallets((prev) => prev.map((w) => w.id === id ? { ...w, label: labelText } : w));
    setEditingLabel(null);
    setLabelText('');
  };

  const renderWallets = () => (
    <FlatList
      data={wallets}
      keyExtractor={(w) => w.id}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.walletRow}>
            <View style={s.walletInfo}>
              <Text style={s.walletName}>{item.name}</Text>
              <Text style={s.walletAddress}>{item.address}</Text>
              <Text style={s.walletChain}>{item.chain}</Text>
              {item.label && editingLabel !== item.id && (
                <Text style={s.walletLabel}>{item.label}</Text>
              )}
              {editingLabel === item.id && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={s.labelInput}
                    value={labelText}
                    onChangeText={setLabelText}
                    placeholder="Enter label"
                    placeholderTextColor={t.text.muted}
                  />
                  <TouchableOpacity onPress={() => handleSaveLabel(item.id)}>
                    <Text style={{ color: t.accent.green, fontSize: 13, fontWeight: '700' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={s.walletBalance}>
              <Text style={s.balanceAmount}>{item.balance.toLocaleString()}</Text>
              <Text style={s.balanceSymbol}>{item.symbol}</Text>
              {item.isActive ? (
                <View style={s.activeBadge}>
                  <Text style={s.activeBadgeText}>ACTIVE</Text>
                </View>
              ) : (
                <TouchableOpacity style={s.switchBtn} onPress={() => handleSwitch(item.id)}>
                  <Text style={s.switchBtnText}>SWITCH</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={() => {
              setEditingLabel(item.id);
              setLabelText(item.label || '');
            }}>
              <Text style={s.actionBtnText}>Edit Label</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn}>
              <Text style={s.actionBtnText}>View Keys</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => {
              Alert.alert('Remove Wallet', `Remove "${item.name}"? This won't delete the on-chain account.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => setWallets((prev) => prev.filter((w) => w.id !== item.id)) },
              ]);
            }}>
              <Text style={[s.actionBtnText, { color: t.accent.red }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No wallets</Text>
          <Text style={s.emptyHint}>Create or import a wallet to get started</Text>
        </View>
      }
      contentContainerStyle={wallets.length === 0 ? { flex: 1, justifyContent: 'center' } : { paddingTop: 4 }}
    />
  );

  const renderCreate = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.card}>
        <View style={s.modeRow}>
          <TouchableOpacity style={[s.modeBtn, createMode === 'generate' && s.modeBtnActive]} onPress={() => setCreateMode('generate')}>
            <Text style={[s.modeBtnText, createMode === 'generate' && s.modeBtnTextActive]}>Generate New</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.modeBtn, createMode === 'import' && s.modeBtnActive]} onPress={() => setCreateMode('import')}>
            <Text style={[s.modeBtnText, createMode === 'import' && s.modeBtnTextActive]}>Import Existing</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={s.input} placeholder="Wallet Name" placeholderTextColor={t.text.muted} value={newName} onChangeText={setNewName} />

        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chain</Text>
        <View style={s.chainRow}>
          {chains.map((c) => (
            <TouchableOpacity key={c} style={[s.chainChip, newChain === c && s.chainChipActive]} onPress={() => setNewChain(c)}>
              <Text style={[s.chainChipText, newChain === c && s.chainChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {createMode === 'import' && (
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Enter seed phrase or private key"
            placeholderTextColor={t.text.muted}
            value={importKey}
            onChangeText={setImportKey}
            multiline
            autoCapitalize="none"
            secureTextEntry
          />
        )}

        <TouchableOpacity style={s.createBtn} onPress={handleCreate}>
          <Text style={s.createBtnText}>{createMode === 'generate' ? 'Generate Wallet' : 'Import Wallet'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAggregate = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.aggTotal}>
        <Text style={s.aggTotalLabel}>Total Balance (USD)</Text>
        <Text style={s.aggTotalValue}>${aggregate.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        <Text style={s.aggMeta}>{aggregate.walletCount} wallets across {aggregate.chainCount} chains</Text>
      </View>

      <View style={s.card}>
        {aggregate.breakdown.map((item, i) => (
          <View key={i} style={[s.aggRow, i === aggregate.breakdown.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={s.aggChain}>{item.chain}</Text>
              <Text style={s.aggBalance}>{item.balance.toLocaleString()} {item.symbol}</Text>
            </View>
            <Text style={s.aggUsd}>${item.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Multi-Wallet</Text>
        <View style={s.placeholder} />
      </View>

      <View style={s.tabRow}>
        {tabs.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[s.tabBtn, tab === tb.key && s.tabBtnActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[s.tabText, tab === tb.key && s.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'wallets' && renderWallets()}
      {tab === 'create' && renderCreate()}
      {tab === 'aggregate' && renderAggregate()}
    </SafeAreaView>
  );
}
