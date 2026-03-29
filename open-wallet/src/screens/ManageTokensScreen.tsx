/**
 * Manage Tokens — Enable/disable tokens + add custom tokens.
 *
 * Can't find a token? Add it by:
 * 1. Pasting contract address (auto-detects name/symbol/decimals)
 * 2. Searching by name on CoinGecko
 * 3. Manual entry
 *
 * Custom tokens get the same features as built-in ones.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Switch, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import {
  loadCustomTokens, getCustomTokens, addCustomToken, removeCustomToken,
  detectTokenFromAddress, searchTokens, getAllTokens,
} from '../core/tokens/customTokens';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/theme';

type ViewMode = 'list' | 'add-search' | 'add-address' | 'add-manual';

const CHAIN_OPTIONS = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'solana', label: 'Solana' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'bsc', label: 'BNB Chain' },
  { id: 'avalanche', label: 'Avalanche' },
  { id: 'openchain', label: 'Open Chain' },
  { id: 'cosmos', label: 'Cosmos' },
];

const TokenToggle = React.memo(({
  token, enabled, isCustom, onToggle, onRemove, t,
}: {
  token: TokenInfo; enabled: boolean; isCustom: boolean;
  onToggle: (symbol: string, value: boolean) => void;
  onRemove?: () => void; t: Theme & { isDark: boolean };
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.border }}>
    <View style={{ width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: (token.color || '#606070') + '20' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: token.color || '#606070' }}>{token.symbol.charAt(0)}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: t.text.primary, fontSize: 16, fontWeight: '600' }}>{token.symbol}</Text>
        {isCustom && <View style={{ backgroundColor: t.accent.blue + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 }}><Text style={{ color: t.accent.blue, fontSize: 9, fontWeight: '700' }}>CUSTOM</Text></View>}
      </View>
      <Text style={{ color: t.text.muted, fontSize: 12, marginTop: 2 }}>{token.name} • {token.chainId}</Text>
    </View>
    {isCustom && onRemove && (
      <TouchableOpacity style={{ paddingHorizontal: 8, paddingVertical: 4 }} onPress={onRemove}>
        <Text style={{ color: t.accent.red, fontSize: 12, fontWeight: '600' }}>Remove</Text>
      </TouchableOpacity>
    )}
    <Switch value={enabled} onValueChange={(v) => onToggle(token.symbol, v)} trackColor={{ false: '#333', true: t.accent.green + '40' }} thumbColor={enabled ? t.accent.green : '#666'} />
  </View>
));

export function ManageTokensScreen({ onClose }: { onClose: () => void }) {
  const { enabledTokens, toggleToken } = useWalletStore();
  const [view, setView] = useState<ViewMode>('list');
  const [customTokensList, setCustomTokensList] = useState<TokenInfo[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [detecting, setDetecting] = useState(false);
  const [detectedToken, setDetectedToken] = useState<Partial<TokenInfo> | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualDecimals, setManualDecimals] = useState('18');
  const [manualContract, setManualContract] = useState('');
  const [manualChain, setManualChain] = useState('ethereum');
  const t = useTheme();

  useEffect(() => { loadCustomTokens().then(setCustomTokensList); }, []);

  const allTokens = useMemo(() => getAllTokens(SUPPORTED_TOKENS), [customTokensList]);

  const filteredTokens = useMemo(() => {
    if (!filterQuery.trim()) return allTokens;
    const q = filterQuery.toLowerCase();
    return allTokens.filter((tk) => tk.symbol.toLowerCase().includes(q) || tk.name.toLowerCase().includes(q));
  }, [allTokens, filterQuery]);

  const handleDetect = useCallback(async () => {
    if (!contractAddress.trim()) { Alert.alert('Enter Address', 'Paste a contract address.'); return; }
    setDetecting(true); setDetectedToken(null);
    const result = await detectTokenFromAddress(contractAddress.trim(), selectedChain);
    setDetecting(false);
    if (result) setDetectedToken(result);
    else Alert.alert('Not Found', 'Could not detect token. Try manual entry.');
  }, [contractAddress, selectedChain]);

  const handleAddDetected = useCallback(async () => {
    if (!detectedToken?.symbol) return;
    const token: TokenInfo = { symbol: detectedToken.symbol!, name: detectedToken.name || detectedToken.symbol!, chainId: detectedToken.chainId || selectedChain, decimals: detectedToken.decimals || 18, contractAddress: contractAddress.trim(), coingeckoId: '', isNative: false, color: detectedToken.color || '#888' };
    try { await addCustomToken(token); toggleToken(token.symbol, true); setCustomTokensList(getCustomTokens()); Alert.alert('Added', `${token.symbol} added to your wallet.`); setView('list'); setContractAddress(''); setDetectedToken(null); }
    catch (err: any) { Alert.alert('Error', err.message); }
  }, [detectedToken, contractAddress, selectedChain, toggleToken]);

  const handleAddManual = useCallback(async () => {
    if (!manualSymbol.trim() || !manualName.trim()) { Alert.alert('Required', 'Enter symbol and name.'); return; }
    const token: TokenInfo = { symbol: manualSymbol.trim().toUpperCase(), name: manualName.trim(), chainId: manualChain, decimals: parseInt(manualDecimals) || 18, contractAddress: manualContract.trim() || undefined, coingeckoId: '', isNative: false, color: `hsl(${Math.abs(manualSymbol.charCodeAt(0) * 47) % 360}, 70%, 55%)` };
    try { await addCustomToken(token); toggleToken(token.symbol, true); setCustomTokensList(getCustomTokens()); Alert.alert('Added', `${token.symbol} added.`); setView('list'); setManualName(''); setManualSymbol(''); setManualContract(''); }
    catch (err: any) { Alert.alert('Error', err.message); }
  }, [manualSymbol, manualName, manualChain, manualDecimals, manualContract, toggleToken]);

  const handleSearchCG = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); const results = await searchTokens(searchQuery.trim()); setSearchResults(results); setSearching(false);
  }, [searchQuery]);

  const handleAddFromSearch = useCallback(async (result: any) => {
    // Detect the native chain from CoinGecko data, or use the token's own name as chain
    let detectedChain = result.id || result.name.toLowerCase().replace(/\s+/g, '-');
    // Map known CoinGecko platforms to our chain IDs
    const knownChains: Record<string, string> = {
      bitcoin: 'bitcoin', ethereum: 'ethereum', solana: 'solana',
      'binancecoin': 'bsc', 'avalanche-2': 'avalanche', 'matic-network': 'polygon',
      'cosmos': 'cosmos', cardano: 'cardano', polkadot: 'polkadot',
    };
    const chainId = knownChains[result.id] || detectedChain;
    const isSupported = ['bitcoin', 'ethereum', 'solana', 'bsc', 'avalanche', 'polygon', 'cosmos', 'openchain'].includes(chainId);
    const token: TokenInfo = { symbol: result.symbol.toUpperCase(), name: result.name, chainId, decimals: 18, coingeckoId: result.id, isNative: true, color: `hsl(${Math.abs(result.symbol.charCodeAt(0) * 47) % 360}, 70%, 55%)` };
    try {
      await addCustomToken(token);
      toggleToken(token.symbol, true);
      setCustomTokensList(getCustomTokens());
      const supportMsg = isSupported
        ? 'Full support: send, receive, swap, price tracking.'
        : 'Price tracking enabled. Send/receive requires chain integration.';
      Alert.alert('Added', `${token.symbol} (${token.name}) added.\n\n${supportMsg}`);
      setView('list');
    } catch (err: any) { Alert.alert('Error', err.message); }
  }, [toggleToken]);

  const handleRemove = useCallback(async (symbol: string, chainId: string) => {
    Alert.alert('Remove Token', `Remove ${symbol}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await removeCustomToken(symbol, chainId); toggleToken(symbol, false); setCustomTokensList(getCustomTokens()); }}]);
  }, [toggleToken]);

  const customSymbols = new Set(customTokensList.map((ct) => ct.symbol));

  // ─── Add by Address ───
  if (view === 'add-address') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
        <TouchableOpacity onPress={() => setView('list')}><Text style={{ color: t.accent.blue, fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: t.text.primary, fontSize: 20, fontWeight: '800' }}>Add by Address</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView style={{ padding: 20 }}>
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chain</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CHAIN_OPTIONS.map((ch) => (
            <TouchableOpacity key={ch.id} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: selectedChain === ch.id ? t.accent.green : t.bg.card }} onPress={() => setSelectedChain(ch.id)}>
              <Text style={{ color: selectedChain === ch.id ? '#fff' : t.text.secondary, fontSize: 12, fontWeight: selectedChain === ch.id ? '700' : '400' }}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Contract Address</Text>
        <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15 }} placeholder="0x... or mint address" placeholderTextColor={t.text.muted} value={contractAddress} onChangeText={setContractAddress} autoCapitalize="none" />
        <TouchableOpacity style={{ backgroundColor: t.accent.blue, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }} onPress={handleDetect} disabled={detecting}>
          {detecting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Detect Token</Text>}
        </TouchableOpacity>
        {detectedToken && (
          <>
            <View style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 16, marginTop: 12 }}>
              <Text style={{ color: t.text.primary, fontSize: 16, fontWeight: '700' }}>{detectedToken.symbol} — {detectedToken.name}</Text>
              <Text style={{ color: t.text.muted, fontSize: 13, marginTop: 4 }}>Decimals: {detectedToken.decimals} • Chain: {detectedToken.chainId}</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: t.accent.green, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }} onPress={handleAddDetected}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Add {detectedToken.symbol} to Wallet</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // ─── Search CoinGecko ───
  if (view === 'add-search') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
        <TouchableOpacity onPress={() => setView('list')}><Text style={{ color: t.accent.blue, fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: t.text.primary, fontSize: 20, fontWeight: '800' }}>Search Token</Text>
        <View style={{ width: 50 }} />
      </View>
      <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 20, marginTop: 16, color: t.text.primary, fontSize: 14 }} placeholder="Search by name or symbol..." placeholderTextColor={t.text.muted} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearchCG} returnKeyType="search" />
      <TouchableOpacity style={{ backgroundColor: t.accent.blue, borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 12 }} onPress={handleSearchCG} disabled={searching}>
        {searching ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Search CoinGecko</Text>}
      </TouchableOpacity>
      <FlatList data={searchResults} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <Text style={{ fontSize: 20 }}>🪙</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: t.text.primary, fontSize: 15, fontWeight: '600' }}>{item.symbol.toUpperCase()}</Text>
            <Text style={{ color: t.text.muted, fontSize: 12 }}>{item.name} {item.market_cap_rank ? `• #${item.market_cap_rank}` : ''}</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: t.accent.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }} onPress={() => handleAddFromSearch(item)}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
      )} ListEmptyComponent={<Text style={{ color: t.text.muted, textAlign: 'center', marginTop: 40 }}>Search for any token</Text>} />
    </SafeAreaView>
  );

  // ─── Manual Entry ───
  if (view === 'add-manual') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
        <TouchableOpacity onPress={() => setView('list')}><Text style={{ color: t.accent.blue, fontSize: 16 }}>← Back</Text></TouchableOpacity>
        <Text style={{ color: t.text.primary, fontSize: 20, fontWeight: '800' }}>Manual Entry</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView style={{ padding: 20 }}>
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Symbol *</Text>
        <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 }} placeholder="e.g. PEPE" placeholderTextColor={t.text.muted} value={manualSymbol} onChangeText={setManualSymbol} autoCapitalize="characters" />
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Name *</Text>
        <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 }} placeholder="e.g. Pepe Token" placeholderTextColor={t.text.muted} value={manualName} onChangeText={setManualName} />
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chain</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {CHAIN_OPTIONS.map((ch) => (
            <TouchableOpacity key={ch.id} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: manualChain === ch.id ? t.accent.green : t.bg.card }} onPress={() => setManualChain(ch.id)}>
              <Text style={{ color: manualChain === ch.id ? '#fff' : t.text.secondary, fontSize: 12, fontWeight: manualChain === ch.id ? '700' : '400' }}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Decimals</Text>
        <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 12 }} placeholder="18" placeholderTextColor={t.text.muted} value={manualDecimals} onChangeText={setManualDecimals} keyboardType="number-pad" />
        <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Contract Address (optional)</Text>
        <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, padding: 14, color: t.text.primary, fontSize: 15, marginBottom: 16 }} placeholder="0x..." placeholderTextColor={t.text.muted} value={manualContract} onChangeText={setManualContract} autoCapitalize="none" />
        <TouchableOpacity style={{ backgroundColor: t.accent.green, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={handleAddManual}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Add Token</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // ─── Main Token List ───
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg.primary }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
        <Text style={{ color: t.text.primary, fontSize: 22, fontWeight: '800' }}>Manage Tokens</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ color: t.accent.green, fontSize: 16, fontWeight: '700' }}>Done</Text></TouchableOpacity>
      </View>
      <Text style={{ color: t.text.muted, fontSize: 13, paddingHorizontal: 20, marginTop: 4, marginBottom: 12 }}>Toggle tokens or add new ones</Text>
      <TextInput style={{ backgroundColor: t.bg.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 20, marginBottom: 8, color: t.text.primary, fontSize: 14 }} placeholder="Filter tokens..." placeholderTextColor={t.text.muted} value={filterQuery} onChangeText={setFilterQuery} />
      <FlatList
        data={filteredTokens}
        keyExtractor={(tk) => `${tk.chainId}-${tk.symbol}`}
        renderItem={({ item }) => (
          <TokenToggle token={item} enabled={enabledTokens.includes(item.symbol)} isCustom={customSymbols.has(item.symbol)} onToggle={toggleToken} onRemove={customSymbols.has(item.symbol) ? () => handleRemove(item.symbol, item.chainId) : undefined} t={t} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListFooterComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: t.border }}>
            <Text style={{ color: t.text.secondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Can't find a token?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setView('add-address')}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>📋</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>Paste Address</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setView('add-search')}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🔍</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: t.bg.card, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setView('add-manual')}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>✏️</Text>
                <Text style={{ color: t.text.primary, fontSize: 13, fontWeight: '600' }}>Manual</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
