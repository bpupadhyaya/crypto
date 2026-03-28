/**
 * Address Label Manager — label known addresses that appear in transaction history.
 * Auto-detect frequent addresses, add custom labels, import/export.
 * Labels show throughout the app wherever the address appears.
 * Demo mode provides sample labels.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, SafeAreaView, Alert, Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletStore } from '../store/walletStore';
import { useTheme } from '../hooks/useTheme';

interface Props { onClose: () => void }

// ─── Types ───

export interface AddressLabel {
  address: string;
  label: string;
  chain: string;       // bitcoin, ethereum, solana, cosmos, openchain
  txCount: number;     // number of transactions with this address
  lastSeen: number;    // timestamp
  isCustom: boolean;   // user-created vs auto-detected
}

const STORAGE_KEY = '@open_wallet/address_labels';

// ─── Demo Data ───

const DEMO_LABELS: AddressLabel[] = [
  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2BD3e', label: 'Coinbase', chain: 'ethereum', txCount: 15, lastSeen: Date.now() - 86400000, isCustom: true },
  { address: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72', label: 'Mom', chain: 'ethereum', txCount: 8, lastSeen: Date.now() - 172800000, isCustom: true },
  { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'Salary (Acme Corp)', chain: 'bitcoin', txCount: 12, lastSeen: Date.now() - 259200000, isCustom: true },
  { address: '5Ht9VkXY...mZpQ3', label: 'Jupiter DEX', chain: 'solana', txCount: 22, lastSeen: Date.now() - 43200000, isCustom: false },
  { address: 'cosmos1...abc123', label: 'Staking Validator', chain: 'cosmos', txCount: 6, lastSeen: Date.now() - 604800000, isCustom: true },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', label: 'USDT Contract', chain: 'ethereum', txCount: 30, lastSeen: Date.now() - 3600000, isCustom: false },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', label: 'USDC Contract', chain: 'ethereum', txCount: 25, lastSeen: Date.now() - 7200000, isCustom: false },
  { address: 'bc1q...savings', label: 'Cold Storage', chain: 'bitcoin', txCount: 3, lastSeen: Date.now() - 2592000000, isCustom: true },
];

type ViewMode = 'list' | 'add' | 'edit' | 'import';

const CHAINS = ['all', 'ethereum', 'bitcoin', 'solana', 'cosmos', 'openchain'] as const;

export function AddressLabelScreen({ onClose }: Props) {
  const { demoMode } = useWalletStore();
  const t = useTheme();

  const [labels, setLabels] = useState<AddressLabel[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLabel, setEditingLabel] = useState<AddressLabel | null>(null);

  // Form state
  const [formAddress, setFormAddress] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formChain, setFormChain] = useState('ethereum');
  const [importText, setImportText] = useState('');

  const loadLabels = useCallback(async () => {
    if (demoMode) { setLabels(DEMO_LABELS); return; }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setLabels(raw ? JSON.parse(raw) : []);
    } catch { setLabels([]); }
  }, [demoMode]);

  const saveLabels = useCallback(async (updated: AddressLabel[]) => {
    setLabels(updated);
    if (!demoMode) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [demoMode]);

  useEffect(() => { loadLabels(); }, [loadLabels]);

  const filteredLabels = useMemo(() => {
    let result = labels;
    if (filterChain !== 'all') result = result.filter((l) => l.chain === filterChain);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) =>
        l.label.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.txCount - a.txCount);
  }, [labels, filterChain, searchQuery]);

  const resetForm = () => {
    setFormAddress(''); setFormLabel(''); setFormChain('ethereum');
    setEditingLabel(null);
  };

  const openAdd = () => { resetForm(); setViewMode('add'); };

  const openEdit = (label: AddressLabel) => {
    setEditingLabel(label);
    setFormAddress(label.address);
    setFormLabel(label.label);
    setFormChain(label.chain);
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!formAddress.trim() || !formLabel.trim()) {
      Alert.alert('Error', 'Address and label are required.');
      return;
    }
    if (demoMode) { Alert.alert('Demo Mode', 'Labels are read-only in demo mode.'); return; }

    const updated = [...labels];
    const existingIdx = updated.findIndex((l) => l.address === formAddress.trim());

    if (viewMode === 'edit' && editingLabel) {
      const idx = updated.findIndex((l) => l.address === editingLabel.address);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], label: formLabel.trim(), chain: formChain };
      }
    } else if (existingIdx >= 0) {
      updated[existingIdx] = { ...updated[existingIdx], label: formLabel.trim(), chain: formChain, isCustom: true };
    } else {
      updated.push({
        address: formAddress.trim(),
        label: formLabel.trim(),
        chain: formChain,
        txCount: 0,
        lastSeen: Date.now(),
        isCustom: true,
      });
    }

    await saveLabels(updated);
    resetForm();
    setViewMode('list');
  };

  const handleDelete = async (address: string) => {
    if (demoMode) { Alert.alert('Demo Mode', 'Cannot delete in demo mode.'); return; }
    Alert.alert('Delete Label', 'Remove this address label?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await saveLabels(labels.filter((l) => l.address !== address));
        },
      },
    ]);
  };

  const handleExport = async () => {
    const data = labels.map((l) => `${l.address},${l.label},${l.chain}`).join('\n');
    try {
      await Share.share({ message: data, title: 'Address Labels Export' });
    } catch { /* user cancelled */ }
  };

  const handleImport = async () => {
    const lines = importText.trim().split('\n').filter((l) => l.trim());
    const parsed: AddressLabel[] = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const [address, label, chain] = parts;
      if (!address || !label) continue;
      parsed.push({
        address,
        label,
        chain: chain || 'ethereum',
        txCount: 0,
        lastSeen: Date.now(),
        isCustom: true,
      });
    }
    if (parsed.length === 0) {
      Alert.alert('Error', 'No valid entries. Format: address,label,chain');
      return;
    }
    if (demoMode) { Alert.alert('Demo Mode', 'Cannot import in demo mode.'); return; }

    const merged = [...labels];
    for (const p of parsed) {
      const idx = merged.findIndex((l) => l.address === p.address);
      if (idx >= 0) merged[idx] = { ...merged[idx], label: p.label };
      else merged.push(p);
    }
    await saveLabels(merged);
    setImportText('');
    setViewMode('list');
    Alert.alert('Imported', `${parsed.length} label(s) imported.`);
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'bitcoin': return '#F7931A';
      case 'ethereum': return '#627EEA';
      case 'solana': return '#9945FF';
      case 'cosmos': return '#2E3148';
      case 'openchain': return t.accent.green;
      default: return t.text.muted;
    }
  };

  const st = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { color: t.text.primary, fontSize: 20, fontWeight: '700' },
    backText: { color: t.accent.blue, fontSize: 16 },
    scroll: { paddingHorizontal: 16 },
    section: { color: t.text.secondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: t.bg.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    input: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: t.text.primary, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: t.border },
    multilineInput: { minHeight: 100, textAlignVertical: 'top' },
    searchBox: { backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: t.text.primary, fontSize: 15, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    chip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.border },
    chipActive: { backgroundColor: t.accent.green },
    chipText: { color: t.text.secondary, fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    addBtn: { backgroundColor: t.accent.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    secondaryBtn: { backgroundColor: t.accent.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    labelCard: { backgroundColor: t.bg.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    labelName: { color: t.text.primary, fontSize: 16, fontWeight: '700' },
    addressText: { color: t.text.muted, fontSize: 12, fontFamily: 'Courier', marginTop: 4 },
    chainBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 },
    chainText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: '#fff' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    metaText: { color: t.text.muted, fontSize: 12 },
    actionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    deleteText: { color: t.accent.red, fontSize: 13 },
    editText: { color: t.accent.blue, fontSize: 13 },
    emptyText: { color: t.text.muted, fontSize: 14, textAlign: 'center', marginTop: 40 },
    customBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 6, backgroundColor: t.accent.purple + '20', marginLeft: 8 },
    customText: { color: t.accent.purple, fontSize: 10, fontWeight: '600' },
    autoBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 6, backgroundColor: t.accent.yellow + '20', marginLeft: 8 },
    autoText: { color: t.accent.yellow, fontSize: 10, fontWeight: '600' },
  }), [t]);

  // ─── Add / Edit View ───

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => { resetForm(); setViewMode('list'); }}>
            <Text style={st.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={st.title}>{viewMode === 'add' ? 'Add Label' : 'Edit Label'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[st.backText, { fontWeight: '700' }]}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.section}>Address</Text>
          <TextInput
            style={st.input}
            value={formAddress}
            onChangeText={setFormAddress}
            placeholder="0x... or bc1... or cosmos1..."
            placeholderTextColor={t.text.muted}
            editable={viewMode === 'add'}
            autoCapitalize="none"
          />

          <Text style={st.section}>Label</Text>
          <TextInput
            style={st.input}
            value={formLabel}
            onChangeText={setFormLabel}
            placeholder="e.g., Coinbase, Mom, Salary"
            placeholderTextColor={t.text.muted}
          />

          <Text style={st.section}>Chain</Text>
          <View style={st.chipRow}>
            {CHAINS.filter((c) => c !== 'all').map((chain) => (
              <TouchableOpacity
                key={chain}
                style={[st.chip, formChain === chain && { backgroundColor: getChainColor(chain) }]}
                onPress={() => setFormChain(chain)}
              >
                <Text style={[st.chipText, formChain === chain && st.chipTextActive]}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Import View ───

  if (viewMode === 'import') {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={st.title}>Import Labels</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={st.scroll}>
          <Text style={st.section}>Paste CSV Data</Text>
          <Text style={st.metaText}>Format: address,label,chain (one per line)</Text>
          <View style={{ height: 8 }} />
          <TextInput
            style={[st.input, st.multilineInput, { minHeight: 200 }]}
            value={importText}
            onChangeText={setImportText}
            placeholder={'0x742d...BD3e,Coinbase,ethereum\nbc1q...wlh,Mom,bitcoin'}
            placeholderTextColor={t.text.muted}
            multiline
            autoCapitalize="none"
          />
          <TouchableOpacity style={st.addBtn} onPress={handleImport}>
            <Text style={st.addBtnText}>Import Labels</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── List View ───

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={st.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={st.title}>Address Labels</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={[st.backText, { fontWeight: '700' }]}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={st.scroll}>
        {/* Search */}
        <TextInput
          style={st.searchBox}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search labels or addresses..."
          placeholderTextColor={t.text.muted}
          autoCapitalize="none"
        />

        {/* Chain Filter */}
        <View style={st.chipRow}>
          {CHAINS.map((chain) => (
            <TouchableOpacity
              key={chain}
              style={[st.chip, filterChain === chain && st.chipActive]}
              onPress={() => setFilterChain(chain)}
            >
              <Text style={[st.chipText, filterChain === chain && st.chipTextActive]}>
                {chain === 'all' ? 'All' : chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Import / Export */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            style={[st.secondaryBtn, { flex: 1 }]}
            onPress={() => setViewMode('import')}
          >
            <Text style={st.btnText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.secondaryBtn, { flex: 1, backgroundColor: t.accent.purple }]}
            onPress={handleExport}
          >
            <Text style={st.btnText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Labels List */}
        <Text style={st.section}>
          {filteredLabels.length} Label{filteredLabels.length !== 1 ? 's' : ''}
        </Text>

        {filteredLabels.length === 0 && (
          <Text style={st.emptyText}>
            {searchQuery || filterChain !== 'all'
              ? 'No labels match your filters.'
              : 'No address labels yet. Add labels to identify addresses in your history.'}
          </Text>
        )}

        {filteredLabels.map((l) => (
          <TouchableOpacity key={l.address} style={st.labelCard} onPress={() => openEdit(l)} activeOpacity={0.7}>
            <View style={st.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={st.labelName}>{l.label}</Text>
                {l.isCustom ? (
                  <View style={st.customBadge}><Text style={st.customText}>Custom</Text></View>
                ) : (
                  <View style={st.autoBadge}><Text style={st.autoText}>Auto</Text></View>
                )}
              </View>
              <View style={[st.chainBadge, { backgroundColor: getChainColor(l.chain) }]}>
                <Text style={st.chainText}>{l.chain}</Text>
              </View>
            </View>
            <Text style={st.addressText} numberOfLines={1}>{l.address}</Text>
            <View style={st.metaRow}>
              <Text style={st.metaText}>{l.txCount} transactions</Text>
              <Text style={st.metaText}>Last: {new Date(l.lastSeen).toLocaleDateString()}</Text>
            </View>
            <View style={st.actionRow}>
              <TouchableOpacity onPress={() => openEdit(l)}>
                <Text style={st.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(l.address)}>
                <Text style={st.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
