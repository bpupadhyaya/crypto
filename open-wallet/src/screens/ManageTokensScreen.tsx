/**
 * Manage Tokens — Enable/disable tokens for your wallet.
 * User picks which tokens to show on the Home screen.
 */

import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Switch,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';

const TokenToggle = React.memo(({
  token,
  enabled,
  onToggle,
}: {
  token: TokenInfo;
  enabled: boolean;
  onToggle: (symbol: string, value: boolean) => void;
}) => (
  <View style={s.row}>
    <View style={[s.dot, { backgroundColor: token.color }]} />
    <View style={s.info}>
      <Text style={s.symbol}>{token.symbol}</Text>
      <Text style={s.name}>{token.name} • {token.chainId}</Text>
    </View>
    <Switch
      value={enabled}
      onValueChange={(v) => onToggle(token.symbol, v)}
      trackColor={{ false: '#333', true: '#22c55e40' }}
      thumbColor={enabled ? '#22c55e' : '#666'}
    />
  </View>
));

export function ManageTokensScreen({ onClose }: { onClose: () => void }) {
  const { enabledTokens, toggleToken } = useWalletStore();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Manage Tokens</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.done}>Done</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.subtitle}>Choose which tokens to show in your wallet</Text>

      <FlatList
        data={SUPPORTED_TOKENS}
        keyExtractor={(t) => `${t.chainId}-${t.symbol}`}
        renderItem={({ item }) => (
          <TokenToggle
            token={item}
            enabled={enabledTokens.includes(item.symbol)}
            onToggle={toggleToken}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 12,
  },
  title: { color: '#f0f0f5', fontSize: 22, fontWeight: '800' },
  done: { color: '#22c55e', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#606070', fontSize: 13, paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  info: { flex: 1 },
  symbol: { color: '#f0f0f5', fontSize: 16, fontWeight: '600' },
  name: { color: '#606070', fontSize: 12, marginTop: 2 },
});
