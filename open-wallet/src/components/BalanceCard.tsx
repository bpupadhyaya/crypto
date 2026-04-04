import { fonts } from '../utils/theme';
/**
 * Balance display — adapts to Simple and Pro mode.
 * Simple: Large total, token count
 * Pro: Detailed breakdown by token with allocation %
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { SUPPORTED_TOKENS } from '../core/tokens/registry';

export function BalanceCard() {
  const { mode, totalUsdValue, balances } = useWalletStore();

  // Filter out any malformed balances
  const validBalances = (balances ?? []).filter((b) => b?.token?.symbol);

  if (mode === 'simple') {
    return (
      <View style={styles.simpleCard}>
        <Text style={styles.simpleLabel}>Your Balance</Text>
        <Text style={styles.simpleAmount}>
          ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.simpleHint}>
          {SUPPORTED_TOKENS.length} tokens supported
        </Text>
      </View>
    );
  }

  // Pro mode
  return (
    <View style={styles.proCard}>
      <View style={styles.proHeader}>
        <Text style={styles.proLabel}>Portfolio Value</Text>
        <Text style={styles.proAmount}>
          ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
      {validBalances.length > 0 && (
        <View style={styles.proBreakdown}>
          {validBalances.map((balance) => (
            <View key={`${balance.token.chainId}-${balance.token.symbol}`} style={styles.proRow}>
              <Text style={styles.proTokenSymbol}>{balance.token.symbol}</Text>
              <Text style={styles.proTokenChain}>{balance.token.chainId}</Text>
              <Text style={styles.proTokenValue}>
                ${(balance.usdValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.proTokenAllocation}>
                {totalUsdValue > 0
                  ? ((balance.usdValue ?? 0) / totalUsdValue * 100).toFixed(1)
                  : '0.0'}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  simpleCard: {
    backgroundColor: '#16161f',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  simpleLabel: { color: '#a0a0b0', fontSize: 16, marginBottom: 8 },
  simpleAmount: { color: '#f0f0f5', fontSize: 48, fontWeight: fonts.heavy },
  simpleHint: { color: '#606070', fontSize: 14, marginTop: 8 },
  proCard: {
    backgroundColor: '#16161f',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
  },
  proHeader: { marginBottom: 16 },
  proLabel: { color: '#a0a0b0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  proAmount: { color: '#f0f0f5', fontSize: 32, fontWeight: fonts.bold, marginTop: 4 },
  proBreakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  proRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  proTokenSymbol: { color: '#f0f0f5', fontSize: 14, fontWeight: fonts.semibold, width: 60 },
  proTokenChain: { color: '#606070', fontSize: 12, width: 80 },
  proTokenValue: { color: '#a0a0b0', fontSize: 14, flex: 1, textAlign: 'right' },
  proTokenAllocation: { color: '#606070', fontSize: 12, width: 50, textAlign: 'right' },
});
