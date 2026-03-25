/**
 * Home Screen — Fast, static render first, data loads async.
 */

import React from 'react';
import { View, ScrollView, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { ActionButtons } from '../components/ActionButtons';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';

const TokenRow = React.memo(({ token }: { token: TokenInfo }) => (
  <View style={s.tokenRow}>
    <View style={[s.tokenDot, { backgroundColor: token.color }]} />
    <View style={s.tokenInfo}>
      <Text style={s.tokenSymbol}>{token.symbol}</Text>
      <Text style={s.tokenName}>{token.name}</Text>
    </View>
    <View style={s.tokenValues}>
      <Text style={s.tokenBalance}>0.00</Text>
      <Text style={s.tokenUsd}>$0.00</Text>
    </View>
  </View>
));

const keyExtractor = (item: TokenInfo) => `${item.chainId}-${item.symbol}`;
const renderToken = ({ item }: { item: TokenInfo }) => <TokenRow token={item} />;

function Header() {
  const { mode, totalUsdValue } = useWalletStore();

  return (
    <>
      {/* Balance Card */}
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>
          {mode === 'simple' ? 'Your Balance' : 'Portfolio Value'}
        </Text>
        <Text style={s.balanceAmount}>
          ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={s.balanceHint}>{SUPPORTED_TOKENS.length} tokens supported</Text>
      </View>

      {/* Action Buttons */}
      <ActionButtons />

      {/* Section title */}
      <Text style={s.sectionTitle}>Tokens</Text>
    </>
  );
}

export function HomeScreen() {
  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={SUPPORTED_TOKENS}
        keyExtractor={keyExtractor}
        renderItem={renderToken}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        contentContainerStyle={s.listContent}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  listContent: { paddingBottom: 100 },
  balanceCard: {
    backgroundColor: '#16161f', borderRadius: 24, padding: 32,
    alignItems: 'center', marginHorizontal: 16, marginTop: 16,
  },
  balanceLabel: { color: '#a0a0b0', fontSize: 16, marginBottom: 8 },
  balanceAmount: { color: '#f0f0f5', fontSize: 48, fontWeight: '800' },
  balanceHint: { color: '#606070', fontSize: 14, marginTop: 8 },
  sectionTitle: {
    color: '#a0a0b0', fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 24, marginBottom: 8, marginLeft: 16,
  },
  tokenRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#16161f',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },
  tokenDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  tokenInfo: { flex: 1 },
  tokenSymbol: { color: '#f0f0f5', fontSize: 15, fontWeight: '600' },
  tokenName: { color: '#606070', fontSize: 12, marginTop: 1 },
  tokenValues: { alignItems: 'flex-end' },
  tokenBalance: { color: '#a0a0b0', fontSize: 14, fontWeight: '500' },
  tokenUsd: { color: '#606070', fontSize: 12, marginTop: 1 },
});
