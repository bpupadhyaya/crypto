/**
 * Manage Tokens — Enable/disable tokens for your wallet.
 * User picks which tokens to show on the Home screen.
 */

import React, { useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Switch,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS, type TokenInfo } from '../core/tokens/registry';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../utils/theme';

const TokenToggle = React.memo(({
  token,
  enabled,
  onToggle,
  t,
}: {
  token: TokenInfo;
  enabled: boolean;
  onToggle: (symbol: string, value: boolean) => void;
  t: Theme & { isDark: boolean };
}) => {
  const s = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    info: { flex: 1 },
    symbol: { color: t.text.primary, fontSize: 16, fontWeight: '600' },
    name: { color: t.text.muted, fontSize: 12, marginTop: 2 },
  }), [t]);

  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: token.color }]} />
      <View style={s.info}>
        <Text style={s.symbol}>{token.symbol}</Text>
        <Text style={s.name}>{token.name} • {token.chainId}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={(v) => onToggle(token.symbol, v)}
        trackColor={{ false: '#333', true: t.accent.green + '40' }}
        thumbColor={enabled ? t.accent.green : '#666'}
      />
    </View>
  );
});

export function ManageTokensScreen({ onClose }: { onClose: () => void }) {
  const { enabledTokens, toggleToken } = useWalletStore();
  const t = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, paddingTop: 12,
    },
    title: { color: t.text.primary, fontSize: 22, fontWeight: '800' },
    done: { color: t.accent.green, fontSize: 16, fontWeight: '700' },
    subtitle: { color: t.text.muted, fontSize: 13, paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },
    list: { paddingBottom: 40 },
  }), [t]);

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
        keyExtractor={(tk) => `${tk.chainId}-${tk.symbol}`}
        renderItem={({ item }) => (
          <TokenToggle
            token={item}
            enabled={enabledTokens.includes(item.symbol)}
            onToggle={toggleToken}
            t={t}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
      />
    </SafeAreaView>
  );
}
