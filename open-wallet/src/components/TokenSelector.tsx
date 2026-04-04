import { fonts } from '../utils/theme';
/**
 * TokenSelector — Reusable modal for selecting a token.
 *
 * Shows all supported tokens with: colored dot, symbol, name, chain, price, balance.
 * Search filter. Grouped by chain. Used across: BuySellScreen, SwapScreen, SendScreen.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { useWalletStore } from '../store/walletStore';
import { usePrices } from '../hooks/usePrices';
import type { ChainId } from '../core/abstractions/types';

export interface TokenSelectorProps {
  visible: boolean;
  onSelect: (token: TokenInfo) => void;
  onClose: () => void;
  title?: string;
  filterChain?: string;  // optional: only show tokens from this chain
}

interface GroupedSection {
  chain: string;
  tokens: TokenInfo[];
}

export function TokenSelector({ visible, onSelect, onClose, title, filterChain }: TokenSelectorProps) {
  const [search, setSearch] = useState('');
  const t = useTheme();
  const { prices } = usePrices();
  const balances = useWalletStore((s) => s.balances);
  const enabledTokens = useWalletStore((s) => s.enabledTokens);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { color: t.text.primary, fontSize: fonts.xl, fontWeight: fonts.heavy },
    closeBtn: { color: t.accent.blue, fontSize: fonts.lg, fontWeight: fonts.semibold },
    searchBox: {
      marginHorizontal: 20, marginBottom: 12, backgroundColor: t.bg.card,
      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
      color: t.text.primary, fontSize: fonts.md,
    },
    sectionHeader: {
      paddingHorizontal: 20, paddingVertical: 8,
      backgroundColor: t.bg.secondary,
    },
    sectionTitle: {
      color: t.text.muted, fontSize: fonts.sm, fontWeight: fonts.bold,
      textTransform: 'uppercase', letterSpacing: 1.2,
    },
    tokenRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border,
    },
    dot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    dotText: { color: '#fff', fontSize: fonts.sm, fontWeight: fonts.heavy },
    tokenInfo: { flex: 1 },
    tokenSymbol: { color: t.text.primary, fontSize: fonts.lg, fontWeight: fonts.bold },
    tokenName: { color: t.text.muted, fontSize: fonts.sm, marginTop: 1 },
    tokenChainBadge: { color: t.text.muted, fontSize: fonts.xs, marginTop: 2 },
    tokenRight: { alignItems: 'flex-end' },
    tokenPrice: { color: t.text.secondary, fontSize: fonts.md, fontWeight: fonts.semibold },
    tokenBalance: { color: t.text.muted, fontSize: fonts.sm, marginTop: 2 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: t.text.muted, fontSize: fonts.md },
  }), [t]);

  // Build filtered + grouped list
  const grouped = useMemo(() => {
    let tokens = SUPPORTED_TOKENS.filter((tk) => enabledTokens.includes(tk.symbol));

    if (filterChain) {
      tokens = tokens.filter((tk) => tk.chainId === filterChain);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tokens = tokens.filter((tk) =>
        tk.symbol.toLowerCase().includes(q) ||
        tk.name.toLowerCase().includes(q) ||
        tk.chainId.toLowerCase().includes(q)
      );
    }

    // Group by chain
    const map = new Map<string, TokenInfo[]>();
    for (const tk of tokens) {
      const list = map.get(tk.chainId) ?? [];
      list.push(tk);
      map.set(tk.chainId, list);
    }

    const sections: GroupedSection[] = [];
    map.forEach((tks, chain) => {
      sections.push({ chain, tokens: tks });
    });

    return sections;
  }, [search, filterChain, enabledTokens]);

  // Flatten for FlatList with section headers
  const flatData = useMemo(() => {
    const items: Array<{ type: 'header'; chain: string } | { type: 'token'; token: TokenInfo }> = [];
    for (const section of grouped) {
      items.push({ type: 'header', chain: section.chain });
      for (const tk of section.tokens) {
        items.push({ type: 'token', token: tk });
      }
    }
    return items;
  }, [grouped]);

  const getBalanceForToken = useCallback((symbol: string): string | undefined => {
    const bal = balances.find((b) => b.token?.symbol === symbol);
    if (!bal) return undefined;
    const human = Number(bal.amount) / Math.pow(10, bal.token.decimals);
    if (human === 0) return '0';
    if (human < 0.0001) return '<0.0001';
    return human.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [balances]);

  const formatChainName = useCallback((chainId: string): string => {
    const names: Record<string, string> = {
      bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana',
      cardano: 'Cardano', cosmos: 'Cosmos', openchain: 'Open Chain',
      xrp: 'XRP Ledger', dogecoin: 'Dogecoin', polkadot: 'Polkadot',
      avalanche: 'Avalanche', sui: 'Sui', polygon: 'Polygon',
      bsc: 'BNB Chain', ton: 'TON',
    };
    return names[chainId] ?? chainId.charAt(0).toUpperCase() + chainId.slice(1);
  }, []);

  const handleSelect = useCallback((token: TokenInfo) => {
    onSelect(token);
    setSearch('');
  }, [onSelect]);

  const renderItem = useCallback(({ item }: { item: typeof flatData[number] }) => {
    if (item.type === 'header') {
      return (
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{formatChainName(item.chain)}</Text>
        </View>
      );
    }

    const tk = item.token;
    const price = prices[tk.coingeckoId] ?? prices[tk.symbol.toLowerCase()];
    const balance = getBalanceForToken(tk.symbol);

    return (
      <TouchableOpacity style={s.tokenRow} onPress={() => handleSelect(tk)} activeOpacity={0.6}>
        <View style={[s.dot, { backgroundColor: tk.color }]}>
          <Text style={s.dotText}>{tk.symbol.slice(0, 3)}</Text>
        </View>
        <View style={s.tokenInfo}>
          <Text style={s.tokenSymbol}>{tk.symbol}</Text>
          <Text style={s.tokenName}>{tk.name}</Text>
          <Text style={s.tokenChainBadge}>{formatChainName(tk.chainId)}</Text>
        </View>
        <View style={s.tokenRight}>
          {price != null && price > 0 && (
            <Text style={s.tokenPrice}>
              ${price >= 1 ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : price.toFixed(6)}
            </Text>
          )}
          {balance != null && (
            <Text style={s.tokenBalance}>{balance} {tk.symbol}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [s, prices, getBalanceForToken, formatChainName, handleSelect]);

  const keyExtractor = useCallback((_item: typeof flatData[number], index: number) => String(index), []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{title ?? 'Select Token'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={s.searchBox}
          placeholder="Search by name, symbol, or chain..."
          placeholderTextColor={t.text.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {flatData.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No tokens found</Text>
          </View>
        ) : (
          <FlatList
            data={flatData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
